'use strict';
/* ============ canvas ============ */
const cvs = $('game');
const ctx = cvs.getContext('2d');
cvs.width = PW; cvs.height = PH; ctx.imageSmoothingEnabled = false;
const [nightC, ng] = mk(PW, PH);
const [tmpC, tmpG] = mk(PW, PH);
const PATS = MASKS.map(m => ng.createPattern(m, 'repeat'));
const DARKPAT = (() => { const [c, g] = mk(4, 4); g.drawImage(MASKS[8], 0, 0); g.globalCompositeOperation = 'source-in'; R(g, '#2b1b2b', 0, 0, 4, 4); return c; })();

/* ============ fx ============ */
let PARTS = [], POPS = [], AMB = [], SMOKE = [];
function addPart(x, y, vx, vy, col, life, o) {
  o = o || {};
  if (PARTS.length > 300) return;
  PARTS.push({ x, y, vx, vy, col, life, max: life, g: o.g == null ? 140 : o.g, k: o.k || 'px', drag: o.drag || 0, sz: o.sz || 1 });
}
function sparkle(x, y, col, n, spread) { for (let i = 0; i < n; i++) addPart(x + rand(-spread, spread), y + rand(-spread, spread), rand(-12, 12), rand(-26, -6), col, rand(0.4, 0.8), { g: 0, k: 'spark', drag: 1.5 }); }
function popText(txt, x, y, col) { if (POPS.length < 30) POPS.push({ txt, x, y, col, life: 1.2, max: 1.2 }); }
function puff(b) { const x = b.x * TS + b.w * 8; for (let i = 0; i < 5; i++) addPart(x + rand(-6, 6), b.y * TS + b.h * TS - 6, rand(-10, 10), rand(-22, -8), i % 2 ? '#fff4dc' : '#ffd23f', rand(0.4, 0.7), { g: 0, k: 'spark', drag: 1.2 }); }
function splash(x, y) { for (let i = 0; i < 6; i++) addPart(x + rand(-3, 3), y, rand(-14, 14), rand(-30, -12), i % 2 ? '#a8d4f8' : '#ffffff', rand(0.3, 0.5), { g: 120 }); }
function leafBurst(x, y) { const cols = treeCols(seasonIdx(), 0.4); for (let i = 0; i < 8; i++) addPart(x + rand(-5, 5), y + rand(-4, 4), rand(-20, 20), rand(-20, 5), i % 2 ? cols[0] : cols[1], rand(0.5, 0.9), { g: 60, sz: 2 }); }

