# Changelog — Drobečkov

Všechny změny hry. Nejnovější nahoře.

## 3.8.0 „Velkoměsto“ — 2026-09-25
- **Asfaltová silnice** (Stavět → Cesty, od éry Průmysl): obrubníky, přerušovaná čára uprostřed, přechody u křižovatek, v zimě zasněžená. Kočky po ní běhají 2,5× rychleji.
- **Auta**: po silnicích jezdí osobní auta, taxíky, dodávky a autobusy (s kočičím řidičem). Jezdí vpravo, drží odstup, na křižovatkách zatáčejí, na konci silnice se otočí a v noci svítí. Vlastní pixelové sprity ve složce `assets/auta/`.
- **Městský dům** (Domov, od éry Průmysl): třípatrový dům pro 4 kočky ve 4 barvách fasády. Stavěj je těsně vedle sebe a vznikne souvislá ulice.
- **Letiště** (éra Věda a vesmír, výzkum Vzducholodě): obří stavba 10×6 s terminálem, věží, hangárem a dráhou. Letadla přistávají a startují, každé ráno přivezou turisty, kteří v osadě utratí mince. Kvůli velikosti si na něj většinou musíš koupit další pozemky.
- Domov pro kočky teď zajišťuje každá stavba s pelíšky (nejen kočičí domek) — i koťata.
- **Testovací světy**: vesnice na začátku jsou rozvolněnější a nepravidelné, od Průmyslu vede středem hlavní asfaltová třída, Endgame a Super-endgame jsou skutečná města — asfaltové ulice s auty, bloky městských domů a letiště.
- Debug: tlačítka **+ Auta** a **Přílet turistů**. Příručka má novou stránku **Město**.

## 3.7.0 „Obrázky“ — 2026-09-25
- Budovy můžou mít **vlastní obrázky** (PNG ve složce `assets/budovy/`). Když obrázek existuje, hra ho použije, jinak budovu nakreslí kódem jako dřív. Podle potřeby zvlášť pro sezóny (`.zima`), noc s rozsvícenými okny (`.noc`) a barevné varianty (`.v1`–`.v3`).
- **Nový kočičí domek**: taškovou střechu s kočičíma ušima a kulatým vikýřem, okenice, truhlík s kytkami podle sezóny, dýně na podzim, sníh a rampouchy v zimě, kamenná podezdívka a stín na zemi. Ve 4 barvách.
- **Nová pekárna**: hrázděné zdi, pruhovaná markýza nad výlohou s pečivem, cedule s preclíkem, košík s chlebem.
- Nástroj `tools/sprites.mjs`: převod budov z kódu do PNG, z PNG do textové mřížky a zpátky, zvětšené náhledy.
- Debug → Svět: přepínač **Grafika: obrázky / jen kód** pro porovnání.

## 3.6.0 „Ladicí dílna“ — 2026-09-25
### Debug menu
- Zapneš ho klávesou **F9** nebo klávesou **vlevo od 1** (na české klávesnici „;“), případně v **Menu → Nastavení → Debug menu**. Objeví se nová záložka **Debug**.
- **Mince a sklad**: +1 000 / +10 000 / +100 000 mincí, naplnit nebo vyprázdnit sklad.
- **Postup**: další éra, odemknout vše, sousedé +1 ♥, dostavět všechny stavby, dokončit výzkum, raketa rovnou na rampu, pozemky zdarma.
- **Kočky**: nakrmit a vyspat, přidat 1 nebo 5 koček.
- **Čas a počasí**: +1 hodina, do rána, +1 den, další sezóna, rychlost 8× a 16×; jasno, déšť, sníh, bouřka, duha.
- **Události**: zakázka, splnit slavnost, karavana, padající hvězdy, hledání vajíček, strašidýlka, Vánoce.
- **Svět**: odkrýt mapu, změřit výkon, semínko a počty staveb/koček/chunků.

