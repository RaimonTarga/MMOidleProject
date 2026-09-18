# Durability24 — Graveyard leader/escort durability and targeting

Date: 2026-09-17
Status: complete; sealed synthetic screen and read-only sample/event audit completed; no production balance edit authorized
Decision scope: Graveyard leader/escort HP redistribution, Focus Elites interaction, and T4 pacing guardrails

## Executive result

Durability24 executed the packet-defined four-arm matrix once and sequentially on the frozen checkout. The runner exited 0, all 56 cells and 168 observations were retained, verification passed, geometry and READY parity passed, and no retry, relaunch, adaptive build, source edit, balance edit, cap extension, service, commit, or push was introduced.

- Matrix: T4A six-root Graveyard 48 cells / 144 observations; T4B Slinger/Blunderbuss stress 8 cells / 24 observations; 56 cells / 168 observations total.
- Outcomes: 131 window-ended, 37 player-died, and 0 wall-ceiling observations. The two long-quiet runs were both T4A node03 Conduit control-normal runs and remain excluded from safety/headline interpretation.
- HP redistribution: doubling Gravewright HP and reducing the five escort HP values improved survival under normal targeting from 5/42 deaths to 0/42 and shortened escort body TTKs. It did not by itself clear the tier-pacing gate: the T4A Gravewright equal-weight root median was 7.925s control-normal versus 15.925s redistributed-normal.
- Targeting: Focus Elites was observable as an engaged-set preference. It emitted the Focus-source in 85.2–95.6% of eligible ordinary-plus-Gravewright samples, versus 0% in controls; Focus-source samples selected a live Gravewright 70.1–89.4% of the time. This is acquisition evidence, not a universal survival win.
- Focus interaction: control-focus produced 20/42 deaths and redistributed-focus produced 12/42. All T4A focused Spirit observations died in both HP packages, and focused Conduit remained terminally fragile. The combined HP-plus-universal-Focus policy is rejected as a general template; retain only as a constrained candidate for later review.
- T4B Blunderbuss remains a useful stress boundary. Redistributed-normal had 0/6 deaths and Gravewright medians of 26.10s / 30.50s at nodes 03 / 05; redistributed-focus had 1/6 death and 40.60s / 47.85s. These are not a tier-ladder certification.

Planner disposition: **adjust / retain the HP shape as a local Graveyard candidate under normal targeting**, with a later pacing and current-source regression gate; **reject the HP-plus-universal-Focus combination as a general policy**, while preserving its raw evidence and testing only constrained targeting/template variants if separately authorized. No value is adopted into production by this report.

## Frozen identity and execution

| Item | Value |
| --- | --- |
| Operator packet | [bot-balance-durability24-operator-packet.md](<C:/Users/osaif/Documents/Claude/Projects/MMO idle/docs/briefs/bot-balance-durability24-operator-packet.md>) |
| Frozen revision | d00215b48edeba90110a23f48acb3c9e364da2e6 |
| Frozen branch retained | codex/durability24-frozen |
| Frozen source tree | 31261e23f1b9f853941006e6cc68834e3aee939d |
| Definitions SHA-256 | a30458ee24ad7054c5389b1ed16d47f3435456c18feb34f72ded75c84b0828c0 |
| Hitboxes SHA-256 | 08bcc55633efe444d303c71977f7dcf87402157753af543e975e6c0c493afa83 |
| Hitbox source | C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json |
| Detached checkout | C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability24-20260917/source |
| Results root | C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability24-20260917/results |
| Readiness receipts | C:/Users/osaif/AppData/Local/mmo-idle/validation/durability24 |
| Trial / mode | durability24 / run |
| Seeds | 50021, 52009, 54001 |
| Matrix | 56 cells / 168 observations / 4 arms |
| Timestep / maximum | 100ms / 900 simulated seconds; first death |
| Synthetic / economy eligible | true / false |
| Batch start | 2026-09-17T12:05:54.249Z |
| Batch ended marker | 2026-09-17T12:26:03.182Z |
| Operator exit marker | 2026-09-17T12:26:03.2124532Z |
| Batch wall time | 1,208,933ms / 20m 8.9s |
| Graveyard ledger interval | 2026-09-17T12:05:54.251Z–2026-09-17T12:25:55.634Z / 1,201.383s |
| Runner exit | 0; one sequential run; no retry or relaunch |

The root was absent before launch. The revision, tree, definitions hash, and hitbox hash were checked before the detached checkout was created. Offline dependencies completed successfully. The detached source remained clean at the frozen revision after the run. Readiness receipts are setup evidence only; they are not balance evidence and their preparation metadata may name the parent commit.

The shared checkout was already dirty with unrelated user changes. Those changes were preserved. No full repository suite or live/browser playtest was run for this packet.

## Completion and retained evidence

`CN`, `CF`, `RN`, and `RF` mean control-normal, control-focus, redistributed-normal, and redistributed-focus. `WE/PD/WC` means window-ended / player-died / wall-ceiling observation outcomes. `K/U/R` means killed target records / unfinished target records / target records with observed HP regain. The `U` value is a target censor count, not a wall-ceiling run. `P/3+/LJ/LQ/B` means maximum player pursuers / sampled seconds with at least three pursuers / late joiners / long-quiet runs / blocked-approach samples.

