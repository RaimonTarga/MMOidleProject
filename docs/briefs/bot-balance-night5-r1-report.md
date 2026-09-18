# Night 5-R1 report — completed partial operator batch

Status: the exact Night5-R1 packet completed once, sequentially, with the
Windows loader repair working. The launcher exited 0 and wrote batch-ended,
but the sealed observation matrix is only partially complete: four blocks
hit their run budgets before their planned cell budgets. This is descriptive
synthetic evidence for planner review, not a production-balance or
playtest-readiness decision.

## Decision summary

- The R1 packet was launched once from the main checkout on 2026-09-16 UTC.
  It created the prescribed detached source worktree, installed dependencies
  offline, verified the frozen identity, and ran Mountain, T4A, Weapons, T4B,
  Sustain, and T4C in order.
- The repaired Windows import path reached the first observation and the
  whole queue completed under the eight-hour launcher ceiling. No retry,
  replacement seed, adaptive build, cap extension, source edit, balance
  patch, service, database, browser, or parallel experiment was made.
- The matrix planned 524 cells and 1,572 observations. It started 410 cells
  and 1,222 observations. There were 1,107 window-ended observations, 57
  player-death observations, 58 wall-censored observations, and 350
  unstarted observations.
- Weapons reached all 144 cells and 432 observations. Sustain reached all
  48 cells and 144 observations, with one wall-censored observation. Mountain,
  T4A, T4B, and T4C stopped at their sealed run budgets and are explicitly
  budget-partial, not verified.
- The packet marks the run synthetic and economy-ineligible. The results
  therefore do not certify live economy behavior, farming safety, or
  production balance. No production adoption follows from this report.

## Frozen identity and execution

| Item | Value |
|---|---|
| Operator packet | [bot-balance-night5-r1-operator-packet.md](<C:/Users/osaif/Documents/Claude/Projects/MMO idle/docs/briefs/bot-balance-night5-r1-operator-packet.md>) |
| Frozen runtime revision | d0492235ce8a8a9582825f3088ec88db10a4486b |
| Frozen source tree | a7c3de8246f254c895a8c3f09ebf1492afb4ddbe |
| Definitions input hash | a30458ee24ad7054c5389b1ed16d47f3435456c18feb34f72ded75c84b0828c0 |
| Hitboxes | [hitboxes.json](<C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json>) |
| Hitboxes SHA-256 | 08bcc55633efe444d303c71977f7dcf87402157753af543e975e6c0c493afa83 |
| Detached source worktree | [night5-r1 source](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/night5-r1-20260917/source>) |
| Results root | [night5-r1 results](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/night5-r1-20260917/results>) |
| Batch manifest | [batch-manifest.json](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/night5-r1-20260917/results/batch-manifest.json>) |
| Operator ledger | [operator-ledger.jsonl](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/night5-r1-20260917/results/operator-ledger.jsonl>) |
| Operator exit | [operator-exit.json](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/night5-r1-20260917/operator-exit.json>) |
| Batch completion | [batch-ended.json](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/night5-r1-20260917/results/batch-ended.json>) |
| Mode and timestep | run, 100 ms |
| Seeds | 26003, 28001, 30011 |
| Synthetic / economy eligible | true / false |
| Batch interval | 2026-09-16T22:13:24.322Z through 2026-09-17T04:57:05.186Z |
| Batch wall time | 06:43:40.864 |

The detached source worktree resolves to the frozen revision and tree and is
tracked-clean. The original failed Night5 root remains separate and was not
retried or pooled with R1.

## Block accounting

Started cells means cells with at least one started observation; a
budget-limited final cell can therefore be only partially seeded. Full means
the observation ended by its planned simulation window. Dead means the player
died. Censored means the observation hit its wall ceiling. Unstarted is the
remaining observation budget, not a zero-valued outcome.

| Block | Planned cells / observations | Started cells | Started observations | Full | Dead | Wall-censored | Unstarted | Identity / budget status |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| Mountain | 80 / 240 | 72 | 214 | 176 | 37 | 1 | 26 | budget-exhausted at 214 runs; partial, not verified |
| T4A | 84 / 252 | 47 | 139 | 118 | 2 | 19 | 113 | budget-exhausted at 139 runs; partial, not verified |
| Weapons | 144 / 432 | 144 | 432 | 421 | 11 | 0 | 0 | complete; verification true, 421 complete windows |
| T4B | 84 / 252 | 53 | 157 | 136 | 4 | 17 | 95 | budget-exhausted at 157 runs; partial, not verified |
| Sustain | 48 / 144 | 48 | 144 | 140 | 3 | 1 | 0 | complete; verification true, 140 complete windows |
| T4C | 84 / 252 | 46 | 136 | 116 | 0 | 20 | 116 | budget-exhausted at 136 runs; partial, not verified |
| **Total** | **524 / 1,572** | **410** | **1,222** | **1,107** | **57** | **58** | **350** | **queue completed; matrix incomplete** |

