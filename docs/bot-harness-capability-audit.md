# Solo bot capability and reliability audit

Live-source audit and hardening, 2026-09-11. This is infrastructure validation,
not balance evidence. Party experimentation is outside this pass.

## Architecture and findings

The production decision path remains `Socket.IO -> WorldMirror -> Observation ->
RouteExecutor / Policy -> Intents -> normal player handlers`. The mirror accepts
only the ordinary network protocol; no server internals enter bot decisions.
Server imports in `server/test/botBuildPreflight.test.ts` construct a **test fixture**,
not a bot execution path.

| Surface | Already sound | Fault / hardening |
|---|---|---|
| State | Full snapshots replace entities; component patches/removals feed the shared PlayerView composer. Progression already networks all four build categories. | Unknown-entity patches now trigger a full resync request. Disconnect clears mirror and roster. |
| Abilities | Authoritative ordered `attunedAbilities.techniques/guards`, known pool, shared RP calculation. | Bot subset matching missed clears, removals and priority changes. Now compares exact arrays and awaits the matching result and state. Player handler no longer sanitizes bad IDs/families into a successful different request. |
| Runes | Shared ownership, compatibility, target validation, priority and cost helpers; server applies real tactical rules. | Bot silently trimmed unowned/over-budget rules and ignored rejection. Now rejects the requested configuration loudly. Equality includes `targetAbilityId` as well as stance target. |
| Stances | Known pool, attuned pool, default and runtime active stance were already networked. | Generic full pool/default configuration now supported. Every attuned stance reserves RP, including default. Old free-default documentation corrected. |
| Rites | Known/equipped lists, forge and loadout handlers, shared RP cost already existed. | Added bot craft/loadout intents and declarative acquisition/configuration. Locked Rites stay locked; smoke uses an explicitly noncanonical test-room fixture. |
| Requests | Craft/upgrade results and authoritative state waits already covered normal economy operations. | Shared loadout result channels now filter by system; overlapping same-channel requests are refused. Timeout closes the session to prevent a late result satisfying a later request. Disconnect and synchronous send errors clean pending listeners. |
| Lobby | Create/delete already waited for the roster following the result. | Roster timeout used to resolve as success. It now fails; timed-out roster waiters are removed. |
| Preparation cleanup | Route execution already cleaned timers and signal handlers. | Failures before route execution now also close the socket and telemetry streams; a rejected preparation case verifies this. |
| Templates | Persistent build fields and snapshot export/import already included attunement. All 18 T2 templates carry prior mastery, skills, gear and learned abilities. | Generation now interprets full build steps and stance/Rite acquisition; explicitly includes attuned stances. Validation checks reachable stance/Rite recipes, exact build state and exact learned/owned catalogues, rather than Rune count alone. No free progression or Rite unlock was added. |
| Isolation | Frozen runner exports a committed revision, checks server revision/build ID, gives runs separate runtime resources, imposes deadlines, captures terminal failures and stops children. | Existing semantics retained; runner tests included in preflight. No cohorts launched or historical records reclassified by this pass. |

Authoritative sources: `shared/src/{abilities,runeDatabase,runicPoints,stances,rites}.ts`,
`shared/src/protocol/{views,socketEvents,tierEntry}.ts`,
`server/src/net/playerHandlers.ts`, `server/src/systems/player/economy/*Crafting.ts`,
`server/src/world/playerLifecycle.ts`, and `server/src/db/playerRepo.ts`.
T1/T2 route generators, policy profiles, snapshot capture, route executor, telemetry,
template generator/validator and `scripts/experiment/{cli,worker}.mjs` were reviewed.

## Route-author interface

Use a full `configureBuild` request. Every field is required; empty arrays remove
that category. Technique/Guard are semantic families, **not fixed slots**.
Ability and Rune ordering is preserved. Stance default must be null or present
in its attuned pool; Rune ability/stance targets must refer to attuned components
(with `no-stance` as the ordinary stance-removal destination).

