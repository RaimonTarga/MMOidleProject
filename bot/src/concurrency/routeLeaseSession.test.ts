import { CLEARING_NODE_ID } from "@mmo-idle/shared";
import { dungeonNodeFor, normalNodesFor } from "../state/observation";
import { CombatReservationManager } from "./areaLeaseManager";
import {
  CoordinationExhaustedError,
  ReservationInterruptedError,
  RouteLeaseSession,
  biomeGroupForNode,
  controlledAreaForNode,
} from "./routeLeaseSession";
import type { Intents } from "../net/intents";
import type { Observation } from "../state/observation";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`assertion failed: ${message}`);
}

async function flush(): Promise<void> {
  await Promise.resolve();
  await new Promise<void>((resolve) => setImmediate(resolve));
}

async function main(): Promise<void> {
  const manager = new CombatReservationManager({ permitTtlMs: 60_000 });
  const owner = new RouteLeaseSession("owner", manager);
  const waiter = new RouteLeaseSession("waiter", manager);
  const plainsNodes = normalNodesFor("plains", 1);
  const farmNode = plainsNodes[0];
  const neighbourNode = plainsNodes[1];
  const dungeon = dungeonNodeFor("plains", 1);
  assert(farmNode && neighbourNode && dungeon, "live Plains fixtures exist");
  assert(controlledAreaForNode(CLEARING_NODE_ID) === null, "the Clearing remains shared");
  assert(biomeGroupForNode(farmNode) === "plains", "biomes remain evidence metadata");

  const calls: string[] = [];
  const intents = {
    setAuto: (enabled: boolean) => calls.push(`auto:${enabled}`),
    setAutoTraverse: (enabled: boolean) => calls.push(`traverse:${enabled}`),
    moveTo: () => calls.push("stop"),
  } as unknown as Intents;
  const observation = {
    self: { pos: { x: 10, y: 10 }, auto: false, isDead: false },
    nodeId: farmNode,
    otherPlayers: () => [],
  } as unknown as Observation;

  assert(
    await owner.acquireActivity([CLEARING_NODE_ID], observation, intents, "tutorial") === CLEARING_NODE_ID,
    "the shared tutorial consumes no combat permit",
  );
  assert(owner.ownsNode(CLEARING_NODE_ID), "a shared node remains admissible without a combat permit");
  assert(
    await owner.acquireActivity([farmNode], observation, intents, "farm") === farmNode,
    "farm activity receives a node-specific permit",
  );
  assert(owner.ownsNode(farmNode), "the session exposes its active permit");

  assert(
    await waiter.acquireActivity([neighbourNode], observation, intents, "farm") === neighbourNode,
    "independent nodes do not head-of-line block",
  );
  waiter.releaseNode(neighbourNode, "test-settled");

  const blocker = new RouteLeaseSession("blocker", manager);
  await blocker.acquireActivity([dungeon], observation, intents, "dungeon-boss:plains");
  await owner.acquireActivity([dungeon], observation, intents, "dungeon-boss:plains").then(
    () => { throw new Error("owner holding a permit must not queue"); },
    () => undefined,
  );
  assert(manager.snapshot().pending.length === 0, "no hold-and-wait request is retained");
  assert(owner.ownsNode(farmNode), "the existing scope remains fenced until it settles");

  const transitManager = new CombatReservationManager({ permitTtlMs: 60_000 });
  const transitBlocker = new RouteLeaseSession("transit-blocker", transitManager);
  const transitOwner = new RouteLeaseSession("transit-owner", transitManager);
  const transitObservation = { ...observation, nodeId: neighbourNode } as Observation;
  await transitBlocker.acquireActivity([dungeon], transitObservation, intents, "dungeon-boss:plains");
  await transitOwner.acquireActivity([neighbourNode], transitObservation, intents, "farm");
  let transitGranted = false;
  const transitPending = transitOwner.acquireActivity(
    [dungeon],
    transitObservation,
    intents,
    "protected-transit:neighbour->dungeon",
    { allowWaitWhileHoldingCurrentPermit: true },
  ).then(() => { transitGranted = true; });
  await flush();
  assert(!transitGranted, `protected transit remains queued (granted=${transitGranted})`);
  assert(transitOwner.ownsNode(neighbourNode), "protected transit queues without releasing the owned source");
  transitBlocker.releaseNode(dungeon, "boss-settled");
  await transitPending;
  assert(transitOwner.ownsNode(dungeon), "protected transit acquires its destination after the source remains fenced");
  transitOwner.releaseAll("terminal");
  transitBlocker.releaseAll("terminal");
  transitManager.shutdown();

  owner.releaseNode(farmNode, "farm-settled");
  let granted = false;
  const pending = owner.acquireActivity([dungeon], observation, intents, "dungeon-boss:plains").then(() => { granted = true; });
  await flush();
  assert(!granted && manager.snapshot().pending.length === 1, "permit-free contention queues once");
  assert(calls.includes("auto:false") && calls.includes("traverse:false") && calls.includes("stop"), "waiting from safety disables combat and movement");
  owner.interrupt("death");
  await pending.then(
    () => { throw new Error("death-cancelled waiter unexpectedly granted"); },
    (error) => assert(
      error instanceof ReservationInterruptedError && error.releaseReason === "death",
      "death cancellation preserves a retryable lease interruption",
    ),
  );
  assert(manager.snapshot().pending.length === 0, "death cancels the pending request immediately");

  const degradeManager = new CombatReservationManager({ permitTtlMs: 60_000 });
  const degradeBlocker = new RouteLeaseSession("degrade-blocker", degradeManager);
  const degrading = new RouteLeaseSession("degrading", degradeManager, {
    contentionPolicy: "degrade-to-shared",
    exclusiveWaitMs: 5,
    transitReplans: 1,
    transitDeathBudgetPerLeg: 1,
    totalCoordinationWaitMs: 5,
    sharedAdmissionTtlMs: 60_000,
    stepDeadlineMs: 30_000,
  });
  await degradeBlocker.acquireActivity([dungeon], observation, intents, "dungeon-boss:plains");
  const degradedAdmission = degrading.acquireActivity([dungeon], observation, intents, "dungeon-boss:plains");
  // The manager's production sweep owns wait-deadline expiry. Keep the plain
  // test process alive through its minimum 1s sweep cadence, then prove the
  // bounded queue became an explicit shared admission.
  await new Promise<void>((resolve) => setTimeout(resolve, 1_100));
  await degradedAdmission;
  assert(
    degrading.evidence().fallbacks.some((fallback) => fallback.action === "shared-admission"),
    "wait-budget degradation writes an explicit fallback record",
  );
  degrading.releaseAll("terminal");
  degradeBlocker.releaseAll("terminal");
  degradeManager.shutdown();

  const strict = new RouteLeaseSession("strict", manager, {
    contentionPolicy: "strict-isolation",
    exclusiveWaitMs: 5,
    transitReplans: 1,
    transitDeathBudgetPerLeg: 1,
    totalCoordinationWaitMs: 0,
    sharedAdmissionTtlMs: 60_000,
    stepDeadlineMs: 30_000,
  });
  await strict.acquireActivity([dungeon], observation, intents, "dungeon-boss:plains").then(
    () => { throw new Error("strict isolation unexpectedly waited past its total budget"); },
    (error) => assert(error instanceof CoordinationExhaustedError, "strict exhaustion has a typed partial-route signal"),
  );
  strict.releaseAll("terminal");

  blocker.releaseNode(dungeon, "boss-settled");
  await owner.acquireActivity([dungeon], observation, intents, "dungeon-boss:plains");
  owner.observe({ ...observation, nodeId: dungeon } as Observation, "entity-owner");
  assert(owner.ownsNode(dungeon), "authoritative entry keeps the scoped boss permit alive");
  owner.interrupt("step-failure");
  assert(!owner.ownsNode(dungeon), "step failure releases active combat before route cleanup");

  await blocker.acquireActivity([farmNode], observation, intents, "farm");
  assert(owner.isForeignNode(farmNode), "foreign combat permits remain visible to transit safety");
  blocker.releaseAll("terminal");
  owner.releaseAll("terminal");
  waiter.releaseAll("terminal");
  manager.shutdown();
  console.log("routeLeaseSession.test.ts: ok");
}

void main();
