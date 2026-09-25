'use strict';
/* ============ infinite chunked world ============
   Tiles are generated lazily from the world seed; only player changes are saved (G.mods). */
const GR = ['grass', 'water', 'path', 'bridge', 'deep', 'sand', 'rock', 'road'];
const TREE_K = ['round', 'pine', 'birch'];
let CHUNKS = new Map(), lastCK = -1, lastCh = null, GEN = null;
const BIDX = new Map();              // chunk key -> Set of building ids overlapping it
const ckey = (cx, cy) => (cx + 32768) * 65536 + (cy + 32768);

/* ---------- generator ---------- */
function eRaw(x, y, s) { return fbm(x / 72, y / 72, s, 5) * 0.8 + fbm(x / 430, y / 430, s + 7, 3) * 1.1; }
function mRaw(x, y, s) { return fbm(x / 55 + 300, y / 55 - 200, s + 17, 3); }
function rRaw(x, y, s) { return Math.abs(fbm(x / 120 - 90, y / 120 + 40, s + 29, 3)); }
function lRaw(x, y, s) { return fbm(x / 26 + 500, y / 26, s + 41, 2); }
function quant(arr, q) { return arr[Math.min(arr.length - 1, Math.floor(q * arr.length))]; }
function initGen(seed) {
  const rng = mulberry(seed * 7 + 1), E = [], M = [], Rv = [], L = [];
  for (let i = 0; i < 6000; i++) {
    const x = Math.floor((rng() - 0.5) * 6000), y = Math.floor((rng() - 0.5) * 6000);
    E.push(eRaw(x, y, seed)); M.push(mRaw(x, y, seed)); Rv.push(rRaw(x, y, seed)); L.push(lRaw(x, y, seed));
  }
  E.sort((a, b) => a - b); M.sort((a, b) => a - b); Rv.sort((a, b) => a - b); L.sort((a, b) => a - b);
  GEN = {
    seed, deep: quant(E, 0.17), sea: quant(E, 0.27), beach: quant(E, 0.30), hills: quant(E, 0.83), mount: quant(E, 0.94),
    forest: quant(M, 0.58), birch: quant(M, 0.80), wet: quant(M, 0.93), river: quant(Rv, 0.022), lake: quant(L, 0.945)
  };
}
function genTile(x, y) {
  const s = GEN.seed, e = eRaw(x, y, s);
  const t = { gr: 'grass', bio: 'meadow', tree: null, ore: null, b: 0, poi: null };
  const h = hashi(x, y, s + 3);
  if (e < GEN.sea) { t.gr = e < GEN.deep ? 'deep' : 'water'; t.bio = 'sea'; return t; }
  if (e < GEN.beach) { t.gr = 'sand'; t.bio = 'beach'; t.ore = 'pisek'; return t; }
  const m = mRaw(x, y, s);
  if (e < GEN.hills && rRaw(x, y, s) < GEN.river) { t.gr = 'water'; t.bio = 'river'; return t; }
  if (e < GEN.hills - 0.05 && lRaw(x, y, s) > GEN.lake) { t.gr = 'water'; t.bio = 'lake'; return t; }
  if (e >= GEN.hills) {
    t.gr = 'rock'; t.bio = e >= GEN.mount ? 'mountain' : 'hills'; t.ore = 'kamen';
    const on = fbm(x / 9, y / 9, s + 50, 2);
    if (on > 0.3) {
      const tn = (vnoise(x / 38, y / 38, s + 60) + 1) / 2;
      let ore = tn < 0.3 ? 'uhli' : tn < 0.55 ? 'zelezo' : tn < 0.72 ? 'med' : tn < 0.84 ? 'bauxit' : tn < 0.94 ? 'cin' : 'zelezo';
      if (t.bio === 'mountain' && on > 0.45 && hashi(x >> 2, y >> 2, s + 61) < 0.35) ore = 'zlato';
      t.ore = ore;
    }
    if (h < (t.bio === 'mountain' ? 0.08 : 0.18)) t.tree = { g: 1, v: hashi(x, y, s + 4), k: 'pine' };
    return t;
  }
  if (m > GEN.wet && e < (GEN.beach + GEN.hills) / 2) {
    t.bio = 'wetland';
    if (hashi(x >> 1, y >> 1, s + 8) < 0.12) { t.gr = 'water'; return t; }
    if (h < 0.12) t.tree = { g: 1, v: hashi(x, y, s + 4), k: 'round' };
    if (fbm(x / 12, y / 12, s + 70, 2) > 0.25) t.ore = 'hlina';
    return t;
  }
  if (m > GEN.birch) { t.bio = 'birch'; if (h < 0.42) t.tree = { g: 1, v: hashi(x, y, s + 4), k: hashi(x, y, s + 5) < 0.8 ? 'birch' : 'round' }; }
  else if (m > GEN.forest) { t.bio = 'forest'; if (h < 0.5) t.tree = { g: 1, v: hashi(x, y, s + 4), k: (e > (GEN.beach + GEN.hills) * 0.55 || hashi(x, y, s + 5) < 0.3) ? 'pine' : 'round' }; }
  else if (h < 0.05) t.tree = { g: 1, v: hashi(x, y, s + 4), k: 'round' };
  // clay near water
  if (!t.tree && fbm(x / 12, y / 12, s + 70, 2) > 0.42) t.ore = 'hlina';
  return t;
}
/* ---------- points of interest (deterministic, one chance per 32×32 region) ---------- */
function poiForRegion(rx, ry) {
  const s = GEN.seed;
  if (hashi(rx, ry, s + 900) > 0.42) return null;
  const x = rx * 32 + 4 + Math.floor(hashi(rx, ry, s + 901) * 24), y = ry * 32 + 4 + Math.floor(hashi(rx, ry, s + 902) * 24);
  if (G && G.origin) { const ox = G.origin[0] * PS, oy = G.origin[1] * PS; if (x >= ox - 8 && x < ox + START_PW * PS + 8 && y >= oy - 8 && y < oy + START_PH * PS + 8) return null; }
  const tt = genTile(x, y);
  if (tt.gr === 'water' || tt.gr === 'deep') return null;
  const r = hashi(rx, ry, s + 903);
  let type;
  const far = G && G.origin ? Math.hypot(x / PS - G.origin[0], y / PS - G.origin[1]) : 0;
  if (far > 12 && r < 0.1) type = 'krater';
  else if (tt.bio === 'beach') type = r < 0.6 ? 'majak' : 'poklad';
  else if (tt.bio === 'hills' || tt.bio === 'mountain') type = r < 0.5 ? 'dul' : r < 0.8 ? 'hvezdarna' : 'poklad';
  else if (tt.bio === 'forest' || tt.bio === 'birch') type = r < 0.4 ? 'studanka' : r < 0.7 ? 'poklad' : 'vesnice';
  else type = r < 0.35 ? 'mlyn' : r < 0.7 ? 'poklad' : 'vesnice';
  return { id: rx + ',' + ry, x, y, type };
}
/* ---------- chunks ---------- */
function genChunk(cx, cy) {
  const t = new Array(CH * CH);
  const x0 = cx * CH, y0 = cy * CH;
  for (let j = 0; j < CH; j++) for (let i = 0; i < CH; i++) t[j * CH + i] = genTile(x0 + i, y0 + j);
  const ch = { cx, cy, t, dirty: true, seen: 0 };
  // points of interest whose tile falls in this chunk
  for (let ry = Math.floor(y0 / 32); ry <= Math.floor((y0 + CH - 1) / 32); ry++) for (let rx = Math.floor(x0 / 32); rx <= Math.floor((x0 + CH - 1) / 32); rx++) {
    const p = poiForRegion(rx, ry);
    if (p && p.x >= x0 && p.x < x0 + CH && p.y >= y0 && p.y < y0 + CH) { const tt = t[(p.y - y0) * CH + (p.x - x0)]; tt.poi = p; tt.tree = null; }
  }
  // saved player changes
  const mods = G && G.mods[cx + ',' + cy];
  if (mods) for (const i in mods) {
    const m = mods[i], tt = t[i];
    tt.gr = GR[m[0]] || 'grass';
    tt.tree = m[1] ? { g: m[1][0], v: m[1][1], k: TREE_K[m[1][2]] || 'round', cut: !!m[1][3], planted: !!m[1][4] } : null;
  }
  // buildings covering this chunk
  const ids = BIDX.get(ckey(cx, cy));
  if (ids) for (const id of ids) { const b = G.bld[id]; if (b) stampBuilding(b, t, x0, y0); }
  CHUNKS.set(ckey(cx, cy), ch);
  return ch;
}
function stampBuilding(b, t, x0, y0) {
  for (let j = 0; j < b.h; j++) for (let i = 0; i < b.w; i++) {
    const x = b.x + i - x0, y = b.y + j - y0;
    if (x >= 0 && y >= 0 && x < CH && y < CH) t[y * CH + x].b = b.id;
  }
}
function chunkAt(cx, cy) {
  const k = ckey(cx, cy);
  if (k === lastCK) return lastCh;
  let ch = CHUNKS.get(k);
  if (!ch) ch = genChunk(cx, cy);
  lastCK = k; lastCh = ch;
  return ch;
}
function tile(x, y) { return chunkAt(x >> 4, y >> 4).t[((y & 15) << 4) | (x & 15)]; }
/* record a tile change so it survives save/load, and invalidate cached terrain */
function markMod(x, y) {
  const t = tile(x, y), cx = x >> 4, cy = y >> 4, key = cx + ',' + cy, i = ((y & 15) << 4) | (x & 15);
  const m = G.mods[key] || (G.mods[key] = {});
  const tr = t.tree;
  m[i] = [GR.indexOf(t.gr), tr ? [+tr.g.toFixed(3), +tr.v.toFixed(3), Math.max(0, TREE_K.indexOf(tr.k || 'round')), tr.cut ? 1 : 0, tr.planted ? 1 : 0] : 0];
  chunkAt(cx, cy).dirty = true;
  if (tr && tr.g < 1 && !G.growing.some(p => p[0] === x && p[1] === y)) G.growing.push([x, y]);
}
function bidxAdd(b) {
  for (let cy = b.y >> 4; cy <= (b.y + b.h - 1) >> 4; cy++) for (let cx = b.x >> 4; cx <= (b.x + b.w - 1) >> 4; cx++) {
    const k = ckey(cx, cy); let s = BIDX.get(k); if (!s) BIDX.set(k, s = new Set()); s.add(b.id);
  }
}
function bidxDel(b) { for (const s of BIDX.values()) s.delete(b.id); }
function resetWorldCache() { CHUNKS = new Map(); lastCK = -1; lastCh = null; BIDX.clear(); }
/* drop far-away chunks we can regenerate (player changes live in G.mods) */
function evictChunks(ccx, ccy) {
  if (CHUNKS.size < 700) return;
  for (const [k, ch] of CHUNKS) {
    if (Math.abs(ch.cx - ccx) + Math.abs(ch.cy - ccy) < 10) continue;
    if (ownsAnyInChunk(ch.cx, ch.cy)) continue;
    CHUNKS.delete(k); if (typeof dropChunkCache === 'function') dropChunkCache(k);
  }
  lastCK = -1;
}

