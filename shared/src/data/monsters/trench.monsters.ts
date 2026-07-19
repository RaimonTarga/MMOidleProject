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
    // ECOLOGY: an APEX PREDATOR that hunts a wide territory (big wanderRadius) with
    // high detection (big pullRange) — without stealth boots you risk waking two at
    // once. "Abyssal pressure" suppresses your healing (appliesAntiheal): you can't
    // out-sustain it, you must EXECUTE. Yellow elite outline.
    stats: { hp: 3000, attack: 132, plating: 18, damageReduction: 0.20, speed: 28, attackRange: 15, attackCooldown: 2800, pullRange: 420 },
    behavior: 'melee', attackStyle: 'impact', biome: 'trench',
    elite: true,
    rewards: { essence: 260, essenceType: 'blue', level: 4, biomeXp: 1560 },
    ai: { wanderRadius: 320, leashRange: 760, idleMinMs: 5000, idleMaxMs: 14000 },
    chargeOnAggro: { speedMult: 2.5, durationMs: 1200 },
    empoweredCooldown: { cooldownMs: 10000, multiplier: 2.5 },
    appliesAntiheal: { reductionPerStack: 0.25, maxStacks: 3, durationMs: 4000 },
  }],

  ['hadal-stalker', {
    id: 'hadal-stalker', name: 'Hadal Stalker', color: 0x335577,
    // Giant deep-sea spider crab (the raised crusher claw is the slam).
    // Multi-limbed deep stalker. CADENCE every 5 = a 241 slam. The 5-attack
    // rhythm is slow but at heavy DR/plating the fight is long, so it recurs
    // often. avg/attack (4·86+241)/5 = 117 → ×(1000/3400) = 34 + the spikes.
    stats: { hp: 2500, attack: 126, plating: 15, damageReduction: 0.16, speed: 22, attackRange: 15, attackCooldown: 3400, pullRange: 400 },
    behavior: 'melee', attackStyle: 'impact', biome: 'trench',
    elite: true,
    rewards: { essence: 210, essenceType: 'blue', level: 4, biomeXp: 1260 },
    ai: { wanderRadius: 300, leashRange: 720, idleMinMs: 5500, idleMaxMs: 14000 },
    chargeOnAggro: { speedMult: 2.2, durationMs: 1300 },
    cadenceFinisher: { everyNAttacks: 5, multiplier: 2.4 },
    // Apex predator: wide hunting territory + high detection; abyssal pressure.
    appliesAntiheal: { reductionPerStack: 0.25, maxStacks: 3, durationMs: 4000 },
  }],

  ['elder-leviathan', {
    id: 'elder-leviathan', name: 'Elder Leviathan', color: 0x112244,
    // Colossal abyssal anglerfish — its lure is the trench's brightest light.
    // APEX — the most dangerous non-boss in the game. Tests every T4 tool at once:
    //   ENEMY SHIELD: periodic barrier rewards burst over DoT/chip
    //   ENEMY SOFT-CAP: clips player big hits; rewards fast consistent damage
    //   COOLDOWN slam every 12s = 306 (deep cap trip)
    //   Heavy plating (22) + DR (0.24): rewards pierce (Rupture/Sunder/brittle)
    // Survive with premium-DR armor + sustained-fight DR ramp + absorb charm.
    // Without the right kit, shield+soft-cap+cooldown-finisher is lethal.
    stats: { hp: 4200, attack: 152, plating: 22, damageReduction: 0.24, speed: 20, attackRange: 15, attackCooldown: 3600, pullRange: 440 },
    behavior: 'melee', attackStyle: 'impact', biome: 'trench',
    elite: true,
    rewards: { essence: 400, essenceType: 'blue', level: 4, biomeXp: 2400 },
    ai: { wanderRadius: 280, leashRange: 700, idleMinMs: 8000, idleMaxMs: 20000 },
    chargeOnAggro: { speedMult: 2.0, durationMs: 1500 },
    empoweredCooldown: { cooldownMs: 10000, multiplier: 2.0 },  // 306
    enemyShield: { shieldPct: 0.30, intervalMs: 16000, durationMs: 6000 },
    enemySoftCap: { capPct: 0.25, capMult: 0.5 },
    // The apex of apexes — farthest detection; abyssal pressure suppresses healing
    // hardest. You CANNOT out-sustain it; burst it down or it grinds you out.
    appliesAntiheal: { reductionPerStack: 0.30, maxStacks: 3, durationMs: 4500 },
  }],

] satisfies [string, MonsterDefinition][];