import type { PlayerState, MonsterState, NodeDefinition } from '@mmo-idle/shared';
import { updateAutoTargets } from '../systems/autoTarget';
import { updateMovement } from '../systems/movement';
import { updateMonsters } from '../systems/ai';
import { updateCombat } from '../systems/combat';
import { updateTransitions } from '../systems/transitions';
import { GAME_CONFIG } from '@mmo-idle/shared';
import { NODE_REGISTRY } from './nodeRegistry';

export interface SlimeAI {
  spawnX: number;
  spawnY: number;
  wanderRadius: number;
  idleUntil: number;
  leashRange: number;
  aggroTargetId: string | null;
}

export class World {
  readonly nodeId: string;
  readonly node: NodeDefinition;

  players = new Map<string, PlayerState>();
  monsters = new Map<string, MonsterState>();
  slimeAI = new Map<string, SlimeAI>();
  playerCombatAt = new Map<string, number>();

  nextMonsterId = 1;

  constructor(nodeId = 'node-1') {
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
  createMonster(nodeId: string, x: number, y: number): MonsterState {
    const id = `monster-${this.nextMonsterId++}`;

    const monster: MonsterState = {
      id,
      name: 'Slime',
      x,
      y,
      targetX: x,
      targetY: y,
      hp: GAME_CONFIG.MONSTER_HP,
      maxHp: GAME_CONFIG.MONSTER_HP,
      attack: GAME_CONFIG.MONSTER_ATTACK,
      defense: GAME_CONFIG.MONSTER_DEFENSE,
      speed: GAME_CONFIG.SLIME_SPEED,
      state: 'idle',
      pullRange: GAME_CONFIG.SLIME_PULL_RANGE,
      attackRange: GAME_CONFIG.SLIME_ATTACK_RANGE,
      attackCooldown: GAME_CONFIG.SLIME_ATTACK_COOLDOWN,
      lastAttackAt: 0,
      attackTargetId: null,
      nodeId,
    };

    this.monsters.set(id, monster);

    this.slimeAI.set(id, {
      spawnX: x,
      spawnY: y,
      wanderRadius: GAME_CONFIG.SLIME_WANDER_RADIUS,
      idleUntil: Date.now(),
      leashRange: GAME_CONFIG.SLIME_LEASH_RANGE,
      aggroTargetId: null,
    });

    return monster;
  }

  spawnMonster(nodeId: string): boolean {
    const MAX_ATTEMPTS = 15;
    const minDistSq = GAME_CONFIG.SLIME_MIN_SPAWN_DIST ** 2;
    // Use the target node's dimensions, not the world's home node.
    const node = NODE_REGISTRY.get(nodeId) ?? this.node;

    for (let i = 0; i < MAX_ATTEMPTS; i++) {
      const x = Math.floor(Math.random() * (node.width  - 128)) + 64;
      const y = Math.floor(Math.random() * (node.height - 128)) + 64;

      let tooClose = false;

      for (const m of this.monsters.values()) {
        if (m.nodeId !== nodeId) continue; // only check same-node monsters
        const dx = m.x - x;
        const dy = m.y - y;
        if (dx * dx + dy * dy < minDistSq) {
          tooClose = true;
          break;
        }
      }

      if (tooClose) continue;

      this.createMonster(nodeId, x, y);
      return true;
    }

    return false;
  }

  ensurePopulation(nodeId: string) {
    // Count only monsters that belong to this node.
    let count = 0;
    for (const m of this.monsters.values()) {
      if (m.nodeId === nodeId) count++;
    }
    while (count < GAME_CONFIG.MONSTERS_PER_NODE) {
      if (!this.spawnMonster(nodeId)) break; // stop if all attempts fail
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