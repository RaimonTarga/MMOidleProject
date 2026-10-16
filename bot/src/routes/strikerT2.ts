import { biomeLevelCap, strikerComboLength, type ClassConfig } from "@mmo-idle/shared";
import { allOf, type NodeRef, type Route, type RouteStep } from "../route/types";
import { STRIKER_CLASS_ROOT, strikerT1Route, wearInOrder } from "./strikerT1";

/**
 * The Striker's T2 route (T2-W2, bible §12.5, §12.13 and §12.16).
 *
 * The whole `striker-t1` route first (the tier-0 quest, both seals, the tier-2
 * promotion), then the discipline pick, an auto Order sized to that discipline's
 * combo, and the seven T2 zones in the guide's order, each farmed to its cap and
 * then its tier-2 boss. A discipline is a skill node (`unlockSkill`), the same
 * pick the Passive Tree makes; one route per discipline, so a batch can run all
 * three arms. Each zone's T2 gear is crafted and worn as the zone opens it
 * (`strikerT2ZoneGear`), and the late seals are fought after the last zone
 * (`STRIKER_T2_LATE_SEALS`). OV-STRIKER's default chain is Balanced.
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

/**
 * The T2 pieces every arm wears, in each zone's unlock order (an old zone's T2 recipes open at
 * 7 / 8 / 9 / 10, a new zone's at 1 / 2 / 3 / 4). PLACEHOLDER picks (OV-STRIKER): only what beats
 * what is worn. The Plains set first (the first T2 seal meets the Plains weapon, vest, Grit
 * charm and boots of the tier); the Forest's evasion vest and boots over the Plains'; the
 * Jungle's vest (112 HP and evasion) and boots over the Forest's.
 */
const T2_ARMOR: Readonly<Record<string, readonly string[]>> = {
  plains: ["plains-vest-t2", "plains-charm-t2", "plains-boots-t2"],
  forest: ["forest-vest-t2", "forest-boots-t2"],
  jungle: ["jungle-vest-t2", "jungle-boots-t2"],
};

/**
 * The weapon each arm takes as its zone opens it (bible §12.5 "Wants", §12.9 jobs). Every arm
 * starts on the Plains' Broadblade for the first seal. Light keeps the Forest's Twin Fangs
 * (attack speed, on-hit); Balanced takes them, then the Cave's Bastard Sword (damage techniques
 * and the finisher hit harder); Heavy takes the Mountain's Maul (a much bigger finisher, faster
 * wind-ups). PLACEHOLDER.
 */
const T2_WEAPONS: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  "striker-light": { plains: "striker-broadblade-t2", forest: "striker-twin-fangs-t2" },
  "striker-balanced": { plains: "striker-broadblade-t2", forest: "striker-twin-fangs-t2", cave: "striker-bastard-sword-t2" },
  "striker-heavy": { plains: "striker-broadblade-t2", mountain: "striker-maul-t2" },
};

/**
 * A finished earlier tier is not walked again: its steps run only while its completion does not
 * hold. Every step is idempotent, but each zone's travel is not free (a resumed T2 character spent
 * ten minutes walking the T1 zones again). OV-STRIKER.
 */
export function unlessDone(route: Route, what: string): RouteStep {
  return { type: "ifPossible", when: { type: "not", of: route.completion }, steps: [...route.steps], label: `${what}, unless done` };
}

/** What the arm wears from this T2 zone, weapon first (its recipe opens first). */
export function strikerT2ZoneGear(disciplineId: string, biomeGroup: string): string[] {
  const weapon = T2_WEAPONS[disciplineId]?.[biomeGroup];
  return [...(weapon ? [weapon] : []), ...(T2_ARMOR[biomeGroup] ?? [])];
}

/**
 * Seals fought after the last zone instead of in the zone's turn. The Stoneplate Juggernaut's
 * designed stop is a stun or root on its Stoneplate cast; the Striker's Concuss (Cave) and Pin
 * (Desert) come after the Mountain in the guide's order, and in classBossSim the Mountain's turn
 * lost every fight (boss 12-19% left at death, its 99-damage swing a third of the pool).
 * PLACEHOLDER (OV-STRIKER).
 */
export const STRIKER_T2_LATE_SEALS: readonly string[] = ["mountain"];

/** The order the T2 bosses are fought in: the guide's, with the late seals at the end. */
export const STRIKER_T2_BOSS_ORDER: readonly string[] = [
  ...STRIKER_T2_ZONES.filter((biomeGroup) => !STRIKER_T2_LATE_SEALS.includes(biomeGroup)),
  ...STRIKER_T2_LATE_SEALS,
];

export function strikerT2Route(disciplineId = "striker-light"): Route {
  const id = STRIKER_T2_ROUTE_IDS[disciplineId];
  if (!id) throw new Error(`unknown Striker discipline "${disciplineId}" (have: ${Object.keys(STRIKER_T2_ROUTE_IDS).join(", ")})`);
  const t1 = strikerT1Route();

  const steps: RouteStep[] = [
    unlessDone(t1, "the T1 route"),
    { type: "unlockSkill", skillId: disciplineId, label: `pick the ${disciplineId} discipline` },
    { type: "classConfig", config: autoOrder(disciplineId) },
  ];
  for (const biomeGroup of STRIKER_T2_ZONES) {
    const at = zone(biomeGroup);
    steps.push({ type: "travel", to: at });
    steps.push(...wearInOrder(strikerT2ZoneGear(disciplineId, biomeGroup), at, `${biomeGroup} T2`));
    steps.push({
      type: "farm",
      at,
      until: { type: "biomeLevelAtLeast", biomeGroup, level: strikerT2FarmLevel(biomeGroup) },
    });
    if (!STRIKER_T2_LATE_SEALS.includes(biomeGroup)) steps.push({ type: "attemptBoss", biomeGroup, tier: TIER });
  }
  for (const biomeGroup of STRIKER_T2_LATE_SEALS) steps.push({ type: "attemptBoss", biomeGroup, tier: TIER });

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
