# Durability27 — T2 Mountain pressure scalar and Desert controller HP screen

Date: 2026-09-17  
Status: complete; sealed synthetic screen audited; no production balance edit authorized  
Decision scope: whether the packet-defined Mountain attack scalar improves T2 survivability without trivializing pressure, and whether the Desert controller HP increase centers body and actual encounter pacing near the intended guide

## Executive result

Durability27 executed once and sequentially on the frozen checkout. The runner exited 0. Both blocks verified, all 48 cells and 144 observations were retained, and no retry, relaunch, adaptive build, source edit, balance edit, cap extension, service, commit, or push was introduced.

- Mountain: 24 cells / 72 observations; 18 window-ended, 18 player-died, and 0 wall-ceiling observations in control; 29 window-ended, 6 player-died, and 1 wall-ceiling observation in candidate.
- Desert: 24 cells / 72 observations; 36 window-ended and 0 player-died in control; 30 window-ended, 6 player-died, and 0 wall-ceiling in candidate.
- READY/build contract: 144/144 synthetic views; 72/72 control-candidate geometry pairs matched. Mountain paired roster hashes matched while the declared attack products differed. Desert paired attacks, plating, and damage reduction matched while controller HP changed and roster hashes differed. Actual runtime products, rather than static declarations, are used below.
- Mountain candidate effect: player deaths fell from 18 to 6 and run-level median minimum HP rose from 4.84% to 36.65%. The primary Granite Titan body center did not increase: the full equal-root summary moved from 19.00s to 18.86s, while the strict five-root summary excluding the sparse Apprentice pair moved from 21.50s to 21.63s. This is a pressure/survival result, not a body-TTK result.
- Mountain pressure remained non-trivial. Candidate deaths persisted in four Striker observations and one Squire/one Spirit observation, there was one wall-ceiling observation and five long-quiet rows, and sampled seconds with at least three pursuers rose from 13s to 16s. The candidate terminal events named five Granite Titan and one Stone Eagle; raw source damage and cast exposure are reported without treating a killing blow as causal proof.
- Desert controller timing moved toward the guide for the robust roots. The strict five-root controller center moved from 7.60s to 15.20s for both Sand Scorpion and Stone Basilisk. Including the sparse Striker values, the six-root centers are 8.55s → 15.85s for Sand Scorpion and 8.80s → 16.35s for Stone Basilisk. Those centers remain below the historical Durability25 T3 reference of about 22.10s, but the actual final-two-member encounter median rose from 14.8s to 23.5s and the Stone Basilisk Conduit root reached 27.60s.
- Desert attrition is concentrated rather than universal: all six candidate deaths are Striker deaths, all from Sand Scorpion Numbing Sting, while all 36 control observations survived. Candidate controller encounters also produced 195 observed HP-regain target records and 86 unfinished target records versus 110 and 53 in control.

Disposition: **adjust both local candidates before any production adoption**. Retain the Mountain scalar and Desert HP increase as bounded evidence, not as shippable values. Mountain supports a biome-local pressure reduction direction, but the exact 80% attack products need a bounded follow-up around residual Striker deaths and pull pressure. Desert supports an intermediate controller-durability direction, but 1.75x is an upper-bound screen because actual two-enemy pacing and the Conduit tail are already T3-like or higher. No universal tier change, automatic damage compensation, or current-source adoption follows from this packet.

## Frozen identity and execution

| Item | Value |
| --- | --- |
| Operator packet | docs/briefs/bot-balance-durability27-operator-packet.md |
| Frozen revision | 5925ee93fb3e60ff6dfa60a706ee2b895ea640d6 |
| Frozen branch retained | codex/durability27-frozen |
| Frozen source tree | 7f74e57bb61cca99417754d0cfa48cd3673f2dfb |
| Definitions SHA-256 | a30458ee24ad7054c5389b1ed16d47f3435456c18feb34f72ded75c84b0828c0 |
| Hitboxes SHA-256 | 08bcc55633efe444d303c71977f7dcf87402157753af543e975e6c0c493afa83 |
| Detached checkout | C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability27-20260917/source |
| Results root | C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability27-20260917/results |
| Readiness receipts | C:/Users/osaif/AppData/Local/mmo-idle/validation/durability27 |
| Trial / mode | durability27 / run |
| Seeds | 68023, 70001, 72019 |
| Matrix | 48 cells / 144 observations / Mountain + Desert / T2 / control + candidate |
| Timestep / maximum | 100ms / 600 simulated seconds; first death |
| Synthetic / economy eligible | true / false |
| Batch start | 2026-09-17T15:34:33.966Z |
| Mountain ledger interval | 2026-09-17T15:34:33.968Z–2026-09-17T15:49:31.377Z |
| Desert ledger interval | 2026-09-17T15:49:33.041Z–2026-09-17T15:52:59.199Z |
| Batch ended marker | 2026-09-17T15:53:00.802Z |
| Operator exit marker | 2026-09-17T15:53:00.8319265Z |
| Batch wall time | 1,106,836ms / 18m 26.8s |
| Runner exit | 0; one sequential run; no retry or relaunch |

