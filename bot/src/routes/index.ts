import type { Route } from "../route/types";
import { APPRENTICE_LETDOTSFINISH_T1 } from "./apprenticeLetDotsFinishT1";
import { APPRENTICE_T1 } from "./apprenticeT1";
import { APPRENTICE_V2_T1 } from "./apprenticeV2T1";
import { CONDUIT_T1 } from "./conduitT1";
import { CONDUIT_V2_T1 } from "./conduitV2T1";
import { SLINGER_MURKEYEONLY_T1 } from "./slingerMurkEyeOnlyT1";
import { SLINGER_T1 } from "./slingerT1";
import { SLINGER_V2_T1 } from "./slingerV2T1";
import { SPIRIT_MURKEYEONLY_T1 } from "./spiritMurkEyeOnlyT1";
import { SPIRIT_T1 } from "./spiritT1";
import { SPIRIT_V2_T1 } from "./spiritV2T1";
import { SQUIRE_HEAVYHAMMER_T1 } from "./squireHeavyHammerT1";
import { SQUIRE_BRACE_TANK_T1 } from "./squireBraceTankT1";
import { SQUIRE_T1 } from "./squireT1";
import { SQUIRE_V2_T1 } from "./squireV2T1";
import { STRIKER_T1 } from "./strikerT1";
import { STRIKER_BRACE_TANK_T1 } from "./strikerBraceTankT1";
import { STRIKER_V2_T1 } from "./strikerV2T1";
import {
  T2_CONTROL_ROUTE_IDS,
  T2_PROBE_ROUTES,
  T2_PROBE_ROUTE_IDS,
  T2_PROGRESSION_ROUTES,
  T2_PROGRESSION_ROUTE_IDS,
  T2_ROUTES,
  T2_ROUTE_IDS,
} from "./t2RouteBuilder";

/** Canonical class baselines, excluding the two deliberate Brace A/B arms. */
export { T1_BASELINE_ROUTE_IDS, T1_BASELINE_ROUTES } from "./t1Baselines";

/**
 * The only routes admitted to the clean Tier-1 controlled batch. Historical
 * variants remain addressable for explicit one-off runs, but are not members
 * of this registry.
 */
export const T1_CONTROLLED_ROUTE_IDS = [
  "striker-t1",
  "striker-brace-tank-t1",
  "squire-t1",
  "squire-brace-tank-t1",
  "slinger-t1",
  "spirit-t1",
  "apprentice-t1",
  "conduit-t1",
] as const;

/**
 * Authored routes, keyed by id. The six T1 root-class baselines, the Tier-1
 * experiment variants from bot-route-reference.md §12, and the "v2" overnight
 * round (2026-08-25) folding in the survivability + per-class gear changes --
 * all authored as DATA over the same executor.
 */
export const ROUTES = new Map<string, Route>(
  [
    STRIKER_T1,
    SQUIRE_T1,
    SLINGER_T1,
    SPIRIT_T1,
    APPRENTICE_T1,
    CONDUIT_T1,
    STRIKER_BRACE_TANK_T1,
    SQUIRE_BRACE_TANK_T1,
    SQUIRE_HEAVYHAMMER_T1,
    APPRENTICE_LETDOTSFINISH_T1,
    SLINGER_MURKEYEONLY_T1,
    SPIRIT_MURKEYEONLY_T1,
    STRIKER_V2_T1,
    SQUIRE_V2_T1,
    SLINGER_V2_T1,
    SPIRIT_V2_T1,
    APPRENTICE_V2_T1,
    CONDUIT_V2_T1,
    ...T2_ROUTES,
    ...T2_PROGRESSION_ROUTES,
    ...T2_PROBE_ROUTES,
  ].map((route) => [route.id, route]),
);

export { T2_CONTROL_ROUTE_IDS, T2_ROUTE_IDS, T2_PROGRESSION_ROUTE_IDS, T2_PROBE_ROUTE_IDS };

/** The eighteen Tier-2 branch routes: 6 class plans x 3 range nodes. */
export const T2_BRANCH_ROUTES: readonly Route[] = T2_ROUTES;

export function requireRoute(id: string): Route {
  const route = ROUTES.get(id);
  if (!route) {
    throw new Error(`unknown route "${id}" (have: ${[...ROUTES.keys()].join(", ")})`);
  }
  return route;
}

/** Exact eight-route clean combat-validation cohort. */
export const T1_CONTROLLED_ROUTES: readonly Route[] = T1_CONTROLLED_ROUTE_IDS.map(requireRoute);

export function isT1ControlledRouteId(id: string): boolean {
  return (T1_CONTROLLED_ROUTE_IDS as readonly string[]).includes(id);
}

/**
 * The Tier-2 bossless progression cohort, admitted to the CONTROLLED batch path.
 *
 * Admission is what unlocks `--executionMode=isolated-parallel` and its area
 * reservations: `batch.ts` only builds a `CombatReservationManager` for a controlled batch,
 * and the controlled path previously rejected every non-T1 route id. Without
 * this, a six-class Tier-2 batch could only run sequentially or in legacy
 * uncontrolled parallel -- and uncontrolled parallel is what put all five bots
 * of T2-E009 in a single node and voided the run as comparative evidence.
 */
export const T2_CONTROLLED_ROUTE_IDS: readonly string[] = [
  ...T2_PROGRESSION_ROUTE_IDS,
  ...T2_PROBE_ROUTE_IDS,
];

export function isT2ControlledRouteId(id: string): boolean {
  return T2_CONTROLLED_ROUTE_IDS.includes(id);
}

/** Any route id the controlled batch path will admit, Tier-1 or Tier-2. */
export function isControlledRouteId(id: string): boolean {
  return isT1ControlledRouteId(id) || isT2ControlledRouteId(id);
}
