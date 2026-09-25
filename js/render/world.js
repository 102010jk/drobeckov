'use strict';
/* ============ building sprite cache ============ */
const BCACHE = new Map();
const PADX = 16, PADY = 24;
function bSprite(b, S, night) {
  const lit = LIT[b.type] && night ? 1 : 0;
  const key = b.type + '|' + S + '|' + lit + '|' + bVariant(b) + '|' + (b.id % 4 === 0 && b.type === 'domek' ? 0 : '');
  let c = BCACHE.get(key);
  if (!c) {
    let g; [c, g] = mk(b.w * TS + PADX * 2, b.h * TS + PADY + 6);
    const f = DRAW[b.type]; if (f) f(g, PADX, PADY, b, S, !!lit);
    if (BCACHE.size > 900) BCACHE.clear();
    BCACHE.set(key, c);
  }
  return c;
}
function drawBld(g, b, t, S, night) {
  const X = b.x * TS, Y = b.y * TS;
  g.drawImage(bSprite(b, S, night), X - PADX, Y - PADY);
  const a = ANIM[b.type]; if (a) a(g, X, Y, b, t, S, night);
}
function drawSite(g, b, t, S, night) {
  const d = B[b.type], X = b.x * TS, Y = b.y * TS, W = d.w * TS, H = d.h * TS;
  const matLeft = b.need && Object.values(b.need).some(v => v > 0);
  const prog = matLeft ? 0 : 1 - b.work / (b.workTotal || 1);
  R(g, '#a8693e', X + 1, Y + H - 4, 1, 4); R(g, '#a8693e', X + W - 2, Y + H - 4, 1, 4); R(g, '#a8693e', X + 1, Y + 1, 1, 4); R(g, '#a8693e', X + W - 2, Y + 1, 1, 4);
  R(g, 'rgba(255,243,220,0.7)', X + 1, Y + 2, W - 2, 1); R(g, 'rgba(255,243,220,0.7)', X + 1, Y + H - 3, W - 2, 1);
  if (prog > 0) {
    const hh = Math.round(prog * (H + PADY)), spr = bSprite(Object.assign({}, b, { built: true }), S, night);
    const sy = spr.height - 6 - hh; // reveal from the bottom
    g.drawImage(spr, 0, Math.max(0, sy), spr.width, spr.height - Math.max(0, sy), X - PADX, Y - PADY + Math.max(0, sy), spr.width, spr.height - Math.max(0, sy));
    const top = Y + H - hh;
    R(g, OUT, X - 1, top - 1, 3, Y + H - top + 1); R(g, '#d8955a', X, top, 1, Y + H - top);
    R(g, OUT, X + W - 2, top - 1, 3, Y + H - top + 1); R(g, '#d8955a', X + W - 1, top, 1, Y + H - top);
    R(g, OUT, X - 1, top - 1, W + 2, 3); R(g, '#d8955a', X, top, W, 1);
  }
  let pile = 0; if (d.wood) pile = d.wood - ((b.need && b.need.drevo) || 0);
  for (let i = 0; i < Math.min(6, pile); i++) { const lx = X + 3 + (i % 3) * 3, ly = Y + H - 5 - Math.floor(i / 3) * 3; shape(g, [[lx, ly, 3, 2, '#d8955a']]); }
}

