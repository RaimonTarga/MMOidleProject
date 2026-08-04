import {
  BIOME_DATABASE,
  bossClearKey,
  bossSealSourcesAtTier,
} from '@mmo-idle/shared';

export interface SealSourceView {
  biomeGroup: string;
  name: string;
  obtained: boolean;
}

/** Client-facing source rows derived from the same shared authority as tier-up. */
export function sealSourceViewsAtTier(
  bossesCleared: readonly string[],
  tier: number,
): SealSourceView[] {
  return bossSealSourcesAtTier(tier).map((biomeGroup) => ({
    biomeGroup,
    name: BIOME_DATABASE.get(biomeGroup)?.name ?? biomeGroup,
    obtained: bossesCleared.includes(bossClearKey(biomeGroup, tier)),
  }));
}
