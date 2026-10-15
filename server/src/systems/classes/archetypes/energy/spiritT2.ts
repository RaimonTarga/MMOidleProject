/**
 * The Spirit's Tier 2 pieces (bible §11.5, §11.16): the squalls and calms that move enemies or the
 * player, and the strikes that outlast one tick (Hailstorm's hail, Ball Lightning's orb). Spirit.ts
 * owns the storm, the bands and the costs; this file owns what a fired piece does in the world.
 * Wiring only: every number is a kit `params` placeholder or a constant below.
 */
import { ABILITY_SLOW_EFFECT_ID, getStatusEffect, type Vec2 } from '@mmo-idle/shared';
import type { MonsterEntity, PlayerEntity } from '../../../../ecs/entity';
import { markSliceDirty } from '../../../../ecs/dirtyHelpers';
import type { World } from '../../../../world/World';
import { stopEntity } from '../../../world/movement';
import { findTelegraphEscapeDestination, telegraphsContainingPlayer } from '../../../combat/ai/telegraphEvasion';
import { applyPlayerAoeTo, playerAoeTargets } from '../../../combat/damage/aoeDamage';
import { applyKnockback } from '../../../combat/damage/knockback';
import { isShelledTarget } from './spiritT3';
import { monsterIgnoresControl } from '../../../combat/status/controlImmunity';
import { applyMonsterRoot, applyMonsterSlow } from '../../../combat/status/monsterControl';
import { applyStun } from '../../../combat/status/stun';

type Params = Readonly<Record<string, number>>;

/** How long a drag takes to land (the knockback's default slide). */
const DRAG_MS = 350;

/** A hostile body is "ranged" when its reach is past melee contact (matches the fight snapshot). */
export const MELEE_REACH = 100;

const dist = (a: Vec2, b: Vec2): number => Math.hypot(a.x - b.x, a.y - b.y);

/** The enemy a squall faces: the attack target, else the nearest enemy around you. */
function facingOf(world: World, player: PlayerEntity, radius: number): MonsterEntity | undefined {
  const id = player.hasAttackTarget?.targetId;
  const target = id ? world.getMonsterEntity(id) : undefined;
  if (target && target.hasHealth.hp > 0) return target;
  const at = player.hasPosition.current;
  return playerAoeTargets(world, player, at, radius).sort((a, b) => dist(a.hasPosition.current, at) - dist(b.hasPosition.current, at))[0];
}

// ── Effects that outlast the tick ─────────────────────────────────────────────

interface Hail { kind: 'hail'; at: Vec2; until: number; nextAt: number; damage: number; p: Params }
interface Orb { kind: 'orb'; at: Vec2; dir: Vec2; until: number; nextAt: number; damage: number; p: Params }
/** A root that waits for the drag to land (a root cancels a knockback in flight). */
interface DelayedRoot { kind: 'root'; monsterId: string; until: number; nextAt: number; ms: number; sourceId: string }
type Lingering = Hail | Orb | DelayedRoot;

/** Server-only and ephemeral: a storm in flight is never persisted or networked. */
const lingering = new WeakMap<PlayerEntity, Lingering[]>();

export function lingeringCount(player: PlayerEntity): number {
  return lingering.get(player)?.length ?? 0;
}

function push(player: PlayerEntity, effect: Lingering): void {
  const list = lingering.get(player) ?? [];
  list.push(effect);
  lingering.set(player, list);
}

/** Hailstorm: hail pelts the area around the target for a few seconds; hailstones hit barriers double. */
export function startHail(player: PlayerEntity, at: Vec2, damage: number, p: Params, now: number): void {
  push(player, { kind: 'hail', at: { ...at }, until: now + (p['durationMs'] ?? 3000), nextAt: now, damage, p });
}

/** Ball Lightning: a slow orb drifts from you through the pack, zapping all it passes. */
export function startOrb(player: PlayerEntity, toward: Vec2, damage: number, p: Params, now: number): void {
  const from = player.hasPosition.current;
  const d = Math.max(1, dist(from, toward));
  push(player, { kind: 'orb', at: { ...from }, dir: { x: (toward.x - from.x) / d, y: (toward.y - from.y) / d }, until: now + (p['durationMs'] ?? 4000), nextAt: now, damage, p });
}

const hasBarrier = (monster: MonsterEntity): boolean => (monster.hasStatus?.enemyBarrier?.amount ?? 0) > 0;

