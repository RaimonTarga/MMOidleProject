import type { TracksCombat } from '../components/combat/tracksCombat';
import type { StatusEffect } from '../components/combat/effects';

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
 * Contributions add without a global cap. Individual statuses own their stack
 * limits and optional diminishing returns (Volcanic Heat).
 *
 * Consumers: Desert's `appliesVulnerability` (taken), Volcano's ambient heat
 * (both — Session 5).
 */

/** Status `data` key: incoming-damage amplifier fraction PER STACK. */
export const DAMAGE_TAKEN_PCT_KEY = 'damageTakenPct';

/** Status `data` key: outgoing-damage amplifier fraction PER STACK. */
export const DAMAGE_DEALT_PCT_KEY = 'damageDealtPct';

/** Shared by combat and status presentation; only authored effects soften stacks. */
export function statusDamageAmplifierPct(effect: StatusEffect, key: string): number {
  const perStack = effect.data[key] ?? 0;
  if (perStack <= 0) return 0;
  let stacks = Math.max(1, effect.stacks);
  const breakpoint = effect.data.damageSoftcapStacks ?? 0;
  const scale = effect.data.damageSoftcapScale ?? 0;
  if (breakpoint > 0 && scale > 0 && stacks > breakpoint) {
    stacks = breakpoint + scale * Math.log1p((stacks - breakpoint) / scale);
  }
  return perStack * stacks;
}

function summedAmplifierPct(cs: TracksCombat, key: string): number {
  let total = 0;
  for (const effect of cs.statusEffects) {
    total += statusDamageAmplifierPct(effect, key);
  }
  return total;
}

/**
 * Multiplier on damage the player TAKES (1 = unmodified). Read in the player
 * `onDamageTaken` path, before the damage-cap so an amplified spike is still
 * clipped by the cap the player paid for.
 */
export function playerIncomingDamageMult(cs: TracksCombat): number {
  return 1 + summedAmplifierPct(cs, DAMAGE_TAKEN_PCT_KEY);
}

/**
 * Multiplier on damage the player DEALS (1 = unmodified). Read once in the player
 * attack path, alongside `shared.damage-mult`.
 */
export function playerOutgoingDamageMult(cs: TracksCombat): number {
  return 1 + summedAmplifierPct(cs, DAMAGE_DEALT_PCT_KEY);
}
