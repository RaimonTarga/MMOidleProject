import { biomeLevelCap, STRIKER_KIT } from "@mmo-idle/shared";
import { allOf, type NodeRef, type Route, type RouteStep } from "../route/types";
import { STRIKER_CLASS_ROOT } from "./strikerT1";
import { STRIKER_T2_ROUTE_IDS, strikerT2Route, unlessDone } from "./strikerT2";

/**
 * The Striker's T3 route (T3-W2, bible §12.6 and §12.16).
 *
 * The whole `striker-t2` route for the specialization's discipline first (the T1 route, the
 * discipline pick, the seven T2 zones and bosses; three T2 seals promote to tier 3), then a wait
 * for the tier-3 promotion, the specialization pick, and the seven T3 zones in the guide's order,
 * each farmed to its cap and then its tier-3 boss. A specialization is a skill node
 * (`unlockSkill`), the same pick the Passive Tree makes; one route per specialization, so a batch
 * can run all nine arms. The Order stays on the T2 route's auto setting, which the server rebuilds
 * as the T3 lessons and trophies arrive. No T3 gear is crafted yet (the Tundra and Volcanic jobs'
 * recipes are not in the route's reach).
 *
 * Registered, but left out of `CONTROLLED_ROUTE_IDS` until it has run live.
 */

/** Route id by specialization id: `striker-t3-<name>`. */
export const STRIKER_T3_ROUTE_IDS: Readonly<Record<string, string>> = Object.fromEntries(
  STRIKER_KIT.specializations.map((spec) => [spec.id, spec.id.replace(/^striker-/, "striker-t3-")]),
);

/** The T3 zones in the guide's order: the Plains and Forest have retired; the Tundra and Volcanic are new. */
export const STRIKER_T3_ZONES: readonly string[] = ["mountain", "swamp", "cave", "jungle", "desert", "tundra", "volcanic"];

const TIER = 3;

function zone(biomeGroup: string): NodeRef {
  return { kind: "biome", biomeGroup, tier: TIER, pick: "uncleared" };
}

/** How far the guided route farms a T3 zone before its boss (the tier cap, as in T1 and T2). */
export function strikerT3FarmLevel(biomeGroup: string): number {
  return biomeLevelCap(TIER, biomeGroup);
}

export function strikerT3Route(specializationId = "striker-thousand-cuts"): Route {
  const id = STRIKER_T3_ROUTE_IDS[specializationId];
  const spec = STRIKER_KIT.specializations.find((entry) => entry.id === specializationId);
  if (!id || !spec) {
    throw new Error(`unknown Striker specialization "${specializationId}" (have: ${Object.keys(STRIKER_T3_ROUTE_IDS).join(", ")})`);
  }
  if (!STRIKER_T2_ROUTE_IDS[spec.disciplineId]) throw new Error(`no T2 route for ${spec.disciplineId}`);
  const t2 = strikerT2Route(spec.disciplineId);

  const steps: RouteStep[] = [
    unlessDone(t2, "the T2 route"),
    {
      type: "farm",
      at: { kind: "biome", biomeGroup: "desert", tier: 2, pick: "uncleared" },
      until: { type: "playerTierAtLeast", tier: TIER },
      label: "wait for the tier-3 promotion",
    },
    { type: "unlockSkill", skillId: specializationId, label: `pick the ${specializationId} specialization` },
  ];
  for (const biomeGroup of STRIKER_T3_ZONES) {
    const at = zone(biomeGroup);
    steps.push({ type: "travel", to: at });
    steps.push({
      type: "farm",
      at,
      until: { type: "biomeLevelAtLeast", biomeGroup, level: strikerT3FarmLevel(biomeGroup) },
    });
    steps.push({ type: "attemptBoss", biomeGroup, tier: TIER });
  }

  const milestones: Route["milestones"] = [
    ...t2.milestones,
    { id: "tier-3-reached", when: { type: "playerTierAtLeast", tier: TIER } },
  ];
  for (const biomeGroup of STRIKER_T3_ZONES) {
    milestones.push({
      id: `${biomeGroup}-t3-level-${strikerT3FarmLevel(biomeGroup)}`,
      when: { type: "biomeLevelAtLeast", biomeGroup, level: strikerT3FarmLevel(biomeGroup) },
    });
    milestones.push({ id: `${biomeGroup}-t3-boss`, when: { type: "bossCleared", biomeGroup, tier: TIER } });
  }

  return {
    id,
    version: "1.0.0",
    classRoot: STRIKER_CLASS_ROOT,
    description:
      `Striker T3 (${specializationId}): the T2 route for ${spec.disciplineId}, the tier-3 promotion and the specialization pick, ` +
      "then each T3 zone farmed to its cap and its tier-3 boss.",
    steps,
    completion: allOf(
      ...STRIKER_T3_ZONES.map((biomeGroup) => ({ type: "bossCleared" as const, biomeGroup, tier: TIER })),
    ),
    milestones,
  };
}
