'use strict';
/* ============ factory interior simulation ============ */
const FDX = [1, 0, -1, 0], FDY = [0, 1, 0, -1];
const BELT_SPEED = 1.8;
function fcell(f, x, y) { return x >= 0 && y >= 0 && x < f.w && y < f.h ? f.cells[y * f.w + x] : undefined; }
/* can cell (x,y) take `item` arriving while travelling in direction `dir`? (and take it) */
function facAccept(b, f, x, y, item, dir) {
  if (x === f.w && y === f.gate) { b.out[item] = (b.out[item] || 0) + 1; f.stats[item] = (f.stats[item] || 0) + 1; G.stats.made[item] = (G.stats.made[item] || 0) + (f.src === item ? 0 : 0); return true; }
  const c = fcell(f, x, y); if (!c) return false;
  if (c.k === 'belt') { if (c.it || c.d === (dir + 2) % 4) return false; c.it = item; c.p = 0; return true; }
  if (c.k === 'split' || c.k === 'sort') { if (c.it) return false; c.it = item; c.p = 0; return true; }
  if (c.k === 'm') {
    const r = FRECIPES[c.r];
    if (r && r.in[item]) {
      if ((c.inp[item] || 0) < r.in[item] * 2) { c.inp[item] = (c.inp[item] || 0) + 1; return true; }
      // full of this ingredient: let it ride on instead of blocking the belt for everything behind it
      if (!c.pass && c.d !== (dir + 2) % 4) { c.pass = item; return true; }
      return false;
    }
    if (!c.pass && c.d !== (dir + 2) % 4) { c.pass = item; return true; }
    return false;
  }
  return false;
}
function facTick(b, dt) {
  const f = b.fac; if (!f) return;
  const crew = b._crew || 0, mul = crew ? (b._mul / crew) / dt : 0;
  b._crew = 0; b._mul = 0;
  // which machines are manned: those next to the first `crew` stations
  const manned = new Set();
  let si = 0;
  for (let i = 0; i < f.cells.length; i++) {
    const c = f.cells[i]; if (!c || c.k !== 'st') continue;
    if (si++ >= crew) break;
    const x = i % f.w, y = (i / f.w) | 0;
    for (let d = 0; d < 4; d++) { const n = fcell(f, x + FDX[d], y + FDY[d]); if (n && n.k === 'm') manned.add(n); }
  }
  let busy = 0;
  // input gate feeds the first cell of the gate row
  f.gin += dt;
  if (f.gin >= 1 / BELT_SPEED) {
    const keys = Object.keys(b.inp).filter(k => b.inp[k] > 0);
    if (keys.length) {
      const k = keys[f.rr++ % keys.length];
      if (facAccept(b, f, 0, f.gate, k, 0)) { b.inp[k]--; if (b.inp[k] <= 0) delete b.inp[k]; f.gin = 0; busy++; }
    } else f.gin = 0;
  }
  for (let i = 0; i < f.cells.length; i++) {
    const c = f.cells[i]; if (!c) continue;
    const x = i % f.w, y = (i / f.w) | 0;
    if (c.k === 'belt' || c.k === 'split' || c.k === 'sort') {
      if (!c.it) continue;
      busy++;
      c.p = Math.min(1, c.p + dt * BELT_SPEED);
      if (c.p < 1) continue;
      if (c.k === 'belt') { if (facAccept(b, f, x + FDX[c.d], y + FDY[c.d], c.it, c.d)) { c.it = null; c.stuck = 0; } else c.stuck = (c.stuck || 0) + dt; }
      else if (c.k === 'sort') { const d = c.f && c.it === c.f ? (c.d + 3) % 4 : c.d; if (facAccept(b, f, x + FDX[d], y + FDY[d], c.it, d)) { c.it = null; c.stuck = 0; } else c.stuck = (c.stuck || 0) + dt; }
      else {
        const dirs = c.flip ? [(c.d + 1) % 4, (c.d + 3) % 4] : [(c.d + 3) % 4, (c.d + 1) % 4];
        for (const d of dirs) if (facAccept(b, f, x + FDX[d], y + FDY[d], c.it, d)) { c.it = null; c.flip = !c.flip; break; }
      }
    } else if (c.k === 'm') {
      const r = FRECIPES[c.r];
      if (c.pass && facAccept(b, f, x + FDX[c.d], y + FDY[c.d], c.pass, c.d)) c.pass = null;
      if (c.out) { if (facAccept(b, f, x + FDX[c.d], y + FDY[c.d], c.out, c.d)) { c.outN--; if (c.outN <= 0) c.out = null; } busy++; continue; }
      if (!r) continue;
      const ready = c.cyc || Object.keys(r.in).every(k => (c.inp[k] || 0) >= r.in[k]);
      c.on = false;
      if (!ready) continue;
      busy++;
      const hasP = typeof powerOK === 'function' && powerOK();
      if (r.power && !hasP) continue;
      const powered = c.auto && hasP;
      if (!manned.has(c) && !powered) continue;
      if (!c.cyc) { for (const k in r.in) c.inp[k] -= r.in[k]; c.cyc = true; c.p = 0; }
      c.on = true;
      c.p += dt * (powered && !manned.has(c) ? 1.1 : Math.max(0.6, mul || 1)) / r.t;
      if (c.p >= 1) { c.cyc = false; c.p = 0; c.out = r.out; c.outN = r.n; G.stats.made[r.out] = (G.stats.made[r.out] || 0) + r.n; if (typeof usePower === 'function' && (powered || r.power)) usePower(); }
    }
  }
  f.busy = busy;
  f.jam = f.cells.some(c => c && c.stuck > 5);
  if (crew) b.lastWork = G.t;
}
STEP_HOOKS.push(dt => { for (const b of BLIST) if (b.fac && b.built) facTick(b, dt); });

