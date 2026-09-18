# Durability29 — Mountain pressure relief with retained durability

Date: 2026-09-17  
Status: complete; sealed synthetic screen audited; no production balance edit authorized  
Decision scope: whether the declared Mountain attack-only overlay reduces systematic pressure while retaining body pacing and role identity

## Executive result

Durability29 executed once and sequentially on the frozen checkout. The runner exited 0. Both blocks verified all 72 observations: 48 cells / 144 observations total, 120 window-ended observations, 20 player deaths, and 4 wall-ceiling observations. No retry, relaunch, adaptive change, source edit, balance edit, cap extension, service, commit, or push was introduced.

- **Mountain T2 — adjust/hold, not final adoption:** the Titan overlay reduced total deaths from 10/36 to 5/36 and incoming HP damage from 205.76 to 191.47 per 100 simulated seconds. It did not materially move Granite Titan body timing, but Striker still had 3/6 deaths in the candidate arm and both Conduit arms retained the same wall ceiling. The overlay is useful evidence, not a production scalar.
- **Mountain T4 — retain as an adoption candidate for current-source regression:** the selected attack overlay reduced deaths from 4/36 to 1/36, removed both control wall ceilings, raised the minimum-HP median from 42.63% to 60.21%, and lowered incoming HP damage from 599.76 to 485.90 per 100 simulated seconds. Body TTK did not rise systematically. One node03 Striker candidate death and longer candidate tails remain visible.
- **Pacing remained a separate measure:** attack reduction did not inflate clean body medians. Encounter chains changed: T4 candidate final-two-member episode median was 23.6s versus 32.0s in control, while the maximum candidate tail reached 573.5s. These are episode/pull-path observations, not pooled target DPS.
- **Causal guard passed:** all 72 fresh same-seed control/candidate pairs had identical READY player views, monster rosters, roster hashes, geometry hashes, and non-attack monster stats. Runtime attack values changed only for Granite Titan in T2 and Granite Mammoth, Cragback Rhino, Cliffside Roc, and Avalanche Tyrant in T4. T4 Granite Barrier capacity stayed 345 on node03 and 288 on node05 in both arms.

No production adoption, universal attack rule, global tier change, further run, live/economy conclusion, or invited-playtest claim follows from this packet.

## Frozen identity and execution

| Field | Value |
| --- | --- |
| Revision | 699122f65a583f5b828e1b32753d5065e1ac607a |
| Frozen branch | codex/durability29-frozen |
| Source tree | c7f43c8bdaf93415c92ebd87b2e7ad397324d33e |
| Definitions hash | a30458ee24ad7054c5389b1ed16d47f3435456c18feb34f72ded75c84b0828c0 |
| Hitbox hash | 08bcc55633efe444d303c71977f7dcf87402157753af543e975e6c0c493afa83 |
| Blocks | Mountain T2 and Mountain T4 |
| Matrix | 24 cells / 72 observations per block; 48 cells / 144 observations total |
| Roots | Striker, Squire, Apprentice, Slinger, Conduit, Spirit |
| Nodes | 03 and 05 |
| Seeds | 80021, 82003, 84011 |
| Arms | Offensive stance control / declared monster-attack candidate |
| Timestep / maximum | 100ms / 600 simulated seconds or first death |
| Synthetic / economy eligible | true / false |
| Batch start | 2026-09-17T17:55:48.167Z |
| Batch end marker | 2026-09-17T18:39:10.981Z |
| Operator exit marker | 2026-09-17T18:39:11.0130776Z; exit 0 |
| Batch wall time | 2,602,814ms / 43m 23s |
| Detached source | C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability29-20260917/source |
| Results root | C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability29-20260917/results |
| READY receipts | C:/Users/osaif/AppData/Local/mmo-idle/validation/durability29 |

The detached source remained clean at the frozen revision. The shared checkout was already dirty with unrelated user changes; those changes were preserved. This report and its README index entry are the only intended shared-checkout edits for this packet. No production files were changed. No full repository suite or live/browser playtest was run.

## Treatment and runtime rounding

The control retained the selected Mountain packages. The candidate changed only the declared base attacks:

