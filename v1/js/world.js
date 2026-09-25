'use strict';
/* ============ world state ============ */
let G = null;
const SAVE_KEY = 'drobeckov_v1';
let terrainDirty = true;

const idx = (x, y) => y * MW + x;
const inb = (x, y) => x >= 0 && y >= 0 && x < MW && y < MH;
const tile = (x, y) => (inb(x, y) ? G.grid[idx(x, y)] : null);
function zoneAt(x, y) {
  for (const k in ZONES) { const z = ZONES[k]; if (x >= z.x0 && x <= z.x1 && y >= z.y0 && y <= z.y1) return k; }
  return 'louka';
}
const zoneOpen = (x, y) => inb(x, y) && !!G.zones[zoneAt(x, y)];
const bldAt = (x, y) => { const t = tile(x, y); return t && t.b ? G.bld[t.b] : null; };
const countB = type => { let n = 0; for (const id in G.bld) if (G.bld[id].type === type && G.bld[id].built) n++; return n; };
const allB = () => Object.values(G.bld);

function walkable(x, y) {
  if (!zoneOpen(x, y)) return false;
  const t = G.grid[idx(x, y)];
  return t.gr !== 'water' && !t.tree && !t.b;
}
function walkCost(x, y) { const g = G.grid[idx(x, y)].gr; return g === 'path' || g === 'bridge' ? 1 : 2; }

/* ============ A* path finding ============ */
const PF = { g: new Float32Array(MW * MH), came: new Int32Array(MW * MH), closed: new Uint8Array(MW * MH) };
function findPath(sx, sy, tx, ty) {
  if (!inb(sx, sy) || !inb(tx, ty)) return null;
  if (sx === tx && sy === ty) return [];
  if (!walkable(tx, ty)) return null;
  PF.g.fill(1e9); PF.came.fill(-1); PF.closed.fill(0);
  const start = idx(sx, sy), goal = idx(tx, ty);
  const heap = [];
  const push = (f, i) => { heap.push([f, i]); let k = heap.length - 1; while (k > 0) { const p = (k - 1) >> 1; if (heap[p][0] <= heap[k][0]) break; [heap[p], heap[k]] = [heap[k], heap[p]]; k = p; } };
  const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let k = 0; for (;;) { const l = k * 2 + 1, r = l + 1; let m = k; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === k) break; [heap[m], heap[k]] = [heap[k], heap[m]]; k = m; } } return top; };
  PF.g[start] = 0; push(0, start);
  while (heap.length) {
    const [, i] = pop();
    if (i === goal) break;
    if (PF.closed[i]) continue;
    PF.closed[i] = 1;
    const x = i % MW, y = (i / MW) | 0;
    for (let d = 0; d < 4; d++) {
      const nx = x + (d === 0 ? 1 : d === 1 ? -1 : 0), ny = y + (d === 2 ? 1 : d === 3 ? -1 : 0);
      if (!inb(nx, ny) || !walkable(nx, ny)) continue;
      const n = idx(nx, ny);
      const ng = PF.g[i] + walkCost(nx, ny);
      if (ng < PF.g[n]) { PF.g[n] = ng; PF.came[n] = i; push(ng + Math.abs(nx - tx) + Math.abs(ny - ty), n); }
    }
  }
  if (PF.came[goal] < 0) return null;
  const path = []; let c = goal;
  while (c !== start && c >= 0) { path.push({ x: c % MW, y: (c / MW) | 0 }); c = PF.came[c]; }
  return path.reverse();
}

