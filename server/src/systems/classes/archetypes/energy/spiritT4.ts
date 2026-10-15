/**
 * The Spirit's Tier 4 pieces and effects (bible §11.7, §11.9, §11.16): the lessons that act on the
 * world (Ground Charge, Thunderstorm, Maelstrom), the Wasteland and Trench readers (risen enemies,
 * debuff counts) and the leaves' helpers. spirit.ts owns the storm, the bands and the costs.
 * Wiring only: every number is a kit `params` placeholder or a constant in spirit.ts.
 */
import {
  isHarmfulPlayerStatusEffect,
  isMonsterDotStatusEffectId,
  type Vec2,
} from '@mmo-idle/shared';
import type { MonsterEntity, PlayerEntity } from '../../../../ecs/entity';
import { markSliceDirty } from '../../../../ecs/dirtyHelpers';
import { detachComponent } from '../../../../ecs/markerHelpers';
import type { World } from '../../../../world/World';
import { stopEntity } from '../../../world/movement';
import { applyPlayerAoeTo, playerAoeTargets } from '../../../combat/damage/aoeDamage';
import { applyKnockback } from '../../../combat/damage/knockback';
import { isConcealedEntity } from '../../../combat/invulnerability';
import { fightSnapshotFor } from '../../../combat/moments/fightSnapshot';
import { monsterIgnoresControl } from '../../../combat/status/controlImmunity';
import { applyStun } from '../../../combat/status/stun';

type Params = Readonly<Record<string, number>>;

const dist = (a: Vec2, b: Vec2): number => Math.hypot(a.x - b.x, a.y - b.y);

// ── Debuffs on you (Trench gear) ──────────────────────────────────────────────

/** How many different harmful effects are on the player. */
export function debuffCountOf(player: PlayerEntity): number {
  const ids = new Set<string>();
  for (const effect of player.tracksCombat.statusEffects) {
    if (effect.stacks > 0 && isHarmfulPlayerStatusEffect(effect.id, effect.data)) ids.add(effect.id);
  }
  return ids.size;
}

/**
 * Burn Off, Calm Depths: harmful effects on you run out faster. `x` is how many times as fast;
 * `dotsOnly` limits it to poisons and bleeds. The status ticker still does the removing.
 */
export function hastenDebuffs(player: PlayerEntity, dt: number, x: number, dotsOnly: boolean): void {
  if (x <= 1) return;
  for (const effect of player.tracksCombat.statusEffects) {
    if (effect.remainingMs <= 0 || !isHarmfulPlayerStatusEffect(effect.id, effect.data)) continue;
    if (dotsOnly && (effect.data['isDot'] ?? 0) === 0 && !isMonsterDotStatusEffectId(effect.id)) continue;
    effect.remainingMs = Math.max(1, effect.remainingMs - dt * (x - 1));
  }
}

// ── Wasteland: the risen ──────────────────────────────────────────────────────

/** The risen enemies seen near each Spirit, so a new one counts once. Server-only. */
const seenRisen = new WeakMap<PlayerEntity, Set<string>>();

/** Wake: how many enemies rose near you since the last look. */
export function newRisenNear(world: World, player: PlayerEntity, radius: number): number {
  const seen = seenRisen.get(player) ?? new Set<string>();
  seenRisen.set(player, seen);
  const live = new Set<string>();
  let fresh = 0;
  for (const monster of world.monsterEntitiesInNode(player.hasPosition.nodeId)) {
    if (!monster.isRaised || monster.hasHealth.hp <= 0) continue;
    live.add(monster.isMonster.id);
    if (seen.has(monster.isMonster.id)) continue;
    seen.add(monster.isMonster.id);
    if (dist(monster.hasPosition.current, player.hasPosition.current) <= radius) fresh++;
  }
  for (const id of seen) if (!live.has(id)) seen.delete(id);
  return fresh;
}

/** Stray Bolts: a random enemy elsewhere in the fight (not the one the spend went to). */
export function strayTarget(world: World, player: PlayerEntity, reach: number, excludeId: string | undefined): MonsterEntity | undefined {
  const pool = playerAoeTargets(world, player, player.hasPosition.current, reach, excludeId);
  return pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : undefined;
}

// ── Ground Charge ─────────────────────────────────────────────────────────────

interface Patch { at: Vec2; until: number; radius: number; stunMs: number; distance: number }
/** One charged patch at a time per Spirit. Server-only and ephemeral. */
const patches = new WeakMap<PlayerEntity, Patch>();

