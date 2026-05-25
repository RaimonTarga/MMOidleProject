import type { PlayerSnapshot, MonsterSnapshot, NodeDefinition, CombatEvent, NodeSnapshot } from '@mmo-idle/shared';
import { GAME_CONFIG, BIOME_DATABASE, TEST_ROOM_NODE_ID } from '@mmo-idle/shared';
import { updateAutoTargets } from '../systems/autoTarget';
import { updateMovement } from '../systems/movement';
import { updateMonsters } from '../systems/ai';
import { updateCombat } from '../systems/combat';
import { updateTransitions } from '../systems/transitions';
import { updateCombatState, makeCombatState } from '../systems/combatState';
import type { CombatState } from '../systems/combatState';
import { tickAllMechanics } from '../systems/classes/registry';
import { updateWeaponEffects } from '../systems/weaponEffects';
import { updateBossScripts } from '../systems/bossScripts';
import type { BossRuntimeState } from '../systems/bossScripts';
import { updateShields, updateDefensiveSystems } from '../systems/defenseSystems';
import { updateKnockback, type KnockbackComponent } from '../systems/knockback';
import { syncPlayerBuffs } from '../systems/buffSync';
import {
  createMonster as createMonsterInWorld,
  spawnMonster as spawnMonsterInWorld,
  respawnPlayer as respawnPlayerInWorld,
  ensurePopulation as ensurePopulationInWorld,
  ensureBoss as ensureBossInWorld,
} from '../systems/spawning';
import { updateTestRoomInteract } from '../systems/testRoomInteract';
import { NODE_REGISTRY } from './nodeRegistry';
import { IS_DEV } from '../env';
import { createEcsWorld, type EcsWorld } from '../ecs/world';
import type { MonsterEntity } from '../ecs/components/monster';
import type { PlayerEntity } from '../ecs/components/player';
import {
  decomposePlayerSnapshot,
  assemblePlayerSnapshot,
  assembleMonsterSnapshot,
} from '../ecs/projection';
import {
  makeCadenceComponent,
  refreshCadenceFromSnapshot,
  type CadencePlayerEntity,
} from '../ecs/components/cadence';
import {
  makeEnergyComponent,
  refreshEnergyFromSnapshot,
  type EnergyPlayerEntity,
} from '../ecs/components/energy';
import {
  makeDotComponent,
  refreshDotFromSnapshot,
  type DotPlayerEntity,
} from '../ecs/components/dot';
import {
  makeCooldownComponent,
  refreshCooldownFromSnapshot,
  type CooldownPlayerEntity,
} from '../ecs/components/cooldown';
import {
  makeReloadComponent,
  refreshReloadFromSnapshot,
  type ReloadPlayerEntity,
} from '../ecs/components/reload';

const TEST_ROOM_TARGET_RESET = 'test-target-reset';
const TEST_ROOM_TARGET_GAIN_POINT = 'test-target-gain-point';

/**
 * Stationary training dummies for the dev test room — one per enemy tier (T0–T4).
 * HP comes from each dummy's MonsterDefinition (median boss HP for the tier).
 * Laid out in a row along the north wall of the test room so the player can
 * walk up to any of them to test animations, range, or sustained damage.
 */
const TEST_ROOM_TRAINING_DUMMY_TYPES = [
  'training-dummy-t0',
  'training-dummy-t1',
  'training-dummy-t2',
  'training-dummy-t3',
  'training-dummy-t4',
] as const;
const TEST_ROOM_TRAINING_DUMMY_Y = 240;
const TEST_ROOM_TRAINING_DUMMY_SPACING = 500;

export interface MonsterAI {
  spawnX: number;
  spawnY: number;
  wanderRadius: number;
  idleUntil: number;
  leashRange: number;
  idleMinMs: number;
  idleMaxMs: number;
  aggroTargetId: string | null;
  /** Timestamp of the last tick this monster had an active aggro target. */
  lastAggroAt: number;
  /** Unmodified speed from the database — kite ramp restores to this. */
  baseSpeed: number;
  /** Ms spent chasing without landing an attack — drives the kite speed ramp. */
  kiteTimer: number;
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

