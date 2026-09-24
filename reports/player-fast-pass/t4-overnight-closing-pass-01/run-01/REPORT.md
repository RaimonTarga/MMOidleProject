# T4 overnight closing pass 01 — run 01

## Short answer

The sealed overnight run completed once: 460/460 assigned rows, with 0 operational failures, 0 omitted rows, and 0 not-run rows. It produced 432 primary observations and 28 optional one-field contrasts. The primary screen recorded 234/324 farm lives reaching the 1,200,000 ms cap, 90 gameplay deaths, and 108/108 authoritative Iron-Crest Titan kills. The complete receipt outcome mix was 248 window-ended, 122 boss-killed, 90 player-died; optional rows added no deaths.

The strongest bounded result is encounter separation, not a global class ranking: all 108 Tundra farm lives reached cap, while Volcanic reached cap in 68/108 and Desert in 58/108. Control and candidate are inherited aliases of the same measured source (056b5cd66c2f6aeccca840265a0cbce30a2a77f3); this run does not measure a source delta and authorizes no patch adoption.

## Five prioritized findings

1. Execution integrity is clean. The dispatcher completed 460/460, with zero retries, zero family failures, zero partial terminal rows, and 3.06 hours of wall time. The gameplay-dead count is 90; those are observations, not operational failures.

2. Farm survival is fixture-shaped. Primary farm survival was 240/324 at five minutes, 237/324 at ten minutes, and 234/324 at twenty minutes. Volcanic deaths were 40; Desert deaths were 50; Tundra had none. 84 deaths <5m, 3 deaths 5-10m, 3 deaths 10-20m. The leading recorded killer types were sandspitter-cobra (44), ashspitter-salamander (28), ember-skink (7).

3. Useful work is conditional on the life reaching the endpoint. Primary farm lifetime work was 26,870 kills, 84,190,541 HP damage, 1,686,917 absorbed damage, and 491,592 damage events. The 20-minute endpoint sum was 25,097 kills across the 234 cap survivors; post-death endpoints are null. One cap survivor (closing-apprentice-heavy-a-V-s101033) retained only 14 kills with a 1102.4s kill gap, so cap completion is not a sustainable-winner claim.

4. Boss delivery is authoritative and complete. All 108 primary boss rows and all 14 optional boss rows reached Iron-Crest Titan kill with terminal HP zero. Primary kill time was 30.6-171.6s, median 74.6s. Retained boss summaries record 9,691 owner attack beats, 5,888 minion attack beats, and 11,473 owner hits on boss; these are delivery observations, not a body-count multiplier.

5. The optional contrasts are package evidence, not automatic tuning. The clearest paired contrast was T4 Spirit balanced-b with Stormbringer's Eruption Lash: Tundra endpoint kills changed from 48 to 143 across the two seeds and Titan median changed from 149.9s to 64.8s, with both arms surviving. Other one-field alternatives moved in opposite directions, including Ritualist Hastebound on Conduit balanced-c (Tundra 176 to 133 endpoint kills and Titan 72.4s to 79.5s) and Melter on Slinger heavy-a (Tundra 246 to 162 and Titan 30.6s to 52.8s). No alternative is adopted by this report.

## Three actionable decisions

1. Leave the measured source unchanged. Do not turn this same-source synthetic screen into a control/candidate delta, global damage rule, mandatory Rune rule, or economy claim.

2. Route the 90 deaths to encounter-specific setup/designer review. The 36 affected paths receive “setup advice needed” below because the run identifies pressure and delivery symptoms but does not isolate a class coefficient from fixture, targeting, or package construction. Preserve the 18 zero-death path dispositions as “leave unchanged” for now.

3. Retain the seven optional pair receipts as follow-up candidates only. If any is revisited, repeat its exact one-field pair in a separately assigned confirmation packet; do not repair, reseed, add alternatives, or infer numerical causality from this run.

## Frozen execution identity