/* ============ cats & visitors ============ */
function drawCatSprite(g, c, t) {
  if (c.inside) return;
  const spr = catSpr(c.skin);
  let s, bob = 0;
  if (c.anim === 'walk') s = Math.floor(c.walkT * 8) % 2 ? spr.walk1 : spr.walk0;
  else if (c.anim === 'sleep') s = spr.sleep;
  else if (c.anim === 'work') { s = Math.floor(t * 3 + c.id) % 3 === 0 ? spr.walk0 : spr.sit; bob = Math.floor(t * 6 + c.id) % 2; }
  else s = spr.sit;
  const cx = Math.round(c.x), y = Math.round(c.y - s.h + 1 - bob);
  g.fillStyle = 'rgba(43,27,43,0.22)'; g.fillRect(cx - 4, Math.round(c.y), 9, 1);
  const x = cx - (s.w >> 1);
  if (c.face < 0) { g.save(); g.translate(cx * 2 + 1, 0); g.scale(-1, 1); g.drawImage(s.c, x, y); g.restore(); }
  else g.drawImage(s.c, x, y);
  if (c.carry && SPR[c.carry.item]) {
    const it = SPR[c.carry.item];
    if (c.carry.n > 1) g.drawImage(it.c, cx - (it.w >> 1) - 2, y - it.h + 1);
    g.drawImage(it.c, cx - (it.w >> 1), y - it.h + 3);
  }
  if (c.task && c.task.kind === 'work' && !c.task.moving && G.bld[c.task.b] && G.bld[c.task.b].type === 'molo') {
    const fx = cx + (c.face > 0 ? 5 : -5);
    R(g, '#6b4128', fx, y + 1, 1, 1); R(g, '#6b4128', fx + c.face, y, 1, 1);
    R(g, '#fff3dc', fx + c.face * 2, y + 1, 1, 7); R(g, '#e8484e', fx + c.face * 2, y + 8 + Math.round(Math.sin(t * 3)), 1, 1);
  }
  if (c.anim === 'sleep') LATE.push(['z', cx + 4, y - 7 - Math.round((t * 3 + c.id) % 4), (t * 1.2 + c.id) % 2 < 1 ? 'z' : 'Z']);
  if (UI.sel && UI.sel.kind === 'c' && UI.sel.id === c.id) LATE.push(['arrow', cx, y - 7 - (c.carry ? 9 : 0) + Math.round(Math.sin(t * 5))]);
  else if (c.emote) LATE.push(['bub', cx, y - (c.carry ? 8 : 0), c.emote]);
}
function drawVisitor(g, v, t) {
  const a = (ANIMALS[v.sp] || ANIMALS.jezek).spr, moving = v.st !== 'buy' && v.st !== 'wait';
  const bob = moving ? Math.floor(v.walkT * 8) % 2 : 0;
  const cx = Math.round(v.x), y = Math.round(v.y - a.h + 1 - bob), x = cx - (a.w >> 1);
  g.fillStyle = 'rgba(43,27,43,0.22)'; g.fillRect(cx - 4, Math.round(v.y), 9, 1);
  if (v.face < 0) { g.save(); g.translate(cx * 2 + 1, 0); g.scale(-1, 1); g.drawImage(a.c, x, y); g.restore(); } else g.drawImage(a.c, x, y);
  if (v.emoT > 0 && v.emo) LATE.push(['bub', cx, y, v.emo]);
}