| Tier | Species | Declared control | Declared candidate | READY runtime control | READY runtime candidate |
| --- | --- | ---: | ---: | ---: | ---: |
| T2 | Granite Titan | 67 | 54 | 80 | 65 |
| T4 | Granite Mammoth | 184 | 147 | 258 | 206 |
| T4 | Cragback Rhino | 113 | 90 | 158 | 126 |
| T4 | Cliffside Roc | 179 | 143 | 251 | 200 |
| T4 | Avalanche Tyrant | 145 | 116 | 203 | 162 |

The runtime values are the authoritative post-node-modifier values. All unchanged species retained their control values: T2 Stone Eagle 72 and Boulder Thrower 86; no T4 species outside the four declared types changed.

## Block-level raw ledger

WE/PD/WC means window-ended at 600 simulated seconds / player-died / wall-ceiling. K/U/R means target records with a kill / unfinished target record / observed target HP regain. Clean is the target-record count accepted by the packet audit. Incoming HP damage is monster-to-player damage.hpDamage after player barrier absorption; absorbed barrier damage is reported separately. Player output is player-to-monster damage.hpDamage. Rates are normalized by total simulated exposure, not pooled kills.

| Block / arm | Runs | WE/PD/WC | Targets K/U/R; clean | Min HP median / low | Min barrier median / low | Incoming HP | Incoming / 100 sim s | Player HP damage | Player / 100 sim s | Recovery | Late joins | 3+ pursuer seconds | Peak P median | Q | Final-two median / max s |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Mountain T2 / control | 36 | 25/10/1 | 1185/26/15; 1176 | 40.39% / 0% | 0 / 0 | 35,857.62 | 205.76 | 838,720 | 4,812.90 | 269 | 238 | 18s | 2 | 1 | 18.1 / 160.6 |
| Mountain T2 / candidate | 36 | 30/5/1 | 1332/28/21; 1318 | 41.87% / 0% | 0 / 0 | 37,458.20 | 191.47 | 952,937 | 4,870.94 | 285 | 304 | 23s | 2 | 0 | 18.3 / 362.9 |
| Mountain T4 / control | 36 | 30/4/2 | 1153/78/85; 1113 | 42.63% / 0% | 0 / 0 | 119,607.47 | 599.76 | 7,150,953 | 35,858.04 | 291 | 585 | 40s | 2 | 3 | 32.0 / 460.0 |
| Mountain T4 / candidate | 36 | 35/1/0 | 1273/77/117; 1209 | 60.21% / 0% | 0 / 0 | 103,038.06 | 485.90 | 7,892,899 | 37,220.47 | 306 | 708 | 45s | 2 | 1 | 23.6 / 573.5 |

The minimum sampled player barrier reached zero in all 36 T2 control runs, 35/36 T2 candidate runs, all 36 T4 control runs, and 33/36 T4 candidate runs. The nonzero candidate minima were 10 in one T2 run and 19 in three T4 runs; a zero minimum barrier is therefore not itself a death finding.

Confirmed cast-associated incoming damage was sparse in the raw schema: T2 control 12 events / 304 damage, T2 candidate 9 / 59.4, T4 control 28 / 1,139, and T4 candidate 31 / 1,356.6. The remaining incoming direct events had no matching fired monster-cast end at the same source and timestamp; this is an attribution boundary, not proof that every remaining hit was an ordinary attack. Player ability activations were:

| Block / arm | Direct / AOE / empowered player damage events | Monster casts started / fired | Ability activations |
| --- | ---: | ---: | --- |
| Mountain T2 / control | 13,216 / 75 / 1,066 | 1,368 / 1,199 | Sweep 2,499; Second Wind 70 |
| Mountain T2 / candidate | 13,663 / 103 / 1,366 | 1,607 / 1,423 | Sweep 2,980; Second Wind 84 |
| Mountain T4 / control | 24,936 / 229 / 3,216 | 619 / 604 | Frenzy 1,576; Sweep 3,643; Second Wind 136 |
| Mountain T4 / candidate | 27,470 / 255 / 3,602 | 683 / 665 | Frenzy 1,733; Sweep 3,991; Second Wind 95 |

