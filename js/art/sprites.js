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
  rain: ['.kkkk.', 'kkkkkk', 'KKKKKK', '.u.u..', 'u.u.u.'],
  flag: ['d.....', 'drrrr.', 'drrrrr', 'drrrr.', 'd.....', 'd.....', 'd.....'],
  map: ['cccccccc', 'cgguCccc', 'cguuCgcc', 'cggCCggc', 'cCCggyyc', 'ccgggyyc', 'cccccccc']
};
const SPR = {};
function addSprites(rows) { for (const k in rows) { ROWS[k] = rows[k]; SPR[k] = buildSprite(rows[k], PAL, OUT); } }
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
  const sk = SKINS[si] || SKINS[0];
  const pal = { f: sk.f, s: sk.s, l: sk.l, p: sk.p, n: sk.n, e: sk.eye[3] };
  const o = {};
  for (const k in CAT_ROWS) o[k] = buildSprite(CAT_ROWS[k], pal, sk.o);
  const head = buildSprite(CAT_HEAD, { o: sk.o, f: sk.f, s: sk.s, l: sk.l, p: sk.p, n: sk.n }, null);
  const hg = head.c.getContext('2d');
  for (const ex of [3, 11]) { R(hg, sk.eye[0], ex, 5, 1, 1); R(hg, sk.eye[1], ex + 1, 5, 1, 1); R(hg, sk.eye[2], ex, 6, 1, 1); R(hg, sk.eye[3], ex + 1, 6, 1, 1); }
  hg.fillStyle = sk.o; [[6, 8], [7, 9], [8, 9], [9, 8]].forEach(([a, b]) => hg.fillRect(a, b, 1, 1));
  o.head = head; o.headURL = head.c.toDataURL();
  return (CAT_CACHE[si] = o);
}
function catHead(si, sc) { const s = catSpr(si); sc = sc || 2; return `<img class="ico" src="${s.headURL}" width="${16 * sc}" height="${11 * sc}" alt="">`; }
const STATUE = buildSprite(CAT_ROWS.sit, { f: '#c4cad8', s: '#9aa0b4', l: '#e4e8f0', p: '#9aa0b4', n: '#9aa0b4', e: '#5d6480' }, OUT);

