import { makeT1Route } from "./t1RouteBuilder";
import { SQUIRE_T1_CONFIG } from "./squireT1";
import { STRIKER_T1_CONFIG } from "./strikerT1";

/**
 * Canonical Tier-1 handoff routes for the two frame variants that are not
 * represented by the ordinary class baselines.  These routes deliberately
 * reuse the validated class plans and change only the frame purchased after
 * the Forest seal.  They exist to produce real 1x Snapshot-B inputs for the
 * narrow Tier-2 frame validation campaign.
 */
export const SQUIRE_BALANCED_HANDOFF_T1 = makeT1Route({
  ...SQUIRE_T1_CONFIG,
  id: "squire-t1-balanced-handoff",
  version: "2.0.0-balanced-handoff",
  frameId: "cooldown-balanced",
  description:
    "Canonical T1 handoff for the Squire Balanced/Knight frame, using the validated Squire progression and gear plan.",
});

export const STRIKER_HEAVY_HANDOFF_T1 = makeT1Route({
  ...STRIKER_T1_CONFIG,
  id: "striker-t1-heavy-handoff",
  version: "3.0.0-heavy-handoff",
  frameId: "cadence-heavy",
  description:
    "Canonical T1 handoff for the Striker Heavy/Breaker frame, using the validated Striker progression and gear plan.",
});

export const T1_CANONICAL_FRAME_HANDOFF_ROUTES = [
  SQUIRE_BALANCED_HANDOFF_T1,
  STRIKER_HEAVY_HANDOFF_T1,
] as const;
