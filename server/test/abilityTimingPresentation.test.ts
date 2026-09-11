import {
  ABILITY_DATABASE,
  abilityDef,
  type AttunedAbilities,
  type EquippedRule,
} from "@mmo-idle/shared";
import { abilityTiming } from "../../client/src/ui/describe/abilityTiming";
import { triggerSentence } from "../../client/src/ui/describe/abilityText";
function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}
const equipped: AttunedAbilities = {
  techniques: ["sweep", "charge"],
  guards: ["second-wind"],
};
const rules: EquippedRule[] = [
  { conditionId: "hp-below-25", actionId: "use-ability", targetAbilityId: "charge" },
  { conditionId: "in-combat", actionId: "use-ability", targetAbilityId: "charge" },
  { conditionId: "has-debuff", actionId: "use-ability", targetAbilityId: "second-wind" },
];
for (const ability of ABILITY_DATABASE.values()) {
  const timing = abilityTiming(ability, equipped, []);
  assert(
    timing.defaultBehavior === triggerSentence(ability.trigger),
    `${ability.id}: authored trigger lost`,
  );
  assert(
    timing.defaultBehavior.length > 0 && !timing.overrideText,
    `${ability.id}: missing default or invented override`,
  );
}
const charge = abilityDef("charge")!;
assert(
  abilityTiming(charge, equipped, rules).overrides.length === 2,
  "All configured timing conditions must remain discoverable",
);
assert(
  !abilityTiming(abilityDef("sweep")!, equipped, rules).overrideText,
  "Second technique rules must not label the first as overridden",
);
assert(
  abilityTiming(charge, { ...equipped, techniques: ["charge", "sweep"] }, rules)
    .overrides.length === 2,
  "Overrides follow ability identity after reordering",
);
assert(
  abilityTiming(
    abilityDef("second-wind")!,
    equipped,
    rules,
  ).overrideText.includes("waits when no rule matches"),
  "Do not imply that default timing resumes when a Rune condition is false",
);
console.log("abilityTimingPresentation: ok");
