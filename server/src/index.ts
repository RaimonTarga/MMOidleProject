import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';

import { World } from './world/World';
import { emptyEquipment, GAME_CONFIG, resetTracksCombat, TEST_ROOM_NODE_ID, ESSENCE_TYPES } from '@mmo-idle/shared';
import { unlockSkill } from './systems/player/progression/skills';
import { checkRecipeUnlocks } from './systems/player/progression/rewards';
import { equipItem, unequipItem } from './systems/player/economy/inventory';
import { craftRecipe } from './systems/player/economy/crafting';
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  EquipmentSlot,
  DeltaSnapshot,
} from '@mmo-idle/shared';
import { db, runMigrations } from './db/index';
import { findOrCreateAccount, getOrCreateCharacter, saveCharacter } from './db/playerRepo';
import { initAllMechanics } from './systems/classes/registry';
import { recordBroadcast } from './net/profiler';
import { initWeaponEffects } from './systems/combat/damage/weaponEffects';
import { initDefenseSystems } from './systems/defense';
import { initDebuffMechanics } from './systems/classes/shared/debuffs';
import { IS_DEV } from './env';
import {
  assertMarkerInvariants,
  assertNetworkedComponentInvariants,
} from './ecs/markerInvariants';
import { setEntityMotion, stopEntity } from './systems/world/movement';
import { setAggroTarget, setAttackTarget } from './systems/combat/ai/targeting';
import { clearEngagement } from './systems/combat/ai/engagement';
import { attachComponent, detachComponent } from './ecs/markerHelpers';
import { syncArchetypeSlices } from './ecs/archetypeSliceSync';
import { recalculatePlayerEntityStats } from './ecs/playerEntityFormulas';
import { markSliceDirty } from './ecs/dirtyHelpers';

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

// ── MARKER INVARIANT CHECK (dev only) ─────────────────
if (IS_DEV) {
  const markerViolations = assertMarkerInvariants(world);
  if (markerViolations.length > 0) {
    console.error('[marker-invariants] Marker/status mismatch:', markerViolations);
  } else {
    console.log('[marker-invariants] Marker components OK');
  }
  const networkViolations = assertNetworkedComponentInvariants(world);
  if (networkViolations.length > 0) {
    console.error('[network-invariants] Networked component mismatch:', networkViolations);
  } else {
    console.log('[network-invariants] Networked components OK');
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
  for (const playerId of world.pendingAscensions) {
    const p = world.getPlayerEntity(playerId);
    if (p) io.sockets.sockets.get(playerId)?.emit('player:ascended', p.tracksProgression.currentSkillTier);
  }
  world.pendingAscensions = [];
}, LOGIC_MS);

// Broadcast tick — 5 Hz. Sends authoritative component deltas to each player.
// Decoupled from the simulation so network cost doesn't scale with logic rate.
// buildDelta is called once per node so all players in a node share the same
// event queue flush — without this, the first player drains events and others see none.
setInterval(() => {
  const dirty = world.beginBroadcast();
  const nodeSnaps = new Map<string, DeltaSnapshot>();
  for (const player of world.playerEntities) {
    const sock = io.sockets.sockets.get(player.isPlayer.id);
    if (!sock) continue;
    if (!nodeSnaps.has(player.hasPosition.nodeId)) {
      nodeSnaps.set(player.hasPosition.nodeId, world.buildNodeDelta(player.hasPosition.nodeId, dirty));
    }
    const snap = nodeSnaps.get(player.hasPosition.nodeId)!;
    recordBroadcast(snap, 'node:delta');
    sock.emit('node:delta', snap);
  }
}, BROADCAST_MS);

// ── AUTO-SAVE ─────────────────────────────────────────
// Persist every connected player every 30 s as a crash safety net.
setInterval(() => {
  for (const [accountId, socketId] of socketByAccount) {
    const player = world.getPlayerEntity(socketId);
    if (player) saveCharacter(db, accountId, player);
  }
}, 30_000);

// ── SOCKETS ──────────────────────────────────────────

