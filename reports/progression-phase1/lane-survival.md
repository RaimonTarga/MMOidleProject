# Lineage lane matrix — Tier 1 (survival pass)

> The same bench as `lane-matrix.md`, restricted to five nodes — one per fieldable
> Tier-1 family — and run after the survival columns were added, so the "Survival"
> section below has numbers where the full matrix shows dashes. Read `lane-matrix.md`
> for throughput across all eighteen blends and this file for what the non-damage
> lanes buy instead.

Generated 2026-09-30T23:19:18.752Z from `105723c6e9ffeb7c59115a1cd54bf4e84eaa586e`.
20 reference profiles x 5 distinct T1 node blends x 2 seeds (101009, 101033), 90 s of sim per cell per seed; wall clock 3.0 min.

Throughput is kills per minute of SIM time with repopulation on; TTK is engaged
milliseconds per kill, which divides out the walk between mobs. Uplift is the
cell against the SAME lineage’s lane-less control on the SAME node — the only
reading in which the lane, and not the class or the weapon, is the variable.

## What the Tier-1 map actually offers

Every T1 node fields only `monsterPoolByTier[1]`, and every biome’s third family
debuts at biome tier 2, so `resolveNodeBlend` drops the unfieldable family and
rescales. The authored blends are the design target; the resolved ones are the
encounters that exist today.

| node | biome | authored blend | resolved blend | shares this row | mobs (of 10 slots) |
|---|---|---|---|---|---|
| `node-t1-mountain-02` | mountain | Ridge 70% / Hopper 20% / Crag 10% | Ridge 78% / Hopper 22% | 2 node(s): mountain-02, mountain-04 | ridge-archer x8, cliff-hopper x2 |
| `node-t1-cave-03` | cave | Deep 70% / Brood 20% / Brute 10% | Deep 88% / Brute 13% | 1 node(s): cave-03 | cave-lurker x9, cave-brute x1 |
| `node-t1-plains-01` | plains | Herd 70% / Swarm 20% / Sky 10% | Herd 78% / Swarm 22% | 1 node(s): plains-01 | boar x8, plains-slime x2 |
| `node-t1-plains-02` | plains | Swarm 70% / Sky 20% / Herd 10% | Swarm 88% / Herd 13% | 1 node(s): plains-02 | plains-slime x9, boar x1 |
| `node-t1-swamp-01` | swamp | Mire 70% / Coven 20% / Stalker 10% | Mire 100% | 6 node(s): swamp-01, swamp-02, swamp-03, swamp-04, swamp-05, swamp-06 | bog-slime x5, mud-toad x5 |

## TTK per lane per node

Milliseconds of ENGAGED time per kill, pooled over both seeds. Lower is faster.
Columns are the eighteen distinct blends in the table above.

| profile | lane | class | mountain-02 | cave-03 | plains-01 | plains-02 | swamp-01 |
|---|---|---|---:|---:|---:|---:|---:|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 6272 | 5333 | 2098 | 1376 | 3139 |
| `lineage-broadsword-empowered` | empowered | energy | 6612 | 5319 | 2124 | 1447 | 2983 |
| `lineage-broadsword-tempo` | tempo | energy | 5495 | 4728 | 2124 | 1500 | 2557 |
| `lineage-broadsword-baseline` | _control_ | energy | 6612 | 5550 | 2124 | 1500 | 2983 |
| `lineage-rapier-tempo` | tempo | cadence | 5659 | 4700 | 1668 | 1049 | 3188 |
| `lineage-rapier-affliction` | affliction | cadence | 5919 | 5885 | 1900 | 1203 | 3412 |
| `lineage-rapier-engagement` | engagement | cadence | 5788 | 5213 | 1859 | 1095 | 2800 |
| `lineage-rapier-baseline` | _control_ | cadence | 6950 | 6723 | 1970 | 1214 | 3412 |
| `lineage-hammer-empowered` | empowered | cooldown | 6650 | 4044 | 2308 | 1678 | 3507 |
| `lineage-hammer-control` | control | cooldown | 6519 | 4044 | 2308 | 1678 | 3507 |
| `lineage-hammer-engagement` | engagement | cooldown | 6763 | 4225 | 2250 | 1678 | 3500 |
| `lineage-hammer-baseline` | _control_ | cooldown | 6650 | 4044 | 2312 | 1735 | 3507 |
| `lineage-axe-tempo` | tempo | dot | 6736 | 6408 | 3032 | 2432 | 4113 |
| `lineage-axe-kill-chain` | kill-chain | dot | 7979 | 7533 | 2814 | 2155 | 4963 |
| `lineage-axe-empowered` | empowered | dot | 8031 | 8018 | 3194 | 2423 | 5029 |
| `lineage-axe-baseline` | _control_ | dot | 8177 | 8100 | 3194 | 2423 | 5029 |
| `lineage-dagger-affliction` | affliction | reload | 7331 | 6123 | 3016 | 2202 | 3862 |
| `lineage-dagger-control` | control | reload | 7008 | 6467 | 3084 | 1728 | 3830 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 7431 | 8108 | 3366 | 2422 | 4437 |
| `lineage-dagger-baseline` | _control_ | reload | 7431 | 8182 | 3191 | 2383 | 4600 |

