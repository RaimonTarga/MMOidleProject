# T1 Progression Economy — Implementation Ledger
**Date:** 2026-08-28
**Status:** IMPLEMENTED (data + one route-ordering fix). This is the "what actually shipped" record; treat it as authoritative over the two documents it implements, which are frozen as design history.
**Implements (with designer corrections):** `docs/briefs/T1_PROGRESSION_ECONOMY_PROPOSAL_2026-08-28.md`, factually grounded in `docs/briefs/T1_PROGRESSION_ECONOMY_BASELINE_2026-08-28.md`.

Nothing here touches combat stats, monster stats, class stats, boss stats, biome XP, GM thresholds, RP formulas, or combat behavior. Only recipe costs, two unlock levels, catalyst assignment, and one route step-ordering bug are in scope.

---

## 1. Files Changed

Recipe data:
- `shared/src/data/recipes/plains.recipes.ts` — Iron Broadsword, Survivor's Robe, Plains Stone, Fleet Boots
- `shared/src/data/recipes/forest.recipes.ts` — Flash Rapier, Shaded Bindings, Heartroot Amulet, Sprinter Wraps
- `shared/src/data/recipes/swamp.recipes.ts` — Poison Dagger, Arcane Wrappings, Murk Eye, Marsh Treads
- `shared/src/data/recipes/mountain.recipes.ts` — Heavy Hammer, Fallen Knight Plate, Granite Barrier, Iron Treads
- `shared/src/data/recipes/cave.recipes.ts` — Chaotic Axe, Bestial Hide, Pulse Stone, Bat Wing Boots
- `shared/src/abilityRecipes.ts` — Sweep, Second Wind, Cleanse, Brace, Expose Weakness
- `shared/src/runeRecipes.ts` — HP Below 25%, Avoid Hazards, Careful Pulling, Recover First, Step Back, Keep Distance (Orbit)

Route/economy legality:
- `bot/src/routes/t1GearPlans.ts` — split `COMMON_PLAINS_BEFORE`/`COMMON_PLAINS_AFTER_SHARED` so the L3 charm no longer crafts ahead of Sweep's new L2 gate (see §5)

Comments/tests kept in sync:
- `bot/src/routes/t1Common.ts` — two doc-comment level references
- `bot/src/reference.ts` — one worked-example line
- `bot/src/routes/t1Routes.semantic.test.ts` — one hardcoded `Sweep learned at Plains L3` assertion → L2
- `docs/README.md` — indexed this ledger and its two source documents in the briefs table

**Correction (2026-08-28 final cleanup pass):** the line above listing `docs/README.md` was missing from this section in the original version of this ledger, which incorrectly stated "no other files were edited." The chat summary that closed the original implementation turn was correct — `docs/README.md` was in fact edited in that same session, immediately after this ledger was written — the ledger's own bookkeeping simply omitted it. Fixed here; see §11 for the full final-cleanup file list.

Beyond that one correction, no other files were edited in the original pass. In particular, `t1RouteBuilder.ts`, boss loadouts, boss order, biome order, and all combat/monster/class files are untouched.

---

## 2. Full Before→After T1 Gear Cost Table

Grammar used: split each item's post-base upgrade budget so +1/+2/+3/+4/+5 roughly follow a 5/10/16/26/43% shape (69% in +4/+5), rounded to clean integers, **holding each item's current total→+5 cost fixed** — except Flash Rapier, the one approved exception (see §3). Catalyst structure is `+4: none, +5: 1 unit` on 9 of 20 items (see §4).