/* ============ terrain ============ */
let TERR = null, PREV = null, fade = 1, LOCKC = null;
function isPathLike(x, y) { const t = tile(x, y); return !!t && (t.gr === 'path' || t.gr === 'bridge'); }
function buildTerrain(si) {
  const [c, g] = mk(PW, PH), S = SEASONS[si], [base, hi, dk] = S.grass;
  R(g, base, 0, 0, PW, PH);
  for (let ty = 0; ty < MH; ty++) for (let tx = 0; tx < MW; tx++) {
    const t = G.grid[idx(tx, ty)], X = tx * TS, Y = ty * TS, rng = hash2(tx, ty, 7);
    if (t.gr === 'water' || t.gr === 'bridge') continue;
    for (let i = 0; i < 7; i++) R(g, rng() < 0.5 ? dk : hi, X + (rng() * 16 | 0), Y + (rng() * 16 | 0), 1, 1);
    const tufts = rng() < 0.55 ? 1 + (rng() * 2 | 0) : 0;
    for (let i = 0; i < tufts; i++) { const x = X + 1 + (rng() * 14 | 0), y = Y + 2 + (rng() * 13 | 0); R(g, si === 3 ? dk : hi, x, y - 1, 1, 2); R(g, si === 3 ? dk : hi, x + 2, y, 1, 1); }
    if (S.flowers && rng() < 0.17) { const x = X + 2 + (rng() * 12 | 0), y = Y + 2 + (rng() * 12 | 0); R(g, dk, x, y + 1, 1, 1); R(g, S.flowers[rng() * S.flowers.length | 0], x, y, 1, 1); }
    if (si === 2 && rng() < 0.5) { const cc = ['#e8843a', '#d65a31', '#f2b441']; R(g, cc[rng() * 3 | 0], X + (rng() * 14 | 0), Y + (rng() * 15 | 0), 2, 1); }
    if (si === 3 && rng() < 0.25) { R(g, '#ffffff', X + (rng() * 15 | 0), Y + (rng() * 15 | 0), 1, 1); R(g, '#d4def0', X + (rng() * 13 | 0), Y + (rng() * 15 | 0), 3, 1); }
  }
  for (let ty = 0; ty < MH; ty++) for (let tx = 0; tx < MW; tx++) {
    const t = G.grid[idx(tx, ty)];
    if (t.gr === 'water' || t.gr === 'bridge') drawWater(g, tx, ty, si);
    if (t.gr === 'path') drawPathTile(g, tx, ty, si);
    if (t.gr === 'bridge') drawBridgeTile(g, tx, ty, si);
  }
  return c;
}
function drawWater(g, tx, ty, si) {
  const X = tx * TS, Y = ty * TS, rng = hash2(tx, ty, 3);
  const w = si === 3 ? '#c8e4f8' : '#5aa8e6', deep = si === 3 ? '#a8cfee' : '#3a8ad0';
  R(g, w, X, Y, TS, TS);
  const land = (x, y) => { const t = tile(x, y); return t && t.gr !== 'water' && t.gr !== 'bridge'; };
  if (land(tx - 1, ty)) { R(g, '#8a5a2a', X, Y, 2, TS); R(g, deep, X + 2, Y, 1, TS); }
  if (land(tx + 1, ty)) { R(g, '#8a5a2a', X + 14, Y, 2, TS); R(g, deep, X + 13, Y, 1, TS); }
  if (land(tx, ty - 1)) R(g, '#8a5a2a', X, Y, TS, 2);
  if (land(tx, ty + 1)) R(g, deep, X, Y + 14, TS, 2);
  for (let i = 0; i < 3; i++) R(g, si === 3 ? '#ffffff' : '#8ac8f4', X + 3 + (rng() * 9 | 0), Y + 2 + (rng() * 12 | 0), si === 3 ? 1 : 3, 1);
  if (si === 3 && rng() < 0.5) { const x = X + 4 + (rng() * 6 | 0), y = Y + 4 + (rng() * 6 | 0); R(g, '#a8cfee', x, y, 4, 1); R(g, '#a8cfee', x + 3, y + 1, 1, 3); }
}
function drawPathTile(g, tx, ty, si) {
  const X = tx * TS, Y = ty * TS, rng = hash2(tx, ty, 11);
  const col = si === 3 ? '#eef2f8' : '#d8b078', edge = si === 3 ? '#c4ccdc' : '#b08850', peb = si === 3 ? '#ffffff' : '#ecd0a0';
  const L = isPathLike(tx - 1, ty), Rr = isPathLike(tx + 1, ty), U = isPathLike(tx, ty - 1), D = isPathLike(tx, ty + 1);
  const x0 = X + (L ? 0 : 2), x1 = X + (Rr ? 16 : 14), y0 = Y + (U ? 0 : 2), y1 = Y + (D ? 16 : 14);
  R(g, edge, x0, y0, x1 - x0, y1 - y0);
  R(g, col, x0 + (L ? 0 : 1), y0 + (U ? 0 : 1), x1 - x0 - (L ? 0 : 1) - (Rr ? 0 : 1), y1 - y0 - (U ? 0 : 1) - (D ? 0 : 1));
  for (let i = 0; i < 3; i++) R(g, rng() < 0.5 ? peb : edge, x0 + 2 + (rng() * (x1 - x0 - 4) | 0), y0 + 2 + (rng() * (y1 - y0 - 4) | 0), 1, 1);
}
function drawBridgeTile(g, tx, ty, si) {
  const X = tx * TS, Y = ty * TS;
  R(g, OUT, X, Y + 1, TS, 14);
  for (let i = 0; i < 8; i++) R(g, i % 2 ? '#a8693e' : '#c47a3a', X + i * 2, Y + 2, 2, 12);
  R(g, '#6b4128', X, Y + 2, TS, 1); R(g, '#6b4128', X, Y + 13, TS, 1);
  if (si === 3) { R(g, '#ffffff', X, Y + 2, TS, 1); R(g, '#ffffff', X + 3, Y + 6, 4, 1); }
}
function buildLock() {
  const [c, g] = mk(PW, PH);
  const pat = g.createPattern(DARKPAT, 'repeat');
  for (let ty = 0; ty < MH; ty++) for (let tx = 0; tx < MW; tx++) {
    if (zoneOpen(tx, ty)) continue;
    g.globalAlpha = 0.22; R(g, '#2b1b2b', tx * TS, ty * TS, TS, TS);
    g.globalAlpha = 0.5; g.fillStyle = pat; g.fillRect(tx * TS, ty * TS, TS, TS);
    g.globalAlpha = 1;
    for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      if (!inb(tx + a, ty + b) || !zoneOpen(tx + a, ty + b)) continue;
      for (let k = 1; k < 16; k += 5) {
        const x = a === 1 ? tx * TS + 15 : a === -1 ? tx * TS : tx * TS + k, y = b === 1 ? ty * TS + 14 : b === -1 ? ty * TS : ty * TS + k;
        R(g, OUT, x - 1, y - 1, 3, 4); R(g, '#d8955a', x, y, 1, 2);
      }
    }
  }
  return c;
}
function ensureTerrain() {
  const S = seasonIdx();
  if (terrainDirty || !TERR || TERR.si !== S) {
    if (TERR && TERR.si !== S) { PREV = TERR.c; fade = 0; }
    TERR = { si: S, c: buildTerrain(S) };
    LOCKC = buildLock();
    terrainDirty = false;
  }
}
function drawTerrain(g, dt) {
  ensureTerrain();
  if (PREV && fade < 1) {
    fade = Math.min(1, fade + dt / 2);
    g.drawImage(PREV, 0, 0);
    const lv = Math.floor(fade * 16);
    tmpG.globalCompositeOperation = 'source-over'; tmpG.clearRect(0, 0, PW, PH); tmpG.drawImage(TERR.c, 0, 0);
    tmpG.globalCompositeOperation = 'destination-in'; tmpG.fillStyle = PATS[lv]; tmpG.fillRect(0, 0, PW, PH);
    tmpG.globalCompositeOperation = 'source-over';
    g.drawImage(tmpC, 0, 0);
    if (fade >= 1) PREV = null;
  } else g.drawImage(TERR.c, 0, 0);
}

