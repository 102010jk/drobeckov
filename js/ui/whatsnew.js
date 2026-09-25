'use strict';
/* ============ "What's new" window after an update (reads CHANGELOG.md) ============ */
function mdLite(md) {
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const inline = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/`(.+?)`/g, '<code>$1</code>');
  let h = '', inList = false;
  for (const line of md.split(/\r?\n/)) {
    if (/^\s*-\s+/.test(line)) { if (!inList) { h += '<ul>'; inList = true; } h += '<li>' + inline(line.replace(/^\s*-\s+/, '')) + '</li>'; continue; }
    if (inList) { h += '</ul>'; inList = false; }
    if (/^## /.test(line)) h += '<h3>' + inline(line.slice(3)) + '</h3>';
    else if (/^### /.test(line)) h += '<h4>' + inline(line.slice(4)) + '</h4>';
    else if (line.trim()) h += '<p>' + inline(line) + '</p>';
  }
  return h + (inList ? '</ul>' : '');
}
async function whatsNew(force) {
  let txt;
  try { const r = await fetch('CHANGELOG.md', { cache: 'no-cache' }); if (!r.ok) return; txt = await r.text(); } catch (e) { return; }
  const parts = txt.split(/\n(?=## )/).filter(p => p.startsWith('## '));
  if (!parts.length) return;
  const top = parts[0].split('\n')[0].trim(), seen = store.get('dk_seenVersion', null);
  if (!force && seen === top) return;
  store.set('dk_seenVersion', top);
  if (!force && seen === null) return;   // first visit ever: no pop-up, just remember
  const upto = seen ? parts.findIndex(p => p.split('\n')[0].trim() === seen) : 3;
  const fresh = force ? parts.slice(0, 3) : parts.slice(0, Math.max(1, Math.min(upto < 0 ? 4 : upto, 6)));
  const el = $('menu'); if (!el.hidden && !force) return;
  el.hidden = false;
  el.innerHTML = `<div class="panel nails chamfer mpanel whatsnew"><h1 class="title">Co je nového</h1><p class="sub">Hra se aktualizovala. Tady je, co přibylo:</p><div class="wn-body">${mdLite(fresh.join('\n'))}</div><div class="row"><button class="btn big chamfer" data-m="resume">Hrát!</button><a class="link" href="https://github.com/102010jk/drobeckov/blob/main/CHANGELOG.md" target="_blank" rel="noopener">Celý seznam změn</a></div></div>`;
}
const _startPlayingWN = startPlaying;
startPlaying = function () { _startPlayingWN(); if (!(G && G.visiting)) setTimeout(() => whatsNew(false), 600); };
const _menuActionWN = menuAction;
menuAction = function (m) { if (m === 'whatsnew') { Sound.click(); return whatsNew(true); } return _menuActionWN(m); };
const _showMenuWN = showMenu;
showMenu = function (view) {
  _showMenuWN(view);
  if (!view) { const a = $('menu').querySelector('a[href*="CHANGELOG"]'); if (a) a.outerHTML = '<button class="link" data-m="whatsnew">Co je nového</button>'; }
};
