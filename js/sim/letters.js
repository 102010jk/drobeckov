'use strict';
/* ============ 3.1: letters from neighbours (story quests), cat favourites, fireflies ============ */

/* ---------- unique decor rewarded by letters ---------- */
Object.assign(B, {
  knihovna: { n: 'Sovina knihovna', cat: 'ozdoby', w: 2, h: 2, cost: 0, instant: 1, cozy: 7, flag: 'r_knihovna', quiet: 1, desc: 'Dárek od Sovy Hůhů. Kočky si tu čtou. +7 útulnost.' },
  zahradka: { n: 'Bylinková zahrádka', cat: 'ozdoby', w: 2, h: 1, cost: 0, instant: 1, cozy: 5, flag: 'r_zahradka', desc: 'Dárek od Zajíce Ušáka. Voní šalvějí a mátou. +5 útulnost.' },
  lodicky: { n: 'Rybníček s lodičkami', cat: 'ozdoby', w: 2, h: 2, cost: 0, instant: 1, cozy: 6, flag: 'r_lodicky', play: 1, desc: 'Dárek od Lišky. Kočky pouštějí lodičky. +6 útulnost.' },
  medovnik: { n: 'Medvědí včelí úl', cat: 'ozdoby', w: 1, h: 1, cost: 0, instant: 1, cozy: 4, flag: 'r_medovnik', desc: 'Dárek od Medvěda Brumly. Obří dekorativní úl. +4 útulnost.' },
  lavicka_j: { n: 'Babiččina houpací lavice', cat: 'ozdoby', w: 2, h: 1, cost: 0, instant: 1, cozy: 5, flag: 'r_lavicka', rest: 1, desc: 'Dárek od Babičky Ježkové. Kočky na ní dřímají. +5 útulnost.' }
});
Object.assign(DRAW, {
  knihovna(g, X, Y, b, S) {
    shape(g, [[X + 3, Y + 4, 26, 27, '#8a5230']]); R(g, '#6b4128', X + 26, Y + 4, 3, 27);
    const cols = ['#e8484e', '#6ab4f0', '#ffd23f', '#72c850', '#b89ae8', '#f79a3a'];
    for (let r = 0; r < 3; r++) { R(g, '#5a3018', X + 5, Y + 13 + r * 8, 21, 1); for (let i = 0; i < 9; i++) R(g, cols[(i + r * 2) % 6], X + 6 + i * 2, Y + 7 + r * 8, 2, 6 - (i % 3 === 0 ? 1 : 0)); }
    R(g, '#a8693e', X + 2, Y + 3, 28, 2);
  },
  zahradka(g, X, Y, b, S) {
    shape(g, [[X + 1, Y + 6, 30, 9, S === 3 ? '#b8a898' : '#8a5a2a']]);
    if (S !== 3) for (let i = 0; i < 7; i++) { const c = ['#72c850', '#3a8a44', '#b89ae8', '#8fe0c8'][i % 4]; shape(g, [[X + 3 + i * 4, Y + 4 + (i % 2), 3, 5, c]]); }
    R(g, '#a8693e', X + 1, Y + 14, 30, 1);
  },
  lodicky(g, X, Y, b, S) {
    odisc(g, X + 16, Y + 18, 13, '#8a8590'); g.fillStyle = S === 3 ? '#c8e4f8' : '#6ab4f0'; disc(g, X + 16, Y + 18, 11);
    R(g, '#a8d4f8', X + 9, Y + 14, 6, 1); R(g, '#a8d4f8', X + 18, Y + 22, 5, 1);
  },
  medovnik(g, X, Y, b, S) {
    shape(g, [[X + 3, Y + 3, 10, 12, '#e8c060']]); for (let i = 0; i < 4; i++) R(g, '#b8862a', X + 3, Y + 5 + i * 3, 10, 1);
    R(g, '#2b1b2b', X + 7, Y + 12, 2, 2); shape(g, [[X + 5, Y + 1, 6, 2, '#e8c060']]);
  },
  lavicka_j(g, X, Y, b, S) {
    shape(g, [[X + 2, Y - 6, 2, 21, '#8a5230'], [X + 28, Y - 6, 2, 21, '#8a5230'], [X + 2, Y - 7, 28, 2, '#a8693e']]);
    R(g, OUT, X + 7, Y - 5, 1, 9); R(g, OUT, X + 24, Y - 5, 1, 9);
    shape(g, [[X + 6, Y + 4, 20, 3, '#ff9ec0']]); shape(g, [[X + 6, Y - 1, 20, 5, '#e0608e']]);
  }
});
Object.assign(ANIM, {
  lodicky(g, X, Y, b, t) { for (let k = 0; k < 2; k++) { const a = t * 0.5 + k * 3.1, x = Math.round(X + 16 + Math.cos(a) * 7), y = Math.round(Y + 18 + Math.sin(a) * 5); R(g, '#ffffff', x - 2, y, 5, 2); R(g, k ? '#e8484e' : '#ffd23f', x, y - 3, 1, 3); R(g, k ? '#e8484e' : '#ffd23f', x + 1, y - 2, 1, 2); } },
  medovnik(g, X, Y, b, t) { if (seasonIdx() !== 3 && !isNight()) for (let k = 0; k < 2; k++) R(g, '#ffd23f', Math.round(X + 8 + Math.cos(t * 3 + k * 3) * 6), Math.round(Y + 6 + Math.sin(t * 5 + k) * 4), 1, 1); }
});
for (const [k, v] of [['knihovna', 4], ['zahradka', 1], ['lodicky', 1], ['medovnik', 1], ['lavicka_j', 8]]) B[k].top = v;

