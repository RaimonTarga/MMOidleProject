import {
  absoluteZoneLevel,
  biomeLevelCap,
  SLINGER_KIT,
} from "@mmo-idle/shared";
import { allOf, type Condition, type NodeRef, type Route, type RouteStep } from "../route/types";
import { SLINGER_CLASS_ROOT, wearAsUnlocked, zoneGearSteps, type DisciplineGun } from "./slingerT1";
import { DEFAULT_SLINGER_DISCIPLINE, SLINGER_CHAINS, slingerRouteId, slingerT2Route, type SlingerDiscipline } from "./slingerT2";

/**
 * The Slinger's T3 route (T3-W2, bible §10.6 and §10.16).
 *
 * The whole T2 route first (T1, the discipline, the seven T2 zones and bosses), then the
 * specialization, then each T3 zone farmed to the tier-3 cap the tutorial farms to, then that
 * zone's boss at tier 3. The Loadout stays in `auto`: the server rebuilds the default as each
 * T3 clip and trophy arrives.
 *
 * The specialization is a route choice (`slinger-specialization`), an `unlockSkill` of the
 * specialization's tier-2 skill-tree node, whose id is the kit's specialization id. It must
 * sit under the discipline the T2 part picked: the default pair is Gunslinger and Fan the
 * Hammer; for another discipline pass both, e.g.
 * `--choices '{"slinger-discipline":"siege","slinger-specialization":"deathmark"}'`.
 * A mismatched pair is refused by the server at the unlock step.
 *
 * Zone order is the tutorial's (`T3_ZONES`): the five zones that carried over from T2, then
 * the new Tundra and Volcanic. A boss that walls the character is recorded as a blocked step,
 * and the route goes on.
 */
export const SLINGER_T3_ID = "slinger-t3";

export const DEFAULT_SLINGER_SPECIALIZATION = SLINGER_CHAINS[DEFAULT_SLINGER_DISCIPLINE].specialization;

/** The nine specializations by discipline id (the kit is the one source). */
export const SLINGER_SPECIALIZATIONS: readonly { id: string; disciplineId: string }[] = SLINGER_KIT.specializations.map(
  (entry) => ({ id: entry.id, disciplineId: entry.disciplineId }),
);

/** The T3 zones, in the tutorial's order. */
export const T3_ZONE_ORDER: readonly string[] = ["mountain", "cave", "swamp", "jungle", "desert", "tundra", "volcanic"];

function zone(biomeGroup: string): NodeRef {
  return { kind: "biome", biomeGroup, tier: 3, pick: "uncleared" };
}

/**
 * The tier's vest: the Jungle's second base, which carries the Forest's moved Quickdraw (walk at
 * half speed while reloading), made on a detour into the Jungle in front of the tier's first
 * boss and kept for the whole tier, as at T2 (the Forest vest). PLACEHOLDER pick.
 */
export const SLINGER_T3_VEST = "jungle-vest-t3-b";

/**
 * Each T3 zone's charm and boots, worn as they unlock; the one vest is the Jungle's second
 * base (Quickdraw, `SLINGER_T3_VEST`), made first. The Jungle's are its second
 * bases, which carry the Forest's moved lines (Quickdraw, Fleet): walking while you reload
 * and Recovery while you move suit a kiting Slinger better than its own (PLACEHOLDER pick).
 */
export const SLINGER_T3_ZONE_KIT: Readonly<Record<string, readonly string[]>> = {
  mountain: ["mountain-charm-t3", "mountain-boots-t3"],
  cave: ["cave-charm-t3", "cave-boots-t3"],
  swamp: ["swamp-charm-t3", "swamp-boots-t3"],
  jungle: ["jungle-vest-t3-b", "jungle-charm-t3-b", "jungle-boots-t3"],
  desert: ["desert-charm-t3", "desert-boots-t3"],
  tundra: ["tundra-charm-t3", "tundra-boots-t3"],
  volcanic: ["volcanic-charm-t3", "volcanic-boots-t3"],
};

/**
 * The T3 guns each discipline fits, so the first T3 boss (the Mountain) is met in one.
 * Gunslinger's Carbine has moved to the Jungle and Siege's Drum Gun is the Cave's, both
 * zones the route reaches after the Mountain: each is a detour in front of it (the Jungle
 * at its first T3 level, the Cave at its first). Trickshot's Hand Cannon is the Mountain's.
 * The Pepperbox (Volcanic) is below the Carbine and the Drum Gun, so it stays on the bench.
 */