The detached source remained clean at the frozen revision after execution. The shared checkout was already dirty with unrelated user changes, including docs/README.md; those changes were preserved. This report and the README index entry are the only intended shared-checkout edits for this packet. No production files were changed. No full repository suite or live/browser playtest was run.

## Completion and raw-ledger audit

WE/PD/WC means window-ended at the 600s observation limit / player-died / wall-ceiling. A window-ended observation is a normal packet completion, not a wall failure. K/U/R means target records with a kill / unfinished target records / records with observed HP regain. Clean is the clean target-record count after the packet audit filters. P is the median sampled peak pursuer count, followed by sampled seconds with at least three pursuers. Q is a long-quiet run. Incoming damage is monster-to-player event damage from the raw stream, normalized by simulated seconds; it is not player DPS.

| Block / arm | Runs | WE/PD/WC | Target records | K/U/R | Clean | Min HP median / low | Incoming damage | Incoming / 100 sim s | Recovery interruptions | P; 3+ seconds | Late joins | Q | Episodes; cleared/unfinished | Simulated seconds |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Mountain control | 36 | 18/18/0 | 1,035 | 1,000/35/7 | 994 | 4.84% / 0% | 57,878.860 | 373.10 | 199 | 2; 13s | 148 | 1 | 894; 868/26 | 15,513.0 |
| Mountain candidate | 36 | 29/6/1 | 1,322 | 1,296/26/9 | 1,290 | 36.65% / 0% | 42,397.385 | 215.03 | 283 | 2; 16s | 269 | 5 | 1,055; 1,032/23 | 19,716.8 |
| Desert control | 36 | 36/0/0 | 1,592 | 1,539/53/110 | 1,454 | 46.49% / 8.46% | 148,800.900 | 688.89 | 0 | 2; 127s | 1,072 | 0 | 534; 503/31 | 21,600.0 |
| Desert candidate | 36 | 30/6/0 | 1,022 | 936/86/195 | 802 | 37.08% / 0% | 132,776.152 | 721.59 | 1 | 2; 81s | 922 | 0 | 155; 121/34 | 18,400.6 |

The block verification receipts report 24 cells / 72 runs and verified=true for each block. Mountain has 47 observations that reached the 600s window and one wall-ceiling observation; Desert has 66 observations that reached the 600s window and no wall-ceiling observation. The remaining target/episode records are preserved as unfinished or regained evidence, not silently converted into successful body medians.

## Measurement rules and evidence boundary

The primary estimator is the packet-defined body-TTK calculation from each block's night5-audit.json: clean eligible body medians are computed per seed and then reduced to an eligible cell median. Observed HP-regain targets, unfinished targets, long-quiet rows, and wall-ceiling rows are excluded from the strict headline estimator. A seed with no eligible primary target is I, never zero. D marks a player-died run; a clean body timing that exists before that death remains visible. Q marks a retained long-quiet row and W a wall-ceiling row.

The equal-root summary takes the eligible primary-species median per node, then the median of the two nodes, and finally gives each of the six roots equal weight. When one node does not have at least two eligible paired seeds, the strict five-root summary excludes that entire root. A full six-root value is also shown when a sparse value exists, marked with *; it is context, not a substitute for the strict estimate.

Body TTK starts at the first damaging hit on the selected body and ends at that body's kill. It is not an encounter or pack duration. Actual episodes below use the recorded startMs, endMs, durationMs, outcome, initialMembers, members, and lateJoiners. A chain that begins with one member and accumulates late joiners is not a simultaneous swarm.

The run uses the packet's synthetic +5 setup, restored process-local state, normal targeting, and no services, economy, farming, acquisition, progression, travel, respawn, manual input, live player state, or browser UI. These artifacts cannot certify live balance, visual readability, pacing feel, or invited-playtest readiness.

## READY setup, paired geometry, and actual products

All 144 READY receipts were synthetic and contained the expected class, node, targeting, gear, technique, and geometry contracts. The 72 control-candidate geometry pairs matched exactly. Mountain paired initialRosterHash values matched because HP was unchanged; Desert paired hashes differed because controller HP changed. The attack, plating, and damage-reduction products were checked from the actual READY views rather than inferred from the packet's base declarations.

The packet declarations were Mountain attack 84 → 67 for Granite Titan, 75 → 60 for Stone Eagle, and 90 → 72 for Boulder Thrower, and Desert controller HP 780 → 1,365 with attacks unchanged. The runtime products were:

