import { MONSTER_DATABASE } from "@mmo-idle/shared";
import type { MonsterEntity } from "../../../ecs/entity";
import type { World } from "../../../world/World";
import { markSliceDirty } from "../../../ecs/dirtyHelpers";

/**
 * Swarm convergence. Runs AFTER `updateMonsters`, which leaves chasing mobs with a
 * heading toward their target. For each node's chasing swarm mobs we blend a light
 * boids steer — separation from crowded mates + cohesion toward the group centroid —
 * directly into the per-tick motion DIRECTION (renormalized, magnitude untouched).
 *
 * We deliberately bend the heading rather than nudging the nav goal: a small goal
 * offset is swallowed by the pathfinder's replan epsilon (`PATH_GOAL_EPSILON_SQ`),
 * whereas a direction blend always takes effect for the next movement step and
 * naturally re-applies every tick. Turns "many mobs stack on one pixel" into "many
 * mobs fan into pressure". Position-derived → deterministic; no speed/leash change.
 *
 * Only mobs with a `swarm` def AND in the "chasing" state (so `isMoving` is set) are
 * touched; everything else is left exactly as `updateMonsters` decided.
 */
const SEP_WEIGHT = 1.5; // separation outweighs cohesion in the steer
const STEER_BLEND = 0.45; // how hard the swarm bends the chase heading

export function updateSwarm(world: World): void {
  const byNode = new Map<string, MonsterEntity[]>();
  for (const e of world.monsterEntities) {
    if (!e.isMoving || e.hasAwareness.state !== "chasing") continue;
    if (!MONSTER_DATABASE.get(e.isMonster.monsterTypeId)?.swarm) continue;
    const arr = byNode.get(e.hasPosition.nodeId);
    if (arr) arr.push(e);
    else byNode.set(e.hasPosition.nodeId, [e]);
  }

  for (const mobs of byNode.values()) {
    if (mobs.length < 2) continue;

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
}
