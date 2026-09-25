'use strict';
/* ============ 2.8: comfort — priority builds, undo, pipette, signs ============ */

/* ---------- construction priority ---------- */
ACTIONS.prio = id => { const b = G.bld[+id]; if (!b || b.built) return; b.prio = !b.prio; jobsDirty = true; toast(b.prio ? 'Kočky postaví tuhle stavbu přednostně.' : 'Běžné pořadí stavby.'); };
const _inspectBld = inspectBld;
inspectBld = function (b) {
  let h = _inspectBld(b);
  if (b && !b.built) h += `<p><button class="btn small ${b.prio ? '' : 'alt'} chamfer" data-act="prio" data-arg="${b.id}">${b.prio ? '★ Přednostní stavba' : 'Stavět přednostně'}</button></p>`;
  return h;
};

/* ---------- undo the last placement (Ctrl+Z, within 30 s) ---------- */
const UNDO = [];
const _place = place;
place = function (type, x, y) {
  const b = _place(type, x, y);
  if (b) { UNDO.push({ id: b.id, type, at: performance.now() }); if (UNDO.length > 20) UNDO.shift(); }
  return b;
};
function undoPlace() {
  while (UNDO.length) {
    const u = UNDO.pop(), b = G.bld[u.id];
    if (!b || b.type !== u.type || performance.now() - u.at > 30000) continue;
    const d = B[b.type];
    if (b.built && !d.instant) { toast('Tahle stavba už je hotová — zbourej ji klávesou X.'); return; }
    G.coins += d.cost;
    const tot = Object.assign({}, d.mat || {}); if (d.wood) tot.drevo = (tot.drevo || 0) + d.wood;
    for (const k in tot) { const back = d.instant ? tot[k] : tot[k] - ((b.need && b.need[k]) || 0); if (back > 0) addStock(k, back); }
    removeBld(b, true); onBuildingsChanged(); reachDirty = true;
    Sound.click(); toast('Vráceno: ' + d.n); return;
  }
  toast('Není co vrátit.'); Sound.nope();
}

/* ---------- pipette (Q): pick the building type under the cursor ---------- */
function pipette() {
  if (!UI.hover) return;
  const b = bldAt(UI.hover[0], UI.hover[1]); if (!b) return;
  const t = b.type;
  if (!isUnlockedB(t)) { toast(lockReason(t) || 'Tohle teď postavit nejde.'); Sound.nope(); return; }
  UI.tool = t; UI.sel = null; UI.landMode = false; UI.tab = 'build'; UI.bcat = B[t].cat; UI.dirty = true; Sound.click(); renderPane(true);
}
addEventListener('keydown', e => {
  if (!G || !started || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName) || UI.interior) return;
  if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) { e.preventDefault(); undoPlace(); }
  else if (e.key === 'q' || e.key === 'Q') pipette();
});

/* ---------- signs with your own text ---------- */
Object.assign(B, {
  cedulka: { n: 'Cedulka', cat: 'ozdoby', w: 1, h: 1, cost: 5, wood: 1, instant: 1, cozy: 0, nodoor: 1,
    desc: 'Napiš na ni, co chceš — jméno ulice, „Pekařská čtvrť“, vtip… Ukáže se po najetí myší.',
    status: b => [b.text ? '„' + b.text + '“' : 'Klikni a napiš nápis', 'ok'],
    inspect: b => `<div class="form"><label for="signInp">Nápis</label><input id="signInp" maxlength="40" value="${(b.text || '').replace(/"/g, '&quot;')}"><button class="btn small chamfer" data-act="signset" data-arg="${b.id}">Uložit nápis</button></div>` }
});
ACTIONS.signset = id => { const b = G.bld[+id], inp = $('signInp'); if (!b || !inp) return; b.text = inp.value.trim().slice(0, 40); Sound.click(); toast(b.text ? 'Nápis uložen.' : 'Nápis smazán.'); };
DRAW.cedulka = (g, X, Y) => {
  shape(g, [[X + 7, Y + 7, 2, 8, '#8a5230']]);
  shape(g, [[X + 2, Y + 1, 12, 7, '#e8c060']]); R(g, '#c89a40', X + 2, Y + 7, 12, 1);
  R(g, '#8a5230', X + 4, Y + 3, 7, 1); R(g, '#8a5230', X + 4, Y + 5, 5, 1);
};
B.cedulka.top = 1;

/* ---------- help: new keys ---------- */
{ const ov = HELP.find(p => p.id === 'ovladani'); if (ov) ov.t += `<p><b>Q</b> = kapátko (vezme typ stavby pod myší) · <b>Ctrl+Z</b> = vrátit poslední stavbu (do 30 s, vrátí mince i materiál).</p><p>U rozestavěné budovy můžeš zapnout <b>Stavět přednostně</b> — kočky na ni donesou materiál jako první.</p>`; }
