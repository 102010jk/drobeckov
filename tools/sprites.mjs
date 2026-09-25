// Sprite workshop — dev tool, not loaded by the game.
// Buildings can be drawn in code (js/art/*.js) or as PNG files in assets/budovy/. A PNG wins when it exists.
//
//   node tools/sprites.mjs export [typ…]        code → PNG: renders buildings from code into assets/budovy/ (needs Playwright + Chromium)
//   node tools/sprites.mjs txt <png> [out.txt]   PNG → text grid (one character per pixel, palette on top) — easy to edit by hand
//   node tools/sprites.mjs png <txt> [out.png]   text grid → PNG
//   node tools/sprites.mjs preview <png|txt…> [--scale N] [--out file.png]   enlarged preview on a checkerboard and on grass
//   node tools/sprites.mjs code <typ>            back to code: deletes the building's PNGs, the game draws it from code again
//   node tools/sprites.mjs manifest              rebuilds assets/manifest.json from the files in assets/budovy/
//
// File names: <typ>[.leto|.podzim|.zima][.noc][.v<varianta>].png — spring, day and the first variant are the defaults.
// Every frame has the size of the in-game sprite cache: (w·16 + 32) × (h·16 + 30); the footprint starts at (16, 24).
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync, unlinkSync } from 'fs';
import { deflateSync, inflateSync } from 'zlib';
import { join, dirname, basename, extname, normalize } from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { createRequire } from 'module';
import { execSync } from 'child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIR = join(ROOT, 'assets', 'budovy');
const SEASONS = ['', 'leto', 'podzim', 'zima'];

/* ---------------- PNG codec (no dependencies) ---------------- */
const CRC = new Int32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c; });
const crc32 = buf => { let c = -1; for (const b of buf) c = CRC[(c ^ b) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; };
function chunk(type, data) {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0); out.write(type, 4, 'ascii'); data.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
}
export function encodePNG(w, h, rgba) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (w * 4 + 1)] = 0; Buffer.from(rgba.buffer, rgba.byteOffset + y * w * 4, w * 4).copy(raw, y * (w * 4 + 1) + 1); }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}
export function decodePNG(buf) {
  let p = 8, w = 0, h = 0, depth = 0, type = 0, inter = 0, plte = null, trns = null; const idat = [];
  while (p < buf.length) {
    const len = buf.readUInt32BE(p), t = buf.toString('ascii', p + 4, p + 8), d = buf.subarray(p + 8, p + 8 + len); p += 12 + len;
    if (t === 'IHDR') { w = d.readUInt32BE(0); h = d.readUInt32BE(4); depth = d[8]; type = d[9]; inter = d[12]; }
    else if (t === 'PLTE') plte = d; else if (t === 'tRNS') trns = d; else if (t === 'IDAT') idat.push(d); else if (t === 'IEND') break;
  }
  if (inter) throw new Error('prokládané PNG není podporované');
  const ch = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[type], bpp = Math.max(1, (ch * depth) >> 3), stride = (w * ch * depth + 7) >> 3;
  const data = inflateSync(Buffer.concat(idat)), px = Buffer.alloc(stride * h);
  for (let y = 0; y < h; y++) {
    const f = data[y * (stride + 1)], src = data.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1)), row = px.subarray(y * stride, (y + 1) * stride), up = y ? px.subarray((y - 1) * stride, y * stride) : null;
    for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? row[i - bpp] : 0, b = up ? up[i] : 0, c = up && i >= bpp ? up[i - bpp] : 0;
      let v = src[i];
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) { const pp = a + b - c, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      row[i] = v & 255;
    }
  }
  const out = new Uint8Array(w * h * 4);
  const sample = (y, i) => { if (depth === 8) return px[y * stride + i]; if (depth === 16) return px[y * stride + i * 2]; const per = 8 / depth, byte = px[y * stride + Math.floor(i / per)], sh = 8 - depth * (i % per + 1); return (byte >> sh) & ((1 << depth) - 1); };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const o = (y * w + x) * 4;
    if (type === 3) { const k = sample(y, x); out[o] = plte[k * 3]; out[o + 1] = plte[k * 3 + 1]; out[o + 2] = plte[k * 3 + 2]; out[o + 3] = trns && k < trns.length ? trns[k] : 255; continue; }
    const s = i => sample(y, x * ch + i), sc = v => depth < 8 ? Math.round(v * 255 / ((1 << depth) - 1)) : v;
    if (ch >= 3) { out[o] = s(0); out[o + 1] = s(1); out[o + 2] = s(2); out[o + 3] = ch === 4 ? s(3) : 255; }
    else { const g = sc(s(0)); out[o] = out[o + 1] = out[o + 2] = g; out[o + 3] = ch === 2 ? s(1) : 255; }
  }
  return { w, h, rgba: out };
}

