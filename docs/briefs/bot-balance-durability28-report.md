# Durability28 — melee stance counterplay on retained mob candidates

Date: 2026-09-17  
Status: complete; sealed synthetic screen audited; no production balance edit authorized  
Decision scope: whether Defensive stance makes the retained Mountain and Desert melee pressure cases sustain longer encounters at an acceptable damage and pacing cost

## Executive result

Durability28 executed once and sequentially on the frozen checkout. The runner exited 0. All 24 cells and 72 observations were retained: 53 window-ended observations, 17 player deaths, and 2 wall-ceiling observations. No retry, relaunch, adaptive build, source edit, balance edit, cap extension, service, commit, or push was introduced.

- **Mountain T2:** Defensive improved the run-level minimum-HP median from 29.32% to 46.32% and reduced incoming HP damage from 373.67 to 289.33 per 100 simulated seconds, but deaths remained 3/12 in both stance arms. The result is **partial mitigation with remaining pressure**.
- **Desert T2:** Defensive produced 12/12 window-ended runs with no player deaths or wall cutoffs, versus 6/12 deaths in Offensive. Minimum-HP median rose from 8.04% to 48.07%; final-two-member cleared episodes moved from 23.5s to 34.3s. This is **an ordinary defensive tool sufficient in the sampled cases**, with a material throughput and pacing cost.
- **Mountain T4:** Defensive reduced normalized incoming HP damage only marginally, from 1,482.33 to 1,475.15 per 100 simulated seconds, while the arm still contained 3 deaths and one wall cutoff. The T4 primary Granite Mammoth cells also contain sparse Defensive medians and one long-quiet cutoff row. This remains **unresolved**, with the Striker/Maestro pressure tail still visible.
- Defensive changed actual READY products in every paired run: plating increased, `attackCooldown` lengthened, `finalDamageDealtMult` moved from 1.288 to 0.952, and `finalDamageTakenMult` moved from 1.10 to 0.90. HP, attack, damage reduction, barrier, recovery, gear, abilities, and monster setup remained paired invariants.
- T4 `Granite Barrier` was preserved as an absolute ward product. Complete raw activations absorbed 345 damage at Mountain node03 and 288 at node05 in both stance arms; one incomplete node05 Defensive target recorded 182 absorbed before its target record ended.

**Disposition:** retain Defensive stance as a valid situational bot-build tool, not as a universal stance winner. It is sufficient for this Desert T2 sample, partial for Mountain T2, and unresolved for Mountain T4. Do not adopt any monster or stance package from this report into the current source. The one bounded next investigation should be a T4 Mountain Striker/Maestro final-episode pressure audit with ordinary-hit versus cast attribution under the same paired package; do not begin a broad six-class HP sweep.

## Frozen identity and execution

| Item | Value |
| --- | --- |
| Operator packet | `docs/briefs/bot-balance-durability28-operator-packet.md` |
| Frozen revision | `40eba357b9c7b2f71308b53116557c797c5c8bcd` |
| Frozen branch label | `codex/durability28-frozen` |
| Frozen source tree | `a169c249c9c9caf90b84374393d3972663c6f5be` |
| Definitions SHA-256 | `a30458ee24ad7054c5389b1ed16d47f3435456c18feb34f72ded75c84b0828c0` |
| Hitboxes SHA-256 | `08bcc55633efe444d303c71977f7dcf87402157753af543e975e6c0c493afa83` |
| Detached checkout | `C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability28-20260917/source` |
| Results root | `C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability28-20260917/results` |
| Readiness receipts | `C:/Users/osaif/AppData/Local/mmo-idle/validation/durability28` |
| Trial / mode | `durability28` / `run` |
| Seeds | `74017`, `76001`, `78007` |
| Matrix | 24 cells / 72 observations / Mountain T2, Desert T2, Mountain T4 |
| Timestep / maximum | 100ms / 600 simulated seconds; first death |
| Synthetic / economy eligible | true / false |
| Batch start | `2026-09-17T17:08:26.407Z` |
| Mountain T2 ledger interval | `2026-09-17T17:08:26.409Z`–`2026-09-17T17:13:45.955Z` |
| Desert T2 ledger interval | `2026-09-17T17:13:46.603Z`–`2026-09-17T17:14:40.114Z` |
| Mountain T4 ledger interval | `2026-09-17T17:14:40.635Z`–`2026-09-17T17:23:09.411Z` |
| Batch ended marker | `2026-09-17T17:23:10.200Z` |
| Operator exit marker | `2026-09-17T17:23:10.2325998Z` |
| Batch wall time | 883,793ms / 14m 43.8s |
| Runner exit | 0; one sequential run; no retry or relaunch |

