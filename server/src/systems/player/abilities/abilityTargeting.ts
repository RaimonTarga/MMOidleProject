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
  DISENGAGE_MAX_GAP_PX,
  abilityRangeBonus,
  abilityRankAt,
  distanceSq,
  posHitboxFromEntity,
  reachGap,
  type AbilityDef,
} from "@mmo-idle/shared";
import type { MinionEntity, MonsterEntity, PlayerEntity } from "../../../ecs/entity";
import type { World } from "../../../world/World";
import { isHardControlled } from "../../combat/status/playerHardControl";
import { afflictionTechniqueHasWork } from "./abilityAffliction";
import { summonerProfileFor, usesSummonTechniques } from "../../classes/archetypes/summoner/profile";
import { formationChargeTarget } from "./formationCharge";

/** Validate the physical caster again throughout its wind-up. */
export function summonCanCastAt(
  world: World, player: PlayerEntity, minion: MinionEntity,
  target: MonsterEntity, ability: AbilityDef,
): boolean {
  return usesSummonTechniques(player)
    && player.summonsMinions?.minionIds.includes(minion.entityId) === true
    && player.hasSummonerCommand?.kind !== 'move'
    && minion.isMinion.ownerPlayerId === player.isPlayer.id
    && minion.hasHealth.hp > 0 && target.hasHealth.hp > 0
    && !target.isConcealed && !target.isInvulnerable
    && minion.hasPosition.nodeId === player.hasPosition.nodeId
    && target.hasPosition.nodeId === player.hasPosition.nodeId
    && !isHardControlled(minion.tracksCombat)
    && distanceSq(target.hasPosition.current, player.hasPosition.current)
      <= summonerProfileFor(player).leashRadius ** 2
    && world.collision.canReach(minion, target,
      minion.performsAttack.attackRange + abilityRangeBonus(ability, player.tracksProgression.playerTier));
}

/** One engaged physical summon performs a targeted cast, in stable slot order. */
export function summonAbilityCast(
  world: World, player: PlayerEntity, ability: AbilityDef, currentOnly = false,
): { caster: MinionEntity; target: MonsterEntity } | null {
  if (ability.shape !== "cast" || !usesSummonTechniques(player) || !player.summonsMinions) return null;
  const currentId = player.hasAttackTarget?.targetId ?? player.summonsMinions.formationTargetId;
  for (const id of player.summonsMinions.minionIds) {
    const caster = world.getMinionEntity(id);
    const targetId = caster?.hasAttackTarget?.targetId;
    if (!caster || !targetId || (currentOnly && currentId && targetId !== currentId)) continue;
    const target = world.getMonsterEntity(targetId);
    if (target && summonCanCastAt(world, player, caster, target, ability)
      && afflictionTechniqueHasWork(world, player, ability, target)) return { caster, target };
  }
  return null;
}

/** How far this ability can engage, in px, for the player's current rank. */
export function abilityEngagementRange(
  player: PlayerEntity,
  ability: AbilityDef,
): number {
  const bonus = abilityRangeBonus(ability, player.tracksProgression.playerTier);
  const range = player.performsAttack.attackRange + bonus;
  // A backward reposition must be able to select the threat that opened its
  // proximity gate, even outside a short-range character's basic reach.
  const effect = abilityRankAt(ability, player.tracksProgression.playerTier).effect;
  return effect.kind === "reposition" && !effect.toward
    ? Math.max(range, DISENGAGE_MAX_GAP_PX)
    : range;
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
  currentOnly = false,
): MonsterEntity | null {
  if (ability.shape === 'charge' && usesSummonTechniques(player)) {
    return formationChargeTarget(world, player, ability, currentOnly);
  }
  const summonCast = summonAbilityCast(world, player, ability, currentOnly);
  if (summonCast) return summonCast.target;
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
  if (currentOnly) return null;
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
