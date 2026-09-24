# Volcano Heat management 01 — run 01

## Disposition

Revise a named aspect for designer approval: retain the Heat-management candidate as a promising bounded signal, but revise and re-verify the `Wait It Out` interruption contract and telemetry before adoption. No automatic follow-up run is authorized by this report.

The managed arm (`H2`, threshold `25 → 10`) completed all 18 H observations without a death or operational fault. It produced 2,698 kills versus 1,638 for `H0` and 1,113 for ordinary `Wait It Out` (`H1`), while cumulative managed hold stayed below the 25% review target in every H2 life (maximum 18.90%). Heat peaks were 25–38 in H2, compared with 33–128 in H0. The result is encouraging but not universal: H2 underperformed H0 and H1 on the matched Striker seed `101033`, and that H2 life stopped making progress after 193.9 s.

The blocking review item is a bounded state-trace ambiguity. In `heat-slinger-light-a-H2-s101009`, three 100 ms samples recorded `phase=ACTIVE`, `state=waiting`, `waitHold=true`, `blockedBy=heat-above-10`, with owner threats of 1, 1, and 5 at 1,608,700 ms, 1,616,000 ms, and 2,290,300 ms. This does not prove that damage was ignored, but it means the current evidence does not establish the required “no idle under attack” invariant. The named revision is to make interruption semantics and their receipt unambiguous, then obtain designer approval before any adoption decision.

## Short answer and run ledger

This was a synthetic, fixed-fixture combat run (`economyEligible=false`), not live-player, acquisition, economy, deployment, or universal balance evidence. The exact sealed order ran once from the candidate checkout: no retries, reseeding, adaptive tuning, extra cases, source edits, package changes, or deployment were made.

| Scope | Planned | Completed | Deaths | Failed | Omitted | Not run |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| H primary rows | 18 | 18 | 0 | 0 | 0 | 0 |
| N boundary rows | 4 | 4 | 0 | 0 | 0 | 0 |
| B boundary rows | 4 | 4 | 0 | 0 | 0 | 0 |
| Total | 26 | 26 | 0 | 0 | 0 | 0 |

The final receipt reports `completed=26`, `newCompleted=26`, `qualified=0`, `combatObservations=26`, and no failure. Outcomes were 22 `window-ended` lives and 4 `boss-killed` lives. H lives ran to the 2,400,000 ms cap; N lives ran to 600,000 ms; B lives ended at the boss terminal. A cap-ended life is finite survival through its window, not indefinite sustain.

## Frozen execution identity

| Field | Value |
| --- | --- |
| Experiment / attempt | `volcano-heat-management-01` / `run-01` |
| Candidate source commit | `25289e490d4bfb53dd440ba436a67f596e5b91c4` |
| Candidate source SHA-256 | `880133f8c727489979a523191862ecae9f7431034b800606b2ebfee0caa3abe3` |
| Baseline source commit | `268148d269b87311eaa1ae4b053baeb6571c747a` |
| Baseline source SHA-256 | `472792d6bdaceb6bcf719f9a09da0fd4e513f6f32d91c557fdfffac0b8182649` |
| Node runtime | `v22.16.0` |
| Hitboxes SHA-256 | `08bcc55633efe444d303c71977f7dcf87402157753af543e975e6c0c493afa83` |
| Packet | `D:/mmo-idle/volcano-heat-management-01/packet` |
| Candidate checkout | `D:/mmo-idle/volcano-heat-management-01/candidate` |
| Baseline checkout | `D:/mmo-idle/volcano-heat-management-01/baseline` |
| Raw execution root | `D:/mmo-idle/volcano-heat-management-01/run-01` |
| Launch | `2026-09-24T07:28:13.832Z` |
| Dispatcher wall time | `2,735,289 ms` |
| Fixture | `node-t4-volcanic-01` |
| Seeds | `101009`, `101033` |
| Tick / H cap | `100 ms` / `2,400,000 ms` |
| N cap / B cap | `600,000 ms` / `300,000 ms` |
| Stop rule | First owner death; otherwise the block cap or boss terminal |
| Worker / retries | One worker / zero retries |