/* ---------- choosing a cozy start ---------- */
function scoreStart(px, py) {
  const x0 = px * PS, y0 = py * PS, W = START_PW * PS, H = START_PH * PS;
  let land = 0, meadow = 0, n = 0, trees = 0;
  for (let y = y0; y < y0 + H; y += 2) for (let x = x0; x < x0 + W; x += 2) {
    const t = genTile(x, y); n++;
    if (t.gr === 'grass') land++;
    if (t.bio === 'meadow') meadow++;
    if (t.tree) trees++;
  }
  if (land / n < 0.86 || meadow / n < 0.45) return -1;
  let sc = meadow / n * 3 - trees / n;
  let water = false, forest = 0, hills = false;
  for (let y = y0 - 16; y < y0 + H + 16; y += 4) for (let x = x0 - 16; x < x0 + W + 16; x += 4) {
    const t = genTile(x, y);
    if (t.bio === 'river' || t.bio === 'lake') water = true;
    if (t.bio === 'forest' || t.bio === 'birch') forest++;
  }
  for (let y = y0 - 40; y < y0 + H + 40; y += 8) for (let x = x0 - 40; x < x0 + W + 40; x += 8) if (genTile(x, y).gr === 'rock') { hills = true; break; }
  if (water) sc += 3;
  sc += Math.min(2, forest / 20);
  if (hills) sc += 2;
  // sea should be a journey away, not next door
  let sea = 99;
  for (let a = 0; a < 16; a++) {
    const dx = Math.cos(a / 16 * Math.PI * 2), dy = Math.sin(a / 16 * Math.PI * 2);
    for (let d = 3; d <= 18; d++) { const t = genTile(Math.floor(x0 + W / 2 + dx * d * PS), Math.floor(y0 + H / 2 + dy * d * PS)); if (t.bio === 'sea') { sea = Math.min(sea, d); break; } }
  }
  if (sea >= 6 && sea <= 13) sc += 4; else if (sea < 6) sc -= 2; else if (sea < 99) sc += 1;
  return sc;
}
function findStart() {
  let best = null, bs = -1;
  for (let r = 0; r <= 32; r += 2) for (let py = -r; py <= r; py += 2) for (let px = -r; px <= r; px += 2) {
    if (Math.max(Math.abs(px), Math.abs(py)) !== r) continue;
    const s = scoreStart(px, py);
    if (s > bs) { bs = s; best = [px, py]; }
    if (bs >= 11) return best;
  }
  return best || [0, 0];
}