### The same table as uplift over each lineage’s own control

| profile | lane | class | mountain-02 | cave-03 | plains-01 | plains-02 | swamp-01 |
|---|---|---|---:|---:|---:|---:|---:|
| `lineage-broadsword-kill-chain` | kill-chain | energy | +5.9% | +12.5% | +0.0% | -4.6% | -4.2% |
| `lineage-broadsword-empowered` | empowered | energy | +0.0% | +0.0% | +0.0% | +1.5% | +0.0% |
| `lineage-broadsword-tempo` | tempo | energy | +17.6% | +12.5% | +0.0% | +0.0% | +16.7% |
| `lineage-rapier-tempo` | tempo | cadence | +21.4% | +23.1% | +19.1% | +15.4% | -5.9% |
| `lineage-rapier-affliction` | affliction | cadence | +14.3% | +0.0% | +8.5% | +0.0% | +0.0% |
| `lineage-rapier-engagement` | engagement | cadence | +21.4% | +15.4% | +4.3% | +15.4% | +0.0% |
| `lineage-hammer-empowered` | empowered | cooldown | +0.0% | +0.0% | -4.9% | +6.5% | +0.0% |
| `lineage-hammer-control` | control | cooldown | +0.0% | +0.0% | -4.9% | +6.5% | +0.0% |
| `lineage-hammer-engagement` | engagement | cooldown | +0.0% | +0.0% | -7.3% | +6.5% | +0.0% |
| `lineage-axe-tempo` | tempo | dot | +7.7% | +18.2% | +3.0% | -7.5% | +14.3% |
| `lineage-axe-kill-chain` | kill-chain | dot | +7.7% | +9.1% | +6.1% | +22.5% | +14.3% |
| `lineage-axe-empowered` | empowered | dot | +0.0% | +0.0% | +0.0% | +0.0% | +0.0% |
| `lineage-dagger-affliction` | affliction | reload | +0.0% | +18.2% | +11.8% | +7.5% | +16.7% |
| `lineage-dagger-control` | control | reload | -7.7% | +9.1% | +8.8% | +42.5% | +11.1% |
| `lineage-dagger-kill-chain` | kill-chain | reload | +0.0% | +9.1% | +2.9% | +15.0% | +5.6% |

## Lane budget (design §9)

“At full rows for a tier, each lane’s measured throughput lands within ±10% of the
tier median on that lane’s intended variant.”

Median absolute throughput on the favoured node: **7.00 kills/min**. Median lane uplift over the matching control: **+0.0%**.

