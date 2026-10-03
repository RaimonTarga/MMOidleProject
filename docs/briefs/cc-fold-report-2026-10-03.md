# W1-D — non-weapon ladder fold (2026-10-03)

Source: develop at `a052e07efb4c477e74c20ab060280fde1c5f9c26`. Original values extracted with `git show develop:<file>` before any edits.

Every non-empty armor, recovery and mobility ladder is folded into its base fields. Stats and mechanic effects are additive, preserving all five steps. Decimal sums are written without binary floating-point noise. No balance values were chosen.

Craft/reconstruction costs, evolvesFrom, lineage fields and weapon entries are unchanged. Deleted upgrade costs disappear only with their retired steps. Clearing has three empty arrays, not ladders, and is unchanged. Runtime retirement and migrations belong to W1-C.

The fixture preserves original base fields and five individual increments; recipeCurve.test.ts independently sums them, checks every base field, and rejects a non-empty ladder in any slot.

## Recovery exceptions

None. All power fields were recoverable mechanically; every non-empty ladder had exactly five steps. Mechanic-effect increments remain in mechanicEffects, not stats, matching the weapon fold.

## Validation

- `pnpm test -- weaponCurve recipe t2Progression`: 4/4 files passed (weaponCurve, recipeCurve, recipeGates, t2ProgressionEconomy).
- `pnpm typecheck`: passed, including bench and test TypeScript projects.
- Mutation checks: adding 1 HP to a folded base and reintroducing an upgrade step each made recipeCurve fail for the expected reason; both temporary mutations were restored.
- Independent integer-scaled decimal audit: all 86 folds equal the original five-step sums exactly; fixture bases and increments match the source revision above. All 33 weapon entries and every other recipe field are unchanged.
- 86 items across 11 biome files; one recipe-data commit per biome, followed by the regression fixture/test and report commit. No push or dependency install.

## Before / after

Delivery is on `feat/cc-fold` in `../mmo-cc-fold-delivery`. During the initial work,
another session switched the shared checkout to `feat/cc-icons`; the eleven recipe
commits landed there first (`29c5d3e5` through `0676789e`). They were cherry-picked
onto the requested branch (`7c900db7` through `550725db`) without importing the other
branch's changes or rewriting it. Both requested checks were rerun in the delivery
checkout using junctions to the existing dependencies; no install was performed.

Each row is one changed field. Before is the old +0 base; after is the old +5 total. Unlisted fields are unchanged.

### cave.recipes.ts

| Item | Field | Before | +1 through +5 increments | After |
| --- | --- | ---: | --- | ---: |
| `cave-vest-t1` | `stats.maxHp` | 30 | 3 + 3 + 3 + 3 + 3 | 45 |
| `cave-vest-t1` | `stats.damageReduction` | 0.1 | 0.008 + 0.008 + 0.008 + 0.008 + 0.008 | 0.14 |
| `cave-charm-t1` | `stats.recovery` | 4.4 | 0 + 0 + 1.6 + 0 + 0 | 6 |
| `cave-charm-t1` | `mechanicEffects.defense.absorb-pct` | 0.08 | 0.01 + 0.01 + 0 + 0.01 + 0.01 | 0.12 |
| `cave-boots-t1` | `stats.speed` | 20 | 1 + 1 + 1 + 1 + 1 | 25 |
| `cave-boots-t1` | `mechanicEffects.mobility.stealth-pct` | 0.25 | 0.02 + 0.02 + 0.02 + 0.02 + 0.02 | 0.35 |
| `cave-vest-t2` | `stats.maxHp` | 55 | 6 + 5 + 6 + 5 + 6 | 83 |
| `cave-vest-t2` | `stats.damageReduction` | 0.18 | 0.008 + 0.008 + 0.008 + 0.008 + 0.008 | 0.22 |
| `cave-charm-t2` | `stats.recovery` | 11.1 | 0 + 2.3 + 0 + 2.3 + 0 | 15.7 |
| `cave-charm-t2` | `mechanicEffects.defense.absorb-pct` | 0.14 | 0.01 + 0.01 + 0.01 + 0.01 + 0.01 | 0.19 |
| `cave-boots-t2` | `stats.speed` | 36 | 2 + 2 + 2 + 2 + 2 | 46 |
| `cave-boots-t2` | `mechanicEffects.mobility.stealth-pct` | 0.38 | 0.02 + 0.02 + 0.02 + 0.02 + 0.02 | 0.48 |
| `cave-vest-t3` | `stats.maxHp` | 150 | 15 + 15 + 15 + 15 + 15 | 225 |
| `cave-vest-t3` | `stats.damageReduction` | 0.26 | 0.008 + 0.008 + 0.008 + 0.008 + 0.008 | 0.3 |
| `cave-charm-t3` | `stats.recovery` | 37 | 0 + 4.5 + 0 + 4.5 + 4.5 | 50.5 |
| `cave-charm-t3` | `mechanicEffects.defense.absorb-pct` | 0.2 | 0.01 + 0.01 + 0.01 + 0.01 + 0 | 0.24 |
| `cave-boots-t3` | `stats.speed` | 65 | 4 + 3 + 4 + 3 + 4 | 83 |
| `cave-boots-t3` | `mechanicEffects.mobility.stealth-pct` | 0.5 | 0.02 + 0.02 + 0.02 + 0.02 + 0.02 | 0.6 |

