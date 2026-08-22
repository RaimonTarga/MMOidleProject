import {
  GAME_CONFIG,
  NODE_BIOMES,
  MONSTER_DATABASE,
  BIOME_DATABASE,
  monsterIsRanged,
  mountainLedgeHoldPointsForNode,
  mountainLedgePatrolForPost,
  mountainLedgeFeatureIdsForNode,
  mountainChokepointsForNode,
  RESOLVED_NODE_FEATURES,
  TEST_ROOM_NODE_ID,
  buildNavGrid,
  cellToWorld,
  depenetrateToWalkable,
  distanceSq,
  isDungeonNode,
  moverOverlapsBlockShapes,
  navigationBodyHalfExtents,
  nearestWalkableCell,
  NODE_MODIFIERS,
  modifierStatScalars,
  modifiedDamageReduction,
  respawnNodeIdForNodeId,
  type MonsterPatrolRoute,
  type Vec2,
} from "@mmo-idle/shared";
import type { World } from "../../../world/World";
import { NODE_REGISTRY } from "../../../world/nodeRegistry";
import {
  makeTracksCombat,
  resetTracksCombat,
  initScriptsBoss,
  initScriptsUltimate,
  getCavePatrols,
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
import { refillBarrier } from "../../defense/barrier/barrier";
import { applyDormantUltimateBoss } from "../../combat/ai/ultimateEncounter";

// Regular monsters in dungeon nodes are scaled up; boss stats come from the database directly.
// Multipliers live in shared GAME_CONFIG so the client bestiary shows the same scaled stats.
const DUNGEON_HP_MULT = GAME_CONFIG.DUNGEON_HP_MULT;
const DUNGEON_ATK_MULT = GAME_CONFIG.DUNGEON_ATK_MULT;
const PACK_BIASED_SPAWN_ATTEMPTS = 2;
const TOTAL_SPAWN_ATTEMPTS = 20;
const SPAWN_PACK_LINK_RANGE = 260;
const SPAWN_PACK_TARGET_MAX = 3;
const SPAWN_SWARM_LOCAL_MAX = 4;
const SPAWN_PACK_MIN_OFFSET = GAME_CONFIG.MONSTER_MIN_SPAWN_DIST + 56;
const SPAWN_PACK_MAX_OFFSET = 250;
const MONSTER_PLAYER_SPAWN_EXCLUSION = 520;
const DISPERSAL_RANDOM_SAMPLES = 8;
const DISPERSAL_NEIGHBOR_RANGE = 560;
const PACK_ALPHA_DISPERSAL_SAMPLES = 12;
const PACK_ALPHA_SEPARATION_RANGE = 820;
const MOUNTAIN_WANDERER_DISPERSAL_SAMPLES = 18;
const MOUNTAIN_WANDERER_SEPARATION_RANGE = 760;
const SWAMP_POOL_BIASED_SPAWN_ATTEMPTS = 8;
const SWAMP_POOL_MIN_EDGE_OFFSET = 72;
const SWAMP_POOL_MAX_EDGE_OFFSET = 210;
const MOUNTAIN_CHOKE_OCCUPY_RADIUS = 220;
const MOUNTAIN_CHOKE_SPAWN_JITTER = 34;
const MOUNTAIN_ARCHER_HOLD_LEASH = 460;
const MOUNTAIN_HOPPER_HOLD_LEASH = 720;
const CAVE_PATROL_OCCUPY_RADIUS = 760;
const CAVE_PATROL_LEASH = 980;
const CAVE_PATROL_WANDER_RADIUS = 80;
const MONSTER_TERRAIN_SPAWN_MARGIN = 48;

interface CavePatrolAssignment {
  anchor: Vec2;
  patrol: MonsterPatrolRoute;
}

/**
 * Routes come from the shared per-node layout, so the beat a brute walks is the same shape
 * the client paints on the floor and the same shape the rock formations keep off.
 *
 * This used to be a module-level constant with no `nodeId` in it — one 4080px rectangle,
 * identical on all 21 cave nodes, while the ground painted an unrelated trail somewhere
 * else. A wild (unpatrolled) cave now returns nothing here, and its brutes roam instead.
 */
function cavePatrolRoutes(nodeId: string): CavePatrolAssignment[] {
  return getCavePatrols(nodeId).routes.map((route) => ({
    anchor: { ...route.anchor },
    patrol: {
      absolute: true,
      // The circuit loops; each cross arm is walked back and forth, so its guard meets you
      // head-on instead of always arriving from the same side.
      mode: route.mode,
      waypoints: route.waypoints.map((wp) => ({ ...wp })),
      holdMinMs: 900,
      holdMaxMs: 1800,
    },
  }));
}

function clampMonsterSpawnToNode(nodeId: string, pos: Vec2, pad: Vec2): Vec2 {
  const node = NODE_REGISTRY.get(nodeId);
  if (!node) return pos;
  const marginX = Math.max(MONSTER_TERRAIN_SPAWN_MARGIN, pad.x);
  const marginY = Math.max(MONSTER_TERRAIN_SPAWN_MARGIN, pad.y);
  return {
    x: Math.max(
      marginX,
      Math.min(node.width - marginX, pos.x),
    ),
    y: Math.max(
      marginY,
      Math.min(node.height - marginY, pos.y),
    ),
  };
}

function suppressedMonsterSpawnFeatureIds(
  nodeId: string,
  typeDef: ReturnType<typeof MONSTER_DATABASE.get> | undefined,
): ReadonlySet<string> {
  return typeDef?.vaultsMountainLedges === true
    ? mountainLedgeFeatureIdsForNode(nodeId)
    : new Set();
}

function terrainSafeMonsterSpawnPos(
  nodeId: string,
  typeDef: ReturnType<typeof MONSTER_DATABASE.get> | undefined,
  pos: Vec2,
): Vec2 | null {
  const pad = navigationBodyHalfExtents(
    "monster",
    typeDef?.isBoss === true,
  );
  const suppressed = suppressedMonsterSpawnFeatureIds(nodeId, typeDef);
  const clamped = clampMonsterSpawnToNode(nodeId, pos, pad);
  const grid = buildNavGrid(nodeId, "monster", pad, suppressed);

  if (!moverOverlapsBlockShapes(clamped, grid.shapes, pad)) return clamped;

  const projected = depenetrateToWalkable(
    nodeId,
    "monster",
    pad,
    clamped,
    suppressed,
  );
  if (projected) {
    const bounded = clampMonsterSpawnToNode(nodeId, projected, pad);
    if (!moverOverlapsBlockShapes(bounded, grid.shapes, pad)) return bounded;
  }

  // Projection can choose the outside of a tree near an edge. Fall back to the
  // nearest conservative nav cell, which is both terrain-clear and inside the
  // playable node. Never return the original penetrating point on failure.
  const cell = nearestWalkableCell(grid, clamped, 24);
  if (!cell) return null;
  const fallback = cellToWorld(grid, cell.col, cell.row);
  return moverOverlapsBlockShapes(fallback, grid.shapes, pad) ? null : fallback;
}

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
    return null;
  }

  const id = world.allocMonsterId(nodeId);

  const isBoss = def.isBoss ?? false;
  const hitbox = resolveMonsterHitbox(typeId, isBoss, id);
  const spawnPos = terrainSafeMonsterSpawnPos(nodeId, def, pos);
  if (!spawnPos) return null;
  const nodeDef = NODE_REGISTRY.get(nodeId);
  const isDungeon = nodeDef?.isDungeon ?? false;
  const usesGuardedAltar = isDungeonNode(nodeId);

  const hpBase =
    !isBoss && isDungeon && !usesGuardedAltar
      ? Math.round(def.stats.hp * DUNGEON_HP_MULT)
      : def.stats.hp;
  const atkBase =
    !isBoss && isDungeon && !usesGuardedAltar
      ? Math.round(def.stats.attack * DUNGEON_ATK_MULT)
      : def.stats.attack;

  // Reshape non-boss monsters around the node's modifier, composing on top of the
  // dungeon mults above. Bosses are immune. Unlike the previous pace design these
  // scalars touch DEFENCE and HEALTH as well as offence, and they are not
  // threat-budget-neutral — a modifier is a net difficulty increase that
  // `modifierRewardMult` pays for at kill time. Every value bakes into the entity
  // at spawn; nothing rides a runtime component.
  const nodeModifier = isBoss ? undefined : NODE_MODIFIERS[nodeId];
  const modBiomeTier = NODE_BIOMES[nodeId]?.biomeTier ?? 0;
  const modScalars = nodeModifier
    ? modifierStatScalars(nodeModifier.modifier, modBiomeTier)
    : null;
  const hp = modScalars
    ? Math.max(1, Math.round(hpBase * modScalars.hpMult))
    : hpBase;
  const attack = modScalars
    ? Math.max(1, Math.round(atkBase * modScalars.attackMult))
    : atkBase;
  const attackCooldown = modScalars
    ? Math.max(1, Math.round(def.stats.attackCooldown * modScalars.attackCooldownMult))
    : def.stats.attackCooldown;
  const speed = modScalars
    ? def.stats.speed * modScalars.moveSpeedMult
    : def.stats.speed;
  const plating = modScalars
    ? Math.round(def.stats.plating * modScalars.platingMult)
    : def.stats.plating;
  const damageReduction = modScalars
    ? modifiedDamageReduction(def.stats.damageReduction, modScalars.incomingDamageMult)
    : def.stats.damageReduction;

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
      isRanged: monsterIsRanged(def),
    },
    hasPosition: {
      current: spawnPos,
      nodeId,
      speed,
    },
    hasHealth: {
      hp,
      maxHp: hp,
    },
    dealsDamage: {
      attack,
      onHitDamage: 0,
      attackStyle: def.attackStyle,
    },
    performsAttack: {
      attackRange: def.stats.attackRange,
      attackCooldown,
      lastAttackAt: 0,
    },
    mitigatesDamage: {
      plating,
      damageReduction,
    },
    hasAwareness: {
      state: "idle",
      pullRange,
      leashRange: def.ai.leashRange,
    },
    hasStatus: {},
    controlsMonster: {
      spawn: spawnPos,
      wanderRadius,
      idleUntil: Date.now(),
      leashRange: def.ai.leashRange,
      idleMinMs: def.ai.idleMinMs,
      idleMaxMs: def.ai.idleMaxMs,
      lastAggroAt: 0,
      baseSpeed: speed,
      kiteTimer: 0,
      chargeRemainingMs: 0,
      patrolIndex: 0,
      patrolDir: 1,
    },
    tracksCombat: makeTracksCombat(),
    hasHitbox: hitbox,
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
 * When the rolled type is a pack alpha, the whole pack spawns clustered at the spot.
 */
