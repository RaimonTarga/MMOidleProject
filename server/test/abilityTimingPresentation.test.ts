import {
  ABILITY_DATABASE,
  abilityDef,
  type AttunedAbilities,
  type EquippedRule,
} from "@mmo-idle/shared";
import { abilityTiming } from "../../client/src/ui/describe/abilityTiming";
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
    timing.overrides.length === 0 && timing.overrideText.startsWith("No Rune timing"),
    `${ability.id}: an unwired ability must read as manual-only, never as having a default`,
  );
  assert(!("defaultBehavior" in timing), `${ability.id}: default behavior text must not return`);
}
const charge = abilityDef("charge")!;
assert(
  abilityTiming(charge, equipped, rules).overrides.length === 2,
  "All configured timing conditions must remain discoverable",
);
assert(
  abilityTiming(abilityDef("sweep")!, equipped, rules).overrides.length === 0,
  "Second technique rules must not label the first as wired",
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
  ).overrideText.includes("Waits when no rule matches"),
  "Say plainly that nothing fires when no Rune condition is true",
);
console.log("abilityTimingPresentation: ok");