### Testovací světy
Hotové osady, které se postaví během chvilky a uloží jako nová hra (tvoje hra zůstane). Všechny jsou ve stejném údolí, takže je vidět, jak osada roste:
- **Farma** — jaro, pekárna, mlýn, molo a první 4 kočky.
- **Řemesla a obchod** — pila, cihelna, sklárna, tržní náměstí s karavanou.
- **Hornictví a přístav** — doly na uhlí, železo a měď, tavírny, slévárna, přístav, maják, dílna s lisem.
- **Průmysl** — továrna s výrobní linkou, škola, laboratoř, vědci a inženýři.
- **Věda a vesmír** — elektrárna, větrníky, přistávací věž, zkoumá se raketa.
- **Endgame** — všechno odemčené, 62 koček, raketa na rampě a astronaut připravený k odpočítávání.
- **Super-endgame: Kočičí velkoměsto** — 300 koček, asi 750 staveb, obří výroba všeho (desítky polí, pekáren, dolů, továren) a husté ulice s křižovatkami jako ve skutečném městě. Stavba trvá pár sekund.
- **Po startu rakety** — konec hry za námi, satelit ukazuje celý svět.
- **Kreativní pískoviště** — kreativní režim na velkém pozemku.

Najdeš je v záložce Debug nebo v hlavním menu pod odkazem **Testovací světy** (když je debug zapnutý).

## 3.5.0 „Návštěvy“ — 2026-09-25
- **Navštívit kamaráda** (Menu): vlož kód osady od spolužáka a prohlédni si jeho údolí — kočky, stavby, éru. Můžeš hladit jeho kočky, ale nic nezměníš a nic se neuloží. Tlačítkem **Vrátit se domů** jsi zpátky ve své osadě.
- **Stáhnout soubor**: u Exportu uložíš kód osady do souboru (`.drobeckov.txt`) — třeba na flešku. Import i návštěva umí soubor zase načíst.
- Ve Statistikách je vidět **semínko světa** — pošli ho kamarádovi a bude mít stejné údolí.

## 3.4.0 „Dobroty“ — 2026-09-25
- **Slepičárna** (od začátku) — slepičky za pšenici snáší **vejce**.
- **Sýrárna** (Řemesla a obchod) — z mléka dělá **sýr** (jídlo i zboží).
- **Rajčata** — třetí semínko, které přinese výprava.
- **Pizzerie** — mouka + sýr + rajčata → **pizza**, nejsytější jídlo ve hře a hit u obchodníků.
- **Palačinky** v Kuchyňce (mouka, mléko, vejce, džem) — na jaře se prodávají dráž.
- Sousedé a kuchaři z karavan chtějí nové dobroty, nový úspěch „Pizzaiolo“.

## 3.3.0 „Svátky“ — 2026-09-25
- **Velikonoční hledání vajíček** (2. jarní den): Babička Ježková schová po osadě 8 malovaných vajíček. Každé najdi a klikni na něj — za všechna dostaneš 2 ★ a klobouček **Zaječí ouška**.
- **Dýňová noc** (3. podzimní noc): po osadě poletují hodná **strašidýlka**. Klikni na ně a dají ti bonbón (mince). Za všechna **Dýňová čepička** a 2 ★.
- **Kočičí Vánoce** (3. zimní den): každá kočka dostane dárek (velká radost), osada mince podle počtu koček, **Vánoční čepici** a poprvé i ozdobu **Sněžítko**.
- Sváteční kloboučky se nedají koupit — jen vyhrát.
- 2 nové úspěchy.

## 3.2.1 „Lopata“ — 2026-09-25
- **Terén**: ve Stavět → Cesty můžeš **zasypat mělkou vodu** (vznikne louka) nebo **vykopat jezírko**. Obojí jde táhnout myší. Jezírko nejde vykopat tam, kde by kočkám odřízlo cestu.
- Tutoriál má nový krok o **Cestovatelském stanu a výpravách**.

## 3.2.0 „Herní režimy“ — 2026-09-25
Při zakládání nové osady si vybereš **herní režim**:
- **Klidný** — kočky méně hladoví, začínáš se 700 mincemi, zakázky platí o 20 % víc a pozemky jsou levnější.
- **Normální** — tak, jak je hra myšlená.
- **Náročný** — jen 250 mincí, kočky víc hladoví, dražší pozemky a zakázky platí méně.
- **Kreativní** — **neomezené mince**, všechny éry, výzkumy, plánky i semínka odemčené, **stavby jsou hned hotové**, vylepšení zdarma a kočky nehladoví. Na volné stavění (úspěchy se v něm neplní).

