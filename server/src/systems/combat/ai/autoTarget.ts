import type { World } from "../../../world/World";
import type { MonsterEntity, PlayerEntity } from "../../../ecs/entity";
import {
  MONSTER_DATABASE,
  distanceSq,
  getCounter,
  getFlag,
  hitboxGap,
  MELEE_CONTACT_MARGIN,
  moverOverlapsBlockShapes,
  pointInNodeFeatureShape,
  posHitboxFromEntity,
  RESOLVED_NODE_FEATURES,
  RUNE_CAREFUL_PULLING_MAX_THREAT_RADIUS,
  RUNE_CAREFUL_PULLING_MIN_THREAT_RADIUS,
  RUNE_CAREFUL_PULLING_SIDE_STEP,
  RUNE_KEEP_DISTANCE_GAP,
  RUNE_KEEP_DISTANCE_RANGED_BUFFER,
  setCounter,
  setFlag,
  type HitboxRect,
  type NodeFeatureShape,
  type PosHitbox,
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
  RUNE_EVADE_TELEGRAPH_FLAG,
  RUNE_KEEP_DISTANCE_FLAG,
  RUNE_TACTICAL_RELOAD_FLAG,
  RUNE_WAIT_FOR_EXECUTION_FLAG,
  RUNE_WAIT_FOR_REGEN_FLAG,
} from "./runeConfig";
import { steerOutOfTelegraphs } from "./telegraphEvasion";
import { steerOutOfPersistentHazards } from "./dynamicHazardAvoidance";
import { activeAvoidablePersistentGroundZones } from "../../world/groundZones";
import { isPlayerInCombat } from "./engagement";
import { holdsPositionWhileCasting } from "../../player/abilities/abilityCasting";

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

// ─── Keep-distance standoff ring ──────────────────────────────────────────────
//
// The standoff is solved as a RING around the target rather than a single point
// on the target→player ray. The radial solve had no answer whenever the one
// direction it could pick was unavailable — pinned against a node edge, behind a
// tree, or backing into a second mob — because `clampToNode` silently squashed
// the destination onto roughly the player's own position, which reads to the nav
// layer as "already there". The player then stood still and ate the fight.
//
// Sampling the whole ring turns every one of those into an ordinary scoring
// question: a blocked bearing simply loses to an open one, and the player slides
// along the wall (or around the trunk) instead of planting.

/** Bearings sampled per solve. 16 gives 22.5° resolution — fine enough that the
 *  chosen point is never visibly off the best one, coarse enough to stay cheap. */
const RING_SAMPLES = 16;

/**
 * How many of the cheaply-scored candidates get the expensive checks
 * (standable / hazard-free). Collision and feature queries are far dearer than
 * the arithmetic terms, so the ring is ranked on cheap terms first and only the
 * head of that ranking is verified. The cheap terms already encode most of the
 * ordering, so widening this changes the outcome rarely.
 */
const RING_FULL_CHECK_COUNT = 4;

/**
 * Iterations of the gap→center-distance solve. `idealGap` is EDGE-to-edge (it is
 * compared against `hitboxGap`), but a ring is defined in center space, so the
 * radius that achieves a wanted gap depends on both hitboxes and on the bearing.
 * Gap grows very nearly 1:1 with center distance, so this converges immediately;
 * three passes is comfortably exact for any hitbox in the database.
 */
const RING_GAP_SOLVE_ITERATIONS = 3;

/** Score weights, all in px-equivalent units so they compose additively. */
const RING_TRAVEL_WEIGHT = 1;
/** Damps large angular jumps between ticks. */
const RING_ANGULAR_WEIGHT = 120;
/**
 * Flat cost of reversing the established direction of travel around the ring.
 * This is the soft latch: the solve still re-decides every tick, but a one-tick
 * scoring tie cannot flip the player's heading — that churn is what the 5 Hz
 * broadcast samples as movement stutter.
 */
const RING_REVERSAL_PENALTY = 200;
/**
 * Below this angular delta a candidate is "the same place", so it neither
 * establishes nor reverses a direction of travel.
 */
const RING_SPIN_EPSILON = 0.15;
/** Other monsters push candidates away from themselves, inside this radius. */
const RING_MONSTER_THREAT_RADIUS = 320;
const RING_MONSTER_REPULSION_WEIGHT = 420;

/** Last chosen ring bearing (radians) and direction of travel around it (-1/0/+1). */
const RING_ANGLE_COUNTER = "rune.orbitAngle";
const RING_SPIN_COUNTER = "rune.orbitSpin";
/**
 * Bearings are stored biased by this so that an UNSET counter — `getCounter`
 * returns 0 for any key never written — is distinguishable from a genuine
 * bearing of 0 radians (due east). Without the bias the very first solve of a
 * fight would be told it had a previous heading of east and score against it.
 */
