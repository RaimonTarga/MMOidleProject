# Composition matrix — T1 lean × verb (course-correction W3-A)

Generated 2026-10-05T21:06Z at `7360e3b0` by `server/bench/compositionReport.ts` from `matrix-boss.jsonl` (15000 fights) and `matrix-lanes.jsonl` (0 lane runs). before: develop 7360e3b0, boss lab only, 10 seeds

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

15000 rows. Median pair uplift **+6.8%**; floor (0.9×) **+6.1%**; outlier ceiling (1.5×) **+10.2%**. Below the floor: **20** of 45 pairs; above 1.5×: **16**.

## Lane bench — summary

0 rows. Median pair uplift **—**; floor (0.9×) **—**; outlier ceiling (1.5×) **—**. Below the floor: **0** of 45 pairs; above 1.5×: **0**. **The median is not positive.**

## Broadsword — Iron Broadsword (`iron-broadsword`, home plains) — lanes technique (Sigil Shard), kill-chain (Bone Shard), empowered (Anvil Shard)

**boss lab** — median uplift over the six classes · verb fires/min (rows: lean; columns: verb)

| lean ↓ / verb → | technique | kill-chain | empowered |
|---|---:|---:|---:|
| **technique** | +5.1% · 13.1 (pure) | +0.0% · 1.2 | +0.8% · 7.6 |
| **kill-chain** | +5.7% · 7.6 | +0.2% · 1.4 (pure) | +6.5% · 7.5 |
| **empowered** | +14.8% · 7.0 | +7.6% · 1.3 | +13.2% · 6.7 (pure) |

**lane bench** — median uplift over the six classes · verb fires/min (rows: lean; columns: verb)

| lean ↓ / verb → | technique | kill-chain | empowered |
|---|---:|---:|---:|
| **technique** | — · — (pure) | — · — | — · — |
| **kill-chain** | — · — | — · — (pure) | — · — |
| **empowered** | — · — | — · — | — · — (pure) |

<details><summary>boss lab: per class (uplift; losses pair/control; wins)</summary>

| class | technique×technique | technique×kill-chain | technique×empowered | kill-chain×technique | kill-chain×kill-chain | kill-chain×empowered | empowered×technique | empowered×kill-chain | empowered×empowered |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| striker | +5.0% (64% vs 52%) | +0.0% (52% vs 52%) | +1.6% (56% vs 52%) | +7.9% (100% vs 52%) | +0.1% (64% vs 52%) | +15.6% (100% vs 52%) | +21.7% (92% vs 52%) | +8.4% (66% vs 52%) | +24.6% (98% vs 52%) |
| squire | +4.5% (72% vs 64%) | +0.0% (64% vs 64%) | +0.9% (66% vs 64%) | +8.9% (100% vs 64%) | +0.3% (64% vs 64%) | +14.6% (100% vs 64%) | +17.4% (100% vs 64%) | +6.4% (92% vs 64%) | +20.9% (100% vs 64%) |
| slinger | +5.2% (80% vs 80%) | +0.0% (80% vs 80%) | +0.4% (80% vs 80%) | +5.7% (100% vs 80%) | +0.5% (80% vs 80%) | +0.1% (100% vs 80%) | +12.2% (80% vs 80%) | +8.5% (80% vs 80%) | +7.0% ⌀ (80% vs 80%) |
| spirit | +5.6% (98% vs 88%) | +0.0% (88% vs 88%) | +0.7% (92% vs 88%) | +5.7% (100% vs 88%) | +0.1% (94% vs 88%) | +9.1% (100% vs 88%) | +18.1% (100% vs 88%) | +7.3% (100% vs 88%) | +15.0% (100% vs 88%) |
| apprentice | +4.9% (88% vs 78%) | +0.0% (82% vs 78%) | -0.1% (78% vs 78%) | +2.8% (100% vs 78%) | +0.1% (100% vs 78%) | +0.5% (100% vs 78%) | +7.1% (98% vs 78%) | +4.4% (94% vs 78%) | +5.1% (92% vs 78%) |
| conduit | +5.8% (78% vs 72%) | +0.0% (72% vs 72%) | +2.8% (70% vs 72%) | +4.3% (98% vs 72%) | +4.4% (78% vs 72%) | +4.0% (100% vs 72%) | +9.5% (78% vs 72%) | +8.0% (78% vs 72%) | +11.4% (78% vs 72%) |