const _lockReasonL = lockReason;
lockReason = function (t) { const d = B[t]; if (d && d.flag && d.flag.startsWith('r_') && !G.flags[d.flag]) return 'Dárek z dopisu'; return _lockReasonL(t); };

/* ---------- letter chains ---------- */
const LETTERS = {
  jez: [
    { t: 'Milá osado, zima mi vyjedla spíž. Poslali byste mi pár bochníků chleba?', need: { chleb: 6 }, coins: 120 },
    { t: 'Vnoučata přijedou na návštěvu! Chci jim upéct perník — potřebuju med a mouku.', need: { med: 3, mouka: 6 }, coins: 180, stars: 1 },
    { t: 'Můj starý dědeček by rád seděl venku. Pomůžete mi s novou lavicí? Stačí prkna.', need: { prkna: 12 }, coins: 150, flag: 'r_lavicka', gift: 'Babiččina houpací lavice' },
    { t: 'Děkuju za všechno. Ještě jedna prosba — polštářky pro naše pelíšky.', need: { polstar: 3 }, coins: 300, stars: 2 }
  ],
  zaj: [
    { t: 'Ahoj! Mám hlad jak zajíc. Deset mrkviček by mě zachránilo.', need: { mrkev: 10 }, coins: 90 },
    { t: 'Chystám zahradní slavnost. Nemáte džem a jablka?', need: { dzem: 3, jablka: 6 }, coins: 200, flag: 'r_zahradka', gift: 'Bylinková zahrádka' },
    { t: 'Moje nory potřebují nové záclonky. Pošlete látku?', need: { latka: 4 }, coins: 260, stars: 1 }
  ],
  med: [
    { t: 'Brum! Na zimní spánek potřebuju zásoby — mošt a jablka.', need: { most: 2, jablka: 8 }, coins: 180 },
    { t: 'Včely u mě nechtějí bydlet. Pomůžete? Potřebuju med a prkna na úl.', need: { med: 5, prkna: 6 }, coins: 220, flag: 'r_medovnik', gift: 'Medvědí včelí úl' },
    { t: 'Chci si postavit krb. Poslali byste cihly?', need: { cihly: 15 }, coins: 350, stars: 2 }
  ],
  sova: [
    { t: 'Hů hů. Píšu knihu o hvězdách a došel mi papír.', need: { papir: 8 }, coins: 160, flag: 'r_knihovna', gift: 'Sovina knihovna' },
    { t: 'Kniha je hotová! Na hvězdy se ale líp dívá přes čočku…', need: { cocka: 2 }, coins: 300, stars: 2 },
    { t: 'Poslední prosba staré sovy: hvězdná mapa, ať vím, kam letí vaše rakety.', need: { hvezdna_mapa: 1 }, coins: 800, stars: 3 }
  ],
  lis: [
    { t: 'Liška tady. Obchod jde dobře — potřebuju sklo na výlohu.', need: { sklo: 6 }, coins: 200 },
    { t: 'Chci pro děti rybníček s lodičkami. Pošlete trochu mýdla a látky na plachetky?', need: { mydlo: 2, latka: 2 }, coins: 260, flag: 'r_lodicky', gift: 'Rybníček s lodičkami' },
    { t: 'Mám bohatého zákazníka. Dva šperky, prosím — dobře zaplatím.', need: { sperky: 2 }, coins: 700, stars: 2 }
  ]
};
function letterOk(L) { return Object.keys(L.need).every(k => ITEMS[k] && producible(k)); }
function newLetter() {
  if (!G.letters) G.letters = []; if (!G.lq) G.lq = {};
  if (G.letters.filter(l => !l.done).length >= 2) return false;
  const opts = Object.keys(LETTERS).filter(nb => { const i = G.lq[nb] || 0, L = LETTERS[nb][i]; return L && !G.letters.some(l => l.nb === nb && !l.done) && letterOk(L); });
  if (!opts.length) return false;
  const nb = pick(opts), i = G.lq[nb] || 0;
  G.letters.push({ nb, i, done: false, t: G.t });
  toast('Přišel dopis od: ' + NEIGH[nb].n + ' ✉'); Sound.meow(); UI.dirty = true;
  return true;
}
MORNING_HOOKS.push(() => { if (dayIdx() >= 1 && Math.random() < 0.6) newLetter(); });
const canLetter = l => { const L = LETTERS[l.nb][l.i]; return Object.keys(L.need).every(k => (G.stock[k] || 0) >= L.need[k]); };
ACTIONS.letter = idx => {
  const l = G.letters && G.letters[+idx]; if (!l || l.done) return;
  if (!canLetter(l)) { toast('Ve skladu ještě něco chybí.'); Sound.nope(); return; }
  const L = LETTERS[l.nb][l.i];
  for (const k in L.need) takeStock(k, L.need[k]);
  G.coins += L.coins; G.stats.earned += L.coins; if (L.stars) addStars(L.stars, 'z dopisu');
  G.nb[l.nb] = (G.nb[l.nb] || 0) + 3;
  if (L.flag) G.flags[L.flag] = true;
  l.done = true; G.lq[l.nb] = l.i + 1; G.stats.letters = (G.stats.letters || 0) + 1;
  banner(NEIGH[l.nb].n + ' děkuje!', `+${L.coins} mincí${L.stars ? ', ' + L.stars + ' ★' : ''}${L.gift ? ' a dárek: ' + L.gift + ' (Stavět → Ozdoby)' : ''}.`);
  Sound.coin(); jobsDirty = true;
  G.letters = G.letters.filter(x => !x.done || G.t - x.t < DAY);
};
function lettersHTML() {
  const open = (G.letters || []).map((l, i) => [l, i]).filter(([l]) => !l.done);
  if (!open.length) return '';
  let h = '<h4>Dopisy ✉</h4>';
  for (const [l, i] of open) {
    const L = LETTERS[l.nb][l.i], ok = canLetter(l);
    h += `<div class="order letter"><div class="ohead">${animalIcon(NEIGH[l.nb].sp, 2)}<div><b>${NEIGH[l.nb].n}</b><small>dopis ${l.i + 1}/${LETTERS[l.nb].length}</small></div></div><p class="ltext">„${L.t}“</p><div class="lines">`;
    for (const k in L.need) { const have = G.stock[k] || 0; h += `<span class="line ${have >= L.need[k] ? 'ok' : ''}">${itemIcon(k)}<b>${Math.min(have, L.need[k])}/${L.need[k]}</b><small>${itemName(k)}</small></span>`; }
    h += `</div><div class="ofoot"><span>${icon('coin', 1)} ${L.coins}${L.stars ? ' · ★ ' + L.stars : ''}${L.gift ? ' · 🎁 ' + L.gift : ''}</span><button class="btn small chamfer ${ok ? '' : 'locked'}" data-act="letter" data-arg="${i}">Poslat</button></div></div>`;
  }
  return h;
}
const _paneOrdersL = paneOrders;
paneOrders = function () { const h = _paneOrdersL(), l = lettersHTML(); if (!l) return h; const at = h.indexOf('<h4>Zakázky na nástěnce</h4>'); return at < 0 ? h + l : h.slice(0, at) + l + h.slice(at); };