Block wall times were Mountain 01:15:09, T4A 01:15:28, Weapons 00:53:06,
T4B 01:15:06, Sustain 00:47:50, and T4C 01:16:03. The long blocks stopped
at their packet-defined run budgets; there was no manual intervention.

## Metric boundary and estimator

The primary species duration statistic in this report is the packet-defined
outer median from each block's night5-audit.json:
medianOfEligibleSeedMediansMs. It is a median of eligible seed medians
within each observed cell and species, then an outer median across those
cell-level values. It is not the generic reporter's pooled perType median.

Exposure totals below were recomputed from raw index.json target rows and run
summaries. Target kills counts killed target rows; target-censored counts
target rows that were not killed when the run closed. HP regain is the
target-row hpRegainObserved flag. Casts are summed target castsStarted and
castsFired. Incoming damage is the sum of per-run cumulative incoming damage.
Max outgoing gap is the largest per-target maxDamageGapMs observed in one run,
shown in seconds; it is not a median. Max tick is the largest recorded
simulation tick wall time.

## Exposure summary

These are started-observation totals, not estimates for the unstarted budget.

| Block | Simulated hours | Target kills | Target-censored | HP regain | Casts started / fired | Incoming damage | Largest hit | Max damage in 1 s | Max outgoing gap | Max tick |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Mountain | 48.370 | 11,179 | 170 | 60 | 11,002 / 10,145 | 676,117.7 | 144.0 | 225.0 | 633.6 s | 455 ms |
| T4A | 31.248 | 16,015 | 235 | 513 | 3,681 / 2,830 | 1,161,884.9 | 311.0 | 467.079 | 765.5 s | 1,682 ms |
| Weapons | 106.774 | 42,203 | 797 | 2,338 | 19,358 / 18,472 | 2,360,239.8 | 174.0 | 349.0 | 829.6 s | 195 ms |
| T4B | 36.035 | 19,222 | 207 | 287 | 4,987 / 3,816 | 1,427,824.6 | 311.0 | 503.25 | 683.1 s | 1,247 ms |
| Sustain | 70.957 | 29,478 | 192 | 942 | 10,185 / 8,872 | 1,396,946.4 | 176.0 | 286.0 | 1,255.4 s | 185 ms |
| T4C | 30.787 | 17,168 | 199 | 431 | 3,415 / 2,578 | 1,100,739.7 | 311.0 | 391.3 | 747.6 s | 1,285 ms |

## Mountain pull-control screen

The Mountain block started 72 of 80 cells. The paired comparisons below use
shared cell and seed rows. A and B are the named arms in the first column.
The values are descriptive paired medians; they are not a causal estimate
because the sample includes deaths, censoring, and survivor-selected
minimum-HP observations.

| Pair | Shared pairs | Deaths A / B | Median min HP A / B | Delta A-B | Peak pursuers A / B | Seconds with 3+ pursuers A / B | Late joiners A / B | Recovery interruptions A / B | Max outgoing gap A / B |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Mountain boots, no orbit / Cave boots, no orbit | 64 | 24 / 10 | 0.33 / 0.46 | -0.13 | 2 / 1 | 0 / 0 | 1 / 1 | 14 / 14 | 3.5 s / 3.6 s |
| Mountain boots, orbit / Cave boots, orbit | 42 | 3 / 0 | 0.34 / 0.58 | -0.24 | 2 / 2 | 0 / 0 | 10 / 2 | 7.5 / 13.5 | 4.25 s / 4.0 s |
| Mountain boots, orbit / Mountain boots, no orbit | 42 | 3 / 15 | 0.34 / 0.33 | +0.01 | 2 / 2 | 0 / 0 | 10 / 1.5 | 7.5 / 14 | 4.25 s / 3.2 s |
| Cave boots, orbit / Cave boots, no orbit | 40 | 0 / 6 | 0.55 / 0.46 | +0.09 | 2 / 1 | 0 / 0 | 2 / 1 | 13.5 / 10 | 4.0 s / 3.3 s |

The screen points toward a Mountain-boots versus Cave-boots follow-up:
Cave boots were safer in both paired arms, most clearly with orbit
(0 versus 3 deaths and 0.58 versus 0.34 median minimum HP). Orbit did not
produce a blanket result: it improved the Mountain-boots comparison against
the no-orbit arm in this sample but also had more late joiners, while the
Cave-boots orbit comparison had better survival and minimum HP but a slightly
larger median recovery-interruption count. Median seconds with 3+ pursuers
was zero in every pair, so the median does not rule out individual spikes.
Do not promote a boot or orbit change from this screen.