/* ============ animals (visitors, traders, portraits) ============ */
const ANIMALS = {
  jezek: { n: 'ježek', rows: ['...b.b.b....', '..bBbBbBb...', '.bBbBbBbBc..', 'bBbBbBbBccc.', 'bBbBbBbcdccd', '.bBbBbcccc..', '..cc..cc....'], pal: { b: '#a8693e', B: '#6b4128', c: '#f2d4a8', d: '#2b1b2b' } },
  zajic: { n: 'zajíc', rows: ['........ww.', '.......wpw.', '.......wpw.', '......wwww.', '......wwdww', 'h.wwwwwwwwp', 'wwwwwwwwww.', '.wwwwWwwww.', '..ww..ww...'], pal: { w: '#e2d8cc', W: '#c4b8ac', p: '#ff9ec0', d: '#2b1b2b', h: '#ffffff' } },
  liska: { n: 'liška', rows: ['........n..n', '........nnnn', 'hn......ndnn', 'hnn.....nnhd', '.nnnnnnnnhh.', '..nnnnnnnn..', '..nhhhhhn...', '..d.d..d.d..'], pal: { n: '#f79a3a', h: '#fff3dc', d: '#2b1b2b' } },
  medved: { n: 'medvěd', rows: ['..........b.b.', '..........bbbb', '..bbbbbb..bdbb', '.bbbbbbbbbbbtd', 'bbbbbbbbbbbbt.', 'bbbbbbbbbbbb..', 'bbbbbbbbbbb...', '.bbtbbbbtbb...', '.bb..bb.bb....'], pal: { b: '#8a5a3a', t: '#d0a47a', d: '#2b1b2b' } },
  sova: { n: 'sova', rows: ['.B......B.', '.bbbbbbbb.', 'bhhbbbbhhb', 'bhdhbbhdhb', 'bhhbyybhhb', '.bbbbybbb.', '.bccccccb.', '.bccccccb.', '..bccccb..', '...y..y...'], pal: { b: '#a8693e', B: '#6b4128', h: '#fff3dc', d: '#2b1b2b', y: '#ffd23f', c: '#e0bc8c' } },
  bobr: { n: 'bobr', rows: ['.........bb.', '........bbbb', '........bdbb', '.bbbbbbbbbbw', 'BBbbbbbbbbw.', 'BBBbbbbbbb..', 'BBB.bbbbbb..', '....b.b.b...'], pal: { b: '#8a5230', B: '#5c3a26', d: '#2b1b2b', w: '#fff3dc' } },
  vydra: { n: 'vydra', rows: ['..........kk', '.........kdkk', 'k.......kkkcc', 'kk.kkkkkkkcc.', '.kkkkkkkkkk..', '..kkkkkkkk...', '...k..k..k...'], pal: { k: '#7a5a42', c: '#e0c8a8', d: '#2b1b2b' } },
  myval: { n: 'mýval', rows: ['........k...k', '........kkkkk', 'k.......kdwdk', 'kx.......kkwk', 'kxkkkkkkkkk..', '.xkkkkkkkk...', '..kk..kk.....'], pal: { k: '#9aa0b4', x: '#3e3852', d: '#2b1b2b', w: '#ffffff' } },
  jezevec: { n: 'jezevec', rows: ['.........wx.', '........wwxx', '.kkkkkkkwdxw', 'kkkkkkkkkwww', 'kkkkkkkkkk..', '.kk..kk.....'], pal: { k: '#6a6480', w: '#ffffff', x: '#2b1b2b', d: '#2b1b2b' } },
  kachna: { n: 'kachna', rows: ['.......gg.', '......ggdg', '......gggyy', '.wwwwwwww..', 'wwwwwwwww..', '.wwwwwww...', '...y..y....'], pal: { g: '#3a8a44', d: '#2b1b2b', y: '#f79a3a', w: '#f6f1ec' } },
  tucnak: { n: 'tučňák', rows: ['..xxxx..', '.xxxxxx.', '.xdwwdx.', '.xwyywx.', 'xxwwwwxx', 'xxwwwwxx', '.xwwwwx.', '.xwwwwx.', '..y..y..'], pal: { x: '#2b2a38', w: '#f6f1ec', d: '#2b1b2b', y: '#f79a3a' } },
  veverka: { n: 'veverka', rows: ['nn......n.n.', 'nnn.....nnnn', 'nnn.....ndnn', '.nn....nnnc.', '..nnnnnnncc.', '...nnnnnn...', '....n..n....'], pal: { n: '#cc5f22', c: '#fff3dc', d: '#2b1b2b' } }
};
for (const k in ANIMALS) { ANIMALS[k].spr = buildSprite(ANIMALS[k].rows, ANIMALS[k].pal, OUT); ANIMALS[k].url = ANIMALS[k].spr.c.toDataURL(); }
function animalIcon(k, sc) { const a = ANIMALS[k] || ANIMALS.jezek; sc = sc || 3; return `<img class="ico" src="${a.url}" width="${a.spr.w * sc}" height="${a.spr.h * sc}" alt="">`; }

