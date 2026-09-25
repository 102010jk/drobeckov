'use strict';
/* ============ 3.8: the city — asphalt roads with cars, row houses, the airport ============ */
Object.assign(B, {
  silnice: { n: 'Silnice', cat: 'cesty', w: 1, h: 1, cost: 4, mat: { kamen: 1, uhli: 1 }, ground: 'asfalt', era: 3,
    desc: 'Asfaltová silnice — jezdí po ní auta a kočky po ní běhají 2,5× rychleji. Jde položit i přes cestu a dlažbu. Táhni myší.' },
  mestsky_dum: { n: 'Městský dům', cat: 'domov', w: 2, h: 2, cost: 320, mat: { cihly: 16, prkna: 6, sklo: 4 }, work: 14, beds: 4, cozy: 1, era: 3, windowLight: [16, 10, 16],
    desc: 'Vysoký cihlový dům pro 4 kočky. Postav je těsně vedle sebe — vznikne souvislá městská ulice.' },
  letiste: { n: 'Letiště', cat: 'vyroba', w: 10, h: 6, cost: 12000, mat: { ocel: 40, cihly: 60, sklo: 20, dural: 10 }, work: 60, era: 4, tech: 'vzducholod', unique: 1, noise: 6, cozy: 2,
    desc: 'Obří stavba (10×6) — potřebuje hodně rovného místa, nejspíš si koupíš nové pozemky. Každé ráno přiletí turisté a utratí v osadě mince.' }
});

/* ---------- airport: tourists every morning, planes land and take off ---------- */
Object.assign(B.letiste, {
  status: () => ['Letadla vozí turisty' + (G.stats.tourists ? ' · celkem ' + fmt(G.stats.tourists) : ''), 'ok'],
  inspect: () => `<p class="muted">Každé ráno přiletí letadlo s turisty. Čím víc koček a čím útulnější osada, tím víc utratí.</p><p>Poslední let: ${G.lastTourists ? G.lastTourists.n + ' turistů, ' + fmt(G.lastTourists.c) + ' mincí' : 'zatím žádný'}</p>`
});
function airportMorning() {
  if (!countB('letiste')) return;
  const n = 8 + Math.floor(G.cats.length / 8) + randi(0, 6), c = Math.round(n * (18 + coziness() / 12));
  G.coins += c; G.stats.earned += c; G.stats.tourists = (G.stats.tourists || 0) + n; G.lastTourists = { n, c };
  toast(`✈ Přiletělo ${n} turistů a utratili ${fmt(c)} mincí`); Sound.coin();
}
MORNING_HOOKS.push(airportMorning);
/* a plane's day at the airport, 30 s loop: land, roll, wait at the terminal, take off */
function planeState(t) {
  const u = t % 30, ease = k => k * k * (3 - 2 * k);
  if (u < 5) { const k = ease(u / 5); return { x: -70 + k * 100, alt: (1 - k) * 46, dir: 1 }; }
  if (u < 9) { const k = (u - 5) / 4; return { x: 30 + (1 - (1 - k) * (1 - k)) * 70, alt: 0, dir: 1 }; }
  if (u < 17) return { x: 100, alt: 0, dir: 1 };
  if (u < 24) { const k = (u - 17) / 7, x = 100 + k * k * 170; return { x, alt: x > 150 ? (x - 150) * 0.45 : 0, dir: 1 }; }
  return null;
}
function drawPlane(g, x, y, alt) {
  if (alt > 0) { g.fillStyle = 'rgba(43,27,43,' + Math.max(0.08, 0.28 - alt / 250) + ')'; g.fillRect(Math.round(x - 12), Math.round(y + 1), 24, 3); }
  const im = spriteAsset('auta/letadlo'), py = Math.round(y - alt);
  if (im) { g.drawImage(im, Math.round(x - im.width / 2), py - im.height + 2); return; }
  shape(g, [[x - 14, py - 7, 28, 5, '#f6f1ec'], [x - 14, py - 13, 4, 6, '#e8484e'], [x - 4, py - 5, 10, 3, '#c4cad8']]);
  R(g, '#6ab4f0', x + 8, py - 6, 3, 2);
}
ANIM.letiste = (g, X, Y, b, t) => { const p = planeState(t + (b.id || 0) * 7); if (p) drawPlane(g, X + p.x, Y + 80, p.alt); };
DRAW.letiste = (g, X, Y, b, S) => {   // simple fallback — assets/budovy/letiste.png is the real picture
  R(g, OUT, X, Y + 62, 160, 32); R(g, '#4a4658', X + 1, Y + 63, 158, 30);
  for (let i = 0; i < 14; i++) R(g, '#f6f1ec', X + 8 + i * 11, Y + 77, 6, 2);
  shape(g, [[X + 20, Y + 18, 100, 40, '#d8dce8'], [X + 128, Y - 6, 12, 64, '#c4cad8'], [X + 122, Y - 14, 24, 10, '#6ab4f0']]);
  for (let i = 0; i < 9; i++) R(g, '#6ab4f0', X + 26 + i * 10, Y + 26, 6, 14);
  if (S === 3) R(g, '#ffffff', X + 20, Y + 18, 100, 3);
};
DRAW.mestsky_dum = (g, X, Y, b, S, night) => {   // fallback for assets/budovy/mestsky_dum*.png
  const wall = ['#b85a44', '#c8a078', '#8a8ea0', '#a86a8a'][(b.id || 0) % 4];
  shape(g, [[X, Y - 10, 32, 42, wall]]); R(g, '#6b4128', X, Y - 14, 32, 4); if (S === 3) R(g, '#ffffff', X, Y - 14, 32, 2);
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) R(g, night && (r + c + b.id) % 3 ? '#ffd86b' : '#bfe4f4', X + 4 + c * 10, Y - 6 + r * 11, 5, 6);
  R(g, '#6b4128', X + 13, Y + 24, 6, 8);
};

