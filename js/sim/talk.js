'use strict';
/* ============ 4.4: what cats say, and cat birthdays ============ */
function catSays(c) {
  const L = [], job = c.job && G.bld[c.job], S = seasonIdx();
  if (c.kitten > G.t) L.push('Mňau! Až vyrostu, budu největší kočka v údolí!', 'Kde je moje máma? Aha, tady.');
  if (c.food < 25) L.push('Mám takový hlad, že bych snědla i pšenici…', 'Kručí mi v bříšku.');
  if (c.energy < 20) L.push('Jsem strašně unavená. Ještě pět minut…', 'Zzz… cože? Nespím!');
  if (c.mood > 85) L.push('Tohle je nejlepší osada na světě!', 'Předu, předu, předu.');
  if (c.mood < 30) L.push('Nějak mi tu chybí kytky a pohlazení…', 'Dneska nemám svůj den.');
  if (job) L.push(`Práce v budově „${B[job.type].n}“ mě baví.`, `Dneska jsem zase makala. Budova „${B[job.type].n}“ se sama neobslouží!`);
  else L.push('Pomáhám, kde je potřeba. Nošení mě baví!');
  if (typeof bestFriend === 'function') { const bf = bestFriend(c); if (bf) L.push(`${bf[0].name} je moje nejlepší kamarádka.`); }
  if (c.fav) L.push(`Víš, co mám nejradši? ${itemName(c.fav.food)}!`);
  if (c.cwish && typeof cwText === 'function') L.push(`Hrozně bych si přála… ${cwText(c).replace(/^by si dala |^by chtěla /, '')}.`);
  if (c.hat && HATS[c.hat]) L.push(`Líbí se ti můj ${HATS[c.hat].n.toLowerCase()}?`);
  if (G.weather === 'rain') L.push('Déšť je hezký, ale jen když jsem uvnitř.');
  if (G.weather === 'snow' || S === 3) L.push('Brr, zima! Kde je nějaký teplý pelíšek?');
  if (S === 0) L.push('Jaro voní kytkami!'); if (S === 1) L.push('V létě se nejlíp spí na sluníčku.'); if (S === 2) L.push('Padá listí — můžu ho honit!');
  if (c.space) L.push('Byla jsem ve vesmíru! Země je odtamtud modrá jako miska s mlékem.');
  if (c.bday === dayIdx() % (SDAYS * 4)) L.push('Dneska mám narozeniny!');
  return L[(Math.floor(G.t / 20) + c.id) % L.length];
}
const _inspectCatT = inspectCat;
inspectCat = function (c) {
  const h = _inspectCatT(c); if (!c) return h;
  return h.replace(/(<\/div>)/, `$1<p class="says">„${catSays(c)}“</p>`);
};

/* ---------- birthdays: one day of the year per cat ---------- */
const CAKES = ['jahodovy_dort', 'mrkvovy_dort', 'cokoladovy_dort', 'dynovy_kolac', 'pernik', 'palacinky'];
function catBday(c) { if (c.bday == null) c.bday = Math.floor(hashi(c.id, 31, 7) * SDAYS * 4); return c.bday; }
MORNING_HOOKS.push(() => {
  const day = dayIdx() % (SDAYS * 4);
  for (const c of G.cats) {
    if (catBday(c) !== day || c.kitten > G.t) continue;
    const cake = CAKES.find(k => ITEMS[k] && (G.stock[k] || 0) > 0);
    if (cake) {
      takeStock(cake, 1);
      for (const o of G.cats) { o.mood = Math.min(100, o.mood + 6); emote(o, 'heart', 3); }
      c.mood = 100; G.stats.bdays = (G.stats.bdays || 0) + 1;
      banner(`${c.name} má narozeniny!`, `Osada slaví — na stole nechyběl ${itemName(cake).toLowerCase()} a všechny kočky mají radost.`);
    } else {
      c.mood = Math.min(100, c.mood + 10);
      banner(`${c.name} má narozeniny!`, 'Kdyby byl ve skladu dort nebo perník, oslava by byla pro celou osadu.');
    }
  }
});
const _inspectCatB = inspectCat;
inspectCat = function (c) {
  const h = _inspectCatB(c); if (!c) return h;
  const b = catBday(c), S = Math.floor(b / SDAYS), d = b % SDAYS + 1;
  return h + `<div class="kv"><span>Narozeniny</span><b>${SEASONS[S].name}, den ${d}</b></div>`;
};
ACH.push(['narozeniny', 'Všechno nejlepší!', () => (G.stats.bdays || 0) >= 3]);
{ const p = HELP.find(x => x.id === 'kocky'); if (p) p.t += `<p><b>Narozeniny:</b> každá kočka má svůj den v roce (najdeš ho v jejím detailu). Když je ten den ve skladu dort, koláč, perník nebo palačinky, slaví celá osada.</p>`; }
