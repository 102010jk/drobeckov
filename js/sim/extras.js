'use strict';
/* ============ 2.6: daily wishes, stars, wild animals, seasonal decor, supply rockets, photos ============ */

/* ---------- stars (hvězdičky) — earned from wishes & rockets ---------- */
function addStars(n, why) { G.stars = (G.stars || 0) + n; G.stats.starsTotal = (G.stats.starsTotal || 0) + n; toast(`+${n} ★ ${why || ''}`); }
const starTxt = n => `<b class="stars">★ ${n}</b>`;

/* ---------- counters used by wishes ---------- */
const _petCat = petCat;
petCat = function (c) { const before = c.petT; _petCat(c); if (c.petT !== before) G.stats.pets = (G.stats.pets || 0) + 1; };
const _completeBuilding = completeBuilding;
completeBuilding = function (b) { _completeBuilding(b); G.stats.built = (G.stats.built || 0) + 1; };

/* ---------- daily wishes from Babička Ježková ---------- */
const WISH = {
  make: { n: w => `Vyrob ${w.n}× ${itemName(w.k)}`, cur: w => (G.stats.made[w.k] || 0) },
  pet: { n: w => `Pohlaď kočky ${w.n}×`, cur: () => G.stats.pets || 0 },
  orders: { n: w => `Doruč ${w.n} ${w.n > 1 ? 'zakázky' : 'zakázku'}`, cur: () => G.stats.orders },
  earn: { n: w => `Vydělej ${w.n} mincí`, cur: () => G.stats.earned },
  build: { n: w => `Dostav ${w.n} ${w.n > 1 ? 'stavby' : 'stavbu'}`, cur: () => G.stats.built || 0 },
  sell: { n: w => `Prodej ${w.n} věcí (stánek, trh, obchodníci)`, cur: () => G.stats.sold + (G.stats.traded || 0) },
  wild: { n: w => `Pohlaď ${w.n} ${w.n > 1 ? 'divoká zvířátka' : 'divoké zvířátko'}`, cur: () => G.stats.wild || 0 }
};
function makeWish(kind) {
  const w = { kind, done: false, claimed: false };
  const e = eraOf();
  if (kind === 'make') {
    const made = Object.keys(G.stats.made).filter(k => ITEMS[k] && G.stats.made[k] > 2);
    if (!made.length) return null;
    w.k = pick(made); w.n = clamp(Math.round(60 / ITEMS[w.k].v), 2, 20);
  } else if (kind === 'pet') w.n = randi(4, 7);
  else if (kind === 'orders') w.n = e >= 2 ? 2 : 1;
  else if (kind === 'earn') { const H = G.hist || []; const per = H.length > 2 ? (H[H.length - 1][3] - H[H.length - 3][3]) / 2 : 200; w.n = Math.max(150, Math.round(per * 0.7 / 50) * 50); }
  else if (kind === 'build') w.n = randi(1, 2);
  else if (kind === 'sell') w.n = randi(5, 12);
  else if (kind === 'wild') w.n = 1;
  w.base = WISH[kind].cur(w);
  w.coins = 50 + e * 60 + randi(0, 5) * 10;
  return w;
}
function newWishes() {
  const kinds = ['make', 'make', 'pet', 'orders', 'earn', 'build', 'sell', 'wild'].sort(() => Math.random() - 0.5);
  const out = [], used = {};
  for (const k of kinds) { if (out.length >= 3 || used[k]) continue; const w = makeWish(k); if (w) { out.push(w); used[k] = 1; } }
  G.wishes = out; G.wishBonus = false;
}
MORNING_HOOKS.push(newWishes);
const wishProg = w => Math.min(w.n, WISH[w.kind].cur(w) - w.base);
let wishT = 0;
STEP_HOOKS.push(dt => {
  wishT -= dt; if (wishT > 0) return; wishT = 1;
  if (!G.wishes) { newWishes(); return; }
  for (const w of G.wishes) if (!w.done && wishProg(w) >= w.n) { w.done = true; toast('Přání splněno: ' + WISH[w.kind].n(w)); Sound.coin(); UI.dirty = true; }
});
ACTIONS.wish = i => {
  const w = G.wishes && G.wishes[+i]; if (!w || !w.done || w.claimed) return;
  w.claimed = true; G.coins += w.coins; G.stats.earned += w.coins; addStars(1, 'za přání');
  G.stats.wishes = (G.stats.wishes || 0) + 1;
  if (!G.wishBonus && G.wishes.every(x => x.claimed)) { G.wishBonus = true; G.coins += 150; addStars(1, 'za všechna přání dne'); banner('Babička Ježková je nadšená', 'Splnil jsi všechna dnešní přání. +150 mincí a hvězdička navíc.'); }
  Sound.coin(); UI.dirty = true;
};
function wishesHTML() {
  if (!G.wishes || !G.wishes.length) return '';
  let h = `<div class="fest wishes"><div class="fhead"><b>${animalIcon('jezek', 2)} Přání dne</b><small>Babička Ježková · ${starTxt(G.stars || 0)}</small></div>`;
  G.wishes.forEach((w, i) => {
    const p = wishProg(w);
    h += `<div class="wish ${w.claimed ? 'claimed' : w.done ? 'ok' : ''}"><span>${WISH[w.kind].n(w)}</span><small>${w.claimed ? 'hotovo ✓' : Math.max(0, p) + '/' + w.n}</small>${w.done && !w.claimed ? `<button class="btn small chamfer" data-act="wish" data-arg="${i}">${icon('coin', 1)} ${w.coins} + ★</button>` : `<small>${icon('coin', 1)} ${w.coins} + ★</small>`}</div>`;
  });
  return h + '<small class="muted">Nová přání každé ráno. Hvězdičky utratíš v Příručce → Kloboučky.</small></div>';
}
const _paneOrders = paneOrders;
paneOrders = function () { return wishesHTML() + _paneOrders(); };

