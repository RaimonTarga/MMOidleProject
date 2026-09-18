# Durability23 — remaining T4 swarm roles and Graveyard counterplay

Date: 2026-09-17  
Status: complete; sealed synthetic screen and read-only audit completed; no production balance edit authorized  
Decision scope: Volcano anchor durability, Graveyard target-priority counterplay, and bounded Jungle runtime evidence

## Executive result

Durability23 executed the packet-defined three-block matrix once and sequentially on the frozen checkout. The runner exited 0, all 192 observations were retained, every block verifier passed, geometry parity was checked with explicit control/candidate pairing, and no retry, relaunch, adaptive build, source edit, balance edit, cap extension, or service was introduced.

- Matrix: 64 cells / 192 observations — Volcano 24 / 72, Graveyard 28 / 84, Jungle 12 / 36.
- Outcomes: 165 window-ended, 21 player deaths, and 6 Jungle wall-ceiling outcomes. Volcano had one candidate death; Graveyard had 20 deaths (17 Focus Elites candidates and 3 controls); Jungle had no player deaths but is cutoff-limited.
- Volcano: doubling only Obsidian Tortoise 2244 → 4488 and Magma Salamander 2904 → 5808 moved the eligible representative body medians from 5.10s to 9.88s and 7.75s to 13.90s. Heat and Burn remained active in every run, 71/72 observations ended normally, and the one death was a narrow Ash Burn/pack-pressure case. Retain both local HP overlays as provisional planner candidates; do not add a blanket Burn or attack change.
- Graveyard: Focus Elites was observable as target-selection counterplay. In sampled ordinary-plus-elite opportunities, the candidate arm emitted Focus Elites as the active target-priority source in 86% of t4a opportunities and 95% of t4b opportunities, versus 0% in controls. Candidate samples selected a Gravewright under the Focus source in 62% of t4a and 80% of t4b opportunities, versus 11–12% in controls. The tool addresses acquisition priority, but not the health cost or long Blunderbuss tails; retain it as a bot-template option without changing Gravewright, Hound, or class balance.
- Jungle: all expected species streams were present, but 6/36 short observations hit the fixed 120-second wall ceiling and 2/36 exceeded the 30-second quiet rule. The precise bad locations are Jungle03 Apprentice/Slinger and Jungle05 Apprentice/Spirit. Keep Jungle as a bounded performance investigation, with no HP conclusion.
- Planner decision: carry forward all 14 Durability22 HP candidates for one consolidated T1–T4 mob-patch review, add the two Volcano anchor candidates as local candidates, and keep Graveyard pressure and Jungle runtime as guardrails. No class-global winner or production adoption follows.

## Planner decision carried from Durability22

Durability22 retained all 14 tested HP candidates for consolidated adoption review, including the Trench, Mountain, Tundra, and Desert packages. Its eligible headline medians were Trench 57.75s / 48.7s / 34.95s for Leviathan / Serpent / Stalker, Mountain 13.4s / 16.0s for Mammoth / Rhino, Tundra 17.1s for Behemoth, and Desert 18.45s for Dune Tyrant. Those are planner inputs, not live changes.

Durability23 was scoped to finish remaining T4 role evidence rather than reopen those completed species. It tested only the two Volcano local HP overlays, the Graveyard In Combat → Focus Elites rune, and a baseline Jungle boundary screen. The Durability22 candidates remain pending adoption; they were not re-tested here.

## Frozen identity and execution

| Item | Value |
| --- | --- |
| Operator packet | [bot-balance-durability23-operator-packet.md](bot-balance-durability23-operator-packet.md) |
| Frozen revision | b12bb917f5a3d7c195c018b645a30d1c8872b325 |
| Frozen branch retained | codex/durability23-frozen |
| Frozen source tree | dca62ff5baebd6a3edfe6d6e224320f2676ad9b7 |
| Definitions SHA-256 | a30458ee24ad7054c5389b1ed16d47f3435456c18feb34f72ded75c84b0828c0 |
| Hitboxes SHA-256 | 08bcc55633efe444d303c71977f7dcf87402157753af543e975e6c0c493afa83 |
| Hitbox source | C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json |
| Detached checkout | C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability23-20260917/source |
| Results root | C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability23-20260917/results |
| Corrected preparation receipts | C:/Users/osaif/AppData/Local/mmo-idle/validation/durability23-r1 |
| Initial rejected preparation receipts | C:/Users/osaif/AppData/Local/mmo-idle/validation/durability23 |
| Trial / mode | durability23 / run |
| Seeds | 44017, 46021, 48017 |
| Matrix | 64 cells / 192 observations / 3 blocks |
| Timestep / maximum | 100ms / Volcano 300s; Graveyard 900s; Jungle 120s; first death |
| Synthetic / economy eligible | true / false |
| Queue start | 2026-09-17T10:48:52.143Z |
| Batch ended marker | 2026-09-17T11:19:24.747Z |
| Operator exit marker | 2026-09-17T11:19:24.7796932Z |
| Queue wall time | 1,832,604ms / 30m 32.6s |
| Runner exit | 0; one sequential run; no retry or relaunch |

