'use strict';
/* ============ 4.0: insights — daily history with charts, heat maps over the valley ============ */

/* ---------- daily history (recorded every morning, kept in the save) ---------- */
const HIST_MAX = 200;
function histSnapshot() {
  const made = G.stats.made || {}, prev = G.histPrev || {}, top = {};
  let total = 0;
  for (const k in made) { const d = (made[k] || 0) - (prev[k] || 0); if (d > 0) { total += d; top[k] = d; } }
  const best = Object.entries(top).sort((a, b) => b[1] - a[1]).slice(0, 8);
  return {
    d: dayIdx(), c: G.cats.length, m: Math.round(G.coins), e: Math.round(G.stats.earned || 0), cz: coziness(),
    md: Math.round(G.cats.reduce((a, c) => a + c.mood, 0) / Math.max(1, G.cats.length)), p: total, pi: Object.fromEntries(best),
    tl: G.stats.truckLoads || 0, br: G.stats.busRides || 0, er: eraOf()
  };
}
MORNING_HOOKS.push(() => {
  if (!G.hist) G.hist = [];
  G.hist.push(histSnapshot()); G.histPrev = Object.assign({}, G.stats.made || {});
  if (G.hist.length > HIST_MAX) G.hist = G.hist.filter((h, i) => i % 2 === 0 || i > G.hist.length - 40);   // thin out the old days
  CHART_CACHE.clear();
});

