# Durability19 — current-runtime Forest and Volcano candidate confirmation

Date: 2026-09-16  
Status: complete; one sealed sequential run  
Decision scope: confirmation evidence only; no production balance edit is authorized by this report

## Executive result

Durability19 completed the packet-defined 48-cell, 144-observation matrix on the current combat snapshot. The Tortoise/Salamander candidate produced the intended defensive tradeoff in Volcano, but Forest results were heterogeneous across classes and nodes.

- Forest, all 36 matched pairs: control median minimum HP was 56.2%; candidate was 57.0% (+0.8 percentage points). Median incoming damage fell from 1,146 to 1,094 HP, while aggregate body TTK rose from 2.15s to 2.95s. The class/node effects are mixed: F03 Striker improved by 41.1 percentage points, while F03 Slinger fell by 12.6 points and F05 Conduit fell by 31.8 points.
- Volcano, exposure-gated 32 matched pairs: control median minimum HP was 53.5%; candidate was 80.1% (+26.6 points). Median incoming damage fell from 2,547.7 to 1,514.5 HP, aggregate body TTK moved from 3.38s to 3.45s, and deaths were 1 control versus 0 candidate.
- The single death was an eligible Volcano03 Conduit control run. It ended at 113.2s from a 104 HP Magma Tortoise melee hit.
- The packet remains synthetic prepared-World evidence. It does not certify live/browser feel, production economy, or a universal balance change. Retain the candidate for a bounded follow-up, with Volcano as the stronger confirmation signal; do not treat Durability19 as a ship decision.

## Frozen run and evidence boundary

The run was executed once and sequentially with no retries, adaptive changes, source edits, or production monster-file changes. The matrix used:

- Forest T2 nodes 03 and 05; Volcano T3 nodes 03 and 05.
- Six player classes: Striker, Squire, Apprentice, Slinger, Conduit, Spirit.
- Control and candidate arms, three fresh seeds per cell: 14009, 16001, and 18013.
- Natural ecology, prepared World per observation, 100ms simulation step, 300s maximum duration or first player death.
- Medium/native-range templates, +5 gear, offensive stance, and fixed Sweep/guards plus T3 Frenzy where applicable.
- No defensive-stance arm.

The six adult treatment values were:

| Biome | Arm | Adult roster values |
| --- | --- | --- |
| Forest | Control | Wolf 525 HP / 34 attack; Badger 315 HP / 31 attack |
| Forest | Candidate | Wolf 1,575 HP / 22 attack; Badger 945 HP / 25 attack |
| Volcano | Control | Tortoise 2,000 HP / 145 attack; Salamander 1,330 HP / 105 attack |
| Volcano | Candidate | Tortoise 3,000 HP / 116 attack; Salamander 1,330 HP / 84 attack |

Whelp, Spitter, Scuttler, and Hound roster/stats were held fixed within each biome. Volcano Tortoise Guard remained 14%; its base shield moved from 280 to 420 with the HP treatment.

Preparation identity:

- Revision: 6ac0a4b783f89c45dc672e96b646b17bbc016cfb
- Frozen branch: codex/durability19-frozen
- Checkout tree: 3dc3a4cb18c3efaca44e80cab083ee269685ad80
- Definitions SHA256: a30458ee24ad7054c5389b1ed16d47f3435456c18feb34f72ded75c84b0828c0
- Hitbox SHA256: 08BCC55633EFE444D303C71977F7DCF87402157753AF543E975E6C0C493AFA83

The prepared checkout included the current tracked combat/shared snapshot and tests. Preparation passed 48 setups, four 30s pilots, overlay isolation/restoration, benchmark typecheck, death attribution, ambient ramp, tundra chill, and ability-affliction checks. Full-suite and browser/live-play validation were not rerun for this packet.

## Operator completion and artifacts

- Operator start: 2026-09-16T18:44:32.9933697Z
- Operator end: 2026-09-16T18:54:30.7075928Z
- Wall time: 9m57.7142s
- Completion: 48 cells, 144 runs, mode run
- Verification: verified true
- Detached checkout: C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability19-20260916/source
- Result inventory: 583 files, 144 run directories, 464,521,920 bytes

Result root: C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability19-20260916/results-confirmation

Preparation artifacts were retained at
C:/Users/osaif/AppData/Local/mmo-idle/validation/durability19/qualify and
C:/Users/osaif/AppData/Local/mmo-idle/validation/durability19/pilot. They were
not rerun during the operator matrix.

| Artifact | SHA256 |
| --- | --- |
| operator-ledger.jsonl | ECC49E96FF035A17618472E4DA25216F517C007E261340789DB2CB7541D09045 |
| analysis.json | 8FCFCBEC9318EBD0E3120CCF4421D150E71610AE27F5728F8AAD0A3EB3AE9F02 |
| analysis.md | 7C1F1C6181D9363743E710B7D985EB47E2B5829D732EA3F18CF83866B0C52231 |
| complete.json | 52E62DB9E7D570436F0EEA3C90E817DD5776D129F319B3E2406DA3B0EF809A0C |
| exposure-audit.json | 67378DDDED3D885C019D57A44A1FD956C96483238A3FDAED4DACC23FE5AD9A64 |
| index.json | D94585F7F728CE4112AB8404FC838566FB62312E381B818223E2B64CF6740E45 |
| manifest.json | A835A3CD4D84C5133BB10A8865F1905A3C24F921F278246AE3A77B144FB59 |
| verification.log | 6746526980124554361D79F9B9BF938FCC0D50F439C0B7308FA5D534DDA1ACF6 |

## Exposure audit

All 72 class/node/seed pair keys were present and matched. The packet's long-quiet audit found five individual arm-runs across four pair keys. Applying the packet gate leaves 68 eligible pairs, or 136 arm-runs: 36 Forest pairs and 32 Volcano pairs.

| Excluded pair key | Affected arm-runs | Max quiet / terminal quiet |
| --- | --- | --- |
| dur19-swarm-node-t3-volcanic-03-spirit-sweep-s14009 | control | 31.8s / 1.1s |
| dur19-swarm-node-t3-volcanic-05-conduit-sweep-s14009 | control and candidate | 172.7s / 172.7s |
| dur19-swarm-node-t3-volcanic-05-conduit-sweep-s16001 | candidate | 76.7s / 76.7s |
| dur19-swarm-node-t3-volcanic-05-spirit-sweep-s18013 | candidate | 31.1s / 5.3s |

All-outcome tables below retain every run. Gated contrasts exclude both arms of any affected pair key. Volcano05 Conduit therefore has only one eligible pair and is explicitly inconclusive; Volcano03 Spirit and Volcano05 Spirit have two eligible pairs each.