The root was absent before launch. The frozen revision, tree, definitions hash, and hitbox hash were verified before the detached checkout was created. Offline dependencies completed successfully. The initial preparation receipts retain the rejected Always / Focus Elites pairing; the corrected In Combat / Focus Elites preparation passed in durability23-r1. Preparation was not rerun overnight.

The exact packet launcher completed all three blocks:

| Block | Operator ledger interval | Ledger wall |
| --- | --- | ---: |
| Volcano | 2026-09-17T10:48:52.146Z–2026-09-17T10:55:15.671Z | 383.5s |
| Graveyard | 2026-09-17T10:55:17.671Z–2026-09-17T11:05:40.357Z | 622.7s |
| Jungle | 2026-09-17T11:05:44.239Z–2026-09-17T11:19:24.292Z | 820.1s |

No full repository suite or live/browser playtest was run for this packet.

## Completion and retained evidence

WE/PD/WC means window-ended / player-died / wall-ceiling observation outcomes. K/U/R means killed / unfinished target records / observed HP-regain target records; R can overlap K or U. P/3+/LJ/LQ/B means maximum player pursuers / sampled seconds with at least three pursuers / late joiners / long-quiet runs / blocked-approach samples.

| Block | Cells / runs | WE/PD/WC | Verified | Complete windows | K/U/R | All monster casts started/fired | Min HP median / low | Recovery interruptions | P/3+/LJ/LQ/B | Simulated seconds / row-wall seconds |
| --- | ---: | ---: | --- | ---: | ---: | ---: | ---: | ---: | --- | ---: |
| Volcano | 24 / 72 | 71/1/0 | true | 71 | 4736/178/371 | 371/319 | 82.0% / 0% | 721 | 9/4762/4379/0/0 | 21,339.8 / 373.9 |
| Graveyard | 28 / 84 | 64/20/0 | true | 64 | 9738/344/428 | 2960/2724 | 53.0% / 0% | 203 | 12/17822/9474/1/0 | 65,083.8 / 611.4 |
| Jungle | 12 / 36 | 30/0/6 | true | 30 | 785/19/0 | 32/12 | 97.0% / 88.0% | 90 | 3/2/56/2/0 | 4,109.5 / 815.0 |
| Total | 64 / 192 | 165/21/6 | true for all blocks | 165 | 15259/541/799 | block totals above | block rows above | 1014 | block rows above | 90,533.1 / 1,800.3 |

Volcano, Graveyard, and Jungle each wrote manifest, index, analysis, night5-audit, verification, complete, summary, samples, and event artifacts. The six Jungle wall ceilings are the fixed per-observation wall cap, not runner failures. The single Graveyard long-quiet survivor and the six Jungle wall-ceiling rows remain excluded from any safety conclusion.

## Measurement rules and evidence boundary

The primary estimator is the corresponding night5-audit.json row: one clean body-TTK median per seed from eligible targets, followed by the outer median of eligible seed medians. Clean excludes unfinished targets and targets with observed HP regain. Eligibility excludes wall-ceiling runs and long-quiet runs. Fewer than two eligible seeds is inconclusive and is excluded from representative headline medians.

TTK begins at the first damaging hit on the target and ends at the kill. The Gravewright first-hit values below are a separate event-identity onset proxy, not a replacement for the audit estimator. The selector audit uses one-second samples: an opportunity exists when a live Gravewright and at least one live ordinary target are present; Focus-source means autoIntent.source is Focus Elites; selected target is read from selectedTargetId. This is a sampled proxy, not an exact per-tick target-history reconstruction. Focus Elites is an engaged-set preference and does not prove cross-node acquisition.

A dash or missing eligible seed is missing evidence, not a zero-second kill. Target U/R counts are not player deaths. Quiet survival is not safety. More incoming damage in a longer successful arm is exposure, not regression by itself. No survival, economy, farming, acquisition, respawn-cost, or live/browser claim follows from this synthetic run.

## READY setup and paired geometry

All 192 READY views were read from the retained raw artifacts. The six class roots, four skill IDs, biome gear, upgrades, techniques, guards, stance, and root-specific movement/recovery rules matched the frozen packet. Every candidate Graveyard READY view added only the legal In Combat → Focus Elites rune; controls and all Volcano/Jungle views did not equip it. Techniques were Frenzy and Sweep, guards were Second Wind and Cleanse, and stance was Offensive.

| Root / class | Frozen skill path | Weapon |
| --- | --- | --- |
| cadence-root / Striker | cadence-root → cadence-balanced → cadence-range-close → cadence-balanced-t3-a | volcanic-eruption-lash |
| cooldown-root / Squire | cooldown-root → cooldown-balanced → cooldown-range-close → cooldown-balanced-t3-a | mountain-warmaul |
| dot-root / Apprentice | dot-root → dot-balanced → dot-range-mid → dot-balanced-t3-a | graveyard-plague-axe |
| reload-root / Slinger | reload-root → reload-balanced → reload-range-mid → reload-balanced-t3-a | jungle-deathfang-rapier |
| summoner-root / Conduit | summoner-root → summoner-balanced → summoner-range-mid → summoner-balanced-t3-a | jungle-deathfang-rapier |
| energy-root / Spirit | energy-root → energy-balanced → energy-range-mid → energy-balanced-t3-a | volcanic-eruption-lash |

