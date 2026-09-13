import assert from "node:assert/strict";
import { BIOME_PRIMARY_ESSENCE, NODE_BIOMES, NODE_MODIFIERS, RECIPE_DATABASE, runeBudgetForGlobalMastery } from "@mmo-idle/shared";
import { RouteExecutor } from "../route/executor";
import { buildRP } from "../loadout/loadout";
import { CAMPAIGN_T2_BOSS_ROUTES } from "./campaignT2Boss";
import { CAMPAIGN_T2_EXPANSION_ROUTES } from "./campaignT2Expansion";

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
resourceRegression().then(() => console.log("campaignT2Boss: ok (resource selection, reselection and declared boss routes)"));
