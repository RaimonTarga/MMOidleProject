import { defineBuff, type BuffDescriptor } from '../../combat/buffs/descriptor';
import {
  getDefenseAbsorbPool,
  getDefenseBurstPool,
  getDefenseDebtPool,
} from './pools';

export const DEFENSE_BUFFS = [
  defineBuff('defense-absorb', ({ playerCs }) => {
    if (!playerCs) return null;
    return getDefenseAbsorbPool(playerCs) > 0
      ? { id: 'defense-absorb', label: 'Absrb', stacks: 1, durationPct: -1, color: '#ff88aa' }
      : null;
  }),
  defineBuff('defense-burst', ({ playerCs }) => {
    if (!playerCs) return null;
    return getDefenseBurstPool(playerCs) > 0
      ? { id: 'defense-burst', label: 'Regen', stacks: 1, durationPct: -1, color: '#aaffaa' }
      : null;
  }),
  defineBuff('defense-debt', ({ playerCs }) => {
    if (!playerCs) return null;
    return getDefenseDebtPool(playerCs) > 0
      ? { id: 'defense-debt', label: 'Debt', stacks: 1, durationPct: -1, color: '#ff4444' }
      : null;
  }),
] as const satisfies readonly BuffDescriptor[];
