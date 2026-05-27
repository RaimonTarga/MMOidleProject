// Keys: 'default', '{archetype}', or '{archetype}-{variant}'.
export const PLAYER_FRAMES: Record<string, string> = {
  'default':  'classless.png',

  'cadence':  'cadence.png',
  'cooldown': 'cooldown.png',
  'dot':      'dot.png',
  'energy':   'energy.png',
  'reload':   'reload.png',

  'cadence-light':    'light_cadence.png',
  'cadence-balanced': 'medium_cadence.png',
  'cadence-heavy':    'heavy_cadence.png',

  'cooldown-light':    'light_cooldown.png',
  'cooldown-balanced': 'medium_cooldown.png',
  'cooldown-heavy':    'heavy_cooldown.png',

  'dot-light':    'light_dot.png',
  'dot-balanced': 'medium_dot.png',
  'dot-heavy':    'heavy_dot.png',

  'energy-light':    'light_energy.png',
  'energy-balanced': 'medium_energy.png',
  'energy-heavy':    'heavy_energy.png',

  'reload-light':    'light_reload.png',
  'reload-balanced': 'medium_reload.png',
  'reload-heavy':    'heavy_reload.png',
};

/** Key: monsterTypeId (matches MONSTER_DATABASE keys exactly). */
export const MONSTER_FRAMES: Record<string, string> = {
  'tiny-slime':   'tinyslime.png',

  'forest-slime': 'greenslime.png',
  'wolf':         'wolf.png',

  'cliff-hopper': 'jumper.png',
  'ridge-archer': 'archer.png',

  'plains-slime': 'yellowslime.png',
  'boar':         'boar.png',

  'bog-slime':    'swampslime.png',
  'mud-toad':     'frog.png',

  'cave-lurker':  'crawler.png',
  'cave-brute':   'brute.png',

  'forest-warden':     'boss_forest.png',
  'mountain-sentinel': 'boss_mountain.png',
  'bog-sovereign':     'boss_swamp.png',
  'cave-sentinel':     'boss_cave.png',
};

const VARIANTS = ['light', 'balanced', 'heavy'] as const;

/**
 * Returns the atlas frame name for a player.
 * Resolution order: '{archetype}-{variant}' → '{archetype}' → 'default' → null.
 */
export function resolvePlayerFrame(input: {
  combatArchetype: string | null;
  unlockedSkills: string[];
}): string | null {
  if (input.combatArchetype) {
    const variant = VARIANTS.find(v =>
      input.unlockedSkills.includes(`${input.combatArchetype}-${v}`),
    );
    if (variant) {
      const variantFrame = PLAYER_FRAMES[`${input.combatArchetype}-${variant}`];
      if (variantFrame) return variantFrame;
    }
    const archetypeFrame = PLAYER_FRAMES[input.combatArchetype];
    if (archetypeFrame) return archetypeFrame;
  }
  return PLAYER_FRAMES['default'] ?? null;
}

/** Returns the atlas frame name for a monster type, or null if no sprite exists. */
export function resolveMonsterFrame(monsterTypeId: string): string | null {
  return MONSTER_FRAMES[monsterTypeId] ?? null;
}
