# Durability30 — Trench Stalker pacing and Jungle CPU diagnosis

Date: 2026-09-17  
Status: complete; sealed synthetic screen audited; no production balance edit authorized  
Decision scope: whether Hadal Stalker 16,800 → 21,000 runtime HP improves the Trench mini-boss pacing target without a demonstrated attrition cost, and whether the unchanged Jungle cutoff rows identify a bounded CPU diagnostic

## Executive result

Durability30 executed once and sequentially on the sealed checkout. The runner exited 0. Both blocks verified all 84 observations: Trench 24 cells / 72 observations and Jungle 4 cells / 12 observations. Trench produced 72/72 complete 600-second windows with no player deaths or wall ceilings. Jungle produced 6/12 complete 120-second windows and 6/12 wall-ceiling observations, with no player deaths. No retry, relaunch, adaptive change, source edit, balance edit, cap extension, service, commit, or push was introduced.

- **Trench Stalker 21,000 — reject as a universal scalar; retain as targeted pacing evidence.** The candidate raised the clean Hadal Stalker body median in 11 of 12 cell medians with at least two eligible paired seeds, but the resulting range remained highly class-sensitive: 21.50–249.48 seconds versus 18.80–195.43 seconds in control. It moved several fast roots toward the 40–60-second body target, while slow Conduit/Squire encounters remained far above it. It did not produce an attrition result because no player died in either arm.
- At block level, candidate target throughput fell from 417 to 375 kills over the same 21,600 simulated seconds, while incoming HP damage fell slightly from 1,662.45 to 1,639.55 per 100 simulated seconds. The candidate minimum-HP median rose from 46.50% to 48.37%, but its lowest observed minimum fell from 33.13% to 22.18%. With zero terminal events, these mixed pressure changes do not justify production adoption or a global HP rule.
- The fixed context held: Elder Leviathan remained 17,640 HP, Abyssal Serpent remained 16,800 HP, attack/plating/damage reduction and geometry were paired-identical, and the Leviathan Carapace absolute shell budget was preserved. The source-level 18% shell at 5,880 base HP was inverse-scaled to 6% at 17,640 runtime HP, yielding the same rounded 1,058-point shell in both arms.
- **Jungle remained a diagnostic replay, not a balance survey.** All 12 rows matched their corresponding Durability23 outcome class, simulated evidence, HP, quiet duration within small timing variance, and targeting/movement counters. The six prior wall ceilings remained six wall ceilings. CPU profiling adds overhead; the changed wall times and max-tick values are not performance-improvement evidence.
- The valid next technical question is bounded instrumentation around repeated pathfinding and collision sampling. The whole-process profile attributes 93.52% of sampled time to movement/targeting, led by pathfind and spatial collision helpers, but has no reliable observation-boundary markers. It does not prove a single function defect and does not authorize a repair in this packet.

No production adoption, further automatic scalar grid, live/economy conclusion, or invited-playtest claim follows from this packet. Consolidate retained mob candidates on current source, resolve the Jungle diagnostic before tuning Jungle HP, and run the required current-source regression separately.

## Frozen identity and execution

| Field | Value |
| --- | --- |
| Revision | e151f061be054242154cb327d3ec632307cc4a79 |
| Frozen branch | codex/durability30-frozen |
| Source tree | 3afae2c30bc5b7a0db407d97f5f7c5d0ea1fdb17 |
| Definitions hash | a30458ee24ad7054c5389b1ed16d47f3435456c18feb34f72ded75c84b0828c0 |
| Hitbox hash | 08bcc55633efe444d303c71977f7dcf87402157753af543e975e6c0c493afa83 |
| Blocks | Trench and Jungle |
| Matrix | 28 cells / 84 observations total |
| Trench matrix | 24 cells / 72 observations; nodes 03 and 05; six T4A roots; seeds 86011, 88001, 90001 |
| Jungle matrix | 4 cells / 12 observations; nodes 03 and 05; original Durability23 rows; seeds 44017, 46021, 48017 |
| Timestep / windows | 100ms / Trench 600 simulated seconds / Jungle 120 simulated seconds |
| Synthetic / economy eligible | true / false |
| Batch start | 2026-09-17T19:31:16.653Z |
| Trench ledger | 2026-09-17T19:31:16.653Z → 2026-09-17T19:35:04.434Z; code 0; watchdog false |
| Jungle ledger | 2026-09-17T19:35:05.615Z → 2026-09-17T19:48:15.167Z; code 0; watchdog false |
| Batch end marker | 2026-09-17T19:48:15.388Z; wall 1,018,736ms |
| Operator exit marker | 2026-09-17T19:48:15.4160976Z; exit 0 |
| Detached source | C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability30-20260917/source |
| Results root | C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability30-20260917/results |
| READY receipts | C:/Users/osaif/AppData/Local/mmo-idle/validation/durability30 |

