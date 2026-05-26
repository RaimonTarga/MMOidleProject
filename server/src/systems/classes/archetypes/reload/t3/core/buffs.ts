import { defineBuff, type BuffDescriptor } from '../../../../../combat/buffs/descriptor';
import { getSnipeReady } from './selectors';

export const RELOAD_T3_BUFFS = [
  defineBuff('reload-snipe-ready', ({ player, world }) => {
    if (player.usesSkills.combatArchetype !== 'reload') return null;
    return getSnipeReady(player, world)
      ? { id: 'reload-snipe-ready', label: 'Snipe', stacks: 1, durationPct: -1, color: '#ffcc88' }
      : null;
  }, { category: 'neutral', shape: 'square' }),
] as const satisfies readonly BuffDescriptor[];
