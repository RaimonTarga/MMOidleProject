import assert from "node:assert/strict";
import type { EquippedRule } from "@mmo-idle/shared";
import type { RouteStep } from "../route/types";
import { ROUTES } from "./index";
import { CAMPAIGN_PROFILES } from "../loadout/campaignProfiles";
import { withClassRecovery } from "./classRecovery";

// Every registered route: a Conduit waits for its formation, never for HP; no
// other class carries the Conduit-only rule.
function ruleSets(steps: readonly RouteStep[]): EquippedRule[][] {
  return steps.flatMap((step) => {
    if (step.type === "configureRunes") return [step.rules];
    if (step.type === "configureBuild") return [step.build.runeRules];
    return [];
  });
}

let conduitRuleSets = 0;
for (const route of ROUTES.values()) {
  const conduit = route.classRoot === "summoner-root";
  for (const rules of ruleSets(route.steps)) {
    const actions = rules.map((rule) => rule.actionId);
    if (conduit) {
      conduitRuleSets++;
      assert(!actions.includes("wait-for-regen"), `${route.id}: Conduit route still waits for regen`);
    } else {
      assert(!actions.includes("wait-for-summons"), `${route.id}: non-Conduit route carries Rebuild Formation`);
    }
  }
}
assert(conduitRuleSets > 0, "fixture: at least one Conduit route configures runes");

for (const profile of CAMPAIGN_PROFILES) {
  for (const build of [profile.entry, profile.farm, profile.bossCandidate]) {
    const actions = build.runeRules.map((rule) => rule.actionId);
    if (profile.classRoot === "summoner-root") {
      assert(actions.includes("wait-for-summons") && !actions.includes("wait-for-regen"), `${profile.id}: Conduit profile recovery`);
    } else {
      assert(!actions.includes("wait-for-summons"), `${profile.id}: non-Conduit profile carries Rebuild Formation`);
    }
  }
}

// Same slot, same condition: only the action changes.
const swapped = withClassRecovery([{ conditionId: "always", actionId: "wait-for-regen" }], "summoner-root");
assert.deepEqual(swapped, [{ conditionId: "always", actionId: "wait-for-summons" }]);

console.log("classRecovery.test.ts: ok");
