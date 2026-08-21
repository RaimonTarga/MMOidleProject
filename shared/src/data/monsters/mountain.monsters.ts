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

export const mountainMonsterEntries = [

  // ══ MOUNTAIN — rare HUGE hits that trip the cap; slow + charge to connect ══
  ['cliff-hopper', {
    id: 'cliff-hopper', name: 'Cliff Hopper', color: 0x99aacc,
    // Sturdy mountain goat (caprine line T1: hopper -> ram -> tyrant). Slow charging
    // bruiser (atk trips the ~25%-HP cap); charges once to close, then lumbers.
    stats: { hp: 190, attack: 82, plating: 0, damageReduction: 0, speed: 28, attackRange: 12, attackCooldown: 3000, pullRange: 420 },
    behavior: 'melee', attackStyle: 'impact', biome: 'mountain',
    rewards: { essence: 6, essenceType: 'yellow', level: 1, biomeXp: 42 }, // charging brute → Might (biome mixture; tunable)
    ai: { wanderRadius: 200, leashRange: 640, idleMinMs: 1500, idleMaxMs: 4500 },
    chargeOnAggro: { speedMult: 3.0, durationMs: 1200 },
    vaultsMountainLedges: true,
    // STRONG KICK — a telegraphed shove that tests positioning around ledges.
    // Brace reduces both the heavy hit and the knockback distance.
    // Multiplier cut 1.8 -> 1.5 alongside the base-attack lift. Mountain's identity is
    // rare huge hits, so raising attack to hit the tier's damage target already makes
    // every swing cap-tripping; leaving the old multiplier on top would have turned the
    // telegraph into a one-shot rather than a spike worth bracing for.
    chargedAttack: { name: 'Strong Kick', castMs: 1100, cooldownMs: 9000, initialCooldownMs: 3200, multiplier: 1.5, fx: 'strong-kick', knockback: { distance: 180 } },
    // Mountain SENTINEL: holds its post, pacing a short fixed line instead of
    // random wander — the guarded-position identity. Placeholder route — user pass.
    patrol: { waypoints: [{ x: -160, y: 0 }, { x: 160, y: 0 }], mode: 'pingpong', holdMinMs: 1500, holdMaxMs: 3500 },
  }],

  ['ridge-archer', {
    id: 'ridge-archer', name: 'Ridge Ambusher', color: 0x778899,
    // Stone-folk vessel crossbowman (artillery line T1: ambusher -> thrower -> mortar).
    // A big, slow bolt from range. Punishes standing still; the ranged half of
    // mountain's "stand and trade" pressure. No charge (ranged).
    stats: { hp: 240, attack: 82, plating: 0, damageReduction: 0, speed: 26, attackRange: 210, attackCooldown: 3100, pullRange: 350 },
    behavior: 'ranged', attackStyle: 'arrow', holdsChokepoints: true, biome: 'mountain',
    rewards: { essence: 8, essenceType: 'blue', level: 1, biomeXp: 52 },
    ai: { wanderRadius: 210, leashRange: 600, idleMinMs: 1500, idleMaxMs: 4500 },
    // POWER SHOT — a telegraphed 2× boulder. 2 s wind-up; armed ~3.5 s into the fight
    // (≈ the 2nd shot), then every 8 s. Mitigate it (Brace / damage-cap) or interrupt
    // the wind-up with a stun/freeze. Placeholder numbers — user balance pass.
    // Multiplier cut 3 -> 1.8 for the same reason as the Hopper's kick: with the base
    // bolt raised to the tier's damage target, a 3x power shot lands well past a T1
    // player's whole health bar. 1.8 keeps it the scariest single hit in T1 without
    // making the wind-up unsurvivable rather than merely urgent.
    chargedAttack: { name: 'Power Shot', castMs: 2000, cooldownMs: 8000, initialCooldownMs: 3500, multiplier: 1.8, fx: 'power-shot' },
  }],

  // ── MOUNTAIN T2 — everything hits like a truck and trips the cap ──
  ['granite-titan', {
    id: 'granite-titan', name: 'Granite Titan', color: 0x99aabb,
    // The flagship cap-tripper: a slow, charging slam well over 25% of player HP.
    // No DR — it's a glass cannon you survive via the cap, not a sponge.
    stats: { hp: 400, attack: 70, plating: 0, damageReduction: 0, speed: 18, attackRange: 15, attackCooldown: 3800, pullRange: 160 },
    behavior: 'melee', attackStyle: 'impact', biome: 'mountain',
    rewards: { essence: 14, essenceType: 'blue', level: 1, biomeXp: 80 },
    ai: { wanderRadius: 110, leashRange: 460, idleMinMs: 3500, idleMaxMs: 9000 },
    chargeOnAggro: { speedMult: 2.5, durationMs: 1200 },
    // T2 sentinel — an even slower, shorter hold (it barely budges from its post).
    patrol: { waypoints: [{ x: -120, y: 0 }, { x: 120, y: 0 }], mode: 'pingpong', holdMinMs: 2500, holdMaxMs: 5000 },
  }],

  ['stone-eagle', {
    id: 'stone-eagle', name: 'Stone Eagle', color: 0xccdde8,
    // REBALANCED: was a fast low-hitter. Now a swooping dive-bomber — faster than
    // the titan but still a heavy hit; the charge IS the dive.
    stats: { hp: 290, attack: 50, plating: 0, damageReduction: 0, speed: 40, attackRange: 12, attackCooldown: 2800, pullRange: 285 },
    behavior: 'melee', attackStyle: 'slash', biome: 'mountain',
    rewards: { essence: 12, essenceType: 'blue', level: 1, biomeXp: 68 },
    ai: { wanderRadius: 320, leashRange: 800, idleMinMs: 500, idleMaxMs: 2000 },
    chargeOnAggro: { speedMult: 2.5, durationMs: 1000 },
  }],

  ['peak-archer', {
    id: 'peak-archer', name: 'Boulder Thrower', color: 0xaabbcc,
    // Ranged cap-tripper — a devastating boulder from extreme range; stand still
    // and a single shot can carve a quarter of your HP. No charge (ranged).
    stats: { hp: 330, attack: 60, plating: 0, damageReduction: 0, speed: 28, attackRange: 240, attackCooldown: 3500, pullRange: 265 },
    behavior: 'ranged', attackStyle: 'boulder', holdsChokepoints: true, biome: 'mountain',
    rewards: { essence: 13, essenceType: 'blue', level: 1, biomeXp: 75 },
    ai: { wanderRadius: 200, leashRange: 600, idleMinMs: 2000, idleMaxMs: 5000 },
  }],

  // ══════════════════ T3 MOUNTAIN — the big-hitters that trip the cap, with some new wrinkles (charge, kite) ══════════════════
  ['mountain-colossus', {
    id: 'mountain-colossus', name: 'Mountain Colossus', color: 0x8899aa,
    // Flagship cap-tripper: a slow charging slam well past the cap. Anti-Far.
    stats: { hp: 870, attack: 95, plating: 0, damageReduction: 0, speed: 16, attackRange: 15, attackCooldown: 3800, pullRange: 160 },
    behavior: 'melee', attackStyle: 'impact', biome: 'mountain',
    rewards: { essence: 75, essenceType: 'blue', level: 3, biomeXp: 440 },
    ai: { wanderRadius: 90, leashRange: 420, idleMinMs: 4000, idleMaxMs: 10500 },
    chargeOnAggro: { speedMult: 2.5, durationMs: 1200 },
  }],

  ['avalanche-ram', {
    id: 'avalanche-ram', name: 'Avalanche Ram', color: 0x99aabb,
    // Faster charger, still a heavy (near-cap) hit — the mobile anti-Far threat.
    stats: { hp: 620, attack: 64, plating: 0, damageReduction: 0, speed: 38, attackRange: 12, attackCooldown: 2600, pullRange: 245 },
    behavior: 'melee', attackStyle: 'impact', biome: 'mountain',
    rewards: { essence: 47, essenceType: 'blue', level: 2, biomeXp: 280 },
    ai: { wanderRadius: 300, leashRange: 760, idleMinMs: 500, idleMaxMs: 2200 },
    chargeOnAggro: { speedMult: 2.5, durationMs: 1000 },
  }],

  ['crag-mortar', {
    id: 'crag-mortar', name: 'Crag Mortar', color: 0x778899,
    // Ranged cap-tripper that KITES — backs off, lobs boulders. Anti-Close:
    // melee chasing eats free 80-dmg hits. Slow (30) so a charge can still catch it.
    stats: { hp: 700, attack: 80, plating: 0, damageReduction: 0, speed: 30, attackRange: 250, attackCooldown: 3600, pullRange: 360 },
    behavior: 'kiter', attackStyle: 'boulder', biome: 'mountain',
    rewards: { essence: 60, essenceType: 'blue', level: 3, biomeXp: 360 },
    ai: { wanderRadius: 200, leashRange: 620, idleMinMs: 2000, idleMaxMs: 5000 },
  }],

  // TIER 4

  ['granite-mammoth', {
    id: 'granite-mammoth', name: 'Granite Mammoth', color: 0x8899aa,
    // Flagship cap-tripper. Base 155 already trips the cap; CADENCE every 4 = 310
    // slam. Charges once to close, then lumbers. The Mountain teaching unit:
    // its NORMAL hit is scary, its finisher is lethal without the cap.
    // DPS: avg/attack (3·155+310)/4 = 194 → ×(1000/3600) = 54 (slow spiker; the spike is the threat).
    stats: { hp: 1900, attack: 155, plating: 0, damageReduction: 0, speed: 16, attackRange: 15, attackCooldown: 3600, pullRange: 160 },
    behavior: 'melee', attackStyle: 'impact', biome: 'mountain',
    rewards: { essence: 95, essenceType: 'blue', level: 4, biomeXp: 570 },
    ai: { wanderRadius: 90, leashRange: 430, idleMinMs: 4000, idleMaxMs: 11000 },
    chargeOnAggro: { speedMult: 2.5, durationMs: 1200 },
    cadenceFinisher: { everyNAttacks: 4, multiplier: 2.0 },   // 310 — deep cap trip
  }],

  ['avalanche-tyrant', {
    id: 'avalanche-tyrant', name: 'Avalanche Tyrant', color: 0x99aabb,
    // Fast charging bruiser, heavy near-cap hit. The mobile anti-Far threat —
    // a kiter that lets it close eats a 122 hit. DPS 122 × (1000/2500) = 49.
    stats: { hp: 1300, attack: 122, plating: 0, damageReduction: 0, speed: 42, attackRange: 12, attackCooldown: 2500, pullRange: 300 },
    behavior: 'melee', attackStyle: 'impact', biome: 'mountain',
    rewards: { essence: 68, essenceType: 'blue', level: 3, biomeXp: 410 },
    ai: { wanderRadius: 300, leashRange: 760, idleMinMs: 600, idleMaxMs: 2500 },
    chargeOnAggro: { speedMult: 2.8, durationMs: 1000 },
  }],

  ['cliffside-roc', {
    id: 'cliffside-roc', name: 'Cliffside Roc', color: 0x778899,
    // Ranged KITER: backs off and drops boulders that trip the cap from afar.
    // Anti-Close — chasing it in melee eats a 150 hit every 3.5s. Speed 34
    // (catchable on charge). DPS 150 × (1000/3500) = 43 (kiter; safety > DPS).
    stats: { hp: 1400, attack: 150, plating: 0, damageReduction: 0, speed: 34, attackRange: 260, attackCooldown: 3500, pullRange: 380 },
    behavior: 'kiter', attackStyle: 'boulder', biome: 'mountain',
    rewards: { essence: 75, essenceType: 'blue', level: 3, biomeXp: 450 },
    ai: { wanderRadius: 210, leashRange: 640, idleMinMs: 2000, idleMaxMs: 5500 },
  }],

  ['cragback-rhino', {
    id: 'cragback-rhino', name: 'Cragback Rhino', color: 0x6677aa,
    // Armored elite. Modest base (95 ≈ H_med, survivable) but a COOLDOWN slam
    // every 10s = 304 (deep cap trip). Heavy plating + ENEMY SOFT-CAP: the
    // weapon-matchup exam — pierce tools (Rupture/Sunder/brittle) beat the plate,
    // fast consistent damage beats the soft-cap, slow empowered builds struggle.
    stats: { hp: 2250, attack: 95, plating: 16, damageReduction: 0.06, speed: 14, attackRange: 15, attackCooldown: 3800, pullRange: 150 },
    behavior: 'melee', attackStyle: 'impact', biome: 'mountain', elite: true,
    rewards: { essence: 185, essenceType: 'blue', level: 4, biomeXp: 1110 },
    ai: { wanderRadius: 80, leashRange: 400, idleMinMs: 5000, idleMaxMs: 13000 },
    chargeOnAggro: { speedMult: 2.2, durationMs: 1300 },
    empoweredCooldown: { cooldownMs: 10000, multiplier: 3.2 },  // 304
    enemySoftCap: { capPct: 0.25, capMult: 0.5 },
  }],


] satisfies [string, MonsterDefinition][];
