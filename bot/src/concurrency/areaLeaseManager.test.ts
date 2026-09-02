import { AreaLeaseManager } from "./areaLeaseManager";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`assertion failed: ${message}`);
}

async function flush(): Promise<void> {
  await Promise.resolve();
  await new Promise<void>((resolve) => setImmediate(resolve));
}

async function main(): Promise<void> {
  let now = 1_000;
  const manager = new AreaLeaseManager(3, 100, () => now);

  const first = await manager.acquire({ ownerId: "a", areaIds: ["biome:plains"], reason: "farm" });
  assert(first.waitDurationMs === 0, "first owner acquires immediately");
  let secondGranted = false;
  const secondPromise = manager.acquire({ ownerId: "b", areaIds: ["biome:plains"], reason: "farm" }).then((grant) => {
    secondGranted = true;
    return grant;
  });
  await flush();
  assert(!secondGranted, "same exclusive area cannot progress twice");

  const nonconflicting = await manager.acquire({ ownerId: "c", areaIds: ["biome:forest"], reason: "farm" });
  assert(nonconflicting.ownerId === "c", "nonconflicting areas progress concurrently");

  manager.releaseOwner("a", "terminal");
  const second = await secondPromise;
  assert(second.ownerId === "b", "release hands lease to next waiter");

  // FIFO per area: d cannot be starved by a later e request.
  const dPromise = manager.acquire({ ownerId: "d", areaIds: ["biome:plains"], reason: "queued" });
  const ePromise = manager.acquire({ ownerId: "e", areaIds: ["biome:plains"], reason: "later" });
  manager.releaseOwner("b", "done");
  const d = await dPromise;
  assert(d.ownerId === "d", "oldest conflicting waiter acquires first");
  let eGranted = false;
  void ePromise.then(() => { eGranted = true; });
  await flush();
  assert(!eGranted, "later waiter remains queued");
  manager.releaseOwner("d", "done");
  assert((await ePromise).ownerId === "e", "representative queue does not starve");

  manager.disconnectOwner("e");
  assert(manager.ownerOf("biome:plains") === null, "disconnect cleanup releases leases");

  await manager.acquire({ ownerId: "stale", areaIds: ["biome:cave"], reason: "crash" });
  now += 101;
  assert(manager.expireStaleOwners().includes("stale"), "crash heartbeat expiry releases leases");
  assert(manager.ownerOf("biome:cave") === null, "expired lease is not stranded");

  await manager.acquire({ ownerId: "shutdown", areaIds: ["biome:swamp"], reason: "farm" });
  manager.shutdown();
  assert(Object.keys(manager.snapshot().ownersByArea).length === 0, "shutdown releases every lease");

  await anyModeSemantics();
  await parkedHoldBreaker();
  await nearnessBias();
  console.log("areaLeaseManager.test.ts: ok");
}

/**
 * "any" is what lets two bots share a biome by taking different nodes. It must
 * honour caller preference order, fall through to a free candidate rather than
 * queue, and still queue when every candidate is taken.
 */
async function anyModeSemantics(): Promise<void> {
  const manager = new AreaLeaseManager(4);
  const nodes = ["node:p1", "node:p2", "node:p3"];

  const first = await manager.acquire({ ownerId: "a", areaIds: nodes, reason: "farm", mode: "any" });
  assert(first.areaIds.length === 1 && first.areaIds[0] === "node:p1", "any takes the preferred candidate only");
  assert(manager.heldAreas("a").length === 1, "any never claims the whole candidate set");

  const second = await manager.acquire({ ownerId: "b", areaIds: nodes, reason: "farm", mode: "any" });
  assert(second.areaIds[0] === "node:p2", "a contended head falls through to the next free candidate");
  const third = await manager.acquire({ ownerId: "c", areaIds: nodes, reason: "farm", mode: "any" });
  assert(third.areaIds[0] === "node:p3", "three bots share one biome across three nodes");

  let fourthGranted = false;
  const fourth = manager
    .acquire({ ownerId: "d", areaIds: nodes, reason: "farm", mode: "any" })
    .then((grant) => { fourthGranted = true; return grant; });
  await flush();
  assert(!fourthGranted, "a fully contended candidate set still queues");
  assert(manager.heldAreas("d").length === 0, "a queued bot holds nothing it can farm");

  manager.releaseOwner("b", "done");
  assert((await fourth).areaIds[0] === "node:p2", "the freed node goes to the waiter");
  manager.shutdown();
}

/**
 * A waiter keeps the node it is parked in so nobody farms around it. If every
 * candidate is held by waiters doing the same, that is a cycle -- the breaker
 * must drop the parked area (never the pending request) so the ring unwedges.
 */
