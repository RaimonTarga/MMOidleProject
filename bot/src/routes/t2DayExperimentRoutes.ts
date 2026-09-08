import { RECIPE_DATABASE } from "@mmo-idle/shared";
import type { Route } from "../route/types";
import {
  makeT2Route,
  type T2RouteConfig,
  type T2TreatmentAssertion,
} from "./t2RouteBuilder";
import {
  T2_CLASS_PLANS,
  type T2BiomePlan,
  type T2ClassPlan,
} from "./t2GearPlans";
import { type T2BiomeGroup } from "./t2Common";

/**
 * Day-experiment routes are deliberately narrow tails over sealed checkpoints.
 * They do not change shared combat or reward data; every treatment difference is
 * visible in the route id and re-checked against the live PlayerView.
 */
interface DayPlanPatch {
  frameId?: string;
  hypothesis?: string;
  biomes?: Partial<Record<T2BiomeGroup, T2BiomePlan>>;
  techniqueOverrides?: Partial<Record<T2BiomeGroup, string>>;
  guardOverrides?: Partial<Record<T2BiomeGroup, string>>;
  stanceOverrides?: Partial<Record<T2BiomeGroup, string | null>>;
  farmCoreOverrides?: Partial<Record<T2BiomeGroup, string | null>>;
}

function basePlan(slug: string): T2ClassPlan {
  const plan = T2_CLASS_PLANS.find((candidate) => candidate.slug === slug);
  if (!plan) throw new Error(`T2 day experiment base plan missing: ${slug}`);
  return plan;
}

function variantPlan(base: T2ClassPlan, patch: DayPlanPatch): T2ClassPlan {
  return {
    ...base,
    frameId: patch.frameId ?? base.frameId,
    hypothesis: patch.hypothesis ? `${base.hypothesis} Day experiment: ${patch.hypothesis}` : base.hypothesis,
    biomes: patch.biomes ? { ...base.biomes, ...patch.biomes } : base.biomes,
    techniqueOverrides: patch.techniqueOverrides
      ? { ...base.techniqueOverrides, ...patch.techniqueOverrides }
      : base.techniqueOverrides,
    guardOverrides: patch.guardOverrides
      ? { ...base.guardOverrides, ...patch.guardOverrides }
      : base.guardOverrides,
    stanceOverrides: patch.stanceOverrides
      ? { ...base.stanceOverrides, ...patch.stanceOverrides }
      : base.stanceOverrides,
    farmCoreOverrides: patch.farmCoreOverrides
      ? { ...base.farmCoreOverrides, ...patch.farmCoreOverrides }
      : base.farmCoreOverrides,
  };
}

type WeaponPolicy = { adopt?: string; craftOnly?: string; skip?: string; reason?: string };

/** Replace only the weapon decision while preserving the rest of a biome plan. */
function weaponPolicy(base: T2ClassPlan, group: T2BiomeGroup, policy: WeaponPolicy): T2BiomePlan {
  const current = base.biomes[group] ?? {};
  const isWeapon = (id: string): boolean => RECIPE_DATABASE.get(id)?.slot === "weapon";
  const adopt = (current.adopt ?? []).filter((id) => !isWeapon(id));
  const craftOnly = (current.craftOnly ?? []).filter((id) => !isWeapon(id));
  const skip = Object.fromEntries(
    Object.entries(current.skip ?? {}).filter(([id]) => !isWeapon(id)),
  ) as Record<string, string>;
  if (policy.adopt) adopt.push(policy.adopt);
  if (policy.craftOnly) craftOnly.push(policy.craftOnly);
  if (policy.skip) skip[policy.skip] = policy.reason ?? "Day experiment weapon arm";
  return { ...current, adopt, craftOnly, skip };
}

function withoutLearn(plan: T2ClassPlan, group: T2BiomeGroup): T2BiomePlan {
  return { ...(plan.biomes[group] ?? {}), learn: undefined };
}

