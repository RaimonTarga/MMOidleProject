import { defineBuff, type BuffDescriptor } from '../../../../../combat/buffs/descriptor';
import {
  getOverchargeStacks,
  getACPhaseForPlayer,
  getACDischargeRemainingPct,
  getCapacitorReservoirPct,
  getSMChargePool,
} from './selectors';
import { energyPercent } from './helpers';
import {
  AC_CHARGE_DMG_MULT,
  AC_ENERGY_GAIN_MULT,
  AC_SPEED_FACTOR,
  AC_TICK_DAMAGE_MULT,
  CS_RESERVOIR_MAX,
  CS_RESERVOIR_SCALE,
  HE_DMG_MULT,
  PD_STACK_FLAT_DMG,
} from './constants';

const ENERGY_OPTS = { category: 'energy' as const, shape: 'square' as const };

export const ENERGY_T3_BUFFS = [
  defineBuff('energy-overcharge', ({ player, playerCs }) => {
    if (!playerCs || player.usesSkills.combatArchetype !== 'energy') return null;
    const stacks = getOverchargeStacks(playerCs);
    return stacks > 0
      ? { id: 'energy-overcharge', label: 'Overch', stacks, durationPct: -1, color: '#ff88ff', logDetail: `+${stacks * PD_STACK_FLAT_DMG} discharge damage` }
      : null;
  }, ENERGY_OPTS),
  defineBuff('energy-ac-charge', ({ player }) => {
    if (player.usesSkills.combatArchetype !== 'energy') return null;
    return getACPhaseForPlayer(player) === 'charge'
      ? { id: 'energy-ac-charge', label: 'Chrge', stacks: 1, durationPct: -1, color: '#44ccff', logDetail: `+${Math.round((AC_CHARGE_DMG_MULT - 1) * 100)}% damage, +${Math.round((AC_ENERGY_GAIN_MULT - 1) * 100)}% energy gain` }
      : null;
  }, ENERGY_OPTS),
  defineBuff('energy-ac-discharge', ({ player }) => {
    if (player.usesSkills.combatArchetype !== 'energy') return null;
    if (getACPhaseForPlayer(player) !== 'discharge') return null;
    return { id: 'energy-ac-discharge', label: 'Disch', stacks: 1, durationPct: getACDischargeRemainingPct(player), color: '#ff6622', logDetail: `+${Math.round((1 / AC_SPEED_FACTOR - 1) * 100)}% attack speed, ${Math.round(AC_TICK_DAMAGE_MULT * 100)}% ATK ticks` };
  }, ENERGY_OPTS),
  defineBuff('energy-reservoir', ({ player }) => {
    if (player.usesSkills.combatArchetype !== 'energy') return null;
    const energy = player.usesEnergy;
    if (!energy) return null;
    const pct = getCapacitorReservoirPct(energy);
    const mult = 1 + energy.csReservoir / CS_RESERVOIR_SCALE;
    return pct > 0
      ? { id: 'energy-reservoir', label: 'Resvr', stacks: 1, durationPct: pct, color: '#88ddff', logDetail: `reservoir ${Math.round(energy.csReservoir)} / ${CS_RESERVOIR_MAX}, ${mult.toFixed(2)}x discharge scaling` }
      : null;
  }, ENERGY_OPTS),
  defineBuff('energy-equilibrium', ({ player }) => {
    if (player.usesSkills.combatArchetype !== 'energy') return null;
    if ((player.usesSkills.passives['energy.harmonic-equilibrium'] ?? 0) <= 0) return null;
    const energy = player.usesEnergy;
    if (!energy) return null;
    const pct = energyPercent(energy);
    return pct > 0.40 && pct < 0.60
      ? { id: 'energy-equilibrium', label: 'Equil', stacks: 1, durationPct: -1, color: '#aaffcc', logDetail: `+${Math.round((HE_DMG_MULT - 1) * 100)}% damage` }
      : null;
  }, ENERGY_OPTS),
  defineBuff('energy-sm-pool', ({ player }) => {
    if (player.usesSkills.combatArchetype !== 'energy') return null;
    if ((player.usesSkills.passives['energy.superconducting-mass'] ?? 0) <= 0) return null;
    const energy = player.usesEnergy;
    if (!energy) return null;
    const pool = getSMChargePool(energy);
    return pool > 0
      ? { id: 'energy-sm-pool', label: 'Chrge', stacks: pool, durationPct: -1, color: '#ff4488', logDetail: `${pool} stored true damage` }
      : null;
  }, ENERGY_OPTS),
] as const satisfies readonly BuffDescriptor[];
