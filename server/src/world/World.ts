import { CollisionIndex } from "./collision/CollisionIndex";
import type {
  NodeDefinition,
  CombatEvent,
  DeltaSnapshot,
  PlayerDeathPayload,
  WorldLogEvent,
  BossFelledMarker,
} from "@mmo-idle/shared";
import {
  BIOME_DATABASE,
  GAME_CONFIG,
  NODE_BIOMES,
  NODE_MODIFIERS,
  modifierSpawnFactor,
  CLEARING_NODE_ID,
  TEST_ROOM_NODE_ID,
  type DeathCause,
  type NetworkedComponentKey,
  type Vec2,
} from "@mmo-idle/shared";

/**
 * Per-broadcast delta state for one node. Maps each known entity's network id to
 * the JSON-serialized, wire-quantized value of every networked slice last sent
 * for that entity. The encoder diffs current values against these to send only
 * slices that actually changed (value-diff). An entry's presence also marks the
 * entity as a current member of the node's delta stream.
 */
export type NodeSentSlices = Map<NetworkedComponentKey, string>;
export type NodeDeltaState = Map<string, NodeSentSlices>;
import { updateAutoTargets } from "../systems/combat/ai/autoTarget";
import { updateRuneDerivedConfig } from "../systems/combat/ai/runeConfig";
import { updateAbilityFiring, updateAbilityHealing } from "../systems/player/abilities/abilityFiring";
import { updateAbilityCasts } from "../systems/player/abilities/abilityCasting";
import { updateStanceSwitch } from "../systems/player/stances/stanceSwitch";
import { updateCombatTransitions } from "../systems/combat/ai/engagement";
import { updateAutoTraverse } from "../systems/world/autoTraverse";
import { updateAutoIntent } from "../systems/world/autoIntent";
import { updateExpiredEmotes } from "../systems/player/emotes";
import { updatePartyFollow } from "../systems/world/partyFollow";
import { updateMovement } from "../systems/world/movement";
import { updateMobilityState } from "../systems/world/mobility/mobilityBoots";
import { updateNodeFeatures } from "../systems/world/nodeFeatures";
import {
  updateGroundZones,
  type RuntimeGroundZone,
} from "../systems/world/groundZones";
import {
  updateCorpses,
  type RuntimeCorpse,
} from "../systems/world/corpses";
import { updateMonsters } from "../systems/combat/ai/ai";
import { updatePacks } from "../systems/combat/ai/packs";
import { updateRaisers } from "../systems/combat/ai/raiseDead";
import { updateSwarm } from "../systems/combat/ai/swarm";
import { updateCombat } from "../systems/combat/engine/combat";
import { updateTransitions } from "../systems/world/transitions";
import { updateCombatState } from "../systems/combat/engine/combatState";
import { tickAllMechanics } from "../systems/classes/registry";
import { updateWeaponEffects } from "../systems/combat/damage/weaponEffects";
import { updateBossScripts } from "../systems/combat/ai/bossScripts";
import { updateUltimateEncounters } from "../systems/combat/ai/ultimateEncounter";
import { updateWards, updateDefensiveSystems } from "../systems/defense";
import { updateKnockback } from "../systems/combat/damage/knockback";
import { syncPlayerBuffs } from "../systems/combat/buffs/buffSync";
import { mirrorHpForecast } from "../systems/defense/core/hpForecast";
import {
  createMonster as createMonsterInWorld,
  spawnPack as spawnPackInWorld,
  spawnMonster as spawnMonsterInWorld,
  respawnPlayer as respawnPlayerInWorld,
  killPlayer as killPlayerInWorld,
  updateDeadPlayers as updateDeadPlayersInWorld,
  ensurePopulation as ensurePopulationInWorld,
  ensureBoss as ensureBossInWorld,
} from "../systems/world/spawning";
import { updateTestRoomInteract } from "../systems/world/testRoomInteract";
import { NODE_REGISTRY } from "./nodeRegistry";
import { IS_DEV } from "../env";
import { createEcsWorld, type EcsWorld } from "../ecs/world";
import type {
  EntityId,
  MinionEntity,
  MonsterEntity,
  PlayerEntity,
} from "../ecs/entity";
import type { PersistedPlayerSlices } from "../db/playerRepo";
import { DirtyTracker, type DirtyDrain } from "../ecs/dirtyTracker";
import type { HasKnockback } from "../systems/combat/damage/knockback";
import * as monsterLifecycle from "./monsterLifecycle";
import * as minionLifecycle from "./minionLifecycle";
import * as playerLifecycle from "./playerLifecycle";
import {
  initTestRoom,
  ensureCurrentTestRoomBoss,
  ensureTrainingDummies,
} from "./testRoom";
import { buildNodeDelta } from "./nodeDelta";
import { NodeTelemetry, timeSync } from "../telemetry/nodeTelemetry";
import { POPULATION_INTERVAL_MS } from "../telemetry/constants";
import { freezeNode } from "./nodeLifecycle";
import {
  buildDungeonView,
  ensureDungeon,
  isDungeonNode,
  tickDungeons,
  type DungeonState,
} from "../systems/world/dungeons/dungeon";