/* flood fill of tiles the cats can reach from the notice board */
let REACH = null, reachDirty = true;
function flood(block) {
  const out = new Uint8Array(MW * MH);
  const home = allB().find(b => b.type === 'nastenka'); if (!home) return out.fill(1);
  const q = [idx(home.dx, home.dy)]; out[q[0]] = 1;
  while (q.length) {
    const i = q.pop(), x = i % MW, y = (i / MW) | 0;
    for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + a, ny = y + b; if (!inb(nx, ny)) continue;
      const n = idx(nx, ny); if (out[n] || (block && block.has(n)) || !walkable(nx, ny)) continue;
      out[n] = 1; q.push(n);
    }
  }
  return out;
}
function getReach() { if (reachDirty || !REACH) { REACH = flood(null); reachDirty = false; } return REACH; }
/* would blocking this footprint cut off any door that is reachable now? */
function keepsAccess(fx, fy, fw, fh, newDoor) {
  const block = new Set();
  for (let j = 0; j < fh; j++) for (let i = 0; i < fw; i++) block.add(idx(fx + i, fy + j));
  const now = getReach(), after = flood(block);
  if (newDoor && !after[idx(newDoor[0], newDoor[1])]) return 'Sem se kočky nedostanou — uvolni cestu';
  for (const id in G.bld) {
    const b = G.bld[id]; if (b.dx == null) continue;
    const i = idx(b.dx, b.dy);
    if (now[i] && !after[i]) return 'Zablokovalo by to dveře: ' + B[b.type].n;
  }
  return '';
}

/* ============ buildings ============ */
function doorPos(type, x, y) {
  const d = B[type], w = d.w || 1, h = d.h || 1;
  if (d.water) {
    for (const [a, c] of [[0, 1], [-1, 0], [1, 0], [0, -1]]) {
      const tx = x + a, ty = y + c, t = tile(tx, ty);
      if (t && zoneOpen(tx, ty) && t.gr !== 'water' && !t.b && !t.tree) return [tx, ty];
    }
    return null;
  }
  return [x + Math.floor(w / 2), y + h];
}
function isDoorTile(x, y) {
  for (const id in G.bld) { const b = G.bld[id]; if (b.dx === x && b.dy === y) return true; }
  return false;
}
function makeBld(type, x, y, built) {
  const d = B[type];
  const b = { id: G.nid++, type, x, y, w: d.w || 1, h: d.h || 1, built: !!built, inp: {}, out: {}, p: 0, workers: [] };
  if (!built) { b.need = d.wood ? { drevo: d.wood } : {}; b.work = d.work || 4; b.workTotal = b.work; }
  if (d.field) { b.crop = 'psenice'; b.st = 0; b.g = 0; }
  if (d.recipes) b.recipe = d.recipes[0];
  if (d.orchard) { b.age = 0; b.mature = false; }
  if (!d.nodoor) { const dp = doorPos(type, x, y); if (dp) { b.dx = dp[0]; b.dy = dp[1]; } }
  G.bld[b.id] = b;
  for (let j = 0; j < b.h; j++) for (let i = 0; i < b.w; i++) { const t = tile(x + i, y + j); t.b = b.id; t.tree = null; }
  resetBldTransient(b);
  return b;
}
function resetBldTransient(b) { b.inc = {}; b.outRes = {}; b.farmer = 0; b.builders = 0; b.working = false; b.lastWork = -9; b.active = false; }

function isUnlockedB(type) {
  const d = B[type]; if (!d) return false;
  if (d.flag) return !!G.flags[d.flag] && countB(type) + allB().filter(b => b.type === type && !b.built).length < 1;
  if (d.zone && !G.zones[d.zone]) return false;
  if (d.lock) return nbLevel(d.lock[0]) >= d.lock[1];
  return true;
}
const lockText = lk => lk ? `${NEIGH[lk[0]].n} ♥${lk[1]}` : '';

