# Stance authoring guide

This is the living design and implementation contract for adding or revising Stances.
Exact shipped values and behavior belong in `docs/stances-current-state.md`; the original
rework rationale is preserved in `docs/archive/stances-rework-design-handoff.md`.

## Design identity

Stances are mutually exclusive combat modes. Runes decide when the player changes mode,
and Runic Points limit how complicated that state machine can become.

A good Stance:

- is attractive in a recognizable combat state and unattractive in another;
- contains a meaningful tradeoff rather than a free conditional bonus;
- either exploits a state or pushes the player toward a new state;
- gives the player a reason to enter it and a reason to leave it;
- creates useful transitions with existing Rune conditions;
- remains distinct from Abilities, Cores, gear, and Rites.

Runes own conditions wherever practical. Prefer `HP Below 25% -> Enraged` over placing
the HP threshold inside Enraged itself. A Stance should describe the mode; the Rune should
describe when that mode is wanted.

**The one sanctioned exception: `gatedModifiers`.** A Rune decides when you ENTER a posture;
it cannot switch the posture's bonuses off underneath you once you are in it. Where a Stance's
identity is a state the player must MAINTAIN, that is a different question and the Stance owns
it. Perfection is the only current user (`+12% Attack/Attack Speed/Move Speed` while at or
above 90% HP, `-20% Plating` always), alongside the behavioral equivalents Execute, Brawler and
Predator already carry.

Two hard rules if you reach for it:

- a gate holds the PAYOFF only. Whatever the posture costs stays in `modifiers` and is paid on
  both sides of the line, or falling out of the gate is free. `server/test/stances.test.ts`
  enforces this;
- do not use it to spare a player from authoring a Rune rule. If `HP Above 90% -> X` would
  express the whole intent, write the Rune rule.

Avoid permanent encounter labels such as “boss stance,” “AoE stance,” or “single-target
stance.” Avoid adding Stance energy, capacity, charges, or another automation currency.

### Authored but unplaced

A stance may exist in `shared/src/stances.ts` with no recipe in
`shared/src/stanceRecipes.ts`. It is then fully implemented and completely unreachable:
`knownStances` can never contain it, so it can never be equipped or named as a Rune
destination. That is a legitimate state — it lets a posture's mechanics be built and tested
before its tier, biome and cost are decided — but it must be DELIBERATE, so
`server/test/stancesUnplaced.test.ts` pins the current unplaced set and fails the moment one
of them gets a recipe. Placing one means updating that list in the same change.

Four postures are unplaced today (Time to Strike, Reaper, Warding, Powering Up); see
`docs/stances-future-design-notes.md`.

## Data contract

Stances are authored in `shared/src/stances.ts`:

```ts
interface StanceDef {
  id: string;
  name: string;
  blurb: string;
  runeCost: number;
  modifiers?: StanceModifiers;
  mechanicEffects?: MechanicEffects;
  behaviors?: readonly StanceBehavior[];
  icon?: string;
}

interface StanceModifiers {
  attackPct?: number;       // 0.15 -> x1.15 Attack
  attackSpeedPct?: number;  // percentage points into the shared attack-speed accumulator
  platingPct?: number;
  moveSpeedPct?: number;
  evasion?: number;         // percentage POINTS; evasion is already a 0-1 fraction
  damageTakenPct?: number;  // 0.10 -> take 10% more; -0.25 -> take 25% less
}
```

Authoring rules:

- IDs are stable, lowercase kebab-case, and should normally end in `-stance`.
- Names and blurbs describe the posture and its tradeoff, not a recommended Rune rule.
- `runeCost` is the destination surcharge paid by every Rune rule targeting the Stance.
- **Every static modifier is a PERCENTAGE.** A Stance is a temporary mode that can switch
  automatically, so a flat grant is the whole character at T1 and a rounding error at T5.
  `StanceModifiers` deliberately has no flat fields; do not add one.
- **No Stance may change Max HP.** Resizing the pool means preserving HP percentage across
  a switch the player never asked for. A survival posture buys its survival with plating,
  a damage-taken multiplier, and an offensive sacrifice.
- **Incoming damage uses `damageTakenPct`, never `damageReduction`.** The additive DR pool
  clamps to [0, 0.9], which silently discards a Stance's "you take more damage" drawback for
  any character without gear DR, and lets the upside compound into the shared cap.
- Recovery-shaped effects **activate a fraction of the player's own Recovery rate**
  (`defense.recovery-active-pct`); they never grant flat Recovery.
- Use `mechanicEffects` only when an existing generic mechanic reader supports the design.
- Truly behavioral effects belong in the server Stance runtime, not in misleading stat keys —
  and every one of them must be written out in `behaviors` so the player can read it.
- Add renamed-ID migration before changing an ID that may exist in saves.

`NO_STANCE_ID` is reserved. It is not learned or crafted, has no modifiers, and contributes
0 destination RP. It exists so a Rune may deliberately enter the neutral posture.

## Runic Point pricing

The full cost of an automated transition is:

```text
condition cost + destination Stance cost
```

