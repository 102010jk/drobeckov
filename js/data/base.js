'use strict';
/* ============ seasons ============ */
const SEASONS = [
  { key: 'jaro', name: 'Jaro', grass: ['#62b252', '#8ad06a', '#4c9444'], flowers: ['#ff9ec0', '#ffffff', '#ffd23f', '#b89ae8'],
    trees: [['#f7a8c4', '#fdd6e4'], ['#7cc86a', '#a8e08a'], ['#6cbc5e', '#94d676']], birch: ['#a8e08a', '#d4f4a8'], pine: '#3f7a4a', amb: 'petals', rain: 0.3, music: 2, sprite: 'tulip' },
  { key: 'leto', name: 'Léto', grass: ['#4f9e42', '#74c25a', '#3c8236'], flowers: ['#ffd23f', '#ffffff', '#e8484e', '#6ab4f0'],
    trees: [['#2f7a3a', '#4a9a48'], ['#3a8a40', '#5aaa52'], ['#27693a', '#3f8a44']], birch: ['#6cbc5e', '#94d676'], pine: '#2a6a3a', amb: 'motes', rain: 0.15, music: 3, sprite: 'sun' },
  { key: 'podzim', name: 'Podzim', grass: ['#9a9a48', '#c0b458', '#7a7836'], flowers: ['#e8843a', '#d65a31', '#f2b441'],
    trees: [['#e8843a', '#f6a55a'], ['#d65a31', '#ea7a4a'], ['#f2b441', '#f8d070'], ['#c8482e', '#e0643e']], birch: ['#f2c441', '#f8e070'], pine: '#4a5a3a', amb: 'leaves', rain: 0.35, music: 0, sprite: 'acorn' },
  { key: 'zima', name: 'Zima', grass: ['#e4ebf6', '#ffffff', '#c4d0e6'], flowers: null,
    trees: [['#e8eef8', '#ffffff']], birch: ['#e8eef8', '#ffffff'], pine: '#2e5a52', amb: 'snow', rain: 0, music: 1, sprite: 'snow' }
];
/* ground tint per biome: [spring/summer/autumn modifier handled in terrain] */
const BIOMES = {
  meadow: { n: 'Louka', price: 1 },
  forest: { n: 'Les', price: 1.1 },
  birch: { n: 'Březový háj', price: 1.1 },
  wetland: { n: 'Mokřad', price: 0.9 },
  beach: { n: 'Pláž', price: 1.2 },
  sea: { n: 'Moře', price: 0.7 },
  lake: { n: 'Jezero', price: 0.9 },
  river: { n: 'Řeka', price: 1 },
  hills: { n: 'Kopce', price: 1.3 },
  mountain: { n: 'Hory', price: 1.6 }
};

/* ============ items ============ */
const ITEMS = {
  psenice: { n: 'Pšenice', v: 2, food: 12 },
  mrkev: { n: 'Mrkev', v: 3, food: 22 },
  jahody: { n: 'Jahody', v: 4, food: 18 },
  dyne: { n: 'Dýně', v: 9, food: 28 },
  jablka: { n: 'Jablka', v: 4, food: 22 },
  ryby: { n: 'Ryby', v: 5, food: 40 },
  mleko: { n: 'Mléko', v: 4, food: 25 },
  med: { n: 'Med', v: 7 },
  drevo: { n: 'Dřevo', v: 2 },
  mouka: { n: 'Mouka', v: 6 },
  chleb: { n: 'Chléb', v: 12, food: 45 },
  pernik: { n: 'Perník', v: 22 },
  strudl: { n: 'Štrúdl', v: 24 },
  dynovy_kolac: { n: 'Dýňový koláč', v: 32 },
  dzem: { n: 'Džem', v: 18 },
  most: { n: 'Mošt', v: 17 },
  susenky: { n: 'Rybí sušenky', v: 6, food: 45 },
  polevka: { n: 'Polévka', v: 26 },
  jahodovy_dort: { n: 'Jahodový dort', v: 58 },
  mrkvovy_dort: { n: 'Mrkvový dort', v: 46 }
};
const FOODS = ['konzervy', 'susenky', 'ryby', 'chleb', 'mleko'];
const RAW_EAT = ['jablka', 'mrkev', 'dyne', 'jahody', 'psenice'];   // emergency snacks when there is no real food
const DEFAULT_SELL = ['chleb', 'pernik', 'strudl', 'dynovy_kolac', 'dzem', 'most', 'polevka', 'jahodovy_dort', 'mrkvovy_dort'];

