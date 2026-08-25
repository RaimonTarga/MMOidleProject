import {
  CLEARING_NODE_ID,
  GAME_CONFIG,
  emptyEquipment,
  emptyEquippedAbilities,
  emptyEquippedRites,
  emptyEquippedStances,
  type SpectateStatus,
} from "@mmo-idle/shared";
import type { PersistedPlayerSlices } from "../src/db/playerRepo";
import { World } from "../src/world/World";
import {
  pickSpectatorTarget,
  SpectatorManager,
} from "../src/net/spectatorManager";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function fakeSocket(id: string) {
  const statuses: SpectateStatus[] = [];
  return {
    id,
    connected: true,
    statuses,
    emit(event: string, payload: SpectateStatus) {
      if (event === "spectate:status") statuses.push(payload);
      return true;
    },
  };
}

function targetCandidate(id: string, playerTier: number, fighting = false) {
  return {
    isPlayer: { id },
    tracksProgression: { playerTier },
    ...(fighting ? { hasAttackTarget: {} } : {}),
  };
}

const lowTierFighting = targetCandidate("low-fighting", 1, true);
const highTierIdle = targetCandidate("high-idle", 3);
assert(
  pickSpectatorTarget([lowTierFighting, highTierIdle] as never, () => 0)?.isPlayer.id === "high-idle",
  "the highest eligible tier should outrank combat activity",
);

const highTierFighting = targetCandidate("high-fighting", 3, true);
assert(
  pickSpectatorTarget([highTierIdle, highTierFighting] as never, () => 0)?.isPlayer.id === "high-fighting",
  "combat activity should break ties within the highest tier",
);

const equallyRanked = targetCandidate("high-fighting-2", 3, true);
assert(
  pickSpectatorTarget([highTierFighting, equallyRanked] as never, () => 0.99)?.isPlayer.id === "high-fighting-2",
  "equally ranked targets should still be selected randomly",
);

const world = new World();
const manager = new SpectatorManager(world, {
  maxGlobal: 3,
  maxPerIp: 2,
  idleMs: 100,
  random: () => 0,
});

const first = fakeSocket("spectator-1");
const second = fakeSocket("spectator-2");
const refused = fakeSocket("spectator-3");

assert(manager.admit(first as never, "127.0.0.1", 0), "first spectator should be admitted");
assert(manager.admit(second as never, "127.0.0.1", 0), "second spectator from an IP should be admitted");
assert(!manager.admit(refused as never, "127.0.0.1", 0), "third spectator from one IP should be refused");
assert(first.statuses.at(-1)?.mode === "clearing", "empty world should use the Clearing fallback");
assert(!world.isNodeFrozen("node-clearing"), "active fallback viewers should thaw the Clearing");

manager.reconcile(101);
assert(first.statuses.at(-1)?.paused === true, "idle spectators should be paused");
assert(manager.recipientsByNode().size === 0, "paused spectators should receive no snapshots");
assert(world.isNodeFrozen("node-clearing"), "the Clearing should freeze when every fallback viewer pauses");

manager.resume(first.id, 102);
assert(first.statuses.at(-1)?.paused === false, "explicit activity should resume the stream");
assert(manager.recipientsByNode().size === 1, "resumed fallback should receive Clearing snapshots");
assert(!world.isNodeFrozen("node-clearing"), "resuming a fallback viewer should thaw the Clearing again");

manager.remove(first.id);
manager.remove(second.id);
manager.shutdown();

// ── Dev-only camera pinning ──────────────────────────────────────────────────

