import {
  applyStatusEffect,
  GAME_CONFIG,
  MONSTER_DATABASE,
  distanceSq,
  getDungeonGauntletDef,
  isGauntletDungeonNode,
  BIOME_GUARDIAN_NAMES,
  BIOME_GAUNTLET_MESSAGES,
  DEFAULT_UNCLEARED_THREAT,
  PRE_ENCOUNTER_AURA_EFFECT_ID,
  type DungeonGauntletDef,
  type DungeonGauntletView,
  type DungeonMonsterModifiers,
  type DungeonBossRotPoolDef,
  type PreEncounterGroupDef,
  type PreEncounterPackDef,
  type PreEncounterBasinDef,
  type GauntletPhaseDef,
  type UnclearedThreatEffect,
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
  /**
   * T1 pre-encounter threats that fight alongside the boss, plus any extra adds
   * spawned by an uncleared-threat hook. They never gate the boss, so they are tracked
   * separately from the wave-gating `activeMonsterIds` (which the boss/awakening
   * transitions reset).
   */
  preEncounterThreatIds: string[];
  /** Counted guardians left alive when a T1 altar was activated (drives the boss hook). */
  unclearedThreatCount: number;
  temporaryHazards: RuntimeDungeonHazard[];
  nextBossHazardAtMs?: number;
  hazardSeq: number;
  bossMonsterId?: string;
  participantPlayerIds: Set<string>;
  startedAtMs?: number;
  startedByPlayerId?: string;
  bossAwakensAtMs?: number;
  cooldownEndsAtMs?: number;
  lastIdleGuardianKillAtMs?: number;
}

interface RuntimeDungeonHazard {
  id: string;
  kind: "rot-pool";
  pos: Vec2;
  radius: number;
  expiresAtMs: number;
  damagePerTick: number;
  tickIntervalMs: number;
  slowSpeedMult?: number;
  tickTimersByPlayerId: Map<string, number>;
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
    preEncounterThreatIds: [],
    unclearedThreatCount: 0,
    temporaryHazards: [],
    hazardSeq: 0,
    participantPlayerIds: new Set(),
  };
}

/**
 * T1 dungeons are "pre-encounter + boss": no gauntlet wave system. Higher tiers
 * keep the existing multi-phase wave behavior.
 */
