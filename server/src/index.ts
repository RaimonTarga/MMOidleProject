import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  PlayerState,
  MonsterState,
} from '@mmo-idle/shared';
import { GAME_CONFIG } from '@mmo-idle/shared';

// ── Express / Socket.IO setup ─────────────────────────────────────────────────

const app = express();
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

const httpServer = createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: { origin: 'http://localhost:3000' },
});

// ── In-memory game state ──────────────────────────────────────────────────────

const players  = new Map<string, PlayerState>();
const monsters = new Map<string, MonsterState>();

/**
 * Server-only AI bookkeeping per monster — not broadcast to clients.
 * Keeping this separate means MonsterState stays a clean network type.
 */
interface SlimeAI {
  spawnX: number;
  spawnY: number;
  wanderRadius: number;
  /** Timestamp (ms) when the slime may leave idle and pick a new wander target. */
  idleUntil: number;
  /** Pixel radius from spawn before a chasing slime gives up and returns. */
  leashRange: number;
  /** The player ID this slime is currently chasing / attacking, or null. */
  aggroTargetId: string | null;
}

const slimeAI = new Map<string, SlimeAI>();

/** Timestamp of the last tick in which each player took damage (for regen gating). */
const playerCombatAt = new Map<string, number>();

// ── HTTP routes ───────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', players: players.size, monsters: monsters.size });
});

// ── Utility ───────────────────────────────────────────────────────────────────

const clamp  = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const randInt = (lo: number, hi: number) => Math.floor(Math.random() * (hi - lo + 1)) + lo;

// ── Movement ──────────────────────────────────────────────────────────────────

/** Anything that can move toward a target — players, mobs, NPCs. */
interface Movable {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
}

/** Advance `entity` toward its target by at most one dt-step at `speed` px/s. */
function moveTowardTarget(entity: Movable, dt: number, speed: number): void {
  const dx = entity.targetX - entity.x;
  const dy = entity.targetY - entity.y;
  const distSq = dx * dx + dy * dy;
  if (distSq < 1) {
    entity.x = entity.targetX;
    entity.y = entity.targetY;
    return;
  }
  const dist = Math.sqrt(distSq);
  const step = speed * (dt / 1000);
  if (step >= dist) {
    entity.x = entity.targetX;
    entity.y = entity.targetY;
  } else {
    entity.x += (dx / dist) * step;
    entity.y += (dy / dist) * step;
  }
}

// ── Monster spawning ──────────────────────────────────────────────────────────

let nextMonsterId = 1;

/**
 * Attempt to spawn a slime at a random position within the node.
 * Retries up to MAX_ATTEMPTS times to satisfy the minimum separation from
 * existing monsters.  Returns true on success, false if no valid spot was found.
 */
function spawnMonster(nodeId: string): boolean {
  const MAX_ATTEMPTS = 15;
  const minDistSq = GAME_CONFIG.SLIME_MIN_SPAWN_DIST ** 2;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const x = Math.floor(Math.random() * (GAME_CONFIG.NODE_WIDTH  - 128)) + 64;
    const y = Math.floor(Math.random() * (GAME_CONFIG.NODE_HEIGHT - 128)) + 64;

    let tooClose = false;
    for (const m of monsters.values()) {
      const dx = m.x - x;
      const dy = m.y - y;
      if (dx * dx + dy * dy < minDistSq) { tooClose = true; break; }
    }
    if (tooClose) continue;

    const id: string = `monster-${nextMonsterId++}`;
    const monster: MonsterState = {
      id,
      name: 'Slime',
      x, y,
      targetX: x, targetY: y,
      hp:            GAME_CONFIG.MONSTER_HP,
      maxHp:         GAME_CONFIG.MONSTER_HP,
      attack:        GAME_CONFIG.MONSTER_ATTACK,
      defense:       GAME_CONFIG.MONSTER_DEFENSE,
      speed:         GAME_CONFIG.SLIME_SPEED,
      state:         'idle',
      pullRange:     GAME_CONFIG.SLIME_PULL_RANGE,
      attackRange:   GAME_CONFIG.SLIME_ATTACK_RANGE,
      attackCooldown: GAME_CONFIG.SLIME_ATTACK_COOLDOWN,
      lastAttackAt:  0,
      attackTargetId: null,
      nodeId,
    };
    monsters.set(id, monster);
    slimeAI.set(id, {
      spawnX: x,
      spawnY: y,
      wanderRadius: GAME_CONFIG.SLIME_WANDER_RADIUS,
      // Stagger initial idle times so slimes don't all start wandering at once.
      idleUntil:    Date.now() + randInt(GAME_CONFIG.SLIME_IDLE_MIN, GAME_CONFIG.SLIME_IDLE_MAX),
      leashRange:   GAME_CONFIG.SLIME_LEASH_RANGE,
      aggroTargetId: null,
    });
    return true;
  }
  return false;
}

