// Keys: 'default', '{archetype}', '{archetype}-{variant}', or '{archetype}-{variant}-t3'.
//
// Player bodies are FLAT frames produced by img2img evolution chains
// (vagrant → class root → frame), not composited parts — see
// docs/player-sprites-current-state.md. Range choice and path/tier identity
// never swap the body; they render as identity accents (resolvePlayerAccent).
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
};

/** Key: monsterTypeId (matches MONSTER_DATABASE keys exactly).
 *
 * Note: `slime` is the summoner-archetype minion. It is not a `MonsterDefinition`
 * entry — it is rendered as a minion entity, aliased to the Tiny Wisp sprite
 * (a conjured spirit mote; a placeholder until the Conduit identity pass).
 *
 * Frame names must match the keys in sprites.json exactly (free-tex-packer
 * preserves the full relative path including the `sprites/` folder prefix).
 */
export const MONSTER_FRAMES: Record<string, string> = {
  // ── T1: Plains ──────────────────────────────────────────────────────────────
  'plains-slime': 'sprites/monsters/field-hare.png', // display: Field Hare
  'boar':         'sprites/monsters/boar.png',

  // ── T1: Forest ──────────────────────────────────────────────────────────────
  'forest-slime': 'sprites/monsters/moss-rat.png', // display: Moss Rat
  'wolf':         'sprites/monsters/wolf.png',
  'young-wolf':   'sprites/monsters/young-wolf.png',

  // ── T1: Mountain ────────────────────────────────────────────────────────────
  'cliff-hopper': 'sprites/monsters/cliff-hopper.png',   // mountain goat (caprine line)
  'ridge-archer': 'sprites/monsters/ridge-ambusher.png', // display: Ridge Ambusher

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
  'ancient-wolf':   'sprites/monsters/ancient-wolf.png',   // display: Dire Wolf
  'ironwood-golem': 'sprites/monsters/ironclaw-badger.png', // display: Ironclaw Badger
  'canopy-sprite':  'sprites/monsters/thorn-spitter.png',   // display: Thorn Spitter

  // ── T2: Mountain ────────────────────────────────────────────────────────────
  'granite-titan':  'sprites/monsters/granite-titan.png',
  'stone-eagle':    'sprites/monsters/stone-eagle.png',
  'peak-archer':    'sprites/monsters/peak-archer.png',

  // ── T2: Swamp ────────────────────────────────────────────────────────────────
  'swamp-hydra':    'sprites/monsters/moss-shell-snapper.png', // display: Moss-Shell Snapper
  'bog-witch':      'sprites/monsters/bog-witch.png',
  'mire-stalker':   'sprites/monsters/mire-stalker.png',

  // ── T2: Cave ─────────────────────────────────────────────────────────────────
  'giant-spider':   'sprites/monsters/giant-spider.png',
  'cave-troll':     'sprites/monsters/cave-troll.png',
  'cave-gargoyle':  'sprites/monsters/cave-gargoyle.png',

  // ── T2: Jungle ───────────────────────────────────────────────────────────────
  'jungle-snake':      'sprites/monsters/jungle-snake.png',
  'jungle-ape':        'sprites/monsters/jungle-ape.png',
  'jungle-blowdarter': 'sprites/monsters/vine-chameleon.png', // display: Vine Chameleon

  // ── T2: Desert ───────────────────────────────────────────────────────────────
  'sand-scorpion':  'sprites/monsters/sand-scorpion.png',
  'stone-basilisk': 'sprites/monsters/stone-basilisk.png',
  'dust-djinn':     'sprites/monsters/sun-scarab.png', // display: Sun Scarab

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
  'plague-hydra': 'sprites/monsters/plague-shell-snapper.png', // display: Plague-Shell Snapper
  'bog-lurker':   'sprites/monsters/bog-lurker.png',
  'mire-hex-spitter': 'sprites/monsters/mire-hex-spitter.png',

  // ── T3: Jungle ───────────────────────────────────────────────────────────────
  'jungle-stalker':  'sprites/monsters/jungle-stalker.png',
  'silverback':      'sprites/monsters/silverback.png',
  'canopy-harrier':  'sprites/monsters/canopy-chameleon.png', // display: Canopy Chameleon

  // ── T3: Desert ───────────────────────────────────────────────────────────────
  'dune-stalker':    'sprites/monsters/dune-stalker.png',
  'desert-basilisk': 'sprites/monsters/desert-basilisk.png',
  'sandweaver':      'sprites/monsters/gilded-scarab.png', // display: Gilded Scarab

  // ── T3: Volcano ──────────────────────────────────────────────────────────────
  'cinder-hound': 'sprites/monsters/cinder-hound.png',
  'magma-brute':  'sprites/monsters/magma-tortoise.png', // display: Magma Tortoise
  'ash-slinger':  'sprites/monsters/ash-salamander.png', // display: Ash Salamander
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
  'granite-mammoth':  'sprites/monsters/granite-mammoth.png',
  'avalanche-tyrant': 'sprites/monsters/avalanche-tyrant.png',
  'cliffside-roc':    'sprites/monsters/cliffside-roc.png',
  'cragback-rhino':   'sprites/monsters/cragback-rhino.png',

  // ── T4: Tundra ───────────────────────────────────────────────────────────────
  'rime-tusk-mastodon':  'sprites/monsters/rime-tusk-mastodon.png',
  'glacial-direbear':    'sprites/monsters/glacial-direbear.png',
  'hoarfrost-yeti':      'sprites/monsters/hoarfrost-yeti.png', // first-ever sprite (was unmapped)
  'permafrost-behemoth': 'sprites/monsters/permafrost-behemoth.png',

  // ── T4: Volcano ──────────────────────────────────────────────────────────────
  'ember-skink':          'sprites/monsters/ember-skink.png',
  'infernal-direhound':   'sprites/monsters/infernal-direhound.png',
  'obsidian-tortoise':    'sprites/monsters/obsidian-tortoise.png',
  'ashspitter-salamander':'sprites/monsters/ashspitter-salamander.png',
  'magma-salamander':     'sprites/monsters/magma-salamander.png',

  // ── T4: Graveyard ────────────────────────────────────────────────────────────
  'bone-crawler':   'sprites/monsters/bone-crawler.png',
  'plague-hound':   'sprites/monsters/plague-hound.png',
  'carrion-vulture':'sprites/monsters/carrion-vulture.png',
  'charnel-brute':  'sprites/monsters/charnel-brute.png',
  'plague-rat':     'sprites/monsters/bone-rat.png',   // display: Bone Rat
  'gravewright':    'sprites/monsters/gravewright.png', // first-ever sprite (was unmapped)

  // ── T4: Jungle ───────────────────────────────────────────────────────────────
  'hunting-panther':  'sprites/monsters/hunting-panther.png',
  'apex-silverback':  'sprites/monsters/apex-silverback.png',
  'thornback-lizard': 'sprites/monsters/thornback-lizard.png',
  'emerald-constrictor':'sprites/monsters/emerald-constrictor.png',

  // ── T4: Desert ───────────────────────────────────────────────────────────────
  'sand-viper':       'sprites/monsters/sand-viper.png',
  'sandspitter-cobra':'sprites/monsters/sunshield-scarab.png', // display: Sunshield Scarab
  'dune-basilisk':    'sprites/monsters/dune-basilisk.png',
  'dune-tyrant':      'sprites/monsters/dune-tyrant.png', // first-ever sprite (was unmapped)

  // ── T4: Trench ───────────────────────────────────────────────────────────────
  'abyssal-serpent': 'sprites/monsters/abyssal-serpent.png',
  'hadal-stalker':   'sprites/monsters/hadal-stalker.png',   // giant spider crab
  'elder-leviathan': 'sprites/monsters/elder-leviathan.png', // colossal anglerfish

  // ── T4 bosses ────────────────────────────────────────────────────────────────
  'iron-crest-titan':       'sprites/bosses/boss-mountain-t4.png',
  'dune-throne-sovereign':  'sprites/bosses/boss-desert-t4.png',
  'verdant-crown-predator': 'sprites/bosses/boss-jungle-t4.png',
  'glacial-patriarch':      'sprites/bosses/boss-tundra-t4.png',
  'caldera-sovereign':      'sprites/bosses/boss-volcano-t4.png',
  'charnel-crown-sovereign':'sprites/bosses/boss-graveyard-t4.png',
  'elder-trench-serpent':   'sprites/bosses/boss-trench-t4.png',
  // elder-trench-serpent-warden: intentionally unmapped — Void Overlord fight
  // scrapped pending redesign; no sprite until the rework lands.

  // ── Summoner minion ──────────────────────────────────────────────────────────
  'slime':      'sprites/monsters/tiny-wisp.png', // de-slimed: conjured spirit mote
  'tiny-slime': 'sprites/monsters/tiny-wisp.png', // display: Tiny Wisp (T0 tutorial)
};

