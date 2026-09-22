# Overnight endurance 01 — run 01

## Short answer

The sealed 30-minute campaign completed successfully: 336/336 combat observations, with 104 player deaths and 232 lives reaching the 1,800,000 ms cap. Survival was 262/336 at five minutes, 241/336 at fifteen minutes, and 232/336 at thirty minutes. Every cap survivor produced positive kills and HP damage, so no surviving row was a no-progress stall. The result is useful but mixed: the strongest mature packages are credible endurance references, while T3 Volcanic, T4 Graveyard, Striker-heavy, and several Conduit packages still show substantial attrition.

Across the 48 matched charm pairs, the Volcanic arm completed 10,821 kills versus 4,700 for Mountain and survived to thirty minutes in 40 versus 20 pairs. Mountain nevertheless produced more completed kills in four pairs and tied one more, so the charm tradeoff is not a universal ranking. No gameplay adoption or automatic next experiment is authorized by this report.

## Five prioritized findings

1. Endurance is real for a substantial subset, not for the whole roster. Overall survival was 78.0% at five minutes, 71.7% at fifteen minutes, and 69.0% at thirty minutes. Seventy-four of the 104 deaths occurred before five minutes; the remaining deaths were 21 in the 5–15 minute interval and 9 in the 15–30 minute interval.

2. Encounter and fixture pressure dominate the failure pattern. Thirty-minute survival was 36/48 in T3 Tundra, 17/48 in T3 Volcanic, 96/120 in T4 Desert, and 83/120 in T4 Graveyard. Recorded death causes were 42 ranged, 35 melee, 25 DoT, and 2 debt events. The leading killer type IDs were plague-hound (28), ash-slinger (18), and sandspitter-cobra (18). These are encounter-specific attrition signals, not evidence for a single global class coefficient.

3. The Volcanic charm is the aggregate winner in the selected pairs, but Mountain wins are material. Volcanic reached the 5/15/30-minute endpoints in 46/48, 40/48, and 40/48 pairs; Mountain reached them in 26/48, 21/48, and 20/48. Completed-kill work favored Volcanic in 43 pairs, Mountain in 4, and tied in 1. The Mountain wins include T3 Apprentice light on Tundra seed 101021, T4 Spirit balanced on Desert seed 101021, T4 Spirit balanced on Graveyard seed 101009, and T4 Squire heavy-b on Desert seed 101009.

4. The clearest build-reference candidates are the mature Slinger and Spirit packages, not a universal tier list. T4 Slinger heavy-a survived all 20 of its observations to thirty minutes and completed 3,649 kills; T4 Spirit heavy-a survived all 16 and completed 1,507 kills. T3 Slinger heavy and T3 Spirit heavy also survived all four observations each. In contrast, T4 Striker heavy-a and T4 Striker heavy-c had no thirty-minute survivors, and T4 Conduit heavy-b had none. These are fixed synthetic package references, not optimized or acquisition-validated builds.

5. The Conduit question remains diagnosis-only. Block C was sealed out at zero observations because the prior review produced no qualified candidate. The historical diagnosis remains that Defensive Tundra repeatedly absorbed Glacier Bear barrier damage without HP progress while sessions refreshed, while Heavy Defensive Volcanic showed owner pressure and paid reconstruction despite high authored offense. The main A/B run adds no new C-treatment evidence and does not turn authored availability into delivered DPS. The ordinary run recorded 1,038 unfinished targets and 2,115 target-regain events overall; these are delivery/encounter diagnostics, not a standalone balance verdict.

## Three actionable decisions

1. Do not adopt a global charm rule. Retain both charm arms as declared candidates, preserve the four Mountain-winning pair references, and review the Volcanic advantage as a package-level result that includes barrier, flat Recovery, and continuous/on-kill access. Do not turn it into an acquisition or economy claim.

