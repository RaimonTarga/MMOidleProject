/**
 * SOURCE-OWNED ENEMY BARRIERS.
 *
 * The absorb machinery already existed — `applyCastedMonsterWard` drains a status
 * effect carrying `monsterWard: 1` / `wardAmount` before HP, and it is a TRUE
 * absorb pool, not flat damage reduction. What it lacked was OWNERSHIP: nothing
 * could raise a barrier, ask how much of it is left, and clear exactly the one it
 * raised without disturbing whatever else the boss had up.
 *
 * That is what an ordered pattern needs. The Stoneplate preparation barrier is a
 * step in a sequence: the sequence raises it, watches it, and must be able to drop
 * precisely its own barrier when the step ends — including when the step ended
 * because the pattern was torn down mid-run.
 *
 * Reusing the ward pool rather than inventing private shield HP is deliberate
 * (§4.6): flat DR is not a substitute for an absorb pool, and a second parallel
 * pool would mean two answers to "did my burst break it?".
 */

import { applyStatusEffect, getStatusEffect, removeStatusEffect } from '@mmo-idle/shared';
import type { MonsterEntity } from '../../../ecs/entity';

/** Effect id for a barrier owned by `sourceId`. One barrier per source. */
export function sourceBarrierEffectId(sourceId: string): string {
  return `barrier:${sourceId}`;
}

/**
 * Raise an absorb barrier owned by `sourceId`, replacing any barrier that source
 * already had. Returns the amount raised.
 *
 * `durationMs` is a SAFETY net, not the design: an owning pattern drops its own
 * barrier on step exit and on teardown. The duration only matters if that owner
 * somehow stops running, and it exists so a stranded barrier cannot be permanent.
 */
export function raiseSourceBarrier(
  monster: MonsterEntity,
  sourceId: string,
  amount: number,
  durationMs: number,
): number {
  const rounded = Math.max(0, Math.round(amount));
  if (rounded <= 0) return 0;
  applyStatusEffect(monster.tracksCombat, {
    id: sourceBarrierEffectId(sourceId),
    maxStacks: 1,
    remainingMs: durationMs,
    refreshable: false,
    sourceId: monster.isMonster.id,
    data: {
      monsterWard: 1,
      wardAmount: rounded,
      wardMaxAmount: rounded,
      totalMs: durationMs,
    },
  });
  return rounded;
}

/**
 * How much of this source's barrier is left, or 0 when it is gone.
 *
 * NOTE the ambiguity this cannot resolve on its own: the drain path REMOVES the
 * effect when it empties, so "0" reads the same as "never raised". Callers that
 * need to distinguish a break from an absence must know they raised it — which an
 * owning pattern always does, since raising it is one of its own steps.
 */
export function sourceBarrierRemaining(monster: MonsterEntity, sourceId: string): number {
  const effect = getStatusEffect(monster.tracksCombat, sourceBarrierEffectId(sourceId));
  if (!effect || effect.remainingMs === 0) return 0;
  return Math.max(0, Math.round(effect.data.wardAmount ?? 0));
}

/** The amount this source's barrier was raised with, or 0 when it is gone. */
export function sourceBarrierMaxAmount(monster: MonsterEntity, sourceId: string): number {
  const effect = getStatusEffect(monster.tracksCombat, sourceBarrierEffectId(sourceId));
  if (!effect) return 0;
  return Math.max(0, Math.round(effect.data.wardMaxAmount ?? 0));
}

/** True while this source still has absorb left. */
export function hasSourceBarrier(monster: MonsterEntity, sourceId: string): boolean {
  return sourceBarrierRemaining(monster, sourceId) > 0;
}

/**
 * Drop exactly this source's barrier, leaving every other ward untouched. Safe to
 * call when there is nothing to drop, so teardown paths can call it blindly.
 */
export function clearSourceBarrier(monster: MonsterEntity, sourceId: string): void {
  removeStatusEffect(monster.tracksCombat, sourceBarrierEffectId(sourceId));
}