/* ============ lighting ============ */
function darkness() {
  const h = hour();
  let d;
  if (h >= 7 && h < 18) d = 0;
  else if (h >= 18 && h < 20.5) d = (h - 18) / 2.5 * 0.28;
  else if (h >= 20.5 && h < 22) d = 0.28 + (h - 20.5) / 1.5 * 0.27;
  else if (h >= 22 || h < 5) d = 0.55;
  else d = 0.55 * (1 - (h - 5) / 2);
  if (G.weather === 'rain' && d < 0.12) d = 0.12;
  return d;
}
function warmth() {
  const h = hour();
  if (h >= 17 && h < 21) return Math.sin((h - 17) / 4 * Math.PI) * 0.16;
  if (h >= 5.2 && h < 7.5) return Math.sin((h - 5.2) / 2.3 * Math.PI) * 0.12;
  return 0;
}
function collectLights() {
  const L = [];
  for (const id in G.bld) {
    const b = G.bld[id]; if (!b.built) continue;
    const X = b.x * TS, Y = b.y * TS, d = B[b.type];
    if (d.light) L.push([X + 8, Y + (b.type === 'lucerna' ? -1 : 6), d.light]);
    if (b.type === 'domek') L.push([X + 23, Y + 21, 13]);
    if (b.type === 'pekarna' || b.type === 'cukrarna') L.push([X + 9, Y + 27, b.working ? 15 : 9]);
    if (b.type === 'kuchynka') L.push([X + 8, Y + 21, 11]);
    if (b.type === 'zavarovna') L.push([X + 23, Y + 20, 10]);
  }
  return L;
}
function drawLighting(g) {
  const dk = darkness(), wm = warmth();
  if (wm > 0.01) { g.fillStyle = `rgba(255,140,80,${wm})`; g.fillRect(0, 0, PW, PH); }
  if (dk <= 0.01) return;
  ng.globalCompositeOperation = 'source-over'; ng.clearRect(0, 0, PW, PH);
  ng.fillStyle = `rgba(26,16,60,${dk})`; ng.fillRect(0, 0, PW, PH);
  ng.globalCompositeOperation = 'destination-out';
  const lights = dk > 0.15 ? collectLights() : [];
  for (const [x, y, r] of lights) for (let k = 0; k < 4; k++) { ng.fillStyle = PATS[4 + k * 4]; disc(ng, x, y, r * (1 - k * 0.22)); }
  ng.globalCompositeOperation = 'source-over';
  g.drawImage(nightC, 0, 0);
  if (dk > 0.2) for (const [x, y, r] of lights) { g.fillStyle = 'rgba(255,200,110,0.07)'; disc(g, x, y, r * 0.6); }
}

