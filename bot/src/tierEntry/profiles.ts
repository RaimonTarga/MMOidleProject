import {
  NODE_BIOMES,
  RECIPE_DATABASE,
  biomeXpForBiomeLevel,
  emptyEquipment,
  emptyEquippedAbilities,
  emptyEquippedRites,
  emptyEquippedStances,
  type EquipmentMap,
  type TierEntryProfile,
} from "@mmo-idle/shared";
import { T1_BASELINE_ROUTES } from "../routes/t1Baselines";
import type { Route, RouteStep } from "../route/types";
import { entryWallet, type EntryEconomyMode } from "./economy";

const T1_BIOMES = ["plains", "forest", "swamp", "mountain", "cave"] as const;

/** `biomeLevelCap(_, "clearing")` is a hard 4; the starter set needs all of it. */
const CLEARING_MAX_LEVEL = 4;

const FRAME_BY_ROOT: Record<string, string> = {
  "cadence-root": "cadence-balanced",
  "cooldown-root": "cooldown-heavy",
  "reload-root": "reload-heavy",
  "energy-root": "energy-heavy",
  "dot-root": "dot-balanced",
  "summoner-root": "summoner-balanced",
};

function allSteps(route: Route): RouteStep[] {
  const out: RouteStep[] = [];
  const visit = (steps: readonly RouteStep[]): void => {
    for (const step of steps) {
      out.push(step);
      if (step.type === "repeatUntil" || step.type === "ifPossible") visit(step.steps);
    }
  };
  visit(route.steps);
  return out;
}

function finalEquipment(steps: readonly RouteStep[]): EquipmentMap {
  const equipment = emptyEquipment();
  for (const step of steps) {
    if (step.type !== "equip") continue;
    for (const definitionId of step.definitionIds) {
      const recipe = RECIPE_DATABASE.get(definitionId);
      if (!recipe) continue;
      equipment[recipe.slot] = definitionId;
    }
  }
  return equipment;
}

