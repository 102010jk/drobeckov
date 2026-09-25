'use strict';
/* ============ era 1: crafts & trade ============ */
const ERAS = [
  { n: 'Farma', d: 'Chléb, džemy a první kočky.' },
  { n: 'Řemesla a obchod', d: 'Prkna, cihly, sklo, látky, tržní náměstí a obchodníci z daleka.', ok: () => G.stats.earned >= 1200 || G.cats.length >= 5 || G.stats.fests >= 1, hint: 'vydělej 1 200 mincí, měj 5 koček nebo splň slavnost' },
  { n: 'Hornictví a přístav', d: 'Doly, tavírny, slitiny, přístav a lodě.', ok: () => G.stats.earned >= 4500 && (G.stats.made.cihly || 0) >= 20, hint: 'vydělej 4 500 mincí a vyrob 20 cihel' },
  { n: 'Průmysl', d: 'Továrny s pásy a stroji uvnitř.', ok: () => (G.stats.made.ocel || 0) >= 15 && G.cats.length >= 10, hint: 'vyrob 15 oceli a měj 10 koček' },
  { n: 'Věda a vesmír', d: 'Škola, vědci, elektřina a nakonec raketa.', ok: () => (G.stats.made.plech || 0) >= 20 && G.stats.earned >= 28000, hint: 'vyrob 20 plechů a vydělej 28 000 mincí' }
];
const eraOf = () => (G ? G.era || 0 : 0);
Object.assign(ITEMS, {
  prkna: { n: 'Prkna', v: 5 },
  kamen: { n: 'Kámen', v: 3 },
  hlina: { n: 'Hlína', v: 2 },
  cihly: { n: 'Cihly', v: 8 },
  papir: { n: 'Papír', v: 7 },
  pisek: { n: 'Písek', v: 2 },
  sklo: { n: 'Sklo', v: 11 },
  vlna: { n: 'Vlna', v: 5 },
  latka: { n: 'Látka', v: 13 },
  polstar: { n: 'Polštář', v: 30 },
  kakao: { n: 'Kakao', v: 14 },
  koreni: { n: 'Koření', v: 16 },
  cokoladovy_dort: { n: 'Čokoládový dort', v: 75 },
  koreneny_pernik: { n: 'Kořeněný perník', v: 34 }
});
DEFAULT_SELL.push('cokoladovy_dort', 'koreneny_pernik');
Object.assign(RECIPES, {
  prkna: { in: { drevo: 1 }, out: 'prkna', n: 1, t: 5 },
  cihly: { in: { hlina: 2, drevo: 1 }, out: 'cihly', n: 2, t: 9 },
  papir: { in: { drevo: 2 }, out: 'papir', n: 2, t: 8 },
  sklo: { in: { pisek: 2, drevo: 1 }, out: 'sklo', n: 1, t: 10 },
  vlna: { in: { psenice: 1 }, out: 'vlna', n: 2, t: 10 },
  latka: { in: { vlna: 2 }, out: 'latka', n: 1, t: 9 },
  polstar: { in: { latka: 2 }, out: 'polstar', n: 1, t: 10 },
  cokoladovy_dort: { in: { kakao: 1, mouka: 2, mleko: 1 }, out: 'cokoladovy_dort', n: 1, t: 16 },
  koreneny_pernik: { in: { mouka: 1, med: 1, koreni: 1 }, out: 'koreneny_pernik', n: 1, t: 11 }
});
B.pekarna.recipes.push('koreneny_pernik');
B.cukrarna.recipes.push('cokoladovy_dort');
const ORE_TILES = (x, y, w, h, pred) => { let n = 0; for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (pred(tile(x + i, y + j))) n++; return n; };
/* extraction building: produces an item from the ground while a cat works there */
function extractor(item, t, pred, minTiles) {
  return {
    need: (x, y) => ORE_TILES(x, y, 2, 2, pred) >= minTiles,
    canWork: b => sumObj(b.out) < OUTCAP,
    produce: (b, amt) => { b.p += amt / t; if (b.p >= 1) { b.p = 0; b.out[item] = (b.out[item] || 0) + 1; G.stats.made[item] = (G.stats.made[item] || 0) + 1; puff(b); } }
  };
}
Object.assign(B, {
  pila: { n: 'Pila', cat: 'vyroba', w: 2, h: 2, cost: 120, wood: 10, work: 10, workers: 1, recipes: ['prkna'], era: 1, noise: 3, desc: 'Řeže dřevo na prkna — lepší stavební materiál.' },
  lom: Object.assign({ n: 'Kamenolom', cat: 'vyroba', w: 2, h: 2, cost: 100, wood: 8, work: 8, workers: 1, era: 1, noise: 4, terr: ['rock', 'grass', 'sand'], terrTxt: 'aspoň 2 skalní dlaždice', needTxt: 'Kamenolom potřebuje aspoň 2 dlaždice skály', desc: 'Láme kámen ze skal. Staví se na skalách v kopcích.' }, extractor('kamen', 7, t => t.gr === 'rock', 2)),
  hliniste: Object.assign({ n: 'Hliniště', cat: 'vyroba', w: 2, h: 2, cost: 60, wood: 6, work: 6, workers: 1, era: 1, noise: 1, needTxt: 'Hliniště patří na ložisko hlíny (hnědé skvrny u vody)', desc: 'Kope hlínu z ložiska — hledej hnědé skvrny poblíž vody a v mokřadech.' }, extractor('hlina', 6, t => t.ore === 'hlina', 1)),
  piskovna: Object.assign({ n: 'Pískovna', cat: 'vyroba', w: 2, h: 2, cost: 60, wood: 6, work: 6, workers: 1, era: 1, noise: 1, terr: ['sand', 'grass'], needTxt: 'Pískovna patří na pláž (aspoň 2 dlaždice písku)', desc: 'Těží písek na pláži.' }, extractor('pisek', 6, t => t.gr === 'sand', 2)),
  cihelna: { n: 'Cihelna', cat: 'vyroba', w: 2, h: 2, cost: 220, wood: 14, work: 12, workers: 1, recipes: ['cihly'], era: 1, noise: 3, chimney: [25, -4], darkSmoke: 1, desc: 'Pálí cihly z hlíny. Topí se dřevem.' },
  papirna: { n: 'Papírna', cat: 'vyroba', w: 2, h: 2, cost: 200, wood: 10, mat: { prkna: 6 }, work: 12, workers: 1, recipes: ['papir'], era: 1, noise: 2, desc: 'Vyrábí papír — bude potřeba pro vědu.' },
  sklarna: { n: 'Sklárna', cat: 'vyroba', w: 2, h: 2, cost: 260, mat: { prkna: 8, cihly: 8 }, work: 14, workers: 1, recipes: ['sklo'], era: 1, noise: 2, chimney: [7, -3], windowLight: [22, 22, 14], desc: 'Taví písek na sklo.' },
  ovcin: { n: 'Ovčín', cat: 'priroda', w: 2, h: 2, cost: 140, wood: 12, work: 10, workers: 1, recipes: ['vlna'], era: 1, terr: ['grass'], desc: 'Ovečky dávají vlnu, když dostanou pšenici.' },
  tkalcovna: { n: 'Tkalcovna', cat: 'vyroba', w: 2, h: 2, cost: 180, wood: 8, mat: { prkna: 6 }, work: 12, workers: 1, recipes: ['latka', 'polstar'], era: 1, desc: 'Tká látky a šije polštáře. Polštáře do domků zvednou kočkám náladu.' },
  sklad: { n: 'Velký sklad', cat: 'domov', w: 3, h: 2, cost: 300, mat: { prkna: 12, cihly: 10 }, work: 16, store: 160, era: 1, desc: 'Obří sklad (+160 místa).' },
  kolarna: { n: 'Kolárna', cat: 'vyroba', w: 2, h: 2, cost: 350, mat: { prkna: 20 }, work: 14, era: 1, unique: 1, onBuilt: () => { G.flags.voziky = true; banner('Vozíky!', 'Kočky teď unesou o 3 věci víc.'); }, onDemolish: () => { G.flags.voziky = false; }, desc: 'Vyrobí kočkám vozíky — každá unese o 3 věci víc. Stačí jedna.' },
  namesti: { n: 'Tržní náměstí', cat: 'vyroba', w: 3, h: 3, cost: 400, mat: { kamen: 20, prkna: 10 }, work: 16, era: 1, unique: 1, flat: 1, desc: 'Sem přijíždějí karavany obchodníků. Kočky sem nosí zboží, které chceš prodat.' },
  altan: { n: 'Altán', cat: 'ozdoby', w: 2, h: 2, cost: 120, mat: { prkna: 8 }, instant: 1, cozy: 4, rest: 1, quiet: 1, era: 1, desc: '+4 útulnost, tlumí ruch v okolí.' },
  zahon_ruzi: { n: 'Růžový keř', cat: 'ozdoby', w: 1, h: 1, cost: 15, instant: 1, cozy: 1, nodoor: 1, flower: 1, weak: 1, quiet: 1, era: 1, desc: '+1 útulnost, tlumí ruch.' },
  dlazba: { n: 'Dlažba', cat: 'cesty', w: 1, h: 1, cost: 2, mat: { kamen: 1 }, ground: 'road', era: 1, desc: 'Kamenná cesta — kočky po ní běhají 2,5× rychleji. Jde položit i přes starou cestu.' }
});
/* houses accept pillows */
B.domek.wants = b => (b.pillows || 0) < 2 && eraOf() >= 1 ? ['polstar'] : null;
B.domek.inNeed = (b, item) => item === 'polstar' ? 2 - (b.pillows || 0) - (b.inc.polstar || 0) : 0;
B.domek.receive = (b, item, n) => { if (item === 'polstar') b.pillows = Math.min(2, (b.pillows || 0) + n); };
/* decor blueprints sold by collectors */
Object.assign(B, {
  lampiony: { n: 'Lampiony', cat: 'ozdoby', w: 1, h: 1, cost: 40, instant: 1, cozy: 3, light: 30, lightAt: [8, 2], nodoor: 1, bp: 'lampiony', bpPrice: 180, desc: 'Barevná světýlka na provázku. +3 útulnost, svítí v noci.' },
  kasna: { n: 'Kašna', cat: 'ozdoby', w: 1, h: 1, cost: 80, mat: { kamen: 4 }, instant: 1, cozy: 4, quiet: 1, nodoor: 1, bp: 'kasna', bpPrice: 220, desc: 'Malá kamenná kašna. +4 útulnost, tlumí ruch.' },
  kocici_strom: { n: 'Kočičí strom', cat: 'ozdoby', w: 2, h: 2, cost: 150, mat: { prkna: 10 }, instant: 1, cozy: 6, play: 1, quiet: 1, bp: 'kocici_strom', bpPrice: 300, desc: 'Obří strom s pelíšky. +6 útulnost, kočky si tu hrají.' },
  houpacka: { n: 'Houpačka', cat: 'ozdoby', w: 1, h: 1, cost: 50, mat: { prkna: 3 }, instant: 1, cozy: 3, play: 1, bp: 'houpacka', bpPrice: 160, desc: 'Kočky se houpou a mají radost. +3 útulnost.' },
  mlyncek: { n: 'Větrníček', cat: 'ozdoby', w: 1, h: 1, cost: 20, instant: 1, cozy: 2, nodoor: 1, weak: 1, bp: 'mlyncek', bpPrice: 90, desc: 'Barevný větrník. +2 útulnost.' }
});
