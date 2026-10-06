/**
 * `farmBlocked` must raise a NAMED stall on a requirement farming cannot pay.
 *
 * The span exists to measure how long the economy makes a player wait, so its
 * contract is that the wait ends. Three requirement shapes break it — a Global
 * Mastery shortfall larger than the farm biome's remaining headroom, another
 * biome's level, and a shard this node does not pay — and all three used
 * to surface as a generic timeout: twelve minutes of "no progress", or for the
 * lineage steps (which pass `ignoreBiomeCap` because their essence does keep
 * arriving) the full thirty-minute step timeout, with a `missing` map and no
 * sentence saying what was impossible about it.
 */
import assert from "node:assert/strict";
import { NODE_BIOMES, biomeLevelCap, maxGlobalMasteryAtTier, nodeFamily, nodeShard, nodesPayingShard } from "@mmo-idle/shared";
import { missingToReasons, reasonsToMissing, unsatisfiableByFarming } from "./conditions";
import { RouteExecutor } from "./executor";
import { dungeonNodeFor, type Observation } from "../state/observation";

const PLAINS_NODE = "node-t1-plains-01";
assert.equal(NODE_BIOMES[PLAINS_NODE]?.biomeGroup, "plains", "the fixture node is a Plains node");
assert.equal(NODE_BIOMES[PLAINS_NODE]?.biomeTier, 1, "the fixture node is tier 1");

function obsWith(
  playerTier: number,
  globalMastery: number,
  biomeLevel: Record<string, number>,
): Observation {
  return {
    nodeId: PLAINS_NODE,
    self: { playerTier, globalMastery, biomeLevel },
    biomeLevel: (group: string) => biomeLevel[group] ?? 0,
    essence: () => 0,
  } as unknown as Observation;
}

