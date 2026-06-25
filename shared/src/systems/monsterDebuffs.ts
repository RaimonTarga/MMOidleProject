import type { StatusEffect } from '../components/combat/effects';

/**
 * Tundra rampDebuff (MonsterDefinition.rampDebuff) — a single stacking status
 * effect on the player carrying two capped slow dimensions: movement speed and
 * attack speed. Each landed hit adds one stack (up to a stack count high enough
 * to reach both caps); the whole effect is refreshed on every hit and decays
 * `stackDurationMs` after the last hit taken.
 *
 * The per-hit/max tuning is stored in StatusEffect.data so these pure helpers can
 * derive the current fractions wherever the effect is read (movement, the player
 * attack-cooldown gate, and the buff HUD) without re-plumbing the monster def.
 */
export const FROST_RAMP_EFFECT_ID = 'frost-ramp';

/**
 * Sun Mark (Desert mark/finisher pair) — a cleansable, non-DoT status the marker
 * mob paints on the player. It does nothing on its own (expires harmlessly); it
 * only lets a `markedStrike` finisher land amplified, and is consumed when it does.
 * A plain status id so the Desert cleanse pass strips it like any other debuff.
 */
export const SUN_MARK_EFFECT_ID = 'sun-mark';

/**
 * Volcanic ambient heat (nodeFeatures.ambientHeat) — a node-wide escalating burn
 * status the heat system ramps on players who fight in a volcanic node. Stacks grow
 * with combat dwell time and ramp the burn ticks; decays out of combat / on leaving.
 * Self-managed by the server heat pass (NOT a node-feature damage status).
 */
export const VOLCANIC_HEAT_EFFECT_ID = 'volcanic-heat';

/** Movement-slow fraction (0..moveSlowMaxPct) from the current frost-ramp stacks. */
export function frostRampMoveSlowPct(effect: StatusEffect): number {
  const perHit = effect.data['moveSlowPerHit'] ?? 0;
  const max = effect.data['moveSlowMaxPct'] ?? 0;
  return Math.min(max, effect.stacks * perHit);
}

/** Attack-speed-slow fraction (0..atkSlowMaxPct) from the current frost-ramp stacks. */
export function frostRampAtkSlowPct(effect: StatusEffect): number {
  const perHit = effect.data['atkSlowPerHit'] ?? 0;
  const max = effect.data['atkSlowMaxPct'] ?? 0;
  return Math.min(max, effect.stacks * perHit);
}

/**
 * Stack count needed to reach both caps, given a rampDebuff definition. Used when
 * applying the effect so neither dimension is capped short by maxStacks.
 */
export function frostRampMaxStacks(def: {
  moveSlowPerHit: number;
  moveSlowMaxPct: number;
  atkSlowPerHit: number;
  atkSlowMaxPct: number;
}): number {
  return Math.ceil(
    Math.max(
      def.moveSlowMaxPct / def.moveSlowPerHit,
      def.atkSlowMaxPct / def.atkSlowPerHit,
    ),
  );
}