| Area / node | Control runtime product | Candidate runtime product | Paired invariant |
| --- | --- | --- | --- |
| Mountain node03 | Granite Titan 1,822 HP / 101 attack; Stone Eagle 374 / 90; Boulder Thrower 424 / 108 | Granite Titan 1,822 / 80; Stone Eagle 374 / 72; Boulder Thrower 424 / 86 | HP, plating 0, and DR 5% unchanged |
| Mountain node05 | Granite Titan 1,656 / 101; Stone Eagle 340 / 90; Boulder Thrower 385 / 108 | Granite Titan 1,656 / 80; Stone Eagle 340 / 72; Boulder Thrower 385 / 86 | HP, plating 0, and DR 0% unchanged |
| Desert node03/node05 | Sun Scarab 429 HP / 58 attack; Sand Scorpion 858 / 78; Stone Basilisk 858 / 66 | Sun Scarab 429 / 58; Sand Scorpion 1,502 / 78; Stone Basilisk 1,502 / 66 | Attacks, plating, and DR unchanged |

The Desert 858 → 1,502 runtime product is the rounded node result of the declared 780 → 1,365 controller treatment. The Mountain 101 → 80, 90 → 72, and 108 → 86 products likewise include the frozen node/runtime rounding. No other monster product was changed.

## Primary Mountain body timing

The primary Mountain body is Granite Titan. Values are clean per-seed medians in seconds; the outer value is the eligible cell median. D, Q, and W have the meanings above. The candidate node03 / Apprentice cell has only one eligible seed because one seed is wall-ceiling and another is long-quiet; its full value is retained only as context.

| Node / root | Control 68023 | Control 70001 | Control 72019 | Control outer | Candidate 68023 | Candidate 70001 | Candidate 72019 | Candidate outer |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| node03 / Striker | 28.90 D | 31.10 D | 31.00 | 31.00 | 30.75 | 31.20 D | 31.00 D | 31.00 |
| node03 / Squire | 26.40 D | 26.20 | 26.00 D | 26.20 | 25.85 | 26.30 | 25.85 D | 25.85 |
| node03 / Apprentice | 18.00 D | 18.00 | 17.20 D | 18.00 | 17.60 W | 18.00 Q | 17.20 | 17.20 (n=1) |
| node03 / Slinger | 14.40 | 14.40 | 17.90 D | 14.40 | 16.10 | 14.40 | 14.40 | 14.40 |
| node03 / Conduit | 14.80 | 14.80 Q | 14.80 | 14.80 (n=2) | 14.80 | 14.75 Q | 14.80 | 14.80 (n=2) |
| node03 / Spirit | 23.00 D | 23.00 D | 23.00 | 23.00 | 23.00 | 23.00 | 23.00 | 23.00 |
| node05 / Striker | 28.25 | 27.50 D | 27.60 | 27.60 | 28.55 D | 27.90 | 28.10 D | 28.10 |
| node05 / Squire | 22.30 | 24.20 D | 22.10 D | 22.30 | 22.05 | 22.55 | 22.15 | 22.15 |
| node05 / Apprentice | 15.00 D | 15.00 D | 15.00 | 15.00 | 15.00 | 15.70 | 15.00 | 15.00 |
| node05 / Slinger | 12.05 | 12.90 | 12.90 | 12.90 | 12.90 | 12.90 | 12.90 | 12.90 |
| node05 / Conduit | 12.50 | 12.70 | 12.70 | 12.70 | 12.70 Q | 12.70 | 12.75 | 12.73 (n=2) |
| node05 / Spirit | 20.00 D | 19.75 D | 20.00 D | 20.00 | 20.50 | 20.00 D | 20.00 Q | 20.25 (n=2) |

### Mountain equal-root center

| Root | Control center | Candidate full center | Difference | Strict-note |
| --- | ---: | ---: | ---: | --- |
| Striker | 29.30s | 29.55s | +0.25s | Both nodes have at least two eligible seeds |
| Squire | 24.25s | 24.00s | -0.25s | Both nodes have at least two eligible seeds |
| Apprentice | 16.50s | 16.10s* | -0.40s | Strict candidate node03 is sparse; node05-only value is 15.00s |
| Slinger | 13.65s | 13.65s | 0.00s | Both nodes have at least two eligible seeds |
| Conduit | 13.75s | 13.76s | +0.01s | Both nodes have at least two eligible seeds |
| Spirit | 21.50s | 21.63s | +0.13s | Both nodes have at least two eligible seeds |
| **Six-root full overall** | **19.00s** | **18.86s*** | **-0.14s** | * includes the sparse Apprentice context value |
| **Strict five-root overall** | **21.50s** | **21.63s** | **+0.13s** | Apprentice root excluded because its node03 candidate has n=1 |

The 80% attack treatment therefore improves survival and lowers the damage of the changed attackers, but it does not lengthen the selected body. That is expected for an attack-only pressure experiment. The exact candidate should not be treated as a universal T2 attack scalar because the residual death pattern and altered pull sequence remain role- and node-dependent.

