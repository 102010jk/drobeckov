'use strict';
/* ============ era 1 art: items ============ */
addSprites({
  prkna: ['tttttttt', 'aAaaaaAa', 'tttttttt', 'aaAaaAaa', 'tttttttt', 'aAaaAaaa'],
  kamen: ['..sss...', '.sSsss..', 'sssSsss.', 'sSsssSss', 'SsssssSS', '.SSSSSS.'],
  hlina: ['...AA...', '.AaaaA..', 'AaaAaaA.', 'aaaaaAaA', 'AAaaAAAA', '.AAAAAA.'],
  cihly: ['eeee.eee', 'rRrR.rRr', '........', 'ee.eeee.', 'rR.rRrR.', '........', 'eeee.eee', 'rRrR.rRr'],
  papir: ['wwwwww.', 'wkkkkwW', 'wwwwwwW', 'wkkkwwW', 'wwwwwwW', 'wkkkkwW', 'wwwwwwW', '.WWWWWW'],
  pisek: ['...cc...', '..cccc..', '.ccCccc.', 'ccccCccc', 'cCccccCC', '.CCCCCC.'],
  sklo: ['.WWWW.', 'WwuuwW', 'WuwuuW', 'WuuwuW', 'WuuuwW', 'WwuuuW', '.WWWW.'],
  vlna: ['..wwww..', '.wWwwWw.', 'wwwWWwww', 'wWwwwwWw', 'wwWwwWww', '.wwWWww.', '..wwww..'],
  latka: ['vvvvvvv', 'vVvvvVv', 'vvvVvvv', 'vVvvvVv', 'vvvVvvv', 'VVVVVVV'],
  polstar: ['v.......v', '.vvvvvvv.', 'vvwvvvvvv', 'vwvvvvvvV', 'vvvvvvvvV', '.vvvvvVV.', 'v.VVVVV.v'],
  kakao: ['..BB..', '.BbbB.', 'BbbbbB', 'BbhbbB', 'BbbbbB', '.BbbB.', '..BB..'],
  koreni: ['..rr..', '.rRRr.', '.yyyy.', 'yyYYyy', 'yYyyYy', 'yyyyyy', '.YYYY.'],
  cokoladovy_dort: ['...r....', '..rhr...', '.BBBBBB.', 'BbBBbBBB', 'cccccccC', 'BBBBBBBB', 'cccccccC', '.CCCCCC.'],
  koreneny_pernik: ['...jjj...', '..jjjjj..', '..jrjrj..', '...jjj...', 'rjjjjjjjr', '.jjjrjjj.', '...jrj...', '..jjjjj..', '.jjj.jjj.', '.rr...rr.']
});