Režim je vidět u uložené hry v menu.

## 3.1.1 „Hra i bez internetu“ — 2026-09-25
- **Offline režim**: po prvním načtení hra funguje i bez připojení (třeba ve škole na slabé Wi-Fi). Nové verze se stáhnou samy, když je internet.
- **Instalace jako aplikace**: v Chromu/Edgi ikonka „Nainstalovat“ v adresním řádku → Drobečkov se otevře ve vlastním okně s kočičí ikonkou.
- Nová pixelová ikonka hry.
- V menu je nápověda i k novým klávesám (Q, Ctrl+Z, P).

## 3.1.0 „Dopisy od sousedů“ — 2026-09-25
### Dopisy
- Sousedé ti posílají **dopisy s prosbami** (záložka Zakázky). Každý má svůj malý **příběh o 3–4 dopisech** — Babička Ježková chystá perník pro vnoučata, Sova píše knihu o hvězdách, Medvěd se chystá k zimnímu spánku…
- Za dopisy dostaneš mince, hvězdičky, srdíčka u souseda a **5 jedinečných ozdob**, které se jinde nedají získat: **Sovina knihovna**, **Bylinková zahrádka**, **Rybníček s lodičkami**, **Medvědí včelí úl** a **Babiččina houpací lavice**.

### Kočky
- Každá kočka má **oblíbené jídlo** (po jeho snědení má radost) a **oblíbenou ozdobu** — když ji má blízko domku, je spokojenější. Najdeš to v detailu kočky.

### Atmosféra
- **Světlušky** za letních nocí (vypnou se v úsporném režimu).

### Úspěchy
- Pilný pisálek, Dárky od sousedů.

## 3.0.0 „Výpravy za obzor“ — 2026-09-25
### Výpravy
- Nová stavba **Cestovatelský stan** (Domov, od éry Řemesla a obchod). Vysílej kočky na **výpravy za obzor**:
  - **krátká** (půl dne, 1 kočka), **dlouhá** (1 den, 2 kočky), **velká** (2 dny, 3 kočky, od éry Hornictví).
  - Na cestu si vezmou jídlo ze skladu, doma musí zůstat aspoň dvě kočky.
  - Vrátí se s mincemi, zbožím (koření, kakao, med, zlato, **staré mapy**…), **semínky nových plodin**, plánky ozdob, hvězdičkami — a občas s **novou kočkou**.
  - Kočky získávají zkušenost **Cestování** a po návratu mají skvělou náladu.

### Nové plodiny a zboží
- **Slunečnice** (léto, podzim) → **Lisovna oleje** → slunečnicový olej.
- **Levandule** (jaro, léto) + olej → **Mýdlárna** → **levandulové mýdlo** (drahé zboží, chtějí ho sousedé i obchodníci).
- **Kočičí lázně** — s mýdlem +8 útulnost a lepší nálada všech koček (spotřebují 1 mýdlo denně).

### Ostatní
- 3 nové úspěchy, stránka Příručky „Výpravy“, aktualizované README.

## 2.9.0 „Vylepšení budov“ — 2026-09-25
### Vylepšování
- Hotové dílny, domky, spižírny a sklady jde **vylepšit až na úroveň 3** (tlačítko v detailu budovy):
  - dílny a doly pracují o **25 % rychleji** za úroveň,
  - domky mají **pelíšek navíc**,
  - spižírny a sklady pojmou o **50 % víc**.
- Úroveň 2 stojí dřevo (první éra) nebo prkna, úroveň 3 cihly a prkna. Vylepšené budovy mají nad střechou zlaté hvězdičky.

### Přehled
- V záložce **Sklad** je nově seznam **budov s problémem** (chybí pracovník, nemá z čeho vyrábět…) a **všech budov** — kliknutím na ni skočíš.

### Opravy
- Tutoriál: krok s novou kočkou odpovídá novému výpočtu útulnosti.
- Nový úspěch „Stavitel“ a stránka Příručky „Vylepšení budov“.

