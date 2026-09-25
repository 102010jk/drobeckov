'use strict';
/* ============ 4.0: transport — freight depot & trucks, bus stops, traffic lights, bio-diesel ============ */
const ERA_MESTO = 4;
Object.assign(ITEMS, { bionafta: { n: 'Bionafta', v: 14 } });
addSprites({ bionafta: ['..kk..', '.kggk.', 'gGGGGg', 'GgwgGG', 'GggwGG', 'GgggGG', '.GGGG.'] });
RECIPES.bionafta = { in: { olej: 1 }, out: 'bionafta', n: 2, t: 8 };
Object.assign(TECH, {
  elektromobily: { n: 'Elektromobily', cost: { elektro: 4, vykres: 6 }, req: ['elektronika'], d: 'Nákladní auta jezdí na elektřinu místo bionafty.' }
});
const nearRoad = (x, y, r) => { for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) if (tile(x + i, y + j).gr === 'asfalt') return true; return false; };
Object.assign(B, {
  rafinerie: { n: 'Rafinérie', cat: 'vyroba', w: 2, h: 2, cost: 600, mat: { ocel: 6, cihly: 12 }, work: 16, workers: 1, recipes: ['bionafta'], era: ERA_MESTO, noise: 4, chimney: [24, -4], darkSmoke: 1,
    desc: 'Ze slunečnicového oleje dělá bionaftu pro nákladní auta.' },
  depo: { n: 'Nákladní depo', cat: 'vyroba', w: 3, h: 2, cost: 1400, mat: { ocel: 12, cihly: 20, prkna: 10 }, work: 20, workers: 1, era: ERA_MESTO, noise: 3,
    need: (x, y) => nearRoad(x + 1, y + 2, 2), needTxt: 'Depo musí stát u asfaltové silnice',
    desc: 'Nákladní auta vozí zboží po silnicích na dlouhé trasy, aby kočky nemusely chodit přes celé město. Dispečer v depu, bionafta (nebo elektřina po výzkumu Elektromobily) a obě budovy u silnice.' },
  zastavka: { n: 'Autobusová zastávka', cat: 'cesty', w: 1, h: 1, cost: 120, mat: { ocel: 1, sklo: 2 }, instant: 1, nodoor: 1, era: ERA_MESTO,
    need: (x, y) => nearRoad(x, y, 1), needTxt: 'Zastávka patří hned vedle silnice',
    desc: 'Kočky, které to mají do práce nebo domů daleko, jedou autobusem mezi dvěma zastávkami.' },
  semafor: { n: 'Semafor', cat: 'cesty', w: 1, h: 1, cost: 80, mat: { ocel: 1, sklo: 1 }, instant: 1, nodoor: 1, era: ERA_MESTO,
    need: (x, y) => { for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) if (JUNCTION(x + i, y + j)) return true; return false; }, needTxt: 'Semafor patří k rohu křižovatky',
    desc: 'Řídí křižovatku vedle sebe: auta se střídají po 4 sekundách a nemusí na sebe čekat.' }
});

