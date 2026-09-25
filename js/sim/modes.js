'use strict';
/* ============ 3.2: game modes — relaxed, normal, hard, creative ============ */
const MODES = {
  klid: { n: 'Klidný', d: 'Kočky méně hladoví, víc mincí na začátku a zakázky platí o 20 % víc.', coins: 700, hunger: 0.7, pay: 1.2, parcel: 0.85 },
  normal: { n: 'Normální', d: 'Tak, jak je hra myšlená.', coins: 400, hunger: 1, pay: 1, parcel: 1 },
  narocny: { n: 'Náročný', d: 'Méně mincí, kočky víc hladoví, dražší pozemky a zakázky platí méně.', coins: 250, hunger: 1.3, pay: 0.85, parcel: 1.3 },
  kreativ: { n: 'Kreativní', d: 'Neomezené mince, všechno odemčené, stavby hned hotové, kočky nehladoví. Na volné stavění (bez úspěchů).', coins: 1e9, hunger: 0, pay: 1, parcel: 0 }
};
const modeOf = () => (G && MODES[G.mode]) || MODES.normal;
function modeVal(k, d) { const m = modeOf(); return m[k] == null ? d : m[k]; }
const isCreative = () => G && G.mode === 'kreativ';

const _newGameM = newGame;
newGame = function (opts) {
  _newGameM(opts);
  G.mode = (opts && MODES[opts.mode]) ? opts.mode : 'normal';
  G.coins = modeOf().coins;
  if (isCreative()) unlockAllCreative();
};
function unlockAllCreative() {
  G.era = ERAS.length - 1;
  for (const k in TECH) G.tech[k] = true;
  for (const t in B) if (B[t].bp) G.flags['bp_' + B[t].bp] = true;
  for (const k in NEIGH) G.nb[k] = Math.max(G.nb[k] || 0, HEART_XP[10] || 999);
  for (const c in CROPS) if (CROPS[c].seed) G.flags['seed_' + c] = true;
  G.stock.drevo = Math.max(G.stock.drevo || 0, 50);
  if (G.tut) G.tut.skip = true;
}
const _addOrderM = addOrder;
addOrder = function (nb, lines, extra) { _addOrderM(nb, lines, extra); const o = G.orders[G.orders.length - 1]; if (o && modeVal('pay', 1) !== 1) o.coins = Math.round(o.coins * modeVal('pay', 1)); };
const _parcelPriceM = parcelPrice;
parcelPrice = function (px, py) { return Math.round(_parcelPriceM(px, py) * modeVal('parcel', 1) / 5) * 5; };

/* creative: everything is free and builds instantly */
const _costOKM = costOK;
costOK = function (d) { return isCreative() ? '' : _costOKM(d); };
const _placeM = place;
place = function (type, x, y) {
  const b = _placeM(type, x, y);
  if (isCreative() && b && !b.built) { b.need = {}; b.work = 0; completeBuilding(b); }
  return b;
};
const _upgWhyM = upgWhy;
upgWhy = function (b) { if (isCreative()) { const lv = b.lvl || 1; return lv >= UPG_MAX ? 'Nejvyšší úroveň' : !b.built ? 'Nejdřív dostav' : ''; } return _upgWhyM(b); };
const _upgradeM = ACTIONS.upgrade;
ACTIONS.upgrade = id => { if (isCreative()) { const b = G.bld[+id], c = b && upgCost(b); if (c) { for (const k in c.mat) addStock(k, c.mat[k]); G.coins += c.coins; } } _upgradeM(id); };
STEP_HOOKS.push(() => { if (isCreative()) { if (G.coins < 1e8) G.coins = 1e9; for (const c of G.cats) if (c.food < 60) c.food = 90; } });
const _renderHUDM = renderHUD;
renderHUD = function () { _renderHUDM(); if (isCreative()) $('coins').textContent = '∞'; };
/* no achievements in creative mode */
for (const a of ACH) { const f = a[2]; a[2] = () => !isCreative() && f(); }
