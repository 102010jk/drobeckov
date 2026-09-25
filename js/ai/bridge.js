'use strict';
/* ============ AI bridge: lets an MCP server (tools for Codex / Gemini / Claude) play the game live ============
   Active only when the page is served by mcp/server.mjs (port 5191) or opened with ?ai in the URL.
   The page long-polls /bridge/poll for commands and posts results to /bridge/result. */
const AI_ON = location.port === '5191' || /[?&]ai\b/.test(location.search);

const aiBld = b => ({ id: b.id, type: b.type, name: B[b.type].n, x: b.x, y: b.y, w: b.w, h: b.h, built: !!b.built, level: b.lvl || 1,
  status: bStatus(b)[0] || '', workers: G.cats.filter(c => c.job === b.id).map(c => c.id), maxWorkers: B[b.type].workers || 0,
  recipe: b.recipe || undefined, recipes: B[b.type].recipes, crop: B[b.type].field ? b.crop : undefined, input: b.inp, output: b.out });
const aiCat = c => ({ id: c.id, name: c.name, trait: TRAITS[c.trait] ? TRAITS[c.trait].n : c.trait, prof: c.prof || '', job: c.job || 0, home: c.home || 0,
  food: Math.round(c.food), energy: Math.round(c.energy), mood: Math.round(c.mood), doing: typeof catActivity === 'function' ? catActivity(c) : (c.task ? c.task.kind : 'nic'),
  kitten: c.kitten > G.t || undefined, wish: c.cwish && typeof cwText === 'function' ? cwText(c) : undefined, x: Math.floor(c.x / TS), y: Math.floor(c.y / TS) });
function aiCost(d) { const c = { coins: d.cost }; if (d.wood) c.drevo = d.wood; Object.assign(c, d.mat || {}); return c; }
function aiNeed(cond, msg) { if (!cond) throw new Error(msg); }
function aiFocus(x, y) { if (!UI.interior) centerOn(x * TS + 8, y * TS + 8); }
function aiCenter() { const s = BLIST.find(b => B[b.type].store) || BLIST[0]; return s ? [s.x + 1, s.y + 1] : [G.origin[0] * PS + 12, G.origin[1] * PS + 12]; }