| Field | Value |
| --- | --- |
| Experiment | t4-overnight-closing-pass-01 |
| Execution source commit | 056b5cd66c2f6aeccca840265a0cbce30a2a77f3 |
| Execution source SHA-256 | 779b644650b7c4221c62c99d36151cbd77fd1edae25c1459ecb61cdd686de009 |
| Hitboxes SHA-256 | 08bcc55633efe444d303c71977f7dcf87402157753af543e975e6c0c493afa83 |
| Fixed checkout | D:\mmo-idle\t4-overnight-closing-pass-01\source |
| World step / caps | 100 ms / 1200000 ms farm / 300000 ms boss |
| Stop rule | First player death for farm; authoritative boss kill or cap |
| Seeds | 101009 and 101033 |
| Synthetic / economy eligible | true / false |
| Execution model | One direct child, sequential queue, zero retries |
| Raw root | D:/mmo-idle/t4-overnight-closing-pass-01/run-01 |
| Measured wall time | 11025012 ms (3.06 h) |

The exact frozen verify command passed immediately before launch. The measured execution checkout was not edited, rebuilt, normalized, resealed, or used for publication. The terminal receipt is `complete.json`; it reports `stopReason: null` and `failure: null`.

## Ledger and coverage

| Block | Coverage | Planned | Completed | Failed | Not run |
| --- | --- | --- | --- | --- | --- |
| V | 54 T4 paths × 2 seeds; Volcanic farm | 108 | 108 | 0 | 0 |
| T | 54 T4 paths × 2 seeds; Tundra farm | 108 | 108 | 0 | 0 |
| D | 54 T4 paths × 2 seeds; Desert farm | 108 | 108 | 0 | 0 |
| M | 54 T4 paths × 2 seeds; Iron-Crest Titan boss | 108 | 108 | 0 | 0 |
| Optional | 7 declared one-field families × T/M × 2 seeds | 28 | 28 | 0 | 0 |
| Total | Primary 432 + optional 28 | 460 | 460 | 0 | 0 |

## Endpoint survival and work

Endpoint cells are `survived rows / rows in scope; cumulative endpoint kills`. They are repeated measurements on the same continuous life, not independent replications. A null post-death endpoint is not zero work.

| Scope | N | 5m | 10m | 20m | Deaths | Boss |
| --- | --- | --- | --- | --- | --- | --- |
| V Volcanic farm | 108 | 74/108; 4,952 | 71/108; 8,295 | 68/108; 12,529 | 40 | — |
| T Tundra farm | 108 | 108/108; 1,946 | 108/108; 3,941 | 108/108; 8,034 | 0 | — |
| D Desert farm | 108 | 58/108; 1,152 | 58/108; 2,283 | 58/108; 4,534 | 50 | — |
| M Mountain Titan boss | 108 | — | — | — | 0 | 108/108; 74.6s median (30.6-171.6s) |

| Seed | V: 20m S/N; K; deaths | T: 20m S/N; K; deaths | D: 20m S/N; K; deaths | M: kill/N; median time |
| --- | --- | --- | --- | --- |
| 101009 | 34/54; 8,253; 20 deaths | 54/54; 3,980; 0 deaths | 29/54; 2,269; 25 deaths | 54/54; 74.6s |
| 101033 | 34/54; 4,276; 20 deaths | 54/54; 4,054; 0 deaths | 29/54; 2,265; 25 deaths | 54/54; 74.6s |

### Per-life interval work

Each interval cell is `kills; observed lives / lives in scope; mean kills/min over observed lives`. The intervals are 0–5, 5–10, and 10–20 minutes. This is deliberately conditional on the rows that reached each interval; it does not pool survivor-only rates into a universal rate.

| Scope | N | 0–5m | 5–10m | 10–20m | First kill median (s) | Kill gap median / max (s) | HP-progress gap median / max (s) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| All primary farm | 324 | 8,050; 240/324; 6.71 | 6,689; 237/324; 5.64 | 11,043; 234/324; 4.72 | 8.5 | 30.4 / 1102.4 | 10.9 / 1102.4 |
| V | 108 | 4,952; 74/108; 13.38 | 3,563; 71/108; 10.04 | 4,699; 68/108; 6.91 | 4.8 | 27.3 / 1102.4 | 16.5 / 1102.4 |
| T | 108 | 1,946; 108/108; 3.60 | 1,995; 108/108; 3.69 | 4,093; 108/108; 3.79 | 11.7 | 33.2 / 228.5 | 9.8 / 16.0 |
| D | 108 | 1,152; 58/108; 3.97 | 1,131; 58/108; 3.90 | 2,251; 58/108; 3.88 | 8.6 | 27.0 / 126.1 | 10.7 / 28.3 |

