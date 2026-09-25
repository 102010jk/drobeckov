'use strict';
/* ============ UI state ============ */
const UI = {
  sel: null, tool: null, hover: null, hoverPx: null, speed: 1, dirty: true, tab: 'build', bcat: 'vyroba',
  pick: false, confirm: 0, lastPane: '', paneT: 0, hudT: 0
};
const fmt = n => Math.floor(n).toLocaleString('cs-CZ');
function setIco(el, k, sc) {
  if (el.dataset.k === k) return;
  const s = SPR[k]; if (!s) return;
  el.dataset.k = k; el.src = iconURL(k); el.width = s.w * sc; el.height = s.h * sc;
}
const itemIcon = (k, sc) => icon(k, sc || 2);
function hhmm() { const h = hour(); return String(Math.floor(h)).padStart(2, '0') + ':' + String(Math.floor((h % 1) * 6) * 10).padStart(2, '0'); }

/* ============ toast & banner ============ */
let toastTO = 0;
function toast(msg) {
  const el = $('toast'); el.textContent = msg;
  el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
}
const bannerQ = [];
let bannerBusy = false;
function banner(a, b) { bannerQ.push([a, b]); if (!bannerBusy) nextBanner(); }
function nextBanner() {
  const it = bannerQ.shift(); if (!it) { bannerBusy = false; return; }
  bannerBusy = true;
  const el = $('banner'); el.querySelector('.b1').textContent = it[0]; el.querySelector('.b2').textContent = it[1] || '';
  el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
  setTimeout(nextBanner, 2700);
}

/* ============ building icons ============ */
const BICON = {};
function bIcon(type) {
  if (BICON[type]) return BICON[type];
  const d = B[type];
  if (d.tool) { const s = SPR.hammer; return (BICON[type] = { url: iconURL('hammer'), w: s.w * 3, h: s.h * 3 }); }
  const w = (d.w || 1) * TS + 16, h = (d.h || 1) * TS + 20, [c, g] = mk(w, h), X = 8, Y = 18;
  if (d.ground === 'path') { shape(g, [[X + 1, Y + 1, 14, 14, '#d8b078']], '#b08850'); R(g, '#ecd0a0', X + 4, Y + 5, 1, 1); R(g, '#b08850', X + 10, Y + 9, 1, 1); }
  else if (d.ground === 'bridge') { R(g, '#5aa8e6', X - 2, Y, 20, 16); R(g, OUT, X, Y + 1, 16, 14); for (let i = 0; i < 8; i++) R(g, i % 2 ? '#a8693e' : '#c47a3a', X + i * 2, Y + 2, 2, 12); R(g, '#6b4128', X, Y + 2, 16, 1); R(g, '#6b4128', X, Y + 13, 16, 1); }
  else if (d.tree) drawTree(g, X + 8, Y + 15, { g: 1, v: 0.4 }, 1, 0);
  else drawBuilding(g, { type, id: 1, w: d.w || 1, h: d.h || 1, st: 2, crop: 'psenice', g: 1, inp: {}, out: {}, workers: [], mature: true }, X, Y, 0, 1, false);
  return (BICON[type] = { url: c.toDataURL(), w, h });
}
function costHTML(d) {
  const poorC = G.coins < d.cost, poorW = d.wood && (d.instant || d.ground) && avail('drevo') < d.wood;
  let s = `<span class="${poorC ? 'poor' : ''}">${icon('coin', 1)}${d.cost}</span>`;
  if (d.wood) s += ` <span class="${poorW ? 'poor' : ''}">${icon('drevo', 1)}${d.wood}</span>`;
  return s;
}
const recipeHTML = (r, sc) => Object.entries(RECIPES[r].in).map(([k, n]) => `${n > 1 ? n + '×' : ''}${itemIcon(k, sc || 1)}`).join('<i class="plus">+</i>') + `<i class="arr">→</i>${RECIPES[r].n > 1 ? RECIPES[r].n + '×' : ''}${itemIcon(RECIPES[r].out, sc || 1)}`;