## Cell outcome and pressure comparison

The compact rows below preserve every class/node cell. The detailed per-seed deaths, walls, and body medians follow. A long episode chain is not treated as a simultaneous swarm.

| Block / node / root | Control WE/PD/WC | Candidate WE/PD/WC | Min HP median / low control → candidate | Incoming / 100 control → candidate | Output / 100 control → candidate | Cleared / unfinished episodes control → candidate | Final-two median / max s control → candidate |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Mountain T2 / 03 / Striker | 0/3/0 | 1/2/0 | 0/0 → 0/0 | 606.43 → 479.95 | 4,113.09 → 4,280.29 | 40/3 → 45/3 | 9.55/9.7 → 10.7/40.7 |
| Mountain T2 / 03 / Squire | 2/1/0 | 2/1/0 | 47.01/0 → 52.68/0 | 309.16 → 203.64 | 5,635.48 → 5,518.90 | 63/1 → 67/3 | 27.0/31.6 → 30.6/34.8 |
| Mountain T2 / 03 / Apprentice | 1/2/0 | 3/0/0 | 0/0 → 24.15/22.03 | 384.42 → 324.57 | 5,875.19 → 5,427.78 | 15/3 → 53/2 | 19.8/19.8 → 19.6/98.8 |
| Mountain T2 / 03 / Slinger | 3/0/0 | 3/0/0 | 45.96/10.8 → 35.61/31.04 | 230.45 → 223.56 | 7,142.17 → 7,371.67 | 115/0 → 107/3 | 17.85/120.0 → 17.9/68.9 |
| Mountain T2 / 03 / Conduit | 2/0/1 | 2/0/1 | 76.04/62.63 → 76.04/62.63 | 26.04 → 25.89 | 0 → 0 | 89/2 → 89/2 | 14.9/27.6 → 14.9/27.6 |
| Mountain T2 / 03 / Spirit | 2/1/0 | 2/1/0 | 8.16/0 → 36.14/0 | 183.90 → 180.75 | 5,767.36 → 6,281.91 | 61/3 → 41/2 | 28.9/77.3 → 27.7/362.9 |
| Mountain T2 / 05 / Striker | 0/3/0 | 2/1/0 | 0/0 → 30.67/0 | 482.85 → 277.78 | 4,369.13 → 4,550.60 | 42/3 → 93/3 | 29.7/29.7 → 10.0/29.4 |
| Mountain T2 / 05 / Squire | 3/0/0 | 3/0/0 | 56.16/31.03 → 15.20/7.27 | 243.22 → 217.89 | 5,920.44 → 5,653.11 | 112/3 → 107/2 | 10.15/30.0 → 26.0/31.8 |
| Mountain T2 / 05 / Apprentice | 3/0/0 | 3/0/0 | 45.27/0.57 → 47.44/32.30 | 178.84 → 157.13 | 5,811.22 → 5,841.61 | 61/2 → 107/2 | 37.95/86.4 → 19.8/70.2 |
| Mountain T2 / 05 / Slinger | 3/0/0 | 3/0/0 | 55.31/41.65 → 55.31/42.68 | 183.58 → 193.89 | 7,301.78 → 7,222.28 | 150/0 → 152/1 | 14.4/160.6 → 14.4/137.1 |
| Mountain T2 / 05 / Conduit | 3/0/0 | 3/0/0 | 94.21/82.74 → 94.21/82.74 | 6.43 → 5.99 | 2.78 → 2.78 | 107/1 → 107/1 | 17.85/32.1 → 17.85/32.1 |
| Mountain T2 / 05 / Spirit | 3/0/0 | 3/0/0 | 37.01/29.44 → 34.74/22.07 | 88.49 → 106.51 | 5,650.28 → 6,082.28 | 104/3 → 65/2 | 23.0/26.4 → 17.5/164.5 |
| Mountain T4 / 03 / Striker/Maestro | 2/0/1 | 2/1/0 | 38.88/14.26 → 20.38/0 | 2,013.38 → 1,831.50 | 43,494.58 → 49,229.83 | 86/1 → 95/2 | 23.0/23.7 → 14.2/23.4 |
| Mountain T4 / 03 / Squire/Reverb | 0/3/0 | 3/0/0 | 0/0 → 67.91/57.90 | 2,186.93 → 1,489.66 | 23,264.40 → 21,832.17 | 33/3 → 55/3 | 46.1/72.7 → 37.0/71.5 |
| Mountain T4 / 03 / Apprentice | 3/0/0 | 3/0/0 | 36.98/36.62 → 45.61/42.01 | 258.67 → 211.25 | 56,986.56 → 57,764.67 | 40/3 → 49/2 | 23.8/234.8 → 23.4/268.4 |
| Mountain T4 / 03 / Slinger | 2/1/0 | 3/0/0 | 58.13/0 → 51.05/45.70 | 268.96 → 115.39 | 40,715.81 → 42,229.22 | 3/3 → 2/3 | 405.9/405.9 → — |
| Mountain T4 / 03 / Conduit | 3/0/0 | 3/0/0 | 51.46/40.11 → 72.09/51.56 | 152.74 → 95.54 | 22.94 → 20.50 | 21/3 → 19/3 | — → — |
| Mountain T4 / 03 / Spirit | 3/0/0 | 3/0/0 | 25.64/17.97 → 71.91/68.73 | 173.19 → 40.13 | 45,730.06 → 46,759.78 | 39/2 → 17/3 | 61.3/460.0 → 257.4/573.5 |
| Mountain T4 / 05 / Striker/Maestro | 3/0/0 | 3/0/0 | 44.74/28.63 → 40.66/29.85 | 1,309.86 → 1,364.13 | 52,137.67 → 55,963.17 | 148/1 → 160/2 | 18.3/20.1 → 10.3/18.5 |
| Mountain T4 / 05 / Squire/Reverb | 3/0/0 | 3/0/0 | 47.09/40.51 → 52.79/52.63 | 692.54 → 754.88 | 25,717.11 → 26,283.11 | 65/3 → 69/3 | 50.9/54.3 → 43.0/55.4 |
| Mountain T4 / 05 / Apprentice | 2/0/1 | 3/0/0 | 62.56/36.98 → 69.51/66.87 | 196.63 → 89.45 | 61,486.91 → 64,067.39 | 41/3 → 52/3 | 25.45/175.3 → 20.55/466.5 |
| Mountain T4 / 05 / Slinger | 3/0/0 | 3/0/0 | 49.49/26.95 → 62.52/62.52 | 203.92 → 73.53 | 42,691.39 → 43,393.72 | 119/3 → 121/3 | 30.2/30.2 → 29.5/29.5 |
| Mountain T4 / 05 / Conduit | 3/0/0 | 3/0/0 | 90.30/90.30 → 94.03/94.03 | 11.11 → 0 | 0 → 0 | 86/3 → 79/2 | 9.5/128.3 → 33.7/43.7 |
| Mountain T4 / 05 / Spirit | 3/0/0 | 3/0/0 | 79.68/10.57 → 51.23/7.71 | 76.74 → 59.98 | 44,538.61 → 41,732.17 | 50/2 → 16/3 | 32.0/129.4 → 32.0/110.4 |

