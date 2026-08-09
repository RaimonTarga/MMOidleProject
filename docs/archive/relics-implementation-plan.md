> **ARCHIVED — implemented 2026-08-04; live state in `docs/relics-current-state.md`.**

# Relic System Implementation Plan

**Status:** implemented and archived.  
**Design authority:** `design_docs/relics-design.md`.  
**Source audit:** `docs/archive/briefs/d2-relics-seam-audit.md` (verified 2026-08-02).

## Outcome

Ship one universal Relic equipment slot, unlocked at live `playerTier: 4`, with
eight mastery-gated base recipes. An equipped relic's
four generic ratings resolve into concrete changes for the player's active root
mechanic. Relics persist and network through the existing inventory slice, use
named `+0` evolution lineages, have character-specific tooltip previews, and
scale only explicitly registered mechanic-origin buffs and debuffs.

## Architecture verdict

The equipment path is the lowest-cost state model and is already proven by
Cores:

- `HoldsInventory.equipment` is persisted and networked as one existing slice.
- Hydration spreads stored equipment over `emptyEquipment()`, so old characters
  automatically receive `relic: null`; no SQL migration is required.
- Equip/unequip, bag displacement, stat recalculation, and archetype slice sync
  are slot-generic.
- Recipes already gate on `recipeGroup` plus `requiredBiomeLevel`.
- Item evolution already supports named predecessor chains and reconstruction.

The genuinely new system is not storage. It is a shared universal resolver,
the DoT exception to current normalization, mechanic-origin effect scaling, and
resolved UI presentation.

## Known source constraints

1. `EquipmentSlot`, `EQUIPMENT_SLOTS`, and `emptyEquipment()` currently stop at
   `core` (`shared/src/items.ts`).
2. `getMaxUpgrade()` and `requiredPlusFor()` special-case only `core`; Relic must
   join those evolution-only rules.
3. Cadence threshold recalculates before equipment effects fold into passives
   (`shared/src/systems/stats.ts`), so item-driven threshold changes are currently
   dead. Move the callback after the equipment fold.
4. DoT damage per stack currently divides by effective max stacks and multiplies
   by effective tick interval (`shared/src/systems/dotClassProfile.ts`), making
   both proposed relic axes DPS-neutral.
5. `energy.max-bonus` is a per-tier bonus, not a generic flat max-energy seam.
   The Relic resolver should transform the resolved profile rather than misuse
   that key.
6. Summoner count and respawn are live-reconciled from passives. Keep Relic
   integration on those stable passive/read seams because Summoner has a separate
   rework pending.
7. `applyPlayerDebuff()` and `SCALABLE_DEBUFFS` already provide an explicit
   registry pattern. No equivalent mechanic-buff funnel exists yet.
8. Status-effect `data` is numbers-only. Origin must be expressed by an explicit
   application API/registry, not a free-form string stuffed into effect data.
9. Client equipment rendering iterates `EQUIPMENT_SLOTS`, but labels and several
   item-detail paths have hardcoded slot/effect presentation.
10. Tier vocabulary is not uniform across every subsystem. Define and test one
    `RELIC_UNLOCK_PLAYER_TIER` policy instead of comparing ad hoc recipe, skill,
    region, and display tier numbers.

## Proposed shared contract

Add four passive keys in a dedicated `RELIC_KEYS` namespace:

```ts
'relic.mechanic-frequency'
'relic.mechanic-potency'
'relic.mechanic-buff-effect'
'relic.mechanic-debuff-effect'
```

Values are signed decimal ratings (`0.35` = `+35%`). Recipes author only these
keys in `mechanicEffects`; they do not author six sets of archetype keys.

Add `shared/src/systems/relics.ts` as the single pure source of truth for:

- `RELIC_UNLOCK_PLAYER_TIER`;
- rating clamps and per-archetype coefficients;
- interval, gain, multiplier-bonus, and discrete-count primitives;
- per-archetype resolved profile types;
- before/after values used by both server consumers and client descriptions;
- safety floors and one-time rounding.

Do not pre-expand a relic into permanent class-specific passives. Each archetype
adapter resolves its existing pre-relic profile through the shared helper. This
keeps the equipped item universal, lets class reset reinterpret it immediately,
and gives the UI the same calculation used by combat.

