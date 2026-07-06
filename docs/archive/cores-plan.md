> **ARCHIVED (2026-07-07) — HISTORICAL.** Implemented; live state in `docs/cores-current-state.md`. Kept for design rationale — do not treat as current.

# Cores — Implementation Plan (Step 9)

Companion to `docs/cores-current-state.md`. Roadmap: `docs/system-rework-roadmap.md` §Step 9.

> **Addendum (post-implementation, 2026-06-24): cores are a MULTIPLIER slot.** After the initial
> build (flat stat adds), the user chose to make cores apply **percentage multipliers** on overall
> stats plus a **separate multiplicative DR layer**. The slot/range-gating/rank machinery below is
> unchanged; only the *effect representation* changed: cores now carry `core.*-mult` mechanicEffects
> (summed, applied once in a new core-multiplier pass in `recalculatePlayerStats`) and
> `core.dr-layer-pct` (a second multiplicative DR layer in `runMonsterAttack`, `base×(1−DR)×(1−layer)`,
> clamped 0.9). hpRegen multiplies directly; %-based heals/shields scale via the maxHp multiplier; a
> dedicated flat-burst recovery multiplier is deferred. See the status doc §9 + session log for detail.

**Goal:** a 5th equipment slot, `core` — a **role/range amplifier**. Its job is to fix
ranged-safety dominance and make melee/bruiser/tank durable by tying a meaningful power package to
the player's committed range. A Close/Mid/Far core gives its **full effect only when its range tag
matches `selectedRange`**; Universal cores are weaker-but-always-on; Party cores are role-flavored.

**Scope discipline (matches every prior rework step):** build the **machinery + a worked example
set**; the user authors the rest of the content and tunes all numbers. No balance tuning here.

## Resolved design decisions (Q&A 2026-06-23)

| Decision | Choice |
|---|---|
| **Range mismatch** | **Off entirely.** A directional (Close/Mid/Far) core contributes *nothing* unless `selectedRange` matches. Universal/Party always apply. |
| **Rank model (1/2/3)** | **Recipe rank-up chain**, reusing Step 6 evolution machinery (`evolvesFrom`). Cores stay **off** the `+1..+5` upgrade track entirely. |
| **T2 gating** | **Biome-level placement.** Core recipes sit in the T2 level band; `biomeLevelCap()` already tier-gates them. No new field. |
| **Worked content** | **One per range band:** a Close core, a Far core, a Mid core (exercising the three directional gates) + one Universal. |

## Data model

### Range tag (new axis)
```ts
export type CoreRange = 'close' | 'mid' | 'far' | 'universal' | 'party';
```
- Add `rangeTag?: CoreRange` to `Recipe` (`shared/src/data/recipes/types.ts`) and `ItemDefinition`
  (`shared/src/items.ts`); carry it through `ITEM_DATABASE` (`shared/src/itemDatabase.ts`).
- `'party'` is **role-flavored, mechanically always-on** in v1 (treated like `universal` for gating;
  the role distinction is content, not a new mechanic). Cross-range party roles can deepen later.

### The slot
- Add `'core'` to `EQUIPMENT_SLOTS`, `EquipmentMap`, and `emptyEquipment()` (`shared/src/items.ts`).
  Everything generic over `EQUIPMENT_SLOTS` (equip, persistence, networking, `EquipmentSlots.tsx`)
  follows for free.

### Range-gating resolution (the one real mechanic)
- Shared helper (single authority, used by both stats and UI):
  ```ts
  // shared/src/systems/cores.ts (new)
  export function coreIsActive(rangeTag: CoreRange | undefined, selectedRange: string | null): boolean {
    if (!rangeTag || rangeTag === 'universal' || rangeTag === 'party') return true;
    return rangeTag === selectedRange;        // close/mid/far → full effect only on match
  }
  ```
- In `shared/src/systems/stats.ts` equipment loop (~line 160): when `slot === 'core'`, look up the
  def's `rangeTag` and `continue` (skip `statModifiers` **and** `mechanicEffects`) if
  `!coreIsActive(rangeTag, p.usesSkills.selectedRange)`. Directional, mismatched ⇒ the core does nothing.
  (Cores have no `upgrades`, so the upgrade-step block is naturally a no-op for them.)

### Ranks via evolution machinery (required-plus 0)
- Core ranks are a `lineageId` chain: rank2 `evolvesFrom` rank1, rank3 `evolvesFrom` rank2 — using the
  existing `Recipe.lineageId/evolvesFrom/reconstructCost` fields and `ForgeTab`'s Evolve/Reconstruct UI.
- **Relax the +3 gate per slot:** parameterize the required predecessor level in
  `shared/src/systems/evolution.ts` — `requiredPlusFor(recipe) = recipe.slot === 'core' ? 0 : EVOLUTION_REQUIRED_PLUS`.
  `checkEvolve` uses it so core rank-up only requires *owning* the predecessor rank (no upgrading).
  `itemEvolution.ts` already consumes the predecessor + grants the successor — works unchanged once the
  gate is relaxed.
- Rank effects per the brainstorm: R1 base identity · R2 improved budget · R3 signature hook improves
  (numbers = user pass).

## Build phases

