import { getResource, setResource } from '@mmo-idle/shared';
import type { PlayerEntity } from '../../../ecs/entity';
import type { World } from '../../../world/World';
import { markSliceDirty } from '../../../ecs/dirtyHelpers';

// Mirrors the damage-reduction clamp applied in shared stats.ts so the ramp can
// never push total DR past the cap (in-place additions bypass that clamp).
const DR_CAP = 0.9;

// Float DR fraction currently added to mitigatesDamage.damageReduction.
const APPLIED_KEY = 'stationaryDrApplied';
// Milliseconds held stationary, accumulated up to the ramp time.
const RAMP_KEY = 'stationaryDrRampMs';

/**
 * Current stationary-DR bonus actually applied (a 0..1 fraction). Read by the
 * buff descriptor to show the "Frost" tile and its magnitude.
 */
export function getStationaryDrBonus(player: PlayerEntity): number {
  return getResource(player.tracksCombat, APPLIED_KEY);
}

/**
 * Remove the applied stationary-DR bonus from `mitigatesDamage.damageReduction`
 * and zero the tracking resources. Does NOT mark the slice dirty — callers that
 * need a network sync handle that themselves.
 *
 * Called from `recalculatePlayerEntityStats` (before stats are rebuilt from
 * equipment, so the in-place bonus isn't double-counted or stranded on the new
 * base). Note: ordinary movement does NOT call this — it decays the ramp
 * gradually in `runStationaryDr` rather than dropping the whole bonus.
 */
export function resetStationaryDr(player: PlayerEntity): void {
  setResource(player.tracksCombat, RAMP_KEY, 0);
  const applied = getResource(player.tracksCombat, APPLIED_KEY);
  if (applied <= 0) return;
  player.mitigatesDamage.damageReduction -= applied;
  setResource(player.tracksCombat, APPLIED_KEY, 0);
}

/**
 * Per-tick ramp with symmetric decay. While the player is stationary (no
 * `isMoving` marker), the ramp accumulator advances toward
 * `defense.stationary-dr-ramptime-ms`; while moving, it erodes at the same rate.
 * The DR bonus is `defense.stationary-dr-pct × (ramp / ramptime)`.
 *
 * Because erosion is symmetric and continuous, a brief reposition only costs its
 * own duration's worth of ramp (≈ a fraction of one "stage"), while sustained
 * movement bleeds the whole bonus over one full ramptime. No hard stage cliffs.
 *
 * The bonus is tracked as a resource and applied in place (like hardening's
 * plating ramp), so the networked stat — and therefore the stat sheet — updates
 * as it ramps. Independent of combat: standing still anywhere "becomes the glacier".
 */
export function runStationaryDr(world: World, player: PlayerEntity, dt: number): void {
  const maxBonus = player.usesSkills.passives['defense.stationary-dr-pct'] ?? 0;
  if (maxBonus <= 0) return; // no item equipped — recalc already cleared any bonus
  const ramptime = player.usesSkills.passives['defense.stationary-dr-ramptime-ms'] ?? 0;
  if (ramptime <= 0) return;

  const cs = player.tracksCombat;
  const prevRamp = getResource(cs, RAMP_KEY);

  // Symmetric: standing accumulates ramp-time toward `ramptime`; moving erodes it
  // at the same rate, so a short step costs only its duration, not the whole bonus.
  const newRamp = player.isMoving !== undefined
    ? Math.max(prevRamp - dt, 0)
    : Math.min(prevRamp + dt, ramptime);
  if (newRamp !== prevRamp) setResource(cs, RAMP_KEY, newRamp);

  // Converge the in-place DR bonus onto the ramped target (clamped under DR_CAP).
  const applied = getResource(cs, APPLIED_KEY);
  // The base DR (without our bonus) — needed to clamp the total to DR_CAP.
  const baseDr = player.mitigatesDamage.damageReduction - applied;
  const headroom = Math.max(0, DR_CAP - baseDr);
  const targetBonus = Math.min(maxBonus * (newRamp / ramptime), headroom);

  const delta = targetBonus - applied;
  if (Math.abs(delta) > 1e-6) {
    player.mitigatesDamage.damageReduction += delta;
    setResource(cs, APPLIED_KEY, targetBonus);
    markSliceDirty(world, player, 'mitigatesDamage');
  }
}
