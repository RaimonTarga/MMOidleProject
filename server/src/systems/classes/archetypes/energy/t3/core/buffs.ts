import { resolveUpkeepConfig, upkeepStacks, upkeepOnHitBonus, UPKEEP_UNLOCK_TIER } from '@mmo-idle/shared';
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
  CHARGE_STATE_MIN,
  CHARGE_STATE_MAX,
} from './constants';
import { playerMechanicBuffMagnitude } from '../../../../shared/applyPlayerMechanicBuff';

const ENERGY_OPTS = { category: 'energy' as const, shape: 'square' as const };

export const ENERGY_T3_BUFFS = [
  defineBuff('energy-overdrive', ({ player }) => {
    if (player.usesSkills.combatArchetype !== 'energy') return null;
    const energy = player.usesEnergy;
    if (!energy || !energy.overdriveActive) return null;
    // Energy decays 100→0 over the Overdrive window, so energy% doubles as the timer.
    const pct = Math.round(energyPercent(energy) * 100);
    const atkPct = Math.round(Math.max(0, playerMechanicBuffMagnitude(
      player,
      'energy-overdrive',
      'attackDamagePct',
      player.usesSkills.passives['energy.overdrive-attack-damage-pct'] ?? ENERGY_OVERDRIVE_ATK_PCT,
    )) * 100);
    return { id: 'energy-overdrive', label: 'Surge', stacks: 1, durationPct: pct, color: '#ffdd33', logDetail: `+${atkPct}% attack damage`, values: [{ label: 'Attack damage', value: `+${atkPct}%`, good: true }] };
  }, ENERGY_OPTS),
  defineBuff('energy-channel', ({ player }) => {
    if (player.usesSkills.combatArchetype !== 'energy') return null;
    if ((player.usesSkills.passives['energy.upkeep'] ?? 0) <= 0) return null;
    const energy = player.usesEnergy;
    if (!energy) return null;
    const upkeep = resolveUpkeepConfig(player.usesSkills.passives);
    const stacks = upkeepStacks(energy, upkeep.stackIntervalMs);
    if (stacks <= 0) return null;
    const tier = player.tracksProgression?.playerTier ?? UPKEEP_UNLOCK_TIER;
    return {
      id: 'energy-channel',
      label: 'Flow',
      stacks,
      durationPct: -1,
      color: '#66ccff',
      logDetail: `+${upkeepOnHitBonus(stacks, tier, upkeep)} on-hit damage (${stacks} stacks)`,
      values: [{ label: 'On-hit damage', value: `+${upkeepOnHitBonus(stacks, tier, upkeep)}`, good: true }],
    };
  }, ENERGY_OPTS),
  defineBuff('energy-binary-charge', ({ player }) => {
    if (player.usesSkills.combatArchetype !== 'energy') return null;
    if ((player.usesSkills.passives['energy.binary-cycle'] ?? 0) <= 0) return null;
    const energy = player.usesEnergy;
    if (!energy || energy.binaryDischargeState) return null; // false = Charge State
    const passives = player.usesSkills.passives;
    const speedFactor = Math.max(0.01, passives['energy.binary-charge-speed-factor'] ?? BINARY_CHARGE_SPEED_FACTOR);
    const gainMult = Math.max(0, passives['energy.binary-charge-gain-mult'] ?? BINARY_CHARGE_GAIN_MULT);
    const onHitBonus = Math.max(0, passives['energy.binary-charge-onhit-bonus'] ?? BINARY_CHARGE_ONHIT_BONUS);
    const onHitPerTier = Math.max(0, passives['energy.binary-charge-onhit-per-tier'] ?? BINARY_CHARGE_ONHIT_PER_TIER);
    const slowAps = Math.round((1 - 1 / speedFactor) * 100);
    const slowGain = Math.round((1 - gainMult) * 100);
    const tierMult = Math.max(1, (player.tracksProgression?.playerTier ?? BINARY_UNLOCK_TIER) - BINARY_UNLOCK_TIER + 1);
    const flat = onHitPerTier * tierMult;
    return {
      id: 'energy-binary-charge', label: 'Charge', stacks: 1, durationPct: -1, color: '#44dd66',
      logDetail: `+${Math.round(onHitBonus * 100)}% + ${flat} flat on-hit, −${slowAps}% attack speed, −${slowGain}% energy gain, weak discharge`,
      values: [
        { label: 'On-hit damage', value: `+${Math.round(onHitBonus * 100)}% and +${flat} flat`, good: true },
        { label: 'Attack speed', value: `-${slowAps}%`, good: false },
        { label: 'Energy gain', value: `-${slowGain}%`, good: false },
        { label: 'Discharge', value: 'weak', good: false },
      ],
    };
  }, ENERGY_OPTS),
  defineBuff('energy-binary-discharge', ({ player }) => {
    if (player.usesSkills.combatArchetype !== 'energy') return null;
    if ((player.usesSkills.passives['energy.binary-cycle'] ?? 0) <= 0) return null;
    const energy = player.usesEnergy;
    if (!energy || !energy.binaryDischargeState) return null; // true = Discharge State
    const passives = player.usesSkills.passives;
    const speedFactor = Math.max(0.01, passives['energy.binary-discharge-speed-factor'] ?? BINARY_DISCHARGE_SPEED_FACTOR);
    const gainMult = Math.max(0, passives['energy.binary-discharge-gain-mult'] ?? BINARY_DISCHARGE_GAIN_MULT);
    const attackBonus = Math.max(0, passives['energy.binary-discharge-attack-bonus'] ?? BINARY_DISCHARGE_ATK_BONUS);
    const fastAps = Math.round((1 / speedFactor - 1) * 100);
    const fastGain = Math.round((gainMult - 1) * 100);
    return {
      id: 'energy-binary-discharge', label: 'Dischg', stacks: 1, durationPct: -1, color: '#dd44cc',
      logDetail: `+${Math.round(attackBonus * 100)}% attack damage, +${fastAps}% attack speed, +${fastGain}% energy gain, strong discharge`,
      values: [
        { label: 'Attack damage', value: `+${Math.round(attackBonus * 100)}%`, good: true },
        { label: 'Attack speed', value: `+${fastAps}%`, good: true },
        { label: 'Energy gain', value: `+${fastGain}%`, good: true },
        { label: 'Discharge', value: 'strong', good: true },
      ],
    };
  }, ENERGY_OPTS),
  defineBuff('energy-aether', ({ player }) => {
    if (player.usesSkills.combatArchetype !== 'energy') return null;
    if ((player.usesSkills.passives['energy.charge-state'] ?? 0) <= 0) return null;
    const energy = player.usesEnergy;
    if (!energy) return null;
    // Energy resets to 0 the tick it fills (discharge arms) — treat ready as full.
    const pct = player.hasEmpoweredAttack !== undefined ? 1 : energyPercent(energy);
    const minMult = Math.max(0, player.usesSkills.passives['energy.charge-state-min-mult'] ?? CHARGE_STATE_MIN);
    const maxMult = Math.max(0, player.usesSkills.passives['energy.charge-state-max-mult'] ?? CHARGE_STATE_MAX);
    const powerPct = Math.round(chargeStateMult(pct, minMult, maxMult) * 100);
    // Stack badge = current power %; durationPct mirrors energy fill so it oscillates.
    return {
      id: 'energy-aether', label: 'Aether', stacks: powerPct, durationPct: Math.round(pct * 100), color: '#ffaa33',
      logDetail: `current power: ${powerPct}% (${Math.round(minMult * 100)}%→${Math.round(maxMult * 100)}% with energy)`,
      values: [
        { label: 'Power', value: `${powerPct}%`, good: true },
        { label: 'Range with energy', value: `${Math.round(minMult * 100)}% – ${Math.round(maxMult * 100)}%` },
      ],
    };
  }, ENERGY_OPTS),
  defineBuff('energy-critical-mass', ({ player }) => {
    if (player.usesSkills.combatArchetype !== 'energy') return null;
    if ((player.usesSkills.passives['energy.critical-mass'] ?? 0) <= 0) return null;
    const stacks = player.usesEnergy?.criticalMassStacks ?? 0;
    if (stacks <= 0) return null;
    const passives = player.usesSkills.passives;
    const damagePerStack = Math.max(0, passives['energy.critical-mass-discharge-per-stack'] ?? CRITICAL_MASS_DMG_PER_STACK);
    const gainPerStack = Math.max(0, passives['energy.critical-mass-gain-per-stack'] ?? CRITICAL_MASS_GAIN_PER_STACK);
    const maxStacks = Math.max(1, Math.round(passives['energy.critical-mass-max-stacks'] ?? CRITICAL_MASS_MAX));
    return {
      id: 'energy-critical-mass', label: 'CritM', stacks, durationPct: -1, color: '#ff5577',
      logDetail: `+${Math.round(stacks * damagePerStack * 100)}% discharge, +${Math.round(stacks * gainPerStack * 100)}% energy gain (${stacks}/${maxStacks})`,
      values: [
        { label: 'Stacks', value: `${stacks} / ${maxStacks}` },
        { label: 'Discharge damage', value: `+${Math.round(stacks * damagePerStack * 100)}%`, good: true },
        { label: 'Energy gain', value: `+${Math.round(stacks * gainPerStack * 100)}%`, good: true },
      ],
    };
  }, ENERGY_OPTS),
  defineBuff('energy-storm', ({ player }) => {
    if (player.usesSkills.combatArchetype !== 'energy') return null;
    if ((player.usesSkills.passives['energy.awakened-lightning'] ?? 0) <= 0) return null;
    const charges = player.usesEnergy?.awakenedCharges ?? 0;
    if (charges <= 0) return null;
    const damageMult = Math.max(0, player.usesSkills.passives['energy.awakened-damage-mult'] ?? AWAKENED_MULT);
    return {
      id: 'energy-storm', label: 'Storm', stacks: charges, durationPct: -1, color: '#8a5cff',
      logDetail: `next ${charges} attacks empowered at ${damageMult}×`,
      values: [
        { label: 'Empowered attacks left', value: String(charges), good: true },
        { label: 'Damage', value: `×${damageMult}`, good: true },
      ],
    };
  }, ENERGY_OPTS),
  defineBuff('energy-overcharge', ({ player, playerCs }) => {
    if (!playerCs || player.usesSkills.combatArchetype !== 'energy') return null;
    const stacks = getOverchargeStacks(playerCs);
    return stacks > 0
      ? { id: 'energy-overcharge', label: 'Overch', stacks, durationPct: -1, color: '#ff88ff', logDetail: `+${stacks * PD_STACK_FLAT_DMG} discharge damage`, values: [{ label: 'Discharge damage', value: `+${stacks * PD_STACK_FLAT_DMG}`, good: true }] }
      : null;
  }, ENERGY_OPTS),
  defineBuff('energy-ac-charge', ({ player }) => {
    if (player.usesSkills.combatArchetype !== 'energy') return null;
    return getACPhaseForPlayer(player) === 'charge'
      ? { id: 'energy-ac-charge', label: 'Chrge', stacks: 1, durationPct: -1, color: '#44ccff', logDetail: `+${Math.round((AC_CHARGE_DMG_MULT - 1) * 100)}% damage, +${Math.round((AC_ENERGY_GAIN_MULT - 1) * 100)}% energy gain`, values: [{ label: 'Damage', value: `+${Math.round((AC_CHARGE_DMG_MULT - 1) * 100)}%`, good: true }, { label: 'Energy gain', value: `+${Math.round((AC_ENERGY_GAIN_MULT - 1) * 100)}%`, good: true }] }
      : null;
  }, ENERGY_OPTS),
  defineBuff('energy-ac-discharge', ({ player }) => {
    if (player.usesSkills.combatArchetype !== 'energy') return null;
    if (getACPhaseForPlayer(player) !== 'discharge') return null;
    return { id: 'energy-ac-discharge', label: 'Disch', stacks: 1, durationPct: getACDischargeRemainingPct(player), color: '#ff6622', logDetail: `+${Math.round((1 / AC_SPEED_FACTOR - 1) * 100)}% attack speed, ${Math.round(AC_TICK_DAMAGE_MULT * 100)}% ATK ticks`, values: [{ label: 'Attack speed', value: `+${Math.round((1 / AC_SPEED_FACTOR - 1) * 100)}%`, good: true }, { label: 'Damage per tick', value: `${Math.round(AC_TICK_DAMAGE_MULT * 100)}% of attack`, good: true }] };
  }, ENERGY_OPTS),
  defineBuff('energy-reservoir', ({ player }) => {
    if (player.usesSkills.combatArchetype !== 'energy') return null;
    const energy = player.usesEnergy;
    if (!energy) return null;
    const pct = getCapacitorReservoirPct(energy);
    const mult = 1 + energy.csReservoir / CS_RESERVOIR_SCALE;
    return pct > 0
      ? { id: 'energy-reservoir', label: 'Resvr', stacks: 1, durationPct: pct, color: '#88ddff', logDetail: `reservoir ${Math.round(energy.csReservoir)} / ${CS_RESERVOIR_MAX}, ${mult.toFixed(2)}x discharge scaling`, values: [{ label: 'Reservoir', value: `${Math.round(energy.csReservoir)} / ${CS_RESERVOIR_MAX}` }, { label: 'Discharge scaling', value: `×${mult.toFixed(2)}`, good: true }] }
      : null;
  }, ENERGY_OPTS),
  defineBuff('energy-equilibrium', ({ player }) => {
    if (player.usesSkills.combatArchetype !== 'energy') return null;
    if ((player.usesSkills.passives['energy.harmonic-equilibrium'] ?? 0) <= 0) return null;
    const energy = player.usesEnergy;
    if (!energy) return null;
    const pct = energyPercent(energy);
    return pct > 0.40 && pct < 0.60
      ? { id: 'energy-equilibrium', label: 'Equil', stacks: 1, durationPct: -1, color: '#aaffcc', logDetail: `+${Math.round((HE_DMG_MULT - 1) * 100)}% damage`, values: [{ label: 'Damage', value: `+${Math.round((HE_DMG_MULT - 1) * 100)}%`, good: true }] }
      : null;
  }, ENERGY_OPTS),
  defineBuff('energy-sm-pool', ({ player }) => {
    if (player.usesSkills.combatArchetype !== 'energy') return null;
    if ((player.usesSkills.passives['energy.superconducting-mass'] ?? 0) <= 0) return null;
    const energy = player.usesEnergy;
    if (!energy) return null;
    const pool = getSMChargePool(energy);
    return pool > 0
      ? { id: 'energy-sm-pool', label: 'Chrge', stacks: pool, durationPct: -1, color: '#ff4488', logDetail: `${pool} stored true damage`, values: [{ label: 'Stored true damage', value: String(pool), good: true }] }
      : null;
  }, ENERGY_OPTS),
] as const satisfies readonly BuffDescriptor[];
