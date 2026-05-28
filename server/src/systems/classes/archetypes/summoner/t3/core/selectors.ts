import { getStatusEffect, getTotalStacks, hasStatusEffect, type TracksCombat } from '@mmo-idle/shared';
import { BANNER_EFFECT, CORROSION_EFFECT, SENTINEL_EFFECT, WEB_EFFECT, WET_EFFECT } from './constants';

export function getWebStacks(monsterCs: TracksCombat): number {
  return getTotalStacks(monsterCs, WEB_EFFECT);
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

export function hasSentinelAegis(playerCs: TracksCombat): boolean {
  return hasStatusEffect(playerCs, SENTINEL_EFFECT);
}
