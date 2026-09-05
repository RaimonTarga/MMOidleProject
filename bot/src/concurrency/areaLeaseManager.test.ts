import { CombatReservationManager, RunConcurrencyLimiter } from "./areaLeaseManager";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`assertion failed: ${message}`);
}

async function main(): Promise<void> {
  let now = 10_000;
  const manager = new CombatReservationManager({
    now: () => now,
    permitTtlMs: 100,
    entryTtlMs: 50,
    sharedAdmissionTtlMs: 100,
  });

  const first = manager.tryAcquireExclusive({ ownerId: "a", nodeId: "node:a", purpose: "farm" });
  assert(first !== null && first.epoch === 1, "a vacant node grants an epoch-fenced permit");
  assert(manager.tryAcquireExclusive({ ownerId: "b", nodeId: "node:a", purpose: "farm" }) === null, "exclusive admission does not double grant");

  const waitingAbort = new AbortController();
  const waiting = manager.acquireExclusive(
    { ownerId: "b", nodeId: "node:a", purpose: "boss" },
    { signal: waitingAbort.signal, deadlineAt: now + 1_000 },
  );
  waitingAbort.abort();
  await waiting.then(() => { throw new Error("aborted request unexpectedly granted"); }, () => undefined);
  assert(manager.snapshot().pending.length === 0, "aborting a pending request removes it exactly once");

  const blocker = manager.tryAcquireExclusive({ ownerId: "z", nodeId: "node:b", purpose: "farm" });
  assert(blocker !== null, "queue fixture occupies a second node");
  await manager.acquireExclusive(
    { ownerId: "a", nodeId: "node:b", purpose: "protected-transit" },
    { signal: new AbortController().signal, deadlineAt: now + 1_000 },
  ).then(
    () => { throw new Error("an owner holding a permit must not queue"); },
    () => undefined,
  );
  manager.release(blocker, "activity-complete");

  assert(manager.release({ ...first, epoch: 0 }, "activity-complete") === false, "a stale epoch cannot release the current permit");
  assert(manager.release(first, "activity-complete"), "the exact permit releases its node");
  const second = manager.tryAcquireExclusive({ ownerId: "b", nodeId: "node:a", purpose: "farm" });
  assert(second?.epoch === 2, "a later grant advances the node epoch");
  assert(manager.release(first, "activity-complete") === false, "a delayed finally cannot release a newer grant");

  const shared = manager.admitShared({ ownerId: "c", nodeId: "node:a", trigger: "exclusive-wait-budget", purpose: "boss" });
  assert(shared.participantOwnerIds.join(",") === "b,c", "shared conversion includes owner and requester");
  assert(shared.purposes.includes("boss"), "shared conversion records the affected activity");
  manager.leaveShared(shared.admissionId, "b", "left");
  manager.leaveShared(shared.admissionId, "c", "left");
  assert(manager.snapshot().admissionsByNode["node:a"].kind === "vacant", "last shared departure closes admission");

  const expiring = manager.tryAcquireExclusive({ ownerId: "d", nodeId: "node:d", purpose: "farm" });
  assert(expiring !== null, "expiry fixture acquires");
  now += 40;
  const renewed = manager.renew(expiring!);
  assert(renewed.enterBy > now, "a live heartbeat extends an unentered permit deadline");
  now += 40;
  await new Promise((resolve) => setTimeout(resolve, 120));
  assert(manager.snapshot().admissionsByNode["node:d"].kind === "exclusive", "renewed entry permit survives its original deadline");
  now += 70;
  await new Promise((resolve) => setTimeout(resolve, 120));
  assert(manager.snapshot().admissionsByNode["node:d"].kind === "vacant", "TTL sweep releases permits after the renewed heartbeat expires");
  manager.shutdown();

  const limiter = new RunConcurrencyLimiter(1);
  let maximum = 0;
  await Promise.all([
    limiter.run(async () => { maximum = Math.max(maximum, limiter.snapshot().active); }),
    limiter.run(async () => { maximum = Math.max(maximum, limiter.snapshot().active); }),
  ]);
  assert(maximum === 1 && limiter.snapshot().maximumActive === 1, "run capacity stays independent of node admission");
  console.log("areaLeaseManager.test.ts: ok");
}

void main();
