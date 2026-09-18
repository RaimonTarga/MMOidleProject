/**
 * The scheduling decision for a dependent survey block, kept pure so it can be
 * tested without running an experiment.
 *
 * Durability32's launcher gated its breadth block on `verifySurvey` alone, which
 * only answers "are the artifacts well formed". Correctly recorded wall cutoffs
 * therefore still authorized the dependent block. Artifact validity and
 * behavioral success are independent, so both must be supplied here.
 */

/** @typedef {'pass'|'fail'|'inconclusive'} GateStatus */

/**
 * @param {{artifactVerified: boolean, navigationGate?: {status: GateStatus, reasons?: string[]}}} input
 * @returns {{run: boolean, reason: string}}
 */
export function shouldRunDependentBlock(input) {
  const { artifactVerified, navigationGate } = input;
  if (!artifactVerified) return { run: false, reason: 'prerequisite-artifacts-unverified' };
  if (!navigationGate) return { run: false, reason: 'prerequisite-behavior-gate-missing' };
  if (navigationGate.status === 'fail') {
    return { run: false, reason: `prerequisite-behavior-failed: ${(navigationGate.reasons ?? []).join('; ')}` };
  }
  if (navigationGate.status === 'inconclusive') {
    // Never-exercised is not success. A dependent breadth block would inherit an
    // unmeasured runtime, so it waits rather than quietly proceeding.
    return { run: false, reason: `prerequisite-behavior-inconclusive: ${(navigationGate.reasons ?? []).join('; ')}` };
  }
  if (navigationGate.status !== 'pass') return { run: false, reason: 'prerequisite-behavior-unknown-status' };
  return { run: true, reason: 'prerequisite-verified-and-behavior-passed' };
}

/**
 * An identity-level verification failure invalidates every remaining block,
 * because they would all be measuring the wrong source. A block-local failure
 * does not: an independent block keeps its allocation.
 * @param {string} detail
 */
export function isGlobalIdentityFailure(detail) {
  return /\b(trial|revision|definitionsHash|hitboxesSha256)\b/.test(String(detail ?? ''));
}