/* ============ recipes ============ */
const RECIPES = {
  mouka: { in: { psenice: 2 }, out: 'mouka', n: 1, t: 6 },
  mleko: { in: { psenice: 1 }, out: 'mleko', n: 2, t: 9 },
  chleb: { in: { mouka: 1 }, out: 'chleb', n: 1, t: 7 },
  pernik: { in: { mouka: 1, med: 1 }, out: 'pernik', n: 1, t: 10, lock: ['med', 2] },
  strudl: { in: { mouka: 1, jablka: 2 }, out: 'strudl', n: 1, t: 10, lock: ['jez', 6] },
  dynovy_kolac: { in: { dyne: 1, mouka: 1, mleko: 1 }, out: 'dynovy_kolac', n: 1, t: 12, lock: ['jez', 2] },
  dzem: { in: { jahody: 3 }, out: 'dzem', n: 1, t: 9 },
  most: { in: { jablka: 3 }, out: 'most', n: 1, t: 9, lock: ['med', 5] },
  susenky: { in: { ryby: 1, mouka: 1 }, out: 'susenky', n: 3, t: 8 },
  polevka: { in: { dyne: 1, mrkev: 1, mleko: 1 }, out: 'polevka', n: 1, t: 10 },
  jahodovy_dort: { in: { dzem: 1, mouka: 2, mleko: 1 }, out: 'jahodovy_dort', n: 1, t: 16, lock: ['jez', 4] },
  mrkvovy_dort: { in: { mrkev: 2, mouka: 1, med: 1, mleko: 1 }, out: 'mrkvovy_dort', n: 1, t: 15, lock: ['med', 5] }
};

/* ============ crops ============ seasons: jaro, léto, podzim, zima */
const CROPS = {
  psenice: { n: 'Pšenice', s: [1, 1, 1, 0], grow: 30, yield: 8 },
  mrkev: { n: 'Mrkev', s: [1, 0, 1, 0], grow: 30, yield: 6 },
  jahody: { n: 'Jahody', s: [1, 1, 0, 0], grow: 40, yield: 6, lock: ['zaj', 1] },
  dyne: { n: 'Dýně', s: [0, 1, 1, 0], grow: 50, yield: 4, lock: ['zaj', 1] }
};
const FARM_WORK = 2.5;
const RAW_SOURCES = {};
const TECH = {};
const hasTech = k => !!(typeof G !== 'undefined' && G && G.tech && G.tech[k]);
const PROFS = { vedec: { n: 'Vědec' }, inzenyr: { n: 'Inženýr' }, astronaut: { n: 'Astronaut' } };   // item -> () => boolean: can the player obtain this raw good?

/* ============ buildings ============
   terr: allowed ground ('grass' default set = grass/sand/rock), fields only on grass.
   mat: extra building materials delivered by cats (besides wood) */
