# Stances — Current State

Companion to `docs/archive/stances-plan.md`. Roadmap: `docs/system-rework-roadmap.md` §Step 10.

> **🔨 IMPLEMENTED 2026-06-24** — machinery + 3 worked stances (Offensive / Defensive / Tanking),
> the default+reactive slot model, the `switch-stance` rune action, and the full stack (stats fold,
> tick reconciler, crafting, protocol, client panel, admin). Built exactly per `docs/archive/stances-plan.md` with
> the two locked decisions (default+reactive slot; stat recalc on switch). Verified: 4-pkg typecheck,
> shared rebuild, both server tests (`targetPriority`, `runeMaintenance`), a clean idle combat bench,
> and a sanity script (catalog/gating/rune-flag/stats-fold/DR-tradeoff clamp). All numbers are
> PLACEHOLDERS for the user balance pass. The audit below is the pre-implementation snapshot.

---

The rest of this doc captures what existed in code **before** Step 10.

## TL;DR

There is **no player stance system**. "stance" today is only (a) flavor comments and (b) a *monster*
mechanic (`bestiaryMechanics.ts` — bosses flip ranged/melee mid-fight). For players, Step 10 is
entirely net-new — but it is a near-clone of two systems that already shipped: **Step 7 Abilities**
(build/loadout state on `TracksProgression`, parallel recipe file, dedicated rune channel + action,
panel/admin/protocol) and **Step 9 Cores** (T2 biome-level recipe gating, stat-delta effects through
the shared stats pipeline, worked-example discipline). Stances reuse both patterns almost verbatim.

## What already exists (reuse, don't rebuild)

### Loadout state on `TracksProgression` (the Abilities precedent)
- Abilities store `knownAbilities: string[]` + `equippedAbilities: { technique, guard }` directly on
  the networked, persisted `TracksProgression` slice (`shared/src/components/core/networkedSlices.ts`)
  — **no new component, no DB migration, no new networked slice / dev-boot invariant, no `ServerEntity`
  key.** Stances mirror this exactly: `knownStances` + `equippedStances` + `activeStance`.
- Persistence is automatic: `playerRepo` defaults the fields on fresh + hydrate and the whole-slice
  JSON write persists them. `knownAbilities` is filtered through `validAbilityIds` on load — stances do
  the same through `validStanceIds`.

### The rune-action catalog + dedicated channels (the Abilities precedent)
- `shared/src/runeDatabase.ts` already added **per-system channels** for Step 7: `TECHNIQUE` / `GUARD`
  channels and `fire-technique` / `fire-guard` actions, each single-claim, with derived flags
  (`fireTechnique` / `fireGuard`). `runeConfig.ts` stamps them onto `TracksCombat` as
  `RUNE_FIRE_TECHNIQUE_FLAG` / `RUNE_FIRE_GUARD_FLAG`, read by a per-tick server system.
- The fold (`deriveAutoConfigFromRunes`) is channel-based: a new `STANCE` channel + `switch-stance`
  action drops in with the same shape. `RunesPanel` iterates `ACTION_DATABASE`, so a new action
  surfaces in the UI automatically (only `CHANNEL_COLOR` needs a `STANCE` entry).
