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
const sumObj = o => { let s = 0; if (o) for (const k in o) s += o[k]; return s; };
let VIS = [];

/* ============ stock ============ */
const stockTotal = () => sumObj(G.stock);
const capacity = () => countB('spizirna') * B.spizirna.store;
const avail = k => (G.stock[k] || 0) - (G.res[k] || 0);
function addStock(k, n) { if (n > 0) G.stock[k] = (G.stock[k] || 0) + n; }
function takeStock(k, n) { G.stock[k] = Math.max(0, (G.stock[k] || 0) - n); if (!G.stock[k]) delete G.stock[k]; }
const storeRoom = () => capacity() - stockTotal() - G.incStore;

/* ============ relations & unlocks ============ */
function nbLevel(k) { const xp = G.nb[k] || 0; let lv = 0; for (let i = 1; i < HEART_XP.length; i++) if (xp >= HEART_XP[i]) lv = i; return lv; }
const tier = () => Object.keys(NEIGH).reduce((a, k) => a + nbLevel(k), 0);
const xUnlocked = k => nbLevel(XLOCK[k][0]) >= XLOCK[k][1];
const recipeUnlocked = r => !RECIPES[r].lock || nbLevel(RECIPES[r].lock[0]) >= RECIPES[r].lock[1];
const cropUnlocked = c => !CROPS[c].lock || nbLevel(CROPS[c].lock[0]) >= CROPS[c].lock[1];
function producible(item, depth) {
  if ((depth || 0) > 4) return false;
  if (item === 'drevo') return true;
  if (CROPS[item]) return cropUnlocked(item);
  if (item === 'ryby') return !!G.zones.potok;
  if (item === 'med') return isUnlockedB('vcelin');
  if (item === 'jablka') return !!G.zones.sad || isUnlockedB('jablon');
  const r = RECIPES[item]; if (!r) return false;
  const bt = Object.keys(B).find(k => B[k].recipes && B[k].recipes.includes(item));
  if (!bt || !isUnlockedB(bt) || !recipeUnlocked(item)) return false;
  return Object.keys(r.in).every(k => producible(k, (depth || 0) + 1));
}
function unlocksOf(nb) {
  const out = [];
  for (const k in B) if (B[k].lock && B[k].lock[0] === nb) out.push({ lv: B[k].lock[1], txt: B[k].n });
  for (const k in RECIPES) if (RECIPES[k].lock && RECIPES[k].lock[0] === nb) out.push({ lv: RECIPES[k].lock[1], txt: ITEMS[k].n + ' (recept)' });
  for (const k in CROPS) if (CROPS[k].lock && CROPS[k].lock[0] === nb) out.push({ lv: CROPS[k].lock[1], txt: CROPS[k].n + ' (plodina)' });
  for (const k in XLOCK) if (XLOCK[k][0] === nb) out.push({ lv: XLOCK[k][1], txt: XNAMES[k] });
  return out.sort((a, b) => a.lv - b.lv);
}

/* ============ coziness ============ */
function coziness() {
  let c = 0;
  for (const id in G.bld) { const b = G.bld[id]; if (b.built && B[b.type].cozy && zoneOpen(b.x, b.y)) c += B[b.type].cozy; }
  for (const t of G.grid) if (t.tree && t.tree.planted && t.tree.g >= 0.5) c += 1;
  return Math.floor(c + G.stats.fests * 2);
}
const needCozy = n => (n < 2 ? 0 : 4 + (n - 2) * 5);
function cozyNear(x, y, r) {
  let c = 0;
  for (const id in G.bld) { const b = G.bld[id], d = B[b.type]; if (!b.built || !d.cozy || d.beds) continue; if (Math.abs(b.x - x) <= r && Math.abs(b.y - y) <= r) c += d.cozy; }
  return c;
}
function flowersNear(b) { let n = 0; for (const id in G.bld) { const o = G.bld[id]; if (o.type === 'kvetiny' && Math.abs(o.x - b.x) <= 3 && Math.abs(o.y - b.y) <= 3) n++; } return n; }