## Phase A — Equipment and authoring foundation

### A1. Add the slot

Update:

- `shared/src/items.ts`
  - add `'relic'` to `EquipmentSlot` and `EQUIPMENT_SLOTS`;
  - add `relic: null` to `emptyEquipment()`.
- `client/src/ui/inventory/constants.ts`
  - add the `Relic` slot label.
- any exhaustive `Record<EquipmentSlot, …>` revealed by typecheck, including
  upgrade and UI maps.

Expected reuse with no bespoke persistence/protocol work:

- `server/src/systems/player/economy/inventory.ts`;
- `server/src/db/playerRepo.ts` hydration/pruning;
- `shared/src/protocol` inventory views;
- `client/src/ui/inventory/EquipmentSlots.tsx` iteration.

Add a hydration regression test proving an old equipment object without
`relic` normalizes to `relic: null`.

### A2. Make Relics evolution-only

Update:

- `shared/src/systems/itemUpgrades.ts`: `getMaxUpgrade()` returns `0` for
  `relic`, and the exhaustive upgrade-stat map handles the slot without
  inventing a primary stat.
- `shared/src/systems/evolution.ts`: `requiredPlusFor()` returns `0` for
  `relic`, matching Core rank-up ownership semantics.
- authoring validation: Relic recipes must have no `stats`, no `upgrades`, and
  only approved `relic.*` mechanic keys.

Add pure tests for max upgrade zero and predecessor-at-`+0` evolution.

### A3. Establish unlock policy

Add a named shared helper/constant for live `playerTier: 4`.

- Base relic recipes use mastery requirements inside the correct T4 band for
  their `recipeGroup`.
- Server equip authority rejects a Relic before the unlock tier even if an
  admin or stale test fixture puts one in the bag.
- Forge and inventory use the same shared policy for locked presentation.
- Test below-tier, exact-tier, test-room, and evolved-recipe cases.

The implementation must verify the current recipe `tier` convention rather than
assuming it is the same numeric domain as the zero-based progression index.

## Phase B — Universal resolver

### B1. Add keys and pure primitives

Add `RELIC_KEYS` to `shared/src/passives.ts` and include it in the master passive
key union/validation.

Implement pure primitives with explicit clamps:

- `resolveRelicInterval(baseMs, frequency, coefficient, floorMs)`;
- `resolveRelicGain(base, frequency, coefficient, floor)`;
- `resolveRelicBonusMultiplier(baseMultiplier, potency, coefficient)`;
- `resolveRelicCount(base, potency, coefficient, floor, cap?)`.

Negative ratings must remain legal within a global safe clamp. A denominator
must never reach zero. Tests cover positive, negative, zero, floor, cap, and
rounding behavior.

### B2. Resolve each root profile

Build named adapters rather than a single untyped switch result:

| Adapter | Inputs before Relic | Outputs after Relic |
|---|---|---|
| Cadence | threshold, empowered multiplier | integer threshold, multiplier |
| Cooldown | execution cooldown, empowered multiplier | cooldown ms, multiplier |
| Reload | reload duration, ammo max | duration ms, integer ammo max |
| DoT | tick interval, max stacks, damage reference profile | interval, integer cap, unchanged per-stack reference |
| Energy | energy per hit, max energy, discharge multiplier | gain, integer max, proportional multiplier |
| Summoner | respawn duration, summon cap | duration ms, integer summon cap |

Class coefficients are centralized data with comments explaining the balance
unit. The same helpers must be exportable for tooltip composition and benches.

### B3. Integrate consumers

Cadence:

- move cadence threshold reset after the equipment fold in
  `shared/src/systems/stats.ts`;
- resolve threshold and multiplier after all non-Relic class modifiers;
- update `shared/src/systems/empoweredMult.ts` so HUD and combat agree.

Cooldown:

- resolve cooldown at initialization, percentage-mirror calculation, and
  restart through one helper;
- resolve empowered multiplier through the shared bonus-portion rule;
- clamp every interval read.

Reload:

