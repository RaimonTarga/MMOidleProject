import type { PlayerState, MonsterState, NodeDefinition, CombatEvent, NodeSnapshot } from '@mmo-idle/shared';
import { GAME_CONFIG, NODE_BIOMES, MONSTER_DATABASE, BIOME_DATABASE, TEST_ROOM_NODE_ID } from '@mmo-idle/shared';
import { updateAutoTargets } from '../systems/autoTarget';
import { updateMovement } from '../systems/movement';
import { updateMonsters } from '../systems/ai';
import { updateCombat } from '../systems/combat';
import { updateTransitions } from '../systems/transitions';
import { updateCombatState, makeCombatState, resetCombatState } from '../systems/combatState';
import type { CombatState } from '../systems/combatState';
import { updateCooldownArchetype } from '../systems/cooldownPrototype';
import { updateCooldownT3 } from '../systems/cooldownT3';
import { updateEnergyArchetype } from '../systems/energyPrototype';
import { updateEnergyT3 } from '../systems/energyT3';
import { updateReloadArchetype } from '../systems/reloadPrototype';
import { updateDotArchetype } from '../systems/dotPrototype';
import { updateDotT3 } from '../systems/dotT3';
import { updateCadenceEffects } from '../systems/cadencePrototype';
import { updateWeaponEffects } from '../systems/weaponEffects';
import { updateBossScripts } from '../systems/bossScripts';
import type { BossRuntimeState } from '../systems/bossScripts';
import { updateShields, updateDefensiveSystems } from '../systems/defenseSystems';
import { updateKnockback, type KnockbackComponent } from '../systems/knockback';
import { recalculatePlayerStats } from '../systems/stats';
import { syncPlayerBuffs } from '../systems/buffSync';
import { updateTestRoomInteract } from '../systems/testRoomInteract';
import { NODE_REGISTRY } from './nodeRegistry';
import { IS_DEV } from '../env';

// Regular monsters in dungeon nodes are scaled up; boss stats come from the database directly.
const DUNGEON_HP_MULT  = 2.0;
const DUNGEON_ATK_MULT = 1.6;
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
  /** Remaining ms of an active charge burst; 0 when not charging. */
  chargeRemainingMs: number;
}


export class World {
  readonly nodeId: string;
  readonly node: NodeDefinition;

