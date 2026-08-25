import type { Route } from "../route/types";
import { APPRENTICE_T1 } from "./apprenticeT1";
import { CONDUIT_T1 } from "./conduitT1";
import { SLINGER_T1 } from "./slingerT1";
import { SPIRIT_T1 } from "./spiritT1";
import { SQUIRE_T1 } from "./squireT1";
import { STRIKER_T1 } from "./strikerT1";

/**
 * Authored routes, keyed by id. All six T1 root-class baselines, authored as
 * DATA over the same executor -- adding a class never requires new executor
 * code.
 */
export const ROUTES = new Map<string, Route>(
  [STRIKER_T1, SQUIRE_T1, SLINGER_T1, SPIRIT_T1, APPRENTICE_T1, CONDUIT_T1].map((route) => [
    route.id,
    route,
  ]),
);

export function requireRoute(id: string): Route {
  const route = ROUTES.get(id);
  if (!route) {
    throw new Error(`unknown route "${id}" (have: ${[...ROUTES.keys()].join(", ")})`);
  }
  return route;
}
