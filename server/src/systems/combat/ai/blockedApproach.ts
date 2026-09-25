import type { PlayerEntity, MonsterEntity } from '../../../ecs/entity';

const HAZARD_APPROACH_BUDGET_MS = 15000;
const HAZARD_APPROACH_DEFER_MS = 30000;
// An approach left alone for less than the deferral window is the SAME attempt.
// Target selection can flicker to another mob for a tick (a rim position where
// the pool mob briefly fails the safe-pull check); that must not restart the
// budget, or the pool mob is never deferred and the player circles it forever.
const HAZARD_APPROACH_LAPSE_MS = HAZARD_APPROACH_DEFER_MS;

// Temporary approach failures must not permanently blacklist a moving enemy.
const deferred = new WeakMap<PlayerEntity, Map<string, number>>();
const attempts = new WeakMap<PlayerEntity, Map<string, { hp: number; since: number; seen: number }>>();

export function approachDeferred(player: PlayerEntity, target: MonsterEntity, now: number): boolean {
  const entries = deferred.get(player);
  if (!entries) return false;
  for (const [id, until] of entries) if (until <= now) entries.delete(id);
  return entries.has(target.entityId);
}

/** Contact with `target` ends its attempt; with no target, avoidance is off and all attempts end. */
export function clearApproachAttempt(player: PlayerEntity, target?: MonsterEntity): void {
  if (target) attempts.get(player)?.delete(target.entityId);
  else attempts.delete(player);
}

export function hasApproachAttempt(player: PlayerEntity, target: MonsterEntity): boolean {
  return attempts.get(player)?.has(target.entityId) ?? false;
}

/** Bound a hazard pull that produces neither contact nor damage, even if moving. */
export function hazardApproachExpired(player: PlayerEntity, target: MonsterEntity, now: number): boolean {
  let entries = attempts.get(player);
  if (!entries) attempts.set(player, entries = new Map());
  for (const [id, entry] of entries) if (now - entry.seen > HAZARD_APPROACH_LAPSE_MS) entries.delete(id);
  let attempt = entries.get(target.entityId);
  if (!attempt || target.hasHealth.hp < attempt.hp) {
    attempt = { hp: target.hasHealth.hp, since: now, seen: now };
    entries.set(target.entityId, attempt);
  }
  attempt.seen = now;
  if (now - attempt.since < HAZARD_APPROACH_BUDGET_MS) return false;
  let blocked = deferred.get(player);
  if (!blocked) deferred.set(player, blocked = new Map());
  blocked.set(target.entityId, now + HAZARD_APPROACH_DEFER_MS);
  entries.delete(target.entityId);
  return true;
}

// A target seen inside a hazard stays sheltered for a short while after it steps
// out, so an enemy wandering along a hazard edge cannot flip acquisition on and
// off every few ticks (walk toward it, it dips in, turn back, it dips out...).
const HAZARD_SHELTER_MS = 5000;
const sheltered = new WeakMap<PlayerEntity, Map<string, number>>();

export function hazardSheltersTarget(
  player: PlayerEntity,
  target: MonsterEntity,
  insideHazard: boolean,
  now: number,
): boolean {
  let entries = sheltered.get(player);
  if (insideHazard) {
    if (!entries) sheltered.set(player, entries = new Map());
    entries.set(target.entityId, now + HAZARD_SHELTER_MS);
    return true;
  }
  if (!entries) return false;
  const until = entries.get(target.entityId);
  if (until === undefined) return false;
  if (until > now) return true;
  entries.delete(target.entityId);
  return false;
}