/* ============ editing ============ */
const FUI = { tool: null, rot: 0, sel: -1 };
function facPlace(b, x, y) {
  const f = b.fac, t = FUI.tool; if (!t || !f) return;
  if (x < 0 || y < 0 || x >= f.w || y >= f.h) return;
  const i = y * f.w + x, cur = f.cells[i];
  if (t === 'fdel') { if (cur) { facRefund(cur); f.cells[i] = null; Sound.place(); } return; }
  if (cur && cur.k === 'belt' && t === 'belt') { cur.d = FUI.rot; return; }
  if (cur) { toast('Tady už něco stojí — nejdřív to odstraň.'); Sound.nope(); return; }
  const def = MACHINES[t] || FTOOLS[t];
  if (G.coins < def.cost) { toast('Málo mincí.'); Sound.nope(); return; }
  for (const k in (def.mat || {})) if ((G.stock[k] || 0) < def.mat[k]) { toast('Chybí: ' + itemName(k).toLowerCase()); Sound.nope(); return; }
  G.coins -= def.cost; for (const k in (def.mat || {})) takeStock(k, def.mat[k]);
  if (t === 'belt') f.cells[i] = { k: 'belt', d: FUI.rot, it: null, p: 0 };
  else if (t === 'split') f.cells[i] = { k: 'split', d: FUI.rot, it: null, p: 0 };
  else if (t === 'sort') { f.cells[i] = { k: 'sort', d: FUI.rot, it: null, p: 0, f: null }; FUI.sel = i; FUI.tool = null; }
  else if (t === 'station') f.cells[i] = { k: 'st' };
  else f.cells[i] = { k: 'm', t, d: FUI.rot, r: MACHINES[t].recipes.find(r => typeof FREC_TECH === 'undefined' || !FREC_TECH[r] || hasTech(FREC_TECH[r])) || MACHINES[t].recipes[0], inp: {}, out: null, outN: 0, p: 0, pass: null };
  Sound.place(); jobsDirty = true; UI.dirty = true;
  tutEvent('fac_' + (MACHINES[t] ? 'machine' : t));
}
function facRefund(c) {
  const def = c.k === 'm' ? MACHINES[c.t] : FTOOLS[c.k === 'st' ? 'station' : c.k];
  if (def) { G.coins += Math.floor(def.cost / 2); for (const k in (def.mat || {})) addStock(k, Math.floor(def.mat[k] / 2)); }
  if (c.it) addStock(c.it, 1); if (c.pass) addStock(c.pass, 1); if (c.inp) for (const k in c.inp) addStock(k, c.inp[k]);
}
function facExpandCost(b) { return { coins: 600 + (b.fac.w - 12) * 150, mat: { cihly: 20, ocel: 6 } }; }
function facExpand(b) {
  const f = b.fac, c = facExpandCost(b);
  if (f.w >= 20) return;
  if (G.coins < c.coins) { toast('Rozšíření stojí ' + c.coins + ' mincí.'); Sound.nope(); return; }
  for (const k in c.mat) if ((G.stock[k] || 0) < c.mat[k]) { toast('Chybí: ' + itemName(k).toLowerCase()); Sound.nope(); return; }
  G.coins -= c.coins; for (const k in c.mat) takeStock(k, c.mat[k]);
  const nw = f.w + 4, cells = new Array(nw * f.h).fill(null);
  for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) cells[y * nw + x] = f.cells[y * f.w + x];
  f.w = nw; f.cells = cells;
  banner('Hala rozšířena', `${b.fac.w}×${b.fac.h} dlaždic`); Sound.built();
}
function enterFactory(id) { UI.interior = id; UI.tool = null; UI.landMode = false; UI.sel = null; FUI.tool = null; FUI.sel = -1; UI.dirty = true; tutEvent('enter'); }
function leaveFactory() { UI.interior = null; FUI.tool = null; UI.dirty = true; }
ACTIONS.enter = id => enterFactory(+id);
ACTIONS.fexit = () => leaveFactory();
ACTIONS.ftool = t => { FUI.tool = FUI.tool === t ? null : t; FUI.sel = -1; };
ACTIONS.frot = () => { FUI.rot = (FUI.rot + 1) % 4; };
ACTIONS.frec = r => { const b = G.bld[UI.interior]; if (!b) return; const c = b.fac.cells[FUI.sel]; if (c && c.k === 'm') { if (c.cyc) { const o = FRECIPES[c.r]; for (const k in o.in) c.inp[k] = (c.inp[k] || 0) + o.in[k]; c.cyc = false; } c.r = r; jobsDirty = true; } };
ACTIONS.fauto = () => { const b = G.bld[UI.interior]; if (!b) return; const c = b.fac.cells[FUI.sel]; if (c && c.k === 'm') c.auto = !c.auto; };
ACTIONS.fsort = k => { const b = G.bld[UI.interior]; if (!b) return; const c = b.fac.cells[FUI.sel]; if (c && c.k === 'sort') c.f = c.f === k ? null : k; };
ACTIONS.fexpand = () => { const b = G.bld[UI.interior]; if (b) facExpand(b); };
function paneFactory() {
  const b = G.bld[UI.interior]; if (!b) { UI.interior = null; return ''; }
  const f = b.fac, d = B[b.type];
  let h = `<div class="ihead">${(() => { const ic = bIcon(b.type); return `<img src="${ic.url}" width="${ic.w}" height="${ic.h}" alt="">`; })()}<div><h3>${d.n} — uvnitř</h3><small>${f.w}×${f.h} · pracovníci ${b.workers.length}/${facSlots(b)}</small></div><button class="sq chamfer x" data-act="fexit">Ven</button></div>`;
  h += `<p class="muted">Zboží přichází <b>vstupní branou</b> vlevo a hotové výrobky odchází <b>výstupní branou</b> vpravo. Kočky u pracovních míst obsluhují sousední stroje. Stroj propustí dál věci, které nepotřebuje.</p>`;
  h += `<div class="chips">` + Object.keys(FTOOLS).map(k => `<button class="chip-btn ${FUI.tool === k ? 'on' : ''}" data-act="ftool" data-arg="${k}">${FTOOLS[k].n}${FTOOLS[k].cost ? ' · ' + FTOOLS[k].cost : ''}</button>`).join('') + `<button class="chip-btn" data-act="frot">Otočit (R) ${'→↓←↑'[FUI.rot]}</button></div>`;
  h += '<div class="cards">' + Object.keys(MACHINES).map(k => {
    const m = MACHINES[k], locked = m.era && eraOf() < m.era || (m.tech && !hasTech(m.tech));
    return `<button class="card ${FUI.tool === k ? 'on' : ''} ${locked ? 'locked' : ''}" data-act="${locked ? 'noop' : 'ftool'}" data-arg="${k}"><span class="cimg"><img src="${machineIcon(k)}" width="32" height="32" alt=""></span><span class="cname">${m.n}</span><span class="ccost">${locked ? (m.tech ? 'Výzkum: ' + TECH[m.tech].n : 'Éra: ' + ERAS[m.era].n) : icon('coin', 1) + m.cost + matHTML(m, false)}</span></button>`;
  }).join('') + '</div>';
  const t = FUI.tool && (MACHINES[FUI.tool] || FTOOLS[FUI.tool]);
  if (t) h += `<div class="hint"><b>${t.n}</b> — ${t.desc}${MACHINES[FUI.tool] ? '<div class="reclist">' + MACHINES[FUI.tool].recipes.map(r => `<span class="rec">${frecipeHTML(r)}</span>`).join('') + '</div>' : ''}</div>`;
  const c = FUI.sel >= 0 ? f.cells[FUI.sel] : null;
  if (c && c.k === 'sort') {
    const seen = new Set([...facItemsWanted(b), ...Object.keys(f.stats || {}), ...Object.keys(b.inp)]);
    h += `<h4>Třídička</h4><p class="muted">Vybraná věc odbočí doleva od šipky, všechno ostatní jede rovně.</p><div class="lines">` + [...seen].filter(k => ITEMS[k]).map(k => `<button class="line ${c.f === k ? 'ok' : ''}" data-act="fsort" data-arg="${k}">${itemIcon(k)}<small>${itemName(k)}</small></button>`).join('') + `</div>`;
  }
  if (c && c.k === 'm') {
    const m = MACHINES[c.t];
    h += `<h4>${m.n}</h4><div class="reclist">` + m.recipes.map(r => { const lk = typeof FREC_TECH !== 'undefined' && FREC_TECH[r] && !hasTech(FREC_TECH[r]); return `<button class="rec ${c.r === r ? 'on' : ''} ${lk ? 'locked' : ''}" data-act="${lk ? 'noop' : 'frec'}" data-arg="${r}">${frecipeHTML(r)}${lk ? '<small>Výzkum: ' + TECH[FREC_TECH[r]].n + '</small>' : ''}${FRECIPES[r].power ? '<small>potřebuje proud</small>' : ''}</button>`; }).join('') + '</div>';
    h += `<div class="kv"><span>Uvnitř</span><span class="inv">${Object.keys(c.inp).filter(k => c.inp[k] > 0).map(k => itemIcon(k) + '<b>' + c.inp[k] + '</b>').join(' ') || '<small>nic</small>'}</span></div>`;
    if (c.cyc) h += `<div class="kv"><span>Hotovo</span>${bar(c.p * 100)}</div>`;
    if (hasTech('automatizace')) h += `<button class="btn small ${c.auto ? '' : 'alt'} chamfer" data-act="fauto">${c.auto ? 'Automat: zapnuto' : 'Zapnout automat (bere proud)'}</button>`;
  }
  h += `<h4>Brány</h4><div class="kv"><span>Vstup</span><span class="inv">${Object.keys(b.inp).filter(k => b.inp[k] > 0).map(k => itemIcon(k) + '<b>' + b.inp[k] + '</b>').join(' ') || '<small>prázdno — kočky sem nosí suroviny pro stroje</small>'}</span></div>`;
  h += `<div class="kv"><span>Výstup</span><span class="inv">${Object.keys(b.out).filter(k => b.out[k] > 0).map(k => itemIcon(k) + '<b>' + b.out[k] + '</b>').join(' ') || '<small>zatím nic</small>'}</span></div>`;
  const slots = facSlots(b);
  if (slots) {
    h += `<h4>Pracovníci ${b.workers.length}/${slots}</h4>`;
    for (const id of b.workers) { const cc = G.cats.find(x => x.id === id); if (cc) h += `<div class="worker">${catHead(cc.skin, 2)}<span><b>${cc.name}</b><small>${cc.prof === 'inzenyr' ? 'Inženýr ✓' : TRAITS[cc.trait].n} · ${catActivity(cc)}</small></span><button class="link" data-act="unassign" data-arg="${cc.id}">uvolnit</button></div>`; }
    if (b.workers.length < slots) h += UI.pick ? pickList(b) : `<button class="btn small alt chamfer" data-act="pick">Přiřadit kočku</button>`;
  }
  if (b.type === 'tovarna' && f.w < 20) { const ec = facExpandCost(b); h += `<h4>Rozšíření haly</h4><button class="btn small alt chamfer" data-act="fexpand">+4 sloupce za ${ec.coins} mincí${matHTML({ mat: ec.mat }, false)}</button>`; }
  return h;
}
ACTIONS.noop = () => { Sound.nope(); };
const frecipeHTML = r => Object.entries(FRECIPES[r].in).map(([k, n]) => `${n > 1 ? n + '×' : ''}${itemIcon(k, 1)}`).join('<i class="plus">+</i>') + `<i class="arr">→</i>${FRECIPES[r].n > 1 ? FRECIPES[r].n + '×' : ''}${itemIcon(FRECIPES[r].out, 1)}`;
/* pick via UI when inside */
function interiorClick(tx, ty, first) {
  const b = G.bld[UI.interior]; if (!b) return;
  if (FUI.tool) { facPlace(b, tx, ty); UI.dirty = true; return; }
  const f = b.fac;
  if (tx >= 0 && ty >= 0 && tx < f.w && ty < f.h) { FUI.sel = ty * f.w + tx; UI.dirty = true; renderPane(true); }
  void first;
}
