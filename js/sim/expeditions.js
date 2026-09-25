'use strict';
/* ============ 3.0: expeditions beyond the horizon, new crops, soap & baths ============ */

/* ---------- new items, crops and recipes ---------- */
Object.assign(ITEMS, {
  slunecnice: { n: 'Slunečnice', v: 5, food: 14 },
  levandule: { n: 'Levandule', v: 5 },
  olej: { n: 'Slunečnicový olej', v: 22 },
  mydlo: { n: 'Levandulové mýdlo', v: 34 },
  mapa: { n: 'Stará mapa', v: 60 }
});
addSprites({
  slunecnice: ['..yyy..', '.yBBBy.', 'yBbBbBy', 'yBBbBBy', '.yBBBy.', '..yGy..', '...G...'],
  levandule: ['.v.v.', 'vVvVv', '.vVv.', '..G..', '.GGG.', '..G..'],
  olej: ['..kk..', '..yy..', '.yooy.', 'yooooy', 'yoooOy', 'yoooOy', '.yyyy.'],
  mydlo: ['.vvvvv.', 'vwvvvvV', 'vvVvvvV', 'vvvvvVV', '.VVVVV.'],
  mapa: ['cccccc.', 'cCrcCcc', 'ccCcrCc', 'cCccCcc', 'ccrCccC', '.cccccc']
});
Object.assign(CROPS, {
  slunecnice: { n: 'Slunečnice', s: [0, 1, 1, 0], grow: 45, yield: 5, seed: 1 },
  levandule: { n: 'Levandule', s: [1, 1, 0, 0], grow: 40, yield: 5, seed: 1 }
});
Object.assign(RECIPES, {
  olej: { in: { slunecnice: 3 }, out: 'olej', n: 1, t: 10 },
  mydlo: { in: { levandule: 2, olej: 1 }, out: 'mydlo', n: 2, t: 12 }
});
RAW_EAT.push('slunecnice');
NEIGH.sova.prefs.mydlo = 3; NEIGH.lis.prefs.mydlo = 4; NEIGH.jez.prefs.olej = 2; NEIGH.med.prefs.slunecnice = 2;
if (typeof SPECS !== 'undefined') { if (SPECS.kuchar) SPECS.kuchar.wants.olej = 3; for (const k in SPECS) if (SPECS[k].n === 'sběratel' || SPECS[k].n === 'námořník') SPECS[k].wants.mydlo = 3; }
DEFAULT_SELL.push('mydlo');

const _drawCrop = drawCrop;
drawCrop = function (g, crop, st, gr, px, py, S) {
  if (st === 2 && crop === 'slunecnice') { R(g, '#3a8a44', px, py - 7, 1, 7); R(g, '#72c850', px + 1, py - 4, 2, 1); shape(g, [[px - 2, py - 11, 5, 5, '#ffd23f']]); R(g, '#8a5230', px - 1, py - 10, 3, 3); return; }
  if (st === 2 && crop === 'levandule') { R(g, '#3a8a44', px - 1, py - 4, 1, 4); R(g, '#3a8a44', px + 1, py - 4, 1, 4); shape(g, [[px - 2, py - 7, 2, 3, '#b89ae8'], [px + 1, py - 8, 2, 4, '#8a6ac8']]); return; }
  return _drawCrop(g, crop, st, gr, px, py, S);
};