export interface PendingDeath {
  playerId: string;
  payload: PlayerDeathPayload;
}

/** Client-facing boss death marker; drives the respawn countdown / void tomb. */
export interface BossRespawnMarker {
  monsterTypeId: string;
  pos: Vec2;
  respawnAt: number;
  durationMs: number;
}

/** A {@link BossRespawnMarker} tagged with its node, for persistence. */
export interface PersistedBossRespawn extends BossRespawnMarker {
  nodeId: string;
}

export class World {
  readonly nodeId: string;
  readonly node: NodeDefinition;

  /**
   * Authoritative miniplex world. Entity migration:
   *   S6 — empty scaffold
   *   S7 — monsters move in (MonsterEntity)
   *   S8 — players move in (PlayerEntity)
   */
  readonly ecs: EcsWorld = createEcsWorld();
  readonly collision = new CollisionIndex(this);

  readonly monsterEntities = this.ecs.with(
    "controlsMonster",
    "tracksCombat",
    "isMonster",
    "hasPosition",
    "hasHealth",
    "dealsDamage",
    "performsAttack",
    "mitigatesDamage",
    "hasAwareness",
    "hasStatus",
  );

  readonly knockbackedMonsters = this.monsterEntities.with("hasKnockback");
  readonly bossScriptedMonsters = this.monsterEntities.with("scriptsBoss");
  readonly ultimateMonsters = this.monsterEntities.with("scriptsUltimate");
  readonly movingMonsters = this.monsterEntities.with("isMoving");
  readonly aggroedMonsters = this.monsterEntities.with("hasAggroTarget");
  readonly detonatedMonsters = this.monsterEntities.with("hasDetonation");
  readonly hemorrhagedMonsters = this.monsterEntities.with("hasHemorrhage");
  readonly dottedMonsters = this.monsterEntities.with("hasDot");
  readonly conflagrationMonsters =
    this.monsterEntities.with("hasConflagration");
  readonly chilledMonsters = this.monsterEntities.with("hasChill");
  readonly frozenMonsters = this.monsterEntities.with("hasFrozen");
  readonly entropyMonsters = this.monsterEntities.with("hasEntropy");
  readonly weaponDotMonsters = this.monsterEntities.with("hasWeaponDot");
  readonly smolderMonsters = this.monsterEntities.with("hasSmolder");
  readonly dungeonMonsters = this.monsterEntities.with("tracksDungeon");

  /**
   * Canonical player query. All required slice components are stamped together
   * in `attachPlayerEntity`, so the return type matches `PlayerEntity`.
   */
  readonly playerEntities = this.ecs.with(
    "tracksCombat",
    "isPlayer",
    "hasPosition",
    "hasHealth",
    "dealsDamage",
    "performsAttack",
    "mitigatesDamage",
    "hasStatus",
    "usesAutocombat",
    "tracksProgression",
    "holdsInventory",
    "usesSkills",
  );

  /** Live players only — corpses excluded from gameplay ticks. */
  readonly livePlayers = this.playerEntities.without("isDead");
  /** Players awaiting respawn ack or server timeout. */
  readonly deadPlayers = this.playerEntities.with("isDead");

