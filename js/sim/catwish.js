'use strict';
/* ============ 3.11: personal cat wishes (thought bubbles) ============ */
/* kinds: eat a food · wear a hat · a decoration built anywhere · be petted · a friend visit (kitten) */
const CW_DECOR = ['kvetiny', 'lampiony', 'houpacka', 'kasna', 'kocici_strom', 'lavicka', 'lucerna', 'ptaci_budka', 'zvonkohra', 'altan', 'lazne', 'dalekohled'];
function makeCatWish(c) {
  const opts = [];
  const foods = FOODS.filter(k => ITEMS[k] && producible(k));
  if (foods.length) opts.push(() => ({ kind: 'eat', item: pick(foods) }));
  opts.push(() => ({ kind: 'pet', n: 3, got: 0 }));
  if (!c.hat && Object.keys(HATS).some(k => !HATS[k].event)) opts.push(() => ({ kind: 'hat' }));
  const decor = CW_DECOR.filter(k => B[k] && isUnlockedB(k));
  if (decor.length) opts.push(() => { const k = pick(decor); return { kind: 'decor', item: k, base: BLIST.filter(b => b.type === k && b.built).length }; });
  if (!opts.length) return null;
  const w = pick(opts)(); w.until = G.t + DAY * 1.5; return w;
}
function cwText(c) {
  const w = c.cwish; if (!w) return '';
  if (w.kind === 'eat') return `by si dala ${itemName(w.item).toLowerCase()}`;
  if (w.kind === 'pet') return `chce pohladit (${w.got}/${w.n})`;
  if (w.kind === 'hat') return 'by chtěla klobouček';
  if (w.kind === 'decor') return `by chtěla novou ozdobu: ${B[w.item].n.toLowerCase()}`;
  return '';
}
function cwDone(c, why) {
  const w = c.cwish; c.cwish = null; c.cwishCd = G.t + DAY * rand(0.6, 1.2);
  c.mood = Math.min(100, c.mood + 20); emote(c, 'heart', 4);
  const coins = 20 + eraOf() * 15; G.coins += coins; G.stats.earned += coins;
  G.stats.catWishes = (G.stats.catWishes || 0) + 1;
  for (let i = 0; i < 6; i++) addPart(c.x + rand(-6, 6), c.y - 10, rand(-8, 8), rand(-24, -12), '#ff6f9c', rand(0.6, 1), { g: 0, k: 'heart', drag: 1 });
  toast(`${c.name} má radost — splnil se jí sen! (+${coins} mincí)`); Sound.purr();
}
MORNING_HOOKS.push(() => {
  for (const c of G.cats) {
    if (c.kitten > G.t) continue;
    if (c.cwish && c.cwish.until < G.t) { c.cwish = null; c.cwishCd = G.t + DAY * 0.5; }
    if (!c.cwish && !(c.cwishCd > G.t) && Math.random() < 0.35) c.cwish = makeCatWish(c);
  }
});
/* check progress */
let cwT = 0;
STEP_HOOKS.push(dt => {
  cwT -= dt; if (cwT > 0) return; cwT = 1;
  for (const c of G.cats) {
    const w = c.cwish; if (!w) continue;
    if (w.kind === 'hat' && c.hat) cwDone(c);
    else if (w.kind === 'decor' && BLIST.filter(b => b.type === w.item && b.built).length > w.base) cwDone(c);
  }
});
const _petCatW = petCat;
petCat = function (c) {
  const before = c.petT; _petCatW(c);
  if (c.petT !== before && c.cwish && c.cwish.kind === 'pet') { c.cwish.got++; if (c.cwish.got >= c.cwish.n) cwDone(c); }
};
/* eating: detect when the wished food is eaten (stock or building output drops while the cat eats) */
const _moodTargetW = moodTarget;
moodTarget = function (c) { let m = _moodTargetW(c); if (c.cwish) m -= 2; return clamp(m, 0, 100); };
STEP_HOOKS.push(() => {
  for (const c of G.cats) {
    const w = c.cwish, k = c.task;
    if (!w || w.kind !== 'eat' || !k || k.kind !== 'eat') { if (c._cwEat) c._cwEat = false; continue; }
    if (k.item === w.item && k.stage === 'done' && !c._cwEat) { c._cwEat = true; cwDone(c); }
  }
});
/* let hungry cats prefer their wished food */
const _eatTaskW = eatTask;
eatTask = function (c) {
  if (c && c.cwish && c.cwish.kind === 'eat' && avail(c.cwish.item) > 0) return { kind: 'eat', item: c.cwish.item, stage: 'src' };
  return _eatTaskW(c);
};
/* thought bubble over the cat (blinks so it doesn't clutter the map) */
ENT_HOOKS.push((E, t) => {
  for (const c of G.cats) {
    const w = c.cwish; if (!w || c.inside || c.emote || c.sleeping) continue;
    if (((t + c.id * 0.7) % 6) > 2.5) continue;
    if (c.x < VX - 16 || c.x > VX + VW + 16 || c.y < VY - 8 || c.y > VY + VH + 24) continue;
    const content = w.kind === 'eat' ? { item: w.item } : w.kind === 'decor' ? 'star' : w.kind === 'hat' ? 'note' : 'heart';
    E.push([c.y + 1, 9, 0, 0, () => LATE.push(['bub', c.x, c.y - 14, content])]);
  }
});
const _inspectCatW = inspectCat;
inspectCat = function (c) {
  let h = _inspectCatW(c); if (!c || !c.cwish) return h;
  const w = c.cwish, left = Math.max(1, Math.ceil((w.until - G.t) / DAY * 24));
  let how = w.kind === 'eat' ? 'Až bude ve skladu, sama si pro to dojde.' : w.kind === 'pet' ? 'Klikni na ni.' : w.kind === 'hat' ? 'Nasaď jí klobouček níže.' : 'Postav ji kdekoli v osadě.';
  return h + `<div class="pill wait">Přání: ${c.name} ${cwText(c)} · zbývá ${left} h</div><p class="muted">${how}</p>`;
};
/* cats tab: list current wishes */
const _paneCatsW = paneCats;
paneCats = function () {
  const ws = G.cats.filter(c => c.cwish);
  let h = _paneCatsW();
  if (ws.length) h = h.replace(/(<\/div>)/, `$1<div class="fest wishes"><div class="fhead"><b>Přání koček</b><small>${ws.length}</small></div>${ws.map(c => `<button class="srow link-row" data-act="selcat" data-arg="${c.id}"><span class="sn">${c.name}</span><small>${cwText(c)}</small></button>`).join('')}</div>`);
  return h;
};
ACH.push(['sny', 'Plnitel snů', () => (G.stats.catWishes || 0) >= 10]);
{ const p = HELP.find(x => x.id === 'kocky'); if (p) p.t += `<p><b>Přání koček:</b> kočka si občas něco přeje — oblíbené jídlo, klobouček, novou ozdobu nebo pohlazení. Uvidíš bublinu nad její hlavou a seznam v záložce Kočky. Splněné přání = velká radost a pár mincí.</p>`; }
