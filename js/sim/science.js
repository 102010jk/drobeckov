'use strict';
/* ============ school: professions ============ */
const profOK = p => !PROFS[p].tech || hasTech(PROFS[p].tech);
Object.assign(B.skola, {
  wants: b => b.train ? Object.keys(PROFS[b.train.prof].cost) : null,
  inNeed: (b, k) => b.train && PROFS[b.train.prof].cost[k] ? PROFS[b.train.prof].cost[k] - (b.inp[k] || 0) - (b.inc[k] || 0) : 0,
  canWork: b => !!b.train && Object.entries(PROFS[b.train.prof].cost).every(([k, n]) => (b.inp[k] || 0) >= n),
  produce: (b, amt) => {
    b.p += amt / (G.flags.hvezdarna ? 35 : 50);
    if (b.p < 1) return;
    b.p = 0;
    for (const [k, n] of Object.entries(PROFS[b.train.prof].cost)) b.inp[k] -= n;
    const c = G.cats.find(x => x.id === b.train.cat);
    if (c) { if (c.job && B[G.bld[c.job] ? G.bld[c.job].type : ''] && B[G.bld[c.job].type].prof && B[G.bld[c.job].type].prof !== b.train.prof) unassign(c.id); c.prof = b.train.prof; banner('Nový ' + PROFS[b.train.prof].n.toLowerCase() + '!', `${c.name} dokončil${'a'} školu.`); Sound.unlock(); tutEvent('prof'); }
    b.train = null; UI.dirty = true; jobsDirty = true;
  },
  status: b => b.train ? [(b.working ? 'Učí se: ' : 'Čeká na papír: ') + (G.cats.find(c => c.id === b.train.cat) || {}).name + ' → ' + PROFS[b.train.prof].n + ' ' + Math.floor(b.p * 100) + ' %', 'ok'] : ['Vyber, koho vyškolit', 'wait'],
  inspect: b => {
    if (b.train) return `<button class="link" data-act="traincancel">Zrušit výuku</button>`;
    if (UI.trainPick) {
      const p = UI.trainPick;
      return `<div class="picker"><small>Koho vyškolit na ${PROFS[p].n.toLowerCase()}a? (${Object.entries(PROFS[p].cost).map(([k, n]) => n + '× ' + itemName(k).toLowerCase()).join(', ')})</small>` +
        G.cats.filter(c => c.prof !== p).map(c => `<button class="worker" data-act="trainc" data-arg="${c.id}">${catHead(c.skin, 2)}<span><b>${c.name}</b><small>${c.prof ? PROFS[c.prof].n : TRAITS[c.trait].n}</small></span></button>`).join('') + `<button class="link" data-act="trainprof" data-arg="">zpět</button></div>`;
    }
    return '<h4>Vyškolit</h4>' + Object.keys(PROFS).map(p => `<button class="btn small ${profOK(p) ? 'alt' : 'locked'} chamfer" data-act="${profOK(p) ? 'trainprof' : 'noop'}" data-arg="${p}">${PROFS[p].n}${profOK(p) ? '' : ' 🔒'}</button>`).join(' ') +
      `<p class="muted">Vědec: pracuje v laboratoři · Inženýr: +40 % v továrnách a hutích · Astronaut: poletí raketou</p>`;
  }
});
ACTIONS.trainprof = p => { UI.trainPick = p || null; };
ACTIONS.trainc = id => { const b = G.bld[UI.sel && UI.sel.id]; if (b && UI.trainPick) { b.train = { cat: +id, prof: UI.trainPick }; b.p = 0; UI.trainPick = null; jobsDirty = true; } };
ACTIONS.traincancel = () => { const b = G.bld[UI.sel && UI.sel.id]; if (b) { for (const k in b.inp) addStock(k, b.inp[k]); b.inp = {}; b.train = null; } };

