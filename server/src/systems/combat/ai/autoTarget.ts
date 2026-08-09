import type { World } from "../../../world/World";
import type { MonsterEntity, PlayerEntity } from "../../../ecs/entity";
import {
  MONSTER_DATABASE,
  distanceSq,
  getFlag,
  hitboxGap,
  MELEE_CONTACT_MARGIN,
  pointInNodeFeatureShape,
  posHitboxFromEntity,
  RESOLVED_NODE_FEATURES,
  RUNE_CAREFUL_PULLING_MAX_THREAT_RADIUS,
  RUNE_CAREFUL_PULLING_MIN_THREAT_RADIUS,
  RUNE_CAREFUL_PULLING_SIDE_STEP,
  RUNE_KEEP_DISTANCE_GAP,
  RUNE_KEEP_DISTANCE_RANGED_BUFFER,
  setFlag,
  type NodeFeatureShape,
  type Vec2,
} from "@mmo-idle/shared";
import { NODE_REGISTRY } from "../../../world/nodeRegistry";
import { navigationPadForEntity, setEntityMotion, stopEntity } from "../../world/movement";
import { resolveObstaclesForNode } from "../../world/nodeFeatures";
import { suppressedFeatureIdsForEntity } from "../../world/pathMotion";
import { isEffectivePartyFollower } from "../../player/party/partySystem";
import { beginFlee, stepFlee } from "./flee";
import {
  nearestEngageableMonster,
  selectAutoCombatAction,
} from "./targetPriority";
import {
  RUNE_FOLLOW_LEADER_FLAG,
  RUNE_AVOID_NODE_HAZARDS_FLAG,
  RUNE_CAREFUL_PULLING_FLAG,
  RUNE_KEEP_DISTANCE_FLAG,
  RUNE_TACTICAL_RELOAD_FLAG,
  RUNE_WAIT_FOR_EXECUTION_FLAG,
  RUNE_WAIT_FOR_REGEN_FLAG,
} from "./runeConfig";
import { isPlayerInCombat } from "./engagement";

const NODE_MARGIN = 40;

/**
 * Latch flag: true while a keep-distance auto-combat player is holding position
 * to fire. While latched the "keep firing" gap window is widened so small target
 * drift between ticks doesn't flip the player between stop and reposition every
 * tick — that churn is what the 5 Hz client samples as movement stutter.
 */
const AUTO_FIRING_FLAG = "autoFiring";

/**
 * Personal-space gap (edge-to-edge px) for the idle keep-distance "Skittish"
 * behavior: hold position until an enemy is closer than this, then back away.
 * Authored in shared so the rune's own card can quote the distance it holds.
 */
const AVOID_GAP = RUNE_KEEP_DISTANCE_GAP;

/**
 * Fraction of attack range an auto-combat approacher settles at when closing on a
 * target (no keep-distance rune). Stopping at the bare edge of reach leaves the
 * player a pixel of drift from whiffing every swing — worst against a stationary
 * ranged mob that never closes the gap for us. For long-range attackers the
 * absolute MELEE_CONTACT_MARGIN is negligible, so this fractional buffer is what
 * actually keeps them reliably inside effective range.
 */
const AUTO_SETTLE_FRAC = 0.9;

/**
 * Extra depth (px) past the firing standoff that the approach motion aims for. The
 * nav layer treats a mover as "arrived" and stops it once within ~48px of its goal
 * (goalsNearEnough / PATH_GOAL_EPSILON). Aiming exactly at the standoff would
 * therefore strand the player up to ~48px short of effective range — the "sits
 * just outside getting shot" bug. Aiming this much deeper (slightly above that
 * epsilon, never past target center) keeps the per-tick settleGap check the real
 * stop. Must stay > the 48px goal epsilon.
 */
const APPROACH_GOAL_SLACK = 64;

/**
 * Within this edge-to-edge gap the approach hands off from A* pathing to DIRECT
 * steering. The nav layer only resolves a path goal to within its arrival epsilon
 * (~24-48px); when a build's attack range is smaller than that — e.g. a
 * close-range frame on a ranged class floors attackRange to ~12px — pathing
 * strands the player just outside reach of a stationary target (the "melee'd
 * ranged build vs ranged mob sits and gets shot" bug). Direct steering closes the
 * final gap with pixel precision. Kept well above the nav epsilon so the handoff
 * happens before pathing would strand the player.
 */
const DIRECT_APPROACH_DIST = 100;

