import {
  CLEARING_NODE_ID,
  RECIPE_DATABASE,
  T1_BIOME_ORDER,
  biomeLevelCap,
  type ClassConfig,
  type T1Biome,
} from "@mmo-idle/shared";
import type { NodeRef, Route, RouteStep } from "../route/types";

/**
 * The Squire's T1 balance route (`squire-t1`).
 *
 * The tier-0 quest, the class, then the Response rules in `auto` (the server
 * resolves the §8.13 default as each response is learned). Then the Clearing
 * set (the class's start weapon, the vest, the charm and the boots, as the
 * guide's opening crafts them), then every T1 zone in `T1_BIOME_ORDER`, farmed
 * to the level the Squire's tutorial finishes that zone at: the tier cap,
 * except the Mountain, which the guide farms only to the lesson level so Guard
 * is learned before the second seal. Each zone's gear is crafted and worn as
 * soon as its level unlocks it (weapon at the zone's first level, armor +1,
 * charm +2, boots +3), the pieces a Squire picks (`SQUIRE_T1_ZONE_GEAR`). Then
 * the Plains seal and the Mountain seal. Two seals promote to tier 2.
 *
 * The guide fights the Plains boss before the later zones, and it also fights
 * the Grave Toadeater. This route does not: it is the balance path to both
 * seals, not a beat-for-beat replay.
 */
export const SQUIRE_T1_ID = "squire-t1";

export const SQUIRE_CLASS_ROOT = "cooldown-root";

/**
 * The second level of a tier. The class kits call this `LESSON_ZONE_LEVEL`:
 * the zone's response, around minute 6, always before its boss.
 */
export const SQUIRE_LESSON_LEVEL = 2;

/** Where the Squire's tutorial stops farming a zone. */
export function squireTutorialFarmLevel(biome: T1Biome): number {
  return biome === "mountain" ? SQUIRE_LESSON_LEVEL : biomeLevelCap(1, biome);
}

const CLEARING: NodeRef = { kind: "node", nodeId: CLEARING_NODE_ID };

/** The Clearing set the guide's opening makes: the Squire's start weapon, then the shared vest, charm and boots. */
export const SQUIRE_CLEARING_SET = [
  "squire-plain-sword-and-shield-t1",
  "clearing-vest-t1",
  "clearing-charm-t1",
  "clearing-boots-t1",
] as const;

/**
 * What a Squire crafts and wears in each T1 zone, in unlock order. PLACEHOLDER picks
 * (OV-SQUIRE): every zone's armor and charm (each line answers that zone's threat,
 * bible §8.4), the heavier weapons (the slam is a swing, so attack sizes it; the light
 * Arming Sword is left for the Avenger at T2), boots only when faster.
 */
export const SQUIRE_T1_ZONE_GEAR: Record<T1Biome, readonly string[]> = {
  plains: ["squire-flanged-mace-t1", "plains-vest-t1", "plains-charm-t1", "plains-boots-t1"],
  forest: ["forest-vest-t1", "forest-charm-t1", "forest-boots-t1"],
  swamp: ["squire-spiked-flail-t1", "swamp-vest-t1", "swamp-charm-t1"],
  mountain: ["squire-warhammer-t1", "mountain-vest-t1"],
  cave: ["squire-tower-shield-t1", "cave-vest-t1", "cave-charm-t1"],
};

/** What the Squire wears into each seal (crafted earlier; equip only). PLACEHOLDER (OV-SQUIRE). */
export const SQUIRE_T1_SEAL_GEAR: Record<"plains" | "mountain", readonly string[]> = {
  plains: ["squire-warhammer-t1", "mountain-vest-t1", "cave-charm-t1"],
  mountain: ["squire-warhammer-t1", "mountain-vest-t1", "cave-charm-t1"],
};

/**
 * Sent once, right after the class pick. `auto` is rebuilt by the server as
 * lessons and trophies arrive; the empty rules are valid before any response
 * is learned, and the resolve step replaces them with the class default.
 */
const SQUIRE_AUTO: ClassConfig = {
  mode: "auto",
  relic: [],
  system: { kind: "responses", rules: [], groundTelegraphs: "step-out", holdSlam: [] },
};

function biomeRef(biome: T1Biome): NodeRef {
  return { kind: "biome", biomeGroup: biome, tier: 1, pick: "uncleared" };
}

