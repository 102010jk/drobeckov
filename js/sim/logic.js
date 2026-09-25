'use strict';
/* ============ 4.0: production limits — a workshop stops when the store already holds enough of what it makes ============ */
const LIMITS = [0, 20, 50, 100, 200, 500];
function limitOut(b) { const d = B[b.type]; if (d.recipes) { const r = RECIPES[b.recipe]; return r ? r.out : null; } return null; }
const limitReached = b => { if (!b.limit) return false; const o = limitOut(b); return !!o && (G.stock[o] || 0) >= b.limit; };
const _canWorkL = canWork;
canWork = function (b) { if (limitReached(b)) return false; return _canWorkL(b); };
const _bStatusL = bStatus;
bStatus = function (b) {
  if (b && b.built && limitReached(b)) { const o = limitOut(b); return [`Limit splněn: ${itemName(o).toLowerCase()} ve skladu ${G.stock[o] || 0}/${b.limit}`, 'wait']; }
  return _bStatusL(b);
};
const _inspectBldL = inspectBld;
inspectBld = function (b) {
  let h = _inspectBldL(b);
  const o = b && b.built && limitOut(b);
  if (o) {
    h += `<h4>Limit výroby</h4><p class="muted">Budova přestane vyrábět, když je ve skladu aspoň tolik: ${itemIcon(o, 1)} ${itemName(o).toLowerCase()} (teď ${G.stock[o] || 0}).</p><div class="chips">`;
    h += LIMITS.map(n => `<button class="chip-btn ${(b.limit || 0) === n ? 'on' : ''}" data-act="limit" data-arg="${b.id}:${n}">${n ? n : 'bez limitu'}</button>`).join('');
    h += `</div><button class="link" data-act="limitall" data-arg="${b.id}">Stejný limit všem budovám „${B[b.type].n}“ se stejným receptem</button>`;
  }
  return h;
};
ACTIONS.limit = arg => { const [id, n] = arg.split(':').map(Number), b = G.bld[id]; if (!b) return; b.limit = n || 0; jobsDirty = true; };
ACTIONS.limitall = id => {
  const b = G.bld[+id]; if (!b) return; let k = 0;
  for (const o of BLIST) if (o.type === b.type && o.recipe === b.recipe) { o.limit = b.limit || 0; k++; }
  toast(`Limit ${b.limit || 'zrušen'} nastaven ${k} budovám.`); jobsDirty = true;
};
{ const p = HELP.find(x => x.id === 'logistika'); if (p) p.t += `<p><b>Limit výroby</b> (v detailu dílny): budova přestane vyrábět, když je ve skladu dost jejího výrobku — třeba 100 chlebů. Hodí se ve velkém městě, aby se sklady neplnily zbytečnostmi. <b>Třídička</b> v továrně pošle vybranou věc na bok pásu.</p>`; }
