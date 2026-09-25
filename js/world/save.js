'use strict';
/* ============ game state, new game, save slots ============ */
let G = null;
const IDX_KEY = 'drobeckov2_index', SLOT_KEY = id => 'drobeckov2_slot_' + id;
const TOWN_A = ['Drobeč', 'Mňau', 'Tlapk', 'Předou', 'Fousk', 'Klubíč', 'Kočičí ', 'Mlsn', 'Pelíšk', 'Vousk'];
const TOWN_B = ['ov', 'ín', 'ice', 'any', 'ov Dvůr', 'á Lhota', 'ovice', 'eč', ' Údolí', 'ová Ves'];
const randomTownName = () => { const a = pick(TOWN_A), b = pick(TOWN_B); return a.endsWith(' ') ? a + 'Údolí' : a + b; };

function freshState(name, seed) {
  return {
    v: 2, name, seed, created: Date.now(), playTime: 0, slot: null,
    t: 6.4 / 24 * DAY, coins: 250, stock: { drevo: 36, ryby: 12, chleb: 10 }, sell: {},
    mods: {}, owned: [], origin: [0, 0], bld: {}, nid: 1, cats: [], orders: [],
    nb: { jez: 0, zaj: 0, med: 0, sova: 0, lis: 0 }, fest: { key: '', got: {} }, festDone: {}, festFirst: {},
    flags: {}, poiDone: {}, tech: {}, tut: { ch: 0, step: 0, done: {}, skip: false, tips: {} },
    stats: { made: {}, orders: 0, fests: 0, sold: 0, earned: 0, parcels: 0, poi: 0, cozyBonus: 0 },
    weather: 'clear', morning: 0, orderT: 25, visT: 8, lastSeason: 0, growing: [], freeParcels: 0, pendingCats: 0,
    res: {}, incStore: 0, cam: null
  };
}
function newGame(opts) {
  opts = opts || {};
  const seed = opts.seed != null && opts.seed !== '' ? (parseInt(opts.seed, 10) || hashSeed(String(opts.seed))) : Math.floor(Math.random() * 1e9);
  resetWorldCache();
  G = freshState(opts.name || randomTownName(), seed);
  DEFAULT_SELL.forEach(k => { G.sell[k] = true; });
  initGen(seed);
  G.origin = findStart();
  for (let py = 0; py < START_PH; py++) for (let px = 0; px < START_PW; px++) G.owned.push([G.origin[0] + px, G.origin[1] + py]);
  rebuildOwned();
  starter();
  rebuildLists();
  G.morning = mornIdx();
  addOrder('jez', [['chleb', 2]]);
  addOrder('zaj', [['mrkev', 4]]);
  resetCamera();
  UI.sel = null; UI.tool = null; VIS = [];
}
function hashSeed(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) % 1e9; }
function starter() {
  const bx = G.origin[0] * PS + 7, by = G.origin[1] * PS + 5;
  const P = (x, y) => [bx + x - 9, by + y - 4];
  // shape the core meadow: no ponds or rocks under the first houses
  for (let y = by - 1; y <= by + 10; y++) for (let x = bx - 2; x <= bx + 13; x++) {
    const t = tile(x, y); let ch = false;
    if (t.gr !== 'grass') { t.gr = 'grass'; t.ore = null; ch = true; }
    if (t.tree) { t.tree = null; ch = true; }
    if (ch) markMod(x, y);
  }
  const path = (x, y) => { const [a, b] = P(x, y); tile(a, b).gr = 'path'; markMod(a, b); };
  for (let x = 9; x <= 20; x++) path(x, 8);
  for (const [x, y] of [[11, 7], [19, 7], [19, 9], [19, 10], [19, 11], [18, 11]]) path(x, y);
  const mb = (type, x, y) => { const [a, b] = P(x, y); return makeBld(type, a, b, true); };
  mb('nastenka', 13, 7);
  mb('spizirna', 15, 6);
  const house = mb('domek', 10, 5), house2 = mb('domek', 18, 5);
  const f = mb('pole', 17, 9); f.st = 1; f.g = 0.55;
  mb('kvetiny', 9, 6); mb('kvetiny', 12, 5);
  for (const [x, y] of [[10, 11], [13, 12], [8, 12], [22, 10], [21, 4]]) { const [a, b] = P(x, y); const t = tile(a, b); if (!t.b && t.gr === 'grass') { t.tree = { g: 1, v: 0.2 + (x * 7 % 5) / 10, k: 'round' }; markMod(a, b); } }
  const [c1x, c1y] = P(14.5, 8.6), [c2x, c2y] = P(12, 8.6), [c3x, c3y] = P(17, 8.6);
  const a = newCat(0, 'rychla', 'Zrzek', c1x * TS, c1y * TS), b = newCat(1, 'pekar', 'Micka', c2x * TS, c2y * TS), c = newCat(6, 'zahradnik', 'Fousek', c3x * TS, c3y * TS);
  a.home = b.home = house.id; c.home = house2.id;
}
function freeName() {
  const free = CAT_NAMES.filter(n => !G.cats.some(c => c.name === n));
  return free.length ? pick(free) : 'Kočka ' + (G.cats.length + 1);
}
function newCat(skin, trait, name, x, y) {
  const c = { id: G.nid++, name: name || freeName(), skin, trait, prof: '', x, y, home: 0, job: 0, energy: 85, food: 70, mood: 62, petT: -999, playT: -999 };
  resetCatTransient(c);
  G.cats.push(c);
  return c;
}
function resetCatTransient(c) {
  c.task = null; c.path = []; c.carry = c.carry || null; c.face = c.face || 1; c.anim = 'sit'; c.emote = null; c.emoteT = 0;
  c.inside = !!c.inside; c.sleeping = !!c.sleeping; c.think = rand(0.2, 1); c.walkT = 0; c.dest = null;
}

