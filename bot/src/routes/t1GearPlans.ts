import type { RouteStep } from "../route/types";
import { biome, getPiece } from "./t1Common";
import type { T1BossGearPlan, T1ProgressionPlan } from "./t1RouteBuilder";

// T1 economy pass (2026-08-28): Sweep's own recipe gate moved from Plains L3 to
// L2 (armor's level), so only weapon+armor stay `beforeShared` now — crafting
// the L3 charm here too would silently force the player past L2 before Sweep's
// `learnAbility` step runs, defeating the point of the earlier unlock. The charm
// moved to `afterShared` (after Sweep is learned) alongside the boots.
const COMMON_PLAINS_BEFORE: RouteStep[] = [
  ...getPiece(biome("plains"), "iron-broadsword"),
  ...getPiece(biome("plains"), "plains-vest-t1"),
];

const COMMON_PLAINS_AFTER_SHARED: RouteStep[] = [
  ...getPiece(biome("plains"), "plains-charm-t1"),
  ...getPiece(biome("plains"), "plains-boots-t1"),
];

const COMMON_PLAINS_AFTER_MAX: RouteStep[] = [
  { type: "upgrade", definitionId: "iron-broadsword", toPlus: 1, farmAt: biome("plains") },
  { type: "upgrade", definitionId: "plains-vest-t1", toPlus: 1, farmAt: biome("plains") },
  { type: "upgrade", definitionId: "plains-charm-t1", toPlus: 1, farmAt: biome("plains") },
  { type: "upgrade", definitionId: "plains-boots-t1", toPlus: 1, farmAt: biome("plains") },
];

function commonForestAfterMax(): RouteStep[] {
  return [
    { type: "upgrade", definitionId: "flash-rapier", toPlus: 2, farmAt: biome("forest") },
    { type: "upgrade", definitionId: "plains-vest-t1", toPlus: 2 },
    { type: "upgrade", definitionId: "plains-charm-t1", toPlus: 2 },
    { type: "upgrade", definitionId: "plains-boots-t1", toPlus: 2 },
  ];
}

export function durableMeleeProgression(): T1ProgressionPlan {
  return {
    plains: {
      beforeShared: COMMON_PLAINS_BEFORE,
      afterShared: COMMON_PLAINS_AFTER_SHARED,
      afterMax: COMMON_PLAINS_AFTER_MAX,
    },
    forest: {
      beforeShared: getPiece(biome("forest"), "flash-rapier"),
      afterMax: commonForestAfterMax(),
    },
    swamp: {
      afterShared: getPiece(biome("swamp"), "swamp-charm-t1"),
      afterMax: [
        { type: "upgrade", definitionId: "swamp-charm-t1", toPlus: 3, farmAt: biome("swamp") },
        { type: "upgrade", definitionId: "flash-rapier", toPlus: 3 },
        { type: "upgrade", definitionId: "plains-vest-t1", toPlus: 3 },
        { type: "upgrade", definitionId: "plains-boots-t1", toPlus: 3 },
      ],
    },
    mountain: {
      afterShared: getPiece(biome("mountain"), "mountain-vest-t1"),
      afterMax: [
        { type: "upgrade", definitionId: "mountain-vest-t1", toPlus: 4, farmAt: biome("mountain") },
        { type: "upgrade", definitionId: "flash-rapier", toPlus: 4 },
        { type: "upgrade", definitionId: "swamp-charm-t1", toPlus: 4 },
        { type: "upgrade", definitionId: "plains-vest-t1", toPlus: 4 },
        { type: "upgrade", definitionId: "plains-boots-t1", toPlus: 4 },
      ],
    },
    cave: {
      beforeShared: [
        {
          type: "equip",
          definitionIds: [
            "flash-rapier",
            "mountain-vest-t1",
            "swamp-charm-t1",
            "plains-boots-t1",
          ],
          label: "standing kit before Cave",
        },
        {
          type: "farm",
          at: biome("cave"),
          until: { type: "recipeUnlocked", recipeId: "chaotic-axe" },
        },
        { type: "craft", recipeIds: ["chaotic-axe"], farmAt: biome("cave") },
      ],
      afterShared: [
        {
          type: "upgrade",
          definitionId: "chaotic-axe",
          toPlus: 4,
          farmAt: biome("cave"),
          opportunistic: true,
        },
        { type: "equip", definitionIds: ["chaotic-axe"], label: "switch to the Chaotic Axe" },
      ],
      afterMax: [
        { type: "upgrade", definitionId: "chaotic-axe", toPlus: 5, farmAt: biome("cave") },
        { type: "upgrade", definitionId: "plains-vest-t1", toPlus: 5 },
        { type: "upgrade", definitionId: "mountain-vest-t1", toPlus: 5 },
        { type: "upgrade", definitionId: "swamp-charm-t1", toPlus: 5 },
        { type: "upgrade", definitionId: "plains-boots-t1", toPlus: 5 },
        { type: "milestone", id: "gear-plus-5" },
      ],
    },
  };
}

