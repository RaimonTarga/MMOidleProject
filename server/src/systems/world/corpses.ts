import {
  MONSTER_DATABASE,
  distanceSq,
  type CorpseView,
  type Vec2,
} from '@mmo-idle/shared';
import type { MonsterEntity } from '../../ecs/entity';
import type { World } from '../../world/World';

/** One recently-killed monster, remembered only long enough to be raised. */
export interface RuntimeCorpse {
  /** Stable identity, so a reservation can name a specific body. */
  id: string;
  monsterTypeId: string;
  pos: Vec2;
  diedAtMs: number;
  /**
   * Raiser that has CLAIMED this corpse for an in-flight cast.
   *
   * Reservation exists to make necromancy legible: the player sees which bodies are
   * coming back while the cast is still running, instead of being surprised after.
   * It is also what stops two raisers, or one raiser casting twice, from both
   * counting the same body — the claim-once invariant, now enforced at CAST START
   * rather than at resolution.
   */
  reservedBy?: string;
}

/**
 * How long a corpse stays raisable. Short on purpose: the necromancer's tide has
 * to track the fight happening NOW, not a pile banked minutes ago. Placeholder —
 * the balance pass owns it.
 *
 * Raised from 15s by the boss encounter rework: the Charnel-Crown Sovereign's Mass
 * Resurrection fires on an HP threshold, not on a timer, so at 15s a phase burst
 * routinely found an empty registry and did nothing at all. 30s still cannot bank a
 * pile from a previous pull (the boss fight is longer than that), but it does mean
 * "everything you have put down recently gets back up" is reliably true.
 */
export const CORPSE_TTL_MS = 30_000;
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
    id: `corpse-${monster.hasPosition.nodeId}-${world.corpseSeq++}`,
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
  /** Only consider corpses reserved by this raiser, plus unreserved ones. */
  raiserId?: string,
): RuntimeCorpse | null {
  const list = world.corpses.get(nodeId);
  if (!list || list.length === 0) return null;

  const rangeSq = range * range;
  let bestIndex = -1;
  let bestDistSq = Infinity;
  for (let i = 0; i < list.length; i++) {
    const corpse = list[i]!;
    // Somebody else's claim is off limits. Without this two raisers casting at once
    // would each show a tether to the same body and only one would get it.
    if (corpse.reservedBy !== undefined && corpse.reservedBy !== raiserId) continue;
    const distSq = distanceSq(corpse.pos, pos);
    if (distSq > rangeSq || distSq >= bestDistSq) continue;
    bestIndex = i;
    bestDistSq = distSq;
  }
  if (bestIndex < 0) return null;

  const [claimed] = list.splice(bestIndex, 1);
  if (list.length === 0) world.corpses.delete(nodeId);
  return claimed ?? null;
}

/**
 * Claim up to `count` corpses for a cast that is about to begin.
 *
 * Reserving at CAST START rather than at resolution is the whole point: it is what
 * lets the client mark the bodies and draw the tether while the wind-up is still
 * running, so the player can see the answer coming. Returns the ids actually
 * claimed, which may be fewer than asked when the node has not fed the raiser enough.
 */
export function reserveCorpses(
  world: World,
  raiser: MonsterEntity,
  range: number,
  count: number,
): string[] {
  const nodeId = raiser.hasPosition.nodeId;
  const list = world.corpses.get(nodeId);
  if (!list || list.length === 0) return [];

  const rangeSq = range * range;
  const from = raiser.hasPosition.current;
  const candidates = list
    .filter(corpse => corpse.reservedBy === undefined)
    .filter(corpse => distanceSq(corpse.pos, from) <= rangeSq)
    // Nearest first, then by id, so two identical situations reserve the same
    // bodies — a tether that jitters between equidistant corpses reads as a bug.
    .sort((a, b) => (distanceSq(a.pos, from) - distanceSq(b.pos, from)) || a.id.localeCompare(b.id))
    .slice(0, Math.max(0, count));

  for (const corpse of candidates) corpse.reservedBy = raiser.isMonster.id;
  return candidates.map(corpse => corpse.id);
}

/**
 * Release every claim this raiser holds. Called on cancel, reset, and death.
 *
 * Safe to call blindly: a raiser with no claims is the ordinary case, and a
 * reservation that outlived its caster would mark a body no cast will ever take —
 * permanently unraisable and permanently glowing.
 */
export function releaseCorpseReservations(world: World, raiserId: string, nodeId: string): void {
  for (const corpse of world.corpses.get(nodeId) ?? []) {
    if (corpse.reservedBy === raiserId) corpse.reservedBy = undefined;
  }
}

/** Corpses currently claimed by this raiser, nearest first. */
export function reservedCorpses(
  world: World,
  raiserId: string,
  nodeId: string,
): RuntimeCorpse[] {
  return (world.corpses.get(nodeId) ?? []).filter(corpse => corpse.reservedBy === raiserId);
}

/** Build the client view for a node, or undefined when it has no corpses. */
export function buildCorpseViews(
  world: World,
  nodeId: string,
  now: number,
): CorpseView[] | undefined {
  const list = world.corpses.get(nodeId);
  if (!list || list.length === 0) return undefined;
  return list.map<CorpseView>((corpse) => ({
    id: corpse.id,
    monsterTypeId: corpse.monsterTypeId,
    x: corpse.pos.x,
    y: corpse.pos.y,
    remainingMs: Math.max(0, corpse.diedAtMs + CORPSE_TTL_MS - now),
    ...(corpse.reservedBy ? { reservedBy: corpse.reservedBy } : {}),
  }));
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