| Profile / arm | Cells / runs | WE/PD/WC | K/U/R | Clean N | Pack median; solo / small / swarm | Min HP median / low | Recovery interruptions | P/3+/LJ/LQ/B | Simulated s / row wall s |
| --- | ---: | ---: | ---: | ---: | --- | ---: | ---: | --- | ---: |
| T4A CN | 12 / 36 | 35/1/0 | 4024/143/341 | 3770 | 5.00s; 4.225 / 10.80 / 59.95s | 60.3% / 0% | 127 | 10/4936/4061/2/0 | 31,553.5 / 297.94 |
| T4A CF | 12 / 36 | 22/14/0 | 3793/131/34 | 3781 | 4.425s; 3.925 / 12.90 / 28.30s | 30.8% / 0% | 173 | 8/6376/3376/0/0 | 21,792.3 / 201.97 |
| T4A RN | 12 / 36 | 36/0/0 | 5250/128/293 | 5012 | 3.40s; 2.575 / 8.60 / 47.05s | 75.4% / 35.1% | 147 | 9/4407/4998/0/0 | 32,400.0 / 306.93 |
| T4A RF | 12 / 36 | 25/11/0 | 5051/152/44 | 5025 | 3.00s; 3.10 / 8.05 / 26.30s | 44.6% / 0% | 170 | 7/6275/4466/0/0 | 26,000.1 / 260.30 |
| T4B CN | 2 / 6 | 2/4/0 | 344/25/0 | 344 | 7.25s; 7.15 / 15.10 / 59.90s | 0% / 0% | 5 | 6/1052/322/0/0 | 2,474.8 / 18.94 |
| T4B CF | 2 / 6 | 0/6/0 | 164/33/0 | 164 | 10.15s; 5.00 / — / 59.35s | 0% / 0% | 3 | 10/757/167/0/0 | 1,227.1 / 9.90 |
| T4B RN | 2 / 6 | 6/0/0 | 990/4/0 | 990 | 2.90s; 3.55 / — / 52.95s | 44.6% / 21.5% | 27 | 6/1502/716/0/0 | 5,400.0 / 40.13 |
| T4B RF | 2 / 6 | 5/1/0 | 934/14/0 | 934 | 2.90s; 3.475 / — / 49.20s | 33.2% / 0% | 23 | 8/1697/790/0/0 | 5,235.4 / 43.68 |
| Total | 56 / 168 | 131/37/0 | 20550/630/712 | 20020 | — | — | 675 | — | 126,083.2 / 1,179.78 |

There were no wall-ceiling runs and no blocked-approach samples. The two long-quiet rows were:

| Cell / seed | Outcome | Max quiet | Min HP | Peak pursuers | 3+ seconds | Late joiners |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| T4A node03 Conduit CN / 52009 | window-ended + long-quiet | 723.8s | 63.4% | 10 | 65 | 39 |
| T4A node03 Conduit CN / 54001 | window-ended + long-quiet | 134.8s | 59.7% | 7 | 101 | 81 |

Both rows were quiet survivors rather than runner failures. Their samples and target records remain retained, but their cell-level primary species summaries are inconclusive where fewer than two eligible seeds remain.

## Measurement rules and evidence boundary

The primary estimator is `night5-audit.json`: per-target clean body TTK medians are summarized per seed, then the outer median of eligible seed medians is reported per cell and species. Unfinished targets and targets with observed HP regain are excluded from clean TTK. Wall-ceiling and long-quiet runs are excluded from headline eligibility. Fewer than two eligible seeds is inconclusive; it is shown as `I`, never converted to zero. The equal-weight root summaries below first reduce each node/root cell to its eligible Gravewright median, then weight the six Night5A roots equally; T4B is shown separately and is not extra Slinger weight in that center.

Body TTK starts at the first damaging hit on the target and ends at the kill. The first-contact table is a separate onset proxy using the median simulated time from run start to the first damaging hit on a Gravewright identity; it is not a replacement for TTK and is not a pure travel-time measurement. Pack medians come from the analysis rows and are descriptive all-target body medians, not a class DPS ranking.

The run is synthetic, `economyEligible=false`, and has no live gameplay, farming, acquisition, service, progression, or player-feel implication. A player death can terminate a run and remove the player’s summons; Risen and follower kill events are therefore retained as event identities and are not treated as player-DPS measurements.

## READY setup and paired geometry

All 168 READY views were audited in 42 four-arm node/profile/seed groups. The explicit audit returned:

```text
readyCount 168
groups 42
geometryEqual 42
statsEqual 42
normalRosterEqual 42
redisRosterEqual 42
expectedHpTreatment 42
unexpectedRosterDiffs []
focusRuneBad []
```

Within every group, geometry, attack, plating, damage reduction, skills, gear, technique, guards, stance, and non-targeting combat state matched. Within each HP policy, roster hashes matched across normal/focus arms. The only declared process-local mob-stat difference was the five-species HP package below. Focus arms added exactly the legal `In Combat → Focus Elites` pair; controls did not add it. Focus targeting was owned by the runic priority layer and passed the packet’s ownership/RP checks.

