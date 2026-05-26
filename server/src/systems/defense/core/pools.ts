import { getResource, type TracksCombat } from '@mmo-idle/shared';

// ── Storage keys for defensive pools ─────────────────────────────────────────
//
// These are kept private to the defense/ folder (re-exported in index.ts only
// for sibling files). Pools all use `getResource` / `setResource` /
// `addResource` from the combat-state helpers so they're persisted with the
// rest of the combat state and observable via `playerCs.resources`.

export const EVASION_KEY     = 'evasionHits';
export const DEBT_POOL_KEY   = 'damageDebtPool';
export const ABSORB_POOL_KEY = 'absorbPool';
export const BURST_POOL_KEY  = 'regenBurstPool';

/** Duration over which hit-to-DoT debt and leech/burst pools drain (ms). */
export const POOL_DRAIN_MS = 4000;

// ── Public pool accessors (for buffSync HUD descriptors) ─────────────────────

export function getDefenseDebtPool(cs: TracksCombat): number {
  return getResource(cs, DEBT_POOL_KEY);
}

export function getDefenseAbsorbPool(cs: TracksCombat): number {
  return getResource(cs, ABSORB_POOL_KEY);
}

export function getDefenseBurstPool(cs: TracksCombat): number {
  return getResource(cs, BURST_POOL_KEY);
}
