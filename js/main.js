'use strict';
/* ============ input ============ */
const DRAG_TOOLS = ['cesta', 'dlazba', 'plot', 'kvetiny', 'stromek', 'zbourat', 'lavka'];
let ptr = null;            // active pointer gesture
const KEYS = {};
function tryPlace(hx, hy, fromDrag) {
  const type = UI.tool, d = B[type];
  if (d.tool) { if (demolishAt(hx, hy)) { UI.dirty = true; UI.ghostChk = null; } return; }
  const [ax, ay] = anchorFor(type, hx, hy);
  const chk = canPlace(type, ax, ay);
  if (!chk.ok) { if (!fromDrag && chk.why) { toast(chk.why); Sound.nope(); } return; }
  place(type, ax, ay);
  Sound.place(); UI.ghostChk = null;
  for (let i = 0; i < 6; i++) addPart(ax * TS + rand(0, (d.w || 1) * TS), (ay + (d.h || 1)) * TS - 2, rand(-20, 20), rand(-30, -10), '#e8cc98', 0.4, { g: 120 });
  UI.dirty = true;
  if (!DRAG_TOOLS.includes(type) && (d.w || 1) > 1 && !fromDrag) UI.tool = null;
}
function clickWorld(px, py, hx, hy) {
  if (UI.landMode) {
    const pxl = hx >> 3, pyl = hy >> 3;
    if (!ownedP(pxl, pyl) && adjacentOwned(pxl, pyl)) { buyParcel(pxl, pyl); UI.ghostChk = null; }
    else UI.select({ kind: 'p', px: pxl, py: pyl });
    renderPane(true); return;
  }
  if (UI.tool) { tryPlace(hx, hy, false); return; }
  const c = catAt(px, py);
  if (c) { UI.select({ kind: 'c', id: c.id }); petCat(c); renderPane(true); return; }
  const t = tile(hx, hy);
  if (t.b && owned(hx, hy)) { UI.select({ kind: 'b', id: t.b }); Sound.click(); renderPane(true); return; }
  if (t.poi) { UI.select({ kind: 'poi', poi: t.poi }); renderPane(true); return; }
  if (!owned(hx, hy)) { UI.select({ kind: 'p', px: hx >> 3, py: hy >> 3 }); renderPane(true); return; }
  UI.select(null); renderPane(true);
}
cvs.addEventListener('pointerdown', e => {
  if (!G) return;
  Sound.init();
  cvs.setPointerCapture && cvs.setPointerCapture(e.pointerId);
  if (UI.interior) {
    const [tx, ty] = interiorTile(e.clientX, e.clientY);
    if (e.button === 2) { if (FUI.tool) FUI.tool = null; else leaveFactory(); UI.dirty = true; return; }
    interiorClick(tx, ty, true);
    ptr = { id: e.pointerId, btn: e.button, sx: e.clientX, sy: e.clientY, cx: CAM.x, cy: CAM.y, moved: false, drag: ['belt', 'fdel', 'split'].includes(FUI.tool), last: [tx, ty], interior: true };
    return;
  }
  const [px, py, hx, hy] = screenToWorld(e.clientX, e.clientY);
  ptr = { id: e.pointerId, btn: e.button, sx: e.clientX, sy: e.clientY, cx: CAM.x, cy: CAM.y, moved: false, drag: false, last: [hx, hy] };
  if (e.button === 0 && UI.tool && !UI.landMode) {
    tryPlace(hx, hy, false);
    if (UI.tool && DRAG_TOOLS.includes(UI.tool)) ptr.drag = true;
  }
});
cvs.addEventListener('pointermove', e => {
  if (!G) return;
  if (UI.interior) {
    const [tx, ty] = interiorTile(e.clientX, e.clientY); UI.hoverT = [tx, ty];
    if (ptr && ptr.interior && ptr.drag && (ptr.last[0] !== tx || ptr.last[1] !== ty)) {
      const [lx, ly] = ptr.last;
      if (FUI.tool === 'belt' && Math.abs(tx - lx) + Math.abs(ty - ly) === 1) { const d = FDX.findIndex((v, i) => v === tx - lx && FDY[i] === ty - ly); const b = G.bld[UI.interior]; const c = b && fcell(b.fac, lx, ly); if (c && c.k === 'belt') c.d = d; FUI.rot = d; }
      interiorClick(tx, ty, false); ptr.last = [tx, ty];
    }
    return;
  }
  const [px, py, hx, hy] = screenToWorld(e.clientX, e.clientY);
  UI.hoverPx = [px, py]; UI.hover = [hx, hy];
  if (!ptr || ptr.id !== e.pointerId) return;
  const dx = e.clientX - ptr.sx, dy = e.clientY - ptr.sy;
  if (!ptr.moved && Math.hypot(dx, dy) > 6) { ptr.moved = true; tutEvent('cam'); }
  if (ptr.drag && UI.tool) {
    const [lx, ly] = ptr.last;
    if (lx !== hx || ly !== hy) {
      const steps = Math.max(Math.abs(hx - lx), Math.abs(hy - ly));
      for (let i = 1; i <= steps; i++) tryPlace(Math.round(lx + (hx - lx) * i / steps), Math.round(ly + (hy - ly) * i / steps), true);
      ptr.last = [hx, hy];
    }
    return;
  }
  if (ptr.moved) {
    const r = cvs.getBoundingClientRect(), k = VW / r.width;
    CAM.x = ptr.cx - dx * k; CAM.y = ptr.cy - dy * k; clampCam();
  }
});
addEventListener('pointerup', e => {
  if (!ptr || ptr.id !== e.pointerId) return;
  const p = ptr; ptr = null;
  if (p.interior || p.moved || p.drag) return;
  const [px, py, hx, hy] = screenToWorld(e.clientX, e.clientY);
  if (p.btn === 2) { if (UI.tool) UI.tool = null; else if (UI.landMode) UI.landMode = false; else UI.select(null); UI.dirty = true; return; }
  if (p.btn === 0 && !(UI.tool && !UI.landMode)) clickWorld(px, py, hx, hy);
});
cvs.addEventListener('pointerleave', () => { if (!ptr) { UI.hover = null; UI.hoverPx = null; UI.hoverT = null; } });
cvs.addEventListener('contextmenu', e => e.preventDefault());
cvs.addEventListener('wheel', e => {
  e.preventDefault();
  const r = cvs.getBoundingClientRect();
  zoomAt(e.deltaY < 0 ? 1 : -1, (e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
  tutEvent('cam');
}, { passive: false });
addEventListener('keydown', e => {
  if (!G || /INPUT|TEXTAREA/.test(e.target.tagName)) return;
  KEYS[e.key.toLowerCase()] = true;
  if (UI.interior) {
    if (e.key === 'Escape') { if (FUI.tool) FUI.tool = null; else leaveFactory(); UI.dirty = true; return; }
    if (e.key === 'r' || e.key === 'R') { FUI.rot = (FUI.rot + 1) % 4; UI.dirty = true; return; }
  }
  if (e.key === 'Escape') { if (!$('menu').hidden && started) { hideMenu(); return; } if (UI.tool) UI.tool = null; else if (UI.landMode) UI.landMode = false; else if (UI.sel) UI.select(null); else showMenu(); UI.dirty = true; }
  else if (e.key === ' ') { e.preventDefault(); UI.speed = UI.speed ? 0 : (UI.prevSpeed || 1); }
  else if (e.key === '1') UI.speed = 1; else if (e.key === '2') UI.speed = 2; else if (e.key === '3') UI.speed = 4;
  else if (e.key === 'x' || e.key === 'X') { UI.tool = UI.tool === 'zbourat' ? null : 'zbourat'; UI.select(null); UI.dirty = true; }
  else if (e.key === 'l' || e.key === 'L') { UI.landMode = !UI.landMode; UI.tool = null; }
  else if (e.key === '+' || e.key === '=') zoomAt(1, 0.5, 0.5); else if (e.key === '-') zoomAt(-1, 0.5, 0.5);
  if (UI.speed) UI.prevSpeed = UI.speed;
});
addEventListener('keyup', e => { KEYS[e.key.toLowerCase()] = false; });
function keyPan(dt) {
  if (UI.interior) return;
  let dx = 0, dy = 0;
  if (KEYS.a || KEYS.arrowleft) dx--; if (KEYS.d || KEYS.arrowright) dx++;
  if (KEYS.w || KEYS.arrowup) dy--; if (KEYS.s || KEYS.arrowdown) dy++;
  if (dx || dy) { CAM.x += dx * dt * VW * 0.8; CAM.y += dy * dt * VW * 0.8; clampCam(); tutEvent('cam'); }
}
addEventListener('resize', () => fitCanvas());
$('menuBtn').addEventListener('click', () => { if (started) saveGame(); showMenu(); });
$('menu').addEventListener('click', e => { const el = e.target.closest('[data-m]'); if (el) menuAction(el.dataset.m); });
$('soundBtn').addEventListener('click', () => { Sound.init(); const on = Sound.toggle(); $('soundBtn').classList.toggle('muted', !on); if (on) Sound.music(1); });

/* ============ loop ============ */
let last = performance.now(), saveT = 60, nightState = null, evictT = 10;
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000); last = now;
  let mult = 0;
  try {
    if (started) { keyPan(dt); mult = simTick(dt, UI.speed); }
    updateFX(dt, dt * mult);
    render(dt);
    UI.frame(dt);
  } catch (err) { console.error(err); }
  saveT -= dt; if (saveT <= 0 && started) { saveT = 60; saveGame(); }
  evictT -= dt; if (evictT <= 0) { evictT = 10; evictChunks(Math.floor(CAM.x / TS / CH), Math.floor(CAM.y / TS / CH)); }
  const n = isNight(); if (n !== nightState) { nightState = n; Sound.setNight(n); }
  requestAnimationFrame(frame);
}
addEventListener('visibilitychange', () => { if (document.hidden && started) saveGame(); });
addEventListener('pagehide', () => { if (started) saveGame(); });