### Prepared roots and actual authored ranges

The six Night5A roots used the Graveyard T4 armor/charm, Mountain boots, Tempered Core, Colossus Heart, +5 weapon/armor/charm/boots, 0 Core/Heart upgrades, Offensive stance, Sweep technique, Second Wind and Cleanse guards, and the packet’s root-specific movement/recovery rules. T4B reused the Slinger root with its separate `reload-balanced-t3-b` authored path and short-range Blunderbuss stress setup.

| Root / class | Frozen skill path | Weapon | Actual attack range |
| --- | --- | --- | ---: |
| cadence-root / Striker | cadence-root → cadence-balanced → cadence-range-close → cadence-balanced-t3-a | volcanic-eruption-lash | 12 |
| cooldown-root / Squire | cooldown-root → cooldown-balanced → cooldown-range-close → cooldown-balanced-t3-a | mountain-warmaul | 12 |
| dot-root / Apprentice | dot-root → dot-balanced → dot-range-mid → dot-balanced-t3-a | graveyard-plague-axe | 72 |
| reload-root / Slinger, T4A | reload-root → reload-balanced → reload-range-mid → reload-balanced-t3-a | jungle-deathfang-rapier | 132 |
| reload-root / Slinger, T4B | reload-root → reload-balanced → reload-range-mid → reload-balanced-t3-b | jungle-deathfang-rapier | 32 |
| summoner-root / Conduit | summoner-root → summoner-balanced → summoner-range-mid → summoner-balanced-t3-a | jungle-deathfang-rapier | 162 |
| energy-root / Spirit | energy-root → energy-balanced → energy-range-mid → energy-balanced-t3-a | volcanic-eruption-lash | 142 |

The six Night5A roots used the packet’s medium frame/native range nodes. The T4B authored short actual range is preserved and reported separately; its medium node choice is not a setup error.

### Actual HP package, including observed Risen values

| Species | Control base HP | Redistributed base HP | Observed Risen HP, control / redistributed |
| --- | ---: | ---: | ---: |
| Gravewright | 2851 | 5702 | 1996 / 3991 |
| Bone Crawler | 2059 | 1235 | 1441 / 865 |
| Plague Hound | 3168 | 1901 | 2218 / 1331 |
| Carrion Vulture | 2693 | 1616 | 1885 / 1131 |
| Bone Rat (`plague-rat`) | 1584 | 950 | 1109 / 665 |

The leader doubles and escorts are rounded to 40% less. The package is not total encounter-eHP neutral: resurrection, overkill, targeting, and time exposed to mechanics change the actual workload. The observed Risen values confirm that lower escort HP propagates into easier-to-kill resurrected followers; the Risen rows are not an independent balance edit.

## Primary Gravewright and pack timing

### All root rows

Each cell below is `Gravewright TTK / n` followed by the descriptive pack median. `n` is the number of eligible seeds for the Gravewright species estimator. `I` is inconclusive. T4B is the separate Slinger/Blunderbuss stress case.

| Node / root | CN: GW / pack | CF: GW / pack | RN: GW / pack | RF: GW / pack |
| --- | ---: | ---: | ---: | ---: |
| T4A 03 / Striker | 3.800s n3 / 2.70s | 6.100s n3 / 3.20s | 7.600s n3 / 1.60s | 9.200s n3 / 1.80s |
| T4A 03 / Squire | 16.800s n3 / 7.80s | 18.350s n3 / 8.20s | 24.500s n3 / 5.00s | 26.800s n3 / 6.00s |
| T4A 03 / Apprentice | 3.900s n3 / 3.40s | 16.400s n3 / 3.20s | 9.700s n3 / 3.00s | 16.900s n3 / 3.00s |
| T4A 03 / Slinger | 5.700s n3 / 4.40s | 10.300s n3 / 4.45s | 13.200s n3 / 2.00s | 18.100s n3 / 2.30s |
| T4A 03 / Conduit | I n1 / 6.20s | 11.200s n3 / 5.20s | 16.150s n3 / 3.80s | 14.550s n3 / 3.30s |
| T4A 03 / Spirit | 8.600s n3 / 4.70s | I n1 / 3.65s | 15.600s n3 / 3.80s | 16.200s n3 / 2.45s |
| T4A 05 / Striker | 5.400s n3 / 3.20s | 8.000s n3 / 3.90s | 10.300s n3 / 1.80s | 10.900s n3 / 2.30s |
| T4A 05 / Squire | 17.000s n3 / 10.90s | 25.200s n3 / 11.00s | 23.800s n3 / 5.40s | 32.000s n3 / 6.40s |
| T4A 05 / Apprentice | 4.900s n2 / 3.40s | 11.800s n3 / 3.60s | 9.000s n3 / 3.00s | 16.000s n3 / 3.00s |
| T4A 05 / Slinger | 7.900s n3 / 5.30s | 13.450s n3 / 5.35s | 12.800s n3 / 2.80s | 24.100s n3 / 3.30s |
| T4A 05 / Conduit | 9.950s n3 / 8.30s | 10.050s n2 / 7.70s | 24.100s n3 / 4.20s | 17.525s n2 / 4.05s |
| T4A 05 / Spirit | 9.500s n3 / 7.95s | I n1 / 4.40s | 22.100s n3 / 4.20s | 20.700s n2 / 2.95s |
| T4B 03 / Slinger | 26.825s n2 / 5.80s | 45.675s n2 / 8.70s | 26.100s n3 / 2.90s | 40.600s n3 / 2.90s |
| T4B 05 / Slinger | 40.275s n2 / 8.70s | 60.900s n3 / 11.60s | 30.500s n3 / 2.90s | 47.850s n3 / 2.90s |

