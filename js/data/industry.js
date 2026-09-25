'use strict';
/* ============ era 2: mining, metals, harbour ============ */
const ORE_ITEM = { uhli: 'uhli', zelezo: 'ruda_fe', med: 'ruda_cu', cin: 'ruda_sn', bauxit: 'bauxit', zlato: 'ruda_au' };
Object.assign(ITEMS, {
  uhli: { n: 'Uhlí', v: 4 },
  ruda_fe: { n: 'Železná ruda', v: 4 },
  ruda_cu: { n: 'Měděná ruda', v: 5 },
  ruda_sn: { n: 'Cínová ruda', v: 6 },
  bauxit: { n: 'Bauxit', v: 6 },
  ruda_au: { n: 'Zlatá ruda', v: 12 },
  zelezo: { n: 'Železo', v: 16 },
  medkov: { n: 'Měď', v: 18 },
  cin: { n: 'Cín', v: 20 },
  zlato: { n: 'Zlato', v: 60 },
  ocel: { n: 'Ocel', v: 40 },
  bronz: { n: 'Bronz', v: 45 },
  hrebiky: { n: 'Hřebíky', v: 9 },
  naradi: { n: 'Nářadí', v: 38 },
  sperky: { n: 'Šperky', v: 140 },
  ryby_more: { n: 'Mořské ryby', v: 8, food: 55 }
});
FOODS.splice(1, 0, 'ryby_more');
Object.assign(RECIPES, {
  zelezo: { in: { ruda_fe: 2, uhli: 1 }, out: 'zelezo', n: 1, t: 10 },
  medkov: { in: { ruda_cu: 2, uhli: 1 }, out: 'medkov', n: 1, t: 10 },
  cin: { in: { ruda_sn: 2, uhli: 1 }, out: 'cin', n: 1, t: 11 },
  zlato: { in: { ruda_au: 3, uhli: 1 }, out: 'zlato', n: 1, t: 14 },
  ocel: { in: { zelezo: 2, uhli: 1 }, out: 'ocel', n: 1, t: 12 },
  bronz: { in: { medkov: 3, cin: 1 }, out: 'bronz', n: 2, t: 12 },
  uhli: { in: { drevo: 3 }, out: 'uhli', n: 2, t: 10 },
  hrebiky: { in: { zelezo: 1 }, out: 'hrebiky', n: 4, t: 6 },
  naradi: { in: { zelezo: 1, prkna: 1 }, out: 'naradi', n: 1, t: 10 },
  sperky: { in: { zlato: 1, sklo: 1 }, out: 'sperky', n: 1, t: 14 }
});
DEFAULT_SELL.push('naradi', 'sperky');
function mineOre(x, y) {
  const cnt = {}; for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) { const o = tile(x + i, y + j).ore; if (ORE_ITEM[o]) cnt[o] = (cnt[o] || 0) + 1; }
  let best = null, bn = 0; for (const k in cnt) if (cnt[k] > bn) { bn = cnt[k]; best = k; }
  return best;
}
const SEA_NEAR = (x, y, w, h, r, pred) => { let n = 0; for (let j = y - r; j < y + h + r; j++) for (let i = x - r; i < x + w + r; i++) if (pred(tile(i, j))) n++; return n; };
Object.assign(B, {
  dul: {
    n: 'Důl', cat: 'vyroba', w: 2, h: 2, cost: 260, mat: { prkna: 10, kamen: 6 }, work: 14, workers: 1, era: 2, noise: 4, terr: ['rock', 'grass', 'sand'],
    need: (x, y) => !!mineOre(x, y), needTxt: 'Důl patří na ložisko rudy nebo uhlí (barevné kamínky ve skalách)',
    init: b => { b.ore = mineOre(b.x, b.y) || 'uhli'; },
    canWork: b => sumObj(b.out) < OUTCAP,
    produce: (b, amt) => { const it = ORE_ITEM[b.ore] || 'uhli'; b.p += amt / (it === 'ruda_au' ? 14 : it === 'uhli' ? 6 : 8); if (b.p >= 1) { b.p = 0; b.out[it] = (b.out[it] || 0) + 1; G.stats.made[it] = (G.stats.made[it] || 0) + 1; puff(b); } },
    status: b => b.workers.length ? [(b.working ? 'Těží: ' : 'Ložisko: ') + itemName(ORE_ITEM[b.ore] || 'uhli'), 'ok'] : null,
    desc: 'Těží rudu nebo uhlí z ložiska pod sebou. Postav ho na barevné kamínky ve skalách.'
  },
  uhlir: { n: 'Milíř', cat: 'vyroba', w: 2, h: 2, cost: 120, wood: 10, work: 8, workers: 1, recipes: ['uhli'], era: 2, noise: 2, chimney: [16, 6], darkSmoke: 1, smokeAlways: 1, desc: 'Pálí dřevo na dřevěné uhlí — když poblíž není uhelný důl.' },
  tavirna: { n: 'Tavírna', cat: 'vyroba', w: 2, h: 2, cost: 380, mat: { cihly: 16, kamen: 8 }, work: 16, workers: 1, recipes: ['zelezo', 'medkov', 'cin', 'zlato'], era: 2, noise: 4, chimney: [24, -6], darkSmoke: 1, windowLight: [16, 24, 16], industry: 1, desc: 'Taví rudu s uhlím na kovy.' },
  slevarna: { n: 'Slévárna', cat: 'vyroba', w: 2, h: 2, cost: 520, mat: { cihly: 14, kamen: 10, zelezo: 4 }, work: 18, workers: 1, recipes: ['ocel', 'bronz'], era: 2, noise: 4, chimney: [6, -4], darkSmoke: 1, windowLight: [20, 24, 14], industry: 1, desc: 'Slitiny: ocel ze železa a uhlí, bronz z mědi a cínu.' },
  kovarna: { n: 'Kovárna', cat: 'vyroba', w: 2, h: 2, cost: 300, mat: { cihly: 8, prkna: 6 }, work: 12, workers: 1, recipes: ['hrebiky', 'naradi', 'sperky'], era: 2, noise: 3, chimney: [24, -2], industry: 1, desc: 'Hřebíky, nářadí a šperky ze zlata.' },
  rybarna: {
    n: 'Rybárna', cat: 'priroda', w: 2, h: 2, cost: 240, mat: { prkna: 12 }, work: 12, workers: 1, era: 2, terr: ['sand', 'grass', 'rock'],
    need: (x, y) => SEA_NEAR(x, y, 2, 2, 1, t => t.bio === 'sea') >= 3, needTxt: 'Rybárna patří na mořský břeh',
    canWork: b => sumObj(b.out) < OUTCAP,
    produce: (b, amt) => { b.p += amt / 10 * (seasonIdx() === 3 ? 0.6 : 1); if (b.p >= 1) { b.p = 0; b.out.ryby_more = (b.out.ryby_more || 0) + 2; G.stats.made.ryby_more = (G.stats.made.ryby_more || 0) + 2; splash(b.x * TS + 16, b.y * TS + 30); } },
    desc: 'Rybářská loďka na moři — mořské ryby jsou vydatné jídlo (+55). Staví se na břeh moře.'
  },
  majak: {
    n: 'Maják', cat: 'priroda', w: 1, h: 1, cost: 280, mat: { kamen: 12, sklo: 4 }, work: 12, era: 2, light: 70, lightAt: [8, -12], cozy: 3, terr: ['sand', 'rock', 'grass'],
    need: (x, y) => SEA_NEAR(x, y, 1, 1, 2, t => t.bio === 'sea') >= 2, needTxt: 'Maják patří k moři', desc: 'Svítí lodím na cestu — lodě do přístavu připlouvají častěji. +3 útulnost.'
  },
  pristav: {
    n: 'Přístav', cat: 'vyroba', w: 3, h: 3, cost: 900, mat: { prkna: 30, kamen: 20, hrebiky: 10 }, work: 24, era: 2, unique: 1, flat: 1, terr: ['sand', 'grass', 'rock'],
    need: (x, y) => SEA_NEAR(x, y, 3, 3, 2, t => t.bio === 'sea') >= 5, needTxt: 'Přístav musí stát na mořském břehu',
    desc: 'Kotví tu obchodní lodě s exotickým zbožím a velkými zakázkami. Staví se na mořský břeh.'
  }
});
/* goods that come from the ground or the sea */
RAW_SOURCES.uhli = () => eraOf() >= 2;
const hasMine = it => BLIST.some(b => b.type === 'dul' && ORE_ITEM[b.ore] === it);
for (const it of ['ruda_fe', 'ruda_cu', 'ruda_sn', 'bauxit', 'ruda_au']) RAW_SOURCES[it] = () => hasMine(it) || (G.imported && G.imported[it]);
RAW_SOURCES.kamen = () => eraOf() >= 1;
RAW_SOURCES.hlina = () => eraOf() >= 1;
RAW_SOURCES.pisek = () => countB('piskovna') > 0;
RAW_SOURCES.ryby_more = () => countB('rybarna') > 0;
RAW_SOURCES.kakao = RAW_SOURCES.koreni = () => !!(G.imported && (G.imported.kakao || G.imported.koreni));
RAW_SOURCES.vlna = () => eraOf() >= 1;

/* city guilds: order clients of the later eras */
const CLIENTS = {
  stavitele: { n: 'Cech stavitelů', sp: 'jezevec', era: 1, wants: { prkna: 4, cihly: 4, kamen: 3, sklo: 2, hrebiky: 2 } },
  hutnici: { n: 'Hutní cech', sp: 'bobr', era: 2, wants: { zelezo: 4, medkov: 3, ocel: 4, bronz: 3, naradi: 3, uhli: 2 } },
  kapitan: { n: 'Kapitán Vydřička', sp: 'vydra', era: 2, big: 1, need: () => countB('pristav') > 0, wants: { ryby_more: 3, sklo: 3, latka: 3, naradi: 3, sperky: 2, cokoladovy_dort: 2, most: 2, dzem: 2 } }
};
