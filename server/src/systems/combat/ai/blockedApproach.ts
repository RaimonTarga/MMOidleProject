import type { PlayerEntity, MonsterEntity } from '../../../ecs/entity';

// Temporary approach failures must not permanently blacklist a moving enemy.
const deferred = new WeakMap<PlayerEntity, Map<string, number>>();
const attempts = new WeakMap<PlayerEntity, { id: string; hp: number; since: number }>();

export function approachDeferred(player: PlayerEntity, target: MonsterEntity, now: number): boolean {
  const entries = deferred.get(player);
  if (!entries) return false;
  for (const [id, until] of entries) if (until <= now) entries.delete(id);
  return entries.has(target.entityId);
}

export function clearApproachAttempt(player: PlayerEntity): void {
  attempts.delete(player);
}

/** Bound a hazard pull that produces neither contact nor damage, even if moving. */
export function hazardApproachExpired(player: PlayerEntity, target: MonsterEntity, now: number): boolean {
  let attempt = attempts.get(player);
  if (!attempt || attempt.id !== target.entityId || target.hasHealth.hp < attempt.hp) {
    attempt = { id: target.entityId, hp: target.hasHealth.hp, since: now };
    attempts.set(player, attempt);
  }
  if (now - attempt.since < 15000) return false;
  let entries = deferred.get(player);
  if (!entries) deferred.set(player, entries = new Map());
  entries.set(target.entityId, now + 30000);
  attempts.delete(player);
  return true;
}
