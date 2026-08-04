# Stances — implementation export and rework context

- **Code audit:** 2026-08-04
- **Purpose:** self-contained handoff for an external design review and rework.
- **Historical rationale:** `docs/archive/stances-plan.md`; the older, more speculative Vanguard/Evasive concept is in `docs/archive/rune-system-plan.md` §5.

**Rule:** this document describes the current code first. Where historical plans disagree, the code is authoritative.

## Executive summary

Stances are a T2 loadout layer for combat posture. A character permanently learns stances through biome-mastery recipes, equips one `default` and one optional `reactive` stance, and has exactly one `activeStance` (or none). Only the active stance contributes effects.

The reactive slot does nothing by itself. The player must equip a rune rule whose action is `switch-stance`; while that rule's condition is true, the reactive stance is desired, and otherwise the default is desired. Changes are rate-limited by a 1.5 second cooldown and applied by a full server-side stat rebuild.

The machinery is complete across data, persistence, networking, server authority, client loadout UI, crafting, admin visibility, and a wiring test. The content is not mature: there are only three generic, Forest-sourced placeholder stances, all expressed as flat stat deltas. The current playtest roadmap calls them “the most placeholder-feeling content in the game” and says the default/reactive pair needs to become a real decision rather than a slider.

## Intended product role

The current approved intent is:

- Stances are persistent combat **postures**, not active abilities and not another equipment slot.
- Equipping is free after a stance is learned.
- There is one baseline/default posture and one reactive posture.
- Runes own **when** the reactive posture is used. Automated switching consumes runic-point budget.
- A stance changes **how the character fights** through stat or behavior tradeoffs.
- No stance equipped is a valid neutral baseline; the system is not a mandatory tax.
- Stances enter in T2 through Biome Mastery recipes. Boss-signature variants were anticipated but have not been authored.

This role sits between neighboring build systems:

| System | Owns |
|---|---|
| Abilities | Discrete Technique/Guard plays with their own trigger and cooldown behavior |
| **Stances** | One continuously applied posture, optionally changed reactively |
| Runes | Condition → action automation, including when to switch stance |
| Cores | Continuous role amplification rather than moment-to-moment posture |
| Rites | Always-equipped between-fight/OOC behaviors |

The original implementation deliberately chose a small `default + reactive` model instead of parameterizing every rune action with a stance target. That kept the rune rule shape as `{ conditionId, actionId }` and gave the `STANCE` channel one claim. Whether that constraint is still desirable is a rework decision, not an engine requirement.

An older pre-implementation concept explored behaviorally stronger identities:

- **Vanguard:** aggro lock with a major mobility penalty, with its defensive benefit deliberately questioned to avoid an automatic solo choice.
- **Evasive:** aggro drop, movement/evasion gain, and a severe damage/attack-speed penalty for retreats.
- Speculative Sniper, Berserk, and Juggernaut postures.

Those concepts are historical context, not shipped promises. The live implementation replaced them with generic Offensive/Defensive/Tanking stat packages.

## Current data and content

The catalog is `STANCE_DATABASE` in `shared/src/stances.ts`.

```ts
type StanceSlot = "default" | "reactive";

interface StanceDef {
  id: string;
  name: string;
  blurb: string;
  statEffects?: Partial<StatEffects>;
  mechanicEffects?: MechanicEffects;
  icon?: string;
}

interface EquippedStances {
  default: string | null;
  reactive: string | null;
}
```

Current definitions and exact placeholder values:

| ID | Live effect | Recipe gate | Cost |
|---|---|---|---|
| `offensive-stance` | `+25 attack`, `+10% attack speed`, `-5% damage reduction` | Forest level 7, tier 2 | 60 green essence + 2 Alacrity catalysts |
| `defensive-stance` | `+15% damage reduction`, `+20 plating`, `-15 attack` | Forest level 7, tier 2 | 60 green + 20 blue essence + 2 Volatility catalysts |
| `tanking-stance` | `+200 max HP`, `+30 plating`, `-10 attack`, `-20 speed` | Forest level 8, tier 2 | 70 green + 30 blue essence + 3 Brutality catalysts |

