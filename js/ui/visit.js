'use strict';
/* ============ 3.5: visit a friend's town (read-only), download save file, share seed ============ */
let VISIT = null;   // { home: slot id } while visiting
const visiting = () => !!(G && G.visiting);

function parseCode(text) {
  text = (text || '').trim();
  if (!text.startsWith('DK2:')) return [null, 'Tohle není kód osady (má začínat „DK2:“).'];
  try { const s = JSON.parse(LZ.decompress(LZ.fromText(text.slice(4)))); if (!s || s.v !== 2) return [null, 'Kód je z jiné verze hry.']; return [s, '']; }
  catch (e) { return [null, 'Kód je poškozený nebo neúplný.']; }
}
function startVisit(text) {
  const [s, err] = parseCode(text); if (err) return err;
  const home = G && started && !G.visiting ? G.slot : (VISIT ? VISIT.home : null);
  if (G && started && !G.visiting) saveGame();
  if (!deserialize(s)) return 'Osadu se nepodařilo načíst.';
  G.visiting = true; G.slot = null; VISIT = { home };
  startPlaying(); UI.speed = 1; UI.tab = 'cats';
  banner('Návštěva: ' + G.name, 'Rozhlédni se, pohlaď kočky. Nic tady nezměníš a nic se neuloží.');
  showVisitBar();
  return '';
}
function endVisit() {
  const home = VISIT && VISIT.home; VISIT = null;
  $('visitBar').hidden = true;
  if (home && loadSlot(home)) { startPlaying(); toast('Jsi zase doma v osadě ' + G.name + '.'); return; }
  const idx = slotIndex();
  if (idx.last && loadSlot(idx.last)) { startPlaying(); return; }
  newGame({}); showMenu();
}
function showVisitBar() {
  let el = $('visitBar');
  if (!el) { el = document.createElement('div'); el.id = 'visitBar'; el.className = 'panel chamfer'; $('view').appendChild(el); el.addEventListener('click', e => { if (e.target.closest('[data-visit="home"]')) endVisit(); }); }
  el.hidden = false;
  el.innerHTML = `<span>🏡 Na návštěvě v osadě <b>${G.name}</b> · ${G.cats.length} koček · ${BLIST.length} staveb · éra ${ERAS[eraOf()].n}</span><button class="btn small chamfer" data-visit="home">Vrátit se domů</button>`;
}
/* nothing changes and nothing saves while visiting */
const _saveGameV = saveGame;
saveGame = function (asNew) { if (visiting()) return true; return _saveGameV(asNew); };
const _canPlaceV = canPlace;
canPlace = function (type, x, y) { if (visiting()) return { ok: false, why: 'Na návštěvě se nestaví' }; return _canPlaceV(type, x, y); };
const _buyParcelV = buyParcel;
buyParcel = function (px, py, free) { if (visiting()) { toast('Na návštěvě se pozemky nekupují.'); return false; } return _buyParcelV(px, py, free); };
const _demolishAtV = demolishAt;
demolishAt = function (x, y) { if (visiting()) { toast('Na návštěvě se nebourá.'); return false; } return _demolishAtV(x, y); };
const _uiActionV = uiAction;
uiAction = function (act, arg) {
  if (visiting() && !['tab', 'bcat', 'close', 'selcat', 'selb', 'pet', 'help', 'follow'].includes(act)) { toast('Na návštěvě jen koukáš a hladíš kočky.'); return; }
  return _uiActionV(act, arg);
};