export function spawnMonster(world: World, nodeId: string): boolean {
  const biomeInfo = NODE_BIOMES[nodeId];
  if (!biomeInfo) return false;

  const biome = BIOME_DATABASE.get(biomeInfo.biomeGroup);
  if (!biome) return false;
  const pool = biome.monsterPoolByTier[biomeInfo.biomeTier] ?? [];
  if (pool.length === 0) return false;

  const typeId = pool[Math.floor(Math.random() * pool.length)];
  const typeDef = MONSTER_DATABASE.get(typeId);
  const node = NODE_REGISTRY.get(nodeId) ?? world.node;
  const minDistSq = GAME_CONFIG.MONSTER_MIN_SPAWN_DIST ** 2;

  for (let attempt = 0; attempt < TOTAL_SPAWN_ATTEMPTS; attempt++) {
    let shouldAssignMountainHoldPost = false;
    let cavePatrol: CavePatrolAssignment | null = null;
    let pos: Vec2;
    if (typeDef?.pack?.role === "alpha") {
      pos = dispersedPackAlphaSpawnPos(world, nodeId, typeDef.biome, node);
    } else {
      const mountainPostPos = mountainHoldSpawnPos(world, nodeId, typeDef);
      cavePatrol = cavePatrolAssignment(world, nodeId, typeDef);
      if (mountainPostPos) {
        shouldAssignMountainHoldPost = true;
        pos = mountainPostPos;
      } else if (cavePatrol) {
        pos = { ...cavePatrol.anchor };
      } else if (typeDef?.biome === "mountain") {
        pos = mountainWandererSpawnPos(world, nodeId, node);
      } else if (
        typeDef?.biome === "swamp" &&
        attempt < SWAMP_POOL_BIASED_SPAWN_ATTEMPTS
      ) {
        pos =
          swampPoolEdgeSpawnPos(world, nodeId, node) ??
          dispersedSpawnPos(world, nodeId, node);
      } else if (attempt < PACK_BIASED_SPAWN_ATTEMPTS) {
        pos =
          biasedPackSpawnPos(world, nodeId, typeId, node) ??
          dispersedSpawnPos(world, nodeId, node);
      } else {
        pos = dispersedSpawnPos(world, nodeId, node);
      }
    }

    const terrainSafePos = terrainSafeMonsterSpawnPos(
      nodeId,
      typeDef,
      pos,
    );
    if (!terrainSafePos) continue;
    pos = terrainSafePos;

    if (!isAmbientSpawnPosClear(world, nodeId, pos, minDistSq, typeDef)) {
      continue;
    }

    if (typeDef?.pack?.role === "alpha") {
      return spawnPack(world, nodeId, typeId, pos) !== null;
    }
    const monster = createMonster(world, nodeId, typeId, pos);
    if (!monster) return false;
    if (shouldAssignMountainHoldPost) {
      assignMountainHoldPost(world, nodeId, monster, typeDef, monster.hasPosition.current);
    }
    if (cavePatrol) {
      assignCavePatrol(monster, typeDef, cavePatrol);
    }
    return true;
  }

  return false;
}