### Equal-weight Gravewright summaries and separate paired effects

For T4A, each root value is the median of its eligible node03/node05 cell medians, followed by an equal-weight median over the six roots. The Conduit CN root has only node05 eligible; CF Spirit has no eligible root value because both of its cells are one-seed inconclusive.

| Arm | Striker | Squire | Apprentice | Slinger | Conduit | Spirit | Equal-weight root median |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| CN | 4.600s | 16.900s | 4.400s | 6.800s | 9.950s (1/2) | 9.050s | 7.925s (6/6) |
| CF | 7.050s | 21.775s | 14.100s | 11.875s | 10.625s | I | 11.875s (5/6) |
| RN | 8.950s | 24.150s | 9.350s | 13.000s | 20.125s | 18.850s | 15.925s (6/6) |
| RF | 10.050s | 29.400s | 16.450s | 21.100s | 16.0375s | 18.450s | 17.450s (6/6) |

The packet-required paired effects, computed separately on matched root summaries, are:

| Effect | Equal-weight median delta | Paired roots | Interpretation |
| --- | ---: | ---: | --- |
| RN − CN | +6.725s | 6/6 | HP redistribution lengthened the durable leader while making escorts easier to clear; this is a role-shape result, not total-eHP neutrality. |
| RF − CF | +5.4125s | 5/6 | The same HP package lengthened the focused leader among paired roots; Spirit CF is inconclusive. |
| CF − CN | +4.875s | 5/6 | Focus Elites increased Gravewright body TTK in the paired focused/control roots, with Spirit unavailable. |
| RF − RN | +3.175s | 6/6 | Focus increased the redistributed leader median across roots, while terminal exposure remained materially higher. |

Cell-level Gravewright deltas keep node and specialization visible. `I` means one of the paired cells was inconclusive.

| Node / root | RN − CN | RF − CF | CF − CN | RF − RN |
| --- | ---: | ---: | ---: | ---: |
| T4A 03 / Striker | +3.800s | +3.100s | +2.300s | +1.600s |
| T4A 03 / Squire | +7.700s | +8.450s | +1.550s | +2.300s |
| T4A 03 / Apprentice | +5.800s | +0.500s | +12.500s | +7.200s |
| T4A 03 / Slinger | +7.500s | +7.800s | +4.600s | +4.900s |
| T4A 03 / Conduit | I | +3.350s | I | −1.600s |
| T4A 03 / Spirit | +7.000s | I | I | +0.600s |
| T4A 05 / Striker | +4.900s | +2.900s | +2.600s | +0.600s |
| T4A 05 / Squire | +6.800s | +6.800s | +8.200s | +8.200s |
| T4A 05 / Apprentice | +4.100s | +4.200s | +6.900s | +7.000s |
| T4A 05 / Slinger | +4.900s | +10.650s | +5.550s | +11.300s |
| T4A 05 / Conduit | +14.150s | +7.475s | +0.100s | −6.575s |
| T4A 05 / Spirit | +12.600s | I | I | −1.400s |
| T4B 03 / Slinger | −0.725s | −5.075s | +18.850s | +14.500s |
| T4B 05 / Slinger | −9.775s | −13.050s | +20.625s | +17.350s |

The T4B control arms have terminal deaths and only two or three eligible seeds, so their deltas are stress-case evidence rather than a center estimate.

### Escort species timing

These are equal-weight medians across eligible cells for the species. The parenthetical value is eligible cells / possible cells. Inconclusive species cells remain visible in the raw audit and are not included in the median.

#### T4A Night5A roots

| Arm | Gravewright | Bone Crawler | Plague Hound | Carrion Vulture | Bone Rat |
| --- | ---: | ---: | ---: | ---: | ---: |
| CN | 7.900s (11/12) | 4.550s (11/12) | 6.700s (11/12) | 5.300s (11/12) | 3.500s (11/12) |
| CF | 11.500s (10/12) | 4.025s (12/12) | 6.225s (12/12) | 5.175s (10/12) | 3.2125s (12/12) |
| RN | 14.400s (12/12) | 3.200s (12/12) | 4.050s (12/12) | 3.500s (12/12) | 2.200s (12/12) |
| RF | 17.2125s (12/12) | 2.475s (12/12) | 3.850s (12/12) | 3.600s (12/12) | 1.9625s (12/12) |

#### T4B Slinger/Blunderbuss stress case