/* ---------- charts: one measure per chart, one axis, legend + last-value label, table view, hover ---------- */
const CH_COL = ['#2a78d6', '#eb6834', '#1baf7a'], CH_INK = '#2b1b2b', CH_MUTED = '#7a5a4a', CH_GRID = '#ecd9b6';
const CHART_CACHE = new Map(), CHART_DATA = {};
const UIC = { range: 'all', table: false };
function chartSeries(kind, H) {
  const perDay = (f) => H.map((h, i) => (i ? Math.max(0, f(h) - f(H[i - 1])) : null));
  switch (kind) {
    case 'cats': return { title: 'Kočky', unit: 'koček', s: [['Kočky', H.map(h => h.c)]] };
    case 'coins': return { title: 'Mince', unit: 'mincí', s: [['Mince ve stavu', H.map(h => h.m)]] };
    case 'earn': return { title: 'Výdělek za den', unit: 'mincí za den', s: [['Výdělek', perDay(h => h.e)]] };
    case 'mood': return { title: 'Nálada koček', unit: 'průměr 0–100', s: [['Nálada', H.map(h => h.md)]], max: 100 };
    case 'prod': {
      const tot = {}; for (const h of H) for (const k in h.pi || {}) tot[k] = (tot[k] || 0) + h.pi[k];
      const top = Object.keys(tot).sort((a, b) => tot[b] - tot[a]).slice(0, 3);
      return { title: 'Výroba za den — 3 nejčastější', unit: 'kusů za den', s: top.map(k => [itemName(k), H.map(h => (h.pi && h.pi[k]) || 0)]) };
    }
    case 'traffic': return { title: 'Doprava za den', unit: 'jízd za den', s: [['Nákladní auta', perDay(h => h.tl || 0)], ['Autobus', perDay(h => h.br || 0)]] };
  }
}
function drawChart(kind) {
  const all = G.hist || [], H = UIC.range === 'all' ? all : all.slice(-16);
  const key = kind + '|' + UIC.range + '|' + H.length + '|' + (H.length ? H[H.length - 1].d : 0);
  if (CHART_CACHE.has(key)) return CHART_CACHE.get(key);
  const spec = chartSeries(kind, H), W = 330, Hh = 128, L = 34, Rm = 50, T = 8, Bm = 18;
  const c = document.createElement('canvas'); c.width = W * 2; c.height = Hh * 2;
  const g = c.getContext('2d'); g.scale(2, 2); g.fillStyle = '#fff4dc'; g.fillRect(0, 0, W, Hh);
  const vals = spec.s.flatMap(s => s[1].filter(v => v != null));
  const max = spec.max || Math.max(1, ...vals), nice = niceMax(max), pw = W - L - Rm, ph = Hh - T - Bm;
  const X = i => L + (H.length <= 1 ? pw / 2 : i / (H.length - 1) * pw), Y = v => T + ph - v / nice * ph;
  g.font = '9px "Pixelify Sans", monospace'; g.textBaseline = 'middle';
  for (let k = 0; k <= 4; k++) { const v = nice * k / 4, y = Math.round(Y(v)) + 0.5; g.strokeStyle = CH_GRID; g.lineWidth = 1; g.beginPath(); g.moveTo(L, y); g.lineTo(L + pw, y); g.stroke(); g.fillStyle = CH_MUTED; g.textAlign = 'right'; g.fillText(shortNum(v), L - 4, y); }
  g.textAlign = 'center'; g.fillStyle = CH_MUTED;
  if (H.length) { g.fillText('den ' + (H[0].d + 1), L + 12, Hh - 7); g.fillText('den ' + (H[H.length - 1].d + 1), L + pw - 12, Hh - 7); }
  spec.s.forEach(([name, arr], si) => {
    g.strokeStyle = CH_COL[si]; g.lineWidth = 2; g.lineJoin = 'round'; g.beginPath(); let on = false;
    arr.forEach((v, i) => { if (v == null) return; const x = X(i), y = Y(v); if (!on) { g.moveTo(x, y); on = true; } else g.lineTo(x, y); });
    g.stroke();
    const li = arr.length - 1; if (li >= 0 && arr[li] != null) {
      g.fillStyle = '#fff4dc'; g.beginPath(); g.arc(X(li), Y(arr[li]), 4, 0, 7); g.fill(); g.fillStyle = CH_COL[si]; g.beginPath(); g.arc(X(li), Y(arr[li]), 3, 0, 7); g.fill();
      g.fillStyle = CH_INK; g.textAlign = 'left'; g.fillText(shortNum(arr[li]), X(li) + 7, Y(arr[li]) + si * 10 - (spec.s.length - 1) * 5);
    }
  });
  const out = { url: c.toDataURL(), spec, days: H.map(h => h.d) };
  CHART_CACHE.set(key, out); CHART_DATA[kind] = { out, L, pw, W };
  return out;
}
function niceMax(v) { const p = Math.pow(10, Math.floor(Math.log10(v))), f = v / p; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p; }
function chartsPage() {
  const H = G.hist || [];
  let h = `<div class="chips"><button class="chip-btn ${UIC.range === 'all' ? 'on' : ''}" data-act="chrange" data-arg="all">Celá hra</button><button class="chip-btn ${UIC.range === '16' ? 'on' : ''}" data-act="chrange" data-arg="16">Posledních 16 dní</button><button class="chip-btn ${UIC.table ? 'on' : ''}" data-act="chtable">Tabulka</button></div>`;
  if (H.length < 2) return h + '<p class="muted">Grafy se plní každé ráno. Za pár dní tu uvidíš, jak osada roste.</p>';
  if (UIC.table) {
    const rows = H.slice(-16).reverse();
    return h + `<table class="ctable"><tr><th>Den</th><th>Kočky</th><th>Mince</th><th>Nálada</th><th>Výroba</th><th>Útulnost</th></tr>${rows.map(r => `<tr><td>${r.d + 1}</td><td>${r.c}</td><td>${fmt(r.m)}</td><td>${r.md}</td><td>${fmt(r.p)}</td><td>${r.cz}</td></tr>`).join('')}</table>`;
  }
  for (const k of ['cats', 'coins', 'earn', 'prod', 'mood', 'traffic']) {
    const o = drawChart(k), s = o.spec;
    if (k === 'traffic' && !s.s.some(([, a]) => a.some(v => v))) continue;
    h += `<div class="chart"><div class="ctitle"><b>${s.title}</b><small>${s.unit}</small></div>`;
    if (s.s.length > 1) h += `<div class="clegend">${s.s.map(([n], i) => `<span><i style="background:${CH_COL[i]}"></i>${n}</span>`).join('')}</div>`;
    h += `<img class="chartimg" data-chart="${k}" src="${o.url}" width="330" height="128" alt="${s.title}"></div>`;
  }
  return h;
}
ACTIONS.chrange = r => { UIC.range = r; };
ACTIONS.chtable = () => { UIC.table = !UIC.table; };
HELP.push({ id: 'grafy', n: 'Grafy', t: '' });
const _helpTabI = EXTRA_TABS.help;
EXTRA_TABS.help = () => {
  if (helpPage !== 'grafy') return _helpTabI();
  return '<div class="chips">' + HELP.map(p => `<button class="chip-btn ${helpPage === p.id ? 'on' : ''}" data-act="help" data-arg="${p.id}">${p.n}</button>`).join('') + '</div><div class="help-page"><h3>Grafy</h3>' + chartsPage() + '</div>';
};
/* hover: the value under the mouse */
addEventListener('mousemove', e => {
  const img = e.target.closest && e.target.closest('img.chartimg'), tip = $('ctip');
  if (!img) { if (tip) tip.hidden = true; return; }
  const D = CHART_DATA[img.dataset.chart]; if (!D) return;
  const r = img.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * D.W, n = D.out.days.length;
  const i = clamp(Math.round((x - D.L) / D.pw * (n - 1)), 0, n - 1);
  let el = tip; if (!el) { el = document.createElement('div'); el.id = 'ctip'; el.className = 'tip'; document.body.appendChild(el); }
  el.hidden = false; el.style.position = 'fixed'; el.style.left = (e.clientX + 12) + 'px'; el.style.top = (e.clientY - 28) + 'px';
  el.textContent = `den ${D.out.days[i] + 1}: ` + D.out.spec.s.map(([nm, a]) => `${nm} ${a[i] == null ? '—' : fmt(a[i])}`).join(' · ');
});

