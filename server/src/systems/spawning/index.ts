import type { MonsterSnapshot } from '@mmo-idle/shared';
import {
  GAME_CONFIG,
  NODE_BIOMES,
  MONSTER_DATABASE,
  BIOME_DATABASE,
  TEST_ROOM_NODE_ID,
  zeroMotion,
} from '@mmo-idle/shared';
import type { World } from '../../world/World';
import { NODE_REGISTRY } from '../../world/nodeRegistry';
import { makeCombatState, resetCombatState } from '../combatState';
import type { MonsterEntity } from '../../ecs/components/monster';
import { decomposeMonsterSnapshot } from '../../ecs/projection';
import { recalculatePlayerEntityStats } from '../../ecs/playerSnapshotAdapter';

// Regular monsters in dungeon nodes are scaled up; boss stats come from the database directly.
const DUNGEON_HP_MULT  = 2.0;
const DUNGEON_ATK_MULT = 1.6;

/**
 * Create a monster of the given type at (x, y) in nodeId.
 * All stats and AI parameters come from MONSTER_DATABASE.
 * Returns null if the type ID is unknown.
 */
export function createMonster(
  world: World,
  nodeId: string,
  typeId: string,
  x: number,
  y: number,
): MonsterSnapshot | null {
  const def = MONSTER_DATABASE.get(typeId);
  if (!def) {
    console.warn(`[World] Unknown monster type: "${typeId}"`);
    return null;
  }

  const id = `monster-${world.nextMonsterId++}`;

  const isBoss = def.isBoss ?? false;
  const nodeDef = NODE_REGISTRY.get(nodeId);
  const isDungeon = nodeDef?.isDungeon ?? false;

  const hpBase  = (!isBoss && isDungeon) ? Math.round(def.stats.hp     * DUNGEON_HP_MULT)  : def.stats.hp;
  const atkBase = (!isBoss && isDungeon) ? Math.round(def.stats.attack  * DUNGEON_ATK_MULT) : def.stats.attack;
  const isTestRoom = nodeId === TEST_ROOM_NODE_ID;
  const pullRange = isTestRoom ? 0 : def.stats.pullRange;
  const wanderRadius = isTestRoom ? 0 : def.ai.wanderRadius;

  const monster: MonsterSnapshot = {
    id,
    monsterTypeId: typeId,
    color: def.color,
    name: def.name,
    x, y,
    targetX: x,
    targetY: y,
    hp:             hpBase,
    maxHp:          hpBase,
    attack:         atkBase,
    plating:        def.stats.plating,
    damageReduction: def.stats.damageReduction,
    speed:   def.stats.speed,
    state:   'idle',
    pullRange,
    leashRange:     def.ai.leashRange,
    attackRange:    def.stats.attackRange,
    attackCooldown: def.stats.attackCooldown,
    lastAttackAt:   0,
    attackTargetId: null,
    nodeId,
    attackStyle: def.attackStyle,
    isBoss,
    behavior: def.behavior,
  };

  const entity: MonsterEntity = {
    entityId:    id,
    monsterAi: {
      spawnX: x,
      spawnY: y,
      wanderRadius,
      idleUntil:     Date.now(),
      leashRange:    def.ai.leashRange,
      idleMinMs:     def.ai.idleMinMs,
      idleMaxMs:     def.ai.idleMaxMs,
      aggroTargetId: null,
      lastAggroAt:   0,
      baseSpeed:     def.stats.speed,
      kiteTimer:     0,
    },
    combatState: makeCombatState(),
    ...decomposeMonsterSnapshot(monster),
  };
  world.ecs.add(entity);

  return monster;
}

/**
 * Pick a random monster type from the node's biome pool and attempt to
 * place it at a position that respects minimum spacing. Returns true on success.
 */
