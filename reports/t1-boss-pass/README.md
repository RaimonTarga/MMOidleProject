# T1 boss pass — evidence (2026-10-02)

Raw evidence for `docs/briefs/t1-boss-pass-report-2026-10-02.md`. Every number in the
report comes out of these files.

## What is here

- `plan-base.json` — the full six-class x five-boss x 30-seed matrix, as the lab eats it.
  Generated, never hand-edited.
- `<candidate>.jsonl` — one JSON line per fight. `base` is the live numbers; every other
  file is one `bp` override block against the same seeds, so a pair of files is an A/B
  with nothing else moving. Row ids are `candidate|class|boss|seed`.
- `run.sh`, `cmp.mjs` — the two commands below.

## Reproducing

From `server/`:

```bash
bash ../reports/t1-boss-pass/run.sh base                                # 900 fights
bash ../reports/t1-boss-pass/run.sh beh-atk50 --bosses=crag-behemoth    # 180 fights
node --conditions=development --import tsx scripts/_t1BossMatrix.ts \
  ../reports/t1-boss-pass/base.jsonl --md --recovery
node ../reports/t1-boss-pass/cmp.mjs crag-behemoth ../reports/t1-boss-pass/beh-atk50.jsonl
```

Candidates live in `CANDIDATES` in `server/scripts/_t1BossPlan.ts`; the kits are read
from `TUTORIAL_CLASS_PLANS`, not retyped, so a tutorial plan edit moves the lab with it.

## Two things to know before reading a win rate

1. **Without `jitter` a solo T1 boss fight is deterministic.** 24 of the 30 cells
   returned 20 byte-identical fights from 20 seeds, because nothing in them rolls a die.
   Every matrix here carries the lab's seeded approach geometry, which is why win rates
   are not all 0% or 100%. See the `jitter` field's comment in `_t1BossLab.ts`.
2. **The lab is the floor, not the player.** It buys no lineage band, and the melee
   plans' Chaotic Axe swap leaves the one card the guide teaches inert. A real player
   with the tree is stronger than every number in here.
