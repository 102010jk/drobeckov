'use strict';
/* ============ time ============ */
const hourOf = t => ((t / DAY) % 1) * 24;
const hour = () => hourOf(G.t);
const dayIdx = () => Math.floor(G.t / DAY);
const seasonIdx = () => Math.floor(dayIdx() / SDAYS) % 4;
const yearIdx = () => Math.floor(dayIdx() / (SDAYS * 4)) + 1;
const dayInSeason = () => dayIdx() % SDAYS + 1;
const mornIdx = () => Math.floor((G.t - 6 / 24 * DAY) / DAY);
const isNight = () => { const h = hour(); return h >= 21 || h < 6; };
const isDaylight = () => { const h = hour(); return h >= 6.5 && h < 20; };
let VIS = [];

/* ============ stock ============ */
const stockTotal = () => sumObj(G.stock);
function capacity() { let c = 0; for (const b of BLIST) if (b.built && B[b.type].store) c += B[b.type].store; return c; }
const avail = k => (G.stock[k] || 0) - (G.res[k] || 0);
function addStock(k, n) { if (n > 0) G.stock[k] = (G.stock[k] || 0) + n; }
function takeStock(k, n) { G.stock[k] = Math.max(0, (G.stock[k] || 0) - n); if (!G.stock[k]) delete G.stock[k]; }
const storeRoom = () => capacity() - stockTotal() - G.incStore;

/* ============ relations, research & unlocks ============ */
function nbLevel(k) { const xp = G.nb[k] || 0; let lv = 0; for (let i = 1; i < HEART_XP.length; i++) if (xp >= HEART_XP[i]) lv = i; return lv; }
const tier = () => Object.keys(NEIGH).reduce((a, k) => a + nbLevel(k), 0);
const xUnlocked = k => nbLevel(XLOCK[k][0]) >= XLOCK[k][1];
const recipeUnlocked = r => { const R_ = RECIPES[r]; if (!R_) return false; if (R_.tech && !hasTech(R_.tech)) return false; return !R_.lock || nbLevel(R_.lock[0]) >= R_.lock[1]; };
const cropUnlocked = c => !CROPS[c].lock || nbLevel(CROPS[c].lock[0]) >= CROPS[c].lock[1];
function producible(item, depth) {
  if ((depth || 0) > 5) return false;
  if (item === 'drevo') return true;
  if (CROPS[item]) return cropUnlocked(item);
  if (RAW_SOURCES[item]) return RAW_SOURCES[item]();
  if (item === 'ryby') return countB('molo') > 0 || isUnlockedB('molo');
  if (item === 'med') return isUnlockedB('vcelin');
  if (item === 'jablka') return isUnlockedB('jablon') || countB('jablon') > 0;
  const r = RECIPES[item]; if (!r) return false;
  if (!recipeUnlocked(item)) return false;
  const bt = recipeBuilding(item);
  if (!bt || !isUnlockedB(bt)) return false;
  return Object.keys(r.in).every(k => producible(k, (depth || 0) + 1));
}
const RECIPE_BLD = {};
function recipeBuilding(r) {
  if (RECIPE_BLD[r] !== undefined) return RECIPE_BLD[r];
  return (RECIPE_BLD[r] = Object.keys(B).find(k => B[k].recipes && B[k].recipes.includes(r)) || null);
}
function unlocksOf(nb) {
  const out = [];
  for (const k in B) if (B[k].lock && B[k].lock[0] === nb) out.push({ lv: B[k].lock[1], txt: B[k].n });
  for (const k in RECIPES) if (RECIPES[k].lock && RECIPES[k].lock[0] === nb) out.push({ lv: RECIPES[k].lock[1], txt: ITEMS[RECIPES[k].out].n + ' (recept)' });
  for (const k in CROPS) if (CROPS[k].lock && CROPS[k].lock[0] === nb) out.push({ lv: CROPS[k].lock[1], txt: CROPS[k].n + ' (plodina)' });
  for (const k in XLOCK) if (XLOCK[k][0] === nb) out.push({ lv: XLOCK[k][1], txt: XNAMES[k] });
  return out.sort((a, b) => a.lv - b.lv);
}

/* ============ coziness ============ */
let COZY = 0, cozyT = 0;
function coziness() { return COZY; }
function recomputeCozy() {
  let c = 0;
  for (const b of BLIST) if (b.built && B[b.type].cozy) c += B[b.type].cozy;
  for (const key in G.mods) { const m = G.mods[key]; for (const i in m) { const tr = m[i][1]; if (tr && tr[4] && tr[0] >= 0.5) c += 1; } }
  COZY = Math.floor(c + G.stats.fests * 2 + (G.stats.cozyBonus || 0));
}
const needCozy = n => (n < 3 ? 0 : 3 + (n - 3) * 4);
function cozyNear(x, y, r) {
  let c = 0;
  for (const b of BLIST) { const d = B[b.type]; if (!b.built || !d.cozy || d.beds) continue; if (Math.abs(b.x - x) <= r && Math.abs(b.y - y) <= r) c += d.cozy; }
  return c;
}
function flowersNear(b) { let n = 0; for (const o of BLIST) if (o.type === 'kvetiny' && Math.abs(o.x - b.x) <= 3 && Math.abs(o.y - b.y) <= 3) n++; return n; }
