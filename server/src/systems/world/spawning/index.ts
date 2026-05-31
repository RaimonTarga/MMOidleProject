import {
  GAME_CONFIG,
  NODE_BIOMES,
  MONSTER_DATABASE,
  BIOME_DATABASE,
  TEST_ROOM_NODE_ID,
  distanceSq,
  type Vec2,
} from "@mmo-idle/shared";
import type { World } from "../../../world/World";
import { NODE_REGISTRY } from "../../../world/nodeRegistry";
import {
  makeTracksCombat,
  resetTracksCombat,
  initScriptsBoss,
  initScriptsUltimate,
} from "@mmo-idle/shared";
import type { MonsterEntity } from "../../../ecs/entity";
import { recalculatePlayerEntityStats } from "../../../ecs/playerEntityFormulas";
import { syncArchetypeSlices } from "../../../ecs/archetypeSliceSync";
import { detachComponent } from "../../../ecs/markerHelpers";
import { stopEntity } from "../movement";
import { clearAutoTraversePath } from "../autoTraverse";
import { setAggroTarget, setAttackTarget } from "../../combat/ai/targeting";
import { resolveMonsterHitbox } from "../../../hitbox/resolve";
import { thawNode } from "../../../world/nodeLifecycle";
import { despawnMinionsForOwner } from "../../classes/archetypes/summoner";
import { resetNodeFeatureRuntimeState } from "../nodeFeatures";
import { resetEvadeAccumulator } from "../../defense/mitigation/evasion";
import { applyDormantUltimateBoss } from "../../combat/ai/ultimateEncounter";

// Regular monsters in dungeon nodes are scaled up; boss stats come from the database directly.
const DUNGEON_HP_MULT = 2.0;
const DUNGEON_ATK_MULT = 1.6;

/**
 * Create a monster of the given type at `pos` in nodeId.
 * All stats and AI parameters come from MONSTER_DATABASE.
 * Returns null if the type ID is unknown.
 */
export function createMonster(
  world: World,
  nodeId: string,
  typeId: string,
  pos: Vec2,
): MonsterEntity | null {
  const def = MONSTER_DATABASE.get(typeId);
  if (!def) {
    console.warn(`[World] Unknown monster type: "${typeId}"`);
    return null;
  }

  const id = world.allocMonsterId(nodeId);

  const isBoss = def.isBoss ?? false;
  const nodeDef = NODE_REGISTRY.get(nodeId);
  const isDungeon = nodeDef?.isDungeon ?? false;

  const hpBase =
    !isBoss && isDungeon
      ? Math.round(def.stats.hp * DUNGEON_HP_MULT)
      : def.stats.hp;
  const atkBase =
    !isBoss && isDungeon
      ? Math.round(def.stats.attack * DUNGEON_ATK_MULT)
      : def.stats.attack;
  const isTestRoom = nodeId === TEST_ROOM_NODE_ID;
  const pullRange = isTestRoom ? 0 : def.stats.pullRange;
  const wanderRadius = isTestRoom ? 0 : def.ai.wanderRadius;

  const entity: MonsterEntity = {
    entityId: id,
    isMonster: {
      id,
      monsterTypeId: typeId,
      color: def.color,
      name: def.name,
      isBoss,
      behavior: def.behavior,
      isRanged: def.isRanged,
    },
    hasPosition: {
      current: pos,
      nodeId,
      speed: def.stats.speed,
    },
    hasHealth: {
      hp: hpBase,
      maxHp: hpBase,
    },
    dealsDamage: {
      attack: atkBase,
      onHitDamage: 0,
      attackStyle: def.attackStyle,
    },
    performsAttack: {
      attackRange: def.stats.attackRange,
      attackCooldown: def.stats.attackCooldown,
      lastAttackAt: 0,
    },
    mitigatesDamage: {
      plating: def.stats.plating,
      damageReduction: def.stats.damageReduction,
    },
    hasAwareness: {
      state: "idle",
      pullRange,
      leashRange: def.ai.leashRange,
    },
    hasStatus: {},
    controlsMonster: {
      spawn: pos,
      wanderRadius,
      idleUntil: Date.now(),
      leashRange: def.ai.leashRange,
      idleMinMs: def.ai.idleMinMs,
      idleMaxMs: def.ai.idleMaxMs,
      lastAggroAt: 0,
      baseSpeed: def.stats.speed,
      kiteTimer: 0,
      chargeRemainingMs: 0,
    },
    tracksCombat: makeTracksCombat(),
    hasHitbox: resolveMonsterHitbox(typeId, isBoss, id),
  };
  world.ecs.add(entity);

  if (def.bossScript) {
    world.ecs.addComponent(
      entity,
      "scriptsBoss",
      initScriptsBoss(def.bossScript),
    );
  }

  if (def.ultimateEncounter) {
    world.ecs.addComponent(entity, "scriptsUltimate", initScriptsUltimate());
    applyDormantUltimateBoss(world, entity, def);
  }

  world.adjustMonsterCount(nodeId, 1, isBoss);
  return entity;
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
  const node = NODE_REGISTRY.get(nodeId) ?? world.node;
  const minDistSq = GAME_CONFIG.MONSTER_MIN_SPAWN_DIST ** 2;

  for (let attempt = 0; attempt < 15; attempt++) {
    const pos: Vec2 = {
      x: Math.floor(Math.random() * (node.width - 128)) + 64,
      y: Math.floor(Math.random() * (node.height - 128)) + 64,
    };

    let tooClose = false;
    for (const e of world.monsterEntities) {
      if (e.hasPosition.nodeId !== nodeId) continue;
      if (distanceSq(e.hasPosition.current, pos) < minDistSq) {
        tooClose = true;
        break;
      }
    }
    if (tooClose) continue;

    return createMonster(world, nodeId, typeId, pos) !== null;
  }

  return false;
}

