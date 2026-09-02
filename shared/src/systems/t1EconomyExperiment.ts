import { BIOME_PRIMARY_ESSENCE } from '../items';
import type { EssenceType, ItemDefinition } from '../items';

/** The four pre-registered arms of the fresh T1 economy factorial. */
export type T1EconomyArm = 'C' | 'D' | 'E' | 'F';

/** Fixed identity for this batch; changing it requires a new experiment. */
export const T1_ECONOMY_EXPERIMENT_ID = 't1-economy-factorial-2026-09-01';
export const T1_ECONOMY_EXPERIMENT_REVISION = 't1-economy-factorial-2026-09-01-r1';
export const T1_ECONOMY_ARMS: readonly T1EconomyArm[] = ['C', 'D', 'E', 'F'];

/** Configuration that is allowed to vary between factorial arms. */
export interface T1EconomyExperimentConfig {
  arm: T1EconomyArm;
  experimentId: typeof T1_ECONOMY_EXPERIMENT_ID;
  revision: typeof T1_ECONOMY_EXPERIMENT_REVISION;
  t1Plus5EssenceCostMultiplier: 0.6 | 0.75;
  catalystProgressPerUnitT1: 150 | 200;
}

/** Pre-candidate T1 +5 essence prices. All other upgrade steps remain authored. */
const T1_PLUS5_BASE_ESSENCE_COSTS: Readonly<Record<string, number>> = {
  'chaotic-axe': 205,
  'cave-vest-t1': 260,
  'cave-charm-t1': 100,
  'cave-boots-t1': 70,
  'flash-rapier': 205,
  'forest-vest-t1': 200,
  'forest-charm-t1': 100,
  'forest-boots-t1': 60,
  'heavy-hammer': 205,
  'mountain-vest-t1': 205,
  'mountain-charm-t1': 100,
  'mountain-boots-t1': 70,
  'iron-broadsword': 100,
  'plains-vest-t1': 200,
  'plains-charm-t1': 75,
  'plains-boots-t1': 60,
  'ashbrand-blade': 200,
  'swamp-vest-t1': 200,
  'swamp-charm-t1': 100,
  'swamp-boots-t1': 70,
};

const ARM_CONFIGS: Readonly<Record<T1EconomyArm, T1EconomyExperimentConfig>> = {
  C: {
    arm: 'C',
    experimentId: T1_ECONOMY_EXPERIMENT_ID,
    revision: T1_ECONOMY_EXPERIMENT_REVISION,
    t1Plus5EssenceCostMultiplier: 0.75,
    catalystProgressPerUnitT1: 150,
  },
  D: {
    arm: 'D',
    experimentId: T1_ECONOMY_EXPERIMENT_ID,
    revision: T1_ECONOMY_EXPERIMENT_REVISION,
    t1Plus5EssenceCostMultiplier: 0.6,
    catalystProgressPerUnitT1: 150,
  },
  E: {
    arm: 'E',
    experimentId: T1_ECONOMY_EXPERIMENT_ID,
    revision: T1_ECONOMY_EXPERIMENT_REVISION,
    t1Plus5EssenceCostMultiplier: 0.75,
    catalystProgressPerUnitT1: 200,
  },
  F: {
    arm: 'F',
    experimentId: T1_ECONOMY_EXPERIMENT_ID,
    revision: T1_ECONOMY_EXPERIMENT_REVISION,
    t1Plus5EssenceCostMultiplier: 0.6,
    catalystProgressPerUnitT1: 200,
  },
};

export function isT1EconomyArm(value: unknown): value is T1EconomyArm {
  return typeof value === 'string' && T1_ECONOMY_ARMS.includes(value as T1EconomyArm);
}

export function t1EconomyConfigForArm(arm: T1EconomyArm): T1EconomyExperimentConfig {
  return ARM_CONFIGS[arm];
}

/** The existing live economy is arm C until a dev bot explicitly selects an arm. */
export function defaultT1EconomyConfig(): T1EconomyExperimentConfig {
  return ARM_CONFIGS.C;
}

/** Project one T1 +5 cost with the project's nearest-5 Math.round convention. */
export function t1Plus5EssenceCost(itemId: string, multiplier: number): number | null {
  const base = T1_PLUS5_BASE_ESSENCE_COSTS[itemId];
  if (base === undefined || !Number.isFinite(multiplier)) return null;
  return Math.round((base * multiplier) / 5) * 5;
}

/** Full expected T1 +5 map stamped into each run header and batch metadata. */
export function t1Plus5EssenceCosts(multiplier: number): Record<string, number> {
  return Object.fromEntries(
    Object.keys(T1_PLUS5_BASE_ESSENCE_COSTS).map((itemId) => [
      itemId,
      t1Plus5EssenceCost(itemId, multiplier),
    ]),
  ) as Record<string, number>;
}

/** Resolve an experimental T1 +5 cost; null means use the authored cost. */
export function t1ExperimentUpgradeCost(
  item: ItemDefinition,
  targetPlus: number,
  multiplier: number | undefined,
): Partial<Record<EssenceType, number>> | null {
  if (
    multiplier === undefined ||
    item.tier !== 1 ||
    targetPlus !== 5 ||
    !item.biomeGroup
  ) {
    return null;
  }
  const type = BIOME_PRIMARY_ESSENCE[item.biomeGroup];
  const cost = t1Plus5EssenceCost(item.id, multiplier);
  return type && cost !== null ? { [type]: cost } : null;
}
