# Damage Over Time Rework Plan

## Purpose

This document defines the first-pass rework plan for the game's Damage over Time systems.

The goal is not to rewrite every DoT-like mechanic at once. The goal is to establish clear contracts for:

1. The DoT combat archetype.
2. Monster-applied DoTs.
3. DoT-conversion weapons.
4. Future T3/T4 DoT specializations.

The current code has several DoT-like systems using overlapping infrastructure but different assumptions. This rework should make those assumptions explicit so future balance work is easier.

---

## High-Level Direction

Use different DoT contracts for different gameplay sources.

### Class DoT

The DoT class remains stack-based.

Poison, Fire, and Frost keep their current identities:

* Poison: many stacks, low conversion, fast ticks, attack-heavy.
* Fire: medium stacks, medium conversion, hybrid.
* Frost: few stacks, high conversion, slower ticks, mechanic-heavy.

The class DoT should remain a replacement damage engine, not a generic bonus proc.

That means:

* Direct hit damage is reduced by the DoT conversion percent.
* DoT damage is generated separately from a controlled class formula.
* DoT damage must not be based on final modified hit damage.
* Special hit multipliers should not accidentally snapshot into DoT stacks.

### Monster DoT

Monster DoTs should be simpler and linear.

Monster DoTs do not need front-loaded stack scaling. They are enemy pressure, not a player build mechanic.

### Weapon DoT

Generic DoT-conversion weapons should be reworked into a reservoir/pool model.

Weapon DoTs should have a long-fight niche:

* weaker in short fights,
* better in long fights,
* useful into plating,
* weak into DoT resistance or cleanse.

DoT weapons should not inherit full empowered-hit multipliers.

### Special DoTs

T3/T4 specializations such as Eternal Doom, Conflagration, Hemorrhage, Winter Spirit, etc. can remain exceptions.

Do not refactor every special DoT immediately. Stabilize the base contracts first.

---

## Non-Goals For First Pass

Do not fully rebalance every T3/T4 DoT specialization in this pass.

Do not redesign Poison, Fire, and Frost identities.

Do not fully remove the existing status-effect system.

Do not force all DoT-like effects to use one universal formula.

Do not make DoT weapons mandatory for DoT classes.

Do not allow generic DoT weapons to become abuse cases for high empowered multipliers.

---

# Phase 1 — Rework Core Class DoT

## Design Contract

The DoT class should use:

```text
fake conversion + real direct reduction
```

Meaning:

```text
The direct hit is reduced by conversion percent.
The DoT stack is generated from attacker.attack, not from final ctx.damage.
```

This prevents special hit multipliers from snapshotting into DoTs.

Example:

```text
attacker.attack = 100
conversion = 50%
special full-HP hit multiplier = 2.0x
```

Desired behavior:

```text
Direct damage uses the normal hit pipeline, then gets reduced by 50%.
DoT stack uses attacker.attack * 50%, not the special multiplied hit value.
```

So the special full-HP hit can still matter for the direct portion, but it does not double the DoT stack.

---

## Core Formula

Add an explicit DoT profile for the class:

```ts
type DotClassProfile = {
  element: "poison" | "fire" | "frost";
  conversionPct: number;
  maxStacks: number;
  tickIntervalMs: number;
  durationMs: number;
  dotMechanicMultiplier: number;
};
```

Recommended first-pass values:

```ts
const POISON_DOT_PROFILE = {
  element: "poison",
  conversionPct: 0.30,
  maxStacks: 8,
  tickIntervalMs: 1000,
  durationMs: 4500,
  dotMechanicMultiplier: 1.05,
};

const FIRE_DOT_PROFILE = {
  element: "fire",
  conversionPct: 0.50,
  maxStacks: 6,
  tickIntervalMs: 1500,
  durationMs: 5000,
  dotMechanicMultiplier: 1.10,
};

const FROST_DOT_PROFILE = {
  element: "frost",
  conversionPct: 0.70,
  maxStacks: 3,
  tickIntervalMs: 2000,
  durationMs: 6000,
  dotMechanicMultiplier: 1.20,
};
```

These values are starting points, not final balance numbers.

---

## Application Formula

The class DoT application should calculate stack damage from attacker attack, not final hit damage.

Recommended:

```ts
const attackBase = attacker.attack;
const conversionPct = profile.conversionPct;
const maxStacks = profile.maxStacks;
const tickIntervalMs = profile.tickIntervalMs;
const dotMechanicMultiplier = profile.dotMechanicMultiplier;

const damagePerStack = Math.round(
  attackBase
    * conversionPct
    * dotMechanicMultiplier
    / maxStacks
    * tickIntervalMs
    / 1000
);
```

