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

/**
 * One discipline chain: the discipline (T2), the specialization (T3) and the leaf (T4) its
 * routes default to (choice options, without the `slinger-` prefix). Gunslinger's chain is the
 * routes' original default (`slinger-t2..t4`); the other two register as `slinger-t<n>-<discipline>`
 * (OV2). Bible §10.13 names no default specialization or leaf; these are the most natural
 * for the bar (tier bosses): PLACEHOLDER picks, the evidence is in reports/OV2-SLINGER.md.
 */
export interface SlingerChain {
  discipline: SlingerDiscipline;
  specialization: string;
  leaf: string;
}

export const SLINGER_CHAINS: Readonly<Record<SlingerDiscipline, SlingerChain>> = {
  gunslinger: { discipline: "gunslinger", specialization: "fan-the-hammer", leaf: "light-hands" },
  siege: { discipline: "siege", specialization: "entrenched", leaf: "bunker" },
  trickshot: { discipline: "trickshot", specialization: "deadeye", leaf: "cool-reload" },
};

/** A tier's route id for a chain: the Gunslinger keeps the bare id (`slinger-t2`), the others carry the discipline. */
export function slingerRouteId(tier: number, discipline: SlingerDiscipline): string {
  return discipline === DEFAULT_SLINGER_DISCIPLINE ? `slinger-t${tier}` : `slinger-t${tier}-${discipline}`;
}

/** The T2 zones, in the tutorial's order. */
export const T2_ZONE_ORDER: readonly string[] = ["plains", "forest", "mountain", "swamp", "cave", "jungle", "desert"];

function zone(biomeGroup: string): NodeRef {
  return { kind: "biome", biomeGroup, tier: 2, pick: "uncleared" };
}

/**
 * The vests the route wears at T2: the Plains', then the Forest's, kept from there on.
 * The Forest vest's line is Quickdraw (walk at half speed while reloading): it covers the
 * stationary reload, the Slinger's risk window, better than any later T2 vest (sim, the
 * Gunslinger's T2 bosses in the Forest vest against each zone's own: Mountain 100% HP left
 * against 30-51%, Desert 100% against 57-100%, and the Cave boss that walled the clean chain
 * six times (boss 39-42% left) won at 84%). PLACEHOLDER pick.
 */
const T2_VESTS = new Set(["plains", "forest"]);

/**
 * Each T2 zone's charm and boots (and the vest where `T2_VESTS` says), worn as they unlock
 * (a carried-over zone opens them at 8, 9 and 10; the Jungle and the Desert at 2, 3 and 4).
 */
export const SLINGER_T2_ZONE_KIT: Readonly<Record<string, readonly string[]>> = Object.fromEntries(
  T2_ZONE_ORDER.map((biome) => [biome, [
    ...(T2_VESTS.has(biome) ? [`${biome}-vest-t2`] : []), `${biome}-charm-t2`, `${biome}-boots-t2`,
  ]]),
);

/**
 * The T2 guns each discipline fits (bible §10.4), so the first T2 boss (the Plains) is
 * met in a T2 class weapon. Gunslinger: the Pepperbox, then the Carbine. Siege: the
 * Drum Gun, made in the Cave before the Plains boss (a detour; OV2: with the Pepperbox the sim
 * lost the T2 Mountain boss 3/3, boss 39-60% left, with the Drum Gun won 2/2). Trickshot: the Hand Cannon, made in the Mountain before
 * the Plains boss (a detour), then the Snakebite Pistol stays on the bench (below the
 * Hand Cannon). The Jungle's Hunting Rifle and the Desert's Long Rifle fit no discipline.
 */
export const SLINGER_T2_GUNS: readonly DisciplineGun[] = [
  { discipline: "gunslinger", zone: "plains", id: "slinger-pepperbox-t2" },
  { discipline: "gunslinger", zone: "forest", id: "slinger-carbine-t2" },
  { discipline: "siege", zone: "cave", id: "slinger-drum-gun-t2", before: "plains" },
  { discipline: "trickshot", zone: "mountain", id: "slinger-hand-cannon-t2", before: "plains" },
];

/**
 * Discipline-only pieces, made like the guns (a choice step on that discipline's run). Siege puts on
 * the Jungle's vest as it enters the Jungle (anti-ambush base: more HP, evasion, damage-over-time
 * resistance; Lookout) in place of the Forest's Quickdraw: the live Siege died three times to the
 * Jungle dungeon's nine guards (poison: 152 of 347 damage in the last death's window), and the sim's
 * Jungle boss went 2/3 -> 3/3 in it (Desert 3/3 either way). Trickshot too (2026-10-17): the final
 * merged-tree Trickshot died seven times to the same pack (Vine Chameleon poison) and gave up on its
 * guards twice before a third attempt went through; with the vest its re-run took the T2 Jungle first
 * try with no death. The Gunslinger as well: its final run died four times to the pack and needed three
 * attempts. PLACEHOLDER pick.
 */
export const SLINGER_T2_DISCIPLINE_PIECES: readonly DisciplineGun[] = [
  { discipline: "siege", zone: "jungle", id: "jungle-vest-t2" },
  { discipline: "trickshot", zone: "jungle", id: "jungle-vest-t2" },
  { discipline: "gunslinger", zone: "jungle", id: "jungle-vest-t2" },
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

export function slingerT2Route(chainId: SlingerDiscipline = DEFAULT_SLINGER_DISCIPLINE): Route {
  const chain = SLINGER_CHAINS[chainId];
  const t1 = slingerT1Route();
  const steps: RouteStep[] = [...t1.steps];

  for (const discipline of SLINGER_DISCIPLINES) {
    steps.push({
      type: "unlockSkill",
      skillId: `slinger-${discipline}`,
      label: `pick the ${discipline} discipline`,
      choice: { id: "slinger-discipline", option: discipline, defaultOption: chain.discipline },
    });
  }

  for (const biomeGroup of T2_ZONE_ORDER) {
    const at = zone(biomeGroup);
    const gear = zoneGearSteps(biomeGroup, 2, [...SLINGER_T2_GUNS, ...SLINGER_T2_DISCIPLINE_PIECES], SLINGER_T2_ZONE_KIT[biomeGroup] ?? [], chain.discipline);
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
    id: slingerRouteId(2, chain.discipline),
    version: "1.0.0",
    classRoot: SLINGER_CLASS_ROOT,
    description:
      `Slinger T2: the T1 route, a discipline (${chain.discipline} by default), each T2 zone to the ` +
      "tier-2 cap, then its tier-2 boss.",
    steps,
    completion: allOf(t1.completion, ...t2Bosses),
    milestones,
  };
}
