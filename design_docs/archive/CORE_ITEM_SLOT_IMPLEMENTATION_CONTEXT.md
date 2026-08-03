# MMO Idle: Core Item Slot - Implementation Context

**Repository snapshot:** `feat/ui-info-layer` at commit `d2fa188`  
**Audited:** 2026-08-02  
**Purpose:** Give a separate ChatGPT session enough factual context to theorycraft or redesign the Core item slot without needing the repository.  
**Scope rule:** This document describes current implementation only. It does not recommend balance values, new Core identities, new progression, or new mechanics.

## 1. Executive summary

Core is the fifth normal equipment slot, alongside weapon, armor, recovery, and mobility. It is not represented by its own ECS component and has no dedicated tick system. A Core is an ordinary recipe-derived item whose `slot` is `core` and which may carry a `rangeTag`.

The only Core-specific activation rule is range gating:

- `close`, `mid`, and `far` Cores apply their entire effect only when their tag matches the player's selected range.
- `universal` and `party` Cores are always active in the current implementation.
- An absent `rangeTag` is also treated as active by the shared helper.
- Inactive directional Cores remain equipped but contribute no `statModifiers`, no `mechanicEffects`, and no upgrade deltas.

Core effects are currently authored as passive percentage multipliers on final summed stats. A separate Core damage-reduction key is applied in the server combat pipeline. Cores cannot use the normal `+N` item-upgrade track; higher Core ranks reuse item evolution and require ownership of the predecessor at `+0`.

Most plumbing is generic: equip/unequip, inventory storage, networking, persistence, recipe-to-item conversion, and most UI enumerate the normal equipment structures and therefore include Core automatically.

## 2. Architectural constraints that apply

The game is server-authoritative. The client sends equip, unequip, crafting, and evolution intents; authoritative state and derived stats are decided on the server. Shared code contains cross-boundary data types, static recipes, item definitions, pure checks, and the deterministic stat formula. Server code owns mutation, combat, and persistence. Client code displays the authoritative result and may use the same shared pure helpers for status indicators and button gating.

The Core slot deliberately follows the project's "simple and local" architecture:

- No `HasCore`, `UsesCore`, or equivalent component exists.
- No Core-specific server tick runs.
- Equipment state lives in `HoldsInventory.equipment`.
- Core activation is evaluated during a full stat rebuild.
- Core effects that need combat-time behavior are read from the already-derived `UsesSkills.passives` map.

Primary architecture reference: `design_docs/architecture.md`, especially the Core seam around lines 385-387.

## 3. Data model

### 3.1 Equipment slot

`shared/src/items.ts` defines:

```ts
export type EquipmentSlot =
  | 'weapon'
  | 'armor'
  | 'recovery'
  | 'mobility'
  | 'core';

export const EQUIPMENT_SLOTS: EquipmentSlot[] = [
  'weapon', 'armor', 'recovery', 'mobility', 'core',
];

export type EquipmentMap = Record<EquipmentSlot, string | null>;

export function emptyEquipment(): EquipmentMap {
  return {
    weapon: null,
    armor: null,
    recovery: null,
    mobility: null,
    core: null,
  };
}
```

The equipped value is an item definition ID, not an instance object. Bag inventory is also an array of item definition IDs. Upgrade level is stored separately per item ID in `itemUpgrades`.

### 3.2 Core range taxonomy

`shared/src/items.ts` defines:

```ts
export type CoreRange =
  | 'close'
  | 'mid'
  | 'far'
  | 'universal'
  | 'party';
```

`Recipe.rangeTag?: CoreRange` is declared in `shared/src/data/recipes/types.ts`. The same optional field exists on `ItemDefinition` in `shared/src/items.ts`.

The recipe is the authoring source of truth. `shared/src/itemDatabase.ts` derives `ITEM_DATABASE` from `RECIPE_DATABASE` and copies `rangeTag`, `slot`, stats, mechanic effects, evolution metadata, costs-related identity, icon, description, and other item fields into each `ItemDefinition`.

There is no runtime validation in the type shape that says only Core-slot items may have `rangeTag`, or that every Core must have one. This is expressed by comments and authoring convention. Because `coreIsActive(undefined, selectedRange)` returns `true`, an untagged Core would currently behave as always active.

### 3.3 Player-selected range

The Core gate reads `UsesSkills.selectedRange: string | null`. This is set when a tier-2 range skill is unlocked in `server/src/systems/player/progression/skills.ts`.

Important representation detail: `selectedRange` stores the **full tier-2 skill ID**, such as:

