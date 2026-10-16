import { heatAllowsTarget } from "../../../combat/ai/heatManagement";
/**
 * Minion AI driver — runs once per minion per tick.
 *
 * Each slime:
 *   1. Follows an active owner targeting Rune, otherwise its formation policy.
 *   2. Moves toward that target up to the leash boundary.
 *   3. If no target is in leash range, returns toward its follow offset.
 *   4. If in attack range and cooldown ready, drives `runPlayerAttack` with
 *      the slime's position as the FX origin (player retains all modifiers).
 */
import {
  ACTION_DATABASE,
  getFlag,
  distanceSq,
  geometryContains,
  RUNE_TELEGRAPH_ESCAPE_CLEARANCE,
  SUMMONER_RANGE_TUNING,
  type Vec2,
} from '@mmo-idle/shared';

function distance(a: Vec2, b: Vec2): number {
  return Math.sqrt(distanceSq(a, b));
}
import type { World } from '../../../../world/World';
import type { MinionEntity, MonsterEntity, PlayerEntity } from '../../../../ecs/entity';
import { markSliceDirty } from '../../../../ecs/dirtyHelpers';
import { setEntityMotion, stopEntity } from '../../../world/movement';
import { setAttackTarget } from '../../../combat/ai/targeting';
import { runFormationAttack } from './formationAttack';
import { minionAttackCooldown, minionCanSwing } from '../../../combat/status/minionAfflictions';
import { computeMinionSpeed, despawnMinion, getFollowOffset } from './spawn';
import {
  isSummonerRecalling,
  recallSpot,
} from './command';
import { summonerProfileFor } from './profile';
import { chaseBonus } from './souls';
import { fallBackSpot } from './leavesT4';
import { orderedTarget } from './formationOrders';
import { getRuneDecisions, RUNE_WAIT_FOR_SUMMONS_FLAG } from '../../../combat/ai/runeConfig';
import { getAutoTargetId } from '../../../combat/ai/targetPriority';
import { findMinionTelegraphEscape } from '../../../combat/ai/telegraphEvasion';
import { isConcealedEntity } from "../../../combat/invulnerability";

// Pixels — how close to the follow offset is "close enough" to idle.
const FOLLOW_HOVER_TOL = 10;
// Pixels — stay this much inside the leash boundary to avoid jitter at the edge.
const LEASH_MARGIN = 4;

/**
 * Leash radius around the player. Pulled from a passive so future T1/T3 paths
 * can shift it without touching the AI body.
 */
export function computeLeashRadius(owner: PlayerEntity): number {
  return Math.round(summonerProfileFor(owner).leashRadius * (1 + chaseBonus(owner).leash));
}

/** Consume the owner's native selection, including channel arbitration and gates.
 * Undefined means no active targeting rule; null means the rule currently has no
 * valid in-leash target. Do not silently replace that preference with nearest.
 */
function inheritedRuneTarget(world: World, owner: PlayerEntity, leashRadius: number): MonsterEntity | null | undefined {
  if (!owner.usesAutocombat.auto || !getRuneDecisions(owner).some(rule =>
    ACTION_DATABASE.get(rule.actionId)?.channel === 'TARGETING')) return undefined;
  const id = getAutoTargetId(owner);
  const target = id ? world.getMonsterEntity(id) : undefined;
  if (!target || target.hasHealth.hp <= 0 || target.isInvulnerable || isConcealedEntity(target)
    || target.hasPosition.nodeId !== owner.hasPosition.nodeId
    || distanceSq(target.hasPosition.current, owner.hasPosition.current) > leashRadius * leashRadius) return null;
  return target;
}

/** Pick the closest in-leash monster. Returns null if none in range. */
function findMinionTarget(
  world: World,
  owner: PlayerEntity,
  leashRadius: number,
): MonsterEntity | null {
  const leashSq = leashRadius * leashRadius;
  let best: MonsterEntity | null = null;
  let bestDistSq = Infinity;
  for (const m of world.monsterEntitiesInNode(owner.hasPosition.nodeId)) {
    if (m.hasHealth.hp <= 0) continue;
    if (!heatAllowsTarget(world, owner, m)) continue;
    const distSq = distanceSq(m.hasPosition.current, owner.hasPosition.current);
    if (distSq > leashSq) continue;
    if (distSq < bestDistSq) {
      bestDistSq = distSq;
      best = m;
    }
  }
  return best;
}