All magnitudes, costs, catalyst families, gates, and the concentration in Forest are marked as placeholders. The `icon` strings exist on definitions, but the current Loadout/Crafting presentation has no approved stance art and displays text/initial fallbacks.

`StanceDef.mechanicEffects` is supported by the stat fold, but no shipped stance uses it. There are no stance-specific combat listeners, threat hooks, auras, resource behaviors, or status effects.

## Acquisition and loadout authority

Recipes live in `shared/src/stanceRecipes.ts`; crafting and slotting live in `server/src/systems/player/economy/stanceCrafting.ts`.

Crafting a recipe:

1. Resolves the recipe ID.
2. Rejects an already learned stance.
3. Checks `recipeGroup` + `requiredBiomeLevel` and optional `requiredBossClear` outside the test room.
4. Checks and spends essence and catalysts.
5. Appends the stance ID to `knownStances` and dirties `tracksProgression`.

The test room bypass fills the required wallets before spending. `requiredBossClear` is supported structurally but unused by current content.

Slotting is an authoritative server intent. `setStanceLoadout(world, player, slot, stanceId)` rejects an unknown or unlearned non-null ID, writes that one slot, resets `activeStance` to the current default, performs a full stat rebuild, and dirties progression. It does not charge currency.

Current edge semantics:

- The same stance may occupy both slots; neither server nor client prevents it.
- Either slot may be null. A reactive stance can exist while the default is null.
- Changing either slot immediately resets the active posture to the default. The next world tick may move it to reactive if the rune condition is already true and the switch cooldown permits it.
- The loadout socket event has no result/ack event. Invalid changes fail silently from the client's perspective and are corrected by authoritative state.

## Persisted and networked state

All state lives inside the existing persisted/networked `TracksProgression` JSON slice:

```ts
knownStances: string[];
equippedStances: { default: string | null; reactive: string | null };
activeStance: string | null;
```

This required no SQL column migration and no new networked component. `PlayerView` exposes all three fields; the admin character record also exposes them.

Fresh characters start with no known/equipped/active stance. Hydration currently:

- filters `knownStances` through `validStanceIds`;
- accepts the stored `equippedStances` object as-is when present;
- restores stored `activeStance`, falling back to the stored default only when active is nullish.

Consequently, stale/removed IDs are pruned from the known pool but are not normalized out of equipped or active stance fields at hydrate time. A redesign that changes IDs or slot shape needs an explicit normalizer/mapping in `server/src/db/playerRepo.ts`.

Although described as derived runtime state, `activeStance` is persisted because the whole progression slice is saved. The tick reconciler eventually corrects it to the rune-derived desired posture.

## Runtime switching flow

The relevant world-tick sequence is:

```text
tick combat cooldowns/status durations
  → derive rune configuration and stamp server-only flags
  → run class mechanics / targeting / ability firing
  → updateStanceSwitch
  → movement / monsters / combat / defense
  → broadcast authoritative dirty slices at the normal delta cadence
```

`updateStanceSwitch` in `server/src/systems/player/stances/stanceSwitch.ts` computes:

```text
wantReactive = reactive is non-null AND rune.switchStance flag is true
desired      = wantReactive ? reactive : default
```

If `desired !== activeStance` and cooldown `stance.switch.cd` is ready, the server:

1. writes `activeStance = desired`;
2. starts `STANCE_SWITCH_COOLDOWN_MS = 1500`;
3. calls `recalculatePlayerEntityStats`;
4. marks `tracksProgression` dirty.

The cooldown is a remaining-duration counter in server-only `TracksCombat`; it is not a wall-clock timestamp and is not persisted. Important observable consequences:

- Initial activation from `null` to the default also starts the 1.5 second cooldown.
- When a condition turns on, reactive activation can be delayed until the previous switch's cooldown ends.
- When a condition turns off, reversion to default is delayed by the same rule.
- A threshold can therefore remain on the “old” side for up to roughly 1.5 seconds; this is hysteresis by lockout, not separate enter/exit thresholds.
- With no reactive stance, the rune flag is inert.
- With no default stance, clearing the condition eventually produces `activeStance = null` and removes all stance effects.

## Rune integration

The shared rune catalog owns the action and compatible triggers:

