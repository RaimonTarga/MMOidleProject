import { defineBuff, type BuffDescriptor } from '../../combat/buffs/descriptor';
import {
  getDefenseAbsorbPool,
  getDefenseBurstPool,
  getDefenseDebtPool,
} from './pools';
import { getHardeningBonus } from '../mitigation/hardening';

const NEUTRAL_OPTS = { category: 'neutral' as const, shape: 'square' as const };

export const DEFENSE_BUFFS = [
  defineBuff('defense-absorb', ({ playerCs }) => {
    if (!playerCs) return null;
    const pool = getDefenseAbsorbPool(playerCs);
    return pool > 0
      ? { id: 'defense-absorb', label: 'Absrb', stacks: 1, durationPct: -1, color: '#ff88aa', logDetail: `${Math.round(pool)} healing pool` }
      : null;
  }, NEUTRAL_OPTS),
  defineBuff('defense-burst', ({ playerCs }) => {
    if (!playerCs) return null;
    const pool = getDefenseBurstPool(playerCs);
    return pool > 0
      ? { id: 'defense-burst', label: 'Regen', stacks: 1, durationPct: -1, color: '#aaffaa', logDetail: `${Math.round(pool)} healing pool` }
      : null;
  }, NEUTRAL_OPTS),
  defineBuff('defense-debt', ({ playerCs }) => {
    if (!playerCs) return null;
    const pool = getDefenseDebtPool(playerCs);
    return pool > 0
      ? { id: 'defense-debt', label: 'Debt', stacks: 1, durationPct: -1, color: '#ff4444', logDetail: `${Math.round(pool)} deferred damage` }
      : null;
  }, NEUTRAL_OPTS),
  defineBuff('defense-hardening', ({ player }) => {
    if (!player) return null;
    const bonus = getHardeningBonus(player);
    return bonus > 0
      ? { id: 'defense-hardening', label: 'Hard', stacks: bonus, durationPct: -1, color: '#88cc44', logDetail: `+${bonus} plating` }
      : null;
  }, NEUTRAL_OPTS),
] as const satisfies readonly BuffDescriptor[];