// Initial population
for (let i = 0; i < GAME_CONFIG.MONSTERS_PER_NODE; i++) {
  spawnMonster('node-1');
}

// ── Auto-targeting ────────────────────────────────────────────────────────────

/**
 * For every player with auto enabled, set their movement target to the nearest
 * monster — or hold position if already in attack range.
 * Runs first in the tick so movement uses the freshly computed target.
 */
function updateAutoTargets(): void {
  for (const player of players.values()) {
    if (!player.auto) continue;

    let nearest: MonsterState | null = null;
    let bestDistSq = Infinity;

    for (const monster of monsters.values()) {
      const dx = monster.x - player.x;
      const dy = monster.y - player.y;
      const dSq = dx * dx + dy * dy;
      if (dSq < bestDistSq) { bestDistSq = dSq; nearest = monster; }
    }

    if (!nearest) continue;

    // Target a stop-point on the approach line rather than the monster's centre.
    // approachPoint returns the caller's current position when already in range,
    // so the player holds naturally without a separate "in range" branch.
    const stop     = approachPoint(player.x, player.y, nearest.x, nearest.y, player.attackRange - 5);
    player.targetX = stop.x;
    player.targetY = stop.y;
  }
}

// ── Monster AI ────────────────────────────────────────────────────────────────

/**
 * Return the nearest player within `monster.pullRange`, or null if none.
 */
function findAggroTarget(monster: MonsterState): PlayerState | null {
  const pullSq = monster.pullRange ** 2;
  let nearest: PlayerState | null = null;
  let bestSq = Infinity;

  for (const player of players.values()) {
    const dx = player.x - monster.x;
    const dy = player.y - monster.y;
    const dSq = dx * dx + dy * dy;
    if (dSq < pullSq && dSq < bestSq) { bestSq = dSq; nearest = player; }
  }
  return nearest;
}

