import { CONDITION_DATABASE, type AbilityDef, type AttunedAbilities, type EquippedRule } from "@mmo-idle/shared";
import { triggerSentence } from "./abilityText";
export function abilityTiming(ability: AbilityDef, _attuned: AttunedAbilities, rules: readonly EquippedRule[]) {
  const overrides = rules.filter(rule => rule.actionId === "use-ability" && rule.targetAbilityId === ability.id);
  return {
    defaultBehavior: triggerSentence(ability.trigger), overrides,
    overrideText: overrides.length ? `Rune timing: ${overrides.map(rule => CONDITION_DATABASE.get(rule.conditionId)?.name ?? rule.conditionId).join(" → otherwise ")}. Replaces the default trigger; waits when no rule matches. Cooldowns and target requirements still apply.` : "",
  };
}
