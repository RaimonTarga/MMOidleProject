import type { Socket } from "socket.io";
import {
  DEFAULT_AUTOCOMBAT_CONFIG,
  ESSENCE_TYPES,
  GAME_CONFIG,
  NODE_BIOMES,
  TEST_ROOM_NODE_ID,
  globalMastery,
  normalizeEquippedAbilities,
  runeBudgetForGlobalMastery,
  sanitizeRuneLoadout,
} from "@mmo-idle/shared";
import type {
  AutocombatConfig,
  AutocombatPriorityMode,
  ClientToServerEvents,
  EquipmentSlot,
  ServerToClientEvents,
} from "@mmo-idle/shared";
import type { World } from "../world/World";
import type { DB } from "../db/playerRepo";
import type { PlayerEntity } from "../ecs/entity";
import type { AdminNamespaceControls } from "../admin/namespace";
import { saveCharacter } from "../db/playerRepo";
import type { PlayerSocketSession } from "./socketSession";
import { log } from "../log";
import { IS_DEV } from "../env";
import { recordBroadcast } from "./profiler";
import { unlockSkill } from "../systems/player/progression/skills";
import { equipItem, unequipItem } from "../systems/player/economy/inventory";
import { craftRecipe } from "../systems/player/economy/crafting";
import { evolveItem } from "../systems/player/economy/itemEvolution";
import { craftRuneRecipe } from "../systems/player/economy/runeCrafting";
import {
  craftAbilityRecipe,
  setAbilityLoadout,
} from "../systems/player/economy/abilityCrafting";
import {
  craftStanceRecipe,
  setStanceLoadout,
} from "../systems/player/economy/stanceCrafting";
import {
  craftRiteRecipe,
  setRiteLoadout,
} from "../systems/player/economy/riteCrafting";
import { upgradeItem } from "../systems/player/economy/itemUpgrade";
import {
  handlePartyDisconnect,
  joinParty,
  leaveParty,
} from "../systems/player/party/partySystem";
import { handlePlayerEmoteIntent } from "../systems/player/emotes";
import { setEntityMotion, stopEntity } from "../systems/world/movement";
import { setAggroTarget, setAttackTarget } from "../systems/combat/ai/targeting";
import { clearEngagement } from "../systems/combat/ai/engagement";
import { attachComponent, detachComponent } from "../ecs/markerHelpers";
import {
  applySummonerCommand,
  clearSummonerCommand,
} from "../systems/classes/archetypes/summoner/command";
import { relocateMinionsForOwner } from "../systems/classes/archetypes/summoner";
import { markSliceDirty, mutateSlice } from "../ecs/dirtyHelpers";
import {
  clearAutoTraversePath,
  startManualNavigation,
} from "../systems/world/autoTraverse";
import { clampMoveTargetToNode } from "../systems/world/transitions";
import { thawNode } from "../world/nodeLifecycle";
import { rightmostEntranceTarget } from "../world/nodePath";
import { activateDungeonAltar } from "../systems/world/dungeons/gauntlet";
import {
  equipPhaseTester,
  goToTestRoom,
  leaveTestRoom,
  renamePlayer,
  resetPlayerClass,
  resetPlayerProgress,
  respawnNode,
  teleportPlayerToNode,
} from "../admin/gameActions";

