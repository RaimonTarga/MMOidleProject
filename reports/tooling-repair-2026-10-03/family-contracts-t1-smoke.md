# Family contracts — the §18 3b arbiter

Generated 2026-10-03T22:18:40.025Z from `d7a222ead2b02c9a4f37596111c560005b260fb2`.
15 synthetic nodes x 1 seeds (101009), every cell run to **3 kills** or a 60 s hard cap; 124 measured runs; wall clock 1.8 min.

This instrument answers one question per family: **does the family reward the
lane it declares it favours more than the lane it declares it punishes, on an
encounter made entirely of its own bodies?** `nodeShard(nodeId)` IS the
definition of "favours" (design §18.7), so a family that does not is a
monster-shape finding, not a magnitude to tune.

It exists because the lane matrix cannot answer it. Ranking six lanes against
each other on one blended node is below that instrument's resolution: run 3's
ordinal ranking failed to reproduce between two seeds for seven of nine families,
and its margins moved 7–15 pp between a 90 s and a 270 s cap — more than the ±3 pp
band the criterion was then written in (§18.9, since retired for §24.1's viability
floor). `monster-proposals-run3.md` §2 prescribed exactly
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
| Herd | `node-t1-plains-01` | 1 | Herd 70% / Swarm 20% / Sky 10% | Herd 100% | boar |
| Swarm | `node-t1-plains-02` | 1 | Herd 45% / Swarm 45% / Sky 10% | Swarm 100% | plains-slime |
| Sky | `node-t1-plains-03` | 1 | Sky 70% / Herd 20% / Swarm 10% | Sky 100% | grass-kite |
| Pack | `node-t1-forest-01` | 1 | Pack 70% / Grove 20% / Canopy 10% | Pack 100% | wolf |
| Grove | `node-t1-forest-02` | 1 | Grove 70% / Canopy 20% / Pack 10% | Grove 100% | forest-slime |
| Canopy | `node-t1-forest-03` | 1 | Canopy 70% / Pack 20% / Grove 10% | Canopy 100% | bramble-pod |
| Crag | `node-t1-mountain-01` | 1 | Ridge 70% / Hopper 20% / Crag 10% | Crag 100% | rockback-ram |
| Ridge | `node-t1-mountain-02` | 1 | Crag 45% / Ridge 45% / Hopper 10% | Ridge 100% | ridge-archer |
| Hopper | `node-t1-mountain-03` | 1 | Crag 70% / Ridge 20% / Hopper 10% | Hopper 100% | cliff-hopper |
| Brood | `node-t1-cave-01` | 1 | Brood 70% / Brute 20% / Deep 10% | Brood 100% | brood-spiderling |
| Brute | `node-t1-cave-02` | 1 | Brute 70% / Deep 20% / Brood 10% | Brute 100% | cave-brute |
| Deep | `node-t1-cave-03` | 1 | Deep 70% / Brood 20% / Brute 10% | Deep 100% | cave-lurker |
| Mire | `node-t1-swamp-01` | 1 | Mire 45% / Coven 45% / Stalker 10% | Mire 100% | bog-slime |
| Coven | `node-t1-swamp-02` | 1 | Mire 34% / Coven 33% / Stalker 33% | Coven 100% | fen-hexer |
| Stalker | `node-t1-swamp-03` | 1 | Stalker 70% / Mire 20% / Coven 10% | Stalker 100% | mud-toad |

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
| Herd | `node-t1-plains-01` | 1 | 1 | empowered | tempo | +0.0% | +1.8% | -1.8% | — | 0.94 | 3/2 | yes | yes | NO | yes | inverted (inside noise) |
| Swarm | `node-t1-plains-02` | 1 | 1 | technique | empowered | +25.3% | +0.0% | +25.3% | — | 1.64 | 1/3 | yes | yes | NO | yes | holds (inside noise) |
| Sky | `node-t1-plains-03` | 1 | 1 | kill-chain | affliction | +7.8% | +2.3% | +5.5% | — | 0.88 | 3/2 | yes | yes | NO | NO | holds (inside noise) |
| Pack | `node-t1-forest-01` | 1 | 1 | tempo | empowered | +5.1% | +0.0% | +5.1% | — | 1.29 | 2/3 | yes | yes | NO | yes | holds (inside noise) |
| Grove | `node-t1-forest-02` | 1 | 1 | engagement | tempo | +28.3% | +14.0% | +14.3% | — | 1.19 | 2/2 | yes | yes | NO | yes | holds (inside noise) |
| Canopy | `node-t1-forest-03` | 1 | 1 | affliction | control | +13.8% | +27.6% | -13.7% | — | 0.95 | 2/2 | yes | yes | NO | yes | inverted (inside noise) |
| Crag | `node-t1-mountain-01` | 1 | 1 | empowered | affliction | +0.0% | +1.2% | -1.2% | — | 0.84 | 3/2 | yes | yes | NO | yes | inverted (inside noise) |
| Ridge | `node-t1-mountain-02` | 1 | 1 | control | kill-chain | +13.5% | +5.9% | +7.7% | — | 1.07 | 2/3 | yes | yes | NO | yes | holds (inside noise) |
| Hopper | `node-t1-mountain-03` | 1 | 1 | engagement | empowered | +12.2% | +0.0% | +12.2% | — | 1.44 | 2/3 | yes | yes | NO | yes | holds (inside noise) |
| Brood | `node-t1-cave-01` | 1 | 1 | tempo | tempo | +6.8% | +6.8% | +0.0% | — | 1.00 | 2/2 | yes | NO | NO | NO | holds (inside noise) |
| Brute | `node-t1-cave-02` | 1 | 1 | empowered | affliction | +0.0% | +5.4% | -5.4% | — | 1.26 | 3/2 | yes | yes | NO | NO | inverted (inside noise) |
| Deep | `node-t1-cave-03` | 1 | 1 | kill-chain | engagement | +1.1% | +19.2% | -18.2% | — | 0.60 | 3/2 | yes | yes | NO | yes | inverted (inside noise) |
| Mire | `node-t1-swamp-01` | 1 | 1 | affliction | empowered | +3.8% | +3.2% | +0.5% | — | 1.24 | 2/3 | yes | yes | NO | yes | holds (inside noise) |
| Coven | `node-t1-swamp-02` | 1 | 1 | control | tempo | +3.2% | +1.4% | +1.7% | — | 0.84 | 2/2 | yes | yes | NO | NO | holds (inside noise) |
| Stalker | `node-t1-swamp-03` | 1 | 1 | kill-chain | bulwark | +3.9% | — | — | — | — | 3/0 | NO | NO | NO | NO | _not measured_ |

