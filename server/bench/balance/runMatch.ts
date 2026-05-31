import { formatWorldLogEntry, MONSTER_DATABASE } from '@mmo-idle/shared';
import { BENCH_DT_MS } from '../harness';
import type { World } from '../../src/world/World';
import type { PlayerEntity } from '../../src/ecs/entity';
import { joinParty } from '../../src/systems/player/party/partySystem';
import { createBalanceWorld } from './worldFactory';
import { setupArena, teardownArena, BOT_SPAWN, partySpawn } from './arena';
import { materializeBot, benchBotId, BENCH_BOT_ID } from './botFactory';
import { BalanceMetricsCollector } from './metrics';
import type {
  BalanceOutcome,
  BalanceRunResult,
  BuildSpec,
  ContentTarget,
  FightLogLine,
} from './types';

/** Project the world's combat journal into serializable fight-log lines. */
function buildFightLog(world: World, dt: number): FightLogLine[] {
  return world.worldLogJournal.map((event) => {
    const f = formatWorldLogEntry(event, BENCH_BOT_ID);
    return {
      tick: event.tick,
      timeMs: event.tick * dt,
      kind: f.kind,
      headline: f.headline,
      detail: f.detail,
    };
  });
}

export function isNodeCleared(world: World, nodeId: string): boolean {
  for (const _ of world.monsterEntitiesInNode(nodeId)) {
    return false;
  }
  return true;
}

/** The boss monster type id present in the node, if any (read before the fight). */
function findBossTypeId(world: World, nodeId: string): string | undefined {
  for (const monster of world.monsterEntitiesInNode(nodeId)) {
    const typeId = monster.isMonster.monsterTypeId;
    if (MONSTER_DATABASE.get(typeId)?.isBoss) return typeId;
  }
  return undefined;
}

export function runBalanceMatch(
  build: BuildSpec,
  target: ContentTarget,
  opts: { maxSimSeconds: number; timeScale: number; captureLog?: boolean },
): BalanceRunResult {
  const world = createBalanceWorld();
  if (opts.captureLog) {
    world.worldLogJournalMax = Number.MAX_SAFE_INTEGER;
  }
  const dt = BENCH_DT_MS * opts.timeScale;
  const metrics = new BalanceMetricsCollector(BENCH_BOT_ID);
  metrics.register();

  let botHpEnd = 0;
  let initialMobCount = 0;
  let ticks = 0;
  let bossTypeId: string | undefined;

  try {
    initialMobCount = setupArena(world, target);
    bossTypeId = findBossTypeId(world, target.nodeId);
    const bot = materializeBot(world, build, target, BOT_SPAWN);

    let now = 0;
    const maxTicks = Math.ceil((opts.maxSimSeconds * 1000) / dt);

    while (ticks < maxTicks) {
      world.tick(dt, now);
      world.pendingDeaths = [];
      now += dt;
      ticks++;

      if (bot.hasHealth.hp <= 0 || metrics.botKilled) break;
      if (isNodeCleared(world, target.nodeId)) break;
    }

    botHpEnd = bot.hasHealth.hp;
    const maxHp = bot.hasHealth.maxHp;
    const cleared = isNodeCleared(world, target.nodeId);
    const outcome: BalanceOutcome =
      cleared && bot.hasHealth.hp > 0
        ? 'clear'
        : bot.hasHealth.hp <= 0 || metrics.botKilled
          ? 'bot_died'
          : 'timeout';

    const fightLog = opts.captureLog ? buildFightLog(world, dt) : undefined;

    return {
      buildId: build.id,
      biomeGroup: target.biomeGroup,
      contentTier: target.contentTier,
      nodeId: target.nodeId,
      isDungeon: target.isDungeon,
      outcome,
      simDurationMs: ticks * dt,
      ticks,
      timeScale: opts.timeScale,
      initialMobCount,
      damageDealt: metrics.damageDealt,
      damageTaken: metrics.damageTaken,
      botHpEnd,
      maxHp,
      bossTypeId,
      fightLog,
    };
  } finally {
    metrics.dispose();
    teardownArena(world);
  }
}

/**
 * Run a 4-bot party against an overlord. Member 0 leads; the rest join the party
 * and assist via the normal auto-combat follow/assist AI. Returns party-aggregate
 * metrics: `damageDealt`/`damageTaken` are party totals and `botHpEnd`/`maxHp`
 * are summed across members (so `botHpEnd / maxHp` is the party-average end HP).
 */
export function runOverlordMatch(
  party: BuildSpec[],
  target: ContentTarget,
  opts: { maxSimSeconds: number; timeScale: number; captureLog?: boolean },
): BalanceRunResult {
  const world = createBalanceWorld();
  if (opts.captureLog) {
    world.worldLogJournalMax = Number.MAX_SAFE_INTEGER;
  }
  const dt = BENCH_DT_MS * opts.timeScale;
  const ids = party.map((_, i) => benchBotId(i));
  const metrics = new BalanceMetricsCollector(ids);
  metrics.register();

  let initialMobCount = 0;
  let ticks = 0;
  let bossTypeId: string | undefined;

  try {
    initialMobCount = setupArena(world, target);
    bossTypeId = findBossTypeId(world, target.nodeId);

    const members: PlayerEntity[] = party.map((build, i) =>
      materializeBot(world, build, target, partySpawn(i), ids[i]),
    );
    // One party: member 0 leads, the rest join so follow/assist AI engages.
    const leaderId = members[0].isPlayer.id;
    for (let i = 1; i < members.length; i++) {
      joinParty(world, members[i], leaderId);
    }

    let now = 0;
    const maxTicks = Math.ceil((opts.maxSimSeconds * 1000) / dt);
    while (ticks < maxTicks) {
      world.tick(dt, now);
      world.pendingDeaths = [];
      now += dt;
      ticks++;

      if (metrics.allDead) break;
      if (isNodeCleared(world, target.nodeId)) break;
    }

    let totalEndHp = 0;
    let totalMaxHp = 0;
    let deaths = 0;
    for (const m of members) {
      totalMaxHp += m.hasHealth.maxHp;
      const hp = Math.max(0, m.hasHealth.hp);
      totalEndHp += hp;
      if (hp <= 0) deaths++;
    }
    deaths = Math.max(deaths, metrics.deathCount);
    const aliveCount = members.length - deaths;
    const cleared = isNodeCleared(world, target.nodeId);

    const outcome: BalanceOutcome =
      cleared && aliveCount > 0
        ? 'clear'
        : aliveCount <= 0
          ? 'bot_died'
          : 'timeout';

    const fightLog = opts.captureLog ? buildFightLog(world, dt) : undefined;

    return {
      buildId: party.map((b) => b.id).join(' + '),
      biomeGroup: target.biomeGroup,
      contentTier: target.contentTier,
      nodeId: target.nodeId,
      isDungeon: target.isDungeon,
      outcome,
      simDurationMs: ticks * dt,
      ticks,
      timeScale: opts.timeScale,
      initialMobCount,
      damageDealt: metrics.damageDealt,
      damageTaken: metrics.damageTaken,
      botHpEnd: totalEndHp,
      maxHp: totalMaxHp,
      bossTypeId,
      partyBuildIds: party.map((b) => b.id),
      partyDeaths: deaths,
      fightLog,
    };
  } finally {
    metrics.dispose();
    teardownArena(world);
  }
}
