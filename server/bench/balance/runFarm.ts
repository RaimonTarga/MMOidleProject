import {
  ESSENCE_TYPES,
  GAME_CONFIG,
  biomeLevelCap,
  type EssenceType,
} from '@mmo-idle/shared';
import { BENCH_DT_MS } from '../harness';
import type { World } from '../../src/world/World';
import type { EntityId, PlayerEntity } from '../../src/ecs/entity';
import { respawnPlayer } from '../../src/systems/world/spawning';
import { checkRecipeUnlocks } from '../../src/systems/player/progression/rewards';
import { thawNode } from '../../src/world/nodeLifecycle';
import { recalculatePlayerEntityStats } from '../../src/ecs/playerEntityFormulas';
import { syncArchetypeSlices } from '../../src/ecs/archetypeSliceSync';
import { createFarmWorld } from './worldFactory';
import { setupArena, teardownArena, BOT_SPAWN } from './arena';
import { materializeBot, BENCH_BOT_ID } from './botFactory';
import { BalanceMetricsCollector } from './metrics';
import { diffLedger, perHour, snapshotLedger } from './ledger';
import type { FarmTarget } from './farmTargets';
import type { BuildSpec, FarmRunResult } from './types';

const MS_PER_HOUR = 3_600_000;

/** Per-hour essence rates, keeping every colour present (including zeros). */
function essenceRates(
  totals: Record<EssenceType, number>,
  hours: number,
): Record<EssenceType, number> {
  const out = {} as Record<EssenceType, number>;
  for (const type of ESSENCE_TYPES) {
    out[type] = hours > 0 ? totals[type] / hours : 0;
  }
  return out;
}

/** Live monster entity ids in a node, as a set (for tick-to-tick kill diffing). */
function monsterIdsInNode(world: World, nodeId: string): Set<EntityId> {
  const ids = new Set<EntityId>();
  for (const monster of world.monsterEntitiesInNode(nodeId)) {
    ids.add(monster.entityId);
  }
  return ids;
}

/**
 * Start the farmed biome at level 0 so biome XP is actually measurable.
 *
 * `materializeBot` caps every reachable biome (Global Mastery realism for a
 * fight bench), but `applyBiomeXP` early-returns at the cap — a capped bot would
 * report exactly 0 XP/hour by construction. A player arriving in a new biome has
 * it at 0, so this is also the more faithful state for an income run. Gear stays
 * fully upgraded: `materializeBot` writes `itemUpgrades` directly and the stat
 * recalc applies them without a biome-level gate.
 *
 * The benchmark loadout is rebuilt independently; this helper only resets farm state.
 */
function resetFarmedBiome(
  world: World,
  bot: PlayerEntity,
  biomeGroup: string,
): void {
  const prog = bot.tracksProgression;
  prog.biomeLevel[biomeGroup] = 0;
  prog.biomeXP[biomeGroup] = 0;

  // Every kill runs an unfiltered `checkRecipeUnlocks`, so the bot's other
  // (capped) biomes would all unlock on the first kill and swamp the count.
  // Bank them into the BASELINE here so the reported figure is what this node's
  // farming actually unlocked.
  checkRecipeUnlocks(bot);

  recalculatePlayerEntityStats(world, bot);
  syncArchetypeSlices(world, bot);
  bot.hasHealth.hp = bot.hasHealth.maxHp;
}

/**
 * Revive the bot where it fell and keep farming.
 *
 * A farm run measures income rate, so it must not end at the first death — but
 * the death is real and is counted. We run the live `respawnPlayer` (which is
 * what correctly clears `isDead`, combat scratch state, minions, and aggro) and
 * then put the bot back in the farmed node, because the real respawn drops it at
 * the region's sanctuary and the run would otherwise silently continue somewhere
 * with nothing to kill.
 */
function reviveInFarmNode(
  world: World,
  bot: PlayerEntity,
  nodeId: string,
): void {
  respawnPlayer(world, bot.isPlayer.id);

  const from = bot.hasPosition.nodeId;
  if (from !== nodeId) {
    if (world.isNodeFrozen(nodeId)) thawNode(world, nodeId);
    bot.hasPosition.nodeId = nodeId;
    world.movePlayerNode(from, nodeId, bot.isPlayer.id);
    world.resetNodeDeltaState(nodeId);
  }
  bot.hasPosition.current = { ...BOT_SPAWN };
  bot.hasHealth.hp = bot.hasHealth.maxHp;
}

