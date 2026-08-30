# Step 6 — Gear Evolution & Reconstruction — Current State

Paired with `docs/archive/gear-evolution-plan.md`. Reflects what shipped this session: the **structural
machinery + one worked lineage**. Authoring the remaining lineages and tuning +4/+5 / evolution
costs is the user's later pass.

## Data model

`Recipe` (`shared/src/data/recipes/types.ts`) + `ItemDefinition` (`shared/src/items.ts`) gained:
- `lineageId?: string` — groups a lineage (base + all branches share it).
- `evolvesFrom?: string` — predecessor recipe id. **Present ⇒ this is an EVOLVED recipe.**
- `reconstructCost?` / `reconstructCatalystCost?` — the skip-the-chain cost (evolved recipes only).

`itemDatabase.ts` passes `lineageId`/`evolvesFrom` through the 1:1 recipe→item derive. Item id is
still recipe id; `itemUpgrades` is still per-id.

## Upgrade cap

- `MAX_UPGRADE` raised **3 → 5** (`systems/itemUpgrades.ts`). Only affects generic-fallback items;
  items with explicit `upgrades[]` are bound by array length, so reaching +5 needs length-5 arrays.
- The GM ceiling seam (`upgradeCeilingFromGlobalMastery(gm, itemTier)`, Step 4) gates the effective
  max and is now **tier-banded and binding** (2026-07-10): each item tier's +1…+5 unlocks spread
  across that tier's GM band, with +5 landing at full mastery of the tier's biomes (T1 @ GM 30,
  T2 @ 72, **T3 @ 114, T4 @ 156** — updated 2026-08-30, see below). See
  `globalMasteryRequiredForUpgrade` in `systems/itemUpgrades.ts`.
- **Retirement-aware since 2026-08-30** (T3 progression/economy pass): `biomeLevelCap` clamps the
  player's tier by `BIOME_FINAL_TIER_BY_GROUP` (derived from `NODE_BIOMES` the same way the start-tier
  map is), so a biome stops growing mastery headroom when its authored content ends. T1/T2 gates are
  bit-identical to before; T3 gates are 80/89/97/106/114 and T4's are 122/131/139/148/156.
- **T4 gear gained real lineage on 2026-08-30** (T4 progression/economy pass, see
  `docs/briefs/T4_PROGRESSION_ECONOMY_IMPLEMENTATION_2026-08-30.md`): 36 of the 39 ordinary T4 gear
  items now carry `evolvesFrom` (26 distinct T3/Cave/Swamp predecessors, 10 branch groups incl. 3
  cross-biome Cave/Swamp→Graveyard/Trench handoffs); 3 are genuinely new. Before this pass T4 was
  the one tier boundary with zero evolution instances despite commented mechanical continuity.

## Shared authority — `systems/evolution.ts` (new)

Pure, mirrors `checkUpgrade`. Used by server (apply) + client (button gating):
- `EVOLUTION_REQUIRED_PLUS = 3`; `EvolveMode = 'evolve' | 'reconstruct'`.
- `isEvolvedRecipe(recipe)` = `!!recipe.evolvesFrom`.
- `checkEvolve({ recipe, inventory, itemUpgrades, essences, catalysts, isTestRoom })` — predecessor in
  bag at ≥+3, evolve cost (`cost`/`catalystCost`) affordable.
- `checkReconstruct({ recipe, essences, catalysts, isTestRoom })` — `reconstructCost` present + affordable.

## Server — `economy/itemEvolution.ts` (new)

`evolveItem(world, entity, recipeId, mode)`:
- recipe exists + is evolved; unlocked (`unlockedRecipes`) unless test room (test room tops up essence
  + both catalyst axes).
- `evolve`: `checkEvolve` → splice one predecessor copy from the bag → spend `cost`/`catalystCost`.
- `reconstruct`: `checkReconstruct` → spend `reconstructCost`/`reconstructCatalystCost` (no predecessor).
- push evolved id into the bag at +0. Reuses `CraftResult`.

**Loophole closed:** `craftRecipe` now rejects evolved recipes (`recipe.evolvesFrom` set) so they can't
be plain-crafted for the cheaper `cost` without consuming the predecessor.

## Protocol / bridge

- `socketEvents.ts`: `"crafting:evolveItem": ({ recipeId, mode: EvolveMode }) => void`; reuses
  `crafting:result`.
- Client bridge: `hudBus.requestEvolveItem` → intent `evolveItem` → `sendEvolveItem` →
  `crafting:evolveItem` → server handler in `index.ts`.

## Client — ForgeTab

Evolved recipes render **Evolve** + **Reconstruct** buttons instead of Craft, each gated by
`checkEvolve`/`checkReconstruct` (button `title` shows the failure reason). Shows "Evolves from
{predecessor} +3 (consumed)" and the reconstruct cost. Reads `itemUpgradesAtom` for the +3 check.
Base recipes are unchanged.

## Worked lineage — `forest.recipes.ts` (the `rapier` lineage)

- **`flash-rapier`** (base): `lineageId: 'rapier'`; upgrades extended to length 5 (+4/+5 placeholders).
- **`gale-needle`** (retrofit of the existing T2 forest weapon): `evolvesFrom: 'flash-rapier'`,
  `lineageId: 'rapier'`, `reconstructCost`, length-5 upgrades. The primary evolution.
- **`thorn-needle`** (new): second `evolvesFrom: 'flash-rapier'` sibling — demonstrates **branching**
  (on-hit/venom variant).
- All evolution/reconstruct/+4/+5 numbers are PLACEHOLDERS.

⚠️ `gale-needle` was previously a plain-craftable T2 forest weapon; it is now evolution-only. Existing
saves that hold it keep the item; the forge now offers Evolve/Reconstruct for it instead of Craft.

## Verified

Typecheck clean (4 pkgs); shared rebuild clean; targetPriority + runeMaintenance pass. Sanity (built
package): lineage fields resolve; `checkEvolve` rejects no-predecessor / +2 and accepts +3-with-funds;
`checkReconstruct` accepts with funds; `gale-needle` max upgrade = 5.

## Deferred (not this session)

- +5 rewards: cheaper branch-switch, partial refund (roadmap "+5 role"). v1 switching = craft the sibling.
- Per-id (not per-instance) upgrade quirk: re-acquiring an id you already leveled inherits that level;
  "evolved item starts at +0" holds only on first acquisition.
- Lineages for the other 3 slots × biomes; +4/+5 and evolution-cost tuning (user balance pass).
