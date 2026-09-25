'use strict';
/* ============ 3.13: the morning newspaper & the cosiest-town contest ============ */
const JOKES = [
  'Proč kočky nehrají karty? Protože v balíčku je moc gepardů.',
  'Co řekla myš kočce? Nic, utekla.',
  'Víte, proč kočka sedí na klávesnici? Hlídá myš.',
  'Jak se jmenuje kočka, která umí vařit? Kuchmourek.',
  'Proč kočky milují krabice? Protože v nich nejsou zakázky.',
  'Kočka Micka prý zase spala 16 hodin. Redakce potvrzuje: je to rekord týdne.',
  'Co dělá kočka v knihovně? Hledá knihu „Sto způsobů, jak shodit hrnek“.',
  'Náš sportovní zpravodaj hlásí: klubko vlny stále vede nad kočkami 0:0.',
  'Proč kočka nechodí do školy? Protože už umí všechno — hlavně spát.',
  'Poradna: Moje kočka mě ignoruje. Odpověď: To je v pořádku, to je láska.'
];
function newsDay() {
  const today = dayIdx(), items = (G.log || []).filter(([d]) => d >= today - 1).map(([, t]) => t).filter((t, i, a) => a.indexOf(t) === i).slice(0, 5);
  const S = seasonIdx(), f = G.forecast || (Math.random() < SEASONS[S].rain ? (S === 3 ? 'snow' : 'rain') : 'clear');
  const wx = f === 'rain' ? 'déšť — pole se zalijí sama' : f === 'snow' ? 'sněžení — kočky zůstanou raději u kamen' : 'jasno — ideální den na práci';
  const best = G.cats.slice().sort((a, b) => b.mood - a.mood)[0];
  const trader = (G.traders || []).find(t => t.kind === 'karavana');
  return { day: today, no: today + 1, items, wx, best: best ? best.name : '', trader: trader ? trader.name : '', joke: JOKES[today % JOKES.length], coins: Math.floor(G.coins), cats: G.cats.length };
}
MORNING_HOOKS.push(() => { G.news = newsDay(); G.newsRead = false; UI.dirty = true; });
function newsHTML() {
  const n = G.news || newsDay();
  return `<div class="news"><div class="nhead"><b>Drobečkovské noviny</b><small>č. ${n.no} · ${SEASONS[seasonIdx()].name}, den ${dayInSeason()}, rok ${yearIdx()} · cena: jedno pohlazení</small></div>
    <h3>${n.items.length ? n.items[0].split(' — ')[0] : 'Klidný den v osadě ' + G.name}</h3>
    ${n.items.slice(n.items.length ? 1 : 0).map(t => `<p>• ${t}</p>`).join('') || '<p>V osadě se nic zvláštního nestalo. Kočky spokojeně předly.</p>'}
    <div class="ncols"><div><h4>Počasí</h4><p>Dnes: ${n.wx}.</p></div><div><h4>Osada</h4><p>${n.cats} ${n.cats === 1 ? 'kočka' : n.cats < 5 ? 'kočky' : 'koček'}, ${shortNum(n.coins)} mincí v pokladně.${n.best ? ` Nejšťastnější kočkou dne je <b>${n.best}</b>.` : ''}</p></div></div>
    ${n.trader ? `<p><b>Na náměstí je obchodník ${n.trader}!</b></p>` : ''}
    <h4>Kočičí vtip</h4><p><i>${n.joke}</i></p></div>`;
}
HELP.push({ id: 'noviny', n: 'Noviny', t: '' });
const _helpTabN = EXTRA_TABS.help;
EXTRA_TABS.help = () => {
  if (helpPage !== 'noviny') return _helpTabN();
  G.newsRead = true;
  const chips = '<div class="chips">' + HELP.map(p => `<button class="chip-btn ${helpPage === p.id ? 'on' : ''}" data-act="help" data-arg="${p.id}">${p.n}</button>`).join('') + '</div>';
  return chips + '<div class="help-page">' + newsHTML() + contestHTML() + '</div>';
};
/* a small badge on the Příručka tab when fresh news arrive */
let newsT = 0;
STEP_HOOKS.push(dt => { newsT -= dt; if (newsT > 0) return; newsT = 1; const t = document.querySelector('#tabs [data-tab="osada"]'); if (t) t.classList.toggle('ping', !!(G.news && !G.newsRead)); });

