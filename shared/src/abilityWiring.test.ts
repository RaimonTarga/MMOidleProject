import { ABILITY_DATABASE, STARTER_RUNE_IDS, isRuneRuleCompatible, referenceAbilityRule } from "./index";
function assert(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }

const starter = new Set(STARTER_RUNE_IDS);
for (const ability of ABILITY_DATABASE.values()) {
  const rule = referenceAbilityRule(ability.id);
  assert(rule, `${ability.id} needs reference wiring`);
  assert(isRuneRuleCompatible(rule), `${ability.id} reference wiring must be a legal rule`);
  assert(starter.has(rule.conditionId) && starter.has(rule.actionId), `${ability.id} reference wiring must use starter vocabulary`);
  assert(!("trigger" in ability), `${ability.id} must not author a built-in trigger`);
}
console.log("abilityWiring: ok");