/** The nearest monster this summon can already hit from where it stands. */
function findReachableMonster(world: World, owner: PlayerEntity, minion: MinionEntity): MonsterEntity | null {
  let best: MonsterEntity | null = null;
  let bestDistSq = Infinity;
  for (const m of world.monsterEntitiesInNode(owner.hasPosition.nodeId)) {
    if (m.hasHealth.hp <= 0) continue;
    if (!heatAllowsTarget(world, owner, m)) continue;
    if (!world.collision.canReach(minion, m, minion.performsAttack.attackRange)) continue;
    const distSq = distanceSq(m.hasPosition.current, minion.hasPosition.current);
    if (distSq < bestDistSq) {
      bestDistSq = distSq;
      best = m;
    }
  }
  return best;
}

/** Swing at `target` once the summon's cooldown is ready. */
function strikeWhenReady(world: World, owner: PlayerEntity, minion: MinionEntity, target: MonsterEntity, now: number): void {
  if (!minionCanSwing(minion)) return;
  if (now - minion.performsAttack.lastAttackAt >= minionAttackCooldown(minion)) {
    const outcome = runFormationAttack(world, owner, minion, target, now);
    if (outcome !== 'cancelled') {
      minion.performsAttack.lastAttackAt = now;
    }
  }
}

/**
 * Constrain `desired` so it lies within `leashRadius` of `owner.hasPosition`.
 * If `desired` is already in range it's returned unchanged; otherwise we
 * project it back onto the leash boundary (minus a small margin).
 */
function clampToLeash(
  owner: PlayerEntity,
  desired: Vec2,
  leashRadius: number,
): Vec2 {
  const op = owner.hasPosition.current;
  const dx = desired.x - op.x;
  const dy = desired.y - op.y;
  const distSq = dx * dx + dy * dy;
  const max = Math.max(0, leashRadius - LEASH_MARGIN);
  if (distSq <= max * max) return desired;
  const d = Math.sqrt(distSq) || 1;
  return {
    x: op.x + (dx / d) * max,
    y: op.y + (dy / d) * max,
  };
}

/** The owner's Step Back rule moves each summon out of the telegraphs it stands in. */
function ownerStepsBack(owner: PlayerEntity): boolean {
  return owner.usesAutocombat.auto
    && owner.tracksProgression.runesEquipped.some((rule) => rule.actionId === 'step-back');
}

/**
 * Is `pos` under an aimed telegraph that has not landed yet (a slam, a charge corridor, a fault
 * line)? The arena's scattered hazards (vent eruptions, rockfall: `scattered` fault lines) do not
 * count. OV2-CONDUIT (PLACEHOLDER, for review): with Avoid Hazards a default order, every summon
 * stepped out of every vent, and the Caldera's last quarter, a near-bullet-hell of vents around the
 * boss, left the formation a third of its damage (sim: Pack 300 dps on the boss against 900 with
 * no summon Step Back) for no fewer summon deaths. Summons still dodge the aimed blows.
 */
function insideAimedTelegraph(world: World, nodeId: string, pos: Vec2, clearance = 0): boolean {
  return (world.groundZones.get(nodeId) ?? []).some((zone) =>
    zone.kind !== 'toxic-pool'
    && !(zone.kind === 'fault-line-telegraph' && zone.scattered === true)
    && world.hasMonster(zone.ownerId)
    && geometryContains(zone.geometry, pos, clearance));
}

/**
 * Walk toward `dest`, or stand still when Step Back is on and `dest` lies under
 * a telegraph that has not landed yet � rather than chase, retreat or follow the
 * owner back into a slam the summon just left.
 */
function moveMinionOutsideTelegraphs(
  world: World,
  owner: PlayerEntity,
  minion: MinionEntity,
  dest: Vec2,
): void {
  if (ownerStepsBack(owner)
    && insideAimedTelegraph(world, minion.hasPosition.nodeId, dest)) {
    stopEntity(world, minion);
    return;
  }
  setEntityMotion(world, minion, dest);
}

