# Composition matrix — T1 lean × verb (course-correction W3-A)

Generated 2026-10-05T22:28Z at `8deb861d` by `server/bench/compositionReport.ts` from `matrix-boss.jsonl` (16500 fights) and `matrix-lanes.jsonl` (0 lane runs). after: feat/legibility 8deb861d (A+B+C), boss lab only, 10 seeds

**What a row is.** A weapon's T1 LEAN (row 1) and T1 VERB (row 2), bought through the real
economy handler, worn by one of the six tutorial classes on that weapon's own T1 form —
nine pairs per weapon, plus a no-band CONTROL (the same form, no cards). Every class may
wear every T1 weapon (no class or range gate), so the cross is complete: 5 weapons × 6
classes × 10 rows.

**Uplift** is against that control, never across classes: on the **lane bench**, kills per
minute on the weapon's home-biome family-dominated nodes (pooled over seeds, median over
nodes); in the **boss lab**, mean boss DPS (HP removed per fight-second) on the same boss
and seeds (median over the five bosses). A (weapon, pair) reading is the median over the
six classes. **Fires/min** is the verb card's landed `card-fx` events per minute of
farming (lanes, sim time) or fight (boss) time — 0 means the moment never paid out.

**Judgments.** Design §24.1's viability floor: no pair below **0.9×** the median pair of
its instrument (T1 is the only tier measured). Outliers are listed above **1.5×** and below
0.9× of that median — the 1.5× list is a reading, never a failure.

## Boss lab — summary

16500 rows. Median pair uplift **+15.8%**; floor (0.9×) **+14.2%**; outlier ceiling (1.5×) **+23.6%**. Below the floor: **21** of 50 pairs; above 1.5×: **14**.

## Lane bench — summary

0 rows. Median pair uplift **—**; floor (0.9×) **—**; outlier ceiling (1.5×) **—**. Below the floor: **0** of 50 pairs; above 1.5×: **0**. **The median is not positive.**

## Broadsword — Iron Broadsword (`iron-broadsword`, home plains) — lanes technique (Sigil Shard), kill-chain (Bone Shard), empowered (Anvil Shard)

**boss lab** — median uplift over the six classes · verb fires/min (rows: lean; columns: rank; verb: technique)

| lean ↓ / rank → | I | II | III |
|---|---:|---:|---:|
| **attack** | +11.8% · 13.1 | +13.7% · 13.2 | +18.8% · 13.1 |
| **speed** | +13.5% · 13.2 | +16.7% · 13.2 | +16.7% · 13.1 |
| **effect** | +5.8% · 14.3 | +5.9% · 15.0 | +6.7% · 15.4 |
| *verb alone* | +5.1% · 13.1 | | |

**lane bench** — median uplift over the six classes · verb fires/min (rows: lean; columns: rank; verb: technique)

| lean ↓ / rank → | I | II | III |
|---|---:|---:|---:|
| **attack** | — · — | — · — | — · — |
| **speed** | — · — | — · — | — · — |
| **effect** | — · — | — · — | — · — |
| *verb alone* | — · — | | |

<details><summary>boss lab: per class (uplift; losses pair/control; wins)</summary>