### desert.recipes.ts

| Item | Field | Before | +1 through +5 increments | After |
| --- | --- | ---: | --- | ---: |
| `desert-vest-t2` | `stats.maxHp` | 55 | 6 + 5 + 6 + 5 + 6 | 83 |
| `desert-vest-t2` | `stats.plating` | 3 | 1 + 1 + 1 + 1 + 1 | 8 |
| `desert-vest-t2` | `mechanicEffects.defense.engagement-dr-pct` | 0.3 | 0.01 + 0.01 + 0.01 + 0.01 + 0.01 | 0.35 |
| `desert-charm-t2` | `stats.recovery` | 13.4 | 1.2 + 1.2 + 1.2 + 1.2 + 1.2 | 19.4 |
| `desert-charm-t2` | `mechanicEffects.cleanse.cooldown-reduction-pct` | 0.15 | 0.01 + 0.01 + 0.01 + 0.01 + 0.01 | 0.2 |
| `desert-boots-t2` | `stats.speed` | 87 | 3 + 5 + 6 + 6 + 6 | 113 |
| `desert-vest-t3` | `stats.maxHp` | 150 | 15 + 15 + 15 + 15 + 15 | 225 |
| `desert-vest-t3` | `stats.plating` | 10 | 1 + 1 + 1 + 1 + 1 | 15 |
| `desert-vest-t3` | `mechanicEffects.defense.engagement-dr-pct` | 0.3 | 0.01 + 0.01 + 0.01 + 0.01 + 0.01 | 0.35 |
| `desert-charm-t3` | `stats.recovery` | 50.4 | 4.5 + 4.5 + 4.5 + 2.2 + 2.2 | 68.3 |
| `desert-charm-t3` | `mechanicEffects.cleanse.cooldown-reduction-pct` | 0.2 | 0.01 + 0.01 + 0.01 + 0.01 + 0.01 | 0.25 |
| `desert-boots-t3` | `stats.speed` | 125 | 4 + 6 + 7 + 7 + 8 | 157 |
| `desert-vest-t4` | `stats.maxHp` | 288 | 29 + 29 + 29 + 29 + 29 | 433 |
| `desert-vest-t4` | `stats.plating` | 19 | 2 + 2 + 2 + 2 + 2 | 29 |
| `desert-vest-t4` | `mechanicEffects.defense.engagement-dr-pct` | 0.3 | 0.01 + 0.01 + 0.01 + 0.01 + 0.01 | 0.35 |
| `desert-charm-t4` | `stats.recovery` | 115.4 | 7.6 + 11.3 + 11.3 + 11.3 + 11.3 | 168.2 |
| `desert-charm-t4` | `mechanicEffects.cleanse.cooldown-reduction-pct` | 0.25 | 0.015 + 0.015 + 0.015 + 0.015 + 0.015 | 0.325 |
| `desert-boots-t4` | `stats.speed` | 173 | 5 + 7 + 8 + 8 + 8 | 209 |

