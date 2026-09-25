'use strict';
/* ============ walking, path finding, reachability (bounded to owned land) ============ */
let reachDirty = true, pathVersion = 0, REACH = null, REACH_BB = null;
const PATH_CACHE = new Map();
function walkable(x, y) {
  if (!owned(x, y)) return false;
  const t = tile(x, y);
  return t.gr !== 'water' && t.gr !== 'deep' && !t.tree && !t.b && !t.poi;
}
function walkCost(t) { return t.gr === 'road' ? 0.7 : t.gr === 'path' || t.gr === 'bridge' ? 1 : 2; }
/* scratch buffers sized to the owned bounding box (+margin) */
let PFW = 0, PFH = 0, PFX = 0, PFY = 0, PFG = null, PFC = null, PFK = null;
function pfEnsure() {
  const bb = G.bb, w = bb.x1 - bb.x0 + 3, h = bb.y1 - bb.y0 + 3;
  if (w !== PFW || h !== PFH || PFX !== bb.x0 - 1 || PFY !== bb.y0 - 1) {
    PFW = w; PFH = h; PFX = bb.x0 - 1; PFY = bb.y0 - 1;
    PFG = new Float32Array(w * h); PFC = new Int32Array(w * h); PFK = new Uint8Array(w * h);
  }
}
function findPath(sx, sy, tx, ty) {
  if (sx === tx && sy === ty) return [];
  if (!walkable(tx, ty)) return null;
  const key = sx + ',' + sy + '>' + tx + ',' + ty;
  const hit = PATH_CACHE.get(key);
  if (hit && hit.v === pathVersion) return hit.p.slice();
  pfEnsure();
  const W = PFW, H = PFH, lx = x => x - PFX, ly = y => y - PFY;
  if (lx(sx) < 0 || ly(sy) < 0 || lx(sx) >= W || ly(sy) >= H) return null;
  PFG.fill(1e9); PFC.fill(-1); PFK.fill(0);
  const start = ly(sy) * W + lx(sx), goal = ly(ty) * W + lx(tx);
  const heap = [];
  const push = (f, i) => { heap.push([f, i]); let k = heap.length - 1; while (k > 0) { const p = (k - 1) >> 1; if (heap[p][0] <= heap[k][0]) break; [heap[p], heap[k]] = [heap[k], heap[p]]; k = p; } };
  const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let k = 0; for (;;) { const l = k * 2 + 1, r = l + 1; let m = k; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === k) break; [heap[m], heap[k]] = [heap[k], heap[m]]; k = m; } } return top; };
  PFG[start] = 0; push(0, start);
  let found = false;
  while (heap.length) {
    const [, i] = pop();
    if (i === goal) { found = true; break; }
    if (PFK[i]) continue;
    PFK[i] = 1;
    const x = i % W, y = (i / W) | 0;
    for (let d = 0; d < 4; d++) {
      const nx = x + (d === 0 ? 1 : d === 1 ? -1 : 0), ny = y + (d === 2 ? 1 : d === 3 ? -1 : 0);
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      const gx = nx + PFX, gy = ny + PFY;
      if (!walkable(gx, gy)) continue;
      const n = ny * W + nx, ng = PFG[i] + walkCost(tile(gx, gy));
      if (ng < PFG[n]) { PFG[n] = ng; PFC[n] = i; push(ng + (Math.abs(gx - tx) + Math.abs(gy - ty)) * 0.7, n); }
    }
  }
  if (!found && PFC[goal] < 0) return null;
  const path = []; let c = goal;
  while (c !== start && c >= 0) { path.push({ x: (c % W) + PFX, y: ((c / W) | 0) + PFY }); c = PFC[c]; }
  path.reverse();
  if (PATH_CACHE.size > 600) PATH_CACHE.clear();
  PATH_CACHE.set(key, { v: pathVersion, p: path.slice() });
  return path;
}
/* flood fill from the notice board: which tiles can cats reach? */
function flood(block) {
  pfEnsure();
  const W = PFW, H = PFH, out = new Uint8Array(W * H);
  const home = homeBoard(); if (!home) return out.fill(1);
  const s = (home.dy - PFY) * W + (home.dx - PFX);
  if (s < 0 || s >= out.length) return out;
  const q = [s]; out[s] = 1;
  while (q.length) {
    const i = q.pop(), x = i % W, y = (i / W) | 0;
    for (let d = 0; d < 4; d++) {
      const nx = x + (d === 0 ? 1 : d === 1 ? -1 : 0), ny = y + (d === 2 ? 1 : d === 3 ? -1 : 0);
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      const n = ny * W + nx;
      if (out[n] || (block && block.has(n)) || !walkable(nx + PFX, ny + PFY)) continue;
      out[n] = 1; q.push(n);
    }
  }
  return out;
}
function getReach() { if (reachDirty || !REACH) { REACH = flood(null); REACH_BB = [PFX, PFY, PFW]; reachDirty = false; pathVersion++; } return REACH; }
function reachAt(x, y) { const R = getReach(), i = (y - REACH_BB[1]) * REACH_BB[2] + (x - REACH_BB[0]); return i >= 0 && i < R.length && x - REACH_BB[0] >= 0 && x - REACH_BB[0] < REACH_BB[2] ? R[i] : 0; }
/* would blocking this footprint cut off any door that is reachable now? */
function keepsAccess(fx, fy, fw, fh, newDoor) {
  const now = getReach();
  pfEnsure();
  const block = new Set(), W = PFW;
  for (let j = 0; j < fh; j++) for (let i = 0; i < fw; i++) block.add((fy + j - PFY) * W + (fx + i - PFX));
  const after = flood(block);
  const at = (arr, x, y) => { const i = (y - PFY) * W + (x - PFX); return i >= 0 && i < arr.length ? arr[i] : 0; };
  if (newDoor && !at(after, newDoor[0], newDoor[1])) return 'Sem se kočky nedostanou — uvolni cestu';
  for (const id in G.bld) {
    const b = G.bld[id]; if (b.dx == null) continue;
    if (at(now, b.dx, b.dy) && !at(after, b.dx, b.dy)) return 'Zablokovalo by to dveře: ' + B[b.type].n;
  }
  return '';
}
function randomSpot(cx, cy, r) {
  for (let i = 0; i < 14; i++) { const x = cx + randi(-r, r), y = cy + randi(-r, r); if (walkable(x, y) && reachAt(x, y)) return [x, y]; }
  return null;
}
/* walkable tiles on the edge of owned land (where visitors arrive) */
let EDGE = null, EDGE_V = -1;
function edgeTiles() {
  if (EDGE && EDGE_V === pathVersion) return EDGE;
  const out = [], bb = G.bb;
  for (let y = bb.y0; y <= bb.y1; y++) for (let x = bb.x0; x <= bb.x1; x++) {
    if (!walkable(x, y) || !reachAt(x, y)) continue;
    if (!owned(x + 1, y) || !owned(x - 1, y) || !owned(x, y + 1) || !owned(x, y - 1)) out.push([x, y]);
  }
  EDGE = out; EDGE_V = pathVersion;
  return out;
}
