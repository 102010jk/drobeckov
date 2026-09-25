'use strict';
/* ============ 4.0: the city — districts, town hall with by-laws, city services ============ */

/* ---------- services: each covers a radius; homes inside it make their cats happier ---------- */
Object.assign(B, {
  radnice: { n: 'Radnice', cat: 'domov', w: 3, h: 3, cost: 3000, mat: { cihly: 40, kamen: 20, sklo: 10 }, work: 30, workers: 1, era: ERA_MESTO, unique: 1, cozy: 4,
    desc: 'Srdce města. Starostka tu vyhlašuje vyhlášky (noční klid, trh o víkendu, …) a vidíš tu přehled čtvrtí.' },
  hotel: { n: 'Hotel', cat: 'domov', w: 3, h: 2, cost: 1800, mat: { cihly: 30, sklo: 12, latka: 6 }, work: 22, workers: 2, era: ERA_MESTO, cozy: 2, service: 14, windowLight: [24, 6, 18],
    desc: 'Turisté z letiště a obchodníci z karavan tu přespí a utratí víc: +40 % z turistů a ranní útrata hostů.' },
  obchodni_dum: { n: 'Obchodní dům', cat: 'vyroba', w: 3, h: 2, cost: 1600, mat: { cihly: 24, sklo: 14, ocel: 6 }, work: 20, workers: 3, market: 1, era: ERA_MESTO, service: 18,
    desc: 'Velký obchod: prodává zboží označené ke stánku, chodí sem víc zákazníků a prodává o 15 % dráž než stánek.' },
  kino: { n: 'Kino', cat: 'ozdoby', w: 2, h: 2, cost: 900, mat: { cihly: 12, sklo: 6 }, work: 14, era: ERA_MESTO, cozy: 5, play: 1, service: 14, noise: 2,
    desc: 'Kočky sem chodí na filmy (hraní zvedá náladu). Domovy v okruhu 14 jsou spokojenější.' },
  knihovna: { n: 'Knihovna', cat: 'domov', w: 2, h: 2, cost: 800, mat: { cihly: 10, papir: 20, prkna: 8 }, work: 14, era: ERA_MESTO, cozy: 3, rest: 1, quiet: 1, service: 14,
    desc: 'Tiché místo na čtení. Domovy v okruhu 14 jsou spokojenější a škola učí o 20 % rychleji.' },
  veterina: { n: 'Veterina', cat: 'domov', w: 2, h: 2, cost: 1200, mat: { cihly: 14, sklo: 6, latka: 4 }, work: 16, workers: 1, era: ERA_MESTO, cozy: 1, service: 16,
    desc: 'Kočky v okruhu 16 od domova jsou zdravější: pomaleji hladoví a líp spí.' },
  park: { n: 'Městský park', cat: 'ozdoby', w: 2, h: 2, cost: 250, mat: { kamen: 4 }, instant: 1, cozy: 6, rest: 1, quiet: 1, nodoor: 1, era: ERA_MESTO, service: 8,
    desc: 'Trávník, stromy a lavička. Tlumí ruch a zvedá hodnotu okolních pozemků.' }
});
B.obchodni_dum.canWork = b => !isNight();
for (const k of ['hotel', 'veterina']) Object.assign(B[k], { canWork: () => true, produce: b => { b.lastWork = G.t; } });
const SERVICES = ['hotel', 'obchodni_dum', 'kino', 'knihovna', 'veterina', 'park'];
function servicesAt(x, y) {
  return memo('s' + x + ',' + y, () => {
    const got = {};
    bNear(x, y, 18, b => { const r = B[b.type].service; if (r && Math.abs(b.x - x) + Math.abs(b.y - y) <= r) got[b.type] = 1; });
    return got;
  });
}
const _moodTargetM = moodTarget;
moodTarget = function (c) {
  let m = _moodTargetM(c);
  const h = c.home && G.bld[c.home];
  if (h && eraOf() >= ERA_MESTO) {
    const s = servicesAt(h.x, h.y);
    m += Math.min(8, (s.kino ? 2 : 0) + (s.knihovna ? 2 : 0) + (s.veterina ? 2 : 0) + (s.park ? 2 : 0) + (s.obchodni_dum ? 1 : 0));
    const d = districtAt(h.x, h.y); if (d === 'obytna') m += 3;
  }
  return clamp(m, 0, 100);
};
/* vet: slower hunger for cats living near one */
const _updateCatM = updateCat;
updateCat = function (c, dt) {
  const f = c.food, r = _updateCatM(c, dt);
  if (c.food < f && c.home && G.bld[c.home] && servicesAt(G.bld[c.home].x, G.bld[c.home].y).veterina) c.food += (f - c.food) * 0.25;
  return r;
};
/* library: school trains faster */
if (B.skola && B.skola.produce) { const p = B.skola.produce; B.skola.produce = (b, amt) => p(b, amt * (countB('knihovna') ? 1.2 : 1)); }