/* ============ main render ============ */
let VIS_BLD = [];
const ENT = [], LATE = [];
const ENT_HOOKS = [];     // later systems add extra entities: (push) => void
const TOPOFF = { mlyn: 17, trziste: 17, pekarna: 4, kuchynka: 3, skrabadlo: 10, lucerna: 8, vanocni: 7, domek: 1, cukrarna: 4, vcelin: 2, jablon: 2 };
function plotConnect(b) { const L = bldAt(b.x - 1, b.y), Rr = bldAt(b.x + 1, b.y); b.conL = !!(L && L.type === 'plot'); b.conR = !!(Rr && Rr.type === 'plot'); }
function anchorFor(type, hx, hy) { const d = B[type], w = d.w || 1, h = d.h || 1; return [hx - Math.floor((w - 1) / 2), hy - (h - 1)]; }
function render(dt) {
  const t = performance.now() / 1000, S = seasonIdx(), dk = darkness(), night = dk > 0.2;
  fitCanvas(); clampCam(); camView();
  const g = ctx;
  g.setTransform(1, 0, 0, 1, -VX, -VY);
  drawTerrain(g, dt);
  // animated water glints
  const tx0 = Math.floor(VX / TS), ty0 = Math.floor(VY / TS), tx1 = Math.floor((VX + VW) / TS), ty1 = Math.floor((VY + VH) / TS);
  // visible buildings
  VIS_BLD = [];
  const seen = new Set();
  for (let cy = ty0 >> 4; cy <= ty1 >> 4; cy++) for (let cx = tx0 >> 4; cx <= tx1 >> 4; cx++) {
    const ids = BIDX.get(ckey(cx, cy)); if (!ids) continue;
    for (const id of ids) if (!seen.has(id)) { seen.add(id); const b = G.bld[id]; if (b && b.x * TS < VX + VW + 32 && (b.x + b.w) * TS > VX - 32 && b.y * TS < VY + VH + 40 && (b.y + b.h) * TS > VY - 8) VIS_BLD.push(b); }
  }
  ENT.length = 0; LATE.length = 0;
  for (let y = ty0 - 1; y <= ty1 + 2; y++) for (let x = tx0 - 1; x <= tx1 + 1; x++) {
    const tt = tile(x, y);
    if (tt.gr === 'water' && S !== 3 && tt.bio !== 'sea' || (tt.gr === 'water' && tt.bio === 'sea')) {
      const ph = (t * 5 + x * 7 + y * 13) % 16;
      R(g, '#a8d4f8', x * TS + ((ph + y * 5) | 0) % 12 + 2, y * TS + ((x * 7 + y * 3) % 12) + 2, 2, 1);
    }
    if (tt.tree) ENT.push([(y + 1) * TS - 2, 1, x, y]);
    if (tt.poi) ENT.push([(y + 1) * TS - 1, 4, tt.poi, 0]);
  }
  for (const b of VIS_BLD) {
    const d = B[b.type];
    if ((d.field && !d.glass) || d.water || d.flat) { if (b.built) drawBld(g, b, t, S, night); else drawSite(g, b, t, S, night); continue; }
    if (b.type === 'plot') plotConnect(b);
    ENT.push([(b.y + b.h) * TS - 1, 0, b, 0]);
  }
  for (const c of G.cats) if (!c.inside && c.x > VX - 16 && c.x < VX + VW + 16 && c.y > VY - 8 && c.y < VY + VH + 24) ENT.push([c.y + (c.task && c.task.kind === 'rest' && G.bld[c.task.b] && B[G.bld[c.task.b].type].play ? 16 : 0), 2, c, 0]);
  for (const v of VIS) ENT.push([v.y, 3, v, 0]);
  for (const f of ENT_HOOKS) f(ENT, t);
  ENT.sort((a, b) => a[0] - b[0]);
  for (const e of ENT) {
    switch (e[1]) {
      case 0: { const b = e[2], d = B[b.type]; if (b.built && !d.nodoor && b.w > 1) { g.fillStyle = 'rgba(43,27,43,0.16)'; g.fillRect(b.x * TS + 3, (b.y + b.h) * TS - 1, b.w * TS - 5, 2); }
        if (b.built) drawBld(g, b, t, S, night); else drawSite(g, b, t, S, night);
        if (b.type === 'domek' && G.cats.some(c => c.inside && c.home === b.id)) LATE.push(['z', b.x * TS + 24, b.y * TS + 12 - Math.round((t * 3) % 4), (t % 2) < 1 ? 'z' : 'Z']);
        break; }
      case 1: { const tr = tile(e[2], e[3]).tree; if (tr) g.drawImage(treeSprite(tr, S), e[2] * TS - 2, e[3] * TS - 10); break; }
      case 2: drawCatSprite(g, e[2], t); break;
      case 3: drawVisitor(g, e[2], t); break;
      case 4: drawPOI(g, e[2], e[2].x * TS, e[2].y * TS, S, t); if (!G.poiDone[e[2].id] && fogLevel(e[2].x >> 3, e[2].y >> 3) <= 1) LATE.push(['bub', e[2].x * TS + 8, e[2].y * TS - 2, 'star']); break;
      default: if (e[4]) e[4](g, t, S, night);
    }
  }
  drawFog(g, t);
  drawFX(g);
  drawAmb(g);
  drawLighting(g);
  g.setTransform(1, 0, 0, 1, -VX, -VY);
  for (const b of VIS_BLD) {
    if (!b.alert) continue;
    drawBubble(g, b.x * TS + b.w * 8, b.y * TS - (TOPOFF[b.type] || B[b.type].top || 0) + Math.round(Math.sin(t * 3 + b.id) * 1.2), b.alert);
  }
  for (const l of LATE) {
    if (l[0] === 'z') drawNum(g, l[3], l[1], l[2], '#fff4dc');
    else if (l[0] === 'bub') drawBubble(g, l[1], l[2], l[3]);
    else if (l[0] === 'arrow') { const cx = l[1], by = l[2]; R(g, OUT, cx - 3, by - 1, 7, 4); R(g, OUT, cx - 1, by + 3, 3, 2); R(g, '#ffd23f', cx - 2, by, 5, 2); R(g, '#ffd23f', cx, by + 2, 1, 2); }
  }
  for (const p of POPS) { g.globalAlpha = Math.min(1, p.life / p.max * 2); drawNum(g, p.txt, Math.round(p.x - numW(p.txt) / 2), Math.round(p.y), p.col); g.globalAlpha = 1; }
  drawOverlay(g, t, S);
  if (typeof drawTutorialWorld === 'function') drawTutorialWorld(g, t);
  g.setTransform(1, 0, 0, 1, 0, 0);
}
function bracket(g, X, Y, W, H, col, t) {
  const o = Math.round((Math.sin(t * 5) + 1) * 0.8);
  const x0 = X - 2 - o, y0 = Y - 2 - o, x1 = X + W + 1 + o, y1 = Y + H + 1 + o;
  for (const [x, y, a, b] of [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]]) {
    R(g, OUT, Math.min(x, x + a * 4) - 1, y - 1, 6, 3); R(g, OUT, x - 1, Math.min(y, y + b * 4) - 1, 3, 6);
    R(g, col, Math.min(x, x + a * 3), y, 4, 1); R(g, col, x, Math.min(y, y + b * 3), 1, 4);
  }
}
function radiusBox(g, x, y, w, h, r, col) {
  const X = (x - r) * TS, Y = (y - r) * TS, W = (w + 2 * r) * TS, H = (h + 2 * r) * TS;
  g.fillStyle = col;
  for (let i = 0; i < W; i += 4) { g.fillRect(X + i, Y, 2, 1); g.fillRect(X + i, Y + H - 1, 2, 1); }
  for (let i = 0; i < H; i += 4) { g.fillRect(X, Y + i, 1, 2); g.fillRect(X + W - 1, Y + i, 1, 2); }
}
function drawOverlay(g, t, S) {
  const sel = UI.sel;
  if (sel && sel.kind === 'b' && G.bld[sel.id]) {
    const b = G.bld[sel.id], d = B[b.type];
    bracket(g, b.x * TS, b.y * TS, b.w * TS, b.h * TS, '#ffd23f', t);
    if (d.chop) radiusBox(g, b.x, b.y, b.w, b.h, d.chop, '#ffd23f');
    if (d.bees) radiusBox(g, b.x, b.y, 1, 1, 3, '#ff9ec0');
    if (d.noise) radiusBox(g, b.x, b.y, b.w, b.h, d.noise, '#ff6f9c');
  }
  if (sel && sel.kind === 'p') { const P = PS * TS; bracket(g, sel.px * P, sel.py * P, P, P, '#ffd23f', t); }
  if (UI.landMode) drawLandOverlay(g, t);
  const h = UI.hover; if (!h) return;
  const [hx, hy] = h;
  if (UI.landMode) return;
  if (!UI.tool) {
    const b = bldAt(hx, hy);
    if (b && !(sel && sel.kind === 'b' && sel.id === b.id)) { g.globalAlpha = 0.6; bracket(g, b.x * TS, b.y * TS, b.w * TS, b.h * TS, '#fff4dc', 0); g.globalAlpha = 1; }
    return;
  }
  const d = B[UI.tool];
  if (d.tool) { bracket(g, hx * TS, hy * TS, TS, TS, '#ff6f9c', t); return; }
  const [ax, ay] = anchorFor(UI.tool, hx, hy), w = d.w || 1, hh = d.h || 1;
  const chk = UI.ghostChk && UI.ghostChk.key === UI.tool + ax + ',' + ay + ',' + pathVersion ? UI.ghostChk.r : (UI.ghostChk = { key: UI.tool + ax + ',' + ay + ',' + pathVersion, r: canPlace(UI.tool, ax, ay) }).r;
  g.globalAlpha = 0.45; g.fillStyle = chk.ok ? '#7bd6b0' : '#ff6f9c';
  for (let j = 0; j < hh; j++) for (let i = 0; i < w; i++) g.fillRect((ax + i) * TS, (ay + j) * TS, TS, TS);
  g.globalAlpha = 0.8;
  const X = ax * TS, Y = ay * TS;
  if (d.ground === 'path') R(g, '#d8b078', X + 2, Y + 2, 12, 12);
  else if (d.ground === 'road') R(g, '#b8b0a4', X + 1, Y + 1, 14, 14);
  else if (d.ground === 'bridge') drawBridge(g, X, Y, S);
  else if (d.tree) drawTree(g, X + 8, Y + 15, { g: 0.5, v: 0.4 }, S, t);
  else drawBuildingFull(g, { type: UI.tool, id: 0, w, h: hh, st: 2, crop: 'psenice', g: 1, inp: {}, out: {}, workers: [], mature: true }, X, Y, t, S, false);
  g.globalAlpha = 1;
  if (!d.ground && !d.nodoor && !d.tree) { const dp = doorPos(UI.tool, ax, ay); if (dp) { const dx = dp[0] * TS + 8, dy = dp[1] * TS + 5; R(g, OUT, dx - 3, dy - 1, 7, 5); R(g, '#ffd23f', dx - 2, dy, 5, 1); R(g, '#ffd23f', dx - 1, dy + 1, 3, 1); R(g, '#ffd23f', dx, dy + 2, 1, 1); } }
  if (d.chop) radiusBox(g, ax, ay, w, hh, d.chop, '#fff4dc');
  if (d.bees) radiusBox(g, ax, ay, 1, 1, 3, '#ff9ec0');
  if (d.noise) radiusBox(g, ax, ay, w, hh, d.noise, '#ff6f9c');
}
function drawLandOverlay(g, t) {
  const P = PS * TS;
  const p0x = Math.floor(VX / P), p0y = Math.floor(VY / P), p1x = Math.floor((VX + VW) / P), p1y = Math.floor((VY + VH) / P);
  for (let py = p0y; py <= p1y; py++) for (let px = p0x; px <= p1x; px++) {
    const X = px * P, Y = py * P;
    if (ownedP(px, py)) { g.globalAlpha = 0.25; R(g, '#fff4dc', X, Y, P, 1); R(g, '#fff4dc', X, Y, 1, P); g.globalAlpha = 1; continue; }
    if (!adjacentOwned(px, py)) continue;
    const hov = UI.hover && (UI.hover[0] >> 3) === px && (UI.hover[1] >> 3) === py;
    g.globalAlpha = hov ? 0.35 : 0.18; R(g, '#ffd23f', X, Y, P, P); g.globalAlpha = 1;
    R(g, '#ffd23f', X, Y, P, 1); R(g, '#ffd23f', X, Y, 1, P); R(g, '#ffd23f', X + P - 1, Y, 1, P); R(g, '#ffd23f', X, Y + P - 1, P, 1);
    const price = G.freeParcels > 0 ? 0 : parcelPriceCached(px, py), s = price ? shortNum(price) : '0';
    g.drawImage(SPR.coin.c, X + P / 2 - (numW(s) + 10) / 2, Y + P / 2 - 4);
    drawNum(g, s, X + P / 2 - (numW(s) + 10) / 2 + 10, Y + P / 2 - 2, '#ffd23f');
  }
}
const PRICE_CACHE = new Map();
function parcelPriceCached(px, py) {
  const k = pkey(px, py) + ':' + G.owned.length;
  let v = PRICE_CACHE.get(k);
  if (v == null) { v = parcelPrice(px, py); if (PRICE_CACHE.size > 500) PRICE_CACHE.clear(); PRICE_CACHE.set(k, v); }
  return v;
}