export interface FarmRunOptions {
  maxSimSeconds: number;
  timeScale: number;
}

export function runFarm(
  build: BuildSpec,
  target: FarmTarget,
  opts: FarmRunOptions,
): FarmRunResult {
  const world = createFarmWorld();
  const dt = BENCH_DT_MS * opts.timeScale;
  const metrics = new BalanceMetricsCollector(BENCH_BOT_ID);
  metrics.register();

  let ticks = 0;
  let kills = 0;
  let deaths = 0;
  let cappedAtMs: number | null = null;

  try {
    setupArena(world, target);
    const bot = materializeBot(world, build, target, BOT_SPAWN);
    resetFarmedBiome(world, bot, target.biomeGroup);

    const levelCap = biomeLevelCap(build.playerTier, target.biomeGroup);
    const before = snapshotLedger(bot);

    let now = 0;
    const maxTicks = Math.ceil((opts.maxSimSeconds * 1000) / dt);
    // A monster present at the end of one tick can only leave the node by dying:
    // repopulation runs at the END of `world.tick`, after combat, so nothing can
    // spawn and die inside the same tick and be missed by this diff.
    let liveIds = monsterIdsInNode(world, target.nodeId);

    while (ticks < maxTicks) {
      world.tick(dt, now);
      world.pendingDeaths = [];
      now += dt;
      ticks++;

      // Nothing broadcasts deltas here, so the hit/kill animation queue would
      // grow for the whole run. The live server drains it every broadcast tick;
      // do the same, or an hour-long farm accumulates six figures of events.
      world.clearNodeEvents(target.nodeId);

      const nextIds = monsterIdsInNode(world, target.nodeId);
      for (const id of liveIds) {
        if (!nextIds.has(id)) kills++;
      }
      liveIds = nextIds;

      if (bot.isDead) {
        deaths++;
        reviveInFarmNode(world, bot, target.nodeId);
      }

      if (
        cappedAtMs === null &&
        (bot.tracksProgression.biomeLevel[target.biomeGroup] ?? 0) >= levelCap
      ) {
        cappedAtMs = now;
      }
    }

    const after = snapshotLedger(bot);
    const delta = diffLedger(
      before,
      after,
      GAME_CONFIG.CATALYST_PROGRESS_PER_UNIT,
    );

    const simDurationMs = ticks * dt;
    const hours = simDurationMs / MS_PER_HOUR;
    // Past the cap `applyBiomeXP` grants nothing, so averaging over the whole
    // run would report a rate that decays with run length instead of an income.
    const xpHours = (cappedAtMs ?? simDurationMs) / MS_PER_HOUR;

    return {
      buildId: build.id,
      classRoot: build.classRoot,
      biomeGroup: target.biomeGroup,
      contentTier: target.contentTier,
      nodeId: target.nodeId,
      pace: target.pace,
      density: target.density,
      mobDensity: world.getMobDensity(target.nodeId),
      simDurationMs,
      ticks,
      timeScale: opts.timeScale,

      kills,
      killsPerHour: hours > 0 ? kills / hours : 0,
      deaths,
      deathsPerHour: hours > 0 ? deaths / hours : 0,

      essenceTotal: delta.essences,
      essencePerHour: essenceRates(delta.essences, hours),
      essenceSum: delta.essenceTotal,
      essenceSumPerHour: hours > 0 ? delta.essenceTotal / hours : 0,

      catalystTotal: delta.catalysts,
      catalystPerHour: perHour(delta.catalysts, hours),
      catalystSum: delta.catalystTotal,
      catalystSumPerHour: hours > 0 ? delta.catalystTotal / hours : 0,

      biomeXpTotal: delta.biomeXP[target.biomeGroup] ?? 0,
      biomeXpPerHour:
        xpHours > 0 ? (delta.biomeXP[target.biomeGroup] ?? 0) / xpHours : 0,
      biomeLevelStart: 0,
      biomeLevelEnd: after.biomeLevel[target.biomeGroup] ?? 0,
      biomeLevelCap: levelCap,
      hoursToBiomeCap: cappedAtMs === null ? null : cappedAtMs / MS_PER_HOUR,
      recipesUnlocked: delta.recipesUnlocked,

      damageDealt: metrics.damageDealt,
      damageTaken: metrics.damageTaken,
    };
  } finally {
    metrics.dispose();
    teardownArena(world);
  }
}
