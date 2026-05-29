import { defineBuff, type BuffDescriptor } from '../../../../../combat/buffs/descriptor';
import { CADENCE_SPEED_PER_STACK_MS, MOMENTUM_ECHO_BONUS } from './constants';

export const CADENCE_T3_BUFFS = [
  defineBuff(
    'cadence-accelerando',
    ({ player }) => {
      const stacks = player.usesCadence?.speedStacks ?? 0;
      return stacks > 0
        ? {
            id: 'cadence-accelerando',
            label: 'Accel',
            stacks,
            durationPct: -1,
            color: '#00ffaa',
            logDetail: `-${stacks * CADENCE_SPEED_PER_STACK_MS}ms attack cooldown`,
          }
        : null;
    },
    { label: 'Accel', color: '#00ffaa', category: 'cadence', shape: 'square' },
  ),
  defineBuff(
    'cadence-echo',
    ({ player }) => {
      const echo = player.usesCadence?.echo ?? 0;
      return echo > 0
        ? {
            id: 'cadence-echo',
            label: 'Echo',
            stacks: echo,
            durationPct: -1,
            color: '#4488ff',
            logDetail: `next ${echo} hits echo +${Math.round(MOMENTUM_ECHO_BONUS * 100)}% damage`,
          }
        : null;
    },
    { label: 'Echo', color: '#4488ff', category: 'cadence', shape: 'square' },
  ),
] as const satisfies readonly BuffDescriptor[];