  readonly cadencePlayers = this.livePlayers.with("usesCadence");
  readonly energyPlayers = this.livePlayers.with("usesEnergy");
  readonly dotPlayers = this.livePlayers.with("appliesDots");
  readonly chillingPlayers = this.livePlayers.with("chillsTarget");
  readonly cooldownPlayers = this.livePlayers.with("usesCooldown");
  readonly summonerPlayers = this.livePlayers.with("summonsMinions");

  /**
   * Canonical minion query. All slices stamped together in
   * `spawnMinionForOwner`, so the return type matches `MinionEntity`.
   */
  readonly minionEntities = this.ecs.with(
    "isMinion",
    "controlsMinion",
    "hasPosition",
    "hasHitbox",
    "hasHealth",
    "dealsDamage",
    "performsAttack",
    "mitigatesDamage",
    "tracksCombat",
    "hasStatus",
  );
  readonly movingMinions = this.minionEntities.with("isMoving");
  readonly reloadPlayers = this.livePlayers.with("usesReload");
  readonly dottedPlayers = this.livePlayers.with("hasDot");
  readonly environmentallyDottedPlayers =
    this.livePlayers.with("hasEnvironmentalDot");
  readonly nodeFeatureEffectPlayers =
    this.livePlayers.with("hasNodeFeatureEffect");
  readonly movingPlayers = this.livePlayers.with("isMoving");
  readonly wardedPlayers = this.livePlayers.with("holdsWards");
  readonly channelingPlayers = this.cooldownPlayers.with("isChanneling");
  readonly overdrivenPlayers = this.cooldownPlayers.with("hasOverdrive");
  readonly alignedPlayers = this.cooldownPlayers.with("hasAlignment");
  /** Player deaths queued this tick. Drained by the server loop after each tick. */
  pendingDeaths: PendingDeath[] = [];
  /** Player IDs whose quest completion advanced their tier. Drained by the server loop. */
  pendingAscensions: string[] = [];
  /** Contributors on-node when the Void Overlord dies — drained for overlay emit. */
  pendingOverlordFelled: string[] = [];
  /** Dungeon boss respawn cooldowns keyed by node id. */
  bossRespawnAt = new Map<string, number>();
  /** Runtime-only dungeon guard/boss state keyed by node id. */
  dungeons = new Map<string, DungeonState>();
  /** Client-facing boss death markers keyed by node id. */
  bossRespawnMarkers = new Map<string, BossRespawnMarker>();
  /**
   * Runtime-only combat circles keyed by node id (telegraphed slams). Cleared on
   * node freeze and never persisted — same lifetime rule as monsters.
   */
  groundZones = new Map<string, RuntimeGroundZone[]>();
  /** Monotonic id source for ground zones. */
  groundZoneSeq = 0;
  /**
   * Runtime-only raisable corpses keyed by node id, newest last (ring buffer).
   * Same lifetime rule as monsters: TTL-swept, cleared on node freeze, never
   * persisted. Read by `raisesDead` necromancers.
   */
  corpses = new Map<string, RuntimeCorpse[]>();
  /**
   * Persist (marker) or clear (null) the server-global Void Overlord respawn
   * cooldown so it survives node freeze/thaw and server restarts. Set by
   * index.ts at boot; left null in benchmarks/tests (no DB).
   */
  overlordRespawnPersist: ((marker: PersistedBossRespawn | null) => void) | null =
    null;
  /** Broadcast active boss-felled markers to all clients (world map). Set by index.ts. */
  bossFelledBroadcast: (() => void) | null = null;
  /** Optional analytics hooks installed by the server entrypoint. */
  analyticsNodeTransition:
    | ((playerId: string, fromNodeId: string, toNodeId: string) => void)
    | null = null;
  analyticsPlayerDeath: ((playerId: string, nodeId: string) => void) | null = null;
  analyticsSkillUnlock:
    | ((playerId: string, skillId: string, path: string[]) => void)
    | null = null;
  analyticsProgression:
    | ((playerId: string, nodeId: string, progressionKind: string, value?: number) => void)
    | null = null;
  /** Generic NODE_FEATURES spawn runtime state keyed `${nodeId}:${featureId}`. */
  nodeFeatureSpawnState = new Map<
    string,
    { spawnedIds: string[]; nextSpawnAt: number }
  >();
  /** Suppressed feature blocks keyed `${nodeId}:${featureId}` (encounter toggles). */
  suppressedFeatureBlocks = new Set<string>();
  /** Queued combat events per node, flushed into each broadcast snapshot. */
  private nodeEvents = new Map<string, CombatEvent[]>();
  /** Runtime journal of all world log events (dev/debug). */
  worldLogJournal: WorldLogEvent[] = [];
  /** When set, caps journal length instead of {@link WORLD_LOG_JOURNAL_MAX} (bench fight logs). */
  worldLogJournalMax?: number;
  /** Per-player queues drained at broadcast tick. */
  worldLogByPlayer = new Map<string, WorldLogEvent[]>();
  nextWorldLogId = 1;
  /**
   * ID of the test-room boss that has been attacked by a player.
   * While set (and the boss still exists), the boss-rotation loop is paused so
   * the dummy doesn't get swapped out from under the player mid-test.
   * Cleared automatically when the engaged boss is no longer in the world.
   */
  testRoomEngagedBossId: string | null = null;
  /**
   * When true, skip the periodic ensurePopulation/ensureBoss loop in tick().
   * Set by the balance bench only so full-node clears can complete without repop.
   */
  suppressRepopulation = false;

