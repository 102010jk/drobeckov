'use strict';
/* ============ 4.0: speed for hundreds to thousands of cats ============
   - buildings in a spatial grid; coziness, noise and "favourite decor near home" are looked up there and remembered
     until the buildings change (they used to walk the whole building list for every cat, twice a second)
   - best friends are indexed once a morning instead of every cat scanning every other cat
   - cats far off screen that are just working or sleeping think less often (their time is added up, nothing is lost) */

/* ---------- building grid (8×8 tile cells), rebuilt whenever the building list changes ---------- */
let BGRID = null, BGRID_V = null;
const MEMO = new Map();
function bgrid() {
  if (BGRID_V === BLIST) return BGRID;
  BGRID_V = BLIST; BGRID = new Map(); MEMO.clear();
  for (const b of BLIST) { if (!b.built) continue; const k = ((b.x >> 3) + 4096) * 8192 + ((b.y >> 3) + 4096); let a = BGRID.get(k); if (!a) BGRID.set(k, a = []); a.push(b); }
  return BGRID;
}
function bNear(x, y, r, fn) {
  const g = bgrid(), cx0 = (x - r - 6) >> 3, cx1 = (x + r) >> 3, cy0 = (y - r - 6) >> 3, cy1 = (y + r) >> 3;
  for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) { const a = g.get((cx + 4096) * 8192 + (cy + 4096)); if (a) for (const b of a) fn(b); }
}
function memo(key, f) { bgrid(); let v = MEMO.get(key); if (v === undefined) { v = f(); if (MEMO.size > 50000) MEMO.clear(); MEMO.set(key, v); } return v; }

cozyNear = function (x, y, r) {
  return memo('c' + x + ',' + y + ',' + r, () => {
    let c = 0;
    bNear(x, y, r, b => { const d = B[b.type]; if (!d.cozy || d.beds) return; if (Math.abs(b.x - x) <= r && Math.abs(b.y - y) <= r) c += d.cozy; });
    return c;
  });
};
noiseAt = function (x, y) {
  return memo('n' + x + ',' + y, () => {
    let n = 0;
    bNear(x, y, 8, b => {
      const d = B[b.type], dist = Math.max(Math.abs(b.x + (b.w - 1) / 2 - x), Math.abs(b.y + (b.h - 1) / 2 - y));
      if (d.noise && dist <= d.noise + 1) n += d.noise + 1.5 - dist;
      if (d.quiet && dist <= 3) n -= 1.5;
    });
    return Math.max(0, Math.round(n));
  });
};
favDecorNear = function (c) {
  const f = favOf(c).decor, home = c.home && G.bld[c.home];
  if (!home) return false;
  return memo('f' + home.id + f, () => { let ok = false; bNear(home.x, home.y, 7, b => { if (b.type === f && Math.abs(b.x - home.x) <= 7 && Math.abs(b.y - home.y) <= 7) ok = true; }); return ok; });
};

/* ---------- best friends: one index per morning ---------- */
let BF = null, BF_G = null, BF_V = -1;
MORNING_HOOKS.push(() => { BF = null; });
bestFriend = function (c) {
  if (!G.fr) return null;
  if (!BF || BF_G !== G || BF_V !== G.cats.length) {
    BF = new Map(); BF_G = G; BF_V = G.cats.length;
    const alive = new Map(G.cats.map(o => [o.id, o]));
    for (const key in G.fr) {
      const v = G.fr[key]; if (v < 3) continue;
      const i = key.indexOf(':'), a = +key.slice(0, i), b = +key.slice(i + 1);
      for (const [p, q] of [[a, b], [b, a]]) { const cur = BF.get(p); if (alive.has(q) && (!cur || v > cur[1])) BF.set(p, [alive.get(q), v]); }
    }
  }
  return BF.get(c.id) || null;
};

/* ---------- level of detail: off-screen cats that are busy in one place tick every few steps ---------- */
const LOD = { on: true, n: 3, step: 0, skipped: 0 };
const _updateCatP = updateCat;
updateCat = function (c, dt) {
  if (!LOD.on || G.cats.length < 150) return _updateCatP(c, dt);
  const k = c.task;
  const calm = k && !k.moving && (k.kind === 'work' || k.kind === 'sleep' || k.kind === 'rest');
  const far = c.x < VX - 64 || c.x > VX + VW + 64 || c.y < VY - 64 || c.y > VY + VH + 64;
  if (calm && far) {
    c._acc = (c._acc || 0) + dt;
    if ((c.id + LOD.step) % LOD.n) { LOD.skipped++; return; }
    const t = c._acc; c._acc = 0; return _updateCatP(c, t);
  }
  if (c._acc) { dt += c._acc; c._acc = 0; }
  return _updateCatP(c, dt);
};
STEP_HOOKS.unshift(() => { LOD.step++; });
if (typeof C_TRANSIENT !== 'undefined') C_TRANSIENT.push('_acc');

/* ---------- bigger simulation steps for big towns (movement stays smooth at these sizes) ---------- */
simTick = function (realDt, speed) {
  if (!speed) return 0;
  let mult = speed;
  if (isNight() && G.cats.length && G.cats.every(c => c.sleeping)) mult *= 5;
  G.playTime += realDt;
  const n = G.cats.length, stepMax = n > 700 ? 0.1 : n > 300 ? 0.075 : 0.05;
  let dt = realDt * mult;
  while (dt > 1e-6) { const s = Math.min(stepMax, dt); simStep(s); dt -= s; }
  return mult;
};

/* ---------- live numbers for the debug tab ---------- */
const PERF = { ms: 0, steps: 0, lod: 0 };
const _simTickP = simTick;
simTick = function (realDt, speed) {
  const t0 = performance.now(), s0 = LOD.skipped, r = _simTickP(realDt, speed);
  PERF.ms = PERF.ms * 0.9 + (performance.now() - t0) * 0.1; PERF.lod = LOD.skipped - s0;
  PERF.steps = Math.ceil(realDt * (r || 0) / (G.cats.length > 700 ? 0.1 : G.cats.length > 300 ? 0.075 : 0.05));
  return r;
};
