import type { SpectateStatus } from "@mmo-idle/shared";
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

console.log("spectatorManager.test.ts: ok");
