'use strict';
/* ============ cozy extras: kittens, skills, hats, journal, stats, weather events ============ */

/* ---------- journal (deník osady) ---------- */
function journal(txt) {
  if (!G) return;
  if (!G.log) G.log = [];
  G.log.unshift([dayIdx(), txt]);
  if (G.log.length > 120) G.log.length = 120;
}
const _banner = banner;
banner = function (a, b) { _banner(a, b); journal(a + (b ? ' — ' + b : '')); };

/* ---------- skills: cats get better at what they do ---------- */
const SKILL_OF = t => { const d = B[t]; if (!d) return null; if (d.field || t === 'kravin' || t === 'ovcin') return 'farma'; if (['pekarna', 'kuchynka', 'cukrarna', 'zavarovna'].includes(t)) return 'kuchyne'; if (d.interior || d.industry || ['tavirna', 'slevarna', 'kovarna', 'dul'].includes(t)) return 'dilna'; if (t === 'laborator' || t === 'skola') return 'veda'; if (t === 'molo' || t === 'rybarna') return 'rybareni'; return 'remeslo'; };
const SKILL_N = { farma: 'Hospodaření', kuchyne: 'Vaření', dilna: 'Dílna', veda: 'Věda', rybareni: 'Rybaření', remeslo: 'Řemeslo', stavba: 'Stavění' };
const skillLv = (c, s) => Math.min(5, Math.floor(Math.sqrt(((c.xp && c.xp[s]) || 0) / 45)));
const _workMul = workMul;
workMul = function (c, b) {
  let m = _workMul(c, b);
  if (b) { const s = !b.built ? 'stavba' : SKILL_OF(b.type); if (s) m *= 1 + 0.06 * skillLv(c, s); }
  if (c.kitten && c.kitten > G.t) m *= 0.5;
  return m;
};
STEP_HOOKS.push(dt => {
  for (const c of G.cats) {
    const k = c.task; if (!k || k.moving || !['work', 'farm', 'build'].includes(k.kind)) continue;
    const b = G.bld[k.b]; if (!b) continue;
    const s = k.kind === 'build' ? 'stavba' : SKILL_OF(b.type); if (!s) continue;
    if (!c.xp) c.xp = {};
    const before = skillLv(c, s);
    c.xp[s] = (c.xp[s] || 0) + dt;
    if (skillLv(c, s) > before) { emote(c, 'star', 2.5); toast(`${c.name} se zlepšil${'a'}: ${SKILL_N[s]} ${'★'.repeat(skillLv(c, s))}`); }
  }
});

/* ---------- kittens ---------- */
MORNING_HOOKS.push(() => {
  if (G.cats.length < 4 || freeBeds() <= 0) return;
  for (const h of BLIST) {
    if (!B[h.type].beds || !h.built) continue;
    const pair = G.cats.filter(c => c.home === h.id && !(c.kitten > G.t));
    if (pair.length < 2 || pair.some(c => c.mood < 72)) continue;
    if (Math.random() > 0.12 + (h.pillows ? 0.06 : 0)) continue;
    const mom = pair[0], dad = pair[1];
    const k = newCat(Math.random() < 0.5 ? mom.skin : dad.skin, Math.random() < 0.5 ? mom.trait : dad.trait, null, mom.x, mom.y);
    k.kitten = G.t + 2 * DAY; k.parents = [mom.id, dad.id];
    assignHomes();
    banner('Narodilo se koťátko!', `${k.name} — ${mom.name} a ${dad.name} mají radost. Za 2 dny vyroste.`);
    Sound.meow(); emote(mom, 'heart', 4); emote(dad, 'heart', 4);
    G.stats.kittens = (G.stats.kittens || 0) + 1;
    return;
  }
});
const KIT_ROWS = { walk0: ['.....f.f', '.....fff', 'f....efe', '.ffffffn', '.fllllf.', '.f.f.f.f'], walk1: ['.....f.f', '.....fff', 'f....efe', '.ffffffn', '.fllllf.', '..f.f.f.'], sit: ['...f.f.', '...fff.', '...efe.', 'f.ffnf.', '.fffll.', '.fflll.', '..f.f..'], sleep: ['..f.f..', '.fffff.', 'ffeefff', 'flllfff', '.fffff.'] };
const KIT_CACHE = {};
function kitSpr(si) {
  if (KIT_CACHE[si]) return KIT_CACHE[si];
  const sk = SKINS[si] || SKINS[0], pal = { f: sk.f, s: sk.s, l: sk.l, p: sk.p, n: sk.n, e: sk.eye[3] }, o = {};
  for (const k in KIT_ROWS) o[k] = buildSprite(KIT_ROWS[k], pal, sk.o);
  return (KIT_CACHE[si] = o);
}
const _catSpr = catSpr;
catSprFor = c => (c.kitten && c.kitten > G.t ? kitSpr(c.skin) : _catSpr(c.skin));

