import {
  absoluteZoneLevel,
  biomeLevelCap,
  SLINGER_KIT,
} from "@mmo-idle/shared";
import { allOf, type Condition, type NodeRef, type Route, type RouteStep } from "../route/types";
import { SLINGER_CLASS_ROOT, wearAsUnlocked, zoneGearSteps, type DisciplineGun } from "./slingerT1";
import { DEFAULT_SLINGER_DISCIPLINE, SLINGER_CHAINS, slingerRouteId, type SlingerDiscipline } from "./slingerT2";
import { slingerT3Route } from "./slingerT3";

/**
 * The Slinger's T4 route (T4-W2, bible §10.7 and §10.16).
 *
 * The whole T3 route first (through the specialization and the seven T3 zones), then the
 * leaf, then each T4 zone farmed to the tier-4 cap the tutorial farms to, then that zone's
 * boss at tier 4. The Loadout stays in `auto`: the server rebuilds the default as each T4 clip
 * and trophy arrives.
 *
 * The leaf is a route choice (`slinger-leaf`), an `unlockSkill` of the leaf's skill-tree node,
 * whose id is the kit's leaf id; it sits under the discipline the T2 part picked. The default is
 * Light Hands (the Gunslinger's); for another discipline pass the discipline, specialization
 * and leaf together, e.g.
 * `--choices '{"slinger-discipline":"siege","slinger-specialization":"deathmark","slinger-leaf":"bunker"}'`.
 * A mismatched pair is refused by the server at the unlock step.
 *
 * Zone order is the tutorial's (`T4_ZONES`): the five zones that carried over from T3, then the
 * new Wasteland (biome id `graveyard`) and Trench. A boss that walls the character is recorded
 * as a blocked step, and the route goes on.
 */
export const SLINGER_T4_ID = "slinger-t4";

export const DEFAULT_SLINGER_LEAF = SLINGER_CHAINS[DEFAULT_SLINGER_DISCIPLINE].leaf;

/** The nine leaves by discipline id (the kit is the one source). */
export const SLINGER_LEAVES: readonly { id: string; disciplineId: string }[] = SLINGER_KIT.leaves.map(
  (entry) => ({ id: entry.id, disciplineId: entry.disciplineId }),
);

/** The T4 zones, in the tutorial's order. */
export const T4_ZONE_ORDER: readonly string[] = ["mountain", "tundra", "jungle", "desert", "volcanic", "graveyard", "trench"];

function zone(biomeGroup: string): NodeRef {
  return { kind: "biome", biomeGroup, tier: 4, pick: "uncleared" };
}

/** How far the route farms a T4 zone: the tier-4 cap, as the guide does. */
export function slingerT4FarmLevel(biomeGroup: string): number {
  return biomeLevelCap(4, biomeGroup);
}

/** The biome level a zone's tier-4 lesson lands at, read off the kit. */
export function slingerT4LessonLevel(biomeGroup: string): number {
  for (const lesson of SLINGER_KIT.lessons) {
    const source = lesson.source;
    if (source.kind === "zone" && source.biome === biomeGroup && source.tier === 4) return absoluteZoneLevel(source);
  }
  throw new Error(`slinger T4: no tier-4 lesson in ${biomeGroup}`);
}

/** The choice option for a leaf id: `slinger-light-hands` is `light-hands`. */
/**
 * The tier's vest: the Jungle's second base, which carries the Forest's moved Quickdraw (walk at
 * half speed while reloading), made on a detour into the Jungle in front of the tier's first
 * boss and kept for the whole tier, as at T2 (the Forest vest). PLACEHOLDER pick.
 */
export const SLINGER_T4_VEST = "jungle-vest-t4-b";

/**
 * Each T4 zone's charm and boots, worn as they unlock; the one vest is the Jungle's second
 * base (Quickdraw, `SLINGER_T4_VEST`), made first. The Jungle's are its second
 * bases (the Forest's moved Quickdraw and Fleet, as at T3); the Trench's boots are the
 * Stalkers (the faster pair). PLACEHOLDER picks.
 */
