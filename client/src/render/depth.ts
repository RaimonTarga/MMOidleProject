import { GAME_CONFIG } from '@mmo-idle/shared';

// Band size must exceed NODE_HEIGHT so no two adjacent bands can overlap.
const BAND = Math.ceil(GAME_CONFIG.NODE_HEIGHT / 1000 + 1) * 1000; // 6000 at NODE_HEIGHT 4800

export const DEPTH = {
  BG_DECOR: -9,         // environmental overlays above biome tiling (-12..-10)
  SHADOW:  0,           // 0        + y  →  0–4800
  SPRITE:  BAND,        // 6000     + y  →  6000–10800
  UI:      BAND * 2,    // 12000    + y  →  12000–16800 (HP bars, CD bars, labels)
  FX:      BAND * 4,    // 24000         fixed, always above all y-sorted content
  MINIMAP: BAND * 7,    // 42000         HUD minimap
  SCREEN:  BAND * 20,   // 120000        death / ascension overlays
} as const;
