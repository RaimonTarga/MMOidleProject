// Keys: 'default', '{archetype}', or '{archetype}-{variant}'.
export const PLAYER_FRAMES: Record<string, string> = {
  'default':  'sprites/classless.png',

  'cadence':  'sprites/cadence.png',
  'cooldown': 'sprites/cooldown.png',
  'dot':      'sprites/dot.png',
  'energy':   'sprites/energy.png',
  'reload':   'sprites/reload.png',

  'cadence-light':    'sprites/light_cadence.png',
  'cadence-balanced': 'sprites/medium_cadence.png',
  'cadence-heavy':    'sprites/heavy_cadence.png',

  'cooldown-light':    'sprites/light_cooldown.png',
  'cooldown-balanced': 'sprites/medium_cooldown.png',
  'cooldown-heavy':    'sprites/heavy_cooldown.png',

  'dot-light':    'sprites/light_dot.png',
  'dot-balanced': 'sprites/medium_dot.png',
  'dot-heavy':    'sprites/heavy_dot.png',

  'energy-light':    'sprites/light_energy.png',
  'energy-balanced': 'sprites/medium_energy.png',
  'energy-heavy':    'sprites/heavy_energy.png',

  'reload-light':    'sprites/light_reload.png',
  'reload-balanced': 'sprites/medium_reload.png',
  'reload-heavy':    'sprites/heavy_reload.png',
};

/** Key: monsterTypeId (matches MONSTER_DATABASE keys exactly).
 *
 * Note: `slime` is the summoner-archetype minion. It is not a `MonsterDefinition`
 * entry — it is rendered as a minion entity, aliased to the swamp slime spritesheet
 * so we get a creature look without authoring a new asset.
 *
 * Frame names must match the keys in sprites.json exactly (free-tex-packer
 * preserves the full relative path including the `sprites/` folder prefix).
 */
export const MONSTER_FRAMES: Record<string, string> = {
  // ── T1: Plains ──────────────────────────────────────────────────────────────
  'plains-slime': 'sprites/yellowslime.png',
  'boar':         'sprites/boar.png',

  // ── T1: Forest ──────────────────────────────────────────────────────────────
  'forest-slime': 'sprites/greenslime.png',
  'wolf':         'sprites/wolf.png',

  // ── T1: Mountain ────────────────────────────────────────────────────────────
  'cliff-hopper': 'sprites/jumper.png',
  'ridge-archer': 'sprites/archer.png',

  // ── T1: Swamp ────────────────────────────────────────────────────────────────
  'bog-slime':    'sprites/swampslime.png',
  'mud-toad':     'sprites/frog.png',

  // ── T1: Cave ─────────────────────────────────────────────────────────────────
  'cave-lurker':  'sprites/crawler.png',
  'cave-brute':   'sprites/brute.png',

  // ── T1 bosses ────────────────────────────────────────────────────────────────
  'forest-warden':     'sprites/boss_forest.png',
  'mountain-sentinel': 'sprites/boss_mountain.png',
  'bog-sovereign':     'sprites/boss_swamp.png',
  'cave-sentinel':     'sprites/boss_cave.png',

  // ── T2: Plains ──────────────────────────────────────────────────────────────
  'prairie-wolf':   'sprites/prairie-wolf.png',
  'stampede-bull':  'sprites/stampede-bull.png',
  'savanna-hawk':   'sprites/savanna-hawk.png',

  // ── T2: Forest ──────────────────────────────────────────────────────────────
  'ancient-wolf':   'sprites/ancient-wolf.png',
  'ironwood-golem': 'sprites/ironwood-golem.png',
  'canopy-sprite':  'sprites/canopy-sprite.png',

  // ── T2: Mountain ────────────────────────────────────────────────────────────
  'granite-titan':  'sprites/granite-titan.png',
  'stone-eagle':    'sprites/stone-eagle.png',
  'peak-archer':    'sprites/peak-archer.png',

  // ── T2: Swamp ────────────────────────────────────────────────────────────────
  'swamp-hydra':    'sprites/swamp-hydra.png',
  'bog-witch':      'sprites/bog-witch.png',
  'mire-stalker':   'sprites/mire-stalker.png',

  // ── T2: Cave ─────────────────────────────────────────────────────────────────
  'giant-spider':   'sprites/giant-spider.png',
  'cave-troll':     'sprites/cave-troll.png',
  'cave-gargoyle':  'sprites/cave-gargoyle.png',

  // ── T2: Jungle ───────────────────────────────────────────────────────────────
  'jungle-snake':      'sprites/jungle-snake.png',
  'jungle-ape':        'sprites/jungle-ape.png',
  'jungle-blowdarter': 'sprites/jungle-blowdarter.png',

  // ── T2: Desert ───────────────────────────────────────────────────────────────
  'sand-scorpion':  'sprites/sand-scorpion.png',
  'stone-basilisk': 'sprites/stone-basilisk.png',
  'dust-djinn':     'sprites/dust-djinn.png',

  // ── Summoner minion ──────────────────────────────────────────────────────────
  'slime':      'sprites/swampslime.png',
  'tiny-slime': 'sprites/tinyslime.png',
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
