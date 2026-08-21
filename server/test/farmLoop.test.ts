// Wiring smoke test for the farm loop (roadmap 0.4).
//
// WHY THIS EXISTS: the balance bench is an ARENA — repopulation suppressed, loop
// broken on node clear — so nothing measured income. Farm mode flips both and
// ledgers `tracksProgression` deltas into per-hour rates. The invariants worth
// pinning are structural, not numeric: the node must actually refill, the run
// must NOT stop when it empties, kills must be counted, and the ledger must see
// the same rewards the live `grantMonsterRewards` path writes.
//
// Deliberately NOT asserted: any balance number. Rates are the tool's output and
// change with every tuning pass.
//
// Run: pnpm --filter @mmo-idle/server exec tsx --conditions=development test/farmLoop.test.ts

import { CLEARING_NODE_ID, NODE_BIOMES } from "@mmo-idle/shared";
import { createBalanceWorld, createFarmWorld } from "../bench/balance/worldFactory";
import {
  enumerateFarmTargets,
  farmTargetForNode,
} from "../bench/balance/farmTargets";
import { representativeBuildsPerClass } from "../bench/balance/progression";
import { runFarm } from "../bench/balance/runFarm";
import { diffLedger, snapshotLedger } from "../bench/balance/ledger";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

// ── The two flags that separate an arena from a farm ─────────────────────────

assert(
  createBalanceWorld().suppressRepopulation === true,
  "arena world must suppress repopulation so clears can complete",
);
assert(
  createFarmWorld().suppressRepopulation === false,
  "farm world must leave repopulation ON — that is the whole point",
);

// ── Target selection ─────────────────────────────────────────────────────────

const targets = enumerateFarmTargets([0, 1, 2, 3, 4]);
assert(targets.length > 0, "farm sweep enumerated no targets");

for (const target of targets) {
  const info = NODE_BIOMES[target.nodeId];
  assert(info !== undefined, `farm target ${target.nodeId} is not a real node`);
  assert(
    info.kind === "normal" || target.nodeId === CLEARING_NODE_ID,
    `farm target ${target.nodeId} is kind '${info.kind}' — not farmable open world`,
  );
  assert(
    !info.isDungeon,
    `farm target ${target.nodeId} is a dungeon — dungeons never repopulate`,
  );
}

// One representative per (biome group x tier), no duplicates.
const pairKeys = targets.map((t) => `${t.biomeGroup}:${t.contentTier}`);
assert(
  new Set(pairKeys).size === pairKeys.length,
  "farm sweep produced more than one node for some (biome x tier) pair",
);

// Non-excluded farm nodes carry a modifier — that is the catalyst key, and a
// node without one mints nothing.
for (const target of targets) {
  if (target.nodeId === CLEARING_NODE_ID) continue;
  assert(
    target.modifier !== undefined,
    `farm target ${target.nodeId} has no modifier — it would mint no catalysts`,
  );
}

// A dungeon must be rejected outright rather than silently farmed.
const dungeonId = Object.keys(NODE_BIOMES).find((id) => NODE_BIOMES[id].isDungeon);
assert(dungeonId !== undefined, "no dungeon node found to test rejection");
let rejected = false;
try {
  farmTargetForNode(dungeonId!);
} catch {
  rejected = true;
}
assert(rejected, `farmTargetForNode accepted dungeon node ${dungeonId}`);

// ── Ledger arithmetic ────────────────────────────────────────────────────────
{
  const before = {
    essences: { red: 0, blue: 0, green: 10, yellow: 0, purple: 0 },
    catalysts: { alacrity: 1 },
    catalystProgress: { alacrity: 0 },
    biomeXP: { plains: 0 },
    biomeLevel: { plains: 0 },
    unlockedRecipes: 2,
  };
  const after = {
    essences: { red: 0, blue: 0, green: 40, yellow: 0, purple: 0 },
    catalysts: { alacrity: 3 },
    catalystProgress: { alacrity: 25 },
    biomeXP: { plains: 120 },
    biomeLevel: { plains: 2 },
    unlockedRecipes: 5,
  };
  const delta = diffLedger(before, after, 50);
  assert(delta.essences.green === 30, "essence diff wrong");
  assert(delta.essenceTotal === 30, "essence total wrong");
  // 2 minted + 25/50 of a third banked.
  assert(delta.catalysts.alacrity === 2.5, "catalyst diff must count partial progress");
  assert(delta.catalystsMinted.alacrity === 2, "minted catalysts wrong");
  assert(delta.biomeXpTotal === 120, "biome xp diff wrong");
  assert(delta.biomeLevels.plains === 2, "biome level diff wrong");
  assert(delta.recipesUnlocked === 3, "recipe unlock diff wrong");
}

// ── A real (short) farm run ──────────────────────────────────────────────────

// Plains T1 by preference: the densest early node, so a short run still clears
// its initial population several times over and proves repopulation.
const target =
  targets.find((t) => t.contentTier === 1 && t.biomeGroup === "plains") ??
  targets.find((t) => t.contentTier === 1);
assert(target !== undefined, "no tier-1 farm target to run");

const [build] = representativeBuildsPerClass(
  target!.contentTier,
  target!.biomeGroup,
);
assert(build !== undefined, "no representative build for the tier-1 target");

// One representative build per class root, one each.
const perClass = representativeBuildsPerClass(
  target!.contentTier,
  target!.biomeGroup,
);
assert(
  new Set(perClass.map((b) => b.classRoot)).size === perClass.length,
  "representativeBuildsPerClass returned two builds of the same class",
);

const SIM_SECONDS = 600;
const result = runFarm(build!, target!, {
  maxSimSeconds: SIM_SECONDS,
  timeScale: 5,
});

// The run went the full distance instead of stopping at the first clear.
assert(
  Math.abs(result.simDurationMs - SIM_SECONDS * 1000) < 1_000,
  `farm run stopped early: ${result.simDurationMs}ms of a requested ${SIM_SECONDS * 1000}ms`,
);
// Repopulation kept feeding it: a node holding ~mobDensity monsters cannot yield
// more kills than its initial population unless it refilled.
assert(result.kills > 0, "farm run recorded no kills");
assert(
  result.kills > result.mobDensity,
  `only ${result.kills} kills vs a mob density of ${result.mobDensity} — the node did not repopulate`,
);
assert(result.killsPerHour > 0, "kills/hour did not compute");

// The ledger saw the live reward path.
assert(result.essenceSum > 0, "farm run earned no essence");
assert(result.essenceSumPerHour > 0, "essence/hour did not compute");
assert(
  result.biomeXpTotal > 0,
  "farm run earned no biome XP — the farmed biome was not reset to level 0",
);
assert(
  result.biomeLevelStart === 0,
  "the farmed biome must start at level 0 or applyBiomeXP early-returns at cap",
);
if (target!.modifier) {
  assert(
    (result.catalystTotal[target!.modifier] ?? 0) > 0,
    `no ${target!.modifier} catalyst progress on a ${target!.modifier} node`,
  );
}

// Snapshots are independent copies, not live references into the entity.
{
  const snap = snapshotLedger({
    tracksProgression: {
      essences: { red: 1, blue: 0, green: 0, yellow: 0, purple: 0 },
      catalysts: { alacrity: 1 },
      catalystProgress: {},
      biomeXP: {},
      biomeLevel: {},
      unlockedRecipes: [],
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);
  snap.catalysts.alacrity = 99;
  assert(snap.essences.red === 1, "snapshot lost a value");
}

console.log("farmLoop: ok");
