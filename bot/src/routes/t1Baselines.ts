import type { Route } from "../route/types";
import { APPRENTICE_T1 } from "./apprenticeT1";
import { CONDUIT_T1 } from "./conduitT1";
import { SLINGER_T1 } from "./slingerT1";
import { SPIRIT_T1 } from "./spiritT1";
import { SQUIRE_T1 } from "./squireT1";
import { STRIKER_T1 } from "./strikerT1";

/**
 * The six canonical Tier-1 class baselines, in their own module.
 *
 * Split out of `routes/index.ts` to break an import cycle: the Tier-2 entry
 * TEMPLATES are derived from these routes, and the Tier-2 ROUTES are built from
 * those templates, so `index.ts -> t2RouteBuilder -> tierEntry/profiles ->
 * index.ts` closed a loop that left `TIER_ENTRY_PROFILES` undefined at module
 * evaluation time. Everything that needs the baselines reads them from here.
 */
export const T1_BASELINE_ROUTE_IDS = [
  "striker-t1",
  "squire-t1",
  "slinger-t1",
  "spirit-t1",
  "apprentice-t1",
  "conduit-t1",
] as const;

export const T1_BASELINE_ROUTES: readonly Route[] = [
  STRIKER_T1,
  SQUIRE_T1,
  SLINGER_T1,
  SPIRIT_T1,
  APPRENTICE_T1,
  CONDUIT_T1,
];
