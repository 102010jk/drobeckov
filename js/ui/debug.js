'use strict';
/* ============ 3.6: debug menu (F9 or the key left of 1) & ready-made test worlds for every era ============ */

/* ---------- run game code without toasts, banners and sounds ---------- */
function dbgQuiet(fn) {
  const t0 = toast, b0 = banner, s0 = {};
  for (const k in Sound) if (typeof Sound[k] === 'function') { s0[k] = Sound[k]; Sound[k] = () => {}; }
  toast = () => {}; banner = () => {};
  try { return fn(); } finally { toast = t0; banner = b0; Object.assign(Sound, s0); }
}

/* ---------- land: the town grows around its main street ---------- */
const dbgCenter = () => [G.origin[0] * PS + 13, G.origin[1] * PS + 9];   // the starter village's main street
function dbgOwn(px, py) {
  if (ownedP(px, py)) return;
  G.owned.push([px, py]); rebuildOwned();
  G.stats.parcels = (G.stats.parcels || 0) + 1;
  const inf = parcelInfo(px, py);
  if (inf.poi && !G.poiDone[inf.poi.id]) discoverPOI(inf.poi);
}
function dbgGrow(n) {
  const [cx, cy] = dbgCenter(), cpx = cx / PS, cpy = cy / PS;
  while (G.owned.length < n) {
    let best = null, bd = 1e9;
    for (const [px, py] of G.owned) for (const [ax, ay] of [[px + 1, py], [px - 1, py], [px, py + 1], [px, py - 1]]) {
      if (ownedP(ax, ay)) continue;
      const d = Math.pow(ax + 0.5 - cpx, 2) * 0.55 + Math.pow(ay + 0.5 - cpy, 2) + parcelInfo(ax, ay).water / 20 + hashi(ax, ay, 7);
      if (d < bd) { bd = d; best = [ax, ay]; }
    }
    if (!best) return;
    dbgOwn(best[0], best[1]);
  }
}
/* buy a chain of parcels from the valley to tile (x, y) */
function dbgReach(x, y) {
  const tx = x >> 3, ty = y >> 3;
  for (let guard = 0; guard < 40 && !ownedP(tx, ty); guard++) {
    let best = null, bd = 1e9;
    for (const [px, py] of G.owned) { const d = Math.abs(px - tx) + Math.abs(py - ty); if (d < bd) { bd = d; best = [px, py]; } }
    const [px, py] = best;
    if (Math.abs(tx - px) >= Math.abs(ty - py)) dbgOwn(px + Math.sign(tx - px), py); else dbgOwn(px, py + Math.sign(ty - py));
  }
}

/* ---------- buildings: streets every 4 rows, houses face the street, a gap between neighbours ---------- */
function dbgPut(type, x, y, o) {
  const b = place(type, x, y); if (!b) return null;
  if (!b.built) { b.built = true; delete b.need; b.work = 0; if (B[type].onBuilt) B[type].onBuilt(b); }
  o = o || {};
  if (o.recipe && B[type].recipes && B[type].recipes.includes(o.recipe)) b.recipe = o.recipe;
  if (o.lvl) b.lvl = o.lvl;
  if (o.line) dbgLine(b, o.line);
  if (o.rocket != null) b.stage = o.rocket;
  if (type === 'depo') b.inp.bionafta = 16;
  rebuildLists();
  return b;
}
/* village → city: early eras keep houses apart and a little random, the late city packs them into streets */
const DBG_STYLE = { gap: 1, jitter: 0 };
function dbgSlots(d, row) {
  const [cx, cy] = dbgCenter(), w = d.w || 1, h = d.h || 1, bb = G.bb, out = [], J = DBG_STYLE.jitter;
  const sameNext = (x, y) => [x - 1, x + w].some(i => { const t = tile(i, y); return t.b && G.bld[t.b] && G.bld[t.b].type === row; });
  for (let k = -14; k <= 14; k++) {
    const road = cy + 4 * k, y = road - h;
    if (y < bb.y0 || road > bb.y1) continue;
    for (let x = bb.x0; x <= bb.x1 - w + 1; x++) out.push([x, y, Math.abs(x + w / 2 - cx) + Math.abs(y + h / 2 - cy) * 1.4 + (J ? hashi(x, y, 11) * J * 6 : 0) - (row && sameNext(x, y) ? 40 : 0)]);
  }
  return out.sort((a, b) => a[2] - b[2]);
}
function dbgGap(x, y, w, h, gap) {
  for (let j = 0; j < h; j++) for (let k = 1; k <= gap; k++) for (const i of [x - k, x + w - 1 + k]) { const t = tile(i, y + j); if (t.b && G.bld[t.b] && !B[G.bld[t.b].type].weak) return false; }
  return true;
}
function dbgBuild(type, o) {
  const d = B[type]; if (!d) return null;
  for (let tries = 0; tries < 8; tries++) {
    const row = o && o.row ? type : null, gap = row ? 0 : DBG_STYLE.gap;   // row houses stand wall to wall
    for (const [x, y] of dbgSlots(d, row)) if (dbgGap(x, y, d.w || 1, d.h || 1, gap) && canPlace(type, x, y).ok) return dbgPut(type, x, y, o);
    dbgGrow(G.owned.length + 4);
  }
  console.warn('debug: no spot for', type);
  return null;
}
/* terrain buildings (quarry, mine, pier, harbour…): find the nearest fitting ground, buy land up to it */
function dbgFits(d, x, y) {
  for (let j = 0; j < (d.h || 1); j++) for (let i = 0; i < (d.w || 1); i++) { const t = tile(x + i, y + j); if (t.b || t.poi || !terrOK(d, t)) return false; }
  return true;
}
function dbgSpecial(type, o) {
  const d = B[type]; if (!d) return null;
  const w = d.w || 1, h = d.h || 1, [cx, cy] = dbgCenter(), ore = o && o.ore;
  let tried = 0;
  for (let r = 0; r <= 70; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx += (Math.abs(dy) === r ? 1 : 2 * r || 1)) {
    const x = cx + dx, y = cy + dy;
    if (!dbgFits(d, x, y) || (ore && mineOre(x, y) !== ore) || (d.need && !d.need(x, y))) continue;
    if (!d.water && !d.nodoor) { const t = tile(x + (w >> 1), y + h); if (!LAND.includes(t.gr) || t.b || t.poi) continue; }
    for (let j = 0; j <= h; j += Math.max(1, h >> 1)) for (let i = -1; i <= w; i += Math.max(1, w >> 2)) dbgReach(x + i, y + j);
    for (const [a, b] of [[x + w - 1, y + h - 1], [x + (w >> 1), y + h], [x + w, y + h - 1], [x, y + h]]) dbgReach(a, b);
    const dp = !d.nodoor ? doorPos(type, x, y) : null;
    if (dp && !reachAt(dp[0], dp[1])) dbgConnect(dp[0], dp[1], [x, y, w, h]);
    if (canPlace(type, x, y).ok) return dbgPut(type, x, y, o);
    if (++tried > 12) break;
  }
  console.warn('debug: no terrain for', type, ore || '');
  return null;
}

