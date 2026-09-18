# Durability 9 report — role durability patch and Bear pressure screen

Status: **partial / halted after Block A**. This is synthetic benchmark evidence
only. Block A completed its full matrix, but the prescribed operator process
exited on its post-block identity guard before Block B could launch. The
persisted Block A manifest and completion record re-evaluate cleanly in a
read-only audit; the original guard cause was not isolated. Do not treat this
as a completed two-block packet or as authorization for a live patch.

## Decision summary

- The exact frozen command ran once for `durability9roster`: **200/200 cells,
  600/600 observations**, 587 normal 300-second windows, 13 player deaths,
  zero failed observations, and zero retries or restarts. Its reporter wrote
  `analysis.json` and `analysis.md`.
- The process stopped immediately after Block A at the packet's manifest guard
  with exit 1 (`Identity mismatch`). A fresh read-only check returns true for
  all completion, trial, revision, definitions, hitbox, and seed predicates.
  This remains a harness/guard stop, not a silently repaired pass.
- The applied role package clearly lengthened the declared bodies. The largest
  clean six-baseline changes were T2 Jungle Ape 5.75s → 10.95s, T3
  Silverback 4.68s → 10.50s, T2 Moss-Shell Snapper 4.50s → 8.60s, and T3
  Desert controllers roughly 7.3–7.6s → 21.0–22.0s. The T3 Desert selected
  arm remained survivable for the six baselines, but its alternate Slinger
  had one death and several selected rows reached the low-HP pressure screen.
- T2 Desert Sun Scarab relief is directionally encouraging: the previous arm
  had six Striker deaths and two Apprentice deaths across the two nodes; the
  selected arm had none in those same baseline cells. This is descriptive
  synthetic evidence, not a global live recommendation.
- **Bear pressure is unanswered.** `durability9bear` was not launched, so no
  Bear attack-relief conclusion may be drawn from this packet. Qualification
  and pilot records are setup evidence only.
- No live balance edit, source edit, automatic winner, class nerf, equipment
  adaptation, economy conclusion, client/browser conclusion, or human-feel
  conclusion was made.

## Frozen identity and execution

| Item | Value |
|---|---|
| Operator packet | [bot-balance-durability9-operator-packet.md](bot-balance-durability9-operator-packet.md) |
| Frozen source revision | `02758290bc40042d0f65618e465ecb5e0b78d09d` |
| Frozen source tree | `3e5c4e11b39549289fae8843b911d44e1ad9417a` |
| Definitions SHA-256 | `9DB8E38909CB8EC1B60FAAC20CDB412FF798498EBEEE4C5D05F6FBD70A9F8AED` |
| Hitboxes | [hitboxes.json](<C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json>) |
| Hitboxes SHA-256 | `08BCC55633EFE444D303C71977F7DCF87402157753AF543E975E6C0C493AFA83` |
| Detached source worktree | `C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability9-20260916/source` |
| Qualification root | `C:/Users/osaif/AppData/Local/mmo-idle/validation/durability9` |
| Results root | [Durability 9 roster results](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability9-20260916/results-durability9roster>) |
| Operator ledger | [operator-ledger.jsonl](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability9-20260916/operator-ledger.jsonl>) |
| Mode / timestep / window | `run` / 100ms / 300s per observation |
| Seeds | 173, 947, 2027 |
| Synthetic / economy | `true` / `economyEligible=false` |

The exact combat command was the packet command, run from the detached
checkout:

~~~powershell
pnpm --dir C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability9-20260916/source --filter @mmo-idle/server exec tsx --conditions=development scripts/ttkSurvey.ts --trial=durability9roster --mode=run --revision=02758290bc40042d0f65618e465ecb5e0b78d09d --hitboxes=C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json --out=C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability9-20260916/results-durability9roster
~~

The Block A ledger window was `2026-09-16T07:27:57.5943197Z`–
`2026-09-16T08:18:25.2608275Z`, or 50m27.6665s wall time. The output contains
2,405 files and 880,384,594 bytes (about 839.6 MiB). The packet ceilings were
120s per observation, 4h per block, and 2 GiB RSS; peak RSS was not
independently sampled. No Docker, database, service restart, retry, or source
checkout mutation was used.

## Block completeness and artifacts