const AI_CMDS = {
  state() {
    const S = seasonIdx(), next = ERAS[(G.era || 0) + 1];
    const bcount = {}; for (const b of BLIST) bcount[b.type] = (bcount[b.type] || 0) + 1;
    return {
      town: G.name, mode: G.mode || 'normal', era: { index: eraOf(), name: ERAS[eraOf()].n, nextEra: next ? next.n : null, nextEraNeeds: next ? next.hint : null },
      date: { year: yearIdx(), season: SEASONS[S].name, day: dayInSeason(), daysPerSeason: SDAYS, hour: Math.floor(hour()), weather: G.weather },
      speed: UI.speed, coins: Math.floor(G.coins), stars: G.stars || 0,
      storage: { used: stockTotal(), capacity: capacity(), items: G.stock },
      cats: { count: G.cats.length, avgMood: Math.round(G.cats.reduce((a, c) => a + c.mood, 0) / Math.max(1, G.cats.length)), hungry: G.cats.filter(c => c.food < 25).length, unemployed: G.cats.filter(c => !c.job).length, freeBeds: freeBeds() },
      coziness: coziness(), coziNeededForNextCat: needCozy(G.cats.length),
      buildings: bcount, parcelsOwned: G.owned.length,
      orders: G.orders.map(o => ({ id: o.id, from: orderClient(o).n, items: Object.fromEntries(o.lines), coins: o.coins, canDeliver: canDeliver(o), hoursLeft: Math.round((o.exp - G.t) / DAY * 24) })),
      festival: (() => { const f = FEST[S], st = festState(); return { name: f.n, needs: f.need, delivered: st.got, reward: f.coins, done: !!G.festDone[st.key] }; })(),
      advisor: typeof advProblems === 'function' ? advProblems().map(p => p[1]) : [],
      research: G.research ? TECH[G.research].n : null,
      tutorialStep: typeof tutStep === 'function' && tutStep() ? tutStep().t.replace('{name}', G.name) : null,
      tip: 'Use buildable to see what you can build, find_spot for valid positions, then build.'
    };
  },
  buildable({ category } = {}) {
    return Object.keys(B).filter(t => !B[t].tool && !B[t].fixed && (!category || B[t].cat === category)).map(t => {
      const d = B[t], ok = isUnlockedB(t);
      return { type: t, name: d.n, category: d.cat, size: `${d.w || 1}x${d.h || 1}`, cost: aiCost(d), unlocked: ok, locked: ok ? undefined : lockReason(t), workers: d.workers || 0, recipes: d.recipes, info: d.desc };
    }).filter(x => x.unlocked || x.locked !== 'Už stojí');
  },
  find_spot({ type, near_x, near_y, count = 5 }) {
    aiNeed(B[type], 'Neznámý typ stavby: ' + type);
    const [cx, cy] = near_x != null ? [near_x, near_y] : aiCenter(), out = [];
    let lastWhy = '';
    for (let r = 0; r < 40 && out.length < count; r++) for (let dy = -r; dy <= r && out.length < count; dy++) for (let dx = -r; dx <= r && out.length < count; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
      const res = canPlace(type, cx + dx, cy + dy); if (res.ok) out.push({ x: cx + dx, y: cy + dy }); else if (res.why) lastWhy = res.why;
    }
    return out.length ? { spots: out, note: 'x,y is the top-left tile of the building' } : { spots: [], reason: lastWhy || 'Žádné volné místo — kup další pozemek (parcels / buy_parcel).' };
  },
  build({ type, x, y }) {
    aiNeed(B[type], 'Neznámý typ stavby: ' + type);
    const res = canPlace(type, x, y); aiNeed(res.ok, res.why || 'Tady to postavit nejde');
    const b = place(type, x, y); aiFocus(x, y); Sound.place(); UI.dirty = true;
    return b ? { ok: true, building: aiBld(b), note: b.built ? 'hotovo' : 'staveniště — kočky donesou materiál a postaví to' } : { ok: true, note: 'položeno' };
  },
  demolish({ x, y, building_id }) {
    const b = building_id ? G.bld[building_id] : G.bld[tile(x, y).b];
    if (b) { aiFocus(b.x, b.y); demolish(b); return { ok: true, removed: b.type }; }
    aiNeed(demolishAt(x, y), 'Není tu nic k zbourání'); return { ok: true };
  },
  buildings({ type } = {}) { return BLIST.filter(b => !B[b.type].ground && (!type || b.type === type)).map(aiBld); },
  building({ building_id }) { const b = G.bld[building_id]; aiNeed(b, 'Budova neexistuje'); aiFocus(b.x, b.y); UI.select({ kind: 'b', id: b.id }); renderPane(true); return aiBld(b); },
  cats() { return G.cats.map(aiCat); },
  assign({ cat_id, building_id }) {
    const c = G.cats.find(x => x.id === cat_id), b = G.bld[building_id];
    aiNeed(c, 'Kočka neexistuje'); aiNeed(b && b.built, 'Budova neexistuje nebo není dostavěná'); aiNeed(B[b.type].workers, 'Tahle budova nemá pracovní místa');
    assignWorker(b, c.id); aiFocus(b.x, b.y); return { ok: true, cat: c.name, job: B[b.type].n };
  },
  unassign({ cat_id }) { unassign(cat_id); return { ok: true }; },
  set_recipe({ building_id, recipe }) { const b = G.bld[building_id]; aiNeed(b && B[b.type].recipes && B[b.type].recipes.includes(recipe), 'Tahle budova ten recept nemá'); aiNeed(recipeUnlocked(recipe), 'Recept je zamčený'); setRecipe(b, recipe); return { ok: true }; },
  set_crop({ building_id, crop }) { const b = G.bld[building_id]; aiNeed(b && B[b.type].field, 'To není pole'); aiNeed(CROPS[crop], 'Neznámá plodina'); aiNeed(cropUnlocked(crop), 'Plodina je zamčená'); setCrop(b, crop); return { ok: true, grows_in: CROPS[crop].s.map((v, i) => v ? SEASONS[i].name : null).filter(Boolean) }; },
  deliver_order({ order_id }) { const o = G.orders.find(x => x.id === order_id); aiNeed(o, 'Zakázka neexistuje'); aiNeed(canDeliver(o), 'Ve skladu chybí zboží'); deliverOrder(order_id); return { ok: true, coins: Math.floor(G.coins) }; },
  deliver_festival() { festDeliver(); return { ok: true, festival: AI_CMDS.state().festival }; },
  parcels() {
    const out = [];
    for (const [px, py] of G.owned) for (const [ax, ay] of [[px + 1, py], [px - 1, py], [px, py + 1], [px, py - 1]])
      if (!ownedP(ax, ay) && !out.some(o => o.px === ax && o.py === ay)) { const inf = parcelInfo(ax, ay); out.push({ px: ax, py: ay, tiles: `${ax * PS}..${ax * PS + PS - 1}, ${ay * PS}..${ay * PS + PS - 1}`, price: parcelPrice(ax, ay), biome: BIOMES[inf.bio] ? BIOMES[inf.bio].n : inf.bio, poi: inf.poi ? POI_TYPES[inf.poi.type].n : undefined }); }
    return out.sort((a, b) => a.price - b.price).slice(0, 20);
  },
  buy_parcel({ px, py }) { aiNeed(adjacentOwned(px, py) && !ownedP(px, py), 'Pozemek musí sousedit s tvým'); const ok = buyParcel(px, py); aiNeed(ok !== false && ownedP(px, py), 'Nákup se nepovedl (málo mincí?)'); aiFocus(px * PS + 4, py * PS + 4); return { ok: true, coins: Math.floor(G.coins) }; },
  map({ x, y, w = 24, h = 16 }) {
    if (x == null) { const [cx, cy] = aiCenter(); x = cx - (w >> 1); y = cy - (h >> 1); }
    w = Math.min(48, w); h = Math.min(32, h);
    const rows = [], legend = {};
    for (let j = 0; j < h; j++) {
      let r = '';
      for (let i = 0; i < w; i++) {
        const t = tile(x + i, y + j); let ch;
        if (!owned(x + i, y + j)) ch = ' ';
        else if (t.b && G.bld[t.b]) { const b = G.bld[t.b]; ch = b.built ? (B[b.type].n[0]).toUpperCase() : '?'; legend[ch] = legend[ch] || new Set(); legend[ch].add(B[b.type].n); }
        else if (t.poi) ch = '!';
        else if (t.tree) ch = 'T';
        else ch = { grass: '.', water: '~', deep: '≈', path: '=', road: '#', asfalt: '#', bridge: 'H', sand: ':', rock: '^' }[t.gr] || '.';
        r += ch;
      }
      rows.push(r);
    }
    return { origin: { x, y }, note: 'each char = 1 tile; row 0 is y=' + y + ', col 0 is x=' + x + '. " " = not your land, . grass, T tree, ~ water, = path, # road, : sand, ^ rock, ? construction site, letters = buildings', rows, legend: Object.fromEntries(Object.entries(legend).map(([k, v]) => [k, [...v].join(' / ')])) };
  },
  research({ tech } = {}) {
    if (!tech) return Object.keys(TECH).map(k => ({ tech: k, name: TECH[k].n, done: !!G.tech[k], available: typeof techAvail === 'function' ? techAvail(k) : undefined, cost: TECH[k].cost, info: TECH[k].d }));
    aiNeed(TECH[tech], 'Neznámý výzkum'); ACTIONS.research(tech); return { ok: G.research === tech, researching: G.research };
  },
  upgrade({ building_id }) { const b = G.bld[building_id]; aiNeed(b, 'Budova neexistuje'); const why = upgWhy(b); aiNeed(!why, why); ACTIONS.upgrade(b.id); aiFocus(b.x, b.y); return { ok: true, level: b.lvl }; },
  set_speed({ speed }) { aiNeed([0, 1, 2, 4].includes(speed), 'Rychlost musí být 0, 1, 2 nebo 4'); UI.speed = speed; if (speed) UI.prevSpeed = speed; renderHUD(); return { ok: true }; },
  wait({ seconds = 10 }) {
    seconds = Math.max(1, Math.min(120, seconds)); if (!UI.speed) UI.speed = 1;
    const t0 = G.t;
    return new Promise(res => setTimeout(() => res({ realSeconds: seconds, gameHoursPassed: Math.round((G.t - t0) / DAY * 24 * 10) / 10, state: AI_CMDS.state() }), seconds * 1000));
  },
  claim_rewards() {
    const got = [];
    if (G.wishes) G.wishes.forEach((w, i) => { if (w.done && !w.claimed) { ACTIONS.wish(i); got.push('přání dne'); } });
    if (G.letters) G.letters.forEach((l, i) => { if (!l.done && typeof canLetter === 'function' && canLetter(l)) { ACTIONS.letter(i); got.push('dopis od ' + NEIGH[l.nb].n); } });
    return { claimed: got, wishes: (G.wishes || []).map(w => ({ task: WISH[w.kind].n(w), done: w.done, claimed: w.claimed })), letters: (G.letters || []).filter(l => !l.done).map(l => ({ from: NEIGH[l.nb].n, needs: LETTERS[l.nb][l.i].need })) };
  },
  action({ name, arg }) { aiNeed(ACTIONS[name], 'Neznámá akce: ' + name); ACTIONS[name](arg); UI.dirty = true; renderPane(true); return { ok: true }; },
  focus({ x, y }) { aiFocus(x, y); return { ok: true }; },
  new_game({ name, seed, mode = 'normal' }) { newGame({ name: name || 'AI osada', seed, mode }); if (G.tut) G.tut.skip = true; saveGame(true); startPlaying(); hideMenu(); return { ok: true, state: AI_CMDS.state() }; },
  screenshot() { aiNeed(cvs.width && cvs.height, 'Okno hry je skryté nebo zmenšené — snímek nejde udělat.'); return { png: cvs.toDataURL('image/png').split(',')[1] }; }
};

