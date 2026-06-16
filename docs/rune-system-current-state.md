# Rune System Current State

Snapshot of what is implemented right now. The working rework proposal lives in
`docs/rune-system-plan.md`.

## Core Model

The live rune catalog and pure fold live in `shared/src/runeDatabase.ts`.

A rune rule is one condition wired to one action:

```ts
export interface EquippedRule {
  conditionId: string;
  actionId: string;
}
```

Rules are ordered. Every server tick, the fold evaluates rules from top to bottom.
The first active rule in each behavioral channel claims that channel for the
tick; later rules in the same channel are ignored for that pass.

The equipped rule list is the priority system: rule 1 is checked first, rule 2
next, and so on. Priority is per channel, so one movement rule and one targeting
rule can both win on the same tick.

Current channels:

- `MOVEMENT`
- `TARGETING`
- `OOC_MAINTENANCE`
- `GLOBAL_STRATEGY`

`GLOBAL_STRATEGY` is suppressed while the player is in combat, except for
`lead-the-way`, which remains active as a party role marker.

Rules also have catalog-level compatibility restrictions. For example, targeting
responses only pair with combat/party-aware situations, and search responses pair
with always, out-of-combat, or party situations. The client uses the same compatibility
helper as the server, so impossible responses are hidden in the UI and rejected
by server sanitization.

## Current Catalog

Conditions:

- `always`
- `in-combat`
- `when-idle` (shown as "Out of Combat")
- `hp-below-25`
- `in-party` (shown as "In A Party")
- `n-aggro-3` (shown as "Surrounded")

`target-casting` is kept only as a commented future hook in code; it is not in
the live catalog or UI.

Actions:

- `chase-enemy`
- `flee`
- `orbit` (shown as "Keep Distance")
- `step-back` placeholder
- `follow-and-assist`
- `focus-closest`
- `focus-lowest-hp`
- `focus-shielded` placeholder
- `tactical-reload` (shown as "Reload Safely")
- `wait-for-regen` (shown as "Recover First")
- `auto-path-enemy` (shown as "Find Enemies")
- `lead-the-way`

The system still grants all fragments to every player until acquisition ships.

## Budget

Budget is simple per-rule cost for now:

```ts
ruleCost = condition.cost + action.cost
```

The current budget helper is tuned for playtest:

```ts
runeBudgetForTier(playerTier) = 8 + playerTier * 2
```

That base budget intentionally fits the mutable starter loadout with party
follower defaults.

## Default Loadout

New characters start with a mutable default loadout:

```ts
[
  { conditionId: "when-idle", actionId: "tactical-reload" },
  { conditionId: "in-party", actionId: "follow-and-assist" },
  { conditionId: "in-combat", actionId: "chase-enemy" },
  { conditionId: "in-combat", actionId: "focus-closest" },
  { conditionId: "always", actionId: "auto-path-enemy" },
]
```

Players can change or remove these rules. A future UI affordance should add a
"reset to basic loadout" button.

## Server Authority

The server owns all gameplay effects.

`server/src/systems/combat/ai/runeConfig.ts` runs `updateRuneDerivedConfig()` once
per live player each world tick. It builds the live rune context from:

- HP percent
- combat state
- party membership
- aggro count

The derived rune result is translated into existing AI controls:

- `flee` sets `rune.flee`
- `orbit` and temporary `step-back` set `rune.keepDistance`
- `wait-for-regen` sets `rune.waitForRegen`
- `follow-and-assist` sets `rune.followLeader` and `focusLeaderTarget`
- `lead-the-way` sets `rune.leadTheWay` and uses the same local enemy-search
  behavior as `auto-path-enemy` while out of combat
- `always -> auto-path-enemy` can claim search even while combat state is active,
  so scouting does not wait for combat to fully drop
- targeting actions map onto existing `AutocombatConfig` priority/focus fields
- `auto-path-enemy` expands acquisition radius to node-wide range
- `autoTraverse` is stamped false; overworld auto-traverse is no longer the rune
  strategy action

## AI Consumers

`rune.flee` is read by `server/src/systems/combat/ai/targetPriority.ts`.

`rune.keepDistance` and `rune.waitForRegen` are read by
`server/src/systems/combat/ai/autoTarget.ts`.

`rune.followLeader` and `rune.leadTheWay` are read by party automation systems.
The effective automation leader is the first party roster member with
`lead-the-way`; if nobody is leading by rune, the stored party leader remains the
default. If multiple players choose `lead-the-way`, the first one in the party
roster wins. Players with `follow-and-assist` follow the effective leader out of
combat and assist the leader's current target in combat.

`auto-path-enemy` currently reuses the existing auto-targeting/approach loop with
a very large acquire radius so the player can find valid enemies anywhere in the
current node. It does not route to other nodes.

`tactical-reload` currently claims the OOC maintenance channel. Reload classes
already auto-start an out-of-combat reload when their clip is partially spent, so
no separate reload command has been added yet.

## Persistence And Protocol

Rune ownership and equipped loadout live on `TracksProgression` in
`shared/src/components/core/networkedSlices.ts`:

```ts
runesOwned: string[];
runesEquipped: EquippedRule[];
```

They persist through `server/src/db/playerRepo.ts`.

The client-to-server socket event is defined in
`shared/src/protocol/socketEvents.ts`:

```ts
"rune:setLoadout": (rules: EquippedRule[]) => void;
```

The handler in `server/src/index.ts` validates:

- payload is an array,
- condition/action ids exist in the catalog,
- player owns both fragments,
- rules fit inside the current budget in order.

Rules that do not fit or are invalid are skipped.

## Client UI

`client/src/ui/RunesPanel.tsx` is the current rune panel. It:

- reads `runesOwnedAtom`, `runesEquippedAtom`, and `playerTierAtom`,
- shows a chunked rune point meter with spent and leftover points,
- lists equipped priority rules before the rule builder,
- lets players move equipped rules up or down to change priority,
- lists owned condition fragments and action fragments,
- uses player-facing "Situation" and "Response" wording,
- shows condition/action costs in visible RP badges,
- shows action channels with color-coded side bars,
- only shows response choices that fit the selected situation,
- shows rune points as visual chunks,
- previews named rule text when available,
- blocks adding a rule that would exceed budget locally,
- sends changes through `hudBus.requestSetRuneLoadout()`.

The server remains authoritative even though the client performs a local budget
check for usability.

## Current Gaps

Still not implemented:

- fragment acquisition from quests/bosses/hidden unlocks,
- editable parameters for threshold conditions,
- drag reorder UI,
- reset-to-basic-loadout button,
- real target-casting telegraphs,
- real shielded-target tagging,
- taunt stance/mechanic,
- Rune Malfunction death attribution,
- dedicated rune debugger/logging.

## Relevant Files

- `shared/src/runeDatabase.ts`
- `shared/src/components/core/networkedSlices.ts`
- `shared/src/protocol/socketEvents.ts`
- `server/src/systems/combat/ai/runeConfig.ts`
- `server/src/systems/combat/ai/targetPriority.ts`
- `server/src/systems/combat/ai/autoTarget.ts`
- `server/src/world/World.ts`
- `server/src/world/playerLifecycle.ts`
- `server/src/db/playerRepo.ts`
- `server/src/index.ts`
- `client/src/ui/RunesPanel.tsx`
- `client/src/hud/atoms.ts`
- `client/src/hudBus.ts`
- `client/src/input/hudEvents.ts`
- `client/src/net/intents.ts`
