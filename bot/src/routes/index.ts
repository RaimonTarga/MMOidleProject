import { SKILL_TREE } from "@mmo-idle/shared";
import type { Route } from "../route/types";
import { CONDUIT_T1_ID, conduitT1Route } from "./conduitT1";
import { conduitT2Route } from "./conduitT2";
import { conduitT3Route } from "./conduitT3";
import { conduitOtherChainRoutes, conduitT4Route } from "./conduitT4";
import { SLINGER_T1_ID, slingerT1Route } from "./slingerT1";
import { slingerT2Route } from "./slingerT2";
import { slingerT3Route } from "./slingerT3";
import { slingerT4Route } from "./slingerT4";
import { APPRENTICE_T1_ID, apprenticeT1Route } from "./apprenticeT1";
import { apprenticeT2Route } from "./apprenticeT2";
import { apprenticeT3Route } from "./apprenticeT3";
import { apprenticeT4Route } from "./apprenticeT4";
import { SQUIRE_T1_ID, squireT1Route } from "./squireT1";
import { SQUIRE_CHAINS, SQUIRE_T2_ID, squireT2Route } from "./squireT2";
import { squireT3Route } from "./squireT3";
import { squireT4Route } from "./squireT4";
import { DEFAULT_SMOKE_CLASS, SMOKE_T1_ID, smokeT1Route } from "./smokeT1";
import { STRIKER_T1_ID, strikerT1Route } from "./strikerT1";
import { STRIKER_T2_ROUTE_IDS, strikerT2Route } from "./strikerT2";
import { STRIKER_T3_ROUTE_IDS, strikerT3Route } from "./strikerT3";
import { STRIKER_T4_ROUTE_IDS, strikerT4Route } from "./strikerT4";
import { SPIRIT_T1_ID, spiritT1Route } from "./spiritT1";
import { spiritT2Route } from "./spiritT2";
import { spiritT3Route } from "./spiritT3";
import { spiritT4Route } from "./spiritT4";

/**
 * The route registry.
 *
 * Class routes are rebuilt per class in the class-first build (plan §5).
 * `smoke-t1` stays class-agnostic. Each class's own route (`striker-t1`, `squire-t1`,
 * `conduit-t1`, `slinger-t1`, `slinger-t2`, `spirit-t1`, `apprentice-t1`) registers here as data over the same executor.
 * `squire-t3` continues the Squire past the tier-3 promotion (T3-W2); it stays out of the controlled batch list until it has run live.
 * `squire-t4` continues the Squire past the tier-4 promotion (T4-W2); same status.
 * `squire-t{2,3,4}-avenger` and `-juggernaut` are the Squire's other two discipline chains (OV2-SQUIRE); same status.
 * `striker-t3-*` (one per specialization, T3-W2) continue the Striker past the tier-3 promotion; they stay out of the controlled batch list until they have run live.
 * `striker-t4-*` (one per leaf, T4-W2) continue it past the tier-4 promotion; same status.
 * `conduit-t2` continues the Conduit past the tier-2 promotion (T2-W2); it is not yet in the controlled batch list.
 * `conduit-t3` continues it past the tier-3 promotion (T3-W2); same status.
 * `conduit-t4` continues it past the tier-4 promotion (T4-W2); same status.
 * `conduit-t{2,3,4}-swarm` and `-elite` are the Conduit's other two discipline chains (OV2-CONDUIT); same status.
 * `apprentice-t{2,3,4}-poison` and `-frost` are the Apprentice's other two school chains (OV2-APPRENTICE); same status.
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
const STRIKER_T3_ROUTES = Object.keys(STRIKER_T3_ROUTE_IDS).map((specialization) => strikerT3Route(specialization));
const STRIKER_T4_ROUTES = Object.keys(STRIKER_T4_ROUTE_IDS).map((leaf) => strikerT4Route(leaf));
const SQUIRE_ROUTE = squireT1Route();
const SQUIRE_T2_ROUTE = squireT2Route();
const SQUIRE_T3_ROUTE = squireT3Route();
const SQUIRE_T4_ROUTE = squireT4Route();
/** The Squire's other two discipline chains (OV2): `squire-t2..t4-avenger`, `squire-t2..t4-juggernaut`. */
const SQUIRE_CHAIN_ROUTES = ["squire-avenger", "squire-juggernaut"].flatMap((discipline) => [
  squireT2Route(discipline), squireT3Route(SQUIRE_CHAINS[discipline]!.specialization), squireT4Route(SQUIRE_CHAINS[discipline]!.leaf),
]);
const CONDUIT_ROUTE = conduitT1Route();
const CONDUIT_T2_ROUTE = conduitT2Route();
const CONDUIT_T3_ROUTE = conduitT3Route();
const CONDUIT_T4_ROUTE = conduitT4Route();
const CONDUIT_OTHER_ROUTES = conduitOtherChainRoutes();
const SLINGER_ROUTE = slingerT1Route();
const SLINGER_T2_ROUTE = slingerT2Route();
const SLINGER_T3_ROUTE = slingerT3Route();
const SLINGER_T4_ROUTE = slingerT4Route();
/** The Slinger's other two discipline chains (OV2): `slinger-t2..t4-siege`, `slinger-t2..t4-trickshot`. */
const SLINGER_CHAIN_ROUTES = (["siege", "trickshot"] as const).flatMap((discipline) => [
  slingerT2Route(discipline), slingerT3Route(discipline), slingerT4Route(discipline),
]);
const SPIRIT_ROUTE = spiritT1Route();
const SPIRIT_T2_ROUTE = spiritT2Route();
const SPIRIT_T3_ROUTE = spiritT3Route();
const SPIRIT_T4_ROUTE = spiritT4Route();
const SPIRIT_OTHER_DISCIPLINE_ROUTES = ["spirit-overflow", "spirit-reservoir"].flatMap((discipline) =>
  [spiritT2Route(discipline), spiritT3Route(discipline), spiritT4Route(discipline)]);
