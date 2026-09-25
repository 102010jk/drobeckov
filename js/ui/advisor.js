'use strict';
/* ============ advisor: one friendly hint about the most pressing problem ============ */
const ADV_MUTE = {};
function staffOf(b) { let n = 0; for (const c of G.cats) if (c.job === b.id) n++; return n; }
function advProblems() {
  const P = [], hungry = G.cats.filter(c => c.food < 25).length, food = FOODS.reduce((a, k) => a + (G.stock[k] || 0), 0);
  const firstB = t => BLIST.find(b => b.type === t && b.built);
  if (hungry && !food) {
    const pek = firstB('pekarna'), mlyn = firstB('mlyn');
    if (pek && !staffOf(pek)) P.push(['hunger', `${hungry} ${hungry > 1 ? 'kočky mají' : 'kočka má'} hlad a pekárna nemá pracovníka.`, 'Přiřadit kočku', 'b:' + pek.id]);
    else if (mlyn && !staffOf(mlyn)) P.push(['hunger', 'Kočky mají hlad — mlýn nemá pracovníka, takže není mouka na chleba.', 'Přiřadit kočku', 'b:' + mlyn.id]);
    else if (!pek) P.push(['hunger', 'Kočky mají hlad! Postav mlýn a pekárnu (chléb), nebo molo u vody (ryby).', 'Stavět', 'tab:build']);
    else P.push(['hunger', 'Kočky mají hlad. Chybí pšenice nebo mouka — zkontroluj pole a mlýn.', 'Sklad', 'tab:store']);
  }
  if (storeRoom() <= 0) P.push(['full', 'Sklad je plný — výroba se zastaví. Postav spižírnu nebo prodej přebytky lišce.', 'Sklad', 'tab:store']);
  if ((G.stock.drevo || 0) < 2 && !BLIST.some(b => b.type === 'drevorubec') && BLIST.some(b => !b.built)) P.push(['wood', 'Došlo dřevo a nemáš dřevorubce — stavby stojí.', 'Stavět', 'tab:build']);
  const S = seasonIdx();
  if (S === 2 && dayInSeason() >= 2 && food < G.cats.length * 5) P.push(['winter', `Blíží se zima a jídla je jen ${food}. V zimě nic neroste — napeč chleba do zásoby.`, 'Sklad', 'tab:store']);
  const cz = coziness(), need = needCozy(G.cats.length + 1);
  if (freeBeds() <= 0 && cz >= needCozy(G.cats.length) && !BLIST.some(b => !b.built && B[b.type].beds)) P.push(['beds', 'Nová kočka by přišla, ale nemá pelíšek. Postav kočičí domek.', 'Stavět', 'tab:build']);
  else if (freeBeds() > 0 && cz < needCozy(G.cats.length) && G.cats.length < 12) P.push(['cozy', `Pro další kočku potřebuješ útulnost ${needCozy(G.cats.length)} (máš ${cz}). Květiny, lucerny a ozdoby pomůžou.`, 'Ozdoby', 'bcat:ozdoby']);
  for (const b of BLIST) {
    const d = B[b.type]; if (!b.built || !d.workers || staffOf(b) || d.nodoor) continue;
    if (G.cats.some(c => !c.job && !(c.kitten > G.t))) { P.push(['staff', `${d.n} nemá pracovníka, ale máš volnou kočku.`, 'Přiřadit', 'b:' + b.id]); break; }
  }
  const far = G.cats.filter(c => c.job && c.home && G.bld[c.job] && G.bld[c.home] && typeof homeDist === 'function' && homeDist(c, G.bld[c.home]) > 24);
  if (far.length) { const c = far[0]; P.push(['far', `${c.name} chodí do práce přes půl údolí (${Math.round(homeDist(c, G.bld[c.home]))} políček). Postav domek blíž k dílnám nebo cestu — po ní se běhá 2× rychleji.`, 'Ukázat', 'b:' + c.job]); }
  return P.filter(p => !(ADV_MUTE[p[0]] > G.t));
}
let advT = 0, advCur = null;
STEP_HOOKS.push(dt => {
  advT -= dt; if (advT > 0) return; advT = 2;
  const el = $('advice'); if (!el) return;
  const p = advProblems()[0] || null;
  const key = p ? p[1] : '';
  if (key === (advCur && advCur[1])) return;
  advCur = p;
  if (!p || UI.interior) { el.hidden = true; return; }
  el.hidden = false;
  el.innerHTML = `<span class="adv-ic">!</span><span class="adv-t">${p[1]}</span><button class="btn small chamfer" data-adv="go">${p[2]}</button><button class="adv-x" data-adv="mute" aria-label="Skrýt">×</button>`;
});
document.addEventListener('click', e => {
  const b = e.target.closest('[data-adv]'); if (!b || !advCur || !G) return;
  const [kind, arg] = advCur[3].split(':');
  if (b.dataset.adv === 'mute') { ADV_MUTE[advCur[0]] = G.t + DAY; $('advice').hidden = true; advCur = null; return; }
  if (kind === 'b') { const bl = G.bld[+arg]; if (bl) { UI.select({ kind: 'b', id: bl.id }); centerOn((bl.x + bl.w / 2) * TS, (bl.y + bl.h / 2) * TS); UI.pick = advCur[0] !== 'far'; } }
  else if (kind === 'tab') { UI.tab = arg; UI.sel = null; }
  else if (kind === 'bcat') { UI.tab = 'build'; UI.bcat = arg; UI.sel = null; }
  Sound.click(); renderPane(true);
});
