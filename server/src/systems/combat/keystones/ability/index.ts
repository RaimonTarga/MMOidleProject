/**
 * The ability keystone verbs (design §22.4, §22.11) — one module per verb.
 *
 * Importing this module is what populates {@link ABILITY_KEYSTONE_MODULES}: each
 * file calls `defineAbilityKeystone` at module scope. `../index.ts` re-exports it,
 * and the lane registry's `registerKeystones()` calls `registerAbilityKeystones()`,
 * so the live server and the bench see one set.
 *
 * | Ability | Verb | Seam it reuses |
 * |---|---|---|
 * | Sweep | Whirlwind | the channelled beam's tick machinery + applyPlayerAoe around the owner |
 * | Slam | Aftershock | one delayed applyPlayerAoe at the resolved cast position, the rank's radius |
 * | Charge | Breakthrough | the control ladder's shortest rung (applyStun, ladderStunMs) on the arrival blow |
 */
export * from './registry';
export * from './scheduledHits';
export { WHIRLWIND_KEYSTONE } from './whirlwind';
export { AFTERSHOCK_KEYSTONE } from './aftershock';
export { BREAKTHROUGH_KEYSTONE } from './breakthrough';
