/**
 * Presentation-only mapping from a monster type to a reusable corpse REMAINS
 * sprite: a small family of pre-generated art (bones/carapace/etc.) picked by
 * family + size class rather than authored per monster. Deliberately kept out
 * of the monster combat definitions (shared/src/data/monsters) — this is what
 * a corpse LOOKS like, not what it does. CorpseView already carries
 * `monsterTypeId`, so no server/network change is needed to resolve this.
 *
 * Covers every biome's regular (non-boss) roster whose sprite plausibly reads
 * as one of the 14 approved families (5 skeletal-animal families from wave 1,
 * plus reptile-lizard/serpent/humanoid/shelled-carapace/amphibian/
 * construct-rubble/ooze-residue/aquatic-fish from wave 2, added once Swamp
 * turned out to have ZERO coverage under wave 1 alone). The T0 tutorial Tiny
 * Wisp uses its dedicated dust-residue family under the original internal
 * monster id (`tiny-slime`). Bosses never need remains art (server-side: they
 * never leave a reusable corpse at all — see server/src/systems/world/corpses.ts).
 *
 * Several ids here turned out to visually mismatch their name/lore once the
 * actual sprite was checked (the same trap `bone-crawler` hit): `dust-djinn`
 * (Sun Scarab, a beetle), `dune-tyrant` (a giant scorpion, not a brute),
 * `granite-mammoth` (a literal mammoth despite the "granite" name), and
 * `sandspitter-cobra`/`sandweaver` (both scarab beetles despite "cobra" and
 * "weaver"). Always check the PNG in art/src/sprites/monsters/, not just the
 * id or flavor name, before classifying a new one.
 */

export type CorpseFamily =
  | 'small-beast'
  | 'beast'
  | 'large-beast'
  | 'avian'
  | 'arthropod'
  | 'reptile-lizard'
  | 'serpent'
  | 'humanoid'
  | 'shelled-carapace'
  | 'amphibian'
  | 'construct-rubble'
  | 'ooze-residue'
  | 'aquatic-fish'
  | 'tiny-wisp';

export type CorpseSize = 'small' | 'medium' | 'large';

export interface CorpsePresentation {
  family: CorpseFamily;
  size: CorpseSize;
}

