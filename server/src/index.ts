import express from "express";
import { createServer } from "http";
import { Server, type Socket } from "socket.io";
import cors from "cors";
import path from "path";

import { World, type PersistedBossRespawn } from "./world/World";
import { takeWorldLogEvents } from "./world/worldLog";
import {
  emptyEquipment,
  GAME_CONFIG,
  ITEM_DATABASE,
  NODE_BIOMES,
  validateNodeModifiers,
  validateTierAdvancement,
  pointInNodeFeatureShape,
  registerDevItems,
  resetTracksCombat,
  RESOLVED_NODE_FEATURES,
  RUNE_ALTAR_FEATURE_ID,
  SKILL_TREE,
  validateCharacterName,
} from "@mmo-idle/shared";
import { checkRecipeUnlocks } from "./systems/player/progression/rewards";
import { grantDevLoadout } from "./systems/player/economy/grantDevWeapon";
import { handlePartyDisconnect } from "./systems/player/party/partySystem";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  DeltaSnapshot,
} from "@mmo-idle/shared";
import { db, runMigrations } from "./db/index";
import {
  readWorldState,
  writeWorldState,
  clearWorldState,
} from "./db/worldStateRepo";
import {
  hydrateHitboxCacheFromArtifact,
  hydrateHitboxCacheFromDb,
  initHitboxCache,
} from "./hitbox/cache";
import { getAtlasPaths } from "./hitbox/paths";
import {
  createCharacter,
  findOrCreateDevAccount,
  listAccountCharacters,
  loadCharacter,
  saveCharacter,
  softDeleteCharacter,
  touchAccountLogin,
} from "./db/playerRepo";
import { currentReleaseAnnouncement } from "./updates/releaseAnnouncements";
import { recordBroadcast } from "./net/profiler";
import { timeSync } from "./telemetry/nodeTelemetry";
import { TELEMETRY_WINDOW_MS } from "./telemetry/constants";
import { initCombatSystems } from "./systems/combatBootstrap";
import { IS_DEV } from "./env";
import {
  assertMarkerInvariants,
  assertNetworkedComponentInvariants,
} from "./ecs/markerInvariants";
import { syncArchetypeSlices } from "./ecs/archetypeSliceSync";
import { recalculatePlayerEntityStats } from "./ecs/playerEntityFormulas";
import { thawNode } from "./world/nodeLifecycle";
import { ensurePopulation, ensureBoss } from "./systems/world/spawning";
import { initDeadPlayerGuard } from "./systems/world/playerIncapacitation";
import type { PlayerEntity } from "./ecs/entity";
import { log } from "./log";
import { runLogMigrations } from "./logdb/index";
import { pruneExpiredLogs } from "./logdb/repo";
import {
  insertWorldLogEntries,
  pruneExpiredWorldLogEntries,
  type WorldLogInsertEntry,
} from "./logdb/worldLogRepo";
import {
  insertAnalyticsEvents,
  pruneExpiredAnalyticsEvents,
  type AnalyticsEventInput,
} from "./logdb/analyticsRepo";
import { registerAdminNamespace } from "./admin/namespace";
import { onTelemetry, publishTelemetry } from "./broker";
import { registerPlayerHandlers } from "./net/playerHandlers";
import {
  discordAuthIsConfigured,
  registerDiscordAuthRoutes,
} from "./auth/discordOAuth";
import { authenticateSocketHandshake } from "./auth/socketAuth";
import { pruneExpiredSessions } from "./auth/sessionRepo";
import type { PlayerSocketSession } from "./net/socketSession";
import { SpectatorManager } from "./net/spectatorManager";
import { buildSpectatorNodeSnapshot } from "./world/spectatorSnapshot";

export { IS_DEV };

if (IS_DEV) registerDevItems(ITEM_DATABASE);

// ── Setup ─────────────────────────────────────────────

const app = express();
// Allow all origins — this is a private LAN/friends game, no auth tokens in cookies.
app.use(cors({ origin: true }));
app.use(express.json());

