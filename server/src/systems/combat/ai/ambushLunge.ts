/**
 * AMBUSH LUNGE — letting a charged attack start, and finish, from outside the jaws.
 *
 * Every monster beat in `updateCombat` is gated on `attackRange`, which is correct
 * for everything that walks up and swings. It is exactly wrong for a pounce: the
 * leap IS the gap-closer, so requiring contact before the wind-up may open means the
 * ambusher has already arrived by the time it telegraphs, and the telegraph teaches
 * the player nothing they can act on.
 *
 * `chargedAttack.lunge` opens a second, wider gate for that one ability:
 *
 *   ARM     the wind-up may begin anywhere inside `lunge.range`, and the caster
 *           holds position for the whole tell — the readable beat is the predator
 *           visibly coiling at the water's edge, from a distance you could still
 *           walk out of.
 *   COMMIT  the cast survives at range on its own (`hasMobileMonsterCast`), so the
 *           counterplay is INTERRUPTING it (stun / freeze), not stepping back.
 *   LAND    on resolution the caster crosses the gap in one leap and the hit resolves
 *           from contact, through the ordinary `runMonsterAttack` pipeline.
 *
 * Ordinary attacks are untouched. A lunger whose window closes has to cover the
 * ground on foot like anything else.
 */

import {
  navigationBodyHalfExtents,
  type MonsterDefinition,
  type Vec2,
} from "@mmo-idle/shared";
import type { MonsterEntity, PlayerEntity } from "../../../ecs/entity";
import { markSliceDirty } from "../../../ecs/dirtyHelpers";
import type { World } from "../../../world/World";
import {
  chargedCastEndsAt,
  chargeReady,
  isChargeAoePlanted,
  monsterAttackCooldown,
} from "../engine/monsterMechanics";
import { resolveObstaclesForNode } from "../../world/nodeFeatures";
import { stopEntity } from "../../world/movement";

/**
 * Where the leap ends, relative to the victim. Landing exactly on top of a player
 * wedges the two bodies together and the next tick shoves them apart; stopping a
 * body-width short puts the jaws in melee and leaves the picture legible.
 */
const LUNGE_ARRIVAL_GAP = 34;

/** The authored lunge on this monster's charged attack, if it has one. */
export function lungeSpecFor(
  def: MonsterDefinition | undefined,
): NonNullable<MonsterDefinition["chargedAttack"]>["lunge"] | undefined {
  return def?.chargedAttack?.lunge;
}

/**
 * True when this monster should be treated as "in reach" of `target` for the sake of
 * its charged attack alone — either the pounce is already committed, or it is close
 * enough to open the wind-up.
 *
 * Deliberately measured centre-to-centre against the authored range rather than
 * through `collision.canReach`: the leap crosses obstacles the mob could not walk
 * around in the same time, which is the point of a leap.
 */
export function lungeInRange(
  monster: MonsterEntity,
  target: PlayerEntity,
  range: number,
): boolean {
  const dx = monster.hasPosition.current.x - target.hasPosition.current.x;
  const dy = monster.hasPosition.current.y - target.hasPosition.current.y;
  return dx * dx + dy * dy <= range * range;
}

/**
 * Should the AI plant this monster instead of chasing?
 *
 * Yes while a pounce is committed, and yes the moment one is ready and its victim is
 * inside leap range — the ambusher stops at the water's edge and coils rather than
 * walking the last two hundred pixels and biting. Mirrors the hold the Dire Wolf's
 * out-of-range Howl already uses, for the same reason: an ability that resolves from
 * a distance must not be dragged into melee by the chase logic before it can fire.
 *
 * No when the charge is merely on cooldown. A lunger between pounces is an ordinary
 * melee monster and closes on foot; holding it out there would make a predator that
 * never actually reaches anyone.
 */
export function lungeWantsPosition(
  monster: MonsterEntity,
  def: MonsterDefinition | undefined,
  target: PlayerEntity,
  now: number,
): boolean {
  const spec = lungeSpecFor(def);
  const charged = def?.chargedAttack;
  if (!spec || !charged) return false;

  // Committed: hold for the remainder of the tell, wherever the victim has gone.
  if (chargedCastEndsAt(monster) > 0 && !isChargeAoePlanted(monster)) return true;

  if (!lungeInRange(monster, target, spec.range)) return false;
  if (!chargeReady(monster, now, charged.initialCooldownMs ?? charged.cooldownMs)) {
    return false;
  }
  // The charge only ever turns a NORMAL attack opportunity into the pounce, so the
  // hold has to wait on the same rhythm or the mob freezes early and stares.
  return (
    now - monster.performsAttack.lastAttackAt >= monsterAttackCooldown(monster)
  );
}

/**
 * Cross the gap. Called once, at the instant the wind-up resolves and before the hit
 * is rolled, so the bite lands from contact.
 *
 * The landing point runs through the same obstacle resolution as any other forced
 * move, so a leap cannot end inside geometry; if the way is blocked the monster stops
 * where the resolver puts it and the attack resolves from there.
 */
export function performAmbushLunge(
  world: World,
  monster: MonsterEntity,
  target: PlayerEntity,
): void {
  const from = monster.hasPosition.current;
  const to = target.hasPosition.current;
  const gap = Math.hypot(to.x - from.x, to.y - from.y);
  if (gap <= LUNGE_ARRIVAL_GAP) return;

  const travel = gap - LUNGE_ARRIVAL_GAP;
  const landing: Vec2 = {
    x: from.x + ((to.x - from.x) / gap) * travel,
    y: from.y + ((to.y - from.y) / gap) * travel,
  };
  const resolved = resolveObstaclesForNode(
    world,
    monster.hasPosition.nodeId,
    from,
    landing,
    "monster",
    navigationBodyHalfExtents("monster"),
  );

  monster.hasPosition.current = resolved;
  markSliceDirty(world, monster, "hasPosition");
  stopEntity(world, monster);
}