/* ============ ambient ============ */
function spawnAmb(kind, anywhere) {
  const a = { k: kind, t: 0, ph: rand(0, 6.28), x: rand(-4, PW + 4), y: anywhere ? rand(0, PH) : -3 };
  if (kind === 'leaves') { a.vy = rand(9, 16); a.vx = rand(-4, 6); a.f = rand(1.5, 3); a.sw = rand(8, 16); a.col = pick(['#e8843a', '#d65a31', '#f2b441', '#c8482e']); }
  else if (kind === 'snow') { a.vy = rand(7, 15); a.vx = rand(-3, 3); a.f = rand(1, 2.5); a.sw = rand(3, 7); a.sz = Math.random() < 0.25 ? 2 : 1; a.col = Math.random() < 0.3 ? '#dbe6f8' : '#ffffff'; }
  else if (kind === 'petals') { a.vy = rand(8, 14); a.vx = rand(4, 10); a.f = rand(2, 4); a.sw = rand(6, 12); a.col = pick(['#ffc2d6', '#ff9ec0', '#ffffff']); }
  else if (kind === 'rain') { a.vy = rand(140, 180); a.vx = -20; a.col = '#a8c8f0'; a.y = anywhere ? rand(0, PH) : -6; }
  else { a.y = rand(0, PH); a.vy = rand(2, 5); a.f = rand(1, 2); a.life = rand(4, 8); a.col = pick(['#fff6a8', '#ffffff', '#ffe070']); }
  AMB.push(a);
}
let ambT = 0;
function updateFX(dt, gdt) {
  const S = seasonIdx(), kind = G.weather === 'rain' ? 'rain' : G.weather === 'snow' ? 'snow' : SEASONS[S].amb;
  const cap = kind === 'rain' ? 70 : kind === 'snow' ? 45 : kind === 'motes' ? 22 : 26;
  ambT -= dt;
  if (ambT <= 0 && AMB.length < cap) { ambT = kind === 'rain' ? 0.02 : kind === 'snow' ? 0.1 : 0.25; spawnAmb(kind, false); }
  for (let i = AMB.length - 1; i >= 0; i--) {
    const a = AMB[i]; a.t += dt;
    if (a.k === 'motes') { a.y -= a.vy * dt; a.x += Math.sin(a.t * a.f + a.ph) * 6 * dt; if (a.t > a.life) AMB.splice(i, 1); }
    else if (a.k === 'rain') { a.y += a.vy * dt; a.x += a.vx * dt; if (a.y > PH) AMB.splice(i, 1); }
    else { a.y += a.vy * dt; a.x += (a.vx + Math.sin(a.t * a.f + a.ph) * a.sw) * dt; if (a.y > PH + 2 || a.x < -8 || a.x > PW + 8 || (a.k !== kind && Math.random() < dt)) AMB.splice(i, 1); }
  }
  for (let i = PARTS.length - 1; i >= 0; i--) {
    const p = PARTS[i]; p.life -= dt;
    if (p.life <= 0) { PARTS.splice(i, 1); continue; }
    p.vy += p.g * dt;
    if (p.drag) { const k = Math.max(0, 1 - p.drag * dt); p.vx *= k; p.vy *= k; }
    p.x += p.vx * dt; p.y += p.vy * dt;
  }
  for (let i = POPS.length - 1; i >= 0; i--) { const p = POPS[i]; p.life -= dt; p.y -= 14 * dt; if (p.life <= 0) POPS.splice(i, 1); }
  // chimney smoke
  for (const id in G.bld) {
    const b = G.bld[id], d = B[b.type]; if (!b.built || !d.chimney) continue;
    if ((b.working || (b.type === 'drevorubec' && !isNight())) && Math.random() < gdt * 2.5) SMOKE.push({ x: b.x * TS + d.chimney[0] + rand(-0.5, 0.5), y: b.y * TS + d.chimney[1], t: 0, life: rand(1.8, 2.8), dx: rand(2, 5) });
  }
  for (let i = SMOKE.length - 1; i >= 0; i--) { const s = SMOKE[i]; s.t += dt; s.y -= 6 * dt; s.x += s.dx * dt; if (s.t > s.life) SMOKE.splice(i, 1); }
}
function drawFX(g, t) {
  for (const s of SMOKE) { const sz = 1 + Math.min(2, Math.floor(s.t)); g.globalAlpha = 0.6 * (1 - s.t / s.life); R(g, seasonIdx() === 3 ? '#c8d0e6' : '#efe0e6', Math.round(s.x - sz / 2), Math.round(s.y), sz, sz); }
  g.globalAlpha = 1;
  for (const p of PARTS) {
    const a = p.life / p.max, x = Math.round(p.x), y = Math.round(p.y);
    g.fillStyle = p.col; if (a < 0.3) g.globalAlpha = a / 0.3;
    if (p.k === 'spark') { if (a > 0.5) { g.fillRect(x - 1, y, 3, 1); g.fillRect(x, y - 1, 1, 3); } else g.fillRect(x, y, 1, 1); }
    else if (p.k === 'heart') { g.fillRect(x, y, 1, 1); g.fillRect(x + 2, y, 1, 1); g.fillRect(x, y + 1, 3, 1); g.fillRect(x + 1, y + 2, 1, 1); }
    else g.fillRect(x, y, p.sz, p.sz);
    g.globalAlpha = 1;
  }
}
function drawAmb(g, t) {
  const night = darkness() > 0.3;
  for (const a of AMB) {
    const x = Math.round(a.x), y = Math.round(a.y);
    g.fillStyle = a.col;
    if (a.k === 'leaves' || a.k === 'petals') { const flip = Math.sin(a.t * a.f * 2 + a.ph) > 0; g.fillRect(x, y, 2, flip ? 1 : 2); }
    else if (a.k === 'snow') g.fillRect(x, y, a.sz, a.sz);
    else if (a.k === 'rain') { g.globalAlpha = 0.6; g.fillRect(x, y, 1, 4); g.globalAlpha = 1; }
    else { const tw = Math.sin(a.t * 5 + a.ph); if (tw > -0.3) { g.globalAlpha = 0.5 + 0.5 * tw; g.fillStyle = night ? '#e8ff8a' : a.col; g.fillRect(x, y, 1, 1); if (night && tw > 0.7) { g.globalAlpha = 0.3; g.fillRect(x - 1, y, 3, 1); g.fillRect(x, y - 1, 1, 3); } g.globalAlpha = 1; } }
  }
}