2. Keep the T4 Slinger heavy-a and T4 Spirit heavy-a receipts as candidate build references for later player-fast-pass work, with T3 Slinger heavy and T3 Spirit heavy as supporting references. Do not promote them as universal best builds or silently change the rest of the declared package.

3. Route the next command-center review toward encounter-specific attrition and a narrow Conduit delivery question. Do not add permanent Recuperating, retune damage, reduce intervals, repair the prior diagnosis, or launch another crossed matrix from this report alone.

## Frozen execution identity

| Field | Value |
| --- | --- |
| Experiment | overnight-endurance-01 |
| Execution source commit | e26fdccd3baaa96fe1d19263349d57d9c5abc626 |
| Execution source SHA-256 | 6f49c74da2c23037d06b1185ba4ba1682a8b9160552475e8deb517889ebddd3b |
| Hitboxes SHA-256 | 08bcc55633efe444d303c71977f7dcf87402157753af543e975e6c0c493afa83 |
| Fixed checkout | D:/mmo-idle/overnight-endurance-01/source |
| World step / cap | 100 ms / 1,800,000 ms |
| Stop rule | First player death; otherwise cap |
| Seeds | 101009 and 101021 |
| Synthetic / economy eligible | true / false |
| Execution model | Sequential, one direct child at a time |
| Raw root | D:/mmo-idle/overnight-endurance-01/run-01 |

The packet verification command passed before launch. The dispatcher completed with exit code 0 and did not retry or alter any case. The execution checkout and HEAD were kept separate from this publication checkout.

## Ledger and coverage

| Block | Coverage | Planned | Completed | Failed | Not run |
| --- | --- | ---: | ---: | ---: | ---: |
| A | 18 T3 and 54 T4 identities, two ordinary fixtures, two seeds | 288 | 288 | 0 | 0 |
| B | 12 selected Mountain controls, two fixtures, two seeds | 48 | 48 | 0 | 0 |
| C | Optional Conduit comparison | 0 | 0 | 0 | 0 |
| Total | 72 stable identities; 336 observations | 336 | 336 | 0 | 0 |

The result receipt reports 336 combat observations. Outcomes were 232 window-ended and 104 player-died. No process or watchdog failure was classified as a player death, and no case required terminal-receipt reconciliation.

## Endpoint survival and work

Endpoint survival counts are repeated measurements from the same continuous life, not independent replications. In the identity, fixture, and seed tables below, each endpoint cell is formatted as surviving rows / rows in scope; cumulative kills summed over rows that reached that endpoint. A null work value means no row in that scope reached that endpoint; it is not measured zero combat.

| Scope | N | 5 minutes | 15 minutes | 30 minutes | Deaths | Total completed kills |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| All observations | 336 | 262/336; 11,083 | 241/336; 31,170 | 232/336; 59,581 | 104 | 63,842 |

| Fixture | N | 5 minutes | 15 minutes | 30 minutes | Deaths | Total completed kills |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| node-t3-tundra-03 | 48 | 42/48; 749 | 37/48; 2,111 | 36/48; 4,195 | 12 | 4,492 |
| node-t3-volcanic-03 | 48 | 23/48; 1,381 | 19/48; 3,445 | 17/48; 6,112 | 31 | 7,407 |
| node-t4-desert-03 | 120 | 99/120; 2,135 | 96/120; 6,504 | 96/120; 13,124 | 24 | 13,276 |
| node-t4-graveyard-03 | 120 | 98/120; 6,818 | 89/120; 19,110 | 83/120; 36,150 | 37 | 38,667 |

| Seed | N | 5 minutes | 15 minutes | 30 minutes | Deaths | Total completed kills |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 101009 | 168 | 131/168; 5,655 | 120/168; 15,788 | 114/168; 29,643 | 54 | 32,199 |
| 101021 | 168 | 131/168; 5,428 | 121/168; 15,382 | 118/168; 29,938 | 50 | 31,643 |

