'use strict';
/* ============ cat AI ============ */
function abortTask(c) {
  if (c.carry) { addStock(c.carry.item, c.carry.n); c.carry = null; }
  c.task = null; c.path = []; c.dest = null; c.think = rand(0.2, 0.6);
}
function endTask(c) { c.task = null; c.path = []; c.dest = null; c.think = rand(0.15, 0.5); }
function emote(c, e, t) { c.emote = e; c.emoteT = t || 1.6; }
function eatTask(c) {
  const item = FOODS.find(k => ITEMS[k] && avail(k) > 0) || (c && c.food < 30 ? RAW_EAT.find(k => avail(k) > 0) : null);
  if (item) return { kind: 'eat', item, stage: 'src', raw: !FOODS.includes(item) };
  // nothing in the pantry: grab a bite straight from a bakery, fishery…
  if (!c) return null;
  const [cx, cy] = ctile(c); let best = null, bd = 1e9;
  for (const b of BLIST) { if (!b.built) continue; const k = FOODS.find(f => ITEMS[f] && (b.out[f] || 0) - (b.outRes[f] || 0) > 0); if (!k) continue; const d = Math.abs(b.x - cx) + Math.abs(b.y - cy); if (d < bd) { bd = d; best = { kind: 'eat', item: k, from: b.id, stage: 'src' }; } }
  return best;
}
function unstick(c) {
  const [cx, cy] = ctile(c);
  if (reachAt(cx, cy) || reachAt(cx + 1, cy) || reachAt(cx - 1, cy) || reachAt(cx, cy + 1) || reachAt(cx, cy - 1)) return;
  let best = null, bd = 1e9; const bb = G.bb;
  for (let y = bb.y0; y <= bb.y1; y++) for (let x = bb.x0; x <= bb.x1; x++) if (reachAt(x, y)) { const d = Math.abs(x - cx) + Math.abs(y - cy); if (d < bd) { bd = d; best = [x, y]; } }
  if (!best) return;
  sparkle(c.x, c.y - 4, '#fff4dc', 6, 4);
  c.x = best[0] * TS + 8; c.y = best[1] * TS + 10;
  sparkle(c.x, c.y - 4, '#fff4dc', 6, 4);
}
function think(c) {
  unstick(c);
  if (isNight()) {
    if (c.food < 60) { const t = eatTask(c); if (t && startTask(c, t)) { reserveTask(c.task); return; } }
    if (!startTask(c, { kind: 'sleep', night: true })) { c.task = { kind: 'sleep', night: true, b: 0, moving: false }; arrive(c); }
    return;
  }
  if (c.food < 40) { const t = eatTask(c); if (t && startTask(c, t)) { reserveTask(c.task); return; } if (!t && Math.random() < 0.3) emote(c, 'fish', 2); }
  if (c.energy < 12) { startTask(c, { kind: 'sleep', nap: true }); return; }
  if (c.mood < 22 && Math.random() < 0.25) { emote(c, 'sad', 3); startTask(c, { kind: 'idle', t: rand(4, 7) }); return; }
  const wp = c.job && G.bld[c.job];
  if (wp && wp.built && canWork(wp) && startTask(c, { kind: 'work', b: wp.id })) return;
  const cap = carryCap(c);
  for (const j of jobsFor(c, 5)) {
    const task = Object.assign({}, j.task);
    if (task.kind === 'haul') task.n = Math.min(j.n, cap);
    if (startTask(c, task)) { j.n -= task.kind === 'haul' ? task.n : 1; reserveTask(task); return; }
  }
  const fun = BLIST.filter(b => b.built && (B[b.type].rest || B[b.type].play) && !G.cats.some(o => o !== c && o.task && o.task.b === b.id));
  if (fun.length && Math.random() < 0.5) { const f = pick(fun); if (startTask(c, { kind: 'rest', b: f.id, t: rand(5, 9) })) return; }
  startTask(c, { kind: 'idle', t: rand(2.5, 5) });
}
function startTask(c, k) {
  const [cx, cy] = ctile(c);
  let target = null, tx, ty, dest;
  if (k.kind === 'haul') {
    k.stage = 'src';
    if (k.from === 'S') { target = nearestStore(cx, cy); if (!target) return false; k.store = target.id; }
    else target = G.bld[k.from];
  } else if (k.kind === 'eat') { target = k.from ? G.bld[k.from] : nearestStore(cx, cy); if (!target) return false; k.store = target.id; }
  else if (k.kind === 'sleep') {
    const h = c.home && G.bld[c.home];
    if (h) target = h;
    else { const spot = randomSpot(cx, cy, 3); if (!spot) { c.task = k; k.moving = false; arrive(c); return true; } tx = spot[0]; ty = spot[1]; dest = [tx * TS + 8, ty * TS + 10]; }
  } else if (k.kind === 'idle') {
    const spot = randomSpot(cx, cy, 4); if (!spot) { c.task = k; k.moving = false; arrive(c); return true; }
    tx = spot[0]; ty = spot[1]; dest = [tx * TS + 4 + Math.random() * 8, ty * TS + 8 + Math.random() * 4];
  } else target = G.bld[k.b];
  if (target) {
    const a = access(target); if (!a) return false;
    tx = a[0]; ty = a[1]; dest = standPx(target, c);
  }
  if (tx == null) return false;
  const path = findPath(cx, cy, tx, ty);
  if (!path) { if (target) target.unreach = G.t; return false; }
  c.task = k; c.path = path; c.dest = dest; k.moving = true;
  if (c.sleeping) { c.sleeping = false; c.inside = false; }
  return true;
}
function legTo(c, target, isStore) {
  const [cx, cy] = ctile(c), a = access(target);
  if (!a) return false;
  const path = findPath(cx, cy, a[0], a[1]); if (!path) return false;
  c.path = path; c.dest = standPx(target, c); c.task.moving = true;
  if (isStore) c.task.store = target.id;
  return true;
}
function arrive(c) {
  const k = c.task;
  switch (k.kind) {
    case 'haul': {
      if (k.stage === 'src') {
        let take = 0;
        if (k.from === 'S') { take = Math.min(k.n, G.stock[k.item] || 0); if (take > 0) takeStock(k.item, take); }
        else { const b = G.bld[k.from]; if (b) { take = Math.min(k.n, b.out[k.item] || 0); if (take > 0) { b.out[k.item] -= take; if (b.out[k.item] <= 0) delete b.out[k.item]; } } }
        if (take <= 0) { endTask(c); return; }
        c.carry = { item: k.item, n: take }; k.n = take; k.stage = 'dst';
        let dst = k.to === 'S' ? null : G.bld[k.to];
        if (k.to !== 'S' && !dst) k.to = 'S';
        if (k.to === 'S') { dst = nearestStore(...ctile(c)); if (!dst) { addStock(k.item, take); c.carry = null; endTask(c); return; } }
        if (!legTo(c, dst, k.to === 'S')) {
          const st = nearestStore(...ctile(c));
          if (st && k.to !== 'S' && legTo(c, st, true)) { k.to = 'S'; return; }
          addStock(k.item, take); c.carry = null; endTask(c);
        }
        return;
      }
      const it = c.carry; c.carry = null;
      if (!it) { endTask(c); return; }
      if (k.to === 'S') addStock(it.item, it.n);
      else {
        const b = G.bld[k.to];
        if (!b) addStock(it.item, it.n);
        else if (!b.built) { const need = (b.need && b.need[it.item]) || 0, use = Math.min(need, it.n); b.need[it.item] = need - use; addStock(it.item, it.n - use); }
        else if (B[b.type].receive) B[b.type].receive(b, it.item, it.n);
        else b.inp[it.item] = (b.inp[it.item] || 0) + it.n;
      }
      endTask(c); return;
    }
    case 'eat': {
      const src = k.from && G.bld[k.from];
      const has = src ? (src.out[k.item] || 0) > 0 : (G.stock[k.item] || 0) > 0;
      if (has) {
        if (src) { src.out[k.item]--; if (src.out[k.item] <= 0) delete src.out[k.item]; } else takeStock(k.item, 1);
        c.food = Math.min(100, c.food + ITEMS[k.item].food);
        if (k.raw) { c.mood = Math.max(0, c.mood - 2); if (!G.flags.rawTip) { G.flags.rawTip = true; banner('Kočky jedí syrovou úrodu', 'Nemají chleba ani ryby. Přiřaď kočku do pekárny, aby měly pořádné jídlo.'); } }
        if (!k.raw) c.mood = Math.min(100, c.mood + (c.trait === 'mlsoun' && k.item === 'susenky' ? 12 : 3));
        if (c.fav && c.fav.food === k.item) c.mood = Math.min(100, c.mood + 6);
        emote(c, c.trait === 'mlsoun' && k.item === 'susenky' ? 'star' : 'heart', 1.4);
      }
      k.stage = 'done'; k.t = 1.2; c.anim = 'sit'; return;
    }
    case 'work': case 'farm': case 'build': k.stage = 'working'; k.dur = 0; k.idle = 0; if (k.kind === 'work' && B[G.bld[k.b] ? G.bld[k.b].type : ''] && B[G.bld[k.b].type].interior) { c.inside = true; } return;
    case 'sleep': {
      const h = c.home && G.bld[c.home];
      if (h && k.b !== 0) c.inside = true;
      c.sleeping = true; k.wakeH = 6 + Math.random() * 0.6; return;
    }
    case 'rest': { k.stage = 'sit'; c.face = 1; return; }
    case 'idle': { k.stage = 'sit'; if (c.mood > 72 && Math.random() < 0.35) emote(c, 'note', 2); return; }
  }
  endTask(c);
}
function stay(c, dt) {
  const k = c.task;
  switch (k.kind) {
    case 'work': {
      const b = G.bld[k.b];
      if (!b || isNight() || c.energy < 6 || c.job !== b.id) { if (c.inside && b && B[b.type].interior) leaveInterior(c, b); endTask(c); return; }
      c.anim = 'work';
      if (canWork(b)) {
        k.idle = 0;
        if (!B[b.type].market) produce(b, dt * workMul(c, b)); else b.lastWork = G.t;
      } else { k.idle += dt; if (k.idle > (B[b.type].interior ? 6 : 1.5)) { if (c.inside) leaveInterior(c, b); endTask(c); return; } }
      k.dur += dt; if (k.dur > (B[b.type].interior ? 60 : 24)) { if (c.inside) leaveInterior(c, b); endTask(c); }
      return;
    }
    case 'farm': {
      const b = G.bld[k.b];
      if (!b || isNight() || !fieldNeedsWork(b)) { endTask(c); return; }
      c.anim = 'work';
      b.fw = (b.fw || 0) + dt * workMul(c, b);
      if (b.fw >= FARM_WORK) {
        b.fw = 0;
        if (b.st === 0) { b.st = 1; b.g = 0; }
        else if (b.st === 2) { const cr = CROPS[b.crop]; b.out[b.crop] = (b.out[b.crop] || 0) + cr.yield; G.stats.made[b.crop] = (G.stats.made[b.crop] || 0) + cr.yield; b.st = 0; b.g = 0; sparkle(c.x, c.y - 6, '#ffd23f', 5, 6); }
        endTask(c);
      }
      return;
    }
    case 'build': {
      const b = G.bld[k.b];
      if (!b || b.built || isNight()) { endTask(c); return; }
      c.anim = 'work';
      b.work -= dt * workMul(c, b);
      if (Math.random() < dt * 2) addPart(b.x * TS + rand(2, b.w * TS - 2), b.y * TS + b.h * TS - rand(2, 10), rand(-15, 15), rand(-30, -10), '#d8955a', 0.4, { g: 120 });
      if (b.work <= 0) { completeBuilding(b); endTask(c); }
      return;
    }
    case 'sleep': {
      c.anim = 'sleep';
      let wake = false;
      if (k.nap) { if (isNight()) { k.nap = false; k.wakeH = 6 + Math.random() * 0.6; } else if (c.energy >= 50) wake = true; }
      else if (!isNight() && hour() >= k.wakeH) wake = true;
      if (wake) {
        c.sleeping = false;
        if (c.inside) { c.inside = false; const h = G.bld[c.home]; if (h) { const s = standPx(h, c); if (s) { c.x = s[0]; c.y = s[1]; } } }
        endTask(c);
      }
      return;
    }
    case 'rest': {
      const b = G.bld[k.b]; c.anim = 'sit';
      if (!b) { endTask(c); return; }
      if (B[b.type].play) { c.playT = G.t; if (Math.random() < dt * 0.6) emote(c, 'note', 1.2); }
      else c.energy = Math.min(100, c.energy + dt / DAY * 24 * 6);
      k.t -= dt; if (k.t <= 0 || isNight()) endTask(c);
      return;
    }
    case 'eat': case 'idle': { c.anim = 'sit'; k.t -= dt; if (k.t <= 0) endTask(c); return; }
  }
  endTask(c);
}
function leaveInterior(c, b) { c.inside = false; const s = standPx(b, c); if (s) { c.x = s[0]; c.y = s[1]; } }
function moodTarget(c) {
  let m = 50;
  m += c.food > 50 ? 10 : c.food < 20 ? -22 : 0;
  m += c.energy > 40 ? 5 : c.energy < 15 ? -15 : 0;
  const h = c.home && G.bld[c.home];
  if (h) { m += 6 + Math.min(20, cozyNear(h.x, h.y, 3) * 2); if (typeof noiseAt === 'function') m -= Math.min(20, noiseAt(h.x + 1, h.y + 1) * 2); if (h.pillows) m += 6; } else m -= 18;
  if (G.t - c.petT < DAY * 0.25) m += 12 * (c.trait === 'mazel' ? 2 : 1);
  if (G.t - c.playT < DAY * 0.5) m += 10;
  if (c.trait === 'spac') m += 8;
  if (G.weather === 'rain' && !c.inside) m -= 4;
  return clamp(m, 0, 100);
}
function moveCat(c, dt) {
  let tx, ty;
  if (c.path.length) { const n = c.path[0]; tx = n.x * TS + 8; ty = n.y * TS + 10; }
  else if (c.dest) { tx = c.dest[0]; ty = c.dest[1]; }
  else return true;
  const t = tile(Math.floor(c.x / TS), Math.floor(c.y / TS));
  const ground = t.gr === 'road' || t.gr === 'asfalt' ? 2.5 : t.gr === 'path' || t.gr === 'bridge' ? 1.9 : 1;
  const sp = 28 * (c.trait === 'rychla' ? 1.3 : 1) * ground * (c.energy < 10 ? 0.8 : 1);
  const dx = tx - c.x, dy = ty - c.y, dd = Math.hypot(dx, dy), step = sp * dt;
  if (dd <= step) { c.x = tx; c.y = ty; if (c.path.length) c.path.shift(); else c.dest = null; }
  else { c.x += dx / dd * step; c.y += dy / dd * step; }
  if (Math.abs(dx) > 0.3) c.face = dx > 0 ? 1 : -1;
  c.walkT += dt; c.anim = 'walk';
  return !c.path.length && !c.dest;
}
function updateCat(c, dt) {
  const dh = dt / DAY * 24;
  if (c.sleeping) c.energy = Math.min(100, c.energy + (c.inside ? 14 : 8) * dh);
  else c.energy = Math.max(0, c.energy - (c.trait === 'spac' ? 7.5 : 5.5) * dh);
  c.food = Math.max(0, c.food - (c.trait === 'mlsoun' ? 2.6 : 1.8) * dh * (typeof modeVal === 'function' ? modeVal('hunger', 1) : 1));
  c.mt = (c.mt || 0) - dt;
  if (c.mt <= 0) { c.mt = 0.5 + Math.random() * 0.3; c.mtgt = moodTarget(c); }
  const tg = c.mtgt != null ? c.mtgt : c.mood;
  c.mood += Math.sign(tg - c.mood) * Math.min(Math.abs(tg - c.mood), 10 * dh);
  if (c.emoteT > 0) { c.emoteT -= dt; if (c.emoteT <= 0) c.emote = null; }
  else if (c.food < 18 && !c.sleeping && Math.random() < dt * 0.15) emote(c, 'fish', 1.8);
  if (SKINS[c.skin] && SKINS[c.skin].sparkle && !c.inside && Math.random() < dt * 2) addPart(c.x + rand(-5, 5), c.y - rand(3, 10), 0, -8, '#fff4b0', 0.5, { g: 0, k: 'spark' });
  const k = c.task;
  if (!k) { c.anim = c.sleeping ? 'sleep' : 'sit'; c.think -= dt; if (c.think <= 0) { c.think = rand(0.3, 0.8); think(c); } return; }
  if (k.moving) { if (moveCat(c, dt)) { k.moving = false; arrive(c); } return; }
  stay(c, dt);
}
function petCat(c) {
  tutEvent('pet');
  if (G.t - c.petT < DAY * 0.06) { emote(c, 'heart', 0.8); return; }
  c.petT = G.t; c.mood = Math.min(100, c.mood + (c.trait === 'mazel' ? 16 : 8)); c.mt = 0;
  emote(c, 'heart', 2); Sound.purr();
  for (let i = 0; i < 5; i++) addPart(c.x + rand(-6, 6), c.y - 8, rand(-8, 8), rand(-24, -12), '#ff6f9c', rand(0.6, 1), { g: 0, k: 'heart', drag: 1 });
}
function catActivity(c) {
  const k = c.task;
  if (c.sleeping) return c.inside ? 'Spí v domku' : 'Spí venku (nemá domov)';
  if (!k) return 'Přemýšlí';
  const bn = id => (G.bld[id] ? B[G.bld[id].type].n : '?');
  switch (k.kind) {
    case 'haul': { const it = `${k.n}× ${ITEMS[k.item].n.toLowerCase()}`; const to = k.to === 'S' ? 'do skladu' : '→ ' + bn(k.to); return k.stage === 'src' ? `Jde pro ${it} ${to}` : `Nese ${it} ${to}`; }
    case 'work': return (k.moving ? 'Jde do práce: ' : 'Pracuje: ') + bn(k.b);
    case 'farm': { const b = G.bld[k.b]; return b && b.st === 2 ? 'Sklízí úrodu' : 'Seje na políčku'; }
    case 'build': return 'Staví: ' + bn(k.b);
    case 'eat': return 'Jde se najíst';
    case 'sleep': return k.nap ? 'Jde si zdřímnout' : 'Jde spát';
    case 'rest': return G.bld[k.b] && B[G.bld[k.b].type].play ? 'Hraje si' : 'Odpočívá';
    case 'idle': return c.mood < 25 ? 'Trucuje' : 'Lenoší';
  }
  return '';
}
