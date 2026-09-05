# T2 Progression Economy — Implementation Ledger
**Date:** 2026-08-29
**Status:** IMPLEMENTED. This is the "what actually shipped" record; treat it as authoritative over `T2_PROGRESSION_ECONOMY_BASELINE_2026-08-29.md` on any figure the two disagree on.
**Implements:** the T2 progression/economy spec handed off alongside the baseline audit, using the finalized T1 pass (`T1_PROGRESSION_ECONOMY_IMPLEMENTATION_2026-08-28.md`) as the template for curve shape, evolution architecture, and catalyst-introduction philosophy.

For the original 2026-08-29 pass, nothing here touched combat stats, monster stats,
boss mechanics, biome XP, GM thresholds, RP formulas, core stats/availability, or
Rites. Only T2 recipe costs/catalysts, T1→T2 evolution wiring, four Rune gates, and
Stance catalyst counts were in scope; the current redistribution is recorded below.

---

## Current follow-up: locked T2 stance/core redistribution (2026-09-04)

The original ledger remains a historical record of the first-pass economy work. The
following current-code values supersede its old T2 placement/economy statements for
these nine rewards; recipe IDs and stance/core mechanics are unchanged.

| Reward | Old placement | New placement | New essence | New catalyst |
|---|---|---|---|---|
| Offensive Stance | Forest L7 | Plains L7 | 60 yellow | 1 alacrity |
| Defensive Stance | Forest L7 | Plains L7 | 60 yellow | 1 fortified |
| Perfection Stance | Plains L8 | Forest L8 | 110 green | 1 alacrity |
| Fleeting Stance | Jungle L5 | Swamp L8 | 110 purple | 1 alacrity |
| Tanking Stance | Forest L8 | Mountain L8 | 100 blue | 1 heavy |
| Enraged Stance | Desert L5 | Cave L8 | 110 red | 1 dominion |
| Tempered Core | Plains L7 | Cave L12 | 500 red | 4 dominion |
| Survivalist Core | Forest L7 | Jungle L6 | 500 green | 4 fortified |
| Force Core | Cave L8 | Desert L6 | 500 yellow | 4 dominion |

No boss-clear requirement was added. The generated route retains the existing biome
order and policy, with acquisition legs updated to Plains for both introductory
stances and Cave/Jungle/Desert for the three cores; no route redesign is included.

## 1. Files Changed

Recipe data (all five returning T1→T2 biomes + both T2-native biomes):
- `shared/src/data/recipes/plains.recipes.ts` — Knight's Steelsword, Enduring Robe, Stalwart Heart, Gale Boots
- `shared/src/data/recipes/forest.recipes.ts` — Gale Needle, Thorn Needle, Phantom Bindings, Ancient Heartroot Amulet, Windstep Wraps (plus a stale "+3 evolution-ready" comment fix on Flash Rapier)
- `shared/src/data/recipes/swamp.recipes.ts` — Venom Knife, Bog Wrappings, Bog Eye, Wetland Wraps
- `shared/src/data/recipes/mountain.recipes.ts` — Quake Hammer, Iron Crusader Plate, Iron Bulwark, Mountain Stride
- `shared/src/data/recipes/cave.recipes.ts` — Ruinous Axe, Dire Bestial Hide, Resonant Gem, Cavern Sprints
- `shared/src/data/recipes/jungle.recipes.ts` — Stinger Rapier, Verdant Weave, Canopy Heart, Vine Wraps (T2 band only; T3/T4 untouched)
- `shared/src/data/recipes/desert.recipes.ts` — Sunsteel Falchion, Duneplate of the Last Stand, Mirage Talisman, Sand Sprint (T2 band only; T3/T4 untouched)

Evolution system:
- `shared/src/systems/evolution.ts` — `EVOLUTION_REQUIRED_PLUS` raised from 3 to 5