export function driveMinion(
  world: World,
  minion: MinionEntity,
  owner: PlayerEntity,
  now: number,
): void {
  const leashRadius = computeLeashRadius(owner);
  const profile = summonerProfileFor(owner);
  const cm = minion.controlsMinion;

  // The ability lifecycle owns rush movement and the arrival strike.
  if (minion.isChargingAbility && owner.hasFormationCharge) return;

  // Only the chosen caster commits its attacks/movement to this wind-up.
  if (owner.isCastingAbility?.casterMinionId === minion.entityId) {
    stopEntity(world, minion);
    minion.performsAttack.lastAttackAt = now;
    return;
  }

  const escape = ownerStepsBack(owner)
    && insideAimedTelegraph(world, minion.hasPosition.nodeId, minion.hasPosition.current, RUNE_TELEGRAPH_ESCAPE_CLEARANCE)
    ? findMinionTelegraphEscape(world, minion) : null;
  if (escape) {
    setEntityMotion(world, minion, escape);
    return;
  }

  // Fall Back (T4 leaf): a hurt summon retreats behind the tanks and does not fight until it has mended.
  const retreat = fallBackSpot(world, owner, minion);
  if (retreat) {
    if (distance(minion.hasPosition.current, retreat) > FOLLOW_HOVER_TOL) setEntityMotion(world, minion, retreat);
    else stopEntity(world, minion);
    setAttackTarget(world, minion, null);
    cm.currentTargetId = null;
    return;
  }

  if (isSummonerRecalling(owner)) {
    const spot = recallSpot(owner, minion);
    if (distance(minion.hasPosition.current, spot) > FOLLOW_HOVER_TOL) {
      setEntityMotion(world, minion, spot);
      setAttackTarget(world, minion, null);
      cm.currentTargetId = null;
      return;
    }
    // Home: hold the spot, but strike back at anything already in reach
    // rather than stand still while melee that followed it in keeps biting.
    stopEntity(world, minion);
    const inReach = findReachableMonster(world, owner, minion);
    setAttackTarget(world, minion, inReach?.isMonster.id ?? null);
    cm.currentTargetId = inReach?.isMonster.id ?? null;
    if (inReach) strikeWhenReady(world, owner, minion, inReach, now);
    return;
  }

  const inherited = inheritedRuneTarget(world, owner, leashRadius);
  // The Formation's orders (what to attack first, who the tanks guard) replace the owner's rune targeting.
  const ordered = orderedTarget(world, owner, minion, leashRadius);
  const rebuilding = owner.usesAutocombat.auto && getFlag(owner.tracksCombat, RUNE_WAIT_FOR_SUMMONS_FLAG);
  const target = rebuilding ? null : ordered !== undefined ? ordered : inherited !== undefined ? inherited
    : findMinionTarget(world, owner, leashRadius);
  const stickyTarget = !!inherited || !!ordered;

  if (target) {
    if (stickyTarget) {
      setAttackTarget(world, minion, target.isMonster.id);
      cm.currentTargetId = target.isMonster.id;
    }

    if (world.collision.canReach(minion, target, minion.performsAttack.attackRange)) {
      // Harriers keep moving away when crowded; guardian/escort formations hold.
      const targetDistance = distance(minion.hasPosition.current, target.hasPosition.current);
      // Harriers, and roster bodies that fight from range, keep their distance.
      const slotRanged = profile.slots[minion.isMinion.slot]?.mode === 'ranged';
      const preferred = slotRanged ? SUMMONER_RANGE_TUNING.far.preferredDistance : profile.preferredDistance;
      if ((profile.formationPolicy === 'harrier' || slotRanged)
        && targetDistance < preferred * 0.65) {
        const dx = minion.hasPosition.current.x - target.hasPosition.current.x;
        const dy = minion.hasPosition.current.y - target.hasPosition.current.y;
        const length = Math.sqrt(dx * dx + dy * dy) || 1;
        const retreat = preferred - targetDistance;
        moveMinionOutsideTelegraphs(world, owner, minion, clampToLeash(owner, {
          x: minion.hasPosition.current.x + (dx / length) * retreat,
          y: minion.hasPosition.current.y + (dy / length) * retreat,
        }, leashRadius));
      } else {
        stopEntity(world, minion);
      }
      if (!stickyTarget) {
        setAttackTarget(world, minion, target.isMonster.id);
        cm.currentTargetId = target.isMonster.id;
      }

      strikeWhenReady(world, owner, minion, target, now);
      return;
    }

    // Normal chase, but only as far as the leash allows.
    const desired = clampToLeash(owner, target.hasPosition.current, leashRadius);
    const distToDesired = distance(minion.hasPosition.current, desired);
    if (distToDesired > FOLLOW_HOVER_TOL) {
      moveMinionOutsideTelegraphs(world, owner, minion, desired);
    } else {
      stopEntity(world, minion);
    }
    if (!stickyTarget) {
      setAttackTarget(world, minion, null);
      cm.currentTargetId = null;
    }
    return;
  }

  // No in-range target — return to follow offset around the owner.
  const off = getFollowOffset(minion.isMinion.slot, owner.summonsMinions?.targetCount ?? 1);
  const idleAt: Vec2 = {
    x: owner.hasPosition.current.x + off.x,
    y: owner.hasPosition.current.y + off.y,
  };
  if (distance(minion.hasPosition.current, idleAt) > FOLLOW_HOVER_TOL) {
    moveMinionOutsideTelegraphs(world, owner, minion, idleAt);
  } else {
    stopEntity(world, minion);
  }
  setAttackTarget(world, minion, null);
  minion.controlsMinion.currentTargetId = null;
}
