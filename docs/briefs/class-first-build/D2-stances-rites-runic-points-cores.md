# D2: remove stances, rites, Runic Points, crafted runes and the core slot

**Agent:** Grok · **Worktree:** `../mmo-rw-d2-stances-rites` · **Branch:**
`rw/d2-stances-rites` (from `rework/class-first` with D5 merged) · **Size:** L ·
**Phase 0, wave B** (runs beside D1, which removes the item lineage trees; the conductor
resolves any overlap at merge)

**Read first:** `docs/briefs/class-first-build/AGENT-RULES.md`; `CLAUDE.md`; the plan
`docs/briefs/class-first-build-plan-2026-10-14.md` §0–§4 (§3.8: "Universal standing orders
are free ... the rune engine stays as their surface; Runic Points go"); the audit
`docs/briefs/rework-audit-2026-10-13.md` (footprint table); `design_docs/class-first-bible.md`
§3 ("Rules cost nothing", "No shared stances or rites") and §4 (five slots: the core slot is
gone).

## Why

The class-first rework gives every class its own automation and its own budget, so four
shared systems go for every class: **stances** and **rites** (no shared stances or rites,
bible §3), the **Runic Point** budget that priced runes, abilities, stances and rites (rules
cost nothing now), and the **core** equipment slot (bible §4: five slots). The **rune
engine** stays: it is the surface for the free universal standing orders (Flee, Recover
First, Avoid Hazards, Keep Distance, focus, travel), and every class system will reuse its
conditions.

## Do (one commit per system, typecheck clean after each)

1. **Runic Points and crafted runes.** Remove `shared/src/runicPoints.ts` and every budget
   check, readout and cost (`runeLoadoutCost`, `runeRuleCost`, `runeBudgetForGlobalMastery`,
   `AttunementBudget.tsx`, RP lines in panels and text). Remove rune crafting
   (`shared/src/runeRecipes.ts`, `RUNE_RECIPE_DATABASE`, `runeRecipesCrafted`, the craft-rune
   intent): every rune the character's class may use is simply available, so
   `runesOwned` is derived from the archetype (keep `requiredArchetype` filtering). The rune
   editor stays and saves a loadout of any length.
2. **Stances.** Remove `shared/src/stances.ts`, `stanceRecipes.ts`, the server
   `systems/player/stances/`, `economy/stanceCrafting.ts`, the `OverridesStance` slice, the
   stance runes and conditions (`stance-charged`), stance fields on `tracksProgression`
   (`knownStances`, `attunedStances`, `equippedStances`, `activeStance`), stance effects in the
   stat and damage formulas (`resolveFinalDamageMultipliers` and friends keep working without
   a stance), `client/src/ui/StancesPanel.tsx`, stance icons in the HUD and the stance intents.
3. **Rites.** Remove `shared/src/rites.ts`, `riteRecipes.ts`, the server `systems/player/rites/`,
   `economy/riteCrafting.ts`, rite fields (`knownRites`, `equippedRites`), rite effects,
   `client/src/ui/RitesPanel.tsx` and the rite intents.
4. **The core slot.** Remove `'core'` from `EquipmentSlot` and the slot lists, the core
   recipes and items (`coreEligibility`), `shared/src/systems/cores.ts`,
   `server/src/systems/combat/cores.ts` and their effects, and the core slot in the inventory
   UI. **Not** the folders named `core` inside `server/src/systems/classes/archetypes/*/t3/`
   and `server/src/systems/defense/core`: those are unrelated class and defense logic.
5. **State and protocol:** drop the removed fields from the slices and the save normalizers
   (`server/src/db/playerRepo.ts`: drop them on load, so an old dev save still loads), the
   socket events in `shared/src/protocol/socketEvents.ts`, view fields in `views.ts`, admin
   and checkpoint code that copies them.
6. **Tests:** delete tests of deleted code; adapt tests that mention these systems in passing
   so they keep their real assertions. If a test fails for a reason unrelated to this
   removal, stop and report it.

## The tutorial, while D6 is still running

Task D6 (the tutorial keeps its engine) runs at the same time and deletes
`shared/src/tutorial/scripts/classScript.ts` and `scripts/runes.ts`. If your removal
breaks either file, delete it (and its export in `scripts/index.ts`) rather than fixing
it. In the rest of `shared/src/tutorial/`, touch only the conditions and types that name
the systems you remove. The conductor merges D6 and your branch together.

## Keep (don't delete)

- **The rune engine:** `shared/src/runeDatabase.ts` (conditions, actions, `requiredArchetype`),
  `server/src/systems/combat/ai/runeConfig.ts`, the rune editor UI. Class-specific runes stay
  too (each class track removes its own later).
- **Abilities, their crafting and attunement:** task D3 removes those. After this task an
  ability simply attunes with no Runic Point cost.
- Everything about the item lineage trees, ability node rows and shards: that is task D1.
- `shared/src/classKits/` and everything the class-first framework added.

## Allowed paths

Anything these removals touch in `shared/`, `server/`, `client/`, `admin/`, plus your report.
Not `bot/` and not `design_docs/`. Hot files (`socketEvents.ts`, `networkedEntity.ts`,
`entity.ts`, `playerRepo.ts`, `combatBootstrap.ts`, `World.ts`): only the lines that belong to
the removed systems.

## Check

- `pnpm typecheck` clean after every commit.
- `pnpm test` (the full suite) at the end: paste the `N/M passed` line and every `FAIL` name.
  Failures that existed before your branch (run the same files on `rework/class-first` to
  prove it) are listed, not fixed.
- `grep -rniE "runic|stance|\brite|riteRecipe|coreEligibility|'core'" shared/src server/src client/src admin/src`
  returns only lines you can justify (list them in the report).
- `git diff --numstat`: no whole-file line-ending churn.

## Don't

- Don't touch the class kits, the class config, the Passive Tree, the item lineage trees,
  shards, or the abilities themselves.
- Don't change monster, boss or balance numbers.
- Don't add anything new: this task only removes.

## Report

`docs/briefs/class-first-build/reports/D2.md` (shape in AGENT-RULES.md): files deleted and
lines removed per system, the final suite count, the grep output, and anything you kept
because you were unsure.