Aggregate work was 63,842 completed kills, 153,516,694 HP damage, 2,582,954 absorbed damage, 1,038 unfinished targets, and 2,115 target-regain events. All 232 cap survivors had at least one kill and positive HP damage. Late-window values remain conditional on reaching the corresponding endpoint.

## Identity results

The table is the compact identity-level 5/15/30-minute readback. The complete per-observation paths, equipment, upgrades, abilities, Rune rules, stance, actual mastery gates, and runtime references remain in resolved-builds.json.

| Identity | N | 5m S/N; K | 15m S/N; K | 30m S/N; K | Deaths | Total kills |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| breadth-t3-apprentice-balanced | 8 | 5/8;154 | 2/8;217 | 2/8;413 | 6 | 679 |
| breadth-t3-apprentice-heavy | 4 | 1/4;18 | 0/4;null | 0/4;null | 4 | 136 |
| breadth-t3-apprentice-light | 8 | 3/8;87 | 1/8;60 | 0/8;null | 8 | 326 |
| breadth-t3-conduit-balanced | 4 | 2/4;27 | 2/4;89 | 2/4;178 | 2 | 182 |
| breadth-t3-conduit-heavy | 4 | 2/4;23 | 2/4;70 | 2/4;137 | 2 | 140 |
| breadth-t3-conduit-light | 4 | 2/4;32 | 2/4;93 | 2/4;189 | 2 | 192 |
| breadth-t3-slinger-balanced | 4 | 3/4;91 | 3/4;275 | 3/4;551 | 1 | 600 |
| breadth-t3-slinger-heavy | 4 | 4/4;136 | 4/4;416 | 4/4;853 | 0 | 853 |
| breadth-t3-slinger-light | 4 | 2/4;72 | 1/4;58 | 1/4;112 | 3 | 255 |
| breadth-t3-spirit-balanced | 4 | 4/4;176 | 4/4;524 | 3/4;627 | 1 | 838 |
| breadth-t3-spirit-heavy | 4 | 4/4;176 | 4/4;526 | 4/4;1039 | 0 | 1039 |
| breadth-t3-spirit-light | 4 | 4/4;135 | 4/4;348 | 3/4;397 | 1 | 505 |
| breadth-t3-squire-balanced | 8 | 6/8;171 | 6/8;559 | 6/8;1119 | 2 | 1172 |
| breadth-t3-squire-heavy | 4 | 3/4;91 | 3/4;272 | 3/4;537 | 1 | 587 |
| breadth-t3-squire-light | 8 | 6/8;224 | 6/8;669 | 6/8;1352 | 2 | 1402 |
| breadth-t3-striker-balanced | 8 | 6/8;234 | 6/8;730 | 6/8;1449 | 2 | 1466 |
| breadth-t3-striker-heavy | 8 | 6/8;244 | 4/8;528 | 4/8;1088 | 4 | 1246 |
| breadth-t3-striker-light | 4 | 2/4;39 | 2/4;122 | 2/4;266 | 2 | 281 |
| breadth-t4-apprentice-balanced-a | 4 | 4/4;187 | 4/4;570 | 4/4;1152 | 0 | 1152 |
| breadth-t4-apprentice-balanced-b | 4 | 4/4;201 | 4/4;609 | 4/4;1238 | 0 | 1238 |
| breadth-t4-apprentice-balanced-c | 4 | 4/4;207 | 4/4;604 | 4/4;1210 | 0 | 1210 |
| breadth-t4-apprentice-heavy-a | 4 | 4/4;190 | 4/4;546 | 4/4;1070 | 0 | 1070 |
| breadth-t4-apprentice-heavy-b | 4 | 4/4;174 | 4/4;523 | 4/4;1045 | 0 | 1045 |
| breadth-t4-apprentice-heavy-c | 4 | 4/4;118 | 4/4;355 | 4/4;699 | 0 | 699 |
| breadth-t4-apprentice-light-a | 4 | 4/4;175 | 4/4;565 | 4/4;1142 | 0 | 1142 |
| breadth-t4-apprentice-light-b | 4 | 4/4;166 | 4/4;501 | 4/4;1012 | 0 | 1012 |
| breadth-t4-apprentice-light-c | 4 | 4/4;185 | 4/4;570 | 4/4;1108 | 0 | 1108 |
| breadth-t4-conduit-balanced-a | 4 | 2/4;20 | 2/4;65 | 2/4;129 | 2 | 148 |
| breadth-t4-conduit-balanced-b | 4 | 4/4;114 | 3/4;232 | 3/4;487 | 1 | 549 |
| breadth-t4-conduit-balanced-c | 4 | 2/4;21 | 2/4;63 | 2/4;123 | 2 | 158 |
| breadth-t4-conduit-heavy-a | 8 | 7/8;133 | 5/8;222 | 5/8;457 | 3 | 619 |
| breadth-t4-conduit-heavy-b | 4 | 1/4;22 | 0/4;null | 0/4;null | 4 | 95 |
| breadth-t4-conduit-heavy-c | 4 | 4/4;101 | 3/4;184 | 2/4;149 | 2 | 403 |
| breadth-t4-conduit-light-a | 4 | 3/4;78 | 2/4;72 | 2/4;154 | 2 | 269 |
| breadth-t4-conduit-light-b | 4 | 3/4;59 | 3/4;171 | 2/4;129 | 2 | 303 |
| breadth-t4-conduit-light-c | 4 | 4/4;149 | 3/4;387 | 2/4;452 | 2 | 792 |
| breadth-t4-slinger-balanced-a | 4 | 4/4;209 | 4/4;651 | 4/4;1290 | 0 | 1290 |
| breadth-t4-slinger-balanced-b | 4 | 4/4;338 | 4/4;1035 | 4/4;2037 | 0 | 2037 |
| breadth-t4-slinger-balanced-c | 4 | 4/4;223 | 4/4;690 | 4/4;1383 | 0 | 1383 |
| breadth-t4-slinger-heavy-a | 8 | 8/8;599 | 8/8;1795 | 8/8;3649 | 0 | 3649 |
| breadth-t4-slinger-heavy-b | 4 | 4/4;214 | 4/4;632 | 4/4;1268 | 0 | 1268 |
| breadth-t4-slinger-heavy-c | 4 | 4/4;235 | 4/4;700 | 4/4;1417 | 0 | 1417 |
| breadth-t4-slinger-light-a | 4 | 4/4;223 | 4/4;692 | 4/4;1378 | 0 | 1378 |
| breadth-t4-slinger-light-b | 4 | 4/4;216 | 4/4;672 | 4/4;1372 | 0 | 1372 |
| breadth-t4-slinger-light-c | 4 | 4/4;162 | 4/4;476 | 4/4;955 | 0 | 955 |
| breadth-t4-spirit-balanced-a | 8 | 8/8;364 | 8/8;1028 | 8/8;1845 | 0 | 1845 |
| breadth-t4-spirit-balanced-b | 4 | 4/4;101 | 4/4;311 | 4/4;624 | 0 | 624 |
| breadth-t4-spirit-balanced-c | 4 | 4/4;218 | 4/4;695 | 4/4;1392 | 0 | 1392 |
| breadth-t4-spirit-heavy-a | 4 | 4/4;257 | 4/4;744 | 4/4;1507 | 0 | 1507 |
| breadth-t4-spirit-heavy-b | 4 | 4/4;230 | 4/4;706 | 4/4;1422 | 0 | 1422 |
| breadth-t4-spirit-heavy-c | 4 | 4/4;114 | 4/4;341 | 4/4;687 | 0 | 687 |
| breadth-t4-spirit-light-a | 4 | 2/4;146 | 2/4;419 | 2/4;860 | 2 | 865 |
| breadth-t4-spirit-light-b | 4 | 4/4;123 | 4/4;373 | 4/4;744 | 0 | 744 |
| breadth-t4-spirit-light-c | 4 | 4/4;220 | 4/4;661 | 4/4;1324 | 0 | 1324 |
| breadth-t4-squire-balanced-a | 4 | 2/4;30 | 2/4;94 | 2/4;192 | 2 | 233 |
| breadth-t4-squire-balanced-b | 4 | 2/4;31 | 2/4;102 | 2/4;204 | 2 | 260 |
| breadth-t4-squire-balanced-c | 4 | 2/4;40 | 2/4;112 | 2/4;228 | 2 | 280 |
| breadth-t4-squire-heavy-a | 8 | 7/8;243 | 6/8;589 | 6/8;1201 | 2 | 1275 |
| breadth-t4-squire-heavy-b | 8 | 6/8;179 | 6/8;550 | 6/8;1097 | 2 | 1123 |
| breadth-t4-squire-heavy-c | 4 | 4/4;148 | 4/4;480 | 4/4;949 | 0 | 949 |
| breadth-t4-squire-light-a | 4 | 4/4;219 | 4/4;693 | 4/4;1395 | 0 | 1395 |
| breadth-t4-squire-light-b | 4 | 4/4;225 | 4/4;680 | 4/4;1356 | 0 | 1356 |
| breadth-t4-squire-light-c | 4 | 4/4;211 | 4/4;645 | 4/4;1265 | 0 | 1265 |
| breadth-t4-striker-balanced-a | 4 | 2/4;156 | 2/4;460 | 2/4;920 | 2 | 922 |
| breadth-t4-striker-balanced-b | 4 | 2/4;166 | 2/4;502 | 2/4;1032 | 2 | 1036 |
| breadth-t4-striker-balanced-c | 4 | 2/4;156 | 2/4;471 | 2/4;956 | 2 | 958 |
| breadth-t4-striker-heavy-a | 4 | 1/4;56 | 0/4;null | 0/4;null | 4 | 129 |
| breadth-t4-striker-heavy-b | 8 | 4/8;125 | 3/8;334 | 3/8;668 | 5 | 719 |
| breadth-t4-striker-heavy-c | 4 | 2/4;93 | 1/4;155 | 0/4;null | 4 | 223 |
| breadth-t4-striker-light-a | 4 | 2/4;144 | 2/4;434 | 2/4;901 | 2 | 903 |
| breadth-t4-striker-light-b | 4 | 2/4;160 | 1/4;223 | 0/4;null | 4 | 432 |
| breadth-t4-striker-light-c | 4 | 1/4;79 | 1/4;230 | 0/4;null | 4 | 314 |

