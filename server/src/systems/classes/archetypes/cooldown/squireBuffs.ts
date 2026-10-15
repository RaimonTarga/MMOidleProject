import { getStatusEffect } from '@mmo-idle/shared';
import { defineBuff } from '../../../combat/buffs/descriptor';
import { ATTACK_HASTE_PCT_KEY } from '../../../combat/engine/attackCadence';
import { SQUIRE_FROSTWARD_EFFECT_ID, SQUIRE_GUARD_EFFECT_ID, SQUIRE_PARRY_EFFECT_ID, SQUIRE_RAMPAGE_EFFECT_ID } from './squire';

/** The Squire's brace on the buff bar, while it waits for the blow (class-first build plan CQ.2); Parry is the Avenger's. */
export const SQUIRE_BUFFS = [
  defineBuff(
    SQUIRE_GUARD_EFFECT_ID,
    ({ player }) => {
      const effect = getStatusEffect(player.tracksCombat, SQUIRE_GUARD_EFFECT_ID);
      if (!effect || effect.remainingMs === 0) return null;
      const totalMs = effect.data['totalMs'] ?? effect.remainingMs;
      const cut = Math.round((effect.data['cut'] ?? 0) * 100);
      return {
        id: SQUIRE_GUARD_EFFECT_ID,
        label: 'Braced',
        stacks: 1,
        durationPct: totalMs > 0 ? (effect.remainingMs / totalMs) * 100 : -1,
        remainingMs: effect.remainingMs,
        color: '#e8a35a',
        logSourceName: 'Guard',
        logDetail: `-${cut}% from the telegraphed blow`,
        values: [{ label: 'Telegraphed blow', value: `-${cut}%`, good: true }],
      };
    },
    { label: 'Braced', color: '#e8a35a', category: 'cooldown', shape: 'circle' },
  ),
  defineBuff(
    SQUIRE_PARRY_EFFECT_ID,
    ({ player }) => {
      const effect = getStatusEffect(player.tracksCombat, SQUIRE_PARRY_EFFECT_ID);
      if (!effect || effect.remainingMs === 0) return null;
      const totalMs = effect.data['totalMs'] ?? effect.remainingMs;
      return {
        id: SQUIRE_PARRY_EFFECT_ID,
        label: 'Parrying',
        stacks: 1,
        durationPct: totalMs > 0 ? (effect.remainingMs / totalMs) * 100 : -1,
        remainingMs: effect.remainingMs,
        color: '#cfd8e3',
        logSourceName: 'Parry',
        logDetail: 'the telegraphed melee blow is negated and countered',
        values: [{ label: 'Telegraphed melee blow', value: 'negated', good: true }],
      };
    },
    { label: 'Parrying', color: '#cfd8e3', category: 'cooldown', shape: 'circle' },
  ),
  // Tier 3: Frostward holds the Chill below the freeze; Rampage is the Juggernaut's burst after a slam.
  defineBuff(
    SQUIRE_FROSTWARD_EFFECT_ID,
    ({ player }) => {
      const effect = getStatusEffect(player.tracksCombat, SQUIRE_FROSTWARD_EFFECT_ID);
      if (!effect || effect.remainingMs === 0) return null;
      const totalMs = effect.data['totalMs'] ?? effect.remainingMs;
      const hold = Math.round(effect.data['holdStacks'] ?? 0);
      return {
        id: SQUIRE_FROSTWARD_EFFECT_ID,
        label: 'Frostward',
        stacks: 1,
        durationPct: totalMs > 0 ? (effect.remainingMs / totalMs) * 100 : -1,
        remainingMs: effect.remainingMs,
        color: '#8fd3f4',
        logSourceName: 'Frostward',
        logDetail: `the Chill is held at ${hold} stacks`,
        values: [{ label: 'Chill held at', value: `${hold} stacks`, good: true }],
      };
    },
    { label: 'Frostward', color: '#8fd3f4', category: 'cooldown', shape: 'circle' },
  ),
  defineBuff(
    SQUIRE_RAMPAGE_EFFECT_ID,
    ({ player }) => {
      const effect = getStatusEffect(player.tracksCombat, SQUIRE_RAMPAGE_EFFECT_ID);
      if (!effect || effect.remainingMs === 0) return null;
      const totalMs = effect.data['totalMs'] ?? effect.remainingMs;
      const haste = Math.round((effect.data[ATTACK_HASTE_PCT_KEY] ?? 0) * 100);
      return {
        id: SQUIRE_RAMPAGE_EFFECT_ID,
        label: 'Rampage',
        stacks: 1,
        durationPct: totalMs > 0 ? (effect.remainingMs / totalMs) * 100 : -1,
        remainingMs: effect.remainingMs,
        color: '#e8693a',
        logSourceName: 'Rampage',
        logDetail: `+${haste}% attack speed after a slam`,
        values: [{ label: 'Attack speed', value: `+${haste}%`, good: true }],
      };
    },
    { label: 'Rampage', color: '#e8693a', category: 'cooldown', shape: 'circle' },
  ),
];