function canPlace(type, x, y) {
  const d = B[type];
  if (!d || d.tool || d.fixed) return { ok: false, why: '' };
  if (!isUnlockedB(type)) return { ok: false, why: d.zone && !G.zones[d.zone] ? 'Nejdřív odemkni ' + ZONES[d.zone].n : d.flag ? 'Už stojí' : 'Odemkne ' + lockText(d.lock) };
  const w = d.w || 1, h = d.h || 1;
  if (x < 0 || y < 0 || x + w > MW || y + h > MH) return { ok: false, why: 'Mimo údolí' };
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const tx = x + i, ty = y + j, t = tile(tx, ty);
    if (!zoneOpen(tx, ty)) return { ok: false, why: 'Zamčené území' };
    if (t.b) return { ok: false, why: 'Obsazeno' };
    if (t.tree) return { ok: false, why: 'Překáží strom (zbourej ho)' };
    if (d.ground === 'bridge') { if (t.gr !== 'water') return { ok: false, why: 'Lávka patří na vodu' }; }
    else if (d.water) { if (t.gr !== 'water') return { ok: false, why: 'Molo patří na vodu u břehu' }; }
    else if (d.ground === 'path') { if (t.gr !== 'grass') return { ok: false, why: t.gr === 'path' ? '' : 'Tady cesta nejde' }; }
    else if (t.gr !== 'grass') return { ok: false, why: t.gr === 'path' ? 'Na cestě se nestaví' : 'Na vodu ne' };
    if (!d.ground && isDoorTile(tx, ty)) return { ok: false, why: 'Tady jsou něčí dveře' };
  }
  if (!d.ground && !d.nodoor && !d.tree) {
    const dp = doorPos(type, x, y);
    if (!dp) return { ok: false, why: 'Chybí přístup ze břehu' };
    const [dx, dy] = dp, t = tile(dx, dy);
    if (!t || !zoneOpen(dx, dy) || t.b || t.tree || t.gr === 'water') return { ok: false, why: 'Dveře musí vést na volné místo' };
  }
  if (!d.ground) {
    const dp = !d.nodoor && !d.tree ? doorPos(type, x, y) : null;
    const why = keepsAccess(x, y, w, h, dp);
    if (why) return { ok: false, why };
  }
  if (G.coins < d.cost) return { ok: false, why: 'Málo mincí' };
  if ((d.instant || d.ground) && d.wood && avail('drevo') < d.wood) return { ok: false, why: 'Málo dřeva ve spižírně' };
  return { ok: true };
}

function place(type, x, y) {
  reachDirty = true;
  const d = B[type];
  G.coins -= d.cost;
  if ((d.instant || d.ground) && d.wood) takeStock('drevo', d.wood);
  if (d.ground) { tile(x, y).gr = d.ground; terrainDirty = true; reachDirty = true; return null; }
  if (d.tree) { tile(x, y).tree = { g: 0.08, v: Math.random() * 0.75, planted: true }; return null; }
  const b = makeBld(type, x, y, !!d.instant);
  onBuildingsChanged();
  return b;
}

function demolishAt(x, y) {
  const t = tile(x, y); if (!t || !zoneOpen(x, y)) return false;
  if (t.b) {
    const b = G.bld[t.b], d = B[b.type];
    if (d.fixed) { toast('Nástěnka zůstane.'); return false; }
    if (d.store && countB('spizirna') <= 1 && b.built) { toast('Poslední spižírnu zbourat nejde.'); return false; }
    demolish(b); return true;
  }
  if (t.tree) { t.tree = null; reachDirty = true; addStock('drevo', 1); popText('+1', x * TS + 8, y * TS, '#ffd23f'); Sound.chop(); return true; }
  if (t.gr === 'path' || t.gr === 'bridge') { t.gr = t.gr === 'path' ? 'grass' : 'water'; terrainDirty = true; reachDirty = true; G.coins += t.gr === 'grass' ? 0 : 5; return true; }
  return false;
}
function demolish(b) {
  reachDirty = true;
  const d = B[b.type];
  for (const c of G.cats) {
    if (c.task && (c.task.b === b.id || c.task.from === b.id || c.task.to === b.id || c.task.store === b.id)) abortTask(c);
    if (c.job === b.id) c.job = 0;
    if (c.home === b.id) { c.home = 0; if (c.inside) { c.inside = false; c.x = (b.dx + 0.5) * TS; c.y = (b.dy + 0.7) * TS; } }
  }
  for (const k in b.inp) addStock(k, b.inp[k]);
  for (const k in b.out) addStock(k, b.out[k]);
  const refundWood = Math.floor(((d.wood || 0) - ((b.need && b.need.drevo) || 0)) / 2);
  if (refundWood > 0) addStock('drevo', refundWood);
  G.coins += Math.floor(d.cost / 2);
  for (let j = 0; j < b.h; j++) for (let i = 0; i < b.w; i++) tile(b.x + i, b.y + j).b = 0;
  delete G.bld[b.id];
  if (UI.sel && UI.sel.kind === 'b' && UI.sel.id === b.id) UI.select(null);
  onBuildingsChanged();
  Sound.place();
}
function onBuildingsChanged() { assignHomes(); UI.dirty = true; }

