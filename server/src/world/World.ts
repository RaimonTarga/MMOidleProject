import type { PlayerState, MonsterState, NodeDefinition } from '@mmo-idle/shared';
import { GAME_CONFIG, NODE_BIOMES, MONSTER_DATABASE, BIOME_DATABASE } from '@mmo-idle/shared';
import { updateAutoTargets } from '../systems/autoTarget';
import { updateMovement } from '../systems/movement';
import { updateMonsters } from '../systems/ai';
import { updateCombat } from '../systems/combat';
import { updateTransitions } from '../systems/transitions';
import { NODE_REGISTRY } from './nodeRegistry';

export interface MonsterAI {
  spawnX: number;
  spawnY: number;
  wanderRadius: number;
  idleUntil: number;
  leashRange: number;
  idleMinMs: number;
  idleMaxMs: number;
  aggroTargetId: string | null;
}

// Minimum pixel distance between two monsters at spawn time.
const MIN_SPAWN_DIST = 120;

export class World {
  readonly nodeId: string;
  readonly node: NodeDefinition;

  players      = new Map<string, PlayerState>();
  monsters     = new Map<string, MonsterState>();
  monsterAI    = new Map<string, MonsterAI>();
  playerCombatAt = new Map<string, number>();
  /** Player IDs that died this tick. Drained by the server loop after each tick. */
  pendingDeaths: string[] = [];

  nextMonsterId = 1;

  constructor(nodeId = 'node-2-2') {
    const node = NODE_REGISTRY.get(nodeId);
    if (!node) throw new Error(`Unknown node id: "${nodeId}"`);
    this.nodeId = nodeId;
    this.node   = node;
    this.init();
  }

  private init() {
    for (const nodeId of NODE_REGISTRY.keys()) {
      for (let i = 0; i < GAME_CONFIG.MONSTERS_PER_NODE; i++) {
        this.spawnMonster(nodeId);
      }
    }
  }

  // ── SYSTEM ENTRY POINT ─────────────────────────────

  tick(dt: number, now: number) {
    updateAutoTargets(this);
    updateMovement(this, dt);
    updateTransitions(this);
    updateMonsters(this, dt, now);
    updateCombat(this, dt, now);

    for (const nodeId of NODE_REGISTRY.keys()) {
      this.ensurePopulation(nodeId);
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

    const monster: MonsterState = {
      id,
      monsterTypeId: typeId,
      color: def.color,
      name: def.name,
      x, y,
      targetX: x,
      targetY: y,
      hp:      def.stats.hp,
      maxHp:   def.stats.hp,
      attack:  def.stats.attack,
      defense: def.stats.defense,
      speed:   def.stats.speed,
      state:   'idle',
      pullRange:      def.stats.pullRange,
      attackRange:    def.stats.attackRange,
      attackCooldown: def.stats.attackCooldown,
      lastAttackAt:   0,
      attackTargetId: null,
      nodeId,
      attackStyle: def.attackStyle,
    };

    this.monsters.set(id, monster);
    this.monsterAI.set(id, {
      spawnX: x,
      spawnY: y,
      wanderRadius:  def.ai.wanderRadius,
      idleUntil:     Date.now(),
      leashRange:    def.ai.leashRange,
      idleMinMs:     def.ai.idleMinMs,
      idleMaxMs:     def.ai.idleMaxMs,
      aggroTargetId: null,
    });

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
    const minDistSq = MIN_SPAWN_DIST ** 2;

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
   * Teleport a player to the starting clearing (node-2-2), restore full HP,
   * clear movement and combat state, and drop all monster aggro targeting them.
   * Queues the player ID in pendingDeaths so the server loop can emit the event.
   */
  respawnPlayer(playerId: string): void {
    const player = this.players.get(playerId);
    if (!player) return;

    const spawnX = GAME_CONFIG.NODE_WIDTH  / 2;
    const spawnY = GAME_CONFIG.NODE_HEIGHT / 2;

    player.nodeId       = 'node-2-2';
    player.x            = spawnX;
    player.y            = spawnY;
    player.targetX      = spawnX;
    player.targetY      = spawnY;
    player.hp           = player.maxHp;
    player.attackTargetId = null;
    player.auto         = false;

    this.playerCombatAt.delete(playerId);

    for (const ai of this.monsterAI.values()) {
      if (ai.aggroTargetId === playerId) ai.aggroTargetId = null;
    }

    this.pendingDeaths.push(playerId);
  }

  ensurePopulation(nodeId: string) {
    let count = 0;
    for (const m of this.monsters.values()) {
      if (m.nodeId === nodeId) count++;
    }
    while (count < GAME_CONFIG.MONSTERS_PER_NODE) {
      if (!this.spawnMonster(nodeId)) break;
      count++;
    }
  }

  // ── SNAPSHOT ───────────────────────────────────────

  buildSnapshot(nodeId: string) {
    return {
      players:  Array.from(this.players.values()).filter(p => p.nodeId === nodeId),
      monsters: Array.from(this.monsters.values()).filter(m => m.nodeId === nodeId),
    };
  }

  // ── UTIL ────────────────────────────────────────────

  randInt(lo: number, hi: number) {
    return Math.floor(Math.random() * (hi - lo + 1)) + lo;
  }
}
