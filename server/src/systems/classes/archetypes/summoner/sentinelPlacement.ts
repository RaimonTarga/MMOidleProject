import {
  distanceSq,
  inAttackRange,
  posHitboxFromEntity,
  type HasHitbox,
  type PosHitbox,
  type Vec2,
} from '@mmo-idle/shared';
import type { World } from '../../../../world/World';
import type { MonsterEntity, PlayerEntity } from '../../../../ecs/entity';

const FOLLOW_RADIUS = 44;
const MIN_SENTINEL_SEP_SQ = 56 * 56;
const PLACEMENT_STEPS = 14;

function posHitboxAt(pos: Vec2, hitbox: HasHitbox): PosHitbox {
  return { pos, rects: hitbox.rects };
}

function sentinelTetherRadius(owner: PlayerEntity): number {
  const mult = owner.usesSkills.passives['summoner.sentinel-tether-mult'] ?? 2.0;
  return Math.max(40, owner.performsAttack.attackRange * mult);
}

function playerLeashRadius(owner: PlayerEntity): number {
  const mult = owner.usesSkills.passives['summoner.leash-mult'] ?? 2.0;
  return Math.max(40, owner.performsAttack.attackRange * mult);
}

function existingSentinelPositions(world: World, owner: PlayerEntity, slot: number): Vec2[] {
  const out: Vec2[] = [];
  const summons = owner.summonsMinions;
  if (!summons) return out;
  for (let i = 0; i < summons.targetCount; i++) {
    if (i === slot) continue;
    const id = summons.minionIds[i];
    if (!id) continue;
    const minion = world.getMinionEntity(id);
    if (minion && minion.hasHealth.hp > 0) {
      out.push(minion.hasPosition.current);
    }
  }
  return out;
}

function isValidSentinelSpot(
  pos: Vec2,
  owner: PlayerEntity,
  monster: MonsterEntity,
  attackRange: number,
  minionHitbox: HasHitbox,
  tetherRadius: number,
  avoid: Vec2[],
): boolean {
  if (distanceSq(pos, owner.hasPosition.current) > tetherRadius * tetherRadius) {
    return false;
  }
  for (const other of avoid) {
    if (distanceSq(pos, other) < MIN_SENTINEL_SEP_SQ) return false;
  }
  const sentryHb = posHitboxAt(pos, minionHitbox);
  const monsterHb = posHitboxFromEntity(monster);
  return inAttackRange(sentryHb, monsterHb, attackRange);
}

/**
 * Farthest valid point on the monster→player ray (high t = back toward the owner).
 * Puts the mob at the edge of sentry range instead of on top of it.
 */
function farthestValidOnLine(
  ownerPos: Vec2,
  monsterPos: Vec2,
  owner: PlayerEntity,
  monster: MonsterEntity,
  attackRange: number,
  minionHitbox: HasHitbox,
  tetherRadius: number,
  avoid: Vec2[],
): Vec2 | null {
  const dx = ownerPos.x - monsterPos.x;
  const dy = ownerPos.y - monsterPos.y;
  const dist = Math.hypot(dx, dy) || 1;
  const ux = dx / dist;
  const uy = dy / dist;

  for (let step = PLACEMENT_STEPS; step >= 1; step--) {
    const t = step / PLACEMENT_STEPS;
    const pos = {
      x: Math.round(monsterPos.x + ux * dist * t),
      y: Math.round(monsterPos.y + uy * dist * t),
    };
    if (isValidSentinelSpot(
      pos,
      owner,
      monster,
      attackRange,
      minionHitbox,
      tetherRadius,
      avoid,
    )) {
      return pos;
    }
  }
  return null;
}

/** Max-range anchor on the combat line, then slight perpendicular offsets for a second totem. */
function* placementCandidates(
  ownerPos: Vec2,
  monsterPos: Vec2,
  owner: PlayerEntity,
  monster: MonsterEntity,
  attackRange: number,
  minionHitbox: HasHitbox,
  tetherRadius: number,
  avoid: Vec2[],
): Generator<Vec2> {
  const anchor = farthestValidOnLine(
    ownerPos,
    monsterPos,
    owner,
    monster,
    attackRange,
    minionHitbox,
    tetherRadius,
    avoid,
  );
  if (!anchor) return;

  yield anchor;

  const dx = ownerPos.x - monsterPos.x;
  const dy = ownerPos.y - monsterPos.y;
  const dist = Math.hypot(dx, dy) || 1;
  const perpX = -dy / dist;
  const perpY = dx / dist;

  for (const side of [-56, 56, -96, 96] as const) {
    const pos = {
      x: Math.round(anchor.x + perpX * side),
      y: Math.round(anchor.y + perpY * side),
    };
    if (isValidSentinelSpot(
      pos,
      owner,
      monster,
      attackRange,
      minionHitbox,
      tetherRadius,
      avoid,
    )) {
      yield pos;
    }
  }
}

function orderedCombatMonsters(
  world: World,
  owner: PlayerEntity,
): MonsterEntity[] {
  const nodeId = owner.hasPosition.nodeId;
  const leashSq = playerLeashRadius(owner) ** 2;
  const op = owner.hasPosition.current;
  const out: MonsterEntity[] = [];
  const seen = new Set<string>();

  const attackId = owner.hasAttackTarget?.targetId;
  if (attackId) {
    const focused = world.getMonsterEntity(attackId);
    if (
      focused
      && focused.hasPosition.nodeId === nodeId
      && focused.hasHealth.hp > 0
      && distanceSq(focused.hasPosition.current, op) <= leashSq
    ) {
      out.push(focused);
      seen.add(focused.isMonster.id);
    }
  }

  const rest: MonsterEntity[] = [];
  for (const m of world.monsterEntitiesInNode(nodeId)) {
    if (m.hasHealth.hp <= 0 || seen.has(m.isMonster.id)) continue;
    if (distanceSq(m.hasPosition.current, op) > leashSq) continue;
    rest.push(m);
  }
  rest.sort(
    (a, b) =>
      distanceSq(a.hasPosition.current, op) - distanceSq(b.hasPosition.current, op),
  );
  return out.concat(rest);
}

/**
 * Place a Stone Sentinel at max range toward the owner so the target sits on the
 * edge of sentry reach (ranged totem), while staying within tether distance.
 * Falls back to follow offset when no valid combat anchor exists.
 */
export function getStoneSentinelSpawnPos(
  world: World,
  owner: PlayerEntity,
  slot: number,
  attackRange: number,
  minionHitbox: HasHitbox,
): Vec2 {
  const tetherRadius = sentinelTetherRadius(owner);
  const avoid = existingSentinelPositions(world, owner, slot);
  const ownerPos = owner.hasPosition.current;

  for (const monster of orderedCombatMonsters(world, owner)) {
    const monsterPos = monster.hasPosition.current;
    for (const candidate of placementCandidates(
      ownerPos,
      monsterPos,
      owner,
      monster,
      attackRange,
      minionHitbox,
      tetherRadius,
      avoid,
    )) {
      return candidate;
    }
  }

  const count = Math.max(1, owner.summonsMinions?.targetCount ?? 1);
  const angle = Math.PI / 2 + (slot / count) * Math.PI * 2;
  const op = owner.hasPosition.current;
  return {
    x: Math.round(op.x + Math.cos(angle) * FOLLOW_RADIUS),
    y: Math.round(op.y + Math.sin(angle) * FOLLOW_RADIUS),
  };
}