| lane | profile | favoured node | kills/min | vs abs median | uplift | uplift − median | in ±10% (abs) | shards |
|---|---|---|---:|---:|---:|---:|:--:|---|
| kill-chain | `lineage-broadsword-kill-chain` | `node-t1-cave-03` | 6.00 | -14.3% | +12.5% | +12.5% | NO | earned |
| empowered | `lineage-broadsword-empowered` | `node-t1-plains-01` | 16.67 | +138.1% | +0.0% | +0.0% | NO | earned |
| tempo | `lineage-broadsword-tempo` | `node-t1-plains-02` | 21.67 | +209.5% | +0.0% | +0.0% | NO | earned |
| tempo | `lineage-rapier-tempo` | `node-t1-plains-02` | 25.00 | +257.1% | +15.4% | +15.4% | NO | earned |
| affliction | `lineage-rapier-affliction` | `node-t1-swamp-01` | 5.67 | -19.0% | +0.0% | +0.0% | NO | earned |
| engagement | `lineage-rapier-engagement` | **no T1 node favours this lane** | — | — | — | — | n/a | granted (no T1 source) |
| empowered | `lineage-hammer-empowered` | `node-t1-plains-01` | 13.00 | +85.7% | -4.9% | -4.9% | NO | earned |
| control | `lineage-hammer-control` | `node-t1-mountain-02` | 5.33 | -23.8% | +0.0% | +0.0% | NO | earned |
| engagement | `lineage-hammer-engagement` | **no T1 node favours this lane** | — | — | — | — | n/a | granted (no T1 source) |
| tempo | `lineage-axe-tempo` | `node-t1-plains-02` | 12.33 | +76.2% | -7.5% | -7.5% | NO | earned |
| kill-chain | `lineage-axe-kill-chain` | `node-t1-cave-03` | 4.00 | -42.9% | +9.1% | +9.1% | NO | earned |
| empowered | `lineage-axe-empowered` | `node-t1-plains-01` | 11.00 | +57.1% | +0.0% | +0.0% | NO | earned |
| affliction | `lineage-dagger-affliction` | `node-t1-swamp-01` | 7.00 | +0.0% | +16.7% | +16.7% | yes | earned |
| control | `lineage-dagger-control` | `node-t1-mountain-02` | 4.00 | -42.9% | -7.7% | -7.7% | NO | earned |
| kill-chain | `lineage-dagger-kill-chain` | `node-t1-cave-03` | 4.00 | -42.9% | +9.1% | +9.1% | NO | earned |

### How much of the absolute column is class, not lane

| control | class | weapon | mean kills/min over all nodes | vs control median |
|---|---|---|---:|---:|
| `lineage-broadsword-baseline` | energy | iron-broadsword | 11.47 | +28.4% |
| `lineage-rapier-baseline` | cadence | flash-rapier | 10.40 | +16.4% |
| `lineage-hammer-baseline` | cooldown | heavy-hammer | 8.93 | +0.0% |
| `lineage-axe-baseline` | dot | chaotic-axe | 7.40 | -17.2% |
| `lineage-dagger-baseline` | reload | ashbrand-blade | 7.73 | -13.4% |

### Lane uplift over every node

The same uplift as above, averaged over all node blends rather than only the
favoured one — the reading least sensitive to which single encounter a lane
happened to be measured on.

| lane | profile | mean uplift over all nodes | uplift on favoured node | worst node | best node | payoff fx fired (all nodes) |
|---|---|---:|---:|---|---|---:|
| kill-chain | `lineage-broadsword-kill-chain` | +1.9% | +12.5% | plains-02 -4.6% | cave-03 +12.5% | 171 |
| empowered | `lineage-broadsword-empowered` | +0.3% | +0.0% | mountain-02 +0.0% | plains-02 +1.5% | 44 |
| tempo | `lineage-broadsword-tempo` | +9.4% | +0.0% | plains-01 +0.0% | mountain-02 +17.6% | 174 |
| tempo | `lineage-rapier-tempo` | +14.6% | +15.4% | swamp-01 -5.9% | cave-03 +23.1% | 208 |
| affliction | `lineage-rapier-affliction` | +4.6% | +0.0% | cave-03 +0.0% | mountain-02 +14.3% | 573 |
| engagement | `lineage-rapier-engagement` | +11.3% | — | swamp-01 +0.0% | mountain-02 +21.4% | 66 |
| empowered | `lineage-hammer-empowered` | +0.3% | -4.9% | plains-01 -4.9% | plains-02 +6.5% | 75 |
| control | `lineage-hammer-control` | +0.3% | +0.0% | plains-01 -4.9% | plains-02 +6.5% | 65 |
| engagement | `lineage-hammer-engagement` | -0.2% | — | plains-01 -7.3% | plains-02 +6.5% | 63 |
| tempo | `lineage-axe-tempo` | +7.1% | -7.5% | plains-02 -7.5% | cave-03 +18.2% | 164 |
| kill-chain | `lineage-axe-kill-chain` | +11.9% | +9.1% | plains-01 +6.1% | plains-02 +22.5% | 120 |
| empowered | `lineage-axe-empowered` | +0.0% | +0.0% | mountain-02 +0.0% | swamp-01 +0.0% | 19 |
| affliction | `lineage-dagger-affliction` | +10.8% | +16.7% | mountain-02 +0.0% | cave-03 +18.2% | 734 |
| control | `lineage-dagger-control` | +12.8% | -7.7% | mountain-02 -7.7% | plains-02 +42.5% | 239 |
| kill-chain | `lineage-dagger-kill-chain` | +6.5% | +9.1% | mountain-02 +0.0% | plains-02 +15.0% | 0 |