/* ============ cats ============ */
function freeName() {
  const free = CAT_NAMES.filter(n => !G.cats.some(c => c.name === n));
  return free.length ? pick(free) : 'Kočka ' + (G.cats.length + 1);
}
function newCat(skin, trait, name, x, y) {
  const c = { id: G.nid++, name: name || freeName(), skin, trait, x, y, home: 0, job: 0, energy: 85, food: 70, mood: 62, petT: -999, playT: -999 };
  resetCatTransient(c);
  G.cats.push(c);
  return c;
}
function resetCatTransient(c) {
  c.task = null; c.path = []; c.carry = c.carry || null; c.face = c.face || 1; c.anim = 'sit'; c.emote = null; c.emoteT = 0;
  c.inside = !!c.inside; c.sleeping = !!c.sleeping; c.think = rand(0.2, 1); c.walkT = 0; c.dest = null;
}
function assignHomes() {
  const houses = allB().filter(b => b.type === 'domek' && b.built);
  const count = {}; for (const c of G.cats) if (c.home) count[c.home] = (count[c.home] || 0) + 1;
  for (const c of G.cats) {
    if (c.home && G.bld[c.home]) continue;
    c.home = 0;
    const h = houses.find(b => (count[b.id] || 0) < B.domek.beds);
    if (h) { c.home = h.id; count[h.id] = (count[h.id] || 0) + 1; }
  }
}
const freeBeds = () => allB().filter(b => b.type === 'domek' && b.built).length * B.domek.beds - G.cats.filter(c => c.home).length;

/* ============ new game ============ */
function genMap() {
  const rng = mulberry(424242);
  G.grid = [];
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) G.grid.push({ gr: 'grass', b: 0, tree: null });
  for (let y = 0; y < MH; y++) { const xr = 25 + Math.round(Math.sin(y * 0.42 + 1) * 1.2); tile(xr, y).gr = 'water'; tile(xr + 1, y).gr = 'water'; }
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    const t = tile(x, y); if (t.gr === 'water') continue;
    const z = zoneAt(x, y);
    let p = 0.3;
    if (z === 'louka') p = (x === 7 || x === 22 || y === 3 || y === 14) ? 0.35 : (x === 8 || x === 21 || y === 4 || y === 13) ? 0.08 : 0;
    if (rng() < p) t.tree = { g: 1, v: rng() };
  }
  for (const k in ZONES) if (ZONES[k].sign) { const [sx, sy] = ZONES[k].sign; tile(sx, sy).tree = null; }
}
function starter() {
  const clear = (x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) tile(x, y).tree = null; };
  clear(9, 4, 20, 12);
  for (const [x, y] of [[10, 11], [20, 5], [13, 12], [9, 12], [21, 10]]) tile(x, y).tree = { g: 1, v: 0.2 + (x * 7 % 5) / 10 };
  for (let x = 9; x <= 20; x++) tile(x, 8).gr = 'path';
  for (const [x, y] of [[11, 7], [19, 7], [19, 9], [19, 10], [19, 11], [18, 11]]) tile(x, y).gr = 'path';
  makeBld('nastenka', 13, 7, true);
  const sp = makeBld('spizirna', 15, 6, true);
  const house = makeBld('domek', 10, 5, true);
  const f = makeBld('pole', 17, 9, true); f.st = 1; f.g = 0.55;
  makeBld('kvetiny', 9, 6, true); makeBld('kvetiny', 12, 5, true);
  // wild orchard in Starý sad
  for (const [x, y] of [[2, 3], [4, 6], [1, 10], [3, 13], [5, 15]]) { tile(x, y).tree = null; const j = makeBld('jablon', x, y, true); j.mature = true; j.age = 9e9; }
  const house2 = makeBld('domek', 18, 5, true);
  const a = newCat(0, 'rychla', 'Zrzek', 14.5 * TS, 8.6 * TS);
  const b = newCat(1, 'pekar', 'Micka', 12 * TS, 8.6 * TS);
  const c = newCat(6, 'zahradnik', 'Fousek', 17 * TS, 8.6 * TS);
  a.home = b.home = house.id; c.home = house2.id;
  void sp;
}
function newGame() {
  G = {
    v: 1, t: 6.4 / 24 * DAY, coins: 180, stock: { drevo: 28, ryby: 10, chleb: 8 }, sell: {},
    grid: [], bld: {}, nid: 1, cats: [], orders: [], nb: { jez: 0, zaj: 0, med: 0, sova: 0, lis: 0 },
    zones: { louka: true }, quest: 0, fest: { key: '', got: {} }, festDone: {}, festFirst: {}, flags: {},
    stats: { made: {}, orders: 0, fests: 0, sold: 0, earned: 0 }, weather: 'clear', morning: 0,
    orderT: 25, visT: 8, res: {}, incStore: 0, lastSeason: 0, welcomed: false
  };
  DEFAULT_SELL.forEach(k => { G.sell[k] = true; });
  genMap();
  starter();
  G.morning = mornIdx();
  addOrder('jez', [['chleb', 2]]);
  addOrder('zaj', [['mrkev', 4]]);
  terrainDirty = true; reachDirty = true;
}