/* ---------- districts: every 16×16 block gets a character from what stands in it ---------- */
const DISTRICTS = { obytna: { n: 'Obytná', col: '#7bd6b0' }, prumyslova: { n: 'Průmyslová', col: '#e8962a' }, obchodni: { n: 'Obchodní', col: '#6ab4f0' }, smisena: { n: 'Smíšená', col: '#c4cad8' } };
let DIST = null, DIST_V = null;
function districts() {
  if (DIST_V === BLIST) return DIST;
  DIST_V = BLIST; DIST = new Map();
  const cnt = new Map();
  for (const b of BLIST) {
    if (!b.built) continue;
    const d = B[b.type], k = ((b.x >> 4) + 4096) * 8192 + ((b.y >> 4) + 4096);
    let c = cnt.get(k); if (!c) cnt.set(k, c = { r: 0, i: 0, o: 0, n: 0 });
    if (d.beds) c.r++; else if (d.interior || d.industry || (d.noise || 0) >= 3 || d.mine || d.chop) c.i++; else if (d.market || d.service || b.type === 'namesti' || b.type === 'radnice') c.o++;
    if (!d.instant && !d.ground) c.n++;
  }
  for (const [k, c] of cnt) {
    if (c.n < 3) continue;
    const t = c.r + c.i + c.o || 1;
    DIST.set(k, c.r / t >= 0.55 && c.i === 0 ? 'obytna' : c.i / t >= 0.5 ? 'prumyslova' : c.o / t >= 0.4 ? 'obchodni' : 'smisena');
  }
  return DIST;
}
const districtAt = (x, y) => districts().get(((x >> 4) + 4096) * 8192 + ((y >> 4) + 4096)) || null;
/* industrial districts share tools: +10 % work speed; commercial districts sell dearer */
const _workMulM = workMul;
workMul = function (c, b) { const m = _workMulM(c, b); return eraOf() >= ERA_MESTO && districtAt(b.x, b.y) === 'prumyslova' ? m * 1.1 : m; };
function stallMul(s) {
  let m = 1;
  if (s.type === 'obchodni_dum') m *= 1.15;
  if (eraOf() >= ERA_MESTO && districtAt(s.x, s.y) === 'obchodni') m *= 1.1;
  if (policy('trh') && dayIdx() % 7 === 6) m *= 1.3;
  return m;
}

