/**
 * The eight keystones (design §4, amended 2026-10-01).
 *
 * Importing this module is what populates {@link KEYSTONE_MODULES}: each file
 * calls `defineKeystone` at module scope, so the registry is complete as soon as
 * anything in the folder is reachable. `lineageCards.ts` imports it and calls
 * `registerKeystones()` from `registerLineageCards()`, which keeps the live
 * server and the balance bench on an identical set — the same rule every other
 * combat listener in this codebase follows.
 *
 * | Packet | Keystone | Seam it changes |
 * |---|---|---|
 * | tempo | Chain | the `echo-hit` payoff, extended link by link |
 * | empowered | Shockwave | `applyPlayerAoe` on the empowered-flag-spending hit |
 * | affliction | Festering | a duration hold before `tickStatusEffectDurations` |
 * | control | Ladder | `applyMonsterRoot` then `applyStun`, latched per target |
 * | kill-chain | Refund | each root's own readiness state, on kill |
 * | engagement | Always First | `emitMechanicFired`, once per new body |
 * | bulwark | Immovable | the stationary-DR grace, the plating fade, `applyForcedMovement` |
 * | barrier-tempo | Unbroken | the refusal inside `stampBarrierDamage` |
 */
export * from './registry';
export { CHAIN_KEYSTONE, runChain } from './chain';
export { SHOCKWAVE_KEYSTONE } from './shockwave';
export { FESTERING_KEYSTONE, holdFesteringDots } from './festering';
export { LADDER_KEYSTONE } from './ladder';
export {
  REFUND_KEYSTONE, consumeRefundedDotFill, refundMechanic, refundedDotFillPending,
} from './refund';
export { ALWAYS_FIRST_KEYSTONE } from './alwaysFirst';
export {
  IMMOVABLE_KEYSTONE,
  immovableHoldsPlating,
  immovableMovementGraceMs,
  immovableRefusesDisplacement,
  pushImmovableRefusal,
} from './immovable';
export { UNBROKEN_KEYSTONE, unbrokenHoldsRecharge } from './unbroken';