/* ============ helpers ============ */
const ctile = c => [Math.floor(c.x / TS), Math.floor(c.y / TS)];
const carryCap = c => 3 + (c.trait === 'silak' ? 1 : 0) + (xUnlocked('kosiky') ? 2 : 0);
function access(b) {
  if (b.dx != null) return [b.dx, b.dy];
  const cands = [];
  for (let i = 0; i < b.w; i++) cands.push([b.x + i, b.y + b.h]);
  for (let j = 0; j < b.h; j++) { cands.push([b.x - 1, b.y + j]); cands.push([b.x + b.w, b.y + j]); }
  for (let i = 0; i < b.w; i++) cands.push([b.x + i, b.y - 1]);
  for (const [x, y] of cands) if (inb(x, y) && walkable(x, y)) return [x, y];
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
  for (const id in G.bld) { const b = G.bld[id]; if (b.type !== 'spizirna' || !b.built) continue; const a = access(b); if (!a) continue; const d = Math.abs(a[0] - x) + Math.abs(a[1] - y); if (d < bd) { bd = d; best = b; } }
  return best;
}
function workMul(c, b) {
  let m = 0.6 + clamp(c.mood, 0, 100) / 100 * 0.7;
  const t = c.trait, ty = b ? b.type : '';
  if (t === 'pekar' && (ty === 'pekarna' || ty === 'kuchynka' || ty === 'cukrarna')) m *= 1.4;
  if (t === 'zahradnik' && ((B[ty] && B[ty].field) || ty === 'kravin')) m *= 1.5;
  if (t === 'rybar' && ty === 'molo') m *= 1.6;
  if (t === 'drevar' && (ty === 'drevorubec' || (b && !b.built))) m *= 1.5;
  if (c.energy < 10) m *= 0.7;
  return m;
}
function traitFits(tr, ty) {
  return (tr === 'pekar' && (ty === 'pekarna' || ty === 'kuchynka' || ty === 'cukrarna')) || (tr === 'zahradnik' && ty === 'kravin') ||
    (tr === 'rybar' && ty === 'molo') || (tr === 'drevar' && ty === 'drevorubec');
}
function chopTarget(b) {
  const r = B[b.type].chop, cx = b.x + 0.5, cy = b.y + 0.5;
  let best = null, bd = 1e9;
  for (let y = Math.max(0, b.y - r); y <= Math.min(MH - 1, b.y + 1 + r); y++) for (let x = Math.max(0, b.x - r); x <= Math.min(MW - 1, b.x + 1 + r); x++) {
    const t = G.grid[idx(x, y)];
    if (!t.tree || t.tree.g < 1 || !zoneOpen(x, y)) continue;
    const d = Math.abs(x - cx) + Math.abs(y - cy);
    if (d < bd) { bd = d; best = { x, y, tree: t.tree }; }
  }
  return best;
}
const cropOK = b => cropUnlocked(b.crop) && (B[b.type].glass || CROPS[b.crop].s[seasonIdx()] === 1);
function fieldNeedsWork(b) {
  if (!zoneOpen(b.x, b.y)) return false;
  if (b.st === 0) return cropOK(b);
  if (b.st === 2) return sumObj(b.out) + CROPS[b.crop].yield <= 16;
  return false;
}
function canWork(b) {
  const d = B[b.type];
  if (!b.built || isNight()) return false;
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
  if (d.recipes) { const r = RECIPES[b.recipe]; if (!r || !r.in[item]) return 0; return r.in[item] * 3 - (b.inp[item] || 0) - (b.inc[item] || 0); }
  if (d.market) { if (!G.sell[item]) return 0; return Math.min(4 - (b.inp[item] || 0) - (b.inc[item] || 0), 8 - sumObj(b.inp) - sumObj(b.inc)); }
  return 0;
}