/* ---------- road graph: BFS over asphalt, cached until roads change ---------- */
const RPATH = new Map(); let RPATH_V = -1;
function roadPath(sx, sy, tx, ty) {
  if (RPATH_V !== pathVersion) { RPATH.clear(); RPATH_V = pathVersion; }
  const key = sx + ',' + sy + '>' + tx + ',' + ty;
  if (RPATH.has(key)) return RPATH.get(key);
  const K = (x, y) => (x + 32768) * 65536 + (y + 32768), X = k => Math.floor(k / 65536) - 32768, Y = k => (k % 65536) - 32768;
  const prev = new Map(), s = K(sx, sy), goal = K(tx, ty), q = [s]; prev.set(s, -1);
  let found = s === goal;
  for (let h = 0; h < q.length && !found; h++) {
    const k = q[h], x = X(k), y = Y(k);
    for (let d = 0; d < 4; d++) {
      const nx = x + FDX[d], ny = y + FDY[d], nk = K(nx, ny);
      if (prev.has(nk) || !isRoad(nx, ny)) continue;
      prev.set(nk, k); q.push(nk); if (nk === goal) { found = true; break; }
    }
  }
  let path = null;
  if (found) { path = []; for (let k = goal; k !== -1; k = prev.get(k)) path.push([X(k), Y(k)]); path.reverse(); }
  if (RPATH.size > 3000) RPATH.clear();
  RPATH.set(key, path);
  return path;
}
const RSPOT = new Map(); let RSPOT_V = -1;
function roadSpot(b) {   // the asphalt tile a vehicle stops at for this building
  if (RSPOT_V !== pathVersion) { RSPOT.clear(); RSPOT_V = pathVersion; }
  if (RSPOT.has(b.id)) return RSPOT.get(b.id);
  const a = access(b) || [b.x, b.y + b.h];
  let best = null, bd = 1e9;
  for (let j = -3; j <= b.h + 3; j++) for (let i = -3; i <= b.w + 3; i++) {
    const x = b.x + i, y = b.y + j; if (!isRoad(x, y)) continue;
    const d = Math.abs(x - a[0]) + Math.abs(y - a[1]); if (d < bd) { bd = d; best = [x, y]; }
  }
  RSPOT.set(b.id, best);
  return best;
}

