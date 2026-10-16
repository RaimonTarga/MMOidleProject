import { absoluteZoneLevel, biomeLevelCap, type KitBiome } from "@mmo-idle/shared";
import { allOf, type NodeRef, type Route, type RouteStep } from "../route/types";
import { CONDUIT_CLASS_ROOT, conduitT1Route, wearAsUnlocked } from "./conduitT1";

/**
 * The Conduit's T2 route (T2-W2, bible §7.5, §7.16).
 *
 * It is the T1 route up to the tier-2 promotion, then the discipline pick, then every
 * T2 zone in the tutorial's order (Plains, Forest, Swamp, Cave, Mountain, then the new
 * Jungle and Desert): farm to the zone's tier-2 cap, then attempt its T2 boss. The
 * lesson level the guide stops at on the way is the same farm, so one farm per zone
 * reaches both the lesson and the cap.
 *
 * The discipline is the `unlockSkill` step on the discipline's skill node (a discipline
 * is the tier-1 node of the Passive Tree under the class root; the runner waits for the
 * skill point the tier-2 promotion grants). The Formation stays on `auto`, which the
 * server re-prices under the discipline when it rebuilds the default.
 */
export const CONDUIT_T2_ID = "conduit-t2";

/** Pack: the roster's variety is what the T2 lessons add, so the route plays that. */
export const CONDUIT_T2_DISCIPLINE = "conduit-pack";

/** The zones the T2 guide walks, in its order (the T2 beats of `shared/src/tutorial/scripts/conduit.ts`). */
export const CONDUIT_T2_ZONES: readonly KitBiome[] = ["plains", "forest", "swamp", "cave", "mountain", "jungle", "desert"];

const TIER = 2;

/**
 * The tier-2 gear the route wears, per zone, as each zone level unlocks it (OV-CONDUIT, PLACEHOLDER
 * picks, the T1 pattern): the Plains set (its weapon meets the first T2 boss), the Forest set, the
 * Swamp vest, the Cave Heavy Staff, the Mountain vest, the Jungle vest and boots, the Desert boots.
 */
export const CONDUIT_T2_GEAR: Readonly<Record<string, readonly string[]>> = {
  plains: ["conduit-swarm-staff-t2", "plains-vest-t2", "plains-charm-t2", "plains-boots-t2"],
  forest: ["conduit-swift-staff-t2", "forest-vest-t2", "forest-charm-t2", "forest-boots-t2"],
  swamp: ["swamp-vest-t2"],
  cave: ["conduit-heavy-staff-t2"],
  mountain: ["mountain-vest-t2"],
  jungle: ["jungle-vest-t2", "jungle-boots-t2"],
  desert: ["desert-boots-t2"],
};

function zone(biomeGroup: string): NodeRef {
  return { kind: "biome", biomeGroup, tier: TIER, pick: "uncleared" };
}

/** The level the guide farms a T2 zone to: its tier-2 cap (which includes the lesson level). */
export function conduitT2FarmLevel(biomeGroup: string): number {
  return biomeLevelCap(TIER, biomeGroup);
}

/** The biome level a zone's T2 lesson comes at (bible §7.16), for the milestones. */
export function conduitT2LessonLevel(biome: KitBiome): number {
  return absoluteZoneLevel({ kind: "zone", biome, tier: TIER, level: 2 });
}

export function conduitT2Route(disciplineId: string = CONDUIT_T2_DISCIPLINE): Route {
  const t1 = conduitT1Route();
  const steps: RouteStep[] = [
    ...t1.steps,
    { type: "unlockSkill", skillId: disciplineId, label: "pick the discipline" },
    { type: "milestone", id: "discipline-picked" },
  ];

  for (const biomeGroup of CONDUIT_T2_ZONES) {
    const at = zone(biomeGroup);
    steps.push({ type: "travel", to: at });
    steps.push(...wearAsUnlocked(CONDUIT_T2_GEAR[biomeGroup] ?? [], at, TIER + 1));
    steps.push({
      type: "farm",
      at,
      until: { type: "biomeLevelAtLeast", biomeGroup, level: conduitT2FarmLevel(biomeGroup) },
    });
    steps.push({ type: "attemptBoss", biomeGroup, tier: TIER });
  }

  const milestones: Route["milestones"] = [...t1.milestones];
  for (const biomeGroup of CONDUIT_T2_ZONES) {
    milestones.push({
      id: `${biomeGroup}-t2-lesson`,
      when: { type: "biomeLevelAtLeast", biomeGroup, level: conduitT2LessonLevel(biomeGroup) },
    });
    milestones.push({
      id: `${biomeGroup}-t2-level-${conduitT2FarmLevel(biomeGroup)}`,
      when: { type: "biomeLevelAtLeast", biomeGroup, level: conduitT2FarmLevel(biomeGroup) },
    });
    milestones.push({
      id: `${biomeGroup}-t2-boss`,
      when: { type: "bossCleared", biomeGroup, tier: TIER },
    });
  }

  return {
    id: CONDUIT_T2_ID,
    version: "1.0.0",
    classRoot: CONDUIT_CLASS_ROOT,
    description:
      "Conduit T2: the T1 route, the tier-2 promotion, a discipline, then each T2 zone to its " +
      "tier-2 cap and its T2 boss (Plains, Forest, Swamp, Cave, Mountain, Jungle, Desert).",
    steps,
    completion: allOf(...CONDUIT_T2_ZONES.map((biomeGroup) => ({ type: "bossCleared" as const, biomeGroup, tier: TIER }))),
    milestones,
  };
}
