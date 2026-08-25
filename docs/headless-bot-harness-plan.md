# Headless Progression Bot Harness — implementation plan

**Status:** Stage B BUILT, 2026-08-25 — `bot/` package, Striker T1 route, telemetry.
Long-run validation in progress. Stages C–F not started.
**Goal:** a trustworthy automated **T1 progression playtester** — real headless
clients on the real dev server, authored routes, structured telemetry.
**Non-goal:** a second simulator. `server/bench/` stays the numerical instrument;
this measures *progression over time*, which the bench cannot see.

Design ancestry: this is the parked agent harness
(`docs/next-playtest-implementation-plan.md` §6, `docs/future-plans.md` §4) minus
the LLM, and workstream **W5d** of `docs/polish-and-balance-roadmap.md`.

---

## 1. What the audit found

The write half of this project already exists. The read half already exists. The
gap is a route executor and a telemetry sink.

### 1.1 The protocol boundary to reuse

`shared/src/protocol/socketEvents.ts` is already a strategic-decision API. Every
route primitive in the brief maps to a shipped intent:

| Route primitive | Intent |
|---|---|
| `travel` | `player:navigateTo` (server owns gate pathing — `startManualNavigation`) |
| `farm` | `player:setAuto(true)` + `player:setAutoTraverse(false)` |
| `craftItem` | `crafting:craftRecipe` / `crafting:evolveItem` |
| `upgradeItem` | `inventory:upgradeItem` |
| `equipLoadout` | `inventory:equipItem` / `inventory:unequip` |
| `configureRunes` | `rune:craftRecipe`, `rune:setLoadout` |
| `configureAbilities` | `ability:craftRecipe`, `ability:setLoadout`, `stance:*`, `rite:*` |
| `gainMastery` | emergent — farm until `tracksProgression.biomeLevel` clears the gate |
| `attemptBoss` | `player:navigateTo(<dungeon node>)` + `player:activateDungeonAltar` |
| class choice | `player:unlockSkill('<root>')` |
| death | `player:died` → `player:ackDeath` |

**No new gameplay protocol is required.** A bot-convenience layer wraps these; it
never bypasses them.

### 1.2 The observation boundary is already enforced

`NETWORKED_PLAYER_KEYS` / `NETWORKED_MONSTER_KEYS`
(`shared/src/protocol/networkedEntity.ts`) are the server's own allowlist for what
a player may see. `tracksProgression`, `holdsInventory` and `usesSkills` are all
in it — so essences, catalysts, biome XP/level, `unlockedRecipes`,
`bossesCleared`, `clearedNodes` and inventory are legitimately observable.

This gives brief §9 for free: **the bot reducer is built only from
`DeltaSnapshot`**, so policy logic *cannot* reach hidden state — there is no code
path to it. Monster internals (AI state, exact DPS, cooldowns) are not in
`NETWORKED_MONSTER_KEYS` and never arrive.

`shared/src/protocol/views.ts` already exports `composePlayerView`,
`composeMonsterView`, `composeMinionView` — the same composers the browser client
uses. The bot reuses them rather than writing a parallel presentation model.

### 1.3 Telemetry sources already exist and are player-visible

`world:events` (`WorldLogEvent`, `shared/src/protocol/worldLogEvents.ts`) is
per-player filtered (`world.worldLogByPlayer`, drained in the 5 Hz broadcast at
`server/src/index.ts:517`) and carries nearly everything §16–§18 asks for:

- `damage` — source, target, `hpDamage`, `absorbed`, `damageType`, and a full
  `DamageMitigationBreakdown` (gross / plating blocked / DR blocked / glancing);
- `kill` — killer, victim, `essenceGained` + `essenceType`, `biomeXpGained`;
- `player-death` — the typed `DeathCause` (melee / ranged / dot / aoe / debt /
  stance) with a `DeathKiller` snapshot that survives despawn;
- `biome-level-up` — including `unlockedRecipeIds`;
- `player-tier-up`, `heal` / `ward-gain` / `absorb`, `buff-*`, `dodge`.

Death traces (§18) therefore need **no server change**: keep a rolling ring buffer
of world-log events per bot and dump the last N seconds on `player:died`.

Damage-per-target and target switching (§17, the Apprentice issue) come from
`damage.target.id` plus `PlayerView.attackTargetId`. Summon contribution (§17, the
Conduit issue) comes from `WorldLogActor.actorType === 'minion'` +
`ownerPlayerId`, and `summonsMinions` is networked.

### 1.4 Authentication needs no new server code