/* cut a path (through forest, over shallow water) from tile (x, y) to where the cats can already walk */
function dbgConnect(x, y, fp) {
  const bb = G.bb, W = bb.x1 - bb.x0 + 1, H = bb.y1 - bb.y0 + 1, prev = new Int32Array(W * H).fill(-2);
  const inFp = (i, j) => fp && i >= fp[0] && j >= fp[1] && i < fp[0] + fp[2] && j < fp[1] + fp[3];
  const ok = (i, j) => { if (!owned(i, j) || inFp(i, j)) return false; const t = tile(i, j); return !t.b && !t.poi && t.gr !== 'deep' && !isDoorTile(i, j); };
  const idx = (i, j) => (j - bb.y0) * W + (i - bb.x0);
  if (!ok(x, y)) return false;
  const q = [[x, y]]; prev[idx(x, y)] = -1;
  for (let h = 0; h < q.length; h++) {
    const [i, j] = q[h];
    if (reachAt(i, j)) {
      let k = idx(i, j);
      while (k >= 0) { const px = bb.x0 + k % W, py = bb.y0 + ((k / W) | 0); if (!reachAt(px, py) || tile(px, py).tree) dbgPave(px, py, 'path'); k = prev[k]; }
      reachDirty = true; pathVersion++;
      return true;
    }
    for (const [a, b] of [[i + 1, j], [i - 1, j], [i, j + 1], [i, j - 1]]) {
      if (a < bb.x0 || b < bb.y0 || a > bb.x1 || b > bb.y1 || prev[idx(a, b)] !== -2 || !ok(a, b)) continue;
      prev[idx(a, b)] = idx(i, j); q.push([a, b]);
    }
  }
  return false;
}

/* ---------- factory lines: belt → machine → belt … → exit, a work station above each machine ---------- */
const DBG_LINES = {
  plech: [['lis', 'plech', 2]],
  drat: [['tazirna', 'drat', 3]],
  tovarna: [['lis', 'plech', 3], ['lis', 'trubky', 7]],
  hlinik: [['elektrolyzer', 'hlinik', 3], ['elektrolyzer', 'hlinik', 7, true]]
};
function dbgLine(b, key) {
  const f = b.fac, line = DBG_LINES[key]; if (!f || !line) return;
  f.cells.fill(null);
  const y = f.gate;
  for (let x = 0; x < f.w; x++) f.cells[y * f.w + x] = { k: 'belt', d: 0, it: null, p: 0 };
  for (const [t, r, x, auto] of line) {
    f.cells[y * f.w + x] = { k: 'm', t, d: 0, r, inp: {}, out: null, outN: 0, p: 0, pass: null, auto: !!auto };
    if (!auto) f.cells[(y - 1) * f.w + x] = { k: 'st' };
  }
}

/* ---------- streets, lamps and flower beds ---------- */
function dbgPave(x, y, kind) {
  if (!owned(x, y)) return;
  const t = tile(x, y); if (t.b || t.poi) return;
  if (t.gr === 'water') t.gr = 'bridge'; else if (LAND.includes(t.gr) || t.gr === 'path' || (kind === 'asfalt' && t.gr === 'road')) t.gr = kind; else return;
  t.tree = null; markMod(x, y);
}
function dbgStreets(kind, asf) {   // asf: 1 = the main avenue is asphalt, 2 = every street
  const [cx, cy] = dbgCenter(), doors = {};
  for (const b of BLIST) if (b.dx != null && (b.dy - cy) % 4 === 0) (doors[b.dy] = doors[b.dy] || []).push(b.dx);
  const rows = Object.keys(doors).map(Number).sort((a, b) => a - b), span = {};
  for (const y of rows) {
    const x0 = Math.min(...doors[y]) - 1, x1 = Math.max(...doors[y]) + 1;
    let x = x0; const k = asf === 2 || (asf === 1 && y === cy) ? 'asfalt' : kind;
    while (x <= x1) {
      const t = tile(x, y);
      if (t.gr === 'water') { let e = x; while (e <= x1 && tile(e, y).gr === 'water') e++; if (e - x <= 4) for (let i = x; i < e; i++) dbgPave(i, y, k); x = e; continue; }
      dbgPave(x, y, k); x++;
    }
    span[y] = [x0, x1];
  }
  // cross streets between neighbouring rows, where the ground is free
  for (let i = 0; i + 1 < rows.length; i++) {
    const a = rows[i], b = rows[i + 1]; if (b - a !== 4) continue;
    const lo = Math.max(span[a][0], span[b][0]), hi = Math.min(span[a][1], span[b][1]);
    for (let x0 = cx - 60; x0 <= cx + 60; x0 += 11) {
      for (const x of [x0, x0 + 1, x0 - 1, x0 + 2, x0 - 2, x0 + 3]) {
        if (x < lo || x > hi) continue;
        let ok = true; for (let y = a + 1; y < b; y++) { const t = tile(x, y); if (!owned(x, y) || t.b || t.poi || !LAND.includes(t.gr) && t.gr !== 'path' || isDoorTile(x, y)) ok = false; }
        if (!ok) continue;
        for (let y = a + 1; y < b; y++) dbgPave(x, y, asf === 2 ? 'asfalt' : kind);
        break;
      }
    }
  }
  pathVersion++; reachDirty = true; if (typeof terrainDirty !== 'undefined') terrainDirty = true;
}
function dbgDecor(list, step) {
  const [cx, cy] = dbgCenter(), bb = G.bb;
  let n = 0;
  for (let k = -14; k <= 14; k++) {
    const y = cy + 4 * k + 1; if (y < bb.y0 || y > bb.y1) continue;
    for (let x = bb.x0; x <= bb.x1; x += step) {
      const road = tile(x, y - 1).gr; if (road !== 'path' && road !== 'road' && road !== 'asfalt') continue;
      const type = list[n++ % list.length];
      if (B[type] && canPlace(type, x, y).ok) place(type, x, y);
    }
  }
}
function dbgTree(x, y) {
  const t = tile(x, y);
  if (!owned(x, y) || t.gr !== 'grass' || t.b || t.tree || t.poi || isDoorTile(x, y)) return false;
  for (const [a, b] of [[x, y - 1], [x, y + 1]]) { const g = tile(a, b).gr; if (g === 'road' || g === 'path') return false; }
  if (keepsAccess(x, y, 1, 1, null)) return false;
  t.tree = { g: 1, v: Math.random() * 0.75, k: Math.random() < 0.3 ? 'birch' : 'round', planted: true }; markMod(x, y); reachDirty = true;
  return true;
}
/* bus stops along the streets, traffic lights at the busiest crossings */
function dbgStops(n) {
  const [cx, cy] = dbgCenter(), c = [];
  for (let k = -14; k <= 14; k++) { const y = cy + 4 * k + 1; for (let x = G.bb.x0; x <= G.bb.x1; x += 9) if (tile(x, y - 1).gr === 'asfalt') c.push([x, y, Math.abs(x - cx) + Math.abs(y - cy) + hashi(x, y, 5) * 20]); }
  c.sort((a, b) => a[2] - b[2]);
  const put = []; for (const [x, y] of c) { if (put.length >= n) break; if (put.some(([a, b]) => Math.abs(a - x) + Math.abs(b - y) < 11)) continue; if (canPlace('zastavka', x, y).ok) { place('zastavka', x, y); put.push([x, y]); } }
}
function dbgLights(n) {
  const [cx, cy] = dbgCenter(), c = [];
  for (let y = G.bb.y0; y <= G.bb.y1; y++) for (let x = G.bb.x0; x <= G.bb.x1; x++) if (JUNCTION(x, y)) c.push([x, y, Math.abs(x - cx) + Math.abs(y - cy)]);
  c.sort((a, b) => a[2] - b[2]);
  let k = 0; for (const [x, y] of c) { if (k >= n) break; for (const [a, b] of [[x + 1, y + 1], [x - 1, y + 1], [x + 1, y - 1], [x - 1, y - 1]]) if (canPlace('semafor', a, b).ok) { place('semafor', a, b); k++; break; } }
}
function dbgTrees(n) {
  const bb = G.bb;
  // a little wood for every lumber hut
  for (const b of BLIST) {
    if (!B[b.type].chop) continue;
    const spots = []; for (let y = b.y - 5; y <= b.y + 6; y++) for (let x = b.x - 5; x <= b.x + 6; x++) spots.push([x, y, Math.random()]);
    let k = 0; for (const [x, y] of spots.sort((a, c) => a[2] - c[2])) if (k < 10 && dbgTree(x, y)) k++;
  }
  for (let i = 0; i < n * 6 && n > 0; i++) if (dbgTree(randi(bb.x0, bb.x1), randi(bb.y0, bb.y1))) n--;
}

