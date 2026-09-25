'use strict';
/* ============ 4.3: playroom with a memory (pexeso) game ============ */
Object.assign(B, {
  herna: { n: 'Herna', cat: 'domov', w: 2, h: 2, cost: 160, wood: 12, work: 10, unique: 1, cozy: 3, play: 1, desc: 'Kočky si tu hrají a ty si můžeš zahrát pexeso. Jednou denně za výhru odměna.' }
});
DRAW.herna = (g, X, Y, b, S, night) => {
  shape(g, [[X + 3, Y + 12, 26, 19, '#fff4dc']]); R(g, '#e8d4b0', X + 26, Y + 12, 3, 19);
  hipRoof(g, X, Y + 2, 32, 11, '#6ab4f0', '#a8d4f8', '#3a74c8', S === 3);
  door(g, X + 13, Y + 21, 6, 10); winGlass(g, X + 4, Y + 18, 6, 5, night, true); winGlass(g, X + 22, Y + 18, 5, 5, night, true);
  for (const [a, c, col] of [[5, 26, '#e8484e'], [9, 27, '#ffd23f'], [22, 26, '#72c850']]) shape(g, [[X + a, Y + c, 3, 3, col]]);
  odisc(g, X + 16, Y + 7, 2, '#ff9ec0');
};
B.herna.top = 6; LIT.herna = 1;
let MEM = null;
B.herna.status = b => b.memDay === dayIdx() ? ['Dnešní odměna vybrána — hrát můžeš dál pro radost', 'ok'] : ['Pexeso čeká', 'ok'];
B.herna.inspect = b => b.built ? `<p><button class="btn small chamfer" data-act="memgo" data-arg="${b.id}">Zahrát pexeso</button></p><p class="muted">${b.memDay === dayIdx() ? 'Odměnu už máš, zítra zase.' : 'Čím méně tahů, tím víc mincí (a za výborný výkon hvězdička).'}</p>` : '';
ACTIONS.memgo = id => {
  const pool = Object.keys(ITEMS).filter(k => SPR[k] && seenItem(k));
  const extra = Object.keys(ITEMS).filter(k => SPR[k] && !pool.includes(k));
  while (pool.length < 8) pool.push(extra.splice(randi(0, extra.length - 1), 1)[0]);
  const pick8 = pool.sort(() => Math.random() - 0.5).slice(0, 8), cards = pick8.concat(pick8).sort(() => Math.random() - 0.5).map(k => ({ k, open: false, done: false }));
  MEM = { b: +id, cards, first: -1, moves: 0, lock: false, pairs: 0 };
  $('menu').hidden = false; memRender();
};
function memRender() {
  const el = $('menu');
  el.innerHTML = `<div class="panel nails chamfer mpanel"><h1 class="title">Pexeso</h1><p class="sub" id="memTxt">Tahů: ${MEM.moves} · párů ${MEM.pairs}/8</p><div class="mem">${MEM.cards.map((c, i) => `<button class="mc ${c.open || c.done ? 'open' : ''} ${c.done ? 'done' : ''}" data-m="mem:${i}">${c.open || c.done ? itemIcon(c.k, 3) : '<span class="back">?</span>'}</button>`).join('')}</div><div class="row"><button class="btn alt chamfer" data-m="memend">Konec</button></div></div>`;
}
function memFlip(i) {
  if (!MEM || MEM.lock) return; const c = MEM.cards[i]; if (!c || c.open || c.done) return;
  c.open = true; Sound.click();
  if (MEM.first < 0) { MEM.first = i; memRender(); return; }
  const a = MEM.cards[MEM.first]; MEM.moves++;
  if (a.k === c.k) { a.done = c.done = true; a.open = c.open = false; MEM.first = -1; MEM.pairs++; Sound.coin(); memRender(); if (MEM.pairs === 8) memWin(); return; }
  MEM.lock = true; memRender();
  setTimeout(() => { if (!MEM) return; a.open = c.open = false; MEM.first = -1; MEM.lock = false; memRender(); }, 800);
}
function memWin() {
  const b = G.bld[MEM.b], first = b && b.memDay !== dayIdx();
  let msg = `Hotovo za ${MEM.moves} tahů!`;
  if (first) {
    const coins = Math.max(20, Math.round((40 - MEM.moves) * 8 * (1 + eraOf() * 0.3))); G.coins += coins; G.stats.earned += coins; b.memDay = dayIdx();
    msg += ` Odměna ${coins} mincí.`;
    if (MEM.moves <= 14) { addStars(1, 'za skvělou paměť'); msg += ' Skvělá paměť: +1 ★'; }
  } else msg += ' (Dnešní odměnu už máš.)';
  G.stats.memBest = Math.min(G.stats.memBest || 99, MEM.moves); G.stats.memGames = (G.stats.memGames || 0) + 1;
  for (const c of G.cats) if (c.task && G.bld[c.task.b] && G.bld[c.task.b].type === 'herna') emote(c, 'heart', 3);
  Sound.unlock(); const t = $('memTxt'); if (t) t.textContent = msg;
}
const _menuActionMem = menuAction;
menuAction = function (m) {
  if (m.startsWith('mem:')) return memFlip(+m.slice(4));
  if (m === 'memend') { MEM = null; hideMenu(); UI.dirty = true; renderPane(true); return; }
  return _menuActionMem(m);
};
ACH.push(['pexeso', 'Sloní paměť', () => (G.stats.memBest || 99) <= 12]);
{ const p = HELP.find(x => x.id === 'kocky'); if (p) p.t += `<p><b>Herna</b> (Domov): kočky si v ní hrají a ty si můžeš zahrát <b>pexeso</b> s obrázky věcí, které už znáš. Jednou denně za výhru mince (čím méně tahů, tím víc).</p>`; }
