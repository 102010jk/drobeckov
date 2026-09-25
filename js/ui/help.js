'use strict';
/* ============ Kočičí příručka (in-game help) ============ */
const HELP = [
  { id: 'zaklady', n: 'Základy', t: `<p>Jsi správce kočičí osady. Kočky samy nosí suroviny, staví a vyrábí — ty rozhoduješ <b>co</b> a <b>kde</b> postavit a <b>kdo</b> kde pracuje.</p>
    <p><b>Ovládání:</b> táhni myší = posun mapy · kolečko = zoom · klik = vybrat nebo postavit · pravé tlačítko / Esc = zrušit · mezerník = pauza · 1–3 = rychlost · X = bourání · L = pozemky · WASD / šipky = posun.</p>` },
  { id: 'kocky', n: 'Kočky a nálada', t: `<p>Kočky potřebují <b>jíst</b> (jídlo berou ze skladu), <b>spát</b> (nejlépe v domku) a mít hezké okolí. Spokojená kočka pracuje až o 30 % rychleji, smutná pomaleji.</p>
    <p>Náladu zvedá: jídlo, spánek v domku, ozdoby kolem domku, hraní na škrabadle, pohlazení. Snižuje ji: hlad, bezdomovectví, déšť, <b>ruch</b> z dílen.</p>
    <p>Nová kočka přijde ráno, když je volný pelíšek a útulnost dosáhne prahu.</p>` },
  { id: 'logistika', n: 'Nošení a sklad', t: `<p>Každá dílna má vstup a výstup. Kočky nosí výrobky rovnou tam, kde jsou potřeba, jinak do skladu. Všechny sklady sdílejí zásoby.</p>
    <p>Vzdálenost = čas. Stav dílny blízko surovin a skladu, stav cesty (2× rychleji) a dlažbu (2,5×).</p>
    <p>Když je sklad plný, výroba se zastaví (ikona krabice nad budovou). Pomůže další sklad, prodej na stánku nebo výkup Liškou v záložce Sklad.</p>` },
  { id: 'pozemky', n: 'Pozemky a svět', t: `<p>Svět je <b>nekonečný</b> a pro každé semínko jiný: louky, lesy, břízy, mokřady, řeky, jezera, moře, kopce a hory s ložisky rud.</p>
    <p>Pozemky 8×8 se kupují tlačítkem <b>Pozemky</b> (nebo L). Kupovat jde jen sousední. Na některých leží zajímavá místa — truhly, studánky, zříceniny… objevíš je koupí pozemku.</p>
    <p>Stavba sama odstraní stromy a záhony pod sebou, ale nic za ně nedostaneš. Dřevo dává jen dřevorubec.</p>` },
  { id: 'sezony', n: 'Sezóny a zima', t: `<p>Jaro → Léto → Podzim → Zima, každá 4 dny. Každá plodina roste jen v některých sezónách. <b>V zimě nic neroste</b> — připrav si zásoby jídla.</p>
    <p>Na konci každé sezóny je slavnost se sbírkou (záložka Zakázky). Za splnění dostaneš mince a první rok i dárek.</p>` },
  { id: 'sousede', n: 'Sousedé a zakázky', t: `<p>Zakázky na nástěnce jsou hlavní příjem. Každý soused má srdíčka — čím víc, tím víc toho odemkne (recepty, budovy, ozdoby).</p>
    <p>Zakázky vyprší po 2 dnech bez trestu, přijdou nové.</p>` },
  { id: 'ulozeni', n: 'Ukládání', t: `<p>Hra se ukládá sama každou minutu a každé ráno. V Menu můžeš uložit jako novou hru, načíst jinou osadu nebo hru <b>exportovat jako kód</b> — ten si zkopíruj a na jiném počítači (třeba ve škole) ho vlož přes Import.</p>` }
];
let helpPage = 'zaklady';
EXTRA_TABS.help = () => {
  let h = '<div class="chips">' + HELP.map(p => `<button class="chip-btn ${helpPage === p.id ? 'on' : ''}" data-act="help" data-arg="${p.id}">${p.n}</button>`).join('') + '</div>';
  const p = HELP.find(x => x.id === helpPage) || HELP[0];
  return h + `<div class="help-page"><h3>${p.n}</h3>${p.t}</div>`;
};
ACTIONS.help = id => { helpPage = id; };
