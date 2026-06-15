import { upkeepStacks, upkeepOnHitBonus, UPKEEP_UNLOCK_TIER } from '@mmo-idle/shared';
import { defineBuff, type BuffDescriptor } from '../../../../../combat/buffs/descriptor';
import {
  getOverchargeStacks,
  getACPhaseForPlayer,
  getACDischargeRemainingPct,
  getCapacitorReservoirPct,
  getSMChargePool,
} from './selectors';
import { energyPercent, chargeStateMult } from './helpers';
import {
  AC_CHARGE_DMG_MULT,
  AC_ENERGY_GAIN_MULT,
  AC_SPEED_FACTOR,
  AC_TICK_DAMAGE_MULT,
  AWAKENED_MULT,
  CRITICAL_MASS_DMG_PER_STACK,
  CRITICAL_MASS_GAIN_PER_STACK,
  CRITICAL_MASS_MAX,
  BINARY_CHARGE_ONHIT_BONUS,
  BINARY_CHARGE_ONHIT_PER_TIER,
  BINARY_DISCHARGE_ATK_BONUS,
  BINARY_CHARGE_GAIN_MULT,
  BINARY_DISCHARGE_GAIN_MULT,
  BINARY_CHARGE_SPEED_FACTOR,
  BINARY_DISCHARGE_SPEED_FACTOR,
  BINARY_UNLOCK_TIER,
  CS_RESERVOIR_MAX,
  CS_RESERVOIR_SCALE,
  ENERGY_OVERDRIVE_ATK_PCT,
  HE_DMG_MULT,
  PD_STACK_FLAT_DMG,
} from './constants';

const ENERGY_OPTS = { category: 'energy' as const, shape: 'square' as const };

export const ENERGY_T3_BUFFS = [
  defineBuff('energy-overdrive', ({ player }) => {
    if (player.usesSkills.combatArchetype !== 'energy') return null;
    const energy = player.usesEnergy;
    if (!energy || !energy.overdriveActive) return null;
    // Energy decays 100→0 over the Overdrive window, so energy% doubles as the timer.
    const pct = Math.round(energyPercent(energy) * 100);
    const atkPct = Math.round(ENERGY_OVERDRIVE_ATK_PCT * 100);
    return { id: 'energy-overdrive', label: 'Surge', stacks: 1, durationPct: pct, color: '#ffdd33', logDetail: `+${atkPct}% attack damage` };
  }, ENERGY_OPTS),
  defineBuff('energy-channel', ({ player }) => {
    if (player.usesSkills.combatArchetype !== 'energy') return null;
    if ((player.usesSkills.passives['energy.upkeep'] ?? 0) <= 0) return null;
    const energy = player.usesEnergy;
    if (!energy) return null;
    const stacks = upkeepStacks(energy);
    if (stacks <= 0) return null;
    const tier = player.tracksProgression?.playerTier ?? UPKEEP_UNLOCK_TIER;
    return {
      id: 'energy-channel',
      label: 'Flow',
      stacks,
      durationPct: -1,
      color: '#66ccff',
      logDetail: `+${upkeepOnHitBonus(stacks, tier)} on-hit damage (${stacks} stacks)`,
    };
  }, ENERGY_OPTS),
  defineBuff('energy-binary-charge', ({ player }) => {
    if (player.usesSkills.combatArchetype !== 'energy') return null;
    if ((player.usesSkills.passives['energy.binary-cycle'] ?? 0) <= 0) return null;
    const energy = player.usesEnergy;
    if (!energy || energy.binaryDischargeState) return null; // false = Charge State
    const slowAps = Math.round((1 - 1 / BINARY_CHARGE_SPEED_FACTOR) * 100);
    const slowGain = Math.round((1 - BINARY_CHARGE_GAIN_MULT) * 100);
    const tierMult = Math.max(1, (player.tracksProgression?.playerTier ?? BINARY_UNLOCK_TIER) - BINARY_UNLOCK_TIER + 1);
    const flat = BINARY_CHARGE_ONHIT_PER_TIER * tierMult;
    return {
      id: 'energy-binary-charge', label: 'Charge', stacks: 1, durationPct: -1, color: '#44dd66',
      logDetail: `+${Math.round(BINARY_CHARGE_ONHIT_BONUS * 100)}% + ${flat} flat on-hit, −${slowAps}% attack speed, −${slowGain}% energy gain, weak discharge`,
    };
  }, ENERGY_OPTS),
  defineBuff('energy-binary-discharge', ({ player }) => {
    if (player.usesSkills.combatArchetype !== 'energy') return null;
    if ((player.usesSkills.passives['energy.binary-cycle'] ?? 0) <= 0) return null;
    const energy = player.usesEnergy;
    if (!energy || !energy.binaryDischargeState) return null; // true = Discharge State
    const fastAps = Math.round((1 / BINARY_DISCHARGE_SPEED_FACTOR - 1) * 100);
    const fastGain = Math.round((BINARY_DISCHARGE_GAIN_MULT - 1) * 100);
    return {
      id: 'energy-binary-discharge', label: 'Dischg', stacks: 1, durationPct: -1, color: '#dd44cc',
      logDetail: `+${Math.round(BINARY_DISCHARGE_ATK_BONUS * 100)}% attack damage, +${fastAps}% attack speed, +${fastGain}% energy gain, strong discharge`,
    };
  }, ENERGY_OPTS),
  defineBuff('energy-aether', ({ player }) => {
    if (player.usesSkills.combatArchetype !== 'energy') return null;
    if ((player.usesSkills.passives['energy.charge-state'] ?? 0) <= 0) return null;
    const energy = player.usesEnergy;
    if (!energy) return null;
    // Energy resets to 0 the tick it fills (discharge arms) — treat ready as full.
    const pct = player.hasEmpoweredAttack !== undefined ? 1 : energyPercent(energy);
    const powerPct = Math.round(chargeStateMult(pct) * 100);
    // Stack badge = current power %; durationPct mirrors energy fill so it oscillates.
    return {
      id: 'energy-aether', label: 'Aether', stacks: powerPct, durationPct: Math.round(pct * 100), color: '#ffaa33',
      logDetail: `current power: ${powerPct}% (50%→200% with energy)`,
    };
  }, ENERGY_OPTS),
  defineBuff('energy-critical-mass', ({ player }) => {
    if (player.usesSkills.combatArchetype !== 'energy') return null;
    if ((player.usesSkills.passives['energy.critical-mass'] ?? 0) <= 0) return null;
    const stacks = player.usesEnergy?.criticalMassStacks ?? 0;
    if (stacks <= 0) return null;
    return {
      id: 'energy-critical-mass', label: 'CritM', stacks, durationPct: -1, color: '#ff5577',
      logDetail: `+${Math.round(stacks * CRITICAL_MASS_DMG_PER_STACK * 100)}% discharge, +${Math.round(stacks * CRITICAL_MASS_GAIN_PER_STACK * 100)}% energy gain (${stacks}/${CRITICAL_MASS_MAX})`,
    };
  }, ENERGY_OPTS),
  defineBuff('energy-storm', ({ player }) => {
    if (player.usesSkills.combatArchetype !== 'energy') return null;
    if ((player.usesSkills.passives['energy.awakened-lightning'] ?? 0) <= 0) return null;
    const charges = player.usesEnergy?.awakenedCharges ?? 0;
    if (charges <= 0) return null;
    return {
      id: 'energy-storm', label: 'Storm', stacks: charges, durationPct: -1, color: '#8a5cff',
      logDetail: `next ${charges} attacks empowered at ${AWAKENED_MULT}×`,
    };
  }, ENERGY_OPTS),
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
