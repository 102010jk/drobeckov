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
  if (b) { UNDO.push({ id: b.id, type, at: performance.now(), g: G }); if (UNDO.length > 20) UNDO.shift(); }
  return b;
};
function undoPlace() {
  while (UNDO.length) {
    const u = UNDO.pop(), b = G.bld[u.id];
    if (u.g !== G || G.visiting || !b || b.type !== u.type || performance.now() - u.at > 30000) continue;
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

/* ---------- terraforming: fill shallow water, dig a pond ---------- */
Object.assign(B, {
  zasyp: { n: 'Zasypat vodu', cat: 'cesty', w: 1, h: 1, cost: 12, ground: 'grass', dig: 'fill', terr: ['water'], terrTxt: 'jen mělká voda', desc: 'Zasype mělkou vodu hlínou — vznikne louka. Táhni myší.' },
  jezirko: { n: 'Vykopat jezírko', cat: 'cesty', w: 1, h: 1, cost: 8, ground: 'water', dig: 'dig', terr: ['grass', 'sand'], terrTxt: 'jen louka nebo písek', desc: 'Vykope mělkou vodu — na rybníček, molo nebo jen pro krásu. Táhni myší.',
    need: (x, y) => !keepsAccess(x, y, 1, 1, null), needTxt: 'Odřízlo by to kočkám cestu' }
});
const _terrOKQ = terrOK;
terrOK = function (d, t) { if (d.dig) return d.terr.includes(t.gr); return _terrOKQ(d, t); };
const _placeQ = place;
place = function (type, x, y) {
  const r = _placeQ(type, x, y);
  if (B[type] && B[type].dig) { reachDirty = true; pathVersion++; if (typeof terrainDirty !== 'undefined') terrainDirty = true; minimapDirty = true; for (let i = 0; i < 3; i++) addPart(x * TS + 8 + rand(-4, 4), y * TS + 8, rand(-15, 15), rand(-30, -10), B[type].dig === 'fill' ? '#8a5a2a' : '#a8d4f8', 0.5, { g: 120 }); }
  return r;
};
{ const ov = HELP.find(p => p.id === 'pozemky'); if (ov) ov.t += `<p><b>Terén:</b> ve Stavět → Cesty můžeš <b>zasypat mělkou vodu</b> nebo <b>vykopat jezírko</b> (obojí jde táhnout myší).</p>`; }
Object.assign(DRAW, {
  zasyp(g, X, Y) { R(g, '#5aa8e6', X + 1, Y + 1, 14, 7); R(g, '#72c850', X + 1, Y + 8, 14, 7); R(g, '#a8d4f8', X + 3, Y + 3, 4, 1); shape(g, [[X + 10, Y - 2, 2, 9, '#8a5230'], [X + 8, Y + 6, 6, 4, '#9aa0b4']]); },
  jezirko(g, X, Y) { R(g, '#72c850', X + 1, Y + 1, 14, 14); odisc(g, X + 8, Y + 9, 5, '#5aa8e6'); R(g, '#a8d4f8', X + 5, Y + 7, 3, 1); shape(g, [[X + 12, Y - 3, 2, 9, '#8a5230'], [X + 10, Y + 5, 6, 3, '#9aa0b4']]); }
});

/* ---------- orders: auto-deliver toggle and declining ---------- */
ACTIONS.autodeliver = () => { G.autoDeliver = !G.autoDeliver; toast(G.autoDeliver ? 'Zakázky se doručí samy, jakmile bude všechno ve skladu.' : 'Zakázky doručuješ ručně.'); };
ACTIONS.decline = id => {
  const o = G.orders.find(x => x.id === +id); if (!o) return;
  G.orders = G.orders.filter(x => x !== o); G.orderT = Math.min(G.orderT || 30, rand(8, 16));
  toast('Zakázka odmítnuta. Brzy přijde jiná.'); Sound.click();
};
let adT = 0;
STEP_HOOKS.push(dt => {
  adT -= dt; if (adT > 0 || !G.autoDeliver || (typeof visiting === 'function' && visiting())) return; adT = 1;
  for (const o of G.orders.slice()) if (canDeliver(o)) { deliverOrder(o.id); break; }
});
const _paneOrdersQ = paneOrders;
paneOrders = function () {
  let h = _paneOrdersQ();
  h = h.replace('<h4>Zakázky na nástěnce</h4>', `<h4>Zakázky na nástěnce</h4><label class="chk autod"><input type="checkbox" data-act="autodeliver" ${G.autoDeliver ? 'checked' : ''}> Doručovat automaticky, jakmile je vše ve skladu</label>`);
  h = h.replace(/(<button class="btn small chamfer[^"]*" data-act="deliver" data-arg="(\d+)">Doručit<\/button>)/g, '$1 <button class="link" data-act="decline" data-arg="$2" title="Odmítnout zakázku">odmítnout</button>');
  return h;
};