/* ============ save / load ============ */
const GR = ['grass', 'water', 'path', 'bridge'];
const BKEYS = ['id', 'type', 'x', 'y', 'w', 'h', 'built', 'inp', 'out', 'p', 'workers', 'need', 'work', 'workTotal', 'crop', 'st', 'g', 'recipe', 'age', 'mature', 'cyc', 'dx', 'dy', 'fw'];
function serialize() {
  const stock = Object.assign({}, G.stock);
  for (const c of G.cats) if (c.carry) stock[c.carry.item] = (stock[c.carry.item] || 0) + c.carry.n;
  const bld = allB().map(b => { const o = {}; for (const k of BKEYS) if (b[k] !== undefined) o[k] = b[k]; return o; });
  return {
    v: 1, t: G.t, coins: G.coins, stock, sell: G.sell,
    grid: G.grid.map(t => [GR.indexOf(t.gr), t.tree ? [+t.tree.g.toFixed(3), +t.tree.v.toFixed(3), t.tree.cut ? 1 : 0, t.tree.planted ? 1 : 0] : 0]),
    bld, nid: G.nid,
    cats: G.cats.map(c => ({ id: c.id, name: c.name, skin: c.skin, trait: c.trait, x: Math.round(c.x), y: Math.round(c.y), home: c.home, job: c.job, energy: c.energy, food: c.food, mood: c.mood, petT: c.petT, playT: c.playT, inside: c.inside, sleeping: c.sleeping })),
    orders: G.orders, nb: G.nb, zones: G.zones, quest: G.quest, fest: G.fest, festDone: G.festDone, festFirst: G.festFirst, flags: G.flags,
    stats: G.stats, weather: G.weather, morning: G.morning, orderT: G.orderT, visT: G.visT, lastSeason: G.lastSeason, welcomed: G.welcomed
  };
}
function deserialize(s) {
  if (!s || s.v !== 1 || !Array.isArray(s.grid) || s.grid.length !== MW * MH) return false;
  G = Object.assign({ res: {}, incStore: 0 }, s);
  G.grid = s.grid.map(a => ({ gr: GR[a[0]] || 'grass', b: 0, tree: a[1] ? { g: a[1][0], v: a[1][1], cut: !!a[1][2], planted: !!a[1][3] } : null }));
  G.bld = {};
  for (const o of s.bld) {
    if (!B[o.type]) continue;
    const b = Object.assign({ inp: {}, out: {}, workers: [] }, o);
    G.bld[b.id] = b; resetBldTransient(b);
    for (let j = 0; j < b.h; j++) for (let i = 0; i < b.w; i++) { const t = tile(b.x + i, b.y + j); if (t) t.b = b.id; }
  }
  G.cats = s.cats.map(c => { const o = Object.assign({}, c); o.carry = null; resetCatTransient(o); return o; });
  for (const c of G.cats) { if (c.job && !G.bld[c.job]) c.job = 0; if (c.home && !G.bld[c.home]) c.home = 0; }
  for (const b of allB()) b.workers = (b.workers || []).filter(id => G.cats.some(c => c.id === id && c.job === b.id));
  terrainDirty = true; reachDirty = true;
  return true;
}
function saveGame() { if (G) store.set(SAVE_KEY, serialize()); }
