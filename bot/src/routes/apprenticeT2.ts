import { biomeLevelCap, type ClassConfig } from "@mmo-idle/shared";
import { allOf, type NodeRef, type Route, type RouteStep } from "../route/types";
import { APPRENTICE_CLASS_ROOT, apprenticeT1Route } from "./apprenticeT1";

/**
 * The Apprentice's T2 route (T2-W2, bible §9.5, §9.16): the whole T1 route, then the T2 zones
 * in the guide's order, the Payoff rules with the T2 payoffs placed, and the seven T2 bosses.
 *
 * No discipline step: the school pick has no path the harness can drive yet (the skill tree
 * that carried it is gone and the protocol has no discipline intent), so this route fights
 * T2 with `disciplineId: null`. Add the pick here once that intent exists.
 */
export const APPRENTICE_T2_ID = "apprentice-t2";

/** The T2 zones with the lesson each teaches, in the tutorial's order (`shared/.../scripts/apprentice.ts`). */
export const APPRENTICE_T2_ZONES: readonly { biomeGroup: string; lesson: string }[] = [
  { biomeGroup: "plains", lesson: "apprentice-blast-back" },
  { biomeGroup: "forest", lesson: "apprentice-numb-2" },
  { biomeGroup: "mountain", lesson: "apprentice-sear" },
  { biomeGroup: "swamp", lesson: "apprentice-siphon-2" },
  { biomeGroup: "cave", lesson: "apprentice-seep" },
  { biomeGroup: "jungle", lesson: "apprentice-snag" },
  { biomeGroup: "desert", lesson: "apprentice-recoil" },
];

function zone(biomeGroup: string): NodeRef {
  return { kind: "biome", biomeGroup, tier: 2, pick: "uncleared" };
}

/**
 * The T1 defaults the server builds (Spread with company, Detonate, Seize, Siphon) plus each
 * T2 payoff on its own moment. The auto default does not place the T2 pieces, so the route
 * sets the rules itself once every lesson is learned. The relic is the first boss's Outbreak.
 */
export function apprenticeT2Payoffs(): ClassConfig {
  return {
    mode: "custom",
    relic: ["apprentice-relic-plains"],
    system: {
      kind: "payoffs",
      placements: [
        { moment: "target-full", pieceId: "apprentice-spread", conditions: [{ id: "enemies-near", param: 2 }] },
        { moment: "target-full", pieceId: "apprentice-detonate", conditions: [] },
        { moment: "enemy-winds-up", pieceId: "apprentice-seize", conditions: [] },
        { moment: "hp-low", pieceId: "apprentice-siphon", conditions: [] },
        { moment: "charging-at-me", pieceId: "apprentice-blast-back", conditions: [] },
        { moment: "target-shielded", pieceId: "apprentice-sear", conditions: [] },
        { moment: "target-out-of-reach", pieceId: "apprentice-seep", conditions: [] },
        { moment: "target-flees", pieceId: "apprentice-snag", conditions: [] },
        { moment: "debuff-landed", pieceId: "apprentice-recoil", conditions: [] },
      ],
    },
  };
}

export function apprenticeT2Route(): Route {
  const t1 = apprenticeT1Route();
  const steps: RouteStep[] = [...t1.steps];

  // Farm every T2 zone to its tier-2 cap: past the lesson level the tutorial farms to.
  for (const { biomeGroup } of APPRENTICE_T2_ZONES) {
    const at = zone(biomeGroup);
    steps.push({ type: "travel", to: at });
    steps.push({
      type: "farm",
      at,
      until: { type: "biomeLevelAtLeast", biomeGroup, level: biomeLevelCap(2, biomeGroup) },
    });
  }
  // Every T2 lesson is learned now, so the rules can place the T2 payoffs.
  steps.push({ type: "classConfig", config: apprenticeT2Payoffs() });
  for (const { biomeGroup } of APPRENTICE_T2_ZONES) {
    steps.push({ type: "attemptBoss", biomeGroup, tier: 2 });
  }

  const milestones: Route["milestones"] = [...t1.milestones];
  for (const { biomeGroup, lesson } of APPRENTICE_T2_ZONES) {
    milestones.push({
      id: `${biomeGroup}-t2-capped`,
      when: { type: "biomeLevelAtLeast", biomeGroup, level: biomeLevelCap(2, biomeGroup) },
    });
    milestones.push({ id: `${lesson}-learned`, when: { type: "pieceLearned", pieceId: lesson.replace(/-2$/, ""), rank: lesson.endsWith("-2") ? 2 : 1 } });
    milestones.push({ id: `${biomeGroup}-t2-boss`, when: { type: "bossCleared", biomeGroup, tier: 2 } });
  }

  return {
    id: APPRENTICE_T2_ID,
    version: "1.0.0",
    classRoot: APPRENTICE_CLASS_ROOT,
    description:
      "Apprentice T2: the T1 route, then the seven T2 zones to their cap, Payoff rules with the " +
      "T2 payoffs placed, and the seven T2 bosses. No school is picked (no harness path yet).",
    steps,
    completion: allOf(
      t1.completion,
      ...APPRENTICE_T2_ZONES.map(({ biomeGroup }) => ({ type: "bossCleared" as const, biomeGroup, tier: 2 })),
    ),
    milestones,
  };
}