| class | attack-1×technique | attack-2×technique | attack-3×technique | speed-1×technique | speed-2×technique | speed-3×technique | effect-1×technique | effect-2×technique | effect-3×technique | none×technique |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| striker | +9.7% (86% vs 52%) | +14.2% (88% vs 52%) | +18.2% (88% vs 52%) | +11.9% (90% vs 52%) | +11.9% (90% vs 52%) | +11.9% (90% vs 52%) | +5.8% (68% vs 52%) | +5.9% (74% vs 52%) | +5.9% (74% vs 52%) | +5.0% (64% vs 52%) |
| squire | +12.0% (100% vs 64%) | +13.1% (100% vs 64%) | +19.5% (100% vs 64%) | +18.6% (100% vs 64%) | +18.6% (100% vs 64%) | +23.5% (100% vs 64%) | +5.8% (88% vs 64%) | +5.6% (78% vs 64%) | +6.7% (92% vs 64%) | +4.5% (72% vs 64%) |
| slinger | +12.9% (80% vs 80%) | +13.3% (80% vs 80%) | +13.3% (80% vs 80%) | +20.0% (90% vs 80%) | +20.0% (90% vs 80%) | +20.0% (90% vs 80%) | +6.9% (80% vs 80%) | +7.3% (80% vs 80%) | +7.9% (80% vs 80%) | +5.2% (80% vs 80%) |
| spirit | +11.5% (100% vs 88%) | +14.4% (100% vs 88%) | +19.4% (100% vs 88%) | +5.6% (98% vs 88%) | +18.3% (100% vs 88%) | +18.3% (100% vs 88%) | +6.2% (98% vs 88%) | +5.7% (98% vs 88%) | +8.0% (100% vs 88%) | +5.6% (98% vs 88%) |
| apprentice | +6.6% (94% vs 78%) | +8.6% (94% vs 78%) | +10.4% (100% vs 78%) | +4.9% (88% vs 78%) | +8.1% (96% vs 78%) | +8.1% (96% vs 78%) | +5.9% (90% vs 78%) | +6.4% (90% vs 78%) | +6.7% (90% vs 78%) | +4.9% (88% vs 78%) |
| conduit | +13.4% (80% vs 72%) | +15.5% (80% vs 72%) | +20.7% (80% vs 72%) | +15.1% (80% vs 72%) | +15.1% (80% vs 72%) | +15.1% (80% vs 72%) | +5.8% (78% vs 72%) | +5.9% (78% vs 72%) | +6.1% (78% vs 72%) | +5.8% (78% vs 72%) |

⌀ = the verb never fired for that class.

</details>

<details><summary>lane bench: per class (uplift; deaths pair/control)</summary>

| class | attack-1×technique | attack-2×technique | attack-3×technique | speed-1×technique | speed-2×technique | speed-3×technique | effect-1×technique | effect-2×technique | effect-3×technique | none×technique |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| striker | — | — | — | — | — | — | — | — | — | — |
| squire | — | — | — | — | — | — | — | — | — | — |
| slinger | — | — | — | — | — | — | — | — | — | — |
| spirit | — | — | — | — | — | — | — | — | — | — |
| apprentice | — | — | — | — | — | — | — | — | — | — |
| conduit | — | — | — | — | — | — | — | — | — | — |

⌀ = the verb never fired for that class.

</details>

## Rapier — Flash Rapier (`flash-rapier`, home forest) — lanes tempo (Gale Shard), affliction (Venom Shard), engagement (Spark Shard)

**boss lab** — median uplift over the six classes · verb fires/min (rows: lean; columns: rank; verb: tempo)

| lean ↓ / rank → | I | II | III |
|---|---:|---:|---:|
| **attack** | +19.4% · 13.6 | +23.2% · 13.4 | +27.6% · 13.4 |
| **speed** | +15.8% · 14.5 | +15.8% · 14.5 | +21.1% · 16.1 |
| **effect** | +14.4% · 13.3 | +15.0% · 13.4 | +15.7% · 13.4 |
| *verb alone* | +13.0% · 13.6 | | |

**lane bench** — median uplift over the six classes · verb fires/min (rows: lean; columns: rank; verb: tempo)

| lean ↓ / rank → | I | II | III |
|---|---:|---:|---:|
| **attack** | — · — | — · — | — · — |
| **speed** | — · — | — · — | — · — |
| **effect** | — · — | — · — | — · — |
| *verb alone* | — · — | | |

<details><summary>boss lab: per class (uplift; losses pair/control; wins)</summary>

