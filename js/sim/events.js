'use strict';
/* ============ 3.3: holidays — egg hunt, pumpkin night ghosts, cat Christmas ============ */
const HUNT_KINDS = {
  vejce: { n: 'Velikonoční hledání vajíček', season: 0, day: 2, count: 8, night: false, msg: 'Babička Ježková schovala po osadě 8 malovaných vajíček. Najdi je!' },
  duch: { n: 'Dýňová noc', season: 2, day: 3, count: 7, night: true, msg: 'V noci se po osadě toulají hodná strašidýlka. Klikni na ně — dají ti bonbón!' }
};
const EGG_COLS = [['#ff9ec0', '#e0608e'], ['#6ab4f0', '#3a74c8'], ['#ffd23f', '#e8962a'], ['#8fe0c8', '#3a9a78'], ['#b89ae8', '#8a6ac8']];
const EGG_SPR = EGG_COLS.map(([a, b]) => buildSprite(['.aa.', 'abba', 'aaaa', 'bwwb', '.aa.'], Object.assign({}, PAL, { a, b }), OUT));
const GHOST_SPR = buildSprite(['.www.', 'wwwww', 'wdwdw', 'wwwww', 'wwwww', 'w.w.w'], PAL, OUT);
MORNING_HOOKS.push(() => {
  const S = seasonIdx(), d = dayInSeason();
  G.hunt = null;
  for (const k in HUNT_KINDS) {
    const H = HUNT_KINDS[k]; if (H.season !== S || H.day !== d) continue;
    const E = [], bb = G.bb;
    for (let tries = 0; tries < 400 && E.length < H.count; tries++) {
      const x = randi(bb.x0, bb.x1), y = randi(bb.y0, bb.y1);
      if (!walkable(x, y) || !reachAt(x, y) || E.some(e => Math.abs(e.x - x) + Math.abs(e.y - y) < 4)) continue;
      E.push({ x, y, got: false, c: randi(0, EGG_COLS.length - 1), ph: Math.random() * 6 });
    }
    G.hunt = { kind: k, items: E, found: 0, day: dayIdx() };
    banner(H.n + '!', H.msg);
  }
  if (S === 3 && d === 3) catChristmas();
});
function huntActive() { const h = G.hunt; if (!h || h.day !== dayIdx()) return false; return !HUNT_KINDS[h.kind].night || darkness() > 0.3; }
ENT_HOOKS.push((E, t) => {
  if (!huntActive()) return;
  const h = G.hunt;
  for (const it of h.items) {
    if (it.got) continue;
    const px = it.x * TS + 8, py = it.y * TS + 12;
    if (px < VX - 16 || px > VX + VW + 16 || py < VY - 16 || py > VY + VH + 16) continue;
    if (h.kind === 'vejce') E.push([py, 9, 0, 0, g => { const s = EGG_SPR[it.c]; g.drawImage(s.c, px - 3, py - s.h + Math.round(Math.sin(t * 2 + it.ph) * 0.6)); if (Math.floor(t * 2 + it.ph) % 5 === 0) R(g, '#ffffff', px + 2, py - 7, 1, 1); }]);
    else E.push([py + 40, 9, 0, 0, g => { const bob = Math.round(Math.sin(t * 2.2 + it.ph) * 3); g.globalAlpha = 0.85; g.drawImage(GHOST_SPR.c, px - 3 + Math.round(Math.sin(t * 0.7 + it.ph) * 6), py - 16 + bob); g.globalAlpha = 1; }]);
  }
});
const _wildClickH = wildClick;
wildClick = function (px, py) {
  if (huntActive()) {
    const h = G.hunt;
    for (const it of h.items) {
      if (it.got) continue;
      const ex = it.x * TS + 8 + (h.kind === 'duch' ? Math.round(Math.sin(performance.now() / 1000 * 0.7 + it.ph) * 6) : 0), ey = it.y * TS + (h.kind === 'duch' ? -6 : 9);
      if (Math.abs(px - ex) <= 8 && Math.abs(py - ey) <= 9) {
        it.got = true; h.found++;
        const n = randi(20, 50) * (1 + eraOf() * 0.5) | 0; G.coins += n; G.stats.earned += n;
        sparkle(px, py, h.kind === 'vejce' ? EGG_COLS[it.c][0] : '#ffffff', 12, 5); Sound.coin();
        toast(`${h.kind === 'vejce' ? 'Vajíčko' : 'Bonbón od strašidýlka'} ${h.found}/${h.items.length} (+${n} mincí)`);
        if (h.found === h.items.length) {
          addStars(2, 'za nalezení všech');
          const hat = h.kind === 'vejce' ? 'usi' : 'dyne_hat'; if (!G.hats) G.hats = {}; G.hats[hat] = (G.hats[hat] || 0) + 1;
          banner(h.kind === 'vejce' ? 'Všechna vajíčka nalezena!' : 'Všechna strašidýlka obdarována!', `+2 ★ a klobouček ${HATS[hat].n} (nasadíš ho v detailu kočky).`);
          G.stats.hunts = (G.stats.hunts || 0) + 1;
        }
        UI.dirty = true; return true;
      }
    }
  }
  return _wildClickH(px, py);
};
Object.assign(HATS, {
  usi: { n: 'Zaječí ouška', rows: ['w...w', 'wp.pw', 'wp.pw', 'wwwww'], price: 0, event: 1 },
  dyne_hat: { n: 'Dýňová čepička', rows: ['..g..', '.nnn.', 'nNnNn', 'nnnnn'], price: 0, event: 1 },
  vanocni_cepice: { n: 'Vánoční čepice', rows: ['....w', '..rr.', '.rrr.', 'rrrrr', 'wwwww'], price: 0, event: 1 }
});
for (const k of ['usi', 'dyne_hat', 'vanocni_cepice']) HATS[k].spr = buildSprite(HATS[k].rows, PAL, OUT);
/* event hats can't be bought, only won */
const _hatbuyE = ACTIONS.hatbuy;
ACTIONS.hatbuy = k => { if (HATS[k] && HATS[k].event) { toast('Tenhle klobouček se dá jen vyhrát na svátcích.'); return; } _hatbuyE(k); };
const _helpTabE = EXTRA_TABS.help;
EXTRA_TABS.help = () => { let h = _helpTabE(); if (helpPage === 'hats') h = h.replace(/<button class="tog buy" data-act="hatbuy" data-arg="(usi|dyne_hat|vanocni_cepice)">[^<]*<\/button>/g, '<small>jen ze svátků</small>'); return h; };

