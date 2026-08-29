import {
  GAME_CONFIG,
  MONSTER_DATABASE,
  distanceSq,
  getDungeonDef,
  isDungeonNode,
  guardianTotalFor,
  BIOME_DUNGEON_MESSAGES,
  type DungeonDef,
  type DungeonView,
  type DungeonMonsterModifiers,
  type GuardGroupDef,
  type Vec2,
} from "@mmo-idle/shared";
import type { MonsterEntity, PlayerEntity } from "../../../ecs/entity";
import type { World } from "../../../world/World";
import { recordWorldLogEvent } from "../../../world/worldLog";
import { markSliceDirty } from "../../../ecs/dirtyHelpers";
import { registerCombatListener } from "../../combat/engine/combatPipeline";
import { setAggroTarget, setAttackTarget } from "../../combat/ai/targeting";
import { clearGroundZonesForNode } from "../groundZones";
import { clearCorpsesForNode } from "../corpses";
import {
  clearAmbientRampOverride,
  resetNodeFeatureRuntimeState,
} from "../nodeFeatures";

/**
 * Runtime state for one dungeon node. Never persisted: node freeze discards it
 * and thaw rebuilds a fresh idle guard.
 */
export interface DungeonState {
  nodeId: string;
  status: "idle" | "bossAwakening" | "boss" | "cooldown";
  /** Living guardians, whether idle at their stations or engaged on the altar. */
  guardianIds: string[];
  /** True once the altar has been activated and the guardians have turned. */
  guardiansEngaged: boolean;
  bossMonsterId?: string;
  participantPlayerIds: Set<string>;
  startedAtMs?: number;
  startedByPlayerId?: string;
  bossAwakensAtMs?: number;
  cooldownEndsAtMs?: number;
  lastGuardianKillAtMs?: number;
}

/**
 * Leash a guardian gets once the altar is live. The trial is on: it should chase
 * the player anywhere in the node rather than snapping back to a station nobody
 * is guarding any more.
 */
const ENGAGED_LEASH_RADIUS = 3_600;

/** Waypoints in a pack guardian's local mill loop around its own post. */
const MILL_ROUTE_POINTS = 4;

const PREFERRED_SPAWN_PLAYER_DISTANCE = 360;
const FALLBACK_SPAWN_PLAYER_DISTANCE = 160;

export { isDungeonNode };

export function createEmptyDungeonState(nodeId: string): DungeonState {
  return {
    nodeId,
    status: "idle",
    guardianIds: [],
    guardiansEngaged: false,
    participantPlayerIds: new Set(),
  };
}

export function ensureDungeon(world: World, nodeId: string): void {
  const def = getDungeonDef(nodeId);
  if (!def) return;
  let state = world.dungeons.get(nodeId);
  if (!state) {
    state = createEmptyDungeonState(nodeId);
    world.dungeons.set(nodeId, state);
    spawnGuard(world, def, state);
    return;
  }
  if (state.status === "idle") {
    state.guardianIds = state.guardianIds.filter((id) => world.hasMonster(id));
  }
}

export function resetDungeon(
  world: World,
  nodeId: string,
  options: { reason?: string; spawnGuardians?: boolean } = {},
): void {
  const def = getDungeonDef(nodeId);
  const existing = world.dungeons.get(nodeId);
  if (existing) {
    despawnIds(world, existing.guardianIds);
    if (existing.bossMonsterId) world.removeMonsterEntity(existing.bossMonsterId);
  }
  if (!def) {
    world.dungeons.delete(nodeId);
    return;
  }

  const state = createEmptyDungeonState(nodeId);
  world.dungeons.set(nodeId, state);
  if (options.spawnGuardians !== false) spawnGuard(world, def, state);
  pushDungeonMessage(
    world,
    nodeId,
    options.reason === "node_wipe" ? "The guard reforms." : "The altar reforms.",
  );
}

/**
 * Harness-only encounter reset primitive. The caller owns the development-mode
 * gate. Dungeon nodes contain only encounter-owned monsters, so clearing the
 * node precisely removes guardians, boss, script-spawned adds, raised corpses,
 * and any other encounter-local entity before rebuilding an idle altar.
 */
