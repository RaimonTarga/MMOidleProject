import type { EquippedRule } from "@mmo-idle/shared";
import type { Route, RouteStep } from "../route/types";
import {
  biome,
  clearingOpening,
  learnCleanse,
  learnExposeWeakness,
  learnSecondWind,
  learnSweep,
  maxOut,
  standardCompletion,
  standardMilestones,
} from "./t1Common";

export const T1_PROGRESSION_ORDER = [
  "plains",
  "forest",
  "swamp",
  "mountain",
  "cave",
] as const;

export const T1_BOSS_ORDER = [
  "plains",
  "forest",
  "mountain",
  "swamp",
  "cave",
] as const;

export type T1BiomeGroup = (typeof T1_PROGRESSION_ORDER)[number];
export type T1MovementProfile = "melee-chase" | "ranged-orbit" | "apprentice-chase";
export type T1BossDefenseProfile = "dodge-counterplay" | "brace-tank";

export interface T1BiomePlan {
  /** Gear/economy work that must happen before the biome's shared unlock. */
  beforeShared?: readonly RouteStep[];
  /** Gear/economy work after the shared unlock but before maxing the biome. */
  afterShared?: readonly RouteStep[];
  /** Gear/economy work once this biome is level 6. */
  afterMax?: readonly RouteStep[];
}

export type T1ProgressionPlan = Record<T1BiomeGroup, T1BiomePlan>;

export interface T1BossGearPlan {
  wornKit: readonly string[];
  armorByBoss: Record<T1BiomeGroup, string>;
  milestoneItems: readonly string[];
}

export interface T1RouteConfig {
  id: string;
  version: string;
  classRoot: string;
  /** The frame this route intends to spend the first post-T1 skill point on. */
  frameId?: string;
  description: string;
  movementProfile: T1MovementProfile;
  bossDefenseProfile: T1BossDefenseProfile;
  progression: T1ProgressionPlan;
  bossGear: T1BossGearPlan;
}

type RuneStage = "opening" | "hazards" | "step-back" | "final" | "final-no-step-back";

/**
 * The four controlled T1 movement profiles, expressed once.
 *
 * Rune arbitration is top-to-bottom within a channel. Step Back therefore has
 * to precede Chase/Orbit, while Avoid Hazards remains a separate PATHING rule.
 *
 * Recover First is paired with `always`, not `when-idle`: Out of Combat keys
 * off the post-combat grace timer, so the bot spent those seconds walking to
 * the next pull at whatever HP the last fight left it on. Always keys off
 * actual engagement — it holds the moment nothing is attacking, and releases
 * the instant something aggroes — and costs 1 RP instead of 2.
 */
export function controlledT1Runes(
  movementProfile: T1MovementProfile,
  defenseProfile: T1BossDefenseProfile,
  stage: RuneStage,
  braceEquipped = false,
): EquippedRule[] {
  const movementAction =
    (stage === "final" || stage === "final-no-step-back") && movementProfile === "ranged-orbit"
      ? "orbit"
      : "chase-enemy";
  const rules: EquippedRule[] = [
    { conditionId: "always", actionId: "auto-path-enemy" },
  ];

  if (defenseProfile === "dodge-counterplay" && (stage === "step-back" || stage === "final")) {
    rules.push({ conditionId: "inside-telegraph", actionId: "step-back" });
  }

  rules.push({ conditionId: "in-combat", actionId: movementAction });

  if (stage !== "opening") {
    rules.push({ conditionId: "always", actionId: "avoid-hazards" });
  }
  rules.push({ conditionId: "always", actionId: "wait-for-regen" });

  if (braceEquipped) {
    if (defenseProfile !== "brace-tank") {
      throw new Error("Brace's fire-guard Rune is only valid in the Brace-tank profile.");
    }
    rules.push({ conditionId: "target-casting", actionId: "fire-guard" });
  }

  return rules;
}

const DODGE_BOSS_ABILITIES: Record<
  T1BiomeGroup,
  { technique: string; guard: string }
> = {
  plains: { technique: "sweep", guard: "second-wind" },
  forest: { technique: "expose-weakness", guard: "second-wind" },
  mountain: { technique: "expose-weakness", guard: "second-wind" },
  swamp: { technique: "expose-weakness", guard: "cleanse" },
  cave: { technique: "expose-weakness", guard: "second-wind" },
};

const BRACE_BOSS_ABILITIES: Record<
  T1BiomeGroup,
  { technique: string; guard: string }
> = {
  ...DODGE_BOSS_ABILITIES,
  mountain: { technique: "expose-weakness", guard: "brace" },
  cave: { technique: "expose-weakness", guard: "brace" },
};