The packet seal hashes are preserved in `seal.json`: manifest `3487b42cdad9cae37213e3b679ab141336cd529f9943b0704cedc1a5e93efb00`, paired identity `8d811cbf295fea683f4d506f44dc5f026c5763204dc559001a8e7154f4f72672`, control identity `781204e6bb4ab2e9bf9ba02ea6f925c697e80c06152fbbaf6f90b1d469e76233`, and candidate identity `cde2496e2cb858a299ace5738506e70b9d12c0238df578367bb3fb68ca04b9df`.

## Preparation and receipt boundary

Preparation completed focused typecheck, build, and the five named Heat/Rune/targeting test files. The build retained existing Vite chunk-size warnings. Full-suite tests were not run and browser live play was not performed. Qualification and receipt replay each completed all 26 rows with zero combat observations, byte-identical replay, and preparation receipt hash `8df4b0e15a49b48a73755952a17b5d251498c9c41ecb12cacd3636946252d754`. Preparation raw inventory was 260 files / 2,354,948 bytes with zero mismatches. Those construction checks are kept distinct from the 26 combat observations in this run.

The run-level raw inventory contains 374 external files totaling 1,578,592,821 bytes. A final readback found zero missing files and zero SHA-256 mismatches. Raw event/sample streams remain at the external raw root; they are not copied into this Git publication.

## Exact package and mode boundary

The three H policies use the same matched identity, gear, abilities, stance, progression snapshot, initial roster hash, and seed. Only the exact Rune policy and its declared RP cost differ.

| Policy | Exact added rule | RP cost by package |
| --- | --- | --- |
| `H0` | No `Wait It Out` rule | Striker 40; Apprentice 40; Slinger 43 |
| `H1` | `{conditionId:"always", actionId:"wait-it-out"}` | Striker 41; Apprentice 41; Slinger 44 |
| `H2` | `{conditionId:"always", actionId:"wait-it-out", waitOutMode:"heat-managed"}` | Striker 41; Apprentice 41; Slinger 44 |

All H packages retained global mastery 148, the sealed mastery levels, `+4` equipment, and support `+0`. The full per-row package readback and mode fields are in `resolved-builds.json`; the candidate/control source and runtime receipts are in `candidate-identity.json` and `control-identity.json`.

| Matched package | Weapon | Armor / recovery / mobility | Core / relic | Stance and techniques |
| --- | --- | --- | --- | --- |
| Striker | `volcanic-eruption-lash` | `volcanic-vest-t4` / `volcanic-charm-t4` / `mountain-boots-t4` | `core-bruiser` / `relic-equilibrium-shard` | Offensive; `sweep`, `frenzy`, `expose-weakness` |
| Apprentice | `graveyard-plague-axe` | `volcanic-vest-t4` / `volcanic-charm-t4` / `desert-boots-t4` | `core-tempered` / `relic-equilibrium-shard` | Defensive; `contagion`, `frenzy` |
| Slinger | `jungle-deathfang-rapier` | `volcanic-vest-t4` / `volcanic-charm-t4` / `desert-boots-t4` | `core-catalyst` / `relic-equilibrium-shard` | Offensive; `sweep`, `frenzy`, `expose-weakness` |

The native guards remained `second-wind`, `brace`, and `cleanse` for the H packages. N and B were separate unequipped-mode boundaries and were not treated as H throughput evidence.

## H results

### Aggregate policy totals

| Policy | Completed kills | HP damage | Heat hold / ordinary wait | Hold share of 14.4M ms | Peak Heat range |
| --- | ---: | ---: | ---: | ---: | ---: |
| `H0` | 1,638 | 2,874,430 | 0 ms | 0.00% | 33–128 |
| `H1` | 1,113 | 1,910,284 | 3,689,900 ms wait | 25.62% | 5–11 |
| `H2` | 2,698 | 4,591,906 | 1,625,200 ms hold | 11.29% | 25–38 |

Across the six matched identity/seed pairs, H2 beat H0 on 5/6 and H1 on 5/6. Aggregate H2 was +64.7% kills and +59.8% HP damage versus H0, and +142.3% kills and +140.4% HP damage versus H1. These are fixed two-seed, fixed-fixture comparisons; HP damage is reported as measured work, not exclusive healing or damage attribution.