## Matched charm pairs

These are the 48 declared matched pairs. V is the Volcanic charm arm and M is the Mountain charm arm. Each outcome cell is outcome / elapsed seconds / total completed kills. Interval cells are kills in 0–5 / 5–15 / 15–30 minutes; null is an unobserved later interval after death, not measured zero combat. Lead compares total completed kills only.

| Identity | Fixture | Seed | V outcome / time / kills | M outcome / time / kills | V intervals | M intervals | Lead |
| --- | --- | ---: | --- | --- | --- | --- | --- |
| breadth-t3-apprentice-balanced | tundra-03 | 101009 | player-died / 461.1s / 23 | player-died / 73.6s / 3 | 16,null,null | null,null,null | V |
| breadth-t3-apprentice-balanced | tundra-03 | 101021 | window-ended / 1800s / 114 | player-died / 696.2s / 35 | 19,37,58 | 15,null,null | V |
| breadth-t3-apprentice-balanced | volcanic-03 | 101009 | window-ended / 1800s / 299 | player-died / 223.3s / 34 | 51,110,138 | null,null,null | V |
| breadth-t3-apprentice-balanced | volcanic-03 | 101021 | player-died / 785.1s / 141 | player-died / 174.6s / 30 | 53,null,null | null,null,null | V |
| breadth-t3-apprentice-light | tundra-03 | 101009 | player-died / 455.6s / 25 | player-died / 201.6s / 11 | 17,null,null | null,null,null | V |
| breadth-t3-apprentice-light | tundra-03 | 101021 | player-died / 269.3s / 18 | player-died / 1212.4s / 77 | null,null,null | 19,41,null | M |
| breadth-t3-apprentice-light | volcanic-03 | 101009 | player-died / 225.4s / 39 | player-died / 25.1s / 5 | null,null,null | null,null,null | V |
| breadth-t3-apprentice-light | volcanic-03 | 101021 | player-died / 785.7s / 137 | player-died / 81.5s / 14 | 51,null,null | null,null,null | V |
| breadth-t3-squire-balanced | tundra-03 | 101009 | window-ended / 1800s / 109 | window-ended / 1800s / 97 | 16,38,55 | 13,37,47 | V |
| breadth-t3-squire-balanced | tundra-03 | 101021 | window-ended / 1800s / 106 | window-ended / 1800s / 96 | 15,38,53 | 15,31,50 | V |
| breadth-t3-squire-balanced | volcanic-03 | 101009 | window-ended / 1800s / 349 | player-died / 280.8s / 46 | 54,118,177 | null,null,null | V |
| breadth-t3-squire-balanced | volcanic-03 | 101021 | window-ended / 1800s / 362 | player-died / 38.2s / 7 | 58,126,178 | null,null,null | V |
| breadth-t3-squire-light | tundra-03 | 101009 | window-ended / 1800s / 139 | window-ended / 1800s / 117 | 22,48,69 | 18,37,62 | V |
| breadth-t3-squire-light | tundra-03 | 101021 | window-ended / 1800s / 136 | window-ended / 1800s / 123 | 23,44,69 | 18,39,66 | V |
| breadth-t3-squire-light | volcanic-03 | 101009 | window-ended / 1800s / 411 | player-died / 89.4s / 20 | 72,140,199 | null,null,null | V |
| breadth-t3-squire-light | volcanic-03 | 101021 | window-ended / 1800s / 426 | player-died / 168.5s / 30 | 71,137,218 | null,null,null | V |
| breadth-t3-striker-balanced | tundra-03 | 101009 | window-ended / 1800s / 140 | window-ended / 1800s / 122 | 22,49,69 | 20,40,62 | V |
| breadth-t3-striker-balanced | tundra-03 | 101021 | window-ended / 1800s / 147 | window-ended / 1800s / 131 | 21,50,76 | 18,46,67 | V |
| breadth-t3-striker-balanced | volcanic-03 | 101009 | window-ended / 1800s / 431 | player-died / 42.3s / 9 | 75,145,211 | null,null,null | V |
| breadth-t3-striker-balanced | volcanic-03 | 101021 | window-ended / 1800s / 478 | player-died / 31.1s / 8 | 78,166,234 | null,null,null | V |
| breadth-t3-striker-heavy | tundra-03 | 101009 | window-ended / 1800s / 120 | player-died / 535.4s / 31 | 17,41,62 | 15,null,null | V |
| breadth-t3-striker-heavy | tundra-03 | 101021 | window-ended / 1800s / 125 | player-died / 247.7s / 10 | 19,39,67 | null,null,null | V |
| breadth-t3-striker-heavy | volcanic-03 | 101009 | window-ended / 1800s / 434 | player-died / 558.7s / 109 | 64,148,222 | 61,null,null | V |
| breadth-t3-striker-heavy | volcanic-03 | 101021 | window-ended / 1800s / 409 | player-died / 32.7s / 8 | 68,132,209 | null,null,null | V |
| breadth-t4-conduit-heavy-a | desert-03 | 101009 | window-ended / 1800s / 64 | window-ended / 1800s / 64 | 11,20,33 | 8,21,35 | tie |
| breadth-t4-conduit-heavy-a | desert-03 | 101021 | window-ended / 1800s / 70 | window-ended / 1800s / 67 | 7,24,39 | 7,22,38 | V |
| breadth-t4-conduit-heavy-a | graveyard-03 | 101009 | window-ended / 1800s / 192 | player-died / 497.1s / 61 | 32,70,90 | 33,null,null | V |
| breadth-t4-conduit-heavy-a | graveyard-03 | 101021 | player-died / 855.9s / 98 | player-died / 40.5s / 3 | 35,null,null | null,null,null | V |
| breadth-t4-slinger-heavy-a | desert-03 | 101009 | window-ended / 1800s / 254 | window-ended / 1800s / 230 | 46,84,124 | 41,73,116 | V |
| breadth-t4-slinger-heavy-a | desert-03 | 101021 | window-ended / 1800s / 242 | window-ended / 1800s / 224 | 34,86,122 | 36,66,122 | V |
| breadth-t4-slinger-heavy-a | graveyard-03 | 101009 | window-ended / 1800s / 681 | window-ended / 1800s / 663 | 118,220,343 | 113,210,340 | V |
| breadth-t4-slinger-heavy-a | graveyard-03 | 101021 | window-ended / 1800s / 687 | window-ended / 1800s / 668 | 109,226,352 | 102,231,335 | V |
| breadth-t4-spirit-balanced-a | desert-03 | 101009 | window-ended / 1800s / 129 | window-ended / 1800s / 56 | 16,50,63 | 14,27,15 | V |
| breadth-t4-spirit-balanced-a | desert-03 | 101021 | window-ended / 1800s / 88 | window-ended / 1800s / 114 | 17,32,39 | 22,40,52 | M |
| breadth-t4-spirit-balanced-a | graveyard-03 | 101009 | window-ended / 1800s / 350 | window-ended / 1800s / 566 | 66,107,177 | 104,220,242 | M |
| breadth-t4-spirit-balanced-a | graveyard-03 | 101021 | window-ended / 1800s / 381 | window-ended / 1800s / 161 | 64,123,194 | 61,65,35 | V |
| breadth-t4-squire-heavy-a | desert-03 | 101009 | window-ended / 1800s / 156 | window-ended / 1800s / 144 | 24,54,78 | 26,48,70 | V |
| breadth-t4-squire-heavy-a | desert-03 | 101021 | window-ended / 1800s / 149 | window-ended / 1800s / 146 | 24,52,73 | 22,48,76 | V |
| breadth-t4-squire-heavy-a | graveyard-03 | 101009 | window-ended / 1800s / 310 | player-died / 404.4s / 63 | 49,94,167 | 53,null,null | V |
| breadth-t4-squire-heavy-a | graveyard-03 | 101021 | window-ended / 1800s / 296 | player-died / 106.3s / 11 | 45,103,148 | null,null,null | V |
| breadth-t4-squire-heavy-b | desert-03 | 101009 | window-ended / 1800s / 115 | window-ended / 1800s / 118 | 19,43,53 | 20,40,58 | M |
| breadth-t4-squire-heavy-b | desert-03 | 101021 | window-ended / 1800s / 120 | window-ended / 1800s / 111 | 16,41,63 | 16,37,58 | V |
| breadth-t4-squire-heavy-b | graveyard-03 | 101009 | window-ended / 1800s / 316 | player-died / 108.8s / 20 | 56,103,157 | null,null,null | V |
| breadth-t4-squire-heavy-b | graveyard-03 | 101021 | window-ended / 1800s / 317 | player-died / 32.4s / 6 | 52,107,158 | null,null,null | V |
| breadth-t4-striker-heavy-b | desert-03 | 101009 | player-died / 328.4s / 20 | player-died / 53.6s / 2 | 18,null,null | null,null,null | V |
| breadth-t4-striker-heavy-b | desert-03 | 101021 | window-ended / 1800s / 118 | player-died / 24.7s / 0 | 18,37,63 | null,null,null | V |
| breadth-t4-striker-heavy-b | graveyard-03 | 101009 | window-ended / 1800s / 282 | player-died / 86.3s / 13 | 48,100,134 | null,null,null | V |
| breadth-t4-striker-heavy-b | graveyard-03 | 101021 | window-ended / 1800s / 268 | player-died / 148.7s / 16 | 41,90,137 | null,null,null | V |

