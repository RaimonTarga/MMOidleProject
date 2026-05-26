import { defineBuff, type BuffDescriptor } from '../../../../../combat/buffs/descriptor';
import {
  getOverdrivePct,
  getEternalChargeStacks,
  getTemporalExtPct,
  getBatteryStacks,
  getAlignmentPct,
  getChannelingRemainingPct,
} from './selectors';

const COOLDOWN_OPTS = { category: 'cooldown' as const, shape: 'square' as const };

export const COOLDOWN_T3_BUFFS = [
  defineBuff('cooldown-overdrive', ({ player }) => {
    const pct = getOverdrivePct(player);
    return pct > 0 ? { id: 'cooldown-overdrive', label: 'Ovrdv', stacks: 1, durationPct: pct, color: '#ff6622' } : null;
  }, COOLDOWN_OPTS),
  defineBuff('cooldown-eternal-charge', ({ playerCs }) => {
    if (!playerCs) return null;
    const stacks = getEternalChargeStacks(playerCs);
    return stacks > 0 ? { id: 'cooldown-eternal-charge', label: 'Chrge', stacks, durationPct: -1, color: '#ffaa00' } : null;
  }, COOLDOWN_OPTS),
  defineBuff('cooldown-temporal-ext', ({ playerCs }) => {
    if (!playerCs) return null;
    const pct = getTemporalExtPct(playerCs);
    return pct > 0 ? { id: 'cooldown-temporal-ext', label: 'Xtend', stacks: 1, durationPct: pct, color: '#44ddff' } : null;
  }, COOLDOWN_OPTS),
  defineBuff('cooldown-battery', ({ playerCs }) => {
    if (!playerCs) return null;
    const stacks = getBatteryStacks(playerCs);
    return stacks > 0 ? { id: 'cooldown-battery', label: 'Batry', stacks, durationPct: -1, color: '#aaffaa' } : null;
  }, COOLDOWN_OPTS),
  defineBuff('cooldown-alignment', ({ player }) => {
    const pct = getAlignmentPct(player);
    return pct > 0 ? { id: 'cooldown-alignment', label: 'Algn', stacks: 1, durationPct: pct, color: '#cc44ff' } : null;
  }, COOLDOWN_OPTS),
  defineBuff('cooldown-channel', ({ player }) => {
    if (!player.isChanneling) return null;
    return { id: 'cooldown-channel', label: 'Beam', stacks: 1, durationPct: getChannelingRemainingPct(player), color: '#ff44aa' };
  }, COOLDOWN_OPTS),
] as const satisfies readonly BuffDescriptor[];
