# Family contracts — the §18 3b arbiter

Generated 2026-10-02T00:10:31.168Z from `1a06977fff9e13625e65f4c860d9249746194d70`.
33 synthetic nodes x 4 seeds (101009, 101033, 101063, 101081), every cell run to **30 kills** or a 600 s hard cap; 1112 measured runs; wall clock 79.4 min.

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
| Herd | `node-t1-plains-01` | 1 | Herd 70% / Swarm 20% / Sky 10% | Herd 100% | boar |
| Swarm | `node-t1-plains-02` | 1 | Swarm 70% / Sky 20% / Herd 10% | Swarm 100% | plains-slime |
| Sky | `node-t1-plains-03` | 1 | Sky 70% / Herd 20% / Swarm 10% | Sky 100% | grass-kite |
| Pack | `node-t1-forest-01` | 1 | Pack 70% / Grove 20% / Canopy 10% | Pack 100% | wolf |
| Grove | `node-t1-forest-02` | 1 | Grove 70% / Canopy 20% / Pack 10% | Grove 100% | forest-slime |
| Canopy | `node-t1-forest-03` | 1 | Canopy 70% / Pack 20% / Grove 10% | Canopy 100% | bramble-pod |
| Crag | `node-t1-mountain-01` | 1 | Crag 70% / Ridge 20% / Hopper 10% | Crag 100% | rockback-ram |
| Ridge | `node-t1-mountain-02` | 1 | Ridge 70% / Hopper 20% / Crag 10% | Ridge 100% | ridge-archer |
| Hopper | `node-t1-mountain-03` | 1 | Hopper 70% / Crag 20% / Ridge 10% | Hopper 100% | cliff-hopper |
| Brood | `node-t1-cave-01` | 1 | Brood 70% / Brute 20% / Deep 10% | Brood 100% | brood-spiderling |
| Brute | `node-t1-cave-02` | 1 | Brute 70% / Deep 20% / Brood 10% | Brute 100% | cave-brute |
| Deep | `node-t1-cave-03` | 1 | Deep 70% / Brood 20% / Brute 10% | Deep 100% | cave-lurker |
| Mire | `node-t1-swamp-01` | 1 | Mire 70% / Coven 20% / Stalker 10% | Mire 100% | bog-slime |
| Coven | `node-t1-swamp-02` | 1 | Coven 70% / Stalker 20% / Mire 10% | Coven 100% | fen-hexer |
| Stalker | `node-t1-swamp-03` | 1 | Stalker 70% / Mire 20% / Coven 10% | Stalker 100% | mud-toad |
| Herd | `node-t2-plains-01` | 2 | Herd 70% / Swarm 20% / Sky 10% | Herd 100% | stampede-bull |
| Swarm | `node-t2-plains-02` | 2 | Swarm 70% / Sky 20% / Herd 10% | Swarm 100% | prairie-wolf |
| Sky | `node-t2-plains-03` | 2 | Sky 70% / Herd 20% / Swarm 10% | Sky 100% | savanna-hawk |
| Pack | `node-t2-forest-01` | 2 | Pack 70% / Grove 20% / Canopy 10% | Pack 100% | ancient-wolf |
| Grove | `node-t2-forest-02` | 2 | Grove 70% / Canopy 20% / Pack 10% | Grove 100% | ironwood-golem |
| Canopy | `node-t2-forest-03` | 2 | Canopy 70% / Pack 20% / Grove 10% | Canopy 100% | canopy-sprite |
| Crag | `node-t2-mountain-01` | 2 | Crag 70% / Ridge 20% / Hopper 10% | Crag 100% | granite-titan |
| Ridge | `node-t2-mountain-02` | 2 | Ridge 70% / Hopper 20% / Crag 10% | Ridge 100% | peak-archer |
| Hopper | `node-t2-mountain-03` | 2 | Hopper 70% / Crag 20% / Ridge 10% | Hopper 100% | stone-eagle |
| Brood | `node-t2-cave-01` | 2 | Brood 70% / Brute 20% / Deep 10% | Brood 100% | giant-spider |
| Brute | `node-t2-cave-02` | 2 | Brute 70% / Deep 20% / Brood 10% | Brute 100% | cave-troll |
| Deep | `node-t2-cave-03` | 2 | Deep 70% / Brood 20% / Brute 10% | Deep 100% | cave-gargoyle |
| Coven | `node-t2-swamp-01` | 2 | Mire 70% / Coven 20% / Stalker 10% | Coven 100% | swamp-hydra, bog-witch |
| Stalker | `node-t2-swamp-02` | 2 | Coven 70% / Stalker 20% / Mire 10% | Stalker 100% | mire-stalker |
| Ape | `node-t2-jungle-01` | 2 | Ape 70% / Undergrowth 20% / Stalker 10% | Ape 100% | jungle-ape |
| Undergrowth | `node-t2-jungle-02` | 2 | Undergrowth 70% / Stalker 20% / Ape 10% | Undergrowth 100% | jungle-snake, jungle-blowdarter |
| Basilisk | `node-t2-desert-01` | 2 | Basilisk 70% / Scorpion 30% | Basilisk 100% | stone-basilisk |
| Scorpion | `node-t2-desert-02` | 2 | Scorpion 70% / Basilisk 30% | Scorpion 100% | sand-scorpion |

