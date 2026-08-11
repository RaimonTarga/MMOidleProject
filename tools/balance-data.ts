import {
  BIOME_DATABASE,
  ITEM_DATABASE,
  MONSTER_DATABASE,
  type BiomeDefinition,
  type ItemDefinition,
  type MonsterDefinition,
} from '@mmo-idle/shared';

export interface BalanceData {
  biomes(): BiomeDefinition[];
  items(): ItemDefinition[];
  monsters(): MonsterDefinition[];
  monster(id: string): MonsterDefinition | undefined;
}

const AUTHORED_DATA: BalanceData = {
  biomes: () => [...BIOME_DATABASE.values()],
  items: () => [...ITEM_DATABASE.values()],
  monsters: () => [...MONSTER_DATABASE.values()],
  monster: (id) => MONSTER_DATABASE.get(id),
};

/**
 * Single tooling seam for authored balance data. A future reversible tuning
 * overlay should be composed here so reports never need to know whether a value
 * came from authored TypeScript or an experimental override.
 */
export function balanceData(): BalanceData {
  return AUTHORED_DATA;
}