## Survival — what the non-damage lanes buy instead

Control’s slow and Engagement’s opening DR buy time, not throughput, so the
TTK matrix above reads them as worth nothing. This is the same runs read as
survival: mean HP fraction while engaged and damage taken per engaged second,
each against the same lineage’s lane-less control.

| profile | lane | class | mean HP while engaged | damage taken / engaged s | deaths | Δ HP vs control | Δ damage taken vs control |
|---|---|---|---:|---:|---:|---:|---:|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 0.98 | 2.00 | 0 | -0.5% | +8.3% |
| `lineage-broadsword-empowered` | empowered | energy | 0.99 | 1.61 | 0 | +0.2% | -12.8% |
| `lineage-broadsword-tempo` | tempo | energy | 0.98 | 1.80 | 0 | -0.3% | -2.2% |
| `lineage-broadsword-baseline` | _control_ | energy | 0.98 | 1.84 | 0 | — | — |
| `lineage-rapier-tempo` | tempo | cadence | 0.95 | 8.89 | 0 | +0.9% | -4.0% |
| `lineage-rapier-affliction` | affliction | cadence | 0.95 | 9.26 | 0 | +0.6% | +0.1% |
| `lineage-rapier-engagement` | engagement | cadence | 0.95 | 8.57 | 0 | +1.1% | -7.4% |
| `lineage-rapier-baseline` | _control_ | cadence | 0.94 | 9.26 | 0 | — | — |
| `lineage-hammer-empowered` | empowered | cooldown | 0.95 | 6.27 | 0 | +0.4% | -2.3% |
| `lineage-hammer-control` | control | cooldown | 0.95 | 6.26 | 0 | +0.4% | -2.4% |
| `lineage-hammer-engagement` | engagement | cooldown | 0.96 | 5.95 | 0 | +0.5% | -7.3% |
| `lineage-hammer-baseline` | _control_ | cooldown | 0.95 | 6.42 | 0 | — | — |
| `lineage-axe-tempo` | tempo | dot | 0.95 | 5.22 | 0 | +1.7% | -1.6% |
| `lineage-axe-kill-chain` | kill-chain | dot | 0.93 | 5.25 | 1 | -0.1% | -1.0% |
| `lineage-axe-empowered` | empowered | dot | 0.93 | 5.31 | 1 | +0.2% | +0.1% |
| `lineage-axe-baseline` | _control_ | dot | 0.93 | 5.30 | 1 | — | — |
| `lineage-dagger-affliction` | affliction | reload | 0.94 | 6.26 | 0 | +0.9% | +3.6% |
| `lineage-dagger-control` | control | reload | 0.95 | 6.40 | 0 | +1.7% | +5.9% |
| `lineage-dagger-kill-chain` | kill-chain | reload | 0.94 | 5.96 | 0 | +0.2% | -1.4% |
| `lineage-dagger-baseline` | _control_ | reload | 0.94 | 6.04 | 0 | — | — |