/* menu: visit view, download button, entry link */
const _showMenuV = showMenu;
showMenu = function (view) {
  if (view === 'visit') {
    const el = $('menu'); el.hidden = false;
    el.innerHTML = `<div class="panel nails chamfer mpanel"><h1 class="title">Návštěva</h1><p class="sub">Vlož kód osady od kamaráda (Menu → Export u jeho hry). Jeho osadu si prohlédneš, ale nic v ní nezměníš a tvoje hra zůstane v bezpečí.</p>
      <div class="form"><label for="visText">Kód osady (začíná „DK2:“)</label><textarea id="visText" rows="5"></textarea>
      <label for="visFile">…nebo nahraj soubor</label><input type="file" id="visFile" accept=".txt,text/plain">
      <div class="row"><button class="btn chamfer" data-m="dovisit">Navštívit</button><button class="btn alt chamfer" data-m="back">Zpět</button></div><p class="muted" id="visMsg"></p></div></div>`;
    const f = $('visFile'); if (f) f.addEventListener('change', () => { const file = f.files[0]; if (!file) return; const rd = new FileReader(); rd.onload = () => { $('visText').value = rd.result; }; rd.readAsText(file); });
    return;
  }
  _showMenuV(view);
  const el = $('menu');
  if (view && view.startsWith('export:')) {
    const row = el.querySelector('.form .row');
    if (row && !el.querySelector('[data-m="download"]')) row.insertAdjacentHTML('afterbegin', `<button class="btn alt chamfer" data-m="download:${view.slice(7)}">Stáhnout soubor</button>`);
  }
  if (!view) {
    const links = el.querySelector('[data-m="import"]');
    if (links && !el.querySelector('[data-m="visit"]')) links.insertAdjacentHTML('afterend', '<button class="link" data-m="visit">Navštívit kamaráda</button>');
    if (visiting()) { const r = el.querySelector('.row'); if (r) r.innerHTML = '<button class="btn chamfer" data-m="resume">Pokračovat v návštěvě</button><button class="btn alt chamfer" data-m="endvisit">Vrátit se domů</button>'; }
  }
};
const _menuActionV = menuAction;
menuAction = function (m) {
  if (m === 'visit') { Sound.click(); return showMenu('visit'); }
  if (m === 'endvisit') { Sound.click(); hideMenu(); return endVisit(); }
  if (m === 'dovisit') { Sound.click(); const err = startVisit($('visText').value); if (err) $('visMsg').textContent = err; return; }
  if (m.startsWith('download:')) {
    Sound.click();
    const id = m.slice(9), code = exportSlot(id), meta = slotIndex().slots.find(s => s.id === id), name = ((meta && meta.name) || (G && G.name) || 'osada').replace(/[^\wÀ-ſ-]+/g, '_');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([code], { type: 'text/plain' })); a.download = `${name}.drobeckov.txt`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    const msg = $('impMsg'); if (msg) msg.textContent = 'Soubor se stahuje — najdeš ho ve Stažených souborech.';
    return;
  }
  if (visiting() && ['save', 'saveas', 'new', 'create', 'doimport'].includes(m) || (visiting() && m.startsWith('load:'))) { VISIT = null; G.visiting = false; const vb = $('visitBar'); if (vb) vb.hidden = true; if (m === 'save' || m === 'saveas') { toast('Cizí osadu nejde uložit.'); return showMenu(); } }
  return _menuActionV(m);
};
/* the world keeps a visiting flag only in memory */
if (typeof G_TRANSIENT !== 'undefined') G_TRANSIENT.push('visiting');

/* share the world seed on the stats page */
const _helpTabV = EXTRA_TABS.help;
EXTRA_TABS.help = () => {
  let h = _helpTabV();
  if (helpPage === 'stats') h = h.replace('<h3>Osada</h3>', `<h3>Osada</h3><p>Semínko světa: <b>${G.seed}</b> — pošli ho kamarádovi a bude mít stejné údolí jako ty (Nová hra → Semínko).</p>`);
  return h;
};
{ const p = HELP.find(x => x.id === 'ulozeni'); if (p) p.t += `<p><b>Stáhnout soubor:</b> u Exportu je tlačítko, které uloží kód do souboru (třeba na flešku). <b>Navštívit kamaráda:</b> v Menu vlož kód jeho osady a prohlédni si ji — nic se v ní nezmění a tvoje hra zůstane v bezpečí.</p>`; }