The detached source remained clean at the frozen revision. The shared checkout was already dirty with unrelated user changes; those changes were preserved. This report and its README index entry are the only intended shared-checkout edits for this packet. No production files were changed. No full repository suite or live/browser playtest was run.

## Treatment and causal contract

The Trench control and candidate both installed the selected Durability22 package. The candidate then changed only Hadal Stalker HP:

| Species | Original source HP | READY control max HP | READY candidate max HP | Control → candidate | Other fixed READY stats |
| --- | ---: | ---: | ---: | ---: | --- |
| Hadal Stalker | 2,800 | 16,800 | 21,000 | +25.00% | attack 175; plating 20; DR 0.10 |
| Abyssal Serpent | 4,200 | 16,800 | 16,800 | unchanged | attack 190; plating 18; DR 0.20 |
| Elder Leviathan | 5,880 | 17,640 | 17,640 | unchanged | attack 210; plating 22; DR 0.24 |

The paired READY audit covered all 36 same-seed Trench control/candidate pairs:

| Check | Result |
| --- | --- |
| READY player view after removing the cell-specific name/id | 36/36 identical |
| Player HP, attack, plating, damage reduction, cooldown, stance and gear | 36/36 identical |
| Geometry roster hash | 36/36 identical |
| Non-HP roster IDs, types and positions | 36/36 identical |
| Initial attack / plating / DR | 36/36 identical |
| HP differences | Hadal Stalker only, 36/36 candidate pairs |
| Unexpected HP or stat differences | 0 |
| Initial roster hash | differs as expected because Stalker HP differs |

The READY player products were not treatment variables. For example, the node03 Striker pair both began with 470 HP, 152 attack, 76 plating, 256 speed, 441ms attack cooldown, and weapon volcanic-eruption-lash, trench-vest-t4, trench-charm-t4, mountain-boots-t4, core-tempered, and relic-colossus-heart. Every root retained its paired-identical Durability22 build and equipment.

The fixed Leviathan shell was audited from the frozen treatment and source contract. The Durability22 installer scales shield actions by original-HP / candidate-HP. Elder Leviathan Carapace Renewal is a 5,000ms shell with a 9,000ms initial delay and 16,000ms cooldown. Its source 18% of 5,880 equals 1,058.4; the installed 6% of 17,640 also equals 1,058.4, rounded by the combat pipeline to 1,058. Both D30 arms therefore used the same absolute shell budget. Raw events expose the cast start/end but not the shield amount, so this is a source-and-runtime-contract verification, not a claim of direct shield-capacity telemetry.

## Block-level raw ledger

WE/PD/WC means window-ended at the configured simulated limit / player-died / wall-ceiling. K/U/R means target records with a kill / unfinished or censored target record / observed target HP regain. Target-record censoring is separate from run-level outcome. Incoming HP damage is raw monster-to-player HP damage after player barrier absorption. Rates are normalized by simulated exposure, not pooled class DPS.

| Block / arm | Runs | WE/PD/WC | Simulated seconds | Min HP median / low | Min barrier median / low | Target K/U/R | Kills / 100 sim s | Incoming HP | Incoming / 100 sim s | Episodes cleared / unfinished | Late joins / recovery | Worst max tick ms | Largest hit / max damage in 1s |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Trench / control | 36 | 36/0/0 | 21,600 | 46.50% / 33.13% | 0 / 0 | 417 / 74 / 72 | 1.93 | 359,089.58 | 1,662.45 | 121 / 36 | 419 / 121 | 63 | 185 / 274.0 |
| Trench / candidate | 36 | 36/0/0 | 21,600 | 48.37% / 22.18% | 0 / 0 | 375 / 94 / 82 | 1.74 | 354,141.73 | 1,639.55 | 128 / 35 | 397 / 128 | 63 | 185 / 382.7 |

