import { biomeLevelCap, type ClassConfig } from "@mmo-idle/shared";
import { allOf, type NodeRef, type Route, type RouteStep } from "../route/types";
import { APPRENTICE_CLASS_ROOT, apprenticeT1Route, wear } from "./apprenticeT1";

/**
 * The Apprentice's T2 route (T2-W2, bible §9.5, §9.16): the whole T1 route, then the T2 zones
 * in the guide's order (wearing each zone's gear as it unlocks), the auto Payoff rules, and the
 * seven T2 bosses.
 *
 * The school pick is an `unlockSkill` on the discipline node (the Passive Tree carries it again),
 * right after the T1 route. OV-APPRENTICE: `apprentice-t2` picks the Fire school, as the T3 and
 * T4 routes always did, so every tier's route plays the same character (PLACEHOLDER pick).
 */
export const APPRENTICE_T2_ID = "apprentice-t2";
/** The school every Apprentice route picks at T2. */
export const APPRENTICE_T2_DISCIPLINE = "apprentice-fire";

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
 * The T2 pieces worn as each zone unlocks them (PLACEHOLDER picks, OV-APPRENTICE, chosen in the
 * class boss sim): the Plains and Forest sets first, then the Fire school's Runestone Staff (three
 * sigils a hit fill the bar for the chain), the Jungle's evasion vest and the Desert's fast boots.
 * The Forest charm (the most Recovery) stays on.
 */
export const APPRENTICE_T2_GEAR: Readonly<Record<string, readonly string[]>> = {
  plains: ["apprentice-branching-wand-t2", "plains-vest-t2", "plains-charm-t2", "plains-boots-t2"],
  forest: ["apprentice-thornwood-rod-t2", "forest-vest-t2", "forest-charm-t2", "forest-boots-t2"],
  mountain: ["apprentice-runestone-staff-t2"],
  jungle: ["jungle-vest-t2"],
  desert: ["desert-boots-t2"],
};

/**
 * The rules the T2 bosses are fought with: the class's own auto default (the pass bar plays
 * auto). The server places every owned payoff on its moment (`configs/apprentice.ts`) and
 * equips the newest trophy, so the route only restates auto once every lesson is learned.
 */
export function apprenticeT2Payoffs(): ClassConfig {
  return { mode: "auto", relic: [], system: { kind: "payoffs", placements: [] } };
}

export function apprenticeT2Route(disciplineId: string | null = APPRENTICE_T2_DISCIPLINE): Route {
  const t1 = apprenticeT1Route();
  const steps: RouteStep[] = [...t1.steps];
  if (disciplineId) steps.push({ type: "unlockSkill", skillId: disciplineId, label: "pick the school" });

  // Farm every T2 zone to its tier-2 cap: past the lesson level the tutorial farms to.
  for (const { biomeGroup } of APPRENTICE_T2_ZONES) {
    const at = zone(biomeGroup);
    steps.push({ type: "travel", to: at });
    steps.push(...wear(at, APPRENTICE_T2_GEAR[biomeGroup] ?? []));
    steps.push({
      type: "farm",
      at,
      until: { type: "biomeLevelAtLeast", biomeGroup, level: biomeLevelCap(2, biomeGroup) },
    });
  }
  // Every T2 lesson is learned now; auto places them all.
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
      "Apprentice T2: the T1 route, the Fire school, the seven T2 zones to their cap (wearing " +
      "each zone's gear), auto Payoff rules, and the seven T2 bosses.",
    steps,
    completion: allOf(
      t1.completion,
      ...APPRENTICE_T2_ZONES.map(({ biomeGroup }) => ({ type: "bossCleared" as const, biomeGroup, tier: 2 })),
    ),
    milestones,
  };
}