export function tickLingering(world: World, player: PlayerEntity, dt: number, now: number): void {
  const list = lingering.get(player);
  if (!list || list.length === 0) return;
  const kept: Lingering[] = [];
  for (const effect of list) {
    if (effect.kind === 'root') {
      if (now < effect.nextAt) { kept.push(effect); continue; }
      const held = world.getMonsterEntity(effect.monsterId);
      if (held && held.hasHealth.hp > 0) applyMonsterRoot(world, held, effect.ms, effect.sourceId);
      continue;
    }
    if (now >= effect.until) continue;
    kept.push(effect);
    if (effect.kind === 'orb') {
      effect.at.x += effect.dir.x * (effect.p['speed'] ?? 60) * (dt / 1000);
      effect.at.y += effect.dir.y * (effect.p['speed'] ?? 60) * (dt / 1000);
    }
    if (now < effect.nextAt) continue;
    effect.nextAt = now + (effect.p['tickMs'] ?? 500);
    const victims = playerAoeTargets(world, player, effect.at, effect.p['radius'] ?? 100);
    if (effect.kind === 'hail') {
      // Sleet breaks shells (barriers, Ice Armor, shell-ups) three times as fast; Hailstorm's hailstones only barriers.
      const breaks = effect.p['shells'] ? (m: MonsterEntity): boolean => isShelledTarget(m, now) : hasBarrier;
      const shielded = victims.filter(breaks);
      const bare = victims.filter((m) => !breaks(m));
      if (bare.length > 0) applyPlayerAoeTo(world, player, bare, effect.damage, 'player', {}, {});
      if (shielded.length > 0) applyPlayerAoeTo(world, player, shielded, effect.damage * (effect.p['shieldMult'] ?? 2), 'player', {}, {});
    } else if (victims.length > 0) {
      applyPlayerAoeTo(world, player, victims, effect.damage, 'player', {}, {});
    }
  }
  lingering.set(player, kept);
}

// ── Squalls ───────────────────────────────────────────────────────────────────

/** Gale: a gust in front of you blows enemies back; a charge caught in it stops dead. Dust Wall (`allSides`) rolls out in every direction. */
export function fireGale(world: World, player: PlayerEntity, p: Params): boolean {
  const at = player.hasPosition.current;
  const radius = p['radius'] ?? 200;
  const allSides = (p['allSides'] ?? 0) > 0;
  const facing = facingOf(world, player, radius);
  if (!facing) return false;
  const fx = facing.hasPosition.current.x - at.x;
  const fy = facing.hasPosition.current.y - at.y;
  let moved = 0;
  for (const monster of playerAoeTargets(world, player, at, radius)) {
    if (monster.isRooted || monster.isMonster.isBoss || monsterIgnoresControl(monster)) continue;
    const to = monster.hasPosition.current;
    if (!allSides && (to.x - at.x) * fx + (to.y - at.y) * fy <= 0) continue; // behind you
    const charging = (monster.controlsMonster?.chargeRemainingMs ?? 0) > 0;
    if (charging) {
      monster.controlsMonster.chargeRemainingMs = 0;
      applyStun(monster.tracksCombat, p['stunMs'] ?? 600, player.isPlayer.id);
    }
    applyKnockback(world, monster.isMonster.id, at, p['distance'] ?? 110);
    moved++;
  }
  return moved > 0;
}

/** Flare: a flash around you staggers the ambushers (the stand-in for "reveals": see the report). */
export function fireFlare(world: World, player: PlayerEntity, p: Params): boolean {
  const around = playerAoeTargets(world, player, player.hasPosition.current, p['radius'] ?? 220);
  let hit = 0;
  for (const monster of around) {
    if (monsterIgnoresControl(monster)) continue;
    applyStun(monster.tracksCombat, p['staggerMs'] ?? 800, player.isPlayer.id);
    hit++;
  }
  return hit > 0;
}