const RING_ANGLE_BIAS = 100;

interface RingCandidate {
  point: Vec2;
  angle: number;
  /** Signed angular delta from the previous bearing; 0 when there is none. */
  delta: number;
  cost: number;
}

/**
 * Center distance along `dir` at which the player's hitbox sits `wantGap`
 * edge-to-edge from `targetPH`.
 *
 * Solved numerically rather than as `wantGap + radii` because a hitbox is a set
 * of rects, not a circle: which rect pair is closest — and therefore how much
 * center distance a given gap costs — changes with the bearing. Treating a
 * gap-space value as a center-space distance is what put the old standoff
 * systematically off by the two bodies' extents.
 */
function centerDistanceForGap(
  playerRects: HitboxRect[],
  targetPH: PosHitbox,
  dir: Vec2,
  wantGap: number,
): number {
  let r = Math.max(1, wantGap);
  for (let i = 0; i < RING_GAP_SOLVE_ITERATIONS; i++) {
    const pos: Vec2 = {
      x: targetPH.pos.x + dir.x * r,
      y: targetPH.pos.y + dir.y * r,
    };
    const achieved = hitboxGap({ pos, rects: playerRects }, targetPH);
    if (!Number.isFinite(achieved)) break;
    r = Math.max(1, r + (wantGap - achieved));
  }
  return r;
}

/** True while `point` sits inside the node's walkable rectangle. */
function isInsideNode(world: World, nodeId: string, point: Vec2): boolean {
  const node = NODE_REGISTRY.get(nodeId);
  if (!node) return true;
  return (
    point.x >= NODE_MARGIN &&
    point.x <= node.width - NODE_MARGIN &&
    point.y >= NODE_MARGIN &&
    point.y <= node.height - NODE_MARGIN
  );
}

/**
 * Summed pressure from every monster on the node other than the one being
 * fought. Generalises the Careful Pulling nudge: that rule only considers
 * elites, and only when equipped, but backing into ANY second mob is a bad
 * standoff regardless of which runes are slotted.
 */
function ringMonsterPenalty(
  world: World,
  player: PlayerEntity,
  target: MonsterEntity,
  point: Vec2,
): number {
  let penalty = 0;
  for (const other of world.monsterEntitiesInNode(player.hasPosition.nodeId)) {
    if (other.entityId === target.entityId) continue;
    const d = Math.hypot(
      point.x - other.hasPosition.current.x,
      point.y - other.hasPosition.current.y,
    );
    if (d >= RING_MONSTER_THREAT_RADIUS) continue;
    const pressure = (RING_MONSTER_THREAT_RADIUS - d) / RING_MONSTER_THREAT_RADIUS;
    penalty += pressure * RING_MONSTER_REPULSION_WEIGHT;
  }
  return penalty;
}

/** Shortest signed angle from `from` to `to`, in (-PI, PI]. */
function signedAngleDelta(from: number, to: number): number {
  let d = to - from;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d <= -Math.PI) d += Math.PI * 2;
  return d;
}

/**
 * Choose a standoff point on the ring of edge-to-edge radius `wantGap` around
 * `target`.
 *
 * Cheap terms rank every bearing; the expensive geometry checks then run down
 * that ranking until one candidate survives. Returns null when nothing on the
 * ring is usable — the caller falls back to the old radial behaviour, so a
 * player boxed into a corner degrades to the previous conduct rather than
 * freezing.
 */