const AUTOCOMBAT_PRIORITY_MODES: readonly AutocombatPriorityMode[] = [
  "nearest",
  "lowest-hp",
  "highest-max-hp",
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

/**
 * Everything the per-connection player socket handlers close over that lives
 * outside this module: the world, the game DB, this socket's account id, the
 * admin control surface, the shared connection-tracking maps, and the two boot
 * helpers (`recordSessionEnd`, `emitBossFelledState`) the disconnect/resync
 * paths need. Boot owns these; handlers only read them.
 */
export interface PlayerHandlerDeps {
  world: World;
  db: DB;
  session: PlayerSocketSession;
  sessionsBySocket: Map<string, PlayerSocketSession>;
  adminControls: AdminNamespaceControls;
  socketByAccount: Map<string, string>;
  inactiveSockets: Set<string>;
  sessionStartedAtBySocket: Map<string, number>;
  recordSessionEnd: (socketId: string, accId: string, p: PlayerEntity) => void;
  emitBossFelledState: () => void;
}

/**
 * Registers every player-facing `socket.on` handler for a freshly connected
 * socket. Called once per connection after boot has attached the player entity
 * and sent the initial state:sync. Pure move out of index.ts — no validation,
 * event names, or behavior changed.
 */
export function registerPlayerHandlers(
  socket: Socket<ClientToServerEvents, ServerToClientEvents>,
  deps: PlayerHandlerDeps,
): void {
  const {
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
  } = deps;

  function liveSelf(): PlayerEntity | null {
    const p = world.getPlayerEntity(socket.id);
    return p && !p.isDead ? p : null;
  }

  // NOTE: unused — no caller anywhere in the codebase. Moved verbatim from
  // index.ts to keep this a pure move; safe to delete in a follow-up.
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

  socket.on("player:move", (pos, opts) => {
    const p = liveSelf();
    if (!p) return;
    if (p.isChanneling) return;
    clearSummonerCommand(world, p);
    const clamped = clampMoveTargetToNode(p.hasPosition.nodeId, pos);
    setEntityMotion(world, p, clamped, {
      mode: opts?.mode === "direct" ? "direct" : "path",
    });
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
    if (!enabled) {
      detachComponent(world, p, "isFleeing");
      return;
    }
    // Click/keyboard moves latch hasManualMoveIntent until the server stops.
    // Toggling auto on must release that latch or updateAutoTargets skips every
    // tick ("auto combat does nothing").
    detachComponent(world, p, "hasManualMoveIntent");
    stopEntity(world, p);
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

  socket.on("player:activateDungeonAltar", () => {
    const p = liveSelf();
    if (!p) return;
    activateDungeonAltar(world, p);
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
    const budget = runeBudgetForGlobalMastery(
      globalMastery(p.tracksProgression.biomeLevel),
    );
    const valid = sanitizeRuneLoadout(
      rules,
      owned,
      budget,
      p.usesSkills.combatArchetype,
    );
    p.tracksProgression.runesEquipped = valid;
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

  socket.on("crafting:evolveItem", (payload) => {
    const p = liveSelf();
    if (!p || !payload || typeof payload.recipeId !== "string") return;
    if (payload.mode !== "evolve" && payload.mode !== "reconstruct") return;
    const result = evolveItem(world, p, payload.recipeId, payload.mode);
    socket.emit("crafting:result", result);
  });

  socket.on("rune:craftRecipe", (recipeId: string) => {
    const p = liveSelf();
    if (!p || typeof recipeId !== "string") return;
    const result = craftRuneRecipe(world, p, recipeId);
    socket.emit("rune:craftResult", result);
  });

  socket.on("ability:craftRecipe", (recipeId: string) => {
    const p = liveSelf();
    if (!p || typeof recipeId !== "string") return;
    const result = craftAbilityRecipe(world, p, recipeId);
    socket.emit("ability:craftResult", result);
  });

  socket.on("ability:setLoadout", (payload) => {
    const p = liveSelf();
    if (!p || !payload?.equipped) return;
    // normalize drops non-strings, unknown ids and slot mismatches; the setter
    // then enforces the learned/slot-count/duplicate rules authoritatively.
    setAbilityLoadout(world, p, normalizeEquippedAbilities(payload.equipped));
  });

  socket.on("stance:craftRecipe", (recipeId: string) => {
    const p = liveSelf();
    if (!p || typeof recipeId !== "string") return;
    const result = craftStanceRecipe(world, p, recipeId);
    socket.emit("stance:craftResult", result);
  });

  socket.on("stance:setLoadout", (payload) => {
    const p = liveSelf();
    if (!p || !payload) return;
    if (payload.slot !== "default" && payload.slot !== "reactive") return;
    const stanceId =
      typeof payload.stanceId === "string" ? payload.stanceId : null;
    setStanceLoadout(world, p, payload.slot, stanceId);
  });

  socket.on("rite:craftRecipe", (recipeId: string) => {
    const p = liveSelf();
    if (!p || typeof recipeId !== "string") return;
    const result = craftRiteRecipe(world, p, recipeId);
    socket.emit("rite:craftResult", result);
  });

  socket.on("rite:setLoadout", (payload) => {
    const p = liveSelf();
    if (!p || !payload || !Array.isArray(payload.riteIds)) return;
    const riteIds = payload.riteIds.filter(
      (id): id is string => typeof id === "string",
    );
    setRiteLoadout(world, p, riteIds);
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

    socket.on("debug:renameCharacter", (name) => {
      if (typeof name !== "string") return;
      const p = world.getPlayerEntity(socket.id);
      if (!p) return;
      renamePlayer(world, p, name);
      adminControls.emitPlayerSummaries();
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
    const characterId = session.characterId;
    if (p && characterId) {
      recordSessionEnd(socket.id, session.accountId, p);
      void saveCharacter(db, characterId, p).catch((err) =>
        log.error(
          { err, accountId: session.accountId, characterId, playerId: socket.id },
          "disconnect save failed",
        ),
      );
    }
    handlePartyDisconnect(world, socket.id);
    inactiveSockets.delete(socket.id);
    sessionsBySocket.delete(socket.id);
    sessionStartedAtBySocket.delete(socket.id);
    // Only remove the account entry if it still points to this socket.
    // A kicked socket's disconnect fires after the new session has already
    // overwritten the entry — deleting it would silently log out the new tab.
    if (socketByAccount.get(session.accountId) === socket.id)
      socketByAccount.delete(session.accountId);
    world.detachPlayerEntity(socket.id);
    adminControls.emitPlayerSummaries();
  });
}