| Arm | Gravewright | Bone Crawler | Plague Hound | Carrion Vulture | Bone Rat |
| --- | ---: | ---: | ---: | ---: | ---: |
| CN | 33.550s (2/2) | 5.800s (2/2) | 7.250s (2/2) | 7.250s (2/2) | 4.350s (2/2) |
| CF | 53.2875s (2/2) | 8.700s (2/2) | 8.025s (2/2) | 36.250s (1/2, I) | 3.9875s (2/2) |
| RN | 28.300s (2/2) | 2.900s (2/2) | 4.350s (2/2) | 3.625s (2/2) | 1.450s (2/2) |
| RF | 44.225s (2/2) | 2.900s (2/2) | 4.350s (2/2) | 2.900s (2/2) | 1.450s (2/2) |

The fastest eligible species results were the RN and RF T4B Bone Rat rows at 0.000s in the node03/node05 per-cell audit, followed by T4A node03 RN Bone Rat at 0.900s. The 0.000s value is a valid one-hit window, not missing data. The slowest eligible results were T4B node05 CF Gravewright at 60.900s, T4B node05 RF Gravewright at 47.850s, T4B node03 RF Gravewright at 40.600s, T4B node05 CN Gravewright at 40.275s, and T4B node03 CF Gravewright at 45.675s; these stress rows are shown separately from the six-root center.

### First damaging hit / contact onset

The values below are the outer medians of per-seed medians of Gravewright first-damage time from run start, after the same inconclusive exclusion. They expose approach/engagement onset separately from body TTK.

| Profile / arm | Median first damaging hit | Eligible cells |
| --- | ---: | ---: |
| T4A CN | 449.200s | 11/12 |
| T4A CF | 385.000s | 10/12 |
| T4A RN | 480.800s | 12/12 |
| T4A RF | 382.050s | 12/12 |
| T4B CN | 307.000s | 2/2 |
| T4B CF | 82.750s | 2/2 |
| T4B RN | 451.650s | 2/2 |
| T4B RF | 389.075s | 2/2 |

The large onset values are expected for this sequential roaming/engagement screen and should not be read as a Gravewright body-duration result. Focus can bring the selected target into the engaged set earlier, but first-contact timing is exposure-sensitive and is not proof of cross-node acquisition.

## Root pressure, survival, and pack workload

The following rows keep every specialization and node visible. Each arm cell is `WE/PD; min HP median/low; K/U/R; recovery interruptions`. All cells had WC=0. The target K/U/R values are the pack analysis ledger and should not be pooled as a DPS score.

| Node / root | CN | CF | RN | RF |
| --- | --- | --- | --- | --- |
| T4A 03 / Striker | 3/0; 67.6%/48.2%; 625/13/0; R8 | 3/0; 57.1%/53.3%; 595/10/0; R30 | 3/0; 75.1%/71.9%; 719/17/0; R9 | 3/0; 57.4%/56.0%; 689/19/0; R5 |
| T4A 03 / Squire | 3/0; 74.7%/74.7%; 342/4/0; R43 | 3/0; 74.4%/73.8%; 357/19/0; R5 | 3/0; 77.1%/76.3%; 392/8/0; R41 | 3/0; 73.8%/68.6%; 428/38/0; R2 |
| T4A 03 / Apprentice | 3/0; 60.6%/59.9%; 418/10/27; R4 | 3/0; 31.0%/22.8%; 510/4/0; R17 | 3/0; 59.6%/35.1%; 430/6/24; R2 | 3/0; 42.4%/39.0%; 546/10/0; R3 |
| T4A 03 / Slinger | 3/0; 70.9%/57.4%; 392/19/68; R5 | 2/1; 34.1%/0%; 419/6/1; R17 | 3/0; 74.2%/56.7%; 494/15/60; R0 | 3/0; 53.3%/52.2%; 585/3/0; R21 |
| T4A 03 / Conduit | 3/0; 61.9%/59.7%; 177/14/38; R0 | 1/2; 0%/0%; 199/16/21; R1 | 3/0; 72.4%/64.3%; 329/8/52; R0 | 1/2; 0%/0%; 345/19/26; R0 |
| T4A 03 / Spirit | 3/0; 53.5%/52.1%; 251/18/41; R15 | 0/3; 0%/0%; 44/6/0; R9 | 3/0; 55.4%/51.7%; 368/12/25; R2 | 0/3; 0%/0%; 308/7/1; R57 |
| T4A 05 / Striker | 3/0; 56.8%/48.6%; 554/9/0; R12 | 3/0; 53.7%/47.7%; 548/9/0; R52 | 3/0; 71.6%/66.9%; 662/18/0; R13 | 3/0; 45.4%/43.8%; 627/10/0; R52 |
| T4A 05 / Squire | 3/0; 74.8%/72.7%; 256/6/0; R18 | 3/0; 74.8%/71.7%; 304/19/0; R2 | 3/0; 79.3%/76.8%; 328/6/0; R48 | 3/0; 74.7%/74.3%; 346/22/0; R1 |
| T4A 05 / Apprentice | 2/1; 75.8%/0%; 261/8/24; R5 | 3/0; 30.2%/16.8%; 504/9/0; R13 | 3/0; 83.1%/78.7%; 425/9/25; R4 | 3/0; 54.2%/37.1%; 506/2/0; R7 |
| T4A 05 / Slinger | 3/0; 78.0%/51.3%; 336/12/54; R0 | 1/2; 0%/0%; 201/7/0; R13 | 3/0; 75.3%/59.8%; 409/7/43; R0 | 2/1; 43.6%/0%; 364/5/0; R12 |
| T4A 05 / Conduit | 3/0; 56.4%/41.3%; 196/17/47; R3 | 0/3; 0%/0%; 84/17/12; R0 | 3/0; 75.5%/56.7%; 267/14/39; R0 | 1/2; 0%/0%; 239/12/17; R0 |
| T4A 05 / Spirit | 3/0; 55.6%/12.3%; 216/13/42; R14 | 0/3; 0%/0%; 28/9/0; R14 | 3/0; 53.5%/51.4%; 427/8/25; R28 | 0/3; 0%/0%; 68/5/0; R10 |
| T4B 03 / Slinger | 1/2; 0%/0%; 182/12/0; R2 | 0/3; 0%/0%; 62/21/0; R1 | 3/0; 39.5%/21.5%; 545/1/0; R8 | 3/0; 51.2%/27.9%; 531/4/0; R9 |
| T4B 05 / Slinger | 1/2; 0%/0%; 162/13/0; R3 | 0/3; 0%/0%; 102/12/0; R2 | 3/0; 52.7%/28.9%; 445/3/0; R19 | 2/1; 7.0%/0%; 403/10/0; R14 |