function isPreEncounterDungeon(def: DungeonGauntletDef): boolean {
  return def.biomeTier === 1;
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
    despawnIds(world, existing.preEncounterThreatIds);
    existing.temporaryHazards = [];
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
      maintainGauntletAggro(world, state);
      if (state.bossAwakensAtMs === undefined) {
        state.bossAwakensAtMs = now + def.bossAwakeningDelayMs;
      }
      if (now >= state.bossAwakensAtMs) {
        spawnGauntletBoss(world, def, state);
      }
      continue;
    }

    tickTemporaryHazards(world, def, state, now);

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

    if (state.status === "boss") {
      tickBossAuthoredHazards(world, def, state, now);
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

  if (isPreEncounterDungeon(def)) {
    beginPreEncounterBoss(world, def, state);
  } else {
    convertSurvivingGuardians(world, def, state);
  }
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

  if (dungeon.source === "preEncounterThreat") {
    // Optional kills: they never gate the boss and grant only their normal
    // monster rewards (no bonus for leaving them, no respawn suppression).
    removeId(state.preEncounterThreatIds, monster.isMonster.id);
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
      guardianTotal: preEncounterTotal(def),
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
    guardianTotal: preEncounterTotal(def),
    phaseIndex: state.phaseIndex,
    phaseLabel: currentPhaseLabel(def, state),
    killsInPhase: state.killsInPhase,
    requiredKillsForCurrentPhase: state.requiredKillsForCurrentPhase,
    guardianMonsterIds: state.idleGuardianIds.filter((id) => world.hasMonster(id)),
    activeMonsterIds: [...state.activeMonsterIds, ...state.preEncounterThreatIds]
      .filter((id) => world.hasMonster(id)),
    unclearedThreatMode: isPreEncounterDungeon(def)
      ? unclearedThreatFor(def).mode
      : undefined,
    unclearedThreatCount: state.unclearedThreatCount,
    preEncounterLabel: def.preEncounter?.label,
    temporaryHazards: state.temporaryHazards.map((hazard) => ({
      id: hazard.id,
      kind: hazard.kind,
      x: hazard.pos.x,
      y: hazard.pos.y,
      radius: hazard.radius,
      expiresAtMs: hazard.expiresAtMs,
      remainingMs: Math.max(0, hazard.expiresAtMs - now),
    })),
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

function preEncounterTotal(def: DungeonGauntletDef): number {
  if (!def.preEncounter) return def.guardianPhase.requiredKills;
  return def.preEncounter.groups.reduce((total, group) => {
    if (group.kind === "basin") return total + 1;
    return total + 1 + (group.followers ?? []).reduce((sum, follower) => sum + follower.count, 0);
  }, 0);
}

export function initDungeonGauntletCombatHooks(): void {
  registerCombatListener("onHit", (ctx, world) => {
    if (ctx.attackerType !== "monster") return;
    const dungeon = ctx.attacker.tracksDungeon;
    const aura = dungeon?.preEncounterAura;
    if (!dungeon || !aura) return;
    if (aura.kind !== "damage") return;
    if (!hasLivingAuraSourceNearby(world, ctx.attacker, dungeon, aura.range)) return;
    ctx.damage = Math.max(0, Math.round(ctx.damage * aura.mult));
    ctx.metadata["dungeonAura"] = "preEncounter";
  });

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
  if (def.preEncounter) {
    spawnAuthoredPreEncounter(world, def, state);
    return;
  }
  const phase = def.guardianPhase;
  if (phase.den) {
    spawnDungeonDen(world, def, state, phase, phase.den.alphaMonsterId);
    return;
  }
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

function spawnAuthoredPreEncounter(
  world: World,
  def: DungeonGauntletDef,
  state: GauntletState,
): void {
  for (const group of def.preEncounter?.groups ?? []) {
    if (group.kind === "pack") {
      spawnPreEncounterPack(world, def, state, group);
    } else {
      spawnPreEncounterBasin(world, def, state, group);
    }
  }
}

function spawnPreEncounterPack(
  world: World,
  def: DungeonGauntletDef,
  state: GauntletState,
  group: PreEncounterPackDef,
): void {
  const anchor = clampToNode(group.anchor);
  const packId = `${def.nodeId}:pre:${group.id}`;
  const leader = spawnPreEncounterMonster(world, def, group.leaderMonsterId, anchor, group, "leader");
  if (!leader) return;
  world.ecs.addComponent(leader, "inPack", { packId, role: "alpha" });
  if (group.leaderModifiers) applyDungeonModifiers(leader, group.leaderModifiers);
  if (group.leaderName) leader.isMonster.name = group.leaderName;
  if (group.patrolOverride) leader.controlsMonster.patrolOverride = group.patrolOverride;
  if (group.aura && leader.tracksDungeon) {
    leader.tracksDungeon.preEncounterAura = group.aura;
    applyAuraIndicator(leader);
  }
  markPreEncounterSlicesDirty(world, leader);
  state.idleGuardianIds.push(leader.isMonster.id);

  const followers = group.followers ?? [];
  const total = followers.reduce((sum, f) => sum + f.count, 0);
  let index = 0;
  for (const follower of followers) {
    for (let i = 0; i < follower.count; i++) {
      const point = followerPoint(anchor, index, Math.max(1, total));
      const monster = spawnPreEncounterMonster(
        world,
        def,
        follower.monsterId,
        point,
        group,
        "follower",
      );
      index++;
      if (!monster) continue;
      world.ecs.addComponent(monster, "inPack", { packId, role: "follower" });
      if (group.followerModifiers) applyDungeonModifiers(monster, group.followerModifiers);
      if (group.aura && monster.tracksDungeon) monster.tracksDungeon.preEncounterAura = group.aura;
      markPreEncounterSlicesDirty(world, monster);
      state.idleGuardianIds.push(monster.isMonster.id);
    }
  }
}

/**
 * Stamp a permanent display-only "Rally" buff on an aura SOURCE so the HUD target
 * frame shows it is empowering its allies (reuses the `targetStatus` mirror — no new
 * networked field). Purely cosmetic; the aura mechanic rides `preEncounterAura`.
 */
function applyAuraIndicator(source: MonsterEntity): void {
  if (!source.tracksCombat) return;
  applyStatusEffect(source.tracksCombat, {
    id: PRE_ENCOUNTER_AURA_EFFECT_ID,
    maxStacks: 1,
    remainingMs: -1,
    sourceId: source.isMonster.id,
  });
}

function spawnPreEncounterBasin(
  world: World,
  def: DungeonGauntletDef,
  state: GauntletState,
  group: PreEncounterBasinDef,
): void {
  const anchor = clampToNode(group.anchor);
  const keeper = spawnPreEncounterMonster(
    world,
    def,
    group.keeperMonsterId,
    anchor,
    group,
    "keeper",
  );
  if (!keeper) return;
  if (group.keeperModifiers) applyDungeonModifiers(keeper, group.keeperModifiers);
  if (group.keeperName) keeper.isMonster.name = group.keeperName;
  markPreEncounterSlicesDirty(world, keeper);
  state.idleGuardianIds.push(keeper.isMonster.id);
}

function spawnPreEncounterMonster(
  world: World,
  def: DungeonGauntletDef,
  monsterId: string,
  point: Vec2,
  group: PreEncounterGroupDef,
  role: "leader" | "follower" | "keeper",
): MonsterEntity | null {
  const post = clampToNode(point);
  const monster = world.createMonster(def.nodeId, monsterId, post);
  if (!monster) return null;
  const safePost = { ...monster.hasPosition.current };
  const leashRadius = group.leashRadius ?? GUARDIAN_LEASH_RADIUS;
  monster.tracksDungeon = {
    source: "idleDungeonGuardian",
    dungeonNodeId: def.nodeId,
    gauntletPhaseIndex: 0,
    gauntletPhaseId: def.preEncounter?.id ?? def.guardianPhase.id,
    preEncounterGroupId: group.id,
    preEncounterRole: role,
    guardPost: safePost,
    leashRadius,
  };
  monster.controlsMonster.spawn = safePost;
  monster.controlsMonster.wanderRadius = group.localWanderRadius ?? 0;
  monster.controlsMonster.leashRange = leashRadius;
  monster.hasAwareness.leashRange = leashRadius;
  monster.hasAwareness.pullRange = Math.min(
    monster.hasAwareness.pullRange,
    group.pullRange ?? IDLE_GUARDIAN_PULL_RANGE,
  );
  return monster;
}

function markPreEncounterSlicesDirty(world: World, monster: MonsterEntity): void {
  markSliceDirty(world, monster, "isMonster");
  markSliceDirty(world, monster, "hasHealth");
  markSliceDirty(world, monster, "dealsDamage");
  markSliceDirty(world, monster, "performsAttack");
  markSliceDirty(world, monster, "mitigatesDamage");
  markSliceDirty(world, monster, "hasAwareness");
}

function followerPoint(anchor: Vec2, index: number, total: number): Vec2 {
  const radius = 70;
  const angle = (Math.PI * 2 * index) / total;
  return clampToNode({
    x: anchor.x + Math.cos(angle) * radius,
    y: anchor.y + Math.sin(angle) * radius,
  });
}

/**
 * Spawn a single pre-encounter den: one pack alpha plus its authored followers,
 * clustered at a den anchor. All members are tagged idle guardians (so the
 * clear/activation logic treats the whole den as the pre-threat), but only the
 * ALPHA gets the guardian buff + guardian name — it is the main danger, the
 * followers are modest bodies. The pack keeps its `inPack` link, so the existing
 * call-allies behavior makes the den pounce together when engaged.
 */
function spawnDungeonDen(
  world: World,
  def: DungeonGauntletDef,
  state: GauntletState,
  phase: GauntletPhaseDef,
  alphaMonsterId: string,
): void {
  const anchor = denAnchor(def);
  const members = world.spawnPack(def.nodeId, alphaMonsterId, anchor);
  if (!members || members.length === 0) return;

  members.forEach((monster, index) => {
    const isAlpha = index === 0; // spawnPack returns the alpha first
    const post = { ...monster.hasPosition.current };
    monster.tracksDungeon = {
      source: "idleDungeonGuardian",
      dungeonNodeId: def.nodeId,
      gauntletPhaseIndex: 0,
      gauntletPhaseId: phase.id,
      guardPost: post,
      leashRadius: GUARDIAN_LEASH_RADIUS,
    };
    monster.controlsMonster.spawn = post;
    monster.controlsMonster.wanderRadius = 0;
    monster.controlsMonster.leashRange = GUARDIAN_LEASH_RADIUS;
    monster.hasAwareness.leashRange = GUARDIAN_LEASH_RADIUS;
    monster.hasAwareness.pullRange = Math.min(
      monster.hasAwareness.pullRange,
      IDLE_GUARDIAN_PULL_RANGE,
    );
    if (isAlpha) {
      applyDungeonModifiers(monster, phase.modifiers);
      monster.isMonster.name = BIOME_GUARDIAN_NAMES[def.biomeGroup]
        ?? `${def.biomeGroup[0].toUpperCase()}${def.biomeGroup.slice(1)} Guardian`;
    }
    markSliceDirty(world, monster, "isMonster");
    markSliceDirty(world, monster, "hasHealth");
    markSliceDirty(world, monster, "dealsDamage");
    markSliceDirty(world, monster, "performsAttack");
    markSliceDirty(world, monster, "mitigatesDamage");
    state.idleGuardianIds.push(monster.isMonster.id);
  });
}

function denAnchor(def: DungeonGauntletDef): Vec2 {
  // A single den location offset from the altar (across the arena), so the player
  // can choose to clear it before walking back to activate.
  const radius = 360;
  return clampToNode({ x: def.altar.x, y: def.altar.y - radius });
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
  monster.controlsMonster.spawn = { ...monster.hasPosition.current };
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

/**
 * T1 activation: there are no waves. Any guardian still alive immediately joins
 * the fight as an optional threat while the boss awakening starts. The authored
 * uncleared-threat hook still counts only the biome's chosen role, so callers,
 * keepers, and alphas can feed boss pressure without despawning the rest of the
 * map encounter.
 */
function beginPreEncounterBoss(
  world: World,
  def: DungeonGauntletDef,
  state: GauntletState,
): void {
  const surviving = state.idleGuardianIds
    .map((id) => world.getMonsterEntity(id))
    .filter((m): m is MonsterEntity => !!m);
  state.idleGuardianIds = [];
  const threatSurvivors = preEncounterThreatSurvivors(def, surviving);
  state.unclearedThreatCount = threatSurvivors.length;

  const activationMsg = BIOME_GAUNTLET_MESSAGES[def.biomeGroup]?.activation ?? "The guardians awaken.";
  pushGauntletMessage(world, def.nodeId, activationMsg);

  // Awaken the boss first; this resets the wave-gating state. Pre-encounter
  // threats are tracked separately so they survive that reset.
  startBossAwakening(world, def, state);

  if (surviving.length > 0) {
    // The guardians keep their loot and never gate the boss; killing them stays
    // optional while the countdown continues.
    for (const monster of surviving) {
      monster.tracksDungeon = {
        ...monster.tracksDungeon,
        source: "preEncounterThreat",
        dungeonNodeId: def.nodeId,
        guardPost: monster.tracksDungeon?.guardPost,
        leashRadius: ACTIVE_LEASH_RADIUS,
      };
      monster.controlsMonster.leashRange = ACTIVE_LEASH_RADIUS;
      monster.hasAwareness.leashRange = ACTIVE_LEASH_RADIUS;
      forceGauntletAggro(world, monster);
      state.preEncounterThreatIds.push(monster.isMonster.id);
    }
  }
}

function preEncounterThreatSurvivors(
  def: DungeonGauntletDef,
  surviving: MonsterEntity[],
): MonsterEntity[] {
  const role = def.preEncounter?.unclearedRole;
  if (!role) return surviving;
  return surviving.filter(
    (monster) => monster.tracksDungeon?.preEncounterRole === role,
  );
}

function unclearedThreatFor(def: DungeonGauntletDef): UnclearedThreatEffect {
  return def.unclearedThreat ?? DEFAULT_UNCLEARED_THREAT;
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
  applyUnclearedThreatToBoss(world, def, state, boss);
  const bossName = MONSTER_DATABASE.get(def.boss.bossId)?.name ?? "The boss";
  pushGauntletMessage(world, def.nodeId, `${bossName} awakens.`);
}

/**
 * Apply the T1 uncleared-threat hook to a freshly spawned boss. All surviving
 * guardians already fight on; the remaining modes add boss pressure from the
 * counted survivor total here.
 */
function applyUnclearedThreatToBoss(
  world: World,
  def: DungeonGauntletDef,
  state: GauntletState,
  boss: MonsterEntity,
): void {
  const count = state.unclearedThreatCount;
  if (count <= 0) return;
  const effect = unclearedThreatFor(def);

  switch (effect.mode) {
    case "join":
      return;
    case "empower": {
      const per = effect.empowerPerGuardian ?? {};
      applyDungeonModifiers(boss, {
        hpMult: per.hpMult ? 1 + per.hpMult * count : undefined,
        atkMult: per.atkMult ? 1 + per.atkMult * count : undefined,
        attackSpeedMult: per.attackSpeedMult ? 1 + per.attackSpeedMult * count : undefined,
        drAdd: per.drAdd ? per.drAdd * count : undefined,
      });
      markSliceDirty(world, boss, "hasHealth");
      markSliceDirty(world, boss, "dealsDamage");
      markSliceDirty(world, boss, "performsAttack");
      markSliceDirty(world, boss, "mitigatesDamage");
      pushGauntletMessage(
        world,
        def.nodeId,
        "The unguarded power flows into the boss.",
      );
      return;
    }
    case "extra-adds": {
      const perGuardian = Math.max(0, Math.floor(effect.extraAddsPerGuardian ?? 1));
      const cap = effect.maxExtraAdds ?? Number.POSITIVE_INFINITY;
      const total = Math.min(perGuardian * count, cap);
      if (total <= 0) return;
      spawnPreEncounterAdds(world, def, state, total);
      pushGauntletMessage(world, def.nodeId, "Unguarded foes rush the altar.");
      return;
    }
    case "hazard": {
      if (effect.hazardId === "swamp-rot-basin" && def.preEncounter?.bossRotPools) {
        spawnRotPoolsNearBoss(world, def, state, boss, count, def.preEncounter.bossRotPools);
      }
      pushGauntletMessage(world, def.nodeId, "The unguarded altar grows perilous.");
      return;
    }
  }
}

function tickBossAuthoredHazards(
  world: World,
  def: DungeonGauntletDef,
  state: GauntletState,
  now: number,
): void {
  const config = def.preEncounter?.bossRotPools;
  if (!config || !state.bossMonsterId) return;
  const boss = world.getMonsterEntity(state.bossMonsterId);
  if (!boss) return;
  if (state.nextBossHazardAtMs === undefined) {
    state.nextBossHazardAtMs = now + (config.initialDelayMs ?? config.intervalMs);
    return;
  }
  if (now < state.nextBossHazardAtMs) return;
  spawnRotPoolsNearBoss(world, def, state, boss, 1, config);
  state.nextBossHazardAtMs = now + config.intervalMs;
}

function spawnRotPoolsNearBoss(
  world: World,
  def: DungeonGauntletDef,
  state: GauntletState,
  boss: MonsterEntity,
  count: number,
  config: DungeonBossRotPoolDef,
): void {
  pruneExpiredHazards(state, Date.now());
  const existing = state.temporaryHazards.filter((h) => h.kind === "rot-pool").length;
  const budget = Math.min(count, Math.max(0, config.maxAlive - existing));
  for (let i = 0; i < budget; i++) {
    // Aim the pool at a player: drop it on a live target's position (nearest to
    // the boss) so it pressures where the player stands, not a random spot. With
    // no target, fall back to a random pool around the boss.
    const target = nearestLivePlayerToBoss(world, def, boss);
    let pos: Vec2;
    if (target) {
      const jitter = config.radius * 0.5;
      pos = clampToNode({
        x: target.hasPosition.current.x + (Math.random() * 2 - 1) * jitter,
        y: target.hasPosition.current.y + (Math.random() * 2 - 1) * jitter,
      });
    } else {
      const angle = Math.random() * Math.PI * 2;
      const dist = 170 + Math.random() * 170;
      pos = clampToNode({
        x: boss.hasPosition.current.x + Math.cos(angle) * dist,
        y: boss.hasPosition.current.y + Math.sin(angle) * dist,
      });
    }
    state.temporaryHazards.push({
      id: `${def.nodeId}:rot:${state.hazardSeq++}`,
      kind: "rot-pool",
      pos,
      radius: config.radius,
      expiresAtMs: Date.now() + config.durationMs,
      damagePerTick: config.damagePerTick,
      tickIntervalMs: config.tickIntervalMs,
      slowSpeedMult: config.slowSpeedMult,
      tickTimersByPlayerId: new Map(),
    });
  }
}

function nearestLivePlayerToBoss(
  world: World,
  def: DungeonGauntletDef,
  boss: MonsterEntity,
): PlayerEntity | undefined {
  let nearest: PlayerEntity | undefined;
  let nearestSq = Infinity;
  for (const player of world.livePlayersInNode(def.nodeId)) {
    const distSq = distanceSq(player.hasPosition.current, boss.hasPosition.current);
    if (distSq < nearestSq) {
      nearestSq = distSq;
      nearest = player;
    }
  }
  return nearest;
}

function tickTemporaryHazards(
  world: World,
  def: DungeonGauntletDef,
  state: GauntletState,
  now: number,
): void {
  pruneExpiredHazards(state, now);
  if (state.temporaryHazards.length === 0) return;
  for (const hazard of state.temporaryHazards) {
    if (hazard.kind !== "rot-pool") continue;
    tickRotPool(world, def, hazard);
  }
}

function pruneExpiredHazards(state: GauntletState, now: number): void {
  state.temporaryHazards = state.temporaryHazards.filter((hazard) => hazard.expiresAtMs > now);
}

function tickRotPool(
  world: World,
  def: DungeonGauntletDef,
  hazard: RuntimeDungeonHazard,
): void {
  const radiusSq = hazard.radius * hazard.radius;
  const now = Date.now();
  for (const player of world.livePlayersInNode(def.nodeId)) {
    if (distanceSq(player.hasPosition.current, hazard.pos) > radiusSq) continue;
    if (hazard.slowSpeedMult !== undefined) {
      applyStatusEffect(player.tracksCombat, {
        id: "slow",
        maxStacks: 1,
        instanced: false,
        sourceId: `dungeon-hazard:${hazard.id}`,
        remainingMs: 1_200,
        refreshable: true,
        data: { speedMult: hazard.slowSpeedMult, totalMs: 1_200 },
      });
    }
    const nextAt = hazard.tickTimersByPlayerId.get(player.isPlayer.id) ?? now;
    if (now < nextAt) continue;
    hazard.tickTimersByPlayerId.set(player.isPlayer.id, now + hazard.tickIntervalMs);
    player.hasHealth.hp -= hazard.damagePerTick;
    markSliceDirty(world, player, "hasHealth");
    world.pushEvent(def.nodeId, {
      kind: "dot-tick",
      targetId: player.isPlayer.id,
      targetPos: { ...player.hasPosition.current },
      amount: hazard.damagePerTick,
      element: "poison",
      sourceType: "special",
    });
    if (player.hasHealth.hp <= 0) {
      world.killPlayer(player.isPlayer.id, {
        kind: "dot",
        killer: {
          monsterTypeId: def.boss.bossId,
          monsterName: MONSTER_DATABASE.get(def.boss.bossId)?.name ?? "Dungeon rot",
          isBoss: true,
          nodeId: def.nodeId,
        },
        damage: hazard.damagePerTick,
        stacks: 1,
      });
    }
  }
}

function spawnPreEncounterAdds(
  world: World,
  def: DungeonGauntletDef,
  state: GauntletState,
  total: number,
): void {
  const phase = def.guardianPhase;
  const points = resolveSpawnPoints(def, phase);
  for (let i = 0; i < total; i++) {
    const point = selectGauntletSpawnPoint(world, def.nodeId, points, i);
    const monster = spawnDungeonMonster(world, def.nodeId, phase, point, {
      source: "preEncounterThreat",
      dungeonNodeId: def.nodeId,
      leashRadius: ACTIVE_LEASH_RADIUS,
    });
    if (!monster) continue;
    forceGauntletAggro(world, monster);
    state.preEncounterThreatIds.push(monster.isMonster.id);
  }
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
  // The trial is over: clear out any lingering pre-encounter threats.
  despawnIds(world, state.preEncounterThreatIds);
  state.preEncounterThreatIds = [];
  state.unclearedThreatCount = 0;
  state.temporaryHazards = [];
  state.nextBossHazardAtMs = undefined;
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
  for (const id of state.preEncounterThreatIds) {
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

function hasLivingAuraSourceNearby(
  world: World,
  monster: MonsterEntity,
  dungeon: TracksDungeon,
  range: number,
): boolean {
  if (dungeon.preEncounterRole === "leader" || dungeon.preEncounterRole === "keeper") {
    return true;
  }
  if (!dungeon.preEncounterGroupId) return false;
  const rangeSq = range * range;
  for (const other of world.monsterEntitiesInNode(monster.hasPosition.nodeId)) {
    if (other === monster) continue;
    const od = other.tracksDungeon;
    if (!od?.preEncounterAura) continue;
    if (od.preEncounterGroupId !== dungeon.preEncounterGroupId) continue;
    if (od.preEncounterRole !== "leader" && od.preEncounterRole !== "keeper") continue;
    if (other.hasHealth.hp <= 0) continue;
    if (distanceSq(other.hasPosition.current, monster.hasPosition.current) <= rangeSq) {
      return true;
    }
  }
  return false;
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
  if (
    state.status !== "active" &&
    state.status !== "bossAwakening" &&
    state.status !== "boss"
  ) return;
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
