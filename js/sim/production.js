'use strict';
/* ============ building helpers ============ */
const ctile = c => [Math.floor(c.x / TS), Math.floor(c.y / TS)];
const carryCap = c => 3 + (c.trait === 'silak' ? 1 : 0) + (xUnlocked('kosiky') ? 2 : 0) + (G.flags.voziky ? 3 : 0);
function access(b) {
  if (b.dx != null) return [b.dx, b.dy];
  const cands = [];
  for (let i = 0; i < b.w; i++) cands.push([b.x + i, b.y + b.h]);
  for (let j = 0; j < b.h; j++) { cands.push([b.x - 1, b.y + j]); cands.push([b.x + b.w, b.y + j]); }
  for (let i = 0; i < b.w; i++) cands.push([b.x + i, b.y - 1]);
  for (const [x, y] of cands) if (walkable(x, y)) return [x, y];
  return null;
}
function standPx(b, c) {
  const d = B[b.type];
  if (d.field) return [b.x * TS + 5 + ((c.id * 37) % 22), b.y * TS + 12 + ((c.id * 53) % 16)];
  if (d.water) return [b.x * TS + 8, b.y * TS + 9];
  if (d.rest) return [b.x * TS + 8, b.y * TS + 11];
  if (d.play) return [b.x * TS + 5, b.y * TS + 3];
  const a = access(b); if (!a) return null;
  if (b.dx != null) return [b.x * TS + b.w * 8 + ((c.id * 13) % 9) - 4, (b.y + b.h) * TS + 5];
  return [a[0] * TS + 8, a[1] * TS + 10];
}
function nearestStore(x, y) {
  let best = null, bd = 1e9;
  for (const b of BLIST) { if (!B[b.type].store || !b.built) continue; const a = access(b); if (!a) continue; const d = Math.abs(a[0] - x) + Math.abs(a[1] - y); if (d < bd) { bd = d; best = b; } }
  return best;
}
const TRAIT_BLD = { pekar: ['pekarna', 'kuchynka', 'cukrarna'], zahradnik: ['kravin', 'ovcin'], rybar: ['molo', 'rybarna'], drevar: ['drevorubec', 'pila'] };
function workMul(c, b) {
  let m = 0.6 + clamp(c.mood, 0, 100) / 100 * 0.7;
  const t = c.trait, ty = b ? b.type : '';
  if (t === 'pekar' && TRAIT_BLD.pekar.includes(ty)) m *= 1.4;
  if (t === 'zahradnik' && ((B[ty] && B[ty].field) || TRAIT_BLD.zahradnik.includes(ty))) m *= 1.5;
  if (t === 'rybar' && TRAIT_BLD.rybar.includes(ty)) m *= 1.6;
  if (t === 'drevar' && (TRAIT_BLD.drevar.includes(ty) || (b && !b.built))) m *= 1.5;
  if (c.prof === 'inzenyr' && B[ty] && B[ty].industry) m *= 1.4;
  if (c.energy < 10) m *= 0.7;
  return m;
}
const traitFits = (tr, ty) => !!(TRAIT_BLD[tr] && TRAIT_BLD[tr].includes(ty));
function chopTarget(b) {
  const r = B[b.type].chop, cx = b.x + 0.5, cy = b.y + 0.5;
  let best = null, bd = 1e9;
  for (let y = b.y - r; y <= b.y + 1 + r; y++) for (let x = b.x - r; x <= b.x + 1 + r; x++) {
    if (!owned(x, y)) continue;
    const t = tile(x, y);
    if (!t.tree || t.tree.g < 1) continue;
    const d = Math.abs(x - cx) + Math.abs(y - cy);
    if (d < bd) { bd = d; best = { x, y, tree: t.tree }; }
  }
  return best;
}
const cropOK = b => cropUnlocked(b.crop) && (B[b.type].glass || CROPS[b.crop].s[seasonIdx()] === 1);
function fieldNeedsWork(b) {
  if (b.st === 0) return cropOK(b);
  if (b.st === 2) return sumObj(b.out) + CROPS[b.crop].yield <= 16;
  return false;
}
function canWork(b) {
  const d = B[b.type];
  if (!b.built || isNight()) return false;
  if (d.canWork) return d.canWork(b);
  if (d.recipes) {
    const r = RECIPES[b.recipe]; if (!r) return false;
    if (b.cyc) return true;
    if (sumObj(b.out) >= OUTCAP) return false;
    return Object.keys(r.in).every(k => (b.inp[k] || 0) >= r.in[k]);
  }
  if (d.fish) return sumObj(b.out) < 4;
  if (d.chop) return sumObj(b.out) < OUTCAP && !!chopTarget(b);
  if (d.market) return sumObj(b.inp) > 0;
  return false;
}
function inNeed(b, item) {
  const d = B[b.type];
  if (!b.built) return b.need && b.need[item] ? b.need[item] - (b.inc[item] || 0) : 0;
  if (d.inNeed) return d.inNeed(b, item);
  if (d.recipes) { const r = RECIPES[b.recipe]; if (!r || !r.in[item]) return 0; return r.in[item] * 3 - (b.inp[item] || 0) - (b.inc[item] || 0); }
  if (d.market) { if (!G.sell[item]) return 0; return Math.min(4 - (b.inp[item] || 0) - (b.inc[item] || 0), 8 - sumObj(b.inp) - sumObj(b.inc)); }
  return 0;
}
/* items a building wants delivered (for the job board) */
function wantedItems(b) {
  const d = B[b.type];
  if (d.wants) return d.wants(b);
  if (d.recipes) return Object.keys((RECIPES[b.recipe] || { in: {} }).in);
  if (d.market) return Object.keys(G.sell).filter(k => G.sell[k] && (G.stock[k] || 0) > 0);
  return null;
}

