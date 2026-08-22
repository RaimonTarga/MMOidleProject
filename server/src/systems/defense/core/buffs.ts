import { getCooldown } from '@mmo-idle/shared';
import { defineBuff, type BuffDescriptor } from '../../combat/buffs/descriptor';
import {
  getCheatDeathHealPool,
  getDefenseAbsorbPool,
  getDefenseBurstPool,
  getDefenseDebtPool,
  BURST_DRAIN_MS,
  BURST_DRAIN_CD,
} from './pools';
import { getHardeningBonus, getHardeningMaxDrBonus } from '../mitigation/hardening';
import { getStationaryDrBonus } from '../mitigation/stationaryDr';
import { getSustainedFightDrBonus } from '../mitigation/sustainedFightDr';
import { getReactivePlatingBonus } from '../mitigation/reactivePlating';

const NEUTRAL_OPTS = { category: 'neutral' as const, shape: 'square' as const };

export const DEFENSE_BUFFS = [
  // The barrier is a standing pool, so its tile shows how full it is rather than a
  // sweep. `durationPct` doubles as the fill percentage; -1 while it is recharging
  // would hide the very state the player wants to watch.
  defineBuff('defense-barrier', ({ player }) => {
    if (!player?.hasBarrier || player.hasBarrier.max <= 0) return null;
    const { current, max, recharging } = player.hasBarrier;
    if (current <= 0 && !recharging) return null;
    return {
      id: 'defense-barrier',
      label: recharging ? 'Recharge' : 'Barrier',
      stacks: Math.round(current),
      durationPct: (current / max) * 100,
      color: recharging ? '#88ddff' : '#44ccdd',
      logDetail: `${Math.round(current)} of ${Math.round(max)} barrier`
        + (recharging ? ' (recharging)' : ''),
    };
  }, NEUTRAL_OPTS),
  defineBuff('defense-ward', ({ player }) => {
    if (!player?.holdsWards) return null;
    const total = player.holdsWards.wards.reduce((sum, w) => sum + w.amount, 0);
    if (total <= 0) return null;
    // Timed wards report the longest remaining as the sweep; a permanent one (-1)
    // wins and shows no clock.
    const longest = player.holdsWards.wards.reduce(
      (ms, w) => (w.remainingMs === -1 || ms === -1 ? -1 : Math.max(ms, w.remainingMs)),
      0,
    );
    const maxTotal = player.holdsWards.wards.reduce((sum, w) => sum + w.maxAmount, 0);
    return {
      id: 'defense-ward',
      label: 'Ward',
      stacks: Math.round(total),
      durationPct: longest === -1 ? -1 : (total / Math.max(1, maxTotal)) * 100,
      color: '#bfe6ff',
      logDetail: `${Math.round(total)} absorb`,
    };
  }, NEUTRAL_OPTS),
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
    if (pool <= 0) return null;
    const drainLeft = getCooldown(playerCs, BURST_DRAIN_CD);
    return {
      id: 'defense-burst',
      label: 'Regen',
      stacks: 1,
      durationPct: drainLeft > 0 ? (drainLeft / BURST_DRAIN_MS) * 100 : -1,
      color: '#aaffaa',
      logDetail: `${Math.round(pool)} healing pool`,
    };
  }, NEUTRAL_OPTS),
  defineBuff('defense-revive-heal', ({ playerCs }) => {
    if (!playerCs) return null;
    const pool = getCheatDeathHealPool(playerCs);
    return pool > 0
      ? { id: 'defense-revive-heal', label: 'Reviv', stacks: 1, durationPct: -1, color: '#aaffcc', logDetail: `${Math.round(pool)} recovery pool` }
      : null;
  }, NEUTRAL_OPTS),
  defineBuff('defense-debt', ({ playerCs }) => {
    if (!playerCs) return null;
    const pool = getDefenseDebtPool(playerCs);
    return pool > 0
      ? { id: 'defense-debt', label: 'Debt', stacks: 1, durationPct: -1, color: '#ff4444', logDetail: `${Math.round(pool)} deferred damage` }
      : null;
  }, NEUTRAL_OPTS),
  defineBuff('defense-stationary-dr', ({ player }) => {
    if (!player) return null;
    const bonus = getStationaryDrBonus(player);
    return bonus > 0
      ? { id: 'defense-stationary-dr', label: 'Frost', stacks: Math.round(bonus * 100), durationPct: -1, color: '#88ccff', logDetail: `+${Math.round(bonus * 100)}% damage reduction (stationary)` }
      : null;
  }, NEUTRAL_OPTS),
  defineBuff('defense-sustained-dr', ({ player }) => {
    if (!player) return null;
    const bonus = getSustainedFightDrBonus(player);
    return bonus > 0
      ? { id: 'defense-sustained-dr', label: 'Endure', stacks: Math.round(bonus * 100), durationPct: -1, color: '#7faaff', logDetail: `+${Math.round(bonus * 100)}% damage reduction (sustained fight)` }
      : null;
  }, NEUTRAL_OPTS),
  defineBuff('defense-hardening-maxdr', ({ player }) => {
    if (!player) return null;
    const bonus = getHardeningMaxDrBonus(player);
    return bonus > 0
      ? { id: 'defense-hardening-maxdr', label: 'Temper', stacks: Math.round(bonus * 100), durationPct: -1, color: '#ffaa66', logDetail: `+${Math.round(bonus * 100)}% damage reduction (max hardening)` }
      : null;
  }, NEUTRAL_OPTS),
  defineBuff('defense-reactive-plating', ({ player }) => {
    if (!player) return null;
    const bonus = getReactivePlatingBonus(player);
    return bonus > 0
      ? { id: 'defense-reactive-plating', label: 'Crust', stacks: bonus, durationPct: -1, color: '#c9a24a', logDetail: `+${bonus} plating (reactive)` }
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
