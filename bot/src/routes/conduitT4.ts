import { absoluteZoneLevel, biomeLevelCap, type KitBiome } from "@mmo-idle/shared";
import { allOf, type NodeRef, type Route, type RouteStep } from "../route/types";
import { CONDUIT_CLASS_ROOT, wearAsUnlocked } from "./conduitT1";
import { CONDUIT_T3_SPECIALIZATION, CONDUIT_T3_ZONES, conduitT3Route } from "./conduitT3";

/**
 * The Conduit's T4 route (T4-W2, bible §7.7, §7.16).
 *
 * It is the T3 route (T1, the discipline, the specialization, every T3 zone and boss), then the
 * wait for the tier-4 promotion, then the leaf pick, then every T4 zone in the tutorial's order
 * (Mountain, Tundra, Jungle, Desert, Volcanic, then the new Graveyard and Trench): farm to the
 * zone's tier-4 cap, then attempt its T4 boss. The lesson level the guide stops at on the way is
 * the same farm, so one farm per zone reaches both the lesson and the cap.
 *
 * The leaf is the `unlockSkill` step on its skill node (a tier-3 node of the Passive Tree whose
 * parent is the picked discipline; the runner waits for the skill point the tier-4 promotion grants).
 *
 * Registered but not in `CONTROLLED_ROUTE_IDS` until it has run live.
 */
export const CONDUIT_T4_ID = "conduit-t4";

/** The leaf the route takes: Avenge, under Pack (the route's discipline). Any of Pack's three works. */
export const CONDUIT_T4_LEAF = "conduit-avenge";

/** The zones the T4 guide walks, in its order (the T4 beats of `shared/src/tutorial/scripts/conduit.ts`). */
export const CONDUIT_T4_ZONES: readonly KitBiome[] = ["mountain", "tundra", "jungle", "desert", "volcanic", "graveyard", "trench"];

const TIER = 4;

/**
 * The tier-4 gear the route wears, per zone, as each zone level unlocks it (OV-CONDUIT, PLACEHOLDER
 * picks): the Mountain set (its weapon meets the first T4 boss), the Tundra charm, the Jungle Swift
 * Staff, the Desert boots, the Volcanic vest (Fireproof: the Caldera's Simmering Burn), the Trench Heavy
 * Staff and vest.
 */
export const CONDUIT_T4_GEAR: Readonly<Record<string, readonly string[]>> = {
  mountain: ["conduit-ability-staff-t4", "mountain-vest-t4", "mountain-charm-t4", "mountain-boots-t4"],
  tundra: ["tundra-charm-t4"],
  jungle: ["conduit-swift-staff-t4"],
  desert: ["desert-boots-t4"],
  volcanic: ["volcanic-vest-t4"],
  trench: ["conduit-heavy-staff-t4", "trench-vest-t4"],
};

function zone(biomeGroup: string): NodeRef {
  return { kind: "biome", biomeGroup, tier: TIER, pick: "uncleared" };
}

/** The level the guide farms a T4 zone to: its tier-4 cap (which includes the lesson level). */
export function conduitT4FarmLevel(biomeGroup: string): number {
  return biomeLevelCap(TIER, biomeGroup);
}

/** The biome level a zone's T4 lesson comes at (bible §7.16), for the milestones. */
export function conduitT4LessonLevel(biome: KitBiome): number {
  return absoluteZoneLevel({ kind: "zone", biome, tier: TIER, level: 2 });
}

export function conduitT4Route(leafId: string = CONDUIT_T4_LEAF, specializationId: string = CONDUIT_T3_SPECIALIZATION): Route {
  const t3 = conduitT3Route(specializationId);
  const lastT3 = CONDUIT_T3_ZONES[CONDUIT_T3_ZONES.length - 1];
  const steps: RouteStep[] = [
    ...t3.steps,
    // The T3 seals promote to tier 4. If the last kill already did, this step is already done.
    {
      type: "farm",
      at: { kind: "biome", biomeGroup: lastT3, tier: 3, pick: "uncleared" },
      until: { type: "playerTierAtLeast", tier: TIER },
      label: "wait for the tier-4 promotion",
    },
    { type: "unlockSkill", skillId: leafId, label: "pick the leaf" },
    { type: "milestone", id: "leaf-picked" },
  ];

  for (const biomeGroup of CONDUIT_T4_ZONES) {
    const at = zone(biomeGroup);
    steps.push({ type: "travel", to: at });
    steps.push(...wearAsUnlocked(CONDUIT_T4_GEAR[biomeGroup] ?? [], at, TIER + 2));
    steps.push({
      type: "farm",
      at,
      until: { type: "biomeLevelAtLeast", biomeGroup, level: conduitT4FarmLevel(biomeGroup) },
    });
    steps.push({ type: "attemptBoss", biomeGroup, tier: TIER });
  }

  const milestones: Route["milestones"] = [...t3.milestones, { id: "tier-4", when: { type: "playerTierAtLeast", tier: TIER } }];
  for (const biomeGroup of CONDUIT_T4_ZONES) {
    milestones.push({
      id: `${biomeGroup}-t4-lesson`,
      when: { type: "biomeLevelAtLeast", biomeGroup, level: conduitT4LessonLevel(biomeGroup) },
    });
    milestones.push({
      id: `${biomeGroup}-t4-level-${conduitT4FarmLevel(biomeGroup)}`,
      when: { type: "biomeLevelAtLeast", biomeGroup, level: conduitT4FarmLevel(biomeGroup) },
    });
    milestones.push({
      id: `${biomeGroup}-t4-boss`,
      when: { type: "bossCleared", biomeGroup, tier: TIER },
    });
  }

  return {
    id: CONDUIT_T4_ID,
    version: "1.0.0",
    classRoot: CONDUIT_CLASS_ROOT,
    description:
      "Conduit T4: the T3 route, the tier-4 promotion, a leaf, then each T4 zone to its " +
      "tier-4 cap and its T4 boss (Mountain, Tundra, Jungle, Desert, Volcanic, Graveyard, Trench).",
    steps,
    completion: allOf(...CONDUIT_T4_ZONES.map((biomeGroup) => ({ type: "bossCleared" as const, biomeGroup, tier: TIER }))),
    milestones,
  };
}