/* ============ emotes ============ */
const EMO_ROWS = {
  heart: ['.r.r.', 'rrrrr', 'rrrrr', '.rrr.', '..r..'],
  fish: ['..uu.u', 'uuuuuu', 'udu.uu', '..uu.u'],
  note: ['..dd.', '..d.d', '..d..', 'ddd..', 'dd...'],
  sad: ['kkkk.', 'kkkkk', '.u.u.', 'u.u..'],
  bang: ['..r..', '..r..', '..r..', '.....', '..r..'],
  zz: ['ddd..', '..d..', '.dddd', 'd...d', 'dddd.'],
  star: ['..y..', '.yyy.', 'yyyyy', '.y.y.'],
  noise: ['.d.d.', 'd.d.d', '.d.d.', 'd.d.d']
};
const EMO = {};
for (const k in EMO_ROWS) EMO[k] = buildSprite(EMO_ROWS[k], PAL, null);
function drawBubble(g, cx, by, content) {
  const sp = content && content.item ? SPR[content.item] : EMO[content];
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
  if (gr < 0.2 && tr.cut) {
    shape(g, [[cx - 3, by - 4, 6, 4, '#a8693e']]); R(g, '#d8955a', cx - 2, by - 4, 4, 1); R(g, '#8a5230', cx - 1, by - 4, 2, 1);
    if (gr > 0.05 && S !== 3) { R(g, '#72c850', cx + 2, by - 6, 1, 2); R(g, '#b4ec7a', cx + 3, by - 7, 1, 1); }
    return;
  }
  const sc = 0.35 + Math.min(1, gr) * 0.65;
  const kind = tr.k || (tr.v > 0.78 ? 'pine' : 'round');
  if (kind === 'pine') {
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
  if (kind === 'birch') {
    const th = Math.max(3, Math.round(7 * sc)), r = Math.max(2, Math.round(4 * sc));
    shape(g, [[cx - 1, by - th - 2, 2, th + 2, '#f6f1ec']]);
    R(g, OUT, cx - 1, by - th + 1, 1, 1); R(g, OUT, cx, by - 3, 1, 1);
    const cy = by - th - r - 1, cols = S === 3 ? ['#e8eef8', '#ffffff'] : SEASONS[S].birch;
    shape(g, [[cx - r, cy - r - 2, r * 2, r * 2 + 3, cols[0]]]);
    R(g, cols[1], cx - r + 1, cy - r - 1, r, r);
    if (S === 3) R(g, '#ffffff', cx - r, cy - r - 2, r * 2, 2);
    return;
  }
  const r = Math.max(2, Math.round(6 * sc)), th = Math.max(2, Math.round(4 * sc));
  shape(g, [[cx - 1, by - th - 2, 2, th + 2, '#6b4128']]);
  const cy = by - th - r - 1;
  if (S === 3) {
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
/* tree sprite cache: kind × season × growth bucket × colour variant */
const TREE_CACHE = new Map();
function treeSprite(tr, S) {
  const kind = tr.k || (tr.v > 0.78 ? 'pine' : 'round');
  const gb = tr.cut && tr.g < 0.2 ? (tr.g > 0.05 ? 'c1' : 'c0') : Math.min(4, Math.floor(tr.g * 4));
  const cv = kind === 'round' ? Math.floor(tr.v * 97) % SEASONS[S].trees.length + (S === 0 && tr.v < 0.3 ? 10 : 0) : 0;
  const key = kind + S + gb + '|' + cv;
  let s = TREE_CACHE.get(key);
  if (!s) {
    const [c, g] = mk(20, 26);
    drawTree(g, 10, 25, { g: typeof gb === 'number' ? Math.min(1, gb / 4 + 0.001) || 0.001 : tr.g, v: tr.v, k: kind, cut: tr.cut }, S, 0);
    s = c; TREE_CACHE.set(key, s);
  }
  return s;
}

/* ============ points of interest ============ */
const POI_TYPES = {
  poklad: { n: 'Zapomenutá truhla', d: 'Někdo tu kdysi schoval mince.' },
  studanka: { n: 'Studánka', d: 'Čistá voda a klid. +4 útulnost natrvalo.' },
  mlyn: { n: 'Opuštěný mlýn', d: 'Staré mlýnské kameny — dřevo a mouka navíc.' },
  hvezdarna: { n: 'Zřícenina hvězdárny', d: 'Staré knihy o hvězdách. Vědci se budou učit rychleji.' },
  dul: { n: 'Starý důl', d: 'Opuštěná štola plná uhlí.' },
  majak: { n: 'Rozbořený maják', d: 'Tady kdysi svítilo lodím. Přístav tu přiláká víc lodí.' },
  krater: { n: 'Kráter po meteoritu', d: 'Kus hvězdy spadl do údolí… Vědci ho budou chtít prozkoumat.' },
  vesnice: { n: 'Opuštěná osada', d: 'Pár starých domků — zbyly v nich zásoby.' }
};
function drawPOI(g, p, X, Y, S, t) {
  switch (p.type) {
    case 'poklad':
      shape(g, [[X + 3, Y + 7, 10, 7, '#a8693e'], [X + 3, Y + 4, 10, 3, '#8a5230']]);
      R(g, '#ffd23f', X + 3, Y + 7, 10, 1); R(g, '#ffd23f', X + 7, Y + 8, 2, 3); R(g, '#6b4128', X + 3, Y + 10, 10, 1);
      if (Math.floor(t * 2) % 2) R(g, '#fff4b0', X + 12, Y + 3, 1, 1);
      break;
    case 'studanka':
      shape(g, [[X + 2, Y + 8, 12, 6, '#9aa0b4']]); R(g, '#6ab4f0', X + 4, Y + 9, 8, 3); R(g, '#c4cad8', X + 2, Y + 8, 12, 1);
      shape(g, [[X + 3, Y + 1, 1, 7, '#8a5230'], [X + 12, Y + 1, 1, 7, '#8a5230'], [X + 2, Y, 12, 2, '#a8693e']]);
      break;
    case 'mlyn':
      shape(g, [[X + 4, Y + 5, 9, 10, '#b8a898'], [X + 3, Y + 2, 11, 3, '#6b4128']]);
      R(g, '#8a7868', X + 7, Y + 10, 3, 5);
      for (let r = 2; r < 8; r++) { R(g, '#5c3a26', X + 8 + r, Y + 3 - Math.floor(r / 2), 1, 1); R(g, '#5c3a26', X + 8 - r, Y + 3 + Math.floor(r / 3), 1, 1); }
      break;
    case 'hvezdarna':
      shape(g, [[X + 1, Y + 7, 14, 8, '#c4cad8']]); R(g, '#9aa0b4', X + 1, Y + 11, 14, 1);
      shape(g, [[X + 3, Y + 2, 10, 5, '#9aa0b4']]); R(g, OUT, X + 7, Y + 2, 2, 5); R(g, '#e8484e', X + 12, Y + 1, 1, 1);
      break;
    case 'dul':
      shape(g, [[X + 1, Y + 4, 14, 11, '#6a6480']]); R(g, OUT, X + 5, Y + 7, 6, 8);
      R(g, '#a8693e', X + 4, Y + 6, 8, 1); R(g, '#a8693e', X + 4, Y + 6, 1, 9); R(g, '#a8693e', X + 11, Y + 6, 1, 9);
      R(g, '#3e3852', X + 13, Y + 12, 2, 2);
      break;
    case 'majak':
      shape(g, [[X + 5, Y - 6, 6, 21, '#fff3dc']]); R(g, '#e8484e', X + 5, Y - 2, 6, 3); R(g, '#e8484e', X + 5, Y + 5, 6, 3);
      shape(g, [[X + 4, Y - 9, 8, 3, '#5d6480']]); R(g, OUT, X + 7, Y + 11, 2, 4);
      break;
    case 'krater':
      shape(g, [[X + 1, Y + 7, 14, 7, '#6a6480']]); R(g, '#3e3852', X + 3, Y + 9, 10, 4);
      odisc(g, X + 8, Y + 10, 2, '#b89ae8'); if (Math.floor(t * 3) % 2) R(g, '#ffffff', X + 8, Y + 9, 1, 1);
      break;
    case 'vesnice':
      shape(g, [[X + 2, Y + 7, 12, 8, '#d8c2a0']]); R(g, '#b8a080', X + 2, Y + 11, 12, 1);
      const parts = []; for (let i = 0; i < 5; i++) parts.push([X + 1 + i, Y + 6 - i, 14 - 2 * i, 1, '#8a6a58']); shape(g, parts);
      R(g, '#5c3a26', X + 7, Y + 10, 2, 5);
      break;
  }
  if (S === 3) R(g, 'rgba(255,255,255,0.7)', X + 3, Y + 3, 8, 1);
}