| Item | Current definition |
|---|---|
| Action | `switch-stance` — tier 2, action cost 2 RP |
| Channel | `STANCE`, single claim |
| Conditions | `in-combat`, `hp-below-25`, `has-debuff`, `target-casting`, `n-aggro-3` |
| Total rule cost | condition cost + 2 RP (currently 3 RP for the first three conditions; 4 RP for casting/surrounded) |
| Ownership | The action and all current condition vocabulary are in `STARTER_RUNE_IDS`; stance recipes are the actual progression gate |

The rune fold exposes `DerivedRuneConfig.switchStance`; `server/src/systems/combat/ai/runeConfig.ts` stamps it as the server-only `rune.switchStance` flag every tick. The stance system only reads that boolean. It does not know which condition produced it.

There is no manual mid-combat switch intent. The player changes loadout slots; live reactive switching belongs exclusively to runes.

## Effect application and stat-order details

`shared/src/systems/stats.ts` rebuilds player stats from base values, skills, the active stance, rites, equipment/upgrades, and later class/core layers. A stance's effects are re-derived from its ID on every rebuild; effects are not incrementally added/removed.

Supported stance stat fields are the `StatEffects` fields used by the shared pipeline: attack, plating, damage reduction, evasion, attack range, attack speed percentage, max HP, HP regeneration, and speed. Mechanic effects merge into `usesSkills.passives`.

Two implementation details matter to a rework:

1. Stance `damageReduction` is intentionally deferred until after equipment. This preserves a negative DR tradeoff instead of letting the intermediate `[0, 0.9]` clamp erase it. A final clamp runs afterward.
2. The stance fold only accumulates **positive** evasion (`evasion > 0`). A negative evasion tradeoff authored in a stance would currently be ignored.

Switching calls the entity-level full rebuild, not a stance-only delta layer. That wrapper also resets or reconciles unrelated runtime mechanics, including:

- Cadence threshold counters, speed stacks, and Rampage state when the player has cadence.
- Hardening and Hardening max-DR progress.
- Stationary DR and sustained-fight DR ramps.
- Reactive Plating and Bramble Plating runtime bonuses.
- Energy max, attackability markers, evasion component presence, dev invulnerability, and hitbox shape.

This means a legal 1.5-second stance switch can reset combat progress owned by other systems. It also dirties damage, mitigation, attack, health, position, skills, and sometimes archetype slices. Any redesign that increases switch frequency should first decide whether stance effects still warrant a full rebuild.

`recalculatePlayerEntityStats` changes `maxHp` but does not rescale or immediately clamp current `hp`. Switching away from Tanking Stance can temporarily leave current HP above the new maximum until another path clamps or damage reduces it. A rework must choose explicit max-HP transition semantics.

## Client and operations surface

Current player flow:

- Crafting → Make includes stance recipes alongside gear, abilities, rites, and runes. Locked entries name their biome-level requirement and the detail pane shows the stance's effects.
- Loadout → Overview shows Default and Reactive sockets and marks the currently active one.
- Loadout → Stances lets the player select either slot from `knownStances` or clear it.
- Loadout → Runes composes the condition → `Switch Stance` rule and shows RP budget.
- The section is progressively revealed at numeric `playerTier >= 2` or retained by any known/equipped/active stance ownership.
- Desktop and mobile use the same authoritative view/visibility policy.

The admin Characters tab is read-only for this system: it shows default, reactive, active, and known-count. Reset Progress clears learned, equipped, and active stance state. There is no stance-specific grant action.

Protocol surface:

```text
client → server: stance:craftRecipe(recipeId)
client → server: stance:setLoadout({ slot, stanceId })
server → client: stance:craftResult({ recipeId, success, reason? })
PlayerView: knownStances, equippedStances, activeStance
```

## Current coverage

`server/test/stances.test.ts` is a DB-free wiring test that verifies:

- a null active stance resolves to the default;
- Offensive's attack delta folds;
- the anti-thrash cooldown blocks an early low-HP switch;
- the reactive Defensive stance activates after the cooldown;
- attack and damage-reduction deltas replace rather than linger;
- recovery above the threshold reverts to default after the cooldown.

