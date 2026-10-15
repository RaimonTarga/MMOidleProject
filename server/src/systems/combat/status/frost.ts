/** Shared chill/freeze control readers, independent of the retired Apprentice paths. */
import { FROZEN_STATUS_ID, CHILL_STATUS_ID, hasStatusEffect } from '@mmo-idle/shared';
import type { World } from '../../../world/World';

export const CHILL_EFFECT = CHILL_STATUS_ID;
export const FROZEN_EFFECT = FROZEN_STATUS_ID;
export const CHILL_SPEED_MULT = 0.05;
export const CHILL_ATK_MULT = 0.05;
export const FREEZE_SPEED_MULT = 0.80;
export const FREEZE_ATK_MULT = 2.0;

export function isMonsterFrozen(world: World, monsterId: string): boolean {
  const state = world.getMonsterEntity(monsterId)?.tracksCombat;
  return state ? hasStatusEffect(state, FROZEN_EFFECT) : false;
}
