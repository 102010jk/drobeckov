'use strict';
/* ============ 2.7: cat friendships, meteor showers ============ */

/* ---------- friendships: cats who live or work together grow close ---------- */
const frKey = (a, b) => a < b ? a + ':' + b : b + ':' + a;
function bestFriend(c) {
  if (!G.fr) return null;
  let best = null, bv = 0;
  for (const o of G.cats) { if (o === c) continue; const v = G.fr[frKey(c.id, o.id)] || 0; if (v > bv) { bv = v; best = o; } }
  return bv >= 3 ? [best, bv] : null;
}
MORNING_HOOKS.push(() => {
  if (!G.fr) G.fr = {};
  const byPlace = {};
  for (const c of G.cats) {
    if (c.home) (byPlace['h' + c.home] = byPlace['h' + c.home] || []).push(c);
    if (c.job) (byPlace['j' + c.job] = byPlace['j' + c.job] || []).push(c);
  }
  for (const k in byPlace) {
    const L = byPlace[k]; if (L.length < 2 || L.length > 8) continue;
    for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) {
      const key = frKey(L[i].id, L[j].id), before = G.fr[key] || 0;
      G.fr[key] = Math.min(10, before + (L[i].mood > 50 && L[j].mood > 50 ? 1 : 0.5));
      if (before < 3 && G.fr[key] >= 3) banner('Nové kamarádství', `${L[i].name} a ${L[j].name} jsou teď nejlepší kamarádi.`);
    }
  }
  const alive = new Set(G.cats.map(c => c.id));
  for (const key in G.fr) { const [a, b] = key.split(':').map(Number); if (!alive.has(a) || !alive.has(b)) delete G.fr[key]; }
});
const _moodTarget2 = moodTarget;
moodTarget = function (c) {
  let m = _moodTarget2(c);
  const bf = bestFriend(c);
  if (bf) { m += 3; const o = bf[0]; if (!o.inside && !c.inside && Math.abs(o.x - c.x) + Math.abs(o.y - c.y) < 48) m += 3; }
  return clamp(m, 0, 100);
};
const _inspectCat2 = inspectCat;
inspectCat = function (c) {
  let h = _inspectCat2(c);
  if (!c) return h;
  const bf = bestFriend(c);
  const fam = c.parents ? c.parents.map(id => G.cats.find(x => x.id === id)).filter(Boolean) : [];
  const kids = G.cats.filter(x => x.parents && x.parents.includes(c.id));
  if (bf) h += `<div class="kv"><span>Nejlepší kamarád</span><b><button class="link" data-act="selcat" data-arg="${bf[0].id}">${bf[0].name}</button> ${'♥'.repeat(Math.min(5, Math.floor(bf[1] / 2)))}</b></div>`;
  if (fam.length) h += `<div class="kv"><span>Rodiče</span><b>${fam.map(o => `<button class="link" data-act="selcat" data-arg="${o.id}">${o.name}</button>`).join(', ')}</b></div>`;
  if (kids.length) h += `<div class="kv"><span>Koťata</span><b>${kids.map(o => `<button class="link" data-act="selcat" data-arg="${o.id}">${o.name}</button>`).join(', ')}</b></div>`;
  return h;
};
if (!ACTIONS.selcat) ACTIONS.selcat = id => { UI.select({ kind: 'c', id: +id }); const c = G.cats.find(x => x.id === +id); if (c && !c.inside) centerOn(c.x, c.y); renderPane(true); };
/* friends like to hang out: idle best friends sometimes emote hearts at each other */
let frT = 0;
STEP_HOOKS.push(dt => {
  frT -= dt; if (frT > 0) return; frT = 4;
  for (const c of G.cats) {
    if (c.inside || (c.task && c.task.kind !== 'idle' && c.task.kind !== 'rest')) continue;
    const bf = bestFriend(c); if (!bf) continue;
    const o = bf[0]; if (o.inside || Math.abs(o.x - c.x) + Math.abs(o.y - c.y) > 40) continue;
    if (Math.random() < 0.3) { emote(c, 'heart', 1.5); c.mood = Math.min(100, c.mood + 1); }
  }
});

