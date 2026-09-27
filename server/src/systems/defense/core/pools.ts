import { getResource, type TracksCombat } from '@mmo-idle/shared';

// ── Storage keys for defensive pools ─────────────────────────────────────────
//
// These are kept private to the defense/ folder (re-exported in index.ts only
// for sibling files). Pools all use `getResource` / `setResource` /
// `addResource` from the combat-state helpers so they're persisted with the
// rest of the combat state and observable via `playerCs.resources`.

export const DEBT_POOL_KEY   = 'damageDebtPool';
export const ABSORB_POOL_KEY = 'absorbPool';

// Milliseconds elapsed in the current combat engagement (reset to 0 out of combat).
// Maintained once per tick in updateDefensiveSystems; read by combat-duration ramps
// (absorb ramp) including from the combat pipeline.
export const COMBAT_ELAPSED_KEY = 'combatElapsedMs';

/** Duration over which hit-to-DoT debt and the absorb pool drain (ms). */
export const POOL_DRAIN_MS = 4000;

// ── Public pool accessors (for buffSync HUD descriptors) ─────────────────────

export function getDefenseDebtPool(cs: TracksCombat): number {
  return getResource(cs, DEBT_POOL_KEY);
}

export function getDefenseAbsorbPool(cs: TracksCombat): number {
  return getResource(cs, ABSORB_POOL_KEY);
}

export function getCombatElapsedMs(cs: TracksCombat): number {
  return getResource(cs, COMBAT_ELAPSED_KEY);
}