⌀ = the verb never fired for that class.

</details>

<details><summary>lane bench: per class (uplift; deaths pair/control)</summary>

| class | technique×technique | technique×kill-chain | technique×empowered | kill-chain×technique | kill-chain×kill-chain | kill-chain×empowered | empowered×technique | empowered×kill-chain | empowered×empowered |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| striker | — | — | — | — | — | — | — | — | — |
| squire | — | — | — | — | — | — | — | — | — |
| slinger | — | — | — | — | — | — | — | — | — |
| spirit | — | — | — | — | — | — | — | — | — |
| apprentice | — | — | — | — | — | — | — | — | — |
| conduit | — | — | — | — | — | — | — | — | — |

⌀ = the verb never fired for that class.

</details>

## Rapier — Flash Rapier (`flash-rapier`, home forest) — lanes tempo (Gale Shard), affliction (Venom Shard), engagement (Spark Shard)

**boss lab** — median uplift over the six classes · verb fires/min (rows: lean; columns: verb)

| lean ↓ / verb → | tempo | affliction | engagement |
|---|---:|---:|---:|
| **tempo** | +15.8% · 14.5 (pure) | +5.8% · 0.0 | +5.7% · 2.7 |
| **affliction** | +19.6% · 13.4 | +12.5% · 10.7 (pure) | +9.0% · 2.6 |
| **engagement** | +26.9% · 13.4 | +11.8% · 0.0 | +11.6% · 2.7 (pure) |

**lane bench** — median uplift over the six classes · verb fires/min (rows: lean; columns: verb)

| lean ↓ / verb → | tempo | affliction | engagement |
|---|---:|---:|---:|
| **tempo** | — · — (pure) | — · — | — · — |
| **affliction** | — · — | — · — (pure) | — · — |
| **engagement** | — · — | — · — | — · — (pure) |

<details><summary>boss lab: per class (uplift; losses pair/control; wins)</summary>

| class | tempo×tempo | tempo×affliction | tempo×engagement | affliction×tempo | affliction×affliction | affliction×engagement | engagement×tempo | engagement×affliction | engagement×engagement |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| striker | +12.0% (98% vs 86%) | +0.0% ⌀ (86% vs 86%) | +2.0% (88% vs 86%) | +17.1% (98% vs 86%) | +10.6% (94% vs 86%) | +8.8% (92% vs 86%) | +24.3% (100% vs 86%) | +8.5% ⌀ (92% vs 86%) | +11.0% (96% vs 86%) |
| squire | +26.1% (100% vs 100%) | +11.6% ⌀ (100% vs 100%) | +13.3% (100% vs 100%) | +19.0% (100% vs 100%) | +11.2% (100% vs 100%) | +9.3% (100% vs 100%) | +27.2% (100% vs 100%) | +9.8% ⌀ (100% vs 100%) | +10.6% (100% vs 100%) |
| slinger | +15.5% (100% vs 98%) | +0.0% ⌀ (98% vs 98%) | +1.0% (100% vs 98%) | +25.4% (100% vs 98%) | +14.4% (100% vs 98%) | +10.7% (100% vs 98%) | +32.3% (100% vs 98%) | +15.0% ⌀ (100% vs 98%) | +15.8% (100% vs 98%) |
| spirit | +14.0% (100% vs 100%) | +0.0% ⌀ (100% vs 100%) | +1.8% (100% vs 100%) | +20.2% (100% vs 100%) | +11.9% (100% vs 100%) | +11.1% (100% vs 100%) | +34.3% (100% vs 100%) | +13.2% ⌀ (100% vs 100%) | +15.1% (100% vs 100%) |
| apprentice | +16.1% (100% vs 86%) | +14.8% (100% vs 86%) | +9.5% (98% vs 86%) | +11.2% (100% vs 86%) | +51.0% (100% vs 86%) | +6.0% (98% vs 86%) | +13.0% (100% vs 86%) | +11.9% (100% vs 86%) | +7.2% (96% vs 86%) |
| conduit | +31.3% (100% vs 80%) | +13.0% ⌀ (100% vs 80%) | +13.5% (100% vs 80%) | +22.7% (100% vs 80%) | +13.1% (100% vs 80%) | +8.7% (96% vs 80%) | +26.5% (100% vs 80%) | +11.7% ⌀ (80% vs 80%) | +12.2% (80% vs 80%) |

