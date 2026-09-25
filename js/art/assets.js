'use strict';
/* ============ 3.7: building pictures from PNG files (assets/budovy/) — a picture wins over the drawing in code ============
   Files: <typ>[.leto|.podzim|.zima][.noc][.v<varianta>].png, listed in assets/manifest.json (tools/sprites.mjs keeps it up to date).
   Pictures of a building type load the first time that type is drawn; until then (or offline without cache) the code draws it. */
const ASSETS = { list: null, asked: new Set() };
if (location.protocol !== 'file:') fetch('assets/manifest.json').then(r => (r.ok ? r.json() : null)).then(m => { if (m) ASSETS.list = m; }).catch(() => {});
function assetImg(type, S, lit, v) {
  const L = ASSETS.list && ASSETS.list[type]; if (!L || SET.noAssets) return null;
  if (!ASSETS.asked.has(type)) {
    ASSETS.asked.add(type);
    for (const e of L) {
      const im = new Image();
      im.onload = () => { e.img = im; if (typeof BICON !== 'undefined') for (const k in BICON) delete BICON[k]; UI.lastPane = ''; UI.dirty = true; };
      im.src = 'assets/budovy/' + e.f;
    }
  }
  // the most specific picture that fits the season, the night lights and the variant
  let best = null, bs = -1;
  for (const e of L) {
    if (!e.img || (e.s && e.s !== S) || (e.n && !lit) || (e.v != null && e.v !== v)) continue;
    const sc = (e.s ? 1 : 0) + (e.n ? 1 : 0) + (e.v != null ? 1 : 0);
    if (sc > bs) { bs = sc; best = e; }
  }
  return best ? best.img : null;
}
/* other pictures (cars, the plane…): assets/<name>.png when listed in the manifest */
ASSETS.spr = {};
function spriteAsset(name) {
  const L = ASSETS.list && ASSETS.list._sprites; if (!L || SET.noAssets) return null;
  let e = ASSETS.spr[name];
  if (!e) { if (!L.includes(name)) return null; e = ASSETS.spr[name] = { img: null }; const im = new Image(); im.onload = () => { e.img = im; }; im.src = 'assets/' + name + '.png'; }
  return e.img;
}
const assetFor = (b, S, night) => assetImg(b.type, S, LIT[b.type] && night ? 1 : 0, String(bVariant(b)));
const _bSpriteA = bSprite;
bSprite = function (b, S, night) { return assetFor(b, S, night) || _bSpriteA(b, S, night); };
const _drawBuildingFullA = drawBuildingFull;
drawBuildingFull = function (g, b, X, Y, t, S, night) {
  const im = assetFor(b, S, night);
  if (!im) return _drawBuildingFullA(g, b, X, Y, t, S, night);
  g.drawImage(im, X - PADX, Y - PADY);
  const a = ANIM[b.type]; if (a) a(g, X, Y, b, t, S, night);
};