/* ---------- hats ---------- */
const HATS = {
  klobouk: { n: 'Slaměný klobouk', rows: ['..yyy..', '.yYYYy.', 'yyyyyyy'], price: 60 },
  masle: { n: 'Mašle', rows: ['pp.pp', 'pPpPp', 'pp.pp'], price: 40 },
  korunka: { n: 'Korunka', rows: ['y.y.y', 'yyyyy', 'yryyy'], price: 250 },
  cepice: { n: 'Zimní čepice', rows: ['..w..', '.rrr.', 'rrrrr', 'wwwww'], price: 80 },
  helma: { n: 'Hornická helma', rows: ['..y..', '.ooo.', 'ooooo', 'O...O'], price: 120 },
  cylindr: { n: 'Cylindr', rows: ['.xxx.', '.xxx.', '.xrx.', 'xxxxx'], price: 180 },
  kvetina: { n: 'Kytička', rows: ['.p.', 'pyp', '.g.'], price: 30 }
};
for (const k in HATS) HATS[k].spr = buildSprite(HATS[k].rows, PAL, OUT);
const HEAD_AT = { walk0: [10, 0], walk1: [10, 0], sit: [7, 0], sleep: [3, 1] };
function drawHat(g, c, s, cx, y, animKey) {
  if (!c.hat || !HATS[c.hat] || c.kitten > G.t) return;
  const h = HATS[c.hat].spr, at = HEAD_AT[animKey] || [7, 0];
  let hx = cx - (s.w >> 1) + at[0] + 1 - (h.w >> 1);
  if (c.face < 0) hx = cx + (s.w >> 1) - at[0] - 1 - (h.w >> 1) + ((s.w & 1) ? 0 : 1);
  g.drawImage(h.c, hx, y + at[1] - h.h + 2);
}
ACTIONS.hatbuy = k => { const h = HATS[k]; if (!h || G.coins < h.price) { toast('Málo mincí.'); Sound.nope(); return; } G.coins -= h.price; if (!G.hats) G.hats = {}; G.hats[k] = (G.hats[k] || 0) + 1; Sound.coin(); toast('Koupeno: ' + h.n); };
ACTIONS.hatset = arg => { const [id, k] = arg.split(':'); const c = G.cats.find(x => x.id === +id); if (!c) return; if (c.hat) { G.hats[c.hat] = (G.hats[c.hat] || 0) + 1; c.hat = null; } if (k && G.hats && G.hats[k] > 0) { G.hats[k]--; c.hat = k; emote(c, 'heart', 2); } };
function hatIcon(k) { const h = HATS[k]; if (!h.url) h.url = h.spr.c.toDataURL(); return `<img class="ico" src="${h.url}" width="${h.spr.w * 3}" height="${h.spr.h * 3}" alt="">`; }

