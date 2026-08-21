import type { Recipe } from './types';

// ─────────────────────────────────────────────────────────────────────────
// MOUNTAIN — full lineage (T1→T4). Identity: damage-cap armor / shield charm /
// slow big-hit hammer. (Reorg: per-biome files; see index.recipes.ts.)
//
// CHARM REWORK (this pass): charm upgrades now ramp the SECONDARY EFFECT, not the
// low-value hpRegen stat. Base mechanic ≈70% of the old flat value; three steps
// bring it to the old value at +3. hpRegen is now a flat per-tier base (no upgrade).
// ⚠ Engine: upgrade `mechanicEffects` are additive deltas onto the base mechanic.
// ─────────────────────────────────────────────────────────────────────────

export const mountainRecipeEntries = [
  // ── T1 ──
  ['heavy-hammer', {
    id: 'heavy-hammer', name: 'Heavy Hammer',
    recipeGroup: 'mountain', requiredBiomeLevel: 1, slot: 'weapon',
    cost: { blue: 22 }, stats: { attack: 26 }, attacksPerSecond: 0.55, tier: 1,
    icon: 'items/weapons/heavy-hammer.png',
    mechanicEffects: { 'weapon.empowered-mult-bonus': 0.15 },
    description: 'Two-handed, brutal, and honest. It asks only that you find the time to swing it.',
    upgrades: [
      { stats: { attack: 10 }, cost: { blue: 30 }, requiredBiomeLevel: 2 },
      { stats: { attack: 10 }, cost: { blue: 66 }, requiredBiomeLevel: 3 },
      { stats: { attack: 10 }, cost: { blue: 126 }, requiredBiomeLevel: 4 },
      { stats: { attack: 10 }, cost: { blue: 126 }, requiredBiomeLevel: 4 },
      { stats: { attack: 10 }, cost: { blue: 126 }, requiredBiomeLevel: 4 },
    ],
  }],

  ['mountain-vest-t1', {
    id: 'mountain-vest-t1', name: 'Fallen Knight Plate',
    recipeGroup: 'mountain', requiredBiomeLevel: 2, slot: 'armor',
    cost: { blue: 22 }, stats: { maxHp: 22, plating: 7 },
    mechanicEffects: { 'defense.max-hit-pct': 0.25, 'defense.max-hit-mult': 0.5 },
    tier: 1,
    icon: 'items/armor/fallen-knight-plate.png',
    description: 'Stripped from a knight who fell at the high pass and was never named.',
    upgrades: [
      { stats: { maxHp: 6, plating: 2 }, cost: { blue: 30 }, requiredBiomeLevel: 3 },
      { stats: { maxHp: 6, plating: 2 }, cost: { blue: 66 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 6, plating: 2 }, cost: { blue: 126 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 6, plating: 2 }, cost: { blue: 126 }, requiredBiomeLevel: 4 },
      { stats: { maxHp: 6, plating: 2 }, cost: { blue: 126 }, requiredBiomeLevel: 4 },
    ],
  }],

   // CHARM (shield): base 0.09 -> +0.01/step -> 0.12 at +3. hpRegen 3 flat.
  ['mountain-charm-t1', {
    id: 'mountain-charm-t1', name: 'Granite Barrier',
    recipeGroup: 'mountain', requiredBiomeLevel: 3, slot: 'recovery',
    cost: { blue: 18 }, stats: { hpRegen: 3 },
    mechanicEffects: { 'defense.shield-pct': 0.09, 'defense.shield-interval-ms': 10000, 'defense.shield-duration-ms': 10000 },
    tier: 1,
    icon: 'items/charms/granite-barrier.png',
    description: 'A palm of carved granite, cold and patient as the peak it came from.',
    upgrades: [
      { mechanicEffects: { 'defense.shield-pct': 0.01 }, cost: { blue: 15 }, requiredBiomeLevel: 4 },
      { mechanicEffects: { 'defense.shield-pct': 0.01 }, cost: { blue: 33 }, requiredBiomeLevel: 4 },
      { mechanicEffects: { 'defense.shield-pct': 0.01 }, cost: { blue: 63 }, requiredBiomeLevel: 4 },
      { mechanicEffects: { 'defense.shield-pct': 0.01 }, cost: { blue: 63 }, requiredBiomeLevel: 4 },
      { mechanicEffects: { 'defense.shield-pct': 0.01 }, cost: { blue: 63 }, requiredBiomeLevel: 4 },
    ],
  }],

  ['mountain-boots-t1', {
    id: 'mountain-boots-t1', name: 'Iron Treads',
    recipeGroup: 'mountain', requiredBiomeLevel: 4, slot: 'mobility',
    cost: { blue: 18 }, stats: { speed: 18 }, tier: 1,
    mechanicEffects: { 'mobility.acquire-speed-pct': 0.50, 'mobility.acquire-speed-ms': 3000, 'mobility.acquire-cooldown-ms': 6000 },
    icon: 'items/boots/iron-treads.png',
    description: 'Heavy soles that bite into scree and loose rock alike.',
    upgrades: [
      { stats: { speed: 3 }, cost: { blue: 10 }, requiredBiomeLevel: 4 },
      { stats: { speed: 4 }, cost: { blue: 22 }, requiredBiomeLevel: 4 },
      { stats: { speed: 4 }, cost: { blue: 42 }, requiredBiomeLevel: 4 },
      { stats: { speed: 4 }, cost: { blue: 42 }, requiredBiomeLevel: 4 },
      { stats: { speed: 4 }, cost: { blue: 42 }, requiredBiomeLevel: 4 },
    ],
  }],

  // ── T2 ──
  ['quake-hammer', {
    id: 'quake-hammer', name: 'Quake Hammer',
    recipeGroup: 'mountain', requiredBiomeLevel: 7, slot: 'weapon',
    cost: { blue: 52 }, catalystCost: { heavy: 2 }, stats: { attack: 54 }, attacksPerSecond: 0.55, tier: 2, // family-tag: slow heavy hammer → Heavy
    icon: 'items/weapons/quake-hammer.png',
    // Cast Speed (abilities evolution §6.1) lives on Mountain's T2 hammer — the
    // biome that owns Charged Strike, and whose whole identity is the wind-up.
    // Only affects abilities with a real castTime. PLACEHOLDER magnitude.
    mechanicEffects: {
      'weapon.empowered-mult-bonus': 0.30,
      'technique.cast-speed-pct': 0.15,
    },
    description: 'When it lands, the ground remembers it longer than the foe does.',
    upgrades: [
      { stats: { attack: 24 }, cost: { blue: 78 }, requiredBiomeLevel: 8 },
      { stats: { attack: 24 }, cost: { blue: 156 }, requiredBiomeLevel: 9 },
      { stats: { attack: 24 }, cost: { blue: 312 }, requiredBiomeLevel: 10 },
      { stats: { attack: 24 }, cost: { blue: 312 }, requiredBiomeLevel: 10 },
      { stats: { attack: 24 }, cost: { blue: 312 }, requiredBiomeLevel: 10 },
    ],
  }],

  ['mountain-vest-t2', {
    id: 'mountain-vest-t2', name: 'Iron Crusader Plate',
    recipeGroup: 'mountain', requiredBiomeLevel: 8, slot: 'armor',
    cost: { blue: 52 }, catalystCost: { heavy: 2 }, stats: { maxHp: 29, plating: 12, damageReduction: 0.05 }, // family-tag: damage-cap plate → Heavy
    mechanicEffects: { 'defense.max-hit-pct': 0.25, 'defense.max-hit-mult': 0.5 },
    tier: 2,
    icon: 'items/armor/iron-crusader-plate.png',
    description: 'Masterwork plate of the old crusades, dented in a hundred places, breached in none.',
    upgrades: [
      { stats: { maxHp: 8, plating: 3 }, cost: { blue: 78 }, requiredBiomeLevel: 9 },
      { stats: { maxHp: 8, plating: 3 }, cost: { blue: 156 }, requiredBiomeLevel: 10 },
      { stats: { maxHp: 8, plating: 3 }, cost: { blue: 276 }, requiredBiomeLevel: 10 },
      { stats: { maxHp: 8, plating: 3 }, cost: { blue: 276 }, requiredBiomeLevel: 10 },
      { stats: { maxHp: 8, plating: 3 }, cost: { blue: 276 }, requiredBiomeLevel: 10 },
    ],
  }],

  // CHARM (shield): base 0.12 -> +0.02/step -> 0.18 at +3. hpRegen 6 flat.
  ['mountain-charm-t2', {
    id: 'mountain-charm-t2', name: 'Iron Bulwark',
    recipeGroup: 'mountain', requiredBiomeLevel: 9, slot: 'recovery',
    cost: { blue: 42 }, catalystCost: { heavy: 2 }, stats: { hpRegen: 6 }, // family-tag: periodic shield (anti-spike) → Heavy
    mechanicEffects: { 'defense.shield-pct': 0.12, 'defense.shield-interval-ms': 8000, 'defense.shield-duration-ms': 8000 },
    tier: 2,
    icon: 'items/charms/iron-bulwark.png',
    description: 'A ward-stone the mountainfolk pass down, hand to weathered hand.',
    upgrades: [
      { mechanicEffects: { 'defense.shield-pct': 0.02 }, cost: { blue: 30 }, requiredBiomeLevel: 10 },
      { mechanicEffects: { 'defense.shield-pct': 0.02 }, cost: { blue: 60 }, requiredBiomeLevel: 10 },
      { mechanicEffects: { 'defense.shield-pct': 0.02 }, cost: { blue: 112 }, requiredBiomeLevel: 10 },
      { mechanicEffects: { 'defense.shield-pct': 0.02 }, cost: { blue: 112 }, requiredBiomeLevel: 10 },
      { mechanicEffects: { 'defense.shield-pct': 0.02 }, cost: { blue: 112 }, requiredBiomeLevel: 10 },
    ],
  }],

  ['mountain-boots-t2', {
    id: 'mountain-boots-t2', name: 'Mountain Stride',
    recipeGroup: 'mountain', requiredBiomeLevel: 10, slot: 'mobility',
    cost: { blue: 42 }, catalystCost: { heavy: 2 }, stats: { speed: 29 }, tier: 2, // family-tag: gap-closer boots serve the heavy-hit identity → Heavy
    mechanicEffects: { 'mobility.acquire-speed-pct': 0.65, 'mobility.acquire-speed-ms': 3000, 'mobility.acquire-cooldown-ms': 6000 },
    icon: 'items/boots/mountain-stride.png',
    description: 'Forged for those who treat a sheer slope as a road.',
    upgrades: [
      { stats: { speed: 3 }, cost: { blue: 20 }, requiredBiomeLevel: 10 },
      { stats: { speed: 4 }, cost: { blue: 42 }, requiredBiomeLevel: 10 },
      { stats: { speed: 5 }, cost: { blue: 75 }, requiredBiomeLevel: 10 },
      { stats: { speed: 5 }, cost: { blue: 75 }, requiredBiomeLevel: 10 },
      { stats: { speed: 5 }, cost: { blue: 75 }, requiredBiomeLevel: 10 },
    ],
  }],

  // ── T3 ──
  ['mountain-avalanche-maul', {
    id: 'mountain-avalanche-maul', name: 'Avalanche Maul',
    recipeGroup: 'mountain', requiredBiomeLevel: 13, slot: 'weapon',
    cost: { blue: 116 }, catalystCost: { heavy: 3 }, stats: { attack: 120 }, attacksPerSecond: 0.55, tier: 3, // family-tag: slow heavy maul → Heavy
    icon: 'items/weapons/avalanche-maul.png',
    mechanicEffects: { 'weapon.empowered-mult-bonus': 0.50 },
    description: 'It does not so much strike as arrive, the way a slope arrives on a village.',
    upgrades: [
      { stats: { attack: 28 }, cost: { blue: 174 },  requiredBiomeLevel: 14 },
      { stats: { attack: 28 }, cost: { blue: 348 }, requiredBiomeLevel: 15 },
      { stats: { attack: 28 }, cost: { blue: 588 }, requiredBiomeLevel: 16 },
      { stats: { attack: 28 }, cost: { blue: 588 }, requiredBiomeLevel: 16 },
      { stats: { attack: 28 }, cost: { blue: 588 }, requiredBiomeLevel: 16 },
    ],
  }],

  ['mountain-vest-t3', {
    id: 'mountain-vest-t3', name: 'Summit Aegis',
    recipeGroup: 'mountain', requiredBiomeLevel: 14, slot: 'armor',
    cost: { blue: 116, red: 29 }, catalystCost: { heavy: 3 }, stats: { maxHp: 55, plating: 23, damageReduction: 0.10 }, // family-tag: damage-cap plate → Heavy
    mechanicEffects: { 'defense.max-hit-pct': 0.25, 'defense.max-hit-mult': 0.5 },
    tier: 3,
    icon: 'items/armor/summit-aegis.png',
    description: 'Forged for those who plan to be hit by something the size of a house and walk on.',
    upgrades: [
      { stats: { maxHp: 14, plating: 6 }, cost: { blue: 130, red: 44},  requiredBiomeLevel: 15 },
      { stats: { maxHp: 14, plating: 6 }, cost: { blue: 260, red: 88 }, requiredBiomeLevel: 16 },
      { stats: { maxHp: 14, plating: 6 }, cost: { blue: 390, red: 132 }, requiredBiomeLevel: 16 },
      { stats: { maxHp: 14, plating: 6 }, cost: { blue: 390, red: 132 }, requiredBiomeLevel: 16 },
      { stats: { maxHp: 14, plating: 6 }, cost: { blue: 390, red: 132 }, requiredBiomeLevel: 16 },
    ],
  }],

  // CHARM (shield): base 0.17 -> +0.03/step -> 0.26 at +3. hpRegen 11 flat.
  ['mountain-charm-t3', {
    id: 'mountain-charm-t3', name: 'Bastion Heart',
    recipeGroup: 'mountain', requiredBiomeLevel: 15, slot: 'recovery',
    cost: { blue: 100, red: 25 }, catalystCost: { heavy: 3 }, stats: { hpRegen: 11 }, // family-tag: periodic shield (anti-spike) → Heavy
    mechanicEffects: { 'defense.shield-pct': 0.17, 'defense.shield-interval-ms': 8000, 'defense.shield-duration-ms': 8000 },
    tier: 3,
    icon: 'items/charms/bastion-heart.png',
    description: 'A core of mountain-heart stone that raises a wall of itself, over and over.',
    upgrades: [
      { mechanicEffects: { 'defense.shield-pct': 0.03 }, cost: { blue: 50, red: 25 },  requiredBiomeLevel: 16 },
      { mechanicEffects: { 'defense.shield-pct': 0.03 }, cost: { blue: 100, red: 50 }, requiredBiomeLevel: 16 },
      { mechanicEffects: { 'defense.shield-pct': 0.03 }, cost: { blue: 150, red: 75 }, requiredBiomeLevel: 16 },
      { mechanicEffects: { 'defense.shield-pct': 0.03 }, cost: { blue: 150, red: 75 }, requiredBiomeLevel: 16 },
      { mechanicEffects: { 'defense.shield-pct': 0.03 }, cost: { blue: 150, red: 75 }, requiredBiomeLevel: 16 },
    ],
  }],

  ['mountain-boots-t3', {
    id: 'mountain-boots-t3', name: 'Peak Stride',
    recipeGroup: 'mountain', requiredBiomeLevel: 16, slot: 'mobility',
    cost: { blue: 100 }, catalystCost: { heavy: 3 }, stats: { speed: 42 }, tier: 3, // family-tag: gap-closer boots → Heavy
    mechanicEffects: { 'mobility.acquire-speed-pct': 0.75, 'mobility.acquire-speed-ms': 3000, 'mobility.acquire-cooldown-ms': 6000 },
    icon: 'items/boots/peak-stride.png',
    description: 'Not even the mountain can keep you from your prey.',
    upgrades: [
      { stats: { speed: 3 }, cost: { blue: 20 }, requiredBiomeLevel: 16 },
      { stats: { speed: 4 }, cost: { blue: 42 }, requiredBiomeLevel: 16 },
      { stats: { speed: 5 }, cost: { blue: 75 }, requiredBiomeLevel: 16 },
      { stats: { speed: 5 }, cost: { blue: 75 }, requiredBiomeLevel: 16 },
      { stats: { speed: 5 }, cost: { blue: 75 }, requiredBiomeLevel: 16 },
    ],
  }],

  // T4

  ['mountain-earthsunder-maul', {
    id: 'mountain-earthsunder-maul', name: 'Earthsunder Maul',
    recipeGroup: 'mountain', requiredBiomeLevel: 19, slot: 'weapon',
    cost: { blue: 256 }, catalystCost: { heavy: 4 }, stats: { attack: 280 }, attacksPerSecond: 0.40, tier: 4, // family-tag: capstone heavy maul → Heavy
    icon: 'items/weapons/earthsunder-maul.png',
    description: 'It does not strike the earth so much as remind it of an old grievance.',
    upgrades: [
      { stats: { attack: 60 }, cost: { blue: 384 },  requiredBiomeLevel: 20 },
      { stats: { attack: 60 }, cost: { blue: 768 },  requiredBiomeLevel: 21 },
      { stats: { attack: 60 }, cost: { blue: 1290 }, requiredBiomeLevel: 22 },
      { stats: { attack: 60 }, cost: { blue: 1290 }, requiredBiomeLevel: 22 },
      { stats: { attack: 60 }, cost: { blue: 1290 }, requiredBiomeLevel: 22 },
    ],
  }],

  ['mountain-warmaul', {
    id: 'mountain-warmaul', name: 'Warmaul',
    recipeGroup: 'mountain', requiredBiomeLevel: 19, slot: 'weapon',
    cost: { blue: 240 }, catalystCost: { heavy: 4 }, stats: { attack: 180 }, attacksPerSecond: 0.55, tier: 4, // family-tag: capstone hammer → Heavy
    // ⚠⚠ empowered-mult-bonus MUST be implemented MULTIPLICATIVELY, not additively.
    // final empowered mult = base_mult * (1 + 0.25), i.e. a flat +25% to the
    // empowered hit REGARDLESS of the spec's base multiplier.
    // Additive (+0.25 flat) would skew hugely toward low-mult/high-frequency
    // specs (1.5→1.75 = +17%) and barely help high-mult specs (4.0→4.25 = +6%).
    // Multiplicative gives every spec the same %, which is the design intent.
    mechanicEffects: { 'weapon.empowered-mult-bonus': 0.60 },
    icon: 'items/weapons/warmaul.png',
    description: 'Lighter in the haft, quicker to the shoulder — it rewards the soldier who already knows when to swing.',
    upgrades: [
      { stats: { attack: 50 }, cost: { blue: 360 },  requiredBiomeLevel: 20 },
      { stats: { attack: 50 }, cost: { blue: 720 },  requiredBiomeLevel: 21 },
      { stats: { attack: 50 }, cost: { blue: 1200 }, requiredBiomeLevel: 22 },
      { stats: { attack: 50 }, cost: { blue: 1200 }, requiredBiomeLevel: 22 },
      { stats: { attack: 50 }, cost: { blue: 1200 }, requiredBiomeLevel: 22 },
    ],
  }],

  ['mountain-vest-t4', {
    id: 'mountain-vest-t4', name: "Titan's Keep",
    recipeGroup: 'mountain', requiredBiomeLevel: 20, slot: 'armor',
    cost: { blue: 256, red: 64 }, catalystCost: { heavy: 4 }, stats: { maxHp: 100, plating: 40, damageReduction: 0.12 }, // family-tag: capstone damage-cap plate → Heavy
    // † max-hit-rearms-shield: when the damage cap triggers, immediately rearm
    //   the shield charm (resets its interval). (new engine key)
    mechanicEffects: {
      'defense.max-hit-pct': 0.25, 'defense.max-hit-mult': 0.5,
      'defense.max-hit-rearms-shield': 1,
    },
    tier: 4,
    icon: 'items/armor/titans-keep.png',
    description: 'The blow that should have ended you instead rings the walls — and the walls answer by standing back up.',
    upgrades: [
      { stats: { maxHp: 25, plating: 10 }, cost: { blue: 290, red: 96 },  requiredBiomeLevel: 21 },
      { stats: { maxHp: 25, plating: 10 }, cost: { blue: 572, red: 192 }, requiredBiomeLevel: 22 },
      { stats: { maxHp: 25, plating: 10 }, cost: { blue: 858, red: 290 }, requiredBiomeLevel: 22 },
      { stats: { maxHp: 25, plating: 10 }, cost: { blue: 858, red: 290 }, requiredBiomeLevel: 22 },
      { stats: { maxHp: 25, plating: 10 }, cost: { blue: 858, red: 290 }, requiredBiomeLevel: 22 },
    ],
  }],

  ['mountain-vest-t4-stormwall', {
    id: 'mountain-vest-t4-stormwall', name: 'Stormwall Plate',
    recipeGroup: 'mountain', requiredBiomeLevel: 20, slot: 'armor',
    cost: { blue: 256, red: 64 }, catalystCost: { heavy: 4 }, stats: { maxHp: 100, plating: 30, damageReduction: 0.14 }, // family-tag: capstone anti-spike plate → Heavy
    // † shield-break-hp-recovery-pct: on shield break, recover 30% of the shield
    //   max value as HP. (new engine key — armor-side variant)
    mechanicEffects: {
      'defense.max-hit-pct': 0.25, 'defense.max-hit-mult': 0.5,
      'defense.shield-break-hp-recovery-pct': 0.30,
    },
    tier: 4,
    icon: 'items/armor/stormwall-plate.png',
    description: 'Built to take the storm head-on and turn what it absorbs back into a second wind.',
    upgrades: [
      { stats: { maxHp: 25, plating: 8 }, cost: { blue: 290, red: 96 },  requiredBiomeLevel: 21 },
      { stats: { maxHp: 25, plating: 8 }, cost: { blue: 572, red: 192 }, requiredBiomeLevel: 22 },
      { stats: { maxHp: 25, plating: 8 }, cost: { blue: 858, red: 290 }, requiredBiomeLevel: 22 },
      { stats: { maxHp: 25, plating: 8 }, cost: { blue: 858, red: 290 }, requiredBiomeLevel: 22 },
      { stats: { maxHp: 25, plating: 8 }, cost: { blue: 858, red: 290 }, requiredBiomeLevel: 22 },
    ],
  }],

  ['mountain-charm-t4', {
    id: 'mountain-charm-t4', name: 'Fortress Heart',
    recipeGroup: 'mountain', requiredBiomeLevel: 21, slot: 'recovery',
    cost: { blue: 220, red: 30 }, catalystCost: { heavy: 4 }, stats: { hpRegen: 16 }, // family-tag: periodic shield (anti-spike) → Heavy
    mechanicEffects: { 'defense.shield-pct': 0.18, 'defense.shield-interval-ms': 8000, 'defense.shield-duration-ms': 8000 },
    tier: 4,
    icon: 'items/charms/fortress-heart.png',
    description: 'A keep in miniature: it throws up a wall, lets it fall, and throws up another, tireless as siegework.',
    upgrades: [
      { mechanicEffects: { 'defense.shield-pct': 0.04 }, cost: { blue: 110, red: 30 }, requiredBiomeLevel: 22 },
      { mechanicEffects: { 'defense.shield-pct': 0.04 }, cost: { blue: 220, red: 60 }, requiredBiomeLevel: 22 },
      { mechanicEffects: { 'defense.shield-pct': 0.04 }, cost: { blue: 340, red: 90 }, requiredBiomeLevel: 22 },
      { mechanicEffects: { 'defense.shield-pct': 0.04 }, cost: { blue: 340, red: 90 }, requiredBiomeLevel: 22 },
      { mechanicEffects: { 'defense.shield-pct': 0.04 }, cost: { blue: 340, red: 90 }, requiredBiomeLevel: 22 },
    ],
  }],

  ['mountain-charm-t4-shieldmend', {
    id: 'mountain-charm-t4-shieldmend', name: 'Shieldmend Ward',
    recipeGroup: 'mountain', requiredBiomeLevel: 21, slot: 'recovery',
    cost: { blue: 220, red: 30 }, catalystCost: { heavy: 4 }, stats: { hpRegen: 16 }, // family-tag: shield-break survival → Heavy
    // † shield-break-heal-pct: when the shield is fully broken, heal 25% of the
    //   shield's max value as HP. (new engine key)
    mechanicEffects: {
      'defense.shield-pct': 0.18, 'defense.shield-interval-ms': 8000, 'defense.shield-duration-ms': 8000,
      'defense.shield-break-heal-pct': 0.25,
    },
    tier: 4,
    icon: 'items/charms/shieldmend-ward.png',
    description: 'When the ward shatters, it gives back a little of the blow it ate.',
    upgrades: [
      { mechanicEffects: { 'defense.shield-pct': 0.03 }, cost: { blue: 110, red: 30 }, requiredBiomeLevel: 22 },
      { mechanicEffects: { 'defense.shield-pct': 0.03 }, cost: { blue: 220, red: 60 }, requiredBiomeLevel: 22 },
      { mechanicEffects: { 'defense.shield-pct': 0.03 }, cost: { blue: 340, red: 90 }, requiredBiomeLevel: 22 },
      { mechanicEffects: { 'defense.shield-pct': 0.03 }, cost: { blue: 340, red: 90 }, requiredBiomeLevel: 22 },
      { mechanicEffects: { 'defense.shield-pct': 0.03 }, cost: { blue: 340, red: 90 }, requiredBiomeLevel: 22 },
    ],
  }],

  ['mountain-boots-t4', {
    id: 'mountain-boots-t4', name: 'Vanguard Stride',
    recipeGroup: 'mountain', requiredBiomeLevel: 22, slot: 'mobility',
    cost: { blue: 220 }, catalystCost: { heavy: 4 }, stats: { speed: 57 }, tier: 4, // family-tag: gap-closer boots → Heavy
    mechanicEffects: { 'mobility.acquire-speed-pct': 0.90, 'mobility.acquire-speed-ms': 3000, 'mobility.acquire-cooldown-ms': 6000 },
    icon: 'items/boots/vanguard-stride.png',
    description: 'The instant a foe is marked, they close the gap as if the mountain itself leaned them forward.',
    upgrades: [
      { stats: { speed: 4 }, cost: { blue: 44 },  requiredBiomeLevel: 22 },
      { stats: { speed: 5 }, cost: { blue: 92 },  requiredBiomeLevel: 22 },
      { stats: { speed: 6 }, cost: { blue: 165 }, requiredBiomeLevel: 22 },
      { stats: { speed: 6 }, cost: { blue: 165 }, requiredBiomeLevel: 22 },
      { stats: { speed: 6 }, cost: { blue: 165 }, requiredBiomeLevel: 22 },
    ],
  }],


  // ── Cores ───────────────────────────────────────────────────────────────────────
  // See the CORES header in plains.recipes.ts. Mountain owns ENDURANCE AND
  // PREPARATION — Brace and Charged Strike are both learned here, so it carries
  // both the tank core and the ability core.

  // T3 melee — Juggernaut: the dedicated tank, and melee-exclusive by design.
  // Other ranges may buy survivability, but never this whole package.
  ['core-juggernaut', {
    id: 'core-juggernaut', name: 'Juggernaut Core',
    recipeGroup: 'mountain', requiredBiomeLevel: 14, slot: 'core', coreEligibility: 'melee',
    lineageId: 'core-juggernaut',
    cost: { blue: 110 }, catalystCost: { heavy: 3 }, // family-tag: durability wall → Heavy
    stats: {}, tier: 3,
    // HP, plating and the separate DR layer COMPOUND, so this must be judged as a
    // whole survivability package rather than three numbers. It clears slowly —
    // that is the cost, and it is paid in attack speed and movement, not in eHP.
    mechanicEffects: {
      'core.maxhp-mult': 0.25, 'core.plating-mult': 0.32, 'core.dr-layer-pct': 0.12,
      'core.attack-speed-mult': -0.20, 'core.speed-mult': -0.07,
    },
    icon: 'items/cores/juggernaut.png',
    description: 'The mountain does not dodge. It simply outlasts whatever is thrown at it, and so will you.',
  }],

  // T3 unrestricted — Arcanist: abilities come back faster and hit harder.
  // TECHNIQUE-ONLY on purpose: `technique.*` (offence) and `guard.*` (defence) are
  // separate budgets so one item can never buy both. A Guard-flavoured branch is
  // where the defensive half belongs.
  ['core-arcanist', {
    id: 'core-arcanist', name: 'Arcanist Core',
    recipeGroup: 'mountain', requiredBiomeLevel: 17, slot: 'core', coreEligibility: 'unrestricted',
    lineageId: 'core-arcanist',
    cost: { blue: 90 }, catalystCost: { swarming: 2 }, // family-tag: ability tempo → Swarming
    stats: {}, tier: 3,
    // Worth little when abilities are a minor part of the build — the specialisation
    // IS the opportunity cost, so no explicit penalty is authored.
    mechanicEffects: { 'technique.cooldown-reduction-pct': 0.18, 'technique.power-pct': 0.08 },
    icon: 'items/cores/arcanist.png',
    description: 'Thin air, long thoughts. The gap between what you can do and how often shrinks.',
  }],

  ['relic-colossus-heart', {
    id: 'relic-colossus-heart', name: 'Colossus Heart',
    recipeGroup: 'mountain', requiredBiomeLevel: 24, slot: 'relic',
    lineageId: 'relic-colossus-heart',
    cost: { blue: 240 }, catalystCost: { heavy: 4 },
    stats: {}, tier: 4,
    mechanicEffects: {
      'relic.mechanic-frequency': -0.30,
      'relic.mechanic-potency': 0.40,
    },
    icon: 'items/relics/colossus-heart.png',
    description: 'A mountain heartbeat: slow enough to feel inevitable, heavy enough to end the argument.',
  }],

] satisfies [string, Recipe][];
