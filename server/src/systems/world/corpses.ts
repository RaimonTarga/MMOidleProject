import { MONSTER_DATABASE, distanceSq, type Vec2 } from '@mmo-idle/shared';
import type { MonsterEntity } from '../../ecs/entity';
import type { World } from '../../world/World';

/** One recently-killed monster, remembered only long enough to be raised. */
export interface RuntimeCorpse {
  monsterTypeId: string;
  pos: Vec2;
  diedAtMs: number;
}

/**
 * How long a corpse stays raisable. Short on purpose: the necromancer's tide has
 * to track the fight happening NOW, not a pile banked minutes ago. Placeholder —
 * the balance pass owns it.
 */
export const CORPSE_TTL_MS = 15_000;
/** Ring-buffer bound. The oldest corpse is dropped once a node is this full. */
export const MAX_CORPSES_PER_NODE = 16;

function corpsesFor(world: World, nodeId: string): RuntimeCorpse[] {
  let list = world.corpses.get(nodeId);
  if (!list) {
    list = [];
    world.corpses.set(nodeId, list);
  }
  return list;
}

/**
 * Remember a player kill as a raisable corpse. Bosses never leave one (a raised
 * boss copy would be absurd) and neither do risen mobs — that closes the loop
 * where a tide re-raises itself forever.
 */
export function recordCorpse(world: World, monster: MonsterEntity): void {
  if (monster.isMonster.isBoss || monster.isRaised) return;
  if (!MONSTER_DATABASE.has(monster.isMonster.monsterTypeId)) return;

  const list = corpsesFor(world, monster.hasPosition.nodeId);
  list.push({
    monsterTypeId: monster.isMonster.monsterTypeId,
    pos: { ...monster.hasPosition.current },
    diedAtMs: Date.now(),
  });
  if (list.length > MAX_CORPSES_PER_NODE) list.splice(0, list.length - MAX_CORPSES_PER_NODE);
}

/**
 * Claim the nearest corpse within `range` of `pos`, removing it from the node.
 * Returns null when nothing is in reach — the caller simply does not raise.
 */
export function takeNearestCorpse(
  world: World,
  nodeId: string,
  pos: Vec2,
  range: number,
): RuntimeCorpse | null {
  const list = world.corpses.get(nodeId);
  if (!list || list.length === 0) return null;

  const rangeSq = range * range;
  let bestIndex = -1;
  let bestDistSq = Infinity;
  for (let i = 0; i < list.length; i++) {
    const distSq = distanceSq(list[i]!.pos, pos);
    if (distSq > rangeSq || distSq >= bestDistSq) continue;
    bestIndex = i;
    bestDistSq = distSq;
  }
  if (bestIndex < 0) return null;

  const [claimed] = list.splice(bestIndex, 1);
  if (list.length === 0) world.corpses.delete(nodeId);
  return claimed ?? null;
}

/** Drop corpses past their TTL. Runs before the raisers read them. */
export function updateCorpses(world: World, now: number): void {
  for (const [nodeId, list] of [...world.corpses]) {
    const kept = list.filter((corpse) => now < corpse.diedAtMs + CORPSE_TTL_MS);
    if (kept.length === 0) world.corpses.delete(nodeId);
    else if (kept.length !== list.length) world.corpses.set(nodeId, kept);
  }
}

/** Runtime-only, exactly like monsters: a frozen node forgets its dead. */
export function clearCorpsesForNode(world: World, nodeId: string): void {
  world.corpses.delete(nodeId);
}
