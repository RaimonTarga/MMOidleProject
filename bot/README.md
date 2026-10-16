# Headless Progression Bot Harness

Real socket.io clients that play the game on the real dev server, follow an
authored progression route, and emit structured telemetry.

**This is not a simulator.** It reconstructs no combat formula and owns no world
state. Every action is an ordinary `ClientToServerEvents` intent; every
observation comes from `DeltaSnapshot` and `world:events`. Numerical balance
still belongs to `server/bench/`; this measures *progression over time*, which
the bench cannot see.

Historical construction plan: [`docs/archive/headless-bot-harness-plan.md`](../docs/archive/headless-bot-harness-plan.md).
Current operation: [`docs/bot-experience-command-center.md`](../docs/bot-experience-command-center.md).

## Running

For canonical multi-run evidence, use the frozen isolated runner documented in
[`docs/bot-experiment-runner-current-state.md`](../docs/bot-experiment-runner-current-state.md).
It runs one private compiled server/world per bot at an exact commit, with 2
workers by default. The direct commands below remain useful for interactive
development and legacy shared-world experiments.

The dev server must be up with `AUTH_DEV_BYPASS=1` (it is in `.env`).

```bash
# one bot, canonical 1x economy: the Squire's T1 route
pnpm bot:run --route=squire-t1 --policy=intended

# the class-agnostic smoke route, played as the Squire (only smoke-t1 takes --class)
pnpm bot:run --route=smoke-t1 --class=cooldown --policy=intended

# ...with the live dashboard on http://localhost:4500
pnpm bot:run --route=striker-t1 --policy=intended --ui

# pipeline test (NOT an evaluation): 25x rewards, auto-tagged non-canonical
pnpm bot:run --route=striker-t1 --policy=intended --ui --rewardMultiplier=25

# resume the same character on the next tier's route (after a server restart, say)
pnpm bot:run --route=striker-t2-heavy --policy=intended --account=my-striker --fresh=false

# clean controlled batch: the controlled routes, 25x, sequential, one bot at a time
pnpm bot:batch

# LEGACY/DEPRECATED for canonical evidence: shared-world lease experiment
pnpm bot:batch --executionMode=isolated-parallel --maxConcurrency=6

# ...spreading the launches so the Clearing opening is not a thundering herd
pnpm bot:batch --executionMode=isolated-parallel --maxConcurrency=6 --staggerMs=60000

# explicit exploratory shared-world batch (not controlled evidence)
pnpm bot:batch --controlled=false --routes=smoke-t1 --parallel=true

# NONCANONICAL: authentic route + accelerated attempts 2+ against each boss
pnpm bot:run --route=<route> --policy=intended --fastBossRetry=true

# delete bot characters between runs (accounts are reused, not orphaned)
pnpm bot:cleanup --routes=smoke-t1 --policies=intended,rusher,generic --count=2
```

