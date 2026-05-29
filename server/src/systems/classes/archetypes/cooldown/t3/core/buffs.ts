import { defineBuff, type BuffDescriptor } from '../../../../../combat/buffs/descriptor';
import {
  getOverdrivePct,
  getEternalChargeStacks,
  getTemporalExtPct,
  getBatteryStacks,
  getAlignmentPct,
  getChannelingRemainingPct,
} from './selectors';
import {
  ALIGNMENT_SPEED_FACTOR,
  BATTERY_ATK_PER_STACK,
  ETERNAL_FLAT_PER_STACK,
  OVERDRIVE_SPEED_FACTOR,
  TEMPORAL_FLAT_DMG,
} from './constants';

const COOLDOWN_OPTS = { category: 'cooldown' as const, shape: 'square' as const };

export const COOLDOWN_T3_BUFFS = [
  defineBuff('cooldown-overdrive', ({ player }) => {
    const pct = getOverdrivePct(player);
    const attackSpeedPct = Math.round((1 / OVERDRIVE_SPEED_FACTOR - 1) * 100);
    return pct > 0
      ? { id: 'cooldown-overdrive', label: 'Ovrdv', stacks: 1, durationPct: pct, color: '#ff6622', logDetail: `+${attackSpeedPct}% attack speed` }
      : null;
  }, COOLDOWN_OPTS),
  defineBuff('cooldown-eternal-charge', ({ playerCs }) => {
    if (!playerCs) return null;
    const stacks = getEternalChargeStacks(playerCs);
    return stacks > 0
      ? { id: 'cooldown-eternal-charge', label: 'Chrge', stacks, durationPct: -1, color: '#ffaa00', logDetail: `+${stacks * ETERNAL_FLAT_PER_STACK} damage, stored execution charge` }
      : null;
  }, COOLDOWN_OPTS),
  defineBuff('cooldown-temporal-ext', ({ playerCs }) => {
    if (!playerCs) return null;
    const pct = getTemporalExtPct(playerCs);
    return pct > 0
      ? { id: 'cooldown-temporal-ext', label: 'Xtend', stacks: 1, durationPct: pct, color: '#44ddff', logDetail: `+${TEMPORAL_FLAT_DMG} on-hit damage` }
      : null;
  }, COOLDOWN_OPTS),
  defineBuff('cooldown-battery', ({ playerCs }) => {
    if (!playerCs) return null;
    const stacks = getBatteryStacks(playerCs);
    return stacks > 0
      ? { id: 'cooldown-battery', label: 'Batry', stacks, durationPct: -1, color: '#aaffaa', logDetail: `+${stacks * BATTERY_ATK_PER_STACK} execution damage` }
      : null;
  }, COOLDOWN_OPTS),
  defineBuff('cooldown-alignment', ({ player }) => {
    const pct = getAlignmentPct(player);
    const attackSpeedPct = Math.round((1 / ALIGNMENT_SPEED_FACTOR - 1) * 100);
    return pct > 0
      ? { id: 'cooldown-alignment', label: 'Algn', stacks: 1, durationPct: pct, color: '#cc44ff', logDetail: `+${attackSpeedPct}% attack speed` }
      : null;
  }, COOLDOWN_OPTS),
  defineBuff('cooldown-channel', ({ player }) => {
    if (!player.isChanneling) return null;
    return { id: 'cooldown-channel', label: 'Beam', stacks: 1, durationPct: getChannelingRemainingPct(player), color: '#ff44aa', logDetail: '100% attack damage every 500ms' };
  }, COOLDOWN_OPTS),
] as const satisfies readonly BuffDescriptor[];
