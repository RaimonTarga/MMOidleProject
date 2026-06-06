import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import path from "path";

import { World, type PersistedBossRespawn } from "./world/World";
import { takeWorldLogEvents } from "./world/worldLog";
import {
  ACTION_DATABASE,
  CONDITION_DATABASE,
  DEFAULT_AUTOCOMBAT_CONFIG,
  emptyEquipment,
  GAME_CONFIG,
  ITEM_DATABASE,
  NODE_BIOMES,
  pointInNodeFeatureShape,
  registerDevItems,
  resetTracksCombat,
  RESOLVED_NODE_FEATURES,
  RUNE_ALTAR_FEATURE_ID,
  SKILL_TREE,
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
import { handlePlayerEmoteIntent } from "./systems/player/emotes";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  EquipmentSlot,
  DeltaSnapshot,
  AutocombatConfig,
  AutocombatPriorityMode,
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
import { recordBroadcast } from "./net/profiler";
import { timeSync } from "./telemetry/nodeTelemetry";
import { TELEMETRY_WINDOW_MS } from "./telemetry/constants";
import { initCombatSystems } from "./systems/combatBootstrap";
import {
  despawnMinionsForOwner,
  relocateMinionsForOwner,
} from "./systems/classes/archetypes/summoner";
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
import {
  equipPhaseTester,
  goToTestRoom,
  leaveTestRoom,
  refreshPlayerRecipes,
  resetPlayerClass,
  resetPlayerProgress,
  respawnNode,
  teleportPlayerToNode,
} from "./admin/gameActions";

export { IS_DEV };

const AUTOCOMBAT_PRIORITY_MODES: readonly AutocombatPriorityMode[] = [
  "nearest",
  "damage",
  "threat",
  "balanced",
];

function sanitizeAutocombatConfig(input: AutocombatConfig): AutocombatConfig {
  const raw =
    typeof input === "object" && input !== null
      ? (input as Partial<AutocombatConfig>)
      : {};
  const mode =
    raw.priorityMode && AUTOCOMBAT_PRIORITY_MODES.includes(raw.priorityMode)
      ? raw.priorityMode
    : DEFAULT_AUTOCOMBAT_CONFIG.priorityMode;

  return {
    engageUltimateBosses: !!raw.engageUltimateBosses,
    fleeWhenLow:
      raw.fleeWhenLow === undefined
        ? DEFAULT_AUTOCOMBAT_CONFIG.fleeWhenLow
        : !!raw.fleeWhenLow,
    fleeHpPct: clampNumber(raw.fleeHpPct, 0, 1, DEFAULT_AUTOCOMBAT_CONFIG.fleeHpPct),
    priorityMode: mode,
    acquireRadius: clampNumber(
      raw.acquireRadius,
      120,
      GAME_CONFIG.NODE_WIDTH,
      DEFAULT_AUTOCOMBAT_CONFIG.acquireRadius,
    ),
    focusLeaderTarget:
      raw.focusLeaderTarget === undefined
        ? DEFAULT_AUTOCOMBAT_CONFIG.focusLeaderTarget
        : !!raw.focusLeaderTarget,
  };
}

function clampNumber(
  value: number | undefined,
  min: number,
  max: number,
  fallback: number,
): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, value));
}

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

// Serve the production client build when it exists.
// Run `pnpm --filter @mmo-idle/client build` to generate it.
const clientDist = path.resolve(__dirname, "../../client/dist");
const adminDist = path.resolve(__dirname, "../../admin/dist");
app.use("/admin", express.static(adminDist));
app.get(["/admin", "/admin/*"], (_req, res) => {
  res.sendFile(path.join(adminDist, "index.html"));
});
app.use(express.static(clientDist));

const httpServer = createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: { origin: true },
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
const sessionStartedAtBySocket = new Map<string, number>();

// Sockets whose tab is currently hidden/backgrounded. While a socket is here,
// the broadcast loop skips its high-volume node:delta / world:events stream; the
// client requests a full resync when the tab regains focus.
const inactiveSockets = new Set<string>();

