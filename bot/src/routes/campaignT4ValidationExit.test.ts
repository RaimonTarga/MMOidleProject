import assert from "node:assert/strict";
import {
  adjacentWorldNodeIds,
  DUNGEON_DEFS,
  MONSTER_DATABASE,
} from "@mmo-idle/shared";
import {
  CAMPAIGN_T4_BOSS_COVERAGE_ROUTES,
  CAMPAIGN_T4_VOLCANO_DIAGNOSTIC,
  T4_VALIDATION_BOSS_CASES,
} from "./campaignT4ValidationExit";
import { ROUTES } from "./index";

assert.equal(T4_VALIDATION_BOSS_CASES.length, 6);
assert.deepEqual(
  T4_VALIDATION_BOSS_CASES.map((entry) => entry.group),
  ["jungle", "desert", "tundra", "trench", "graveyard", "volcanic"],
);
assert.equal(CAMPAIGN_T4_BOSS_COVERAGE_ROUTES.length, 6);

for (const entry of T4_VALIDATION_BOSS_CASES) {
  const dungeonNodeId = entry.path.at(-1)!;
  const dungeon = DUNGEON_DEFS.get(dungeonNodeId);
  assert(dungeon, `${entry.group}: dungeon definition must exist`);
  assert.equal(dungeon.boss.bossId, entry.bossId, `${entry.group}: boss source drift`);
  assert.equal(MONSTER_DATABASE.get(entry.bossId)?.name, entry.bossName, `${entry.group}: boss name source drift`);
  assert.equal(dungeon.guard.id, entry.guardId, `${entry.group}: guard source drift`);
  assert.equal(
    dungeon.guard.groups.reduce(
      (total, group) => total + 1 + (group.followers ?? []).reduce((sum, follower) => sum + follower.count, 0),
      0,
    ),
    entry.guardianTotal,
    `${entry.group}: guardian count source drift`,
  );

  for (let index = 1; index < entry.path.length; index += 1) {
    const from = entry.path[index - 1]!;
    const to = entry.path[index]!;
    assert(adjacentWorldNodeIds(from).includes(to), `${entry.group}: ${from} -> ${to} is not adjacent`);
    assert(adjacentWorldNodeIds(to).includes(from), `${entry.group}: ${to} -> ${from} is not bidirectional`);
  }
}

for (const route of CAMPAIGN_T4_BOSS_COVERAGE_ROUTES) {
  const attempts = route.steps.filter((step) => step.type === "attemptBoss");
  assert.equal(attempts.length, 1, `${route.id}: exactly one boss attempt`);
  assert.equal(attempts[0]?.maxAttempts, 1, `${route.id}: no retry budget`);
  assert.equal(route.stopOnFirstDeath, true, `${route.id}: first-death stop`);
  assert.equal(route.suppressTransitCombat, true, `${route.id}: transit combat suppressed`);
  assert.equal(route.progressionEntry?.boundaryId, "night3-mountain-control-r1-returned");
  assert(
    route.progressionEntry?.prerequisites.some(
      (condition) => condition.type === "bossCleared" && condition.biomeGroup === "mountain" && condition.tier === 4,
    ),
    `${route.id}: retained Mountain4 seal is an entry prerequisite`,
  );
  assert(route.steps.some((step) => step.type === "captureCheckpoint" && step.boundaryId.endsWith("-ready")));
  assert(route.steps.some((step) => step.type === "captureCheckpoint" && step.boundaryId.endsWith("-returned")));
  assert.equal(ROUTES.get(route.id), route, `${route.id}: registered in route map`);
}

const diagnosticFarm = CAMPAIGN_T4_VOLCANO_DIAGNOSTIC.steps.find(
  (step) => step.type === "farm" && step.observeForMs === 600_000,
);
assert(diagnosticFarm, "Volcano diagnostic has the bounded 10-minute measurement window");
assert.equal(CAMPAIGN_T4_VOLCANO_DIAGNOSTIC.stopOnFirstDeath, true);
assert.equal(CAMPAIGN_T4_VOLCANO_DIAGNOSTIC.suppressTransitCombat, true);
assert.equal(
  CAMPAIGN_T4_VOLCANO_DIAGNOSTIC.progressionEntry?.boundaryId,
  "v1z-plus2-prepared-returned",
);
assert.equal(ROUTES.get(CAMPAIGN_T4_VOLCANO_DIAGNOSTIC.id), CAMPAIGN_T4_VOLCANO_DIAGNOSTIC);

console.log("T4 validation-exit routes: ok");
