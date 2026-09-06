/**
 * The player attack-cadence multiplier — ONE definition, two consumers.
 *
 * Temporary attack-speed effects are deliberately never written into
 * `performsAttack.attackCooldown`: the Zealot's own Frenzy already mutates that
 * stat from a cached base, and two mutators each treating the other's output as
 * "the clean base" ratchet the cooldown toward zero over a few ticks. So every
 * temporary haste and slow is applied as a MULTIPLIER at the cadence gate
 * instead, leaving the stat clean.
 *
 * The cost of that design was a silent one: because the stat never changed,
 * nothing that displayed the stat ever changed either. The Attack Speed row on
 * the stat sheet reads `attackCooldown` straight, so Frenzy, both stance windows
 * and both environmental slows were all invisible to the player — the abilities
 * worked, and looked like they did nothing.
 *
 * This module is the fix: the gate and the HUD mirror now read the SAME
 * function, so a modifier cannot reach one without reaching the other.
 */
import {
  FROST_RAMP_EFFECT_ID,
  ABILITY_FRENZY_EFFECT_ID,
  getStatusEffect,
  frostRampAtkSlowPct,
  ambientRampAttackSlowPct,
  ambientRampStatus,
  type TracksCombat,
} from "@mmo-idle/shared";
import { stanceAttackSpeedBonus } from "../../player/stances/stanceBehaviors";

/**
 * Total temporary SLOW on the attack cadence, as a multiplier ≥ 1.
 *
 * Frost ramp and the ambient node ramp (Tundra Chill) are summed rather than
 * multiplied so the two cannot compound into an unauthored stun.
 */
export function attackSlowMult(cs: TracksCombat): number {
  const frostRamp = getStatusEffect(cs, FROST_RAMP_EFFECT_ID);
  const ambientRamp = ambientRampStatus(cs);
  return (
    1 +
    (frostRamp ? frostRampAtkSlowPct(frostRamp) : 0) +
    (ambientRamp ? ambientRampAttackSlowPct(ambientRamp) : 0)
  );
}

/**
 * Total temporary HASTE bonus, as a fraction (0.3 = +30% attack speed).
 *
 * Frenzy and the stance-owned windows (Reaper momentum, Powering Up's released
 * charge) SUM rather than multiply: they are all "+X% attack speed" promises,
 * and the shared accumulator semantics say those add.
 */
export function attackHasteBonus(cs: TracksCombat): number {
  const frenzy = getStatusEffect(cs, ABILITY_FRENZY_EFFECT_ID);
  const frenzyPct =
    frenzy && frenzy.remainingMs > 0
      ? Math.max(0, frenzy.data["attackSpeedPct"] ?? 0)
      : 0;
  return frenzyPct + Math.max(0, stanceAttackSpeedBonus(cs));
}

/**
 * The multiplier applied to `attackCooldown` at the cadence gate.
 *
 * Below 1 means attacking FASTER (a shorter interval between swings); above 1
 * means slower. Exactly 1 means no temporary modifier is active, which is what
 * the HUD uses to decide whether there is anything worth showing.
 */
export function attackCadenceMult(cs: TracksCombat): number {
  const haste = attackHasteBonus(cs);
  return attackSlowMult(cs) * (haste > 0 ? 1 / (1 + haste) : 1);
}
