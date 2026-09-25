'use strict';
/* ============ item & icon sprites ============ */
const ROWS = {
  jablka: ['...Bgg..', '...B.g..', '.rrrrrr.', 'rhhrrrrr', 'rhrrrrrr', 'rrrrrrRr', '.rrrrRr.', '..rRRr..'],
  dyne: ['.....Gg...', '....G.....', '.nNnnnnNn.', 'nyNnnnnNnn', 'nyNnnnnNnn', 'nnNnnnnNnn', 'nnNnnnnNnN', '.nNnnnnNN.', '..NNNNNN..'],
  mrkev: ['..g.g...', '...gg...', '..nnnn..', '..nynn..', '..nynN..', '...nnN..', '...nN...', '...nN...', '....N...'],
  jahody: ['..gGg..', '.grrrg.', 'rryrrrr', 'rrrryrr', 'ryrrrrR', '.rrryR.', '..rrR..', '...R...'],
  mleko: ['..uu..', '..ww..', '.wwww.', 'wwwwww', 'wuuuuw', 'wupuuw', 'wuuuuw', 'wwwwwW', '.wwwW.'],
  pernik: ['...jjj...', '..jjjjj..', '..jwjwj..', '...jjj...', 'wjjjjjjjw', '.jjjwjjj.', '...jwj...', '..jjjjj..', '.jjj.jjj.', '.ww...ww.'],
  ryby: ['...UUUU....', '.UUwUUUU.UU', 'UUdUUUUUUU.', 'UUUUUuUUUU.', '.UUUuUUU.UU', '...uuuu....'],
  psenice: ['.y.y.y..', 'yYyYyYy.', '.yYyYy..', '..yYy...', '..BbB...', '..yYy...', '.yY.Yy..', 'yY...Yy.'],
  mouka: ['..B..B..', '...BB...', '..cccc..', '.cccccc.', 'cchccccC', 'ccYcYccC', 'cccYcccC', '.CCCCCC.'],
  chleb: ['..aaaa..', '.ahaaaa.', 'aaAaAaAa', 'aaaaaaaA', 'aaaaaaAA', '.AAAAAA.'],
  drevo: ['.tttbbbbb.', 'tcAcbbbbbB', 'tAcAbbbbbB', '.tttBBBBB.', '.tttbbbbb.', 'tcAcbbbbbB', 'tAcAbbbbbB', '.tttBBBBB.'],
  med: ['.bbbbbb.', '.BBBBBB.', '..yyyy..', '.yhyyyY.', 'yyyyyyyY', 'yyYyyyYY', '.yYYYYY.', '..YYYY..'],
  dzem: ['.rwrwr.', 'rwrwrwr', '..www..', '.wRRRw.', '.wRhRw.', '.wRRRw.', '.wRRRw.', '..www..'],
  most: ['..B..', '..w..', '.wYw.', 'wyyyw', 'wyhyw', 'wyyyw', 'wyyyw', '.www.'],
  susenky: ['.aaaa...a', 'aahaaa.aa', 'adaaaaaaa', 'aaaaaa.aa', '.AAAA...A'],
  polevka: ['..w..w..', '...w..w.', '.nnnnnn.', 'nyynnnnn', 'uuuuuuuu', 'uwuuuuuU', '.uuuuuU.', '..UUUU..'],
  dynovy_kolac: ['..aaaa..', '.anyyna.', 'annnnnna', 'aaaaaaaa', 'AaAaAaAA', '.AAAAAA.'],
  strudl: ['..w.w.w.', '.aaaaaa.', 'awaawaaa', 'aaaaaaaA', 'AaAaAaAA', '.AAAAAA.'],
  jahodovy_dort: ['...r....', '..rhr...', '.wwwwww.', 'wpwwpwwW', 'cccccccC', 'rrrrrrrR', 'cccccccC', '.CCCCCC.'],
  mrkvovy_dort: ['..g.....', '..nN....', '.wwwwww.', 'wwwwwwwW', 'aaaaaaaA', 'wwwwwwwW', 'aaaaaaaA', '.AAAAAA.'],
  coin: ['.yyyy.', 'yhyyyY', 'yhYYyY', 'yyYyyY', 'yyYYyY', '.YYYY.'],
  heart: ['.rr.rr.', 'rhrrrrr', 'rrrrrrr', '.rrrrr.', '..rrr..', '...r...'],
  heartE: ['.KK.KK.', 'KkKKKKK', 'KKKKKKK', '.KKKKK.', '..KKK..', '...K...'],
  cozy: ['...PP...', '..PPPP..', '.PPPPPP.', 'PPPPPPPP', '.cccccc.', '.cpcpcc.', '.cpppcc.', '.ccpbbc.', '.cccbbc.'],
  lock: ['.kkk.', 'k...k', 'k...k', 'yyyyy', 'yyByy', 'yyByy', 'yyyyy'],
  tulip: ['.p.p.p.', '.ppppp.', '.phppp.', '.ppppP.', '..pPP..', '...g...', '.g.g.g.', '..ggg..', '...g...'],
  sun: ['...y...', '.y.y.y.', '..yyy..', 'yyyhyyy', '..yyy..', '.y.y.y.', '...y...'],
  acorn: ['...B...', '.bbbbb.', 'bBbBbBb', 'bbbbbbb', '.ahaaa.', '.aaaaA.', '..aaA..', '...A...'],
  snow: ['...w...', '.w.w.w.', '..www..', 'wwwWwww', '..www..', '.w.w.w.', '...w...'],
  box: ['bbbbbbb', 'bBBBBBb', 'btttttb', 'btBBBtb', 'btttttb', 'bbbbbbb'],
  hammer: ['.KKK..', 'KkkK..', '.KKbb.', '...bb.', '....bb', '.....b'],
  rain: ['.kkkk.', 'kkkkkk', 'KKKKKK', '.u.u..', 'u.u.u.']
};
const SPR = {};
for (const k in ROWS) SPR[k] = buildSprite(ROWS[k], PAL, OUT);

const ICON_URL = {};
function iconURL(k) {
  if (ICON_URL[k]) return ICON_URL[k];
  const s = SPR[k]; if (!s) return '';
  return (ICON_URL[k] = s.c.toDataURL());
}
function icon(k, sc, cls) {
  const s = SPR[k]; if (!s) return '';
  sc = sc || 2;
  return `<img class="ico ${cls || ''}" src="${iconURL(k)}" width="${s.w * sc}" height="${s.h * sc}" alt="">`;
}

