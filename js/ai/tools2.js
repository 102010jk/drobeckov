'use strict';
/* ============ AI bridge, part 2: economy, prospecting, diagnostics, time control, batches, checkpoints, rules, notes ============ */
if (typeof AI_CMDS !== 'undefined') (() => {

/* ---------- keep the simulation running while the game window is in the background ---------- */
let bgLast = performance.now();
setInterval(() => {
  const now = performance.now(), el = Math.min(3, (now - bgLast) / 1000); bgLast = now;
  if (!AI_ON || !document.hidden || !G || typeof started === 'undefined' || !started || !UI.speed || !$('menu').hidden) return;
  let left = el; while (left > 1e-6) { const s = Math.min(0.1, left); simTick(s, UI.speed); left -= s; }   // browsers pause rAF in hidden tabs
}, 250);

/* ---------- events feed (everything the game announces) ---------- */
const EV = []; let evN = 0;
function evPush(kind, text) { EV.push({ n: ++evN, kind, day: dayIdx() + 1, hour: Math.floor(hour()), text }); if (EV.length > 400) EV.shift(); }
addEventListener('load', () => {   // wrap after every other script wrapped banner/toast
  const _b = banner, _t = toast;
  banner = function (a, b) { if (QUIET) return; evPush('banner', a + (b ? ' — ' + b : '')); return _b(a, b); };
  toast = function (m) { if (QUIET) return; evPush('toast', m); return _t(m); };
});
let QUIET = false;

/* ---------- small helpers ---------- */
const need = aiNeed, ORE_NAME = k => (typeof ORE_NAMES !== 'undefined' && ORE_NAMES[k]) || k;
const sellPrice = k => Math.max(1, Math.floor(ITEMS[k].v * 0.5 * (typeof marketMul === 'function' ? marketMul(k) : 1)));
function snapshot() { return JSON.stringify(serialize()); }
function restore(snap) { const slot = G.slot; deserialize(JSON.parse(snap)); G.slot = slot; UI.sel = null; renderPane(true); renderHUD(); }
function summary() { return { day: dayIdx() + 1, era: ERAS[eraOf()].n, coins: Math.floor(G.coins), cats: G.cats.length, hungry: G.cats.filter(c => c.food < 25).length, storage: stockTotal() + '/' + capacity(), buildings: BLIST.length, sites: BLIST.filter(b => !b.built).length }; }
function stockDiff(a, b) { const o = {}; for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) { const d = (b[k] || 0) - (a[k] || 0); if (d) o[k] = d; } return o; }

/* ---------- conditions: "storage.ocel >= 15 and cats > 5" (no eval, fixed vocabulary) ---------- */
function term(t) {
  const p = t.split('.');
  switch (p[0]) {
    case 'storage': case 'stock': return G.stock[p[1]] || 0;
    case 'made': return G.stats.made[p[1]] || 0;
    case 'built': return BLIST.filter(b => b.built && b.type === p[1]).length;
    case 'building': { const b = G.bld[+p[1]]; return !b ? 0 : p[2] === 'built' ? (b.built ? 1 : 0) : p[2] === 'level' ? (b.lvl || 1) : 1; }
    case 'coins': return G.coins; case 'cats': return G.cats.length; case 'era': return eraOf(); case 'stars': return G.stars || 0;
    case 'day': return dayIdx() + 1; case 'hour': return hour(); case 'season': return seasonIdx();
    case 'hungry': return G.cats.filter(c => c.food < 25).length; case 'mood': return G.cats.reduce((a, c) => a + c.mood, 0) / Math.max(1, G.cats.length);
    case 'free_beds': case 'freeBeds': return freeBeds(); case 'coziness': return coziness();
    case 'storage_used_pct': return stockTotal() / Math.max(1, capacity()) * 100;
    case 'sites': return BLIST.filter(b => !b.built).length; case 'orders_deliverable': return G.orders.filter(canDeliver).length;
    case 'tech': return G.tech[p[1]] ? 1 : 0; case 'parcels': return G.owned.length;
  }
  throw new Error('Neznámá veličina v podmínce: ' + t);
}
function cond(expr) {
  const ors = String(expr).split(/\s+or\s+|\s*\|\|\s*/i);
  return ors.some(part => part.split(/\s+and\s+|\s*&&\s*/i).every(c => {
    const m = c.trim().match(/^([\w.]+)\s*(>=|<=|==|!=|>|<)\s*(-?[\d.]+)$/); need(m, 'Podmínka musí vypadat jako „storage.ocel >= 15“: ' + c);
    const v = term(m[1]), n = +m[3];
    return m[2] === '>=' ? v >= n : m[2] === '<=' ? v <= n : m[2] === '>' ? v > n : m[2] === '<' ? v < n : m[2] === '==' ? v == n : v != n;
  }));
}
const STOPS = {
  hunger: s => G.cats.some(c => c.food < 20), storage_full: s => storeRoom() <= 0,
  construction_done: s => BLIST.filter(b => b.built).length > s.built, new_cat: s => G.cats.length > s.cats,
  era_change: s => eraOf() !== s.era, no_materials: s => BLIST.some(b => !b.built && b.need && Object.keys(b.need).some(k => b.need[k] > 0 && avail(k) <= 0 && !(b.inc[k] > 0))),
  order_deliverable: s => G.orders.some(canDeliver), morning: s => dayIdx() !== s.day
};
/* runs the simulation as fast as possible; yields so the page stays responsive */
async function runSim(gameHours, stopFn, label) {
  const start = { built: BLIST.filter(b => b.built).length, cats: G.cats.length, era: eraOf(), day: dayIdx() }, t0 = G.t, end = G.t + gameHours / 24 * DAY, real0 = performance.now();
  let stopped = null, i = 0;
  while (G.t < end) {
    simStep(0.25);
    if ((++i & 31) === 0) { const r = stopFn && stopFn(start); if (r) { stopped = r; break; } }
    if ((i & 511) === 0) await new Promise(r => setTimeout(r, 0));
    if (performance.now() - real0 > 90000) { stopped = 'časový limit 90 s reálného času'; break; }
  }
  render(0.016); renderHUD(); UI.dirty = true;
  return { gameHoursPassed: Math.round((G.t - t0) / DAY * 240) / 10, stoppedBecause: stopped || (label || 'uplynul požadovaný čas'), realMs: Math.round(performance.now() - real0), now: summary() };
}

/* ---------- storage rules (applied every game hour) ---------- */
function applyStoreRules() {
  const R = G.storeRules || {}; let sold = 0, coins = 0;
  for (const k in R) {
    const r = R[k], have = G.stock[k] || 0;
    let n = 0;
    if (r.sell_all) n = have - (r.reserve || 0);
    else if (r.sell_excess_over != null) n = have - Math.max(r.sell_excess_over, r.reserve || 0);
    if (n > 0 && !r.never_sell && ITEMS[k]) { const pay = sellPrice(k) * n; takeStock(k, n); G.coins += pay; G.stats.earned += pay; if (typeof marketSold === 'function') marketSold(k, n); sold += n; coins += pay; }
  }
  if (sold) evPush('sale', `Pravidla skladu prodala ${sold} ks za ${coins} mincí`);
}
const _sellable = sellable;
sellable = function (k) { const r = G.storeRules && G.storeRules[k]; if (r && (r.never_sell || (r.reserve && (G.stock[k] || 0) <= r.reserve))) return false; return _sellable(k); };

/* ---------- watch rules / todos (checked every game hour) ---------- */
let lastHour = -1;
STEP_HOOKS.push(() => {
  if (!G) return;
  const h = Math.floor(G.t / DAY * 24); if (h === lastHour) return; lastHour = h;
  applyStoreRules();
  for (const r of (G.aiRules || []).slice()) {
    if (r.cooldownUntil && G.t < r.cooldownUntil) continue;
    let ok = false; try { ok = cond(r.condition); } catch (e) { r.error = e.message; continue; }
    if (!ok) continue;
    const out = runBatchSync(r.then, 'best_effort');
    r.fired = (r.fired || 0) + 1; r.lastResult = out.results.map(x => x.ok ? 'ok' : x.error);
    evPush('rule', `Pravidlo #${r.id} (${r.condition}) provedeno`);
    if (r.once) G.aiRules = G.aiRules.filter(x => x !== r); else r.cooldownUntil = G.t + (r.cooldown_hours || 6) / 24 * DAY;
  }
});

/* ---------- batches ---------- */
const ASYNC = new Set(['wait', 'skip_time', 'simulate_until', 'fast_forward_report', 'simulate_preview', 'dry_run', 'batch', 'ensure_running', 'open_game', 'new_game', 'screenshot']);
function runOne(c) { const { tool, ...args } = c; need(tool && AI_CMDS[tool], 'Neznámý nástroj v dávce: ' + tool); need(!ASYNC.has(tool), 'V dávce nejde použít ' + tool); return AI_CMDS[tool](args); }
function runBatchSync(commands, mode) {
  need(Array.isArray(commands) && commands.length, 'commands musí být neprázdné pole');
  need(commands.length <= 60, 'Max 60 příkazů v jedné dávce');
  const snap = mode === 'atomic' ? snapshot() : null, results = [];
  for (const c of commands) {
    try { results.push({ tool: c.tool, ok: true, data: runOne(c) }); }
    catch (e) {
      results.push({ tool: c.tool, ok: false, error: e.message });
      if (mode === 'atomic') { restore(snap); return { mode, committed: false, rolledBack: true, results }; }
      if (mode === 'sequential') break;
    }
  }
  return { mode, committed: true, ok: results.filter(r => r.ok).length, failed: results.filter(r => !r.ok).length, results };
}

/* ---------- the new commands ---------- */
Object.assign(AI_CMDS, {
  state_brief() { const s = summary(); s.advisor = advProblems().map(p => p[0]); s.orders = G.orders.length; s.deliverable = G.orders.filter(canDeliver).length; s.speed = UI.speed; s.nextEra = ERAS[eraOf() + 1] ? ERAS[eraOf() + 1].hint : null; return s; },

  sell({ item, amount, excess_over }) {
    need(ITEMS[item], 'Neznámé zboží: ' + item); const have = G.stock[item] || 0;
    const n = Math.min(have, excess_over != null ? have - excess_over : (amount || have)); need(n > 0, 'Není co prodat (ve skladu ' + have + ')');
    const each = sellPrice(item), pay = each * n; takeStock(item, n); G.coins += pay; G.stats.earned += pay; if (typeof marketSold === 'function') marketSold(item, n);
    Sound.coin(); return { sold: n, item, pricePerUnit: each, coins: pay, left: G.stock[item] || 0, note: 'Liška vykupuje za polovinu ceny; stánek a karavany platí víc.' };
  },
  storage_rules({ rules, clear }) {
    if (!G.storeRules) G.storeRules = {};
    if (clear) G.storeRules = {};
    if (rules) for (const k in rules) { need(ITEMS[k], 'Neznámé zboží: ' + k); if (rules[k] === null) delete G.storeRules[k]; else G.storeRules[k] = Object.assign({}, G.storeRules[k], rules[k]); }
    return { rules: G.storeRules, modes: 'reserve: N (stánek ani pravidla neprodají pod N), sell_excess_over: N (každou herní hodinu prodá přebytek nad N), sell_all: true, never_sell: true; null = smazat pravidlo' };
  },
  list_deposits({ resource, owned_only } = {}) {
    const bb = G.bb, out = {};
    for (let y = bb.y0 - PS; y <= bb.y1 + PS; y++) for (let x = bb.x0 - PS; x <= bb.x1 + PS; x++) {
      const o = tile(x, y).ore; if (!o || (resource && o !== resource)) continue;
      const own = owned(x, y); if (owned_only && !own) continue;
      const px = Math.floor(x / PS), py = Math.floor(y / PS); if (!own && !ownedP(px, py) && !adjacentOwned(px, py)) continue;
      const key = o + '@' + px + ',' + py; const e = out[key] || (out[key] = { resource: o, name: ORE_NAME(o), px, py, owned: own, tiles: 0, example: { x, y }, hasMine: false });
      e.tiles++;
    }
    for (const b of BLIST) if (b.type === 'dul') for (const k in out) { const e = out[k]; if (e.px === Math.floor(b.x / PS) && e.py === Math.floor(b.y / PS) && e.resource === b.ore) e.hasMine = true; }
    return { deposits: Object.values(out).sort((a, b) => (b.owned - a.owned) || (b.tiles - a.tiles)), note: 'Důl (2×2) těží to ložisko, kterého je pod ním nejvíc. Kámen, hlína a písek se nekopou dolem.' };
  },
  prospect_deposit({ x, y }) {
    const cnt = {}; for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) { const o = tile(x + i, y + j).ore; if (o) cnt[o] = (cnt[o] || 0) + 1; }
    const mine = typeof mineOre === 'function' ? mineOre(x, y) : null;
    return { at: { x, y }, footprint2x2: cnt, mineWouldExtract: mine ? ORE_NAME(mine) : null, canBuildMine: isUnlockedB('dul') ? canPlace('dul', x, y) : { ok: false, why: lockReason('dul') } };
  },
  prospect_parcel({ px, py }) {
    const cnt = {}; for (let y = py * PS; y < py * PS + PS; y++) for (let x = px * PS; x < px * PS + PS; x++) { const t = tile(x, y); const k = t.ore || (t.gr === 'water' || t.gr === 'deep' ? 'voda' : t.tree ? 'stromy' : t.gr); cnt[k] = (cnt[k] || 0) + 1; }
    return { px, py, owned: ownedP(px, py), buyable: !ownedP(px, py) && adjacentOwned(px, py), price: ownedP(px, py) ? 0 : parcelPrice(px, py), tiles: cnt };
  },
  find_resource({ resource, max_distance = 40 }) {
    const [cx, cy] = aiCenter(); let best = [];
    for (let y = cy - max_distance; y <= cy + max_distance; y++) for (let x = cx - max_distance; x <= cx + max_distance; x++) if (tile(x, y).ore === resource) best.push({ x, y, dist: Math.abs(x - cx) + Math.abs(y - cy), owned: owned(x, y), parcel: [Math.floor(x / PS), Math.floor(y / PS)] });
    best.sort((a, b) => (b.owned - a.owned) || a.dist - b.dist);
    return { resource, name: ORE_NAME(resource), found: best.length, nearest: best.slice(0, 8) };
  },
  cancel_construction({ building_id }) {
    const b = G.bld[building_id]; need(b, 'Budova neexistuje'); need(!b.built, 'Stavba už je hotová — použij demolish');
    const d = B[b.type], tot = Object.assign({}, d.mat || {}); if (d.wood) tot.drevo = (tot.drevo || 0) + d.wood;
    const back = {}; for (const k in tot) { const n = tot[k] - ((b.need && b.need[k]) || 0); if (n > 0) { addStock(k, n); back[k] = n; } }
    G.coins += d.cost; removeBld(b, true); onBuildingsChanged(); reachDirty = true;
    return { cancelled: d.n, refundedCoins: d.cost, refundedMaterials: back };
  },
  trade({ action = 'offers', item, amount }) {
    const tr = (G.traders || []);
    if (action === 'offers') return { traders: tr.map(t => ({ id: t.id, name: t.name, kind: t.kind, leavesInHours: Math.round((t.leave - G.t) / DAY * 24), hubReady: !!tradeHub(t),
      wants: t.wants.map(w => ({ item: w.item, qty: w.qty, pricePerUnit: traderPrice(t, w), onHub: (tradeHub(t) || { inp: {} }).inp[w.item] || 0, inStock: G.stock[w.item] || 0 })),
      sells: t.sells.map((s, i) => s.bp ? { index: i, blueprint: B[s.bp].n, price: s.price } : { index: i, item: s.item, price: s.price, qty: s.qty }) })), prepared: G.tradePrep || {},
      note: 'Prodej: nejdřív trade prepare (kočky donesou zboží na náměstí/do přístavu), pak trade sell.' };
    need(ITEMS[item] || action === 'buy', 'Neznámé zboží');
    if (action === 'prepare') { ACTIONS.prep(item + ':' + (amount || 10)); return { prepared: G.tradePrep }; }
    if (action === 'sell') { const t = tr.find(t => t.wants.some(w => w.item === item && w.qty > 0)); need(t, 'Žádný obchodník to teď nechce'); const c0 = G.coins; ACTIONS.tsell(t.id + ':' + item); need(G.coins > c0, 'Na náměstí zatím nic z toho neleží — použij trade prepare a počkej'); return { coins: G.coins - c0 }; }
    if (action === 'buy') { for (const t of tr) { const i = t.sells.findIndex(s => s.item === item || (s.bp && s.bp === item)); if (i >= 0) { const c0 = G.coins; for (let k = 0; k < (amount || 1); k++) ACTIONS.tbuy(t.id + ':' + i); return { spent: c0 - G.coins, stock: G.stock[item] || 0 }; } } throw new Error('Nikdo to teď neprodává'); }
    throw new Error('action: offers | prepare | sell | buy');
  },
  orders() {
    return G.orders.map(o => ({ id: o.id, from: orderClient(o).n, coins: o.coins, hearts: o.xp, hoursLeft: Math.round((o.exp - G.t) / DAY * 24), big: !!o.big, canDeliver: canDeliver(o),
      lines: o.lines.map(([k, q]) => ({ item: k, name: itemName(k), need: q, have: G.stock[k] || 0, missing: Math.max(0, q - (G.stock[k] || 0)), producible: producible(k) })) }));
  },
  production_status() {
    return BLIST.filter(b => b.built && (B[b.type].recipes || B[b.type].produce || B[b.type].field || B[b.type].chop)).map(b => {
      const d = B[b.type], r = b.recipe && RECIPES[b.recipe], [st, cls] = bStatus(b), staff = G.cats.filter(c => c.job === b.id).length;
      const missing = r ? Object.keys(r.in).filter(k => (b.inp[k] || 0) < r.in[k]) : [];
      return { id: b.id, type: b.type, recipe: b.recipe, perCycle: r ? { in: r.in, out: r.out, n: r.n } : undefined, input: b.inp, output: b.out, workers: staff + '/' + (d.workers || 0), working: !!b.working,
        blocked: cls === 'bad' || (d.workers && !staff) || missing.some(k => avail(k) <= 0), missingInputs: missing.map(k => ({ item: k, inStock: avail(k) })), status: st };
    });
  },
  construction_status() {
    return BLIST.filter(b => !b.built).map(b => {
      const carriers = G.cats.filter(c => c.task && c.task.to === b.id).map(c => c.name), builders = G.cats.filter(c => c.task && c.task.kind === 'build' && c.task.b === b.id).map(c => c.name);
      const missing = {}; for (const k in (b.need || {})) if (b.need[k] > 0) missing[k] = { stillNeeded: b.need[k], onTheWay: b.inc[k] || 0, inStock: avail(k) };
      const blockedBy = Object.keys(missing).filter(k => missing[k].inStock <= 0 && !missing[k].onTheWay);
      return { id: b.id, type: b.type, x: b.x, y: b.y, priority: !!b.prio, missing, blockedBy, carriers, builders, workDone: b.workTotal ? Math.round((1 - b.work / b.workTotal) * 100) + '%' : '0%' };
    });
  },
  explain_building({ building_id }) {
    const b = G.bld[building_id]; need(b, 'Budova neexistuje');
    const info = AI_CMDS.building({ building_id }), staff = G.cats.filter(c => c.job === b.id);
    const why = [];
    if (!b.built) why.push('je to staveniště', ...AI_CMDS.construction_status().filter(x => x.id === b.id).flatMap(x => x.blockedBy.map(k => 'chybí ' + itemName(k) + ' a ve skladu není')));
    else {
      if (B[b.type].workers && !staff.length) why.push('nemá přiřazenou kočku (assign)');
      const r = b.recipe && RECIPES[b.recipe]; if (r) for (const k in r.in) if ((b.inp[k] || 0) < r.in[k]) why.push(`čeká na ${itemName(k)} (má ${b.inp[k] || 0}/${r.in[k]}, ve skladu ${avail(k)})`);
      if (sumObj(b.out) >= OUTCAP) why.push('plný výstup — sklad je asi plný, prodej nebo postav sklad');
      if (storeRoom() <= 0) why.push('sklad je plný');
    }
    info.workersDetail = staff.map(c => ({ name: c.name, doing: catActivity(c), commuteTiles: c.home && G.bld[c.home] && typeof homeDist === 'function' ? Math.round(homeDist(c, G.bld[c.home])) : null, energy: Math.round(c.energy), food: Math.round(c.food) }));
    info.problems = why.length ? why : ['vypadá to v pořádku'];
    return info;
  },
  action_catalog() {
    const DOC = { expedition: '0|1|2 — výprava (krátká/dlouhá/velká), potřebuje Cestovatelský stan', fireworks: 'buy|stock — ohňostroj (jen v noci)', autodeliver: 'bez arg — přepne automatické doručování zakázek', decline: 'order_id — odmítne zakázku',
      prio: 'building_id — přednostní stavba', upgrade: 'building_id — vylepšení', research: 'tech id', trainprof: 'vedec|inzenyr|astronaut — pak trainc cat_id (se zvolenou školou)', launch: 'kosmodrom id — start rakety', supplylaunch: 'kosmodrom id — zásobovací raketa',
      hatbuy: 'id kloboučku', hatset: 'cat_id:hat', wish: 'index přání dne', letter: 'index dopisu', race: 'zavodiste_id:cat_id', fishgo: 'molo id (otevře minihru)', dye: 'cat_id:skin', prep: 'item:qty', tsell: 'trader_id:item', tbuy: 'trader_id:index', fest: '(přes deliver_festival)', limit: 'omezení výroby (viz hra)', policy: 'vyhláška radnice' };
    return Object.keys(ACTIONS).sort().map(k => ({ name: k, arg: DOC[k] || '(interní / UI akce)' }));
  },
  auto_assign({ rebalance } = {}) {
    const free = G.cats.filter(c => !c.job && !(c.kitten > G.t)), done = [];
    const prio = t => (['pekarna', 'mlyn', 'molo', 'kuchynka'].includes(t) ? 0 : t === 'drevorubec' ? 1 : 2);
    const slots = BLIST.filter(b => b.built && B[b.type].workers).map(b => ({ b, open: B[b.type].workers - G.cats.filter(c => c.job === b.id).length })).filter(s => s.open > 0).sort((a, b) => prio(a.b.type) - prio(b.b.type));
    for (const s of slots) while (s.open > 0 && free.length > (rebalance ? 0 : 1)) { const c = free.shift(); assignWorker(s.b, c.id); s.open--; done.push(`${c.name} → ${B[s.b.type].n}`); }
    return { assigned: done, stillFreeCats: free.length, unfilledWorkplaces: slots.reduce((a, s) => a + s.open, 0), note: rebalance ? '' : 'Jedna kočka zůstává volná na nošení a sklizeň (rebalance: true obsadí všechny).' };
  },
  build_many({ type, count = 3, near_x, near_y }) {
    need(count <= 30, 'Max 30'); const built = [], errors = [];
    for (let i = 0; i < count; i++) { const s = AI_CMDS.find_spot({ type, near_x, near_y, count: 1 }).spots[0]; if (!s) { errors.push('došlo místo'); break; } try { AI_CMDS.build({ type, x: s.x, y: s.y }); built.push(s); } catch (e) { errors.push(e.message); break; } }
    return { type, built, errors };
  },
  batch({ commands, mode = 'best_effort' }) { need(['atomic', 'sequential', 'best_effort'].includes(mode), 'mode: atomic | sequential | best_effort'); return runBatchSync(commands, mode); },
  async dry_run({ commands, then_hours = 0 }) {
    const snap = snapshot(), before = { coins: G.coins, stock: Object.assign({}, G.stock), n: BLIST.length }; QUIET = true;
    try {
      const res = runBatchSync(commands, 'best_effort'); const sim = then_hours ? await runSim(then_hours, null) : null;
      return { results: res.results.map(r => ({ tool: r.tool, ok: r.ok, error: r.error })), coinsChange: Math.floor(G.coins - before.coins), stockChange: stockDiff(before.stock, G.stock), buildingsChange: BLIST.length - before.n, after: summary(), simulated: sim && sim.gameHoursPassed, note: 'Nanečisto — nic se nezměnilo.' };
    } finally { restore(snap); QUIET = false; }
  },
  async skip_time({ game_hours = 6, stop_on = [] }) {
    need(game_hours > 0 && game_hours <= 24 * 20, 'game_hours 1–480');
    const stops = (Array.isArray(stop_on) ? stop_on : [stop_on]).filter(Boolean); stops.forEach(s => need(STOPS[s], 'stop_on: ' + Object.keys(STOPS).join(', ')));
    return runSim(game_hours, st => stops.find(s => STOPS[s](st)));
  },
  async simulate_until({ condition, conditions, max_game_days = 5 }) {
    need(max_game_days > 0 && max_game_days <= 30, 'max_game_days 1–30');
    const list = conditions || [condition]; list.forEach(c => cond(c));
    const r = await runSim(max_game_days * 24, () => list.find(c => cond(c)));
    r.conditionMet = list.some(c => cond(c)); return r;
  },
  async simulate_preview({ game_days = 2 }) {
    need(game_days <= 10, 'max 10 dní'); const snap = snapshot(), before = { coins: G.coins, stock: Object.assign({}, G.stock), cats: G.cats.length }; QUIET = true; const evFrom = evN;
    try { const r = await runSim(game_days * 24, null); return { after: r.now, coinsChange: Math.floor(G.coins - before.coins), catsChange: G.cats.length - before.cats, stockChange: stockDiff(before.stock, G.stock), problems: advProblems().map(p => p[1]), events: EV.filter(e => e.n > evFrom && e.kind === 'banner').map(e => e.text).slice(0, 15), note: 'Nanečisto — svět se vrátil do původního stavu.' }; }
    finally { restore(snap); QUIET = false; }
  },
  async fast_forward_report({ game_days = 2, interval_hours = 12 }) {
    need(game_days <= 20, 'max 20 dní'); const line = [];
    for (let h = 0; h < game_days * 24; h += interval_hours) { const from = evN; await runSim(interval_hours, null); line.push(Object.assign(summary(), { events: EV.filter(e => e.n > from && e.kind === 'banner').map(e => e.text.split(' — ')[0]).slice(0, 5) })); }
    return { timeline: line };
  },
  async ensure_running({ speed = 1 }) {
    hideMenu(); if (UI.interior && typeof leaveFactory === 'function') leaveFactory();
    if (typeof RACE !== 'undefined') RACE = null; if (typeof FISH !== 'undefined') FISH = null; if (typeof MEM !== 'undefined') MEM = null;
    if (typeof started !== 'undefined' && !started) startPlaying();
    UI.speed = [1, 2, 4].includes(speed) ? speed : 1; UI.prevSpeed = UI.speed; renderHUD();
    const t0 = G.t; await new Promise(r => setTimeout(r, 1500));
    const moved = G.t - t0;
    return { running: moved > 0, speed: UI.speed, gameMinutesIn1_5s: Math.round(moved / DAY * 1440), windowHidden: document.hidden, note: moved > 0 ? 'Simulace běží.' : 'Čas se nepohnul — použij skip_time.' };
  },
  events({ since = 0, types } = {}) { const t = types && [].concat(types); const list = EV.filter(e => e.n > since && (!t || t.includes(e.kind))); return { cursor: evN, events: list.slice(-80) }; },
  checkpoint({ action = 'list', name }) {
    const key = n => 'drobeckov2_ai_cp_' + n, idx = store.get('drobeckov2_ai_cps', []);
    if (action === 'list') return { checkpoints: idx };
    need(name && /^[\w-]{1,24}$/.test(name), 'name: písmena, čísla, - _');
    if (action === 'save') { store.put(key(name), LZ.compress(snapshot())); const i = idx.filter(x => x.name !== name); i.unshift({ name, day: dayIdx() + 1, coins: Math.floor(G.coins), cats: G.cats.length, town: G.name }); store.set('drobeckov2_ai_cps', i.slice(0, 12)); return { saved: name }; }
    if (action === 'restore') { const raw = store.raw(key(name)); need(raw, 'Checkpoint neexistuje'); restore(LZ.decompress(raw)); return { restored: name, now: summary() }; }
    if (action === 'delete') { store.del(key(name)); store.set('drobeckov2_ai_cps', idx.filter(x => x.name !== name)); return { deleted: name }; }
    throw new Error('action: list | save | restore | delete');
  },
  notes({ action = 'list', text, tags, x, y, note_id, resolved, pinned }) {
    if (!G.aiNotes) G.aiNotes = [];
    if (action === 'add') { need(text, 'text'); const n = { id: (G.aiNotes.reduce((a, n) => Math.max(a, n.id), 0) + 1), text, tags: tags || [], at: x != null ? { x, y } : undefined, day: dayIdx() + 1, resolved: false, pinned: !!pinned }; G.aiNotes.push(n); return n; }
    if (action === 'update') { const n = G.aiNotes.find(n => n.id === note_id); need(n, 'Poznámka neexistuje'); if (text) n.text = text; if (resolved != null) n.resolved = resolved; if (pinned != null) n.pinned = pinned; return n; }
    if (action === 'delete') { G.aiNotes = G.aiNotes.filter(n => n.id !== note_id); return { ok: true }; }
    const t = tags && [].concat(tags);
    return G.aiNotes.filter(n => (!t || t.some(g => n.tags.includes(g))) && (resolved == null || n.resolved === resolved)).sort((a, b) => b.pinned - a.pinned);
  },
  rules({ action = 'list', condition, then, once = false, cooldown_hours = 6, rule_id }) {
    if (!G.aiRules) G.aiRules = [];
    if (action === 'add') { cond(condition); need(Array.isArray(then) && then.length, 'then = pole příkazů jako v batch'); then.forEach(c => need(AI_CMDS[c.tool] && !ASYNC.has(c.tool), 'V pravidle nejde: ' + c.tool)); const r = { id: (G.aiRules.reduce((a, r) => Math.max(a, r.id), 0) + 1), condition, then, once, cooldown_hours }; G.aiRules.push(r); return r; }
    if (action === 'remove') { G.aiRules = G.aiRules.filter(r => r.id !== rule_id); return { ok: true }; }
    return { rules: G.aiRules, note: 'Pravidla se kontrolují každou herní hodinu. Příklad: {condition:"storage_used_pct > 90", then:[{tool:"sell", item:"mrkev", excess_over:40}]}' };
  },
  recommend_next_actions({ limit = 6 } = {}) {
    const R = [], add = (why, cmd) => R.push({ why, suggested: cmd });
    for (const o of G.orders) if (canDeliver(o)) add(`Zakázka od ${orderClient(o).n} jde doručit (+${o.coins})`, { tool: 'deliver_order', order_id: o.id });
    const unstaffed = BLIST.filter(b => b.built && B[b.type].workers && !G.cats.some(c => c.job === b.id));
    if (unstaffed.length && G.cats.some(c => !c.job)) add(`${unstaffed.length} dílen bez pracovníka`, { tool: 'auto_assign' });
    if (storeRoom() <= 5) { const top = Object.entries(G.stock).sort((a, b) => b[1] - a[1])[0]; if (top) add(`Sklad je plný, nejvíc je ${itemName(top[0])} (${top[1]})`, { tool: 'sell', item: top[0], excess_over: 30 }); }
    for (const p of advProblems()) add('Rádce: ' + p[1], null);
    const blocked = AI_CMDS.construction_status().filter(s => s.blockedBy.length); if (blocked.length) add(`${blocked.length} stavenišť čeká na materiál (${[...new Set(blocked.flatMap(s => s.blockedBy))].join(', ')})`, { tool: 'construction_status' });
    const next = ERAS[eraOf() + 1]; if (next) add('Do další éry: ' + next.hint, null);
    if (G.wishes && G.wishes.some(w => w.done && !w.claimed)) add('Splněná přání dne čekají na vyzvednutí', { tool: 'claim_rewards' });
    return R.slice(0, limit);
  }
});
})();