export const SLINGER_T4_ZONE_KIT: Readonly<Record<string, readonly string[]>> = {
  mountain: ["mountain-charm-t4", "mountain-boots-t4"],
  tundra: ["tundra-charm-t4", "tundra-boots-t4"],
  jungle: ["jungle-vest-t4-b", "jungle-charm-t4-b", "jungle-boots-t4"],
  desert: ["desert-charm-t4", "desert-boots-t4"],
  volcanic: ["volcanic-charm-t4", "volcanic-boots-t4"],
  graveyard: ["graveyard-charm-t4", "graveyard-boots-t4"],
  trench: ["trench-charm-t4", "trench-boots-t4-stalkers"],
};

/**
 * The T4 guns each discipline fits, so the first T4 boss (the Mountain) is met in one:
 * Gunslinger's Carbine (the Jungle's, a detour), Siege's Drum Gun (moved to the Trench,
 * a detour), Trickshot's Hand Cannon (the Mountain's own).
 */
export const SLINGER_T4_GUNS: readonly DisciplineGun[] = [
  { discipline: "gunslinger", zone: "jungle", id: "slinger-carbine-t4", before: "mountain" },
  { discipline: "siege", zone: "trench", id: "slinger-drum-gun-t4", before: "mountain" },
  { discipline: "trickshot", zone: "mountain", id: "slinger-hand-cannon-t4" },
];

function optionOf(leafId: string): string {
  return leafId.replace(/^slinger-/, "");
}

export function slingerT4Route(chainId: SlingerDiscipline = DEFAULT_SLINGER_DISCIPLINE): Route {
  const chain = SLINGER_CHAINS[chainId];
  const t3 = slingerT3Route(chainId);
  const steps: RouteStep[] = [...t3.steps];

  for (const leaf of SLINGER_LEAVES) {
    steps.push({
      type: "unlockSkill",
      skillId: leaf.id,
      label: `pick the ${optionOf(leaf.id)} leaf`,
      choice: { id: "slinger-leaf", option: optionOf(leaf.id), defaultOption: chain.leaf },
    });
  }

  // The tier's vest first (a detour into the Jungle), for every discipline.
  steps.push(...wearAsUnlocked(zone("jungle"), [SLINGER_T4_VEST]));

  for (const biomeGroup of T4_ZONE_ORDER) {
    const at = zone(biomeGroup);
    const gear = zoneGearSteps(biomeGroup, 4, SLINGER_T4_GUNS, SLINGER_T4_ZONE_KIT[biomeGroup] ?? [], chain.discipline);
    steps.push(...gear.before);
    steps.push({ type: "travel", to: at });
    steps.push(...gear.inZone);
    steps.push({
      type: "farm",
      at,
      until: { type: "biomeLevelAtLeast", biomeGroup, level: slingerT4FarmLevel(biomeGroup) },
    });
    steps.push({ type: "attemptBoss", biomeGroup, tier: 4 });
  }

  const milestones: Route["milestones"] = [...t3.milestones];
  for (const biomeGroup of T4_ZONE_ORDER) {
    milestones.push({
      id: `t4-${biomeGroup}-lesson`,
      when: { type: "biomeLevelAtLeast", biomeGroup, level: slingerT4LessonLevel(biomeGroup) },
    });
    milestones.push({
      id: `t4-${biomeGroup}-level-${slingerT4FarmLevel(biomeGroup)}`,
      when: { type: "biomeLevelAtLeast", biomeGroup, level: slingerT4FarmLevel(biomeGroup) },
    });
    milestones.push({
      id: `t4-${biomeGroup}-boss`,
      when: { type: "bossCleared", biomeGroup, tier: 4 },
    });
  }

  const t4Bosses: Condition[] = T4_ZONE_ORDER.map((biomeGroup) => ({ type: "bossCleared", biomeGroup, tier: 4 }));

  return {
    id: slingerRouteId(4, chain.discipline),
    version: "1.0.0",
    classRoot: SLINGER_CLASS_ROOT,
    description:
      `Slinger T4: the T3 route, a leaf (${chain.leaf} by default), each T4 zone to the ` +
      "tier-4 cap, then its tier-4 boss.",
    steps,
    completion: allOf(t3.completion, ...t4Bosses),
    milestones,
  };
}
