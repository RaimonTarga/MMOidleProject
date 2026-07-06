# Cores — Current State (audited 2026-06-23)

Companion to `docs/archive/cores-plan.md`. Captures what exists in code **before** Step 9, so the
plan can lean on existing seams instead of inventing them.

## TL;DR

There is **no core system**. But almost all of the *plumbing* a 5th equipment slot needs is
already generic over `EQUIPMENT_SLOTS`, so adding `'core'` ripples for free through equip,
persistence, networked state, and most UI. The only genuinely new mechanic is **range-gating**
(full effect only when the player's `selectedRange` matches the core's range tag). `selectedRange`
already exists and is already mechanical (drives combat AI), so cores *read* it, they don't invent it.

## What already exists (reuse, don't rebuild)

### Range
- `usesSkills.selectedRange: string | null` (`'close' | 'mid' | 'far'`) — chosen at talent-tree
  tier 2, stored on the networked `UsesSkills` slice (`shared/src/components/core/networkedSlices.ts:267`).
- It is **already mechanical**: `isRangedAutoPlayer` → `isRangedCombatant({ selectedRange, … })`
  drives kiting vs. melee positioning in `server/src/systems/combat/ai/targetPriority.ts:623`.
- ⇒ Cores hook into this; range is not new.

### Equipment slot machinery (generic over `EQUIPMENT_SLOTS`)
- `EquipmentSlot` / `EQUIPMENT_SLOTS` / `EquipmentMap` / `emptyEquipment()` — `shared/src/items.ts:51-62`.
  4 slots today: `weapon | armor | recovery | mobility`.
- **Equip/unequip is fully slot-generic** — `server/src/systems/player/economy/inventory.ts`
  reads `def.slot` and writes `equipment[slot]`; no per-slot branching. Adding a slot needs **zero**
  changes here.
- **Stat application is a loop over `EQUIPMENT_SLOTS`** — `shared/src/systems/stats.ts:160-184`
  applies each equipped item's `statModifiers` + `mechanicEffects` (and upgrade-step deltas)
  uniformly. **This is the one place that must learn about range-gating** (skip a directional core
  whose tag ≠ `selectedRange`).
- **Persistence is automatic** — `server/src/db/playerRepo.ts:177-180` hydrates equipment as
  `{ ...emptyEquipment(), ...stored }`, so old rows get `core: null` for free; the whole-slice
  JSON write persists it. No migration.
- **Networked state is automatic** — equipment is a nested object inside the already-networked
  `HoldsInventory` slice; `NETWORKED_PLAYER_KEYS` gates top-level slice keys, not nested map keys.
  No allowlist change.

### Recipes → items
- `ITEM_DATABASE` is derived from `RECIPE_DATABASE` (`shared/src/itemDatabase.ts`); a core is just a
  recipe with `slot: 'core'`. Any new recipe field (e.g. `rangeTag`) must be **carried through** this
  mapping.
- Recipe gating already supports exactly what Step 9 wants: `requiredBiomeLevel` (per `recipeGroup`)
  is tier-gated by `biomeLevelCap()`, so placing a recipe in the **T2 level band gives T2-gating with
  no new field**. `requiredBossClear` channel is also available (Step 5 reserved it for advanced unlocks).
- Per-biome recipe files live in `shared/src/data/recipes/<biome>.recipes.ts`, aggregated in `index.ts`.

### Rank-up machinery (Step 6 evolution — reuse for core ranks)
- `shared/src/systems/evolution.ts`: `checkEvolve` / `checkReconstruct`, `isEvolvedRecipe`, with
  `lineageId` / `evolvesFrom` / `reconstructCost` on `Recipe`. Server applies it in
  `server/src/systems/player/economy/itemEvolution.ts` (`evolveItem` consumes the predecessor, grants
  the successor); `ForgeTab` already renders Evolve/Reconstruct buttons for evolved recipes.
- ⚠️ **One mismatch:** `checkEvolve` hardcodes `EVOLUTION_REQUIRED_PLUS = 3` (consume a **+3**
  predecessor). Cores are **not** on the `+N` upgrade track, so core rank-up must use **required-plus 0**
  (own the predecessor rank, no upgrading). The plan parameterizes this by slot.

### Forge / inventory UI (mostly generic)
- `EquipmentSlots.tsx` maps over `EQUIPMENT_SLOTS` and labels via `SLOT_LABELS` — auto-renders `core`
  once a label exists.
- `ForgeTab.tsx` filters/labels by slot; it has a **hardcoded slot list** at line ~150
  (`['weapon','armor','recovery','mobility']`) + `SLOT_LABELS`/`SLOT_ABBR` in `crafting/common.ts`.

## Net-new (what Step 9 actually builds)

1. `'core'` added to `EQUIPMENT_SLOTS` / `emptyEquipment()` / `EquipmentMap`.
2. A `rangeTag` axis on cores (`close | mid | far | universal | party`) on `Recipe` + `ItemDefinition`,
   carried through `ITEM_DATABASE`.
3. **Range-gating** in the `stats.ts` equipment loop + a shared `coreIsActive(rangeTag, selectedRange)`
   helper for both the gate and the UI active/inactive indicator.
4. Core rank-up via the evolution machinery with **required-plus 0** for the `core` slot.
5. T2-band core recipes (biome-level placement) — worked content: one Close, one Far, one Mid, one Universal.
6. The handful of **literal `EquipmentMap` / `Record<EquipmentSlot,…>` sites** that won't compile until
   they gain a `core` entry (see plan "Mechanical fixups").

## Naming check
- "Core" the *word* was freed by Step 8 — the old `"X Core"` charm items were renamed (slot key stayed
  `recovery`). The 5th-slot `core` system is now unambiguous. ✅
