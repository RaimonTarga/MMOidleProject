import assert from "node:assert/strict";
import { buildRP } from "../loadout/loadout";
import { runeBudgetForGlobalMastery } from "@mmo-idle/shared";
import { STRIKER_CAMPAIGN_PLAINS_ENTRY_T1 as entry, STRIKER_CAMPAIGN_PLAINS_BOSS_T1 as route, STRIKER_CAMPAIGN_PLAINS_BOSS_V1B as repair, STRIKER_CAMPAIGN_PREPARATION_T1 as preparation, CAMPAIGN_PLAINS_T1_BUILD as build } from "./campaignBoss";

assert.equal(entry.startsFromTierEntry, 1);
assert.equal(entry.steps.some(s => s.type === "farm"), false, "encounter entry never repeats the acquisition route");
assert.equal(entry.steps.filter(s => s.type === "attemptBoss").length, 1);
assert.deepEqual(entry.steps.at(-1), { type: "attemptBoss", biomeGroup: "plains", tier: 1, maxAttempts: 1, label: "v1e:plains-attempt" });
assert(entry.steps.some(s => s.type === "assert" && s.condition.type === "equipped" && s.condition.definitionId === "plains-charm-t1"));
assert(entry.steps.some(s => s.type === "assert" && s.condition.type === "itemAtLeastPlus" && s.condition.definitionId === "plains-charm-t1" && s.condition.plus === 5));

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
assert.equal(repair.steps.filter(s => s.type === "attemptBoss").length, 1);
assert.equal(preparation.steps.some(s => s.type === "attemptBoss"), false);
assert.equal(preparation.startsFromTierEntry, undefined);
assert.equal(preparation.steps.at(-1)?.type, "assert");
assert.deepEqual(preparation.steps.filter(s => s.type === "configureBuild").map(s => s.build), [build]);
assert.deepEqual(preparation.completion, { type: "allOf", of: repair.steps.filter(s => s.type === "assert").map(s => s.condition) });
assert.deepEqual(repair.steps.filter(s => s.type === "assert"), route.steps.filter(s => s.type === "assert"));
assert.deepEqual(repair.steps.filter(s => s.type === "configureBuild").map(s => s.build), [build]);
assert.equal(repair.steps.some(s => s.type === "learnAbility" && s.abilityId === "expose-weakness" && s.attune !== false), false);
for (const item of ["chaotic-axe", "plains-vest-t1", "swamp-charm-t1", "plains-boots-t1"]) {
  assert(repair.steps.some(s => s.type === "upgrade" && s.definitionId === item && s.toPlus === 5));
}