/* ---------- cat favourites ---------- */
const FAV_FOOD = ['ryby', 'chleb', 'mleko', 'susenky'];
const FAV_DECOR = ['kvetiny', 'lucerna', 'lampiony', 'kasna', 'houpacka', 'lavicka', 'kocici_strom', 'altan', 'zahon_ruzi', 'fontana', 'dalekohled'];
function favOf(c) {
  if (!c.fav) { const h = Math.floor(hashi(c.id, 7919, 13) * 1e9); c.fav = { food: FAV_FOOD[h % FAV_FOOD.length], decor: FAV_DECOR.filter(k => B[k])[(h >> 4) % FAV_DECOR.filter(k => B[k]).length] }; }
  return c.fav;
}
function favDecorNear(c) {
  const f = favOf(c).decor, home = c.home && G.bld[c.home];
  if (!home) return false;
  for (const b of BLIST) if (b.type === f && b.built && Math.abs(b.x - home.x) <= 7 && Math.abs(b.y - home.y) <= 7) return true;
  return false;
}
const _moodTarget4 = moodTarget;
moodTarget = function (c) { let m = _moodTarget4(c); if (favDecorNear(c)) m += 5; return clamp(m, 0, 100); };
const _inspectCat3 = inspectCat;
inspectCat = function (c) {
  let h = _inspectCat3(c); if (!c) return h;
  const f = favOf(c);
  h += `<div class="kv"><span>Má ráda</span><b>${itemIcon(f.food, 1)} ${itemName(f.food).toLowerCase()} · ${B[f.decor].n.toLowerCase()} u domku ${favDecorNear(c) ? '✓' : ''}</b></div>`;
  return h;
};