- `cadence-range-close`
- `dot-range-mid`
- `reload-range-far`

It does not store a bare `close`, `mid`, or `far` value.

## 4. Activation rule

`shared/src/systems/cores.ts` is the single shared authority:

```ts
export function coreIsActive(
  rangeTag: CoreRange | undefined,
  selectedRange: string | null,
): boolean {
  if (!rangeTag || rangeTag === 'universal' || rangeTag === 'party') {
    return true;
  }
  return selectedRange?.endsWith(`-range-${rangeTag}`) ?? false;
}

export function isDirectionalCore(
  rangeTag: CoreRange | undefined,
): boolean {
  return rangeTag === 'close'
    || rangeTag === 'mid'
    || rangeTag === 'far';
}
```

Behavior matrix:

| `rangeTag` | `selectedRange` example | Active? |
|---|---|---:|
| `close` | `cadence-range-close` | yes |
| `close` | `cadence-range-far` | no |
| `mid` | `null` | no |
| `far` | `reload-range-far` | yes |
| `universal` | any value or `null` | yes |
| `party` | any value or `null` | yes |
| `undefined` | any value or `null` | yes |

The suffix comparison is class-agnostic: any class's full range-node ID can activate a Core with the corresponding directional tag.

### Recent regression and fix

Directional Cores were previously compared to `selectedRange` using strict equality. Since runtime state holds a full skill ID, every directional Core was permanently inactive in real play even though the server and client indicators agreed with one another. Commit `5e5219d` fixed this on 2026-08-02 by switching to the canonical suffix check. `server/test/coreRangeGate.test.ts` now protects the real representation and explicitly asserts that a bare `close` value must not match.

## 5. Equip, unequip, and range-change lifecycle

### 5.1 Equipping

The socket event is `inventory:equipItem`. `server/src/net/playerHandlers.ts` forwards the item ID to the generic `equipItem` function in `server/src/systems/player/economy/inventory.ts`.

The server:

1. Looks up the ID in `ITEM_DATABASE`.
2. Verifies that one copy is present in the bag.
3. Reads `def.slot`; there is no Core-specific branch.
4. Removes the new item from the bag.
5. Returns any displaced item from that slot to the bag.
6. Writes the new ID to `equipment[slot]`.
7. Recalculates all player stats.
8. Reconciles class/archetype ECS slices.

Equipping a directional Core is allowed even when the player's selected range does not match. The result is an equipped but inactive item.

### 5.2 Unequipping

The socket event is `inventory:unequip`. The generic server function:

1. Reads the current ID from `equipment[slot]`.
2. Sets the slot to `null`.
3. Appends the item ID to the bag.
4. Recalculates all player stats.
5. Reconciles class/archetype slices.

### 5.3 Selecting a range

When the tier-2 range skill is unlocked, the server assigns the full skill ID to `selectedRange` and immediately performs a full stat recalculation. An already-equipped directional Core therefore begins contributing as soon as its range becomes the selected range. Reset paths likewise clear `selectedRange` and recalculate, which disables directional Cores.

## 6. Stat rebuild and effect application

The shared deterministic rebuild is `recalculatePlayerStats` in `shared/src/systems/stats.ts`. The server wrapper is `recalculatePlayerEntityStats` in `server/src/ecs/playerEntityFormulas.ts`.

Relevant sequence:

1. Reset networked combat stats to configured base values.
2. Apply weapon base attack cadence.
3. Apply unlocked skill stats and mechanic effects.
4. Apply stance and rite contributions.
5. Apply other class/range and archetype formula layers.
6. Iterate every value in `EQUIPMENT_SLOTS`.
7. For the `core` slot only, call `coreIsActive`. If false, skip the item completely.
8. Apply active item flat `statModifiers`.
9. Merge active item `mechanicEffects` into `UsesSkills.passives`.
10. Apply normal item upgrade deltas, if any.
11. Apply later class-specific formula layers.
12. Apply the Core final-stat multiplier layer once.
13. Enforce stat floors and clamp current HP to the rebuilt max HP.

The gate occurs before every contribution from the Core item. Therefore an inactive Core contributes neither positive effects nor tradeoffs.

### 6.1 Supported Core passive keys

`shared/src/passives.ts` declares these typed mechanic-effect keys:

