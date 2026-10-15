/**
 * The Spirit's Tier 3 pieces and effects (bible §11.6, §11.9, §11.16): the lessons that act on the
 * world (Downburst, Tailwind, Foehn, Forked Bolt's fork), the Ice Storm glaze, Pyrocumulus's burst,
 * Stormdancer's blink and the T3 gear readers (Heat, Chill, fire hits, shells). spirit.ts owns the
 * storm, the bands and the costs; spiritT2.ts owns the T2 effects.
 * Wiring only: every number is a kit `params` placeholder or a constant in spirit.ts.
 */
import {
  MONSTER_DATABASE,
  getStatusEffect,
  removeStatusEffect,
  setString,
  getString,
  type Vec2,
} from '@mmo-idle/shared';
import type { MonsterEntity, PlayerEntity } from '../../../../ecs/entity';
import type { World } from '../../../../world/World';
import { isShelled } from '../../../combat/ai/shellUp';
import { applyPlayerAoeTo, playerAoeTargets } from '../../../combat/damage/aoeDamage';
import { repositionPlayer } from '../../../combat/damage/knockback';
import { monsterIgnoresControl } from '../../../combat/status/controlImmunity';
import { applyMonsterSlow } from '../../../combat/status/monsterControl';
import { applyStun } from '../../../combat/status/stun';

type Params = Readonly<Record<string, number>>;

const HEAT_EFFECT = 'volcanic-heat';
const CHILL_EFFECT = 'tundra-chill';
const BLINK_LAST = 'spirit.blinkLast';

const dist = (a: Vec2, b: Vec2): number => Math.hypot(a.x - b.x, a.y - b.y);

/** The steps of the Heat (volcanic) and of the Chill (tundra) on you. */
export const heatOf = (player: PlayerEntity): number => getStatusEffect(player.tracksCombat, HEAT_EFFECT)?.stacks ?? 0;
export const chillOf = (player: PlayerEntity): number => getStatusEffect(player.tracksCombat, CHILL_EFFECT)?.stacks ?? 0;

/** Shelled targets (Rime Staff): a barrier or Ice Armor up, or retracted into a shell. Obsidian reads as a barrier. */
export function isShelledTarget(monster: MonsterEntity, now: number): boolean {
  return (monster.hasStatus?.enemyBarrier?.amount ?? 0) > 0 || isShelled(monster, now);
}

/** A fire hit (Flash Steam): the attacker is a volcanic monster or has a fire attack style. */
export function isFireHit(source: MonsterEntity | undefined): boolean {
  if (!source) return false;
  const def = MONSTER_DATABASE.get(source.isMonster.monsterTypeId);
  return !!def && (def.biome === 'volcanic' || def.attackStyle.includes('fire'));
}

// ── Lessons ───────────────────────────────────────────────────────────────────

/** Downburst: a column of wind slams down on a charging enemy and pins it for a moment. */
export function fireDownburst(world: World, player: PlayerEntity, p: Params): boolean {
  const at = player.hasPosition.current;
  let nearest: MonsterEntity | undefined;
  let near = Infinity;
  for (const monster of world.aggroedMonsters) {
    if (monster.hasAggroTarget.targetKind !== 'player' || monster.hasAggroTarget.targetId !== player.isPlayer.id) continue;
    if (monster.hasHealth.hp <= 0 || (monster.controlsMonster?.chargeRemainingMs ?? 0) <= 0) continue;
    const d = dist(monster.hasPosition.current, at);
    if (d < near) { near = d; nearest = monster; }
  }
  if (!nearest || monsterIgnoresControl(nearest)) return false;
  nearest.controlsMonster.chargeRemainingMs = 0;
  applyStun(nearest.tracksCombat, p['pinMs'] ?? 1200, player.isPlayer.id);
  return true;
}

/** Tailwind: when something drags or shoves you, a gust carries you back (away from the nearest enemy). */
export function fireTailwind(world: World, player: PlayerEntity, p: Params): boolean {
  const at = player.hasPosition.current;
  const near = playerAoeTargets(world, player, at, 400).sort((a, b) => dist(a.hasPosition.current, at) - dist(b.hasPosition.current, at))[0];
  if (!near) return false;
  return repositionPlayer(world, player, near.hasPosition.current, p['distance'] ?? 220, false) !== null;
}

/** Foehn: when the Chill on you nears its threshold, a warm wind melts it back down. */
export function fireFoehn(player: PlayerEntity, p: Params): boolean {
  const chill = getStatusEffect(player.tracksCombat, CHILL_EFFECT);
  if (!chill || chill.stacks <= 0) return false;
  chill.stacks = Math.max(0, chill.stacks - (p['melt'] ?? 3));
  if (chill.stacks <= 0) removeStatusEffect(player.tracksCombat, CHILL_EFFECT);
  return true;
}