```ts
{
  type: "configureBuild",
  build: {
    abilities: { techniques: ["sweep"], guards: ["second-wind"] },
    runeRules: [
      { conditionId: "inside-telegraph", actionId: "step-back" },
      { conditionId: "in-combat", actionId: "chase-enemy" },
      { conditionId: "hp-below-25", actionId: "switch-stance", targetStanceId: "no-stance" },
    ],
    stances: { attuned: ["offensive-stance"], default: "offensive-stance" },
    rites: [],
  },
}
```

Acquire everything first, through route data:

```ts
{ type: "learnAbility", recipeId: "ability-recipe-sweep", abilityId: "sweep",
  slot: "technique", attune: false, farmAt: { kind: "biome", biomeGroup: "plains", tier: 1 } }
{ type: "craftRune", recipeId: "rune-recipe-step-back", farmAt: /* appropriate NodeRef */ }
{ type: "craftStance", recipeId: "stance-recipe-offensive", farmAt: { kind: "biome", biomeGroup: "plains", tier: 2 } }
{ type: "craftRite", recipeId: /* live RITE_RECIPE_DATABASE id */, farmAt: /* appropriate NodeRef */ }
```

`learnAbility.attune: false` only learns, so acquisition need not displace an
existing full-budget build. Omission retains the legacy family-replacement
behavior. `setAbilities`, `configureRunes`, and `setDefaultStance` remain supported
and use the same controller. Legacy ability replacement explicitly removes Rune
rules targeting de-attuned abilities, matching the ordinary server setter.
Legacy default-stance changes preserve/add to the existing attuned pool; use
`configureBuild` to release unused stances and recover their RP.

`configureRunes` retains the selected policy's Rune substitution. A full
`configureBuild` is exact and does not substitute a different policy loadout;
use `optional` or separate route/build data when that difference is intentional.

For the next T2 experiment: start from the matching validated T2 entry profile or
sealed snapshot, keep its declared frame/economy treatment, acquire the desired
T2 stance through `craftStance`, then insert `configureBuild` before the measured
farm/boss leg. Sweep and Second Wind are available in the existing baseline entry
catalogue; the stance still needs to be crafted. Register the route in
`bot/src/routes/index.ts`, run `pnpm bot:preflight`, and run a bounded validation of
that particular route before committing/freezing the expensive experiment.

## Validation, synchronization and diagnostics

`Observation.build` exposes the current loadout, known pools, owned Rune fragments,
active stance, RP breakdown and budget. RP values are calculated using **the same
shared functions used by the server**, over networked progression. They are not a
separate server-transmitted numeric acknowledgement. Budget is currently
`16 + floor(GlobalMastery / 5)`; call the shared helper rather than copying this
formula into route files. Abilities, stance reservations, Rune logic and Rites
all contribute to the one total. Rite slot-count UI metadata is not the authority
for admission; the live setter uses shared RP.

The controller validates shape, duplicates, families, learned/owned components,
Rune compatibility/targets and total RP before sending. For a changed build it
pauses auto-combat, removes Rune dependencies and releases reservations, then
applies abilities, stances, Rites and finally Rune rules. Each nontrivial edit
waits for its system acknowledgement **and** its exact authoritative predicate.
The final complete state must match. Combat resumes only after verification.
Reapplying an identical configuration is safe.

This is a serial reconciliation, **not an atomic server transaction**. An accepted
partial build remains observable if a later edit fails; there is no pretend
rollback or success. The run fails and records the requested and observed state.
Incoming attacks may still occur while auto is off; mutations use the existing
bounded death retry and ordinary respawn behavior.