/* ============ panes ============ */
function paneBuild() {
  let h = `<div class="chips">${BCATS.map(([k, n]) => `<button class="chip-btn ${UI.bcat === k ? 'on' : ''}" data-act="bcat" data-arg="${k}">${n}</button>`).join('')}</div><div class="cards">`;
  for (const type in B) {
    const d = B[type]; if (d.cat !== UI.bcat || d.fixed) continue;
    if (d.flag && !G.flags[d.flag]) continue;
    const ic = bIcon(type), unlocked = isUnlockedB(type);
    const lockTxt = unlocked ? '' : d.zone && !G.zones[d.zone] ? 'Odemkni ' + ZONES[d.zone].n : d.flag ? 'Už stojí' : lockText(d.lock);
    h += `<button class="card ${UI.tool === type ? 'on' : ''} ${lockTxt ? 'locked' : ''}" data-act="tool" data-arg="${type}">
      <span class="cimg"><img src="${ic.url}" width="${ic.w}" height="${ic.h}" alt=""></span>
      <span class="cname">${d.n}</span><span class="ccost">${lockTxt ? icon('lock', 1) + ' ' + lockTxt : d.tool ? 'nástroj' : costHTML(d)}</span></button>`;
  }
  h += '</div>';
  const sel = UI.tool && B[UI.tool];
  if (sel) {
    const drag = ['cesta', 'plot', 'kvetiny', 'stromek', 'zbourat', 'lavka'].includes(UI.tool);
    const rec = sel.recipes ? '<div class="reclist">' + sel.recipes.map(r => `<span class="rec ${recipeUnlocked(r) ? '' : 'locked'}">${recipeHTML(r)}</span>`).join('') + '</div>' : '';
    h += `<div class="hint"><b>${sel.n}</b> — ${sel.desc}${sel.workers ? ` Pracovníci: ${sel.workers}.` : ''}${rec}<small>Klik = postavit${drag ? ' · můžeš táhnout' : ''} · pravé tlačítko nebo Esc = zrušit</small></div>`;
  } else h += `<div class="hint">Vyber stavbu a klikni do údolí. Za mince se hned založí staveniště, dřevo na něj donesou kočky ze spižírny.</div>`;
  return h;
}
function heartsHTML(k) {
  const lv = nbLevel(k); let s = '';
  for (let i = 1; i <= 10; i++) s += `<img class="ico" src="${iconURL(i <= lv ? 'heart' : 'heartE')}" width="9" height="8" alt="">`;
  return `<span class="hearts" title="♥${lv}">${s}</span>`;
}
function paneOrders() {
  const S = seasonIdx(), f = FEST[S], st = festState(), done = G.festDone[st.key];
  let h = `<div class="fest"><div class="fhead"><b>${f.n}</b><small>${SEASONS[S].name} · den ${dayInSeason()}/${SDAYS}</small></div><div class="lines">`;
  for (const k in f.need) { const got = st.got[k] || 0; h += `<span class="line ${got >= f.need[k] ? 'ok' : ''}">${itemIcon(k)}<b>${got}/${f.need[k]}</b><small>${(G.stock[k] || 0) > 0 && got < f.need[k] ? 've spižírně ' + G.stock[k] : ''}</small></span>`; }
  h += `</div><div class="freward">Odměna: ${icon('coin', 1)} ${f.coins}${!G.festFirst[S] ? ' · ' + f.firstTxt : ''}</div>`;
  h += done ? `<div class="pill ok">Slavnost se vydařila!</div>` : `<button class="btn small chamfer" data-act="fest">Odevzdat ze spižírny</button>`;
  h += '</div><h4>Zakázky na nástěnce</h4>';
  if (!G.orders.length) h += '<p class="muted">Nástěnka je prázdná. Sousedé brzy něco přinesou.</p>';
  for (const o of G.orders) {
    const nb = NEIGH[o.nb], ok = canDeliver(o), left = (o.exp - G.t) / DAY;
    h += `<div class="order"><div class="ohead">${animalIcon(nb.sp, 2)}<div><b>${nb.n}</b><small>zbývá ${left >= 1 ? left.toFixed(1).replace('.', ',') + ' dne' : Math.max(1, Math.round(left * 24)) + ' h'}</small></div></div><div class="lines">`;
    for (const [k, q] of o.lines) { const have = G.stock[k] || 0; h += `<span class="line ${have >= q ? 'ok' : ''}">${itemIcon(k)}<b>${Math.min(have, q)}/${q}</b><small>${ITEMS[k].n}</small></span>`; }
    h += `</div><div class="ofoot"><span>${icon('coin', 1)} ${o.coins} · ${icon('heart', 1)} ${o.xp}</span><button class="btn small chamfer ${ok ? '' : 'locked'}" data-act="deliver" data-arg="${o.id}">Doručit</button></div></div>`;
  }
  h += '<h4>Sousedé</h4>';
  for (const k in NEIGH) {
    const nb = NEIGH[k], lv = nbLevel(k), next = unlocksOf(k).find(u => u.lv > lv), xp = G.nb[k] || 0;
    const need = lv < 10 ? HEART_XP[lv + 1] : xp;
    h += `<div class="nb">${animalIcon(nb.sp, 2)}<div class="nbt"><b>${nb.n}</b>${heartsHTML(k)}<small>${next ? `♥${next.lv}: ${next.txt}` : 'Všechno odemčeno'} · ${xp}/${need}</small></div></div>`;
  }
  return h;
}
function moodWord(m) { return m >= 75 ? 'šťastná' : m >= 50 ? 'spokojená' : m >= 25 ? 'mrzutá' : 'smutná'; }
function paneCats() {
  const cz = coziness(), need = needCozy(G.cats.length), beds = freeBeds();
  let h = `<div class="sum">Útulnost <b>${cz}</b> · další kočka přijde ráno, až bude útulnost ${need}+ ${cz >= need ? '✓' : ''} a volný pelíšek ${beds > 0 ? '✓' : '(postav domek)'}.</div>`;
  for (const c of G.cats) {
    const job = c.job && G.bld[c.job] ? B[G.bld[c.job].type].n : 'pomocnice';
    h += `<button class="catrow ${UI.sel && UI.sel.kind === 'c' && UI.sel.id === c.id ? 'on' : ''}" data-act="selcat" data-arg="${c.id}">${catHead(c.skin, 2)}<span class="ct"><b>${c.name}</b><small>${TRAITS[c.trait].n} · ${job}</small><small class="act">${catActivity(c)}</small></span>${bar(c.mood, 'mood')}</button>`;
  }
  return h;
}
function bar(v, cls) { return `<span class="bar ${cls || ''}"><i style="width:${Math.round(clamp(v, 0, 100))}%"></i></span>`; }
function paneStore() {
  const tot = stockTotal(), cap = capacity();
  let h = `<div class="sum">Spižírny: <b>${tot}/${cap}</b> ${bar(cap ? tot / cap * 100 : 100, tot >= cap ? 'bad' : '')}</div>`;
  const hasStall = countB('trziste') > 0;
  h += `<p class="muted">${hasStall ? '„Stánek“ = prodavačka to nosí na pult (0,85× cena).' : 'Postav Tržní stánek — prodává samo za 0,85× cenu.'} „Vykoupit“ = Liška hned odkoupí 5 kusů za polovic. Jídlo pro kočky: sušenky, ryby, chléb, mléko.</p><div class="stock">`;
  const keys = Object.keys(ITEMS).filter(k => (G.stock[k] || 0) > 0 || producible(k));
  for (const k of keys) {
    const n = G.stock[k] || 0, pay = Math.max(1, Math.floor(ITEMS[k].v * 0.5 * Math.min(5, n)));
    h += `<div class="srow ${n ? '' : 'zero'}">${itemIcon(k)}<span class="sn">${ITEMS[k].n}${ITEMS[k].food ? ' <small>jídlo</small>' : ''}</span><b>${n}</b>
      <button class="tog ${G.sell[k] ? 'on' : ''}" data-act="sell" data-arg="${k}" aria-pressed="${!!G.sell[k]}" title="Nosit na tržní stánek">${G.sell[k] ? 'stánek ✓' : 'stánek'}</button>
      <button class="tog buy" data-act="buyout" data-arg="${k}" ${n ? '' : 'disabled'} title="Liška odkoupí až 5 kusů za polovic">${n ? '+' + pay : '—'}</button></div>`;
  }
  return h + '</div>';
}
function paneInspect() {
  const s = UI.sel;
  if (s.kind === 'c') return inspectCat(G.cats.find(c => c.id === s.id));
  if (s.kind === 'z') return inspectZone(s.id);
  return inspectBld(G.bld[s.id]);
}
function head(iconHtml, title, sub) {
  return `<div class="ihead">${iconHtml}<div><h3>${title}</h3>${sub ? `<small>${sub}</small>` : ''}</div><button class="sq chamfer x" data-act="close" aria-label="Zavřít">✕</button></div>`;
}
function inspectZone(k) {
  const z = ZONES[k];
  return head(icon('lock', 3), z.n, 'Zamčené území') + `<p>${z.desc || ''}</p><p class="muted">Zóny se dají odemknout i splněním sezónní slavnosti.</p><button class="btn chamfer ${G.coins >= z.cost ? '' : 'locked'}" data-act="zone" data-arg="${k}">Odemknout za ${z.cost} mincí</button>`;
}
function inspectCat(c) {
  if (!c) return '';
  const home = c.home && G.bld[c.home], job = c.job && G.bld[c.job];
  let h = head(catHead(c.skin, 3), c.name, `${SKINS[c.skin].name} kočka · ${TRAITS[c.trait].n}`);
  h += `<p class="muted">${TRAITS[c.trait].n}: ${TRAITS[c.trait].d}.</p>`;
  h += `<div class="stat"><span>Energie</span>${bar(c.energy, c.energy < 20 ? 'bad' : '')}</div><div class="stat"><span>Sytost</span>${bar(c.food, c.food < 25 ? 'bad' : '')}</div><div class="stat"><span>Nálada</span>${bar(c.mood, 'mood')}<small>${moodWord(c.mood)} · práce ${Math.round(workMul(c, null) * 100)} %</small></div>`;
  h += `<div class="kv"><span>Teď</span><b>${catActivity(c)}</b></div>`;
  h += `<div class="kv"><span>Domov</span>${home ? `<button class="link" data-act="selb" data-arg="${home.id}">Kočičí domek</button>` : '<b class="poor">nemá — postav domek</b>'}</div>`;
  h += `<div class="kv"><span>Práce</span>${job ? `<button class="link" data-act="selb" data-arg="${job.id}">${B[job.type].n}</button> <button class="link" data-act="unassign" data-arg="${c.id}">uvolnit</button>` : '<b>pomáhá, kde je potřeba</b>'}</div>`;
  h += `<p class="muted">Náladu zlepší jídlo, spánek v domku, ozdoby kolem domku, hraní a pohlazení.</p>`;
  h += `<button class="btn chamfer" data-act="pet" data-arg="${c.id}">Pohladit</button>`;
  return h;
}
function inspectBld(b) {
  if (!b) return '';
  const d = B[b.type], ic = bIcon(b.type);
  const [txt, cls] = bStatus(b);
  let h = head(`<img src="${ic.url}" width="${ic.w}" height="${ic.h}" alt="">`, d.n, b.built ? '' : 'Staveniště');
  h += `<p class="muted">${d.desc}</p>`;
  if (txt) h += `<div class="pill ${cls}">${txt}</div>`;
  if (!b.built) {
    const need = (b.need && b.need.drevo) || 0;
    if (d.wood) h += `<div class="kv"><span>Dřevo</span><b>${(d.wood - need)}/${d.wood}</b>${bar((d.wood - need) / d.wood * 100)}</div>`;
    h += `<div class="kv"><span>Stavba</span>${bar((1 - b.work / b.workTotal) * 100)}</div>`;
  }
  if (b.built && d.field) {
    h += `<h4>Plodina</h4><div class="crops">`;
    for (const k in CROPS) {
      const cr = CROPS[k], un = cropUnlocked(k), sn = cr.s.map((v, i) => `<i class="sd ${v ? 'on' : ''}" title="${SEASONS[i].name}">${SEASONS[i].name[0]}</i>`).join('');
      h += `<button class="cropb ${b.crop === k ? 'on' : ''} ${un ? '' : 'locked'}" data-act="crop" data-arg="${k}">${itemIcon(k)}<span>${cr.n}<small>${un ? sn : lockText(cr.lock)}</small></span></button>`;
    }
    h += '</div>';
    if (b.st === 1) h += `<div class="kv"><span>Růst</span>${bar(b.g * 100)}</div>`;
  }
  if (b.built && d.recipes) {
    h += `<h4>Recept</h4><div class="reclist">`;
    for (const r of d.recipes) { const un = recipeUnlocked(r); h += `<button class="rec ${b.recipe === r ? 'on' : ''} ${un ? '' : 'locked'}" data-act="recipe" data-arg="${r}">${recipeHTML(r, 2)}${un ? '' : `<small>${lockText(RECIPES[r].lock)}</small>`}</button>`; }
    h += '</div>';
    if (b.cyc) h += `<div class="kv"><span>Hotovo</span>${bar(b.p * 100)}</div>`;
  }
  if (b.built && (d.recipes || d.market)) {
    const inv = Object.keys(b.inp).filter(k => b.inp[k] > 0);
    h += `<div class="kv"><span>${d.market ? 'Na pultu' : 'Uvnitř'}</span><span class="inv">${inv.length ? inv.map(k => `${itemIcon(k)}<b>${b.inp[k]}</b>`).join(' ') : '<small>nic</small>'}</span></div>`;
  }
  const outs = Object.keys(b.out).filter(k => b.out[k] > 0);
  if (b.built && outs.length) h += `<div class="kv"><span>K odnesení</span><span class="inv">${outs.map(k => `${itemIcon(k)}<b>${b.out[k]}</b>`).join(' ')}</span></div>`;
  if (b.built && d.workers) {
    h += `<h4>Pracovníci ${b.workers.length}/${d.workers}</h4>`;
    for (const id of b.workers) { const c = G.cats.find(x => x.id === id); if (c) h += `<div class="worker">${catHead(c.skin, 2)}<span><b>${c.name}</b><small>${TRAITS[c.trait].n}${traitFits(c.trait, b.type) ? ' ✓ hodí se sem' : ''}</small></span><button class="link" data-act="unassign" data-arg="${c.id}">uvolnit</button></div>`; }
    if (b.workers.length < d.workers) h += UI.pick ? pickList(b) : `<button class="btn small alt chamfer" data-act="pick">Přiřadit kočku</button>`;
  }
  if (b.built && d.beds) {
    const res = G.cats.filter(c => c.home === b.id);
    h += `<h4>Bydlí tu</h4>` + (res.length ? res.map(c => `<button class="worker" data-act="selcat" data-arg="${c.id}">${catHead(c.skin, 2)}<span><b>${c.name}</b><small>${catActivity(c)}</small></span></button>`).join('') : '<p class="muted">Zatím nikdo — nová kočka se nastěhuje ráno.</p>') + `<div class="kv"><span>Ozdoby kolem</span><b>${cozyNear(b.x, b.y, 3)}</b></div>`;
  }
  if (b.built && d.store) h += `<button class="btn small alt chamfer" data-act="tab" data-arg="store">Otevřít sklad</button>`;
  if (d.board) h += `<button class="btn small alt chamfer" data-act="tab" data-arg="orders">Otevřít zakázky</button>`;
  if (!d.fixed) h += `<div class="danger"><button class="link ${UI.confirm === b.id ? 'poor' : ''}" data-act="demolish" data-arg="${b.id}">${UI.confirm === b.id ? 'Opravdu zbourat? Klikni znovu' : 'Zbourat (vrátí polovinu)'}</button></div>`;
  return h;
}
function pickList(b) {
  let h = '<div class="picker"><small>Vyber kočku:</small>';
  const cats = G.cats.slice().sort((p, q) => (traitFits(q.trait, b.type) - traitFits(p.trait, b.type)) || ((p.job ? 1 : 0) - (q.job ? 1 : 0)));
  for (const c of cats) {
    if (b.workers.includes(c.id)) continue;
    const job = c.job && G.bld[c.job] ? B[G.bld[c.job].type].n : 'volná';
    h += `<button class="worker" data-act="assign" data-arg="${c.id}">${catHead(c.skin, 2)}<span><b>${c.name}</b><small>${TRAITS[c.trait].n}${traitFits(c.trait, b.type) ? ' ✓' : ''} · ${job}</small></span></button>`;
  }
  return h + '</div>';
}
function bStatus(b) {
  const d = B[b.type];
  if (!zoneOpen(b.x, b.y)) return ['Zamčené území', 'wait'];
  if (!b.built) { const nd = (b.need && b.need.drevo) || 0; if (nd > 0) return ['Čeká na dřevo (' + nd + ')', avail('drevo') > 0 ? 'wait' : 'bad']; return [b.builders ? 'Staví se' : 'Čeká na stavitele', 'ok']; }
  if (d.field) {
    const ok = cropOK(b);
    if (b.st === 2) return [sumObj(b.out) + CROPS[b.crop].yield > 16 ? 'Zralé — nejdřív odnést úrodu' : 'Zralé ke sklizni', 'ok'];
    if (b.st === 1) return (d.glass || CROPS[b.crop].s[seasonIdx()]) ? ['Roste ' + Math.floor(b.g * 100) + ' %', 'ok'] : ['Mimo sezónu — čeká', 'wait'];
    return ok ? ['Čeká na zasetí', 'wait'] : ['Tahle plodina teď neroste', 'bad'];
  }
  if (d.workers && !b.workers.length) return ['Nikdo tu nepracuje', 'bad'];
  if (d.recipes) {
    const r = RECIPES[b.recipe];
    if (b.cyc) return [b.working ? 'Pracuje' : 'Rozpracováno', 'ok'];
    if (sumObj(b.out) >= OUTCAP) return ['Plno — čeká na odnos', storeRoom() > 0 ? 'wait' : 'bad'];
    const miss = Object.keys(r.in).filter(k => (b.inp[k] || 0) < r.in[k]);
    if (miss.length) return ['Chybí: ' + miss.map(k => ITEMS[k].n.toLowerCase()).join(', '), miss.some(k => avail(k) <= 0 && !(b.inc[k] > 0)) ? 'bad' : 'wait'];
    return [isNight() ? 'Noc — ráno se pokračuje' : 'Připraveno', 'ok'];
  }
  if (d.fish) return [isNight() ? 'Noc' : b.working ? 'Chytá ryby' : 'Čeká na rybáře', 'ok'];
  if (d.chop) return chopTarget(b) ? [b.working ? 'Kácí' : 'Připraveno', 'ok'] : ['Žádné dospělé stromy v okruhu 5', 'bad'];
  if (d.market) return sumObj(b.inp) ? [b.working ? 'Prodává' : 'Čeká na prodavačku', 'ok'] : ['Prázdný pult — označ zboží ve skladu', 'wait'];
  if (d.bees) return [b.active ? 'Včely pracují · květin v okolí: ' + flowersNear(b) : 'Včely spí', b.active ? 'ok' : 'wait'];
  if (d.orchard) return [!b.mature ? 'Roste' : (seasonIdx() === 1 || seasonIdx() === 2) ? 'Plodí jablka' : 'Plodí v létě a na podzim', 'ok'];
  if (d.store) return [`Sklad ${stockTotal()}/${capacity()}`, stockTotal() >= capacity() ? 'bad' : 'ok'];
  if (d.beds) return [`Bydlí tu ${G.cats.filter(c => c.home === b.id).length}/${d.beds}`, 'ok'];
  if (d.board) return [`${G.orders.length} zakázk${G.orders.length === 1 ? 'a' : G.orders.length >= 2 && G.orders.length <= 4 ? 'y' : ''}`, 'ok'];
  if (d.cozy) return [`+${d.cozy} útulnost`, 'ok'];
  return ['', 'ok'];
}