function cavePatrolAssignment(
  world: World,
  nodeId: string,
  typeDef: ReturnType<typeof MONSTER_DATABASE.get> | undefined,
): CavePatrolAssignment | null {
  if (!isCavePatrolBrute(typeDef)) return null;
  const occupySq = CAVE_PATROL_OCCUPY_RADIUS * CAVE_PATROL_OCCUPY_RADIUS;
  const occupied: Vec2[] = [];
  for (const e of world.monsterEntitiesInNode(nodeId)) {
    const def = MONSTER_DATABASE.get(e.isMonster.monsterTypeId);
    if (!isCavePatrolBrute(def)) continue;
    occupied.push(e.controlsMonster.spawn);
  }

  const free = cavePatrolRoutes(nodeId).filter((route) =>
    occupied.every((pos) => distanceSq(pos, route.anchor) > occupySq),
  );
  if (free.length > 0) {
    return free[Math.floor(Math.random() * free.length)];
  }
  return null;
}

function isCavePatrolBrute(
  typeDef: ReturnType<typeof MONSTER_DATABASE.get> | undefined,
): boolean {
  return typeDef?.biome === "cave" && typeDef.patrol !== undefined;
}

function assignCavePatrol(
  monster: MonsterEntity,
  typeDef: ReturnType<typeof MONSTER_DATABASE.get> | undefined,
  assignment: CavePatrolAssignment,
): void {
  if (!isCavePatrolBrute(typeDef)) return;
  // createMonster has already terrain-corrected the authored anchor. Preserve
  // that verified position for both the body and its return/leash origin.
  const safeAnchor = { ...monster.hasPosition.current };
  monster.controlsMonster.spawn = safeAnchor;
  monster.controlsMonster.patrolOverride = {
    ...assignment.patrol,
    waypoints: assignment.patrol.waypoints.map((wp) => ({ ...wp })),
  };
  monster.controlsMonster.patrolIndex = 1;
  monster.controlsMonster.patrolDir = 1;
  monster.controlsMonster.wanderRadius = Math.min(
    monster.controlsMonster.wanderRadius,
    CAVE_PATROL_WANDER_RADIUS,
  );
  monster.controlsMonster.leashRange = Math.max(
    monster.controlsMonster.leashRange,
    CAVE_PATROL_LEASH,
  );
  monster.hasAwareness.leashRange = monster.controlsMonster.leashRange;
}

