import type { T2BiomeGroup } from "./t2Common";

/**
 * The Tier-2 encounter-shape policy: which biomes are fought as CROWDS and
 * which as SINGLE TARGETS, and what the character wears for each.
 *
 * Designer decision, 2026-09-02. Held identical across all six classes and all
 * three branches, exactly like the biome order, so that encounter shape is a
 * fixed property of the route rather than a per-class variable. What differs
 * between classes is their GEAR (see `t2GearPlans.ts`); that is the thing the
 * campaign is trying to observe.
 *
 * ── Why the split falls where it does ──────────────────────────────────────
 *
 * Plains, Forest and Jungle are the crowd biomes; Swamp, Mountain, Cave and
 * Desert are fought a target at a time. A boss is ALWAYS a single-target
 * encounter regardless of its biome, so the crowd biomes switch to the
 * single-target kit for their own boss.
 */
export type EncounterShape = "aoe" | "single-target";

export const BIOME_ENCOUNTER_SHAPE: Record<T2BiomeGroup, EncounterShape> = {
  plains: "aoe",
  forest: "aoe",
  swamp: "single-target",
  mountain: "single-target",
  cave: "single-target",
  jungle: "aoe",
  desert: "single-target",
};

/**
 * Tier 2 grants exactly ONE Technique and ONE Guard slot
 * (`clampEquippedAbilities` returns a second Technique only at tier 3), so the
 * encounter-shape switch IS the ability pair. There is no room for both.
 *
 *   AoE            -> Sweep, which arms the next attack to cleave.
 *   Single target  -> Expose Weakness, which makes one target take more damage.
 *
 * Both are learned by every canonical Tier-1 template, so no class has to detour
 * to acquire its half of the split.
 */
export function techniqueFor(shape: EncounterShape): string {
  return shape === "aoe" ? "sweep" : "expose-weakness";
}

/**
 * Cleanse in the Swamp, Second Wind everywhere else — designer instruction.
 *
 * Swamp is the affliction biome and Cleanse is the only answer in the Tier-1
 * ability set. Note the throughput caveat recorded in the T2 theorycraft brief:
 * at player tier 2 Cleanse sits at rank II (2 stacks / 10 s), which loses the
 * race against a boss re-applying ~3.5 stacks / 10 s. It is still the right tool
 * for the Swamp FARM legs; whether it holds up at the Swamp boss is one of the
 * things this route exists to find out.
 *
 * Brace is deliberately absent: no canonical Tier-1 template learns it (only the
 * separate `squire-brace-tank-t1` experiment arm does), and teaching it to some
 * classes and not others would make Guard quality a second moving variable.
 */
export function guardFor(biomeGroup: T2BiomeGroup): string {
  return biomeGroup === "swamp" ? "cleanse" : "second-wind";
}

// ── Stances ────────────────────────────────────────────────────────────────

/**
 * Two stances, mapped onto the same encounter-shape axis.
 *
 *   Offensive (+15% attack, +10% attack speed, +10% damage taken) on the crowd
 *     biomes: when the incoming hits are many and small, paying 10% more for
 *     each of them buys real clear speed.
 *   Defensive (+20% plating, -10% damage taken, -15% attack) on the
 *     single-target biomes and on every boss. Plating is subtracted PER HIT
 *     (`max(1, H - plating)`), so it is worth most exactly where hits are few
 *     and large.
 *
 * A DEFAULT stance costs no Runic Points — a stance's `runeCost` is paid only by
 * a `switch-stance` rule that targets it — so this whole policy is free against
 * the RP budget. Reactive stance switching is deliberately left out of the
 * baseline; it is a probe.
 *
 * ACQUISITION ORDER. Both introductory stances are now Plains rewards at level
 * 7 and use the local yellow essence, so a clean T2 entry can craft both on the
 * first leg. The route still uses the encounter-
 * shape policy below; this pass changes only where those existing stance
 * choices become available.
 */
export const OFFENSIVE_STANCE = "offensive-stance";
export const DEFENSIVE_STANCE = "defensive-stance";

export const STANCE_RECIPES = {
  [OFFENSIVE_STANCE]: "stance-recipe-offensive",
  [DEFENSIVE_STANCE]: "stance-recipe-defensive",
} as const;