Within each biome, the six roots used that biome’s T4 armor and charm, Mountain boots, Tempered Core, and Colossus Heart. Gear upgrades were +5 on weapon/armor/charm/boots and 0 on Core/Heart. Candidate and control initial combat stats other than the Volcano HP overlay matched; the Graveyard rune arm did not alter gear, skills, techniques, guards, stance, or mob stats.

The corrected explicit pair audit found no geometry mismatch:

| Block | Control/candidate READY comparisons | Same geometryRosterHash | Same initial roster hash | Same initial combat stats | Intended treatment |
| --- | ---: | ---: | ---: | ---: | --- |
| Volcano | 36 | 36/36 | 0/36 | 36/36 | Candidate HP overlay only |
| Graveyard | 42 | 42/42 | 42/42 | 42/42 | Candidate Focus Elites rune only |
| Jungle | baseline-only | not paired | not paired | not paired | No treatment |
| Total paired checks | 78 | 78/78 | 42/78 | 78/78 | Passed |

The Volcano initial roster hash differs as expected because the candidate READY roster contains the HP overlay; its geometryRosterHash and initial attack/plating/DR stats remain equal. Graveyard control/candidate initial roster hashes and initial combat stats are equal.

### Actual Volcano HP changes

Only these two process-local HP changes were applied in the candidate arm. No shield, attack, plating, damage-reduction, ability, Burn/Heat, pack, or follower HP change was applied.

| Species | Control base HP | Candidate base HP | Change |
| --- | ---: | ---: | ---: |
| Obsidian Tortoise | 2244 | 4488 | +2244 |
| Magma Salamander | 2904 | 5808 | +2904 |

## Volcano — local anchor durability

The packet’s species estimator gives the following representative outer medians. Cells with fewer than two eligible seeds are excluded from these headline values.

| Anchor | Control median | Candidate median | Delta | Eligible control cells | Eligible candidate cells |
| --- | ---: | ---: | ---: | ---: | ---: |
| Obsidian Tortoise | 5.10s | 9.88s | +4.78s | 11/12 | 11/12 |
| Magma Salamander | 7.75s | 13.90s | +6.15s | 12/12 | 11/12 |

The two overlays made the slow anchors materially longer without making the entire block wall-limited. The 72 observations produced 71 normal windows and one death, with zero wall ceilings and zero long-quiet exclusions. Candidate anchor body timing is therefore usable as a provisional local durability input, while the class spread and one mixed-pack death still prevent a universal encounter claim.

### Volcano pack and target exposure

The class-level rows below are descriptive pack medians from the block analysis, with target K/U/R and recovery interruptions retained. They are not class-global rankings.

| Node / root | Control median / K-U-R / PD | Candidate median / K-U-R / PD | Recovery interruptions C/Q |
| --- | --- | --- | ---: |
| 03 / Striker | 1.00s / 362-2-0 / 0 | 1.05s / 318-2-0 / 0 | 132 / 118 |
| 03 / Squire | 2.80s / 219-2-0 / 0 | 2.30s / 167-2-0 / 0 | 57 / 26 |
| 03 / Apprentice | 2.00s / 217-8-15 / 0 | 1.80s / 191-5-15 / 0 | 1 / 1 |
| 03 / Slinger | 1.50s / 253-13-31 / 0 | 1.40s / 205-14-32 / 0 | 0 / 0 |
| 03 / Conduit | 5.50s / 111-15-32 / 0 | 5.00s / 97-12-30 / 0 | 2 / 1 |
| 03 / Spirit | 1.60s / 240-5-16 / 0 | 1.20s / 249-6-17 / 0 | 18 / 2 |
| 05 / Striker | 1.40s / 324-5-0 / 0 | 1.50s / 266-3-0 / 0 | 128 / 111 |
| 05 / Squire | 5.30s / 160-3-0 / 0 | 5.30s / 119-4-0 / 0 | 57 / 36 |
| 05 / Apprentice | 2.20s / 192-4-15 / 0 | 2.20s / 179-7-16 / 0 | 4 / 9 |
| 05 / Slinger | 2.20s / 212-8-37 / 0 | 1.20s / 172-17-38 / 0 | 3 / 1 |
| 05 / Conduit | 6.00s / 85-18-30 / 0 | 4.40s / 60-6-13 / 1 | 0 / 2 |
| 05 / Spirit | 2.20s / 183-8-21 / 0 | 2.45s / 155-9-13 / 0 | 10 / 2 |

Per-type event exposure also increased on the anchors: at node03, Tortoise cast starts/fires were 6/1 control versus 14/11 candidate and Magma 4/0 versus 26/15; at node05, Tortoise was 11/10 versus 19/19 and Magma 8/3 versus 20/19. These are pooled event counters from the per-type analysis, not the primary TTK estimator.

