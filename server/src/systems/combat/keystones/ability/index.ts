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
 * | Detonate | Chain Reaction | a Detonate kill runs resolveDetonate once on every afflicted body in the cast's reach |
 * | Snipe | Pierce | applyPlayerAoeTo on every body the line from the delivering body through the target crosses behind it |
 * | Cull | Harvest | a Cull kill re-strikes (Cull's own strike, applyPlayerAoeTo) the nearest body below the killed target's share, while it kills |
 * | Imbue Lightning | Fork | Imbue's charge consumer (onChargeSpent): each imbued hit arcs a share to the nearest other body |
 * | Stunning Strike | Relay | the landed stun is watched (tick); when it runs out applyStun jumps to the nearest body not stunned this fight |
 * | Disengage | Vanish | setAggroTarget(null) on every monster near the departure point; selectMonsterAggroCandidate skips the marked player until their next hit |
 *
 * The Guard verbs (design §22.4: immunity, control of the attacker, or a shared
 * mend — never damage) hang off the Guard's activation through `guardCast.ts`, or
 * off the hit the player takes:
 *
 * | Ability | Verb | Seam it reuses |
 * |---|---|---|
 * | Break Free | Backlash | the control ladder's shortest rung (applyStun, ladderStunMs) on every body adjacent to the player |
 * | Brace | Riposte | an afterHit listener on a melee hit taken while Braced; the shortest rung on the attacker, once per attacker per Brace |
 * | Bramble Guard | Entangle | the thorns' own afterHit moment; applyMonsterSlow on the attacker under its own slow id (ability-entangled), the slow payoff off the table |
 * | Endure | Unyielding | ability-unyielding on Endure's clock; the hard-control appliers refuse through refusesHardControl / playerRefusesStatus |
 * | Cleanse | Immunity | the stripped status ids as refused kinds on ability-immunity (the ward unit's window); the debuff writers refuse through playerRefusesStatus |
 * | Second Wind | Shared Breath | the Recovery engine's skill source on each same-node InParty member at the owner's fraction; summons mended in the summoner's per-tick owner-to-summon pass |
 * | Recuperate | Overflow | an overheal sink on applyHealToPlayer's overheal-ward hook: while the mend runs, the spill tops up one ward to the ward payoff's cap |
 */
export * from './registry';
export * from './scheduledHits';
export * from './guardCast';
export { WHIRLWIND_KEYSTONE } from './whirlwind';
export { AFTERSHOCK_KEYSTONE } from './aftershock';
export { BREAKTHROUGH_KEYSTONE } from './breakthrough';
export { OUTBREAK_KEYSTONE, outbreakTag, outbreakTagged } from './outbreak';
export { DRAGNET_KEYSTONE } from './dragnet';
export { CHAIN_REACTION_KEYSTONE } from './chainReaction';
export { PIERCE_KEYSTONE } from './pierce';
export { HARVEST_KEYSTONE } from './harvest';
export { FORK_KEYSTONE } from './fork';
export { RELAY_KEYSTONE, relayCarriers, relayedThisFight } from './relay';
export { VANISH_KEYSTONE } from './vanish';
export { VANISH_FLAG, hiddenByVanish, monsterSeesThroughVanish, playerVanished } from './vanishMark';
export { BACKLASH_KEYSTONE } from './backlash';
export { RIPOSTE_KEYSTONE } from './riposte';
export { ENTANGLE_KEYSTONE } from './entangle';
export { UNYIELDING_KEYSTONE } from './unyielding';
export { IMMUNITY_KEYSTONE } from './immunity';
export { SHARED_BREATH_KEYSTONE, mendSummonWithOwner } from './sharedBreath';
export { OVERFLOW_KEYSTONE, overflowWardOf } from './overflow';
export { guardKeystoneMagnitude, payoffWindowMs } from './guardValues';
