'use strict';
/* ============ factory interior rendering ============ */
const INT = { ox: 0, oy: 0 };
function drawMachine(g, t, X, Y, on, time, d) {
  const m = MACHINES[t]; if (!m) return;
  const sh = on ? Math.floor(time * 8) % 2 : 0;
  shape(g, [[X + 1, Y + 3, 14, 12, m.col]]); R(g, 'rgba(255,255,255,0.25)', X + 1, Y + 3, 14, 2);
  switch (t) {
    case 'lis': shape(g, [[X + 4, Y - 2 + sh * 2, 8, 5, '#9aa0b4']]); R(g, '#3e3852', X + 3, Y + 11, 10, 2); break;
    case 'tazirna': odisc(g, X + 8, Y + 8, 4, '#f79a3a'); R(g, '#cc5f22', X + 8, Y + 8, 1, 1); if (on) R(g, '#fff4b0', X + 8 + Math.round(Math.cos(time * 8) * 3), Y + 8 + Math.round(Math.sin(time * 8) * 3), 1, 1); break;
    case 'soustruh': R(g, '#c4cad8', X + 3, Y + 7, 10, 3); odisc(g, X + 5 + (on ? Math.floor(time * 10) % 2 : 0), Y + 8, 2, '#9aa0b4'); break;
    case 'montaz': R(g, '#d8955a', X + 1, Y + 6, 14, 2); R(g, '#5d6480', X + 3, Y + 4, 3, 2); R(g, '#ffd23f', X + 10, Y + 4, 2, 2); if (on) R(g, '#fff4b0', X + 7, Y + 3 - sh, 2, 1); break;
    case 'pec': shape(g, [[X + 4, Y + 6, 8, 7, OUT]]); R(g, on ? (sh ? '#ffd23f' : '#f79a3a') : '#cc5f22', X + 5, Y + 8, 6, 5); break;
    case 'elektrolyzer': R(g, '#bfe4f4', X + 3, Y + 5, 10, 8); if (on) for (let i = 0; i < 3; i++) R(g, '#ffffff', X + 4 + i * 3, Y + 11 - ((time * 6 + i) % 6 | 0), 1, 1); break;
    case 'pajeci': R(g, '#3a9a78', X + 2, Y + 6, 12, 7); for (let i = 0; i < 3; i++) R(g, '#ffd23f', X + 4 + i * 3, Y + 8, 2, 1); if (on && sh) R(g, '#fff4b0', X + 8, Y + 5, 1, 1); break;
    case 'rafinerie': R(g, '#c4cad8', X + 4, Y + 1, 3, 12); R(g, '#c4cad8', X + 9, Y + 4, 3, 9); if (on) R(g, '#6ab4f0', X + 5, Y + 3 + sh, 1, 1); break;
    case 'lakovna': R(g, '#fff3dc', X + 3, Y + 6, 10, 6); R(g, '#e8484e', X + 4, Y + 7, 3, 4); R(g, '#6ab4f0', X + 9, Y + 7, 3, 4); break;
  }
  if (d != null) { const ax = X + 8 + FDX[d] * 6, ay = Y + 9 + FDY[d] * 5; R(g, OUT, ax - 1, ay - 1, 3, 3); R(g, '#ffd23f', ax, ay, 1, 1); }
}
const MICON = {};
function machineIcon(t) {
  if (MICON[t]) return MICON[t];
  const [c, g] = mk(16, 16); drawMachine(g, t, 0, 0, false, 0, null);
  return (MICON[t] = c.toDataURL());
}
function renderInterior(dt) {
  const b = G.bld[UI.interior];
  if (!b || !b.fac) { UI.interior = null; return; }
  fitCanvas();
  const g = ctx, f = b.fac, t = performance.now() / 1000;
  g.setTransform(1, 0, 0, 1, 0, 0);
  R(g, '#1e1626', 0, 0, VW, VH);
  const W = (f.w + 2) * TS, H = (f.h + 3) * TS;
  INT.ox = Math.floor((VW - W) / 2); INT.oy = Math.floor((VH - H) / 2);
  const ox = INT.ox, oy = INT.oy, fx = ox + TS, fy = oy + 2 * TS;
  // back wall with windows to the outside
  R(g, '#8a4a3a', ox, oy, W, 2 * TS);
  for (let r = 0; r < 8; r++) for (let c = 0; c < W / 8; c++) R(g, '#a85a48', ox + c * 8 + (r % 2 ? 4 : 0), oy + r * 4, 7, 3);
  const dk = darkness(), S = seasonIdx();
  const sky = dk > 0.3 ? '#2a2a5a' : S === 3 ? '#c8d8f0' : '#8ac8f4';
  for (let i = 0; i < f.w; i += 3) { const wx = fx + i * TS + 4; shape(g, [[wx, oy + 6, 20, 14, sky]]); R(g, '#6b4128', wx + 9, oy + 6, 2, 14); R(g, '#6b4128', wx, oy + 12, 20, 1); if (S === 3) R(g, '#ffffff', wx, oy + 18, 20, 2); }
  R(g, '#5c3a26', ox, oy + 2 * TS - 3, W, 3);
  // side walls
  R(g, '#6a3a2e', ox, fy, TS, f.h * TS); R(g, '#6a3a2e', fx + f.w * TS, fy, TS, f.h * TS);
  R(g, '#6a3a2e', ox, fy + f.h * TS, W, TS);
  // floor
  for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) {
    const X = fx + x * TS, Y = fy + y * TS;
    R(g, (x + y) % 2 ? '#c4b8a8' : '#b8ac9c', X, Y, TS, TS); R(g, '#a89c8c', X, Y + 15, TS, 1); R(g, '#a89c8c', X + 15, Y, 1, TS);
  }
  // gates
  const gy = fy + f.gate * TS;
  shape(g, [[ox + 2, gy + 1, 12, 14, '#7bd6b0']]); R(g, OUT, ox + 5, gy + 5, 6, 6); R(g, '#7bd6b0', ox + 6, gy + 7, 4, 2); R(g, '#7bd6b0', ox + 9, gy + 6, 1, 4);
  shape(g, [[fx + f.w * TS + 2, gy + 1, 12, 14, '#ff9ec0']]); R(g, OUT, fx + f.w * TS + 5, gy + 5, 6, 6); R(g, '#ff9ec0', fx + f.w * TS + 6, gy + 7, 4, 2); R(g, '#ff9ec0', fx + f.w * TS + 9, gy + 6, 1, 4);
  drawNum(g, sumObj(b.inp), ox + 3, gy - 7, '#7bd6b0'); drawNum(g, sumObj(b.out), fx + f.w * TS + 3, gy - 7, '#ff9ec0');
  // cells
  const workers = G.cats.filter(c => c.task && c.task.kind === 'work' && c.task.b === b.id && !c.task.moving);
  let si = 0;
  for (let i = 0; i < f.cells.length; i++) {
    const c = f.cells[i]; if (!c) continue;
    const x = i % f.w, y = (i / f.w) | 0, X = fx + x * TS, Y = fy + y * TS;
    if (c.k === 'belt' || c.k === 'split' || c.k === 'sort') {
      g.save(); g.translate(X + 8, Y + 8); g.rotate(c.d * Math.PI / 2);
      R(g, '#3b302b', -8, -7, 16, 14); R(g, c.k === 'split' ? '#4a5a6a' : c.k === 'sort' ? '#5a4a6e' : '#5a4a42', -8, -5, 16, 10); R(g, '#ffd23f', -8, -7, 16, 1); R(g, '#ffd23f', -8, 6, 16, 1);
      const off = (t * BELT_SPEED * 16) % 8;
      for (let k = -1; k < 3; k++) { const cx = Math.floor(-8 + k * 8 + off); for (const [a, bb] of [[0, -3], [1, -2], [2, -1], [2, 0], [1, 1], [0, 2]]) if (cx + a >= -8 && cx + a < 8) R(g, c.k === 'split' ? '#9ab4d0' : '#7d6a5c', cx + a, bb, 1, 1); }
      if (c.k === 'split') { R(g, '#fff3dc', -1, -5, 2, 10); }
      if (c.k === 'sort') { R(g, '#b89ae8', -2, -7, 4, 5); R(g, '#b89ae8', -1, -8, 2, 1); }
      g.restore();
      if (c.k === 'sort' && c.f && SPR[c.f]) { const s = SPR[c.f]; g.globalAlpha = 0.85; g.drawImage(s.c, X + 8 - (s.w >> 1), Y + 1); g.globalAlpha = 1; }
    } else if (c.k === 'm') {
      drawMachine(g, c.t, X, Y, c.on, t, c.d);
      if (c.cyc) { R(g, OUT, X + 1, Y + 15, 14, 2); R(g, '#7bd6b0', X + 2, Y + 15, Math.round(12 * c.p), 1); }
      if (c.auto) { R(g, '#ffd23f', X + 12, Y + 1, 3, 3); R(g, OUT, X + 13, Y + 2, 1, 1); }
    } else if (c.k === 'st') {
      R(g, '#ffd23f', X + 2, Y + 2, 12, 12); R(g, '#e8962a', X + 3, Y + 3, 10, 10); R(g, '#ffd23f', X + 5, Y + 5, 6, 6);
      const cat = workers[si++];
      if (cat) { const s = catSpr(cat.skin), spr = Math.floor(t * 3 + cat.id) % 3 === 0 ? s.walk0 : s.sit; g.drawImage(spr.c, X + 8 - (spr.w >> 1), Y + 13 - spr.h - (Math.floor(t * 6 + cat.id) % 2)); }
    }
    if (FUI.sel === i) bracket(g, X, Y, TS, TS, '#ffd23f', t);
  }
  // items riding belts
  for (let i = 0; i < f.cells.length; i++) {
    const c = f.cells[i]; if (!c || !c.it || (c.k !== 'belt' && c.k !== 'split' && c.k !== 'sort')) continue;
    const x = i % f.w, y = (i / f.w) | 0, X = fx + x * TS + 8, Y = fy + y * TS + 8;
    const s = SPR[c.it]; if (!s) continue;
    const px = c.k === 'belt' ? X + FDX[c.d] * (c.p - 0.5) * TS : X, py = c.k === 'belt' ? Y + FDY[c.d] * (c.p - 0.5) * TS : Y;
    g.drawImage(s.c, Math.round(px - s.w / 2), Math.round(py - s.h / 2));
  }
  // hover / ghost
  if (UI.hoverT) {
    const [hx, hy] = UI.hoverT;
    if (hx >= 0 && hy >= 0 && hx < f.w && hy < f.h) {
      const X = fx + hx * TS, Y = fy + hy * TS;
      g.globalAlpha = 0.5;
      if (FUI.tool && FUI.tool !== 'fdel') {
        if (MACHINES[FUI.tool]) drawMachine(g, FUI.tool, X, Y, false, t, FUI.rot);
        else R(g, FUI.tool === 'station' ? '#ffd23f' : '#5a4a42', X + 1, Y + 1, 14, 14);
        if (FUI.tool === 'belt' || FUI.tool === 'split') { const ax = X + 8 + FDX[FUI.rot] * 4, ay = Y + 8 + FDY[FUI.rot] * 4; R(g, '#ffd23f', ax - 1, ay - 1, 3, 3); }
      }
      g.globalAlpha = 1;
      bracket(g, X, Y, TS, TS, FUI.tool === 'fdel' ? '#ff6f9c' : '#fff4dc', t);
    }
  }
  if (dk > 0.2) { g.fillStyle = `rgba(26,16,60,${dk * 0.35})`; g.fillRect(0, 0, VW, VH); }
  // title
  drawNum(g, f.w + 'x' + f.h, ox + 2, oy - 8, '#fff4dc');
}
function interiorTile(clientX, clientY) {
  const r = cvs.getBoundingClientRect();
  const px = (clientX - r.left) / r.width * VW, py = (clientY - r.top) / r.height * VH;
  return [Math.floor((px - INT.ox) / TS) - 1, Math.floor((py - INT.oy) / TS) - 2];
}
