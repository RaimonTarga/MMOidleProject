import { getResource, setResource } from '@mmo-idle/shared';
import type { PlayerEntity } from '../../../ecs/entity';
import type { World } from '../../../world/World';
import { markSliceDirty } from '../../../ecs/dirtyHelpers';
import { isPlayerActivelyInCombat } from '../../combat/ai/engagement';
import { isHardControlled } from '../../combat/status/playerHardControl';

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
 * Build while stationary in active combat. Movement (including displacement)
 * gets 250 ms grace, then sheds a full ramp in one second; leaving combat also
 * sheds the ramp. Hard control pauses accumulation. The ramp multiplies damage
 * remaining after base DR and updates the networked mitigation stat in place.
 */
export function runStationaryDr(world: World, player: PlayerEntity, dt: number): void {
  const maxBonus = player.usesSkills.passives['defense.stationary-dr-pct'] ?? 0;
  if (maxBonus <= 0) return; // no item equipped — recalc already cleared any bonus
  const ramptime = player.usesSkills.passives['defense.stationary-dr-ramptime-ms'] ?? 0;
  if (ramptime <= 0) return;

  const cs = player.tracksCombat;
  const prevRamp = getResource(cs, RAMP_KEY);

  // Actual position changes also catch movement caused by knockback or pulls.
  const active = isPlayerActivelyInCombat(world, player);
  const x=player.hasPosition.current.x,y=player.hasPosition.current.y;
  const displaced=getResource(cs,'stationaryPositionKnown')>0 && (x!==getResource(cs,'stationaryLastX')||y!==getResource(cs,'stationaryLastY'));
  setResource(cs,'stationaryPositionKnown',1);setResource(cs,'stationaryLastX',x);setResource(cs,'stationaryLastY',y);
  const moving=player.isMoving!==undefined||displaced;
  const movementMs=moving?getResource(cs,'stationaryMovementMs')+dt:0;
  setResource(cs,'stationaryMovementMs',movementMs);
  const newRamp = !active || (moving && movementMs>250)
    ? Math.max(prevRamp - dt * ramptime / 1000, 0)
    : moving || isHardControlled(cs) ? prevRamp : Math.min(prevRamp + dt, ramptime);
  if (newRamp !== prevRamp) setResource(cs, RAMP_KEY, newRamp);

  // Converge the in-place DR bonus onto the ramped target (clamped under DR_CAP).
  const applied = getResource(cs, APPLIED_KEY);
  // The base DR (without our bonus) — needed to clamp the total to DR_CAP.
  const baseDr = player.mitigatesDamage.damageReduction - applied;
  const headroom = Math.max(0, DR_CAP - baseDr);
  const targetBonus = Math.min((1-baseDr)*maxBonus * (newRamp / ramptime), headroom);

  const delta = targetBonus - applied;
  if (Math.abs(delta) > 1e-6) {
    player.mitigatesDamage.damageReduction += delta;
    setResource(cs, APPLIED_KEY, targetBonus);
    markSliceDirty(world, player, 'mitigatesDamage');
  }
}
