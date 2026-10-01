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
// PLATING RULE SUPERSEDED (progression rework, 2026-10-01, PROVISIONAL): plains and
// forest used to carry NO plating/DR at all ("fast weapons shred them — intended").
// A family's `punishes` field is now a contract, and flat `plating` is the only stat
// that punishes Tempo (`packets.ts`: "weak against fortified plating"), so Plains Herd
// and Forest Grove — both Tempo-punishing — must carry some. They still carry NO %DR,
// so fast weapons still shred them; see monster-proposals-run3.md §1/§4.
// CAVE elites carry DR/plating (where slow/piercing weapons earn keep).
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
    // SWARM FAMILY (progression rework, 2026-10-01, PROVISIONAL): attack 12 -> 9 and
    // attackCooldown 2000 -> 1100. "The swarm body should be the fastest, smallest hit
    // in the game; it is currently among the slowest." Per-hit down as cadence goes up:
    // against plating 4 a 9-damage hit is cut 44% and a 12-damage hit only 33%, so the
    // player's own plating becomes visible for the first time. `hp` is untouched, so
    // the economy and the XP curve do not move.
    stats: { hp: 50, attack: 9, plating: 0, damageReduction: 0, speed: 46, attackRange: 12, attackCooldown: 1100, pullRange: 190 },
    behavior: 'melee', attackStyle: 'hind-kick', biome: 'plains',
    rewards: { essence: 2, essenceType: 'yellow', level: 1, biomeXp: 10 },
    ai: { wanderRadius: 250, leashRange: 640, idleMinMs: 1200, idleMaxMs: 4000 },
    // Plains swarm: while chasing, slimes converge as a group (gentle cohesion) and
    // fan out rather than stacking on one pixel (separation). Many-body pressure.
    // Placeholder tuning — user balance pass.
    // maxMembers 4 -> 6 (progression rework, 2026-10-01, PROVISIONAL). This is the
    // Swarm family's Empowered punishment as well as a Plains pressure row: Empowered
    // is weak to swarms AS A COUNT — a mechanic that fires on one body while five
    // others chew you is the punishment. On-theme and cheaper than evasion for the
    // biome whose whole identity is volume.
    swarm: { recruitRange: 260, maxMembers: 6, cohesion: 0.1, separation: 40 },
    // Also the swarm body a Prairie Wolf "caller" rallies: as a pack follower it
    // joins the call-allies net (roams + swarms solo when not in a caller's pack).
    pack: { role: 'follower' },
  }],

  ['boar', {
    id: 'boar', name: 'Boar', color: 0xcc8844,
    // Swarm-catcher: charges in so the player can't simply walk away from the pack.
    // HERD FAMILY (progression rework, 2026-10-01, PROVISIONAL). Three changes:
    //  - plating 0 -> 3: Herd declares `punishes: 'tempo'` and flat plating is the
    //    only stat that punishes Tempo. 3 is the highest plating any T1 body carries
    //    today (rockback-ram); see the superseded squishy-biome rule in the banner.
    //  - attack 18 -> 15, attackCooldown 1900 -> 1400: Plains killed the reference
    //    build ZERO times across 118 bench cells while running among the SLOWEST
    //    T1 cadences in the game. Per-hit down as frequency goes up, so the biome's
    //    pressure rises while the player's own plating reads for the first time.
    stats: { hp: 100, attack: 15, plating: 3, damageReduction: 0, speed: 50, attackRange: 12, attackCooldown: 1400, pullRange: 205 },
    behavior: 'melee', attackStyle: 'gore', biome: 'plains',
    rewards: { essence: 3, essenceType: 'yellow', level: 1, biomeXp: 18 },
    ai: { wanderRadius: 260, leashRange: 660, idleMinMs: 1000, idleMaxMs: 3500 },
    chargeOnAggro: { speedMult: 2.5, durationMs: 1000 },
    // Boars charge in as a converging herd, not single-file (swarm-catcher pressure).
    swarm: { recruitRange: 260, maxMembers: 4, cohesion: 0.08, separation: 56 },
  }],


  ['grass-kite', {
    id: 'grass-kite', name: 'Grass Kite', color: 0xc9b27a,
    // SKY FAMILY, T1 (progression rework, 2026-10-01). The Savanna Hawk's smaller
    // kin: an aerial opener. It is airborne, so the fight starts before you reach
    // it — one telegraphed Stoop into talon range, then it stays and fights. The
    // family's shard is Engagement: the opening exchange is what this creature IS.
    // PLACEHOLDER numbers seeded from the T1 Plains band (boar 100/18); designer
    // hand-edits before the lane bench.
    stats: { hp: 90, attack: 16, plating: 0, damageReduction: 0, speed: 100, attackRange: 12, attackCooldown: 2200, pullRange: 380 },
    behavior: 'melee', attackStyle: 'talons', biome: 'plains',
    rewards: { essence: 3, essenceType: 'yellow', level: 1, biomeXp: 18 },
    flies: true,
    ai: { wanderRadius: 320, leashRange: 1000, idleMinMs: 250, idleMaxMs: 900 },
    engageSequence: {
      kind: 'cast-charge-root', name: 'Stoop', castMs: 900,
      speedMult: 3.0, maxChargeMs: 2500, rootMs: 1500, fx: 'dive-bomb',
    },
  }],

  // ── PLAINS T2 — bigger swarm: a pack runner, a charger, a ranged poke ──
  ['prairie-yearling', {
    id: 'prairie-yearling', name: 'Prairie Yearling', color: 0xeebb77,
    // T2 PACK FOLLOWER. Exists only as two thirds of a Prairie Wolf pack; it is never
    // in a spawn pool, exactly like Forest's `young-wolf`.
    //
    // WHY IT EXISTS: the Prairie Wolf used to call 3x `plains-slime` — the *T1* Field
    // Hare — so half of T2 Plains' effective spawn weight was a tier-1 monster that
    // could not be retuned without moving T1. A T2 alpha now calls a T2 pack.
    stats: { hp: 130, attack: 11, plating: 0, damageReduction: 0, speed: 96, attackRange: 12, attackCooldown: 1250, pullRange: 275 },
    behavior: 'melee', attackStyle: 'bite', biome: 'plains',
    rewards: { essence: 3, essenceType: 'yellow', level: 1, biomeXp: 18 },
    ai: { wanderRadius: 290, leashRange: 720, idleMinMs: 700, idleMaxMs: 2800 },
    pack: { role: 'follower' },
    // Runs with the herd its alpha gathers, rather than pathing on its own.
    swarm: { recruitRange: 260, maxMembers: 4, cohesion: 0.12, separation: 48 },
  }],

  ['prairie-wolf', {
    id: 'prairie-wolf', name: 'Prairie Wolf', color: 0xddaa55,
    // Fastest plains mob; high base speed is its anti-kite. Glassy, low per-hit.
    stats: { hp: 260, attack: 19, plating: 0, damageReduction: 0, speed: 92, attackRange: 12, attackCooldown: 1200, pullRange: 275 },
    behavior: 'melee', attackStyle: 'bite', biome: 'plains',
    rewards: { essence: 6, essenceType: 'yellow', level: 1, biomeXp: 35 },
    ai: { wanderRadius: 290, leashRange: 720, idleMinMs: 700, idleMaxMs: 2800 },
    // Plains CALLER (the brainstorm's "callers / small swarm group"): the fast runner
    // rallies its own yearlings — spawns with 3 Prairie Yearlings and pulls them onto its
    // target via call-allies when it engages. Placeholder counts/range — user pass.
    pack: { role: 'alpha', followRadius: 180, followers: [{ typeId: 'prairie-yearling', count: 3 }] },
    // The alpha should wander with the herd it spawns, not path independently of it.
    swarm: { recruitRange: 260, maxMembers: 4, cohesion: 0.12, separation: 52 },
  }],

  ['stampede-bull', {
    id: 'stampede-bull', name: 'Stampede Bull', color: 0xdd5500,
    // Swarm-catcher charger; thick hide gives a little DR but hits stay modest.
    // HERD FAMILY (progression rework, 2026-10-01, PROVISIONAL): plating 0 -> 5, so
    // the family's Tempo punishment survives the tier step. 5 of a ~23 T2 median
    // player hit is the same fraction 3 is of T1's ~12 (file banner), and it stays
    // under the biome-agnostic T2 ceiling (swamp-hydra, the T2 anchor, carries 6).
    stats: { hp: 495, attack: 24, plating: 5, damageReduction: 0.05, speed: 62, attackRange: 12, attackCooldown: 1700, pullRange: 235 },
    behavior: 'melee', attackStyle: 'gore', biome: 'plains',
    rewards: { essence: 7, essenceType: 'yellow', level: 1, biomeXp: 40 },
    ai: { wanderRadius: 260, leashRange: 680, idleMinMs: 800, idleMaxMs: 3000 },
    chargeOnAggro: { speedMult: 2.5, durationMs: 1000 },
    // A stampede is a herd: bulls converge as a group as they charge in.
    swarm: { recruitRange: 260, maxMembers: 4, cohesion: 0.08, separation: 64 },
  }],

  ['savanna-hawk', {
    id: 'savanna-hawk', name: 'Savanna Hawk', color: 0xddcc66,
    // AERIAL MELEE HUNTER. Its wide, rapid idle path makes the hawk hard to
    // predict, then the single telegraphed Dive Bomb gets it into talon range.
    // It does not repeat the swoop or disengage after it lands.
    stats: { hp: 250, attack: 29, plating: 0, damageReduction: 0, speed: 110, attackRange: 12, attackCooldown: 2400, pullRange: 440 },
    behavior: 'melee', attackStyle: 'talons', biome: 'plains',
    rewards: { essence: 7, essenceType: 'yellow', level: 1, biomeXp: 38 }, // wild bird → Wild (biome mixture; tunable)
    flies: true,
    ai: { wanderRadius: 360, leashRange: 1200, idleMinMs: 250, idleMaxMs: 900 },
    engageSequence: {
      kind: 'cast-charge-root', name: 'Dive Bomb', castMs: 1000,
      speedMult: 3.4, maxChargeMs: 3000, rootMs: 2000, fx: 'dive-bomb',
    },
  }],


] satisfies [string, MonsterDefinition][];