The normal HP effect is clearest in the survival rows: T4A RN completed every run, while T4A CN had one death and the T4B stress comparison moved from 4/6 CN deaths to 0/6 RN deaths. Focus arms trade target access for pressure: CF and RF have more terminal rows, lower minimum HP, and more recovery interruption in the fragile Conduit/Spirit paths. No class is selected as a universal average.

## Targeting samples

The selector audit uses one-second samples. An opportunity exists when a live Gravewright and at least one live ordinary monster are present. `GW selected` reads `selectedTargetId`; `Focus source` reads `autoIntent.source === "Focus Elites"`; `Focus + GW` is the subset of Focus-source samples that also selected a live Gravewright. This is a sampled proxy, not an exact per-tick target-history reconstruction.

| Profile / node | CN opportunity / GW selected | CF opportunity / Focus source / GW selected / Focus+GW | RN opportunity / GW selected | RF opportunity / Focus source / GW selected / Focus+GW |
| --- | --- | --- | --- | --- |
| T4A / 03 | 16,200 / 1,743 (10.8%) | 9,854 / 8,451 (85.8%) / 6,191 (62.8%) / 5,927 (70.1%) | 16,123 / 3,471 (21.5%) | 12,443 / 10,645 (85.6%) / 8,838 (71.0%) / 8,477 (79.6%) |
| T4A / 05 | 15,354 / 1,729 (11.3%) | 9,122 / 7,824 (85.8%) / 5,779 (63.4%) / 5,515 (70.5%) | 16,189 / 3,592 (22.2%) | 10,163 / 8,661 (85.2%) / 7,267 (71.5%) / 6,945 (80.2%) |
| T4B / 03 | 1,179 / 92 (7.8%) | 402 / 378 (94.0%) / 344 (85.6%) / 338 (89.4%) | 2,700 / 747 (27.7%) | 2,631 / 2,491 (94.7%) / 2,235 (84.9%) / 2,221 (89.2%) |
| T4B / 05 | 1,298 / 146 (11.2%) | 812 / 776 (95.6%) / 688 (84.7%) / 679 (87.5%) | 2,700 / 736 (27.3%) | 2,270 / 2,120 (93.4%) / 1,823 (80.3%) / 1,807 (85.2%) |

Controls emitted no Focus-source samples. The candidate selector is therefore real and owned by the intended rune path, but it is not perfect: some samples still selected ordinary targets, and opportunities end earlier when a target is removed from the live set. The higher normal-arm Gravewright-selection percentages in RN/RF are exposure to the candidate’s different kill order, not evidence of a universal acquisition rate.

## Raise Dead, Risen activity, DoT exposure, and recovery

Raise counts are event identities. Risen kills count explicit kill events whose victim name was Risen; they are not an estimate of every spawn or active Risen body. Hound DoT is all event `damageType=dot` damage from the original/Risen Plague Hound and their Death Pool sources. Hound Plague reached a maximum of five stacks in every arm group.

