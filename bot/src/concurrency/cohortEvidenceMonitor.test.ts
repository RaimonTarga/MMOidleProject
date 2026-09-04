import { CombatReservationManager } from "./areaLeaseManager";
import { CohortEvidenceMonitor } from "./cohortEvidenceMonitor";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`assertion failed: ${message}`);
}

let now = 1_000;
const manager = new CombatReservationManager({ now: () => now });
const monitor = new CohortEvidenceMonitor(manager, () => now);
const first = manager.tryAcquireExclusive({ ownerId: "a", nodeId: "node:test", purpose: "farm" });
assert(first !== null, "exclusive fixture acquires");

monitor.observe({ ownerId: "a", entityId: "entity-a", nodeId: "node:test", alive: true, autoCombat: true });
monitor.observe({ ownerId: "b", entityId: "entity-b", nodeId: "node:test", alive: true, autoCombat: false });
assert(monitor.snapshot()[0]?.classification === "transit-co-presence", "pass-through remains ambient concurrency");

now += 10;
monitor.observe({ ownerId: "b", entityId: "entity-b", nodeId: "node:test", alive: true, autoCombat: true });
assert(
  monitor.snapshot().some((interval) => interval.classification === "foreign-combat-in-exclusive-node"),
  "foreign combat in an exclusive node is classified separately",
);

const shared = manager.admitShared({ ownerId: "b", nodeId: "node:test", trigger: "test" });
now += 10;
monitor.observe({ ownerId: "a", entityId: "entity-a", nodeId: "node:test", alive: true, autoCombat: true });
assert(
  monitor.snapshot().some((interval) => interval.classification === "shared-combat"),
  "shared admission is visible to every cohort participant",
);
manager.leaveShared(shared.admissionId, "a", "done");
manager.leaveShared(shared.admissionId, "b", "done");

const boss = manager.tryAcquireExclusive({ ownerId: "a", nodeId: "node:boss", purpose: "boss" });
assert(boss !== null, "boss fixture acquires an exclusive permit");
manager.admitShared({ ownerId: "b", nodeId: "node:boss", trigger: "test", purpose: "boss" });
now += 10;
monitor.observe({ ownerId: "a", entityId: "entity-a", nodeId: "node:boss", alive: true, autoCombat: true });
monitor.observe({ ownerId: "b", entityId: "entity-b", nodeId: "node:boss", alive: true, autoCombat: true });
assert(
  monitor.snapshot().some((interval) => interval.classification === "shared-boss-state"),
  "a degraded boss encounter is outcome interference, not ordinary shared combat",
);
monitor.observe({ ownerId: "c", entityId: "entity-c", nodeId: "node:other", alive: true, autoCombat: false });
monitor.observe({ ownerId: "d", entityId: "entity-d", nodeId: "node:other", alive: true, autoCombat: false });
assert(
  monitor.snapshotFor("a").every((interval) => interval.participantOwnerIds.includes("a")),
  "a run receives only the intervals it participated in",
);
assert(
  monitor.snapshotFor("c").every((interval) => interval.participantOwnerIds.includes("c")),
  "unrelated cohort intervals stay out of another run's artifact",
);
manager.shutdown();
console.log("cohortEvidenceMonitor.test.ts: ok");