All 24 Trench cell/arm rows were window-ended; no Trench row was dead, wall-cut, quiet-flagged, or missing. Every Trench row reached sampled player barrier 0. A zero sampled barrier is a resource observation, not a death finding.

## Trench cell outcome and pressure comparison

The cell medians below preserve all 12 root/node cells. Overall target TTK is the generated analysis median of clean target records and is not the body-specific timing estimator. Min HP is median / low across the three run rows. K/U/R retains target-level kills, unfinished/censored records and observed HP regains.

| Node / root | Control WE/PD/WC | Candidate WE/PD/WC | Target TTK control → candidate (s) | Min HP median / low control → candidate | Incoming / 100 control → candidate | K/U/R control → candidate |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 03 / Striker (Maestro) | 3/0/0 | 3/0/0 | 25.00 → 29.30 | 63.75% / 56.67% → 56.98% / 52.60% | 2,048.56 → 2,078.78 | 54/4/0 → 51/2/0 |
| 03 / Squire (Reverb) | 3/0/0 | 3/0/0 | 73.60 → 84.40 | 58.80% / 45.15% → 73.48% / 58.80% | 2,365.39 → 1,998.22 | 18/4/1 → 17/3/0 |
| 03 / Apprentice | 3/0/0 | 3/0/0 | 19.80 → 21.50 | 46.68% / 43.52% → 37.42% / 22.18% | 1,629.51 → 1,770.07 | 72/7/11 → 69/6/9 |
| 03 / Slinger | 3/0/0 | 3/0/0 | 37.55 → 43.40 | 40.02% / 35.63% → 44.73% / 42.97% | 1,540.39 → 1,473.28 | 39/8/12 → 37/8/8 |
| 03 / Conduit | 3/0/0 | 3/0/0 | 110.95 → 127.55 | 61.13% / 55.18% → 61.13% / 49.68% | 1,060.72 → 1,184.78 | 11/9/7 → 8/13/11 |
| 03 / Spirit | 3/0/0 | 3/0/0 | 37.70 → 56.15 | 38.53% / 33.71% → 43.17% / 35.75% | 1,473.48 → 1,256.44 | 41/7/8 → 25/11/9 |
| 05 / Striker (Maestro) | 3/0/0 | 3/0/0 | 31.40 → 36.70 | 59.17% / 57.37% → 50.43% / 43.41% | 1,972.11 → 2,333.28 | 42/3/0 → 42/3/0 |
| 05 / Squire (Reverb) | 3/0/0 | 3/0/0 | 114.60 → 112.50 | 65.59% / 60.75% → 75.30% / 64.70% | 2,014.67 → 1,591.11 | 13/3/0 → 11/3/0 |
| 05 / Apprentice | 3/0/0 | 3/0/0 | 20.35 → 22.80 | 43.60% / 42.91% → 48.81% / 27.67% | 1,629.51 → 1,770.07 | 68/3/6 → 63/6/7 |
| 05 / Slinger | 3/0/0 | 3/0/0 | 44.80 → 52.50 | 37.79% / 33.13% → 40.04% / 33.13% | 1,396.89 → 1,333.06 | 31/8/10 → 24/16/18 |
| 05 / Conduit | 3/0/0 | 3/0/0 | 205.72 → 240.95 | 53.58% / 44.27% → 56.24% / 44.27% | 1,549.50 → 1,506.83 | 5/9/7 → 4/12/10 |
| 05 / Spirit | 3/0/0 | 3/0/0 | 60.10 → 61.30 | 43.22% / 35.86% → 35.86% / 35.34% | 1,270.38 → 1,390.43 | 23/9/10 → 24/11/10 |

The candidate’s lower overall kill count is expected from a larger Stalker body and should be read as pacing/throughput, not as pooled class DPS. Incoming pressure is mixed by root: it falls in 03 Squire, 03 Slinger, 03 Spirit, 05 Squire, 05 Slinger and 05 Conduit, but rises in 03 Apprentice, 03 Conduit, 05 Apprentice, 05 Striker and 05 Spirit. No terminal result establishes an attrition winner.

## Body timing audit

The body estimator uses eligible per-seed clean medians, then the median of those seed medians. A paired count below two is inconclusive and is not used as a species disposition. Unfinished/censored targets and observed HP-regain targets remain excluded from the clean-body estimator; their counts remain in the raw tables.

