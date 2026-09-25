'use strict';
/* ============ main menu & save slots ============ */
let started = false, menuConfirm = '';
function fmtTime(s) { s = Math.floor(s || 0); const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60; return h ? `${h} h ${m} min` : `${m} min`; }
function showMenu(view) {
  const el = $('menu'); el.hidden = false;
  const idx = slotIndex();
  let h = `<div class="panel nails chamfer mpanel"><h1 class="title">Drobečkov</h1><p class="sub">${started && G ? G.name + ' · ' + SEASONS[seasonIdx()].name + ', den ' + dayInSeason() + ', rok ' + yearIdx() : 'útulná kočičí osada v nekonečném údolí'}</p>`;
  if (view === 'new') {
    h += `<div class="form"><label for="nName">Název osady</label><input id="nName" maxlength="28" value="${randomTownName()}">
      <label for="nSeed">Semínko světa <small>(prázdné = náhodné, stejné semínko = stejný svět)</small></label><input id="nSeed" maxlength="24" placeholder="např. 1234 nebo kočka">
      <label for="nMode">Herní režim</label><select id="nMode">${Object.keys(MODES).map(k => `<option value="${k}" ${k === 'normal' ? 'selected' : ''}>${MODES[k].n}</option>`).join('')}</select><small class="muted">${Object.keys(MODES).filter(k => k !== 'normal').map(k => `<b>${MODES[k].n}:</b> ${MODES[k].d}`).join('<br>')}</small>
      <div class="row"><button class="btn chamfer" data-m="create">Založit osadu</button><button class="btn alt chamfer" data-m="back">Zpět</button></div></div>`;
  } else if (view === 'import') {
    h += `<div class="form"><label for="impText">Vlož kód uložené hry (začíná „DK2:“)</label><textarea id="impText" rows="5"></textarea>
      <label for="impFile">…nebo nahraj soubor s kódem</label><input type="file" id="impFile" accept=".txt,text/plain">
      <div class="row"><button class="btn chamfer" data-m="doimport">Načíst</button><button class="btn alt chamfer" data-m="back">Zpět</button></div><p class="muted" id="impMsg"></p></div>`;
  } else if (view && view.startsWith('export:')) {
    const code = exportSlot(view.slice(7));
    h += `<div class="form"><label for="expText">Kód uložené hry — zkopíruj si ho (např. do poznámek) a ve škole ho vlož přes Import.</label><textarea id="expText" rows="6" readonly>${code}</textarea>
      <div class="row"><button class="btn chamfer" data-m="copy">Zkopírovat</button><button class="btn alt chamfer" data-m="back">Zpět</button></div><p class="muted" id="impMsg">${Math.round(code.length / 1024)} KB</p></div>`;
  } else if (view === 'settings') {
    const opt = (v, cur, t) => `<option value="${v}" ${String(cur) === String(v) ? 'selected' : ''}>${t}</option>`;
    h += `<div class="form settings"><label for="sMus">Hudba <small id="sMusV">${Math.round(SET.music * 100)} %</small></label><input type="range" id="sMus" min="0" max="1" step="0.05" value="${SET.music}">
      <label for="sSfx">Zvuky <small id="sSfxV">${Math.round(SET.sfx * 100)} %</small></label><input type="range" id="sSfx" min="0" max="1" step="0.05" value="${SET.sfx}">
      <label for="sUi">Velikost písma a panelů</label><select id="sUi">${opt(0.85, SET.ui, 'Malá')}${opt(1, SET.ui, 'Normální')}${opt(1.15, SET.ui, 'Větší')}${opt(1.3, SET.ui, 'Velká')}</select>
      <label for="sSave">Automatické ukládání</label><select id="sSave">${opt(30, SET.autosave, 'Každých 30 s')}${opt(60, SET.autosave, 'Každou minutu')}${opt(180, SET.autosave, 'Každé 3 minuty')}${opt(0, SET.autosave, 'Vypnuto (jen ráno a ručně)')}</select>
      <label class="chk"><input type="checkbox" id="sNat" ${SET.nature !== false ? 'checked' : ''}> Zvuky přírody <small>(ptáci, cvrčci, déšť, vítr)</small></label>
      <label class="chk"><input type="checkbox" id="sLow" ${SET.lowfx ? 'checked' : ''}> Úsporné efekty <small>(méně částic — pro slabší počítače)</small></label>
      <label class="chk"><input type="checkbox" id="sFps" ${SET.fps30 ? 'checked' : ''}> Omezit na 30 snímků/s <small>(šetří baterku a slabé počítače)</small></label>
      <div class="row"><button class="btn chamfer" data-m="back">Hotovo</button></div></div>`;
  } else {
    h += '<div class="row">';
    if (started) h += `<button class="btn chamfer" data-m="resume">Pokračovat</button><button class="btn alt chamfer" data-m="save">Uložit</button><button class="btn alt chamfer" data-m="saveas">Uložit jako novou</button>`;
    else if (idx.last && idx.slots.some(s => s.id === idx.last)) h += `<button class="btn big chamfer" data-m="load:${idx.last}">Pokračovat</button>`;
    h += `<button class="btn ${started || idx.slots.length ? 'alt' : 'big'} chamfer" data-m="new">Nová hra</button></div>`;
    if (idx.slots.length) {
      h += '<h4>Uložené hry</h4><div class="slots">';
      for (const s of idx.slots) {
        const cur = G && s.id === G.slot && started;
        h += `<div class="slot ${cur ? 'cur' : ''}">${s.thumb ? `<img src="${s.thumb}" width="72" height="48" alt="">` : '<span class="nothumb"></span>'}
          <div class="st"><b>${s.name}</b><small>${s.mode && s.mode !== 'normal' && MODES[s.mode] ? MODES[s.mode].n + ' · ' : ''}${SEASONS[s.season] ? SEASONS[s.season].name : ''}, rok ${s.year} · ${s.cats} koček · ${s.mode === 'kreativ' ? '∞' : fmt(s.coins)} mincí · ${fmtTime(s.playTime)}</small><small>${new Date(s.savedAt).toLocaleString('cs-CZ')}</small></div>
          <div class="sb">${cur ? '<small>hraješ</small>' : `<button class="link" data-m="load:${s.id}">Načíst</button>`}<button class="link" data-m="export:${s.id}">Export</button><button class="link ${menuConfirm === s.id ? 'poor' : ''}" data-m="del:${s.id}">${menuConfirm === s.id ? 'Opravdu?' : 'Smazat'}</button></div></div>`;
      }
      h += '</div>';
    }
    h += `<div class="row"><button class="link" data-m="import">Importovat kód</button><button class="link" data-m="help">Nápověda</button><button class="link" data-m="settings">Nastavení</button><a class="link" href="https://github.com/102010jk/drobeckov/blob/main/CHANGELOG.md" target="_blank" rel="noopener">Co je nového</a></div>`;
    h += `<p class="help">Táhni myší = posun · kolečko = zoom · klik = vybrat/postavit · pravé tlačítko/Esc = zrušit · mezerník = pauza · 1–3 = rychlost · X = zbourat · L = pozemky · Q = kapátko · Ctrl+Z = zpět · P = fotka</p>`;
  }
  el.innerHTML = h + '</div>';
  if (view === 'settings') {
    const on = (id, ev, fn) => { const e = $(id); if (e) e.addEventListener(ev, () => { fn(e); saveSettings(); }); };
    on('sMus', 'input', e => { SET.music = +e.value; $('sMusV').textContent = Math.round(SET.music * 100) + ' %'; Sound.applyVol(); });
    on('sSfx', 'input', e => { SET.sfx = +e.value; $('sSfxV').textContent = Math.round(SET.sfx * 100) + ' %'; Sound.applyVol(); Sound.click(); });
    on('sUi', 'change', e => { SET.ui = +e.value; applyUiScale(); });
    on('sSave', 'change', e => { SET.autosave = +e.value; });
    on('sLow', 'change', e => { SET.lowfx = e.checked; });
    on('sNat', 'change', e => { SET.nature = e.checked; });
    on('sFps', 'change', e => { SET.fps30 = e.checked; });
  }
  const f = $('impFile'); if (f) f.addEventListener('change', () => { const file = f.files[0]; if (!file) return; const rd = new FileReader(); rd.onload = () => { $('impText').value = rd.result; }; rd.readAsText(file); });
}
function applyUiScale() { document.body.style.fontSize = (15 * (SET.ui || 1)) + 'px'; if (typeof fitCanvas === 'function') setTimeout(fitCanvas, 0); }
applyUiScale();
function hideMenu() { $('menu').hidden = true; }
function startPlaying() {
  hideMenu(); started = true;
  Sound.init(); Sound.setSeason(seasonIdx()); Sound.music(1);
  UI.lastPane = ''; renderPane(true); renderHUD(); renderTut();
  minimapDirty = true;
}
function menuAction(m) {
  Sound.click();
  if (m === 'resume') return startPlaying();
  if (m === 'new') return showMenu('new');
  if (m === 'back') return showMenu();
  if (m === 'import') return showMenu('import');
  if (m === 'settings') return showMenu('settings');
  if (m === 'help') { hideMenu(); if (!started) startPlaying(); UI.tab = 'help'; UI.sel = null; renderPane(true); return; }
  if (m === 'save') { if (saveGame()) toast('Uloženo.'); return showMenu(); }
  if (m === 'saveas') { if (saveGame(true)) toast('Uloženo jako nová hra.'); return showMenu(); }
  if (m === 'create') {
    const name = ($('nName').value || '').trim() || randomTownName(), seed = ($('nSeed').value || '').trim();
    newGame({ name, seed, mode: ($('nMode') && $('nMode').value) || 'normal' }); saveGame(true); banner('Vítej v osadě ' + G.name, 'Babička Ježková ti poradí první kroky.');
    return startPlaying();
  }
  if (m === 'doimport') { const err = importText($('impText').value); if (err) { $('impMsg').textContent = err; return; } toast('Hra načtena.'); return startPlaying(); }
  if (m === 'copy') { const t = $('expText'); t.select(); try { navigator.clipboard.writeText(t.value).then(() => { $('impMsg').textContent = 'Zkopírováno!'; }, () => { $('impMsg').textContent = 'Označeno — zkopíruj Ctrl+C.'; }); } catch (e) { $('impMsg').textContent = 'Označeno — zkopíruj Ctrl+C.'; } return; }
  if (m.startsWith('load:')) { if (started) saveGame(); if (loadSlot(m.slice(5))) startPlaying(); return; }
  if (m.startsWith('export:')) return showMenu(m);
  if (m.startsWith('del:')) { const id = m.slice(4); if (menuConfirm !== id) { menuConfirm = id; setTimeout(() => { menuConfirm = ''; }, 3000); return showMenu(); } menuConfirm = ''; deleteSlot(id); return showMenu(); }
}
