import { getStatusEffect } from '@mmo-idle/shared';
import { defineBuff, type BuffDescriptor } from '../../../../../combat/buffs/descriptor';
import { DEBUFF_IMMUNE_EFFECT, TRAMPLE_BOON_EFFECT } from './constants';
import { getBannerStacks } from './selectors';

function durationPctFromEffect(effect: { remainingMs: number; data: Record<string, number> }): number {
  if (effect.remainingMs <= 0) return -1;
  const totalMs = effect.data.totalMs ?? effect.remainingMs;
  if (totalMs <= 0) return -1;
  return Math.round((effect.remainingMs / totalMs) * 100);
}

export const SUMMONER_T3_BUFFS = [
  defineBuff(
    'summoner-howl-banner',
    ({ player }) => {
      if (!player.tracksCombat) return null;
      const stacks = getBannerStacks(player.tracksCombat);
      return stacks > 0
        ? {
            id: 'summoner-howl-banner',
            label: 'Howl',
            stacks,
            durationPct: -1,
            color: '#ff8844',
          }
        : null;
    },
    { label: 'Howl', color: '#ff8844', category: 'summoner', shape: 'square' },
  ),
  defineBuff(
    'summoner-trample-boon',
    ({ player }) => {
      if (!player.tracksCombat) return null;
      const eff = getStatusEffect(player.tracksCombat, TRAMPLE_BOON_EFFECT);
      return eff
        ? {
            id: 'summoner-trample-boon',
            label: 'Trail',
            stacks: 1,
            durationPct: durationPctFromEffect(eff),
            color: '#c8a84a',
          }
        : null;
    },
    { label: 'Trail', color: '#c8a84a', category: 'summoner', shape: 'square' },
  ),
  defineBuff(
    'summoner-debuff-immune',
    ({ player }) => {
      if (!player.tracksCombat) return null;
      const eff = getStatusEffect(player.tracksCombat, DEBUFF_IMMUNE_EFFECT);
      return eff
        ? {
            id: 'summoner-debuff-immune',
            label: 'Immune',
            stacks: 1,
            durationPct: durationPctFromEffect(eff),
            color: '#88ddff',
          }
        : null;
    },
    { label: 'Immune', color: '#88ddff', category: 'summoner', shape: 'diamond' },
  ),
] as const satisfies readonly BuffDescriptor[];