`authenticateSocketHandshake` (`server/src/auth/socketAuth.ts`) already accepts
`{ devAccountId }` when `NODE_ENV !== 'production'` **and** `AUTH_DEV_BYPASS=1`,
and `findOrCreateDevAccount` (`server/src/db/playerRepo.ts:64`) auto-provisions the
account row on first connect. That is exactly brief §2: dev-only by construction,
impossible in production, identifiable, and unlimited.

> **Do not use `POST /auth/guest` for bots.** `GuestCreationRateLimiter` caps guest
> accounts at **5 per hour per IP** — an 18-bot batch would fail. This was a real
> trap; the dev path is the correct one.

Convention: `devAccountId = "bot-<class>-<policy>-<nn>"`. Cleanup is a dev-only
CLI that deletes characters + accounts whose id carries the `bot-` prefix
(privileged tooling, permitted by §2). In-place reset uses the shipped
`debug:resetProgress`.

### 1.5 The server already has a progression *walker* — but not a route

`server/src/systems/world/autoTraverse.ts` implements a phase machine
(`mob → boss → advance`) over `pickNextIncompleteBiome` /
`areAllBiomeRecipesUnlocked` / `isBiomeFullyDoneAtTier`. It travels and clears,
but it never crafts, equips, upgrades, or configures runes — and its biome order
is fixed, so it cannot express the revisit routes of brief §4.

**Decision:** the harness drives `player:navigateTo` explicitly and farms with
`setAuto(true) + setAutoTraverse(false)`. Auto-traverse stays available as a
*policy option* (the "let the game decide" baseline), not the executor.

### 1.6 Constraints found

| Finding | Consequence |
|---|---|
| The live server has **no time scaling** — fixed 10 Hz wall clock (`server/src/index.ts:482`). `timeScale` exists only in `server/bench/`. | Canonical runs are wall-clock bound. See §5. |
| `DEBUG_REWARD_MULT` env already seeds `world.rewardMultiplier`, defaults to 1, never persisted (`server/src/world/World.ts:251`). | §13 is satisfied by leaving it unset. Non-canonical runs set it and get tagged. |
| One live socket per account (`session:kicked`, `saveAndDisconnectAccount`). | One account + one socket + one reducer per bot. Already the plan. |
| `tools/` is **not** a workspace package and is not typechecked; `server/bench/` needs its own `tsconfig.bench.json`. | The harness must not live in `tools/`. See §2. |
| `target-casting` rune condition + Guard actions already ship (`shared/src/runeDatabase.ts:299`). | Brief §8 ("trigger Brace on charged attacks") is a legitimate, already-unlockable player behavior. No bot-only tactics needed. |
| Dungeon runtime reads wall-clock `Date.now()`. | Blocks fidelity-safe acceleration until injected. See §5. |

---

## 2. Where the code lives

A **new workspace package, `bot/`** — added to `pnpm-workspace.yaml`.

Rationale, in order of weight:

1. **It enforces the core rule structurally.** `bot/` may depend on
   `@mmo-idle/shared` and `socket.io-client` and nothing else. It *cannot* import
   server internals, so "headless client, not a simulator" is a build error rather
   than a code-review note.
2. **CI covers it for free.** `pnpm typecheck` is `pnpm -r exec tsc --noEmit`;
   a workspace package is included automatically. `tools/` and `server/bench/`
   both escaped this and both shipped bugs because of it.
3. It is a client, not server code. Putting it under `server/` would misfile it.

```text
bot/
  src/
    net/        connection, handshake, intent senders (typed ClientToServerEvents)
    state/      delta reducer -> NetworkedEntity map -> shared view composers
    route/      route types + the step executor
    routes/     authored per-class T1 routes (DATA)
    policy/     intended | rusher | generic — parameters over the same executor
    telemetry/  JSONL writer, ring buffer, death traces, summary builder
    run.ts      single-bot entrypoint
    batch.ts    multi-bot shared-world runner
```

---

## 3. Architecture

```text
socket.io-client
   │  state:sync / node:delta / world:events / player:died / *Result
   ▼
Reducer  (netId -> NetworkedEntity;  compose*View for reads)
   │
   ├──► Observation  (player-visible ONLY — this is the §9 boundary)
   │        │
   │        ▼
   │    Route executor ── step goal ── policy parameters
   │        │
   │        ▼
   │    Intent senders ──► ClientToServerEvents ──► real server
   │
   └──► Telemetry sink (JSONL + ring buffer + summary)
```

Two rules hold this together:

