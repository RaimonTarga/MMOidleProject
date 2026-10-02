#!/bin/bash
# Run one T1-boss-pass candidate: generate the plan, fight it sharded, print the matrix.
#   reports/t1-boss-pass/run.sh <cand> [extra _t1BossPlan args...]
#   LABEL=base-forestvest reports/t1-boss-pass/run.sh base --armor=forest-vest-t1
# SHARDS=4 halves the parallelism, for running beside something that needs the CPU.
# Run from server/. Results land in reports/t1-boss-pass/<LABEL or cand>.jsonl.
set -e
cand="$1"; shift
label="${LABEL:-$cand}"
R=../reports/t1-boss-pass
node --conditions=development --import tsx scripts/_t1BossPlan.ts --out="$R/plan-$label.json" --cand="$cand" "$@"
rm -f "$R/$label.jsonl"
SHARDS="${SHARDS:-8}"
for s in $(seq 0 $((SHARDS - 1))); do
  node --conditions=development --import tsx scripts/_t1BossLab.ts \
    --plan="$R/plan-$label.json" --out="$R/$label.jsonl" \
    --hitboxes=$R/../progression-phase0/hitboxes.json --shard=$s --shards=$SHARDS >/dev/null 2>&1 &
done
wait
wc -l "$R/$label.jsonl"