| Item | Biome | Slot | Before (base/+1/+2/+3/+4/+5, total) | After (base/+1/+2/+3/+4/+5, total) |
|---|---|---|---|---|
| Iron Broadsword | Plains | weapon | 10/20/30/60/60/60 = 240 | 10/10/25/35/60/100 = 240 |
| Survivor's Robe | Plains | armor | 20/30/60/120/120/120 = 470 | 20/20/45/70/115/200 = 470 |
| Plains Stone | Plains | charm | 10/12/24/48/48/48 = 190 | 10/10/20/30/45/75 = 190 |
| Fleet Boots | Plains | mobility | 10/10/20/40/40/40 = 160 | 10/10/15/25/40/60 = 160 |
| Flash Rapier | Forest | weapon | 20/30/60/120/240/480 = **950** | 20/25/50/75/125/205 = **500** (normalized; see §3) |
| Shaded Bindings | Forest | armor | 20/30/60/120/120/120 = 470 | 20/20/45/70/115/200 = 470 |
| Heartroot Amulet | Forest | charm | 15/15/30/60/60/60 = 240 | 15/10/20/35/60/100 = 240 |
| Sprinter Wraps | Forest | mobility | 10/10/20/40/40/40 = 160 | 10/10/15/25/40/60 = 160 |
| Poison Dagger | Swamp | weapon | 22/30/60/120/120/120 = 472 | 22/20/45/70/115/200 = 472 |
| Arcane Wrappings | Swamp | armor | 22/30/60/120/120/120 = 472 | 22/20/45/70/115/200 = 472 |
| Murk Eye | Swamp | charm | 18/15/33/63/63/63 = 255 | 18/10/25/40/60/100 = 253 |
| Marsh Treads | Swamp | mobility | 18/10/22/42/42/42 = 176 | 18/10/15/25/40/70 = 178 |
| Heavy Hammer | Mountain | weapon | 22/30/66/126/126/126 = 496 | 22/25/45/75/125/205 = 497 |
| Fallen Knight Plate | Mountain | armor | 22/30/66/126/126/126 = 496 | 22/25/45/75/125/205 = 497 |
| Granite Barrier | Mountain | charm | 18/15/33/63/63/63 = 255 | 18/10/25/40/60/100 = 253 |
| Iron Treads | Mountain | mobility | 18/10/22/42/42/42 = 176 | 18/10/15/25/40/70 = 178 |
| Chaotic Axe | Cave | weapon | 26/30/66/126/126/126 = 500 | 26/25/45/75/125/205 = 501 |
| Bestial Hide | Cave | armor | 22/50/100/150/150/150 = 622 | 22/30/60/95/155/260 = 622 |
| Pulse Stone | Cave | charm | 18/15/33/63/63/63 = 255 | 18/10/25/40/60/100 = 253 |
| Bat Wing Boots | Cave | mobility | 18/10/22/42/42/42 = 176 | 18/10/15/25/40/70 = 178 |

No item's stat/mechanic-effect grants changed — only the `cost`/`catalystCost` fields on each upgrade step. A handful of totals land 2 essence off their original figure (Murk Eye, Marsh Treads, Granite Barrier, Iron Treads, Heavy Hammer, Fallen Knight Plate, Chaotic Axe, Pulse Stone, Bat Wing Boots) — rounding to clean integers under the percentage grammar, not a deliberate change; the task's own instructions accepted this ("does not need to be mathematically identical").

---

## 3. Flash Rapier Exception

Flash Rapier was the one item with an un-flattened 20/30/60/120/240/480 curve — total 950, roughly double every other T1 weapon. Per the designer's explicit correction, this was **not** preserved; it was normalized to 500 total (within the requested 480-520 band), using the same accelerating grammar as every other weapon. `attacksPerSecond`/`attack` stat deltas on each step are unchanged — only cost moved.

---

## 4. Final Ability/Rune Unlock + Cost Table

| Ability/Rune | Kind | Unlock before | Unlock after | Cost before | Cost after | Classification |
|---|---|---|---|---|---|---|
| Sweep | Technique | Plains L3 | **Plains L2** | yellow 160 | **yellow 25** | Required counterplay |
| Second Wind | Guard | Forest L3 | **Forest L2** | green 150 | **green 25** | Required counterplay |
| Avoid Hazards | Rune | Swamp L2 | Swamp L2 (unchanged) | purple 90 | **purple 25** | Required counterplay |
| Cleanse | Guard | Swamp L3 | Swamp L3 (unchanged) | purple 150 | **purple 30** | Required counterplay |
| Step Back | Rune | Mountain L2 | Mountain L2 (unchanged) | blue 180, yellow 80 (260 total) | **blue 35** (single-color) | Required counterplay |
| Brace | Guard | Mountain L3 | Mountain L3 (unchanged) | blue 150 | **blue 45** | Required counterplay |
| Orbit (Keep Distance) | Rune | Mountain L3 | Mountain L3 (unchanged) | blue 180, yellow 80 (260 total) | **blue 45** (single-color) | Important for ranged builds — not classified equal to the hard-mandatory tier |
| Expose Weakness | Technique | Cave L3 | Cave L3 (unchanged) | red 150 | **red 85** | Strong single-target Technique — **not** mandatory counterplay |
| HP Below 25% | Rune | Cave L2 | Cave L2 (unchanged) | red 180 | **red 90** | Broadly useful |
| Recover First (`wait-for-regen`) | Rune | Cave L3 | Cave L3 (unchanged) | red 140, green 100 (240 total) | **red 50, green 30** (80 total) | Broadly useful — currently a no-op, see §5 |
| Careful Pulling | Rune | Cave L3 | Cave L3 (unchanged) | red 180 | **red 115** | Broadly useful/specialized |
| Out of Combat | Rune | Forest L2 | Forest L2 (unchanged) | green 180 | unchanged | Left alone per instructions |
| Reload Safely | Rune | Forest L2 | Forest L2 (unchanged) | green 140, blue 60 | unchanged | Left alone per instructions |
| Ready Execution | Rune | Forest L3 | Forest L3 (unchanged) | green 140, red 60 | unchanged | Left alone per instructions |
| Focus Highest HP | Rune | Forest L4 | Forest L4 (unchanged) | green 220 | unchanged | Left alone per instructions |
| Flee | Rune | Cave L2 | Cave L2 (unchanged) | red 160, green 80 | unchanged | Optional — currently a no-op, see §5 |
| Power Strike | Technique | Mountain L5 | Mountain L5 (unchanged) | blue 190 | unchanged | Optional/specialized, left as-is per instructions |

