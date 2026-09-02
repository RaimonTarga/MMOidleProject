# Stances — current state

- **Code audit:** 2026-09-02 (Perfection gate + RP correction pass)
- **Authoring contract:** `docs/stances-authoring-guide.md`
- **Candidate postures / design notes:** `docs/stances-future-design-notes.md`
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

`activeStance` remains authoritative/networked on `TracksProgression`. A `switch-stance` rule requires `targetStanceId`; its full RP cost is **condition + destination `runeCost`**. The `Switch Stance` action itself costs **0 RP** as of 2026-09-02 — the verb has no power of its own, and charging for it on top of the destination taxed the axis twice: the cheapest possible tactical transition (`In Combat -> Offensive`) cost 4 RP, as much as a premium Rite, and two transitions did not fit inside a T2 budget alongside basic autoplay. The destination surcharge remains the sole measure of how transformative a posture is. Existing saved loadouts stay legal — every stance rule got strictly cheaper. The reserved `no-stance` destination costs 0 RP and explicitly clears the active stance, providing no bonuses or penalties. The default stance is free. Every rule pays its own destination cost, even when multiple rules target the same stance.

The single `STANCE` Rune channel remains priority ordered. The first active Stance rule supplies its destination. If no Stance rule is active, the player returns to the default.

Supported stance situations are Always, In Combat, Out of Combat, HP Below 25%, HP Above 90%, Target HP Below 25%, Debuffed, Target Casting, Empowered Ready, Stance Charged, While Traveling, and 3+ Aggressors. The last three were added 2026-09-02: `Empowered Ready` (an existing condition that Switch Stance simply was not allowed to name) makes `Empowered Ready -> Time to Strike` buildable; `While Traveling` turns the existing cast into travel postures (`While Traveling -> Fleeting` for speed and evasion, `-> Predator` for stealth and a loaded opener) without adding travel-specific stances; and `Stance Charged` is the general "this posture has finished charging" situation a charging stance is left on.

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
| `damageTakenPct` | not a stat — read at hit time by the stance `onDamageTaken` listener, which passes the player's live HP fraction so a gated posture resolves correctly |

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
| Perfection | 2 | -20% Plating always; +12% Attack / Attack Speed / Move Speed **only at >=90% HP** | HP gate, see below |
| Fleeting | 2 | +35% Move Speed, +15pp Evasion, -35% Attack, -20% Attack Speed | — |
| Berserker | 4 | +35% Attack, +20% Attack Speed, +15% damage taken | 2% max HP self-damage per second while in combat; can kill |
| Recuperating | 4 | -50% Attack, -30% Attack Speed | 80% of Recovery stays active in combat |
| Predator | 3 | +15% Move Speed, -10% Attack | 50% reduced detection; +75% armed opening hit |
| Brawler | 3 | -10% Attack | 8/16/24/31/40% damage reduction at 1/2/3/4/5+ aggressors |
| Execute | 3 | -20% Attack | +75% damage to targets at or below 25% HP |
| Time to Strike * | 3 | -35% Attack Speed | +100% empowered-attack damage; ordinary hits -40% |
| Reaper * | 3 | -15% Attack | a kill while active arms 6s of +35% damage / +25% Attack Speed that outlives the stance |
| Warding * | 3 | -50% Attack, -25% Attack Speed | incoming harmful statuses -50% duration; incoming DoTs -40% per-stack damage |
| Powering Up * | 4 | -50% Attack, -30% Attack Speed | charges up to 8s in combat; leaving spends it for +50% damage / +30% Attack Speed for as long as it charged |

`*` **Unplaced.** These four were implemented 2026-09-02 but no stance recipe teaches
them, so `knownStances` can never contain one and their systems are inert. See
`docs/stances-future-design-notes.md` for the design intent and the open questions that
have to be answered before placing them; `server/test/stancesUnplaced.test.ts` asserts
they stay unplaced, so placing one is a deliberate act rather than a side effect.

