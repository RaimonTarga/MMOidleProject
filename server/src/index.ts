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
  NodeSnapshot,
} from '@mmo-idle/shared';
import { emptyEquipment } from '@mmo-idle/shared';
import { makeCombatState, setCounter } from './systems/combatState';
import { initEnergyArchetype } from './systems/energyPrototype';
import { initCooldownArchetype } from './systems/cooldownPrototype';
import { initReloadArchetype } from './systems/reloadPrototype';
import { initDotArchetype } from './systems/dotPrototype';
import { registerClassMechanic, activateClassMechanics } from './systems/classMechanics';
import { initCadenceArchetype } from './systems/cadencePrototype';
import { initWeaponEffects } from './systems/weaponEffects';
import { initDefenseSystems } from './systems/defenseSystems';
import { initDebuffMechanics } from './systems/debuffMechanics';

// ── Setup ─────────────────────────────────────────────

const app = express();
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

const httpServer = createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: { origin: 'http://localhost:3000' },
});

// ── COMBAT EFFECTS ────────────────────────────────────
// Phase 1: declare which mechanics belong to each class.

registerClassMechanic('cadence',  initCadenceArchetype);
registerClassMechanic('cooldown', initCooldownArchetype);
registerClassMechanic('energy',   initEnergyArchetype);
registerClassMechanic('reload',   initReloadArchetype);
registerClassMechanic('dot',      initDotArchetype);

// Phase 2: activate — calls each registered init, which registers combat
// pipeline listeners. Add a new class here when it is ready to go live.
activateClassMechanics('cadence');
activateClassMechanics('cooldown');
activateClassMechanics('energy');
activateClassMechanics('reload');
activateClassMechanics('dot');

// ── WEAPON EFFECTS ────────────────────────────────────────────────────────────
// Registers combat pipeline hooks for weapon-specific mechanics (Chaotic Axe,
// Sacred Cross, Ashbrand Blade). Works for any class — weapon and class effects
// layer independently.
initWeaponEffects();

// ── DEFENSE SYSTEMS ───────────────────────────────────────────────────────────
// Registers onDamageTaken listeners for evasion and shield absorption.
// Must run after weapon effects (lower pipeline priority = runs later in order).
initDefenseSystems();

// ── DEBUFF MECHANICS ──────────────────────────────────────────────────────────
// Registers onDamageTaken listeners that apply debuff multipliers (vulnerability).
initDebuffMechanics();

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

const LOGIC_MS     = Math.round(1000 / GAME_CONFIG.LOGIC_TICK_RATE);
const BROADCAST_MS = Math.round(1000 / GAME_CONFIG.BROADCAST_TICK_RATE);

let last = Date.now();

// Simulation tick — 10 Hz. Drives all game logic: movement, combat, AI, DoT.
// Running at 100 ms gives ≤99 ms attack quantization vs ≤499 ms at 2 Hz.
setInterval(() => {
  const now = Date.now();
  const dt  = now - last;
  last = now;

  world.tick(dt, now);

  // Emit death events immediately so the client overlay shows before the next snapshot.
  for (const playerId of world.pendingDeaths) {
    io.sockets.sockets.get(playerId)?.emit('player:died');
  }
  world.pendingDeaths = [];
}, LOGIC_MS);

// Broadcast tick — 5 Hz. Sends authoritative state snapshots to each player.
// Decoupled from the simulation so network cost doesn't scale with logic rate.
// buildSnapshot is called once per node so all players in a node share the same
// event queue flush — without this, the first player drains events and others see none.
setInterval(() => {
  const nodeSnaps = new Map<string, NodeSnapshot>();
  for (const [socketId, player] of world.players) {
    const sock = io.sockets.sockets.get(socketId);
    if (!sock) continue;
    if (!nodeSnaps.has(player.nodeId)) {
      nodeSnaps.set(player.nodeId, world.buildSnapshot(player.nodeId));
    }
    sock.emit('node:state', nodeSnaps.get(player.nodeId)!);
  }
}, BROADCAST_MS);

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
    plating: GAME_CONFIG.PLAYER_PLATING,
    damageReduction: 0,
    evasion: 0,
    evasionCount: 0,
    shields: [],
    attackRange: GAME_CONFIG.PLAYER_ATTACK_RANGE,
    attackCooldown: GAME_CONFIG.PLAYER_ATTACK_COOLDOWN,
    lastAttackAt: 0,
    attackTargetId: null,
    auto: false,
    nodeId: world.nodeId,
    essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
    level: 0,
    skillPoints: 0,
    unlockedSkills: [],
    passives: {},
    cadenceSpeedStacks: 0,
    currentSkillTier: 0,
    hpRegen: GAME_CONFIG.PLAYER_HP_REGEN,
    speed: GAME_CONFIG.PLAYER_SPEED,
    attackStyle: 'slash',
    inventory: ['basic-sword'],
    equipment: emptyEquipment(),
    biomeKills: {},
    recipeProgress: {},
    combatArchetype:      null,
    selectedClass:        null,
    selectedSubVariant:   null,
    selectedRange:        null,
    cadenceCount:         0,
    cadenceThreshold:     0,
    cadenceEmpoweredArmed: false,
    ammoCount:            0,
    ammoMax:              0,
    executionReady:       false,
    executionCooldownPct: 0,
    energyCount:          0,
    empoweredReady:       false,
    targetDotStacks:      0,
    targetChillStacks:    0,
    sacredBuffActive:     false,
    sacredBuffPct:        0,
    isChanneling:         false,
    channelingPct:        0,
    activeBuffs:          [],
    questProgress:        {},
    playerTier:           0,
  };

  // Auto-equip the starter weapon so new players immediately benefit from it
  equipItem(player, 'basic-sword');

  world.players.set(socket.id, player);
  world.playerCombatState.set(socket.id, makeCombatState());

  socket.emit('state:sync', world.buildSnapshot(player.nodeId));

  socket.on('player:move', ({ x, y }) => {
    const p = world.players.get(socket.id);
    if (!p) return;
    if (p.isChanneling) return; // position locked during Channeled Beam
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
    // recalculatePlayerStats (called inside unlockSkill) always resets
    // player.cadenceCount to 0 for cadence players — including when picking a
    // T2 range node that doesn't change the threshold. Mirror that reset into
    // the authoritative CombatState counter so display and combat logic agree.
    if (p.combatArchetype === 'cadence') {
      const cs = world.playerCombatState.get(socket.id);
      if (cs) setCounter(cs, 'cadenceCount', 0);
    }
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
    world.playerCombatState.delete(socket.id);
  });
});

// ── START ────────────────────────────────────────────

httpServer.listen(4000, () => {
  console.log('Server running on http://localhost:4000');
});