function mountainHoldSpawnPos(
  world: World,
  nodeId: string,
  typeDef: ReturnType<typeof MONSTER_DATABASE.get> | undefined,
): Vec2 | null {
  if (typeDef?.biome !== "mountain") return null;
  const free = typeDef.holdsChokepoints === true
    ? freeMountainPosts(world, nodeId, mountainChokepointsForNode(nodeId), isChokepointHolder)
    : typeDef.vaultsMountainLedges === true
    ? freeMountainPosts(world, nodeId, mountainLedgeHoldPointsForNode(nodeId), isVaultingMountainHolder)
    : [];
  if (free.length === 0) return null;
  const post = free[Math.floor(Math.random() * free.length)];
  return jitteredMountainPost(post);
}

function assignMountainHoldPost(
  world: World,
  nodeId: string,
  monster: MonsterEntity,
  typeDef: ReturnType<typeof MONSTER_DATABASE.get> | undefined,
  spawnPos: Vec2,
): void {
  if (typeDef?.biome !== "mountain") return;
  const posts = typeDef.holdsChokepoints === true
    ? mountainChokepointsForNode(nodeId)
    : typeDef.vaultsMountainLedges === true
    ? mountainLedgeHoldPointsForNode(nodeId)
    : [];
  if (posts.length === 0) return;
  const post = nearestMountainPost(posts, spawnPos);
  if (!post) return;
  const occupySq = MOUNTAIN_CHOKE_OCCUPY_RADIUS * MOUNTAIN_CHOKE_OCCUPY_RADIUS;
  if (distanceSq(post, spawnPos) > occupySq) return;
  monster.controlsMonster.holdPost = { ...post };
  monster.controlsMonster.spawn = { ...post };
  if (typeDef.vaultsMountainLedges === true) {
    monster.controlsMonster.holdPatrol = mountainLedgePatrolForPost(post);
    monster.controlsMonster.holdPatrolIndex = 0;
  }
  monster.controlsMonster.wanderRadius = Math.min(
    monster.controlsMonster.wanderRadius,
    90,
  );
  const holdLeash =
    typeDef.vaultsMountainLedges === true
      ? MOUNTAIN_HOPPER_HOLD_LEASH
      : MOUNTAIN_ARCHER_HOLD_LEASH;
  monster.controlsMonster.leashRange = Math.min(
    monster.controlsMonster.leashRange,
    holdLeash,
  );
  monster.hasAwareness.leashRange = monster.controlsMonster.leashRange;
}

