import assert from "node:assert/strict";
import { ABILITY_DATABASE, STANCE_DATABASE, RITE_DATABASE, CONDITION_DATABASE, ACTION_DATABASE, type PlayerView } from "@mmo-idle/shared";
import { buildKey, validateBuild, type DesiredBuild } from "./loadout";
import { runeLoadoutsEqual } from "../route/executor";

const self = { knownAbilities: [...ABILITY_DATABASE.keys()], knownStances: [...STANCE_DATABASE.keys()],
  knownRites: [...RITE_DATABASE.keys()], runesOwned: [...CONDITION_DATABASE.keys(), ...ACTION_DATABASE.keys()],
  combatArchetype: "cadence", globalMastery: 30 } as PlayerView;
const empty: DesiredBuild = { abilities: { techniques: [], guards: [] }, stances: { attuned: [], default: null }, runeRules: [], rites: [] };
assert.deepEqual(validateBuild(empty, self), []);
assert.equal(validateBuild(null as unknown as DesiredBuild, self)[0].code, "MALFORMED_BUILD");
assert.equal(validateBuild({ ...empty, abilities: { techniques: ["brace"], guards: [] } }, self)[0].code, "MALFORMED_BUILD");
assert.equal(validateBuild({ ...empty, abilities: { techniques: ["sweep", "sweep"], guards: [] } }, self)[0].code, "MALFORMED_BUILD");
assert.equal(validateBuild({ ...empty, rites: ["swift-repose"] }, { ...self, knownRites: [] })[0].code, "MISSING_UNLOCK");
assert.equal(validateBuild({ ...empty, stances: { attuned: [], default: "offensive-stance" } }, self)[0].code, "MALFORMED_BUILD");
assert.equal(validateBuild({ ...empty, runeRules: [{ conditionId: "always", actionId: "use-ability", targetAbilityId: "sweep" }] }, self)[0].code, "MALFORMED_BUILD");
assert.equal(validateBuild({ ...empty, runeRules: [{ conditionId: "always", actionId: "switch-stance", targetStanceId: "offensive-stance" }] }, self)[0].code, "MALFORMED_BUILD");
const two = { ...empty, abilities: { techniques: ["sweep", "expose-weakness"], guards: [] } };
assert.deepEqual(validateBuild(two, self), []);
assert.notEqual(buildKey(two), buildKey({ ...two, abilities: { techniques: ["expose-weakness", "sweep"], guards: [] } }));
assert.notEqual(buildKey(two), buildKey(empty), "clearing is never a subset match");
assert.equal(runeLoadoutsEqual([{ conditionId: "always", actionId: "use-ability", targetAbilityId: "sweep" }],
  [{ conditionId: "always", actionId: "use-ability", targetAbilityId: "expose-weakness" }]), false);
const over = { ...two, runeRules: Array.from({ length: 40 }, () => ({ conditionId: "always", actionId: "use-ability", targetAbilityId: "sweep" })) };
assert(validateBuild(over, self).some(issue => issue.code === "INSUFFICIENT_RP"));
console.log("loadout.test.ts: ok");
