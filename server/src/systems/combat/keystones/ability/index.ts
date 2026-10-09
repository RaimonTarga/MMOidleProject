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
 * | Contagion | Outbreak | the affliction toolkit: a tag where resolveContagion writes, copyPlayerDotOnto on the tagged body's onKill |
 * | Binding Strike | Dragnet | the root writer in monsterControl (applyMonsterRoot) on every body adjacent to the target |
 *
 * The Guard verbs (design §22.4: immunity, control of the attacker, or a shared
 * mend — never damage) hang off the Guard's activation through `guardCast.ts`, or
 * off the hit the player takes:
 *
 * | Ability | Verb | Seam it reuses |
 * |---|---|---|
 * | Break Free | Backlash | the control ladder's shortest rung (applyStun, ladderStunMs) on every body adjacent to the player |
 */
export * from './registry';
export * from './scheduledHits';
export * from './guardCast';
export { WHIRLWIND_KEYSTONE } from './whirlwind';
export { AFTERSHOCK_KEYSTONE } from './aftershock';
export { BREAKTHROUGH_KEYSTONE } from './breakthrough';
export { OUTBREAK_KEYSTONE, outbreakTag, outbreakTagged } from './outbreak';
export { DRAGNET_KEYSTONE } from './dragnet';
export { BACKLASH_KEYSTONE } from './backlash';