## Primary Desert controller timing

The two controller bodies are reported separately. Values are clean per-seed medians in seconds; the outer value is the eligible cell median. The candidate Striker cells have only one eligible seed in each node because the other two observations died before a clean controller body median could be produced.

### Sand Scorpion

| Node / root | Control 68023 | Control 70001 | Control 72019 | Control outer | Candidate 68023 | Candidate 70001 | Candidate 72019 | Candidate outer |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| node03 / Striker | 9.50 | 9.50 | 9.50 | 9.50 | I D | 16.50 D | I D | 16.50 (n=1) |
| node03 / Squire | 7.60 | 7.60 | 7.60 | 7.60 | 15.20 | 15.20 | 15.20 | 15.20 |
| node03 / Apprentice | 7.50 | 7.50 | 7.50 | 7.50 | 13.50 | 13.50 | 13.50 | 13.50 |
| node03 / Slinger | 5.30 | 5.90 | 5.30 | 5.30 | 10.15 | 10.00 | 10.00 | 10.00 |
| node03 / Conduit | 17.80 | 18.00 | 17.70 | 17.80 | 24.60 | 24.60 | 24.30 | 24.60 |
| node03 / Spirit | 9.50 | 9.50 | 9.50 | 9.50 | 17.00 | 16.50 | 16.50 | 16.50 |
| node05 / Striker | 9.50 | 9.50 | 9.50 | 9.50 | I D | 16.50 D | I D | 16.50 (n=1) |
| node05 / Squire | 7.60 | 7.60 | 7.60 | 7.60 | 15.20 | 15.20 | 15.20 | 15.20 |
| node05 / Apprentice | 7.20 | 7.50 | 7.50 | 7.50 | 13.50 | 13.50 | 13.50 | 13.50 |
| node05 / Slinger | 5.30 | 5.30 | 5.30 | 5.30 | 10.00 | 10.00 | 10.00 | 10.00 |
| node05 / Conduit | 17.95 | 17.80 | 17.80 | 17.80 | 24.00 | 24.00 | 24.30 | 24.00 |
| node05 / Spirit | 9.50 | 9.50 | 9.50 | 9.50 | 16.50 | 16.50 | 16.75 | 16.50 |

### Stone Basilisk

| Node / root | Control 68023 | Control 70001 | Control 72019 | Control outer | Candidate 68023 | Candidate 70001 | Candidate 72019 | Candidate outer |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| node03 / Striker | 10.00 | 10.00 | 10.00 | 10.00 | I D | I D | 17.50 D | 17.50 (n=1) |
| node03 / Squire | 7.60 | 7.60 | 7.60 | 7.60 | 15.20 | 15.20 | 15.20 | 15.20 |
| node03 / Apprentice | 7.50 | 7.50 | 7.50 | 7.50 | 13.50 | 13.50 | 13.50 | 13.50 |
| node03 / Slinger | 7.30 | 5.60 | 5.60 | 5.60 | 10.60 | 11.45 | 11.05 | 11.05 |
| node03 / Conduit | 20.60 | 20.35 | 19.95 | 20.35 | 27.70 | 28.65 | 27.15 | 27.70 |
| node03 / Spirit | 10.50 | 10.25 | 10.50 | 10.50 | 18.00 | 18.00 | 18.00 | 18.00 |
| node05 / Striker | 10.00 | 10.00 | 10.00 | 10.00 | I D | I D | 17.50 D | 17.50 (n=1) |
| node05 / Squire | 7.60 | 7.60 | 7.60 | 7.60 | 15.20 | 15.20 | 15.20 | 15.20 |
| node05 / Apprentice | 7.50 | 7.50 | 7.50 | 7.50 | 13.50 | 13.50 | 13.20 | 13.50 |
| node05 / Slinger | 5.60 | 5.60 | 5.60 | 5.60 | 10.60 | 11.60 | 12.30 | 11.60 |
| node05 / Conduit | 20.10 | 20.15 | 20.00 | 20.10 | 28.00 | 26.90 | 27.50 | 27.50 |
| node05 / Spirit | 10.50 | 10.50 | 10.50 | 10.50 | 18.00 | 18.00 | 18.00 | 18.00 |

### Desert equal-root center