/* ---------- star shop: special hats & decor ---------- */
Object.assign(HATS, {
  svatozar: { n: 'Svatozář', rows: ['.yyyyy.', 'y.....y', '.yyyyy.'], stars: 6 },
  carodej: { n: 'Čarodějný klobouk', rows: ['...v...', '..vv...', '..vvv..', '.vvyvv.', 'vvvvvvv'], stars: 8 },
  kosmo: { n: 'Kosmická helma', rows: ['.WWWWW.', 'WuuuuwW', 'WuuuuuW', 'WWWWWWW'], stars: 12 },
  koruna_kvet: { n: 'Věneček', rows: ['p.y.p.y', 'ggggggg'], stars: 4 }
});
for (const k of ['svatozar', 'carodej', 'kosmo', 'koruna_kvet']) HATS[k].spr = buildSprite(HATS[k].rows, Object.assign({ v: '#7a4ab8' }, PAL), OUT);
const _hatbuy = ACTIONS.hatbuy;
ACTIONS.hatbuy = k => {
  const h = HATS[k]; if (!h || !h.stars) return _hatbuy(k);
  if ((G.stars || 0) < h.stars) { toast('Málo hvězdiček.'); Sound.nope(); return; }
  G.stars -= h.stars; if (!G.hats) G.hats = {}; G.hats[k] = (G.hats[k] || 0) + 1; Sound.unlock(); toast('Získáno: ' + h.n);
};
const STAR_BP = [['zvonkohra', 3], ['hvezdna_lampa', 5], ['kocici_socha', 10]];
ACTIONS.starbp = k => {
  const e = STAR_BP.find(x => x[0] === k); if (!e || G.flags['bp_' + k]) return;
  if ((G.stars || 0) < e[1]) { toast('Málo hvězdiček.'); Sound.nope(); return; }
  G.stars -= e[1]; G.flags['bp_' + k] = true; Sound.unlock(); banner('Nový plán: ' + B[k].n, 'Najdeš ho ve Stavět → Ozdoby.'); UI.dirty = true;
};
const _helpTab3 = EXTRA_TABS.help;
EXTRA_TABS.help = () => {
  let h = _helpTab3();
  if (helpPage === 'hats') {
    h = h.replace(/<\/div>$/, '');
    h += `<h3>Hvězdný obchod ${starTxt(G.stars || 0)}</h3><p>Hvězdičky dostaneš za přání dne a za zásobovací rakety.</p>`;
    h += STAR_BP.map(([k, n]) => `<div class="srow">${bIconImg(k)}<span class="sn">${B[k].n} <small>${B[k].desc}</small></span><b></b><span></span>${G.flags['bp_' + k] ? '<small>máš ✓</small>' : `<button class="tog buy" data-act="starbp" data-arg="${k}">★ ${n}</button>`}</div>`).join('');
    h += '</div>';
  }
  return h;
};
function bIconImg(k) { const ic = bIcon(k); return `<img class="ico" src="${ic.url}" width="${ic.w}" height="${ic.h}" alt="">`; }