Every behavioral magnitude above is a named constant in `shared/src/stances.ts`
(`BERSERKER_SELF_DAMAGE_PCT`, `PREDATOR_OPENER_BONUS`, `BRAWLER_REDUCTION_BY_AGGRESSORS`,
`EXECUTE_HP_THRESHOLD`, ...). The server systems and the player-facing copy both read those
constants, so a stance cannot advertise a number it does not apply.

Predator's opener is armed only while the posture is active out of combat and is consumed by the first hit. Berserker damage is deterministic, bypasses ordinary mitigation/shields/cheat-death/on-damage listeners, and can kill with the dedicated stance death cause. Brawler's crowd table and the shared damage-taken multiplier compose in one listener, so a Brawler carrying a `damageTakenPct` would multiply both.

Runes own CONDITIONS; the stance owns the POSTURE. No stance carries an internal HP or
target-HP ENTRY threshold — `HP Below 25% -> Enraged` is a rule the player builds. The only
intrinsic thresholds are ones the posture cannot exist without: Execute's target-HP window,
Brawler's aggressor count, Predator's out-of-combat arming, Berserker's in-combat tick, and
Perfection's HP gate.

### Perfection's HP gate — the one modifier-level exception

`StanceDef.gatedModifiers` (`StanceHpGate`) holds the UPSIDE half of a posture whose identity
IS a maintained state. Perfection is the only user: `+12% Attack / Attack Speed / Move Speed`
apply only while HP is at or above `PERFECTION_HP_THRESHOLD` (0.9); the `-20% Plating` sits in
the ordinary `modifiers` and is paid at every HP.

This is a deliberate exception to "Runes own conditions", and the reason it is not one is that
a Rune cannot express it. `HP Above 90% -> Perfection` decides when you *enter* the posture; it
cannot switch the bonuses off underneath you. Enter at 91%, drop to 40%, and the rule merely
stops holding — the player reverts to their default on the next reconciliation, with Perfection's
full payoff live the whole way down. The gate is intrinsic in the same sense as Execute's
target-HP window and Brawler's aggressor count.

Below the threshold Perfection is deliberately **worse than no stance at all**: the drawback
persists, the payoff does not. That asymmetry is the reason to leave, and the tooltip says so.
The threshold is not configurable and is not a Rune condition.

Authoring rule, enforced by `server/test/stances.test.ts`: a gate may only hold upsides. Whatever
a posture pays has to be paid on both sides of the line, or falling out of the gate is free.

Mechanically: `activeStanceModifiers(stanceId, hpFraction)` in `shared/src/stances.ts` is the
ONLY resolver stat code may use — reading `def.modifiers` directly silently drops the conditional
half. `recalculatePlayerStats` captures the HP fraction before step 1 resets `maxHp`, and
`updateStanceSwitch` edge-triggers a `recalculatePlayerStanceStats` off a stored
`stance.gate.met` flag whenever the player crosses the line in either direction. The rebuild
preserves HP percentage and no stance touches `maxHp`, so the reading is identical on both sides
of the recalc and the gate cannot oscillate. Recalculating unconditionally every tick would
discard cadence/rampage state ten times a second; the flag is what makes it edge-triggered.

### The unplaced postures, mechanically

None of the four needed a new subsystem; each was routed onto a seam that already existed,
which is also why they cost nothing while unreachable.

- **Time to Strike** rides `shared.empowered-mult-add`, the universal empowered bonus every
  archetype's empowered attack already reads, so the stance never touches cadence, cooldown,
  energy or reload code. Only the ordinary-hit penalty is a listener, and it keys off the
  `empoweredAttack` metadata the archetype multipliers set — they register first
  (`initAllMechanics` precedes `initStanceCombatEffects`), so the flag is truthful by then.
  The Attack Speed penalty is load-bearing, not flavour: it is the whole reason this is not
  a free upgrade for builds that empower every few seconds.