| Root | Sand Scorpion control → candidate | Stone Basilisk control → candidate | Comment |
| --- | ---: | ---: | --- |
| Striker | 9.50s → 16.50s* | 10.00s → 17.50s* | Candidate has n=1 at both nodes; all six candidate observations died |
| Squire | 7.60s → 15.20s | 7.60s → 15.20s | Three eligible seeds at both nodes |
| Apprentice | 7.50s → 13.50s | 7.50s → 13.50s | Three eligible seeds at both nodes |
| Slinger | 5.30s → 10.00s | 5.60s → 11.33s | Three eligible seeds at both nodes |
| Conduit | 17.80s → 24.30s | 20.23s → 27.60s | Candidate is the slow tail |
| Spirit | 9.50s → 16.50s | 10.50s → 18.00s | Three eligible seeds at both nodes |
| **Six-root full overall** | **8.55s → 15.85s*** | **8.80s → 16.35s*** | Sparse Striker context included |
| **Strict five-root overall** | **7.60s → 15.20s** | **7.60s → 15.20s** | Striker root excluded |

The body center is therefore near the requested roughly 15s guide for the robust five-root estimate and remains below the historical Durability25 T3 reference of approximately 22.10s. That does not make the 1.75x treatment shippable: the actual two-enemy encounter and the Conduit tail measure a different pacing layer.

## Supporting species and fast/slow tails

These are cell-level outer medians across the eligible class/node cells for each species in each arm. They are descriptive tails, not pooled DPS or a class ranking. Desert candidate controller species have 10 eligible cells because both Striker candidate cells are sparse.

| Area / species | Control median; fastest–slowest cell | Candidate median; fastest–slowest cell |
| --- | --- | --- |
| Mountain / Granite Titan | 19.00s; 12.70–31.00s | 20.25s; 12.73–31.00s |
| Mountain / Stone Eagle | 3.00s; 0.95–4.00s | 3.00s; 0.00–4.00s |
| Mountain / Boulder Thrower | 3.45s; 1.50–5.85s | 3.30s; 1.20–5.15s |
| Desert / Sun Scarab | 9.15s; 4.00–12.80s | 4.23s; 3.20–13.50s |
| Desert / Sand Scorpion | 8.55s; 5.30–17.80s | 15.20s; 10.00–24.60s |
| Desert / Stone Basilisk | 8.80s; 5.60–20.35s | 15.20s; 11.05–27.70s |

The Sun Scarab timing falls in the candidate arm because controller durability changes the number and sequencing of later pulls and because the candidate Striker cells terminate early. It is retained as a supporting timing signal, not as evidence that the cheap damage dealer should receive a balance change.

## Per-specialization/node target and death audit

The primary timing tables show every class/node and every seed. This table keeps the corresponding target-record attrition visible. Each K/U/R cell is unique kills / unfinished targets / observed HP-regain records across the three observations in that class/node cell. A wall-ceiling count appears in parentheses where present.

### Mountain

| Node / root | Control deaths; K/U/R | Candidate deaths; K/U/R |
| --- | ---: | ---: |
| node03 / Striker | 2; 47/5/0 | 2; 62/4/0 |
| node03 / Squire | 2; 79/3/0 | 1; 83/3/0 |
| node03 / Apprentice | 2; 69/3/0 | 0; 75/3/1 (WC=1) |
| node03 / Slinger | 1; 92/2/1 | 0; 151/3/2 |
| node03 / Conduit | 0; 107/0/1 | 0; 104/0/1 |
| node03 / Spirit | 3; 15/3/1 | 0; 108/2/1 |
| node05 / Striker | 1; 80/1/0 | 2; 66/2/0 |
| node05 / Squire | 2; 62/5/0 | 0; 122/2/0 |
| node05 / Apprentice | 2; 75/5/2 | 0; 130/2/2 |
| node05 / Slinger | 0; 161/1/1 | 0; 164/3/1 |
| node05 / Conduit | 0; 130/2/0 | 0; 126/1/0 |
| node05 / Spirit | 3; 83/5/1 | 1; 105/1/1 |

Mountain's improvement is strongest for node03 Apprentice, node03 Spirit, node03 Slinger, and node05 Squire/Apprentice. It is not universal: candidate Striker deaths increase from 3 to 4 across the two nodes, and one node05 Spirit death remains.

### Desert

| Node / root | Control deaths; K/U/R | Candidate deaths; K/U/R |
| --- | ---: | ---: |
| node03 / Striker | 0; 134/4/0 | 3; 8/5/0 |
| node03 / Squire | 0; 141/2/0 | 0; 105/3/0 |
| node03 / Apprentice | 0; 132/4/7 | 0; 88/15/24 |
| node03 / Slinger | 0; 174/1/3 | 0; 112/7/29 |
| node03 / Conduit | 0; 75/5/12 | 0; 65/7/21 |
| node03 / Spirit | 0; 111/6/26 | 0; 85/13/26 |
| node05 / Striker | 0; 136/4/0 | 3; 8/5/0 |
| node05 / Squire | 0; 145/1/0 | 0; 110/2/0 |
| node05 / Apprentice | 0; 129/7/5 | 0; 91/3/20 |
| node05 / Slinger | 0; 181/2/7 | 0; 112/7/33 |
| node05 / Conduit | 0; 75/7/16 | 0; 66/6/11 |
| node05 / Spirit | 0; 106/10/34 | 0; 86/13/31 |