/* ============ production ============ */
function produce(b, amt) {
  const d = B[b.type];
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
      if (tg) { tg.tree.g = 0; tg.tree.cut = true; b.out.drevo = (b.out.drevo || 0) + 2; Sound.chop(); leafBurst(tg.x * TS + 8, tg.y * TS + 6); }
    }
  }
  b.lastWork = G.t;
}
function setRecipe(b, r) {
  if (b.recipe === r || !recipeUnlocked(r)) return;
  if (b.cyc) { const old = RECIPES[b.recipe]; for (const k in old.in) b.out[k] = (b.out[k] || 0) + old.in[k]; b.cyc = false; b.p = 0; }
  const nr = RECIPES[r];
  for (const k in b.inp) if (!nr.in[k]) { b.out[k] = (b.out[k] || 0) + b.inp[k]; delete b.inp[k]; }
  b.recipe = r; UI.dirty = true;
}
function setCrop(b, c) { if (!cropUnlocked(c)) return; b.crop = c; if (b.st === 1 && b.g < 0.15) b.g = 0; UI.dirty = true; }
function completeBuilding(b) {
  b.built = true; delete b.need; b.work = 0;
  Sound.built(); sparkle(b.x * TS + b.w * 8, b.y * TS + b.h * 8, '#ffd23f', 12, b.w * 6);
  toast('Hotovo: ' + B[b.type].n);
  autoAssign(b);
  if (B[b.type].workers && !b.workers.length) setTimeout(() => toast(`${B[b.type].n} nemá pracovníka — klikni na ni a přiřaď kočku.`), 2300);
  onBuildingsChanged();
}
function updateBuildings(dt) {
  const S = seasonIdx(), day = isDaylight(), rain = G.weather === 'rain';
  for (const id in G.bld) {
    const b = G.bld[id]; if (!b.built) continue;
    const d = B[b.type];
    b.working = G.t - b.lastWork < 0.4;
    if (d.field) {
      if (b.st === 1 && zoneOpen(b.x, b.y) && (d.glass || CROPS[b.crop].s[S])) {
        b.g += dt / CROPS[b.crop].grow * (rain && !d.glass ? 1.3 : 1) * (d.glass ? 0.8 : 1);
        if (b.g >= 1) { b.g = 1; b.st = 2; }
      }
    } else if (d.bees) {
      b.active = S < 3 && day && zoneOpen(b.x, b.y);
      if (b.active && sumObj(b.out) < 4) { b.p += dt / 35 * (1 + 0.2 * flowersNear(b)) * (rain ? 0.5 : 1); if (b.p >= 1) { b.p = 0; b.out.med = (b.out.med || 0) + 1; G.stats.made.med = (G.stats.made.med || 0) + 1; } }
    } else if (d.orchard) {
      if (!zoneOpen(b.x, b.y)) continue;
      if (!b.mature) { b.age += dt; if (b.age >= 1.5 * DAY) b.mature = true; }
      else if ((S === 1 || S === 2) && sumObj(b.out) < 4) { b.p += dt / 22; if (b.p >= 1) { b.p = 0; b.out.jablka = (b.out.jablka || 0) + 1; } }
    }
  }
  for (const t of G.grid) if (t.tree && t.tree.g < 1) { t.tree.g = Math.min(1, t.tree.g + dt / (2 * DAY)); if (t.tree.g >= 0.2) t.tree.cut = false; }
}
function updateAlerts() {
  for (const id in G.bld) {
    const b = G.bld[id], d = B[b.type]; b.alert = null;
    if (!zoneOpen(b.x, b.y)) continue;
    if (!b.built) { if (b.need && b.need.drevo > 0 && avail('drevo') <= 0) b.alert = { item: 'drevo' }; continue; }
    if (d.workers && !b.workers.length) { b.alert = 'zz'; continue; }
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
  const d = B[b.type]; if (!d.workers) return;
  const c = G.cats.find(x => x.id === catId); if (!c) return;
  if (c.job && G.bld[c.job]) G.bld[c.job].workers = G.bld[c.job].workers.filter(i => i !== c.id);
  if (b.workers.length >= d.workers) { const old = b.workers.shift(); const oc = G.cats.find(x => x.id === old); if (oc) { oc.job = 0; if (oc.task && oc.task.kind === 'work') abortTask(oc); } }
  b.workers.push(c.id); c.job = b.id;
  if (c.task && c.task.kind === 'work') abortTask(c);
  UI.dirty = true;
}
function unassign(catId) {
  const c = G.cats.find(x => x.id === catId); if (!c) return;
  if (c.job && G.bld[c.job]) G.bld[c.job].workers = G.bld[c.job].workers.filter(i => i !== c.id);
  c.job = 0; if (c.task && c.task.kind === 'work') abortTask(c);
  UI.dirty = true;
}
function autoAssign(b) {
  const d = B[b.type]; if (!d.workers || b.workers.length >= d.workers) return;
  const free = G.cats.filter(c => !c.job); if (!free.length) return;
  const best = free.find(c => traitFits(c.trait, b.type)) || free[0];
  assignWorker(b, best.id);
  toast(`${best.name} teď pracuje: ${d.n}`);
}

/* ============ cat AI ============ */
function recount() {
  G.res = {}; G.incStore = 0;
  for (const id in G.bld) { const b = G.bld[id]; b.inc = {}; b.outRes = {}; b.farmer = 0; b.builders = 0; }
  for (const c of G.cats) {
    const k = c.task; if (!k) continue;
    if (k.kind === 'haul') {
      if (k.stage === 'src') {
        if (k.from === 'S') G.res[k.item] = (G.res[k.item] || 0) + k.n;
        else { const b = G.bld[k.from]; if (b) b.outRes[k.item] = (b.outRes[k.item] || 0) + k.n; }
      }
      if (k.to === 'S') G.incStore += k.n;
      else { const b = G.bld[k.to]; if (b) b.inc[k.item] = (b.inc[k.item] || 0) + k.n; }
    } else if (k.kind === 'eat' && k.stage === 'src') G.res[k.item] = (G.res[k.item] || 0) + 1;
    else if (k.kind === 'farm') { const b = G.bld[k.b]; if (b) b.farmer = c.id; }
    else if (k.kind === 'build') { const b = G.bld[k.b]; if (b) b.builders++; }
  }
}
function abortTask(c) {
  if (c.carry) { addStock(c.carry.item, c.carry.n); c.carry = null; }
  c.task = null; c.path = []; c.dest = null; c.think = rand(0.2, 0.6);
}
function endTask(c) { c.task = null; c.path = []; c.dest = null; c.think = rand(0.15, 0.5); }
function emote(c, e, t) { c.emote = e; c.emoteT = t || 1.6; }

function eatTask(c) {
  const item = FOODS.find(k => avail(k) > 0);
  return item ? { kind: 'eat', item, stage: 'src' } : null;
}
/* a cat stuck in a pocket (walled in by new buildings or trees) hops out to the nearest reachable tile */
function unstick(c) {
  const R = getReach(), [cx, cy] = ctile(c);
  const ok = (x, y) => inb(x, y) && R[idx(x, y)];
  if (ok(cx, cy) || ok(cx + 1, cy) || ok(cx - 1, cy) || ok(cx, cy + 1) || ok(cx, cy - 1)) return;
  let best = null, bd = 1e9;
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) if (R[idx(x, y)]) { const d = Math.abs(x - cx) + Math.abs(y - cy); if (d < bd) { bd = d; best = [x, y]; } }
  if (!best) return;
  sparkle(c.x, c.y - 4, '#fff4dc', 6, 4);
  c.x = best[0] * TS + 8; c.y = best[1] * TS + 10;
  sparkle(c.x, c.y - 4, '#fff4dc', 6, 4);
}
function think(c) {
  unstick(c);
  recount();
  if (isNight()) {
    if (c.food < 60) { const t = eatTask(c); if (t && startTask(c, t)) return; }
    if (!startTask(c, { kind: 'sleep', night: true })) { c.task = { kind: 'sleep', night: true, b: 0, moving: false }; arrive(c); }
    return;
  }
  if (c.food < 40) { const t = eatTask(c); if (t && startTask(c, t)) return; if (!t && Math.random() < 0.3) emote(c, 'fish', 2); }
  if (c.energy < 12) { startTask(c, { kind: 'sleep', nap: true }); return; }
  if (c.mood < 22 && Math.random() < 0.25) { emote(c, 'sad', 3); startTask(c, { kind: 'idle', t: rand(4, 7) }); return; }
  const cands = [];
  const [cx, cy] = ctile(c), here = [cx, cy];
  const dist = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
  const own = c.job;
  const add = (task, pri, d) => {
    if (own && task.kind === 'haul') { if (task.to === own) pri += 1.5; else if (task.from === own) pri += 0.8; }
    cands.push({ task, s: pri * 100 / (8 + d) });
  };
  const wp = c.job && G.bld[c.job];
  if (wp && wp.built && canWork(wp)) cands.push({ task: { kind: 'work', b: wp.id }, s: 1e6 });
  const cap = carryCap(c), room = storeRoom();
  const blds = allB();
  for (const b of blds) {
    const d = B[b.type];
    if (!zoneOpen(b.x, b.y)) continue;
    if (b.unreach && G.t - b.unreach < 5) continue;
    const a = access(b); if (!a) continue;
    if (!b.built) {
      let pending = false;
      for (const item in (b.need || {})) {
        if (b.need[item] > 0) pending = true;
        const rem = b.need[item] - (b.inc[item] || 0);
        if (rem > 0 && avail(item) > 0) { const st = nearestStore(a[0], a[1]); if (st) { const sa = access(st); add({ kind: 'haul', from: 'S', to: b.id, item, n: Math.min(cap, rem, avail(item)) }, 3, dist(here, sa) + dist(sa, a)); } }
      }
      if (!pending && b.builders < 2) add({ kind: 'build', b: b.id }, 2.8 + (c.trait === 'drevar' ? 0.6 : 0), dist(here, a));
      continue;
    }
    if (d.field && !b.farmer && fieldNeedsWork(b)) add({ kind: 'farm', b: b.id }, 2.6 + (c.trait === 'zahradnik' ? 0.8 : 0), dist(here, a));
    for (const item in b.out) {
      const free = b.out[item] - (b.outRes[item] || 0); if (free <= 0) continue;
      const full = sumObj(b.out) >= OUTCAP;
      let best = null, bd = 1e9;
      for (const b2 of blds) {
        if (b2 === b || B[b2.type].market || !zoneOpen(b2.x, b2.y)) continue;
        if (inNeed(b2, item) <= 0) continue;
        const a2 = access(b2); if (!a2) continue;
        const dd = dist(a, a2); if (dd < bd) { bd = dd; best = b2; }
      }
      if (best) add({ kind: 'haul', from: b.id, to: best.id, item, n: Math.min(cap, free, inNeed(best, item)) }, full ? 3.2 : 2.5, dist(here, a) + bd);
      else if (room > 0) { const st = nearestStore(a[0], a[1]); if (st) add({ kind: 'haul', from: b.id, to: 'S', item, n: Math.min(cap, free, room) }, full ? 2.9 : 1.8, dist(here, a) + dist(a, access(st))); }
    }
    if (d.recipes || d.market) {
      const items = d.recipes ? Object.keys((RECIPES[b.recipe] || { in: {} }).in) : Object.keys(G.sell).filter(k => G.sell[k] && avail(k) > 0);
      for (const item of items) {
        const need = inNeed(b, item); if (need <= 0 || avail(item) <= 0) continue;
        const st = nearestStore(a[0], a[1]); if (!st) continue; const sa = access(st);
        add({ kind: 'haul', from: 'S', to: b.id, item, n: Math.min(cap, need, avail(item)) }, d.market ? 1.3 : 2.2, dist(here, sa) + dist(sa, a));
      }
    }
  }
  cands.sort((p, q) => q.s - p.s);
  for (let i = 0; i < Math.min(5, cands.length); i++) if (startTask(c, cands[i].task)) return;
  // nothing to do: rest, play or wander
  const fun = blds.filter(b => b.built && (B[b.type].rest || B[b.type].play) && zoneOpen(b.x, b.y) && !G.cats.some(o => o !== c && o.task && o.task.b === b.id));
  if (fun.length && Math.random() < 0.5) { const f = pick(fun); if (startTask(c, { kind: 'rest', b: f.id, t: rand(5, 9) })) return; }
  startTask(c, { kind: 'idle', t: rand(2.5, 5) });
}
function startTask(c, k) {
  const [cx, cy] = ctile(c);
  let target = null, tx, ty, dest;
  if (k.kind === 'haul') {
    k.stage = 'src';
    if (k.from === 'S') { target = nearestStore(cx, cy); if (!target) return false; k.store = target.id; }
    else target = G.bld[k.from];
  } else if (k.kind === 'eat') { target = nearestStore(cx, cy); if (!target) return false; k.store = target.id; }
  else if (k.kind === 'sleep') {
    const h = c.home && G.bld[c.home];
    if (h) target = h;
    else { const spot = randomSpot(cx, cy, 3); if (!spot) { k.moving = false; c.task = k; arrive(c); return true; } tx = spot[0]; ty = spot[1]; dest = [tx * TS + 8, ty * TS + 10]; }
  } else if (k.kind === 'idle') {
    const spot = randomSpot(cx, cy, 4); if (!spot) { c.task = k; k.moving = false; arrive(c); return true; }
    tx = spot[0]; ty = spot[1]; dest = [tx * TS + 4 + Math.random() * 8, ty * TS + 8 + Math.random() * 4];
  } else target = G.bld[k.b];
  if (target) {
    const a = access(target); if (!a) return false;
    tx = a[0]; ty = a[1]; dest = standPx(target, c);
  }
  if (tx == null) return false;
  const path = findPath(cx, cy, tx, ty);
  if (!path) { if (target) target.unreach = G.t; return false; }
  c.task = k; c.path = path; c.dest = dest; k.moving = true;
  if (c.sleeping) { c.sleeping = false; c.inside = false; }
  recount();
  return true;
}
function randomSpot(cx, cy, r) {
  for (let i = 0; i < 12; i++) {
    const x = cx + randi(-r, r), y = cy + randi(-r, r);
    if (inb(x, y) && walkable(x, y)) return [x, y];
  }
  return null;
}
function legTo(c, target, isStore) {
  const [cx, cy] = ctile(c), a = access(target);
  if (!a) return false;
  const path = findPath(cx, cy, a[0], a[1]); if (!path) return false;
  c.path = path; c.dest = standPx(target, c); c.task.moving = true;
  if (isStore) c.task.store = target.id;
  return true;
}
function arrive(c) {
  const k = c.task;
  switch (k.kind) {
    case 'haul': {
      if (k.stage === 'src') {
        let take = 0;
        if (k.from === 'S') { take = Math.min(k.n, G.stock[k.item] || 0); if (take > 0) takeStock(k.item, take); }
        else { const b = G.bld[k.from]; if (b) { take = Math.min(k.n, b.out[k.item] || 0); if (take > 0) { b.out[k.item] -= take; if (b.out[k.item] <= 0) delete b.out[k.item]; } } }
        if (take <= 0) { endTask(c); return; }
        c.carry = { item: k.item, n: take }; k.n = take; k.stage = 'dst';
        let dst = k.to === 'S' ? null : G.bld[k.to];
        if (k.to !== 'S' && !dst) k.to = 'S';
        if (k.to === 'S') { dst = nearestStore(...ctile(c)); if (!dst) { addStock(k.item, take); c.carry = null; endTask(c); return; } }
        if (!legTo(c, dst, k.to === 'S')) {
          const st = nearestStore(...ctile(c));
          if (st && k.to !== 'S' && legTo(c, st, true)) { k.to = 'S'; return; }
          addStock(k.item, take); c.carry = null; endTask(c);
        }
        return;
      }
      const it = c.carry; c.carry = null;
      if (!it) { endTask(c); return; }
      if (k.to === 'S') addStock(it.item, it.n);
      else {
        const b = G.bld[k.to];
        if (!b) addStock(it.item, it.n);
        else if (!b.built) { const need = (b.need && b.need[it.item]) || 0, use = Math.min(need, it.n); b.need[it.item] = need - use; addStock(it.item, it.n - use); }
        else b.inp[it.item] = (b.inp[it.item] || 0) + it.n;
      }
      endTask(c); return;
    }
    case 'eat': {
      if ((G.stock[k.item] || 0) > 0) {
        takeStock(k.item, 1);
        c.food = Math.min(100, c.food + ITEMS[k.item].food);
        c.mood = Math.min(100, c.mood + (c.trait === 'mlsoun' && k.item === 'susenky' ? 12 : 3));
        emote(c, c.trait === 'mlsoun' && k.item === 'susenky' ? 'star' : 'heart', 1.4);
      }
      k.stage = 'done'; k.t = 1.2; c.anim = 'sit'; return;
    }
    case 'work': case 'farm': case 'build': k.stage = 'working'; k.dur = 0; k.idle = 0; return;
    case 'sleep': {
      const h = c.home && G.bld[c.home];
      if (h && k.b !== 0) { c.inside = true; }
      c.sleeping = true; k.wakeH = 6 + Math.random() * 0.6; return;
    }
    case 'rest': { k.stage = 'sit'; c.face = 1; return; }
    case 'idle': { k.stage = 'sit'; if (c.mood > 72 && Math.random() < 0.35) emote(c, 'note', 2); return; }
  }
  endTask(c);
}
function stay(c, dt) {
  const k = c.task;
  switch (k.kind) {
    case 'work': {
      const b = G.bld[k.b];
      if (!b || isNight() || c.energy < 6 || c.job !== b.id) { endTask(c); return; }
      c.anim = 'work';
      if (canWork(b)) {
        k.idle = 0;
        if (!B[b.type].market) produce(b, dt * workMul(c, b)); else b.lastWork = G.t;
      } else { k.idle += dt; if (k.idle > 1.5) { endTask(c); return; } }
      k.dur += dt; if (k.dur > 24) endTask(c);
      return;
    }
    case 'farm': {
      const b = G.bld[k.b];
      if (!b || isNight() || !fieldNeedsWork(b)) { endTask(c); return; }
      c.anim = 'work';
      b.fw = (b.fw || 0) + dt * workMul(c, b);
      if (b.fw >= FARM_WORK) {
        b.fw = 0;
        if (b.st === 0) { b.st = 1; b.g = 0; }
        else if (b.st === 2) { const cr = CROPS[b.crop]; b.out[b.crop] = (b.out[b.crop] || 0) + cr.yield; G.stats.made[b.crop] = (G.stats.made[b.crop] || 0) + cr.yield; b.st = 0; b.g = 0; sparkle(c.x, c.y - 6, '#ffd23f', 5, 6); }
        endTask(c);
      }
      return;
    }
    case 'build': {
      const b = G.bld[k.b];
      if (!b || b.built || isNight()) { endTask(c); return; }
      c.anim = 'work';
      b.work -= dt * workMul(c, b);
      if (Math.random() < dt * 2) addPart(b.x * TS + rand(2, b.w * TS - 2), b.y * TS + b.h * TS - rand(2, 10), rand(-15, 15), rand(-30, -10), '#d8955a', 0.4, { g: 120 });
      if (b.work <= 0) { completeBuilding(b); endTask(c); }
      return;
    }
    case 'sleep': {
      c.anim = 'sleep';
      let wake = false;
      if (k.nap) { if (isNight()) { k.nap = false; k.wakeH = 6 + Math.random() * 0.6; } else if (c.energy >= 50) wake = true; }
      else if (!isNight() && hour() >= k.wakeH) wake = true;
      if (wake) {
        c.sleeping = false;
        if (c.inside) { c.inside = false; const h = G.bld[c.home]; if (h) { const s = standPx(h, c); if (s) { c.x = s[0]; c.y = s[1]; } } }
        endTask(c);
      }
      return;
    }
    case 'rest': {
      const b = G.bld[k.b]; c.anim = 'sit';
      if (!b) { endTask(c); return; }
      if (B[b.type].play) { c.playT = G.t; if (Math.random() < dt * 0.6) emote(c, 'note', 1.2); }
      else c.energy = Math.min(100, c.energy + dt / DAY * 24 * 6);
      k.t -= dt; if (k.t <= 0 || isNight()) endTask(c);
      return;
    }
    case 'eat': case 'idle': {
      c.anim = 'sit'; k.t -= dt; if (k.t <= 0) endTask(c);
      return;
    }
  }
  endTask(c);
}
function moodTarget(c) {
  let m = 50;
  m += c.food > 50 ? 10 : c.food < 20 ? -22 : 0;
  m += c.energy > 40 ? 5 : c.energy < 15 ? -15 : 0;
  const h = c.home && G.bld[c.home];
  if (h) m += 6 + Math.min(20, cozyNear(h.x, h.y, 3) * 2); else m -= 18;
  if (G.t - c.petT < DAY * 0.25) m += 12 * (c.trait === 'mazel' ? 2 : 1);
  if (G.t - c.playT < DAY * 0.5) m += 10;
  if (c.trait === 'spac') m += 8;
  if (G.weather === 'rain' && !c.inside) m -= 4;
  return clamp(m, 0, 100);
}
function moveCat(c, dt) {
  let tx, ty;
  if (c.path.length) { const n = c.path[0]; tx = n.x * TS + 8; ty = n.y * TS + 10; }
  else if (c.dest) { tx = c.dest[0]; ty = c.dest[1]; }
  else return true;
  const [cx, cy] = ctile(c), t = tile(cx, cy);
  const onPath = t && (t.gr === 'path' || t.gr === 'bridge');
  const sp = 28 * (c.trait === 'rychla' ? 1.3 : 1) * (onPath ? 1.9 : 1) * (c.energy < 10 ? 0.8 : 1);
  const dx = tx - c.x, dy = ty - c.y, dd = Math.hypot(dx, dy), step = sp * dt;
  if (dd <= step) { c.x = tx; c.y = ty; if (c.path.length) c.path.shift(); else c.dest = null; }
  else { c.x += dx / dd * step; c.y += dy / dd * step; }
  if (Math.abs(dx) > 0.3) c.face = dx > 0 ? 1 : -1;
  c.walkT += dt; c.anim = 'walk';
  return !c.path.length && !c.dest;
}
function updateCat(c, dt) {
  const dh = dt / DAY * 24;
  if (c.sleeping) c.energy = Math.min(100, c.energy + (c.inside ? 14 : 8) * dh);
  else c.energy = Math.max(0, c.energy - (c.trait === 'spac' ? 7.5 : 5.5) * dh);
  c.food = Math.max(0, c.food - (c.trait === 'mlsoun' ? 2.6 : 1.8) * dh);
  c.mt = (c.mt || 0) - dt;
  if (c.mt <= 0) { c.mt = 0.5; c.mtgt = moodTarget(c); }
  const tg = c.mtgt != null ? c.mtgt : c.mood;
  c.mood += Math.sign(tg - c.mood) * Math.min(Math.abs(tg - c.mood), 10 * dh);
  if (c.emoteT > 0) { c.emoteT -= dt; if (c.emoteT <= 0) c.emote = null; }
  else if (c.food < 18 && !c.sleeping && Math.random() < dt * 0.15) emote(c, 'fish', 1.8);
  if (SKINS[c.skin].sparkle && !c.inside && Math.random() < dt * 2) addPart(c.x + rand(-5, 5), c.y - rand(3, 10), 0, -8, '#fff4b0', 0.5, { g: 0, k: 'spark' });
  const k = c.task;
  if (!k) { c.anim = c.sleeping ? 'sleep' : 'sit'; c.think -= dt; if (c.think <= 0) { c.think = rand(0.3, 0.8); think(c); } return; }
  if (k.moving) { if (moveCat(c, dt)) { k.moving = false; arrive(c); } return; }
  stay(c, dt);
}
function petCat(c) {
  if (G.t - c.petT < DAY * 0.06) { emote(c, 'heart', 0.8); return; }
  c.petT = G.t; c.mood = Math.min(100, c.mood + (c.trait === 'mazel' ? 16 : 8)); c.mt = 0;
  emote(c, 'heart', 2); Sound.purr();
  for (let i = 0; i < 5; i++) addPart(c.x + rand(-6, 6), c.y - 8, rand(-8, 8), rand(-24, -12), '#ff6f9c', rand(0.6, 1), { g: 0, k: 'heart', drag: 1 });
}
function catActivity(c) {
  const k = c.task;
  if (c.sleeping) return c.inside ? 'Spí v domku' : 'Spí venku (nemá domov)';
  if (!k) return 'Přemýšlí';
  const bn = id => (G.bld[id] ? B[G.bld[id].type].n : '?');
  switch (k.kind) {
    case 'haul': { const it = `${k.n}× ${ITEMS[k.item].n.toLowerCase()}`; const to = k.to === 'S' ? 'do spižírny' : '→ ' + bn(k.to); return k.stage === 'src' ? `Jde pro ${it} ${to}` : `Nese ${it} ${to}`; }
    case 'work': return (k.moving ? 'Jde do práce: ' : 'Pracuje: ') + bn(k.b);
    case 'farm': { const b = G.bld[k.b]; return b && b.st === 2 ? 'Sklízí úrodu' : 'Seje na políčku'; }
    case 'build': return 'Staví: ' + bn(k.b);
    case 'eat': return 'Jde se najíst';
    case 'sleep': return k.nap ? 'Jde si zdřímnout' : 'Jde spát';
    case 'rest': return G.bld[k.b] && B[G.bld[k.b].type].play ? 'Hraje si' : 'Odpočívá';
    case 'idle': return c.mood < 25 ? 'Trucuje' : 'Lenoší';
  }
  return '';
}