## Encounter check (design §9)

“Does the intended lane win by ~30%? Does the punished lane still clear?” The
favoured lane is read off `FamilyDefinition.drops`; the shipped family table has
no `favours` field.

| family | node | favoured | punished | fav abs Δ | fav uplift Δ | pun abs Δ | pun uplift Δ | pun ≥70% | pun deaths | verdict (abs) |
|---|---|---|---|---:|---:|---:|---:|:--:|---:|---|
| Ridge | `node-t1-mountain-02` | control (n=2) | kill-chain (n=3) | -12.5% | -3.8% | -12.5% | +5.9% | yes | 1 | favoured lane does NOT win by ~30% |
| Deep | `node-t1-cave-03` | kill-chain (n=3) | engagement (n=2) | -20.0% | +0.0% | +3.3% | -1.4% | yes | 0 | favoured lane does NOT win by ~30% |
| Herd | `node-t1-plains-01` | empowered (n=3) | tempo (n=3) | +0.0% | -2.9% | +28.2% | +0.1% | yes | 0 | favoured lane does NOT win by ~30% |
| Swarm | `node-t1-plains-02` | tempo (n=3) | empowered (n=3) | +32.7% | -6.5% | +0.0% | -5.0% | yes | 0 | favoured lane wins |
| Mire | `node-t1-swamp-01` | affliction (n=2) | empowered (n=3) | +11.8% | +8.3% | -11.8% | +0.0% | yes | 0 | favoured lane does NOT win by ~30% |

## Refused purchases

None — every lane bought its whole band.

## Per-node detail

### `node-t1-mountain-02` — Ridge 78% / Hopper 22% (mountain; shared by 2 authored nodes)

Dominant family **Ridge** drops `control`, punishes `kill-chain`. Authored Ridge 70% / Hopper 20% / Crag 10%; unfieldable at T1: Crag.

| profile | lane | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 18 | 6272 | 6.00 | +5.9% | 0 | kill-chain.kill-pulse x18 |
| `lineage-broadsword-empowered` | empowered | energy | 17 | 6612 | 5.67 | +0.0% | 0 | empowered.weak-point x8 |
| `lineage-broadsword-tempo` | tempo | energy | 20 | 5495 | 6.67 | +17.6% | 0 | tempo.ghost-strike x34 |
| `lineage-broadsword-baseline` | _control_ | energy | 17 | 6612 | 5.67 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | cadence | 17 | 5659 | 5.67 | +21.4% | 0 | tempo.ghost-strike x44 |
| `lineage-rapier-affliction` | affliction | cadence | 16 | 5919 | 5.33 | +14.3% | 0 | affliction.bleed-pips x116 |
| `lineage-rapier-engagement` | engagement | cadence | 17 | 5788 | 5.67 | +21.4% | 0 | engagement.opening-flash x13 |
| `lineage-rapier-baseline` | _control_ | cadence | 14 | 6950 | 4.67 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | cooldown | 16 | 6650 | 5.33 | +0.0% | 0 | empowered.plating-crack x16 |
| `lineage-hammer-control` | control | cooldown | 16 | 6519 | 5.33 | +0.0% | 0 | control.frost-drag x14 |
| `lineage-hammer-engagement` | engagement | cooldown | 16 | 6763 | 5.33 | +0.0% | 0 | engagement.brace-sparks x13 |
| `lineage-hammer-baseline` | _control_ | cooldown | 16 | 6650 | 5.33 | — | 0 | — |
| `lineage-axe-tempo` | tempo | dot | 14 | 6736 | 4.67 | +7.7% | 0 | tempo.ghost-strike x32 |
| `lineage-axe-kill-chain` | kill-chain | dot | 14 | 7979 | 4.67 | +7.7% | 1 | kill-chain.kill-pulse x8 |
| `lineage-axe-empowered` | empowered | dot | 13 | 8031 | 4.33 | +0.0% | 1 | empowered.weak-point x8 |
| `lineage-axe-baseline` | _control_ | dot | 13 | 8177 | 4.33 | — | 1 | — |
| `lineage-dagger-affliction` | affliction | reload | 13 | 7331 | 4.33 | +0.0% | 0 | affliction.venom-pips x134 |
| `lineage-dagger-control` | control | reload | 12 | 7008 | 4.00 | -7.7% | 0 | control.frost-drag x42 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 13 | 7431 | 4.33 | +0.0% | 0 | — |
| `lineage-dagger-baseline` | _control_ | reload | 13 | 7431 | 4.33 | — | 0 | — |