| Key | Consumer | Implemented meaning |
|---|---|---|
| `core.attack-mult` | shared stat rebuild | Multiplies final summed attack by `1 + value`; rounded; minimum 1. |
| `core.maxhp-mult` | shared stat rebuild | Multiplies final summed max HP; rounded; minimum 1. |
| `core.plating-mult` | shared stat rebuild | Multiplies final summed plating; rounded; minimum 0. |
| `core.speed-mult` | shared stat rebuild | Multiplies final summed move speed; rounded; minimum 0. |
| `core.attack-speed-mult` | shared stat rebuild | Divides attack cooldown by `max(0.1, 1 + value)`; rounded; minimum 100 ms at this layer. |
| `core.hpregen-mult` | shared stat rebuild | Multiplies final summed HP regen; rounded; minimum 0. |
| `core.dr-layer-pct` | server monster-to-player combat pipeline | Separate multiplicative incoming-damage reduction layer; clamped to 0-0.9. |

Except for specifically designated multiplicative passive types elsewhere, `mergePassives` adds mechanic-effect values by key. Core keys are additive in the passive map. The stat rebuild then applies each combined Core multiplier once to the final summed stat. For example, two hypothetical sources of `core.attack-mult: 0.10` produce a combined `0.20`, followed by one `attack * 1.20` operation.

Negative multiplier values are allowed and represent tradeoffs. The math includes lower bounds. Attack-speed values are protected from a zero/negative divisor through `max(0.1, 1 + value)`.

### 6.2 Separate damage-reduction layer

`core.dr-layer-pct` is not added to the player's ordinary `damageReduction` stat. In `server/src/systems/combat/engine/combat.ts`, monster direct-hit damage against a player is calculated as:

```text
max(
  1,
  round(
    max(0, monsterAttack - playerPlating)
    * (1 - playerDamageReduction)
    * (1 - clampedCoreDrLayer)
  )
)
```

This means ordinary DR and Core DR compound rather than add. For example, 50% ordinary DR and 50% Core-layer DR leave 25% of the post-plating damage before the final minimum-damage clamp.

The located consumer is specifically in the monster-attacks-player direct-hit path. This document does not assume that the Core DR layer affects unrelated damage paths unless those paths route through the same code.

### 6.3 HP behavior on activation changes

Core max-HP multipliers are applied before the final current-HP clamp. If a Core becomes inactive or is removed and max HP falls below current HP, current HP is clamped down to the new maximum. Activating a max-HP Core raises the ceiling but the shown rebuild code does not refill current HP to the new maximum.

## 7. Progression, crafting, ranks, and upgrades

### 7.1 Recipe unlocks and crafting

Cores use ordinary `Recipe` entries and ordinary gear crafting. Recipe access is governed by existing fields such as:

- `recipeGroup`
- `requiredBiomeLevel`
- `tier`
- `cost`
- optional `catalystCost`
- optional `requiredBossClear`

There is no Core-specific unlock subsystem. Higher-tier access follows the existing biome-level and player-tier progression rules.

### 7.2 No normal `+N` upgrades

`shared/src/systems/itemUpgrades.ts` explicitly returns a maximum upgrade level of zero for any item whose slot is `core`:

```ts
export function getMaxUpgrade(item: ItemDefinition): number {
  if (item.slot === 'core') return 0;
  return item.upgrades ? item.upgrades.length : MAX_UPGRADE;
}
```

As a result, the normal shared upgrade check reports a Core as already at maximum upgrade. Cores are off the `+N` track regardless of authored generic fallback values.

### 7.3 Core ranks reuse evolution

An evolved recipe declares `evolvesFrom`. Normal gear evolution requires a `+3` predecessor, but `shared/src/systems/evolution.ts` special-cases Cores:

```ts
export function requiredPlusFor(recipe: Recipe): number {
  return recipe.slot === 'core' ? 0 : EVOLUTION_REQUIRED_PLUS;
}
```

For the evolve path, the predecessor copy must be in the bag; an equipped predecessor does not satisfy the check. The server consumes one bag copy, spends the evolved recipe's normal essence/catalyst cost, and grants the successor to the bag at `+0`. The player therefore needs to unequip an equipped predecessor before ranking it up.

If the evolved recipe defines `reconstructCost`, reconstruction skips predecessor ownership and uses the higher reconstruction costs. Both paths still require the target recipe to be unlocked outside the test room.

## 8. Currently authored Core content

All current Core recipes are in `shared/src/data/recipes/forest.recipes.ts`. They are T2 forest examples. Source comments explicitly call all numbers placeholders for a later balance pass. No `party` Core is currently authored.