export function groundChargeActive(player: PlayerEntity, now: number): boolean {
  const patch = patches.get(player);
  return !!patch && patch.until > now;
}

/** Ground Charge: lay a charged patch under you. It waits; one patch at a time. */
export function fireGroundCharge(player: PlayerEntity, p: Params, now: number): boolean {
  if (groundChargeActive(player, now)) return false;
  patches.set(player, {
    at: { ...player.hasPosition.current }, until: now + (p['durationMs'] ?? 6000),
    radius: p['radius'] ?? 110, stunMs: p['stunMs'] ?? 1000, distance: p['distance'] ?? 160,
  });
  return true;
}

/** The first enemy to leap (charge) at you across the patch is thrown back and stunned; the patch is spent. */
export function tickGroundCharge(world: World, player: PlayerEntity, now: number): void {
  const patch = patches.get(player);
  if (!patch) return;
  if (patch.until <= now) { patches.delete(player); return; }
  const leaper = playerAoeTargets(world, player, patch.at, patch.radius + 120)
    .filter((m) => (m.controlsMonster?.chargeRemainingMs ?? 0) > 0 && dist(m.hasPosition.current, patch.at) <= patch.radius + 120)
    .sort((a, b) => dist(a.hasPosition.current, patch.at) - dist(b.hasPosition.current, patch.at))[0];
  if (!leaper || monsterIgnoresControl(leaper)) return;
  leaper.controlsMonster.chargeRemainingMs = 0;
  applyKnockback(world, leaper.isMonster.id, patch.at, patch.distance);
  applyStun(leaper.tracksCombat, patch.stunMs, player.isPlayer.id);
  patches.delete(player);
}

// ── Thunderstorm ──────────────────────────────────────────────────────────────

interface Tempest { until: number; nextAt: number; damage: number; radius: number; tickMs: number }
const tempests = new WeakMap<PlayerEntity, Tempest[]>();

export function thunderstormCount(player: PlayerEntity): number {
  return tempests.get(player)?.length ?? 0;
}

/** Thunderstorm: for a few seconds, lightning strikes at random among every enemy around you. */
export function startThunderstorm(player: PlayerEntity, damage: number, p: Params, now: number): void {
  const list = tempests.get(player) ?? [];
  list.push({ until: now + (p['durationMs'] ?? 4000), nextAt: now, damage, radius: p['radius'] ?? 300, tickMs: p['tickMs'] ?? 400 });
  tempests.set(player, list);
}

export function tickThunderstorm(world: World, player: PlayerEntity, now: number): void {
  const list = tempests.get(player);
  if (!list || list.length === 0) return;
  const kept = list.filter((t) => t.until > now);
  for (const storm of kept) {
    if (now < storm.nextAt) continue;
    storm.nextAt = now + storm.tickMs;
    const around = playerAoeTargets(world, player, player.hasPosition.current, storm.radius);
    if (around.length === 0) continue;
    applyPlayerAoeTo(world, player, [around[Math.floor(Math.random() * around.length)]!], storm.damage, 'player', {}, {});
  }
  tempests.set(player, kept);
}

// ── Maelstrom ─────────────────────────────────────────────────────────────────

/**
 * Maelstrom: when the enemy you fight dives out of reach, a whirlpool drags it back to the surface.
 * Ends the concealment (the boss pattern surfaces it on its next step) and sets it down beside you.
 * Enemies that accept no control ignore it.
 */
export function fireMaelstrom(world: World, player: PlayerEntity, p: Params, now: number): boolean {
  const id = fightSnapshotFor(world, player, now).targetId;
  const diver = id ? world.getMonsterEntity(id) : undefined;
  if (!diver || diver.hasHealth.hp <= 0 || !isConcealedEntity(diver) || monsterIgnoresControl(diver)) return false;
  // A boss pattern owns its concealment: end the step and it surfaces on its next update. Anything else is surfaced here.
  if (diver.runsBossPattern) {
    diver.runsBossPattern.stepEndsAtMs = 0;
    if (diver.isConcealed) diver.isConcealed.endsAtMs = now;
  } else {
    detachComponent(world, diver, 'isConcealed');
  }
  const me = player.hasPosition.current;
  const there = diver.hasPosition.current;
  const d = Math.max(1, dist(me, there));
  const gap = p['dragGap'] ?? 90;
  diver.hasPosition.current = { x: me.x + ((there.x - me.x) / d) * gap, y: me.y + ((there.y - me.y) / d) * gap };
  markSliceDirty(world, diver, 'hasPosition');
  stopEntity(world, diver);
  return true;
}
