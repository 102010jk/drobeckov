# Drobečkov 🐾

Útulná pixelová hra o kočičí osadě v nekonečném údolí. Kočky pečou chléb, nosí suroviny, staví domky a ty rozhoduješ, co a kde postavit, kdo kde pracuje a jak přežít zimu.

**▶ Hrát v prohlížeči:** https://102010jk.github.io/drobeckov/

Nic se neinstaluje — funguje v každém moderním prohlížeči (i ve škole). Hra se ukládá do prohlížeče; na jiný počítač ji přeneseš přes **Menu → Export** a **Import**.

## Co ve hře je
- Nekonečný procedurální svět (louky, lesy, řeky, jezera, moře, hory s rudami) a pozemky na koupi
- Kočky s povahami, náladou, spánkem a jídlem, které samy nosí suroviny mezi dílnami
- Farmářské řetězce: pšenice → mouka → chléb, džemy, perník, dorty…
- Sousedé se srdíčky, zakázky, tržní stánek, sezóny se slavnostmi, zima bez úrody
- Zajímavá místa k objevení, tutoriál, kočičí příručka, více uložených her

## Ovládání
| Akce | Klávesa / myš |
|---|---|
| posun mapy | táhni myší, WASD, šipky |
| zoom | kolečko, + / − |
| vybrat / postavit | levé tlačítko |
| zrušit | pravé tlačítko, Esc |
| pauza / rychlost | mezerník, 1–3 |
| bourání | X |
| pozemky | L |

## Spuštění lokálně
```bash
node serve.mjs
```
a otevři http://localhost:5190

Změny najdeš v [CHANGELOG.md](CHANGELOG.md), plán dalšího vývoje v [DESIGN.md](DESIGN.md).

Čistý JavaScript + canvas, bez knihoven. Starší verze 1.0 je ve složce [`v1/`](v1/).
