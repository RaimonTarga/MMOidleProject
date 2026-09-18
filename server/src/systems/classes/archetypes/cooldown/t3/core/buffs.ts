import { defineBuff, type BuffDescriptor } from '../../../../../combat/buffs/descriptor';
import {
  getOverdrivePct,
  getRupturePct,
  getEternalChargeStacks,
  batteryDamagePerStack,
  eternalCycleFlatPerStack,
  getTemporalExtPct,
  getBatteryStacks,
  getVengeanceDamage,
  getVengeanceBonus,
  getAlignmentPct,
  getChannelingRemainingPct,
  rampFactorFor,
  patienceAttackMax,
  patienceExecutionMax,
} from './selectors';
import {
  ALIGNMENT_SPEED_FACTOR,
  OVERDRIVE_ATTACK_SPEED_PCT,
  RUPTURE_WINDOW_PLATING_MULT,
  RUPTURE_DR_PIERCE,
  TEMPORAL_FLAT_DMG,
  BEAM_TICK_MS,
} from './constants';
import { playerMechanicBuffMagnitude } from '../../../../shared/applyPlayerMechanicBuff';

const COOLDOWN_OPTS = { category: 'cooldown' as const, shape: 'square' as const };

export const COOLDOWN_T3_BUFFS = [
  // Stalwart's Patience ramp was the ONE tier-4 path buff with no chip of its
  // own, so the only readout was the damage it silently produced. `durationPct`
  // carries the 0-100 ramp fill rather than a countdown: this is a bar filling
  // up, not a timer running out.
  defineBuff('cooldown-patience', ({ player }) => {
    if ((player.usesSkills.passives['cooldown.patience-paid'] ?? 0) <= 0) return null;
    const cd = player.usesCooldown;
    if (!cd) return null;
    const ramp = rampFactorFor(cd, player);
    if (ramp <= 0) return null;
    const atkPct = Math.round(ramp * patienceAttackMax(player) * 100);
    const exePct = Math.round(ramp * patienceExecutionMax(player) * 100);
    return {
      id: 'cooldown-patience',
      label: 'Patience',
      stacks: 1,
      durationPct: Math.round(ramp * 100),
      color: '#c8d8f0',
      logDetail: `+${atkPct}% attack damage, +${exePct}% execution damage`,
      values: [
        { label: 'Attack damage', value: `+${atkPct}%`, good: true },
        { label: 'Execution damage', value: `+${exePct}%`, good: true },
      ],
    };
  }, COOLDOWN_OPTS),
  defineBuff('cooldown-overdrive', ({ player }) => {
    const pct = getOverdrivePct(player);
    const attackSpeedPct = Math.round(Math.max(0, playerMechanicBuffMagnitude(
      player,
      'cooldown-overdrive',
      'attackSpeedPct',
      player.usesSkills.passives['cooldown.overdrive-attack-speed-pct'] ?? OVERDRIVE_ATTACK_SPEED_PCT,
    )) * 100);
    return pct > 0
      ? { id: 'cooldown-overdrive', label: 'Burst', stacks: 1, durationPct: pct, color: '#ff6622', logDetail: `+${attackSpeedPct}% attack speed`, values: [{ label: 'Attack speed', value: `+${attackSpeedPct}%`, good: true }] }
      : null;
  }, COOLDOWN_OPTS),
  defineBuff('cooldown-eternal-charge', ({ player, playerCs }) => {
    if (!playerCs) return null;
    const stacks = getEternalChargeStacks(playerCs);
    return stacks > 0
      ? { id: 'cooldown-eternal-charge', label: 'Chrge', stacks, durationPct: -1, color: '#ffaa00', logDetail: `+${stacks * eternalCycleFlatPerStack(player)} execution damage banked`, values: [{ label: 'Execution damage banked', value: `+${stacks * eternalCycleFlatPerStack(player)}`, good: true }] }
      : null;
  }, COOLDOWN_OPTS),
  defineBuff('cooldown-temporal-ext', ({ playerCs }) => {
    if (!playerCs) return null;
    const pct = getTemporalExtPct(playerCs);
    return pct > 0
      ? { id: 'cooldown-temporal-ext', label: 'Xtend', stacks: 1, durationPct: pct, color: '#44ddff', logDetail: `+${TEMPORAL_FLAT_DMG} on-hit damage`, values: [{ label: 'On-hit damage', value: `+${TEMPORAL_FLAT_DMG}`, good: true }] }
      : null;
  }, COOLDOWN_OPTS),
  defineBuff('cooldown-battery', ({ player, playerCs }) => {
    if (!playerCs) return null;
    const stacks = getBatteryStacks(playerCs);
    return stacks > 0
      ? { id: 'cooldown-battery', label: 'Batry', stacks, durationPct: -1, color: '#aaffaa', logDetail: `+${stacks * batteryDamagePerStack(player)} attack and execution damage`, values: [{ label: 'Attack and execution damage', value: `+${stacks * batteryDamagePerStack(player)}`, good: true }] }
      : null;
  }, COOLDOWN_OPTS),
  defineBuff('cooldown-vengeance', ({ player }) => {
    const stacks = getVengeanceDamage(player);
    if (stacks <= 0) return null;
    // Stack badge doubles as the raw damage banked since the last execution.
    return { id: 'cooldown-vengeance', label: 'Revenge', stacks, durationPct: -1, color: '#d42a2a', logDetail: `next execution +${getVengeanceBonus(player)} damage`, values: [{ label: 'Next execution', value: `+${getVengeanceBonus(player)} damage`, good: true }] };
  }, COOLDOWN_OPTS),
  defineBuff('cooldown-alignment', ({ player }) => {
    const pct = getAlignmentPct(player);
    const attackSpeedPct = Math.round((1 / ALIGNMENT_SPEED_FACTOR - 1) * 100);
    return pct > 0
      ? { id: 'cooldown-alignment', label: 'Algn', stacks: 1, durationPct: pct, color: '#cc44ff', logDetail: `+${attackSpeedPct}% attack speed`, values: [{ label: 'Attack speed', value: `+${attackSpeedPct}%`, good: true }] }
      : null;
  }, COOLDOWN_OPTS),
  defineBuff('cooldown-reverb', ({ player }) => {
    const stored = player.usesCooldown?.reverbStoredBonus ?? 0;
    if (stored <= 0) return null;
    const pct = Math.round(stored * 100);
    // Stack badge doubles as the locked-in bonus % for the next execution.
    return { id: 'cooldown-reverb', label: 'Reverb', stacks: pct, durationPct: -1, color: '#9b6bff', logDetail: `next execution +${pct}% damage`, values: [{ label: 'Next execution', value: `+${pct}% damage`, good: true }] };
  }, COOLDOWN_OPTS),
  defineBuff('cooldown-rupture', ({ player }) => {
    const pct = getRupturePct(player);
    const platingMult = player.usesSkills.passives['cooldown.rupture-window-plating-mult'] ?? RUPTURE_WINDOW_PLATING_MULT;
    const platingBypass = Math.round((1 - platingMult) * 100);
    const drPierce = Math.round((player.usesSkills.passives['cooldown.rupture-dr-pierce'] ?? RUPTURE_DR_PIERCE) * 100);
    return pct > 0
      ? { id: 'cooldown-rupture', label: 'Sunder', stacks: 1, durationPct: pct, color: '#dd8844', logDetail: `regular attacks bypass ${platingBypass}% plating, ${drPierce}% DR`, values: [{ label: 'Plating bypassed', value: `${platingBypass}%`, good: true }, { label: 'Damage reduction pierced', value: `${drPierce}%`, good: true }] }
      : null;
  }, COOLDOWN_OPTS),
  defineBuff('cooldown-channel', ({ player }) => {
    if (!player.isChanneling) return null;
    const tickSec = (player.usesSkills.passives['cooldown.beam-tick-ms'] ?? BEAM_TICK_MS) / 1000;
    return { id: 'cooldown-channel', label: 'Beam', stacks: 1, durationPct: getChannelingRemainingPct(player), color: '#ffe066', logDetail: `holy beam: a hit every ${tickSec}s, each applies on-hit`, values: [{ label: 'Strikes every', value: `${tickSec}s`, good: true }] };
  }, COOLDOWN_OPTS),
] as const satisfies readonly BuffDescriptor[];