### forest.recipes.ts

| Item | Field | Before | +1 through +5 increments | After |
| --- | --- | ---: | --- | ---: |
| `forest-vest-t1` | `stats.maxHp` | 29 | 3 + 3 + 3 + 3 + 3 | 44 |
| `forest-vest-t1` | `stats.evasion` | 0.28 | 0.016 + 0.016 + 0.016 + 0.016 + 0.016 | 0.36 |
| `forest-charm-t1` | `stats.recovery` | 6 | 0 + 1.6 + 0 + 1.6 + 0 | 9.2 |
| `forest-charm-t1` | `mechanicEffects.defense.recovery-skill-potency` | 0.1 | 0.01 + 0.01 + 0.01 + 0.01 + 0.01 | 0.15 |
| `forest-boots-t1` | `stats.speed` | 22 | 2 + 2 + 2 + 2 + 2 | 32 |
| `forest-boots-t1` | `mechanicEffects.mobility.ooc-speed-pct` | 0.2 | 0.03 + 0.03 + 0.03 + 0.03 + 0.03 | 0.35 |
| `forest-vest-t2` | `stats.maxHp` | 52 | 5 + 5 + 6 + 5 + 5 | 78 |
| `forest-vest-t2` | `stats.evasion` | 0.34 | 0.016 + 0.016 + 0.016 + 0.016 + 0.016 | 0.42 |
| `forest-charm-t2` | `stats.recovery` | 13.4 | 0 + 2.3 + 0 + 2.3 + 2.3 | 20.3 |
| `forest-charm-t2` | `mechanicEffects.defense.recovery-skill-potency` | 0.18 | 0.01 + 0.01 + 0.01 + 0.01 + 0.01 | 0.23 |
| `forest-boots-t2` | `stats.speed` | 40 | 2 + 2 + 2 + 3 + 2 | 51 |
| `forest-boots-t2` | `mechanicEffects.mobility.ooc-speed-pct` | 0.4 | 0.03 + 0.03 + 0.03 + 0.03 + 0.03 | 0.55 |

### graveyard.recipes.ts

| Item | Field | Before | +1 through +5 increments | After |
| --- | --- | ---: | --- | ---: |
| `graveyard-vest-t4` | `stats.maxHp` | 302 | 30 + 30 + 30 + 30 + 30 | 452 |
| `graveyard-vest-t4` | `mechanicEffects.defense.dot-resistance` | 0.45 | 0.02 + 0.02 + 0.02 + 0.02 + 0.02 | 0.55 |
| `graveyard-vest-t4-debtward` | `stats.maxHp` | 302 | 30 + 30 + 30 + 30 + 30 | 452 |
| `graveyard-vest-t4-debtward` | `mechanicEffects.defense.dot-resistance` | 0.25 | 0.02 + 0.02 + 0.02 + 0.02 + 0.02 | 0.35 |
| `graveyard-charm-t4` | `stats.recovery` | 115.4 | 7.6 + 11.3 + 11.3 + 11.3 + 11.3 | 168.2 |
| `graveyard-charm-t4` | `mechanicEffects.defense.recovery-pulse-pct` | 0.11 | 0.03 + 0.03 + 0.03 + 0.03 + 0.03 | 0.26 |
| `graveyard-charm-t4-gravetide` | `stats.recovery` | 115.4 | 7.6 + 11.3 + 11.3 + 11.3 + 11.3 | 168.2 |
| `graveyard-charm-t4-gravetide` | `mechanicEffects.defense.recovery-pulse-pct` | 0.04 | 0.01 + 0.02 + 0.01 + 0.02 + 0.02 | 0.12 |
| `graveyard-charm-t4-gravetide` | `mechanicEffects.defense.recovery-active-pct` | 0.04 | 0.01 + 0.02 + 0.01 + 0.02 + 0.02 | 0.12 |
| `graveyard-boots-t4` | `stats.speed` | 75 | 3 + 4 + 6 + 5 + 5 | 98 |