/* ---------- cars ---------- */
const CARS = [], CAR_KINDS = [['cervene', 3], ['modre', 3], ['taxi', 2], ['dodavka', 2], ['autobus', 1]];
const CAR_COL = { cervene: '#e8484e', modre: '#3a74c8', taxi: '#ffd23f', dodavka: '#f6f1ec', autobus: '#3a9a78' };
let ROADS = [], roadsV = -1, carT = 0;
const isRoad = (x, y) => tile(x, y).gr === 'asfalt';
function roadList() {
  if (roadsV === pathVersion) return ROADS;
  roadsV = pathVersion; ROADS = [];
  const bb = G.bb; for (let y = bb.y0; y <= bb.y1; y++) for (let x = bb.x0; x <= bb.x1; x++) if (isRoad(x, y)) ROADS.push([x, y]);
  return ROADS;
}
function nextDir(c) {
  const opts = [0, 1, 2, 3].filter(d => d !== (c.d + 2) % 4 && isRoad(c.x + FDX[d], c.y + FDY[d]));
  if (!opts.length) return (c.d + 2) % 4;
  return opts.includes(c.d) && Math.random() < 0.6 ? c.d : pick(opts);
}
function spawnCar(list, x, y) {
  if (x == null) [x, y] = pick(list);
  const dirs = [0, 1, 2, 3].filter(d => isRoad(x + FDX[d], y + FDY[d]));
  if (!dirs.length || CARS.some(c => c.x === x && c.y === y)) return;
  CARS.push({ x, y, d: pick(dirs), p: 0, k: weighted(CAR_KINDS), v: rand(2.2, 3.2) });
}
function moveCar(c, dt) {
  if (!isRoad(c.x, c.y)) { c.dead = true; return; }
  const nx = c.x + FDX[c.d], ny = c.y + FDY[c.d];
  // keep a distance to the car in front in the same lane
  let gap = 9;
  for (const o of CARS) if (o !== c && o.d === c.d) {
    if (o.x === c.x && o.y === c.y && o.p > c.p) gap = Math.min(gap, o.p - c.p);
    else if (o.x === nx && o.y === ny) gap = Math.min(gap, 1 + o.p - c.p);
  }
  if (gap < (c.k === 'autobus' ? 1.3 : 0.9)) return;
  c.p += dt * c.v * (c.k === 'autobus' ? 0.75 : 1);
  if (c.p < 1) return;
  if (!isRoad(nx, ny)) { c.d = (c.d + 2) % 4; c.p = 0; return; }
  c.x = nx; c.y = ny; c.p -= 1; c.d = nextDir(c);
}
STEP_HOOKS.push(dt => {
  const list = roadList();
  if (!list.length) { CARS.length = 0; return; }
  const target = Math.min(120, Math.floor(list.length / 6) * (G.carMul || 1)) * (isNight() ? 0.35 : 1);
  carT -= dt;
  if (carT <= 0) { carT = 0.35; if (CARS.length < target) spawnCar(list); else if (CARS.length > target + 2) CARS.splice(randi(0, CARS.length - 1), 1); }
  for (const c of CARS) moveCar(c, dt);
  for (let i = CARS.length - 1; i >= 0; i--) if (CARS[i].dead) CARS.splice(i, 1);
});
function carPos(c) {
  const fx = c.x + FDX[c.d] * c.p, fy = c.y + FDY[c.d] * c.p, lane = 3;
  return [fx * TS + 8 + (c.d === 1 ? -lane : c.d === 3 ? lane : 0), fy * TS + 8 + (c.d === 0 ? lane : c.d === 2 ? -lane : 0)];
}
function drawCar(g, c, x, y, night) {
  const side = c.d === 0 || c.d === 2, name = 'auta/' + c.k + (side ? '.bok' : c.d === 1 ? '.zepredu' : '.zezadu');
  const im = spriteAsset(name);
  x = Math.round(x); y = Math.round(y);
  if (im) {
    if (c.d === 2) { g.save(); g.translate(x, 0); g.scale(-1, 1); g.drawImage(im, -(im.width >> 1), y - im.height + 3); g.restore(); }
    else g.drawImage(im, x - (im.width >> 1), y - im.height + 3);
  } else {
    const col = CAR_COL[c.k], w = side ? (c.k === 'autobus' ? 22 : 14) : 9, h = side ? 7 : 9;
    shape(g, [[x - (w >> 1), y - h + 2, w, h, col]]);
    R(g, '#bfe4f4', x - (w >> 1) + (side ? (c.d === 0 ? w - 5 : 1) : 2), y - h + 3, side ? 4 : w - 4, 2);
  }
  if (night) {
    g.fillStyle = 'rgba(255,230,140,0.9)';
    if (c.d === 0) g.fillRect(x + 7, y - 2, 2, 1); else if (c.d === 2) g.fillRect(x - 9, y - 2, 2, 1);
    else if (c.d === 1) { g.fillRect(x - 3, y - 1, 1, 1); g.fillRect(x + 2, y - 1, 1, 1); }
  }
}
ENT_HOOKS.push((E, t) => {
  if (!CARS.length) return;
  const night = darkness() > 0.3;
  for (const c of CARS) {
    const [x, y] = carPos(c);
    if (x < VX - 24 || x > VX + VW + 24 || y < VY - 16 || y > VY + VH + 16) continue;
    E.push([y + 3, 9, 0, 0, g => drawCar(g, c, x, y, night)]);
  }
});

/* ---------- help ---------- */
HELP.push({ id: 'mesto', n: 'Město', t: `<p>Od éry <b>Průmysl</b> můžeš stavět <b>asfaltové silnice</b> (Stavět → Cesty). Jakmile je silnic víc, začnou po nich jezdit <b>auta</b> — osobní, taxíky, dodávky i autobusy. V noci svítí.</p>
<p><b>Městský dům</b> (Domov) má pelíšky pro 4 kočky. Postav ho těsně vedle dalšího — vznikne souvislá ulice jako ve městě.</p>
<p><b>Letiště</b> (éra Věda a vesmír, výzkum Vzducholodě) je obří — 10×6 dlaždic, takže si nejspíš budeš muset koupit další pozemky. Každé ráno přiveze turisty, kteří v osadě utratí mince.</p>` });