⌀ = the verb never fired for that class.

</details>

<details><summary>lane bench: per class (uplift; deaths pair/control)</summary>

| class | tempo×tempo | tempo×affliction | tempo×engagement | affliction×tempo | affliction×affliction | affliction×engagement | engagement×tempo | engagement×affliction | engagement×engagement |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| striker | — | — | — | — | — | — | — | — | — |
| squire | — | — | — | — | — | — | — | — | — |
| slinger | — | — | — | — | — | — | — | — | — |
| spirit | — | — | — | — | — | — | — | — | — |
| apprentice | — | — | — | — | — | — | — | — | — |
| conduit | — | — | — | — | — | — | — | — | — |

⌀ = the verb never fired for that class.

</details>

## Hammer — Heavy Hammer (`heavy-hammer`, home mountain) — lanes empowered (Anvil Shard), control (Shackle Shard), engagement (Spark Shard)

**boss lab** — median uplift over the six classes · verb fires/min (rows: lean; columns: verb)

| lean ↓ / verb → | empowered | control | engagement |
|---|---:|---:|---:|
| **empowered** | +14.4% · 4.4 (pure) | +6.6% · 0.0 | +10.8% · 2.6 |
| **control** | +0.0% · 5.1 | -0.0% · 9.9 (pure) | -0.1% · 2.5 |
| **engagement** | +18.4% · 4.3 | +4.7% · 0.0 | +8.0% · 2.7 (pure) |

**lane bench** — median uplift over the six classes · verb fires/min (rows: lean; columns: verb)

| lean ↓ / verb → | empowered | control | engagement |
|---|---:|---:|---:|
| **empowered** | — · — (pure) | — · — | — · — |
| **control** | — · — | — · — (pure) | — · — |
| **engagement** | — · — | — · — | — · — (pure) |

<details><summary>boss lab: per class (uplift; losses pair/control; wins)</summary>

| class | empowered×empowered | empowered×control | empowered×engagement | control×empowered | control×control | control×engagement | engagement×empowered | engagement×control | engagement×engagement |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| striker | +22.3% (98% vs 56%) | +8.0% ⌀ (70% vs 56%) | +13.6% (94% vs 56%) | +0.0% (44% vs 56%) | +0.8% (100% vs 56%) | -0.0% (56% vs 56%) | +33.5% (98% vs 56%) | +4.9% ⌀ (60% vs 56%) | +8.8% (74% vs 56%) |
| squire | +29.4% (100% vs 100%) | +6.0% ⌀ (100% vs 100%) | +11.6% (100% vs 100%) | +0.0% (100% vs 100%) | -0.0% (100% vs 100%) | +0.0% (100% vs 100%) | +41.6% (100% vs 100%) | +3.2% ⌀ (100% vs 100%) | +7.9% (100% vs 100%) |
| slinger | +7.5% ⌀ (92% vs 80%) | +7.5% ⌀ (92% vs 80%) | +10.6% (90% vs 80%) | +0.0% (90% vs 80%) | -0.3% (100% vs 80%) | -0.1% (90% vs 80%) | +4.5% ⌀ (86% vs 80%) | +4.5% ⌀ (86% vs 80%) | +8.0% (88% vs 80%) |
| spirit | +14.8% (100% vs 88%) | +4.4% ⌀ (98% vs 88%) | +11.0% (100% vs 88%) | -0.5% (100% vs 88%) | -0.5% (100% vs 88%) | -0.5% (94% vs 88%) | +20.0% (100% vs 88%) | +4.8% ⌀ (98% vs 88%) | +5.3% (100% vs 88%) |
| apprentice | +3.4% (100% vs 100%) | +2.2% ⌀ (100% vs 100%) | +3.5% (100% vs 100%) | -0.2% (100% vs 100%) | +0.0% (100% vs 100%) | +0.0% (100% vs 100%) | +3.4% (100% vs 100%) | +1.5% ⌀ (100% vs 100%) | +3.7% (100% vs 100%) |
| conduit | +14.0% (80% vs 72%) | +7.3% ⌀ (80% vs 72%) | +8.8% (80% vs 72%) | +2.9% (96% vs 72%) | +2.6% (100% vs 72%) | -0.6% (80% vs 72%) | +16.9% (82% vs 72%) | +7.2% ⌀ (78% vs 72%) | +8.4% (80% vs 72%) |