function buildProfile(route: Route, economy: EntryEconomyMode): TierEntryProfile {
  const frameId = route.frameId ?? FRAME_BY_ROOT[route.classRoot];
  if (!frameId) throw new Error(`${route.id}: no tier-entry frame declaration`);

  const steps = allSteps(route);
  const craftedItems = new Set(
    steps.flatMap((step) => (step.type === "craft" ? step.recipeIds : [])),
  );
  const equipment = finalEquipment(steps);
  const equippedItems = new Set(Object.values(equipment).filter((id): id is string => !!id));
  const learnedAbilities = [
    ...new Set(
      steps
        .filter((step): step is Extract<RouteStep, { type: "learnAbility" }> => step.type === "learnAbility")
        .map((step) => step.abilityId),
    ),
  ];
  const lastAbilities = [...steps]
    .reverse()
    .find((step): step is Extract<RouteStep, { type: "setAbilities" }> => step.type === "setAbilities");
  const lastRunes = [...steps]
    .reverse()
    .find((step): step is Extract<RouteStep, { type: "configureRunes" }> => step.type === "configureRunes");
  const itemUpgrades: Record<string, number> = {};
  for (const step of steps) {
    if (step.type !== "upgrade") continue;
    itemUpgrades[step.definitionId] = Math.max(itemUpgrades[step.definitionId] ?? 0, step.toPlus);
  }

  const t1Nodes = Object.entries(NODE_BIOMES)
    .filter(([, info]) => T1_BIOMES.includes(info.biomeGroup as (typeof T1_BIOMES)[number]) && info.biomeTier === 1)
    .map(([id, info]) => ({ id, kind: info.kind }));

  const wallet = entryWallet(economy);

  return {
    id: `${route.id}-t2-entry-${economy}`,
    targetTier: 2,
    classRoot: route.classRoot,
    frameId,
    spawnNodeId: "node-t2-sanctuary",
    economyPolicy: "synthetic-combat-progression",
    wallet: {
      essences: { ...wallet.essences },
      catalysts: { ...wallet.catalysts },
      catalystProgress: {},
    },
    // The wallet is a labelled MODEL (see economy.ts); progression state below is
    // an explicit T1-complete manifest derived from the canonical route source.
    level: 0,
    // ZERO IS CORRECT, and it is the whole reason there are six T2-entry
    // templates rather than eighteen. Skill points are minted one per TIER
    // advance (`advanceTier` in questSystem.ts), and `canUnlockSkill` requires
    // `node.tier === currentSkillTier`, so the skill-tree tier a character can
    // afford is always `playerTier - 1`:
    //     playerTier 1 (tier-0 quest)  -> buys the tier-0 class ROOT
    //     playerTier 2 (2 T1 seals)    -> buys the tier-1 FRAME
    //     playerTier 3 (3 T2 seals)    -> buys the tier-2 RANGE node
    // A character standing at the START of Tier 2 has therefore already spent
    // its point on the frame and has NO branch, and no way to buy one until it
    // has cleared three T2 bosses. See `t3Entry.ts` for the branched checkpoint
    // and docs/t2-bot-testing-infrastructure.md for the full argument.
    skillPoints: 0,
    currentSkillTier: 2,
    // The Clearing is part of the manifest even though `globalMastery()` excludes
    // it: every canonical T1 route farms it to level 4 for the starter set (the
    // Soft Boots recipe gates at clearing 4), and a template that owns those four
    // items while declaring no Clearing mastery is describing a character whose
    // own gear was never craftable. It contributes 0 GM, so adding it changes no
    // rune budget and no upgrade ceiling -- only legality.
    biomeLevels: {
      ...Object.fromEntries(T1_BIOMES.map((group) => [group, 6])),
      clearing: CLEARING_MAX_LEVEL,
    },
    biomeXP: {
      ...Object.fromEntries(T1_BIOMES.map((group) => [group, biomeXpForBiomeLevel(group, 6)])),
      clearing: biomeXpForBiomeLevel("clearing", CLEARING_MAX_LEVEL),
    },
    bossesCleared: T1_BIOMES.map((group) => `${group}:1`),
    clearedNodes: t1Nodes.filter(({ kind }) => kind === "normal").map(({ id }) => id),
    visitedNodes: t1Nodes.map(({ id }) => id),
    questProgress: { "tier-0": 10, "tier-1": 1 },
    inventory: [...craftedItems].filter((id) => !equippedItems.has(id)),
    equipment,
    itemUpgrades,
    knownAbilities: learnedAbilities,
    equippedAbilities: lastAbilities
      ? { techniques: [...lastAbilities.techniques], guards: [...lastAbilities.guards] }
      : emptyEquippedAbilities(),
    runeRecipesCrafted: [
      ...new Set(
        steps
          .filter((step): step is Extract<RouteStep, { type: "craftRune" }> => step.type === "craftRune")
          .map((step) => step.recipeId),
      ),
    ],
    runesEquipped: lastRunes?.rules.map((rule) => ({ ...rule })) ?? [],
    knownStances: [],
    equippedStances: emptyEquippedStances(),
    knownRites: [],
    equippedRites: emptyEquippedRites(),
  };
}

/**
 * One profile per (canonical T1 class baseline x entry-economy mode).
 *
 * The two modes share byte-identical permanent progression and differ ONLY in
 * the wallet, which is what makes them a usable control pair: any difference
 * between a `-clean` and a `-natural` run is attributable to carryover economy
 * and nothing else.
 */
export const ENTRY_ECONOMY_MODES: readonly EntryEconomyMode[] = [
  "clean",
  "natural",
  "catalyst-primed",
];

export const TIER_ENTRY_PROFILES = new Map<string, TierEntryProfile>(
  T1_BASELINE_ROUTES.flatMap((route) =>
    ENTRY_ECONOMY_MODES.map((economy) => {
      const profile = buildProfile(route, economy);
      return [profile.id, profile] as const;
    }),
  ),
);

/** The T2-entry profile id for a class root and economy mode. */
export function t2EntryProfileId(classRoot: string, economy: EntryEconomyMode): string {
  const route = T1_BASELINE_ROUTES.find((r) => r.classRoot === classRoot);
  if (!route) throw new Error(`no canonical T1 baseline route for class root "${classRoot}"`);
  return `${route.id}-t2-entry-${economy}`;
}

export function requireTierEntryProfile(id: string): TierEntryProfile {
  const profile = TIER_ENTRY_PROFILES.get(id);
  if (!profile) {
    throw new Error(
      `unknown tier-entry profile "${id}" (have: ${[...TIER_ENTRY_PROFILES.keys()].join(", ")})`,
    );
  }
  return profile;
}