const LAND = ['grass', 'sand', 'rock'];
const BCATS = [['vyroba', 'Výroba'], ['priroda', 'Příroda'], ['domov', 'Domov'], ['ozdoby', 'Ozdoby'], ['cesty', 'Cesty']];
const B = {
  mlyn: { n: 'Mlýn', cat: 'vyroba', w: 2, h: 2, cost: 80, wood: 8, work: 8, workers: 1, recipes: ['mouka'], desc: 'Mele pšenici na mouku.' },
  pekarna: { n: 'Pekárna', cat: 'vyroba', w: 2, h: 2, cost: 150, wood: 12, work: 12, workers: 2, recipes: ['chleb', 'pernik', 'strudl', 'dynovy_kolac'], chimney: [24, -3], desc: 'Peče chléb a další dobroty. Recept vybereš.' },
  kravin: { n: 'Kravín', cat: 'vyroba', w: 2, h: 2, cost: 120, wood: 10, work: 10, workers: 1, recipes: ['mleko'], lock: ['jez', 1], desc: 'Kravička Běla dává mléko, když dostane pšenici.' },
  zavarovna: { n: 'Zavařovna', cat: 'vyroba', w: 2, h: 2, cost: 180, wood: 10, work: 10, workers: 1, recipes: ['dzem', 'most'], chimney: [22, 2], lock: ['zaj', 2], desc: 'Džemy a mošty — vydrží celou zimu.' },
  kuchynka: { n: 'Kuchyňka', cat: 'vyroba', w: 2, h: 2, cost: 200, wood: 12, work: 12, workers: 1, recipes: ['susenky', 'polevka'], chimney: [23, -2], lock: ['zaj', 4], desc: 'Rybí sušenky pro kočky a hřejivá polévka.' },
  cukrarna: { n: 'Cukrárna', cat: 'vyroba', w: 2, h: 2, cost: 400, wood: 16, work: 16, workers: 2, recipes: ['jahodovy_dort', 'mrkvovy_dort'], lock: ['jez', 4], desc: 'Dorty — nejdražší zboží v údolí.' },
  drevorubec: { n: 'Dřevorubecká chata', cat: 'vyroba', w: 2, h: 2, cost: 40, wood: 0, work: 6, workers: 1, chop: 6, chimney: [7, 0], desc: 'Kácí dospělé stromy v okruhu 6. Pařezy znovu dorostou. Jediný zdroj dřeva.' },
  trziste: { n: 'Tržní stánek', cat: 'vyroba', w: 2, h: 1, cost: 60, wood: 6, work: 6, workers: 1, market: 1, desc: 'Prodavačka prodává zboží označené ve skladu zvířátkům z okolí.' },
  pole: { n: 'Políčko', cat: 'priroda', w: 2, h: 2, cost: 20, wood: 2, work: 4, field: 1, terr: ['grass'], desc: 'Kočky sázejí a sklízejí. Plodinu vybereš. Jen na trávě.' },
  sklenik: { n: 'Skleník', cat: 'priroda', w: 2, h: 2, cost: 300, wood: 12, work: 12, field: 1, glass: 1, lock: ['zaj', 6], desc: 'Políčko pod sklem — roste i v zimě, jen pomaleji.' },
  molo: { n: 'Rybářské molo', cat: 'priroda', w: 1, h: 1, cost: 50, wood: 5, work: 5, workers: 1, water: 1, fish: 9, desc: 'Staví se na mělkou vodu u břehu (řeka, jezero, moře). Rybář chytá ryby.' },
  vcelin: { n: 'Včelín', cat: 'priroda', w: 1, h: 1, cost: 60, wood: 4, work: 4, bees: 1, lock: ['med', 1], desc: 'Med sám od sebe. Květiny v okruhu 3 ho zrychlí. V zimě spí.' },
  jablon: { n: 'Jabloň', cat: 'priroda', w: 1, h: 1, cost: 40, wood: 0, instant: 1, orchard: 1, cozy: 1, nodoor: 1, lock: ['med', 3], desc: 'Za 1,5 dne vyroste. V létě a na podzim plodí jablka.' },
  stromek: { n: 'Stromek', cat: 'priroda', w: 1, h: 1, cost: 5, wood: 0, instant: 1, tree: 1, desc: 'Vyroste za 2 dny. +1 útulnost, dřevo pro dřevorubce.' },
  domek: { n: 'Kočičí domek', cat: 'domov', w: 2, h: 2, cost: 70, wood: 8, work: 8, beds: 2, cozy: 1, desc: 'Pelíšky pro 2 kočky. Bez domova se špatně spí.' },
  spizirna: { n: 'Spižírna', cat: 'domov', w: 2, h: 2, cost: 60, wood: 8, work: 8, store: 60, desc: 'Společný sklad (+60 místa). Kočky si tu berou jídlo.' },
  nastenka: { n: 'Nástěnka', cat: 'domov', w: 1, h: 1, cost: 0, fixed: 1, board: 1, desc: 'Zakázky od sousedů.' },
  kvetiny: { n: 'Záhon květin', cat: 'ozdoby', w: 1, h: 1, cost: 8, instant: 1, cozy: 1, flower: 1, nodoor: 1, weak: 1, desc: '+1 útulnost. Včely je milují. Stavby ho samy odstraní.' },
  plot: { n: 'Plůtek', cat: 'ozdoby', w: 1, h: 1, cost: 3, instant: 1, cozy: 0.5, nodoor: 1, desc: 'Napojuje se na sousední plůtky.' },
  lucerna: { n: 'Lucerna', cat: 'ozdoby', w: 1, h: 1, cost: 20, wood: 1, instant: 1, cozy: 2, light: 34, nodoor: 1, lock: ['sova', 1], desc: 'Svítí v noci. +2 útulnost.' },
  lavicka: { n: 'Lavička', cat: 'ozdoby', w: 1, h: 1, cost: 25, wood: 3, instant: 1, cozy: 2, rest: 1, lock: ['sova', 2], desc: 'Kočky si tu odpočinou. +2 útulnost.' },
  skrabadlo: { n: 'Škrabadlo', cat: 'ozdoby', w: 1, h: 1, cost: 60, wood: 4, instant: 1, cozy: 3, play: 1, lock: ['sova', 3], desc: 'Hraní zvedá náladu. +3 útulnost.' },
  socha: { n: 'Kočičí socha', cat: 'ozdoby', w: 1, h: 1, cost: 200, instant: 1, cozy: 6, nodoor: 1, lock: ['lis', 5], desc: '+6 útulnost.' },
  fontana: { n: 'Fontána', cat: 'ozdoby', w: 2, h: 2, cost: 350, instant: 1, cozy: 8, nodoor: 1, lock: ['sova', 5], desc: '+8 útulnost.' },
  vanocni: { n: 'Vánoční stromek', cat: 'ozdoby', w: 1, h: 1, cost: 0, instant: 1, cozy: 10, nodoor: 1, light: 24, flag: 'vanocni', desc: 'Dárek z Vánočního trhu. +10 útulnost.' },
  cesta: { n: 'Cesta', cat: 'cesty', w: 1, h: 1, cost: 1, ground: 'path', desc: 'Kočky po ní chodí 2× rychleji. Táhni myší.' },
  lavka: { n: 'Lávka', cat: 'cesty', w: 1, h: 1, cost: 15, wood: 2, ground: 'bridge', desc: 'Most přes mělkou vodu.' },
  zbourat: { n: 'Zbourat', cat: 'cesty', tool: 1, desc: 'Vrátí polovinu ceny. Stromy a keře zmizí bez užitku.' }
};
const OUTCAP = 6;