function freeMountainPosts(
  world: World,
  nodeId: string,
  posts: Vec2[],
  holder: (typeDef: ReturnType<typeof MONSTER_DATABASE.get>) => boolean,
): Vec2[] {
  const occupySq = MOUNTAIN_CHOKE_OCCUPY_RADIUS * MOUNTAIN_CHOKE_OCCUPY_RADIUS;
  return posts.filter((post) => {
    for (const e of world.monsterEntitiesInNode(nodeId)) {
      const def = MONSTER_DATABASE.get(e.isMonster.monsterTypeId);
      if (def?.biome !== "mountain" || !holder(def)) continue;
      const holdPost = e.controlsMonster.holdPost ?? e.controlsMonster.spawn;
      if (distanceSq(holdPost, post) <= occupySq) return false;
    }
    return true;
  }).map((post) => ({ ...post }));
}

function isChokepointHolder(
  typeDef: ReturnType<typeof MONSTER_DATABASE.get>,
): boolean {
  return typeDef?.holdsChokepoints === true;
}

function isVaultingMountainHolder(
  typeDef: ReturnType<typeof MONSTER_DATABASE.get>,
): boolean {
  return typeDef?.vaultsMountainLedges === true;
}

function nearestMountainPost(posts: Vec2[], pos: Vec2): Vec2 | null {
  let best: Vec2 | null = null;
  let bestDist = Infinity;
  for (const post of posts) {
    const d = distanceSq(pos, post);
    if (d < bestDist) {
      best = post;
      bestDist = d;
    }
  }
  return best ? { ...best } : null;
}

function jitteredMountainPost(post: Vec2): Vec2 {
  const angle = Math.random() * Math.PI * 2;
  const radius = Math.random() * MOUNTAIN_CHOKE_SPAWN_JITTER;
  return {
    x: post.x + Math.cos(angle) * radius,
    y: post.y + Math.sin(angle) * radius,
  };
}

function isAmbientSpawnPosClear(
  world: World,
  nodeId: string,
  pos: Vec2,
  minMonsterDistSq: number,
  typeDef: ReturnType<typeof MONSTER_DATABASE.get> | undefined,
): boolean {
  for (const e of world.monsterEntities) {
    if (e.hasPosition.nodeId !== nodeId) continue;
    if (distanceSq(e.hasPosition.current, pos) < minMonsterDistSq) return false;
  }

  const playerExclusionSq =
    MONSTER_PLAYER_SPAWN_EXCLUSION * MONSTER_PLAYER_SPAWN_EXCLUSION;
  for (const player of world.livePlayersInNode(nodeId)) {
    if (distanceSq(player.hasPosition.current, pos) < playerExclusionSq) {
      return false;
    }
  }

  if (
    typeDef?.swarm &&
    localSwarmCount(world, nodeId, typeDef.biome, pos) >= SPAWN_SWARM_LOCAL_MAX
  ) {
    return false;
  }

  return true;
}

function randomSpawnPos(node: { width: number; height: number }): Vec2 {
  return {
    x: Math.floor(Math.random() * (node.width - 128)) + 64,
    y: Math.floor(Math.random() * (node.height - 128)) + 64,
  };
}

