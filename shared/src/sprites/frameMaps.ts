// Keys: 'default', '{archetype}', '{archetype}-{variant}', or '{archetype}-{variant}-t3'.
export const PLAYER_FRAMES: Record<string, string> = {
  'default':  'sprites/classes/classless.png',

  'cadence':  'sprites/classes/cadence.png',
  'cooldown': 'sprites/classes/cooldown.png',
  'dot':      'sprites/classes/dot.png',
  'energy':   'sprites/classes/energy.png',
  'reload':   'sprites/classes/reload.png',

  'cadence-light':  'sprites/classes/light_cadence.png',
  'cadence-balanced':'sprites/classes/medium_cadence.png',
  'cadence-heavy':  'sprites/classes/heavy_cadence.png',

  'cooldown-light':  'sprites/classes/light_cooldown.png',
  'cooldown-balanced':'sprites/classes/medium_cooldown.png',
  'cooldown-heavy':  'sprites/classes/heavy_cooldown.png',
  
  'dot-light':  'sprites/classes/light_dot.png',
  'dot-balanced':'sprites/classes/medium_dot.png',
  'dot-heavy':  'sprites/classes/heavy_dot.png',

  'energy-light':  'sprites/classes/light_energy.png',
  'energy-balanced':'sprites/classes/medium_energy.png',
  'energy-heavy':  'sprites/classes/heavy_energy.png',
  
  'reload-light':  'sprites/classes/light_reload.png',
  'reload-balanced':'sprites/classes/medium_reload.png',
  'reload-heavy':  'sprites/classes/heavy_reload.png',

  'cadence-range-close': 'sprites/classes/in-fighter.png',
  'cadence-range-mid':   'sprites/classes/lancer.png',
  'cadence-range-far':   'sprites/classes/phantom-blade.png',

  'cooldown-range-close': 'sprites/classes/vanguard.png',
  'cooldown-range-mid':   'sprites/classes/phalanx.png',
  'cooldown-range-far':   'sprites/classes/sentinel.png',

  'dot-range-close': 'sprites/classes/hexblade.png',
  'dot-range-mid':   'sprites/classes/warlock.png',
  'dot-range-far':   'sprites/classes/harbinger.png',

  'energy-range-close': 'sprites/classes/haunt.png',
  'energy-range-mid':   'sprites/classes/shade.png',
  'energy-range-far':   'sprites/classes/wisp.png',

  'reload-range-close': 'sprites/classes/breacher.png',
  'reload-range-mid':   'sprites/classes/enforcer.png',
  'reload-range-far':   'sprites/classes/deadeye.png',
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
  'plains-slime': 'sprites/monsters/yellowslime.png',
  'boar':         'sprites/monsters/boar.png',

  // ── T1: Forest ──────────────────────────────────────────────────────────────
  'forest-slime': 'sprites/monsters/greenslime.png',
  'wolf':         'sprites/monsters/wolf.png',

  // ── T1: Mountain ────────────────────────────────────────────────────────────
  'cliff-hopper': 'sprites/monsters/jumper.png',
  'ridge-archer': 'sprites/monsters/archer.png',

  // ── T1: Swamp ────────────────────────────────────────────────────────────────
  'bog-slime':    'sprites/monsters/swampslime.png',
  'mud-toad':     'sprites/monsters/frog.png',

  // ── T1: Cave ─────────────────────────────────────────────────────────────────
  'cave-lurker':  'sprites/monsters/crawler.png',
  'cave-brute':   'sprites/monsters/brute.png',

  // ── T1 bosses ────────────────────────────────────────────────────────────────
  'tusked-razorback':    'sprites/bosses/boss-plains-t1.png',
  'gnarled-greatbear':   'sprites/bosses/boss-forest-t1.png',
  'crag-behemoth':       'sprites/bosses/boss-mountain-t1.png',
  'grave-toadeater':     'sprites/bosses/boss-swamp-t1.png',
  'obsidian-broodmother':'sprites/bosses/boss-cave-t1.png',

  // ── T2: Plains ──────────────────────────────────────────────────────────────
  'prairie-wolf':   'sprites/monsters/prairie-wolf.png',
  'stampede-bull':  'sprites/monsters/stampede-bull.png',
  'savanna-hawk':   'sprites/monsters/savanna-hawk.png',

  // ── T2: Forest ──────────────────────────────────────────────────────────────
  'ancient-wolf':   'sprites/monsters/ancient-wolf.png',
  'ironwood-golem': 'sprites/monsters/ironwood-golem.png',
  'canopy-sprite':  'sprites/monsters/canopy-sprite.png',

  // ── T2: Mountain ────────────────────────────────────────────────────────────
  'granite-titan':  'sprites/monsters/granite-titan.png',
  'stone-eagle':    'sprites/monsters/stone-eagle.png',
  'peak-archer':    'sprites/monsters/peak-archer.png',

  // ── T2: Swamp ────────────────────────────────────────────────────────────────
  'swamp-hydra':    'sprites/monsters/swamp-hydra.png',
  'bog-witch':      'sprites/monsters/bog-witch.png',
  'mire-stalker':   'sprites/monsters/mire-stalker.png',

  // ── T2: Cave ─────────────────────────────────────────────────────────────────
  'giant-spider':   'sprites/monsters/giant-spider.png',
  'cave-troll':     'sprites/monsters/cave-troll.png',
  'cave-gargoyle':  'sprites/monsters/cave-gargoyle.png',

  // ── T2: Jungle ───────────────────────────────────────────────────────────────
  'jungle-snake':      'sprites/monsters/jungle-snake.png',
  'jungle-ape':        'sprites/monsters/jungle-ape.png',
  'jungle-blowdarter': 'sprites/monsters/jungle-blowdarter.png',

  // ── T2: Desert ───────────────────────────────────────────────────────────────
  'sand-scorpion':  'sprites/monsters/sand-scorpion.png',
  'stone-basilisk': 'sprites/monsters/stone-basilisk.png',
  'dust-djinn':     'sprites/monsters/dust-djinn.png',

  // ── T2 bosses ────────────────────────────────────────────────────────────────
  'gorging-razortusk':     'sprites/bosses/boss-plains-t2.png',
  'apex-timberclaw':       'sprites/bosses/boss-forest-t2.png',
  'stoneplate-juggernaut': 'sprites/bosses/boss-mountain-t2.png',
  'mire-gorged-behemoth':  'sprites/bosses/boss-swamp-t2.png',
  'chitinous-dreadbore':   'sprites/bosses/boss-cave-t2.png',
  'dune-stalker-emperor':  'sprites/bosses/boss-desert-t2.png',
  'jungle-dread-gorger':   'sprites/bosses/boss-jungle-t2.png',

  // ── T3: Mountain ─────────────────────────────────────────────────────────────
  'mountain-colossus': 'sprites/monsters/mountain-colossus.png',
  'avalanche-ram':     'sprites/monsters/avalanche-ram.png',
  'crag-mortar':       'sprites/monsters/crag-mortar.png',

  // ── T3: Cave ─────────────────────────────────────────────────────────────────
  'deep-spider':      'sprites/monsters/deep-spider.png',
  'cavern-troll':     'sprites/monsters/cavern-troll.png',
  'crystal-gargoyle': 'sprites/monsters/crystal-gargoyle.png',

  // ── T3: Swamp ────────────────────────────────────────────────────────────────
  'plague-hydra': 'sprites/monsters/plague-hydra.png',
  'bog-lurker':   'sprites/monsters/bog-lurker.png',
  'mire-hex-spitter': 'sprites/monsters/mire-hex-spitter.png',

  // ── T3: Jungle ───────────────────────────────────────────────────────────────
  'jungle-stalker':  'sprites/monsters/jungle-stalker.png',
  'silverback':      'sprites/monsters/silverback.png',
  'canopy-harrier':  'sprites/monsters/canopy-harrier.png',

  // ── T3: Desert ───────────────────────────────────────────────────────────────
  'dune-stalker':    'sprites/monsters/dune-stalker.png',
  'desert-basilisk': 'sprites/monsters/desert-basilisk.png',
  'sandweaver':      'sprites/monsters/sand-weaver.png',

  // ── T3: Volcano ──────────────────────────────────────────────────────────────
  'cinder-hound': 'sprites/monsters/cinder-hound.png',
  'magma-brute':  'sprites/monsters/magma-brute.png',
  'ash-slinger':  'sprites/monsters/ash-slinger.png',
  'ember-scuttler': 'sprites/monsters/ember-scuttler.png',

  // ── T3: Tundra ───────────────────────────────────────────────────────────────
  'frost-lurker': 'sprites/monsters/frost-lurker.png',
  'glacier-bear': 'sprites/monsters/glacier-bear.png',
  'rime-caster':  'sprites/monsters/rime-caster.png',

  // ── T3 bosses ────────────────────────────────────────────────────────────────
  'crag-gorged-horn-behemoth':    'sprites/bosses/boss-mountain-t3.png',
  'deep-core-burrow-gorger':      'sprites/bosses/boss-cave-t3.png',
  'rot-spore-croc-behemoth':      'sprites/bosses/boss-swamp-t3.png',
  'dune-carapace-monarch':        'sprites/bosses/boss-desert-t3.png',
  'apex-bramble-slasher':         'sprites/bosses/boss-jungle-t3.png',
  'cinder-shell-magma-salamander':'sprites/bosses/boss-volcano-t3.png',
  'frost-plated-rime-mammoth':    'sprites/bosses/boss-tundra-t3.png',

  // ── T4: Mountain ─────────────────────────────────────────────────────────────
  'granite-mammoth':  'sprites/monsters/T4/mountain_elephant.png',
  'avalanche-tyrant': 'sprites/monsters/T4/mountain_ram.png',
  'cliffside-roc':    'sprites/monsters/T4/mountain_roc.png',
  'cragback-rhino':   'sprites/monsters/T4/mountain_dino.png',

  // ── T4: Tundra ───────────────────────────────────────────────────────────────
  'rime-tusk-mastodon':  'sprites/monsters/T4/tundra_mammoth.png',
  'glacial-direbear':    'sprites/monsters/T4/tundra_bear.png',
  'permafrost-behemoth': 'sprites/monsters/T4/mountain_big.png',

  // ── T4: Volcano ──────────────────────────────────────────────────────────────
  'ember-skink':          'sprites/monsters/T4/volcano_tiny_lizard.png',
  'infernal-direhound':   'sprites/monsters/T4/volcano_dog.png',
  'obsidian-tortoise':    'sprites/monsters/T4/volcano_turtle.png',
  'ashspitter-salamander':'sprites/monsters/T4/volcano_spitter.png',
  'magma-salamander':     'sprites/monsters/T4/volcano_lizard.png',

  // ── T4: Graveyard ────────────────────────────────────────────────────────────
  'bone-crawler':   'sprites/monsters/T4/graveyard_skeleton.png',
  'plague-hound':   'sprites/monsters/T4/graveyard_dog.png',
  'carrion-vulture':'sprites/monsters/T4/graveyard_vulture.png',
  'charnel-brute':  'sprites/monsters/T4/graveyard_gigaskeleton.png',
  'plague-rat':     'sprites/monsters/T4/graveyard_rat.png',

  // ── T4: Jungle ───────────────────────────────────────────────────────────────
  'hunting-panther':  'sprites/monsters/T4/jungle_panther.png',
  'apex-silverback':  'sprites/monsters/T4/jungle_silverback.png',
  'thornback-lizard': 'sprites/monsters/T4/jungle_iguana.png',
  'emerald-constrictor':'sprites/monsters/T4/jungle_snake.png',

  // ── T4: Desert ───────────────────────────────────────────────────────────────
  'sand-viper':       'sprites/monsters/T4/desert_snake.png',
  'sandspitter-cobra':'sprites/monsters/T4/desert_cobra.png',
  'dune-basilisk':    'sprites/monsters/T4/desert_iguana.png',

  // ── T4: Trench ───────────────────────────────────────────────────────────────
  'abyssal-serpent': 'sprites/monsters/T4/trench_serpent.png',
  'hadal-stalker':   'sprites/monsters/T4/trench_crab.png',
  'elder-leviathan': 'sprites/monsters/T4/trench_demon.png',

  // ── T4 bosses ────────────────────────────────────────────────────────────────
  'iron-crest-titan':       'sprites/bosses/t4-mountain-boss.png',
  'dune-throne-sovereign':  'sprites/bosses/t4-desert-boss.png',
  'verdant-crown-predator': 'sprites/bosses/t4-jungle-boss.png',
  'glacial-patriarch':      'sprites/bosses/t4-tundra-boss.png',
  'caldera-sovereign':      'sprites/bosses/t4-volcano-boss.png',
  'charnel-crown-sovereign':'sprites/bosses/t4-graveyard-boss.png',
  'elder-trench-serpent':   'sprites/bosses/t4-trench-boss.png',

  // ── Summoner minion ──────────────────────────────────────────────────────────
  'slime':      'sprites/monsters/swampslime.png',
  'tiny-slime': 'sprites/monsters/tinyslime.png',
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
