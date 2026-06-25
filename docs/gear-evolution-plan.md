# Step 6 — Gear Evolution & Reconstruction — Plan

**Scope (locked Q&A 2026-06-23):** build the **structural machinery + ONE worked lineage**
(`flash-rapier` → evolved branches, the brainstorm's own example). Authoring the remaining
lineages, +4/+5 numbers, and costs is the user's later balance/content pass.

**Decisions:**
- Lineage graph = **fields on `Recipe`** (`lineageId`, `evolvesFrom`), generalizes to abilities (Step 7).
- Reconstruction = **dual cost-path on one recipe** (`reconstructCost`/`reconstructCatalystCost`),
  no recipe-count doubling.
- Evolve **consumes the +3 predecessor**; evolved item starts at +0 and re-climbs. +3 = evolution gate.

## Data model (shared)

`Recipe` + `ItemDefinition` gain:
- `lineageId?: string` — groups a lineage (e.g. `"rapier"`).
- `evolvesFrom?: string` — predecessor recipe id. Present ⇒ this is an **evolved** recipe.
- `reconstructCost?: Partial<Record<EssenceType, number>>` — skip-the-chain essence cost.
- `reconstructCatalystCost?: Partial<Record<string, number>>` — skip-the-chain catalyst cost.

Semantics:
- **Base recipe** (no `evolvesFrom`): crafted via `craftRecipe` from `cost`/`catalystCost` (unchanged).
- **Evolved recipe** (`evolvesFrom` set): two paths, both require the recipe **unlocked** (biome level):
  - **EVOLVE** — own `evolvesFrom` in inventory at ≥ `EVOLUTION_REQUIRED_PLUS` (3); consume one copy;
    pay `cost`/`catalystCost` (the cheaper "true evolution" cost). Receive evolved item at +0.
  - **RECONSTRUCT** — pay `reconstructCost`/`reconstructCatalystCost` (higher); no predecessor.

`itemDatabase.ts` passes the new fields through (1:1 recipe→item derive).

## +5 cap

- `MAX_UPGRADE 3 → 5` (affects only generic-fallback items). Explicit-`upgrades[]` items still bound
  by array length, so the worked lineage authors **length-5** upgrade arrays (+4/+5 placeholder steps).
- GM upgrade-cap seam from Step 4 (`upgradeCeilingFromGlobalMastery`) already gates the effective max;
  it stays non-binding (≥5) here. Tightening +4/+5 behind GM thresholds = user tuning of that function.

## Shared authority — `systems/evolution.ts` (new, pure)

Mirrors `checkUpgrade`'s shared-authority pattern (server applies, client gates buttons):
- `EVOLUTION_REQUIRED_PLUS = 3`
- `isEvolvedRecipe(recipe)` → `!!recipe.evolvesFrom`
- `checkEvolve({ recipe, inventory, itemUpgrades, essences, catalysts, isTestRoom })` → `{ ok, reason }`
  — predecessor present + at +3; essence/catalyst affordable.
- `checkReconstruct({ recipe, essences, catalysts, isTestRoom })` → `{ ok, reason }`
  — `reconstructCost` present; affordable.

## Server — `economy/itemEvolution.ts` (new)

`evolveItem(world, entity, recipeId, mode: 'evolve' | 'reconstruct')`:
- recipe must exist + be evolved; unlocked (unless test room).
- `evolve`: `checkEvolve` → consume one inventory copy of `evolvesFrom`, pay `cost`/`catalystCost`.
- `reconstruct`: `checkReconstruct` → pay `reconstructCost`/`reconstructCatalystCost`.
- push evolved id into inventory; `markSliceDirty`. Reuse `CraftResult`.

## Protocol + intent

- `socketEvents.ts`: add `"crafting:evolveItem": (payload: { recipeId: string; mode: EvolveMode }) => void`
  to ClientToServer. Reuse `crafting:result`.
- `intents.ts`: `evolveItem: { recipeId: string; mode: 'evolve' | 'reconstruct' }`.
- `index.ts`: handler → `evolveItem(...)` → emit `crafting:result`.

## Client — ForgeTab

- Read `itemUpgradesAtom` (for predecessor +3 check).
- For `recipe.evolvesFrom` recipes: render **Evolve** + **Reconstruct** actions instead of Craft, each
  gated by `checkEvolve`/`checkReconstruct`, with requirement labels ("Needs <predecessor> +3" /
  reconstruct cost). Base recipes unchanged.

## Data — worked lineage (`forest.recipes.ts`)

- `flash-rapier`: add `lineageId: 'rapier'`; extend its `upgrades[]` to length 5 (+4/+5 placeholders).
- **Gale Needle** (`evolvesFrom: 'flash-rapier'`, `lineageId: 'rapier'`) — evolved T2 weapon, length-5
  upgrades, `reconstructCost` set. The primary evolution.
- **Thorn Needle** (second `evolvesFrom: 'flash-rapier'` sibling) — demonstrates **branching**.
- All numbers placeholder; unlocked at placeholder biome levels. User tunes/extends to other lineages.

## Verify

Typecheck (4 pkgs); rebuild shared; run targetPriority + runeMaintenance (known-good). Sanity: craft
flash-rapier → +3 → evolve consumes it → Gale Needle at +0; reconstruct path works without predecessor.
Update `gear-evolution-current-state.md` + status scoreboard/log.

## Deferred (flagged, not this session)
- Branch-switch discount + partial refund at +5 (roadmap "+5 rewards"); v1 switching = craft the sibling.
- Per-id (not per-instance) upgrade quirk: re-acquiring an id you already leveled inherits that level.
- Authoring lineages for all 4 slots × biomes; +4/+5 numeric tuning.