| class | attack-1×tempo | attack-2×tempo | attack-3×tempo | speed-1×tempo | speed-2×tempo | speed-3×tempo | effect-1×tempo | effect-2×tempo | effect-3×tempo | none×tempo |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| striker | +19.9% (98% vs 86%) | +20.4% (100% vs 86%) | +26.4% (100% vs 86%) | +12.0% (98% vs 86%) | +12.0% (98% vs 86%) | +12.0% (98% vs 86%) | +13.0% (98% vs 86%) | +13.4% (98% vs 86%) | +14.2% (98% vs 86%) | +12.0% (98% vs 86%) |
| squire | +19.4% (100% vs 100%) | +22.9% (100% vs 100%) | +26.5% (100% vs 100%) | +26.1% (100% vs 100%) | +26.1% (100% vs 100%) | +26.1% (100% vs 100%) | +13.7% (100% vs 100%) | +14.4% (100% vs 100%) | +14.8% (100% vs 100%) | +11.8% (100% vs 100%) |
| slinger | +29.3% (100% vs 98%) | +32.1% (100% vs 98%) | +40.2% (100% vs 98%) | +15.5% (100% vs 98%) | +15.5% (100% vs 98%) | +15.5% (100% vs 98%) | +16.7% (100% vs 98%) | +17.5% (100% vs 98%) | +18.1% (100% vs 98%) | +15.5% (100% vs 98%) |
| spirit | +19.5% (100% vs 100%) | +23.6% (100% vs 100%) | +28.7% (100% vs 100%) | +14.0% (100% vs 100%) | +14.0% (100% vs 100%) | +35.1% (100% vs 100%) | +15.2% (100% vs 100%) | +15.7% (100% vs 100%) | +16.6% (100% vs 100%) | +14.0% (100% vs 100%) |
| apprentice | +11.2% (100% vs 86%) | +13.0% (100% vs 86%) | +16.0% (100% vs 86%) | +16.1% (100% vs 86%) | +16.1% (100% vs 86%) | +16.1% (100% vs 86%) | +8.6% (96% vs 86%) | +9.3% (96% vs 86%) | +9.8% (100% vs 86%) | +7.1% (96% vs 86%) |
| conduit | +14.4% (100% vs 80%) | +27.7% (100% vs 80%) | +31.3% (100% vs 80%) | +31.3% (100% vs 80%) | +31.3% (100% vs 80%) | +31.3% (100% vs 80%) | +17.9% (100% vs 80%) | +17.9% (100% vs 80%) | +18.6% (100% vs 80%) | +14.4% (100% vs 80%) |

⌀ = the verb never fired for that class.

</details>

<details><summary>lane bench: per class (uplift; deaths pair/control)</summary>

| class | attack-1×tempo | attack-2×tempo | attack-3×tempo | speed-1×tempo | speed-2×tempo | speed-3×tempo | effect-1×tempo | effect-2×tempo | effect-3×tempo | none×tempo |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| striker | — | — | — | — | — | — | — | — | — | — |
| squire | — | — | — | — | — | — | — | — | — | — |
| slinger | — | — | — | — | — | — | — | — | — | — |
| spirit | — | — | — | — | — | — | — | — | — | — |
| apprentice | — | — | — | — | — | — | — | — | — | — |
| conduit | — | — | — | — | — | — | — | — | — | — |

⌀ = the verb never fired for that class.

</details>

## Hammer — Heavy Hammer (`heavy-hammer`, home mountain) — lanes empowered (Anvil Shard), control (Shackle Shard), engagement (Spark Shard)

**boss lab** — median uplift over the six classes · verb fires/min (rows: lean; columns: rank; verb: control)

| lean ↓ / rank → | I | II | III |
|---|---:|---:|---:|
| **attack** | +6.0% · 0.0 | +10.7% · 0.0 | +14.1% · 0.0 |
| **speed** | +7.7% · 0.0 | +10.0% · 0.0 | +10.0% · 0.0 |
| **effect** | +0.0% · 9.8 | +0.0% · 9.9 | +0.0% · 9.9 |
| *verb alone* | +0.0% · 0.0 | | |

**lane bench** — median uplift over the six classes · verb fires/min (rows: lean; columns: rank; verb: control)

| lean ↓ / rank → | I | II | III |
|---|---:|---:|---:|
| **attack** | — · — | — · — | — · — |
| **speed** | — · — | — · — | — · — |
| **effect** | — · — | — · — | — · — |
| *verb alone* | — · — | | |

<details><summary>boss lab: per class (uplift; losses pair/control; wins)</summary>

