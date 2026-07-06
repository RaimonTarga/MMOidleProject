> **ARCHIVED (2026-07-07) — HISTORICAL.** Implemented; live state in `docs/abilities-current-state.md`. Kept for design rationale — do not treat as current.

# Step 7 — Abilities — Implementation Plan

Paired with `docs/abilities-current-state.md` (the audit) and `docs/system-rework-roadmap.md`
(Step 7). The new **Abilities** system: two slots — **Technique** (offensive, arm-the-next-attack)
and **Guard** (defensive, immediate self-facing) — with built-in auto-fire and rune override.

## Session scope (locked 2026-06-23 Q&A)

- **System + 1 worked pair.** Build the full Abilities system end-to-end, plus **Sweep** (Technique)
  and **Brace** (Guard) as the two worked examples. User authors the per-biome sets + numbers later.
  (Mirrors Step 6's "machinery + 1 lineage".)
- **Built-in heuristic + rune override.** Each ability fires on a sensible default trigger with
  **zero runes equipped**; new `CONTROL`-channel rune action(s) let players override the timing.
- **Evolution deferred.** Sweep→Whirlwind families and the Step 6 machinery generalization are a
  **follow-up session**. Build base abilities + firing now; design the data so evolution can bolt on.

Working name: **Abilities** (Technique / Guard). Finalize at implementation if a better noun appears.

---

## Design overview

### Two firing shapes (the core model)
1. **Technique = arm the next attack.** Firing sets a typed armed state; the next landed attack
   carries the ability's **rider** (cleave / debuff / execute / DoT-detonate / empower). One-shot,
   consumed on hit. Rides the combat pipeline exactly like the existing empowered-attack mechanic.
2. **Guard = immediate self-facing action.** Firing executes now (brace / shield / heal / cleanse /
   disengage). Not tied to the next attack.

This split is straight from the brainstorm ("most offensive skills arm/modify the next attack;
guard skills are separate defensive reactions") and maps cleanly onto existing machinery.

### `hasArmedAbility` — sibling to `hasEmpoweredAttack` (key technical decision)
Abilities do **not** hijack `hasEmpoweredAttack` (class mechanics own it — collision risk). Instead a
new server-only component:
```ts
hasArmedAbility?: { abilityId: string }   // attach on Technique fire, consume on hit
```
A combat listener (registered in `initCombatSystems`) reads it at the right phase, applies the
ability's rider, and consumes it (mirroring `consumeEmpoweredAttack`, incl. the chaotic-miss rule:
do not consume on a whiff). An ability whose rider *is* "empower" can additionally call
`setEmpoweredAttack` — the two stay decoupled.

> **Cross-archetype validation.** Because the rider rides `onHit`/`onAttack` like empowered already
> does, archetype-specific attack math (reload half-damage/double-speed final layer, summoner minion
> attacks, energy Flash, DoT conversion) is handled the same way empowered already handles it.
> Phase E explicitly sanity-checks Sweep against all 6 archetypes.

### Firing control: built-in heuristic, runes refine
- **Built-in trigger** (per ability, evaluated each tick by a new firing system), gated by a
  per-ability cooldown on `tracksCombat`:
  - *Technique default:* arm when **in combat with a live target AND off cooldown** → next swing
    carries the rider.
  - *Guard default:* fire when a **threat threshold** is met (HP below the ability's threshold, or
    N-aggro) AND off cooldown.
- **Rune override:** new `CONTROL` rune action(s) `fire-technique` / `fire-guard`. When equipped, the
  rune's condition drives firing and **suppresses the built-in trigger** for that slot (rune refines).
  Implemented like `taunt-current-target`: derive a flag in `runeConfig.ts` + `deriveAutoConfigFromRunes`,
  read it in the firing system. RP-costed. Extends the shared rune-action catalog (coordinate per roadmap).

### Acquisition / equip model (mirrors runes + the specced stances)
- **Ability recipes** (parallel `AbilityRecipe`, like `RuneRecipe`) gate on `recipeGroup` +
  `requiredBiomeLevel` (Biome Mastery), optional `requiredBossClear`, with essence + catalyst cost.
- Crafting an ability recipe = **learn it permanently** → id added to `knownAbilities`.
- **Free slotting** from the known pool into `techniqueSlot` / `guardSlot` (no cost to swap).
- **Mobility is a tag**, not a slot: `tags: ['mobility']` on the ability def. No mobility slot.

### Data shapes (shared)
```ts
// component (networked + persisted)
interface UsesAbilities {
  knownAbilities: string[];       // learned (crafted) pool
  techniqueSlot: string | null;   // equipped Technique id
  guardSlot: string | null;       // equipped Guard id
}
function emptyAbilities(): UsesAbilities  // { knownAbilities: [], technique/guard: null }

// static definition
type AbilitySlot = 'technique' | 'guard';
type AbilityTag = 'mobility';     // taxonomy grows as content lands
interface AbilityDef {
  id: string; name: string; slot: AbilitySlot; tags: AbilityTag[];
  blurb: string; cooldownMs: number;
  trigger: AbilityTrigger;        // built-in heuristic descriptor (threat threshold / in-combat)
  effect: AbilityEffectSpec;      // rider (Technique) or immediate effect (Guard)
  icon?: string;
}

// recipe (parallel to RuneRecipe)
interface AbilityRecipe {
  abilityId: string; recipeGroup: string; requiredBiomeLevel: number;
  requiredBossClear?: string;
  cost: Partial<Record<EssenceType, number>>;
  catalystCost?: Partial<Record<string, number>>;
}
function isAbilityRecipeUnlocked(recipe, { biomeLevel, bossesCleared }): boolean
```
`AbilityEffectSpec` for v1 is a small tagged union covering the two worked abilities (cleave-rider,
self-buff) — kept deliberately narrow and extended as content lands, not over-engineered up front.

### The two worked abilities (Phase D, placeholder numbers)
- **Sweep (Technique, forest).** Rider: next attack **cleaves** (AoE splash to nearby enemies).
  Reuses existing AoE/splash machinery (`combat/damage/aoeDamage.ts`). Validates the armed-attack
  shape across archetypes.
- **Brace (Guard, forest).** Immediate: short **damage-reduction buff / small shield**. Reuses
  `StatEffects`/status-effect + shield machinery (defense systems). Validates the immediate shape
  (archetype-agnostic). Default trigger: HP-below-threshold or N-aggro.

---

## Cross-cutting checklist (roadmap — handle every one)
- **Persistence/migration.** `UsesAbilities` persisted like `UsesSkills` (component JSON). Pre-release →
  default `emptyAbilities()` for old rows; rebuild on attach. Decide: fold into existing player JSON.
- **Networked allowlist + invariants.** Add `usesAbilities` to `NETWORKED_PLAYER_KEYS`; pass dev-boot
  marker/network invariants (fix the invariant, not the check).
- **Protocol / `PlayerView`.** Add abilities view fields + composer. New intents:
  `ability:craft`, `ability:equip`, `ability:unequip` (mirror crafting/equip intents). Client atoms + bridge.
- **Admin dashboard.** Surface known/equipped abilities (read) + a grant action (`gameActions.ts`).
- **combatBootstrap parity.** Register the armed-ability rider listener(s) in `initCombatSystems()`.
- **Rune-action catalog.** Add `fire-technique` / `fire-guard`; one owner for the catalog — coordinate
  RP costs/channels with Step 5/10 work.
- **Onboarding (low priority).** Note: a starter Technique/Guard could seed via the starter kit / a
  biome quest so abilities appear early enough to *help solve* a biome. Not built this session.

---

## Phased build (mirrors Steps 1+2 / Step 6 phasing)

**Phase A — Shared foundation.** `UsesAbilities` + `emptyAbilities()`; `AbilityDef` / `AbilitySlot` /
`AbilityTag`; `AbilityEffectSpec` union (narrow); ability database (Sweep, Brace); `AbilityRecipe` +
`isAbilityRecipeUnlocked`; ability recipe entries; add `usesAbilities` to `NETWORKED_PLAYER_KEYS`.
→ typecheck.

**Phase B — Server authority + persistence.** `craftAbility` (biome gate, spend essence/catalyst, add
to `knownAbilities`; test-room top-up); equip/unequip (validate ownership + slot); new firing system
`server/src/systems/player/abilities/abilityFiring.ts` (per-tick triggers + per-ability cooldowns on
`tracksCombat`, rune-override flag check); `abilityEffects.ts` (armed-ability rider listener(s),
registered in `initCombatSystems`); `hasArmedAbility` component on `ServerEntity`; rune-override flag in
`runeConfig.ts` + `deriveAutoConfigFromRunes`; `playerRepo` snapshot/load defaults. → typecheck.

**Phase C — Client/UI.** `PlayerView` + composer carry abilities; client atoms + sync/reset; Abilities
panel (known list + Technique/Guard slot equip); craft surface (Forge tab or new tab); `fire-technique`/
`fire-guard` shown in the rune altar action list; admin read + grant. → typecheck (4 pkgs).

**Phase D — Worked content.** Author **Sweep** (Technique/forest, cleave rider) + **Brace**
(Guard/forest, defense buff) with placeholder numbers, default triggers, and ability recipes
(placeholder `requiredBiomeLevel`/costs).

**Phase E — Verify.** Typecheck 4 pkgs; **rebuild `shared/dist`** before tsx tests; run
`targetPriority` + `runeMaintenance` tests; sanity-check: Sweep arms+cleaves across cadence/cooldown/
energy/reload/dots/summoner; Brace fires on threshold; zero-rune auto-fire works; rune override
suppresses built-in trigger; bench parity (firing listener present in `initCombatSystems`).

---

## Deferred (not this session)
- Ability **evolution** families + Step 6 machinery generalization (follow-up).
- Per-biome ability sets beyond the forest Sweep/Brace pair (user content pass).
- Mobility-tag *movement* effects (Leap Strike etc.) beyond the tag itself.
- Guard-slot expansion (brainstorm: "very cautiously, if at all").
- All numbers/balance (cooldowns, thresholds, costs, rider magnitudes) — user balance pass (Step 15).
- Charm **Guard-amplifier** `guard.*` mechanicEffects (that's Step 8, depends on this shape).

## Red-team checks (from roadmap)
- *Do skills make gear feel irrelevant?* — Technique riders modify attacks (gear still the engine);
  Guard is a timed reaction, not a passive stat. Keep rider magnitudes modest (user tuning).
- *Immortal automation?* — single Guard slot + per-ability cooldown + threshold trigger; do not add a
  second Guard slot this session.
- *Does it work for all 6 archetypes?* — explicit Phase E gate (the flagged risk).