/* ---------- serialize ---------- */
const B_TRANSIENT = ['inc', 'outRes', 'farmer', 'builders', 'working', 'lastWork', 'active', 'alert', 'unreach', 'conL', 'conR', 'papers', '_a'];
const C_TRANSIENT = ['task', 'path', 'dest', 'anim', 'emote', 'emoteT', 'think', 'walkT', 'mt', 'mtgt', 'carry', 'face'];
const G_TRANSIENT = ['bb', 'res', 'incStore'];
function serialize() {
  const o = {};
  for (const k in G) if (!G_TRANSIENT.includes(k)) o[k] = G[k];
  const stock = Object.assign({}, G.stock);
  for (const c of G.cats) if (c.carry) stock[c.carry.item] = (stock[c.carry.item] || 0) + c.carry.n;
  o.stock = stock;
  o.bld = BLIST.map(b => { const r = {}; for (const k in b) if (!B_TRANSIENT.includes(k)) r[k] = b[k]; return r; });
  o.cats = G.cats.map(c => { const r = {}; for (const k in c) if (!C_TRANSIENT.includes(k)) r[k] = c[k]; r.x = Math.round(c.x); r.y = Math.round(c.y); return r; });
  o.cam = { x: Math.round(CAM.x), y: Math.round(CAM.y), z: CAM.z };
  return o;
}
function deserialize(s) {
  if (!s || s.v !== 2 || !Array.isArray(s.owned) || !s.owned.length) return false;
  resetWorldCache();
  const base = freshState(s.name, s.seed);
  G = Object.assign(base, s, { res: {}, incStore: 0 });
  G.stats = Object.assign(base.stats, s.stats || {});
  G.tut = Object.assign(freshState().tut, s.tut || {});
  initGen(G.seed);
  rebuildOwned();
  const list = Array.isArray(s.bld) ? s.bld : Object.values(s.bld || {});
  G.bld = {};
  for (const o of list) {
    if (!B[o.type]) continue;
    const b = Object.assign({ inp: {}, out: {}, workers: [] }, o);
    G.bld[b.id] = b; resetBldTransient(b); bidxAdd(b);
  }
  G.cats = (s.cats || []).map(c => { const o = Object.assign({ prof: '' }, c); o.carry = null; resetCatTransient(o); return o; });
  for (const c of G.cats) { if (c.job && !G.bld[c.job]) c.job = 0; if (c.home && !G.bld[c.home]) c.home = 0; }
  rebuildLists();
  for (const b of BLIST) b.workers = (b.workers || []).filter(id => G.cats.some(c => c.id === id && c.job === b.id));
  if (s.cam) { CAM.x = s.cam.x; CAM.y = s.cam.y; CAM.z = s.cam.z || CAM.z; } else resetCamera();
  UI.sel = null; UI.tool = null; VIS = [];
  reachDirty = true; pathVersion++; jobsDirty = true; minimapDirty = true;
  if (typeof afterLoad === 'function') afterLoad();
  return true;
}

