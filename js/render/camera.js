'use strict';
/* ============ camera ============ CAM.x/y = world-pixel centre, CAM.z = device pixels per world pixel */
const cvs = $('game');
const ctx = cvs.getContext('2d');
const CAM = { x: 0, y: 0, z: 2 };
let VW = 320, VH = 200, VX = 0, VY = 0, DPR = 1;
function zoomRange() {
  const view = $('view'), w = view.clientWidth * DPR;
  const zmin = Math.max(1, Math.ceil(w / (110 * TS))), zmax = Math.max(zmin, Math.floor(w / (12 * TS)));
  return [zmin, Math.min(zmax, 10)];
}
function fitCanvas() {
  const view = $('view'); if (!view) return;
  DPR = clamp(window.devicePixelRatio || 1, 1, 4);
  const [zmin, zmax] = zoomRange(); CAM.z = clamp(Math.round(CAM.z), zmin, zmax);
  const cw = view.clientWidth, ch = view.clientHeight;
  const w = Math.ceil(cw * DPR / CAM.z), h = Math.ceil(ch * DPR / CAM.z);
  if (cvs.width !== w || cvs.height !== h) { cvs.width = w; cvs.height = h; ctx.imageSmoothingEnabled = false; }
  cvs.style.width = (w * CAM.z / DPR) + 'px'; cvs.style.height = (h * CAM.z / DPR) + 'px';
  VW = w; VH = h;
}
function resetCamera() {
  CAM.x = (G.origin[0] * PS + START_PW * PS / 2) * TS; CAM.y = (G.origin[1] * PS + START_PH * PS / 2) * TS;
  const view = $('view'); DPR = clamp(window.devicePixelRatio || 1, 1, 4);
  CAM.z = view && view.clientWidth ? Math.max(1, Math.round(view.clientWidth * DPR / (34 * TS))) : 2;
}
function clampCam() {
  const bb = G.bb, m = 20 * TS;
  CAM.x = clamp(CAM.x, bb.x0 * TS - m, (bb.x1 + 1) * TS + m);
  CAM.y = clamp(CAM.y, bb.y0 * TS - m, (bb.y1 + 1) * TS + m);
}
function camView() { VX = Math.round(CAM.x - VW / 2); VY = Math.round(CAM.y - VH / 2); }
function zoomAt(dir, sx, sy) {
  const [zmin, zmax] = zoomRange(), nz = clamp(CAM.z + dir, zmin, zmax);
  if (nz === CAM.z) return;
  // keep the point under the cursor fixed
  const wx = VX + sx * VW, wy = VY + sy * VH;
  CAM.z = nz; fitCanvas();
  CAM.x = wx - (sx - 0.5) * VW; CAM.y = wy - (sy - 0.5) * VH;
  clampCam(); camView();
}
function screenToWorld(clientX, clientY) {
  const r = cvs.getBoundingClientRect();
  const px = VX + (clientX - r.left) / r.width * VW, py = VY + (clientY - r.top) / r.height * VH;
  return [px, py, Math.floor(px / TS), Math.floor(py / TS)];
}
function centerOn(x, y) { CAM.x = x; CAM.y = y; clampCam(); }
