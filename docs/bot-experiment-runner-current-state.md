# Frozen Bot Experiment Runner — Current State

Last updated: 2026-10-16 (OV-DOCS, `rework/class-first`). The isolation runner below is the
code in `scripts/experiment/`. The routes it launches are the bot registry's
(`bot/src/routes/index.ts`): `smoke-t1` plus every class's `<class>-t1` to `-t4` routes,
listed in [bot/README.md](../bot/README.md#class-routes). For quick per-class runs without
containers, the lane tools (`tools/lane/`, same section) give each bot its own dev server and
game database instead.

## Purpose

The experiment runner is the preferred isolation model for canonical bot
experiments. Each run receives one compiled game server, one bot, and one
monitor inside a private worker container. Runs never share a world and do not
use area leases.

Legacy `bot:batch --executionMode=isolated-parallel` remains available for
migration and incident reproduction, but it is deprecated for canonical
evidence. Its shared-world permits cannot establish solo isolation.

## Invariants

- `experiment:create` accepts only a Git commit-ish and resolves it to a full
  commit SHA and source-tree SHA. Uncommitted checkout changes are recorded but
  excluded.
- The built image contains compiled sources. Workers use the image ID, expose no
  game-server port to the host, and mount only run artifacts and optional
  read-only snapshot inputs. There is no source watcher or mutable source mount.
- The frozen experiment manifest is sealed with `experiment.sha256`. The
  supervisor refuses to run if it changes.
- Each run gets a fresh worker container and uniquely named game and log
  databases. One experiment-scoped PostgreSQL container and one namespaced
  Redis container are shared only as storage services; neither publishes host
  ports or uses the development services.
- The worker verifies the server-reported full revision and build ID before it
  starts the bot.
- The supervisor persists every state transition. There are no automatic
  retries. Server exit, bot exit without a terminal summary, repeated health
  failure, supervisor heartbeat loss, disconnect, and deadline expiry become
  explicit terminal evidence. Partial logs and telemetry stay on the host.
- Worker concurrency defaults to 2, accepts 1–4, and rejects 6/8. Four workers
  are opt-in until resource qualification says otherwise.

## Workflow

From the repository root:

```powershell
# Freeze an exact committed revision. Quote comma-separated routes in PowerShell.
pnpm experiment:create --revision=HEAD --routes="striker-t1,squire-t1" --workers=2

# The create command prints the experiment id. "latest" is also accepted.
pnpm experiment:launch --id=latest
pnpm experiment:status --id=latest

# Normal development can continue while the frozen containers run.

pnpm experiment:report --id=latest
pnpm experiment:stop --id=latest
pnpm experiment:clean --id=latest
```

Artifacts default to
`%LOCALAPPDATA%\mmo-idle\experiments\<experiment-id>` and survive worker and
runtime cleanup. `experiment.json` identifies the commit, tree, image ID, build
ID, frozen options, inputs, and whether the invoking checkout was dirty.
`state.json` is the durable queue. Per-run directories contain server/bot logs,
worker heartbeat, resource samples, terminal result, and the existing bot
telemetry tree. `cohort-summary.json` adds peak worker memory, approximate
container CPU, and server event-loop p99 observations without replacing the
existing T1/T2 report commands. Since 2026-09-30 each run row also carries the
per-fight HP columns read from that run's `summary.json → combat.fights`
(`fights`, `fightDeaths`, `medianFightEndHp`, `fightTimeInBandShare`, and
`fightsByBiome`), and `experiment:report` prints the first three in its table.
This is the progression rework Phase 0 metric; the definition is in
`bot/src/telemetry/fightHp.ts`.

`experiment:clean` removes only containers, network, and PostgreSQL volume
labeled/named for that exact experiment. It deliberately retains artifacts and
the frozen image.

## Canonical and smoke modes

`canonical-isolated` is the default. It enforces 1x rewards and no fast boss
retry. Campaign routes and synthetic tier-entry starts are gone (D5); the
class routes came back per class in the class-first build. Every class route
starts from a fresh character and replays the earlier tiers' steps itself
(`striker-t2-light` runs all of `striker-t1` first), so none needs a snapshot.
The bot ignores unknown flags the runner can still forward
(`--tierEntrySnapshotDir`, `--entryEconomy`, `--requireTierEntrySnapshot`).
Canonical mode still refuses a synthetic `--tierEntry` profile. A named
continuation still reads one `--tierEntrySnapshot` file when the route
declares `progressionEntry`; no registered route declares one, so a snapshot
passed to any route fails at bot start.

**Known conflict:** `scripts/experiment/lib.mjs` still requires a snapshot in
canonical mode for any route id containing `-t2` (a rule from the removed
snapshot-entry T2 routes). So `experiment:create` refuses the class T2 routes
(`striker-t2-*`, `squire-t2`, `conduit-t2`, `slinger-t2`, `spirit-t2`,
`apprentice-t2`) without a snapshot, and the bot refuses the snapshot. Until
that check goes, run them in `smoke-isolated` mode or on a lane. The `-t3` and
`-t4` routes pass the check.

`smoke-isolated` allows accelerated rewards and `next-tier` completion for
pipeline and resource qualification. Its results are non-canonical whenever
the existing bot telemetry says so and must not be pooled with economy/balance
evidence.

Examples:

```powershell
# The six T1 class routes at 1x (hours each).
pnpm experiment:create --revision=<full-sha> --routes="striker-t1,squire-t1,conduit-t1,slinger-t1,spirit-t1,apprentice-t1" --workers=2

# A class T2 route: smoke mode only, until the -t2 snapshot check is removed.
pnpm experiment:create --revision=<full-sha> --routes="squire-t2" --mode=smoke-isolated --rewardMultiplier=25 --workers=1

# Short resource/pipeline qualification, never balance evidence.
pnpm experiment:create --revision=<full-sha> --routes="smoke-t1" --mode=smoke-isolated --completion=next-tier --rewardMultiplier=1000 --workers=2
```

## Deliberately deferred

No web UI, worker auto-sizing, automatic retry, dirty-tree canonical build,
6/8-worker scale, shared-social topology, or leasing deletion is part of this
version.

## Resource qualification

Qualification is executed from a detached test commit so working-copy edits
made after image creation are intentionally absent from the frozen image.

The workloads below were the pre-rework class routes D5 removed (the old
`striker-t1` and its siblings, plus one Striker T2 snapshot continuation; the
same ids now name the class-first routes, which are different data). The
table is a past measurement of the runner, not a route you can launch.

Qualification revision: `405411607ddc1cf6e69d798e5739d4dadaa60bf2`
(detached local test commit; no project branch was moved). The resource routes
used `smoke-isolated`, 1000x rewards, and `next-tier`, so their gameplay output
is intentionally non-canonical. The bounded runs exercised real route code and
ended as explicit timeouts with complete partial summaries.

| Stage | Workload | Observed experiment memory | Worker peaks | Peak event-loop p99 | Result |
|---|---|---:|---:|---:|---|
| A | 1 × Striker, 10 min | ~208 MiB live sample | 165.9 MiB | 26.1 ms | Passed isolation/runtime checks; explicit timeout preserved 87/118 steps and Snapshot A. |
| B | Striker + Squire, 3 min | ~374 MiB live sample | 145.4 / 151.7 MiB | 22.9 ms | Passed; both worlds remained isolated and terminal artifacts were complete. |
| C | Striker + Squire + Slinger + Spirit, 3 min | ~713 MiB live sample | 146.8–161.9 MiB | 33.4 ms | Passed short qualification; opt-in ceiling, not the default. |

Across all stages, every summary reported `isolationGrade=isolated` and
`otherPlayersSeen=0`. Sampled server tick/broadcast CPU peaked at 22.3 ms and
orphan CPU stayed at 0%. The four-worker p99 remained below the 50 ms tick
period, but was higher than one/two workers.

Comparable Striker timing did not show a clear throughput collapse: tier-1 was
reached at 120.6 s (A), 123.4 s (B), and 115.0 s (C); the GM-6 milestone was
151.0 s, 145.9 s, and 165.5 s respectively. The largest difference was about
13%, so 2 remains the known-safe operational default and 4 remains explicitly
configurable for short/monitored cohorts.

During A, the working-copy doc changed and `mmo-server-dev` was restarted. The
experiment worker retained the same container ID, image ID, start time, full
revision, source tree, and build ID. The worker and dev server were on different
Docker networks. The experiment PostgreSQL contained only its unique `g_*` and
`l_*` databases; experiment services published no host ports.

The Snapshot B mount below is the same past qualification, not a launch step.
A real canonical Snapshot B was mounted read-only into an isolated
Striker T2 continuation. Its profile validation passed 122/122 checks, live
spawn validation passed 89/89 checks, and the run completed. Real snapshot
entries are not labeled `SYNTHETIC_TIER_ENTRY`; canonical mode additionally
rejects a Snapshot B whose capture was non-canonical or not at 1x rewards.

The stop/cleanup probe classified an active worker as
`worker_received_sigterm`, a queued run as `user_cancelled_before_start`, kept
their artifacts, removed only that experiment's containers/network/database
volume, and left all development services running.