### Heat, Burn, and pressure

Heat was recorded in all 36 control and all 36 candidate runs; every run reached a maximum of 6 Heat stacks. Burn was recorded in all 72 runs; per-run maximum Burn stacks ranged from 2 to 5, with mean maximum stacks 4.1 control and 4.3 candidate.

| Exposure | Control | Candidate |
| --- | ---: | ---: |
| Heat gain/update events | 631 | 546 |
| Burn gain/update events | 3058 | 2805 |
| Incoming DoT HP damage | 157119.6 | 156963.4 |
| Ashspitter Salamander DoT HP | 79091.1 | 87002.5 |
| Ember Skink DoT HP | 78028.5 | 69960.9 |
| Player deaths | 0 | 1 |

The candidate anchor overlay did not materially reduce or increase total recorded Volcano DoT damage. The event stream shows the mechanics remained active while anchor duration increased, and the overall swarm remained bounded by normal completion in 71/72 observations. This supports retaining the local HP candidates for consolidated review, not a blanket Burn reduction or attack compensation.

### Exact Volcano death review

The only Volcano death was dur23-t4a-volcanic-05-conduit-candidate / seed 48017.

- Death time: 39.8s simulated, after 2 event-recorded kills (both Ember Skinks).
- Cause: Ashspitter Salamander Ash Burn, DoT, 88 damage at 5 stacks.
- At 39.4s the Ash Burn stack reached 5; death followed 0.4s later.
- The 10s pre-death window recorded 1427 HP damage: Ember Skink 556, Ashspitter Salamander 535, Magma Salamander 336; 396 direct and 1031 DoT.
- The 30s pre-death window recorded 1916 HP damage: Ember Skink 685, Ashspitter Salamander 671, Magma Salamander 560; 650 direct and 1266 DoT.
- Peak player pursuers were 5, with 15 sampled seconds at three or more pursuers, 7 late joiners, 0 blocked samples, 0.4s maximum outgoing quiet, and 0 recovery interruptions. The final combat episode lasted 38.9s.
- The 30s window also recorded Heat reaching 6 at 15.9s and repeated Obsidian Shell casts. No kill event occurred in either final damage window.

This is a mixed pack and terminal-stack exposure case, not a repeated species-specific attack defect. Retain the local anchor HP overlays and keep Burn/Heat mechanics unchanged pending any separately authorized role-level review.

## Graveyard — target-priority counterplay

The Graveyard arm changed only the additional In Combat → Focus Elites rune. All six Night5A roots ran at both nodes, and the t4b Slinger/Blunderbuss rows were run at both nodes as a separate authored short-range specialization. Its range node remained medium by the frozen packet; that is not a setup error.

The raw summary target stream registered five original species types:

| Original target type | Damaged records | Killed | Unfinished | Regain |
| --- | ---: | ---: | ---: | ---: |
| Bone Rat | 2187 | 2147 | 40 | 56 |
| Bone Crawler | 4683 | 4533 | 150 | 175 |
| Plague Hound | 1211 | 1149 | 62 | 49 |
| Carrion Vulture | 995 | 952 | 43 | 39 |
| Gravewright | 1006 | 957 | 49 | 109 |

Risen mobs are not separate rows in the summary target registry because the registry is established from the original node roster. Their identities are present in the event stream and are counted separately below.

### Sampled ordinary-plus-elite selection opportunities

Every control and candidate cell had at least one sampled ordinary-plus-Gravewright opportunity. Candidate opportunity counts are lower than controls because the candidate often removed the elite or ordinary target from the live set earlier; this is itself exposure, not missing setup.

| Block / node | Control opportunities | Control Gravewright selected | Candidate opportunities | Focus-source samples | Focus-source + Gravewright selected |
| --- | ---: | ---: | ---: | ---: | ---: |
| t4a / 03 | 16200 | 1709 / 10.6% | 11373 | 9809 / 86.3% | 7104 / 62.5% |
| t4a / 05 | 16200 | 1981 / 12.2% | 11119 | 9577 / 86.1% | 6824 / 61.4% |
| t4b / 03 | 2554 | 272 / 10.7% | 2479 | 2332 / 94.1% | 1924 / 77.6% |
| t4b / 05 | 1435 | 154 / 10.7% | 1616 | 1552 / 96.0% | 1331 / 82.4% |

The selector evidence supports Focus Elites as a real ordinary-player/bot-template counterplay for target acquisition. It does not prove perfect focus on every sample: the candidate also selected ordinary targets while the opportunity remained, and the rule is intentionally scoped to the engaged set. No cross-node target acquisition was observed or inferred.

### Gravewright first-hit onset and primary kill timing

First-hit onset is the median simulated time at which a player damage event first targeted a Gravewright identity in that cell arm. Primary Gravewright TTK is the outer median from night5-audit.json. G K/U/R is the audit target count for Gravewright.