/**
 * Teleport a player to the starting clearing (node-5-5), restore full HP,
 * clear movement and combat state, and drop all monster aggro targeting them.
 */
export function respawnPlayer(world: World, playerId: string): void {
  const entity = world.getPlayerEntity(playerId);
  if (!entity) return;

  detachComponent(world, entity, "isDead");

  const spawn: Vec2 = {
    x: GAME_CONFIG.NODE_WIDTH / 2,
    y: GAME_CONFIG.NODE_HEIGHT / 2,
  };

  const fromNodeId = entity.hasPosition.nodeId;
  if (world.isNodeFrozen("node-5-5")) {
    thawNode(world, "node-5-5");
  }
  entity.hasPosition.nodeId = "node-5-5";
  if (fromNodeId !== "node-5-5") {
    world.movePlayerNode(fromNodeId, "node-5-5");
  }
  entity.hasPosition.current = spawn;
  // Force the next node:delta for the clearing to be a full snapshot so the
  // respawning client clears render state from the node where they died.
  // Mirrors the gate-transition path in `transitions.ts`.
  world.resetNodeDeltaState("node-5-5");
  stopEntity(world, entity);
  setAttackTarget(world, entity, null);
  clearAutoTraversePath(world, entity);
  // Drop any live slimes — the summoner tick will restage them at the new spawn.
  despawnMinionsForOwner(world, entity);

  recalculatePlayerEntityStats(world, entity);
  syncArchetypeSlices(world, entity);
  entity.hasHealth.hp = entity.hasHealth.maxHp;

  resetEvadeAccumulator(entity); // reset deterministic dodge accumulator on respawn
  detachComponent(world, entity, "holdsShields");
  detachComponent(world, entity, "tracksEngagement");
  detachComponent(world, entity, "hasEmpoweredAttack");
  detachComponent(world, entity, "isChanneling");
  detachComponent(world, entity, "hasOverdrive");
  detachComponent(world, entity, "hasAlignment");
  detachComponent(world, entity, "inAcChargePhase");
  detachComponent(world, entity, "inAcDischarge");

  resetTracksCombat(entity.tracksCombat);

  for (const e of world.aggroedMonsters) {
    if (
      e.hasAggroTarget.targetKind === "player" &&
      e.hasAggroTarget.targetId === playerId
    ) {
      setAggroTarget(world, e, null, Date.now());
    }
  }

}

export { killPlayer, updateDeadPlayers } from "../playerIncapacitation";

export function ensurePopulation(world: World, nodeId: string): number {
  let count = world.getMonsterCountInNode(nodeId);
  const targetCount = world.getMobDensity(nodeId);
  while (count < targetCount) {
    if (!spawnMonster(world, nodeId)) break;
    count++;
  }
  return 0;
}

/**
 * Maintain exactly one boss in each dungeon node. If no boss is present,
 * picks from the biome's bossPoolByTier and spawns near the node center.
 */
export function ensureBoss(world: World, nodeId: string): void {
  const nodeDef = NODE_REGISTRY.get(nodeId);
  if (!nodeDef?.isDungeon) return;
  const respawnAt = world.bossRespawnAt.get(nodeId) ?? 0;
  if (Date.now() < respawnAt) return;

  if (world.getBossCountInNode(nodeId) > 0) return;

  const biome = BIOME_DATABASE.get(nodeDef.biomeGroup);
  const pool = biome?.bossPoolByTier?.[nodeDef.biomeTier] ?? [];
  const typeId =
    nodeDef.bossTypeId ?? pool[Math.floor(Math.random() * pool.length)];
  if (!typeId) return;
  const pos: Vec2 = {
    x: nodeDef.width / 2 + (Math.random() - 0.5) * 200,
    y: nodeDef.height / 2 + (Math.random() - 0.5) * 200,
  };
  resetNodeFeatureRuntimeState(world, nodeId);
  const boss = createMonster(world, nodeId, typeId, pos);
  if (boss) {
    world.bossRespawnAt.delete(nodeId);
    world.bossRespawnMarkers.delete(nodeId);
    if (typeId === "void-overlord") world.overlordRespawnPersist?.(null);
    world.broadcastBossFelledState();
  }
}