/** The leg each stance is crafted on, chosen for affordability, not for its gate. */
export const OFFENSIVE_STANCE_LEG: T2BiomeGroup = "plains";
export const DEFENSIVE_STANCE_LEG: T2BiomeGroup = "plains";

const LEG_INDEX: Record<T2BiomeGroup, number> = {
  plains: 1,
  forest: 2,
  swamp: 3,
  mountain: 4,
  cave: 5,
  jungle: 6,
  desert: 7,
};

/** The default stance while FARMING `biomeGroup`, or null before it is owned. */
export function farmStanceFor(biomeGroup: T2BiomeGroup): string | null {
  const shape = BIOME_ENCOUNTER_SHAPE[biomeGroup];
  if (shape === "aoe") {
    return LEG_INDEX[biomeGroup] >= LEG_INDEX[OFFENSIVE_STANCE_LEG] ? OFFENSIVE_STANCE : null;
  }
  return LEG_INDEX[biomeGroup] >= LEG_INDEX[DEFENSIVE_STANCE_LEG] ? DEFENSIVE_STANCE : null;
}

/** The default stance for `biomeGroup`'s BOSS. Always defensive, once owned. */
export function bossStanceFor(biomeGroup: T2BiomeGroup): string | null {
  return LEG_INDEX[biomeGroup] >= LEG_INDEX[DEFENSIVE_STANCE_LEG] ? DEFENSIVE_STANCE : null;
}

// ── Cores ──────────────────────────────────────────────────────────────────

/**
 * One core slot, three Tier-2 cores, and the designer's own stated hypothesis:
 * **Force for farming, Survivalist for bosses.**
 *
 *   core-tempered    Cave   L12  +12% attack, +12% max HP        (red 500 + 4 dominion)
 *   core-survivalist Jungle L6   +30% recovery, +15% max HP      (green 500 + 4 fortified)
 *   core-force       Desert L6   +22% attack, -12% max HP        (yellow 500 + 4 dominion)
 *
 * All three are `unrestricted`, which matters: `coreIsActive` gates a `melee` or
 * `ranged` core on `selectedRange`, and a Tier-2 character has NO range node
 * (see the branch argument in `t2RouteBuilder.ts`). A directional core would sit
 * in the slot contributing literally nothing. Every restricted Tier-2 core is
 * therefore excluded from the baseline by necessity, not by preference.
 *
 * Policy:
 *   - Tempered is the first farm core, crafted at the Cave capstone gate.
 *   - Force replaces it as the farm core from Desert, once Tier-2 armour is on
 *     to absorb the -12% max HP it charges for the attack.
 *   - Survivalist becomes available in Jungle and goes on for every boss
 *     attempt, then comes back off afterwards.
 *
 * The swap is real automation cost (two equips per boss) and it is a HYPOTHESIS,
 * not a known-good play. A cores-off arm is the control if the swap turns out to
 * matter more than the tier does.
 */
export const CORE_TEMPERED = "core-tempered";
export const CORE_SURVIVALIST = "core-survivalist";
export const CORE_FORCE = "core-force";

export const CORE_CRAFT_LEG: Record<string, T2BiomeGroup> = {
  [CORE_TEMPERED]: "cave",
  [CORE_SURVIVALIST]: "jungle",
  [CORE_FORCE]: "desert",
};

/** The core worn while FARMING `biomeGroup`, or null before any is owned. */
export function farmCoreFor(biomeGroup: T2BiomeGroup): string | null {
  if (LEG_INDEX[biomeGroup] >= LEG_INDEX[CORE_CRAFT_LEG[CORE_FORCE]]) return CORE_FORCE;
  if (LEG_INDEX[biomeGroup] >= LEG_INDEX[CORE_CRAFT_LEG[CORE_TEMPERED]]) return CORE_TEMPERED;
  return null;
}

/** The core worn for `biomeGroup`'s BOSS, or null before Survivalist is owned. */
export function bossCoreFor(biomeGroup: T2BiomeGroup): string | null {
  return LEG_INDEX[biomeGroup] >= LEG_INDEX[CORE_CRAFT_LEG[CORE_SURVIVALIST]]
    ? CORE_SURVIVALIST
    : farmCoreFor(biomeGroup);
}