/* ============ entities ============ */
const TOPOFF = { mlyn: 17, trziste: 17, pekarna: 4, kuchynka: 3, skrabadlo: 10, lucerna: 8, vanocni: 7, domek: 1, zavarovna: 0, cukrarna: 4, drevorubec: 0, vcelin: 2, jablon: 2 };
function drawCatSprite(g, c, t, late) {
  if (c.inside) return;
  const spr = catSpr(c.skin);
  let s, bob = 0;
  if (c.anim === 'walk') s = Math.floor(c.walkT * 8) % 2 ? spr.walk1 : spr.walk0;
  else if (c.anim === 'sleep') s = spr.sleep;
  else if (c.anim === 'work') { s = Math.floor(t * 3 + c.id) % 3 === 0 ? spr.walk0 : spr.sit; bob = Math.floor(t * 6 + c.id) % 2; }
  else s = spr.sit;
  const cx = Math.round(c.x), y = Math.round(c.y - s.h + 1 - bob);
  g.fillStyle = 'rgba(43,27,43,0.22)'; g.fillRect(cx - 4, Math.round(c.y), 9, 1);
  const x = cx - (s.w >> 1);
  if (c.face < 0) { g.save(); g.translate(cx * 2 + 1, 0); g.scale(-1, 1); g.drawImage(s.c, x, y); g.restore(); }
  else g.drawImage(s.c, x, y);
  if (c.carry) {
    const it = SPR[c.carry.item];
    if (c.carry.n > 1) g.drawImage(it.c, cx - (it.w >> 1) - 2, y - it.h + 1);
    g.drawImage(it.c, cx - (it.w >> 1), y - it.h + 3);
  }
  if (c.task && c.task.kind === 'work' && !c.task.moving && G.bld[c.task.b] && G.bld[c.task.b].type === 'molo') {
    const fx = cx + (c.face > 0 ? 5 : -5);
    R(g, '#6b4128', fx, y + 1, 1, 1); R(g, '#6b4128', fx + c.face, y, 1, 1);
    R(g, '#fff3dc', fx + c.face * 2, y + 1, 1, 7); R(g, '#e8484e', fx + c.face * 2, y + 8 + Math.round(Math.sin(t * 3)), 1, 1);
  }
  if (c.anim === 'sleep') late.push(() => drawNum(g, (t * 1.2 + c.id) % 2 < 1 ? 'z' : 'Z', cx + 4, y - 7 - Math.round((t * 3 + c.id) % 4), '#ffffff'));
  if (UI.sel && UI.sel.kind === 'c' && UI.sel.id === c.id) late.push(() => { const by = y - 7 - (c.carry ? 9 : 0) + Math.round(Math.sin(t * 5)); R(g, OUT, cx - 3, by - 1, 7, 4); R(g, OUT, cx - 1, by + 3, 3, 2); R(g, '#ffd23f', cx - 2, by, 5, 2); R(g, '#ffd23f', cx, by + 2, 1, 2); });
  else if (c.emote) late.push(() => drawBubble(g, cx, y - (c.carry ? 8 : 0), c.emote));
}
function drawVisitor(g, v, t, late) {
  const a = ANIMALS[v.sp].spr, moving = v.st !== 'buy';
  const bob = moving ? Math.floor(v.walkT * 8) % 2 : 0;
  const cx = Math.round(v.x), y = Math.round(v.y - a.h + 1 - bob), x = cx - (a.w >> 1);
  g.fillStyle = 'rgba(43,27,43,0.22)'; g.fillRect(cx - 4, Math.round(v.y), 9, 1);
  if (v.face < 0) { g.save(); g.translate(cx * 2 + 1, 0); g.scale(-1, 1); g.drawImage(a.c, x, y); g.restore(); } else g.drawImage(a.c, x, y);
  if (v.emoT > 0 && v.emo) late.push(() => drawBubble(g, cx, y, v.emo));
}
function drawSign(g, zk, t) {
  const z = ZONES[zk], [sx, sy] = z.sign, X = sx * TS, Y = sy * TS;
  shape(g, [[X + 7, Y + 6, 2, 10, '#8a5230']]);
  shape(g, [[X - 2, Y - 2, 20, 9, '#b8743e']]); R(g, '#d8955a', X - 2, Y - 2, 20, 1);
  g.drawImage(SPR.lock.c, X - 2, Y - 1);
  const s = String(z.cost); drawNum(g, s, X + 17 - numW(s), Y + 1, '#ffd23f');
}
function plotConnect(b) {
  const L = bldAt(b.x - 1, b.y), Rr = bldAt(b.x + 1, b.y);
  b.conL = !!(L && L.type === 'plot'); b.conR = !!(Rr && Rr.type === 'plot');
}
function anchorFor(type, hx, hy) { const d = B[type]; const w = d.w || 1, h = d.h || 1; return [hx - Math.floor((w - 1) / 2), hy - (h - 1)]; }

