# Stances — current state

- **Code audit:** 2026-08-09
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

## Catalog

First-pass values remain balance levers in `shared/src/stances.ts`.

| Stance | RP destination cost | Identity |
|---|---:|---|
| Offensive | 1 | Modest attack/tempo for lower protection |
| Defensive | 1 | Modest protection for lower attack |
| Tanking | 3 | Extreme survival with severe pressure loss |
| Enraged | 3 | Large dangerous-state offense |
| Perfection | 2 | Restrained high-control farming efficiency |
| Fleeting | 2 | Movement/evasion with severe offense loss |
| Berserker | 4 | High offense plus lethal 2% max-HP self-damage each second while combat state persists |
| Recuperating | 4 | Severe offense loss; 80% of OOC regeneration functions in combat |
| Predator | 3 | 50% reduced detection, movement, and a 75% opening-hit multiplier |
| Brawler | 3 | Diminishing incoming-damage reduction based on authoritative aggressor count, capped at 40% |
| Execute | 3 | Base attack penalty and 75% damage multiplier against targets at/below 25% HP |

Predator's opener is armed only while the posture is active out of combat and is consumed by the first hit. Berserker damage is deterministic, bypasses ordinary mitigation/shields/cheat-death/on-damage listeners, and can kill with the dedicated stance death cause.

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

- Loadout → Stances is a crest/sigil sanctum for choosing the free default.
- Loadout → Runes opens a horizontal destination wheel when `Switch Stance` is selected; its first sigil is the zero-cost neutral `No Stance` posture, followed by learned stance crests showing their RP surcharge.
- Overview shows the default/active stance and the total shared RP pool.
- Crafting contains recipes for all eleven stances across T2–T4 mastery bands.

New stances currently reuse the closest existing stance crests until dedicated concept art is authored.

## Coverage

`server/test/stances.test.ts` verifies destination rules, minimum dwell, stat replacement, unrelated cooldown/counter preservation, and HP-percentage semantics including a max-HP stance.

Known balance follow-ups: tune all magnitudes/costs/gates; decide whether post-combat Berserker damage is desirable with Lingering Battle; add authored icons and a client switch animation for the emitted event.
