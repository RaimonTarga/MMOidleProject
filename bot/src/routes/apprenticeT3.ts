import { APPRENTICE_KIT, biomeLevelCap, type ClassConfig } from "@mmo-idle/shared";
import { allOf, type NodeRef, type Route, type RouteStep } from "../route/types";
import { APPRENTICE_CLASS_ROOT, wear } from "./apprenticeT1";
import {
  APPRENTICE_DISCIPLINE_NAME,
  APPRENTICE_T2_DISCIPLINE,
  APPRENTICE_T2_ZONES,
  apprenticeRouteId,
  apprenticeT2Payoffs,
  apprenticeT2Route,
} from "./apprenticeT2";

/**
 * The Apprentice's T3 route (T3-W2, bible §9.6, §9.16): the T2 route with a school picked, the
 * tier-3 promotion, the specialization pick (an `unlockSkill` on its node under the school), the
 * seven T3 zones to their tier-3 cap (wearing each zone's gear), the auto Payoff rules, and the
 * seven T3 bosses. Registered but not in the controlled batch list until it has run live.
 *
 * Fire, then Afterburn: Cinderfall and Melt are Fire lessons and Afterburn needs no other piece.
 */
export const APPRENTICE_T3_ID = "apprentice-t3";
export const APPRENTICE_T3_DISCIPLINE = APPRENTICE_T2_DISCIPLINE;
export const APPRENTICE_T3_SPECIALIZATION = "apprentice-afterburn";

/**
 * Each school's T3 pick (OV2-APPRENTICE, PLACEHOLDER, class boss sim): Wasting keeps Wither's
 * weakening on every full enemy, the plague as a defense where Poison is weakest (a boss alone);
 * Ice Tomb holds a frozen or brittle boss until the shatter (the bible's boss specialization).
 */
export const APPRENTICE_T3_SPECIALIZATIONS: Readonly<Record<string, string>> = {
  "apprentice-fire": APPRENTICE_T3_SPECIALIZATION,
  "apprentice-poison": "apprentice-wasting",
  "apprentice-frost": "apprentice-ice-tomb",
};

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

function specName(specId: string): string {
  return APPRENTICE_KIT.specializations.find((spec) => spec.id === specId)?.name ?? specId;
}

function zone(biomeGroup: string): NodeRef {
  return { kind: "biome", biomeGroup, tier: 3, pick: "uncleared" };
}

/**
 * The T3 pieces worn as each zone unlocks them (PLACEHOLDER picks, OV-APPRENTICE, chosen in the
 * class boss sim): the Mountain set (the T3 Runestone Staff), then the Desert's charm and boots.
 */
export const APPRENTICE_T3_GEAR: Readonly<Record<string, readonly string[]>> = {
  mountain: ["apprentice-runestone-staff-t3", "mountain-vest-t3", "mountain-charm-t3", "mountain-boots-t3"],
  desert: ["desert-charm-t3", "desert-boots-t3"],
};

/**
 * Poison wears the Mountain set without its staff and takes the Thornwood Rod where the Forest's
 * jobs moved, the Jungle (OV2-APPRENTICE, PLACEHOLDER, class boss sim: 7/7 T3 bosses). Frost
 * wears the Fire set (the Runestone Staff is a Frost weapon too).
 */
export const APPRENTICE_T3_POISON_GEAR: Readonly<Record<string, readonly string[]>> = {
  mountain: ["mountain-vest-t3", "mountain-charm-t3", "mountain-boots-t3"],
  jungle: ["apprentice-thornwood-rod-t3"],
  desert: ["desert-charm-t3", "desert-boots-t3"],
};

/**
 * The rules the T3 bosses are fought with: auto, whose default also places the T3 payoffs
 * (Cinderfall on a full bar among three or more enemies, Spore Burst on a target about to die,
 * Melt on the Chill; Signal Fire is a rider on Detonate and needs no placement).
 */
export function apprenticeT3Payoffs(): ClassConfig {
  return apprenticeT2Payoffs();
}

export function apprenticeT3Route(disciplineId: string = APPRENTICE_T3_DISCIPLINE): Route {
  const t2 = apprenticeT2Route(disciplineId);
  const specId = APPRENTICE_T3_SPECIALIZATIONS[disciplineId];
  if (!specId) throw new Error(`unknown Apprentice school "${disciplineId}"`);
  const gear = disciplineId === "apprentice-poison" ? APPRENTICE_T3_POISON_GEAR : APPRENTICE_T3_GEAR;
  const steps: RouteStep[] = [...t2.steps];

  // Wait out the tier-3 promotion on the last T2 zone, then pick the specialization.
  const lastT2 = APPRENTICE_T2_ZONES[APPRENTICE_T2_ZONES.length - 1].biomeGroup;
  steps.push({
    type: "farm",
    at: { kind: "biome", biomeGroup: lastT2, tier: 2, pick: "uncleared" },
    until: { type: "playerTierAtLeast", tier: 3 },
    label: "wait for the tier-3 promotion",
  });
  steps.push({ type: "unlockSkill", skillId: specId, label: "pick the specialization" });
  steps.push({ type: "milestone", id: "specialization-picked" });

  for (const { biomeGroup } of APPRENTICE_T3_ZONES) {
    const at = zone(biomeGroup);
    steps.push({ type: "travel", to: at });
    steps.push(...wear(at, gear[biomeGroup] ?? []));
    steps.push({ type: "farm", at, until: { type: "biomeLevelAtLeast", biomeGroup, level: biomeLevelCap(3, biomeGroup) } });
  }
  // Every T3 lesson is learned now; auto places them all.
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
    id: apprenticeRouteId(3, disciplineId),
    version: "1.0.0",
    classRoot: APPRENTICE_CLASS_ROOT,
    description:
      `Apprentice T3: the T2 route with the ${APPRENTICE_DISCIPLINE_NAME[disciplineId]} school, the tier-3 promotion, the ${specName(specId)} ` +
      "specialization, the seven T3 zones to their cap (wearing each zone's gear), auto Payoff " +
      "rules, and the seven T3 bosses.",
    steps,
    completion: allOf(
      t2.completion,
      ...APPRENTICE_T3_ZONES.map(({ biomeGroup }) => ({ type: "bossCleared" as const, biomeGroup, tier: 3 })),
    ),
    milestones,
  };
}