/** Tick all monster state machines: idle ↔ wandering ↔ chasing ↔ attacking ↔ returning. */
function updateMonsters(dt: number, now: number): void {
  for (const [id, monster] of monsters) {
    const ai = slimeAI.get(id);
    if (!ai) continue;

    if (monster.state === 'idle' || monster.state === 'wandering') {
      // Check for nearby players before doing anything else.
      const target = findAggroTarget(monster);
      if (target) {
        ai.aggroTargetId = target.id;
        monster.state    = 'chasing';
        // fall through to chasing logic below
      } else if (monster.state === 'idle') {
        if (now >= ai.idleUntil) {
          const angle  = Math.random() * Math.PI * 2;
          const radius = Math.random() * ai.wanderRadius;
          monster.targetX = clamp(ai.spawnX + Math.cos(angle) * radius, 32, GAME_CONFIG.NODE_WIDTH  - 32);
          monster.targetY = clamp(ai.spawnY + Math.sin(angle) * radius, 32, GAME_CONFIG.NODE_HEIGHT - 32);
          monster.state   = 'wandering';
        }
      } else {
        // wandering — advance toward wander target
        moveTowardTarget(monster, dt, monster.speed);
        const dx = monster.targetX - monster.x;
        const dy = monster.targetY - monster.y;
        if (dx * dx + dy * dy < 4 * 4) {
          monster.state   = 'idle';
          monster.targetX = monster.x;
          monster.targetY = monster.y;
          ai.idleUntil    = now + randInt(GAME_CONFIG.SLIME_IDLE_MIN, GAME_CONFIG.SLIME_IDLE_MAX);
        }
      }
    }

    if (monster.state === 'chasing') {
      const target = ai.aggroTargetId ? players.get(ai.aggroTargetId) : null;

      // Drop aggro: target gone or leash exceeded.
      if (!target) {
        ai.aggroTargetId = null;
        monster.state    = 'returning';
      } else {
        const toSpawnSq = (monster.x - ai.spawnX) ** 2 + (monster.y - ai.spawnY) ** 2;
        if (toSpawnSq > ai.leashRange ** 2) {
          ai.aggroTargetId = null;
          monster.state    = 'returning';
        } else {
          const dx     = target.x - monster.x;
          const dy     = target.y - monster.y;
          const distSq = dx * dx + dy * dy;
          // Approach to a stop-point rather than the player's exact centre.
          const stop       = approachPoint(monster.x, monster.y, target.x, target.y, monster.attackRange - 5);
          monster.targetX  = stop.x;
          monster.targetY  = stop.y;
          if (distSq <= monster.attackRange ** 2) {
            monster.state = 'attacking';
          } else {
            moveTowardTarget(monster, dt, monster.speed);
          }
        }
      }
    }

    if (monster.state === 'attacking') {
      const target = ai.aggroTargetId ? players.get(ai.aggroTargetId) : null;

      if (!target) {
        ai.aggroTargetId = null;
        monster.state    = 'returning';
      } else {
        const dx     = target.x - monster.x;
        const dy     = target.y - monster.y;
        const distSq = dx * dx + dy * dy;
        if (distSq > monster.attackRange ** 2) {
          // Target moved out — resume chasing.
          monster.state = 'chasing';
        }
        // Damage is handled by processCombat; no movement while attacking.
        monster.targetX = monster.x;
        monster.targetY = monster.y;
      }
    }

    if (monster.state === 'returning') {
      monster.targetX = ai.spawnX;
      monster.targetY = ai.spawnY;
      moveTowardTarget(monster, dt, monster.speed);

      // Check if a new player entered pull range mid-return.
      const newTarget = findAggroTarget(monster);
      if (newTarget) {
        ai.aggroTargetId = newTarget.id;
        monster.state    = 'chasing';
      } else {
        const dx = ai.spawnX - monster.x;
        const dy = ai.spawnY - monster.y;
        if (dx * dx + dy * dy < 4 * 4) {
          monster.x       = ai.spawnX;
          monster.y       = ai.spawnY;
          monster.targetX = ai.spawnX;
          monster.targetY = ai.spawnY;
          monster.state   = 'idle';
          ai.idleUntil    = now + randInt(GAME_CONFIG.SLIME_IDLE_MIN, GAME_CONFIG.SLIME_IDLE_MAX);
        }
      }
    }
  }
}

/**
 * Return the point on the line from (fromX,fromY)→(toX,toY) that is exactly
 * stopDist px away from (toX,toY).  If the caller is already within stopDist,
 * returns the caller's current position — they hold rather than closing further.
 *
 * Used to give approaching entities a stable stop-point so they never need to
 * be pushed apart after the fact.
 */
function approachPoint(
  fromX: number, fromY: number,
  toX:   number, toY:   number,
  stopDist: number,
): { x: number; y: number } {
  const dx   = toX - fromX;
  const dy   = toY - fromY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist <= stopDist) return { x: fromX, y: fromY };
  const t = (dist - stopDist) / dist;
  return { x: fromX + dx * t, y: fromY + dy * t };
}

// ── Combat ────────────────────────────────────────────────────────────────────

function processCombat(dt: number, now: number): void {
  // ── Player → Monster ───────────────────────────────────────────────────────
  for (const player of players.values()) {
    let target: MonsterState | null = null;
    let bestDist = Infinity;

    for (const monster of monsters.values()) {
      const dx   = monster.x - player.x;
      const dy   = monster.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= player.attackRange && dist < bestDist) { bestDist = dist; target = monster; }
    }

    player.attackTargetId = target?.id ?? null;

    if (target) {
      if (now - player.lastAttackAt >= player.attackCooldown) {
        const dmg = Math.max(1, player.attack - target.defense);
        target.hp = Math.max(0, target.hp - dmg);
        player.lastAttackAt = now;

        if (target.hp <= 0) {
          const deadId = target.id;
          monsters.delete(deadId);
          slimeAI.delete(deadId);
          setTimeout(() => {
            if (monsters.size < GAME_CONFIG.MONSTERS_PER_NODE) spawnMonster('node-1');
          }, GAME_CONFIG.MONSTER_RESPAWN_DELAY);
        }
      }
    } else {
      // Out of combat — regen after delay
      const lastHit = playerCombatAt.get(player.id) ?? 0;
      if (now - lastHit > GAME_CONFIG.COMBAT_REGEN_DELAY) {
        player.hp = Math.min(player.maxHp, player.hp + GAME_CONFIG.PLAYER_HP_REGEN * (dt / 1000));
      }
    }
  }

  // ── Monster → Player ───────────────────────────────────────────────────────
  for (const [id, monster] of monsters) {
    const ai = slimeAI.get(id);
    if (!ai || monster.state !== 'attacking') {
      monster.attackTargetId = null;
      continue;
    }

    const target = ai.aggroTargetId ? players.get(ai.aggroTargetId) : null;
    if (!target) { monster.attackTargetId = null; continue; }

    const dx   = target.x - monster.x;
    const dy   = target.y - monster.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > monster.attackRange) { monster.attackTargetId = null; continue; }

    monster.attackTargetId = target.id;

    if (now - monster.lastAttackAt >= monster.attackCooldown) {
      const dmg = Math.max(1, monster.attack - target.defense);
      target.hp = Math.max(0, target.hp - dmg);
      monster.lastAttackAt = now;
      playerCombatAt.set(target.id, now);
    }
  }
}

