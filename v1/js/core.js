'use strict';
/* ============ constants & helpers ============ */
const TS = 16, MW = 30, MH = 18, PW = MW * TS, PH = MH * TS;
const DAY = 144, SDAYS = 4;
const OUT = '#2b1b2b';
const $ = id => document.getElementById(id);
const rand = (a, b) => a + Math.random() * (b - a);
const randi = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
function mulberry(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const hash2 = (x, y, s) => mulberry((x * 73856093) ^ (y * 19349663) ^ ((s || 0) * 83492791));
function weighted(list) {
  let s = 0; for (const e of list) s += e[1];
  let r = Math.random() * s;
  for (const e of list) { r -= e[1]; if (r <= 0) return e[0]; }
  return list[list.length - 1][0];
}
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage blocked */ } }
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
  m: '#8fe0c8', M: '#5cbca0', d: '#2b1b2b', e: '#7a3a2a', a: '#d09050', A: '#a86a34', j: '#c47a3a'
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
  '?': ['111', '001', '011', '000', '010']
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