/* ============ visitors (market customers) ============ */
function edgeTiles() {
  const out = [];
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    if (!walkable(x, y)) continue;
    if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => !inb(x + a, y + b) || !zoneOpen(x + a, y + b))) out.push([x, y]);
  }
  return out;
}
const priceMul = () => 0.85 * (xUnlocked('ceny') ? 1.25 : 1);
function spawnVisitor(stall) {
  const edge = edgeTiles(); if (!edge.length) return;
  const a = access(stall); if (!a) return;
  for (let i = 0; i < 3; i++) {
    const s = pick(edge), path = findPath(s[0], s[1], a[0], a[1]);
    if (!path) continue;
    VIS.push({ sp: pick(Object.keys(ANIMALS)), x: s[0] * TS + 8, y: s[1] * TS + 10, path, dest: [stall.x * TS + 16 + rand(-7, 7), (stall.y + 1) * TS + 7], stall: stall.id, st: 'in', t: 0, home: s, face: 1, walkT: 0 });
    return;
  }
}
function moveVis(v, dt) {
  let tx, ty;
  if (v.path.length) { tx = v.path[0].x * TS + 8; ty = v.path[0].y * TS + 10; }
  else if (v.dest) { tx = v.dest[0]; ty = v.dest[1]; } else return true;
  const dx = tx - v.x, dy = ty - v.y, dd = Math.hypot(dx, dy), step = 20 * dt;
  if (dd <= step) { v.x = tx; v.y = ty; if (v.path.length) v.path.shift(); else v.dest = null; }
  else { v.x += dx / dd * step; v.y += dy / dd * step; }
  if (Math.abs(dx) > 0.3) v.face = dx > 0 ? 1 : -1;
  v.walkT += dt;
  return !v.path.length && !v.dest;
}
function updateVisitors(dt) {
  const stalls = allB().filter(b => b.type === 'trziste' && b.built && zoneOpen(b.x, b.y));
  const h = hour();
  if (stalls.length && h >= 8 && h < 19) { G.visT -= dt; if (G.visT <= 0) { G.visT = rand(7, 13) / (1 + coziness() / 40); if (VIS.length < 6) spawnVisitor(pick(stalls)); } }
  for (let i = VIS.length - 1; i >= 0; i--) {
    const v = VIS[i];
    if (v.st === 'in') { if (moveVis(v, dt)) { v.st = 'buy'; v.t = 0; v.face = 1; } }
    else if (v.st === 'buy') {
      const s = G.bld[v.stall];
      const seller = s && G.cats.some(c => c.task && c.task.kind === 'work' && c.task.b === s.id && !c.task.moving);
      v.t += dt;
      if (s && seller && sumObj(s.inp) > 0 && v.t > 0.8) {
        const n = randi(1, 2); let got = 0;
        for (let j = 0; j < n; j++) {
          const keys = Object.keys(s.inp).filter(k => s.inp[k] > 0); if (!keys.length) break;
          const k = pick(keys); s.inp[k]--; if (s.inp[k] <= 0) delete s.inp[k];
          got += Math.max(1, Math.round(ITEMS[k].v * priceMul())); G.stats.sold++;
        }
        G.coins += got; G.stats.earned += got;
        popText('+' + got, v.x, v.y - 14, '#ffd23f'); Sound.coin();
        v.emo = 'heart'; v.emoT = 1.5; leaveVis(v);
      } else if (v.t > 7 || !s) { v.emo = 'sad'; v.emoT = 1.5; leaveVis(v); }
    } else if (v.st === 'out') { if (moveVis(v, dt)) VIS.splice(i, 1); }
    if (v.emoT > 0) v.emoT -= dt;
  }
}
function leaveVis(v) {
  const [x, y] = [Math.floor(v.x / TS), Math.floor(v.y / TS)];
  const p = findPath(x, y, v.home[0], v.home[1]);
  v.st = 'out'; v.path = p || []; v.dest = null;
  if (!p) v.dest = [v.home[0] * TS + 8, v.home[1] * TS + 10];
}