function solveStandoffRing(
  world: World,
  player: PlayerEntity,
  target: MonsterEntity,
  wantGap: number,
  opts: { retreatOnly: boolean },
  now: number,
): Vec2 | null {
  const playerPos = player.hasPosition.current;
  const nodeId = player.hasPosition.nodeId;
  const targetPH = posHitboxFromEntity(target);
  const playerRects = posHitboxFromEntity(player).rects;

  const storedAngle = getCounter(player.tracksCombat, RING_ANGLE_COUNTER);
  const hasPrev = storedAngle !== 0;
  const prevAngle = storedAngle - RING_ANGLE_BIAS;
  const prevSpin = getCounter(player.tracksCombat, RING_SPIN_COUNTER);

  // Retreat-only (the idle rule) may never pick a bearing that closes distance.
  const currentCenterDist = Math.hypot(
    playerPos.x - targetPH.pos.x,
    playerPos.y - targetPH.pos.y,
  );

  // Start from the player's own bearing so "hold roughly where I am" is always
  // among the samples and wins on travel cost when it is viable.
  const baseAngle = Math.atan2(
    playerPos.y - targetPH.pos.y,
    playerPos.x - targetPH.pos.x,
  );

  const scored: RingCandidate[] = [];
  for (let i = 0; i < RING_SAMPLES; i++) {
    const angle = baseAngle + (i * Math.PI * 2) / RING_SAMPLES;
    const dir: Vec2 = { x: Math.cos(angle), y: Math.sin(angle) };
    const radius = centerDistanceForGap(playerRects, targetPH, dir, wantGap);
    const point: Vec2 = {
      x: targetPH.pos.x + dir.x * radius,
      y: targetPH.pos.y + dir.y * radius,
    };

    // Node bounds are a REJECT, not a clamp. Squashing an out-of-node point back
    // onto the boundary is precisely how the old solve produced a destination the
    // player was already standing on.
    if (!isInsideNode(world, nodeId, point)) continue;
    if (opts.retreatOnly && radius < currentCenterDist) continue;

    const delta = hasPrev ? signedAngleDelta(prevAngle, angle) : 0;
    let cost =
      Math.hypot(point.x - playerPos.x, point.y - playerPos.y) * RING_TRAVEL_WEIGHT;
    cost += ringMonsterPenalty(world, player, target, point);
    if (hasPrev) {
      cost += (Math.abs(delta) / Math.PI) * RING_ANGULAR_WEIGHT;
      const reverses =
        prevSpin !== 0 &&
        Math.abs(delta) > RING_SPIN_EPSILON &&
        Math.sign(delta) !== prevSpin;
      if (reverses) cost += RING_REVERSAL_PENALTY;
    }
    scored.push({ point, angle, delta, cost });
  }

  scored.sort((a, b) => a.cost - b.cost);

  let checked = 0;
  for (const candidate of scored) {
    if (checked >= RING_FULL_CHECK_COUNT) break;
    checked++;
    if (!isStandablePoint(world, player, candidate.point)) continue;
    if (playerHazardContainingPoint(world, nodeId, candidate.point, now)) continue;

    setCounter(
      player.tracksCombat,
      RING_ANGLE_COUNTER,
      candidate.angle + RING_ANGLE_BIAS,
    );
    if (Math.abs(candidate.delta) > RING_SPIN_EPSILON) {
      setCounter(player.tracksCombat, RING_SPIN_COUNTER, Math.sign(candidate.delta));
    }
    return candidate.point;
  }
  return null;
}

/**
 * Drive `player` to a solved standoff point.
 *
 * Mirrors the approach path's two-mode delivery, which the keep-distance branch
 * never had. Both modes exist because the nav layer treats a mover as arrived
 * within `PATH_GOAL_EPSILON` (~48px) of its goal: close in, that epsilon is the
 * entire standoff band, so pathing alone can strand a player just outside its own
 * attack range against anything that will not close the gap for it.
 */
function driveToStandoff(
  world: World,
  player: PlayerEntity,
  target: MonsterEntity,
  dest: Vec2,
  minCenterDist: number,
): void {
  const playerPos = player.hasPosition.current;
  const travel = Math.hypot(dest.x - playerPos.x, dest.y - playerPos.y);
  if (travel <= 0) {
    stopEntity(world, player);
    return;
  }

  if (travel <= DIRECT_APPROACH_DIST && hasClearDirectApproach(world, player, dest)) {
    // Short correction: steer DIRECTLY so the radius lands pixel-exact instead of
    // at nav resolution. This is the fix for a standoff that settles just outside
    // its own attack range and then oscillates there.
    setEntityMotion(world, player, dest, { mode: "direct" });
    return;
  }

  // Longer correction: pathfind, but aim a slack PAST the standoff so the goal
  // epsilon cannot stop the player short of it. The per-tick hold-band check is
  // the authoritative stop, exactly as on the approach path.
  const ux = (dest.x - playerPos.x) / travel;
  const uy = (dest.y - playerPos.y) / travel;
  const pushed: Vec2 = {
    x: dest.x + ux * APPROACH_GOAL_SLACK,
    y: dest.y + uy * APPROACH_GOAL_SLACK,
  };
  // Overshooting outward is harmless, but overshooting INWARD would aim the
  // player deeper than the standoff it just solved for — clamp against that.
  const targetPos = target.hasPosition.current;
  const pushedDist = Math.hypot(pushed.x - targetPos.x, pushed.y - targetPos.y);
  const goal =
    pushedDist >= minCenterDist &&
    isInsideNode(world, player.hasPosition.nodeId, pushed) &&
    isStandablePoint(world, player, pushed)
      ? pushed
      : dest;
  setEntityMotion(world, player, goal);
}

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

