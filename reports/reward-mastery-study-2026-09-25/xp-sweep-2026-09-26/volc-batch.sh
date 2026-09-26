#!/bin/bash
# usage: volc-batch.sh <name> '<json patch>'  -> runs T3 volcanic, 6 classes, nodes 02 and 04
cd "$(dirname "$0")/.."
VOLC_PATCH="$2" TIERS=3 WORKERS=${WORKERS:-6} node xp-sweep-2026-09-26/run.mjs "v-$1-n02" volcanic > "xp-sweep-2026-09-26/v-$1-n02.out" 2>&1 &
VOLC_PATCH="$2" TIERS=3 NODE=04 SEED=101063 WORKERS=${WORKERS:-6} node xp-sweep-2026-09-26/run.mjs "v-$1-n04" volcanic > "xp-sweep-2026-09-26/v-$1-n04.out" 2>&1 &
wait
