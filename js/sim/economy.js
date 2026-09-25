'use strict';
/* ============ market stall visitors ============ */
const priceMul = () => 0.85 * (xUnlocked('ceny') ? 1.25 : 1);
function spawnVisitor(stall) {
  const edge = edgeTiles(); if (!edge.length) return;
  const a = access(stall); if (!a) return;
  for (let i = 0; i < 3; i++) {
    const s = pick(edge), path = findPath(s[0], s[1], a[0], a[1]);
    if (!path) continue;
    VIS.push({ sp: pick(['jezek', 'zajic', 'liska', 'medved', 'sova', 'veverka', 'jezevec', 'kachna']), x: s[0] * TS + 8, y: s[1] * TS + 10, path, dest: [stall.x * TS + 16 + rand(-7, 7), (stall.y + 1) * TS + 7], stall: stall.id, st: 'in', t: 0, home: s, face: 1, walkT: 0 });
    return;
  }
}
function moveVis(v, dt) {
  let tx, ty;
  if (v.path.length) { tx = v.path[0].x * TS + 8; ty = v.path[0].y * TS + 10; }
  else if (v.dest) { tx = v.dest[0]; ty = v.dest[1]; } else return true;
  const dx = tx - v.x, dy = ty - v.y, dd = Math.hypot(dx, dy), step = 22 * dt;
  if (dd <= step) { v.x = tx; v.y = ty; if (v.path.length) v.path.shift(); else v.dest = null; }
  else { v.x += dx / dd * step; v.y += dy / dd * step; }
  if (Math.abs(dx) > 0.3) v.face = dx > 0 ? 1 : -1;
  v.walkT += dt;
  return !v.path.length && !v.dest;
}
function updateVisitors(dt) {
  const stalls = BLIST.filter(b => B[b.type].market && b.built);
  const h = hour();
  if (stalls.length && h >= 8 && h < 19) { G.visT -= dt; if (G.visT <= 0) { G.visT = rand(7, 13) / (1 + coziness() / 40); if (VIS.length < 6 + stalls.length) spawnVisitor(pick(stalls)); } }
  for (let i = VIS.length - 1; i >= 0; i--) {
    const v = VIS[i];
    if (v.st === 'in') { if (moveVis(v, dt)) { v.st = 'buy'; v.t = 0; v.face = 1; } }
    else if (v.st === 'buy') {
      const s = G.bld[v.stall];
      const seller = s && G.cats.some(c => c.task && c.task.kind === 'work' && c.task.b === s.id && !c.task.moving);
      v.t += dt;
      if (s && seller && sumObj(s.inp) > 0 && v.t > 0.8) {
        const n = randi(1, 2); let got = 0;
        for (let j = 0; j < n; j++) {
          const keys = Object.keys(s.inp).filter(k => s.inp[k] > 0); if (!keys.length) break;
          const k = pick(keys); s.inp[k]--; if (s.inp[k] <= 0) delete s.inp[k];
          got += Math.max(1, Math.round(ITEMS[k].v * priceMul() * (typeof marketMul === 'function' ? marketMul(k) : 1) * (typeof stallMul === 'function' ? stallMul(s) : 1))); G.stats.sold++; if (typeof marketSold === 'function') marketSold(k, 1);
        }
        G.coins += got; G.stats.earned += got;
        popText('+' + got, v.x, v.y - 14, '#ffd23f'); Sound.coin();
        v.emo = 'heart'; v.emoT = 1.5; leaveVis(v);
      } else if (v.t > 7 || !s) { v.emo = 'sad'; v.emoT = 1.5; leaveVis(v); }
    } else if (v.st === 'out') { if (moveVis(v, dt)) VIS.splice(i, 1); }
    if (v.emoT > 0) v.emoT -= dt;
  }
}
function leaveVis(v) {
  const x = Math.floor(v.x / TS), y = Math.floor(v.y / TS);
  const p = findPath(x, y, v.home[0], v.home[1]);
  v.st = 'out'; v.path = p || []; v.dest = null;
  if (!p) v.dest = [v.home[0] * TS + 8, v.home[1] * TS + 10];
}