| class | attack-1×control | attack-2×control | attack-3×control | speed-1×control | speed-2×control | speed-3×control | effect-1×control | effect-2×control | effect-3×control | none×control |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| striker | +6.0% ⌀ (68% vs 56%) | +10.9% ⌀ (88% vs 56%) | +15.1% ⌀ (96% vs 56%) | +11.5% ⌀ (76% vs 56%) | +11.5% ⌀ (76% vs 56%) | +19.2% ⌀ (92% vs 56%) | +2.3% (100% vs 56%) | +0.8% (100% vs 56%) | +1.8% (100% vs 56%) | +0.0% ⌀ (56% vs 56%) |
| squire | +6.0% ⌀ (100% vs 100%) | +9.0% ⌀ (100% vs 100%) | +14.9% ⌀ (100% vs 100%) | +9.5% ⌀ (100% vs 100%) | +11.6% ⌀ (100% vs 100%) | +16.1% ⌀ (100% vs 100%) | +0.0% (100% vs 100%) | +0.0% (100% vs 100%) | +0.0% (100% vs 100%) | +0.0% ⌀ (100% vs 100%) |
| slinger | +7.5% ⌀ (92% vs 80%) | +12.0% ⌀ (90% vs 80%) | +14.5% ⌀ (100% vs 80%) | +9.6% ⌀ (92% vs 80%) | +9.6% ⌀ (92% vs 80%) | +9.6% ⌀ (92% vs 80%) | -0.1% (100% vs 80%) | -0.3% (100% vs 80%) | -0.1% (100% vs 80%) | +0.0% ⌀ (80% vs 80%) |
| spirit | +2.5% ⌀ (98% vs 88%) | +6.2% ⌀ (100% vs 88%) | +11.3% ⌀ (100% vs 88%) | +5.8% ⌀ (98% vs 88%) | +10.5% ⌀ (98% vs 88%) | +10.5% ⌀ (98% vs 88%) | -0.5% (100% vs 88%) | -0.5% (100% vs 88%) | -0.5% (100% vs 88%) | +0.0% ⌀ (88% vs 88%) |
| apprentice | +2.2% ⌀ (100% vs 100%) | +10.5% ⌀ (100% vs 100%) | +11.4% ⌀ (100% vs 100%) | +3.5% ⌀ (100% vs 100%) | +4.0% ⌀ (100% vs 100%) | +4.0% ⌀ (100% vs 100%) | +0.0% (100% vs 100%) | +0.0% (100% vs 100%) | +0.0% (100% vs 100%) | +0.0% ⌀ (100% vs 100%) |
| conduit | +7.2% ⌀ (78% vs 72%) | +13.0% ⌀ (80% vs 72%) | +13.7% ⌀ (80% vs 72%) | +5.1% ⌀ (76% vs 72%) | +8.8% ⌀ (80% vs 72%) | +8.8% ⌀ (80% vs 72%) | +3.6% (100% vs 72%) | +2.6% (100% vs 72%) | +3.6% (100% vs 72%) | +0.0% ⌀ (72% vs 72%) |

⌀ = the verb never fired for that class.

</details>

<details><summary>lane bench: per class (uplift; deaths pair/control)</summary>

| class | attack-1×control | attack-2×control | attack-3×control | speed-1×control | speed-2×control | speed-3×control | effect-1×control | effect-2×control | effect-3×control | none×control |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| striker | — | — | — | — | — | — | — | — | — | — |
| squire | — | — | — | — | — | — | — | — | — | — |
| slinger | — | — | — | — | — | — | — | — | — | — |
| spirit | — | — | — | — | — | — | — | — | — | — |
| apprentice | — | — | — | — | — | — | — | — | — | — |
| conduit | — | — | — | — | — | — | — | — | — | — |

⌀ = the verb never fired for that class.

</details>

## Axe — Chaotic Axe (`chaotic-axe`, home cave) — lanes tempo (Gale Shard), kill-chain (Bone Shard), empowered (Anvil Shard)

**boss lab** — median uplift over the six classes · verb fires/min (rows: lean; columns: rank; verb: tempo)

| lean ↓ / rank → | I | II | III |
|---|---:|---:|---:|
| **attack** | +19.1% · 6.4 | +22.4% · 6.3 | +28.1% · 6.3 |
| **speed** | +21.4% · 6.8 | +24.7% · 7.1 | +25.9% · 7.1 |
| **effect** | +12.8% · 6.3 | +13.4% · 6.3 | +14.3% · 6.4 |
| *verb alone* | +11.4% · 6.3 | | |

**lane bench** — median uplift over the six classes · verb fires/min (rows: lean; columns: rank; verb: tempo)

| lean ↓ / rank → | I | II | III |
|---|---:|---:|---:|
| **attack** | — · — | — · — | — · — |
| **speed** | — · — | — · — | — · — |
| **effect** | — · — | — · — | — · — |
| *verb alone* | — · — | | |

<details><summary>boss lab: per class (uplift; losses pair/control; wins)</summary>