const J0_WEAPON: Record<string, string> = {
  striker: "ruinous-axe",
  squire: "quake-hammer",
  apprentice: "swamp-mirebrand",
  slinger: "gale-needle",
  spirit: "ruinous-axe",
  conduit: "ruinous-axe",
};

function j0Weapon(slug: string): string {
  const weapon = J0_WEAPON[slug];
  if (!weapon) throw new Error(`no sealed J0 weapon for ${slug}`);
  return weapon;
}

function entryKnownAbilities(slug: string): string[] {
  return [
    "sweep",
    "expose-weakness",
    "second-wind",
    "cleanse",
    ...(slug === "apprentice" || slug === "slinger" ? ["contagion"] : []),
  ];
}

function abilityChecks(abilityId: string, label: string): T2TreatmentAssertion[] {
  return [
    {
      condition: { type: "abilityKnown", abilityId },
      message: `${label}: ${abilityId} is unlocked`,
    },
    {
      condition: { type: "abilityEquipped", abilityId },
      message: `${label}: ${abilityId} is equipped`,
    },
  ];
}

function treatmentChecks(
  plan: T2ClassPlan,
  weaponId: string,
  coreId: string,
  techniqueId: string,
  guardId = "second-wind",
): T2TreatmentAssertion[] {
  return [
    {
      condition: { type: "frameSelected", frameId: plan.frameId },
      message: `live frame is ${plan.frameId}`,
    },
    {
      condition: { type: "equipped", definitionId: weaponId },
      message: `expected weapon ${weaponId} is equipped`,
    },
    {
      condition: { type: "equipped", definitionId: coreId },
      message: `expected core ${coreId} is equipped`,
    },
    ...abilityChecks(techniqueId, "treatment technique"),
    ...abilityChecks(guardId, "defensive ability"),
  ];
}

function j0PreparationChecks(plan: T2ClassPlan, weaponId: string): T2TreatmentAssertion[] {
  return treatmentChecks(plan, weaponId, "core-tempered", "expose-weakness");
}

type DayRouteConfig = Omit<T2RouteConfig, "branch" | "version" | "bossless">;

function route(config: DayRouteConfig): Route {
  return makeT2Route({
    branch: "mid",
    version: "day-2026-09-08-1.0.0",
    bossless: true,
    ...config,
  });
}

function j0CheckpointRoute(
  base: T2ClassPlan,
  routeId: string,
  plan: T2ClassPlan,
): Route {
  return route({
    plan,
    routeId,
    stopAfter: "cave",
    checkpointKind: "j0",
    terminalAssertions: j0PreparationChecks(plan, j0Weapon(base.slug)),
  });
}

/** Repeated identical J0 source routes. Apprentice and Slinger also pre-learn Contagion. */
export const T2_DAY_J0_CHECKPOINT_ROUTES: readonly Route[] = T2_CLASS_PLANS.map((base) => {
  const plan = ["apprentice", "slinger"].includes(base.slug)
    ? variantPlan(base, {
        biomes: {
          swamp: {
            ...(base.biomes.swamp ?? {}),
            learn: {
              recipeId: "ability-recipe-contagion",
              abilityId: "contagion",
              slot: "technique",
            },
          },
        },
        hypothesis: "pre-learn Contagion in Swamp so the Jungle DoT A/B changes only its equipped Technique",
      })
    : base;
  return j0CheckpointRoute(base, `${base.slug}-t2-day-checkpoint-j0`, plan);
});

/** Optional practical J3 checkpoint: Apprentice reaches Jungle level 5 and learns Bramble Guard. */
export const T2_DAY_J3_CHECKPOINT_ROUTES: readonly Route[] = [
  (() => {
    const base = basePlan("apprentice");
    const plan = base;
    return route({
      plan,
      routeId: "apprentice-t2-day-checkpoint-j3",
      startAfter: "cave",
      stopAfter: "jungle",
      checkpointKind: "j3",
      entryCheckpointKind: "j0",
      checkpointLevel: 5,
      entryAssertions: j0PreparationChecks(plan, j0Weapon(base.slug)),
      entryItems: [j0Weapon(base.slug), "core-tempered"],
      entryKnownAbilities: entryKnownAbilities(base.slug),
    });
  })(),
];

