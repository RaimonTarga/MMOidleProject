/**
 * Ability targeting and ENGAGEMENT RANGE.
 *
 * Why this exists: `hasAttackTarget` is written by the combat loop from
 * `bestTargetInReach(..., attackRange)`, so it only ever names a monster the
 * player can ALREADY hit. An ability driven off that target can therefore never
 * act at a distance — which is what made Charge pointless (by the time it could
 * fire, the gap it exists to close was already closed) and what stopped a melee
 * build from ever opening with a cast.
 *
 * So abilities resolve their own target against their own reach:
 *
 *     engagementRange = player.attackRange + rank.rangeBonus
 *
 * The player's `attackRange` is never modified. A melee character equipping
 * Snipe gains a ranged TOOL; their basic attacks stay melee.
 */
import {
  abilityRangeBonus,
  posHitboxFromEntity,
  reachGap,
  type AbilityDef,
} from "@mmo-idle/shared";
import type { MonsterEntity, PlayerEntity } from "../../../ecs/entity";
import type { World } from "../../../world/World";

/** How far this ability can engage, in px, for the player's current rank. */
export function abilityEngagementRange(
  player: PlayerEntity,
  ability: AbilityDef,
): number {
  const bonus = abilityRangeBonus(ability, player.tracksProgression.playerTier);
  return player.performsAttack.attackRange + bonus;
}

/**
 * The monster this ability should act on, or null.
 *
 * Prefers the player's current attack target when it is still within the
 * ability's reach — an ability should not steal focus from the thing the player
 * is already fighting — and otherwise takes the nearest monster inside the
 * extended reach. That fallback is the whole point: it is how a gap-closer finds
 * something to close on.
 */
export function abilityTarget(
  world: World,
  player: PlayerEntity,
  ability: AbilityDef,
): MonsterEntity | null {
  const range = abilityEngagementRange(player, ability);
  const currentId = player.hasAttackTarget?.targetId;
  const current = currentId ? world.getMonsterEntity(currentId) : undefined;
  if (
    current &&
    current.hasHealth.hp > 0 &&
    current.hasPosition.nodeId === player.hasPosition.nodeId &&
    world.collision.canReach(player, current, range)
  ) {
    return current;
  }
  return world.collision.bestTargetInReach(
    player,
    world.monsterEntitiesInNode(player.hasPosition.nodeId),
    range,
  );
}

/** Edge-to-edge gap in px between the player and a monster. */
export function gapToTarget(player: PlayerEntity, target: MonsterEntity): number {
  return reachGap(posHitboxFromEntity(player), posHitboxFromEntity(target));
}

/**
 * The nearest live monster to the player in their node, ignoring reach — used by
 * spacing triggers (Disengage), which care about "something is on top of me"
 * rather than "something I can hit".
 */
export function nearestMonsterGap(world: World, player: PlayerEntity): number | null {
  let best: number | null = null;
  const playerPH = posHitboxFromEntity(player);
  for (const monster of world.monsterEntitiesInNode(player.hasPosition.nodeId)) {
    if (monster.hasHealth.hp <= 0) continue;
    const gap = reachGap(playerPH, posHitboxFromEntity(monster));
    if (best === null || gap < best) best = gap;
  }
  return best;
}