/* ---------- renaming ---------- */
ACTIONS.rename = id => { UI.renaming = +id; };
ACTIONS.renameok = id => { const c = G.cats.find(x => x.id === +id), inp = $('renameInp'); if (c && inp && inp.value.trim()) { c.name = inp.value.trim().slice(0, 18); toast('Teď se jmenuje ' + c.name); } UI.renaming = null; };
ACTIONS.townrename = () => { const inp = $('townInp'); if (inp && inp.value.trim()) { G.name = inp.value.trim().slice(0, 28); toast('Osada se jmenuje ' + G.name); } };
const _inspectCat = inspectCat;
inspectCat = function (c) {
  if (!c) return '';
  let h = _inspectCat(c);
  const sk = Object.keys(c.xp || {}).filter(s => skillLv(c, s) > 0);
  if (sk.length) h += `<div class="kv"><span>Zkušenosti</span><b>${sk.map(s => SKILL_N[s] + ' ' + '★'.repeat(skillLv(c, s))).join(' · ')}</b></div>`;
  if (c.kitten > G.t) h += `<div class="pill wait">Koťátko — vyroste za ${Math.ceil((c.kitten - G.t) / DAY * 24)} h</div>`;
  if (UI.renaming === c.id) h += `<div class="form"><input id="renameInp" maxlength="18" value="${c.name}"><button class="btn small chamfer" data-act="renameok" data-arg="${c.id}">Uložit jméno</button></div>`;
  else h += ` <button class="link" data-act="rename" data-arg="${c.id}">Přejmenovat</button>`;
  const owned = Object.keys(G.hats || {}).filter(k => G.hats[k] > 0);
  h += `<h4>Klobouček</h4><div class="inv">${c.hat ? `${hatIcon(c.hat)} <button class="link" data-act="hatset" data-arg="${c.id}:">sundat</button>` : '<small>žádný</small>'} ${owned.map(k => `<button class="tog" data-act="hatset" data-arg="${c.id}:${k}">${hatIcon(k)}</button>`).join('')}</div>`;
  if (!owned.length && !c.hat) h += '<p class="muted">Kloboučky se kupují v Příručce → Kloboučky.</p>';
  return h;
};

/* ---------- weather events ---------- */
MORNING_HOOKS.push(() => {
  const S = seasonIdx();
  G.rainbow = false; G.storm = false;
  if (G.weather === 'rain' && S === 1 && Math.random() < 0.35) { G.storm = true; banner('Bouřka!', 'Kočky raději zůstanou blíž domovu. Pole ale zalije vydatně.'); }
  if (G.lastWeather === 'rain' && G.weather === 'clear' && Math.random() < 0.5) { G.rainbow = true; banner('Duha nad údolím', 'Všechny kočky mají dnes lepší náladu.'); }
  G.lastWeather = G.weather;
});
const _moodTarget = moodTarget;
moodTarget = function (c) { let m = _moodTarget(c); if (G.rainbow) m += 8; if (G.storm && !c.inside) m -= 6; return clamp(m, 0, 100); };
let flashT = 0;
STEP_HOOKS.push(dt => { if (G.storm && Math.random() < dt * 0.08) { flashT = 0.25; if (Math.random() < 0.5) Sound.chop(); } });
function drawWeatherFX(g, dt) {
  g.setTransform(1, 0, 0, 1, 0, 0);
  if (flashT > 0) { flashT -= dt; g.fillStyle = `rgba(255,255,240,${flashT * 1.6})`; g.fillRect(0, 0, VW, VH); }
  if (G.rainbow && darkness() < 0.2) {
    const cols = ['#ff6f9c', '#f79a3a', '#ffd23f', '#7bd6b0', '#6ab4f0', '#b89ae8'], cx = VW * 0.7, cy = VH * 0.9, r0 = Math.min(VW, VH) * 0.7;
    g.globalAlpha = 0.18;
    cols.forEach((c, i) => { g.strokeStyle = c; g.lineWidth = 3; g.beginPath(); g.arc(cx, cy, r0 - i * 3, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); });
    g.globalAlpha = 1;
  }
  if (G.storm) { g.fillStyle = 'rgba(30,30,60,0.12)'; g.fillRect(0, 0, VW, VH); }
}