export const DURABLE_MELEE_BOSS_GEAR: T1BossGearPlan = {
  wornKit: ["chaotic-axe", "swamp-charm-t1", "plains-boots-t1"],
  armorByBoss: {
    plains: "plains-vest-t1",
    forest: "plains-vest-t1",
    mountain: "mountain-vest-t1",
    swamp: "mountain-vest-t1",
    cave: "mountain-vest-t1",
  },
  milestoneItems: [
    "chaotic-axe",
    "plains-vest-t1",
    "mountain-vest-t1",
    "swamp-charm-t1",
    "plains-boots-t1",
  ],
};

export function genericRangedProgression(): T1ProgressionPlan {
  const plan = durableMeleeProgression();
  plan.swamp.afterMax = [
    { type: "upgrade", definitionId: "swamp-charm-t1", toPlus: 3, farmAt: biome("swamp") },
    { type: "upgrade", definitionId: "flash-rapier", toPlus: 3 },
    { type: "upgrade", definitionId: "plains-vest-t1", toPlus: 3 },
    { type: "upgrade", definitionId: "plains-boots-t1", toPlus: 3 },
  ];
  return plan;
}

export function slingerProgression(): T1ProgressionPlan {
  return {
    plains: {
      beforeShared: COMMON_PLAINS_BEFORE,
      afterShared: COMMON_PLAINS_AFTER_SHARED,
      afterMax: COMMON_PLAINS_AFTER_MAX,
    },
    forest: {
      beforeShared: [
        ...getPiece(biome("forest"), "flash-rapier"),
        ...getPiece(biome("forest"), "forest-vest-t1"),
      ],
      afterMax: [
        { type: "upgrade", definitionId: "flash-rapier", toPlus: 2, farmAt: biome("forest") },
        { type: "upgrade", definitionId: "forest-vest-t1", toPlus: 2, farmAt: biome("forest") },
        { type: "upgrade", definitionId: "plains-charm-t1", toPlus: 2 },
        { type: "upgrade", definitionId: "plains-boots-t1", toPlus: 2 },
      ],
    },
    swamp: {
      afterShared: [
        ...getPiece(biome("swamp"), "swamp-charm-t1"),
        ...getPiece(biome("swamp"), "ashbrand-blade"),
        { type: "equip", definitionIds: ["flash-rapier"], label: "keep the rapier active" },
      ],
      afterMax: [
        { type: "upgrade", definitionId: "swamp-charm-t1", toPlus: 3, farmAt: biome("swamp") },
        {
          type: "upgrade",
          definitionId: "ashbrand-blade",
          toPlus: 3,
          farmAt: biome("swamp"),
          opportunistic: true,
        },
        { type: "upgrade", definitionId: "forest-vest-t1", toPlus: 3 },
        { type: "upgrade", definitionId: "flash-rapier", toPlus: 3 },
        { type: "upgrade", definitionId: "plains-boots-t1", toPlus: 3 },
      ],
    },
    mountain: {
      afterMax: [
        {
          type: "upgrade",
          definitionId: "ashbrand-blade",
          toPlus: 4,
          farmAt: biome("swamp"),
          opportunistic: true,
        },
        { type: "upgrade", definitionId: "flash-rapier", toPlus: 4 },
        { type: "upgrade", definitionId: "forest-vest-t1", toPlus: 4 },
        { type: "upgrade", definitionId: "swamp-charm-t1", toPlus: 4 },
        { type: "upgrade", definitionId: "plains-boots-t1", toPlus: 4 },
      ],
    },
    cave: {
      beforeShared: [
        {
          type: "equip",
          definitionIds: [
            "flash-rapier",
            "forest-vest-t1",
            "swamp-charm-t1",
            "plains-boots-t1",
          ],
          label: "standing kit before Cave",
        },
      ],
      afterShared: [
        {
          type: "upgrade",
          definitionId: "ashbrand-blade",
          toPlus: 4,
          farmAt: biome("swamp"),
          opportunistic: true,
        },
        { type: "equip", definitionIds: ["ashbrand-blade"], label: "switch to the Poison Dagger" },
      ],
      afterMax: [
        ...getPiece(biome("mountain"), "mountain-vest-t1"),
        { type: "upgrade", definitionId: "ashbrand-blade", toPlus: 5, farmAt: biome("swamp") },
        { type: "upgrade", definitionId: "forest-vest-t1", toPlus: 5 },
        { type: "upgrade", definitionId: "mountain-vest-t1", toPlus: 5, farmAt: biome("mountain") },
        { type: "upgrade", definitionId: "swamp-charm-t1", toPlus: 5 },
        { type: "upgrade", definitionId: "plains-boots-t1", toPlus: 5 },
        { type: "milestone", id: "gear-plus-5" },
      ],
    },
  };
}

