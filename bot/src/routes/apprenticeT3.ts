import { biomeLevelCap, type ClassConfig } from "@mmo-idle/shared";
import { allOf, type NodeRef, type Route, type RouteStep } from "../route/types";
import { APPRENTICE_CLASS_ROOT } from "./apprenticeT1";
import { APPRENTICE_T2_ZONES, apprenticeT2Payoffs, apprenticeT2Route } from "./apprenticeT2";

/**
 * The Apprentice's T3 route (T3-W2, bible §9.6, §9.16): the T2 route with a school picked, the
 * tier-3 promotion, the specialization pick (an `unlockSkill` on its node under the school), the
 * seven T3 zones to their tier-3 cap, Payoff rules with the T3 payoffs placed, and the seven T3
 * bosses. Registered but not in the controlled batch list until it has run live.
 *
 * Fire, then Afterburn: Cinderfall and Melt are Fire lessons and Afterburn needs no other piece.
 */
export const APPRENTICE_T3_ID = "apprentice-t3";
export const APPRENTICE_T3_DISCIPLINE = "apprentice-fire";
export const APPRENTICE_T3_SPECIALIZATION = "apprentice-afterburn";

/** The T3 zones with the lesson each teaches, in the tutorial's order (`shared/.../scripts/apprentice.ts`). */
export const APPRENTICE_T3_ZONES: readonly { biomeGroup: string; lesson: string }[] = [
  { biomeGroup: "mountain", lesson: "apprentice-seize-2" },
  { biomeGroup: "cave", lesson: "apprentice-seep-2" },
  { biomeGroup: "swamp", lesson: "apprentice-spore-burst" },
  { biomeGroup: "jungle", lesson: "apprentice-snag-2" },
  { biomeGroup: "desert", lesson: "apprentice-signal-fire" },
  { biomeGroup: "tundra", lesson: "apprentice-melt" },
  { biomeGroup: "volcanic", lesson: "apprentice-cinderfall" },
];

function zone(biomeGroup: string): NodeRef {
  return { kind: "biome", biomeGroup, tier: 3, pick: "uncleared" };
}

/**
 * The T2 rules plus each T3 payoff where it fires: Cinderfall on a full bar among three or more
 * enemies, Spore Burst on a target about to die, Melt on the Chill. Signal Fire is a rider on
 * Detonate and needs no placement. The relic stays the first boss's Outbreak.
 */
export function apprenticeT3Payoffs(): ClassConfig {
  const t2 = apprenticeT2Payoffs();
  if (t2.system.kind !== "payoffs") throw new Error("apprentice T2 rules are not Payoff rules");
  return {
    ...t2,
    system: {
      kind: "payoffs",
      placements: [
        { moment: "target-full", pieceId: "apprentice-cinderfall", conditions: [{ id: "enemies-near", param: 3 }] },
        ...t2.system.placements,
        { moment: "target-low", pieceId: "apprentice-spore-burst", conditions: [] },
        { moment: "chill-threshold", pieceId: "apprentice-melt", conditions: [] },
      ],
    },
  };
}

export function apprenticeT3Route(): Route {
  const t2 = apprenticeT2Route(APPRENTICE_T3_DISCIPLINE);
  const steps: RouteStep[] = [...t2.steps];

  // Wait out the tier-3 promotion on the last T2 zone, then pick the specialization.
  const lastT2 = APPRENTICE_T2_ZONES[APPRENTICE_T2_ZONES.length - 1].biomeGroup;
  steps.push({
    type: "farm",
    at: { kind: "biome", biomeGroup: lastT2, tier: 2, pick: "uncleared" },
    until: { type: "playerTierAtLeast", tier: 3 },
    label: "wait for the tier-3 promotion",
  });
  steps.push({ type: "unlockSkill", skillId: APPRENTICE_T3_SPECIALIZATION, label: "pick the specialization" });
  steps.push({ type: "milestone", id: "specialization-picked" });

  for (const { biomeGroup } of APPRENTICE_T3_ZONES) {
    const at = zone(biomeGroup);
    steps.push({ type: "travel", to: at });
    steps.push({ type: "farm", at, until: { type: "biomeLevelAtLeast", biomeGroup, level: biomeLevelCap(3, biomeGroup) } });
  }
  // Every T3 lesson is learned now, so the rules can place the T3 payoffs.
  steps.push({ type: "classConfig", config: apprenticeT3Payoffs() });
  for (const { biomeGroup } of APPRENTICE_T3_ZONES) {
    steps.push({ type: "attemptBoss", biomeGroup, tier: 3 });
  }

  const milestones: Route["milestones"] = [...t2.milestones, { id: "tier-3", when: { type: "playerTierAtLeast", tier: 3 } }];
  for (const { biomeGroup, lesson } of APPRENTICE_T3_ZONES) {
    milestones.push({ id: `${biomeGroup}-t3-capped`, when: { type: "biomeLevelAtLeast", biomeGroup, level: biomeLevelCap(3, biomeGroup) } });
    milestones.push({ id: `${lesson}-learned`, when: { type: "pieceLearned", pieceId: lesson.replace(/-2$/, ""), rank: lesson.endsWith("-2") ? 2 : 1 } });
    milestones.push({ id: `${biomeGroup}-t3-boss`, when: { type: "bossCleared", biomeGroup, tier: 3 } });
  }

  return {
    id: APPRENTICE_T3_ID,
    version: "1.0.0",
    classRoot: APPRENTICE_CLASS_ROOT,
    description:
      "Apprentice T3: the T2 route with the Fire school, the tier-3 promotion, the Afterburn " +
      "specialization, the seven T3 zones to their cap, Payoff rules with the T3 payoffs placed, " +
      "and the seven T3 bosses.",
    steps,
    completion: allOf(
      t2.completion,
      ...APPRENTICE_T3_ZONES.map(({ biomeGroup }) => ({ type: "bossCleared" as const, biomeGroup, tier: 3 })),
    ),
    milestones,
  };
}