/* ---------- new buildings ---------- */
Object.assign(B, {
  lisovna: { n: 'Lisovna oleje', cat: 'vyroba', w: 2, h: 2, cost: 220, wood: 8, mat: { prkna: 8 }, work: 12, workers: 1, recipes: ['olej'], era: 1, needSeed: 'slunecnice', desc: 'Lisuje olej ze slunečnic. Semínka slunečnic přinese výprava.' },
  mydlarna: { n: 'Mýdlárna', cat: 'vyroba', w: 2, h: 2, cost: 260, wood: 6, mat: { prkna: 8, cihly: 6 }, work: 14, workers: 1, recipes: ['mydlo'], era: 1, needSeed: 'levandule', chimney: [24, -2], desc: 'Vaří voňavé levandulové mýdlo — skvělé zboží i pro kočičí lázně.' },
  lazne: { n: 'Kočičí lázně', cat: 'ozdoby', w: 2, h: 2, cost: 300, mat: { prkna: 10, cihly: 8 }, work: 14, era: 1, cozy: 2, needSeed: 'levandule', desc: 'Teplá koupel s mýdlem. S mýdlem +8 útulnost a kočky mají lepší náladu. Spotřebuje 1 mýdlo denně.' },
  stan: { n: 'Cestovatelský stan', cat: 'domov', w: 2, h: 2, cost: 250, wood: 10, mat: { prkna: 6 }, work: 12, era: 1, unique: 1, desc: 'Odsud vyrážejí kočky na výpravy za obzor — pro semínka, poklady a zatoulané kočky.' }
});
const _isUnlockedB2 = isUnlockedB, _lockReason2 = lockReason;
isUnlockedB = function (t) { const d = B[t]; if (d && d.needSeed && !(G.flags && G.flags['seed_' + d.needSeed])) return false; return _isUnlockedB2(t); };
lockReason = function (t) { const d = B[t]; if (d && d.needSeed && !(G.flags && G.flags['seed_' + d.needSeed]) && eraOf() >= (d.era || 0)) return 'Semínka z výpravy'; return _lockReason2(t); };
B.lazne.wants = b => (b.soap || 0) < 3 ? ['mydlo'] : null;
B.lazne.inNeed = (b, k) => k === 'mydlo' ? 3 - (b.soap || 0) - (b.inc.mydlo || 0) : 0;
B.lazne.receive = (b, k, n) => { if (k === 'mydlo') b.soap = Math.min(3, (b.soap || 0) + n); };
B.lazne.status = b => (b.soap || 0) > 0 ? [`Voní levandulí · mýdla ${b.soap}/3`, 'ok'] : ['Chybí mýdlo', 'wait'];
MORNING_HOOKS.push(() => { for (const b of BLIST) if (b.type === 'lazne' && b.built && b.soap > 0) { b.soap--; b.bathed = true; } else if (b.type === 'lazne') b.bathed = false; });
const _recomputeCozy2 = recomputeCozy;
recomputeCozy = function () { _recomputeCozy2(); for (const b of BLIST) if (b.type === 'lazne' && b.built && (b.soap > 0 || b.bathed)) COZY += 6; };
const _moodTarget3 = moodTarget;
let lazneT = -1, lazneOn = false;
moodTarget = function (c) { let m = _moodTarget3(c); if (G.t - lazneT > 2 || G.t < lazneT) { lazneT = G.t; lazneOn = BLIST.some(b => b.type === 'lazne' && b.built && b.soap > 0); } if (lazneOn) m += 3; return clamp(m, 0, 100); };