/* ============ render panes ============ */
function renderPane(force) {
  const pane = $('pane');
  let h;
  if (UI.sel) {
    const valid = UI.sel.kind === 'c' ? G.cats.some(c => c.id === UI.sel.id) : UI.sel.kind === 'z' ? !G.zones[UI.sel.id] : !!G.bld[UI.sel.id];
    if (!valid) UI.sel = null;
  }
  if (UI.sel) h = `<div class="insp">${paneInspect()}</div>`;
  else h = UI.tab === 'build' ? paneBuild() : UI.tab === 'orders' ? paneOrders() : UI.tab === 'cats' ? paneCats() : paneStore();
  if (force || h !== UI.lastPane) { const st = pane.scrollTop; pane.innerHTML = h; pane.scrollTop = st; UI.lastPane = h; }
  document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('on', !UI.sel && b.dataset.tab === UI.tab));
  const ob = document.querySelector('#tabs [data-tab="orders"]');
  if (ob) ob.classList.toggle('ping', G.orders.some(canDeliver));
}
function renderHUD() {
  const S = seasonIdx();
  setIco($('seasonIco'), SEASONS[S].sprite, 2);
  $('date').textContent = `${SEASONS[S].name} · den ${dayInSeason()}${yearIdx() > 1 ? ' · rok ' + yearIdx() : ''}`;
  $('clock').textContent = hhmm();
  const wx = $('wxIco'); wx.hidden = G.weather === 'clear'; if (G.weather !== 'clear') setIco(wx, G.weather === 'rain' ? 'rain' : 'snow', 2);
  $('coins').textContent = fmt(G.coins);
  $('wood').textContent = fmt(G.stock.drevo || 0);
  $('store').textContent = `${stockTotal()}/${capacity()}`;
  $('store').parentElement.classList.toggle('warn', stockTotal() >= capacity());
  $('cozy').textContent = coziness();
  $('catsN').textContent = G.cats.length;
  document.querySelectorAll('#speed button').forEach(b => b.classList.toggle('on', +b.dataset.speed === UI.speed));
  const q = $('quest');
  if (G.quest < QUESTS.length) { q.hidden = false; const Q = QUESTS[G.quest]; q.innerHTML = `${animalIcon('jezek', 2)}<div><small>Úkol od Babičky Ježkové · ${G.quest + 1}/${QUESTS.length}</small><b>${Q.t}</b><small>odměna ${Q.coins} mincí${Q.wood ? ' a ' + Q.wood + ' dřeva' : ''}</small></div>`; }
  else q.hidden = true;
}
function renderTip() {
  const tip = $('tip'), h = UI.hover;
  if (!h || !UI.hoverPx) { tip.hidden = true; return; }
  let txt = '';
  const [hx, hy] = h;
  if (UI.tool) {
    const d = B[UI.tool];
    if (d.tool) { const b = bldAt(hx, hy), t = tile(hx, hy); txt = b ? 'Zbourat: ' + B[b.type].n : t && t.tree ? 'Pokácet strom (+1 dřevo)' : t && (t.gr === 'path' || t.gr === 'bridge') ? 'Zrušit cestu' : ''; }
    else { const [ax, ay] = anchorFor(UI.tool, hx, hy); const c = canPlace(UI.tool, ax, ay); txt = c.ok ? d.n : c.why; }
  } else {
    const c = catAt(UI.hoverPx[0], UI.hoverPx[1]);
    if (c) txt = `${c.name} — ${catActivity(c)}`;
    else {
      const b = bldAt(hx, hy), t = tile(hx, hy), z = zoneAt(hx, hy);
      if (!G.zones[z]) txt = `${ZONES[z].n} — zamčeno (${ZONES[z].cost} mincí)`;
      else if (b) { const s = bStatus(b)[0]; txt = B[b.type].n + (s ? ' — ' + s : ''); }
      else if (t && t.tree) txt = t.tree.g >= 1 ? 'Strom' : t.tree.cut ? 'Pařez — dorůstá' : 'Mladý strom ' + Math.floor(t.tree.g * 100) + ' %';
      else if (t && t.gr === 'water') txt = 'Potok';
    }
  }
  if (!txt) { tip.hidden = true; return; }
  tip.hidden = false; tip.textContent = txt;
  const wrap = $('wrap').getBoundingClientRect(), sx = UI.hoverPx[0] / PW * wrap.width, sy = UI.hoverPx[1] / PH * wrap.height;
  tip.style.left = Math.min(wrap.width - tip.offsetWidth - 4, Math.max(4, sx + 14)) + 'px';
  tip.style.top = Math.max(4, sy - 30) + 'px';
}
function catAt(px, py) {
  let best = null, bd = 1e9;
  for (const c of G.cats) { if (c.inside) continue; const dx = px - c.x, dy = py - (c.y - 5); const d = dx * dx + dy * dy; if (Math.abs(dx) <= 8 && dy >= -9 && dy <= 7 && d < bd) { bd = d; best = c; } }
  return best;
}