## 2.8.0 „Pohodlné ovládání“ — 2026-09-25
### Ovládání
- **Ctrl+Z** vrátí poslední postavenou stavbu (do 30 s) — i s mincemi a materiálem.
- **Q = kapátko**: najeď myší na budovu a zmáčkni Q — vybere se stejná stavba.
- **Stavět přednostně** — tlačítko u rozestavěné budovy; kočky na ni nosí materiál jako první a staví ji až tři.
- Při psaní do políčka (jméno kočky, název osady, nápis) se už text nepřepisuje.

### Nové
- **Cedulka** — ozdoba, na kterou napíšeš vlastní nápis (ukáže se po najetí myší).
- **Hudba roste s osadou**: každá éra přidá do hudby nový motiv (zvonek dílen, hornické brnkání, tiché tikání strojů, hvězdné cinkání).

### Balanc
- Éra Hornictví: stačí vydělat **4 500** mincí (místo 6 000) + 20 cihel.
- Éra Věda a vesmír: stačí vydělat **28 000** mincí (místo 40 000) + 20 plechů.

## 2.7.1 „Rádce a lepší začátek“ — 2026-09-25
Testoval jsem hru „robotem“, který ji sám hraje od začátku, a opravil místa, kde se dalo zaseknout.

### Nové
- **Rádce** — cedulka vlevo dole na mapě upozorní na největší problém (hlad, plný sklad, chybí pelíšek, málo útulnosti, budova bez pracovníka, blížící se zima bez zásob) a tlačítkem tě rovnou vezme k řešení. Křížkem ho na den umlčíš.

### Balanc
- Když není chleba ani ryby, kočky v nouzi **snědí syrovou úrodu** (jablka, mrkev, dýně, jahody, pšenici) — už nemůžou vyhladovět se skladem plným pšenice.
- **Tržní stánek neprodává poslední jídlo** (nechá kočkám zásobu) ani zboží, které potřebuješ na zakázky z nástěnky.
- Začínáš se **400 mincemi** (místo 250) — hned si postavíš pole, mlýn, pekárnu i dřevorubce.
- Nové kočky přicházejí **snáz** (4. kočka při útulnosti 3, každá další +4).

### Pro vývojáře
- `tools/robot.js` — balanční robot, který hru hraje sám a vypíše report.

## 2.7.0 „Kamarádi a padající hvězdy“ — 2026-09-25
### Kočky
- **Kamarádství** — kočky, které spolu bydlí nebo pracují, se skamarádí. Nejlepší kamarádi mají lepší náladu (hlavně když jsou blízko sebe) a posílají si srdíčka.
- Detail kočky ukazuje **nejlepšího kamaráda, rodiče a koťata** (kliknutím na jméno skočíš na danou kočku).

### Noc
- **Padající hvězdy** — v některé letní (vzácně podzimní) noci padají hvězdy. Klikni na ně a získáš hvězdičku ★ (až 6 za noc).

### Nastavení (Menu → Nastavení)
- Hlasitost **hudby** a **zvuků** zvlášť.
- **Velikost písma a panelů** (malá / normální / větší / velká).
- **Automatické ukládání** — 30 s, 1 min, 3 min, nebo vypnuto.
- **Úsporné efekty** a **omezení na 30 snímků/s** — pro slabší školní počítače a notebooky na baterku.
- Nastavení si pamatuje každý prohlížeč zvlášť.

### Telefony a tablety
- Na úzké obrazovce je mapa vyšší a minimapa menší.

### Úspěchy
- Chytač hvězd, Nerozluční.

## 2.6.0 „Přání a hvězdičky“ — 2026-09-25
### Přání dne
- Každé ráno má **Babička Ježková tři přání** (nahoře v záložce Zakázky): vyrob něco, pohlaď kočky, doruč zakázku, vydělej mince, dostav stavbu, prodej zboží, pohlaď divoké zvířátko…
- Za splněné přání: mince + **hvězdička ★**. Za všechna tři přání dne bonus.

### Hvězdný obchod
- Za hvězdičky: vzácné kloboučky (**Svatozář, Čarodějný klobouk, Kosmická helma, Věneček**) a plány ozdob **Zvonkohra, Hvězdná lampa, Zlatá kočičí socha** (+14 útulnost).

### Divoká zvířátka
- Na kraj osady chodí **ježci, zajíci, lišky, veverky a jezevci** (v noci hlavně ježci a lišky). Klikni na ně — přinesou jablíčko, mrkev, oříšky nebo starou minci.
- Vzácně přijde **zatoulané koťátko** — když máš volný pelíšek, zůstane u tebe.
- **Ptačí budka** láká víc zvířátek.