The detached source remained clean at the frozen revision after execution. The shared checkout was already dirty with unrelated user changes, including `docs/README.md`; those changes were preserved. This report and the README index entry are the only intended shared-checkout edits for this packet. No production files were changed. No full repository suite or live/browser playtest was run.

## Completion and raw-ledger audit

WE/PD/WC means window-ended at the 600-second observation limit / player-died / wall-ceiling. K/U/R means target records with a kill / unfinished target record / observed HP regain. `clean` is the target-record count that passed the clean-target filter. Incoming HP damage is the raw monster-to-player `damage.hpDamage` sum; it excludes the amount absorbed by a player barrier. Player output is raw player-to-monster `damage.hpDamage`; the per-100-second value is the comparable throughput measure because total exposure differs between arms.

| Block / arm | Runs | WE/PD/WC | Target records | K/U/R | Clean | Min HP median / low | Incoming HP damage | Incoming / 100 sim s | Player HP damage | Player / 100 sim s | Recovery interruptions | Peak P; 3+ seconds | Late joins | Q | Simulated seconds |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Mountain T2 / Offensive | 12 | 9/3/0 | 378 | 365/13/0 | 365 | 29.32% / 0% | 23,921.400 | 373.67 | 328,751 | 5,135.37 | 107 | 2; 4s | 46 | 0 | 6,401.7 |
| Mountain T2 / Defensive | 12 | 9/3/0 | 295 | 284/11/0 | 284 | 46.32% / 0% | 17,739.025 | 289.33 | 232,824 | 3,797.49 | 116 | 2; 15s | 35 | 0 | 6,131.0 |
| Desert T2 / Offensive | 12 | 6/6/0 | 265 | 253/12/0 | 253 | 8.04% / 0% | 59,549.611 | 1,388.88 | 293,738 | 6,850.87 | 0 | 2; 0s | 128 | 0 | 4,287.6 |
| Desert T2 / Defensive | 12 | 12/0/0 | 342 | 333/9/0 | 333 | 48.07% / 37.10% | 72,030.000 | 1,000.42 | 344,523 | 4,785.04 | 0 | 2; 0s | 167 | 0 | 7,200.0 |
| Mountain T4 / Offensive | 12 | 9/2/1 | 397 | 386/11/0 | 386 | 36.60% / 0% | 101,268.100 | 1,482.33 | 2,475,396 | 36,233.97 | 219 | 2; 6s | 47 | 1 | 6,831.7 |
| Mountain T4 / Defensive | 12 | 8/3/1 | 272 | 258/14/0 | 258 | 44.49% / 0% | 86,081.150 | 1,475.15 | 1,571,379 | 26,928.39 | 155 | 2; 14s | 31 | 1 | 5,835.4 |

There were 1,949 target records overall: 1,879 kills, 70 unfinished records, and no observed HP regain. The two wall-ceiling rows are explicitly retained below. The two `Q` rows are those same long-quiet wall-ceiling rows; no additional non-cutoff long-quiet row was hidden or removed.

### Cell-level pressure and encounter audit

The cell rows below show every class/node/stance cell. `In/100` and `Out/100` are raw HP-damage rates per 100 simulated seconds. Episodes are recorded encounter episodes, not pooled target TTK. `late / recov / 3+ / Q` means total late joins / recovery interruptions / sampled seconds with at least three pursuers / long-quiet rows.

