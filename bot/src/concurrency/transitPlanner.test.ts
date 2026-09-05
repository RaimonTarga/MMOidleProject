import { CombatReservationManager } from "./areaLeaseManager";
import { TransitExecutor } from "./transitExecutor";
import { planTransit } from "./transitPlanner";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`assertion failed: ${message}`);
}

const manager = new CombatReservationManager();
const plan = planTransit({
  fromNodeId: "node-clearing",
  destinationNodeId: "node-t1-forest-03",
  ownerId: "conduit",
  reservations: manager.snapshot(),
});
assert(plan !== null, "Forest-03 is reachable from Clearing");
assert(
  plan.hops.some((hop) => hop.toNodeId === "node-t1-forest-04" && hop.classification === "protected-crossing"),
  "the Conduit regression route exposes fortified Forest-04 as a protected crossing",
);

const held = manager.tryAcquireExclusive({ ownerId: "other", nodeId: "node-t1-forest-04", purpose: "farm" });
assert(held !== null, "foreign-reservation fixture acquires");
const avoided = planTransit({
  fromNodeId: "node-clearing",
  destinationNodeId: "node-t1-forest-03",
  ownerId: "conduit",
  reservations: manager.snapshot(),
});
assert(avoided === null || avoided.hops.every((hop) => hop.toNodeId !== "node-t1-forest-04"), "foreign exclusive crossings are avoided when possible");
const queued = planTransit({
  fromNodeId: "node-clearing",
  destinationNodeId: "node-t1-forest-03",
  ownerId: "conduit",
  reservations: manager.snapshot(),
  allowForeignExclusive: true,
});
assert(
  queued?.hops.some((hop) => hop.toNodeId === "node-t1-forest-04" && hop.classification === "protected-crossing"),
  "when no clean route remains, a foreign-exclusive crossing is handed to the lease queue",
);
manager.shutdown();

const calls: string[] = [];
void new TransitExecutor({
  acquireProtectedCrossing: async (hop) => { calls.push(`acquire:${hop.toNodeId}`); },
  navigateAndConfirmArrival: async (hop) => { calls.push(`navigate:${hop.toNodeId}`); },
}).execute(plan).then(() => {
  assert(
    calls.indexOf("acquire:node-t1-forest-04") < calls.indexOf("navigate:node-t1-forest-04"),
    "a protected crossing is acquired before its hop is requested",
  );
  console.log("transitPlanner.test.ts: ok");
});