/* ---------- cosiest-town contest at the end of every season ---------- */
function contestScore() {
  const cz = coziness(), n = Math.max(1, G.cats.length);
  const mood = G.cats.reduce((a, c) => a + c.mood, 0) / n;
  const decor = new Set(BLIST.filter(b => b.built && B[b.type].cat === 'ozdoby').map(b => b.type)).size;
  const pts = Math.min(40, cz / n * 8) + mood * 0.4 + Math.min(20, decor * 2);
  return { pts: Math.round(pts), stars: pts >= 85 ? 5 : pts >= 70 ? 4 : pts >= 55 ? 3 : pts >= 40 ? 2 : 1, cz, mood: Math.round(mood), decor };
}
MORNING_HOOKS.push(() => {
  if (dayInSeason() !== SDAYS) return;
  const s = contestScore(), prize = [0, 50, 120, 250, 450, 800][s.stars];
  G.coins += prize; G.stats.earned += prize; if (s.stars >= 4) addStars(s.stars - 3, 'za soutěž');
  G.contest = Object.assign({ season: seasonIdx(), year: yearIdx(), prize }, s);
  G.stats.bestContest = Math.max(G.stats.bestContest || 0, s.stars);
  banner(`Soutěž o nejútulnější osadu: ${'★'.repeat(s.stars)}${'☆'.repeat(5 - s.stars)}`, `Porota (sousedé) dala ${s.pts} bodů. Odměna ${prize} mincí${s.stars >= 4 ? ' a hvězdičky' : ''}.`);
});
function contestHTML() {
  const s = contestScore(), last = G.contest;
  return `<div class="news"><div class="nhead"><b>Soutěž o nejútulnější osadu</b><small>vyhlášení poslední den každé sezóny</small></div>
    <p>Kdyby porota hodnotila dnes: <b>${'★'.repeat(s.stars)}${'☆'.repeat(5 - s.stars)}</b> (${s.pts} bodů)</p>
    <p class="muted">Útulnost na kočku ${(s.cz / Math.max(1, G.cats.length)).toFixed(1)} · průměrná nálada ${s.mood} · různých ozdob ${s.decor}. Víc druhů ozdob a spokojené kočky = víc hvězd.</p>
    ${last ? `<p>Minule (${SEASONS[last.season].name.toLowerCase()}, rok ${last.year}): ${'★'.repeat(last.stars)} · odměna ${last.prize} mincí</p>` : ''}</div>`;
}
ACH.push(['soutez', 'Nejútulnější osada', () => (G.stats.bestContest || 0) >= 5]);

/* ---------- "Osada" tab: live pages moved out of the handbook ---------- */
const OSADA_PAGES = ['noviny', 'denik', 'stats', 'uspechy', 'hats'];
let osadaPage = 'noviny';
ACTIONS.opage = id => { osadaPage = id; };
function osadaChips() { return '<div class="chips">' + OSADA_PAGES.map(id => { const p = HELP.find(x => x.id === id); return p ? `<button class="chip-btn ${osadaPage === id ? 'on' : ''}" data-act="opage" data-arg="${id}">${p.n}</button>` : ''; }).join('') + '</div>'; }
const _helpTabO = EXTRA_TABS.help;
EXTRA_TABS.help = () => {
  if (OSADA_PAGES.includes(helpPage)) helpPage = 'zaklady';
  return _helpTabO().replace(/<div class="chips">[\s\S]*?<\/div>/, m => m.replace(new RegExp(`<button class="chip-btn[^"]*" data-act="help" data-arg="(${OSADA_PAGES.join('|')})">[^<]*</button>`, 'g'), ''));
};
EXTRA_TABS.osada = () => {
  const keep = helpPage; helpPage = osadaPage;
  let h = _helpTabO();
  helpPage = keep;
  return h.replace(/<div class="chips">[\s\S]*?<\/div>/, osadaChips());
};
{ const tabs = document.getElementById('tabs'); if (tabs && !tabs.querySelector('[data-tab="osada"]')) { const b = document.createElement('button'); b.dataset.tab = 'osada'; b.textContent = 'Osada'; tabs.appendChild(b); } }
STEP_HOOKS.push(() => { if (UI.tab === 'osada' && osadaPage === 'noviny' && G.news) G.newsRead = true; });