  /**
   * Canonical monster query. All required slice components are stamped together
   * in `createMonster`, so the query return type matches `MonsterEntity`.
   */
  readonly monsterEntities = this.ecs.with(
    'monsterAi',
    'combatState',
    'isMonster',
    'hasPosition',
    'isMoving',
    'hasHealth',
    'dealsDamage',
    'performsAttack',
    'mitigatesDamage',
    'hasAwareness',
    'hasStatus',
  );

  /**
   * Canonical player query. All required slice components are stamped together
   * in `attachPlayerEntity`, so the return type matches `PlayerEntity`.
   */
  readonly playerEntities = this.ecs.with(
    'combatState',
    'combatAt',
    'isPlayer',
    'hasPosition',
    'isMoving',
    'hasHealth',
    'dealsDamage',
    'performsAttack',
    'mitigatesDamage',
    'evadesHits',
    'hasStatus',
    'usesAutocombat',
    'tracksProgression',
    'holdsInventory',
    'usesSkills',
    'showsSacred',
    'usesCadence',
    'usesEnergy',
    'appliesDots',
    'chillsTarget',
    'usesCooldown',
    'usesReload',
  );

  /** Players that have the cadence archetype component attached. */
  readonly cadencePlayers  = this.playerEntities.with('cadence');
  /** Players that have the energy archetype component attached. */
  readonly energyPlayers   = this.playerEntities.with('energy');
  /** Players that have the dot archetype component attached. */
  readonly dotPlayers      = this.playerEntities.with('dot');
  /** Players that have the cooldown archetype component attached. */
  readonly cooldownPlayers = this.playerEntities.with('cooldown');
  /** Players that have the reload archetype component attached. */
  readonly reloadPlayers   = this.playerEntities.with('reload');
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