function biomeSharedSteps(config: T1RouteConfig, biomeGroup: T1BiomeGroup): RouteStep[] {
  switch (biomeGroup) {
    case "plains":
      return [learnSweep()];
    case "forest":
      return [learnSecondWind()];
    case "swamp":
      return [
        { type: "craftRune", recipeId: "rune-recipe-avoid-hazards", farmAt: biome("swamp") },
        {
          type: "configureRunes",
          rules: controlledT1Runes(
            config.movementProfile,
            config.bossDefenseProfile,
            "hazards",
          ),
          label: "add hazard-aware pathing and retain recovery",
        },
        learnCleanse(),
      ];
    case "mountain":
      if (config.bossDefenseProfile === "brace-tank") {
        if (config.movementProfile === "ranged-orbit") {
          throw new Error("The controlled Brace-tank experiment is melee-only.");
        }
        return [
          {
            type: "learnAbility",
            recipeId: "ability-recipe-brace",
            abilityId: "brace",
            slot: "guard",
            farmAt: biome("mountain"),
            label: "learn Brace for the tanking experiment",
          },
          {
            type: "configureRunes",
            rules: controlledT1Runes(
              config.movementProfile,
              config.bossDefenseProfile,
              "final",
              true,
            ),
            label: "arm Brace against charged attacks without Step Back",
          },
        ];
      }

      const steps: RouteStep[] = [
        {
          type: "setAbilities",
          techniques: ["sweep"],
          guards: ["second-wind"],
          label: "restore Second Wind for telegraph-dodge progression",
        },
        {
          type: "configureRunes",
          rules: controlledT1Runes(
            config.movementProfile,
            config.bossDefenseProfile,
            "hazards",
          ),
          label: "use available movement and recovery tools before Step Back",
        },
      ];

      if (config.movementProfile === "ranged-orbit") {
        steps.push(
          {
            type: "craftRune",
            recipeId: "rune-recipe-keep-distance",
            farmAt: biome("mountain"),
            label: "unlock Orbit at Mountain mastery 3",
          },
          {
            type: "configureRunes",
            rules: controlledT1Runes(
              config.movementProfile,
              config.bossDefenseProfile,
              "final-no-step-back",
            ),
            label: "use Orbit before Step Back is unlocked in Cave",
          },
        );
      }

      return steps;
    case "cave":
      if (config.bossDefenseProfile === "brace-tank") {
        return [learnExposeWeakness()];
      }

      return [
        {
          type: "craftRune",
          recipeId: "rune-recipe-step-back",
          farmAt: biome("cave"),
          label: "unlock Step Back at Cave mastery 2",
        },
        {
          type: "configureRunes",
          rules: controlledT1Runes(
            config.movementProfile,
            config.bossDefenseProfile,
            config.movementProfile === "ranged-orbit" ? "final" : "step-back",
          ),
          label: "put Step Back ahead of chase or Orbit",
        },
        learnExposeWeakness(),
      ];
  }
}

function bossSteps(config: T1RouteConfig): RouteStep[] {
  const abilities =
    config.bossDefenseProfile === "brace-tank"
      ? BRACE_BOSS_ABILITIES
      : DODGE_BOSS_ABILITIES;
  const steps: RouteStep[] = [];

  for (const biomeGroup of T1_BOSS_ORDER) {
    const loadout = abilities[biomeGroup];
    const braceEquipped = loadout.guard === "brace";
    steps.push(
      {
        type: "equip",
        definitionIds: [
          ...config.bossGear.wornKit,
          config.bossGear.armorByBoss[biomeGroup],
        ],
      },
      {
        type: "setAbilities",
        techniques: [loadout.technique],
        guards: [loadout.guard],
      },
      {
        type: "configureRunes",
        rules: controlledT1Runes(
          config.movementProfile,
          config.bossDefenseProfile,
          "final",
          braceEquipped,
        ),
        label: `configure controlled ${loadout.guard} profile for ${biomeGroup}`,
      },
      { type: "attemptBoss", biomeGroup, tier: 1, maxAttempts: 6 },
      {
        type: "milestone",
        id: `${biomeGroup}-boss-cleared`,
        requires: { type: "bossCleared", biomeGroup, tier: 1 },
      },
    );
    // The second T1 seal advances the player to T2 and grants the point for
    // the frame. Keep this in the route data so an intended frame cannot be
    // silently replaced by whatever the fresh character happens to select.
    if (biomeGroup === "forest" && config.frameId) {
      steps.push({
        type: "unlockSkill",
        skillId: config.frameId,
        label: `spend the T2 point on ${config.frameId}`,
        requires: { type: "bossCleared", biomeGroup, tier: 1 },
      });
    }
  }

  return steps;
}

/** Generate a controlled T1 route from progression/gear data plus shared semantics. */
export function makeT1Route(config: T1RouteConfig): Route {
  const steps: RouteStep[] = [
    ...clearingOpening(
      config.classRoot,
      controlledT1Runes(
        config.movementProfile,
        config.bossDefenseProfile,
        "opening",
      ),
    ),
  ];

  for (const biomeGroup of T1_PROGRESSION_ORDER) {
    const plan = config.progression[biomeGroup];
    steps.push(
      { type: "travel", to: biome(biomeGroup) },
      ...(plan.beforeShared ?? []),
      ...biomeSharedSteps(config, biomeGroup),
      ...(plan.afterShared ?? []),
      maxOut(biomeGroup),
    );
    if (biomeGroup === "cave") {
      steps.push({ type: "milestone", id: "all-biomes-maxed" });
    }
    steps.push(...(plan.afterMax ?? []));
    if (biomeGroup !== "cave") {
      steps.push({ type: "milestone", id: `${biomeGroup}-maxed` });
    }
  }

  steps.push(...bossSteps(config));

  return {
    id: config.id,
    version: config.version,
    classRoot: config.classRoot,
    frameId: config.frameId,
    description: config.description,
    steps,
    completion: standardCompletion(),
    milestones: standardMilestones(config.bossGear.milestoneItems),
  };
}