- resolve `ammoMax` in the existing per-tick reconciliation;
- resolve reload duration in `reloadLifecycle.ts` after specialization/passive
  changes;
- verify small-clip, Blunderbuss, Sniper, Momentum, Laser, and Cannon behavior.

DoT:

- separate the pre-relic damage-reference profile from the effective delivery
  profile in `shared/src/systems/dotClassProfile.ts`;
- calculate damage per stack from pre-relic tick/max values;
- apply effective tick interval and max stacks to runtime status state;
- keep the `AppliesDots` HUD mirror authoritative and update its presentation if
  it exposes these values.

Energy:

- resolve the current `resolveEnergyMax()` result rather than treating
  `energy.max-bonus` as a flat Relic key;
- apply frequency to gain per successful qualifying attack;
- scale discharge bonus from the effective/pre-relic max-energy ratio;
- reconcile current energy safely if equipping a negative-potency relic lowers
  the cap.

Summoner:

- feed effective count and respawn time into existing live reconciliation;
- do not write `SummonsMinions` fields directly from the item system;
- verify excess minions despawn deterministically and timer progress remains
  valid across equip/unequip.

## Phase C — Mechanic-origin buff and debuff scaling

### C1. Define explicit registries

Add shared registries modeled on `SCALABLE_DEBUFFS`:

- `SCALABLE_MECHANIC_BUFFS`;
- `SCALABLE_MECHANIC_DEBUFFS`.

Each entry identifies the effect id, allowed magnitude fields, and field shape
(`fraction`, `multiplier`, flat value, or damage-per-stack). Duration,
`maxStacks`, timing fields, and trigger conditions are never implicitly scaled.

Audit every archetype and specialization call site before freezing the initial
registry. Main DoT damage-per-stack is eligible only through an explicit entry.
Healing, shielding, and recovery are excluded in v1. Defensive fields remain
excluded unless separately reviewed against budget separation.

### C2. Tag origin at application

Extend the player-debuff funnel with an option such as:

```ts
applyPlayerDebuff(player, target, config, { origin: 'mechanic' })
```

Existing Core scaling continues for all approved player debuffs. Relic debuff
scaling applies only when `origin === 'mechanic'` and the effect/field appears in
the mechanic registry. Ability and weapon call sites omit the origin.

Create an equivalent `applyPlayerMechanicBuff()` funnel for registered
archetype-generated self buffs. Do not add string origin data to
`StatusEffect.data`.

### C3. Migrate approved class call sites

Walk all six archetype trees, including `t3/core/buffs.ts` and pipeline paths,
and route only approved mechanic-origin effects through the new funnels.

Tests must prove:

- registered mechanic buffs/debuffs scale magnitude;
- duration and max stacks do not change;
- an identical id without mechanic origin does not receive Relic scaling;
- ability, weapon, monster, and ally effects do not receive it;
- Controller Core and Relic scaling compose correctly;
- multiplier-shaped fields scale only their excess above `1`;
- a negative secondary rating remains safe if later content authors one.

## Phase D — Base content and acquisition

Author the eight recipes in their existing biome-owned recipe modules:

| Biome module | Relic |
|---|---|
| `forest.recipes.ts` | Hastebound Dial |
| `mountain.recipes.ts` | Colossus Heart |
| `plains.recipes.ts` | Equilibrium Shard |
| `jungle.recipes.ts` | Verdant Flywheel |
| `tundra.recipes.ts` | Glacial Bell |
| `swamp.recipes.ts` | Virulent Hourglass |
| `desert.recipes.ts` | Withering Lens |
| `graveyard.recipes.ts` | Haunted Prism |

For each recipe:

- `slot: 'relic'`;
- no ordinary stats or upgrade steps;
- only four approved `relic.*` values;
- `tier` and `requiredBiomeLevel` tested to be unreachable before the Relic
  unlock and reachable in the intended biome's T4 mastery band;
- biome/family catalyst cost following existing economy conventions;
- `lineageId` ready for later evolution;
- description states the trade without trying to list all six class mappings.

Cave, Volcanic, and Trench intentionally receive no placeholder relic.

Use existing placeholder icon behavior or approved source art only. Do not edit
packed atlases by hand; a dedicated art pass must follow the PixelLab pipeline.

