'use strict';
/* ============ 3.4: more food — eggs, cheese, tomatoes, pizza, pancakes ============ */
Object.assign(ITEMS, {
  vejce: { n: 'Vejce', v: 4 },
  syr: { n: 'Sýr', v: 14, food: 35 },
  rajcata: { n: 'Rajčata', v: 5, food: 16 },
  pizza: { n: 'Pizza', v: 48, food: 70 },
  palacinky: { n: 'Palačinky', v: 30, food: 55 }
});
addSprites({
  vejce: ['.hh.', 'hhhh', 'hhhc', 'hhcc', '.cc.'],
  syr: ['....yy', '..yyyY', 'yyyyYY', 'yYyyyY', 'yyyYyY', 'YYYYYY'],
  rajcata: ['..G..', '.rGr.', 'rrrrr', 'rhrrr', 'rrrrR', '.RRR.'],
  pizza: ['..yyy..', '.yryry.', 'yrygryy', 'yyryyry', 'yrygyry', '.yyryy.', '..yyy..'],
  palacinky: ['.ttttt.', 'tcrcrct', 'tcccccT', '.TTTTT.', '.ccccc.', 'CCCCCCC']
});
FOODS.push('syr', 'palacinky', 'pizza');
RAW_EAT.push('rajcata');
Object.assign(CROPS, { rajcata: { n: 'Rajčata', s: [0, 1, 1, 0], grow: 42, yield: 6, seed: 1 } });
EXP_SEEDS.push('rajcata');
Object.assign(RECIPES, {
  vejce: { in: { psenice: 1 }, out: 'vejce', n: 2, t: 8 },
  syr: { in: { mleko: 3 }, out: 'syr', n: 1, t: 12 },
  pizza: { in: { mouka: 2, syr: 1, rajcata: 2 }, out: 'pizza', n: 1, t: 14 },
  palacinky: { in: { mouka: 1, mleko: 1, vejce: 2, dzem: 1 }, out: 'palacinky', n: 2, t: 12 }
});
B.kuchynka.recipes.push('palacinky');
Object.assign(B, {
  slepicarna: { n: 'Slepičárna', cat: 'vyroba', w: 2, h: 2, cost: 110, wood: 10, work: 9, workers: 1, recipes: ['vejce'], desc: 'Slepičky za pšenici snáší vejce.' },
  syrarna: { n: 'Sýrárna', cat: 'vyroba', w: 2, h: 2, cost: 240, wood: 12, work: 12, workers: 1, recipes: ['syr'], era: 1, desc: 'Z mléka dělá sýr — dobré jídlo i zboží.' },
  pizzerie: { n: 'Pizzerie', cat: 'vyroba', w: 2, h: 2, cost: 420, wood: 10, mat: { cihly: 10, prkna: 6 }, work: 16, workers: 2, recipes: ['pizza'], era: 1, needSeed: 'rajcata', chimney: [24, -4], desc: 'Pizza z mouky, sýra a rajčat. Nejsytější jídlo a hit u obchodníků.' }
});
NEIGH.zaj.prefs.vejce = 3; NEIGH.jez.prefs.palacinky = 4; NEIGH.med.prefs.syr = 4; NEIGH.lis.prefs.pizza = 3; NEIGH.sova.prefs.syr = 2;
DEFAULT_SELL.push('pizza', 'palacinky');
if (typeof SPECS !== 'undefined' && SPECS.kuchar) Object.assign(SPECS.kuchar.wants, { pizza: 3, syr: 2, palacinky: 2 });
if (typeof SEASON_DEMAND !== 'undefined') Object.assign(SEASON_DEMAND, { palacinky: [1.3, 1, 1, 1.2], pizza: [1, 1.2, 1, 1.1] });

