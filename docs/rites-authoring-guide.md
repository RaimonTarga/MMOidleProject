# Rite authoring guide

This is the living design and implementation contract for adding or revising Rites. Exact
shipped values and behavior belong in `docs/rites-current-state.md`; the original rework
rationale is preserved in `docs/archive/rites-rework-design-handoff.md`.

## Design identity

Rites are passive rules that reshape the boundary between one combat and the next. Their
opportunity cost is paid entirely through the same Runic Point pool used by Rune automation
and Stance destinations.

A good Rite changes one of these transition axes:

- how long combat state lingers or how quickly recovery begins;
- what harmful state survives combat end;
- how much class-mechanic or Ability readiness carries into the next fight;
- what recovery occurs on a correctly attributed kill;
- another universal rule governing the end-to-start combat loop.

Rites are not generic passive-stat cards, a second talent tree, or a collection of damage
procs. Avoid permanent attack/defense bonuses, class-specific offensive riders, kill-chain
engines, enemy explosions, and effects that belong more naturally on gear, Abilities, Cores,
or class progression.

## Data contract

Rites are authored in `shared/src/rites.ts`:

```ts
interface RiteDef {
  id: string;
  name: string;
  blurb: string;
  runeCost: number;
  icon?: string;
}
```

Authoring rules:

- IDs are stable lowercase kebab-case.
- The blurb names the transition and its outcome in player-facing language.
- `runeCost` is paid once while the Rite is equipped.
- Rites have no slots, ranks, capacity stat, or separate currency.
- Add an explicit legacy-ID mapping before renaming an ID present in saves.
- Do not encode runtime behavior as unused passive stat keys; implement it at the shared
  combat-boundary seam.

Any number of learned Rites may be equipped if the total shared RP budget remains legal.

## Runic Point pricing

The authoritative loadout cost is:

```text
Rune rule costs + Stance destination costs + equipped Rite costs
```

Use relative bands:

- 1–2 RP: narrow timing preference or situational boundary adjustment;
- 3–4 RP: meaningful recovery or state-cleanup rule;
- 5+ RP: readiness restoration that directly affects another major build system.

Price against the automation and Stance transitions the player must give up. Do not assume
Rites have a separate budget, and do not add a slot cap to control strong effects.

## Mechanical integration

Rite runtime behavior belongs primarily in
`server/src/systems/player/rites/riteOoc.ts` and must use the authoritative combat phases:

```text
ACTIVE -> POST_COMBAT -> OUT_OF_COMBAT
```

Integration rules:

- Combat-timing Rites modify the shared transition delay.
- Combat-end Rites execute exactly once when the authoritative transition completes.
- On-kill Rites use player kill credit and normal healing/damage pipelines.
- Class-mechanic Rites provide comparable next-fight readiness through explicit
  archetype-specific mappings; identical arithmetic is not required.
- Harmful-effect cleanup must define treatment of stacked effects, instanced DoTs, anti-heal,
  slows, control, node hazards, ground zones, and intentionally persistent effects.
- Conflicting or opposed Rites need an explicit deterministic rule, documented in the
  current-state reference and covered by tests.
- Runtime state keys must be namespaced with `rite.` or the shared engagement namespace.

Do not create a private “out of combat” timer for one Rite. If a proposed effect exposes a
missing combat-boundary concept, improve the shared phase model instead.

## Progression and presentation

Every Rite needs:

- a recipe in `shared/src/riteRecipes.ts` with an intentional tier/mastery gate;
- an entry in the ritual-circle loadout UI;
- an RP cost visible beside its effect;
- a concept-icon mapping or dedicated asset in `client/src/ui/conceptIcons.ts`;
- server-side learned-ID, deduplication, and shared-budget validation;
- hydration behavior that cannot create an over-budget legacy loadout.

Keep the catalog deliberate. Add a new Rite because playtesting exposes a missing transition
choice, not merely because another trigger or proc can be invented.

## Authoring workflow

For each proposed Rite, answer these before implementation:

1. Which combat boundary or transition rule does it change?
2. What build or encounter pattern values that change?
3. What competing Rune, Stance, or Rite use makes its RP cost meaningful?
4. Why is the effect a Rite rather than gear, an Ability, a Core, or class progression?
5. Is it combat-timing, combat-end, kill-triggered, or next-fight readiness?
6. Which authoritative event or phase should drive it?
7. What happens when an opposed or overlapping Rite is equipped?
8. Which damage, heal, cooldown, resource, status, or kill-credit pipeline must it use?
9. What legacy-save and malformed-loadout behavior is required?
10. Where does its recipe belong in progression?

Suggested proposal template:

```md
### Name

- Identity:
- Transition axis:
- Trigger/boundary:
- Effect:
- Intended users:
- Competing choices:
- Proposed RP:
- Progression gate:
- Implementation seam:
- Conflict rule:
- Persistence concerns:
- Counterplay and risks:
```

## Verification checklist

A Rite is complete when tests demonstrate, as applicable:

- its effect occurs at the intended authoritative boundary;
- a combat-end effect fires exactly once per real transition;
- timing modifiers affect all consumers of the shared combat phase;
- opposed Rites resolve deterministically;
- harmful-state cleanup removes and preserves the explicitly documented categories;
- class-mechanic and Ability readiness affect only their intended state;
- player-owned direct, DoT, summon, and Ability kills receive correct attribution;
- healing and damage use normal pipelines unless a bypass is explicitly designed;
- no Rite slot cap is enforced;
- the combined Rune/Stance/Rite budget is validated atomically by the server;
- hydration filters invalid IDs, deduplicates, checks ownership, and stays within budget;
- the UI communicates learned/equipped state, effect, cost, and shared RP usage.