Abilities / Runes / Stances:
- `shared/src/abilityRecipes.ts` — Hamstring, Bramble Guard, Charge, Endure costs
- `shared/src/runeRecipes.ts` — Surrounded, Focus Lowest HP, Let DoTs Finish, Spread DoTs (gate + cost)
- `shared/src/stanceRecipes.ts` — catalyst count on the six T2-accessible stances

Client / evolution UI:
- `client/src/ui/crafting/MakeTab.tsx` — "Evolves from X +3" and "Need +3" hardcodes replaced with `requiredPlusFor(recipe)` so the UI reflects the new +5 requirement without another hardcode

Tests:
- `server/test/t2ProgressionEconomy.test.ts` — new, see §11
- `server/test/catalystRekey.test.ts` — updated one stale assertion (Gale Needle's reconstruct cost changed from green 240/alacrity 5 to green 210/alacrity 2 as part of this pass; see §11)

Docs:
- `docs/README.md` — indexed this ledger, reworded the baseline row to "pre-rebalance"

No server-side crafting/evolution logic changed. `server/src/systems/player/economy/crafting.ts`, `server/src/systems/player/economy/itemEvolution.ts`, and `shared/src/systems/itemUpgrades.ts` are all fully generic over recipe data — the existing Flash Rapier→Gale/Thorn architecture absorbed 19 new lineages with zero code changes, which is the intended payoff of using it as the template (§18 traced this explicitly: recipe database/types, server crafting/evolution validation, item consumption, reconstruction, client UI, and bot/reference helpers were all checked and only the client hardcodes needed a fix).

---

## 2. Full T1→T2 Lineage Map (§5, MAJOR)

19 new `evolvesFrom` links were added on top of the one pre-existing Forest rapier lineage (now 21 evolved recipes total). Jungle and Desert deliberately have **no** T1 predecessor — they debut at T2, per the spec.

| T1 predecessor | T2 evolution | Biome | Slot |
|---|---|---|---|
| `iron-broadsword` | `knight-steelsword` (Knight's Steelsword) | Plains | weapon |
| `plains-vest-t1` | `plains-vest-t2` (Enduring Robe) | Plains | armor |
| `plains-charm-t1` | `plains-charm-t2` (Stalwart Heart) | Plains | recovery |
| `plains-boots-t1` | `plains-boots-t2` (Gale Boots) | Plains | mobility |
| `flash-rapier` | `gale-needle` (Gale Needle) | Forest | weapon |
| `flash-rapier` | `thorn-needle` (Thorn Needle) | Forest | weapon (branch) |
| `forest-vest-t1` | `forest-vest-t2` (Phantom Bindings) | Forest | armor |
| `forest-charm-t1` | `forest-charm-t2` (Ancient Heartroot Amulet) | Forest | recovery |
| `forest-boots-t1` | `forest-boots-t2` (Windstep Wraps) | Forest | mobility |
| `ashbrand-blade` | `swamp-mirebrand` (Venom Knife) | Swamp | weapon |
| `swamp-vest-t1` | `swamp-vest-t2` (Bog Wrappings) | Swamp | armor |
| `swamp-charm-t1` | `swamp-charm-t2` (Bog Eye) | Swamp | recovery |
| `swamp-boots-t1` | `swamp-boots-t2` (Wetland Wraps) | Swamp | mobility |
| `heavy-hammer` | `quake-hammer` (Quake Hammer) | Mountain | weapon |
| `mountain-vest-t1` | `mountain-vest-t2` (Iron Crusader Plate) | Mountain | armor |
| `mountain-charm-t1` | `mountain-charm-t2` (Iron Bulwark) | Mountain | recovery |
| `mountain-boots-t1` | `mountain-boots-t2` (Mountain Stride) | Mountain | mobility |
| `chaotic-axe` | `ruinous-axe` (Ruinous Axe) | Cave | weapon |
| `cave-vest-t1` | `cave-vest-t2` (Dire Bestial Hide) | Cave | armor |
| `cave-charm-t1` | `cave-charm-t2` (Resonant Gem) | Cave | recovery |
| `cave-boots-t1` | `cave-boots-t2` (Cavern Sprints) | Cave | mobility |

Jungle and Desert's 8 T2 items (`jungle-stinger-rapier`, `jungle-vest-t2`, `jungle-charm-t2`, `jungle-boots-t2`, `desert-sunsteel-cross`, `desert-vest-t2`, `desert-charm-t2`, `desert-boots-t2`) remain plain `craftRecipe` items with no `evolvesFrom` — confirmed by test.

---

## 3. Evolve / Reconstruct Rule (§6, §7)

**Evolution requirement raised from +3 to +5** via one shared constant (`EVOLUTION_REQUIRED_PLUS` in `shared/src/systems/evolution.ts`), which `requiredPlusFor()` already applied uniformly to every lineage — so all 21 evolved recipes (the pre-existing rapier branches included) picked up the new requirement with a one-line change, no per-recipe edits needed.

- **Evolve** (predecessor at +5 in bag): pays the recipe's normal `cost` (≈ the item's own base-craft cost), **no catalyst**. The predecessor copy is consumed.
- **Reconstruct** (no predecessor, or predecessor below +5): pays `reconstructCost` at **3.5x** the evolve essence cost (same essence-color split as the evolve cost, so hybrid items keep their home/splash ratio) plus **2 catalysts** of the item's established family.
- **Exception — Knight's Steelsword:** stays catalyst-neutral on both evolve and reconstruct, matching the deliberate "flexible payment, deferred" precedent already set on its T1 predecessor (Iron Broadsword) and noted in `types.ts`'s own `catalystCostFlexible` TODO. There is no established family for the Plains generalist sidearm, and inventing one would contradict that precedent. Reconstruct is priced at 4x instead of 3.5x (yellow 180 vs. an evolve cost of 45) so evolving still reads as strictly better even without a catalyst gap to reinforce it. Documented inline on the recipe and tested explicitly.
- Flash Rapier's own branch (`gale-needle` / `thorn-needle`) still lets the player choose either child at +5, unchanged behavior, now gated at +5 instead of +3.
- No Jungle/Desert item was given a T1 predecessor.

---

## 4. Gale Needle / Thorn Needle Normalization (§4)

Both were carrying the exact doubling-to-+5 curve (60/120/240/480/960 essence) that the T1 pass explicitly moved Flash Rapier away from — the audit's own finding. Normalized, no stat/mechanic changes:

| Item | Before total (evolve+upgrades) | After total | Evolve cost | Reconstruct |
|---|--:|--:|---|---|
| Gale Needle | 1,920 green | **1,000 green** (60/38/94/150/244+1cat/414+2cat) | 60 green, no catalyst | 210 green, 2 alacrity |
| Thorn Needle | 1,920g / 640p | **~1,100** combined (60/45+15 evolve, upgrades scale to ~344g/114p at +5), ~75/25 green/purple lifetime split preserved | 45 green / 15 purple, no catalyst | 157 green / 53 purple, 2 alacrity |

Combat stats (`attack`, `onHitDamage`, `attacksPerSecond`) are untouched on both items and every upgrade step.

---

## 5. Upgrade Grammar (§3, §17)

Every touched T2 gear item's current base+upgrade essence total was preserved (within ≤1 essence of rounding noise), then redistributed +1→+5 using the same accelerating shape as the T1 pass: post-base spend split roughly 4/10/16/26/44% across +1..+5, landing +4/+5 at ~70% of post-base spend (the spec's 65-75% target). Slot hierarchy preserved: weapon/armor totals stayed the largest, recovery/charm mid, mobility smallest, per biome. Stat/mechanic-effect gains on every upgrade step are byte-for-byte unchanged — only `cost`/`catalystCost` moved.