## All-outcome cell matrix

Columns: minimum HP median/low are percentages; incoming median/max are HP; body TTK is the reporter's aggregate clean body metric in seconds; K/U/R means killed, unfinished, and observed regain records; P/M are player and minion attack beats; recovery is completed/interrupted/unresolved with median completed recovery duration.

| Node | Class | Arm | Min HP med/low | Incoming med/max | Body TTK | Clean/records | K/U/R | Deaths | P/M beats | Recovery C/I/U (median) | Episodes |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| F03 | Apprentice | candidate | 38.7/9.9 | 1393.4/1444.3 | 3.20 | 81/84 | 84/0/3 | 0 | 625/0 | 39/0/1 (3.70s) | 41 |
| F03 | Apprentice | control | 48.5/39.6 | 1446.4/1506.7 | 3.20 | 123/125 | 124/1/1 | 0 | 523/0 | 61/1/1 (3.00s) | 65 |
| F03 | Conduit | candidate | 57.1/54.4 | 364/454 | 6.10 | 59/63 | 60/3/1 | 0 | 0/1866 | 32/3/0 (1.00s) | 38 |
| F03 | Conduit | control | 52.2/51.6 | 717/810 | 3.15 | 108/116 | 111/5/6 | 0 | 0/1686 | 41/2/0 (0.00s) | 46 |
| F03 | Slinger | candidate | 59.7/52.5 | 1099/1244 | 2.90 | 117/122 | 120/2/4 | 0 | 1063/0 | 32/0/1 (2.90s) | 35 |
| F03 | Slinger | control | 72.3/65.9 | 1166/1257 | 1.50 | 198/200 | 198/2/0 | 0 | 884/0 | 57/0/1 (2.80s) | 60 |
| F03 | Spirit | candidate | 54.2/52.3 | 688.3/692.4 | 2.10 | 126/128 | 126/2/1 | 0 | 861/0 | 26/26/0 (3.30s) | 55 |
| F03 | Spirit | control | 58.3/56.0 | 381.9/457 | 1.40 | 191/192 | 191/1/1 | 0 | 629/0 | 70/31/1 (0.00s) | 103 |
| F03 | Squire | candidate | 56.7/56.7 | 2311/2422 | 1.90 | 86/88 | 86/2/0 | 0 | 287/0 | 44/0/0 (3.85s) | 46 |
| F03 | Squire | control | 49.7/21.5 | 2596/2720 | 1.90 | 141/142 | 141/1/0 | 0 | 222/0 | 70/0/1 (3.60s) | 72 |
| F03 | Striker | candidate | 53.3/37.2 | 3754/3781 | 8.00 | 86/89 | 86/3/0 | 0 | 1147/0 | 41/0/1 (3.30s) | 44 |
| F03 | Striker | control | 12.2/12.2 | 3293/3439 | 3.00 | 115/117 | 115/2/0 | 0 | 739/0 | 60/0/1 (4.65s) | 63 |
| F05 | Apprentice | candidate | 56.1/55.7 | 1089/1124.5 | 2.45 | 118/121 | 118/3/2 | 0 | 726/0 | 35/0/1 (2.20s) | 38 |
| F05 | Apprentice | control | 52.3/50.7 | 1125.9/1251.7 | 2.70 | 135/138 | 137/1/2 | 0 | 493/0 | 58/1/0 (3.30s) | 61 |
| F05 | Conduit | candidate | 59.7/56.4 | 211/369 | 8.65 | 70/74 | 70/4/1 | 0 | 0/1886 | 42/4/0 (0.55s) | 48 |
| F05 | Conduit | control | 91.5/90.3 | 39/76 | 2.60 | 113/120 | 117/3/4 | 0 | 0/1630 | 41/2/0 (0.00s) | 45 |
| F05 | Slinger | candidate | 76.0/66.5 | 788/819 | 2.30 | 129/132 | 130/2/2 | 0 | 1015/0 | 52/0/1 (2.50s) | 54 |
| F05 | Slinger | control | 77.4/77.1 | 887/958 | 1.20 | 205/207 | 207/0/2 | 0 | 818/0 | 93/0/0 (1.70s) | 93 |
| F05 | Spirit | candidate | 77.5/72.2 | 224.1/296.8 | 1.40 | 128/132 | 129/3/2 | 0 | 771/0 | 37/11/0 (0.00s) | 51 |
| F05 | Spirit | control | 74.5/71.2 | 200.5/258.6 | 1.40 | 202/205 | 202/3/2 | 0 | 663/0 | 27/16/0 (0.00s) | 46 |
| F05 | Squire | candidate | 67.4/67.0 | 1539/1621 | 3.80 | 91/91 | 91/0/0 | 0 | 278/0 | 49/0/0 (4.30s) | 50 |
| F05 | Squire | control | 56.5/53.3 | 2019/2254 | 1.90 | 150/152 | 150/2/0 | 0 | 230/0 | 78/0/0 (2.50s) | 79 |
| F05 | Striker | candidate | 57.0/55.9 | 2422/2493 | 7.50 | 102/105 | 102/3/0 | 0 | 1092/0 | 45/0/0 (3.60s) | 48 |
| F05 | Striker | control | 51.0/50.4 | 2602/3014 | 3.00 | 140/142 | 140/2/0 | 0 | 740/0 | 65/0/0 (3.90s) | 67 |
| V03 | Apprentice | candidate | 77.1/76.5 | 1238.9/1662.6 | 4.20 | 132/148 | 146/2/15 | 0 | 938/0 | 4/0/0 (0.00s) | 7 |
| V03 | Apprentice | control | 59.1/53.8 | 2777.1/3019.5 | 3.90 | 131/159 | 146/13/25 | 0 | 880/0 | 4/1/0 (3.85s) | 8 |
| V03 | Conduit | candidate | 76.7/47.6 | 1847/1847 | 8.25 | 81/118 | 96/22/31 | 0 | 0/2156 | 6/0/0 (0.20s) | 9 |
| V03 | Conduit | control | 47.0/0.0 | 1900/2190 | 7.80 | 66/92 | 74/18/18 | 1 | 0/1576 | 7/0/0 (0.50s) | 10 |
| V03 | Slinger | candidate | 79.8/43.1 | 1667/1909 | 3.40 | 133/161 | 152/9/26 | 0 | 1345/0 | 5/0/0 (0.10s) | 8 |
| V03 | Slinger | control | 51.8/51.1 | 2627/3105 | 3.30 | 140/177 | 160/17/33 | 0 | 1261/0 | 7/0/0 (0.00s) | 10 |
| V03 | Spirit | candidate | 81.2/60.6 | 391/804 | 2.00 | 189/214 | 209/5/22 | 0 | 980/0 | 2/7/0 (3.45s) | 12 |
| V03 | Spirit | control | 36.0/19.1 | 1819.3/2302.3 | 1.90 | 193/206 | 198/8/12 | 0 | 846/0 | 7/7/0 (0.40s) | 17 |
| V03 | Squire | candidate | 88.0/87.8 | 1492/1702 | 2.80 | 195/195 | 195/0/0 | 0 | 419/0 | 59/0/0 (0.00s) | 60 |
| V03 | Squire | control | 71.8/69.5 | 3364/3473 | 3.00 | 203/206 | 203/3/0 | 0 | 400/0 | 65/0/0 (0.00s) | 66 |
| V03 | Striker | candidate | 78.8/77.5 | 2464/2874 | 2.40 | 260/265 | 260/5/0 | 0 | 1253/0 | 79/0/0 (0.00s) | 82 |
| V03 | Striker | control | 47.6/46.7 | 4822/5329 | 2.40 | 247/251 | 247/4/0 | 0 | 1100/0 | 84/0/0 (0.00s) | 86 |
| V05 | Apprentice | candidate | 87.6/86.9 | 1057.2/1076.5 | 3.90 | 108/134 | 127/7/25 | 0 | 858/0 | 3/0/0 (0.10s) | 6 |
| V05 | Apprentice | control | 53.3/43.3 | 2099.6/2614.8 | 3.35 | 111/137 | 127/10/24 | 0 | 811/0 | 7/0/0 (0.00s) | 10 |
| V05 | Conduit | candidate | 82.0/48.2 | 1136/3058 | 10.65 | 49/71 | 51/20/14 | 0 | 0/1602 | 11/0/0 (0.00s) | 14 |
| V05 | Conduit | control | 53.0/29.7 | 2008/2491 | 10.40 | 62/93 | 62/31/33 | 0 | 0/1692 | 5/0/0 (0.00s) | 8 |
| V05 | Slinger | candidate | 70.6/59.0 | 1537/2195 | 4.40 | 124/151 | 137/14/23 | 0 | 1350/0 | 14/0/0 (0.00s) | 17 |
| V05 | Slinger | control | 52.5/38.1 | 1920/2108 | 3.50 | 124/142 | 137/5/17 | 0 | 1250/0 | 14/0/0 (0.00s) | 17 |
| V05 | Spirit | candidate | 88.3/85.6 | 307/371.9 | 2.10 | 167/187 | 180/7/16 | 0 | 936/0 | 5/5/0 (1.70s) | 13 |
| V05 | Spirit | control | 58.6/53.1 | 1301.9/1994.3 | 1.90 | 169/186 | 180/6/14 | 0 | 874/0 | 3/1/0 (0.00s) | 7 |
| V05 | Squire | candidate | 88.0/87.7 | 1229/1690 | 4.60 | 170/171 | 170/1/0 | 0 | 412/0 | 50/0/0 (0.00s) | 52 |
| V05 | Squire | control | 76.4/72.4 | 2305/4147 | 4.60 | 169/174 | 169/5/0 | 0 | 374/0 | 47/0/0 (0.00s) | 50 |
| V05 | Striker | candidate | 78.3/76.7 | 2266/3127 | 3.50 | 214/219 | 214/5/0 | 0 | 1260/0 | 65/0/0 (0.00s) | 68 |
| V05 | Striker | control | 51.9/44.5 | 5686/6034 | 3.40 | 209/210 | 209/1/0 | 0 | 1203/0 | 68/0/0 (0.00s) | 69 |