T2 candidate pressure is improved but not uniform: the root-level Striker result moves from 0/6/0 to 3/3/0, while Squire and Spirit remain one-death roots and Conduit retains the same node03 wall. T4 candidate survival improves across the other roots without a body-TTK collapse; the remaining death is a node03 Striker/Maestro case.

## READY parity, player builds, and ward products

The paired READY audit covered 36 control/candidate pairs per block, 72 pairs total:

| Check | Result |
| --- | --- |
| Initial roster serialization | 72/72 identical |
| Initial roster hash | 72/72 identical |
| Geometry roster hash | 72/72 identical |
| Player READY view after removing the cell-name label | 72/72 identical |
| Initial monster-stat differences | attack field only, on the declared species |
| Unexpected monster-stat differences | 0 |
| Player treatment differences | no HP, player attack, defenses, barrier, cooldown, equipment, ability, passive, or stance differences |

Representative player READY products were identical between arms. T2 values were Striker 267 HP / 33 attack / 20 plating / 69 barrier / 490ms, Squire 296 / 107 / 23 / 77 / 1855ms, Apprentice 254 / 94 / 19 / 66 / 724ms, Slinger 240 / 37 / 16 / 62 / 260ms, Conduit 242 / 49 / 17 / 63 / 566ms, and Spirit 230 / 36 / 17 / 129 / 459ms. T4 values were Striker/Maestro 596 / 152 / 62 / 250 / 441ms, Squire/Reverb 647 / 211 / 72 / 272 / 1765ms, Apprentice 553 / 387 / 57 / 232 / 764ms, Slinger 523 / 86 / 47 / 220 / 223ms, Conduit 536 / 107 / 52 / 225 / 501ms, and Spirit 502 / 165 / 50 / 361 / 421ms. All used Offensive stance, finalDamageDealtMult 1.288, and finalDamageTakenMult 1.1.

