'use strict';
/* ============ eras ============ */
let eraT = 0;
STEP_HOOKS.push(dt => {
  eraT -= dt; if (eraT > 0) return; eraT = 1;
  const next = ERAS[(G.era || 0) + 1];
  if (next && next.ok()) {
    G.era = (G.era || 0) + 1;
    banner('Nová éra: ' + next.n, next.d);
    Sound.unlock(); UI.dirty = true; minimapDirty = true;
    renderTut();
  }
});

/* ============ noise ("ruch") ============ */
function noiseAt(x, y) {
  let n = 0;
  for (const b of BLIST) {
    const d = B[b.type]; if (!b.built) continue;
    const dist = Math.max(Math.abs(b.x + (b.w - 1) / 2 - x), Math.abs(b.y + (b.h - 1) / 2 - y));
    if (d.noise && dist <= d.noise + 1) n += d.noise + 1.5 - dist;
    if (d.quiet && dist <= 3) n -= 1.5;
  }
  return Math.max(0, Math.round(n));
}

/* ============ market saturation & seasonal demand ============ */
const SEASON_DEMAND = {
  pernik: [1, 0.9, 1.1, 1.5], koreneny_pernik: [1, 0.9, 1.1, 1.6], polevka: [1, 0.8, 1.1, 1.4], most: [1, 1.3, 1.1, 0.9],
  jahody: [0.9, 0.9, 1.2, 1.4], dzem: [1, 1, 1.1, 1.3], cokoladovy_dort: [1, 0.9, 1, 1.3], polstar: [1, 0.9, 1.1, 1.3], sklo: [1, 1, 1, 1.1], ryby: [1, 1, 1, 1.3]
};
function marketMul(k) {
  const s = (G.market && G.market[k]) || 0, sd = SEASON_DEMAND[k] ? SEASON_DEMAND[k][seasonIdx()] : 1;
  return (1 - 0.5 * s) * sd;
}
function marketSold(k, n) { if (!G.market) G.market = {}; G.market[k] = Math.min(0.8, (G.market[k] || 0) + n * 0.015); }
MORNING_HOOKS.push(() => { if (G.market) for (const k in G.market) { G.market[k] *= 0.8; if (G.market[k] < 0.01) delete G.market[k]; } });
function trendArrow(k) { const m = marketMul(k); return m > 1.1 ? '▲' : m < 0.8 ? '▼' : ''; }

