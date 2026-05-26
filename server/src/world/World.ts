import type {
  NodeDefinition,
  CombatEvent,
  DeltaSnapshot,
  EntityDelta,
} from "@mmo-idle/shared";
import {
  GAME_CONFIG,
  BIOME_DATABASE,
  TEST_ROOM_NODE_ID,
  networkedKeysForKind,
} from "@mmo-idle/shared";
import { updateAutoTargets } from "../systems/autoTarget";
import { updateMovement } from "../systems/movement";
import { updateMonsters } from "../systems/ai";
import { updateCombat } from "../systems/combat";
import { updateTransitions } from "../systems/transitions";
import { updateCombatState } from "../systems/combatState";
import { makeTracksCombat } from "@mmo-idle/shared";
import { tickAllMechanics } from "../systems/classes/registry";
import { updateWeaponEffects } from "../systems/weaponEffects";
import { updateBossScripts } from "../systems/bossScripts";
import {
  updateShields,
  updateDefensiveSystems,
} from "../systems/defenseSystems";
import { updateKnockback, type HasKnockback } from "../systems/knockback";
import { syncPlayerBuffs } from "../systems/buffSync";
import {
  createMonster as createMonsterInWorld,
  spawnMonster as spawnMonsterInWorld,
  respawnPlayer as respawnPlayerInWorld,
  ensurePopulation as ensurePopulationInWorld,
  ensureBoss as ensureBossInWorld,
} from "../systems/spawning";
import { updateTestRoomInteract } from "../systems/testRoomInteract";
import { NODE_REGISTRY } from "./nodeRegistry";
import { IS_DEV } from "../env";
import { createEcsWorld, type EcsWorld } from "../ecs/world";
import type { MonsterEntity } from "../ecs/components/monster";
import { isMonsterEntity } from "../ecs/components/monster";
import type { PlayerEntity } from "../ecs/components/player";
import { isPlayerEntity } from "../ecs/components/player";
import type { EntityId, ServerEntity } from "../ecs/entity";
import { entityNetworkId, entityNetworkKind } from "../ecs/entity";
import type { PersistedPlayerSlices } from "../db/playerRepo";
import { DirtyTracker, type DirtyDrain } from "../ecs/dirtyTracker";
import { encodeAdd, encodePatch } from "../ecs/deltaEncoder";

const TEST_ROOM_TARGET_RESET = "test-target-reset";
const TEST_ROOM_TARGET_GAIN_POINT = "test-target-gain-point";

/**
 * Stationary training dummies for the dev test room — one per enemy tier (T0–T4).
 * HP comes from each dummy's MonsterDefinition (median boss HP for the tier).
 * Laid out in a row along the north wall of the test room so the player can
 * walk up to any of them to test animations, range, or sustained damage.
 */
