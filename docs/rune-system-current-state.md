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
- `CONTROL`

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
- `let-dots-finish` (shown as "Let DoTs Finish"; DoT classes only)
- `spread-dots` (shown as "Spread DoTs"; DoT classes only)
- `tactical-reload` (shown as "Reload Safely"; reload classes only)
- `wait-for-execution` (shown as "Ready Execution"; cooldown classes only)
- `wait-for-regen` (shown as "Recover First")
- `auto-path-enemy` (shown as "Find Enemies")
- `lead-the-way`
- `taunt-current-target` (shown as "Taunt Target")

New players only start with the fragments required by the default loadout:
`always`, `auto-path-enemy`, `in-combat`, and `chase-enemy`. Additional live
fragments come from one-time rune forge recipes.

## Budget

Budget is simple per-rule cost for now:

```ts
ruleCost = condition.cost + action.cost
```

The current budget helper is tuned for playtest:

```ts
runeBudgetForTier(playerTier, runePointBonus) = 8 + playerTier * 2 + runePointBonus
```

That base budget intentionally fits the mutable starter loadout. Rune point
bonus recipes permanently increase the budget.

## Rune Forge

Rune forge recipes live in `shared/src/runeRecipes.ts`.

Recipe kinds:

- `unlock-rune`: unlocks one condition or response fragment.
- `increase-rune-points`: permanently increases maximum rune points.

Recipes show in the forge before their boss is cleared, but cannot be crafted
until their `requiredBossClear` token is present in `bossesCleared` (for example,
`forest:1`). Crafting is one-time only and costs essence. Test room bypasses cost
gates for playtesting.

The server applies rune forge crafts through
`server/src/systems/player/economy/runeCrafting.ts`. It validates:

- recipe id exists,
- recipe has not already been crafted,
- required boss clear is present unless in test room,
- unlock recipes point at a known rune fragment,
- the player has enough essence.

On success, the server records the recipe id in `runeRecipesCrafted`, rebuilds
`runesOwned` from starter fragments plus crafted unlock recipes, rebuilds
`runePointBonus` from crafted capacity recipes, and marks `tracksProgression`
dirty.

## Default Loadout

New characters start with a mutable default loadout:

```ts
[
  { conditionId: "always", actionId: "auto-path-enemy" },
  { conditionId: "in-combat", actionId: "chase-enemy" },
]
```

Players can change or remove these rules. The rune panel includes a confirmation
guarded reset button that restores this basic loadout.

## Server Authority

The server owns all gameplay effects.

`server/src/systems/combat/ai/runeConfig.ts` runs `updateRuneDerivedConfig()` once
per live player each world tick. It builds the live rune context from:

- HP percent
- combat state
- party membership
- aggro count
- combat archetype

The derived rune result is translated into existing AI controls:

- `flee` sets `rune.flee`
- `orbit` and temporary `step-back` set `rune.keepDistance`
- `wait-for-regen` sets `rune.waitForRegen`
- `wait-for-execution` sets `rune.waitForExecution`
- `follow-and-assist` sets `rune.followLeader` and `focusLeaderTarget`
- `lead-the-way` sets `rune.leadTheWay` and uses the same local enemy-search
  behavior as `auto-path-enemy` while out of combat
- `taunt-current-target` sets `rune.tauntCurrentTarget`
- `let-dots-finish` sets `rune.letDotsFinish`
- `spread-dots` sets `rune.spreadDots`
- `always -> auto-path-enemy` can claim search even while combat state is active,
  so scouting does not wait for combat to fully drop
- targeting actions map onto existing `AutocombatConfig` priority/focus fields
- `auto-path-enemy` expands acquisition radius to node-wide range
- `autoTraverse` is stamped false; overworld auto-traverse is no longer the rune
  strategy action

## AI Consumers

`rune.flee` is read by `server/src/systems/combat/ai/targetPriority.ts`.

`rune.keepDistance`, `rune.waitForRegen`, and `rune.waitForExecution` are read by
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