/* on-screen banner so the viewer sees what the AI does */
let aiLog = [];
function aiShow(txt) {
  let el = $('aiBar');
  if (!el) { el = document.createElement('div'); el.id = 'aiBar'; el.className = 'panel chamfer'; $('view').appendChild(el); }
  aiLog.unshift(txt); aiLog = aiLog.slice(0, 4);
  el.innerHTML = `<b>AI hraje</b>${aiLog.map((t, i) => `<div class="${i ? 'old' : ''}">${t}</div>`).join('')}`;
}
const AI_LABEL = { state: 'dívá se na stav osady', buildable: 'prohlíží stavby', find_spot: 'hledá místo', build: 'staví', demolish: 'bourá', buildings: 'prohlíží budovy', building: 'kouká na budovu', cats: 'prohlíží kočky', assign: 'přiřazuje kočku', unassign: 'uvolňuje kočku', set_recipe: 'mění recept', set_crop: 'mění plodinu', deliver_order: 'doručuje zakázku', deliver_festival: 'odevzdává slavnost', parcels: 'prohlíží pozemky', buy_parcel: 'kupuje pozemek', map: 'čte mapu', research: 'výzkum', upgrade: 'vylepšuje budovu', set_speed: 'mění rychlost', wait: 'čeká', claim_rewards: 'vybírá odměny', action: 'akce', focus: 'posouvá kameru', new_game: 'zakládá novou osadu', screenshot: 'fotí obrazovku' };
function aiDescribe(cmd, a) {
  let s = AI_LABEL[cmd] || cmd;
  if (cmd === 'build' && B[a.type]) s += ': ' + B[a.type].n + ` (${a.x}, ${a.y})`;
  if (cmd === 'assign') { const c = G.cats.find(x => x.id === a.cat_id), b = G.bld[a.building_id]; if (c && b) s += `: ${c.name} → ${B[b.type].n}`; }
  if (cmd === 'wait') s += ` ${a.seconds || 10} s`;
  if (cmd === 'research' && a.tech && TECH[a.tech]) s += ': ' + TECH[a.tech].n;
  return s;
}
const AI_TAB = Math.random().toString(36).slice(2);
async function aiLoop() {
  let hello = true;
  while (true) {
    let msg = null;
    try {
      const r = await fetch('/bridge/poll?tab=' + AI_TAB + (hello ? '&hello=1' : ''), { cache: 'no-store' }); hello = false;
      if (r.status === 409) { aiShow('Ovládání převzalo jiné okno se hrou. Tohle okno může zavřít.'); return; }
      if (r.status === 200) msg = await r.json();
    }
    catch (e) { await new Promise(r => setTimeout(r, 2000)); continue; }
    if (!msg || !msg.id) continue;
    let out;
    try {
      aiNeed(AI_CMDS[msg.cmd], 'Neznámý příkaz: ' + msg.cmd);
      aiNeed(G || msg.cmd === 'new_game', 'Hra ještě neběží');
      if (msg.cmd !== 'state' && msg.cmd !== 'screenshot') aiShow(aiDescribe(msg.cmd, msg.args || {}));
      out = { id: msg.id, ok: true, data: await AI_CMDS[msg.cmd](msg.args || {}) };
    } catch (e) { out = { id: msg.id, ok: false, error: e.message }; aiShow('✗ ' + e.message); }
    try { await fetch('/bridge/result', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(out) }); } catch (e) { /* server gone */ }
  }
}
if (AI_ON) addEventListener('load', () => {
  setTimeout(() => { if (typeof started !== 'undefined' && !started) { try { startPlaying(); } catch (e) { /* menu stays */ } } aiShow('připojeno — čekám na pokyny'); aiLoop(); }, 800);
});