/** The level a recipe unlocks at, read from the recipe itself. */
export function recipeLevel(recipeId: string): number {
  const recipe = RECIPE_DATABASE.get(recipeId);
  if (!recipe) throw new Error(`squire route: unknown recipe "${recipeId}"`);
  return recipe.requiredBiomeLevel;
}

/**
 * Farm a zone to `level`, crafting and wearing each piece of `gear` as soon as the
 * zone's level unlocks it. Pieces above `level` are left out (the zone never gets there).
 */
export function farmWearingGear(
  at: NodeRef,
  biomeGroup: string,
  level: number,
  gear: readonly string[],
  label: string,
): RouteStep[] {
  const steps: RouteStep[] = [];
  const pieces = gear
    .map((id) => ({ id, level: recipeLevel(id) }))
    .filter((piece) => piece.level <= level)
    .sort((a, b) => a.level - b.level);
  for (const piece of pieces) {
    steps.push(
      {
        type: "farm",
        at,
        until: { type: "biomeLevelAtLeast", biomeGroup, level: piece.level },
        label: `${label} to ${piece.level}`,
      },
      { type: "craft", recipeIds: [piece.id], farmAt: at, label: `craft ${piece.id}` },
      { type: "equip", definitionIds: [piece.id], label: `wear ${piece.id}` },
    );
  }
  steps.push({ type: "farm", at, until: { type: "biomeLevelAtLeast", biomeGroup, level }, label });
  return steps;
}

function farmZone(biome: T1Biome): RouteStep[] {
  return farmWearingGear(biomeRef(biome), biome, squireTutorialFarmLevel(biome), SQUIRE_T1_ZONE_GEAR[biome], `farm the ${biome}`);
}

export function squireT1Route(): Route {
  return {
    id: SQUIRE_T1_ID,
    version: "1.1.0",
    classRoot: SQUIRE_CLASS_ROOT,
    description:
      "Squire T1: the tier-0 quest, Response rules on auto, the Clearing set, every T1 zone wearing its gear as it unlocks, then the Plains and Mountain seals.",
    steps: [
      { type: "travel", to: CLEARING },
      {
        type: "farm",
        at: CLEARING,
        until: { type: "playerTierAtLeast", tier: 1 },
        label: "clear the tier-0 quest",
      },
      { type: "chooseClass", skillId: SQUIRE_CLASS_ROOT },
      { type: "classConfig", config: SQUIRE_AUTO },
      {
        type: "farm",
        at: CLEARING,
        until: { type: "biomeLevelAtLeast", biomeGroup: "clearing", level: recipeLevel("clearing-boots-t1") },
        label: "farm the Clearing set",
      },
      { type: "craft", recipeIds: [...SQUIRE_CLEARING_SET], farmAt: CLEARING, label: "craft the Clearing set" },
      { type: "equip", definitionIds: [...SQUIRE_CLEARING_SET], label: "wear the Clearing set" },
      ...T1_BIOME_ORDER.flatMap(farmZone),
      { type: "equip", definitionIds: [...SQUIRE_T1_SEAL_GEAR.plains], label: "wear the Plains seal gear" },
      { type: "attemptBoss", biomeGroup: "plains", tier: 1 },
      { type: "equip", definitionIds: [...SQUIRE_T1_SEAL_GEAR.mountain], label: "wear the Mountain seal gear" },
      { type: "attemptBoss", biomeGroup: "mountain", tier: 1 },
    ],
    completion: { type: "playerTierAtLeast", tier: 2 },
    milestones: [
      { id: "tier-1-reached", when: { type: "playerTierAtLeast", tier: 1 } },
      { id: "class-chosen", when: { type: "classSelected" } },
      { id: "clearing-set", when: { type: "hasItem", definitionId: "clearing-boots-t1" } },
      ...T1_BIOME_ORDER.map((biome) => ({
        id: `${biome}-farmed`,
        when: { type: "biomeLevelAtLeast" as const, biomeGroup: biome, level: squireTutorialFarmLevel(biome) },
      })),
      { id: "plains-seal", when: { type: "bossCleared", biomeGroup: "plains", tier: 1 } },
      { id: "mountain-seal", when: { type: "bossCleared", biomeGroup: "mountain", tier: 1 } },
    ],
  };
}