/* ============ cats ============ */
const CAT_ROWS = {
  walk0: ['........f...f', '........fffff', '.f......fefef', 'f.......ffnff', 'f..ffffffllf.', '.fffsffsffff.', '..fllllllff..', '..f.f...f.f..'],
  walk1: ['........f...f', '........fffff', '.f......fefef', 'f.......ffnff', 'f..ffffffllf.', '.fffsffsffff.', '..fllllllff..', '...f.f...f.f.'],
  sit: ['.....f...f.', '.....fffff.', '.....fefef.', '.....ffnff.', '....ffllf..', 'f..fffllff.', 'f.fsffllff.', '.fffffllff.', '..ff.ff.ff.'],
  sleep: ['...f.f.....', '..fffffff..', '.ffeeffsff.', 'fffffffffff', 'fllllfffsff', '.fffffffff.']
};
const CAT_HEAD = [
  '..oo........oo..', '.ofpo......opfo.', '.ofpfoooooofpfo.', '.offffsffsffffo.', 'offffffssffffffo', 'offffffffffffffo',
  'offffffffffffffo', 'ofpffllnnllffpfo', 'offfllllllllfffo', '.offllllllllffo.', '..oooooooooooo..'
];
const CAT_CACHE = {};
function catSpr(si) {
  if (CAT_CACHE[si]) return CAT_CACHE[si];
  const sk = SKINS[si];
  const pal = { f: sk.f, s: sk.s, l: sk.l, p: sk.p, n: sk.n, e: sk.eye[3] };
  const o = {};
  for (const k in CAT_ROWS) o[k] = buildSprite(CAT_ROWS[k], pal, sk.o);
  // portrait head with face
  const head = buildSprite(CAT_HEAD, { o: sk.o, f: sk.f, s: sk.s, l: sk.l, p: sk.p, n: sk.n }, null);
  const hg = head.c.getContext('2d');
  for (const ex of [3, 11]) { R(hg, sk.eye[0], ex, 5, 1, 1); R(hg, sk.eye[1], ex + 1, 5, 1, 1); R(hg, sk.eye[2], ex, 6, 1, 1); R(hg, sk.eye[3], ex + 1, 6, 1, 1); }
  hg.fillStyle = sk.o; [[6, 8], [7, 9], [8, 9], [9, 8]].forEach(([a, b]) => hg.fillRect(a, b, 1, 1));
  o.head = head; o.headURL = head.c.toDataURL();
  return (CAT_CACHE[si] = o);
}
function catHead(si, sc) { const s = catSpr(si); sc = sc || 2; return `<img class="ico" src="${s.headURL}" width="${16 * sc}" height="${11 * sc}" alt="">`; }

/* stone statue uses the sit sprite in grey */
const STATUE = buildSprite(CAT_ROWS.sit, { f: '#c4cad8', s: '#9aa0b4', l: '#e4e8f0', p: '#9aa0b4', n: '#9aa0b4', e: '#5d6480' }, OUT);

/* ============ animals (visitors & portraits) ============ */
const ANIMALS = {
  jezek: { rows: ['...b.b.b....', '..bBbBbBb...', '.bBbBbBbBc..', 'bBbBbBbBccc.', 'bBbBbBbcdccd', '.bBbBbcccc..', '..cc..cc....'], pal: { b: '#a8693e', B: '#6b4128', c: '#f2d4a8', d: '#2b1b2b' } },
  zajic: { rows: ['........ww.', '.......wpw.', '.......wpw.', '......wwww.', '......wwdww', 'h.wwwwwwwwp', 'wwwwwwwwww.', '.wwwwWwwww.', '..ww..ww...'], pal: { w: '#e2d8cc', W: '#c4b8ac', p: '#ff9ec0', d: '#2b1b2b', h: '#ffffff' } },
  liska: { rows: ['........n..n', '........nnnn', 'hn......ndnn', 'hnn.....nnhd', '.nnnnnnnnhh.', '..nnnnnnnn..', '..nhhhhhn...', '..d.d..d.d..'], pal: { n: '#f79a3a', h: '#fff3dc', d: '#2b1b2b' } },
  medved: { rows: ['..........b.b.', '..........bbbb', '..bbbbbb..bdbb', '.bbbbbbbbbbbtd', 'bbbbbbbbbbbbt.', 'bbbbbbbbbbbb..', 'bbbbbbbbbbb...', '.bbtbbbbtbb...', '.bb..bb.bb....'], pal: { b: '#8a5a3a', t: '#d0a47a', d: '#2b1b2b' } },
  sova: { rows: ['.B......B.', '.bbbbbbbb.', 'bhhbbbbhhb', 'bhdhbbhdhb', 'bhhbyybhhb', '.bbbbybbb.', '.bccccccb.', '.bccccccb.', '..bccccb..', '...y..y...'], pal: { b: '#a8693e', B: '#6b4128', h: '#fff3dc', d: '#2b1b2b', y: '#ffd23f', c: '#e0bc8c' } }
};
for (const k in ANIMALS) { ANIMALS[k].spr = buildSprite(ANIMALS[k].rows, ANIMALS[k].pal, OUT); ANIMALS[k].url = ANIMALS[k].spr.c.toDataURL(); }
function animalIcon(k, sc) { const a = ANIMALS[k]; sc = sc || 3; return `<img class="ico" src="${a.url}" width="${a.spr.w * sc}" height="${a.spr.h * sc}" alt="">`; }

/* ============ emotes ============ */
const EMO_ROWS = {
  heart: ['.r.r.', 'rrrrr', 'rrrrr', '.rrr.', '..r..'],
  fish: ['..uu.u', 'uuuuuu', 'udu.uu', '..uu.u'],
  note: ['..dd.', '..d.d', '..d..', 'ddd..', 'dd...'],
  sad: ['kkkk.', 'kkkkk', '.u.u.', 'u.u..'],
  bang: ['..r..', '..r..', '..r..', '.....', '..r..'],
  zz: ['ddd..', '..d..', '.dddd', 'd...d', 'dddd.'],
  star: ['..y..', '.yyy.', 'yyyyy', '.y.y.'],
  wood: ['.bbbb', 'tbbbb', 'tbbbb', '.bbbb'],
  hammer: ['kkk..', 'kkkb.', '...b.', '...b.'],
  sleep: ['ddd.', '..d.', '.d..', 'ddd.']
};
const EMO = {};
for (const k in EMO_ROWS) EMO[k] = buildSprite(EMO_ROWS[k], PAL, null);
function drawBubble(g, cx, by, content) {
  // content: {spr} or item key
  let sp = content.item ? SPR[content.item] : EMO[content];
  if (!sp) return;
  const w = sp.w + 4, h = sp.h + 4, x = Math.round(cx - w / 2), y = Math.round(by - h - 2);
  shape(g, [[x, y, w, h, '#fff4dc'], [Math.round(cx) - 1, y + h, 2, 1, '#fff4dc']]);
  R(g, '#e8d4b0', x, y + h - 1, w, 1);
  g.drawImage(sp.c, x + 2, y + 2);
}

