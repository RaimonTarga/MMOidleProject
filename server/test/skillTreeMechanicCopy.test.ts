import { SKILL_TREE } from "@mmo-idle/shared";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

// Root tooltips are the player-facing contract for class mechanics. Each names its class
// system and the loop it runs (class-first bible §7-§12, x.2 and x.3), so a rework cannot
// silently leave the first screen describing a mechanic that no longer exists.
const requiredFragments: Record<string, string[]> = {
  "cadence-root": ["Class mechanic", "finisher", "Order"],
  "cooldown-root": ["Class mechanic", "Resolve", "Response rules", "slam"],
  "reload-root": ["Class mechanic", "clip", "fire rate", "Loadout"],
  "energy-root": ["Class mechanic", "storm", "shield", "Thresholds"],
  "dot-root": ["Class mechanic", "sigils", "Payoff rules"],
  "summoner-root": ["Class mechanic", "never strike", "Command", "Formation"],
};
// Pre-rework mechanics that must not come back in the copy.
const retiredFragments = ["7s reference cycle", "65% effectiveness", "maximum formation: 4", "recharges after a quiet window"];

for (const [id, fragments] of Object.entries(requiredFragments)) {
  const node = SKILL_TREE.get(id);
  assert(node, `${id}: node is missing from the skill tree`);
  for (const fragment of fragments) {
    assert(
      node.description.includes(fragment),
      `${id}: mechanic copy is missing "${fragment}"`,
    );
  }
  for (const fragment of retiredFragments) {
    assert(!node.description.includes(fragment), `${id}: mechanic copy still says "${fragment}"`);
  }
}

console.log("skillTreeMechanicCopy: ok");