const CORPSE_PRESENTATION: Record<string, CorpsePresentation> = {
  // ── Plains ───────────────────────────────────────────────────────────────
  'plains-slime':     { family: 'small-beast', size: 'small' },  // display "Field Hare"
  'boar':             { family: 'beast',       size: 'medium' },
  'prairie-yearling': { family: 'beast',       size: 'small' },
  'prairie-wolf':     { family: 'beast',       size: 'medium' },
  'stampede-bull':    { family: 'large-beast', size: 'large' },
  'savanna-hawk':     { family: 'avian',       size: 'medium' },

  // ── Forest ───────────────────────────────────────────────────────────────
  'forest-slime':   { family: 'small-beast', size: 'small' },  // display "Moss Rat"
  'wolf':           { family: 'beast',       size: 'medium' },
  'young-wolf':     { family: 'beast',       size: 'small' },
  'ancient-wolf':   { family: 'beast',       size: 'large' },  // display "Dire Wolf"
  'dire-whelp':     { family: 'beast',       size: 'small' },
  // Its sprite is a badger, not a construct — display name "Ironclaw Badger".
  'ironwood-golem': { family: 'beast',       size: 'medium' },
  // Not clearly plant or reptile — generic quadruped skeleton is the closest
  // fit until a dedicated family exists (user call, 2026-09-07).
  'canopy-sprite':  { family: 'beast',       size: 'medium' },  // display "Thorn Spitter"

  // ── Mountain ─────────────────────────────────────────────────────────────
  'cliff-hopper':      { family: 'beast',       size: 'medium' },  // mountain goat
  'stone-eagle':       { family: 'avian',       size: 'medium' },
  'avalanche-ram':     { family: 'beast',       size: 'large' },
  // Its sprite is a literal mammoth despite the "granite" name.
  'granite-mammoth':   { family: 'large-beast', size: 'large' },
  'avalanche-tyrant':  { family: 'beast',       size: 'large' },
  'cliffside-roc':     { family: 'avian',       size: 'large' },
  'cragback-rhino':    { family: 'large-beast', size: 'large' },
  'ridge-archer':      { family: 'humanoid',        size: 'medium' },  // display "Ridge Ambusher"
  'peak-archer':       { family: 'humanoid',        size: 'medium' },  // display "Boulder Thrower"
  'granite-titan':     { family: 'construct-rubble', size: 'medium' },
  'mountain-colossus': { family: 'construct-rubble', size: 'large' },
  'crag-mortar':       { family: 'construct-rubble', size: 'medium' },

  // ── Cave ─────────────────────────────────────────────────────────────────
  'cave-lurker': { family: 'arthropod', size: 'medium' },  // sprite is an isopod/woodlouse
  'giant-spider': { family: 'arthropod', size: 'medium' },
  'deep-spider':  { family: 'arthropod', size: 'large' },
  'cave-brute':      { family: 'humanoid',         size: 'medium' },
  'cave-troll':      { family: 'humanoid',         size: 'large' },
  'cavern-troll':    { family: 'humanoid',         size: 'large' },
  'cave-gargoyle':   { family: 'construct-rubble', size: 'medium' },
  'crystal-gargoyle':{ family: 'construct-rubble', size: 'medium' },

  // ── Jungle ───────────────────────────────────────────────────────────────
  'jungle-ape':       { family: 'beast', size: 'medium' },
  'jungle-stalker':   { family: 'beast', size: 'medium' },  // sprite is a black panther
  'silverback':       { family: 'beast', size: 'large' },
  'hunting-panther':  { family: 'beast', size: 'large' },
  'apex-silverback':  { family: 'beast', size: 'large' },
  'jungle-snake':        { family: 'serpent',        size: 'small' },
  'emerald-constrictor': { family: 'serpent',        size: 'medium' },
  'jungle-blowdarter':   { family: 'reptile-lizard', size: 'small' },   // display "Vine Chameleon"
  'canopy-harrier':      { family: 'reptile-lizard', size: 'medium' },  // display "Canopy Chameleon"
  'thornback-lizard':    { family: 'reptile-lizard', size: 'medium' },  // display "Thornback Chameleon"

  // ── Desert ───────────────────────────────────────────────────────────────
  'sand-scorpion':      { family: 'arthropod', size: 'medium' },
  'dust-djinn':         { family: 'arthropod', size: 'small' },  // display "Sun Scarab"
  'dune-stalker':       { family: 'arthropod', size: 'medium' }, // scorpion-lineage
  'sandweaver':         { family: 'arthropod', size: 'small' },  // display "Gilded Scarab"
  'dune-tyrant':        { family: 'arthropod', size: 'large' },  // sprite is a giant scorpion, not a brute
  'sandspitter-cobra':  { family: 'arthropod', size: 'small' },  // display "Sunshield Scarab", sprite is a beetle
  'stone-basilisk':  { family: 'reptile-lizard', size: 'medium' },
  'desert-basilisk': { family: 'reptile-lizard', size: 'medium' },
  'dune-basilisk':   { family: 'reptile-lizard', size: 'large' },
  'sand-viper':      { family: 'serpent',        size: 'medium' },

  // ── Tundra ───────────────────────────────────────────────────────────────
  'frost-lurker':        { family: 'beast',       size: 'medium' },  // tundra wolverine
  'glacier-bear':        { family: 'beast',       size: 'large' },
  'rime-tusk-mastodon':  { family: 'large-beast', size: 'large' },
  'glacial-direbear':    { family: 'beast',       size: 'large' },
  'permafrost-behemoth': { family: 'large-beast', size: 'large' },  // musk ox
  // Ape-shaped spellcasters — closer to a bipedal humanoid than a plain beast.
  'rime-caster':     { family: 'humanoid', size: 'medium' },
  'hoarfrost-yeti':  { family: 'humanoid', size: 'large' },

  // ── Volcano ──────────────────────────────────────────────────────────────
  'cinder-hound':        { family: 'beast', size: 'medium' },
  'infernal-direhound':  { family: 'beast', size: 'large' },
  'ember-scuttler':        { family: 'reptile-lizard',  size: 'small' },   // young fire skink
  'ember-skink':           { family: 'reptile-lizard',  size: 'medium' },
  'ash-slinger':           { family: 'amphibian',       size: 'medium' },  // display "Ash Salamander"
  'ashspitter-salamander': { family: 'amphibian',       size: 'medium' },
  'magma-salamander':      { family: 'amphibian',       size: 'large' },
  'magma-brute':           { family: 'shelled-carapace', size: 'medium' }, // display "Magma Tortoise"
  'obsidian-tortoise':     { family: 'shelled-carapace', size: 'large' },

  // ── Trench ───────────────────────────────────────────────────────────────
  'hadal-stalker': { family: 'arthropod', size: 'large' },  // sprite is a giant spider crab
  'abyssal-serpent':  { family: 'serpent',      size: 'large' },
  'elder-leviathan':  { family: 'aquatic-fish', size: 'large' },  // colossal anglerfish

  // ── Swamp ────────────────────────────────────────────────────────────────
  // Previously ZERO coverage (the whole roster is reptile/amphibian/witch/
  // ooze) — the wave-2 families fill it in almost completely.
  'bog-slime':       { family: 'ooze-residue',     size: 'small' },   // display "Mire Ooze"
  'mud-toad':        { family: 'amphibian',        size: 'small' },
  'swamp-hydra':     { family: 'shelled-carapace', size: 'medium' },  // display "Moss-Shell Snapper"
  'plague-hydra':    { family: 'shelled-carapace', size: 'large' },   // display "Plague-Shell Snapper"
  'bog-witch':       { family: 'humanoid',         size: 'medium' },
  'mire-hex-spitter':{ family: 'humanoid',         size: 'medium' },  // display "Mire Hexer"
  'mire-stalker':    { family: 'serpent',          size: 'small' },
  'bog-lurker':      { family: 'reptile-lizard',   size: 'medium' },  // swamp crocodile

  // ── Wasteland / Graveyard ───────────────────────────────────────────────
  // Its sprite (art/src/sprites/monsters/bone-crawler.png) is a skeletal
  // quadruped dog, not an insectoid — 'beast' is the correct family, sharing
  // the pool with Plague Hound rather than the (currently unused) arthropod set.
  'bone-crawler':    { family: 'beast',       size: 'medium' },
  'plague-hound':    { family: 'beast',       size: 'medium' },
  'carrion-vulture': { family: 'avian',       size: 'medium' },
  'plague-rat':      { family: 'small-beast', size: 'small' },  // display name "Bone Rat"
  'gravewright':     { family: 'large-beast', size: 'large' },
  // The tutorial's display name is Tiny Wisp, but the authoritative monster id
  // remains tiny-slime from the original tutorial roster.
  'tiny-slime':      { family: 'tiny-wisp',   size: 'small' },
  // charnel-brute is deferred to T5 and not in any active spawn pool — unmapped.
};