| Profile / arm | Simulated s | Deaths | Raise starts / fired | Original follower kills | Risen kill events | Gravewright kills | Hound DoT HP | Raise / 100s | Follower kills / 100s |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| T4A CN | 31,553.5 | 1 | 553 / 524 | 3318 | 437 | 373 | 142396.00 | 1.75 | 10.52 |
| T4A CF | 21,792.3 | 14 | 906 / 827 | 2681 | 766 | 433 | 134763.00 | 4.16 | 12.30 |
| T4A RN | 32,400.0 | 0 | 860 / 824 | 4169 | 714 | 480 | 61808.25 | 2.65 | 12.87 |
| T4A RF | 26,000.1 | 11 | 1360 / 1314 | 3401 | 1222 | 530 | 107641.00 | 5.23 | 13.08 |
| T4B CN | 2,474.8 | 4 | 150 / 148 | 380 | 242 | 34 | 10670.00 | 6.06 | 15.35 |
| T4B CF | 1,227.1 | 6 | 90 / 90 | 145 | 145 | 28 | 5422.00 | 7.33 | 11.82 |
| T4B RN | 5,400.0 | 0 | 440 / 439 | 902 | 848 | 134 | 9512.00 | 8.15 | 16.70 |
| T4B RF | 5,235.4 | 1 | 431 / 425 | 835 | 824 | 140 | 12850.00 | 8.23 | 15.95 |

The normal T4A comparison shows the intended turnover mechanism: RN had more original follower kills per simulated time than CN (12.87 versus 10.52), more Raise starts per time (2.65 versus 1.75), and more Risen kills per time (2.20 versus 1.38), even though the lower-HP arm completed every run. The focused comparison moves in the same direction for Raise and Risen activity (CF → RF: 4.16 → 5.23 Raise starts/100s; 3.52 → 4.70 Risen kills/100s), but terminal deaths make exposure unequal. Lower Risen escort HP is therefore supported by the event stream, not assumed.

Total Hound DoT was lower in RN than CN (190.77 versus 451.28 HP/100 simulated seconds) and lower in RF than CF (414.00 versus 618.40 HP/100 seconds) in T4A. The death causes below are mixed Hound DoT, melee, and Gravewright ranged exposure. This does not support a general DoT nerf.

## Player-death review and pre-death windows

All 37 player deaths are retained. The table groups event-supported causes and reports median simulated death time, kills before death, and incoming HP damage in the 10-second and 30-second windows ending at the death tick. Incoming window totals include direct, DoT, and debt damage; they are not a causal counterfactual.

| Event-supported cause | Deaths | Median time | Median kills before death | Median incoming: 10s / 30s |
| --- | ---: | ---: | ---: | ---: |
| Gravewright ranged | 5 | 90.7s | 16 | 1247.68 / 1711.12 |
| Plague Hound Hound Plague | 11 | 139.4s | 32 | 1226.84 / 1507.36 |
| Bone Crawler melee | 8 | 173.95s | 30 | 1219.34 / 1556.58 |
| Risen Plague Hound Hound Plague | 5 | 96.9s | 26 | 1237.92 / 2371.04 |
| Plague Hound melee | 3 | 248.4s | 42 | 1158.48 / 1657.68 |
| Plague Hound Death Pool | 1 | 49.1s | 6 | 1262.04 / 1997.64 |
| Risen Bone Crawler melee | 2 | 191.95s | 40.5 | 1203.68 / 2635.26 |
| Risen Plague Hound melee | 2 | 415.85s | 123 | 1212.74 / 2378.92 |
| Total | 37 | — | — | — |

Representative terminal cases include:

- The earliest recorded death was T4A node05 Conduit RF / seed 50021 at 49.1s: six kills before a Plague Hound Death Pool tick at one stack. The final 10s contained 1262.04 incoming HP damage, including 701 DoT.
- T4A node03 Spirit CF / seed 50021 died at 38.0s to a Risen Plague Hound Hound Plague tick at two stacks after seven kills. This is one of the focused Spirit terminal rows, not evidence of a universal Hound-only defect.
- T4A node03 Conduit CF / seed 50021 died at 184.5s to a Gravewright ranged hit after 25 kills; the final 10s contained 1247.68 incoming HP damage and the final 30s contained 2795.20.
- T4B node05 Slinger RF / seed 54001 died at 735.4s to a Risen Plague Hound melee hit after 224 kills. The late terminal row had 1166.76 incoming HP damage in the final 10s and 2386.32 in the final 30s.

The samples show peak pursuers up to 10 and substantial three-plus-pursuer exposure, but there were zero blocked-approach samples. The two long-quiet CN Conduit rows are position/pursuit hypotheses worth preserving for a future bounded review; the event-supported death causes above do not prove that position caused any death. Focus-source selection also cannot be used to infer cross-node acquisition. No universal class, range, pursuit, Gravewright ranged, or Hound DoT change is justified by this screen.

## Tier pacing guardrail and finite next decision

The target is a rising TTK by tier, with a sharper rise for low-density elite encounters, while followers remain quick to dispatch. The six-root T4A Gravewright center rises from 7.925s CN to 15.925s RN and 17.450s RF, but remains far below the 40–60s mini-boss band used for the Trench goal. T4B’s separate Blunderbuss stress case reaches 33.550s CN, 53.2875s CF, 28.300s RN, and 44.225s RF on the all-cell species summary, with node05 CF at 60.900s. The stress case is useful evidence that the leader/escort shape can approach the intended boundary, not proof that the T4 tier ladder is calibrated.

Followers remain substantially quicker than leaders in every eligible T4A species summary: redistributed escorts fall to 1.9625–4.050s in RF while Gravewright is 17.2125s. Pack swarm medians remain pressure-sensitive, ranging from 26.30s to 59.95s in T4A and 49.20–59.90s in T4B. Survival alone does not meet the pacing gate.

