'use strict';
/* Headless balance robot — dev tool, not loaded by the game.
   In the browser console:  s=document.createElement('script'); s.src='tools/robot.js'; document.body.appendChild(s)
   then:  ROBOT.run(40)   (plays 40 in-game days as fast as possible and prints a report) */
const ROBOT = (() => {
  const PLAN = [
    'pole', 'mlyn', 'pekarna', 'drevorubec', 'pole', 'trziste', 'domek', 'pole', 'kravin', 'zavarovna', 'vcelin', 'domek', 'kuchynka',
    'pila', 'hliniste', 'cihelna', 'lom', 'domek', 'pole', 'sklad', 'piskovna', 'sklarna', 'papirna', 'ovcin', 'tkalcovna', 'domek', 'namesti', 'kolarna', 'drevorubec',
    'dul', 'uhlir', 'tavirna', 'domek', 'dul', 'slevarna', 'kovarna', 'domek', 'pole', 'cukrarna', 'domek', 'dilna', 'domek', 'tovarna', 'domek', 'skola', 'laborator', 'domek'
  ];
  let step = 0, log = [], tries = 0;
  const say = s => { log.push(`d${(G.t / DAY).toFixed(1)} ${s}`); };
  function spotFor(type) {
    const d = B[type], [ox, oy] = [G.origin[0] * PS + 7, G.origin[1] * PS + 5];
    for (let r = 1; r < 40; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
      const x = ox + dx, y = oy + dy;
      if (canPlace(type, x, y).ok) return [x, y];
    }
    return null;
  }
  function buyParcel_() {
    let best = null, bp = 1e9;
    for (const k of G.owned) {
      const [px, py] = Array.isArray(k) ? k : [Math.floor(k / 65536) - 32768, (k % 65536) - 32768];
      for (const [ax, ay] of [[px + 1, py], [px - 1, py], [px, py + 1], [px, py - 1]]) if (!ownedP(ax, ay)) { const p = parcelPrice(ax, ay); if (p < bp) { bp = p; best = [ax, ay]; } }
    }
    if (best && G.coins >= bp + 60) { buyParcel(best[0], best[1]); say('parcel ' + bp); return true; }
    return false;
  }
  function think() {
    for (const o of G.orders.slice()) if (canDeliver(o)) { deliverOrder(o.id); }
    try { festDeliver(); } catch (e) { /* not ready */ }
    if (G.wishes) G.wishes.forEach((w, i) => { if (w.done && !w.claimed) ACTIONS.wish(i); });
    if (G.letters) G.letters.forEach((l, i) => { if (!l.done && canLetter(l)) ACTIONS.letter(i); });
    for (const tr of (G.traders || [])) for (const w of (tr.wants || [])) {
      if (w.qty <= 0) continue;
      if (!(G.tradePrep || {})[w.item] && (G.stock[w.item] || 0) >= 3) ACTIONS.prep(w.item + ':' + Math.min(w.qty, G.stock[w.item]));
      const hub = typeof tradeHub === 'function' && tradeHub(tr); if (hub && (hub.inp[w.item] || 0) > 0) { const t0 = toast; toast = () => {}; ACTIONS.tsell(tr.id + ':' + w.item); toast = t0; }
    }
    for (const k in G.stock) if (G.stock[k] > 25 && ITEMS[k] && FOODS && !FOODS[k]) G.sell[k] = true; else if (G.stock[k] < 8) G.sell[k] = false;
    // follow the advisor like a sensible player would
    for (const pr of advProblems()) {
      const [kind, , , act] = pr;
      if ((kind === 'hunger' || kind === 'staff') && act.startsWith('b:')) {
        const b = G.bld[+act.slice(2)];
        const free = G.cats.find(c => !c.job && !(c.kitten > G.t)) || G.cats.find(c => c.job && G.bld[c.job] && ['trziste', 'drevorubec'].includes(G.bld[c.job].type) && (G.stock.drevo || 0) > 10);
        if (b && free) { if (free.job) unassign(free.id); assignWorker(b, free.id); say('assign ' + free.name + ' -> ' + b.type); }
      }
      if (kind === 'cozy' && G.coins > 40) { const s = spotFor('kvetiny'); if (s) place('kvetiny', s[0], s[1]); }
      if (kind === 'full' && G.coins > 200) { const t = isUnlockedB('sklad') ? 'sklad' : 'spizirna'; const s = spotFor(t); if (s && !BLIST.some(b => b.type === t && !b.built)) { place(t, s[0], s[1]); say('build ' + t + ' (full)'); } }
      if (kind === 'wood') { const s = spotFor('drevorubec'); if (s) place('drevorubec', s[0], s[1]); }
    }
    const food = FOODS.reduce((a, k) => a + (G.stock[k] || 0), 0), bakeries = BLIST.filter(b => b.type === 'pekarna').length;
    if (food < G.cats.length * 2 && bakeries < Math.ceil(G.cats.length / 4) && G.coins > 260) { for (const t of ['pole', 'mlyn', 'pekarna']) { const s = spotFor(t); if (s) place(t, s[0], s[1]); } say('scale food (' + bakeries + ' bakeries)'); }
    if (freeBeds() <= 0 && G.coins > 120 && isUnlockedB('domek') && !BLIST.some(b => !b.built && b.type === 'domek')) { const s = spotFor('domek'); if (s) { place('domek', s[0], s[1]); say('extra domek'); } }
    const type = PLAN[step]; if (!type) return;
    if (!isUnlockedB(type)) { if (B[type].lock || B[type].era > eraOf() + 1) { step++; say('skip ' + type + ' (' + lockReason(type) + ')'); } return; }
    if (G.coins < B[type].cost + 20) return;
    const s = spotFor(type);
    if (!s) { if (++tries > 3) { step++; tries = 0; say('skip ' + type + ' (no spot)'); return; } buyParcel_(); return; }
    tries = 0;
    const nb = place(type, s[0], s[1]); say('build ' + type + ' era' + eraOf()); step++;
    if (type === 'pole') { const f = BLIST.filter(b => b.type === 'pole'); const b = f[f.length - 1]; if (b && f.length % 2 === 0) setCrop(b, 'mrkev'); }
  }
  function run(days) {
    saveGame = () => true;
    const t0 = performance.now(), end = G.t + days * DAY, eraAt = [];
    let tt = 0;
    while (G.t < end) {
      simStep(0.25); tt += 0.25;
      if (tt >= 4) { tt = 0; think(); }
      if (!eraAt[eraOf()]) { eraAt[eraOf()] = (G.t / DAY).toFixed(1); say('ERA ' + eraOf()); }
    }
    const rep = { days, ms: Math.round(performance.now() - t0), era: eraOf(), eraAt, coins: Math.round(G.coins), earned: Math.round(G.stats.earned), cats: G.cats.length, bld: BLIST.length, parcels: G.owned.length, orders: G.stats.orders, fests: G.stats.fests, planStep: step + '/' + PLAN.length, next: PLAN[step], moodAvg: Math.round(G.cats.reduce((a, c) => a + c.mood, 0) / G.cats.length), hungry: G.cats.filter(c => c.food < 20).length, store: stockTotal() + '/' + capacity(), made: G.stats.made };
    console.log(JSON.stringify(rep));
    return rep;
  }
  return { run, log, PLAN, get step() { return step; } };
})();