The raw T4 damage stream retained the fixed Granite Barrier product. Maximum full absorption was 345 on node03 and 288 on node05 in both control and candidate arms. Partial values reflected exposure and hit ordering; they were not a capacity change.

## Body timing audit

The body audit uses eligible per-seed clean medians, then the median of those eligible seed medians. I = no eligible clean median; Q = a long-quiet seed excluded by the audit. These are body timings, not pooled-kill averages.

### Mountain T2 Granite Titan

Values are control seeds 80021 / 82003 / 84011, eligible count, cell median → candidate seeds, eligible count, cell median.

| Node / root | Control seed medians; eligible; cell median | Candidate seed medians; eligible; cell median |
| --- | --- | --- |
| 03 / Striker | 30.95 / 30.50 / 29.90s; 2; 30.50s | 30.95 / 31.00 / 31.40s; 3; 31.00s |
| 03 / Squire | 25.85 / 25.90 / 26.20s; 3; 25.90s | 26.40 / 26.05 / 25.50s; 3; 26.05s |
| 03 / Apprentice | 18.00 / 18.00 / 17.25s; 3; 18.00s | 17.20 / 17.60 / 18.00s; 3; 17.60s |
| 03 / Slinger | 14.40 / 14.40 / 14.70s; 3; 14.40s | 15.50 / 14.40 / 14.40s; 3; 14.40s |
| 03 / Conduit | 14.80 / 14.80 / 19.50s; 2; 14.80s | 14.80 / 14.80 / 19.50s; 2; 14.80s |
| 03 / Spirit | 24.50 / I / 23.00s; 2; 23.75s | 23.00 / 23.50 / 23.00s; 3; 23.00s |
| 05 / Striker | 27.70 / 28.00 / 27.95s; 3; 27.95s | 27.85 / 28.05 / 27.60s; 3; 27.85s |
| 05 / Squire | 22.20 / 22.20 / 22.40s; 3; 22.20s | 22.25 / 22.00 / 22.15s; 3; 22.15s |
| 05 / Apprentice | 15.00 / 15.00 / 15.00s; 3; 15.00s | 15.00 / 15.00 / 15.00s; 3; 15.00s |
| 05 / Slinger | 12.90 / 12.90 / 12.90s; 3; 12.90s | 12.90 / 12.05 / 12.90s; 3; 12.90s |
| 05 / Conduit | 12.75 / 12.70 / 12.70s; 3; 12.70s | 12.75 / 12.70 / 12.70s; 3; 12.70s |
| 05 / Spirit | 20.00 / 20.00 / 20.00s; 2; 20.00s | 20.00 / 20.00 / 20.00s; 3; 20.00s |

The T2 attack-only overlay therefore leaves Granite Titan body timing effectively unchanged. Its survival effect is an exposure effect, not a player-output or HP treatment change.

### Mountain T4 treated body medians

Each entry is control median → candidate median in seconds, followed by eligible seed counts in parentheses. The full per-seed values, including unfinished/regained and quiet flags, remain in the block night5-audit artifacts.