/* ============ trees ============ */
function treeCols(S, v) { const T = SEASONS[S].trees; return T[Math.floor(v * 97) % T.length]; }
function drawTree(g, cx, by, tr, S, t) {
  const gr = tr.g;
  if (gr < 0.2 && tr.cut) { // stump
    shape(g, [[cx - 3, by - 4, 6, 4, '#a8693e']]); R(g, '#d8955a', cx - 2, by - 4, 4, 1); R(g, '#8a5230', cx - 1, by - 4, 2, 1);
    if (gr > 0.05 && S !== 3) { R(g, '#72c850', cx + 2, by - 6, 1, 2); R(g, '#b4ec7a', cx + 3, by - 7, 1, 1); }
    return;
  }
  const sc = 0.35 + Math.min(1, gr) * 0.65;
  const pine = tr.v > 0.78;
  if (pine) {
    const hh = Math.round(14 * sc) + 2, col = SEASONS[S].pine;
    shape(g, [[cx - 1, by - 3, 2, 3, '#6b4128']]);
    const parts = [];
    for (let r = 0; r < hh; r++) { const w = Math.floor((r % 4) * 0.8 + r * 0.35); parts.push([cx - w, by - 3 - hh + r, w * 2 + 1, 1, col]); }
    shape(g, parts);
    for (let r = 0; r < hh; r++) {
      const w = Math.floor((r % 4) * 0.8 + r * 0.35), y = by - 3 - hh + r;
      if (S === 3 && r % 4 === 0) R(g, '#ffffff', cx - w, y, w * 2 + 1, 1);
      else if (r % 4 === 1 && w > 0) R(g, S === 3 ? '#ffffff' : 'rgba(255,255,255,0.18)', cx - w, y, 1, 1);
    }
    return;
  }
  const r = Math.max(2, Math.round(6 * sc)), th = Math.max(2, Math.round(4 * sc));
  shape(g, [[cx - 1, by - th - 2, 2, th + 2, '#6b4128']]);
  const cy = by - th - r - 1;
  if (S === 3) {
    // bare branches with snow
    R(g, OUT, cx - r, cy - 1, 1, 3); R(g, OUT, cx + r - 1, cy - 1, 1, 3);
    odisc(g, cx, cy, r, '#e8eef8');
    R(g, '#ffffff', cx - r + 2, cy - r + 1, r, 2); R(g, '#c4d0e6', cx - 1, cy + r - 2, r, 1);
    R(g, '#6b4128', cx - 2, cy + 1, 1, 2); R(g, '#6b4128', cx + 2, cy, 1, 2);
    return;
  }
  const cols = tr.apple ? (S === 0 ? ['#fdd6e4', '#ffffff'] : S === 2 ? ['#e8a83a', '#f6c65a'] : ['#4a9a48', '#72c05a']) : treeCols(S, tr.v);
  odisc(g, cx, cy, r, cols[0]);
  g.fillStyle = cols[1]; disc(g, cx - 1, cy - 1, Math.max(1, r - 2));
  if (tr.apples) {
    const spots = [[-3, 0], [2, -2], [0, 2], [3, 1], [-2, -3], [-4, 2]];
    for (let i = 0; i < Math.min(tr.apples, spots.length); i++) { R(g, '#e8484e', cx + spots[i][0], cy + spots[i][1], 2, 2); R(g, '#fff3dc', cx + spots[i][0], cy + spots[i][1], 1, 1); }
  }
  if (S === 0 && !tr.apple && tr.v < 0.3) { R(g, '#ffffff', cx - 2, cy - 2, 1, 1); R(g, '#ffffff', cx + 2, cy, 1, 1); }
}

/* ============ building parts ============ */
function hipRoof(g, x, y, w, h, col, hi, dk, snow, slope) {
  slope = slope || 1;
  const parts = [];
  for (let i = 0; i < h; i++) { const ins = Math.round((h - 1 - i) * slope); parts.push([x + ins, y + i, w - 2 * ins, 1, col]); }
  shape(g, parts);
  for (let i = 1; i < h - 1; i += 3) { const ins = Math.round((h - 1 - i) * slope); R(g, hi, x + ins, y + i, w - 2 * ins, 1); }
  R(g, dk, x, y + h - 1, w, 1);
  if (snow) {
    for (let i = 0; i < Math.min(4, h - 1); i++) { const ins = Math.round((h - 1 - i) * slope); R(g, i < 3 ? '#ffffff' : '#dbe6f8', x + ins, y + i, w - 2 * ins, 1); }
    for (let k = 2; k < w - 2; k += 5) R(g, '#ffffff', x + k, y + h - 1, 2, 1 + (k % 3));
  }
}
function winGlass(g, x, y, w, h, night, lit) {
  shape(g, [[x, y, w, h, '#6b4128']]);
  R(g, night && lit ? '#ffd86b' : '#bfe4f4', x + 1, y + 1, w - 2, h - 2);
  if (!(night && lit)) R(g, '#ffffff', x + 1, y + 1, 1, 1);
  if (w >= 5) R(g, '#6b4128', x + (w >> 1), y + 1, 1, h - 2);
}
function door(g, x, y, w, h, col) {
  shape(g, [[x, y + 1, w, h - 1, col || '#6b4128'], [x + 1, y, w - 2, 1, col || '#6b4128']]);
  R(g, '#8a5230', x + 1, y + 2, w - 2, h - 3); R(g, '#ffd23f', x + w - 2, y + (h >> 1) + 1, 1, 1);
}
function awning(g, x, y, w, c1, c2) {
  shape(g, [[x, y, w, 3, c1]]);
  for (let i = 0; i < w; i += 2) if ((i >> 1) % 2) R(g, c2, x + i, y, 2, 3);
  for (let i = 0; i < w; i += 2) R(g, (i >> 1) % 2 ? c2 : c1, x + i, y + 3, 1, 1);
}

