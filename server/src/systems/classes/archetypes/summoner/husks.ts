/**
 * Husks: the short-lived strikers the Conduit's T4 raises (the Gravecaller's risen summons, the
 * Charnel-Crown's thralls) and the T3 Infestation's burst (T4-CONDUIT; bible §7.6, §7.16).
 * No temporary summon entity exists yet (§7.15 item 8 flags the on-kill rise for review), so a
 * husk is held here: it hits the formation's target (or the nearest enemy) on a timer until it
 * fades. Server-only scratch, never networked or persisted.
 */
import type { PlayerEntity } from '../../../../ecs/entity';
import type { World } from '../../../../world/World';
import { applyPlayerAoeTo, playerAoeTargets } from '../../../combat/damage/aoeDamage';

interface Husk { x: number; y: number; damage: number; endsAt: number; nextAt: number; everyMs: number }
const HUSKS = new WeakMap<PlayerEntity, Husk[]>();

export function raiseHusk(
  owner: PlayerEntity,
  at: { x: number; y: number },
  damage: number,
  ms: number,
  everyMs: number,
  now: number,
  cap: number,
): void {
  const list = HUSKS.get(owner) ?? [];
  if (list.length >= cap) list.shift();
  list.push({ x: at.x, y: at.y, damage, endsAt: now + ms, nextAt: now + everyMs, everyMs });
  HUSKS.set(owner, list);
}

/** How many husks are standing (tests and the HUD read it). */
export function huskCount(owner: PlayerEntity): number {
  return HUSKS.get(owner)?.length ?? 0;
}

export function tickHusks(world: World, owner: PlayerEntity, now: number): void {
  const list = HUSKS.get(owner);
  if (!list || list.length === 0) return;
  const targetId = owner.summonsMinions?.formationTargetId;
  const focus = targetId ? world.getMonsterEntity(targetId) : undefined;
  const alive = list.filter((husk) => now < husk.endsAt);
  for (const husk of alive) {
    if (now < husk.nextAt) continue;
    husk.nextAt = now + husk.everyMs;
    const target = focus && focus.hasHealth.hp > 0
      ? focus
      : playerAoeTargets(world, owner, husk, 260).find((candidate) => candidate.hasHealth.hp > 0);
    if (target) applyPlayerAoeTo(world, owner, [target], husk.damage, 'summon', {}, {});
  }
  if (alive.length === 0) HUSKS.delete(owner);
  else HUSKS.set(owner, alive);
}

