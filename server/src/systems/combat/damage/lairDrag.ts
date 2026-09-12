/**
 * DEATHROLL DRAG — the haul, and only the haul.
 *
 * A crocodile does not fight you where you stand; it takes you into the water. The
 * charged `dragsToLair` rider is what starts this, and everything after the grab
 * lives here: the monster backing toward its pool, the victim coming with it, and
 * the release when the jaws let go.
 *
 * It is modelled on `updateKnockback` on purpose — a component whose PRESENCE hands
 * one system exclusive ownership of a monster's position for a bounded window, with
 * the AI and the combat loop standing down until it detaches. That contract already
 * exists and is already respected; inventing a second one for "the mob is busy" is
 * how two systems end up writing the same position in the same tick.
 *
 * The victim is moved through `pullPlayer`, never by writing coordinates, so
 * knockback resistance, node bounds and obstacle resolution apply to every step of a
 * drag exactly as they do to one shove.
 */

import {
  applyStatusEffect,
  getStatusEffect,
  nearestSwampRotPool,
  removeStatusEffect,
  type MonsterDefinition,
  type Vec2,
} from "@mmo-idle/shared";
import type { MonsterEntity, PlayerEntity } from "../../../ecs/entity";
import { attachComponent, detachComponent } from "../../../ecs/markerHelpers";
import { markSliceDirty } from "../../../ecs/dirtyHelpers";
import type { World } from "../../../world/World";
import { canApplyPlayerDebuff } from "../status/debuffGuard";
import { harmfulStatusDurationMult } from "../status/harmfulStatus";
import { isMonsterFrozen } from "../../classes/archetypes/dot/t3/core/selectors";
import { isMonsterStunned } from "../status/stun";
import { stopEntity } from "../../world/movement";
import { isMonsterKnockedBack } from "./knockback";
import { pullPlayer } from "./forcedMovement";

/**
 * How close to the lair's centre counts as arrived. The pools are large, so this is
 * deliberately not the rim — the drag ends when the victim is properly IN the water
 * rather than the moment they touch it, which is the difference between a hazard
 * they clipped and a hazard they are standing in.
 */
const ARRIVAL_MARGIN = 90;

/** Cadence of the muck-wake cue, so the trail is drag-time and not tick-rate. */
const WAKE_INTERVAL_MS = 320;

type DragSpec = NonNullable<
  NonNullable<MonsterDefinition["chargedAttack"]>["dragsToLair"]
>;

/** True while this monster owns a player in its jaws. */
export function isDraggingPrey(monster: MonsterEntity): boolean {
  return monster.dragsPrey !== undefined;
}

/**
 * Start a haul. Returns false — changing nothing — when there is no lair to drag to,
 * which is the honest outcome on a node with no water: the bite simply lands and the
 * ability degrades to its root, rather than the player being hauled to a made-up
 * point.
 */
export function beginLairDrag(
  world: World,
  monster: MonsterEntity,
  player: PlayerEntity,
  spec: DragSpec,
  now: number,
): boolean {
  if (!canApplyPlayerDebuff(player)) return false;
  // ONE SET OF JAWS AT A TIME. Two lurkers hauling the same victim toward different
  // pools is a tug of war that resolves to neither drag, and leaves two components
  // fighting over one root. The second bite simply lands, which is honest enough.
  for (const other of world.draggingMonsters) {
    if (other.dragsPrey.targetId === player.isPlayer.id) return false;
  }
  const lair = nearestSwampRotPool(
    monster.hasPosition.nodeId,
    monster.hasPosition.current,
    spec.maxLairRange,
  );
  if (!lair) return false;

  // The haul owns the root for its full length, so the victim is never freed
  // mid-drag and never held after the jaws open. Tenacity shortens the root the way
  // it shortens any other monster control — and because the drag releases when the
  // root would have, it shortens the drag with it.
  const rootMs = Math.round(spec.durationMs * harmfulStatusDurationMult(player));
  applyStatusEffect(player.tracksCombat, {
    id: "slow",
    maxStacks: 1,
    remainingMs: rootMs,
    refreshable: true,
    sourceId: monster.isMonster.id,
    data: { speedMult: 0, totalMs: rootMs },
  });

  attachComponent(world, monster, "dragsPrey", {
    targetId: player.isPlayer.id,
    destination: { x: lair.x, y: lair.y },
    speed: spec.speed,
    endsAt: now + rootMs,
    lastWakeAt: now,
  });
  stopEntity(world, monster);
  world.pushEvent(monster.hasPosition.nodeId, {
    kind: "monster-drag",
    monsterId: monster.isMonster.id,
    playerId: player.isPlayer.id,
    pos: { x: lair.x, y: lair.y },
    durationMs: rootMs,
    phase: "start",
  });
  return true;
}

