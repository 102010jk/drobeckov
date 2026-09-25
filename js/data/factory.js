'use strict';
/* ============ era 3: factories with interiors ============ */
Object.assign(ITEMS, {
  plech: { n: 'Plech', v: 26 },
  trubky: { n: 'Trubky', v: 30 },
  drat: { n: 'Měděný drát', v: 9 },
  ozubena_kola: { n: 'Ozubená kola', v: 24 },
  srouby: { n: 'Šrouby', v: 6 },
  motor: { n: 'Motor', v: 170 },
  konzervy: { n: 'Rybí konzervy', v: 18, food: 60 },
  hracky: { n: 'Plechové hračky', v: 70 }
});
DEFAULT_SELL.push('hracky');
/* recipes of machines inside factories */
const FRECIPES = {
  plech: { in: { ocel: 1 }, out: 'plech', n: 2, t: 5 },
  trubky: { in: { plech: 1 }, out: 'trubky', n: 1, t: 4 },
  drat: { in: { medkov: 1 }, out: 'drat', n: 3, t: 4 },
  ozubena_kola: { in: { ocel: 1 }, out: 'ozubena_kola', n: 2, t: 6 },
  srouby: { in: { zelezo: 1 }, out: 'srouby', n: 4, t: 4 },
  motor: { in: { ozubena_kola: 2, drat: 2, plech: 1 }, out: 'motor', n: 1, t: 10 },
  konzervy: { in: { ryby: 2, plech: 1 }, out: 'konzervy', n: 3, t: 5 },
  konzervy2: { in: { ryby_more: 1, plech: 1 }, out: 'konzervy', n: 3, t: 5 },
  hracky: { in: { plech: 1, srouby: 2 }, out: 'hracky', n: 1, t: 7 },
  zelezo_f: { in: { ruda_fe: 2, uhli: 1 }, out: 'zelezo', n: 1, t: 5 },
  medkov_f: { in: { ruda_cu: 2, uhli: 1 }, out: 'medkov', n: 1, t: 5 },
  ocel_f: { in: { zelezo: 2, uhli: 1 }, out: 'ocel', n: 1, t: 6 }
};
const MACHINES = {
  lis: { n: 'Lis', cost: 150, mat: { ocel: 2 }, recipes: ['plech', 'trubky'], col: '#5d6480', desc: 'Lisuje ocel na plech a plech na trubky.' },
  tazirna: { n: 'Tažírna drátu', cost: 150, mat: { zelezo: 2 }, recipes: ['drat'], col: '#cc5f22', desc: 'Z mědi táhne drát.' },
  soustruh: { n: 'Soustruh', cost: 220, mat: { ocel: 3 }, recipes: ['ozubena_kola', 'srouby'], col: '#3a74c8', desc: 'Ozubená kola z oceli, šrouby ze železa.' },
  montaz: { n: 'Montážní stůl', cost: 260, mat: { prkna: 6, ocel: 2 }, recipes: ['motor', 'konzervy', 'konzervy2', 'hracky'], col: '#a8693e', era: 3, desc: 'Skládá díly: motory, rybí konzervy, hračky.' },
  pec: { n: 'Průmyslová pec', cost: 320, mat: { cihly: 10, ocel: 2 }, recipes: ['zelezo_f', 'medkov_f', 'ocel_f'], col: '#a8423a', era: 3, desc: 'Taví rudu i ocel 2× rychleji než tavírna.' }
};
const FTOOLS = {
  belt: { n: 'Pás', cost: 4, mat: {}, desc: 'Posouvá věci ve směru šipky. Táhni myší, R otočí.' },
  split: { n: 'Rozbočovač', cost: 20, mat: {}, desc: 'Posílá věci střídavě doleva a doprava.' },
  station: { n: 'Pracovní místo', cost: 30, mat: {}, desc: 'Tady stojí kočka a obsluhuje stroje vedle sebe (nahoře, dole, vlevo, vpravo).' },
  fdel: { n: 'Odstranit', cost: 0, mat: {}, desc: 'Odstraní pás nebo stroj (vrátí polovinu).' }
};
function facItemsWanted(b) {
  const s = new Set();
  if (!b.fac) return [];
  for (const c of b.fac.cells) if (c && c.k === 'm' && FRECIPES[c.r]) for (const k in FRECIPES[c.r].in) s.add(k);
  return [...s];
}
function facSlots(b) { return b.fac ? b.fac.cells.filter(c => c && c.k === 'st').length : 0; }
function facDef(type) {
  return {
    cat: 'vyroba', interior: 1, industry: 1, noise: 4,
    slots: b => facSlots(b),
    wants: b => facItemsWanted(b),
    inNeed: (b, k) => facItemsWanted(b).includes(k) ? 14 - (b.inp[k] || 0) - (b.inc[k] || 0) : 0,
    canWork: b => !!b.fac && facSlots(b) > 0 && (sumObj(b.inp) > 0 || b.fac.busy > 0) && sumObj(b.out) < 40,
    produce: (b, amt) => { b._crew = (b._crew || 0) + 1; b._mul = (b._mul || 0) + amt; },
    inspect: b => `<button class="btn chamfer" data-act="enter" data-arg="${b.id}">Vstoupit dovnitř</button> <small class="muted">${b.fac ? b.fac.w + '×' + b.fac.h : ''} · pracovních míst ${facSlots(b)}</small>`,
    status: b => { if (!b.fac) return null; if (!facSlots(b)) return ['Uvnitř chybí pracovní místo — vstup a postav ho', 'bad']; if (!b.fac.cells.some(c => c && c.k === 'm')) return ['Uvnitř nejsou stroje — vstup a postav je', 'wait']; return [b.working ? 'Továrna jede' : sumObj(b.inp) ? 'Čeká na pracovníky' : 'Čeká na suroviny', b.working ? 'ok' : 'wait']; },
    alert: b => !b.fac || !facSlots(b) || !b.fac.cells.some(c => c && c.k === 'm') ? 'bang' : null
  };
}
Object.assign(B, {
  dilna: Object.assign(facDef('dilna'), { n: 'Dílna', w: 3, h: 2, cost: 700, mat: { prkna: 20, cihly: 16, hrebiky: 10 }, work: 18, era: 2, iw: 8, ih: 4, chimney: [8, -2],
    init: b => facInit(b, 8, 4), desc: 'Malá dílna, do které se dá VEJÍT (uvnitř 8×4). Postav si pásy, stroje a pracovní místa pro kočky.' }),
  tovarna: Object.assign(facDef('tovarna'), { n: 'Továrna', w: 6, h: 2, cost: 1500, mat: { prkna: 30, cihly: 40, ocel: 12, hrebiky: 20 }, work: 30, era: 3, iw: 12, ih: 6, chimney: [12, -10], darkSmoke: 1,
    init: b => facInit(b, 12, 6), desc: 'Velká továrna (uvnitř 12×6, jde rozšířit na 20×6). Vejdi dovnitř a postav výrobní linku.' })
});
function facInit(b, w, h) { b.fac = { w, h, gate: Math.floor(h / 2), cells: new Array(w * h).fill(null), rr: 0, busy: 0, gin: 0, stats: {} }; }
