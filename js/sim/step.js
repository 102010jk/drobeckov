'use strict';
/* ============ simulation step ============ */
let alertT = 0, slowT = 0;
const STEP_HOOKS = [];      // later systems (factories, ships, research…) add per-step updates
function simStep(dt) {
  G.t += dt;
  if (mornIdx() > G.morning) onMorning();
  G.orderT -= dt;
  if (G.orderT <= 0) { G.orderT = rand(28, 48); if (G.orders.length < 4 + (G.orderSlots || 0)) genOrder(); }
  jobsT -= dt;
  if (jobsT <= 0 || jobsDirty) { jobsT = 0.25; buildJobs(); }
  updateBuildings(dt);
  for (const c of G.cats) updateCat(c, dt);
  updateVisitors(dt);
  for (const f of STEP_HOOKS) f(dt);
  alertT -= dt; if (alertT <= 0) { alertT = 0.5; updateAlerts(); }
  slowT -= dt; if (slowT <= 0) { slowT = 1; recomputeCozy(); tutTick(); }
}
function simTick(realDt, speed) {
  if (!speed) return 0;
  let mult = speed;
  if (isNight() && G.cats.length && G.cats.every(c => c.sleeping)) mult *= 5;
  G.playTime += realDt;
  let dt = realDt * mult;
  while (dt > 1e-6) { const s = Math.min(0.05, dt); simStep(s); dt -= s; }
  return mult;
}