| Block / node / root | First hit C/Q | Primary TTK C/Q | Gravewright K/U/R C | Gravewright K/U/R Q |
| --- | ---: | ---: | ---: | ---: |
| t4a / 03 / Striker | 445.15s / 342.10s | 4.25s / 6.30s | 68/0/0 | 80/1/0 |
| t4a / 03 / Squire | 454.40s / 368.50s | 12.20s / 18.80s | 28/1/0 | 54/1/0 |
| t4a / 03 / Apprentice | 492.90s / 410.50s | 4.20s / 13.20s | 39/2/8 | 48/0/0 |
| t4a / 03 / Slinger | 470.95s / 368.20s | 5.70s / 14.90s | 45/4/26 | 41/0/0 |
| t4a / 03 / Conduit | 548.25s / 495.10s | 12.22s / 9.30s | 8/8/11 | 27/1/1 |
| t4a / 03 / Spirit | 541.60s / 121.50s | 9.00s / 7.03s | 20/7/12 | 9/0/0 |
| t4a / 05 / Striker | 428.75s / 396.60s | 5.30s / 6.40s | 52/0/0 | 70/1/0 |
| t4a / 05 / Squire | 490.90s / 346.30s | 18.25s / 27.20s | 29/0/0 | 39/1/0 |
| t4a / 05 / Apprentice | 478.60s / 384.10s | 3.75s / 15.40s | 41/2/9 | 49/0/0 |
| t4a / 05 / Slinger | 411.90s / 417.20s | 7.25s / 16.20s | 31/4/18 | 47/0/0 |
| t4a / 05 / Conduit | 240.60s / 69.05s | 7.40s / 13.55s | 15/4/9 | 10/1/0 |
| t4a / 05 / Spirit | 349.55s / 95.05s | 12.50s / 13.95s | 14/4/15 (I) | 8/0/0 |
| t4b / 03 / Slinger | 451.80s / 393.30s | 14.50s / 49.30s | 25/2/0 | 30/2/0 |
| t4b / 05 / Slinger | 315.60s / 259.10s | 13.05s / 61.90s | 13/0/0 | 17/3/0 |

I marks an inconclusive Gravewright cell with fewer than two eligible seeds. The candidate often reduced first-hit onset, which is consistent with the selector proxy, but the resulting body timing and health cost varied by specialization. The t4b Slinger/Blunderbuss comparison is the clearest boundary: Focus Elites changed target preference, while Gravewright TTK rose to 49.30s at node03 and 61.90s at node05.

### Graveyard paired specialization outcomes

The table keeps the packet’s per-specialization survival, minimum HP, target throughput, unfinished/regain records, and recovery interruptions. The median / low minimum HP is across the three run minima for that cell arm.

| Block / node / root | Control WE/PD; min HP med/low; K/U/R | Focus WE/PD; min HP med/low; K/U/R | Recovery interruptions C/Q |
| --- | --- | --- | ---: |
| t4a / 03 / Striker | 3/0; 58.8%/56.1%; 630/13/0 | 3/0; 60.2%/57.8%; 605/11/0 | 2 / 29 |
| t4a / 03 / Squire | 3/0; 76.6%/58.3%; 336/11/0 | 3/0; 74.7%/71.4%; 416/20/0 | 0 / 0 |
| t4a / 03 / Apprentice | 3/0; 77.1%/74.5%; 427/8/31 | 3/0; 26.6%/24.4%; 505/12/0 | 3 / 10 |
| t4a / 03 / Slinger | 3/0; 76.8%/76.4%; 382/7/72 | 2/1; 7.8%/0%; 419/9/0 | 1 / 12 |
| t4a / 03 / Conduit | 3/0; 61.5%/59.1%; 185/22/48 | 0/3; 0%/0%; 253/19/26 | 0 / 0 |
| t4a / 03 / Spirit | 3/0; 9.6%/5.4%; 286/22/58 | 0/3; 0%/0%; 81/9/0 | 6 / 15 |
| t4a / 05 / Striker | 3/0; 50.2%/49.7%; 561/8/0 | 3/0; 54.7%/52.9%; 531/7/0 | 6 / 15 |
| t4a / 05 / Squire | 3/0; 76.3%/75.5%; 299/7/0 | 3/0; 74.7%/71.7%; 316/11/0 | 1 / 1 |
| t4a / 05 / Apprentice | 3/0; 66.4%/62.4%; 397/5/24 | 3/0; 35.7%/30.6%; 503/9/0 | 5 / 5 |
| t4a / 05 / Slinger | 3/0; 81.1%/79.1%; 323/14/61 | 3/0; 41.2%/41.2%; 460/2/1 | 0 / 32 |
| t4a / 05 / Conduit | 3/0; 58.4%/58.2%; 200/17/58 | 0/3; 0%/0%; 99/23/13 | 0 / 1 |
| t4a / 05 / Spirit | 3/0; 55.1%/6.0%; 206/12/36 | 0/3; 0%/0%; 84/8/0 | 10 / 20 |
| t4b / 03 / Slinger | 2/1; 35.2%/0%; 411/17/0 | 2/1; 3.9%/0%; 419/16/0 | 15 / 11 |
| t4b / 05 / Slinger | 1/2; 0%/0%; 186/8/0 | 0/3; 0%/0%; 218/17/0 | 2 / 1 |