## Package receipts and accessibility boundaries

Every resolved-build receipt records the actual skill path, display path, equipment and upgrades, ordered abilities, Rune rules, stance, Runic Point cost, free headroom, mastery/evolution gates, and initial HP/barrier. The observed budget / used / free Runic Point combinations were:

| Budget / used / free | Rows |
| --- | ---: |
| 38 / 33 / 5 | 44 |
| 38 / 36 / 2 | 52 |
| 47 / 36 / 11 | 8 |
| 47 / 40 / 7 | 100 |
| 47 / 43 / 4 | 132 |

The resolved receipts show global mastery 114 for 96 rows and 156 for 240 rows, with actual biome levels and the declared +5 upgrade/evolution/stance gates checked per package. All rows are synthetic mature-tier packages with declared gear and no acquisition, guardian, progression, economy, multiplayer, or live-player claim. Spare Runic Points were retained; they were not spent to force cosmetic budget equality.

## Death and delivery diagnostics

The 104 player deaths were 74 before five minutes, 21 between five and fifteen minutes, and 9 between fifteen and thirty minutes. Death-cause kinds were ranged 42, melee 35, DoT 25, and debt 2. The run records actual primary HP damage separately from absorbed damage; target regain and unfinished-target counts are retained as diagnostics. A cap survivor with a high kill count is not treated as proof of a universal farming rate, and an absorbed-only contact is not treated as HP damage.