The all-outcome matrix contains 143 window-ended runs and 1 player-death run. Target records were 7,152: 6,884 killed, 268 unfinished/censored, and 6,652 clean. Observed regain is a separate overlapping flag, not an additional outcome bucket.

The aggregate body-TTK column is not a Wolf, Badger, Tortoise, or Salamander
median and is not a pack-clear duration. The species section below reports
named-species clean TTK directly.

## Exposure-gated sensitivity

The following contrasts use only the 68 eligible matched pairs. Values are candidate minus control; incoming and body TTK are median differences.

| Biome/node | Class | Eligible pairs | Min HP delta | Incoming delta | Body TTK delta |
| --- | --- | ---: | ---: | ---: | ---: |
| Forest03 | Apprentice | 3 | -9.8pp | -53.0 | +0.00s |
| Forest03 | Conduit | 3 | +4.9pp | -353.0 | +2.95s |
| Forest03 | Slinger | 3 | -12.6pp | -67.0 | +1.40s |
| Forest03 | Spirit | 3 | -4.1pp | +306.4 | +0.70s |
| Forest03 | Squire | 3 | +7.0pp | -285.0 | +0.00s |
| Forest03 | Striker | 3 | +41.1pp | +461.0 | +5.00s |
| Forest05 | Apprentice | 3 | +3.8pp | -36.9 | -0.25s |
| Forest05 | Conduit | 3 | -31.8pp | +172.0 | +6.05s |
| Forest05 | Slinger | 3 | -1.4pp | -99.0 | +1.10s |
| Forest05 | Spirit | 3 | +3.0pp | +23.6 | +0.00s |
| Forest05 | Squire | 3 | +10.9pp | -480.0 | +1.90s |
| Forest05 | Striker | 3 | +6.0pp | -180.0 | +4.50s |
| Volcano03 | Apprentice | 3 | +18.0pp | -1538.2 | +0.30s |
| Volcano03 | Conduit | 3 | +29.7pp | -53.0 | +0.45s |
| Volcano03 | Slinger | 3 | +28.0pp | -960.0 | +0.10s |
| Volcano03 | Spirit | 2 | +18.9pp | -1214.8 | +0.00s |
| Volcano03 | Squire | 3 | +16.2pp | -1872.0 | -0.20s |
| Volcano03 | Striker | 3 | +31.2pp | -2358.0 | +0.00s |
| Volcano05 | Apprentice | 3 | +34.3pp | -1042.4 | +0.55s |
| Volcano05 | Conduit | 1 | -4.8pp | +1050.0 | +1.55s |
| Volcano05 | Slinger | 3 | +18.1pp | -383.0 | +0.90s |
| Volcano05 | Spirit | 2 | +24.4pp | -731.5 | -0.15s |
| Volcano05 | Squire | 3 | +11.6pp | -1076.0 | +0.00s |
| Volcano05 | Striker | 3 | +26.4pp | -3420.0 | +0.10s |