/* ---------- cats, homes and jobs ---------- */
function dbgBeds(n, lvl, type) {
  type = type || 'domek';
  if (lvl) for (const b of BLIST) if (b.type === type) b.lvl = lvl;
  let tries = 0; while (freeBedsTotal() < n && tries++ < 400) { const b = dbgBuild(type, type === 'mestsky_dum' ? { row: 1 } : null) || dbgBuild('domek'); if (!b) break; if (lvl) b.lvl = lvl; }
}
const freeBedsTotal = () => BLIST.reduce((a, b) => a + (B[b.type].beds && b.built ? bedsOf(b) : 0), 0);
function dbgCats(n, o) {
  o = o || {};
  const [cx, cy] = dbgCenter(), skins = [0, 1, 2, 3, 4, 6, 7, 8], hats = typeof HATS !== 'undefined' ? Object.keys(HATS) : [];
  while (G.cats.length < n) {
    const r = 12 + (n >> 3), sp = randomSpot(cx, cy, r) || randomSpot(cx, cy, r * 2) || [cx, cy];
    const c = newCat(pick(skins), pick(Object.keys(TRAITS)), null, (sp[0] + 0.5) * TS, (sp[1] + 0.7) * TS);
    c.food = randi(70, 95); c.energy = randi(65, 95); c.mood = randi(65, 90);
    if (o.xp) { c.xp = {}; for (const s of ['farm', 'build', 'carry', 'craft']) c.xp[s] = randi(0, o.xp); }
    if (o.hats && hats.length && Math.random() < o.hats) c.hat = pick(hats);
  }
  assignHomes();
}
function dbgProf(p, n) {
  for (const c of G.cats) { if (n <= 0) break; if (!c.prof) { c.prof = p; n--; } }
}
const DBG_ESSENTIAL = ['drevorubec', 'mlyn', 'pekarna', 'trziste', 'molo', 'kuchynka', 'kravin'];
const DBG_BORN = new Map();   // building id → the era whose plan built it
function dbgJobs(keepFree) {
  for (const c of G.cats) c.job = 0;
  for (const b of BLIST) b.workers = [];
  // bread and wood first, then the newest era's buildings (the showcase), then the rest in the order they were built
  const rank = b => (DBG_ESSENTIAL.includes(b.type) ? 0 : 100 - (DBG_BORN.get(b.id) || 0)) * 1e6 + b.id;
  const list = BLIST.filter(b => b.built && workerSlots(b) > 0).sort((a, b) => rank(a) - rank(b));
  // one cat per building and round, but a factory line only runs when every station is manned
  for (let pass = 0; pass < 3; pass++) for (const b of list) {
    while (b.workers.length < workerSlots(b) && (b.workers.length <= pass || B[b.type].interior)) {
      const need = B[b.type].prof, free = G.cats.filter(c => !c.job);
      if (!need && free.length <= keepFree) break;
      const pool = free.filter(c => need ? c.prof === need : c.prof !== 'vedec');
      const c = pool.find(x => traitFits(x.trait, b.type)) || pool[0];
      if (!c) break;
      assignWorker(b, c.id);
    }
  }
}

/* ---------- fields: something that grows in this season ---------- */
function dbgFields() {
  const S = seasonIdx(), crops = Object.keys(CROPS).filter(k => cropUnlocked(k) && CROPS[k].s[S]);
  let i = 0;
  for (const b of BLIST) if (B[b.type].field) { b.crop = B[b.type].glass ? pick(crops) : crops[i++ % crops.length] || 'psenice'; b.st = 1; b.g = rand(0.15, 0.95); }
}

