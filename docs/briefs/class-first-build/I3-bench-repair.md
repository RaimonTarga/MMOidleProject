# I3: the server bench fights again

**Agent:** Grok · **Worktree:** `../mmo-rw-i3-bench` · **Branch:** `rw/i3-bench` (from
`rework/class-first`) · **Size:** S · **Phase 0, wave A** (independent of every other task)

**Read first:** `docs/briefs/class-first-build/AGENT-RULES.md`; `CLAUDE.md`;
`server/bench/run.ts`, `harness.ts`, `scenarios.ts`; `server/bench/summonCap.ts` (a newer bench
that already does this right: read how it thaws a node); `server/src/world/nodeLifecycle.ts`
(`thawNode`); `shared/src/world/nodeBiomes.ts` (`NODE_BIOMES`).

## Why

`pnpm bench:server` has not measured combat since the world became an authored node registry.
Its scenarios place players in node id `node-5-5`, which no longer exists, and it never thaws
a node: `world.attachPlayerEntity` counts occupancy but doesn't populate monsters; the live
server calls `thawNode(world, nodeId)` when a player joins. The 8 monsters it reports are the
dev test room's. The rework will lean on this bench (summon caps, class runtimes), so it must
measure real fights.

## Do

1. `scenarios.ts`: `idle` and `autoCombatSameNode` use `node-t1-plains-01`; `spreadNodes`
   spreads players over the T1 nodes from `NODE_BIOMES` (biome tier 1, not the Clearing).
2. `harness.ts` (`spawnBenchPlayers` or its equivalent): thaw each node before attaching its
   first player, the same way `summonCap.ts` does.
3. `run.ts`: count only monsters in the scenario's nodes.
4. Scripts: in `server/package.json` add
   `"bench:summon-cap": "tsx --conditions=development bench/summonCap.ts"`; in the root
   `package.json` add `"bench:summon-cap": "pnpm --filter @mmo-idle/server bench:summon-cap"`.
   Don't edit `summonCap.ts` itself.

## Allowed paths

`server/bench/run.ts`, `server/bench/harness.ts`, `server/bench/scenarios.ts`,
`server/package.json` (the one script line), the root `package.json` (the one script line),
your report.

## Check

- `pnpm typecheck` clean (it includes `typecheck:bench`).
- `pnpm bench:server -- --scenario autoCombatSameNode --players 1,5`: the monsters column is the
  node's own population (dozens, not 8). Paste the table in the report.
- `pnpm bench:summon-cap -- --summons 0,4 --owners 1`: runs and prints its table (paste it).
- `git diff --numstat`: no whole-file line-ending churn.

## Don't

- Don't change any gameplay file under `server/src` or `shared/src`, tick or broadcast rates,
  or delete scenarios.

## Report

`docs/briefs/class-first-build/reports/I3.md` (shape in AGENT-RULES.md) with both tables.
