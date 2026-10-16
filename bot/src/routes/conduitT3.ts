import { absoluteZoneLevel, biomeLevelCap, type KitBiome } from "@mmo-idle/shared";
import { allOf, type NodeRef, type Route, type RouteStep } from "../route/types";
import { CONDUIT_CLASS_ROOT, wearAsUnlocked } from "./conduitT1";
import { CONDUIT_T2_DISCIPLINE, CONDUIT_T2_ZONES, conduitT2Route } from "./conduitT2";

/**
 * The Conduit's T3 route (T3-W2, bible §7.6, §7.16).
 *
 * It is the T2 route (T1, the discipline, every T2 zone and boss), then the wait for the
 * tier-3 promotion, then the specialization pick, then every T3 zone in the tutorial's order
 * (Mountain, Cave, Swamp, Jungle, Desert, then the new Tundra and Volcanic): farm to the
 * zone's tier-3 cap, then attempt its T3 boss. The lesson level the guide stops at on the
 * way is the same farm, so one farm per zone reaches both the lesson and the cap.
 *
 * The specialization is the `unlockSkill` step on its skill node (a tier-2 node of the Passive
 * Tree under the picked discipline; the runner waits for the skill point the tier-3 promotion
 * grants). The Formation stays on `auto`, which the server re-prices under the specialization
 * when it rebuilds the default.
 *
 * Registered but not in `CONTROLLED_ROUTE_IDS` until it has run live.
 */
export const CONDUIT_T3_ID = "conduit-t3";

/**
 * The specialization the route takes: The Hunt, which rewards the variety Pack's roster
 * already has. The route's discipline is Pack, so the pick must be one of Pack's three.
 */
export const CONDUIT_T3_SPECIALIZATION = "conduit-the-hunt";

/** The zones the T3 guide walks, in its order (the T3 beats of `shared/src/tutorial/scripts/conduit.ts`). */
export const CONDUIT_T3_ZONES: readonly KitBiome[] = ["mountain", "cave", "swamp", "jungle", "desert", "tundra", "volcanic"];

const TIER = 3;

/**
 * The tier-3 gear the route wears, per zone, as each zone level unlocks it (OV-CONDUIT, PLACEHOLDER
 * picks): the Mountain set (its weapon meets the first T3 boss), the Cave Heavy Staff and charm, the
 * Swamp, Jungle and Desert boots as each is faster, and the Jungle charm.
 */
export const CONDUIT_T3_GEAR: Readonly<Record<string, readonly string[]>> = {
  mountain: ["conduit-ability-staff-t3", "mountain-vest-t3", "mountain-charm-t3", "mountain-boots-t3"],
  cave: ["conduit-heavy-staff-t3", "cave-charm-t3"],
  swamp: ["swamp-boots-t3"],
  jungle: ["jungle-charm-t3", "jungle-boots-t3"],
  desert: ["desert-boots-t3"],
};

function zone(biomeGroup: string): NodeRef {
  return { kind: "biome", biomeGroup, tier: TIER, pick: "uncleared" };
}

/** The level the guide farms a T3 zone to: its tier-3 cap (which includes the lesson level). */
export function conduitT3FarmLevel(biomeGroup: string): number {
  return biomeLevelCap(TIER, biomeGroup);
}

/** The biome level a zone's T3 lesson comes at (bible §7.16), for the milestones. */
export function conduitT3LessonLevel(biome: KitBiome): number {
  return absoluteZoneLevel({ kind: "zone", biome, tier: TIER, level: 2 });
}

export function conduitT3Route(specializationId: string = CONDUIT_T3_SPECIALIZATION): Route {
  const t2 = conduitT2Route(CONDUIT_T2_DISCIPLINE);
  const lastT2 = CONDUIT_T2_ZONES[CONDUIT_T2_ZONES.length - 1];
  const steps: RouteStep[] = [
    ...t2.steps,
    // The T2 seals promote to tier 3. If the last kill already did, this step is already done.
    {
      type: "farm",
      at: { kind: "biome", biomeGroup: lastT2, tier: 2, pick: "uncleared" },
      until: { type: "playerTierAtLeast", tier: TIER },
      label: "wait for the tier-3 promotion",
    },
    { type: "unlockSkill", skillId: specializationId, label: "pick the specialization" },
    { type: "milestone", id: "specialization-picked" },
  ];

  for (const biomeGroup of CONDUIT_T3_ZONES) {
    const at = zone(biomeGroup);
    steps.push({ type: "travel", to: at });
    steps.push(...wearAsUnlocked(CONDUIT_T3_GEAR[biomeGroup] ?? [], at, TIER + 1));
    steps.push({
      type: "farm",
      at,
      until: { type: "biomeLevelAtLeast", biomeGroup, level: conduitT3FarmLevel(biomeGroup) },
    });
    steps.push({ type: "attemptBoss", biomeGroup, tier: TIER });
  }

  const milestones: Route["milestones"] = [...t2.milestones, { id: "tier-3", when: { type: "playerTierAtLeast", tier: TIER } }];
  for (const biomeGroup of CONDUIT_T3_ZONES) {
    milestones.push({
      id: `${biomeGroup}-t3-lesson`,
      when: { type: "biomeLevelAtLeast", biomeGroup, level: conduitT3LessonLevel(biomeGroup) },
    });
    milestones.push({
      id: `${biomeGroup}-t3-level-${conduitT3FarmLevel(biomeGroup)}`,
      when: { type: "biomeLevelAtLeast", biomeGroup, level: conduitT3FarmLevel(biomeGroup) },
    });
    milestones.push({
      id: `${biomeGroup}-t3-boss`,
      when: { type: "bossCleared", biomeGroup, tier: TIER },
    });
  }

  return {
    id: CONDUIT_T3_ID,
    version: "1.0.0",
    classRoot: CONDUIT_CLASS_ROOT,
    description:
      "Conduit T3: the T2 route, the tier-3 promotion, a specialization, then each T3 zone to its " +
      "tier-3 cap and its T3 boss (Mountain, Cave, Swamp, Jungle, Desert, Tundra, Volcanic).",
    steps,
    completion: allOf(...CONDUIT_T3_ZONES.map((biomeGroup) => ({ type: "bossCleared" as const, biomeGroup, tier: TIER }))),
    milestones,
  };
}
