'use strict';
/* ============ ships, sailors and city guild orders ============ */
SPECS.namornik = {
  n: 'námořník', wants: { ryby_more: 3, latka: 3, polstar: 2, sklo: 3, naradi: 3, sperky: 2, cokoladovy_dort: 2, ocel: 2, bronz: 2, most: 2, dzem: 2, zlato: 1 },
  sells: [['kakao', 0.9], ['koreni', 0.9], ['ruda_sn', 0.7], ['bauxit', 0.7], ['ruda_au', 0.4], ['cin', 0.5], ['bp', 0.4]]
};
const _genTrader = genTrader;
genTrader = function (kind) {
  const t = _genTrader(kind);
  if (kind === 'lod') {
    const S = SPECS.namornik;
    const wantsAll = Object.entries(S.wants).filter(([k]) => ITEMS[k] && producible(k));
    t.spec = 'namornik'; t.sp = pick(['vydra', 'tucnak', 'kachna', 'bobr']); t.wants = [];
    for (let i = 0; i < 4 && wantsAll.length; i++) { const k = weighted(wantsAll); wantsAll.splice(wantsAll.findIndex(e => e[0] === k), 1); t.wants.push({ item: k, mult: +(1.4 + Math.random() * 0.7).toFixed(2), qty: Math.max(4, Math.round(80 / ITEMS[k].v * rand(0.7, 1.2))) }); }
    t.sells = [];
    for (const [k, w] of S.sells) {
      if (Math.random() > w) continue;
      if (k === 'bp') { const free = BLUEPRINTS.filter(b => !G.flags['bp_' + b]); if (free.length) { const b = pick(free); t.sells.push({ bp: b, price: B[b].bpPrice || 150 }); } }
      else t.sells.push({ item: k, price: Math.round(ITEMS[k].v * rand(1.2, 1.6)), qty: Math.max(6, Math.round(50 / ITEMS[k].v)) });
    }
    t.leave = G.t + DAY * rand(1.4, 2);
  }
  return t;
};
function dockFor(h) {
  let best = null, bd = 1e9;
  for (let y = h.y - 6; y < h.y + h.h + 6; y++) for (let x = h.x - 6; x < h.x + h.w + 6; x++) {
    const t = tile(x, y); if (t.bio !== 'sea' || t.gr === 'bridge') continue;
    const d = Math.abs(x - (h.x + 1)) + Math.abs(y - (h.y + 1)) + (t.gr === 'deep' ? 0 : 1.5); if (d < bd) { bd = d; best = [x, y]; }
  }
  if (!best) return null;
  let from = best, fd = 0;
  for (let a = 0; a < 16; a++) {
    const dx = Math.cos(a / 16 * Math.PI * 2), dy = Math.sin(a / 16 * Math.PI * 2);
    let ok = 0;
    for (let d = 1; d <= 16; d++) { if (tile(Math.round(best[0] + dx * d), Math.round(best[1] + dy * d)).bio === 'sea') ok = d; else break; }
    if (ok > fd) { fd = ok; from = [Math.round(best[0] + dx * ok), Math.round(best[1] + dy * ok)]; }
  }
  return { dock: best, from };
}
MORNING_HOOKS.push(() => {
  const h = BLIST.find(b => b.type === 'pristav' && b.built);
  if (!h) return;
  if (!G.traders) G.traders = [];
  if (G.traders.some(t => t.kind === 'lod')) return;
  G.shipT = (G.shipT == null ? 1 : G.shipT) - 1;
  if (G.shipT > 0) return;
  G.shipT = G.flags.majak || countB('majak') ? randi(1, 2) : randi(2, 3);
  const t = genTrader('lod'), dk = dockFor(h);
  if (dk) { t.dock = dk.dock; t.from = dk.from; t.arrT = G.t; }
  G.traders.push(t);
  banner('Připlula loď!', `${t.name} (${ANIMALS[t.sp].n}) kotví v přístavu s exotickým zbožím.`);
  Sound.deliver();
});
const SHIP = (() => {
  const [c, g] = mk(34, 30);
  shape(g, [[3, 20, 28, 6, '#8a5230'], [6, 26, 22, 2, '#6b4128']]); R(g, '#a8693e', 3, 20, 28, 1); R(g, '#fff3dc', 5, 22, 24, 1);
  shape(g, [[16, 1, 2, 19, '#6b4128']]);
  shape(g, [[8, 4, 8, 13, '#fff3dc'], [18, 6, 9, 11, '#fff3dc']]); R(g, '#e8d4b0', 8, 14, 8, 3); R(g, '#e8d4b0', 18, 14, 9, 3);
  R(g, '#e8484e', 18, 1, 5, 2);
  return c;
})();
ENT_HOOKS.push((E, t) => {
  if (!G.traders) return;
  for (const tr of G.traders) {
    if (tr.kind !== 'lod' || !tr.dock) continue;
    const k = Math.min(1, (G.t - (tr.arrT || 0)) / 25), ease = 1 - Math.pow(1 - k, 3);
    const x = (tr.from[0] + (tr.dock[0] - tr.from[0]) * ease) * TS - 9, y = (tr.from[1] + (tr.dock[1] - tr.from[1]) * ease) * TS - 14 + Math.round(Math.sin(t * 1.5) * 1);
    if (x < VX - 40 || x > VX + VW + 40 || y < VY - 40 || y > VY + VH + 40) continue;
    E.push([y + 28, 9, 0, 0, g => { g.drawImage(SHIP, Math.round(x), Math.round(y)); if (k < 1 && Math.random() < 0.3) addPart(x + 4, y + 26, rand(-6, 0), rand(-4, 0), '#ffffff', 0.5, { g: 0 }); }]);
  }
});