| class | attack-1×tempo | attack-2×tempo | attack-3×tempo | speed-1×tempo | speed-2×tempo | speed-3×tempo | effect-1×tempo | effect-2×tempo | effect-3×tempo | none×tempo |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| striker | +18.5% (100% vs 86%) | +22.9% (100% vs 86%) | +28.1% (100% vs 86%) | +24.5% (100% vs 86%) | +24.5% (100% vs 86%) | +24.5% (100% vs 86%) | +11.6% (100% vs 86%) | +12.0% (100% vs 86%) | +12.9% (100% vs 86%) | +10.2% (100% vs 86%) |
| squire | +18.3% (100% vs 96%) | +21.9% (100% vs 96%) | +26.4% (100% vs 96%) | +18.4% (100% vs 96%) | +18.4% (100% vs 96%) | +29.2% (100% vs 96%) | +10.7% (100% vs 96%) | +11.2% (100% vs 96%) | +12.1% (100% vs 96%) | +9.7% (100% vs 96%) |
| slinger | +21.9% (100% vs 80%) | +25.0% (100% vs 80%) | +33.6% (100% vs 80%) | +34.3% (100% vs 80%) | +34.3% (100% vs 80%) | +34.3% (100% vs 80%) | +16.7% (94% vs 80%) | +17.2% (94% vs 80%) | +17.5% (98% vs 80%) | +15.2% (90% vs 80%) |
| spirit | +19.7% (100% vs 96%) | +21.5% (100% vs 96%) | +28.0% (100% vs 96%) | +24.8% (100% vs 96%) | +24.8% (100% vs 96%) | +24.8% (100% vs 96%) | +13.9% (100% vs 96%) | +14.8% (100% vs 96%) | +15.6% (100% vs 96%) | +12.5% (100% vs 96%) |
| apprentice | +16.4% (100% vs 98%) | +18.5% (100% vs 98%) | +18.9% (100% vs 98%) | +4.6% (100% vs 98%) | +8.9% (100% vs 98%) | +8.9% (100% vs 98%) | +5.1% (100% vs 98%) | +5.5% (100% vs 98%) | +5.8% (100% vs 98%) | +4.6% (100% vs 98%) |
| conduit | +24.0% (100% vs 100%) | +36.0% (100% vs 100%) | +36.9% (100% vs 100%) | +17.0% (100% vs 100%) | +27.0% (100% vs 100%) | +27.0% (100% vs 100%) | +17.5% (100% vs 100%) | +18.5% (100% vs 100%) | +19.9% (100% vs 100%) | +17.0% (100% vs 100%) |

⌀ = the verb never fired for that class.

</details>

<details><summary>lane bench: per class (uplift; deaths pair/control)</summary>

| class | attack-1×tempo | attack-2×tempo | attack-3×tempo | speed-1×tempo | speed-2×tempo | speed-3×tempo | effect-1×tempo | effect-2×tempo | effect-3×tempo | none×tempo |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| striker | — | — | — | — | — | — | — | — | — | — |
| squire | — | — | — | — | — | — | — | — | — | — |
| slinger | — | — | — | — | — | — | — | — | — | — |
| spirit | — | — | — | — | — | — | — | — | — | — |
| apprentice | — | — | — | — | — | — | — | — | — | — |
| conduit | — | — | — | — | — | — | — | — | — | — |

⌀ = the verb never fired for that class.

</details>

## Dagger — Poison Dagger (`ashbrand-blade`, home swamp) — lanes affliction (Venom Shard), control (Shackle Shard), kill-chain (Bone Shard)

**boss lab** — median uplift over the six classes · verb fires/min (rows: lean; columns: rank; verb: affliction)

| lean ↓ / rank → | I | II | III |
|---|---:|---:|---:|
| **attack** | +51.7% · 10.5 | +52.8% · 10.5 | +53.7% · 10.5 |
| **speed** | +49.1% · 10.5 | +52.2% · 10.7 | +52.3% · 10.7 |
| **effect** | +50.3% · 10.5 | +52.3% · 10.5 | +57.5% · 10.6 |
| *verb alone* | +42.8% · 10.3 | | |

**lane bench** — median uplift over the six classes · verb fires/min (rows: lean; columns: rank; verb: affliction)

| lean ↓ / rank → | I | II | III |
|---|---:|---:|---:|
| **attack** | — · — | — · — | — · — |
| **speed** | — · — | — · — | — · — |
| **effect** | — · — | — · — | — · — |
| *verb alone* | — · — | | |

