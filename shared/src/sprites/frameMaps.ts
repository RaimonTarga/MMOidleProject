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
  'summoner': 'sprites/classes/summoner.png',

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

  // ── Tier 3 ───────────────────────────────────────────────────────────────
  // One frame per SPEC (45 = 5 classes x 3 frames x 3 specs), produced
  // deterministically from the tier-2 bodies by art/workbench/roster/t3.mjs:
  // same silhouette, recoloured to a per-spec hue. Generating 15 T3 bodies was
  // considered and dropped — img2img at the strength that keeps a body
  // recognisable just reprints it, so it would have cost hours of review for a
  // barely visible delta. The specs that genuinely break the class silhouette
  // (Assassin, Devout Priest, Voidwalker, ...) are meant to get real generated
  // bodies later; they slot in here by overriding these same keys.
  // Conduit is absent on purpose: placeholder class pending rework.

  // Striker
  'cadence-light-t3-a':         'sprites/classes/light_cadence_t3a.png',
  'cadence-light-t3-b':         'sprites/classes/light_cadence_t3b.png',
  'cadence-light-t3-c':         'sprites/classes/light_cadence_t3c.png',
  'cadence-balanced-t3-a':      'sprites/classes/medium_cadence_t3a.png',
  'cadence-balanced-t3-b':      'sprites/classes/medium_cadence_t3b.png',
  'cadence-balanced-t3-c':      'sprites/classes/medium_cadence_t3c.png',
  'cadence-heavy-t3-a':         'sprites/classes/heavy_cadence_t3a.png',
  'cadence-heavy-t3-b':         'sprites/classes/heavy_cadence_t3b.png',
  'cadence-heavy-t3-c':         'sprites/classes/heavy_cadence_t3c.png',

  // Squire
  'cooldown-light-t3-a':        'sprites/classes/light_cooldown_t3a.png',
  'cooldown-light-t3-b':        'sprites/classes/light_cooldown_t3b.png',
  'cooldown-light-t3-c':        'sprites/classes/light_cooldown_t3c.png',
  'cooldown-balanced-t3-a':     'sprites/classes/medium_cooldown_t3a.png',
  'cooldown-balanced-t3-b':     'sprites/classes/medium_cooldown_t3b.png',
  'cooldown-balanced-t3-c':     'sprites/classes/medium_cooldown_t3c.png',
  'cooldown-heavy-t3-a':        'sprites/classes/heavy_cooldown_t3a.png',
  'cooldown-heavy-t3-b':        'sprites/classes/heavy_cooldown_t3b.png',
  'cooldown-heavy-t3-c':        'sprites/classes/heavy_cooldown_t3c.png',

  // Apprentice
  'dot-light-t3-a':             'sprites/classes/light_dot_t3a.png',
  'dot-light-t3-b':             'sprites/classes/light_dot_t3b.png',
  'dot-light-t3-c':             'sprites/classes/light_dot_t3c.png',
  'dot-balanced-t3-a':          'sprites/classes/medium_dot_t3a.png',
  'dot-balanced-t3-b':          'sprites/classes/medium_dot_t3b.png',
  'dot-balanced-t3-c':          'sprites/classes/medium_dot_t3c.png',
  'dot-heavy-t3-a':             'sprites/classes/heavy_dot_t3a.png',
  'dot-heavy-t3-b':             'sprites/classes/heavy_dot_t3b.png',
  'dot-heavy-t3-c':             'sprites/classes/heavy_dot_t3c.png',

  // Slinger
  'reload-light-t3-a':          'sprites/classes/light_reload_t3a.png',
  'reload-light-t3-b':          'sprites/classes/light_reload_t3b.png',
  'reload-light-t3-c':          'sprites/classes/light_reload_t3c.png',
  'reload-balanced-t3-a':       'sprites/classes/medium_reload_t3a.png',
  'reload-balanced-t3-b':       'sprites/classes/medium_reload_t3b.png',
  'reload-balanced-t3-c':       'sprites/classes/medium_reload_t3c.png',
  'reload-heavy-t3-a':          'sprites/classes/heavy_reload_t3a.png',
  'reload-heavy-t3-b':          'sprites/classes/heavy_reload_t3b.png',
  'reload-heavy-t3-c':          'sprites/classes/heavy_reload_t3c.png',

  // Spirit
  'energy-light-t3-a':          'sprites/classes/light_energy_t3a.png',
  'energy-light-t3-b':          'sprites/classes/light_energy_t3b.png',
  'energy-light-t3-c':          'sprites/classes/light_energy_t3c.png',
  'energy-balanced-t3-a':       'sprites/classes/medium_energy_t3a.png',
  'energy-balanced-t3-b':       'sprites/classes/medium_energy_t3b.png',
  'energy-balanced-t3-c':       'sprites/classes/medium_energy_t3c.png',
  'energy-heavy-t3-a':          'sprites/classes/heavy_energy_t3a.png',
  'energy-heavy-t3-b':          'sprites/classes/heavy_energy_t3b.png',
  'energy-heavy-t3-c':          'sprites/classes/heavy_energy_t3c.png',

  'summoner-light':  'sprites/classes/light_summoner.png',
  'summoner-balanced':'sprites/classes/medium_summoner.png',
  'summoner-heavy':  'sprites/classes/heavy_summoner.png',

  // Conduit tier-3 specializations. Generated bodies like the other five
  // classes, but chained at initImageStrength 65 rather than 75: the Conduit
  // parents are a plain robe column with no internal parts to reinterpret, so
  // at 75 the chain reprinted the robe and two rounds were rejected as
  // "too similar to the original".
  'summoner-light-t3-a':        'sprites/classes/light_summoner_t3a.png',
  'summoner-light-t3-b':        'sprites/classes/light_summoner_t3b.png',
  'summoner-light-t3-c':        'sprites/classes/light_summoner_t3c.png',
  'summoner-balanced-t3-a':     'sprites/classes/medium_summoner_t3a.png',
  'summoner-balanced-t3-b':     'sprites/classes/medium_summoner_t3b.png',
  'summoner-balanced-t3-c':     'sprites/classes/medium_summoner_t3c.png',
  'summoner-heavy-t3-a':        'sprites/classes/heavy_summoner_t3a.png',
  'summoner-heavy-t3-b':        'sprites/classes/heavy_summoner_t3b.png',
  'summoner-heavy-t3-c':        'sprites/classes/heavy_summoner_t3c.png',
};