// ── Game loop ─────────────────────────────────────────────────────────────────

const TICK_MS = Math.round(1000 / GAME_CONFIG.TICK_RATE);

function tick(dt: number, now: number): void {
  updateAutoTargets();                           // 1. auto players pick targets
  for (const player of players.values()) {
    moveTowardTarget(player, dt, GAME_CONFIG.PLAYER_SPEED);
  }
  updateMonsters(dt, now);                       // 2. monster AI + movement
  processCombat(dt, now);                        // 3. damage on final positions
}

function buildSnapshot() {
  return {
    players:  Array.from(players.values()),
    monsters: Array.from(monsters.values()),
  };
}

let lastTickAt = Date.now();

setInterval(() => {
  const now = Date.now();
  const dt  = now - lastTickAt;
  lastTickAt = now;
  tick(dt, now);
  if (players.size > 0) io.emit('node:state', buildSnapshot());
}, TICK_MS);

// ── Socket.IO event handlers ──────────────────────────────────────────────────

io.on('connection', (socket) => {
  console.log(`[+] Player connected:    ${socket.id}`);

  const spawnX = Math.floor(Math.random() * (GAME_CONFIG.NODE_WIDTH  - 64)) + 32;
  const spawnY = Math.floor(Math.random() * (GAME_CONFIG.NODE_HEIGHT - 64)) + 32;

  const player: PlayerState = {
    id:      socket.id,
    name:    `Hero_${socket.id.slice(0, 5)}`,
    x:       spawnX,
    y:       spawnY,
    targetX: spawnX,
    targetY: spawnY,
    hp:           GAME_CONFIG.PLAYER_MAX_HP,
    maxHp:        GAME_CONFIG.PLAYER_MAX_HP,
    attack:       GAME_CONFIG.PLAYER_ATTACK,
    defense:      GAME_CONFIG.PLAYER_DEFENSE,
    attackRange:  GAME_CONFIG.PLAYER_ATTACK_RANGE,
    attackCooldown: GAME_CONFIG.PLAYER_ATTACK_COOLDOWN,
    lastAttackAt: 0,
    attackTargetId: null,
    auto:    false,
    nodeId:  'node-1',
  };

  players.set(socket.id, player);
  socket.emit('state:sync', buildSnapshot());
  socket.broadcast.emit('player:joined', player);

  socket.on('player:move', ({ x, y }) => {
    const p = players.get(socket.id);
    if (!p) return;
    p.targetX = clamp(x, 0, GAME_CONFIG.NODE_WIDTH);
    p.targetY = clamp(y, 0, GAME_CONFIG.NODE_HEIGHT);
  });

  socket.on('player:setAuto', (enabled) => {
    const p = players.get(socket.id);
    if (!p) return;
    p.auto = enabled;
  });

  socket.on('disconnect', (reason) => {
    console.log(`[-] Player disconnected: ${socket.id} (${reason})`);
    players.delete(socket.id);
    playerCombatAt.delete(socket.id);
    io.emit('player:left', socket.id);
  });
});

// ── Start server ──────────────────────────────────────────────────────────────

const PORT = Number(process.env.PORT ?? 4000);

httpServer.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
  console.log(`Health check:   http://localhost:${PORT}/health`);
});
