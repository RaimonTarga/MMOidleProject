/**
 * `farmBlocked` must raise a NAMED stall on a requirement farming cannot pay.
 *
 * The span exists to measure how long the economy makes a player wait, so its
 * contract is that the wait ends. Two requirement shapes break it — a Global
 * Mastery shortfall larger than the farm biome's remaining headroom, and
 * another biome's level — and both used to surface as a generic timeout:
 * twelve minutes of "no progress", or under `ignoreBiomeCap` (essence does
 * keep arriving) the full thirty-minute step timeout, with a `missing` map and
 * no sentence saying what was impossible about it.
 */
import assert from "node:assert/strict";
import { NODE_BIOMES, biomeLevelCap, maxGlobalMasteryAtTier } from "@mmo-idle/shared";
import { missingToReasons, reasonsToMissing, unsatisfiableByFarming } from "./conditions";
import { RouteExecutor } from "./executor";
import type { Observation } from "../state/observation";

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

// ── The stall survives the reasons round trip ────────────────────────────────
//
// `farmBlocked` only ever sees `reasonsToMissing(reasons())`, so every key the
// stall reads must come back out of it unchanged.
{
  const obs = obsWith(2, 30, { plains: 3 });
  const reasons = missingToReasons({ "biomeLevel.forest": 2, globalMasteryNeeded: 1 }, obs);
  assert.deepEqual(reasons.map((r) => r.kind).sort(), ["biomeLevel", "globalMastery"]);
  const missing = reasonsToMissing(reasons);
  assert.deepEqual(missing, { "biomeLevel.forest": 2, globalMasteryNeeded: 1 }, "the keys survive the round trip");
  assert(unsatisfiableByFarming(missing, PLAINS_NODE, obs), "and still name the stall");
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
      "craft:plains-vest-t1",
      () => false,
      () => [{ kind: "globalMastery", current: 30, required: 35, missing: 5 }],
      // `ignoreBiomeCap` must not suppress this stall.
      true,
    ),
    (error: unknown) => {
      const message = (error as Error).message;
      assert.match(
        message,
        /^craft:plains-vest-t1 cannot be farmed at node-t1-plains-01: it needs 5 more Global Mastery/,
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
      "craft:plains-charm-t1",
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