### Per seed, and what was dropped

| family | node | band | per-seed margin (fav − pun) | per-seed TTK-N ratio | dropped carriers |
|---|---|---:|---|---|---|
| Herd | `node-t1-plains-01` | 1 | -1.8% | 0.94 | none |
| Swarm | `node-t1-plains-02` | 1 | +25.3% | 1.64 | none |
| Sky | `node-t1-plains-03` | 1 | +5.5% | 0.88 | none |
| Pack | `node-t1-forest-01` | 1 | +5.1% | 1.29 | none |
| Grove | `node-t1-forest-02` | 1 | +14.3% | 1.19 | none |
| Canopy | `node-t1-forest-03` | 1 | -13.7% | 0.95 | none |
| Crag | `node-t1-mountain-01` | 1 | -1.2% | 0.84 | none |
| Ridge | `node-t1-mountain-02` | 1 | +7.7% | 1.07 | none |
| Hopper | `node-t1-mountain-03` | 1 | +12.2% | 1.44 | none |
| Brood | `node-t1-cave-01` | 1 | +0.0% | 1.00 | none |
| Brute | `node-t1-cave-02` | 1 | -5.4% | 1.26 | none |
| Deep | `node-t1-cave-03` | 1 | -18.2% | 0.60 | none |
| Mire | `node-t1-swamp-01` | 1 | +0.5% | 1.24 | none |
| Coven | `node-t1-swamp-02` | 1 | +1.7% | 0.84 | none |
| Stalker | `node-t1-swamp-03` | 1 | — | — | none |

## Verdicts

- Contracts measured: **14** of 15.
- Holding: **9**, of which **0** with all five guards passing; the rest hold on the mean but sit inside the instrument's own noise.
- Inverted: **5**, of which **0** decisive (all five guards).
- Not measured: **1**.

### Decisive inversions

None: no family fails its contract with all five guards passing.

### Inverted but NOT decisive

The favoured lane lost on average, but at least one guard failed — so the
inversion is inside the instrument's noise and nothing moves. The failing
guards are in the table above.

- **Herd** T1 band 1: margin -1.8%, half-spread —; failed g4SpreadExcludesZero
- **Canopy** T1 band 1: margin -13.7%, half-spread —; failed g4SpreadExcludesZero
- **Crag** T1 band 1: margin -1.2%, half-spread —; failed g4SpreadExcludesZero
- **Brute** T1 band 1: margin -5.4%, half-spread —; failed g4SpreadExcludesZero, g5RatioAgrees
- **Deep** T1 band 1: margin -18.2%, half-spread —; failed g4SpreadExcludesZero

### Not measured, and why

- **Stalker** T1 (`node-t1-swamp-03`): no weapon lineage carries `bulwark`, so the punished half has no reference

## The wider pass — every weapon lane on the same synthetic node

What names the lane a decisive inversion should move `drops` to.

Not measured on this run (`FAM_ALL_LANES=1` to add it).

## Refused purchases

None — every lane bought its whole band.


## Node shard kill accounting

Normal kills attributed by nodeShard; these counts exclude synthetic starting wallets and reward multipliers.

| node | shard | counted kills |
|---|---|---:|
| node-t1-plains-01 | empowered | 27 |
| node-t1-plains-02 | technique | 21 |
| node-t1-plains-03 | kill-chain | 27 |
| node-t1-forest-01 | tempo | 27 |
| node-t1-forest-02 | engagement | 21 |
| node-t1-forest-03 | affliction | 21 |
| node-t1-mountain-01 | empowered | 30 |
| node-t1-mountain-02 | control | 27 |
| node-t1-mountain-03 | engagement | 27 |
| node-t1-cave-01 | tempo | 12 |
| node-t1-cave-02 | empowered | 30 |
| node-t1-cave-03 | kill-chain | 30 |
| node-t1-swamp-01 | affliction | 30 |
| node-t1-swamp-02 | control | 24 |
| node-t1-swamp-03 | kill-chain | 18 |
