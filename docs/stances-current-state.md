# Stances — current state

- **Code audit:** 2026-08-22 (corrective pass)
- **Authoring contract:** `docs/stances-authoring-guide.md`
- **Archived design handoff:** `docs/archive/stances-rework-design-handoff.md`
- **Historical implementation plan:** `docs/archive/stances-plan.md`

Stances are mutually exclusive modal postures. A character learns stances through recipes, chooses one free default posture, and can automate transitions to any learned stance through Rune rules. There is no reactive slot and no manual real-time combat switch.

## State and Runic Points

```ts
interface EquippedStances { default: string | null }
interface EquippedRule {
  conditionId: string;
  actionId: string;
  targetStanceId?: string;
}
```

`activeStance` remains authoritative/networked on `TracksProgression`. A `switch-stance` rule requires `targetStanceId`; its full RP cost is condition + base action + that stance's `runeCost`. The reserved `no-stance` destination costs 0 RP and explicitly clears the active stance, providing no bonuses or penalties. The default stance is free. Every rule pays its own destination cost, even when multiple rules target the same stance.

The single `STANCE` Rune channel remains priority ordered. The first active Stance rule supplies its destination. If no Stance rule is active, the player returns to the default.

Supported stance situations now include Always, In Combat, Out of Combat, HP Below 25%, HP Above 90%, Target HP Below 25%, Debuffed, Target Casting, and 3+ Aggressors.

## Authoring model

Every static modifier is a PERCENTAGE, held in `StanceModifiers`. A stance is a temporary
mode that can switch automatically mid-fight, so a flat grant would be the whole character
at T1 and a rounding error at T5. `StanceModifiers` has no flat fields and, deliberately,
no max-HP field of any kind — resizing the pool means preserving HP percentage across a
switch the player did not ask for, so survival postures pay in mitigation and offense.

Where each field lands in `recalculatePlayerStats`:

| Field | Seam |
|---|---|
| `attackSpeedPct` | step 2a, into the shared attack-speed accumulator (must precede the reload cadence layers) |
| `evasion` | step 2a, into the shared evasion rating (already a 0-1 fraction) |
| `attackPct` / `platingPct` / `moveSpeedPct` | step 3e, a stance-owned multiplicative layer applied *after* `applyClassAffinities` |
| `damageTakenPct` | not a stat — read at hit time by the stance `onDamageTaken` listener |

`attackPct` and friends multiply rather than joining the class-affinity bucket on purpose:
a posture the player toggles and reads off a tooltip must mean exactly what it says for
every class. `damageTakenPct` is a multiplicative layer rather than an additive
`damageReduction` contribution because that pool clamps to [0, 0.9] — before the corrective
pass, every stance's "you take more damage" drawback was silently free for any character
without gear DR.

## Catalog

First-pass magnitudes are balance seeds in `shared/src/stances.ts`; the structure is frozen.

| Stance | RP | Static posture | Behavioral |
|---|---:|---|---|
| Offensive | 1 | +15% Attack, +10% Attack Speed, +10% damage taken | — |
| Defensive | 1 | +20% Plating, -10% damage taken, -15% Attack | — |
| Tanking | 3 | +40% Plating, -25% damage taken, -40% Attack, -20% Attack Speed | — |
| Enraged | 3 | +30% Attack, +15% Attack Speed, +15% damage taken | — |
| Perfection | 2 | +12% Attack / Attack Speed / Move Speed, -20% Plating | — |
| Fleeting | 2 | +35% Move Speed, +15pp Evasion, -35% Attack, -20% Attack Speed | — |
| Berserker | 4 | +35% Attack, +20% Attack Speed, +15% damage taken | 2% max HP self-damage per second while in combat; can kill |
| Recuperating | 4 | -50% Attack, -30% Attack Speed | 80% of Recovery stays active in combat |
| Predator | 3 | +15% Move Speed, -10% Attack | 50% reduced detection; +75% armed opening hit |
| Brawler | 3 | -10% Attack | 8/16/24/31/40% damage reduction at 1/2/3/4/5+ aggressors |
| Execute | 3 | -20% Attack | +75% damage to targets at or below 25% HP |

Every behavioral magnitude above is a named constant in `shared/src/stances.ts`
(`BERSERKER_SELF_DAMAGE_PCT`, `PREDATOR_OPENER_BONUS`, `BRAWLER_REDUCTION_BY_AGGRESSORS`,
`EXECUTE_HP_THRESHOLD`, ...). The server systems and the player-facing copy both read those
constants, so a stance cannot advertise a number it does not apply.