Direct damage reduction should remain:

```ts
ctx.damage = Math.round(ctx.damage * (1 - conversionPct));
```

Important:

* `ctx.damage` may include hit-specific modifiers.
* `damagePerStack` should not use `ctx.damage`.
* This avoids accidental DoT snapshotting from full-HP bonuses, empowered direct hits, vulnerability windows, or other final hit effects.

---

## Tick Formula

Keep the current front-loaded stack curve for player class DoTs:

```ts
if (maxStacks > 0) {
  damage = Math.round(damagePerStack * Math.sqrt(stacks * maxStacks));
} else {
  damage = Math.round(stacks * damagePerStack);
}
```

This preserves the current desirable behavior:

* below max stacks, DoT is stronger than linear,
* at max stacks, the formula equals the full intended stack value,
* short fights feel less punishing.

At full stacks:

```text
sqrt(maxStacks * maxStacks) = maxStacks
```

So full-stack tick damage is:

```text
damagePerStack * maxStacks
```

Because `damagePerStack` divides by `maxStacks`, full-stack DoT DPS remains controlled.

---

## Expected Long-Fight Shape

Using 100 attack and 1 APS as a mental model:

### Poison

```text
Direct share: 70%
DoT share before multiplier: 30%
DoT multiplier: 1.05
Approx long-fight total: 101.5%
```

### Fire

```text
Direct share: 50%
DoT share before multiplier: 50%
DoT multiplier: 1.10
Approx long-fight total: 105%
```

### Frost

```text
Direct share: 30%
DoT share before multiplier: 70%
DoT multiplier: 1.20
Approx long-fight total: 114%
```

This is intentional.

Frost receives the largest target-dummy premium because it gives up the most direct damage and has the slowest damage delivery.

---

## Empowered Multiplier Rule

For the base DoT class, do not use the normal empowered attack multiplier directly.

Instead, treat `dotMechanicMultiplier` as the DoT class's controlled empowered-like scalar.

Generic empowered hit multipliers should not automatically increase DoT stacks.

Individual specs may override this later if explicitly designed around empowered DoT behavior.

---

# Phase 2 — Split Player Class DoTs From Monster DoTs

## Design Contract

Monster DoTs should be linear and simpler.

Player class DoTs use front-loaded scaling.

Monster DoTs use linear scaling.

Recommended monster formula:

```ts
damage = Math.round(damagePerStack * stacks);
```

Do not use:

```ts
damagePerStack * sqrt(stacks * maxStacks)
```

for monster-applied DoTs.

## Reasoning

Monster DoTs are enemy pressure.

They do not need short-fight compensation, build payoff, or front-loaded class identity.

Keeping them linear makes monster damage easier to tune.

---

## Implementation Options

### Option A — Split by source context

Keep the same `dot` status id for now, but branch the tick formula based on source/owner context:

```ts
if (effect.sourceKind === "player-class-dot") {
  usePlayerClassDotFormula();
}

if (effect.sourceKind === "monster-dot") {
  useMonsterDotFormula();
}
```

### Option B — Split status ids later

Later, consider separate ids:

```text
player-class-dot
monster-dot
```

But this does not need to happen in the first pass if it is too invasive.

---

# Phase 3 — Rework Generic DoT Weapons Into Reservoir DoTs

## Design Contract

Generic DoT-conversion weapons should not use the class DoT stack model.

Instead, they should use a reservoir/pool model.

Weapon DoT identity:

```text
Convert part of remaining direct damage into a delayed pool.
The pool drains over time.
Optional multiplier makes it stronger in long fights.
```

This creates the intended use case:

* bad or mediocre against fast trash,
* strong against elites and bosses,
* good into plating,
* weak into DoT resistance,
* not abusive with high empowered multipliers.

---

## Weapon DoT Profile

Add a weapon DoT profile structure:

```ts
type WeaponDotProfile = {
  effectId: string;
  element: "fire" | "frost" | "poison" | "void" | "decay";
  conversionPct: number;
  drainDurationMs: number;
  tickIntervalMs: number;
  dotMultiplier: number;
};
```

Example:

```ts
const ASHBRAND_DOT_PROFILE = {
  effectId: "ashbrand-burn",
  element: "fire",
  conversionPct: 0.35,
  drainDurationMs: 5000,
  tickIntervalMs: 1000,
  dotMultiplier: 1.15,
};
```