/** Forked Bolt: the enemies near the target that are farthest from you, where fleeing ones end up. */
export function forkTargets(world: World, player: PlayerEntity, target: MonsterEntity, radius: number, count: number): MonsterEntity[] {
  const me = player.hasPosition.current;
  return playerAoeTargets(world, player, target.hasPosition.current, radius, target.isMonster.id)
    .sort((a, b) => dist(b.hasPosition.current, me) - dist(a.hasPosition.current, me))
    .slice(0, count);
}

// ── Ice Storm: the glazed ground ──────────────────────────────────────────────

interface Glaze { at: Vec2; until: number; radius: number; slowPct: number }
const GLAZE_TICK_MS = 250;
/** Server-only and ephemeral, like the T2 lingering effects. */
const glazes = new WeakMap<PlayerEntity, { list: Glaze[]; nextAt: number }>();

export function glazeCount(player: PlayerEntity): number {
  return glazes.get(player)?.list.length ?? 0;
}

/** Ice Storm: every spend glazes the ground under its target. */
export function startGlaze(player: PlayerEntity, at: Vec2, p: Params, now: number): void {
  const entry = glazes.get(player) ?? { list: [], nextAt: 0 };
  entry.list.push({ at: { ...at }, until: now + (p['durationMs'] ?? 5000), radius: p['radius'] ?? 90, slowPct: p['slowPct'] ?? 0.3 });
  if (entry.list.length > 8) entry.list.shift();
  glazes.set(player, entry);
}

/** Enemies on the glaze are slowed; bosses that accept no control ignore it. */
export function tickGlaze(world: World, player: PlayerEntity, now: number): void {
  const entry = glazes.get(player);
  if (!entry || entry.list.length === 0) return;
  entry.list = entry.list.filter((g) => g.until > now);
  if (now < entry.nextAt) return;
  entry.nextAt = now + GLAZE_TICK_MS;
  for (const glaze of entry.list) {
    for (const monster of playerAoeTargets(world, player, glaze.at, glaze.radius)) {
      if (monsterIgnoresControl(monster)) continue;
      applyMonsterSlow(world, monster, glaze.slowPct, 600, player.isPlayer.id);
    }
  }
}

// ── Pyrocumulus, Stormdancer ──────────────────────────────────────────────────

/** Pyrocumulus: a full storm boils over, and a burst strikes around you. */
export function pyroBurst(world: World, player: PlayerEntity, damage: number, radius: number): boolean {
  const around = playerAoeTargets(world, player, player.hasPosition.current, radius);
  if (around.length === 0) return false;
  applyPlayerAoeTo(world, player, around, damage, 'player', {}, {});
  return true;
}

/** Stormdancer: blink to the nearest enemy that is not the last one landed on. Returns where you landed. */
export function stormdancerBlink(world: World, player: PlayerEntity, reach: number): MonsterEntity | undefined {
  const me = player.hasPosition.current;
  const last = getString(player.tracksCombat, BLINK_LAST);
  const pick = playerAoeTargets(world, player, me, reach)
    .filter((m) => m.isMonster.id !== last && dist(m.hasPosition.current, me) > 100)
    .sort((a, b) => dist(a.hasPosition.current, me) - dist(b.hasPosition.current, me))[0];
  if (!pick) return undefined;
  const d = dist(pick.hasPosition.current, me);
  if (repositionPlayer(world, player, pick.hasPosition.current, d - 70, true) === null) return undefined;
  setString(player.tracksCombat, BLINK_LAST, pick.isMonster.id);
  return pick;
}

// ── Insulated ─────────────────────────────────────────────────────────────────

/** What the Chill's build clock read when we last looked (the room's clock is not ours to edit). */
const lastChillAccum = new WeakMap<PlayerEntity, number>();

/**
 * Insulated: the Chill builds slower while the storm is above the floor. The room owns the Chill's
 * clock, so a share of whatever the clock gained since we last looked is handed back.
 */
export function slowChillBuild(player: PlayerEntity, share: number, active: boolean): void {
  const chill = getStatusEffect(player.tracksCombat, CHILL_EFFECT);
  if (!chill) { lastChillAccum.delete(player); return; }
  const now = chill.data['rampAccum'] ?? 0;
  const last = lastChillAccum.get(player) ?? now;
  if (active && share > 0 && now > last) chill.data['rampAccum'] = now - (now - last) * share;
  lastChillAccum.set(player, chill.data['rampAccum'] ?? 0);
}
