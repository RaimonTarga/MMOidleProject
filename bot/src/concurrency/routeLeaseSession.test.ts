import { CLEARING_NODE_ID } from "@mmo-idle/shared";
import { dungeonNodeFor, normalNodesFor } from "../state/observation";
import { AreaLeaseManager } from "./areaLeaseManager";
import {
  RouteLeaseSession,
  biomeGroupForNode,
  controlledAreaForNode,
  controlledAreasForTravel,
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
  const manager = new AreaLeaseManager(3);
  const owner = new RouteLeaseSession("owner", manager);
  const waiter = new RouteLeaseSession("waiter", manager);
  const plainsNodes = normalNodesFor("plains", 1);
  const plainsNode = plainsNodes[0];
  const otherPlainsNode = plainsNodes[1];
  const plainsDungeon = dungeonNodeFor("plains", 1);
  assert(plainsNode && otherPlainsNode && plainsDungeon, "plains fixtures exist");
  assert(
    controlledAreaForNode(plainsNode) !== controlledAreaForNode(otherPlainsNode) &&
      controlledAreaForNode(plainsNode) !== controlledAreaForNode(plainsDungeon),
    "the isolation boundary is the node, and a dungeon is its own node",
  );
  assert(
    biomeGroupForNode(plainsNode) === biomeGroupForNode(otherPlainsNode),
    "biome stays available as evidence, not as a lease boundary",
  );

  const transitAreas = controlledAreasForTravel(plainsNode, normalNodesFor("cave", 1)[0]);
  assert(
    transitAreas.includes(`node:${plainsNode}`) && transitAreas.length > 1,
    "travel path areas derive from live topology",
  );

  const calls: string[] = [];
  const intents = {
    setAuto: (enabled: boolean) => calls.push(`auto:${enabled}`),
    setAutoTraverse: (enabled: boolean) => calls.push(`traverse:${enabled}`),
    moveTo: () => calls.push("stop"),
  } as unknown as Intents;
  const obs = {
    self: { pos: { x: 10, y: 10 } },
    nodeId: plainsNode,
    otherPlayers: () => [],
  } as unknown as Observation;

  const ownerNode = await owner.acquireActivity([plainsNode], obs, intents, "farm");
  assert(ownerNode === plainsNode, "a free preferred node is granted unchanged");

  // Same biome, different node: the server scopes combat and reward share by
  // nodeId, so this must NOT serialize.
  const neighbour = new RouteLeaseSession("neighbour", manager);
  const neighbourNode = await neighbour.acquireActivity(
    [otherPlainsNode],
    obs,
    intents,
    "farm",
  );
  assert(neighbourNode === otherPlainsNode, "different nodes of one biome run concurrently");

  // A contended preferred node hands back the next candidate instead of waiting,
  // which is the route's own `pick: "uncleared"` choice, not a reroute.
  const spread = new RouteLeaseSession("spread", manager);
  const spreadNode = await spread.acquireActivity(
    [plainsNode, otherPlainsNode, plainsNodes[2]],
    obs,
    intents,
    "farm",
  );
  assert(spreadNode === plainsNodes[2], "contended head falls through to a free candidate");
  spread.releaseAll("done");
  neighbour.releaseAll("done");

  let waiterGranted = false;
  const waiting = waiter.acquireActivity([plainsNode], obs, intents, "farm").then(() => {
    waiterGranted = true;
  });
  await flush();
  assert(!waiterGranted, "a single-candidate conflict genuinely waits");
  assert(calls.includes("auto:false") && calls.includes("traverse:false") && calls.includes("stop"), "waiting pauses combat, traversal, and movement");
  assert(!manager.snapshot().progressingOwners.includes("waiter"), "lease wait is not gameplay progress");
  assert(manager.heldAreas("waiter").length === 0, "waiting bot cannot farm another area");

  owner.releaseAll("done");
  await waiting;
  assert(manager.owns("waiter", `node:${plainsNode}`), "next waiter acquires after release");

  // Part of the contract: a lease wait is measurable on its own, so it can be
  // reported as coordination cost rather than mistaken for a combat/economy stall.
  {
    const evidence = waiter.evidence();
    assert(evidence.acquisitions > 0, "the waiter records its acquisition");
    assert(evidence.maximumWaitMs >= 0 && evidence.totalWaitMs >= evidence.maximumWaitMs, "wait time is tracked separately and self-consistent");
    assert(!evidence.contaminated, "waiting for a lease is not contamination");
  }

  // The dungeon is a separate node, so it does not conflict with overworld
  // farming -- but it is a single candidate, so two bots contend for it.
  const dungeonBot = new RouteLeaseSession("dungeon", manager);
  await dungeonBot.acquireActivity([plainsDungeon], obs, intents, "boss");
  assert(dungeonBot.ownsNode(plainsDungeon), "fast-retry owner can prove the dungeon lease");

  let secondDungeonGranted = false;
  const rival = new RouteLeaseSession("rival", manager);
  const dungeonWait = rival.acquireActivity([plainsDungeon], obs, intents, "boss").then(() => {
    secondDungeonGranted = true;
  });
  await flush();
  assert(!secondDungeonGranted, "dungeon/guardian/boss state is never shared by two bots");
  assert(!rival.ownsNode(plainsDungeon), "a queued boss attempt owns nothing");
  dungeonBot.releaseNode(plainsDungeon, "boss-handoff");
  await dungeonWait;
  assert(rival.ownsNode(plainsDungeon), "the dungeon hands off to the next waiter");
  rival.releaseAll("done");
  await dungeonBot.acquireActivity([plainsDungeon], obs, intents, "boss");

  const accidental = new RouteLeaseSession("accidental", manager);
  accidental.heartbeat("entity-accidental");
  const intrude = (): void =>
    dungeonBot.observe({
      ...obs,
      nodeId: plainsDungeon,
      otherPlayers: () => [{ id: "entity-accidental" }],
    } as unknown as Observation, "entity-dungeon");

  // Engagement is derived from the server's own auto-combat flag on each tick,
  // so drive it the way the live harness does rather than by hand.
  const accidentalSees = (auto: boolean, isDead = false): void =>
    accidental.observe({
      ...obs,
      nodeId: plainsDungeon,
      self: { ...(obs.self as object), auto, isDead },
      otherPlayers: () => [],
    } as unknown as Observation, "entity-accidental");

  // A bot merely PASSING THROUGH a node it does not own is allowed by design
  // and cannot affect the owner's evidence -- it does not fight there. It is
  // recorded, but tainting the run for it would make every long transit dirty.
  accidentalSees(false);
  intrude();
  assert(!dungeonBot.evidence().contaminated, "a pass-through does not taint the node owner");
  assert(!accidental.evidence().contaminated, "a pass-through does not taint the traveller");
  assert(
    dungeonBot.evidence().overlaps.at(-1)?.reason === "transit-co-presence",
    "a pass-through is still recorded, as transit co-presence",
  );

  // A DEAD bot is not fighting, whatever its auto flag last said.
  accidentalSees(true, true);
  intrude();
  assert(!dungeonBot.evidence().contaminated, "a corpse in the node is not an overlap");

  // An ENGAGED bot fighting in a node it does not own is the real accident the
  // lease system exists to prevent; BOTH runs must carry the evidence.
  accidentalSees(true);
  intrude();
  assert(dungeonBot.evidence().contaminated, "controlled overlap contaminates lease owner");
  assert(accidental.evidence().contaminated, "controlled overlap contaminates observed bot");
  assert(
    dungeonBot.evidence().overlaps.at(-1)?.contaminating === true,
    "the engaged overlap is flagged as contaminating",
  );

  // ── Crossing a node someone else owns (8-bot scale defect, 2026-08-28) ───
  // A contended head candidate can hand a bot a node on the far side of the
  // map, and the walk there crosses nodes other bots are farming. The travel
  // "fight back when attacked" rule parked bots mid-crossing and had them
  // trade blows -- real kills and catalyst gains inside someone else's leased
  // node. `isForeignNode` is what the executor consults to refuse that.
  {
    const local = new AreaLeaseManager(4);
    const resident = new RouteLeaseSession("resident", local);
    const crosser = new RouteLeaseSession("crosser", local);
    const crossed = plainsNodes[3];
    const mine = plainsNodes[4];

    await resident.acquireActivity([crossed], { ...obs, nodeId: crossed } as unknown as Observation, intents, "farm");
    await crosser.acquireActivity([mine], { ...obs, nodeId: mine } as unknown as Observation, intents, "farm");

    assert(crosser.isForeignNode(crossed), "a node held by another bot reads as foreign");
    assert(!crosser.isForeignNode(mine), "our own node is never foreign");
    assert(!crosser.isForeignNode(plainsNodes[2]), "an unheld node is not foreign");
    assert(
      !crosser.isForeignNode(CLEARING_NODE_ID),
      "the unleased Clearing is never foreign, so transit combat there stays allowed",
    );

    resident.releaseAll("done");
    assert(!crosser.isForeignNode(crossed), "a released node stops being foreign");
    crosser.releaseAll("done");
    local.shutdown();
  }

  // ── Death-recovery walk (live defect, 2026-08-29) ────────────────────────
  // A bot that dies mid-farm respawns at the hub and walks back to its farm
  // node. That walk is issued inside `farmUntil`'s own poll, NOT through
  // `ensureAt`, so when engagement was a hand-toggled flag it stayed true for
  // the whole journey and every node crossed was scored as a real overlap.
  // Deriving engagement from the server's auto flag covers this path -- and any
  // other travel path nobody has thought of yet.
  {
    const local = new AreaLeaseManager(4);
    const resident = new RouteLeaseSession("resident", local);
    const dier = new RouteLeaseSession("dier", local);
    const crossed = plainsNodes[0];
    const home = plainsNodes[1];

    await resident.acquireActivity([crossed], { ...obs, nodeId: crossed } as unknown as Observation, intents, "farm");
    await dier.acquireActivity([home], { ...obs, nodeId: home } as unknown as Observation, intents, "farm");
    dier.heartbeat("entity-dier");

    const dierTick = (nodeId: string, auto: boolean, isDead = false): void =>
      dier.observe({
        ...obs,
        nodeId,
        self: { ...(obs.self as object), auto, isDead },
        otherPlayers: () => [],
      } as unknown as Observation, "entity-dier");
    const residentSees = (): void =>
      resident.observe({
        ...obs,
        nodeId: crossed,
        self: { ...(obs.self as object), auto: true, isDead: false },
        otherPlayers: () => [{ id: "entity-dier" }],
      } as unknown as Observation, "entity-resident");

    // 1. Farming its own node with auto-combat on: genuinely engaged.
    dierTick(home, true);
    assert(local.isEngaged("dier"), "a farming bot reads as engaged");

    // 2. Dies. The server clears auto on respawn.
    dierTick(home, false, true);
    assert(!local.isEngaged("dier"), "death clears engagement");

    // 3. Walks home from the hub, crossing the resident's node en route. This
    //    is the leg that used to arrive still flagged as engaged.
    dierTick(crossed, false);
    assert(!local.isEngaged("dier"), "the recovery walk is not engagement");
    residentSees();
    assert(
      !resident.evidence().contaminated,
      "a bot walking home after dying does not taint the node it crosses",
    );
    assert(
      resident.evidence().overlaps.at(-1)?.reason === "transit-co-presence",
      "the crossing is still recorded as transit co-presence",
    );

    // 4. Back home and fighting again: engaged once more, no leak either way.
    dierTick(home, true);
    assert(local.isEngaged("dier"), "engagement returns when it resumes farming");

    resident.releaseAll("done");
    dier.releaseAll("done");
    local.shutdown();
  }

  // ── The Clearing is shared on purpose ────────────────────────────────────
  {
    const a = new RouteLeaseSession("tutorial-a", manager);
    const b = new RouteLeaseSession("tutorial-b", manager);
    assert(controlledAreaForNode(CLEARING_NODE_ID) === null, "the Clearing is not a leasable area");
    const aNode = await a.acquireActivity([CLEARING_NODE_ID], obs, intents, "tier-0-quest");
    const bNode = await b.acquireActivity([CLEARING_NODE_ID], obs, intents, "tier-0-quest");
    assert(aNode === CLEARING_NODE_ID && bNode === CLEARING_NODE_ID, "every bot may open in the Clearing at once");
    assert(a.heldAreas().length === 0 && b.heldAreas().length === 0, "the tutorial consumes no lease");
    // Sharing it must not read as contamination, or every batch starts dirty.
    a.observe({
      ...obs,
      nodeId: CLEARING_NODE_ID,
      otherPlayers: () => [{ id: "entity-tutorial-b" }],
    } as unknown as Observation, "entity-tutorial-a");
    assert(!a.evidence().contaminated, "sharing the tutorial zone is not contamination");
    a.releaseAll("done");
    b.releaseAll("done");
  }

  // ── Waiting is productive when it can be ─────────────────────────────────
  {
    // Its own manager: this block is about waiting semantics, not the progress
    // cap, and the shared one above is deliberately capped at 3.
    const local = new AreaLeaseManager(4);
    const busy = new RouteLeaseSession("busy", local);
    const mover = new RouteLeaseSession("mover", local);
    const home = plainsNodes[4];
    const wanted = otherPlainsNode;
    await busy.acquireActivity([wanted], obs, intents, "farm");
    await mover.acquireActivity([home], obs, intents, "farm");

    const standing = { ...obs, nodeId: home } as unknown as Observation;
    const before = calls.length;
    let moved = false;
    const pending = mover.acquireActivity([wanted], standing, intents, "farm").then(() => { moved = true; });
    await flush();
    assert(!moved, "the bot waits for the contended node");
    // It owns where it stands, so it keeps fighting rather than freezing.
    assert(!calls.slice(before).includes("auto:false"), "a bot that owns its node is not stopped while waiting");
    assert(mover.heldAreas().includes(`node:${home}`), "it keeps the node it is farming in");
    assert(mover.evidence().productiveWaits === 1, "productive waiting is recorded, not hidden");

    busy.releaseAll("done");
    await pending;
    // It now owns the target, and STILL owns the node it is standing in: the
    // hand-back happens on observed departure, not on grant (walk-out race).
    assert(mover.ownsNode(wanted), "the waiter is granted the node it queued for");
    assert(mover.ownsNode(home), "it keeps the node it occupies until it has left it");
    mover.releaseNode(home, "departed-node");
    assert(!mover.ownsNode(home) && mover.ownsNode(wanted), "departure frees only the old node");
    mover.releaseAll("done");
    local.shutdown();
  }

  // ── Walk-out race (live defect, 2026-08-28) ──────────────────────────────
  // Two real bots collided in node-t1-swamp-03: the first released its lease the
  // moment the executor DECIDED to travel, then spent 8+ seconds walking out
  // while its avatar was still standing there. The node read as free, the second
  // bot was granted it, and both logged controlled-overlap. A departing bot must
  // therefore keep its node until it is OBSERVED to have left.
  {
    const local = new AreaLeaseManager(4);
    const leaver = new RouteLeaseSession("leaver", local);
    const follower = new RouteLeaseSession("follower", local);
    const from = plainsNodes[0];
    const to = plainsNodes[1];
    const spare = plainsNodes[2];

    const standingAtFrom = { ...obs, nodeId: from } as unknown as Observation;
    await leaver.acquireActivity([from], standingAtFrom, intents, "farm");
    assert(leaver.ownsNode(from), "the leaver owns the node it is farming");

    // The travel DECISION: it acquires its destination but has not moved yet.
    const destination = await leaver.acquireActivity([to], standingAtFrom, intents, "farm");
    assert(destination === to, "the destination lease is granted");
    assert(
      leaver.ownsNode(from) && leaver.ownsNode(to),
      "deciding to travel does NOT surrender the node the avatar still occupies",
    );

    // A follower must not be handed the node the leaver is still standing in.
    const followerNode = await follower.acquireActivity(
      [from, spare],
      standingAtFrom,
      intents,
      "farm",
    );
    assert(followerNode === spare, "the still-occupied node is not handed to the next bot");
    assert(!follower.ownsNode(from), "no second owner for an occupied node");
    follower.releaseAll("done");

    // Observed departure -- and only now does the node become available.
    leaver.releaseNode(from, "departed-node");
    assert(!leaver.ownsNode(from), "the node is surrendered once the walk out is observed");
    assert(leaver.ownsNode(to), "surrendering the old node must not drop the destination");

    const late = new RouteLeaseSession("late", local);
    const lateNode = await late.acquireActivity([from], standingAtFrom, intents, "farm");
    assert(lateNode === from, "the vacated node is grantable again");
    late.releaseAll("done");
    leaver.releaseAll("done");
    local.shutdown();
  }

  // Transit is deliberately unleased, so merely passing through a node nobody
  // owns -- the shared Clearing especially -- is not contamination.
  const passer = new RouteLeaseSession("passer", manager);
  passer.heartbeat("entity-passer");
  const bystander = new RouteLeaseSession("bystander", manager);
  bystander.heartbeat("entity-bystander");
  passer.observe({
    ...obs,
    nodeId: plainsNodes[3],
    otherPlayers: () => [{ id: "entity-bystander" }],
  } as unknown as Observation, "entity-passer");
  assert(!passer.evidence().contaminated, "sharing an unleased node in transit is not contamination");
  passer.releaseAll("done");
  bystander.releaseAll("done");

  dungeonBot.releaseAll("done");
  accidental.releaseAll("done");
  manager.shutdown();
  console.log("routeLeaseSession.test.ts: ok");
}

void main();
