import assert from "node:assert/strict";
import {
  biomeLevelCap,
  classConfigContext,
  defaultClassConfig,
  resolveClassConfig,
  SKILL_TREE,
  T1_BIOME_ORDER,
  TUTORIAL_SEALS,
  tutorialScriptFor,
  validateClassConfig,
  type TutorialCondition,
} from "@mmo-idle/shared";
import type { Condition, RouteStep } from "../route/types";
import { isClassAgnosticRouteId, isControlledRouteId, requireRoute, ROUTES } from "./index";
import { SLINGER_CLASS_ROOT, SLINGER_T1_ID, slingerFarmLevel, slingerT1Route } from "./slingerT1";

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const [FIRST_SEAL, SECOND_SEAL] = TUTORIAL_SEALS;

function gates(condition: Condition | TutorialCondition): (Condition | TutorialCondition)[] {
  if (condition.type === "allOf" || condition.type === "anyOf") return [condition, ...condition.of.flatMap(gates)];
  if (condition.type === "not") return [condition, ...gates(condition.of)];
  return [condition];
}

/** The highest tier-1 biome level the Slinger guide waits on in this zone. */
function tutorialLevel(biomeGroup: string): number {
  let level = 0;
  for (const beat of tutorialScriptFor(SLINGER_CLASS_ROOT).beats) {
    for (const step of beat.steps) {
      if (step.type !== "farm") continue;
      if (step.at.kind === "biome" && step.at.tier !== 1) continue; // the T2 stretch is the T2 route's
      for (const gate of gates(step.until)) {
        if (gate.type === "biomeLevelAtLeast" && gate.biomeGroup === biomeGroup) {
          level = Math.max(level, gate.level);
        }
      }
    }
  }
  return level;
}

const route = slingerT1Route();
assert.equal(route.id, SLINGER_T1_ID);
assert(KEBAB.test(route.id), "the id is kebab-case");
assert.equal(route.version, "1.0.0");
assert.equal(route.classRoot, SLINGER_CLASS_ROOT);
assert.equal(SKILL_TREE.get(route.classRoot)?.tier, 0, "the class root is a tier-0 skill");
assert(route.description.length > 0, "the route is described");
assert.deepEqual(ROUTES.get(SLINGER_T1_ID), route, "slinger-t1 is registered");
assert.equal(requireRoute(SLINGER_T1_ID), ROUTES.get(SLINGER_T1_ID));
assert.deepEqual(requireRoute(SLINGER_T1_ID, "reload"), route, "--class=reload is the route's own class");
assert.deepEqual(requireRoute(SLINGER_T1_ID, SLINGER_CLASS_ROOT), route);
assert.equal(isClassAgnosticRouteId(SLINGER_T1_ID), false, "the route is not rebuilt for another class");
assert.equal(isControlledRouteId(SLINGER_T1_ID), true, "slinger-t1 is admitted to a controlled batch");
let rejected = false;
try {
  requireRoute(SLINGER_T1_ID, "cadence");
} catch {
  rejected = true;
}
assert(rejected, "naming another class is rejected");

// ── Steps: the quest, the class, the auto Loadout, the guide's zones ─────────
const kinds = route.steps.map((step) => step.type);
const walks = T1_BIOME_ORDER.filter((biome) => biome !== FIRST_SEAL && biome !== SECOND_SEAL);
assert.deepEqual(kinds, [
  "travel", "farm", "chooseClass", "classConfig",
  "travel", "farm", "attemptBoss",
  ...walks.flatMap(() => ["travel", "farm"]),
  "travel", "farm", "attemptBoss",
  "farm",
]);

const [toClearing, quest, choose, config] = route.steps;
assert(toClearing.type === "travel" && toClearing.to.kind === "node", "the quest starts in the Clearing");
assert(quest.type === "farm" && quest.until.type === "playerTierAtLeast" && quest.until.tier === 1,
  "the tier-0 quest comes first");