The Desert candidate's six deaths are entirely the two Striker cells. Their candidate body medians are sparse or absent, so the strict controller center excludes that root rather than treating a death as a zero or a successful timing.

## Cast, damage, and pressure exposure

Raw incoming damage below is split by source and event damage type. Direct and debt are the labels emitted by the frozen ledger. Because the damage events do not carry an ability name, the source totals are not assigned to a specific cast or ordinary attack.

### Mountain source damage

| Source | Control direct events / HP | Control debt events / HP | Candidate direct events / HP | Candidate debt events / HP |
| --- | ---: | ---: | ---: | ---: |
| Granite Titan | 629 / 26,922.23 | 101 / 137 | 778 / 17,674.33 | 95 / 104 |
| Boulder Thrower | 413 / 15,201.65 | 172 / 210 | 541 / 10,410.30 | 133 / 152 |
| Stone Eagle | 330 / 15,158.98 | 183 / 249 | 498 / 13,874.75 | 159 / 182 |

The Mountain incoming sums are 57,878.86 control and 42,397.39 candidate over 15,513.0 and 19,716.8 simulated seconds. That normalizes to 373.10 and 215.03 HP damage per 100 simulated seconds. This lower candidate damage is expected from the changed attack products and is not by itself proof that the entire encounter became low pressure; candidate recovery interruptions and late joins increased, and candidate observations lived longer.

### Mountain cast exposure

| Cast label | Control starts / fired | Candidate starts / fired |
| --- | ---: | ---: |
| Ground Slam | 469 / 417 | 609 / 539 |
| Granite Barrier | 255 / 254 | 339 / 337 |
| Huge Boulder | 169 / 96 | 244 / 129 |
| Skyfall Rend | 255 / 254 | 372 / 372 |

Across all Mountain sources, incoming damage events were 1,828 control and 2,204 candidate. Total monster cast starts/fired were 1,148/1,021 control and 1,564/1,377 candidate. Normalized cast exposure was 7.400/6.582 starts/fired per 100 simulated seconds in control and 7.932/6.984 in candidate. Technique-adapter events normalized to 40.727 and 38.241 per 100 simulated seconds respectively.

The Mountain event schema provides separate Stone Eagle Skyfall Rend cast telemetry and Stone Eagle source damage, but damage events themselves contain no ability label or ordinary/dive tag. The report therefore tracks Eagle source damage plus 255/254 control and 372/372 candidate Skyfall start/fired exposure without claiming that an Eagle death was caused by the dive. The same limitation applies to Titan and Boulder ability attribution.

### Desert source damage and cast exposure

| Source | Control direct events / HP | Control debt events / HP | Candidate direct events / HP | Candidate debt events / HP |
| --- | ---: | ---: | ---: | ---: |
| Sun Scarab | 3,631 / 82,883.30 | 689 / 717 | 2,418 / 50,829.46 | 410 / 426 |
| Sand Scorpion | 979 / 40,677.65 | 386 / 398 | 1,257 / 52,782.80 | 790 / 915 |
| Stone Basilisk | 840 / 23,931.95 | 193 / 193 | 949 / 27,548.90 | 272 / 274 |

The Desert incoming sums are 148,800.90 control and 132,776.15 candidate over 21,600.0 and 18,400.6 simulated seconds, or 688.89 and 721.59 HP damage per 100 simulated seconds. Monster cast starts/fired were 1,098/952 control and 1,088/1,061 candidate, or 5.083/4.407 and 5.913/5.766 per 100 simulated seconds. The candidate's higher normalized attrition exposure is consistent with the controller body and episode-length increase; it is not a changed attack, plating, DR, or Scarab product.

| Cast label | Control starts / fired | Candidate starts / fired |
| --- | ---: | ---: |
| Numbing Sting | 601 / 568 | 694 / 678 |
| Petrifying Gaze | 497 / 384 | 394 / 383 |

## Terminal deaths, incoming windows, and entry health

The terminal table preserves the death timing, kills before death, terminal incoming windows, and the first one-second sample at or after the terminal episode began. Entry health is shown as HP + barrier. The 10s and 30s windows are inclusive of the terminal event and use monster-to-player HP damage from the raw stream. Mountain death events had no ability name in their cause payload; Desert candidate deaths explicitly named Numbing Sting.

### Mountain terminal deaths