/* crops on a 2x2 plot */
function drawCrop(g, crop, st, gr, px, py, t, S) {
  if (st === 0) return;
  if (st === 1) {
    if (gr < 0.35) { R(g, '#72c850', px, py - 1, 1, 1); R(g, '#b4ec7a', px + 1, py - 2, 1, 1); }
    else { R(g, '#3a8a44', px, py - 3, 1, 3); R(g, '#72c850', px - 1, py - 3, 1, 1); R(g, '#72c850', px + 1, py - 4, 1, 1); if (gr > 0.7) R(g, '#b4ec7a', px, py - 5, 1, 1); }
    return;
  }
  const sw = Math.round(Math.sin(t * 2 + px * 0.7) * 0.6);
  if (crop === 'psenice') {
    R(g, '#e8962a', px, py - 5, 1, 5); R(g, '#e8962a', px + 2, py - 4, 1, 4);
    shape(g, [[px - 1 + sw, py - 8, 3, 3, '#ffd23f']]); shape(g, [[px + 2 + sw, py - 7, 2, 3, '#ffd23f']]);
  } else if (crop === 'mrkev') {
    shape(g, [[px - 1, py - 2, 3, 2, '#f79a3a']]); R(g, '#3a8a44', px - 1, py - 5, 1, 3); R(g, '#72c850', px + 1, py - 5, 1, 3); R(g, '#72c850', px, py - 6, 1, 4);
  } else if (crop === 'jahody') {
    shape(g, [[px - 2, py - 4, 5, 4, '#3a8a44']]); R(g, '#72c850', px - 1, py - 4, 2, 1);
    R(g, '#e8484e', px - 1, py - 2, 1, 1); R(g, '#e8484e', px + 1, py - 3, 1, 1); R(g, '#e8484e', px + 2, py - 1, 1, 1);
  } else if (crop === 'dyne') {
    R(g, '#3a8a44', px - 3, py - 1, 6, 1);
    shape(g, [[px - 2, py - 4, 5, 4, '#f79a3a']]); R(g, '#cc5f22', px, py - 4, 1, 4); R(g, '#ffd23f', px - 2, py - 3, 1, 1); R(g, '#3a8a44', px, py - 5, 1, 1);
  }
}
function drawPlot(g, X, Y, b, t, S, glass) {
  shape(g, [[X + 1, Y + 2, 30, 29, S === 3 && !glass ? '#b8a898' : '#8a5a2a']]);
  for (let r = 0; r < 4; r++) R(g, S === 3 && !glass ? '#a09080' : '#6e4524', X + 2, Y + 6 + r * 7, 28, 2);
  R(g, S === 3 && !glass ? '#e4ebf6' : '#a8703a', X + 2, Y + 3, 28, 1);
  if (S === 3 && !glass) for (let i = 0; i < 9; i++) R(g, '#ffffff', X + 3 + (i * 11) % 26, Y + 5 + (i * 7) % 24, 3, 1);
  const crop = b.crop || 'psenice';
  for (let row = 0; row < 3; row++) for (let col = 0; col < 4; col++) drawCrop(g, crop, b.st || 0, b.g || 0, X + 5 + col * 7, Y + 11 + row * 8, t, S);
  // little corner posts
  for (const [a, c] of [[0, 0], [30, 0], [0, 29], [30, 29]]) shape(g, [[X + a, Y + c, 2, 3, '#a8693e']]);
}

