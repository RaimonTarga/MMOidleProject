import { SKILL_TREE } from "@mmo-idle/shared";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

// Root/frame tooltips are the player-facing contract for class mechanics. Keep
// the authored values in the copy so a balance change cannot silently leave
// the most important mechanic invisible in the tree.
const requiredFragments: Record<string, string[]> = {
  "cadence-root": ["Class mechanic", "20% of your Recovery", "25% of max HP"],
  "cooldown-root": ["Class mechanic", "7s reference cycle", "10% of your Recovery"],
  "reload-root": ["Class mechanics", "65% effectiveness", "20% extra damage mitigation", "×2.5"],
  "energy-root": ["Class mechanic", "30% of your max HP"],
  "dot-root": ["Class mechanics", "18% DoT resistance", "10% of incoming direct hits"],
  "summoner-root": ["maximum formation: 4", "before relic expansion"],

  "summoner-light": ["maximum summons before relic expansion: 6", "(+2 from Conduit's 4)", "66% total summon-HP budget", "×1.20"],
  "summoner-balanced": ["maximum summons before relic expansion: 5", "(+1 from Conduit's 4)", "100% total summon-HP budget"],
  "summoner-heavy": ["maximum summons before relic expansion: 2", "(−2 from Conduit's 4)", "140% total summon-HP budget"],

  "cadence-light": ["Cadence change", "4-hit finisher cycle", "×1.5 empowered damage"],
  "cadence-balanced": ["Cadence change", "5-hit finisher cycle", "×2 empowered damage"],
  "cadence-heavy": ["Cadence change", "6-hit finisher cycle", "×4 empowered damage"],

  "cooldown-light": ["Execution change", "5s recharge", "×1.5 damage"],
  "cooldown-balanced": ["Execution change", "7s recharge", "×2 damage"],
  "cooldown-heavy": ["Execution change", "8s recharge", "×3.5 damage"],

  "dot-light": ["DoT change", "8 poison stacks", "30% of your attack", "every 1s for 5s", "×1.25 DoT output"],
  "dot-balanced": ["DoT change", "6 burn stacks", "50% of your attack", "every 1.5s for 5.5s", "×1.20 DoT output"],
  "dot-heavy": ["DoT change", "3 frost stacks", "70% of your attack", "every 2s for 6.5s", "×1.15 DoT output"],

  "reload-light": ["Reload change", "5-round clip", "1.2s reload"],
  "reload-balanced": ["Reload change", "10-round clip", "2.0s reload"],
  "reload-heavy": ["Reload change", "20-round clip", "3.0s reload"],

  "energy-light": ["Energy change", "20 energy per hit", "×1.5 damage"],
  "energy-balanced": ["Energy change", "14 energy per hit", "×2 damage"],
  "energy-heavy": ["Energy change", "10 energy per hit", "×6 damage"],
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