### `node-t1-cave-03` — Deep 88% / Brute 13% (cave; shared by 1 authored node)

Dominant family **Deep** drops `kill-chain`, punishes `engagement`. Authored Deep 70% / Brood 20% / Brute 10%; unfieldable at T1: Brood.

| profile | lane | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 18 | 5333 | 6.00 | +12.5% | 0 | kill-chain.kill-pulse x18 |
| `lineage-broadsword-empowered` | empowered | energy | 16 | 5319 | 5.33 | +0.0% | 0 | empowered.weak-point x8 |
| `lineage-broadsword-tempo` | tempo | energy | 18 | 4728 | 6.00 | +12.5% | 0 | tempo.ghost-strike x30 |
| `lineage-broadsword-baseline` | _control_ | energy | 16 | 5550 | 5.33 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | cadence | 16 | 4700 | 5.33 | +23.1% | 0 | tempo.ghost-strike x40 |
| `lineage-rapier-affliction` | affliction | cadence | 13 | 5885 | 4.33 | +0.0% | 0 | affliction.bleed-pips x107 |
| `lineage-rapier-engagement` | engagement | cadence | 15 | 5213 | 5.00 | +15.4% | 0 | engagement.opening-flash x14 |
| `lineage-rapier-baseline` | _control_ | cadence | 13 | 6723 | 4.33 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | cooldown | 16 | 4044 | 5.33 | +0.0% | 0 | empowered.plating-crack x16 |
| `lineage-hammer-control` | control | cooldown | 16 | 4044 | 5.33 | +0.0% | 0 | control.frost-drag x11 |
| `lineage-hammer-engagement` | engagement | cooldown | 16 | 4225 | 5.33 | +0.0% | 0 | engagement.brace-sparks x14 |
| `lineage-hammer-baseline` | _control_ | cooldown | 16 | 4044 | 5.33 | — | 0 | — |
| `lineage-axe-tempo` | tempo | dot | 13 | 6408 | 4.33 | +18.2% | 0 | tempo.ghost-strike x31 |
| `lineage-axe-kill-chain` | kill-chain | dot | 12 | 7533 | 4.00 | +9.1% | 0 | kill-chain.kill-pulse x12 |
| `lineage-axe-empowered` | empowered | dot | 11 | 8018 | 3.67 | +0.0% | 0 | empowered.weak-point x11 |
| `lineage-axe-baseline` | _control_ | dot | 11 | 8100 | 3.67 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | reload | 13 | 6123 | 4.33 | +18.2% | 0 | affliction.venom-pips x130 |
| `lineage-dagger-control` | control | reload | 12 | 6467 | 4.00 | +9.1% | 0 | control.frost-drag x41 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 12 | 8108 | 4.00 | +9.1% | 0 | — |
| `lineage-dagger-baseline` | _control_ | reload | 11 | 8182 | 3.67 | — | 0 | — |

### `node-t1-plains-01` — Herd 78% / Swarm 22% (plains; shared by 1 authored node)

Dominant family **Herd** drops `empowered`, punishes `tempo`. Authored Herd 70% / Swarm 20% / Sky 10%; unfieldable at T1: Sky.

