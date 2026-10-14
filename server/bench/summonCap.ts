#!/usr/bin/env tsx
/**
 * Summon-cap cost bench (class-first rework, bible §7.2 / §7.13: "summon-cap steps
 * (tick time, bandwidth)"). Measures what N summons per Conduit cost the server tick
 * and the node delta, so the cap can be raised in measured steps.
 *
 * It patches the CURRENT formation tuning at runtime (cap, root count, HP and offense
 * per body) instead of editing gameplay code, so it measures today's minion runtime:
 * one ECS entity per summon, the per-minion AI, the formation attack through
 * `runPlayerAttack`, and the node delta. Each body keeps the root's per-body HP
 * (20% of the owner's) and per-body damage, as the rework's summons will: an army
 * does not split one budget.
 *
 * The owner is topped up to full HP before every tick so a big pull never kills it
 * and rebuilds are always affordable (worst-case churn, not a balance result).
 *
 *   pnpm --filter @mmo-idle/server exec tsx --conditions=development bench/summonCap.ts \
 *     [--summons 0,4,9,12,20,30] [--owners 1,5] [--spread 0] [--node node-t1-plains-01]
 *
 * `--owners` puts that many Conduits in ONE node (a party); `--spread N` instead
 * puts one Conduit in each of N T1 nodes (server-wide load). `--summons 0` runs a
 * Striker owner with no summons as the node's baseline.
 */
import {
  DEFAULT_AUTOCOMBAT_CONFIG,
  GAME_CONFIG,
  NODE_BIOMES,
  STARTER_RUNE_IDS,
  SUMMONER_CORE_TUNING,
  SUMMONER_FRAME_TUNING,
  baseRecoveryForTier,
  emptyEquipment,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { World } from '../src/world/World';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { syncArchetypeSlices } from '../src/ecs/archetypeSliceSync';
import { recalculatePlayerEntityStats } from '../src/ecs/playerEntityFormulas';
import summonerModule, { relocateMinionsForOwner } from '../src/systems/classes/archetypes/summoner';
import type { PlayerEntity } from '../src/ecs/entity';
import { markSliceDirty } from '../src/ecs/dirtyHelpers';
import { thawNode } from '../src/world/nodeLifecycle';

const DT = Math.round(1000 / GAME_CONFIG.LOGIC_TICK_RATE);
const TICKS_PER_BROADCAST = Math.round(GAME_CONFIG.LOGIC_TICK_RATE / GAME_CONFIG.BROADCAST_TICK_RATE);
const WARMUP_TICKS = 200;
const MEASURE_TICKS = 600;

const ROOT_COUNT = SUMMONER_CORE_TUNING.rootCount;
const ROOT_HP_PCT = SUMMONER_FRAME_TUNING.root.totalSummonHpPct;
const ROOT_OFFENSE = SUMMONER_CORE_TUNING.formationOffenseMult;
const ORIGINAL_CAP = SUMMONER_CORE_TUNING.hardEntityCap;

function percentile(values: number[], pct: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor((pct / 100) * sorted.length))] ?? 0;
}

function list(arg: string | undefined, fallback: number[]): number[] {
  if (!arg) return fallback;
  return arg.split(',').map((s) => Number(s.trim())).filter((n) => Number.isFinite(n));
}