Forest all and eligible aggregates are identical: control 56.2% minimum HP, 1,146 incoming HP, 2.15s body TTK; candidate 57.0%, 1,094 HP, 2.95s. Volcano all-outcome aggregates are control 53.5%, 2,395.7 HP, 3.38s with one death versus candidate 80.9%, 1,328 HP, 3.45s with no death. The exposure-gated Volcano aggregate is control 53.5%, 2,547.7 HP, 3.38s versus candidate 80.1%, 1,514.5 HP, 3.45s.

## Per-seed species TTK

Values are median clean-target TTK in seconds for the named species at each seed. W/B/S abbreviate Whelp/Badger/Spitter in Forest; Sc/H/T/A abbreviate Scuttler/Hound/Tortoise/Salamander in Volcano. A dash means no clean target was available for that species in that cell/seed; unfinished and regained targets remain represented in the all-outcome K/U/R counts and raw index.

| Cell | Seed 14009 | Seed 16001 | Seed 18013 |
| --- | --- | --- | --- |
| F03 Apprentice candidate | W 1.60, Wolf 15.70, B 9.00, S 3.20 | W 1.60, Wolf 14.20, B 9.00, S 3.20 | W 1.70, Wolf 15.10, B 9.00, S 3.20 |
| F03 Apprentice control | W 1.60, Wolf 4.85, B 3.20, S 3.20 | W 1.50, Wolf 5.60, B 3.20, S 3.20 | W 1.70, Wolf 5.70, B 3.20, S 3.20 |
| F03 Conduit candidate | W 2.30, Wolf 30.90, B 24.70, S 2.70 | W 3.40, Wolf 30.40, B 19.70, S 2.80 | W 2.40, Wolf 38.00, B 22.90, S 3.10 |
| F03 Conduit control | W 6.40, Wolf 9.90, B 2.80, S 2.75 | W 4.30, Wolf 11.60, B 2.90, S 2.80 | W 5.90, Wolf 13.75, B 2.95, S 2.80 |
| F03 Slinger candidate | W 0.90, Wolf 12.00, B 5.90, S 2.05 | W 0.60, Wolf 13.50, B 6.75, S 1.20 | W 1.20, Wolf 14.40, B 5.90, S 2.90 |
| F03 Slinger control | W 0.60, Wolf 3.80, B 1.20, S 2.90 | W 1.20, Wolf 4.70, B 1.20, S 2.90 | W 1.20, Wolf 3.80, B 1.20, S 2.90 |
| F03 Spirit candidate | W 0.70, Wolf 11.90, B 6.30, S 2.10 | W 1.40, Wolf 13.30, B 6.30, S 2.10 | W 0.70, Wolf 12.60, B 6.30, S 2.10 |
| F03 Spirit control | W 0.70, Wolf 4.90, B 1.75, S 2.10 | W 0.70, Wolf 3.50, B 2.10, S 2.10 | W 0.70, Wolf 3.50, B 2.10, S 1.75 |
| F03 Squire candidate | W 0.00, Wolf 19.00, B 7.60, S 0.00 | W 1.90, Wolf 17.10, B 7.60, S 0.00 | W 1.90, Wolf 20.90, B 7.60, S 0.00 |
| F03 Squire control | W 1.90, Wolf 7.60, B 0.00, S 0.00 | W 1.90, Wolf 3.80, B 0.00, S 0.00 | W 1.90, Wolf 5.70, B 0.00, S 0.00 |
| F03 Striker candidate | W 2.00, Wolf 20.00, B 10.50, S 3.50 | W 1.50, Wolf 19.00, B 10.50, S 3.50 | W 3.00, Wolf 21.00, B 10.50, S 3.50 |
| F03 Striker control | W 2.50, Wolf 8.25, B 3.00, S 3.50 | W 2.50, Wolf 6.50, B 3.50, S 3.50 | W 2.00, Wolf 7.50, B 3.50, S 3.00 |
| F05 Apprentice candidate | W 1.60, Wolf 12.70, B 7.50, S 3.00 | W 1.60, Wolf 13.50, B 7.50, S 3.00 | W 1.60, Wolf 12.80, B 7.75, S 2.20 |
| F05 Apprentice control | W 1.60, Wolf 4.50, B 3.00, S 3.00 | W 1.55, Wolf 4.65, B 3.00, S 3.00 | W 1.50, Wolf 4.80, B 3.00, S 3.00 |
| F05 Conduit candidate | W 2.30, Wolf 26.10, B 14.50, S 2.90 | W 4.40, Wolf 18.70, B 15.50, S 2.60 | W 1.70, Wolf 19.60, B 18.50, S 2.60 |
| F05 Conduit control | W 2.70, Wolf 6.60, B 2.60, S 2.50 | W 3.50, Wolf 8.80, B 2.60, S 2.60 | W 2.70, Wolf 7.50, B 2.60, S 2.40 |
| F05 Slinger candidate | W 0.90, Wolf 9.70, B 5.30, S 0.90 | W 0.60, Wolf 9.40, B 5.30, S 0.90 | W 0.90, Wolf 11.20, B 5.30, S 0.90 |
| F05 Slinger control | W 0.60, Wolf 2.95, B 1.20, S 0.90 | W 0.60, Wolf 5.00, B 2.90, S 0.90 | W 0.60, Wolf 3.50, B 1.20, S 0.90 |
| F05 Spirit candidate | W 0.70, Wolf 9.10, B 5.60, S 1.75 | W 0.70, Wolf 9.80, B 5.60, S 2.10 | W 0.70, Wolf 10.50, B 5.60, S 2.10 |
| F05 Spirit control | W 0.70, Wolf 3.50, B 2.10, S 1.40 | W 0.70, Wolf 2.80, B 1.40, S 2.10 | W 0.70, Wolf 3.50, B 2.10, S 2.10 |
| F05 Squire candidate | W 1.90, Wolf 15.20, B 7.60, S 0.00 | W 1.90, Wolf 15.20, B 7.60, S 0.00 | W 1.90, Wolf 17.10, B 7.60, S 0.00 |
| F05 Squire control | W 1.90, Wolf 4.75, B 0.00, S 0.00 | W 1.90, Wolf 5.70, B 0.00, S 0.00 | W 1.90, Wolf 7.60, B 0.00, S 0.00 |
| F05 Striker candidate | W 3.00, Wolf 16.50, B 9.50, S 2.50 | W 3.00, Wolf 16.75, B 9.25, S 2.50 | W 1.50, Wolf 15.50, B 9.00, S 2.50 |
| F05 Striker control | W 3.00, Wolf 5.00, B 3.00, S 2.50 | W 1.50, Wolf 5.75, B 3.00, S 2.50 | W 3.00, Wolf 5.00, B 3.00, S 2.50 |
| V03 Apprentice candidate | Sc 2.50, H 6.40, T 12.55, A 5.00 | Sc 3.00, H 6.70, T 12.70, A 4.95 | Sc 2.65, H 6.30, T 15.00, A 5.25 |
| V03 Apprentice control | Sc 2.80, H 6.10, T 9.00, A 5.10 | Sc 3.00, H 5.80, T 7.60, A 5.00 | Sc 3.00, H 6.40, T 10.50, A 5.20 |
| V03 Conduit candidate | Sc 3.95, H 10.30, T 28.50, A 7.10 | Sc 10.35, H 14.70, T 51.10, A 7.60 | Sc 8.25, H 14.70, T 28.20, A 7.40 |
| V03 Conduit control | Sc 3.20, H 10.30, T 21.80, A 8.20 | Sc 7.20, H 18.20, T 30.70, A 7.30 | Sc 10.90, H 14.70, T 21.40, A — |
| V03 Slinger candidate | Sc 2.80, H 5.40, T 20.00, A 4.40 | Sc 2.80, H 4.90, T 10.20, A 4.65 | Sc 2.80, H 7.60, T 10.50, A 4.35 |
| V03 Slinger control | Sc 2.80, H 4.80, T 11.20, A 3.90 | Sc 2.80, H 5.30, T 12.90, A 4.05 | Sc 2.90, H 7.80, T 16.60, A 4.30 |
| V03 Spirit candidate | Sc 1.40, H 3.60, T 7.75, A 3.10 | Sc 1.40, H 3.50, T 9.70, A 3.30 | Sc 1.40, H 3.85, T 9.00, A 2.50 |
| V03 Spirit control | Sc 1.40, H 4.10, T 5.00, A 2.90 | Sc 1.45, H 3.75, T 5.60, A 2.80 | Sc 1.50, H 4.00, T 6.10, A 2.80 |
| V03 Squire candidate | Sc 1.40, H 4.60, T 14.10, A 4.60 | Sc 1.80, H 3.60, T 14.80, A 3.20 | Sc 1.80, H 6.40, T 13.20, A 3.60 |
| V03 Squire control | Sc 1.80, H 4.20, T 9.80, A 3.50 | Sc 1.60, H 6.40, T 9.60, A 5.00 | Sc 1.80, H 5.00, T 9.80, A 3.60 |
| V03 Striker candidate | Sc 1.50, H 3.30, T 8.75, A 2.80 | Sc 1.30, H 3.60, T 9.80, A 3.00 | Sc 1.50, H 3.55, T 9.85, A 2.70 |
| V03 Striker control | Sc 1.20, H 4.30, T 5.80, A 2.80 | Sc 2.25, H 4.70, T 5.30, A 3.00 | Sc 1.50, H 5.80, T 8.00, A 2.80 |
| V05 Apprentice candidate | Sc 3.00, H 7.50, T 14.90, A 5.95 | Sc 3.25, H 7.50, T 13.50, A 5.75 | Sc 3.00, H 6.00, T 13.50, A 5.40 |
| V05 Apprentice control | Sc 3.00, H 6.80, T 14.00, A 5.90 | Sc 3.00, H 7.00, T 8.50, A 5.80 | Sc 3.00, H 6.00, T 11.80, A 5.50 |
| V05 Conduit candidate | Sc 10.00, H 18.00, T —, A 9.90 | Sc 10.10, H 19.35, T —, A 9.80 | Sc 8.85, H 16.70, T 33.60, A 10.85 |
| V05 Conduit control | Sc 10.00, H 18.00, T —, A 9.90 | Sc 11.00, H 21.80, T —, A 8.35 | Sc 8.30, H 12.00, T 26.90, A 11.35 |
| V05 Slinger candidate | Sc 3.00, H 7.60, T —, A 4.60 | Sc 2.80, H 8.20, T 14.90, A 4.50 | Sc 3.30, H 8.30, T 19.20, A 4.60 |
| V05 Slinger control | Sc 3.00, H 7.20, T 8.40, A 4.70 | Sc 3.20, H 8.20, T 14.90, A 4.70 | Sc 2.90, H 7.70, T 16.15, A 5.00 |
| V05 Spirit candidate | Sc 1.40, H 4.10, T 10.65, A 3.85 | Sc 1.50, H 5.50, T 10.20, A 3.10 | Sc 2.00, H 4.95, T 8.65, A 2.90 |
| V05 Spirit control | Sc 1.40, H 4.20, T 6.50, A 3.50 | Sc 1.40, H 4.00, T 7.90, A 3.10 | Sc 1.40, H 4.20, T 6.15, A 3.50 |
| V05 Squire candidate | Sc 3.60, H 6.80, T 14.90, A 4.10 | Sc 3.20, H 9.60, T 16.65, A 4.60 | Sc 3.60, H 6.40, T 14.20, A 3.20 |
| V05 Squire control | Sc 3.20, H 6.80, T 11.30, A 4.60 | Sc 3.30, H 8.20, T 12.40, A 4.60 | Sc 5.00, H 6.40, T 9.60, A 4.10 |
| V05 Striker candidate | Sc 2.40, H 5.65, T 10.80, A 3.95 | Sc 2.80, H 4.45, T 10.90, A 3.25 | Sc 2.00, H 3.75, T 11.70, A 3.20 |
| V05 Striker control | Sc 2.00, H 6.10, T 9.40, A 3.60 | Sc 1.90, H 4.45, T 8.40, A 3.40 | Sc 2.10, H 5.40, T 10.40, A 3.50 |

