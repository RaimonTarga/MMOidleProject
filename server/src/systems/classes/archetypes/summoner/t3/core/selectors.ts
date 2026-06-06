import { getStatusEffect, getTotalStacks, hasStatusEffect, type TracksCombat } from '@mmo-idle/shared';
import { BANNER_EFFECT, CORROSION_EFFECT, OVERWHELMED_EFFECT, WET_EFFECT } from './constants';

export function getOverwhelmedAttackerCount(monsterCs: TracksCombat): number {
  return getTotalStacks(monsterCs, OVERWHELMED_EFFECT);
}

export function getCorrosionStacks(monsterCs: TracksCombat): number {
  return getTotalStacks(monsterCs, CORROSION_EFFECT);
}

export function hasWet(monsterCs: TracksCombat): boolean {
  return hasStatusEffect(monsterCs, WET_EFFECT);
}

export function getBannerStacks(playerCs: TracksCombat): number {
  const eff = getStatusEffect(playerCs, BANNER_EFFECT);
  if (!eff) return 0;
  return Math.floor(eff.data.stacks ?? 0);
}