| Node / root | Granite Mammoth | Cragback Rhino | Cliffside Roc | Avalanche Tyrant |
| --- | --- | --- | --- | --- |
| 03 / Striker/Maestro | 21.00 (2) → 21.05 (3) | 11.55 (2) → 11.60 (3) | 1.85 (2) → 2.30 (3) | 1.65 (2) → 2.05 (3) |
| 03 / Squire/Reverb | 61.70 (3) → 61.65 (2) | 36.20 (3) → 34.63 (2) | 5.30 (3) → 4.68 (2) | 4.60 (3) → 4.80 (2) |
| 03 / Apprentice | 19.85 (3) → 19.90 (3) | 9.60 (3) → 9.60 (3) | 3.00 (3) → 3.00 (3) | 3.00 (2) → 3.00 (3) |
| 03 / Slinger | 34.50 (2) → 32.00 (1; inconclusive) | 17.50 (2) → 16.30 (3) | 2.45 (3) → 3.90 (3) | 2.50 (2) → 2.85 (3) |
| 03 / Conduit | 49.33 (2) → 47.30 (3) | 46.03 (2) → 45.90 (3) | 6.48 (2) → 5.30 (3) | 9.05 (2) → 4.60 (3) |
| 03 / Spirit | 25.20 (3) → 32.80 (3) | 13.90 (3) → 16.50 (3) | 3.60 (3) → 3.80 (3) | 2.80 (3) → 2.80 (3) |
| 05 / Striker/Maestro | 15.78 (2) → 15.85 (3) | 8.40 (2) → 8.50 (3) | 1.85 (2) → 1.95 (3) | 1.65 (2) → 1.60 (3) |
| 05 / Squire/Reverb | 50.50 (3) → 49.85 (3) | 27.00 (3) → 27.00 (3) | 4.80 (3) → 4.75 (3) | 5.00 (3) → 5.00 (3) |
| 05 / Apprentice | 13.80 (2) → 14.30 (3) | 7.25 (2) → 7.20 (3) | 2.80 (2) → 3.10 (3) | 3.00 (2) → 3.00 (3) |
| 05 / Slinger | 25.10 (3) → 25.40 (3) | 12.90 (2) → 12.70 (3) | 2.60 (3) → 2.40 (3) | 2.10 (2) → 2.10 (3) |
| 05 / Conduit | 28.70 (3) → 28.70 (3) | 24.20 (3) → 24.30 (3) | 3.40 (3) → 3.25 (3) | 2.85 (3) → 2.90 (3) |
| 05 / Spirit | 24.90 (3) → 31.20 (3) | 13.40 (3) → 16.85 (3) | 3.50 (3) → 3.60 (3) | 2.80 (3) → 3.60 (3) |

The T4 Slinger/Mammoth node03 candidate entry is explicitly sparse and inconclusive at one eligible seed. That row is retained as a limitation, not converted into a stable body center.

## Terminal deaths and incoming windows

The table lists every player-death observation. Entry HP + barrier is the last sample at or before the final damaging episode began. Incoming 10s / 30s is raw monster-to-player HP damage in the inclusive window ending at the terminal event. P / 3+ / late / rec is peak sampled pursuers / sampled seconds with at least three pursuers / all-run late joins / all-run recovery interruptions. The terminal damage label is an event-timestamp classification; it is not a total-cause claim.

### Mountain T2 deaths