## 54-path × four-context disposition map

Every primary path has two seeds in each of V, T, D, and M. V/T/D cells are 20-minute endpoint `survived / 2; endpoint kills`; M is the median authoritative boss-kill time across the two seeds. Farm deaths are shown as deaths / 6 farm rows. Endpoint kills are not a sustainable ranking and do not replace lifetime work in `results-summary.json`.

| Path | V 20m S/2; K | T 20m S/2; K | D 20m S/2; K | M boss median (s) | Farm deaths / 6 | Provisional disposition |
| --- | --- | --- | --- | --- | --- | --- |
| breadth-t4-apprentice-balanced-a | 2/2; 351 | 2/2; 222 | 0/2; 0 | 51.9 | 2/6 | setup advice needed |
| breadth-t4-apprentice-balanced-b | 2/2; 119 | 2/2; 193 | 0/2; 0 | 52.2 | 2/6 | setup advice needed |
| breadth-t4-apprentice-balanced-c | 2/2; 131 | 2/2; 205 | 0/2; 0 | 47.8 | 2/6 | setup advice needed |
| breadth-t4-apprentice-heavy-a | 2/2; 165 | 2/2; 81 | 0/2; 0 | 88.2 | 2/6 | setup advice needed |
| breadth-t4-apprentice-heavy-b | 2/2; 257 | 2/2; 54 | 0/2; 0 | 109.2 | 2/6 | setup advice needed |
| breadth-t4-apprentice-heavy-c | 2/2; 189 | 2/2; 102 | 0/2; 0 | 65.5 | 2/6 | setup advice needed |
| breadth-t4-apprentice-light-a | 1/2; 112 | 2/2; 182 | 0/2; 0 | 50.8 | 3/6 | setup advice needed |
| breadth-t4-apprentice-light-b | 2/2; 263 | 2/2; 168 | 0/2; 0 | 46.8 | 2/6 | setup advice needed |
| breadth-t4-apprentice-light-c | 2/2; 457 | 2/2; 171 | 0/2; 0 | 60.3 | 2/6 | setup advice needed |
| breadth-t4-conduit-balanced-a | 1/2; 246 | 2/2; 175 | 2/2; 136 | 83.6 | 1/6 | setup advice needed |
| breadth-t4-conduit-balanced-b | 0/2; 0 | 2/2; 202 | 2/2; 201 | 64.3 | 2/6 | setup advice needed |
| breadth-t4-conduit-balanced-c | 0/2; 0 | 2/2; 176 | 2/2; 139 | 72.4 | 2/6 | setup advice needed |
| breadth-t4-conduit-heavy-a | 0/2; 0 | 2/2; 126 | 2/2; 112 | 78.9 | 2/6 | setup advice needed |
| breadth-t4-conduit-heavy-b | 0/2; 0 | 2/2; 73 | 2/2; 72 | 162.9 | 2/6 | setup advice needed |
| breadth-t4-conduit-heavy-c | 0/2; 0 | 2/2; 111 | 2/2; 110 | 80.1 | 2/6 | setup advice needed |
| breadth-t4-conduit-light-a | 0/2; 0 | 2/2; 154 | 2/2; 101 | 138.7 | 2/6 | setup advice needed |
| breadth-t4-conduit-light-b | 0/2; 0 | 2/2; 133 | 2/2; 112 | 144.7 | 2/6 | setup advice needed |
| breadth-t4-conduit-light-c | 0/2; 0 | 2/2; 173 | 2/2; 141 | 87.9 | 2/6 | setup advice needed |
| breadth-t4-slinger-balanced-a | 2/2; 131 | 2/2; 175 | 0/2; 0 | 63.0 | 2/6 | setup advice needed |
| breadth-t4-slinger-balanced-b | 2/2; 685 | 2/2; 353 | 2/2; 343 | 74.1 | 0/6 | leave unchanged |
| breadth-t4-slinger-balanced-c | 2/2; 320 | 2/2; 179 | 0/2; 0 | 57.5 | 2/6 | setup advice needed |
| breadth-t4-slinger-heavy-a | 0/2; 0 | 2/2; 246 | 2/2; 212 | 30.6 | 2/6 | setup advice needed |
| breadth-t4-slinger-heavy-b | 2/2; 560 | 2/2; 170 | 0/2; 0 | 52.6 | 2/6 | setup advice needed |
| breadth-t4-slinger-heavy-c | 2/2; 563 | 2/2; 240 | 0/2; 0 | 54.9 | 2/6 | setup advice needed |
| breadth-t4-slinger-light-a | 2/2; 346 | 2/2; 190 | 0/2; 0 | 61.7 | 2/6 | setup advice needed |
| breadth-t4-slinger-light-b | 2/2; 341 | 2/2; 210 | 0/2; 0 | 59.4 | 2/6 | setup advice needed |
| breadth-t4-slinger-light-c | 2/2; 587 | 2/2; 70 | 0/2; 0 | 93.8 | 2/6 | setup advice needed |
| breadth-t4-spirit-balanced-a | 0/2; 0 | 2/2; 154 | 0/2; 0 | 70.7 | 4/6 | setup advice needed |
| breadth-t4-spirit-balanced-b | 0/2; 0 | 2/2; 48 | 0/2; 0 | 149.9 | 4/6 | setup advice needed |
| breadth-t4-spirit-balanced-c | 0/2; 0 | 2/2; 195 | 0/2; 0 | 50.6 | 4/6 | setup advice needed |
| breadth-t4-spirit-heavy-a | 0/2; 0 | 2/2; 102 | 0/2; 0 | 74.6 | 4/6 | setup advice needed |
| breadth-t4-spirit-heavy-b | 0/2; 0 | 2/2; 103 | 0/2; 0 | 72.0 | 4/6 | setup advice needed |
| breadth-t4-spirit-heavy-c | 0/2; 0 | 2/2; 49 | 0/2; 0 | 93.9 | 4/6 | setup advice needed |
| breadth-t4-spirit-light-a | 0/2; 0 | 2/2; 99 | 0/2; 0 | 81.7 | 4/6 | setup advice needed |
| breadth-t4-spirit-light-b | 0/2; 0 | 2/2; 41 | 0/2; 0 | 116.6 | 4/6 | setup advice needed |
| breadth-t4-spirit-light-c | 0/2; 0 | 2/2; 153 | 0/2; 0 | 64.3 | 4/6 | setup advice needed |
| breadth-t4-squire-balanced-a | 2/2; 317 | 2/2; 91 | 2/2; 92 | 159.9 | 0/6 | leave unchanged |
| breadth-t4-squire-balanced-b | 2/2; 234 | 2/2; 97 | 2/2; 98 | 171.6 | 0/6 | leave unchanged |
| breadth-t4-squire-balanced-c | 2/2; 322 | 2/2; 119 | 2/2; 113 | 137.5 | 0/6 | leave unchanged |
| breadth-t4-squire-heavy-a | 2/2; 385 | 2/2; 125 | 2/2; 126 | 81.1 | 0/6 | leave unchanged |
| breadth-t4-squire-heavy-b | 2/2; 311 | 2/2; 134 | 2/2; 125 | 103.2 | 0/6 | leave unchanged |
| breadth-t4-squire-heavy-c | 0/2; 0 | 2/2; 97 | 2/2; 107 | 119.1 | 2/6 | setup advice needed |
| breadth-t4-squire-light-a | 2/2; 389 | 2/2; 88 | 2/2; 89 | 162.5 | 0/6 | leave unchanged |
| breadth-t4-squire-light-b | 2/2; 475 | 2/2; 191 | 2/2; 214 | 79.3 | 0/6 | leave unchanged |
| breadth-t4-squire-light-c | 2/2; 213 | 2/2; 87 | 2/2; 93 | 160.6 | 0/6 | leave unchanged |
| breadth-t4-striker-balanced-a | 2/2; 533 | 2/2; 170 | 2/2; 221 | 65.1 | 0/6 | leave unchanged |
| breadth-t4-striker-balanced-b | 2/2; 594 | 2/2; 206 | 2/2; 255 | 45.6 | 0/6 | leave unchanged |
| breadth-t4-striker-balanced-c | 2/2; 899 | 2/2; 198 | 2/2; 235 | 52.5 | 0/6 | leave unchanged |
| breadth-t4-striker-heavy-a | 2/2; 401 | 2/2; 179 | 2/2; 192 | 76.5 | 0/6 | leave unchanged |
| breadth-t4-striker-heavy-b | 2/2; 121 | 2/2; 90 | 2/2; 107 | 144.7 | 0/6 | leave unchanged |
| breadth-t4-striker-heavy-c | 2/2; 588 | 2/2; 120 | 2/2; 136 | 110.2 | 0/6 | leave unchanged |
| breadth-t4-striker-light-a | 2/2; 263 | 2/2; 170 | 2/2; 187 | 84.1 | 0/6 | leave unchanged |
| breadth-t4-striker-light-b | 2/2; 508 | 2/2; 192 | 2/2; 236 | 64.0 | 0/6 | leave unchanged |
| breadth-t4-striker-light-c | 2/2; 153 | 2/2; 202 | 2/2; 229 | 68.7 | 0/6 | leave unchanged |