assert(choose.type === "chooseClass" && choose.skillId === SLINGER_CLASS_ROOT, "the route chooses the Slinger");
assert(config.type === "classConfig" && config.config.mode === "auto", "the Loadout is left on auto");
if (config.type === "classConfig") {
  const ctx = classConfigContext("reload", { biomeLevel: {}, bossesCleared: [], disciplineId: null }, 0);
  const checked = validateClassConfig(config.config, ctx);
  assert(checked.ok, `auto config is valid for a fresh Slinger${checked.ok ? "" : `: ${checked.reasons.join("; ")}`}`);
  const resolved = resolveClassConfig(config.config, ctx);
  assert.deepEqual(resolved, defaultClassConfig(ctx), "auto resolves to the §10.13 default");
  assert.deepEqual(config.config, resolved, "the route sends that fresh default");
  assert.equal(resolved.system.kind, "loadout");
  if (resolved.system.kind === "loadout") {
    assert.deepEqual(resolved.system.rack, [], "nothing is racked before a clip is learned");
    assert.deepEqual(resolved.system.clipRules, []);
    assert.deepEqual(resolved.system.doubleLoads, []);
    assert.equal(resolved.system.reloadEarlyWhenSafe, true, "reload early when nothing threatens");
    assert.equal(resolved.system.neverReloadInTelegraph, true, "never start a reload inside a telegraph");
  }
  assert.deepEqual(resolved.relic, [], "auto starts with no trophy");
}

const zoneOrder = [FIRST_SEAL, ...walks, SECOND_SEAL];
const farms = route.steps.filter((step): step is Extract<RouteStep, { type: "farm" }> =>
  step.type === "farm" && step.at.kind === "biome");
assert.equal(farms.length, zoneOrder.length + 1, "one farm per zone, then the tier-2 wait");
zoneOrder.forEach((biomeGroup, index) => {
  const farm = farms[index];
  assert(farm.at.kind === "biome" && farm.at.biomeGroup === biomeGroup && farm.at.tier === 1, `${biomeGroup} is farmed in order`);
  assert(farm.until.type === "biomeLevelAtLeast" && farm.until.biomeGroup === biomeGroup, `${biomeGroup} waits on its own level`);
  assert.equal(farm.until.type === "biomeLevelAtLeast" ? farm.until.level : -1, slingerFarmLevel(biomeGroup));
  assert.equal(slingerFarmLevel(biomeGroup), tutorialLevel(biomeGroup),
    `${biomeGroup} is farmed to the level the guide farms`);
  if (biomeGroup === SECOND_SEAL) assert.equal(slingerFarmLevel(biomeGroup), 2, "the Mountain stops at the Stopping lesson");
  else assert.equal(slingerFarmLevel(biomeGroup), biomeLevelCap(1, biomeGroup), `${biomeGroup} is farmed to the tier cap`);
});
const tierWait = farms[farms.length - 1];
assert(tierWait.until.type === "playerTierAtLeast" && tierWait.until.tier === 2, "the last farm waits on tier 2");
assert(tierWait.at.kind === "biome" && tierWait.at.biomeGroup === SECOND_SEAL, "the tier-2 wait stands in the second seal");

const bosses = route.steps.filter((step): step is Extract<RouteStep, { type: "attemptBoss" }> => step.type === "attemptBoss");
assert.deepEqual(bosses.map((step) => step.biomeGroup), [FIRST_SEAL, SECOND_SEAL], "the two seals, in guide order");
assert(bosses.every((step) => step.tier === 1), "both seals are tier 1");

assert(route.completion.type === "allOf", "completion is both seals and the promotion");
if (route.completion.type === "allOf") {
  const types = route.completion.of.map((condition) => condition.type);
  assert.deepEqual(types, ["bossCleared", "bossCleared", "playerTierAtLeast"]);
}

const milestoneIds = route.milestones.map((milestone) => milestone.id);
assert.equal(new Set(milestoneIds).size, milestoneIds.length, "milestone ids are unique");
for (const id of milestoneIds) assert(KEBAB.test(id), `milestone ${id} is kebab-case`);
for (const biomeGroup of zoneOrder) {
  assert(milestoneIds.some((id) => id.startsWith(`${biomeGroup}-`)), `${biomeGroup} has a milestone`);
}
assert(milestoneIds.includes(`${FIRST_SEAL}-seal`) && milestoneIds.includes(`${SECOND_SEAL}-seal`), "each seal has a milestone");
assert(milestoneIds.includes("tier-2"), "tier 2 is a milestone");

console.log("slingerT1: ok");