/* ---------- new decor: seasonal + star blueprints ---------- */
Object.assign(B, {
  snehulak: { n: 'Sněhulák', cat: 'ozdoby', w: 1, h: 1, cost: 5, instant: 1, cozy: 1, season: 3, seasonCozy: 5, onlySeason: 3, nodoor: 1, desc: 'Jen v zimě. +6 útulnost, na jaře roztaje.' },
  dynova_lucerna: { n: 'Dýňová lucerna', cat: 'ozdoby', w: 1, h: 1, cost: 20, mat: { dyne: 1 }, instant: 1, cozy: 1, season: 2, seasonCozy: 4, light: 18, lightAt: [8, 9], nodoor: 1, desc: 'Svítí. +1 útulnost, na podzim +5.' },
  maj: { n: 'Májka', cat: 'ozdoby', w: 1, h: 1, cost: 30, wood: 3, instant: 1, cozy: 1, season: 0, seasonCozy: 5, nodoor: 1, desc: 'Ozdobená májka. +1 útulnost, na jaře +6.' },
  slunecnik: { n: 'Slunečník', cat: 'ozdoby', w: 1, h: 1, cost: 40, instant: 1, cozy: 1, season: 1, seasonCozy: 4, nodoor: 1, quiet: 1, desc: 'Stín na horké dny. +1 útulnost, v létě +5.' },
  ptaci_budka: { n: 'Ptačí budka', cat: 'ozdoby', w: 1, h: 1, cost: 25, wood: 2, instant: 1, cozy: 2, nodoor: 1, desc: '+2 útulnost. Kolem častěji chodí divoká zvířátka.' },
  zvonkohra: { n: 'Zvonkohra', cat: 'ozdoby', w: 1, h: 1, cost: 60, instant: 1, cozy: 4, nodoor: 1, bp: 'zvonkohra', quiet: 1, desc: 'Cinká ve větru a tlumí ruch. +4 útulnost.' },
  hvezdna_lampa: { n: 'Hvězdná lampa', cat: 'ozdoby', w: 1, h: 1, cost: 120, instant: 1, cozy: 5, light: 40, lightAt: [8, 1], nodoor: 1, bp: 'hvezdna_lampa', desc: 'Září jako malá hvězda. +5 útulnost.' },
  kocici_socha: { n: 'Zlatá kočičí socha', cat: 'ozdoby', w: 2, h: 2, cost: 500, instant: 1, cozy: 14, nodoor: 1, bp: 'kocici_socha', desc: 'Pomník nejslavnější kočky osady. +14 útulnost.' }
});
Object.assign(DRAW, {
  snehulak(g, X, Y) { odisc(g, X + 8, Y + 11, 4, '#ffffff'); odisc(g, X + 8, Y + 5, 3, '#ffffff'); R(g, '#e0e8f4', X + 10, Y + 10, 2, 4); R(g, OUT, X + 7, Y + 4, 1, 1); R(g, OUT, X + 9, Y + 4, 1, 1); R(g, '#f79a3a', X + 8, Y + 5, 2, 1); shape(g, [[X + 6, Y, 5, 2, '#3e3852']]); R(g, '#e8484e', X + 5, Y + 7, 6, 1); },
  dynova_lucerna(g, X, Y, b, S, night) { odisc(g, X + 8, Y + 10, 4, '#f79a3a'); R(g, '#d86a1a', X + 6, Y + 7, 1, 7); R(g, '#d86a1a', X + 10, Y + 7, 1, 7); R(g, '#3a8a40', X + 8, Y + 4, 1, 3); const c = night ? '#fff4b0' : '#5a2a10'; R(g, c, X + 6, Y + 9, 1, 1); R(g, c, X + 10, Y + 9, 1, 1); R(g, c, X + 7, Y + 12, 3, 1); },
  maj(g, X, Y, b, S) { shape(g, [[X + 7, Y - 8, 2, 23, '#a8693e']]); odisc(g, X + 8, Y - 9, 3, '#3a8a40'); [['#e8484e', -4], ['#ffd23f', -2], ['#6ab4f0', 0], ['#ff9ec0', 2]].forEach(([c, d], i) => R(g, c, X + 8 + d, Y - 5 + i, 1, 8 - i)); R(g, '#ffffff', X + 6, Y - 6, 4, 1); },
  slunecnik(g, X, Y) { R(g, OUT, X + 8, Y + 1, 1, 14); const parts = []; for (let i = 0; i < 5; i++) parts.push([X + 7 - i * 1.5 | 0, Y + i, 3 + i * 3, 1, i % 2 ? '#ffffff' : '#e8484e']); shape(g, parts); shape(g, [[X + 3, Y + 13, 10, 2, '#e8cc98']]); },
  ptaci_budka(g, X, Y) { shape(g, [[X + 7, Y + 6, 2, 9, '#8a5230']]); shape(g, [[X + 4, Y, 8, 7, '#e8c060']]); R(g, '#b85a48', X + 3, Y - 1, 10, 2); odisc(g, X + 8, Y + 3, 1, '#2b1b2b'); },
  zvonkohra(g, X, Y) { shape(g, [[X + 7, Y - 4, 2, 19, '#6b4128'], [X + 3, Y - 4, 10, 2, '#6b4128']]); for (const [a, l] of [[4, 6], [7, 8], [10, 5], [12, 7]]) { R(g, '#9aa0b4', X + a, Y - 2, 1, l); R(g, '#e8eef8', X + a, Y - 2 + l, 1, 1); } },
  hvezdna_lampa(g, X, Y, b, S, night) { shape(g, [[X + 7, Y + 3, 2, 12, '#3e3852']]); const c = night ? '#fff4b0' : '#ffd23f'; shape(g, [[X + 5, Y - 1, 6, 4, c], [X + 7, Y - 3, 2, 8, c]]); R(g, '#ffffff', X + 7, Y, 1, 1); shape(g, [[X + 5, Y + 13, 6, 2, '#3e3852']]); },
  kocici_socha(g, X, Y) {
    shape(g, [[X + 4, Y + 20, 24, 11, '#c4cad8']]); R(g, '#9aa0b4', X + 4, Y + 28, 24, 3);
    const gold = '#e8b830', hi = '#ffe070';
    shape(g, [[X + 10, Y + 6, 12, 14, gold], [X + 11, Y - 2, 10, 9, gold], [X + 11, Y - 5, 3, 4, gold], [X + 18, Y - 5, 3, 4, gold], [X + 21, Y + 14, 6, 3, gold]]);
    R(g, hi, X + 12, Y, 3, 3); R(g, hi, X + 11, Y + 8, 2, 8); R(g, OUT, X + 13, Y + 2, 1, 2); R(g, OUT, X + 18, Y + 2, 1, 2);
  }
});
Object.assign(ANIM, {
  zvonkohra(g, X, Y, b, t) { if (Math.sin(t * 1.7 + b.id) > 0.6) R(g, '#ffffff', X + 7 + Math.round(Math.sin(t * 9) * 3), Y + 5, 1, 1); },
  hvezdna_lampa(g, X, Y, b, t) { if (Math.floor(t * 2 + b.id) % 3 === 0) { R(g, '#ffffff', X + 3, Y - 4, 1, 1); R(g, '#ffffff', X + 12, Y + 1, 1, 1); } }
});
Object.assign(LIT, { dynova_lucerna: 1, hvezdna_lampa: 1 });
for (const [k, v] of [['snehulak', 1], ['maj', 12], ['slunecnik', 1], ['zvonkohra', 6], ['hvezdna_lampa', 4], ['kocici_socha', 8]]) B[k].top = v;
const _recomputeCozy = recomputeCozy;
recomputeCozy = function () {
  _recomputeCozy();
  const S = seasonIdx(); let add = 0;
  for (const b of BLIST) { const d = B[b.type]; if (b.built && d.seasonCozy && d.season === S) add += d.seasonCozy; }
  COZY += add;
};
const _isUnlockedB = isUnlockedB, _lockReason = lockReason;
isUnlockedB = function (type) { const d = B[type]; if (d && d.onlySeason !== undefined && seasonIdx() !== d.onlySeason) return false; return _isUnlockedB(type); };
lockReason = function (type) { const d = B[type]; if (d && d.onlySeason !== undefined && seasonIdx() !== d.onlySeason) return 'Jen v zimě'; return _lockReason(type); };
MORNING_HOOKS.push(() => {
  if (seasonIdx() === 3) return;
  const melt = BLIST.filter(b => b.type === 'snehulak');
  if (melt.length) { for (const b of melt) removeBld(b, true); banner('Sněhuláci roztáli', 'Jaro je tady. Příští zimu je postavíš znovu.'); }
});