| Block | Planned | Executed | Result | Exit / stop |
|---|---:|---:|---|---|
| A `durability9roster` | 200 cells / 600 runs | 200 / 600 | 587 windows, 13 deaths, 0 failed | 1; post-block identity guard |
| B `durability9bear` | 32 cells / 96 runs | 0 / 0 | Not launched | stopped by packet rule |

`complete.json` for Block A is `{"cells":200,"runs":600,"mode":"run"}`.
There are 600 run directories, each with `ready.json`, `summary.json`,
`events.jsonl`, and `samples.jsonl`; no `failed.json` exists.

| Artifact | SHA-256 |
|---|---|
| [manifest.json](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability9-20260916/results-durability9roster/manifest.json>) | `28DDB71210A19491CC3FEE9AF7CE43E3C9AD0823C251C159001FE8D4093E5141` |
| [index.json](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability9-20260916/results-durability9roster/index.json>) | `39A140A8385245CBE64DF1AFD61BD6B59CF4DB060B7CAAEE942D925890421AFA` |
| [complete.json](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability9-20260916/results-durability9roster/complete.json>) | `960026C60EBB4F33FCCEA65A34DDCD96E1517469E831C72F03C90EA1F443B11C` |
| [analysis.json](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability9-20260916/results-durability9roster/analysis.json>) | `DD07DBEEDBCA9C626C13E000577991B901B4938A15D8E6AD036E4E2871E946D1` |
| [analysis.md](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability9-20260916/results-durability9roster/analysis.md>) | `49CA661D1780789FDCF5B4861DD0A0554989A8D18CA02C29C2984318FF85F6EA` |

The pre-launch qualification receipts remained unchanged and were not rerun:

| Qualification | Cells | Index SHA-256 |
|---|---:|---|
| `durability9roster` | 200 | `C308DE7DC265663B483230F1766403675527352E4493948D78C91D2D63ECD4FD` |
| `durability9bear` | 32 | `0C6033E22960A28D3DB5A7993C7D167D0B1530FA30580369CCD8CE4549DED116` |

The detached checkout still reports the frozen revision and tree and has no
tracked changes. The original process's guard error is preserved in the task
execution record; the later read-only audit found all of these predicates
true: `cells=200`, `runs=600`, `mode=run`, trial, revision, definitions SHA,
hitbox SHA, and `173,947,2027` seeds. The ambiguity is retained rather than
used to launch Block B.

## Applied arms and READY-state isolation

The previous arm restores the ten pre-patch fields; selected asserts the
approved values in the frozen source. These are actual post-overlay READY
values, with normal node modifiers included in the spawned column.

| Runtime target / display | Previous authored → selected | Representative spawned previous → selected |
|---|---:|---:|
| `ancient-wolf` / Dire Wolf | HP 350 → 525 | 385 → 578 in T2 Forest 03 |
| `stampede-bull` / Stampede Bull | HP 330 → 495 | 330 → 495 in T2 Plains 03 |
| `jungle-ape` / Jungle Ape | HP 600 → 1,200 | 660 → 1,320 in T2 Jungle 03 |
| `silverback` / Silverback | HP 1,045 → 2,090 | 1,202 → 2,404 in T3 Jungle 03 |
| `swamp-hydra` / Moss-Shell Snapper | HP 340 → 680 | 340 → 680 in T2 Swamp 03 |
| `plague-hydra` / Plague-Shell Snapper | HP 580 → 1,160 | 580 → 1,160 in T3 Swamp 03 |
| `dust-djinn` / Sun Scarab | attack 60 → 48 | 72 → 58 in T2 Desert 03 |
| `dune-stalker` / Dune Stalker | HP 1,350 → 4,050 | 1,552 → 4,658 in T3 Desert 03 |
| `desert-basilisk` / Desert Basilisk | HP 1,350 → 4,050 | 1,552 → 4,658 in T3 Desert 03 |
| `sandweaver` / Gilded Scarab | attack 120 → 96 | 156 → 125 in T3 Desert 03 |

The qualification audit compared 100 previous/selected pairs: build mismatches
0, target-roster mismatches 0, geometry mismatches 0, and unexpected companion
HP mismatches 0. The expected changed runtime roster types were exactly
`ancient-wolf`, `jungle-ape`, `stampede-bull`, `swamp-hydra`, `silverback`,
`plague-hydra`, `dune-stalker`, and `desert-basilisk`. Sun Scarab and Gilded
Scarab attack-only changes left roster HP unchanged. All other companion
roster members and non-declared stats matched their pair.