Every mandatory-counterplay tool remains essence-only, no catalyst.

---

## 5. Recover First / `wait-for-regen` Legality Finding

Traced end-to-end through `bot/src/routes/t1RouteBuilder.ts` (`controlledT1Runes`), `bot/src/route/executor.ts` (`doConfigureRunes`), and `shared/src/runeDatabase.ts`.

**Finding: there is no legality bug.** `wait-for-regen` (and `flee`) were made **STARTER runes** by an explicit designer call dated **2026-08-25** — three days before the baseline audit — recorded directly in `shared/src/runeDatabase.ts` on `STARTER_RUNE_IDS`:

> "DESIGNER CALL, 2026-08-25: default-unlocked so every character can answer danger the way a human does without waiting on a Cave-gated recipe first... Previously gated behind rune-recipe-recover-first and rune-recipe-flee (both still craftable, now redundant no-ops)."

Answering the audit's three questions directly:

1. **Must `rune-recipe-recover-first` be crafted before `wait-for-regen` can legally be equipped? No.** `wait-for-regen` is a starter action, owned by every character from the start (`shared/src/runeDatabase.ts:700`).
2. **Do canonical T1 routes omit the required craft? N/A** — no craft is required, so there is nothing to omit. Every `configureRunes` call in every T1 route has always been legal; `bot/src/route/executor.ts`'s `doConfigureRunes` (lines 688-711) would in any case silently filter out any rune action the player doesn't yet own, so even a genuinely-gated action would degrade safely rather than break — but that safety net was never exercised here.
3. **If no, why does the recipe exist, and what does it unlock?** `rune-recipe-recover-first` is now a **redundant no-op**: crafting it (and paying its cost) grants nothing the player doesn't already have, by the same source comment's own admission. It was left costed and craftable rather than deleted (out of scope for this task — recipe removal is a data-deletion decision for the designer, not an economy-cost pass).

**No route code fix was needed or made for Recover First.** The route generator's `controlledT1Runes` already legally includes `wait-for-regen` from the opening stage onward, because it always was a starter action by the time this task ran. Its recipe cost was still reduced per the task's instructions (§6/§7) for consistency, in case a future design pass reverses the 2026-08-25 call and re-gates it.

**A different, real route-ordering bug was found and fixed** (not Recover-First-related): moving Sweep's own recipe gate from Plains L3 to L2 was not, by itself, enough to make Sweep learnable at L2 in practice. `bot/src/routes/t1GearPlans.ts`'s shared `COMMON_PLAINS_BEFORE` step list crafted the weapon, armor, **and** the L3 charm — all three — before `learnSweep()` ever ran (`t1RouteBuilder.ts`'s `makeT1Route` always runs `beforeShared` steps before a biome's `biomeSharedSteps`). Since crafting the charm required farming to Plains L3 first, Sweep was still effectively gated at L3 by construction, regardless of what its own recipe said. Confirmed by running `t1Routes.semantic.test.ts`, which failed with `sweepAt?.biomeLevels.plains === 3` (not 2) before the fix.

