import type { Recipe } from './types';

export const plainsSwampCaveRecipeEntries = [
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
] satisfies [string, Recipe][];