/* ---------------- text grid ---------------- */
const CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@$%&*+=?!<>~^:;,_-/|()[]{}';
const hex = (r, g, b, a) => '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('') + (a === 255 ? '' : a.toString(16).padStart(2, '0'));
export function toText(img, name) {
  const { w, h, rgba } = img, pal = new Map(), rows = [];
  for (let y = 0; y < h; y++) {
    let row = '';
    for (let x = 0; x < w; x++) {
      const o = (y * w + x) * 4;
      if (!rgba[o + 3]) { row += '.'; continue; }
      const k = hex(rgba[o], rgba[o + 1], rgba[o + 2], rgba[o + 3]);
      if (!pal.has(k)) { if (pal.size >= CHARS.length) throw new Error('moc barev (max ' + CHARS.length + ')'); pal.set(k, CHARS[pal.size]); }
      row += pal.get(k);
    }
    rows.push(row);
  }
  return `# ${name || 'sprite'} ${w}x${h} — jeden znak = jeden pixel, '.' = průhledné\n` + [...pal].map(([k, c]) => `${c} ${k}`).join('\n') + '\n---\n' + rows.join('\n') + '\n';
}
export function fromText(txt) {
  const lines = txt.replace(/\r/g, '').split('\n'), pal = { '.': [0, 0, 0, 0] };
  let i = 0;
  for (; i < lines.length && lines[i] !== '---'; i++) {
    const m = lines[i].match(/^(\S)\s+#([0-9a-fA-F]{6})([0-9a-fA-F]{2})?\s*$/);
    if (m) { const n = parseInt(m[2], 16); pal[m[1]] = [n >> 16, (n >> 8) & 255, n & 255, m[3] ? parseInt(m[3], 16) : 255]; }
  }
  const rows = lines.slice(i + 1).filter(l => l.length);
  const w = Math.max(...rows.map(r => r.length)), h = rows.length, rgba = new Uint8Array(w * h * 4);
  rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) { const c = pal[r[x]]; if (!c) throw new Error(`neznámý znak „${r[x]}“ na řádku ${y + 1}`); rgba.set(c, (y * w + x) * 4); } });
  return { w, h, rgba };
}
const load = f => extname(f) === '.txt' ? fromText(readFileSync(f, 'utf8')) : decodePNG(readFileSync(f));

/* ---------------- preview ---------------- */
function preview(files, scale, out) {
  const imgs = files.map(load), gap = 4 * scale, W = imgs.reduce((a, m) => a + m.w * scale * 2 + gap * 3, gap), H = Math.max(...imgs.map(m => m.h)) * scale + gap * 2;
  const rgba = new Uint8Array(W * H * 4);
  for (let i = 0; i < W * H; i++) rgba.set([43, 27, 43, 255], i * 4);
  let ox = gap;
  for (const m of imgs) {
    for (const bg of ['check', 'grass']) {
      for (let y = 0; y < m.h * scale; y++) for (let x = 0; x < m.w * scale; x++) {
        const sx = (x / scale) | 0, sy = (y / scale) | 0, o = (sy * m.w + sx) * 4, a = m.rgba[o + 3] / 255;
        const base = bg === 'grass' ? ((sx + sy) % 7 ? [98, 178, 82] : [138, 208, 106]) : (((sx >> 1) + (sy >> 1)) % 2 ? [232, 220, 239] : [210, 196, 222]);
        const grid = scale >= 6 && (x % scale === 0 || y % scale === 0);
        const d = ((gap + y) * W + ox + x) * 4;
        for (let c = 0; c < 3; c++) rgba[d + c] = Math.round(m.rgba[o + c] * a + base[c] * (1 - a) * (grid ? 0.92 : 1));
        rgba[d + 3] = 255;
      }
      ox += m.w * scale + gap;
    }
    ox += gap;
  }
  writeFileSync(out, encodePNG(W, H, rgba));
  console.log(`náhled: ${out} (${W}×${H})`);
}