### (family, tier) pairs with no node, because the tier fields none of their bodies

Not a failure of this instrument — a gap in the monster pools. It is the same gap
that makes nine of the 37 authored Tier-2 blends resolve as something other than
what they name, so the lane matrix measures a different family on those nodes while
this bench simply has no row.

| family | biome | tier | why |
|---|---|---:|---|
| Mire | swamp | 2 | `monsterPoolByTier[2]` of swamp fields none of its bodies |
| Stalker | jungle | 2 | `monsterPoolByTier[2]` of jungle fields none of its bodies |
| Stalker | desert | 2 | `monsterPoolByTier[2]` of desert fields none of its bodies |

## The contract, per family

Uplift is against the same lineage's band-matched lane-less control on the same
synthetic node, pooled (median) across every weapon lineage carrying the lane.
The margin is favoured minus punished in percentage points of uplift; positive
means the contract holds. The TTK-N ratio is the punished lane's engaged
milliseconds per kill over the favoured lane's — above 1 also means the contract
holds, and it is the quantity the brief names.

| family | node | tier | band | favours | punishes | fav uplift | pun uplift | margin (fav − pun) | ± half-spread | TTK-N ratio (pun/fav) | carriers f/p | G1 | G3 | G4 | G5 | verdict |
|---|---|---:|---:|---|---|---:|---:|---:|---:|---:|---|:--:|:--:|:--:|:--:|---|
| Herd | `node-t1-plains-01` | 1 | 1 | empowered | tempo | +0.0% | +1.5% | -1.5% | +3.9% | 0.88 | 3/2 | yes | NO | NO | yes | inverted (inside noise) |
| Swarm | `node-t1-plains-02` | 1 | 1 | technique | empowered | -2.9% | +0.0% | -2.8% | +2.6% | 1.12 | 1/3 | yes | NO | yes | NO | inverted (inside noise) |
| Sky | `node-t1-plains-03` | 1 | 1 | engagement | affliction | +5.7% | -0.6% | +6.1% | +7.4% | 1.05 | 2/2 | yes | NO | NO | yes | holds (inside noise) |
| Pack | `node-t1-forest-01` | 1 | 1 | tempo | empowered | +8.3% | +0.0% | +9.8% | +4.2% | 1.03 | 2/3 | yes | yes | yes | yes | holds (decisive) |
| Grove | `node-t1-forest-02` | 1 | 1 | empowered | tempo | +0.0% | +0.7% | -0.2% | +12.4% | 0.91 | 3/2 | yes | NO | NO | yes | inverted (inside noise) |
| Canopy | `node-t1-forest-03` | 1 | 1 | affliction | control | +2.5% | +2.5% | +0.0% | +0.0% | 1.00 | 2/2 | yes | NO | NO | NO | holds (inside noise) |
| Crag | `node-t1-mountain-01` | 1 | 1 | empowered | affliction | -3.0% | +10.3% | -10.5% | +10.8% | 0.85 | 3/2 | yes | NO | NO | yes | inverted (inside noise) |
| Ridge | `node-t1-mountain-02` | 1 | 1 | control | kill-chain | +8.5% | -0.1% | +8.2% | +3.8% | 1.04 | 2/3 | yes | yes | yes | yes | holds (decisive) |
| Hopper | `node-t1-mountain-03` | 1 | 1 | tempo | empowered | +11.8% | +0.0% | +10.4% | +8.2% | 0.94 | 2/3 | yes | yes | yes | NO | holds (inside noise) |
| Brood | `node-t1-cave-01` | 1 | 1 | affliction | tempo | +5.7% | +2.8% | +1.0% | +11.4% | 1.16 | 2/2 | yes | NO | NO | yes | holds (inside noise) |
| Brute | `node-t1-cave-02` | 1 | 1 | empowered | affliction | +0.7% | +8.1% | -6.4% | +5.9% | 0.99 | 3/2 | yes | yes | yes | yes | **INVERTED (decisive)** |
| Deep | `node-t1-cave-03` | 1 | 1 | kill-chain | engagement | +3.4% | +6.8% | -4.2% | +10.4% | 0.55 | 3/2 | yes | NO | NO | yes | inverted (inside noise) |
| Mire | `node-t1-swamp-01` | 1 | 1 | affliction | empowered | +0.2% | +5.1% | -6.2% | +5.3% | 1.07 | 2/3 | yes | yes | yes | NO | inverted (inside noise) |
| Coven | `node-t1-swamp-02` | 1 | 1 | control | tempo | +12.1% | +8.8% | +2.7% | +8.6% | 1.19 | 2/2 | yes | NO | NO | yes | holds (inside noise) |
| Stalker | `node-t1-swamp-03` | 1 | 1 | kill-chain | bulwark | +4.0% | — | — | — | — | 3/0 | NO | NO | NO | NO | _not measured_ |
| Herd | `node-t2-plains-01` | 2 | 2 | empowered | tempo | +6.1% | +13.8% | -7.2% | +9.0% | 1.00 | 3/2 | yes | NO | NO | NO | inverted (inside noise) |
| Swarm | `node-t2-plains-02` | 2 | 2 | technique | empowered | +17.9% | +4.0% | +11.7% | +11.1% | 1.21 | 1/3 | yes | NO | yes | yes | holds (inside noise) |
| Sky | `node-t2-plains-03` | 2 | 2 | engagement | affliction | +21.1% | +20.3% | +2.0% | +14.6% | 1.03 | 2/2 | yes | NO | NO | yes | holds (inside noise) |
| Pack | `node-t2-forest-01` | 2 | 2 | tempo | empowered | +13.1% | +8.9% | +4.7% | +4.3% | 1.02 | 2/3 | yes | NO | yes | yes | holds (inside noise) |
| Grove | `node-t2-forest-02` | 2 | 2 | empowered | tempo | +4.2% | +5.4% | -1.4% | +3.9% | 0.91 | 3/2 | yes | NO | NO | yes | inverted (inside noise) |
| Canopy | `node-t2-forest-03` | 2 | 2 | affliction | control | +3.7% | +6.9% | -2.4% | +1.6% | 1.32 | 2/2 | yes | yes | yes | NO | inverted (inside noise) |
| Crag | `node-t2-mountain-01` | 2 | 2 | empowered | affliction | — | — | — | — | — | 0/0 | NO | NO | NO | NO | _not measured_ |
| Ridge | `node-t2-mountain-02` | 2 | 2 | control | kill-chain | +15.3% | +4.9% | +10.2% | +6.6% | 1.55 | 2/3 | yes | yes | yes | yes | holds (decisive) |
| Hopper | `node-t2-mountain-03` | 2 | 2 | tempo | empowered | -0.9% | -4.6% | +4.0% | +10.7% | 0.92 | 2/3 | yes | NO | NO | NO | holds (inside noise) |
| Brood | `node-t2-cave-01` | 2 | 2 | affliction | tempo | +18.7% | +4.6% | +13.5% | +4.6% | 1.26 | 2/2 | yes | yes | yes | yes | holds (decisive) |
| Brute | `node-t2-cave-02` | 2 | 2 | empowered | affliction | — | — | — | — | — | 0/0 | NO | NO | NO | NO | _not measured_ |
| Deep | `node-t2-cave-03` | 2 | 2 | kill-chain | engagement | +2.5% | +1.0% | +0.0% | +4.6% | 0.65 | 3/2 | yes | NO | NO | NO | holds (inside noise) |
| Coven | `node-t2-swamp-01` | 2 | 2 | control | tempo | +6.4% | +6.2% | +2.2% | +15.6% | 1.23 | 2/2 | yes | NO | NO | yes | holds (inside noise) |
| Stalker | `node-t2-swamp-02` | 2 | 2 | kill-chain | bulwark | +4.6% | — | — | — | — | 3/0 | NO | NO | NO | NO | _not measured_ |
| Ape | `node-t2-jungle-01` | 2 | 2 | empowered | tempo | — | +17.1% | — | — | — | 0/1 | NO | NO | NO | NO | _not measured_ |
| Undergrowth | `node-t2-jungle-02` | 2 | 2 | affliction | control | +10.3% | +20.9% | -10.9% | +11.0% | 0.89 | 2/2 | yes | yes | NO | yes | inverted (inside noise) |
| Basilisk | `node-t2-desert-01` | 2 | 2 | empowered | tempo | +4.2% | +13.1% | -7.4% | +3.3% | 0.79 | 2/1 | NO | NO | yes | yes | inverted (inside noise) |
| Scorpion | `node-t2-desert-02` | 2 | 2 | control | kill-chain | +15.9% | +1.9% | +14.0% | +5.4% | 1.26 | 2/2 | NO | yes | yes | yes | holds (inside noise) |