/* ============ laboratory & research ============ */
function techAvail(k) { const t = TECH[k]; return !G.tech[k] && (t.req || []).every(r => G.tech[r]); }
function researchLeft(k) { const t = TECH[k], p = (G.rprog && G.rprog[k]) || {}; const o = {}; for (const i in t.cost) { const l = t.cost[i] - (p[i] || 0); if (l > 0) o[i] = l; } return o; }
Object.assign(B.laborator, {
  wants: b => G.research ? Object.keys(researchLeft(G.research)) : null,
  inNeed: (b, k) => { if (!G.research) return 0; const l = researchLeft(G.research)[k] || 0; return Math.min(4, l) - (b.inp[k] || 0) - (b.inc[k] || 0); },
  canWork: b => !!G.research && Object.keys(researchLeft(G.research)).some(k => (b.inp[k] || 0) > 0),
  produce: (b, amt) => {
    b.p += amt / (G.flags.krater ? 6 : 8) * (G.flags.hvezdarna ? 1.3 : 1);
    if (b.p < 1) return;
    b.p = 0;
    const k = G.research, left = researchLeft(k), item = Object.keys(left).find(i => (b.inp[i] || 0) > 0);
    if (!item) return;
    b.inp[item]--; if (!G.rprog) G.rprog = {}; if (!G.rprog[k]) G.rprog[k] = {}; G.rprog[k][item] = (G.rprog[k][item] || 0) + 1;
    sparkle(b.x * TS + 16, b.y * TS + 10, '#8fe0c8', 6, 8);
    if (!Object.keys(researchLeft(k)).length) {
      G.tech[k] = true; G.research = null; G.stats.techs = (G.stats.techs || 0) + 1;
      banner('Objev: ' + TECH[k].n, TECH[k].d); Sound.unlock(); UI.dirty = true; jobsDirty = true; tutEvent('tech');
    }
  },
  status: b => G.research ? [(b.working ? 'Zkoumá: ' : 'Čeká na sady: ') + TECH[G.research].n, 'ok'] : ['Vyber výzkum v záložce Výzkum', 'wait'],
  inspect: () => `<button class="btn small chamfer" data-act="tab" data-arg="research">Otevřít výzkum</button>`
});
ACTIONS.research = k => { if (techAvail(k)) { G.research = k; jobsDirty = true; toast('Laboratoř teď zkoumá: ' + TECH[k].n); } };
EXTRA_TABS.research = () => {
  if (eraOf() < 3) return `<p class="muted">Výzkum se otevře v éře ${ERAS[3].n} (${ERAS[3].hint}).</p>`;
  let h = `<p class="muted">Postav <b>Školu</b> (vyškolí vědce) a <b>Laboratoř</b>. Vědci spotřebovávají výzkumné sady: <b>Zápisník</b> (papírna: papír + med), <b>Technický výkres</b> (montážní stůl), <b>Elektro sada</b> a <b>Hvězdná mapa</b> (pájecí stůl).</p>`;
  if (!countB('laborator')) h += '<div class="pill wait">Zatím nemáš laboratoř</div>';
  for (const k in TECH) {
    const t = TECH[k], done = G.tech[k], av = techAvail(k), cur = G.research === k, p = (G.rprog && G.rprog[k]) || {};
    const cost = Object.entries(t.cost).map(([i, n]) => `${itemIcon(i, 1)}<small>${Math.min(p[i] || 0, n)}/${n}</small>`).join(' ');
    h += `<div class="tech ${done ? 'done' : cur ? 'avail' : av ? '' : 'locked'}"><b>${t.n}${done ? ' ✓' : cur ? ' — zkoumá se' : ''}</b><small>${t.d}</small><span class="inv">${cost}</span>${(t.req || []).length && !done ? `<small>Vyžaduje: ${t.req.map(r => TECH[r].n).join(', ')}</small>` : ''}${av && !cur ? `<button class="btn small chamfer" data-act="research" data-arg="${k}">Zkoumat</button>` : ''}</div>`;
  }
  return h;
};

/* ============ electricity ============ */
const powerCap = () => 60 + countB('elektrarna') * 120 + countB('vetrnik') * 30;
function powerOK() { return (G.power || 0) >= 2; }
function usePower() { G.power = Math.max(0, (G.power || 0) - 2); G.stats.powerUsed = (G.stats.powerUsed || 0) + 2; }
Object.assign(B.elektrarna, {
  wants: () => ['uhli'],
  inNeed: (b, k) => k === 'uhli' ? 8 - (b.inp.uhli || 0) - (b.inc.uhli || 0) : 0,
  canWork: b => (b.inp.uhli || 0) > 0 && (G.power || 0) < powerCap() - 20,
  produce: (b, amt) => { b.p += amt / 6; if (b.p >= 1) { b.p = 0; b.inp.uhli--; G.power = Math.min(powerCap(), (G.power || 0) + 25); } },
  status: b => [`Proud ${Math.floor(G.power || 0)}/${powerCap()}${(b.inp.uhli || 0) ? '' : ' · chybí uhlí'}`, (b.inp.uhli || 0) ? 'ok' : 'bad'],
  alert: b => (b.inp.uhli || 0) || avail('uhli') > 0 ? null : { item: 'uhli' }
});
Object.assign(B.vetrnik, { tick: (b, dt) => { G.power = Math.min(powerCap(), (G.power || 0) + dt * 0.3 * (G.weather === 'rain' ? 1.6 : 1) * (seasonIdx() === 3 ? 1.3 : 1)); b.active = true; }, status: () => [`Proud ${Math.floor(G.power || 0)}/${powerCap()}`, 'ok'] });