/* ---------- freight depot & trucks ---------- */
const TRUCK_CAP = 12, TRUCK_MIN = 8;   // trucks take trips of at least TRUCK_MIN tiles
const fleetOf = b => 3 + 2 * ((b.lvl || 1) - 1);
const electric = () => hasTech('elektromobily');
Object.assign(B.depo, {
  wants: () => (electric() ? null : ['bionafta']),
  inNeed: (b, k) => (k === 'bionafta' && !electric() ? 16 - (b.inp.bionafta || 0) - (b.inc.bionafta || 0) : 0),
  canWork: () => true,
  produce: b => { b.lastWork = G.t; },
  status: b => {
    if (!roadSpot(b)) return ['Depo není u silnice', 'bad'];
    if (!b.workers.length) return ['Chybí dispečer — přiřaď kočku', 'bad'];
    if (!electric() && !(b.inp.bionafta > 0)) return ['Chybí bionafta (Rafinérie)', 'bad'];
    const t = CARS.filter(c => c.job && c.depot === b.id), busy = t.filter(c => c.job.item).length;
    return [`Auta: ${busy}/${fleetOf(b)} na cestě · převezeno ${fmt(b.moved || 0)} kusů`, 'ok'];
  },
  inspect: b => `<p class="muted">Nákladní auta si sama berou dlouhé cesty z tabule úkolů (aspoň ${TRUCK_MIN} dlaždic) dřív než kočky, každé uveze ${TRUCK_CAP} kusů. Obě budovy musí být do 3 dlaždic od silnice spojené s depem. ${electric() ? 'Jezdí na elektřinu.' : 'Každá jízda spotřebuje 1 bionaftu.'}</p>`
});
function truckFree(c) { c.job = { item: null }; const home = G.bld[c.depot], rs = home && roadSpot(home); if (rs && (c.x !== rs[0] || c.y !== rs[1])) setRoute(c, roadPath(c.x, c.y, rs[0], rs[1])); else { c.stop = true; c.p = 0; } }
function truckArrive(c) {
  const j = c.job; if (!j || !j.item) { c.stop = true; return; }
  c.stop = true; c.wait = 1.2;
  if (j.stage === 'src') {
    let take = 0;
    if (j.from === 'S') { take = Math.min(j.n, G.stock[j.item] || 0); if (take > 0) takeStock(j.item, take); }
    else { const b = G.bld[j.from]; if (b) { take = Math.min(j.n, b.out[j.item] || 0); if (take > 0) { b.out[j.item] -= take; if (b.out[j.item] <= 0) delete b.out[j.item]; } } }
    if (take <= 0) { truckFree(c); return; }
    j.n = take; j.stage = 'dst'; c.cargo = { item: j.item, n: take };
    c.next = () => { const d = j.to === 'S' ? null : G.bld[j.to], rs = d ? roadSpot(d) : j.drop; const r = rs && roadPath(c.x, c.y, rs[0], rs[1]); if (r) setRoute(c, r); else { addStock(j.item, j.n); c.cargo = null; truckFree(c); } };
    return;
  }
  const it = c.cargo; c.cargo = null;
  if (it) {
    const b = j.to === 'S' ? null : G.bld[j.to];
    if (!b) addStock(it.item, it.n);
    else if (!b.built) { const need = (b.need && b.need[it.item]) || 0, use = Math.min(need, it.n); b.need[it.item] = need - use; addStock(it.item, it.n - use); }
    else if (B[b.type].receive) B[b.type].receive(b, it.item, it.n);
    else b.inp[it.item] = (b.inp[it.item] || 0) + it.n;
    const dep = G.bld[c.depot]; if (dep) dep.moved = (dep.moved || 0) + it.n;
    G.stats.truckLoads = (G.stats.truckLoads || 0) + 1; G.stats.truckItems = (G.stats.truckItems || 0) + it.n;
  }
  c.next = () => truckFree(c);
}
function storeFor(x, y) {   // the store with a road stop closest to (x, y)
  let best = null, bd = 1e9;
  for (const b of BLIST) { if (!B[b.type].store || !b.built) continue; const rs = roadSpot(b); if (!rs) continue; const d = Math.abs(rs[0] - x) + Math.abs(rs[1] - y); if (d < bd) { bd = d; best = b; } }
  return best;
}
function dispatch(dep, c) {
  if (!electric() && !(dep.inp.bionafta > 0)) return false;
  if (electric() && typeof powerOK === 'function' && !powerOK()) return false;
  let best = null, bs = 0;
  for (const j of JOBS) {
    const k = j.task; if (k.kind !== 'haul' || j.n < 2 || j.len < TRUCK_MIN) continue;
    const dst = k.to === 'S' ? null : G.bld[k.to], src = k.from === 'S' ? null : G.bld[k.from];
    const drs = dst ? roadSpot(dst) : null, srs = src ? roadSpot(src) : null;
    if ((dst && !drs) || (src && !srs)) continue;
    const s0 = src ? srs : (drs && storeFor(drs[0], drs[1]) ? roadSpot(storeFor(drs[0], drs[1])) : null);
    const d0 = dst ? drs : (srs && storeFor(srs[0], srs[1]) ? roadSpot(storeFor(srs[0], srs[1])) : null);
    if (!s0 || !d0) continue;
    const toSrc = Math.abs(s0[0] - c.x) + Math.abs(s0[1] - c.y), n = Math.min(j.n, TRUCK_CAP);
    const sc = n * j.len / (toSrc + 12);
    if (sc > bs && roadPath(c.x, c.y, s0[0], s0[1]) && roadPath(s0[0], s0[1], d0[0], d0[1])) { bs = sc; best = { j, s0, d0, n }; }
  }
  if (!best) return false;
  const { j, s0, d0, n } = best, k = j.task;
  j.n -= n;
  if (electric()) usePower(); else { dep.inp.bionafta--; if (dep.inp.bionafta <= 0) delete dep.inp.bionafta; }
  c.job = { kind: 'haul', from: k.from, to: k.to, item: k.item, n, stage: 'src', drop: d0 };
  setRoute(c, roadPath(c.x, c.y, s0[0], s0[1]));
  return true;
}
let dispT = 0;
STEP_HOOKS.push(dt => {
  for (const c of CARS) if (c.stop && c.wait > 0) { c.wait -= dt; if (c.wait <= 0 && c.next) { const f = c.next; c.next = null; f(); } }
  dispT -= dt; if (dispT > 0) return; dispT = 0.5;
  for (const dep of BLIST) {
    if (dep.type !== 'depo' || !dep.built) continue;
    const rs = roadSpot(dep), mine = CARS.filter(c => c.depot === dep.id);
    if (!rs || !dep.workers.length) { for (const c of mine) if (!c.job || !c.job.item) c.dead = true; continue; }
    for (let i = mine.length; i < fleetOf(dep); i++) CARS.push({ x: rs[0], y: rs[1], d: 0, p: 0, k: 'nakladak', v: 2.6, depot: dep.id, job: { item: null }, stop: true, onArrive: truckArrive, onDead: truckDead });
    for (const c of mine) if (c.stop && !c.next && (!c.job || !c.job.item)) dispatch(dep, c);
  }
  for (const c of CARS) if (c.depot && !G.bld[c.depot]) c.dead = true;
});
function truckDead(c) { if (c.cargo) { addStock(c.cargo.item, c.cargo.n); c.cargo = null; } }
/* trucks pick first: right after the job board is rebuilt, before any cat looks at it */
const _buildJobsT = buildJobs;
buildJobs = function () {
  _buildJobsT();
  for (const dep of BLIST) if (dep.type === 'depo' && dep.built && dep.workers.length) for (const c of CARS) if (c.depot === dep.id && c.stop && !c.next && (!c.job || !c.job.item)) dispatch(dep, c);
};
/* reservations: what trucks carry counts like what cats carry */
const _recountT = recount;
recount = function () { _recountT(); for (const c of CARS) if (c.job && c.job.item) reserveTask(c.job); };
/* cargo on the road is saved back into the store */
const _serializeT = serialize;
serialize = function () { const o = _serializeT(); for (const c of CARS) if (c.cargo) o.stock[c.cargo.item] = (o.stock[c.cargo.item] || 0) + c.cargo.n; return o; };
const _deserializeT = deserialize;
deserialize = function (s) { CARS.length = 0; return _deserializeT(s); };
const _newGameT = newGame;
newGame = function (o) { CARS.length = 0; return _newGameT(o); };

