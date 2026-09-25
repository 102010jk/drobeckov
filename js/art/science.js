'use strict';
/* ============ science & space art ============ */
addSprites({
  zapisnik: ['.GGGGG.', 'GcccccG', 'GckkkcG', 'GcccccG', 'GckkcgG', 'GcccccG', '.GGGGG.'],
  vykres: ['uuuuuuu', 'uwwwwwu', 'uwuuwwu', 'uwwuwwu', 'uwwwwuu', 'uuuuuuu'],
  elektro: ['.QQQQQ.', 'QqyqyqQ', 'QqqqqqQ', 'QyqnqyQ', 'QqqqqqQ', '.QQQQQ.'],
  hvezdna_mapa: ['xxxxxxx', 'xyxxxwx', 'xxxwxxx', 'xwxxxyx', 'xxxyxxx', 'xxxxxxx'],
  hlinik: ['.WWWWWW.', 'WwwwwwwS', 'WwwwwwSS', '.SSSSSS.'],
  dural: ['.sWsWsW.', 'WwsWsWsS', 'sWsWsWSS', '.SSSSSS.'],
  kremik: ['..xx..', '.xzzx.', 'xzwzzx', 'xzzzzx', '.xzzx.', '..xx..'],
  obvod: ['QQQQQQQ', 'QyqqqyQ', 'QqxxxqQ', 'QqxxxqQ', 'QyqqqyQ', 'QQQQQQQ'],
  cip: ['.k.k.k.', 'kxxxxxk', '.xzzzx.', 'kxzwzxk', '.xzzzx.', 'kxxxxxk', '.k.k.k.'],
  cocka: ['..WW..', '.WuuW.', 'WuwuuW', 'WuuuuW', '.WuuW.', '..WW..'],
  baterie: ['..kk..', '.yyyy.', '.yhyy.', '.yyyy.', '.kkkk.', '.kkkk.', '.KKKK.'],
  raketove_palivo: ['.kkkk.', 'kuuuuk', 'kuwuuk', 'kuuuuk', 'kuuuuk', '.kkkk.'],
  trupovy_panel: ['WWWWWW', 'WwssWS', 'WsssWS', 'WsssWS', 'SSSSSS'],
  raketovy_motor: ['..kk..', '.kkkk.', '.kWWk.', 'kkWWkk', 'kkkkkk', '.nnnn.', '..yy..'],
  palivova_nadrz: ['.WWWW.', 'WwssWS', 'WssrWS', 'WsrsWS', 'WssrWS', '.SSSS.'],
  navadeci_pocitac: ['kkkkkkk', 'kQQQQQk', 'kQwqqQk', 'kQQQQQk', 'kkkkkkk', '.kyyyk.'],
  kapsle: ['..WWW..', '.WuuuW.', 'WuwuuuW', 'WWWWWWW', 'WsssssW', '.SSSSS.'],
  bolt: ['...yy', '..yy.', '.yyyy', '..yy.', '.yy..', 'yy...']
});
function drawRocket(g, cx, by, stage, lift) {
  const y = by - lift;
  if (stage >= 1) { shape(g, [[cx - 6, y - 26, 12, 26, '#e4e8f0']]); R(g, '#c4cad8', cx + 3, y - 26, 3, 26); R(g, '#e8484e', cx - 6, y - 8, 12, 3); shape(g, [[cx - 10, y - 8, 4, 8, '#e8484e'], [cx + 6, y - 8, 4, 8, '#e8484e']]); }
  if (stage >= 2) { shape(g, [[cx - 5, y - 44, 10, 18, '#f6f1ec']]); R(g, '#c4cad8', cx + 2, y - 44, 3, 18); odisc(g, cx, y - 36, 2, '#6ab4f0'); R(g, '#ffffff', cx - 1, y - 37, 1, 1); }
  if (stage >= 3) { const parts = []; for (let i = 0; i < 9; i++) parts.push([cx - Math.round(i / 2) - 1, y - 54 + i, Math.round(i / 2) * 2 + 2, 1, '#e8484e']); shape(g, parts); }
}
Object.assign(DRAW, {
  skola(g, X, Y, b, S, night) {
    shape(g, [[X + 3, Y + 13, 26, 18, '#f4e4c8']]); R(g, '#d8c2a0', X + 26, Y + 13, 3, 18);
    hipRoof(g, X, Y + 2, 32, 12, '#3a74c8', '#6ab4f0', '#2a5a9a', S === 3);
    shape(g, [[X + 13, Y - 4, 6, 7, '#f4e4c8']]); R(g, '#ffd23f', X + 15, Y - 2, 2, 3); R(g, '#3a74c8', X + 12, Y - 5, 8, 2);
    door(g, X + 13, Y + 21, 6, 10); winGlass(g, X + 5, Y + 18, 6, 5, night, true); winGlass(g, X + 21, Y + 18, 6, 5, night, true);
  },
  laborator(g, X, Y, b, S, night) {
    shape(g, [[X + 2, Y + 12, 28, 19, '#e8eef8']]); R(g, '#c4cad8', X + 27, Y + 12, 3, 19);
    const parts = []; for (let i = 0; i < 9; i++) { const w = Math.round(Math.sqrt(1 - Math.pow((i - 8) / 9, 2)) * 11); parts.push([X + 16 - w, Y + 3 + i, w * 2, 1, '#8a92aa']); } shape(g, parts);
    R(g, OUT, X + 15, Y + 2, 2, 5); if (S === 3) R(g, '#ffffff', X + 10, Y + 4, 12, 2);
    door(g, X + 13, Y + 21, 6, 10); winGlass(g, X + 4, Y + 17, 7, 6, night, true);
    shape(g, [[X + 22, Y + 18, 3, 5, '#8fe0c8'], [X + 26, Y + 19, 2, 4, '#ff9ec0']]);
  },
  elektrarna(g, X, Y, b, S) {
    const parts = []; for (let i = 0; i < 22; i++) { const w = Math.round(6 + Math.abs(i - 9) * 0.35); parts.push([X + 9 - w, Y - 2 + i, w * 2, 1, '#c4cad8']); } shape(g, parts);
    R(g, '#9aa0b4', X + 3, Y + 6, 12, 2);
    shape(g, [[X + 22, Y - 8, 5, 22, '#8a8590']]); R(g, '#e8484e', X + 22, Y - 6, 5, 2);
    shape(g, [[X + 16, Y + 16, 15, 15, '#b85a48']]); winGlass(g, X + 19, Y + 20, 8, 5, false, false); R(g, OUT, X + 21, Y + 27, 5, 4);
    shape(g, [[X + 1, Y + 22, 13, 9, '#8a8590']]); R(g, '#ffd23f', X + 5, Y + 25, 4, 3); R(g, OUT, X + 6, Y + 25, 2, 1);
  },
  vetrnik(g, X, Y, b, S) { shape(g, [[X + 7, Y - 10, 2, 25, '#f6f1ec']]); shape(g, [[X + 5, Y + 13, 6, 2, '#9aa0b4']]); },
  dalekohled(g, X, Y, b, S) { shape(g, [[X + 5, Y + 10, 1, 5, '#6b4128'], [X + 10, Y + 10, 1, 5, '#6b4128']]); shape(g, [[X + 3, Y + 2, 11, 4, '#b8862a']]); R(g, '#e8c060', X + 3, Y + 2, 11, 1); R(g, '#6ab4f0', X + 13, Y + 3, 1, 2); },
  kovova_lampa(g, X, Y, b, S, night) { shape(g, [[X + 7, Y - 4, 2, 19, '#3e3852'], [X + 7, Y - 5, 6, 2, '#3e3852']]); shape(g, [[X + 10, Y - 4, 5, 4, OUT]]); R(g, night ? '#fff4b0' : '#ffd23f', X + 11, Y - 3, 3, 2); shape(g, [[X + 5, Y + 13, 6, 2, '#3e3852']]); },
  vez(g, X, Y, b, S) {
    shape(g, [[X + 13, Y - 18, 6, 48, '#8a8590']]); for (let i = 0; i < 8; i++) { R(g, '#6a6480', X + 13, Y - 16 + i * 6, 6, 1); R(g, OUT, X + 13 + (i % 2) * 5, Y - 16 + i * 6, 1, 6); }
    shape(g, [[X + 9, Y - 22, 14, 4, '#e8484e']]); shape(g, [[X + 4, Y + 24, 24, 7, '#b8743e']]); R(g, OUT, X + 14, Y + 26, 4, 5);
  },
  kosmodrom(g, X, Y, b, S) {
    shape(g, [[X + 1, Y + 1, 78, 78, S === 3 ? '#e4e8f0' : '#9a948a']]);
    for (let i = 0; i < 9; i++) { R(g, '#ffd23f', X + 2 + i * 9, Y + 2, 5, 2); R(g, '#ffd23f', X + 2 + i * 9, Y + 76, 5, 2); }
    odisc(g, X + 40, Y + 56, 16, '#6c6862'); odisc(g, X + 40, Y + 56, 12, '#8a8580'); R(g, '#ffd23f', X + 36, Y + 55, 8, 2);
    shape(g, [[X + 56, Y + 6, 4, 54, '#e8484e']]); for (let i = 0; i < 9; i++) R(g, '#fff3dc', X + 56, Y + 8 + i * 6, 4, 1);
    shape(g, [[X + 44, Y + 12, 12, 2, '#e8484e'], [X + 44, Y + 30, 12, 2, '#e8484e']]);
    shape(g, [[X + 6, Y + 8, 22, 16, '#e8eef8']]); winGlass(g, X + 9, Y + 12, 7, 5, false, false); winGlass(g, X + 18, Y + 12, 7, 5, false, false); R(g, OUT, X + 14, Y + 19, 6, 5);
  }
});
Object.assign(ANIM, {
  vetrnik(g, X, Y, b, t) { const a0 = t * 3; for (let k = 0; k < 3; k++) { const a = a0 + k * 2.094; for (let r = 1; r < 8; r++) R(g, r > 5 ? '#c4cad8' : '#fff3dc', Math.round(X + 8 + Math.cos(a) * r), Math.round(Y - 10 + Math.sin(a) * r), 1, 1); } R(g, OUT, X + 7, Y - 11, 2, 2); },
  kosmodrom(g, X, Y, b, t) {
    const st = b.stage || 0, launching = typeof LAUNCH !== 'undefined' && LAUNCH && LAUNCH.b === b.id;
    if (G.flags.launched && !launching) return;
    const lift = launching ? rocketLift(performance.now() / 1000 - LAUNCH.t0) : 0;
    if (!st && !launching) { R(g, '#c4cad8', X + 34, Y + 44, 12, 2); return; }
    if (lift > 0) { const cx = X + 40, fy = Y + 60 - lift; for (let i = 0; i < 4; i++) R(g, pick(['#ffd23f', '#f79a3a', '#ffffff']), cx - 3 + randi(0, 6), fy + i * 2, 2, 3); }
    drawRocket(g, X + 40, Y + 60, launching ? 3 : st, lift);
  },
  laborator(g, X, Y, b, t) { if (b.working && Math.floor(t * 3) % 2) R(g, '#ffffff', X + 23, Y + 16, 1, 1); },
  elektrarna(g, X, Y, b, t) { if ((b.inp.uhli || 0) && Math.random() < 0.3) addPart(X + 9 + rand(-3, 3), Y - 2, rand(-3, 3), -8, '#e8eef8', 1.4, { g: -4, sz: 2 }); }
});
Object.assign(LIT, { skola: 1, laborator: 1, kovova_lampa: 1 });
for (const [k, v] of [['skola', 6], ['laborator', 2], ['elektrarna', 9], ['vetrnik', 18], ['vez', 24], ['kosmodrom', 0]]) if (B[k]) B[k].top = v;
B.kovova_lampa.lightAt = [12, -2];