export function resetDungeonEncounterForFastRetry(
  world: World,
  nodeId: string,
  options: { includeGuardians: boolean },
): void {
  if (!getDungeonDef(nodeId)) throw new Error(`Not a dungeon node: ${nodeId}`);

  for (const monster of [...world.monsterEntitiesInNode(nodeId)]) {
    world.removeMonsterEntity(monster.isMonster.id);
  }
  clearGroundZonesForNode(world, nodeId);
  clearCorpsesForNode(world, nodeId);
  clearAmbientRampOverride(world, nodeId);
  resetNodeFeatureRuntimeState(world, nodeId);
  resetDungeon(world, nodeId, {
    reason: "noncanonical_fast_boss_retry",
    spawnGuardians: options.includeGuardians,
  });
  world.reconcileMonsterCounts();
  world.resetNodeDeltaState(nodeId);
}

export function clearDungeonRuntime(world: World, nodeId: string): void {
  world.dungeons.delete(nodeId);
}

export function tickDungeons(world: World, now: number): void {
  for (const [nodeId, state] of [...world.dungeons]) {
    const def = getDungeonDef(nodeId);
    if (!def || world.isNodeFrozen(nodeId)) continue;

    switch (state.status) {
      case "cooldown":
        if (state.cooldownEndsAtMs !== undefined && now >= state.cooldownEndsAtMs) {
          resetDungeon(world, nodeId);
        }
        continue;

      case "bossAwakening":
        maintainEngagedAggro(world, state);
        if (state.bossAwakensAtMs === undefined) {
          state.bossAwakensAtMs = now + def.bossAwakeningDelayMs;
        }
        if (now >= state.bossAwakensAtMs) spawnDungeonBoss(world, def, state);
        continue;

      case "boss":
        maintainEngagedAggro(world, state);
        continue;

      case "idle":
        // Guardians cleared but the altar never touched: the guard reforms so a
        // dungeon can't be left permanently stripped for the next visitor.
        if (
          def.idlePreclearResetMs &&
          state.lastGuardianKillAtMs &&
          now - state.lastGuardianKillAtMs >= def.idlePreclearResetMs
        ) {
          resetDungeon(world, nodeId, { reason: "preclear_timeout" });
        }
        continue;
    }
  }
}

/**
 * Activating the altar is the whole trial trigger: every guardian still standing
 * turns on the player at once, and the boss begins to wake. There is no reward
 * for leaving guardians alive and no extra difficulty hook — the survivors
 * simply fight alongside the boss.
 */
export function activateDungeonAltar(world: World, player: PlayerEntity): boolean {
  const nodeId = player.hasPosition.nodeId;
  const def = getDungeonDef(nodeId);
  if (!def) return false;
  ensureDungeon(world, nodeId);
  const state = world.dungeons.get(nodeId);
  if (!state || state.status !== "idle") return false;
  if (!isNearAltar(player, def)) return false;

  state.startedAtMs = Date.now();
  state.startedByPlayerId = player.isPlayer.id;
  state.participantPlayerIds.add(player.isPlayer.id);

  engageGuardians(world, def, state);
  startBossAwakening(world, def, state);

  recordWorldLogEvent(
    world,
    {
      kind: "dungeon-message",
      nodeId,
      message: `${player.isPlayer.name} disturbs the altar.`,
    },
    {
      visibility: "node",
      relatedPlayerIds: [player.isPlayer.id],
      nodeId,
    },
  );
  return true;
}

