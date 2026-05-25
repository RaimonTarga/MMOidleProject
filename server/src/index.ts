import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';

import { World } from './world/World';
import { GAME_CONFIG, TEST_ROOM_NODE_ID, ESSENCE_TYPES, vectorTo, zeroMotion } from '@mmo-idle/shared';
import { unlockSkill } from './systems/skills';
import { equipItem, unequipItem } from './systems/inventory';
import { craftRecipe } from './systems/crafting';
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  EquipmentSlot,
  NodeSnapshot,
} from '@mmo-idle/shared';
import { db, runMigrations } from './db/index';
import { findOrCreateAccount, getOrCreateCharacter, saveCharacterFromEntity } from './db/playerRepo';
import { initAllMechanics } from './systems/classes/registry';
import { initWeaponEffects } from './systems/weaponEffects';
import { initDefenseSystems } from './systems/defenseSystems';
import { initDebuffMechanics } from './systems/debuffMechanics';
import { assembleMonsterSnapshot, diffMonsterRoundTrip, diffPlayerRoundTrip } from './ecs/projection';
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
// Each class mechanic is declared in server/src/systems/classes/<name>/index.ts
// via `defineMechanic({ id, init, tick, buffs })`. The registry's
// `initAllMechanics` calls every module's init in MODULES order — combat
// pipeline listeners get registered exactly once.
initAllMechanics();

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

// ── WIRE PARITY CHECK (dev only) ──────────────────────
//
// Server Phase 4: validate that `decompose → assemble` round-trips every
// active monster snapshot. A non-empty diff means a slice or projection
// helper is missing a field; failing fast here prevents broken broadcasts.
if (IS_DEV) {
  let totalChecked = 0;
  const failures: { id: string; fields: string[] }[] = [];
  for (const e of world.monsterEntities) {
    const snapshot = assembleMonsterSnapshot(e);
    const diff = diffMonsterRoundTrip(snapshot);
    totalChecked++;
    if (diff.length > 0) failures.push({ id: e.isMonster.id, fields: diff });
  }
  if (failures.length > 0) {
    console.error('[wire-parity] MonsterSnapshot round-trip failed:', failures);
  } else {
    console.log(`[wire-parity] MonsterSnapshot round-trip OK (${totalChecked} monsters)`);
  }
}

// ── HEALTH ────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    players: world.playerCount(),
    monsters: world.monsterEntities.size,
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
  for (const player of world.playerEntities) {
    const sock = io.sockets.sockets.get(player.isPlayer.id);
    if (!sock) continue;
    if (!nodeSnaps.has(player.hasPosition.nodeId)) {
      nodeSnaps.set(player.hasPosition.nodeId, world.buildSnapshot(player.hasPosition.nodeId));
    }
    sock.emit('node:state', nodeSnaps.get(player.hasPosition.nodeId)!);
  }
}, BROADCAST_MS);

// ── AUTO-SAVE ─────────────────────────────────────────
// Persist every connected player every 30 s as a crash safety net.
setInterval(() => {
  for (const [accountId, socketId] of socketByAccount) {
    const player = world.getPlayerEntity(socketId);
    if (player) saveCharacterFromEntity(db, accountId, player);
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
  world.attachPlayerEntity(player);

  if (IS_DEV) {
    const diff = diffPlayerRoundTrip(player);
    if (diff.length > 0) {
      console.error(`[wire-parity] PlayerSnapshot round-trip failed for ${player.id}:`, diff);
    }
  }

  socket.emit('state:sync', world.buildSnapshot(player.nodeId));

  socket.on('player:move', ({ x, y }) => {
    const p = world.getPlayerEntity(socket.id);
    if (!p) return;
    if (p.usesCooldown.isChanneling) return;
    p.isMoving.motion = vectorTo(p.hasPosition.current, { x, y });
  });

  socket.on('player:setAuto', (enabled) => {
    const p = world.getPlayerEntity(socket.id);
    if (!p) return;
    p.usesAutocombat.auto = enabled;
  });

  socket.on('player:unlockSkill', (skillId) => {
    const p = world.getPlayerEntity(socket.id);
    if (!p) return;
    const succeeded = unlockSkill(p, skillId);
    if (succeeded) {
      socket.emit('player:ascended', p.tracksProgression.currentSkillTier);
    }
    // recalculatePlayerStats (called inside unlockSkill) resets snapshot mirror
    // fields. refreshArchetypeComponents re-syncs the typed components so they
    // stay the runtime source of truth.
    world.refreshArchetypeComponents(socket.id);
  });

  socket.on('inventory:equipItem', (definitionId) => {
    const p = world.getPlayerEntity(socket.id);
    if (!p) return;
    equipItem(p, definitionId);
    world.refreshArchetypeComponents(socket.id);
  });

  socket.on('inventory:unequip', (slot: EquipmentSlot) => {
    const p = world.getPlayerEntity(socket.id);
    if (!p) return;
    unequipItem(p, slot);
    world.refreshArchetypeComponents(socket.id);
  });

  socket.on('crafting:craftRecipe', (recipeId: string) => {
    const p = world.getPlayerEntity(socket.id);
    if (!p) return;
    const result = craftRecipe(p, recipeId);
    socket.emit('crafting:result', result);
  });

  if (IS_DEV) {
    socket.on('debug:goToTestRoom', () => {
      const p = world.getPlayerEntity(socket.id);
      if (!p) return;

      const spawnX = GAME_CONFIG.NODE_WIDTH / 2;
      const spawnY = GAME_CONFIG.NODE_HEIGHT / 2 - 200;

      p.hasPosition.nodeId = TEST_ROOM_NODE_ID;
      p.hasPosition.current = { x: spawnX, y: spawnY };
      p.isMoving.motion = zeroMotion();
      p.usesAutocombat.auto = false;
      p.performsAttack.attackTargetId = null;
      p.usesCooldown.isChanneling = false;
      p.usesCooldown.channelingPct = 0;

      world.setPlayerCombatAt(socket.id, 0);
      for (const e of world.monsterEntities) {
        if (e.monsterAi.aggroTargetId === socket.id) e.monsterAi.aggroTargetId = null;
      }
    });

    socket.on('debug:leaveTestRoom', () => {
      const p = world.getPlayerEntity(socket.id);
      if (!p) return;
      // Wipe the infinite test-room essence stockpile so it can't leak into the live world.
      for (const type of ESSENCE_TYPES) {
        p.tracksProgression.essences[type] = 0;
      }
      world.respawnPlayer(socket.id);
    });
  }

  socket.on('disconnect', () => {
    const p = world.getPlayerEntity(socket.id);
    if (p) saveCharacterFromEntity(db, accId, p);
    socketByAccount.delete(accId);
    world.detachPlayerEntity(socket.id);
  });
});

// ── START ────────────────────────────────────────────

httpServer.listen(4000, () => {
  console.log('Server running on http://localhost:4000');
});