| Block | Node / root | Arm | WE/PD/WC | K/U/R; clean | Min HP median / low | In/100 | Out/100 | Episodes cleared/unfinished; median/max s | late / recov / 3+ / Q |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Mountain T2 | 03 / Striker | Offensive | 1/2/0 | 55/5/0; 55 | 0% / 0% | 633.80 | 4,236.29 | 52/3; 6.7/37.5 | 6/21/4/0 |
| Mountain T2 | 03 / Striker | Defensive | 1/2/0 | 45/5/0; 45 | 0% / 0% | 477.94 | 3,024.40 | 42/3; 9.4/54.0 | 6/13/10/0 |
| Mountain T2 | 03 / Squire | Offensive | 2/1/0 | 105/4/0; 105 | 41.60% / 0% | 331.01 | 5,705.57 | 84/3; 3.5/32.3 | 23/31/0/0 |
| Mountain T2 | 03 / Squire | Defensive | 2/1/0 | 65/2/0; 65 | 51.42% / 0% | 228.98 | 3,999.92 | 61/1; 5.8/46.4 | 6/31/5/0 |
| Mountain T2 | 05 / Striker | Offensive | 3/0/0 | 91/2/0; 91 | 28.43% / 27.39% | 355.13 | 4,360.39 | 85/2; 6.3/32.7 | 6/26/0/0 |
| Mountain T2 | 05 / Striker | Defensive | 3/0/0 | 75/2/0; 75 | 46.94% / 41.12% | 319.22 | 3,359.33 | 65/2; 8.9/52.2 | 10/30/0/0 |
| Mountain T2 | 05 / Squire | Offensive | 3/0/0 | 114/2/0; 114 | 45.79% / 14.53% | 279.79 | 5,890.61 | 103/2; 3.5/31.8 | 11/29/0/0 |
| Mountain T2 | 05 / Squire | Defensive | 3/0/0 | 99/2/0; 99 | 55.73% / 45.70% | 167.45 | 4,644.00 | 86/2; 6.1/44.2 | 13/42/0/0 |
| Desert T2 | 03 / Striker | Offensive | 0/3/0 | 12/4/0; 12 | 0% / 0% | 1,932.63 | 6,404.22 | 6/3; 23.3/25.5 | 8/0/0/0 |
| Desert T2 | 03 / Striker | Defensive | 3/0/0 | 80/2/0; 80 | 39.36% / 37.10% | 1,213.61 | 4,454.00 | 39/3; 35.4/38.6 | 41/0/0/0 |
| Desert T2 | 03 / Squire | Offensive | 3/0/0 | 110/3/0; 110 | 28.69% / 21.59% | 1,297.72 | 7,023.67 | 55/2; 23.5/25.4 | 56/0/0/0 |
| Desert T2 | 03 / Squire | Defensive | 3/0/0 | 88/2/0; 88 | 59.02% / 53.58% | 785.33 | 5,185.33 | 43/2; 30.2/36.4 | 44/0/0/0 |
| Desert T2 | 05 / Striker | Offensive | 0/3/0 | 22/4/0; 22 | 0% / 0% | 1,791.55 | 6,077.35 | 11/3; 23.4/25.5 | 12/0/0/0 |
| Desert T2 | 05 / Striker | Defensive | 3/0/0 | 81/2/0; 81 | 38.38% / 37.10% | 1,224.06 | 4,530.94 | 41/2; 35.1/38.6 | 39/0/0/0 |
| Desert T2 | 05 / Squire | Offensive | 3/0/0 | 109/1/0; 109 | 23.75% / 16.07% | 1,306.17 | 6,927.11 | 54/1; 23.5/25.4 | 52/0/0/0 |
| Desert T2 | 05 / Squire | Defensive | 3/0/0 | 84/3/0; 84 | 59.02% / 53.58% | 778.67 | 4,969.89 | 41/3; 30.9/36.4 | 43/0/0/0 |
| Mountain T4 | 03 / Striker / Maestro | Offensive | 1/2/0 | 109/4/0; 109 | 0% / 0% | 2,362.16 | 50,832.38 | 95/3; 11.6/23.8 | 13/62/0/0 |
| Mountain T4 | 03 / Striker / Maestro | Defensive | 1/2/0 | 40/5/0; 40 | 0% / 0% | 2,118.66 | 38,244.24 | 34/3; 15.4/28.9 | 8/19/0/0 |
| Mountain T4 | 03 / Squire / Reverb | Offensive | 3/0/0 | 54/3/0; 54 | 41.77% / 39.46% | 1,784.12 | 23,078.67 | 46/3; 34.1/76.7 | 8/29/0/0 |
| Mountain T4 | 03 / Squire / Reverb | Defensive | 2/0/1 | 43/2/0; 43 | 46.45% / 3.10% | 1,787.56 | 14,857.60 | 36/2; 44.9/83.4 | 7/18/14/1 |
| Mountain T4 | 05 / Striker / Maestro | Offensive | 2/0/1 | 140/1/0; 140 | 33.21% / 24.60% | 1,093.40 | 47,828.65 | 129/1; 8.5/18.2 | 10/87/0/1 |
| Mountain T4 | 05 / Striker / Maestro | Defensive | 2/1/0 | 122/4/0; 122 | 48.34% / 0% | 1,386.85 | 42,903.04 | 111/3; 11.4/24.3 | 12/83/0/0 |
| Mountain T4 | 05 / Squire / Reverb | Offensive | 3/0/0 | 83/3/0; 83 | 39.07% / 34.14% | 810.30 | 26,042.67 | 67/3; 22.4/64.1 | 16/41/0/0 |
| Mountain T4 | 05 / Squire / Reverb | Defensive | 3/0/0 | 53/3/0; 53 | 76.92% / 42.52% | 1,001.89 | 19,020.11 | 49/3; 33.4/73.8 | 4/35/0/0 |

