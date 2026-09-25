'use strict';
/* ============ constants ============ */
const TS = 16;          // pixels per tile
const CH = 16;          // tiles per chunk side
const PS = 8;           // tiles per land parcel side
const DAY = 144, SDAYS = 4;
const OUT = '#2b1b2b';

/* ============ helpers ============ */
const $ = id => document.getElementById(id);
const rand = (a, b) => a + Math.random() * (b - a);
const randi = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const sumObj = o => { let s = 0; if (o) for (const k in o) s += o[k]; return s; };
function mulberry(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/* fast integer hash → [0,1) */
function hashi(x, y, s) {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 982451653)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
const hash2 = (x, y, s) => mulberry((Math.imul(x, 73856093) ^ Math.imul(y, 19349663) ^ Math.imul(s || 0, 83492791)) | 0);
function weighted(list, rng) {
  let s = 0; for (const e of list) s += e[1];
  let r = (rng ? rng() : Math.random()) * s;
  for (const e of list) { r -= e[1]; if (r <= 0) return e[0]; }
  return list[list.length - 1][0];
}
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
  raw(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  put(k, s) { try { localStorage.setItem(k, s); return true; } catch (e) { return false; } },
  del(k) { try { localStorage.removeItem(k); } catch (e) { /* blocked */ } }
};
function hex2rgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function mk(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, w | 0); c.height = Math.max(1, h | 0);
  const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
  return [c, g];
}
function disc(g, cx, cy, r) {
  r = Math.round(r); cx = Math.round(cx); cy = Math.round(cy);
  for (let dy = -r; dy <= r; dy++) {
    const hw = Math.floor(Math.sqrt(r * r - dy * dy) + 0.4);
    g.fillRect(cx - hw, cy + dy, hw * 2 + 1, 1);
  }
}
function R(g, c, x, y, w, h) { g.fillStyle = c; g.fillRect(x, y, w, h); }
/* union of rects with a 1px outline around the whole silhouette */
function shape(g, parts, ol) {
  g.fillStyle = ol || OUT;
  for (const p of parts) g.fillRect(p[0] - 1, p[1] - 1, p[2] + 2, p[3] + 2);
  for (const p of parts) { g.fillStyle = p[4]; g.fillRect(p[0], p[1], p[2], p[3]); }
}
function odisc(g, cx, cy, r, col, ol) { g.fillStyle = ol || OUT; disc(g, cx, cy, r + 1); g.fillStyle = col; disc(g, cx, cy, r); }

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const MASKS = [];
for (let lv = 0; lv <= 16; lv++) {
  const [c, g] = mk(4, 4); g.fillStyle = '#000';
  for (let i = 0; i < 16; i++) if (BAYER[i] < lv) g.fillRect(i % 4, i >> 2, 1, 1);
  MASKS.push(c);
}

/* ============ palette & sprite builder (Kočičí sklizeň style) ============ */
const PAL = {
  r: '#e8484e', R: '#a82e44', h: '#fff3dc', g: '#72c850', G: '#3a8a44', l: '#b4ec7a',
  y: '#ffd23f', Y: '#e8962a', b: '#a8693e', B: '#6b4128', t: '#d8955a', c: '#f6e3c0', C: '#d6ae84',
  w: '#ffffff', W: '#d6e0ee', k: '#8a92aa', K: '#5d6480', p: '#ff9ec0', P: '#e0608e',
  u: '#6ab4f0', U: '#3a74c8', v: '#b89ae8', V: '#8a6ac8', n: '#f79a3a', N: '#cc5f22',
  m: '#8fe0c8', M: '#5cbca0', d: '#2b1b2b', e: '#7a3a2a', a: '#d09050', A: '#a86a34', j: '#c47a3a',
  s: '#c4cad8', S: '#9aa0b4', o: '#e8c060', O: '#b8862a', x: '#3e3852', z: '#6a6480', q: '#7ad0a0', Q: '#3a9a78'
};
function buildSprite(rows, pal, outline) {
  const h = rows.length, w = Math.max(...rows.map(r => r.length));
  const o = outline ? 1 : 0;
  const [c, g] = mk(w + o * 2, h + o * 2);
  const on = (x, y) => y >= 0 && y < h && x >= 0 && x < w && rows[y][x] !== undefined && rows[y][x] !== '.';
  if (outline) {
    g.fillStyle = outline;
    for (let y = -1; y <= h; y++) for (let x = -1; x <= w; x++) {
      if (on(x, y)) continue;
      if (on(x - 1, y) || on(x + 1, y) || on(x, y - 1) || on(x, y + 1)) g.fillRect(x + 1, y + 1, 1, 1);
    }
  }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const ch = rows[y][x];
    if (ch === undefined || ch === '.') continue;
    g.fillStyle = pal[ch] || '#ff00ff';
    g.fillRect(x + o, y + o, 1, 1);
  }
  return { c, w: w + o * 2, h: h + o * 2 };
}