const VARIANTS = ['light', 'balanced', 'heavy'] as const;

/**
 * Returns the atlas frame name for a player.
 * Resolution order: '{archetype}-{variant}-t3' → '{archetype}-{variant}' → '{archetype}' → 'default' → null.
 * Range choice deliberately does NOT swap the body (class-frame identity stays
 * visible); it may register an identity accent instead.
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

/**
 * Identity accent — a persistent overlay rendered with the player body (halo,
 * glyph, hand glow) expressing range/path/tier identity WITHOUT swapping the
 * body sprite. Distinct from combat-state auras (PlayerView.aura, transient,
 * server-driven): accents derive from unlocked skills, same inputs as
 * resolvePlayerFrame.
 */
export interface PlayerAccent {
  /** Atlas frame of the overlay sprite (e.g. 'sprites/accents/halo.png'). */
  frame: string;
  /** Optional tint applied to the overlay (accents are authored near-white). */
  color?: number;
}

/**
 * Key: skill node id (range choice, T3 path node, spec node — anything in
 * unlockedSkills). Empty until the path/range identity art pass; the resolver
 * and client layer are wired so entries here show up with zero further code.
 * Example: 'cadence-range-far': { frame: 'sprites/accents/targeting-glyph.png', color: 0xffd27a }.
 */
export const PLAYER_ACCENTS: Record<string, PlayerAccent> = {};

/**
 * Returns the identity accent for a player, or null. The most recently
 * unlocked skill with a registered accent wins, so deeper choices (path over
 * range) naturally take precedence.
 */
export function resolvePlayerAccent(input: {
  combatArchetype: string | null;
  unlockedSkills: string[];
}): PlayerAccent | null {
  for (let i = input.unlockedSkills.length - 1; i >= 0; i--) {
    const accent = PLAYER_ACCENTS[input.unlockedSkills[i]];
    if (accent) return accent;
  }
  return null;
}