/* ============ benchmark (console: DK.bench()) ============ */
const DK = {
  bench() {
    const out = {}; let t0 = performance.now();
    for (let i = 0; i < 200; i++) simStep(0.05); out.simMsPerStep = +((performance.now() - t0) / 200).toFixed(3);
    t0 = performance.now(); for (let i = 0; i < 30; i++) render(0.016); out.renderMs = +((performance.now() - t0) / 30).toFixed(2);
    out.buildings = BLIST.length; out.cats = G.cats.length; out.chunks = CHUNKS.size; out.visible = VIS_BLD.length;
    return out;
  }
};

/* ============ boot ============ */
function boot(data) {
  let ok = false;
  if (data && data.v === 2) ok = deserialize(data);
  if (!ok) { const idx = slotIndex(); if (idx.last) ok = loadSlot(idx.last); }
  if (!ok) newGame({});
  $('soundBtn').classList.toggle('muted', !Sound.on);
  UI.init(); fitCanvas();
  requestAnimationFrame(frame);
  if (data && data.v === 2) startPlaying(); else showMenu();
}
const hot = window.claude && window.claude.hot;
try { if (hot && hot.snapshot) hot.snapshot(() => (G && started ? serialize() : null)); } catch (e) { /* no hot reload */ }
if (hot && hot.ready) hot.ready(boot); else boot(hot && hot.data);
