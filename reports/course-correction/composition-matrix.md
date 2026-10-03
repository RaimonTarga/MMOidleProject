# Composition matrix — T1 lean × verb (course-correction W3-A)

Generated 2026-10-03T18:03Z at `529d9d56` by `server/bench/compositionReport.ts` from `matrix-boss.jsonl` (15000 fights) and `matrix-lanes.jsonl` (9000 lane runs).

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

## Runs

- **Boss lab:** `_t1BossPlan.ts --matrix=composition` → 15,000 fights (5 weapons × 10 rows × 6
  classes × 5 bosses × 10 seeds), 3 shards, **2,569 s** wall, 0 errors. The 1,800 fights of the
  Empowered-lean × non-Empowered-verb pairs (the `mechanic-proxy` payload) were then refought on
  the fixed proxy (commit `9390689c`), 3 shards, 379 s: only 6 Apprentice and 74 Conduit fights
  changed, every other class's were identical. `matrix-boss.jsonl` carries the refought rows.
- **Lane bench:** `compositionLanes.ts` → 9,000 runs (5 weapons × 10 rows × 6 classes × the
  weapon's 3 home-biome family-dominated T1 nodes × 10 seeds, 90 s of sim each), sharded 5 then
  8 ways, **about 88 min (43 min on 5 shards beside the boss lab, 6.5 min on 5 shards after the proxy fix, 38 min on 8 shards)** wall on a box shared with W3-B's six-server sweep (CPU at 100% for most
  of the run). The 120 rows of the proxy pairs measured before the fix were dropped and
  re-measured on it.
- Rows are slimmed to the fields this report reads (the per-second HP track, the loadout and the
  weapon id dropped; the lineage is the id's prefix).

## Findings

**Two code defects, fixed in their own commits.** (1) `hit-nth` counted the Chaotic Axe's
whiffs, so the Axe's Tempo verb fired only on misses (`dcd06e5e`); the matrix measures the fixed
rule. (2) `mechanic-proxy` double-dipped on the DoT root and the Conduit: both announce their
mechanic without spending a charge, before the lineage listeners run, so the proxy then landed on
the same exchange (`9390689c`; 2 of 2 and 20 of 21 real emissions under a proxy on every hit).

**Moments that never fire at T1 — the biggest reading in the matrix.**

- **Control (hit-held): never, in any of the 1,800 boss fights with a Control verb, on any
  class** — no T1 kit slows a boss, and the composition cannot supply the hold: the only payload
  that holds is the Control LEAN's root, which on the Control verb is the pure pair, whose payload
  is the knockdown (a stun, not "held"). Design §24.2's "which the Control payload itself supplies
  once it has fired once" is not what the shipped composition does (`compositionPairs.test.ts`
  block A pins it). On the lane bench: never either — 0 firings in all 1,080 lane runs with a Control verb, every class. The
  verb is a dead card at T1 until a slow source exists (the Mid range at T3, or a design change
  to the pure Control payload); the page's "needs a slow" is the whole truth of it.
- **Affliction on the Rapier: only the Apprentice** (the DoT root afflicts; nothing else in a T1
  kit does). Five of six classes read Venom Point as a dead card on both instruments. On the
  Poison Dagger the Affliction verb fires for everyone (the weapon poisons on hit).
- **Empowered on the Slinger** with a hit-shaped payload (the pure pair's ×1.5, the Engagement
  lean's lunge): never — the reload root's moment is a reload completing, with no exchange to
  multiply. With an on-target payload (echo, bleed, root) it pays.
- **Kill chain in boss fights:** 0.3–1.5 per minute (adds only), and its pure pair reads +0.2%
  there — the verb is close to dead on a boss.

**Rates past the moment's intent.** The Conduit's Empowered moment fires **25–40 times a minute**
in boss fights (its formation cycle) against 1–9 for every other class, and its Tempo counter
takes every summon hit (~32/min). The Empowered moment has no cap and no normalisation entry yet
(design §24.2: "its normalisation entry comes from the mechanic's reference cadence").

**The Tempo lean is quantised to the 10 Hz tick (an engine finding, live behaviour).** A player
attacks when `now − lastAttackAt ≥ attackCooldown`, checked every 100 ms, and `lastAttackAt =
now` — so the effective interval is the cooldown rounded UP to 100 ms. Quick Wrist takes the
Striker's Flash Rapier from 590 to 543 ms, the Spirit's from 558 to 517, the Slinger's from 284
to 263: all round to the same tick (600 / 600 / 300 ms), and the lean is worth exactly **0** to
those three classes (the boss lab's Rapier `tempo×affliction` row, whose verb never fires, reads
+0.0% for each). For the Squire (735 → 665 ms, i.e. 800 → 700) the same lean is worth a whole
tick (+11.6%). Carrying the remainder (`lastAttackAt += cooldown`) would fix it and moves every
attack-speed number in the game — a conductor/designer call, not touched here.

**The Affliction lean (DoT potency) moves nothing for five of six classes**, as W2-A found: on
the boss lab every non-Apprentice class reads +0.0% for an Affliction lean whose verb never fires
(Rapier `affliction×affliction`, Dagger `affliction×control`), while the Apprentice gains +9.7%
from the same card. Its PAYLOAD (the heavy bleed, on another verb) is live for everyone.

**Outliers.** Boss lab, above 1.5×: the Poison Dagger's pure Affliction pair (+38% median, +76%
on the Apprentice — a redose of the weapon's own poison every 5 s); the Engagement lean on a
frequent verb (Rapier `engagement×tempo` +27%, Hammer `engagement×empowered` +25%); the Axe's
Tempo lean (`tempo×tempo` +21%, `tempo×empowered` +25%). Lane bench: the Broadsword's Kill-chain lean (move speed, on a
walking-bound farm) and Empowered lean on its Technique and Kill-chain verbs (+15% to +20%); the
Hammer's Empowered lean on its Engagement verb (+21%: the first hit on every body counts as the
mechanic, which one-shots T1 mobs); the Axe's Tempo and Kill-chain pairs (+10% to +14%); the
Dagger's pure Affliction pair (+11%). The two instruments disagree most on the Engagement and
Kill-chain verbs: openers and kills are what a farm is made of and what a boss fight is not.