/* ---------- heat maps over the valley ---------- */
const SEQ = ['#cde2fb', '#9ec5f4', '#6da7ec', '#3987e5', '#256abf', '#184f95', '#0d366b'];
const DIST_COL = { obytna: '#1baf7a', prumyslova: '#eb6834', obchodni: '#2a78d6', smisena: '#9aa0b4' };
const FOOT = new Map();
let footT = 0;
STEP_HOOKS.push(dt => {
  footT -= dt; if (footT > 0) return; footT = 0.5;
  for (const c of G.cats) if (!c.inside && c.task && c.task.moving) { const k = ((c.x / TS) | 0) * 65536 + ((c.y / TS) | 0) + 2147483648; FOOT.set(k, (FOOT.get(k) || 0) + 1); }
  for (const c of CARS) { const k = c.x * 65536 + c.y + 2147483648; FOOT.set(k, (FOOT.get(k) || 0) + 1.5); }
});
MORNING_HOOKS.push(() => { for (const [k, v] of FOOT) { if (v < 1) FOOT.delete(k); else FOOT.set(k, v * 0.5); } });
const HEATS = {
  ruch: { n: 'Ruch', d: 'jak hlučno je z dílen a továren', f: (x, y) => noiseAt(x, y), max: 10 },
  utulnost: { n: 'Útulnost', d: 'ozdoby v okruhu 3 dlaždic', f: (x, y) => cozyNear(x, y, 3), max: 16 },
  provoz: { n: 'Provoz', d: 'kudy chodí kočky a jezdí auta', f: (x, y) => FOOT.get(x * 65536 + y + 2147483648) || 0, max: 30, sparse: 1 },
  zacpy: { n: 'Zácpy', d: 'kde auta čekají', f: (x, y) => TRAFFIC.get((x + 32768) * 65536 + (y + 32768)) || 0, max: 6, sparse: 1 },
  dojezd: { n: 'Dojíždění', d: 'jak daleko to mají kočky z domu do práce', f: null, max: 40 },
  sluzby: { n: 'Služby', d: 'kolik městských služeb pokrývá místo', f: (x, y) => Object.keys(servicesAt(x, y)).length, max: 6 },
  hodnota: { n: 'Hodnota pozemků', d: 'útulnost a služby minus ruch', f: (x, y) => Math.max(0, cozyNear(x, y, 4) * 2 + Object.keys(servicesAt(x, y)).length * 4 - noiseAt(x, y) * 2), max: 40 },
  ctvrti: { n: 'Čtvrti', d: 'charakter bloků 16×16', f: null }
};
UI.heat = null;
function commuteByHome() {
  const m = new Map();
  for (const c of G.cats) { if (!c.home || !c.job) continue; const h = G.bld[c.home], j = G.bld[c.job]; if (!h || !j) continue; const d = Math.abs(h.x - j.x) + Math.abs(h.y - j.y), e = m.get(h.id) || [0, 0]; e[0] += d; e[1]++; m.set(h.id, e); }
  return m;
}
const _drawOverlayI = drawOverlay;
drawOverlay = function (g, t, S) {
  _drawOverlayI(g, t, S);
  const k = UI.heat; if (!k || UI.interior) return;
  const H = HEATS[k], bb = G.bb, x0 = Math.max(bb.x0, Math.floor(VX / TS)), y0 = Math.max(bb.y0, Math.floor(VY / TS)), x1 = Math.min(bb.x1, Math.floor((VX + VW) / TS)), y1 = Math.min(bb.y1, Math.floor((VY + VH) / TS));
  g.globalAlpha = 0.55;
  if (k === 'ctvrti') {
    for (let by = y0 >> 4; by <= y1 >> 4; by++) for (let bx = x0 >> 4; bx <= x1 >> 4; bx++) { const d = districtAt(bx * 16, by * 16); if (!d) continue; g.fillStyle = DIST_COL[d]; g.fillRect(bx * 16 * TS + 2, by * 16 * TS + 2, 16 * TS - 4, 16 * TS - 4); }
  } else if (k === 'dojezd') {
    const m = commuteByHome();
    for (const b of VIS_BLD) { const e = m.get(b.id); if (!e) continue; g.fillStyle = SEQ[Math.min(6, Math.floor(e[0] / e[1] / H.max * 7))]; g.fillRect(b.x * TS, b.y * TS, b.w * TS, b.h * TS); }
  } else {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if (!owned(x, y)) continue;
      const v = H.f(x, y); if (v <= 0) continue;
      g.fillStyle = SEQ[Math.min(6, Math.floor(v / H.max * 7))]; g.fillRect(x * TS, y * TS, TS, TS);
    }
  }
  g.globalAlpha = 1;
};
/* the switcher + legend in the corner of the map */
function heatBar() {
  let el = $('heatBar');
  if (!el) { el = document.createElement('div'); el.id = 'heatBar'; el.className = 'panel chamfer'; $('wrap').appendChild(el); el.addEventListener('click', e => { const b = e.target.closest('[data-heat]'); if (b) { setHeat(b.dataset.heat || null); } }); }
  const k = UI.heat;
  let h = `<div class="hchips">${Object.keys(HEATS).map(x => `<button class="chip-btn ${k === x ? 'on' : ''}" data-heat="${x}">${HEATS[x].n}</button>`).join('')}<button class="chip-btn" data-heat="">✕</button></div>`;
  if (k === 'ctvrti') h += `<div class="hleg">${Object.keys(DISTRICTS).map(d => `<span><i style="background:${DIST_COL[d]}"></i>${DISTRICTS[d].n}</span>`).join('')}</div>`;
  else if (k) h += `<div class="hleg"><small>${HEATS[k].d}</small><span class="ramp">${SEQ.map(c => `<i style="background:${c}"></i>`).join('')}</span><small>málo → hodně</small></div>`;
  el.innerHTML = h; el.hidden = !k;
}
function setHeat(k) { UI.heat = k && HEATS[k] ? k : null; heatBar(); UI.dirty = true; }
addEventListener('keydown', e => {
  if (!G || !started || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
  if (e.key === 'h' || e.key === 'H') { const ks = Object.keys(HEATS), i = ks.indexOf(UI.heat); setHeat(i + 1 < ks.length ? ks[i + 1] : null); if (UI.heat) toast('Přehled: ' + HEATS[UI.heat].n + ' (H = další)'); }
});
{ const ov = HELP.find(p => p.id === 'zaklady'); if (ov) ov.t += `<p><b>H</b> = přehledy přes mapu (ruch, útulnost, provoz, zácpy, dojíždění, služby, hodnota pozemků, čtvrti). Grafy vývoje osady najdeš v Příručce → <b>Grafy</b>.</p>`; }

{ const b = $('heatBtn'); if (b) b.addEventListener('click', () => { Sound.click(); setHeat(UI.heat ? null : 'ruch'); }); }