`wait-for-execution` stops cooldown classes out of combat until their execution
is armed (`hasEmpoweredAttack`), then normal targeting/search resumes.

`let-dots-finish` restores the old DoT-class behavior as an explicit rune:
targets whose current DoT projection should finish them receive a targeting
penalty, so the player can move pressure elsewhere. Without this rune, DoT
classes no longer abandon those targets by default.

`spread-dots` is a DoT-class multidot response. During target scoring it prefers
enemies missing the player's DoT, then enemies with expiring or incomplete DoT
stacks, so the player rotates pressure across multi-enemy fights.

`rune.tauntCurrentTarget` is read by
`server/src/systems/combat/ai/taunt.ts`. On direct player hits, it forces the
monster target to aggro that player unless the monster has `ignoresTaunts`. The
taunt response has a 4 second internal cooldown per player.

## Persistence And Protocol

Rune ownership and equipped loadout live on `TracksProgression` in
`shared/src/components/core/networkedSlices.ts`:

```ts
runesOwned: string[];
runeRecipesCrafted: string[];
runePointBonus: number;
runesEquipped: EquippedRule[];
```

They persist through `server/src/db/playerRepo.ts`.

The client-to-server socket event is defined in
`shared/src/protocol/socketEvents.ts`:

```ts
"rune:setLoadout": (rules: EquippedRule[]) => void;
"rune:craftRecipe": (recipeId: string) => void;
```

The server-to-client rune forge result is:

```ts
"rune:craftResult": (result: { recipeId: string; success: boolean; reason?: string }) => void;
```

The handler in `server/src/index.ts` validates:

- payload is an array,
- condition/action ids exist in the catalog,
- player owns both fragments,
- rules fit inside the current budget in order.
- class-specific responses match `usesSkills.combatArchetype`.

Rules that do not fit or are invalid are skipped.

Class specificity is based on `combatArchetype`, not class display names or
branch ids. That means every reload branch can use reload-only responses, and
every cooldown branch can use cooldown-only responses across tiers.

## Client UI

`client/src/ui/RunesPanel.tsx` is the current rune panel. It has two tabs:
Loadout and Forge.

The Loadout tab:

- reads `runesOwnedAtom`, `runesEquippedAtom`, `combatArchetypeAtom`, and
  `playerTierAtom`,
- shows a chunked rune point meter with spent and leftover points,
- lists equipped priority rules before the rule builder,
- lets players move equipped rules up or down to change priority,
- asks for confirmation before resetting to the default loadout,
- lists owned condition fragments and action fragments,
- uses player-facing "Situation" and "Response" wording,
- shows condition/action costs in visible RP badges,
- shows action channels with color-coded side bars,
- only shows response choices that fit the selected situation,
- hides class-specific responses unless the current combat archetype matches,
- shows rune points as visual chunks,
- previews named rule text when available,
- blocks adding a rule that would exceed budget locally,
- sends changes through `hudBus.requestSetRuneLoadout()`.

The Forge tab:

- reads essence, boss clears, owned runes, crafted rune recipes, and rune point
  bonus from HUD atoms,
- shows only recipes unlocked by current boss clears,
- marks crafted/unlocked recipes as done,
- sends craft attempts through `hudBus.requestCraftRuneRecipe()`,
- displays the authoritative `rune:craftResult` response.

The server remains authoritative even though the client performs a local budget
check for usability.

## Current Gaps

Still not implemented:

- quest/hidden rune recipe unlocks beyond boss-gated recipes,
- editable parameters for threshold conditions,
- drag reorder UI,
- real target-casting telegraphs,
- taunt stance/mechanic,
- Rune Malfunction death attribution,
- dedicated rune debugger/logging.

## Relevant Files

- `shared/src/runeDatabase.ts`
- `shared/src/runeRecipes.ts`
- `shared/src/components/core/networkedSlices.ts`
- `shared/src/protocol/socketEvents.ts`
- `server/src/systems/player/economy/runeCrafting.ts`
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
