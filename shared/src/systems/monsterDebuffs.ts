import type { StatusEffect } from '../components/combat/effects';
import { AMBIENT_RAMP_KEY } from './ambientRamp';
import { isMonsterDotStatusEffectId } from './monsterDotFlavor';

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
 * Volcanic ambient heat — the volcano's `ambientRamp` (P4) effect id. Stacks grow
 * with combat dwell time in a volcanic node and shed out of combat / on leaving.
 * Self-managed by the server ambient-ramp pass (NOT a node-feature damage status).
 *
 * NET HARMFUL despite paying out `damageDealtPct`: the taken side climbs faster.
 * A cleanse strips the upside with it, which is the intended trade.
 */
export const VOLCANIC_HEAT_EFFECT_ID = 'volcanic-heat';

/** Cave troll opener: a short, source-owned root plus attack lockout. */
export const CAVE_LOCKDOWN_EFFECT_ID = 'cave-lockdown';

/**
 * Desert sundering (MonsterDefinition.appliesVulnerability) — a stacking,
 * cleansable status that raises the damage the player takes from every source.
 * Carries `damageTakenPct` so `playerIncomingDamageMult` picks it up generically;
 * see `systems/playerAmplifiers.ts`.
 */
export const SUNDERED_EFFECT_ID = 'sundered';

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

/**
 * Whether a player status effect is HARMFUL (a debuff or DoT). The single shared
 * authority for "what counts as a debuff on the player" — used by the Cleanse
 * ability, the Cleansing Breath rite (what it strips), and Lingering Momentum
 * (what it must NOT extend). Kept precise so beneficial buffs (mobility haste,
 * guard buffs, shields) are left alone.
 *
 * Covers the explicit debuff ids (slow/root, frost-ramp, Sun Mark, volcanic heat,
 * cave lockdown, sundered, antiheal, swamp rot) plus the generic markers any
 * DoT/node-hazard/ambient-ramp status carries
 * (`data.isDot`, `data.isNodeFeature`, `data.isAmbientRamp`) and monster-inflicted
 * DoT ids. The ambient-ramp marker is what makes a NEW biome ramp cleansable
 * without editing this function.
 */
export function isHarmfulPlayerStatusEffect(
  id: string,
  data: Record<string, number>,
): boolean {
  if (id === 'slow' || id === FROST_RAMP_EFFECT_ID) return true;
  if (id === SUN_MARK_EFFECT_ID || id === VOLCANIC_HEAT_EFFECT_ID) return true;
  if (id === CAVE_LOCKDOWN_EFFECT_ID || id === SUNDERED_EFFECT_ID) return true;
  if (id === 'antiheal' || id === 'swamp-rot') return true;
  if (isMonsterDotStatusEffectId(id)) return true;
  if ((data['isDot'] ?? 0) !== 0) return true;
  if ((data['isNodeFeature'] ?? 0) !== 0) return true;
  if ((data[AMBIENT_RAMP_KEY] ?? 0) !== 0) return true;
  return false;
}
