import {
  applyStatusEffect,
  hasStatusEffect,
  removeStatusEffect,
  type StatusEffect,
  type TracksCombat,
} from '@mmo-idle/shared';
import type { PlayerEntity } from '../../../../../../ecs/entity';
import {
  BANNER_EFFECT,
  DEBUFF_IMMUNE_EFFECT,
  TRAMPLE_BOON_EFFECT,
} from './constants';

const KEEP_DURING_CLEANSE = new Set([
  BANNER_EFFECT,
  TRAMPLE_BOON_EFFECT,
  DEBUFF_IMMUNE_EFFECT,
]);

function isDebuffEffect(effect: StatusEffect): boolean {
  if (KEEP_DURING_CLEANSE.has(effect.id)) return false;
  if (effect.id === 'slow') return true;
  if (effect.data['damagePerStack'] !== undefined) return true;
  if (effect.data['isDot'] === 1) return true;
  return false;
}

export function canApplyPlayerDebuff(player: PlayerEntity): boolean {
  if (!player.tracksCombat) return true;
  return !hasStatusEffect(player.tracksCombat, DEBUFF_IMMUNE_EFFECT);
}

export function cleanseAllyDebuffs(cs: TracksCombat): void {
  for (const effect of [...cs.statusEffects]) {
    if (!isDebuffEffect(effect)) continue;
    removeStatusEffect(cs, effect.id);
  }
}

export function grantDebuffImmunity(
  cs: TracksCombat,
  ms: number,
  sourceId: string,
): void {
  applyStatusEffect(cs, {
    id:           DEBUFF_IMMUNE_EFFECT,
    maxStacks:    1,
    remainingMs:  ms,
    refreshable:  true,
    sourceId,
    data:         { totalMs: ms },
  });
}
