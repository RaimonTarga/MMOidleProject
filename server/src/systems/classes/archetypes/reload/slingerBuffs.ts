import { getStatusEffect } from '@mmo-idle/shared';
import { ATTACK_HASTE_PCT_KEY } from '../../../combat/engine/attackCadence';
import { defineBuff } from '../../../combat/buffs/descriptor';
import { ENTRENCHED_EFFECT_ID, FAN_EFFECT_ID } from '../../slinger/t3';

/** The Slinger's two T3 specialization buffs on the buff bar (T3-W2): Fan the Hammer and Entrenched. */
export const SLINGER_BUFFS = [
  defineBuff(
    FAN_EFFECT_ID,
    ({ player }) => {
      const effect = getStatusEffect(player.tracksCombat, FAN_EFFECT_ID);
      if (!effect || effect.remainingMs === 0) return null;
      const totalMs = effect.data['totalMs'] ?? effect.remainingMs;
      const haste = Math.round(effect.data[ATTACK_HASTE_PCT_KEY] ?? 0);
      return {
        id: FAN_EFFECT_ID,
        label: 'Fanning',
        stacks: 1,
        durationPct: totalMs > 0 ? (effect.remainingMs / totalMs) * 100 : -1,
        remainingMs: effect.remainingMs,
        color: '#e8c25a',
        logSourceName: 'Fan the Hammer',
        logDetail: `+${haste}% fire rate until the sixth round`,
        values: [{ label: 'Fire rate', value: `+${haste}%`, good: true }],
      };
    },
    { label: 'Fanning', color: '#e8c25a', category: 'weapon', shape: 'circle' },
  ),
  defineBuff(
    ENTRENCHED_EFFECT_ID,
    ({ player }) => {
      const effect = getStatusEffect(player.tracksCombat, ENTRENCHED_EFFECT_ID);
      if (!effect || effect.remainingMs === 0) return null;
      const haste = Math.round(effect.data[ATTACK_HASTE_PCT_KEY] ?? 0);
      return {
        id: ENTRENCHED_EFFECT_ID,
        label: 'Entrenched',
        stacks: 1,
        durationPct: -1,
        remainingMs: effect.remainingMs,
        color: '#b08a4a',
        logSourceName: 'Entrenched',
        logDetail: `+${haste}% fire rate while you stand still`,
        values: [{ label: 'Fire rate', value: `+${haste}%`, good: true }],
      };
    },
    { label: 'Entrenched', color: '#b08a4a', category: 'weapon', shape: 'circle' },
  ),
];