## Optional one-field contrasts

The 28 optional rows are matched to their primary observation by `referenceObservationId`. Each cell is `primary / alternative / alternative minus primary`; T is the 20-minute endpoint kill sum over the two seeds, and M is median boss time in seconds.

| Path | One-field alternative | T endpoint kills | M boss seconds |
| --- | --- | --- | --- |
| breadth-t4-apprentice-heavy-a | weapon=mountain-earthsunder-maul. Icebreaker slower heavier Attack versus maintaining direct-hit windows | 81 / 82 / 1 | 88.2 / 69.1 / -19.1 |
| breadth-t4-conduit-balanced-c | relic=relic-hastebound-dial. Ritualist reconstruction frequency versus potency; no direct DPS multiplier inference | 176 / 133 / -43 | 72.4 / 79.5 / 7.1 |
| breadth-t4-slinger-heavy-a | core=core-tempered. Melter on-hit amplification versus general damage and owner HP | 246 / 162 / -84 | 30.6 / 52.8 / 22.2 |
| breadth-t4-spirit-balanced-b | weapon=volcanic-eruption-lash. Stormbringer cadence versus empowered payload across four sequential strikes | 48 / 143 / 95 | 149.9 / 64.8 / -85.1 |
| breadth-t4-spirit-heavy-c | weapon=graveyard-plague-axe. Tempest charge/extension opportunities versus slow weapon; whole weapon tradeoff | 49 / 223 / 174 | 93.9 / 30.1 / -63.8 |
| breadth-t4-spirit-light-b | weapon=graveyard-plague-axe. Surge medium cadence and dead swings versus slow high-Attack reference | 41 / 196 / 155 | 116.6 / 52.7 / -63.9 |
| breadth-t4-squire-balanced-a | weapon=volcanic-eruption-lash. Reverb attacks bank next execution; faster delivery versus empowered weapon payload | 91 / 114 / 23 | 159.9 / 164.6 / 4.7 |

