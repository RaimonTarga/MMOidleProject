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

Avoid permanent encounter labels such as “boss stance,” “AoE stance,” or “single-target
stance.” Avoid adding Stance energy, capacity, charges, or another automation currency.

## Data contract

Stances are authored in `shared/src/stances.ts`:

```ts
interface StanceDef {
  id: string;
  name: string;
  blurb: string;
  runeCost: number;
  statEffects?: Partial<StatEffects>;
  mechanicEffects?: MechanicEffects;
  icon?: string;
}
```

Authoring rules:

- IDs are stable, lowercase kebab-case, and should normally end in `-stance`.
- Names and blurbs describe the posture and its tradeoff, not a recommended Rune rule.
- `runeCost` is the destination surcharge paid by every Rune rule targeting the Stance.
- Static numeric modifiers belong in `statEffects`.
- Use `mechanicEffects` only when an existing generic mechanic reader supports the design.
- Truly behavioral effects belong in the server Stance runtime, not in misleading stat keys.
- Add renamed-ID migration before changing an ID that may exist in saves.

`NO_STANCE_ID` is reserved. It is not learned or crafted, has no modifiers, and contributes
0 destination RP. It exists so a Rune may deliberately enter the neutral posture.

## Runic Point pricing

The full cost of an automated transition is:

```text
condition cost + Switch Stance action cost + destination Stance cost
```

The selected default Stance is free. `No Stance` has a zero destination surcharge, although
the condition and Switch Stance action still cost RP. Each rule pays its own destination
cost, even if several rules target the same Stance.

Use cost as an opportunity-cost lever, not as a substitute for a coherent tradeoff:

- 1 RP: restrained introductory or narrow posture;
- 2 RP: meaningful general-purpose mode;
- 3 RP: strong or highly enabling mode;
- 4+ RP: transformative mode that can define a state loop.

These are relative authoring bands, not immutable balance values.

## Mechanical integration

Choose the smallest implementation seam that expresses the effect:

1. Static stats: add `statEffects`; the normal stance-stat recalculation applies them.
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

- a recipe in `shared/src/stanceRecipes.ts` with an intentional tier/mastery gate;
- a visible entry in the Stance sanctum after it is learned;
- a destination token in the Rune wheel;
- a concept-icon mapping or dedicated asset in `client/src/ui/conceptIcons.ts`;
- readable effect text that exposes both benefit and drawback.

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