/* ============ production ============ */
function produce(b, amt) {
  const d = B[b.type];
  if (d.produce) { d.produce(b, amt); b.lastWork = G.t; return; }
  if (d.recipes) {
    const r = RECIPES[b.recipe];
    if (!b.cyc) { for (const k in r.in) { b.inp[k] -= r.in[k]; if (b.inp[k] <= 0) delete b.inp[k]; } b.cyc = true; b.p = 0; }
    b.p += amt / r.t;
    if (b.p >= 1) { b.cyc = false; b.p = 0; b.out[r.out] = (b.out[r.out] || 0) + r.n; G.stats.made[r.out] = (G.stats.made[r.out] || 0) + r.n; puff(b); }
  } else if (d.fish) {
    b.p += amt / d.fish * (seasonIdx() === 3 ? 0.5 : 1);
    if (b.p >= 1) { b.p = 0; b.out.ryby = (b.out.ryby || 0) + 1; G.stats.made.ryby = (G.stats.made.ryby || 0) + 1; splash(b.x * TS + 8, b.y * TS + 14); }
  } else if (d.chop) {
    b.p += amt / 10;
    if (b.p >= 1) {
      b.p = 0; const tg = chopTarget(b);
      if (tg) { tg.tree.g = 0; tg.tree.cut = true; markMod(tg.x, tg.y); b.out.drevo = (b.out.drevo || 0) + 2; Sound.chop(); leafBurst(tg.x * TS + 8, tg.y * TS + 6); }
    }
  }
  b.lastWork = G.t;
}
function setRecipe(b, r) {
  if (b.recipe === r || !recipeUnlocked(r)) return;
  if (b.cyc) { const old = RECIPES[b.recipe]; for (const k in old.in) b.out[k] = (b.out[k] || 0) + old.in[k]; b.cyc = false; b.p = 0; }
  const nr = RECIPES[r];
  for (const k in b.inp) if (!nr.in[k]) { b.out[k] = (b.out[k] || 0) + b.inp[k]; delete b.inp[k]; }
  b.recipe = r; UI.dirty = true; jobsDirty = true;
}
function setCrop(b, c) { if (!cropUnlocked(c)) return; b.crop = c; if (b.st === 1 && b.g < 0.15) b.g = 0; UI.dirty = true; }
function completeBuilding(b) {
  b.built = true; delete b.need; b.work = 0;
  Sound.built(); sparkle(b.x * TS + b.w * 8, b.y * TS + b.h * 8, '#ffd23f', 12, b.w * 6);
  toast('Hotovo: ' + B[b.type].n);
  if (B[b.type].onBuilt) B[b.type].onBuilt(b);
  autoAssign(b);
  if (B[b.type].workers && !b.workers.length) setTimeout(() => toast(`${B[b.type].n} nemá pracovníka — klikni na ni a přiřaď kočku.`), 2300);
  onBuildingsChanged();
  tutEvent('built', b.type);
}
function updateBuildings(dt) {
  const S = seasonIdx(), day = isDaylight(), rain = G.weather === 'rain';
  for (const b of BLIST) {
    if (!b.built) continue;
    const d = B[b.type];
    b.working = G.t - b.lastWork < 0.4;
    if (d.tick) d.tick(b, dt);
    if (d.field) {
      if (b.st === 1 && (d.glass || CROPS[b.crop].s[S])) {
        b.g += dt / CROPS[b.crop].grow * (rain && !d.glass ? 1.3 : 1) * (d.glass ? 0.8 : 1);
        if (b.g >= 1) { b.g = 1; b.st = 2; }
      }
    } else if (d.bees) {
      b.active = S < 3 && day;
      if (b.active && sumObj(b.out) < 4) { b.p += dt / 35 * (1 + 0.2 * flowersNear(b)) * (rain ? 0.5 : 1); if (b.p >= 1) { b.p = 0; b.out.med = (b.out.med || 0) + 1; G.stats.made.med = (G.stats.made.med || 0) + 1; } }
    } else if (d.orchard) {
      if (!b.mature) { b.age += dt; if (b.age >= 1.5 * DAY) b.mature = true; }
      else if ((S === 1 || S === 2) && sumObj(b.out) < 4) { b.p += dt / 22; if (b.p >= 1) { b.p = 0; b.out.jablka = (b.out.jablka || 0) + 1; } }
    }
  }
  // growing trees (planted saplings and regrowing stumps only)
  for (let i = G.growing.length - 1; i >= 0; i--) {
    const [x, y] = G.growing[i], t = tile(x, y);
    if (!t.tree || t.tree.g >= 1) { G.growing.splice(i, 1); continue; }
    const before = t.tree.g;
    t.tree.g = Math.min(1, t.tree.g + dt / (2 * DAY));
    if (t.tree.g >= 0.2) t.tree.cut = false;
    if (Math.floor(before * 4) !== Math.floor(t.tree.g * 4) || t.tree.g >= 1) markMod(x, y);
  }
}
function updateAlerts() {
  for (const b of BLIST) {
    const d = B[b.type]; b.alert = null;
    if (b.type === 'nastenka') b.papers = G.orders.length;
    if (!b.built) { if (b.need) for (const k in b.need) if (b.need[k] > 0 && avail(k) <= 0) { b.alert = { item: k }; break; } continue; }
    if (d.workers && !b.workers.length) { b.alert = 'zz'; continue; }
    if (d.alert) { b.alert = d.alert(b); if (b.alert) continue; }
    if (d.recipes && !isNight()) {
      const r = RECIPES[b.recipe];
      if (sumObj(b.out) >= OUTCAP && storeRoom() <= 0) b.alert = { item: 'box' };
      else if (!b.cyc) { const miss = Object.keys(r.in).find(k => (b.inp[k] || 0) + (b.inc[k] || 0) < r.in[k] && avail(k) <= 0); if (miss) b.alert = { item: miss }; }
    }
    if (d.chop && !chopTarget(b)) b.alert = 'bang';
    if (d.field && b.st === 2 && sumObj(b.out) + CROPS[b.crop].yield > 16 && storeRoom() <= 0) b.alert = { item: 'box' };
  }
}