  readonly nextMonsterIdByNode = new Map<string, number>();
  readonly nextMinionIdByOwner = new Map<string, number>();
  tickCounter = 0;
  readonly dirty = new DirtyTracker();
  readonly telemetry = new NodeTelemetry();
  readonly playersByNode = new Map<string, number>();
  readonly monstersByNode = new Map<string, number>();
  readonly bossesByNode = new Map<string, number>();
  readonly frozenNodes = new Set<string>();
  private populationCheckedAt = new Map<string, number>();

  /** Optional hook set by index.ts to emit node:preparing before cold thaw. */
  nodePreparingEmitter: ((playerId: string, nodeId: string) => void) | null =
    null;

  readonly playerById = new Map<EntityId, PlayerEntity>();
  readonly monsterById = new Map<EntityId, MonsterEntity>();
  readonly minionById = new Map<EntityId, MinionEntity>();
  private readonly nodeMembership = new Map<string, NodeDeltaState>();

  constructor(nodeId = CLEARING_NODE_ID) {
    const node = NODE_REGISTRY.get(nodeId);
    if (!node) throw new Error(`Unknown node id: "${nodeId}"`);
    this.nodeId = nodeId;
    this.node = node;
    this.wireEntityIndex();
    this.init();
  }

  private wireEntityIndex(): void {
    this.ecs.onEntityAdded.subscribe((entity) => {
      if (entity.isPlayer) {
        this.playerById.set(entity.entityId, entity as PlayerEntity);
      } else if (entity.isMonster) {
        this.monsterById.set(entity.entityId, entity as MonsterEntity);
      } else if (entity.isMinion) {
        this.minionById.set(entity.entityId, entity as MinionEntity);
      }
    });
    this.ecs.onEntityRemoved.subscribe((entity) => {
      this.playerById.delete(entity.entityId);
      this.monsterById.delete(entity.entityId);
      this.minionById.delete(entity.entityId);
    });
  }

  resetNodeDeltaState(nodeId: string): void {
    this.nodeMembership.delete(nodeId);
  }

  private init() {
    for (const nodeId of NODE_REGISTRY.keys()) {
      if (nodeId === TEST_ROOM_NODE_ID) continue;
      this.frozenNodes.add(nodeId);
    }

    if (IS_DEV) initTestRoom(this);
  }

  // ── SYSTEM ENTRY POINT ─────────────────────────────