/* ============ the worlds ============ */
const DBG_SEED = 530584;
const DBG_ERA = [
  { cats: 4, land: 14, day: 2, coins: 520, hearts: [2, 1, 1, 1, 0], lamps: ['kvetiny', 'kvetiny', 'lucerna', 'kvetiny'], trees: 10,
    stats: { earned: 600, orders: 4, fests: 0, made: { chleb: 30, mouka: 32, psenice: 90, ryby: 20 } },
    stock: { drevo: 30, psenice: 18, mouka: 8, chleb: 14, ryby: 10, mleko: 6, mrkev: 10, vejce: 4 },
    plan: [['drevorubec'], ['pole', 2], ['mlyn'], ['pekarna'], ['trziste'], ['molo', 1, { sp: 1 }], ['domek'], ['pole']] },
  { cats: 22, land: 28, day: 5, coins: 1800, hearts: [4, 4, 3, 3, 2], lamps: ['lucerna', 'kvetiny', 'zahon_ruzi', 'kvetiny'], trees: 14,
    stats: { earned: 3200, orders: 14, fests: 1, made: { cihly: 14, prkna: 70, chleb: 140, dzem: 18, sklo: 6 } },
    stock: { drevo: 40, prkna: 24, cihly: 12, kamen: 16, hlina: 8, pisek: 6, sklo: 4, chleb: 20, ryby: 14, mouka: 10, psenice: 20, mleko: 8, dzem: 6, med: 6, jablka: 8, vlna: 6, latka: 3, papir: 6 },
    plan: [['pila'], ['kravin'], ['slepicarna'], ['hliniste', 1, { sp: 1 }], ['cihelna'], ['lom', 1, { sp: 1 }], ['piskovna', 1, { sp: 1 }], ['sklarna'], ['zavarovna'], ['vcelin', 2], ['jablon', 3],
      ['kuchynka'], ['papirna'], ['ovcin'], ['tkalcovna', 1, { recipe: 'polstar' }], ['sklad'], ['kolarna'], ['namesti'], ['stan'], ['syrarna'], ['cukrarna'],
      ['pekarna', 1, { recipe: 'pernik' }], ['mlyn'], ['pole', 3], ['domek', 3], ['drevorubec'], ['skrabadlo'], ['lavicka', 2], ['altan']] },
  { cats: 32, land: 42, day: 9, coins: 4200, hearts: [6, 6, 5, 5, 5], lamps: ['lucerna', 'kvetiny', 'lampiony', 'zahon_ruzi', 'kvetiny', 'kasna'], trees: 16,
    stats: { earned: 9000, orders: 30, fests: 2, made: { cihly: 90, ocel: 8, zelezo: 34, uhli: 60, sklo: 30 } },
    stock: { drevo: 40, prkna: 30, cihly: 20, kamen: 20, uhli: 16, zelezo: 8, medkov: 6, ocel: 4, hrebiky: 10, chleb: 24, ryby: 16, ryby_more: 8, mouka: 12, psenice: 20, mleko: 10, syr: 4, med: 6, sklo: 6, latka: 4, polstar: 2 },
    plan: [['dul', 1, { sp: 1, ore: 'uhli' }], ['dul', 1, { sp: 1, ore: 'zelezo' }], ['dul', 1, { sp: 1, ore: 'med' }], ['uhlir'], ['tavirna'], ['tavirna', 1, { recipe: 'medkov' }],
      ['slevarna'], ['kovarna'], ['rybarna', 1, { sp: 1 }], ['majak', 1, { sp: 1 }], ['pristav', 1, { sp: 1 }], ['dilna', 1, { line: 'plech' }], ['lisovna'], ['mydlarna'],
      ['lazne'], ['sklenik', 2], ['pizzerie'], ['domek', 3], ['sklad'], ['fontana'], ['molo', 1, { sp: 1 }], ['pole', 2], ['kuchynka', 1, { recipe: 'susenky' }], ['pekarna']] },
  { cats: 42, land: 54, day: 17, coins: 9000, hearts: [7, 7, 6, 6, 6], lamps: ['lucerna', 'kvetiny', 'lampiony', 'zahon_ruzi', 'kvetiny', 'kasna'], trees: 18,
    tech: ['elektrina', 'inzenyri'], research: ['optika', { zapisnik: 6 }], profs: { vedec: 2, inzenyr: 2 },
    stats: { earned: 16000, orders: 55, fests: 4, techs: 2, made: { cihly: 200, ocel: 60, plech: 14, zelezo: 120, motor: 2 } },
    stock: { drevo: 40, prkna: 30, cihly: 30, kamen: 20, uhli: 24, zelezo: 14, medkov: 10, ocel: 12, plech: 8, drat: 10, hrebiky: 12, papir: 16, zapisnik: 6, chleb: 30, ryby: 20, susenky: 14, mouka: 14, psenice: 24, mleko: 10, syr: 6, sklo: 10 },
    plan: [['tovarna', 1, { line: 'tovarna' }], ['dilna', 1, { line: 'drat' }], ['skola'], ['laborator'], ['dul', 1, { sp: 1, ore: 'zelezo' }], ['dul', 1, { sp: 1, ore: 'uhli' }],
      ['slevarna'], ['tavirna'], ['domek', 3], ['sklad'], ['socha'], ['pole', 2], ['pekarna'], ['mlyn'], ['kravin'], ['cukrarna', 1, { recipe: 'cokoladovy_dort' }], ['kocici_strom'], ['mestsky_dum', 4, { row: 1 }]], asf: 1 },
  { cats: 40, land: 62, day: 19, coins: 16000, hearts: [8, 7, 7, 7, 6], lamps: ['kovova_lampa', 'kvetiny', 'zahon_ruzi', 'lampiony', 'kvetiny', 'kasna'], trees: 20,
    tech: ['elektrina', 'inzenyri', 'optika', 'automatizace'], research: ['hlinik', { vykres: 4 }], profs: { vedec: 2, inzenyr: 3 }, power: 20, asf: 2, stops: 14, lights: 5,
    stats: { earned: 32000, orders: 70, fests: 5, techs: 4, made: { cihly: 300, ocel: 120, plech: 60, zelezo: 200, motor: 6, bionafta: 40 } },
    stock: { drevo: 40, prkna: 30, cihly: 30, kamen: 20, uhli: 30, zelezo: 14, ocel: 16, plech: 12, drat: 12, hrebiky: 12, papir: 16, olej: 10, bionafta: 20, chleb: 30, ryby: 20, susenky: 14, mouka: 14, psenice: 24, mleko: 10, syr: 6, sklo: 10 },
    plan: [['radnice', 1], ['depo', 1], ['rafinerie', 1], ['lisovna', 1], ['pole', 2], ['mestsky_dum', 10, { row: 1 }], ['obchodni_dum', 1], ['kino', 1], ['knihovna', 1], ['veterina', 1], ['park', 3], ['hotel', 1], ['tovarna', 1, { line: 'tovarna' }], ['sklad'], ['pekarna'], ['mlyn']], policies: { trh: 1, klid: 1 } },
  { cats: 50, land: 66, day: 21, coins: 22000, hearts: [8, 8, 8, 7, 7], lamps: ['kovova_lampa', 'kvetiny', 'zahon_ruzi', 'lampiony', 'kvetiny', 'mlyncek'], trees: 20,
    tech: Object.keys(TECH).filter(k => k !== 'raketa'), research: ['raketa', { hvezdna_mapa: 6, elektro: 4 }], profs: { vedec: 4, inzenyr: 3 }, power: 24,
    stats: { earned: 60000, orders: 90, fests: 6, techs: 9, made: { cihly: 400, ocel: 200, plech: 140, motor: 12, hlinik: 30, elektro: 20 } },
    stock: { drevo: 40, prkna: 30, cihly: 30, kamen: 20, uhli: 30, ocel: 20, plech: 14, drat: 14, trubky: 8, hlinik: 10, dural: 8, kremik: 6, obvod: 6, cip: 4, papir: 20, vykres: 4, elektro: 4, chleb: 30, konzervy: 20, susenky: 16, mouka: 14, psenice: 24, mleko: 10, sklo: 12 },
    plan: [['elektrarna'], ['vetrnik', 4], ['dul', 1, { sp: 1, ore: 'bauxit' }], ['tovarna', 1, { line: 'hlinik' }], ['laborator'], ['vez'], ['dalekohled', 2],
      ['domek', 3], ['sklad'], ['pole', 2], ['pekarna'], ['kuchynka', 1, { recipe: 'susenky' }], ['kocici_socha'], ['mestsky_dum', 8, { row: 1 }]], asf: 1 }
];
const DBG_END = {
  cats: 62, land: 82, day: 38, coins: 60000, hearts: [10, 10, 10, 10, 10], lamps: ['kovova_lampa', 'kvetiny', 'hvezdna_lampa', 'zahon_ruzi', 'lampiony', 'kvetiny', 'zvonkohra'], trees: 26,
  tech: Object.keys(TECH), profs: { vedec: 4, inzenyr: 4, astronaut: 1 }, power: 40,
  stats: { earned: 150000, orders: 160, fests: 10, techs: Object.keys(TECH).length, made: { cihly: 800, ocel: 600, plech: 400, motor: 40, hlinik: 120, elektro: 60, raketovy_motor: 4 } },
  stock: { drevo: 50, prkna: 40, cihly: 40, kamen: 30, uhli: 40, ocel: 30, plech: 20, drat: 20, trubky: 12, hlinik: 16, dural: 12, baterie: 6, raketove_palivo: 10, chleb: 40, konzervy: 30, susenky: 20, pizza: 10, mouka: 16, psenice: 30, mleko: 14, sklo: 16, jahodovy_dort: 4, cokoladovy_dort: 4 },
  asf: 2, houseType: 'mestsky_dum',
  plan: [['kosmodrom', 1, { rocket: 3 }], ['letiste', 1, { sp: 1 }], ['park', 4], ['kino', 1], ['veterina', 1], ['hotel', 1], ['mestsky_dum', 14, { row: 1 }], ['domek', 2], ['fontana'], ['kocici_strom'], ['altan'], ['sklad'], ['pole', 2], ['elektrarna'], ['vetrnik', 2], ['cukrarna'], ['pizzerie']]
};
/* super-endgame: a whole city — 300 cats, every chain many times over, industry in the outer districts */
const DBG_MEGA = {
  cats: 300, land: 240, day: 70, coins: 1000000, hearts: [10, 10, 10, 10, 10], lamps: ['kovova_lampa', 'kvetiny', 'hvezdna_lampa', 'zahon_ruzi', 'lampiony', 'kvetiny', 'kasna', 'zvonkohra'], trees: 80,
  tech: Object.keys(TECH), profs: { vedec: 12, inzenyr: 24, astronaut: 3 }, power: 200, houseLvl: 3, houseType: 'mestsky_dum', asf: 2,
  stats: { earned: 2500000, orders: 900, fests: 22, techs: Object.keys(TECH).length, made: { chleb: 9000, cihly: 12000, ocel: 8000, plech: 6000, motor: 600, hlinik: 2000, elektro: 900, pizza: 1500, raketovy_motor: 12 } },
  stock: { drevo: 400, prkna: 300, cihly: 300, kamen: 200, uhli: 300, ocel: 250, plech: 200, drat: 150, trubky: 120, hlinik: 120, dural: 80, baterie: 40, raketove_palivo: 60, chleb: 400, konzervy: 300, susenky: 250, pizza: 120, mouka: 200, psenice: 300, mleko: 150, syr: 100, sklo: 150, jahodovy_dort: 40, cokoladovy_dort: 40, polstar: 60, hracky: 50 },
  plan: [['mestsky_dum', 50, { row: 1 }], ['obchodni_dum', 3], ['kino', 3], ['knihovna', 3], ['veterina', 3], ['park', 10], ['hotel', 2], ['depo', 3], ['rafinerie', 2], ['pole', 36], ['mlyn', 8], ['pekarna', 10], ['kuchynka', 6, { recipe: 'susenky' }], ['molo', 5, { sp: 1 }], ['kravin', 6], ['slepicarna', 4], ['syrarna', 3],
    ['pizzerie', 4], ['cukrarna', 4], ['zavarovna', 3], ['sklenik', 6], ['trziste', 6], ['sklad', 8], ['fontana', 4], ['kocici_socha', 3], ['altan', 4], ['kocici_strom', 3],
    ['drevorubec', 6], ['pila', 4], ['hliniste', 3, { sp: 1 }], ['cihelna', 4], ['lom', 3, { sp: 1 }], ['piskovna', 2, { sp: 1 }], ['sklarna', 3], ['papirna', 3], ['tkalcovna', 2, { recipe: 'polstar' }],
    ['dul', 4, { sp: 1, ore: 'uhli' }], ['dul', 4, { sp: 1, ore: 'zelezo' }], ['dul', 3, { sp: 1, ore: 'med' }], ['dul', 2, { sp: 1, ore: 'bauxit' }], ['rybarna', 3, { sp: 1 }],
    ['tavirna', 5], ['tavirna', 2, { recipe: 'medkov' }], ['slevarna', 4], ['kovarna', 3], ['tovarna', 4, { line: 'tovarna' }], ['dilna', 4, { line: 'plech' }], ['dilna', 2, { line: 'drat' }],
    ['tovarna', 2, { line: 'hlinik' }], ['laborator', 3], ['skola', 2], ['elektrarna', 3], ['vetrnik', 12], ['dalekohled', 4]]
};
/* Metropole: a thousand cats — the whole city of the super-endgame, twice over */
const DBG_METRO = Object.assign({}, DBG_MEGA, {
  cats: 1000, land: 460, day: 90, coins: 3000000, profs: { vedec: 20, inzenyr: 60, astronaut: 3 }, power: 400, stops: 70, lights: 20, trees: 120,
  stats: Object.assign({}, DBG_MEGA.stats, { earned: 9000000, orders: 2500, fests: 30 }),
  plan: [['mestsky_dum', 60, { row: 1 }], ['pole', 30], ['pekarna', 10], ['mlyn', 8], ['kuchynka', 6, { recipe: 'susenky' }], ['pizzerie', 4], ['kravin', 6], ['depo', 3], ['rafinerie', 2],
    ['obchodni_dum', 3], ['kino', 3], ['knihovna', 2], ['veterina', 3], ['park', 12], ['hotel', 2], ['sklad', 10], ['tovarna', 4, { line: 'tovarna' }], ['trziste', 6], ['dilna', 6, { line: 'plech' }], ['syrarna', 4], ['slepicarna', 4], ['pila', 4], ['cihelna', 4], ['sklarna', 3], ['papirna', 3], ['tkalcovna', 3]]
});
const DBG_WORLDS = {
  farma: { n: 'Farma', d: 'Éra 1 · jaro, pár dní po založení. Pekárna, mlýn, molo a první 4 kočky.', era: 0 },
  remesla: { n: 'Řemesla a obchod', d: 'Éra 2 · léto. Pila, cihelna, sklárna, tržní náměstí s karavanou, 22 koček.', era: 1 },
  hornictvi: { n: 'Hornictví a přístav', d: 'Éra 3 · podzim. Doly, tavírny, slévárna, přístav, maják a dílna s lisem.', era: 2 },
  prumysl: { n: 'Průmysl', d: 'Éra 4 · jaro 2. roku. Továrna s linkou, škola, laboratoř, vědci a inženýři.', era: 3 },
  mesto: { n: 'Město a doprava', d: 'Éra 5 · jaro 2. roku. Asfaltové ulice, nákladní depo s auty, rafinérie na bionaftu, zastávky, semafory.', era: 4 },
  veda: { n: 'Věda a vesmír', d: 'Éra 6 · léto 2. roku. Elektrárna, větrníky, vzducholodě, zkoumá se raketa.', era: 5 },
  endgame: { n: 'Endgame', d: 'Všechno odemčené, 62 koček, raketa stojí na rampě a astronaut čeká na odpočítávání.', era: 5, end: 1 },
  mega: { n: 'Super-endgame: Kočičí velkoměsto', d: '300 koček, obří výroba všeho, stovky staveb v ulicích jako ve skutečném městě. Stavba chvíli trvá!', era: 5, end: 3 },
  metropole: { n: 'Metropole: 1 000 koček', d: 'Test výkonu — tisíc koček, stovky městských domů, desítky depa, zastávek a semaforů. Stavba trvá asi půl minuty!', era: 5, end: 4 },
  zacpa: { n: 'Dopravní zácpa', d: 'Město a doprava bez semaforů a se čtyřikrát víc auty. Přehled Zácpy je zapnutý — zkus postavit semafory.', era: 4, post: () => { for (const b of BLIST.filter(x => x.type === 'semafor')) removeBld(b, true); G.carMul = 4; setTimeout(() => setHeat('zacpy'), 50); } },
  vesmir: { n: 'Po startu rakety', d: 'Konec hry za námi — raketa odletěla, satelit ukazuje celý svět.', era: 5, end: 2 },
  kreativ: { n: 'Kreativní pískoviště', d: 'Kreativní režim na velkém pozemku — neomezené mince, stavby hned hotové.', sandbox: 1 }
};