| Item ID | Name | Tag | Forest level | Cost | Implemented effects |
|---|---|---|---:|---|---|
| `forest-core-bastion` | Bastion Core | close | 7 | 60 Wild essence + 2 Brutality catalysts | +20% max HP; +30% plating; 10% separate Core DR layer |
| `forest-core-sniper` | Sniper Core | far | 7 | 60 Wild essence + 2 Predation catalysts | +25% attack; -15% max HP |
| `forest-core-arcanist` | Arcanist Core | mid | 8 | 50 Wild + 15 Rot essence + 2 Alacrity catalysts | +15% attack speed; +5% attack |
| `forest-core-universal` | Tempered Core | universal | 8 | 45 Wild essence + 1 Volatility catalyst | +8% attack; +8% max HP |
| `forest-core-bastion-2` | Bastion Core II | close | 10 | Evolution: 90 Wild + 3 Brutality; reconstruction: 300 Wild + 7 Brutality | +30% max HP; +45% plating; 15% separate Core DR layer |

Additional authored metadata:

- Bastion Core and Bastion Core II share lineage ID `forest-core-bastion`.
- Bastion Core II evolves from `forest-core-bastion`.
- Every current recipe has `stats: {}` and expresses its behavior exclusively through `mechanicEffects`.
- Current icons reuse charm-like item art paths.

## 9. Persistence and networking

`HoldsInventory` contains:

```ts
interface HoldsInventory {
  inventory: string[];
  equipment: EquipmentMap;
  itemUpgrades: Record<string, number>;
}
```

### Persistence

The server stores the entire `holdsInventory` slice as JSON. On load, `server/src/db/playerRepo.ts` hydrates equipment as:

```ts
holdsInventory.equipment = {
  ...emptyEquipment(),
  ...holdsInventory.equipment,
};
```

This makes old saves backward-compatible: saves created before the Core key existed acquire `core: null` without a database migration. Saving serializes the whole current slice, including the equipped Core ID.

Derived passive values are not trusted from persistence: the server saves `UsesSkills` with `passives: {}` and rebuilds runtime passives from authoritative static data and loadout state.

### Networking and player view

`holdsInventory` is already a networked player slice in `shared/src/protocol/networkedEntity.ts`; the allowlist operates at the top-level component key, not at nested equipment-slot keys. Therefore Core required no separate network component or allowlist entry.

`composePlayerView` in `shared/src/protocol/views.ts` exposes `inventory.equipment` as `PlayerView.equipment`. Its fallback empty map includes `core: null`. The client mirrors this into its Jotai `equipmentAtom`, whose default also includes `core: null`.

## 10. Client presentation

The client does not decide whether Core effects apply. It renders server-derived stats and uses the shared pure activation helper for consistent explanatory UI.

Implemented surfaces:

- `client/src/ui/inventory/EquipmentSlots.tsx` maps `EQUIPMENT_SLOTS`, so it renders a fifth Core slot. An inactive directional Core receives an inactive CSS class, is visually dimmed, and has a tooltip such as `Inactive - needs far range`.
- `client/src/ui/inventory/StatSheet.tsx` labels an equipped Core as `CLOSE range`, `MID range`, `FAR range`, `Universal (any range)`, or `Party (any range)`. Directional tags additionally display active/inactive status.
- `client/src/ui/crafting/MakeTab.tsx` includes a Core filter. Directional recipes say `Full effect only at X range`; universal/party recipes say they work at any range.
- `client/src/ui/crafting/itemDisplay.ts` converts the Core passive keys into readable signed percentage lines and explains the separate DR layer.
- Slot-label maps include `Core`; the crafting abbreviation is `COR`.
- Stat help text defines all seven supported Core passive keys.

Because both server gating and client indicators call `coreIsActive`, they should agree as long as the shared helper receives the same `selectedRange`. The 2026-08-02 regression demonstrates that agreement alone does not prove the representation is correct, which is why tests now use real full range-node IDs.

## 11. Tests and verified invariants

The relevant tests were run successfully during this audit:

```text
cores.test.ts: ok
coreRangeGate: ok
```

`server/test/cores.test.ts` verifies:

- A matching Far Core contributes its attack and max-HP passive values.
- Changing to a nonmatching range removes those passives on rebuild.
- Inactive effects do not linger in the passive map.
- An inactive Sniper Core does not alter attack.
- A universal Core remains active across ranges.

`server/test/coreRangeGate.test.ts` verifies:

