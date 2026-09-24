import {
  ACTION_DATABASE,
  CONDITION_DATABASE,
  NO_STANCE_ID,
  abilityDef,
  attunedForFamily,
  stanceDef,
  type AttunedAbilities,
  type EquippedRule,
} from "@mmo-idle/shared";
import { GameIcon } from "./GameIcon";
import {
  conceptAbilityIconSource,
  runeActionIconSource,
  runeConditionIconSource,
  stanceIconSource,
} from "./conceptIcons";

import { triggerSentence } from "./describe/abilityText";

export function runeResponse(rule: EquippedRule, abilities: AttunedAbilities) {
  if (rule.actionId === "use-ability") {
    const ability = abilityDef(rule.targetAbilityId);
    return { name: ability?.name ?? "Choose ability", icon: ability ? conceptAbilityIconSource(ability.id) : runeActionIconSource(rule.actionId), missing: !ability || ![...abilities.techniques, ...abilities.guards].includes(ability.id), detail: ability ? `Default: ${triggerSentence(ability.trigger)} Rune timing replaces this trigger.` : "Choose an attuned ability. Learn and attune tools before targeting them." };
  }
  if (rule.actionId === "switch-stance") {
    const stance = stanceDef(rule.targetStanceId);
    return {
      name:
        rule.targetStanceId === NO_STANCE_ID
          ? "No stance"
          : (stance?.name ?? "Choose a stance"),
      icon: stance
        ? stanceIconSource(stance.id)
        : runeActionIconSource(rule.actionId),
      missing: !stance && rule.targetStanceId !== NO_STANCE_ID,
      detail:
        stance?.blurb ??
        "Return to your default posture when this rule no longer applies.",
    };
  }
  if (rule.actionId === "wait-it-out" && rule.waitOutMode === "heat-managed") return { name: "Wait It Out / Manage Heat", icon: runeActionIconSource(rule.actionId), missing: false, detail: "Ordinary Volcano only: 25 Heat to request a break; resume at 10. Current fights finish first. Other afflictions do not extend this wait." };
  const action = ACTION_DATABASE.get(rule.actionId);
  return {
    name: action?.name ?? rule.actionId,
    icon: runeActionIconSource(rule.actionId),
    missing: !action,
    detail: action?.blurb ?? "",
  };
}

/** The same visual sentence in the editor, draft and live behavior readout. */
export function RuneClause({
  rule,
  abilities,
}: {
  rule: EquippedRule;
  abilities: AttunedAbilities;
}) {
  const response = runeResponse(rule, abilities);
  return (
    <span className="rune-clause">
      <span className="rune-clause__half">
        <GameIcon
          source={runeConditionIconSource(rule.conditionId)}
          size={24}
          decorative
          fallback="◇"
        />
        <span>
          {CONDITION_DATABASE.get(rule.conditionId)?.name ?? rule.conditionId}
        </span>
      </span>
      <span className="rune-clause__arrow" aria-label="then">
        →
      </span>
      <span className="rune-clause__half">
        <GameIcon source={response.icon} size={24} decorative fallback="◇" />
        <span>{response.name}</span>
      </span>
    </span>
  );
}
