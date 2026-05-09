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

// ── Express setup ─────────────────────────────────────────────────────────────

const app = express();
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

const httpServer = createServer(app);

// ── Socket.IO setup ───────────────────────────────────────────────────────────

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: { origin: 'http://localhost:3000' },
});

// ── In-memory game state ──────────────────────────────────────────────────────

const players = new Map<string, PlayerState>();
const monsters = new Map<string, MonsterState>();

// ── HTTP routes ───────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', players: players.size, monsters: monsters.size });
});

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

// ── Monster spawner ───────────────────────────────────────────────────────────

let nextMonsterId = 1;

function spawnMonster(nodeId: string): MonsterState {
  const x = Math.floor(Math.random() * (GAME_CONFIG.NODE_WIDTH - 64)) + 32;
  const y = Math.floor(Math.random() * (GAME_CONFIG.NODE_HEIGHT - 64)) + 32;
  return {
    id: `monster-${nextMonsterId++}`,
    name: 'Slime',
    x,
    y,
    targetX: x,
    targetY: y,
    hp: GAME_CONFIG.MONSTER_HP,
    maxHp: GAME_CONFIG.MONSTER_HP,
    nodeId,
  };
}

for (let i = 0; i < GAME_CONFIG.MONSTERS_PER_NODE; i++) {
  const m = spawnMonster('node-1');
  monsters.set(m.id, m);
}

// ── Game loop ─────────────────────────────────────────────────────────────────

const TICK_MS = Math.round(1000 / GAME_CONFIG.TICK_RATE); // 500 ms at 2 Hz

function tick(dt: number): void {
  for (const player of players.values()) {
    moveTowardTarget(player, dt, GAME_CONFIG.PLAYER_SPEED);
  }
  // Monster movement (patrol, aggro) goes here in a later step.
}

function buildSnapshot() {
  return {
    players: Array.from(players.values()),
    monsters: Array.from(monsters.values()),
  };
}

let lastTickAt = Date.now();

setInterval(() => {
  const now = Date.now();
  tick(now - lastTickAt);
  lastTickAt = now;

  if (players.size > 0) {
    io.emit('node:state', buildSnapshot());
  }
}, TICK_MS);

// ── Socket.IO event handlers ──────────────────────────────────────────────────

io.on('connection', (socket) => {
  console.log(`[+] Player connected:    ${socket.id}`);

  const spawnX = Math.floor(Math.random() * (GAME_CONFIG.NODE_WIDTH - 64)) + 32;
  const spawnY = Math.floor(Math.random() * (GAME_CONFIG.NODE_HEIGHT - 64)) + 32;

  const player: PlayerState = {
    id: socket.id,
    name: `Hero_${socket.id.slice(0, 5)}`,
    x: spawnX,
    y: spawnY,
    targetX: spawnX,
    targetY: spawnY,
    nodeId: 'node-1',
  };

  players.set(socket.id, player);

  // Send full snapshot (players + monsters) to the joining client.
  socket.emit('state:sync', buildSnapshot());

  // Tell everyone else a new player appeared.
  socket.broadcast.emit('player:joined', player);

  socket.on('player:move', ({ x, y }) => {
    const p = players.get(socket.id);
    if (!p) return;
    // Clamp to node bounds; tick advances position. AI patrol uses this same path.
    p.targetX = Math.max(0, Math.min(x, GAME_CONFIG.NODE_WIDTH));
    p.targetY = Math.max(0, Math.min(y, GAME_CONFIG.NODE_HEIGHT));
  });

  socket.on('disconnect', (reason) => {
    console.log(`[-] Player disconnected: ${socket.id} (${reason})`);
    players.delete(socket.id);
    io.emit('player:left', socket.id);
  });
});

// ── Start server ──────────────────────────────────────────────────────────────

const PORT = Number(process.env.PORT ?? 4000);

httpServer.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
  console.log(`Health check:   http://localhost:${PORT}/health`);
});
