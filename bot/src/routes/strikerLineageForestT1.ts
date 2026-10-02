/**
 * Striker / Forest / Rapier Tempo — the first route that buys lineage cards over a
 * LIVE socket.
 *
 * `unlockCard` and `setActive` have existed since Phase 1c and
 * `lineageRouteSteps`'s own docstring says they are "spliced into a live T1 route
 * after the step that crafts and equips the base form" — but nothing spliced them.
 * Their only producer was `LINEAGE_LANE_PROFILES`, which the lane-matrix bench
 * drives IN-PROCESS, so the socket path (`lineage:unlockCard`, `lineage:setActive`
 * and their `lineage:result` acks) had never once run against a server. That is the
 * gap the 2026-10-01 overnight report closes with "wired but unobserved".
 *
 * This route is deliberately the shortest honest one: it is `STRIKER_T1` truncated
 * the moment it is holding a Flash Rapier, with the Tempo lane's own card steps
 * appended. Truncating rather than hand-authoring is the point — every travel,
 * farm, craft and equip step keeps the schema the canonical route already proves,
 * so a failure here is the lineage seam and not a route-authoring slip.
 *
 * It states no prices and no levels. `doUnlockCard` reads the magnitude table at
 * runtime and farms `farmAt` until the card's essence, shards, biome level and
 * Global Mastery all clear, so a tuning pass cannot invalidate this route, and a
 * packet with no T1 source raises a named stall instead of farming forever.
 */
import { lineageRouteSteps, laneReferenceFor } from "../tierEntry/profiles";
import type { RouteStep } from "../route/types";
import { STRIKER_T1 } from "./strikerT1";

const FOREST = {
  kind: "biome" as const,
  biomeGroup: "forest",
  tier: 1,
  pick: "uncleared" as const,
};

/**
 * Through `equip flash-rapier` — holding the base form is what opens the tree, so
 * this is the earliest point a card can be bought. Found by the step's own shape
 * rather than a hardcoded index, so a change to the canonical route's early game
 * moves this splice with it instead of silently cutting in the wrong place.
 */
function stepsThroughRapier(): RouteStep[] {
  const steps = STRIKER_T1.steps as RouteStep[];
  const equipAt = steps.findIndex(
    (step) => step.type === "equip" && step.definitionIds?.includes("flash-rapier"),
  );
  if (equipAt < 0) {
    throw new Error(
      "striker-t1 no longer equips flash-rapier; this route's splice point is gone",
    );
  }
  return steps.slice(0, equipAt + 1);
}

export const STRIKER_LINEAGE_FOREST_T1 = {
  ...STRIKER_T1,
  id: "striker-lineage-forest-t1",
  version: "1.0.0",
  description:
    "Striker (cadence-balanced) to a Flash Rapier in the Forest, then buys and slots "
    + "the Rapier's Tempo band over the live socket. The first live exercise of "
    + "lineage:unlockCard / lineage:setActive.",
  steps: [
    ...stepsThroughRapier(),
    ...lineageRouteSteps(laneReferenceFor("lineage-rapier-tempo")),
    // Keep fighting once the band is bought: `combat.fights` and the swap count are
    // what this run is measuring, and the band is complete well before Forest 6.
    {
      type: "farm" as const,
      at: FOREST,
      until: { type: "biomeLevelAtLeast" as const, biomeGroup: "forest", level: 6 },
      label: "fight on with the Tempo band live",
    },
    { type: "milestone" as const, id: "lineage-tempo-band-live" },
  ] as RouteStep[],
};