### Outer medians from the per-seed clean medians

Each row lists the species in order Whelp, Wolf, Badger, Spitter for Forest or
Scuttler, Hound, Tortoise, Salamander for Volcano. Within each species group,
the three values are seed 14009 / 16001 / 18013; the four values after the
arrow are the corresponding outer medians. Missing seed values are not
imputed. These are clean species medians, not mixed-body TTK or pack-clear
duration.

| Cell | Whelp/Wolf/Badger/Spitter or Scuttler/Hound/Tortoise/Salamander |
| --- | --- |
| F03 Apprentice candidate | 1.60/1.60/1.70 / 15.70/14.20/15.10 / 9.00/9.00/9.00 / 3.20/3.20/3.20 -> 1.60/15.10/9.00/3.20 |
| F03 Apprentice control | 1.60/1.50/1.70 / 4.85/5.60/5.70 / 3.20/3.20/3.20 / 3.20/3.20/3.20 -> 1.60/5.60/3.20/3.20 |
| F03 Conduit candidate | 2.30/3.40/2.40 / 30.90/30.40/38.00 / 24.70/19.70/22.90 / 2.70/2.80/3.10 -> 2.40/30.90/22.90/2.80 |
| F03 Conduit control | 6.40/4.30/5.90 / 9.90/11.60/13.75 / 2.80/2.90/2.95 / 2.75/2.80/2.80 -> 5.90/11.60/2.90/2.80 |
| F03 Slinger candidate | 0.90/0.60/1.20 / 12.00/13.50/14.40 / 5.90/6.75/5.90 / 2.05/1.20/2.90 -> 0.90/13.50/5.90/2.05 |
| F03 Slinger control | 0.60/1.20/1.20 / 3.80/4.70/3.80 / 1.20/1.20/1.20 / 2.90/2.90/2.90 -> 1.20/3.80/1.20/2.90 |
| F03 Spirit candidate | 0.70/1.40/0.70 / 11.90/13.30/12.60 / 6.30/6.30/6.30 / 2.10/2.10/2.10 -> 0.70/12.60/6.30/2.10 |
| F03 Spirit control | 0.70/0.70/0.70 / 4.90/3.50/3.50 / 1.75/2.10/2.10 / 2.10/2.10/1.75 -> 0.70/3.50/2.10/2.10 |
| F03 Squire candidate | 0.00/1.90/1.90 / 19.00/17.10/20.90 / 7.60/7.60/7.60 / 0.00/0.00/0.00 -> 1.90/19.00/7.60/0.00 |
| F03 Squire control | 1.90/1.90/1.90 / 7.60/3.80/5.70 / 0.00/0.00/0.00 / 0.00/0.00/0.00 -> 1.90/5.70/0.00/0.00 |
| F03 Striker candidate | 2.00/1.50/3.00 / 20.00/19.00/21.00 / 10.50/10.50/10.50 / 3.50/3.50/3.50 -> 2.00/20.00/10.50/3.50 |
| F03 Striker control | 2.50/2.50/2.00 / 8.25/6.50/7.50 / 3.00/3.50/3.50 / 3.50/3.50/3.00 -> 2.50/7.50/3.50/3.50 |
| F05 Apprentice candidate | 1.60/1.60/1.60 / 12.70/13.50/12.80 / 7.50/7.50/7.75 / 3.00/3.00/2.20 -> 1.60/12.80/7.50/3.00 |
| F05 Apprentice control | 1.60/1.55/1.50 / 4.50/4.65/4.80 / 3.00/3.00/3.00 / 3.00/3.00/3.00 -> 1.55/4.65/3.00/3.00 |
| F05 Conduit candidate | 2.30/4.40/1.70 / 26.10/18.70/19.60 / 14.50/15.50/18.50 / 2.90/2.60/2.60 -> 2.30/19.60/15.50/2.60 |
| F05 Conduit control | 2.70/3.50/2.70 / 6.60/8.80/7.50 / 2.60/2.60/2.60 / 2.50/2.60/2.40 -> 2.70/7.50/2.60/2.50 |
| F05 Slinger candidate | 0.90/0.60/0.90 / 9.70/9.40/11.20 / 5.30/5.30/5.30 / 0.90/0.90/0.90 -> 0.90/9.70/5.30/0.90 |
| F05 Slinger control | 0.60/0.60/0.60 / 2.95/5.00/3.50 / 1.20/2.90/1.20 / 0.90/0.90/0.90 -> 0.60/3.50/1.20/0.90 |
| F05 Spirit candidate | 0.70/0.70/0.70 / 9.10/9.80/10.50 / 5.60/5.60/5.60 / 1.75/2.10/2.10 -> 0.70/9.80/5.60/2.10 |
| F05 Spirit control | 0.70/0.70/0.70 / 3.50/2.80/3.50 / 2.10/1.40/2.10 / 1.40/2.10/2.10 -> 0.70/3.50/2.10/2.10 |
| F05 Squire candidate | 1.90/1.90/1.90 / 15.20/15.20/17.10 / 7.60/7.60/7.60 / 0.00/0.00/0.00 -> 1.90/15.20/7.60/0.00 |
| F05 Squire control | 1.90/1.90/1.90 / 4.75/5.70/7.60 / 0.00/0.00/0.00 / 0.00/0.00/0.00 -> 1.90/5.70/0.00/0.00 |
| F05 Striker candidate | 3.00/3.00/1.50 / 16.50/16.75/15.50 / 9.50/9.25/9.00 / 2.50/2.50/2.50 -> 3.00/16.50/9.25/2.50 |
| F05 Striker control | 3.00/1.50/3.00 / 5.00/5.75/5.00 / 3.00/3.00/3.00 / 2.50/2.50/2.50 -> 3.00/5.00/3.00/2.50 |
| V03 Apprentice candidate | 2.50/3.00/2.65 / 6.40/6.70/6.30 / 12.55/12.70/15.00 / 5.00/4.95/5.25 -> 2.65/6.40/12.70/5.00 |
| V03 Apprentice control | 2.80/3.00/3.00 / 6.10/5.80/6.40 / 9.00/7.60/10.50 / 5.10/5.00/5.20 -> 3.00/6.10/9.00/5.10 |
| V03 Conduit candidate | 3.95/10.35/8.25 / 10.30/14.70/14.70 / 28.50/51.10/28.20 / 7.10/7.60/7.40 -> 8.25/14.70/28.50/7.40 |
| V03 Conduit control | 3.20/7.20/10.90 / 10.30/18.20/14.70 / 21.80/30.70/21.40 / 8.20/7.30/-- -> 7.20/14.70/21.80/7.75 |
| V03 Slinger candidate | 2.80/2.80/2.80 / 5.40/4.90/7.60 / 20.00/10.20/10.50 / 4.40/4.65/4.35 -> 2.80/5.40/10.50/4.40 |
| V03 Slinger control | 2.80/2.80/2.90 / 4.80/5.30/7.80 / 11.20/12.90/16.60 / 3.90/4.05/4.30 -> 2.80/5.30/12.90/4.05 |
| V03 Spirit candidate | 1.40/1.40/1.40 / 3.60/3.50/3.85 / 7.75/9.70/9.00 / 3.10/3.30/2.50 -> 1.40/3.60/9.00/3.10 |
| V03 Spirit control | 1.40/1.40/1.50 / 4.10/3.75/4.00 / 5.00/5.60/6.10 / 2.90/2.80/2.80 -> 1.40/4.00/5.60/2.80 |
| V03 Squire candidate | 1.40/1.80/1.80 / 4.60/3.60/6.40 / 14.10/14.80/13.20 / 4.60/3.20/3.60 -> 1.80/4.60/14.10/3.60 |
| V03 Squire control | 1.80/1.60/1.80 / 4.20/6.40/5.00 / 9.80/9.60/9.80 / 3.50/5.00/3.60 -> 1.80/5.00/9.80/3.60 |
| V03 Striker candidate | 1.50/1.30/1.50 / 3.30/3.60/3.55 / 8.75/9.80/9.85 / 2.80/3.00/2.70 -> 1.50/3.55/9.80/2.80 |
| V03 Striker control | 1.20/2.25/1.50 / 4.30/4.70/5.80 / 5.80/5.30/8.00 / 2.80/3.00/2.80 -> 1.50/4.70/5.80/2.80 |
| V05 Apprentice candidate | 3.00/3.25/3.00 / 7.50/7.50/6.00 / 14.90/13.50/13.50 / 5.95/5.75/5.40 -> 3.00/7.50/13.50/5.75 |
| V05 Apprentice control | 3.00/3.00/3.00 / 6.80/7.00/6.00 / 14.00/8.50/11.80 / 5.90/5.80/5.50 -> 3.00/6.80/11.80/5.80 |
| V05 Conduit candidate | 10.00/10.10/8.85 / 18.00/19.35/16.70 / --/--/33.60 / 9.90/9.80/10.85 -> 10.00/18.00/inconclusive/9.90 |
| V05 Conduit control | 10.00/11.00/8.30 / 18.00/21.80/12.00 / --/--/26.90 / 9.90/8.35/11.35 -> 10.00/18.00/inconclusive/9.90 |
| V05 Slinger candidate | 3.00/2.80/3.30 / 7.60/8.20/8.30 / --/14.90/19.20 / 4.60/4.50/4.60 -> 3.00/8.20/17.05/4.60 |
| V05 Slinger control | 3.00/3.20/2.90 / 7.20/8.20/7.70 / 8.40/14.90/16.15 / 4.70/4.70/5.00 -> 3.00/7.70/14.90/4.70 |
| V05 Spirit candidate | 1.40/1.50/2.00 / 4.10/5.50/4.95 / 10.65/10.20/8.65 / 3.85/3.10/2.90 -> 1.50/4.95/10.20/3.10 |
| V05 Spirit control | 1.40/1.40/1.40 / 4.20/4.00/4.20 / 6.50/7.90/6.15 / 3.50/3.10/3.50 -> 1.40/4.20/6.50/3.50 |
| V05 Squire candidate | 3.60/3.20/3.60 / 6.80/9.60/6.40 / 14.90/16.65/14.20 / 4.10/4.60/3.20 -> 3.60/6.80/14.90/4.10 |
| V05 Squire control | 3.20/3.30/5.00 / 6.80/8.20/6.40 / 11.30/12.40/9.60 / 4.60/4.60/4.10 -> 3.30/6.80/11.30/4.60 |
| V05 Striker candidate | 2.40/2.80/2.00 / 5.65/4.45/3.75 / 10.80/10.90/11.70 / 3.95/3.25/3.20 -> 2.40/4.45/10.90/3.25 |
| V05 Striker control | 2.00/1.90/2.10 / 6.10/4.45/5.40 / 9.40/8.40/10.40 / 3.60/3.40/3.50 -> 2.00/5.40/9.40/3.50 |