/* ---------- slots ---------- */
function slotIndex() { const i = store.get(IDX_KEY, null); return i && Array.isArray(i.slots) ? i : { slots: [], last: null }; }
function writeIndex(i) { store.set(IDX_KEY, i); }
function slotMeta() {
  return { id: G.slot, name: G.name, savedAt: Date.now(), season: seasonIdx(), day: dayInSeason(), year: yearIdx(), cats: G.cats.length, coins: Math.floor(G.coins), playTime: Math.floor(G.playTime), thumb: minimapThumb() };
}
let lastSaveOK = true;
function saveGame(asNew) {
  if (!G) return false;
  if (!G.slot || asNew) G.slot = 's' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);
  let data;
  try { data = LZ.compress(JSON.stringify(serialize())); } catch (e) { toast('Uložení selhalo: ' + e.message); return false; }
  const ok = store.put(SLOT_KEY(G.slot), data);
  if (!ok) { if (lastSaveOK) toast('Úložiště je plné — smaž starší uložené hry v Menu.'); lastSaveOK = false; return false; }
  lastSaveOK = true;
  const idx = slotIndex(), meta = slotMeta(), i = idx.slots.findIndex(x => x.id === G.slot);
  if (i >= 0) idx.slots[i] = meta; else idx.slots.unshift(meta);
  idx.last = G.slot;
  writeIndex(idx);
  return true;
}
function readSlot(id) {
  const raw = store.raw(SLOT_KEY(id)); if (!raw) return null;
  try { return JSON.parse(LZ.decompress(raw)); } catch (e) { return null; }
}
function loadSlot(id) {
  const s = readSlot(id);
  if (!s || !deserialize(s)) { toast('Tuhle hru se nepodařilo načíst.'); return false; }
  G.slot = id;
  const idx = slotIndex(); idx.last = id; writeIndex(idx);
  return true;
}
function deleteSlot(id) { store.del(SLOT_KEY(id)); const idx = slotIndex(); idx.slots = idx.slots.filter(s => s.id !== id); if (idx.last === id) idx.last = idx.slots[0] ? idx.slots[0].id : null; writeIndex(idx); }
function exportSlot(id) {
  const raw = id === G.slot ? LZ.compress(JSON.stringify(serialize())) : store.raw(SLOT_KEY(id));
  return raw ? 'DK2:' + LZ.toText(raw) : '';
}
function importText(text) {
  text = (text || '').trim();
  if (!text.startsWith('DK2:')) return 'Tohle není kód uložené hry Drobečkova (má začínat „DK2:“).';
  let s;
  try { s = JSON.parse(LZ.decompress(LZ.fromText(text.slice(4)))); } catch (e) { return 'Kód je poškozený nebo neúplný.'; }
  if (!s || s.v !== 2) return 'Kód je z jiné verze hry.';
  if (!deserialize(s)) return 'Uloženou hru se nepodařilo načíst.';
  G.slot = null; saveGame(true);
  return '';
}