function dbgMakeWorld(key) {
  const W = DBG_WORLDS[key]; if (!W) return;
  const t0 = performance.now();
  dbgQuiet(() => {
    newGame({ name: W.n + ' (test)', seed: DBG_SEED, mode: W.sandbox ? 'kreativ' : 'normal' });
    DBG_BORN.clear();
    G.tut.skip = true;
    if (W.sandbox) { dbgGrow(40); dbgFinishWorld(); return; }
    const last = W.end === 4 ? DBG_METRO : W.end === 3 ? DBG_MEGA : W.end ? DBG_END : DBG_ERA[W.era];
    // progression first — so every building of the era is unlocked
    G.era = W.era;
    Object.assign(DBG_STYLE, W.end ? { gap: 1, jitter: 0 } : [{ gap: 2, jitter: 5 }, { gap: 2, jitter: 3 }, { gap: 1, jitter: 1.5 }, { gap: 1, jitter: 0.5 }, { gap: 1, jitter: 0 }, { gap: 1, jitter: 0 }][W.era]);
    G.t = last.day * DAY + 7 / 24 * DAY; G.morning = mornIdx(); G.lastSeason = seasonIdx();
    Object.keys(NEIGH).forEach((k, i) => { G.nb[k] = HEART_XP[last.hearts[i]] || 0; });
    for (const k of last.tech || []) G.tech[k] = true;
    if (W.era >= 2) for (const c in CROPS) if (CROPS[c].seed) G.flags['seed_' + c] = true;
    if (W.era >= 2) for (const b of ['lampiony', 'kasna']) G.flags['bp_' + b] = true;
    if (W.era >= 3) for (const t in B) if (B[t].bp) G.flags['bp_' + B[t].bp] = true;
    for (let s = 0; s < 4; s++) if (s < seasonIdx() || yearIdx() > 1) G.festFirst[s] = true;
    // build era by era, so the oldest part of town sits around the main street
    G.coins = 1e12; for (const k in ITEMS) G.stock[k] = 5000;
    const depNeed = B.depo.need; B.depo.need = null;   // the street in front of a new depot is paved afterwards
    const plans = DBG_ERA.slice(0, W.era + 1).map(e => e.plan); if (W.end) plans.push(DBG_END.plan); if (W.end >= 3) plans.push(DBG_MEGA.plan); if (W.end === 4) plans.push(DBG_METRO.plan);
    plans.forEach((plan, i) => {
      if (i >= ERA_MESTO) dbgStreets('road', 2);   // the city builds along its asphalt
      dbgGrow((i === plans.length - 1 ? last : DBG_ERA[i] || last).land);
      for (const [type, n, o] of plan) for (let j = 0; j < (n || 1); j++) { const b = o && o.sp ? dbgSpecial(type, o) : dbgBuild(type, o); if (b) DBG_BORN.set(b.id, i); }
    });
    B.depo.need = depNeed;
    dbgBeds(last.cats + 2, last.houseLvl, last.houseType);
    const upg = W.end >= 3 ? 0.8 : W.end ? 0.5 : W.era >= 2 ? 0.2 : 0;
    for (const b of BLIST) if (canUpgradeType(b.type) && !(last.houseLvl && B[b.type].beds) && Math.random() < upg) b.lvl = W.end && Math.random() < 0.5 ? 3 : 2;
    dbgStreets(W.era >= 1 ? 'road' : 'path', last.asf || 0);
    if (W.era >= ERA_MESTO) { dbgStops(last.stops || (W.end >= 3 ? 40 : 20)); dbgLights(last.lights || 6); }
    dbgDecor(last.lamps, 3);
    dbgTrees(last.trees);
    // cats
    dbgCats(last.cats, { xp: W.era * 900 + 200, hats: W.end ? 0.5 : W.era >= 2 ? 0.2 : 0 });
    for (const p in last.profs || {}) dbgProf(p, last.profs[p]);
    dbgJobs(Math.round(last.cats * 0.15));
    // research, rocket, economy
    if (last.research) { G.research = last.research[0]; G.rprog = { [last.research[0]]: Object.assign({}, last.research[1]) }; }
    if (last.power) G.power = last.power;
    G.policies = Object.assign({}, (DBG_ERA[ERA_MESTO] || {}).policies && W.era >= ERA_MESTO ? DBG_ERA[ERA_MESTO].policies : {});
    if (W.end === 2) {
      G.flags.launched = G.flags.satelit = true; G.stats.launches = 1;
      const a = G.cats.find(c => c.prof === 'astronaut'); if (a) { a.space = true; flyAway(); }
    }
    const made = {}; for (const e of DBG_ERA.slice(0, W.era + 1).concat(W.end ? [DBG_END] : [], W.end >= 3 ? [DBG_MEGA] : [])) for (const k in e.stats.made) made[k] = Math.max(made[k] || 0, e.stats.made[k]);
    G.stats = Object.assign(G.stats, last.stats, { made, parcels: G.owned.length });
    if (W.era >= 1) G.stats.traded = 3;
    if (W.era >= 1) G.stats.expeditions = W.era;
    G.stars = W.era * 4 + (W.end ? 10 : 0);
    dbgFinishWorld(last);
  });
  UNDO.length = 0;
  if (W.post) dbgQuiet(W.post);
  return Math.round(performance.now() - t0);
}
function dbgFinishWorld(last) {
  if (last) {
    G.coins = last.coins;
    G.stock = Object.assign({}, last.stock);
    const cap = capacity(), tot = stockTotal();
    if (tot > cap * 0.75) for (const k in G.stock) G.stock[k] = Math.floor(G.stock[k] * cap * 0.75 / tot);
    dbgFields();
    G.orders = []; for (let i = 0; i < 3; i++) genOrder();
    if (typeof newWishes === 'function') newWishes();
    if (countB('namesti')) { G.traders = [genTrader('karavana')]; G.caravanT = 2; }
  }
  G.pendingCats = 0; G.freeParcels = 0; G.res = {}; G.weather = 'clear';
  if (last) {   // a believable past for the charts: the town grew from the starter village to today
    G.hist = []; const days = dayIdx(), top = Object.entries(last.stats.made || {}).sort((a, b) => b[1] - a[1]).slice(0, 4);
    for (let d = 0; d < days; d++) {
      const k = (d + 1) / days, e = Math.pow(k, 1.6), wob = 1 + Math.sin(d * 1.7) * 0.08;
      G.hist.push({ d, c: Math.max(3, Math.round(3 + (G.cats.length - 3) * e)), m: Math.round(400 + (last.coins - 400) * e * wob), e: Math.round((last.stats.earned || 0) * e), cz: Math.round(coziness() * e), md: Math.round(62 + 18 * k * wob), p: Math.round(40 + 600 * e * wob),
        pi: Object.fromEntries(top.map(([it, n], i) => [it, Math.round(n / days * 2 * e * wob * (1 - i * 0.15))])), tl: Math.round((G.stats.truckLoads || 0) * e), br: Math.round((G.stats.busRides || 0) * e), er: eraOf() });
    }
    G.histPrev = Object.assign({}, G.stats.made);
  }
  if (typeof ACH !== 'undefined') { G.ach = G.ach || {}; for (const [k, , ok] of ACH) if (ok()) G.ach[k] = G.t; }
  rebuildLists(); assignHomes(); recomputeCozy();
  reachDirty = true; pathVersion++; jobsDirty = true; minimapDirty = true; if (typeof terrainDirty !== 'undefined') terrainDirty = true;
  resetCamera();
  const [cx, cy] = dbgCenter(); CAM.x = cx * TS; CAM.y = cy * TS;
  UI.sel = null; UI.tool = null; UI.interior = null; VIS = [];
}
function dbgLoadWorld(key) {
  if (G && started && !G.visiting) saveGame();
  if (typeof VISIT !== 'undefined' && VISIT) { VISIT = null; const vb = $('visitBar'); if (vb) vb.hidden = true; }
  const ms = dbgMakeWorld(key);
  G.slot = null; saveGame(true);
  startPlaying(); UI.speed = 1;
  banner(G.name, `Testovací svět · ${ERAS[eraOf()].n} · ${G.cats.length} koček · ${BLIST.length} staveb`);
  console.log(`debug: world "${key}" built in ${ms} ms — ${BLIST.length} buildings, ${G.cats.length} cats, ${G.owned.length} parcels`);
}