export function spawnMonster(world: World, nodeId: string): boolean {
  const biomeInfo = NODE_BIOMES[nodeId];
  if (!biomeInfo) return false;

  const biome = BIOME_DATABASE.get(biomeInfo.biomeGroup);
  if (!biome) return false;
  const pool = biome.monsterPoolByTier[biomeInfo.biomeTier] ?? [];
  if (pool.length === 0) return false;

  const typeId = pool[Math.floor(Math.random() * pool.length)];
  const node   = NODE_REGISTRY.get(nodeId) ?? world.node;
  const minDistSq = GAME_CONFIG.MONSTER_MIN_SPAWN_DIST ** 2;

  for (let attempt = 0; attempt < 15; attempt++) {
    const x = Math.floor(Math.random() * (node.width  - 128)) + 64;
    const y = Math.floor(Math.random() * (node.height - 128)) + 64;

    let tooClose = false;
    for (const e of world.monsterEntities) {
      if (e.hasPosition.nodeId !== nodeId) continue;
      const dx = e.hasPosition.current.x - x;
      const dy = e.hasPosition.current.y - y;
      if (dx * dx + dy * dy < minDistSq) { tooClose = true; break; }
    }
    if (tooClose) continue;

    return createMonster(world, nodeId, typeId, x, y) !== null;
  }

  return false;
}

/**
 * Teleport a player to the starting clearing (node-5-5), restore full HP,
 * clear movement and combat state, and drop all monster aggro targeting them.
 * Queues the player ID in pendingDeaths so the server loop can emit the event.
 */
export function respawnPlayer(world: World, playerId: string): void {
  const entity = world.getPlayerEntity(playerId);
  if (!entity) return;

  const spawnX = GAME_CONFIG.NODE_WIDTH  / 2;
  const spawnY = GAME_CONFIG.NODE_HEIGHT / 2;

  entity.hasPosition.nodeId = 'node-5-5';
  entity.hasPosition.current = { x: spawnX, y: spawnY };
  entity.isMoving.motion = zeroMotion();
  entity.performsAttack.attackTargetId = null;
  entity.usesAutocombat.auto = false;

  recalculatePlayerEntityStats(entity);
  entity.hasHealth.hp = entity.hasHealth.maxHp;

  entity.evadesHits.count = 0;
  entity.hasHealth.shields = [];
  entity.usesCooldown.isChanneling = false;
  entity.usesCooldown.channelingPct = 0;

  world.setPlayerCombatAt(playerId, 0);

  resetCombatState(entity.combatState);

  world.refreshArchetypeComponents(playerId);

  for (const e of world.monsterEntities) {
    if (e.monsterAi.aggroTargetId === playerId) e.monsterAi.aggroTargetId = null;
  }

  world.pendingDeaths.push(playerId);
}

export function ensurePopulation(world: World, nodeId: string): void {
  let count = 0;
  for (const e of world.monsterEntities) {
    if (e.hasPosition.nodeId === nodeId && !e.isMonster.isBoss) count++;
  }
  while (count < GAME_CONFIG.MONSTERS_PER_NODE) {
    if (!spawnMonster(world, nodeId)) break;
    count++;
  }
}

/**
 * Maintain exactly one boss in each dungeon node. If no boss is present,
 * picks from the biome's bossPoolByTier and spawns near the node center.
 */
export function ensureBoss(world: World, nodeId: string): void {
  const nodeDef = NODE_REGISTRY.get(nodeId);
  if (!nodeDef?.isDungeon) return;

  let hasBoss = false;
  for (const e of world.monsterEntities) {
    if (e.hasPosition.nodeId === nodeId && e.isMonster.isBoss) { hasBoss = true; break; }
  }
  if (hasBoss) return;

  const biome = BIOME_DATABASE.get(nodeDef.biomeGroup);
  const pool  = biome?.bossPoolByTier?.[nodeDef.biomeTier];
  if (!pool || pool.length === 0) return;

  const typeId = pool[Math.floor(Math.random() * pool.length)];
  const x = nodeDef.width  / 2 + (Math.random() - 0.5) * 200;
  const y = nodeDef.height / 2 + (Math.random() - 0.5) * 200;
  createMonster(world, nodeId, typeId, x, y);
}