/* ---------- wild animals & stray kittens ---------- */
const WILD = [];
const WILD_KINDS = ['jezek', 'zajic', 'liska', 'veverka', 'jezevec'];
let wildT = 20;
STEP_HOOKS.push(dt => {
  wildT -= dt;
  const budky = countB('ptaci_budka');
  if (wildT <= 0) {
    wildT = rand(25, 60) / (1 + budky * 0.25);
    if (WILD.length < 2 + Math.min(3, budky)) {
      const E = edgeTiles();
      if (E.length) {
        const [x, y] = pick(E), night = darkness() > 0.4;
        const stray = freeBeds() > 0 && Math.random() < 0.06;
        const kind = stray ? 'kote' : night ? pick(['jezek', 'jezek', 'liska', 'jezevec']) : pick(WILD_KINDS);
        WILD.push({ kind, x: x * TS + 8, y: y * TS + 12, tx: x * TS + 8, ty: y * TS + 12, life: rand(0.3, 0.6) * DAY, face: 1, skin: randi(0, SKINS.length - 1), wait: 0 });
        if (stray) toast('Na kraji osady mňouká zatoulané koťátko…');
      }
    }
  }
  for (let i = WILD.length - 1; i >= 0; i--) {
    const w = WILD[i]; w.life -= dt;
    if (w.life <= 0 && !w.leaving) { w.leaving = true; const E = edgeTiles(); if (E.length) { const [x, y] = pick(E); w.tx = x * TS + 8; w.ty = y * TS + 12; } }
    const dx = w.tx - w.x, dy = w.ty - w.y, d = Math.hypot(dx, dy);
    if (d < 1) {
      if (w.leaving) { WILD.splice(i, 1); continue; }
      w.wait -= dt;
      if (w.wait <= 0) { const s = randomSpot(w.x / TS | 0, w.y / TS | 0, 4); if (s) { w.tx = s[0] * TS + 8; w.ty = s[1] * TS + 12; } w.wait = rand(2, 8); }
    } else { const sp = (w.kind === 'zajic' ? 20 : 11) * dt; w.x += dx / d * Math.min(sp, d); w.y += dy / d * Math.min(sp, d); if (Math.abs(dx) > 0.5) w.face = dx > 0 ? 1 : -1; }
  }
});
ENT_HOOKS.push((E, t) => {
  for (const w of WILD) {
    E.push([w.y, 9, 0, 0, g => {
      const s = w.kind === 'kote' ? kitSpr(w.skin)[Math.hypot(w.tx - w.x, w.ty - w.y) > 1 ? (Math.floor(t * 6) % 2 ? 'walk0' : 'walk1') : 'sit'] : ANIMALS[w.kind].spr;
      const hop = w.kind === 'zajic' && Math.hypot(w.tx - w.x, w.ty - w.y) > 1 ? Math.abs(Math.sin(t * 10)) * 3 : 0;
      const x = Math.round(w.x - s.w / 2), y = Math.round(w.y - s.h - hop);
      g.fillStyle = 'rgba(43,27,43,0.18)'; g.fillRect(Math.round(w.x - s.w / 2 + 1), Math.round(w.y - 1), s.w - 2, 2);
      if ((w.kind === 'kote' ? -w.face : w.face) < 0) { g.save(); g.translate(x + s.w, y); g.scale(-1, 1); g.drawImage(s.c, 0, 0); g.restore(); } else g.drawImage(s.c, x, y);
      if (w.kind === 'kote' && Math.floor(t * 1.5) % 3 === 0) g.drawImage(EMO.heart ? EMO.heart.c : s.c, Math.round(w.x - 3), y - 8);
    }]);
  }
});
const WILD_GIFTS = [
  ['jezek', 'Ježek ti přinesl jablíčko', () => { G.stock.jablka = (G.stock.jablka || 0) + 2; return '+2 jablka'; }],
  ['veverka', 'Veverka ti nechala oříšky', () => { const n = randi(20, 40); G.coins += n; return `+${n} mincí`; }],
  ['zajic', 'Zajíček ti přinesl mrkvičku', () => { G.stock.mrkev = (G.stock.mrkev || 0) + 3; return '+3 mrkve'; }],
  ['liska', 'Liška se nechala pohladit', () => { for (const c of G.cats) c.mood = Math.min(100, c.mood + 3); return 'kočky mají radost'; }],
  ['jezevec', 'Jezevec vyhrabal starou minci', () => { const n = randi(40, 90); G.coins += n; return `+${n} mincí`; }]
];
function wildAt(px, py) { return WILD.find(w => Math.abs(px - w.x) <= 9 && py <= w.y + 3 && py >= w.y - 14); }
function wildClick(px, py) {
  {
    const w = wildAt(px, py);
    if (w && !w.petted) {
      w.petted = true;
      if (w.kind === 'kote') {
        if (freeBeds() <= 0) { toast('Koťátko by rádo zůstalo, ale nemá kde spát. Postav domek!'); w.petted = false; return true; }
        const k = newCat(w.skin, pick(Object.keys(TRAITS)), null, w.x, w.y);
        k.kitten = G.t + 2 * DAY; assignHomes(); WILD.splice(WILD.indexOf(w), 1);
        banner('Zatoulané koťátko zůstává!', `${k.name} má nový domov v osadě ${G.name}.`); Sound.meow(); G.stats.strays = (G.stats.strays || 0) + 1;
      } else {
        const gft = WILD_GIFTS.find(x => x[0] === w.kind) || WILD_GIFTS[0];
        const res = gft[2](); toast(`${gft[1]} (${res})`); Sound.purr(); G.stats.wild = (G.stats.wild || 0) + 1;
        for (let i = 0; i < 5; i++) addPart(w.x + rand(-5, 5), w.y - 8, rand(-8, 8), rand(-24, -12), '#ff6f9c', rand(0.6, 1), { g: 0, k: 'heart', drag: 1 });
        w.life = Math.min(w.life, 4);
      }
      UI.dirty = true; return true;
    }
  }
  return false;
}

