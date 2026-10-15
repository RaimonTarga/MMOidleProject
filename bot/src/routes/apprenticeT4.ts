import { biomeLevelCap, type ClassConfig } from "@mmo-idle/shared";
import { allOf, type NodeRef, type Route, type RouteStep } from "../route/types";
import { APPRENTICE_CLASS_ROOT } from "./apprenticeT1";
import { apprenticeT3Payoffs, apprenticeT3Route, APPRENTICE_T3_ZONES } from "./apprenticeT3";

/**
 * The Apprentice's T4 route (T4-W2, bible §9.7, §9.16): the T3 route, the tier-4 promotion, the
 * leaf pick (an `unlockSkill` on its node under the school), the seven T4 zones to their tier-4
 * cap, Payoff rules with the T4 payoffs placed, and the seven T4 bosses. Registered but not in
 * the controlled batch list until it has run live.
 *
 * Fire, Afterburn, then Tinderbox: the T3 route already picks Fire and Afterburn, and
 * Tinderbox (the ambusher leaf) needs no other piece.
 */
export const APPRENTICE_T4_ID = "apprentice-t4";
export const APPRENTICE_T4_LEAF = "apprentice-tinderbox";

/** The T4 zones with the lesson each teaches, in the tutorial's order (`shared/.../scripts/apprentice.ts`). The Wasteland is `graveyard`. */
export const APPRENTICE_T4_ZONES: readonly { biomeGroup: string; pieceId: string; rank: number }[] = [
  { biomeGroup: "mountain", pieceId: "apprentice-seize", rank: 3 },
  { biomeGroup: "tundra", pieceId: "apprentice-frostcrack", rank: 1 },
  { biomeGroup: "jungle", pieceId: "apprentice-spread", rank: 2 },
  { biomeGroup: "desert", pieceId: "apprentice-recoil", rank: 2 },
  { biomeGroup: "volcanic", pieceId: "apprentice-cinderfall", rank: 2 },
  { biomeGroup: "graveyard", pieceId: "apprentice-pyre", rank: 1 },
  { biomeGroup: "trench", pieceId: "apprentice-transference", rank: 1 },
];

function zone(biomeGroup: string): NodeRef {
  return { kind: "biome", biomeGroup, tier: 4, pick: "uncleared" };
}

/**
 * The T3 rules plus each T4 payoff on its moment: Frostcrack ahead of Sear on a shielded target,
 * Pyre on a risen enemy, Transference after Recoil when a debuff lands on you.
 */
export function apprenticeT4Payoffs(): ClassConfig {
  const t3 = apprenticeT3Payoffs();
  if (t3.system.kind !== "payoffs") throw new Error("apprentice T3 rules are not Payoff rules");
  return {
    ...t3,
    system: {
      kind: "payoffs",
      placements: [
        { moment: "target-shielded", pieceId: "apprentice-frostcrack", conditions: [] },
        ...t3.system.placements,
        { moment: "risen", pieceId: "apprentice-pyre", conditions: [] },
        { moment: "debuff-landed", pieceId: "apprentice-transference", conditions: [] },
      ],
    },
  };
}

export function apprenticeT4Route(): Route {
  const t3 = apprenticeT3Route();
  const steps: RouteStep[] = [...t3.steps];

  // Wait out the tier-4 promotion on the last T3 zone, then pick the leaf.
  const lastT3 = APPRENTICE_T3_ZONES[APPRENTICE_T3_ZONES.length - 1].biomeGroup;
  steps.push({
    type: "farm",
    at: { kind: "biome", biomeGroup: lastT3, tier: 3, pick: "uncleared" },
    until: { type: "playerTierAtLeast", tier: 4 },
    label: "wait for the tier-4 promotion",
  });
  steps.push({ type: "unlockSkill", skillId: APPRENTICE_T4_LEAF, label: "pick the leaf" });
  steps.push({ type: "milestone", id: "leaf-picked" });

  for (const { biomeGroup } of APPRENTICE_T4_ZONES) {
    const at = zone(biomeGroup);
    steps.push({ type: "travel", to: at });
    steps.push({ type: "farm", at, until: { type: "biomeLevelAtLeast", biomeGroup, level: biomeLevelCap(4, biomeGroup) } });
  }
  // Every T4 lesson is learned now, so the rules can place the T4 payoffs.
  steps.push({ type: "classConfig", config: apprenticeT4Payoffs() });
  for (const { biomeGroup } of APPRENTICE_T4_ZONES) {
    steps.push({ type: "attemptBoss", biomeGroup, tier: 4 });
  }

  const milestones: Route["milestones"] = [...t3.milestones, { id: "tier-4", when: { type: "playerTierAtLeast", tier: 4 } }];
  for (const { biomeGroup, pieceId, rank } of APPRENTICE_T4_ZONES) {
    milestones.push({ id: `${biomeGroup}-t4-capped`, when: { type: "biomeLevelAtLeast", biomeGroup, level: biomeLevelCap(4, biomeGroup) } });
    milestones.push({ id: `${pieceId}-t4-learned`, when: { type: "pieceLearned", pieceId, rank } });
    milestones.push({ id: `${biomeGroup}-t4-boss`, when: { type: "bossCleared", biomeGroup, tier: 4 } });
  }

  return {
    id: APPRENTICE_T4_ID,
    version: "1.0.0",
    classRoot: APPRENTICE_CLASS_ROOT,
    description:
      "Apprentice T4: the T3 route, the tier-4 promotion, the Tinderbox leaf, the seven T4 zones " +
      "(the Wasteland and the Trench new) to their cap, Payoff rules with the T4 payoffs placed, " +
      "and the seven T4 bosses.",
    steps,
    completion: allOf(
      t3.completion,
      ...APPRENTICE_T4_ZONES.map(({ biomeGroup }) => ({ type: "bossCleared" as const, biomeGroup, tier: 4 })),
    ),
    milestones,
  };
}