/** Dust Devil: runs down the farthest enemy attacking you from range and drags it toward you. */
export function fireDustDevil(world: World, player: PlayerEntity, p: Params, rank: number, now: number): boolean {
  const at = player.hasPosition.current;
  let farthest: MonsterEntity | undefined;
  let far = 0;
  for (const monster of world.aggroedMonsters) {
    if (monster.hasAggroTarget.targetKind !== 'player' || monster.hasAggroTarget.targetId !== player.isPlayer.id) continue;
    if ((monster.performsAttack?.attackRange ?? 0) <= MELEE_REACH || monster.hasHealth.hp <= 0) continue;
    const d = dist(monster.hasPosition.current, at);
    if (d > far) { far = d; farthest = monster; }
  }
  if (!farthest || monsterIgnoresControl(farthest) || farthest.isRooted) return false;
  const here = farthest.hasPosition.current;
  const pull = Math.min(p['pull'] ?? 300, Math.max(0, far - 60));
  if (pull > 0) applyKnockback(world, farthest.isMonster.id, { x: 2 * here.x - at.x, y: 2 * here.y - at.y }, pull);
  // Rank II: the dragged enemy cannot move away for a moment.
  if (rank >= 2) push(player, { kind: 'root', monsterId: farthest.isMonster.id, until: now + DRAG_MS + 100, nextAt: now + DRAG_MS, ms: p['rootMs'] ?? 1000, sourceId: player.isPlayer.id });
  return true;
}

/** Thunderclap II: what the clap staggers also attacks slower for a few seconds. */
export function slowAttacks(world: World, player: PlayerEntity, monster: MonsterEntity, p: Params): void {
  applyMonsterSlow(world, monster, 0.01, p['slowMs'] ?? 3000, player.isPlayer.id);
  const slow = getStatusEffect(monster.tracksCombat, ABILITY_SLOW_EFFECT_ID);
  if (slow) slow.data['attackSlowPct'] = Math.max(slow.data['attackSlowPct'] ?? 0, p['atkSlowPct'] ?? 0.3);
}

// ── Calms ─────────────────────────────────────────────────────────────────────

/** Updraft: when the ground is about to erupt under you, a gust lifts you clear. Rank II stuns the eruptor. */
export function fireUpdraft(world: World, player: PlayerEntity, p: Params, rank: number, now: number): boolean {
  const zones = telegraphsContainingPlayer(world, player, now);
  const dest = findTelegraphEscapeDestination(world, player, now);
  if (zones.length === 0 || !dest) return false;
  player.hasPosition.current = { x: dest.x, y: dest.y };
  markSliceDirty(world, player, 'hasPosition');
  stopEntity(world, player);
  if (rank >= 2) {
    for (const zone of zones) {
      const owner = world.getMonsterEntity(zone.ownerId);
      if (owner && !monsterIgnoresControl(owner)) applyStun(owner.tracksCombat, p['staggerMs'] ?? 800, player.isPlayer.id);
    }
  }
  return true;
}

// ── Tide ──────────────────────────────────────────────────────────────────────

/** Storm Surge: the surge opens with a wave through the enemies in front of you. */
export function surgeWave(world: World, player: PlayerEntity, damage: number, p: Params): void {
  const at = player.hasPosition.current;
  const radius = p['radius'] ?? 240;
  const facing = facingOf(world, player, radius);
  if (!facing) return;
  const fx = facing.hasPosition.current.x - at.x;
  const fy = facing.hasPosition.current.y - at.y;
  const front = playerAoeTargets(world, player, at, radius).filter((m) => (m.hasPosition.current.x - at.x) * fx + (m.hasPosition.current.y - at.y) * fy > 0);
  if (front.length > 0) applyPlayerAoeTo(world, player, front, damage, 'player', {}, {});
}

// ── Sandstorm ring ────────────────────────────────────────────────────────────

/** Sandstorm: a ring of blowing sand slows the enemies inside it. */
export function sandRing(world: World, player: PlayerEntity, radius: number, slowPct: number): void {
  for (const monster of playerAoeTargets(world, player, player.hasPosition.current, radius)) {
    if (monsterIgnoresControl(monster)) continue;
    applyMonsterSlow(world, monster, slowPct, 600, player.isPlayer.id);
  }
}

/** The spill: damage from the overflow arcs into the nearest enemies near you. */
export function spill(world: World, player: PlayerEntity, damage: number, radius: number, targets: number): void {
  const at = player.hasPosition.current;
  const near = playerAoeTargets(world, player, at, radius)
    .sort((a, b) => dist(a.hasPosition.current, at) - dist(b.hasPosition.current, at))
    .slice(0, targets);
  if (near.length > 0) applyPlayerAoeTo(world, player, near, damage, 'player', {}, {});
}