/**
 * Edge-to-edge buffer (px) the keep-distance kite tries to hold BEYOND a target's
 * own attack reach, so it stands just outside a ranged mob's range instead of
 * parking inside it. Only fully achievable when the player can still fire from
 * that far — i.e. the mob does not outrange the player.
 */
const RANGED_SAFE_BUFFER = RUNE_KEEP_DISTANCE_RANGED_BUFFER;
const CAREFUL_PULLING_MAX_THREAT_RADIUS = RUNE_CAREFUL_PULLING_MAX_THREAT_RADIUS;
const CAREFUL_PULLING_MIN_THREAT_RADIUS = RUNE_CAREFUL_PULLING_MIN_THREAT_RADIUS;
const CAREFUL_PULLING_SIDE_STEP = RUNE_CAREFUL_PULLING_SIDE_STEP;
const HAZARD_PULL_EDGE_BUFFER = 72;
const HAZARD_PULL_ARRIVE_SQ = 42 * 42;
const HAZARD_SKIRT_ANGLE = 0.65;

/**
 * Direct steering is only safe when the mover's whole body has an unobstructed
 * segment to the requested standoff. Distance alone is insufficient: two actors
 * can be less than DIRECT_APPROACH_DIST apart while standing on opposite sides
 * of a tree. In that case direct mode has no path to replan and will repeatedly
 * drive into the trunk forever.
 */
function hasClearDirectApproach(
  world: World,
  player: PlayerEntity,
  destination: Vec2,
): boolean {
  const resolved = resolveObstaclesForNode(
    world,
    player.hasPosition.nodeId,
    player.hasPosition.current,
    destination,
    "player",
    navigationPadForEntity(player),
    suppressedFeatureIdsForEntity(world, player),
  );
  return resolved === destination;
}

function clampToNode(world: World, nodeId: string, pos: Vec2): Vec2 {
  const node = NODE_REGISTRY.get(nodeId);
  if (!node) return pos;

  return {
    x: Math.max(NODE_MARGIN, Math.min(node.width - NODE_MARGIN, pos.x)),
    y: Math.max(NODE_MARGIN, Math.min(node.height - NODE_MARGIN, pos.y)),
  };
}

/**
 * Combat-grace predicate used only for kite-vs-idle steering. Rune recovery
 * arbitration uses active targets/aggro instead, so it can claim movement while
 * this post-combat cooldown is still running.
 */
function playerHazardContainingPoint(nodeId: string, pos: Vec2): NodeFeatureShape | null {
  const features = RESOLVED_NODE_FEATURES[nodeId];
  if (!features) return null;
  for (const feature of features) {
    if (!feature.damage?.targets.includes("player")) continue;
    if (pointInNodeFeatureShape(pos, feature.shape)) return feature.shape;
  }
  return null;
}

function hazardPullPoint(
  hazard: NodeFeatureShape,
  playerPos: Vec2,
  targetPos: Vec2,
): Vec2 | null {
  if (hazard.kind !== "circle") return null;
  let dx = targetPos.x - hazard.x;
  let dy = targetPos.y - hazard.y;
  let dist = Math.hypot(dx, dy);
  if (dist === 0) {
    dx = playerPos.x - hazard.x;
    dy = playerPos.y - hazard.y;
    dist = Math.hypot(dx, dy);
  }
  if (dist === 0) return null;
  const radius = hazard.radius + HAZARD_PULL_EDGE_BUFFER;
  return {
    x: hazard.x + (dx / dist) * radius,
    y: hazard.y + (dy / dist) * radius,
  };
}

function hazardSkirtPoint(
  hazard: NodeFeatureShape,
  playerPos: Vec2,
  targetPos: Vec2,
): Vec2 | null {
  if (hazard.kind !== "circle") return null;
  const base = hazardPullPoint(hazard, playerPos, targetPos);
  if (!base) return null;
  const angle = Math.atan2(base.y - hazard.y, base.x - hazard.x) + HAZARD_SKIRT_ANGLE;
  const radius = hazard.radius + HAZARD_PULL_EDGE_BUFFER;
  return {
    x: hazard.x + Math.cos(angle) * radius,
    y: hazard.y + Math.sin(angle) * radius,
  };
}