/* ============ actions ============ */
function uiAction(act, arg) {
  Sound.click();
  switch (act) {
    case 'tab': UI.tab = arg; UI.sel = null; UI.pick = false; break;
    case 'bcat': UI.bcat = arg; break;
    case 'tool': {
      if (UI.tool === arg) { UI.tool = null; break; }
      if (!B[arg].tool && !isUnlockedB(arg)) { toast(B[arg].zone && !G.zones[B[arg].zone] ? 'Nejdřív odemkni ' + ZONES[B[arg].zone].n : 'Odemkne ' + lockText(B[arg].lock)); Sound.nope(); break; }
      UI.tool = arg; UI.sel = null; break;
    }
    case 'close': UI.sel = null; UI.pick = false; UI.confirm = 0; break;
    case 'recipe': { const b = G.bld[UI.sel.id]; if (b) { if (!recipeUnlocked(arg)) { toast('Odemkne ' + lockText(RECIPES[arg].lock)); Sound.nope(); } else setRecipe(b, arg); } break; }
    case 'crop': { const b = G.bld[UI.sel.id]; if (b) { if (!cropUnlocked(arg)) { toast('Odemkne ' + lockText(CROPS[arg].lock)); Sound.nope(); } else setCrop(b, arg); } break; }
    case 'pick': UI.pick = true; break;
    case 'assign': { const b = G.bld[UI.sel.id]; if (b) assignWorker(b, +arg); UI.pick = false; break; }
    case 'unassign': unassign(+arg); break;
    case 'demolish': { const b = G.bld[+arg]; if (!b) break; if (UI.confirm !== b.id) { UI.confirm = b.id; break; } UI.confirm = 0; demolish(b); break; }
    case 'deliver': deliverOrder(+arg); break;
    case 'fest': festDeliver(); break;
    case 'sell': G.sell[arg] = !G.sell[arg]; break;
    case 'buyout': {
      const n = Math.min(5, G.stock[arg] || 0); if (!n) break;
      const pay = Math.max(1, Math.floor(ITEMS[arg].v * 0.5 * n));
      takeStock(arg, n); G.coins += pay; G.stats.earned += pay; Sound.coin(); toast(`Liška odkoupila ${n}× ${ITEMS[arg].n.toLowerCase()} za ${pay} mincí`);
      break;
    }
    case 'selcat': UI.sel = { kind: 'c', id: +arg }; UI.pick = false; break;
    case 'selb': UI.sel = { kind: 'b', id: +arg }; UI.pick = false; break;
    case 'pet': { const c = G.cats.find(x => x.id === +arg); if (c) petCat(c); break; }
    case 'zone': unlockZone(arg); if (G.zones[arg]) UI.sel = null; break;
  }
  UI.dirty = true;
  renderPane(true);
}
UI.select = function (s) { UI.sel = s; UI.pick = false; UI.confirm = 0; UI.dirty = true; };
UI.init = function () {
  $('side').addEventListener('click', e => {
    const el = e.target.closest('[data-act],[data-tab]'); if (!el) return;
    if (el.dataset.tab && !el.dataset.act) uiAction('tab', el.dataset.tab); else uiAction(el.dataset.act, el.dataset.arg);
  });
  document.querySelectorAll('#speed button').forEach(b => b.addEventListener('click', () => { UI.speed = +b.dataset.speed; Sound.click(); renderHUD(); }));
  setIco($('coinIco'), 'coin', 2); setIco($('woodIco'), 'drevo', 2); setIco($('boxIco'), 'box', 2); setIco($('cozyIco'), 'cozy', 2);
  const ci = $('catIco'); ci.src = catSpr(0).headURL; ci.width = 24; ci.height = 17;
  renderHUD(); renderPane(true);
};
UI.frame = function (dt) {
  UI.hudT -= dt; UI.paneT -= dt;
  if (UI.hudT <= 0) { UI.hudT = 0.2; renderHUD(); }
  if (UI.dirty || UI.paneT <= 0) { UI.paneT = 0.4; UI.dirty = false; renderPane(false); }
  renderTip();
};