export function onDungeonMonsterRewarded(
  world: World,
  killerPlayerId: string,
  monster: MonsterEntity,
): { suppressBossRespawn: boolean } {
  const dungeon = monster.tracksDungeon;
  if (!dungeon) return { suppressBossRespawn: false };
  const state = world.dungeons.get(dungeon.dungeonNodeId);
  if (!state) return { suppressBossRespawn: dungeon.source === "dungeonBoss" };

  markDungeonParticipant(world, dungeon.dungeonNodeId, killerPlayerId);

  if (dungeon.source === "dungeonGuardian") {
    // Guardians grant their normal monster rewards whenever they die, and never
    // gate the boss.
    removeId(state.guardianIds, monster.isMonster.id);
    if (!state.guardiansEngaged) state.lastGuardianKillAtMs = Date.now();
    return { suppressBossRespawn: false };
  }

  completeDungeon(world, dungeon.dungeonNodeId, monster);
  return { suppressBossRespawn: true };
}

export function resetDungeonIfNodeWiped(world: World, nodeId: string): void {
  const state = world.dungeons.get(nodeId);
  if (!state) return;
  if (state.status !== "bossAwakening" && state.status !== "boss") return;
  if (!world.livePlayersInNode(nodeId).next().done) return;
  resetDungeon(world, nodeId, { reason: "node_wipe" });
}

export function buildDungeonView(
  world: World,
  nodeId: string,
): DungeonView | undefined {
  const def = getDungeonDef(nodeId);
  if (!def) return undefined;
  const state = world.dungeons.get(nodeId);
  const now = Date.now();
  const guardianTotal = guardianTotalFor(def);
  if (!state) {
    return {
      nodeId,
      status: "idle",
      altar: def.altar,
      canActivate: true,
      guardLabel: def.guard.label,
      guardianAlive: 0,
      guardianTotal,
      guardianMonsterIds: [],
    };
  }
  const living = state.guardianIds.filter((id) => world.hasMonster(id));
  return {
    nodeId,
    status: state.status,
    altar: def.altar,
    canActivate: state.status === "idle",
    guardLabel: def.guard.label,
    guardianAlive: living.length,
    guardianTotal,
    guardianMonsterIds: living,
    bossMonsterId: state.bossMonsterId,
    bossTypeId: state.bossMonsterId
      ? world.getMonsterEntity(state.bossMonsterId)?.isMonster.monsterTypeId
      : undefined,
    bossAwakensAtMs: state.bossAwakensAtMs,
    bossAwakeningRemainingMs: state.bossAwakensAtMs
      ? Math.max(0, state.bossAwakensAtMs - now)
      : undefined,
    cooldownEndsAtMs: state.cooldownEndsAtMs,
    cooldownRemainingMs: state.cooldownEndsAtMs
      ? Math.max(0, state.cooldownEndsAtMs - now)
      : undefined,
  };
}

export function initDungeonCombatHooks(): void {
  registerCombatListener("onDamageTaken", (ctx, world) => {
    if (ctx.attackerType === "player" && ctx.defenderType === "monster") {
      const dungeon = ctx.defender.tracksDungeon;
      if (!dungeon) return;
      markDungeonParticipant(world, dungeon.dungeonNodeId, ctx.attacker.isPlayer.id);
      return;
    }
    if (ctx.attackerType === "monster" && ctx.defenderType === "player") {
      const dungeon = ctx.attacker.tracksDungeon;
      if (!dungeon) return;
      markDungeonParticipant(world, dungeon.dungeonNodeId, ctx.defender.isPlayer.id);
    }
  });
}

// ── Guard spawning ────────────────────────────────────────────────────────────

function spawnGuard(world: World, def: DungeonDef, state: DungeonState): void {
  for (const group of def.guard.groups) {
    spawnGuardGroup(world, def, state, group);
  }
}

