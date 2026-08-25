# Headless Progression Bot Harness

Real socket.io clients that play the game on the real dev server, follow an
authored progression route, and emit structured telemetry.

**This is not a simulator.** It reconstructs no combat formula and owns no world
state. Every action is an ordinary `ClientToServerEvents` intent; every
observation comes from `DeltaSnapshot` and `world:events`. Numerical balance
still belongs to `server/bench/`; this measures *progression over time*, which
the bench cannot see.

Plan and audit: [`docs/headless-bot-harness-plan.md`](../docs/headless-bot-harness-plan.md).

## Running

The dev server must be up with `AUTH_DEV_BYPASS=1` (it is in `.env`).

```bash
# one bot, canonical 1x economy
pnpm bot:run --route=striker-t1 --policy=intended

# ...with the live dashboard on http://localhost:4500
pnpm bot:run --route=striker-t1 --policy=intended --ui

# pipeline test (NOT an evaluation): 25x rewards, auto-tagged non-canonical
pnpm bot:run --route=striker-t1 --policy=intended --ui --rewardMultiplier=25

# shared-world batch: 2 bots per policy, all in the same dev world at once
pnpm bot:batch --routes=striker-t1 --policies=intended,rusher --count=2

# delete bot characters between runs (accounts are reused, not orphaned)
pnpm bot:cleanup --routes=striker-t1 --policies=intended,rusher,generic --count=2
```

Flags: `--route` `--policy` `--index` `--server` `--out` `--maxRunMs`
`--fresh=false` (keep the existing character instead of starting from zero),
`--ui[=port]` (dashboard, default 4500), `--rewardMultiplier=N` (dev-only, 1-1000).

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

## Dashboard

`--ui` serves a read-only page on `localhost:4500` (loopback only) showing, per
bot and refreshing every second:

- HP / barrier, tier, Global Mastery, attack, plating, DR, dodge
- where it is: node, biome, node modifier, current target, attackers, mob count,
  other players present
- **equipment** with upgrade levels, **resources** (essence + catalysts),
  **mastery** per biome and bosses cleared
- build: equipped Techniques / Guards and the full rune loadout
- route progress: step N of M, the step label, milestones reached
- run totals and a colour-coded feed of recent events

`pnpm bot:batch` runs every bot in one process, so a single dashboard shows the
whole cohort side by side. Separate `pnpm bot:run` invocations are separate
processes and therefore separate dashboards — the second one lands on 4501, and
so on.

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

## Canonical vs non-canonical

A run is canonical only when `summary.run.canonical === true`. It is tainted by:

| Taint | Cause |
|---|---|
| `NON_CANONICAL_REWARD_MULTIPLIER` | the server's kill-reward multiplier was not 1 at ANY point in the run |
| `NON_CANONICAL_TIME_SCALE` | `BOT_TIME_SCALE` set (reserved for the future loop accelerator) |

Never mix a tainted run into balance or economy conclusions.

The multiplier is **server-global**: one bot (or a human on the debug panel)
raising it changes rewards for every bot in the world. The taint is therefore
sticky and sampled continuously, not just at connect — a run that started at 1x
and was raised to 40x underneath it is still reported non-canonical.

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
  superhuman movement. Tactical reaction comes from equipped **Runes** only —
  and a rune whose ability has not actually been learned is dropped rather than
  silently used.
- **Nothing is seeded.** Fresh character, tier 0, no gear, no currency, no
  unlocks. Every craft, upgrade and boss clear is earned.
- **Waiting is data.** When the economy makes the bot wait, that is recorded as
  a `blocked-on-resource` span, not shortcut.

## Adding a class route (Stage C)

**See [ROUTE-AUTHORING.md](ROUTE-AUTHORING.md)** — the full step/condition
vocabulary, the gating you have to route around, and the generated T1 recipe
catalogue (ids, gate levels, costs, stats, mechanics) so you can pick gear
without opening `shared/src/data/recipes/`.

For a self-contained packet aimed at someone (or some model) with no repo
access — classes, the map, every T1 monster's stat block, gear, abilities,
runes, the DSL and a worked example — generate
[`reports/bot-route-reference.md`](../reports/bot-route-reference.md) with
`pnpm bot:reference`. It is built from live game data, so regenerate it after
any balance or content change rather than editing it.

Add a file to `routes/` and register it in `routes/index.ts`. It should be
data. `harness.test.ts` verifies that every recipe, item, ability, rune fragment
and dungeon a route names actually exists — a typo there would otherwise run for
hours and never finish.

Note: `summoner-root` (Conduit) is gated behind the server's `CONDUIT_ENABLED`
flag, so a Conduit route needs that enabled to run at all.