/* ============ orders ============ */
function addOrder(nb, lines) {
  const val = lines.reduce((a, [k, q]) => a + ITEMS[k].v * q, 0);
  G.orders.push({ id: G.nid++, nb, lines, coins: Math.round(val * 1.6), xp: 1 + (val >= 60 ? 1 : 0) + (val >= 160 ? 1 : 0), exp: G.t + 2 * DAY });
}
function genOrder() {
  const T = tier();
  const nbs = Object.keys(NEIGH).filter(k => !G.orders.some(o => o.nb === k) && Object.keys(NEIGH[k].prefs).some(i => producible(i)));
  if (!nbs.length) return;
  const nb = pick(nbs);
  const prefs = Object.entries(NEIGH[nb].prefs).filter(([k]) => producible(k));
  const nl = 1 + (T >= 2 && Math.random() < 0.5 ? 1 : 0) + (T >= 6 && Math.random() < 0.4 ? 1 : 0);
  const lines = [];
  for (let i = 0; i < nl && prefs.length; i++) {
    const item = weighted(prefs);
    prefs.splice(prefs.findIndex(p => p[0] === item), 1);
    const base = clamp(Math.round(22 / ITEMS[item].v), 1, 8);
    lines.push([item, Math.max(1, Math.round(base * (1 + Math.min(T, 20) * 0.06) * rand(0.7, 1.3)))]);
  }
  addOrder(nb, lines);
  UI.dirty = true;
}
const canDeliver = o => o.lines.every(([k, q]) => (G.stock[k] || 0) >= q);
function deliverOrder(id) {
  const o = G.orders.find(x => x.id === id);
  if (!o) return;
  if (!canDeliver(o)) { Sound.nope(); toast('Ve spižírně ještě něco chybí.'); return; }
  o.lines.forEach(([k, q]) => takeStock(k, q));
  G.coins += o.coins; G.stats.earned += o.coins; G.stats.orders++;
  const before = nbLevel(o.nb);
  G.nb[o.nb] = (G.nb[o.nb] || 0) + o.xp;
  const after = nbLevel(o.nb);
  G.orders = G.orders.filter(x => x !== o);
  Sound.deliver();
  toast(`${NEIGH[o.nb].n} děkuje! +${o.coins} mincí`);
  if (after > before) onHeartUp(o.nb, after);
  G.orderT = Math.min(G.orderT, rand(10, 18));
  UI.dirty = true;
}
function onHeartUp(nb, lv) {
  const un = unlocksOf(nb).filter(u => u.lv === lv).map(u => u.txt);
  banner(`${NEIGH[nb].n} ♥${lv}`, un.length ? 'Odemčeno: ' + un.join(', ') : 'Máte se čím dál radši.');
  Sound.unlock();
}