/* ---------- statistics ---------- */
MORNING_HOOKS.push(() => {
  if (!G.hist) G.hist = [];
  G.hist.push([dayIdx(), Math.floor(G.coins), G.cats.length, Math.floor(G.stats.earned), BLIST.length]);
  if (G.hist.length > 160) G.hist.shift();
});
function statsCanvas() {
  const H = G.hist || []; if (H.length < 2) return '<p class="muted">Graf se ukáže po pár dnech hraní.</p>';
  const [c, g] = mk(300, 120);
  R(g, '#fff4dc', 0, 0, 300, 120);
  const series = [[3, '#e8962a', 'vyděláno'], [2, '#e0608e', 'koček']];
  series.forEach(([i, col], si) => {
    const max = Math.max(1, ...H.map(r => r[i]));
    g.strokeStyle = col; g.lineWidth = 2; g.beginPath();
    H.forEach((r, k) => { const x = 6 + k / (H.length - 1) * 288, y = 112 - r[i] / max * 100; k ? g.lineTo(x, y) : g.moveTo(x, y); });
    g.stroke();
    g.fillStyle = col; g.fillText(series[si][2] + ' (max ' + shortNum(max) + ')', 8, 12 + si * 12);
  });
  return `<img src="${c.toDataURL()}" width="300" height="120" alt="Graf vývoje osady" style="border:2px solid #2b1b2b;max-width:100%">`;
}
HELP.push({ id: 'denik', n: 'Deník', t: '' }, { id: 'stats', n: 'Statistiky', t: '' }, { id: 'hats', n: 'Kloboučky', t: '' });
const _helpTab2 = EXTRA_TABS.help;
EXTRA_TABS.help = () => {
  const chips = '<div class="chips">' + HELP.map(p => `<button class="chip-btn ${helpPage === p.id ? 'on' : ''}" data-act="help" data-arg="${p.id}">${p.n}</button>`).join('') + '</div>';
  if (helpPage === 'denik') return chips + '<div class="help-page"><h3>Deník osady</h3>' + ((G.log || []).map(([d, t]) => `<p><small class="muted">den ${d + 1}</small> ${t}</p>`).join('') || '<p class="muted">Zatím se nic nestalo.</p>') + '</div>';
  if (helpPage === 'stats') {
    const s = G.stats;
    return chips + `<div class="help-page"><h3>Statistiky</h3>${statsCanvas()}<p>Rok ${yearIdx()}, den ${dayIdx() + 1} · čas hraní ${fmtTime(G.playTime)}</p><p>Vyděláno celkem <b>${fmt(s.earned)}</b> mincí · zakázek ${s.orders} · prodáno na stánku ${s.sold} · obchod ${s.traded || 0}</p><p>Koček ${G.cats.length} (koťátek narozeno ${s.kittens || 0}) · staveb ${BLIST.length} · pozemků ${G.owned.length} · objevených míst ${Object.keys(G.poiDone).length}</p>
      <h3>Vyrobeno</h3><div class="inv">${Object.entries(s.made).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]).map(([k, n]) => ITEMS[k] ? itemIcon(k, 1) + '<small>' + shortNum(n) + '</small>' : '').join(' ')}</div>
      <h3>Osada</h3><div class="form"><label for="townInp">Název osady</label><input id="townInp" maxlength="28" value="${G.name}"><button class="btn small chamfer" data-act="townrename">Přejmenovat osadu</button></div></div>`;
  }
  if (helpPage === 'hats') return chips + '<div class="help-page"><h3>Kloboučky pro kočky</h3><p>Kup klobouček a nasaď ho kočce v jejím panelu.</p>' + Object.keys(HATS).map(k => `<div class="srow">${hatIcon(k)}<span class="sn">${HATS[k].n} <small>máš ${(G.hats && G.hats[k]) || 0}</small></span><b></b><span></span><button class="tog buy" data-act="hatbuy" data-arg="${k}">${HATS[k].stars ? "★ " + HATS[k].stars : HATS[k].price}</button></div>`).join('') + '</div>';
  return _helpTab2();
};