Mountain species duration and target exposure, using the packet estimator,
were:

| Species | Median TTK | Target kills | Target-censored | Casts started / fired |
|---|---:|---:|---:|---:|
| Mountain Colossus | 27.0 s | 1,672 | 52 | 4,196 / 4,137 |
| Granite Titan | 15.05 s | 2,060 | 65 | 4,427 / 4,069 |
| Avalanche Ram | 3.0 s | 1,623 | 10 | — |
| Crag Mortar | 3.0 s | 1,778 | 13 | — |
| Boulder Thrower | 2.85 s | 2,147 | 16 | — |
| Stone Eagle | 2.8 s | 1,899 | 14 | — |

For the Mountain event streams, incoming damage in the final windows was
mostly direct damage from the large or ranged threats. Across runs, the
largest final-10-second direct totals were Granite Titan 4,989.52,
Boulder Thrower 3,899.62, Stone Eagle 3,855.95, and Mountain Colossus
3,243.12. In final-30-second windows the largest direct totals were Mountain
Colossus 8,187.20, Granite Titan 4,539.54, Stone Eagle 2,821.80, and
Boulder Thrower 2,530.89. Small debt events were present but far below the
direct totals. This is source accounting for the retained event windows,
not a causal attribution of deaths.

## T4 specialization and biome screen

The T4 blocks are not a seven-biome survey in this run. The observed coverage
was:

| Block | Desert | Graveyard | Jungle | Mountain | Tundra | Volcano | Trench | Observed species |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| T4A | 12 | 12 | 12 | 11 | 0 | 0 | 0 | 17 |
| T4B | 12 | 12 | 12 | 12 | 0 | 0 | 5 | 20 |
| T4C | 12 | 12 | 12 | 10 | 0 | 0 | 0 | 17 |

T4B's five Trench cells are the partial Trench03 exposure. Tundra and
Volcano were never reached, and T4A/T4C never reached Trench. Species in
those unstarted branches must be treated as unobserved, not as zero-risk or
missing from the balance.

The class summary below is median cell TTK in seconds, with started cells and
player deaths in parentheses:

| Class | T4A | T4B | T4C |
|---|---:|---:|---:|
| Apprentice | 2.40 (8 cells, 0 deaths) | 2.40 (9, 0) | 3.70 (8, 0) |
| Conduit | 4.97 (8, 0) | 6.10 (9, 0) | 8.00 (7, 0) |
| Slinger | 3.38 (8, 0) | 5.80 (9, 4) | 2.95 (8, 0) |
| Spirit | 5.00 (7, 2) | 2.75 (8, 0) | 3.00 (7, 0) |
| Squire | 6.00 (8, 0) | 4.60 (9, 0) | 3.20 (8, 0) |
| Striker | 2.05 (8, 0) | 2.00 (9, 0) | 2.33 (8, 0) |

The biome summary was:

| Biome | T4A median / deaths | T4B median / deaths | T4C median / deaths |
|---|---:|---:|---:|
| Desert | 5.25 s / 2 | 3.95 s / 0 | 3.35 s / 0 |
| Graveyard | 4.65 s / 0 | 5.00 s / 4 | 4.40 s / 0 |
| Jungle | 2.42 s / 0 | 2.20 s / 0 | 2.40 s / 0 |
| Mountain | 2.30 s / 0 | 1.75 s / 0 | 1.80 s / 0 |
| Trench | — | 11.60 s / 0 | — |

Review candidates are deliberately narrow:

- Graveyard has the highest target-censoring counts in all three T4 blocks
  and is the only biome associated with the four T4B deaths. Inspect the
  Slinger/Graveyard rows and their event streams before considering any
  numeric change.
- Conduit is the slowest observed class in T4B and T4C. That is a candidate
  for a class/build interaction review, not proof that Conduit or any shared
  stat should be changed.
- T4A's two deaths are concentrated in the Desert and Spirit marginal
  summaries. Treat that as a pairing to inspect, not a confirmed
  Spirit-versus-Desert diagnosis.
- T4B's rare Trench species are under five-cell coverage: Elder Leviathan
  18.75 s, Abyssal Serpent 9.10 s, and Hadal Stalker 4.80 s. Their estimates
  are not comparable to the 12-cell biome arms.
- The full species tables remain in each night5-audit.json. Fast small
  species and the high target-censoring rows should be reviewed together;
  no blanket T4 mob or class patch is justified.

## Sustain and farming screen

