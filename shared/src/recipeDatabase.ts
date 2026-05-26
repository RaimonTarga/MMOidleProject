import type { EquipmentSlot, ItemStats, EssenceType } from './items';

export interface Recipe {
  id: string;
  name: string;
  /** Biome group this recipe belongs to — matches the key in player biomeLevel. */
  recipeGroup: string;
  /**
   * Biome level required in recipeGroup for this recipe to unlock.
   * The level cap is gated by playerTier via GAME_CONFIG.BIOME_LEVEL_CAP_BY_TIER,
   * so higher-tier recipes are implicitly gated by the character's progression.
   */
  requiredBiomeLevel: number;
  slot: EquipmentSlot;
  /** Essence costs keyed by type. Only types with non-zero amounts are listed. */
  cost: Partial<Record<EssenceType, number>>;
  stats: Partial<ItemStats>;
  tier: number;
  /**
   * Named mechanic modifiers that flow into player.passives via stat rebuild.
   * Mirrors ItemDefinition.mechanicEffects — see items.ts for the full key list.
   */
  mechanicEffects?: Record<string, number>;
  /**
   * Weapon slots only. Sets the player's base attack cooldown to round(1000 / aps) ms.
   * See ItemDefinition.attacksPerSecond for full semantics.
   */
  attacksPerSecond?: number;
  description?: string;
}

// ─── Stat scale reference ──────────────────────────────────────────────────────
// T1 ring-1 biomes:  ATK/DEF  8–12,  SPD 20–28,  REGEN 3–5,   cost 15–25 ess
// T2 ring-1 biomes:  ATK/DEF 16–26,  SPD 40–55,  REGEN 7–12,  cost 45–70 ess
// T1 ring-2 biomes:  ATK/DEF 28–32,  SPD 55–62,  REGEN 12–14, cost 65–75 ess
// T2 ring-2 biomes:  ATK/DEF 50–58,  SPD 90–100, REGEN 20–24, cost 105–125 ess