The T4 wall-ceiling rows are `dur28-mountain4-03-squire-defensive-s76001` and `dur28-mountain4-05-striker-offensive-s78007`. The first ended at 468.5 simulated seconds with 46.45% minimum HP and a 155.0-second quiet interval; the second ended at 515.8 simulated seconds with 53.93% minimum HP and a 74.0-second quiet interval. They remain cutoff evidence, not successful 600-second windows.

## Measurement rules and evidence boundary

The primary estimator is the packet-defined body-TTK calculation from each block's `night5-audit.json`: clean eligible body medians are computed per seed and then reduced to an eligible cell median. A clean value from a player-died run remains visible when that body was killed before the death, but a missing body value is `I`, never zero. Wall-ceiling and long-quiet values are marked `WC`/`Q` and are not silently promoted into strict headline medians. A sparse outer value with only one eligible seed is marked `*` and is context only; the packet's at-least-two-eligible-paired-seed rule is preserved.

Body TTK starts at the first damaging hit on the selected body and ends at that body's kill. It is not a pack duration. Encounter durations below use the recorded episode `startMs`, `endMs`, `durationMs`, `outcome`, `initialMembers`, `members`, and `lateJoiners`. A chain that begins with one member and accumulates late joiners is not a simultaneous swarm.

The run uses the packet's synthetic +5 setup, restored process-local state, natural ecology, normal targeting, and no services, economy, farming, acquisition, progression, travel, respawn, manual input, live player state, or browser UI. These artifacts cannot certify live balance, player feel, visual readability, or invited-playtest readiness. No six-class median and no universal stance winner are inferred from this two-class screen.

## READY setup, paired geometry, and actual products

There were 72/72 synthetic READY receipts and 36 fresh same-seed Offensive/Defensive pairs. All 36 pairs matched on:

- `initialRosterHash`;
- `geometryRosterHash`;
- the full serialized `initialRoster` array; and
- the serialized `initialStats` monster-stat array.

The only READY view differences across the paired receipts were the expected cell name, active/attuned/equipped stance fields, plating, `attackCooldown`, `finalDamageDealtMult`, and `finalDamageTakenMult`. The paired `maxHp`, attack, damage reduction, barrier and barrier maximum, recovery, selected class/subvariant, equipment, abilities, passives, and monster setup were unchanged. These paired invariants were checked from receipts rather than inferred from the packet text.

| Area / root label | Max HP / attack | Plating Offensive → Defensive | Damage reduction | Barrier | Cooldown Offensive → Defensive | Damage dealt multiplier O → D | Damage taken multiplier O → D |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Mountain T2 / Striker | 267 / 33 | 20 → 24 | 2% | 69 | 490 → 535ms | 1.288 → 0.952 | 1.10 → 0.90 |
| Mountain T2 / Squire | 296 / 107 | 23 → 28 | 6% | 77 | 1,855 → 2,066ms | 1.288 → 0.952 | 1.10 → 0.90 |
| Desert T2 / Striker | 292 / 33 | 34 → 41 | 2% | 0 | 490 → 535ms | 1.288 → 0.952 | 1.10 → 0.90 |
| Desert T2 / Squire | 325 / 107 | 39 → 47 | 6% | 0 | 1,855 → 2,066ms | 1.288 → 0.952 | 1.10 → 0.90 |
| Mountain T4 / Striker / Maestro | 596 / 152 | 62 → 74 | 2% | 250 | 441 → 479ms | 1.288 → 0.952 | 1.10 → 0.90 |
| Mountain T4 / Squire / Reverb | 647 / 211 | 72 → 86 | 6% | 272 | 1,765 → 1,955ms | 1.288 → 0.952 | 1.10 → 0.90 |

Monster products were paired invariants. The Mountain T2 runtime attacks were Granite Titan 80, Stone Eagle 72, and Boulder Thrower 86, with node03 HP 1,822 / 374 / 424 and node05 HP 1,656 / 340 / 385. Desert T2 used Sun Scarab 429 HP / 58 attack, Sand Scorpion 1,502 HP / 78 attack, and Stone Basilisk 1,502 HP / 66 attack at both sampled nodes. Mountain T4 used the packet's retained candidate package: node03 target HP was Avalanche Tyrant 1,920, Cragback Rhino 7,920, Cliffside Roc 2,040, and Granite Mammoth 16,560; node05 target HP was 1,600 / 6,600 / 1,700 / 13,800 respectively. The paired READY roster/stat arrays remained identical across the two stance arms.

### Mountain T4 ward audit

`initialStats` receipts intentionally expose the initial monster stat array rather than the low-health ward configuration, so the T4 ward product was audited from raw `damage` events targeting Granite Mammoth. The full Granite Barrier absorption products were:

