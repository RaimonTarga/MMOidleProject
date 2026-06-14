import { getResource, setResource } from '@mmo-idle/shared';
import type { PlayerEntity } from '../../../ecs/entity';
import type { World } from '../../../world/World';
import { markSliceDirty } from '../../../ecs/dirtyHelpers';
import { COMBAT_ELAPSED_KEY } from '../core/pools';

// Mirrors the DR clamp in shared stats.ts (in-place additions bypass it).
const DR_CAP = 0.9;

// Float DR fraction currently added to mitigatesDamage.damageReduction.
const APPLIED_KEY = 'sustainedFightDrApplied';

/** Current sustained-fight DR bonus applied (0..1). Read by the buff descriptor. */
export function getSustainedFightDrBonus(player: PlayerEntity): number {
  return getResource(player.tracksCombat, APPLIED_KEY);
}

/**
 * Remove the applied sustained-fight DR bonus and zero the tracking. Does NOT
 * mark the slice dirty. Called from `recalculatePlayerEntityStats` before stats
 * rebuild. (Out-of-combat decay is handled by `runSustainedFightDr` itself, which
 * sees the combat-elapsed timer reset to 0.)
 */
export function resetSustainedFightDr(player: PlayerEntity): void {
  const applied = getResource(player.tracksCombat, APPLIED_KEY);
  if (applied <= 0) return;
  player.mitigatesDamage.damageReduction -= applied;
  setResource(player.tracksCombat, APPLIED_KEY, 0);
}

/**
 * Per-tick: while in combat, ramp `mitigatesDamage.damageReduction` up in discrete
 * steps — one `sustained-fight-dr-bonus` increment per `ramptime ÷ (dr-max/bonus)`
 * ms of combat, capping at `sustained-fight-dr-max`. Reaching the cap takes the
 * full ramptime. Leaving combat zeroes the combat timer, so the bonus is removed.
 *
 * Applied in place (like hardening) so the networked stat / stat sheet update live.
 */
export function runSustainedFightDr(world: World, player: PlayerEntity): void {
  const bonus = player.usesSkills.passives['defense.sustained-fight-dr-bonus'] ?? 0;
  const drMax = player.usesSkills.passives['defense.sustained-fight-dr-max'] ?? 0;
  if (bonus <= 0 || drMax <= 0) return; // no item — recalc cleared any applied bonus
  const ramptime = player.usesSkills.passives['defense.sustained-fight-ramptime-ms'] ?? 0;
  if (ramptime <= 0) return;

  const cs = player.tracksCombat;
  const elapsed = getResource(cs, COMBAT_ELAPSED_KEY);

  // One `bonus` step every (ramptime ÷ number-of-steps) ms; cap at drMax.
  const stepMs = ramptime / (drMax / bonus);
  const steps = stepMs > 0 ? Math.floor(elapsed / stepMs) : 0;
  const targetUncapped = Math.min(drMax, steps * bonus);

  const applied = getResource(cs, APPLIED_KEY);
  const baseDr = player.mitigatesDamage.damageReduction - applied;
  const target = Math.min(targetUncapped, Math.max(0, DR_CAP - baseDr));

  const delta = target - applied;
  if (Math.abs(delta) > 1e-6) {
    player.mitigatesDamage.damageReduction += delta;
    setResource(cs, APPLIED_KEY, target);
    markSliceDirty(world, player, 'mitigatesDamage');
  }
}