export const SLINGER_BOSS_GEAR: T1BossGearPlan = {
  wornKit: ["ashbrand-blade", "swamp-charm-t1", "plains-boots-t1"],
  armorByBoss: {
    plains: "forest-vest-t1",
    forest: "forest-vest-t1",
    mountain: "mountain-vest-t1",
    swamp: "mountain-vest-t1",
    cave: "mountain-vest-t1",
  },
  milestoneItems: [
    "ashbrand-blade",
    "forest-vest-t1",
    "mountain-vest-t1",
    "swamp-charm-t1",
    "plains-boots-t1",
  ],
};

export function apprenticeProgression(): T1ProgressionPlan {
  const plan = durableMeleeProgression();
  plan.swamp.afterShared = [
    ...getPiece(biome("swamp"), "swamp-vest-t1"),
    ...getPiece(biome("swamp"), "swamp-charm-t1"),
  ];
  plan.swamp.afterMax = [
    { type: "upgrade", definitionId: "swamp-vest-t1", toPlus: 3, farmAt: biome("swamp") },
    { type: "upgrade", definitionId: "swamp-charm-t1", toPlus: 3 },
    { type: "upgrade", definitionId: "flash-rapier", toPlus: 3 },
    { type: "upgrade", definitionId: "plains-vest-t1", toPlus: 3 },
    { type: "upgrade", definitionId: "plains-boots-t1", toPlus: 3 },
  ];
  plan.mountain.afterMax = [
    { type: "upgrade", definitionId: "mountain-vest-t1", toPlus: 4, farmAt: biome("mountain") },
    { type: "upgrade", definitionId: "flash-rapier", toPlus: 4 },
    { type: "upgrade", definitionId: "swamp-vest-t1", toPlus: 4 },
    { type: "upgrade", definitionId: "swamp-charm-t1", toPlus: 4 },
    { type: "upgrade", definitionId: "plains-boots-t1", toPlus: 4 },
  ];
  plan.cave.afterMax = [
    { type: "upgrade", definitionId: "chaotic-axe", toPlus: 5, farmAt: biome("cave") },
    { type: "upgrade", definitionId: "plains-vest-t1", toPlus: 5 },
    { type: "upgrade", definitionId: "mountain-vest-t1", toPlus: 5 },
    { type: "upgrade", definitionId: "swamp-vest-t1", toPlus: 5, farmAt: biome("swamp") },
    { type: "upgrade", definitionId: "swamp-charm-t1", toPlus: 5 },
    { type: "upgrade", definitionId: "plains-boots-t1", toPlus: 5 },
    { type: "milestone", id: "gear-plus-5" },
  ];
  return plan;
}

export const APPRENTICE_BOSS_GEAR: T1BossGearPlan = {
  wornKit: ["chaotic-axe", "swamp-charm-t1", "plains-boots-t1"],
  armorByBoss: {
    plains: "plains-vest-t1",
    forest: "plains-vest-t1",
    mountain: "mountain-vest-t1",
    swamp: "swamp-vest-t1",
    cave: "mountain-vest-t1",
  },
  milestoneItems: [
    "chaotic-axe",
    "plains-vest-t1",
    "mountain-vest-t1",
    "swamp-vest-t1",
    "swamp-charm-t1",
    "plains-boots-t1",
  ],
};
