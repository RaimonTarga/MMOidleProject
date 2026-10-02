/**
 * Recovery renders as a number a player can read.
 *
 * Phase 0b made Recovery a FLAT HP/s rate, so the stat is now a sum of fractional
 * charm and passive contributions rather than a whole number. The HUD's full
 * Defense & Recovery row interpolated it raw, so a realistic charm sum rendered as
 * `18.799999999999997 HP/s` — float noise shipped to the player. The compact stat
 * tile open-coded a one-decimal rounding of its own, which is how the two rows came
 * to disagree about the same stat in the first place.
 *
 * Both sites now format through `formatRecoveryRate`. This pins the rule, and in
 * particular pins it against the float sums that actually occur: a charm's
 * contribution is `pool / 100`, which is where the noise comes from.
 */
import { formatRecoveryRate } from './gameConfig';

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

// A float sum never reaches the player with its noise. `130 / 100 * 3` is a charm's
// own arithmetic (a share of the tier's reference pool), which is where it comes from.
for (const raw of [18.799999999999997, 0.1 + 0.2, 6.5 + 1.1 + 1.1 + 1.1, 130 / 100 * 3]) {
  const shown = formatRecoveryRate(raw);
  assert(
    /^-?\d+(\.\d)?$/.test(shown),
    `${raw} should render with at most one decimal, got "${shown}"`,
  );
}

// One decimal is kept, because the stat really does move in tenths.
assert(formatRecoveryRate(18.8) === '18.8', `18.8 should keep its decimal, got "${formatRecoveryRate(18.8)}"`);
assert(formatRecoveryRate(6.5) === '6.5', `6.5 should keep its decimal, got "${formatRecoveryRate(6.5)}"`);
assert(
  formatRecoveryRate(18.799999999999997) === '18.8',
  `the reported value should render as 18.8, got "${formatRecoveryRate(18.799999999999997)}"`,
);

// A whole number stays whole: no trailing ".0" on a naked rate.
assert(formatRecoveryRate(10) === '10', `10 should render as "10", got "${formatRecoveryRate(10)}"`);
assert(formatRecoveryRate(0) === '0', `0 should render as "0", got "${formatRecoveryRate(0)}"`);

// Rounding is to the nearest tenth, not truncation.
assert(formatRecoveryRate(6.46) === '6.5', `6.46 should round to 6.5, got "${formatRecoveryRate(6.46)}"`);
assert(formatRecoveryRate(6.44) === '6.4', `6.44 should round to 6.4, got "${formatRecoveryRate(6.44)}"`);

console.log('recoveryFormat.test.ts: ok');
