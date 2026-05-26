import {
  getStatusEffect, hasStatusEffect, getTotalStacks,
  type TracksCombat,
} from '@mmo-idle/shared';
import type { World } from '../../../../../../world/World';
import {
  SMOLDER_EFFECT, FROZEN_EFFECT, CHILL_EFFECT, CONF_EFFECT_ID,
  SE_VULN_PER_STACK, FREEZE_BONUS, FREEZE_MS, CONF_TICKS,
} from './constants';

// ── Exported selectors used by dotPrototype.ts and combat / ai ───────────────

/** Damage multiplier from Smoldering Ember debuff (1.0 if not present). */
export function getSmolderMult(monsterState: TracksCombat): number {
  const s = getStatusEffect(monsterState, SMOLDER_EFFECT);
  return s ? (1 + s.stacks * SE_VULN_PER_STACK) : 1;
}

/** Damage multiplier from Frozen status (1.35 if frozen, 1.0 otherwise). */
export function getFrozenMult(monsterState: TracksCombat): number {
  return hasStatusEffect(monsterState, FROZEN_EFFECT) ? (1 + FREEZE_BONUS) : 1;
}

export function isMonsterFrozen(world: World, monsterId: string): boolean {
  const monsterState = world.getMonsterEntity(monsterId)?.tracksCombat;
  return monsterState ? hasStatusEffect(monsterState, FROZEN_EFFECT) : false;
}

// ── buffSync helpers (target-side queries) ───────────────────────────────────

export function getTargetChillStacks(monsterState: TracksCombat): number {
  return getTotalStacks(monsterState, CHILL_EFFECT);
}

export function isTargetFrozen(monsterState: TracksCombat): boolean {
  return hasStatusEffect(monsterState, FROZEN_EFFECT);
}

export function getTargetFrozenRemainingPct(monsterState: TracksCombat): number {
  const e = getStatusEffect(monsterState, FROZEN_EFFECT);
  if (!e || e.remainingMs <= 0) return 0;
  return Math.round((e.remainingMs / FREEZE_MS) * 100);
}

export function getConflagrationRemainingPct(monsterState: TracksCombat): number {
  const e = getStatusEffect(monsterState, CONF_EFFECT_ID);
  if (!e) return 0;
  return Math.round((e.data.ticksLeft / CONF_TICKS) * 100);
}

export function isConflagrationActive(monsterState: TracksCombat): boolean {
  return hasStatusEffect(monsterState, CONF_EFFECT_ID);
}