/* ============ workers ============ */
function assignWorker(b, catId) {
  const d = B[b.type]; const slots = workerSlots(b); if (!slots) return;
  const c = G.cats.find(x => x.id === catId); if (!c) return;
  if (c.job && G.bld[c.job]) G.bld[c.job].workers = G.bld[c.job].workers.filter(i => i !== c.id);
  if (b.workers.length >= slots) { const old = b.workers.shift(); const oc = G.cats.find(x => x.id === old); if (oc) { oc.job = 0; if (oc.task && oc.task.kind === 'work') abortTask(oc); } }
  b.workers.push(c.id); c.job = b.id;
  if (c.task && c.task.kind === 'work') abortTask(c);
  UI.dirty = true;
  tutEvent('assign', b.type);
  void d;
}
const workerSlots = b => { const d = B[b.type]; return d.slots ? d.slots(b) : d.workers || 0; };
function unassign(catId) {
  const c = G.cats.find(x => x.id === catId); if (!c) return;
  if (c.job && G.bld[c.job]) G.bld[c.job].workers = G.bld[c.job].workers.filter(i => i !== c.id);
  c.job = 0; if (c.task && c.task.kind === 'work') abortTask(c);
  UI.dirty = true;
}
function autoAssign(b) {
  const slots = workerSlots(b); if (!slots || b.workers.length >= slots) return;
  const free = G.cats.filter(c => !c.job && (!B[b.type].prof || c.prof === B[b.type].prof)); if (!free.length) return;
  const best = free.find(c => traitFits(c.trait, b.type)) || free[0];
  assignWorker(b, best.id);
  toast(`${best.name} teď pracuje: ${B[b.type].n}`);
}