`Switch Stance` itself costs **0 RP** (2026-09-02). The verb has no power of its own — every
gram of what a stance rule buys is the destination, which already carries its surcharge, so
charging for the verb taxed the axis twice and priced the cheapest possible transition like a
premium Rite. The destination surcharge is now the sole measure of how transformative a posture
is; price new Stances there, never by reaching for the action cost.

The selected default Stance is free. `No Stance` has a zero destination surcharge, so a rule
entering the neutral posture costs only its condition. Each rule pays its own destination cost,
even if several rules target the same Stance.

Always quote a rule's price through `runeRuleCost` — never `action.cost` plus a guess.

Use cost as an opportunity-cost lever, not as a substitute for a coherent tradeoff:

- 1 RP: restrained introductory or narrow posture;
- 2 RP: meaningful general-purpose mode;
- 3 RP: strong or highly enabling mode;
- 4+ RP: transformative mode that can define a state loop.

These are relative authoring bands, not immutable balance values.

## Mechanical integration

Choose the smallest implementation seam that expresses the effect:

1. Static stats: add `modifiers`; the normal stance-stat recalculation applies them. Attack
   speed and evasion fold with the skill nodes (step 2a of `recalculatePlayerStats`); attack,
   plating and move speed are a Stance-owned multiplicative layer applied *after* the class
   affinity fold, so `+15% Attack` means x1.15 for every class at every gear level.
2. Existing generic mechanic: add a documented `mechanicEffects` entry and reader.
3. Combat event: register a deterministic listener in
   `server/src/systems/player/stances/stanceSwitch.ts`.
4. Time-based behavior: update it from the authoritative Stance tick using combat phase and
   `TracksCombat` state.
5. New Rune situation: add a general-purpose condition to `shared/src/runeDatabase.ts`, not
   a condition named for one Stance.

Runtime state keys must be namespaced with `stance.`. Switching must preserve unrelated
cooldowns, counters, statuses, class-mechanic progress, and HP percentage. Only one switch
may resolve per tick, and the shared minimum dwell time must remain authoritative.

Behavioral effects must use the combat pipeline when they are meant to interact with normal
damage, healing, ownership, or kill-credit rules. Any intentional bypass—such as direct,
lethal self-damage—must be explicit and tested.

## Progression and presentation

Every learnable Stance needs:

- a recipe in `shared/src/stanceRecipes.ts` with an intentional tier/mastery gate that is
  actually REACHABLE — the biome must have nodes at the recipe's tier, `requiredBiomeLevel`
  must be within `biomeLevelCap(tier, group)`, and `catalystCost` must name a live modifier
  family the biome is allowed to roll. `shared/src/data/recipeGates.test.ts` enforces all three;
- a visible entry in the Stance sanctum after it is learned;
- a destination token in the Rune wheel;
- a concept-icon mapping or dedicated asset in `client/src/ui/conceptIcons.ts`;
- readable effect text that exposes every static modifier, every server-side behavior, all
  thresholds/caps, any in-combat-only restriction, whether the Stance can kill the player,
  and the destination RP cost. A `gatedModifiers` half renders as its own rows carrying the
  threshold, and — where the surface knows the reader's HP — whether it is ACTIVE right now.

Effect text describes what the posture does once ACTIVE. It must never present a Rune-owned
condition as a Stance property: Enraged does not "activate below 25% HP" — a rule the player
built does that, and the Rune UI already says so.

The generic introductory pair should teach the system cheaply. More trajectory-defining or
sustain-heavy Stances should appear later, when enemies can provide meaningful counterplay.

## Authoring workflow

For each proposed Stance, answer these before implementation:

1. What combat state makes it desirable?
2. What makes the player leave it?
3. Does it exploit a state, push toward one, or both?
4. Which existing Rune conditions create useful transitions?
5. What is the real tradeoff?
6. Why is this a Stance rather than an Ability, Core, item, or Rite?
7. What destination RP band matches its influence?
8. Does it require static stats, a generic mechanic, a combat event, or timed state?
9. What naturally counters it?
10. Where does its recipe belong in progression?

Suggested proposal template:

```md
### Name

- Identity:
- Desired state:
- Exit pressure:
- Benefit:
- Tradeoff:
- State trajectory:
- Useful Rune transitions:
- Proposed destination RP:
- Progression gate:
- Implementation seam:
- Counterplay and risks:
```

## Verification checklist

A Stance is complete when tests demonstrate, as applicable:

- its static modifiers replace the previous Stance rather than stacking;
- neutral/default fallback works when its Rune condition becomes inactive;
- it can be selected only when learned, except for `No Stance`;
- destination RP participates in the shared budget and is server-authoritative;
- minimum dwell and one-switch-per-tick behavior hold;
- HP percentage and unrelated combat/class state survive switching;
- event, target-HP, aggro, combat-phase, or timing mechanics use authoritative state;
- death and kill credit are correct for any self-damage or damage rider;
- persistence rejects malformed destinations and preserves legal saves;
- the UI names the real destination, cost, effect, and tradeoff.