C/Q means control / Focus Elites. Focus Elites improved target access but did not guarantee survival: candidate deaths cluster in t4a Conduit and Spirit, plus the t4a Slinger and t4b Blunderbuss rows. The control arm also has one t4b node03 and two t4b node05 Slinger deaths, so the comparison is pressure-sensitive rather than a clean global rune win.

### Raise Dead, Risen mobs, Hound DoT, and recovery

Raise counts below are event identities. Risen kills count explicit kill events whose victim was a Risen entity; they are not an estimate of every spawn or active Risen body.

| Block / node | Raise starts/fired C | Raise starts/fired Q | Risen kill events C/Q | Hound DoT HP C/Q | Deaths C/Q |
| --- | ---: | ---: | ---: | ---: | ---: |
| t4a / 03 | 309/280 | 558/507 | 224 / 455 | 47883.5 / 53725 | 0 / 7 |
| t4a / 05 | 292/277 | 517/480 | 234 / 462 | 57492.75 / 43289 | 0 / 6 |
| t4b / 03 | 184/180 | 208/207 | 337 / 369 | 4608 / 5426 | 1 / 1 |
| t4b / 05 | 85/85 | 115/115 | 157 / 211 | 2762 / 4536 | 2 / 3 |
| Total | 870/822 | 1398/1309 | 952 / 1497 | 112746.25 / 106976 | 3 / 17 |

Hound DoT HP is the sum of event damage with a Hound-named monster source and damageType dot. Hound Plague reached a maximum of 5 stacks. Focus candidates generated more Raise Dead and Risen-kill event exposure in this fixed sequence, while total Hound DoT HP was slightly lower than controls; the candidate death count is therefore not explained by a blanket increase in Hound DoT damage alone.

Death causes across all 20 Graveyard deaths were 11 Hound Plague DoT deaths (8 Plague Hound and 3 Risen Plague Hound), 2 Plague Hound melee deaths, 3 Gravewright ranged deaths, 3 Bone Crawler melee deaths, and 1 Carrion Vulture ranged death. The only long-quiet survivor was t4a Graveyard03 Conduit control / seed 48017, with a 618.7s maximum quiet interval; it is excluded from safety interpretation.

### Does the ordinary player tool address Blunderbuss?

Yes for the specific acquisition problem, not for the entire encounter. The Focus Elites candidate arm consistently exposed the intended elite-priority source and selected Gravewright much more often than controls, including the t4b Slinger/Blunderbuss rows. That supports offering Focus Elites as a bot-template choice.

It did not make the t4b Gravewright encounter safe or short: candidate representative Gravewright TTK was 49.30s at node03 and 61.90s at node05, with 1/1 and 3/2 candidate/control deaths respectively. The result supports a targeting-template decision only. It does not authorize changing Blunderbuss, Gravewright HP, Hound DoT, or Graveyard-wide mob stats.

## Jungle — bounded baseline screen

Jungle made no treatment or mob-stat change. The purpose was a 120-second exposure/runtime screen, not a fifteen-minute safety test.

### Class/node screen

| Node / root | WE/PD/WC | K/U/R | Pack median | Min HP med/low | Recovery interruptions |
| --- | ---: | ---: | ---: | ---: | ---: |
| 03 / Striker | 3/0/0 | 78/2/0 | 1.85s | 94.4%/94.0% | 4 |
| 03 / Squire | 3/0/0 | 38/3/0 | 6.20s | 94.3%/91.3% | 8 |
| 03 / Apprentice | 3/0/0 | 46/0/0 | 3.25s | 94.1%/92.5% | 0 |
| 03 / Slinger | 3/0/0 | 52/1/0 | 2.85s | 90.2%/88.0% | 0 |
| 03 / Conduit | 3/0/0 | 62/0/0 | 3.60s | 93.6%/93.0% | 1 |
| 03 / Spirit | 3/0/0 | 72/2/0 | 2.40s | 100%/100% | 23 |
| 05 / Striker | 3/0/0 | 98/2/0 | 1.20s | 99.6%/99.6% | 12 |
| 05 / Squire | 3/0/0 | 54/2/0 | 4.60s | 99.6%/99.4% | 8 |
| 05 / Apprentice | 3/0/0 | 51/0/0 | 2.20s | 97.8%/97.6% | 0 |
| 05 / Slinger | 3/0/0 | 84/2/0 | 1.90s | 98.7%/98.7% | 0 |
| 05 / Conduit | 3/0/0 | 78/3/0 | 2.15s | 94.6%/94.4% | 5 |
| 05 / Spirit | 3/0/0 | 72/2/0 | 2.30s | 100%/100% | 29 |

### All expected Jungle species

The table uses night5-audit.json species medians. Each entry is median seconds, eligible seed count, and aggregate K/U across the three seeds. I marks an inconclusive row with fewer than two eligible seeds. No expected species placement was absent.

