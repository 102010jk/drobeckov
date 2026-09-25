'use strict';
/* ============ 3.10: fireworks — buy or craft, launch at night for a show ============ */
Object.assign(ITEMS, { ohnostroj: { n: 'Ohňostroj', v: 40 } });
addSprites({ ohnostroj: ['..y..', '.rrr.', '.rwr.', '.rrr.', '.rwr.', '.rrr.', '..B..', '..B..'] });
Object.assign(RECIPES, { ohnostroj: { in: { papir: 2, uhli: 1 }, out: 'ohnostroj', n: 1, t: 12 } });
B.papirna.recipes.push('ohnostroj');

const FW = [];   // rockets and sparks in world coordinates, drawn above the night
let FW_SHOW = 0;
const FW_COLS = [['#ff6f9c', '#ffd0e0'], ['#ffd23f', '#fff4b0'], ['#7bd6b0', '#d8fff0'], ['#6ab4f0', '#d8ecff'], ['#b89ae8', '#efe4ff'], ['#f79a3a', '#ffe0b0']];
function fwRocket() {
  const x = CAM.x + rand(-VW * 0.35, VW * 0.35), y0 = CAM.y + VH * 0.5, top = CAM.y - rand(VH * 0.05, VH * 0.35);
  FW.push({ k: 'r', x, y: y0, vy: -rand(110, 150), top, col: pick(FW_COLS) });
  Sound.click();
}
function fwBurst(x, y, col) {
  const n = randi(26, 40), ring = Math.random() < 0.4;
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + rand(-0.1, 0.1), sp = ring ? 42 : rand(15, 50); FW.push({ k: 's', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: rand(1, 1.6), max: 1.6, col: Math.random() < 0.3 ? col[1] : col[0] }); }
  Sound.chop();
}
function launchFireworks(n) {
  FW_SHOW = n;
  for (let i = 0; i < n; i++) setTimeout(fwRocket, i * rand(350, 650));
  for (const c of G.cats) { c.mood = Math.min(100, c.mood + 10); if (!c.inside) emote(c, 'heart', 4); }
  G.stats.fireworks = (G.stats.fireworks || 0) + 1;
  journal('Nad osadou se rozzářil ohňostroj.');
}
ACTIONS.fireworks = src => {
  if (darkness() < 0.3) { toast('Ohňostroj je nejhezčí za tmy — počkej na večer.'); Sound.nope(); return; }
  if (FW.length) return;
  if (src === 'stock') { if (!(G.stock.ohnostroj > 0)) { toast('Nemáš ohňostroj ve skladu (vyrábí ho Papírna z papíru a uhlí).'); return; } takeStock('ohnostroj', 1); launchFireworks(10); }
  else { const price = 200 + G.cats.length * 5; if (G.coins < price && !isCreative()) { toast('Ohňostroj stojí ' + price + ' mincí.'); Sound.nope(); return; } if (!isCreative()) G.coins -= price; launchFireworks(8); }
  UI.dirty = true;
};
const _drawWeatherFXFw = drawWeatherFX;
drawWeatherFX = function (g, dt) {
  _drawWeatherFXFw(g, dt);
  if (!FW.length) return;
  dt = Math.min(dt, 0.05);
  g.setTransform(1, 0, 0, 1, -VX, -VY);
  for (let i = FW.length - 1; i >= 0; i--) {
    const p = FW[i];
    if (p.k === 'r') {
      p.y += p.vy * dt; g.fillStyle = '#fff4b0'; g.fillRect(Math.round(p.x), Math.round(p.y), 1, 3); g.fillStyle = '#f79a3a'; g.fillRect(Math.round(p.x), Math.round(p.y) + 3, 1, 2);
      if (p.y <= p.top) { fwBurst(p.x, p.y, p.col); FW.splice(i, 1); }
    } else {
      p.vx *= 1 - 1.4 * dt; p.vy = p.vy * (1 - 1.4 * dt) + 18 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
      if (p.life <= 0) { FW.splice(i, 1); continue; }
      g.globalAlpha = Math.min(1, p.life / 0.6); g.fillStyle = p.col;
      if (p.life > p.max * 0.6) g.fillRect(Math.round(p.x) - 1, Math.round(p.y) - 1, 2, 2); else g.fillRect(Math.round(p.x), Math.round(p.y), 1, 1);
    }
  }
  g.globalAlpha = 1; g.setTransform(1, 0, 0, 1, 0, 0);
};
/* button at the top of the cats tab */
const _paneCatsFw = paneCats;
paneCats = function () {
  const price = 200 + G.cats.length * 5, have = G.stock.ohnostroj || 0;
  return `<div class="upg fwrow"><span>${itemIcon('ohnostroj', 1)} <b>Ohňostroj</b> <small>kočky mají radost (+10 nálada), jen za tmy</small></span><span>${have ? `<button class="btn small chamfer" data-act="fireworks" data-arg="stock">Odpálit ze skladu (${have})</button>` : ''}<button class="btn small alt chamfer" data-act="fireworks" data-arg="buy">${isCreative() ? 'Odpálit' : 'Koupit a odpálit · ' + price}</button></span></div>` + _paneCatsFw();
};
/* New Year's Eve: the last winter night lights up by itself */
MORNING_HOOKS.push(() => { G.fwNight = seasonIdx() === 3 && dayInSeason() === SDAYS; if (G.fwNight) toast('Dnes je Silvestr! Večer bude ohňostroj.'); });
STEP_HOOKS.push(() => { if (G.fwNight && darkness() > 0.45 && !FW.length) { G.fwNight = false; launchFireworks(16); banner('Šťastný nový rok!', 'Celé údolí slaví s ohňostrojem.'); } });
ACH.push(['ohnostroj', 'Nebe v plamenech', () => (G.stats.fireworks || 0) >= 3]);
{ const p = HELP.find(x => x.id === 'sezony'); if (p) p.t += `<p><b>Ohňostroj:</b> v záložce Kočky ho koupíš a odpálíš (jen za tmy) — všechny kočky mají radost. Vyrábí ho i Papírna z papíru a uhlí (uhlí dává milíř nebo důl). Poslední zimní noc je Silvestr s velkým ohňostrojem zdarma.</p>`; }