- **Observation and telemetry are different objects.** The executor is
  constructed with the observation only. Telemetry may additionally record
  anything (timings, raw events, server debug) — it just cannot be read back by
  policy. This is the `Plan → Executor → normal game actions` split brief §23
  wants preserved.
- **Every step is a goal with a completion predicate and a stall predicate.**
  No step is "press button"; it is "hold this condition until true, or fail with a
  reason".

### Route model

```ts
type RouteStep =
  | { type: 'chooseClass';      skillId: string }
  | { type: 'travel';           nodeId: string }
  | { type: 'farm';             nodeId: string; until: Condition }
  | { type: 'craft';            recipeIds: string[]; farmAt?: string }
  | { type: 'equip';            definitionIds: string[] }
  | { type: 'upgrade';          itemId: string; toLevel: number; farmAt?: string }
  | { type: 'configureRunes';   rules: EquippedRule[] }
  | { type: 'configureBuild';   abilities?: ...; stances?: ...; rites?: ... }
  | { type: 'unlockSkill';      skillId: string }
  | { type: 'attemptBoss';      nodeId: string; maxAttempts: number }
  | { type: 'repeatUntil';      steps: RouteStep[]; until: Condition };
```

`Condition` is a small predicate DSL over the observation
(`biomeLevel>=`, `essence>=`, `recipeUnlocked`, `bossCleared`, `hasItem`,
`elapsedMs>=`). Costs, gates and upgrade requirements are **read from
`RECIPE_DATABASE` / `upgradeCostFor` at runtime**, never copied into route files
(§5 of the brief). A route names *what* and *where the designer expects to farm
it*; it does not restate the economy.

`craft` and `upgrade` are self-satisfying: if materials are missing, the executor
farms `farmAt` until affordable, emitting a `blocked-on-resource` telemetry span —
which is precisely the economy measurement we want (§13).

### Policy profiles

Parameters over one executor, never forked code:

| | intended | rusher | generic |
|---|---|---|---|
| upgrade threshold before advancing | route value | route value − 2 | route value − 1 |
| biome-specific gear swap | yes | minimal | rarely |
| advance gate | route condition | earliest legal gate | route condition |
| rune loadout | authored counters | starter | generic defensive |

---

## 4. Telemetry

`runs/<runId>/` containing `events.jsonl` (one line per event, schema-versioned
like `BALANCE_JSONL_SCHEMA_VERSION`), `summary.json`, and `deaths.jsonl`.

Every run header carries: runId, botId, class, policy, route name+version, git
revision, start/end, completion state, **and the reward multiplier** — tagged
`NON_CANONICAL_REWARD_MULTIPLIER` when ≠ 1.

Death trace: a 15 s ring buffer of world-log events per bot, flushed on
`player:died` with killing blow, largest hit, dominant source, concurrent
attacker count, gear/loadout, route step, biome/node/modifier.

Catalysts (§14): income, spend, attribution to node modifier, and time blocked on
a catalyst requirement are all **logged**; no route hunts modifiers.

---

## 5. Decisions taken (2026-08-25)

**Run speed — real time canonical, acceleration opt-in.** Stage B targets the
unmodified 10 Hz server; the runner is built for unattended multi-hour operation
(streamed JSONL, checkpointed progress, resumable). A dev-only **loop
accelerator** is a *later, separate* workstream: fire the same 100 ms-dt tick more
often, which — unlike the bench's `timeScale` — does not coarsen `dt` and so does
not quantise attack cadence. It is blocked on injecting a tick clock into the
remaining wall-clock `Date.now()` reads (dungeon runtime, boss respawn). Any
output produced under it is tagged `NON_CANONICAL_TIME_SCALE` and never mixed
into canonical conclusions.

**T1 completion — all five T1 dungeon bosses**, with the `tier-1` quest recorded
as an intermediate milestone with its own timestamp:

```text
gnarled-greatbear (forest) · crag-behemoth (mountain) · tusked-razorback (plains)
grave-toadeater (swamp)    · obsidian-broodmother (cave)
```

Both numbers — "time to the shipped tier gate" and "time to clear T1" — then come
out of a single run.

---

## 6. Sequence

| Stage | Content | Gate |
|---|---|---|
| **A** | Repository audit | ✅ this document |
| **B** | `bot/` package, connection, reducer, executor, one class (Striker), full T1 route, JSONL + summary + death traces | ✅ built and connecting; end-to-end acceptance (all five bosses unattended) still to be demonstrated |
| **C** | Five more authored T1 routes (data, not infrastructure) | Six classes complete T1 |
| **D** | rusher + generic policy parameters | Three profiles per class |
| **E** | Batch runner, shared dev world, aggregate summaries | Multi-bot batches with contention telemetry |
| **F** | Spectator mode in the dev client (reuse `SpectatorManager`) | read-only camera follow |

