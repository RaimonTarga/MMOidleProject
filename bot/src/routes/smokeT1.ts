import { CLEARING_NODE_ID } from "@mmo-idle/shared";
import type { NodeRef, Route } from "../route/types";

/**
 * The harness smoke route, and the only route until each class's own route is
 * rebuilt in the class-first build (plan §5).
 *
 * Class-agnostic: it proves the harness end to end on a fresh character with
 * nothing but the kept step kinds. The tier-0 quest, the class root, a trip to
 * the Plains, two Plains levels, then one Plains armor piece crafted, worn and
 * asserted. The armor is the Plains T1 vest because every class can wear it.
 *
 * The class comes from the command line (`--class=<archetype>`, default
 * `cadence`): `routes/index.ts` rebuilds this route for it.
 */
export const SMOKE_T1_ID = "smoke-t1";

/** The class a smoke run plays when the command line names none. */
export const DEFAULT_SMOKE_CLASS = "cadence";

/** The Plains T1 armor recipe; no class restriction. */
export const SMOKE_T1_ARMOR = "plains-vest-t1";

const CLEARING: NodeRef = { kind: "node", nodeId: CLEARING_NODE_ID };
const PLAINS: NodeRef = { kind: "biome", biomeGroup: "plains", tier: 1, pick: "uncleared" };

export function smokeT1Route(classRoot: string): Route {
  return {
    id: SMOKE_T1_ID,
    version: "1.0.0",
    classRoot,
    description:
      `Harness smoke for ${classRoot}: the tier-0 quest, the class, Plains level 2, ` +
      `then the Plains armor crafted, equipped and asserted.`,
    steps: [
      { type: "travel", to: CLEARING },
      // `biomeLevelCap(playerTier 0, <any T1 biome>)` is 0, so nothing banks in
      // the Plains before the tier-0 quest makes the character tier 1, and the
      // class root costs the skill point that tier-up grants.
      {
        type: "farm",
        at: CLEARING,
        until: { type: "playerTierAtLeast", tier: 1 },
        label: "clear the tier-0 quest",
      },
      { type: "chooseClass", skillId: classRoot },
      { type: "travel", to: PLAINS },
      { type: "farm", at: PLAINS, until: { type: "biomeLevelAtLeast", biomeGroup: "plains", level: 2 } },
      { type: "craft", recipeIds: [SMOKE_T1_ARMOR], farmAt: PLAINS },
      { type: "equip", definitionIds: [SMOKE_T1_ARMOR] },
      {
        type: "assert",
        condition: { type: "equipped", definitionId: SMOKE_T1_ARMOR },
        message: "the Plains armor is equipped",
      },
    ],
    completion: { type: "equipped", definitionId: SMOKE_T1_ARMOR },
    milestones: [
      { id: "tier-1-reached", when: { type: "playerTierAtLeast", tier: 1 } },
      { id: "class-chosen", when: { type: "classSelected" } },
      { id: "plains-level-2", when: { type: "biomeLevelAtLeast", biomeGroup: "plains", level: 2 } },
      { id: "plains-armor-equipped", when: { type: "equipped", definitionId: SMOKE_T1_ARMOR } },
    ],
  };
}
