import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import path from "path";

import { World, type PersistedBossRespawn } from "./world/World";
import { takeWorldLogEvents } from "./world/worldLog";
import {
  emptyEquipment,
  GAME_CONFIG,
  ITEM_DATABASE,
  NODE_BIOMES,
  registerDevItems,
  resetTracksCombat,
  TEST_ROOM_NODE_ID,
  ESSENCE_TYPES,
} from "@mmo-idle/shared";
import { unlockSkill } from "./systems/player/progression/skills";
import { checkRecipeUnlocks } from "./systems/player/progression/rewards";
import { equipItem, unequipItem } from "./systems/player/economy/inventory";
import { craftRecipe } from "./systems/player/economy/crafting";
import { upgradeItem } from "./systems/player/economy/itemUpgrade";
import { grantDevLoadout } from "./systems/player/economy/grantDevWeapon";
import {
  joinParty,
  leaveParty,
  handlePartyDisconnect,
} from "./systems/player/party/partySystem";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  EquipmentSlot,
  DeltaSnapshot,
} from "@mmo-idle/shared";
import { db, runMigrations } from "./db/index";
import {
  readWorldState,
  writeWorldState,
  clearWorldState,
} from "./db/worldStateRepo";
import { initHitboxCache } from "./hitbox/cache";
import { getAtlasPaths } from "./hitbox/paths";
import {
  findOrCreateAccount,
  getOrCreateCharacter,
  saveCharacter,
} from "./db/playerRepo";
import { initAllMechanics } from "./systems/classes/registry";
import { recordBroadcast } from "./net/profiler";
import { timeSync } from "./telemetry/nodeTelemetry";
import { TELEMETRY_WINDOW_MS } from "./telemetry/constants";
import { initWeaponEffects } from "./systems/combat/damage/weaponEffects";
import { initInvulnerabilityGuard } from "./systems/combat/invulnerability";
import { initDefenseSystems } from "./systems/defense";
import {
  registerSummonerDamageSponge,
  registerMountainPathHooks,
  despawnMinionsForOwner,
  relocateMinionsForOwner,
} from "./systems/classes/archetypes/summoner";
import { initDebuffMechanics } from "./systems/classes/shared/debuffs";
import { IS_DEV } from "./env";
import {
  assertMarkerInvariants,
  assertNetworkedComponentInvariants,
} from "./ecs/markerInvariants";
import { setEntityMotion, stopEntity } from "./systems/world/movement";
import { setAggroTarget, setAttackTarget } from "./systems/combat/ai/targeting";
import { clearEngagement } from "./systems/combat/ai/engagement";
import { attachComponent, detachComponent } from "./ecs/markerHelpers";
import {
  applySummonerCommand,
  clearSummonerCommand,
} from "./systems/classes/archetypes/summoner/command";
import { syncArchetypeSlices } from "./ecs/archetypeSliceSync";
import { recalculatePlayerEntityStats } from "./ecs/playerEntityFormulas";
import { markSliceDirty, mutateSlice } from "./ecs/dirtyHelpers";
import {
  clearAutoTraversePath,
  startManualNavigation,
} from "./systems/world/autoTraverse";
import { thawNode } from "./world/nodeLifecycle";
import { rightmostEntranceTarget } from "./world/nodePath";
import { ensurePopulation, ensureBoss } from "./systems/world/spawning";
import { initDeadPlayerGuard } from "./systems/world/playerIncapacitation";
import type { PlayerEntity } from "./ecs/entity";

export { IS_DEV };

if (IS_DEV) registerDevItems(ITEM_DATABASE);

// ── Setup ─────────────────────────────────────────────

const app = express();
// Allow all origins — this is a private LAN/friends game, no auth tokens in cookies.
app.use(cors({ origin: true }));
app.use(express.json());

// Serve the production client build when it exists.
// Run `pnpm --filter @mmo-idle/client build` to generate it.
const clientDist = path.resolve(__dirname, "../../client/dist");
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
initInvulnerabilityGuard();
initDeadPlayerGuard();

// ── SUMMONER DAMAGE SPONGE ────────────────────────────────────────────────────
// Registered after defense systems so shield/absorb get first crack at incoming
// damage; whatever remains has half siphoned off to a random living slime.
// Rockslide cover runs on post-sponge ally damage.
registerMountainPathHooks();
registerSummonerDamageSponge();

// ── DATABASE ──────────────────────────────────────────

runMigrations();

// accountId → socketId map for the auto-save interval
const socketByAccount = new Map<string, string>();