/**
 * Release the jaws, and the legs with them.
 *
 * The root exists ONLY for the grip, so every way the haul can end frees the victim:
 * a stunned crocodile that still held you would punish the interrupt it exists to
 * reward, and a short haul into close water would otherwise leave you pinned in a
 * poison pool by a creature that let go seconds ago. When the haul simply ran its
 * clock out the root expired on the same tick and this is a no-op.
 */
function endDrag(world: World, monster: MonsterEntity): void {
  const drag = monster.dragsPrey;
  if (!drag) return;
  const player = world.getPlayerEntity(drag.targetId);
  if (player) {
    const root = getStatusEffect(player.tracksCombat, "slow");
    // Only OUR root. A separate slow from another mob has to survive the release.
    if (
      root?.sourceId === monster.isMonster.id &&
      (root.data["speedMult"] ?? 1) === 0
    ) {
      removeStatusEffect(player.tracksCombat, "slow");
    }
  }
  world.pushEvent(monster.hasPosition.nodeId, {
    kind: "monster-drag",
    monsterId: monster.isMonster.id,
    playerId: drag.targetId,
    pos: { ...drag.destination },
    durationMs: 0,
    phase: "end",
  });
  detachComponent(world, monster, "dragsPrey");
  stopEntity(world, monster);
}

function dist(a: Vec2, b: Vec2): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * Advance every active haul by `dt` ms. Runs alongside `updateKnockback`, BEFORE
 * movement and AI, so the position it writes is the one the tick broadcasts.
 */
export function updateLairDrags(world: World, dt: number, now: number): void {
  for (const monster of [...world.draggingMonsters]) {
    const drag = monster.dragsPrey;

    // The counterplay: break the crocodile and it lets go. Freeze counts here even
    // though it is only a severe slow elsewhere — a frozen jaw cannot haul.
    if (
      isMonsterStunned(world, monster.isMonster.id) ||
      isMonsterFrozen(world, monster.isMonster.id) ||
      isMonsterKnockedBack(world, monster.isMonster.id) ||
      monster.isRooted
    ) {
      endDrag(world, monster);
      continue;
    }

    const player = world.getPlayerEntity(drag.targetId);
    if (
      !player ||
      player.isDead ||
      player.hasPosition.nodeId !== monster.hasPosition.nodeId
    ) {
      endDrag(world, monster);
      continue;
    }

    if (now >= drag.endsAt) {
      endDrag(world, monster);
      continue;
    }

    const step = (drag.speed * dt) / 1000;
    const from = monster.hasPosition.current;
    const remaining = dist(from, drag.destination);

    // The monster backs into its own water. It writes its position directly, like a
    // knockback slide, rather than issuing a move intent — a drag routed through
    // pathfinding would have the AI's chase logic arguing with it every tick.
    if (remaining > ARRIVAL_MARGIN) {
      const travel = Math.min(step, remaining - ARRIVAL_MARGIN);
      monster.hasPosition.current = {
        x: from.x + ((drag.destination.x - from.x) / remaining) * travel,
        y: from.y + ((drag.destination.y - from.y) / remaining) * travel,
      };
      markSliceDirty(world, monster, "hasPosition");
      stopEntity(world, monster);
    }

    // The victim comes along behind the jaws. Anchoring on the MONSTER rather than
    // on the lair is what makes this read as being dragged: `pullPlayer` stops short
    // of its anchor, so the player trails at a fixed gap instead of sliding along an
    // invisible line toward a point they cannot see.
    pullPlayer(world, player, monster.hasPosition.current, step);

    if (now - drag.lastWakeAt >= WAKE_INTERVAL_MS) {
      drag.lastWakeAt = now;
      world.pushEvent(monster.hasPosition.nodeId, {
        kind: "monster-drag",
        monsterId: monster.isMonster.id,
        playerId: drag.targetId,
        pos: { ...player.hasPosition.current },
        durationMs: 0,
        phase: "wake",
      });
    }

    // Arrived: the prey is in the water. Whatever the pool does to them from here is
    // the pool's job, not the crocodile's.
    if (dist(monster.hasPosition.current, drag.destination) <= ARRIVAL_MARGIN) {
      endDrag(world, monster);
    }
  }
}
