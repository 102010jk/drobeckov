'use strict';
/* ============ era 2 art ============ */
addSprites({
  uhli: ['..xx....', '.xzxxx..', 'xxxxzxx.', 'xzxxxxxx', 'xxxxxzxx', '.xxxxxx.'],
  ruda_fe: ['..SS....', '.SrSSS..', 'SSSRrSS.', 'SrSSSSrS', 'SSSrSSSS', '.SSSSSS.'],
  ruda_cu: ['..SS....', '.SnSSS..', 'SSSMnSS.', 'SnSSSSMS', 'SSSnSSSS', '.SSSSSS.'],
  ruda_sn: ['..SS....', '.SwSSS..', 'SSSsWSS.', 'SwSSSSsS', 'SSSwSSSS', '.SSSSSS.'],
  bauxit: ['..nn....', '.nNnnn..', 'nnnNnnn.', 'nNnnnnNn', 'NnnnnnNN', '.NNNNNN.'],
  ruda_au: ['..SS....', '.SySSS..', 'SSSyhSS.', 'SySSSSyS', 'SSSySSSS', '.SSSSSS.'],
  zelezo: ['.kkkkkk.', 'kwkkkkkK', 'kkkkkkKK', '.KKKKKK.'],
  medkov: ['.nnnnnn.', 'nynnnnnN', 'nnnnnnNN', '.NNNNNN.'],
  cin: ['.ssssss.', 'swssssSS', 'ssssssSS', '.SSSSSS.'],
  zlato: ['.yyyyyy.', 'yhyyyyyY', 'yyyyyyYY', '.YYYYYY.'],
  ocel: ['.WWWWWW.', 'WwWWWWWk', 'WWWWWWkk', '.kkkkkk.'],
  bronz: ['.oooooo.', 'ohoooooO', 'ooooooOO', '.OOOOOO.'],
  hrebiky: ['k.k.k.', 'k.k.k.', 'k.k.k.', 'k.k.k.', '.k.k.k', 'KKKKKK'],
  naradi: ['kkk...', 'kKk...', '.b....', '.b.kk.', '.bkKk.', '..kk..', '...b..', '...b..'],
  sperky: ['..yyy..', '.y...y.', 'y.....y', 'y.....y', '.y...y.', '..ymy..', '...m...'],
  ryby_more: ['...MMMM....', '.MMwMMMM.MM', 'MMdMMMMMMM.', 'MMMMMmMMMM.', '.MMMmMMM.MM', '...mmmm....']
});
Object.assign(DRAW, {
  dul(g, X, Y, b, S) {
    shape(g, [[X + 1, Y + 8, 30, 23, '#8a8580']]); R(g, '#6c6862', X + 1, Y + 20, 30, 2);
    for (let i = 0; i < 6; i++) R(g, '#a8a39c', X + 3 + i * 5, Y + 10 + (i % 3) * 3, 3, 1);
    shape(g, [[X + 9, Y + 14, 14, 17, OUT]]);
    shape(g, [[X + 8, Y + 12, 16, 3, '#8a5230'], [X + 8, Y + 12, 3, 19, '#8a5230'], [X + 21, Y + 12, 3, 19, '#8a5230']]); R(g, '#a8693e', X + 8, Y + 12, 16, 1);
    R(g, '#5d6480', X + 12, Y + 18, 1, 13); R(g, '#5d6480', X + 19, Y + 18, 1, 13);
    for (let i = 0; i < 4; i++) R(g, '#6b4128', X + 11, Y + 20 + i * 3, 10, 1);
    const oc = ORE_COL[b.ore] || ['#3e3852', '#6a6480'];
    shape(g, [[X + 25, Y + 22, 6, 5, '#6b4128']]); R(g, oc[0], X + 25, Y + 21, 6, 2); R(g, oc[1], X + 27, Y + 21, 2, 1);
    odisc(g, X + 26, Y + 28, 1, '#5d6480'); odisc(g, X + 30, Y + 28, 1, '#5d6480');
    if (S === 3) R(g, '#ffffff', X + 1, Y + 8, 30, 2);
  },
  uhlir(g, X, Y, b, S) {
    const parts = []; for (let i = 0; i < 12; i++) { const w = Math.round(Math.sqrt(1 - Math.pow((11 - i) / 12, 2)) * 13); parts.push([X + 16 - w, Y + 14 + i, w * 2, 1, '#5c3a26']); } shape(g, parts);
    for (let i = 0; i < 5; i++) R(g, '#3e2618', X + 8 + i * 4, Y + 18 + (i % 2) * 3, 2, 1);
    R(g, S === 3 ? '#ffffff' : '#72c850', X + 12, Y + 14, 8, 1);
    shape(g, [[X + 2, Y + 24, 6, 6, '#d8955a']]); R(g, '#a86a34', X + 3, Y + 25, 1, 1);
  },
  tavirna(g, X, Y, b, S) {
    shape(g, [[X + 22, Y - 6, 6, 20, '#a8423a']]); for (let i = 0; i < 6; i++) R(g, '#7a2e2a', X + 22, Y - 4 + i * 3, 6, 1);
    const parts = []; for (let i = 0; i < 16; i++) { const w = Math.round(8 + i * 0.6); parts.push([X + 12 - w + 4, Y + 15 + i, w * 2, 1, '#c8583e']); } shape(g, parts);
    for (let r = 0; r < 5; r++) R(g, '#a83a30', X + 4, Y + 17 + r * 3, 24, 1);
    shape(g, [[X + 11, Y + 21, 10, 10, OUT]]); R(g, '#f79a3a', X + 12, Y + 24, 8, 7);
    shape(g, [[X + 1, Y + 26, 6, 4, '#3e3852']]); R(g, '#6a6480', X + 2, Y + 26, 4, 1);
  },
  slevarna(g, X, Y, b, S) {
    shape(g, [[X + 4, Y - 4, 5, 16, '#6a6480']]); R(g, '#3e3852', X + 4, Y - 4, 5, 1);
    shape(g, [[X + 2, Y + 12, 28, 19, '#8a8590']]); for (let i = 0; i < 7; i++) R(g, '#6a6480', X + 3 + i * 4, Y + 12, 1, 19);
    hipRoof(g, X, Y + 3, 32, 10, '#3e3852', '#5d6480', '#2b2a38', S === 3, 1.4);
    shape(g, [[X + 16, Y + 19, 10, 12, OUT]]); R(g, '#ffd23f', X + 17, Y + 26, 8, 5);
    shape(g, [[X + 4, Y + 22, 8, 6, '#c4cad8']]); R(g, '#f79a3a', X + 5, Y + 23, 6, 2);
  },
  kovarna(g, X, Y, b, S) {
    shape(g, [[X + 22, Y - 2, 5, 12, '#9aa0b4']]);
    shape(g, [[X + 3, Y + 13, 26, 18, '#b8a898']]); for (let r = 0; r < 5; r++) for (let c = 0; c < 6; c++) R(g, '#9a8878', X + 3 + c * 5 + (r % 2 ? 2 : 0), Y + 14 + r * 3, 1, 2);
    hipRoof(g, X, Y + 3, 32, 11, '#5c3a26', '#8a5230', '#3e2618', S === 3);
    shape(g, [[X + 5, Y + 20, 10, 11, OUT]]); R(g, '#f79a3a', X + 6, Y + 24, 8, 7);
    shape(g, [[X + 19, Y + 24, 8, 3, '#5d6480'], [X + 21, Y + 27, 4, 4, '#5d6480']]); R(g, '#9aa0b4', X + 19, Y + 24, 8, 1);
  },
  rybarna(g, X, Y, b, S) {
    shape(g, [[X + 2, Y + 8, 18, 16, '#6ab4f0']]); R(g, '#a8d4f8', X + 3, Y + 9, 16, 1);
    for (let i = 0; i < 4; i++) R(g, '#3a74c8', X + 4, Y + 11 + i * 3, 14, 1);
    hipRoof(g, X, Y, 22, 9, '#e8484e', '#ff8a8a', '#a82e44', S === 3, 1.1);
    R(g, OUT, X + 9, Y + 16, 4, 8);
    shape(g, [[X + 1, Y + 26, 30, 4, '#b8743e']]); for (let i = 0; i < 5; i++) R(g, '#935730', X + 3 + i * 6, Y + 26, 1, 4);
    shape(g, [[X + 24, Y + 12, 6, 14, '#d8955a']]); R(g, '#fff3dc', X + 25, Y + 13, 4, 1);
  },
  majak(g, X, Y, b, S, night) {
    shape(g, [[X + 4, Y - 10, 8, 25, '#fff3dc']]); R(g, '#e8484e', X + 4, Y - 5, 8, 4); R(g, '#e8484e', X + 4, Y + 4, 8, 4); R(g, '#e0d0c0', X + 10, Y - 10, 2, 25);
    shape(g, [[X + 3, Y - 17, 10, 7, OUT]]); R(g, night ? '#fff4b0' : '#ffd23f', X + 4, Y - 16, 8, 5);
    shape(g, [[X + 3, Y - 20, 10, 2, '#5d6480'], [X + 6, Y - 22, 4, 2, '#5d6480']]); R(g, OUT, X + 7, Y + 10, 2, 5);
  },
  pristav(g, X, Y, b, S) {
    shape(g, [[X + 1, Y + 1, 46, 46, '#b8743e']]);
    for (let i = 0; i < 12; i++) R(g, i % 2 ? '#a8693e' : '#c47a3a', X + 1, Y + 2 + i * 4, 46, 3);
    shape(g, [[X + 4, Y + 4, 18, 14, '#e8c9a0']]); hipRoof(g, X + 2, Y - 4, 22, 8, '#3a74c8', '#6ab4f0', '#2a5a9a', S === 3, 1.1); R(g, OUT, X + 11, Y + 10, 4, 8);
    shape(g, [[X + 34, Y + 6, 2, 26, '#5d6480'], [X + 26, Y + 6, 12, 2, '#5d6480']]); R(g, OUT, X + 27, Y + 8, 1, 10); shape(g, [[X + 25, Y + 18, 5, 4, '#a8693e']]);
    for (let i = 0; i < 3; i++) shape(g, [[X + 6 + i * 7, Y + 30, 6, 6, i % 2 ? '#c47a3a' : '#f6e3c0']]);
    for (const [a, c] of [[2, 44], [44, 44], [44, 2]]) shape(g, [[X + a, Y + c, 2, 3, '#6b4128']]);
  }
});
Object.assign(ANIM, {
  tavirna(g, X, Y, b, t) { R(g, b.working ? (Math.floor(t * 8) % 2 ? '#ffd23f' : '#fff4b0') : '#cc5f22', X + 14, Y + 26, 4, 3); },
  slevarna(g, X, Y, b, t) { if (b.working) R(g, Math.floor(t * 7) % 2 ? '#fff4b0' : '#f79a3a', X + 19, Y + 27, 4, 3); },
  kovarna(g, X, Y, b, t) { if (b.working) { R(g, Math.floor(t * 8) % 2 ? '#ffd23f' : '#fff4b0', X + 8, Y + 26, 4, 3); if (Math.floor(t * 4) % 2) addPart(X + 23, Y + 23, rand(-10, 10), rand(-25, -10), '#ffd23f', 0.3, { g: 100 }); } },
  rybarna(g, X, Y, b, t, S) {
    const bx = Math.round(X + 34 + Math.sin(t * 0.4) * 8), by = Y + 36 + Math.round(Math.sin(t * 1.3));
    shape(g, [[bx, by, 10, 3, '#8a5230']]); R(g, '#fff3dc', bx + 4, by - 6, 1, 6); shape(g, [[bx + 5, by - 6, 4, 4, '#fff3dc']]);
  },
  majak(g, X, Y, b, t, S, night) {
    if (!night) return;
    const a = t * 1.2, dx = Math.cos(a), len = 26;
    g.globalAlpha = 0.25; for (let i = 3; i < len; i++) R(g, '#fff4b0', Math.round(X + 8 + dx * i), Math.round(Y - 14 + Math.sin(a) * i * 0.3), 2, 2); g.globalAlpha = 1;
  },
  dul(g, X, Y, b, t) { if (b.working && Math.floor(t * 2) % 2) R(g, '#ffd23f', X + 15, Y + 20, 2, 2); }
});
Object.assign(LIT, { majak: 1 });
for (const [k, v] of [['tavirna', 7], ['slevarna', 5], ['kovarna', 3], ['majak', 24], ['dul', 0], ['pristav', 5]]) if (B[k]) B[k].top = v;