### Matched final totals

| Identity / seed | H0 kills | H1 kills | H2 kills | H2 vs H0 | H2 vs H1 | H2 peak / hold |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Striker / `101009` | 734 | 90 | 872 | +18.8% | +868.9% | 28 / 7.38% |
| Apprentice / `101009` | 206 | 161 | 408 | +98.1% | +153.4% | 34 / 17.57% |
| Slinger / `101009` | 277 | 385 | 673 | +143.0% | +74.8% | 29 / 18.90% |
| Striker / `101033` | 207 | 77 | 74 | -64.3% | -3.9% | 25 / 0.61% |
| Apprentice / `101033` | 145 | 261 | 386 | +166.2% | +47.9% | 38 / 15.25% |
| Slinger / `101033` | 69 | 139 | 285 | +313.0% | +105.0% | 30 / 8.00% |

### Cumulative kills at 5 / 10 / 20 / 30 / 40 minutes

Each cell is `5m / 10m / 20m / 30m / 40m`.

| Identity / seed | H0 | H1 | H2 |
| --- | --- | --- | --- |
| Striker / `101009` | 102 / 198 / 387 / 585 / 734 | 54 / 90 / 90 / 90 / 90 | 104 / 212 / 442 / 654 / 872 |
| Apprentice / `101009` | 59 / 125 / 206 / 206 / 206 | 36 / 66 / 134 / 161 / 161 | 47 / 99 / 200 / 304 / 408 |
| Slinger / `101009` | 110 / 210 / 277 / 277 / 277 | 51 / 106 / 198 / 297 / 385 | 91 / 178 / 343 / 507 / 673 |
| Striker / `101033` | 121 / 207 / 207 / 207 / 207 | 55 / 77 / 77 / 77 / 77 | 74 / 74 / 74 / 74 / 74 |
| Apprentice / `101033` | 59 / 118 / 145 / 145 / 145 | 41 / 64 / 131 / 201 / 261 | 46 / 97 / 193 / 289 / 386 |
| Slinger / `101033` | 69 / 69 / 69 / 69 / 69 | 54 / 102 / 139 / 139 / 139 | 84 / 170 / 285 / 285 / 285 |

### Interval kills

Each cell is `0–10m / 10–20m / 20–30m / 30–40m`.

| Identity / seed | H0 | H1 | H2 |
| --- | --- | --- | --- |
| Striker / `101009` | 198 / 189 / 198 / 149 | 90 / 0 / 0 / 0 | 212 / 230 / 212 / 218 |
| Apprentice / `101009` | 125 / 81 / 0 / 0 | 66 / 68 / 27 / 0 | 99 / 101 / 104 / 104 |
| Slinger / `101009` | 210 / 67 / 0 / 0 | 106 / 92 / 99 / 88 | 178 / 165 / 164 / 166 |
| Striker / `101033` | 207 / 0 / 0 / 0 | 77 / 0 / 0 / 0 | 74 / 0 / 0 / 0 |
| Apprentice / `101033` | 118 / 27 / 0 / 0 | 64 / 67 / 70 / 60 | 97 / 96 / 96 / 97 |
| Slinger / `101033` | 69 / 0 / 0 / 0 | 102 / 37 / 0 / 0 | 170 / 115 / 0 / 0 |

### H2 Heat and interruption telemetry

`Hold` is managed decision-state occupancy. `Req / wait / resume` counts state changes in the final receipt, not raw samples. Minimum HP is the lowest observed owner HP divided by the owner maximum HP for that row.

