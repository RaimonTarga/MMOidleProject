import type { MonsterDefinition } from './types';

// ══════════════════════════════════════════════════════════════════════════
// DEEP-SEA TRENCH — EXTREME low density · ABYSSAL TERRORS · execute
// 2–3 enemies max per encounter; massive individual HP, premium DR/plating
// (rewards pierce + premium-DR armor + execute weapon). Boss-like single
// targets. Anti-Far: heavy charges. No kiters — standing off and trading is
// the trap (you WANT to close and execute). Approach via stealth boots.
// ══════════════════════════════════════════════════════════════════════════
export const trenchMonsterEntries = [


  ['abyssal-serpent', {
    id: 'abyssal-serpent', name: 'Abyssal Serpent', color: 0x224488,
    // Standard Trench encounter. Massive HP, heavy DR/plating, charges to close.
    // COOLDOWN bite every 10s = 313 (deepest cap trip). Base 92 ≈ H_med between
    // bites. DR 0.20 extends the fight — rewards pierce + sustained-fight DR ramp.
    stats: { hp: 2600, attack: 92, plating: 18, damageReduction: 0.20, speed: 28, attackRange: 15, attackCooldown: 2800, pullRange: 180 },
    behavior: 'melee', attackStyle: 'impact', biome: 'trench',
    rewards: { essence: 260, essenceType: 'blue', level: 4, biomeXp: 1560 },
    ai: { wanderRadius: 120, leashRange: 480, idleMinMs: 5000, idleMaxMs: 14000 },
    chargeOnAggro: { speedMult: 2.5, durationMs: 1200 },
    empoweredCooldown: { cooldownMs: 10000, multiplier: 3.4 },  // 313
  }],

  ['hadal-stalker', {
    id: 'hadal-stalker', name: 'Hadal Stalker', color: 0x335577,
    // Multi-limbed deep stalker. CADENCE every 5 = a 241 slam. The 5-attack
    // rhythm is slow but at heavy DR/plating the fight is long, so it recurs
    // often. avg/attack (4·86+241)/5 = 117 → ×(1000/3400) = 34 + the spikes.
    stats: { hp: 2100, attack: 86, plating: 15, damageReduction: 0.16, speed: 22, attackRange: 15, attackCooldown: 3400, pullRange: 160 },
    behavior: 'melee', attackStyle: 'impact', biome: 'trench',
    rewards: { essence: 210, essenceType: 'blue', level: 4, biomeXp: 1260 },
    ai: { wanderRadius: 100, leashRange: 450, idleMinMs: 5500, idleMaxMs: 14000 },
    chargeOnAggro: { speedMult: 2.2, durationMs: 1300 },
    cadenceFinisher: { everyNAttacks: 5, multiplier: 2.8 },   // 241
  }],

  ['elder-leviathan', {
    id: 'elder-leviathan', name: 'Elder Leviathan', color: 0x112244,
    // APEX — the most dangerous non-boss in the game. Tests every T4 tool at once:
    //   ENEMY SHIELD: periodic barrier rewards burst over DoT/chip
    //   ENEMY SOFT-CAP: clips player big hits; rewards fast consistent damage
    //   COOLDOWN slam every 12s = 306 (deep cap trip)
    //   Heavy plating (22) + DR (0.24): rewards pierce (Rupture/Sunder/brittle)
    // Survive with premium-DR armor + sustained-fight DR ramp + absorb charm.
    // Without the right kit, shield+soft-cap+cooldown-finisher is lethal.
    stats: { hp: 3600, attack: 102, plating: 22, damageReduction: 0.24, speed: 20, attackRange: 15, attackCooldown: 3600, pullRange: 150 },
    behavior: 'melee', attackStyle: 'impact', biome: 'trench',
    rewards: { essence: 400, essenceType: 'blue', level: 4, biomeXp: 2400 },
    ai: { wanderRadius: 80, leashRange: 380, idleMinMs: 8000, idleMaxMs: 20000 },
    chargeOnAggro: { speedMult: 2.0, durationMs: 1500 },
    empoweredCooldown: { cooldownMs: 12000, multiplier: 3.0 },  // 306
    enemyShield: { shieldPct: 0.30, intervalMs: 16000, durationMs: 6000 },
    enemySoftCap: { capPct: 0.25, capMult: 0.5 },
  }],

] satisfies [string, MonsterDefinition][];