V05 Conduit Tortoise has one clean seed in each arm, so its displayed
outer value is descriptive only and is marked inconclusive. The same
fewer-than-two-seeds rule is applied to any other missing species median.

## Low-HP and death audit

Six runs reached a summary minimum below 20%. Four were Forest03 low-HP survivors, one was a Volcano03 Spirit control low-HP survivor, and one was the Volcano03 Conduit control death.

| Run | Result | Summary minimum | Lowest persisted sample | Approximate preceding 10s pressure |
| --- | --- | ---: | ---: | --- |
| F03 Apprentice candidate s18013 | window-ended | 9.89% | 11.21% at 21.0s | Wolf 88.6, Spitter 206.1, Badger 24.9 HP |
| F03 Striker control s14009 | window-ended | 12.24% | 12.24% at 41.0s | Wolf 336, Whelp 62 HP |
| F03 Striker control s16001 | window-ended | 12.83% | 12.83% at 283.0s | Whelp 90, Wolf 320 HP |
| F03 Striker control s18013 | window-ended | 12.21% | 12.57% at 12.0s | Whelp 51, Wolf 320 HP |
| V03 Conduit control s18013 | player-died at 113.2s | 0.00% | 11.55% at 112.0s | Salamander 295, Tortoise 312 HP |
| V03 Spirit control s14009 | window-ended | 19.11% | 21.00% at 132.0s | Scuttler 1, Salamander 314, Tortoise 378 HP |