<details><summary>boss lab: per class (uplift; losses pair/control; wins)</summary>

| class | attack-1×affliction | attack-2×affliction | attack-3×affliction | speed-1×affliction | speed-2×affliction | speed-3×affliction | effect-1×affliction | effect-2×affliction | effect-3×affliction | none×affliction |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| striker | +43.4% (98% vs 74%) | +49.8% (100% vs 74%) | +51.5% (100% vs 74%) | +48.3% (100% vs 74%) | +48.3% (100% vs 74%) | +48.3% (100% vs 74%) | +45.0% (98% vs 74%) | +49.1% (100% vs 74%) | +50.5% (100% vs 74%) | +39.5% (90% vs 74%) |
| squire | +54.2% (100% vs 94%) | +56.0% (100% vs 94%) | +56.9% (100% vs 94%) | +54.4% (100% vs 94%) | +54.4% (100% vs 94%) | +64.5% (100% vs 94%) | +53.7% (100% vs 94%) | +56.4% (100% vs 94%) | +59.2% (100% vs 94%) | +43.2% (100% vs 94%) |
| slinger | +52.3% (100% vs 100%) | +52.6% (100% vs 100%) | +50.3% (100% vs 100%) | +49.9% (100% vs 100%) | +49.9% (100% vs 100%) | +49.9% (100% vs 100%) | +50.5% (100% vs 100%) | +53.1% (100% vs 100%) | +58.4% (100% vs 100%) | +46.3% (100% vs 100%) |
| spirit | +51.2% (100% vs 100%) | +52.9% (100% vs 100%) | +56.0% (100% vs 100%) | +42.4% (100% vs 100%) | +54.7% (100% vs 100%) | +54.7% (100% vs 100%) | +50.1% (100% vs 100%) | +51.5% (100% vs 100%) | +56.5% (100% vs 100%) | +42.4% (100% vs 100%) |
| apprentice | +91.1% (100% vs 64%) | +91.1% (100% vs 64%) | +95.0% (100% vs 64%) | +69.4% (100% vs 64%) | +81.9% (100% vs 64%) | +81.9% (100% vs 64%) | +88.1% (100% vs 64%) | +90.1% (100% vs 64%) | +91.8% (100% vs 64%) | +69.4% (100% vs 64%) |
| conduit | +31.5% (100% vs 80%) | +35.3% (100% vs 80%) | +35.3% (100% vs 80%) | +41.3% (100% vs 80%) | +41.3% (100% vs 80%) | +41.3% (100% vs 80%) | +36.3% (100% vs 80%) | +38.7% (100% vs 80%) | +41.7% (100% vs 80%) | +31.5% (100% vs 80%) |

⌀ = the verb never fired for that class.

</details>

<details><summary>lane bench: per class (uplift; deaths pair/control)</summary>

| class | attack-1×affliction | attack-2×affliction | attack-3×affliction | speed-1×affliction | speed-2×affliction | speed-3×affliction | effect-1×affliction | effect-2×affliction | effect-3×affliction | none×affliction |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| striker | — | — | — | — | — | — | — | — | — | — |
| squire | — | — | — | — | — | — | — | — | — | — |
| slinger | — | — | — | — | — | — | — | — | — | — |
| spirit | — | — | — | — | — | — | — | — | — | — |
| apprentice | — | — | — | — | — | — | — | — | — | — |
| conduit | — | — | — | — | — | — | — | — | — | — |

⌀ = the verb never fired for that class.

</details>

## Outliers (per instrument, T1)

**boss lab.** Pairs: median +15.8%.

