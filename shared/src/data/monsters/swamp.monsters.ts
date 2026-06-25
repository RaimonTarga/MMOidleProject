import type { MonsterDefinition } from './types';

// ─────────────────────────────────────────────────────────────────────────
// MONSTER REFACTOR — starter biomes (Plains/Forest/Mountain/Swamp/Cave), T1+T2.
//
// Core fix (diagnosed problem: every biome was the same fast/tank/ranged trio,
// recolored, so no biome taught its own mitigation). Each starter biome now
// expresses ONE dominant damage-SHAPE matched to its armor's mitigation:
//
//   PLAINS    swarm of small fast hits      -> answered by PLATING (flat subtract)
//   FOREST    fast, FREQUENT attacks         -> answered by EVASION (flat %, scales w/ hit count)
//   MOUNTAIN  rare, HUGE hits (trip the cap) -> answered by DAMAGE-CAP
//   SWAMP     low direct dmg, heavy DoT       -> answered by DOT-RESIST (+ debt loop)
//   CAVE      few ELITE, MIXED shapes         -> answered by %DR (the universal mitigation)
//
// Tuned against player-power-curve §7: T1 ~HP90 / H_med~12, T2 ~HP200 / H_med~23.
// MOUNTAIN/CAVE big-hitters deliberately exceed the generic trash H_big so they
// reach the damage cap (≈25% of player maxHP: ~40-50 at T1, ~55-70 at T2).
//
// CHARGE = closes the gap for SLOW big-hitters (anti-kite for the ponderous).
// HIGH BASE SPEED = the fast-ambusher identity. RANGED = anti-kite from afar.
// Squishy biomes (plains/forest) carry NO plating/DR (fast weapons shred them —
// intended); CAVE elites carry DR/plating (where slow/piercing weapons earn keep).
//
// Rewards / ai wander+leash / colors / ids kept as-is. A few NAMES no longer
// match their refactored shape (flagged inline) — rename in the cosmetic pass.
// Advanced biomes (jungle/tundra/desert/volcanic) are DEFERRED below, untouched.
// ─────────────────────────────────────────────────────────────────────────