All six baseline classes used the packet's fixed +5 gear, biome armor/charm,
Mountain Boots, Tempered Core, medium frames, normal range branch, offensive
stance, Sweep, Second Wind/Cleanse, and no Slam or weapon adaptation. T3
Desert additionally retained only the declared Slinger weapon-alt and Conduit
weapon-alt watchlist arms. Acquisition, travel, economy, client, and human
play were not part of this run.

## Metric definition and Block A results

For each cell and target type, each seed value below is the median of eligible
raw `index.json.targets` TTK values where `clean=true`,
`hpRegainObserved=false`, `killedAtMs` is present, and `ttkMs` is finite. The
reported outer value is the median of available seed medians; a missing seed
median is not treated as zero. Six-baseline centers use only the six
`alternate=false` classes. The generated [analysis.md](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability9-20260916/results-durability9roster/analysis.md>)
and raw [index.json](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability9-20260916/results-durability9roster/index.json>)
retain the complete per-cell/build/arm data.

Block A totals were 21,970 target kills, 553 unfinished targets, 21,711 clean
target observations, and 456 observed-HP-regain exclusions. The runner counted
111,900 player attack beats, 85,523 minion attack beats, and 197,423 total
attack beats. These are cooldown timestamp changes, not damage events or
guaranteed hits; no technique balance conclusion is drawn.

### Six-baseline node centers

Cell values are `Striker / Squire / Apprentice / Slinger / Conduit / Spirit`
outer medians in seconds. Centers are the median of those six values.

| Node | Previous values | Selected values | Center previous → selected | Deaths previous → selected |
|---|---|---|---:|---:|
| T2 Desert 03 | 10 / 7.6 / 7.5 / 5.6 / 20.1 / 5.95 | 10 / 7.6 / 7.5 / 5.75 / 20.4 / 6.3 | 7.55 → 7.55 | 4 → 0 |
| T2 Desert 05 | 10 / 7.6 / 7.5 / 5.6 / 19.5 / 6.3 | 10 / 7.6 / 7.5 / 5.6 / 19.1 / 6.3 | 7.55 → 7.55 | 4 → 0 |
| T2 Forest 03 | 3.5 / 1.9 / 3.2 / 1.5 / 3.2 / 1.4 | 3.5 / 1.9 / 3.2 / 1.5 / 2.8 / 1.4 | 2.55 → 2.35 | 0 → 0 |
| T2 Forest 05 | 3 / 1.9 / 3 / 1.2 / 2.8 / 1.4 | 3 / 1.9 / 3 / 1.2 / 2.7 / 1.4 | 2.35 → 2.3 | 0 → 0 |
| T2 Jungle 03 | 5.5 / 3.8 / 4.8 / 3.65 / 5.7 / 3.5 | 5.5 / 3.8 / 4.8 / 3.8 / 5 / 3.5 | 4.3 → 4.3 | 1 → 0 |
| T2 Jungle 05 | 4.5 / 3.8 / 4.5 / 3.2 / 4.3 / 2.8 | 4.5 / 3.8 / 4.5 / 3.2 / 3.55 / 2.8 | 4.05 → 3.68 | 0 → 1 |
| T2 Plains 03 | 2.5 / 0 / 2.7 / 1.2 / 2.8 / 1.4 | 2.5 / 0 / 3 / 0.9 / 3.2 / 1.4 | 1.95 → 1.95 | 0 → 0 |
| T2 Plains 05 | 3 / 1.9 / 2.2 / 0.9 / 3.55 / 1.4 | 2.5 / 3.8 / 3 / 0.9 / 3.8 / 1.4 | 2.05 → 2.75 | 0 → 0 |
| T2 Swamp 03 | 3 / 1.9 / 3 / 0.9 / 3.3 / 2.1 | 2.75 / 1.9 / 2.2 / 2.3 / 2.6 / 1.4 | 2.55 → 2.25 | 0 → 0 |
| T2 Swamp 05 | 3 / 1.9 / 3 / 2.6 / 2.7 / 2.1 | 3.5 / 1.9 / 3 / 2.6 / 3.1 / 2.1 | 2.65 → 2.8 | 0 → 0 |
| T3 Desert 03 | 5.15 / 8.2 / 7.4 / 7.3 / 19.75 / 5.05 | 16.4 / 24.2 / 21 / 21.4 / 42.1 / 17 | 7.35 → 21.2 | 0 → 0 |
| T3 Desert 05 | 5.1 / 7.2 / 7.15 / 6.15 / 20.3 / 4.8 | 15.95 / 23.5 / 21 / 21.7 / 39.25 / 16.2 | 6.65 → 21.35 | 1 → 0 |
| T3 Jungle 03 | 2.5 / 3.85 / 4.4 / 4 / 8.2 / 3 | 2.5 / 4.25 / 4.4 / 3.8 / 7.9 / 3.1 | 3.93 → 4.03 | 0 → 1 |
| T3 Jungle 05 | 2 / 3.2 / 3.5 / 3.3 / 5.1 / 2.4 | 2 / 3.3 / 3.5 / 3.5 / 6.6 / 2.7 | 3.25 → 3.4 | 0 → 0 |
| T3 Swamp 03 | 1.5 / 1.6 / 2.85 / 2.8 / 2.6 / 1.4 | 2.2 / 1.8 / 2.7 / 2.9 / 3 / 1.4 | 2.1 → 2.45 | 0 → 0 |
| T3 Swamp 05 | 2.5 / 3.2 / 3 / 3.1 / 6.5 / 2.1 | 3.4 / 7.2 / 3 / 3.1 / 3.3 / 1.9 | 3.05 → 3.2 | 0 → 0 |