/**
 * Whether `point` is somewhere the player could actually stand.
 *
 * A path goal INSIDE a blocker is worse than useless: the nav layer snaps the goal
 * cell to the nearest WALKABLE cell, and for a target directly behind an obstacle
 * that nearest cell is back on the mover's own side. The player then walks a few
 * px, lands inside the goal-arrival epsilon, clears the path, re-derives the same
 * unreachable goal next tick, and oscillates against the obstacle forever instead
 * of routing around it.
 */
function isStandablePoint(
  world: World,
  player: PlayerEntity,
  point: Vec2,
): boolean {
  const shapes = world.collision.blockShapes(
    player.hasPosition.nodeId,
    "player",
  );
  return !moverOverlapsBlockShapes(
    point,
    shapes,
    navigationPadForEntity(player),
  );
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
function playerHazardContainingPoint(
  world: World,
  nodeId: string,
  pos: Vec2,
  now: number,
): NodeFeatureShape | null {
  for (const feature of RESOLVED_NODE_FEATURES[nodeId] ?? []) {
    if (!feature.damage?.targets.includes("player")) continue;
    if (pointInNodeFeatureShape(pos, feature.shape)) return feature.shape;
  }
  for (const zone of activeAvoidablePersistentGroundZones(world, nodeId, now)) {
    const shape: NodeFeatureShape = {
      kind: "circle",
      x: zone.pos.x,
      y: zone.pos.y,
      radius: zone.radius,
    };
    if (pointInNodeFeatureShape(pos, shape)) return shape;
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
    // Map navigation normally leaves auto-combat off. Fight Back temporarily
    // grants the existing auto-target loop authority while preserving that user
    // preference and the original navigation path.
    if (!player.usesAutocombat.auto && !player.fightsWhileTraveling) continue;
    if (player.hasManualMoveIntent) continue;

    // Active escape remains higher priority than voluntary recovery/maintenance.
    if (player.isFleeing) {
      stepFlee(world, player, now);
      continue;
    }

    // A Step Back response owns movement through authoritative telegraph end.
    // Once geometrically safe it stops issuing motion, but Chase/Orbit still
    // yield so they cannot undo the dodge before the attack resolves.
    if (getFlag(player.tracksCombat, RUNE_EVADE_TELEGRAPH_FLAG)) {
      setFlag(player.tracksCombat, AUTO_FIRING_FLAG, false);
      steerOutOfTelegraphs(world, player);
      continue;
    }

    // Persistent terrain is the next temporary movement owner. It is deliberately
    // below Step Back (an imminent resolving hit) and above ordinary Chase/Orbit.
    // The response latches until an authoritative safe position is observed.
    if (
      getFlag(player.tracksCombat, RUNE_AVOID_NODE_HAZARDS_FLAG) &&
      steerOutOfPersistentHazards(world, player, now)
    ) {
      setFlag(player.tracksCombat, AUTO_FIRING_FLAG, false);
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

    if (player.hasAutoTraversePath && !player.fightsWhileTraveling) {
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
      stepFlee(world, player, now);
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
  // A cast that reaches FURTHER than the player does is delivered from out there:
  // walking into normal reach mid-wind-up would throw away the only thing the
  // extra range bought. Ordinary casts (no range bonus) keep moving with the
  // fight, so this never fights rune-driven pathing for anything else.
  if (holdsPositionWhileCasting(player)) {
    setFlag(player.tracksCombat, AUTO_FIRING_FLAG, false);
    stopEntity(world, player);
    return;
  }

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
      world,
      player.hasPosition.nodeId,
      targetPos,
      now,
    );
    const playerHazard = playerHazardContainingPoint(
      world,
      player.hasPosition.nodeId,
      playerPos,
      now,
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

  // The mob can hit us at or below its own reach (same edge-to-edge gap combat
  // uses). Keep-distance exists to stand beyond it whenever we can still fire.
  const mobReach = target.performsAttack.attackRange;
  const maxFireGap = attackRange * 0.92;            // farthest we reliably fire
  const minStandoff = Math.min(maxFireGap, attackRange * 0.72);
  // Smallest gap that is both safe (past the mob's reach) and within our firing
  // range.
  const safeFireGap = Math.min(maxFireGap, mobReach + RANGED_SAFE_BUFFER);

  // When the mob out-reaches us there is no gap that is both safe and firing, so
  // the rule's whole promise is unsatisfiable. Holding at our farthest firing
  // distance — the old safeguard — buys nothing (we are shot at every gap) and
  // parks the player in a band only 8% of attack range wide, where the nav goal
  // epsilon alone is enough to drift us out of our own reach and strand us there,
  // because nothing that out-ranges us will close the gap on its own. Keep
  // Distance yields the movement channel instead and the ordinary approach path
  // below closes to a settled standoff, which is the only real answer to being
  // out-ranged. A yield, not a disengage — the fight continues.
  const outranged = mobReach + RANGED_SAFE_BUFFER > maxFireGap;
  if (keepDist && inCombat && outranged) {
    setFlag(player.tracksCombat, AUTO_FIRING_FLAG, false);
  }

  if (keepDist && inCombat && !outranged && dist > 0) {
    // In combat: hold a standoff gap and reposition on a ring around the target,
    // moving both toward and away to stay in firing range. (Kiter / Desperate
    // Kiter.)
  const idealGap = Math.max(minStandoff, safeFireGap);
    const inRange = world.collision.canReach(player, target, attackRange);

    // Hysteresis widens the hold window once firing, but the lower bound never
    // drops below the safe-fire gap, so a latched player can't creep back inside
    // a ranged mob's reach — the "out of position but still getting hit" case.
    const firing = getFlag(player.tracksCombat, AUTO_FIRING_FLAG);
    const holdMinGap = firing
      ? Math.max(minStandoff * 0.85, safeFireGap * 0.95)
      : safeFireGap;
    const holdMaxGap = firing
      ? Math.min(attackRange, maxFireGap * 1.08)
      : maxFireGap;

    if (inRange && gap >= holdMinGap && gap <= holdMaxGap) {
      setFlag(player.tracksCombat, AUTO_FIRING_FLAG, true);
      // Remember where we are holding. A hold can last many ticks, and the
      // continuity term must score against the bearing we are actually on when
      // motion resumes, not the one we last solved for.
      setCounter(
        player.tracksCombat,
        RING_ANGLE_COUNTER,
        Math.atan2(playerPos.y - targetPos.y, playerPos.x - targetPos.x) +
          RING_ANGLE_BIAS,
      );
      stopEntity(world, player);
      return;
    }

    // Out of the hold window — reposition onto the standoff ring. Too close and
    // too far are the same solve; the ring merely also has an answer when the
    // straight-back bearing is unusable.
    setFlag(player.tracksCombat, AUTO_FIRING_FLAG, false);
    const solved = solveStandoffRing(
      world,
      player,
      target,
      idealGap,
      { retreatOnly: false },
      now,
    );
    if (solved) {
      // Never let the pathing overshoot aim us deeper than the minimum standoff.
      const inward = {
        x: (playerPos.x - targetPos.x) / dist,
        y: (playerPos.y - targetPos.y) / dist,
      };
      const minCenterDist = centerDistanceForGap(
        playerPH.rects,
        targetPH,
        inward,
        minStandoff,
      );
      driveToStandoff(
        world,
        player,
        target,
        carefulPullingDest(world, player, target, solved),
        minCenterDist,
      );
      return;
    }

    // Nothing on the ring is usable (boxed into a corner by a pack): fall back
    // to the original radial solve so behaviour degrades to what it was rather
    // than to standing still.
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
    // space, then give ground. Never advance. (Skittish.)
    setFlag(player.tracksCombat, AUTO_FIRING_FLAG, false);
    if (gap <= AVOID_GAP) {
      const solved = solveStandoffRing(
        world,
        player,
        target,
        AVOID_GAP,
        { retreatOnly: true },
        now,
      );
      if (solved) {
        const minCenterDist = Math.hypot(
          playerPos.x - targetPos.x,
          playerPos.y - targetPos.y,
        );
        driveToStandoff(world, player, target, solved, minCenterDist);
        return;
      }
      // Cornered with nowhere on the ring to give ground to: keep the original
      // step-directly-away so the behaviour degrades rather than freezing.
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
  const aimed: Vec2 = {
    x: playerPos.x + (dx / dist) * advance,
    y: playerPos.y + (dy / dist) * advance,
  };
  // That standoff is derived along the straight line to the target, so whenever the
  // target hugs the far side of an obstacle the point lands INSIDE it — most easily
  // when `attackRange` is small enough that APPROACH_GOAL_SLACK zeroes `aimGap` and
  // the aim advances the whole gap. Fall back to the target's own position, which
  // is standable by construction and which the nav layer routes around correctly.
  // The per-tick `settleGap` check above is the real stop, so aiming at the target
  // does not overshoot.
  const dest: Vec2 = isStandablePoint(world, player, aimed)
    ? aimed
    : targetPos;
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