Object.assign(DRAW, {
  lisovna(g, X, Y, b, S, night) {
    shape(g, [[X + 3, Y + 12, 26, 19, '#e8c898']]); R(g, '#c8a070', X + 26, Y + 12, 3, 19);
    hipRoof(g, X, Y + 2, 32, 11, '#ffd23f', '#ffe890', '#c8a020', S === 3);
    door(g, X + 6, Y + 21, 6, 10); winGlass(g, X + 17, Y + 17, 7, 5, night, true);
    shape(g, [[X + 20, Y + 25, 8, 6, '#8a5230']]); R(g, '#ffd23f', X + 22, Y + 24, 4, 2);
  },
  mydlarna(g, X, Y, b, S, night) {
    shape(g, [[X + 3, Y + 12, 26, 19, '#f0e4f8']]); R(g, '#d0c0e0', X + 26, Y + 12, 3, 19);
    hipRoof(g, X, Y + 2, 32, 11, '#8a6ac8', '#b89ae8', '#6a4aa8', S === 3);
    door(g, X + 13, Y + 21, 6, 10); winGlass(g, X + 4, Y + 17, 6, 5, night, true); winGlass(g, X + 22, Y + 17, 5, 5, night, true);
    for (const [a, c] of [[4, 27], [23, 27]]) shape(g, [[X + a, Y + c, 4, 3, '#b89ae8']]);
  },
  lazne(g, X, Y, b, S) {
    shape(g, [[X + 2, Y + 8, 28, 22, '#c4cad8']]); R(g, '#9aa0b4', X + 2, Y + 27, 28, 3);
    shape(g, [[X + 5, Y + 11, 22, 15, S === 3 ? '#c8e4f8' : '#8fd8f0']]); R(g, '#c8f0ff', X + 7, Y + 13, 8, 2);
    shape(g, [[X + 1, Y + 1, 3, 10, '#a8693e'], [X + 28, Y + 1, 3, 10, '#a8693e']]); R(g, '#b89ae8', X + 2, Y, 28, 2);
  },
  stan(g, X, Y, b, S) {
    const parts = []; for (let i = 0; i < 18; i++) parts.push([X + 16 - i * 0.8 | 0, Y + 12 + i, (i * 1.6 | 0) + 2, 1, i % 6 < 3 ? '#e8484e' : '#fff3dc']); shape(g, parts);
    shape(g, [[X + 13, Y + 22, 6, 8, '#6b4128']]); R(g, '#2b1b2b', X + 15, Y + 23, 2, 7);
    shape(g, [[X + 15, Y + 2, 2, 11, '#8a5230']]);
    shape(g, [[X + 24, Y + 24, 6, 6, '#a8693e']]); R(g, '#c89a60', X + 25, Y + 25, 4, 1);
  }
});
Object.assign(ANIM, {
  stan(g, X, Y, b, t) {
    const out = G.expedition; const wave = Math.round(Math.sin(t * 4) * 1);
    if (!out) shape(g, [[X + 17, Y + 2 + wave, 7, 4, '#ffd23f']]); else R(g, '#ffd23f', X + 17, Y + 9, 4, 3);
  },
  lazne(g, X, Y, b, t) { if ((b.soap || 0) > 0 && Math.random() < 0.25) addPart(X + rand(8, 24), Y + rand(12, 22), rand(-3, 3), -10, '#ffffff', 1.2, { g: -3, sz: 1 }); }
});
Object.assign(LIT, { lisovna: 1, mydlarna: 1 });
for (const [k, v] of [['lisovna', 6], ['mydlarna', 6], ['lazne', 1], ['stan', 2]]) B[k].top = v;
{ const pek = B.pole; if (pek && pek.desc) pek.desc += ' Nové plodiny přinášejí výpravy.'; }