Source-specific effective healing, overheal, and counterfactual damage lost remain unavailable in the existing recording. The report therefore does not reinterpret rounded heal events or authored Conduit offense weights as delivered DPS.

## Conduit disposition

Block C is omitted before execution: 0 planned, 0 completed, 0 failed, 0 not run. The sealed preparation diagnosis remains the only C evidence. In the prior Defensive Tundra trace, Glacier Bear remained at 4,313 HP while 2,151 direct damage events applied 0 HP damage and 14 absorbed each, totaling 30,114 absorbed HP; repeated aggro-session starts were consistent with barrier refresh behavior. In the prior Heavy Defensive Volcanic trace, authored offense was high but owner pressure and paid reconstruction remained material. No isolated correctness candidate was qualified, so no C arm, interval reduction, global multiplier, or reconstruction redesign was launched.

## Evidence and publication

Compact publication files:

- [results-summary.json](results-summary.json) — one row per planned observation.
- [resolved-builds.json](resolved-builds.json) — applied package and gate receipts.
- [raw-inventory.json](raw-inventory.json) — 4,682 retained external artifact hashes.
- [identity.json](identity.json), [manifest.json](manifest.json), and [complete.json](complete.json) — execution identity and terminal receipt.
- [packet-seal.json](packet-seal.json), [packet-qualified.json](packet-qualified.json), and [qualification-complete.json](qualification-complete.json) — sealed packet and zero-tick qualification references.
- [publication-receipt.json](publication-receipt.json) — measured result digest, source digest, inventory validation, and publication scope.

The retained raw streams remain under D:/mmo-idle/overnight-endurance-01/run-01 and were not copied into the repository. Rehash validation found 0 mismatches across 4,682 files and 4,865,211,362 bytes. The measured results-summary SHA-256 is 4df7fa0695fa9167d182adae90989b9731e240ad85aa4876104619a5ab25a69f; the source digest is 6f49c74da2c23037d06b1185ba4ba1682a8b9160552475e8deb517889ebddd3b.

The prior Farming sustain 01 report and compact evidence are published separately at reports/player-fast-pass/farming-sustain-01/run-01 and remain explicitly labeled as prior 300-second, seed-101003 evidence. No raw prior streams were copied into that path. Full repository tests and live browser playtesting were not run as part of this sealed campaign.
