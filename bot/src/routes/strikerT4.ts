import { biomeLevelCap, RECIPE_DATABASE, STRIKER_KIT } from "@mmo-idle/shared";
import { allOf, type NodeRef, type Route, type RouteStep } from "../route/types";
import { STRIKER_CLASS_ROOT, wearInOrder } from "./strikerT1";
import { STRIKER_T3_ROUTE_IDS, strikerT3Route } from "./strikerT3";
import { unlessDone } from "./strikerT2";

/**
 * The Striker's T4 route (T4-W2, bible §12.7 and §12.16).
 *
 * The whole `striker-t3` route for the leaf's discipline first (taking that discipline's
 * specialization, `strikerT4SpecializationOf`; the leaf does not depend on which), then a wait for
 * the tier-4 promotion, the leaf pick, and the seven T4 zones in the guide's order, each farmed to its cap and then its
 * tier-4 boss. A leaf is a skill node (`unlockSkill`), the same pick the Passive Tree makes; one
 * route per leaf, so a batch can run all nine arms. The Order stays on the auto setting, which the
 * server rebuilds as the T4 lessons and trophies arrive.
 *
 * Registered, but left out of `CONTROLLED_ROUTE_IDS` until it has run live.
 */

/**
 * The specialization a T4 route's T3 replay takes, by discipline: the discipline's first unless named
 * here. PLACEHOLDER (OV2-STRIKER): Light takes Afterglow. In classBossSim Thousand Cuts (its first)
 * lost the T3 and T4 Volcanic bosses (1 of 2 each, boss 1-11% left): every few seconds out of reach
 * put the shine out, and its doubled on-hit is all it adds. Afterglow (the shine outlasts a break by
 * a combo and lights the finisher) won all fourteen T3/T4 bosses, the Volcanic ones at full HP.
 */
const STRIKER_T4_SPECIALIZATION: Readonly<Record<string, string>> = { "striker-light": "striker-afterglow" };

export function strikerT4SpecializationOf(disciplineId: string): string | undefined {
  return STRIKER_T4_SPECIALIZATION[disciplineId]
    ?? STRIKER_KIT.specializations.find((entry) => entry.disciplineId === disciplineId)?.id;
}

/** Route id by leaf id: `striker-t4-<name>`. */
export const STRIKER_T4_ROUTE_IDS: Readonly<Record<string, string>> = Object.fromEntries(
  STRIKER_KIT.leaves.map((leaf) => [leaf.id, leaf.id.replace(/^striker-/, "striker-t4-")]),
);

/** The T4 zones in the guide's order: the Swamp and Cave have retired; the Wasteland (`graveyard`) and Trench are new. */
export const STRIKER_T4_ZONES: readonly string[] = ["mountain", "tundra", "jungle", "desert", "volcanic", "graveyard", "trench"];

const TIER = 4;

function zone(biomeGroup: string): NodeRef {
  return { kind: "biome", biomeGroup, tier: TIER, pick: "uncleared" };
}

/** How far the guided route farms a T4 zone before its boss (the tier cap, as in T1 to T3). */
export function strikerT4FarmLevel(biomeGroup: string): number {
  return biomeLevelCap(TIER, biomeGroup);
}

/**
 * The weapon each discipline takes as a T4 zone opens it (§12.5 "Wants", §12.9 jobs, §12.16 moved
 * jobs). PLACEHOLDER (OV-STRIKER): every arm meets the first T4 seal (the Mountain) in the tier's
 * Maul; Balanced then takes the Wasteland's Reaper's Scythe (its army fight: every beat splashes) and
 * the Bastard Sword in the Trench (the Cave's job moved there), Light the
 * Jungle's Twin Fangs. Heavy takes the Scythe at the Wasteland too and keeps it (OV2-STRIKER: in
 * classBossSim the Maul lost the Charnel-Crown Sovereign at 93% boss left, taking 9% of its HP a
 * second from the risen; the Scythe won it 2/2, and the Trench duel 2/2 at 77% HP).
 */
