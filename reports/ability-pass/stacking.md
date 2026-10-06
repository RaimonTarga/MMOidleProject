# The T3/T4 stacking change, before and after (W0 measurement)

A MEASUREMENT for the designer; nothing was changed. The legibility run routed every
lineage affliction through one point (`lineageAffliction.ts`): `poison-stack` now adds one
application per firing where it used to stack, and a standalone `hemorrhage` adds where it
used to refresh (legibility report, "Not verified: T3/T4 balance").

- **before** = `7360e3b0` (develop's first parent of the legibility merge), in `../mmo-lin-w1d2`
- **mid** = `d593ceea` (the legibility merge), in `../mmo-lin-w2a`
- **after** = `e56d530e` (the tip; adds `9ff1b9eb` and `6ea13a91`, the two Effect-parity commits)

Attribution: **before → mid** is the legibility run (the stacking change and everything else it
merged); **mid → after** is the two parity commits. In both instruments mid → after moved
**nothing** (6,000/6,000 and 78/78 rows identical, `wallMs` dropped): both parity commits
touch only T1 ranked leans and the Hammer's T1 verb, which no row here buys. Every delta
below is the legibility run's.

Same plan file and seeds on all three commits (the plans regenerate byte-identical at each).
Tables: mean dps (boss HP removed ÷ fight seconds) and win rate.

## (a) The T2 boss lab, Rapier and Dagger

`_t1BossPlan.ts --matrix=composition --tier=2 --seeds=10 --weapons=rapier,dagger`: per weapon
the nine T2 lean × verb pairs plus the no-card control (the band-2 form, its T2 counterpart
kit, a tier-2 balanced frame), six classes × the five T2 dungeon bosses × 10 seeds = 6,000
fights per commit (`stacking-t2lab-before/-d593ceea/-after.jsonl`; every cell in
`stacking-t2lab-cells.md`). 0 error rows. 1,498–1,505 s per commit at 4 shards, the three
commits concurrently.

**What moved: only the pairs whose LEAN is Affliction** (Rapier `affliction×*`, Dagger
`affliction×*`: 1,766 of 6,000 fights changed; the other 14 candidates, both no-card controls
included, are fight-for-fight identical apart from the lab's added `leanRank: null` field).
The capstones on their own (`gale-needle`, `mirebrand`) did not move: their control rows are
identical. The Dagger's Affliction lean got **stronger** at T2 (+7.6% on its pure pair, +2.2/+2.3% with
the other verbs), the Rapier's moved −0.2 to +1.9%. Per cell (10 fights) the extremes are
+15.0% (Dagger `affliction×affliction`, Apprentice vs the Dreadbore) and −6.8% (the same pair,
Apprentice vs the Razortusk); no cell lost a win, and three gained two of ten (Rapier
`affliction×affliction`: Striker vs the Mire Behemoth 2→4, Apprentice vs the Juggernaut 8→10
and vs the Dreadbore 3→5).

### Per candidate (pooled over class × boss × seed)

| candidate | n | dps before | dps mid | dps after | Δ before→mid | Δ mid→after | Δdps | win before | win after | Δwin |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| cmpt2-rapier-tempo×tempo | 300 | 91.9 | 91.9 | 91.9 | 0.0% | 0.0% | 0.0% | 67% | 67% | 0.0pt |
| cmpt2-rapier-tempo×affliction | 300 | 81.5 | 81.5 | 81.5 | 0.0% | 0.0% | 0.0% | 59% | 59% | 0.0pt |
| cmpt2-rapier-tempo×engagement | 300 | 82.3 | 82.3 | 82.3 | 0.0% | 0.0% | 0.0% | 59% | 59% | 0.0pt |
| cmpt2-rapier-affliction×tempo | 300 | 96.2 | 96.0 | 96.0 | -0.2% | 0.0% | -0.2% | 68% | 68% | 0.0pt |
| cmpt2-rapier-affliction×affliction | 300 | 97.2 | 99.1 | 99.1 | +1.9% | 0.0% | +1.9% | 69% | 71% | +2.3pt |
| cmpt2-rapier-affliction×engagement | 300 | 87.6 | 87.6 | 87.6 | 0.0% | 0.0% | 0.0% | 63% | 63% | 0.0pt |
| cmpt2-rapier-engagement×tempo | 300 | 106.8 | 106.8 | 106.8 | 0.0% | 0.0% | 0.0% | 75% | 75% | 0.0pt |
| cmpt2-rapier-engagement×affliction | 300 | 92.8 | 92.8 | 92.8 | 0.0% | 0.0% | 0.0% | 68% | 68% | 0.0pt |
| cmpt2-rapier-engagement×engagement | 300 | 94.3 | 94.3 | 94.3 | 0.0% | 0.0% | 0.0% | 67% | 67% | 0.0pt |
| cmpt2-rapier-control | 300 | 79.2 | 79.2 | 79.2 | 0.0% | 0.0% | 0.0% | 59% | 59% | 0.0pt |
| cmpt2-dagger-affliction×affliction | 300 | 128.5 | 138.4 | 138.4 | +7.6% | 0.0% | +7.6% | 99% | 99% | 0.0pt |
| cmpt2-dagger-affliction×control | 300 | 88.3 | 90.4 | 90.4 | +2.3% | 0.0% | +2.3% | 99% | 99% | 0.0pt |
| cmpt2-dagger-affliction×kill-chain | 300 | 88.0 | 89.9 | 89.9 | +2.2% | 0.0% | +2.2% | 99% | 99% | 0.0pt |
| cmpt2-dagger-control×affliction | 300 | 85.2 | 85.2 | 85.2 | 0.0% | 0.0% | 0.0% | 99% | 99% | 0.0pt |
| cmpt2-dagger-control×control | 300 | 83.0 | 83.0 | 83.0 | 0.0% | 0.0% | 0.0% | 100% | 100% | 0.0pt |
| cmpt2-dagger-control×kill-chain | 300 | 84.7 | 84.7 | 84.7 | 0.0% | 0.0% | 0.0% | 100% | 100% | 0.0pt |
| cmpt2-dagger-kill-chain×affliction | 300 | 87.0 | 87.0 | 87.0 | 0.0% | 0.0% | 0.0% | 100% | 100% | 0.0pt |
| cmpt2-dagger-kill-chain×control | 300 | 85.2 | 85.2 | 85.2 | 0.0% | 0.0% | 0.0% | 100% | 100% | 0.0pt |
| cmpt2-dagger-kill-chain×kill-chain | 300 | 85.0 | 85.0 | 85.0 | 0.0% | 0.0% | 0.0% | 100% | 100% | 0.0pt |
| cmpt2-dagger-control | 300 | 84.5 | 84.5 | 84.5 | 0.0% | 0.0% | 0.0% | 99% | 99% | 0.0pt |

### Per weapon × class × boss (pooled over the weapon's candidates and seeds)

| weapon | class | boss | n | dps before | dps mid | dps after | Δ before→mid | Δ mid→after | Δdps | win before | win after | Δwin |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| cmpt2-rapier | striker | apex-timberclaw | 100 | 177.5 | 177.7 | 177.7 | +0.1% | 0.0% | +0.1% | 100% | 100% | 0.0pt |
| cmpt2-rapier | striker | chitinous-dreadbore | 100 | 60.1 | 60.0 | 60.0 | 0.0% | 0.0% | 0.0% | 0% | 0% | 0.0pt |
| cmpt2-rapier | striker | gorging-razortusk | 100 | 127.1 | 127.3 | 127.3 | +0.2% | 0.0% | +0.2% | 100% | 100% | 0.0pt |
| cmpt2-rapier | striker | mire-gorged-behemoth | 100 | 30.0 | 30.1 | 30.1 | +0.1% | 0.0% | +0.1% | 51% | 53% | +2.0pt |
| cmpt2-rapier | striker | stoneplate-juggernaut | 100 | 83.5 | 83.5 | 83.5 | 0.0% | 0.0% | 0.0% | 14% | 14% | 0.0pt |
| cmpt2-rapier | squire | apex-timberclaw | 100 | 143.0 | 143.0 | 143.0 | 0.0% | 0.0% | 0.0% | 100% | 100% | 0.0pt |
| cmpt2-rapier | squire | chitinous-dreadbore | 100 | 50.4 | 50.3 | 50.3 | -0.2% | 0.0% | -0.2% | 0% | 0% | 0.0pt |
| cmpt2-rapier | squire | gorging-razortusk | 100 | 102.1 | 102.2 | 102.2 | +0.2% | 0.0% | +0.2% | 100% | 100% | 0.0pt |
| cmpt2-rapier | squire | mire-gorged-behemoth | 100 | 41.1 | 41.1 | 41.1 | 0.0% | 0.0% | 0.0% | 4% | 4% | 0.0pt |
| cmpt2-rapier | squire | stoneplate-juggernaut | 100 | 69.0 | 68.9 | 68.9 | -0.1% | 0.0% | -0.1% | 98% | 98% | 0.0pt |
| cmpt2-rapier | slinger | apex-timberclaw | 100 | 135.1 | 135.3 | 135.3 | +0.1% | 0.0% | +0.1% | 100% | 100% | 0.0pt |
| cmpt2-rapier | slinger | chitinous-dreadbore | 100 | 76.4 | 76.4 | 76.4 | 0.0% | 0.0% | 0.0% | 29% | 29% | 0.0pt |
| cmpt2-rapier | slinger | gorging-razortusk | 100 | 78.4 | 78.5 | 78.5 | 0.0% | 0.0% | 0.0% | 100% | 100% | 0.0pt |
| cmpt2-rapier | slinger | mire-gorged-behemoth | 100 | 77.9 | 78.0 | 78.0 | +0.2% | 0.0% | +0.2% | 58% | 58% | 0.0pt |
| cmpt2-rapier | slinger | stoneplate-juggernaut | 100 | 76.5 | 76.4 | 76.4 | 0.0% | 0.0% | 0.0% | 28% | 28% | 0.0pt |
| cmpt2-rapier | spirit | apex-timberclaw | 100 | 180.4 | 180.7 | 180.7 | +0.2% | 0.0% | +0.2% | 100% | 100% | 0.0pt |
| cmpt2-rapier | spirit | chitinous-dreadbore | 100 | 90.5 | 90.5 | 90.5 | 0.0% | 0.0% | 0.0% | 29% | 30% | +1.0pt |
| cmpt2-rapier | spirit | gorging-razortusk | 100 | 108.0 | 107.9 | 107.9 | -0.1% | 0.0% | -0.1% | 100% | 100% | 0.0pt |
| cmpt2-rapier | spirit | mire-gorged-behemoth | 100 | 98.9 | 99.0 | 99.0 | +0.2% | 0.0% | +0.2% | 92% | 92% | 0.0pt |
| cmpt2-rapier | spirit | stoneplate-juggernaut | 100 | 92.8 | 93.0 | 93.0 | +0.2% | 0.0% | +0.2% | 100% | 100% | 0.0pt |
| cmpt2-rapier | apprentice | apex-timberclaw | 100 | 144.6 | 145.8 | 145.8 | +0.8% | 0.0% | +0.8% | 100% | 100% | 0.0pt |
| cmpt2-rapier | apprentice | chitinous-dreadbore | 100 | 81.1 | 81.8 | 81.8 | +0.9% | 0.0% | +0.9% | 3% | 5% | +2.0pt |
| cmpt2-rapier | apprentice | gorging-razortusk | 100 | 91.0 | 91.4 | 91.4 | +0.4% | 0.0% | +0.4% | 100% | 100% | 0.0pt |
| cmpt2-rapier | apprentice | mire-gorged-behemoth | 100 | 83.4 | 83.7 | 83.7 | +0.3% | 0.0% | +0.3% | 100% | 100% | 0.0pt |
| cmpt2-rapier | apprentice | stoneplate-juggernaut | 100 | 89.4 | 90.3 | 90.3 | +0.9% | 0.0% | +0.9% | 8% | 10% | +2.0pt |
| cmpt2-rapier | conduit | apex-timberclaw | 100 | 118.0 | 118.1 | 118.1 | +0.1% | 0.0% | +0.1% | 100% | 100% | 0.0pt |
| cmpt2-rapier | conduit | chitinous-dreadbore | 100 | 55.3 | 55.3 | 55.3 | +0.1% | 0.0% | +0.1% | 0% | 0% | 0.0pt |
| cmpt2-rapier | conduit | gorging-razortusk | 100 | 63.7 | 63.7 | 63.7 | +0.1% | 0.0% | +0.1% | 100% | 100% | 0.0pt |
| cmpt2-rapier | conduit | mire-gorged-behemoth | 100 | 65.2 | 65.2 | 65.2 | 0.0% | 0.0% | 0.0% | 72% | 72% | 0.0pt |
| cmpt2-rapier | conduit | stoneplate-juggernaut | 100 | 39.2 | 39.2 | 39.2 | 0.0% | 0.0% | 0.0% | 71% | 71% | 0.0pt |
| cmpt2-dagger | striker | apex-timberclaw | 100 | 144.5 | 147.2 | 147.2 | +1.9% | 0.0% | +1.9% | 100% | 100% | 0.0pt |
| cmpt2-dagger | striker | chitinous-dreadbore | 100 | 65.6 | 66.9 | 66.9 | +2.0% | 0.0% | +2.0% | 100% | 100% | 0.0pt |
| cmpt2-dagger | striker | gorging-razortusk | 100 | 88.6 | 90.2 | 90.2 | +1.9% | 0.0% | +1.9% | 100% | 100% | 0.0pt |
| cmpt2-dagger | striker | mire-gorged-behemoth | 100 | 30.6 | 31.1 | 31.1 | +1.7% | 0.0% | +1.7% | 100% | 100% | 0.0pt |
| cmpt2-dagger | striker | stoneplate-juggernaut | 100 | 92.1 | 93.4 | 93.4 | +1.5% | 0.0% | +1.5% | 100% | 100% | 0.0pt |
| cmpt2-dagger | squire | apex-timberclaw | 100 | 119.3 | 122.0 | 122.0 | +2.3% | 0.0% | +2.3% | 100% | 100% | 0.0pt |
| cmpt2-dagger | squire | chitinous-dreadbore | 100 | 66.7 | 67.4 | 67.4 | +1.1% | 0.0% | +1.1% | 100% | 100% | 0.0pt |
| cmpt2-dagger | squire | gorging-razortusk | 100 | 78.0 | 79.0 | 79.0 | +1.3% | 0.0% | +1.3% | 100% | 100% | 0.0pt |
| cmpt2-dagger | squire | mire-gorged-behemoth | 100 | 30.1 | 30.5 | 30.5 | +1.3% | 0.0% | +1.3% | 86% | 86% | 0.0pt |
| cmpt2-dagger | squire | stoneplate-juggernaut | 100 | 69.9 | 70.6 | 70.6 | +1.0% | 0.0% | +1.0% | 100% | 100% | 0.0pt |
| cmpt2-dagger | slinger | apex-timberclaw | 100 | 154.5 | 157.5 | 157.5 | +1.9% | 0.0% | +1.9% | 100% | 100% | 0.0pt |
| cmpt2-dagger | slinger | chitinous-dreadbore | 100 | 99.3 | 100.3 | 100.3 | +1.0% | 0.0% | +1.0% | 100% | 100% | 0.0pt |
| cmpt2-dagger | slinger | gorging-razortusk | 100 | 78.1 | 79.0 | 79.0 | +1.1% | 0.0% | +1.1% | 100% | 100% | 0.0pt |
| cmpt2-dagger | slinger | mire-gorged-behemoth | 100 | 91.6 | 93.0 | 93.0 | +1.6% | 0.0% | +1.6% | 100% | 100% | 0.0pt |
| cmpt2-dagger | slinger | stoneplate-juggernaut | 100 | 115.8 | 117.6 | 117.6 | +1.5% | 0.0% | +1.5% | 100% | 100% | 0.0pt |
| cmpt2-dagger | spirit | apex-timberclaw | 100 | 141.3 | 144.1 | 144.1 | +2.0% | 0.0% | +2.0% | 100% | 100% | 0.0pt |
| cmpt2-dagger | spirit | chitinous-dreadbore | 100 | 81.9 | 83.3 | 83.3 | +1.6% | 0.0% | +1.6% | 100% | 100% | 0.0pt |
| cmpt2-dagger | spirit | gorging-razortusk | 100 | 71.7 | 72.7 | 72.7 | +1.4% | 0.0% | +1.4% | 100% | 100% | 0.0pt |
| cmpt2-dagger | spirit | mire-gorged-behemoth | 100 | 79.3 | 79.6 | 79.6 | +0.4% | 0.0% | +0.4% | 100% | 100% | 0.0pt |
| cmpt2-dagger | spirit | stoneplate-juggernaut | 100 | 96.4 | 97.8 | 97.8 | +1.5% | 0.0% | +1.5% | 100% | 100% | 0.0pt |
| cmpt2-dagger | apprentice | apex-timberclaw | 100 | 141.6 | 144.5 | 144.5 | +2.1% | 0.0% | +2.1% | 100% | 100% | 0.0pt |
| cmpt2-dagger | apprentice | chitinous-dreadbore | 100 | 93.1 | 95.4 | 95.4 | +2.4% | 0.0% | +2.4% | 100% | 100% | 0.0pt |
| cmpt2-dagger | apprentice | gorging-razortusk | 100 | 83.1 | 82.4 | 82.4 | -0.8% | 0.0% | -0.8% | 100% | 100% | 0.0pt |
| cmpt2-dagger | apprentice | mire-gorged-behemoth | 100 | 84.6 | 85.1 | 85.1 | +0.5% | 0.0% | +0.5% | 100% | 100% | 0.0pt |
| cmpt2-dagger | apprentice | stoneplate-juggernaut | 100 | 109.5 | 111.3 | 111.3 | +1.7% | 0.0% | +1.7% | 100% | 100% | 0.0pt |
| cmpt2-dagger | conduit | apex-timberclaw | 100 | 128.8 | 130.8 | 130.8 | +1.5% | 0.0% | +1.5% | 100% | 100% | 0.0pt |
| cmpt2-dagger | conduit | chitinous-dreadbore | 100 | 61.8 | 63.2 | 63.2 | +2.3% | 0.0% | +2.3% | 100% | 100% | 0.0pt |
| cmpt2-dagger | conduit | gorging-razortusk | 100 | 56.8 | 57.2 | 57.2 | +0.6% | 0.0% | +0.6% | 100% | 100% | 0.0pt |
| cmpt2-dagger | conduit | mire-gorged-behemoth | 100 | 69.9 | 71.4 | 71.4 | +2.1% | 0.0% | +2.1% | 100% | 100% | 0.0pt |
| cmpt2-dagger | conduit | stoneplate-juggernaut | 100 | 73.5 | 74.9 | 74.9 | +1.9% | 0.0% | +1.9% | 100% | 100% | 0.0pt |

## (b) boss5Spec's tier-3 and tier-4 reference rows

`server/bench/balance/boss5Spec.ts`, block group B at tiers 3 and 4: 13 dungeon bosses
(7 at T3, 6 at T4) × six classes, one seed (99011), per-tier caps (600 s / 900 s), the
fixed spawn. The reference package is defensive stance, `expose-weakness`, Guards
`second-wind` then `brace`, the five behaviour rules, +5, the Mountain T3/T4 kit,
`core-tempered` (and `relic-colossus-heart` at T4). 78 fights per commit
(`stacking-boss5-before/-d593ceea/-after.jsonl`, plan `plan-boss5-t34.json`; every cell in
`stacking-boss5-cells.md`). 0 error rows. 222–225 s per commit at 3 shards.

**Divergence from the brief: these rows ran through `_t1BossLab.ts`, not `pnpm bench:balance`.**
`bench:balance` (`bench/balanceRun.ts`) never reads `boss5Spec.ts`. The spec's own runner,
`scripts/bossScreen.ts --trial=boss5`, refuses to start on both commits:
`assertBoss5Definitions` pins "the reference carries five behaviour rules" and the resolved
package now has seven (`withReferenceAbilityWiring` adds the use-ability runes since the
ability-wiring rework) — the reason `scripts/run-tests.mjs` archives `boss5Matrix.test.ts`.
The spec is byte-identical at both commits (the T3/T4 cell list hashes the same at
`7360e3b0`, `d593ceea` and the tip). `_abilityPassStacking.ts --boss5-plan` carries each
cell into a lab row verbatim (stance, Technique, ordered Guards, the five rules, +5, kit,
core, relic; the lab rebuilds the declared skill path exactly, asserted), and the lab
prepares the bot with `prepareSurveyBot`, as `bossScreen.ts` does. The lab has no 300 s
wall ceiling, so a long fight's outcome does not depend on machine load.

**What moved: only the T3 Slinger** (`jungle-venomthorn-rapier`, whose capstone wrote
`lineage.poison`; 7 of 78 fights). Pooled over its seven bosses: 122.3 → 123.0 dps (+0.6%),
wins 6/7 → 5/7 (the Rot-Spore Croc Behemoth turned from a kill into a death, −5.8% dps); the
Magma Salamander +12.8%, the rest within ±3%. **T4 did not move at all**: the T4 Slinger and
Conduit wear `jungle-deathfang-rapier`, the Apprentice `graveyard-plague-axe`; none of the 36
T4 fights changed. Plague Dose is not in this package (no lineage cards are bought), so it is
unmeasured here. Single seed: each cell is one fight.

### Per candidate (pooled over class × boss × seed)

| candidate | n | dps before | dps mid | dps after | Δ before→mid | Δ mid→after | Δdps | win before | win after | Δwin |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| boss5-t3 | 42 | 105.8 | 105.9 | 105.9 | +0.1% | 0.0% | +0.1% | 62% | 60% | -2.4pt |
| boss5-t4 | 36 | 286.5 | 286.5 | 286.5 | 0.0% | 0.0% | 0.0% | 89% | 89% | 0.0pt |

### Per candidate × class × boss

| candidate | class | boss | n | dps before | dps mid | dps after | Δ before→mid | Δ mid→after | Δdps | win before | win after | Δwin |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| boss5-t3 | slinger | apex-bramble-slasher | 1 | 151.1 | 150.3 | 150.3 | -0.5% | 0.0% | -0.5% | 100% | 100% | 0.0pt |
| boss5-t3 | slinger | cinder-shell-magma-salamander | 1 | 139.8 | 157.7 | 157.7 | +12.8% | 0.0% | +12.8% | 100% | 100% | 0.0pt |
| boss5-t3 | slinger | crag-gorged-horn-behemoth | 1 | 108.4 | 108.8 | 108.8 | +0.4% | 0.0% | +0.4% | 100% | 100% | 0.0pt |
| boss5-t3 | slinger | deep-core-burrow-gorger | 1 | 106.7 | 103.6 | 103.6 | -2.9% | 0.0% | -2.9% | 100% | 100% | 0.0pt |
| boss5-t3 | slinger | dune-carapace-monarch | 1 | 125.0 | 124.7 | 124.7 | -0.2% | 0.0% | -0.2% | 0% | 0% | 0.0pt |
| boss5-t3 | slinger | frost-plated-rime-mammoth | 1 | 139.6 | 135.6 | 135.6 | -2.9% | 0.0% | -2.9% | 100% | 100% | 0.0pt |
| boss5-t3 | slinger | rot-spore-croc-behemoth | 1 | 85.5 | 80.5 | 80.5 | -5.8% | 0.0% | -5.8% | 100% | 0% | -100.0pt |

7 of 78 rows moved; the other 71 are equal in every column.

## (c) The ability-node Affliction rows at T3 and T4: not measured

No bench exposes ability-node rows: nothing under `server/bench/` (`lineage/laneMeasure.ts`,
`lineageLaneMatrix.ts`, `poolRaise.ts`, …), `bot/src/` or `tools/` buys or reads an ability
node (`abilityNode` / `ABILITY_NODE` / `ability-node` appear only in `server/src` and
`shared/src`). Per the brief, W0 stops at (a) and (b).

## Rerun (W1-A, with Slam in place of Expose Weakness)

See README.md §5.