/* ---------- supply rockets after the first launch ---------- */
const CARGO = [['konzervy', 12], ['polstar', 4], ['cokoladovy_dort', 3], ['baterie', 6], ['sperky', 3], ['hracky', 4], ['med', 10]];
const SUPPLY_BASE = { trupovy_panel: 3, raketove_palivo: 12, navadeci_pocitac: 1 };
function supplyNeed(b) {
  if (!b.cargo) { const c = pick(CARGO.filter(([k]) => ITEMS[k])); b.cargo = c[0]; b.cargoN = c[1]; }
  return Object.assign({}, SUPPLY_BASE, { [b.cargo]: b.cargoN });
}
const KD = B.kosmodrom, _kd = { wants: KD.wants, inNeed: KD.inNeed, tick: KD.tick, status: KD.status, inspect: KD.inspect };
Object.assign(KD, {
  wants: b => G.flags.launched ? (b.supReady ? null : Object.keys(supplyNeed(b))) : _kd.wants(b),
  inNeed: (b, k) => G.flags.launched ? (b.supReady ? 0 : (supplyNeed(b)[k] || 0) - (b.inp[k] || 0) - (b.inc[k] || 0)) : _kd.inNeed(b, k),
  tick: b => {
    if (!G.flags.launched) return _kd.tick(b);
    if (b.supReady) return;
    const need = supplyNeed(b);
    if (Object.keys(need).every(k => (b.inp[k] || 0) >= need[k])) { for (const k in need) b.inp[k] -= need[k]; b.supReady = true; banner('Zásobovací raketa připravena', 'Vyšli ji z kosmodromu.'); Sound.built(); UI.dirty = true; jobsDirty = true; }
  },
  status: b => !G.flags.launched ? _kd.status(b) : b.supReady ? ['Zásobovací raketa čeká na start', 'ok'] : ['Nakládá se zásobovací raketa', 'wait'],
  inspect: b => {
    if (!G.flags.launched) return _kd.inspect(b);
    const need = supplyNeed(b), n = G.stats.supply || 0;
    let h = `<h4>Vesmírná stanice Mňau</h4><p>Posíláš zásoby kočce ve vesmíru. Vysláno ${n}/5${n >= 5 ? ' — stanice je hotová!' : ''}.</p>`;
    h += `<div class="tech ${b.supReady ? 'done' : 'avail'}"><b>Zásobovací raketa${b.supReady ? ' ✓' : ''}</b><span class="inv">${Object.entries(need).map(([k, q]) => `${itemIcon(k, 1)}<small>${b.supReady ? q : Math.min(b.inp[k] || 0, q)}/${q}</small>`).join(' ')}</span></div>`;
    h += `<p class="muted">Odměna: ${icon('coin', 1)} ${supplyReward(b)} + ★ 3</p>`;
    if (b.supReady) h += `<button class="btn big chamfer" data-act="supplylaunch" data-arg="${b.id}">Vyslat raketu!</button>`;
    return h;
  }
});
const supplyReward = b => 2500 + Math.round(ITEMS[b.cargo].v * b.cargoN * 2) + (G.stats.supply || 0) * 300;
ACTIONS.supplylaunch = id => {
  const b = G.bld[+id]; if (!b || !b.supReady || LAUNCH) return;
  LAUNCH = { b: b.id, t0: performance.now() / 1000, cat: 0, done: false, supply: true };
  UI.sel = null; centerOn((b.x + 2.5) * TS, (b.y + 1) * TS); banner('3… 2… 1…', 'Zásobovací raketa startuje!'); Sound.season();
};
const _launchUpdate = launchUpdate;
launchUpdate = function () {
  if (LAUNCH && LAUNCH.supply && !LAUNCH.done && performance.now() / 1000 - LAUNCH.t0 > 12) {
    LAUNCH.done = true;
    const b = G.bld[LAUNCH.b];
    if (b) {
      const pay = supplyReward(b); G.coins += pay; G.stats.earned += pay; G.stats.supply = (G.stats.supply || 0) + 1;
      b.supReady = false; b.cargo = null; addStars(3, 'za raketu');
      if (G.stats.supply === 5) { G.stats.cozyBonus = (G.stats.cozyBonus || 0) + 10; banner('Vesmírná stanice Mňau je hotová!', `Kočky ve vesmíru mávají dolů. +${pay} mincí, +10 útulnost.`); }
      else banner('Zásoby doručeny!', `+${pay} mincí a 3 hvězdičky. Kosmodrom nakládá další raketu.`);
    }
  }
  return _launchUpdate();
};
const _animKd = ANIM.kosmodrom;
ANIM.kosmodrom = function (g, X, Y, b, t) {
  const launching = LAUNCH && LAUNCH.b === b.id;
  if (!G.flags.launched || (launching && !LAUNCH.supply)) return _animKd(g, X, Y, b, t);
  const lift = launching ? rocketLift(performance.now() / 1000 - LAUNCH.t0) : 0;
  if (!launching && !b.supReady) {
    const need = supplyNeed(b); let got = 0, tot = 0; for (const k in need) { got += Math.min(b.inp[k] || 0, need[k]); tot += need[k]; }
    const st = Math.floor(got / tot * 3); if (st > 0) drawRocket(g, X + 40, Y + 60, st, 0); else R(g, '#c4cad8', X + 34, Y + 44, 12, 2);
    return;
  }
  if (lift > 0) { const cx = X + 40, fy = Y + 60 - lift; for (let i = 0; i < 4; i++) R(g, pick(['#ffd23f', '#f79a3a', '#ffffff']), cx - 3 + randi(0, 6), fy + i * 2, 2, 3); }
  drawRocket(g, X + 40, Y + 60, 3, lift);
};

