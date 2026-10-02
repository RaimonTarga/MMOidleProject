#!/bin/bash
# Run one T1-boss-pass candidate: generate the plan, fight it sharded, print the matrix.
#   reports/t1-boss-pass/run.sh <cand> [extra _t1BossPlan args...]
# Run from server/. Results land in reports/t1-boss-pass/<cand>.jsonl.
set -e
cand="$1"; shift
R=../reports/t1-boss-pass
node --conditions=development --import tsx scripts/_t1BossPlan.ts --out="$R/plan-$cand.json" --cand="$cand" "$@"
rm -f "$R/$cand.jsonl"
for s in 0 1 2 3 4 5 6 7; do
  node --conditions=development --import tsx scripts/_t1BossLab.ts \
    --plan="$R/plan-$cand.json" --out="$R/$cand.jsonl" \
    --hitboxes=$R/../progression-phase0/hitboxes.json --shard=$s --shards=8 >/dev/null 2>&1 &
done
wait
wc -l "$R/$cand.jsonl"