/* ============ buildings ============ */
const HOUSE_COLS = [['#e0608e', '#ff9ec0', '#a83a64'], ['#6ab4f0', '#a8d4f8', '#3a74c8'], ['#5cbca0', '#8fe0c8', '#3a8a7a'], ['#f79a3a', '#ffc070', '#cc5f22']];
const DRAW = {
  pole(g, X, Y, b, t, S) { drawPlot(g, X, Y, b, t, S, false); },
  sklenik(g, X, Y, b, t, S) {
    drawPlot(g, X, Y, b, t, S, true);
    shape(g, [[X + 1, Y + 8, 30, 23, 'rgba(191,228,244,0.45)']]);
    const parts = []; for (let i = 0; i < 8; i++) parts.push([X + 1 + i, Y + 7 - i, 30 - 2 * i, 1, 'rgba(191,228,244,0.6)']);
    shape(g, parts);
    for (let i = 0; i < 5; i++) R(g, '#fff3dc', X + 1 + i * 7, Y + 8, 1, 23);
    R(g, '#fff3dc', X + 1, Y + 8, 30, 1); R(g, '#fff3dc', X + 1, Y + 19, 30, 1);
    for (let i = 0; i < 4; i++) { R(g, 'rgba(255,255,255,0.7)', X + 3 + i * 7, Y + 12 + i, 1, 3); }
    if (S === 3) R(g, '#ffffff', X + 5, Y + 1, 22, 2);
  },
  spizirna(g, X, Y, b, t, S) {
    shape(g, [[X + 2, Y + 26, 28, 5, '#9aa0b4']]); R(g, '#7d8498', X + 2, Y + 30, 28, 1);
    for (let i = 0; i < 5; i++) R(g, '#c4cad8', X + 4 + i * 6, Y + 27, 3, 1);
    shape(g, [[X + 4, Y + 12, 24, 14, '#b8743e']]);
    for (let i = 0; i < 6; i++) R(g, '#935730', X + 7 + i * 4, Y + 12, 1, 14);
    door(g, X + 12, Y + 16, 8, 11);
    hipRoof(g, X, Y + 1, 32, 12, '#7a4628', '#a8683c', '#5c341e', S === 3);
    shape(g, [[X + 3, Y + 20, 6, 8, '#c47a3a']]); R(g, '#6b4128', X + 3, Y + 22, 6, 1); R(g, '#6b4128', X + 3, Y + 25, 6, 1);
    shape(g, [[X + 23, Y + 21, 6, 7, '#f6e3c0']]); R(g, '#d6ae84', X + 27, Y + 21, 2, 7); R(g, '#a8693e', X + 25, Y + 20, 2, 1);
    g.drawImage(SPR.psenice.c, X + 11, Y + 3);
  },
  domek(g, X, Y, b, t, S, night) {
    const C = HOUSE_COLS[(b.id || 0) % 4];
    shape(g, [[X + 4, Y + 15, 24, 16, '#f4e4c8']]); R(g, '#d8c2a0', X + 25, Y + 15, 3, 16);
    const parts = [];
    for (let i = 0; i < 11; i++) { const ins = 10 - i; parts.push([X + 1 + ins, Y + 5 + i, 30 - 2 * ins, 1, C[0]]); }
    parts.push([X + 7, Y + 1, 2, 1, C[0]], [X + 6, Y + 2, 4, 1, C[0]], [X + 6, Y + 3, 5, 3, C[0]]);
    parts.push([X + 23, Y + 1, 2, 1, C[0]], [X + 22, Y + 2, 4, 1, C[0]], [X + 21, Y + 3, 5, 3, C[0]]);
    shape(g, parts);
    for (let i = 2; i < 10; i += 3) { const ins = 10 - i; R(g, C[1], X + 1 + ins, Y + 5 + i, 30 - 2 * ins, 1); }
    R(g, C[2], X + 1, Y + 15, 30, 1);
    R(g, '#ff9ec0', X + 7, Y + 3, 2, 2); R(g, '#ff9ec0', X + 23, Y + 3, 2, 2);
    if (S === 3) { R(g, '#ffffff', X + 11, Y + 5, 10, 2); R(g, '#ffffff', X + 7, Y + 1, 2, 1); R(g, '#ffffff', X + 23, Y + 1, 2, 1); R(g, '#ffffff', X + 9, Y + 7, 14, 1); }
    door(g, X + 13, Y + 20, 6, 11);
    winGlass(g, X + 21, Y + 19, 5, 5, night, true);
    R(g, '#8a5230', X + 20, Y + 25, 7, 2);
    const fc = SEASONS[S].flowers; if (fc) { R(g, fc[0], X + 21, Y + 24, 1, 1); R(g, fc[1 % fc.length], X + 23, Y + 24, 1, 1); R(g, fc[0], X + 25, Y + 24, 1, 1); }
    // paw print sign
    R(g, C[0], X + 7, Y + 21, 3, 2); R(g, C[0], X + 6, Y + 19, 1, 1); R(g, C[0], X + 8, Y + 18, 1, 1); R(g, C[0], X + 10, Y + 19, 1, 1);
  },
  mlyn(g, X, Y, b, t, S) {
    const body = '#efe2c4', sh = '#cdb88e';
    shape(g, [[X + 7, Y + 20, 18, 11, body], [X + 8, Y + 11, 16, 9, body], [X + 9, Y + 3, 14, 8, body]]);
    R(g, sh, X + 21, Y + 20, 4, 11); R(g, sh, X + 20, Y + 11, 4, 9); R(g, sh, X + 19, Y + 3, 4, 8);
    R(g, '#d8c8a4', X + 10, Y + 24, 3, 1); R(g, '#d8c8a4', X + 16, Y + 15, 3, 1); R(g, '#d8c8a4', X + 12, Y + 7, 3, 1); R(g, '#d8c8a4', X + 18, Y + 27, 2, 1);
    shape(g, [[X + 8, Y - 1, 16, 4, '#8a5230'], [X + 10, Y - 3, 12, 2, '#8a5230'], [X + 13, Y - 4, 6, 1, '#8a5230']]);
    R(g, '#a8683c', X + 10, Y - 3, 12, 1);
    if (S === 3) { R(g, '#ffffff', X + 10, Y - 3, 12, 2); R(g, '#ffffff', X + 13, Y - 4, 6, 1); }
    door(g, X + 13, Y + 23, 6, 8);
    winGlass(g, X + 14, Y + 12, 4, 4, false, false);
    const hx = X + 16, hy = Y + 5, a0 = b.working ? t * 2.2 : 0.35 + (b.id || 0);
    for (let pass = 0; pass < 2; pass++) for (let k = 0; k < 4; k++) {
      const a = a0 + k * Math.PI / 2, ca = Math.cos(a), sa = Math.sin(a);
      for (let r = 5; r <= 14; r += 0.5) for (let w = 1; w <= 3; w++) {
        const cx = Math.round(hx + ca * r - sa * w), cy = Math.round(hy + sa * r + ca * w);
        if (pass) R(g, (w === 3 || r >= 13.5) ? '#e8d4b0' : '#fff3dc', cx, cy, 1, 1); else R(g, OUT, cx - 1, cy - 1, 3, 3);
      }
      for (let r = 1; r <= 14; r++) { const cx = Math.round(hx + ca * r), cy = Math.round(hy + sa * r); if (pass) R(g, '#6b4128', cx, cy, 1, 1); else R(g, OUT, cx - 1, cy - 1, 3, 3); }
    }
    shape(g, [[hx - 1, hy - 1, 3, 3, '#6b4128']]); R(g, '#ffd23f', hx, hy, 1, 1);
  },
  pekarna(g, X, Y, b, t, S, night) {
    shape(g, [[X + 22, Y - 2, 5, 9, '#a8423a']]); R(g, '#7a2e2a', X + 22, Y - 2, 5, 1);
    if (S === 3) R(g, '#ffffff', X + 22, Y - 2, 5, 1);
    shape(g, [[X + 3, Y + 14, 26, 17, '#f6e3c0']]);
    const tim = '#8a5230';
    R(g, tim, X + 3, Y + 14, 26, 1); R(g, tim, X + 3, Y + 21, 26, 1); R(g, tim, X + 11, Y + 14, 1, 7); R(g, tim, X + 20, Y + 14, 1, 7);
    for (let i = 0; i < 6; i++) { R(g, tim, X + 4 + i, Y + 15 + i, 1, 1); R(g, tim, X + 27 - i, Y + 15 + i, 1, 1); }
    hipRoof(g, X, Y + 3, 32, 12, '#c8503e', '#e06a50', '#8a2e26', S === 3);
    awning(g, X + 4, Y + 21, 10, '#ff6f9c', '#fff3dc');
    shape(g, [[X + 5, Y + 25, 8, 5, '#6b4128']]); R(g, night ? '#ffd86b' : '#bfe4f4', X + 6, Y + 26, 6, 3);
    R(g, '#d09050', X + 6, Y + 28, 2, 1); R(g, '#d09050', X + 9, Y + 28, 2, 1);
    door(g, X + 16, Y + 22, 6, 9);
    R(g, '#6b4128', X + 25, Y + 22, 1, 2); g.drawImage(SPR.chleb.c, X + 21, Y + 24);
  },
  kravin(g, X, Y, b, t, S) {
    shape(g, [[X + 3, Y + 13, 26, 18, '#c8503e']]);
    for (let i = 0; i < 8; i++) R(g, '#a83a30', X + 5 + i * 3, Y + 13, 1, 18);
    shape(g, [[X + 1, Y + 10, 30, 4, '#7a3a2a'], [X + 4, Y + 6, 24, 4, '#7a3a2a'], [X + 9, Y + 3, 14, 3, '#7a3a2a']]);
    R(g, '#9a4a3a', X + 4, Y + 7, 24, 1); R(g, '#9a4a3a', X + 1, Y + 11, 30, 1); R(g, '#9a4a3a', X + 9, Y + 4, 14, 1);
    if (S === 3) { R(g, '#ffffff', X + 9, Y + 3, 14, 2); R(g, '#ffffff', X + 4, Y + 6, 24, 1); }
    shape(g, [[X + 10, Y + 19, 12, 12, '#fff3dc']]); R(g, '#c8503e', X + 11, Y + 20, 10, 11);
    for (let i = 0; i < 10; i++) { R(g, '#fff3dc', X + 11 + i, Y + 20 + i, 1, 1); R(g, '#fff3dc', X + 20 - i, Y + 20 + i, 1, 1); }
    shape(g, [[X + 13, Y + 13, 6, 5, OUT]]); R(g, '#ffffff', X + 14, Y + 14, 4, 3); R(g, OUT, X + 14, Y + 14, 1, 1); R(g, '#ff9ec0', X + 15, Y + 16, 2, 1);
    shape(g, [[X + 24, Y + 25, 6, 6, '#ffd23f']]); R(g, '#e8962a', X + 24, Y + 27, 6, 1); R(g, '#e8962a', X + 24, Y + 29, 6, 1);
  },
  zavarovna(g, X, Y, b, t, S, night) {
    shape(g, [[X + 21, Y + 1, 3, 6, '#9aa0b4']]);
    shape(g, [[X + 4, Y + 14, 24, 17, '#fff0b8']]); R(g, '#e8d890', X + 25, Y + 14, 3, 17);
    hipRoof(g, X, Y + 4, 32, 11, '#8a6ac8', '#b89ae8', '#5d4a90', S === 3);
    door(g, X + 13, Y + 21, 6, 10);
    winGlass(g, X + 21, Y + 18, 5, 5, night, true);
    R(g, '#8a5230', X + 4, Y + 24, 8, 1);
    const jc = ['#b3284a', '#f79a3a', '#8a6ac8'];
    for (let i = 0; i < 3; i++) { shape(g, [[X + 5 + i * 2 + (i ? i : 0), Y + 20, 2, 3, jc[i]]]); R(g, '#fff3dc', X + 5 + i * 2 + (i ? i : 0), Y + 19, 2, 1); }
  },
  kuchynka(g, X, Y, b, t, S, night) {
    shape(g, [[X + 21, Y - 1, 5, 8, '#9aa0b4']]); R(g, '#7d8498', X + 21, Y - 1, 5, 1);
    shape(g, [[X + 3, Y + 14, 26, 17, '#d4f0e0']]); R(g, '#b0dcc4', X + 26, Y + 14, 3, 17);
    hipRoof(g, X, Y + 3, 32, 12, '#3a8a7a', '#5cbca0', '#2a6a5a', S === 3);
    odisc(g, X + 8, Y + 21, 3, night ? '#ffd86b' : '#bfe4f4'); R(g, '#6b4128', X + 8, Y + 18, 1, 7); R(g, '#6b4128', X + 5, Y + 21, 7, 1);
    door(g, X + 14, Y + 21, 6, 10);
    g.drawImage(SPR.polevka.c, X + 21, Y + 21);
  },
  cukrarna(g, X, Y, b, t, S, night) {
    shape(g, [[X + 3, Y + 14, 26, 17, '#ffd6e4']]); R(g, '#f4b0c8', X + 26, Y + 14, 3, 17);
    hipRoof(g, X, Y + 3, 32, 12, '#fff3dc', '#ffffff', '#e8d0b0', false);
    for (let i = 0; i < 30; i += 2) R(g, '#ff9ec0', X + 1 + i, Y + 14, 2, 1 + ((i * 7) % 3));
    odisc(g, X + 16, Y + 1, 2, '#e8484e'); R(g, '#3a8a44', X + 17, Y - 3, 1, 2); R(g, '#fff3dc', X + 15, Y, 1, 1);
    awning(g, X + 4, Y + 20, 10, '#6ab4f0', '#fff3dc');
    shape(g, [[X + 5, Y + 24, 8, 6, '#6b4128']]); R(g, night ? '#ffd86b' : '#bfe4f4', X + 6, Y + 25, 6, 4);
    R(g, '#fff3dc', X + 7, Y + 27, 4, 2); R(g, '#e8484e', X + 8, Y + 26, 1, 1);
    door(g, X + 17, Y + 21, 6, 10);
  },
  drevorubec(g, X, Y, b, t, S) {
    shape(g, [[X + 6, Y + 1, 3, 7, '#9aa0b4']]);
    shape(g, [[X + 4, Y + 15, 24, 16, '#a8693e']]);
    for (let r = 0; r < 8; r++) R(g, r % 2 ? '#8a5230' : '#a8693e', X + 4, Y + 15 + r * 2, 24, 2);
    for (let r = 0; r < 8; r++) { R(g, '#d8955a', X + 3, Y + 15 + r * 2, 2, 2); R(g, '#d8955a', X + 27, Y + 15 + r * 2, 2, 2); R(g, '#a86a34', X + 3, Y + 16 + r * 2, 1, 1); }
    hipRoof(g, X, Y + 5, 32, 11, '#5c3a26', '#8a5230', '#3e2618', S === 3);
    door(g, X + 13, Y + 21, 6, 10);
    winGlass(g, X + 6, Y + 19, 4, 4, false, false);
    const n = Math.min(6, (b.out && b.out.drevo) || 0);
    for (let i = 0; i < n; i++) { const lx = X + 21 + (i % 3) * 3, ly = Y + 27 - Math.floor(i / 3) * 3; shape(g, [[lx, ly, 3, 3, '#d8955a']]); R(g, '#a86a34', lx + 1, ly + 1, 1, 1); }
    shape(g, [[X + 22, Y + 19, 4, 3, '#a8693e']]); R(g, '#c4cad8', X + 23, Y + 16, 3, 2); R(g, '#6b4128', X + 24, Y + 18, 1, 2);
  },
  trziste(g, X, Y, b, t, S) {
    shape(g, [[X + 2, Y - 10, 2, 25, '#8a5230'], [X + 28, Y - 10, 2, 25, '#8a5230']]);
    shape(g, [[X, Y - 14, 32, 5, '#ff6f9c']]);
    for (let i = 0; i < 8; i++) if (i % 2) R(g, '#fff3dc', X + i * 4, Y - 14, 4, 5);
    for (let i = 0; i < 8; i++) R(g, i % 2 ? '#fff3dc' : '#ff6f9c', X + i * 4 + 1, Y - 9, 2, 1);
    if (S === 3) R(g, '#ffffff', X, Y - 14, 32, 2);
    shape(g, [[X + 1, Y + 3, 30, 12, '#b8743e']]); R(g, '#d8955a', X + 1, Y + 3, 30, 1);
    for (let i = 0; i < 5; i++) R(g, '#935730', X + 4 + i * 6, Y + 4, 1, 11);
    const inv = b.inp ? Object.keys(b.inp).filter(k => b.inp[k] > 0) : [];
    for (let i = 0; i < Math.min(3, inv.length); i++) { const s = SPR[inv[i]]; g.drawImage(s.c, X + 3 + i * 9, Y + 4 - s.h); }
    g.drawImage(SPR.coin.c, X + 13, Y + 7);
  },
  molo(g, X, Y, b, t, S) {
    R(g, OUT, X + 2, Y + 12, 2, 4); R(g, OUT, X + 12, Y + 12, 2, 4);
    shape(g, [[X + 1, Y + 1, 14, 12, '#b8743e']]);
    for (let i = 0; i < 4; i++) R(g, '#935730', X + 1, Y + 3 + i * 3, 14, 1);
    R(g, '#d8955a', X + 1, Y + 1, 14, 1);
    shape(g, [[X + 10, Y + 3, 4, 3, '#a8693e']]); R(g, '#6b4128', X + 10, Y + 4, 4, 1);
  },
  vcelin(g, X, Y, b, t, S) {
    shape(g, [[X + 4, Y + 12, 1, 4, '#6b4128'], [X + 11, Y + 12, 1, 4, '#6b4128']]);
    shape(g, [[X + 3, Y + 7, 10, 5, '#ffd23f'], [X + 3, Y + 2, 10, 5, '#ffd23f'], [X + 2, Y, 12, 2, '#a8693e']]);
    R(g, '#e8962a', X + 3, Y + 4, 10, 1); R(g, '#e8962a', X + 3, Y + 9, 10, 1); R(g, '#e8962a', X + 3, Y + 6, 10, 1);
    R(g, OUT, X + 7, Y + 10, 2, 1);
    if (S === 3) R(g, '#ffffff', X + 2, Y - 1, 12, 2);
    if (b.active) for (let i = 0; i < 3; i++) {
      const a = t * 3 + i * 2.1, bx = Math.round(X + 8 + Math.cos(a) * (6 + i)), by = Math.round(Y + 5 + Math.sin(a * 1.3) * 4);
      R(g, OUT, bx, by, 2, 1); R(g, '#ffd23f', bx, by, 1, 1);
    }
  },
  jablon(g, X, Y, b, t, S) {
    drawTree(g, X + 8, Y + 15, { g: b.mature ? 1 : Math.min(0.9, 0.3 + (b.age || 0) / (1.5 * DAY)), v: 0.5, apple: true, apples: (b.out && b.out.jablka) || 0 }, S, t);
  },
  nastenka(g, X, Y, b, t, S) {
    shape(g, [[X + 2, Y + 4, 2, 12, '#8a5230'], [X + 12, Y + 4, 2, 12, '#8a5230']]);
    shape(g, [[X + 1, Y + 2, 14, 9, '#b8743e']]);
    shape(g, [[X, Y, 16, 2, '#7a4628']]); if (S === 3) R(g, '#ffffff', X, Y, 16, 1);
    const n = G.orders.length, pc = ['#fff3dc', '#ffd23f', '#ff9ec0', '#a8d4f8'], pos = [[3, 4], [8, 3], [4, 7], [9, 7]];
    for (let i = 0; i < Math.min(4, n); i++) { R(g, pc[i], X + pos[i][0], Y + pos[i][1], 4, 3); R(g, '#d6ae84', X + pos[i][0] + 1, Y + pos[i][1] + 1, 2, 1); R(g, '#e8484e', X + pos[i][0] + 1, Y + pos[i][1], 1, 1); }
  },
  kvetiny(g, X, Y, b, t, S) {
    shape(g, [[X + 1, Y + 9, 14, 6, '#8a5a2a']]); R(g, '#6e4524', X + 1, Y + 13, 14, 2);
    for (let i = 0; i < 4; i++) R(g, '#c4cad8', X + 1 + i * 4, Y + 14, 2, 1);
    const fc = SEASONS[S].flowers;
    const spots = [[3, 8], [6, 6], [9, 8], [12, 6], [7, 9]];
    spots.forEach(([a, c], i) => {
      if (!fc) { R(g, '#3f7a4a', X + a, Y + c + 2, 1, 2); R(g, '#ffffff', X + a, Y + c + 1, 1, 1); return; }
      R(g, '#3a8a44', X + a, Y + c + 1, 1, 3);
      const col = fc[(i + (b.id || 0)) % fc.length];
      R(g, OUT, X + a - 1, Y + c - 1, 3, 3); R(g, col, X + a - 1, Y + c, 3, 1); R(g, col, X + a, Y + c - 1, 1, 3); R(g, '#ffd23f', X + a, Y + c, 1, 1);
    });
  },
  plot(g, X, Y, b, t, S) {
    const L = b.conL, Rr = b.conR;
    const x0 = L ? X : X + 2, x1 = Rr ? X + 16 : X + 14;
    shape(g, [[x0, Y + 8, x1 - x0, 1, '#d8955a'], [x0, Y + 11, x1 - x0, 1, '#d8955a'], [X + 3, Y + 5, 2, 10, '#e8b27a'], [X + 11, Y + 5, 2, 10, '#e8b27a']]);
    if (S === 3) { R(g, '#ffffff', X + 3, Y + 5, 2, 1); R(g, '#ffffff', X + 11, Y + 5, 2, 1); }
  },
  lucerna(g, X, Y, b, t, S, night) {
    shape(g, [[X + 5, Y + 13, 6, 2, '#5d6480'], [X + 7, Y + 3, 2, 10, '#5d6480']]);
    shape(g, [[X + 5, Y - 3, 6, 6, OUT]]); R(g, night ? '#fff4b0' : '#ffd23f', X + 6, Y - 2, 4, 4);
    if (night) R(g, '#ffffff', X + 7, Y - 1, 2, 2);
    shape(g, [[X + 4, Y - 5, 8, 1, '#5d6480'], [X + 6, Y - 6, 4, 1, '#5d6480']]);
    if (S === 3) R(g, '#ffffff', X + 4, Y - 6, 8, 1);
  },
  lavicka(g, X, Y, b, t, S) {
    shape(g, [[X + 2, Y + 11, 2, 4, '#6b4128'], [X + 12, Y + 11, 2, 4, '#6b4128'], [X + 1, Y + 9, 14, 3, '#b8743e'], [X + 1, Y + 4, 14, 3, '#b8743e'], [X + 2, Y + 7, 1, 2, '#6b4128'], [X + 13, Y + 7, 1, 2, '#6b4128']]);
    R(g, '#d8955a', X + 1, Y + 9, 14, 1); R(g, '#d8955a', X + 1, Y + 4, 14, 1);
    if (S === 3) { R(g, '#ffffff', X + 1, Y + 4, 14, 1); R(g, '#ffffff', X + 1, Y + 9, 14, 1); }
  },
  skrabadlo(g, X, Y, b, t, S) {
    shape(g, [[X + 2, Y + 12, 12, 3, '#b89ae8']]);
    shape(g, [[X + 6, Y - 6, 4, 18, '#e8c9a0']]);
    for (let i = 0; i < 9; i++) R(g, '#c9a27a', X + 6, Y - 5 + i * 2, 4, 1);
    shape(g, [[X + 1, Y + 3, 8, 2, '#b89ae8'], [X + 7, Y - 8, 8, 2, '#b89ae8']]);
    R(g, '#d8c8f4', X + 1, Y + 3, 8, 1); R(g, '#d8c8f4', X + 7, Y - 8, 8, 1);
    R(g, OUT, X + 13, Y - 6, 1, 5); odisc(g, X + 13, Y, 1, '#ff6f9c');
  },
  socha(g, X, Y, b, t, S) {
    shape(g, [[X + 2, Y + 11, 12, 5, '#9aa0b4']]); R(g, '#c4cad8', X + 2, Y + 11, 12, 1);
    g.drawImage(STATUE.c, X + 2, Y - 1);
    if (S === 3) R(g, '#ffffff', X + 8, Y - 1, 4, 1);
  },
  fontana(g, X, Y, b, t, S) {
    const parts = [];
    for (let i = 0; i < 16; i++) { const w = Math.round(Math.sqrt(1 - Math.pow((i - 7.5) / 8, 2)) * 14); parts.push([X + 16 - w, Y + 12 + i, w * 2, 1, '#c4cad8']); }
    shape(g, parts);
    for (let i = 2; i < 14; i++) { const w = Math.round(Math.sqrt(1 - Math.pow((i - 7.5) / 8, 2)) * 11); R(g, S === 3 ? '#c8e4f8' : '#6ab4f0', X + 16 - w, Y + 12 + i, w * 2, 1); }
    shape(g, [[X + 14, Y + 6, 4, 14, '#c4cad8'], [X + 11, Y + 5, 10, 2, '#c4cad8']]);
    if (S !== 3) {
      for (let i = 0; i < 6; i++) { const ph = (t * 1.6 + i / 6) % 1, dx = (i % 2 ? 1 : -1) * (2 + ph * 8), dy = -Math.sin(ph * Math.PI) * 7; R(g, '#a8d4f8', Math.round(X + 16 + dx), Math.round(Y + 5 + dy + ph * 10), 1, 1); }
      R(g, '#ffffff', X + 9 + ((t * 5) | 0) % 10, Y + 20, 2, 1);
    }
  },
  vanocni(g, X, Y, b, t, S) {
    drawTree(g, X + 8, Y + 15, { g: 1, v: 0.9 }, 3, t);
    const cols = ['#e8484e', '#ffd23f', '#6ab4f0', '#ff9ec0'];
    [[6, 6], [10, 8], [7, 10], [9, 3], [5, 12], [11, 12]].forEach(([a, c], i) => R(g, cols[(i + Math.floor(t * 2)) % 4], X + a, Y + c, 1, 1));
    R(g, OUT, X + 7, Y - 5, 3, 3); R(g, '#ffd23f', X + 8, Y - 5, 1, 3); R(g, '#ffd23f', X + 7, Y - 4, 3, 1);
  }
};
function drawBuilding(g, b, X, Y, t, S, night) { const f = DRAW[b.type]; if (f) f(g, X, Y, b, t, S, night); }