export const RECIPE_DATABASE: Map<string, Recipe> = new Map<string, Recipe>([

  // ── Clearing (tutorial tier 1) — single green essence ────────────────────
  ['primordial-club', {
    id: 'primordial-club', name: 'Primordial Club',
    recipeGroup: 'clearing', requiredBiomeLevel: 1, slot: 'weapon',
    cost: { green: 8 }, stats: { attack: 5 }, attacksPerSecond: 0.70, tier: 1,
    description: 'A crude but reliable club — forged on the cheap, never lets you down.',
  }],
  ['clearing-vest-t1', {
    id: 'clearing-vest-t1', name: 'Bark Wrap',
    recipeGroup: 'clearing', requiredBiomeLevel: 1, slot: 'armor',
    cost: { green: 8 }, stats: { plating: 4 }, tier: 1,
    description: 'Strips of bark bound with twine.',
  }],
  ['clearing-boots-t1', {
    id: 'clearing-boots-t1', name: 'Soft Boots',
    recipeGroup: 'clearing', requiredBiomeLevel: 1, slot: 'mobility',
    cost: { green: 6 }, stats: { speed: 12 }, tier: 1,
    description: 'Comfortable footwear for early exploration.',
  }],
  ['clearing-charm-t1', {
    id: 'clearing-charm-t1', name: 'Herb Pouch',
    recipeGroup: 'clearing', requiredBiomeLevel: 1, slot: 'recovery',
    cost: { green: 6 }, stats: { hpRegen: 2 }, tier: 1,
    description: 'A cloth bag of common healing herbs.',
  }],

  // ── Forest T1 — green only ─────────────────────────────────────────────────
  ['flash-rapier', {
    id: 'flash-rapier', name: 'Flash Rapier',
    recipeGroup: 'forest', requiredBiomeLevel: 1, slot: 'weapon',
    cost: { green: 20 }, stats: { attack: 4 }, attacksPerSecond: 1.50, tier: 1,
    description: 'A needle-thin blade that strikes faster than the eye can follow, but each sting barely bites.',
  }],
  ['forest-vest-t1', {
    id: 'forest-vest-t1', name: 'Shaded Bindings',
    recipeGroup: 'forest', requiredBiomeLevel: 2, slot: 'armor',
    cost: { green: 20 }, stats: { maxHp: 10, plating: 2, evasion: 6 }, tier: 1,
    description: 'Shadowweave wrappings that let you slip between strikes — every 6th incoming attack passes through you entirely.',
  }],
  ['forest-boots-t1', {
    id: 'forest-boots-t1', name: 'Sprinter Wraps',
    recipeGroup: 'forest', requiredBiomeLevel: 4, slot: 'mobility',
    cost: { green: 15 }, stats: { speed: 20 }, tier: 1,
    description: 'Light wrappings that free the ankle.',
  }],
  ['forest-charm-t1', {
    id: 'forest-charm-t1', name: 'Heartroot Amulet',
    recipeGroup: 'forest', requiredBiomeLevel: 3, slot: 'recovery',
    cost: { green: 15 }, stats: { hpRegen: 6 }, tier: 1,
    description: 'Dried heartroot steeped in forest spring water — the fastest out-of-combat recovery in ring 1.',
  }],

  // ── Forest T2 — green (primary) + yellow (wolves) ─────────────────────────
  ['forest-blade-t2', {
    id: 'forest-blade-t2', name: 'Ironwood Blade',
    recipeGroup: 'forest', requiredBiomeLevel: 6, slot: 'weapon',
    cost: { green: 48, yellow: 12 }, stats: { attack: 18 }, attacksPerSecond: 1.0, tier: 2,
    description: 'Forged from the heartwood of an ancient iron-oak.',
  }],
  ['forest-vest-t2', {
    id: 'forest-vest-t2', name: 'Phantom Bindings',
    recipeGroup: 'forest', requiredBiomeLevel: 7, slot: 'armor',
    cost: { green: 48, yellow: 12 }, stats: { maxHp: 18, plating: 4, evasion: 5 },
    mechanicEffects: { 'defense.max-hit-pct': 0.25 },
    tier: 2,
    description: 'Illusion-woven cloth that evades every 5th attack and softens any single hit exceeding 25% of your HP.',
  }],
  ['forest-boots-t2', {
    id: 'forest-boots-t2', name: 'Windstep Wraps',
    recipeGroup: 'forest', requiredBiomeLevel: 9, slot: 'mobility',
    cost: { green: 38, yellow: 10 }, stats: { speed: 40 }, tier: 2,
    description: 'Enchanted wraps that carry the speed of forest winds.',
  }],
  ['forest-charm-t2', {
    id: 'forest-charm-t2', name: 'Ancient Heartroot Amulet',
    recipeGroup: 'forest', requiredBiomeLevel: 8, slot: 'recovery',
    cost: { green: 38, yellow: 10 }, stats: { hpRegen: 10 }, tier: 2,
    description: 'A century-aged heartroot amulet — recovery so fast others mistake it for sorcery.',
  }],

  // ── Mountain T1 — blue only ────────────────────────────────────────────────
  ['heavy-hammer', {
    id: 'heavy-hammer', name: 'Heavy Hammer',
    recipeGroup: 'mountain', requiredBiomeLevel: 1, slot: 'weapon',
    cost: { blue: 22 }, stats: { attack: 16 }, attacksPerSecond: 0.40, tier: 1,
    description: 'A war hammer so heavy it takes both hands — but when it lands, it lands.',
  }],
  ['mountain-vest-t1', {
    id: 'mountain-vest-t1', name: 'Fallen Knight Plate',
    recipeGroup: 'mountain', requiredBiomeLevel: 2, slot: 'armor',
    cost: { blue: 22 }, stats: { maxHp: 8, plating: 10, damageReduction: 0.05 }, tier: 1,
    description: 'Heavy stone-forged plate that shrugs off small hits through sheer mass.',
  }],
  ['mountain-boots-t1', {
    id: 'mountain-boots-t1', name: 'Iron Treads',
    recipeGroup: 'mountain', requiredBiomeLevel: 4, slot: 'mobility',
    cost: { blue: 18 }, stats: { speed: 18 }, tier: 1,
    description: 'Reinforced boots that grip loose rock.',
  }],
  ['mountain-charm-t1', {
    id: 'mountain-charm-t1', name: 'Granite Barrier',
    recipeGroup: 'mountain', requiredBiomeLevel: 3, slot: 'recovery',
    cost: { blue: 18 }, stats: { hpRegen: 3 },
    mechanicEffects: { 'defense.shield-pct': 0.10, 'defense.shield-interval-ms': 10000, 'defense.shield-duration-ms': 10000 },
    tier: 1,
    description: 'A carved granite ward — generates a 10% HP shield in combat, refreshing every 10 seconds.',
  }],

  // ── Mountain T2 — blue (primary) + purple (stone eagle) ───────────────────
  ['mountain-blade-t2', {
    id: 'mountain-blade-t2', name: 'Peak Blade',
    recipeGroup: 'mountain', requiredBiomeLevel: 6, slot: 'weapon',
    cost: { blue: 52, purple: 13 }, stats: { attack: 22 }, attacksPerSecond: 1.0, tier: 2,
    description: 'Folded high-altitude steel; holds an edge in any cold.',
  }],
  ['mountain-vest-t2', {
    id: 'mountain-vest-t2', name: 'Iron Crusader Plate',
    recipeGroup: 'mountain', requiredBiomeLevel: 7, slot: 'armor',
    cost: { blue: 52, purple: 13 }, stats: { maxHp: 15, plating: 18, damageReduction: 0.08 },
    mechanicEffects: { 'defense.hit-to-dot-pct': 0.12 },
    tier: 2,
    description: 'Masterwork plate that distributes 12% of absorbed force into delayed damage — turns lethal bursts into survivable trickle.',
  }],
  ['mountain-boots-t2', {
    id: 'mountain-boots-t2', name: 'Mountain Stride',
    recipeGroup: 'mountain', requiredBiomeLevel: 9, slot: 'mobility',
    cost: { blue: 42, purple: 10 }, stats: { speed: 45 }, tier: 2,
    description: 'Enchanted treads that turn slopes into flat ground.',
  }],
  ['mountain-charm-t2', {
    id: 'mountain-charm-t2', name: 'Iron Bulwark',
    recipeGroup: 'mountain', requiredBiomeLevel: 8, slot: 'recovery',
    cost: { blue: 42, purple: 10 }, stats: { hpRegen: 6 },
    mechanicEffects: { 'defense.shield-pct': 0.15, 'defense.shield-interval-ms': 8000, 'defense.shield-duration-ms': 8000 },
    tier: 2,
    description: 'Mountain-forged iron ward — 15% HP shield every 8 seconds, turning sustained assault into a war of attrition.',
  }],

  // ── Plains T1 — yellow only ────────────────────────────────────────────────
  ['iron-broadsword', {
      id: 'iron-broadsword',
      name: 'Iron Broadsword',
      recipeGroup: 'plains',
      requiredBiomeLevel: 1,
      slot: 'weapon',

      cost: { yellow: 14 },

      stats: { attack: 8 },
      attacksPerSecond: 0.65,

      tier: 1,

      description: 'A dependable iron blade carried by soldiers, travelers, and adventurers alike. It lacks flair, but never fails its wielder.',
  }],
  ['sacred-cross', {
    id: 'sacred-cross', name: 'Sacred Cross',
    recipeGroup: 'plains', requiredBiomeLevel: 1, slot: 'weapon',
    cost: { yellow: 20 }, stats: { attack: 6 }, attacksPerSecond: 0.50, tier: 1,
    description: 'A blessed weapon that pulses with divine energy — slow to strike, but every 12s it unleashes a devastating burst.',
  }],
  ['plains-vest-t1', {
    id: 'plains-vest-t1', name: "Survivor's Robe",
    recipeGroup: 'plains', requiredBiomeLevel: 2, slot: 'armor',
    cost: { yellow: 20 }, stats: { maxHp: 12, plating: 3, damageReduction: 0.15 }, tier: 1,
    description: 'Reinforced field cloth built to endure sustained punishment — wide coverage and solid padding.',
  }],
  ['plains-boots-t1', {
    id: 'plains-boots-t1', name: 'Fleet Boots',
    recipeGroup: 'plains', requiredBiomeLevel: 4, slot: 'mobility',
    cost: { yellow: 16 }, stats: { speed: 25 }, tier: 1,
    description: 'Open-toe sandals built for sprinting across flat ground.',
  }],
  ['plains-charm-t1', {
    id: 'plains-charm-t1', name: 'Plains Core',
    recipeGroup: 'plains', requiredBiomeLevel: 3, slot: 'recovery',
    cost: { yellow: 16 }, stats: { hpRegen: 4 },
    mechanicEffects: { 'defense.in-combat-regen-pct': 0.20 },
    tier: 1,
    description: 'A sun-warmed plains stone — 20% of your regen rate applies while you are actively fighting.',
  }],

  // ── Plains T2 — yellow (primary) + red (boar/bull) ────────────────────────
  ['plains-blade-t2', {
    id: 'plains-blade-t2', name: 'Storm Blade',
    recipeGroup: 'plains', requiredBiomeLevel: 6, slot: 'weapon',
    cost: { yellow: 50, red: 12 }, stats: { attack: 20 }, attacksPerSecond: 1.0, tier: 2,
    description: 'Charged with static from a plains thunderstorm.',
  }],
  ['plains-vest-t2', {
    id: 'plains-vest-t2', name: 'Enduring Robe',
    recipeGroup: 'plains', requiredBiomeLevel: 7, slot: 'armor',
    cost: { yellow: 50, red: 12 }, stats: { maxHp: 25, plating: 5, damageReduction: 0.20 },
    mechanicEffects: { 'defense.absorb-pct': 0.08 },
    tier: 2,
    description: 'Life-binding thread woven into field armor — 8% of damage taken is converted into healing over 4 seconds.',
  }],
  ['plains-boots-t2', {
    id: 'plains-boots-t2', name: 'Gale Boots',
    recipeGroup: 'plains', requiredBiomeLevel: 9, slot: 'mobility',
    cost: { yellow: 40, red: 10 }, stats: { speed: 48 }, tier: 2,
    description: 'Wind-woven leather that carries you with every step.',
  }],
  ['plains-charm-t2', {
    id: 'plains-charm-t2', name: 'Stalwart Core',
    recipeGroup: 'plains', requiredBiomeLevel: 8, slot: 'recovery',
    cost: { yellow: 40, red: 10 }, stats: { hpRegen: 7 },
    mechanicEffects: { 'defense.in-combat-regen-pct': 0.30 },
    tier: 2,
    description: 'Battle-hardened plains core — 30% of your regen rate in combat lets you outlast any prolonged fight.',
  }],

  // ── Swamp T1 — purple only ─────────────────────────────────────────────────
  ['ashbrand-blade', {
    id: 'ashbrand-blade', name: 'Ashbrand Blade',
    recipeGroup: 'swamp', requiredBiomeLevel: 1, slot: 'weapon',
    cost: { purple: 22 }, stats: { attack: 7 }, attacksPerSecond: 0.75, tier: 1,
    description: 'A blade wreathed in smoldering runes — your strikes leave no wound, only fire that eats from within.',
  }],
  ['swamp-vest-t1', {
    id: 'swamp-vest-t1', name: 'Arcane Wrappings',
    recipeGroup: 'swamp', requiredBiomeLevel: 2, slot: 'armor',
    cost: { purple: 22 }, stats: { maxHp: 10, plating: 3 },
    mechanicEffects: { 'defense.dot-resistance': 0.18 },
    tier: 1,
    description: 'Magically treated cloth that dampens toxins, burns, and corroding ailments — 18% reduction to all damage over time.',
  }],
  ['swamp-boots-t1', {
    id: 'swamp-boots-t1', name: 'Marsh Treads',
    recipeGroup: 'swamp', requiredBiomeLevel: 4, slot: 'mobility',
    cost: { purple: 18 }, stats: { speed: 20 }, tier: 1,
    description: 'Wide-soled boots that float on soft ground.',
  }],
  ['swamp-charm-t1', {
    id: 'swamp-charm-t1', name: 'Murk Eye',
    recipeGroup: 'swamp', requiredBiomeLevel: 3, slot: 'recovery',
    cost: { purple: 18 }, stats: { hpRegen: 3 },
    mechanicEffects: { 'defense.absorb-pct': 0.10 },
    tier: 1,
    description: 'A preserved swamp golem eye — 10% of all damage you take is returned as healing over 4 seconds.',
  }],

  // ── Swamp T2 — purple (primary) + green (bog slime) ───────────────────────
  ['swamp-blade-t2', {
    id: 'swamp-blade-t2', name: 'Venom Blade',
    recipeGroup: 'swamp', requiredBiomeLevel: 6, slot: 'weapon',
    cost: { purple: 54, green: 14 }, stats: { attack: 24 }, attacksPerSecond: 1.0, tier: 2,
    description: 'Dipped in hydra venom until the steel itself is poisonous.',
  }],
  ['swamp-vest-t2', {
    id: 'swamp-vest-t2', name: 'Void Wrappings',
    recipeGroup: 'swamp', requiredBiomeLevel: 7, slot: 'armor',
    cost: { purple: 54, green: 14 }, stats: { maxHp: 20, plating: 6 },
    mechanicEffects: { 'defense.dot-resistance': 0.30, 'defense.debuff-resistance': 0.12 },
    tier: 2,
    description: 'Deep-swamp cloth that nullifies 30% of incoming DoT and reduces the potency of all non-DoT debuffs by 12%.',
  }],
  ['swamp-boots-t2', {
    id: 'swamp-boots-t2', name: 'Wetland Wraps',
    recipeGroup: 'swamp', requiredBiomeLevel: 9, slot: 'mobility',
    cost: { purple: 44, green: 11 }, stats: { speed: 50 }, tier: 2,
    description: 'Enchanted wrappings that treat mud like solid ground.',
  }],
  ['swamp-charm-t2', {
    id: 'swamp-charm-t2', name: 'Void Eye',
    recipeGroup: 'swamp', requiredBiomeLevel: 8, slot: 'recovery',
    cost: { purple: 44, green: 11 }, stats: { hpRegen: 6 },
    mechanicEffects: { 'defense.absorb-pct': 0.15 },
    tier: 2,
    description: 'A void-tainted golem eye — 15% of damage taken streams back as healing; the harder the fight, the more you recover.',
  }],

  // ── Cave T1 — blue only ────────────────────────────────────────────────────
  ['chaotic-axe', {
    id: 'chaotic-axe', name: 'Chaotic Axe',
    recipeGroup: 'cave', requiredBiomeLevel: 1, slot: 'weapon',
    cost: { blue: 22 }, stats: { attack: 10 }, attacksPerSecond: 1.10, tier: 1,
    description: 'An axe that swings with wild abandon — two in every three strikes land hard, but the third flies wide.',
  }],
  ['cave-vest-t1', {
    id: 'cave-vest-t1', name: 'Bestial Hide',
    recipeGroup: 'cave', requiredBiomeLevel: 2, slot: 'armor',
    cost: { blue: 22 }, stats: { maxHp: 20, plating: 3, damageReduction: 0.08 }, tier: 1,
    description: 'Dense cave-beast hide that absorbs raw force through sheer bulk.',
  }],
  ['cave-boots-t1', {
    id: 'cave-boots-t1', name: 'Bat Wing Boots',
    recipeGroup: 'cave', requiredBiomeLevel: 4, slot: 'mobility',
    cost: { blue: 18 }, stats: { speed: 28 }, tier: 1,
    description: 'Cave-bat membrane stretched over soles — near silent.',
  }],
  ['cave-charm-t1', {
    id: 'cave-charm-t1', name: 'Pulse Stone',
    recipeGroup: 'cave', requiredBiomeLevel: 3, slot: 'recovery',
    cost: { blue: 18 }, stats: { hpRegen: 3 },
    mechanicEffects: { 'defense.regen-burst-pct': 0.10, 'defense.regen-burst-interval-ms': 10000 },
    tier: 1,
    description: 'A cave crystal that rhythmically stores life energy — restores 10% of your max HP over 4 seconds every 10 seconds.',
  }],

  // ── Cave T2 — blue (primary) + purple (bats/giant spider) ─────────────────
  ['cave-blade-t2', {
    id: 'cave-blade-t2', name: 'Troll Club',
    recipeGroup: 'cave', requiredBiomeLevel: 6, slot: 'weapon',
    cost: { blue: 54, purple: 14 }, stats: { attack: 25 }, attacksPerSecond: 1.0, tier: 2,
    description: 'A cave-troll femur carved into a devastating weapon.',
  }],
  ['cave-vest-t2', {
    id: 'cave-vest-t2', name: 'Dire Bestial Hide',
    recipeGroup: 'cave', requiredBiomeLevel: 7, slot: 'armor',
    cost: { blue: 54, purple: 14 }, stats: { maxHp: 38, plating: 6, damageReduction: 0.12 },
    mechanicEffects: { 'defense.in-combat-regen-pct': 0.15 },
    tier: 2,
    description: 'Living hide from a dire beast — slowly seals wounds while you fight, applying 15% of your regen rate in combat.',
  }],
  ['cave-boots-t2', {
    id: 'cave-boots-t2', name: 'Cavern Sprints',
    recipeGroup: 'cave', requiredBiomeLevel: 9, slot: 'mobility',
    cost: { blue: 44, purple: 11 }, stats: { speed: 55 }, tier: 2,
    description: 'Enchanted leather that makes tight tunnels feel wide open.',
  }],
  ['cave-charm-t2', {
    id: 'cave-charm-t2', name: 'Resonant Gem',
    recipeGroup: 'cave', requiredBiomeLevel: 8, slot: 'recovery',
    cost: { blue: 44, purple: 11 }, stats: { hpRegen: 6 },
    mechanicEffects: { 'defense.regen-burst-pct': 0.15, 'defense.regen-burst-interval-ms': 8000 },
    tier: 2,
    description: 'A fully resonated cave gem — 15% max HP healed over 4 seconds, pulsing every 8 seconds.',
  }],

  // ── Jungle T1 — green only (jungle first appears T2; unlocks from any jungle node) ──
  ['jungle-vest-t1', {
    id: 'jungle-vest-t1', name: 'Verdant Wraps',
    recipeGroup: 'jungle', requiredBiomeLevel: 1, slot: 'armor',
    cost: { green: 22 }, stats: { maxHp: 10, plating: 2, evasion: 6 }, tier: 1,
    description: 'Flexible jungle bindings that let you slip between strikes — every 6th incoming attack passes through you.',
  }],
  ['jungle-boots-t1', {
    id: 'jungle-boots-t1', name: 'Vine Wraps',
    recipeGroup: 'jungle', requiredBiomeLevel: 2, slot: 'mobility',
    cost: { green: 18 }, stats: { speed: 22 }, tier: 1,
    description: 'Elastic jungle vines that spring with each step.',
  }],
  ['jungle-charm-t1', {
    id: 'jungle-charm-t1', name: 'Verdant Amulet',
    recipeGroup: 'jungle', requiredBiomeLevel: 3, slot: 'recovery',
    cost: { green: 18 }, stats: { hpRegen: 5 }, tier: 1,
    description: 'Carved jade saturated with jungle life energy — pure recovery, nothing wasted on secondary effects.',
  }],

  // ── Jungle T2 — green (primary) + yellow (apes) ───────────────────────────
  ['jungle-blade-t2', {
    id: 'jungle-blade-t2', name: 'Anaconda Fang',
    recipeGroup: 'jungle', requiredBiomeLevel: 6, slot: 'weapon',
    cost: { green: 54, yellow: 14 }, stats: { attack: 26 }, attacksPerSecond: 1.0, tier: 2,
    description: 'An anaconda fang the length of a shortsword.',
  }],
  ['jungle-vest-t2', {
    id: 'jungle-vest-t2', name: 'Primal Wraps',
    recipeGroup: 'jungle', requiredBiomeLevel: 7, slot: 'armor',
    cost: { green: 54, yellow: 14 }, stats: { maxHp: 22, plating: 5, evasion: 5 },
    mechanicEffects: { 'defense.absorb-pct': 0.06 },
    tier: 2,
    description: 'Reactive jungle wrappings that evade every 5th attack and convert 6% of remaining damage into healing over 4 seconds.',
  }],
  ['jungle-boots-t2', {
    id: 'jungle-boots-t2', name: 'Predator Boots',
    recipeGroup: 'jungle', requiredBiomeLevel: 9, slot: 'mobility',
    cost: { green: 44, yellow: 11 }, stats: { speed: 52 }, tier: 2,
    description: 'Fitted from anaconda scale — silent and swift.',
  }],
  ['jungle-charm-t2', {
    id: 'jungle-charm-t2', name: 'Life Weave Amulet',
    recipeGroup: 'jungle', requiredBiomeLevel: 8, slot: 'recovery',
    cost: { green: 44, yellow: 11 }, stats: { hpRegen: 8 }, tier: 2,
    description: 'A living amulet woven from thousand-year jungle vines — exceptional raw recovery for those who want no strings attached.',
  }],

  // ── Tundra T1 (ring 2) — blue only ────────────────────────────────────────
  ['tundra-blade-t1', {
    id: 'tundra-blade-t1', name: 'Frost Blade',
    recipeGroup: 'tundra', requiredBiomeLevel: 1, slot: 'weapon',
    cost: { blue: 70 }, stats: { attack: 28 }, attacksPerSecond: 1.25, tier: 1,
    description: 'Tempered in glacial water until the edge never dulls.',
  }],
  ['tundra-vest-t1', {
    id: 'tundra-vest-t1', name: 'Frost-Forged Plate',
    recipeGroup: 'tundra', requiredBiomeLevel: 2, slot: 'armor',
    cost: { blue: 70 }, stats: { maxHp: 18, plating: 22, damageReduction: 0.08 }, tier: 1,
    description: 'Arctic-tempered full plate forged in glacial vents — brutal in mass and mitigation.',
  }],
  ['tundra-boots-t1', {
    id: 'tundra-boots-t1', name: 'Snowstep Boots',
    recipeGroup: 'tundra', requiredBiomeLevel: 4, slot: 'mobility',
    cost: { blue: 58 }, stats: { speed: 55 }, tier: 1,
    description: 'Enchanted to leave no tracks and lose no speed.',
  }],
  ['tundra-charm-t1', {
    id: 'tundra-charm-t1', name: 'Frost Barrier',
    recipeGroup: 'tundra', requiredBiomeLevel: 3, slot: 'recovery',
    cost: { blue: 58 }, stats: { hpRegen: 10 },
    mechanicEffects: { 'defense.shield-pct': 0.18, 'defense.shield-interval-ms': 8000, 'defense.shield-duration-ms': 8000 },
    tier: 1,
    description: 'An arctic ward that crystallises an 18% HP ice shield in combat, refreshing every 8 seconds.',
  }],

  // ── Tundra T2 — blue + purple + green (cross-biome, 3 types) ──────────────
  ['tundra-blade-t2', {
    id: 'tundra-blade-t2', name: 'Blizzard Edge',
    recipeGroup: 'tundra', requiredBiomeLevel: 6, slot: 'weapon',
    cost: { blue: 84, purple: 24, green: 12 }, stats: { attack: 50 }, attacksPerSecond: 1.5, tier: 2,
    description: 'Forged from the eye of a permanent tundra blizzard.',
  }],
  ['tundra-vest-t2', {
    id: 'tundra-vest-t2', name: 'Glacial Crusader Plate',
    recipeGroup: 'tundra', requiredBiomeLevel: 7, slot: 'armor',
    cost: { blue: 84, purple: 24, green: 12 }, stats: { maxHp: 35, plating: 36, damageReduction: 0.12 },
    mechanicEffects: { 'defense.hit-to-dot-pct': 0.18 },
    tier: 2,
    description: 'Apex arctic plate that channels 18% of absorbed impact into delayed frost debt — extreme hits are spread across 4 seconds.',
  }],
  ['tundra-boots-t2', {
    id: 'tundra-boots-t2', name: 'Frost Wind Wraps',
    recipeGroup: 'tundra', requiredBiomeLevel: 9, slot: 'mobility',
    cost: { blue: 68, purple: 20, green: 10 }, stats: { speed: 92 }, tier: 2,
    description: 'Woven from the breath of a permafrost storm.',
  }],
  ['tundra-charm-t2', {
    id: 'tundra-charm-t2', name: 'Glacial Bulwark',
    recipeGroup: 'tundra', requiredBiomeLevel: 8, slot: 'recovery',
    cost: { blue: 68, purple: 20, green: 10 }, stats: { hpRegen: 16 },
    mechanicEffects: { 'defense.shield-pct': 0.22, 'defense.shield-interval-ms': 8000, 'defense.shield-duration-ms': 8000 },
    tier: 2,
    description: 'An ancient glacier ward — 22% HP glacial shield every 8 seconds; virtually impenetrable to sustained assault.',
  }],

  // ── Desert T1 (ring 2) — yellow only ──────────────────────────────────────
  ['desert-blade-t1', {
    id: 'desert-blade-t1', name: 'Scorpion Blade',
    recipeGroup: 'desert', requiredBiomeLevel: 1, slot: 'weapon',
    cost: { yellow: 70 }, stats: { attack: 28 }, attacksPerSecond: 1.25, tier: 1,
    description: 'A sand-scorpion stinger sharpened to a piercing point.',
  }],
  ['desert-vest-t1', {
    id: 'desert-vest-t1', name: 'Sunbaked Wrappings',
    recipeGroup: 'desert', requiredBiomeLevel: 2, slot: 'armor',
    cost: { yellow: 70 }, stats: { maxHp: 25, plating: 14 },
    mechanicEffects: { 'defense.dot-resistance': 0.28, 'defense.debuff-resistance': 0.10 },
    tier: 1,
    description: 'Heat-hardened desert cloth that resists burns, poisons, and curses of the wastes — 28% DoT resistance and 10% debuff reduction.',
  }],
  ['desert-boots-t1', {
    id: 'desert-boots-t1', name: 'Sand Sprint',
    recipeGroup: 'desert', requiredBiomeLevel: 4, slot: 'mobility',
    cost: { yellow: 58 }, stats: { speed: 58 }, tier: 1,
    description: 'Broad-soled boots that turn loose sand into a track.',
  }],
  ['desert-charm-t1', {
    id: 'desert-charm-t1', name: 'Sand Golem Eye',
    recipeGroup: 'desert', requiredBiomeLevel: 3, slot: 'recovery',
    cost: { yellow: 58 }, stats: { hpRegen: 10 },
    mechanicEffects: { 'defense.absorb-pct': 0.22 },
    tier: 1,
    description: 'A preserved desert golem eye — 22% of all damage taken converts to healing over 4 seconds.',
  }],

  // ── Desert T2 — yellow + red + blue (cross-biome, 3 types) ───────────────
  ['desert-blade-t2', {
    id: 'desert-blade-t2', name: 'Sandstorm Blade',
    recipeGroup: 'desert', requiredBiomeLevel: 6, slot: 'weapon',
    cost: { yellow: 84, red: 24, blue: 12 }, stats: { attack: 50 }, attacksPerSecond: 1.5, tier: 2,
    description: 'A blade shaped by a thousand-year sandstorm.',
  }],
  ['desert-vest-t2', {
    id: 'desert-vest-t2', name: 'Ancient Sunbaked Wrappings',
    recipeGroup: 'desert', requiredBiomeLevel: 7, slot: 'armor',
    cost: { yellow: 84, red: 24, blue: 12 }, stats: { maxHp: 42, plating: 24 },
    mechanicEffects: { 'defense.dot-resistance': 0.42, 'defense.debuff-resistance': 0.22, 'defense.cleanse-stacks': 1, 'defense.cleanse-interval-ms': 8000 },
    tier: 2,
    description: 'Mystically sealed wrappings that resist 42% of DoT, reduce debuff potency by 22%, and cleanse 1 stack of every active debuff every 8 seconds.',
  }],
  ['desert-boots-t2', {
    id: 'desert-boots-t2', name: 'Dune Stride',
    recipeGroup: 'desert', requiredBiomeLevel: 9, slot: 'mobility',
    cost: { yellow: 68, red: 20, blue: 10 }, stats: { speed: 92 }, tier: 2,
    description: 'Worn by desert nomads who outrun storms on foot.',
  }],
  ['desert-charm-t2', {
    id: 'desert-charm-t2', name: 'Stone Colossus Eye',
    recipeGroup: 'desert', requiredBiomeLevel: 8, slot: 'recovery',
    cost: { yellow: 68, red: 20, blue: 10 }, stats: { hpRegen: 16 },
    mechanicEffects: { 'defense.absorb-pct': 0.28 },
    tier: 2,
    description: 'The eye of an ancient desert colossus — 28% of damage taken becomes a healing stream; the harder the fight, the faster you recover.',
  }],

  // ── Volcanic T1 (ring 2) — red only ───────────────────────────────────────
  ['volcanic-blade-t1', {
    id: 'volcanic-blade-t1', name: 'Ember Blade',
    recipeGroup: 'volcanic', requiredBiomeLevel: 1, slot: 'weapon',
    cost: { red: 72 }, stats: { attack: 30 }, attacksPerSecond: 1.25, tier: 1,
    description: 'Quenched in volcanic slag — stays warm to the touch.',
  }],
  ['volcanic-vest-t1', {
    id: 'volcanic-vest-t1', name: 'Magma-Cured Hide',
    recipeGroup: 'volcanic', requiredBiomeLevel: 2, slot: 'armor',
    cost: { red: 72 }, stats: { maxHp: 40, plating: 14, damageReduction: 0.10 }, tier: 1,
    description: 'Fire-beast hide cooled to near-steel hardness — volcanic density provides extraordinary bulk.',
  }],
  ['volcanic-boots-t1', {
    id: 'volcanic-boots-t1', name: 'Lava Step',
    recipeGroup: 'volcanic', requiredBiomeLevel: 4, slot: 'mobility',
    cost: { red: 60 }, stats: { speed: 60 }, tier: 1,
    description: 'Heat-sealed soles that treat lava like cool stone.',
  }],
  ['volcanic-charm-t1', {
    id: 'volcanic-charm-t1', name: 'Ember Core',
    recipeGroup: 'volcanic', requiredBiomeLevel: 3, slot: 'recovery',
    cost: { red: 60 }, stats: { hpRegen: 12 },
    mechanicEffects: { 'defense.in-combat-regen-pct': 0.35 },
    tier: 1,
    description: 'A volcanic core that feeds on combat heat — 35% of your regen rate applies while fighting.',
  }],

  // ── Volcanic T2 — red + yellow + purple (cross-biome, 3 types) ────────────
  ['volcanic-blade-t2', {
    id: 'volcanic-blade-t2', name: 'Inferno Edge',
    recipeGroup: 'volcanic', requiredBiomeLevel: 6, slot: 'weapon',
    cost: { red: 88, yellow: 25, purple: 12 }, stats: { attack: 55 }, attacksPerSecond: 1.5, tier: 2,
    description: 'Folded in a live magma vent a thousand times over.',
  }],
  ['volcanic-vest-t2', {
    id: 'volcanic-vest-t2', name: 'Infernal Bestial Plate',
    recipeGroup: 'volcanic', requiredBiomeLevel: 7, slot: 'armor',
    cost: { red: 88, yellow: 25, purple: 12 }, stats: { maxHp: 65, plating: 22, damageReduction: 0.14 },
    mechanicEffects: { 'defense.in-combat-regen-pct': 0.25, 'defense.shield-pct': 0.08, 'defense.shield-interval-ms': 12000 },
    tier: 2,
    description: 'Living volcanic armor that regenerates in battle (25% of your regen rate) and forms an 8% maxHp shield every 12 seconds in combat.',
  }],
  ['volcanic-boots-t2', {
    id: 'volcanic-boots-t2', name: 'Magma Stride',
    recipeGroup: 'volcanic', requiredBiomeLevel: 9, slot: 'mobility',
    cost: { red: 74, yellow: 21, purple: 10 }, stats: { speed: 98 }, tier: 2,
    description: 'Boots from the oldest magma-golem — carries volcanic fury.',
  }],
  ['volcanic-charm-t2', {
    id: 'volcanic-charm-t2', name: 'Infernal Core',
    recipeGroup: 'volcanic', requiredBiomeLevel: 8, slot: 'recovery',
    cost: { red: 74, yellow: 21, purple: 10 }, stats: { hpRegen: 20 },
    mechanicEffects: { 'defense.in-combat-regen-pct': 0.45 },
    tier: 2,
    description: 'An infernal volcanic core of immense endurance — 45% of your regen rate applies in combat; the ultimate attrition charm.',
  }],
]);