### jungle.recipes.ts

| Item | Field | Before | +1 through +5 increments | After |
| --- | --- | ---: | --- | ---: |
| `jungle-vest-t2` | `stats.maxHp` | 52 | 12 + 12 + 12 + 12 + 12 | 112 |
| `jungle-vest-t2` | `stats.evasion` | 0.28 | 0.016 + 0.016 + 0.016 + 0.016 + 0.016 | 0.36 |
| `jungle-vest-t2` | `mechanicEffects.defense.dot-resistance` | 0.15 | 0.02 + 0.02 + 0.02 + 0.02 + 0.02 | 0.25 |
| `jungle-charm-t2` | `stats.recovery` | 13.4 | 1.2 + 1.2 + 1.2 + 1.2 + 1.2 | 19.4 |
| `jungle-charm-t2` | `mechanicEffects.defense.recovery-ramp-max-pct` | 0.1 | 0.02 + 0.02 + 0.02 + 0.02 + 0.02 | 0.2 |
| `jungle-boots-t2` | `stats.speed` | 47 | 2 + 3 + 3 + 3 + 3 | 61 |
| `jungle-vest-t3` | `stats.maxHp` | 143 | 15 + 14 + 15 + 14 + 15 | 216 |
| `jungle-vest-t3` | `stats.evasion` | 0.32 | 0.016 + 0.016 + 0.016 + 0.016 + 0.016 | 0.4 |
| `jungle-vest-t3` | `mechanicEffects.defense.dot-resistance` | 0.2 | 0.02 + 0.02 + 0.02 + 0.02 + 0.02 | 0.3 |
| `jungle-charm-t3` | `stats.recovery` | 50.4 | 4.5 + 4.5 + 4.5 + 2.2 + 2.2 | 68.3 |
| `jungle-charm-t3` | `mechanicEffects.defense.recovery-ramp-max-pct` | 0.14 | 0.02 + 0.02 + 0.02 + 0.02 + 0.02 | 0.24 |
| `jungle-boots-t3` | `stats.speed` | 68 | 3 + 4 + 5 + 4 + 4 | 88 |
| `jungle-vest-t4` | `stats.maxHp` | 274 | 27 + 27 + 27 + 27 + 29 | 411 |
| `jungle-vest-t4` | `stats.evasion` | 0.36 | 0.016 + 0.016 + 0.016 + 0.016 + 0.016 | 0.44 |
| `jungle-vest-t4` | `mechanicEffects.defense.dot-resistance` | 0.25 | 0.02 + 0.02 + 0.02 + 0.02 + 0.02 | 0.35 |
| `jungle-charm-t4` | `stats.recovery` | 115.4 | 7.6 + 11.3 + 11.3 + 11.3 + 11.3 | 168.2 |
| `jungle-charm-t4` | `mechanicEffects.defense.recovery-ramp-max-pct` | 0.14 | 0.02 + 0.02 + 0.02 + 0.02 + 0.02 | 0.24 |
| `jungle-charm-t4-overgrowth` | `stats.recovery` | 115.4 | 7.6 + 11.3 + 11.3 + 11.3 + 11.3 | 168.2 |
| `jungle-charm-t4-overgrowth` | `mechanicEffects.defense.recovery-ramp-max-pct` | 0.12 | 0.02 + 0.02 + 0.02 + 0.02 + 0.02 | 0.22 |
| `jungle-boots-t4` | `stats.speed` | 97 | 4 + 4 + 5 + 5 + 5 | 120 |

### mountain.recipes.ts