/** Key: monsterTypeId (matches MONSTER_DATABASE keys exactly).
 *
 * Note: the `conduit-summon*` keys are the Conduit's summons. They are NOT
 * `MonsterDefinition` entries — they render as minion entities and their attack
 * style comes from the formation's attack mode, not a monster lookup.
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
  // Shares the adult frame for now, exactly as `young-wolf` shared `wolf.png` before it
  // earned its own smaller-silhouette sprite. Art pass can split it the same way.
  'prairie-yearling': 'sprites/monsters/prairie-wolf.png',
  'stampede-bull':  'sprites/monsters/stampede-bull.png',
  'savanna-hawk':   'sprites/monsters/savanna-hawk.png',

  // ── T2: Forest ──────────────────────────────────────────────────────────────
  'ancient-wolf':   'sprites/monsters/ancient-wolf.png',   // display: Dire Wolf
  'ironwood-golem': 'sprites/monsters/ironclaw-badger.png', // display: Ironclaw Badger
  'canopy-sprite':  'sprites/monsters/thorn-spitter.png',   // display: Thorn Spitter
  // Shares the adult frame until the art pass splits it, as `young-wolf` once did.
  'dire-whelp':     'sprites/monsters/ancient-wolf.png',

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

  // ── Conduit summons ──────────────────────────────────────────────────────────
  // Root keeps the original body. Frames and specializations resolve to their
  // own bound familiar; range remains a tint/scale layer and never swaps art.
  'conduit-summon':                    'sprites/monsters/conduit-summon.png',
  'conduit-summon-splinter':           'sprites/monsters/conduit-summon-splinter.png',
  'conduit-summon-inquisitor':         'sprites/monsters/conduit-summon-inquisitor.png',
  'conduit-summon-kilnmaster':         'sprites/monsters/conduit-summon-kilnmaster.png',
  'conduit-summon-iconoclast':         'sprites/monsters/conduit-summon-iconoclast.png',
  'conduit-summon-consort':            'sprites/monsters/conduit-summon-consort.png',
  'conduit-summon-marshal':            'sprites/monsters/conduit-summon-marshal.png',
  'conduit-summon-chorister':          'sprites/monsters/conduit-summon-chorister.png',
  'conduit-summon-ritualist':          'sprites/monsters/conduit-summon-ritualist.png',
  'conduit-summon-effigy':             'sprites/monsters/conduit-summon-effigy.png',
  'conduit-summon-covenanter-offense': 'sprites/monsters/conduit-summon-covenanter-offense.png',
  'conduit-summon-covenanter-defense': 'sprites/monsters/conduit-summon-covenanter-defense.png',
  'conduit-summon-champion':           'sprites/monsters/conduit-summon-champion.png',
  'conduit-summon-idolwright':         'sprites/monsters/conduit-summon-idolwright.png',

  'tiny-slime': 'sprites/monsters/tiny-wisp.png', // display: Tiny Wisp (T0 tutorial monster)
};

const VARIANTS = ['light', 'balanced', 'heavy'] as const;

/**
 * Returns the atlas frame name for a player.
 * Resolution order: '{archetype}-{variant}-t3-{spec}' → '{archetype}-{variant}-t3'
 * → '{archetype}-{variant}' → '{archetype}' → 'default' → null.
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
      // T3 resolves by the full spec node id first, so two specs on the same
      // class-frame (Berserker vs Hemomancer, both Striker heavy) can differ.
      // Falls back to a generic per-class-frame T3 key if one is ever authored.
      const t3Node = input.unlockedSkills.find(s =>
        s.startsWith(`${input.combatArchetype}-${variant}-t3`),
      );
      if (t3Node) {
        const specFrame = PLAYER_FRAMES[t3Node];
        if (specFrame) return specFrame;
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
 * BURROWED bodies — the form a monster wears while `concealed: 'burrow'`.
 *
 * A separate map rather than a suffix convention on MONSTER_FRAMES, so that a
 * lineage can burrow without art existing yet: the renderer checks the atlas for
 * the resolved frame and falls back to sinking and dimming the ordinary body when
 * it is missing. That keeps the mechanic shippable ahead of the sprite, and makes
 * dropping the sprite in later a one-line change here.
 */
