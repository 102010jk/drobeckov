'use strict';
/* ============ layout ============ */
function fit() {
  const view = $('view'), wrap = $('wrap');
  const vw = view.clientWidth, vh = view.clientHeight;
  if (!vw || !vh) return;
  const dpr = clamp(window.devicePixelRatio || 1, 1, 4);
  let s = Math.min(vw / PW, vh / PH);
  const snapped = Math.floor(s * dpr) / dpr;
  if (snapped >= s * 0.85) s = snapped; // crisp integer pixels unless that would shrink the view a lot
  const w = Math.round(PW * s), h = Math.round(PH * s);
  cvs.style.width = w + 'px'; cvs.style.height = h + 'px';
  wrap.style.width = w + 'px'; wrap.style.height = h + 'px';
}

/* ============ input ============ */
const DRAG_TOOLS = ['cesta', 'plot', 'kvetiny', 'stromek', 'zbourat', 'lavka'];
let dragging = false, lastDragTile = null;
function worldPos(e) {
  const r = cvs.getBoundingClientRect();
  const px = (e.clientX - r.left) / r.width * PW, py = (e.clientY - r.top) / r.height * PH;
  return [px, py, Math.floor(px / TS), Math.floor(py / TS)];
}
function tryPlace(hx, hy, fromDrag) {
  const type = UI.tool, d = B[type];
  if (d.tool) { if (demolishAt(hx, hy)) { UI.dirty = true; } return; }
  const [ax, ay] = anchorFor(type, hx, hy);
  const chk = canPlace(type, ax, ay);
  if (!chk.ok) { if (!fromDrag && chk.why) { toast(chk.why); Sound.nope(); } return; }
  place(type, ax, ay);
  Sound.place();
  for (let i = 0; i < 6; i++) addPart(ax * TS + rand(0, (d.w || 1) * TS), (ay + (d.h || 1)) * TS - 2, rand(-20, 20), rand(-30, -10), '#e8cc98', 0.4, { g: 120 });
  UI.dirty = true;
  if (!DRAG_TOOLS.includes(type) && (d.w || 1) > 1 && !fromDrag) UI.tool = null;
}
function onDown(e) {
  if (!G) return;
  Sound.init();
  const [px, py, hx, hy] = worldPos(e);
  if (e.button === 2) { if (UI.tool) UI.tool = null; else UI.select(null); UI.dirty = true; return; }
  if (e.button !== 0) return;
  cvs.setPointerCapture && cvs.setPointerCapture(e.pointerId);
  if (UI.tool) {
    tryPlace(hx, hy, false);
    if (UI.tool && DRAG_TOOLS.includes(UI.tool)) { dragging = true; lastDragTile = [hx, hy]; }
    return;
  }
  const c = catAt(px, py);
  if (c) { UI.select({ kind: 'c', id: c.id }); petCat(c); renderPane(true); return; }
  const b = bldAt(hx, hy);
  if (b && zoneOpen(hx, hy)) { UI.select({ kind: 'b', id: b.id }); Sound.click(); renderPane(true); return; }
  if (inb(hx, hy) && !zoneOpen(hx, hy)) { UI.select({ kind: 'z', id: zoneAt(hx, hy) }); Sound.click(); renderPane(true); return; }
  // tap near a zone sign that sits just outside
  UI.select(null); renderPane(true);
}
function onMove(e) {
  if (!G) return;
  const [px, py, hx, hy] = worldPos(e);
  UI.hoverPx = [px, py];
  UI.hover = inb(hx, hy) ? [hx, hy] : null;
  if (dragging && UI.tool && UI.hover && (!lastDragTile || lastDragTile[0] !== hx || lastDragTile[1] !== hy)) {
    // fill straight-line gaps so fast drags leave no holes
    const [lx, ly] = lastDragTile || [hx, hy];
    const steps = Math.max(Math.abs(hx - lx), Math.abs(hy - ly));
    for (let i = 1; i <= steps; i++) tryPlace(Math.round(lx + (hx - lx) * i / steps), Math.round(ly + (hy - ly) * i / steps), true);
    lastDragTile = [hx, hy];
  }
}
cvs.addEventListener('pointerdown', onDown);
cvs.addEventListener('pointermove', onMove);
addEventListener('pointerup', () => { dragging = false; lastDragTile = null; });
cvs.addEventListener('pointerleave', () => { if (!dragging) { UI.hover = null; UI.hoverPx = null; } });
cvs.addEventListener('contextmenu', e => e.preventDefault());
addEventListener('keydown', e => {
  if (!G || e.target.tagName === 'INPUT') return;
  if (e.key === 'Escape') { if (UI.tool) UI.tool = null; else UI.select(null); UI.dirty = true; }
  else if (e.key === ' ') { e.preventDefault(); UI.speed = UI.speed ? 0 : (UI.prevSpeed || 1); if (UI.speed) UI.prevSpeed = UI.speed; }
  else if (e.key === '1') UI.speed = 1; else if (e.key === '2') UI.speed = 2; else if (e.key === '3') UI.speed = 4;
  else if (e.key === 'x' || e.key === 'X') { UI.tool = UI.tool === 'zbourat' ? null : 'zbourat'; UI.select(null); UI.dirty = true; }
  if (UI.speed) UI.prevSpeed = UI.speed;
});
addEventListener('resize', fit);
try { new ResizeObserver(fit).observe($('view')); } catch (e) { /* older browsers: resize event covers it */ }

