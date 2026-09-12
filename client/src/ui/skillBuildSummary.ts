import { SKILL_TREE, mergePassives, makePulseAccumulator, finalizePulse, type StatEffects, type PassiveMap } from '@mmo-idle/shared';

/** Tree contributions only. Gear, stances and runtime effects belong to the character sheet. */
export function skillBuildSummary(ids: readonly string[]) {
  const nodes = [...new Set(ids)].flatMap(id => {
    const node = SKILL_TREE.get(id);
    return node ? [node] : [];
  }).sort((a, b) => a.tier - b.tier);
  const statEffects: StatEffects = {};
  const mechanicEffects: PassiveMap = {};
  const pulses = makePulseAccumulator();
  for (const node of nodes) {
    for (const [key, value] of Object.entries(node.statEffects)) {
      const stat = key as keyof StatEffects;
      statEffects[stat] = (statEffects[stat] ?? 0) + value;
    }
    mergePassives(mechanicEffects, node.mechanicEffects, pulses);
  }
  finalizePulse(pulses, mechanicEffects);
  return { nodes, statEffects, mechanicEffects };
}
