/**
 * STATUS POLICY — what a player status effect IS, and what answers it.
 *
 * Before this module there was one question, `isHarmfulPlayerStatusEffect`, doing
 * three jobs: "should the HUD call this bad", "may Cleanse strip it", and "does the
 * `has-debuff` rune condition fire". Collapsing those meant a design decision in one
 * of them silently moved the other two — and it made §4.7 impossible to express,
 * because Heat has to be HARMFUL (it really is hurting you) while NOT being
 * cleanseable (walking out of the vent is the answer, not a button).
 *
 * The four axes are deliberately independent:
 *
 *   harmful       — counts as an affliction for the HUD and rune conditions.
 *   cleanse       — 'full' strips stacks normally, 'partial' lets Cleanse reduce it
 *                   but never delete it, 'immune' means Cleanse is the wrong answer.
 *   environmental — owned by the ROOM, not by a caster. Environmental effects are
 *                   re-applied by the node for as long as the player stands in it,
 *                   so "removing" one is at best temporary and at worst misleading.
 *   hardControl   — takes actions away rather than degrading them. Break Free's job,
 *                   never Cleanse's; collapsing the two would make Cleanse universal
 *                   and Break Free pointless.
 *
 * The default for an unlisted effect is the conservative one: whatever
 * `isHarmfulPlayerStatusEffect` already said, fully cleanseable, not environmental,
 * not hard control. So adding a new debuff behaves exactly as it did before, and
 * only an effect that OPTS IN gets the special handling.
 */

import { AMBIENT_RAMP_KEY } from './ambientRamp';
import {
  CAVE_LOCKDOWN_EFFECT_ID,
  isHarmfulPlayerStatusEffect,
  TUNDRA_CHILL_EFFECT_ID,
  VOLCANIC_HEAT_EFFECT_ID,
} from './monsterDebuffs';

export type CleansePolicy = 'full' | 'partial' | 'immune';

export interface StatusPolicy {
  harmful: boolean;
  cleanse: CleansePolicy;
  environmental: boolean;
  hardControl: boolean;
}

/**
 * Frozen and Stun live in `server/`, so their ids are restated here rather than
 * imported — `shared/` may not depend on the server. These MUST stay in step with
 * `FROZEN_EFFECT` (dot/t3/core/constants.ts) and `STUN_EFFECT` (combat/status/stun.ts);
 * `statusPolicy.test.ts` asserts they do, so a rename cannot drift them apart.
 */
export const FROZEN_STATUS_ID = 'dot-frozen';
export const STUN_STATUS_ID = 'stunned';

/**
 * How many stacks Cleanse may take off a `partial` effect in one use.
 *
 * A fixed small number rather than a fraction: an ambient ramp's stack count grows
 * with dwell time, so a percentage would make Cleanse scale with how long the player
 * has been standing in the room — rewarding the mistake it is supposed to answer.
 */
export const PARTIAL_CLEANSE_MAX_STACKS = 2;

const EXPLICIT_POLICIES = new Map<string, Partial<StatusPolicy>>([
  /**
   * HEAT is harmful and NOT ordinarily cleanseable (§4.7).
   *
   * The Volcano's whole positional question is "stay in the vent for the damage
   * bonus, or leave and cool down". A Cleanse that deletes Heat answers that
   * question with a button and removes the choice — so Cleanse is simply the wrong
   * tool here, the way it is the wrong tool for a stun.
   *
   * NOTE this is a live NERF to players in Volcano, who could previously strip Heat
   * (and, with it, the escalating damage TAKEN) at will. Deliberate; it needs a
   * balance pass alongside the Phase 5 Vent work.
   */
  [VOLCANIC_HEAT_EFFECT_ID, { harmful: true, cleanse: 'immune', environmental: true }],
  /**
   * CHILL is harmful and PARTIALLY cleanseable (§4.7).
   *
   * Unlike Heat it has no upside at all, and the Tundra encounters gate a freeze on
   * how chilled you are — so Cleanse has to be able to move that number or the
   * biome's answer set is empty. It reduces rather than deletes: the room keeps
   * re-applying it, so deleting it would only ever be true for a second and would
   * read as the button not working.
   */
  [TUNDRA_CHILL_EFFECT_ID, { harmful: true, cleanse: 'partial', environmental: true }],
  [CAVE_LOCKDOWN_EFFECT_ID, { harmful: true, cleanse: 'immune', hardControl: true }],
  [FROZEN_STATUS_ID, { harmful: true, cleanse: 'immune', hardControl: true }],
  [STUN_STATUS_ID, { harmful: true, cleanse: 'immune', hardControl: true }],
]);

export function statusPolicyFor(id: string, data: Record<string, number>): StatusPolicy {
  const harmful = isHarmfulPlayerStatusEffect(id, data);
  const explicit = EXPLICIT_POLICIES.get(id);
  if (explicit) {
    return {
      harmful: explicit.harmful ?? harmful,
      cleanse: explicit.cleanse ?? 'full',
      environmental: explicit.environmental ?? false,
      hardControl: explicit.hardControl ?? false,
    };
  }
  // An unlisted ambient ramp is environmental by construction, and partially
  // cleanseable for the same reason Chill is: the room keeps re-applying it.
  if ((data[AMBIENT_RAMP_KEY] ?? 0) !== 0) {
    return { harmful, cleanse: 'partial', environmental: true, hardControl: false };
  }
  return { harmful, cleanse: 'full', environmental: false, hardControl: false };
}

/** Whether Cleanse may touch this effect at all. */
export function isCleanseable(id: string, data: Record<string, number>): boolean {
  return statusPolicyFor(id, data).cleanse !== 'immune';
}

/**
 * How many stacks Cleanse may strip from this effect given its requested strength.
 * Returns 0 for an immune effect, and caps a `partial` one so it can be reduced but
 * never deleted outright.
 */
export function cleanseableStacks(
  id: string,
  data: Record<string, number>,
  requestedStacks: number,
): number {
  const policy = statusPolicyFor(id, data);
  if (policy.cleanse === 'immune') return 0;
  if (policy.cleanse === 'partial') return Math.min(requestedStacks, PARTIAL_CLEANSE_MAX_STACKS);
  return requestedStacks;
}
