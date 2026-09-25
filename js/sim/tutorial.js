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
  { t: 'Postav další Kočičí domek a zvyš útulnost na 9 — pak ráno přijde nová kočka.', ok: () => countB('domek') >= 3 && coziness() >= 9, coins: 60 },
  { t: 'V zimě nic neroste. Nasbírej do skladu aspoň 20 jídla (chléb, ryby, mléko…).', ok: () => foodTotal() >= 20, coins: 80 },
  { t: 'Skvělá práce! Teď už to zvládneš sama. Další kapitoly přijdou s novými érami.', ev: 'next', coins: 100, last: true }
];
function tutStep() { return G && !G.tut.skip && G.tut.step < TUT.length ? TUT[G.tut.step] : null; }
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