| Node / root | Thornback | Apex | Panther | Constrictor |
| --- | --- | --- | --- | --- |
| 03 / Striker | 1.55s n3 K10/U0 | 1.95s n3 K23/U0 | 1.20s n3 K25/U0 | 2.50s n3 K20/U2 |
| 03 / Squire | 0.00s n3 K7/U0 | 8.05s n3 K14/U1 | 6.00s n3 K7/U1 | 6.40s n3 K10/U1 |
| 03 / Apprentice | 4.00s n1 K8/U0 (I) | 3.00s n1 K12/U0 (I) | 3.60s n1 K18/U0 (I) | 3.00s n1 K8/U0 (I) |
| 03 / Slinger | 1.80s n1 K7/U1 (I) | 4.50s n1 K13/U0 (I) | 2.00s n1 K20/U0 (I) | 3.30s n1 K12/U0 (I) |
| 03 / Conduit | 2.35s n3 K9/U0 | 3.60s n3 K17/U0 | 2.20s n3 K18/U0 | 4.45s n3 K18/U0 |
| 03 / Spirit | 2.40s n3 K11/U0 | 3.05s n3 K20/U0 | 2.00s n3 K24/U0 | 3.30s n3 K17/U2 |
| 05 / Striker | 0.90s n3 K25/U0 | 1.70s n3 K20/U0 | 0.90s n3 K31/U1 | 1.85s n3 K22/U1 |
| 05 / Squire | 2.50s n3 K9/U1 | 6.00s n3 K13/U0 | 4.20s n3 K23/U0 | 2.80s n3 K9/U1 |
| 05 / Apprentice | 2.20s n2 K11/U0 | 2.70s n2 K15/U0 | 2.20s n2 K14/U0 | 2.63s n2 K11/U0 |
| 05 / Slinger | 1.20s n3 K19/U0 | 2.05s n3 K18/U0 | 1.00s n3 K21/U0 | 2.40s n3 K26/U2 |
| 05 / Conduit | 1.50s n3 K19/U1 | 2.00s n3 K12/U1 | 2.00s n3 K20/U0 | 3.20s n3 K27/U1 |
| 05 / Spirit | 1.65s n2 K11/U0 | 2.75s n2 K17/U0 | 1.77s n2 K24/U1 | 3.10s n2 K20/U1 |

The 03 Apprentice and 03 Slinger rows have only one eligible seed per species and are inconclusive. The 05 Apprentice and 05 Spirit rows have two eligible seeds and remain sparse. The 03 Squire Thornback 0.00s values are recorded one-hit windows, not missing data.

### Wall-to-simulation cost and precise bad rows

Across Jungle, 4109.5 simulated seconds required 815.0 seconds of row wall time, a 0.198x wall/simulation ratio in aggregate. The normal row-wall median was 1.307s, but the fixed 120s wall ceiling and max tick stalls dominate the tail. All six wall-ceiling rows are retained below.

| Cell / seed | Outcome | Simulated | Wall | Max tick | Max quiet | Min HP | Peak pursuers | 3+ seconds | Late joiners |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Jungle03 Apprentice / 46021 | wall-ceiling | 83.8s | 120443ms | 840ms | 19.3s | 96.4% | 1 | 0 | 0 |
| Jungle03 Apprentice / 48017 | wall-ceiling + LQ | 112.6s | 120429ms | 623ms | 31.5s | 94.1% | 2 | 0 | 2 |
| Jungle03 Slinger / 44017 | wall-ceiling | 103.0s | 120176ms | 825ms | 19.6s | 90.2% | 2 | 0 | 1 |
| Jungle03 Slinger / 48017 | wall-ceiling | 78.0s | 120312ms | 848ms | 23.0s | 88.0% | 3 | 2 | 9 |
| Jungle05 Apprentice / 44017 | wall-ceiling + LQ | 46.6s | 120078ms | 628ms | 32.8s | 100% | 2 | 0 | 1 |
| Jungle05 Spirit / 46021 | wall-ceiling | 85.5s | 120304ms | 1318ms | 11.3s | 100% | 1 | 0 | 0 |

The precise follow-up is a bounded source/performance investigation of the listed Jungle03 Apprentice/Slinger and Jungle05 Apprentice/Spirit observations. It is not a reason to repeat every class, extend the 120-second cap, or label Jungle balanced from the 30 normal windows.

## Species estimator completeness

| Block | Expected audit species/cell/arm rows | Present | Inconclusive rows | Wall-ceiling runs | Long-quiet runs |
| --- | ---: | ---: | ---: | ---: | ---: |
| Volcano | 120 | 120 | 4 | 0 | 0 |
| Graveyard | 140 | 140 | 2 | 0 | 1 |
| Jungle | 48 | 48 | 8 | 6 | 2 |

All expected species placements were present in each block. Missing or sparse estimator rows remain visible in the raw audit and were not converted to zeroes. The Volcano headline table reports its anchor-specific eligible cell counts directly; three sparse anchor arm cells are excluded from those medians, while the fourth Volcano inconclusive row is a non-anchor Conduit species. The Graveyard Gravewright table marks its one-seed control cell; and the Jungle table marks all eight one-seed species rows as inconclusive.

## Updated finite seven-biome T4 work map