Stage B ships with a wiring smoke test per repo convention (attach, tick, assert
observable invariants — not balance numbers).

**Stop after stable T1 intended-policy runs and surface the results before
designing T2 routes.**

---

## 6a. What Stage B found once it ran

Three things only a real connection could have surfaced.

**The lobby has a result-before-unlock race.** `deleteLobbyCharacter` /
`createLobbyCharacter` emit `character:*Result` and *then* `await
emitCharacterList()`, clearing the `mutatingCharacters` guard only afterwards
(`server/src/index.ts`). A client that fires its next intent the instant a result
lands is rejected with *"Another character action is already in progress"* —
every single time. A human clicking a button never hits the window; the first bot
run died on it. Fixed on the **bot** side (`lobbyMutation` waits for the roster
push, the server's own end-of-mutation signal, and retries that one reason).
The server is not wrong here — it just has no client that acts at machine speed.

**`composePlayerView` needs all six player slices.** `isPlayer`, `hasPosition`,
`hasHealth`, `holdsInventory`, `usesSkills`, `dealsDamage`, `performsAttack` and
`mitigatesDamage` must all be present or it returns `null`. The runner therefore
waits for a *complete* player before starting the route rather than acting on a
partial first delta.

**Spend telemetry cannot be a wallet diff.** Reading the wallet either side of a
`crafting:craftRecipe` round-trip records zero: the wallet only moves when the
next 5 Hz delta lands. Craft and upgrade spend is now read from the authored
`RECIPE_DATABASE` cost / `upgradeCostFor` for the level the server confirmed.

Also confirmed, and *not* a bug: `globalMastery()` deliberately excludes the
Clearing and the Sanctuary, so a character with Clearing level 4 correctly
reports GM 0.

### Measured, from the first runs (canonical 1x, reward multiplier 1)

Full run: `stalled` at 25.1 min, `boss attempt loop exhausted (6) with no clear`.
Tier 1, GM 6, 107 kills, 7 deaths, 0 bosses.

| | |
|---|---|
| Tier-0 quest (10 Tiny Wisps, unarmed start) | ~76–85 s |
| Clearing level 1 → 4, full tutorial set | ~205 s |
| Plains geared (weapon/armor/charm/boots, level 4) | ~706 s |
| Blocked waiting on essence to craft | 32 s total (2 spans) |

**The headline result: the Striker never reached the Plains boss.** All five
dungeon deaths were to *guardians* (`Prairie Defender`, `Field Hare` — every
killer `isBoss: false`) with **11–12 simultaneous attackers**. Six attempts, six
wipes, none of them to the boss.

That is not a route error. The game's own `resolveTraversePhase` sends a player
to the dungeon once `areAllBiomeRecipesUnlocked` holds, and at playerTier 1 that
is satisfied by exactly the four Plains recipes this run had crafted — the
shipped auto-traverse policy would have walked into the same guard at the same
power level.

Also measured: Plains average concurrency 2.0 (max 12); 46 target switches;
2 754 damage taken vs 7 571 dealt; the only catalyst earned all run was 1
`alacrity`.

### Known limitation to fix before trusting income numbers

A `farm` step camps a **single node** for the whole step. `clearedNodes` only
grows inside `updateAutoTraverse`, which the harness deliberately leaves off, so
`pick: "uncleared"` keeps resolving to the same node. A player following the
shipped auto-traverse tours every node in the biome. Until that is addressed,
per-biome income and kill mix are one-node samples, not biome samples.

### Handoff: routes are the designer's to author

Route authoring needs game knowledge the harness cannot infer — e.g. whether to
keep the high-plating Plains vest (plating 7) through Forest rather than swapping
to the Forest vest (plating 3 + evasion 0.16), which the current
`striker-t1` route does. `bot/ROUTE-AUTHORING.md` is the authoring surface: the
full step/condition vocabulary, the gating to route around, and a generated T1
catalogue of every recipe with its gate, cost, stats and mechanics.

---

## 7. Explicitly out of scope

Browser automation; reconstructed combat formulas; any second simulation engine;
an LLM in the runtime loop; any balance/reward/catalyst change; party
benchmarking; manual boss dodging; hidden-state tactics; deterministic replay; a
dashboard.
