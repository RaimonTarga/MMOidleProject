import { defineBuff, type BuffDescriptor } from '../../../../../combat/buffs/descriptor';
import {
  getOverchargeStacks,
  getACPhaseForPlayer,
  getACDischargeRemainingPct,
  getCapacitorReservoirPct,
  getSMChargePool,
} from './selectors';
import { energyPercent } from './helpers';

const ENERGY_OPTS = { category: 'energy' as const, shape: 'square' as const };

export const ENERGY_T3_BUFFS = [
  defineBuff('energy-overcharge', ({ player, playerCs }) => {
    if (!playerCs || player.usesSkills.combatArchetype !== 'energy') return null;
    const stacks = getOverchargeStacks(playerCs);
    return stacks > 0 ? { id: 'energy-overcharge', label: 'Overch', stacks, durationPct: -1, color: '#ff88ff' } : null;
  }, ENERGY_OPTS),
  defineBuff('energy-ac-charge', ({ player }) => {
    if (player.usesSkills.combatArchetype !== 'energy') return null;
    return getACPhaseForPlayer(player) === 'charge'
      ? { id: 'energy-ac-charge', label: 'Chrge', stacks: 1, durationPct: -1, color: '#44ccff' }
      : null;
  }, ENERGY_OPTS),
  defineBuff('energy-ac-discharge', ({ player }) => {
    if (player.usesSkills.combatArchetype !== 'energy') return null;
    if (getACPhaseForPlayer(player) !== 'discharge') return null;
    return { id: 'energy-ac-discharge', label: 'Disch', stacks: 1, durationPct: getACDischargeRemainingPct(player), color: '#ff6622' };
  }, ENERGY_OPTS),
  defineBuff('energy-reservoir', ({ player }) => {
    if (player.usesSkills.combatArchetype !== 'energy') return null;
    const energy = player.usesEnergy;
    if (!energy) return null;
    const pct = getCapacitorReservoirPct(energy);
    return pct > 0 ? { id: 'energy-reservoir', label: 'Resvr', stacks: 1, durationPct: pct, color: '#88ddff' } : null;
  }, ENERGY_OPTS),
  defineBuff('energy-equilibrium', ({ player }) => {
    if (player.usesSkills.combatArchetype !== 'energy') return null;
    if ((player.usesSkills.passives['energy.harmonic-equilibrium'] ?? 0) <= 0) return null;
    const energy = player.usesEnergy;
    if (!energy) return null;
    const pct = energyPercent(energy);
    return pct > 0.40 && pct < 0.60
      ? { id: 'energy-equilibrium', label: 'Equil', stacks: 1, durationPct: -1, color: '#aaffcc' }
      : null;
  }, ENERGY_OPTS),
  defineBuff('energy-sm-pool', ({ player }) => {
    if (player.usesSkills.combatArchetype !== 'energy') return null;
    if ((player.usesSkills.passives['energy.superconducting-mass'] ?? 0) <= 0) return null;
    const energy = player.usesEnergy;
    if (!energy) return null;
    const pool = getSMChargePool(energy);
    return pool > 0 ? { id: 'energy-sm-pool', label: 'Chrge', stacks: pool, durationPct: -1, color: '#ff4488' } : null;
  }, ENERGY_OPTS),
] as const satisfies readonly BuffDescriptor[];
