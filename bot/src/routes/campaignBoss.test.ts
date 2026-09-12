import assert from "node:assert/strict";
import { buildRP } from "../loadout/loadout";
import { runeBudgetForGlobalMastery } from "@mmo-idle/shared";
import { STRIKER_CAMPAIGN_PLAINS_BOSS_T1 as route, CAMPAIGN_PLAINS_T1_BUILD as build } from "./campaignBoss";

// Keep an inherited full-gauntlet route from expanding this experiment or
// importing its post-second-seal frame into a pre-seal character.
assert.equal(route.startsFromTierEntry, undefined);
assert.equal(route.frameId, undefined);
assert.equal(route.steps.filter(s => s.type === "attemptBoss").length, 1);
assert.deepEqual(route.steps.at(-1), {
  type: "attemptBoss", biomeGroup: "plains", tier: 1, maxAttempts: 1, label: "v1a:plains-attempt",
});
assert.equal(route.steps.some(s => s.type === "unlockSkill"), false);
assert.equal(route.steps.some(s => s.type === "craftStance"), false);
assert(buildRP(build).total <= runeBudgetForGlobalMastery(30));
assert.equal(route.steps.at(-3)?.type, "configureBuild");
for (const group of ["plains", "forest", "swamp", "mountain", "cave"]) {
  assert(route.steps.some(s => s.type === "farm" && s.until.type === "biomeLevelAtLeast" &&
    s.until.biomeGroup === group && s.until.level === 6), `${group} preparation is earned`);
}
console.log(`campaignBoss: ok (T1 preparation, one encounter, build RP=${buildRP(build).total})`);
