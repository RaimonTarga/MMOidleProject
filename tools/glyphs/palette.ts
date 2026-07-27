// The UI glyph palette, sampled from the eight approved navigation icons in
// art/src/UI_icons (see tools/glyphs/README.md for the measurement).
//
// The shipped family averages 1041 distinct colours across those eight 32x32
// icons because it was downscaled from larger generated art. Authored glyphs use
// these seven deliberate tones instead, which is why they stay legible when the
// HUD draws them at 14-18px.

export type PaletteKey = '.' | 'K' | 'D' | 'L' | 'b' | 'B' | 'C' | 'c';

export const PALETTE: Record<PaletteKey, [number, number, number] | null> = {
  '.': null,              // transparent
  K: [10, 11, 11],        // near-black outline
  D: [44, 47, 47],        // charcoal body
  L: [72, 78, 78],        // charcoal lit face
  b: [108, 86, 44],       // bronze shadow
  B: [171, 133, 67],      // bronze
  C: [181, 249, 251],     // pale cyan accent
  c: [110, 235, 244],     // cyan deep
};

/**
 * Authored grid sizes, which are also the shipped sizes — nothing is resampled.
 *
 * 16 is for glyphs the HUD draws at 16px: stat figures in a `GlyphTile`, action
 * glyphs in an `ActionChip`. 32 is for the class root sigils, which the passive
 * tree renders on 88px nodes and would look starved at 16.
 */
export const GRID_SIZES = [16, 32] as const;
export type GridSize = (typeof GRID_SIZES)[number];
export const DEFAULT_GRID: GridSize = 16;