function accountIdForSocket(socketId: string): string | undefined {
  for (const [accountId, mappedSocketId] of socketByAccount) {
    if (mappedSocketId === socketId) return accountId;
  }
  return undefined;
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
  await pruneExpiredLogs();
  await pruneExpiredWorldLogEntries();
  await pruneExpiredAnalyticsEvents();
  const pruneTimer = setInterval(() => {
    void Promise.all([
      pruneExpiredLogs(),
      pruneExpiredWorldLogEntries(),
      pruneExpiredAnalyticsEvents(),
    ]).catch((err) => log.warn({ err }, "log retention prune failed"));
  }, 60 * 60 * 1000);
  pruneTimer.unref?.();

  const { atlasPng, atlasJson } = getAtlasPaths();
  await initHitboxCache(db, atlasPng, atlasJson);

  // ── WORLD ─────────────────────────────────────────────

  const world = new World();

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
    socketByAccount,
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
        for (const event of logEvents) {
          queuedWorldLogEntries.push({
            viewerId: player.isPlayer.id,
            viewerAccountId,
            viewerName: player.isPlayer.name,
            event,
          });
        }
        sock.emit("world:events", logEvents);
      }
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
    for (const [accountId, socketId] of socketByAccount) {
      const player = world.getPlayerEntity(socketId);
      if (player) {
        void saveCharacter(db, accountId, player).catch((err) =>
          log.error({ err, accountId, playerId: socketId }, "autosave failed"),
        );
      }
    }
  }, 30_000);

  // ── SOCKETS ──────────────────────────────────────────

  io.on("connection", async (socket) => {
    const auth = socket.handshake.auth as {
      accountId?: string;
      displayName?: string;
    };
    const accId = auth.accountId ?? socket.id;
    const playerName = (
      auth.displayName ?? `Hero_${socket.id.slice(0, 5)}`
    ).slice(0, 32);

    await findOrCreateAccount(db, accId, playerName);

    // Kick any existing session for this account (e.g. duplicate tab).
    // Save + clean up the old entity before the new one attaches so there's
    // never two live PlayerEntities for the same account.
    const existingSocketId = socketByAccount.get(accId);
    if (existingSocketId) {
      const existingPlayer = world.getPlayerEntity(existingSocketId);
      if (existingPlayer?.isDead) world.respawnPlayer(existingSocketId);
      if (existingPlayer) {
        recordSessionEnd(existingSocketId, accId, existingPlayer);
        await saveCharacter(db, accId, existingPlayer);
      }
      handlePartyDisconnect(world, existingSocketId);
      world.detachPlayerEntity(existingSocketId);
      const existingSock = io.sockets.sockets.get(existingSocketId);
      existingSock?.emit("session:kicked", { reason: "duplicate_session" });
      existingSock?.disconnect(true);
    }

    const player = await getOrCreateCharacter(db, accId, playerName);

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
    sessionStartedAtBySocket.set(socket.id, Date.now());
    queueAnalyticsEvent({
      kind: "session-start",
      accountId: accId,
      playerId: socket.id,
      nodeId: entity.hasPosition.nodeId,
      meta: {
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
    emitBossFelledState();
    world.syncTelemetryOccupancy();
    socket.emit("world:telemetry", world.telemetry.flush(world.tickCounter));
    adminControls.emitPlayerSummaries();

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
        world.movePlayerNode(fromNodeId, nodeId, p.isPlayer.id);
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
      if (!enabled) detachComponent(world, p, "isFleeing");
    });

    socket.on("player:setAutoTraverse", (enabled) => {
      const p = liveSelf();
      if (!p) return;
      mutateSlice(world, p, "usesAutocombat", (s) => {
        s.autoTraverse = !!enabled;
      });
      if (!enabled) clearAutoTraversePath(world, p);
    });

    socket.on("player:setAutocombatConfig", (config) => {
      const p = liveSelf();
      if (!p) return;
      const sanitized = sanitizeAutocombatConfig(config);
      mutateSlice(world, p, "usesAutocombat", (s) => {
        Object.assign(s, sanitized);
      });
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

    socket.on("player:setActive", (active) => {
      if (typeof active !== "boolean") return;
      if (active) inactiveSockets.delete(socket.id);
      else inactiveSockets.add(socket.id);
      adminControls.emitPlayerSummaries();
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

    socket.on("player:resetClass", () => {
      const p = liveSelf();
      if (!p) return;
      resetPlayerClass(world, p, { requireAltar: true });
      adminControls.emitPlayerSummaries();
    });

    socket.on("rune:setLoadout", (rules) => {
      const p = liveSelf();
      if (!p) return;
      if (!Array.isArray(rules)) return;
      const owned = new Set(p.tracksProgression.runesOwned);
      const valid = rules.filter(
        (r) =>
          r &&
          typeof r.conditionId === "string" &&
          typeof r.actionId === "string" &&
          CONDITION_DATABASE.has(r.conditionId) &&
          ACTION_DATABASE.has(r.actionId) &&
          owned.has(r.conditionId) &&
          owned.has(r.actionId),
      );
      p.tracksProgression.runesEquipped = valid.map((r) => ({
        conditionId: r.conditionId,
        actionId: r.actionId,
      }));
      markSliceDirty(world, p, "tracksProgression");
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

    socket.on("player:emote", (emoteId) => {
      const p = liveSelf();
      if (!p || typeof emoteId !== "string") return;
      handlePlayerEmoteIntent(world, p, emoteId, Date.now());
    });

    if (IS_DEV) {
      socket.on("debug:goToTestRoom", () => {
        const p = world.getPlayerEntity(socket.id);
        if (!p) return;
        goToTestRoom(world, p);
        adminControls.emitPlayerSummaries();
      });

      socket.on("debug:teleportToNode", (nodeId) => {
        if (typeof nodeId !== "string") return;
        const p = liveSelf();
        if (!p) return;
        teleportPlayerToNode(world, p, nodeId);
        adminControls.emitPlayerSummaries();
      });

      socket.on("debug:leaveTestRoom", () => {
        const p = world.getPlayerEntity(socket.id);
        if (!p) return;
        leaveTestRoom(world, p);
        adminControls.emitPlayerSummaries();
      });

      socket.on("debug:refreshRecipes", () => {
        const p = world.getPlayerEntity(socket.id);
        if (!p) return;
        refreshPlayerRecipes(world, p);
      });

      socket.on("debug:respawnNode", () => {
        const p = world.getPlayerEntity(socket.id);
        if (!p) return;
        respawnNode(world, p.hasPosition.nodeId);
      });

      socket.on("debug:equipPhaseTester", () => {
        const p = liveSelf();
        if (!p) return;
        equipPhaseTester(world, p);
        adminControls.emitPlayerSummaries();
      });

      socket.on("debug:resetProgress", () => {
        const p = world.getPlayerEntity(socket.id);
        if (!p) return;
        resetPlayerProgress(world, p);
        adminControls.emitPlayerSummaries();
      });
    }

    socket.on("disconnect", () => {
      const p = world.getPlayerEntity(socket.id);
      if (p?.isDead) world.respawnPlayer(socket.id);
      if (p) {
        recordSessionEnd(socket.id, accId, p);
        void saveCharacter(db, accId, p).catch((err) =>
          log.error({ err, accountId: accId, playerId: socket.id }, "disconnect save failed"),
        );
      }
      handlePartyDisconnect(world, socket.id);
      inactiveSockets.delete(socket.id);
      sessionStartedAtBySocket.delete(socket.id);
      // Only remove the account entry if it still points to this socket.
      // A kicked socket's disconnect fires after the new session has already
      // overwritten the entry — deleting it would silently log out the new tab.
      if (socketByAccount.get(accId) === socket.id)
        socketByAccount.delete(accId);
      world.detachPlayerEntity(socket.id);
      adminControls.emitPlayerSummaries();
    });
  });

  // ── START ────────────────────────────────────────────

  const port = Number(process.env.PORT) || 4000;
  httpServer.listen(port, "0.0.0.0", () => {
    log.info({ port }, `Server running on http://0.0.0.0:${port}`);
  });

  const shutdown = (signal: string) => {
    log.info({ signal }, "shutting down");
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
