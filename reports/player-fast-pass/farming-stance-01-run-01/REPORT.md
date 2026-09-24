# Farming stance 01 — run 01

## Status

The sealed sequential run completed successfully: **24/24 observations**, with
no child failures and no unstarted cells. The launcher returned exit code 0.

This is synthetic mature-package evidence only. It is not economy evidence and
does not validate live-player behavior.

## Frozen execution identity

| Field | Value |
| --- | --- |
| Experiment | `farming-stance-01` |
| Execution source | `f9dcde59217770390752f3ce0f089e323b0a6f37` |
| Source-byte SHA-256 | `11336e6885a6af9bfa4e88b09c8d01c8c11420d5186e8ecbd2e7a4c4d79a945c` |
| Hitbox SHA-256 | `08bcc55633efe444d303c71977f7dcf87402157753af543e975e6c0c493afa83` |
| Seed / step / cap | `101003` / `100 ms` / `300,000 ms` |
| Stop rule | First player death; otherwise cap |
| Execution order | Sequential, one child at a time |
| Treatment | `production-r2`; no stance switching |
| Synthetic / economy eligible | `true` / `false` |
| External raw root | `C:\Users\osaif\AppData\Local\mmo-idle\fs01-data\run-01` |

The packet verify command passed before launch. The dispatcher also reverified
the sealed source and packet after every child. The frozen checkout stayed clean
at the sealed revision.

## Ledger reconciliation

| Planned | Completed | Failed | Not run | Combat observations |
| ---: | ---: | ---: | ---: | ---: |
| 24 | 24 | 0 | 0 | 24 |

There were 10 `player-died` outcomes and 14 `window-ended` outcomes. Across the
matrix, the recorder reports 380 completed kills, 55 unfinished damaged targets,
and 36 target-regain events. These totals are descriptive; death-shortened runs
are not sustainable-throughput measurements, and a cap is not a kill.

## Paired observation results

Cell format is `outcome / elapsed / kills / unfinished / minimum HP / regains`.
`player-died` is a death-shortened observation; `window-ended` is the 300-second
cap.

| Package | Fixture | Offensive | Defensive |
| --- | --- | --- | --- |
| T3 Striker Balanced | Volcanic | player-died / 105.0s / 24 / 1 / 0.0% / 0 | player-died / 186.3s / 33 / 1 / 0.0% / 0 |
| T3 Striker Balanced | Tundra | window-ended / 300.0s / 24 / 0 / 27.2% / 0 | window-ended / 300.0s / 18 / 1 / 29.1% / 0 |
| T3 Squire Balanced | Volcanic | player-died / 29.9s / 6 / 4 / 0.0% / 0 | window-ended / 300.0s / 46 / 0 / 21.9% / 0 |
| T3 Squire Balanced | Tundra | window-ended / 300.0s / 17 / 0 / 28.2% / 0 | window-ended / 300.0s / 13 / 1 / 36.6% / 0 |
| T3 Apprentice Balanced | Volcanic | player-died / 118.0s / 23 / 0 / 0.0% / 0 | window-ended / 300.0s / 45 / 0 / 2.5% / 0 |
| T3 Apprentice Balanced | Tundra | window-ended / 300.0s / 15 / 0 / 6.1% / 1 | window-ended / 300.0s / 11 / 1 / 18.2% / 0 |
| T3 Conduit Balanced | Volcanic | player-died / 115.0s / 3 / 10 / 0.0% / 6 | player-died / 123.3s / 3 / 8 / 0.0% / 4 |
| T3 Conduit Balanced | Tundra | window-ended / 300.0s / 17 / 0 / 94.1% / 0 | window-ended / 300.0s / 0 / 1 / 94.1% / 0 |
| T3 Conduit Heavy | Volcanic | player-died / 66.2s / 3 / 6 / 0.0% / 4 | player-died / 177.6s / 10 / 7 / 0.0% / 4 |
| T3 Conduit Heavy | Tundra | window-ended / 300.0s / 14 / 0 / 42.4% / 0 | window-ended / 300.0s / 5 / 1 / 3.9% / 0 |
| T4 Covenanter | Graveyard | player-died / 71.7s / 10 / 1 / 0.0% / 0 | window-ended / 300.0s / 26 / 3 / 60.6% / 7 |
| T4 Covenanter | Desert | window-ended / 300.0s / 11 / 6 / 55.9% / 8 | player-died / 156.8s / 3 / 3 / 0.0% / 2 |

## Conduit recorder evidence

These fields come from the authored Conduit recorder. Authored offense is a
formation-weighted live-delivery fraction; zero-body and ready-HP-blocked values
are exposure totals, not continuous contact or incoming-target aggregates.

| Package | Fixture | Arm | Authored offense | Zero-body | Ready-HP blocked | Regains | Kills / unfinished |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: |
| T3 Conduit Balanced | Volcanic | offensive | 49.5% | 12.4s | 0ms | 6 | 3 / 10 |
| T3 Conduit Balanced | Volcanic | defensive | 52.9% | 9.7s | 0ms | 4 | 3 / 8 |
| T3 Conduit Balanced | Tundra | offensive | 88.7% | 0ms | 0ms | 0 | 17 / 0 |
| T3 Conduit Balanced | Tundra | defensive | 84.5% | 0ms | 0ms | 0 | 0 / 1 |
| T3 Conduit Heavy | Volcanic | offensive | 91.2% | 3.6s | 0ms | 4 | 3 / 6 |
| T3 Conduit Heavy | Volcanic | defensive | 95.1% | 1.3s | 200ms | 4 | 10 / 7 |
| T3 Conduit Heavy | Tundra | offensive | 83.4% | 0ms | 0ms | 0 | 14 / 0 |
| T3 Conduit Heavy | Tundra | defensive | 89.8% | 0ms | 0ms | 0 | 5 / 1 |
| T4 Covenanter | Graveyard | offensive | 100.0% | 0ms | 0ms | 0 | 10 / 1 |
| T4 Covenanter | Graveyard | defensive | 93.1% | 4.9s | 0ms | 7 | 26 / 3 |
| T4 Covenanter | Desert | offensive | 91.6% | 11.2s | 0ms | 8 | 11 / 6 |
| T4 Covenanter | Desert | defensive | 93.1% | 5.1s | 2.6s | 2 | 3 / 3 |

No stance winner or tolerability threshold is declared. The paired results are
returned for command-center review; the matrix does not authorize a follow-on
experiment, reconstruction edit, or balance change.

## Evidence and publication state

The compact result and copied small process/receipt evidence are in this
directory:

- [results-summary.json](results-summary.json) — 24 compact result rows.
- [resolved-builds.json](resolved-builds.json) — applied package receipts.
- [raw-inventory.json](raw-inventory.json) — 48 external raw-stream hashes.
- [identity.json](identity.json), [manifest.json](manifest.json), and [complete.json](complete.json).

The raw `events.jsonl` and `samples.jsonl` streams remain at the external raw
root above; they were not duplicated into this publishing checkout. All 48
inventory entries match their recorded byte counts and SHA-256 values.

Publication remains `local-unpublished`. The publishing checkout is on
`develop`; no commit, push, deployment, or live playtest was performed. The
source SHA above is the execution SHA and is intentionally reported separately
from any future publication SHA.