/** D0 is the same J0-to-Jungle tail for the four Survivalist comparison classes. */
export const T2_DAY_D0_CHECKPOINT_ROUTES: readonly Route[] = ["squire", "apprentice", "conduit", "spirit"].map((slug) => {
  const base = basePlan(slug);
  return route({
    plan: base,
    routeId: `${slug}-t2-day-checkpoint-d0`,
    startAfter: "cave",
    stopAfter: "jungle",
    checkpointKind: "d0",
    entryCheckpointKind: "j0",
    entryAssertions: j0PreparationChecks(base, j0Weapon(slug)),
    entryItems: [j0Weapon(slug), "core-tempered"],
    entryKnownAbilities: entryKnownAbilities(slug),
    terminalAssertions: [
      {
        condition: { type: "frameSelected", frameId: base.frameId },
        message: `live frame is ${base.frameId}`,
      },
      {
        condition: { type: "hasItem", definitionId: "core-survivalist" },
        message: "Survivalist is legally acquired before Desert",
      },
      {
        condition: { type: "equipped", definitionId: "core-tempered" },
        message: "Tempered remains the farming core at D0",
      },
      {
        condition: { type: "equipped", definitionId: j0Weapon(slug) },
        message: `J0 weapon ${j0Weapon(slug)} remains equipped at D0`,
      },
      ...abilityChecks("sweep", "Jungle technique"),
      ...abilityChecks("second-wind", "defensive ability"),
    ],
  });
});

const FRAME_VARIANTS: readonly [string, readonly string[]][] = [
  ["striker", ["cadence-light", "cadence-balanced", "cadence-heavy"]],
  ["squire", ["cooldown-light", "cooldown-balanced", "cooldown-heavy"]],
  ["conduit", ["summoner-light", "summoner-balanced", "summoner-heavy"]],
];

function jungleTailRoute(
  base: T2ClassPlan,
  routeId: string,
  plan: T2ClassPlan,
  initialEquip: readonly string[],
  terminalAssertions: readonly T2TreatmentAssertion[],
): Route {
  return route({
    plan,
    routeId,
    startAfter: "cave",
    stopAfter: "jungle",
    initialEquip,
    entryCheckpointKind: "j0",
    entryAssertions: j0PreparationChecks(base, j0Weapon(base.slug)),
    terminalAssertions,
    captureTier2Handoff: false,
    entryItems: [...new Set([j0Weapon(base.slug), "core-tempered", ...initialEquip])],
    entryKnownAbilities: entryKnownAbilities(base.slug),
  });
}

export const T2_DAY_FRAME_ROUTES: readonly Route[] = FRAME_VARIANTS.flatMap(([slug, frames]) => {
  const base = basePlan(slug);
  return frames.map((frameId) => {
    const plan = variantPlan(base, { frameId, hypothesis: `${frameId} frame arm` });
    return jungleTailRoute(
      base,
      `${slug}-t2-jungle-frame-${frameId.split("-").at(-1)}`,
      plan,
      [j0Weapon(slug)],
      treatmentChecks(plan, j0Weapon(slug), "core-tempered", "sweep"),
    );
  });
});

const WEAPON_ARMS: readonly [string, string][] = [
  ["apprentice", "swamp-mirebrand"],
  ["apprentice", "quake-hammer"],
  ["spirit", "gale-needle"],
  ["spirit", "ruinous-axe"],
  ["squire", "quake-hammer"],
  ["squire", "ruinous-axe"],
  ["conduit", "ruinous-axe"],
  ["conduit", "quake-hammer"],
];