export const SLINGER_T3_GUNS: readonly DisciplineGun[] = [
  { discipline: "gunslinger", zone: "jungle", id: "slinger-carbine-t3", before: "mountain" },
  { discipline: "siege", zone: "cave", id: "slinger-drum-gun-t3", before: "mountain" },
  { discipline: "trickshot", zone: "mountain", id: "slinger-hand-cannon-t3" },
];

/** How far the route farms a T3 zone: the tier-3 cap, as the guide does. */
export function slingerT3FarmLevel(biomeGroup: string): number {
  return biomeLevelCap(3, biomeGroup);
}

/** The biome level a zone's tier-3 lesson lands at, read off the kit. */
export function slingerT3LessonLevel(biomeGroup: string): number {
  for (const lesson of SLINGER_KIT.lessons) {
    const source = lesson.source;
    if (source.kind === "zone" && source.biome === biomeGroup && source.tier === 3) return absoluteZoneLevel(source);
  }
  throw new Error(`slinger T3: no tier-3 lesson in ${biomeGroup}`);
}

/** The choice option for a specialization id: `slinger-fan-the-hammer` is `fan-the-hammer`. */
function optionOf(specializationId: string): string {
  return specializationId.replace(/^slinger-/, "");
}

export function slingerT3Route(chainId: SlingerDiscipline = DEFAULT_SLINGER_DISCIPLINE): Route {
  const chain = SLINGER_CHAINS[chainId];
  const t2 = slingerT2Route(chainId);
  const steps: RouteStep[] = [...t2.steps];

  for (const spec of SLINGER_SPECIALIZATIONS) {
    steps.push({
      type: "unlockSkill",
      skillId: spec.id,
      label: `pick the ${optionOf(spec.id)} specialization`,
      choice: { id: "slinger-specialization", option: optionOf(spec.id), defaultOption: chain.specialization },
    });
  }

  // The tier's vest first (a detour into the Jungle), for every discipline.
  steps.push(...wearAsUnlocked(zone("jungle"), [SLINGER_T3_VEST]));

  for (const biomeGroup of T3_ZONE_ORDER) {
    const at = zone(biomeGroup);
    const gear = zoneGearSteps(biomeGroup, 3, SLINGER_T3_GUNS, SLINGER_T3_ZONE_KIT[biomeGroup] ?? [], chain.discipline);
    steps.push(...gear.before);
    steps.push({ type: "travel", to: at });
    steps.push(...gear.inZone);
    steps.push({
      type: "farm",
      at,
      until: { type: "biomeLevelAtLeast", biomeGroup, level: slingerT3FarmLevel(biomeGroup) },
    });
    steps.push({ type: "attemptBoss", biomeGroup, tier: 3 });
  }

  const milestones: Route["milestones"] = [...t2.milestones];
  for (const biomeGroup of T3_ZONE_ORDER) {
    milestones.push({
      id: `t3-${biomeGroup}-lesson`,
      when: { type: "biomeLevelAtLeast", biomeGroup, level: slingerT3LessonLevel(biomeGroup) },
    });
    milestones.push({
      id: `t3-${biomeGroup}-level-${slingerT3FarmLevel(biomeGroup)}`,
      when: { type: "biomeLevelAtLeast", biomeGroup, level: slingerT3FarmLevel(biomeGroup) },
    });
    milestones.push({
      id: `t3-${biomeGroup}-boss`,
      when: { type: "bossCleared", biomeGroup, tier: 3 },
    });
  }

  const t3Bosses: Condition[] = T3_ZONE_ORDER.map((biomeGroup) => ({ type: "bossCleared", biomeGroup, tier: 3 }));

  return {
    id: slingerRouteId(3, chain.discipline),
    version: "1.0.0",
    classRoot: SLINGER_CLASS_ROOT,
    description:
      `Slinger T3: the T2 route, a specialization (${chain.specialization} by default), each T3 zone to the ` +
      "tier-3 cap, then its tier-3 boss.",
    steps,
    completion: allOf(t2.completion, ...t3Bosses),
    milestones,
  };
}