/* ---------- cat Christmas (winter, day 3) ---------- */
Object.assign(B, {
  snezna_koule: { n: 'Sněžítko', cat: 'ozdoby', w: 1, h: 1, cost: 0, instant: 1, cozy: 6, flag: 'r_snezitko', nodoor: 1, desc: 'Obří sněžítko s kočičí osadou uvnitř. Dárek z Kočičích Vánoc. +6 útulnost.' }
});
DRAW.snezna_koule = (g, X, Y) => { shape(g, [[X + 3, Y + 12, 10, 3, '#8a5230']]); odisc(g, X + 8, Y + 7, 5, '#c8e8ff'); R(g, '#e0608e', X + 6, Y + 8, 4, 3); R(g, '#a83a64', X + 6, Y + 7, 4, 1); R(g, '#ffffff', X + 5, Y + 4, 1, 1); R(g, '#ffffff', X + 10, Y + 5, 1, 1); R(g, '#ffffff', X + 8, Y + 3, 1, 1); };
ANIM.snezna_koule = (g, X, Y, b, t) => { for (let k = 0; k < 3; k++) R(g, '#ffffff', Math.round(X + 5 + ((t * 2 + k * 2.3) % 6)), Math.round(Y + 3 + ((t * 3 + k * 1.7) % 7)), 1, 1); };
B.snezna_koule.top = 1;
function catChristmas() {
  for (const c of G.cats) { c.mood = Math.min(100, c.mood + 20); emote(c, 'heart', 5); }
  const gift = 80 * G.cats.length; G.coins += gift; G.stats.earned += gift;
  const lucky = pick(G.cats); if (!G.hats) G.hats = {}; G.hats.vanocni_cepice = (G.hats.vanocni_cepice || 0) + 1;
  const first = !G.flags.r_snezitko; G.flags.r_snezitko = true;
  banner('Veselé Kočičí Vánoce!', `Každá kočka dostala dárek. Osada dostala ${gift} mincí a Vánoční čepici${first ? ' a Sněžítko (Stavět → Ozdoby)' : ''}. ${lucky ? lucky.name + ' si nejvíc přeje rybičku.' : ''}`);
  G.stats.christmas = (G.stats.christmas || 0) + 1;
}
const _lockReasonE = lockReason;
lockReason = function (t) { if (t === 'snezna_koule' && !G.flags.r_snezitko) return 'Dárek z Kočičích Vánoc'; return _lockReasonE(t); };

ACH.push(['vajicka', 'Lovec vajíček', () => (G.stats.hunts || 0) >= 1], ['vanoce', 'Kočičí Vánoce', () => (G.stats.christmas || 0) >= 1]);
{ const p = HELP.find(x => x.id === 'sezony'); if (p) p.t += `<p><b>Svátky:</b> 2. jarní den je <b>hledání vajíček</b>, 3. podzimní noc <b>Dýňová noc</b> se strašidýlky (klikni na ně) a 3. zimní den <b>Kočičí Vánoce</b> s dárky. Za nalezení všeho dostaneš hvězdičky a vzácný klobouček.</p>`; }