| Arm | Node / root / seed | Death | Killer | Blow | Kills before death | Incoming 10s / 30s | Entry HP + barrier |
| --- | --- | ---: | --- | ---: | ---: | ---: | ---: |
| Control | node03 / Apprentice / 68023 | 26.6s | Boulder Thrower | 88.2 | 1 | 349.23 / 370.83 | 254 + 66 |
| Control | node03 / Spirit / 68023 | 29.6s | Boulder Thrower | 100 | 1 | 285.55 / 342.10 | 230 + 129 |
| Control | node05 / Apprentice / 70001 | 36.3s | Granite Titan | 81 | 2 | 333.40 / 384.80 | 254 + 54.45 |
| Control | node03 / Spirit / 70001 | 79.6s | Stone Eagle | 80 | 5 | 331.00 / 331.00 | 230 + 129 |
| Control | node03 / Slinger / 72019 | 99.6s | Granite Titan | 94 | 10 | 274.40 / 352.40 | 201 + 0 |
| Control | node05 / Squire / 70001 | 141.4s | Boulder Thrower | 88 | 7 | 344.00 / 492.20 | 288.46 + 0 |
| Control | node03 / Spirit / 72019 | 159.7s | Boulder Thrower | 100 | 9 | 329.20 / 329.20 | 230 + 129 |
| Control | node05 / Striker / 70001 | 211.9s | Boulder Thrower | 81 | 12 | 320.00 / 474.40 | 258.47 + 0 |
| Control | node05 / Squire / 72019 | 222.6s | Granite Titan | 80 | 11 | 424.00 / 526.00 | 296 + 77 |
| Candidate | node05 / Spirit / 70001 | 225.0s | Stone Eagle | 61 | 19 | 305.43 / 305.43 | 230 + 129 |
| Candidate | node05 / Striker / 72019 | 248.1s | Granite Titan | 65 | 12 | 340.00 / 406.00 | 267 + 69 |
| Candidate | node05 / Striker / 68023 | 257.5s | Granite Titan | 65 | 21 | 354.13 / 601.13 | 267 + 27.60 |
| Control | node05 / Spirit / 70001 | 263.4s | Stone Eagle | 80 | 18 | 323.00 / 323.00 | 230 + 129 |
| Control | node05 / Spirit / 68023 | 264.7s | Stone Eagle | 100 | 23 | 335.00 / 335.00 | 230 + 129 |
| Candidate | node03 / Striker / 72019 | 287.4s | Granite Titan | 65 | 14 | 340.00 / 470.10 | 267 + 0 |
| Control | node03 / Striker / 70001 | 305.7s | Granite Titan | 77 | 10 | 226.00 / 502.88 | 267 + 46.58 |
| Control | node03 / Striker / 68023 | 308.7s | Stone Eagle | 72 | 12 | 386.00 / 520.32 | 267 + 69 |
| Candidate | node03 / Squire / 72019 | 317.3s | Granite Titan | 59 | 15 | 313.00 / 484.00 | 296 + 12 |
| Control | node03 / Squire / 68023 | 380.1s | Stone Eagle | 69 | 23 | 374.00 / 479.25 | 296 + 77 |
| Candidate | node03 / Striker / 70001 | 470.2s | Granite Titan | 65 | 17 | 340.00 / 540.45 | 261.18 + 0 |
| Control | node03 / Squire / 72019 | 529.5s | Granite Titan | 80 | 28 | 336.00 / 497.68 | 285.38 + 0 |
| Control | node05 / Apprentice / 68023 | 544.2s | Granite Titan | 81 | 37 | 274.35 / 305.15 | 254 + 66 |
| Control | node05 / Spirit / 72019 | 547.7s | Stone Eagle | 100 | 42 | 312.80 / 312.80 | 230 + 129 |
| Control | node03 / Apprentice / 72019 | 561.7s | Stone Eagle | 3 | 36 | 315.50 / 445.50 | 170.24 + 0 |

Control deaths by terminal killer were Boulder Thrower 5, Granite Titan 6, and Stone Eagle 7. Candidate deaths were Granite Titan 5 and Stone Eagle 1. The terminal 10s/30s windows show sustained ordinary-source exposure in both arms; they do not isolate a single ability as the cause.

### Desert terminal deaths

| Arm | Node / root / seed | Death | Killer / ability | Blow | Kills before death | Incoming 10s / 30s | Entry HP + barrier |
| --- | --- | ---: | --- | ---: | ---: | ---: | ---: |
| Candidate | node03 / Striker / 68023 | 22.0s | Sand Scorpion / Numbing Sting | 47 | 0 | 309.78 / 554.78 | 292 + 0 |
| Candidate | node05 / Striker / 68023 | 22.0s | Sand Scorpion / Numbing Sting | 47 | 0 | 309.78 / 554.78 | 292 + 0 |
| Candidate | node03 / Striker / 70001 | 55.9s | Sand Scorpion / Numbing Sting | 47 | 2 | 314.62 / 585.62 | 269.74 + 0 |
| Candidate | node05 / Striker / 70001 | 55.9s | Sand Scorpion / Numbing Sting | 47 | 2 | 314.62 / 585.62 | 269.74 + 0 |
| Candidate | node03 / Striker / 72019 | 122.4s | Sand Scorpion / Numbing Sting | 47 | 6 | 335.78 / 606.78 | 274.41 + 0 |
| Candidate | node05 / Striker / 72019 | 122.4s | Sand Scorpion / Numbing Sting | 47 | 6 | 335.78 / 606.78 | 274.41 + 0 |