// Liveness probe for Railway / container orchestration. Intentionally cheap:
// returns 200 as soon as the HTTP server is accepting requests (the server only
// starts listening after migrations + hitbox bake complete in boot()). It does
// not touch the DB so a transient Postgres blip won't trigger restart loops.
app.get("/healthz", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

registerDiscordAuthRoutes(app, db);

// Serve built client/admin only in production so dev doesn't expose a stale
// client/dist on :4000 while the live Vite app runs on :3000.
if (process.env.NODE_ENV === "production") {
  const clientDist = path.resolve(__dirname, "../../client/dist");
  const adminDist = path.resolve(__dirname, "../../admin/dist");
  app.use("/admin", express.static(adminDist));
  app.get(["/admin", "/admin/*"], (_req, res) => {
    res.sendFile(path.join(adminDist, "index.html"));
  });
  app.use(express.static(clientDist));
}

const httpServer = createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: { origin: true },
});

io.use(async (socket, next) => {
  try {
    const identity = await authenticateSocketHandshake(db, socket.handshake.auth);
    if (!identity) {
      next(new Error("unauthorized"));
      return;
    }
    if ("accountId" in identity) socket.data.accountId = identity.accountId;
    socket.data.authKind = identity.kind;
    next();
  } catch (err) {
    log.warn({ err }, "socket authentication failed");
    next(new Error("unauthorized"));
  }
});

// ── COMBAT SYSTEMS BOOTSTRAP ──────────────────────────────────────────────────
// Registers every combat-pipeline listener and per-system hook (class mechanics,
// weapon effects, defense, debuffs, invulnerability/dead-player guards, summoner
// hooks) exactly once, in priority order.
//
// This is shared with the balance/bench harness (server/bench/harness.ts) so the
// simulation exercises the identical combat pipeline. DO NOT register new combat
// listeners inline here — add them inside `initCombatSystems` so the bench never
// silently diverges from live server behavior.
initCombatSystems();

// ── DATABASE ──────────────────────────────────────────
// Migrations run at the top of boot() (they are async on Postgres).

// accountId → socketId map for the auto-save interval
const socketByAccount = new Map<string, string>();
const sessionsBySocket = new Map<string, PlayerSocketSession>();
const sessionStartedAtBySocket = new Map<string, number>();

// Sockets whose tab is currently hidden/backgrounded. While a socket is here,
// the broadcast loop skips its high-volume node:delta / world:events stream; the
// client requests a full resync when the tab regains focus.
const inactiveSockets = new Set<string>();

function accountIdForSocket(socketId: string): string | undefined {
  return sessionsBySocket.get(socketId)?.accountId;
}

/** Server-global key for the persisted Void Overlord respawn cooldown. */
const OVERLORD_RESPAWN_KEY = "void-overlord-respawn";

/**
 * Re-seed the in-memory Void Overlord respawn cooldown from the DB on boot so a
 * server restart (or any node despawn) does not bring the overlord back early.
 * Drops the record if the cooldown already elapsed while the server was down.
 */
async function restoreOverlordRespawn(world: World): Promise<void> {
  const raw = await readWorldState(db, OVERLORD_RESPAWN_KEY);
  if (!raw) return;

  let saved: PersistedBossRespawn;
  try {
    saved = JSON.parse(raw) as PersistedBossRespawn;
  } catch {
    await clearWorldState(db, OVERLORD_RESPAWN_KEY);
    return;
  }

  if (saved.respawnAt <= Date.now()) {
    await clearWorldState(db, OVERLORD_RESPAWN_KEY);
    return;
  }

  const { nodeId, ...marker } = saved;
  world.bossRespawnAt.set(nodeId, marker.respawnAt);
  world.bossRespawnMarkers.set(nodeId, marker);
}