| Node / stance | Complete Mammoth ward activations | Full absorbed product | Incomplete product |
| --- | ---: | ---: | ---: |
| node03 / Offensive | 32 | 345 each | none observed |
| node03 / Defensive | 8 | 345 each | none observed |
| node05 / Offensive | 41 | 288 each | none observed |
| node05 / Defensive | 38 | 288 each | one target at 182 before its record ended |

The different activation counts reflect the stance-dependent encounter path and exposure, not ward-capacity drift. Every complete activation at a given node had the same absolute product in both arms. No stance-specific ward mutation was observed.

## Ordinary damage and cast evidence

The raw stream separates ordinary `damage` events from `monster-cast-start`/`monster-cast-end` and `ability-activation` events. The table reports player damage hit shape, cast starts/fires from target records, and ability activations separately. There were no minion attack beats in this packet.

| Block / arm | Player direct / AOE hits | Empowered-tagged hits | Monster cast starts / fires | Ability activations | Ability IDs |
| --- | ---: | ---: | ---: | ---: | --- |
| Mountain T2 / Offensive | 3,966 / 28 | 938 | 638 / 621 | 1,237 | Sweep 1,186; Second Wind 51 |
| Mountain T2 / Defensive | 3,989 / 38 | 918 | 610 / 610 | 1,256 | Sweep 1,228; Second Wind 28 |
| Desert T2 / Offensive | 2,272 / 136 | 583 | 348 / 343 | 1,209 | Sweep 720; Cleanse 266; Second Wind 223 |
| Desert T2 / Defensive | 6,108 / 354 | 1,326 | 692 / 665 | 2,313 | Sweep 1,601; Cleanse 505; Second Wind 207 |
| Mountain T4 / Offensive | 7,811 / 68 | 1,148 | 197 / 195 | 2,216 | Frenzy 631; Sweep 1,474; Second Wind 111 |
| Mountain T4 / Defensive | 6,527 / 51 | 992 | 159 / 153 | 1,879 | Frenzy 541; Sweep 1,276; Second Wind 62 |

Defensive's lower emitted player HP damage per 100 simulated seconds is the observed throughput cost, not a linear TTK conversion. Total output is not compared as a standalone success measure because Defensive survives longer in Desert and therefore has more exposure time.

## Primary body timing — Mountain T2

The primary body is Granite Titan. Values are clean per-seed medians in seconds; the outer value is the eligible cell median. `PD` marks a player-died run, `WC` a wall-ceiling run, `Q` a long-quiet row, and `I` no eligible clean body median. The T2 roots are shown as Striker and Squire.

| Node / root | Offensive 74017 | Offensive 76001 | Offensive 78007 | Offensive outer | Defensive 74017 | Defensive 76001 | Defensive 78007 | Defensive outer |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| node03 / Striker | 31.30 PD | 30.50 PD | 30.80 | 30.80 | 48.65 | 48.35 PD | 51.25 PD | 48.65 |
| node03 / Squire | 26.30 | 25.85 PD | 25.60 | 25.85 | 38.30 | I PD | 38.25 | 38.27 (n=2) |
| node05 / Striker | 28.40 | 27.50 | 28.15 | 28.15 | 42.00 | 43.20 | 42.55 | 42.55 |
| node05 / Squire | 22.50 | 22.25 | 22.25 | 22.25 | 32.25 | 31.10 | 30.20 | 31.10 |

Defensive lengthened the sampled Granite Titan body in all eight paired root/node comparisons, but Mountain T2 deaths remained 3/12 in each arm. The improved minimum-health and lower normalized incoming-damage signals are therefore a mitigation result, not proof that Defensive solves the retained Mountain pressure pattern.

## Primary body timing — Desert T2

Desert reports Sand Scorpion and Stone Basilisk separately because the packet defines both as controller bodies. The six Defensive Striker observations survive; the sparse Offensive Striker Sand Scorpion cells are marked with `*` where fewer than two clean seed medians remain.

### Sand Scorpion

| Node / root | Offensive 74017 | Offensive 76001 | Offensive 78007 | Offensive outer | Defensive 74017 | Defensive 76001 | Defensive 78007 | Defensive outer |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| node03 / Striker | I PD | 17.00 PD | I PD | 17.00 (n=1)* | 26.40 | 26.40 | 26.40 | 26.40 |
| node03 / Squire | 15.20 | 15.20 | 15.20 | 15.20 | 23.10 | 23.10 | 23.10 | 23.10 |
| node05 / Striker | 16.50 PD | 17.00 PD | I PD | 16.75 (n=2) | 26.40 | 26.40 | 26.40 | 26.40 |
| node05 / Squire | 15.20 | 16.15 | 15.20 | 15.20 | 23.10 | 23.10 | 23.10 | 23.10 |