function spawnGuardGroup(
  world: World,
  def: DungeonDef,
  state: DungeonState,
  group: GuardGroupDef,
): void {
  const packId = `${def.nodeId}:guard:${group.id}`;
  const leader = spawnGuardian(world, def, group, group.leaderMonsterId, group.station);
  if (!leader) return;
  if (group.leaderName) leader.isMonster.name = group.leaderName;
  markGuardianSlicesDirty(world, leader);
  state.guardianIds.push(leader.isMonster.id);

  const followers = group.followers ?? [];
  if (followers.length === 0) return;

  // Members of a pack station share an `inPack` link, so the shipped call-allies
  // and alpha-scatter ecology applies to guardians exactly as it does in the open
  // world: pull one and the station answers, kill the leader and the rest break.
  world.ecs.addComponent(leader, "inPack", { packId, role: "alpha" });
  const total = followers.reduce((sum, f) => sum + f.count, 0);
  let index = 0;
  for (const follower of followers) {
    for (let i = 0; i < follower.count; i++) {
      const point = followerPoint(group.station, index, Math.max(1, total));
      index++;
      const monster = spawnGuardian(world, def, group, follower.monsterId, point);
      if (!monster) continue;
      world.ecs.addComponent(monster, "inPack", { packId, role: "follower" });
      markGuardianSlicesDirty(world, monster);
      state.guardianIds.push(monster.isMonster.id);
    }
  }
}

function spawnGuardian(
  world: World,
  def: DungeonDef,
  group: GuardGroupDef,
  monsterId: string,
  point: Vec2,
): MonsterEntity | null {
  const monster = world.createMonster(def.nodeId, monsterId, clampToNode(point));
  if (!monster) return null;
  const post = { ...monster.hasPosition.current };

  monster.tracksDungeon = {
    source: "dungeonGuardian",
    dungeonNodeId: def.nodeId,
    guardGroupId: group.id,
    guardPost: post,
    leashRadius: group.leashRadius,
  };

  // A patrolling guardian's territory is the orbit, so its leash anchor is the
  // ALTAR — it may walk the whole ring but can never be dragged off it. The
  // others anchor on their own station.
  const leashAnchor = group.shape === "patrol" ? { ...def.altar } : post;
  monster.controlsMonster.spawn = leashAnchor;
  monster.controlsMonster.leashRange = group.leashRadius;
  monster.hasAwareness.leashRange = group.leashRadius;
  monster.hasAwareness.pullRange = Math.min(
    monster.hasAwareness.pullRange,
    group.pullRange,
  );

  // EVERY guardian stands a post. `holdPost` sends a disengaged guardian back to
  // its station (not to the leash anchor) and takes it off the random-wander
  // path entirely — which is what keeps it on station, since several biomes
  // override that path with node-wide targets (swamp mobs drift to the nearest
  // pool, cave lurkers to the nearest wall) that ignore `wanderRadius`.
  monster.controlsMonster.holdPost = { ...post };
  monster.controlsMonster.wanderRadius = 0;
  applyHoldRoute(monster, group, post);

  applyDungeonModifiers(monster, def.guard.modifiers);
  return monster;
}

/**
 * The route a guardian walks while nothing has aggroed it: the authored altar
 * orbit for `patrol`, a small local mill around its own post for `pack`, and
 * nothing at all for `post-hold` (it simply stands there).
 */
function applyHoldRoute(
  monster: MonsterEntity,
  group: GuardGroupDef,
  post: Vec2,
): void {
  if (group.shape === "patrol") {
    const waypoints = group.patrolWaypoints ?? [];
    if (waypoints.length === 0) return;
    monster.controlsMonster.holdPatrol = waypoints.map((point) => ({ ...point }));
    monster.controlsMonster.holdPatrolIndex = 0;
    if (group.patrolHoldMinMs !== undefined) {
      monster.controlsMonster.idleMinMs = group.patrolHoldMinMs;
    }
    if (group.patrolHoldMaxMs !== undefined) {
      monster.controlsMonster.idleMaxMs = group.patrolHoldMaxMs;
    }
    return;
  }
  if (group.shape !== "pack") return;
  const radius = group.localWanderRadius ?? 0;
  if (radius <= 0) return;
  // Each member mills around ITS OWN post, so a station reads as a loose group
  // rather than a column walking the same four points.
  const points: Vec2[] = [];
  for (let i = 0; i < MILL_ROUTE_POINTS; i++) {
    const angle = (Math.PI * 2 * i) / MILL_ROUTE_POINTS;
    points.push(
      clampToNode({
        x: post.x + Math.cos(angle) * radius,
        y: post.y + Math.sin(angle) * radius,
      }),
    );
  }
  monster.controlsMonster.holdPatrol = points;
  monster.controlsMonster.holdPatrolIndex = 0;
}

