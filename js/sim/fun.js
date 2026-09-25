'use strict';
/* ============ 3.6: fun — cat races with a bet, cat salon (fur colours) ============ */
const EYE_D = SKINS[0].eye;
SKINS.push(
  { name: 'růžová', f: '#ffb4cc', s: '#ec86a8', l: '#fff0f5', o: '#3a2230', p: '#f5a3b5', n: '#e8708a', eye: EYE_D, salon: 1 },
  { name: 'mátová', f: '#9ee6c8', s: '#62c4a0', l: '#effff8', o: '#1e3a30', p: '#f5a3b5', n: '#e07a92', eye: EYE_D, salon: 1 },
  { name: 'nebeská', f: '#9cc8f4', s: '#6a9ee0', l: '#eef6ff', o: '#1e2a44', p: '#f5a3b5', n: '#e07a92', eye: EYE_D, salon: 1 },
  { name: 'půlnoční', f: '#4a3a7a', s: '#34285a', l: '#8a7ac8', o: '#120c24', p: '#d4839a', n: '#c4647e', eye: ['#e8fff8', '#8fe0c8', '#8fe0c8', '#120c24'], salon: 1 }
);
const RAND_SKINS = SKINS.map((s, i) => i).filter(i => !SKINS[i].salon);

Object.assign(B, {
  salon: { n: 'Kočičí salon', cat: 'domov', w: 2, h: 2, cost: 300, wood: 10, mat: { latka: 4 }, work: 12, era: 1, unique: 1, cozy: 2, desc: 'Česání a barvení srsti. V detailu kočky pak můžeš změnit barvu její srsti (40 mincí).' },
  zavodiste: { n: 'Závodní dráha', cat: 'ozdoby', w: 3, h: 2, cost: 180, wood: 14, work: 10, unique: 1, cozy: 3, nodoor: 1, desc: 'Jednou denně tu uspořádáš kočičí závod. Vsaď si na svou favoritku!' }
});
Object.assign(DRAW, {
  salon(g, X, Y, b, S, night) {
    shape(g, [[X + 3, Y + 12, 26, 19, '#fff0f5']]); R(g, '#f0d0dc', X + 26, Y + 12, 3, 19);
    hipRoof(g, X, Y + 2, 32, 11, '#ff9ec0', '#ffc8dc', '#e0608e', S === 3);
    awning(g, X + 3, Y + 13, 26, '#e0608e', '#ffffff');
    door(g, X + 13, Y + 21, 6, 10); winGlass(g, X + 4, Y + 20, 7, 6, night, true); winGlass(g, X + 21, Y + 20, 6, 6, night, true);
    shape(g, [[X + 22, Y + 4, 2, 7, '#ffd23f']]); R(g, '#e8484e', X + 22, Y + 5, 2, 1); R(g, '#6ab4f0', X + 22, Y + 8, 2, 1);
  },
  zavodiste(g, X, Y, b, S) {
    shape(g, [[X + 1, Y + 4, 46, 26, S === 3 ? '#e8e0d8' : '#d8b078']]);
    for (let i = 0; i < 3; i++) R(g, '#fff3dc', X + 2, Y + 11 + i * 6, 44, 1);
    for (let i = 0; i < 4; i++) { R(g, i % 2 ? '#2b1b2b' : '#ffffff', X + 40, Y + 5 + i * 6, 3, 3); R(g, i % 2 ? '#ffffff' : '#2b1b2b', X + 43, Y + 5 + i * 6, 3, 3); }
    shape(g, [[X + 4, Y - 4, 2, 9, '#8a5230']]); shape(g, [[X + 6, Y - 4, 7, 4, '#e8484e']]);
    shape(g, [[X + 44, Y - 4, 2, 9, '#8a5230']]);
  }
});
Object.assign(LIT, { salon: 1 });
B.salon.top = 6; B.zavodiste.top = 5;

/* ---------- salon: recolour a cat ---------- */
ACTIONS.dye = arg => {
  const [id, si] = arg.split(':').map(Number), c = G.cats.find(x => x.id === id);
  if (!c || !SKINS[si] || c.skin === si) return;
  if (G.coins < 40 && !isCreative()) { toast('Málo mincí.'); Sound.nope(); return; }
  if (!isCreative()) G.coins -= 40;
  c.skin = si; emote(c, 'heart', 3); sparkle(c.x, c.y - 6, SKINS[si].f, 14, 6); Sound.purr();
  toast(`${c.name} je teď ${SKINS[si].name}!`);
};
const _inspectCatF = inspectCat;
inspectCat = function (c) {
  let h = _inspectCatF(c);
  if (!c || !BLIST.some(b => b.type === 'salon' && b.built) || c.kitten > G.t) return h;
  h += `<h4>Kočičí salon · 40 mincí</h4><div class="inv">${SKINS.map((s, i) => `<button class="tog swatch ${c.skin === i ? 'on' : ''}" data-act="dye" data-arg="${c.id}:${i}" title="${s.name}" style="background:${s.f};border-color:${s.o}"></button>`).join('')}</div>`;
  return h;
};

