import type { MonsterDefinition } from './types';

// ─────────────────────────────────────────────────────────────────────────
// BOSS REFACTOR — starter biomes (Plains/Forest/Mountain/Swamp/Cave), T1+T2.
//
// Same biome-shape discipline as the trash pass, but a boss is a SINGLE entity:
// it can't lean on swarm volume, so it must threaten even a tank on its own.
//   PLAINS    honest bruiser, no gimmick (the simplest boss — the "floor")
//   FOREST    fast, frequent attacks; frail, no armor      (evasion exam)
//   MOUNTAIN  rare HUGE slams ~40-50% of player HP          (cap + eHP exam)
//   SWAMP     trivial direct, heavy stacking DoT            (dot-resist exam)
//   CAVE      high HP + DR + plating, mixed                 (endurance / slow-weapon exam)
//
// Early bosses are kept SIMPLE — amplified stat blocks, no phases/adds. Slow
// bosses (Mountain/Cave) CHARGE so kiting builds can't trivialize them; ranged
// reach (attackRange) on the big slammers stops melee-range cheese.
//
// Cap exam: Mountain/Cave hits sit ~1.5x the 25%-maxHP cap threshold so the
// damage cap (and Cadence's innate cap) is genuinely worth equipping against them.
// Swamp DoT is strong but ramps over its duration and is beatable WITH dot-resist
// or sustain — the old bog-sovereign was an OP raw-HP sponge; this teaches instead.
//
// Advanced bosses (desert/jungle/tundra) are DEFERRED below, untouched.
// ─────────────────────────────────────────────────────────────────────────