| Node / root / arm | Seed | Death | Kills | Killer / label | Blow | Entry HP + barrier | Final episode s; members/late | Incoming 10s / 30s | P / 3+ / late / rec |
| --- | ---: | ---: | ---: | --- | ---: | --- | --- | ---: | --- |
| 03 / Spirit / control | 82003 | 38.4s | 0 | Boulder Thrower / ordinary | 76 | 230 + 129 | 37.9; 3/2 | 314.4 / 330.4 | 2 / 0 / 2 / 0 |
| 03 / Spirit / candidate | 82003 | 41.9s | 1 | Boulder Thrower / ordinary | 76 | 230 + 129 | 41.4; 3/2 | 334.0 / 358.4 | 2 / 0 / 2 / 0 |
| 03 / Squire / control | 80021 | 91.0s | 3 | Granite Titan / ordinary | 59 | 296 + 69.75 | 18.8; 2/1 | 313.0 / 484.0 | 2 / 0 / 1 / 1 |
| 03 / Striker / control | 80021 | 98.9s | 3 | Granite Titan / ordinary | 65 | 267 + 69 | 13.8; 2/1 | 340.0 / 499.42 | 2 / 0 / 1 / 1 |
| 03 / Striker / candidate | 80021 | 101.9s | 3 | Boulder Thrower / ordinary | 70 | 267 + 69 | 15.6; 2/0 | 306.0 / 513.25 | 2 / 0 / 0 / 1 |
| 03 / Squire / candidate | 80021 | 107.0s | 4 | Boulder Thrower / ordinary | 65 | 296 + 77 | 27.8; 2/1 | 238.0 / 615.0 | 2 / 0 / 2 / 1 |
| 03 / Apprentice / control | 84011 | 155.2s | 10 | Boulder Thrower / ordinary | 66.6 | 254 + 66 | 18.0; 3/2 | 344.6 / 410.07 | 3 / 2 / 3 / 2 |
| 03 / Apprentice / control | 80021 | 159.0s | 7 | Granite Titan / ordinary | 60.3 | 254 + 66 | 15.8; 3/2 | 271.58 / 330.56 | 3 / 3 / 2 / 3 |
| 05 / Striker / control | 82003 | 174.1s | 14 | Granite Titan / ordinary | 65 | 267 + 50.03 | 31.3; 3/2 | 380.0 / 503.73 | 3 / 4 / 2 / 8 |
| 05 / Striker / control | 80021 | 253.9s | 14 | Granite Titan / ordinary | 65 | 267 + 69 | 14.6; 2/1 | 340.0 / 406.0 | 2 / 0 / 2 / 5 |
| 05 / Striker / control | 84011 | 258.2s | 17 | Boulder Thrower / ordinary | 70 | 197 + 0 | 17.2; 2/1 | 275.0 / 494.8 | 2 / 0 / 1 / 6 |
| 03 / Striker / candidate | 84011 | 359.5s | 17 | Boulder Thrower / ordinary | 70 | 267 + 53.48 | 15.6; 2/1 | 306.0 / 478.75 | 2 / 0 / 3 / 4 |
| 03 / Striker / control | 82003 | 367.3s | 18 | Granite Titan / ordinary | 65 | 267 + 69 | 25.3; 2/1 | 367.0 / 441.25 | 2 / 0 / 2 / 2 |
| 03 / Striker / control | 84011 | 456.1s | 23 | Granite Titan / ordinary | 65 | 267 + 69 | 18.7; 2/1 | 298.0 / 477.3 | 2 / 0 / 2 / 5 |
| 05 / Striker / candidate | 84011 | 569.7s | 31 | Boulder Thrower / ordinary | 70 | 266 + 0 | 22.7; 2/1 | 292.2 / 501.6 | 2 / 0 / 2 / 13 |

All T2 deaths reached minHP 0. The candidate did not remove the Striker failure mode; the last pressure remained ordinary-source damage in the event stream, with recovery interruptions and late joins varying by seed.

### Mountain T4 deaths

| Node / root / arm | Seed | Death | Kills | Killer / label | Blow | Entry HP + barrier | Final episode s; members/late | Incoming 10s / 30s | P / 3+ / late / rec |
| --- | ---: | ---: | ---: | --- | ---: | --- | --- | ---: | --- |
| 03 / Slinger / control | 82003 | 34.4s | 1 | Granite Mammoth / ordinary | 210 | 523 + 11 | 26.7; 2/1 | 707.0 / 926.0 | 2 / 0 / 1 / 1 |
| 03 / Striker/Maestro / candidate | 82003 | 205.8s | 15 | Granite Mammoth / ordinary | 155 | 596 + 250 | 18.3; 2/1 | 1,110.0 / 1,328.0 | 2 / 0 / 1 / 11 |
| 03 / Squire/Reverb / control | 82003 | 432.6s | 10 | Cliffside Roc / ordinary | 174 | 647 + 272 | 18.8; 3/2 | 1,319.0 / 1,581.0 | 3 / 6 / 2 / 6 |
| 03 / Squire/Reverb / control | 84011 | 493.7s | 15 | Granite Mammoth / ordinary | 235 | 647 + 79 | 25.6; 2/1 | 907.0 / 2,084.2 | 2 / 0 / 4 / 7 |
| 03 / Squire/Reverb / control | 80021 | 514.7s | 12 | Granite Mammoth / ordinary | 235 | 647 + 272 | 25.5; 3/2 | 1,080.0 / 1,896.0 | 3 / 6 / 3 / 5 |