### Per seed, and what was dropped

| family | node | band | per-seed margin (fav − pun) | per-seed TTK-N ratio | dropped carriers |
|---|---|---:|---|---|---|
| Herd | `node-t1-plains-01` | 1 | +2.4%, -2.5%, -0.5%, -5.4% | 0.87, 0.88, 0.93, 0.86 | none |
| Swarm | `node-t1-plains-02` | 1 | -0.6%, -5.3%, -5.1%, +0.0% | 1.15, 1.21, 0.99, 1.12 | none |
| Sky | `node-t1-plains-03` | 1 | -1.5%, +1.0%, +13.4%, +11.3% | 1.04, 1.03, 1.05, 1.08 | none |
| Pack | `node-t1-forest-01` | 1 | +15.6%, +7.7%, +9.0%, +7.1% | 1.09, 0.96, 0.95, 1.10 | none |
| Grove | `node-t1-forest-02` | 1 | -12.5%, +0.4%, +12.4%, -1.0% | 0.89, 0.88, 0.89, 0.97 | none |
| Canopy | `node-t1-forest-03` | 1 | +0.0%, +0.0%, +0.0%, +0.0% | 1.01, 0.95, 1.03, 1.02 | none |
| Crag | `node-t1-mountain-01` | 1 | -14.3%, -18.5%, -12.4%, +3.1% | 0.85, 0.86, 0.84, 0.87 | none |
| Ridge | `node-t1-mountain-02` | 1 | +9.2%, +10.3%, +10.4%, +2.8% | 1.08, 1.03, 1.04, 1.03 | none |
| Hopper | `node-t1-mountain-03` | 1 | +9.9%, +13.7%, +0.8%, +17.2% | 0.92, 0.94, 0.93, 0.95 | none |
| Brood | `node-t1-cave-01` | 1 | +3.9%, -4.3%, +13.6%, -9.2% | 1.15, 1.13, 1.19, 1.17 | none |
| Brute | `node-t1-cave-02` | 1 | -9.2%, -0.6%, -12.4%, -3.6% | 1.01, 0.99, 0.99, 1.00 | none |
| Deep | `node-t1-cave-03` | 1 | -15.5%, +5.3%, -5.9%, -0.9% | 0.56, 0.55, 0.54, 0.56 | none |
| Mire | `node-t1-swamp-01` | 1 | -4.1%, -0.9%, -8.1%, -11.6% | 1.06, 1.06, 1.07, 1.08 | none |
| Coven | `node-t1-swamp-02` | 1 | -0.5%, +7.2%, -6.5%, +10.7% | 1.23, 1.29, 1.16, 1.10 | none |
| Stalker | `node-t1-swamp-03` | 1 | —, —, —, — | —, —, —, — | none |
| Herd | `node-t2-plains-01` | 2 | +5.4%, -12.7%, -10.2%, -11.2% | 1.09, 1.05, 0.97, 0.90 | none |
| Swarm | `node-t2-plains-02` | 2 | +20.6%, +13.1%, -1.7%, +14.9% | 1.34, 1.16, 1.19, 1.17 | none |
| Sky | `node-t2-plains-03` | 2 | +4.9%, +2.4%, -14.2%, +15.0% | 1.06, 1.05, 0.95, 1.08 | none |
| Pack | `node-t2-forest-01` | 2 | -0.8%, +7.1%, +4.6%, +7.9% | 1.01, 0.99, 0.97, 1.11 | none |
| Grove | `node-t2-forest-02` | 2 | +3.1%, -4.6%, +0.1%, -4.0% | 0.89, 0.93, 0.90, 0.92 | none |
| Canopy | `node-t2-forest-03` | 2 | -3.9%, -3.7%, -1.5%, -0.7% | 1.35, 1.29, 1.36, 1.30 | none |
| Crag | `node-t2-mountain-01` | 2 | —, —, —, — | —, —, —, — | broadsword (lane 20/30, control 17/30 kills in 600 s); hammer (lane 15/30, control 13/30 kills in 600 s); axe (lane 20/30, control 16/30 kills in 600 s); rapier (lane 16/30, control 14/30 kills in 600 s); dagger (lane 27/30, control 23/30 kills in 600 s); broadsword (lane 20/30, control 19/30 kills in 600 s); hammer (lane 16/30, control 14/30 kills in 600 s); axe (lane 18/30, control 17/30 kills in 600 s); rapier (lane 17/30, control 14/30 kills in 600 s); dagger (lane 20/30, control 25/30 kills in 600 s); broadsword (lane 21/30, control 18/30 kills in 600 s); hammer (lane 15/30, control 14/30 kills in 600 s); axe (lane 19/30, control 18/30 kills in 600 s); rapier (lane 18/30, control 14/30 kills in 600 s); dagger (lane 26/30, control 25/30 kills in 600 s); broadsword (lane 22/30, control 18/30 kills in 600 s); axe (lane 21/30, control 17/30 kills in 600 s) |
| Ridge | `node-t2-mountain-02` | 2 | +2.8%, +11.0%, +16.0%, +10.9% | 1.60, 1.50, 1.63, 1.47 | none |
| Hopper | `node-t2-mountain-03` | 2 | +2.7%, -6.4%, +15.1%, +4.8% | 0.88, 1.00, 0.91, 0.87 | none |
| Brood | `node-t2-cave-01` | 2 | +8.4%, +12.0%, +16.0%, +17.6% | 1.26, 1.26, 1.28, 1.25 | none |
| Brute | `node-t2-cave-02` | 2 | —, —, —, — | —, —, —, — | broadsword (lane 17/30, control 19/30 kills in 600 s); hammer (lane 15/30, control 15/30 kills in 600 s); axe (lane 18/30, control 16/30 kills in 600 s); rapier (lane 19/30, control 17/30 kills in 600 s); dagger (lane 19/30, control 19/30 kills in 600 s); broadsword (lane 16/30, control 16/30 kills in 600 s); axe (lane 17/30, control 14/30 kills in 600 s); rapier (lane 17/30, control 18/30 kills in 600 s); dagger (lane 21/30, control 18/30 kills in 600 s); hammer (lane 16/30, control 15/30 kills in 600 s); axe (lane 17/30, control 17/30 kills in 600 s); dagger (lane 22/30, control 17/30 kills in 600 s); broadsword (lane 18/30, control 18/30 kills in 600 s); axe (lane 18/30, control 14/30 kills in 600 s); rapier (lane 19/30, control 16/30 kills in 600 s) |
| Deep | `node-t2-cave-03` | 2 | +0.8%, -5.8%, +3.3%, +1.6% | 0.67, 0.64, 0.68, 0.63 | none |
| Coven | `node-t2-swamp-01` | 2 | +20.7%, -2.4%, +1.0%, -10.4% | 1.41, 1.19, 1.14, 1.19 | none |
| Stalker | `node-t2-swamp-02` | 2 | —, —, —, — | —, —, —, — | none |
| Ape | `node-t2-jungle-01` | 2 | —, —, —, — | —, —, —, — | broadsword (lane 30/30, control 28/30 kills in 600 s); hammer (lane 30/30, control 28/30 kills in 600 s); axe (lane 25/30, control 23/30 kills in 600 s); axe (lane 23/30, control 23/30 kills in 600 s); broadsword (lane 29/30, control 30/30 kills in 600 s); hammer (lane 30/30, control 29/30 kills in 600 s); axe (lane 27/30, control 18/30 kills in 600 s); axe (lane 21/30, control 18/30 kills in 600 s); broadsword (lane 30/30, control 26/30 kills in 600 s); hammer (lane 29/30, control 30/30 kills in 600 s); axe (lane 26/30, control 21/30 kills in 600 s); axe (lane 21/30, control 21/30 kills in 600 s); broadsword (lane 30/30, control 27/30 kills in 600 s); axe (lane 28/30, control 23/30 kills in 600 s); axe (lane 20/30, control 23/30 kills in 600 s) |
| Undergrowth | `node-t2-jungle-02` | 2 | -24.8%, -4.7%, -2.7%, -11.7% | 0.91, 0.88, 0.89, 0.86 | none |
| Basilisk | `node-t2-desert-01` | 2 | -8.7%, —, -10.0%, -3.4% | 0.81, —, 0.75, 0.81 | broadsword (lane 30/30, control 29/30 kills in 600 s); axe (lane 30/30, control 27/30 kills in 600 s); axe (lane 27/30, control 27/30 kills in 600 s); axe (lane 30/30, control 28/30 kills in 600 s); rapier (lane 30/30, control 28/30 kills in 600 s); axe (lane 27/30, control 28/30 kills in 600 s); axe (lane 25/30, control 27/30 kills in 600 s); hammer (lane 30/30, control 29/30 kills in 600 s); axe (lane 29/30, control 27/30 kills in 600 s) |
| Scorpion | `node-t2-desert-02` | 2 | +12.0%, +10.0%, +20.8%, +13.4% | 1.25, 1.23, 1.27, 1.27 | axe (lane 28/30, control 27/30 kills in 600 s); axe (lane 29/30, control 28/30 kills in 600 s); axe (lane 27/30, control 30/30 kills in 600 s); axe (lane 28/30, control 25/30 kills in 600 s) |