/* ---------- guild orders ---------- */
ORDER_SOURCES.push(() => {
  const cands = Object.keys(CLIENTS).filter(k => CLIENTS[k].era <= eraOf() && (!CLIENTS[k].need || CLIENTS[k].need()) && !G.orders.some(o => o.nb === k));
  if (!cands.length) return false;
  const nb = pick(cands), C = CLIENTS[nb];
  const prefs = Object.entries(C.wants).filter(([k]) => ITEMS[k] && producible(k));
  if (!prefs.length) return false;
  const lines = [], nl = C.big ? 3 : randi(1, 2);
  for (let i = 0; i < nl && prefs.length; i++) {
    const item = weighted(prefs); prefs.splice(prefs.findIndex(p => p[0] === item), 1);
    lines.push([item, Math.max(2, Math.round(clamp(30 / ITEMS[item].v, 1, 12) * (C.big ? 2.5 : 1) * rand(0.7, 1.2)))]);
  }
  const val = lines.reduce((a, [k, q]) => a + ITEMS[k].v * q, 0), rep = (G.clientRep && G.clientRep[nb]) || 0;
  addOrder(nb, lines, { coins: Math.round(val * (C.big ? 2.2 : 1.8) * (1 + Math.min(rep, 20) * 0.03)), xp: 0, big: !!C.big, exp: G.t + (C.big ? 3 : 2) * DAY });
  return true;
});
function onClientDelivered(o) {
  if (!G.clientRep) G.clientRep = {};
  G.clientRep[o.nb] = (G.clientRep[o.nb] || 0) + 1;
  if (G.clientRep[o.nb] % 5 === 0) { const bonus = 150 + G.clientRep[o.nb] * 20; G.coins += bonus; banner(CLIENTS[o.nb].n + ' vám děkuje', `Věrnostní odměna +${bonus} mincí. Jejich zakázky teď platí víc.`); }
}
function paneOrdersExtra() {
  const ks = Object.keys(CLIENTS).filter(k => CLIENTS[k].era <= eraOf());
  if (!ks.length) return '';
  return '<h4>Cechy a kapitáni</h4>' + ks.map(k => `<div class="nb">${animalIcon(CLIENTS[k].sp, 2)}<div class="nbt"><b>${CLIENTS[k].n}</b><small>${(G.clientRep && G.clientRep[k]) || 0} doručených zakázek · každá pátá = bonus${CLIENTS[k].need && !CLIENTS[k].need() ? ' · potřebuje přístav' : ''}</small></div></div>`).join('');
}