export const MONSTER_BURROW_FRAMES: Record<string, string> = {
  // ONE burrowed body shared by both Cave burrowers. A mound of disturbed rock
  // reads as the same event at either tier, and the tiers are already separated by
  // the sequence around it — the T3 burrow is longer, faster and wider. Bespoke
  // mounds would be two assets spent distinguishing a silhouette the player sees
  // for under two seconds.
  'chitinous-dreadbore':     'sprites/bosses/boss-cave-burrowed.png',
  'deep-core-burrow-gorger': 'sprites/bosses/boss-cave-burrowed.png',
};

export function resolveMonsterBurrowFrame(monsterTypeId: string): string | null {
  return MONSTER_BURROW_FRAMES[monsterTypeId] ?? null;
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
 * unlockedSkills). The resolver and client layer are wired so entries here show
 * up with zero further code.
 *
 * RANGE (bible §11): range choice never swaps the body, it renders as a small
 * prop seated on the head. All three carry one: a forged RING whose treatment
 * says the range — close is a heavy solid band, mid an open notched ring, far
 * a shattered one. The headpiece loses material as range grows.
 *
 * There are 18 props, not 3: every class gets its own asymmetric signature
 * mark on the ring (Striker beat-marks, Squire rivet plate, Apprentice
 * drooping venom thorns, Slinger sight-pin, Spirit dissolving back arc,
 * Conduit tethered fragment). Bespoke art per class costs the same as shared
 * art when it is drawn in code rather than generated — see
 * art/workbench/accents/build.mjs.
 * Overlays are authored near-white in code (`art/workbench/accents/build.mjs`,
 * not generated — they are abstract glows, not character art) and coloured here
 * per class, so the same two frames serve twelve entries.
 *
 * Tints follow each class's identity hue after the 2026-07-25 colour pass. The
 * Conduit is the one deliberate mismatch: its body is red, so its accent takes
 * bible §21's teal/lantern light instead — two-tone identity, and it keeps the
 * accent from colliding with the Striker's crimson.
 */
