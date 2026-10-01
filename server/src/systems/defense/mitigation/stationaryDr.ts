import { getResource, setResource, isCooldownActive, setCooldown, type TracksCombat } from '@mmo-idle/shared';
import type { PlayerEntity } from '../../../ecs/entity';
import type { World } from '../../../world/World';
import { markSliceDirty } from '../../../ecs/dirtyHelpers';
import { isPlayerActivelyInCombat } from '../../combat/ai/engagement';
import { isHardControlled } from '../../combat/status/playerHardControl';
import { registerCombatListener } from '../../combat/engine/combatPipeline';
import { immovableMovementGraceMs } from '../../combat/keystones/immovable';

// Mirrors the damage-reduction clamp applied in shared stats.ts so the ramp can
// never push total DR past the cap (in-place additions bypass that clamp).
const DR_CAP = 0.9;

// Float DR fraction currently added to mitigatesDamage.damageReduction.
const APPLIED_KEY = 'stationaryDrApplied';
// Milliseconds held stationary, accumulated up to the ramp time.
const RAMP_KEY = 'stationaryDrRampMs';
// Held for PRESSURE_MS after each incoming attack. The stance builds only while
// something is actually attacking you, so a stationary ranged player carrying a
// target into the next pull does not keep full stacks between fights.
const PRESSURE_CD = 'stationaryIncomingPressure';
const PRESSURE_MS = 2000;
// Milliseconds since movement began (0 while stationary). Published through
// {@link stationaryMovementMs} because the Bulwark keystone's own grace reads the
// same clock rather than keeping a second one.
const MOVEMENT_MS_KEY = 'stationaryMovementMs';
// Whether the player moved on the last tick, kept beside the clock so a reader
// never has to infer it from `movementMs > 0` (which is false on the first tick
// of movement when `dt` is 0).
const MOVING_KEY = 'stationaryMoving';
/**
 * Grace before a moving player starts shedding the stance: a step out of a boss
 * telegraph should not cost the whole ramp. The Bulwark keystone (Immovable)
 * raises it — see `immovableMovementGraceMs`.
 */
const MOVEMENT_GRACE_MS = 250;

/** Mark incoming pressure for the stance (any attack at the player, hit or not). */
export function registerStationaryDr(): void {
  registerCombatListener('onAttack', ctx => {
    if (ctx.defenderType === 'player') setCooldown(ctx.defender.tracksCombat, PRESSURE_CD, PRESSURE_MS);
  });
}

/**
 * Milliseconds this player has been moving (0 while stationary). The one clock
 * both this ramp and the Bulwark keystone's post-movement grace read.
 */
export function stationaryMovementMs(cs: TracksCombat): number {
  return getResource(cs, MOVEMENT_MS_KEY);
}

/** Whether this player moved on the last tick. See {@link MOVING_KEY}. */
export function stationaryIsMoving(cs: TracksCombat): boolean {
  return getResource(cs, MOVING_KEY) > 0;
}

/**
 * Advance the movement clock. Runs for EVERY live player, every tick, whatever
 * they are wearing.
 *
 * Deliberately not part of `runStationaryDr`: that step returns early when the
 * player has no stationary-DR item, and the Bulwark keystone (Immovable) reads
 * this same clock to hold plating stacks. While the clock lived inside the
 * ramp, a build with no stationary-DR passive never advanced it — so Immovable's
 * plating half did nothing — and a player who lost the passive mid-movement
 * froze it inside the grace window, which held their plating stacks against the
 * fade permanently.
 */
export function trackStationaryMovement(player: PlayerEntity, dt: number): void {
  const cs = player.tracksCombat;
  const x = player.hasPosition.current.x, y = player.hasPosition.current.y;
  // Actual position changes also catch movement caused by knockback or pulls.
  const displaced = getResource(cs, 'stationaryPositionKnown') > 0
    && (x !== getResource(cs, 'stationaryLastX') || y !== getResource(cs, 'stationaryLastY'));
  setResource(cs, 'stationaryPositionKnown', 1);
  setResource(cs, 'stationaryLastX', x);
  setResource(cs, 'stationaryLastY', y);
  const moving = player.isMoving !== undefined || displaced;
  setResource(cs, MOVING_KEY, moving ? 1 : 0);
  setResource(cs, MOVEMENT_MS_KEY, moving ? getResource(cs, MOVEMENT_MS_KEY) + dt : 0);
}

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
 * Build while stationary under incoming attacks. Movement (including
 * displacement) gets 250 ms grace, then sheds a full ramp in one second; once
 * the attacks stop (or combat ends) the ramp sheds over two seconds. Hard control pauses accumulation. The ramp multiplies damage
 * remaining after base DR and updates the networked mitigation stat in place.
 */
export function runStationaryDr(world: World, player: PlayerEntity, dt: number): void {
  const maxBonus = player.usesSkills.passives['defense.stationary-dr-pct'] ?? 0;
  if (maxBonus <= 0) return; // no item equipped — recalc already cleared any bonus
  const ramptime = player.usesSkills.passives['defense.stationary-dr-ramptime-ms'] ?? 0;
  if (ramptime <= 0) return;

  const cs = player.tracksCombat;
  const prevRamp = getResource(cs, RAMP_KEY);

  const active = isPlayerActivelyInCombat(world, player) && isCooldownActive(cs, PRESSURE_CD);
  // The clock itself is advanced by `trackStationaryMovement`, which the defense
  // tick runs for every player before this step.
  const moving = stationaryIsMoving(cs);
  const movementMs = stationaryMovementMs(cs);
  // Immovable (design §4) widens this grace, which is the whole of "stationary DR
  // persists 2 s after the player moves": inside it the ramp is held, not shed.
  const grace = immovableMovementGraceMs(player, MOVEMENT_GRACE_MS);
  const newRamp = moving && movementMs>grace
    ? Math.max(prevRamp - dt * ramptime / 1000, 0)
    : !active
    ? Math.max(prevRamp - dt * ramptime / 2000, 0)
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