⌀ = the verb never fired for that class.

</details>

<details><summary>lane bench: per class (uplift; deaths pair/control)</summary>

| class | empowered×empowered | empowered×control | empowered×engagement | control×empowered | control×control | control×engagement | engagement×empowered | engagement×control | engagement×engagement |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| striker | — | — | — | — | — | — | — | — | — |
| squire | — | — | — | — | — | — | — | — | — |
| slinger | — | — | — | — | — | — | — | — | — |
| spirit | — | — | — | — | — | — | — | — | — |
| apprentice | — | — | — | — | — | — | — | — | — |
| conduit | — | — | — | — | — | — | — | — | — |

⌀ = the verb never fired for that class.

</details>

## Axe — Chaotic Axe (`chaotic-axe`, home cave) — lanes tempo (Gale Shard), kill-chain (Bone Shard), empowered (Anvil Shard)

**boss lab** — median uplift over the six classes · verb fires/min (rows: lean; columns: verb)

| lean ↓ / verb → | tempo | kill-chain | empowered |
|---|---:|---:|---:|
| **tempo** | +21.4% · 6.8 (pure) | +8.8% · 1.4 | +24.1% · 7.2 |
| **kill-chain** | +6.8% · 6.0 | +0.2% · 1.4 (pure) | +7.8% · 6.7 |
| **empowered** | +18.3% · 6.3 | +8.6% · 1.5 | +15.7% · 6.5 (pure) |

**lane bench** — median uplift over the six classes · verb fires/min (rows: lean; columns: verb)

| lean ↓ / verb → | tempo | kill-chain | empowered |
|---|---:|---:|---:|
| **tempo** | — · — (pure) | — · — | — · — |
| **kill-chain** | — · — | — · — (pure) | — · — |
| **empowered** | — · — | — · — | — · — (pure) |

<details><summary>boss lab: per class (uplift; losses pair/control; wins)</summary>

