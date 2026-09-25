# Changelog — Drobečkov

Všechny změny hry. Nejnovější nahoře.

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
