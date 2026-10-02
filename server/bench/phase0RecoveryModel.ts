/**
 * The pre-0b PERCENTAGE Recovery model, reproduced inside the current engine.
 *
 * Its own module rather than a function inside `phase0Recovery.ts`, because that
 * file is a bench ENTRYPOINT: importing it runs the whole sweep, so a test could
 * not reach the function at all.
 */
import assert from 'node:assert/strict';

/** A charm's pre-0b Recovery percentage, as the retired recipes authored it. */
export interface OldCharmPct { base: number; steps: number[] }

/**
 * The flat HP/s to pin `hasHealth.recovery` at so the pre-0b PERCENTAGE model is
 * reproduced inside the current engine, or `null` when there is nothing to pin.
 *
 * Only the `old` arm has a pre-0b table to read — `oldCharms` is `{}` under the
 * default `new` model — so the model check belongs INSIDE this function. It used
 * to sit at the call site, one line below an unconditional lookup, which made
 * `PHASE0_MODEL=new` + `PHASE0_ARM=charm` (the bench's own defaults, and its
 * primary arm) die on `no pre-0b value for plains-charm-t1`.
 */
export function oldModelRecovery(params: {
  model: 'old' | 'new';
  maxHp: number;
  charmId: string | undefined;
  plus: number;
  oldCharms: Record<string, OldCharmPct>;
}): number | null {
  if (params.model !== 'old') return null;
  const { charmId, oldCharms, plus } = params;
  let pct = 5; // base 5 = Phase 0a's naked rate
  if (charmId) {
    const c = oldCharms[charmId];
    assert(c, `no pre-0b value for ${charmId}`);
    pct += c.base + c.steps.slice(0, plus).reduce((a, b) => a + b, 0);
  }
  return params.maxHp * pct / 100;
}