  tick(dt: number, now: number) {
    this.tickCounter++;
    updateCombatState(this, dt);
    updateWards(this, dt);
    updateRuneDerivedConfig(this, now);
    tickAllMechanics(this, dt, now);
    updateWeaponEffects(this, dt);
    updateBossScripts(this, dt);
    updateUltimateEncounters(this, dt);
    updatePartyFollow(this, now);
    updateAutoTraverse(this);
    updateAutoTargets(this, now);
    updateAbilityFiring(this, now);
    // Advances wind-ups started above, so a cast that completes this tick lands
    // before combat resolves.
    updateAbilityCasts(this, now);
    updateStanceSwitch(this, dt, now);
    updateKnockback(this, dt);
    updateMobilityState(this, dt);
    updateMovement(this, dt, now);
    updateNodeFeatures(this, dt);
    updateGroundZones(this, now);
    updateCorpses(this, now);
    updateTransitions(this);
    if (IS_DEV) updateTestRoomInteract(this, now);
    updatePacks(this, now);
    updateRaisers(this, now);
    updateMonsters(this, dt, now);
    updateSwarm(this);
    updateCombat(this, dt, now);
    updateCombatTransitions(this, now);
    updateDefensiveSystems(this, dt, now);
    updateAbilityHealing(this, dt);
    syncPlayerBuffs(this, now);
    mirrorHpForecast(this);
    updateAutoIntent(this);
    updateExpiredEmotes(this, now);
    updateDeadPlayersInWorld(this, now);
    tickDungeons(this, now);

    if (IS_DEV) {
      ensureCurrentTestRoomBoss(this);
      ensureTrainingDummies(this);
    }

    if (!this.suppressRepopulation) {
      for (const nodeId of NODE_REGISTRY.keys()) {
        if (nodeId === TEST_ROOM_NODE_ID) continue;
        if (this.isNodeFrozen(nodeId)) continue;
        if (this.countPlayersInNode(nodeId) === 0) continue;

        const last = this.populationCheckedAt.get(nodeId) ?? 0;
        if (now - last < POPULATION_INTERVAL_MS) continue;
        this.populationCheckedAt.set(nodeId, now);

        const { ms } = timeSync(() => {
          if (isDungeonNode(nodeId)) {
            ensureDungeon(this, nodeId);
          } else {
            ensurePopulationInWorld(this, nodeId);
            ensureBossInWorld(this, nodeId);
          }
        });
        this.telemetry.recordPopulationMs(nodeId, ms, true);
      }
    }
  }

  // ── ENTITY MANAGEMENT (thin delegators to spawning / lifecycle modules) ─

  /**
   * Create a monster of the given type at `pos` in nodeId.
   * All stats and AI parameters come from MONSTER_DATABASE.
   * Returns null if the type ID is unknown.
   */
  createMonster(
    nodeId: string,
    typeId: string,
    pos: Vec2,
  ): MonsterEntity | null {
    return createMonsterInWorld(this, nodeId, typeId, pos);
  }

  /**
   * Spawn a coordinated pack (alpha + followers) clustered at `anchor`, sharing a
   * server-only `inPack` link. Returns the spawned members (alpha first) or null.
   */
  spawnPack(
    nodeId: string,
    alphaTypeId: string,
    anchor: Vec2,
  ): MonsterEntity[] | null {
    return spawnPackInWorld(this, nodeId, alphaTypeId, anchor);
  }

  getMonsterEntity(id: string): MonsterEntity | undefined {
    return monsterLifecycle.getMonsterEntity(this, id);
  }

  monsterEntitiesInNode(nodeId: string): IterableIterator<MonsterEntity> {
    return monsterLifecycle.monsterEntitiesInNode(this, nodeId);
  }

  hasMonster(id: string): boolean {
    return monsterLifecycle.hasMonster(this, id);
  }

  getMonsterKnockback(id: string): HasKnockback | undefined {
    return monsterLifecycle.getMonsterKnockback(this, id);
  }

  setMonsterKnockback(id: string, kb: HasKnockback): void {
    monsterLifecycle.setMonsterKnockback(this, id, kb);
  }

  clearMonsterKnockback(id: string): void {
    monsterLifecycle.clearMonsterKnockback(this, id);
  }

  removeMonsterEntity(id: string): void {
    monsterLifecycle.removeMonsterEntity(this, id);
  }

  // ── MINION LIFECYCLE (delegators) ──────────────────────────────
  getMinionEntity(id: string): MinionEntity | undefined {
    return minionLifecycle.getMinionEntity(this, id);
  }

  hasMinion(id: string): boolean {
    return minionLifecycle.hasMinion(this, id);
  }

  removeMinionEntity(id: string): void {
    minionLifecycle.removeMinionEntity(this, id);
  }

  minionEntitiesInNode(nodeId: string): IterableIterator<MinionEntity> {
    return minionLifecycle.minionEntitiesInNode(this, nodeId);
  }

