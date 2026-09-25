'use strict';
/* ============ 2.9: building upgrades (level 2 and 3) ============ */
const UPG_MAX = 3;
function canUpgradeType(t) {
  const d = B[t];
  if (!d || d.field || d.interior || d.instant || d.ground || d.tree || d.tool || d.water) return false;
  if (['kosmodrom', 'vez', 'nastenka', 'pristav'].includes(t)) return false;
  return !!(d.workers || d.store || d.beds || d.chop || d.mine);
}
function upgCost(b) {
  const d = B[b.type], size = (b.w || d.w || 1) * (b.h || d.h || 1), lv = b.lvl || 1;
  if (lv === 1) return { coins: Math.round(d.cost * 0.8 + 40), mat: eraOf() >= 1 ? { prkna: 2 * size } : { drevo: 3 * size } };
  return { coins: Math.round(d.cost * 1.6 + 120), mat: { cihly: 3 * size, prkna: 2 * size }, era: 1 };
}
function upgWhy(b) {
  const lv = b.lvl || 1; if (lv >= UPG_MAX) return 'Nejvyšší úroveň';
  if (!b.built) return 'Nejdřív dostav';
  const c = upgCost(b);
  if (c.era && eraOf() < c.era) return 'Úroveň 3 od éry ' + ERAS[c.era].n;
  if (G.coins < c.coins) return 'Chybí mince';
  for (const k in c.mat) if ((G.stock[k] || 0) < c.mat[k]) return 'Chybí ' + itemName(k).toLowerCase();
  return '';
}
function upgBenefit(t) { const d = B[t]; return d.beds ? '+1 pelíšek' : d.store ? '+50 % místa ve skladu' : '+25 % rychlost práce'; }
ACTIONS.upgrade = id => {
  const b = G.bld[+id]; if (!b) return;
  const why = upgWhy(b); if (why) { toast(why); Sound.nope(); return; }
  const c = upgCost(b);
  G.coins -= c.coins; for (const k in c.mat) takeStock(k, c.mat[k]);
  b.lvl = (b.lvl || 1) + 1;
  sparkle(b.x * TS + b.w * 8, b.y * TS + b.h * 8, '#ffd23f', 18, b.w * 6); Sound.built();
  toast(`${B[b.type].n} — úroveň ${b.lvl}! (${upgBenefit(b.type)})`);
  G.stats.upgrades = (G.stats.upgrades || 0) + 1;
  assignHomes(); jobsDirty = true; UI.dirty = true;
};
const _workMulU = workMul;
workMul = function (c, b) { const m = _workMulU(c, b); return b && b.built && b.lvl > 1 ? m * (1 + 0.25 * (b.lvl - 1)) : m; };
const _inspectBldU = inspectBld;
inspectBld = function (b) {
  let h = _inspectBldU(b);
  if (!b || !canUpgradeType(b.type)) return h;
  const lv = b.lvl || 1;
  h += `<h4>Úroveň ${lv}/${UPG_MAX} ${'★'.repeat(lv - 1)}</h4>`;
  if (lv > 1) { const d = B[b.type], n = lv - 1; h += `<p class="muted">Vylepšeno: ${d.beds ? '+' + n + (n > 1 ? ' pelíšky' : ' pelíšek') : d.store ? '+' + 50 * n + ' % místa' : '+' + 25 * n + ' % rychlost práce'}</p>`; }
  if (lv < UPG_MAX && b.built) {
    const c = upgCost(b), why = upgWhy(b);
    h += `<div class="upg"><span>${icon('coin', 1)} ${c.coins} ${Object.entries(c.mat).map(([k, n]) => `${itemIcon(k, 1)}<small>${n}</small>`).join(' ')}</span><button class="btn small chamfer ${why ? 'locked' : ''}" data-act="upgrade" data-arg="${b.id}">Vylepšit (${upgBenefit(b.type)})</button></div>${why ? `<small class="muted">${why}</small>` : ''}`;
  }
  return h;
};
/* little gold stars over upgraded buildings */
const UPG_STAR = buildSprite(['.y.', 'yyy', '.y.'], PAL, OUT);
ENT_HOOKS.push(E => {
  for (const b of VIS_BLD) {
    if (!b.lvl || b.lvl < 2 || !b.built) continue;
    const d = B[b.type], x = (b.x + b.w) * TS - 5, y = b.y * TS - (d.top || 0) - 7;
    E.push([(b.y + b.h) * TS, 9, 0, 0, g => { for (let i = 0; i < b.lvl - 1; i++) g.drawImage(UPG_STAR.c, x - i * 5, y); }]);
  }
});
ACH.push(['vylepseni', 'Stavitel', () => (G.stats.upgrades || 0) >= 5]);
HELP.push({ id: 'upgrady', n: 'Vylepšení budov', t: `<p>Hotové dílny, domky a sklady jde <b>vylepšit</b> až na úroveň 3 (tlačítko v detailu budovy). Mince a materiál se berou rovnou ze skladu.</p>
<p><b>Dílny</b> pracují o 25 % rychleji za každou úroveň, <b>domky</b> mají pelíšek navíc, <b>spižírny a sklady</b> pojmou o polovinu víc.</p>
<p>Úroveň 2 stojí dřevo (v první éře) nebo prkna, úroveň 3 cihly a prkna.</p>` });

/* ============ building overview (bottom of the Sklad tab) ============ */
const _paneStoreU = paneStore;
paneStore = function () {
  let h = _paneStoreU();
  const groups = {}, bad = [];
  for (const b of BLIST) {
    const d = B[b.type]; if (d.ground || d.flower || b.type === 'plot' || b.type === 'cedulka') continue;
    (groups[b.type] = groups[b.type] || []).push(b);
    if (!b.built) continue;
    const [txt, cls] = bStatus(b);
    if (cls === 'bad' || (d.workers && !staffOf(b) && !d.nodoor)) bad.push([b, cls === 'bad' ? txt : 'Nemá pracovníka']);
  }
  h += '<h4>Budovy s problémem</h4>';
  h += bad.length ? bad.slice(0, 12).map(([b, t]) => `<button class="srow link-row" data-act="selb" data-arg="${b.id}"><span class="sn">${B[b.type].n}</span><small class="poor">${t}</small></button>`).join('') : '<p class="muted">Všechno běží.</p>';
  h += '<h4>Všechny budovy</h4><div class="inv">' + Object.keys(groups).sort((a, b) => groups[b].length - groups[a].length).map(t => `<button class="tog" data-act="selb" data-arg="${groups[t][0].id}" title="${B[t].n}">${B[t].n} <b>${groups[t].length}</b></button>`).join(' ') + '</div>';
  return h;
};
ACTIONS.selb = id => { const b = G.bld[+id]; UI.sel = { kind: 'b', id: +id }; UI.pick = false; if (b && !UI.interior) centerOn((b.x + b.w / 2) * TS, (b.y + b.h / 2) * TS); };
