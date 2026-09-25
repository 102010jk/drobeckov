'use strict';
/* ============ land parcels (8×8 tiles) ============ */
const pkey = (px, py) => (px + 32768) * 65536 + (py + 32768);
let OWNED = new Set();
function owned(x, y) { return OWNED.has(pkey(x >> 3, y >> 3)); }
const ownedP = (px, py) => OWNED.has(pkey(px, py));
function rebuildOwned() {
  OWNED = new Set(G.owned.map(([px, py]) => pkey(px, py)));
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const [px, py] of G.owned) { x0 = Math.min(x0, px); y0 = Math.min(y0, py); x1 = Math.max(x1, px); y1 = Math.max(y1, py); }
  G.bb = { x0: x0 * PS, y0: y0 * PS, x1: (x1 + 1) * PS - 1, y1: (y1 + 1) * PS - 1 };
  reachDirty = true; pathVersion++;
}
function ownsAnyInChunk(cx, cy) {
  for (let py = cy * 2; py < cy * 2 + 2; py++) for (let px = cx * 2; px < cx * 2 + 2; px++) if (ownedP(px, py)) return true;
  return false;
}
function adjacentOwned(px, py) { return ownedP(px - 1, py) || ownedP(px + 1, py) || ownedP(px, py - 1) || ownedP(px, py + 1); }
function parcelInfo(px, py) {
  const cnt = {}; let water = 0, poi = null;
  for (let y = py * PS; y < py * PS + PS; y++) for (let x = px * PS; x < px * PS + PS; x++) {
    const t = tile(x, y); cnt[t.bio] = (cnt[t.bio] || 0) + 1;
    if (t.gr === 'water' || t.gr === 'deep') water++;
    if (t.poi) poi = t.poi;
  }
  let bio = 'meadow', bn = 0; for (const k in cnt) if (cnt[k] > bn) { bn = cnt[k]; bio = k; }
  return { bio, water, poi, cnt };
}
function parcelPrice(px, py) {
  const inf = parcelInfo(px, py);
  let mult = BIOMES[inf.bio] ? BIOMES[inf.bio].price : 1;
  if (inf.water > 48) mult *= 0.7;
  if (inf.cnt.beach) mult *= 1.1;
  if (inf.poi) mult *= 1.4;
  const extra = Math.max(0, G.owned.length - START_PW * START_PH);
  return Math.round(PARCEL_BASE * Math.pow(1.1, extra) * mult / 5) * 5;
}
function buyParcel(px, py, free) {
  if (ownedP(px, py)) return false;
  if (!adjacentOwned(px, py)) { toast('Kupovat jde jen pozemky sousedící s údolím.'); Sound.nope(); return false; }
  const price = parcelPrice(px, py);
  if (!free) {
    if (G.freeParcels > 0) { G.freeParcels--; free = true; }
    else if (G.coins < price) { toast(`Pozemek stojí ${price} mincí.`); Sound.nope(); return false; }
    else G.coins -= price;
  }
  G.owned.push([px, py]); rebuildOwned();
  G.stats.parcels = (G.stats.parcels || 0) + 1;
  const inf = parcelInfo(px, py);
  if (inf.poi && !G.poiDone[inf.poi.id]) discoverPOI(inf.poi);
  Sound.unlock();
  toast(`Nový pozemek: ${BIOMES[inf.bio] ? BIOMES[inf.bio].n : 'kus údolí'}${free ? ' (zdarma)' : ''}`);
  UI.dirty = true; minimapDirty = true;
  return true;
}
function discoverPOI(p) {
  G.poiDone[p.id] = true;
  const T = POI_TYPES[p.type];
  let reward = '';
  switch (p.type) {
    case 'poklad': { const c = 150 + Math.floor(hashi(p.x, p.y, 5) * 250); G.coins += c; reward = `+${c} mincí`; break; }
    case 'studanka': G.stats.cozyBonus = (G.stats.cozyBonus || 0) + 4; reward = '+4 útulnost'; break;
    case 'mlyn': addStock('drevo', 30); addStock('mouka', 10); reward = '+30 dřeva, +10 mouky'; break;
    case 'hvezdarna': G.flags.hvezdarna = true; G.coins += 100; reward = 'vědci se budou učit rychleji · +100 mincí'; break;
    case 'dul': G.flags.stary_dul = true; G.coins += 120; reward = 'mapa ložisek · +120 mincí'; break;
    case 'majak': G.flags.majak = true; reward = 'přístav tu přiláká víc lodí'; break;
    case 'krater': G.flags.krater = true; G.coins += 200; reward = 'kus meteoritu · +200 mincí'; break;
    case 'vesnice': addStock('chleb', 8); addStock('drevo', 15); G.pendingCats = (G.pendingCats || 0) + 1; reward = 'zásoby a kočka, která tu žila'; break;
  }
  banner(T.n, T.d + (reward ? ' ' + reward : ''));
  G.stats.poi = (G.stats.poi || 0) + 1;
}
/* fog level for rendering: 0 owned, 1 buyable neighbour, 2 known, 3 clouds */
function fogLevel(px, py) {
  if (ownedP(px, py)) return 0;
  if (adjacentOwned(px, py)) return 1;
  for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) if (Math.abs(dx) + Math.abs(dy) <= 4 && ownedP(px + dx, py + dy)) return 2;
  return 3;
}
