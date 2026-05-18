import type { EquipmentSlot, ItemStats, EssenceType } from './items';

export interface Recipe {
  id: string;
  name: string;
  /** Biome group this recipe belongs to — matches the key in PlayerState.recipeProgress. */
  recipeGroup: string;
  /** Minimum recipeProgress[recipeGroup] required to craft. Derived from BIOME_UNLOCK_THRESHOLDS. */
  requiredTier: number;
  slot: EquipmentSlot;
  /** Essence costs keyed by type. Only types with non-zero amounts are listed. */
  cost: Partial<Record<EssenceType, number>>;
  stats: Partial<ItemStats>;
  tier: number;
  /**
   * Weapon slots only. Sets the player's base attack cooldown to round(1000 / aps) ms.
   * See ItemDefinition.attacksPerSecond for full semantics.
   */
  attacksPerSecond?: number;
  description?: string;
}

/**
 * Kill thresholds required to unlock recipe tiers within each biome group.
 * Server checks on every kill; client reads for progress display.
 * Format: biomeGroup → [{ tier, killsRequired }, ...]  ordered by tier.
 *
 * Ring 2-exclusive biomes (tundra/desert/volcanic) still have T1+T2 recipe
 * progression — the recipe tier tracks local progression, not map ring.
 */
export const BIOME_UNLOCK_THRESHOLDS: Record<string, { tier: number; killsRequired: number }[]> = {
  clearing: [{ tier: 1, killsRequired: 2  }],
  forest:   [{ tier: 1, killsRequired: 5  }, { tier: 2, killsRequired: 25 }],
  mountain: [{ tier: 1, killsRequired: 5  }, { tier: 2, killsRequired: 25 }],
  plains:   [{ tier: 1, killsRequired: 5  }, { tier: 2, killsRequired: 25 }],
  swamp:    [{ tier: 1, killsRequired: 5  }, { tier: 2, killsRequired: 25 }],
  cave:     [{ tier: 1, killsRequired: 5  }, { tier: 2, killsRequired: 25 }],
  jungle:   [{ tier: 1, killsRequired: 5  }, { tier: 2, killsRequired: 25 }],
  tundra:   [{ tier: 1, killsRequired: 8  }, { tier: 2, killsRequired: 35 }],
  desert:   [{ tier: 1, killsRequired: 8  }, { tier: 2, killsRequired: 35 }],
  volcanic: [{ tier: 1, killsRequired: 8  }, { tier: 2, killsRequired: 35 }],
};

// ─── Stat scale reference ──────────────────────────────────────────────────────
// T1 ring-1 biomes:  ATK/DEF  8–12,  SPD 20–28,  REGEN 3–5,   cost 15–25 ess
// T2 ring-1 biomes:  ATK/DEF 16–26,  SPD 40–55,  REGEN 7–12,  cost 45–70 ess
// T1 ring-2 biomes:  ATK/DEF 28–32,  SPD 55–62,  REGEN 12–14, cost 65–75 ess
// T2 ring-2 biomes:  ATK/DEF 50–58,  SPD 90–100, REGEN 20–24, cost 105–125 ess