| class | tempo×tempo | tempo×kill-chain | tempo×empowered | kill-chain×tempo | kill-chain×kill-chain | kill-chain×empowered | empowered×tempo | empowered×kill-chain | empowered×empowered |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| striker | +24.5% (100% vs 86%) | +10.7% (92% vs 86%) | +31.2% (100% vs 86%) | +6.7% (100% vs 86%) | +0.3% (84% vs 86%) | +17.8% (100% vs 86%) | +18.7% (100% vs 86%) | +8.1% (92% vs 86%) | +24.5% (100% vs 86%) |
| squire | +18.4% (100% vs 96%) | +6.9% (100% vs 96%) | +23.3% (100% vs 96%) | +6.9% (100% vs 96%) | +0.2% (100% vs 96%) | +15.5% (100% vs 96%) | +20.4% (100% vs 96%) | +8.9% (100% vs 96%) | +25.4% (100% vs 96%) |
| slinger | +34.3% (100% vs 80%) | +17.6% (90% vs 80%) | +27.1% (100% vs 80%) | +7.8% (100% vs 80%) | +0.1% (80% vs 80%) | +0.1% (100% vs 80%) | +17.8% (94% vs 80%) | +8.9% (80% vs 80%) | +8.3% ⌀ (80% vs 80%) |
| spirit | +24.8% (100% vs 96%) | +11.2% (100% vs 96%) | +24.8% (100% vs 96%) | +5.7% (100% vs 96%) | +0.2% (98% vs 96%) | +12.5% (100% vs 96%) | +20.9% (100% vs 96%) | +8.4% (100% vs 96%) | +18.6% (100% vs 96%) |
| apprentice | +4.6% (100% vs 98%) | +0.0% (98% vs 98%) | +0.8% (100% vs 98%) | +2.6% (100% vs 98%) | +0.2% (100% vs 98%) | +0.2% (100% vs 98%) | +14.0% (100% vs 98%) | +11.4% (100% vs 98%) | +11.4% ⌀ (100% vs 98%) |
| conduit | +17.0% (100% vs 100%) | +0.0% (100% vs 100%) | +7.4% (100% vs 100%) | +8.2% (100% vs 100%) | +0.4% (100% vs 100%) | +3.2% (100% vs 100%) | +14.9% (100% vs 100%) | +7.5% (100% vs 100%) | +12.8% (100% vs 100%) |

⌀ = the verb never fired for that class.

</details>

<details><summary>lane bench: per class (uplift; deaths pair/control)</summary>

| class | tempo×tempo | tempo×kill-chain | tempo×empowered | kill-chain×tempo | kill-chain×kill-chain | kill-chain×empowered | empowered×tempo | empowered×kill-chain | empowered×empowered |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| striker | — | — | — | — | — | — | — | — | — |
| squire | — | — | — | — | — | — | — | — | — |
| slinger | — | — | — | — | — | — | — | — | — |
| spirit | — | — | — | — | — | — | — | — | — |
| apprentice | — | — | — | — | — | — | — | — | — |
| conduit | — | — | — | — | — | — | — | — | — |

⌀ = the verb never fired for that class.

</details>

## Dagger — Poison Dagger (`ashbrand-blade`, home swamp) — lanes affliction (Venom Shard), control (Shackle Shard), kill-chain (Bone Shard)

**boss lab** — median uplift over the six classes · verb fires/min (rows: lean; columns: verb)

| lean ↓ / verb → | affliction | control | kill-chain |
|---|---:|---:|---:|
| **affliction** | +42.0% · 10.3 (pure) | +3.3% · 0.0 | +3.3% · 1.4 |
| **control** | +0.0% · 10.2 | +0.9% · 9.5 (pure) | -0.1% · 1.4 |
| **kill-chain** | +4.4% · 10.5 | +0.2% · 0.0 | +0.2% · 1.4 (pure) |

**lane bench** — median uplift over the six classes · verb fires/min (rows: lean; columns: verb)

| lean ↓ / verb → | affliction | control | kill-chain |
|---|---:|---:|---:|
| **affliction** | — · — (pure) | — · — | — · — |
| **control** | — · — | — · — (pure) | — · — |
| **kill-chain** | — · — | — · — | — · — (pure) |

<details><summary>boss lab: per class (uplift; losses pair/control; wins)</summary>