| Item | Field | Before | +1 through +5 increments | After |
| --- | --- | ---: | --- | ---: |
| `mountain-vest-t1` | `stats.maxHp` | 36 | 4 + 3 + 4 + 3 + 4 | 54 |
| `mountain-vest-t1` | `stats.plating` | 1 | 0 + 0 + 1 + 0 + 0 | 2 |
| `mountain-vest-t1` | `mechanicEffects.guard.potency-pct` | 0.15 | 0.02 + 0.02 + 0.02 + 0.02 + 0.02 | 0.25 |
| `mountain-charm-t1` | `stats.recovery` | 2.9 | 0 + 0 + 1.6 + 0 + 0 | 4.5 |
| `mountain-charm-t1` | `mechanicEffects.defense.barrier-pct` | 0.12 | 0.01 + 0.01 + 0.01 + 0.015 + 0.015 | 0.18 |
| `mountain-boots-t1` | `stats.speed` | 16 | 1 + 1 + 1 + 1 + 1 | 21 |
| `mountain-boots-t1` | `mechanicEffects.mobility.approach-speed-pct` | 0.35 | 0.05 + 0.05 + 0.05 + 0.05 + 0.05 | 0.6 |
| `mountain-vest-t2` | `stats.maxHp` | 66 | 7 + 6 + 7 + 6 + 7 | 99 |
| `mountain-vest-t2` | `stats.plating` | 1 | 0 + 0 + 1 + 0 + 0 | 2 |
| `mountain-vest-t2` | `mechanicEffects.guard.potency-pct` | 0.2 | 0.02 + 0.02 + 0.02 + 0.02 + 0.02 | 0.3 |
| `mountain-charm-t2` | `stats.recovery` | 6.4 | 0 + 2.3 + 0 + 0 + 0 | 8.7 |
| `mountain-charm-t2` | `mechanicEffects.defense.barrier-pct` | 0.2 | 0.01 + 0.01 + 0.01 + 0.015 + 0.015 | 0.26 |
| `mountain-boots-t2` | `stats.speed` | 29 | 2 + 1 + 2 + 1 + 2 | 37 |
| `mountain-boots-t2` | `mechanicEffects.mobility.approach-speed-pct` | 0.65 | 0.05 + 0.05 + 0.05 + 0.05 + 0.05 | 0.9 |
| `mountain-vest-t3` | `stats.maxHp` | 180 | 18 + 18 + 18 + 18 + 18 | 270 |
| `mountain-vest-t3` | `stats.plating` | 2 | 0 + 0 + 1 + 0 + 0 | 3 |
| `mountain-vest-t3` | `mechanicEffects.guard.potency-pct` | 0.25 | 0.02 + 0.02 + 0.02 + 0.02 + 0.02 | 0.35 |
| `mountain-charm-t3` | `stats.recovery` | 19.2 | 0 + 4.5 + 0 + 4.5 + 0 | 28.2 |
| `mountain-charm-t3` | `mechanicEffects.defense.barrier-pct` | 0.28 | 0.01 + 0.01 + 0.015 + 0.01 + 0.015 | 0.34 |
| `mountain-boots-t3` | `stats.speed` | 52 | 3 + 3 + 3 + 2 + 3 | 66 |
| `mountain-boots-t3` | `mechanicEffects.mobility.approach-speed-pct` | 0.95 | 0.05 + 0.05 + 0.05 + 0.05 + 0.05 | 1.2 |
| `mountain-vest-t4` | `stats.maxHp` | 346 | 35 + 34 + 35 + 34 + 35 | 519 |
| `mountain-vest-t4` | `stats.plating` | 3 | 0 + 1 + 0 + 1 + 0 | 5 |
| `mountain-vest-t4` | `mechanicEffects.guard.potency-pct` | 0.3 | 0.02 + 0.02 + 0.02 + 0.02 + 0.02 | 0.4 |
| `mountain-vest-t4-stormwall` | `stats.maxHp` | 346 | 35 + 34 + 35 + 34 + 35 | 519 |
| `mountain-vest-t4-stormwall` | `stats.plating` | 3 | 0 + 1 + 0 + 1 + 0 | 5 |
| `mountain-vest-t4-stormwall` | `mechanicEffects.guard.potency-pct` | 0.2 | 0.02 + 0.02 + 0.02 + 0.02 + 0.02 | 0.3 |
| `mountain-charm-t4` | `stats.recovery` | 55 | 3.8 + 3.8 + 7.6 + 3.8 + 3.8 | 77.8 |
| `mountain-charm-t4` | `mechanicEffects.defense.barrier-pct` | 0.36 | 0.01 + 0.01 + 0.01 + 0.015 + 0.015 | 0.42 |
| `mountain-charm-t4-shieldmend` | `stats.recovery` | 55 | 3.8 + 3.8 + 7.6 + 3.8 + 3.8 | 77.8 |
| `mountain-charm-t4-shieldmend` | `mechanicEffects.defense.barrier-pct` | 0.32 | 0.01 + 0.01 + 0.01 + 0.01 + 0.01 | 0.37 |
| `mountain-boots-t4` | `stats.speed` | 93 | 5 + 5 + 5 + 6 + 5 | 119 |
| `mountain-boots-t4` | `mechanicEffects.mobility.approach-speed-pct` | 1.25 | 0.05 + 0.05 + 0.05 + 0.05 + 0.05 | 1.5 |