function carefulPullingDest(
  world: World,
  player: PlayerEntity,
  target: MonsterEntity,
  dest: Vec2,
): Vec2 {
  if (!getFlag(player.tracksCombat, RUNE_CAREFUL_PULLING_FLAG)) return dest;

  let pushX = 0;
  let pushY = 0;
  for (const other of world.monsterEntitiesInNode(player.hasPosition.nodeId)) {
    if (other.entityId === target.entityId) continue;
    const def = MONSTER_DATABASE.get(other.isMonster.monsterTypeId);
    if (!def?.elite) continue;

    const radius = Math.max(
      CAREFUL_PULLING_MIN_THREAT_RADIUS,
      Math.min(CAREFUL_PULLING_MAX_THREAT_RADIUS, other.controlsMonster.leashRange),
    );
    const radiusSq = radius * radius;
    const points = [other.hasPosition.current, other.controlsMonster.spawn];

    for (const point of points) {
      const dx = dest.x - point.x;
      const dy = dest.y - point.y;
      const d2 = dx * dx + dy * dy;
      if (d2 > radiusSq) continue;
      const dist = Math.sqrt(Math.max(1, d2));
      const pressure = (radius - dist) / radius;
      pushX += (dx / dist) * pressure;
      pushY += (dy / dist) * pressure;
    }
  }

  const mag = Math.hypot(pushX, pushY);
  if (mag < 0.001) return dest;

  const nudged = {
    x: dest.x + (pushX / mag) * CAREFUL_PULLING_SIDE_STEP,
    y: dest.y + (pushY / mag) * CAREFUL_PULLING_SIDE_STEP,
  };
  return clampToNode(world, player.hasPosition.nodeId, nudged);
}

export function updateAutoTargets(world: World, now: number) {
  for (const player of world.livePlayers) {
    if (!player.usesAutocombat.auto) continue;
    if (player.hasManualMoveIntent) continue;

    // Active escape remains higher priority than voluntary recovery/maintenance.
    if (player.isFleeing) {
      stepFlee(world, player);
      continue;
    }

    if (
      getFlag(player.tracksCombat, RUNE_WAIT_FOR_REGEN_FLAG) &&
      player.hasAttackTarget === undefined &&
      player.hasHealth.hp < player.hasHealth.maxHp
    ) {
      setFlag(player.tracksCombat, AUTO_FIRING_FLAG, false);
      stopEntity(world, player);
      continue;
    }

    if (
      getFlag(player.tracksCombat, RUNE_WAIT_FOR_EXECUTION_FLAG) &&
      player.hasAttackTarget === undefined &&
      player.usesCooldown !== undefined &&
      player.hasEmpoweredAttack === undefined
    ) {
      setFlag(player.tracksCombat, AUTO_FIRING_FLAG, false);
      stopEntity(world, player);
      continue;
    }

    if (
      getFlag(player.tracksCombat, RUNE_TACTICAL_RELOAD_FLAG) &&
      player.hasAttackTarget === undefined &&
      player.usesReload !== undefined &&
      player.usesReload.reloadingMs > 0
    ) {
      setFlag(player.tracksCombat, AUTO_FIRING_FLAG, false);
      stopEntity(world, player);
      continue;
    }

    // Rune-following party members are steered by updatePartyFollow. Followers
    // without that rule fall through and use their own targeting rules.
    if (
      isEffectivePartyFollower(world, player) &&
      getFlag(player.tracksCombat, RUNE_FOLLOW_LEADER_FLAG)
    ) {
      continue;
    }
    // CannotAttack players (summoners; anyone whose range fell below 1px) still
    // route to mobs here — the marker only blocks the *direct* strike in
    // combat.ts. A summoner does its combat through summons as a proxy: the
    // player approaches the target and its leashed minions engage.

    if (player.hasAutoTraversePath) {
      if (player.hasAutoTraversePath.targetNodeId !== player.hasPosition.nodeId) {
        continue;
      }
    }

    const action = selectAutoCombatAction(
      world,
      player,
      player.usesAutocombat,
      now,
    );
    if (action.kind === "flee") {
      beginFlee(world, player);
      stepFlee(world, player);
    } else if (action.kind === "attack") {
      steerTowardTarget(world, player, action.target, now);
    } else {
      // idle — nothing within acquire range. Head for the nearest clearable mob
      // on this node (baseline with no runes, and explore rune alike). Hold
      // still only when the node is empty; leaving the node/biome stays owned
      // by updateAutoTraverse when the explore rune is equipped.
      setFlag(player.tracksCombat, AUTO_FIRING_FLAG, false);
      const mob = nearestEngageableMonster(world, player);
      if (mob) {
        steerTowardTarget(world, player, mob, now);
      } else {
        stopEntity(world, player);
      }
    }
  }
}