| class | affliction×affliction | affliction×control | affliction×kill-chain | control×affliction | control×control | control×kill-chain | kill-chain×affliction | kill-chain×control | kill-chain×kill-chain |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| striker | +41.6% (92% vs 74%) | +3.1% ⌀ (72% vs 74%) | +3.1% (72% vs 74%) | +0.0% (68% vs 74%) | +2.8% (92% vs 74%) | -0.2% (78% vs 74%) | +5.9% (98% vs 74%) | +0.2% ⌀ (68% vs 74%) | +0.2% (70% vs 74%) |
| squire | +42.1% (100% vs 94%) | +3.4% ⌀ (98% vs 94%) | +3.4% (98% vs 94%) | +0.0% (86% vs 94%) | +0.0% (100% vs 94%) | +0.0% (90% vs 94%) | +4.8% (100% vs 94%) | +0.0% ⌀ (82% vs 94%) | +0.0% (92% vs 94%) |
| slinger | +42.8% (100% vs 100%) | +2.7% ⌀ (100% vs 100%) | +2.7% (100% vs 100%) | -0.9% (100% vs 100%) | +0.0% (100% vs 100%) | -0.7% (100% vs 100%) | +1.8% (100% vs 100%) | -0.2% ⌀ (100% vs 100%) | -0.1% (100% vs 100%) |
| spirit | +42.0% (100% vs 100%) | +3.1% ⌀ (100% vs 100%) | +3.1% (100% vs 100%) | +0.0% (100% vs 100%) | +0.0% (100% vs 100%) | -0.1% (100% vs 100%) | +4.0% (100% vs 100%) | +0.2% ⌀ (100% vs 100%) | +0.2% (100% vs 100%) |
| apprentice | +80.2% (100% vs 64%) | +12.8% ⌀ (84% vs 64%) | +12.8% (88% vs 64%) | +1.5% (100% vs 64%) | +1.7% (100% vs 64%) | -0.1% (100% vs 64%) | +2.2% (100% vs 64%) | +0.3% ⌀ (84% vs 64%) | +0.3% (94% vs 64%) |
| conduit | +33.1% (100% vs 80%) | +4.1% ⌀ (80% vs 80%) | +4.1% (80% vs 80%) | +2.2% (100% vs 80%) | +10.3% (100% vs 80%) | +5.5% (86% vs 80%) | +5.1% (100% vs 80%) | +2.9% ⌀ (80% vs 80%) | +5.2% (80% vs 80%) |

⌀ = the verb never fired for that class.

</details>

<details><summary>lane bench: per class (uplift; deaths pair/control)</summary>

| class | affliction×affliction | affliction×control | affliction×kill-chain | control×affliction | control×control | control×kill-chain | kill-chain×affliction | kill-chain×control | kill-chain×kill-chain |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| striker | — | — | — | — | — | — | — | — | — |
| squire | — | — | — | — | — | — | — | — | — |
| slinger | — | — | — | — | — | — | — | — | — |
| spirit | — | — | — | — | — | — | — | — | — |
| apprentice | — | — | — | — | — | — | — | — | — |
| conduit | — | — | — | — | — | — | — | — | — |

⌀ = the verb never fired for that class.

</details>

## Outliers (per instrument, T1)

**boss lab.** Pairs: median +6.8%.

- Above 1.5× (16): `broadsword` empowered×technique +14.8% (2.17×; 7.0/min); `broadsword` empowered×empowered +13.2% (1.94×; 6.7/min); `rapier` tempo×tempo +15.8% (2.32×; 14.5/min); `rapier` affliction×tempo +19.6% (2.89×; 13.4/min); `rapier` affliction×affliction +12.5% (1.84×; 10.7/min); `rapier` engagement×tempo +26.9% (3.95×; 13.4/min); `rapier` engagement×affliction +11.8% (1.74×; 0.0/min); `rapier` engagement×engagement +11.6% (1.71×; 2.7/min); `hammer` empowered×empowered +14.4% (2.12×; 4.4/min); `hammer` empowered×engagement +10.8% (1.59×; 2.6/min); `hammer` engagement×empowered +18.4% (2.71×; 4.3/min); `axe` tempo×tempo +21.4% (3.16×; 6.8/min); `axe` tempo×empowered +24.1% (3.54×; 7.2/min); `axe` empowered×tempo +18.3% (2.69×; 6.3/min); `axe` empowered×empowered +15.7% (2.31×; 6.5/min); `dagger` affliction×affliction +42.0% (6.19×; 10.3/min)
- Below 0.9× — under the §24.1 floor (20): `broadsword` technique×technique +5.1% (0.75×; 13.1/min); `broadsword` technique×kill-chain +0.0% (0.00×; 1.2/min); `broadsword` technique×empowered +0.8% (0.12×; 7.6/min); `broadsword` kill-chain×technique +5.7% (0.84×; 7.6/min); `broadsword` kill-chain×kill-chain +0.2% (0.03×; 1.4/min); `rapier` tempo×affliction +5.8% (0.85×; 0.0/min); `rapier` tempo×engagement +5.7% (0.85×; 2.7/min); `hammer` control×empowered +0.0% (0.00×; 5.1/min); `hammer` control×control -0.0% (-0.00×; 9.9/min); `hammer` control×engagement -0.1% (-0.01×; 2.5/min); `hammer` engagement×control +4.7% (0.69×; 0.0/min); `axe` kill-chain×kill-chain +0.2% (0.03×; 1.4/min); `dagger` affliction×control +3.3% (0.48×; 0.0/min); `dagger` affliction×kill-chain +3.3% (0.48×; 1.4/min); `dagger` control×affliction +0.0% (0.00×; 10.2/min); `dagger` control×control +0.9% (0.13×; 9.5/min); `dagger` control×kill-chain -0.1% (-0.02×; 1.4/min); `dagger` kill-chain×affliction +4.4% (0.65×; 10.5/min); `dagger` kill-chain×control +0.2% (0.03×; 0.0/min); `dagger` kill-chain×kill-chain +0.2% (0.03×; 1.4/min)