function dispersedSpawnPos(
  world: World,
  nodeId: string,
  node: { width: number; height: number },
): Vec2 {
  let best = randomSpawnPos(node);
  let bestScore = spawnDispersalScore(world, nodeId, best);

  for (let i = 1; i < DISPERSAL_RANDOM_SAMPLES; i++) {
    const pos = randomSpawnPos(node);
    const score = spawnDispersalScore(world, nodeId, pos);
    if (score < bestScore) {
      best = pos;
      bestScore = score;
    }
  }

  return best;
}

function spawnDispersalScore(world: World, nodeId: string, pos: Vec2): number {
  const neighborSq = DISPERSAL_NEIGHBOR_RANGE * DISPERSAL_NEIGHBOR_RANGE;
  let score = 0;
  for (const e of world.monsterEntities) {
    if (e.hasPosition.nodeId !== nodeId) continue;
    const d2 = distanceSq(e.hasPosition.current, pos);
    if (d2 <= neighborSq) {
      score += 1 + (neighborSq - d2) / neighborSq;
    }
  }
  return score;
}

function mountainWandererSpawnPos(
  world: World,
  nodeId: string,
  node: { width: number; height: number },
): Vec2 {
  let best = randomSpawnPos(node);
  let bestScore = mountainWandererDispersalScore(world, nodeId, best);

  for (let i = 1; i < MOUNTAIN_WANDERER_DISPERSAL_SAMPLES; i++) {
    const pos = randomSpawnPos(node);
    const score = mountainWandererDispersalScore(world, nodeId, pos);
    if (score < bestScore) {
      best = pos;
      bestScore = score;
    }
  }

  return best;
}

function mountainWandererDispersalScore(
  world: World,
  nodeId: string,
  pos: Vec2,
): number {
  const separationSq =
    MOUNTAIN_WANDERER_SEPARATION_RANGE * MOUNTAIN_WANDERER_SEPARATION_RANGE;
  let score = spawnDispersalScore(world, nodeId, pos) * 0.25;

  for (const e of world.monsterEntities) {
    if (e.hasPosition.nodeId !== nodeId) continue;
    const def = MONSTER_DATABASE.get(e.isMonster.monsterTypeId);
    if (def?.biome !== "mountain") continue;
    const d2 = distanceSq(e.hasPosition.current, pos);
    if (d2 <= separationSq) {
      score += 4 + 8 * ((separationSq - d2) / separationSq);
      if (!e.controlsMonster.holdPost) {
        score += 3 * ((separationSq - d2) / separationSq);
      }
    }
  }

  return score;
}

function dispersedPackAlphaSpawnPos(
  world: World,
  nodeId: string,
  biome: string,
  node: { width: number; height: number },
): Vec2 {
  let best = randomSpawnPos(node);
  let bestScore = packAlphaDispersalScore(world, nodeId, biome, best);

  for (let i = 1; i < PACK_ALPHA_DISPERSAL_SAMPLES; i++) {
    const pos = randomSpawnPos(node);
    const score = packAlphaDispersalScore(world, nodeId, biome, pos);
    if (score < bestScore) {
      best = pos;
      bestScore = score;
    }
  }

  return best;
}

function packAlphaDispersalScore(
  world: World,
  nodeId: string,
  biome: string,
  pos: Vec2,
): number {
  const separationSq =
    PACK_ALPHA_SEPARATION_RANGE * PACK_ALPHA_SEPARATION_RANGE;
  let score = spawnDispersalScore(world, nodeId, pos) * 0.35;

  for (const center of packCenters(world, nodeId, biome)) {
    const d2 = distanceSq(center, pos);
    if (d2 <= separationSq) {
      score += 8 + 8 * ((separationSq - d2) / separationSq);
    }
  }

  return score;
}

function packCenters(world: World, nodeId: string, biome: string): Vec2[] {
  const packs = new Map<string, { x: number; y: number; count: number }>();
  for (const e of world.monsterEntities) {
    if (e.hasPosition.nodeId !== nodeId || !e.inPack) continue;
    const def = MONSTER_DATABASE.get(e.isMonster.monsterTypeId);
    if (def?.biome !== biome) continue;

    const pack =
      packs.get(e.inPack.packId) ?? { x: 0, y: 0, count: 0 };
    pack.x += e.hasPosition.current.x;
    pack.y += e.hasPosition.current.y;
    pack.count += 1;
    packs.set(e.inPack.packId, pack);
  }

  const centers: Vec2[] = [];
  for (const pack of packs.values()) {
    centers.push({ x: pack.x / pack.count, y: pack.y / pack.count });
  }
  return centers;
}