---

## Application Order

Class DoT conversion happens first.

Weapon DoT applies after class DoT conversion.

Weapon DoT should convert only the remaining direct portion.

Example:

```text
Base attack = 100
Fire class conversion = 50%
Remaining direct = 50
Weapon DoT conversion = 40%
```

Final:

```text
Class DoT basis: 50
Weapon DoT basis: 20
Remaining direct: 30
```

This prevents DoT weapons from exploding on DoT classes while still allowing some synergy.

---

## Reservoir Formula

On hit:

```ts
const weaponDotBase =
  remainingDirectBase
    * weaponDotProfile.conversionPct
    * weaponDotProfile.dotMultiplier;

ctx.damage = Math.round(ctx.damage * (1 - weaponDotProfile.conversionPct));

effect.data.pool = (effect.data.pool ?? 0) + weaponDotBase;
effect.data.tickIntervalMs = weaponDotProfile.tickIntervalMs;
effect.data.drainDurationMs = weaponDotProfile.drainDurationMs;
```

On tick:

```ts
const tickFraction =
  effect.data.tickIntervalMs / effect.data.drainDurationMs;

const tickDamage =
  Math.round(effect.data.pool * tickFraction);

effect.data.pool -= tickDamage;
```

This means tick rate changes smoothness, not long-fight DPS.

At steady state:

```text
DoT DPS approximately equals damage added to the pool per second.
```

With `dotMultiplier > 1`, the weapon becomes a long-fight premium.

---

## Weapon DoT And Empowered Hits

Generic weapon DoTs should not inherit full empowered attack multipliers.

The weapon DoT should use its own static `dotMultiplier`.

This avoids cases where a 4.0x or 6.0x empowered class creates a massive persistent DoT pool.

If a future weapon or spec wants empowered DoT scaling, it should be explicit and separately budgeted.

---

## Runtime Data

Current burn weapons are hardcoded by weapon id.

The rework should move runtime behavior toward item/passive data where possible.

Recipes currently declare values such as:

```text
weapon.dot-conversion-pct
weapon.dot-stacks
```

Future reservoir weapons should read runtime profile values from weapon data or passives instead of only hardcoded weapon ids.

---

# Phase 4 — Unify Tick Events And Damage Logging

## Goal

Class DoTs, weapon DoTs, and special DoTs should emit consistent damage events where practical.

Current differences:

* class DoTs are logged as `dot`,
* burn weapon ticks are logged as `proc`,
* Edge of Oblivion currently does not push a `dot-tick` event.

Desired behavior:

```text
All DoT-like damage should push a dot-tick event unless intentionally hidden.
```

Recommended event shape:

```ts
{
  kind: "dot-tick",
  element,
  amount,
  sourceType: "class" | "weapon" | "monster" | "special",
  fx?: string
}
```

This will make floating damage numbers and client styling more consistent.

---

# Phase 5 — Leave T3/T4 DoT Specs For Later

Do not fully rework T3/T4 specs in this pass.

After the base systems are stable, review specs individually.

Priority later:

1. Poison Explosion
2. Eternal Doom
3. Fan the Flames
4. Ignition
5. Conflagration
6. Rimeshatter
7. Freezing Cold
8. Winter Spirit candidate
9. Hemorrhage and other non-core DoTs

## Spec Rule For Later

Special specs are allowed to break base rules, but only explicitly.

Examples:

* Rimeshatter may intentionally restore full direct hits at max Frost stacks.
* Conflagration may use its own tick driver.
* Eternal Doom may use its own stack formula.
* Winter Spirit may convert 100% of damage into a special Frost DoT.
* Hemorrhage may convert empowered finisher damage into DoT.

But generic class DoTs and generic weapon DoTs should stay predictable.

---

# Implementation Checklist

## Class DoT

* Add/centralize `DotClassProfile`.
* Resolve profile from Poison / Fire / Frost passives.
* Change class DoT stack generation to use `attacker.attack`, not final `ctx.damage`.
* Keep direct damage reduction on `ctx.damage`.
* Add `dotMechanicMultiplier`.
* Update tick intervals:

  * Poison: 1000 ms
  * Fire: 1500 ms
  * Frost: 2000 ms
* Consider longer Frost duration to reduce feel-bad stack drops.
* Keep current front-loaded stack formula for player class DoTs.

## Monster DoT

