import { GAME_CONFIG } from '@mmo-idle/shared';

// Band size must exceed NODE_HEIGHT so no two adjacent bands can overlap.
const BAND = Math.ceil(GAME_CONFIG.NODE_HEIGHT / 1000 + 1) * 1000; // 5000 at NODE_HEIGHT 3200

export const DEPTH = {
  BG_DECOR: -9,         // environmental overlays above biome tiling (-12..-10)
  SHADOW:  0,           // 0        + y  →  0–3200
  SPRITE:  BAND,        // 5000     + y  →  5000–8200
  UI:      BAND * 2,    // 10000    + y  →  10000–13200 (HP bars, CD bars, labels)
  FX:      BAND * 4,    // 20000         fixed, always above all y-sorted content
  MINIMAP: BAND * 7,    // 35000         HUD minimap
  SCREEN:  BAND * 20,   // 100000        death / ascension overlays
} as const;