- **Reaper** stores its momentum as a status effect rather than a stance modifier, which is
  precisely what lets it outlive the posture. Only kills landed while Reaper is ACTIVE arm
  or refresh it; a kill made after reverting does not, or the window would never close.
  `maxStacks: 1` + `refreshable` means the duration resets and the magnitude never climbs.
- **Warding** has no listener at all. It is two passives —
  `shared.status-duration-resist` and `shared.status-potency-resist` — read by
  `server/src/systems/combat/status/harmfulStatus.ts`, the ONE writer for how hard an
  incoming harmful status lands. That module folds the stance together with mobility-boot
  tenacity so two sources cannot each treat the other's output as the clean base, and every
  application site (slow, root, mark, antiheal, vulnerability, plating-shred ramp, stun,
  monster DoT) calls it instead of the individual sources. Duration resistance covers that
  whole surface; POTENCY resistance covers DoT per-stack damage only, because potency is a
  different number on every other debuff and one function cannot honestly scale them all.
  Both are capped strictly below 1: Warding endures, it never grants immunity.
- **Powering Up** keeps its charge as a `tracksCombat` counter that accrues only while the
  stance is active AND the player is in combat, and is discarded when combat ends — the
  design hazard is a posture you charge for free before every pull, which is a loading
  screen rather than a decision. Leaving the stance spends the charge however it was left,
  so there is no way to hoard it. The `Stance Charged` Rune situation is what lets a rule
  leave at full charge on purpose.

Reaper's and Powering Up's attack-speed windows are read at the ATTACK-CADENCE GATE in
`combat.ts`, never written into `performsAttack.attackCooldown`. The Zealot's Frenzy
already mutates that stat from a cached base, and a second mutator treating Frenzy's output
as "the clean base" ratchets the cooldown toward zero over a few ticks. Frenzy's own haste
already rides the gate for exactly this reason; these sum with it.

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
- Loadout → Runes opens a horizontal destination wheel when `Switch Stance` is selected; its first sigil is the zero-cost neutral `No Stance` posture, followed by learned stance crests. Once a situation is picked, each crest quotes the WHOLE rule price (condition + destination), not the surcharge — with the verb at 0 RP, the surcharge alone would understate what committing the rule spends.
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

`server/test/stances.test.ts` verifies destination rules, minimum dwell, stat replacement, unrelated cooldown/counter preservation, and HP-percentage semantics including a max-HP stance. Since 2026-09-02 it also covers Perfection's gate in both directions (bonuses on at full HP, off one point below the threshold, back on above it), that the drawback persists across the crossing, that the crossing corrupts no combat state and switches no stance, that a gate may hold no drawbacks, and that `Switch Stance` contributes 0 RP while destination and condition costs stay authoritative.

`server/test/balanceInstruments.test.ts` asserts the canonical bench stance is unconditional. The bench baseline MOVED on 2026-09-02: it ran Perfection as its "least polarising" posture, which the gate invalidated (a benched fight leaves >=90% HP in the first exchange, so the bot would have carried the -20% Plating with none of the payoff). It now runs Offensive. Pre-2026-09-02 bench runs are not comparable.

`shared/src/data/recipeGates.test.ts` covers recipe reachability for stances, rites, runes, abilities and items.

`server/test/stancesUnplaced.test.ts` covers the four unplaced postures end to end — Time
to Strike's empowered/ordinary split, Reaper's arm-refresh-persist rules including that a
kill outside the stance must NOT refresh, Warding's duration and potency reductions through
the shared seam and at the live monster-DoT site, and Powering Up's in-combat-only charge,
its cap, its release window and the discard on combat ending — plus the invariant that none
of them is placed.

Known balance follow-ups: tune all magnitudes/costs/gates; decide whether post-combat Berserker damage is desirable with Lingering Battle; add authored icons and a client switch animation for the emitted event.

Known scope limit: the stance damage-taken multiplier and Brawler's crowd mitigation both
ride the `onDamageTaken` listener, which direct monster attacks emit but node AoE and DoT
ticks do not. That was already true of Brawler before this pass; widening it is a combat-
pipeline change, not a stance change.
