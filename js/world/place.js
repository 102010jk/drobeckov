'use strict';
/* ============ buildings: lists, placement, demolition ============ */
let BLIST = [], CNT = {}, DOORS = new Map();
const allB = () => BLIST;
const countB = type => CNT[type] || 0;
const bldAt = (x, y) => { const t = tile(x, y); return t.b ? G.bld[t.b] : null; };
const homeBoard = () => BLIST.find(b => b.type === 'nastenka');
function rebuildLists() {
  BLIST = Object.values(G.bld); CNT = {}; DOORS = new Map();
  for (const b of BLIST) { if (b.built) CNT[b.type] = (CNT[b.type] || 0) + 1; if (b.dx != null) DOORS.set(b.dx + ',' + b.dy, b.id); }
}
function doorPos(type, x, y) {
  const d = B[type], w = d.w || 1, h = d.h || 1;
  if (d.water) {
    for (const [a, c] of [[0, 1], [-1, 0], [1, 0], [0, -1]]) {
      const tx = x + a, ty = y + c, t = tile(tx, ty);
      if (owned(tx, ty) && LAND.includes(t.gr) || (owned(tx, ty) && (t.gr === 'path' || t.gr === 'road' || t.gr === 'bridge'))) if (!t.b && !t.poi) return [tx, ty];
    }
    return null;
  }
  if (d.doorAt) return d.doorAt(x, y);
  return [x + Math.floor(w / 2), y + h];
}
const isDoorTile = (x, y) => DOORS.has(x + ',' + y);
function makeBld(type, x, y, built) {
  const d = B[type];
  const b = { id: G.nid++, type, x, y, w: d.w || 1, h: d.h || 1, built: !!built, inp: {}, out: {}, p: 0, workers: [] };
  if (!built) { b.need = Object.assign({}, d.mat || {}); if (d.wood) b.need.drevo = d.wood; b.work = d.work || 4; b.workTotal = b.work; }
  if (d.field) { b.crop = 'psenice'; b.st = 0; b.g = 0; }
  if (d.recipes) b.recipe = d.recipes[0];
  if (d.orchard) { b.age = 0; b.mature = false; }
  if (!d.nodoor) { const dp = doorPos(type, x, y); if (dp) { b.dx = dp[0]; b.dy = dp[1]; } }
  if (d.init) d.init(b);
  G.bld[b.id] = b;
  bidxAdd(b);
  for (let j = 0; j < b.h; j++) for (let i = 0; i < b.w; i++) { const t = tile(x + i, y + j); t.b = b.id; if (t.tree) { t.tree = null; markMod(x + i, y + j); } }
  resetBldTransient(b);
  return b;
}
function resetBldTransient(b) { b.inc = {}; b.outRes = {}; b.farmer = 0; b.builders = 0; b.working = false; b.lastWork = -9; b.active = false; }
function isUnlockedB(type) {
  const d = B[type]; if (!d) return false;
  if (d.flag) return !!G.flags[d.flag] && !BLIST.some(b => b.type === type);
  if (d.bp && !G.flags['bp_' + d.bp]) return false;
  if (d.era && eraOf() < d.era) return false;
  if (d.unique && BLIST.some(b => b.type === type)) return false;
  if (d.tech && !hasTech(d.tech)) return false;
  if (d.lock) return nbLevel(d.lock[0]) >= d.lock[1];
  return true;
}
function lockReason(type) {
  const d = B[type];
  if (d.flag) return G.flags[d.flag] ? 'Už stojí' : 'Dárek ze slavnosti';
  if (d.bp && !G.flags['bp_' + d.bp]) return 'Plán od sběratele';
  if (d.era && eraOf() < d.era) return 'Éra: ' + ERAS[d.era].n;
  if (d.unique && BLIST.some(b => b.type === type)) return 'Už stojí';
  if (d.tech && !hasTech(d.tech)) return 'Výzkum: ' + (TECH[d.tech] ? TECH[d.tech].n : d.tech);
  if (d.lock) return lockText(d.lock);
  return '';
}
const lockText = lk => lk ? `${NEIGH[lk[0]].n} ♥${lk[1]}` : '';
const clearable = t => !t.b || (G.bld[t.b] && B[G.bld[t.b].type].weak);
function terrOK(d, t) {
  if (d.ground === 'bridge' || d.water) return t.gr === 'water';
  if (d.ground) return t.gr === 'grass' || t.gr === 'sand' || t.gr === 'rock' || (d.ground === 'road' && t.gr === 'path');
  const allowed = d.terr || LAND;
  return allowed.includes(t.gr);
}
function costOK(d) {
  if (G.coins < d.cost) return 'Málo mincí';
  if ((d.instant || d.ground) && d.wood && avail('drevo') < d.wood) return 'Málo dřeva ve skladu';
  if ((d.instant || d.ground) && d.mat) for (const k in d.mat) if (avail(k) < d.mat[k]) return 'Chybí: ' + ITEMS[k].n.toLowerCase();
  return '';
}
function canPlace(type, x, y) {
  const d = B[type];
  if (!d || d.tool || d.fixed) return { ok: false, why: '' };
  if (!isUnlockedB(type)) return { ok: false, why: lockReason(type) };
  const w = d.w || 1, h = d.h || 1;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const tx = x + i, ty = y + j, t = tile(tx, ty);
    if (!owned(tx, ty)) return { ok: false, why: 'Tenhle pozemek ještě není tvůj' };
    if (t.poi) return { ok: false, why: POI_TYPES[t.poi.type].n + ' tu zůstane' };
    if (!clearable(t)) return { ok: false, why: 'Obsazeno' };
    if (d.ground === 'path' && t.gr === 'path') return { ok: false, why: '' };
    if (d.ground === 'road' && t.gr === 'road') return { ok: false, why: '' };
    if (!terrOK(d, t)) return { ok: false, why: d.water || d.ground === 'bridge' ? 'Patří na mělkou vodu u břehu' : d.terr ? 'Tady se to stavět nedá (' + (d.terrTxt || 'špatný terén') + ')' : t.gr === 'path' || t.gr === 'road' ? 'Na cestě se nestaví' : 'Na vodu ne' };
    if (!d.ground && isDoorTile(tx, ty)) return { ok: false, why: 'Tady jsou něčí dveře' };
  }
  if (d.need && !d.need(x, y)) return { ok: false, why: d.needTxt || 'Nevhodné místo' };
  if (!d.ground && !d.nodoor && !d.tree) {
    const dp = doorPos(type, x, y);
    if (!dp) return { ok: false, why: 'Chybí přístup ze břehu' };
    const [dx, dy] = dp, t = tile(dx, dy);
    if (!owned(dx, dy) || (t.b && !clearable(t)) || t.poi || t.gr === 'water' || t.gr === 'deep') return { ok: false, why: 'Dveře musí vést na volné místo' };
  }
  if (!d.ground) {
    const why = keepsAccess(x, y, w, h, !d.nodoor && !d.tree ? doorPos(type, x, y) : null);
    if (why) return { ok: false, why };
  }
  const c = costOK(d); if (c) return { ok: false, why: c };
  return { ok: true };
}
function place(type, x, y) {
  const d = B[type];
  reachDirty = true;
  G.coins -= d.cost;
  if ((d.instant || d.ground) && d.wood) takeStock('drevo', d.wood);
  if ((d.instant || d.ground) && d.mat) for (const k in d.mat) takeStock(k, d.mat[k]);
  // automatic clearing: trees and flower beds vanish, nothing is gained
  const w = d.w || 1, h = d.h || 1;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const t = tile(x + i, y + j);
    if (t.b && G.bld[t.b] && B[G.bld[t.b].type].weak) removeBld(G.bld[t.b], true);
    if (t.tree && !d.tree) { t.tree = null; markMod(x + i, y + j); }
  }
  if (d.ground) { tile(x, y).gr = d.ground; markMod(x, y); pathVersion++; return null; }
  if (d.tree) { tile(x, y).tree = { g: 0.08, v: Math.random() * 0.75, k: Math.random() < 0.3 ? 'birch' : 'round', planted: true }; markMod(x, y); return null; }
  const b = makeBld(type, x, y, !!d.instant);
  onBuildingsChanged();
  return b;
}
function demolishAt(x, y) {
  const t = tile(x, y); if (!owned(x, y)) return false;
  if (t.b) {
    const b = G.bld[t.b], d = B[b.type];
    if (d.fixed) { toast('Nástěnka zůstane.'); return false; }
    if (d.store && countB('spizirna') + countB('sklad') <= 1 && b.built) { toast('Poslední sklad zbourat nejde.'); return false; }
    demolish(b); return true;
  }
  if (t.tree) { t.tree = null; markMod(x, y); reachDirty = true; Sound.chop(); return true; }
  if (t.gr === 'path' || t.gr === 'bridge' || t.gr === 'road') { t.gr = t.gr === 'bridge' ? 'water' : 'grass'; markMod(x, y); reachDirty = true; pathVersion++; return true; }
  return false;
}
function removeBld(b, silent) {
  for (const c of G.cats) {
    if (c.task && (c.task.b === b.id || c.task.from === b.id || c.task.to === b.id || c.task.store === b.id)) abortTask(c);
    if (c.job === b.id) c.job = 0;
    if (c.home === b.id) { c.home = 0; if (c.inside) { c.inside = false; c.x = (b.dx + 0.5) * TS; c.y = (b.dy + 0.7) * TS; } }
  }
  for (let j = 0; j < b.h; j++) for (let i = 0; i < b.w; i++) tile(b.x + i, b.y + j).b = 0;
  bidxDel(b);
  delete G.bld[b.id];
  if (UI.sel && UI.sel.kind === 'b' && UI.sel.id === b.id) UI.select(null);
  reachDirty = true;
  onBuildingsChanged();
  if (!silent) Sound.place();
}
function demolish(b) {
  const d = B[b.type];
  for (const k in b.inp) addStock(k, b.inp[k]);
  for (const k in b.out) addStock(k, b.out[k]);
  const refundWood = Math.floor(((d.wood || 0) - ((b.need && b.need.drevo) || 0)) / 2);
  if (refundWood > 0) addStock('drevo', refundWood);
  G.coins += Math.floor(d.cost / 2);
  if (d.onDemolish) d.onDemolish(b);
  removeBld(b);
}
function onBuildingsChanged() { rebuildLists(); assignHomes(); UI.dirty = true; if (typeof jobsDirty !== 'undefined') jobsDirty = true; minimapDirty = true; }

/* ============ homes ============ */
const bedsOf = b => (B[b.type].beds || 0) + ((b.lvl || 1) - 1);
function assignHomes() {
  const houses = BLIST.filter(b => b.type === 'domek' && b.built);
  const count = {}; for (const c of G.cats) if (c.home) count[c.home] = (count[c.home] || 0) + 1;
  for (const c of G.cats) {
    if (c.home && G.bld[c.home]) continue;
    c.home = 0;
    const h = houses.find(b => (count[b.id] || 0) < bedsOf(b));
    if (h) { c.home = h.id; count[h.id] = (count[h.id] || 0) + 1; }
  }
}
const freeBeds = () => { let n = 0; for (const b of BLIST) if (b.type === 'domek' && b.built) n += bedsOf(b); return n - G.cats.filter(c => c.home).length; };