/* ---------- fireflies on summer nights ---------- */
const FLIES = [];
const _drawWeatherFX2 = drawWeatherFX;
drawWeatherFX = function (g, dt) {
  _drawWeatherFX2(g, dt);
  const on = seasonIdx() === 1 && darkness() > 0.3 && G.weather !== 'rain' && !SET.lowfx;
  if (!on) { FLIES.length = 0; return; }
  while (FLIES.length < 26) FLIES.push({ x: Math.random() * VW, y: Math.random() * VH, a: Math.random() * 6.28, s: rand(4, 10), p: Math.random() * 6.28 });
  g.setTransform(1, 0, 0, 1, 0, 0);
  const t = performance.now() / 1000;
  for (const f of FLIES) {
    f.a += (Math.random() - 0.5) * dt * 3; f.x += Math.cos(f.a) * f.s * dt; f.y += Math.sin(f.a) * f.s * dt;
    if (f.x < 0) f.x += VW; if (f.x > VW) f.x -= VW; if (f.y < 0) f.y += VH; if (f.y > VH) f.y -= VH;
    const glow = 0.5 + 0.5 * Math.sin(t * 2.5 + f.p);
    g.globalAlpha = 0.25 * glow; g.fillStyle = '#e8ff90'; g.fillRect(Math.round(f.x) - 1, Math.round(f.y) - 1, 3, 3);
    g.globalAlpha = 0.9 * glow; g.fillStyle = '#f8ffc0'; g.fillRect(Math.round(f.x), Math.round(f.y), 1, 1);
  }
  g.globalAlpha = 1;
};

ACH.push(['dopisy', 'Pilný pisálek', () => (G.stats.letters || 0) >= 5], ['darky', 'Dárky od sousedů', () => ['r_knihovna', 'r_zahradka', 'r_lodicky', 'r_medovnik', 'r_lavicka'].every(f => G.flags[f])]);
{ const p = HELP.find(x => x.id === 'sousede'); if (p) p.t += `<p><b>Dopisy:</b> sousedé ti občas pošlou dopis s prosbou (záložka Zakázky). Každý soused má svůj příběh o 3–4 dopisech a za některé dostaneš <b>jedinečnou ozdobu</b>, kterou jinde nekoupíš.</p>`; }
{ const p = HELP.find(x => x.id === 'kocky'); if (p) p.t += `<p><b>Oblíbené věci:</b> každá kočka má oblíbené jídlo a oblíbenou ozdobu. Když má tu ozdobu blízko svého domku, je spokojenější. Najdeš to v detailu kočky.</p>`; }
