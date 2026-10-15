import { biomeLevelCap, strikerComboLength, type ClassConfig } from "@mmo-idle/shared";
import { allOf, type NodeRef, type Route, type RouteStep } from "../route/types";
import { STRIKER_CLASS_ROOT, strikerT1Route } from "./strikerT1";

/**
 * The Striker's T2 route (T2-W2, bible §12.5, §12.13 and §12.16).
 *
 * The whole `striker-t1` route first (the tier-0 quest, both seals, the tier-2
 * promotion), then the discipline pick, an auto Order sized to that discipline's
 * combo, and the seven T2 zones in the guide's order, each farmed to its cap and
 * then its tier-2 boss. A discipline is a skill node (`unlockSkill`), the same
 * pick the Passive Tree makes; one route per discipline, so a batch can run all
 * three arms. No T2 gear is crafted yet: the gear recipes for the T2 jobs are not
 * in the route's reach (see the T2-W2 report).
 */
export const STRIKER_T2_LIGHT_ID = "striker-t2-light";
export const STRIKER_T2_BALANCED_ID = "striker-t2-balanced";
export const STRIKER_T2_HEAVY_ID = "striker-t2-heavy";

/** Route id by discipline id. */
export const STRIKER_T2_ROUTE_IDS: Readonly<Record<string, string>> = {
  "striker-light": STRIKER_T2_LIGHT_ID,
  "striker-balanced": STRIKER_T2_BALANCED_ID,
  "striker-heavy": STRIKER_T2_HEAVY_ID,
};

/** The T2 zones in the guide's order: the five old zones, then the Jungle and the Desert. */
export const STRIKER_T2_ZONES: readonly string[] = ["plains", "forest", "mountain", "swamp", "cave", "jungle", "desert"];

const TIER = 2;

function zone(biomeGroup: string): NodeRef {
  return { kind: "biome", biomeGroup, tier: TIER, pick: "uncleared" };
}

/** How far the guided route farms a T2 zone before its boss (the tier cap, as in T1). */
export function strikerT2FarmLevel(biomeGroup: string): number {
  return biomeLevelCap(TIER, biomeGroup);
}

/** `auto` hands the Order back to the class default, sized to the discipline's combo. */
function autoOrder(disciplineId: string): ClassConfig {
  return {
    mode: "auto",
    relic: [],
    system: {
      kind: "order",
      beats: Array.from({ length: strikerComboLength(disciplineId) - 1 }, () => null),
      holdFinisher: [],
    },
  };
}

export function strikerT2Route(disciplineId = "striker-light"): Route {
  const id = STRIKER_T2_ROUTE_IDS[disciplineId];
  if (!id) throw new Error(`unknown Striker discipline "${disciplineId}" (have: ${Object.keys(STRIKER_T2_ROUTE_IDS).join(", ")})`);
  const t1 = strikerT1Route();

  const steps: RouteStep[] = [
    ...t1.steps,
    { type: "unlockSkill", skillId: disciplineId, label: `pick the ${disciplineId} discipline` },
    { type: "classConfig", config: autoOrder(disciplineId) },
  ];
  for (const biomeGroup of STRIKER_T2_ZONES) {
    const at = zone(biomeGroup);
    steps.push({ type: "travel", to: at });
    steps.push({
      type: "farm",
      at,
      until: { type: "biomeLevelAtLeast", biomeGroup, level: strikerT2FarmLevel(biomeGroup) },
    });
    steps.push({ type: "attemptBoss", biomeGroup, tier: TIER });
  }

  const milestones: Route["milestones"] = [...t1.milestones];
  for (const biomeGroup of STRIKER_T2_ZONES) {
    milestones.push({
      id: `${biomeGroup}-t2-level-${strikerT2FarmLevel(biomeGroup)}`,
      when: { type: "biomeLevelAtLeast", biomeGroup, level: strikerT2FarmLevel(biomeGroup) },
    });
    milestones.push({ id: `${biomeGroup}-t2-boss`, when: { type: "bossCleared", biomeGroup, tier: TIER } });
  }

  return {
    id,
    version: "1.0.0",
    classRoot: STRIKER_CLASS_ROOT,
    description:
      `Striker T2 (${disciplineId}): the T1 route to tier 2, the discipline pick and an auto Order, ` +
      "then each T2 zone farmed to its cap and its tier-2 boss.",
    steps,
    completion: allOf(
      ...STRIKER_T2_ZONES.map((biomeGroup) => ({ type: "bossCleared" as const, biomeGroup, tier: TIER })),
    ),
    milestones,
  };
}