async function boot(): Promise<void> {
  await runMigrations();
  await runLogMigrations();
  await pruneExpiredSessions(db);
  await pruneExpiredLogs();
  await pruneExpiredWorldLogEntries();
  await pruneExpiredAnalyticsEvents();
  const pruneTimer = setInterval(() => {
    void Promise.all([
      pruneExpiredSessions(db),
      pruneExpiredLogs(),
      pruneExpiredWorldLogEntries(),
      pruneExpiredAnalyticsEvents(),
    ]).catch((err) => log.warn({ err }, "log retention prune failed"));
  }, 60 * 60 * 1000);
  pruneTimer.unref?.();

  if (!discordAuthIsConfigured()) {
    const level = process.env.NODE_ENV === "production" ? "error" : "warn";
    log[level](
      "Discord OAuth is not configured; /auth/discord/login is unavailable",
    );
  }
  if (process.env.NODE_ENV === "production" && process.env.AUTH_DEV_BYPASS === "1") {
    log.warn("AUTH_DEV_BYPASS is ignored in production");
  }

  if (process.env.NODE_ENV === "production") {
    const artifactCount = hydrateHitboxCacheFromArtifact();
    if (artifactCount > 0) {
      log.info({ hitboxes: artifactCount }, "loaded hitbox artifact");
    } else {
      const dbCount = await hydrateHitboxCacheFromDb(db);
      if (dbCount === 0) {
        throw new Error(
          "[hitbox] no baked artifact or DB hitboxes found; run the server build before production start",
        );
      }
      log.warn({ hitboxes: dbCount }, "loaded hitboxes from DB fallback");
    }
  } else {
    const { atlasPng, atlasJson } = getAtlasPaths();
    await initHitboxCache(db, atlasPng, atlasJson);
  }

  // ── WORLD ─────────────────────────────────────────────

  const world = new World();
  const spectatorManager = new SpectatorManager(world, {
    isPlayerConnected: (playerId) => io.sockets.sockets.has(playerId),
    isPlayerInactive: (playerId) => inactiveSockets.has(playerId),
  });

  world.nodePreparingEmitter = (playerId, nodeId) => {
    io.sockets.sockets.get(playerId)?.emit("node:preparing", { nodeId });
  };

  world.overlordRespawnPersist = (marker) => {
    const op = marker
      ? writeWorldState(db, OVERLORD_RESPAWN_KEY, JSON.stringify(marker))
      : clearWorldState(db, OVERLORD_RESPAWN_KEY);
    void op.catch((err) =>
      log.error({ err }, "overlord respawn persist failed"),
    );
  };
  await restoreOverlordRespawn(world);

  const emitBossFelledState = () => {
    io.emit("world:bossFelled", world.buildBossFelledSnapshot());
  };
  world.bossFelledBroadcast = emitBossFelledState;
  const adminControls = registerAdminNamespace(
    io,
    world,
    db,
    sessionsBySocket,
    inactiveSockets,
  );
  onTelemetry((telemetry) => {
    io.emit("world:telemetry", telemetry);
    adminControls.emitTelemetry(telemetry);
  });

  // ── MARKER INVARIANT CHECK (dev only) ─────────────────
  if (IS_DEV) {
    const markerViolations = assertMarkerInvariants(world);
    if (markerViolations.length > 0) {
      log.error({ markerViolations }, "marker/status invariant mismatch");
    } else {
      log.info("marker components OK");
    }
    const networkViolations = assertNetworkedComponentInvariants(world);
    if (networkViolations.length > 0) {
      log.error({ networkViolations }, "networked component invariant mismatch");
    } else {
      log.info("networked components OK");
    }
    const modifierViolations = validateNodeModifiers();
    if (modifierViolations.length > 0) {
      log.error({ modifierViolations }, "node modifier assignment invalid");
    } else {
      log.info("node modifiers OK");
    }
    const sealViolations = validateTierAdvancement();
    if (sealViolations.length > 0) {
      log.error({ sealViolations }, "tier advancement seal requirement unreachable");
    } else {
      log.info("tier advancement OK");
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
  const queuedWorldLogEntries: WorldLogInsertEntry[] = [];
  const queuedAnalyticsEvents: AnalyticsEventInput[] = [];

  function queueAnalyticsEvent(entry: AnalyticsEventInput): void {
    queuedAnalyticsEvents.push(entry);
  }

  function playerAccountId(playerId: string): string | undefined {
    return accountIdForSocket(playerId);
  }

  function queuePlayerAnalyticsEvent(
    playerId: string,
    entry: Omit<AnalyticsEventInput, "playerId" | "accountId">,
  ): void {
    queueAnalyticsEvent({
      ...entry,
      playerId,
      accountId: playerAccountId(playerId),
    });
  }

  function recordSessionEnd(socketId: string, accId: string, p: PlayerEntity): void {
    const startedAt = sessionStartedAtBySocket.get(socketId);
    if (!startedAt) return;
    sessionStartedAtBySocket.delete(socketId);
    queueAnalyticsEvent({
      kind: "session-end",
      accountId: accId,
      playerId: socketId,
      nodeId: p.hasPosition.nodeId,
      value: Math.max(0, Date.now() - startedAt),
      meta: {
        characterId: sessionsBySocket.get(socketId)?.characterId,
        level: p.tracksProgression.level,
        playerTier: p.tracksProgression.playerTier,
        selectedClass: p.usesSkills.selectedClass,
        selectedSubVariant: p.usesSkills.selectedSubVariant,
        selectedRange: p.usesSkills.selectedRange,
      },
    });
  }

  world.analyticsNodeTransition = (playerId, fromNodeId, toNodeId) => {
    const info = NODE_BIOMES[toNodeId];
    queuePlayerAnalyticsEvent(playerId, {
      kind: "node-enter",
      nodeId: toNodeId,
      meta: {
        fromNodeId,
        biomeGroup: info?.biomeGroup,
        biomeTier: info?.biomeTier,
      },
    });
  };
  world.analyticsPlayerDeath = (playerId, nodeId) => {
    queuePlayerAnalyticsEvent(playerId, {
      kind: "player-death",
      nodeId,
    });
  };
  world.analyticsSkillUnlock = (playerId, skillId, path) => {
    const p = world.getPlayerEntity(playerId);
    const node = SKILL_TREE.get(skillId);
    queuePlayerAnalyticsEvent(playerId, {
      kind: "skill-unlock",
      nodeId: p?.hasPosition.nodeId,
      meta: {
        skillId,
        skillName: node?.name ?? skillId,
        skillTier: node?.tier,
        path,
      },
    });
  };
  world.analyticsProgression = (playerId, nodeId, progressionKind, value) => {
    queuePlayerAnalyticsEvent(playerId, {
      kind: "progression",
      nodeId,
      value,
      meta: { progressionKind },
    });
  };

  const worldLogFlushTimer = setInterval(() => {
    if (queuedWorldLogEntries.length === 0) return;
    const batch = queuedWorldLogEntries.splice(0, queuedWorldLogEntries.length);
    void insertWorldLogEntries(batch).catch((err) =>
      log.warn({ err }, "world log flush failed"),
    );
  }, 1_000);
  worldLogFlushTimer.unref?.();

  const analyticsFlushTimer = setInterval(() => {
    if (queuedAnalyticsEvents.length === 0) return;
    const batch = queuedAnalyticsEvents.splice(0, queuedAnalyticsEvents.length);
    void insertAnalyticsEvents(batch).catch((err) =>
      log.warn({ err }, "analytics flush failed"),
    );
  }, 1_000);
  analyticsFlushTimer.unref?.();

  let last = Date.now();

  // Simulation tick — 10 Hz. Drives all game logic: movement, combat, AI, DoT.
  // Running at 100 ms gives ≤99 ms attack quantization vs ≤499 ms at 2 Hz.
  setInterval(() => {
    const now = Date.now();
    const dt = now - last;
    last = now;

    world.tick(dt, now);
    // Reconcile after simulation so a target crossing a node boundary updates
    // spectator status and broadcast routing against the same authoritative tick.
    spectatorManager.reconcile(now);

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
    const occupiedNodes = new Set<string>();
    const activeNodes = new Set<string>();
    for (const player of world.playerEntities) {
      const sock = io.sockets.sockets.get(player.isPlayer.id);
      if (!sock) continue;
      const nodeId = player.hasPosition.nodeId;
      occupiedNodes.add(nodeId);

      // Hidden tab: skip its high-volume stream and drop any queued world-log
      // events so a backgrounded auto-combat player can't accumulate them
      // unbounded. State is rebuilt via state:sync when the tab regains focus.
      if (inactiveSockets.has(player.isPlayer.id)) {
        takeWorldLogEvents(world, player.isPlayer.id);
        continue;
      }
      activeNodes.add(nodeId);

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
        const viewerAccountId = accountIdForSocket(player.isPlayer.id);
        const viewerCharacterId = sessionsBySocket.get(player.isPlayer.id)?.characterId ?? undefined;
        for (const event of logEvents) {
          queuedWorldLogEntries.push({
            viewerId: player.isPlayer.id,
            viewerAccountId,
            viewerCharacterId,
            viewerName: player.isPlayer.name,
            event,
          });
        }
        sock.emit("world:events", logEvents);
      }
    }

    // Anonymous viewers receive a separate privacy-filtered projection. Build
    // once per watched node so additional spectators do not multiply ECS work.
    for (const [nodeId, sockets] of spectatorManager.recipientsByNode()) {
      const events = nodeSnaps.get(nodeId)?.events ?? world.takeNodeEvents(nodeId);
      const snapshot = buildSpectatorNodeSnapshot(world, nodeId, events);
      recordBroadcast(snapshot, "spectate:snapshot");
      for (const socket of sockets) socket.emit("spectate:snapshot", snapshot);
    }

    // Drain transient combat events for occupied nodes that no active viewer
    // built a snapshot for this tick (every viewer hidden), so the per-node
    // event queue can't grow without bound while a node is fully backgrounded.
    for (const nodeId of occupiedNodes) {
      if (!activeNodes.has(nodeId)) world.takeNodeEvents(nodeId);
    }
  }, BROADCAST_MS);

  const TELEMETRY_MS = TELEMETRY_WINDOW_MS;
  setInterval(() => {
    world.syncTelemetryOccupancy();
    const telemetry = world.telemetry.flush(world.tickCounter);
    queueAnalyticsEvent({
      kind: "server-sample",
      value: world.playerCount(),
      meta: {
        heapUsedMb: telemetry.process.heapUsedMb,
        eventLoopP99Ms: telemetry.process.eventLoopP99Ms,
        totalTickCpuMs: telemetry.process.totalTickCpuMs,
      },
    });
    void publishTelemetry(telemetry).catch((err) =>
      log.warn({ err }, "telemetry broker publish failed"),
    );
  }, TELEMETRY_MS);

  // ── AUTO-SAVE ─────────────────────────────────────────
  // Persist every connected player every 30 s as a crash safety net.
  setInterval(() => {
    for (const [socketId, session] of sessionsBySocket) {
      const player = world.getPlayerEntity(socketId);
      const { accountId, characterId } = session;
      if (player && characterId) {
        void saveCharacter(db, characterId, player).catch((err) =>
          log.error(
            { err, accountId, characterId, playerId: socketId },
            "autosave failed",
          ),
        );
      }
    }
  }, 30_000);

  // ── SOCKETS ──────────────────────────────────────────

  async function setupPlayerSocket(
    socket: Socket<ClientToServerEvents, ServerToClientEvents>,
  ): Promise<void> {
    const accId = socket.data.accountId as string;
    const authKind = socket.data.authKind as "session" | "dev";
    const accountLogin = authKind === "session"
      ? await touchAccountLogin(db, accId)
      : await findOrCreateDevAccount(
          db,
          accId,
          `Dev_${accId.slice(0, 8)}`,
        );

    // Duplicate-session ownership is account-wide, including lobby sockets.
    const existingSocketId = socketByAccount.get(accId);
    if (existingSocketId) {
      const existingSession = sessionsBySocket.get(existingSocketId);
      const existingPlayer = world.getPlayerEntity(existingSocketId);
      if (existingPlayer?.isDead) world.respawnPlayer(existingSocketId);
      if (existingPlayer && existingSession?.characterId) {
        recordSessionEnd(existingSocketId, accId, existingPlayer);
        await saveCharacter(db, existingSession.characterId, existingPlayer);
      }
      handlePartyDisconnect(world, existingSocketId);
      world.detachPlayerEntity(existingSocketId);
      sessionsBySocket.delete(existingSocketId);
      inactiveSockets.delete(existingSocketId);
      const existingSock = io.sockets.sockets.get(existingSocketId);
      existingSock?.emit("session:kicked", { reason: "duplicate_session" });
      existingSock?.disconnect(true);
    }

    const session: PlayerSocketSession = { accountId: accId, characterId: null };
    sessionsBySocket.set(socket.id, session);
    socketByAccount.set(accId, socket.id);

    registerPlayerHandlers(socket, {
      world,
      db,
      session,
      sessionsBySocket,
      adminControls,
      socketByAccount,
      inactiveSockets,
      sessionStartedAtBySocket,
      recordSessionEnd,
      emitBossFelledState,
    });

    let selectingCharacter = false;
    let mutatingCharacters = false;

    const emitCharacterList = async (): Promise<void> => {
      socket.emit("account:characters", {
        characters: await listAccountCharacters(db, accId),
      });
    };

    const enterCharacterWorld = async (
      characterId: string,
      emitResult = true,
    ): Promise<boolean> => {
      if (selectingCharacter || mutatingCharacters || session.characterId !== null) {
        if (emitResult) {
          socket.emit("character:selectResult", {
            success: false,
            reason: "A character is already entering or in the world.",
          });
        }
        return false;
      }

      selectingCharacter = true;
      try {
        const player = await loadCharacter(db, accId, characterId);
        if (!player) {
          if (emitResult) {
            socket.emit("character:selectResult", {
              success: false,
              reason: "Character not found.",
            });
          }
          return false;
        }

        // A duplicate login can disconnect this socket while the DB load is pending.
        if (!socket.connected || socketByAccount.get(accId) !== socket.id) return false;

        const spawnNodeId = player.hasPosition.nodeId;
        if (world.isNodeFrozen(spawnNodeId)) {
          socket.emit("node:preparing", { nodeId: spawnNodeId });
          thawNode(world, spawnNodeId);
        }

        if (!socket.connected || socketByAccount.get(accId) !== socket.id) return false;

        session.characterId = characterId;
        const entity = world.attachPlayerEntity(player, socket.id);
        syncArchetypeSlices(world, entity);
        recalculatePlayerEntityStats(world, entity);
        syncArchetypeSlices(world, entity);
        entity.hasHealth.hp = entity.hasHealth.maxHp;
        sessionStartedAtBySocket.set(socket.id, Date.now());
        queueAnalyticsEvent({
          kind: "session-start",
          accountId: accId,
          playerId: socket.id,
          nodeId: entity.hasPosition.nodeId,
          meta: {
            characterId,
            level: entity.tracksProgression.level,
            playerTier: entity.tracksProgression.playerTier,
          },
        });
        queueAnalyticsEvent({
          kind: "node-enter",
          accountId: accId,
          playerId: socket.id,
          nodeId: entity.hasPosition.nodeId,
          meta: {
            characterId,
            biomeGroup: NODE_BIOMES[entity.hasPosition.nodeId]?.biomeGroup,
            biomeTier: NODE_BIOMES[entity.hasPosition.nodeId]?.biomeTier,
            fromNodeId: null,
          },
        });

        const syncSnap = world.buildNodeDelta(
          entity.hasPosition.nodeId,
          { patched: new Map(), detached: new Map() },
          { resync: true },
        );
        recordBroadcast(syncSnap, "state:sync");
        socket.emit("state:sync", syncSnap);
        if (emitResult) socket.emit("character:selectResult", { success: true });
        emitBossFelledState();
        world.syncTelemetryOccupancy();
        socket.emit("world:telemetry", world.telemetry.flush(world.tickCounter));
        adminControls.emitPlayerSummaries();
        return true;
      } catch (err) {
        if (session.characterId === characterId) {
          world.detachPlayerEntity(socket.id);
          session.characterId = null;
        }
        log.error({ err, accountId: accId, characterId }, "character select failed");
        if (emitResult) {
          socket.emit("character:selectResult", {
            success: false,
            reason: "Unable to enter the world.",
          });
        }
        return false;
      } finally {
        selectingCharacter = false;
      }
    };

    socket.on("character:select", (payload) => {
      const characterId = payload?.characterId;
      if (typeof characterId !== "string" || characterId.length === 0) {
        socket.emit("character:selectResult", {
          success: false,
          reason: "Invalid character selection.",
        });
        return;
      }
      void enterCharacterWorld(characterId);
    });

    socket.on("character:create", (payload) => {
      void createLobbyCharacter(payload?.name);
    });

    socket.on("character:delete", (payload) => {
      void deleteLobbyCharacter(payload?.characterId);
    });

    const updateAnnouncement = currentReleaseAnnouncement();
    if (
      updateAnnouncement &&
      accountLogin.previousLoginAt !== null &&
      updateAnnouncement.releasedAt > accountLogin.previousLoginAt
    ) {
      socket.emit("game:updateAnnouncement", updateAnnouncement);
    }

    await emitCharacterList();

    async function createLobbyCharacter(requestedName: unknown): Promise<void> {
      if (session.characterId !== null) {
        socket.emit("character:createResult", {
          success: false,
          reason: "Return to character select before creating a character.",
        });
        return;
      }
      if (mutatingCharacters || selectingCharacter) {
        socket.emit("character:createResult", {
          success: false,
          reason: "Another character action is already in progress.",
        });
        return;
      }

      const validation = validateCharacterName(
        typeof requestedName === "string" ? requestedName : "",
      );
      if (!validation.ok) {
        socket.emit("character:createResult", {
          success: false,
          reason: validation.reason,
        });
        return;
      }

      mutatingCharacters = true;
      try {
        const characterId = await createCharacter(db, accId, validation.name);
        socket.emit("character:createResult", { success: true, characterId });
        await emitCharacterList();
      } catch (err) {
        log.error({ err, accountId: accId }, "character create failed");
        socket.emit("character:createResult", {
          success: false,
          reason: "Unable to create character.",
        });
      } finally {
        mutatingCharacters = false;
      }
    }

    async function deleteLobbyCharacter(characterId: unknown): Promise<void> {
      if (session.characterId !== null) {
        socket.emit("character:deleteResult", {
          success: false,
          reason: "Return to character select before deleting a character.",
        });
        return;
      }
      if (mutatingCharacters || selectingCharacter) {
        socket.emit("character:deleteResult", {
          success: false,
          reason: "Another character action is already in progress.",
        });
        return;
      }
      if (typeof characterId !== "string" || characterId.length === 0) {
        socket.emit("character:deleteResult", {
          success: false,
          reason: "Invalid character selection.",
        });
        return;
      }

      mutatingCharacters = true;
      try {
        const deleted = await softDeleteCharacter(db, accId, characterId);
        socket.emit("character:deleteResult", deleted
          ? { success: true }
          : { success: false, reason: "Character not found." });
        await emitCharacterList();
      } catch (err) {
        log.error({ err, accountId: accId, characterId }, "character delete failed");
        socket.emit("character:deleteResult", {
          success: false,
          reason: "Unable to delete character.",
        });
      } finally {
        mutatingCharacters = false;
      }
    }
  }

  function setupSpectatorSocket(
    socket: Socket<ClientToServerEvents, ServerToClientEvents>,
  ): void {
    if (!spectatorManager.admit(socket, socket.handshake.address)) {
      socket.emit("spectate:error", {
        reason: "The live view is at capacity. Please try again soon.",
      });
      setTimeout(() => socket.disconnect(true), 0);
      return;
    }
    socket.on("spectate:setActive", (active) => {
      spectatorManager.setActive(socket.id, active === true);
    });
    socket.on("spectate:resume", () => spectatorManager.resume(socket.id));
    const refuseCharacterAction = (): void => {
      socket.emit("character:selectResult", {
        success: false,
        reason: "Sign in before choosing a character.",
      });
    };
    socket.on("character:select", refuseCharacterAction);
    socket.on("character:create", () => {
      socket.emit("character:createResult", {
        success: false,
        reason: "Sign in before creating a character.",
      });
    });
    socket.on("character:delete", () => {
      socket.emit("character:deleteResult", {
        success: false,
        reason: "Sign in before deleting a character.",
      });
    });
    socket.on("disconnect", () => spectatorManager.remove(socket.id));
  }

  io.on("connection", (socket) => {
    if (socket.data.authKind === "spectator") {
      setupSpectatorSocket(socket);
      return;
    }
    void setupPlayerSocket(socket).catch((err) => {
      log.error({ err, socketId: socket.id }, "socket connection setup failed");
      socket.disconnect(true);
    });
  });

  // ── START ────────────────────────────────────────────

  const port = Number(process.env.PORT) || 4000;
  httpServer.listen(port, "0.0.0.0", () => {
    log.info({ port }, `Server running on http://0.0.0.0:${port}`);
  });

  const shutdown = (signal: string) => {
    log.info({ signal }, "shutting down");
    spectatorManager.shutdown();
    io.close();
    httpServer.closeAllConnections?.();
    httpServer.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 5_000).unref();
  };
  process.once("SIGTERM", () => shutdown("SIGTERM"));
  process.once("SIGINT", () => shutdown("SIGINT"));
}

boot().catch((err) => {
  log.fatal({ err }, "boot failed");
  process.exit(1);
});
