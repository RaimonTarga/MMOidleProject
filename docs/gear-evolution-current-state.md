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
- `checkEvolve({ recipe, inventory, equipment, itemUpgrades, essences, catalysts, isTestRoom })` — predecessor in
  bag or equipped in its slot at ≥+3, evolve cost (`cost`/`catalystCost`) affordable.
- `checkReconstruct({ recipe, essences, catalysts, isTestRoom })` — `reconstructCost` present + affordable.

## Server — `economy/itemEvolution.ts` (new)

`evolveItem(world, entity, recipeId, mode)`:
- recipe exists + is evolved; unlocked (`unlockedRecipes`) unless test room (test room tops up essence
  + both catalyst axes).
- `evolve`: `checkEvolve` → consume the equipped predecessor when present, otherwise one bag copy → spend `cost`/`catalystCost`.
- `reconstruct`: `checkReconstruct` → spend `reconstructCost`/`reconstructCatalystCost` (no predecessor).
- An equipped predecessor becomes the evolved item in the same slot; stats and archetype slices rebuild immediately. Spare bag copies remain. Bag evolution and reconstruction put the result in the bag.
- Per-id upgrade levels remain unchanged; predecessor upgrades do not transfer to the evolved definition. Reuses `CraftResult`.

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
- ~~`thorn-needle`~~ **retired 2026-09-26.** It was an unintended on-hit sibling that duplicated the
  Jungle Stinger Rapier. Saves holding it get a Gale Needle at the better upgrade level
  (`LEGACY_ITEM_IDS` in `server/src/db/playerRepo.ts`). No T1 lineage branches any more; T4's
  Mountain and Cave lines are the live examples of branching.
- All evolution/reconstruct/+4/+5 numbers are PLACEHOLDERS.

⚠️ `gale-needle` was previously a plain-craftable T2 forest weapon; it is now evolution-only. Existing
saves that hold it keep the item; the forge now offers Evolve/Reconstruct for it instead of Craft.

## Weapon ladder rules (2026-09-26 normalization, T1-T4)

Every weapon's Attack curve was re-set on these rules. Measure before changing a
weapon number, and re-check the whole chain, because the floors cascade tier to tier.

1. **Floor:** a weapon at +0 deals at least 1.10x what its own predecessor deals at
   +5. A weapon with no predecessor (a biome's debut item) must clear the best
   previous-tier weapon at +5.
2. **Band:** at +5 every weapon lands within about ±5-10% of its tier's median,
   judged on the basis it is built for:
   - DoT-conversion weapons on sustained damage (they start slow by design);
   - the Desert alpha-window line on the fight opener;
   - everything else on the blend.
3. **Tier medians stay put.** Monsters are tuned against current player power, so
   outliers move toward the median rather than the median moving.
4. **Curve shape follows the tier.** No "weak at +0, huge at +5" (or the reverse)
   shapes. Normalizing +0 and +5 to the tier medians removes them.

Instrument: `server/scripts/_t1BossLab.ts` dummy treatments. A boss with its
offense stripped and 1M HP is hit for 60s per class (Striker, Squire, Apprentice,
Slinger, Spirit), with and without Power Strike, against a bare and a
6-plating / 10%-DR target. Damage is read at 60s (sustained) and 8s (opener).
Each weapon is scored against the SAME class's median weapon, so class power gaps
do not leak into weapon numbers. Conduit was excluded (rebalanced separately).
The two T3 Tundra weapons were placeholders at +58/+66% over the T3 median; the T4
Warmaul was at 0.43x. Dead-end lines (Forest needles, Plains swords, Swamp poison)
have no successor floor.

Resolved 2026-09-26: Detonate went to 5.0x/5.5x with a 1.2s cast, and ability damage now
feeds weapon reservoirs. The hammer identities hold after normalization (Earthsunder: best
Power Strike carrier; Warmaul: best for Striker/Squire; Tyrant: keeps 0.95 vs T4 boss armour,
where the others keep 0.83-0.87). The Technique lineage shipped the same day as the **Desert technique staff**:
Iron Broadsword (T1) -> Knight's Steelsword (T2) -> **Pilgrim's Quarterstaff** (T3,
`desert-pilgrim-quarterstaff`) -> **Sunmonk's Warstaff** (T4, `desert-sunmonk-warstaff`).
The Steelsword is no longer a dead end. The staffs carry Technique Power plus CDR and
no cast speed (Mountain owns the wind-up). The Warstaff adds **Kata**
(`server/src/systems/player/abilities/abilityKata.ts`): three strike Techniques build
stacks, and the fourth spends them for +80% Technique Power; instant self-buffs
neither build nor spend it. Measured: 0.99x the tier median at T3 and T4, and
Power Strike adds ~36-39% on the staffs (~14% on an axe). Costs are 2.00x the
predecessor lifetime (1,440 / 2,880 yellow), with the Dominion catalyst.

## Verified

Typecheck clean (4 pkgs); shared rebuild clean; targetPriority + runeMaintenance pass. Sanity (built
package): lineage fields resolve; `checkEvolve` rejects no-predecessor / +2 and accepts +3-with-funds;
`checkReconstruct` accepts with funds; `gale-needle` max upgrade = 5.

## Deferred (not this session)

- +5 rewards: cheaper branch-switch, partial refund (roadmap "+5 role"). v1 switching = craft the sibling.
- Per-id (not per-instance) upgrade quirk: re-acquiring an id you already leveled inherits that level;
  "evolved item starts at +0" holds only on first acquisition.
- Lineages for the other 3 slots × biomes; +4/+5 and evolution-cost tuning (user balance pass).
