import type { PlayerView } from '@mmo-idle/shared';

export const ATLAS_KEY = 'game-atlas';

// ── Player frames ─────────────────────────────────────────────────────────────
// Keys: 'default', '{archetype}', or '{archetype}-{variant}'.
// getPlayerFrame tries variant-specific first, then archetype, then 'default'.
// Frame names are the filenames from your texture packer JSON (including .png).
export const PLAYER_FRAMES: Record<string, string> = {
  'default':  'classless.png',  // pre-class or unknown archetype

  'cadence':  'cadence.png',
  'cooldown': 'cooldown.png',
  'dot':      'dot.png',
  'energy':   'energy.png',
  'reload':   'reload.png',

  // Add variant-specific entries here when you bake variant sprites, e.g.:
  // 'cadence-heavy': 'cadence_heavy.png',
};

// ── Monster frames ────────────────────────────────────────────────────────────
// Key: monsterTypeId (matches MONSTER_DATABASE keys exactly).
// Absent entries fall back to the colored rectangle placeholder.
export const MONSTER_FRAMES: Record<string, string> = {
  // T0 — clearing
  'tiny-slime':   'tinyslime.png',

  // T1 — forest
  'forest-slime': 'greenslime.png',
  'wolf':         'wolf.png',

  // T1 — mountain
  'cliff-hopper': 'jumper.png',
  'ridge-archer': 'archer.png',

  // T1 — plains
  'plains-slime': 'yellowslime.png',
  'boar':         'boar.png',

  // T1 — swamp
  'bog-slime':    'swampslime.png',
  'mud-toad':     'frog.png',

  // T1 — cave
  'cave-lurker':  'crawler.png',
  // 'cave-brute': no sprite yet — renders as rectangle

  // Add entries here as you bake T2+ sprites, e.g.:
  // 'ancient-wolf': 'ancient_wolf.png',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const VARIANTS = ['light', 'balanced', 'heavy'] as const;

/**
 * Returns the atlas frame name for a player.
 * Resolution order: '{archetype}-{variant}' → '{archetype}' → 'default' → null.
 * This means you only need to add variant-specific entries when you have distinct sprites for them.
 */
export function getPlayerFrame(player: PlayerView): string | null {
  if (player.combatArchetype) {
    const variant = VARIANTS.find(v =>
      player.unlockedSkills.includes(`${player.combatArchetype}-${v}`)
    );
    if (variant) {
      const variantFrame = PLAYER_FRAMES[`${player.combatArchetype}-${variant}`];
      if (variantFrame) return variantFrame;
    }
    const archetypeFrame = PLAYER_FRAMES[player.combatArchetype];
    if (archetypeFrame) return archetypeFrame;
  }
  return PLAYER_FRAMES['default'] ?? null;
}

/**
 * Returns the atlas frame name for a monster type, or null if no sprite exists.
 */
export function getMonsterFrame(monsterTypeId: string): string | null {
  return MONSTER_FRAMES[monsterTypeId] ?? null;
}

// ── Player shadow color ramp ──────────────────────────────────────────────────
// Dark rainbow keyed on progressionLevel. Add entries at whatever level breakpoints feel right.
const PLAYER_SHADOW_RAMP: Array<{ minLevel: number; color: number }> = [
  { minLevel:  0, color: 0x000000 }, // level 0 — filled black (same as monsters)
  { minLevel:  1, color: 0xff4444 }, // bright red
  { minLevel:  2, color: 0xff8800 }, // bright orange
  { minLevel:  3, color: 0xffee00 }, // bright yellow
  { minLevel:  4, color: 0x44ff88 }, // bright green
  { minLevel:  5, color: 0x00ddcc }, // bright teal
  { minLevel:  6, color: 0x4488ff }, // bright blue
];

export function getPlayerShadowColor(progressionLevel: number): number {
  let color = PLAYER_SHADOW_RAMP[0].color;
  for (const entry of PLAYER_SHADOW_RAMP) {
    if (progressionLevel >= entry.minLevel) color = entry.color;
    else break;
  }
  return color;
}

// ── Shadow offsets ────────────────────────────────────────────────────────────
// How many px below the sprite's center the shadow ellipse sits.
// Tune these visually — positive = lower, negative = higher.
// Absent entries use DEFAULT_SHADOW_OFFSET.
const DEFAULT_SHADOW_OFFSET = 22;

const SHADOW_OFFSETS: Record<string, number> = {
  // Players — taller sprites, shadow needs to be lower to sit at their feet
  'player': 28,

  // Slimes — short and wide, shadow should sit near their middle
  'tiny-slime':   10,

  //bigger slimes
  'forest-slime': 24,
  'plains-slime': 24,
  'bog-slime':    24,

  'cave-lurker': 18,

  // Add other overrides here as you notice mismatches, e.g.:
  // 'wolf': 20,
  // 'boar': 18,
};

export function getPlayerShadowOffset(): number {
  return SHADOW_OFFSETS['player'] ?? DEFAULT_SHADOW_OFFSET;
}

export function getMonsterShadowOffset(monsterTypeId: string): number {
  return SHADOW_OFFSETS[monsterTypeId] ?? DEFAULT_SHADOW_OFFSET;
}

// ── Biome background textures ─────────────────────────────────────────────────
// Key: biomeGroup (matches NODE_BIOMES[id].biomeGroup).
// Value: Phaser texture key — file is /assets/{key}.png (underscores, not hyphens).
// Biomes absent here fall back to the solid backgroundColor from BIOME_DATABASE.
export const BIOME_TEXTURES: Record<string, string> = {
  'clearing': 'biome_clearing',
  'forest':   'biome_forest',
  'mountain': 'biome_mountain',
  'plains':   'biome_plains',
  'swamp':    'biome_swamp',
  'cave':     'biome_cave',
};