  allocMinionId(ownerPlayerId: string): string {
    const next = (this.nextMinionIdByOwner.get(ownerPlayerId) ?? 0) + 1;
    this.nextMinionIdByOwner.set(ownerPlayerId, next);
    return `minion_${ownerPlayerId}-${next}`;
  }

  attachPlayerEntity(
    player: PersistedPlayerSlices,
    socketId: string,
  ): PlayerEntity {
    return playerLifecycle.attachPlayerEntity(this, player, socketId);
  }

  detachPlayerEntity(playerId: string): void {
    playerLifecycle.detachPlayerEntity(this, playerId);
  }

  getPlayerEntity(playerId: string): PlayerEntity | undefined {
    return playerLifecycle.getPlayerEntity(this, playerId);
  }

  playerEntitiesInNode(nodeId: string): IterableIterator<PlayerEntity> {
    return playerLifecycle.playerEntitiesInNode(this, nodeId);
  }

  livePlayersInNode(nodeId: string): IterableIterator<PlayerEntity> {
    return playerLifecycle.livePlayersInNode(this, nodeId);
  }

  hasPlayer(playerId: string): boolean {
    return playerLifecycle.hasPlayer(this, playerId);
  }

  playerCount(): number {
    return playerLifecycle.playerCount(this);
  }

  spawnMonster(nodeId: string): boolean {
    return spawnMonsterInWorld(this, nodeId);
  }

  killPlayer(playerId: string, cause: DeathCause): void {
    killPlayerInWorld(this, playerId, cause);
  }

  respawnPlayer(playerId: string): void {
    respawnPlayerInWorld(this, playerId);
  }

  ensurePopulation(nodeId: string): void {
    ensurePopulationInWorld(this, nodeId);
  }

  ensureBoss(nodeId: string): void {
    ensureBossInWorld(this, nodeId);
  }

  getMobDensity(nodeId: string): number {
    const biomeInfo = NODE_BIOMES[nodeId];
    const base =
      biomeInfo?.mobDensity !== undefined
        ? biomeInfo.mobDensity
        : (biomeInfo
            ? BIOME_DATABASE.get(biomeInfo.biomeGroup)?.mobDensity
            : undefined) ?? GAME_CONFIG.MONSTERS_PER_NODE;
    // Swarming and Dominion nodes reshape the POPULATION rather than the monsters:
    // this is the single seam where a node's target headcount is decided, so the
    // factor belongs here and nowhere else. Excluded nodes carry no modifier and
    // are therefore untouched. Never round a positive target down to zero — a
    // 1-monster node under Dominion must still spawn one.
    const factor = modifierSpawnFactor(NODE_MODIFIERS[nodeId]?.modifier);
    if (factor === 1 || base <= 0) return base;
    return Math.max(1, Math.round(base * factor));
  }

  // ── EVENTS ─────────────────────────────────────────

  pushEvent(nodeId: string, event: CombatEvent): void {
    let arr = this.nodeEvents.get(nodeId);
    if (!arr) {
      arr = [];
      this.nodeEvents.set(nodeId, arr);
    }
    arr.push(event);
  }

  /** Drain and return queued events for `nodeId`. Used by buildNodeDelta. */
  takeNodeEvents(nodeId: string): CombatEvent[] {
    const events = this.nodeEvents.get(nodeId) ?? [];
    this.nodeEvents.set(nodeId, []);
    return events;
  }

  clearNodeEvents(nodeId: string): void {
    this.nodeEvents.delete(nodeId);
  }

  adjustMonsterCount(nodeId: string, delta: number, isBoss: boolean): void {
    const map = isBoss ? this.bossesByNode : this.monstersByNode;
    const next = (map.get(nodeId) ?? 0) + delta;
    if (next <= 0) map.delete(nodeId);
    else map.set(nodeId, next);
  }

  allocMonsterId(nodeId: string): string {
    const next = (this.nextMonsterIdByNode.get(nodeId) ?? 0) + 1;
    this.nextMonsterIdByNode.set(nodeId, next);
    return `${nodeId}_monster-${next}`;
  }

  /** Rebuild monster count caches from live ECS state. */
  reconcileMonsterCounts(): void {
    this.monstersByNode.clear();
    this.bossesByNode.clear();
    for (const e of this.monsterEntities) {
      this.adjustMonsterCount(e.hasPosition.nodeId, 1, e.isMonster.isBoss);
    }
  }

