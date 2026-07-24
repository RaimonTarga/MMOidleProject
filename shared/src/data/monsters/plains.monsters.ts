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

export const plainsMonsterEntries = [
  // ══ PLAINS — swarm of small, fast, low-per-hit mobs; volume is the threat ══
  ['plains-slime', {
    id: 'plains-slime', name: 'Field Hare', color: 0xddee55,
    // Swarm filler. Tiny hits that plating eats to nothing; dangerous only in numbers.
    stats: { hp: 50, attack: 12, plating: 0, damageReduction: 0, speed: 46, attackRange: 12, attackCooldown: 2000, pullRange: 190 },
    behavior: 'melee', attackStyle: 'impact', biome: 'plains',
    rewards: { essence: 2, essenceType: 'yellow', level: 1, biomeXp: 10 },
    ai: { wanderRadius: 250, leashRange: 640, idleMinMs: 1200, idleMaxMs: 4000 },
    // Plains swarm: while chasing, slimes converge as a group (gentle cohesion) and
    // fan out rather than stacking on one pixel (separation). Many-body pressure.
    // Placeholder tuning — user balance pass.
    swarm: { cohesion: 0.1, separation: 40 },
    // Also the swarm body a Prairie Wolf "caller" rallies: as a pack follower it
    // joins the call-allies net (roams + swarms solo when not in a caller's pack).
    pack: { role: 'follower', callRange: 280 },
  }],

  ['boar', {
    id: 'boar', name: 'Boar', color: 0xcc8844,
    // Swarm-catcher: charges in so the player can't simply walk away from the pack.
    stats: { hp: 100, attack: 18, plating: 0, damageReduction: 0, speed: 50, attackRange: 12, attackCooldown: 1900, pullRange: 205 },
    behavior: 'melee', attackStyle: 'impact', biome: 'plains', elite: true, // toughest plains T1 mob — the elite for density-node bias (Map Variety)
    rewards: { essence: 3, essenceType: 'yellow', level: 1, biomeXp: 18 },
    ai: { wanderRadius: 260, leashRange: 660, idleMinMs: 1000, idleMaxMs: 3500 },
    chargeOnAggro: { speedMult: 2.5, durationMs: 1000 },
    // Boars charge in as a converging herd, not single-file (swarm-catcher pressure).
    swarm: { cohesion: 0.08, separation: 56 },
  }],


  // ── PLAINS T2 — bigger swarm: a pack runner, a charger, a ranged poke ──
  ['prairie-wolf', {
    id: 'prairie-wolf', name: 'Prairie Wolf', color: 0xddaa55,
    // Fastest plains mob; high base speed is its anti-kite. Glassy, low per-hit.
    stats: { hp: 150, attack: 32, plating: 0, damageReduction: 0, speed: 92, attackRange: 12, attackCooldown: 1200, pullRange: 275 },
    behavior: 'melee', attackStyle: 'bite', biome: 'plains',
    rewards: { essence: 6, essenceType: 'yellow', level: 1, biomeXp: 35 },
    ai: { wanderRadius: 290, leashRange: 720, idleMinMs: 700, idleMaxMs: 2800 },
    // Plains CALLER (the brainstorm's "callers / small swarm group"): the fast runner
    // rallies a slime swarm — spawns with 3 Plains Slimes and pulls them onto its
    // target via call-allies when it engages. Placeholder counts/range — user pass.
    pack: { role: 'alpha', callRange: 300, followers: [{ typeId: 'plains-slime', count: 3 }] },
    // The alpha should wander with the herd it spawns, not path independently of it.
    swarm: { cohesion: 0.12, separation: 52 },
  }],

  ['stampede-bull', {
    id: 'stampede-bull', name: 'Stampede Bull', color: 0xdd5500,
    // Swarm-catcher charger; thick hide gives a little DR but hits stay modest.
    stats: { hp: 200, attack: 40, plating: 0, damageReduction: 0.05, speed: 62, attackRange: 12, attackCooldown: 1700, pullRange: 235 },
    behavior: 'melee', attackStyle: 'impact', biome: 'plains',
    rewards: { essence: 7, essenceType: 'yellow', level: 1, biomeXp: 40 },
    ai: { wanderRadius: 260, leashRange: 680, idleMinMs: 800, idleMaxMs: 3000 },
    chargeOnAggro: { speedMult: 2.5, durationMs: 1000 },
    // A stampede is a herd: bulls converge as a group as they charge in.
    swarm: { cohesion: 0.08, separation: 64 },
  }],

  ['savanna-hawk', {
    id: 'savanna-hawk', name: 'Savanna Hawk', color: 0xddcc66,
    // Ranged poke — pecks from distance, the anti-kite-from-afar of the plains.
    stats: { hp: 140, attack: 30, plating: 0, damageReduction: 0, speed: 50, attackRange: 165, attackCooldown: 2400, pullRange: 245 },
    behavior: 'ranged', attackStyle: 'slash', biome: 'plains',
    rewards: { essence: 7, essenceType: 'green', level: 1, biomeXp: 38 }, // wild bird → Wild (biome mixture; tunable)
    ai: { wanderRadius: 280, leashRange: 680, idleMinMs: 1000, idleMaxMs: 3200 },
  }],


] satisfies [string, MonsterDefinition][];