/* ============ festivals, zones, quests ============ */
const festKey = () => yearIdx() + '-' + seasonIdx();
function festState() { if (G.fest.key !== festKey()) G.fest = { key: festKey(), got: {} }; return G.fest; }
function festDeliver() {
  const f = FEST[seasonIdx()], st = festState();
  if (G.festDone[st.key]) return;
  let any = false;
  for (const k in f.need) { const rem = f.need[k] - (st.got[k] || 0), give = Math.min(rem, G.stock[k] || 0); if (give > 0) { takeStock(k, give); st.got[k] = (st.got[k] || 0) + give; any = true; } }
  if (!any) { toast('Ve spižírně není nic, co slavnost potřebuje.'); Sound.nope(); return; }
  if (Object.keys(f.need).every(k => (st.got[k] || 0) >= f.need[k])) completeFest(); else { Sound.coin(); toast('Odevzdáno na slavnost.'); }
  UI.dirty = true;
}
function completeFest() {
  const S = seasonIdx(), f = FEST[S];
  G.festDone[G.fest.key] = true; G.coins += f.coins; G.stats.fests++; G.stats.earned += f.coins;
  let extra = '';
  if (!G.festFirst[S]) {
    G.festFirst[S] = true;
    const [kind, arg] = f.first;
    if (kind === 'zone' && !G.zones[arg]) { G.zones[arg] = true; terrainDirty = true; reachDirty = true; extra = ' · ' + f.firstTxt; }
    else if (kind === 'cat') { arriveCat(arg, 'Zlatíčko'); extra = ' · ' + f.firstTxt; }
    else if (kind === 'flag') { G.flags[arg] = true; extra = ' · ' + f.firstTxt; }
  }
  banner(f.n + '!', `+${f.coins} mincí${extra}`);
  Sound.unlock();
}
function unlockZone(k) {
  const z = ZONES[k]; if (G.zones[k]) return;
  if (G.coins < z.cost) { toast(`Na ${z.n} potřebuješ ${z.cost} mincí.`); Sound.nope(); return; }
  G.coins -= z.cost; G.zones[k] = true; terrainDirty = true; reachDirty = true;
  banner('Odemčeno: ' + z.n, z.desc || ''); Sound.unlock(); UI.dirty = true;
}
function checkQuests() {
  if (G.quest >= QUESTS.length) return;
  const q = QUESTS[G.quest];
  if (q.ok()) {
    G.coins += q.coins || 0; if (q.wood) addStock('drevo', q.wood);
    G.quest++; toast(`Úkol splněn! +${q.coins} mincí${q.wood ? ' a ' + q.wood + ' dřeva' : ''}`); Sound.deliver(); UI.dirty = true;
  }
}
function arriveCat(skin, name) {
  const edge = edgeTiles(); const s = edge.length ? pick(edge) : [14, 8];
  const used = G.cats.map(c => c.skin), pool = [0, 1, 2, 3, 4, 6, 7, 8];
  const free = pool.filter(i => !used.includes(i));
  const sk = skin != null ? skin : (free.length ? pick(free) : pick(pool));
  const tr = pick(Object.keys(TRAITS));
  const c = newCat(sk, tr, name, s[0] * TS + 8, s[1] * TS + 10);
  assignHomes();
  banner('Přišla nová kočička!', `${c.name} · ${TRAITS[tr].n}`);
  Sound.meow(); emote(c, 'heart', 3);
  UI.dirty = true;
  return c;
}