Add an authoring test that enumerates all Relic recipes and enforces the slot,
key, tier, mastery, upgrade, and lineage invariants.

## Phase E — Client presentation

### E1. Equipment and forge

- Add the Relic label and locked/unlocked socket treatment.
- Keep one slot permanently; no slot-count function.
- Ensure generic equip, unequip, forge, evolution, reconstruction, and inventory
  focus behavior accept the sixth slot.
- Hide or disable ordinary Upgrade actions for Relics; show Evolve/Reconstruct
  for evolved recipes.

### E2. Universal and resolved descriptions

Teach the existing item description layer about the four `relic.*` keys.

Relic details show:

1. signed universal ratings;
2. current root-class name;
3. exact before/after threshold, interval, gain, capacity, count, and multiplier
   values produced by the shared resolver;
4. an unavailable state when no root is selected or Summoner is disabled.

Use a shared view composer rather than duplicating formulas in React. Add pure
presentation tests for all six roots and for positive/negative trade-offs.

### E3. Mastery visibility

Locked-recipe surfaces should make the biome reward legible without exposing
relics a full tier early. Verify Forge, Map node recipe summaries, Mastery, and
any staged system-visibility rules use the same unlock policy.

## Phase F — Verification and balance instrumentation

### Required automated checks

- `pnpm typecheck`.
- `pnpm test`.
- Pure resolver suite: six roots × positive/negative/zero/floor/rounding cases.
- Equipment wiring smoke test: equip each base Relic, tick a real `World`, and
  assert an observable mechanic invariant.
- Persistence hydration test for `relic: null` on old equipment JSON.
- Recipe-gating and authoring-invariant tests.
- DoT regression proving frequency raises tick delivery and potency raises the
  sustained stack ceiling without reducing per-tick/per-stack damage.
- Mechanic-origin registry tests.
- Evolution-at-`+0` and no-Upgrade tests.
- HUD/server parity tests for empowered multipliers and resolved Relic previews.

### Bench matrix

Extend the balance bench to report each base Relic against:

- all six root baselines;
- light/balanced/heavy frames;
- Reload small/large magazine extremes;
- Cadence ramping specs;
- short and sustained DoT fights;
- Summoner count/respawn breakpoints;
- every mechanic buff/debuff registry entry;
- frequency × potency interactions on compounding specializations.

Do not tune the universal ratings by intuition alone. The resolver coefficients,
not the item ids, are the main cross-class balance knobs.

## Suggested implementation sequence

1. Phase A: slot, evolution-only rules, and unlock authority.
2. Phase B1–B2: pure resolver and exhaustive unit tests.
3. Phase B3: integrate one archetype at a time, starting with Cooldown, then
   Cadence, Reload, Energy, DoT, and Summoner.
4. Phase C: mechanic-origin registries and migrated effect call sites.
5. Phase D: author the eight recipes only after all six adapters work.
6. Phase E: resolved presentation and mastery visibility.
7. Phase F: full tests, benches, and a user-owned balance pass.

Cooldown is the best pilot because both outputs are continuous and already
passive-driven. Cadence follows to force the recalc-order fix. DoT and Summoner
come last because they have the most consequential formula/discrete behavior.

## Deferred decisions and content

The system can be implemented without deciding:

- final numeric coefficients and interval floors;
- exact essence/catalyst costs;
- exact mastery level inside each biome's T4 band;
- final icon art;
- T5/T6 evolution names, numbers, and branches;
- distinct Cave, Volcanic, or Trench relic lines;
- defensive mechanic-buff eligibility.

These are explicit balance/content follow-ups, not permission for an implementer
to invent additional system rules.

## Documentation closeout after shipping

When implementation is complete:

1. create `docs/relics-current-state.md` as the living source-backed truth;
2. archive this plan under `docs/archive/` with an implemented header;
3. update `docs/system-rework-status.md` and `docs/next-playtest-roadmap.md`;
4. mark `docs/archive/briefs/d2-relics.md` fulfilled and point it to the current-state
   document;
5. keep `design_docs/relics-design.md` as design intent unless later decisions supersede
   it.