The death's final attributed hit was 104 HP melee from Magma Tortoise. No blocked-approach samples or static contacts occurred in these low-HP windows. The Apprentice candidate had incoming-dot sample activity; no incoming damage event was classified as a damage-over-time event.

## Incoming pressure, recovery, and event totals

Global run-level summaries:

- Per-run minimum HP median 59.2267%; minimum 0%.
- Incoming damage median 1,506.35 HP; maximum per-run incoming total 6,034 HP.
- Largest individual incoming hit 151 HP; maximum incoming damage in one second 323 HP.
- Raw incoming events 21,013; direct HP 245,793.65; debt 1,979; incoming-dot event HP 0.
- Attack beats: 32,556 player and 14,094 minion.
- Recovery records: 1,944 total; 1,816 completed, 118 interrupted, 10 unresolved.
- Episodes: 2,054 total; 1,226 solo, 62 small, 766 swarm.

| Incoming source | Events | Direct HP | Debt | Total HP |
| --- | ---: | ---: | ---: | ---: |
| Ironclaw Badger | 1,231 | 19,900.8 | 14.0 | 19,914.8 |
| Dire Whelp | 3,840 | 12,543.7 | 37 | 12,580.7 |
| Dire Wolf | 4,019 | 52,698.9 | 305 | 53,003.9 |
| Thorn Spitter | 701 | 10,974.8 | 100 | 11,074.8 |
| Ash Salamander | 3,778 | 82,670.9 | 1,096 | 83,766.9 |
| Ember Scuttler | 4,934 | 3,975.9 | 206 | 4,181.9 |
| Cinder Hound | 1,761 | 19,390.5 | 78 | 19,468.4 |
| Magma Tortoise | 749 | 43,638.3 | 143 | 43,781.3 |

