import { defineBuff, type BuffDescriptor } from '../../../../../combat/buffs/descriptor';
import { getSnipeReady } from './selectors';
import { DEFAULT_SNIPE_FULL_HP_MULT } from './constants';

export const RELOAD_T3_BUFFS = [
  defineBuff('reload-snipe-ready', ({ player, world }) => {
    if (player.usesSkills.combatArchetype !== 'reload') return null;
    const fullHpMult = player.usesSkills.passives['reload.snipe-fullhp-mult'] ?? DEFAULT_SNIPE_FULL_HP_MULT;
    return getSnipeReady(player, world)
      ? { id: 'reload-snipe-ready', label: 'Snipe', stacks: 1, durationPct: -1, color: '#ffcc88', logDetail: `${fullHpMult}x damage vs full HP targets` }
      : null;
  }, { category: 'neutral', shape: 'square' }),
] as const satisfies readonly BuffDescriptor[];
