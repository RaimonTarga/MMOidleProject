import {
  GAME_CONFIG,
  MONSTER_DATABASE,
  distanceSq,
  getDungeonGauntletDef,
  isGauntletDungeonNode,
  BIOME_GUARDIAN_NAMES,
  BIOME_GAUNTLET_MESSAGES,
  type DungeonGauntletDef,
  type DungeonGauntletView,
  type DungeonMonsterModifiers,
  type GauntletPhaseDef,
  type Vec2,
} from "@mmo-idle/shared";
import type { MonsterEntity, PlayerEntity, TracksDungeon } from "../../../ecs/entity";
import type { World } from "../../../world/World";
import { recordWorldLogEvent } from "../../../world/worldLog";
import { markSliceDirty } from "../../../ecs/dirtyHelpers";
import { registerCombatListener } from "../../combat/engine/combatPipeline";
import { setAggroTarget, setAttackTarget } from "../../combat/ai/targeting";

export interface GauntletState {
  nodeId: string;
  status: "idle" | "active" | "bossAwakening" | "boss" | "cooldown";
  phaseIndex: number;
  killsInPhase: number;
  requiredKillsForCurrentPhase: number;
  idleGuardianIds: string[];
  activeMonsterIds: string[];
  bossMonsterId?: string;
  participantPlayerIds: Set<string>;
  startedAtMs?: number;
  startedByPlayerId?: string;
  bossAwakensAtMs?: number;
  cooldownEndsAtMs?: number;
  lastIdleGuardianKillAtMs?: number;
}

const GUARDIAN_LEASH_RADIUS = 260;
const IDLE_GUARDIAN_PULL_RANGE = 180;
const ACTIVE_LEASH_RADIUS = 3_600;
const PREFERRED_SPAWN_PLAYER_DISTANCE = 360;
const FALLBACK_SPAWN_PLAYER_DISTANCE = 160;
const GUARDIAN_RING_RADIUS = 620;
const SPAWN_JITTER_PX = 40;

export { isGauntletDungeonNode };

export function createEmptyGauntletState(nodeId: string): GauntletState {
  return {
    nodeId,
    status: "idle",
    phaseIndex: 0,
    killsInPhase: 0,
    requiredKillsForCurrentPhase: 0,
    idleGuardianIds: [],
    activeMonsterIds: [],
    participantPlayerIds: new Set(),
  };
}

export function ensureDungeonGauntlet(world: World, nodeId: string): void {
  const def = getDungeonGauntletDef(nodeId);
  if (!def) return;
  let state = world.gauntlets.get(nodeId);
  if (!state) {
    state = createEmptyGauntletState(nodeId);
    world.gauntlets.set(nodeId, state);
    spawnIdleGuardians(world, def, state);
    return;
  }
  if (state.status === "idle") {
    state.idleGuardianIds = state.idleGuardianIds.filter((id) => world.hasMonster(id));
  }
}

export function resetDungeonGauntlet(
  world: World,
  nodeId: string,
  options: { reason?: string; spawnIdle?: boolean } = {},
): void {
  const def = getDungeonGauntletDef(nodeId);
  const existing = world.gauntlets.get(nodeId);
  if (existing) {
    despawnIds(world, existing.idleGuardianIds);
    despawnIds(world, existing.activeMonsterIds);
    if (existing.bossMonsterId) world.removeMonsterEntity(existing.bossMonsterId);
  }
  if (!def) {
    world.gauntlets.delete(nodeId);
    return;
  }

  const state = createEmptyGauntletState(nodeId);
  world.gauntlets.set(nodeId, state);
  if (options.spawnIdle !== false) spawnIdleGuardians(world, def, state);
  pushGauntletMessage(world, nodeId, options.reason === "node_wipe"
    ? "The trial resets."
    : "The altar reforms.");
}

export function clearDungeonGauntletRuntime(world: World, nodeId: string): void {
  world.gauntlets.delete(nodeId);
}

