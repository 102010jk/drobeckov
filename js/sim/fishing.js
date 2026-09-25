'use strict';
/* ============ 3.12: fishing mini-game at the pier ============ */
let FISH = null;
const FISH_TRIES = 5;
const FISH_KINDS = [['ryby', 'rybku', 0.62], ['ryby', 'velkou rybu', 0.2], ['ryby_more', 'mořskou rybu', 0.1], ['zlata', 'ZLATOU RYBKU', 0.04], ['bota', 'starou botu', 0.04]];
function fishRoll() { let r = Math.random(); for (const k of FISH_KINDS) { if ((r -= k[2]) <= 0) return k; } return FISH_KINDS[0]; }
function molHTML(b) {
  if (!b.built) return '';
  if (b.fishDay === dayIdx() && (b.fishLeft || 0) <= 0) return '<p class="muted">Dnes už ryby neberou. Zkus to zítra.</p>';
  return `<p><button class="btn small chamfer" data-act="fishgo" data-arg="${b.id}">Chytat ryby sám (${b.fishDay === dayIdx() ? b.fishLeft : FISH_TRIES} pokusů)</button></p><p class="muted">Klikni na „Zabrat!“, až splávek zmizí pod vodou.</p>`;
}
{ const _insp = B.molo.inspect; B.molo.inspect = b => (_insp ? _insp(b) : '') + molHTML(b); }
ACTIONS.fishgo = id => {
  const b = G.bld[+id]; if (!b) return;
  if (b.fishDay !== dayIdx()) { b.fishDay = dayIdx(); b.fishLeft = FISH_TRIES; }
  if (b.fishLeft <= 0) return;
  FISH = { b: b.id, phase: 'wait', t: 0, bite: rand(1.5, 4.5), catch: [], msg: 'Čekáš, až zabere…' };
  const el = $('menu'); el.hidden = false;
  el.innerHTML = `<div class="panel nails chamfer mpanel"><h1 class="title">Rybaření</h1><p class="sub" id="fishTxt">Čekáš, až zabere…</p><canvas id="fishCvs" width="160" height="90" style="width:100%;image-rendering:pixelated;border:3px solid #2b1b2b"></canvas><div class="row"><button class="btn big chamfer" id="fishBtn" data-m="fishpull">Zabrat!</button><button class="btn alt chamfer" data-m="fishend">Konec</button></div><p class="muted" id="fishBag"></p></div>`;
  FISH.last = performance.now(); requestAnimationFrame(fishFrame);
};
function fishFrame(now) {
  if (!FISH || !$('fishCvs')) return;
  const dt = Math.min(0.05, Math.max(0, (now - FISH.last) / 1000)); FISH.last = now; FISH.t += dt;
  const g = $('fishCvs').getContext('2d'), S = seasonIdx();
  R(g, S === 3 ? '#c8e4f8' : '#6ab4f0', 0, 0, 160, 90); R(g, S === 3 ? '#e0f0ff' : '#8ccaf6', 0, 0, 160, 30);
  for (let i = 0; i < 6; i++) R(g, '#a8d4f8', (i * 31 + Math.floor(FISH.t * 8)) % 170 - 10, 38 + (i * 13) % 45, 6, 1);
  R(g, '#8a5230', 0, 22, 44, 6); R(g, '#6b4128', 6, 28, 3, 30); R(g, '#6b4128', 34, 28, 3, 30);
  const cs = catSpr((G.cats[0] || { skin: 0 }).skin).sit; g.drawImage(cs.c, 14, 22 - cs.h);
  R(g, '#6b4128', 24, 10, 1, 1); for (let i = 0; i < 20; i++) R(g, '#6b4128', 24 + i * 2, 10 - Math.round(Math.sin(i / 19 * Math.PI) * 3), 2, 1);
  const bx = 100, bite = FISH.phase === 'bite', by = 44 + (bite ? 4 + Math.round(Math.sin(FISH.t * 30)) : Math.round(Math.sin(FISH.t * 3)));
  for (let y = 10; y < by; y += 2) R(g, '#fff3dc', 63 + Math.round((y - 10) / (by - 10) * (bx - 63)), y, 1, 1);
  if (!bite) { R(g, '#e8484e', bx - 1, by - 3, 3, 3); R(g, '#ffffff', bx - 1, by, 3, 2); } else { R(g, '#ffffff', bx - 4, by - 1, 9, 1); R(g, '#ffffff', bx - 2, by - 3, 1, 1); R(g, '#ffffff', bx + 3, by - 2, 1, 1); }
  if (FISH.phase === 'wait' && FISH.t > FISH.bite) { FISH.phase = 'bite'; FISH.biteT = FISH.t; Sound.click(); $('fishTxt').textContent = 'ZABÍRÁ!'; }
  if (FISH.phase === 'bite' && FISH.t - FISH.biteT > 0.9) fishResult(false);
  requestAnimationFrame(fishFrame);
}
function fishResult(pulled) {
  const b = G.bld[FISH.b]; if (!b) return;
  let txt;
  if (!pulled) txt = FISH.phase === 'bite' ? 'Ryba utekla! Byl jsi pomalý.' : 'Moc brzo — ryba se lekla.';
  else {
    const k = fishRoll();
    if (k[0] === 'zlata') { addStars(2, 'za zlatou rybku'); G.coins += 150; G.stats.earned += 150; G.stats.goldfish = (G.stats.goldfish || 0) + 1; txt = 'Chytil jsi ZLATOU RYBKU! Splnila ti přání: +150 mincí a 2 ★.'; Sound.unlock(); }
    else if (k[0] === 'bota') { txt = 'Vylovil jsi starou botu. Kočky se smějí.'; for (const c of G.cats) c.mood = Math.min(100, c.mood + 2); }
    else { const n = k[1] === 'velkou rybu' ? 3 : 1; addStock(k[0], n); G.stats.made[k[0]] = (G.stats.made[k[0]] || 0) + n; txt = `Chytil jsi ${k[1]}! (+${n}× ${itemName(k[0]).toLowerCase()})`; Sound.coin(); }
    FISH.catch.push(k[1]); G.stats.fished = (G.stats.fished || 0) + 1;
  }
  b.fishLeft--;
  const t = $('fishTxt'); if (t) t.textContent = txt;
  const bag = $('fishBag'); if (bag) bag.textContent = `Zbývá pokusů: ${Math.max(0, b.fishLeft)}${FISH.catch.length ? ' · úlovek: ' + FISH.catch.join(', ') : ''}`;
  if (b.fishLeft <= 0) { const btn = $('fishBtn'); if (btn) btn.remove(); FISH.phase = 'over'; return; }
  FISH.phase = 'pause'; setTimeout(() => { if (FISH && FISH.phase === 'pause') { FISH.phase = 'wait'; FISH.t = 0; FISH.bite = rand(1.5, 5); const t2 = $('fishTxt'); if (t2) t2.textContent = 'Čekáš, až zabere…'; } }, 1200);
}
const _menuActionFish = menuAction;
menuAction = function (m) {
  if (m === 'fishpull') { if (FISH && (FISH.phase === 'bite' || FISH.phase === 'wait')) fishResult(FISH.phase === 'bite'); return; }
  if (m === 'fishend') { FISH = null; hideMenu(); UI.dirty = true; renderPane(true); return; }
  return _menuActionFish(m);
};
ACH.push(['zlata', 'Zlatá rybka', () => (G.stats.goldfish || 0) >= 1], ['rybar', 'Trpělivý rybář', () => (G.stats.fished || 0) >= 25]);
{ const p = HELP.find(x => x.id === 'kocky'); if (p) p.t += `<p><b>Rybaření:</b> v detailu Rybářského mola můžeš jednou denně chytat ryby sám (5 pokusů). Klikni na „Zabrat!“, když splávek zmizí pod vodou. Vzácně chytíš zlatou rybku!</p>`; }
