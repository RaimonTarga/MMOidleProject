# Family contracts — the §18 3b arbiter

Generated 2026-10-02T00:16:46.837Z from `11356c843a2bdcb6cb8583610c2475dbe170eb4a`.
1 synthetic nodes x 4 seeds (101009, 101033, 101063, 101081), every cell run to **30 kills** or a 600 s hard cap; 80 measured runs; wall clock 3.0 min.

This instrument answers one question per family: **does the family reward the
lane it declares it favours more than the lane it declares it punishes, on an
encounter made entirely of its own bodies?** `FamilyDefinition.drops` IS the
definition of "favours" (design §18.7), so a family that does not is a
monster-shape finding, not a magnitude to tune.

It exists because the lane matrix cannot answer it. Ranking six lanes against
each other on one blended node is below that instrument's resolution: run 3's
ordinal ranking failed to reproduce between two seeds for seven of nine families,
and its margins moved 7–15 pp between a 90 s and a 270 s cap — more than the ±3 pp
band the criterion is written in. `monster-proposals-run3.md` §2 prescribed exactly
this replacement: one lane against one lane, on its own node, pooled across every
lineage carrying the lane, with enough seeds to put an interval on the difference.

## How it differs from the lane matrix

1. **The node is 100% the family.** A real "own node" is a 70/20/10 blend, so a
   quarter of its kills belong to families whose contract is not under test — and
   nine of the 37 Tier-2 blends do not even resolve as authored, so the matrix
   sometimes measures a different family than the one its row names. Here a real
   node of the family's own biome and tier has its authored blend overwritten
   **in this process only** to 100% that family. The spawner, density, pack logic,
   terrain and repopulation are the live ones; only the composition is forced, and
   an assertion proves the forced cycle actually landed before any measurement.
2. **Two lanes, not six.** A margin between two quantities has a variance this
   bench can estimate. A rank among six does not.
3. **A fixed kill count, not a fixed clock.** Every cell carries the same sample,
   so a tanky family's row and a swarm's row are equally precise and the variation
   moves into the thing being measured — the time to reach N. A cell that cannot
   reach N inside the cap is reported as not measured rather than scored on what
   it managed.
4. **The band matches the node's tier.** A Tier-2 node is measured by the
   character who actually farms it, carrying the Tier-2 band on Tier-2 gear
   (`bot/src/tierEntry/profiles.ts`), against that band's own lane-less control.

## The guards

All five must pass before an inversion is called **decisive**, which is the only
state that may move a `drops` field.

| guard | what it requires |
|---|---|
| G1 reached-N | the lane cell AND its control reached N kills inside the cap, in every seed and for every carrier |
| G2 carriers | at least one weapon lineage carries each of the two lanes (the count is printed, because a one-lineage lane is a thinner reading) |
| G3 seed agreement | every seed puts the margin on the same side of zero — §18 3b's "both seeds agree", generalised |
| G4 spread | &#124;mean margin&#124; exceeds half the seed-to-seed spread, so the crude interval around the difference excludes zero. This is the guard run 3 lacked |
| G5 ratio agreement | the raw time-to-kill-N ratio agrees in sign with the control-normalised margin |

## The synthetic nodes

One host node per (family, tier). `nodeSpawnBlend` memoizes per node id, so each
family gets its OWN host and the override is structural rather than a matter of
call order. Nothing here is written to disk.

| family | host node | tier | authored blend (OVERWRITTEN) | forced blend | bodies it fields |
|---|---|---:|---|---|---|
| Brute | `node-t1-cave-04` | 1 | Brood 45% / Brute 45% / Deep 10% | Brute 100% | cave-brute |

### (family, tier) pairs with no node, because the tier fields none of their bodies

Not a failure of this instrument — a gap in the monster pools. It is the same gap
that makes nine of the 37 authored Tier-2 blends resolve as something other than
what they name, so the lane matrix measures a different family on those nodes while
this bench simply has no row.

None: every family selected is fieldable at every tier selected.

## The contract, per family

Uplift is against the same lineage's band-matched lane-less control on the same
synthetic node, pooled (median) across every weapon lineage carrying the lane.
The margin is favoured minus punished in percentage points of uplift; positive
means the contract holds. The TTK-N ratio is the punished lane's engaged
milliseconds per kill over the favoured lane's — above 1 also means the contract
holds, and it is the quantity the brief names.

| family | node | tier | band | favours | punishes | fav uplift | pun uplift | margin (fav − pun) | ± half-spread | TTK-N ratio (pun/fav) | carriers f/p | G1 | G3 | G4 | G5 | verdict |
|---|---|---:|---:|---|---|---:|---:|---:|---:|---:|---|:--:|:--:|:--:|:--:|---|
| Brute | `node-t1-cave-04` | 1 | 1 | empowered | affliction | +7.2% | +3.3% | +3.8% | +5.6% | 0.99 | 3/2 | yes | NO | NO | NO | holds (inside noise) |

### Per seed, and what was dropped

| family | node | band | per-seed margin (fav − pun) | per-seed TTK-N ratio | dropped carriers |
|---|---|---:|---|---|---|
| Brute | `node-t1-cave-04` | 1 | +6.8%, +7.5%, -3.8%, +4.8% | 1.00, 0.99, 0.99, 0.98 | none |

## Verdicts

- Contracts measured: **1** of 1.
- Holding: **1**, of which **0** with all five guards passing; the rest hold on the mean but sit inside the instrument's own noise.
- Inverted: **0**, of which **0** decisive (all five guards).
- Not measured: **0**.

### Decisive inversions

None: no family fails its contract with all five guards passing.

## The wider pass — every weapon lane on the same synthetic node

What names the lane a decisive inversion should move `drops` to.


### `node-t1-cave-04` — 100% Brute (cave T1, band 1)

Favours `empowered`, punishes `affliction`.

| rank | lane | mean uplift | carriers | seeds with a reading | per-seed uplift |
|---:|---|---:|---:|---:|---|
| 1 | empowered **(favoured)** | +7.3% | 3 | 4/4 | +10.2%, +10.6%, +4.1%, +4.2% |
| 2 | kill-chain | +6.4% | 3 | 4/4 | +12.9%, +4.9%, +4.6%, +3.2% |
| 3 | tempo | +5.2% | 2 | 4/4 | +9.3%, +4.6%, +1.0%, +6.0% |
| 4 | affliction _(punished)_ | +3.5% | 2 | 4/4 | +3.4%, +3.2%, +7.8%, -0.6% |
| 5 | engagement | +3.2% | 2 | 4/4 | -1.3%, +6.2%, +5.8%, +2.1% |
| 6 | control | +1.6% | 2 | 4/4 | -1.6%, +5.4%, +3.0%, -0.2% |
| 7 | technique | +0.0% | 1 | 4/4 | +0.0%, +0.0%, +0.0%, +0.0% |

## Refused purchases

None — every lane bought its whole band.