| Identity / seed | Hold | Peak | Req / wait / resume | Native-recovery overlap | Minimum owner HP | Last kill / longest gap |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Striker / `101009` | 177.1 s / 7.38% | 28 | 4 / 11 / 11 | 9.4 s | 397.3 / 714 (55.6%) | 39m56.1s / 27.4s |
| Apprentice / `101009` | 421.7 s / 17.57% | 34 | 21 / 23 / 23 | 23.8 s | 283.4 / 619 (45.8%) | 39m51.6s / 30.5s |
| Slinger / `101009` | 453.6 s / 18.90% | 29 | 20 / 28 / 25 | 10.3 s | 395.1 / 506 (78.1%) | 39m58.1s / 30.2s |
| Striker / `101033` | 14.6 s / 0.61% | 25 | 0 / 1 / 1 | 0 s | 474.6 / 714 (66.5%) | 3m13.9s / 36m46.1s |
| Apprentice / `101033` | 366.1 s / 15.25% | 38 | 18 / 21 / 23 | 32.5 s | 321.2 / 619 (51.9%) | 39m55.3s / 31.4s |
| Slinger / `101033` | 192.1 s / 8.00% | 30 | 7 / 11 / 11 | 1.0 s | 378.7 / 506 (74.8%) | 17m07.0s / 22m53.0s |

All H2 rows ended with the owner at full terminal HP, but that endpoint is not a substitute for the minimum-HP trace or an indefinite-sustain claim. H2’s summed native-recovery overlap was 77.0 s; it is reported as a measured overlap and not assigned exclusively to any healing or damage source.

## Boundary checks

### N: six-hundred-second unequipped Tundra controls

Candidate and baseline matched exactly by seed in this boundary: same outcome, kills, HP damage, endpoint owner HP, maximum HP, and barrier.

| Seed | Outcome | Kills | HP damage | Terminal owner |
| --- | --- | ---: | ---: | --- |
| `101009` | `window-ended` at 600 s | 44 | 204,386 | 491 / 523 HP; barrier 212 |
| `101033` | `window-ended` at 600 s | 40 | 206,064 | 518.6144 / 523 HP; barrier 212 |

These N rows are source-drift boundaries, not H throughput evidence. Their post-600 s endpoints are `null` by the finite N cap.

### B: T3 Volcano boss boundary

Both candidate and baseline killed the boss at 65,600 ms for both seeds. In each row the boss terminal HP was 0 and the owner terminal endpoint was 355 / 355 HP with barrier 0. B uses boss-kill semantics; ordinary mob `kills` and `hpDamage` fields are not used for this boundary, and post-terminal endpoints are `null`.

| Seed | Candidate | Baseline | Boss terminal | Owner terminal |
| --- | --- | --- | --- | --- |
| `101009` | boss-killed at 65,600 ms | boss-killed at 65,600 ms | 0 HP | 355 / 355 HP |
| `101033` | boss-killed at 65,600 ms | boss-killed at 65,600 ms | 0 HP | 355 / 355 HP |

N/B equality is current-source regression evidence only; it is not a claim that historical runtime or live-player behavior has been reproduced.

## Risks and closeout

The run resolves the sealed question for this bounded fixture: the managed threshold can reduce observed Heat and avoid the long post-peak stalls seen in several H0/H1 lives while retaining finite-window survival. It does not clear the release-risk issues carried by the preparation closeout: early Desert ranged/pack pressure, early Jungle/Volcano pressure, the old T2 Plains opening, the T3 Apprentice Volcano finisher, and the stalled Icebreaker path. Those issues remain in `CLASS_CLOSEOUT.md`; positive Heat results do not erase them.

The evidence supports a named revision, not adoption:

1. Specify and instrument the interruption contract so an active owner or summon threat immediately removes `waitHold`, or records an explicit, semantically valid grace period with no damage-suppression ambiguity.
2. Preserve the current H2 receipts as the bounded reference. Do not change the threshold, seeds, packages, or case order in this packet.
3. Treat the Striker `101033` stall and the inherited class-closeout risks as separate review items. Do not generalize H2 into a class, route, economy, or indefinite-sustain conclusion.

No source edit, deployment, merge to `develop`, force push, or automatic follow-on experiment is part of this closeout.

## Published artifacts

This directory contains the compact run receipt and report: `complete.json`, `manifest.json`, `results-summary.json`, `resolved-builds.json`, `raw-inventory.json`, paired and per-side identity receipts, `seal.json`, qualification and receipt-check receipts, `preparation-validation.json`, `candidate.diff`, and `CLASS_CLOSEOUT.md`. Large raw event and sample streams remain external at `D:/mmo-idle/volcano-heat-management-01/run-01` and are enumerated and hashed by `raw-inventory.json`.