Weapon × class cells (median of the nine pairs): median +6.2%.

- Above 1.5× (9): `rapier` × striker +10.6% (1.70×); `rapier` × squire +11.6% (1.87×); `rapier` × slinger +15.0% (2.43×); `rapier` × spirit +13.2% (2.14×); `rapier` × apprentice +11.9% (1.92×); `rapier` × conduit +13.1% (2.11×); `axe` × striker +17.8% (2.87×); `axe` × squire +15.5% (2.49×); `axe` × spirit +12.5% (2.01×)
- Below 0.9× (13): `broadsword` × slinger +5.2% (0.84×); `broadsword` × apprentice +2.8% (0.45×); `broadsword` × conduit +4.4% (0.72×); `hammer` × slinger +4.5% (0.73×); `hammer` × spirit +4.8% (0.78×); `hammer` × apprentice +2.2% (0.35×); `axe` × apprentice +2.6% (0.41×); `dagger` × striker +2.8% (0.45×); `dagger` × squire +0.0% (0.00×); `dagger` × slinger +0.0% (0.00×); `dagger` × spirit +0.2% (0.04×); `dagger` × apprentice +1.7% (0.28×); `dagger` × conduit +5.1% (0.83×)

**lane bench.** Pairs: median —.

- Above 1.5× (0): none
- Below 0.9× — under the §24.1 floor (0): none

Weapon × class cells (median of the nine pairs): median —.

- Above 1.5× (0): none
- Below 0.9× (0): none

## Firing, refusals, deaths

**boss lab.**

- Verb never fired (pair: classes): `broadsword` empowered×empowered: slinger; `rapier` tempo×affliction: striker, squire, slinger, spirit, conduit; `rapier` engagement×affliction: striker, squire, slinger, spirit, conduit; `hammer` empowered×empowered: slinger; `hammer` empowered×control: striker, squire, slinger, spirit, apprentice, conduit; `hammer` engagement×empowered: slinger; `hammer` engagement×control: striker, squire, slinger, spirit, apprentice, conduit; `axe` empowered×empowered: slinger, apprentice; `dagger` affliction×control: striker, squire, slinger, spirit, apprentice, conduit; `dagger` kill-chain×control: striker, squire, slinger, spirit, apprentice, conduit
- Purchases refused: none — every pair bought and slotted both cards
- Losses clearly above the control (> control + max(2, 25%)): hammer|striker|control×empowered 28 vs 22; dagger|squire|control×affliction 7 vs 3; dagger|squire|kill-chain×control 9 vs 3

**lane bench.**

- Verb never fired (pair: classes): none
- Purchases refused: none — every pair bought and slotted both cards
- Deaths clearly above the control (> control + max(2, 25%)): none

