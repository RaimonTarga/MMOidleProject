import { getStatusEffect } from '@mmo-idle/shared';
import { defineBuff } from '../../../combat/buffs/descriptor';
import { SQUIRE_GUARD_EFFECT_ID } from './squire';

/** The Squire's brace on the buff bar, while it waits for the blow (class-first build plan CQ.2). */
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
];