/* ---------- photo mode ---------- */
ACTIONS.photo = () => {
  const [c, g] = mk(cvs.width * 2, cvs.height * 2); g.imageSmoothingEnabled = false; g.drawImage(cvs, 0, 0, c.width, c.height);
  c.toBlob(bl => { if (!bl) return; const a = document.createElement('a'); a.href = URL.createObjectURL(bl); a.download = `${G.name.replace(/[^\wÀ-ſ-]+/g, '_')}_rok${yearIdx()}_den${dayIdx() + 1}.png`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); });
  flashT = 0.18; Sound.click(); toast('Fotka osady uložena do Stažených souborů');
};
addEventListener('keydown', e => { if (!G || !started || /INPUT|TEXTAREA/.test(e.target.tagName) || UI.interior) return; if (e.key === 'p' || e.key === 'P') ACTIONS.photo(); });

/* ---------- help: controls & stars ---------- */
HELP.push({ id: 'ovladani', n: 'Ovládání', t: `<p><b>Myš:</b> levé tlačítko = vybrat / postavit, táhnutí = posun mapy, kolečko = zoom, pravé tlačítko = zrušit nástroj.</p>
<p><b>Dotyk:</b> klepnutí = vybrat, tažení jedním prstem = posun, dvěma prsty = zoom.</p>
<p><b>Klávesy:</b> WASD / šipky = posun · + / − = zoom · mezerník = pauza · 1 2 3 = rychlost · X = bourání · L = pozemky · P = fotka osady · Esc = zpět / menu.</p>
<p><b>V továrně:</b> R = otočit pás · Esc nebo pravé tlačítko = zrušit nástroj / odejít.</p>` },
{ id: 'hvezdy', n: 'Přání a hvězdičky', t: `<p>Každé ráno má Babička Ježková <b>tři přání</b> (záložka Zakázky nahoře). Za každé splněné dostaneš mince a <b>hvězdičku ★</b>, za všechna tři ještě jednu navíc.</p>
<p>Hvězdičky utratíš v Příručce → Kloboučky za vzácné kloboučky a plány ozdob (Zvonkohra, Hvězdná lampa, Zlatá kočičí socha).</p>
<p><b>Divoká zvířátka</b> občas přijdou na kraj osady — klikni na ně a něco ti přinesou. Ptačí budky je lákají. Vzácně přijde i <b>zatoulané koťátko</b> — když máš volný pelíšek, zůstane.</p>
<p><b>Sezónní ozdoby</b> (Sněhulák, Dýňová lucerna, Májka, Slunečník) dávají velkou útulnost ve své sezóně.</p>
<p>Po startu první rakety posílej <b>zásobovací rakety</b> na Vesmírnou stanici Mňau — každá = hodně mincí a 3 hvězdičky.</p>` });

/* ---------- more achievements ---------- */
ACH.push(
  ['kote', 'Koťátko!', () => (G.stats.kittens || 0) + (G.stats.strays || 0) >= 1],
  ['prani10', 'Babiččin miláček', () => (G.stats.wishes || 0) >= 10],
  ['hvezdy25', 'Hvězdná sbírka', () => (G.stats.starsTotal || 0) >= 25],
  ['zviratka', 'Kamarád zvířátek', () => (G.stats.wild || 0) >= 10],
  ['klobouky', 'Módní přehlídka', () => G.cats.filter(c => c.hat).length >= 5],
  ['stanice', 'Vesmírná stanice Mňau', () => (G.stats.supply || 0) >= 5]
);
