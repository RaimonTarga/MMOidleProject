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
- The GM ceiling seam (`upgradeCeilingFromGlobalMastery`, Step 4) still gates the effective max and
  stays non-binding (≥5). Tightening +4/+5 behind GM thresholds = user tuning of that function.

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