### Phase A — shared foundation
- `CoreRange` type; `rangeTag` on `Recipe` + `ItemDefinition`; carry through `ITEM_DATABASE`.
- `'core'` in `EQUIPMENT_SLOTS` / `EquipmentMap` / `emptyEquipment()`.
- New `shared/src/systems/cores.ts` with `coreIsActive`.
- Range-gating branch in `stats.ts`.
- `requiredPlusFor()` in `evolution.ts`; `checkEvolve` honors it.
- **Mechanical fixups** (typecheck will flag): add a `core` entry to the literal/`Record<EquipmentSlot,…>`
  maps — `shared/src/protocol/views.ts:215` (`EMPTY_EQUIPMENT`), `shared/src/systems/itemUpgrades.ts`
  (`UPGRADE_STAT_BY_SLOT`, `BONUS_PER_LEVEL` — placeholder/no-op entries; cores don't use generic
  upgrades), `client/src/hud/atoms.ts:39`, `client/src/ui/inventory/constants.ts` (`SLOT_LABELS`),
  `client/src/ui/crafting/common.ts` (`SLOT_LABELS`/`SLOT_ABBR`), and any bench/test fixture literals
  (`server/bench/balance/progression.ts`, `botFactory.ts`, `harness.ts`, test files).

### Phase B — server authority
- Confirm equip/unequip needs **no change** (slot-generic). Confirm `craftRecipe` (rank-1 cores) and
  `itemEvolution.evolveItem` (rank-up cores) both work with `slot: 'core'`.
- No new combat listener: cores apply through the stat rebuild → **no `initCombatSystems()` change**.
  (Signature hooks that need runtime combat behavior are deferred content; flag if a worked core needs one.)

### Phase C — client / UI
- `core` slot label in inventory + forge (`SLOT_LABELS`/`SLOT_ABBR`); add `'core'` to `ForgeTab`'s
  hardcoded slot-filter list.
- Surface the **active/inactive** state: in `EquipmentSlots`/`StatSheet`, when a directional core is
  equipped but `!coreIsActive(...)`, show it dimmed with a "needs Close/Mid/Far range" hint (uses the
  shared helper so client and server agree).
- Show `rangeTag` on the core's tooltip/forge card.

### Phase D — worked content
- One core per band in a starter biome, T2-band `requiredBiomeLevel`, placeholder numbers, using
  **existing** `statModifiers`/`mechanicEffects` only (no new combat hooks):
  - **Bastion (Close):** +maxHp / +plating / +DR — durability under melee risk.
  - **Sniper (Far):** +attack / +onHitDamage with a downside (e.g. −maxHp) — ranged identity + tradeoff.
  - **Arcanist (Mid):** −attackCooldown (cadence/skill tempo) — gives mid a reason.
  - **Universal:** a small mixed package, always-on, demonstrably weaker than a matched directional core.
- Author at least one **rank chain** (R1→R2) on one core to exercise the evolution path with required-plus 0.

### Phase E — verify (cross-cutting checklist)
- 4-package `pnpm typecheck`.
- Both server tests (`targetPriority`, `runeMaintenance`) — rebuild `shared` dist first.
- A combat bench (`autoCombatSameNode`) for no-regression from the stats-loop branch.
- Sanity: equip a directional core, flip `selectedRange`, confirm stats turn on/off; Universal stays on;
  rank-up consumes predecessor at +0.

## Cross-cutting concerns (per roadmap checklist)
- **Persistence/migration:** none — equipment hydrate spreads `emptyEquipment()`; old rows get `core: null`.
- **Networked allowlist/invariants:** none — `core` is a nested key in the already-networked equipment map.
- **Protocol/PlayerView:** `EMPTY_EQUIPMENT` default gains `core`; `rangeTag` rides `ITEM_DATABASE`
  (client already has the item DB). No new view field strictly required; add a core-active flag only if UI needs it server-computed (prefer client-side via `coreIsActive`).
- **Admin:** grant-item uses `ITEM_DATABASE` → cores auto-grantable; equipment map view auto-shows `core`.
  Verify the admin character view renders the 5th slot; add a label if it hardcodes 4.
- **combatBootstrap parity:** unaffected (no new listener).
- **Rune-action catalog:** unaffected (cores add no rune action — that's Steps 7/10).

## Deferred (not this step)
- Signature core hooks that need new combat behavior (threat control, target stickiness, kill-chain
  movement, charged-attack windows) — new `mechanicEffects` keys + combat hooks, authored per-core later.
- T3 range-specific evolution & T4+ morphs (the deeper unlock ramp) — machinery supports it via the
  lineage chain; content later.
- Cross-range Party-role mechanics beyond v1's always-on treatment.
- All numbers (stat budgets, rank deltas, recipe costs, which cores cost catalysts, T2 level values).

## Red-team (carry from roadmap)
- *Are melee cores mandatory not interesting?* / *Does mid-range have a real reason?* — worked set must
  make the Close/Mid/Far gate feel like a genuine identity choice, not a tax. Off-entirely mismatch +
  weaker Universal is the lever; numbers are the user's pass.
- *Currency bloat?* — cores reuse essence/catalyst costs; no new currency.