/* ============ orders ============ */
function addOrder(nb, lines, extra) {
  const val = lines.reduce((a, [k, q]) => a + ITEMS[k].v * q, 0);
  G.orders.push(Object.assign({ id: G.nid++, nb, lines, coins: Math.round(val * 1.6), xp: 1 + (val >= 60 ? 1 : 0) + (val >= 160 ? 1 : 0), exp: G.t + 2 * DAY }, extra || {}));
}
const ORDER_SOURCES = [];   // later eras push generators: () => boolean (true if created)
function genOrder() {
  if (ORDER_SOURCES.length && Math.random() < 0.45) { for (const f of ORDER_SOURCES.slice().sort(() => Math.random() - 0.5)) if (f()) { UI.dirty = true; return; } }
  const T = tier();
  const nbs = Object.keys(NEIGH).filter(k => !G.orders.some(o => o.nb === k) && Object.keys(NEIGH[k].prefs).some(i => producible(i)));
  if (!nbs.length) return;
  const nb = pick(nbs);
  const prefs = Object.entries(NEIGH[nb].prefs).filter(([k]) => producible(k));
  const nl = 1 + (T >= 2 && Math.random() < 0.5 ? 1 : 0) + (T >= 6 && Math.random() < 0.4 ? 1 : 0);
  const lines = [];
  for (let i = 0; i < nl && prefs.length; i++) {
    const item = weighted(prefs);
    prefs.splice(prefs.findIndex(p => p[0] === item), 1);
    const base = clamp(Math.round(22 / ITEMS[item].v), 1, 8);
    lines.push([item, Math.max(1, Math.round(base * (1 + Math.min(T, 20) * 0.06) * rand(0.7, 1.3)))]);
  }
  addOrder(nb, lines);
  UI.dirty = true;
}
const canDeliver = o => o.lines.every(([k, q]) => (G.stock[k] || 0) >= q);
function orderClient(o) { return NEIGH[o.nb] ? { n: NEIGH[o.nb].n, sp: NEIGH[o.nb].sp } : (typeof CLIENTS !== 'undefined' && CLIENTS[o.nb]) ? CLIENTS[o.nb] : { n: o.nb, sp: 'jezek' }; }
function deliverOrder(id) {
  const o = G.orders.find(x => x.id === id);
  if (!o) return;
  if (!canDeliver(o)) { Sound.nope(); toast('Ve skladu ještě něco chybí.'); return; }
  o.lines.forEach(([k, q]) => takeStock(k, q));
  G.coins += o.coins; G.stats.earned += o.coins; G.stats.orders++;
  if (NEIGH[o.nb]) {
    const before = nbLevel(o.nb);
    G.nb[o.nb] = (G.nb[o.nb] || 0) + o.xp;
    const after = nbLevel(o.nb);
    if (after > before) onHeartUp(o.nb, after);
  } else if (typeof onClientDelivered === 'function') onClientDelivered(o);
  G.orders = G.orders.filter(x => x !== o);
  Sound.deliver();
  toast(`${orderClient(o).n} děkuje! +${o.coins} mincí`);
  G.orderT = Math.min(G.orderT, rand(10, 18));
  UI.dirty = true;
  tutEvent('deliver');
}
function onHeartUp(nb, lv) {
  const un = unlocksOf(nb).filter(u => u.lv === lv).map(u => u.txt);
  banner(`${NEIGH[nb].n} ♥${lv}`, un.length ? 'Odemčeno: ' + un.join(', ') : 'Máte se čím dál radši.');
  Sound.unlock();
}

/* ============ festivals ============ */
const festKey = () => yearIdx() + '-' + seasonIdx();
function festState() { if (G.fest.key !== festKey()) G.fest = { key: festKey(), got: {} }; return G.fest; }
function festDeliver() {
  const f = FEST[seasonIdx()], st = festState();
  if (G.festDone[st.key]) return;
  let any = false;
  for (const k in f.need) { const rem = f.need[k] - (st.got[k] || 0), give = Math.min(rem, G.stock[k] || 0); if (give > 0) { takeStock(k, give); st.got[k] = (st.got[k] || 0) + give; any = true; } }
  if (!any) { toast('Ve skladu není nic, co slavnost potřebuje.'); Sound.nope(); return; }
  if (Object.keys(f.need).every(k => (st.got[k] || 0) >= f.need[k])) completeFest(); else { Sound.coin(); toast('Odevzdáno na slavnost.'); }
  UI.dirty = true;
}
function completeFest() {
  const S = seasonIdx(), f = FEST[S];
  G.festDone[G.fest.key] = true; G.coins += f.coins; G.stats.fests++; G.stats.earned += f.coins;
  let extra = '';
  if (!G.festFirst[S]) {
    G.festFirst[S] = true;
    const [kind, arg] = f.first;
    if (kind === 'parcel') { G.freeParcels += arg; extra = ' · ' + f.firstTxt; }
    else if (kind === 'cat') { arriveCat(arg, 'Zlatíčko'); extra = ' · ' + f.firstTxt; }
    else if (kind === 'flag') { G.flags[arg] = true; extra = ' · ' + f.firstTxt; }
  }
  banner(f.n + '!', `+${f.coins} mincí${extra}`);
  Sound.unlock();
  tutEvent('fest');
}
function arriveCat(skin, name) {
  const edge = edgeTiles(); const s = edge.length ? pick(edge) : [G.bb.x0 + 4, G.bb.y0 + 4];
  const used = G.cats.map(c => c.skin), pool = [0, 1, 2, 3, 4, 6, 7, 8];
  const free = pool.filter(i => !used.includes(i));
  const sk = skin != null ? skin : (free.length ? pick(free) : pick(pool));
  const tr = pick(Object.keys(TRAITS));
  const c = newCat(sk, tr, name, s[0] * TS + 8, s[1] * TS + 10);
  assignHomes();
  banner('Přišla nová kočička!', `${c.name} · ${TRAITS[tr].n}`);
  Sound.meow(); emote(c, 'heart', 3);
  UI.dirty = true;
  return c;
}

/* ============ day cycle ============ */
const MORNING_HOOKS = [];
function onMorning() {
  G.morning = mornIdx();
  const S = seasonIdx();
  if (S !== G.lastSeason) {
    G.lastSeason = S;
    banner(`${SEASONS[S].name}${yearIdx() > 1 ? ', rok ' + yearIdx() : ''}`, S === 3 ? 'Nic neroste — doufám, že máš zásoby.' : 'Slavnost: ' + FEST[S].n);
    Sound.season(); Sound.setSeason(S);
    tutEvent('season', S);
  }
  G.weather = S === 3 ? (Math.random() < 0.5 ? 'snow' : 'clear') : (Math.random() < SEASONS[S].rain ? 'rain' : 'clear');
  const gone = G.orders.filter(o => o.exp < G.t);
  if (gone.length) { G.orders = G.orders.filter(o => o.exp >= G.t); toast(`Zakázka od: ${orderClient(gone[0]).n} vypršela.`); }
  if (G.pendingCats > 0) { G.pendingCats--; arriveCat(); }
  else if (freeBeds() > 0 && coziness() >= needCozy(G.cats.length)) arriveCat();
  for (const f of MORNING_HOOKS) f();
  saveGame();
  UI.dirty = true;
}
