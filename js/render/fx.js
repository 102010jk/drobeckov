'use strict';
/* ============ particles ============ */
let PARTS = [], POPS = [], AMB = [], SMOKE = [];
function addPart(x, y, vx, vy, col, life, o) {
  o = o || {};
  if (PARTS.length > 400) return;
  PARTS.push({ x, y, vx, vy, col, life, max: life, g: o.g == null ? 140 : o.g, k: o.k || 'px', drag: o.drag || 0, sz: o.sz || 1 });
}
function sparkle(x, y, col, n, spread) { for (let i = 0; i < n; i++) addPart(x + rand(-spread, spread), y + rand(-spread, spread), rand(-12, 12), rand(-26, -6), col, rand(0.4, 0.8), { g: 0, k: 'spark', drag: 1.5 }); }
function popText(txt, x, y, col) { if (POPS.length < 40) POPS.push({ txt, x, y, col, life: 1.2, max: 1.2 }); }
function puff(b) { const x = b.x * TS + b.w * 8; for (let i = 0; i < 5; i++) addPart(x + rand(-6, 6), b.y * TS + b.h * TS - 6, rand(-10, 10), rand(-22, -8), i % 2 ? '#fff4dc' : '#ffd23f', rand(0.4, 0.7), { g: 0, k: 'spark', drag: 1.2 }); }
function splash(x, y) { for (let i = 0; i < 6; i++) addPart(x + rand(-3, 3), y, rand(-14, 14), rand(-30, -12), i % 2 ? '#a8d4f8' : '#ffffff', rand(0.3, 0.5), { g: 120 }); }
function leafBurst(x, y) { const cols = treeCols(seasonIdx(), 0.4); for (let i = 0; i < 8; i++) addPart(x + rand(-5, 5), y + rand(-4, 4), rand(-20, 20), rand(-20, 5), i % 2 ? cols[0] : cols[1], rand(0.5, 0.9), { g: 60, sz: 2 }); }
function spawnAmb(kind, anywhere) {
  const a = { k: kind, t: 0, ph: rand(0, 6.28), x: VX + rand(-4, VW + 4), y: anywhere ? VY + rand(0, VH) : VY - 3 };
  if (kind === 'leaves') { a.vy = rand(9, 16); a.vx = rand(-4, 6); a.f = rand(1.5, 3); a.sw = rand(8, 16); a.col = pick(['#e8843a', '#d65a31', '#f2b441', '#c8482e']); }
  else if (kind === 'snow') { a.vy = rand(7, 15); a.vx = rand(-3, 3); a.f = rand(1, 2.5); a.sw = rand(3, 7); a.sz = Math.random() < 0.25 ? 2 : 1; a.col = Math.random() < 0.3 ? '#dbe6f8' : '#ffffff'; }
  else if (kind === 'petals') { a.vy = rand(8, 14); a.vx = rand(4, 10); a.f = rand(2, 4); a.sw = rand(6, 12); a.col = pick(['#ffc2d6', '#ff9ec0', '#ffffff']); }
  else if (kind === 'rain') { a.vy = rand(140, 180); a.vx = -20; a.col = '#a8c8f0'; a.y = anywhere ? VY + rand(0, VH) : VY - 6; }
  else { a.y = VY + rand(0, VH); a.vy = rand(2, 5); a.f = rand(1, 2); a.life = rand(4, 8); a.col = pick(['#fff6a8', '#ffffff', '#ffe070']); }
  AMB.push(a);
}
let ambT = 0;
function updateFX(dt, gdt) {
  const S = seasonIdx(), kind = G.weather === 'rain' ? 'rain' : G.weather === 'snow' ? 'snow' : SEASONS[S].amb;
  const area = VW * VH / (480 * 288);
  const cap = Math.round((kind === 'rain' ? 70 : kind === 'snow' ? 45 : kind === 'motes' ? 22 : 26) * clamp(area, 0.6, 3));
  ambT -= dt;
  if (ambT <= 0 && AMB.length < cap) { ambT = (kind === 'rain' ? 0.02 : kind === 'snow' ? 0.1 : 0.25) / clamp(area, 0.6, 3); spawnAmb(kind, false); }
  for (let i = AMB.length - 1; i >= 0; i--) {
    const a = AMB[i]; a.t += dt;
    const off = a.x < VX - 40 || a.x > VX + VW + 40 || a.y > VY + VH + 20 || a.y < VY - 60;
    if (a.k === 'motes') { a.y -= a.vy * dt; a.x += Math.sin(a.t * a.f + a.ph) * 6 * dt; if (a.t > a.life || off) AMB.splice(i, 1); }
    else if (a.k === 'rain') { a.y += a.vy * dt; a.x += a.vx * dt; if (off) AMB.splice(i, 1); }
    else { a.y += a.vy * dt; a.x += (a.vx + Math.sin(a.t * a.f + a.ph) * a.sw) * dt; if (off || (a.k !== kind && Math.random() < dt)) AMB.splice(i, 1); }
  }
  for (let i = PARTS.length - 1; i >= 0; i--) {
    const p = PARTS[i]; p.life -= dt;
    if (p.life <= 0) { PARTS.splice(i, 1); continue; }
    p.vy += p.g * dt;
    if (p.drag) { const k = Math.max(0, 1 - p.drag * dt); p.vx *= k; p.vy *= k; }
    p.x += p.vx * dt; p.y += p.vy * dt;
  }
  for (let i = POPS.length - 1; i >= 0; i--) { const p = POPS[i]; p.life -= dt; p.y -= 14 * dt; if (p.life <= 0) POPS.splice(i, 1); }
  // chimney smoke from buildings in view
  for (const b of VIS_BLD) {
    const d = B[b.type]; if (!b.built || !d.chimney) continue;
    if ((b.working || (b.type === 'drevorubec' && !isNight()) || d.smokeAlways) && Math.random() < gdt * 2.5) SMOKE.push({ x: b.x * TS + d.chimney[0] + rand(-0.5, 0.5), y: b.y * TS + d.chimney[1], t: 0, life: rand(1.8, 2.8), dx: rand(2, 5), dark: d.darkSmoke });
  }
  for (let i = SMOKE.length - 1; i >= 0; i--) { const s = SMOKE[i]; s.t += dt; s.y -= 6 * dt; s.x += s.dx * dt; if (s.t > s.life) SMOKE.splice(i, 1); }
}
function drawFX(g) {
  const S = seasonIdx();
  for (const s of SMOKE) { const sz = 1 + Math.min(2, Math.floor(s.t)); g.globalAlpha = 0.6 * (1 - s.t / s.life); R(g, s.dark ? '#6a6480' : S === 3 ? '#c8d0e6' : '#efe0e6', Math.round(s.x - sz / 2), Math.round(s.y), sz, sz); }
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
function drawAmb(g) {
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

/* ============ lighting (stamped dithered light pools) ============ */
const [nightC, ng] = mk(64, 64);
const STAMPS = new Map();
function lightStamp(r) {
  r = Math.round(r); let s = STAMPS.get(r);
  if (!s) {
    const [c, g] = mk(r * 2 + 2, r * 2 + 2);
    for (let k = 0; k < 4; k++) { g.fillStyle = g.createPattern(MASKS[4 + k * 4], 'repeat'); disc(g, r + 1, r + 1, r * (1 - k * 0.22)); }
    STAMPS.set(r, s = c);
  }
  return s;
}
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
const LIGHTS = [];
function collectLights() {
  LIGHTS.length = 0;
  for (const b of VIS_BLD) {
    if (!b.built) continue;
    const X = b.x * TS, Y = b.y * TS, d = B[b.type];
    if (d.light) LIGHTS.push(X + (d.lightAt ? d.lightAt[0] : 8), Y + (d.lightAt ? d.lightAt[1] : (b.type === 'lucerna' ? -1 : 6)), d.light);
    if (b.type === 'domek') LIGHTS.push(X + 23, Y + 21, 13);
    else if (b.type === 'pekarna' || b.type === 'cukrarna') LIGHTS.push(X + 9, Y + 27, b.working ? 15 : 9);
    else if (b.type === 'kuchynka') LIGHTS.push(X + 8, Y + 21, 11);
    else if (b.type === 'zavarovna') LIGHTS.push(X + 23, Y + 20, 10);
    else if (d.windowLight) LIGHTS.push(X + d.windowLight[0], Y + d.windowLight[1], d.windowLight[2]);
  }
}
function drawLighting(g) {
  const dk = darkness(), wm = warmth();
  g.setTransform(1, 0, 0, 1, 0, 0);
  if (wm > 0.01) { g.fillStyle = `rgba(255,140,80,${wm})`; g.fillRect(0, 0, VW, VH); }
  if (dk <= 0.01) return;
  if (nightC.width !== VW || nightC.height !== VH) { nightC.width = VW; nightC.height = VH; }
  ng.globalCompositeOperation = 'source-over'; ng.clearRect(0, 0, VW, VH);
  ng.fillStyle = `rgba(26,16,60,${dk})`; ng.fillRect(0, 0, VW, VH);
  if (dk > 0.15) {
    collectLights();
    ng.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < LIGHTS.length; i += 3) {
      const r = LIGHTS[i + 2], x = Math.round((LIGHTS[i] - VX) / 4) * 4, y = Math.round((LIGHTS[i + 1] - VY) / 4) * 4;
      if (x < -r || y < -r || x > VW + r || y > VH + r) continue;
      ng.drawImage(lightStamp(r), x - r - 1, y - r - 1);
    }
    ng.globalCompositeOperation = 'source-over';
  }
  g.drawImage(nightC, 0, 0);
}