- Above 1.5× (14): `rapier` attack-3×tempo +27.6% (1.75×; 13.4/min); `axe` attack-3×tempo +28.1% (1.78×; 6.3/min); `axe` speed-2×tempo +24.7% (1.56×; 7.1/min); `axe` speed-3×tempo +25.9% (1.64×; 7.1/min); `dagger` attack-1×affliction +51.7% (3.28×; 10.5/min); `dagger` attack-2×affliction +52.8% (3.35×; 10.5/min); `dagger` attack-3×affliction +53.7% (3.41×; 10.5/min); `dagger` speed-1×affliction +49.1% (3.12×; 10.5/min); `dagger` speed-2×affliction +52.2% (3.31×; 10.7/min); `dagger` speed-3×affliction +52.3% (3.32×; 10.7/min); `dagger` effect-1×affliction +50.3% (3.19×; 10.5/min); `dagger` effect-2×affliction +52.3% (3.32×; 10.5/min); `dagger` effect-3×affliction +57.5% (3.65×; 10.6/min); `dagger` none×affliction +42.8% (2.71×; 10.3/min)
- Below 0.9× — under the §24.1 floor (21): `broadsword` attack-1×technique +11.8% (0.75×; 13.1/min); `broadsword` attack-2×technique +13.7% (0.87×; 13.2/min); `broadsword` speed-1×technique +13.5% (0.86×; 13.2/min); `broadsword` effect-1×technique +5.8% (0.37×; 14.3/min); `broadsword` effect-2×technique +5.9% (0.37×; 15.0/min); `broadsword` effect-3×technique +6.7% (0.42×; 15.4/min); `broadsword` none×technique +5.1% (0.32×; 13.1/min); `rapier` none×tempo +13.0% (0.82×; 13.6/min); `hammer` attack-1×control +6.0% (0.38×; 0.0/min); `hammer` attack-2×control +10.7% (0.68×; 0.0/min); `hammer` attack-3×control +14.1% (0.89×; 0.0/min); `hammer` speed-1×control +7.7% (0.49×; 0.0/min); `hammer` speed-2×control +10.0% (0.64×; 0.0/min); `hammer` speed-3×control +10.0% (0.64×; 0.0/min); `hammer` effect-1×control +0.0% (0.00×; 9.8/min); `hammer` effect-2×control +0.0% (0.00×; 9.9/min); `hammer` effect-3×control +0.0% (0.00×; 9.9/min); `hammer` none×control +0.0% (0.00×; 0.0/min); `axe` effect-1×tempo +12.8% (0.81×; 6.3/min); `axe` effect-2×tempo +13.4% (0.85×; 6.3/min); `axe` none×tempo +11.4% (0.72×; 6.3/min)

Weapon × class cells (median of the nine pairs): median +15.2%.

- Above 1.5× (8): `rapier` × conduit +23.2% (1.52×); `axe` × slinger +23.5% (1.54×); `dagger` × striker +48.3% (3.18×); `dagger` × squire +55.2% (3.63×); `dagger` × slinger +50.4% (3.32×); `dagger` × spirit +52.2% (3.44×); `dagger` × apprentice +89.1% (5.86×); `dagger` × conduit +37.5% (2.47×)
- Below 0.9× (14): `broadsword` × striker +10.8% (0.71×); `broadsword` × squire +12.6% (0.83×); `broadsword` × slinger +13.1% (0.86×); `broadsword` × spirit +9.7% (0.64×); `broadsword` × apprentice +6.6% (0.44×); `rapier` × striker +13.2% (0.87×); `rapier` × apprentice +12.1% (0.80×); `hammer` × striker +8.4% (0.56×); `hammer` × squire +7.5% (0.49×); `hammer` × slinger +8.6% (0.56×); `hammer` × spirit +4.1% (0.27×); `hammer` × apprentice +2.8% (0.19×); `hammer` × conduit +6.1% (0.40×); `axe` × apprentice +7.3% (0.48×)

**lane bench.** Pairs: median —.

- Above 1.5× (0): none
- Below 0.9× — under the §24.1 floor (0): none

Weapon × class cells (median of the nine pairs): median —.

- Above 1.5× (0): none
- Below 0.9× (0): none

## Firing, refusals, deaths

**boss lab.**

- Verb never fired (pair: classes): `hammer` attack-1×control: striker, squire, slinger, spirit, apprentice, conduit; `hammer` attack-2×control: striker, squire, slinger, spirit, apprentice, conduit; `hammer` attack-3×control: striker, squire, slinger, spirit, apprentice, conduit; `hammer` speed-1×control: striker, squire, slinger, spirit, apprentice, conduit; `hammer` speed-2×control: striker, squire, slinger, spirit, apprentice, conduit; `hammer` speed-3×control: striker, squire, slinger, spirit, apprentice, conduit; `hammer` none×control: striker, squire, slinger, spirit, apprentice, conduit
- Purchases refused: none — every pair bought and slotted both cards
- Losses clearly above the control (> control + max(2, 25%)): none

**lane bench.**

- Verb never fired (pair: classes): none
- Purchases refused: none — every pair bought and slotted both cards
- Deaths clearly above the control (> control + max(2, 25%)): none