Outgoing raw totals were player direct 32,556 events / 4,420,114 HP, player DoT 3,240 / 368,637 HP, minion direct 14,094 / 410,900 HP, and player AOE 4,491 / 533,149 HP, for 54,381 target-damage events / 5,732,800 HP.

Event totals included 11,203 ability activations, 75,394 damage events, 9,470 buff gains, 9,222 buff expirations, 6,884 kills, 139,226 heals, 1,390 monster cast starts, 1,229 cast ends, 18,451 technique-adapter events, 25,601 buff updates, 1,891 absorbs, 1,135 hazard escapes, and 1 player-death event.

## Hazard and class-specific observations

- Volcano hazard escape events: 1,135. Forest hazard escape events: 0.
- Static damage contacts appeared in 69 samples, always at most one contact: lava_vent_1 24, lava_vent_0 24, lava_vent_2 21.
- Blocked-approach samples: 0.
- Incoming event actor type was monster for all 21,013 incoming events. Damage types were direct for 19,418 and debt for 1,595; dot was 0.
- All 72 Volcano runs reached Heat stack 6. Heat buff events were 967 control and 763 candidate; gains were 41 and 44, updates 913 and 715, expirations 10 and 7.
- Forest03 Conduit candidate/control had 1,866/1,686 minion attack beats and 37,254/33,663 minion damage HP. Forest05 had 1,886/1,630 beats and 39,446/34,100 HP. Volcano03 had 2,156/1,576 beats and 90,205/65,573 HP. Volcano05 had 1,602/1,692 beats and 53,176/57,483 HP. Player attack beats were zero for Conduit in every arm; its damage delivery was minion-mediated.

## READY and pairing audit

The following values were read from the actual per-run ready.json files. The
spawned values are shown explicitly to avoid inferring node scaling from an
earlier report.

| Node | Arm | Adult baseline -> packet treatment -> spawned initialStats | Fixed roster initialStats | Adult plating / DR |
| --- | --- | --- | --- | --- |
| F03 | control | Wolf 525/34 -> 525/34 -> 578/41; Badger 315/31 -> 315/31 -> 347/37 | Whelp 171/17; Spitter 330/37 | 0 / 0.05 |
| F03 | candidate | Wolf 525/34 -> 1575/22 -> 1733/26; Badger 315/31 -> 945/25 -> 1040/30 | Whelp 171/17; Spitter 330/37 | 0 / 0.05 |
| F05 | control | Wolf 525/34 -> 525/34 -> 525/34; Badger 315/31 -> 315/31 -> 315/31 | Whelp 155/14; Spitter 300/31 | 0 / 0 |
| F05 | candidate | Wolf 525/34 -> 1575/22 -> 1575/22; Badger 315/31 -> 945/25 -> 945/25 | Whelp 155/14; Spitter 300/31 | 0 / 0 |
| V03 | control | Tortoise 2000/145 -> 2000/145 -> 2000/145; Salamander 1330/105 -> 1330/105 -> 1330/105 | Scuttler 650/45; Hound 1440/80 | Tortoise/Salamander 4/2; DR 0 |
| V03 | candidate | Tortoise 2000/145 -> 3000/116 -> 3000/116; Salamander 1330/105 -> 1330/84 -> 1330/84 | Scuttler 650/45; Hound 1440/80 | Tortoise/Salamander 4/2; DR 0 |
| V05 | control | Tortoise 2000/145 -> 2000/145 -> 2000/145; Salamander 1330/105 -> 1330/105 -> 1330/105 | Scuttler 650/45; Hound 1440/80 | Tortoise/Salamander 5/3; DR 0.15 |
| V05 | candidate | Tortoise 2000/145 -> 3000/116 -> 3000/116; Salamander 1330/105 -> 1330/84 -> 1330/84 | Scuttler 650/45; Hound 1440/80 | Tortoise/Salamander 5/3; DR 0.15 |

All 72 pair keys passed each identity check:

| Identity check | Passed pairs |
| --- | ---: |
| Geometry roster hash | 72/72 |
| Equipment, upgrades, runes, and attuned abilities | 72/72 |
| Active, attuned, and equipped stance | 72/72 |
| Fixed Whelp/Spitter/Scuttler/Hound roster and stats | 72/72 |
| Adult treatment presence | 72/72 |
| Known abilities | 72/72 |
| Known stances | 72/72 |

Monster cast telemetry, reported as starts/fired ends, was Howl 575/477 and
Barrage 7/1 in Forest control, versus Howl 565/473 and Barrage 20/4 in Forest
candidate. Volcano recorded Molten Guard 94/86 in control and 129/122 in
candidate. These counts are raw cast telemetry and were not inferred from
attack beats or target TTK.

## Readiness and interpretation

All 72 pairs matched on geometry roster hash, equipment/upgrades/runes/attuned abilities, active/attuned/equipped stance, fixed roster/stats, adult treatment presence, known abilities, and known stances. The four geometry hashes were:

- Forest03: 7ea8c0f88c0eaac88ef0f4176254519629b2bb85551b20e0822f3699018054ea
- Forest05: b2fdbcfe04c2f6601e7c0cecf4cecd4dd6116f07c0d28e45599d81eb1b9143e3
- Volcano03: 32c50c6a174404b7e04d7200a0d958723d615505a1633ebd0e2e0e33cf934983
- Volcano05: e86739f1768d69f96664adf2673c2f09588607d7fe7ae4f0105ec83d467b64ed

The candidate's higher adult HP and lower adult attack clearly reduced Volcano pressure without materially changing aggregate body TTK. Forest behavior is not uniformly monotonic across class/node combinations, and the very small eligible sample for Volcano05 Conduit is not decision-grade. The observed Volcano improvement is therefore a candidate confirmation signal, not proof that the same overlay should be applied globally.

Recommended next step: preserve the frozen artifacts and candidate definition, then request a separately scoped follow-up that can test live/browser readability and ordinary-player stance behavior. Do not edit production balance files or select a ship winner from this synthetic packet alone.

Planner review (2026-09-16): corrected the Forest03 Apprentice delta sign and
low-HP geography, and the opening species mix-up. These observations construct
fresh prepared Worlds, not restored checkpoints. Both candidates had zero deaths
in36 runs each; Forest had one sub20% Apprentice survivor, Volcano none. The
Forest low window was Spitter-dominated. Recommend retaining both packages for
adoption consideration with specific exceptions, not another blanket selection
loop. Reduced minimum HP alone (e.g. Conduit91.5% to59.7%) is not a severe failure.
Broader Durability20 coverage is a single-arm survey, not another causal comparison.