/**
 * Initial visual tuning, not a strict requirement. Source art is 64x64 for
 * every family; a Bone Rat's remains must read as visibly smaller than a
 * Gravewright's, so size is driven by this authored class, never HP/tier.
 */
const CORPSE_SIZE_PX: Record<CorpseSize, number> = {
  small: 36,
  medium: 50,
  large: 64,
};

/** How many approved variants exist per family — see art/manifests/corpses.json. */
const FAMILY_VARIANT_COUNT: Record<CorpseFamily, number> = {
  arthropod: 2,
  beast: 2,
  'large-beast': 2,
  avian: 1,
  'small-beast': 1,
  'reptile-lizard': 1,
  serpent: 2,
  humanoid: 4,
  'shelled-carapace': 2,
  amphibian: 3,
  'construct-rubble': 4,
  'ooze-residue': 3,
  'aquatic-fish': 3,
  'tiny-wisp': 5,
};

function remainsFileName(family: CorpseFamily, variant: number): string {
  return variant === 0
    ? `${family}-remains.png`
    : `${family}-remains-variant-${variant + 1}.png`;
}

function remainsTextureKey(family: CorpseFamily, variant: number): string {
  return `corpse-remains-${family}-${variant}`;
}

export interface CorpseRemainsArt {
  key: string;
  file: string;
}

/** Every (family, variant) art file, for preload — see queuePresentationAssets. */
export const CORPSE_REMAINS_ART: CorpseRemainsArt[] = (
  Object.keys(FAMILY_VARIANT_COUNT) as CorpseFamily[]
).flatMap((family) => {
  const count = FAMILY_VARIANT_COUNT[family];
  return Array.from({ length: count }, (_, variant) => ({
    key: remainsTextureKey(family, variant),
    file: `/assets/corpses/${remainsFileName(family, variant)}`,
  }));
});

/**
 * Tiny deterministic string hash — stable across renders (no per-frame or
 * per-load randomness), just enough to spread same-family corpses across
 * their approved variants without any new server state.
 */
function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) hash = (hash * 31 + value.charCodeAt(i)) | 0;
  return Math.abs(hash);
}

/** Direct family/size lookup, or `null` if this monster isn't classified yet. */
export function resolveCorpsePresentation(
  monsterTypeId: string,
): CorpsePresentation | null {
  return CORPSE_PRESENTATION[monsterTypeId] ?? null;
}

export interface ResolvedCorpseRemains {
  /** Preloaded texture key — see CORPSE_REMAINS_ART. */
  key: string;
  /** Target on-screen size in px (square; source art is 64x64). */
  sizePx: number;
}

/**
 * Resolves a corpse's monster type + id to a specific preloaded remains
 * texture and display size, or `null` if the monster has no configured
 * presentation (caller falls back to the plain lozenge).
 */
export function resolveCorpseRemains(
  monsterTypeId: string,
  corpseId: string,
): ResolvedCorpseRemains | null {
  const presentation = resolveCorpsePresentation(monsterTypeId);
  if (!presentation) return null;

  const variantCount = FAMILY_VARIANT_COUNT[presentation.family];
  const variant = variantCount > 1 ? hashString(corpseId) % variantCount : 0;

  return {
    key: remainsTextureKey(presentation.family, variant),
    sizePx: CORPSE_SIZE_PX[presentation.size],
  };
}

export { CORPSE_SIZE_PX };
