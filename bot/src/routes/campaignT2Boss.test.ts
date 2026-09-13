import assert from "node:assert/strict";
import { BIOME_PRIMARY_ESSENCE, NODE_BIOMES, NODE_MODIFIERS, RECIPE_DATABASE, runeBudgetForGlobalMastery } from "@mmo-idle/shared";
import { RouteExecutor } from "../route/executor";
import { buildRP } from "../loadout/loadout";
import { CAMPAIGN_T2_BOSS_ROUTES } from "./campaignT2Boss";
import { CAMPAIGN_T2_EXPANSION_ROUTES } from "./campaignT2Expansion";
import { CAMPAIGN_T2_V1K_ROUTES } from "./campaignT2V1k";

for (const route of [...CAMPAIGN_T2_BOSS_ROUTES, ...CAMPAIGN_T2_EXPANSION_ROUTES]) {
  assert(route.resumePreparedT2 && route.startsFromTierEntry === 2);
  assert.equal(route.steps.filter(s => s.type === "attemptBoss").length, 1);
  const last = route.steps.at(-1);
  assert(last?.type === "attemptBoss" && last.maxAttempts === 1);
  for (const step of route.steps) {
    if (step.type === "configureBuild") assert(buildRP(step.build).total <= runeBudgetForGlobalMastery(72));
    if (step.type === "upgrade") assert(step.farmForMissingResources && step.toPlus === 5);
  }
}

for (const route of CAMPAIGN_T2_EXPANSION_ROUTES) {
  const finalBuild = route.steps.filter(s => s.type === "configureBuild").at(-1)!;
  assert(finalBuild.type === "configureBuild");
  const swamp = route.id.includes("swamp-");
  assert.equal(buildRP(finalBuild.build).total, swamp ? 26 : 28);
  assert.equal(route.steps.filter(s => s.type === "milestone").length, 1);
  const target = route.steps.at(-1);
  assert(target?.type === "attemptBoss");
  assert(route.steps.some(s => s.type === "assert" && s.condition.type === "not" &&
    s.condition.of.type === "bossCleared" && s.condition.of.biomeGroup === target.biomeGroup));
}
const swampArms = CAMPAIGN_T2_EXPANSION_ROUTES.filter(r => r.id.includes("-swamp-"));
// Acquisition must match: no charm-dependent extra farm/upgrade exposure.
const acquisition = (route: typeof swampArms[number]) => route.steps.slice(0, -6).map(({ label, ...step }) => step);
assert.deepEqual(acquisition(swampArms[0]), acquisition(swampArms[1]));
assert.equal(CAMPAIGN_T2_BOSS_ROUTES.length, 3, "V1i arms remain unchanged");

for (const route of CAMPAIGN_T2_V1K_ROUTES) {
  const attempts = route.steps.filter(s => s.type === "attemptBoss");
  assert.equal(attempts.length, 1);
  assert.equal(attempts[0].maxAttempts, 1);
  for (const step of route.steps) {
    if (step.type === "configureBuild") assert(buildRP(step.build).total <= 30);
  }
  const finalBuild = route.steps.filter(s => s.type === "configureBuild").at(-1)!;
  assert.equal(buildRP(finalBuild.build).total, route.id.includes("-cave-cave-") ? 24 : 26);
  assert.equal(route.steps.at(-1)?.type, "assert");
  const observation = route.steps.at(-2);
  assert(observation?.type === "farm" && observation.observeForMs === 20_000 && observation.stepTimeoutMs === 60_000);
  assert.deepEqual(observation.requires, route.completion);
}
const swampArmorArms = CAMPAIGN_T2_V1K_ROUTES.filter(r => r.id.includes("-swamp-"));
assert.deepEqual(
  swampArmorArms[0].steps.slice(0, -8).map(({ label, ...s }) => s),
  swampArmorArms[1].steps.slice(0, -8).map(({ label, ...s }) => s),
  "armor comparison has identical preparation",
);

async function postClearRegression() {
  const source = CAMPAIGN_T2_V1K_ROUTES[0];
  for (const won of [true, false]) {
    const executed: string[] = [];
    const route = { ...source, steps: source.steps.slice(-2) };
    const executor = new RouteExecutor({ route, aborted: () => false,
      recorder: { emit: () => {}, now: () => 0 },
    } as never);
    Object.assign(executor, { test: () => won, checkMilestones: () => {},
      failedFacts: new Set(won ? [] : ["bossCleared:swamp:2"]),
      runStep: async (step: { type: string }) => { executed.push(step.type); },
    });
    await executor.run();
    assert.deepEqual(executed, won ? ["farm", "assert"] : [], "observe after a win; skip after exhausted boss attempt");
  }
}

// Exercise the real upgrade loop, including a resource change while blocked.
async function resourceRegression() {
  let red = 0, blue = 0, catalysts = 0;
  const obs = {
    self: { globalMastery: 66, clearedNodes: [] }, nodeId: "node-t2-jungle-02",
    essence: (type: string) => type === "red" ? red : type === "blue" ? blue : 10000,
    catalyst: () => catalysts, itemPlus: () => 3, maxUpgradeFor: () => 5,
    canUpgrade: () => ({ ok: red >= 287 && catalysts >= 100, reason: "missing resource" }),
  };
  const executor = new RouteExecutor({ obs, aborted: () => false,
    policy: { upgradeTarget: () => 4 }, recorder: { walletSnapshot: () => {}, emit: () => {} },
  } as never);
  const api = executor as unknown as { upgradeFarmNode: (step: unknown, recipe: unknown, plus: number) => string; doUpgrade: (step: unknown) => Promise<void> };
  const step = { type: "upgrade", definitionId: "ruinous-axe", toPlus: 4, farmForMissingResources: true,
    farmAt: { kind: "biome", biomeGroup: "jungle", tier: 2, modifier: "swarming" } };
  let node = api.upgradeFarmNode(step, RECIPE_DATABASE.get(step.definitionId), 4);
  assert.equal(BIOME_PRIMARY_ESSENCE[NODE_BIOMES[node].biomeGroup], "red");
  node = api.upgradeFarmNode({ ...step, definitionId: "mountain-vest-t2" }, RECIPE_DATABASE.get("mountain-vest-t2"), 4);
  assert.equal(BIOME_PRIMARY_ESSENCE[NODE_BIOMES[node].biomeGroup], "blue");
  node = api.upgradeFarmNode({ ...step, farmForMissingResources: false }, RECIPE_DATABASE.get(step.definitionId), 4);
  assert.equal(NODE_BIOMES[node].biomeGroup, "jungle", "frozen explicit policies remain unchanged without opt-in");
  let spans = 0;
  const complete = new Error("reached ordinary upgrade intent");
  Object.assign(executor, {
    farmBlocked: async (farmNode: string, _what: string, done: () => boolean) => {
      assert.equal(done(), false);
      if (++spans === 1) {
        assert.equal(NODE_BIOMES[farmNode].biomeGroup, "cave");
        red = 10000;
        assert.equal(obs.canUpgrade().ok, false);
        assert.equal(done(), true, "leave the essence span when the remaining resource selects another node");
      } else {
        assert.equal(spans, 2);
        assert.equal(NODE_MODIFIERS[farmNode].modifier, "swarming");
        catalysts = 100;
        assert.equal(done(), true);
      }
    },
    mutate: async () => { throw complete; },
  });
  await assert.rejects(api.doUpgrade(step), error => error === complete);
  assert.equal(spans, 2);
}
resourceRegression().then(postClearRegression).then(() => console.log("campaignT2Boss: ok (resource selection, routes and post-clear observation)"));