| profile | lane | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 50 | 2098 | 16.67 | +0.0% | 0 | kill-chain.kill-pulse x50 |
| `lineage-broadsword-empowered` | empowered | energy | 50 | 2124 | 16.67 | +0.0% | 0 | empowered.weak-point x11 |
| `lineage-broadsword-tempo` | tempo | energy | 50 | 2124 | 16.67 | +0.0% | 0 | tempo.ghost-strike x41 |
| `lineage-broadsword-baseline` | _control_ | energy | 50 | 2124 | 16.67 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | cadence | 56 | 1668 | 18.67 | +19.1% | 0 | tempo.ghost-strike x53 |
| `lineage-rapier-affliction` | affliction | cadence | 51 | 1900 | 17.00 | +8.5% | 0 | affliction.bleed-pips x147 |
| `lineage-rapier-engagement` | engagement | cadence | 49 | 1859 | 16.33 | +4.3% | 0 | engagement.opening-flash x13 |
| `lineage-rapier-baseline` | _control_ | cadence | 47 | 1970 | 15.67 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | cooldown | 39 | 2308 | 13.00 | -4.9% | 0 | empowered.plating-crack x16 |
| `lineage-hammer-control` | control | cooldown | 39 | 2308 | 13.00 | -4.9% | 0 | control.frost-drag x16 |
| `lineage-hammer-engagement` | engagement | cooldown | 38 | 2250 | 12.67 | -7.3% | 0 | engagement.brace-sparks x13 |
| `lineage-hammer-baseline` | _control_ | cooldown | 41 | 2312 | 13.67 | — | 0 | — |
| `lineage-axe-tempo` | tempo | dot | 34 | 3032 | 11.33 | +3.0% | 0 | tempo.ghost-strike x40 |
| `lineage-axe-kill-chain` | kill-chain | dot | 35 | 2814 | 11.67 | +6.1% | 0 | kill-chain.kill-pulse x35 |
| `lineage-axe-empowered` | empowered | dot | 33 | 3194 | 11.00 | +0.0% | 0 | — |
| `lineage-axe-baseline` | _control_ | dot | 33 | 3194 | 11.00 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | reload | 38 | 3016 | 12.67 | +11.8% | 0 | affliction.venom-pips x174 |
| `lineage-dagger-control` | control | reload | 37 | 3084 | 12.33 | +8.8% | 0 | control.frost-drag x57 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 35 | 3366 | 11.67 | +2.9% | 0 | — |
| `lineage-dagger-baseline` | _control_ | reload | 34 | 3191 | 11.33 | — | 0 | — |

### `node-t1-plains-02` — Swarm 88% / Herd 13% (plains; shared by 1 authored node)

Dominant family **Swarm** drops `tempo`, punishes `empowered`. Authored Swarm 70% / Sky 20% / Herd 10%; unfieldable at T1: Sky.

| profile | lane | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 62 | 1376 | 20.67 | -4.6% | 0 | kill-chain.kill-pulse x62 |
| `lineage-broadsword-empowered` | empowered | energy | 66 | 1447 | 22.00 | +1.5% | 0 | empowered.weak-point x10 |
| `lineage-broadsword-tempo` | tempo | energy | 65 | 1500 | 21.67 | +0.0% | 0 | tempo.ghost-strike x40 |
| `lineage-broadsword-baseline` | _control_ | energy | 65 | 1500 | 21.67 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | cadence | 75 | 1049 | 25.00 | +15.4% | 0 | tempo.ghost-strike x44 |
| `lineage-rapier-affliction` | affliction | cadence | 65 | 1203 | 21.67 | +0.0% | 0 | affliction.bleed-pips x118 |
| `lineage-rapier-engagement` | engagement | cadence | 75 | 1095 | 25.00 | +15.4% | 0 | engagement.opening-flash x12 |
| `lineage-rapier-baseline` | _control_ | cadence | 65 | 1214 | 21.67 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | cooldown | 49 | 1678 | 16.33 | +6.5% | 0 | empowered.plating-crack x16 |
| `lineage-hammer-control` | control | cooldown | 49 | 1678 | 16.33 | +6.5% | 0 | control.frost-drag x15 |
| `lineage-hammer-engagement` | engagement | cooldown | 49 | 1678 | 16.33 | +6.5% | 0 | engagement.brace-sparks x12 |
| `lineage-hammer-baseline` | _control_ | cooldown | 46 | 1735 | 15.33 | — | 0 | — |
| `lineage-axe-tempo` | tempo | dot | 37 | 2432 | 12.33 | -7.5% | 0 | tempo.ghost-strike x36 |
| `lineage-axe-kill-chain` | kill-chain | dot | 49 | 2155 | 16.33 | +22.5% | 0 | kill-chain.kill-pulse x49 |
| `lineage-axe-empowered` | empowered | dot | 40 | 2423 | 13.33 | +0.0% | 0 | — |
| `lineage-axe-baseline` | _control_ | dot | 40 | 2423 | 13.33 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | reload | 43 | 2202 | 14.33 | +7.5% | 0 | affliction.venom-pips x157 |
| `lineage-dagger-control` | control | reload | 57 | 1728 | 19.00 | +42.5% | 0 | control.frost-drag x57 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 46 | 2422 | 15.33 | +15.0% | 0 | — |
| `lineage-dagger-baseline` | _control_ | reload | 40 | 2383 | 13.33 | — | 0 | — |