/* ---------- town hall & by-laws ---------- */
const POLICIES = {
  klid: { n: 'Noční klid', d: 'Ruch trápí kočky jen napůl. Hlučné provozy (tovární ruch 3+) ale pracují o 15 % pomaleji.', cost: 20 },
  trh: { n: 'Trh o víkendu', d: 'Každý 7. den prodávají stánky a obchodní domy o 30 % dráž.', cost: 30 },
  mhd: { n: 'MHD zdarma', d: 'Kočky jezdí autobusem už od 18 dlaždic cesty a nákladní auta jezdí o 20 % rychleji.', cost: 60 },
  zelen: { n: 'Zelené město', d: 'Parky a stromy dávají o polovinu víc útulnosti. Stavby ale stojí o 10 % víc mincí.', cost: 40 },
  bezaut: { n: 'Den bez aut', d: 'Osobní auta zmizí z ulic (náklaďáky a autobusy jezdí dál). Kočky +2 nálada.', cost: 0 }
};
const policy = k => !!(G.policies && G.policies[k] && countB('radnice'));
Object.assign(B.radnice, {
  canWork: () => true, produce: b => { b.lastWork = G.t; },
  status: () => { const on = Object.keys(G.policies || {}).filter(k => G.policies[k]); return [on.length ? 'Vyhlášky: ' + on.map(k => POLICIES[k].n).join(', ') : 'Žádné vyhlášky', 'ok']; },
  inspect: () => {
    let h = '<h4>Vyhlášky</h4><p class="muted">Každá zapnutá vyhláška stojí ráno pár mincí.</p>';
    for (const k in POLICIES) { const P = POLICIES[k], on = G.policies && G.policies[k]; h += `<div class="tech ${on ? 'done' : ''}"><b>${P.n}${P.cost ? ` · ${P.cost} mincí/den` : ''}</b><small>${P.d}</small><button class="btn small ${on ? '' : 'alt'} chamfer" data-act="policy" data-arg="${k}">${on ? 'Zrušit' : 'Vyhlásit'}</button></div>`; }
    const cnt = {}; for (const v of districts().values()) cnt[v] = (cnt[v] || 0) + 1;
    h += '<h4>Čtvrti</h4>' + (Object.keys(cnt).length ? Object.keys(cnt).map(k => `<div class="kv"><span>${DISTRICTS[k].n}</span><b>${cnt[k]}</b></div>`).join('') : '<p class="muted">Zatím žádné — čtvrť vznikne, když v bloku 16×16 stojí aspoň 3 stavby.</p>');
    return h + '<p class="muted">Obytná: +3 nálada (bez průmyslu) · Průmyslová: +10 % rychlost práce · Obchodní: stánky +10 %. Mapa čtvrtí je v přehledech (klávesa H).</p>';
  }
});
ACTIONS.policy = k => { if (!G.policies) G.policies = {}; G.policies[k] = !G.policies[k]; toast(POLICIES[k].n + (G.policies[k] ? ' — vyhlášeno' : ' — zrušeno')); jobsDirty = true; };
MORNING_HOOKS.push(() => {
  if (!countB('radnice') || !G.policies) return;
  let c = 0; for (const k in G.policies) if (G.policies[k]) c += POLICIES[k].cost;
  if (c) { G.coins = Math.max(0, G.coins - c); }
});
/* by-law effects */
const _noiseAtM = noiseAt;
noiseAt = function (x, y) { const n = _noiseAtM(x, y); return policy('klid') ? Math.round(n / 2) : n; };
const _workMulM2 = workMul;
workMul = function (c, b) { const m = _workMulM2(c, b); return policy('klid') && (B[b.type].noise || 0) >= 3 ? m * 0.85 : m; };
const _moodTargetM2 = moodTarget;
moodTarget = function (c) { let m = _moodTargetM2(c); if (policy('bezaut')) m += 2; return clamp(m, 0, 100); };
const _recomputeCozyM = recomputeCozy;
recomputeCozy = function () { _recomputeCozyM(); if (policy('zelen')) { let extra = 0; for (const b of BLIST) if (b.built && (b.type === 'park' || B[b.type].tree)) extra += (B[b.type].cozy || 0) / 2; COZY += Math.floor(extra + G.owned.length * 0.5); } };
const _costOKM2 = costOK;
costOK = function (d) { if (policy('zelen') && G.coins < Math.ceil(d.cost * 1.1)) return 'Málo mincí'; return _costOKM2(d); };
const _placeM2 = place;
place = function (type, x, y) { const b = _placeM2(type, x, y); if (policy('zelen') && B[type].cost) G.coins -= Math.round(B[type].cost * 0.1); return b; };
STEP_HOOKS.push(() => { if (policy('bezaut')) for (const c of CARS) if (!c.depot && !c.bus) c.dead = true; });
if (typeof TRUCK_MIN !== 'undefined') {
  const _dispatchM = dispatch;
  dispatch = function (dep, c) { c.v = policy('mhd') ? 3.1 : 2.6; return _dispatchM(dep, c); };
}

/* ---------- hotel: guests spend in the morning, tourists spend more ---------- */
MORNING_HOOKS.push(() => {
  const n = countB('hotel'); if (!n) return;
  const guests = Math.min(40, n * 6 + (G.traders || []).length * 3), c = Math.round(guests * (6 + coziness() / 30));
  G.coins += c; G.stats.earned += c; G.stats.hotelGuests = (G.stats.hotelGuests || 0) + guests;
});
if (typeof airportMorning === 'function') {
  const _am = airportMorning;
  airportMorning = function () { const before = G.coins; _am(); if (countB('hotel') && G.coins > before) { const extra = Math.round((G.coins - before) * 0.4); G.coins += extra; G.stats.earned += extra; } };
  const i = MORNING_HOOKS.indexOf(_am); if (i >= 0) MORNING_HOOKS[i] = () => airportMorning();
}