### plains.recipes.ts

| Item | Field | Before | +1 through +5 increments | After |
| --- | --- | ---: | --- | ---: |
| `plains-vest-t1` | `stats.maxHp` | 27 | 3 + 2 + 3 + 3 + 3 | 41 |
| `plains-vest-t1` | `stats.plating` | 2 | 0 + 0 + 1 + 0 + 0 | 3 |
| `plains-charm-t1` | `stats.recovery` | 2.9 | 0 + 0.8 + 0 + 0.8 + 0 | 4.5 |
| `plains-charm-t1` | `mechanicEffects.defense.recovery-on-kill-pct` | 0.2 | 0.02 + 0.02 + 0.02 + 0.02 + 0.02 | 0.3 |
| `plains-boots-t1` | `stats.speed` | 18 | 1 + 1 + 1 + 1 + 1 | 23 |
| `plains-boots-t1` | `mechanicEffects.mobility.kill-speed-pct` | 0.25 | 0.03 + 0.03 + 0.03 + 0.03 + 0.03 | 0.4 |
| `plains-vest-t2` | `stats.maxHp` | 50 | 5 + 5 + 5 + 5 + 5 | 75 |
| `plains-vest-t2` | `stats.plating` | 5 | 1 + 0 + 1 + 0 + 1 | 8 |
| `plains-charm-t2` | `stats.recovery` | 6.4 | 0 + 1.2 + 0 + 1.2 + 0 | 8.8 |
| `plains-charm-t2` | `mechanicEffects.defense.recovery-on-kill-pct` | 0.32 | 0.02 + 0.02 + 0.02 + 0.02 + 0.02 | 0.42 |
| `plains-boots-t2` | `stats.speed` | 32 | 2 + 2 + 2 + 1 + 2 | 41 |
| `plains-boots-t2` | `mechanicEffects.mobility.kill-speed-pct` | 0.45 | 0.03 + 0.03 + 0.03 + 0.03 + 0.03 | 0.6 |

### swamp.recipes.ts