**Fix applied:** `COMMON_PLAINS_BEFORE` now contains only the weapon and armor (L1/L2); the charm craft moved into `COMMON_PLAINS_AFTER_SHARED`, after Sweep is learned. This is shared by all 8 canonical routes (`durableMeleeProgression`, `slingerProgression`, and `apprenticeProgression`, which extends the first). No other route file needed touching — `doLearnAbility` and the semantic-test analyzer both read `requiredBiomeLevel` live from `ABILITY_RECIPE_DATABASE`, so the recipe-level change alone was sufficient everywhere else (in particular, Second Wind needed no equivalent fix: no gear plan crafts anything above Forest L2 before Second Wind runs).

---

## 6. T1 Node-Modifier Accessibility Finding

Traced through `shared/src/world/map/authoring.ts` (`allowedModifiersForBiome`, `buildRegionNodes`) and `shared/src/world/nodeModifierTypes.ts` (`MODIFIER_BANS`, `NATIVE_MODIFIER`) — the actual per-node assignment the original audit flagged as unextracted.

**Mechanism:** `buildRegionNodes` gives every biome one normal node per **non-banned** modifier family, plus one extra node for its own native modifier (if it has one). `MODIFIER_BANS` is a static table (not tier-specific): `forest: ['heavy']`, `mountain: ['alacrity']`. No other T1 biome (plains, swamp, cave) bans anything.

**Accessibility of the four families this pass assigns:**

| Family | Banned in | Accessible T1 biomes (of 5) | Verdict |
|---|---|---|---|
| alacrity | mountain | plains, forest (native, 2 nodes), swamp, cave | **Accessible** — 4 of 5 biomes |
| fortified | (none) | plains, forest, swamp (native, 2 nodes), mountain, cave | **Accessible** — all 5 biomes |
| heavy | forest | plains, swamp, mountain (native, 2 nodes), cave | **Accessible** — 4 of 5 biomes |
| swarming | (none) | plains, forest, swamp, mountain, cave | **Accessible** — all 5 biomes, no bans anywhere |

All four families used in §4/§7's catalyst assignment are confirmed obtainable within T1 with no map changes. **No accessibility problem was found; no substitution was needed; no map/modifier data was touched**, per the task's instruction to leave that system alone.

(For reference: `dominion`, native to Cave, is also unbanned everywhere and thus accessible tier-wide — it simply wasn't assigned to any T1 item in this pass, since no T1 weapon/armor lineage's own T2 family-tag points to it.)

---

## 7. Final Catalyst Assignments

Structure: **+4 no catalyst, +5 exactly 1 catalyst**, on 9 of 20 items (weapon+armor per biome, minus Iron Broadsword). Families inherited from each item's own live T2+ `family-tag` comment — not invented.

| Item | +4 catalyst | +5 catalyst | Family |
|---|---|---|---|
| Iron Broadsword | none | **none** (deliberately neutral, matches its own T2 successor) | — |
| Survivor's Robe | none | 1 | alacrity |
| Flash Rapier | none | 1 | alacrity |
| Shaded Bindings | none | 1 | alacrity |
| Poison Dagger | none | 1 | fortified |
| Arcane Wrappings | none | 1 | fortified |
| Heavy Hammer | none | 1 | heavy |
| Fallen Knight Plate | none | 1 | heavy |
| Chaotic Axe | none | 1 | swarming |
| Bestial Hide | none | 1 | swarming |

Charms, mobility items, Techniques, Guards, and Runes carry no catalyst cost anywhere in T1.

---

## 8. Tests Run and Results

1. `pnpm --filter @mmo-idle/shared exec tsc --noEmit` — clean.
2. `pnpm --filter bot exec tsc --noEmit` — clean.
3. `shared/src/data/recipeGates.test.ts` (reachability gate — validates every `catalystCost` family against `MODIFIER_BANS`) — **PASS**.
4. `bot/src/routes/t1Routes.semantic.test.ts` — **failed once** on the unfixed Sweep-ordering bug (§5), **PASS** after the `t1GearPlans.ts` fix and the test's own hardcoded-L3 assertion update.
5. `bot/src/harness.test.ts` — **PASS**.
6. Full suite via `node scripts/run-tests.mjs` (discovers and runs every `*.test.ts` in `server/test`, `shared/src/**`, `bot/src/**`) — **102/102 PASS** at the time of the original pass; **103/103 PASS** after the final cleanup pass added `server/test/runeRecipeDeprecation.test.ts` (§11), including all ability/rune/recipe-adjacent tests (`abilities`, `abilitySecondWind`, `abilityGuardsAndReach`, `abilityTechniqueRune`, `abilitySweepAdapters`, `mobilityBoots`, `resetProgress`, `catalystRekey`, `recipeGates`, `itemUpgrades`, `runeRecipeDeprecation`).
7. `pnpm typecheck` (all packages + bench) — clean.