Predator's opener is armed only while the posture is active out of combat and is consumed by the first hit. Berserker damage is deterministic, bypasses ordinary mitigation/shields/cheat-death/on-damage listeners, and can kill with the dedicated stance death cause. Brawler's crowd table and the shared damage-taken multiplier compose in one listener, so a Brawler carrying a `damageTakenPct` would multiply both.

Runes own CONDITIONS; the stance owns the POSTURE. No stance carries an internal HP or
target-HP ENTRY threshold — `HP Below 25% -> Enraged` is a rule the player builds. The only
intrinsic thresholds are ones the posture cannot exist without: Execute's target-HP window,
Brawler's aggressor count, Predator's out-of-combat arming, Berserker's in-combat tick.

## Switching semantics

`updateRuneDerivedConfig` writes the winning destination into server-only `TracksCombat`; `updateStanceSwitch` reconciles it once per tick. Switches have a 1500 ms minimum dwell and at most one transition per tick.

`recalculatePlayerStanceStats` performs the derived rebuild while preserving unrelated live state:

- combat counters/resources/cooldowns/flags/strings/status effects;
- Cadence progress and Rampage state;
- shields and archetype-owned resources;
- current HP percentage across max-HP changes.

A switch emits a server-authoritative `stance-switch` combat event and dirties progression. Dynamic combat listeners are registered through `initCombatSystems()`.

## Persistence and validation

Hydration filters known IDs, retains a legal default, initializes active stance to that default, and migrates legacy `{default, reactive}` saves. A legacy `switch-stance` rule without a target receives the saved reactive stance as its destination when that stance is still known.

Rune loadout intents are atomic: malformed/unowned/incompatible rules, unknown or unlearned stance destinations, and shared-RP overspending reject the whole proposal. Results use `build:loadoutResult`.

## Player interface

Effect text is generated from the stance definition by `stanceLines` in
`client/src/ui/describe/`, and covers static modifiers, every authored `behaviors` entry,
`mechanicEffects`, and the destination RP cost. Surfaces with room for only one line
(crafting, the Rune destination wheel, the map's unlock list) render `blurb`, which is
therefore written as a mechanics sentence rather than flavour.

What is deliberately absent: the Rune condition a stance is usually reached through. The
Rune rule UI already shows `HP Below 25% -> Switch Stance -> Enraged`; the stance tooltip
only describes what Enraged does once active.

- Loadout → Stances is a crest/sigil sanctum for choosing the free default.
- Loadout → Runes opens a horizontal destination wheel when `Switch Stance` is selected; its first sigil is the zero-cost neutral `No Stance` posture, followed by learned stance crests showing their RP surcharge.
- Overview shows the default/active stance and the total shared RP pool.
- Crafting contains recipes for all eleven stances across T2–T4 mastery bands.

## Progression

Recipes live in `shared/src/stanceRecipes.ts`. Three placement rules hold, all enforced by
`shared/src/data/recipeGates.test.ts` across every recipe database in the game:

1. the biome must have nodes at the recipe's tier;
2. `requiredBiomeLevel` must be within `biomeLevelCap(tier, group)`;
3. `catalystCost` must name a live node-modifier family the biome is allowed to roll.

The 2026-08-22 pass fixed all three. Fleeting moved off a Tundra that does not exist at T2
(-> Jungle), Brawler off a Plains retired by T3 (-> Volcanic, whose native Swarming is the
crowd the stance exists to survive), Recuperating off a Forest gone by T4 (-> Jungle);
Enraged, Berserker and Predator had gates above their own tier's level cap; and eight
recipes still charged the retired blight / volatility / predation / brutality catalyst
families, which no player can hold, so those stances were uncraftable outside the test room.
Essence costs and catalyst amounts were left alone.

New stances currently reuse the closest existing stance crests until dedicated concept art is authored.

## Coverage

`server/test/stances.test.ts` verifies destination rules, minimum dwell, stat replacement, unrelated cooldown/counter preservation, and HP-percentage semantics including a max-HP stance.

`shared/src/data/recipeGates.test.ts` covers recipe reachability for stances, rites, runes, abilities and items.

Known balance follow-ups: tune all magnitudes/costs/gates; decide whether post-combat Berserker damage is desirable with Lingering Battle; add authored icons and a client switch animation for the emitted event.

Known scope limit: the stance damage-taken multiplier and Brawler's crowd mitigation both
ride the `onDamageTaken` listener, which direct monster attacks emit but node AoE and DoT
ticks do not. That was already true of Brawler before this pass; widening it is a combat-
pipeline change, not a stance change.
