import { biomeLevelCap, RECIPE_DATABASE, STRIKER_KIT } from "@mmo-idle/shared";
import { allOf, type NodeRef, type Route, type RouteStep } from "../route/types";
import { STRIKER_CLASS_ROOT, wearInOrder } from "./strikerT1";
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
 * as the T3 lessons and trophies arrive. Each zone's T3 gear is crafted and worn as the zone opens
 * it (`strikerT3ZoneGear`).
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

/**
 * The weapon each discipline takes as a T3 zone opens it (§12.5 "Wants", §12.9 jobs).
 * PLACEHOLDER (OV-STRIKER): every arm meets the first T3 seal (the Mountain) in the tier's Maul;
 * Balanced then takes the Cave's Bastard Sword; Light takes it too (it won the Cave T3 boss in
 * classBossSim at 43% HP where the Maul lost at 13% boss left), then the Jungle's Twin Fangs (the Forest's job
 * moved there). Heavy takes the Bastard Sword at the Cave too (OV2-STRIKER: the Maul's one swing in
 * 1.8 s death-looped at the T2 Jungle guard pack; in classBossSim the Bastard Sword won the five T3
 * bosses from the Cave on with 70-96% HP left, faster than the Maul).
 */
const T3_WEAPONS: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  "striker-light": { mountain: "striker-maul-t3", cave: "striker-bastard-sword-t3", jungle: "striker-twin-fangs-t3" },
  "striker-balanced": { mountain: "striker-maul-t3", cave: "striker-bastard-sword-t3" },
  "striker-heavy": { mountain: "striker-maul-t3", cave: "striker-bastard-sword-t3" },
};

/**
 * What the arm wears from a T3 zone, in unlock order: its weapon, then the zone's own vest, charm
 * and boots, each the answer to that zone's threat, worn at its boss (the Swamp's vest and charm
 * won the Rot-Spore Croc-Behemoth with 85% HP left in classBossSim where the Mountain's lost at
 * 51%). PLACEHOLDER (OV-STRIKER).
 */
export function strikerT3ZoneGear(disciplineId: string, biomeGroup: string): string[] {
  const reworn = strikerT3Reworn(disciplineId, biomeGroup);
  const slotOf = (id: string) => RECIPE_DATABASE.get(id)?.slot;
  const weapon = T3_WEAPONS[disciplineId]?.[biomeGroup] ?? reworn.find((id) => slotOf(id) === "weapon");
  const set = ["vest", "charm", "boots"].map((slot) => `${biomeGroup}-${slot}-t${TIER}`).filter((id) => RECIPE_DATABASE.has(id))
    .map((id) => reworn.find((piece) => slotOf(piece) === slotOf(id)) ?? id);
  return [...(weapon ? [weapon] : []), ...set];
}

/**
 * Pieces a T3 zone puts back on instead of its own (crafted in an earlier T3 zone), by discipline.
 * PLACEHOLDER (OV2-STRIKER): Heavy wears the Swamp's vest (Bloodless) at the Jungle, as at T2: the
 * nine-guard pack's Venom Dart Frog poison killed it in the Jungle vest (lane 2, 2026-10-17); the
 * Jungle boss in classBossSim: won with 79-96% HP left. Light puts the Cave's Bastard Sword back on
 * for the Volcanic boss: in Twin Fangs it lost the Cinder-Shell Magma-Salamander twice on the clean
 * run (boss 1% and 8% left, 65 s; obsidian shells against small hits, Light's weakness); in
 * classBossSim the Sword won it 3/3 in 20 s with full HP (the Fangs 40-46 s).
 */
const T3_REWORN: Readonly<Record<string, Readonly<Record<string, readonly string[]>>>> = {
  "striker-light": { volcanic: ["striker-bastard-sword-t3"] },
  "striker-heavy": { jungle: ["swamp-vest-t3"] },
};

export function strikerT3Reworn(disciplineId: string, biomeGroup: string): string[] {
  return [...(T3_REWORN[disciplineId]?.[biomeGroup] ?? [])];
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
    steps.push(...wearInOrder(strikerT3ZoneGear(spec.disciplineId, biomeGroup), at, `${biomeGroup} T3`));
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
