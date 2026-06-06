import type { MinionEntity } from '../../../../ecs/entity';

/** Minion attack range from passives — also drives ally buff aura radius. */
export function computeMinionAttackRange(passives: Record<string, number>): number {
  return Math.max(8, Math.round(passives['summoner.minion-range'] ?? 12));
}

/** Buff auras emanate from each minion at its attack range (matches tactical mode). */
export function minionBuffRadius(minion: MinionEntity): number {
  return minion.performsAttack.attackRange;
}
