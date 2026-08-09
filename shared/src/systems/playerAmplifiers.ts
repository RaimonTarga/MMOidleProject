import type { TracksCombat } from '../components/combat/tracksCombat';

/**
 * P3 — player damage amplifiers (Biome Ecology Pass 2).
 *
 * Two status-driven multipliers on the player, the mirror image of
 * `getAntiHealMult`: one scaling the damage the player TAKES, one scaling the
 * damage the player DEALS. Neither is owned by a single status id — any status
 * effect on the player contributes by carrying `damageTakenPct` / `damageDealtPct`
 * in its `data` (which is `Record<string, number>` only, so a fraction per stack
 * is all it can be). That is what lets one status carry both dimensions at once:
 * Volcano's heat is a single effect that makes you hit harder AND take more,
 * exactly as `frost-ramp` carries move-slow and attack-slow together.
 *
 * Both are CAPPED. The taken cap is the hard guard that stops a stacking
 * vulnerability from turning into a one-shot; the dealt cap is what stops a
 * greed ramp from outrunning the farm-rate budget.
 *
 * Consumers: Desert's `appliesVulnerability` (taken), Volcano's ambient heat
 * (both — Session 5).
 */

/** Status `data` key: incoming-damage amplifier fraction PER STACK. */
export const DAMAGE_TAKEN_PCT_KEY = 'damageTakenPct';

/** Status `data` key: outgoing-damage amplifier fraction PER STACK. */
export const DAMAGE_DEALT_PCT_KEY = 'damageDealtPct';

/**
 * Hard ceiling on the summed incoming amplifier (+100% taken = double damage).
 * Placeholder — user balance pass. Deliberately lower-headroom than it looks:
 * it multiplies AFTER plating/DR but BEFORE the player damage-cap, so a capped
 * build still clips the spike.
 */
export const MAX_DAMAGE_TAKEN_PCT = 1.0;

/** Hard ceiling on the summed outgoing amplifier. Placeholder — user balance pass. */
export const MAX_DAMAGE_DEALT_PCT = 0.5;

function summedAmplifierPct(cs: TracksCombat, key: string, cap: number): number {
  let total = 0;
  for (const effect of cs.statusEffects) {
    const perStack = effect.data[key];
    if (perStack === undefined || perStack <= 0) continue;
    total += perStack * Math.max(1, effect.stacks);
  }
  return Math.min(cap, total);
}

/**
 * Multiplier on damage the player TAKES (1 = unmodified). Read in the player
 * `onDamageTaken` path, before the damage-cap so an amplified spike is still
 * clipped by the cap the player paid for.
 */
export function playerIncomingDamageMult(cs: TracksCombat): number {
  return 1 + summedAmplifierPct(cs, DAMAGE_TAKEN_PCT_KEY, MAX_DAMAGE_TAKEN_PCT);
}

/**
 * Multiplier on damage the player DEALS (1 = unmodified). Read once in the player
 * attack path, alongside `shared.damage-mult`.
 */
export function playerOutgoingDamageMult(cs: TracksCombat): number {
  return 1 + summedAmplifierPct(cs, DAMAGE_DEALT_PCT_KEY, MAX_DAMAGE_DEALT_PCT);
}