async function parkedHoldBreaker(): Promise<void> {
  let now = 10_000;
  const manager = new AreaLeaseManager(4, 600_000, () => now, 1_000);

  await manager.acquire({ ownerId: "x", areaIds: ["node:n1"], reason: "farm" });
  await manager.acquire({ ownerId: "y", areaIds: ["node:n2"], reason: "farm" });

  // Each now wants the node the other is parked in: a two-bot cycle.
  let xMoved = false;
  let yMoved = false;
  const xWait = manager.acquire({ ownerId: "x", areaIds: ["node:n2"], reason: "next" }).then(() => { xMoved = true; });
  const yWait = manager.acquire({ ownerId: "y", areaIds: ["node:n1"], reason: "next" }).then(() => { yMoved = true; });
  await flush();
  assert(!xMoved && !yMoved, "both bots are wedged while each holds the other's target");
  assert(manager.heldAreas("x")[0] === "node:n1", "a waiter keeps its parked node meanwhile");

  // An uncontested parked hold is never given up: a bot queueing for a busy
  // dungeon must keep standing where it is rather than be exposed.
  {
    const solo = new AreaLeaseManager(4, 600_000, () => now, 1_000);
    await solo.acquire({ ownerId: "p", areaIds: ["node:parked"], reason: "farm" });
    await solo.acquire({ ownerId: "q", areaIds: ["node:dungeon"], reason: "boss" });
    // Cancelled by the shutdown below; the rejection is expected, not a failure.
    solo.acquire({ ownerId: "p", areaIds: ["node:dungeon"], reason: "boss" }).catch(() => {});
    await flush();
    now += 1_001;
    assert(solo.breakParkedHolds().length === 0, "an uncontested parked hold is kept");
    assert(solo.owns("p", "node:parked"), "the waiter still owns the node it stands in");
    now -= 1_001;
    solo.shutdown();
  }

  // A second waiter wanting the parked node is still not a cycle. The first
  // owner may be productively fighting there while it waits for its next
  // destination, so the parked lease must remain protective.
  {
    const busy = new AreaLeaseManager(4, 600_000, () => now, 1_000);
    await busy.acquire({ ownerId: "p", areaIds: ["node:parked"], reason: "farm" });
    const queued = busy
      .acquire({ ownerId: "p", areaIds: ["node:next"], reason: "travel" })
      .catch(() => undefined);
    const wantsParked = busy
      .acquire({ ownerId: "q", areaIds: ["node:parked"], reason: "farm" })
      .catch(() => undefined);
    await flush();
    now += 1_001;
    assert(busy.breakParkedHolds().length === 0, "non-cyclic parked contention is kept");
    assert(busy.owns("p", "node:parked"), "productive dungeon waiter keeps its parked lease");
    busy.shutdown();
    await Promise.all([queued, wantsParked]);
    now -= 1_001;
  }

  now += 1_001;
  const broken = manager.breakParkedHolds();
  assert(broken.includes("x") && broken.includes("y"), "the breaker reports whose hold it dropped");
  await xWait;
  await yWait;
  assert(xMoved && yMoved, "breaking the parked holds resolves the cycle");
  assert(manager.owns("x", "node:n2") && manager.owns("y", "node:n1"), "each bot ends up on the node it asked for");
  manager.shutdown();
}

/**
 * A contended near cluster must make a bot WAIT rather than accept a distant
 * node: at 8-bot scale the plain "first free" rule sent bots on multi-biome
 * crossings. The hold-out is bounded, so a permanently busy cluster still
 * widens instead of wedging the run.
 */
async function nearnessBias(): Promise<void> {
  let now = 5_000;
  const manager = new AreaLeaseManager(4, 600_000, () => now, 600_000);
  const near = ["node:near-1", "node:near-2"];
  const all = [...near, "node:far-1"];

  await manager.acquire({ ownerId: "a", areaIds: ["node:near-1"], reason: "farm" });
  await manager.acquire({ ownerId: "b", areaIds: ["node:near-2"], reason: "farm" });

  let granted: string[] | null = null;
  const pending = manager
    .acquire({
      ownerId: "c",
      areaIds: all,
      preferredAreaIds: near,
      widenAfterMs: 10_000,
      reason: "farm",
      mode: "any",
    })
    .then((grant) => { granted = grant.areaIds; return grant; });
  await flush();
  assert(granted === null, "a free but distant node is not taken while near ones may free up");

  // A near node frees before the widen deadline: that is what it was waiting for.
  manager.releaseOwner("a", "done");
  const grant = await pending;
  assert(grant.areaIds[0] === "node:near-1", "the freed near node wins over the distant one");
  manager.releaseOwner("c", "done");
  manager.releaseOwner("b", "done");

  // Same setup, but the near cluster never frees: the hold-out must expire.
  await manager.acquire({ ownerId: "d", areaIds: ["node:near-1"], reason: "farm" });
  await manager.acquire({ ownerId: "e", areaIds: ["node:near-2"], reason: "farm" });
  let widened: string[] | null = null;
  const holding = manager
    .acquire({
      ownerId: "f",
      areaIds: all,
      preferredAreaIds: near,
      widenAfterMs: 10_000,
      reason: "farm",
      mode: "any",
    })
    .then((g) => { widened = g.areaIds; return g; });
  await flush();
  assert(widened === null, "still holding out before the deadline");
  now += 10_001;
  manager.poll();
  const late = await holding;
  assert(late.areaIds[0] === "node:far-1", "past the deadline the distant node is accepted");
  manager.shutdown();
}

void main();