  players      = new Map<string, PlayerState>();
  monsters     = new Map<string, MonsterState>();
  monsterAI    = new Map<string, MonsterAI>();
  /** Server-only boss fight state. Keyed by monster.id, pruned when the boss dies. */
  bossState    = new Map<string, BossRuntimeState>();
  /** nodeId → earliest timestamp at which the boss may respawn after being killed. */
  bossRespawnAt = new Map<string, number>();
  playerCombatAt = new Map<string, number>();
  /** Server-side only combat state for players. Never serialized or sent to clients. */
  playerCombatState  = new Map<string, CombatState>();
  /** Server-side only combat state for monsters. Never serialized or sent to clients. */
  monsterCombatState = new Map<string, CombatState>();
  /** Active knockback components per monster — see systems/knockback.ts. */
  monsterKnockback   = new Map<string, KnockbackComponent>();
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
      const target = this.getMobDensity(nodeId);
      for (let i = 0; i < target; i++) {
        this.spawnMonster(nodeId);
      }
      this.ensureBoss(nodeId);
    }

    if (IS_DEV) this.initTestRoom();
  }

  private getMobDensity(nodeId: string): number {
    const biomeInfo = NODE_BIOMES[nodeId];
    if (!biomeInfo) return GAME_CONFIG.MONSTERS_PER_NODE;
    const biome = BIOME_DATABASE.get(biomeInfo.biomeGroup);
    return biome?.mobDensity ?? GAME_CONFIG.MONSTERS_PER_NODE;
  }

  // ── SYSTEM ENTRY POINT ─────────────────────────────

  tick(dt: number, now: number) {
    updateCombatState(this, dt);
    updateShields(this, dt);
    updateCooldownArchetype(this);
    updateCooldownT3(this, dt);
    updateEnergyT3(this, dt);
    updateEnergyArchetype(this);
    updateReloadArchetype(this);
    updateDotT3(this, dt);
    updateDotArchetype(this, dt);
    updateCadenceEffects(this, dt);
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
  createMonster(nodeId: string, typeId: string, x: number, y: number): MonsterState | null {
    const def = MONSTER_DATABASE.get(typeId);
    if (!def) {
      console.warn(`[World] Unknown monster type: "${typeId}"`);
      return null;
    }

    const id = `monster-${this.nextMonsterId++}`;

    const isBoss = def.isBoss ?? false;
    const nodeDef = NODE_REGISTRY.get(nodeId);
    const isDungeon = nodeDef?.isDungeon ?? false;

    // Apply dungeon stat multipliers to regular (non-boss) monsters.
    const hpBase  = (!isBoss && isDungeon) ? Math.round(def.stats.hp     * DUNGEON_HP_MULT)  : def.stats.hp;
    const atkBase = (!isBoss && isDungeon) ? Math.round(def.stats.attack  * DUNGEON_ATK_MULT) : def.stats.attack;
    const isTestRoom = nodeId === TEST_ROOM_NODE_ID;
    const pullRange = isTestRoom ? 0 : def.stats.pullRange;
    const wanderRadius = isTestRoom ? 0 : def.ai.wanderRadius;

    const monster: MonsterState = {
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

    this.monsters.set(id, monster);
    this.monsterAI.set(id, {
      spawnX: x,
      spawnY: y,
      wanderRadius,
      idleUntil:     Date.now(),
      leashRange:    def.ai.leashRange,
      idleMinMs:     def.ai.idleMinMs,
      idleMaxMs:     def.ai.idleMaxMs,
      aggroTargetId:    null,
      lastAggroAt:      0,
      baseSpeed:        def.stats.speed,
      kiteTimer:        0,
      chargeRemainingMs: 0,
    });
    this.monsterCombatState.set(id, makeCombatState());

    return monster;
  }

  /**
   * Pick a random monster type from the node's biome pool and attempt to
   * place it at a position that respects minimum spacing. Returns true on success.
   */
  spawnMonster(nodeId: string): boolean {
    const biomeInfo = NODE_BIOMES[nodeId];
    if (!biomeInfo) return false;

    const biome = BIOME_DATABASE.get(biomeInfo.biomeGroup);
    if (!biome) return false;
    const pool = biome.monsterPoolByTier[biomeInfo.biomeTier] ?? [];
    if (pool.length === 0) return false;

    const typeId = pool[Math.floor(Math.random() * pool.length)];
    const node   = NODE_REGISTRY.get(nodeId) ?? this.node;
    const minDistSq = GAME_CONFIG.MONSTER_MIN_SPAWN_DIST ** 2;

    for (let attempt = 0; attempt < 15; attempt++) {
      const x = Math.floor(Math.random() * (node.width  - 128)) + 64;
      const y = Math.floor(Math.random() * (node.height - 128)) + 64;

      let tooClose = false;
      for (const m of this.monsters.values()) {
        if (m.nodeId !== nodeId) continue;
        const dx = m.x - x;
        const dy = m.y - y;
        if (dx * dx + dy * dy < minDistSq) { tooClose = true; break; }
      }
      if (tooClose) continue;

      return this.createMonster(nodeId, typeId, x, y) !== null;
    }

    return false;
  }

  /**
   * Teleport a player to the starting clearing (node-5-5), restore full HP,
   * clear movement and combat state, and drop all monster aggro targeting them.
   * Queues the player ID in pendingDeaths so the server loop can emit the event.
   */
  respawnPlayer(playerId: string): void {
    const player = this.players.get(playerId);
    if (!player) return;

    const spawnX = GAME_CONFIG.NODE_WIDTH  / 2;
    const spawnY = GAME_CONFIG.NODE_HEIGHT / 2;

    player.nodeId       = 'node-5-5';
    player.x            = spawnX;
    player.y            = spawnY;
    player.targetX      = spawnX;
    player.targetY      = spawnY;
    player.attackTargetId = null;
    player.auto         = false;

    // Rebuild stats from scratch — resets attackCooldown, cadenceSpeedStacks, etc.
    recalculatePlayerStats(player);
    player.hp = player.maxHp;

    player.evasionCount  = 0;
    player.shields       = [];
    player.isChanneling  = false;
    player.channelingPct = 0;

    this.playerCombatAt.delete(playerId);

    const combatState = this.playerCombatState.get(playerId);
    if (combatState) resetCombatState(combatState);

    for (const ai of this.monsterAI.values()) {
      if (ai.aggroTargetId === playerId) ai.aggroTargetId = null;
    }

    this.pendingDeaths.push(playerId);
  }

  ensurePopulation(nodeId: string) {
    const target = this.getMobDensity(nodeId);
    let count = 0;
    for (const m of this.monsters.values()) {
      if (m.nodeId === nodeId && !m.isBoss) count++;
    }
    while (count < target) {
      if (!this.spawnMonster(nodeId)) break;
      count++;
    }
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
    for (const monster of this.monsters.values()) {
      if (monster.nodeId !== TEST_ROOM_NODE_ID) continue;
      present.add(monster.monsterTypeId);
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
    if (this.testRoomEngagedBossId && !this.monsters.has(this.testRoomEngagedBossId)) {
      this.testRoomEngagedBossId = null;
    }
    // While the engaged boss is alive, freeze the rotation — the player is
    // actively using it as a test dummy.
    if (this.testRoomEngagedBossId) return;

    let targetTier: number | null = null;
    for (const player of this.players.values()) {
      if (player.nodeId !== TEST_ROOM_NODE_ID) continue;
      targetTier = Math.max(targetTier ?? 0, player.playerTier);
    }
    if (targetTier !== null) this.ensureTestRoomBoss(targetTier);
  }

  ensureTestRoomBoss(targetTier: number): void {
    const typeId = this.pickTestRoomBossType(targetTier);
    if (!typeId) return;

    for (const monster of this.monsters.values()) {
      if (monster.nodeId !== TEST_ROOM_NODE_ID || !monster.isBoss) continue;
      if (monster.monsterTypeId === typeId) return;
      this.monsters.delete(monster.id);
      this.monsterAI.delete(monster.id);
      this.monsterCombatState.delete(monster.id);
    }

    const boss = this.createMonster(
      TEST_ROOM_NODE_ID,
      typeId,
      GAME_CONFIG.NODE_WIDTH / 2,
      GAME_CONFIG.NODE_HEIGHT / 2 + 120,
    );
    if (boss) {
      boss.name = `Test Dummy T${Math.max(0, targetTier)} (${boss.name})`;
      boss.isBoss = true;
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
    const nodeDef = NODE_REGISTRY.get(nodeId);
    if (!nodeDef?.isDungeon) return;

    const hasBoss = [...this.monsters.values()].some(m => m.nodeId === nodeId && m.isBoss);
    if (hasBoss) return;

    const respawnAt = this.bossRespawnAt.get(nodeId) ?? 0;
    if (respawnAt > Date.now()) return;

    const biome = BIOME_DATABASE.get(nodeDef.biomeGroup);
    const pool  = biome?.bossPoolByTier?.[nodeDef.biomeTier];
    if (!pool || pool.length === 0) return;

    const typeId = pool[Math.floor(Math.random() * pool.length)];
    const x = nodeDef.width  / 2 + (Math.random() - 0.5) * 200;
    const y = nodeDef.height / 2 + (Math.random() - 0.5) * 200;
    this.createMonster(nodeId, typeId, x, y);
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
    return {
      players:  Array.from(this.players.values()).filter(p => p.nodeId === nodeId),
      monsters: Array.from(this.monsters.values()).filter(m => m.nodeId === nodeId),
      events,
    };
  }

  // ── UTIL ────────────────────────────────────────────

  randInt(lo: number, hi: number) {
    return Math.floor(Math.random() * (hi - lo + 1)) + lo;
  }
}