The finite work map remains:

| Area | Disposition after Durability24 | Remaining use |
| --- | --- | --- |
| Desert, Mountain, Tundra, Trench | Retain the 14 Durability22 HP candidates | Consolidated current-source patch review with fixed-defense and long-tail guardrails; do not rerun here |
| Volcanic | Retain the two Durability23 local Volcano HP anchors | Consolidated mob review with Heat/Burn guard; no blanket attack/DoT change |
| Graveyard | Retain this leader-double / escort-0.6x shape as a normal-targeting candidate; reject universal Focus pairing | Current-source regression, tier-appropriate pacing check, and narrowly scoped targeting/pursuit review if separately authorized |
| Jungle | Pending performance/durability investigation | Named bounded investigation before the initial mob pass is called complete |

The selected 16 other candidates are retained: 14 Durability22 candidates plus the two Durability23 Volcano anchor candidates. A focused tier-ladder regression is still required before the initial mob pass can be declared complete. It must compare equivalent prepared build philosophies, role-matched encounters, appropriate tier gear, and one consistent source snapshot. Existing mixed-tier and mixed-revision medians are context, not matched certification. No campaign rerun is warranted for this report.

## Adopt / adjust / reject

| Targeting policy | Graveyard package disposition | Reason and exact boundary |
| --- | --- | --- |
| Normal targeting | **ADJUST / retain as a local candidate** | The exact 2x Gravewright and rounded 0.6x escort package produced 0/42 redistributed-normal deaths versus 5/42 control-normal and made escorts faster. It still misses the T4A 40–60s leader pacing goal, has a 35.1% minimum-HP tail in T4A RN, and is synthetic-only. Carry the shape into consolidated review; do not ship these values. |
| Focus targeting | **REJECT as a universal combination; retain for constrained review only** | Redistributed-focus improved survival relative to control-focus (12/42 versus 20/42 deaths) but remained terminally unsafe, including all six focused T4A Spirit observations and four focused Conduit deaths. Focus Elites is a real acquisition option, but the package plus universal focus is not a general-purpose balance solution. |

No class-global winner is selected. No Gravewright, escort, Risen, Hound, DoT, range, pursuit, class, item, technique, rune, economy, or player-facing value is adopted from this report.

## No production adoption

No production source, mob definition, class, item, ability, rune, economy, or player-facing balance value was edited or adopted. The HP mapping and Focus Elites results are process-local experiment evidence. Readiness pilots, synthetic kills, Risen activity, timing medians, and selector samples are not live gameplay proof. No further experiment, cap extension, campaign rerun, or invited-playtest readiness claim follows from this packet.

The shared worktree’s unrelated user changes were preserved. Only this report and its documentation index entry are intended deliverables from the reporting stage.

## Raw artifacts

- [Durability24 operator packet](<C:/Users/osaif/Documents/Claude/Projects/MMO idle/docs/briefs/bot-balance-durability24-operator-packet.md>)
- [batch manifest](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability24-20260917/results/batch-manifest.json>)
- [batch ended marker](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability24-20260917/results/batch-ended.json>)
- [operator exit marker](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability24-20260917/operator-exit.json>)
- [operator ledger](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability24-20260917/results/operator-ledger.jsonl>)
- [results root](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability24-20260917/results>)
- [Graveyard manifest](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability24-20260917/results/graveyard/manifest.json>)
- [Graveyard index](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability24-20260917/results/graveyard/index.json>)
- [Graveyard analysis](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability24-20260917/results/graveyard/analysis.json>) and [analysis markdown](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability24-20260917/results/graveyard/analysis.md>)
- [Graveyard Night5 audit](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability24-20260917/results/graveyard/night5-audit.json>)
- [Graveyard verification](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability24-20260917/results/graveyard/verification.json>)
- [Graveyard complete marker](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability24-20260917/results/graveyard/complete.json>)
- [detached frozen source checkout](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability24-20260917/source>)
- [Durability24 readiness receipts](<C:/Users/osaif/AppData/Local/mmo-idle/validation/durability24>)
- [hitbox input](<C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json>)

The raw result tree contains the manifest, index, analysis, audit, verification, complete marker, per-run summaries, event streams, sample streams, and 168 run records. This report is an interpretation layer; raw artifacts remain authoritative.

Report generated from the packet-defined frozen results and read-only raw-event/sample audit. No production source or balance data was edited by the experiment.

## Planner review correction

The 40–60s mini-boss target applies to all three Trench species, not Gravewright.
The report's normal-targeting disposition must not be read as failure against an
agreed Gravewright 40–60s target. Retain the exact redistributed-normal HP package
for adoption review based on 0/42 deaths, improved leader/escort shape and reduced
Hound pressure; do not adopt universal Focus Elites. No production change follows.
The columns labelled pack median are described above as all-target body medians;
use raw encounter episodes for actual pack-clear duration in subsequent reports.
Durability25 addresses the remaining tier-pacing question with a bounded
Mountain/Desert T2–T4 comparison, not another Graveyard targeting grid.