### `node-t1-swamp-01` — Mire 100% (swamp; shared by 6 authored nodes)

Dominant family **Mire** drops `affliction`, punishes `empowered`. Authored Mire 70% / Coven 20% / Stalker 10%; unfieldable at T1: Coven, Stalker.

| profile | lane | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |
|---|---|---|---:|---:|---:|---:|---:|---|
| `lineage-broadsword-kill-chain` | kill-chain | energy | 23 | 3139 | 7.67 | -4.2% | 0 | kill-chain.kill-pulse x23 |
| `lineage-broadsword-empowered` | empowered | energy | 24 | 2983 | 8.00 | +0.0% | 0 | empowered.weak-point x7 |
| `lineage-broadsword-tempo` | tempo | energy | 28 | 2557 | 9.33 | +16.7% | 0 | tempo.ghost-strike x29 |
| `lineage-broadsword-baseline` | _control_ | energy | 24 | 2983 | 8.00 | — | 0 | — |
| `lineage-rapier-tempo` | tempo | cadence | 16 | 3188 | 5.33 | -5.9% | 0 | tempo.ghost-strike x27 |
| `lineage-rapier-affliction` | affliction | cadence | 17 | 3412 | 5.67 | +0.0% | 0 | affliction.bleed-pips x85 |
| `lineage-rapier-engagement` | engagement | cadence | 17 | 2800 | 5.67 | +0.0% | 0 | engagement.opening-flash x14 |
| `lineage-rapier-baseline` | _control_ | cadence | 17 | 3412 | 5.67 | — | 0 | — |
| `lineage-hammer-empowered` | empowered | cooldown | 15 | 3507 | 5.00 | +0.0% | 0 | empowered.plating-crack x11 |
| `lineage-hammer-control` | control | cooldown | 15 | 3507 | 5.00 | +0.0% | 0 | control.frost-drag x9 |
| `lineage-hammer-engagement` | engagement | cooldown | 15 | 3500 | 5.00 | +0.0% | 0 | engagement.brace-sparks x11 |
| `lineage-hammer-baseline` | _control_ | cooldown | 15 | 3507 | 5.00 | — | 0 | — |
| `lineage-axe-tempo` | tempo | dot | 16 | 4113 | 5.33 | +14.3% | 0 | tempo.ghost-strike x25 |
| `lineage-axe-kill-chain` | kill-chain | dot | 16 | 4963 | 5.33 | +14.3% | 0 | kill-chain.kill-pulse x16 |
| `lineage-axe-empowered` | empowered | dot | 14 | 5029 | 4.67 | +0.0% | 0 | — |
| `lineage-axe-baseline` | _control_ | dot | 14 | 5029 | 4.67 | — | 0 | — |
| `lineage-dagger-affliction` | affliction | reload | 21 | 3862 | 7.00 | +16.7% | 0 | affliction.venom-pips x139 |
| `lineage-dagger-control` | control | reload | 20 | 3830 | 6.67 | +11.1% | 0 | control.frost-drag x42 |
| `lineage-dagger-kill-chain` | kill-chain | reload | 19 | 4437 | 6.33 | +5.6% | 0 | — |
| `lineage-dagger-baseline` | _control_ | reload | 18 | 4600 | 6.00 | — | 0 | — |