* Make monster DoTs use linear stack scaling.
* Keep dot resistance and half-DR behavior.
* Keep shield behavior and `bypassShield` option.
* Avoid front-loaded player-style stack formula.

## Weapon DoT

* Introduce weapon DoT reservoir profile.
* Rework burn-family weapons to use reservoir model.
* Make weapon DoT apply after class conversion.
* Make weapon DoT convert only remaining direct damage.
* Add `pool`, `drainDurationMs`, and `tickIntervalMs` to effect data.
* Use static `dotMultiplier`.
* Do not inherit full empowered attack multiplier.
* Move runtime values away from hardcoded weapon ids where practical.

## Events / Logging

* Normalize `dot-tick` events.
* Ensure weapon reservoir ticks emit proper element styling.
* Consider logging weapon reservoir damage as `dot` or a distinct `weapon-dot`, but be consistent.

---

# Test Cases

## Class DoT: Sunsteel-style full-HP multiplier

Setup:

```text
attacker.attack = 100
conversion = 50%
full-HP hit multiplier = 2.0x
```

Expected:

```text
Direct portion can benefit from full-HP multiplier.
DoT stack value should not double.
```

## Class DoT: Tick interval normalization

Setup:

```text
Same attack, same conversion, same stacks.
Change tick interval.
```

Expected:

```text
Faster ticks should make damage smoother.
Faster ticks should not massively increase long-fight DPS.
```

## Frost class DoT

Setup:

```text
100 attack
70% conversion
3 max stacks
2000 ms tick
1.20 DoT multiplier
```

Expected:

```text
Frost should have low direct damage.
Frost should have strong delayed DoT damage.
Frost should feel worse in short fights than Poison.
```

## Monster DoT

Setup:

```text
Monster applies 3 stacks.
damagePerStack = 10.
```

Expected:

```text
Tick damage = 30 before player mitigation.
No front-loaded sqrt scaling.
```

## Weapon reservoir

Setup:

```text
100 attack
50% weapon DoT conversion
4s drain duration
1s tick interval
1.0x DoT multiplier
```

Expected long fight:

```text
Direct DPS + reservoir DPS should approximately equal no-conversion DPS.
```

With 1.2x multiplier:

```text
Long-fight DPS should be above no-conversion DPS.
Short-fight realized damage should be worse or only slightly better depending on enemy lifetime.
```

## DoT class + DoT weapon

Setup:

```text
Fire class: 50% conversion.
Weapon reservoir: 40% conversion.
Base attack = 100.
```

Expected:

```text
Class DoT basis = 50.
Weapon DoT basis = 20.
Remaining direct = 30.
```

Weapon should not convert from the original 100 after class conversion has already happened.

---

# Open Balance Values

These are first-pass guesses and should be tuned after DPS tooling exists.

```ts
Poison:
  conversionPct = 0.30
  maxStacks = 8
  tickIntervalMs = 1000
  durationMs = 4500
  dotMechanicMultiplier = 1.05

Fire:
  conversionPct = 0.50
  maxStacks = 6
  tickIntervalMs = 1500
  durationMs = 5000
  dotMechanicMultiplier = 1.10

Frost:
  conversionPct = 0.70
  maxStacks = 3
  tickIntervalMs = 2000
  durationMs = 6000
  dotMechanicMultiplier = 1.20
```

Reservoir weapon defaults:

```ts
Generic fast burn:
  conversionPct = 0.25 - 0.35
  drainDurationMs = 3000 - 4500
  dotMultiplier = 1.05 - 1.15

Elite/boss decay:
  conversionPct = 0.35 - 0.50
  drainDurationMs = 5000 - 8000
  dotMultiplier = 1.15 - 1.35

Slow scythe-style wound variant:
  conversionPct = 0.60 - 0.80
  drainDurationMs = 7000 - 10000
  dotMultiplier = 1.25 - 1.50
  special rule: may use packet/instanced DoT instead of reservoir
```

---

# Final Design Summary

Use three separate DoT contracts:

```text
Class DoT:
  Stack-based.
  Fake conversion from attacker.attack.
  Real direct damage reduction.
  Front-loaded player stack curve.
  Controlled DoT multiplier.

Monster DoT:
  Stack-based.
  Linear scaling.
  Simple enemy pressure.

Weapon DoT:
  Reservoir-based.
  Converts remaining direct damage after class conversion.
  Static DoT multiplier.
  Long-fight weapon identity.
```

This should preserve DoT class identity while making weapon DoTs safer, clearer, and easier to balance.
