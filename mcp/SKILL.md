---
name: drobeckov
description: Play and control the Drobečkov browser game (cozy pixel-art cat-colony builder) through the drobeckov MCP server while the user watches on screen. Use ONLY when the user explicitly asks you to play, control or test Drobečkov (e.g. "hraj Drobečkov", "ovládej Drobečkov", "zahraj si tu kočičí hru", "play Drobečkov"). Never use it for anything else, and never start it on your own.
---

# Drobečkov — hraní přes MCP

Drobečkov je útulná budovatelská hra: kočičí osada v nekonečném údolí. Hraješ ji
nástroji serveru `drobeckov`, hra běží v prohlížeči uživatele a on se dívá.
**Používej tyhle nástroje jen tehdy, když o to uživatel výslovně požádal.**

## Začátek
1. `open_game` — otevře hru v prohlížeči (http://localhost:5191). Počkej, až hlásí „připojená“.
2. `state` — přehled osady. Když chce uživatel novou hru: `new_game` (režimy klid / normal / narocny / kreativ).
3. Mluv s uživatelem česky a krátce mu říkej, co děláš a proč.

## Smyčka hraní
- `state_brief` (levný) / `state` (plný) → rozhodni se → akce (klidně víc najednou přes `batch`) → **`skip_time`** nebo **`simulate_until`** (okamžité přetočení času, funguje i když je okno na pozadí) → znovu `state_brief`.
- `wait` čeká v reálném čase — používej ho jen když chceš, aby se uživatel díval, jak kočky běhají.
- Když čas stojí: `ensure_running`.
- Souřadnice jsou dlaždice. Místo pro stavbu vždy hledej přes `find_spot` (vrací levý horní roh); `map` ukáže okolí.
- Stavba nejdřív vznikne jako staveniště — kočky donesou materiál ze skladu a postaví ji. Potřebuje čas (`wait`).
- Chyby hry (např. „Málo mincí“, „Tenhle pozemek ještě není tvůj“) si přečti a přizpůsob se.
- `advisor` ve `state` jsou rady hry — řeš je prioritně.

## Užitečné nástroje
- **Přehledy**: `orders`, `production_status`, `construction_status`, `explain_building`, `recommend_next_actions`, `events` (jen novinky od kurzoru).
- **Sklad a peníze**: `sell` (hned prodat přebytek), `storage_rules` (např. `{"mrkev":{"sell_excess_over":40},"uhli":{"reserve":30}}`), `trade` (karavany: offers → prepare → sell).
- **Těžba**: `list_deposits`, `prospect_parcel` (i před koupí), `prospect_deposit` (co by důl na x,y těžil), `find_resource`. Nestav doly naslepo.
- **Stavby**: `build_many`, `cancel_construction` (plná vratka), `auto_assign`.
- **Experimenty**: `dry_run` a `simulate_preview` (nanečisto), `checkpoint` save/restore.
- **Automatizace a paměť**: `rules` (když podmínka → příkazy), `notes` (zápisník v uložené hře).
- `action_catalog` vypíše všechny názvy pro obecný nástroj `action`.
- Podmínky (`simulate_until`, `rules`): `storage.ocel >= 15`, `built.dul >= 2 and cats > 8`, `building.42.built == 1`, `hungry > 0`, `storage_used_pct > 90`, `era >= 2`.

## Jak osada roste (strategie)
- **Jídlo první**: pole (pšenice) → Mlýn → Pekárna = chléb. Každá kočka sní ~1 chléb denně. Ryby: Rybářské molo na mělké vodě.
- **Pracovníci**: `assign` kočku do dílny. Nepřiřazené kočky nosí a sklízí — nech jednu dvě volné.
- **Dřevo** jen z Dřevorubecké chaty u stromů. Bez dřeva se nestaví.
- **Nové kočky** přijdou ráno, když je volný pelíšek (Kočičí domek) a dost útulnosti (ozdoby: záhony květin, lucerny…). Viz `coziNeededForNextCat`.
- **Peníze**: zakázky z nástěnky (`deliver_order`), Tržní stánek, slavnost sezóny (`deliver_festival`), `claim_rewards`.
- **Sklad** má kapacitu — když je plný, výroba stojí. Stav Spižírnu / Sklad.
- **Místo**: `parcels` + `buy_parcel` (pozemky 8×8 sousedící s tvými).
- **Éry**: `state.era.nextEraNeeds` říká, co je potřeba. Farma → Řemesla a obchod (pila, cihelna…) → Hornictví a přístav (doly, tavírna, ocel) → Průmysl (továrny) → Město a doprava → Věda a vesmír (laboratoř, `research`, raketa na Kosmodromu).
- **Zima** (4. sezóna) nic neroste — před ní nasyslit chleba.
- `set_speed` 2 nebo 4 zrychlí čas; 1 herní den ≈ 144 s při rychlosti 1.

## Pravidla
- Nemaž uložené hry uživatele a nezakládej novou hru bez vyzvání.
- `action` je pokročilý nástroj (výpravy `expedition "0"`, ohňostroj `fireworks "buy"`, `autodeliver`…) — používej střídmě.
- Po každých pár krocích shrň uživateli pokrok (éra, kočky, mince, co stavíš dál).