function followerPoint(anchor: Vec2, index: number, total: number): Vec2 {
  const radius = 70;
  const angle = (Math.PI * 2 * index) / total;
  return clampToNode({
    x: anchor.x + Math.cos(angle) * radius,
    y: anchor.y + Math.sin(angle) * radius,
  });
}

function markGuardianSlicesDirty(world: World, monster: MonsterEntity): void {
  markSliceDirty(world, monster, "isMonster");
  markSliceDirty(world, monster, "hasHealth");
  markSliceDirty(world, monster, "dealsDamage");
  markSliceDirty(world, monster, "performsAttack");
  markSliceDirty(world, monster, "mitigatesDamage");
  markSliceDirty(world, monster, "hasAwareness");
}

// ── Trial flow ────────────────────────────────────────────────────────────────

function engageGuardians(
  world: World,
  def: DungeonDef,
  state: DungeonState,
): void {
  state.guardiansEngaged = true;
  state.guardianIds = state.guardianIds.filter((id) => world.hasMonster(id));
  if (state.guardianIds.length === 0) return;

  for (const id of state.guardianIds) {
    const monster = world.getMonsterEntity(id);
    if (!monster) continue;
    if (monster.tracksDungeon) monster.tracksDungeon.leashRadius = ENGAGED_LEASH_RADIUS;
    monster.controlsMonster.leashRange = ENGAGED_LEASH_RADIUS;
    monster.hasAwareness.leashRange = ENGAGED_LEASH_RADIUS;
    // The station is abandoned once the altar is live: stop returning to it.
    monster.controlsMonster.holdPost = undefined;
    monster.controlsMonster.holdPatrol = undefined;
    forceDungeonAggro(world, monster);
  }
  const message =
    BIOME_DUNGEON_MESSAGES[def.biomeGroup]?.activation ?? "The guardians turn on you.";
  pushDungeonMessage(world, def.nodeId, message);
}

function startBossAwakening(
  world: World,
  def: DungeonDef,
  state: DungeonState,
): void {
  state.status = "bossAwakening";
  state.bossMonsterId = undefined;
  state.bossAwakensAtMs = Date.now() + def.bossAwakeningDelayMs;
  const message =
    BIOME_DUNGEON_MESSAGES[def.biomeGroup]?.bossAwakening ?? "Something stirs.";
  pushDungeonMessage(world, def.nodeId, message);
}

function spawnDungeonBoss(
  world: World,
  def: DungeonDef,
  state: DungeonState,
): void {
  const authoredPoint =
    def.boss.spawnAt === "fixed-point" && def.boss.fixedSpawnPoint
      ? def.boss.fixedSpawnPoint
      : { x: def.altar.x, y: def.altar.y };
  const point = selectSpawnPoint(
    world,
    def.nodeId,
    bossSpawnCandidates(def, authoredPoint),
  );
  const boss = world.createMonster(def.nodeId, def.boss.bossId, point);
  if (!boss) return;
  boss.tracksDungeon = {
    source: "dungeonBoss",
    dungeonNodeId: def.nodeId,
    leashRadius: ENGAGED_LEASH_RADIUS,
  };
  boss.controlsMonster.leashRange = ENGAGED_LEASH_RADIUS;
  boss.hasAwareness.leashRange = ENGAGED_LEASH_RADIUS;
  forceDungeonAggro(world, boss);
  state.status = "boss";
  state.bossAwakensAtMs = undefined;
  state.bossMonsterId = boss.isMonster.id;
  const bossName = MONSTER_DATABASE.get(def.boss.bossId)?.name ?? "The boss";
  pushDungeonMessage(world, def.nodeId, `${bossName} awakens.`);
}

