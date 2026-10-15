import { SKILL_TREE } from "@mmo-idle/shared";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

// Root tooltips are the player-facing contract for class mechanics. Keep
// the authored values in the copy so a balance change cannot silently leave
// the most important mechanic invisible in the tree.
const requiredFragments: Record<string, string[]> = {
  "cadence-root": ["Class mechanic", "finisher"],
  "cooldown-root": ["Class mechanic", "7s reference cycle", "10% of your Recovery"],
  "reload-root": ["Class mechanics", "65% effectiveness", "10% extra damage mitigation", "×2.5"],
  "energy-root": ["Class mechanic", "30% of your max HP"],
  "dot-root": ["Class mechanics", "18% DoT resistance", "15% of incoming direct hits"],
  "summoner-root": ["maximum formation: 4", "before relic expansion"],
};

for (const [id, fragments] of Object.entries(requiredFragments)) {
  const node = SKILL_TREE.get(id);
  assert(node, `${id}: node is missing from the skill tree`);
  for (const fragment of fragments) {
    assert(
      node.description.includes(fragment),
      `${id}: mechanic copy is missing "${fragment}"`,
    );
  }
}

console.log("skillTreeMechanicCopy: ok");
