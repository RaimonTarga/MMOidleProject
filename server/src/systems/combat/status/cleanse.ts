/**
 * ONE implementation of "strip harmful stacks off this player".
 *
 * Extracted from `abilityFiring.ts` (where it was the Cleanse guard's private
 * `applyCleanse`) when the lineage card runtime needed the same action for its
 * `cleanse` payoff. It lives here, in a module that imports nothing but shared,
 * so both callers reach the same policy without the abilities module and the card
 * runtime having to import each other.
 *
 * The policy itself is unchanged, and is the point of the function:
 *
 * DETERMINISTIC PRIORITY, not map order. When several afflictions are present,
 * take the deepest stack first (that is the one doing the most, and the one the
 * player cannot out-heal), and break ties by id so two identical situations always
 * cleanse the same thing. Instanced effects are skipped — they are per-source
 * entries, and stripping one of five identical burns reads as the button doing
 * nothing.
 */
import {
  cleanseableStacks,
  isCleanseable,
  isHarmfulPlayerStatusEffect,
  removeStatusEffectStacks,
} from '@mmo-idle/shared';
import type { PlayerEntity } from '../../../ecs/entity';

export type RemovedEffect = { effectId: string; stacks: number };

/** Strip `stacks` from up to `debuffs` distinct harmful effects. */
export function cleansePlayerAfflictions(
  player: PlayerEntity,
  stacks: number,
  debuffs: number,
): RemovedEffect[] {
  const cs = player.tracksCombat;
  const byId = new Map<string, { stacks: number; data: Record<string, number> }>();
  for (const effect of cs.statusEffects) {
    if (effect.instanced) continue;
    if (effect.stacks <= 0) continue;
    if (!isHarmfulPlayerStatusEffect(effect.id, effect.data)) continue;
    // CLEANSE POLICY (redesign §4.7). Being harmful is no longer enough: Heat is
    // genuinely hurting you and is still the wrong thing to answer with a button,
    // because walking out of the vent is the mechanic. Immune effects are skipped
    // ENTIRELY here rather than filtered later, so they cannot consume one of the
    // `debuffs` slots and quietly make Cleanse do nothing.
    if (!isCleanseable(effect.id, effect.data)) continue;
    const existing = byId.get(effect.id);
    if (!existing || effect.stacks > existing.stacks) {
      byId.set(effect.id, { stacks: effect.stacks, data: effect.data });
    }
  }
  const ordered = [...byId.entries()]
    .sort((a, b) => (b[1].stacks - a[1].stacks) || a[0].localeCompare(b[0]))
    .slice(0, Math.max(1, debuffs));
  const removed: RemovedEffect[] = [];
  for (const [id, { stacks: before, data }] of ordered) {
    // A `partial` effect is REDUCED, never deleted: the room re-applies it, so a
    // full strip would be true for a second and read as the button not working.
    const allowed = cleanseableStacks(id, data, Math.max(1, stacks));
    if (allowed <= 0) continue;
    removeStatusEffectStacks(cs, id, allowed);
    const after = cs.statusEffects.find((effect) => effect.id === id)?.stacks ?? 0;
    const removedStacks = Math.max(0, before - after);
    if (removedStacks > 0) removed.push({ effectId: id, stacks: removedStacks });
  }
  return removed;
}
