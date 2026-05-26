import { defineBuff, type BuffDescriptor } from '../../../../../combat/buffs/descriptor';
import {
  getTargetChillStacks,
  isTargetFrozen,
  getTargetFrozenRemainingPct,
  getConflagrationRemainingPct,
  isConflagrationActive,
} from './selectors';

export const DOT_T3_BUFFS = [
  defineBuff('dot-vigor', ({ player, targetCs }) => {
    if (player.usesSkills.combatArchetype !== 'dot') return null;
    if ((player.usesSkills.passives['dot.invigorating-toxins'] ?? 0) <= 0) return null;
    if (!targetCs) return null;
    const stacks = player.appliesDots?.targetDotStacks ?? 0;
    return stacks > 0 ? { id: 'dot-vigor', label: 'Vigor', stacks, durationPct: -1, color: '#88ff44' } : null;
  }),
  defineBuff('dot-conflag', ({ player, targetCs }) => {
    if (player.usesSkills.combatArchetype !== 'dot') return null;
    if ((player.usesSkills.passives['dot.conflagration'] ?? 0) <= 0) return null;
    if (!targetCs) return null;
    return isConflagrationActive(targetCs)
      ? { id: 'dot-conflag', label: 'Cflag', stacks: 1, durationPct: getConflagrationRemainingPct(targetCs), color: '#ff6600' }
      : null;
  }),
  defineBuff('dot-chill', ({ player, targetCs }) => {
    if (player.usesSkills.combatArchetype !== 'dot') return null;
    if ((player.usesSkills.passives['dot.freezing-cold'] ?? 0) <= 0) return null;
    if (!targetCs) return null;
    const stacks = getTargetChillStacks(targetCs);
    return stacks > 0 ? { id: 'dot-chill', label: 'Chll', stacks, durationPct: -1, color: '#88ddff' } : null;
  }),
  defineBuff('dot-frozen', ({ player, targetCs }) => {
    if (player.usesSkills.combatArchetype !== 'dot') return null;
    if ((player.usesSkills.passives['dot.freezing-cold'] ?? 0) <= 0) return null;
    if (!targetCs) return null;
    return isTargetFrozen(targetCs)
      ? { id: 'dot-frozen', label: 'Frzn', stacks: 1, durationPct: getTargetFrozenRemainingPct(targetCs), color: '#ffffff' }
      : null;
  }),
] as const satisfies readonly BuffDescriptor[];
