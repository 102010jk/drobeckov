'use strict';
/* ============ 4.2: collection book — every item and fur colour you've discovered ============ */
function seenItem(k) { return (G.stats.made[k] || 0) > 0 || (G.stock[k] || 0) > 0 || !!(G.seen && G.seen[k]); }
/* remember everything that ever lands in the store (bought, found, gifted) */
let seenT = 0;
STEP_HOOKS.push(dt => {
  seenT -= dt; if (seenT > 0) return; seenT = 2;
  if (!G.seen) G.seen = {};
  for (const k in G.stock) if (G.stock[k] > 0) G.seen[k] = 1;
  if (!G.skinsSeen) G.skinsSeen = {};
  for (const c of G.cats) G.skinsSeen[c.skin] = 1;
});
function collectionHTML() {
  const keys = Object.keys(ITEMS).filter(k => SPR[k]);
  const got = keys.filter(seenItem), skins = SKINS.map((s, i) => i), sk = skins.filter(i => G.skinsSeen && G.skinsSeen[i]);
  let h = `<h3>Sbírka</h3><p>Objeveno <b>${got.length}/${keys.length}</b> věcí a <b>${sk.length}/${SKINS.length}</b> barev koček.</p><div class="bar big">${bar(got.length / keys.length * 100)}</div>`;
  h += '<div class="coll">' + keys.map(k => { const s = seenItem(k); return `<span class="ci ${s ? '' : 'unseen'}" title="${s ? itemName(k) : '???'}">${itemIcon(k, 2)}<small>${s ? itemName(k) : '???'}</small></span>`; }).join('') + '</div>';
  h += '<h3>Barvy koček</h3><div class="coll">' + skins.map(i => { const s = G.skinsSeen && G.skinsSeen[i]; return `<span class="ci ${s ? '' : 'unseen'}" title="${s ? SKINS[i].name : '???'}">${catHead(i, 2)}<small>${s ? SKINS[i].name : '???'}</small></span>`; }).join('') + '</div>';
  return h;
}
HELP.push({ id: 'sbirka', n: 'Sbírka', t: '' });
if (typeof OSADA_PAGES !== 'undefined') OSADA_PAGES.splice(2, 0, 'sbirka');
const _helpTabC = EXTRA_TABS.help;
EXTRA_TABS.help = () => {
  if (helpPage !== 'sbirka') return _helpTabC();
  const chips = '<div class="chips">' + HELP.map(p => `<button class="chip-btn ${helpPage === p.id ? 'on' : ''}" data-act="help" data-arg="${p.id}">${p.n}</button>`).join('') + '</div>';
  return chips + '<div class="help-page">' + collectionHTML() + '</div>';
};
ACH.push(['sbirka50', 'Sběratel', () => { const k = Object.keys(ITEMS).filter(x => SPR[x]); return k.filter(seenItem).length >= k.length / 2; }],
  ['sbirka100', 'Kompletní sbírka', () => { const k = Object.keys(ITEMS).filter(x => SPR[x]); return k.every(seenItem); }]);
