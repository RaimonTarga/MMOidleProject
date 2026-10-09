/**
 * "In reach" for the ability keystone verbs (design §22.10, §22.11): the
 * ABILITY's reach, measured from the verb's delivery body — the same reach the
 * ability itself was allowed to act at, so a verb never touches a body its own
 * ability could not have.
 *
 *  - the owner: `abilityEngagementRange` (the player's attack range plus the
 *    rank's `rangeBonus`), the reach `abilityTarget` and the cast's own
 *    validation use;
 *  - a Conduit's physical summon: that summon's attack range plus the same
 *    `rangeBonus`, exactly what `summonCanCastAt` checks before and during the
 *    cast it delivers.
 *
 * Reach is edge to edge (`canReach`), the one reach test every attack and cast
 * uses. Nothing here owns a number.
 */
import { abilityRangeBonus, type AbilityDef, type Vec2 } from '@mmo-idle/shared';
import type { MinionEntity, MonsterEntity, PlayerEntity } from '../../../../ecs/entity';
import type { World } from '../../../../world/World';
import { abilityEngagementRange } from '../../../player/abilities/abilityTargeting';
import { isConcealedEntity, isInvulnerableMonster } from '../../invulnerability';

/** The ability's reach from `body` (the owner, or the summon that delivered it). */
export function abilityReachFrom(
  player: PlayerEntity,
  body: PlayerEntity | MinionEntity,
  ability: AbilityDef,
): number {
  if (body === player) return abilityEngagementRange(player, ability);
  return body.performsAttack.attackRange + abilityRangeBonus(ability, player.tracksProgression.playerTier);
}

/**
 * Every living, fightable body on the player's node inside the ability's reach
 * of `body`, minus `exclude`. Invulnerable and concealed bodies are not there to
 * be acted on, as `playerAoeTargets` and the target lists already say.
 */
export function bodiesInAbilityReach(
  world: World,
  player: PlayerEntity,
  body: PlayerEntity | MinionEntity,
  ability: AbilityDef,
  exclude: ReadonlySet<string> = new Set(),
): MonsterEntity[] {
  const reach = abilityReachFrom(player, body, ability);
  const out: MonsterEntity[] = [];
  for (const monster of world.monsterEntitiesInNode(player.hasPosition.nodeId)) {
    if (monster.hasHealth.hp <= 0 || exclude.has(monster.isMonster.id)) continue;
    if (isInvulnerableMonster(monster) || isConcealedEntity(monster)) continue;
    if (!world.collision.canReach(body, monster, reach)) continue;
    out.push(monster);
  }
  return out;
}

/** The candidate whose centre is nearest `origin`, or undefined. Ties keep the first. */
export function nearestTo<T extends { hasPosition: { current: Vec2 } }>(
  origin: Vec2,
  candidates: Iterable<T>,
): T | undefined {
  let best: T | undefined;
  let bestGap = Infinity;
  for (const candidate of candidates) {
    const dx = candidate.hasPosition.current.x - origin.x;
    const dy = candidate.hasPosition.current.y - origin.y;
    const gap = dx * dx + dy * dy;
    if (gap < bestGap) {
      bestGap = gap;
      best = candidate;
    }
  }
  return best;
}