function render(dt) {
  const t = performance.now() / 1000, S = seasonIdx(), dk = darkness(), night = dk > 0.2;
  const g = ctx;
  drawTerrain(g, dt);
  // water shimmer
  if (S !== 3) for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    if (G.grid[idx(x, y)].gr !== 'water') continue;
    const ph = (t * 5 + x * 7 + y * 13) % 16;
    R(g, '#a8d4f8', x * TS + ((ph + y * 5) | 0) % 12 + 2, y * TS + ((x * 7 + y * 3) % 12) + 2, 2, 1);
  }
  const late = [];
  const list = [];
  for (const id in G.bld) {
    const b = G.bld[id], d = B[b.type], X = b.x * TS, Y = b.y * TS;
    if ((d.field && !d.glass) || d.water) { if (b.built) drawBuilding(g, b, X, Y, t, S, night); else drawSite(g, b, X, Y, t, S, night); continue; }
    if (b.type === 'plot') plotConnect(b);
    list.push({ y: (b.y + b.h) * TS - 1, f: () => {
      if (!d.ground && b.built && !d.nodoor && b.w > 1) { g.fillStyle = 'rgba(43,27,43,0.16)'; g.fillRect(X + 3, Y + b.h * TS - 1, b.w * TS - 5, 2); }
      if (b.built) drawBuilding(g, b, X, Y, t, S, night); else drawSite(g, b, X, Y, t, S, night);
      if (b.type === 'domek' && G.cats.some(c => c.inside && c.home === b.id)) late.push(() => drawNum(g, (t % 2) < 1 ? 'z' : 'Z', X + 24, Y + 12 - Math.round((t * 3) % 4), '#fff4dc'));
    } });
  }
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    const tr = G.grid[idx(x, y)].tree; if (!tr) continue;
    list.push({ y: (y + 1) * TS - 2, f: () => drawTree(g, x * TS + 8, y * TS + 15, tr, S, t) });
  }
  for (const c of G.cats) if (!c.inside) list.push({ y: c.y + (c.task && c.task.kind === 'rest' && G.bld[c.task.b] && B[G.bld[c.task.b].type].play ? 16 : 0), f: () => drawCatSprite(g, c, t, late) });
  for (const v of VIS) list.push({ y: v.y, f: () => drawVisitor(g, v, t, late) });
  for (const k in ZONES) if (!G.zones[k] && ZONES[k].sign) list.push({ y: (ZONES[k].sign[1] + 1) * TS - 1, f: () => drawSign(g, k, t) });
  list.sort((a, b) => a.y - b.y);
  for (const e of list) e.f();
  if (LOCKC) g.drawImage(LOCKC, 0, 0);
  drawFX(g, t);
  drawAmb(g, t);
  drawLighting(g);
  // alerts above buildings
  for (const id in G.bld) {
    const b = G.bld[id]; if (!b.alert) continue;
    const cx = b.x * TS + b.w * 8, by = b.y * TS - (TOPOFF[b.type] || 0) + Math.round(Math.sin(t * 3 + b.id) * 1.2);
    drawBubble(g, cx, by, b.alert);
  }
  for (const f of late) f();
  for (const p of POPS) { g.globalAlpha = Math.min(1, p.life / p.max * 2); drawNum(g, p.txt, Math.round(p.x - numW(p.txt) / 2), Math.round(p.y), p.col); g.globalAlpha = 1; }
  drawOverlay(g, t, S);
}
function bracket(g, X, Y, W, H, col, t) {
  const o = Math.round((Math.sin(t * 5) + 1) * 0.8);
  const x0 = X - 2 - o, y0 = Y - 2 - o, x1 = X + W + 1 + o, y1 = Y + H + 1 + o;
  for (const [x, y, a, b] of [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]]) {
    R(g, OUT, Math.min(x, x + a * 4) - 1, y - 1, 6, 3); R(g, OUT, x - 1, Math.min(y, y + b * 4) - 1, 3, 6);
    R(g, col, Math.min(x, x + a * 3), y, 4, 1); R(g, col, x, Math.min(y, y + b * 3), 1, 4);
  }
}
function drawOverlay(g, t, S) {
  const sel = UI.sel;
  if (sel && sel.kind === 'b' && G.bld[sel.id]) { const b = G.bld[sel.id]; bracket(g, b.x * TS, b.y * TS, b.w * TS, b.h * TS, '#ffd23f', t); if (B[b.type].chop) radiusBox(g, b.x, b.y, b.w, b.h, B[b.type].chop, '#ffd23f'); if (B[b.type].bees) radiusBox(g, b.x, b.y, 1, 1, 3, '#ff9ec0'); }
  if (sel && sel.kind === 'z') { const z = ZONES[sel.id]; bracket(g, z.x0 * TS, z.y0 * TS, (z.x1 - z.x0 + 1) * TS, (z.y1 - z.y0 + 1) * TS, '#ffd23f', t); }
  const h = UI.hover; if (!h) return;
  const [hx, hy] = h;
  if (!UI.tool) {
    const b = bldAt(hx, hy);
    if (b && !(sel && sel.kind === 'b' && sel.id === b.id)) { g.globalAlpha = 0.6; bracket(g, b.x * TS, b.y * TS, b.w * TS, b.h * TS, '#fff4dc', 0); g.globalAlpha = 1; }
    return;
  }
  const d = B[UI.tool];
  if (d.tool) { bracket(g, hx * TS, hy * TS, TS, TS, '#ff6f9c', t); return; }
  const [ax, ay] = anchorFor(UI.tool, hx, hy), w = d.w || 1, hh = d.h || 1;
  const chk = canPlace(UI.tool, ax, ay);
  g.globalAlpha = 0.45; g.fillStyle = chk.ok ? '#7bd6b0' : '#ff6f9c';
  for (let j = 0; j < hh; j++) for (let i = 0; i < w; i++) g.fillRect((ax + i) * TS, (ay + j) * TS, TS, TS);
  g.globalAlpha = 0.8;
  const X = ax * TS, Y = ay * TS;
  if (d.ground === 'path') { R(g, '#d8b078', X + 2, Y + 2, 12, 12); }
  else if (d.ground === 'bridge') drawBridgeTile(g, ax, ay, S);
  else if (d.tree) drawTree(g, X + 8, Y + 15, { g: 0.5, v: 0.4 }, S, t);
  else drawBuilding(g, { type: UI.tool, id: 0, w, h: hh, st: 2, crop: 'psenice', g: 1, inp: {}, out: {}, workers: [], mature: true, conL: false, conR: false }, X, Y, t, S, false);
  g.globalAlpha = 1;
  if (!d.ground && !d.nodoor && !d.tree && inb(ax, ay)) { const dp = doorPos(UI.tool, ax, ay); if (dp) { const dx = dp[0] * TS + 8, dy = dp[1] * TS + 5; R(g, OUT, dx - 3, dy - 1, 7, 5); R(g, '#ffd23f', dx - 2, dy, 5, 1); R(g, '#ffd23f', dx - 1, dy + 1, 3, 1); R(g, '#ffd23f', dx, dy + 2, 1, 1); } }
  if (d.chop) radiusBox(g, ax, ay, w, hh, d.chop, '#fff4dc');
  if (d.bees) radiusBox(g, ax, ay, 1, 1, 3, '#ff9ec0');
}
function radiusBox(g, x, y, w, h, r, col) {
  const X = (x - r) * TS, Y = (y - r) * TS, W = (w + 2 * r) * TS, H = (h + 2 * r) * TS;
  g.fillStyle = col;
  for (let i = 0; i < W; i += 4) { g.fillRect(X + i, Y, 2, 1); g.fillRect(X + i, Y + H - 1, 2, 1); }
  for (let i = 0; i < H; i += 4) { g.fillRect(X, Y + i, 1, 2); g.fillRect(X + W - 1, Y + i, 1, 2); }
}