const _drawCropF = drawCrop;
drawCrop = function (g, crop, st, gr, px, py, S) {
  if (st === 2 && crop === 'rajcata') { R(g, '#3a8a44', px, py - 7, 1, 7); R(g, '#72c850', px - 2, py - 5, 2, 1); R(g, '#72c850', px + 1, py - 3, 2, 1); odisc(g, px - 1, py - 3, 1, '#e8484e'); odisc(g, px + 2, py - 6, 1, '#e8484e'); return; }
  return _drawCropF(g, crop, st, gr, px, py, S);
};
Object.assign(DRAW, {
  slepicarna(g, X, Y, b, S) {
    shape(g, [[X + 16, Y + 8, 14, 13, '#f0d8a0']]); hipRoof(g, X + 14, Y + 3, 18, 7, '#c8503e', '#e8705a', '#8a3a2a', S === 3);
    R(g, OUT, X + 21, Y + 14, 4, 7); shape(g, [[X + 18, Y + 18, 10, 1, '#a8693e']]);
    R(g, '#e8b27a', X + 1, Y + 20, 30, 1); R(g, '#e8b27a', X + 1, Y + 27, 30, 1);
    for (let i = 0; i < 6; i++) shape(g, [[X + 1 + i * 6, Y + 18, 1, 13, '#d8955a']]);
    for (const [a, c] of [[4, 29], [8, 30], [12, 29]]) R(g, '#fff3dc', X + a, Y + c, 2, 1);
  },
  syrarna(g, X, Y, b, S, night) {
    shape(g, [[X + 3, Y + 12, 26, 19, '#f8f0d0']]); R(g, '#e0d4a8', X + 26, Y + 12, 3, 19);
    hipRoof(g, X, Y + 2, 32, 11, '#e8962a', '#ffd23f', '#b8741a', S === 3);
    door(g, X + 6, Y + 21, 6, 10); winGlass(g, X + 16, Y + 17, 8, 5, night, true);
    shape(g, [[X + 17, Y + 25, 10, 5, '#ffd23f']]); R(g, '#e8962a', X + 19, Y + 26, 2, 2); R(g, '#e8962a', X + 23, Y + 27, 1, 1);
  },
  pizzerie(g, X, Y, b, S, night) {
    shape(g, [[X + 3, Y + 12, 26, 19, '#e8e0d8']]); R(g, '#c8beb4', X + 26, Y + 12, 3, 19);
    hipRoof(g, X, Y + 2, 32, 11, '#3a8a44', '#72c850', '#2a6a34', S === 3);
    awning(g, X + 3, Y + 13, 26, '#e8484e', '#ffffff');
    door(g, X + 13, Y + 21, 6, 10); winGlass(g, X + 4, Y + 20, 7, 6, night, true); winGlass(g, X + 21, Y + 20, 6, 6, night, true);
    odisc(g, X + 16, Y + 8, 3, '#ffd23f'); R(g, '#e8484e', X + 15, Y + 7, 1, 1); R(g, '#e8484e', X + 17, Y + 9, 1, 1);
  }
});
Object.assign(ANIM, {
  slepicarna(g, X, Y, b, t) {
    for (let i = 0; i < 3; i++) {
      const hx = Math.round(X + 4 + i * 7 + Math.sin(t * 0.9 + i * 2) * 3), hy = Y + 22 + (i % 2) * 3, peck = Math.floor(t * 3 + i) % 4 === 0 ? 1 : 0;
      shape(g, [[hx, hy, 5, 4, '#ffffff']]); R(g, '#e8484e', hx + 3, hy - 1 + peck, 2, 1); R(g, '#f79a3a', hx + 5, hy + 1 + peck, 1, 1);
    }
  }
});
Object.assign(LIT, { syrarna: 1, pizzerie: 1 });
for (const [k, v] of [['slepicarna', 4], ['syrarna', 6], ['pizzerie', 6]]) B[k].top = v;
ACH.push(['pizza', 'Pizzaiolo', () => (G.stats.made.pizza || 0) >= 10]);
{ const p = HELP.find(x => x.id === 'vypravy'); if (p) p.t += `<p><b>Rajčata</b> (třetí semínko z výprav) + mouka + sýr → <b>Pizzerie</b> → pizza, nejsytější jídlo. Sýr dělá <b>Sýrárna</b> z mléka, vejce snáší slepičky ve <b>Slepičárně</b> a Kuchyňka z nich umí <b>palačinky</b>.</p>`; }
