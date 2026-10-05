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
