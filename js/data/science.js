'use strict';
/* ============ era 3–4: science, electricity, space ============ */
Object.assign(ITEMS, {
  zapisnik: { n: 'Zápisník přírodovědce', v: 30 },
  vykres: { n: 'Technický výkres', v: 70 },
  elektro: { n: 'Elektro sada', v: 120 },
  hvezdna_mapa: { n: 'Hvězdná mapa', v: 220 },
  hlinik: { n: 'Hliník', v: 30 },
  dural: { n: 'Dural', v: 60 },
  kremik: { n: 'Křemík', v: 22 },
  obvod: { n: 'Obvod', v: 60 },
  cip: { n: 'Čip', v: 55 },
  cocka: { n: 'Čočka', v: 35 },
  baterie: { n: 'Baterie', v: 45 },
  raketove_palivo: { n: 'Raketové palivo', v: 40 },
  trupovy_panel: { n: 'Trupový panel', v: 150 },
  raketovy_motor: { n: 'Raketový motor', v: 480 },
  palivova_nadrz: { n: 'Palivová nádrž', v: 180 },
  navadeci_pocitac: { n: 'Naváděcí počítač', v: 420 },
  kapsle: { n: 'Kosmická kapsle', v: 600 }
});
Object.assign(RECIPES, {
  zapisnik: { in: { papir: 2, med: 1 }, out: 'zapisnik', n: 1, t: 10 },
  cocka: { in: { sklo: 2 }, out: 'cocka', n: 1, t: 10, tech: 'optika' },
  dural: { in: { hlinik: 2, medkov: 1 }, out: 'dural', n: 2, t: 12, tech: 'hlinik' }
});
B.papirna.recipes.push('zapisnik');
B.sklarna.recipes.push('cocka');
B.slevarna.recipes.push('dural');
RECIPES.zapisnik.lock = null;
Object.assign(FRECIPES, {
  vykres: { in: { papir: 1, ocel: 1, ozubena_kola: 1 }, out: 'vykres', n: 1, t: 8 },
  elektro: { in: { obvod: 1, drat: 2, sklo: 1 }, out: 'elektro', n: 1, t: 9 },
  hvezdna_mapa: { in: { cocka: 1, zlato: 1, dural: 1 }, out: 'hvezdna_mapa', n: 1, t: 12 },
  hlinik: { in: { bauxit: 2 }, out: 'hlinik', n: 1, t: 6, power: 1 },
  palivo: { in: { uhli: 1 }, out: 'raketove_palivo', n: 2, t: 8, power: 1 },
  kremik: { in: { pisek: 2, uhli: 1 }, out: 'kremik', n: 1, t: 7 },
  obvod: { in: { drat: 2, kremik: 1 }, out: 'obvod', n: 1, t: 7 },
  cip: { in: { kremik: 1, zlato: 1 }, out: 'cip', n: 2, t: 8 },
  baterie: { in: { medkov: 1, plech: 1, uhli: 1 }, out: 'baterie', n: 1, t: 7 },
  navadeci_pocitac: { in: { cip: 2, obvod: 2, plech: 1 }, out: 'navadeci_pocitac', n: 1, t: 14 },
  trupovy_panel: { in: { dural: 2, srouby: 4 }, out: 'trupovy_panel', n: 1, t: 10 },
  raketovy_motor: { in: { motor: 1, trubky: 2, ocel: 2 }, out: 'raketovy_motor', n: 1, t: 16 },
  palivova_nadrz: { in: { dural: 2, trubky: 1 }, out: 'palivova_nadrz', n: 1, t: 12 },
  kapsle: { in: { sklo: 2, dural: 2, polstar: 1 }, out: 'kapsle', n: 1, t: 20 }
});
MACHINES.montaz.recipes.push('vykres', 'baterie', 'trupovy_panel', 'raketovy_motor', 'palivova_nadrz', 'kapsle');
MACHINES.pec.recipes.push('kremik');
Object.assign(MACHINES, {
  elektrolyzer: { n: 'Elektrolyzér', cost: 500, mat: { ocel: 4, medkov: 4 }, recipes: ['hlinik', 'palivo'], col: '#6ab4f0', tech: 'elektrina', needPower: 1, desc: 'Potřebuje proud. Bauxit → hliník, uhlí → raketové palivo.' },
  pajeci: { n: 'Pájecí stůl', cost: 450, mat: { ocel: 2, medkov: 3 }, recipes: ['obvod', 'cip', 'elektro', 'hvezdna_mapa', 'navadeci_pocitac'], col: '#3a9a78', tech: 'kremik', desc: 'Elektronika: obvody, čipy, výzkumné sady, naváděcí počítač.' }
});
/* recipes that need a research */
const FREC_TECH = { hlinik: 'hlinik', palivo: 'raketove_palivo', kremik: 'kremik', obvod: 'kremik', cip: 'kremik', elektro: 'elektronika', hvezdna_mapa: 'optika', navadeci_pocitac: 'elektronika', trupovy_panel: 'raketa', raketovy_motor: 'raketa', palivova_nadrz: 'raketa', kapsle: 'raketa', baterie: 'elektronika', vykres: null };