/* ============ neighbours ============ */
const NEIGH = {
  jez: { n: 'Babička Ježková', sp: 'jezek', prefs: { chleb: 6, mouka: 3, psenice: 1, pernik: 4, strudl: 4, dynovy_kolac: 4, jahodovy_dort: 3 } },
  zaj: { n: 'Zajíc Ušák', sp: 'zajic', prefs: { mrkev: 6, psenice: 2, jahody: 4, dyne: 3, polevka: 4, dzem: 3, mrkvovy_dort: 3 } },
  med: { n: 'Medvěd Brumla', sp: 'medved', prefs: { chleb: 2, psenice: 2, med: 6, dzem: 4, pernik: 4, jablka: 3, most: 3 } },
  sova: { n: 'Sova Hůhů', sp: 'sova', prefs: { chleb: 3, mrkev: 2, ryby: 4, polevka: 5, most: 4, strudl: 3 } },
  lis: { n: 'Liška Zrzka', sp: 'liska', prefs: { chleb: 2, mouka: 2, ryby: 3, med: 3, dzem: 3, dynovy_kolac: 3, jahodovy_dort: 4, mrkvovy_dort: 4 } }
};
const HEART_XP = [0, 1, 3, 6, 10, 15, 21, 28, 36, 45, 55];
const XLOCK = { kosiky: ['lis', 1], ceny: ['lis', 3] };
const XNAMES = { kosiky: 'Košíky (kočky unesou o 2 víc)', ceny: 'Stánek prodává o 25 % dráž' };

/* ============ land ============ */
const START_PW = 4, START_PH = 3;      // starting parcels
const PARCEL_BASE = 80;

/* ============ festivals ============ */
const FEST = [
  { n: 'Jarní slavnost', need: { chleb: 8, mrkev: 12 }, coins: 300, first: ['parcel', 2], firstTxt: '2 pozemky zdarma' },
  { n: 'Letní pouť', need: { jahody: 10, dzem: 4, mleko: 6 }, coins: 500, first: ['cat', 5], firstTxt: 'zlatá kočka Zlatíčko' },
  { n: 'Dožínky', need: { mouka: 16, dyne: 8, dynovy_kolac: 3 }, coins: 800, first: ['parcel', 3], firstTxt: '3 pozemky zdarma' },
  { n: 'Vánoční trh', need: { pernik: 6, polevka: 4, chleb: 10 }, coins: 1000, first: ['flag', 'vanocni'], firstTxt: 'Vánoční stromek' }
];