function playerSlices(id: string, name: string, playerTier: number): PersistedPlayerSlices {
  return {
    isPlayer: { id, name },
    hasPosition: {
      current: { x: 400, y: 400 },
      nodeId: CLEARING_NODE_ID,
      speed: GAME_CONFIG.PLAYER_SPEED,
    },
    hasHealth: { hp: 100, maxHp: 100, recovery: 2 },
    tracksProgression: {
      level: 0,
      skillPoints: 0,
      essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      catalysts: {},
      catalystProgress: {},
      biomeXP: {},
      biomeLevel: {},
      unlockedRecipes: [],
      questProgress: {},
      playerTier,
      currentSkillTier: 0,
      bossesCleared: [],
      clearedNodes: [],
      visitedNodes: [],
      runesOwned: [],
      runeRecipesCrafted: [],
      runesEquipped: [],
      knownAbilities: [],
      equippedAbilities: emptyEquippedAbilities(),
      knownStances: [],
      equippedStances: emptyEquippedStances(),
      activeStance: null,
      knownRites: [],
      equippedRites: emptyEquippedRites(),
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: {
      unlockedSkills: [],
      passives: {},
      selectedClass: null,
      selectedSubVariant: null,
      selectedRange: null,
      combatArchetype: null,
    },
  };
}

{
  const pinWorld = new World();
  pinWorld.attachPlayerEntity(playerSlices("bot-a", "Bot A", 3), "bot-a");
  pinWorld.attachPlayerEntity(playerSlices("bot-b", "Bot B", 1), "bot-b");

  const disconnected = new Set<string>();
  const pinManager = new SpectatorManager(pinWorld, {
    maxGlobal: 4,
    maxPerIp: 4,
    idleMs: 60_000,
    random: () => 0,
    isPlayerConnected: (id) => !disconnected.has(id),
  });

  const viewer = fakeSocket("pin-viewer");
  assert(pinManager.admit(viewer as never, "10.0.0.1", 0), "viewer should be admitted");

  // Auto-pick prefers the highest tier, so it lands on Bot A.
  assert(
    viewer.statuses.at(-1)?.targetId === "bot-a",
    "auto-follow should pick the highest-tier player",
  );

  // Pinning overrides the automatic pick, even onto a lower-tier character.
  pinManager.setTarget(viewer.id, "bot-b", 1);
  assert(viewer.statuses.at(-1)?.targetId === "bot-b", "pinning should override auto-follow");
  assert(viewer.statuses.at(-1)?.pinned === true, "a pinned status should say so");

  // Reconciling must not silently wander back to the auto pick.
  pinManager.reconcile(2);
  assert(viewer.statuses.at(-1)?.targetId === "bot-b", "a live pin should survive reconcile");

  // The roster is identity-only: no progression, inventory or build data.
  const roster = pinManager.targetRoster();
  assert(roster.length === 2, "roster should list both live players");
  const keys = Object.keys(roster[0]).sort().join(",");
  assert(
    keys === "id,name,nodeId,playerTier",
    `roster entries must stay identity-only (got ${keys})`,
  );

  // A pinned bot that DIES is still the one the viewer asked to watch. Bots die
  // constantly, so the camera takes temporary cover and must snap back.
  const botB = pinWorld.getPlayerEntity("bot-b")!;
  botB.isDead = { diedAtMs: -10_000 } as never;
  pinManager.reconcile(3);
  assert(
    viewer.statuses.at(-1)?.targetId === "bot-a",
    "a dead pinned target should fall back to temporary cover",
  );
  delete botB.isDead;
  pinManager.reconcile(4);
  assert(
    viewer.statuses.at(-1)?.targetId === "bot-b",
    "the pin must resume once the target is alive again",
  );

  // A pin whose PLAYER IS GONE (disconnected) is released for good.
  disconnected.add("bot-b");
  pinManager.reconcile(5);
  assert(
    viewer.statuses.at(-1)?.targetId === "bot-a",
    "a disconnected pin should fall back to the automatic pick",
  );
  disconnected.clear();

  // Clearing the pin hands control back to auto-follow.
  pinManager.setTarget(viewer.id, "bot-b", 6);
  assert(viewer.statuses.at(-1)?.targetId === "bot-b", "re-pin should take effect");
  pinManager.setTarget(viewer.id, null, 7);
  assert(
    viewer.statuses.at(-1)?.targetId === "bot-a",
    "clearing the pin should return to the automatic pick",
  );

  pinManager.shutdown();
}

console.log("spectatorManager.test.ts: ok");