/* ---------- buses: cats ride between two stops when the walk is long ---------- */
const stopsList = () => BLIST.filter(b => b.type === 'zastavka' && b.built && roadSpot(b));
function nearestStop(x, y, max) { let best = null, bd = max; for (const s of stopsList()) { const d = Math.abs(s.x - x) + Math.abs(s.y - y); if (d < bd) { bd = d; best = s; } } return best; }
const _startTaskT = startTask;
startTask = function (c, k) {
  const ok = _startTaskT(c, k);
  if (!ok || !c.path || c.path.length < (typeof policy === 'function' && policy('mhd') ? 18 : 26) || c.bus || eraOf() < ERA_MESTO) return ok;
  const [cx, cy] = ctile(c), end = c.path[c.path.length - 1];
  const A = nearestStop(cx, cy, 12), Bs = A && nearestStop(end.x, end.y, 12);
  if (!A || !Bs || A === Bs) return ok;
  const ra = roadSpot(A), rb = roadSpot(Bs), ride = ra && rb && roadPath(ra[0], ra[1], rb[0], rb[1]);
  if (!ride) return ok;
  const aa = access(A), toA = aa && findPath(cx, cy, aa[0], aa[1]);
  const walkTotal = (toA ? toA.length : 99) + Math.abs(Bs.x - end.x) + Math.abs(Bs.y - end.y) + ride.length / 4;
  if (!toA || walkTotal > c.path.length * 0.8) return ok;
  c.bus = { a: A.id, b: Bs.id, dest: c.dest, end: [end.x, end.y], stage: 'walk', ride: ride.length };
  c.path = toA; c.dest = [aa[0] * TS + 8, aa[1] * TS + 10];
  return ok;
};
const _moveCatT = moveCat;
moveCat = function (c, dt) {
  const done = _moveCatT(c, dt);
  if (!done || !c.bus) return done;
  if (c.bus.stage === 'walk') {
    c.bus.stage = 'ride'; c.inside = true; c.busT = 1.5 + c.bus.ride / 5;
    G.stats.busRides = (G.stats.busRides || 0) + 1;
    const A = G.bld[c.bus.a], Bs = G.bld[c.bus.b], ra = A && roadSpot(A), rb = Bs && roadSpot(Bs);
    if (ra && rb && !CARS.some(v => v.bus && v.bus[0] === c.bus.a && v.bus[1] === c.bus.b)) {
      const bus = { x: ra[0], y: ra[1], d: 0, p: 0, k: 'autobus', v: 3, bus: [c.bus.a, c.bus.b], onArrive: v => { v.dead = true; } };
      CARS.push(bus); setRoute(bus, roadPath(ra[0], ra[1], rb[0], rb[1]));
    }
    return false;
  }
  if (c.bus.stage === 'walk2') c.bus = null;
  return done;
};
const _updateCatT = updateCat;
updateCat = function (c, dt) {
  if (c.bus && c.bus.stage === 'ride') {
    if (!c.task) { c.inside = false; c.bus = null; return; }
    c.busT -= dt; if (c.busT > 0) return;
    const Bs = G.bld[c.bus.b], ab = Bs && access(Bs);
    c.inside = false;
    if (!ab) { c.bus = null; endTask(c); return; }
    c.x = ab[0] * TS + 8; c.y = ab[1] * TS + 10;
    const p = findPath(ab[0], ab[1], c.bus.end[0], c.bus.end[1]);
    c.dest = c.bus.dest; c.bus.stage = 'walk2';
    if (!p) { c.bus = null; endTask(c); return; }
    c.path = p;
    return;
  }
  return _updateCatT(c, dt);
};
if (typeof C_TRANSIENT !== 'undefined') C_TRANSIENT.push('bus', 'busT');