/* ============ day cycle ============ */
function onMorning() {
  G.morning = mornIdx();
  const S = seasonIdx();
  if (S !== G.lastSeason) {
    G.lastSeason = S;
    banner(`${SEASONS[S].name}${yearIdx() > 1 ? ', rok ' + yearIdx() : ''}`, S === 3 ? 'Nic neroste — doufám, že máš zásoby.' : 'Slavnost: ' + FEST[S].n);
    Sound.season(); Sound.setSeason(S);
  }
  G.weather = S === 3 ? (Math.random() < 0.5 ? 'snow' : 'clear') : (Math.random() < SEASONS[S].rain ? 'rain' : 'clear');
  const gone = G.orders.filter(o => o.exp < G.t);
  if (gone.length) { G.orders = G.orders.filter(o => o.exp >= G.t); toast(`Zakázka od: ${NEIGH[gone[0].nb].n} vypršela.`); }
  if (freeBeds() > 0 && coziness() >= needCozy(G.cats.length)) arriveCat();
  saveGame();
  UI.dirty = true;
}
let alertT = 0, questT = 0;
function simStep(dt) {
  G.t += dt;
  if (mornIdx() > G.morning) onMorning();
  G.orderT -= dt;
  if (G.orderT <= 0) { G.orderT = rand(28, 48); if (G.orders.length < 4) genOrder(); }
  updateBuildings(dt);
  for (const c of G.cats) updateCat(c, dt);
  updateVisitors(dt);
  alertT -= dt; if (alertT <= 0) { alertT = 0.5; updateAlerts(); }
  questT -= dt; if (questT <= 0) { questT = 0.5; checkQuests(); }
}
function simTick(realDt, speed) {
  if (!speed) return 1;
  let mult = speed;
  if (isNight() && G.cats.length && G.cats.every(c => c.sleeping)) mult *= 5;
  let dt = realDt * mult;
  while (dt > 1e-6) { const s = Math.min(0.05, dt); simStep(s); dt -= s; }
  return mult;
}