export const RECIPE_DATABASE: Map<string, Recipe> = new Map([

  // ── Clearing (tutorial tier 1) — single green essence ────────────────────
  ['primordial-club', {
    id: 'primordial-club', name: 'Primordial Club',
    recipeGroup: 'clearing', requiredTier: 1, slot: 'weapon',
    cost: { green: 8 }, stats: { attack: 5 }, attacksPerSecond: 0.70, tier: 1,
    description: 'A crude but reliable club — forged on the cheap, never lets you down.',
  }],
  ['clearing-vest-t1', {
    id: 'clearing-vest-t1', name: 'Bark Wrap',
    recipeGroup: 'clearing', requiredTier: 1, slot: 'armor',
    cost: { green: 8 }, stats: { defense: 4 }, tier: 1,
    description: 'Strips of bark bound with twine.',
  }],
  ['clearing-boots-t1', {
    id: 'clearing-boots-t1', name: 'Soft Boots',
    recipeGroup: 'clearing', requiredTier: 1, slot: 'mobility',
    cost: { green: 6 }, stats: { speed: 12 }, tier: 1,
    description: 'Comfortable footwear for early exploration.',
  }],
  ['clearing-charm-t1', {
    id: 'clearing-charm-t1', name: 'Herb Pouch',
    recipeGroup: 'clearing', requiredTier: 1, slot: 'recovery',
    cost: { green: 6 }, stats: { hpRegen: 2 }, tier: 1,
    description: 'A cloth bag of common healing herbs.',
  }],

  // ── Forest T1 — green only ─────────────────────────────────────────────────
  ['flash-rapier', {
    id: 'flash-rapier', name: 'Flash Rapier',
    recipeGroup: 'forest', requiredTier: 1, slot: 'weapon',
    cost: { green: 20 }, stats: { attack: 4 }, attacksPerSecond: 1.50, tier: 1,
    description: 'A needle-thin blade that strikes faster than the eye can follow, but each sting barely bites.',
  }],
  ['forest-vest-t1', {
    id: 'forest-vest-t1', name: 'Bark Vest',
    recipeGroup: 'forest', requiredTier: 1, slot: 'armor',
    cost: { green: 20 }, stats: { defense: 7 }, tier: 1,
    description: 'Hardened bark bound together with forest vines.',
  }],
  ['forest-boots-t1', {
    id: 'forest-boots-t1', name: 'Sprinter Wraps',
    recipeGroup: 'forest', requiredTier: 1, slot: 'mobility',
    cost: { green: 15 }, stats: { speed: 20 }, tier: 1,
    description: 'Light wrappings that free the ankle.',
  }],
  ['forest-charm-t1', {
    id: 'forest-charm-t1', name: 'Moss Charm',
    recipeGroup: 'forest', requiredTier: 1, slot: 'recovery',
    cost: { green: 15 }, stats: { hpRegen: 3 }, tier: 1,
    description: 'A pouch of healing moss that hastens recovery.',
  }],

  // ── Forest T2 — green (primary) + yellow (wolves) ─────────────────────────
  ['forest-blade-t2', {
    id: 'forest-blade-t2', name: 'Ironwood Blade',
    recipeGroup: 'forest', requiredTier: 2, slot: 'weapon',
    cost: { green: 48, yellow: 12 }, stats: { attack: 18 }, attacksPerSecond: 1.0, tier: 2,
    description: 'Forged from the heartwood of an ancient iron-oak.',
  }],
  ['forest-vest-t2', {
    id: 'forest-vest-t2', name: 'Thornweave Vest',
    recipeGroup: 'forest', requiredTier: 2, slot: 'armor',
    cost: { green: 48, yellow: 12 }, stats: { defense: 16 }, tier: 2,
    description: 'Layers of razor-thorn woven into a protective shell.',
  }],
  ['forest-boots-t2', {
    id: 'forest-boots-t2', name: 'Windstep Wraps',
    recipeGroup: 'forest', requiredTier: 2, slot: 'mobility',
    cost: { green: 38, yellow: 10 }, stats: { speed: 40 }, tier: 2,
    description: 'Enchanted wraps that carry the speed of forest winds.',
  }],
  ['forest-charm-t2', {
    id: 'forest-charm-t2', name: 'Heartroot Charm',
    recipeGroup: 'forest', requiredTier: 2, slot: 'recovery',
    cost: { green: 38, yellow: 10 }, stats: { hpRegen: 7 }, tier: 2,
    description: 'Dried heartroot bound at the peak of bloom.',
  }],

  // ── Mountain T1 — blue only ────────────────────────────────────────────────
  ['heavy-hammer', {
    id: 'heavy-hammer', name: 'Heavy Hammer',
    recipeGroup: 'mountain', requiredTier: 1, slot: 'weapon',
    cost: { blue: 22 }, stats: { attack: 16 }, attacksPerSecond: 0.40, tier: 1,
    description: 'A war hammer so heavy it takes both hands — but when it lands, it lands.',
  }],
  ['mountain-vest-t1', {
    id: 'mountain-vest-t1', name: 'Rock Plate',
    recipeGroup: 'mountain', requiredTier: 1, slot: 'armor',
    cost: { blue: 22 }, stats: { defense: 10 }, tier: 1,
    description: 'Flat stone plates lashed over leather.',
  }],
  ['mountain-boots-t1', {
    id: 'mountain-boots-t1', name: 'Iron Treads',
    recipeGroup: 'mountain', requiredTier: 1, slot: 'mobility',
    cost: { blue: 18 }, stats: { speed: 18 }, tier: 1,
    description: 'Reinforced boots that grip loose rock.',
  }],
  ['mountain-charm-t1', {
    id: 'mountain-charm-t1', name: 'Granite Talisman',
    recipeGroup: 'mountain', requiredTier: 1, slot: 'recovery',
    cost: { blue: 18 }, stats: { hpRegen: 4 }, tier: 1,
    description: 'A smooth mountain stone carved with a healing rune.',
  }],

  // ── Mountain T2 — blue (primary) + purple (stone eagle) ───────────────────
  ['mountain-blade-t2', {
    id: 'mountain-blade-t2', name: 'Peak Blade',
    recipeGroup: 'mountain', requiredTier: 2, slot: 'weapon',
    cost: { blue: 52, purple: 13 }, stats: { attack: 22 }, attacksPerSecond: 1.0, tier: 2,
    description: 'Folded high-altitude steel; holds an edge in any cold.',
  }],
  ['mountain-vest-t2', {
    id: 'mountain-vest-t2', name: 'Summit Plate',
    recipeGroup: 'mountain', requiredTier: 2, slot: 'armor',
    cost: { blue: 52, purple: 13 }, stats: { defense: 22 }, tier: 2,
    description: 'A full plate crafted from compressed mountain granite.',
  }],
  ['mountain-boots-t2', {
    id: 'mountain-boots-t2', name: 'Mountain Stride',
    recipeGroup: 'mountain', requiredTier: 2, slot: 'mobility',
    cost: { blue: 42, purple: 10 }, stats: { speed: 45 }, tier: 2,
    description: 'Enchanted treads that turn slopes into flat ground.',
  }],
  ['mountain-charm-t2', {
    id: 'mountain-charm-t2', name: 'Highland Charm',
    recipeGroup: 'mountain', requiredTier: 2, slot: 'recovery',
    cost: { blue: 42, purple: 10 }, stats: { hpRegen: 9 }, tier: 2,
    description: 'A chip of summit crystal that pulses with warmth.',
  }],

  // ── Plains T1 — yellow only ────────────────────────────────────────────────
  ['sacred-cross', {
    id: 'sacred-cross', name: 'Sacred Cross',
    recipeGroup: 'plains', requiredTier: 1, slot: 'weapon',
    cost: { yellow: 20 }, stats: { attack: 6 }, attacksPerSecond: 0.50, tier: 1,
    description: 'A blessed weapon that pulses with divine energy — slow to strike, but every 12s it unleashes a devastating burst.',
  }],
  ['plains-vest-t1', {
    id: 'plains-vest-t1', name: 'Leather Vest',
    recipeGroup: 'plains', requiredTier: 1, slot: 'armor',
    cost: { yellow: 20 }, stats: { defense: 8 }, tier: 1,
    description: 'Tanned boar hide — light and durable.',
  }],
  ['plains-boots-t1', {
    id: 'plains-boots-t1', name: 'Fleet Boots',
    recipeGroup: 'plains', requiredTier: 1, slot: 'mobility',
    cost: { yellow: 16 }, stats: { speed: 25 }, tier: 1,
    description: 'Open-toe sandals built for sprinting across flat ground.',
  }],
  ['plains-charm-t1', {
    id: 'plains-charm-t1', name: 'Prairie Herb',
    recipeGroup: 'plains', requiredTier: 1, slot: 'recovery',
    cost: { yellow: 16 }, stats: { hpRegen: 3 }, tier: 1,
    description: 'Dried prairie herbs that knit wounds slowly but steadily.',
  }],

  // ── Plains T2 — yellow (primary) + red (boar/bull) ────────────────────────
  ['plains-blade-t2', {
    id: 'plains-blade-t2', name: 'Storm Blade',
    recipeGroup: 'plains', requiredTier: 2, slot: 'weapon',
    cost: { yellow: 50, red: 12 }, stats: { attack: 20 }, attacksPerSecond: 1.0, tier: 2,
    description: 'Charged with static from a plains thunderstorm.',
  }],
  ['plains-vest-t2', {
    id: 'plains-vest-t2', name: 'Buffalo Hide',
    recipeGroup: 'plains', requiredTier: 2, slot: 'armor',
    cost: { yellow: 50, red: 12 }, stats: { defense: 18 }, tier: 2,
    description: 'Stampede-bull hide; thick enough to stop a charge.',
  }],
  ['plains-boots-t2', {
    id: 'plains-boots-t2', name: 'Gale Boots',
    recipeGroup: 'plains', requiredTier: 2, slot: 'mobility',
    cost: { yellow: 40, red: 10 }, stats: { speed: 48 }, tier: 2,
    description: 'Wind-woven leather that carries you with every step.',
  }],
  ['plains-charm-t2', {
    id: 'plains-charm-t2', name: 'Wildflower Charm',
    recipeGroup: 'plains', requiredTier: 2, slot: 'recovery',
    cost: { yellow: 40, red: 10 }, stats: { hpRegen: 8 }, tier: 2,
    description: 'A pressed bouquet of rare plains wildflowers.',
  }],

  // ── Swamp T1 — purple only ─────────────────────────────────────────────────
  ['ashbrand-blade', {
    id: 'ashbrand-blade', name: 'Ashbrand Blade',
    recipeGroup: 'swamp', requiredTier: 1, slot: 'weapon',
    cost: { purple: 22 }, stats: { attack: 7 }, attacksPerSecond: 0.75, tier: 1,
    description: 'A blade wreathed in smoldering runes — your strikes leave no wound, only fire that eats from within.',
  }],
  ['swamp-vest-t1', {
    id: 'swamp-vest-t1', name: 'Toad Shell',
    recipeGroup: 'swamp', requiredTier: 1, slot: 'armor',
    cost: { purple: 22 }, stats: { defense: 11 }, tier: 1,
    description: 'A giant mud-toad carapace shaped into a breastplate.',
  }],
  ['swamp-boots-t1', {
    id: 'swamp-boots-t1', name: 'Marsh Treads',
    recipeGroup: 'swamp', requiredTier: 1, slot: 'mobility',
    cost: { purple: 18 }, stats: { speed: 20 }, tier: 1,
    description: 'Wide-soled boots that float on soft ground.',
  }],
  ['swamp-charm-t1', {
    id: 'swamp-charm-t1', name: 'Fungal Pouch',
    recipeGroup: 'swamp', requiredTier: 1, slot: 'recovery',
    cost: { purple: 18 }, stats: { hpRegen: 4 }, tier: 1,
    description: 'A sealed pouch of swamp fungi with restorative spores.',
  }],

  // ── Swamp T2 — purple (primary) + green (bog slime) ───────────────────────
  ['swamp-blade-t2', {
    id: 'swamp-blade-t2', name: 'Venom Blade',
    recipeGroup: 'swamp', requiredTier: 2, slot: 'weapon',
    cost: { purple: 54, green: 14 }, stats: { attack: 24 }, attacksPerSecond: 1.0, tier: 2,
    description: 'Dipped in hydra venom until the steel itself is poisonous.',
  }],
  ['swamp-vest-t2', {
    id: 'swamp-vest-t2', name: 'Hydra Scale',
    recipeGroup: 'swamp', requiredTier: 2, slot: 'armor',
    cost: { purple: 54, green: 14 }, stats: { defense: 25 }, tier: 2,
    description: 'Regenerating scale mesh — self-repairs minor scratches.',
  }],
  ['swamp-boots-t2', {
    id: 'swamp-boots-t2', name: 'Wetland Wraps',
    recipeGroup: 'swamp', requiredTier: 2, slot: 'mobility',
    cost: { purple: 44, green: 11 }, stats: { speed: 50 }, tier: 2,
    description: 'Enchanted wrappings that treat mud like solid ground.',
  }],
  ['swamp-charm-t2', {
    id: 'swamp-charm-t2', name: "Witch's Brew",
    recipeGroup: 'swamp', requiredTier: 2, slot: 'recovery',
    cost: { purple: 44, green: 11 }, stats: { hpRegen: 11 }, tier: 2,
    description: 'A vial of bog-witch tincture — tastes terrible, heals fast.',
  }],

  // ── Cave T1 — blue only ────────────────────────────────────────────────────
  ['chaotic-axe', {
    id: 'chaotic-axe', name: 'Chaotic Axe',
    recipeGroup: 'cave', requiredTier: 1, slot: 'weapon',
    cost: { blue: 22 }, stats: { attack: 10 }, attacksPerSecond: 1.10, tier: 1,
    description: 'An axe that swings with wild abandon — two in every three strikes land hard, but the third flies wide.',
  }],
  ['cave-vest-t1', {
    id: 'cave-vest-t1', name: 'Spider Chitin',
    recipeGroup: 'cave', requiredTier: 1, slot: 'armor',
    cost: { blue: 22 }, stats: { defense: 9 }, tier: 1,
    description: 'Layered cave-spider exoskeleton — light and strong.',
  }],
  ['cave-boots-t1', {
    id: 'cave-boots-t1', name: 'Bat Wing Boots',
    recipeGroup: 'cave', requiredTier: 1, slot: 'mobility',
    cost: { blue: 18 }, stats: { speed: 28 }, tier: 1,
    description: 'Cave-bat membrane stretched over soles — near silent.',
  }],
  ['cave-charm-t1', {
    id: 'cave-charm-t1', name: 'Glowing Mushroom',
    recipeGroup: 'cave', requiredTier: 1, slot: 'recovery',
    cost: { blue: 18 }, stats: { hpRegen: 4 }, tier: 1,
    description: 'A bioluminescent cave mushroom that heals while it glows.',
  }],

  // ── Cave T2 — blue (primary) + purple (bats/giant spider) ─────────────────
  ['cave-blade-t2', {
    id: 'cave-blade-t2', name: 'Troll Club',
    recipeGroup: 'cave', requiredTier: 2, slot: 'weapon',
    cost: { blue: 54, purple: 14 }, stats: { attack: 25 }, attacksPerSecond: 1.0, tier: 2,
    description: 'A cave-troll femur carved into a devastating weapon.',
  }],
  ['cave-vest-t2', {
    id: 'cave-vest-t2', name: 'Giant Carapace',
    recipeGroup: 'cave', requiredTier: 2, slot: 'armor',
    cost: { blue: 54, purple: 14 }, stats: { defense: 28 }, tier: 2,
    description: 'Half a giant spider shell fashioned into a full breastplate.',
  }],
  ['cave-boots-t2', {
    id: 'cave-boots-t2', name: 'Cavern Sprints',
    recipeGroup: 'cave', requiredTier: 2, slot: 'mobility',
    cost: { blue: 44, purple: 11 }, stats: { speed: 55 }, tier: 2,
    description: 'Enchanted leather that makes tight tunnels feel wide open.',
  }],
  ['cave-charm-t2', {
    id: 'cave-charm-t2', name: 'Crystal Vial',
    recipeGroup: 'cave', requiredTier: 2, slot: 'recovery',
    cost: { blue: 44, purple: 11 }, stats: { hpRegen: 12 }, tier: 2,
    description: 'Pure cave-crystal filled with concentrated mineral water.',
  }],

  // ── Jungle T1 — green only ─────────────────────────────────────────────────
  ['jungle-blade-t1', {
    id: 'jungle-blade-t1', name: 'Fang Blade',
    recipeGroup: 'jungle', requiredTier: 1, slot: 'weapon',
    cost: { green: 22 }, stats: { attack: 12 }, attacksPerSecond: 0.75, tier: 1,
    description: 'A jungle-snake fang set in a hardwood hilt.',
  }],
  ['jungle-vest-t1', {
    id: 'jungle-vest-t1', name: 'Ape Pelt',
    recipeGroup: 'jungle', requiredTier: 1, slot: 'armor',
    cost: { green: 22 }, stats: { defense: 10 }, tier: 1,
    description: 'Thick jungle-ape fur formed into a protective vest.',
  }],
  ['jungle-boots-t1', {
    id: 'jungle-boots-t1', name: 'Vine Wraps',
    recipeGroup: 'jungle', requiredTier: 1, slot: 'mobility',
    cost: { green: 18 }, stats: { speed: 22 }, tier: 1,
    description: 'Elastic jungle vines that spring with each step.',
  }],
  ['jungle-charm-t1', {
    id: 'jungle-charm-t1', name: 'Jungle Leaf',
    recipeGroup: 'jungle', requiredTier: 1, slot: 'recovery',
    cost: { green: 18 }, stats: { hpRegen: 5 }, tier: 1,
    description: 'A broad medicinal leaf that closes wounds on contact.',
  }],

  // ── Jungle T2 — green (primary) + yellow (apes) ───────────────────────────
  ['jungle-blade-t2', {
    id: 'jungle-blade-t2', name: 'Anaconda Fang',
    recipeGroup: 'jungle', requiredTier: 2, slot: 'weapon',
    cost: { green: 54, yellow: 14 }, stats: { attack: 26 }, attacksPerSecond: 1.0, tier: 2,
    description: 'An anaconda fang the length of a shortsword.',
  }],
  ['jungle-vest-t2', {
    id: 'jungle-vest-t2', name: 'Titan Pelt',
    recipeGroup: 'jungle', requiredTier: 2, slot: 'armor',
    cost: { green: 54, yellow: 14 }, stats: { defense: 26 }, tier: 2,
    description: 'Jungle-titan fur — dense enough to deflect blades.',
  }],
  ['jungle-boots-t2', {
    id: 'jungle-boots-t2', name: 'Predator Boots',
    recipeGroup: 'jungle', requiredTier: 2, slot: 'mobility',
    cost: { green: 44, yellow: 11 }, stats: { speed: 52 }, tier: 2,
    description: 'Fitted from anaconda scale — silent and swift.',
  }],
  ['jungle-charm-t2', {
    id: 'jungle-charm-t2', name: 'Ancient Bark Charm',
    recipeGroup: 'jungle', requiredTier: 2, slot: 'recovery',
    cost: { green: 44, yellow: 11 }, stats: { hpRegen: 12 }, tier: 2,
    description: 'A sliver of thousand-year tree bark, still pulsing with life.',
  }],

  // ── Tundra T1 (ring 2) — blue only ────────────────────────────────────────
  ['tundra-blade-t1', {
    id: 'tundra-blade-t1', name: 'Frost Blade',
    recipeGroup: 'tundra', requiredTier: 1, slot: 'weapon',
    cost: { blue: 70 }, stats: { attack: 28 }, attacksPerSecond: 1.25, tier: 1,
    description: 'Tempered in glacial water until the edge never dulls.',
  }],
  ['tundra-vest-t1', {
    id: 'tundra-vest-t1', name: 'Bear Fur',
    recipeGroup: 'tundra', requiredTier: 1, slot: 'armor',
    cost: { blue: 70 }, stats: { defense: 28 }, tier: 1,
    description: 'Ice-bear fur with a layer of compressed snow beneath.',
  }],
  ['tundra-boots-t1', {
    id: 'tundra-boots-t1', name: 'Snowstep Boots',
    recipeGroup: 'tundra', requiredTier: 1, slot: 'mobility',
    cost: { blue: 58 }, stats: { speed: 55 }, tier: 1,
    description: 'Enchanted to leave no tracks and lose no speed.',
  }],
  ['tundra-charm-t1', {
    id: 'tundra-charm-t1', name: 'Ice Herb',
    recipeGroup: 'tundra', requiredTier: 1, slot: 'recovery',
    cost: { blue: 58 }, stats: { hpRegen: 12 }, tier: 1,
    description: 'A frozen Arctic herb that releases restorative warmth.',
  }],

  // ── Tundra T2 — blue + purple + green (cross-biome, 3 types) ──────────────
  ['tundra-blade-t2', {
    id: 'tundra-blade-t2', name: 'Blizzard Edge',
    recipeGroup: 'tundra', requiredTier: 2, slot: 'weapon',
    cost: { blue: 84, purple: 24, green: 12 }, stats: { attack: 50 }, attacksPerSecond: 1.5, tier: 2,
    description: 'Forged from the eye of a permanent tundra blizzard.',
  }],
  ['tundra-vest-t2', {
    id: 'tundra-vest-t2', name: 'Glacial Plate',
    recipeGroup: 'tundra', requiredTier: 2, slot: 'armor',
    cost: { blue: 84, purple: 24, green: 12 }, stats: { defense: 50 }, tier: 2,
    description: 'Solid glacier ice compressed into rigid plate armour.',
  }],
  ['tundra-boots-t2', {
    id: 'tundra-boots-t2', name: 'Frost Wind Wraps',
    recipeGroup: 'tundra', requiredTier: 2, slot: 'mobility',
    cost: { blue: 68, purple: 20, green: 10 }, stats: { speed: 92 }, tier: 2,
    description: 'Woven from the breath of a permafrost storm.',
  }],
  ['tundra-charm-t2', {
    id: 'tundra-charm-t2', name: 'Permafrost Charm',
    recipeGroup: 'tundra', requiredTier: 2, slot: 'recovery',
    cost: { blue: 68, purple: 20, green: 10 }, stats: { hpRegen: 20 }, tier: 2,
    description: 'An ice crystal that never melts — channels arctic vitality.',
  }],

  // ── Desert T1 (ring 2) — yellow only ──────────────────────────────────────
  ['desert-blade-t1', {
    id: 'desert-blade-t1', name: 'Scorpion Blade',
    recipeGroup: 'desert', requiredTier: 1, slot: 'weapon',
    cost: { yellow: 70 }, stats: { attack: 28 }, attacksPerSecond: 1.25, tier: 1,
    description: 'A sand-scorpion stinger sharpened to a piercing point.',
  }],
  ['desert-vest-t1', {
    id: 'desert-vest-t1', name: 'Basilisk Scale',
    recipeGroup: 'desert', requiredTier: 1, slot: 'armor',
    cost: { yellow: 70 }, stats: { defense: 28 }, tier: 1,
    description: 'Stone-basilisk hide — turns away most blows.',
  }],
  ['desert-boots-t1', {
    id: 'desert-boots-t1', name: 'Sand Sprint',
    recipeGroup: 'desert', requiredTier: 1, slot: 'mobility',
    cost: { yellow: 58 }, stats: { speed: 58 }, tier: 1,
    description: 'Broad-soled boots that turn loose sand into a track.',
  }],
  ['desert-charm-t1', {
    id: 'desert-charm-t1', name: 'Cactus Elixir',
    recipeGroup: 'desert', requiredTier: 1, slot: 'recovery',
    cost: { yellow: 58 }, stats: { hpRegen: 12 }, tier: 1,
    description: 'Concentrated cactus sap that heals even in arid heat.',
  }],

  // ── Desert T2 — yellow + red + blue (cross-biome, 3 types) ───────────────
  ['desert-blade-t2', {
    id: 'desert-blade-t2', name: 'Sandstorm Blade',
    recipeGroup: 'desert', requiredTier: 2, slot: 'weapon',
    cost: { yellow: 84, red: 24, blue: 12 }, stats: { attack: 50 }, attacksPerSecond: 1.5, tier: 2,
    description: 'A blade shaped by a thousand-year sandstorm.',
  }],
  ['desert-vest-t2', {
    id: 'desert-vest-t2', name: 'Basilisk Crown',
    recipeGroup: 'desert', requiredTier: 2, slot: 'armor',
    cost: { yellow: 84, red: 24, blue: 12 }, stats: { defense: 50 }, tier: 2,
    description: 'A full suit of petrified basilisk hide.',
  }],
  ['desert-boots-t2', {
    id: 'desert-boots-t2', name: 'Dune Stride',
    recipeGroup: 'desert', requiredTier: 2, slot: 'mobility',
    cost: { yellow: 68, red: 20, blue: 10 }, stats: { speed: 92 }, tier: 2,
    description: 'Worn by desert nomads who outrun storms on foot.',
  }],
  ['desert-charm-t2', {
    id: 'desert-charm-t2', name: 'Desert Bloom',
    recipeGroup: 'desert', requiredTier: 2, slot: 'recovery',
    cost: { yellow: 68, red: 20, blue: 10 }, stats: { hpRegen: 20 }, tier: 2,
    description: 'A flower that blooms once per century — impossibly restorative.',
  }],

  // ── Volcanic T1 (ring 2) — red only ───────────────────────────────────────
  ['volcanic-blade-t1', {
    id: 'volcanic-blade-t1', name: 'Ember Blade',
    recipeGroup: 'volcanic', requiredTier: 1, slot: 'weapon',
    cost: { red: 72 }, stats: { attack: 30 }, attacksPerSecond: 1.25, tier: 1,
    description: 'Quenched in volcanic slag — stays warm to the touch.',
  }],
  ['volcanic-vest-t1', {
    id: 'volcanic-vest-t1', name: 'Magma Shell',
    recipeGroup: 'volcanic', requiredTier: 1, slot: 'armor',
    cost: { red: 72 }, stats: { defense: 30 }, tier: 1,
    description: 'Cooled magma-golem crust hardened into plate.',
  }],
  ['volcanic-boots-t1', {
    id: 'volcanic-boots-t1', name: 'Lava Step',
    recipeGroup: 'volcanic', requiredTier: 1, slot: 'mobility',
    cost: { red: 60 }, stats: { speed: 60 }, tier: 1,
    description: 'Heat-sealed soles that treat lava like cool stone.',
  }],
  ['volcanic-charm-t1', {
    id: 'volcanic-charm-t1', name: 'Soot Charm',
    recipeGroup: 'volcanic', requiredTier: 1, slot: 'recovery',
    cost: { red: 60 }, stats: { hpRegen: 13 }, tier: 1,
    description: 'Volcanic ash compressed with ember-slime gel — cauterizes wounds.',
  }],

  // ── Volcanic T2 — red + yellow + purple (cross-biome, 3 types) ────────────
  ['volcanic-blade-t2', {
    id: 'volcanic-blade-t2', name: 'Inferno Edge',
    recipeGroup: 'volcanic', requiredTier: 2, slot: 'weapon',
    cost: { red: 88, yellow: 25, purple: 12 }, stats: { attack: 55 }, attacksPerSecond: 1.5, tier: 2,
    description: 'Folded in a live magma vent a thousand times over.',
  }],
  ['volcanic-vest-t2', {
    id: 'volcanic-vest-t2', name: 'Volcanic Plate',
    recipeGroup: 'volcanic', requiredTier: 2, slot: 'armor',
    cost: { red: 88, yellow: 25, purple: 12 }, stats: { defense: 55 }, tier: 2,
    description: 'Compressed solidified magma — near indestructible.',
  }],
  ['volcanic-boots-t2', {
    id: 'volcanic-boots-t2', name: 'Magma Stride',
    recipeGroup: 'volcanic', requiredTier: 2, slot: 'mobility',
    cost: { red: 74, yellow: 21, purple: 10 }, stats: { speed: 98 }, tier: 2,
    description: 'Boots from the oldest magma-golem — carries volcanic fury.',
  }],
  ['volcanic-charm-t2', {
    id: 'volcanic-charm-t2', name: 'Pyroclast Charm',
    recipeGroup: 'volcanic', requiredTier: 2, slot: 'recovery',
    cost: { red: 74, yellow: 21, purple: 10 }, stats: { hpRegen: 22 }, tier: 2,
    description: 'A pyroclastic crystal that regenerates from heat itself.',
  }],
]);