/* ============ cheats ============ */
function dbgSim(seconds) {
  const end = G.t + seconds;
  while (G.t < end) simStep(Math.min(0.25, end - G.t));
  UI.dirty = true; minimapDirty = true;
}
function dbgHunt(kind) {
  const H = HUNT_KINDS[kind], E = [], bb = G.bb;
  for (let tries = 0; tries < 400 && E.length < H.count; tries++) {
    const x = randi(bb.x0, bb.x1), y = randi(bb.y0, bb.y1);
    if (!walkable(x, y) || !reachAt(x, y) || E.some(e => Math.abs(e.x - x) + Math.abs(e.y - y) < 4)) continue;
    E.push({ x, y, got: false, c: randi(0, EGG_COLS.length - 1), ph: Math.random() * 6 });
  }
  G.hunt = { kind, items: E, found: 0, day: dayIdx() };
  banner(H.n + '!', H.msg);
}
const DBG_ACTS = {
  coins: n => { G.coins += +n; toast(`+${fmt(+n)} mincí`); Sound.coin(); },
  fill: () => { let n = 0; for (const k in ITEMS) if (producible(k) || G.stock[k]) { addStock(k, 40); n++; } toast(`+40 od ${n} druhů zboží`); },
  empty: () => { G.stock = { drevo: 10 }; G.res = {}; toast('Sklad vyprázdněn (zůstalo 10 dřeva).'); },
  era: () => { if (eraOf() >= ERAS.length - 1) { toast('Už je poslední éra.'); return; } G.era = eraOf() + 1; banner('Nová éra: ' + ERAS[G.era].n, ERAS[G.era].d); minimapDirty = true; renderTut(); },
  unlock: () => { unlockAllCreative(); G.tut.skip = false; renderTut(); toast('Všechno odemčeno: éry, výzkumy, plánky, semínka, srdíčka.'); },
  hearts: () => { for (const k in NEIGH) { const lv = nbLevel(k); if (lv < 10) G.nb[k] = HEART_XP[lv + 1]; } toast('Všichni sousedé +1 ♥'); },
  build: () => { const l = BLIST.filter(b => !b.built); l.forEach(b => { b.need = {}; b.work = 0; completeBuilding(b); }); toast(l.length ? `Dostavěno: ${l.length} staveb` : 'Nic se nestaví.'); },
  research: () => { const k = G.research; if (!k) { toast('Laboratoř nic nezkoumá.'); return; } G.tech[k] = true; G.research = null; G.stats.techs = (G.stats.techs || 0) + 1; banner('Objev: ' + TECH[k].n, TECH[k].d); jobsDirty = true; },
  rocket: () => {
    const b = BLIST.find(x => x.type === 'kosmodrom'); if (!b) { toast('Nejdřív postav Kosmodrom.'); return; }
    if (!b.built) { b.need = {}; b.work = 0; completeBuilding(b); }
    b.stage = 3; if (!G.cats.some(c => c.prof === 'astronaut') && G.cats[0]) G.cats[0].prof = 'astronaut';
    UI.select({ kind: 'b', id: b.id }); centerOn((b.x + 2.5) * TS, (b.y + 2) * TS); toast('Raketa je připravená ke startu!');
  },
  feed: () => { for (const c of G.cats) { c.food = 100; c.energy = 100; c.mood = 100; } toast('Všechny kočky jsou syté, vyspalé a šťastné.'); },
  cat: n => { for (let i = 0; i < +n; i++) arriveCat(); },
  hour: () => dbgSim(DAY / 24),
  morning: () => { const m = G.morning; let g = 0; while (G.morning === m && g++ < 2000) simStep(0.25); UI.dirty = true; toast('Dobré ráno!'); },
  day: () => { dbgSim(DAY); toast('Uběhl den.'); },
  season: () => { G.t = (Math.floor(dayIdx() / SDAYS) + 1) * SDAYS * DAY + 6.2 / 24 * DAY; for (const c of G.cats) { c.food = Math.max(c.food, 70); c.energy = Math.max(c.energy, 70); } UI.dirty = true; minimapDirty = true; if (typeof terrainDirty !== 'undefined') terrainDirty = true; },
  speed: n => { UI.speed = +n; toast(`Rychlost ${n}×`); },
  wx: w => {
    G.storm = w === 'storm'; G.rainbow = w === 'rainbow';
    G.weather = w === 'storm' ? 'rain' : w === 'rainbow' ? 'clear' : w;
    toast({ clear: 'Jasno', rain: 'Prší', snow: 'Sněží', storm: 'Bouřka!', rainbow: 'Duha!' }[w]);
  },
  caravan: () => { if (!countB('namesti')) { toast('Karavana potřebuje Tržní náměstí.'); return; } const t = genTrader('karavana'); G.traders = (G.traders || []).filter(x => x.kind !== 'karavana').concat(t); banner('Přijela karavana!', `${t.name} čeká na Tržním náměstí.`); },
  meteor: () => { G.meteorNight = true; G.meteorCaught = 0; toast('Dnes v noci budou padat hvězdy.'); },
  eggs: () => dbgHunt('vejce'),
  ghosts: () => dbgHunt('duch'),
  xmas: () => catChristmas(),
  order: () => { genOrder(); toast('Nová zakázka na nástěnce.'); },
  fest: () => { const st = festState(); if (G.festDone[st.key]) { toast('Slavnost už proběhla.'); return; } st.got = Object.assign({}, FEST[seasonIdx()].need); completeFest(); },
  reveal: () => { G.flags.satelit = !G.flags.satelit; minimapDirty = true; toast(G.flags.satelit ? 'Mapa odkrytá.' : 'Mraky jsou zpátky.'); },
  land: () => { G.freeParcels = (G.freeParcels || 0) + 5; toast('+5 pozemků zdarma'); },
  bench: () => { DBG.bench = DK.bench(); },
  cars: () => { const l = roadList(); if (!l.length) { toast('Nejdřív postav asfaltové silnice (éra Průmysl).'); return; } for (let i = 0; i < 20; i++) spawnCar(l); G.carMul = Math.min(4, (G.carMul || 1) + 1); toast(`Víc aut (×${G.carMul})`); },
  plane: () => { if (!countB('letiste')) { toast('Nejdřív postav Letiště.'); return; } airportMorning(); },
  heat: k => setHeat(UI.heat === k ? null : k),
  art: () => { SET.noAssets = !SET.noAssets; saveSettings(); for (const k in BICON) delete BICON[k]; toast(SET.noAssets ? 'Budovy se kreslí jen kódem.' : 'Budovy z obrázků (assets/budovy).'); },
  off: () => { SET.debug = false; saveSettings(); dbgTabBtn(); UI.tab = 'build'; }
};
const DBG = { bench: null };
for (const k in DBG_ACTS) ACTIONS['dbg_' + k] = DBG_ACTS[k];
ACTIONS.dbg_world = key => { hideMenu(); setTimeout(() => dbgLoadWorld(key), 20); };

