'use strict';
/* ============ job board ============
   Every 0.25 s of game time the board lists all work in the valley once.
   Cats then pick from this short list by priority and distance. */
let JOBS = [], jobsT = 0, jobsDirty = true;
function recount() {
  G.res = {}; G.incStore = 0;
  for (const b of BLIST) { b.inc = {}; b.outRes = {}; b.farmer = 0; b.builders = 0; }
  for (const c of G.cats) reserveTask(c.task);
  if (typeof FUN_BUSY !== 'undefined') { FUN_BUSY.clear(); for (const c of G.cats) if (c.task && c.task.kind === 'rest') FUN_BUSY.add(c.task.b); }
}
function reserveTask(k) {
  if (!k) return;
  if (k.kind === 'haul') {
    if (k.stage === 'src') {
      if (k.from === 'S') G.res[k.item] = (G.res[k.item] || 0) + k.n;
      else { const b = G.bld[k.from]; if (b) b.outRes[k.item] = (b.outRes[k.item] || 0) + k.n; }
    }
    if (k.to === 'S') G.incStore += k.n;
    else { const b = G.bld[k.to]; if (b) b.inc[k.item] = (b.inc[k.item] || 0) + k.n; }
  } else if (k.kind === 'eat' && k.stage === 'src') { if (k.from) { const b = G.bld[k.from]; if (b) b.outRes[k.item] = (b.outRes[k.item] || 0) + 1; } else G.res[k.item] = (G.res[k.item] || 0) + 1; }
  else if (k.kind === 'farm') { const b = G.bld[k.b]; if (b) b.farmer = 1; }
  else if (k.kind === 'build') { const b = G.bld[k.b]; if (b) b.builders++; }
}
const mdist = (ax, ay, bx, by) => Math.abs(ax - bx) + Math.abs(ay - by);
function buildJobs() {
  recount();
  JOBS = [];
  const stores = [];
  for (const b of BLIST) { b._a = access(b); if (B[b.type].store && b.built && b._a) stores.push(b); }
  const nearStore = (x, y) => { let best = null, bd = 1e9; for (const s of stores) { const d = mdist(x, y, s._a[0], s._a[1]); if (d < bd) { bd = d; best = s; } } return best; };
  // who can take which item
  const CONS = {};
  for (const b of BLIST) {
    if (!b._a || B[b.type].market) continue;
    let items;
    if (!b.built) items = b.need ? Object.keys(b.need).filter(k => b.need[k] > 0) : [];
    else items = wantedItems(b) || [];
    for (const it of items) (CONS[it] || (CONS[it] = [])).push(b);
  }
  let room = storeRoom();
  for (const b of BLIST) {
    const d = B[b.type], a = b._a;
    if (!a) continue;
    if (b.unreach && G.t - b.unreach < 5) continue;
    if (!b.built) {
      let pending = false;
      for (const item in (b.need || {})) {
        if (b.need[item] > 0) pending = true;
        const rem = b.need[item] - (b.inc[item] || 0), av = avail(item);
        if (rem > 0 && av > 0) { const st = nearStore(a[0], a[1]); if (st) JOBS.push({ task: { kind: 'haul', from: 'S', to: b.id, item }, n: Math.min(rem, av), pri: b.prio ? 4.2 : 3, sx: st._a[0], sy: st._a[1], len: mdist(st._a[0], st._a[1], a[0], a[1]), from: 0, to: b.id }); }
      }
      const maxB = b.prio ? 3 : 2;
      if (!pending && b.builders < maxB) JOBS.push({ task: { kind: 'build', b: b.id }, n: maxB - b.builders, pri: b.prio ? 4 : 2.8, sx: a[0], sy: a[1], len: 0, trait: 'drevar', from: 0, to: b.id });
      continue;
    }
    if (d.field && !b.farmer && fieldNeedsWork(b)) JOBS.push({ task: { kind: 'farm', b: b.id }, n: 1, pri: 2.6, sx: a[0], sy: a[1], len: 0, trait: 'zahradnik', from: 0, to: b.id });
    for (const item in b.out) {
      const free = b.out[item] - (b.outRes[item] || 0); if (free <= 0) continue;
      const full = sumObj(b.out) >= OUTCAP;
      let best = null, bd = 1e9;
      const list = CONS[item];
      if (list) for (const b2 of list) { if (b2 === b) continue; const need = inNeed(b2, item); if (need <= 0) continue; const dd = mdist(a[0], a[1], b2._a[0], b2._a[1]); if (dd < bd) { bd = dd; best = b2; } }
      if (best) JOBS.push({ task: { kind: 'haul', from: b.id, to: best.id, item }, n: Math.min(free, inNeed(best, item)), pri: full ? 3.2 : 2.5, sx: a[0], sy: a[1], len: bd, from: b.id, to: best.id });
      else if (room > 0) { const st = nearStore(a[0], a[1]); if (st) { const n = Math.min(free, room); room -= n; JOBS.push({ task: { kind: 'haul', from: b.id, to: 'S', item }, n, pri: full ? 2.9 : 1.8, sx: a[0], sy: a[1], len: mdist(a[0], a[1], st._a[0], st._a[1]), from: b.id, to: 0 }); } }
    }
    const want = wantedItems(b);
    if (want) for (const item of want) {
      const need = inNeed(b, item), av = avail(item); if (need <= 0 || av <= 0) continue;
      const st = nearStore(a[0], a[1]); if (!st) continue;
      JOBS.push({ task: { kind: 'haul', from: 'S', to: b.id, item }, n: Math.min(need, av), pri: d.market ? 1.3 : 2.2, sx: st._a[0], sy: st._a[1], len: mdist(st._a[0], st._a[1], a[0], a[1]), from: 0, to: b.id });
    }
  }
  jobsDirty = false;
}
/* pick the best few jobs for this cat */
function jobsFor(c, maxN) {
  const [cx, cy] = ctile(c), own = c.job, out = [];
  for (const j of JOBS) {
    if (j.n <= 0) continue;
    let pri = j.pri;
    if (own && j.task.kind === 'haul') { if (j.to === own) pri += 1.5; else if (j.from === own) pri += 0.8; }
    if (j.trait && c.trait === j.trait) pri += 0.7;
    const s = pri * 100 / (8 + mdist(cx, cy, j.sx, j.sy) + j.len);
    if (out.length < maxN) { out.push([s, j]); out.sort((p, q) => q[0] - p[0]); }
    else if (s > out[maxN - 1][0]) { out[maxN - 1] = [s, j]; out.sort((p, q) => q[0] - p[0]); }
  }
  return out.map(o => o[1]);
}