function completeDungeon(
  world: World,
  nodeId: string,
  monster: MonsterEntity,
): void {
  const def = getDungeonDef(nodeId);
  const state = world.dungeons.get(nodeId);
  if (!def || !state) return;
  state.status = "cooldown";
  // The trial is over: any guardians that were still fighting leave with it.
  despawnIds(world, state.guardianIds);
  state.guardianIds = [];
  state.guardiansEngaged = false;
  state.bossMonsterId = undefined;
  state.bossAwakensAtMs = undefined;
  state.lastGuardianKillAtMs = undefined;
  state.cooldownEndsAtMs = Date.now() + def.successCooldownMs;
  pushDungeonMessage(
    world,
    nodeId,
    `${monster.isMonster.name} falls. The altar begins to reform.`,
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function applyDungeonModifiers(
  monster: MonsterEntity,
  modifiers: DungeonMonsterModifiers | undefined,
): void {
  if (!modifiers) return;
  if (modifiers.hpMult !== undefined) {
    const maxHp = Math.max(1, Math.round(monster.hasHealth.maxHp * modifiers.hpMult));
    monster.hasHealth.maxHp = maxHp;
    monster.hasHealth.hp = maxHp;
  }
  if (modifiers.atkMult !== undefined) {
    monster.dealsDamage.attack = Math.max(
      1,
      Math.round(monster.dealsDamage.attack * modifiers.atkMult),
    );
  }
  if (modifiers.attackSpeedMult !== undefined && modifiers.attackSpeedMult > 0) {
    monster.performsAttack.attackCooldown = Math.max(
      100,
      Math.round(monster.performsAttack.attackCooldown / modifiers.attackSpeedMult),
    );
  }
  if (modifiers.moveSpeedMult !== undefined) {
    monster.hasPosition.speed = Math.max(
      1,
      Math.round(monster.hasPosition.speed * modifiers.moveSpeedMult),
    );
    monster.controlsMonster.baseSpeed = monster.hasPosition.speed;
  }
  if (modifiers.armorMult !== undefined) {
    monster.mitigatesDamage.plating = Math.round(
      monster.mitigatesDamage.plating * modifiers.armorMult,
    );
  }
  if (modifiers.drAdd !== undefined) {
    monster.mitigatesDamage.damageReduction = Math.max(
      0,
      Math.min(0.9, monster.mitigatesDamage.damageReduction + modifiers.drAdd),
    );
  }
  if (modifiers.dotMult !== undefined) {
    const baseDot = MONSTER_DATABASE.get(monster.isMonster.monsterTypeId)?.dotEffect;
    if (baseDot) {
      monster.scriptsBoss ??= { phaseTriggered: [], repeatingTimers: [], activeEffects: [] };
      monster.scriptsBoss.dotEffectOverride = {
        ...baseDot,
        damagePerStack: Math.max(1, Math.round(baseDot.damagePerStack * modifiers.dotMult)),
      };
    }
  }
  if (modifiers.openingStrikeMult !== undefined && monster.tracksDungeon) {
    monster.tracksDungeon.openingStrikeMult = modifiers.openingStrikeMult;
  }
}

function bossSpawnCandidates(def: DungeonDef, authoredPoint: Vec2): Vec2[] {
  const candidates = [clampToNode(authoredPoint)];
  for (const radius of [260, 420]) {
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8 - Math.PI / 2;
      candidates.push(
        clampToNode({
          x: def.altar.x + Math.cos(angle) * radius,
          y: def.altar.y + Math.sin(angle) * radius,
        }),
      );
    }
  }
  return candidates;
}

/** Prefer a spawn point that is not right on top of a player. */
function selectSpawnPoint(world: World, nodeId: string, candidates: Vec2[]): Vec2 {
  if (candidates.length === 0) {
    return { x: GAME_CONFIG.NODE_WIDTH / 2, y: GAME_CONFIG.NODE_HEIGHT / 2 };
  }

  const scored = candidates.map((point) => ({
    point,
    nearestPlayerDistSq: nearestLivePlayerDistanceSq(world, nodeId, point),
  }));
  if (scored.every((entry) => entry.nearestPlayerDistSq === Infinity)) {
    return candidates[0];
  }

  const preferredSq = PREFERRED_SPAWN_PLAYER_DISTANCE * PREFERRED_SPAWN_PLAYER_DISTANCE;
  const preferred = scored.find((entry) => entry.nearestPlayerDistSq >= preferredSq);
  if (preferred) return preferred.point;

  const fallbackSq = FALLBACK_SPAWN_PLAYER_DISTANCE * FALLBACK_SPAWN_PLAYER_DISTANCE;
  scored.sort((a, b) => b.nearestPlayerDistSq - a.nearestPlayerDistSq);
  const fallback = scored.find((entry) => entry.nearestPlayerDistSq >= fallbackSq);
  return (fallback ?? scored[0]).point;
}

function nearestLivePlayerDistanceSq(
  world: World,
  nodeId: string,
  point: Vec2,
): number {
  let nearest = Infinity;
  for (const player of world.livePlayersInNode(nodeId)) {
    nearest = Math.min(nearest, distanceSq(player.hasPosition.current, point));
  }
  return nearest;
}

function forceDungeonAggro(world: World, monster: MonsterEntity): void {
  const target = nearestLivePlayer(
    world,
    monster.hasPosition.nodeId,
    monster.hasPosition.current,
  );
  if (!target) return;
  if (
    monster.hasAggroTarget?.targetKind === "player" &&
    monster.hasAggroTarget.targetId === target.isPlayer.id
  ) {
    if (monster.hasAttackTarget?.targetId !== target.isPlayer.id) {
      setAttackTarget(world, monster, target.isPlayer.id);
    }
    return;
  }
  setAggroTarget(world, monster, { id: target.isPlayer.id, kind: "player" }, Date.now());
  setAttackTarget(world, monster, target.isPlayer.id);
}

function maintainEngagedAggro(world: World, state: DungeonState): void {
  for (const id of state.guardianIds) {
    const monster = world.getMonsterEntity(id);
    if (monster) forceDungeonAggro(world, monster);
  }
  if (state.bossMonsterId) {
    const boss = world.getMonsterEntity(state.bossMonsterId);
    if (boss) forceDungeonAggro(world, boss);
  }
}

function nearestLivePlayer(
  world: World,
  nodeId: string,
  point: Vec2,
): PlayerEntity | null {
  let nearest: PlayerEntity | null = null;
  let nearestDistSq = Infinity;
  for (const player of world.livePlayersInNode(nodeId)) {
    const distSq = distanceSq(player.hasPosition.current, point);
    if (distSq >= nearestDistSq) continue;
    nearest = player;
    nearestDistSq = distSq;
  }
  return nearest;
}

function isNearAltar(player: PlayerEntity, def: DungeonDef): boolean {
  return (
    distanceSq(player.hasPosition.current, def.altar) <=
    def.altar.activationRadius * def.altar.activationRadius
  );
}

function markDungeonParticipant(
  world: World,
  nodeId: string,
  playerId: string,
): void {
  const state = world.dungeons.get(nodeId);
  if (!state) return;
  if (state.status !== "bossAwakening" && state.status !== "boss") return;
  state.participantPlayerIds.add(playerId);
}

function despawnIds(world: World, ids: string[]): void {
  for (const id of ids) {
    if (world.hasMonster(id)) world.removeMonsterEntity(id);
  }
}

function removeId(ids: string[], id: string): void {
  const index = ids.indexOf(id);
  if (index >= 0) ids.splice(index, 1);
}

function clampToNode(pos: Vec2): Vec2 {
  const margin = 64;
  return {
    x: Math.max(margin, Math.min(GAME_CONFIG.NODE_WIDTH - margin, pos.x)),
    y: Math.max(margin, Math.min(GAME_CONFIG.NODE_HEIGHT - margin, pos.y)),
  };
}

function pushDungeonMessage(world: World, nodeId: string, message: string): void {
  recordWorldLogEvent(
    world,
    { kind: "dungeon-message", nodeId, message },
    { visibility: "node", relatedPlayerIds: [], nodeId },
  );
}