/* ============ airships ============ */
SPECS.vzducholod = { n: 'letec', wants: { motor: 3, hracky: 3, sperky: 2, baterie: 3, obvod: 2, cokoladovy_dort: 2, polstar: 2, cip: 2 }, sells: [['ruda_au', 0.8], ['bauxit', 0.8], ['kakao', 0.6], ['koreni', 0.6], ['bp', 0.5]] };
const _tradeHub = tradeHub;
tradeHub = t => t.kind === 'vz' ? BLIST.find(b => b.built && b.type === 'vez') : _tradeHub(t);
const _genTr2 = genTrader;
genTrader = function (kind) {
  if (kind !== 'vz') return _genTr2(kind);
  const t = _genTr2('lod'); const S = SPECS.vzducholod;
  t.kind = 'vz'; t.spec = 'vzducholod'; t.sp = pick(['sova', 'veverka', 'myval']);
  const wantsAll = Object.entries(S.wants).filter(([k]) => ITEMS[k] && producible(k)); t.wants = [];
  for (let i = 0; i < 3 && wantsAll.length; i++) { const k = weighted(wantsAll); wantsAll.splice(wantsAll.findIndex(e => e[0] === k), 1); t.wants.push({ item: k, mult: +(1.6 + Math.random() * 0.8).toFixed(2), qty: Math.max(3, Math.round(150 / ITEMS[k].v)) }); }
  return t;
};
MORNING_HOOKS.push(() => {
  if (!countB('vez') || (G.traders || []).some(t => t.kind === 'vz')) return;
  G.airT = (G.airT == null ? 1 : G.airT) - 1; if (G.airT > 0) return;
  G.airT = randi(2, 3); const t = genTrader('vz'); t.arrT = G.t; G.traders.push(t);
  banner('Přilétá vzducholoď!', `${t.name} (${ANIMALS[t.sp].n}) kotví u přistávací věže.`); Sound.deliver();
});
SPECS.namornik && (SPECS.vzducholod.n = 'letec');
const AIRSHIP = (() => {
  const [c, g] = mk(40, 30);
  const parts = []; for (let i = 0; i < 12; i++) { const w = Math.round(Math.sqrt(1 - Math.pow((i - 5.5) / 6, 2)) * 18); parts.push([20 - w, 2 + i, w * 2, 1, '#e8484e']); } shape(g, parts);
  for (let i = 3; i < 12; i += 3) R(g, '#ff8a8a', 4, 2 + i, 32, 1);
  R(g, OUT, 14, 14, 1, 6); R(g, OUT, 25, 14, 1, 6); shape(g, [[12, 19, 16, 6, '#a8693e']]); R(g, '#bfe4f4', 15, 20, 3, 2); R(g, '#bfe4f4', 22, 20, 3, 2);
  shape(g, [[1, 5, 4, 6, '#ffd23f']]);
  return c;
})();
ENT_HOOKS.push((E, t) => {
  for (const tr of (G.traders || [])) {
    if (tr.kind !== 'vz') continue;
    const h = BLIST.find(b => b.type === 'vez' && b.built); if (!h) continue;
    const k = Math.min(1, (G.t - (tr.arrT || 0)) / 20), x = h.x * TS - 4 + (1 - k) * 200, y = h.y * TS - 40 + Math.round(Math.sin(t * 1.2) * 2) - (1 - k) * 60;
    E.push([h.y * TS + 40, 9, 0, 0, g => g.drawImage(AIRSHIP, Math.round(x), Math.round(y))]);
  }
});