io.on('connection', (socket) => {
  const auth = socket.handshake.auth as { accountId?: string; displayName?: string };
  const accId      = auth.accountId   ?? socket.id;
  const playerName = (auth.displayName ?? `Hero_${socket.id.slice(0, 5)}`).slice(0, 32);

  findOrCreateAccount(db, accId, playerName);
  const player = getOrCreateCharacter(db, accId, playerName);

  socketByAccount.set(accId, socket.id);
  const entity = world.attachPlayerEntity(player, socket.id);
  syncArchetypeSlices(world, entity);
  recalculatePlayerEntityStats(world, entity);
  syncArchetypeSlices(world, entity);
  entity.hasHealth.hp = entity.hasHealth.maxHp;

  const syncSnap = world.buildNodeDelta(
    entity.hasPosition.nodeId,
    { patched: new Map(), detached: new Map() },
    { resync: true },
  );
  recordBroadcast(syncSnap, 'state:sync');
  socket.emit('state:sync', syncSnap);

  socket.on('player:move', (pos) => {
    const p = world.getPlayerEntity(socket.id);
    if (!p) return;
    if (p.isChanneling) return;
    setEntityMotion(world, p, pos);
    if (p.isMoving) {
      attachComponent(world, p, 'hasManualMoveIntent', {});
    } else {
      detachComponent(world, p, 'hasManualMoveIntent');
    }
  });

  socket.on('player:setAuto', (enabled) => {
    const p = world.getPlayerEntity(socket.id);
    if (!p) return;
    p.usesAutocombat.auto = enabled;
  });

  socket.on('player:unlockSkill', (skillId) => {
    const p = world.getPlayerEntity(socket.id);
    if (!p) return;
    const succeeded = unlockSkill(world, p, skillId);
    if (succeeded) {
      markSliceDirty(world, p, 'tracksProgression');
      markSliceDirty(world, p, 'usesSkills');
    }
  });

  socket.on('inventory:equipItem', (definitionId) => {
    const p = world.getPlayerEntity(socket.id);
    if (!p) return;
    equipItem(world, p, definitionId);
  });

  socket.on('inventory:unequip', (slot: EquipmentSlot) => {
    const p = world.getPlayerEntity(socket.id);
    if (!p) return;
    unequipItem(world, p, slot);
  });

  socket.on('crafting:craftRecipe', (recipeId: string) => {
    const p = world.getPlayerEntity(socket.id);
    if (!p) return;
    const result = craftRecipe(world, p, recipeId);
    socket.emit('crafting:result', result);
  });

  if (IS_DEV) {
    socket.on('debug:goToTestRoom', () => {
      const p = world.getPlayerEntity(socket.id);
      if (!p) return;

      const spawn = {
        x: GAME_CONFIG.NODE_WIDTH / 2,
        y: GAME_CONFIG.NODE_HEIGHT / 2 - 200,
      };

      p.hasPosition.nodeId = TEST_ROOM_NODE_ID;
      p.hasPosition.current = spawn;
      stopEntity(world, p);
      p.usesAutocombat.auto = false;
      setAttackTarget(world, p, null);
      detachComponent(world, p, 'isChanneling');
      clearEngagement(world, p);
      for (const e of world.aggroedMonsters) {
        if (e.hasAggroTarget.playerId === socket.id) setAggroTarget(world, e, null, Date.now());
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

    socket.on('debug:refreshRecipes', () => {
      const p = world.getPlayerEntity(socket.id);
      if (!p) return;
      checkRecipeUnlocks(p);
      markSliceDirty(world, p, 'tracksProgression');
    });

    socket.on('debug:resetProgress', () => {
      const p = world.getPlayerEntity(socket.id);
      if (!p) return;

      p.tracksProgression.level = 1;
      p.tracksProgression.skillPoints = 1;
      p.tracksProgression.biomeXP = {};
      p.tracksProgression.biomeLevel = {};
      p.tracksProgression.unlockedRecipes = [];
      p.tracksProgression.questProgress = {};
      p.tracksProgression.playerTier = 0;
      p.tracksProgression.currentSkillTier = 0;
      for (const type of ESSENCE_TYPES) {
        p.tracksProgression.essences[type] = 0;
      }

      p.holdsInventory.inventory = [];
      p.holdsInventory.equipment = emptyEquipment();
      p.usesSkills.unlockedSkills = [];
      p.usesSkills.passives = {};
      p.usesSkills.selectedClass = null;
      p.usesSkills.selectedSubVariant = null;
      p.usesSkills.selectedRange = null;
      p.usesSkills.combatArchetype = null;
      p.usesAutocombat.auto = false;

      stopEntity(world, p);
      setAttackTarget(world, p, null);
      detachComponent(world, p, 'hasEmpoweredAttack');
      detachComponent(world, p, 'isChanneling');
      detachComponent(world, p, 'hasOverdrive');
      detachComponent(world, p, 'hasAlignment');
      detachComponent(world, p, 'inAcChargePhase');
      detachComponent(world, p, 'inAcDischarge');
      detachComponent(world, p, 'holdsShields');
      resetTracksCombat(p.tracksCombat);
      syncArchetypeSlices(world, p);
      recalculatePlayerEntityStats(world, p);
      syncArchetypeSlices(world, p);
      p.hasHealth.hp = p.hasHealth.maxHp;

      markSliceDirty(world, p, 'tracksProgression');
      markSliceDirty(world, p, 'holdsInventory');
      markSliceDirty(world, p, 'usesSkills');
      markSliceDirty(world, p, 'usesAutocombat');
      markSliceDirty(world, p, 'hasHealth');
    });
  }

  socket.on('disconnect', () => {
    const p = world.getPlayerEntity(socket.id);
    if (p) saveCharacter(db, accId, p);
    socketByAccount.delete(accId);
    world.detachPlayerEntity(socket.id);
  });
});

// ── START ────────────────────────────────────────────

httpServer.listen(4000, () => {
  console.log('Server running on http://localhost:4000');
});