Hybrid items (Verdant Weave, Duneplate of the Last Stand, Mirage Talisman, Thorn Needle) kept their existing essence-color ratio through the reshaped curve rather than collapsing to a single color.

---

## 6. Catalyst Schedule (§2, §8)

- **Every T2 gear item's base/evolution craft is now catalyst-free** — verified by test across all 29 touched items (21 evolutions + 8 Jungle/Desert plain crafts).
- **Weapon/armor:** +1 through +3 free; **+4 costs 1 catalyst; +5 costs 2 catalysts**, of the item's own established family-tag (unchanged families — alacrity/fortified/heavy/swarming/dominion per biome, not remapped to the biome's native modifier).
- **Recovery/mobility (charm/boots):** +1 through +4 free; **+5 costs 1 catalyst**.
- **Reconstruction:** exactly 2 catalyst units of the established family (Knight's Steelsword excepted, see §3).
- Forest's charm (Ancient Heartroot Amulet) and boots (Windstep Wraps) had **no established catalyst family at all** before this pass (T1 charms/boots are deliberately catalyst-free, and nothing carried a family-tag comment forward). Assigned **alacrity** to both, consistent with every other Forest T2 item's own family and with Jungle's inherited alacrity — a gap-fill, not a remap, and called out here per the instruction to flag judgment calls.
- `recipeGates.test.ts` passes with zero entries on its debt list — every catalyst family used remains reachable and unbanned in the biome that needs it.

---

## 7. Techniques / Guards (§10)

| Ability | Before | After | Gate (unchanged) |
|---|---|---|---|
| Hamstring | green 320 | **green 70** | Jungle L3 |
| Charge | yellow 320 | **yellow 70** | Desert L3 |
| Bramble Guard | green 380 | **green 90** | Jungle L5 |
| Endure | yellow 380 | **yellow 90** | Desert L5 |

No catalyst added, no combat-effect or gate changes. No mechanic-timing contradiction was found at the current gates, so none were touched.

---

## 8. T2 Swamp Rune Gates (§11)

| Rune | Before | After |
|---|---|---|
| Surrounded | Swamp L3, purple 240 + red 100 | **Swamp L7, purple 70** |
| Focus Lowest HP | Swamp L2, purple 240 + yellow 120 | **Swamp L8, purple 90** |
| Let DoTs Finish | Swamp L3, purple 220 + green 120 | **Swamp L9, purple 90** |
| Spread DoTs | Swamp L4, purple 280 + red 120 | **Swamp L10, purple 120** |

All four keep `tier: 2` and their relative progression order. No catalyst. Verified by test that none of the four is reachable at Swamp level 6 (the T1 cap) and each unlocks exactly at its new level, not one level early. Step Back's placement (Cave L2, live-code) was **not** touched, per the task's explicit instruction that the code/doc discrepancy there is out of scope.

**Side effect found and accepted:** `bot/src/routes/apprenticeLetDotsFinishT1.ts` — a historical, non-canonical experiment route ("Experiment D, alternate arm") — crafts `rune-recipe-let-dots-finish` during T1 Swamp progression. That craft is no longer reachable at that point in the route now that the recipe is gated at Swamp L9. This route is **not** a member of `T1_CONTROLLED_ROUTE_IDS` and is explicitly excluded from `t1Routes.semantic.test.ts`'s legality checks (the test asserts historical/experiment routes stay excluded from the controlled set) — confirmed the full suite still passes. The route would fail if actually executed with `pnpm bot:run`, which was not run per instructions. Flagged here rather than silently left for someone to discover; fixing the route itself is out of this task's scope (§16 — no route-building work).

---

## 9. Stance Catalysts (§12)

Every T2-accessible stance's catalyst reduced to exactly 1 unit; essence costs, gates, and mechanic identities untouched:

| Stance | Family | Before | After |
|---|---|---|---|
| Offensive | alacrity | 2 | **1** |
| Defensive | alacrity | 2 | **1** |
| Tanking | alacrity | 3 | **1** |
| Enraged | dominion | 3 | **1** |
| Perfection | alacrity | 3 | **1** |
| Fleeting | alacrity | 3 | **1** |

Tier 3/4 stances (Berserker, Predator, Brawler, Execute, Recuperating) are untouched — out of scope.

---

## 10. Deferred / Out of Scope

- **Cores** (§14): untouched in the original 2026-08-29 pass. The current
  placement and cost changes for Tempered/Survivalist/Force are recorded in the
  2026-09-04 follow-up above; the base-craft catalyst rule remains unchanged.
- **Rites** (§15): untouched, T3+ only, confirmed unaffected.
- **T2 boss catalyst bundles** (§9 of the spec): **not restored**, per instruction. While tracing the mechanism (`server/src/systems/player/progression/rewards.ts:229-238`) to check whether it was worth flagging as a pre-existing no-op: the bundle is granted only when `NODE_MODIFIERS[nodeId]?.modifier` resolves for the boss's own node — if a boss node carries no modifier, `bundleFamily` is `undefined` and the bundle silently grants nothing even though `catalystBundle` is set on the monster def. Whether every T1 boss node actually carries a modifier was **not exhaustively verified** in this pass (would require reading the full node-modifier assignment table against every T1 boss's spawn node) — flagged per the task's instruction to report this separately rather than chase it, since fixing/verifying it is out of scope here.
- **T2 canonical bot route** (§16): not built, as instructed.
- **No T2 core schema changes**: no compatibility edit was needed — `ITEM_DATABASE`'s recipe→item mapping (`shared/src/itemDatabase.ts`) is already fully generic over `Recipe` fields including `evolvesFrom`/`reconstructCost`/`upgrades`, so no core-adjacent code needed touching.

