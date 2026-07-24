export type PaceFamily =
  | 'alacrity'
  | 'brutality'
  | 'blight'
  | 'volatility'
  | 'predation';

/** Canonical order used by world authoring, wallets, legends, and validation. */
export const PACE_FAMILIES: PaceFamily[] = [
  'alacrity',
  'brutality',
  'blight',
  'volatility',
  'predation',
];

export type DensityModifier = 'swarming' | 'elite-ground';

export const DENSITY_MODIFIERS: DensityModifier[] = ['swarming', 'elite-ground'];

/**
 * Density overlays are intentionally dormant. Keep their vocabulary and
 * implementation available for a future redesign, but authoring, projections,
 * runtime math, rewards, and UI must all behave as though no density exists.
 */
export const DENSITY_MODIFIERS_ENABLED = false;

export interface NodeModifierInfo {
  pace: PaceFamily;
  density?: DensityModifier;
}

/** Pace families a biome may never carry. */
export const PACE_HARD_BANS: Record<string, PaceFamily[]> = {
  forest: ['brutality'],
  mountain: ['alacrity'],
  jungle: ['brutality'],
  desert: ['alacrity'],
  tundra: ['alacrity'],
};

/** Density modifiers a biome may never carry. */
export const DENSITY_BANS: Record<string, DensityModifier[]> = {
  mountain: ['elite-ground'],
  cave: ['elite-ground'],
  desert: ['elite-ground'],
  trench: ['elite-ground'],
  graveyard: ['swarming'],
};

/** Each biome's native family. `null` means the deliberately neutral Plains. */
export const NATIVE_FAMILY: Record<string, PaceFamily | null> = {
  plains: null,
  forest: 'alacrity',
  mountain: 'brutality',
  swamp: 'blight',
  cave: 'volatility',
  jungle: 'alacrity',
  desert: 'predation',
  tundra: 'brutality',
  volcanic: 'blight',
  graveyard: 'blight',
  trench: 'predation',
};