- RP budget is GM-driven (`runeBudgetForGlobalMastery`); a rune rule's cost is `condition.cost +
  action.cost`. The "automated stance switching costs RP" requirement = the cost of equipping the
  `switch-stance` rule. **No budget-system change.**

### Per-tick driver system (the `abilityFiring.ts` precedent)
- `server/src/systems/player/abilities/abilityFiring.ts` (`updateAbilityFiring(world)`) runs each
  `World.tick` **after rune flags are stamped**, iterates live players, reads built-in triggers vs.
  the rune-override flag, and uses per-slot cooldowns on `TracksCombat` (`getCooldown`/`setCooldown`).
  The stance-switch system is a direct sibling: read default vs. reactive, honor the rune flag, gate on
  an anti-thrash cooldown, and trigger a stat recalc when the active stance changes.

### Stat-delta effects through the shared stats pipeline (the Cores/skill-tree precedent)
- `shared/src/systems/stats.ts` `recalculatePlayerStats(p)` folds `StatEffects` (attack, plating,
  damageReduction, evasion, attackRange, attackSpeedPct, maxHp, hpRegen, speed) and `mechanicEffects`
  passives from skill-tree nodes (loop ~line 123) and equipment (loop ~line 161), via
  `applyStatModToTarget` + `mergePassives`. **All the brainstorm's example stances are pure stat
  deltas** — Offensive = +attack, Defensive = +DR/+plating, Tanking = +maxHp/+plating, Evasive =
  +evasion (evasion already routes through `evasionChance` → `evasionDodgeRate`). So the active stance
  folds in with **one new block** in this function; no new combat listener needed for v1.
- The server already has a recalc entry point that equip/unequip/level-up use
  (`server/src/systems/player/progression/stats.ts`); the switch system calls the same path.

### T2 recipe gating (the Cores precedent — no new field)
- Recipe gating supports T2 via **biome-level band placement**: a recipe with `requiredBiomeLevel` in
  the T2 band is tier-gated by `biomeLevelCap()` for free (cores did exactly this). The parallel
  `RuneRecipe` / `AbilityRecipe` shape — `recipeGroup` + `requiredBiomeLevel` (+ `requiredBossClear`
  reserved for boss-signature variants) + essence `cost` + `catalystCost` — is the template for
  `StanceRecipe`. The shared `isAbilityRecipeUnlocked` predicate is the model for
  `isStanceRecipeUnlocked`.

### Panel / protocol / admin plumbing (the Abilities precedent)
- Abilities shipped: `ability:craftRecipe` / `ability:setLoadout` (client→server),
  `ability:craftResult` (server→client) in `socketEvents.ts`; `hudBus` request bridges → intents →
  `net/intents` senders; atoms synced from `PlayerView`; a dedicated `AbilitiesPanel.tsx` wired into
  the desktop sidebar (`MenuButtons`), Escape handling (`overlayStack`), and the mobile "More" sheet;
  `AdminCharacterRecord` + `CharactersTab` read-only surfacing. Stances clone this surface 1:1.

## Net-new (what Step 10 actually builds)

1. `shared/src/stances.ts` — static catalog: `StanceDef` (statEffects + mechanicEffects), `StanceSlot`
   (`default` | `reactive`), `STANCE_DATABASE`, `stanceDef()`, `validStanceIds()`, `emptyEquippedStances()`.
2. `shared/src/stanceRecipes.ts` — `StanceRecipe`, `STANCE_RECIPE_DATABASE`, `isStanceRecipeUnlocked()`,
   `validateStanceRecipes()`.
3. Three fields on `TracksProgression`: `knownStances: string[]`, `equippedStances: { default, reactive }`,
   `activeStance: string | null` (runtime which-posture-is-applied; networked so the client shows it,
   defaulted on attach).
4. Rune catalog: `STANCE` channel + `switch-stance` action (+ derived `switchStance` flag +
   `RUNE_SWITCH_STANCE_FLAG` stamp).
5. Server: `stanceSwitch.ts` per-tick system (default↔reactive, anti-thrash cooldown, **recalc on
   switch**); `stanceCrafting.ts` (`craftStanceRecipe`, `setStanceLoadout`); the **one new block in
   `stats.ts`** that folds the active stance.
6. Protocol + client panel + admin surfacing (clone Abilities).
7. Worked content: 2–3 placeholder stances in a T2-band biome + the default/reactive switch path.

## Naming check
- "Core" was freed for Step 9; "Stance" is unused in player code. No collision (the monster
  ranged/melee flip in `bestiaryMechanics.ts` is server monster AI, a different namespace). ✅