This is a finite T4 work map, not a global balance ranking. Durability22 candidates remain planner-selected pending adoption; Durability23 does not replace that decision.

| T4 biome | Current retained evidence | Finite disposition | Next use |
| --- | --- | --- | --- |
| Desert | Durability22 candidate HP packages; two Spirit control deaths and controller pressure remain contextual | Retain Durability22 candidates; no new Desert edit | Consolidated patch review with controller/source guardrails |
| Graveyard | Durability23 Focus Elites selection is measurable; 20 mixed-source deaths and Hound/Risen pressure remain | Retain Focus Elites as bot-template counterplay; no mob/class/DoT patch | Keep elite-priority counterplay and pack pressure as regression guardrails |
| Jungle | 36 short baseline observations; 6 wall ceilings and 2 long-quiet rows | Performance/cutoff-limited; no HP disposition | Bounded investigation at the six named source locations |
| Mountain | Durability22 candidate packages; node03 candidate pressure and Conduit tails remain watch items | Retain Durability22 candidates; no new edit | Consolidated patch review, then targeted pressure regression |
| Tundra | Durability22 candidate packages with fixed absolute defense products preserved | Retain Durability22 candidates; no new shield/body translation | Consolidated patch review with ward/shield invariants |
| Volcanic | Durability23 doubled Tortoise/Magma anchors; 71/72 normal windows and one narrow Burn/pack death | Retain the two local HP candidates; no blanket Burn/attack edit | Consolidated mob patch review with Heat/Burn regression guard |
| Trench | Durability22 three-species candidates are near the 40–60s design goal at eligible outer medians | Retain Durability22 candidates; do not re-test here | Consolidated patch review with Conduit/long-tail guardrail |

### Smallest remaining obstacle

The smallest remaining obstacle is source-level reconciliation of one consolidated candidate ledger: the 14 Durability22 HP packages plus the two Durability23 Volcano anchor packages, while preserving Durability22 fixed absolute defenses and the Durability23 Graveyard/Jungle guardrails. That reconciliation should be followed by focused current-source regression, representative boss/progression checks, basic 1x pacing, and operational checks.

The next gate is not another blanket six-class matrix. Graveyard has answered the narrow target-acquisition question sufficiently for a template decision, Volcano has a usable local anchor result with one classified pressure exception, and Jungle has named performance locations. Full item/class/ability parity remains later. Invited-player readiness must wait for the focused regression and operational gates; synthetic evidence is not live feel.

## No production adoption

No production source, mob definition, class, item, ability, rune, economy, or player-facing balance value was edited or adopted. The two Volcano HP overlays and the Focus Elites rune result are process-local experiment evidence. The Durability22 14 candidates remain planner-selected pending a consolidated patch decision. No extra run, cap extension, or playtest-readiness claim follows.

The shared worktree was already dirty with unrelated user changes; those changes were preserved. Only this report and its documentation index entry are intended deliverables from the reporting stage.

## Raw artifacts

- [Durability23 operator packet](<C:/Users/osaif/Documents/Claude/Projects/MMO idle/docs/briefs/bot-balance-durability23-operator-packet.md>)
- [batch manifest](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability23-20260917/results/batch-manifest.json>)
- [batch ended marker](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability23-20260917/results/batch-ended.json>)
- [operator exit marker](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability23-20260917/operator-exit.json>)
- [operator ledger](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability23-20260917/results/operator-ledger.jsonl>)
- [results root](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability23-20260917/results>)
- [Volcano index](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability23-20260917/results/volcanic/index.json>); [Volcano audit](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability23-20260917/results/volcanic/night5-audit.json>); [Volcano verification](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability23-20260917/results/volcanic/verification.json>); [Volcano complete marker](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability23-20260917/results/volcanic/complete.json>)
- [Graveyard index](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability23-20260917/results/graveyard/index.json>); [Graveyard audit](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability23-20260917/results/graveyard/night5-audit.json>); [Graveyard verification](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability23-20260917/results/graveyard/verification.json>); [Graveyard complete marker](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability23-20260917/results/graveyard/complete.json>)
- [Jungle index](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability23-20260917/results/jungle/index.json>); [Jungle audit](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability23-20260917/results/jungle/night5-audit.json>); [Jungle verification](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability23-20260917/results/jungle/verification.json>); [Jungle complete marker](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability23-20260917/results/jungle/complete.json>)
- [detached frozen source checkout](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability23-20260917/source>)
- [corrected Durability23 preparation receipts](<C:/Users/osaif/AppData/Local/mmo-idle/validation/durability23-r1>)
- [initial rejected preparation receipts](<C:/Users/osaif/AppData/Local/mmo-idle/validation/durability23>)
- [hitbox input](<C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json>)

The raw result tree contains all manifests, audits, verification logs, complete markers, summaries, event streams, sample streams, and 192 run directories. This report is an interpretation layer; retained raw artifacts remain authoritative, and synthetic evidence is not live gameplay proof.

Report generated from the packet-defined frozen results and read-only raw-event/sample audit. No production source or balance data was edited by the experiment.