There were no Desert control deaths. The candidate Striker deaths are a concentrated attrition signal and are why their controller medians remain sparse rather than being folded into the strict center.

## Actual Desert two-enemy encounters and Conduit tail

Body TTK and actual encounter duration are separate. The table below filters recorded cleared episodes by final members.length === 2; it also distinguishes episodes that started with two members from the much more common one-initial-member → two-final-member late-join shape.

| Desert arm | Cleared episodes | Final members = 2 | Initial members = 2 | Initial 1 → final 2 | Final-two median / max | All cleared episode median / max |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Control | 503 | 479 | 21 | 458 | 14.8s / 28.4s | 14.8s / 144.8s |
| Candidate | 121 | 115 | 4 | 111 | 23.5s / 25.8s | 23.5s / 290.0s |

Most control and candidate two-member episodes started with one member and gained one late joiner; only 21 control and 4 candidate cleared episodes started with two. The candidate also produced fewer total episodes because the longer controllers and six Striker deaths changed the pull chain. Its longest cleared chain ended with 17 members after 16 late joins and lasted 290.0s; this is a chain-shape signal, not a simultaneous 17-enemy encounter.

The Stone Basilisk Conduit body tail is 20.23s control → 27.60s candidate at the equal-root center, with the slowest candidate cell at 27.70s. The Sand Scorpion Conduit center is 17.80s → 24.30s. These tails are already above the historical T3 reference and prevent treating 1.75x as a uniform controller solution even though the five-root center is near 15.2s.

## Finite decision and remaining scope

### Mountain — adjust

Keep the Mountain attack scalar as a bounded experiment result, not a production value. The 80% runtime products materially reduce deaths and raise minimum-health outcomes while preserving non-trivial multi-pursuer and recovery-interruption pressure. However, the scalar does not increase primary body TTK, candidate Striker deaths are still higher than control in the combined node view, one candidate observation hit the wall ceiling, and the pressure sequence differs by node and root. Any next Mountain work should be a bounded intermediate biome-local pressure screen with explicit Striker/Squire/Spirit death gates and normalized incoming/cast exposure. Do not compensate supporting attacks or change movement from this artifact alone.

### Desert — adjust

Keep the 1.75x controller HP treatment as an upper-bound screen, not a production value. It moves the robust controller body center toward 15s and remains below the historical T3 aggregate, but actual final-two encounters center at 23.5s, Conduit reaches 27.6s, unfinished/regained records rise, and every candidate death is a Striker death. A later local package may test an intermediate controller HP treatment with the two-enemy duration, Conduit tail, Striker survival, and late-join chain shape as explicit gates. Do not alter the Sun Scarab, controller attacks, DR, plating, or ability cadence based on this packet.

Keep the retained T4 primary values and Graveyard shape pending consolidated review. There is no universal Focus change here. Remaining campaign work stays bounded to the planned T4 Maestro pressure, Jungle, and Trench evidence before any current-source adoption, regression suite, or live playtest decision. Durability27 itself authorizes no extra run, production edit, commit, push, or full certification.

## Artifact index

| Artifact | Path |
| --- | --- |
| Batch manifest | C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability27-20260917/results/batch-manifest.json |
| Batch end marker | C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability27-20260917/results/batch-ended.json |
| Operator exit | C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability27-20260917/operator-exit.json |
| Mountain raw index | C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability27-20260917/results/mountain/index.json |
| Mountain audit | C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability27-20260917/results/mountain/night5-audit.json |
| Mountain analysis | C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability27-20260917/results/mountain/analysis.md |
| Desert raw index | C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability27-20260917/results/desert/index.json |
| Desert audit | C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability27-20260917/results/desert/night5-audit.json |
| Desert analysis | C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability27-20260917/results/desert/analysis.md |
| Mountain READY receipts | C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability27-20260917/results/mountain/**/ready.json |
| Desert READY receipts | C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability27-20260917/results/desert/**/ready.json |

## Planner review

Retain the numerical directions provisionally and test defensive preparation
before another broad mob adjustment. Mountain attack-only tuning was not meant
to raise body TTK; its survival improvement is the relevant result. Desert meets
the representative controller timing direction but Striker6/6 deaths remains
unresolved. Conduit T2 Basilisk27.6s is below its own Durability25 T3 reference
44.15s; comparing that tail to the all-root T3 median is not proof of a reversed
class-specific ladder. Durability28 changes only stance for Striker/Squire across
fixed T2 Mountain/T2 Desert/T4 Mountain candidates. No production adoption.