Object.assign(TECH, {
  elektrina: { n: 'Elektřina', cost: { zapisnik: 8 }, d: 'Uhelná elektrárna, větrníky a elektrolyzér do továren.' },
  optika: { n: 'Optika', cost: { zapisnik: 10 }, d: 'Čočky ve sklárně a dalekohled.' },
  automatizace: { n: 'Automatizace', cost: { zapisnik: 6, vykres: 6 }, req: ['elektrina'], d: 'Stroje v továrnách mohou běžet samy — berou proud místo koček.' },
  hlinik: { n: 'Hliník', cost: { vykres: 8 }, req: ['elektrina'], d: 'Elektrolyzér vyrobí hliník z bauxitu, slévárna dural.' },
  kremik: { n: 'Křemík', cost: { vykres: 6 }, req: ['elektrina'], d: 'Křemík z písku a Pájecí stůl na obvody a čipy.' },
  elektronika: { n: 'Elektronika', cost: { vykres: 6, zapisnik: 6 }, req: ['kremik'], d: 'Elektro sady, baterie, naváděcí počítač.' },
  vzducholod: { n: 'Vzducholodě', cost: { vykres: 10, elektro: 4 }, req: ['elektronika'], d: 'Přistávací věž — vzducholodě obchodníků z celého světa.' },
  raketove_palivo: { n: 'Raketové palivo', cost: { elektro: 6 }, req: ['hlinik', 'elektronika'], d: 'Elektrolyzér vyrobí raketové palivo.' },
  inzenyri: { n: 'Inženýři', cost: { vykres: 4 }, req: [], d: 'Škola může vyškolit inženýry (+40 % rychlost v továrnách a hutích).' },
  raketa: { n: 'Raketová technika', cost: { hvezdna_mapa: 10, elektro: 10 }, req: ['raketove_palivo', 'optika'], d: 'Kosmodrom, díly rakety a výcvik astronautů. Cesta ke hvězdám!' }
});
Object.assign(B, {
  skola: { n: 'Škola', cat: 'domov', w: 2, h: 2, cost: 600, mat: { cihly: 20, prkna: 12, sklo: 4 }, work: 20, workers: 1, era: 3, cozy: 2,
    desc: 'Vyškolí kočku na vědce, inženýra nebo astronauta. Učí se z papíru.' },
  laborator: { n: 'Laboratoř', cat: 'vyroba', w: 2, h: 2, cost: 900, mat: { cihly: 20, sklo: 10, ocel: 6 }, work: 24, workers: 2, prof: 'vedec', era: 3, windowLight: [16, 22, 14],
    desc: 'Vědci tu zkoumají technologie. Spotřebovávají výzkumné sady (záložka Výzkum).' },
  elektrarna: { n: 'Uhelná elektrárna', cat: 'vyroba', w: 2, h: 2, cost: 800, mat: { cihly: 24, ocel: 10, medkov: 6 }, work: 24, workers: 1, tech: 'elektrina', noise: 5, chimney: [24, -8], darkSmoke: 1, smokeAlways: 0,
    desc: 'Pálí uhlí a vyrábí proud pro automatické stroje.' },
  vetrnik: { n: 'Větrná turbína', cat: 'vyroba', w: 1, h: 1, cost: 400, mat: { ocel: 4, medkov: 2 }, work: 10, tech: 'elektrina', nodoor: 1, desc: 'Vyrábí proud z větru — bez obsluhy. Za deště a v zimě víc.' },
  dalekohled: { n: 'Dalekohled', cat: 'ozdoby', w: 1, h: 1, cost: 250, mat: { cocka: 2, medkov: 2 }, instant: 1, cozy: 4, nodoor: 1, tech: 'optika', desc: '+4 útulnost. Kočky se v noci dívají na hvězdy.' },
  kovova_lampa: { n: 'Pouliční lampa', cat: 'ozdoby', w: 1, h: 1, cost: 60, mat: { zelezo: 1, sklo: 1 }, instant: 1, cozy: 2, light: 44, nodoor: 1, tech: 'elektrina', desc: 'Velké světlo. +2 útulnost.' },
  vez: { n: 'Přistávací věž', cat: 'vyroba', w: 2, h: 2, cost: 1600, mat: { ocel: 20, dural: 6, prkna: 10 }, work: 26, unique: 1, tech: 'vzducholod', desc: 'Přilétají sem vzducholodě s obchodníky z celého světa.' },
  kosmodrom: { n: 'Kosmodrom', cat: 'vyroba', w: 5, h: 5, cost: 8000, mat: { ocel: 60, cihly: 60, dural: 20 }, work: 60, unique: 1, era: 5, tech: 'raketa',
    desc: 'Tady se postaví raketa ve třech stupních. Pak už jen odpočítávání…' }
});
const ROCKET_STAGES = [
  { n: 'První stupeň', need: { trupovy_panel: 10, raketovy_motor: 4, palivova_nadrz: 4 } },
  { n: 'Druhý stupeň', need: { trupovy_panel: 8, navadeci_pocitac: 2, raketove_palivo: 20 } },
  { n: 'Špička s kapslí', need: { kapsle: 1, raketove_palivo: 20, baterie: 6 } }
];
PROFS.vedec.cost = { papir: 12 }; PROFS.inzenyr.cost = { papir: 10, naradi: 2 }; PROFS.astronaut.cost = { papir: 20, konzervy: 10 };
PROFS.inzenyr.tech = 'inzenyri'; PROFS.astronaut.tech = 'raketa';