export const PLAYER_ACCENTS: Record<string, PlayerAccent> = {
  // Close — a heavy solid ring: most material, clamped on the head.
  'cadence-range-close':    { frame: 'sprites/accents/crest-close-cadence.png', color: 0xd94b4b },
  'cooldown-range-close':   { frame: 'sprites/accents/crest-close-cooldown.png', color: 0xc9d8e8 },
  'dot-range-close':        { frame: 'sprites/accents/crest-close-dot.png', color: 0x7fd05a },
  'reload-range-close':     { frame: 'sprites/accents/crest-close-reload.png', color: 0xe8b44a },
  'energy-range-close':     { frame: 'sprites/accents/crest-close-energy.png', color: 0xdcecff },
  'summoner-range-close':   { frame: 'sprites/accents/crest-close-summoner.png', color: 0x4ad4c8 },

  // Mid — an open notched ring.
  'cadence-range-mid':      { frame: 'sprites/accents/crest-mid-cadence.png', color: 0xd94b4b },
  'cooldown-range-mid':     { frame: 'sprites/accents/crest-mid-cooldown.png', color: 0xc9d8e8 },
  'dot-range-mid':          { frame: 'sprites/accents/crest-mid-dot.png', color: 0x7fd05a },
  'reload-range-mid':       { frame: 'sprites/accents/crest-mid-reload.png', color: 0xe8b44a },
  'energy-range-mid':       { frame: 'sprites/accents/crest-mid-energy.png', color: 0xdcecff },
  'summoner-range-mid':     { frame: 'sprites/accents/crest-mid-summoner.png', color: 0x4ad4c8 },

  // Far — a shattered ring: arcs with jagged shard ends.
  'cadence-range-far':      { frame: 'sprites/accents/crest-far-cadence.png', color: 0xd94b4b },
  'cooldown-range-far':     { frame: 'sprites/accents/crest-far-cooldown.png', color: 0xc9d8e8 },
  'dot-range-far':          { frame: 'sprites/accents/crest-far-dot.png', color: 0x7fd05a },
  'reload-range-far':       { frame: 'sprites/accents/crest-far-reload.png', color: 0xe8b44a },
  'energy-range-far':       { frame: 'sprites/accents/crest-far-energy.png', color: 0xdcecff },
  'summoner-range-far':     { frame: 'sprites/accents/crest-far-summoner.png', color: 0x4ad4c8 },
};

/**
 * Range's hue signature on the Conduit's summons, the colour half of the
 * treatment whose size half is `SummonerRangeTuning.sizeMult`.
 *
 * A warm / violet / cool triad, chosen to be separable at 20px rather than to
 * sit on a gradient. Vigil warms toward the Conduit's deep red robe (he keeps
 * his summons close); Procession takes a ceremonial pale violet; Harrier cools
 * toward the teal lantern light (he casts them out). Deliberately light
 * multiplicative tints — the summon body is near-white bone, so anything
 * saturated would swamp it.
 *
 * Resolved client-side from the OWNER's unlocked skills; tint is pure
 * presentation, so it needs no protocol field.
 */
export const SUMMON_RANGE_TINT: Record<string, number> = {
  'summoner-range-close': 0xffd0bc, // Vigil — warm, lit by the bearer
  'summoner-range-mid':   0xcdbde8, // Procession — ceremonial pale violet
  'summoner-range-far':   0xa8e8e0, // Harrier — cool, lit only by its own light
};

/** Tint for an owner's summons; white (no tint) when no range is unlocked. */
export function resolveSummonTint(unlockedSkills: readonly string[]): number {
  for (let i = unlockedSkills.length - 1; i >= 0; i--) {
    const tint = SUMMON_RANGE_TINT[unlockedSkills[i]!];
    if (tint !== undefined) return tint;
  }
  return 0xffffff;
}

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