| Node / root | Hadal Stalker control → candidate | Abyssal Serpent control → candidate | Elder Leviathan control → candidate |
| --- | ---: | ---: | ---: |
| 03 / Striker (Maestro) | 23.30 → 29.05s (n=3) | 25.45 → 25.15s (n=3) | 40.20 → 40.10s (n=3) |
| 03 / Squire (Reverb) | 69.60 → 85.15s (n=3) | 81.40 → 75.65s (n=2) | 127.60 → 124.53s (n=2) |
| 03 / Apprentice | 18.80 → 21.50s (n=3) | 19.65 → 17.75s (n=3) | 22.20 → 22.65s (n=3) |
| 03 / Slinger | 35.00 → 43.45s (n=3) | 37.70 → 37.50s (n=3) | 49.35 → 49.30s (n=3) |
| 03 / Conduit | 100.15 → 128.10s (n=3) | 111.35 → 112.35s (n=2) | 253.90 → 253.90s (n=1; inconclusive) |
| 03 / Spirit | 36.80 → 56.10s (n=3) | 40.40 → 52.10s (n=3) | 56.60 → 73.70s (n=3) |
| 05 / Striker (Maestro) | 29.30 → 36.70s (n=3) | 31.50 → 31.40s (n=3) | 53.10 → 49.90s (n=3) |
| 05 / Squire (Reverb) | 115.58 → 111.98s (n=2) | 97.50 → 97.80s (n=1; inconclusive) | 179.00 → 179.00s (n=3) |
| 05 / Apprentice | 19.20 → 22.80s (n=3) | 19.95 → 20.00s (n=3) | 23.00 → 25.60s (n=3) |
| 05 / Slinger | 42.70 → 52.75s (n=3) | 46.65 → 47.10s (n=3) | 58.95 → 62.30s (n=2) |
| 05 / Conduit | 195.43 → 249.48s (n=2) | 211.00 → 213.40s (n=1; inconclusive) | no eligible pair (n=0; inconclusive) |
| 05 / Spirit | 54.55 → 60.50s (n=3) | 54.20 → 55.50s (n=1; inconclusive) | 104.15 → 83.10s (n=2) |

The Stalker increase is visible in the body medians without being linear across class or node. Fast 03 Slinger and 03 Spirit rows move into or near the target band, while 03/05 Conduit and both Squire rows remain long. The unchanged Serpent and Leviathan medians are context, not a claim that every body reached 40–60 seconds. The one-seed and zero-seed rows are explicitly retained as inconclusive.

## Terminal deaths and 10/30-second windows

| Block / arm | Player deaths | Terminal 10-second incoming window | Terminal 30-second incoming window | Causal interpretation |
| --- | ---: | --- | --- | --- |
| Trench / control | 0 | N/A | N/A | No terminal event; no killing-blow attribution |
| Trench / candidate | 0 | N/A | N/A | No terminal event; no killing-blow attribution |

There were no player-death observations, so there is no terminal 10-second or 30-second damage window to report. Monster target kills, target HP regains and incomplete target records are not player-death causes. The raw maximum single hit was 185 in both arms; candidate max damage in a one-second sampled interval reached 382.7 in one row, but no player terminal event followed it.

## Jungle Durability23 comparison

The D30 Jungle rows are the unchanged Durability23 setups: node03 Apprentice/Slinger and node05 Apprentice/Spirit. Each D30 row was matched to the same cell and seed under the Durability23 results root. WE means window-ended; WC means wall-ceiling. Values are D23 → D30. Quiet is the maximum quiet duration. HP is minimum sampled player HP. P/3+/B/L/R means peak pursuers / sampled seconds with at least three pursuers / blocked samples / late joiners / recovery interruptions. The P/3+/B/L/R evidence was identical in every matched row.

