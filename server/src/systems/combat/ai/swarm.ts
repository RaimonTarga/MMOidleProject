import { distanceSq, MONSTER_DATABASE } from "@mmo-idle/shared";
import type { MonsterEntity } from "../../../ecs/entity";
import type { World } from "../../../world/World";
import { markSliceDirty } from "../../../ecs/dirtyHelpers";

/**
 * Swarm convergence. Runs AFTER `updateMonsters`, which leaves moving mobs with a
 * heading toward their current target. Moving swarm mobs are partitioned into
 * small local flocklets, then each flocklet blends a light boids steer —
 * separation from crowded mates + cohesion toward the group centroid — directly
 * into the per-tick motion DIRECTION (renormalized, magnitude untouched).
 *
 * We deliberately bend the heading rather than nudging the nav goal: a small goal
 * offset is swallowed by the pathfinder's replan epsilon (`PATH_GOAL_EPSILON_SQ`),
 * whereas a direction blend always takes effect for the next movement step and
 * naturally re-applies every tick. Turns "many mobs pick unrelated wander/chase
 * lines" into "small packs move like loose herds". Position-derived →
 * deterministic; no speed/leash change.
 *
 * Only mobs with a `swarm` def AND in a moving ecology state are touched; everything
 * else is left exactly as `updateMonsters` decided.
 */
const SEP_WEIGHT = 1.5; // separation outweighs cohesion in the steer
const STEER_BLEND = 0.45; // how hard the swarm bends the chase heading
const MAX_SWARM_PACK_SIZE = 4;
const LOOSE_SWARM_LINK_RANGE = 260;

export function updateSwarm(world: World): void {
  const byGroup = new Map<string, MonsterEntity[]>();
  for (const e of world.monsterEntities) {
    if (!e.isMoving || !isSwarmMoveState(e.hasAwareness.state)) continue;
    const def = MONSTER_DATABASE.get(e.isMonster.monsterTypeId);
    if (!def?.swarm) continue;
    const packKey = e.inPack ? `pack:${e.inPack.packId}` : "loose";
    const key = `${e.hasPosition.nodeId}:${def.biome}:${e.hasAwareness.state}:${packKey}`;
    const arr = byGroup.get(key);
    if (arr) arr.push(e);
    else byGroup.set(key, [e]);
  }

  for (const candidates of byGroup.values()) {
    const groups = candidates.some((m) => m.inPack)
      ? splitNearest(candidates, Number.POSITIVE_INFINITY)
      : splitNearest(candidates, LOOSE_SWARM_LINK_RANGE);
    for (const mobs of groups) {
      applySwarmSteer(world, mobs);
    }
  }
}

function applySwarmSteer(world: World, mobs: MonsterEntity[]): void {
  if (mobs.length < 2) return;

  let cx = 0;
  let cy = 0;
  for (const m of mobs) {
    cx += m.hasPosition.current.x;
    cy += m.hasPosition.current.y;
  }
  cx /= mobs.length;
  cy /= mobs.length;

  for (const e of mobs) {
    const moving = e.isMoving;
    if (!moving) continue;
    const swarm = MONSTER_DATABASE.get(e.isMonster.monsterTypeId)!.swarm!;
    const pos = e.hasPosition.current;

    // Separation: unit-sum of directions away from too-close mates.
    let sx = 0;
    let sy = 0;
    const sepSq = swarm.separation * swarm.separation;
    for (const other of mobs) {
      if (other === e) continue;
      const dx = pos.x - other.hasPosition.current.x;
      const dy = pos.y - other.hasPosition.current.y;
      const d2 = dx * dx + dy * dy;
      if (d2 > 0 && d2 < sepSq) {
        const d = Math.sqrt(d2);
        sx += dx / d;
        sy += dy / d;
      }
    }

    // Cohesion: unit direction toward the group centroid, weighted.
    const toCx = cx - pos.x;
    const toCy = cy - pos.y;
    const cMag = Math.hypot(toCx, toCy) || 1;

    let steerX = sx * SEP_WEIGHT + (toCx / cMag) * swarm.cohesion;
    let steerY = sy * SEP_WEIGHT + (toCy / cMag) * swarm.cohesion;
    const sMag = Math.hypot(steerX, steerY);
    if (sMag < 1e-3) continue;
    steerX /= sMag;
    steerY /= sMag;

    const dir = moving.motion.direction;
    const bx = dir.x + steerX * STEER_BLEND;
    const by = dir.y + steerY * STEER_BLEND;
    const bMag = Math.hypot(bx, by);
    if (bMag < 1e-6) continue;
    moving.motion.direction = { x: bx / bMag, y: by / bMag };
    markSliceDirty(world, e, "isMoving");
  }
}

function splitNearest(
  candidates: MonsterEntity[],
  linkRange: number,
): MonsterEntity[][] {
  const groups: MonsterEntity[][] = [];
  const remaining = [...candidates].sort(compareMonsterId);
  const linkRangeSq = linkRange * linkRange;

  while (remaining.length > 0) {
    const seed = remaining.shift()!;
    const nearest = remaining
      .map((m, index) => ({
        index,
        entity: m,
        distSq: distanceSq(seed.hasPosition.current, m.hasPosition.current),
      }))
      .filter((entry) => entry.distSq <= linkRangeSq)
      .sort((a, b) => a.distSq - b.distSq || compareMonsterId(a.entity, b.entity))
      .slice(0, MAX_SWARM_PACK_SIZE - 1);

    const selected = new Set(nearest.map((entry) => entry.index));
    for (let i = remaining.length - 1; i >= 0; i--) {
      if (selected.has(i)) remaining.splice(i, 1);
    }

    groups.push([seed, ...nearest.map((entry) => entry.entity)]);
  }

  return groups;
}

function compareMonsterId(a: MonsterEntity, b: MonsterEntity): number {
  return a.isMonster.id.localeCompare(b.isMonster.id);
}

function isSwarmMoveState(state: MonsterEntity["hasAwareness"]["state"]): boolean {
  return state === "wandering" || state === "chasing";
}