/* ============ the Debug tab ============ */
EXTRA_TABS.debug = () => {
  const btn = (act, txt, arg) => `<button class="btn small alt chamfer" data-act="dbg_${act}"${arg != null ? ` data-arg="${arg}"` : ''}>${txt}</button>`;
  let h = `<div class="dbg"><h4>Testovací světy</h4><p class="muted">Postaví hotovou osadu a uloží ji jako novou hru — tvoje současná hra zůstane uložená.</p>`;
  for (const k in DBG_WORLDS) h += `<button class="link-row" data-act="dbg_world" data-arg="${k}"><b>${DBG_WORLDS[k].n}</b><br><small class="muted">${DBG_WORLDS[k].d}</small></button>`;
  h += `<h4>Mince a sklad</h4><div class="row">${btn('coins', '+1 000', 1000)}${btn('coins', '+10 000', 10000)}${btn('coins', '+100 000', 100000)}${btn('fill', 'Naplnit sklad')}${btn('empty', 'Vyprázdnit')}</div>`;
  h += `<h4>Postup</h4><div class="row">${btn('era', 'Další éra')}${btn('unlock', 'Odemknout vše')}${btn('hearts', 'Sousedé +1 ♥')}${btn('build', 'Dostavět stavby')}${btn('research', 'Dokončit výzkum')}${btn('rocket', 'Raketa na rampu')}${btn('land', '+5 pozemků')}</div>`;
  h += `<h4>Kočky</h4><div class="row">${btn('feed', 'Nakrmit a vyspat')}${btn('cat', '+1 kočka', 1)}${btn('cat', '+5 koček', 5)}</div>`;
  h += `<h4>Čas</h4><div class="row">${btn('hour', '+1 hodina')}${btn('morning', 'Do rána')}${btn('day', '+1 den')}${btn('season', 'Další sezóna')}${btn('speed', '8×', 8)}${btn('speed', '16×', 16)}</div>`;
  h += `<h4>Počasí</h4><div class="row">${btn('wx', 'Jasno', 'clear')}${btn('wx', 'Déšť', 'rain')}${btn('wx', 'Sníh', 'snow')}${btn('wx', 'Bouřka', 'storm')}${btn('wx', 'Duha', 'rainbow')}</div>`;
  h += `<h4>Události</h4><div class="row">${btn('order', 'Zakázka')}${btn('fest', 'Splnit slavnost')}${btn('caravan', 'Karavana')}${btn('meteor', 'Padající hvězdy')}${btn('eggs', 'Vajíčka')}${btn('ghosts', 'Strašidýlka')}${btn('xmas', 'Vánoce')}</div>`;
  h += `<h4>Svět</h4><div class="row">${btn('reveal', G.flags.satelit ? 'Zakrýt mapu' : 'Odkrýt mapu')}${btn('cars', '+ Auta')}${btn('plane', 'Přílet turistů')}${btn('bench', 'Změřit výkon')}${btn('art', SET.noAssets ? 'Grafika: jen kód' : 'Grafika: obrázky')}</div>`;
  h += `<h4>Přehledy přes mapu</h4><div class="row">${Object.keys(HEATS).map(k => `<button class="btn small ${UI.heat === k ? '' : 'alt'} chamfer" data-act="dbg_heat" data-arg="${k}">${HEATS[k].n}</button>`).join('')}</div>`;
  h += `<div class="kv"><span>Simulace</span><small>${PERF.ms.toFixed(1)} ms na snímek · ${PERF.steps} kroků · LOD přeskočilo ${PERF.lod} aktualizací koček · ${CARS.length} vozidel</small></div>`;
  const bn = DBG.bench;
  h += `<div class="kv"><span>Semínko</span><b>${G.seed}</b></div><div class="kv"><span>Éra</span><b>${eraOf() + 1}/${ERAS.length} ${ERAS[eraOf()].n}</b></div>`;
  h += `<div class="kv"><span>Svět</span><small>${BLIST.length} staveb · ${G.cats.length} koček · ${G.owned.length} pozemků · ${CHUNKS.size} chunků · den ${dayIdx() + 1}</small></div>`;
  if (bn) h += `<div class="kv"><span>Výkon</span><small>simulace ${bn.simMsPerStep} ms/krok · vykreslení ${bn.renderMs} ms</small></div>`;
  h += `<p class="muted">Debug otevřeš klávesou F9 nebo klávesou vlevo od 1. Vypnout ho jde tady nebo v Nastavení.</p><p>${btn('off', 'Skrýt debug')}</p></div>`;
  return h;
};
function dbgTabBtn() {
  let b = document.querySelector('#tabs [data-tab="debug"]');
  if (SET.debug && !b) { b = document.createElement('button'); b.dataset.tab = 'debug'; b.textContent = 'Debug'; $('tabs').appendChild(b); }
  if (!SET.debug && b) b.remove();
}
dbgTabBtn();
function dbgToggle() {
  if (!G || !started) { SET.debug = true; saveSettings(); dbgTabBtn(); showMenu('worlds'); return; }
  if (!SET.debug) { SET.debug = true; saveSettings(); dbgTabBtn(); }
  UI.tab = UI.tab === 'debug' && !UI.sel ? 'build' : 'debug'; UI.sel = null; UI.interior && leaveFactory();
  Sound.click(); renderPane(true);
}
addEventListener('keydown', e => {
  if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
  if (e.code === 'F9' || e.code === 'Backquote') { e.preventDefault(); dbgToggle(); }
});

