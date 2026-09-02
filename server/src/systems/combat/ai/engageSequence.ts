import {
  applyStatusEffect,
  CAVE_LOCKDOWN_EFFECT_ID,
  MONSTER_DATABASE,
  getCounter,
  getString,
  pruneStatusEffects,
  setCounter,
  setString,
  type MonsterDefinition,
} from '@mmo-idle/shared';
import type { MonsterEntity, PlayerEntity } from '../../../ecs/entity';
import type { World } from '../../../world/World';
import { syncPlayerControlLockout } from '../status/playerControlLockout';

type EngageStage = 'cast' | 'charge' | 'lock' | 'slam-ready' | 'done';

const SESSION_KEY = 'engageSequenceSession';
const DEADLINE_KEY = 'engageSequenceDeadline';
const STAGE_KEY = 'engageSequenceStage';
const LANDING_MULTIPLIER_KEY = 'engageSequenceLandingMultiplier';

/** Current opener stage, initializing it for a fresh player-aggro session. */
export function engageSequenceStage(
  monster: MonsterEntity,
  def: MonsterDefinition | undefined,
  now: number,
): EngageStage | null {
  const sequence = def?.engageSequence;
  const aggro = monster.hasAggroTarget;
  if (!sequence || !aggro || aggro.targetKind !== 'player') return null;

  const state = monster.tracksCombat;
  if (
    getCounter(state, SESSION_KEY) !== aggro.sinceMs ||
    getString(state, STAGE_KEY) === undefined
  ) {
    setCounter(state, SESSION_KEY, aggro.sinceMs);
    if (sequence.kind === 'cast-charge-root' || sequence.kind === 'cast-charge-strike') {
      setCounter(state, DEADLINE_KEY, aggro.sinceMs + sequence.castMs);
      setString(state, STAGE_KEY, 'cast');
    } else {
      setCounter(state, DEADLINE_KEY, aggro.sinceMs + sequence.maxChargeMs);
      setString(state, STAGE_KEY, 'charge');
    }
  }

  const stage = (getString(state, STAGE_KEY) ?? 'done') as EngageStage;
  if (
    (sequence.kind === 'cast-charge-root' || sequence.kind === 'cast-charge-strike') &&
    stage === 'cast' &&
    now >= getCounter(state, DEADLINE_KEY)
  ) {
    setCounter(state, DEADLINE_KEY, now + sequence.maxChargeMs);
    setString(state, STAGE_KEY, 'charge');
    return 'charge';
  }
  if (stage === 'charge' && now >= getCounter(state, DEADLINE_KEY)) {
    setString(state, STAGE_KEY, 'done');
    return 'done';
  }
  if (stage === 'lock' && now >= getCounter(state, DEADLINE_KEY)) {
    setString(state, STAGE_KEY, 'slam-ready');
    return 'slam-ready';
  }
  return stage;
}

/** Enter the lockdown beat after the charge reaches its player target. */
export function beginEngageLock(
  world: World,
  monster: MonsterEntity,
  player: PlayerEntity,
  lockoutMs: number,
  now: number,
): void {
  applyStatusEffect(player.tracksCombat, {
    id: CAVE_LOCKDOWN_EFFECT_ID,
    instanced: true,
    remainingMs: lockoutMs,
    sourceId: monster.isMonster.id,
    data: { totalMs: lockoutMs, speedMult: 0 },
  });
  syncPlayerControlLockout(world, player);
  setCounter(monster.tracksCombat, DEADLINE_KEY, now + lockoutMs);
  setString(monster.tracksCombat, STAGE_KEY, 'lock');
}

export function engageSequenceHoldsAttack(monster: MonsterEntity): boolean {
  const stage = getString(monster.tracksCombat, STAGE_KEY);
  return stage === 'cast' || stage === 'lock';
}

export function engageSequenceSlamReady(monster: MonsterEntity): boolean {
  return getString(monster.tracksCombat, STAGE_KEY) === 'slam-ready';
}

export function completeEngageSequence(
  monster: MonsterEntity,
  armChargedAttack = false,
): void {
  setString(monster.tracksCombat, STAGE_KEY, armChargedAttack ? 'slam-ready' : 'done');
}

/** Arms the next basic attack as the amplified impact of an aerial opener. */
export function armEngageSequenceLandingAttack(
  monster: MonsterEntity,
  damageMultiplier: number,
): void {
  setCounter(monster.tracksCombat, LANDING_MULTIPLIER_KEY, damageMultiplier);
}

/** Consume the one-shot landing multiplier; ordinary attacks always return 1. */
export function consumeEngageSequenceLandingAttack(
  monster: MonsterEntity,
): number {
  const multiplier = getCounter(monster.tracksCombat, LANDING_MULTIPLIER_KEY);
  if (multiplier <= 0) return 1;
  setCounter(monster.tracksCombat, LANDING_MULTIPLIER_KEY, 0);
  return multiplier;
}

/**
 * Abort any pre-slam stage and release only this monster's lockdown instance.
 * The existing charged-attack controller owns interruption after the slam begins.
 */
export function abortEngageSequence(
  world: World,
  monster: MonsterEntity,
): void {
  const stage = getString(monster.tracksCombat, STAGE_KEY);
  if (stage !== 'cast' && stage !== 'charge' && stage !== 'lock' && stage !== 'slam-ready') return;
  if (stage === 'cast') {
    const sequence = MONSTER_DATABASE.get(monster.isMonster.monsterTypeId)?.engageSequence;
    if (sequence?.kind === 'cast-charge-root' || sequence?.kind === 'cast-charge-strike') {
      // The client owns the visual bar, so every interrupted wind-up must close
      // it explicitly instead of leaving a stale tell above the fleeing hawk.
      world.pushEvent(monster.hasPosition.nodeId, {
        kind: 'monster-cast-end', monsterId: monster.isMonster.id, fired: false,
        fx: sequence.fx,
      });
    }
  }
  setString(monster.tracksCombat, STAGE_KEY, 'done');

  for (const player of world.livePlayers) {
    const before = player.tracksCombat.statusEffects.length;
    pruneStatusEffects(
      player.tracksCombat,
      effect =>
        effect.id === CAVE_LOCKDOWN_EFFECT_ID &&
        effect.sourceId === monster.isMonster.id,
    );
    if (player.tracksCombat.statusEffects.length !== before) {
      syncPlayerControlLockout(world, player);
    }
  }
}
