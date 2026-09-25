# Changelog — Drobečkov

Všechny změny hry. Nejnovější nahoře.

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