function swampPoolEdgeSpawnPos(
  world: World,
  nodeId: string,
  node: { width: number; height: number },
): Vec2 | null {
  const pools = RESOLVED_NODE_FEATURES[nodeId]?.filter(
    (feature) =>
      feature.shape.kind === "circle" &&
      feature.damage?.targets.includes("player"),
  );
  if (!pools || pools.length === 0) return null;

  const pool = pools[Math.floor(Math.random() * pools.length)];
  const shape = pool.shape;
  if (shape.kind !== "circle") return null;

  const angle = Math.random() * Math.PI * 2;
  const radius =
    shape.radius +
    SWAMP_POOL_MIN_EDGE_OFFSET +
    Math.random() * (SWAMP_POOL_MAX_EDGE_OFFSET - SWAMP_POOL_MIN_EDGE_OFFSET);
  const margin = 64;
  const pos: Vec2 = {
    x: Math.max(
      margin,
      Math.min(node.width - margin, shape.x + Math.cos(angle) * radius),
    ),
    y: Math.max(
      margin,
      Math.min(node.height - margin, shape.y + Math.sin(angle) * radius),
    ),
  };

  return spawnDispersalScore(world, nodeId, pos) <= 3.5 ? pos : null;
}

function biasedPackSpawnPos(
  world: World,
  nodeId: string,
  typeId: string,
  node: { width: number; height: number },
): Vec2 | null {
  const def = MONSTER_DATABASE.get(typeId);
  if (!def?.swarm || def.pack?.role === "alpha" || def.isBoss) return null;

  const anchors = lowCountSwarmAnchors(world, nodeId, def.biome);
  if (anchors.length === 0) return null;

  const anchor = anchors[Math.floor(Math.random() * anchors.length)];
  const angle = Math.random() * Math.PI * 2;
  const radius =
    SPAWN_PACK_MIN_OFFSET +
    Math.random() * (SPAWN_PACK_MAX_OFFSET - SPAWN_PACK_MIN_OFFSET);
  const margin = 64;
  const pos: Vec2 = {
    x: Math.max(
      margin,
      Math.min(
        node.width - margin,
        anchor.hasPosition.current.x + Math.cos(angle) * radius,
      ),
    ),
    y: Math.max(
      margin,
      Math.min(
        node.height - margin,
        anchor.hasPosition.current.y + Math.sin(angle) * radius,
      ),
    ),
  };

  // Do not deliberately add to an already-full local pack.
  return localSwarmCount(world, nodeId, def.biome, pos) < SPAWN_PACK_TARGET_MAX
    ? pos
    : null;
}

function lowCountSwarmAnchors(
  world: World,
  nodeId: string,
  biome: string,
): MonsterEntity[] {
  const anchors: MonsterEntity[] = [];
  for (const e of world.monsterEntities) {
    if (e.hasPosition.nodeId !== nodeId) continue;
    const def = MONSTER_DATABASE.get(e.isMonster.monsterTypeId);
    if (def?.biome !== biome || !def.swarm) continue;
    const count = localSwarmCount(world, nodeId, biome, e.hasPosition.current);
    if (count > 0 && count < SPAWN_PACK_TARGET_MAX) anchors.push(e);
  }
  return anchors;
}

function localSwarmCount(
  world: World,
  nodeId: string,
  biome: string,
  pos: Vec2,
): number {
  const linkSq = SPAWN_PACK_LINK_RANGE * SPAWN_PACK_LINK_RANGE;
  let count = 0;
  for (const e of world.monsterEntities) {
    if (e.hasPosition.nodeId !== nodeId) continue;
    const def = MONSTER_DATABASE.get(e.isMonster.monsterTypeId);
    if (def?.biome !== biome || !def.swarm) continue;
    if (distanceSq(e.hasPosition.current, pos) <= linkSq) count++;
  }
  return count;
}