### Stone Basilisk

| Node / root | Offensive 74017 | Offensive 76001 | Offensive 78007 | Offensive outer | Defensive 74017 | Defensive 76001 | Defensive 78007 | Defensive outer |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| node03 / Striker | 17.50 PD | 17.50 PD | 17.50 PD | 17.50 | 28.80 | 28.80 | 28.80 | 28.80 |
| node03 / Squire | 15.20 | 15.20 | 15.20 | 15.20 | 25.20 | 25.20 | 25.20 | 25.20 |
| node05 / Striker | 17.50 PD | 17.50 PD | 17.50 PD | 17.50 | 28.80 | 28.80 | 28.80 | 28.80 |
| node05 / Squire | 15.20 | 15.20 | 15.20 | 15.20 | 25.20 | 25.20 | 25.20 | 25.20 |

The robust five-root interpretation is represented here by the non-sparse cells: Defensive moves the sampled controller bodies from roughly 15.2–17.5s to 23.1–28.8s and eliminates the six sampled player deaths. The result is not a universal stance or controller winner: it is a two-class, two-node, three-seed bot-build interaction screen with a clear output and episode-duration cost.

## Primary body timing — Mountain T4

The packet-required T4 labels are shown as Striker/Maestro and Squire/Reverb. The primary body is Granite Mammoth. Sparse outer values are context only and are not used as a pooled decision statistic.

| Node / root | Offensive 74017 | Offensive 76001 | Offensive 78007 | Offensive outer | Defensive 74017 | Defensive 76001 | Defensive 78007 | Defensive outer |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| node03 / Striker / Maestro | 21.10 PD | 21.00 PD | 21.00 | 21.00 | 28.30 | I PD | I PD | 28.30 (n=1)* |
| node03 / Squire / Reverb | 60.30 | 61.70 | 60.20 | 60.30 | I | 83.00 WC Q | 82.25 | 82.25 (n=1)* |
| node05 / Striker / Maestro | 15.60 | 15.60 | 15.60 WC Q | 15.60 (n=2) | 21.20 PD | 21.55 | 21.60 | 21.55 |
| node05 / Squire / Reverb | 45.65 | 47.50 | 48.40 | 47.50 | 64.50 | 69.60 | 64.15 | 64.50 |

Defensive lengthens the available Granite Mammoth body where clean paired medians exist, but the T4 arm retains player deaths, a wall cutoff in each stance, long-quiet exposure, and a sparse node03 Defensive result for both Striker/Maestro and Squire/Reverb. The body tail is therefore not a clean T4 readiness result.

## Encounter duration and late-join shape

These are real recorded episode durations, not pooled body TTK. `Final members=2` counts cleared episodes whose final member set had two monsters. `Initial 1 → final 2` identifies the common late-join shape; it is not a simultaneous two-enemy spawn.

| Block / arm | Cleared episodes | All cleared median / max s | Final members=2 | Initial members=2 | Initial 1 → final 2 | Final-two median / max s |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Mountain T2 / Offensive | 324 | 5.3 / 37.5 | 23 | 0 | 23 | 27.6 / 37.5 |
| Mountain T2 / Defensive | 254 | 7.7 / 54.0 | 25 | 0 | 25 | 14.3 / 54.0 |
| Desert T2 / Offensive | 126 | 23.5 / 25.5 | 126 | 5 | 121 | 23.5 / 25.5 |
| Desert T2 / Defensive | 164 | 34.3 / 38.6 | 162 | 4 | 158 | 34.3 / 38.6 |
| Mountain T4 / Offensive | 337 | 9.0 / 76.7 | 39 | 3 | 36 | 14.2 / 54.6 |
| Mountain T4 / Defensive | 230 | 11.9 / 83.4 | 26 | 1 | 25 | 19.7 / 73.8 |

Desert is the clearest stance interaction: Defensive removes sampled player deaths but shifts the typical two-member episode from 23.5s to 34.3s and raises the per-100-second output cost. Mountain T4's longer Defensive tail coexists with deaths and a wall cutoff, so it cannot be treated as a solved encounter layer.

## Terminal death audit

Each table below lists every player-death observation in the packet. All listed death runs reached minimum HP 0. `Entry HP + barrier` is the last recorded player sample at or before the final damaging episode; `10s / 30s` is raw incoming monster HP damage in the window ending at the death. `P / 3+ / late / recov` is peak sampled pursuers / sampled seconds with at least three pursuers / all-run late joins / all-run recovery interruptions. The event cause and the incoming windows are descriptive; a killing blow is not treated as the sole causal source.

