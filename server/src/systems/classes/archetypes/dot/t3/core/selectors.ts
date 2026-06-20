import {
  getStatusEffect, hasStatusEffect, getTotalStacks,
  type TracksCombat,
} from '@mmo-idle/shared';
import type { World } from '../../../../../../world/World';
import {
  SMOLDER_EFFECT, FROZEN_EFFECT, CHILL_EFFECT, CONF_EFFECT_ID, FROSTBITE_EFFECT,
  SE_VULN_PER_STACK, FREEZE_BONUS, FREEZE_MS, CONF_TICKS, FROSTBITE_DOT_TAKEN_PER_STACK,
  FROSTBITE_MS,
} from './constants';
import { CHILL_ATK_MULT, CHILL_SPEED_MULT } from '../paths/_constants';

// ── Exported selectors used by dotPrototype.ts and combat / ai ───────────────

/** Damage multiplier from Smoldering Ember debuff (1.0 if not present). */
export function getSmolderMult(monsterState: TracksCombat): number {
  const s = getStatusEffect(monsterState, SMOLDER_EFFECT);
  return s ? (1 + s.stacks * SE_VULN_PER_STACK) : 1;
}

/** Damage multiplier from Frozen status (1.35 if frozen, 1.0 otherwise). */
export function getFrozenMult(monsterState: TracksCombat): number {
  const frozen = getStatusEffect(monsterState, FROZEN_EFFECT);
  return frozen ? (1 + (frozen.data.damageTakenPct ?? FREEZE_BONUS)) : 1;
}

/** DoT-only damage multiplier from Wind Spirit's Frostbite debuff. */
export function getFrostbiteDotTakenMult(monsterState: TracksCombat): number {
  const s = getStatusEffect(monsterState, FROSTBITE_EFFECT);
  const perStack = s?.data.dotTakenPerStack ?? FROSTBITE_DOT_TAKEN_PER_STACK;
  return s ? (1 + s.stacks * perStack) : 1;
}

export function isMonsterFrozen(world: World, monsterId: string): boolean {
  const monsterState = world.getMonsterEntity(monsterId)?.tracksCombat;
  return monsterState ? hasStatusEffect(monsterState, FROZEN_EFFECT) : false;
}

// ── buffSync helpers (target-side queries) ───────────────────────────────────

export function getTargetChillStacks(monsterState: TracksCombat): number {
  return getTotalStacks(monsterState, CHILL_EFFECT);
}

export function getTargetFrostbiteStacks(monsterState: TracksCombat): number {
  return getTotalStacks(monsterState, FROSTBITE_EFFECT);
}

export function isTargetFrozen(monsterState: TracksCombat): boolean {
  return hasStatusEffect(monsterState, FROZEN_EFFECT);
}

export function getTargetFrozenRemainingPct(monsterState: TracksCombat): number {
  const e = getStatusEffect(monsterState, FROZEN_EFFECT);
  if (!e || e.remainingMs <= 0) return 0;
  return Math.round((e.remainingMs / (e.data.totalMs ?? FREEZE_MS)) * 100);
}

export function getTargetChillMoveSlowPerStack(monsterState: TracksCombat): number {
  return getStatusEffect(monsterState, CHILL_EFFECT)?.data.moveSlowPerStack ?? CHILL_SPEED_MULT;
}

export function getTargetChillAttackSlowPerStack(monsterState: TracksCombat): number {
  return getStatusEffect(monsterState, CHILL_EFFECT)?.data.attackSlowPerStack ?? CHILL_ATK_MULT;
}

export function getTargetFrozenDamageTakenPct(monsterState: TracksCombat): number {
  return getStatusEffect(monsterState, FROZEN_EFFECT)?.data.damageTakenPct ?? FREEZE_BONUS;
}

export function getTargetFrostbiteRemainingPct(monsterState: TracksCombat): number {
  const e = getStatusEffect(monsterState, FROSTBITE_EFFECT);
  if (!e || e.remainingMs <= 0) return 0;
  const totalMs = e.data.totalMs ?? FROSTBITE_MS;
  return Math.round((e.remainingMs / totalMs) * 100);
}

export function getTargetFrostbiteDotTakenPerStack(monsterState: TracksCombat): number {
  return getStatusEffect(monsterState, FROSTBITE_EFFECT)?.data.dotTakenPerStack ?? FROSTBITE_DOT_TAKEN_PER_STACK;
}

export function getConflagrationRemainingPct(monsterState: TracksCombat): number {
  const e = getStatusEffect(monsterState, CONF_EFFECT_ID);
  if (!e) return 0;
  const totalTicks = Math.max(1, e.data.totalTicks ?? CONF_TICKS);
  return Math.round((e.data.ticksLeft / totalTicks) * 100);
}

export function isConflagrationActive(monsterState: TracksCombat): boolean {
  return hasStatusEffect(monsterState, CONF_EFFECT_ID);
}