**The Squire phase-locks the Axe's proxy.** Hewing Arc × Chopping Rhythm proxies every 6th
landed hit; the Squire's execution lands about every 3rd, so the 6th is usually the execution
itself (never proxied) — on a lane node the pair landed no proxy in 60 s.

**The floor.** Boss lab: median pair **+6.8%**, floor **+6.1%**, **20 of 45** pairs below it.
Lane bench: median **+6.2%**, floor **+5.5%**, **19 of 45** below. **13 pairs are under the
floor on BOTH instruments**, and they share three causes, none of them a magnitude: a verb that
never fires (every Control verb pair; the Rapier's Affliction verb), a lean that moves no
number outside one class (Affliction's DoT potency), and the Broadsword's Technique lean (Sigil:
+0% to +5% on every verb — technique power on one Technique with a long cooldown). The 13:
Broadsword `technique×technique`, `technique×kill-chain`, `technique×empowered`; Rapier
`tempo×affliction`, `affliction×affliction`, `affliction×engagement`; Hammer `control×control`,
`control×engagement`, `engagement×control`; Dagger `affliction×control`, `affliction×kill-chain`,
`control×kill-chain`, `kill-chain×control`. Tuning numbers will not lift a card whose moment never
comes; the floor is reporting the dead moments first.

## Boss lab — summary

15000 rows. Median pair uplift **+6.8%**; floor (0.9×) **+6.1%**; outlier ceiling (1.5×) **+10.2%**. Below the floor: **20** of 45 pairs; above 1.5×: **15**.

## Lane bench — summary

9000 rows. Median pair uplift **+6.2%**; floor (0.9×) **+5.5%**; outlier ceiling (1.5×) **+9.2%**. Below the floor: **19** of 45 pairs; above 1.5×: **14**.

## Broadsword — Iron Broadsword (`iron-broadsword`, home plains) — lanes technique (Sigil Shard), kill-chain (Bone Shard), empowered (Anvil Shard)

**boss lab** — median uplift over the six classes · verb fires/min (rows: lean; columns: verb)

| lean ↓ / verb → | technique | kill-chain | empowered |
|---|---:|---:|---:|
| **technique** | +5.1% · 13.1 (pure) | +0.0% · 1.2 | +0.8% · 7.6 |
| **kill-chain** | +5.7% · 7.6 | +0.2% · 1.4 (pure) | +10.1% · 7.5 |
| **empowered** | +14.8% · 7.0 | +7.6% · 1.3 | +17.3% · 6.7 (pure) |

**lane bench** — median uplift over the six classes · verb fires/min (rows: lean; columns: verb)

| lean ↓ / verb → | technique | kill-chain | empowered |
|---|---:|---:|---:|
| **technique** | -0.3% · 15.8 (pure) | +0.5% · 11.1 | +1.2% · 3.1 |
| **kill-chain** | +15.2% · 14.0 | +16.5% · 16.3 (pure) | +4.3% · 4.0 |
| **empowered** | +16.3% · 12.0 | +19.8% · 14.8 | +1.4% · 3.7 (pure) |

<details><summary>boss lab: per class (uplift; losses pair/control; wins)</summary>

| class | technique×technique | technique×kill-chain | technique×empowered | kill-chain×technique | kill-chain×kill-chain | kill-chain×empowered | empowered×technique | empowered×kill-chain | empowered×empowered |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| striker | +5.0% (64% vs 52%) | +0.0% (52% vs 52%) | +1.6% (56% vs 52%) | +7.9% (100% vs 52%) | +0.1% (64% vs 52%) | +15.6% (100% vs 52%) | +21.7% (92% vs 52%) | +8.4% (66% vs 52%) | +24.6% (98% vs 52%) |
| squire | +4.5% (72% vs 64%) | -0.0% (64% vs 64%) | +0.9% (66% vs 64%) | +8.9% (100% vs 64%) | +0.3% (64% vs 64%) | +14.6% (100% vs 64%) | +17.4% (100% vs 64%) | +6.4% (92% vs 64%) | +20.9% (100% vs 64%) |
| slinger | +5.2% (80% vs 80%) | +0.0% (80% vs 80%) | +0.4% (80% vs 80%) | +5.7% (100% vs 80%) | +0.5% (80% vs 80%) | +0.1% (100% vs 80%) | +12.2% (80% vs 80%) | +8.5% (80% vs 80%) | +7.0% ⌀ (80% vs 80%) |
| spirit | +5.6% (98% vs 88%) | +0.0% (88% vs 88%) | +0.7% (92% vs 88%) | +5.7% (100% vs 88%) | +0.1% (94% vs 88%) | +9.1% (100% vs 88%) | +18.1% (100% vs 88%) | +7.3% (100% vs 88%) | +15.0% (100% vs 88%) |
| apprentice | +4.9% (88% vs 78%) | +0.0% (82% vs 78%) | -0.1% (78% vs 78%) | +2.8% (100% vs 78%) | +0.1% (100% vs 78%) | +0.5% (100% vs 78%) | +7.1% (98% vs 78%) | +4.4% (94% vs 78%) | +5.1% (92% vs 78%) |
| conduit | +5.8% (78% vs 72%) | +0.0% (72% vs 72%) | +6.1% (78% vs 72%) | +4.3% (98% vs 72%) | +4.4% (78% vs 72%) | +11.1% (100% vs 72%) | +9.5% (78% vs 72%) | +8.0% (78% vs 72%) | +19.6% (80% vs 72%) |

⌀ = the verb never fired for that class.

</details>

<details><summary>lane bench: per class (uplift; deaths pair/control)</summary>

| class | technique×technique | technique×kill-chain | technique×empowered | kill-chain×technique | kill-chain×kill-chain | kill-chain×empowered | empowered×technique | empowered×kill-chain | empowered×empowered |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| striker | -1.8% | -0.9% | +1.4% | +21.3% | +21.2% | +4.5% | +17.0% | +16.7% | +0.5% |
| squire | -0.7% | +2.9% | +1.0% | +20.7% | +28.2% | +7.5% | +19.2% | +43.7% | +2.3% |
| slinger | +0.0% | +0.0% | +0.0% | +3.8% | +11.7% | +4.0% | +3.4% | +22.8% | +2.7% ⌀ |
| spirit | +0.0% | +3.4% | +1.9% | +26.7% | +51.9% | +3.9% | +36.2% | +95.5% | +0.6% |
| apprentice | -1.4% | -3.8% | +0.0% ⌀ | +9.7% | +4.3% | -2.1% ⌀ | +2.1% | +3.3% | +0.0% ⌀ |
| conduit | +0.0% | +1.0% | +3.4% | +6.7% | +2.9% | +7.3% | +15.6% | +11.7% | +17.6% |

⌀ = the verb never fired for that class.

</details>

## Rapier — Flash Rapier (`flash-rapier`, home forest) — lanes tempo (Gale Shard), affliction (Venom Shard), engagement (Spark Shard)

**boss lab** — median uplift over the six classes · verb fires/min (rows: lean; columns: verb)

| lean ↓ / verb → | tempo | affliction | engagement |
|---|---:|---:|---:|
| **tempo** | +15.8% · 14.5 (pure) | +5.8% · 0.0 | +5.7% · 2.7 |
| **affliction** | +10.2% · 13.7 | +0.0% · 0.0 (pure) | +1.1% · 2.6 |
| **engagement** | +26.9% · 13.4 | +11.8% · 0.0 | +11.6% · 2.7 (pure) |

**lane bench** — median uplift over the six classes · verb fires/min (rows: lean; columns: verb)

| lean ↓ / verb → | tempo | affliction | engagement |
|---|---:|---:|---:|
| **tempo** | +7.5% · 7.4 (pure) | +2.9% · 0.0 | +8.9% · 12.1 |
| **affliction** | +0.0% · 7.2 | +0.0% · 0.0 (pure) | +3.6% · 11.2 |
| **engagement** | +11.3% · 6.7 | +7.8% · 0.0 | +13.3% · 12.6 (pure) |

<details><summary>boss lab: per class (uplift; losses pair/control; wins)</summary>

| class | tempo×tempo | tempo×affliction | tempo×engagement | affliction×tempo | affliction×affliction | affliction×engagement | engagement×tempo | engagement×affliction | engagement×engagement |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| striker | +12.0% (98% vs 86%) | +0.0% ⌀ (86% vs 86%) | +2.0% (88% vs 86%) | +9.9% (94% vs 86%) | +0.0% ⌀ (86% vs 86%) | +1.1% (86% vs 86%) | +24.3% (100% vs 86%) | +8.5% ⌀ (92% vs 86%) | +11.0% (96% vs 86%) |
| squire | +26.1% (100% vs 100%) | +11.6% ⌀ (100% vs 100%) | +13.3% (100% vs 100%) | +11.0% (100% vs 100%) | +0.0% ⌀ (100% vs 100%) | +2.1% (100% vs 100%) | +27.2% (100% vs 100%) | +9.8% ⌀ (100% vs 100%) | +10.6% (100% vs 100%) |
| slinger | +15.5% (100% vs 98%) | +0.0% ⌀ (98% vs 98%) | +1.0% (100% vs 98%) | +10.5% (100% vs 98%) | +0.0% ⌀ (98% vs 98%) | +1.2% (100% vs 98%) | +32.3% (100% vs 98%) | +15.0% ⌀ (100% vs 98%) | +15.8% (100% vs 98%) |
| spirit | +14.0% (100% vs 100%) | +0.0% ⌀ (100% vs 100%) | +1.8% (100% vs 100%) | +12.2% (100% vs 100%) | +0.0% ⌀ (100% vs 100%) | +2.1% (100% vs 100%) | +34.3% (100% vs 100%) | +13.2% ⌀ (100% vs 100%) | +15.1% (100% vs 100%) |
| apprentice | +16.1% (100% vs 86%) | +14.8% (100% vs 86%) | +9.5% (98% vs 86%) | +7.0% (98% vs 86%) | +47.5% (100% vs 86%) | +1.0% (88% vs 86%) | +13.0% (100% vs 86%) | +11.9% (100% vs 86%) | +7.2% (96% vs 86%) |
| conduit | +31.3% (100% vs 80%) | +13.0% ⌀ (100% vs 80%) | +13.5% (100% vs 80%) | +4.5% (86% vs 80%) | +0.0% ⌀ (80% vs 80%) | +0.6% (80% vs 80%) | +26.5% (100% vs 80%) | +11.7% ⌀ (80% vs 80%) | +12.2% (80% vs 80%) |

⌀ = the verb never fired for that class.

</details>

<details><summary>lane bench: per class (uplift; deaths pair/control)</summary>

| class | tempo×tempo | tempo×affliction | tempo×engagement | affliction×tempo | affliction×affliction | affliction×engagement | engagement×tempo | engagement×affliction | engagement×engagement |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| striker | +4.0% | +0.0% ⌀ | +13.7% | -1.3% | +0.0% ⌀ | +3.9% | +13.7% | +8.7% ⌀ | +32.6% |
| squire | +3.4% | +4.8% ⌀ | +7.5% | +0.0% | +0.0% ⌀ | -0.5% | +3.4% | +1.0% ⌀ | +10.5% |
| slinger | +11.5% | +4.8% ⌀ | +10.1% | +3.1% | +0.0% ⌀ | +6.0% | +10.7% | +10.3% ⌀ | +16.0% |
| spirit | +19.4% | +11.1% ⌀ | +26.6% | +9.8% | +0.0% ⌀ | +11.9% | +25.2% | +12.3% ⌀ | +39.7% |
| apprentice | -0.9% | +0.0% | +1.7% | -0.6% | +6.8% | +3.4% | +10.2% (1/0d) | +6.3% | +8.5% |
| conduit | +11.0% | +1.0% ⌀ | +7.6% | +0.0% | +0.0% ⌀ | -2.0% | +11.9% | +6.8% ⌀ | +9.3% |

⌀ = the verb never fired for that class.

</details>

## Hammer — Heavy Hammer (`heavy-hammer`, home mountain) — lanes empowered (Anvil Shard), control (Shackle Shard), engagement (Spark Shard)

**boss lab** — median uplift over the six classes · verb fires/min (rows: lean; columns: verb)

| lean ↓ / verb → | empowered | control | engagement |
|---|---:|---:|---:|
| **empowered** | +17.4% · 4.4 (pure) | +6.6% · 0.0 | +10.8% · 2.6 |
| **control** | +4.8% · 5.2 | +4.7% · 0.0 (pure) | +4.8% · 2.6 |
| **engagement** | +25.2% · 4.3 | +4.7% · 0.0 | +8.0% · 2.7 (pure) |

**lane bench** — median uplift over the six classes · verb fires/min (rows: lean; columns: verb)

| lean ↓ / verb → | empowered | control | engagement |
|---|---:|---:|---:|
| **empowered** | +8.1% · 2.4 (pure) | +6.6% · 0.0 | +21.4% · 5.8 |
| **control** | +6.1% · 2.5 | +5.0% · 0.0 (pure) | +2.6% · 5.8 |
| **engagement** | +8.1% · 2.4 | +5.0% · 0.0 | +14.1% · 6.7 (pure) |

<details><summary>boss lab: per class (uplift; losses pair/control; wins)</summary>

| class | empowered×empowered | empowered×control | empowered×engagement | control×empowered | control×control | control×engagement | engagement×empowered | engagement×control | engagement×engagement |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| striker | +22.3% (98% vs 56%) | +8.0% ⌀ (70% vs 56%) | +13.6% (94% vs 56%) | +4.9% (52% vs 56%) | +4.9% ⌀ (60% vs 56%) | +4.9% (60% vs 56%) | +33.5% (98% vs 56%) | +4.9% ⌀ (60% vs 56%) | +8.8% (74% vs 56%) |
| squire | +29.4% (100% vs 100%) | +6.0% ⌀ (100% vs 100%) | +11.6% (100% vs 100%) | +3.2% (100% vs 100%) | +3.2% ⌀ (100% vs 100%) | +3.2% (100% vs 100%) | +41.6% (100% vs 100%) | +3.2% ⌀ (100% vs 100%) | +7.9% (100% vs 100%) |
| slinger | +7.5% ⌀ (92% vs 80%) | +7.5% ⌀ (92% vs 80%) | +10.6% (90% vs 80%) | +5.8% (90% vs 80%) | +4.5% ⌀ (86% vs 80%) | +5.5% (88% vs 80%) | +4.5% ⌀ (86% vs 80%) | +4.5% ⌀ (86% vs 80%) | +8.0% (88% vs 80%) |
| spirit | +14.8% (100% vs 88%) | +4.4% ⌀ (98% vs 88%) | +11.0% (100% vs 88%) | +4.8% (98% vs 88%) | +4.8% ⌀ (98% vs 88%) | +4.8% (100% vs 88%) | +20.0% (100% vs 88%) | +4.8% ⌀ (98% vs 88%) | +5.3% (100% vs 88%) |
| apprentice | +3.4% (100% vs 100%) | +2.2% ⌀ (100% vs 100%) | +3.5% (100% vs 100%) | +2.0% (100% vs 100%) | +1.5% ⌀ (100% vs 100%) | +2.1% (100% vs 100%) | +3.4% (100% vs 100%) | +1.5% ⌀ (100% vs 100%) | +3.7% (100% vs 100%) |
| conduit | +19.9% (84% vs 72%) | +7.3% ⌀ (80% vs 72%) | +8.8% (80% vs 72%) | +18.2% (100% vs 72%) | +7.2% ⌀ (78% vs 72%) | +8.0% (80% vs 72%) | +30.4% (96% vs 72%) | +7.2% ⌀ (78% vs 72%) | +8.4% (80% vs 72%) |

⌀ = the verb never fired for that class.

</details>

<details><summary>lane bench: per class (uplift; deaths pair/control)</summary>

| class | empowered×empowered | empowered×control | empowered×engagement | control×empowered | control×control | control×engagement | engagement×empowered | engagement×control | engagement×engagement |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| striker | +13.4% | +5.8% ⌀ | +34.8% | +5.8% | +5.8% ⌀ | +6.1% | +15.9% | +5.8% ⌀ | +46.4% |
| squire | +0.0% | +0.0% ⌀ | +48.8% | +0.0% | +0.0% ⌀ | +0.0% | +0.0% | +0.0% ⌀ | +12.0% |
| slinger | +7.5% ⌀ | +7.5% ⌀ | +8.1% | +4.0% | +4.2% ⌀ | +1.0% | +4.2% ⌀ | +4.2% ⌀ | +16.2% |
| spirit | +8.0% | +8.0% ⌀ | +114.6% | +8.0% | +8.0% ⌀ | +5.8% | +8.0% | +8.0% ⌀ | +37.9% |
| apprentice | +8.2% ⌀ | +8.2% ⌀ | +5.5% | +8.2% ⌀ | +8.2% ⌀ | +4.3% | +8.2% ⌀ | +8.2% ⌀ | +10.0% |
| conduit | +10.8% | +4.3% ⌀ | +4.3% | +6.5% | +1.2% ⌀ | -2.9% | +8.4% | +1.2% ⌀ | +6.5% |

⌀ = the verb never fired for that class.

</details>

## Axe — Chaotic Axe (`chaotic-axe`, home cave) — lanes tempo (Gale Shard), kill-chain (Bone Shard), empowered (Anvil Shard)

**boss lab** — median uplift over the six classes · verb fires/min (rows: lean; columns: verb)

| lean ↓ / verb → | tempo | kill-chain | empowered |
|---|---:|---:|---:|
| **tempo** | +21.4% · 6.8 (pure) | +8.8% · 1.4 | +25.4% · 7.2 |
| **kill-chain** | +6.8% · 6.0 | +0.2% · 1.4 (pure) | +11.7% · 6.7 |
| **empowered** | +18.3% · 6.3 | +8.6% · 1.5 | +19.1% · 6.5 (pure) |

**lane bench** — median uplift over the six classes · verb fires/min (rows: lean; columns: verb)

| lean ↓ / verb → | tempo | kill-chain | empowered |
|---|---:|---:|---:|
| **tempo** | +10.0% · 4.0 (pure) | +12.6% · 6.7 | +6.0% · 4.1 |
| **kill-chain** | +12.6% · 4.1 | +13.5% · 7.4 (pure) | +10.7% · 4.2 |
| **empowered** | +2.8% · 3.1 | +5.3% · 6.4 | +6.2% · 3.7 (pure) |

<details><summary>boss lab: per class (uplift; losses pair/control; wins)</summary>

| class | tempo×tempo | tempo×kill-chain | tempo×empowered | kill-chain×tempo | kill-chain×kill-chain | kill-chain×empowered | empowered×tempo | empowered×kill-chain | empowered×empowered |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| striker | +24.5% (100% vs 86%) | +10.7% (92% vs 86%) | +31.2% (100% vs 86%) | +6.7% (100% vs 86%) | +0.3% (84% vs 86%) | +17.8% (100% vs 86%) | +18.7% (100% vs 86%) | +8.1% (92% vs 86%) | +24.5% (100% vs 86%) |
| squire | +18.4% (100% vs 96%) | +6.9% (100% vs 96%) | +23.3% (100% vs 96%) | +6.9% (100% vs 96%) | +0.2% (100% vs 96%) | +15.5% (100% vs 96%) | +20.4% (100% vs 96%) | +8.9% (100% vs 96%) | +25.4% (100% vs 96%) |
| slinger | +34.3% (100% vs 80%) | +17.6% (90% vs 80%) | +27.1% (100% vs 80%) | +7.8% (100% vs 80%) | +0.1% (80% vs 80%) | +0.1% (100% vs 80%) | +17.8% (94% vs 80%) | +8.9% (80% vs 80%) | +8.3% ⌀ (80% vs 80%) |
| spirit | +24.8% (100% vs 96%) | +11.2% (100% vs 96%) | +24.8% (100% vs 96%) | +5.7% (100% vs 96%) | +0.2% (98% vs 96%) | +12.5% (100% vs 96%) | +20.9% (100% vs 96%) | +8.4% (100% vs 96%) | +18.6% (100% vs 96%) |
| apprentice | +4.6% (100% vs 98%) | +0.0% (98% vs 98%) | +0.8% (100% vs 98%) | +2.6% (100% vs 98%) | +0.2% (100% vs 98%) | +0.2% (100% vs 98%) | +14.0% (100% vs 98%) | +11.4% (100% vs 98%) | +11.4% ⌀ (100% vs 98%) |
| conduit | +17.0% (100% vs 100%) | +0.0% (100% vs 100%) | +26.1% (100% vs 100%) | +8.2% (100% vs 100%) | +0.4% (100% vs 100%) | +11.0% (100% vs 100%) | +14.9% (100% vs 100%) | +7.5% (100% vs 100%) | +19.7% (100% vs 100%) |

⌀ = the verb never fired for that class.

</details>

<details><summary>lane bench: per class (uplift; deaths pair/control)</summary>

| class | tempo×tempo | tempo×kill-chain | tempo×empowered | kill-chain×tempo | kill-chain×kill-chain | kill-chain×empowered | empowered×tempo | empowered×kill-chain | empowered×empowered |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| striker | +13.2% | +19.7% | +6.5% | +15.8% (1/0d) | +16.7% | +23.7% | +12.1% | +16.7% | +2.4% |
| squire | +4.2% | +8.7% | +5.6% | +8.7% | +26.0% | +20.0% | +0.8% | +3.3% | +7.8% |
| slinger | +1.0% | +9.3% | +2.1% | +9.3% | +5.2% | +6.5% | -1.9% | +5.6% | +1.9% ⌀ |
| spirit | +20.3% | +31.9% | +0.0% | +18.3% | +45.1% | +9.9% | +31.9% | +110.8% | +10.1% |
| apprentice | +14.1% | +15.9% | +19.2% | +10.3% | +10.3% | +11.6% | +2.6% | +4.5% | +4.5% |
| conduit | +6.8% | +0.0% | +9.1% | +14.9% | +8.7% | +8.2% | +3.0% | +5.0% | +8.2% |

⌀ = the verb never fired for that class.

</details>

## Dagger — Poison Dagger (`ashbrand-blade`, home swamp) — lanes affliction (Venom Shard), control (Shackle Shard), kill-chain (Bone Shard)

**boss lab** — median uplift over the six classes · verb fires/min (rows: lean; columns: verb)

| lean ↓ / verb → | affliction | control | kill-chain |
|---|---:|---:|---:|
| **affliction** | +38.4% · 10.3 (pure) | +0.0% · 0.0 | +0.0% · 1.4 |
| **control** | +7.2% · 10.3 | +6.4% · 0.0 (pure) | +5.8% · 1.5 |
| **kill-chain** | +4.4% · 10.5 | +0.2% · 0.0 | +0.2% · 1.4 (pure) |

**lane bench** — median uplift over the six classes · verb fires/min (rows: lean; columns: verb)

| lean ↓ / verb → | affliction | control | kill-chain |
|---|---:|---:|---:|
| **affliction** | +11.2% · 7.2 (pure) | +0.0% · 0.0 | +3.7% · 5.9 |
| **control** | +5.8% · 7.7 | +2.5% · 0.0 (pure) | +4.5% · 5.9 |
| **kill-chain** | +8.3% · 7.7 | +3.5% · 0.0 | +6.8% · 6.0 (pure) |

<details><summary>boss lab: per class (uplift; losses pair/control; wins)</summary>

| class | affliction×affliction | affliction×control | affliction×kill-chain | control×affliction | control×control | control×kill-chain | kill-chain×affliction | kill-chain×control | kill-chain×kill-chain |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| striker | +36.5% (90% vs 74%) | +0.0% ⌀ (74% vs 74%) | +0.0% (72% vs 74%) | +8.0% (76% vs 74%) | +8.0% ⌀ (72% vs 74%) | +8.0% (72% vs 74%) | +5.9% (98% vs 74%) | +0.2% ⌀ (68% vs 74%) | +0.2% (70% vs 74%) |
| squire | +37.9% (100% vs 94%) | +0.0% ⌀ (94% vs 94%) | +0.0% (94% vs 94%) | +6.4% (98% vs 94%) | +5.6% ⌀ (98% vs 94%) | +5.6% (98% vs 94%) | +4.8% (100% vs 94%) | +0.0% ⌀ (82% vs 94%) | +0.0% (92% vs 94%) |
| slinger | +39.3% (100% vs 100%) | +0.0% ⌀ (100% vs 100%) | +0.0% (100% vs 100%) | +2.7% (100% vs 100%) | +3.2% ⌀ (100% vs 100%) | +3.2% (100% vs 100%) | +1.8% (100% vs 100%) | -0.2% ⌀ (100% vs 100%) | -0.1% (100% vs 100%) |
| spirit | +39.0% (100% vs 100%) | +0.0% ⌀ (100% vs 100%) | +0.0% (100% vs 100%) | +5.6% (100% vs 100%) | +7.3% ⌀ (100% vs 100%) | +5.9% (100% vs 100%) | +4.0% (100% vs 100%) | +0.2% ⌀ (100% vs 100%) | +0.2% (100% vs 100%) |
| apprentice | +76.4% (100% vs 64%) | +9.7% ⌀ (80% vs 64%) | +9.7% (82% vs 64%) | +15.9% (100% vs 64%) | +15.5% ⌀ (94% vs 64%) | +15.5% (98% vs 64%) | +2.2% (100% vs 64%) | +0.3% ⌀ (84% vs 64%) | +0.3% (94% vs 64%) |
| conduit | +29.6% (100% vs 80%) | -0.0% ⌀ (80% vs 80%) | +0.0% (80% vs 80%) | +11.0% (100% vs 80%) | +4.5% ⌀ (80% vs 80%) | +4.5% (80% vs 80%) | +5.1% (100% vs 80%) | +2.9% ⌀ (80% vs 80%) | +5.2% (80% vs 80%) |

⌀ = the verb never fired for that class.

</details>

<details><summary>lane bench: per class (uplift; deaths pair/control)</summary>

| class | affliction×affliction | affliction×control | affliction×kill-chain | control×affliction | control×control | control×kill-chain | kill-chain×affliction | kill-chain×control | kill-chain×kill-chain |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| striker | +14.1% | +0.0% ⌀ | +3.9% | +6.5% | +6.5% ⌀ | +6.5% | +7.7% | +3.8% ⌀ | +8.1% |
| squire | +8.6% | +0.0% ⌀ | +5.1% | +5.1% | +5.1% ⌀ | +5.1% | +8.9% | +3.2% ⌀ | +9.7% |
| slinger | +12.2% | +0.0% ⌀ | +3.6% | +17.9% | +13.6% ⌀ | +12.2% | +10.6% | +4.9% ⌀ | +8.3% |
| spirit | +10.1% | +0.0% ⌀ | +3.2% | +4.8% | -1.1% ⌀ | +4.0% | +2.4% | +1.1% ⌀ | +1.6% |
| apprentice | +44.4% | +0.0% ⌀ | +6.9% | +15.3% | +0.0% ⌀ | -2.8% | +10.2% | +5.6% ⌀ | +5.6% |
| conduit | +4.3% | +0.0% ⌀ | +1.1% | -0.9% | +0.0% ⌀ | -0.9% | +3.4% | +1.7% ⌀ | +0.9% |

⌀ = the verb never fired for that class.

</details>

## Outliers (per instrument, T1)

**boss lab.** Pairs: median +6.8%.

- Above 1.5× (15): `broadsword` empowered×technique +14.8% (2.17×; 7.0/min); `broadsword` empowered×empowered +17.3% (2.55×; 6.7/min); `rapier` tempo×tempo +15.8% (2.32×; 14.5/min); `rapier` engagement×tempo +26.9% (3.95×; 13.4/min); `rapier` engagement×affliction +11.8% (1.74×; 0.0/min); `rapier` engagement×engagement +11.6% (1.71×; 2.7/min); `hammer` empowered×empowered +17.4% (2.56×; 4.4/min); `hammer` empowered×engagement +10.8% (1.59×; 2.6/min); `hammer` engagement×empowered +25.2% (3.70×; 4.3/min); `axe` tempo×tempo +21.4% (3.16×; 6.8/min); `axe` tempo×empowered +25.4% (3.74×; 7.2/min); `axe` kill-chain×empowered +11.7% (1.72×; 6.7/min); `axe` empowered×tempo +18.3% (2.69×; 6.3/min); `axe` empowered×empowered +19.1% (2.82×; 6.5/min); `dagger` affliction×affliction +38.4% (5.65×; 10.3/min)
- Below 0.9× — under the §24.1 floor (20): `broadsword` technique×technique +5.1% (0.75×; 13.1/min); `broadsword` technique×kill-chain +0.0% (0.00×; 1.2/min); `broadsword` technique×empowered +0.8% (0.12×; 7.6/min); `broadsword` kill-chain×technique +5.7% (0.84×; 7.6/min); `broadsword` kill-chain×kill-chain +0.2% (0.03×; 1.4/min); `rapier` tempo×affliction +5.8% (0.85×; 0.0/min); `rapier` tempo×engagement +5.7% (0.85×; 2.7/min); `rapier` affliction×affliction +0.0% (0.00×; 0.0/min); `rapier` affliction×engagement +1.1% (0.17×; 2.6/min); `hammer` control×empowered +4.8% (0.71×; 5.2/min); `hammer` control×control +4.7% (0.69×; 0.0/min); `hammer` control×engagement +4.8% (0.71×; 2.6/min); `hammer` engagement×control +4.7% (0.69×; 0.0/min); `axe` kill-chain×kill-chain +0.2% (0.03×; 1.4/min); `dagger` affliction×control +0.0% (0.00×; 0.0/min); `dagger` affliction×kill-chain +0.0% (0.00×; 1.4/min); `dagger` control×kill-chain +5.8% (0.85×; 1.5/min); `dagger` kill-chain×affliction +4.4% (0.65×; 10.5/min); `dagger` kill-chain×control +0.2% (0.03×; 0.0/min); `dagger` kill-chain×kill-chain +0.2% (0.03×; 1.4/min)

Weapon × class cells (median of the nine pairs): median +7.2%.

- Above 1.5× (8): `rapier` × squire +11.0% (1.54×); `rapier` × spirit +12.2% (1.70×); `rapier` × apprentice +11.9% (1.66×); `rapier` × conduit +12.2% (1.70×); `axe` × striker +17.8% (2.48×); `axe` × squire +15.5% (2.16×); `axe` × spirit +12.5% (1.74×); `axe` × conduit +11.0% (1.53×)
- Below 0.9× (15): `broadsword` × squire +6.4% (0.90×); `broadsword` × slinger +5.2% (0.73×); `broadsword` × spirit +5.7% (0.80×); `broadsword` × apprentice +2.8% (0.39×); `broadsword` × conduit +6.1% (0.86×); `hammer` × squire +6.0% (0.83×); `hammer` × slinger +5.8% (0.81×); `hammer` × spirit +4.8% (0.67×); `hammer` × apprentice +2.2% (0.30×); `axe` × apprentice +2.6% (0.36×); `dagger` × striker +5.9% (0.82×); `dagger` × squire +4.8% (0.67×); `dagger` × slinger +1.8% (0.25×); `dagger` × spirit +4.0% (0.56×); `dagger` × conduit +4.5% (0.63×)

**lane bench.** Pairs: median +6.2%.

- Above 1.5× (14): `broadsword` kill-chain×technique +15.2% (2.47×; 14.0/min); `broadsword` kill-chain×kill-chain +16.5% (2.67×; 16.3/min); `broadsword` empowered×technique +16.3% (2.64×; 12.0/min); `broadsword` empowered×kill-chain +19.8% (3.21×; 14.8/min); `rapier` engagement×tempo +11.3% (1.83×; 6.7/min); `rapier` engagement×engagement +13.3% (2.15×; 12.6/min); `hammer` empowered×engagement +21.4% (3.48×; 5.8/min); `hammer` engagement×engagement +14.1% (2.29×; 6.7/min); `axe` tempo×tempo +10.0% (1.62×; 4.0/min); `axe` tempo×kill-chain +12.6% (2.05×; 6.7/min); `axe` kill-chain×tempo +12.6% (2.04×; 4.1/min); `axe` kill-chain×kill-chain +13.5% (2.18×; 7.4/min); `axe` kill-chain×empowered +10.7% (1.74×; 4.2/min); `dagger` affliction×affliction +11.2% (1.81×; 7.2/min)
- Below 0.9× — under the §24.1 floor (19): `broadsword` technique×technique -0.3% (-0.05×; 15.8/min); `broadsword` technique×kill-chain +0.5% (0.08×; 11.1/min); `broadsword` technique×empowered +1.2% (0.20×; 3.1/min); `broadsword` kill-chain×empowered +4.3% (0.69×; 4.0/min); `broadsword` empowered×empowered +1.4% (0.23×; 3.7/min); `rapier` tempo×affliction +2.9% (0.47×; 0.0/min); `rapier` affliction×tempo +0.0% (0.00×; 7.2/min); `rapier` affliction×affliction +0.0% (0.00×; 0.0/min); `rapier` affliction×engagement +3.6% (0.59×; 11.2/min); `hammer` control×control +5.0% (0.81×; 0.0/min); `hammer` control×engagement +2.6% (0.43×; 5.8/min); `hammer` engagement×control +5.0% (0.81×; 0.0/min); `axe` empowered×tempo +2.8% (0.45×; 3.1/min); `axe` empowered×kill-chain +5.3% (0.86×; 6.4/min); `dagger` affliction×control +0.0% (0.00×; 0.0/min); `dagger` affliction×kill-chain +3.7% (0.61×; 5.9/min); `dagger` control×control +2.5% (0.41×; 0.0/min); `dagger` control×kill-chain +4.5% (0.73×; 5.9/min); `dagger` kill-chain×control +3.5% (0.57×; 0.0/min)

Weapon × class cells (median of the nine pairs): median +5.8%.

- Above 1.5× (6): `rapier` × slinger +10.1% (1.73×); `rapier` × spirit +12.3% (2.11×); `axe` × striker +15.8% (2.71×); `axe` × spirit +20.3% (3.48×); `axe` × apprentice +10.3% (1.76×); `dagger` × slinger +10.6% (1.81×)
- Below 0.9× (14): `broadsword` × striker +4.5% (0.78×); `broadsword` × slinger +3.4% (0.58×); `broadsword` × spirit +3.9% (0.67×); `broadsword` × apprentice +0.0% (0.00×); `rapier` × striker +4.0% (0.69×); `rapier` × squire +3.4% (0.59×); `rapier` × apprentice +3.4% (0.58×); `hammer` × squire +0.0% (0.00×); `hammer` × slinger +4.2% (0.72×); `hammer` × conduit +4.3% (0.74×); `axe` × slinger +5.2% (0.89×); `dagger` × squire +5.1% (0.87×); `dagger` × spirit +2.4% (0.41×); `dagger` × conduit +0.9% (0.15×)

## Firing, refusals, deaths

**boss lab.**

- Verb never fired (pair: classes): `broadsword` empowered×empowered: slinger; `rapier` tempo×affliction: striker, squire, slinger, spirit, conduit; `rapier` affliction×affliction: striker, squire, slinger, spirit, conduit; `rapier` engagement×affliction: striker, squire, slinger, spirit, conduit; `hammer` empowered×empowered: slinger; `hammer` empowered×control: striker, squire, slinger, spirit, apprentice, conduit; `hammer` control×control: striker, squire, slinger, spirit, apprentice, conduit; `hammer` engagement×empowered: slinger; `hammer` engagement×control: striker, squire, slinger, spirit, apprentice, conduit; `axe` empowered×empowered: slinger, apprentice; `dagger` affliction×control: striker, squire, slinger, spirit, apprentice, conduit; `dagger` control×control: striker, squire, slinger, spirit, apprentice, conduit; `dagger` kill-chain×control: striker, squire, slinger, spirit, apprentice, conduit
- Purchases refused: none — every pair bought and slotted both cards
- Losses clearly above the control (> control + max(2, 25%)): dagger|squire|kill-chain×control 9 vs 3

**lane bench.**

- Verb never fired (pair: classes): `broadsword` technique×empowered: apprentice; `broadsword` kill-chain×empowered: apprentice; `broadsword` empowered×empowered: slinger, apprentice; `rapier` tempo×affliction: striker, squire, slinger, spirit, conduit; `rapier` affliction×affliction: striker, squire, slinger, spirit, conduit; `rapier` engagement×affliction: striker, squire, slinger, spirit, conduit; `hammer` empowered×empowered: slinger, apprentice; `hammer` empowered×control: striker, squire, slinger, spirit, apprentice, conduit; `hammer` control×empowered: apprentice; `hammer` control×control: striker, squire, slinger, spirit, apprentice, conduit; `hammer` engagement×empowered: slinger, apprentice; `hammer` engagement×control: striker, squire, slinger, spirit, apprentice, conduit; `axe` empowered×empowered: slinger; `dagger` affliction×control: striker, squire, slinger, spirit, apprentice, conduit; `dagger` control×control: striker, squire, slinger, spirit, apprentice, conduit; `dagger` kill-chain×control: striker, squire, slinger, spirit, apprentice, conduit
- Purchases refused: none — every pair bought and slotted both cards
- Deaths clearly above the control (> control + max(2, 25%)): none

