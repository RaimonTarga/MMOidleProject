# Legibility run — evidence

Raw evidence for `docs/briefs/legibility-report-2026-10-05.md`. `SCOPE.md` is the run's
file-ownership map and contracts.

## Before (develop `7360e3b0`, measured in `../mmo-lin-w2b`, 2026-10-05)

| file | plan | rows | wall |
|---|---|---:|---:|
| `before-base.jsonl` / `.md` | `_t1BossPlan.ts --cand=base --seeds=30` (the no-band floor; identical to `t1-boss-pass/plan-base.json`) | 900 | 89 s, 3 shards |
| `before-tutorial-pair.jsonl` / `.md` | `--matrix=tutorial-pair --seeds=30` (the guide's lean + verb on the boss kit, and a no-card control) | 1,800 | 149 s, 3 shards |
| `before-composition.jsonl` / `.md` | `--matrix=composition --seeds=10` (the old 45 T1 lean × verb pairs + control, boss lab only) | 15,000 | 1,449 s, 4 shards |

0 error rows. Rows carry `wallMs` (wall-clock fight time), so the no-band before/after
identity check compares rows with `wallMs` removed.

Reproduce from `server/`: generate the plan with `_t1BossPlan.ts --out=<plan>`, then
`_t1BossLab.ts --plan=<plan> --out=<jsonl> --hitboxes=../reports/progression-phase0/hitboxes.json --shard=i --shards=N`
per shard; render with `scripts/_t1BossMatrix.ts <jsonl> --md` and
`bench/compositionReport.ts --boss=<jsonl> --lanes=/dev/null --out=<md>`.

## After, wave 1 (feat/legibility `8deb861d`: A + B + C merged; D is UI-only)

| file | plan | rows | wall |
|---|---|---:|---:|
| `after-base.jsonl` | the same no-band plan (the plan file regenerates byte-identical) | 900 | 74 s, 3 shards |
| `after-composition.jsonl` / `.md` | `--matrix=composition --seeds=10`: per weapon 3 leans × 3 ranks with the one fixed verb, the verb alone, and the control | 16,500 | 1,215 s, 4 shards |

**No-band identity:** the 900 after rows equal the 900 before rows once `wallMs` is removed
(sorted, compared line for line) — a character with no cards fights exactly as on develop.
0 error rows in either file.

## Final (feat/legibility `b6d3b130`: waves 1 and 2 merged)

| file | plan | rows | wall |
|---|---|---:|---:|
| `final-base.jsonl` | the no-band plan again | 900 | 109 s, 3 shards |
| `final-tutorial-pair.jsonl` / `.md` | `--matrix=tutorial-pair --seeds=30`: the guide's kit with Effect at rank III and the weapon's verb (the plan now carries `leanRank`), and a no-card control | 1,800 | 186 s, 3 shards |

**No-band identity holds at the final tip** (900/900 rows equal to `before-base.jsonl`,
`wallMs` removed). 0 error rows.

## Other evidence

- `rosters.md` — wave 1 C: the T1 node table before → after, the one currency move, the
  spawner verification and the T1 family-contract bench.
- `sweep-1x.md` / `.json` — wave 2 E: the canonical 1x six-class tutorial sweep.
- `screens/` — wave 1 D: desktop 1440×900 and portrait 390×844 shots of every view (ring
  states and their targets staged by holding the client's atoms; the away count and the
  target badges from real fights).