Flags: `--route` `--policy` `--index` `--server` `--out` `--maxRunMs`
`--class=<archetype>` (the class a class-agnostic route plays, e.g. `cadence`; part of the bot account id;
an error on a class route), `--account=<id>` (the dev account; default `bot-<route>-<policy>-<nn>`, and
only `bot-` accounts are deleted by `bot:cleanup`), `--choices='{"<choice>":"<option>"}'` (a route's
authored choices, e.g. the Slinger's `slinger-discipline`),
`--fresh=false` (keep the existing character instead of starting from zero),
`--ui[=port]` (dashboard, default 4500), `--rewardMultiplier=N` (dev-only, 1-1000),
`--fastBossRetry=true` (dev-only, always noncanonical), and
`--fastBossRetryIncludeGuardians=true` (rebuild/reclear guardians on accelerated retries).

Canonical runs take **hours**. The runner streams telemetry to disk as it goes,
so a run killed at hour six is still fully analysable.

## Output

```
runs/<runId>/
  events.jsonl    discrete events: steps, kills, crafts, upgrades, milestones,
                  deaths, blocked-on-resource spans, contention, stalls
  deaths.jsonl    one record per death, each with a 15s pre-death window
  summary.json    the compact digest — read this first
```

Per-hit damage is **aggregated** into `summary.json` rather than streamed: an
eight-hour run would otherwise produce a JSONL file nothing can open. The raw
hits still exist where they matter, inside each death window. Set
`BOT_RAW_DAMAGE=1` to stream every hit for a deep dive.

`summary.json → combat.fights` is the per-fight HP digest (progression rework
Phase 0): fight count, median fight-end HP fraction, share of fight time with HP
in the 20–80% band, deaths, end-HP buckets, and the same per biome. A fight is
contiguous engagement (target held or attacked), closed after 3 s without
either, on death, or on a node change; sub-second brushes are counted apart.
The definition lives in `src/telemetry/fightHp.ts` and is shared with the
in-process bench `server/bench/phase0Recovery.ts`.

## Dashboard

`--ui` serves a read-only page on `localhost:4500` (loopback only) showing, per
bot and refreshing every second:

- HP / barrier, tier, Global Mastery, attack, plating, DR, dodge
- where it is: node, biome, node modifier, current target, attackers, mob count,
  other players present
- **equipment** with upgrade levels, **resources** (essence + catalysts),
  **mastery** per biome and bosses cleared
- the full rune loadout
- route progress: step N of M, the step label, milestones reached
- run totals and a colour-coded feed of recent events

`pnpm bot:batch` defaults to the controlled route registry and awaits
each terminal result before starting the next bot. It uses 25x rewards and a
finite six-hour per-run watchdog by default, so its output is pipeline-validation
evidence rather than canonical economy evidence. Parallel/shared-world execution
requires `--controlled=false --parallel=true`. Separate `pnpm bot:run`
invocations are separate processes and therefore separate dashboards — the
second one lands on 4501, and so on.

It reads the bots' **own** player views. No game-server, protocol or admin
change was needed, and the audited anonymous-spectator projection
(`SPECTATOR_PLAYER_KEYS`) is untouched — a bot is only showing you its own
character sheet. If the port is busy the runner walks forward to the next free
one, and if it cannot bind at all it warns and continues headless: a telemetry
convenience must never take down a multi-hour run.

## Watching a bot

Two views, both reachable from a dashboard card.

**`view`** — a schematic top-down canvas of the bot's node, drawn from the bot's
own mirror at 4 Hz. No sprites, no atlas, no asset pipeline, so it paints
instantly. It shows what a balance run actually needs:

- every entity as a dot with an HP bar (bot green, monsters red, minions blue,
  other players grey; bosses ringed gold, the bot ringed white)
- a green line to the bot's current target
- a red line from **every** attacker onto the bot — the concurrency that kills
  runs, drawn rather than counted
- node id, node modifier, live "N on you" and total entity count

Open state is remembered per bot in `localStorage`.

**`world`** — the real Phaser client, camera pinned to that bot. See below.

> The dashboard HTML is baked into the runner at start, so changes to
> `bot/src/ui/page.ts` need a bot restart to appear.

## Watching a bot in the live world

Every dashboard card carries a **watch** button linking to
`http://localhost:3000/?watch=<entityId>`. Opening it drops you into the ordinary
dev client as an anonymous spectator with the camera **pinned to that bot**,
following it across nodes and through fights.

That reuses the landing-page spectator wholesale. The only additions are
selection, both dev-only and never registered in production:

- `spectate:setTarget(playerId | null)` pins the camera, or hands it back to the
  automatic pick.
- `spectate:targets` pushes an identity-only roster (`id`, `name`, `playerTier`,
  `nodeId`) so a picker is possible at all.

**No player data was added to the spectator stream.** `SPECTATOR_PLAYER_KEYS` is
untouched, and its privacy regression test still passes — this changes *who* you
watch, not *what* you can see. Equipment, resources and route context stay on the
bot's own dashboard, which is allowed to show them because a bot is showing you
its own character sheet.

A pin survives the target dying — bots die constantly, so the camera takes
temporary cover on the automatic pick and snaps back on respawn. It is released
only when that player disconnects.

## Class routes

Every class has a route per tier, rebuilt in the class-first build (as of 2026-10-16;
the registry is `src/routes/index.ts`). Each route starts from a fresh character and
replays the earlier tiers' steps first (`-t3` runs the whole `-t2` route), and every
step is idempotent: a farm whose level is reached, a craft already held or a boss
already cleared passes at once. So the next tier's route resumes a character where the
last one stopped (`--account=<same> --fresh=false`).

| Class (root) | Routes | In `CONTROLLED_ROUTE_IDS` | Tier picks (the constants at the top of each file) |
|---|---|---|---|
| any (`--class`) | `smoke-t1` | yes | none; Clearing and Plains only |
| Striker (`cadence-root`) | `striker-t1`; `striker-t2-light`, `-balanced`, `-heavy`; `striker-t3-<specialization>` (9); `striker-t4-<leaf>` (9) | `striker-t1` and the three `-t2` | one route per discipline, per specialization and per leaf |
| Squire (`cooldown-root`) | `squire-t1` to `squire-t4` | `-t1`, `-t2` | Avenger, Measure for Measure, Last Word |
| Conduit (`summoner-root`) | `conduit-t1` to `conduit-t4` | `-t1` | Pack, The Hunt, Avenge |
| Slinger (`reload-root`) | `slinger-t1` to `slinger-t4` | `-t1` | route choices `slinger-discipline` (Gunslinger), `slinger-specialization` (Fan the Hammer), `slinger-leaf` (Light Hands) |
| Spirit (`energy-root`) | `spirit-t1` to `spirit-t4` | `-t1` | Tide, Spring Tide, Wading |
| Apprentice (`dot-root`) | `apprentice-t1` to `apprentice-t4` | `-t1` | `-t2` fights with no school; `-t3` picks Fire and Afterburn; `-t4` Tinderbox |

A route joins `CONTROLLED_ROUTE_IDS` once it has run live; the others need
`--controlled=false` in a batch (`bot:run` runs any registered route).

What a class route does:

- **The class:** the tier-0 quest, `chooseClass` (an `unlockSkill` of the class root), then a
  `classConfig` step in `mode: "auto"`, so the server rebuilds the class default as lessons,
  trophies and budget steps arrive (the Striker's T2 routes size that auto Order to the
  discipline's combo). The Apprentice's T2 to T4 routes set a `custom` config instead, placing
  each tier's payoffs.
- **The zones** are the guide's (`T1_BIOME_ORDER`, `TUTORIAL_SEALS` from `shared/src/tutorial/`):
  each zone farmed to its tier cap, then its boss (`attemptBoss`, up to `maxAttempts`, 6 by
  default). T1 fights the two seals (Plains, then Mountain); T2 to T4 fight all seven of the
  tier's bosses.
- **The tier picks** are `unlockSkill` steps on the discipline, specialization and leaf nodes.
- **Gear** (as merged on 2026-10-16, before the overnight tuning): `striker-t1` and
  `squire-t1` craft and wear each seal zone's weapon job and vest (Plains, then Mountain)
  before its boss; the Conduit, Slinger, Spirit and Apprentice routes craft nothing; no route
  crafts the Clearing set (the guide does) and no T2 to T4 step crafts anything, so the
  routes met T3/T4 bosses in T1 gear or none. The overnight class tuning (OV-*) adds each
  tier's weapon, armor, charm and boots; check the route file.
- **Milestones and conditions** use the class vocabulary: `pieceLearned` (a lesson, with its
  rank) and `trophyHeld`, besides the zone, boss and tier conditions.

Every route has a static test next to it (`src/routes/<class>T<n>.test.ts`). Only the T1
routes and the 2026-10-15/16 smoke runs have run live; see
`docs/briefs/class-first-build/STATUS.md` for what those runs found.

## Isolated lanes (one server per bot)

Bots in one world crowd each other and corrupt the numbers, so per-class work uses a
**lane**: a private dev server from the checkout the script sits in, with its own game
database. From the worktree root:

```bash
node tools/lane/lane.mjs start <n>    # server on :431<n> (4310+n), database gamedb_ov<n>, background
node tools/lane/lane.mjs stop <n>     # kill it (the whole process tree); restart after any server/shared edit
node tools/lane/lane.mjs reset <n>    # stop, then drop and recreate the lane's database
node tools/lane/lane.mjs status [<n>] # which lanes answer on /healthz

pnpm bot:run --route=<route> --policy=intended --server=http://localhost:431<n> \
  --account=<lane>-<class> --out=<lane runs dir> [--rewardMultiplier=N] [--fresh=false]
node tools/lane/runSummary.mjs <runs dir | run dir> [--deaths]   # newest run on one screen
```

Lanes 0–6 exist. Each uses `NODE_ENV=development`, `AUTH_DEV_BYPASS=1`, Redis database 8+n
and the shared log database `logdb_rework` (which must already exist in the `mmo-logdb`
container); `reset` needs Docker (`mmo-gamedb`). The server log and pid live outside the repo,
in `../lanes/lane<n>/`. There is no watcher. `runSummary.mjs` reads `events.jsonl` and
`deaths.jsonl` as they stream: the current step, kills and deaths by zone, every boss attempt
with the boss HP left, milestones with their times, stalls, and with `--deaths` one line per
death (killer, hit). Lane runs are pipeline evidence: one bot per world, but on a dev server
with whatever reward multiplier the run set.

## Canonical vs non-canonical

A run is canonical only when `summary.run.canonical === true`. It is tainted by:

| Taint | Cause |
|---|---|
| `NON_CANONICAL_REWARD_MULTIPLIER` | the server's kill-reward multiplier was not 1 at ANY point in the run |
| `NON_CANONICAL_TIME_SCALE` | `BOT_TIME_SCALE` set (reserved for the future loop accelerator) |
| `NON_CANONICAL_FAST_BOSS_RETRY` | attempts 2+ may use the explicit dev encounter reset and teleport |

Never mix a tainted run into balance or economy conclusions.

Fast boss retry never changes the first attempt: the authored route progresses,
equips, travels, clears the guard, and activates the real boss normally. After a
failed attempt, it applies the ordinary authoritative respawn baseline (full HP
and barrier; combat statuses, cooldowns, class resources, aggro, targets, motion,
and summons reset), teleports the same character back to the same dungeon, and
rebuilds encounter-local monsters, script state, telegraphs, persistent zones,
corpses, node ramp overrides, timers, and dungeon phase. Equipment, upgrades,
progression, Runes, stats, boss implementation/numbers, and
the combat engine remain real. By default it skips guard reform and reclear;
guardian-inclusive retries are separately explicit. Controlled batches reject
the flag; use an exploratory single run or `--controlled=false` batch.

The multiplier is **server-global**: one bot (or a human on the debug panel)
raising it changes rewards for every bot in the world. The taint is therefore
sticky and sampled continuously, not just at connect — a run that started at 1x
and was raised to 40x underneath it is still reported non-canonical.

## Build controls and preflight

Run `pnpm bot:preflight` before launching a long batch: it typechecks the bot and
server and runs the harness, loadout, choice, executor, smoke-route and snapshot tests
(not the class route tests: run `pnpm test -- <class>T` for those).
The build controls are `chooseClass` and `unlockSkill` (the class and its tier picks),
`classConfig` (the class system and the relic slot, checked by the server's
`class:setConfig`; a rejected config fails the step) and `configureRunes` (standing
orders: rules must be owned and fit the class, nothing is priced, and a rejected or
drifted loadout fails explicitly). No class route sets Runes today.
These tests are harness evidence, not balance evidence.

## Architecture

```text
socket.io-client
   │  state:sync · node:delta · world:events · player:died
   ▼
WorldMirror ──► Observation ──► RouteExecutor ──► Intents ──► server
   │                              ▲
   │                          Policy (parameters, not forked code)
   └──► Recorder ──► JSONL + summary
```

- `state/reducer.ts` — the mirror. Built only from `DeltaSnapshot`, so the
  server's own `NETWORKED_*_KEYS` allowlist *is* the observable-information
  boundary. Hidden state has no code path in.
- `state/observation.ts` — what policy may read. Uses the shared
  `compose*View` composers and shared `checkUpgrade` / `RECIPE_DATABASE`, so
  the bot can never disagree with authority about a cost or a gate.
- `route/` — the step machine. Every step is a goal with a completion predicate
  and a stall predicate, never a button press.
- `routes/` — authored routes, as data. Adding a class must not need new
  executor code.
- `policy/` — intended / rusher / generic, as parameters over one executor.
- `telemetry/` — JSONL sink, rolling death window, summary builder.

## Rules this harness keeps

- **No hidden state in decisions.** Structural, not a convention: the reducer
  physically cannot see monster AI, exact DPS, private cooldowns, or drop rolls.
- **No bot-only tactics.** No manual boss dodging, no hazard avoidance, no
  superhuman movement. Tactical reaction comes from the class system (the config
  the route sets, run by the server like a player's) and equipped **Runes** only —
  and requested unowned or invalid configurations fail explicitly.
- **Entry provenance is explicit.** Fresh-character routes earn progression.
  Checkpoint continuations start from sealed named checkpoints; dev
  fixtures are never reported as fresh canonical progression.
- **Waiting is data.** When the economy makes the bot wait, that is recorded as
  a `blocked-on-resource` span, not shortcut.

## Controlled concurrency (`--executionMode=isolated-parallel`)

> **Deprecated for canonical evidence.** The preferred canonical path is the
> frozen per-run server architecture in
> [`docs/bot-experiment-runner-current-state.md`](../docs/bot-experiment-runner-current-state.md).
> This code remains temporarily for migration and incident reproduction.

Controlled batches default to `sequential`: one bot at a time remains the
canonical control. `isolated-parallel` is an experimental concurrency cohort,
not an economy baseline, until the staged live rollout succeeds.

The coordinator has three deliberately separate responsibilities:

- `RunConcurrencyLimiter` controls launch/active-run capacity only.
- `CombatReservationManager` grants exact-node, epoch-fenced permits for
  farming, boss attempts, and hostile transit crossings.
- `CohortEvidenceMonitor` passively records only the interaction intervals each
  participant actually experienced.

The Clearing and safe hops are shared. Transit is planned on the world graph and
executed one hop at a time; a hostile intermediate hop obtains a
`protected-transit` permit before entry. Foreign exclusive nodes are avoided.
One transit death permits one replan; a further failure becomes a bounded blocked
step rather than a watchdog loop.

Combat ownership is scoped. Farm, boss, and protected-transit permits release on
activity completion, authoritative departure, death, step failure, abort,
disconnect, or coordinator shutdown. A bot may probe an available next hop while
holding a permit, but it never joins a wait queue until it holds none. There is no
parked-hold or productive-wait recovery path.

Contention is explicit. A batch uses one policy:

- `strict-isolation` stops the affected activity at its local/total wait
  budget and produces a partial route artifact.
- `degrade-to-shared` converts the affected node to a recorded shared
  admission after the exclusive budget expires.

Every summary reports route completion separately from its isolation grade:
`isolated`, `ambient-concurrency`, `shared-combat`,
`outcome-interference`, or `harness-invalid`. Transit plans, permit identity
and epoch, shared-admission fallbacks, and participant-scoped interaction
intervals are written to the event stream. Only completed, isolated, untainted
runs are solo economy baselines.

A run that fails before its own telemetry can start still receives a
coordinator-written `failed-harness` artifact and a terminal manifest entry.

## Adding a class route

Copy the class's nearest route: `src/routes/<class>T<n>.ts` builds on the tier
below it (`squireT3Route()` starts from `squireT2Route()`), and its test sits next
to it. Add the file to `routes/` and register it in `routes/index.ts`. It should be
data. `harness.test.ts` verifies that every recipe, item, rune fragment
and dungeon a route names actually exists — a typo there would otherwise run for
hours and never finish. Add the id to `CONTROLLED_ROUTE_IDS` once it has run live.

[ROUTE-AUTHORING.md](ROUTE-AUTHORING.md) has the step/condition vocabulary and the
generated T1 recipe catalogue, but it predates the class routes (it still says
`smoke-t1` is the only route and lacks `classConfig`, `pieceLearned` and
`trophyHeld`). The generated
[`reports/bot-route-reference.md`](../reports/bot-route-reference.md)
(`pnpm bot:reference`) is stale since D5; regenerate it before relying on it.

Note: `summoner-root` (Conduit) is enabled by default in the current client and
server. Development tooling and authentication bypasses remain separate flags;
live Conduit coverage is still a measurement question, not an availability gate.

## Practical experience studies

See [the command-center handoff](../docs/bot-experience-command-center.md) for paired frozen studies, affordable-upgrade and authored decision profiles, run timelines, and native human-playtest calibration. Start with `pnpm experiment:plan --revision=HEAD --study=scripts/experiment/examples/affordable-upgrades.json --count=3` from the repository root.