| Cell / seed | Outcome and simulated progress | Max tick ms | Quiet s | Min HP | P/3+/B/L/R |
| --- | --- | ---: | ---: | ---: | --- |
| 03 Apprentice / 44017 | WE 120.0s → WE 120.0s | 989 → 959 | 7.8 → 7.8 | 92.52% → 92.52% | 2/0/0/14/0 |
| 03 Apprentice / 46021 | WC 83.8s → WC 84.1s | 840 → 806 | 19.3 → 19.6 | 96.44% → 96.44% | 1/0/0/0/0 |
| 03 Apprentice / 48017 | WC 112.6s → WC 113.2s (long-quiet) | 623 → 558 | 31.5 → 32.1 | 94.14% → 94.14% | 2/0/0/2/0 |
| 03 Slinger / 44017 | WC 103.0s → WC 103.4s | 825 → 831 | 19.6 → 20.0 | 90.15% → 90.15% | 2/0/0/1/0 |
| 03 Slinger / 46021 | WE 120.0s → WE 120.0s | 11 → 10 | 3.2 → 3.2 | 90.68% → 90.68% | 1/0/0/0/0 |
| 03 Slinger / 48017 | WC 78.0s → WC 78.6s | 848 → 698 | 23.0 → 23.6 | 88.02% → 88.02% | 3/2/0/9/0 |
| 05 Apprentice / 44017 | WC 46.6s → WC 46.1s (long-quiet) | 628 → 519 | 32.8 → 32.3 | 100.00% → 100.00% | 2/0/0/1/0 |
| 05 Apprentice / 46021 | WE 120.0s → WE 120.0s | 10 → 10 | 7.1 → 7.1 | 97.83% → 97.83% | 2/0/0/4/0 |
| 05 Apprentice / 48017 | WE 120.0s → WE 120.0s | 2 → 4 | 4.7 → 4.7 | 97.55% → 97.55% | 1/0/0/0/0 |
| 05 Spirit / 44017 | WE 120.0s → WE 120.0s | 40 → 41 | 4.6 → 4.6 | 100.00% → 100.00% | 2/0/0/1/12 |
| 05 Spirit / 46021 | WC 85.5s → WC 85.3s | 1,318 → 1,292 | 11.3 → 11.1 | 100.00% → 100.00% | 1/0/0/0/6 |
| 05 Spirit / 48017 | WE 120.0s → WE 120.0s | 7 → 6 | 2.8 → 2.8 | 100.00% → 100.00% | 2/0/0/0/11 |

The generated Jungle cell summaries were 03 Apprentice 46 kills / 0 target-censored, 03 Slinger 52 / 1, 05 Apprentice 51 / 0, and 05 Spirit 72 / 2; the D30 block had six WE and six WC run outcomes and zero player deaths. D30 analysis medians were 3.25s, 2.85s, 2.20s and 2.30s respectively. The paired gameplay fields remained unchanged; small wall-time and max-tick differences are profiling/runtime variance, not a movement repair or balance result.

## Jungle CPU profile audit

The required profile exists at C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability30-20260917/results/jungle.cpuprofile. It contains 16,845 nodes, 522,779 samples and 522,779 timeDeltas. The summed sampled profile time is 789,333ms. This is a whole-process profile of the profiled Jungle block, not a per-observation profile.

| Bounded category | Sampled time | Share | Interpretation |
| --- | ---: | ---: | --- |
| Simulation movement / targeting | 738,163ms | 93.52% | Dominant category; includes pathfinding, collision and target-reachability work |
| Garbage collection | 46,072ms | 5.84% | Material runtime overhead; not itself a gameplay defect |
| Module loading / runtime setup | 3,178ms | 0.40% | Startup and loader work |
| Reporting / artifact I/O | 1,343ms | 0.17% | JSONL/reporting and artifact writes |
| Other | 576ms | 0.07% | Residual frames |

Top aggregated leaf self-time was:

| Frozen function | Source | Self sampled time | Share |
| --- | --- | ---: | ---: |
| isPaddedSegmentClear | shared/src/collision/pathfind.ts | 229,866ms | 29.12% |
| findPathOnGrid | shared/src/collision/pathfind.ts | 137,221ms | 17.38% |
| moverOverlapsBlockShapes | shared/src/systems/spatial.ts | 113,324ms | 14.36% |
| clampSegmentBeforeShapes | shared/src/systems/spatial.ts | 76,382ms | 9.68% |
| resolveMoveAgainstBlocks | shared/src/systems/spatial.ts | 62,829ms | 7.96% |
| garbage collector | runtime | 46,072ms | 5.84% |
| segmentEntryT | shared/src/systems/spatial.ts | 36,513ms | 4.63% |
| get | shared/src/systems/spatial.ts | 31,634ms | 4.01% |
| findPathForMover | shared/src/collision/pathfind.ts | 15,771ms | 2.00% |

