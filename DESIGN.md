# Drobečkov — design plán

> Útulná pixelová osada koček v údolí. Nejsi továrník, jsi správce údolí.
> Kočky mají jména, povahu a potřeby. Automatizace = kočičí logistika + rozmístění staveb + plánování na sezóny.

## 1. Proč to NENÍ „Roblox tycoon“

| Roblox tycoon | Drobečkov |
|---|---|
| dropper → pás → sběrač → +$ | kočky samy nosí věci mezi stavbami, vzdálenost = čas |
| jediný cíl: číslo roste | cíle: sousedé (vztahy), slavnosti, útulnost, rozšíření údolí |
| upgrade ×2 za 999 $ | žádné násobiče; progres = nové recepty a budovy od sousedů |
| žádná rozhodnutí | trade-offy: co pěstovat v sezóně, co prodat vs. schovat na zimu, kam postavit, kdo kde pracuje |
| stroje | kočky jedí, spí, potřebují domov a hezké okolí; spokojená kočka pracuje rychleji |
| klikání pro peníze | ruční akce jsou jen útulné: pohladit kočku, postavit, rozhodnout |

## 2. Herní smyčky

**Okamžik (desítky sekund)** — pozoruj údolí → najdi úzké hrdlo (bublina „chybí mouka“, plná spižírna, dlouhá cesta) → postav / přesuň / přiřaď kočku / změň recept → pohlaď kočku.

**Den (≈ 2,5 min)** — ráno: počasí, nové zakázky, možná přijde nová kočka → den: výroba, rozvoz, prodej na stánku → večer: kočky se najedí a jdou spát → noc se sama zrychlí.

**Sezóna (4 dny ≈ 10 min)** — jiné plodiny a zakázky → sezónní slavnost (velká sbírka) → odměny: nové území, speciální kočka, ozdoba. **Zima: nic neroste** → musíš mít zásoby (a místo ve spižírnách).

**Dlouhodobě (rok ≈ 40 min+)** — 5 sousedů → srdíčka odemykají recepty a budovy → rozšiřuj údolí (5 zón) → víc koček → delší řetězce (dorty) → krásnější údolí.

## 3. Systémy

### Čas
- 1 den = 144 s (1×). Rychlosti: pauza, 1×, 2×, 4×. Když všechny kočky spí, noc běží 5×.
- Kočky pracují 6:00–21:00, pak se najedí a jdou domů spát.
- Sezóny: Jaro → Léto → Podzim → Zima (4 dny každá). Počasí: déšť (+30 % růst), sníh.

### Kočky (pracovní síla)
- Potřeby: **energie** (spánek, domek je lepší než tráva), **sytost** (jí sušenky > ryby > chléb > mléko ze spižírny), **nálada**.
- Nálada = sytost + spánek + domov + ozdoby kolem domku + pohlazení + hraní (škrabadlo, lavička). Mění rychlost práce 0,6×–1,3×.
- Povahy: Rychlotlapka, Pekař, Zahradník, Silák, Mazel, Spáč, Mlsoun, Rybář, Dřevař → dává smysl, koho kam přiřadit.
- Začínáš se 3 kočkami a 2 domky. Nová kočka přijde ráno, když je volný pelíšek a útulnost ≥ práh (4 + 5 za každou další kočku).
- Priorita úkolů: noc → spánek; hlad → jídlo; přiřazená práce; jinak nejlepší úkol podle priority a vzdálenosti: stavba, pole, odnos výrobků, přínos surovin, zásobování stánku; jinak odpočinek/hraní.

### Logistika
- Každá budova má vstupní a výstupní zásobník. Kočky nosí 3 věci (Silák +1, Košíky od Lišky +2). Vlastní dílnu zásobují přednostně.
- Výrobky jdou přímo do budovy, která je potřebuje; jinak do spižírny (společný sklad, kapacita 50 za spižírnu).
- Cesty = 2× rychlejší chůze. Stavby blokují průchod; stavbu, která by odřízla něčí dveře, hra nedovolí postavit. Řeka jde přejít jen po lávce.
- Rezervace se počítají z úkolů koček → dvě kočky nikdy nejdou pro stejnou věc.

### Stavění
- Budova = staveniště: mince hned, dřevo musí kočky přinést, pak se staví (práce). Ozdoby a cesty jsou okamžité.
- Dřevo: Dřevorubecká chata kácí dospělé stromy v okruhu 5; pařez znovu doroste. Stromky se dají sázet.

