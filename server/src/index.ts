import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';

import { World } from './world/World';
import { GAME_CONFIG, TEST_ROOM_NODE_ID, ESSENCE_TYPES, emptyEquipment } from '@mmo-idle/shared';
import { unlockSkill } from './systems/skills';
import { equipItem, unequipItem } from './systems/inventory';
import { craftRecipe } from './systems/crafting';
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  EquipmentSlot,
  NodeSnapshot,
} from '@mmo-idle/shared';
import { makeCombatState, resetCombatState, setCounter } from './systems/combatState';
import { db, runMigrations } from './db/index';
import { findOrCreateAccount, getOrCreateCharacter, saveCharacter } from './db/playerRepo';
import { initEnergyArchetype } from './systems/energyPrototype';
import { initCooldownArchetype } from './systems/cooldownPrototype';
import { initReloadArchetype } from './systems/reloadPrototype';
import { initDotArchetype } from './systems/dotPrototype';
import { registerClassMechanic, activateClassMechanics } from './systems/classMechanics';
import { initCadenceArchetype } from './systems/cadencePrototype';
import { initWeaponEffects } from './systems/weaponEffects';
import { recalculatePlayerStats } from './systems/stats';
import { initDefenseSystems } from './systems/defenseSystems';
import { initDebuffMechanics } from './systems/debuffMechanics';
import { IS_DEV } from './env';

export { IS_DEV };

// ── Setup ─────────────────────────────────────────────

const app = express();
// Allow all origins — this is a private LAN/friends game, no auth tokens in cookies.
app.use(cors({ origin: true }));
app.use(express.json());

// Serve the production client build when it exists.
// Run `pnpm --filter @mmo-idle/client build` to generate it.
const clientDist = path.resolve(__dirname, '../../client/dist');
app.use(express.static(clientDist));

const httpServer = createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: { origin: true },
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

// ── DATABASE ──────────────────────────────────────────

runMigrations();

// accountId → socketId map for the auto-save interval
const socketByAccount = new Map<string, string>();

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

// ── AUTO-SAVE ─────────────────────────────────────────
// Persist every connected player every 30 s as a crash safety net.
setInterval(() => {
  for (const [accountId, socketId] of socketByAccount) {
    const player = world.players.get(socketId);
    if (player) saveCharacter(db, accountId, player);
  }
}, 30_000);

// ── SOCKETS ──────────────────────────────────────────

io.on('connection', (socket) => {
  const auth = socket.handshake.auth as { accountId?: string; displayName?: string };
  const accId      = auth.accountId   ?? socket.id;
  const playerName = (auth.displayName ?? `Hero_${socket.id.slice(0, 5)}`).slice(0, 32);

  findOrCreateAccount(db, accId, playerName);
  const player = getOrCreateCharacter(db, accId, playerName, socket.id);

  socketByAccount.set(accId, socket.id);
  world.players.set(socket.id, player);
  world.playerCombatState.set(socket.id, makeCombatState());

  socket.emit('state:sync', world.buildSnapshot(player.nodeId));

  socket.on('player:move', ({ x, y }) => {
    const p = world.players.get(socket.id);
    if (!p) return;
    if (p.isChanneling) return;
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
    const succeeded = unlockSkill(p, skillId);
    if (succeeded) {
      socket.emit('player:ascended', p.currentSkillTier);
    }
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

  if (IS_DEV) {
    socket.on('debug:goToTestRoom', () => {
      const p = world.players.get(socket.id);
      if (!p) return;

      const spawnX = GAME_CONFIG.NODE_WIDTH / 2;
      const spawnY = GAME_CONFIG.NODE_HEIGHT / 2 - 200;

      p.nodeId = TEST_ROOM_NODE_ID;
      p.x = spawnX;
      p.y = spawnY;
      p.targetX = spawnX;
      p.targetY = spawnY;
      p.auto = false;
      p.attackTargetId = null;
      p.isChanneling = false;
      p.channelingPct = 0;

      world.playerCombatAt.delete(socket.id);
      for (const ai of world.monsterAI.values()) {
        if (ai.aggroTargetId === socket.id) ai.aggroTargetId = null;
      }
    });

    socket.on('debug:leaveTestRoom', () => {
      const p = world.players.get(socket.id);
      if (!p) return;
      // Wipe the infinite test-room essence stockpile so it can't leak into the live world.
      for (const type of ESSENCE_TYPES) p.essences[type] = 0;
      world.respawnPlayer(socket.id);
    });
  }

  socket.on('debug:resetProgress', () => {
    const p = world.players.get(socket.id);
    if (!p) return;

    // Wipe all progression
    p.unlockedSkills   = [];
    p.passives         = {};
    p.skillPoints      = 0;
    p.selectedClass    = null;
    p.selectedSubVariant = null;
    p.selectedRange    = null;
    p.currentSkillTier = 0;
    p.combatArchetype  = null;

    p.biomeXP          = {};
    p.biomeLevel       = {};
    p.unlockedRecipes  = [];

    p.inventory        = [];
    p.equipment        = emptyEquipment();

    // Reset archetype runtime state
    p.cadenceCount           = 0;
    p.cadenceThreshold       = 0;
    p.cadenceEmpoweredArmed  = false;
    p.cadenceSpeedStacks     = 0;
    p.ammoCount              = 0;
    p.ammoMax                = 0;
    p.executionReady         = false;
    p.executionCooldownPct   = 0;
    p.energyCount            = 0;
    p.empoweredReady         = false;

    // Rebuild stats from scratch and reset combat state
    recalculatePlayerStats(p);
    const cs = world.playerCombatState.get(socket.id);
    if (cs) resetCombatState(cs);

    world.respawnPlayer(socket.id);
  });

  socket.on('disconnect', () => {
    const p = world.players.get(socket.id);
    if (p) saveCharacter(db, accId, p);
    socketByAccount.delete(accId);
    world.players.delete(socket.id);
    world.playerCombatAt.delete(socket.id);
    world.playerCombatState.delete(socket.id);
  });
});

// ── START ────────────────────────────────────────────

httpServer.listen(4000, () => {
  console.log('Server running on http://localhost:4000');
});