/* ============ travelling traders ============ */
const TR_A = ['Bo', 'Ku', 'Mi', 'Fr', 'Ze', 'Lu', 'Ha', 'Pe', 'Vo', 'Ja', 'Ro', 'Ta', 'Ši', 'Če', 'Hu'], TR_B = ['bík', 'lda', 'nek', 'rek', 'šek', 'lina', 'buš', 'dra', 'mír', 'vín', 'ruš', 'ček', 'fous', 'ťapka'];
const SPECS = {
  kuchar: { n: 'kuchař', wants: { chleb: 3, pernik: 3, dzem: 3, polevka: 3, most: 2, dynovy_kolac: 2, jahodovy_dort: 2, strudl: 2, med: 2, koreneny_pernik: 2 }, sells: [['koreni', 1], ['kakao', 1], ['med', 0.5]] },
  stavitel: { n: 'stavitel', wants: { prkna: 4, cihly: 4, kamen: 3, sklo: 3, drevo: 2 }, sells: [['hlina', 1], ['pisek', 1], ['kamen', 0.6]] },
  krejci: { n: 'krejčí', wants: { latka: 4, vlna: 3, polstar: 3 }, sells: [['vlna', 1], ['koreni', 0.4]] },
  sberatel: { n: 'sběratel', wants: { med: 2, sklo: 3, polstar: 2, jahodovy_dort: 2, mrkvovy_dort: 2, cokoladovy_dort: 3, papir: 2 }, sells: [['bp', 1]] },
  farmar: { n: 'farmář', wants: { mouka: 3, mleko: 3, vlna: 2, jablka: 2, dyne: 2 }, sells: [['kakao', 0.6], ['psenice', 1], ['ryby', 1]] }
};
const TRADER_SPECIES = ['bobr', 'vydra', 'myval', 'jezevec', 'kachna', 'veverka', 'jezek', 'zajic', 'liska', 'medved'];
const BLUEPRINTS = ['lampiony', 'kasna', 'kocici_strom', 'houpacka', 'mlyncek'];
function genTrader(kind) {
  const specs = Object.keys(SPECS).filter(k => kind !== 'lod' || true);
  const spec = pick(specs), S = SPECS[spec];
  const wantsAll = Object.entries(S.wants).filter(([k]) => ITEMS[k] && producible(k));
  const wants = [];
  for (let i = 0; i < 3 && wantsAll.length; i++) {
    const k = weighted(wantsAll); wantsAll.splice(wantsAll.findIndex(e => e[0] === k), 1);
    wants.push({ item: k, mult: +(1.2 + Math.random() * 0.6).toFixed(2), qty: Math.max(2, Math.round(40 / ITEMS[k].v * rand(0.6, 1.2))) });
  }
  const sells = [];
  for (const [k, w] of S.sells) {
    if (Math.random() > w) continue;
    if (k === 'bp') { const free = BLUEPRINTS.filter(b => !G.flags['bp_' + b]); if (free.length) { const b = pick(free); sells.push({ bp: b, price: B[b].bpPrice || 150 }); } }
    else sells.push({ item: k, price: Math.round(ITEMS[k].v * rand(1.3, 1.8)), qty: Math.max(3, Math.round(30 / ITEMS[k].v)) });
  }
  return { id: G.nid++, name: pick(TR_A) + pick(TR_B), sp: pick(TRADER_SPECIES), spec, wants, sells, leave: G.t + DAY * rand(1.1, 1.5), kind: kind || 'karavana' };
}
MORNING_HOOKS.push(() => {
  if (!G.traders) G.traders = [];
  G.traders = G.traders.filter(t => t.leave > G.t);
  const sq = BLIST.find(b => b.type === 'namesti' && b.built);
  if (!sq) return;
  G.caravanT = (G.caravanT == null ? 1 : G.caravanT) - 1;
  if (G.caravanT <= 0 && !G.traders.some(t => t.kind === 'karavana')) {
    G.caravanT = randi(1, 3);
    const t = genTrader('karavana'); G.traders.push(t);
    banner('Přijela karavana!', `${t.name} (${ANIMALS[t.sp].n}, ${SPECS[t.spec].n}) čeká na Tržním náměstí.`);
    Sound.deliver();
  }
});
/* what the market square wants cats to bring for sale */
B.namesti.wants = b => Object.keys(G.tradePrep || {}).filter(k => G.tradePrep[k] > 0);
B.namesti.inNeed = (b, k) => ((G.tradePrep || {})[k] || 0) - (b.inp[k] || 0) - (b.inc[k] || 0);
B.namesti.status = b => { const n = (G.traders || []).filter(t => t.kind === 'karavana').length; return [n ? 'Obchodník je tady!' : 'Karavana přijede za ' + Math.max(1, G.caravanT || 1) + ' dny', n ? 'ok' : 'wait']; };
B.namesti.inspect = () => `<button class="btn small chamfer" data-act="tab" data-arg="trade">Otevřít obchod</button>`;
function traderPrice(t, w) { return Math.max(1, Math.round(ITEMS[w.item].v * w.mult * marketMul(w.item) * (1 + (G.traderRep || 0) * 0.02))); }
ACTIONS.prep = arg => { const [k, q] = arg.split(':'); if (!G.tradePrep) G.tradePrep = {}; G.tradePrep[k] = Math.max(0, +q); if (!G.tradePrep[k]) delete G.tradePrep[k]; jobsDirty = true; };
ACTIONS.tsell = arg => {
  const [tid, k] = arg.split(':'), t = (G.traders || []).find(x => x.id === +tid); if (!t) return;
  const w = t.wants.find(x => x.item === k); if (!w || w.qty <= 0) return;
  const hub = tradeHub(t); if (!hub) return;
  const n = Math.min(w.qty, hub.inp[k] || 0); if (!n) { toast('Na náměstí zatím nic z toho neleží — nech kočky zboží přinést.'); Sound.nope(); return; }
  const pay = traderPrice(t, w) * n;
  hub.inp[k] -= n; if (hub.inp[k] <= 0) delete hub.inp[k];
  if (G.tradePrep && G.tradePrep[k]) { G.tradePrep[k] = Math.max(0, G.tradePrep[k] - n); if (!G.tradePrep[k]) delete G.tradePrep[k]; }
  w.qty -= n; G.coins += pay; G.stats.earned += pay; G.stats.traded = (G.stats.traded || 0) + n; marketSold(k, n);
  G.traderRep = (G.traderRep || 0) + 0.2;
  Sound.coin(); toast(`${t.name} koupil ${n}× ${itemName(k).toLowerCase()} za ${pay} mincí`);
  tutEvent('trade');
};
ACTIONS.tbuy = arg => {
  const [tid, idx] = arg.split(':'), t = (G.traders || []).find(x => x.id === +tid); if (!t) return;
  const s = t.sells[+idx]; if (!s) return;
  const hub = tradeHub(t); if (!hub) return;
  if (s.bp) {
    if (G.coins < s.price) { toast('Málo mincí.'); Sound.nope(); return; }
    G.coins -= s.price; G.flags['bp_' + s.bp] = true; t.sells.splice(+idx, 1);
    banner('Nový plán: ' + B[s.bp].n, 'Najdeš ho ve stavění mezi ozdobami.'); Sound.unlock(); return;
  }
  const n = Math.min(5, s.qty); if (!n) return;
  if (G.coins < s.price * n) { toast('Málo mincí.'); Sound.nope(); return; }
  G.coins -= s.price * n; s.qty -= n; hub.out[s.item] = (hub.out[s.item] || 0) + n; jobsDirty = true;
  Sound.coin(); toast(`Koupeno ${n}× ${itemName(s.item).toLowerCase()} — kočky to odnesou do skladu.`);
};
function tradeHub(t) { return BLIST.find(b => b.built && (t.kind === 'lod' ? b.type === 'pristav' : b.type === 'namesti')); }
EXTRA_TABS.trade = () => {
  if (eraOf() < 1) return `<p class="muted">Obchod se otevře v éře ${ERAS[1].n} (${ERAS[1].hint}).</p>`;
  let h = '';
  const sq = BLIST.find(b => b.type === 'namesti' && b.built);
  if (!sq) h += `<p class="muted">Postav <b>Tržní náměstí</b> (Stavět → Výroba). Karavany přijíždějí každé 1–3 dny.</p>`;
  const trs = G.traders || [];
  if (sq && !trs.length) h += `<p class="muted">Teď tu nikdo není. Karavana přijede za ${Math.max(1, G.caravanT || 1)} dny.</p>`;
  for (const t of trs) {
    const hub = tradeHub(t), left = Math.max(0, (t.leave - G.t) / DAY);
    h += `<div class="order"><div class="ohead">${animalIcon(t.sp, 2)}<div><b>${t.name}</b><small>${ANIMALS[t.sp].n} · ${SPECS[t.spec].n} · ${t.kind === 'lod' ? 'loď' : 'karavana'} · odjede za ${left >= 1 ? left.toFixed(1).replace('.', ',') + ' dne' : Math.round(left * 24) + ' h'}</small></div></div>`;
    h += '<h4>Chce koupit</h4>';
    for (const w of t.wants) {
      const have = hub ? hub.inp[w.item] || 0 : 0, prep = (G.tradePrep || {})[w.item] || 0;
      h += `<div class="srow">${itemIcon(w.item)}<span class="sn">${itemName(w.item)} <small>${traderPrice(t, w)} za kus ${trendArrow(w.item)} · chce ${w.qty}</small></span><b>${have}</b>
        <button class="tog ${prep ? 'on' : ''}" data-act="prep" data-arg="${w.item}:${prep ? 0 : w.qty}">${prep ? 'nosí se' : 'připravit'}</button>
        <button class="tog buy" data-act="tsell" data-arg="${t.id}:${w.item}" ${have && w.qty ? '' : 'disabled'}>prodat</button></div>`;
    }
    if (t.sells.length) {
      h += '<h4>Prodává</h4>';
      t.sells.forEach((s, i) => {
        if (s.bp) h += `<div class="srow">${icon('map', 2)}<span class="sn">Plán: ${B[s.bp].n} <small>${B[s.bp].desc}</small></span><b></b><span></span><button class="tog buy" data-act="tbuy" data-arg="${t.id}:${i}">${s.price}</button></div>`;
        else h += `<div class="srow">${itemIcon(s.item)}<span class="sn">${itemName(s.item)} <small>${s.price} za kus · zbývá ${s.qty}</small></span><b></b><span></span><button class="tog buy" data-act="tbuy" data-arg="${t.id}:${i}" ${s.qty ? '' : 'disabled'}>koupit 5</button></div>`;
      });
    }
    h += '</div>';
  }
  h += `<p class="muted">„připravit“ = kočky začnou nosit zboží na ${sq || !trs.some(t => t.kind === 'lod') ? 'náměstí' : 'přístav'}. Cena klesá, když stejné zboží prodáváš často (▼), a v zimě je větší chuť na perník a polévku (▲).</p>`;
  return h;
};
/* trader standing at the square */
ENT_HOOKS.push((E, t) => {
  if (!G.traders || !G.traders.length) return;
  for (const tr of G.traders) {
    const hub = tradeHub(tr); if (!hub || tr.kind !== 'karavana') continue;
    const x = hub.x * TS + 24, y = hub.y * TS + 30;
    E.push([y, 9, 0, 0, g => {
      shape(g, [[x + 6, y - 12, 16, 8, '#a8693e'], [x + 5, y - 16, 18, 4, '#fff3dc']]); R(g, '#e8484e', x + 5, y - 16, 18, 1);
      odisc(g, x + 9, y - 3, 2, '#6b4128'); odisc(g, x + 19, y - 3, 2, '#6b4128');
      const a = ANIMALS[tr.sp].spr; g.drawImage(a.c, x - a.w + 4, y - a.h + Math.round(Math.sin(t * 2)));
    }]);
  }
});
