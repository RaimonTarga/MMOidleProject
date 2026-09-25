# Rune System Current State

Snapshot of what is implemented right now. The working rework proposal lives in
`docs/archive/rune-system-plan.md`.

## Core Model

The live rune catalog and pure fold live in `shared/src/runeDatabase.ts`.

A rune rule is one condition wired to one action:

```ts
export interface EquippedRule {
  conditionId: string;
  actionId: string;
  targetAbilityId?: string;
  targetStanceId?: string;
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
- `RESOURCE_MAINTENANCE`
- `GLOBAL_STRATEGY`
- `PATH_SAFETY`
- `APPROACH_STYLE`
- `TRAVEL_PATHING`
- `TRAVEL_RESPONSE`
- `CONTROL`
- `ABILITY` (per-ability timing, runtime execution arbitration)
- `STANCE`

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
- `target-casting` (shown as "Enemy Charging")
- `target-max-stacks` (shown as "Fully Afflicted") — Technique channel only. Active while a
  STACKING damage-over-time you own on your current target is at its own ceiling: the
  moment Contagion has the most to copy and Detonate the most to cash in. Measured
  server-side through the DoT inventory, so a future T4 DoT path drives it with no change
  here. **Weapon reservoirs deliberately do not count** — they are `maxStacks: 1`
  internally and would make the condition permanently true. Starter vocabulary; inert
  rather than hidden for a build with no stacking DoT, exactly like `before-empowered` for
  a class with no empowered attack (rune CONDITIONS carry no `requiredArchetype`; only
  actions do).
- `inside-telegraph` (shown as "Inside Telegraph")
- `while-traveling` (shown as "While Traveling")

Actions:

- `chase-enemy`
- `flee`
- `orbit` (shown as "Keep Distance")
- `step-back` (shown as "Step Back")
- `follow-and-assist`
- `focus-closest`
- `focus-lowest-hp`
- `let-dots-finish` (shown as "Let DoTs Finish"; DoT classes only)
- `spread-dots` (shown as "Spread DoTs"; DoT classes only)
- `tactical-reload` (shown as "Reload Safely"; reload classes only)
- `wait-for-execution` (shown as "Ready Execution"; cooldown classes only)
- `wait-for-summons` (shown as "Rebuild Formation"; summoner classes only)
- `wait-for-regen` (shown as "Recover First")
- `auto-path-enemy` (shown as "Find Enemies")
- `avoid-hazards`
- `avoid-enemies`
- `fight-back` (shown as "Fight Back")
- `lead-the-way`
- `taunt-current-target` (shown as "Taunt Target")

New players start with all situation fragments as baseline vocabulary, including
`inside-telegraph`, plus the responses required by the default loadout and a small
set of basic timing/party responses. Additional responses come from one-time rune
forge recipes. `step-back` unlocks at Cave mastery level 2.

Reload Safely, Ready Execution, and Rebuild Formation are baseline class actions,
available without crafting but absent from the default loadout. The editor only
shows them to the matching archetype (including its later class evolutions). The
old reload/execution recipes are deprecated, hidden, and rejected by the server;
their IDs remain valid for saved crafting history. Each action costs 1 RP.

With **Always**, these actions hold as soon as active combat ends, even during the
combat grace period. **Out of Combat** waits until that period expires. Active
combat takes priority. Rebuild Formation waits for missing formation slots only,
never for living summons to reach full HP, and prevents autonomous summon pulls
while rebuilding. Maintenance actions compose with Recover First and Wait It Out.

## Budget

Budget is simple per-rule cost for now:

```ts
ruleCost = condition.cost + action.cost
```

The shared RP budget covers attuned abilities, attuned stances, Rune rules and Rites. `runicPointLoadoutCost` is authoritative for all four. Capacity is seeded at `16 + floor(Global Mastery / 5)`; both constants and authored prices are easy to tune. See [Runic attunement](runic-attunement-current-state.md) for migration, over-budget preservation and editing rules.

`use-ability` carries an attuned `targetAbilityId`; custom timing replaces only that ability's authored default. Active targets retain Rune priority, with combat arbitration deciding which can execute. Stance switching targets attuned postures and pays only logic, never the stance reservation again.

## Rune Forge

Rune forge recipes live in `shared/src/runeRecipes.ts`. Single kind: `unlock-rune` (unlocks one
condition or response fragment). The `increase-rune-points` kind was retired in Step 5.

**Gating (Step 5):** recipes carry a biome-mastery gate (`recipeGroup` + `requiredBiomeLevel`) and/or a
boss gate (`requiredBossClear`). The shared predicate `isRuneRecipeUnlocked(recipe, { biomeLevel,
bossesCleared })` is the single authority used by both server and the forge UI. All current (basic)
runes are biome-gated; the boss channel is reserved for the advanced/signature runes Step 13 will add.
`requiredBiomeLevel` values are placeholders pending the balance pass. Crafting is one-time, costs
essence; the test room bypasses gates.

The server applies rune forge crafts through
`server/src/systems/player/economy/runeCrafting.ts`. It validates:

- recipe id exists,
- recipe has not already been crafted,
- `isRuneRecipeUnlocked` (biome level / boss clear) passes unless in test room,
- unlock recipes point at a known rune fragment,
- the player has enough essence.

On success, the server records the recipe id in `runeRecipesCrafted`, rebuilds `runesOwned` from
starter fragments plus crafted unlock recipes, and marks `tracksProgression` dirty.

## Default Loadout

New characters start with a mutable default loadout:

```ts
[
  { conditionId: "always", actionId: "auto-path-enemy" },
  { conditionId: "in-combat", actionId: "chase-enemy" },
  { conditionId: "always", actionId: "wait-for-regen" },
  { conditionId: "hp-below-25", actionId: "flee" },
  { conditionId: "while-traveling", actionId: "fight-back" },
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
- unresolved hostile telegraph geometry at the player's current position
- whether a server-owned map-travel path is active

The derived rune result is translated into existing AI controls:

- `flee` sets `rune.flee`
- `orbit` sets `rune.keepDistance`
- `inside-telegraph -> step-back` sets `rune.evadeTelegraph`
- `wait-for-regen` sets `rune.waitForRegen`
- `wait-for-execution` sets `rune.waitForExecution`
- `wait-for-summons` sets `rune.waitForSummons` while a formation slot is absent and neither owner nor surviving summons are fighting
- `tactical-reload` sets `rune.tacticalReload`
- `follow-and-assist` sets `rune.followLeader` and `focusLeaderTarget`
- `lead-the-way` sets `rune.leadTheWay` and uses the same local enemy-search
  behavior as `auto-path-enemy` while out of combat
- `taunt-current-target` sets `rune.tauntCurrentTarget`
- `let-dots-finish` sets `rune.letDotsFinish`
- `spread-dots` sets `rune.spreadDots`
- `avoid-enemies` sets `rune.avoidEnemies`
- `while-traveling -> fight-back` sets `rune.fightBackWhileTraveling`
- `always -> auto-path-enemy` can claim search even while combat state is active,
  so scouting does not wait for combat to fully drop
- targeting actions map onto existing `AutocombatConfig` priority/focus fields
- `auto-path-enemy` expands acquisition radius to node-wide range
- map traversal keeps its own player-controlled `autoTraverse` setting; Rune
  travel responses only affect the active path while it is being followed

Rune combat state means an active live attack target or active monster aggro. It
does not include the post-combat regeneration cooldown, allowing recovery and
resource-maintenance rules to stop scouting immediately after a fight while HP
regeneration itself still observes `COMBAT_REGEN_DELAY`.

## AI Consumers

`rune.flee` is read by `server/src/systems/combat/ai/targetPriority.ts`.

`rune.evadeTelegraph` is read before ordinary chase/orbit/maintenance steering by
`server/src/systems/combat/ai/autoTarget.ts`. It searches nearby standable points
and chooses the shortest sampled escape outside the hostile telegraphs that
actually contain the player. Acquisition attaches the server-only
`evadesTelegraphs` movement owner keyed by those runtime ground-zone IDs. Crossing
the raw telegraph boundary stops further Step Back motion but does not detach the
owner: Chase and Orbit continue to yield until every tracked cast authoritatively
resolves or disappears. A newly overlapping cast that contains the player joins
the response deterministically; unrelated node telegraphs do not. Manual movement
and Flee remain higher authority and explicitly interrupt the response.

`avoid-hazards` remains a separate pathing-channel response for persistent node
features. Step Back owns first while its imminent attack is pending; immediately
after that response ends, Avoid Hazards may acquire if the player is still in
harmful terrain. It does not treat pending attack telegraphs as persistent terrain.

With Avoid Hazards on, approaching or pulling a target that sits in a hazard has a
per-target budget (`server/src/systems/combat/ai/blockedApproach.ts`). If that approach
makes no contact and deals no damage for 15 s, the target is deferred from selection
for 30 s. Each target keeps its own clock. A brief switch to another target does not
restart it; only contact, damage, leaving the target alone for longer than the 30 s
deferral window, or turning avoidance off does. Before this, a one-tick selection
flicker reset the clock, and a Volcanic player circled a lava pool's rim for minutes.
Selection also keeps its current target through a failed safe-path check if that
target passed the check within the last second (`PATH_LOSS_GRACE_MS` in
`targetPriority.ts`). A target that stays unreachable is dropped after that
(`server/test/hazardApproachTargetFlicker.test.ts`).

Avoid Hazards also never *starts* a fight with an enemy sheltered in a hazard:
selection and the idle roam skip un-aggroed monsters within 64 px
(`HAZARD_TARGET_CLEARANCE`) of an avoided hazard shape, which ended a
chase-to-edge / escape / re-acquire loop. A monster seen inside stays skipped for
5 s after leaving (`hazardSheltersTarget` in `blockedApproach.ts`) so edge-dippers
cannot flip acquisition. Monsters already aggroed on the player are exempt and are
answered through the pull/skirt logic above. In practice this pre-empts the
path-loss grace for un-aggroed hazard targets; the grace still covers other
path failures.

`rune.keepDistance`, `rune.waitForRegen`, `rune.waitForExecution`, and
`rune.tacticalReload` are read by `server/src/systems/combat/ai/autoTarget.ts`.

`rune.followLeader` and `rune.leadTheWay` are read by party automation systems.
The effective automation leader is the first party roster member with
`lead-the-way`; if nobody is leading by rune, the stored party leader remains the
default. If multiple players choose `lead-the-way`, the first one in the party
roster wins. Players with `follow-and-assist` follow the effective leader out of
combat and assist the leader's current target in combat.

`auto-path-enemy` currently reuses the existing auto-targeting/approach loop with
a very large acquire radius so the player can find valid enemies anywhere in the
current node. Plain `nearest` / `focus-closest` selection is a strict geometric
distance ordering followed by the existing path-reachability check; threat,
quest, cluster, and empowered-attack score bonuses cannot select a farther target,
and the normal target-switch margin is not applied. Explicit targeting strategies
such as `let-dots-finish`, `spread-dots`, and party leader focus continue to use
the weighted scorer. It does not route to other nodes.

`tactical-reload` claims the resource-maintenance channel independently from
recovery rules such as `wait-for-regen`. It is read by the reload archetype to
start a partial-clip reload after active combat ends, accelerate that OOC reload,
and pause autonomous movement until it completes. Without the rune, partial clips
remain spent; empty-clip reloads remain core class behavior and progress at normal
speed.

`wait-for-regen` stops autonomous movement as soon as active targets and aggro are
gone, including during the post-combat regen cooldown. Once regeneration is
allowed, it keeps the player stopped until HP is full. Damaging terrain suppresses
Recovery, so if the player is standing in a damaging hazard (static feature or
damaging pool) Recover First first walks out of it, with or without Avoid
Hazards, then holds. Status-only slows such as Jungle bushes do not trigger this.

`wait-for-execution` stops cooldown classes until their execution is armed
(`hasEmpoweredAttack`), then normal targeting/search resumes. Its condition chooses
immediate disengagement (`always`) or grace-period expiry (`when-idle`), as with
Reload Safely and Rebuild Formation.

`avoid-hazards` and `careful-pulling` now use independent channels, so a player
can safely approach a target without losing either behavior. `avoid-enemies` is
a phase-one travel-safety response: it keeps the existing server path but scores
several points along the mandatory exit edge, preferring lower exposure to
unengaged nearby monsters rather than rewriting the world route.

`fight-back` pauses a map-navigation path when a player is actively attacked,
lets the normal combat target loop own that interruption, and resumes the same
path after active combat, its grace period, and any higher-priority maintenance
hold have cleared. Flee preserves the route; death clears it.

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

## Telegraph Dodge Telemetry

The buffered analytics stream retains edge-triggered `rune-activation`, per-zone
`telegraph-dodge-attempt`, resolution-time `telegraph-dodge-success`, and
`telegraph-dodge-failure` totals. Bot-visible world-log artifacts additionally
record transition-only `activation -> attempt -> safe/reenter -> resolution ->
result -> release` events with runtime telegraph identity/type/owner, acquisition
time, starting position and circle geometry, selected escape point, first-safe
time, authoritative resolution/release times, release reason, pre-resolution
re-entry, outcome, and actual HP damage. No per-tick logging is emitted.

## Persistence And Protocol

Rune ownership and equipped loadout live on `TracksProgression` in
`shared/src/components/core/networkedSlices.ts`:

```ts
runesOwned: string[];
runeRecipesCrafted: string[];
runesEquipped: EquippedRule[];
// runePointBonus removed in Step 5 — RP budget is derived from Global Mastery.
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

`client/src/ui/BuildRunesTab.tsx` is the current rune panel. It is one tab of the
shared arrangement dialog (`client/src/ui/BuildPanel.tsx`), alongside Abilities,
Stances and Rites; each of the four has its own rail entry. Rune *recipes* live
in Crafting, not here.

The rune board groups rules by their actual behavior channel. Within each group,
connected numbered rows run top to bottom; the first matching rule wins. Different
groups can act together. Reorder controls only move rules within their group.
Each row and the pinned draft show the same condition -> response sentence.

- The Runic Point meter uses colored segments and a numeric legend for Abilities,
  Stances, Logic, Rites, and available budget.
- Add/edit opens a focused When/Do editor with compatible, owned responses.
- Picking When or Do collapses its choices into a compact summary with a Change
  button. Changing When clears dependent draft choices; changing Do clears its
  target. Ability and stance pickers receive focus and appear directly below
  the summaries. Saved rules remain unchanged until the draft is submitted.
- Ability responses display the named attuned ability and authored default; their ability binding
  remains visible in the selected description. Empty bindings cannot be saved.
- Stance destinations wrap in a grid, show total rule cost, and explain the return
  to the default stance. Selecting a step scrolls its next choices into view.
- Saving preserves priority; same-condition/channel collisions explicitly replace
  the existing rule. Only suppressed/redundant rules get conflict warnings.
- Attunement lives in the Abilities and Stances tabs. Redundant inline attunement
  sections and illustrative preview controls have been removed.
- Budget validation, authoritative request/result handling, and an inline reset
  confirmation remain in place.

The Behavior panel now lives on the right desktop rail, with stance information
removed from the health crown. On narrow screens it is available in the character
sheet. It keeps the stance and current action visible; its header toggles the
trigger and recent ability feedback, remembering that preference locally. It
omits secondary matching rules, Always triggers, and default/temporary labels.
Ability activation feedback comes from actual combat events, not cooldown guesses.

Ability details and crafting comparisons expose authored default firing behavior.
Equipped ability details and HUD tooltips distinguish that default from configured
Rune timing, including that the ability waits when no overriding condition matches.
Rune action descriptions show the actual ability and retain the current position
binding: replacing an equipped ability changes which ability that rule controls.
The build dialog offers an optional, reversible wider desktop view. The current
The board now includes unified RP attunement; Rite mechanics are unchanged;
ability/stance attunement remains a future systems change.

The server exposes an optional `matchedRunes` snapshot from the authoritative rune
fold, including stance destinations. Active-rune attribution uses that snapshot
instead of finding the first equipped rule with the same action. A matching rule
is a selected instruction, not proof that an ability fired. This is presentation
telemetry only; it observes the authoritative Rune and attunement runtime.

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
- `client/src/ui/BuildRunesTab.tsx`
- `client/src/ui/BuildPanel.tsx`
- `client/src/hud/atoms.ts`
- `client/src/hudBus.ts`
- `client/src/input/hudEvents.ts`
- `client/src/net/intents.ts`