/* ---------- meteor showers on summer nights ---------- */
const METEORS = [];
MORNING_HOOKS.push(() => {
  G.meteorNight = (seasonIdx() === 1 && Math.random() < 0.4) || (seasonIdx() === 2 && Math.random() < 0.15);
  G.meteorCaught = 0;
  if (G.meteorNight) toast('Dnes v noci budou padat hvězdy! Chytej je kliknutím.');
});
let metT = 0;
STEP_HOOKS.push(dt => {
  if (!G.meteorNight || darkness() < 0.45) { METEORS.length = 0; return; }
  metT -= dt;
  if (metT <= 0 && METEORS.length < 3 && (G.meteorCaught || 0) < 6) {
    metT = rand(1.5, 4.5);
    const dir = Math.random() < 0.5 ? 1 : -1;
    METEORS.push({ x: CAM.x + rand(-VW * 0.45, VW * 0.45), y: CAM.y - VH * 0.5 + rand(4, VH * 0.35), vx: dir * rand(60, 110), vy: rand(30, 60), life: rand(1.6, 2.4), max: 0 });
    METEORS[METEORS.length - 1].max = METEORS[METEORS.length - 1].life;
  }
});
function updateMeteors(dt) { for (let i = METEORS.length - 1; i >= 0; i--) { const m = METEORS[i]; m.x += m.vx * dt; m.y += m.vy * dt; m.life -= dt; if (m.life <= 0) METEORS.splice(i, 1); } }
const _drawWeatherFX = drawWeatherFX;
drawWeatherFX = function (g, dt) {
  _drawWeatherFX(g, dt);
  if (!METEORS.length) return;
  updateMeteors(Math.min(dt, 0.05));
  g.setTransform(1, 0, 0, 1, 0, 0);
  for (const m of METEORS) {
    const a = Math.min(1, m.life / m.max * 2), sx = Math.round(m.x - VX), sy = Math.round(m.y - VY), n = Math.hypot(m.vx, m.vy);
    for (let k = 0; k < 22; k++) { g.globalAlpha = a * (1 - k / 22) * 0.85; g.fillStyle = k < 4 ? '#ffffff' : '#fff4b0'; const s = k < 8 ? 2 : 1; g.fillRect(Math.round(sx - m.vx / n * k * 1.5), Math.round(sy - m.vy / n * k * 1.5), s, s); }
    g.globalAlpha = a; g.fillStyle = '#ffffff'; g.fillRect(sx - 1, sy - 1, 3, 3); g.fillStyle = '#ffd23f'; g.fillRect(sx, sy - 2, 1, 5); g.fillRect(sx - 2, sy, 5, 1);
  }
  g.globalAlpha = 1;
};
const _wildClick = wildClick;
wildClick = function (px, py) {
  for (let i = 0; i < METEORS.length; i++) {
    const m = METEORS[i];
    if (Math.abs(px - m.x) < 12 && Math.abs(py - m.y) < 12) {
      METEORS.splice(i, 1); G.meteorCaught = (G.meteorCaught || 0) + 1; G.stats.meteors = (G.stats.meteors || 0) + 1;
      addStars(1, 'padající hvězda!'); sparkle(px, py, '#ffd23f', 16, 6); Sound.unlock();
      return true;
    }
  }
  return _wildClick(px, py);
};
ACH.push(['meteor', 'Chytač hvězd', () => (G.stats.meteors || 0) >= 5], ['kamaradi', 'Nerozluční', () => G.fr && Object.values(G.fr).some(v => v >= 10)]);
{ const hv = HELP.find(p => p.id === 'hvezdy'); if (hv) hv.t += `<p><b>Padající hvězdy:</b> v některé letní (a vzácně podzimní) noci padají hvězdy. Klikni na ně — každá chycená = hvězdička ★.</p>`; }
{ const kc = HELP.find(p => p.id === 'kocky'); if (kc) kc.t += `<p><b>Kamarádi:</b> kočky, které spolu bydlí nebo pracují, se skamarádí. Nejlepší kamarádi mají lepší náladu, hlavně když jsou blízko sebe. Uvidíš je v detailu kočky i s rodiči a koťaty.</p>`; }

/* ---------- homes near work: cats move closer to their workplace ---------- */
function homeDist(c, h) { const j = c.job && G.bld[c.job]; const x = j ? j.x + j.w / 2 : c.x / TS, y = j ? j.y + j.h / 2 : c.y / TS; return Math.abs(h.x + h.w / 2 - x) + Math.abs(h.y + h.h / 2 - y); }
assignHomes = function () {
  const houses = BLIST.filter(b => B[b.type].beds && b.built);
  const count = {}; for (const c of G.cats) if (c.home) count[c.home] = (count[c.home] || 0) + 1;
  for (const c of G.cats) {
    if (c.home && G.bld[c.home]) continue;
    c.home = 0;
    let best = null, bd = 1e9;
    for (const h of houses) { if ((count[h.id] || 0) >= bedsOf(h)) continue; const d = homeDist(c, h); if (d < bd) { bd = d; best = h; } }
    if (best) { c.home = best.id; count[best.id] = (count[best.id] || 0) + 1; }
  }
};
MORNING_HOOKS.push(() => {
  const houses = BLIST.filter(b => B[b.type].beds && b.built); if (houses.length < 2) return;
  const count = {}; for (const c of G.cats) if (c.home) count[c.home] = (count[c.home] || 0) + 1;
  let moved = 0;
  const workers = G.cats.filter(c => c.job && c.home && G.bld[c.home] && !(c.kitten > G.t));
  for (const c of workers) {   // free beds closer to work
    const d0 = homeDist(c, G.bld[c.home]); let best = null, bd = d0 - 6;
    for (const h of houses) { if (h.id === c.home || (count[h.id] || 0) >= bedsOf(h)) continue; const d = homeDist(c, h); if (d < bd) { bd = d; best = h; } }
    if (best) { count[c.home]--; c.home = best.id; count[best.id] = (count[best.id] || 0) + 1; moved++; }
  }
  const swap = workers.length > 300 ? workers.slice().sort((p, q) => homeDist(q, G.bld[q.home]) - homeDist(p, G.bld[p.home])).slice(0, 300) : workers;   // big towns: only the longest walks
  for (let i = 0; i < swap.length; i++) for (let j = i + 1; j < swap.length; j++) {   // swap homes when both win
    const a = swap[i], b = swap[j]; if (a.home === b.home) continue;
    const ha = G.bld[a.home], hb = G.bld[b.home]; if (!ha || !hb) continue;
    if (homeDist(a, hb) + homeDist(b, ha) < homeDist(a, ha) + homeDist(b, hb) - 8) { const t = a.home; a.home = b.home; b.home = t; moved += 2; }
  }
  if (moved) toast(`${moved} ${moved === 1 ? 'kočka se přestěhovala' : moved < 5 ? 'kočky se přestěhovaly' : 'koček se přestěhovalo'} blíž k práci.`);
});