All 28 optional rows completed without gameplay death. The same-source identity is inherited on both sides; these are build/package contrasts, not a source treatment effect.

## Boss evidence and response boundary

All primary and optional M rows ended with authoritative Titan kill evidence and terminal boss HP zero. No boss row was unsuccessful, so there is no unsuccessful remaining-HP sample to report. Across primary boss summaries, owner minimum HP fraction reached 43.5%; recorded owner HP loss ranged 0.0–1747.9 HP with median 96.6; peak one-second burst ranged 0.0–291.3. Boss cast starts ranged 4–34, and no primary boss row recorded adds alive at the terminal check. These fields show actual danger and response opportunity in the retained summaries; they do not establish that a particular payment, cast, or body caused the kill.

### Conduit delivery check

The selected Conduit balanced-c receipt keeps owner and summon delivery separate. In the primary Tundra row for seed 101009, the raw summary recorded 0 owner attack beats, 6,047 total minion attack beats, 90 endpoint kills, and no player death. Its matched Hastebound alternative recorded 0 owner attack beats, 4,806 minion attack beats, 65 endpoint kills, and no player death. In the paired boss rows, primary recorded 230 owner hits on Titan, 282 minion attack beats, 14 Titan Charge starts, 0 landed Discharges, and 800 HP lost; Hastebound recorded 215 owner hits, 239 minion beats, 16 Titan Charge starts, 0 landed Discharges, and the same 800 HP lost. The primary/alternative Titan times were 72.4s/79.5s. No body-count multiplier, replacement-affordability claim, formation-loss claim, or owner-payment causality is inferred from these receipts.

