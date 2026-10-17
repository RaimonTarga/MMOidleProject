import { APPRENTICE_KIT, biomeLevelCap, type ClassConfig } from "@mmo-idle/shared";
import { allOf, type NodeRef, type Route, type RouteStep } from "../route/types";
import { APPRENTICE_CLASS_ROOT, wear } from "./apprenticeT1";
import { APPRENTICE_DISCIPLINE_NAME, apprenticeRouteId } from "./apprenticeT2";
import { APPRENTICE_T3_DISCIPLINE, APPRENTICE_T3_SPECIALIZATIONS, apprenticeT3Payoffs, apprenticeT3Route, APPRENTICE_T3_ZONES } from "./apprenticeT3";

/**
 * The Apprentice's T4 route (T4-W2, bible §9.7, §9.16): the T3 route, the tier-4 promotion, the
 * leaf pick (an `unlockSkill` on its node under the school), the seven T4 zones to their tier-4
 * cap (wearing each zone's gear), the auto Payoff rules, and the seven T4 bosses. Registered but not in
 * the controlled batch list until it has run live.
 *
 * Fire, Afterburn, then Tinderbox: the T3 route already picks Fire and Afterburn, and
 * Tinderbox (the ambusher leaf) needs no other piece.
 */
export const APPRENTICE_T4_ID = "apprentice-t4";
export const APPRENTICE_T4_LEAF = "apprentice-tinderbox";

/**
 * Each school's T4 leaf (OV2-APPRENTICE, PLACEHOLDER, class boss sim): Poison's Taint (an
 * ambusher's first hit halved, and it arrives full) and Frost's Frozen Step (a charge that reaches
 * you freezes the charger, or leaves a boss brittle).
 */
export const APPRENTICE_T4_LEAVES: Readonly<Record<string, string>> = {
  "apprentice-fire": APPRENTICE_T4_LEAF,
  "apprentice-poison": "apprentice-taint",
  "apprentice-frost": "apprentice-frozen-step",
};

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

function nameOf(defs: readonly { id: string; name: string }[], id: string): string {
  return defs.find((def) => def.id === id)?.name ?? id;
}

function zone(biomeGroup: string): NodeRef {
  return { kind: "biome", biomeGroup, tier: 4, pick: "uncleared" };
}

/**
 * The T4 pieces worn as each zone unlocks them (PLACEHOLDER picks, OV-APPRENTICE, chosen in the
 * class boss sim): the Mountain set (the T4 Runestone Staff), the Desert's charm and boots, then the
 * Volcanic's reactive-plating vest (it won the Caldera Sovereign's race, where the Mountain plate
 * lost one fight in three).
 */
export const APPRENTICE_T4_GEAR: Readonly<Record<string, readonly string[]>> = {
  mountain: ["apprentice-runestone-staff-t4", "mountain-vest-t4", "mountain-charm-t4", "mountain-boots-t4"],
  desert: ["desert-charm-t4", "desert-boots-t4"],
  volcanic: ["volcanic-vest-t4"],
};

/**
 * The Poison and Frost chains keep Bitter Tonic, which rides the Wasteland's second charm base once
 * the Swamp retires (`graveyard-charm-t4-b`) (OV2-APPRENTICE, PLACEHOLDER, class boss sim: every T4
 * boss ends with 76-100% HP left for Poison, 89-100% for Frost). Frost takes the Fire set's staff.
 */
export const APPRENTICE_T4_FROST_GEAR: Readonly<Record<string, readonly string[]>> = {
  mountain: APPRENTICE_T4_GEAR.mountain,
  desert: ["desert-boots-t4"],
  volcanic: ["volcanic-vest-t4"],
  graveyard: ["graveyard-charm-t4-b"],
};

/**
 * Poison wears the Mountain set without its staff, the Desert's boots, the Volcanic vest, then
 * the Bog Censer where the Swamp's jobs moved, the Wasteland (OV2-APPRENTICE, PLACEHOLDER, class
 * boss sim: the Thornwood Rod lost the Caldera Sovereign's race 3 times in 4, the Bog Censer won it 3/3).
 */
export const APPRENTICE_T4_POISON_GEAR: Readonly<Record<string, readonly string[]>> = {
  mountain: ["mountain-vest-t4", "mountain-boots-t4"],
  desert: ["desert-boots-t4"],
  volcanic: ["volcanic-vest-t4"],
  graveyard: ["apprentice-bog-censer-t4", "graveyard-charm-t4-b"],
};

/** The T4 gear a school's chain wears. */
function apprenticeT4Gear(disciplineId: string): Readonly<Record<string, readonly string[]>> {
  if (disciplineId === "apprentice-poison") return APPRENTICE_T4_POISON_GEAR;
  if (disciplineId === "apprentice-frost") return APPRENTICE_T4_FROST_GEAR;
  return APPRENTICE_T4_GEAR;
}

/**
 * The rules the T4 bosses are fought with: auto, whose default also places the T4 payoffs
 * (Frostcrack ahead of Sear on a shielded target, Pyre on a risen enemy, Transference after
 * Recoil when a debuff lands on you).
 */
export function apprenticeT4Payoffs(): ClassConfig {
  return apprenticeT3Payoffs();
}

export function apprenticeT4Route(disciplineId: string = APPRENTICE_T3_DISCIPLINE): Route {
  const t3 = apprenticeT3Route(disciplineId);
  const leafId = APPRENTICE_T4_LEAVES[disciplineId];
  if (!leafId) throw new Error(`unknown Apprentice school "${disciplineId}"`);
  const gear = apprenticeT4Gear(disciplineId);
  const steps: RouteStep[] = [...t3.steps];

  // Wait out the tier-4 promotion on the last T3 zone, then pick the leaf.
  const lastT3 = APPRENTICE_T3_ZONES[APPRENTICE_T3_ZONES.length - 1].biomeGroup;
  steps.push({
    type: "farm",
    at: { kind: "biome", biomeGroup: lastT3, tier: 3, pick: "uncleared" },
    until: { type: "playerTierAtLeast", tier: 4 },
    label: "wait for the tier-4 promotion",
  });
  steps.push({ type: "unlockSkill", skillId: leafId, label: "pick the leaf" });
  steps.push({ type: "milestone", id: "leaf-picked" });

  for (const { biomeGroup } of APPRENTICE_T4_ZONES) {
    const at = zone(biomeGroup);
    steps.push({ type: "travel", to: at });
    steps.push(...wear(at, gear[biomeGroup] ?? []));
    steps.push({ type: "farm", at, until: { type: "biomeLevelAtLeast", biomeGroup, level: biomeLevelCap(4, biomeGroup) } });
  }
  // Every T4 lesson is learned now; auto places them all.
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
    id: apprenticeRouteId(4, disciplineId),
    version: "1.0.0",
    classRoot: APPRENTICE_CLASS_ROOT,
    description:
      `Apprentice T4: the T3 route (${APPRENTICE_DISCIPLINE_NAME[disciplineId]}, ${nameOf(APPRENTICE_KIT.specializations, APPRENTICE_T3_SPECIALIZATIONS[disciplineId])}), the tier-4 promotion, the ${nameOf(APPRENTICE_KIT.leaves, leafId)} leaf, the seven T4 zones ` +
      "(the Wasteland and the Trench new) to their cap, wearing each zone's gear, auto Payoff rules, " +
      "and the seven T4 bosses.",
    steps,
    completion: allOf(
      t3.completion,
      ...APPRENTICE_T4_ZONES.map(({ biomeGroup }) => ({ type: "bossCleared" as const, biomeGroup, tier: 4 })),
    ),
    milestones,
  };
}
