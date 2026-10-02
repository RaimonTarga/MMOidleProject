#!/bin/bash
# Run one T1-boss-pass candidate: generate the plan, fight it sharded, print the matrix.
#   reports/t1-boss-pass/run.sh <cand> [extra _t1BossPlan args...]
#   LABEL=base-forestvest reports/t1-boss-pass/run.sh base --armor=forest-vest-t1
# Run from server/. Results land in reports/t1-boss-pass/<LABEL or cand>.jsonl.
set -e
cand="$1"; shift
label="${LABEL:-$cand}"
R=../reports/t1-boss-pass
node --conditions=development --import tsx scripts/_t1BossPlan.ts --out="$R/plan-$label.json" --cand="$cand" "$@"
rm -f "$R/$label.jsonl"
for s in 0 1 2 3 4 5 6 7; do
  node --conditions=development --import tsx scripts/_t1BossLab.ts \
    --plan="$R/plan-$label.json" --out="$R/$label.jsonl" \
    --hitboxes=$R/../progression-phase0/hitboxes.json --shard=$s --shards=8 >/dev/null 2>&1 &
done
wait
wc -l "$R/$label.jsonl"