### Sezónní ozdoby
- **Sněhulák** (jen v zimě, na jaře roztaje), **Dýňová lucerna** (svítí), **Májka**, **Slunečník** — ve své sezóně dávají velkou útulnost.

### Vesmír po startu
- Kosmodrom teď nakládá **zásobovací rakety** pro **Vesmírnou stanici Mňau**: každá = tisíce mincí a 3 hvězdičky. Po páté raketě je stanice hotová (+10 útulnost).

### Ostatní
- **Fotka osady**: klávesa **P** uloží obrázek osady (PNG).
- Nové stránky Příručky: **Ovládání** (všechny klávesy) a **Přání a hvězdičky**.
- 6 nových úspěchů.
- Zkušenosti koček rostou rychleji.

## 2.5.0 „Útulné maličkosti“ — 2026-09-25
### Kočky
- **Koťátka** — když spolu v domku bydlí dvě spokojené kočky (nálada 72+) a je volná postel, ráno se může narodit koťátko. Dva dny je malé a jen si hraje, pak začne pomáhat.
- **Zkušenosti** — kočky se učí prací: farmaření, pečení, řemeslo, hutnictví, věda… Každá úroveň (až ★5) = +8 % rychlost v daném oboru. Hvězdičky jsou vidět v detailu kočky.
- **Kloboučky** — 7 kloboučků (klobouk, mašle, korunka, čepice, helma, cylindr, květina) za mince v detailu kočky. Čistě pro radost.
- **Přejmenování** koček i osady.

### Osada
- **Deník osady** (Příručka → Deník) — všechny důležité události na jednom místě.
- **Statistiky** (Příručka → Statistiky) — graf mincí, koček a útulnosti za poslední dny.
- **Počasí**: občas přijde **bouřka** s blesky (kočky jsou trochu nesvé), po dešti se někdy ukáže **duha** (+nálada).

### Ovládání
- **Dotykový zoom** dvěma prsty (tablety, telefony, školní Chromebooky).

## 2.4.0 „Věda a vesmír“ — 2026-09-25
### Věda
- **Škola** — vyškolí kočku na **Vědce**, **Inženýra** (+40 % v továrnách a hutích) nebo **Astronauta**. Učí se z papíru.
- **Laboratoř** — vědci zkoumají technologie a spotřebovávají **výzkumné sady**: Zápisník přírodovědce (papírna), Technický výkres (montážní stůl), Elektro sada a Hvězdná mapa (pájecí stůl).
- Nová záložka **Výzkum** se **stromem technologií**: Elektřina, Optika, Automatizace, Hliník, Křemík, Elektronika, Vzducholodě, Raketové palivo, Inženýři, Raketová technika.
- Zřícenina hvězdárny urychluje výuku i výzkum, kráter po meteoritu výzkum.

### Elektřina a automatizace
- **Uhelná elektrárna** a **větrné turbíny** (v dešti a v zimě točí víc). Proud je vidět nahoře v liště.
- Po výzkumu **Automatizace** jde u každého stroje v továrně zapnout **automat** — běží bez koček, ale bere proud.
- Nové stroje: **Elektrolyzér** (hliník z bauxitu, raketové palivo), **Pájecí stůl** (obvody, čipy, naváděcí počítač).
- Nové zboží: hliník, **dural**, křemík, obvody, čipy, čočky, baterie, raketové palivo.
- **Pouliční lampa**, **Dalekohled**.

### Vzducholodě
- **Přistávací věž** — přilétají vzducholodě s obchodníky, kteří kupují motory, hračky, šperky a elektroniku za skvělé ceny.

### Vesmír
- **Kosmodrom** a **raketa ve třech stupních** (trupové panely, raketové motory, palivové nádrže, naváděcí počítače, kapsle s polštářkem).
- **Start rakety**: odpočítávání, plameny, kouř, ohňostroj a všechny kočky se radují. Závěrečná obrazovka se statistikami osady.
- Po startu **satelit**: zmizí mraky nad světem a v liště je **předpověď počasí** na zítřek.

