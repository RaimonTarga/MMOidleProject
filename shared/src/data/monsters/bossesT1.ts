import type { MonsterDefinition } from './types';

// ─────────────────────────────────────────────────────────────────────────
// BOSS REBALANCE — T1 + T2 (Pass 1). Follows boss-design.md.
//
// T1: HP bumped ~1.8x (they read weaker than cave elites). NO phases (T1 = the
//     "pure shape" floor). Slow bosses gain CLEAVE (aoeAttack) so summon-spam
//     can't body-block them — see the anti-summon guardrail in boss-design.md.
// T2: + ONE phase at 50% HP (the tier's new layer — escalation, not a 2nd shape;
//     true shape-swaps/range-flips start at T3 via `morph`). Slow bosses cleave.
//
// Cleave criterion = SLOW swing rate (vulnerable to body-block), not hit size:
//   cleave  -> Mountain, Swamp, Cave (speed <= ~30)
//   single  -> Plains, Forest, Desert, Jungle (fast enough to keep pace)
// aoeAttack: { radius, damageMult } — every swing splashes damageMult x attack to
//   others within radius of the target (full damage to the primary target).
//
// Phases use enrage (atk x atkMult, cd x cdMult) + stat-buff (movement speed).
// No two enrages on one boss (last-write-wins restore bug) — speed pressure uses
// stat-buff. Phase buffs omit durationMs = permanent for the rest of the life.
//
// DESERT/JUNGLE bosses moved out of "deferred" — those biomes debut at T2, so
// they get the full T2 treatment now. `glacial-colossus` (Tundra) is DELETED:
// Tundra debuts at T3, its boss is frost-plated-rime-mammoth.
//
// Stat anchors (boss-design.md): boss HP ~9-10x median trash & >=2x toughest
// elite; per-hit ~1.3-1.4x the biome's biggest trash hit; Mtn/Cave slams ~40-50%
// of player pool (trip the cap). Rewards/essence = placeholder (economy deferred).
// ─────────────────────────────────────────────────────────────────────────

export const bossMonsterEntriesT1 = [
  // ════════════════════════ T1 BOSSES (pure shape, no phase) ════════════════════════

  // PLAINS — honest bruiser, no gimmick. The floor. (fast enough: single-target)
  ['tusked-razorback', {
    id: 'tusked-razorback', name: 'Tusked Razorback', color: 0xddaa44,
    isBoss: true,
    stats: { hp: 1000, attack: 36, plating: 4, damageReduction: 0.02, speed: 50, attackRange: 15, attackCooldown: 2000, pullRange: 280 },
    behavior: 'melee', attackStyle: 'impact', biome: 'plains',
    rewards: { essence: 100, essenceType: 'yellow', level: 5, biomeXp: 150 },
    ai: { wanderRadius: 120, leashRange: 750, idleMinMs: 1500, idleMaxMs: 4500 },
  }],

  // FOREST — fast, frequent, frail. The evasion exam. (fast: single-target)
  ['gnarled-greatbear', {
    id: 'gnarled-greatbear', name: 'Gnarled Greatbear', color: 0x33aa44,
    isBoss: true,
    stats: { hp: 900, attack: 32, plating: 0, damageReduction: 0, speed: 60, attackRange: 15, attackCooldown: 1400, pullRange: 300 },
    behavior: 'melee', attackStyle: 'slash', biome: 'forest',
    rewards: { essence: 100, essenceType: 'green', level: 5, biomeXp: 150 },
    ai: { wanderRadius: 160, leashRange: 800, idleMinMs: 1200, idleMaxMs: 4000 },
  }],

  // MOUNTAIN — slow charging mega-slam that trips the cap. Burst exam. Cleaves.
  ['crag-behemoth', {
    id: 'crag-behemoth', name: 'Crag Behemoth', color: 0x8899bb,
    isBoss: true,
    stats: { hp: 1100, attack: 60, plating: 0, damageReduction: 0, speed: 22, attackRange: 18, attackCooldown: 3500, pullRange: 280 },
    behavior: 'melee', attackStyle: 'impact', biome: 'mountain',
    rewards: { essence: 105, essenceType: 'blue', level: 5, biomeXp: 158 },
    ai: { wanderRadius: 120, leashRange: 750, idleMinMs: 2000, idleMaxMs: 5000 },
    chargeOnAggro: { speedMult: 3.0, durationMs: 1200 },
    aoeAttack: { radius: 120, damageMult: 0.6 },
  }],

  // SWAMP — trivial direct hit, real (beatable) DoT. dot-resist exam. Cleaves
  // (slow: a body-blocked DoT swing lands on summons instead of the player).
  ['grave-toadeater', {
    id: 'grave-toadeater', name: 'Grave Toadeater', color: 0x1e3d1e,
    isBoss: true,
    stats: { hp: 950, attack: 8, plating: 2, damageReduction: 0.02, speed: 28, attackRange: 15, attackCooldown: 2600, pullRange: 260 },
    behavior: 'melee', attackStyle: 'poison', biome: 'swamp',
    rewards: { essence: 100, essenceType: 'purple', level: 5, biomeXp: 150 },
    ai: { wanderRadius: 100, leashRange: 700, idleMinMs: 2000, idleMaxMs: 5500 },
    dotEffect: { damagePerStack: 4, maxStacks: 3, tickIntervalMs: 1000, durationMs: 4000 },
    aoeAttack: { radius: 120, damageMult: 0.6 },
  }],

  // CAVE — tanky mixed elite: high HP, DR + plating, charges. Endurance exam. Cleaves.
  ['obsidian-broodmother', {
    id: 'obsidian-broodmother', name: 'Obsidian Broodmother', color: 0x334455,
    isBoss: true,
    stats: { hp: 1050, attack: 40, plating: 6, damageReduction: 0.10, speed: 24, attackRange: 18, attackCooldown: 2800, pullRange: 240 },
    behavior: 'melee', attackStyle: 'impact', biome: 'cave',
    rewards: { essence: 110, essenceType: 'red', level: 5, biomeXp: 165 },
    ai: { wanderRadius: 80, leashRange: 680, idleMinMs: 2500, idleMaxMs: 6500 },
    chargeOnAggro: { speedMult: 2.5, durationMs: 1200 },
    aoeAttack: { radius: 120, damageMult: 0.6 },
  }],

  
] satisfies [string, MonsterDefinition][];