/* ---------- inspect: which district a building is in ---------- */
const _inspectBldM = inspectBld;
inspectBld = function (b) {
  let h = _inspectBldM(b);
  if (b && eraOf() >= ERA_MESTO) { const d = districtAt(b.x, b.y); if (d) h += `<p class="muted">Čtvrť: <b>${DISTRICTS[d].n}</b></p>`; }
  return h;
};

/* ---------- simple code pictures (assets/budovy has the real ones) ---------- */
const SIMPLE = { radnice: ['#e8dcc0', '#a8423a'], hotel: ['#f0c878', '#3a74c8'], obchodni_dum: ['#d8dce8', '#e8484e'], kino: ['#8a6ac8', '#ffd23f'], knihovna: ['#c89a5a', '#6b4128'], veterina: ['#f6f1ec', '#3a9a78'] };
for (const k in SIMPLE) DRAW[k] = (g, X, Y, b, S, night) => {
  const [wall, roof] = SIMPLE[k], W = b.w * TS, H = b.h * TS;
  shape(g, [[X + 1, Y + 6, W - 2, H - 6, wall]]); shape(g, [[X - 1, Y + 2, W + 2, 5, roof]]); if (S === 3) R(g, '#ffffff', X - 1, Y + 2, W + 2, 2);
  for (let i = 0; i < b.w * 2 - 1; i++) R(g, night ? '#ffd86b' : '#bfe4f4', X + 5 + i * 8, Y + 12, 4, 6);
  R(g, '#6b4128', X + (W >> 1) - 3, Y + H - 9, 6, 9);
};
DRAW.park = (g, X, Y, b, S) => {
  R(g, S === 3 ? '#e4ebf6' : '#72c850', X + 1, Y + 1, 30, 30); R(g, '#d8b078', X + 13, Y + 1, 6, 30); R(g, '#d8b078', X + 1, Y + 13, 30, 6);
  for (const [x, y] of [[6, 6], [25, 7], [6, 25], [25, 25]]) { odisc(g, X + x, Y + y - 4, 5, S === 2 ? '#e8843a' : S === 3 ? '#e8eef8' : '#3a8a44'); R(g, '#6b4128', X + x, Y + y, 2, 3); }
  shape(g, [[X + 11, Y + 14, 10, 3, '#a8693e']]);
};
B.park.flat = 1;
for (const [k, v] of [['radnice', 10], ['hotel', 6], ['obchodni_dum', 6], ['kino', 6], ['knihovna', 6], ['veterina', 6]]) B[k].top = v;

HELP.push({ id: 'mesto2', n: 'Čtvrti a radnice', t: `<p><b>Čtvrti:</b> každý blok 16×16 dlaždic dostane charakter podle staveb v něm. <b>Obytná</b> (domy, žádný průmysl): kočky +3 nálada. <b>Průmyslová</b>: práce o 10 % rychlejší. <b>Obchodní</b>: stánky prodávají o 10 % dráž.</p>
<p><b>Radnice</b> (éra Město a doprava) vyhlašuje vyhlášky: Noční klid, Trh o víkendu, MHD zdarma, Zelené město, Den bez aut. Každá stojí ráno pár mincí.</p>
<p><b>Služby</b> — Kino, Knihovna, Veterina, Park, Obchodní dům a Hotel — pokrývají okruh kolem sebe. Kočky, které v něm bydlí, jsou spokojenější. Pokrytí ukazuje mapa služeb (klávesa H).</p>` });

/* ---------- saves from before 4.0: the new era sits at 4, so Science & space moves from 4 to 5 ---------- */
const _deserializeM = deserialize;
deserialize = function (s) {
  const ok = _deserializeM(s);
  if (ok && !G.eraV) { if ((G.era || 0) >= ERA_MESTO) G.era++; G.eraV = 2; }
  return ok;
};
const _newGameM2 = newGame;
newGame = function (o) { _newGameM2(o); G.eraV = 2; if (G.mode === 'kreativ') G.era = ERAS.length - 1; };