/**
 * Spawn a coordinated pack: the alpha at `anchor`, plus its `followers` clustered
 * in a ring around it. Every member gets a shared server-only `inPack` link
 * (`packId`) the pack system reads to propagate aggro. Falls back to a single
 * spawn if the type is not a pack alpha. Returns the spawned members (alpha first)
 * so callers can post-process them (e.g. tag bush ambushers dormant), or null on
 * failure.
 */
export function spawnPack(
  world: World,
  nodeId: string,
  alphaTypeId: string,
  anchor: Vec2,
): MonsterEntity[] | null {
  const packDef = MONSTER_DATABASE.get(alphaTypeId)?.pack;
  if (!packDef || packDef.role !== "alpha") {
    const lone = createMonster(world, nodeId, alphaTypeId, anchor);
    return lone ? [lone] : null;
  }

  const packId = `${nodeId}:pack:${packSeq++}`;
  const alpha = createMonster(world, nodeId, alphaTypeId, anchor);
  if (!alpha) return null;
  world.ecs.addComponent(alpha, "inPack", { packId, role: "alpha" });
  const members: MonsterEntity[] = [alpha];

  const groups = packDef.followers;
  if (groups && groups.length > 0) {
    const node = NODE_REGISTRY.get(nodeId);
    const total = groups.reduce((n, g) => n + g.count, 0);
    let idx = 0;
    for (const group of groups) {
      for (let i = 0; i < group.count; i++) {
        const pos = followerSpawnPos(anchor, idx, total, node);
        const f = createMonster(world, nodeId, group.typeId, pos);
        if (f) {
          world.ecs.addComponent(f, "inPack", { packId, role: "follower" });
          members.push(f);
        }
        idx++;
      }
    }
  }
  return members;
}

let packSeq = 0;

const FOLLOWER_RING_RADIUS = 64;

function followerSpawnPos(
  anchor: Vec2,
  i: number,
  count: number,
  node: { width: number; height: number } | undefined,
): Vec2 {
  const angle = (i / Math.max(1, count)) * Math.PI * 2;
  const margin = 48;
  const x = anchor.x + Math.cos(angle) * FOLLOWER_RING_RADIUS;
  const y = anchor.y + Math.sin(angle) * FOLLOWER_RING_RADIUS;
  return {
    x: node ? Math.max(margin, Math.min(node.width - margin, x)) : x,
    y: node ? Math.max(margin, Math.min(node.height - margin, y)) : y,
  };
}

/**
 * Teleport a player to their current region's respawn anchor, restore full HP,
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
  const respawnNodeId = respawnNodeIdForNodeId(fromNodeId);
  if (world.isNodeFrozen(respawnNodeId)) {
    thawNode(world, respawnNodeId);
  }
  entity.hasPosition.nodeId = respawnNodeId;
  if (fromNodeId !== respawnNodeId) {
    world.movePlayerNode(fromNodeId, respawnNodeId, entity.isPlayer.id);
  }
  entity.hasPosition.current = spawn;
  // Force the next node:delta for the clearing to be a full snapshot so the
  // respawning client clears render state from the node where they died.
  // Mirrors the gate-transition path in `transitions.ts`.
  world.resetNodeDeltaState(respawnNodeId);
  stopEntity(world, entity);
  setAttackTarget(world, entity, null);
  clearAutoTraversePath(world, entity);
  // Drop any live slimes — the summoner tick will restage them at the new spawn.
  despawnMinionsForOwner(world, entity);

  recalculatePlayerEntityStats(world, entity);
  syncArchetypeSlices(world, entity);
  entity.hasHealth.hp = entity.hasHealth.maxHp;
  refillBarrier(world, entity); // the barrier is runtime-only and always respawns full

  resetEvadeAccumulator(world, entity); // reset deterministic dodge accumulator on respawn
  detachComponent(world, entity, "isFleeing");
  detachComponent(world, entity, "holdsWards");
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
  if (isDungeonNode(nodeId)) return 0;
  const targetCount = world.getMobDensity(nodeId);
  // Re-read the count each iteration: a pack alpha spawns several mobs at once,
  // so a fixed +1 would overshoot the density target.
  while (world.getMonsterCountInNode(nodeId) < targetCount) {
    if (!spawnMonster(world, nodeId)) break;
  }
  return 0;
}

/**
 * Maintain exactly one boss in each dungeon node. If no boss is present,
 * picks from the biome's bossPoolByTier and spawns near the node center.
 */
export function ensureBoss(world: World, nodeId: string): void {
  if (isDungeonNode(nodeId)) return;
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