function parseArgs(argv: string[]) {
  const get = (flag: string) => {
    const i = argv.indexOf(flag);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  return {
    summons: list(get('--summons'), [0, 4, 9, 12, 20, 30]),
    owners: list(get('--owners'), [1, 5]),
    spread: Number(get('--spread') ?? 0),
    node: get('--node') ?? 'node-t1-plains-01',
  };
}

/** Patch today's formation tuning so the root fields `count` bodies of root size. */
function patchFormation(count: number): void {
  const core = SUMMONER_CORE_TUNING as unknown as Record<string, number>;
  const root = SUMMONER_FRAME_TUNING.root as unknown as Record<string, number>;
  const bodies = Math.max(1, count);
  core.hardEntityCap = Math.max(ORIGINAL_CAP, bodies);
  root.count = bodies;
  // Per-body HP and damage stay at the root's (4 bodies): the army does not split.
  root.totalSummonHpPct = (ROOT_HP_PCT / ROOT_COUNT) * bodies;
  core.formationOffenseMult = (ROOT_OFFENSE / ROOT_COUNT) * bodies;
}

function benchOwner(id: string, nodeId: string, conduit: boolean): PersistedPlayerSlices {
  const equipment = emptyEquipment();
  equipment.weapon = 'iron-broadsword';
  equipment.armor = 'plains-vest-t1';
  return {
    isPlayer: { id, name: id },
    hasPosition: {
      current: { x: GAME_CONFIG.NODE_WIDTH / 2, y: GAME_CONFIG.NODE_HEIGHT / 2 },
      nodeId,
      speed: GAME_CONFIG.PLAYER_SPEED,
    },
    hasHealth: { hp: GAME_CONFIG.PLAYER_MAX_HP, maxHp: GAME_CONFIG.PLAYER_MAX_HP, recovery: baseRecoveryForTier(1) },
    tracksProgression: {
      level: 0, skillPoints: 0,
      essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      
      biomeXP: {}, biomeLevel: {},
      unlockedRecipes: [], questProgress: {},
      playerTier: 1, currentSkillTier: 1,
      bossesCleared: [], clearedNodes: [],
      runesOwned: [...STARTER_RUNE_IDS], runeRecipesCrafted: [], runesEquipped: [],
      knownAbilities: [],
      attunedAbilities: { techniques: [], guards: [] },
      knownStances: [], equippedStances: { default: null }, activeStance: null,
      knownRites: [], equippedRites: [],
    },
    holdsInventory: { inventory: [], equipment, itemUpgrades: {} },
    usesSkills: conduit
      ? {
        unlockedSkills: ['summoner-root'], passives: {},
        selectedClass: 'summoner-root', selectedSubVariant: null, selectedRange: null,
        combatArchetype: 'summoner',
      }
      : {
        unlockedSkills: ['cadence-root'], passives: {},
        selectedClass: 'cadence-root', selectedSubVariant: null, selectedRange: null,
        combatArchetype: 'cadence',
      },
  };
}

interface Row {
  layout: string;
  owners: number;
  summonsEach: number;
  liveSummons: number;
  monsters: number;
  kills: number;
  tickP50: number;
  tickP95: number;
  tickMax: number;
  summonerP50: number;
  summonerP95: number;
  bcastP50: number;
  deltaP50: number;
  deltaP95: number;
  fullBytes: number;
}

function runCell(
  layout: string,
  nodeIds: string[],
  ownersPerNode: number,
  summonsEach: number,
): Row {
  const conduit = summonsEach > 0;
  if (conduit) patchFormation(summonsEach);
  const world = new World();
  const owners: PlayerEntity[] = [];
  for (const nodeId of nodeIds) {
    // `attachPlayerEntity` counts occupancy but does not populate the node; the
    // live server thaws on join (`playerHandlers.ts`), so the bench must too.
    if (world.isNodeFrozen(nodeId)) thawNode(world, nodeId);
    for (let i = 0; i < ownersPerNode; i++) {
      const id = `bench-${nodeId}-${i}`;
      const entity = world.attachPlayerEntity(benchOwner(id, nodeId, conduit), id);
      syncArchetypeSlices(world, entity);
      recalculatePlayerEntityStats(world, entity);
      syncArchetypeSlices(world, entity);
      Object.assign(entity.usesAutocombat, DEFAULT_AUTOCOMBAT_CONFIG, { auto: true });
      owners.push(entity);
    }
  }

  // A farming route stand-in: an owner with nothing in reach walks to the nearest
  // living monster, so every cell measures sustained fighting, not an idle node.
  const nextPull = (owner: PlayerEntity) => {
    if (owner.hasAttackTarget || owner.summonsMinions?.formationTargetId) return;
    let best: { x: number; y: number } | null = null;
    let bestDistSq = Infinity;
    for (const m of world.monsterEntitiesInNode(owner.hasPosition.nodeId)) {
      if (m.hasHealth.hp <= 0 || m.isMonster.isBoss) continue;
      const dx = m.hasPosition.current.x - owner.hasPosition.current.x;
      const dy = m.hasPosition.current.y - owner.hasPosition.current.y;
      if (dx * dx + dy * dy < bestDistSq) {
        bestDistSq = dx * dx + dy * dy;
        best = m.hasPosition.current;
      }
    }
    if (!best) return;
    owner.hasPosition.current = { x: best.x - 60, y: best.y };
    markSliceDirty(world, owner, 'hasPosition');
    relocateMinionsForOwner(world, owner);
  };

  // Time the summoner mechanic on its own by wrapping the registered module's tick.
  const module = summonerModule as unknown as { tick: (w: World, dt: number, now: number) => void };
  const originalTick = module.tick;
  let summonerMs = 0;
  module.tick = (w, dt, now) => {
    const t0 = performance.now();
    originalTick(w, dt, now);
    summonerMs += performance.now() - t0;
  };

  let tickIndex = 0;
  const topUp = () => {
    tickIndex++;
    for (const owner of owners) {
      owner.hasHealth.hp = owner.hasHealth.maxHp;
      if (tickIndex % 20 === 0) nextPull(owner);
    }
  };

  let now = Date.now();
  try {
    for (let i = 0; i < WARMUP_TICKS; i++) {
      topUp();
      world.tick(DT, now);
      now += DT;
      if ((i + 1) % TICKS_PER_BROADCAST === 0) {
        const dirty = world.beginBroadcast();
        for (const nodeId of nodeIds) world.buildNodeDeltaWithStats(nodeId, dirty);
      }
    }

    const ticks: number[] = [];
    const summonerTicks: number[] = [];
    const broadcasts: number[] = [];
    const deltaBytes: number[] = [];
    let liveSummons = 0;
    const seenMonsters = new Set<string>();
    let monsters = 0;
    for (let i = 0; i < MEASURE_TICKS; i++) {
      topUp();
      summonerMs = 0;
      const t0 = performance.now();
      world.tick(DT, now);
      ticks.push(performance.now() - t0);
      summonerTicks.push(summonerMs);
      now += DT;
      if ((i + 1) % TICKS_PER_BROADCAST === 0) {
        const dirty = world.beginBroadcast();
        const b0 = performance.now();
        for (const nodeId of nodeIds) {
          deltaBytes.push(world.buildNodeDeltaWithStats(nodeId, dirty).stats.deltaBytes);
        }
        broadcasts.push(performance.now() - b0);
        liveSummons += world.minionEntities.size;
        for (const m of world.monsterEntities) if (nodeIds.includes(m.hasPosition.nodeId)) seenMonsters.add(m.isMonster.id);
        monsters += [...world.monsterEntities].filter((m) => nodeIds.includes(m.hasPosition.nodeId)).length;
      }
    }
    const samples = broadcasts.length || 1;
    const resync = world.buildNodeDeltaWithStats(nodeIds[0]!, world.beginBroadcast(), { resync: true });

    return {
      layout,
      owners: owners.length,
      summonsEach,
      liveSummons: Math.round(liveSummons / samples),
      monsters: Math.round(monsters / samples),
      kills: [...seenMonsters].filter((id) => !world.hasMonster(id)).length,
      tickP50: percentile(ticks, 50),
      tickP95: percentile(ticks, 95),
      tickMax: Math.max(...ticks),
      summonerP50: percentile(summonerTicks, 50),
      summonerP95: percentile(summonerTicks, 95),
      bcastP50: percentile(broadcasts, 50),
      deltaP50: percentile(deltaBytes, 50),
      deltaP95: percentile(deltaBytes, 95),
      fullBytes: resync.stats.deltaBytes,
    };
  } finally {
    module.tick = originalTick;
    for (const owner of owners) world.detachPlayerEntity(owner.isPlayer.id);
  }
}

function print(row: Row): void {
  const kbs = (bytes: number) => ((bytes * GAME_CONFIG.BROADCAST_TICK_RATE) / 1024).toFixed(1);
  console.log([
    row.layout, row.owners, row.summonsEach, row.liveSummons, row.monsters, row.kills,
    row.tickP50.toFixed(2), row.tickP95.toFixed(2), row.tickMax.toFixed(2),
    row.summonerP50.toFixed(2), row.summonerP95.toFixed(2), row.bcastP50.toFixed(2),
    row.deltaP50, row.deltaP95, kbs(row.deltaP50), kbs(row.deltaP95), row.fullBytes,
  ].join(','));
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  initCombatSystems();
  console.log('layout,owners,summons_each,live_summons,monsters,kills,tick_p50_ms,tick_p95_ms,tick_max_ms,'
    + 'summoner_p50_ms,summoner_p95_ms,broadcast_p50_ms,delta_p50_bytes,delta_p95_bytes,'
    + 'delta_p50_kb_s_per_viewer,delta_p95_kb_s_per_viewer,full_snapshot_bytes');
  if (args.spread > 0) {
    const t1Nodes = Object.entries(NODE_BIOMES)
      .filter(([, info]) => info.biomeTier === 1 && info.biomeGroup !== 'clearing')
      .map(([id]) => id)
      .slice(0, args.spread);
    for (const summons of args.summons) print(runCell(`spread-${t1Nodes.length}`, t1Nodes, 1, summons));
    return;
  }
  for (const owners of args.owners) {
    for (const summons of args.summons) print(runCell(`same-node:${args.node}`, [args.node], owners, summons));
  }
}

main();
