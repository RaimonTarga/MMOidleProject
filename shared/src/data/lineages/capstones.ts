/**
 * Capstone materials — one per biome, dropped by that biome's boss on every kill
 * (design §12). The capstone is the gate cost, and paying the gate is the
 * evolution into the next tier's form, so the boss is the only way up.
 *
 * The wallet is keyed by BIOME (`TracksProgression.capstones`, Phase 2), not by
 * material id: a biome has exactly one capstone material at every tier, so the
 * biome is the identity and the name below is presentation.
 *
 * Shards, by contrast, are keyed by PACKET and shared across biomes — biome
 * identity lives on the lineage, the form art, and the capstone, not on the shard.
 */

export interface CapstoneMaterial {
  /** Wallet key. */
  biome: string;
  /** Player-facing material name. */
  name: string;
  /** The T1 boss that drops it, for the map's boss band and the bestiary. */
  bossMonsterId: string;
  description: string;
}

const capstoneEntries: [string, CapstoneMaterial][] = [
  ['plains', {
    biome: 'plains', name: "Razorback Tusk", bossMonsterId: 'tusked-razorback',
    description: 'Yellowed, cross-hatched with the scars of everything it has charged through.',
  }],
  ['forest', {
    biome: 'forest', name: "Warden's Heart", bossMonsterId: 'gnarled-greatbear',
    description: 'Still warm. The forest keeps one of these beating at a time.',
  }],
  ['mountain', {
    biome: 'mountain', name: 'Behemoth Corestone', bossMonsterId: 'crag-behemoth',
    description: 'A fist of compressed mountain that never quite stops humming.',
  }],
  ['cave', {
    biome: 'cave', name: 'Broodmother Chitin', bossMonsterId: 'obsidian-broodmother',
    description: 'Black plate that turns a blade and remembers the shape of it.',
  }],
  ['swamp', {
    biome: 'swamp', name: 'Toadeater Gland', bossMonsterId: 'grave-toadeater',
    description: 'Heavy, sloshing, and best handled with the gloves on.',
  }],
  ['jungle', {
    biome: 'jungle', name: 'Matriarch Fang', bossMonsterId: 'jungle-dread-gorger',
    description: 'Hollow to the tip, and the hollow is never empty.',
  }],

  // ── Later-tier biomes ───────────────────────────────────────────────────────
  //
  // Added with the T3/T4 weapon forms (design §18.5): a gate is paid in its
  // form's biome capstone, so a biome that hosts a form needs one. `bossMonsterId`
  // is that biome's LOWEST-tier boss, since these biomes have no tier-1 boss at
  // all — the field names who drops it, and a biome has one capstone at every
  // tier.
  ['desert', {
    biome: 'desert', name: 'Emperor Carapace', bossMonsterId: 'dune-stalker-emperor',
    description: 'Sand-polished to a mirror on one side, still raw on the other.',
  }],
  ['tundra', {
    biome: 'tundra', name: 'Rime Heartwood', bossMonsterId: 'frost-plated-rime-mammoth',
    description: 'Frozen so long it rings instead of splintering.',
  }],
  ['volcanic', {
    biome: 'volcanic', name: 'Caldera Clinker', bossMonsterId: 'cinder-shell-magma-salamander',
    description: 'Cooled mid-pour. It holds heat the way a grudge holds a name.',
  }],
  ['graveyard', {
    biome: 'graveyard', name: 'Charnel Crown', bossMonsterId: 'charnel-crown-sovereign',
    description: 'Worn thin by the many heads that wore it, and none of them first.',
  }],
  ['trench', {
    biome: 'trench', name: 'Serpent Lantern', bossMonsterId: 'elder-trench-serpent',
    description: 'Still faintly lit. Nothing down there agreed to be seen.',
  }],
];

export const CAPSTONE_MATERIALS: Map<string, CapstoneMaterial> =
  new Map<string, CapstoneMaterial>(capstoneEntries);

export function capstoneMaterial(biome: string): CapstoneMaterial | undefined {
  return CAPSTONE_MATERIALS.get(biome);
}

/** Player-facing name for a biome's capstone, falling back to the biome itself. */
export function capstoneMaterialName(biome: string): string {
  return CAPSTONE_MATERIALS.get(biome)?.name ?? `${biome} capstone`;
}