/* tiny 3x5 bitmap font for numbers on the canvas */
const FONT = {
  '0': ['111', '101', '101', '101', '111'], '1': ['010', '110', '010', '010', '111'],
  '2': ['111', '001', '111', '100', '111'], '3': ['111', '001', '111', '001', '111'],
  '4': ['101', '101', '111', '001', '001'], '5': ['111', '100', '111', '001', '111'],
  '6': ['111', '100', '111', '101', '111'], '7': ['111', '001', '010', '010', '010'],
  '8': ['111', '101', '111', '101', '111'], '9': ['111', '101', '111', '001', '111'],
  '+': ['000', '010', '111', '010', '000'], 'x': ['000', '101', '010', '101', '000'],
  '!': ['010', '010', '010', '000', '010'], 'z': ['000', '111', '001', '010', '111'],
  'Z': ['111', '001', '010', '100', '111'], '-': ['000', '000', '111', '000', '000'],
  '?': ['111', '001', '011', '000', '010'], 'k': ['100', '101', '110', '101', '101'],
  '.': ['000', '000', '000', '000', '010']
};
function drawNum(g, s, x, y, col, sc) {
  sc = sc || 1; s = String(s);
  for (let pass = 0; pass < 2; pass++) {
    g.fillStyle = pass ? col : OUT;
    for (let i = 0; i < s.length; i++) {
      const gl = FONT[s[i]]; if (!gl) continue;
      for (let gy = 0; gy < 5; gy++) for (let gx = 0; gx < 3; gx++) {
        if (gl[gy][gx] !== '1') continue;
        const px = x + i * 4 * sc + gx * sc, py = y + gy * sc;
        if (pass) g.fillRect(px, py, sc, sc); else g.fillRect(px - 1, py - 1, sc + 2, sc + 2);
      }
    }
  }
}
const numW = (s, sc) => String(s).length * 4 * (sc || 1) - (sc || 1);
const shortNum = n => n >= 10000 ? Math.round(n / 1000) + 'k' : n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(Math.floor(n));

/* ============ value noise ============ */
function vnoise(x, y, s) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hashi(xi, yi, s), b = hashi(xi + 1, yi, s), c = hashi(xi, yi + 1, s), d = hashi(xi + 1, yi + 1, s);
  return (a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v) * 2 - 1;
}
function fbm(x, y, s, oct) {
  let t = 0, amp = 0.5, f = 1, n = 0;
  for (let i = 0; i < oct; i++) { t += vnoise(x * f, y * f, s + i * 131) * amp; n += amp; amp *= 0.5; f *= 2.03; }
  return t / n;
}

/* ============ LZW compression (UTF-16 safe, avoids surrogates) ============ */
const LZ = (() => {
  const MAXC = 0xF7FF;
  const enc = c => String.fromCharCode(c < 0xD800 ? c : c + 0x800);
  const dec = ch => { const c = ch.charCodeAt(0); return c < 0xD800 ? c : c - 0x800; };
  function compress(str) {
    const bytes = new TextEncoder().encode(str);
    let dict = new Map(), next = 256, w = '';
    const out = [];
    for (let i = 0; i < bytes.length; i++) {
      const c = String.fromCharCode(bytes[i]), wc = w + c;
      if (wc.length === 1 || dict.has(wc)) { w = wc; continue; }
      out.push(enc(w.length === 1 ? w.charCodeAt(0) : dict.get(w)));
      if (next < MAXC) dict.set(wc, next++); else { dict = new Map(); next = 256; }
      w = c;
    }
    if (w) out.push(enc(w.length === 1 ? w.charCodeAt(0) : dict.get(w)));
    return out.join('');
  }
  function decompress(s) {
    if (!s) return '';
    let dict = [], next = 256;
    const get = c => (c < 256 ? String.fromCharCode(c) : dict[c]);
    let w = get(dec(s[0]));
    const parts = [w];
    for (let i = 1; i < s.length; i++) {
      const c = dec(s[i]);
      let entry;
      if (c < 256 || (c < next && dict[c] !== undefined)) entry = get(c);
      else if (c === next) entry = w + w[0];
      else throw new Error('LZ: poškozená data');
      parts.push(entry);
      if (next < MAXC) dict[next++] = w + entry[0]; else { dict = []; next = 256; }
      w = entry;
    }
    const bin = parts.join(''), bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }
  const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  function toText(s) { let o = ''; for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i); o += B64[(c >> 12) & 63] + B64[(c >> 6) & 63] + B64[c & 63]; } return o; }
  function fromText(t) { t = t.replace(/[^A-Za-z0-9+/]/g, ''); let o = ''; for (let i = 0; i + 2 < t.length; i += 3) o += String.fromCharCode((B64.indexOf(t[i]) << 12) | (B64.indexOf(t[i + 1]) << 6) | B64.indexOf(t[i + 2])); return o; }
  return { compress, decompress, toText, fromText };
})();
