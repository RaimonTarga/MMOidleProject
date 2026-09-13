import { allOf, type Condition, type Route, type RouteStep } from "../route/types";
import { CAMPAIGN_T2_BOSS_ROUTES, spiritBossBuild } from "./campaignT2Boss";
import { CAMPAIGN_T2_V1K_ROUTES } from "./campaignT2V1k";

const source = CAMPAIGN_T2_BOSS_ROUTES.find(r => r.id === "spirit-campaign-forest-ruinous-axe-t2")!;
const desert = CAMPAIGN_T2_V1K_ROUTES.find(r => r.id === "spirit-campaign-desert-cave-vest-t2-v1k")!;
const desertBuild = desert.steps.filter(s => s.type === "configureBuild").at(-1)!.build;
const groups = ["plains", "forest", "desert"];
const clears = groups.map(biomeGroup => ({ type: "bossCleared" as const, biomeGroup, tier: 2 }));
const steps: RouteStep[] = [
  ...source.steps.slice(0, -3),
  ...clears.map(clear => ({ type: "assert" as const, condition: { type: "not" as const, of: clear } })),
  { type: "learnAbility", recipeId: "ability-recipe-cleanse", abilityId: "cleanse", slot: "guard", attune: false,
    farmAt: { kind: "biome", biomeGroup: "swamp", tier: 2 } },
];
for (const [i, group] of groups.entries()) {
  const requires: Condition = allOf(...clears.slice(0, i));
  const tag = `night2:bridge:${group}`;
  steps.push(
    { type: "travel", to: { kind: "node", nodeId: "node-t2-sanctuary" }, requires },
    { type: "farm", at: { kind: "node", nodeId: "node-t2-sanctuary" }, until: { type: "fullyRecovered" }, stepTimeoutMs: 180_000, requires, label: `${tag}:recover` },
    { type: "configureBuild", build: i === 0 ? spiritBossBuild("sweep") : i === 1 ? spiritBossBuild("expose-weakness") : desertBuild, requires, label: `${tag}:build` },
    { type: "milestone", id: `${tag}:ready`, requires },
    { type: "attemptBoss", biomeGroup: group, tier: 2, maxAttempts: 1, requires, label: `${tag}:attempt` },
  );
}
const earned = allOf(...clears);
steps.push(
  { type: "assert", condition: { type: "playerTierAtLeast", tier: 3 }, requires: earned },
  { type: "travel", to: { kind: "node", nodeId: "node-t3-sanctuary" }, requires: earned },
  { type: "farm", at: { kind: "node", nodeId: "node-t3-sanctuary" }, until: { type: "fullyRecovered" }, observeForMs: 20_000, stepTimeoutMs: 180_000, requires: earned, label: "night2:bridge:t3-recovered" },
  { type: "assert", condition: allOf(earned, { type: "playerTierAtLeast", tier: 3 }, { type: "fullyRecovered" }), requires: earned, label: "night2:bridge:qualified" },
);

/** One uninterrupted character earns all seals; leaves its T3 branch point unspent. */
export const CAMPAIGN_NIGHT2_BRIDGE: Route = {
  ...source, id: "spirit-continuous-t2-bridge-night2", version: "1.0.0",
  stopOnFirstDeath: true,
  description: "Continuous Plains, Forest, Desert seals, ordinary sanctuary recovery, natural T3 entry with unspent branch point.",
  steps, completion: allOf(earned, { type: "playerTierAtLeast", tier: 3 }, { type: "fullyRecovered" }), milestones: [],
};
