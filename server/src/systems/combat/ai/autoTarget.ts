import type { World } from "../../../world/World";
import type { MonsterEntity, PlayerEntity } from "../../../ecs/entity";
import {
  approachPoint,
  GAME_CONFIG,
  getFlag,
  hitboxGap,
  posHitboxFromEntity,
  setFlag,
  type Vec2,
} from "@mmo-idle/shared";
import { NODE_REGISTRY } from "../../../world/nodeRegistry";
import { setEntityMotion, stopEntity } from "../../world/movement";
import { isEffectivePartyFollower } from "../../player/party/partySystem";
import { beginFlee, stepFlee } from "./flee";
import {
  nearestEngageableMonster,
  selectAutoCombatAction,
} from "./targetPriority";
import {
  RUNE_FOLLOW_LEADER_FLAG,
  RUNE_KEEP_DISTANCE_FLAG,
  RUNE_WAIT_FOR_REGEN_FLAG,
} from "./runeConfig";

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

    // Rune-following party members are steered by updatePartyFollow. Followers
    // without that rule fall through and use their own targeting rules.
    if (
      isEffectivePartyFollower(world, player) &&
      getFlag(player.tracksCombat, RUNE_FOLLOW_LEADER_FLAG)
    ) {
      continue;
    }
    if (player.hasManualMoveIntent) continue;
    // CannotAttack players (summoners; anyone whose range fell below 1px) still
    // route to mobs here — the marker only blocks the *direct* strike in
    // combat.ts. A summoner does its combat through summons as a proxy: the
    // player approaches the target and its leashed minions engage.

    if (player.hasAutoTraversePath) {
      if (player.hasAutoTraversePath.targetNodeId !== player.hasPosition.nodeId) {
        continue;
      }
    }

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
    const inRange = world.collision.canReach(player, target, attackRange);

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
    clampToNode(world, player.hasPosition.nodeId, targetPos),
  );
}
