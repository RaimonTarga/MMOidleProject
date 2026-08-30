import { isRangedCombatant } from "@mmo-idle/shared";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const base = {
  attackRange: 60,
  selectedRange: null,
  flashActive: false,
} as const;

assert(
  isRangedCombatant({ ...base, combatArchetype: "dot" }),
  "Apprentice should cast from its default short range instead of closing for melee",
);
assert(
  !isRangedCombatant({ ...base, combatArchetype: "dot", selectedRange: "dot-range-close" }),
  "an explicit close-range choice must still override Apprentice's default cast range",
);
assert(
  !isRangedCombatant({ ...base, combatArchetype: "dot", flashActive: true }),
  "Flash must remain a melee override for every archetype",
);

console.log("rangedCombatant: ok");