### Úspěchy
- 15 úspěchů (Příručka → Úspěchy), od prvního chleba po kočku ve vesmíru.

### Tutoriál
- Kapitoly 6 *Věda* a 7 *Ke hvězdám* — celá hra má teď průvodce od prvního mlýna po raketu.

## 2.3.0 „Továrny“ — 2026-09-25
### Továrny, do kterých se dá vejít
- **Dílna** (na mapě 3×2, uvnitř 8×4) a **Továrna** (na mapě 6×2, uvnitř 12×6, rozšiřitelná až na 20×6).
- Klikni na továrnu → **Vstoupit dovnitř**. Uvnitř se staví:
  - **Pásy** (táhni myší, R otočí) a **rozbočovače**,
  - **Stroje**: Lis (ocel → plech, plech → trubky), Tažírna drátu (měď → drát), Soustruh (ozubená kola, šrouby), Montážní stůl (motory, **rybí konzervy**, plechové hračky), Průmyslová pec (2× rychlejší tavení),
  - **Pracovní místa** — kočka tu stojí a obsluhuje sousední stroje. Počet pracovních míst = počet pracovníků továrny.
- Zboží přichází **vstupní branou** (kočky ho nosí zvenku), hotové výrobky odchází **výstupní branou** a kočky je odnesou.
- Stroj zadrží suroviny, které potřebuje, a nepotřebné propustí dál — jednoduché třídění na lince.
- Interiér má okna do venku (den, noc, sníh) a kočky jsou vidět při práci.
- Nové zboží: plech, trubky, měděný drát, ozubená kola, šrouby, motor, **rybí konzervy** (jídlo na zimu, +60), plechové hračky.

### Tutoriál
- Kapitola 5 *Továrny* — krok za krokem první výrobní linka.

## 2.2.0 „Hornictví a přístav“ — 2026-09-25
### Nová éra: Hornictví a přístav
- **Důl** — staví se na ložisko ve skalách a těží, co pod ním je: uhlí, železnou, měděnou, cínovou nebo zlatou rudu, bauxit.
- **Milíř** — pálí dřevo na uhlí, když poblíž není uhelný důl.
- **Tavírna** — ruda + uhlí → železo, měď, cín, zlato.
- **Slévárna** — slitiny: **ocel** (železo + uhlí) a **bronz** (měď + cín).
- **Kovárna** — hřebíky, nářadí a **šperky** (zlato + sklo).
- **Rybárna** na mořském břehu — loďka loví **mořské ryby** (vydatnější jídlo, +55).
- **Maják** — v noci otáčí paprskem, lodě připlouvají častěji.
- **Přístav** — kotví tu **obchodní lodě** (loď doopravdy připluje z moře). Námořníci kupují velká množství a prodávají kakao, koření, cínovou rudu, bauxit, zlatou rudu a plánky ozdob.
- Nakoupené suroviny se dají dál zpracovat — dovoz odemkne recepty, na které doma nemáš ložiska.

### Cechy a kapitáni
- Nové zakázky od **Cechu stavitelů**, **Hutního cechu** a **Kapitána Vydřičky** (velké lodní zakázky).
- Každá pátá doručená zakázka jednomu cechu = věrnostní odměna a vyšší ceny.

### Tutoriál
- Kapitola 4 *Hornictví a přístav*.

## 2.1.0 „Řemesla a obchod“ — 2026-09-25
### Nová éra: Řemesla a obchod
- **Éry**: hra teď postupuje po érách (Farma → Řemesla → Hornictví → Průmysl → Věda). Nová éra se otevře, když osada vyroste (mince, kočky, slavnosti).
- **Nové suroviny**: prkna, kámen, hlína, cihly, papír, písek, sklo, vlna, látka, polštáře, kakao, koření.
- **Nové stavby**: Pila, Kamenolom (na skalách), Hliniště (na ložisku hlíny), Pískovna (na pláži), Cihelna, Papírna, Sklárna, Ovčín s ovečkami, Tkalcovna, Velký sklad (+160 místa), Kolárna (vozíky: kočky unesou o 3 víc).
- **Polštáře do domků** — kočky v domku s polštáři mají lepší náladu.
- **Dlažba** — kamenná cesta, kočky po ní běhají 2,5× rychleji.
- **Ozdoby**: Altán, Růžový keř.