export const bossMonsterEntriesT1T2 = [
  // ════════════════════════ T1 BOSSES ════════════════════════

  // PLAINS — the simplest boss: a straightforward bruiser, moderate everything.
  ['plains-champion', {
    id: 'plains-champion', name: 'Plains Champion', color: 0xddaa44,
    isBoss: true,
    stats: {
      hp: 560, attack: 34, plating: 4, damageReduction: 0.02,
      speed: 50, attackRange: 15, attackCooldown: 2000, pullRange: 280,
    },
    behavior: 'melee', attackStyle: 'impact', biome: 'plains',
    rewards: { essence: 100, essenceType: 'yellow', level: 5, biomeXp: 150 },
    ai: { wanderRadius: 120, leashRange: 750, idleMinMs: 1500, idleMaxMs: 4500 },
  }],

  // FOREST — fast and frequent; frail, no armor. The evasion exam.
  ['forest-warden', {
    id: 'forest-warden', name: 'Forest Warden', color: 0x33aa44,
    isBoss: true,
    stats: {
      hp: 480, attack: 30, plating: 0, damageReduction: 0,
      speed: 60, attackRange: 15, attackCooldown: 1400, pullRange: 300,
    },
    behavior: 'melee', attackStyle: 'slash', biome: 'forest',
    rewards: { essence: 100, essenceType: 'green', level: 5, biomeXp: 150 },
    ai: { wanderRadius: 160, leashRange: 800, idleMinMs: 1200, idleMaxMs: 4000 },
  }],

  // MOUNTAIN — SHAPE FIXED: was fast/slash. Now a slow charging mega-slam (~40%
  // of player HP) that trips the cap. The burst-check boss.
  ['mountain-sentinel', {
    id: 'mountain-sentinel', name: 'Mountain Sentinel', color: 0x8899bb,
    isBoss: true,
    stats: {
      hp: 640, attack: 66, plating: 0, damageReduction: 0,
      speed: 22, attackRange: 18, attackCooldown: 3500, pullRange: 280,
    },
    behavior: 'melee', attackStyle: 'impact', biome: 'mountain',
    rewards: { essence: 105, essenceType: 'blue', level: 5, biomeXp: 158 },
    ai: { wanderRadius: 120, leashRange: 750, idleMinMs: 2000, idleMaxMs: 5000 },
    chargeOnAggro: { speedMult: 3.0, durationMs: 1200 },
  }],

  // SWAMP — NERFED + reshaped: trivial direct hit, real (but beatable) DoT.
  // No longer an HP sponge; the threat is the poison, answered by dot-resist.
  ['bog-sovereign', {
    id: 'bog-sovereign', name: 'Bog Sovereign', color: 0x1e3d1e,
    isBoss: true,
    stats: {
      hp: 480, attack: 6, plating: 2, damageReduction: 0.02,
      speed: 28, attackRange: 15, attackCooldown: 2600, pullRange: 260,
    },
    behavior: 'melee', attackStyle: 'poison', biome: 'swamp',
    rewards: { essence: 100, essenceType: 'purple', level: 5, biomeXp: 150 },
    ai: { wanderRadius: 100, leashRange: 700, idleMinMs: 2000, idleMaxMs: 5500 },
    dotEffect: { damagePerStack: 6, maxStacks: 4, tickIntervalMs: 1000, durationMs: 4000 },
  }],

  // CAVE — tanky mixed elite: high HP, DR + plating, charges. Slow/piercing
  // weapons and %DR shine. The endurance boss.
  ['cave-sentinel', {
    id: 'cave-sentinel', name: 'Cave Sentinel', color: 0x334455,
    isBoss: true,
    stats: {
      hp: 760, attack: 54, plating: 6, damageReduction: 0.10,
      speed: 24, attackRange: 18, attackCooldown: 2800, pullRange: 240,
    },
    behavior: 'melee', attackStyle: 'impact', biome: 'cave',
    rewards: { essence: 110, essenceType: 'red', level: 5, biomeXp: 165 },
    ai: { wanderRadius: 80, leashRange: 680, idleMinMs: 2500, idleMaxMs: 6500 },
    chargeOnAggro: { speedMult: 2.5, durationMs: 1200 },
  }],

  // ════════════════════════ T2 BOSSES ════════════════════════

  // PLAINS — the honest big bruiser; still no gimmick, just bigger.
  ['plains-tyrant', {
    id: 'plains-tyrant', name: 'Plains Tyrant', color: 0xcc9922,
    isBoss: true,
    stats: {
      hp: 2000, attack: 60, plating: 8, damageReduction: 0.05,
      speed: 46, attackRange: 15, attackCooldown: 2200, pullRange: 320,
    },
    behavior: 'melee', attackStyle: 'impact', biome: 'plains',
    rewards: { essence: 150, essenceType: 'yellow', level: 5, biomeXp: 225 },
    ai: { wanderRadius: 140, leashRange: 850, idleMinMs: 2000, idleMaxMs: 5500 },
  }],

  // FOREST — SHAPE FIXED: was slow/long-reach. Now fast and frequent, frail.
  ['forest-elder', {
    id: 'forest-elder', name: 'Forest Elder', color: 0x226622,
    isBoss: true,
    stats: {
      hp: 1800, attack: 50, plating: 0, damageReduction: 0,
      speed: 60, attackRange: 18, attackCooldown: 1500, pullRange: 310,
    },
    behavior: 'melee', attackStyle: 'slash', biome: 'forest',
    rewards: { essence: 155, essenceType: 'green', level: 5, biomeXp: 232 },
    ai: { wanderRadius: 130, leashRange: 830, idleMinMs: 1200, idleMaxMs: 4000 },
  }],

  // MOUNTAIN — the flagship burst-check: a ~40% of-tank-HP slam (well over the
  // cap threshold), slow, charges, big reach. Trims the old sponge plating (32->10):
  // the threat is the slam, not bulk.
  ['stone-warden', {
    id: 'stone-warden', name: 'Stone Warden', color: 0x667788,
    isBoss: true,
    stats: {
      hp: 2400, attack: 90, plating: 10, damageReduction: 0.05,
      speed: 20, attackRange: 72, attackCooldown: 3800, pullRange: 320,
    },
    behavior: 'melee', attackStyle: 'impact', biome: 'mountain',
    rewards: { essence: 160, essenceType: 'blue', level: 5, biomeXp: 240 },
    ai: { wanderRadius: 120, leashRange: 850, idleMinMs: 3000, idleMaxMs: 7500 },
    chargeOnAggro: { speedMult: 2.5, durationMs: 1200 },
  }],

  // SWAMP — reshaped to DoT: tiny direct hit (was 58), the venom is the fight.
  // Strong DoT, but it ramps over its duration and is survivable WITH dot-resist.
  ['mire-lord', {
    id: 'mire-lord', name: 'Mire Lord', color: 0x2a4011,
    isBoss: true,
    stats: {
      hp: 1900, attack: 12, plating: 6, damageReduction: 0.08,
      speed: 30, attackRange: 15, attackCooldown: 2800, pullRange: 300,
    },
    behavior: 'melee', attackStyle: 'poison', biome: 'swamp',
    rewards: { essence: 155, essenceType: 'purple', level: 5, biomeXp: 232 },
    ai: { wanderRadius: 110, leashRange: 800, idleMinMs: 2500, idleMaxMs: 6000 },
    dotEffect: { damagePerStack: 9, maxStacks: 5, tickIntervalMs: 1000, durationMs: 5000 },
  }],

  // CAVE — endurance bruiser: high HP, real DR + plating, cap-tripping slam,
  // charges. The fight where slow/piercing weapons and %DR pay off most.
  ['cave-terror', {
    id: 'cave-terror', name: 'Cave Terror', color: 0x442244,
    isBoss: true,
    stats: {
      hp: 2300, attack: 92, plating: 12, damageReduction: 0.12,
      speed: 20, attackRange: 72, attackCooldown: 3600, pullRange: 280,
    },
    behavior: 'melee', attackStyle: 'impact', biome: 'cave',
    rewards: { essence: 160, essenceType: 'red', level: 5, biomeXp: 240 },
    ai: { wanderRadius: 90, leashRange: 800, idleMinMs: 3000, idleMaxMs: 7500 },
    chargeOnAggro: { speedMult: 2.0, durationMs: 1200 },
  }],

  // ══════════════════════════════════════════════════════════════════════
  // DEFERRED — advanced-biome bosses (Desert/Jungle/Tundra). Untouched this
  // pass; they tune alongside their engine-gated items + trash in a later step.
  // ══════════════════════════════════════════════════════════════════════

  ['desert-pharaoh', {
    id: 'desert-pharaoh', name: 'Desert Pharaoh', color: 0xddcc44,
    isBoss: true,
    stats: {
      hp: 1900, attack: 74, plating: 18, damageReduction: 0.10,
      speed: 40, attackRange: 74, attackCooldown: 2600, pullRange: 340,
    },
    behavior: 'melee', attackStyle: 'magic', biome: 'desert',
    rewards: { essence: 150, essenceType: 'yellow', level: 5, biomeXp: 225 },
    ai: { wanderRadius: 140, leashRange: 880, idleMinMs: 2000, idleMaxMs: 5500 },
  }],

  ['jungle-colossus', {
    id: 'jungle-colossus', name: 'Jungle Colossus', color: 0x117722,
    isBoss: true,
    stats: {
      hp: 1800, attack: 68, plating: 17, damageReduction: 0.07,
      speed: 56, attackRange: 66, attackCooldown: 2400, pullRange: 320,
    },
    behavior: 'melee', attackStyle: 'slash', biome: 'jungle',
    rewards: { essence: 145, essenceType: 'green', level: 5, biomeXp: 218 },
    ai: { wanderRadius: 150, leashRange: 840, idleMinMs: 1800, idleMaxMs: 4500 },
  }],

  ['glacial-colossus', {
    id: 'glacial-colossus', name: 'Glacial Colossus', color: 0xaaddff,
    isBoss: true,
    stats: {
      hp: 2600, attack: 55, plating: 28, damageReduction: 0.10,
      speed: 18, attackRange: 22, attackCooldown: 3600, pullRange: 280,
    },
    behavior: 'melee', attackStyle: 'frost', biome: 'tundra',
    rewards: { essence: 140, essenceType: 'blue', level: 5, biomeXp: 210 },
    ai: { wanderRadius: 140, leashRange: 800, idleMinMs: 3000, idleMaxMs: 6500 },
  }],
] satisfies [string, MonsterDefinition][];