/* ============ cats ============ */
const TRAITS = {
  rychla: { n: 'Rychlotlapka', d: 'chodí o 30 % rychleji' },
  pekar: { n: 'Pekař', d: '+40 % v pekárně, kuchyňce a cukrárně' },
  zahradnik: { n: 'Zahradník', d: '+50 % na políčkách a v kravíně' },
  silak: { n: 'Silák', d: 'unese o 1 věc víc' },
  mazel: { n: 'Mazel', d: 'pohlazení ho potěší dvojnásob' },
  spac: { n: 'Spáč', d: 'rychleji se unaví, ale je v pohodě (+8 nálada)' },
  mlsoun: { n: 'Mlsoun', d: 'víc jí, ze sušenek má velkou radost' },
  rybar: { n: 'Rybář', d: '+60 % na molu' },
  drevar: { n: 'Dřevař', d: '+50 % při kácení a stavění' }
};
const EYE_DARK = ['#ffffff', '#2b1b2b', '#2b1b2b', '#2b1b2b'];
const SKINS = [
  { name: 'zrzavá', f: '#f4a04c', s: '#d9782e', l: '#ffe6c8', o: '#3a2230', p: '#f5a3b5', n: '#e8708a', eye: EYE_DARK },
  { name: 'mourovatá', f: '#aab0c0', s: '#6e7488', l: '#eef0f5', o: '#2b2a38', p: '#f5a3b5', n: '#e07a92', eye: EYE_DARK },
  { name: 'černá', f: '#3e3852', s: '#2c273c', l: '#5e5776', o: '#130f1a', p: '#d4839a', n: '#c4647e', eye: ['#fff6b0', '#ffd23f', '#ffd23f', '#130f1a'] },
  { name: 'bílá', f: '#f6f1ec', s: '#e0d6ce', l: '#ffffff', o: '#3a2a38', p: '#f7a8bc', n: '#e8809a', eye: ['#ffffff', '#4a90e0', '#4a90e0', '#1b2b4a'] },
  { name: 'levandulová', f: '#b996ec', s: '#8e68cc', l: '#ecdcff', o: '#2e1f40', p: '#ffb0d0', n: '#e878a8', eye: EYE_DARK },
  { name: 'zlatá', f: '#ffd24a', s: '#eaa22c', l: '#fff4c8', o: '#4a2a1a', p: '#ffa8a0', n: '#ee7a6a', eye: EYE_DARK, sparkle: true },
  { name: 'krémová', f: '#f0d8a8', s: '#d8b078', l: '#fff4e0', o: '#4a3020', p: '#f5a3b5', n: '#e8708a', eye: EYE_DARK },
  { name: 'čokoládová', f: '#8a5a3a', s: '#6b4128', l: '#c8a080', o: '#2a1810', p: '#e89aa8', n: '#d4707e', eye: ['#fff6b0', '#9ad04a', '#9ad04a', '#2a1810'] },
  { name: 'frakovaná', f: '#34303e', s: '#34303e', l: '#f6f1ec', o: '#130f1a', p: '#f5a3b5', n: '#e8708a', eye: ['#ffffff', '#7ad0a0', '#7ad0a0', '#130f1a'] }
];
const CAT_NAMES = ['Micka', 'Mourek', 'Fousek', 'Tlapka', 'Bublina', 'Sušenka', 'Pepř', 'Škvorek', 'Kulička', 'Žabka', 'Drobek', 'Bonifác', 'Líza', 'Matylda',
  'Oříšek', 'Čiperka', 'Kokos', 'Rozárka', 'Knedlík', 'Mňauka', 'Piškot', 'Vločka', 'Karamel', 'Julinka', 'Brouček', 'Makový', 'Pampeliška', 'Hvězdička',
  'Bobík', 'Cecilka', 'Dráček', 'Eliška', 'Frodo', 'Grácie', 'Hopsa', 'Ivánek', 'Jahůdka', 'Kvído', 'Lentilka', 'Motýlek', 'Nugeta', 'Ořech', 'Perla', 'Rarášek', 'Sněženka', 'Toník', 'Uzlík', 'Višňa', 'Zrníčko'];
