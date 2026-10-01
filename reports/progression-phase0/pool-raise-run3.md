# Player pool raise — Phase 0 call four (run 3, 2026-10-01)

**PROVISIONAL.** Nothing here has been in front of a human. Committed values:

```ts
GAME_CONFIG.PLAYER_POOL_FACTOR_BY_TIER = [1, 1.25, 1.30, 1.35, 1.40]  // T0, T1..T4
```

Those are the design bible §20 seeds. The bench's answer is that **the seeds stand** —
T1's is the criterion's own pick, and nothing in the data argues the other three down.

Raw rows: `pool-raise-run3/` and `pool-raise-run3-t1-breakeven/` (`boss.jsonl`,
`node.jsonl`, `report.md`, `summary.json`). Re-render either without re-measuring:
`cd server && PR_REPLAY=../reports/progression-phase0/<dir> node --conditions=development --import tsx bench/poolRaise.ts`.

## The instrument

`server/bench/poolRaise.ts`, in process. No Postgres, no Redis, no Docker.

Rows are the fifteen **pure weapon lanes** — five lineages x three lanes, design §9's
reference builds — rebuilt per tier: the lineage's own form of that tier, that biome's
armour and recovery charm at +3, and every card on the lane for tiers 1..N bought and
activated through the real economy handler. No purchase was refused in 386 fights. The
package is `resolveSurveyPackage`'s (per-tier abilities, Offensive stance from T2, the
five-rule behaviour policy with reference ability wiring), so these readings compare with
the Phase 0a/0b recovery and TTD numbers, which were taken with the same bot.

Two arenas per cell:

- **Boss** — the lineage biome's dungeon with the guard stripped and the boss woken, the
  `bossExam` setup. One fight to a 300 s cap. **Kill time** is measured on a kill and
  otherwise extrapolated from the share of the bar removed; **time to death** is measured
  on a death and otherwise extrapolated from the net drain (damage taken minus healing),
  clamped at 1200 s, which reads "the boss cannot kill this build". Both come from the
  same fight, so a factor that lengthens the fight moves TTD and leaves kill time alone.
- **Normal node** — an open node of the same biome, repopulating, 120 s, feeding the
  `FightHpTracker` the bot recorder and `phase0Recovery` use. Median fight-end HP is the
  sanity column.

Two seeds (101009, 101033). Medians are over LANES: one reading per lane, itself the
median over seeds.

## Gate table

| tier | factor | lanes | median boss TTD (s) | median kill time (s) | TTD/kill | lanes TTD>kill | median node fight-end HP |
|---:|---:|---:|---:|---:|---:|---:|---:|
| T1 | 1.00 | 15 | 44.4 | 55.8 | 0.80 | 3/15 | 0.89 |
| T1 | **1.25** | 15 | **58.3** | **55.8** | **1.04** | 7/15 | **0.92** |
| T1 | 1.50 | 15 | 69.9 | 55.8 | 1.25 | 9/15 | 0.93 |
| T1 | 1.75 | 15 | 81.6 | 55.8 | 1.46 | 10/15 | 0.94 |
| T1 | 2.00 | 15 | 93.3 | 55.8 | 1.67 | 11/15 | 0.95 |
| T2 | 1.00 | 15 | 203.2 | 67.6 | 3.01 | 9/15 | 1.00 |
| T2 | **1.30** | 15 | **335.7** | **67.6** | **4.97** | 9/15 | **1.00** |
| T2 | 1.50 | 15 | 546.5 | 67.6 | 8.08 | 9/15 | 1.00 |
| T3 | 1.00 | 15 | 429.1 | 127.0 | 3.38 | 9/15 | 1.00 |
| T3 | **1.35** | 15 | **666.9** | **127.0** | **5.25** | 9/15 | **1.00** |
| T3 | 1.50 | 15 | 782.7 | 127.0 | 6.16 | 9/15 | 1.00 |
| T4 | 1.00 | 15 | >=1200 | 324.1 | 3.70 | 13/15 | 1.00 |
| T4 | **1.40** | 15 | **>=1200** | **320.9** | **3.74** | 15/15 | **1.00** |
| T4 | 1.50 | 15 | >=1200 | 320.9 | 3.74 | 15/15 | 1.00 |

