import { CONDITION_DATABASE, type AbilityDef, type AttunedAbilities, type EquippedRule } from "@mmo-idle/shared";
export function abilityTiming(ability: AbilityDef, _attuned: AttunedAbilities, rules: readonly EquippedRule[]) {
  const overrides = rules.filter(rule => rule.actionId === "use-ability" && rule.targetAbilityId === ability.id);
  return {
    overrides,
    overrideText: overrides.length
      ? `Rune timing: ${overrides.map(rule => CONDITION_DATABASE.get(rule.conditionId)?.name ?? rule.conditionId).join(" → otherwise ")}. Waits when no rule matches. Cooldowns and target requirements still apply.`
      : "No Rune timing: fires only when you use it. Wire a Use Ability rule to automate it.",
  };
}
