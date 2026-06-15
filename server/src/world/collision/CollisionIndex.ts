import {
  blockShapesForMover,
  buildStaticCollisionRegions,
  distanceSq,
  entitiesInCircle,
  gateDirectionAtPoint,
  isWithinRange,
  posHitboxFromEntity,
  reachGap,
  withinReach,
  type CollisionRegion,
  type FeatureTarget,
  type HasHitbox,
  type HasPosition,
  type NodeFeatureShape,
  type Vec2,
} from '@mmo-idle/shared';
import type { MinionEntity, MonsterEntity, PlayerEntity } from '../../ecs/entity';
import { playerDetectionMult } from '../../systems/world/mobility/mobilityBoots';
import type { World } from '../World';
import type { NodeDirection } from '@mmo-idle/shared';

export type AggroCandidate =
  | { kind: 'player'; entity: PlayerEntity }
  | { kind: 'minion'; entity: MinionEntity };

export type ReachEntity = {
  hasPosition: HasPosition;
  hasHitbox?: HasHitbox;
};

/**
 * Lazy per-node collision facade. Reads live ECS state on every query so tick
 * ordering (movement → features → AI → combat) stays correct.
 */
export class CollisionIndex {
  constructor(private readonly world: World) {}

  staticRegions(nodeId: string): CollisionRegion[] {
    return buildStaticCollisionRegions(nodeId);
  }

  blockShapes(nodeId: string, mover: FeatureTarget): NodeFeatureShape[] {
    const prefix = `${nodeId}:`;
    const suppressed = new Set<string>();
    for (const key of this.world.suppressedFeatureBlocks) {
      if (key.startsWith(prefix)) suppressed.add(key.slice(prefix.length));
    }
    return blockShapesForMover(nodeId, mover, suppressed);
  }

  canReach(attacker: ReachEntity, target: ReachEntity, range: number): boolean {
    return withinReach(
      posHitboxFromEntity(attacker),
      posHitboxFromEntity(target),
      range,
    );
  }

  bestTargetInReach<T extends ReachEntity>(
    attacker: ReachEntity,
    candidates: Iterable<T>,
    range: number,
  ): T | null {
    const attackerPH = posHitboxFromEntity(attacker);
    let best: T | null = null;
    let bestGap = Infinity;
    for (const candidate of candidates) {
      const candidatePH = posHitboxFromEntity(candidate);
      if (!withinReach(attackerPH, candidatePH, range)) continue;
      const gap = reachGap(attackerPH, candidatePH);
      if (gap < bestGap) {
        bestGap = gap;
        best = candidate;
      }
    }
    return best;
  }

  aggroCandidate(monster: MonsterEntity): AggroCandidate | null {
    const pullRange = monster.hasAwareness.pullRange;
    const pullSq = pullRange * pullRange;
    const nodeId = monster.hasPosition.nodeId;
    const monsterPos = monster.hasPosition.current;
    let best: AggroCandidate | null = null;
    let bestDist = Infinity;

    for (const player of this.world.livePlayersInNode(nodeId)) {
      const effPull = pullRange * playerDetectionMult(player);
      const d = distanceSq(player.hasPosition.current, monsterPos);
      if (d < effPull * effPull && d < bestDist) {
        bestDist = d;
        best = { kind: 'player', entity: player };
      }
    }

    for (const minion of this.world.minionEntitiesInNode(nodeId)) {
      if (minion.hasHealth.hp <= 0) continue;
      const d = distanceSq(minion.hasPosition.current, monsterPos);
      if (d < pullSq && d < bestDist) {
        bestDist = d;
        best = { kind: 'minion', entity: minion };
      }
    }

    return best;
  }

  bodiesInCircle<T extends { hasPosition: { current: Vec2 } }>(
    candidates: Iterable<T>,
    center: Vec2,
    radius: number,
  ): T[] {
    return entitiesInCircle(candidates, center, radius);
  }

  isWithinCenterRadius(a: Vec2, b: Vec2, radius: number): boolean {
    return isWithinRange(a, b, radius);
  }

  gateDirectionAt(pos: Vec2, nodeId: string): NodeDirection | null {
    return gateDirectionAtPoint(nodeId, pos);
  }
}
