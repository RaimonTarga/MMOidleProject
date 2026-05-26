import type {
  NodeDefinition,
  CombatEvent,
  DeltaSnapshot,
} from "@mmo-idle/shared";
import {
  GAME_CONFIG,
  TEST_ROOM_NODE_ID,
  type Vec2,
} from "@mmo-idle/shared";
import { updateAutoTargets } from "../systems/combat/ai/autoTarget";
import { updateMovement } from "../systems/world/movement";
import { updateMonsters } from "../systems/combat/ai/ai";
import { updateCombat } from "../systems/combat/engine/combat";
import { updateTransitions } from "../systems/world/transitions";
import { updateCombatState } from "../systems/combat/engine/combatState";
import { tickAllMechanics } from "../systems/classes/registry";
import { updateWeaponEffects } from "../systems/combat/damage/weaponEffects";
import { updateBossScripts } from "../systems/combat/ai/bossScripts";
import {
  updateShields,
  updateDefensiveSystems,
} from "../systems/defense";
import { updateKnockback } from "../systems/combat/damage/knockback";
import { syncPlayerBuffs } from "../systems/combat/buffs/buffSync";
import {
  createMonster as createMonsterInWorld,
  spawnMonster as spawnMonsterInWorld,
  respawnPlayer as respawnPlayerInWorld,
  ensurePopulation as ensurePopulationInWorld,
  ensureBoss as ensureBossInWorld,
} from "../systems/world/spawning";
import { updateTestRoomInteract } from "../systems/world/testRoomInteract";
import { NODE_REGISTRY } from "./nodeRegistry";
import { IS_DEV } from "../env";
import { createEcsWorld, type EcsWorld } from "../ecs/world";
import type { MonsterEntity } from "../ecs/components/monster";
import type { PlayerEntity } from "../ecs/components/player";
import type { EntityId, ServerEntity } from "../ecs/entity";
import type { PersistedPlayerSlices } from "../db/playerRepo";
import { DirtyTracker, type DirtyDrain } from "../ecs/dirtyTracker";
import type { HasKnockback } from "../systems/combat/damage/knockback";
import * as monsterLifecycle from "./monsterLifecycle";
import * as playerLifecycle from "./playerLifecycle";
import {
  initTestRoom,
  ensureCurrentTestRoomBoss,
  ensureTrainingDummies,
} from "./testRoom";
import { buildNodeDelta } from "./nodeDelta";

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
  readonly ashbrandMonsters = this.monsterEntities.with("hasAshbrandBurn");

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
    "showsSacred",
  );

  readonly cadencePlayers = this.playerEntities.with("usesCadence");
  readonly energyPlayers = this.playerEntities.with("usesEnergy");
  readonly dotPlayers = this.playerEntities.with("appliesDots");
  readonly chillingPlayers = this.playerEntities.with("chillsTarget");
  readonly cooldownPlayers = this.playerEntities.with("usesCooldown");
  readonly reloadPlayers = this.playerEntities.with("usesReload");
  readonly dottedPlayers = this.playerEntities.with("hasDot");
  readonly movingPlayers = this.playerEntities.with("isMoving");
  readonly shieldedPlayers = this.playerEntities.with("holdsShields");
  readonly channelingPlayers = this.cooldownPlayers.with("isChanneling");
  readonly overdrivenPlayers = this.cooldownPlayers.with("hasOverdrive");
  readonly alignedPlayers = this.cooldownPlayers.with("hasAlignment");
  /** Player IDs that died this tick. Drained by the server loop after each tick. */
  pendingDeaths: string[] = [];
  /** Queued combat events per node, flushed into each broadcast snapshot. */
  private nodeEvents = new Map<string, CombatEvent[]>();
  /**
   * ID of the test-room boss that has been attacked by a player.
   * While set (and the boss still exists), the boss-rotation loop is paused so
   * the dummy doesn't get swapped out from under the player mid-test.
   * Cleared automatically when the engaged boss is no longer in the world.
   */
  testRoomEngagedBossId: string | null = null;

  nextMonsterId = 1;
  tickCounter = 0;
  readonly dirty = new DirtyTracker();

  private readonly entityIndex = new Map<EntityId, ServerEntity>();
  private readonly nodeMembership = new Map<string, Set<string>>();

  constructor(nodeId = "node-5-5") {
    const node = NODE_REGISTRY.get(nodeId);
    if (!node) throw new Error(`Unknown node id: "${nodeId}"`);
    this.nodeId = nodeId;
    this.node = node;
    this.wireEntityIndex();
    this.init();
  }

  private wireEntityIndex(): void {
    this.ecs.onEntityAdded.subscribe((entity) => {
      this.entityIndex.set(entity.entityId, entity);
    });
    this.ecs.onEntityRemoved.subscribe((entity) => {
      this.entityIndex.delete(entity.entityId);
    });
  }

  resetNodeDeltaState(nodeId: string): void {
    this.nodeMembership.delete(nodeId);
  }

  getEntity(id: EntityId): ServerEntity | undefined {
    return this.entityIndex.get(id);
  }

  private init() {
    for (const nodeId of NODE_REGISTRY.keys()) {
      if (nodeId === TEST_ROOM_NODE_ID) continue;
      for (let i = 0; i < GAME_CONFIG.MONSTERS_PER_NODE; i++) {
        this.spawnMonster(nodeId);
      }
      this.ensureBoss(nodeId);
    }

    if (IS_DEV) initTestRoom(this);
  }

  // ── SYSTEM ENTRY POINT ─────────────────────────────

  tick(dt: number, now: number) {
    this.tickCounter++;
    updateCombatState(this, dt);
    updateShields(this, dt);
    tickAllMechanics(this, dt, now);
    updateWeaponEffects(this, dt);
    updateBossScripts(this, dt);
    updateAutoTargets(this);
    updateKnockback(this, dt);
    updateMovement(this, dt);
    updateTransitions(this);
    if (IS_DEV) updateTestRoomInteract(this, now);
    updateMonsters(this, dt, now);
    updateCombat(this, dt, now);
    updateDefensiveSystems(this, dt, now);
    syncPlayerBuffs(this);

    if (IS_DEV) {
      ensureCurrentTestRoomBoss(this);
      ensureTrainingDummies(this);
    }

    for (const nodeId of NODE_REGISTRY.keys()) {
      if (nodeId === TEST_ROOM_NODE_ID) continue;
      this.ensurePopulation(nodeId);
      this.ensureBoss(nodeId);
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

  hasPlayer(playerId: string): boolean {
    return playerLifecycle.hasPlayer(this, playerId);
  }

  playerCount(): number {
    return playerLifecycle.playerCount(this);
  }

  spawnMonster(nodeId: string): boolean {
    return spawnMonsterInWorld(this, nodeId);
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

  // ── NETWORK DELTA ──────────────────────────────────

  beginBroadcast(): DirtyDrain {
    return this.dirty.drain();
  }

  /** Lazily initialize and return the membership set for `nodeId`. */
  getOrCreateNodeMembership(nodeId: string): Set<string> {
    let members = this.nodeMembership.get(nodeId);
    if (!members) {
      members = new Set();
      this.nodeMembership.set(nodeId, members);
    }
    return members;
  }

  buildNodeDelta(
    nodeId: string,
    dirty: DirtyDrain,
    opts: { resync?: boolean } = {},
  ): DeltaSnapshot {
    return buildNodeDelta(this, nodeId, dirty, opts);
  }

  // ── UTIL ────────────────────────────────────────────

  randInt(lo: number, hi: number) {
    return Math.floor(Math.random() * (hi - lo + 1)) + lo;
  }
}