## Verdicts

- Contracts measured: **28** of 33.
- Holding: **16**, of which **4** with all five guards passing; the rest hold on the mean but sit inside the instrument's own noise.
- Inverted: **12**, of which **1** decisive (all five guards).
- Not measured: **5**.

### Decisive inversions — the `drops` shortlist

The favoured lane lost on the family's own bodies with every guard passing.
The lane to move `drops` TO is **not** read off this table: with two lanes the
winner is by construction the lane the family punishes, and `drops === punishes`
is refused by `server/test/lineageMaterials.test.ts` and incoherent besides. The
wider pass below (`FAM_ALL_LANES=1`) names the lane.

| family | node | tier | band | drops today | margin | half-spread | TTK-N ratio |
|---|---|---:|---:|---|---:|---:|---:|
| Brute | `node-t1-cave-02` | 1 | 1 | `empowered` | -6.4% | +5.9% | 0.99 |

### Inverted but NOT decisive

The favoured lane lost on average, but at least one guard failed — so the
inversion is inside the instrument's noise and nothing moves. The failing
guards are in the table above.

- **Herd** T1 band 1: margin -1.5%, half-spread +3.9%; failed g3SeedsAgree, g4SpreadExcludesZero
- **Swarm** T1 band 1: margin -2.8%, half-spread +2.6%; failed g3SeedsAgree, g5RatioAgrees
- **Grove** T1 band 1: margin -0.2%, half-spread +12.4%; failed g3SeedsAgree, g4SpreadExcludesZero
- **Crag** T1 band 1: margin -10.5%, half-spread +10.8%; failed g3SeedsAgree, g4SpreadExcludesZero
- **Deep** T1 band 1: margin -4.2%, half-spread +10.4%; failed g3SeedsAgree, g4SpreadExcludesZero
- **Mire** T1 band 1: margin -6.2%, half-spread +5.3%; failed g5RatioAgrees
- **Herd** T2 band 2: margin -7.2%, half-spread +9.0%; failed g3SeedsAgree, g4SpreadExcludesZero, g5RatioAgrees
- **Grove** T2 band 2: margin -1.4%, half-spread +3.9%; failed g3SeedsAgree, g4SpreadExcludesZero
- **Canopy** T2 band 2: margin -2.4%, half-spread +1.6%; failed g5RatioAgrees
- **Undergrowth** T2 band 2: margin -10.9%, half-spread +11.0%; failed g4SpreadExcludesZero
- **Basilisk** T2 band 2: margin -7.4%, half-spread +3.3%; failed g1ReachedN, g3SeedsAgree

### Not measured, and why

- **Stalker** T1 (`node-t1-swamp-03`): no weapon lineage carries `bulwark`, so the punished half has no reference
- **Crag** T2 (`node-t2-mountain-01`): no seed produced both readings (see the dropped carriers)
- **Brute** T2 (`node-t2-cave-02`): no seed produced both readings (see the dropped carriers)
- **Stalker** T2 (`node-t2-swamp-02`): no weapon lineage carries `bulwark`, so the punished half has no reference
- **Ape** T2 (`node-t2-jungle-01`): no seed produced both readings (see the dropped carriers)

## The wider pass — every weapon lane on the same synthetic node

What names the lane a decisive inversion should move `drops` to.

Not measured on this run (`FAM_ALL_LANES=1` to add it).

## Refused purchases

None — every lane bought its whole band.