### Mountain T2 deaths

| Node / root / arm | Seed | Death | Kills before | Killer / ability label | Blow | Entry HP + barrier | Final episode s; members/late | Incoming 10s / 30s | P / 3+ / late / recov |
| --- | ---: | ---: | ---: | --- | ---: | ---: | ---: | ---: | --- |
| node03 / Squire / Defensive | 76001 | 52.3s | 1 | Stone Eagle / ordinary | 37 | 296 + 77 | 26.3; 3/2 | 271.00 / 576.00 | 3 / 5s / 2 / 0 |
| node03 / Squire / Offensive | 76001 | 538.6s | 35 | Stone Eagle / ordinary | 51 | 296 + 77 | 209.6; 16/15 | 284.00 / 494.40 | 2 / 0s / 16 / 9 |
| node03 / Striker / Defensive | 76001 | 383.0s | 13 | Granite Titan / ordinary | 50 | 267 + 46.58 | 14.9; 3/2 | 397.00 / 486.30 | 3 / 10s / 2 / 6 |
| node03 / Striker / Defensive | 78007 | 295.7s | 12 | Granite Titan / ordinary | 50 | 267 + 69 | 24.8; 2/1 | 265.00 / 566.00 | 2 / 0s / 3 / 2 |
| node03 / Striker / Offensive | 74017 | 107.3s | 5 | Granite Titan / ordinary | 65 | 267 + 34.50 | 14.7; 2/1 | 340.00 / 477.52 | 2 / 0s / 1 / 3 |
| node03 / Striker / Offensive | 76001 | 355.8s | 18 | Boulder Thrower / ordinary | 70 | 267 + 69 | 12.5; 3/2 | 409.00 / 462.02 | 3 / 4s / 2 / 9 |

Mountain T2 deaths are concentrated in node03. The Defensive arm does not remove the three Striker/Squire deaths in the 12-run block, although it changes the terminal pressure shape and reduces normalized incoming damage at block level.

### Desert T2 deaths

| Node / root / arm | Seed | Death | Kills before | Killer / ability label | Blow | Entry HP + barrier | Final episode s; members/late | Incoming 10s / 30s | P / 3+ / late / recov |
| --- | ---: | ---: | ---: | --- | ---: | ---: | ---: | ---: | --- |
| node03 / Striker / Offensive | 74017 | 47.3s | 2 | Sand Scorpion / Numbing Sting | 47 | 292 + 0 | 17.1; 2/1 | 315.39 / 646.39 | 2 / 0s / 2 / 0 |
| node03 / Striker / Offensive | 76001 | 154.8s | 8 | Sun Scarab / ordinary | 26 | 292 + 0 | 17.1; 2/0 | 342.98 / 613.98 | 2 / 0s / 4 / 0 |
| node03 / Striker / Offensive | 78007 | 53.7s | 2 | Sun Scarab / ordinary | 26 | 292 + 0 | 17.4; 2/1 | 336.27 / 607.27 | 2 / 0s / 2 / 0 |
| node05 / Striker / Offensive | 74017 | 223.2s | 12 | Sand Scorpion / Numbing Sting | 47 | 292 + 0 | 17.4; 2/1 | 335.78 / 606.78 | 2 / 0s / 6 / 0 |
| node05 / Striker / Offensive | 76001 | 154.8s | 8 | Sun Scarab / ordinary | 26 | 292 + 0 | 17.1; 2/0 | 342.98 / 613.98 | 2 / 0s / 4 / 0 |
| node05 / Striker / Offensive | 78007 | 53.8s | 2 | Sun Scarab / ordinary | 26 | 292 + 0 | 17.4; 2/1 | 336.27 / 581.27 | 2 / 0s / 2 / 0 |

There were no Desert Defensive deaths. The six Offensive Striker deaths include both ordinary Sun Scarab damage and Sand Scorpion Numbing Sting labels; the table preserves that distinction without declaring either label sufficient as a causal explanation by itself.

### Mountain T4 deaths