No 1× bot progression batch was run, per instructions.

---

## 9. Remaining Inconsistencies / Open Items

- ~~`rune-recipe-recover-first` and `rune-recipe-flee` are both live, costed, craftable recipes that currently grant nothing (§5)~~ — **resolved in the 2026-08-28 final cleanup pass, see §11.** Both are now flagged `deprecated: true`, hidden from every player-facing craft/unlock surface, and explicitly rejected before any essence is spent.
- The nine catalyst-bearing items' T1 costs are, per the task's own framing, a first calibration — not validated against real T1 catalyst income. §6 confirms accessibility, not sufficiency; whether a player farming Cave naturally banks enough **swarming** (Cave's own native modifier is dominion, not swarming) to afford Chaotic Axe/Bestial Hide's +5 without a deliberate detour is exactly the kind of question flagged for the 1× run, not resolved here.
- A handful of item totals moved by ±2 essence from their pre-existing figures as a side effect of rounding to clean integers under the percentage grammar (listed in §2) — cosmetic, not a design decision.
- Everything else the two source documents flagged as open (Spirit/Conduit's shared-vs-distinct T1 gear-plan identity, Slinger's red-essence asymmetry, Apprentice's exact Mountain/Swamp allocation, Power Strike's non-use by canonical routes) is **unchanged and still open** — none of it was in this task's scope.

---

## 10. Recommendation on 1× Readiness

**T1 is ready for a first 1× economy/progression batch.** All touched data passes its recipe-reachability gate, all touched route logic passes its semantic legality suite, the full existing test suite is green, and both typechecks are clean. The one genuine bug this pass found (Sweep's route-ordering mismatch) is fixed and verified, not just patched over.

What the 1× run should specifically watch for, beyond the general hypotheses already listed in the proposal document's §10:
- Whether Sweep and Second Wind are now actually obtained "immediately or after a very short farm" at their new L2 gate, given the reordered Plains gear-plan (charm now crafts after Sweep, not before).
- Realized swarming/heavy catalyst income during the Cave and Mountain legs specifically, since those are the two families every melee/ranged canonical route's +5 targets will draw on (§9).
- Whether Flash Rapier's normalized ~500 total changes when/whether canonical routes still choose to replace it before +5, now that its curve no longer makes early upgrades disproportionately expensive.

---

## 11. Final Cleanup Pass (2026-08-28)

A follow-up session closed the one open item from §9: the two obsolete no-op Rune recipes, and the `docs/README.md` discrepancy in §1.

**Recover First / Flee handling.** Traced how Rune recipes become visible (`client/src/ui/crafting/makeEntries.ts`, `client/src/ui/map/biomeUnlocks.ts`), unlocked-and-announced (`client/src/net/gatedUnlocks.ts`), craftable (`server/src/systems/player/economy/runeCrafting.ts`), and persisted (`runeRecipesCrafted`/`runesOwned` on `TracksProgression`) before choosing an approach. Two things were already true and needed no fix: `craftRuneRecipe` already refuses to spend essence on either recipe, because `runesOwned` always contains `STARTER_RUNE_IDS` (including `wait-for-regen`/`flee`) from character creation, and its existing "rune fragment already unlocked" guard runs before the cost-deduction step — so **no player has ever been able to lose essence to these two recipes**. What *was* still broken: the Craft browser's dependence on that same ownership check as its only filter was implicit rather than explicit, and two other surfaces had no ownership check at all — the biome map's "what this level grants" ladder, and the "you just unlocked X" toast trigger — both of which would still present or announce the obsolete recipes as real rewards.

Chosen fix: added a generic `deprecated?: true` field to `RuneRecipe` (no such generic deprecation flag existed anywhere in the recipe architecture, so this is the smallest new mechanism, reusable by any future recipe promoted to a starter default) and set it on both `rune-recipe-recover-first` and `rune-recipe-flee` in `shared/src/runeRecipes.ts`. Neither recipe ID nor its cost/gate data was deleted — both still resolve via `RUNE_RECIPE_DATABASE.get()`, preserving save/persistence compatibility for any historical `runeRecipesCrafted` entry that might reference them. The flag is now checked at every surface that matters:

- `server/src/systems/player/economy/runeCrafting.ts` — explicit early rejection (`"This recipe is no longer craftable."`), ahead of and independent from the pre-existing implicit guard.
- `client/src/ui/crafting/makeEntries.ts` — explicit exclusion from the Craft browser (belt-and-suspenders alongside the pre-existing "already known" filter).
- `client/src/ui/map/biomeUnlocks.ts` — excluded from the biome-level unlock ladder, the one surface that intentionally shows already-owned rewards and so had no other filter that would have caught this.
- `client/src/net/gatedUnlocks.ts` — excluded from the "gate just opened" toast diff, so reaching Cave L2/L3 never announces "Flee unlocked!" / "Recover First unlocked!" for something already owned since character creation.
- `bot/src/reference.ts` — excluded from the generated "how non-starter fragments are unlocked" table, whose own header would otherwise have been self-contradicting; **`reports/bot-route-reference.md` was regenerated** (`pnpm bot:reference`) to match — this also picked up the T1 cost-table changes from the original implementation pass, which had not yet been regenerated into that artifact.
- `shared/src/runeDatabase.ts` — the `STARTER_RUNE_IDS` comment that previously said both recipes were "still craftable, now redundant no-ops" was corrected to describe the new deprecated/hidden state.

**Stable IDs retained:** yes — both `rune-recipe-recover-first` and `rune-recipe-flee` remain in `RUNE_RECIPE_DATABASE` unchanged except for the added `deprecated: true` flag. Deleting them was rejected because a save with either id in `runeRecipesCrafted` would otherwise reference an unknown recipe.

**Regression coverage added:** `server/test/runeRecipeDeprecation.test.ts` (new) proves, against a real `World`/player entity: `wait-for-regen` and `flee` are owned from character creation; both obsolete recipe ids still resolve and carry `deprecated: true`; attempting to craft either fails and spends zero essence and records no craft; and — as a control — a normal, non-deprecated Cave rune recipe (`rune-recipe-careful-pulling`) still crafts successfully, proving the new check doesn't over-fire. `shared/src/data/recipeGates.test.ts` (the existing generic reachability gate, reused rather than adding a bespoke one) gained one more invariant: any recipe marked `deprecated` must have its `runeId` actually present in `STARTER_RUNE_IDS`, guarding against a future mislabeling. `bot/src/routes/t1Routes.semantic.test.ts` was re-run unchanged and stayed green, confirming no canonical route ever referenced either recipe id to begin with.

**`docs/README.md` discrepancy resolved:** `git diff --stat` and `git log` confirmed `docs/README.md` genuinely was modified in the original implementation session (the three-row briefs-table addition indexing this ledger and its two source documents) — the prior chat summary was correct, and §1 of this ledger was the one in error for omitting it. §1 has been corrected in place rather than rewritten wholesale.

**Files changed in this cleanup pass:**
- `shared/src/runeRecipes.ts` — `RuneRecipe.deprecated` field added; both obsolete recipes flagged
- `shared/src/runeDatabase.ts` — one comment corrected
- `shared/src/data/recipeGates.test.ts` — one new generic invariant (deprecated ⇒ starter)
- `server/src/systems/player/economy/runeCrafting.ts` — explicit early rejection
- `server/test/runeRecipeDeprecation.test.ts` — new regression test
- `client/src/ui/crafting/makeEntries.ts` — explicit craft-list exclusion
- `client/src/ui/map/biomeUnlocks.ts` — `LearnedRecipe.deprecated` field + exclusion + doc-comment update
- `client/src/net/gatedUnlocks.ts` — excluded from the unlock-toast diff
- `bot/src/reference.ts` — excluded from the generated rune-recipe table
- `reports/bot-route-reference.md` — regenerated (build artifact, not hand-edited)
- `docs/README.md` — §1 discrepancy fix only (no new edit this pass — see above)
- `docs/briefs/T1_PROGRESSION_ECONOMY_IMPLEMENTATION_2026-08-28.md` — this section, plus the §1 correction and the §9 status update

No combat, monster, class, boss, biome-XP, GM, RP, gear-cost, ability-cost, or catalyst-assignment numbers were touched in this pass.