  constructor(nodeId = 'node-5-5') {
    const node = NODE_REGISTRY.get(nodeId);
    if (!node) throw new Error(`Unknown node id: "${nodeId}"`);
    this.nodeId = nodeId;
    this.node   = node;
    this.init();
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
  createMonster(nodeId: string, typeId: string, x: number, y: number): MonsterSnapshot | null {
    return createMonsterInWorld(this, nodeId, typeId, x, y);
  }

  // ── MONSTER ENTITY HELPERS ────────────────────────────

  /**
   * O(N) entity lookup by monster id. Adequate at ~50 monsters; if profiling
   * shows hot, swap to a `Map<string, MonsterEntity>` index maintained via
   * `onEntityAdded` / `onEntityRemoved`.
   */
  getMonsterEntity(id: string): MonsterEntity | undefined {
    for (const e of this.monsterEntities) {
      if (e.isMonster.id === id) return e;
    }
    return undefined;
  }

  /** Iterate every monster entity in `nodeId`. Uses the `hasPosition` slice. */
  *monsterEntitiesInNode(nodeId: string): IterableIterator<MonsterEntity> {
    for (const e of this.monsterEntities) {
      if (e.hasPosition.nodeId === nodeId) yield e;
    }
  }

  getMonsterAi(id: string): MonsterAI | undefined {
    return this.getMonsterEntity(id)?.monsterAi;
  }

  /** True if the monster currently exists in the world. */
  hasMonster(id: string): boolean {
    return this.getMonsterEntity(id) !== undefined;
  }

  getMonsterCombatState(id: string): CombatState | undefined {
    return this.getMonsterEntity(id)?.combatState;
  }

  getMonsterKnockback(id: string): KnockbackComponent | undefined {
    return this.getMonsterEntity(id)?.knockback;
  }

  setMonsterKnockback(id: string, kb: KnockbackComponent): void {
    const e = this.getMonsterEntity(id);
    if (!e) return;
    if (e.knockback) {
      // Already present — just overwrite the data; miniplex query membership
      // is unchanged since the component key is still attached.
      e.knockback = kb;
    } else {
      this.ecs.addComponent(e, 'knockback', kb);
    }
  }

  clearMonsterKnockback(id: string): void {
    const e = this.getMonsterEntity(id);
    if (!e || !e.knockback) return;
    this.ecs.removeComponent(e, 'knockback');
  }

  getBossState(id: string): BossRuntimeState | undefined {
    return this.getMonsterEntity(id)?.bossState;
  }

  setBossState(id: string, state: BossRuntimeState): void {
    const e = this.getMonsterEntity(id);
    if (!e) return;
    if (e.bossState) {
      e.bossState = state;
    } else {
      this.ecs.addComponent(e, 'bossState', state);
    }
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
   * Attach a hydrated `PlayerSnapshot` to the ECS world along with a fresh
   * `CombatState`. The `combatAt` component starts at 0 (the OOC regen path
   * treats it as never-engaged, which is correct on fresh connect).
   *
   * Returns the entity so callers (the socket connect handler) can keep a
   * direct reference if they need one.
   */
  attachPlayerEntity(player: PlayerSnapshot): PlayerEntity {
    const entity: PlayerEntity = {
      entityId:       player.id,
      combatState:    makeCombatState(),
      combatAt:       0,
      ...decomposePlayerSnapshot(player),
    };
    this.ecs.add(entity);
    this.refreshArchetypeComponents(player.id);
    return entity;
  }

  detachPlayerEntity(playerId: string): void {
    const e = this.getPlayerEntity(playerId);
    if (e) this.ecs.remove(e);
  }

  /** O(N) entity lookup by player id (socket id). N ≈ ~10 in practice. */
  getPlayerEntity(playerId: string): PlayerEntity | undefined {
    for (const e of this.playerEntities) {
      if (e.isPlayer.id === playerId) return e;
    }
    return undefined;
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

  getPlayerCombatState(playerId: string): CombatState | undefined {
    return this.getPlayerEntity(playerId)?.combatState;
  }

  getPlayerCombatAt(playerId: string): number {
    return this.getPlayerEntity(playerId)?.combatAt ?? 0;
  }

  setPlayerCombatAt(playerId: string, ts: number): void {
    const e = this.getPlayerEntity(playerId);
    if (e) e.combatAt = ts;
  }

  // ── ARCHETYPE COMPONENT HOOKS ─────────────────────────

  /**
   * Idempotent: attaches the cadence component when the player is currently
   * cadence-archetype, refreshes it from the snapshot if already attached, or
   * detaches it when the player has been respec'd off cadence.
   *
   * Call this after any mutation that may change `combatArchetype` or reset
   * cadence snapshot fields (skill unlock, equip/unequip, respawn, hydrate,
   * progression reset).
   */
  ensureCadenceComponent(playerId: string): void {
    const entity = this.getPlayerEntity(playerId);
    if (!entity) return;

    const p = assemblePlayerSnapshot(entity);
    if (p.combatArchetype !== 'cadence') {
      if (entity.cadence) this.ecs.removeComponent(entity, 'cadence');
      return;
    }

    if (entity.cadence) {
      refreshCadenceFromSnapshot(entity.cadence, p);
    } else {
      this.ecs.addComponent(entity, 'cadence', makeCadenceComponent(p));
    }
  }

  ensureEnergyComponent(playerId: string): void {
    const entity = this.getPlayerEntity(playerId);
    if (!entity) return;

    const p = assemblePlayerSnapshot(entity);
    if (p.combatArchetype !== 'energy') {
      if (entity.energy) this.ecs.removeComponent(entity, 'energy');
      return;
    }

    if (entity.energy) {
      refreshEnergyFromSnapshot(entity.energy, p);
    } else {
      this.ecs.addComponent(entity, 'energy', makeEnergyComponent(p));
    }
  }

  ensureDotComponent(playerId: string): void {
    const entity = this.getPlayerEntity(playerId);
    if (!entity) return;

    const p = assemblePlayerSnapshot(entity);
    if (p.combatArchetype !== 'dot') {
      if (entity.dot) this.ecs.removeComponent(entity, 'dot');
      return;
    }

    if (entity.dot) {
      refreshDotFromSnapshot(entity.dot, p);
    } else {
      this.ecs.addComponent(entity, 'dot', makeDotComponent(p));
    }
  }

  ensureCooldownComponent(playerId: string): void {
    const entity = this.getPlayerEntity(playerId);
    if (!entity) return;

    const p = assemblePlayerSnapshot(entity);
    if (p.combatArchetype !== 'cooldown') {
      if (entity.cooldown) this.ecs.removeComponent(entity, 'cooldown');
      return;
    }

    if (entity.cooldown) {
      refreshCooldownFromSnapshot(entity.cooldown, p);
    } else {
      this.ecs.addComponent(entity, 'cooldown', makeCooldownComponent(p));
    }
  }

  ensureReloadComponent(playerId: string): void {
    const entity = this.getPlayerEntity(playerId);
    if (!entity) return;

    const p = assemblePlayerSnapshot(entity);
    if (p.combatArchetype !== 'reload') {
      if (entity.reload) this.ecs.removeComponent(entity, 'reload');
      return;
    }

    if (entity.reload) {
      refreshReloadFromSnapshot(entity.reload, p);
    } else {
      this.ecs.addComponent(entity, 'reload', makeReloadComponent(p));
    }
  }

  /**
   * Single seam called after any place that runs `recalculatePlayerStats` for
   * an attached player. All archetype components are wired in here.
   */
  refreshArchetypeComponents(playerId: string): void {
    this.ensureCadenceComponent(playerId);
    this.ensureEnergyComponent(playerId);
    this.ensureDotComponent(playerId);
    this.ensureCooldownComponent(playerId);
    this.ensureReloadComponent(playerId);
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
    this.createMonster(TEST_ROOM_NODE_ID, TEST_ROOM_TARGET_RESET, GAME_CONFIG.NODE_WIDTH / 2 - 180, y);
    this.createMonster(TEST_ROOM_NODE_ID, TEST_ROOM_TARGET_GAIN_POINT, GAME_CONFIG.NODE_WIDTH / 2 + 180, y);
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

    const count   = TEST_ROOM_TRAINING_DUMMY_TYPES.length;
    const startX  = GAME_CONFIG.NODE_WIDTH / 2 - (TEST_ROOM_TRAINING_DUMMY_SPACING * (count - 1)) / 2;
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
    if (this.testRoomEngagedBossId && !this.hasMonster(this.testRoomEngagedBossId)) {
      this.testRoomEngagedBossId = null;
    }
    // While the engaged boss is alive, freeze the rotation — the player is
    // actively using it as a test dummy.
    if (this.testRoomEngagedBossId) return;

    let targetTier: number | null = null;
    for (const player of this.playerEntities) {
      if (player.hasPosition.nodeId !== TEST_ROOM_NODE_ID) continue;
      targetTier = Math.max(targetTier ?? 0, player.tracksProgression.playerTier);
    }
    if (targetTier !== null) this.ensureTestRoomBoss(targetTier);
  }

  ensureTestRoomBoss(targetTier: number): void {
    const typeId = this.pickTestRoomBossType(targetTier);
    if (!typeId) return;

    for (const e of this.monsterEntities) {
      if (e.hasPosition.nodeId !== TEST_ROOM_NODE_ID || !e.isMonster.isBoss) continue;
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
      const entity = this.getMonsterEntity(boss.id);
      if (entity) {
        entity.isMonster.name = `Test Dummy T${Math.max(0, targetTier)} (${entity.isMonster.name})`;
        entity.isMonster.isBoss = true;
      }
    }
  }

  private pickTestRoomBossType(targetTier: number): string | null {
    if (targetTier <= 0) return 'tiny-slime';

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
    if (!arr) { arr = []; this.nodeEvents.set(nodeId, arr); }
    arr.push(event);
  }

  // ── SNAPSHOT ───────────────────────────────────────

  buildSnapshot(nodeId: string): NodeSnapshot {
    const events = this.nodeEvents.get(nodeId) ?? [];
    this.nodeEvents.set(nodeId, []);

    const monsters: MonsterSnapshot[] = [];
    for (const e of this.monsterEntities) {
      if (e.hasPosition.nodeId !== nodeId) continue;
      monsters.push(assembleMonsterSnapshot(e));
    }

    const players: PlayerSnapshot[] = [];
    for (const e of this.playerEntities) {
      if (e.hasPosition.nodeId !== nodeId) continue;
      players.push(assemblePlayerSnapshot(e));
    }

    return {
      players,
      monsters,
      events,
    };
  }

  // ── UTIL ────────────────────────────────────────────

  randInt(lo: number, hi: number) {
    return Math.floor(Math.random() * (hi - lo + 1)) + lo;
  }
}
