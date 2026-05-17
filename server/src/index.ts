import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

import { World } from './world/World';
import { GAME_CONFIG } from '@mmo-idle/shared';
import { unlockSkill } from './systems/skills';
import { equipItem, unequipItem } from './systems/inventory';
import { craftRecipe } from './systems/crafting';
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  PlayerState,
  EquipmentSlot,
} from '@mmo-idle/shared';
import { emptyEquipment } from '@mmo-idle/shared';

// ── Setup ─────────────────────────────────────────────

const app = express();
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

const httpServer = createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: { origin: 'http://localhost:3000' },
});

// ── WORLD ─────────────────────────────────────────────

const world = new World();

// ── HEALTH ────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    players: world.players.size,
    monsters: world.monsters.size,
  });
});

// ── GAME LOOP ─────────────────────────────────────────

const TICK_MS = Math.round(1000 / GAME_CONFIG.TICK_RATE);

let last = Date.now();

setInterval(() => {
  const now = Date.now();
  const dt = now - last;
  last = now;

  world.tick(dt, now);

  for (const [socketId, player] of world.players) {
    const sock = io.sockets.sockets.get(socketId);
    if (sock) sock.emit('node:state', world.buildSnapshot(player.nodeId));
  }
}, TICK_MS);

// ── SOCKETS ──────────────────────────────────────────

io.on('connection', (socket) => {
  const spawnX = Math.random() * GAME_CONFIG.NODE_WIDTH;
  const spawnY = Math.random() * GAME_CONFIG.NODE_HEIGHT;

  const player: PlayerState = {
    id: socket.id,
    name: `Hero_${socket.id.slice(0, 5)}`,
    x: spawnX,
    y: spawnY,
    targetX: spawnX,
    targetY: spawnY,
    hp: GAME_CONFIG.PLAYER_MAX_HP,
    maxHp: GAME_CONFIG.PLAYER_MAX_HP,
    attack: GAME_CONFIG.PLAYER_ATTACK,
    defense: GAME_CONFIG.PLAYER_DEFENSE,
    attackRange: GAME_CONFIG.PLAYER_ATTACK_RANGE,
    attackCooldown: GAME_CONFIG.PLAYER_ATTACK_COOLDOWN,
    lastAttackAt: 0,
    attackTargetId: null,
    auto: false,
    nodeId: world.nodeId,
    essence: 0,
    level: 0,
    skillPoints: 0,
    unlockedSkills: [],
    selectedClass: null,
    currentSkillTier: 0,
    hpRegen: GAME_CONFIG.PLAYER_HP_REGEN,
    speed: GAME_CONFIG.PLAYER_SPEED,
    inventory: ['basic-sword'],
    equipment: emptyEquipment(),
    recipeProgress: { forest: 1 },
  };

  // Auto-equip the starter weapon so new players immediately benefit from it
  equipItem(player, 'basic-sword');

  world.players.set(socket.id, player);

  socket.emit('state:sync', world.buildSnapshot(player.nodeId));

  socket.on('player:move', ({ x, y }) => {
    const p = world.players.get(socket.id);
    if (!p) return;
    p.targetX = x;
    p.targetY = y;
  });

  socket.on('player:setAuto', (enabled) => {
    const p = world.players.get(socket.id);
    if (!p) return;
    p.auto = enabled;
  });

  socket.on('player:unlockSkill', (skillId) => {
    const p = world.players.get(socket.id);
    if (!p) return;
    unlockSkill(p, skillId);
  });

  socket.on('inventory:equipItem', (definitionId) => {
    const p = world.players.get(socket.id);
    if (!p) return;
    equipItem(p, definitionId);
  });

  socket.on('inventory:unequip', (slot: EquipmentSlot) => {
    const p = world.players.get(socket.id);
    if (!p) return;
    unequipItem(p, slot);
  });

  socket.on('crafting:craftRecipe', (recipeId: string) => {
    const p = world.players.get(socket.id);
    if (!p) return;
    const result = craftRecipe(p, recipeId);
    socket.emit('crafting:result', result);
  });

  socket.on('disconnect', () => {
    world.players.delete(socket.id);
    world.playerCombatAt.delete(socket.id);
  });
});

// ── START ────────────────────────────────────────────

httpServer.listen(4000, () => {
  console.log('Server running on http://localhost:4000');
});