/* ---------- pictures (assets/budovy has the real ones) ---------- */
DRAW.depo = (g, X, Y, b, S) => {
  shape(g, [[X + 1, Y + 6, 46, 26, '#c4cad8']]); R(g, '#9aa0b4', X + 1, Y + 6, 46, 3); if (S === 3) R(g, '#ffffff', X + 1, Y + 6, 46, 2);
  for (let i = 0; i < 3; i++) { shape(g, [[X + 4 + i * 14, Y + 14, 12, 18, '#5d6480']]); for (let y = 15; y < 32; y += 2) R(g, '#6e7488', X + 5 + i * 14, Y + y, 10, 1); }
  R(g, '#e8962a', X + 2, Y + 10, 44, 2);
};
DRAW.rafinerie = (g, X, Y, b, S) => {
  shape(g, [[X + 2, Y + 10, 16, 22, '#c4cad8'], [X + 20, Y + 4, 10, 28, '#9aa0b4']]); R(g, '#5aa84a', X + 3, Y + 16, 14, 3);
  for (let y = 8; y < 30; y += 4) R(g, '#6e7488', X + 21, Y + y, 8, 1); if (S === 3) R(g, '#ffffff', X + 2, Y + 10, 16, 2);
};
DRAW.zastavka = (g, X, Y) => { shape(g, [[X + 2, Y - 4, 12, 3, '#3a74c8'], [X + 3, Y - 1, 1, 15, '#5d6480'], [X + 12, Y - 1, 1, 15, '#5d6480']]); R(g, '#bfe4f4', X + 4, Y, 8, 9); R(g, '#a8693e', X + 4, Y + 10, 8, 2); shape(g, [[X + 13, Y - 8, 3, 3, '#ffd23f']]); };
DRAW.semafor = (g, X, Y) => { shape(g, [[X + 7, Y + 2, 2, 13, '#3e3852'], [X + 5, Y - 7, 6, 10, '#3e3852']]); };
ANIM.semafor = (g, X, Y) => { const a = greenAxis(); R(g, a ? '#ff5050' : '#5d2a2a', X + 6, Y - 6, 4, 2); R(g, '#5d5a2a', X + 6, Y - 3, 4, 2); R(g, a ? '#2a5d2a' : '#50e070', X + 6, Y, 4, 2); };
for (const [k, v] of [['depo', 2], ['rafinerie', 12], ['zastavka', 8], ['semafor', 7]]) B[k].top = v;

/* ---------- help ---------- */
{ const p = HELP.find(x => x.id === 'mesto'); if (p) p.t += `<p><b>Nákladní depo</b> (éra Město a doprava) posílá nákladní auta na dlouhé cesty — každé uveze ${TRUCK_CAP} kusů. Depo potřebuje dispečera, bionaftu z <b>Rafinérie</b> (olej → bionafta) a budovy do 3 dlaždic od silnice. Po výzkumu <b>Elektromobily</b> jezdí na proud.</p>
<p><b>Autobusové zastávky</b>: když to má kočka do práce daleko a u startu i cíle je zastávka, jede autobusem. <b>Semafor</b> u křižovatky střídá směry, takže auta na sebe nečekají.</p>`; }
