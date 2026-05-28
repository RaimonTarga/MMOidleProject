import type { Recipe } from './types';

export const plainsSwampCaveRecipeEntries = [
  // ── Plains T1 — yellow only ────────────────────────────────────────────────
  ['iron-broadsword', {
    id: 'iron-broadsword', name: 'Iron Broadsword',
    recipeGroup: 'plains', requiredBiomeLevel: 1, slot: 'weapon',
    cost: { yellow: 14 }, stats: { attack: 8 }, attacksPerSecond: 0.65, tier: 1,
    description: 'A dependable iron blade carried by soldiers, travelers, and adventurers alike. It lacks flair, but never fails its wielder.',
    upgrades: [
      { stats: { attack: 2 }, cost: { yellow: 10 }, requiredBiomeLevel: 2 },
      { stats: { attack: 3 }, cost: { yellow: 22 }, requiredBiomeLevel: 3 },
      { stats: { attack: 5 }, cost: { yellow: 42 }, requiredBiomeLevel: 4 },
    ],
  }],

  ['sacred-cross', {
    id: 'sacred-cross', name: 'Sacred Cross',
    recipeGroup: 'plains', requiredBiomeLevel: 1, slot: 'weapon',
    cost: { yellow: 20 }, stats: { attack: 6 }, attacksPerSecond: 0.50, tier: 1,
    description: 'A simple iron cross bearing ward runes — strikes are unhurried, but the stored energy discharges in a reliable burst every 6 seconds.',
    upgrades: [
      { stats: { attack: 1 }, cost: { yellow: 10 }, requiredBiomeLevel: 2 },
      { stats: { attack: 2 }, cost: { yellow: 22 }, requiredBiomeLevel: 3 },
      { stats: { attack: 3 }, cost: { yellow: 42 }, requiredBiomeLevel: 4 },
    ],
  }],

  ['plains-vest-t1', {
    id: 'plains-vest-t1', name: "Survivor's Robe",
    recipeGroup: 'plains', requiredBiomeLevel: 4, slot: 'armor',
    cost: { yellow: 20 }, stats: { maxHp: 12, plating: 3, damageReduction: 0.15 }, tier: 1,
    description: 'Reinforced field cloth built to endure sustained punishment — wide coverage and solid padding.',
    upgrades: [
      { stats: { maxHp: 3, plating: 1 }, cost: { yellow: 10 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 5, plating: 1 }, cost: { yellow: 22 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 6, plating: 2 }, cost: { yellow: 42 }, requiredBiomeLevel: 4 },
    ],
  }],

  ['plains-boots-t1', {
    id: 'plains-boots-t1', name: 'Fleet Boots',
    recipeGroup: 'plains', requiredBiomeLevel: 3, slot: 'mobility',
    cost: { yellow: 16 }, stats: { speed: 25 }, tier: 1,
    description: 'Open-toe sandals built for sprinting across flat ground.',
    upgrades: [
      { stats: { speed: 5 }, cost: { yellow: 10 }, requiredBiomeLevel: 4 },
      { stats: { speed: 7 }, cost: { yellow: 22 }, requiredBiomeLevel: 4 },
      { stats: { speed: 9 }, cost: { yellow: 42 }, requiredBiomeLevel: 4 },
    ],
  }],

  ['plains-charm-t1', {
    id: 'plains-charm-t1', name: 'Plains Core',
    recipeGroup: 'plains', requiredBiomeLevel: 2, slot: 'recovery',
    cost: { yellow: 16 }, stats: { hpRegen: 4 },
    mechanicEffects: { 'defense.in-combat-regen-pct': 0.20 },
    tier: 1,
    description: 'A sun-warmed plains stone — 20% of your regen rate applies while you are actively fighting.',
    upgrades: [
      { stats: { hpRegen: 1 }, cost: { yellow: 10 }, requiredBiomeLevel: 3 },
      { stats: { hpRegen: 1 }, cost: { yellow: 22 }, requiredBiomeLevel: 4 },
      { stats: { hpRegen: 2 }, cost: { yellow: 42 }, requiredBiomeLevel: 4 },
    ],
  }],

  ['plains-vest-t2', {
    id: 'plains-vest-t2', name: 'Enduring Robe',
    recipeGroup: 'plains', requiredBiomeLevel: 8, slot: 'armor',
    cost: { yellow: 50, red: 12 }, stats: { maxHp: 25, plating: 5, damageReduction: 0.20 },
    mechanicEffects: { 'defense.absorb-pct': 0.08 },
    tier: 2,
    description: 'Life-binding thread woven into field armor — 8% of damage taken is converted into healing over 4 seconds.',
    upgrades: [
      { stats: { maxHp: 5, plating: 1 }, cost: { yellow: 24 }, requiredBiomeLevel: 8 },
      { stats: { maxHp: 8, plating: 2 }, cost: { yellow: 50 }, requiredBiomeLevel: 8 },
      { stats: { maxHp: 10, plating: 2 }, cost: { yellow: 90 }, requiredBiomeLevel: 8 },
    ],
  }],

  ['plains-boots-t2', {
    id: 'plains-boots-t2', name: 'Gale Boots',
    recipeGroup: 'plains', requiredBiomeLevel: 7, slot: 'mobility',
    cost: { yellow: 40, red: 10 }, stats: { speed: 48 }, tier: 2,
    description: 'Wind-woven leather that carries you with every step.',
    upgrades: [
      { stats: { speed: 7 },  cost: { yellow: 20 }, requiredBiomeLevel: 8 },
      { stats: { speed: 10 }, cost: { yellow: 40 }, requiredBiomeLevel: 8 },
      { stats: { speed: 14 }, cost: { yellow: 72 }, requiredBiomeLevel: 8 },
    ],
  }],

  ['plains-charm-t2', {
    id: 'plains-charm-t2', name: 'Stalwart Core',
    recipeGroup: 'plains', requiredBiomeLevel: 6, slot: 'recovery',
    cost: { yellow: 40, red: 10 }, stats: { hpRegen: 7 },
    mechanicEffects: { 'defense.in-combat-regen-pct': 0.30 },
    tier: 2,
    description: 'Battle-hardened plains core — 30% of your regen rate in combat lets you outlast any prolonged fight.',
    upgrades: [
      { stats: { hpRegen: 1 }, cost: { yellow: 20 }, requiredBiomeLevel: 7 },
      { stats: { hpRegen: 2 }, cost: { yellow: 40 }, requiredBiomeLevel: 8 },
      { stats: { hpRegen: 3 }, cost: { yellow: 72 }, requiredBiomeLevel: 8 },
    ],
  }],

  ['ashbrand-blade', {
    id: 'ashbrand-blade', name: 'Ashbrand Blade',
    recipeGroup: 'swamp', requiredBiomeLevel: 1, slot: 'weapon',
    cost: { purple: 22 }, stats: { attack: 7 }, attacksPerSecond: 0.75, tier: 1,
    description: 'A crude blade with heat-etch runes scratched into the flat — strikes leave a lingering burn that eats slowly from within.',
    upgrades: [
      { stats: { attack: 1 }, cost: { purple: 10 }, requiredBiomeLevel: 2 },
      { stats: { attack: 2 }, cost: { purple: 22 }, requiredBiomeLevel: 3 },
      { stats: { attack: 3 }, cost: { purple: 42 }, requiredBiomeLevel: 4 },
    ],
  }],

  ['swamp-vest-t1', {
    id: 'swamp-vest-t1', name: 'Arcane Wrappings',
    recipeGroup: 'swamp', requiredBiomeLevel: 4, slot: 'armor',
    cost: { purple: 22 }, stats: { maxHp: 10, plating: 3 },
    mechanicEffects: { 'defense.dot-resistance': 0.18 },
    tier: 1,
    description: 'Magically treated cloth that dampens toxins, burns, and corroding ailments — 18% reduction to all damage over time.',
    upgrades: [
      { stats: { maxHp: 3, plating: 1 }, cost: { purple: 10 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 4, plating: 1 }, cost: { purple: 22 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 5, plating: 1 }, cost: { purple: 42 }, requiredBiomeLevel: 4 },
    ],
  }],

  ['swamp-boots-t1', {
    id: 'swamp-boots-t1', name: 'Marsh Treads',
    recipeGroup: 'swamp', requiredBiomeLevel: 3, slot: 'mobility',
    cost: { purple: 18 }, stats: { speed: 20 }, tier: 1,
    description: 'Wide-soled boots that float on soft ground.',
    upgrades: [
      { stats: { speed: 4 }, cost: { purple: 10 }, requiredBiomeLevel: 4 },
      { stats: { speed: 6 }, cost: { purple: 22 }, requiredBiomeLevel: 4 },
      { stats: { speed: 8 }, cost: { purple: 42 }, requiredBiomeLevel: 4 },
    ],
  }],

  ['swamp-charm-t1', {
    id: 'swamp-charm-t1', name: 'Murk Eye',
    recipeGroup: 'swamp', requiredBiomeLevel: 2, slot: 'recovery',
    cost: { purple: 18 }, stats: { hpRegen: 3 },
    mechanicEffects: { 'defense.absorb-pct': 0.10 },
    tier: 1,
    description: 'A preserved swamp golem eye — 10% of all damage you take is returned as healing over 4 seconds.',
    upgrades: [
      { stats: { hpRegen: 1 }, cost: { purple: 10 }, requiredBiomeLevel: 3 },
      { stats: { hpRegen: 1 }, cost: { purple: 22 }, requiredBiomeLevel: 4 },
      { stats: { hpRegen: 2 }, cost: { purple: 42 }, requiredBiomeLevel: 4 },
    ],
  }],


  ['swamp-vest-t2', {
    id: 'swamp-vest-t2', name: 'Void Wrappings',
    recipeGroup: 'swamp', requiredBiomeLevel: 8, slot: 'armor',
    cost: { purple: 54, green: 14 }, stats: { maxHp: 20, plating: 6 },
    mechanicEffects: { 'defense.dot-resistance': 0.30, 'defense.debuff-resistance': 0.12 },
    tier: 2,
    description: 'Deep-swamp cloth that nullifies 30% of incoming DoT and reduces the potency of all non-DoT debuffs by 12%.',
    upgrades: [
      { stats: { maxHp: 5, plating: 1 }, cost: { purple: 26 }, requiredBiomeLevel: 8 },
      { stats: { maxHp: 7, plating: 2 }, cost: { purple: 54 }, requiredBiomeLevel: 8 },
      { stats: { maxHp: 9, plating: 2 }, cost: { purple: 96 }, requiredBiomeLevel: 8 },
    ],
  }],

  ['swamp-boots-t2', {
    id: 'swamp-boots-t2', name: 'Wetland Wraps',
    recipeGroup: 'swamp', requiredBiomeLevel: 7, slot: 'mobility',
    cost: { purple: 44, green: 11 }, stats: { speed: 50 }, tier: 2,
    description: 'Enchanted wrappings that treat mud like solid ground.',
    upgrades: [
      { stats: { speed: 7 },  cost: { purple: 22 }, requiredBiomeLevel: 8 },
      { stats: { speed: 10 }, cost: { purple: 44 }, requiredBiomeLevel: 8 },
      { stats: { speed: 13 }, cost: { purple: 78 }, requiredBiomeLevel: 8 },
    ],
  }],

  ['swamp-charm-t2', {
    id: 'swamp-charm-t2', name: 'Void Eye',
    recipeGroup: 'swamp', requiredBiomeLevel: 6, slot: 'recovery',
    cost: { purple: 44, green: 11 }, stats: { hpRegen: 6 },
    mechanicEffects: { 'defense.absorb-pct': 0.15 },
    tier: 2,
    description: 'A void-tainted golem eye — 15% of damage taken streams back as healing; the harder the fight, the more you recover.',
    upgrades: [
      { stats: { hpRegen: 1 }, cost: { purple: 22 }, requiredBiomeLevel: 7 },
      { stats: { hpRegen: 2 }, cost: { purple: 44 }, requiredBiomeLevel: 8 },
      { stats: { hpRegen: 3 }, cost: { purple: 78 }, requiredBiomeLevel: 8 },
    ],
  }],

  ['chaotic-axe', {
    id: 'chaotic-axe', name: 'Chaotic Axe',
    recipeGroup: 'cave', requiredBiomeLevel: 1, slot: 'weapon',
    cost: { red: 22 }, stats: { attack: 10 }, attacksPerSecond: 1.10, tier: 1,
    description: 'An axe that swings with wild abandon — two in every three strikes land hard, but the third flies wide.',
    upgrades: [
      { stats: { attack: 2 }, cost: { red: 10 }, requiredBiomeLevel: 2 },
      { stats: { attack: 3 }, cost: { red: 22 }, requiredBiomeLevel: 3 },
      { stats: { attack: 5 }, cost: { red: 42 }, requiredBiomeLevel: 4 },
    ],
  }],

  ['cave-vest-t1', {
    id: 'cave-vest-t1', name: 'Bestial Hide',
    recipeGroup: 'cave', requiredBiomeLevel: 4, slot: 'armor',
    cost: { red: 22 }, stats: { maxHp: 20, plating: 3, damageReduction: 0.08 }, tier: 1,
    description: 'Dense cave-beast hide that absorbs raw force through sheer bulk.',
    upgrades: [
      { stats: { maxHp: 4, plating: 1 }, cost: { red: 10 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 6, plating: 1 }, cost: { red: 22 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 8, plating: 2 }, cost: { red: 42 }, requiredBiomeLevel: 4 },
    ],
  }],

  ['cave-boots-t1', {
    id: 'cave-boots-t1', name: 'Bat Wing Boots',
    recipeGroup: 'cave', requiredBiomeLevel: 3, slot: 'mobility',
    cost: { red: 18 }, stats: { speed: 28 }, tier: 1,
    description: 'Cave-bat membrane stretched over soles — near silent.',
    upgrades: [
      { stats: { speed: 5 }, cost: { red: 10 }, requiredBiomeLevel: 4 },
      { stats: { speed: 7 }, cost: { red: 22 }, requiredBiomeLevel: 4 },
      { stats: { speed: 10 }, cost: { red: 42 }, requiredBiomeLevel: 4 },
    ],
  }],

  ['cave-charm-t1', {
    id: 'cave-charm-t1', name: 'Pulse Stone',
    recipeGroup: 'cave', requiredBiomeLevel: 2, slot: 'recovery',
    cost: { red: 18 }, stats: { hpRegen: 3 },
    mechanicEffects: { 'defense.regen-burst-pct': 0.08, 'defense.regen-burst-interval-ms': 8000 },
    tier: 1,
    description: 'A cave crystal that rhythmically stores life energy — restores 8% of your max HP over 4 seconds every 8 seconds.',
    upgrades: [
      { stats: { hpRegen: 1 }, cost: { red: 10 }, requiredBiomeLevel: 3 },
      { stats: { hpRegen: 1 }, cost: { red: 22 }, requiredBiomeLevel: 4 },
      { stats: { hpRegen: 1 }, cost: { red: 42 }, requiredBiomeLevel: 4 },
    ],
  }],

  ['cave-vest-t2', {
    id: 'cave-vest-t2', name: 'Dire Bestial Hide',
    recipeGroup: 'cave', requiredBiomeLevel: 7, slot: 'armor',
    cost: { red: 54, purple: 14 }, stats: { maxHp: 38, plating: 6, damageReduction: 0.12 },
    mechanicEffects: { 'defense.in-combat-regen-pct': 0.15 },
    tier: 2,
    description: 'Living hide from a dire beast — slowly seals wounds while you fight, applying 15% of your regen rate in combat.',
    upgrades: [
      { stats: { maxHp: 7, plating: 2 }, cost: { red: 26 }, requiredBiomeLevel: 8 },
      { stats: { maxHp: 10, plating: 3 }, cost: { red: 54 }, requiredBiomeLevel: 8 },
      { stats: { maxHp: 12, plating: 4 }, cost: { red: 96 }, requiredBiomeLevel: 8 },
    ],
  }],

  ['cave-boots-t2', {
    id: 'cave-boots-t2', name: 'Cavern Sprints',
    recipeGroup: 'cave', requiredBiomeLevel: 7, slot: 'mobility',
    cost: { red: 44, purple: 11 }, stats: { speed: 55 }, tier: 2,
    description: 'Enchanted leather that makes tight tunnels feel wide open.',
    upgrades: [
      { stats: { speed: 7 },  cost: { red: 22 }, requiredBiomeLevel: 8 },
      { stats: { speed: 11 }, cost: { red: 44 }, requiredBiomeLevel: 8 },
      { stats: { speed: 14 }, cost: { red: 78 }, requiredBiomeLevel: 8 },
    ],
  }],

  ['cave-charm-t2', {
    id: 'cave-charm-t2', name: 'Resonant Gem',
    recipeGroup: 'cave', requiredBiomeLevel: 6, slot: 'recovery',
    cost: { red: 44, purple: 11 }, stats: { hpRegen: 6 },
    mechanicEffects: { 'defense.regen-burst-pct': 0.15, 'defense.regen-burst-interval-ms': 8000 },
    tier: 2,
    description: 'A fully resonated cave gem — 15% max HP healed over 4 seconds, pulsing every 8 seconds.',
    upgrades: [
      { stats: { hpRegen: 1 }, cost: { red: 22 }, requiredBiomeLevel: 7 },
      { stats: { hpRegen: 2 }, cost: { red: 44 }, requiredBiomeLevel: 8 },
      { stats: { hpRegen: 3 }, cost: { red: 78 }, requiredBiomeLevel: 8 },
    ],
  }],

  // ── Master merge additions ─────────────────────────────────────────────

  ['knight-steelsword', {
    id: 'knight-steelsword', name: "Knight's Steelsword",
    recipeGroup: 'plains', requiredBiomeLevel: 5, slot: 'weapon',
    cost: { yellow: 35, red: 8 }, stats: { attack: 20 }, attacksPerSecond: 0.80, tier: 2,
    description: 'A well-maintained soldier\'s blade — balanced, reliable, and cheaper to forge than most. Lacks flair; never fails.',
    upgrades: [
      { stats: { attack: 3 }, cost: { yellow: 18 }, requiredBiomeLevel: 6 },
      { stats: { attack: 5 }, cost: { yellow: 35 }, requiredBiomeLevel: 7 },
      { stats: { attack: 8 }, cost: { yellow: 64 }, requiredBiomeLevel: 8 },
    ],
  }],

  ['consecrated-cross', {
    id: 'consecrated-cross', name: 'Consecrated Cross',
    recipeGroup: 'plains', requiredBiomeLevel: 5, slot: 'weapon',
    cost: { yellow: 50, red: 12 }, stats: { attack: 8 }, attacksPerSecond: 0.50, tier: 2,
    description: 'An iron cross etched with amplified ward glyphs — the burst window lasts twice as long as lesser models, with only a slightly longer recovery.',
    upgrades: [
      { stats: { attack: 2 }, cost: { yellow: 24 }, requiredBiomeLevel: 6 },
      { stats: { attack: 3 }, cost: { yellow: 50 }, requiredBiomeLevel: 7 },
      { stats: { attack: 5 }, cost: { yellow: 88 }, requiredBiomeLevel: 8 },
    ],
  }],

  ['cinderfang-saber', {
    id: 'cinderfang-saber', name: 'Cinderfang Saber',
    recipeGroup: 'swamp', requiredBiomeLevel: 5, slot: 'weapon',
    cost: { purple: 54, green: 14 }, stats: { attack: 22 }, attacksPerSecond: 0.75, tier: 2,
    description: 'A quality saber whose runes burn deeper wounds — strikes stack seven layers of smoldering heat, building to a sustained inferno.',
    upgrades: [
      { stats: { attack: 3 }, cost: { purple: 26 }, requiredBiomeLevel: 6 },
      { stats: { attack: 5 }, cost: { purple: 54 }, requiredBiomeLevel: 7 },
      { stats: { attack: 8 }, cost: { purple: 96 }, requiredBiomeLevel: 8 },
    ],
  }],

  ['frostmourne-mace', {
    id: 'frostmourne-mace', name: 'Frostmourne Mace',
    recipeGroup: 'swamp', requiredBiomeLevel: 5, slot: 'weapon',
    cost: { purple: 54, green: 14 }, stats: { attack: 26 }, attacksPerSecond: 0.55, tier: 2,
    description: 'A dense mace with frost-slag inlay — fewer burn stacks than its kin, but the direct impact of each blow is noticeably heavier.',
    upgrades: [
      { stats: { attack: 4 }, cost: { purple: 26 }, requiredBiomeLevel: 6 },
      { stats: { attack: 6 }, cost: { purple: 54 }, requiredBiomeLevel: 7 },
      { stats: { attack: 10 }, cost: { purple: 96 }, requiredBiomeLevel: 8 },
    ],
  }],
] satisfies [string, Recipe][];
