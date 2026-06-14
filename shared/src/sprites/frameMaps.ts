// Keys: 'default', '{archetype}', '{archetype}-{variant}', or '{archetype}-{variant}-t3'.
export const PLAYER_FRAMES: Record<string, string> = {
  'default':  'sprites/classless.png',

  'cadence':  'sprites/cadence.png',
  'cooldown': 'sprites/cooldown.png',
  'dot':      'sprites/dot.png',
  'energy':   'sprites/energy.png',
  'reload':   'sprites/reload.png',

  'cadence-range-close': 'sprites/in-fighter.png',
  'cadence-range-mid':   'sprites/lancer.png',
  'cadence-range-far':   'sprites/phantom-blade.png',

  'cooldown-range-close': 'sprites/vanguard.png',
  'cooldown-range-mid':   'sprites/phalanx.png',
  'cooldown-range-far':   'sprites/sentinel.png',

  'dot-range-close': 'sprites/hexblade.png',
  'dot-range-mid':   'sprites/warlock.png',
  'dot-range-far':   'sprites/harbinger.png',

  'energy-range-close': 'sprites/haunt.png',
  'energy-range-mid':   'sprites/shade.png',
  'energy-range-far':   'sprites/wisp.png',

  'reload-range-close': 'sprites/breacher.png',
  'reload-range-mid':   'sprites/enforcer.png',
  'reload-range-far':   'sprites/deadeye.png',
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
  'tusked-razorback':    'sprites/boss-plains-t1.png',
  'gnarled-greatbear':   'sprites/boss-forest-t1.png',
  'crag-behemoth':       'sprites/boss-mountain-t1.png',
  'grave-toadeater':     'sprites/boss-swamp-t1.png',
  'obsidian-broodmother':'sprites/boss-cave-t1.png',

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

  // ── T2 bosses ────────────────────────────────────────────────────────────────
  'gorging-razortusk':     'sprites/boss-plains-t2.png',
  'apex-timberclaw':       'sprites/boss-forest-t2.png',
  'stoneplate-juggernaut': 'sprites/boss-mountain-t2.png',
  'mire-gorged-behemoth':  'sprites/boss-swamp-t2.png',
  'chitinous-dreadbore':   'sprites/boss-cave-t2.png',
  'dune-stalker-emperor':  'sprites/boss-desert-t2.png',
  'jungle-dread-gorger':   'sprites/boss-jungle-t2.png',

  // ── T3: Mountain ─────────────────────────────────────────────────────────────
  'mountain-colossus': 'sprites/mountain-colossus.png',
  'avalanche-ram':     'sprites/avalanche-ram.png',
  'crag-mortar':       'sprites/crag-mortar.png',

  // ── T3: Cave ─────────────────────────────────────────────────────────────────
  'deep-spider':      'sprites/deep-spider.png',
  'cavern-troll':     'sprites/cavern-troll.png',
  'crystal-gargoyle': 'sprites/crystal-gargoyle.png',

  // ── T3: Swamp ────────────────────────────────────────────────────────────────
  'plague-hydra': 'sprites/plague-hydra.png',
  'bog-lurker':   'sprites/bog-lurker.png',
  'mire-hex-spitter': 'sprites/mire-hex-spitter.png',

  // ── T3: Jungle ───────────────────────────────────────────────────────────────
  'jungle-stalker':  'sprites/jungle-stalker.png',
  'silverback':      'sprites/silverback.png',
  'canopy-harrier':  'sprites/canopy-harrier.png',

  // ── T3: Desert ───────────────────────────────────────────────────────────────
  'dune-stalker':    'sprites/dune-stalker.png',
  'desert-basilisk': 'sprites/desert-basilisk.png',
  'sandweaver':      'sprites/sand-weaver.png',

  // ── T3: Volcano ──────────────────────────────────────────────────────────────
  'cinder-hound': 'sprites/cinder-hound.png',
  'magma-brute':  'sprites/magma-brute.png',
  'ash-slinger':  'sprites/ash-slinger.png',
  'ember-scuttler': 'sprites/ember-scuttler.png',

  // ── T3: Tundra ───────────────────────────────────────────────────────────────
  'frost-lurker': 'sprites/frost-lurker.png',
  'glacier-bear': 'sprites/glacier-bear.png',
  'rime-caster':  'sprites/rime-caster.png',

  // ── T3 bosses ────────────────────────────────────────────────────────────────
  'crag-gorged-horn-behemoth':    'sprites/boss-mountain-t3.png',
  'deep-core-burrow-gorger':      'sprites/boss-cave-t3.png',
  'rot-spore-croc-behemoth':      'sprites/boss-swamp-t3.png',
  'dune-carapace-monarch':        'sprites/boss-desert-t3.png',
  'apex-bramble-slasher':         'sprites/boss-jungle-t3.png',
  'cinder-shell-magma-salamander':'sprites/boss-volcano-t3.png',
  'frost-plated-rime-mammoth':    'sprites/boss-tundra-t3.png',

  // ── Summoner minion ──────────────────────────────────────────────────────────
  'slime':      'sprites/swampslime.png',
  'tiny-slime': 'sprites/tinyslime.png',
};

const VARIANTS = ['light', 'balanced', 'heavy'] as const;
const RANGE_SUFFIXES = ['range-close', 'range-mid', 'range-far'] as const;

/**
 * Returns the atlas frame name for a player.
 * Resolution order: '{archetype}-{range}' → '{archetype}-{variant}-t3' → '{archetype}-{variant}' → '{archetype}' → 'default' → null.
 */
export function resolvePlayerFrame(input: {
  combatArchetype: string | null;
  unlockedSkills: string[];
}): string | null {
  if (input.combatArchetype) {
    const range = RANGE_SUFFIXES.find(r =>
      input.unlockedSkills.includes(`${input.combatArchetype}-${r}`),
    );
    if (range) {
      const rangeFrame = PLAYER_FRAMES[`${input.combatArchetype}-${range}`];
      if (rangeFrame) return rangeFrame;
    }
    const variant = VARIANTS.find(v =>
      input.unlockedSkills.includes(`${input.combatArchetype}-${v}`),
    );
    if (variant) {
      const hasT3 = input.unlockedSkills.some(s =>
        s.startsWith(`${input.combatArchetype}-${variant}-t3`),
      );
      if (hasT3) {
        const t3Frame = PLAYER_FRAMES[`${input.combatArchetype}-${variant}-t3`];
        if (t3Frame) return t3Frame;
      }
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