/* ---------------- manifest ---------------- */
export function manifest() {
  mkdirSync(DIR, { recursive: true });
  const m = {};
  for (const f of readdirSync(DIR).filter(f => f.endsWith('.png')).sort()) {
    const parts = f.slice(0, -4).split('.'), type = parts.shift(), e = { f };
    for (const p of parts) { const s = SEASONS.indexOf(p); if (s > 0) e.s = s; else if (p === 'noc') e.n = 1; else if (p[0] === 'v') e.v = p.slice(1); }
    (m[type] = m[type] || []).push(e);
  }
  const spr = [];
  for (const d of readdirSync(join(ROOT, 'assets'), { withFileTypes: true })) if (d.isDirectory() && d.name !== 'budovy') for (const f of readdirSync(join(ROOT, 'assets', d.name)).sort()) if (f.endsWith('.png')) spr.push(d.name + '/' + f.slice(0, -4));
  if (spr.length) m._sprites = spr;
  writeFileSync(join(ROOT, 'assets', 'manifest.json'), JSON.stringify(m, null, 0).replace(/\],"/g, '],\n"') + '\n');
  console.log(`manifest: ${Object.keys(m).length} staveb, ${Object.values(m).flat().length} obrázků`);
}

/* ---------------- export from code (renders in Chromium) ---------------- */
function serve() {
  const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.png': 'image/png' };
  return new Promise(res => {
    const srv = createServer((req, r) => {
      let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
      const f = normalize(join(ROOT, p));
      if (!f.startsWith(ROOT) || p.startsWith('/assets/')) { r.writeHead(404).end(); return; }   // render from code only
      try { r.writeHead(200, { 'content-type': types[extname(f)] || 'application/octet-stream' }).end(readFileSync(f)); } catch { r.writeHead(404).end(); }
    }).listen(0, () => res(srv));
  });
}
async function exportCode(only) {
  let pw; try { pw = createRequire(import.meta.url)('playwright'); } catch { pw = createRequire(join(execSync('npm root -g').toString().trim(), 'x'))('playwright'); }
  const srv = await serve(), browser = await pw.chromium.launch(), page = await browser.newPage();
  await page.goto(`http://localhost:${srv.address().port}/`); await page.waitForTimeout(500);
  const res = await page.evaluate(only => {
    const IDV = { domek: 4, kvetiny: 4 }, out = [], skipped = [];
    const fake = (type, extra) => { const d = B[type]; return Object.assign({ type, id: 1, w: d.w || 1, h: d.h || 1, built: true, st: 2, crop: 'psenice', g: 1, inp: {}, out: {}, workers: [], mature: true, active: true }, extra); };
    const render = (b, S, lit) => { const [c, g] = mk(b.w * TS + PADX * 2, b.h * TS + PADY + 6); DRAW[b.type](g, PADX, PADY, b, S, !!lit); return c; };
    const px = c => c.getContext('2d').getImageData(0, 0, c.width, c.height).data.join(',');
    for (const type in DRAW) {
      const d = B[type]; if (!d || d.ground || d.tree || d.tool || (only.length && !only.includes(type))) continue;
      // state that changes the picture (crops, wood piles, rocket stages…) stays in code
      const base = px(render(fake(type), 0, 0));
      const probes = [{ lvl: 3 }, { st: 1, g: 0.5 }, { mature: false, age: 0 }, { stage: 3 }, { papers: 3 }, { conL: 1, conR: 1 }, { out: { drevo: 6, jablka: 4 } }, { inp: { psenice: 4 } }, { pillows: 2 }, { active: false }, { workers: [1, 2] }];
      const dyn = probes.some(p => px(render(fake(type, p), 0, 0)) !== base) || px(render(fake(type), 0, 0)) !== base;
      if (dyn && !IDV[type]) { skipped.push(type); continue; }
      // which seasons / night / variants change the picture — only those get their own file
      const vars = IDV[type] ? [...Array(IDV[type]).keys()] : [''], nights = LIT[type] ? [0, 1] : [0];
      const bOf = v => fake(type, v !== '' ? { id: v || 4 } : {}), P = {};
      for (const v of vars) for (const n of nights) for (const s of [0, 1, 2, 3]) P[v + '|' + n + '|' + s] = render(bOf(v), s, n);
      const pix = {}; for (const k in P) pix[k] = px(P[k]);
      const seas = [0, 1, 2, 3].filter(s => !s || vars.some(v => nights.some(n => pix[v + '|' + n + '|' + s] !== pix[v + '|' + n + '|0'])));
      const nts = nights.filter(n => !n || vars.some(v => seas.some(s => pix[v + '|1|' + s] !== pix[v + '|0|' + s])));
      for (const v of vars) for (const n of nts) for (const s of seas)
        out.push({ type, name: type + (s ? '.' + ['', 'leto', 'podzim', 'zima'][s] : '') + (n ? '.noc' : '') + (v !== '' && v !== 0 ? '.v' + v : '') + '.png', url: P[v + '|' + n + '|' + s].toDataURL('image/png') });
    }
    return { out, skipped };
  }, only);
  await browser.close(); srv.close();
  mkdirSync(DIR, { recursive: true });
  const seen = new Set();
  for (const o of res.out) { if (seen.has(o.name)) continue; seen.add(o.name); writeFileSync(join(DIR, o.name), Buffer.from(o.url.split(',')[1], 'base64')); }
  console.log(`export: ${seen.size} obrázků z ${new Set(res.out.map(o => o.type)).size} staveb`);
  if (res.skipped.length) console.log(`zůstává v kódu (obrázek se mění podle stavu): ${res.skipped.join(', ')}`);
  manifest();
}

/* ---------------- CLI ---------------- */
const [cmd, ...args] = process.argv[1] && normalize(process.argv[1]) === fileURLToPath(import.meta.url) ? process.argv.slice(2) : ['lib'];
const opt = (k, d) => { const i = args.indexOf(k); if (i < 0) return d; const v = args[i + 1]; args.splice(i, 2); return v; };
if (cmd === 'export') await exportCode(args);
else if (cmd === 'txt') { const out = args[1] || args[0].replace(/\.png$/, '.txt'); writeFileSync(out, toText(load(args[0]), basename(args[0]))); console.log('text: ' + out); }
else if (cmd === 'png') { const img = load(args[0]), out = args[1] || args[0].replace(/\.txt$/, '.png'); writeFileSync(out, encodePNG(img.w, img.h, img.rgba)); console.log(`png: ${out} (${img.w}×${img.h})`); if (normalize(dirname(out)) === normalize(DIR)) manifest(); }
else if (cmd === 'preview') { const scale = +opt('--scale', 6), out = opt('--out', 'nahled.png'); preview(args, scale, out); }
else if (cmd === 'code') { let n = 0; for (const f of existsSync(DIR) ? readdirSync(DIR) : []) if (f.split('.')[0] === args[0]) { unlinkSync(join(DIR, f)); n++; } console.log(`${args[0]}: smazáno ${n} obrázků — kreslí se zase kódem`); manifest(); }
else if (cmd === 'manifest') manifest();
else if (cmd !== 'lib') console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(0, 13).join('\n'));
