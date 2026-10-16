import {
  absoluteZoneLevel,
  biomeLevelCap,
  SLINGER_KIT,
} from "@mmo-idle/shared";
import { allOf, type Condition, type NodeRef, type Route, type RouteStep } from "../route/types";
import { SLINGER_CLASS_ROOT, slingerT1Route, zoneGearSteps, type DisciplineGun } from "./slingerT1";

/**
 * The Slinger's T2 route (T2-W2, bible §10.5 and §10.16).
 *
 * The whole T1 route first (quest, class, auto Loadout, the two seals, the
 * tier-2 promotion), then the discipline, then each T2 zone farmed to the tier-2
 * cap the tutorial farms to, then that zone's boss at tier 2. The Loadout stays
 * in `auto`: the server rebuilds the default as each T2 clip and trophy rank
 * arrives, and the discipline's own default (the twin guns' second clip, the
 * drum, the called shot's pick order) comes with the pick.
 *
 * The discipline is a route choice (`slinger-discipline`): Gunslinger by
 * default, `--choices '{"slinger-discipline":"siege"}'` for the others. The pick
 * is an `unlockSkill` of the discipline's tier-1 skill-tree node, whose id is the
 * discipline id. The runner has no discipline step of its own, and none is needed.
 *
 * Zone order is the tutorial's (`t2Beats`): the five zones that carried over from
 * T1, then the Jungle and the Desert. A boss that walls the character is recorded
 * as a blocked step, and the route goes on.
 */
export const SLINGER_T2_ID = "slinger-t2";

export const SLINGER_DISCIPLINES = ["gunslinger", "siege", "trickshot"] as const;
export type SlingerDiscipline = (typeof SLINGER_DISCIPLINES)[number];
export const DEFAULT_SLINGER_DISCIPLINE: SlingerDiscipline = "gunslinger";

/** The T2 zones, in the tutorial's order. */
export const T2_ZONE_ORDER: readonly string[] = ["plains", "forest", "mountain", "swamp", "cave", "jungle", "desert"];

function zone(biomeGroup: string): NodeRef {
  return { kind: "biome", biomeGroup, tier: 2, pick: "uncleared" };
}

/**
 * Each T2 zone's vest, charm and boots, worn as they unlock (a carried-over zone opens
 * them at 8, 9 and 10; the Jungle and the Desert at 2, 3 and 4).
 */
export const SLINGER_T2_ZONE_KIT: Readonly<Record<string, readonly string[]>> = Object.fromEntries(
  T2_ZONE_ORDER.map((biome) => [biome, [`${biome}-vest-t2`, `${biome}-charm-t2`, `${biome}-boots-t2`]]),
);

/**
 * The T2 guns each discipline fits (bible §10.4), so the first T2 boss (the Plains) is
 * met in a T2 class weapon. Gunslinger: the Pepperbox, then the Carbine. Siege: the
 * Pepperbox, then the Drum Gun. Trickshot: the Hand Cannon, made in the Mountain before
 * the Plains boss (a detour), then the Snakebite Pistol stays on the bench (below the
 * Hand Cannon). The Jungle's Hunting Rifle and the Desert's Long Rifle fit no discipline.
 */
export const SLINGER_T2_GUNS: readonly DisciplineGun[] = [
  { discipline: "gunslinger", zone: "plains", id: "slinger-pepperbox-t2" },
  { discipline: "gunslinger", zone: "forest", id: "slinger-carbine-t2" },
  { discipline: "siege", zone: "plains", id: "slinger-pepperbox-t2" },
  { discipline: "siege", zone: "cave", id: "slinger-drum-gun-t2" },
  { discipline: "trickshot", zone: "mountain", id: "slinger-hand-cannon-t2", before: "plains" },
];

/** How far the route farms a T2 zone: the tier-2 cap, as the guide does. */
export function slingerT2FarmLevel(biomeGroup: string): number {
  return biomeLevelCap(2, biomeGroup);
}

/** The biome level a zone's tier-2 lesson lands at, read off the kit. */
export function slingerT2LessonLevel(biomeGroup: string): number {
  for (const lesson of SLINGER_KIT.lessons) {
    const source = lesson.source;
    if (source.kind === "zone" && source.biome === biomeGroup && source.tier === 2) return absoluteZoneLevel(source);
  }
  throw new Error(`slinger T2: no tier-2 lesson in ${biomeGroup}`);
}

export function slingerT2Route(): Route {
  const t1 = slingerT1Route();
  const steps: RouteStep[] = [...t1.steps];

  for (const discipline of SLINGER_DISCIPLINES) {
    steps.push({
      type: "unlockSkill",
      skillId: `slinger-${discipline}`,
      label: `pick the ${discipline} discipline`,
      choice: { id: "slinger-discipline", option: discipline, defaultOption: DEFAULT_SLINGER_DISCIPLINE },
    });
  }

  for (const biomeGroup of T2_ZONE_ORDER) {
    const at = zone(biomeGroup);
    const gear = zoneGearSteps(biomeGroup, 2, SLINGER_T2_GUNS, SLINGER_T2_ZONE_KIT[biomeGroup] ?? []);
    steps.push(...gear.before);
    steps.push({ type: "travel", to: at });
    steps.push(...gear.inZone);
    steps.push({
      type: "farm",
      at,
      until: { type: "biomeLevelAtLeast", biomeGroup, level: slingerT2FarmLevel(biomeGroup) },
    });
    steps.push({ type: "attemptBoss", biomeGroup, tier: 2 });
  }

  const milestones: Route["milestones"] = [...t1.milestones];
  for (const biomeGroup of T2_ZONE_ORDER) {
    milestones.push({
      id: `t2-${biomeGroup}-lesson`,
      when: { type: "biomeLevelAtLeast", biomeGroup, level: slingerT2LessonLevel(biomeGroup) },
    });
    milestones.push({
      id: `t2-${biomeGroup}-level-${slingerT2FarmLevel(biomeGroup)}`,
      when: { type: "biomeLevelAtLeast", biomeGroup, level: slingerT2FarmLevel(biomeGroup) },
    });
    milestones.push({
      id: `t2-${biomeGroup}-boss`,
      when: { type: "bossCleared", biomeGroup, tier: 2 },
    });
  }

  const t2Bosses: Condition[] = T2_ZONE_ORDER.map((biomeGroup) => ({ type: "bossCleared", biomeGroup, tier: 2 }));

  return {
    id: SLINGER_T2_ID,
    version: "1.0.0",
    classRoot: SLINGER_CLASS_ROOT,
    description:
      "Slinger T2: the T1 route, a discipline (Gunslinger by default), each T2 zone to the " +
      "tier-2 cap, then its tier-2 boss.",
    steps,
    completion: allOf(t1.completion, ...t2Bosses),
    milestones,
  };
}