Relevant caller paths include updateAutoTargets in server/src/systems/combat/ai/autoTarget.ts, selectAutoCombatAction / pickPathReachableTarget / monsterHasPath in server/src/systems/combat/ai/targetPriority.ts, and World.tick. The largest observed paths repeatedly pass through findPathForMover → findPathOnGrid → isPaddedSegmentClear, with spatial resolution helpers on adjacent paths. In the frozen source, isPaddedSegmentClear first resolves overlap and then samples a segment at 8px intervals while checking block shapes; this makes repeated call count and sampled segment work the right next diagnostic surface.

The profile has no reliable markers for the 12 observation boundaries. Heavy intervals therefore cannot be assigned to a particular seed, cell, cutoff or quiet episode without inventing a mapping. The Jungle replay does not prove that pathfinding alone caused the six cutoffs, nor that any one top frame is a proven defect. The single targeted next diagnostic is observation-scoped counters/timers around updateAutoTargets, findPathForMover, isPaddedSegmentClear and moverOverlapsBlockShapes, recording replan count, collision-sample count, path result and elapsed time. That diagnostic should be run on a fresh bounded current-source replay; it is not an operator fix and was not run here.

## Decision and remaining scope

| Question | Disposition | Evidence-based conclusion |
| --- | --- | --- |
| Hadal Stalker 21,000 HP | **Reject as a universal scalar; retain as a targeted pacing lead** | The +25% package raises 11/12 reportable Stalker body medians, but class/node timing remains from 21.50s to 249.48s and no player death occurred in either arm. It moves some fast roots toward the band while worsening already-slow roots. Do not ship or broaden it from this screen. |
| Elder Leviathan / Abyssal Serpent context | **Retain as fixed context** | Leviathan 17,640 and Serpent 16,800 remained unchanged; paired body timing and source-level Carapace absolute shell preservation passed. No context species was re-tuned. |
| Player attrition | **Inconclusive, not a win** | Both Trench arms had 0/36 player deaths and 36/36 complete windows. Min-HP and incoming-rate differences are mixed; no terminal 10/30-second causal windows exist. |
| Jungle CPU replay | **Diagnostic follow-up only** | D30 preserved the Durability23 gameplay/cutoff pattern. The profile points to movement/targeting pathfind and spatial work, with GC as a secondary category; it cannot map whole-process samples to individual observations. |

Remaining campaign work is current-source consolidation and regression: reconcile retained mob packages, add the bounded Jungle instrumentation if still needed, decide the narrow T2 Mountain exception, and keep boss/progression and x1 economy gates separate. These synthetic observations do not certify live balance, rewards, travel, or all T4 branches.

## Artifact index

| Artifact | Path |
| --- | --- |
| Operator packet | C:/Users/osaif/Documents/Claude/Projects/MMO idle/docs/briefs/bot-balance-durability30-operator-packet.md |
| Batch manifest | C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability30-20260917/results/batch-manifest.json |
| Batch end marker | C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability30-20260917/results/batch-ended.json |
| Operator exit | C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability30-20260917/operator-exit.json |
| Trench index / analysis / audit | C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability30-20260917/results/trench/index.json; analysis.md; night5-audit.json |
| Trench verification / completion | C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability30-20260917/results/trench/verification.json; complete.json |
| Jungle index / analysis / audit | C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability30-20260917/results/jungle/index.json; analysis.md; night5-audit.json |
| Jungle verification / completion | C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability30-20260917/results/jungle/verification.json; complete.json |
| Jungle CPU profile | C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability30-20260917/results/jungle.cpuprofile |
| Durability23 Jungle comparator | C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability23-20260917/results/jungle |
| READY receipts | C:/Users/osaif/AppData/Local/mmo-idle/validation/durability30 |
| Frozen detached source | C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability30-20260917/source |

## Planner review

Durability30 closes the sealed Trench Stalker probe and preserves the Jungle cutoff pattern with a bounded CPU lead. The Stalker candidate is not a universal adoption scalar: it is useful only as evidence that body pacing is highly class-sensitive, while attrition remains untested because the full Trench screen survived. The next action is consolidation and current-source regression, with observation-scoped pathfinding instrumentation if the Jungle issue remains actionable; no further automatic Durability30 grid is authorized.
