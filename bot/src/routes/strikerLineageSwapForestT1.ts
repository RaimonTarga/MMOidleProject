/**
 * Striker / Forest / Rapier — the first route that owns TWO cards for one row and
 * flips between them.
 *
 * `STRIKER_LINEAGE_FOREST_T1` buys a pure band, which only ever unlocks into an
 * EMPTY row. That path activates the card server-side as a side effect of the
 * purchase, so its `setActive` steps return early and the row-swap half of
 * `lineage:setActive` has never once run against a server: no route had ever
 * owned two cards of a single row.
 *
 * This one does. It buys the Rapier's Tempo stat card, then its Affliction stat
 * card, then flips the stat row to Affliction and back to Tempo — the two flips
 * that make `setLineageActive` take a live card out and put another one in,
 * recalculating stats and re-registering listeners each time.
 *
 * Same construction as its sibling: `STRIKER_T1` truncated the moment it holds a
 * Flash Rapier, with the swap steps appended, so every travel/farm/craft/equip
 * step keeps the schema the canonical route already proves and a failure here is
 * the lineage seam rather than a route-authoring slip. It states no prices and no
 * levels; `doUnlockCard` reads the magnitude table at runtime, and the second
 * card deliberately carries no `farmAt` so the executor has to find a biome that
 * drops an Affliction shard on its own.
 */
import {
  laneReferenceFor,
  lineageSwapReference,
  lineageSwapRouteSteps,
} from "../tierEntry/profiles";
import type { RouteStep } from "../route/types";
import { STRIKER_T1 } from "./strikerT1";

const FOREST = {
  kind: "biome" as const,
  biomeGroup: "forest",
  tier: 1,
  pick: "uncleared" as const,
};

/** Through `equip flash-rapier`; found by the step's shape, as its sibling does. */
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

function swapSteps(): RouteStep[] {
  const swap = lineageSwapReference(laneReferenceFor("lineage-rapier-tempo"));
  if (!swap) throw new Error("the Rapier's Tempo lane has no rival stat card to swap with");
  return lineageSwapRouteSteps(swap);
}

export const STRIKER_LINEAGE_SWAP_FOREST_T1 = {
  ...STRIKER_T1,
  id: "striker-lineage-swap-forest-t1",
  version: "1.0.0",
  description:
    "Striker (cadence-balanced) to a Flash Rapier in the Forest, then buys TWO stat "
    + "cards for the Rapier's stat row and flips between them twice. The first live "
    + "exercise of the lineage row SWAP rather than a first-time activation.",
  steps: [
    ...stepsThroughRapier(),
    ...swapSteps(),
    // Keep fighting with the re-chosen card live: the point of the second flip is
    // that the FIRST card is the one paying again afterwards.
    {
      type: "farm" as const,
      at: FOREST,
      until: { type: "biomeLevelAtLeast" as const, biomeGroup: "forest", level: 6 },
      label: "fight on with the re-slotted Tempo stat card",
    },
    { type: "milestone" as const, id: "lineage-stat-row-swapped-twice" },
  ] as RouteStep[],
};
