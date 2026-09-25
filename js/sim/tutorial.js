'use strict';
/* ============ tutorial: guided steps with highlights ============ */
const foodTotal = () => FOODS.reduce((a, k) => a + (G.stock[k] || 0), 0);
const hasB = (type, withWorker) => BLIST.some(b => b.type === type && b.built && (!withWorker || b.workers.length));
const TUT = [
  { ch: 'Kapitola 1 · Farma a kočky', t: 'Vítej v osadě {name}! Táhni myší po mapě (nebo WASD) a kolečkem přibliž.', ev: 'cam', coins: 20 },
  { t: 'Tohle jsou tvoje kočky. Klikni na některou — pohladíš ji a uvidíš, co dělá.', ev: 'pet', coins: 20 },
  { t: 'Postav Mlýn: záložka Stavět → Výroba → Mlýn, pak klikni blízko políčka.', hl: '[data-arg="mlyn"]', ok: () => BLIST.some(b => b.type === 'mlyn'), coins: 30 },
  { t: 'Kočky samy donesou dřevo ze spižírny a postaví ho. Stačí chvilku počkat.', ok: () => hasB('mlyn'), coins: 40 },
  { t: 'Postav Pekárnu — chléb je zboží i kočičí jídlo.', hl: '[data-arg="pekarna"]', ok: () => BLIST.some(b => b.type === 'pekarna'), coins: 30 },
  { t: 'Až bude pekárna hotová, klikni na ni a přiřaď kočku (tlačítko Přiřadit kočku).', ok: () => hasB('pekarna', true), coins: 50 },
  { t: 'Otevři Zakázky a doruč první zakázku sousedům. Zakázky jsou hlavní příjem.', hl: '[data-tab="orders"]', ok: () => G.stats.orders > 0, coins: 60 },
  { t: 'Dřevo roste jen u dřevorubce. Postav Dřevorubeckou chatu u stromů a dej jí kočku.', hl: '[data-arg="drevorubec"]', ok: () => hasB('drevorubec', true), coins: 40, wood: 10 },
  { ch: 'Kapitola 2 · Pozemky a zima', t: 'Údolí je nekonečné. Klikni na Pozemky (nahoře) a kup sousední kousek země.', hl: '#landBtn', ok: () => (G.stats.parcels || 0) > 0, coins: 50 },
  { t: 'Postav další Kočičí domek a pár Záhonů květin (Ozdoby). Nová kočka přijde ráno, když má volný pelíšek a osada je dost útulná.', ok: () => countB('domek') >= 3 && coziness() >= 6, coins: 60 },
  { t: 'V zimě nic neroste. Nasbírej do skladu aspoň 20 jídla (chléb, ryby, mléko…).', ok: () => foodTotal() >= 20, coins: 80 },
  { t: 'Skvělá práce! Až osada vyroste (víc koček, víc mincí), otevře se nová éra a já se ozvu.', ev: 'next', coins: 100 },
  { ch: 'Kapitola 3 · Řemesla a obchod', era: 1, t: 'Nová éra! Postav Pilu — prkna jsou potřeba na lepší stavby.', hl: '[data-arg="pila"]', ok: () => BLIST.some(b => b.type === 'pila'), coins: 60 },
  { era: 1, t: 'Najdi skálu nebo hlínu (hnědé skvrny u vody) a postav Kamenolom nebo Hliniště.', ok: () => BLIST.some(b => b.type === 'lom' || b.type === 'hliniste'), coins: 60 },
  { era: 1, t: 'Z hlíny a dřeva se v Cihelně pálí cihly. Postav ji.', hl: '[data-arg="cihelna"]', ok: () => BLIST.some(b => b.type === 'cihelna'), coins: 80 },
  { era: 1, t: 'Postav Tržní náměstí — budou sem jezdit karavany obchodníků.', hl: '[data-arg="namesti"]', ok: () => hasB('namesti'), coins: 100 },
  { era: 1, t: 'Až přijede karavana, v záložce Obchod klikni „připravit“ a pak „prodat“.', hl: '[data-tab="trade"]', ev: 'trade', coins: 120 },
  { era: 1, t: 'Polož kamennou Dlažbu (Stavět → Cesty) — kočky po ní běhají 2,5× rychleji.', ok: () => Object.values(G.mods).some(m => Object.values(m).some(v => v[0] === 7)), coins: 60 },
  { era: 1, t: 'Postav Cestovatelský stan (Stavět → Domov) a vyšli krátkou výpravu. Kočky přinesou semínka nových plodin!', hl: '[data-arg="stan"]', ok: () => (G.stats.expeditions || 0) > 0 || !!G.expedition, coins: 100 },
  { era: 1, t: 'Hotovo! Tkalcovna šije polštáře do domků a sběratelé prodávají plánky ozdob. Další éra: Hornictví a přístav.', ev: 'next', coins: 150 },
  { ch: 'Kapitola 4 · Hornictví a přístav', era: 2, t: 'Nová éra! Barevné kamínky ve skalách jsou ložiska. Postav na nich Důl (Stavět → Výroba).', hl: '[data-arg="dul"]', ok: () => BLIST.some(b => b.type === 'dul'), coins: 120 },
  { era: 2, t: 'Kov se taví s uhlím. Když nemáš uhelný důl, postav Milíř — pálí dřevo na uhlí.', ok: () => (G.stats.made.uhli || 0) >= 1, coins: 80 },
  { era: 2, t: 'Postav Tavírnu a vytav první železo nebo měď.', hl: '[data-arg="tavirna"]', ok: () => (G.stats.made.zelezo || 0) + (G.stats.made.medkov || 0) >= 1, coins: 150 },
  { era: 2, t: 'Ve Slévárně vyrob ocel (železo + uhlí). Hutní cech za ni dobře platí.', hl: '[data-arg="slevarna"]', ok: () => (G.stats.made.ocel || 0) >= 1, coins: 200 },
  { era: 2, t: 'Najdi moře a postav Přístav u hluboké vody. Lodě vozí kakao, koření a vzácné rudy.', ok: () => hasB('pristav'), coins: 300 },
  { era: 2, t: 'Výborně! Další éra — Průmysl — přinese továrny, do kterých se dá vejít.', ev: 'next', coins: 200 },
  { ch: 'Kapitola 5 · Továrny', era: 2, t: 'Postav Dílnu (Stavět → Výroba). Do dílen a továren se dá VEJÍT.', hl: '[data-arg="dilna"]', ok: () => hasB('dilna') || hasB('tovarna'), coins: 150 },
  { era: 2, t: 'Klikni na dílnu a dej „Vstoupit dovnitř“.', ev: 'enter', coins: 50 },
  { era: 2, t: 'Postav Lis (dole v nabídce stroj Lis) — lisuje ocel na plech.', ev: 'fac_machine', coins: 60 },
  { era: 2, t: 'Vedle stroje postav Pracovní místo — tam bude stát kočka.', ev: 'fac_station', coins: 60 },
  { era: 2, t: 'Pásy vedou zboží od vstupní brány (vlevo) přes stroj k výstupní bráně (vpravo). Polož pás (táhni, R otočí).', ev: 'fac_belt', coins: 60 },
  { era: 2, t: 'Přiřaď dílně kočku (v panelu vpravo) a nech kočky přinést ocel. Vyrob první plech.', ok: () => (G.stats.made.plech || 0) >= 1, coins: 200 },
  { era: 2, t: 'Máš vlastní výrobní linku! Zkus Montážní stůl a rybí konzervy — jídlo, které vydrží zimu.', ev: 'next', coins: 150 },
  { ch: 'Kapitola 6 · Věda', era: 3, t: 'Nová éra! Postav Školu a vyškol první kočku na Vědce (klikni na školu → Vyškolit).', hl: '[data-arg="skola"]', ev: 'prof', coins: 200 },
  { era: 3, t: 'Postav Laboratoř a přiřaď jí vědce.', ok: () => BLIST.some(b => b.type === 'laborator' && b.built && b.workers.length), coins: 200 },
  { era: 3, t: 'Papírna teď umí Zápisníky (papír + med). V záložce Výzkum vyber Elektřinu a nech vědce bádat.', hl: '[data-tab="research"]', ev: 'tech', coins: 300 },
  { era: 3, t: 'Postav elektrárnu nebo větrníky. Stroje v továrnách pak po výzkumu Automatizace pojedou samy.', ok: () => countB('elektrarna') + countB('vetrnik') > 0, coins: 200 },
  { ch: 'Kapitola 7 · Ke hvězdám', era: 5, t: 'Poslední éra! Vyzkoumej Raketovou techniku a postav Kosmodrom.', ok: () => BLIST.some(b => b.type === 'kosmodrom'), coins: 500 },
  { era: 5, t: 'Vyrob díly všech tří stupňů rakety a vyškol astronauta. Pak odpočítávání…', ok: () => !!G.flags.launched, coins: 2000 },
  { era: 5, t: 'Kočka ve vesmíru! Drobečkov je nejslavnější osada široko daleko. Hraj dál, jak se ti líbí.', ev: 'next', coins: 500 }
];
function tutStep() { if (!G || G.tut.skip || G.tut.step >= TUT.length) return null; const s = TUT[G.tut.step]; return (s.era || 0) <= eraOf() ? s : null; }
function tutAdvance() {
  const s = tutStep(); if (!s) return;
  if (s.coins) G.coins += s.coins; if (s.wood) addStock('drevo', s.wood);
  G.tut.step++;
  if (s.coins) toast(`Úkol splněn! +${s.coins} mincí${s.wood ? ' a ' + s.wood + ' dřeva' : ''}`);
  Sound.deliver(); UI.dirty = true; renderTut();
}
function tutEvent(ev) { const s = tutStep(); if (s && s.ev === ev) tutAdvance(); }
function tutTick() { const s = tutStep(); if (s && s.ok && s.ok()) tutAdvance(); }
function renderTut() {
  const el = $('tut'); if (!el) return;
  document.querySelectorAll('.tut-hl').forEach(e => e.classList.remove('tut-hl'));
  const s = tutStep();
  if (!s || !started) { el.hidden = true; return; }
  el.hidden = false;
  let ch = ''; for (let i = G.tut.step; i >= 0; i--) if (TUT[i].ch) { ch = TUT[i].ch; break; }
  el.innerHTML = `${animalIcon('jezek', 2)}<div class="tt"><small>${ch} · ${G.tut.step + 1}/${TUT.length}</small><b>${s.t.replace('{name}', G.name)}</b>
    <span class="tb">${s.ev === 'next' ? '<button class="btn small chamfer" data-tut="next">Díky!</button>' : ''}<button class="link" data-tut="skip">Přeskočit tutoriál</button></span></div>`;
  if (s.hl) document.querySelectorAll(s.hl).forEach(e => e.classList.add('tut-hl'));
}
function drawTutorialWorld() { }
