import { GAME_CONFIG } from '@mmo-idle/shared';

// Band size must exceed NODE_HEIGHT so no two adjacent bands can overlap.
const BAND = Math.ceil(GAME_CONFIG.NODE_HEIGHT / 1000 + 1) * 1000; // 3000 for NODE_HEIGHT 2400

export const DEPTH = {
  BG_DECOR: -9,         // environmental overlays above biome tiling (-12..-10)
  SHADOW:  0,           // 0        + y  →  0–2400
  SPRITE:  BAND,        // 3000     + y  →  3000–5400
  UI:      BAND * 2,    // 6000     + y  →  6000–8400  (HP bars, CD bars, labels)
  FX:      BAND * 4,    // 12000         fixed, always above all y-sorted content
  MINIMAP: BAND * 7,    // 21000         HUD minimap
  SCREEN:  BAND * 20,   // 60000         death / ascension overlays
} as const;