/* ============ rocket ============ */
Object.assign(B.kosmodrom, {
  init: b => { b.stage = 0; },
  wants: b => (b.stage || 0) < 3 ? Object.keys(ROCKET_STAGES[b.stage || 0].need) : null,
  inNeed: (b, k) => (b.stage || 0) < 3 ? (ROCKET_STAGES[b.stage || 0].need[k] || 0) - (b.inp[k] || 0) - (b.inc[k] || 0) : 0,
  tick: b => {
    const st = b.stage || 0; if (st >= 3) return;
    const need = ROCKET_STAGES[st].need;
    if (Object.keys(need).every(k => (b.inp[k] || 0) >= need[k])) { for (const k in need) b.inp[k] -= need[k]; b.stage = st + 1; banner(ROCKET_STAGES[st].n + ' hotov!', b.stage < 3 ? 'Další: ' + ROCKET_STAGES[b.stage].n : 'Raketa je připravená ke startu!'); Sound.built(); UI.dirty = true; jobsDirty = true; }
  },
  status: b => (b.stage || 0) >= 3 ? [G.flags.launched ? 'Raketa už letí ke hvězdám' : 'Připraveno ke startu!', 'ok'] : ['Staví se: ' + ROCKET_STAGES[b.stage || 0].n, 'wait'],
  inspect: b => {
    let h = '<h4>Raketa</h4>';
    ROCKET_STAGES.forEach((s, i) => {
      const done = (b.stage || 0) > i, cur = (b.stage || 0) === i;
      h += `<div class="tech ${done ? 'done' : cur ? 'avail' : 'locked'}"><b>${s.n}${done ? ' ✓' : ''}</b><span class="inv">${Object.entries(s.need).map(([k, n]) => `${itemIcon(k, 1)}<small>${done ? n : cur ? Math.min(b.inp[k] || 0, n) : 0}/${n}</small>`).join(' ')}</span></div>`;
    });
    const astro = G.cats.find(c => c.prof === 'astronaut');
    if ((b.stage || 0) >= 3 && !G.flags.launched) h += astro ? `<button class="btn big chamfer" data-act="launch" data-arg="${b.id}">Odpočítávání! (${astro.name} poletí)</button>` : '<p class="muted">Ještě potřebuješ astronauta — vyškol ho ve Škole.</p>';
    return h;
  }
});
let LAUNCH = null;
ACTIONS.launch = id => {
  const b = G.bld[+id], astro = G.cats.find(c => c.prof === 'astronaut'); if (!b || !astro) return;
  LAUNCH = { b: b.id, t0: performance.now() / 1000, cat: astro.id, done: false };
  UI.sel = null; UI.speed = 1; centerOn((b.x + 2.5) * TS, (b.y + 1) * TS);
  banner('10… 9… 8…', `${astro.name} si nasazuje helmu.`); Sound.season();
};
function launchUpdate() {
  if (!LAUNCH) return 0;
  const b = G.bld[LAUNCH.b]; if (!b) { LAUNCH = null; return 0; }
  const t = performance.now() / 1000 - LAUNCH.t0;
  if (t > 3 && t < 12) { const X = (b.x + 2.5) * TS, Y = (b.y + 4) * TS - rocketLift(t); for (let i = 0; i < 3; i++) addPart(X + rand(-4, 4), Y + 4, rand(-20, 20), rand(10, 40), pick(['#ffd23f', '#f79a3a', '#ffffff', '#c4cad8']), rand(0.5, 1.2), { g: -10, sz: 2 }); }
  if (t > 3 && !LAUNCH.boom) { LAUNCH.boom = true; Sound.chop(); for (const c of G.cats) emote(c, 'heart', 6); }
  if (t > 9 && !LAUNCH.fw) { LAUNCH.fw = true; for (let k = 0; k < 6; k++) setTimeout(() => { const x = CAM.x + rand(-120, 120), y = CAM.y - rand(40, 110); sparkle(x, y, pick(['#ff6f9c', '#ffd23f', '#7bd6b0', '#6ab4f0']), 24, 16); Sound.coin(); }, k * 350); }
  if (t > 12 && !LAUNCH.done) {
    LAUNCH.done = true; G.flags.launched = true; G.stats.launches = (G.stats.launches || 0) + 1;
    const astro = G.cats.find(c => c.id === LAUNCH.cat); if (astro) astro.space = true;
    flyAway();
    showEnding();
  }
  if (t > 14) LAUNCH = null;
  return t;
}
/* the astronaut really leaves: out of the town, into the stats */
function flyAway() {
  for (const c of G.cats.filter(x => x.space)) {
    if (c.job) unassign(c.id);
    (G.spaceCats = G.spaceCats || []).push({ name: c.name, skin: c.skin, t: G.t });
    G.cats = G.cats.filter(x => x !== c);
  }
  assignHomes(); jobsDirty = true; UI.dirty = true;
}
const rocketLift = t => t < 3 ? 0 : Math.pow(t - 3, 2.2) * 6;
function showEnding() {
  const el = $('menu'); el.hidden = false;
  const s = G.stats;
  el.innerHTML = `<div class="panel nails chamfer mpanel"><h1 class="title">Drobečkov ve hvězdách</h1><p class="sub">První kočka z osady ${G.name} letí do vesmíru!</p>
    <div class="stats-end"><p>Rok ${yearIdx()}, ${SEASONS[seasonIdx()].name.toLowerCase()} · ${G.cats.length} koček · ${BLIST.length} staveb · ${G.owned.length} pozemků</p>
    <p>Vyděláno ${fmt(s.earned)} mincí · ${s.orders} zakázek · ${s.fests} slavností · ${s.techs || 0} objevů · ${Object.keys(G.poiDone).length} objevených míst</p>
    <p>Od teď ti satelit ukazuje celý svět bez mraků a předpověď počasí na zítřek.</p></div>
    <div class="row"><button class="btn big chamfer" data-m="resume">Hrát dál</button></div></div>`;
  Sound.unlock(); G.tut && (G.tut.done.end = true);
}
STEP_HOOKS.push(() => { if (G.flags.launched && !G.flags.satelit) { G.flags.satelit = true; } });
const _fog = fogLevel;
fogLevel = (px, py) => { const f = _fog(px, py); return G.flags.satelit ? Math.min(f, 2) : f; };
MORNING_HOOKS.push(() => { if (G.flags.satelit) { const S = seasonIdx(); G.forecast = S === 3 ? (Math.random() < 0.5 ? 'snow' : 'clear') : (Math.random() < SEASONS[S].rain ? 'rain' : 'clear'); } });