const T4_WEAPONS: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  "striker-light": { mountain: "striker-maul-t4", jungle: "striker-twin-fangs-t4" },
  "striker-balanced": { mountain: "striker-maul-t4", graveyard: "striker-reapers-scythe-t4", trench: "striker-bastard-sword-t4" },
  "striker-heavy": { mountain: "striker-maul-t4", graveyard: "striker-reapers-scythe-t4" },
};

/**
 * What the arm wears from a T4 zone, in unlock order: its weapon, then the zone's own vest, charm
 * and boots, the answer to that zone's threat, worn at its boss (as at T3). PLACEHOLDER.
 */
export function strikerT4ZoneGear(disciplineId: string, biomeGroup: string): string[] {
  const weapon = T4_WEAPONS[disciplineId]?.[biomeGroup];
  const set = ["vest", "charm", "boots"].map((slot) => `${biomeGroup}-${slot}-t${TIER}`).filter((id) => RECIPE_DATABASE.has(id));
  return [...(weapon ? [weapon] : []), ...set];
}

export function strikerT4Route(leafId = "striker-ghoststep"): Route {
  const id = STRIKER_T4_ROUTE_IDS[leafId];
  const leaf = STRIKER_KIT.leaves.find((entry) => entry.id === leafId);
  if (!id || !leaf) {
    throw new Error(`unknown Striker leaf "${leafId}" (have: ${Object.keys(STRIKER_T4_ROUTE_IDS).join(", ")})`);
  }
  const specialization = strikerT4SpecializationOf(leaf.disciplineId);
  if (!specialization || !STRIKER_T3_ROUTE_IDS[specialization]) throw new Error(`no T3 route for ${leaf.disciplineId}`);
  const t3 = strikerT3Route(specialization);

  const steps: RouteStep[] = [
    unlessDone(t3, "the T3 route"),
    {
      type: "farm",
      at: { kind: "biome", biomeGroup: "volcanic", tier: 3, pick: "uncleared" },
      until: { type: "playerTierAtLeast", tier: TIER },
      label: "wait for the tier-4 promotion",
    },
    { type: "unlockSkill", skillId: leafId, label: `pick the ${leafId} leaf` },
  ];
  for (const biomeGroup of STRIKER_T4_ZONES) {
    const at = zone(biomeGroup);
    steps.push({ type: "travel", to: at });
    steps.push(...wearInOrder(strikerT4ZoneGear(leaf.disciplineId, biomeGroup), at, `${biomeGroup} T4`));
    steps.push({
      type: "farm",
      at,
      until: { type: "biomeLevelAtLeast", biomeGroup, level: strikerT4FarmLevel(biomeGroup) },
    });
    steps.push({ type: "attemptBoss", biomeGroup, tier: TIER });
  }

  const milestones: Route["milestones"] = [
    ...t3.milestones,
    { id: "tier-4-reached", when: { type: "playerTierAtLeast", tier: TIER } },
  ];
  for (const biomeGroup of STRIKER_T4_ZONES) {
    milestones.push({
      id: `${biomeGroup}-t4-level-${strikerT4FarmLevel(biomeGroup)}`,
      when: { type: "biomeLevelAtLeast", biomeGroup, level: strikerT4FarmLevel(biomeGroup) },
    });
    milestones.push({ id: `${biomeGroup}-t4-boss`, when: { type: "bossCleared", biomeGroup, tier: TIER } });
  }

  return {
    id,
    version: "1.0.0",
    classRoot: STRIKER_CLASS_ROOT,
    description:
      `Striker T4 (${leafId}): the T3 route for ${leaf.disciplineId}, the tier-4 promotion and the leaf pick, ` +
      "then each T4 zone farmed to its cap and its tier-4 boss.",
    steps,
    completion: allOf(
      ...STRIKER_T4_ZONES.map((biomeGroup) => ({ type: "bossCleared" as const, biomeGroup, tier: TIER })),
    ),
    milestones,
  };
}