/* ============ era 1 art: buildings ============ */
Object.assign(DRAW, {
  pila(g, X, Y, b, S) {
    shape(g, [[X + 3, Y + 14, 26, 17, '#c47a3a']]);
    for (let i = 0; i < 6; i++) R(g, '#a8693e', X + 5 + i * 4, Y + 14, 1, 17);
    hipRoof(g, X, Y + 4, 32, 11, '#8a5230', '#a8683c', '#5c341e', S === 3, 1.2);
    door(g, X + 13, Y + 22, 6, 9);
    shape(g, [[X + 1, Y + 26, 10, 4, '#d8955a']]); R(g, '#a86a34', X + 1, Y + 27, 10, 1); odisc(g, X + 2, Y + 28, 1, '#e8b27a');
    odisc(g, X + 25, Y + 22, 4, '#c4cad8'); R(g, '#5d6480', X + 25, Y + 22, 1, 1);
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; R(g, '#9aa0b4', Math.round(X + 25 + Math.cos(a) * 5), Math.round(Y + 22 + Math.sin(a) * 5), 1, 1); }
  },
  lom(g, X, Y, b, S) {
    shape(g, [[X + 1, Y + 16, 30, 15, '#9a9488']]); R(g, '#857f74', X + 1, Y + 24, 30, 2);
    shape(g, [[X + 4, Y + 10, 10, 8, '#bdb7aa'], [X + 18, Y + 12, 11, 6, '#a39d90']]);
    R(g, '#d0cabd', X + 5, Y + 11, 5, 2); R(g, '#857f74', X + 20, Y + 15, 6, 1);
    shape(g, [[X + 22, Y - 4, 2, 20, '#8a5230'], [X + 12, Y - 4, 12, 2, '#8a5230']]);
    R(g, '#5d6480', X + 13, Y - 2, 1, 8); shape(g, [[X + 11, Y + 6, 4, 3, '#9aa0b4']]);
    for (let i = 0; i < 4; i++) shape(g, [[X + 4 + i * 6, Y + 26, 4, 3, i % 2 ? '#c4cad8' : '#a8a094']]);
    if (S === 3) { R(g, '#ffffff', X + 4, Y + 10, 10, 1); R(g, '#ffffff', X + 18, Y + 12, 11, 1); }
  },
  hliniste(g, X, Y, b, S) {
    shape(g, [[X + 2, Y + 10, 28, 20, '#8a5a2a']]); R(g, '#6e4524', X + 4, Y + 14, 24, 12);
    R(g, '#a8683c', X + 6, Y + 16, 8, 4); R(g, '#c48850', X + 16, Y + 19, 9, 3);
    shape(g, [[X + 24, Y + 2, 2, 12, '#8a5230']]); shape(g, [[X + 22, Y + 12, 6, 3, '#9aa0b4']]);
    shape(g, [[X + 3, Y + 24, 8, 5, '#a8693e']]); R(g, '#c48850', X + 4, Y + 24, 6, 2); odisc(g, X + 4, Y + 30, 1, '#5d6480'); odisc(g, X + 10, Y + 30, 1, '#5d6480');
  },
  piskovna(g, X, Y, b, S) {
    shape(g, [[X + 2, Y + 12, 28, 18, '#ecd9a4']]); R(g, '#d4bc80', X + 4, Y + 20, 24, 1);
    const parts = []; for (let i = 0; i < 6; i++) parts.push([X + 12 - i * 2, Y + 6 + i, 4 + i * 4, 1, '#f6ead0']); shape(g, parts);
    shape(g, [[X + 20, Y + 16, 9, 7, '#a8693e']]); for (let i = 0; i < 4; i++) R(g, '#6b4128', X + 21 + i * 2, Y + 17, 1, 5);
    shape(g, [[X + 4, Y + 24, 3, 6, '#8a5230']]); R(g, '#9aa0b4', X + 3, Y + 22, 5, 2);
  },
  cihelna(g, X, Y, b, S) {
    shape(g, [[X + 24, Y - 4, 5, 18, '#a8423a']]); for (let i = 0; i < 6; i++) R(g, '#7a2e2a', X + 24, Y - 2 + i * 3, 5, 1);
    shape(g, [[X + 2, Y + 12, 28, 19, '#c8583e']]);
    for (let r = 0; r < 6; r++) for (let c = 0; c < 7; c++) R(g, '#a83a30', X + 2 + c * 4 + (r % 2 ? 2 : 0), Y + 13 + r * 3, 1, 2);
    for (let r = 0; r < 6; r++) R(g, '#e8a078', X + 2, Y + 15 + r * 3, 28, 1);
    shape(g, [[X + 1, Y + 9, 30, 3, '#5c3a26']]); if (S === 3) R(g, '#ffffff', X + 1, Y + 9, 30, 1);
    shape(g, [[X + 11, Y + 20, 10, 11, OUT]]); R(g, '#f79a3a', X + 12, Y + 25, 8, 6); R(g, '#ffd23f', X + 14, Y + 27, 4, 4);
    for (let i = 0; i < 3; i++) shape(g, [[X + 3 + i * 3, Y + 27, 2, 4, '#c8583e']]);
  },
  papirna(g, X, Y, b, S, night) {
    shape(g, [[X + 3, Y + 13, 26, 18, '#e8dcc8']]); R(g, '#c9b89c', X + 26, Y + 13, 3, 18);
    hipRoof(g, X, Y + 3, 32, 11, '#5d6480', '#8a92aa', '#3e3852', S === 3);
    door(g, X + 13, Y + 21, 6, 10);
    R(g, '#8a5230', X + 3, Y + 16, 9, 1); R(g, '#8a5230', X + 20, Y + 16, 9, 1);
    for (let i = 0; i < 3; i++) { shape(g, [[X + 4 + i * 3, Y + 17, 2, 4, '#ffffff']]); shape(g, [[X + 21 + i * 3, Y + 17, 2, 4, '#fff3dc']]); }
    odisc(g, X + 6, Y + 27, 3, '#8a5230'); R(g, '#6ab4f0', X + 5, Y + 26, 3, 3);
  },
  sklarna(g, X, Y, b, S) {
    shape(g, [[X + 6, Y - 3, 4, 10, '#9aa0b4']]);
    shape(g, [[X + 2, Y + 12, 28, 19, '#c4cad8']]); R(g, '#9aa0b4', X + 2, Y + 20, 28, 1);
    const parts = []; for (let i = 0; i < 10; i++) { const w = Math.round(Math.sqrt(1 - Math.pow((i - 9) / 10, 2)) * 15); parts.push([X + 16 - w, Y + 3 + i, w * 2, 1, '#8a92aa']); } shape(g, parts);
    if (S === 3) R(g, '#ffffff', X + 9, Y + 3, 14, 2);
    shape(g, [[X + 18, Y + 18, 9, 9, OUT]]); R(g, '#6ab4f0', X + 19, Y + 21, 7, 6); R(g, '#bfe4f4', X + 21, Y + 23, 3, 2);
    door(g, X + 6, Y + 21, 6, 10);
    shape(g, [[X + 14, Y + 26, 2, 3, '#8fe0c8'], [X + 11, Y + 27, 2, 2, '#bfe4f4']]);
  },
  ovcin(g, X, Y, b, S) {
    shape(g, [[X + 14, Y + 6, 16, 13, '#e8c9a0']]); hipRoof(g, X + 12, Y + 1, 20, 7, '#a8423a', '#c85a48', '#7a2e2a', S === 3);
    R(g, OUT, X + 20, Y + 12, 4, 7);
    R(g, '#d8955a', X + 1, Y + 18, 30, 1); R(g, '#d8955a', X + 1, Y + 24, 30, 1);
    for (let i = 0; i < 6; i++) shape(g, [[X + 1 + i * 6, Y + 16, 1, 14, '#e8b27a']]);
    R(g, '#ffd23f', X + 4, Y + 28, 4, 2);
  },
  tkalcovna(g, X, Y, b, S, night) {
    shape(g, [[X + 3, Y + 14, 26, 17, '#f4d8e8']]); R(g, '#e0b8cc', X + 26, Y + 14, 3, 17);
    hipRoof(g, X, Y + 3, 32, 12, '#8a6ac8', '#b89ae8', '#5d4a90', S === 3);
    door(g, X + 14, Y + 21, 6, 10);
    winGlass(g, X + 5, Y + 18, 6, 5, night, true);
    shape(g, [[X + 22, Y + 19, 6, 6, '#b89ae8']]); for (let i = 0; i < 3; i++) R(g, '#fff3dc', X + 22, Y + 20 + i * 2, 6, 1);
    R(g, '#ff9ec0', X + 23, Y + 26, 4, 3);
  },
  sklad(g, X, Y, b, S) {
    shape(g, [[X + 2, Y + 10, 44, 21, '#b8743e']]);
    for (let i = 0; i < 10; i++) R(g, '#935730', X + 5 + i * 4, Y + 10, 1, 21);
    hipRoof(g, X, Y, 48, 11, '#7a4628', '#a8683c', '#5c341e', S === 3, 1.6);
    shape(g, [[X + 17, Y + 16, 14, 15, '#6b4128']]); R(g, '#8a5230', X + 18, Y + 17, 12, 14); R(g, '#6b4128', X + 23, Y + 17, 2, 14);
    for (let i = 0; i < 12; i++) { R(g, '#6b4128', X + 18 + i, Y + 17 + i, 1, 1); R(g, '#6b4128', X + 29 - i, Y + 17 + i, 1, 1); }
    shape(g, [[X + 3, Y + 22, 7, 8, '#c47a3a'], [X + 38, Y + 23, 7, 7, '#f6e3c0']]);
    g.drawImage(SPR.box.c, X + 36, Y + 14);
  },
  kolarna(g, X, Y, b, S) {
    shape(g, [[X + 3, Y + 14, 26, 17, '#d8b078']]); for (let i = 0; i < 6; i++) R(g, '#c49a60', X + 3, Y + 16 + i * 3, 26, 1);
    hipRoof(g, X, Y + 4, 32, 11, '#6b4128', '#8a5230', '#3e2618', S === 3);
    door(g, X + 7, Y + 21, 7, 10);
    odisc(g, X + 23, Y + 25, 5, '#a8693e'); odisc(g, X + 23, Y + 25, 3, '#d8b078'); R(g, '#6b4128', X + 23, Y + 20, 1, 11); R(g, '#6b4128', X + 18, Y + 25, 11, 1); odisc(g, X + 23, Y + 25, 1, '#6b4128');
  },
  namesti(g, X, Y, b, S) {
    shape(g, [[X + 1, Y + 1, 46, 46, S === 3 ? '#e4e8f0' : '#b8b0a4']]);
    for (let j = 0; j < 11; j++) for (let i = 0; i < 11; i++) R(g, S === 3 ? '#f4f6fa' : (i + j) % 2 ? '#a8a094' : '#c4bcb0', X + 2 + i * 4 + (j % 2 ? 2 : 0), Y + 2 + j * 4, 3, 3);
    odisc(g, X + 24, Y + 24, 7, '#c4cad8'); odisc(g, X + 24, Y + 24, 5, S === 3 ? '#c8e4f8' : '#6ab4f0'); shape(g, [[X + 23, Y + 18, 2, 6, '#c4cad8']]);
    for (const [a, c] of [[4, 4], [38, 4], [4, 38], [38, 38]]) { shape(g, [[X + a + 2, Y + c - 6, 2, 10, '#5d6480']]); shape(g, [[X + a + 1, Y + c - 9, 4, 4, OUT]]); R(g, '#ffd23f', X + a + 2, Y + c - 8, 2, 2); }
    shape(g, [[X + 6, Y + 14, 10, 3, '#ff6f9c'], [X + 32, Y + 14, 10, 3, '#6ab4f0']]); R(g, '#fff3dc', X + 8, Y + 14, 2, 3); R(g, '#fff3dc', X + 12, Y + 14, 2, 3); R(g, '#fff3dc', X + 34, Y + 14, 2, 3); R(g, '#fff3dc', X + 38, Y + 14, 2, 3);
  },
  altan(g, X, Y, b, S) {
    shape(g, [[X + 2, Y + 26, 28, 4, '#d8955a']]);
    for (const a of [4, 14, 25]) shape(g, [[X + a, Y + 12, 2, 14, '#fff3dc']]);
    const parts = []; for (let i = 0; i < 9; i++) parts.push([X + 16 - (i * 2 + 2), Y + 3 + i, (i * 2 + 2) * 2, 1, '#7ad0a0']); shape(g, parts);
    R(g, '#3a9a78', X + 0, Y + 11, 32, 1); R(g, '#ffd23f', X + 15, Y + 1, 2, 2);
    if (S === 3) for (let i = 0; i < 4; i++) R(g, '#ffffff', X + 12 - i * 2, Y + 4 + i, 8 + i * 4, 1);
    R(g, '#b8743e', X + 8, Y + 21, 16, 2);
  },
  zahon_ruzi(g, X, Y, b, S) {
    odisc(g, X + 8, Y + 10, 5, S === 3 ? '#e8eef8' : '#3a8a44'); R(g, S === 3 ? '#ffffff' : '#72c850', X + 5, Y + 7, 4, 2);
    if (S !== 3) for (const [a, c] of [[5, 9], [10, 7], [9, 12], [12, 10]]) { R(g, '#e8484e', X + a, Y + c, 2, 2); R(g, '#ff9ec0', X + a, Y + c, 1, 1); }
  },
  lampiony(g, X, Y, b, S, night) {
    shape(g, [[X + 1, Y - 2, 2, 16, '#6b4128'], [X + 13, Y - 2, 2, 16, '#6b4128']]);
    for (let i = 0; i < 12; i++) R(g, OUT, X + 2 + i, Y - 1 + Math.round(Math.sin(i / 11 * Math.PI) * 3), 1, 1);
    [['#e8484e', 4], ['#ffd23f', 8], ['#6ab4f0', 12]].forEach(([c, a]) => { shape(g, [[X + a - 1, Y + 2 + Math.round(Math.sin((a - 2) / 11 * Math.PI) * 3), 3, 3, night ? '#fff4b0' : c]]); });
  },
  kasna(g, X, Y, b, S) {
    odisc(g, X + 8, Y + 11, 6, '#c4cad8'); odisc(g, X + 8, Y + 11, 4, S === 3 ? '#c8e4f8' : '#6ab4f0');
    shape(g, [[X + 7, Y + 2, 2, 8, '#c4cad8']]); odisc(g, X + 8, Y + 2, 1, '#9aa0b4');
  },
  kocici_strom(g, X, Y, b, S) {
    shape(g, [[X + 13, Y + 8, 6, 23, '#8a5230']]); R(g, '#a8693e', X + 14, Y + 8, 2, 23);
    const c = S === 3 ? ['#e8eef8', '#ffffff'] : S === 2 ? ['#d65a31', '#f6a55a'] : ['#3a8a40', '#5aaa52'];
    odisc(g, X + 16, Y + 2, 12, c[0]); g.fillStyle = c[1]; disc(g, X + 13, Y - 1, 7);
    shape(g, [[X + 4, Y + 16, 10, 2, '#b89ae8'], [X + 19, Y + 11, 10, 2, '#b89ae8']]);
    g.drawImage(STATUE.c, X + 20, Y + 1);
  },
  houpacka(g, X, Y, b, S) {
    shape(g, [[X + 1, Y + 1, 2, 14, '#8a5230'], [X + 13, Y + 1, 2, 14, '#8a5230'], [X + 1, Y, 14, 2, '#a8693e']]);
    R(g, OUT, X + 5, Y + 2, 1, 8); R(g, OUT, X + 10, Y + 2, 1, 8); shape(g, [[X + 4, Y + 10, 8, 2, '#ff6f9c']]);
  },
  mlyncek(g, X, Y, b, S) {
    shape(g, [[X + 7, Y + 3, 2, 12, '#fff3dc']]); shape(g, [[X + 5, Y + 13, 6, 2, '#8a5230']]);
  }
});
Object.assign(ANIM, {
  ovcin(g, X, Y, b, t) {
    for (let i = 0; i < 3; i++) {
      const sx = Math.round(X + 5 + i * 8 + Math.sin(t * 0.6 + i * 2) * 3), sy = Y + 22 + (i % 2) * 4;
      shape(g, [[sx, sy, 6, 4, '#f6f1ec']]); R(g, '#2b2a38', sx + (Math.sin(t * 0.6 + i * 2) > 0 ? 5 : -1), sy, 2, 2); R(g, '#e0d6ce', sx + 1, sy + 3, 4, 1);
    }
  },
  sklarna(g, X, Y, b, t) { if (b.working) R(g, Math.floor(t * 6) % 2 ? '#ffd23f' : '#f79a3a', X + 21, Y + 23, 3, 2); },
  cihelna(g, X, Y, b, t) { if (b.working) R(g, Math.floor(t * 8) % 2 ? '#fff4b0' : '#ffd23f', X + 14, Y + 27, 4, 3); },
  lom(g, X, Y, b, t) { if (b.working) { const k = Math.floor(t * 3) % 2; R(g, '#9aa0b4', X + 11, Y + 6 + k * 3, 4, 3); } },
  mlyncek(g, X, Y, b, t) {
    const a0 = t * 4, cols = ['#ff6f9c', '#ffd23f', '#6ab4f0', '#7bd6b0'];
    for (let k = 0; k < 4; k++) { const a = a0 + k * Math.PI / 2; for (let r = 1; r < 5; r++) R(g, cols[k], Math.round(X + 8 + Math.cos(a) * r), Math.round(Y + 4 + Math.sin(a) * r), 1, 1); }
    R(g, OUT, X + 8, Y + 4, 1, 1);
  },
  kasna(g, X, Y, b, t, S) { if (S !== 3) for (let i = 0; i < 3; i++) { const ph = (t * 1.5 + i / 3) % 1; R(g, '#a8d4f8', Math.round(X + 8 + (i - 1) * ph * 5), Math.round(Y + 2 - Math.sin(ph * Math.PI) * 4 + ph * 8), 1, 1); } },
  houpacka(g, X, Y, b, t) { const s = Math.round(Math.sin(t * 2) * 2); R(g, '#ff6f9c', X + 4 + s, Y + 10, 8, 2); }
});
Object.assign(LIT, { papirna: 1, tkalcovna: 1, lampiony: 1 });
for (const [k, v] of [['lom', 5], ['cihelna', 5], ['sklarna', 4], ['sklad', 1], ['kocici_strom', 11], ['altan', 1]]) if (B[k]) B[k].top = v;