| Item | Field | Before | +1 through +5 increments | After |
| --- | --- | ---: | --- | ---: |
| `swamp-vest-t1` | `stats.maxHp` | 32 | 3 + 3 + 4 + 3 + 3 | 48 |
| `swamp-vest-t1` | `mechanicEffects.defense.dot-resistance` | 0.25 | 0.02 + 0.02 + 0.02 + 0.02 + 0.02 | 0.35 |
| `swamp-charm-t1` | `stats.recovery` | 4.4 | 0 + 0 + 1.6 + 0 + 0 | 6 |
| `swamp-charm-t1` | `mechanicEffects.defense.recovery-pulse-pct` | 0.2 | 0.02 + 0.02 + 0.02 + 0.02 + 0.02 | 0.3 |
| `swamp-boots-t1` | `stats.speed` | 18 | 1 + 1 + 1 + 1 + 1 | 23 |
| `swamp-boots-t1` | `mechanicEffects.mobility.slow-resistance` | 0.25 | 0.03 + 0.03 + 0.03 + 0.03 + 0.03 | 0.4 |
| `swamp-vest-t2` | `stats.maxHp` | 58 | 6 + 6 + 5 + 6 + 6 | 87 |
| `swamp-vest-t2` | `mechanicEffects.defense.dot-resistance` | 0.3 | 0.02 + 0.02 + 0.02 + 0.02 + 0.02 | 0.4 |
| `swamp-charm-t2` | `stats.recovery` | 11.1 | 0 + 2.3 + 0 + 2.3 + 0 | 15.7 |
| `swamp-charm-t2` | `mechanicEffects.defense.recovery-pulse-pct` | 0.32 | 0.02 + 0.02 + 0.02 + 0.02 + 0.02 | 0.42 |
| `swamp-boots-t2` | `stats.speed` | 32 | 2 + 2 + 1 + 2 + 2 | 41 |
| `swamp-boots-t2` | `mechanicEffects.mobility.slow-resistance` | 0.45 | 0.03 + 0.03 + 0.02 + 0.03 + 0.02 | 0.58 |
| `swamp-vest-t3` | `stats.maxHp` | 158 | 17 + 15 + 17 + 15 + 17 | 239 |
| `swamp-vest-t3` | `mechanicEffects.defense.dot-resistance` | 0.35 | 0.02 + 0.02 + 0.02 + 0.02 + 0.02 | 0.45 |
| `swamp-charm-t3` | `stats.recovery` | 37 | 0 + 4.5 + 0 + 4.5 + 4.5 | 50.5 |
| `swamp-charm-t3` | `mechanicEffects.defense.recovery-pulse-pct` | 0.44 | 0.02 + 0.02 + 0.02 + 0.02 + 0.02 | 0.54 |
| `swamp-boots-t3` | `stats.speed` | 58 | 3 + 3 + 3 + 4 + 3 | 74 |
| `swamp-boots-t3` | `mechanicEffects.mobility.slow-resistance` | 0.62 | 0.02 + 0.02 + 0.02 + 0.02 + 0.02 | 0.72 |

### trench.recipes.ts

| Item | Field | Before | +1 through +5 increments | After |
| --- | --- | ---: | --- | ---: |
| `trench-vest-t4` | `stats.maxHp` | 330 | 29 + 29 + 29 + 29 + 29 | 475 |
| `trench-vest-t4` | `stats.damageReduction` | 0.26 | 0.008 + 0.008 + 0.008 + 0.008 + 0.008 | 0.3 |
| `trench-vest-t4` | `mechanicEffects.defense.debuff-resistance` | 0.3 | 0.02 + 0.02 + 0.02 + 0.02 + 0.02 | 0.4 |
| `trench-charm-t4` | `stats.recovery` | 115.4 | 7.6 + 11.3 + 11.3 + 11.3 + 11.3 | 168.2 |
| `trench-charm-t4` | `mechanicEffects.defense.recovery-skill-potency` | 0.3 | 0.02 + 0.02 + 0.02 + 0.02 + 0.02 | 0.4 |
| `trench-charm-t4` | `mechanicEffects.recovery.cooldown-reduction-pct` | 0.15 | 0.02 + 0.02 + 0.02 + 0.02 + 0.02 | 0.25 |
| `trench-boots-t4-stalkers` | `stats.speed` | 92 | 6 + 5 + 5 + 5 + 5 | 118 |
| `trench-boots-t4-treaders` | `stats.speed` | 57 | 4 + 3 + 3 + 3 + 3 | 73 |

### tundra.recipes.ts

