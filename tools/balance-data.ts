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

/**
 * What the analytical reports actually put on the player.
 *
 * Every generated report builds a `PlayerStatsTarget` and hands it to the real
 * `recalculatePlayerStats`, so base stats, skill nodes, equipment, item upgrades,
 * class affinities and the reload archetype layer are correct by construction. The
 * gap is what never gets INTO that target: no core, relic, rune or rite is equipped
 * and `activeStance` is never set, so the stance step (stats.ts 2a/3e), the core
 * multiplier layer (3c) and the cadence relic profile are all silently inert.
 *
 * The bench (`server/bench/balance/`) equips all of them. That makes the two
 * families non-comparable in ABSOLUTE terms. Relative ranking inside one report
 * survives, because the omission is uniform across every row.
 *
 * Keep this string in one place so all three reports state the same thing.
 */
export const LOADOUT_MODEL_NOTE =
  'Player model: weapon, armour, charm and mobility only, plus skill nodes, item '
  + 'upgrades and class affinities. NO core, relic, rune, rite, stance or ability is '
  + 'equipped — the bench bots carry all six, so these numbers are comparable to each '
  + 'other but NOT to bench output in absolute terms.';