| Node / root / arm | Seed | Death | Kills before | Killer / ability label | Blow | Entry HP + barrier | Final episode s; members/late | Incoming 10s / 30s | P / 3+ / late / recov |
| --- | ---: | ---: | ---: | --- | ---: | ---: | ---: | ---: | --- |
| node03 / Striker / Maestro / Defensive | 76001 | 91.3s | 3 | Cliffside Roc / ordinary | 156 | 596 + 250 | 29.8; 2/1 | 1,004.00 / 1,823.00 | 2 / 0s / 2 / 0 |
| node03 / Striker / Maestro / Defensive | 78007 | 46.1s | 2 | Avalanche Tyrant / Avalanche Ram | 170 | 596 + 131.25 | 18.6; 2/1 | 866.00 / 1,325.00 | 2 / 0s / 2 / 1 |
| node03 / Striker / Maestro / Offensive | 74017 | 584.6s | 42 | Avalanche Tyrant / ordinary | 152 | 596 + 131.25 | 12.2; 2/1 | 931.25 / 1,274.25 | 2 / 0s / 6 / 24 |
| node03 / Striker / Maestro / Offensive | 76001 | 331.3s | 20 | Granite Mammoth / ordinary | 211 | 596 + 212.50 | 18.3; 2/1 | 791.00 / 1,577.25 | 2 / 0s / 4 / 10 |
| node05 / Striker / Maestro / Defensive | 74017 | 429.5s | 38 | Cliffside Roc / ordinary | 156 | 596 + 250 | 14.2; 2/1 | 1,051.00 / 1,228.00 | 2 / 0s / 6 / 25 |

The Mountain T4 deaths are all Striker/Maestro deaths. Defensive does not remove this T4 failure mode, and node03 Defensive has too few eligible clean Mammoth medians to make a stable body-TTK claim.

## Finite decision and remaining scope

| Location | Classification | Evidence-based conclusion |
| --- | --- | --- |
| Mountain T2 | **Partial mitigation with remaining pressure** | Defensive raises the minimum-HP center and lowers incoming HP damage, but deaths remain 3/12 in each arm. Retain the stance interaction as a situational tool; do not change the Mountain scalar or production monster values from this report. |
| Desert T2 | **Ordinary defensive tool sufficient in sampled cases** | Defensive survives all 12 observations without wall cutoff or long quiet, while moving controller timing and encounter duration upward. Retain as a situational template pending current-source regression; the throughput cost and controller tail remain part of the decision. |
| Mountain T4 | **Unresolved** | Defensive has 3 deaths, one wall cutoff, one long-quiet cutoff row, and sparse node03 body medians. Keep T4 timing and Striker/Maestro pressure visible; investigate final-episode ordinary/cast exposure before any package change. |

This packet does not authorize production adoption, a universal stance recommendation, a global tier change, automatic damage compensation, or another balance run. Keep the Durability27 Mountain T2 scalar and Desert controller-HP candidate provisional. Jungle and Trench evidence remain pending. Synthetic/restored-checkpoint artifacts are not canonical combat or economy evidence, and no live/browser proof was collected.

## Artifact index

| Artifact | Path |
| --- | --- |
| Operator packet | `C:/Users/osaif/Documents/Claude/Projects/MMO idle/docs/briefs/bot-balance-durability28-operator-packet.md` |
| Batch manifest | `C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability28-20260917/results/batch-manifest.json` |
| Batch end marker | `C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability28-20260917/results/batch-ended.json` |
| Operator exit | `C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability28-20260917/operator-exit.json` |
| Mountain T2 raw index | `C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability28-20260917/results/mountain2/index.json` |
| Mountain T2 audit | `C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability28-20260917/results/mountain2/night5-audit.json` |
| Desert T2 raw index | `C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability28-20260917/results/desert2/index.json` |
| Desert T2 audit | `C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability28-20260917/results/desert2/night5-audit.json` |
| Mountain T4 raw index | `C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability28-20260917/results/mountain4/index.json` |
| Mountain T4 audit | `C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability28-20260917/results/mountain4/night5-audit.json` |
| READY receipts | `C:/Users/osaif/AppData/Local/mmo-idle/validation/durability28` |
| Frozen detached source | `C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability28-20260917/source` |

## Planner review

Durability28 changes only stance for Striker/Squire across fixed T2 Mountain, T2 Desert, and T4 Mountain candidates. The experiment supports a narrow Desert T2 defensive template, shows only partial Mountain T2 mitigation, and leaves Mountain T4 Striker/Maestro pressure unresolved. The numeric Mountain scalar and Desert controller-HP candidates remain provisional, not shippable. No production adoption, extra run, commit, push, full certification, or live-playtest conclusion follows.

## Planner next decision

Retain Desert's numeric candidate plus a situational Defensive Striker template
for adoption review; no more Desert grid now. Mountain remains unresolved; test
attack-only relief with all six roots before changing HP again. Durability29 holds
Offensive stance and selected HP fixed in both arms, tests T2 Titan67->54 and T4
roster attack80%, and checks other classes for over-relief. No production adoption.
The phrase five-root interpretation above does not apply to this two-class screen.
