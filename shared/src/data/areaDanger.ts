import type { NodeBiomeInfo } from '../world/nodeBiomes';

/** 1–4 are the within-tier biome bands; 5 is reserved for dungeon boss fights. */
export type AreaDanger = 1 | 2 | 3 | 4 | 5;
export const AREA_DANGER_LABELS: Record<AreaDanger, string> = {
  1: 'Low danger', 2: 'Medium danger', 3: 'High danger', 4: 'Very High danger', 5: 'Boss fight',
};

/** Authored progression within the destination tier, not a character power estimate. */
export const AREA_DANGER_BY_TIER: Readonly<Record<number, Readonly<Record<string, AreaDanger>>>> = {
  1: { plains: 1, forest: 1, swamp: 2, mountain: 3, cave: 4 },
  2: { plains: 1, forest: 1, swamp: 2, mountain: 2, cave: 3, jungle: 3, desert: 4 },
  3: { swamp: 1, mountain: 1, cave: 2, jungle: 2, desert: 3, tundra: 3, volcanic: 4 },
  4: { mountain: 1, jungle: 1, desert: 2, tundra: 2, volcanic: 3, graveyard: 3, trench: 4 },
};

export function areaDanger(info: NodeBiomeInfo): AreaDanger | null {
  if (info.kind === 'sanctuary' || info.kind === 'tutorial') return null;
  // Dungeons are boss fights: their own band above every biome, whatever the biome.
  if (info.isDungeon) return 5;
  return AREA_DANGER_BY_TIER[info.biomeTier]?.[info.biomeGroup] ?? null;
}
