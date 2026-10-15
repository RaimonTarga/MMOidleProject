import {
  absoluteZoneLevel,
  biomeLevelCap,
  SLINGER_KIT,
} from "@mmo-idle/shared";
import { allOf, type Condition, type NodeRef, type Route, type RouteStep } from "../route/types";
import { SLINGER_CLASS_ROOT } from "./slingerT1";
import { slingerT2Route } from "./slingerT2";

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

export const DEFAULT_SLINGER_SPECIALIZATION = "fan-the-hammer";

/** The nine specializations by discipline id (the kit is the one source). */
export const SLINGER_SPECIALIZATIONS: readonly { id: string; disciplineId: string }[] = SLINGER_KIT.specializations.map(
  (entry) => ({ id: entry.id, disciplineId: entry.disciplineId }),
);

/** The T3 zones, in the tutorial's order. */
export const T3_ZONE_ORDER: readonly string[] = ["mountain", "cave", "swamp", "jungle", "desert", "tundra", "volcanic"];

function zone(biomeGroup: string): NodeRef {
  return { kind: "biome", biomeGroup, tier: 3, pick: "uncleared" };
}

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

export function slingerT3Route(): Route {
  const t2 = slingerT2Route();
  const steps: RouteStep[] = [...t2.steps];

  for (const spec of SLINGER_SPECIALIZATIONS) {
    steps.push({
      type: "unlockSkill",
      skillId: spec.id,
      label: `pick the ${optionOf(spec.id)} specialization`,
      choice: { id: "slinger-specialization", option: optionOf(spec.id), defaultOption: DEFAULT_SLINGER_SPECIALIZATION },
    });
  }

  for (const biomeGroup of T3_ZONE_ORDER) {
    const at = zone(biomeGroup);
    steps.push({ type: "travel", to: at });
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
    id: SLINGER_T3_ID,
    version: "1.0.0",
    classRoot: SLINGER_CLASS_ROOT,
    description:
      "Slinger T3: the T2 route, a specialization (Fan the Hammer by default), each T3 zone to the " +
      "tier-3 cap, then its tier-3 boss.",
    steps,
    completion: allOf(t2.completion, ...t3Bosses),
    milestones,
  };
}