Weapons completed all 432 observations with no wall-censored row. Sustain
completed all 144 observations with one wall-censored row. In the Sustain
raw summaries, the first 300,000 simulation milliseconds contained 5,104
kills and 18 target-censored rows; the remainder contained 24,374 kills and
174 target-censored rows. Recovery entries split 3,153 before five minutes
and 14,795 after; interrupted recovery entries split 1,000 and 4,669.
Player deaths split one before five minutes and two after.

The Sustain event streams contain direct, AOE, DoT, and debt damage labels.
Across the retained streams these are 369,868, 12,569, 26,485, and 7,664
damage-event records respectively; these are event counts, not damage
totals. Sample telemetry has 20,215 rows with non-zero incomingDot. This
supports a follow-up at the event/source level, but does not establish an
environmental or DoT balance cause.

Representative Sustain species results were:

| Species | Median TTK | Target kills | Target-censored | Casts started / fired |
|---|---:|---:|---:|---:|
| Glacier Bear | 15.875 s | 1,407 | 14 | — |
| Dire Wolf | 15.10 s | 1,235 | 12 | 3,462 / 2,926 |
| Magma Tortoise | 12.30 s | 863 | 21 | — |
| Moss-Shell Snapper | 8.70 s | 2,562 | 15 | — |
| Ironclaw Badger | 7.60 s | 1,191 | 5 | — |
| Cinder Hound | 5.9375 s | 895 | 8 | — |

The audit recorded eight long-quiet runs. That is an inactivity signal for
inspection, not evidence that the bot was safe while inactive. No farming
safety or economy conclusion should use quiet time as a positive result.

## Jungle performance and cutoff boundary

The Jungle observations in each T4 block show a distinct runtime boundary:

| Block | Jungle runs | Simulated hours | Max wall elapsed | Max tick | Deaths | Wall-censored | Incoming damage |
|---|---:|---:|---:|---:|---:|---:|---:|
| T4A | 36 | 5.701 | 121.1 s | 1,682 ms | 0 | 19 | 29,444.9 |
| T4B | 36 | 6.490 | 120.9 s | 1,247 ms | 0 | 15 | 42,818.1 |
| T4C | 36 | 5.787 | 120.7 s | 1,285 ms | 0 | 20 | 28,441.6 |

The approximately 120-second wall times and millisecond-scale tick spikes
make Jungle a performance and cutoff investigation. The zero deaths here
must not be read as a survival result because many observations ended at the
wall ceiling before their planned windows.

## Finite planner worklist

1. Keep the Mountain boot and orbit questions open. The observed Cave-boots
   advantage is a follow-up candidate, not a production stat decision.
2. Inspect Mountain final-window source mixes, late joiners, and individual
   multi-pursuer spikes before changing pull-control behavior.
3. Follow up on T4 Graveyard censoring, the T4B Slinger/Graveyard deaths, and
   the Conduit duration tail with a separately authorized packet.
4. Treat T4B Trench03 as rare, partial exposure. Do not infer Tundra, Volcano,
   or missing Trench branches from this run.
5. Investigate the Jungle wall/tick boundary before using its observations
   for balance. Preserve the raw partial blocks rather than extending their
   caps.
6. For Sustain, inspect source-level DoT, debt, and any environment-tagged
   events; keep inactivity separate from safety and economy certification.

No item in this worklist authorizes a retry, a cap extension, source edits, or
a production balance patch.

## Retained artifacts

The complete raw result tree is retained at the [R1 results root](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/night5-r1-20260917/results>).
Each block retains its manifest, index.json, analysis.json, analysis.md, and
night5-audit.json. Weapons and Sustain additionally retain complete.json and
verification.json; the four partial blocks retain budget-exhausted.json.

Direct block links:

- [Mountain index](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/night5-r1-20260917/results/mountain/index.json>) and [Mountain audit](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/night5-r1-20260917/results/mountain/night5-audit.json>)
- [T4A index](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/night5-r1-20260917/results/t4a/index.json>) and [T4A audit](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/night5-r1-20260917/results/t4a/night5-audit.json>)
- [Weapons index](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/night5-r1-20260917/results/weapons/index.json>) and [Weapons audit](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/night5-r1-20260917/results/weapons/night5-audit.json>)
- [T4B index](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/night5-r1-20260917/results/t4b/index.json>) and [T4B audit](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/night5-r1-20260917/results/t4b/night5-audit.json>)
- [Sustain index](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/night5-r1-20260917/results/sustain/index.json>) and [Sustain audit](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/night5-r1-20260917/results/sustain/night5-audit.json>)
- [T4C index](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/night5-r1-20260917/results/t4c/index.json>) and [T4C audit](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/night5-r1-20260917/results/t4c/night5-audit.json>)

The frozen runner remains at [night5-run.mjs](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/night5-r1-20260917/source/scripts/night5-run.mjs>).
The report does not delete the detached source worktree or any raw result.