/** Server-global key for the persisted Void Overlord respawn cooldown. */
const OVERLORD_RESPAWN_KEY = "void-overlord-respawn";

/**
 * Re-seed the in-memory Void Overlord respawn cooldown from the DB on boot so a
 * server restart (or any node despawn) does not bring the overlord back early.
 * Drops the record if the cooldown already elapsed while the server was down.
 */
function restoreOverlordRespawn(world: World): void {
  const raw = readWorldState(db, OVERLORD_RESPAWN_KEY);
  if (!raw) return;

  let saved: PersistedBossRespawn;
  try {
    saved = JSON.parse(raw) as PersistedBossRespawn;
  } catch {
    clearWorldState(db, OVERLORD_RESPAWN_KEY);
    return;
  }

  if (saved.respawnAt <= Date.now()) {
    clearWorldState(db, OVERLORD_RESPAWN_KEY);
    return;
  }

  const { nodeId, ...marker } = saved;
  world.bossRespawnAt.set(nodeId, marker.respawnAt);
  world.bossRespawnMarkers.set(nodeId, marker);
}

async function boot(): Promise<void> {
  const { atlasPng, atlasJson } = getAtlasPaths();
  await initHitboxCache(db, atlasPng, atlasJson);

  // ── WORLD ─────────────────────────────────────────────

  const world = new World();

  world.nodePreparingEmitter = (playerId, nodeId) => {
    io.sockets.sockets.get(playerId)?.emit("node:preparing", { nodeId });
  };

  world.overlordRespawnPersist = (marker) => {
    if (marker) {
      writeWorldState(db, OVERLORD_RESPAWN_KEY, JSON.stringify(marker));
    } else {
      clearWorldState(db, OVERLORD_RESPAWN_KEY);
    }
  };
  restoreOverlordRespawn(world);

  const emitBossFelledState = () => {
    io.emit("world:bossFelled", world.buildBossFelledSnapshot());
  };
  world.bossFelledBroadcast = emitBossFelledState;

  // ── MARKER INVARIANT CHECK (dev only) ─────────────────
  if (IS_DEV) {
    const markerViolations = assertMarkerInvariants(world);
    if (markerViolations.length > 0) {
      console.error(
        "[marker-invariants] Marker/status mismatch:",
        markerViolations,
      );
    } else {
      console.log("[marker-invariants] Marker components OK");
    }
    const networkViolations = assertNetworkedComponentInvariants(world);
    if (networkViolations.length > 0) {
      console.error(
        "[network-invariants] Networked component mismatch:",
        networkViolations,
      );
    } else {
      console.log("[network-invariants] Networked components OK");
    }
  }

  // ── HEALTH ────────────────────────────────────────────

  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      players: world.playerCount(),
      monsters: world.monsterEntities.size,
    });
  });

  // ── GAME LOOP ─────────────────────────────────────────

  const LOGIC_MS = Math.round(1000 / GAME_CONFIG.LOGIC_TICK_RATE);
  const BROADCAST_MS = Math.round(1000 / GAME_CONFIG.BROADCAST_TICK_RATE);

  let last = Date.now();

  // Simulation tick — 10 Hz. Drives all game logic: movement, combat, AI, DoT.
  // Running at 100 ms gives ≤99 ms attack quantization vs ≤499 ms at 2 Hz.
  setInterval(() => {
    const now = Date.now();
    const dt = now - last;
    last = now;

    world.tick(dt, now);

    // Emit death events immediately so the client overlay shows before the next snapshot.
    for (const pending of world.pendingDeaths) {
      io.sockets.sockets
        .get(pending.playerId)
        ?.emit("player:died", pending.payload);
    }
    world.pendingDeaths = [];
    for (const playerId of world.pendingAscensions) {
      const p = world.getPlayerEntity(playerId);
      if (p)
        io.sockets.sockets
          .get(playerId)
          ?.emit("player:ascended", p.tracksProgression.currentSkillTier);
    }
    world.pendingAscensions = [];
    for (const playerId of world.pendingOverlordFelled) {
      io.sockets.sockets.get(playerId)?.emit("overlord:felled");
    }
    world.pendingOverlordFelled = [];
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
      const nodeId = player.hasPosition.nodeId;
      if (!nodeSnaps.has(nodeId)) {
        const timed = timeSync(() =>
          world.buildNodeDeltaWithStats(nodeId, dirty),
        );
        nodeSnaps.set(nodeId, timed.result.snapshot);
        world.telemetry.recordBroadcast(nodeId, timed.ms, timed.result.stats);
      }
      const snap = nodeSnaps.get(nodeId)!;
      recordBroadcast(snap, "node:delta");
      sock.emit("node:delta", snap);
      const logEvents = takeWorldLogEvents(world, player.isPlayer.id);
      if (logEvents.length > 0) {
        sock.emit("world:events", logEvents);
      }
    }
  }, BROADCAST_MS);

  const TELEMETRY_MS = TELEMETRY_WINDOW_MS;
  setInterval(() => {
    world.syncTelemetryOccupancy();
    io.emit("world:telemetry", world.telemetry.flush(world.tickCounter));
  }, TELEMETRY_MS);

  // ── AUTO-SAVE ─────────────────────────────────────────
  // Persist every connected player every 30 s as a crash safety net.
  setInterval(() => {
    for (const [accountId, socketId] of socketByAccount) {
      const player = world.getPlayerEntity(socketId);
      if (player) saveCharacter(db, accountId, player);
    }
  }, 30_000);

  // ── SOCKETS ──────────────────────────────────────────

  io.on("connection", (socket) => {
    const auth = socket.handshake.auth as {
      accountId?: string;
      displayName?: string;
    };
    const accId = auth.accountId ?? socket.id;
    const playerName = (
      auth.displayName ?? `Hero_${socket.id.slice(0, 5)}`
    ).slice(0, 32);

    findOrCreateAccount(db, accId, playerName);

    // Kick any existing session for this account (e.g. duplicate tab).
    // Save + clean up the old entity before the new one attaches so there's
    // never two live PlayerEntities for the same account.
    const existingSocketId = socketByAccount.get(accId);
    if (existingSocketId) {
      const existingPlayer = world.getPlayerEntity(existingSocketId);
      if (existingPlayer?.isDead) world.respawnPlayer(existingSocketId);
      if (existingPlayer) saveCharacter(db, accId, existingPlayer);
      handlePartyDisconnect(world, existingSocketId);
      world.detachPlayerEntity(existingSocketId);
      const existingSock = io.sockets.sockets.get(existingSocketId);
      existingSock?.emit("session:kicked", { reason: "duplicate_session" });
      existingSock?.disconnect(true);
    }

    const player = getOrCreateCharacter(db, accId, playerName);

    const spawnNodeId = player.hasPosition.nodeId;
    if (world.isNodeFrozen(spawnNodeId)) {
      socket.emit("node:preparing", { nodeId: spawnNodeId });
      thawNode(world, spawnNodeId);
    }

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
    recordBroadcast(syncSnap, "state:sync");
    socket.emit("state:sync", syncSnap);
    emitBossFelledState();
    world.syncTelemetryOccupancy();
    socket.emit("world:telemetry", world.telemetry.flush(world.tickCounter));

    function liveSelf(): PlayerEntity | null {
      const p = world.getPlayerEntity(socket.id);
      return p && !p.isDead ? p : null;
    }

    function teleportLiveSelfToNode(nodeId: string): void {
      const p = liveSelf();
      if (!p) return;
      if (!NODE_BIOMES[nodeId]) return;

      const fromNodeId = p.hasPosition.nodeId;
      if (fromNodeId === TEST_ROOM_NODE_ID) {
        // Match debug:leaveTestRoom so the test-room stockpile cannot leak out.
        for (const type of ESSENCE_TYPES) {
          p.tracksProgression.essences[type] = 0;
        }
        markSliceDirty(world, p, "tracksProgression");
      }

      p.hasPosition.nodeId = nodeId;
      if (fromNodeId !== nodeId) {
        world.movePlayerNode(fromNodeId, nodeId);
      }

      if (world.isNodeFrozen(nodeId)) {
        world.nodePreparingEmitter?.(p.isPlayer.id, nodeId);
        thawNode(world, nodeId);
      }

      p.hasPosition.current = rightmostEntranceTarget(nodeId);

      world.resetNodeDeltaState(nodeId);
      stopEntity(world, p);
      p.usesAutocombat.auto = false;
      clearAutoTraversePath(world, p);
      clearSummonerCommand(world, p);
      setAttackTarget(world, p, null);
      detachComponent(world, p, "isChanneling");
      clearEngagement(world, p);
      relocateMinionsForOwner(world, p);

      for (const e of world.aggroedMonsters) {
        if (
          e.hasAggroTarget.targetKind === "player" &&
          e.hasAggroTarget.targetId === socket.id
        ) {
          setAggroTarget(world, e, null, Date.now());
        }
      }
    }

    socket.on("player:ackDeath", () => {
      const p = world.getPlayerEntity(socket.id);
      if (!p?.isDead) return;
      world.respawnPlayer(socket.id);
    });

    socket.on("player:move", (pos) => {
      const p = liveSelf();
      if (!p) return;
      if (p.isChanneling) return;
      clearSummonerCommand(world, p);
      setEntityMotion(world, p, pos);
      if (p.isMoving) {
        attachComponent(world, p, "hasManualMoveIntent", {});
      } else {
        detachComponent(world, p, "hasManualMoveIntent");
      }
    });

    socket.on("player:commandSummons", (pos) => {
      const p = liveSelf();
      if (!p) return;
      applySummonerCommand(world, p, pos);
    });

    socket.on("player:setAuto", (enabled) => {
      const p = liveSelf();
      if (!p) return;
      p.usesAutocombat.auto = enabled;
    });

    socket.on("player:setAutoTraverse", (enabled) => {
      const p = liveSelf();
      if (!p) return;
      mutateSlice(world, p, "usesAutocombat", (s) => {
        s.autoTraverse = !!enabled;
      });
      if (!enabled) clearAutoTraversePath(world, p);
    });

    socket.on("player:navigateTo", (nodeId) => {
      const p = liveSelf();
      if (!p) return;
      if (p.isChanneling) return;
      if (typeof nodeId !== "string") return;
      clearSummonerCommand(world, p);
      startManualNavigation(world, p, nodeId);
    });

    socket.on("player:requestSync", () => {
      const p = world.getPlayerEntity(socket.id);
      if (!p) return;
      const snap = world.buildNodeDelta(
        p.hasPosition.nodeId,
        { patched: new Map(), detached: new Map() },
        { resync: true },
      );
      recordBroadcast(snap, "state:sync");
      socket.emit("state:sync", snap);
      emitBossFelledState();
    });

    socket.on("player:unlockSkill", (skillId) => {
      const p = liveSelf();
      if (!p) return;
      const succeeded = unlockSkill(world, p, skillId);
      if (succeeded) {
        markSliceDirty(world, p, "tracksProgression");
        markSliceDirty(world, p, "usesSkills");
      }
    });

    socket.on("inventory:equipItem", (definitionId) => {
      const p = liveSelf();
      if (!p) return;
      equipItem(world, p, definitionId);
    });

    socket.on("inventory:unequip", (slot: EquipmentSlot) => {
      const p = liveSelf();
      if (!p) return;
      unequipItem(world, p, slot);
    });

    socket.on("crafting:craftRecipe", (recipeId: string) => {
      const p = liveSelf();
      if (!p) return;
      const result = craftRecipe(world, p, recipeId);
      socket.emit("crafting:result", result);
    });

    socket.on("inventory:upgradeItem", (itemId: string) => {
      const p = liveSelf();
      if (!p) return;
      const result = upgradeItem(world, p, itemId);
      socket.emit("inventory:upgradeResult", result);
    });

    socket.on("party:join", (targetPlayerId: string) => {
      const p = liveSelf();
      if (!p) return;
      joinParty(world, p, targetPlayerId);
    });

    socket.on("party:leave", () => {
      const p = liveSelf();
      if (!p) return;
      leaveParty(world, p);
    });

    if (IS_DEV) {
      socket.on("debug:goToTestRoom", () => {
        const p = world.getPlayerEntity(socket.id);
        if (!p) return;

        const spawn = {
          x: GAME_CONFIG.NODE_WIDTH / 2,
          y: GAME_CONFIG.NODE_HEIGHT / 2 - 200,
        };

        const fromNodeId = p.hasPosition.nodeId;
        p.hasPosition.nodeId = TEST_ROOM_NODE_ID;
        if (fromNodeId !== TEST_ROOM_NODE_ID) {
          world.movePlayerNode(fromNodeId, TEST_ROOM_NODE_ID);
        }
        p.hasPosition.current = spawn;
        // Force a full snapshot for the test room so the client clears any
        // render state lingering from the node they came from.
        world.resetNodeDeltaState(TEST_ROOM_NODE_ID);
        stopEntity(world, p);
        p.usesAutocombat.auto = false;
        setAttackTarget(world, p, null);
        detachComponent(world, p, "isChanneling");
        clearEngagement(world, p);
        for (const e of world.aggroedMonsters) {
          if (
            e.hasAggroTarget.targetKind === "player" &&
            e.hasAggroTarget.targetId === socket.id
          ) {
            setAggroTarget(world, e, null, Date.now());
          }
        }
      });

      socket.on("debug:teleportToNode", (nodeId) => {
        if (typeof nodeId !== "string") return;
        teleportLiveSelfToNode(nodeId);
      });

      socket.on("debug:leaveTestRoom", () => {
        const p = world.getPlayerEntity(socket.id);
        if (!p) return;
        // Wipe the infinite test-room essence stockpile so it can't leak into the live world.
        for (const type of ESSENCE_TYPES) {
          p.tracksProgression.essences[type] = 0;
        }
        world.respawnPlayer(socket.id);
      });

      socket.on("debug:refreshRecipes", () => {
        const p = world.getPlayerEntity(socket.id);
        if (!p) return;
        checkRecipeUnlocks(p);
        markSliceDirty(world, p, "tracksProgression");
      });

      socket.on("debug:respawnNode", () => {
        const p = world.getPlayerEntity(socket.id);
        if (!p) return;

        const nodeId = p.hasPosition.nodeId;
        for (const m of [...world.monsterEntitiesInNode(nodeId)]) {
          world.removeMonsterEntity(m.isMonster.id);
        }
        world.nextMonsterIdByNode.delete(nodeId);
        ensurePopulation(world, nodeId);
        ensureBoss(world, nodeId);
        world.reconcileMonsterCounts();
        world.resetNodeDeltaState(nodeId);
      });

      socket.on("debug:equipPhaseTester", () => {
        const p = liveSelf();
        if (!p) return;
        grantDevLoadout(world, p);
      });

      socket.on("debug:resetProgress", () => {
        const p = world.getPlayerEntity(socket.id);
        if (!p) return;

        p.tracksProgression.level = 1;
        p.tracksProgression.skillPoints = 0;
        p.tracksProgression.biomeXP = {};
        p.tracksProgression.biomeLevel = {};
        p.tracksProgression.unlockedRecipes = [];
        p.tracksProgression.questProgress = {};
        p.tracksProgression.playerTier = 0;
        p.tracksProgression.currentSkillTier = 0;
        p.tracksProgression.bossesCleared = [];
        p.tracksProgression.clearedNodes = [];
        for (const type of ESSENCE_TYPES) {
          p.tracksProgression.essences[type] = 0;
        }

        p.holdsInventory.inventory = [];
        p.holdsInventory.equipment = emptyEquipment();
        p.holdsInventory.itemUpgrades = {};
        p.usesSkills.unlockedSkills = [];
        p.usesSkills.passives = {};
        p.usesSkills.selectedClass = null;
        p.usesSkills.selectedSubVariant = null;
        p.usesSkills.selectedRange = null;
        p.usesSkills.combatArchetype = null;
        p.usesAutocombat.auto = false;
        clearAutoTraversePath(world, p);

        stopEntity(world, p);
        setAttackTarget(world, p, null);
        detachComponent(world, p, "hasEmpoweredAttack");
        detachComponent(world, p, "isChanneling");
        detachComponent(world, p, "hasOverdrive");
        detachComponent(world, p, "hasAlignment");
        detachComponent(world, p, "inAcChargePhase");
        detachComponent(world, p, "inAcDischarge");
        detachComponent(world, p, "holdsShields");
        // Drop any live slimes before the archetype slice is detached.
        despawnMinionsForOwner(world, p);
        resetTracksCombat(p.tracksCombat);
        syncArchetypeSlices(world, p);
        recalculatePlayerEntityStats(world, p);
        syncArchetypeSlices(world, p);
        p.hasHealth.hp = p.hasHealth.maxHp;

        markSliceDirty(world, p, "tracksProgression");
        markSliceDirty(world, p, "holdsInventory");
        markSliceDirty(world, p, "usesSkills");
        markSliceDirty(world, p, "usesAutocombat");
        markSliceDirty(world, p, "hasHealth");
      });
    }

    socket.on("disconnect", () => {
      const p = world.getPlayerEntity(socket.id);
      if (p?.isDead) world.respawnPlayer(socket.id);
      if (p) saveCharacter(db, accId, p);
      handlePartyDisconnect(world, socket.id);
      // Only remove the account entry if it still points to this socket.
      // A kicked socket's disconnect fires after the new session has already
      // overwritten the entry — deleting it would silently log out the new tab.
      if (socketByAccount.get(accId) === socket.id)
        socketByAccount.delete(accId);
      world.detachPlayerEntity(socket.id);
    });
  });

  // ── START ────────────────────────────────────────────

  httpServer.listen(4000, () => {
    console.log("Server running on http://localhost:4000");
  });
}

boot().catch((err) => {
  console.error("[boot] failed:", err);
  process.exit(1);
});