### Changed-target six-class centers by seed

Each row is `seed 173 / seed 947 / seed 2027 → outer` in seconds. These are
six-class target centers, kept separate from the cell/body centers above.

| Node / target | Previous | Selected |
|---|---:|---:|
| T2 Desert 03 Sun Scarab | 6.03 / 9.73 / 7.7 → 7.7 | 9.95 / 7.98 / 7.35 → 7.98 |
| T2 Desert 05 Sun Scarab | 9.6 / 4.25 / 6.23 → 6.23 | 12.15 / 7.7 / 7.5 → 7.7 |
| T2 Forest 03 Dire Wolf | 3.9 / 4.25 / 3.83 → 3.9 | 5.65 / 5.93 / 4.85 → 5.65 |
| T2 Forest 05 Dire Wolf | 3.35 / 2.55 / 3.03 → 3.03 | 4.35 / 5.33 / 4.78 → 4.78 |
| T2 Jungle 03 Jungle Ape | 5.75 / 5.75 / 5.65 → 5.75 | 10.95 / 10.95 / 10.95 → 10.95 |
| T2 Jungle 05 Jungle Ape | 4.4 / 4.35 / 4.3 → 4.35 | 9.95 / 10 / 9.98 → 9.98 |
| T2 Plains 03 Stampede Bull | 3.35 / 3.35 / 3.05 → 3.35 | 4.15 / 4.58 / 4.05 → 4.15 |
| T2 Plains 05 Stampede Bull | 3.5 / 2.65 / 3.5 → 3.5 | 4.8 / 4.3 / 4.23 → 4.3 |
| T2 Swamp 03 Moss-Shell Snapper | 4.85 / 4.5 / 4.5 → 4.5 | 8.6 / 7.55 / 8.6 → 8.6 |
| T2 Swamp 05 Moss-Shell Snapper | 4.8 / 4.8 / 6.55 → 4.8 | 7.8 / 8.13 / 8.7 → 8.13 |
| T3 Jungle 03 Silverback | 4.8 / 4.68 / 4.53 → 4.68 | 10.5 / 9.95 / 10.75 → 10.5 |
| T3 Jungle 05 Silverback | 4.2 / 3.7 / 3.55 → 3.7 | 8.4 / 8.45 / 8.45 → 8.45 |
| T3 Swamp 03 Plague-Shell Snapper | 5.53 / 4.75 / 5.78 → 5.53 | 7.6 / 7.73 / 7.63 → 7.63 |
| T3 Swamp 05 Plague-Shell Snapper | 4.5 / 5.55 / 5.4 → 5.4 | 8.2 / 7.75 / 8.5 → 8.2 |
| T3 Desert 03 Dune Stalker | 7.38 / 7.25 / 7.25 → 7.25 | 20.98 / 21.2 / 21 → 21 |
| T3 Desert 03 Desert Basilisk | 7.53 / 7.35 / 7.85 → 7.53 | 21.9 / 22.13 / 21.9 → 21.9 |
| T3 Desert 03 Gilded Scarab | 5.18 / 3.1 / 5.53 → 5.18 | 2.4 / 2.9 / 2.25 → 2.4 |
| T3 Desert 05 Dune Stalker | 7.3 / 6.5 / 7.3 → 7.3 | 20.9 / 21.25 / 20.98 → 20.98 |
| T3 Desert 05 Desert Basilisk | 7.35 / 7.6 / 7.6 → 7.6 | 21.85 / 22.83 / 22 → 22 |
| T3 Desert 05 Gilded Scarab | 2.95 / 3.78 / 5.35 → 3.78 | 2.53 / 2.5 / 2.2 → 2.5 |

