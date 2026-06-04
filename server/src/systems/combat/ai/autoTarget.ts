import type { World } from "../../../world/World";
import type { MonsterEntity, PlayerEntity } from "../../../ecs/entity";
import {
  approachPoint,
  GAME_CONFIG,
  getCounter,
  getFlag,
  hitboxGap,
  inAttackRange,
  posHitboxFromEntity,
  setCounter,
  setFlag,
  type Vec2,
} from "@mmo-idle/shared";
import { NODE_REGISTRY } from "../../../world/nodeRegistry";
import { setEntityMotion, stopEntity } from "../../world/movement";
import { isPartyFollower } from "../../player/party/partySystem";
import { beginFlee, stepFlee } from "./flee";
import { selectAutoCombatAction } from "./targetPriority";
import { RUNE_KEEP_DISTANCE_FLAG } from "./runeConfig";

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
 */
const AVOID_GAP = 220;

// ── Explore wander ──────────────────────────────────────────────────────────
// When auto-combat finds no target inside the acquire radius the player enters
// the "exploring" state: it roams the current node to look for new targets.
// Leaving the node/biome is owned by the explore rune (updateAutoTraverse) —
// this only wanders in-place. The wander loop mirrors monster wander: hop to a
// nearby point, pause on arrival, repeat.

/** Max distance (px) of a single explore wander hop from the current position. */
const WANDER_HOP_RADIUS = 480;
/** Idle pause bounds (ms) between wander hops. */
const WANDER_IDLE_MIN_MS = 700;
const WANDER_IDLE_MAX_MS = 1800;

/** True while the player is mid-hop toward a chosen explore wander point. */
const WANDER_ACTIVE_FLAG = "explore.wandering";
/** Earliest timestamp (ms) at which the next wander hop may begin. */
const WANDER_NEXT_AT = "explore.nextWanderAt";

function randBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/**
 * Drive the in-node "exploring" roam for an idle auto-combat player. Hops to a
 * random nearby point, pauses briefly on arrival, then hops again — until a
 * target enters the acquire radius and the scorer takes over.
 */
function stepExploreWander(world: World, player: PlayerEntity, now: number): void {
  // Mid-hop: let the movement system carry the player to the wander point.
  if (player.isMoving) return;

  const tc = player.tracksCombat;

  // Just arrived from a hop — start an idle pause before the next one.
  if (getFlag(tc, WANDER_ACTIVE_FLAG)) {
    setFlag(tc, WANDER_ACTIVE_FLAG, false);
    setCounter(
      tc,
      WANDER_NEXT_AT,
      now + randBetween(WANDER_IDLE_MIN_MS, WANDER_IDLE_MAX_MS),
    );
    stopEntity(world, player);
    return;
  }

  // Still pausing between hops.
  if (now < getCounter(tc, WANDER_NEXT_AT)) {
    stopEntity(world, player);
    return;
  }

  // Pick a new wander point near the player and start the next hop.
  const pos = player.hasPosition.current;
  const angle = Math.random() * 2 * Math.PI;
  const radius = Math.random() * WANDER_HOP_RADIUS;
  const candidate: Vec2 = {
    x: pos.x + Math.cos(angle) * radius,
    y: pos.y + Math.sin(angle) * radius,
  };
  setFlag(tc, WANDER_ACTIVE_FLAG, true);
  setEntityMotion(
    world,
    player,
    clampToNode(world, player.hasPosition.nodeId, candidate),
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
 * "In combat" for steering decisions: an active attack target, or recent
 * engagement within the combat-regen grace window. Matches the predicate used
 * by `updateRuneDerivedConfig` so kite-vs-avoid agrees with the rune fold.
 */
function isPlayerInCombat(player: PlayerEntity, now: number): boolean {
  if (player.hasAttackTarget !== undefined) return true;
  const last = player.tracksEngagement;
  return last !== undefined && now - last < GAME_CONFIG.COMBAT_REGEN_DELAY;
}

export function updateAutoTargets(world: World, now: number) {
  for (const player of world.livePlayers) {
    if (!player.usesAutocombat.auto) continue;
    // Party followers are steered by updatePartyFollow, not by their own targeting.
    if (isPartyFollower(player)) continue;
    if (player.hasManualMoveIntent) continue;
    // CannotAttack players (summoners; anyone whose range fell below 1px) still
    // route to mobs here — the marker only blocks the *direct* strike in
    // combat.ts. A summoner does its combat through summons as a proxy: the
    // player approaches the target and its leashed minions engage.

    if (player.hasAutoTraversePath) {
      if (player.hasAutoTraversePath.targetNodeId !== player.hasPosition.nodeId)
        continue;
    }

    if (player.isFleeing) {
      stepFlee(world, player);
      continue;
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
      // idle — nothing within acquire range. Enter the exploring state and roam
      // the current node looking for new targets. Leaving the node/biome stays
      // owned by the explore rune (updateAutoTraverse).
      setFlag(player.tracksCombat, AUTO_FIRING_FLAG, false);
      stepExploreWander(world, player, now);
    }
  }
}

/**
 * Move `player` into attacking position against `target`, matching the auto-combat
 * approach rules: ranged players kite to an ideal gap; melee players close to
 * contact; an OOC-reloading player with no aggro on the target holds still.
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

  // Reload OOC hold: partial-clip reload while out of combat — stay put until
  // something aggros. In combat, keep pathing toward the auto target between clips.
  if (
    player.usesReload &&
    player.usesReload.reloadingMs > 0 &&
    !targetIsAggroed &&
    !isPlayerInCombat(player, now)
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
  const inCombat = isPlayerInCombat(player, now);

  if (keepDist && inCombat && dist > 0) {
    // In combat: full kite formula — reposition to the ideal standoff gap,
    // moving both toward and away to stay in firing range. (Kiter / Desperate
    // Kiter.)
    const minSafeGap = Math.min(
      attackRange * 0.82,
      target.performsAttack.attackRange + 45,
    );
    const idealGap = Math.max(minSafeGap + 20, attackRange * 0.72);
    const maxFireGap = attackRange * 0.92;
    const inRange = inAttackRange(playerPH, targetPH, attackRange);

    // Hysteresis: once latched (firing), widen the acceptable gap window so the
    // player keeps holding through small target drift instead of re-issuing a
    // motion target every tick.
    const firing = getFlag(player.tracksCombat, AUTO_FIRING_FLAG);
    const holdMinGap = firing ? minSafeGap * 0.85 : minSafeGap;
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
      clampToNode(world, player.hasPosition.nodeId, candidate),
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

  // Melee / no keep-distance: close to a standoff just inside reach instead of
  // charging the target
  // center, which makes fast movers tunnel through the target at large dt (they
  // swap sides and never settle inside the narrow edge-to-edge reach band).
  const approach = approachPoint(playerPos, playerPH, targetPos, targetPH, attackRange);
  if (approach.inRange) {
    stopEntity(world, player);
    return;
  }

  setEntityMotion(
    world,
    player,
    clampToNode(world, player.hasPosition.nodeId, approach.dest),
  );
}