/* ============ menu: test worlds list, settings switch ============ */
const _showMenuD = showMenu;
showMenu = function (view) {
  if (view === 'worlds') {
    const el = $('menu'); el.hidden = false;
    let h = `<div class="panel nails chamfer mpanel"><h1 class="title">Testovací světy</h1><p class="sub">Hotové osady v každé éře — na zkoušení a ladění. Každý svět se uloží jako nová hra.</p><div class="slots">`;
    for (const k in DBG_WORLDS) h += `<div class="slot"><div class="st"><b>${DBG_WORLDS[k].n}</b><small>${DBG_WORLDS[k].d}</small></div><div class="sb"><button class="link" data-m="world:${k}">Založit</button></div></div>`;
    el.innerHTML = h + `</div><p class="muted" id="dbgMsg"></p><div class="row"><button class="btn alt chamfer" data-m="back">Zpět</button></div></div>`;
    return;
  }
  _showMenuD(view);
  const el = $('menu');
  if (!view && SET.debug) {
    const links = el.querySelector('[data-m="import"]');
    if (links && !el.querySelector('[data-m="worlds"]')) links.insertAdjacentHTML('beforebegin', '<button class="link" data-m="worlds">Testovací světy</button>');
  }
  if (view === 'settings') {
    const row = el.querySelector('.form .row');
    if (row) {
      row.insertAdjacentHTML('beforebegin', `<label class="chk"><input type="checkbox" id="sDbg" ${SET.debug ? 'checked' : ''}> Debug menu <small>(záložka Debug a testovací světy — F9 nebo klávesa vlevo od 1)</small></label>`);
      $('sDbg').addEventListener('change', e => { SET.debug = e.target.checked; saveSettings(); dbgTabBtn(); if (!SET.debug && UI.tab === 'debug') UI.tab = 'build'; });
    }
  }
};
const _menuActionD = menuAction;
menuAction = function (m) {
  if (m === 'worlds') { Sound.click(); return showMenu('worlds'); }
  if (m.startsWith('world:')) {
    Sound.click();
    const msg = $('dbgMsg'); if (msg) msg.textContent = 'Stavím osadu…';
    setTimeout(() => dbgLoadWorld(m.slice(6)), 30);
    return;
  }
  return _menuActionD(m);
};