/* ============ achievements ============ */
const ACH = [
  ['chleb', 'První chléb', () => (G.stats.made.chleb || 0) >= 1],
  ['kocky10', 'Deset koček', () => G.cats.length >= 10],
  ['kocky25', 'Kočičí město', () => G.cats.length >= 25],
  ['slavnost', 'První slavnost', () => G.stats.fests >= 1],
  ['slavnosti4', 'Celý rok oslav', () => G.stats.fests >= 4],
  ['pozemky20', 'Za obzor', () => G.owned.length >= 32],
  ['pozemky60', 'Velkostatkář', () => G.owned.length >= 72],
  ['poi5', 'Objevitel', () => Object.keys(G.poiDone).length >= 5],
  ['obchod', 'Obchodník', () => (G.stats.traded || 0) >= 1],
  ['ocel', 'Ocelové tlapky', () => (G.stats.made.ocel || 0) >= 1],
  ['motor', 'Motorizace', () => (G.stats.made.motor || 0) >= 1],
  ['objev', 'Vědecký objev', () => (G.stats.techs || 0) >= 1],
  ['proud', 'Světlo v údolí', () => !!G.tech.elektrina],
  ['bohac', 'Zlatý fous', () => G.stats.earned >= 100000],
  ['raketa', 'Kočka ve vesmíru', () => !!G.flags.launched]
];
let achT = 0;
STEP_HOOKS.push(dt => {
  achT -= dt; if (achT > 0) return; achT = 3;
  if (!G.ach) G.ach = {};
  for (const [k, n, ok] of ACH) if (!G.ach[k] && ok()) { G.ach[k] = G.t; toast('Úspěch: ' + n + ' 🏆'); Sound.unlock(); }
});
HELP.push({ id: 'uspechy', n: 'Úspěchy', t: '' });
const _helpTab = EXTRA_TABS.help;
EXTRA_TABS.help = () => {
  if (helpPage !== 'uspechy') return _helpTab();
  let h = '<div class="chips">' + HELP.map(p => `<button class="chip-btn ${helpPage === p.id ? 'on' : ''}" data-act="help" data-arg="${p.id}">${p.n}</button>`).join('') + '</div><div class="help-page"><h3>Úspěchy</h3>';
  for (const [k, n] of ACH) h += `<div class="tech ${G.ach && G.ach[k] ? 'done' : 'locked'}"><b>${G.ach && G.ach[k] ? '🏆 ' : ''}${n}</b></div>`;
  return h + '</div>';
};
