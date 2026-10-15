import { SKILL_TREE } from "@mmo-idle/shared";
import type { Route } from "../route/types";
import { CONDUIT_T1_ID, conduitT1Route } from "./conduitT1";
import { conduitT2Route } from "./conduitT2";
import { SLINGER_T1_ID, slingerT1Route } from "./slingerT1";
import { slingerT2Route } from "./slingerT2";
import { APPRENTICE_T1_ID, apprenticeT1Route } from "./apprenticeT1";
import { apprenticeT2Route } from "./apprenticeT2";
import { SQUIRE_T1_ID, squireT1Route } from "./squireT1";
import { SQUIRE_T2_ID, squireT2Route } from "./squireT2";
import { DEFAULT_SMOKE_CLASS, SMOKE_T1_ID, smokeT1Route } from "./smokeT1";
import { STRIKER_T1_ID, strikerT1Route } from "./strikerT1";
import { STRIKER_T2_ROUTE_IDS, strikerT2Route } from "./strikerT2";
import { SPIRIT_T1_ID, spiritT1Route } from "./spiritT1";
import { spiritT2Route } from "./spiritT2";
import { spiritT3Route } from "./spiritT3";

/**
 * The route registry.
 *
 * Class routes are rebuilt per class in the class-first build (plan §5).
 * `smoke-t1` stays class-agnostic. Each class's own route (`striker-t1`, `squire-t1`,
 * `conduit-t1`, `slinger-t1`, `slinger-t2`, `spirit-t1`, `apprentice-t1`) registers here as data over the same executor.
 * `conduit-t2` continues the Conduit past the tier-2 promotion (T2-W2); it is not yet in the controlled batch list.
 */

/**
 * Class-agnostic routes, rebuilt for the class named on the command line
 * (`--class=<archetype>`). Every other route is authored for one class.
 */
const CLASS_AGNOSTIC_ROUTES = new Map<string, (classRoot: string) => Route>([
  [SMOKE_T1_ID, smokeT1Route],
]);

/** Authored routes, keyed by id; class-agnostic ones in their default class. */
const SMOKE_ROUTE = smokeT1Route(classRootFor(DEFAULT_SMOKE_CLASS));
const STRIKER_ROUTE = strikerT1Route();
const STRIKER_T2_ROUTES = Object.keys(STRIKER_T2_ROUTE_IDS).map((discipline) => strikerT2Route(discipline));
const SQUIRE_ROUTE = squireT1Route();
const SQUIRE_T2_ROUTE = squireT2Route();
const CONDUIT_ROUTE = conduitT1Route();
const CONDUIT_T2_ROUTE = conduitT2Route();
const SLINGER_ROUTE = slingerT1Route();
const SLINGER_T2_ROUTE = slingerT2Route();
const SPIRIT_ROUTE = spiritT1Route();
const SPIRIT_T2_ROUTE = spiritT2Route();
const SPIRIT_T3_ROUTE = spiritT3Route();
const APPRENTICE_ROUTE = apprenticeT1Route();
const APPRENTICE_T2_ROUTE = apprenticeT2Route();
export const ROUTES = new Map<string, Route>([
  [SMOKE_ROUTE.id, SMOKE_ROUTE],
  [STRIKER_ROUTE.id, STRIKER_ROUTE],
  ...STRIKER_T2_ROUTES.map((route): [string, Route] => [route.id, route]),
  [SQUIRE_ROUTE.id, SQUIRE_ROUTE],
  [SQUIRE_T2_ROUTE.id, SQUIRE_T2_ROUTE],
  [CONDUIT_ROUTE.id, CONDUIT_ROUTE],
  [CONDUIT_T2_ROUTE.id, CONDUIT_T2_ROUTE],
  [SLINGER_ROUTE.id, SLINGER_ROUTE],
  [SLINGER_T2_ROUTE.id, SLINGER_T2_ROUTE],
  [SPIRIT_ROUTE.id, SPIRIT_ROUTE],
  [SPIRIT_T2_ROUTE.id, SPIRIT_T2_ROUTE],
  [SPIRIT_T3_ROUTE.id, SPIRIT_T3_ROUTE],
  [APPRENTICE_ROUTE.id, APPRENTICE_ROUTE],
  [APPRENTICE_T2_ROUTE.id, APPRENTICE_T2_ROUTE],
]);

/**
 * The class root for a command-line class: an archetype id (`cadence`) or the
 * root itself (`cadence-root`). Throws on anything that is not a class root.
 */
export function classRootFor(classId: string): string {
  const root = classId.endsWith("-root") ? classId : `${classId}-root`;
  if (SKILL_TREE.get(root)?.tier !== 0) {
    const roots = [...SKILL_TREE.values()].filter((node) => node.tier === 0).map((node) => node.id);
    throw new Error(`unknown class "${classId}" (have: ${roots.join(", ")})`);
  }
  return root;
}

/**
 * Resolve a route id. `classId` rebuilds a class-agnostic route for that class;
 * naming a class for a route authored for one class is an error, not a silent
 * substitution.
 */
export function requireRoute(id: string, classId?: string): Route {
  const build = CLASS_AGNOSTIC_ROUTES.get(id);
  if (build && classId !== undefined) return build(classRootFor(classId));
  const route = ROUTES.get(id);
  if (!route) {
    throw new Error(`unknown route "${id}" (have: ${[...ROUTES.keys()].join(", ")})`);
  }
  if (classId !== undefined && classRootFor(classId) !== route.classRoot) {
    throw new Error(`route "${id}" is authored for ${route.classRoot}; --class applies only to class-agnostic routes`);
  }
  return route;
}

export function isClassAgnosticRouteId(id: string): boolean {
  return CLASS_AGNOSTIC_ROUTES.has(id);
}

/**
 * The only routes admitted to a clean controlled batch. Each class's route
 * joins this list when it is rebuilt; explicit one-off runs of anything else
 * need `--controlled=false`.
 */
export const CONTROLLED_ROUTE_IDS: readonly string[] = [
  SMOKE_T1_ID,
  STRIKER_T1_ID,
  ...Object.values(STRIKER_T2_ROUTE_IDS),
  SQUIRE_T1_ID,
  SQUIRE_T2_ID,
  CONDUIT_T1_ID,
  SLINGER_T1_ID,
  SPIRIT_T1_ID,
  APPRENTICE_T1_ID,
];

export function isControlledRouteId(id: string): boolean {
  return CONTROLLED_ROUTE_IDS.includes(id);
}