Telemetry uses `build-change`, `system: "loadout"`, with `preflight`, `applied`,
`verified`, `failed` and `drift` phases. Details contain requested/observed builds,
observed RP/budget, validation issues and the server's rejection reason. Build
errors invalidate the treatment and end with `completion: "error"`, rather than
being reported as gameplay stalls. Codes distinguish `MALFORMED_BUILD`,
`MISSING_UNLOCK`, `INSUFFICIENT_RP`, `GAME_REJECTION`, `STALE_IMPLEMENTATION` and
`STATE_SYNC_FAILURE`. The code for a server rejection is inferred from its existing
reason text; the original result is preserved. Verified builds are checked again
at route polling/step boundaries; an unexplained change fails as drift. Active
stance is intentionally excluded from static equality because real Rune behavior
is allowed to switch it.

The connection does not automatically resume an interrupted experiment. It fails
closed on transport loss. Explicitly opening a new session clears old identity,
entities and roster; the normal full snapshot reestablishes actual build state.
The smoke tests this restoration using persisted slices and a new socket ID.

## Fast validation

```sh
pnpm bot:preflight
pnpm --filter @mmo-idle/bot exec tsc --noEmit
pnpm --filter @mmo-idle/server exec tsc --noEmit
```

Preflight runs bot/server typechecks, the real Socket.IO/server-handler smoke, tier-entry server test,
shared attunement tests, bot harness/content-order tests, focused loadout checks,
all 18 template validations, T1/T2 route semantic tests and isolated-runner tests.
Each script has a 90-second ceiling. It needs no Postgres, Redis or running dev
server; the socket smoke listens on an ephemeral loopback port and cleans it up.

The socket smoke covers connection and observation; all template applications;
each class's T2 initial ability/Rune configuration; multiple abilities, order,
clear/removal and idempotence; illegal/locked/over-budget requests; independent
concurrent clients; absent-player rejection; real World-tick Rune stance switching;
Rite forging/attunement; explicit state resync; new-socket reattachment; unexpected
build drift; accepted results with missing state convergence; overlapping requests;
and disconnect cleanup. Later unlocks use the existing dev test room and are
explicitly printed as **NONCANONICAL harness validation**.

## Remaining experiment risks

- Preflight proves platform interfaces, not completion of every authored route or
  gameplay balance. It does not run a full T2 economy traversal or later-tier Rite
  progression. New route gates, resource suppliers, death/recovery behavior and
  termination conditions still need bounded route-specific validation.
- The socket fixture exercises real player handlers, ECS attachment and network
  encoding, but substitutes the lobby/database setup. It does not qualify actual
  Postgres save durability, Discord authentication or a Docker batch deployment.
- Existing result events have no request IDs. Mutations must remain serial per
  result channel; reconnect/timeout is terminal rather than automatically retried.
- General skill/travel/equip intents still rely on bounded state predicates rather
  than per-operation rejection messages. Farming can legitimately wait on mastery,
  economy or combat; those remain distinct from exact-build failures.
- Existing `ifPossible` static route analysis is optimistic about branches; runtime
  exact-build validation is the final unlock/budget check. Old routes that depended
  on silent Rune trimming now fail and require an explicit authored choice.
- Frozen experiments use committed source. This working-tree preflight does not
  validate an older image or include uncommitted edits in a frozen run.
- Concurrent-client smoke checks state independence, not shared-world economic
  isolation or party strategy. Prefer the existing frozen per-run server runner.

## Validation results

- `pnpm bot:preflight`: passed. The focused socket smoke also passed after adding
  preparation-failure cleanup, concurrent clients and drift coverage.
- `pnpm typecheck`: passed, including bench types. An earlier attempt encountered
  transient client rendering errors while other work was in progress.
- `pnpm test`: **173/174 passed** in the broad run. Its single failure,
  `server/test/bossGeometryPhase1.test.ts:1173`, expects Step Back not to be offered
  for a target-following hit. The isolated rerun reproduces it. This test does not
  import the modified bot/loadout handlers; combat behavior was not changed here.
  The focused loadout unit test added after broad discovery passes in preflight.
- `pnpm experiment:test`: passed. `git diff --check`: passed.

Concurrent unrelated edits mean this was working-tree validation, not a frozen
commit qualification. Raw logs are under `tmp/bot-harness-audit/` locally.