export const T2_DAY_WEAPON_ROUTES: readonly Route[] = WEAPON_ARMS.map(([slug, weaponId]) => {
  const base = basePlan(slug);
  const plan = variantPlan(base, {
    biomes: { jungle: weaponPolicy(base, "jungle", { adopt: weaponId }) },
    hypothesis: `Jungle weapon arm ${weaponId}`,
  });
  return jungleTailRoute(
    base,
    `${slug}-t2-jungle-weapon-${weaponId}`,
    plan,
    [weaponId],
    treatmentChecks(plan, weaponId, "core-tempered", "sweep"),
  );
});

function contagionPlan(base: T2ClassPlan, techniqueId: "sweep" | "contagion"): T2ClassPlan {
  let jungle = weaponPolicy(base, "jungle", { adopt: "swamp-mirebrand" });
  jungle = { ...jungle, learn: undefined };
  return variantPlan(base, {
    biomes: { jungle },
    techniqueOverrides: { jungle: techniqueId },
    hypothesis: `same DoT weapon with Jungle Technique ${techniqueId}`,
  });
}

function contagionChecks(
  plan: T2ClassPlan,
  techniqueId: "sweep" | "contagion",
): T2TreatmentAssertion[] {
  return [
    ...treatmentChecks(plan, "swamp-mirebrand", "core-tempered", techniqueId),
    {
      condition: { type: "equippedWeaponWithDot" },
      message: "required spreadable DoT weapon is equipped",
    },
  ];
}

export const T2_DAY_CONTAGION_ROUTES: readonly Route[] = ["apprentice", "slinger"].flatMap((slug) => {
  const base = basePlan(slug);
  return (["sweep", "contagion"] as const).map((techniqueId) => {
    const plan = contagionPlan(base, techniqueId);
    return jungleTailRoute(
      base,
      `${slug}-t2-jungle-contagion-${techniqueId}`,
      plan,
      ["swamp-mirebrand"],
      contagionChecks(plan, techniqueId),
    );
  });
});

const SURVIVALIST_CLASSES = ["squire", "apprentice", "conduit", "spirit"] as const;

export const T2_DAY_SURVIVALIST_ROUTES: readonly Route[] = SURVIVALIST_CLASSES.flatMap((slug) => {
  const base = basePlan(slug);
  return (["core-tempered", "core-survivalist"] as const).map((coreId) => {
    const plan = variantPlan(base, {
      farmCoreOverrides: { desert: coreId },
      hypothesis: `Desert core arm ${coreId}`,
    });
    return route({
      plan,
      routeId: `${slug}-t2-desert-core-${coreId.replace("core-", "")}`,
      startAfter: "jungle",
      stopAfter: "desert",
      entryCheckpointKind: "d0",
      initialEquip: [coreId],
      skipCoreIds: ["core-force"],
      entryAssertions: treatmentChecks(base, j0Weapon(slug), "core-tempered", "sweep"),
      terminalAssertions: treatmentChecks(plan, j0Weapon(slug), coreId, "expose-weakness"),
      captureTier2Handoff: false,
      entryItems: [j0Weapon(slug), "core-tempered", "core-survivalist"],
      entryKnownAbilities: entryKnownAbilities(slug),
    });
  });
});

export const T2_DAY_EXPERIMENT_ROUTES: readonly Route[] = [
  ...T2_DAY_J0_CHECKPOINT_ROUTES,
  ...T2_DAY_J3_CHECKPOINT_ROUTES,
  ...T2_DAY_D0_CHECKPOINT_ROUTES,
  ...T2_DAY_FRAME_ROUTES,
  ...T2_DAY_WEAPON_ROUTES,
  ...T2_DAY_CONTAGION_ROUTES,
  ...T2_DAY_SURVIVALIST_ROUTES,
];

export const T2_DAY_EXPERIMENT_ROUTE_IDS: readonly string[] = T2_DAY_EXPERIMENT_ROUTES.map((route) => route.id);