export function tickDungeonGauntlets(world: World, now: number): void {
  for (const [nodeId, state] of [...world.gauntlets]) {
    const def = getDungeonGauntletDef(nodeId);
    if (!def || world.isNodeFrozen(nodeId)) continue;

    if (state.status === "cooldown") {
      if (state.cooldownEndsAtMs !== undefined && now >= state.cooldownEndsAtMs) {
        resetDungeonGauntlet(world, nodeId);
      }
      continue;
    }

    if (state.status === "bossAwakening") {
      if (state.bossAwakensAtMs === undefined) {
        state.bossAwakensAtMs = now + def.bossAwakeningDelayMs;
      }
      if (now >= state.bossAwakensAtMs) {
        spawnGauntletBoss(world, def, state);
      }
      continue;
    }

    if (
      state.status === "idle" &&
      def.idlePreclearResetMs &&
      state.lastIdleGuardianKillAtMs &&
      now - state.lastIdleGuardianKillAtMs >= def.idlePreclearResetMs
    ) {
      resetDungeonGauntlet(world, nodeId, { reason: "preclear_timeout" });
      continue;
    }

    if (state.status === "active" || state.status === "boss") {
      maintainGauntletAggro(world, state);
    }
  }
}

export function activateDungeonAltar(world: World, player: PlayerEntity): boolean {
  const nodeId = player.hasPosition.nodeId;
  const def = getDungeonGauntletDef(nodeId);
  if (!def) return false;
  ensureDungeonGauntlet(world, nodeId);
  const state = world.gauntlets.get(nodeId);
  if (!state || state.status !== "idle") return false;
  if (!isNearAltar(player, def)) return false;

  state.status = "active";
  state.phaseIndex = 0;
  state.killsInPhase = 0;
  state.startedAtMs = Date.now();
  state.startedByPlayerId = player.isPlayer.id;
  state.participantPlayerIds.add(player.isPlayer.id);

  convertSurvivingGuardians(world, def, state);
  recordWorldLogEvent(
    world,
    {
      kind: "dungeon-message",
      nodeId,
      message: `${player.isPlayer.name} begins the dungeon trial.`,
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
  const state = world.gauntlets.get(dungeon.dungeonNodeId);
  if (!state) return { suppressBossRespawn: dungeon.source === "gauntletBoss" };

  markGauntletParticipant(world, dungeon.dungeonNodeId, killerPlayerId);

  if (dungeon.source === "idleDungeonGuardian") {
    removeId(state.idleGuardianIds, monster.isMonster.id);
    state.lastIdleGuardianKillAtMs = Date.now();
    return { suppressBossRespawn: false };
  }

  if (dungeon.source === "gauntletPhase") {
    removeId(state.activeMonsterIds, monster.isMonster.id);
    state.killsInPhase += 1;
    if (state.killsInPhase >= state.requiredKillsForCurrentPhase) {
      advanceGauntlet(world, dungeon.dungeonNodeId);
    }
    return { suppressBossRespawn: false };
  }

  completeGauntlet(world, dungeon.dungeonNodeId, monster);
  return { suppressBossRespawn: true };
}

export function resetGauntletIfNodeWiped(
  world: World,
  nodeId: string,
): void {
  const state = world.gauntlets.get(nodeId);
  if (!state) return;
  if (
    state.status !== "active" &&
    state.status !== "bossAwakening" &&
    state.status !== "boss"
  ) return;
  if (!world.livePlayersInNode(nodeId).next().done) return;
  resetDungeonGauntlet(world, nodeId, { reason: "node_wipe" });
}

export function buildDungeonGauntletView(
  world: World,
  nodeId: string,
): DungeonGauntletView | undefined {
  const def = getDungeonGauntletDef(nodeId);
  if (!def) return undefined;
  const state = world.gauntlets.get(nodeId);
  const now = Date.now();
  if (!state) {
    return {
      nodeId,
      status: "idle",
      altar: def.altar,
      canActivate: true,
      guardianAlive: 0,
      guardianTotal: def.guardianPhase.requiredKills,
      phaseIndex: 0,
      killsInPhase: 0,
      requiredKillsForCurrentPhase: 0,
      guardianMonsterIds: [],
      activeMonsterIds: [],
    };
  }
  return {
    nodeId,
    status: state.status,
    altar: def.altar,
    canActivate: state.status === "idle",
    guardianAlive: state.idleGuardianIds.filter((id) => world.hasMonster(id)).length,
    guardianTotal: def.guardianPhase.requiredKills,
    phaseIndex: state.phaseIndex,
    phaseLabel: currentPhaseLabel(def, state),
    killsInPhase: state.killsInPhase,
    requiredKillsForCurrentPhase: state.requiredKillsForCurrentPhase,
    guardianMonsterIds: state.idleGuardianIds.filter((id) => world.hasMonster(id)),
    activeMonsterIds: state.activeMonsterIds.filter((id) => world.hasMonster(id)),
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

export function initDungeonGauntletCombatHooks(): void {
  registerCombatListener("onDamageTaken", (ctx, world) => {
    if (ctx.attackerType === "player" && ctx.defenderType === "monster") {
      const dungeon = ctx.defender.tracksDungeon;
      if (!dungeon) return;
      if (dungeon.source === "idleDungeonGuardian") return;
      markGauntletParticipant(world, dungeon.dungeonNodeId, ctx.attacker.isPlayer.id);
      return;
    }
    if (ctx.attackerType === "monster" && ctx.defenderType === "player") {
      const dungeon = ctx.attacker.tracksDungeon;
      if (!dungeon) return;
      if (dungeon.source === "idleDungeonGuardian") return;
      markGauntletParticipant(world, dungeon.dungeonNodeId, ctx.defender.isPlayer.id);
    }
  });
}

function spawnIdleGuardians(
  world: World,
  def: DungeonGauntletDef,
  state: GauntletState,
): void {
  const phase = def.guardianPhase;
  const points = resolveSpawnPoints(def, phase);
  for (let i = 0; i < phase.requiredKills; i++) {
    const point = points[i % points.length];
    const monster = spawnDungeonMonster(world, def.nodeId, phase, point, {
      source: "idleDungeonGuardian",
      dungeonNodeId: def.nodeId,
      gauntletPhaseIndex: 0,
      gauntletPhaseId: phase.id,
      guardPost: point,
      leashRadius: GUARDIAN_LEASH_RADIUS,
    });
    if (!monster) continue;
    monster.isMonster.name = BIOME_GUARDIAN_NAMES[def.biomeGroup]
      ?? `${def.biomeGroup[0].toUpperCase()}${def.biomeGroup.slice(1)} Guardian`;
    markSliceDirty(world, monster, "isMonster");
    state.idleGuardianIds.push(monster.isMonster.id);
  }
}

function spawnDungeonMonster(
  world: World,
  nodeId: string,
  phase: GauntletPhaseDef,
  point: Vec2,
  dungeon: TracksDungeon,
): MonsterEntity | null {
  const typeId = pickWeightedMonster(phase);
  if (!typeId) return null;
  const monster = world.createMonster(nodeId, typeId, point);
  if (!monster) return null;

  monster.tracksDungeon = dungeon;
  monster.controlsMonster.spawn = { ...point };
  monster.controlsMonster.wanderRadius = 0;
  if (dungeon.leashRadius) {
    monster.controlsMonster.leashRange = dungeon.leashRadius;
    monster.hasAwareness.leashRange = dungeon.leashRadius;
  }
  if (dungeon.source === "idleDungeonGuardian") {
    monster.hasAwareness.pullRange = Math.min(
      monster.hasAwareness.pullRange,
      IDLE_GUARDIAN_PULL_RANGE,
    );
  }
  applyDungeonModifiers(monster, phase.modifiers);
  markSliceDirty(world, monster, "isMonster");
  markSliceDirty(world, monster, "hasHealth");
  markSliceDirty(world, monster, "dealsDamage");
  markSliceDirty(world, monster, "performsAttack");
  markSliceDirty(world, monster, "mitigatesDamage");
  return monster;
}

function convertSurvivingGuardians(
  world: World,
  def: DungeonGauntletDef,
  state: GauntletState,
): void {
  const surviving = state.idleGuardianIds
    .map((id) => world.getMonsterEntity(id))
    .filter((m): m is MonsterEntity => !!m);
  state.idleGuardianIds = [];

  if (surviving.length === 0) {
    state.requiredKillsForCurrentPhase = 0;
    advanceGauntlet(world, def.nodeId);
    return;
  }

  state.activeMonsterIds = surviving.map((m) => m.isMonster.id);
  state.requiredKillsForCurrentPhase = surviving.length;
  state.killsInPhase = 0;
  for (const monster of surviving) {
    monster.tracksDungeon = {
      source: "gauntletPhase",
      dungeonNodeId: def.nodeId,
      gauntletPhaseIndex: 0,
      gauntletPhaseId: def.guardianPhase.id,
      guardPost: monster.tracksDungeon?.guardPost,
      leashRadius: ACTIVE_LEASH_RADIUS,
    };
    monster.controlsMonster.leashRange = ACTIVE_LEASH_RADIUS;
    monster.hasAwareness.leashRange = ACTIVE_LEASH_RADIUS;
    forceGauntletAggro(world, monster);
  }
  const activationMsg = BIOME_GAUNTLET_MESSAGES[def.biomeGroup]?.activation ?? "The guardians awaken.";
  pushGauntletMessage(world, def.nodeId, activationMsg);
}

function advanceGauntlet(world: World, nodeId: string): void {
  const def = getDungeonGauntletDef(nodeId);
  const state = world.gauntlets.get(nodeId);
  if (!def || !state) return;

  state.activeMonsterIds = [];
  state.killsInPhase = 0;

  if (state.phaseIndex === 0) {
    if (def.phases.length > 0) {
      state.phaseIndex = 1;
      spawnGauntletPhase(world, def, state, def.phases[0]);
      return;
    }
    startBossAwakening(world, def, state);
    return;
  }

  const nextPhase = def.phases[state.phaseIndex];
  if (nextPhase) {
    state.phaseIndex += 1;
    spawnGauntletPhase(world, def, state, nextPhase);
    return;
  }

  startBossAwakening(world, def, state);
}

function spawnGauntletPhase(
  world: World,
  def: DungeonGauntletDef,
  state: GauntletState,
  phase: GauntletPhaseDef,
): void {
  state.status = "active";
  state.killsInPhase = 0;
  state.requiredKillsForCurrentPhase = 0;
  state.activeMonsterIds = [];
  const points = resolveSpawnPoints(def, phase);
  for (let i = 0; i < phase.requiredKills; i++) {
    const point = selectGauntletSpawnPoint(world, def.nodeId, points, i);
    const monster = spawnDungeonMonster(world, def.nodeId, phase, point, {
      source: "gauntletPhase",
      dungeonNodeId: def.nodeId,
      gauntletPhaseIndex: state.phaseIndex,
      gauntletPhaseId: phase.id,
      leashRadius: ACTIVE_LEASH_RADIUS,
    });
    if (monster) {
      forceGauntletAggro(world, monster);
      state.activeMonsterIds.push(monster.isMonster.id);
    }
  }
  state.requiredKillsForCurrentPhase = state.activeMonsterIds.length;
  if (state.requiredKillsForCurrentPhase === 0) {
    advanceGauntlet(world, def.nodeId);
    return;
  }
  pushGauntletMessage(world, def.nodeId, `${phase.label} emerge.`);
}

function startBossAwakening(
  world: World,
  def: DungeonGauntletDef,
  state: GauntletState,
): void {
  state.status = "bossAwakening";
  state.killsInPhase = 0;
  state.requiredKillsForCurrentPhase = 0;
  state.activeMonsterIds = [];
  state.bossMonsterId = undefined;
  state.bossAwakensAtMs = Date.now() + def.bossAwakeningDelayMs;
  const awakeningMsg = BIOME_GAUNTLET_MESSAGES[def.biomeGroup]?.bossAwakening ?? "Something stirs.";
  pushGauntletMessage(world, def.nodeId, awakeningMsg);
}

function spawnGauntletBoss(
  world: World,
  def: DungeonGauntletDef,
  state: GauntletState,
): void {
  const authoredPoint = def.boss.spawnAt === "fixed-point" && def.boss.fixedSpawnPoint
    ? def.boss.fixedSpawnPoint
    : { x: def.altar.x, y: def.altar.y };
  const point = selectGauntletSpawnPoint(
    world,
    def.nodeId,
    bossSpawnCandidates(def, authoredPoint),
    0,
  );
  const boss = world.createMonster(def.nodeId, def.boss.bossId, point);
  if (!boss) return;
  boss.tracksDungeon = {
    source: "gauntletBoss",
    dungeonNodeId: def.nodeId,
    leashRadius: ACTIVE_LEASH_RADIUS,
  };
  boss.controlsMonster.leashRange = ACTIVE_LEASH_RADIUS;
  boss.hasAwareness.leashRange = ACTIVE_LEASH_RADIUS;
  forceGauntletAggro(world, boss);
  state.status = "boss";
  state.activeMonsterIds = [];
  state.killsInPhase = 0;
  state.requiredKillsForCurrentPhase = 1;
  state.bossAwakensAtMs = undefined;
  state.bossMonsterId = boss.isMonster.id;
  const bossName = MONSTER_DATABASE.get(def.boss.bossId)?.name ?? "The boss";
  pushGauntletMessage(world, def.nodeId, `${bossName} awakens.`);
}

function completeGauntlet(
  world: World,
  nodeId: string,
  monster: MonsterEntity,
): void {
  const def = getDungeonGauntletDef(nodeId);
  const state = world.gauntlets.get(nodeId);
  if (!def || !state) return;
  state.status = "cooldown";
  state.phaseIndex = 0;
  state.killsInPhase = 0;
  state.requiredKillsForCurrentPhase = 0;
  state.idleGuardianIds = [];
  state.activeMonsterIds = [];
  state.bossMonsterId = undefined;
  state.bossAwakensAtMs = undefined;
  state.cooldownEndsAtMs = Date.now() + def.successCooldownMs;
  pushGauntletMessage(world, nodeId, `${monster.isMonster.name} falls. The altar begins to reform.`);
}

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
    monster.dealsDamage.attack = Math.max(1, Math.round(monster.dealsDamage.attack * modifiers.atkMult));
  }
  if (modifiers.attackSpeedMult !== undefined && modifiers.attackSpeedMult > 0) {
    monster.performsAttack.attackCooldown = Math.max(
      100,
      Math.round(monster.performsAttack.attackCooldown / modifiers.attackSpeedMult),
    );
  }
  if (modifiers.moveSpeedMult !== undefined) {
    monster.hasPosition.speed = Math.max(1, Math.round(monster.hasPosition.speed * modifiers.moveSpeedMult));
    monster.controlsMonster.baseSpeed = monster.hasPosition.speed;
  }
  if (modifiers.armorMult !== undefined) {
    monster.mitigatesDamage.plating = Math.round(monster.mitigatesDamage.plating * modifiers.armorMult);
  }
  if (modifiers.drAdd !== undefined) {
    monster.mitigatesDamage.damageReduction = Math.max(
      0,
      Math.min(0.9, monster.mitigatesDamage.damageReduction + modifiers.drAdd),
    );
  }
  if (modifiers.dotMult !== undefined) {
    const def = MONSTER_DATABASE.get(monster.isMonster.monsterTypeId);
    const baseDot = def?.dotEffect;
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

function resolveSpawnPoints(
  def: DungeonGauntletDef,
  phase: GauntletPhaseDef,
): Vec2[] {
  if (phase.spawnPattern === "fixed-points" && phase.fixedSpawnPoints?.length) {
    return phase.fixedSpawnPoints;
  }

  const count = Math.max(phase.maxAlive, phase.requiredKills, 1);
  const radius = spawnRadiusFor(def, phase);
  const points: Vec2[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count - Math.PI / 2;
    points.push(clampToNode({
      x: def.altar.x + Math.cos(angle) * radius + (Math.random() - 0.5) * 2 * SPAWN_JITTER_PX,
      y: def.altar.y + Math.sin(angle) * radius + (Math.random() - 0.5) * 2 * SPAWN_JITTER_PX,
    }));
  }
  return points;
}

function spawnRadiusFor(def: DungeonGauntletDef, phase: GauntletPhaseDef): number {
  if (phase.id === def.guardianPhase.id) return GUARDIAN_RING_RADIUS;
  if (phase.spawnPattern === "wide-ring") return 360;
  if (phase.spawnPattern === "near-altar") return 140;
  return 220;
}

function selectGauntletSpawnPoint(
  world: World,
  nodeId: string,
  candidates: Vec2[],
  offset: number,
): Vec2 {
  if (candidates.length === 0) {
    return {
      x: GAME_CONFIG.NODE_WIDTH / 2,
      y: GAME_CONFIG.NODE_HEIGHT / 2,
    };
  }

  const scored = candidates.map((point) => ({
    point,
    nearestPlayerDistSq: nearestLivePlayerDistanceSq(world, nodeId, point),
  }));
  if (scored.every((entry) => entry.nearestPlayerDistSq === Infinity)) {
    return candidates[offset % candidates.length];
  }

  const preferredSq = PREFERRED_SPAWN_PLAYER_DISTANCE * PREFERRED_SPAWN_PLAYER_DISTANCE;
  const fallbackSq = FALLBACK_SPAWN_PLAYER_DISTANCE * FALLBACK_SPAWN_PLAYER_DISTANCE;
  const preferred = scored.filter((entry) => entry.nearestPlayerDistSq >= preferredSq);
  if (preferred.length > 0) return preferred[offset % preferred.length].point;

  const fallback = scored
    .filter((entry) => entry.nearestPlayerDistSq >= fallbackSq)
    .sort((a, b) => b.nearestPlayerDistSq - a.nearestPlayerDistSq);
  if (fallback.length > 0) return fallback[offset % fallback.length].point;

  scored.sort((a, b) => b.nearestPlayerDistSq - a.nearestPlayerDistSq);
  return scored[0].point;
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

function forceGauntletAggro(world: World, monster: MonsterEntity): void {
  const target = nearestLivePlayer(world, monster.hasPosition.nodeId, monster.hasPosition.current);
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
  const now = Date.now();
  setAggroTarget(world, monster, { id: target.isPlayer.id, kind: "player" }, now);
  setAttackTarget(world, monster, target.isPlayer.id);
}

function maintainGauntletAggro(world: World, state: GauntletState): void {
  for (const id of state.activeMonsterIds) {
    const monster = world.getMonsterEntity(id);
    if (monster) forceGauntletAggro(world, monster);
  }
  if (state.bossMonsterId) {
    const boss = world.getMonsterEntity(state.bossMonsterId);
    if (boss) forceGauntletAggro(world, boss);
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

function bossSpawnCandidates(
  def: DungeonGauntletDef,
  authoredPoint: Vec2,
): Vec2[] {
  const candidates = [clampToNode(authoredPoint)];
  for (const radius of [260, 420]) {
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8 - Math.PI / 2;
      candidates.push(clampToNode({
        x: def.altar.x + Math.cos(angle) * radius,
        y: def.altar.y + Math.sin(angle) * radius,
      }));
    }
  }
  return candidates;
}

function pickWeightedMonster(phase: GauntletPhaseDef): string | null {
  const total = phase.monsterPool.reduce((sum, entry) => sum + Math.max(0, entry.weight), 0);
  if (total <= 0) return phase.monsterPool[0]?.monsterId ?? null;
  let roll = Math.random() * total;
  for (const entry of phase.monsterPool) {
    roll -= Math.max(0, entry.weight);
    if (roll <= 0) return entry.monsterId;
  }
  return phase.monsterPool[phase.monsterPool.length - 1]?.monsterId ?? null;
}

function isNearAltar(player: PlayerEntity, def: DungeonGauntletDef): boolean {
  return distanceSq(player.hasPosition.current, def.altar) <=
    def.altar.activationRadius * def.altar.activationRadius;
}

function markGauntletParticipant(
  world: World,
  nodeId: string,
  playerId: string,
): void {
  const state = world.gauntlets.get(nodeId);
  if (!state) return;
  if (state.status !== "active" && state.status !== "boss") return;
  state.participantPlayerIds.add(playerId);
}

function currentPhaseLabel(
  def: DungeonGauntletDef,
  state: GauntletState,
): string | undefined {
  if (state.status === "idle") return "Guardians";
  if (state.status === "bossAwakening") return "Boss awakening";
  if (state.status === "boss") {
    return MONSTER_DATABASE.get(def.boss.bossId)?.name ?? "Boss";
  }
  if (state.phaseIndex === 0) return def.guardianPhase.label;
  return def.phases[state.phaseIndex - 1]?.label;
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

function pushGauntletMessage(world: World, nodeId: string, message: string): void {
  recordWorldLogEvent(
    world,
    {
      kind: "dungeon-message",
      nodeId,
      message,
    },
    {
      visibility: "node",
      relatedPlayerIds: [],
      nodeId,
    },
  );
}