const APPRENTICE_ROUTE = apprenticeT1Route();
const APPRENTICE_T2_ROUTE = apprenticeT2Route();
const APPRENTICE_T3_ROUTE = apprenticeT3Route();
const APPRENTICE_T4_ROUTE = apprenticeT4Route();
/** The Apprentice's other two school chains (OV2): `apprentice-t2..t4-poison`, `apprentice-t2..t4-frost`. */
const APPRENTICE_CHAIN_ROUTES = ["apprentice-poison", "apprentice-frost"].flatMap((discipline) => [
  apprenticeT2Route(discipline), apprenticeT3Route(discipline), apprenticeT4Route(discipline),
]);
export const ROUTES = new Map<string, Route>([
  [SMOKE_ROUTE.id, SMOKE_ROUTE],
  [STRIKER_ROUTE.id, STRIKER_ROUTE],
  ...STRIKER_T2_ROUTES.map((route): [string, Route] => [route.id, route]),
  ...STRIKER_T3_ROUTES.map((route): [string, Route] => [route.id, route]),
  ...STRIKER_T4_ROUTES.map((route): [string, Route] => [route.id, route]),
  [SQUIRE_ROUTE.id, SQUIRE_ROUTE],
  [SQUIRE_T2_ROUTE.id, SQUIRE_T2_ROUTE],
  [SQUIRE_T3_ROUTE.id, SQUIRE_T3_ROUTE],
  [SQUIRE_T4_ROUTE.id, SQUIRE_T4_ROUTE],
  ...SQUIRE_CHAIN_ROUTES.map((route): [string, Route] => [route.id, route]),
  [CONDUIT_ROUTE.id, CONDUIT_ROUTE],
  [CONDUIT_T2_ROUTE.id, CONDUIT_T2_ROUTE],
  [CONDUIT_T3_ROUTE.id, CONDUIT_T3_ROUTE],
  [CONDUIT_T4_ROUTE.id, CONDUIT_T4_ROUTE],
  ...CONDUIT_OTHER_ROUTES.map((route): [string, Route] => [route.id, route]),
  [SLINGER_ROUTE.id, SLINGER_ROUTE],
  [SLINGER_T2_ROUTE.id, SLINGER_T2_ROUTE],
  [SLINGER_T3_ROUTE.id, SLINGER_T3_ROUTE],
  [SLINGER_T4_ROUTE.id, SLINGER_T4_ROUTE],
  ...SLINGER_CHAIN_ROUTES.map((route): [string, Route] => [route.id, route]),
  [SPIRIT_ROUTE.id, SPIRIT_ROUTE],
  [SPIRIT_T2_ROUTE.id, SPIRIT_T2_ROUTE],
  [SPIRIT_T3_ROUTE.id, SPIRIT_T3_ROUTE],
  [SPIRIT_T4_ROUTE.id, SPIRIT_T4_ROUTE],
  ...SPIRIT_OTHER_DISCIPLINE_ROUTES.map((route): [string, Route] => [route.id, route]),
  [APPRENTICE_ROUTE.id, APPRENTICE_ROUTE],
  [APPRENTICE_T2_ROUTE.id, APPRENTICE_T2_ROUTE],
  [APPRENTICE_T3_ROUTE.id, APPRENTICE_T3_ROUTE],
  [APPRENTICE_T4_ROUTE.id, APPRENTICE_T4_ROUTE],
  ...APPRENTICE_CHAIN_ROUTES.map((route): [string, Route] => [route.id, route]),
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