/* ---------- expeditions ---------- */
const EXP_SEEDS = ['slunecnice', 'levandule'];
const EXP_KINDS = [
  { n: 'Krátká výprava', d: 'půl dne · 1 kočka · 4 jídla', dur: 0.5, cats: 1, food: 4 },
  { n: 'Dlouhá výprava', d: '1 den · 2 kočky · 10 jídel', dur: 1, cats: 2, food: 10 },
  { n: 'Velká výprava za obzor', d: '2 dny · 3 kočky · 20 jídel', dur: 2, cats: 3, food: 20, era: 2 }
];
const EXP_TALES = ['opuštěný mlýn u řeky', 'jeskyně plná krápníků', 'bobr stavitel', 'horský hřeben', 'vor na jezeře', 'zarostlá zahrada', 'tanec s liškami na pasece', 'moře v dálce', 'březový háj', 'déšť pod starým dubem', 'vesnice veveřek', 'staré tábořiště', 'duha nad vodopádem', 'noc pod hvězdami'];
const foodStock = () => FOODS.reduce((a, k) => a + (G.stock[k] || 0), 0);
function expPick(n) {
  const pool = G.cats.filter(c => !(c.kitten > G.t)).sort((a, b) => (a.job ? 1 : 0) - (b.job ? 1 : 0) || b.energy - a.energy);
  return pool.slice(0, n);
}
function expWhy(k) {
  const K = EXP_KINDS[k];
  if (G.expedition) return 'Výprava je na cestě';
  if (K.era && eraOf() < K.era) return 'Od éry ' + ERAS[K.era].n;
  if (G.cats.filter(c => !(c.kitten > G.t)).length - K.cats < 2) return 'Doma musí zůstat aspoň 2 kočky';
  if (foodStock() < K.food) return `Potřebuješ ${K.food} jídla ve skladu`;
  return '';
}
ACTIONS.expedition = k => {
  k = +k; const K = EXP_KINDS[k], why = expWhy(k); if (why) { toast(why); Sound.nope(); return; }
  const st = BLIST.find(b => b.type === 'stan' && b.built); if (!st) return;
  let need = K.food; for (const f of FOODS) { const n = Math.min(need, G.stock[f] || 0); if (n) { takeStock(f, n); need -= n; } }
  const party = expPick(K.cats);
  for (const c of party) { abortTask(c); if (c.job) unassign(c.id); c.home = 0; c.task = null; c.carry = null; }
  G.cats = G.cats.filter(c => !party.includes(c));
  G.expedition = { kind: k, cats: party, back: G.t + K.dur * DAY, stan: st.id };
  if (UI.sel && UI.sel.kind === 'c' && party.some(c => c.id === UI.sel.id)) UI.sel = null;
  assignHomes(); jobsDirty = true; onBuildingsChanged();
  banner(K.n + ' vyráží!', party.map(c => c.name).join(', ') + ' — vrátí se za ' + (K.dur * 24) + ' h.'); Sound.season();
};
function expLoot(e) {
  const k = e.kind, era = eraOf(), out = [], g = G.flags;
  const coins = Math.round(randi(60, 140) * (k + 1) * (1 + era * 0.5)); G.coins += coins; G.stats.earned += coins; out.push(coins + ' mincí');
  const newSeed = EXP_SEEDS.find(s => !g['seed_' + s]);
  if (newSeed && (!G.stats.expeditions || k >= 1 || Math.random() < 0.5)) { g['seed_' + newSeed] = true; out.push('semínka: ' + CROPS[newSeed].n + '!'); }
  const pool = ['koreni', 'kakao', 'med', 'jablka', 'vlna', 'mapa'].concat(era >= 2 ? ['zlato', 'mapa'] : []).filter(i => ITEMS[i]);
  for (let i = 0; i < 1 + k; i++) { const it = pick(pool), n = it === 'mapa' || it === 'zlato' ? 1 + (k > 1 ? 1 : 0) : randi(3, 6) * (k + 1); addStock(it, n); out.push(n + '× ' + itemName(it).toLowerCase()); }
  if (k === 2) addStars(2, 'z výpravy'); else if (k === 1 && Math.random() < 0.35) addStars(1, 'z výpravy');
  if (k >= 1 && Math.random() < 0.3) { const bps = Object.keys(B).filter(t => B[t].bp && B[t].bpPrice && !g['bp_' + B[t].bp]); if (bps.length) { const t = pick(bps); g['bp_' + B[t].bp] = true; out.push('plánek: ' + B[t].n); } }
  let stray = null;
  if (k >= 1 && Math.random() < 0.2 + k * 0.1) stray = true;
  return { out, stray };
}
STEP_HOOKS.push(() => {
  const e = G.expedition; if (!e || G.t < e.back) return;
  const st = G.bld[e.stan] || BLIST.find(b => b.type === 'stan') || BLIST.find(b => B[b.type].store);
  const x = st ? (st.x + 1) * TS : e.cats[0].x, y = st ? (st.y + st.h) * TS + 6 : e.cats[0].y;
  for (const c of e.cats) { c.x = x + rand(-8, 8); c.y = y; resetCatTransient(c); c.inside = false; c.sleeping = false; c.energy = Math.max(30, c.energy - 20); c.mood = Math.min(100, c.mood + 12); c.xp = c.xp || {}; c.xp.vyprava = (c.xp.vyprava || 0) + 40 * EXP_KINDS[e.kind].dur; G.cats.push(c); emote(c, 'star', 4); }
  const res = expLoot(e);
  if (res.stray && freeBeds() > 0) { const s = newCat(pick(RAND_SKINS), pick(Object.keys(TRAITS)), null, x, y); res.out.push('nová kamarádka ' + s.name + '!'); }
  G.stats.expeditions = (G.stats.expeditions || 0) + 1;
  G.expedition = null;
  assignHomes(); jobsDirty = true; onBuildingsChanged();
  banner('Výprava se vrátila!', `${e.cats.map(c => c.name).join(', ')} — na cestě: ${pick(EXP_TALES)}. Úlovek: ${res.out.join(', ')}.`);
  Sound.unlock(); UI.dirty = true;
});
if (typeof SKILL_N !== 'undefined') SKILL_N.vyprava = 'Cestování';
B.stan.status = b => G.expedition ? ['Výprava na cestě — zpět za ' + Math.max(1, Math.ceil((G.expedition.back - G.t) / DAY * 24)) + ' h', 'ok'] : ['Připraveno k výpravě', 'ok'];
B.stan.inspect = b => {
  if (!b.built) return '';
  const e = G.expedition;
  if (e) { const K = EXP_KINDS[e.kind], p = 1 - (e.back - G.t) / (K.dur * DAY); return `<h4>${K.n}</h4><p>${e.cats.map(c => c.name).join(', ')} jsou na cestě.</p><div class="kv"><span>Cesta</span>${bar(p * 100)}</div>`; }
  let h = `<h4>Vyslat výpravu</h4><p class="muted">Kočky na výpravě nepracují. Přinesou mince, zboží, <b>semínka nových plodin</b>, plánky ozdob, hvězdičky — a někdy i novou kočku. Jídlo máš: ${foodStock()}.</p>`;
  EXP_KINDS.forEach((K, i) => { const why = expWhy(i); h += `<div class="upg"><span><b>${K.n}</b><br><small>${K.d}</small></span><button class="btn small chamfer ${why ? 'locked' : ''}" data-act="expedition" data-arg="${i}">Vyslat</button></div>${why ? `<small class="muted">${why}</small>` : ''}`; });
  const seeds = EXP_SEEDS.filter(s => G.flags['seed_' + s]);
  if (seeds.length) h += `<p>Objevená semínka: ${seeds.map(s => itemIcon(s, 1) + ' ' + CROPS[s].n).join(', ')} — nastav je na poli.</p>`;
  return h;
};
/* cats away still count in the cat list header */
const _paneCatsE = paneCats;
paneCats = function () { let h = _paneCatsE(); const e = G.expedition; if (e) h = `<div class="pill wait">Na výpravě: ${e.cats.map(c => c.name).join(', ')} (zpět za ${Math.max(1, Math.ceil((e.back - G.t) / DAY * 24))} h)</div>` + h; return h; };

ACH.push(['vyprava', 'Za obzor!', () => (G.stats.expeditions || 0) >= 1], ['cestovatel', 'Cestovatelé', () => (G.stats.expeditions || 0) >= 10], ['mydlo', 'Voňavá osada', () => (G.stats.made.mydlo || 0) >= 10]);
HELP.push({ id: 'vypravy', n: 'Výpravy', t: `<p>Od éry Řemesla a obchod můžeš postavit <b>Cestovatelský stan</b> (Stavět → Domov). Odtud vysíláš kočky na výpravy za obzor — krátkou (půl dne), dlouhou (den) nebo velkou (dva dny, od éry Hornictví).</p>
<p>Na cestu potřebují <b>jídlo</b> ze skladu a doma musí zůstat aspoň dvě kočky. Vrátí se s mincemi, zbožím, <b>semínky nových plodin</b> (slunečnice, levandule), plánky ozdob, hvězdičkami a někdy s novou kočkou.</p>
<p><b>Slunečnice</b> → Lisovna oleje → olej. <b>Levandule</b> + olej → Mýdlárna → voňavé mýdlo. Mýdlo je drahé zboží a <b>Kočičí lázně</b> s mýdlem dávají +8 útulnost a lepší náladu.</p>` });