const TEST_ROOM_TRAINING_DUMMY_TYPES = [
  "training-dummy-t0",
  "training-dummy-t1",
  "training-dummy-t2",
  "training-dummy-t3",
  "training-dummy-t4",
] as const;
const TEST_ROOM_TRAINING_DUMMY_Y = 240;
const TEST_ROOM_TRAINING_DUMMY_SPACING = 500;

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
  private tickCounter = 0;
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

    if (IS_DEV) this.initTestRoom();
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
      this.ensureCurrentTestRoomBoss();
      this.ensureTrainingDummies();
    }

    for (const nodeId of NODE_REGISTRY.keys()) {
      if (nodeId === TEST_ROOM_NODE_ID) continue;
      this.ensurePopulation(nodeId);
      this.ensureBoss(nodeId);
    }
  }

  // ── ENTITY MANAGEMENT ─────────────────────────────

  /**
   * Create a monster of the given type at (x, y) in nodeId.
   * All stats and AI parameters come from MONSTER_DATABASE.
   * Returns null if the type ID is unknown.
   */
  createMonster(
    nodeId: string,
    typeId: string,
    x: number,
    y: number,
  ): MonsterEntity | null {
    return createMonsterInWorld(this, nodeId, typeId, x, y);
  }

  // ── MONSTER ENTITY HELPERS ────────────────────────────

  /**
   * O(N) entity lookup by monster id. Adequate at ~50 monsters; if profiling
   * shows hot, swap to a `Map<string, MonsterEntity>` index maintained via
   * `onEntityAdded` / `onEntityRemoved`.
   */
  getMonsterEntity(id: string): MonsterEntity | undefined {
    const e = this.getEntity(id);
    return e && isMonsterEntity(e) ? e : undefined;
  }

  /** Iterate every monster entity in `nodeId`. Uses the `hasPosition` slice. */
  *monsterEntitiesInNode(nodeId: string): IterableIterator<MonsterEntity> {
    for (const e of this.monsterEntities) {
      if (e.hasPosition.nodeId === nodeId) yield e;
    }
  }

  /** True if the monster currently exists in the world. */
  hasMonster(id: string): boolean {
    return this.getMonsterEntity(id) !== undefined;
  }

  getMonsterKnockback(id: string): HasKnockback | undefined {
    return this.getMonsterEntity(id)?.hasKnockback;
  }

  setMonsterKnockback(id: string, kb: HasKnockback): void {
    const e = this.getMonsterEntity(id);
    if (!e) return;
    if (e.hasKnockback) {
      e.hasKnockback = kb;
    } else {
      this.ecs.addComponent(e, "hasKnockback", kb);
    }
  }

  clearMonsterKnockback(id: string): void {
    const e = this.getMonsterEntity(id);
    if (!e || !e.hasKnockback) return;
    this.ecs.removeComponent(e, "hasKnockback");
  }

  /**
   * Centralized monster despawn. Removes the entity from miniplex, which
   * cascades component removal across every query in one call. Use this
   * instead of multiple `world.<map>.delete(id)` lines.
   */
  removeMonsterEntity(id: string): void {
    const e = this.getMonsterEntity(id);
    if (e) this.ecs.remove(e);
  }

  // ── PLAYER ENTITY HELPERS ─────────────────────────────

  /**
   * Attach hydrated player slices to the ECS world with fresh combat tracking.
   * The socket id is runtime identity; persisted row ids stay in the DB only.
   */
  attachPlayerEntity(
    player: PersistedPlayerSlices,
    socketId: string,
  ): PlayerEntity {
    const entity: PlayerEntity = {
      entityId: socketId,
      tracksCombat: makeTracksCombat(),
      isPlayer: {
        ...player.isPlayer,
        id: socketId,
      },
      hasPosition: player.hasPosition,
      hasHealth: player.hasHealth,
      dealsDamage: {
        attack:      GAME_CONFIG.PLAYER_ATTACK,
        onHitDamage: 0,
        attackStyle: 'slash',
      },
      performsAttack: {
        attackRange:    GAME_CONFIG.PLAYER_ATTACK_RANGE,
        attackCooldown: GAME_CONFIG.PLAYER_ATTACK_COOLDOWN,
        lastAttackAt:   0,
      },
      mitigatesDamage: {
        plating:         GAME_CONFIG.PLAYER_PLATING,
        damageReduction: 0,
      },
      hasStatus: {
        activeBuffs: [],
      },
      usesAutocombat: {
        auto: false,
      },
      tracksProgression: player.tracksProgression,
      holdsInventory: player.holdsInventory,
      usesSkills: {
        ...player.usesSkills,
        passives: {},
      },
      showsSacred: {
        sacredBuffActive: false,
        sacredBuffPct:    0,
      },
    };
    this.ecs.add(entity);
    return entity;
  }

  detachPlayerEntity(playerId: string): void {
    const e = this.getPlayerEntity(playerId);
    if (e) this.ecs.remove(e);
  }

  /** O(N) entity lookup by player id (socket id). N ≈ ~10 in practice. */
  getPlayerEntity(playerId: string): PlayerEntity | undefined {
    const e = this.getEntity(playerId);
    return e && isPlayerEntity(e) ? e : undefined;
  }

  /** Iterate every player entity in `nodeId`. Uses the `hasPosition` slice. */
  *playerEntitiesInNode(nodeId: string): IterableIterator<PlayerEntity> {
    for (const e of this.playerEntities) {
      if (e.hasPosition.nodeId === nodeId) yield e;
    }
  }

  hasPlayer(playerId: string): boolean {
    return this.getPlayerEntity(playerId) !== undefined;
  }

  playerCount(): number {
    return this.playerEntities.size;
  }

  /**
   * Pick a random monster type from the node's biome pool and attempt to
   * place it at a position that respects minimum spacing. Returns true on success.
   */
  spawnMonster(nodeId: string): boolean {
    return spawnMonsterInWorld(this, nodeId);
  }

  respawnPlayer(playerId: string): void {
    respawnPlayerInWorld(this, playerId);
  }

  ensurePopulation(nodeId: string): void {
    ensurePopulationInWorld(this, nodeId);
  }

  private initTestRoom(): void {
    const y = GAME_CONFIG.NODE_HEIGHT / 2 - 260;
    this.createMonster(
      TEST_ROOM_NODE_ID,
      TEST_ROOM_TARGET_RESET,
      GAME_CONFIG.NODE_WIDTH / 2 - 180,
      y,
    );
    this.createMonster(
      TEST_ROOM_NODE_ID,
      TEST_ROOM_TARGET_GAIN_POINT,
      GAME_CONFIG.NODE_WIDTH / 2 + 180,
      y,
    );
    this.ensureTestRoomBoss(0);
    this.ensureTrainingDummies();
  }

  /**
   * One stationary training dummy per enemy tier (T0–T4), arranged along the
   * north wall of the test room. Idempotent — respawns any dummy that has
   * been killed since the last call.
   */
  private ensureTrainingDummies(): void {
    const present = new Set<string>();
    for (const e of this.monsterEntities) {
      if (e.hasPosition.nodeId !== TEST_ROOM_NODE_ID) continue;
      present.add(e.isMonster.monsterTypeId);
    }

    const count = TEST_ROOM_TRAINING_DUMMY_TYPES.length;
    const startX =
      GAME_CONFIG.NODE_WIDTH / 2 -
      (TEST_ROOM_TRAINING_DUMMY_SPACING * (count - 1)) / 2;
    for (let i = 0; i < count; i++) {
      const typeId = TEST_ROOM_TRAINING_DUMMY_TYPES[i];
      if (present.has(typeId)) continue;
      this.createMonster(
        TEST_ROOM_NODE_ID,
        typeId,
        startX + i * TEST_ROOM_TRAINING_DUMMY_SPACING,
        TEST_ROOM_TRAINING_DUMMY_Y,
      );
    }
  }

  private ensureCurrentTestRoomBoss(): void {
    // If a previously engaged boss has been killed/removed, clear the lock so a
    // fresh dummy can be rolled for the player's current tier.
    if (
      this.testRoomEngagedBossId &&
      !this.hasMonster(this.testRoomEngagedBossId)
    ) {
      this.testRoomEngagedBossId = null;
    }
    // While the engaged boss is alive, freeze the rotation — the player is
    // actively using it as a test dummy.
    if (this.testRoomEngagedBossId) return;

    let targetTier: number | null = null;
    for (const player of this.playerEntities) {
      if (player.hasPosition.nodeId !== TEST_ROOM_NODE_ID) continue;
      targetTier = Math.max(
        targetTier ?? 0,
        player.tracksProgression.playerTier,
      );
    }
    if (targetTier !== null) this.ensureTestRoomBoss(targetTier);
  }

  ensureTestRoomBoss(targetTier: number): void {
    const typeId = this.pickTestRoomBossType(targetTier);
    if (!typeId) return;

    for (const e of this.monsterEntities) {
      if (e.hasPosition.nodeId !== TEST_ROOM_NODE_ID || !e.isMonster.isBoss)
        continue;
      if (e.isMonster.monsterTypeId === typeId) return;
      this.removeMonsterEntity(e.isMonster.id);
    }

    const boss = this.createMonster(
      TEST_ROOM_NODE_ID,
      typeId,
      GAME_CONFIG.NODE_WIDTH / 2,
      GAME_CONFIG.NODE_HEIGHT / 2 + 120,
    );
    if (boss) {
      const entity = this.getMonsterEntity(boss.isMonster.id);
      if (entity) {
        entity.isMonster.name = `Test Dummy T${Math.max(0, targetTier)} (${entity.isMonster.name})`;
        entity.isMonster.isBoss = true;
      }
    }
  }

  private pickTestRoomBossType(targetTier: number): string | null {
    if (targetTier <= 0) return "tiny-slime";

    const exactTierBosses: string[] = [];
    for (const biome of BIOME_DATABASE.values()) {
      exactTierBosses.push(...(biome.bossPoolByTier?.[targetTier] ?? []));
    }
    if (exactTierBosses.length === 0) return null;

    return exactTierBosses[Math.floor(Math.random() * exactTierBosses.length)];
  }

  /**
   * Maintain exactly one boss in each dungeon node. If no boss is present,
   * picks from the biome's bossPoolByTier and spawns near the node center.
   */
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

  // ── NETWORK DELTA ──────────────────────────────────

  beginBroadcast(): DirtyDrain {
    return this.dirty.drain();
  }

  buildNodeDelta(
    nodeId: string,
    dirty: DirtyDrain,
    opts: { resync?: boolean } = {},
  ): DeltaSnapshot {
    const events = this.nodeEvents.get(nodeId) ?? [];
    this.nodeEvents.set(nodeId, []);

    const deltas: EntityDelta[] = [];
    const liveIds = new Set<string>();
    if (opts.resync) this.nodeMembership.delete(nodeId);
    let members = this.nodeMembership.get(nodeId);
    if (!members) {
      members = new Set();
      this.nodeMembership.set(nodeId, members);
    }
    const full = opts.resync || members.size === 0;

    for (const e of this.monsterEntities) {
      if (e.hasPosition.nodeId !== nodeId) continue;
      this.encodeNodeEntityDelta(e, dirty, members, liveIds, deltas);
    }

    for (const e of this.playerEntities) {
      if (e.hasPosition.nodeId !== nodeId) continue;
      this.encodeNodeEntityDelta(e, dirty, members, liveIds, deltas);
    }

    for (const netId of [...members]) {
      if (liveIds.has(netId)) continue;
      deltas.push({ kind: 'remove', netId });
      members.delete(netId);
    }

    return {
      tick: this.tickCounter,
      nodeId,
      full,
      deltas,
      events,
    };
  }

  private encodeNodeEntityDelta(
    entity: ServerEntity,
    dirty: DirtyDrain,
    members: Set<string>,
    liveIds: Set<string>,
    deltas: EntityDelta[],
  ): void {
    const netId = entityNetworkId(entity);
    if (!netId) return;
    liveIds.add(netId);
    if (!members.has(netId)) {
      const add = encodeAdd(entity);
      if (!add) return;
      deltas.push(add);
      members.add(netId);
      return;
    }

    const entityKind = entityNetworkKind(entity);
    if (!entityKind) return;
    const patchKeys = new Set(networkedKeysForKind(entityKind));
    for (const key of dirty.patched.get(netId) ?? []) patchKeys.add(key);
    const patch = encodePatch(entity, patchKeys, dirty.detached.get(netId));
    if (patch) deltas.push(patch);
  }

  // ── UTIL ────────────────────────────────────────────

  randInt(lo: number, hi: number) {
    return Math.floor(Math.random() * (hi - lo + 1)) + lo;
  }
}