// ── A Global Mastery shortfall the farm biome cannot fix ─────────────────────
//
// Global Mastery is the SUM of every biome's level, so a node can only ever
// contribute its own biome's remaining headroom. Plains at its player-tier-2
// cap has none, so no number of kills here closes a 5-point shortfall.
{
  const cap = biomeLevelCap(2, "plains");
  const obs = obsWith(2, 30, { plains: cap });
  const reason = unsatisfiableByFarming({ globalMasteryNeeded: 5 }, PLAINS_NODE, obs);
  assert(reason, "a GM shortfall at a capped farm biome is unsatisfiable");
  assert.match(reason, /needs 5 more Global Mastery/);
  assert.match(reason, /plains has only 0 levels of headroom left/);
  assert.match(reason, /sum of every biome's level/);
  assert.match(reason, new RegExp(`cap ${cap}`));
}

// The same shortfall with headroom left is an ordinary wait, not a stall.
assert.equal(
  unsatisfiableByFarming({ globalMasteryNeeded: 5 }, PLAINS_NODE, obsWith(2, 30, { plains: 1 })),
  undefined,
  "a GM shortfall inside the farm biome's own headroom is satisfiable by farming",
);

// Short by more than the whole tier can hold is a tier-up, not breadth.
{
  const ceiling = maxGlobalMasteryAtTier(1);
  const obs = obsWith(1, ceiling, { plains: 0 });
  const reason = unsatisfiableByFarming({ globalMasteryNeeded: 3 }, PLAINS_NODE, obs);
  assert(reason, "a GM shortfall above the tier ceiling is unsatisfiable anywhere");
  assert.match(reason, new RegExp(`player tier 1 caps Global Mastery at ${ceiling}`));
  assert.match(reason, /only a tier-up/);
}

// ── Another biome's level ────────────────────────────────────────────────────
{
  const reason = unsatisfiableByFarming({ "biomeLevel.forest": 2 }, PLAINS_NODE, obsWith(2, 30, {}));
  assert(reason, "farming Plains cannot raise Forest's level");
  assert.match(reason, /needs 2 more forest levels/);
  assert.match(reason, /farming here raises plains's level and nothing else/);
}
assert.equal(
  unsatisfiableByFarming({ "biomeLevel.plains": 2 }, PLAINS_NODE, obsWith(2, 30, { plains: 3 })),
  undefined,
  "the farm biome's own level is exactly what farming here raises",
);
{
  const cap = biomeLevelCap(1, "plains");
  const reason = unsatisfiableByFarming({ "biomeLevel.plains": 2 }, PLAINS_NODE, obsWith(1, 6, { plains: cap }));
  assert(reason, "a level above this player tier's cap needs a tier-up");
  assert.match(reason, new RegExp(`plains caps at ${cap} for player tier 1`));
  assert.match(reason, /needs a tier-up, not more farming/);
}

// ── A shard this node does not pay (design §24.3) ────────────────────────────
//
// A blended node pays ONE shard, its dominant family's, for every kill in it —
// minority bodies included. So standing on a node that pays another shard farms
// forever for this one, even when a minority family here "drops" it. Asserted
// against the node rule's own readings rather than hard-coded families, so a
// blend reorder cannot silently turn this into a test of nothing (review B5).
{
  const obs = obsWith(2, 30, { plains: 3 });
  const paid = nodeShard(PLAINS_NODE);
  const territory = nodeFamily(PLAINS_NODE)?.name;
  assert(paid && territory, "fixture: the Plains node is a blended territory");

  // Control: no Plains family drops it at all.
  const reason = unsatisfiableByFarming({ "shard.control": 4 }, PLAINS_NODE, obs);
  assert(reason, `${PLAINS_NODE} pays ${paid}, so a control shortfall is unfarmable here`);
  assert.match(reason, /needs 4 more control shards/);
  assert.match(reason, new RegExp(`${territory} territory, which pays ${paid} shards`));

  // A Plains packet that is NOT this node's: some other Plains node pays it, this
  // one never will — the stall names the node, not the biome.
  const elsewhere = (["technique", "kill-chain", "empowered"] as const).find((p) => p !== paid)!;
  assert(nodesPayingShard("plains", 1, elsewhere).length > 0, `fixture: some Plains node pays ${elsewhere}`);
  const elsewhereReason = unsatisfiableByFarming({ [`shard.${elsewhere}`]: 4 }, PLAINS_NODE, obs);
  assert(elsewhereReason, `${PLAINS_NODE} pays ${paid}, not ${elsewhere}, whatever its minority families drop`);
  assert.match(elsewhereReason, /every kill here pays/);

  // This node's own shard, and another packet on the node that pays it, are waits.
  assert.equal(
    unsatisfiableByFarming({ [`shard.${paid}`]: 4 }, PLAINS_NODE, obs),
    undefined,
    "the node's own shard is an ordinary wait",
  );
  const payingNode = nodesPayingShard("plains", 1, elsewhere)[0]!;
  assert.equal(
    unsatisfiableByFarming({ [`shard.${elsewhere}`]: 4 }, payingNode, { ...obs, nodeId: payingNode } as Observation),
    undefined,
    `${payingNode} pays ${elsewhere}, so the shortfall is an ordinary wait there`,
  );

  // A node with no blend (a dungeon) keeps the per-mob rule: the biome's
  // fieldable families decide.
  const dungeon = dungeonNodeFor("plains", 1)!;
  assert(dungeon && nodeShard(dungeon) === undefined, "fixture: the Plains dungeon has no blend");
  const dungeonReason = unsatisfiableByFarming({ "shard.control": 4 }, dungeon, obs);
  assert(dungeonReason, "no Plains family drops control, so the dungeon cannot pay it either");
  assert.match(dungeonReason, /no tier-1 plains family drops them/);
  assert.equal(
    unsatisfiableByFarming({ "shard.technique": 4 }, dungeon, obs),
    undefined,
    "the Plains Swarm fields at tier 1, so a dungeon kill can pay technique",
  );
}

// ── The stall survives the reasons round trip (review L26) ────────────────────
//
// `farmBlocked` only ever sees `reasonsToMissing(reasons())`. A shard shortfall
// used to be lifted into a `prerequisite` reason, which collapses to a bare
// `prerequisite` count, so `unsatisfiableByFarming` never saw a shard key and the
// unfarmable-shard stall could not fire: the route farmed to the step timeout.
{
  const obs = obsWith(2, 30, { plains: 3 });
  const reasons = missingToReasons({ "shard.control": 4 }, obs);
  assert.equal(reasons.length, 1);
  assert.equal(reasons[0]!.kind, "shard", "a shard shortfall is its own reason kind");
  const missing = reasonsToMissing(reasons);
  assert.deepEqual(missing, { "shard.control": 4 }, "the shard key survives the round trip");
  assert(unsatisfiableByFarming(missing, PLAINS_NODE, obs), "and still names the stall");
}

// ── Essence is never a stall, and neither is an unnamed player ───────────────
assert.equal(
  unsatisfiableByFarming({ "essence.yellow": 400 }, PLAINS_NODE, obsWith(2, 30, { plains: 3 })),
  undefined,
  "every node pays essence, so an essence shortfall is the wait the span measures",
);
assert.equal(
  unsatisfiableByFarming({ globalMasteryNeeded: 5 }, PLAINS_NODE,
    { nodeId: PLAINS_NODE, self: null, biomeLevel: () => 0 } as unknown as Observation),
  undefined,
  "before the first snapshot names us there is no tier to reason from",
);
assert.equal(
  unsatisfiableByFarming({ globalMasteryNeeded: 5 }, "node-that-does-not-exist", obsWith(2, 30, {})),
  undefined,
  "an unknown node is not a verdict",
);

// ── `farmBlocked` itself raises it, before a single kill ─────────────────────
async function farmBlockedRaisesIt(): Promise<void> {
  const obs = obsWith(2, 30, { plains: biomeLevelCap(2, "plains") });
  const emitted: unknown[] = [];
  const executor = new RouteExecutor({
    obs,
    aborted: () => false,
    recorder: {
      emit: (event: unknown) => emitted.push(event),
      walletSnapshot: () => {},
      setActivity: () => {},
      now: () => 0,
      context: () => ({}),
    },
  } as never);
  const api = executor as unknown as {
    farmBlocked: (
      nodeId: string,
      forWhat: string,
      done: () => boolean,
      reasons: () => unknown[],
      ignoreBiomeCap?: boolean,
    ) => Promise<void>;
  };

  await assert.rejects(
    api.farmBlocked(
      PLAINS_NODE,
      "card:rapier-t1-effect",
      () => false,
      () => [{ kind: "globalMastery", current: 30, required: 35, missing: 5 }],
      // The lineage steps' own flag: it must not suppress this stall.
      true,
    ),
    (error: unknown) => {
      const message = (error as Error).message;
      assert.match(
        message,
        /^card:rapier-t1-effect cannot be farmed at node-t1-plains-01: it needs 5 more Global Mastery/,
        `named stall, got: ${message}`,
      );
      return true;
    },
  );
  assert.deepEqual(
    emitted,
    [],
    "the stall is raised before the blocked-on-resource span opens — there is no wait to measure",
  );

  // A payable shortfall still opens the span and farms, so the guard has not
  // swallowed the ordinary path. `farmUntil` is stubbed out: reaching it is the
  // assertion.
  const reached = new Error("reached farmUntil");
  Object.assign(executor, { farmUntil: async () => { throw reached; } });
  await assert.rejects(
    api.farmBlocked(
      PLAINS_NODE,
      "card:rapier-t1-speed",
      () => false,
      () => [{ kind: "essence", essence: "yellow", current: 0, required: 400, missing: 400 }],
      true,
    ),
    (error: unknown) => error === reached,
  );
  assert.deepEqual(
    emitted.map((event) => (event as { kind: string; phase: string }).phase),
    ["start", "end"],
    "an ordinary block still opens and closes its blocked-on-resource span",
  );
}

farmBlockedRaisesIt().then(() => console.log("farmBlockedStall.test.ts: ok"));