Not currently covered by this test: crafting/costs, persistence normalization, duplicate slots, null-default behavior, max-HP transitions, mechanic-effect stances, all five allowed rune conditions, loadout socket validation, client presentation, or the full-rebuild side effects listed above.

## Known gaps and review pressure

These are the main reasons a content/design rework is warranted:

- **Only three choices, all generic.** Offensive/Defensive/Tanking are mostly a scalar exchange among damage, mitigation, and bulk.
- **The pair is not yet a strong tactical expression.** Current roadmap criterion: “the default/reactive pair presents a real decision, not a slider.”
- **No biome identity.** All three recipes come from Forest; there is no broader T2–T4 stance catalog.
- **No behavior-changing stances.** Threat, aggro, movement mode, crowd-control resistance, party support, on-hit riders, and posture-specific combat hooks are absent.
- **No signature/evolution path.** `requiredBossClear` exists but no boss stance does; ranks and evolution are not modeled.
- **Full-rebuild coupling.** Switching resets unrelated runtime mechanics and may be too expensive/disruptive for a richer switch model.
- **Transition rules are underspecified.** Max-HP changes, attack cadence, current resource preservation, cooldown behavior, and switching while disabled/dead need explicit product rules.
- **Persistence normalization is incomplete.** Known IDs are filtered, equipped/active IDs are not.
- **Feedback is limited.** The loadout marks the active socket, but there is no dedicated world event/animation/combat-log entry for a posture change and no loadout failure result.

## Decisions the external rework should return

A useful rework proposal should answer these questions explicitly:

1. What is the unique player-facing job of Stances beside Cores, gear, abilities, and runes?
2. Are stances primarily stat tradeoffs, behavior packages, or a controlled mix?
3. Is `default + one reactive` still the desired model? If not, how does a rune identify a target without making rule configuration opaque?
4. Does rune automation remain the only live switching path? Is manual switching needed, and if so what cost/cooldown applies?
5. What switch hysteresis is intended: fixed lockout, per-stance cooldown, enter/exit thresholds, minimum dwell time, or another model?
6. What happens to current HP, attack timers, class counters, buffs, shields, and defensive ramps when a posture changes?
7. Which effects may stack with gear/skills/cores, which are exclusive, and where are caps applied?
8. How many meaningful stances should exist by the end of T2, T3, and T4, and how are they distributed across biomes/bosses?
9. Are the current IDs/save data migrated, mapped into replacements, refunded, or intentionally wiped?
10. What information must the player see to understand why a switch happened and what changed?

## Implementation blast-radius checklist

Use this when converting an external design back into the repository:

- **Catalog/effects:** `shared/src/stances.ts`, `shared/src/passives.ts`, `shared/src/systems/stats.ts`.
- **Recipes/gates/costs:** `shared/src/stanceRecipes.ts`; validation is exported through shared boot checks.
- **State shape/defaults/migration:** `shared/src/components/core/networkedSlices.ts`, `server/src/db/playerRepo.ts`, admin reset, test/bench fixtures.
- **Switch semantics:** `server/src/systems/player/stances/stanceSwitch.ts` and its position in `server/src/world/World.ts`.
- **Rune semantics:** `shared/src/runeDatabase.ts`, `server/src/systems/combat/ai/runeConfig.ts`, and client rune descriptions if new configuration is introduced.
- **New combat behavior:** register listeners only through `server/src/systems/combatBootstrap.ts` so live server and benchmarks match.
- **Protocol/view:** `shared/src/protocol/socketEvents.ts`, `shared/src/protocol/views.ts`, `shared/src/protocol/admin.ts`; update shared contracts before server/client handlers.
- **Client:** atoms/sync, `client/src/ui/StancesPanel.tsx`, Loadout overview, Crafting Make entries, icons/effect descriptions, progressive disclosure.
- **Operations:** admin Characters view plus reset/grant behavior.
- **Verification:** expand `server/test/stances.test.ts`; run `pnpm typecheck` and `pnpm test`.

Hard project constraints remain: the server decides all gameplay; the client sends intents and renders authoritative state; component presence gates behavior; new runtime combat state should not be persisted; and static cross-boundary definitions belong in `shared/`.