### Řetězce
```
Políčko: pšenice / mrkev / jahody / dýně   (každá jen v některých sezónách)
2 Pšenice ─Mlýn→ Mouka ─Pekárna→ Chléb (i kočičí jídlo)
Pšenice ─Kravín→ Mléko
Mouka + Med ─Pekárna→ Perník            Mouka + 2 Jablka ─Pekárna→ Štrúdl
Dýně + Mouka + Mléko ─Pekárna→ Dýňový koláč
3 Jahody ─Zavařovna→ Džem               3 Jablka ─Zavařovna→ Mošt
Ryby + Mouka ─Kuchyňka→ 3× Rybí sušenky (nejlepší kočičí jídlo)
Dýně + Mrkev + Mléko ─Kuchyňka→ Polévka
Džem + 2 Mouka + Mléko ─Cukrárna→ Jahodový dort
2 Mrkev + Mouka + Med + Mléko ─Cukrárna→ Mrkvový dort
Molo (u řeky) → Ryby     Včelín (+ květiny v okolí) → Med     Jabloň → Jablka
```

### Ekonomika
- **Zakázky** na nástěnce (hlavní příjem + srdíčka). Až 4 najednou, platí 1,6× cenu, vyprší po 2 dnech bez trestu.
- **Tržní stánek**: kočka prodavačka + zboží, které označíš k prodeji; zvířátka chodí nakupovat (0,85× cena).
- **Výkup Liškou** (záložka Sklad): 5 kusů hned za polovic — ventil, když je spižírna plná.
- **Útulnost**: ozdoby, domky, stromy → přitahuje nové kočky, zlepšuje náladu.

### Sousedé (vztahy = strom odemykání)
| Soused | Chce | Odemyká |
|---|---|---|
| Babička Ježková | pečivo | ♥1 Kravín · ♥2 Dýňový koláč · ♥4 Cukrárna + Jahodový dort · ♥6 Štrúdl |
| Zajíc Ušák | zelenina | ♥1 Jahody + Dýně · ♥2 Zavařovna · ♥4 Kuchyňka · ♥6 Skleník (roste i v zimě) |
| Medvěd Brumla | sladké | ♥1 Včelín · ♥2 Perník · ♥3 Jabloň · ♥5 Mošt + Mrkvový dort |
| Sova Hůhů | večeře | ♥1 Lucerna · ♥2 Lavička · ♥3 Škrabadlo · ♥5 Fontána |
| Liška Zrzka | drahé zboží | ♥1 Košíky (+2 nošení) · ♥3 Stánek +25 % · ♥5 Kočičí socha |

### Slavnosti (jednou za sezónu, sbírka)
- Jarní slavnost: 8 chléb, 12 mrkev → 300 mincí + zóna Potok (poprvé)
- Letní pouť: 10 jahod, 4 džemy, 6 mléka → 500 mincí + zlatá kočka Zlatíčko
- Dožínky: 16 mouky, 8 dýní, 3 dýňové koláče → 800 mincí + zóna Starý sad
- Vánoční trh: 6 perníků, 4 polévky, 10 chlebů → 1000 mincí + Vánoční stromek

### Údolí (zóny)
Louka (start) · Potok 200 (řeka → molo, lávky) · Starý sad 600 (divoké jabloně) · Mýtina 900 · Jižní louka 1200.

### Úkoly (tutoriál od Babičky Ježkové)
Mlýn → pekárna → 3 chleby → zakázka → dřevorubec (+ přiřadit kočku) → třetí domek → útulnost 9 → čtvrtá kočka → stánek → ♥2 → slavnost.

## 4. Art (převzato z Kočičí sklizně)
- Sprity 1 px obrys `#2b1b2b`, sytá cukrová paleta, světlé odlesky.
- Sezónní palety (tráva, stromy, květiny), přechod sezón přes Bayerův dithering.
- Noc: tmavý závoj s ditherovanými kruhy světla (lucerny, okna).
- Ambient: okvětní lístky, jiskřičky/světlušky, listí, sníh, kouř z komínů, déšť.
- UI: levandulová šachovnice, dřevěné cedule se zkosenými rohy a hřebíčky, máslové nadpisy s obrysem, berry/sky tlačítka, Pixelify Sans.
- Generativní hudba podle sezóny, zvuky: mňau, předení, stavba, mince.

## 5. Technika
- Čisté HTML + canvas, bez knihoven, více JS souborů (core, data, art, audio, world, sim, render, ui, main).
- Svět 30×18 dlaždic po 16 px, celočíselné škálování, vykreslování seřazené podle y.
- A* hledání cest, úkolový systém koček, rezervace odvozené z úkolů.
- Ukládání do localStorage (automaticky), hot-reload snapshot.

## 6. Ladění (výsledek automatických průchodů)
- Simulovaný „hráč-robot“ za 1 rok (16 dní): 5 koček, ~15 zakázek, ~860 mincí, bez hladovění, nálada ~75.
- Opravené pasti: hladová kočka nesměla přestat pracovat (spirála hladu); stavby nesmí odříznout dveře; kočky v „kapse“ vyskočí ven; plná spižírna má ikonu nad budovou.