- Full skill IDs activate the corresponding directional tag.
- Cross-range mismatches remain inactive.
- Directional Cores are inactive before a range is selected.
- Universal and party tags are always active.
- An undefined tag is ungated.
- A bare range word does not match, protecting the real state representation.
- Every authored directional Core can be activated by at least one canonical range-node ID.
- Balance-benchmark builds that equip a Core select one active for the build's range.

## 12. Exact seams for changing or extending implementation

This is a map of current implementation locations, not a proposed plan.

| Concern | Current authority |
|---|---|
| Slot union, slot list, empty equipment, Core range type, item definition | `shared/src/items.ts` |
| Recipe schema | `shared/src/data/recipes/types.ts` |
| Authored Core recipes | `shared/src/data/recipes/forest.recipes.ts` |
| Recipe-to-item mapping | `shared/src/itemDatabase.ts` |
| Activation rule | `shared/src/systems/cores.ts` |
| Passive-key type registry and additive merge | `shared/src/passives.ts` |
| Equipment contribution and final-stat multipliers | `shared/src/systems/stats.ts` |
| Separate incoming-damage DR layer | `server/src/systems/combat/engine/combat.ts` |
| Equip/unequip mutation and recalculation | `server/src/systems/player/economy/inventory.ts` |
| Range selection and recalculation | `server/src/systems/player/progression/skills.ts` |
| No-`+N` Core rule | `shared/src/systems/itemUpgrades.ts` |
| Rank/evolution checks | `shared/src/systems/evolution.ts` |
| Evolution mutation | `server/src/systems/player/economy/itemEvolution.ts` |
| Save/load compatibility | `server/src/db/playerRepo.ts` |
| Network allowlist | `shared/src/protocol/networkedEntity.ts` |
| Player view projection | `shared/src/protocol/views.ts` |
| Inventory slot UI | `client/src/ui/inventory/EquipmentSlots.tsx` |
| Equipped-item detail UI | `client/src/ui/inventory/StatSheet.tsx` |
| Crafting browser and details | `client/src/ui/crafting/MakeTab.tsx`, `client/src/ui/crafting/itemDisplay.ts` |
| Regression coverage | `server/test/cores.test.ts`, `server/test/coreRangeGate.test.ts` |

## 13. Current boundaries and non-features

These statements prevent a downstream design session from assuming functionality that is not present:

- There is no dedicated Core ECS component, runtime state object, tick system, proc registry, or Core-specific socket protocol.
- Only one Core can be equipped because `EquipmentMap.core` holds one ID or `null`.
- Directional activation is binary: full effect or no effect. There is no partial off-range value.
- `party` currently means always active. No party membership, party role, proximity, or ally condition is checked by `coreIsActive`.
- `universal` being weaker is an authoring convention, not an enforced formula.
- The type system does not require a `rangeTag` on Core recipes and does not forbid it on other slots.
- There is no normal Core `+N` enhancement; `getMaxUpgrade` hard-stops Cores at zero.
- Core rank is represented by distinct item/recipe IDs connected through `evolvesFrom`, not a `rank` field on an item instance.
- Evolving requires the predecessor in the bag, not equipped.
- Only forest T2 examples exist at this snapshot; only Bastion has a second authored rank.
- No party-tagged item is authored.
- Current recipe comments label all Core numbers as placeholders for balancing.
- The `core.dr-layer-pct` consumer located in this audit is in the monster direct-hit path against a player; broader damage-path coverage should not be inferred without inspecting those paths.
- The client displays activation but remains non-authoritative; the server stat rebuild and combat pipeline determine results.

## 14. Minimal mental model

```text
Recipe(slot='core', rangeTag, mechanicEffects)
                    |
                    v
             ITEM_DATABASE
                    |
        crafted ID enters inventory bag
                    |
      inventory:equipItem intent to server
                    |
         equipment.core = item ID
                    |
         full server stat rebuild
                    |
       coreIsActive(rangeTag, selectedRange)
              /                    \
          false                     true
          skip all       merge effects into passives
                                      |
                         apply Core final-stat multipliers
                                      |
                    core.dr-layer-pct also read on
                    monster direct hits against player
                                      |
                         authoritative slices/view
                                      |
                           client renders result
```

## 15. Handoff instruction for the next ChatGPT session

Treat everything above as the implementation baseline. Theorycrafting may challenge or replace any design choice, but it should distinguish clearly between:

1. behavior that already exists and can be reused unchanged;
2. behavior that exists but would need modification;
3. new behavior requiring a new data field, shared formula, server authority path, persistence/network change, UI work, or tests;
4. numerical balance changes to the current placeholder recipes.

Do not assume that an archived plan is current when it conflicts with the code described here.
