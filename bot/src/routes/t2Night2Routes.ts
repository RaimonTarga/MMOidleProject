import { RECIPE_DATABASE } from "@mmo-idle/shared";
import type { Route } from "../route/types";
import {
  T2_CLASS_PLANS,
  type T2BiomePlan,
  type T2ClassPlan,
} from "./t2GearPlans";
import { makeT2Route } from "./t2RouteBuilder";
import { type T2BiomeGroup } from "./t2Common";

type FrameId =
  | "cadence-light"
  | "cadence-heavy"
  | "cooldown-light"
  | "cooldown-heavy"
  | "dot-light"
  | "dot-heavy"
  | "reload-light"
  | "reload-heavy"
  | "energy-light"
  | "energy-heavy"
  | "summoner-light"
  | "summoner-heavy";

interface Night2Patch {
  routeId: string;
  frameId?: FrameId;
  hypothesis: string;
  biomes?: Partial<Record<T2BiomeGroup, T2BiomePlan>>;
  techniqueOverrides?: Partial<Record<T2BiomeGroup, string>>;
  guardOverrides?: Partial<Record<T2BiomeGroup, string>>;
  stanceOverrides?: Partial<Record<T2BiomeGroup, string | null>>;
  farmCoreOverrides?: Partial<Record<T2BiomeGroup, string | null>>;
}

function basePlan(slug: string): T2ClassPlan {
  const plan = T2_CLASS_PLANS.find((candidate) => candidate.slug === slug);
  if (!plan) throw new Error(`Night 2 base plan missing: ${slug}`);
  return plan;
}