/**
 * Move `player` into attacking position against `target`, matching the auto-combat
 * approach rules: ranged players kite to an ideal gap; melee players close to
 * contact; Reload Safely holds an OOC-reloading player still.
 * In-combat reloads keep closing on the selected target so node clears don't stall.
 * Shared by `updateAutoTargets` (its chosen priority target) and party follow (the
 * leader's target) so followers approach identically to solo auto-combat.
 */
export function steerTowardTarget(
  world: World,
  player: PlayerEntity,
  target: MonsterEntity,
  now: number,
): void {
  const targetIsAggroed =
    target.hasAggroTarget?.targetKind === "player" &&
    target.hasAggroTarget.targetId === player.isPlayer.id;

  // Reload Safely owns this OOC hold. Without the rune, reload completion does
  // not implicitly take movement control away from scouting.
  if (
    getFlag(player.tracksCombat, RUNE_TACTICAL_RELOAD_FLAG) &&
    player.usesReload &&
    player.usesReload.reloadingMs > 0 &&
    !targetIsAggroed &&
    player.hasAttackTarget === undefined
  ) {
    setFlag(player.tracksCombat, AUTO_FIRING_FLAG, false);
    stopEntity(world, player);
    return;
  }

  const playerPos = player.hasPosition.current;
  const targetPos = target.hasPosition.current;
  const dx = targetPos.x - playerPos.x;
  const dy = targetPos.y - playerPos.y;
  const dist = Math.hypot(dx, dy);
  const attackRange = player.performsAttack.attackRange;
  const playerPH = posHitboxFromEntity(player);
  const targetPH = posHitboxFromEntity(target);
  const gap = hitboxGap(playerPH, targetPH);

  // Keep-distance (rune-only): kiting is no longer automatic for ranged
  // players. Its behavior is context-dependent on the player's *live* combat
  // state, not on which condition raised the flag.
  const keepDist = getFlag(player.tracksCombat, RUNE_KEEP_DISTANCE_FLAG);
  const avoidHazards = getFlag(player.tracksCombat, RUNE_AVOID_NODE_HAZARDS_FLAG);
  const inCombat = isPlayerInCombat(player, now);

  if (avoidHazards) {
    const targetHazard = playerHazardContainingPoint(
      player.hasPosition.nodeId,
      targetPos,
    );
    const playerHazard = playerHazardContainingPoint(
      player.hasPosition.nodeId,
      playerPos,
    );
    const pullPoint = targetHazard
      ? hazardPullPoint(targetHazard, playerPos, targetPos)
      : null;
    if (targetHazard && pullPoint && !playerHazard) {
      const clamped = clampToNode(world, player.hasPosition.nodeId, pullPoint);
      const inRange = world.collision.canReach(player, target, attackRange);
      const arrivedAtPull = distanceSq(playerPos, clamped) <= HAZARD_PULL_ARRIVE_SQ;
      if (inRange) {
        setFlag(player.tracksCombat, AUTO_FIRING_FLAG, inRange);
        stopEntity(world, player);
      } else if (arrivedAtPull) {
        const skirtPoint = hazardSkirtPoint(targetHazard, playerPos, targetPos);
        if (skirtPoint) {
          setFlag(player.tracksCombat, AUTO_FIRING_FLAG, false);
          setEntityMotion(
            world,
            player,
            clampToNode(world, player.hasPosition.nodeId, skirtPoint),
            { avoidHazards: true },
          );
        } else {
          stopEntity(world, player);
        }
      } else {
        setFlag(player.tracksCombat, AUTO_FIRING_FLAG, false);
        setEntityMotion(world, player, clamped, { avoidHazards: true });
      }
      return;
    }
  }

  if (keepDist && inCombat && dist > 0) {
    // In combat: full kite formula — reposition to the ideal standoff gap,
    // moving both toward and away to stay in firing range. (Kiter / Desperate
    // Kiter.)
    // The mob can hit us at or below its own reach (same edge-to-edge gap combat
    // uses). Keep-distance exists to stand beyond it whenever we can still fire.
    const mobReach = target.performsAttack.attackRange;
    const maxFireGap = attackRange * 0.92;            // farthest we reliably fire
    const minStandoff = Math.min(maxFireGap, attackRange * 0.72);

    // Smallest gap that is both safe (past the mob's reach) and within our firing
    // range. If the mob outranges us this clamps to maxFireGap: we cannot be safe
    // and fire at once, so the safeguard is to hold at our farthest firing
    // distance — taking the fewest hits — instead of parking deep inside reach.
    const safeFireGap = Math.min(maxFireGap, mobReach + RANGED_SAFE_BUFFER);
    const idealGap = Math.max(minStandoff, safeFireGap);
    const inRange = world.collision.canReach(player, target, attackRange);

    // Hysteresis widens the hold window once firing, but the lower bound never
    // drops below the safe-fire gap, so a latched player can't creep back inside a
    // ranged mob's reach — the "out of position but still getting hit" case.
    const firing = getFlag(player.tracksCombat, AUTO_FIRING_FLAG);
    const holdMinGap = firing
      ? Math.max(minStandoff * 0.85, safeFireGap * 0.95)
      : safeFireGap;
    const holdMaxGap = firing
      ? Math.min(attackRange, maxFireGap * 1.08)
      : maxFireGap;

    if (inRange && gap >= holdMinGap && gap <= holdMaxGap) {
      setFlag(player.tracksCombat, AUTO_FIRING_FLAG, true);
      stopEntity(world, player);
      return;
    }

    // Out of the hold window — reposition to the ideal standoff gap. Too close
    // pushes the standoff point outward; too far pulls it inward (same formula).
    setFlag(player.tracksCombat, AUTO_FIRING_FLAG, false);
    const candidate: Vec2 = {
      x: targetPos.x - (dx / dist) * (idealGap + 32),
      y: targetPos.y - (dy / dist) * (idealGap + 32),
    };
    setEntityMotion(
      world,
      player,
      carefulPullingDest(
        world,
        player,
        target,
        clampToNode(world, player.hasPosition.nodeId, candidate),
      ),
    );
    return;
  }

  if (keepDist && !inCombat && dist > 0) {
    // Idle: retreat-only avoidance — hold still until an enemy enters personal
    // space, then step directly away. Never advance. (Skittish.)
    setFlag(player.tracksCombat, AUTO_FIRING_FLAG, false);
    if (gap <= AVOID_GAP) {
      const candidate: Vec2 = {
        x: playerPos.x - (dx / dist) * AVOID_GAP,
        y: playerPos.y - (dy / dist) * AVOID_GAP,
      };
      setEntityMotion(
        world,
        player,
        clampToNode(world, player.hasPosition.nodeId, candidate),
      );
    } else {
      stopEntity(world, player);
    }
    return;
  }

  // Melee / no keep-distance: close to a standoff a margin INSIDE reach rather
  // than the bare edge. Settling exactly at max range — most visible against a
  // stationary ranged mob that never closes the gap for us — leaves the player a
  // pixel of drift away from whiffing every swing while still being shot. Aim at
  // a buffered standoff (never past center, so fast movers don't tunnel through
  // the target at large dt) so small per-tick drift can't drop the player out of
  // effective range.
  const settleGap = Math.max(
    0,
    Math.min(attackRange - MELEE_CONTACT_MARGIN, attackRange * AUTO_SETTLE_FRAC),
  );
  if (gap <= settleGap || dist === 0) {
    stopEntity(world, player);
    return;
  }

  if (gap <= DIRECT_APPROACH_DIST) {
    // Close enough that A* routing is unnecessary: steer DIRECTLY to the firing
    // standoff so the nav goal-arrival epsilon (~24-48px) can't strand a
    // short-range build outside its own reach against a stationary target. Direct
    // motion resolves to the exact point (advanceMotion never overshoots), and
    // obstacle slide/depenetration still applies per movement step.
    const standoffAdvance = Math.max(0, Math.min(gap - settleGap, dist));
    const standoff: Vec2 = {
      x: playerPos.x + (dx / dist) * standoffAdvance,
      y: playerPos.y + (dy / dist) * standoffAdvance,
    };
    const directDestination = clampToNode(
      world,
      player.hasPosition.nodeId,
      standoff,
    );
    if (hasClearDirectApproach(world, player, directDestination)) {
      setEntityMotion(world, player, directDestination, { mode: "direct" });
      return;
    }
  }

  // Far approach: pathfind toward a point a slack deeper than the firing standoff
  // so the nav goal-arrival epsilon can't stop the player short of effective
  // range; the per-tick settleGap check above is the authoritative stop. Clamp so
  // we never aim past the target center (which would let fast movers tunnel).
  const aimGap = Math.max(0, settleGap - APPROACH_GOAL_SLACK);
  const advance = Math.max(0, Math.min(gap - aimGap, dist));
  const dest: Vec2 = {
    x: playerPos.x + (dx / dist) * advance,
    y: playerPos.y + (dy / dist) * advance,
  };
  setEntityMotion(
    world,
    player,
    carefulPullingDest(
      world,
      player,
      target,
      clampToNode(world, player.hasPosition.nodeId, dest),
    ),
  );
}
