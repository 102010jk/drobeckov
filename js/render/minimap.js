'use strict';
/* ============ minimap ============ */
let minimapDirty = true, mmT = 0, MMB = null;
const [mmBase, mmg] = mk(8, 8);
function mmColor(t) {
  if (t.b) return '#e0608e';
  if (t.poi) return '#ffd23f';
  if (t.gr === 'deep') return '#3a86cc';
  if (t.gr === 'water') return '#5aa8e6';
  if (t.gr === 'bridge' || t.gr === 'path') return '#d8b078';
  if (t.gr === 'road') return '#9a948a';
  if (t.gr === 'sand') return '#ecd9a4';
  if (t.gr === 'rock') return t.ore && ORE_COL[t.ore] ? ORE_COL[t.ore][0] : t.bio === 'mountain' ? '#8a8580' : '#a39d90';
  if (t.tree) return '#2f6a3a';
  return t.bio === 'forest' ? '#3f8a44' : t.bio === 'birch' ? '#8ad06a' : t.bio === 'wetland' ? '#4a9a7a' : '#62b252';
}
function rebuildMinimap() {
  const bb = G.bb, m = 20;
  let x0 = bb.x0 - m, y0 = bb.y0 - m, x1 = bb.x1 + m, y1 = bb.y1 + m;
  const W = Math.min(220, x1 - x0 + 1), H = Math.min(160, y1 - y0 + 1);
  x0 = Math.round((x0 + x1) / 2 - W / 2); y0 = Math.round((y0 + y1) / 2 - H / 2);
  mmBase.width = W; mmBase.height = H;
  const img = mmg.createImageData(W, H), d = img.data;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const gx = x0 + x, gy = y0 + y, f = fogLevel(gx >> 3, gy >> 3);
    let c = hex2rgb(f === 3 ? '#e8dcef' : mmColor(tile(gx, gy)));
    if (f === 1 || f === 2) c = c.map(v => Math.round(v * (f === 1 ? 0.75 : 0.55)));
    const i = (y * W + x) * 4; d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255;
  }
  mmg.putImageData(img, 0, 0);
  MMB = { x0, y0, W, H };
  minimapDirty = false;
}
function drawMinimap(dt) {
  const el = $('minimap'); if (!el || !G) return;
  mmT -= dt;
  if (minimapDirty || !MMB || mmT <= 0) { if (minimapDirty || !MMB) rebuildMinimap(); mmT = 0.25; }
  else return;
  const g = el.getContext('2d');
  if (el.width !== MMB.W || el.height !== MMB.H) { el.width = MMB.W; el.height = MMB.H; }
  g.imageSmoothingEnabled = false;
  g.drawImage(mmBase, 0, 0);
  g.strokeStyle = '#fff4dc'; g.lineWidth = 1;
  g.strokeRect(Math.round(VX / TS - MMB.x0) + 0.5, Math.round(VY / TS - MMB.y0) + 0.5, Math.round(VW / TS), Math.round(VH / TS));
}
function minimapClick(e) {
  if (!MMB) return;
  const el = $('minimap'), r = el.getBoundingClientRect();
  const x = MMB.x0 + (e.clientX - r.left) / r.width * MMB.W, y = MMB.y0 + (e.clientY - r.top) / r.height * MMB.H;
  centerOn(x * TS, y * TS); mmT = 0;
}
function minimapThumb() {
  try { if (!MMB) rebuildMinimap(); const [c, g] = mk(72, 48); g.imageSmoothingEnabled = false; g.drawImage(mmBase, 0, 0, 72, 48); return c.toDataURL('image/png'); } catch (e) { return ''; }
}