### Obchod
- **Tržní náměstí** + **karavany obchodníků** každé 1–3 dny. Každý obchodník je vygenerovaný (jméno, druh zvířete, řemeslo) a chce jiné zboží za lepší cenu.
- Nová záložka **Obchod**: „připravit“ = kočky nosí zboží na náměstí, „prodat“ = obchodník ho koupí. Od obchodníků jde **kupovat** suroviny, kakao, koření a **plánky ozdob**.
- **Plánky od sběratelů**: Lampiony, Kašna, Kočičí strom, Houpačka, Větrníček.
- **Dynamické ceny**: když stejné zboží prodáváš často, cena klesá (▼) a pomalu se zotavuje. V zimě je větší chuť na perník a polévku (▲).
- Nové recepty: **Čokoládový dort** (kakao), **Kořeněný perník** (koření).

### Ruch
- Dílny dělají **ruch** v okolí — kočkám v blízkých domcích kazí náladu. Altány, růže a kašny ho tlumí. Bydlení a výrobu se vyplatí oddělit.

### Tutoriál
- Kapitola 3 *Řemesla a obchod*.

## 2.0.0 „Za obzor“ — 2026-09-25
Velký přepis enginu. Staré uložené hry z 1.0 zůstávají netknuté, 2.0 začíná novou osadou.

### Nový svět
- **Nekonečný procedurální svět** ze semínka: louky, lesy, březové háje, mokřady, řeky, jezera, **moře s plážemi**, kopce a hory.
- **Ložiska rud** v kopcích a horách (uhlí, železo, měď, cín, bauxit, zlato), hlína u vody, písek na plážích — připravené pro další éry.
- **Pozemky 8×8** se kupují tlačítkem *Pozemky* (L). Cena roste s velikostí osady a podle krajiny.
- **Zajímavá místa**: zapomenuté truhly, studánky, opuštěné mlýny, zříceniny hvězdáren, staré doly, majáky, kráter po meteoritu, opuštěné osady. Objevíš je koupí pozemku.
- **Větší start**: 4×3 pozemky (4× víc místa než v 1.0), hra sama vybere útulné místo u vody a lesa.
- Stavba **automaticky odstraní stromy a záhony** pod sebou (bez zisku materiálu).
- Mlha nad neprozkoumaným světem, kolíky na hranici pozemků.

### Ovládání
- **Kamera**: posun tažením myši / WASD / šipky, zoom kolečkem (ostré pixely), **minimapa** s klikem.
- Stejné stavění, bourání, výběr koček a budov jako dřív.

### Ukládání
- **Více uložených her** (sloty s miniaturou, sezónou, časem hraní).
- Automatické ukládání každou minutu a každé ráno.
- **Export/Import kódu** — přenos hry mezi počítači (např. domů ↔ škola).
- Nová hra s vlastním **názvem osady** a **semínkem světa**.

### Tutoriál a nápověda
- **Interaktivní tutoriál** s Babičkou Ježkovou (kapitoly *Farma a kočky*, *Pozemky a zima*), zvýrazňuje tlačítka, dá se přeskočit.
- **Kočičí příručka** — nová záložka s vysvětlením všech systémů.

### Výkon (podle zátěžového testu)
- Budovy se kreslí z **cache spritů** (animace zvlášť), stromy z cache.
- Noční světla jako **předkreslená razítka** — noc s desítkami luceren už nezpomaluje.
- **Burza úkolů** pro kočky místo drahého procházení všech budov.
- Vykresluje se jen to, co je vidět.

### Opravy a balanc
- Kočky se umí najíst i přímo z pekárny/rybárny, když je sklad prázdný nebo plný.
- Spižírna pojme 60 věcí.

## 1.0.0 — 2026-09-24
- Útulná kočičí osada na pevné mapě 30×18: farma, mlýn, pekárna, kravín, zavařovna, kuchyňka, cukrárna.
- Kočky s povahami, náladou, spánkem a jídlem; 5 sousedů se srdíčky; 4 sezóny se slavnostmi; zóny údolí.
- Styl převzatý z *Kočičí sklizně*: obrysované sprity, ditherované přechody, dřevěné cedule, generativní hudba.