| Item | Field | Before | +1 through +5 increments | After |
| --- | --- | ---: | --- | ---: |
| `tundra-vest-t3` | `stats.maxHp` | 180 | 18 + 18 + 18 + 18 + 18 | 270 |
| `tundra-vest-t3` | `stats.plating` | 2 | 0 + 0 + 1 + 0 + 0 | 3 |
| `tundra-charm-t3` | `stats.recovery` | 50.4 | 4.5 + 4.5 + 4.5 + 2.2 + 2.2 | 68.3 |
| `tundra-charm-t3` | `mechanicEffects.defense.barrier-pct` | 0.18 | 0.02 + 0.02 + 0.02 + 0.02 + 0.02 | 0.28 |
| `tundra-boots-t3` | `stats.speed` | 68 | 2 + 3 + 5 + 5 + 5 | 88 |
| `tundra-vest-t4` | `stats.maxHp` | 346 | 35 + 34 + 35 + 34 + 35 | 519 |
| `tundra-vest-t4` | `stats.plating` | 3 | 0 + 1 + 0 + 1 + 0 | 5 |
| `tundra-charm-t4` | `stats.recovery` | 115.4 | 7.6 + 11.3 + 11.3 + 11.3 + 11.3 | 168.2 |
| `tundra-charm-t4` | `mechanicEffects.defense.barrier-pct` | 0.22 | 0.03 + 0.03 + 0.03 + 0.03 + 0.03 | 0.37 |
| `tundra-charm-t4-deepfreeze` | `stats.recovery` | 115.4 | 7.6 + 11.3 + 11.3 + 11.3 + 11.3 | 168.2 |
| `tundra-charm-t4-deepfreeze` | `mechanicEffects.defense.absorb-ramp-max-pct` | 0.3 | 0.03 + 0.03 + 0.03 + 0.03 + 0.03 | 0.45 |
| `tundra-boots-t4` | `stats.speed` | 97 | 2 + 4 + 5 + 5 + 5 | 118 |

### volcanic.recipes.ts

| Item | Field | Before | +1 through +5 increments | After |
| --- | --- | ---: | --- | ---: |
| `volcanic-vest-t3` | `stats.maxHp` | 150 | 15 + 15 + 15 + 15 + 15 | 225 |
| `volcanic-vest-t3` | `stats.plating` | 5 | 1 + 1 + 0 + 1 + 1 | 9 |
| `volcanic-charm-t3` | `stats.recovery` | 50.4 | 4.5 + 4.5 + 4.5 + 2.2 + 2.2 | 68.3 |
| `volcanic-charm-t3` | `mechanicEffects.defense.recovery-active-pct` | 0.06 | 0.02 + 0.02 + 0.02 + 0.02 + 0.02 | 0.16 |
| `volcanic-charm-t3` | `mechanicEffects.defense.recovery-on-kill-pct` | 0.04 | 0.02 + 0.02 + 0.02 + 0.02 + 0.02 | 0.14 |
| `volcanic-boots-t3` | `stats.speed` | 73 | 3 + 4 + 5 + 5 + 5 | 95 |
| `volcanic-vest-t4` | `stats.maxHp` | 288 | 29 + 29 + 29 + 29 + 29 | 433 |
| `volcanic-vest-t4` | `stats.plating` | 8 | 1 + 1 + 2 + 1 + 1 | 14 |
| `volcanic-vest-t4-lavatempered` | `stats.maxHp` | 288 | 29 + 29 + 29 + 29 + 29 | 433 |
| `volcanic-vest-t4-lavatempered` | `stats.plating` | 8 | 1 + 1 + 2 + 1 + 1 | 14 |
| `volcanic-charm-t4` | `stats.recovery` | 115.4 | 7.6 + 11.3 + 11.3 + 11.3 + 11.3 | 168.2 |
| `volcanic-charm-t4` | `mechanicEffects.defense.recovery-active-pct` | 0.1 | 0.02 + 0.02 + 0.02 + 0.02 + 0.02 | 0.2 |
| `volcanic-charm-t4` | `mechanicEffects.defense.recovery-on-kill-pct` | 0.08 | 0.02 + 0.02 + 0.02 + 0.02 + 0.02 | 0.18 |
| `volcanic-boots-t4` | `stats.speed` | 105 | 3 + 4 + 6 + 5 + 5 | 128 |