export const swampMonsterEntries = [

  // ══ SWAMP — low DIRECT damage, heavy DoT; dot-resist + debt is the answer ══
  // (Per request: base attack lowered, DoT raised — same-ish DPS, DoT-weighted.)
  ['bog-slime', {
    id: 'bog-slime', name: 'Bog Slime', color: 0x558833,
    // A weak slap, but the toxin does the real work over time.
    stats: { hp: 110, attack: 8, plating: 0, damageReduction: 0, speed: 28, attackRange: 12, attackCooldown: 2200, pullRange: 165 },
    behavior: 'melee', attackStyle: 'poison', biome: 'swamp',
    rewards: { essence: 5, essenceType: 'purple', level: 1, biomeXp: 35 },
    ai: { wanderRadius: 160, leashRange: 530, idleMinMs: 2000, idleMaxMs: 5500 },
    dotEffect: { debuffId: 'swamp-poison', label: 'Poison', damagePerStack: 2, maxStacks: 4, tickIntervalMs: 1500, durationMs: 3000 },
  }],

  ['mud-toad', {
    id: 'mud-toad', name: 'Mud Toad', color: 0x778844,
    // Sturdier; a feeble strike but a deeper, faster-stacking poison.
    stats: { hp: 145, attack: 10, plating: 2, damageReduction: 0, speed: 30, attackRange: 12, attackCooldown: 2400, pullRange: 180 },
    behavior: 'melee', attackStyle: 'poison', biome: 'swamp',
    rewards: { essence: 6, essenceType: 'green', level: 1, biomeXp: 42 }, // beast → Wild (biome mixture; tunable)
    ai: { wanderRadius: 180, leashRange: 550, idleMinMs: 1800, idleMaxMs: 5000 },
    dotEffect: { debuffId: 'swamp-poison', label: 'Poison', damagePerStack: 2, maxStacks: 4, tickIntervalMs: 1500, durationMs: 3000 },
  }],

  // ── SWAMP T2 — DoT engines; trivial direct hits, brutal stacking poison ──
  ['swamp-hydra', {
    id: 'swamp-hydra', name: 'Swamp Hydra', color: 0x335533,
    // Multi-headed DoT engine; lives long enough to stack poison deep. Direct
    // bite is almost nothing — the venom is the whole fight.
    stats: { hp: 370, attack: 12, plating: 0, damageReduction: 0.10, speed: 28, attackRange: 15, attackCooldown: 2200, pullRange: 185 },
    behavior: 'melee', attackStyle: 'poison', biome: 'swamp',
    rewards: { essence: 12, essenceType: 'purple', level: 1, biomeXp: 68 },
    ai: { wanderRadius: 170, leashRange: 560, idleMinMs: 2500, idleMaxMs: 7000 },
    dotEffect: { debuffId: 'hydra-venom', label: 'Hydra Venom', damagePerStack: 5, maxStacks: 5, tickIntervalMs: 1000, durationMs: 2400 },
  }],

  ['bog-witch', {
    id: 'bog-witch', name: 'Bog Witch', color: 0x884499,
    // Ranged curse — flings a weak hex that festers; the DoT poke of the marsh.
    stats: { hp: 230, attack: 16, plating: 0, damageReduction: 0.05, speed: 38, attackRange: 180, attackCooldown: 2200, pullRange: 215 },
    behavior: 'melee', attackStyle: 'magic', isRanged: true, biome: 'swamp',
    rewards: { essence: 11, essenceType: 'purple', level: 1, biomeXp: 62 },
    ai: { wanderRadius: 200, leashRange: 580, idleMinMs: 1500, idleMaxMs: 4500 },
    dotEffect: { debuffId: 'swamp-hex', label: 'Swamp Hex', damagePerStack: 4, maxStacks: 4, tickIntervalMs: 1000, durationMs: 2400 },
  }],

  ['mire-stalker', {
    id: 'mire-stalker', name: 'Mire Stalker', color: 0x445533,
    // Ambush venom-hunter; light touch, heavy toxin, and it dodges some blows.
    stats: { hp: 320, attack: 22, plating: 0, damageReduction: 0.12, speed: 40, attackRange: 12, attackCooldown: 2600, pullRange: 155 },
    behavior: 'melee', attackStyle: 'poison', biome: 'swamp',
    rewards: { essence: 13, essenceType: 'purple', level: 1, biomeXp: 75 },
    ai: { wanderRadius: 170, leashRange: 540, idleMinMs: 2000, idleMaxMs: 6000 },
    dotEffect: { debuffId: 'stalker-venom', label: 'Stalker Venom', damagePerStack: 3, maxStacks: 4, tickIntervalMs: 1000, durationMs: 2800 },
    evasion: 0.2,
  }],

  // ══════════════════ SWAMP — DoT engines + bulk/regen walls ══════════════════
  // Final tier. Trivial direct hits, brutal stacking DoT that ignores your spacing;
  // bulky/evasive walls. One ranged DoT-kiter. Answer: dot-resist + debt loop.
  ['plague-hydra', {
    id: 'plague-hydra', name: 'Plague Hydra', color: 0x335533,
    // DoT engine wall: bulky, DR, lives long enough to stack venom deep. The bite
    // is nothing; the poison is the whole fight. Kitable, but DoT ticks regardless.
    stats: { hp: 820, attack: 26, plating: 0, damageReduction: 0.12, speed: 26, attackRange: 15, attackCooldown: 2200, pullRange: 185 },
    behavior: 'melee', attackStyle: 'poison', biome: 'swamp',
    rewards: { essence: 65, essenceType: 'purple', level: 3, biomeXp: 390 },
    ai: { wanderRadius: 150, leashRange: 520, idleMinMs: 2800, idleMaxMs: 8000 },
    dotEffect: { debuffId: 'plague-venom', label: 'Plague', damagePerStack: 7, maxStacks: 6, tickIntervalMs: 1000, durationMs: 6000 },
  }],

  ['mire-hex-spitter', {
    id: 'mire-hex-spitter', name: 'Mire Hex Spitter', color: 0x884499,
    // Ranged DoT KITER: plinks festering hexes, backs away. Anti-Close — chasing
    // it just walks you through more poison. Speed 36 (catchable on charge).
    stats: { hp: 500, attack: 30, plating: 0, damageReduction: 0, speed: 36, attackRange: 200, attackCooldown: 2200, pullRange: 230 },
    behavior: 'melee', attackStyle: 'magic', isRanged: true, kite: true, biome: 'swamp',
    rewards: { essence: 35, essenceType: 'purple', level: 2, biomeXp: 210 },
    ai: { wanderRadius: 200, leashRange: 580, idleMinMs: 1500, idleMaxMs: 4500 },
    dotEffect: { debuffId: 'mire-hex', label: 'Mire Hex', damagePerStack: 5, maxStacks: 5, tickIntervalMs: 1000, durationMs: 4500 },
  }],

  ['bog-lurker', {
    id: 'bog-lurker', name: 'Bog Lurker', color: 0x445533,
    // Evasive ambush DoT wall: dodges every 5th hit (many-hit weapons whiff) +
    // DR bulk + heavy toxin. The "regen/bulk wall" texture — hard to burn down fast.
    stats: { hp: 720, attack: 28, plating: 0, damageReduction: 0.14, speed: 30, attackRange: 12, attackCooldown: 2600, pullRange: 155 },
    behavior: 'melee', attackStyle: 'poison', biome: 'swamp',
    rewards: { essence: 57, essenceType: 'purple', level: 3, biomeXp: 345 },
    ai: { wanderRadius: 160, leashRange: 540, idleMinMs: 2200, idleMaxMs: 6500 },
    evasion: 0.25,
    dotEffect: { debuffId: 'lurker-venom', label: 'Lurker Venom', damagePerStack: 6, maxStacks: 5, tickIntervalMs: 1000, durationMs: 4500 },
  }],


] satisfies [string, MonsterDefinition][];