---

## 11. Tests / Results

New test: `server/test/t2ProgressionEconomy.test.ts` — asserts, against live `RECIPE_DATABASE`/`ABILITY_RECIPE_DATABASE`/`RUNE_RECIPE_DATABASE`:
- `EVOLUTION_REQUIRED_PLUS === 5`.
- All 21 returning-biome lineages have the correct `evolvesFrom` and `requiredPlusFor === 5`; all 8 Jungle/Desert items have no predecessor.
- A +4 Flash Rapier cannot evolve into Gale Needle; a +5 one can. Gale/Thorn/Knight's Steelsword/Ruinous Axe all reconstruct successfully with no predecessor.
- No evolution's evolve-path `catalystCost` is set; no Jungle/Desert base craft has one either.
- Reconstruction catalyst totals are exactly 2 units (Knight's Steelsword's documented exception excluded).
- Weapon/armor +1–+3 have no catalyst, +4 has exactly 1, +5 has exactly 2 (Knight's Steelsword: 0/0). Recovery/mobility +4 has none, +5 has exactly 1.
- Every touched item's upgrade curve is non-decreasing, strictly accelerating (+5 > +1), and +4/+5 hold ≥65% of post-base spend.
- Gale Needle's total lands in [900, 1100]; Thorn Needle's in [1050, 1150].
- Hamstring/Charge/Bramble Guard/Endure costs and gates match the new table, no catalyst.
- The four Swamp Runes carry the new gate/cost/tier and are unreachable at Swamp L6, reachable at their own new level exactly.

Updated: `server/test/catalystRekey.test.ts` — one assertion referenced Gale Needle's old reconstruct figures (green 240 / alacrity 5); updated to the new normalized figures (green 210 / alacrity 2), documented inline as an approved change from this pass.

**Results:**
- `pnpm --filter @mmo-idle/shared exec tsc --noEmit` — clean.
- `pnpm --filter @mmo-idle/server exec tsc --noEmit` — clean.
- `pnpm --filter @mmo-idle/client exec tsc --noEmit` — clean.
- `pnpm --filter bot exec tsc --noEmit` — clean.
- `shared/src/data/recipeGates.test.ts` — PASS (zero unreachable recipes, zero debt-list entries).
- `server/test/t2ProgressionEconomy.test.ts` — PASS (new).
- Full suite (`node scripts/run-tests.mjs`) — **109/109 PASS** after the `catalystRekey.test.ts` fix (108/109 before, with the one expected failure being the stale Gale Needle assertion this pass itself invalidated).

No progression bots were run, per instructions.