Bold is the picked factor. The 1.75 and 2.00 rows are the T1-only extension, run because
the nine-lane interim table made T1 look unreachable; it is not.

Bosses fought: T1 Tusked Razorback, Gnarled Greatbear, Crag Behemoth, Obsidian
Broodmother, Grave Toadeater. T2 Gorging Razortusk, Apex Timberclaw, Stoneplate
Juggernaut, Chitinous Dreadbore, Mire-Gorged Behemoth. T3 Dune Carapace Monarch, Apex
Bramble Slasher, Crag-Gorged Horn Behemoth, Deep-Core Burrow Gorger, Rot-Spore Croc
Behemoth. T4 Dune Throne Sovereign, Verdant Crown Predator, Iron Crest Titan, Charnel
Crown Sovereign.

## The pick, and what the criterion actually said

**T1 = 1.25.** The criterion selects it outright: median TTD is below median kill time at
1.00 (0.80) and above it at 1.25 (1.04). It is the lowest of the five factors that passes,
and it is the seed.

**T2 = 1.30, T3 = 1.35, T4 = 1.40, all seeds kept.** At those tiers the median lane
already out-lasts its boss at factor 1.00 — 3.01, 3.38 and 3.70 — so the boss clause
admits every candidate and says only "do not LOWER the pool". The seeds are kept rather
than collapsed to 1.00, because reading "no raise" out of a clause those bosses satisfy
for an unrelated reason (a +3 reference lane already beats them) would throw away §20's
monotone ladder for nothing: the seeds cost 0.00 on the sanity column at those tiers, and
at T4 the seed is the first factor at which all fifteen lanes win individually, 15/15
against 13/15.

**The 0.80 normal-node ceiling is breached before the raise, so it cannot brake it.**
Median fight-end HP at factor 1.00 is already 0.89 at T1 and 1.00 at T2-T4. The raise's own
contribution is +0.03 at T1 (0.89 to 0.92) and nothing measurable above it, because the
column is saturated. The pool is not what makes an ordinary node unthreatening to this
build.

## Findings to carry

1. **The band, not the pool, is what flattens normal nodes.** This lane bot is the Phase 0
   survey bot plus the whole T1..TN lineage band, and the 0b bench read 0.41-0.58 median
   fight-end HP on the same kind of node without one. A build holding its lane's full band
   ends ordinary fights at or near full HP at every tier. That belongs to Phase 4's monster
   pass, not to this call, but it means the fight-end metric cannot gate anything until
   monsters answer the band.
2. **T2-T4 bosses do not threaten a +3 pure lane** (TTD/kill 3.0-3.7 before any raise, and
   at T4 the boss cannot finish the build at all inside 300 s while needing about 320 s to
   die). The attrition lever §15 wanted the pool to be is only load-bearing at T1. Phase 4
   should look at boss damage, not at the pool, for the upper tiers.
3. **Some bosses ignore the pool entirely.** T1 Gnarled Greatbear kills the Rapier lanes at
   31.4 s with a 286 HP pool and 33.8 s with a 326 HP pool — doubling the pool from the
   1.00 baseline bought two seconds. Those lanes are dying to something the pool does not
   answer (burst, or a mechanic that scales off max HP); worth a look alongside the T1 boss
   pass.
4. **Mastery grants the harness had to make.** The Broadsword's and Rapier's T3/T4 cards
   require biome level 18 and 24 in Plains and Forest, which cap at 12; the Axe's T4 cards
   require 24 in Cave, which caps at 18. The bench raised the home biome to the tier's gate
   level and said so in its manifest. That is design §12's re-homing question (open
   decision 4), reachable today only through a later biome's form.

## Caveats

- Bench bot, not the route bot: capped mastery, declared +3 gear, reference ability wiring,
  no travel. Provisional by construction.
- Kill time is extrapolated whenever the boss survived (18 of T1's 30 fights at 1.25 were
  kills), which is optimistic for a boss that gets harder late — the same caveat `bossExam`
  carries.
- The Forest and Swamp bosses were byte-identical across both seeds; evasion is
  deterministic in this codebase, so a second seed adds a fight and no information for a
  boss with no adds.
- One lane per lineage per tier fights one boss, so "each tier's bosses" is five bosses per
  tier, not the full cross product of fifteen lanes against five bosses.