The Gilded Scarab rows are exposure/target-duration diagnostics, not a
dealer-HP change: the selected arm changed its attack only. Their small TTK
movement is expected ecological variation and must not be read as a damage
or HP conclusion.

## Death and severe near-death attribution

There were 13 deaths: 10 previous-arm and 3 selected-arm. For every death and
for every surviving run below 20% minimum HP, the audit inspected direct damage
events in a ±10-second window around the death or the sample containing the
minimum HP. The complete event streams remain in each run directory.

| Death group | Seeds / time | Dominant direct sources in window |
|---|---|---|
| T2 Desert 03/05 Striker previous | 03: s173 48.3s, s947 17.3s, s2027 146.7s; 05: s173 48.3s, s947 17.3s, s2027 94.3s | Sun Scarab 220–243.4 HP damage across 6 hits plus Sand Scorpion 94 across 2 hits; Numbing Sting present |
| T2 Desert 03/05 Apprentice previous | s947 at 41.1s on both nodes | Sand Scorpion 99.8 across 7 hits plus Sun Scarab 91 across 9 hits; Numbing Sting present |
| T2 Jungle 03 Spirit previous | s947 at 220.6s | Vine Chameleon 398 across 21 hits |
| T2 Jungle 05 Squire selected | s947 at 224.5s | Vine Chameleon 348 across 21 hits, Jungle Snake 124 across 18, Jungle Ape 44 across 7 |
| T3 Desert 03 Slinger weapon-alt selected | s173 at 66.7s | Gilded Scarab 331, Dune Stalker 125.2, Desert Basilisk 57; Numbing Sting, Petrifying Gaze, and Sunbeam |
| T3 Desert 05 Apprentice previous | s173 at 290.2s | Gilded Scarab 417.8 across 12 hits plus Desert Basilisk 54.9 across 4; Petrifying Gaze and Sunbeam |
| T3 Jungle 03 Conduit selected | s173 at 142.9s | Silverback 575 across 7 hits plus Jungle Stalker 294 across 14 |

There were 17 surviving runs below 20% minimum HP. The worst selected-arm
examples were T3 Jungle 03 Conduit at 3.4% (s2027, 107s; Silverback 681 and
Jungle Stalker 366, Canopy Barrage), T3 Jungle 05 Conduit at 5.8% (s2027,
67s; Silverback 953), T3 Jungle 03 Apprentice at 11.6% (s2027, 296s; Silverback
418.9 and Jungle Stalker 164.4), and T3 Desert selected Striker at 15.2–15.9%
under Gilded Scarab plus Desert Basilisk pressure. These are differing
encounter shapes, not pure body-HP causal measurements.

## Return to planner / exit boundary

The Block A screen supports retaining all ten approved fields as diagnostic
inputs for a later validation decision, with these cautions:

- T2 Dire Wolf, Stampede Bull, Jungle Ape, and Moss-Shell Snapper increased
  body duration without a broad selected-arm death wall. Keep them in review;
  do not live-adopt from this synthetic screen.
- T3 Silverback and Plague-Shell Snapper also lengthened, but selected Conduit
  pressure in T3 Jungle warrants a class/encounter review before any general
  roll-out.
- T3 Desert Dune/Basilisk HP3x is a useful upper-bound duration case near the
  25–35s context for typical builds. The alternate Slinger/Conduit rows remain
  diagnostic and should not be pooled with the six-baseline center.
- T2 Sun Scarab attack relief is a plausible local survivability candidate;
  the paired Desert signal is useful, but the evidence does not authorize a
  global value or a further balance edit.
- The Bear arm comparison is pending. Do not infer Bear survival, attack,
  shield, shatter, or slow conclusions from the qualification/pilot artifacts.

The operator packet required a `create → launch → report` progression for both
blocks and explicitly required stopping on tooling failure or an identity
mismatch. This report preserves the complete Block A artifacts and records
Block B as not launched. Any continuation requires a new explicit operator
decision; it must not reuse or overwrite this output directory.