## Death and delivery diagnostics

The 90 primary death events were ranged 54, dot 21, melee 14, debt 1. The leading killer type IDs were sandspitter-cobra 44, ashspitter-salamander 28, ember-skink 7, dune-basilisk 3. Across the 324 primary farm raw summaries, target histories contain 26,449 target records, 494 censored/unfinished targets, 641 HP-regain observations, 15,347 combat episodes, and 5,610 late joiners. These are retained delivery diagnostics, not independent balance coefficients.

Selected raw evidence:

- The earliest primary death was `closing-apprentice-heavy-a-D-s101033` at 16.4s: sandspitter-cobra damage, zero kills, 109.8 pipeline damage in the captured final incoming sample, and the last HP progress at 15.8s. The guard receipt records {"cleanse":2,"second-wind":1,"brace":1} casts and no HP-threshold opportunity; this is a setup/encounter trace, not a class-wide coefficient proof.
- The earliest selected Volcanic death was `closing-spirit-light-c-V-s101009` at 30.0s. Its terminal transition retained 800 ms of heat ramp accumulation; the raw Heat maxStacks field was 0 and Ash Burn was 4 stacks. The raw target history recorded 7 kills before death. Heat and DoT are observed pressure signals; no numerical change is proposed from this single trace.
- The largest farm kill and HP-progress gaps were both 1102.4s in `closing-apprentice-heavy-a-V-s101033`. This cap survivor is retained as a stalled-delivery outlier, not a winner.

Source-specific healing, overheal, and counterfactual damage lost remain unavailable in the existing stream. HP damage and absorbed damage are reported separately; no absorbed-only contact is treated as HP damage.

## Evidence and publication

The compact publication bundle is:

- `REPORT.md` — this bounded decision report.
- `PATCH_PROPOSALS.md` — no numerical patch passed the evidence bar; no patch was adopted.
- `results-summary.json` — all 460 row outcomes, endpoints, intervals, death evidence, boss evidence, and external summary pointers.
- `manifest.json` — sealed 460-case manifest.
- `identity.json` — measured source and hitbox identity.
- `resolved-builds.json` — applied/resolved build receipts for every row.
- `complete.json` — terminal completion receipt.
- `raw-inventory.json` — compact inventory and hashes for the external raw streams under `D:/mmo-idle/t4-overnight-closing-pass-01/run-01`.
- `seal.json`, `qualification-complete.json`, and `receipt-check-complete.json` — packet provenance and pre-combat qualification receipts.
- `publication-validation.json` — JSON checks and the 6,430-entry external inventory rehash (17,144,135,228 bytes; zero missing, size, or SHA-256 mismatches).
- `publication-receipt.json` — measured source, terminal counts, wall time, compact artifact hashes, and publication path.

Bulky JSONL streams and per-case raw artifacts were not copied into Git. The raw inventory retains their external absolute paths and hashes. Publication validation and the remote commit are recorded separately after the staged allowlist is checked.