/* ============ start screen ============ */
let started = false, confirmNew = false;
function showStart() {
  const has = !!store.get(SAVE_KEY, null);
  $('startSub').textContent = has ? `${SEASONS[seasonIdx()].name}, den ${dayInSeason()} · ${G.cats.length} ${G.cats.length < 5 ? 'kočky' : 'koček'} · ${fmt(G.coins)} mincí` : 'útulná kočičí osada na celý rok';
  $('playBtn').textContent = has ? 'Pokračovat' : 'Začít';
  $('newBtn').hidden = !has;
  $('start').hidden = false;
}
$('playBtn').addEventListener('click', () => {
  Sound.init(); Sound.setSeason(seasonIdx()); Sound.music(1); Sound.click();
  $('start').hidden = true; started = true;
  if (!G.welcomed) { G.welcomed = true; banner('Vítej v Drobečkově', 'Babička Ježková ti poradí první kroky.'); }
});
$('newBtn').addEventListener('click', () => {
  if (!confirmNew) { confirmNew = true; $('newBtn').textContent = 'Opravdu začít znovu?'; setTimeout(() => { confirmNew = false; $('newBtn').textContent = 'Nová hra'; }, 3000); return; }
  confirmNew = false; $('newBtn').textContent = 'Nová hra';
  newGame(); VIS = []; UI.sel = null; UI.tool = null; saveGame(); showStart();
});
$('soundBtn').addEventListener('click', () => { Sound.init(); const on = Sound.toggle(); $('soundBtn').classList.toggle('muted', !on); if (on) Sound.music(1); });
$('menuBtn').addEventListener('click', () => { saveGame(); showStart(); });

/* ============ loop ============ */
let last = performance.now(), saveT = 20, nightState = null;
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000); last = now;
  let mult = 0;
  if (started) mult = simTick(dt, UI.speed);
  updateFX(dt, dt * mult);
  render(dt);
  UI.frame(dt);
  saveT -= dt; if (saveT <= 0 && started) { saveT = 20; saveGame(); }
  const n = isNight(); if (n !== nightState) { nightState = n; Sound.setNight(n); }
  requestAnimationFrame(frame);
}
addEventListener('visibilitychange', () => { if (document.hidden && started) saveGame(); });
addEventListener('pagehide', () => { if (started) saveGame(); });

function boot(data) {
  let ok = false;
  if (data && data.v) ok = deserialize(data);
  if (!ok) { const s = store.get(SAVE_KEY, null); ok = !!s && deserialize(s); }
  if (!ok) newGame();
  G.lastSeason = G.lastSeason == null ? seasonIdx() : G.lastSeason;
  Sound.setSeason(seasonIdx());
  $('soundBtn').classList.toggle('muted', !Sound.on);
  UI.init(); fit();
  requestAnimationFrame(frame);
  if (data && data.v) { started = true; $('start').hidden = true; } else showStart();
}
const hot = window.claude && window.claude.hot;
try { if (hot && hot.snapshot) hot.snapshot(() => (G ? serialize() : null)); } catch (e) { /* no hot reload */ }
if (hot && hot.ready) hot.ready(boot); else boot(hot && hot.data);