All T4 deaths also reached minHP 0. The candidate left one Striker/Maestro death and no wall ceiling; no cast-end timestamp matched any terminal killing blow.

## Wall ceilings and quiet/cutoff rows

| Block / node / root / arm | Seed | Simulated end | Min HP | Max quiet | Q | Late joins | Recovery |
| --- | ---: | ---: | ---: | ---: | --- | ---: | ---: |
| Mountain T2 / 03 / Conduit / control | 84011 | 374.4s | 62.63% | 11.9s |  | 4 | 0 |
| Mountain T2 / 03 / Conduit / candidate | 84011 | 383.7s | 62.63% | 11.9s |  | 4 | 0 |
| Mountain T4 / 03 / Striker/Maestro / control | 82003 | 303.7s | 38.88% | 199.9s | Q | 0 | 7 |
| Mountain T4 / 05 / Apprentice / control | 84011 | 163.3s | 36.98% | 7.8s |  | 12 | 2 |

These are preserved wall-budget outcomes, not successful 600-second windows. The paired T2 Conduit cutoffs are nearly identical and show no evidence that the Titan overlay changed the underlying no-contact tail. The T4 candidate removed both control cutoffs but retained a long Spirit/Squire episode tail in other non-cutoff observations.

## Decision and remaining scope

| Tier | Disposition | Evidence-based conclusion |
| --- | --- | --- |
| Mountain T2 | **Adjust / hold provisionally** | The Titan 67→54 overlay lowers normalized incoming damage and halves total deaths, but Striker remains 3/6 deaths and the Conduit cutoff is unchanged. Do not promote the scalar to production from this screen. The next precise question is T2 Striker final-episode ordinary-hit, recovery, and target-path overlap under the candidate; do not broaden into a combined HP-and-attack grid or automatically request another scalar. |
| Mountain T4 | **Retain as an adoption candidate for regression review** | The 184/113/179/145 → 147/90/143/116 base overlay lowers incoming pressure, removes both walls, and leaves only one Striker/Maestro death while body timing remains broadly stable. Regression against current source and a later scoped playtest gate are required before any adoption; this packet itself makes no production edit. |

The candidate was not a universal winner: T2 Squire and Spirit tails remain mixed, and T4 candidate late joins and maximum episode duration increased in some roots. No six-root pooled center was used to hide the failed Striker cases. Synthetic/restored-checkpoint artifacts are not canonical combat or economy evidence.

Desert and Graveyard packages remain pending adoption review. Jungle durability and Trench Stalker pacing remain open. After the Mountain decision, prioritize those gaps rather than indefinite stance/HP/attack grids. Reconcile and regress on current source before invited-playtest claims.

## Artifact index

| Artifact | Path |
| --- | --- |
| Operator packet | C:/Users/osaif/Documents/Claude/Projects/MMO idle/docs/briefs/bot-balance-durability29-operator-packet.md |
| Batch manifest | C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability29-20260917/results/batch-manifest.json |
| Batch end marker | C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability29-20260917/results/batch-ended.json |
| Operator exit | C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability29-20260917/operator-exit.json |
| Mountain T2 index / analysis / audit | C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability29-20260917/results/mountain2/index.json; analysis.md; night5-audit.json |
| Mountain T4 index / analysis / audit | C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability29-20260917/results/mountain4/index.json; analysis.md; night5-audit.json |
| READY receipts | C:/Users/osaif/AppData/Local/mmo-idle/validation/durability29 |
| Frozen detached source | C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability29-20260917/source |

## Planner review

Durability29 answers the narrow Mountain attack-budget question: the T4 candidate is a strong retained adoption candidate after current-source regression, while T2 remains a pressure/build investigation rather than a settled scalar. The report does not authorize production edits, a further intermediate attack trial, a broad HP sweep, a universal stance or attack rule, or live/economy certification.
