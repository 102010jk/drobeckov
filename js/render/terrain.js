'use strict';
/* ============ terrain chunk cache ============ */
const TCACHE = new Map();     // ckey*4+season -> canvas
function mixHex(a, b, t) { const A = hex2rgb(a), Bc = hex2rgb(b); return '#' + [0, 1, 2].map(i => Math.round(A[i] + (Bc[i] - A[i]) * t).toString(16).padStart(2, '0')).join(''); }
const GROUND = [];
for (let s = 0; s < 4; s++) {
  const g = SEASONS[s].grass;
  GROUND[s] = {
    meadow: g,
    forest: g.map(c => mixHex(c, s === 3 ? '#b8c4d8' : '#2b4a2a', s === 3 ? 0.1 : 0.2)),
    birch: g.map(c => mixHex(c, s === 3 ? '#ffffff' : '#e8f0b0', 0.14)),
    wetland: g.map(c => mixHex(c, s === 3 ? '#c4d8e8' : '#3a8a7a', 0.28))
  };
}
const ORE_COL = { uhli: ['#2b2a38', '#4a4858'], zelezo: ['#b8583a', '#8a3a2a'], med: ['#d88a3a', '#5cbca0'], cin: ['#e0e4ec', '#9aa0b4'], bauxit: ['#c2663a', '#e8a070'], zlato: ['#ffd23f', '#fff4b0'] };
function dropChunkCache(k) { for (let s = 0; s < 4; s++) TCACHE.delete(k * 4 + s); }
function chunkCanvas(ch, S) {
  const k = ckey(ch.cx, ch.cy);
  if (ch.dirty) { dropChunkCache(k); ch.dirty = false; }
  let c = TCACHE.get(k * 4 + S);
  if (!c) {
    c = buildChunkTerrain(ch, S); TCACHE.set(k * 4 + S, c);
    if (TCACHE.size > 420) { let n = 0; for (const key of TCACHE.keys()) { TCACHE.delete(key); if (++n > 120) break; } }
  }
  return c;
}
function buildChunkTerrain(ch, S) {
  const [c, g] = mk(CH * TS, CH * TS);
  const x0 = ch.cx * CH, y0 = ch.cy * CH, seed = GEN.seed, SS = SEASONS[S];
  for (let j = 0; j < CH; j++) for (let i = 0; i < CH; i++) {
    const t = ch.t[j * CH + i], x = x0 + i, y = y0 + j, X = i * TS, Y = j * TS;
    const h = n => hashi(x * 7 + n, y * 13 - n, seed + 11);
    if (t.gr === 'water' || t.gr === 'deep' || t.gr === 'bridge') { drawWaterTile(g, t, x, y, X, Y, S); if (t.gr === 'bridge') drawBridge(g, X, Y, S); continue; }
    if (t.gr === 'sand') {
      R(g, S === 3 ? '#eeeae2' : '#ecd9a4', X, Y, TS, TS);
      for (let n = 0; n < 6; n++) R(g, h(n) < 0.5 ? (S === 3 ? '#ffffff' : '#f6ead0') : (S === 3 ? '#d8dce6' : '#d4bc80'), X + (h(n + 10) * 16 | 0), Y + (h(n + 20) * 16 | 0), 1, 1);
      if (h(40) < 0.08) { R(g, '#fff3dc', X + 5, Y + 7, 2, 1); R(g, '#e0608e', X + 6, Y + 6, 1, 1); }
    } else if (t.gr === 'rock') {
      const mt = t.bio === 'mountain', base = mt ? '#8a8580' : '#a39d90', hi = mt ? '#a8a39c' : '#bdb7aa', dk = mt ? '#6c6862' : '#857f74';
      R(g, base, X, Y, TS, TS);
      for (let n = 0; n < 5; n++) R(g, h(n) < 0.5 ? hi : dk, X + (h(n + 10) * 15 | 0), Y + (h(n + 20) * 15 | 0), 2, 1);
      if (h(30) < 0.35) { const bx = X + 2 + (h(31) * 9 | 0), by = Y + 3 + (h(32) * 9 | 0); R(g, dk, bx, by + 2, 4, 1); R(g, hi, bx, by, 3, 2); }
      if (S === 3 || mt) { if (S === 3 || h(33) < 0.25) { R(g, '#ffffff', X + (h(34) * 10 | 0), Y + (h(35) * 12 | 0), 5, 2); R(g, '#e4ebf6', X + (h(36) * 12 | 0), Y + (h(37) * 12 | 0), 3, 1); } }
      if (t.ore && ORE_COL[t.ore]) {
        const oc = ORE_COL[t.ore];
        for (let n = 0; n < 4; n++) { const ox = X + 2 + (h(50 + n) * 11 | 0), oy = Y + 2 + (h(60 + n) * 11 | 0); R(g, OUT, ox - 1, oy - 1, 4, 3); R(g, oc[0], ox, oy, 2, 1); R(g, oc[1], ox + 1, oy, 1, 1); }
        if (t.ore === 'zlato' && h(70) < 0.5) R(g, '#ffffff', X + 8, Y + 5, 1, 1);
      }
    } else {
      const gc = (GROUND[S][t.bio] || GROUND[S].meadow), [base, hi, dk] = gc;
      R(g, base, X, Y, TS, TS);
      for (let n = 0; n < 7; n++) R(g, h(n) < 0.5 ? dk : hi, X + (h(n + 10) * 16 | 0), Y + (h(n + 20) * 16 | 0), 1, 1);
      const tufts = h(30) < 0.55 ? 1 + (h(31) * 2 | 0) : 0;
      for (let n = 0; n < tufts; n++) { const tx = X + 1 + (h(32 + n) * 14 | 0), ty = Y + 2 + (h(40 + n) * 13 | 0); R(g, S === 3 ? dk : hi, tx, ty - 1, 1, 2); R(g, S === 3 ? dk : hi, tx + 2, ty, 1, 1); }
      if (SS.flowers && h(50) < (t.bio === 'meadow' ? 0.2 : 0.08)) { const fx = X + 2 + (h(51) * 12 | 0), fy = Y + 2 + (h(52) * 12 | 0); R(g, dk, fx, fy + 1, 1, 1); R(g, SS.flowers[h(53) * SS.flowers.length | 0], fx, fy, 1, 1); }
      if (S === 2 && h(54) < 0.5) { const cc = ['#e8843a', '#d65a31', '#f2b441']; R(g, cc[h(55) * 3 | 0], X + (h(56) * 14 | 0), Y + (h(57) * 15 | 0), 2, 1); }
      if (S === 3 && h(58) < 0.25) { R(g, '#ffffff', X + (h(59) * 15 | 0), Y + (h(60) * 15 | 0), 1, 1); R(g, '#d4def0', X + (h(61) * 13 | 0), Y + (h(62) * 15 | 0), 3, 1); }
      if (t.bio === 'wetland' && S !== 3 && h(63) < 0.3) { const rx = X + 3 + (h(64) * 9 | 0), ry = Y + 4 + (h(65) * 8 | 0); R(g, '#3a7a5a', rx, ry, 1, 4); R(g, '#3a7a5a', rx + 2, ry + 1, 1, 3); R(g, '#8a5a2a', rx, ry - 1, 1, 2); }
      if (t.ore === 'hlina' && S !== 3) { R(g, '#a8683c', X + 3 + (h(66) * 6 | 0), Y + 9 + (h(67) * 4 | 0), 5, 2); R(g, '#c48850', X + 4 + (h(66) * 6 | 0), Y + 9 + (h(67) * 4 | 0), 2, 1); }
      if (t.gr === 'path') drawPathTile(g, x, y, X, Y, S);
      else if (t.gr === 'road') drawRoadTile(g, x, y, X, Y, S);
      else if (t.gr === 'asfalt') drawAsphaltTile(g, x, y, X, Y, S);
    }
  }
  return c;
}
function isWater(t) { return t.gr === 'water' || t.gr === 'deep' || t.gr === 'bridge'; }
function drawWaterTile(g, t, x, y, X, Y, S) {
  const frozen = S === 3 && t.bio !== 'sea';
  const deep = t.gr === 'deep';
  const col = frozen ? '#c8e4f8' : deep ? '#3a86cc' : t.bio === 'sea' ? '#5aa8e6' : t.bio === 'lake' ? '#62b0e0' : '#5aa8e6';
  const dk = frozen ? '#a8cfee' : deep ? '#2e6eb0' : '#3a8ad0';
  R(g, col, X, Y, TS, TS);
  const h = n => hashi(x * 5 + n, y * 3 + n, GEN.seed + 12);
  const land = (xx, yy) => !isWater(tile(xx, yy));
  const sand = (xx, yy) => tile(xx, yy).gr === 'sand';
  if (land(x - 1, y)) { R(g, sand(x - 1, y) ? '#f6ead0' : '#8a5a2a', X, Y, 2, TS); R(g, dk, X + 2, Y, 1, TS); }
  if (land(x + 1, y)) { R(g, sand(x + 1, y) ? '#f6ead0' : '#8a5a2a', X + 14, Y, 2, TS); R(g, dk, X + 13, Y, 1, TS); }
  if (land(x, y - 1)) R(g, sand(x, y - 1) ? '#f6ead0' : '#8a5a2a', X, Y, TS, 2);
  if (land(x, y + 1)) R(g, dk, X, Y + 14, TS, 2);
  if (!deep && t.bio === 'sea' && !frozen) { for (let n = 0; n < 2; n++) R(g, '#8ac8f4', X + 2 + (h(n) * 11 | 0), Y + 2 + (h(n + 5) * 12 | 0), 3, 1); }
  else for (let n = 0; n < 3; n++) R(g, frozen ? '#ffffff' : deep ? '#4a96d8' : '#8ac8f4', X + 3 + (h(n) * 9 | 0), Y + 2 + (h(n + 5) * 12 | 0), frozen ? 1 : 3, 1);
  if (frozen && h(20) < 0.5) { const cx = X + 4 + (h(21) * 6 | 0), cy = Y + 4 + (h(22) * 6 | 0); R(g, '#a8cfee', cx, cy, 4, 1); R(g, '#a8cfee', cx + 3, cy + 1, 1, 3); }
}
const pathLike = (x, y) => { const g = tile(x, y).gr; return g === 'path' || g === 'bridge' || g === 'road' || g === 'asfalt'; };
const asphaltAt = (x, y) => tile(x, y).gr === 'asfalt';
/* asphalt road: kerbs where it ends, a dashed centre line along straight stretches, zebra crossings next to junctions */
function drawAsphaltTile(g, x, y, X, Y, S) {
  const L = asphaltAt(x - 1, y), Rr = asphaltAt(x + 1, y), U = asphaltAt(x, y - 1), D = asphaltAt(x, y + 1), snow = S === 3;
  R(g, '#4a4658', X, Y, TS, TS);
  for (let n = 0; n < 6; n++) R(g, hashi(x * 3 + n, y, 21) < 0.5 ? '#56526a' : '#403c4c', X + (hashi(x, y * 3 + n, 22) * 15 | 0), Y + (hashi(x + n, y, 23) * 15 | 0), 1, 1);
  const kerb = snow ? '#e4ebf6' : '#b8bcc8', kd = snow ? '#c4d0e6' : '#8a8ea0';
  if (!U) { R(g, kerb, X, Y, TS, 2); R(g, kd, X, Y + 2, TS, 1); }
  if (!D) { R(g, kd, X, Y + 13, TS, 1); R(g, kerb, X, Y + 14, TS, 2); }
  if (!L) { R(g, kerb, X, Y, 2, TS); R(g, kd, X + 2, Y, 1, TS); }
  if (!Rr) { R(g, kd, X + 13, Y, 1, TS); R(g, kerb, X + 14, Y, 2, TS); }
  const line = snow ? '#dbe6f8' : '#f6e3a0', horiz = (L || Rr) && !U && !D, vert = (U || D) && !L && !Rr;
  if (horiz && (x & 1)) R(g, line, X + 4, Y + 7, 8, 2);
  if (vert && (y & 1)) R(g, line, X + 7, Y + 4, 2, 8);
  const junction = (a, b) => [[a - 1, b], [a + 1, b], [a, b - 1], [a, b + 1]].filter(([p, q]) => asphaltAt(p, q)).length >= 3;
  if (horiz && (junction(x - 1, y) || junction(x + 1, y))) for (let i = 0; i < 4; i++) R(g, snow ? '#ffffff' : '#e8e8f0', X + 3 + i * 3, Y + 3, 2, 10);
  if (vert && (junction(x, y - 1) || junction(x, y + 1))) for (let i = 0; i < 4; i++) R(g, snow ? '#ffffff' : '#e8e8f0', X + 3, Y + 3 + i * 3, 10, 2);
  if (snow) for (let n = 0; n < 3; n++) R(g, '#ffffff', X + (hashi(x, y + n, 24) * 13 | 0), Y + (hashi(x + n, y, 25) * 14 | 0), 2, 1);
}
function drawPathTile(g, x, y, X, Y, S) {
  const col = S === 3 ? '#eef2f8' : '#d8b078', edge = S === 3 ? '#c4ccdc' : '#b08850', peb = S === 3 ? '#ffffff' : '#ecd0a0';
  const L = pathLike(x - 1, y), Rr = pathLike(x + 1, y), U = pathLike(x, y - 1), D = pathLike(x, y + 1);
  const x0 = X + (L ? 0 : 2), x1 = X + (Rr ? 16 : 14), y0 = Y + (U ? 0 : 2), y1 = Y + (D ? 16 : 14);
  R(g, edge, x0, y0, x1 - x0, y1 - y0);
  R(g, col, x0 + (L ? 0 : 1), y0 + (U ? 0 : 1), x1 - x0 - (L ? 0 : 1) - (Rr ? 0 : 1), y1 - y0 - (U ? 0 : 1) - (D ? 0 : 1));
  for (let n = 0; n < 3; n++) R(g, hashi(x + n, y, 9) < 0.5 ? peb : edge, x0 + 2 + (hashi(x, y + n, 8) * (x1 - x0 - 4) | 0), y0 + 2 + (hashi(x - n, y, 7) * (y1 - y0 - 4) | 0), 1, 1);
}
function drawRoadTile(g, x, y, X, Y, S) {
  const L = pathLike(x - 1, y), Rr = pathLike(x + 1, y), U = pathLike(x, y - 1), D = pathLike(x, y + 1);
  const x0 = X + (L ? 0 : 1), x1 = X + (Rr ? 16 : 15), y0 = Y + (U ? 0 : 1), y1 = Y + (D ? 16 : 15);
  R(g, '#6c6862', x0, y0, x1 - x0, y1 - y0);
  for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) {
    const sx = X + i * 4 + (j % 2 ? 2 : 0), sy = Y + j * 4;
    if (sx + 3 > x1 || sx < x0 || sy < y0 || sy + 3 > y1) continue;
    R(g, S === 3 ? '#e4e8f0' : hashi(x * 4 + i, y * 4 + j, 3) < 0.5 ? '#b8b0a4' : '#a8a094', sx, sy, 3, 3);
  }
}
function drawBridge(g, X, Y, S) {
  R(g, OUT, X, Y + 1, TS, 14);
  for (let i = 0; i < 8; i++) R(g, i % 2 ? '#a8693e' : '#c47a3a', X + i * 2, Y + 2, 2, 12);
  R(g, '#6b4128', X, Y + 2, TS, 1); R(g, '#6b4128', X, Y + 13, TS, 1);
  if (S === 3) { R(g, '#ffffff', X, Y + 2, TS, 1); R(g, '#ffffff', X + 3, Y + 6, 4, 1); }
}
/* season crossfade */
let fadeFrom = -1, fadeT = 1, lastS = -1;
const [fadeC, fadeG] = mk(CH * TS, CH * TS);
const PATS = MASKS.map(m => fadeG.createPattern(m, 'repeat'));
function drawTerrain(g, dt) {
  const S = seasonIdx();
  if (lastS !== -1 && S !== lastS) { fadeFrom = lastS; fadeT = 0; }
  lastS = S;
  if (fadeT < 1) fadeT = Math.min(1, fadeT + dt / 2);
  const cx0 = Math.floor(VX / (CH * TS)), cy0 = Math.floor(VY / (CH * TS)), cx1 = Math.floor((VX + VW) / (CH * TS)), cy1 = Math.floor((VY + VH) / (CH * TS));
  for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) {
    const ch = chunkAt(cx, cy), X = cx * CH * TS, Y = cy * CH * TS;
    const cur = chunkCanvas(ch, S);
    if (fadeT < 1 && fadeFrom >= 0) {
      g.drawImage(chunkCanvas(ch, fadeFrom), X, Y);
      fadeG.globalCompositeOperation = 'source-over'; fadeG.clearRect(0, 0, CH * TS, CH * TS); fadeG.drawImage(cur, 0, 0);
      fadeG.globalCompositeOperation = 'destination-in'; fadeG.fillStyle = PATS[Math.floor(fadeT * 16)]; fadeG.fillRect(0, 0, CH * TS, CH * TS);
      g.drawImage(fadeC, X, Y);
    } else g.drawImage(cur, X, Y);
  }
}
/* fog of the unknown */
const CLOUD = (() => {
  const [c, g] = mk(64, 64), rng = mulberry(77);
  g.fillStyle = 'rgba(232,220,239,0.9)'; g.fillRect(0, 0, 64, 64);
  for (let i = 0; i < 14; i++) { const x = rng() * 64, y = rng() * 64, r = 6 + rng() * 10; g.fillStyle = i % 3 ? '#fff8fc' : '#e0d2ea'; for (const [ox, oy] of [[0, 0], [64, 0], [0, 64], [64, 64], [-64, 0], [0, -64], [-64, -64], [64, -64], [-64, 64]]) disc(g, x + ox, y + oy, r); }
  return c;
})();
const DARKPAT = (() => { const [c, g] = mk(4, 4); g.drawImage(MASKS[8], 0, 0); g.globalCompositeOperation = 'source-in'; R(g, '#2b1b2b', 0, 0, 4, 4); return c; })();
let cloudPat = null, darkPat = null;
function drawFog(g, t) {
  if (!cloudPat) { cloudPat = g.createPattern(CLOUD, 'repeat'); darkPat = g.createPattern(DARKPAT, 'repeat'); }
  const p0x = Math.floor(VX / (PS * TS)), p0y = Math.floor(VY / (PS * TS)), p1x = Math.floor((VX + VW) / (PS * TS)), p1y = Math.floor((VY + VH) / (PS * TS));
  const P = PS * TS;
  for (let py = p0y; py <= p1y; py++) for (let px = p0x; px <= p1x; px++) {
    const f = fogLevel(px, py); if (!f) continue;
    const X = px * P, Y = py * P;
    if (f === 3) { g.fillStyle = cloudPat; g.save(); g.translate(Math.round(t * 3) % 64, 0); g.fillRect(X - Math.round(t * 3) % 64, Y, P, P); g.restore(); continue; }
    g.globalAlpha = f === 1 ? 0.14 : 0.3; R(g, '#2b1b2b', X, Y, P, P);
    g.globalAlpha = f === 1 ? 0.25 : 0.55; g.fillStyle = darkPat; g.fillRect(X, Y, P, P);
    g.globalAlpha = 1;
  }
  // soft edge stakes along owned border
  for (let py = p0y; py <= p1y; py++) for (let px = p0x; px <= p1x; px++) {
    if (!ownedP(px, py)) continue;
    const X = px * P, Y = py * P;
    for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      if (ownedP(px + a, py + b)) continue;
      for (let k = 2; k < P; k += 8) {
        const x = a === 1 ? X + P - 1 : a === -1 ? X : X + k, y = b === 1 ? Y + P - 2 : b === -1 ? Y : Y + k;
        R(g, OUT, x - 1, y - 1, 3, 4); R(g, '#d8955a', x, y, 1, 2);
      }
    }
  }
}