  getMonsterCountInNode(nodeId: string): number {
    return this.monstersByNode.get(nodeId) ?? 0;
  }

  getBossCountInNode(nodeId: string): number {
    return this.bossesByNode.get(nodeId) ?? 0;
  }

  isNodeFrozen(nodeId: string): boolean {
    return this.frozenNodes.has(nodeId);
  }

  // ── NETWORK DELTA ──────────────────────────────────

  beginBroadcast(): DirtyDrain {
    return this.dirty.drain();
  }

  /** Lazily initialize and return the per-node delta state for `nodeId`. */
  getOrCreateNodeMembership(nodeId: string): NodeDeltaState {
    let members = this.nodeMembership.get(nodeId);
    if (!members) {
      members = new Map();
      this.nodeMembership.set(nodeId, members);
    }
    return members;
  }

  buildNodeDelta(
    nodeId: string,
    dirty: DirtyDrain,
    opts: { resync?: boolean } = {},
  ): DeltaSnapshot {
    return buildNodeDelta(this, nodeId, dirty, opts).snapshot;
  }

  buildNodeDeltaWithStats(
    nodeId: string,
    dirty: DirtyDrain,
    opts: { resync?: boolean } = {},
  ) {
    return buildNodeDelta(this, nodeId, dirty, opts);
  }

  buildBossFelledSnapshot(): BossFelledMarker[] {
    const now = Date.now();
    const markers: BossFelledMarker[] = [];
    for (const [nodeId, marker] of this.bossRespawnMarkers) {
      if (marker.respawnAt <= now) continue;
      markers.push({
        nodeId,
        monsterTypeId: marker.monsterTypeId,
        respawnAt: marker.respawnAt,
        durationMs: marker.durationMs,
      });
    }
    return markers;
  }

  broadcastBossFelledState(): void {
    this.bossFelledBroadcast?.();
  }

  buildDungeonView(nodeId: string) {
    return buildDungeonView(this, nodeId);
  }

  countPlayersInNode(nodeId: string): number {
    return this.playersByNode.get(nodeId) ?? 0;
  }

  incrementPlayersInNode(nodeId: string): void {
    this.playersByNode.set(nodeId, (this.playersByNode.get(nodeId) ?? 0) + 1);
  }

  decrementPlayersInNode(nodeId: string): void {
    const next = (this.playersByNode.get(nodeId) ?? 0) - 1;
    if (next <= 0) this.playersByNode.delete(nodeId);
    else this.playersByNode.set(nodeId, next);
  }

  movePlayerNode(fromNodeId: string, toNodeId: string, playerId?: string): void {
    const fromBefore = this.countPlayersInNode(fromNodeId);
    this.decrementPlayersInNode(fromNodeId);
    if (fromBefore === 1) freezeNode(this, fromNodeId);

    this.incrementPlayersInNode(toNodeId);
    if (playerId && fromNodeId !== toNodeId) {
      this.analyticsNodeTransition?.(playerId, fromNodeId, toNodeId);
    }
  }

  syncTelemetryOccupancy(): void {
    const playerCounts = new Map<string, number>();
    for (const nodeId of NODE_REGISTRY.keys()) {
      playerCounts.set(nodeId, 0);
    }
    for (const p of this.playerEntities) {
      const nodeId = p.hasPosition.nodeId;
      playerCounts.set(nodeId, (playerCounts.get(nodeId) ?? 0) + 1);
    }

    for (const nodeId of NODE_REGISTRY.keys()) {
      const players = playerCounts.get(nodeId) ?? 0;
      const monsters = this.getMonsterCountInNode(nodeId);
      const bosses = this.getBossCountInNode(nodeId);
      this.telemetry.syncOccupancy(nodeId, players, monsters, bosses);
      this.telemetry.syncFrozen(nodeId, this.isNodeFrozen(nodeId));
    }

    this.playersByNode.clear();
    for (const p of this.playerEntities) {
      this.incrementPlayersInNode(p.hasPosition.nodeId);
    }
  }

  // ── UTIL ────────────────────────────────────────────

  randInt(lo: number, hi: number) {
    return Math.floor(Math.random() * (hi - lo + 1)) + lo;
  }
}