/* construction site */
function drawSite(g, b, X, Y, t, S, night) {
  const d = B[b.type], W = d.w * TS, H = d.h * TS;
  const total = b.workTotal || 1, prog = b.need && Object.values(b.need).some(v => v > 0) ? 0 : 1 - b.work / total;
  // stakes and string
  R(g, '#a8693e', X + 1, Y + H - 4, 1, 4); R(g, '#a8693e', X + W - 2, Y + H - 4, 1, 4); R(g, '#a8693e', X + 1, Y + 1, 1, 4); R(g, '#a8693e', X + W - 2, Y + 1, 1, 4);
  R(g, 'rgba(255,243,220,0.7)', X + 1, Y + 2, W - 2, 1); R(g, 'rgba(255,243,220,0.7)', X + 1, Y + H - 3, W - 2, 1);
  if (prog > 0) {
    g.save(); g.beginPath(); const hh = Math.round(prog * (H + 16)); g.rect(X - 16, Y + H - hh, W + 32, hh + 2); g.clip();
    drawBuilding(g, Object.assign({}, b, { working: false }), X, Y, t, S, night);
    g.restore();
    // scaffold
    const top = Y + H - Math.round(prog * (H + 16));
    R(g, OUT, X - 1, top - 1, 3, Y + H - top + 1); R(g, '#d8955a', X, top, 1, Y + H - top);
    R(g, OUT, X + W - 2, top - 1, 3, Y + H - top + 1); R(g, '#d8955a', X + W - 1, top, 1, Y + H - top);
    R(g, OUT, X - 1, top - 1, W + 2, 3); R(g, '#d8955a', X, top, W, 1);
  }
  // wood pile of delivered wood
  const got = (d.wood || 0) - ((b.need && b.need.drevo) || 0);
  for (let i = 0; i < Math.min(6, got); i++) { const lx = X + 3 + (i % 3) * 3, ly = Y + H - 5 - Math.floor(i / 3) * 3; shape(g, [[lx, ly, 3, 2, '#d8955a']]); }
}