function variantPlan(base: T2ClassPlan, patch: Night2Patch): T2ClassPlan {
  return {
    ...base,
    frameId: patch.frameId ?? base.frameId,
    hypothesis: `${base.hypothesis} Night 2 arm: ${patch.hypothesis}`,
    biomes: { ...base.biomes, ...patch.biomes },
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

function night2Route(base: T2ClassPlan, patch: Night2Patch): Route {
  return makeT2Route({
    plan: variantPlan(base, patch),
    branch: "mid",
    version: "night2-1.0.0",
    bossless: true,
    routeId: patch.routeId,
  });
}

function biomeWith(base: T2ClassPlan, group: T2BiomeGroup, patch: T2BiomePlan): T2BiomePlan {
  return { ...(base.biomes[group] ?? {}), ...patch };
}

type WeaponPolicy = {
  adopt?: string;
  craftOnly?: string;
  skip?: string;
  reason?: string;
};

/** Replace only the weapon decision while preserving that leg's armor/charm/boots. */
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
  if (policy.skip) skip[policy.skip] = policy.reason ?? "Night 2 weapon-policy challenger";

  return {
    ...current,
    adopt,
    craftOnly,
    skip,
  };
}

function learnContagion(base: T2ClassPlan, group: T2BiomeGroup): T2BiomePlan {
  return biomeWith(base, group, {
    learn: {
      recipeId: "ability-recipe-contagion",
      abilityId: "contagion",
      slot: "technique",
    },
  });
}

function learnBramble(base: T2ClassPlan): T2BiomePlan {
  return biomeWith(base, "jungle", {
    learn: {
      recipeId: "ability-recipe-bramble-guard",
      abilityId: "bramble-guard",
      slot: "guard",
    },
  });
}

const FRAME_VARIANTS: readonly [string, FrameId][] = [
  ["striker", "cadence-light"],
  ["striker", "cadence-heavy"],
  ["squire", "cooldown-light"],
  ["squire", "cooldown-heavy"],
  ["apprentice", "dot-light"],
  ["apprentice", "dot-heavy"],
  ["slinger", "reload-light"],
  ["slinger", "reload-heavy"],
  ["spirit", "energy-light"],
  ["spirit", "energy-heavy"],
  ["conduit", "summoner-light"],
  ["conduit", "summoner-heavy"],
];

/** Wave B: frame is the independent variable; corrected control gear stays fixed. */
export const T2_NIGHT2_FRAME_ROUTES: readonly Route[] = FRAME_VARIANTS.map(([slug, frameId]) =>
  night2Route(basePlan(slug), {
    routeId: `${slug}-t2-frame-${frameId.endsWith("-light") ? "light" : "heavy"}`,
    frameId,
    hypothesis: `same corrected control route with the ${frameId} frame; hold gear and biome policy fixed`,
  }),
);

const striker = basePlan("striker");
const squire = basePlan("squire");
const apprentice = basePlan("apprentice");
const slinger = basePlan("slinger");
const spirit = basePlan("spirit");
const conduit = basePlan("conduit");

/** Wave C: one major weapon-policy challenger per class. */
export const T2_NIGHT2_WEAPON_ROUTES: readonly Route[] = [
  night2Route(striker, {
    routeId: "striker-t2-weapon-ruinous-only",
    hypothesis: "remove the Forest fast-weapon adoption and measure the Cave Ruinous Axe path",
    biomes: { forest: weaponPolicy(striker, "forest", { craftOnly: "gale-needle" }) },
  }),
  night2Route(squire, {
    routeId: "squire-t2-weapon-ruinous-axe",
    hypothesis: "replace the Mountain Quake Hammer adoption with the Cave Ruinous Axe",
    biomes: {
      mountain: weaponPolicy(squire, "mountain", { craftOnly: "quake-hammer" }),
      cave: weaponPolicy(squire, "cave", { adopt: "ruinous-axe" }),
    },
  }),
  night2Route(apprentice, {
    routeId: "apprentice-t2-weapon-quake-hammer",
    hypothesis: "replace the Cave-only weapon timing with an adopted Mountain Quake Hammer",
    biomes: { mountain: weaponPolicy(apprentice, "mountain", { adopt: "quake-hammer" }) },
  }),
  night2Route(slinger, {
    routeId: "slinger-t2-weapon-venom-knife",
    hypothesis: "keep Venom Knife through Jungle instead of the fast Stinger Rapier",
    biomes: {
      swamp: weaponPolicy(slinger, "swamp", { adopt: "swamp-mirebrand" }),
      jungle: weaponPolicy(slinger, "jungle", {
        skip: "jungle-stinger-rapier",
        reason: "weapon challenger keeps the DoT weapon equipped for the Jungle comparison",
      }),
    },
  }),
  night2Route(spirit, {
    routeId: "spirit-t2-weapon-ruinous-only",
    hypothesis: "remove the Forest fast-weapon adoption and measure the Cave Ruinous Axe path",
    biomes: { forest: weaponPolicy(spirit, "forest", { craftOnly: "gale-needle" }) },
  }),
  night2Route(conduit, {
    routeId: "conduit-t2-weapon-fast-onhit",
    hypothesis: "replace the Cave Axe end state with the legal Jungle fast/on-hit Stinger Rapier",
    biomes: {
      cave: weaponPolicy(conduit, "cave", { craftOnly: "ruinous-axe" }),
      jungle: weaponPolicy(conduit, "jungle", { adopt: "jungle-stinger-rapier" }),
    },
  }),
];

/** Wave D: small, deliberately targeted Jungle/Technique/Core treatments. */
export const T2_NIGHT2_SYSTEM_ROUTES: readonly Route[] = [
  night2Route(apprentice, {
    routeId: "apprentice-t2-jungle-contagion",
    hypothesis: "Contagion replaces Sweep in Jungle while the class's own burn DoT remains available",
    biomes: { swamp: learnContagion(apprentice, "swamp") },
    techniqueOverrides: { jungle: "contagion" },
  }),
  night2Route(slinger, {
    routeId: "slinger-t2-jungle-contagion-venom",
    hypothesis: "Contagion plus retained Venom Knife tests the intended weapon-supplied DoT interaction",
    biomes: {
      swamp: learnContagion(slinger, "swamp"),
      jungle: weaponPolicy(slinger, "jungle", {
        skip: "jungle-stinger-rapier",
        reason: "retain Venom Knife so Contagion has a real weapon-supplied DoT source",
      }),
    },
    techniqueOverrides: { jungle: "contagion" },
  }),
  night2Route(striker, {
    routeId: "striker-t2-jungle-safe-policy",
    hypothesis: "defensive stance, Bramble Guard and Survivalist test whether Jungle is a survival-policy wall",
    biomes: { jungle: learnBramble(striker) },
    guardOverrides: { jungle: "bramble-guard" },
    stanceOverrides: { jungle: "defensive-stance" },
  }),
  night2Route(squire, {
    routeId: "squire-t2-jungle-tempered-safe",
    hypothesis: "keep Tempered instead of Survivalist with defensive stance and Bramble Guard in Jungle",
    biomes: { jungle: learnBramble(squire) },
    guardOverrides: { jungle: "bramble-guard" },
    stanceOverrides: { jungle: "defensive-stance" },
    farmCoreOverrides: { jungle: "core-tempered" },
  }),
  night2Route(conduit, {
    routeId: "conduit-t2-jungle-tempered-safe",
    hypothesis: "Conduit defensive-policy probe: Tempered, defensive stance and Bramble Guard",
    biomes: { jungle: learnBramble(conduit) },
    guardOverrides: { jungle: "bramble-guard" },
    stanceOverrides: { jungle: "defensive-stance" },
    farmCoreOverrides: { jungle: "core-tempered" },
  }),
  night2Route(spirit, {
    routeId: "spirit-t2-desert-tempered-core",
    hypothesis: "keep Tempered in Desert instead of switching to Force",
    farmCoreOverrides: { desert: "core-tempered" },
  }),
];

/** One equivalent Spirit rerun for the first repeatability check. */
export const T2_NIGHT2_REPEAT_ROUTES: readonly Route[] = [
  night2Route(spirit, {
    routeId: "spirit-t2-repeat-control",
    hypothesis: "equivalent corrected Balanced control replicate for repeatability",
  }),
];

export const T2_NIGHT2_ROUTES: readonly Route[] = [
  ...T2_NIGHT2_FRAME_ROUTES,
  ...T2_NIGHT2_WEAPON_ROUTES,
  ...T2_NIGHT2_SYSTEM_ROUTES,
  ...T2_NIGHT2_REPEAT_ROUTES,
];

export const T2_NIGHT2_ROUTE_IDS: readonly string[] = T2_NIGHT2_ROUTES.map((route) => route.id);