/* ---------- cat races ---------- */
let RACE = null;
B.zavodiste.status = b => b.raceDay === dayIdx() ? ['Dnešní závod už proběhl', 'ok'] : ['Připraveno k závodu', 'ok'];
B.zavodiste.inspect = b => {
  if (!b.built) return '';
  if (b.raceDay === dayIdx()) return '<p class="muted">Další závod zítra.</p>';
  const racers = racePick();
  if (racers.length < 2) return '<p class="muted">Na závod potřebuješ aspoň 2 kočky, které zrovna nespí.</p>';
  return `<h4>Kočičí závod</h4><p>Vsaď 50 mincí na svou favoritku. Když vyhraje, dostaneš <b>${50 * racers.length}</b> mincí. Rychlotlapky a odpočaté kočky běhají rychleji.</p><div class="inv">${racers.map(c => `<button class="btn small alt chamfer" data-act="race" data-arg="${b.id}:${c.id}">${c.name}</button>`).join(' ')}</div>`;
};
function racePick() { return G.cats.filter(c => !c.sleeping && !(c.kitten > G.t)).sort((a, b) => b.energy - a.energy).slice(0, 4); }
ACTIONS.race = arg => {
  const [bid, cid] = arg.split(':').map(Number), b = G.bld[bid]; if (!b || b.raceDay === dayIdx()) return;
  if (G.coins < 50 && !isCreative()) { toast('Na sázku potřebuješ 50 mincí.'); Sound.nope(); return; }
  const racers = racePick(); if (racers.length < 2) return;
  if (!isCreative()) G.coins -= 50;
  b.raceDay = dayIdx();
  RACE = { bet: cid, lanes: racers.map(c => ({ c, x: 0, sp: 0 })), t: 0, done: false, winner: null, prize: 50 * racers.length };
  openRace();
};
function openRace() {
  const el = $('menu'); el.hidden = false;
  el.innerHTML = `<div class="panel nails chamfer mpanel"><h1 class="title">Kočičí závod</h1><p class="sub" id="raceTxt">Připravit… pozor… teď!</p><canvas id="raceCvs" width="240" height="${16 + RACE.lanes.length * 18}" style="width:100%;image-rendering:pixelated;border:3px solid #2b1b2b;background:#d8b078"></canvas><div class="row" id="raceRow"></div></div>`;
  Sound.season();
  RACE.last = performance.now();
  requestAnimationFrame(raceFrame);
}
function raceFrame(now) {
    if (!RACE || !$('raceCvs')) return;
    const dt = Math.min(0.05, Math.max(0, (now - RACE.last) / 1000)); RACE.last = now; RACE.t += dt;
    const cv = $('raceCvs'), g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
    R(g, '#d8b078', 0, 0, cv.width, cv.height);
    for (let i = 0; i <= RACE.lanes.length; i++) R(g, '#fff3dc', 0, 8 + i * 18, cv.width, 1);
    for (let i = 0; i < RACE.lanes.length; i++) for (let k = 0; k < 3; k++) { R(g, (i + k) % 2 ? '#2b1b2b' : '#ffffff', 222, 9 + i * 18 + k * 6, 3, 6); R(g, (i + k) % 2 ? '#ffffff' : '#2b1b2b', 225, 9 + i * 18 + k * 6, 3, 6); }
    RACE.lanes.forEach((L, i) => {
      if (!RACE.done) {
        if (Math.random() < dt * 3) L.sp = 18 + Math.random() * 22 + (L.c.trait === 'rychla' ? 6 : 0) + L.c.energy / 20 + L.c.mood / 40;
        L.x = Math.min(210, L.x + L.sp * dt);
        if (L.x >= 210 && !RACE.winner) RACE.winner = L;
      }
      const s = catSpr(L.c.skin), fr = RACE.done ? s.sit : (Math.floor(RACE.t * 10 + i) % 2 ? s.walk0 : s.walk1);
      g.drawImage(fr.c, Math.round(4 + L.x), 8 + i * 18 + 17 - fr.h);
      if (L.c.id === RACE.bet) { R(g, '#ffd23f', 1, 12 + i * 18, 2, 8); }
      g.fillStyle = '#2b1b2b'; g.font = '7px monospace'; g.fillText(L.c.name.slice(0, 8), 2, 7 + i * 18 + 18);
    });
    if (RACE.winner && !RACE.done) {
      RACE.done = true;
      const w = RACE.winner.c, won = w.id === RACE.bet;
      for (const L of RACE.lanes) { L.c.mood = Math.min(100, L.c.mood + 6); L.c.energy = Math.max(0, L.c.energy - 12); }
      w.mood = 100; emote(w, 'star', 5);
      if (won) { G.coins += RACE.prize; G.stats.earned += RACE.prize; Sound.unlock(); } else Sound.nope();
      G.stats.races = (G.stats.races || 0) + 1; if (won) G.stats.raceWins = (G.stats.raceWins || 0) + 1;
      $('raceTxt').innerHTML = won ? `🏆 Vyhrála <b>${w.name}</b>! Tvoje sázka vyšla: +${RACE.prize} mincí.` : `Vyhrála <b>${w.name}</b>. Tvoje favoritka to nestihla — příště!`;
      $('raceRow').innerHTML = '<button class="btn chamfer" data-m="resume">Zpět do osady</button>';
      journal(`Kočičí závod vyhrála ${w.name}.`);
    }
    if (!RACE.done || RACE.t < 60) requestAnimationFrame(raceFrame);
}
ACH.push(['zavod', 'Vítěz závodu', () => (G.stats.raceWins || 0) >= 1], ['salon', 'Duhová osada', () => new Set(G.cats.map(c => c.skin)).size >= 8]);
{ const p = HELP.find(x => x.id === 'kocky'); if (p) p.t += `<p><b>Kočičí salon</b> (Domov) umí přebarvit srst — i na růžovou, mátovou, nebeskou nebo půlnoční. <b>Závodní dráha</b> (Ozdoby) jednou denně pořádá závod — vsaď si na favoritku.</p>`; }
