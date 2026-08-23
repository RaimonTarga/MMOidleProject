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

  // ══ MOUNTAIN — FIVE IDENTITIES, NOT ONE ══
  // Rare HUGE hits that trip the damage cap is still the biome's damage SHAPE, but
  // the roster is organised by lineage (T1-T4 rework):
  //   1. LEDGE-CROSSING CAPRINES  cliff-hopper -> avalanche-ram -> avalanche-tyrant
  //   2. GROUND BRUISERS/SLAMMERS granite-titan -> mountain-colossus -> granite-mammoth
  //   3. POSITIONAL ARTILLERY     ridge-ambusher -> boulder-thrower -> crag-mortar
  //   4. FLYERS                   stone-eagle -> (gap) -> cliffside-roc
  //   5. STANDALONE LATE ELITE    cragback-rhino
  // A lineage may DISAPPEAR for a tier and return later. Do NOT add monsters merely
  // to fill a missing tier link.
  // WARNING: ledge traversal belongs to CAPRINES AND FLYERS ONLY. The Titan line
  // must never vault (locked).
  ['cliff-hopper', {
    id: 'cliff-hopper', name: 'Cliff Hopper', color: 0x99aacc,
    // CAPRINE T1. Identity: it VAULTS mountain ledges, and its Strong Kick knocks
    // you back — which matters most around ledges and drop-offs. Mobile roaming, not
    // a guarded post.
    stats: { hp: 190, attack: 50, plating: 0, damageReduction: 0, speed: 28, attackRange: 12, attackCooldown: 3000, pullRange: 420 },
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
    chargedAttack: { name: 'Strong Kick', castMs: 1100, cooldownMs: 9000, initialCooldownMs: 3200, multiplier: 2.1, fx: 'strong-kick', knockback: { distance: 180 } },
    // NO patrol (T1-T4 rework, locked): the sentinel-style fixed post was the wrong
    // fantasy for a caprine. It roams normally; `vaultsMountainLedges` is the identity.
  }],

  ['ridge-archer', {
    id: 'ridge-archer', name: 'Ridge Ambusher', color: 0x778899,
    // ARTILLERY T1 — already good, no additional mechanic needed. Holds chokepoints,
    // heavy slow ranged attacks, and a telegraphed Power Shot.
    stats: { hp: 240, attack: 50, plating: 0, damageReduction: 0, speed: 26, attackRange: 210, attackCooldown: 3100, pullRange: 350 },
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
    chargedAttack: { name: 'Power Shot', castMs: 2000, cooldownMs: 8000, initialCooldownMs: 3500, multiplier: 2.5, fx: 'power-shot' },
  }],

  // ── MOUNTAIN T2 — everything hits like a truck and trips the cap ──
  ['granite-titan', {
    id: 'granite-titan', name: 'Granite Titan', color: 0x99aabb,
    // GROUND BRUISER T1. Very slow, territorial, readable.
    // WARNING: NO ledge vaulting (locked) — that identity is the caprines' and the
    // flyers'. It gets the reusable Cave/Cavern GROUND SLAM instead (behavior pass).
    // A modest engagement charge may remain against trivial kiting.
    stats: { hp: 336, attack: 122, plating: 0, damageReduction: 0, speed: 18, attackRange: 15, attackCooldown: 3800, pullRange: 160 },
    behavior: 'melee', attackStyle: 'impact', biome: 'mountain',
    rewards: { essence: 14, essenceType: 'blue', level: 1, biomeXp: 80 },
    ai: { wanderRadius: 110, leashRange: 460, idleMinMs: 3500, idleMaxMs: 9000 },
    chargeOnAggro: { speedMult: 2.5, durationMs: 1200 },
    // T2 sentinel — an even slower, shorter hold (it barely budges from its post).
    // GROUND SLAM - the same reusable committed circle the Cave Brute/Troll use.
    // The Titan line's shared beat: plant it, walk out of it. Placeholder numbers.
    chargedAttack: {
      name: 'Ground Slam', castMs: 1800, cooldownMs: 12000, initialCooldownMs: 8000,
      multiplier: 1.5, fx: 'strong-kick',
      aoe: { radius: 120 },
    },
    patrol: { waypoints: [{ x: -120, y: 0 }, { x: 120, y: 0 }], mode: 'pingpong', holdMinMs: 2500, holdMaxMs: 5000 },
  }],

  ['stone-eagle', {
    id: 'stone-eagle', name: 'Stone Eagle', color: 0xccdde8,
    // FLYER T1 — the DIVE-BOMBER. Aerial roaming while idle; it crosses ledges
    // because it FLIES. One dive/charge on engagement, then ordinary combat.
    // WARNING: no repeated hit-and-run loop (locked).
    stats: { hp: 244, attack: 88, plating: 0, damageReduction: 0, speed: 40, attackRange: 12, attackCooldown: 2800, pullRange: 285 },
    behavior: 'melee', attackStyle: 'slash', biome: 'mountain',
    rewards: { essence: 12, essenceType: 'blue', level: 1, biomeXp: 68 },
    ai: { wanderRadius: 320, leashRange: 800, idleMinMs: 500, idleMaxMs: 2000 },
    // Aerial roaming; ledges do not apply because it FLIES. The `chargeOnAggro`
    // below IS the one-time dive on engagement - it does not repeat.
    flies: true,
    chargeOnAggro: { speedMult: 2.5, durationMs: 1000 },
  }],

  ['peak-archer', {
    id: 'peak-archer', name: 'Boulder Thrower', color: 0xaabbcc,
    // ARTILLERY T2 — evolved. Still a chokepoint/position-holding ranged threat with
    // a heavy boulder. Optional (only if cheap): a lobbed/delayed impact with a small
    // telegraphed landing area. Do NOT build a subsystem solely for this.
    stats: { hp: 277, attack: 106, plating: 0, damageReduction: 0, speed: 28, attackRange: 240, attackCooldown: 3500, pullRange: 265 },
    behavior: 'ranged', attackStyle: 'boulder', holdsChokepoints: true, biome: 'mountain',
    rewards: { essence: 13, essenceType: 'blue', level: 1, biomeXp: 75 },
    // Optional lobbed impact with a small telegraphed landing area - cheap because
    // it is the same planted-circle primitive, not a new subsystem.
    chargedAttack: {
      name: 'Boulder Toss', castMs: 1700, cooldownMs: 10000, initialCooldownMs: 4500,
      multiplier: 1.6, fx: 'power-shot',
      aoe: { radius: 110 },
    },
    ai: { wanderRadius: 200, leashRange: 600, idleMinMs: 2000, idleMaxMs: 5000 },
  }],

  // ══════════════════ T3 MOUNTAIN — the big-hitters that trip the cap, with some new wrinkles (charge, kite) ══════════════════
  ['mountain-colossus', {
    id: 'mountain-colossus', name: 'Mountain Colossus', color: 0x8899aa,
    // GROUND BRUISER T2. Same Slam family as the Titan, with a larger/more
    // threatening footprint and/or damage. Still deliberate and readable.
    stats: { hp: 610, attack: 130, plating: 0, damageReduction: 0, speed: 16, attackRange: 15, attackCooldown: 3800, pullRange: 160 },
    behavior: 'melee', attackStyle: 'impact', biome: 'mountain',
    rewards: { essence: 75, essenceType: 'blue', level: 3, biomeXp: 440 },
    ai: { wanderRadius: 90, leashRange: 420, idleMinMs: 4000, idleMaxMs: 10500 },
    // Same Slam family as the Titan; the escalation is FOOTPRINT and damage, not
    // speed, so the tell stays readable while the safe ground shrinks.
    chargedAttack: {
      name: 'Ground Slam', castMs: 2000, cooldownMs: 12000, initialCooldownMs: 8500,
      multiplier: 1.8, fx: 'strong-kick',
      aoe: { radius: 145 },
    },
    chargeOnAggro: { speedMult: 2.5, durationMs: 1200 },
  }],

  ['avalanche-ram', {
    id: 'avalanche-ram', name: 'Avalanche Ram', color: 0x99aabb,
    // CAPRINE T2 — the Hopper lineage returns. Ledge traversal, an aggressive charge,
    // and a heavy knockback ram/kick.
    stats: { hp: 434, attack: 87, plating: 0, damageReduction: 0, speed: 38, attackRange: 12, attackCooldown: 2600, pullRange: 245 },
    behavior: 'melee', attackStyle: 'impact', biome: 'mountain',
    rewards: { essence: 47, essenceType: 'blue', level: 2, biomeXp: 280 },
    ai: { wanderRadius: 300, leashRange: 760, idleMinMs: 500, idleMaxMs: 2200 },
    vaultsMountainLedges: true,
    // RAM - the caprine lineage's knockback beat, heavier than the Hopper's kick.
    chargedAttack: {
      name: 'Avalanche Ram', castMs: 1100, cooldownMs: 9000, initialCooldownMs: 3500,
      multiplier: 1.6, fx: 'strong-kick', knockback: { distance: 220 },
    },
    chargeOnAggro: { speedMult: 2.5, durationMs: 1000 },
  }],

  ['crag-mortar', {
    id: 'crag-mortar', name: 'Crag Mortar', color: 0x778899,
    // ARTILLERY T3. Conventional backpedal-kiting is NOT preferred (locked): it should
    // be a relatively STATIONARY, terrain-holding artillery piece that lobs delayed
    // bombardment. The player solves it by repositioning or build, not by an endless
    // chase. Behavior pass converts it off `kiter`.
    stats: { hp: 490, attack: 109, plating: 0, damageReduction: 0, speed: 30, attackRange: 250, attackCooldown: 3600, pullRange: 360 },
    // STATIONARY TERRAIN ARTILLERY, not a kiter (locked): it holds its ground and
    // bombards, and the player answers with repositioning or build rather than an
    // endless chase.
    behavior: 'ranged', attackStyle: 'boulder', biome: 'mountain',
    staticSentry: true,
    rewards: { essence: 60, essenceType: 'blue', level: 3, biomeXp: 360 },
    // DELAYED BOMBARDMENT: a planted circle with a telegraphed landing area -
    // the existing committed-slam primitive, used at range.
    chargedAttack: {
      name: 'Bombardment', castMs: 1800, cooldownMs: 9000, initialCooldownMs: 4000,
      multiplier: 1.6, fx: 'power-shot',
      aoe: { radius: 130 },
    },
    ai: { wanderRadius: 200, leashRange: 620, idleMinMs: 2000, idleMaxMs: 5000 },
  }],

  // TIER 4

  ['granite-mammoth', {
    id: 'granite-mammoth', name: 'Granite Mammoth', color: 0x8899aa,
    // GROUND BRUISER T3 — evolved Slam expressed as a predictable CADENCE finisher:
    // large normal attacks, and every 4th is the major Slam. The Mountain teaching
    // unit: its NORMAL hit is scary, its finisher is lethal without the damage cap.
    stats: { hp: 779, attack: 184, plating: 0, damageReduction: 0, speed: 16, attackRange: 15, attackCooldown: 3600, pullRange: 160 },
    behavior: 'melee', attackStyle: 'impact', biome: 'mountain',
    rewards: { essence: 95, essenceType: 'blue', level: 4, biomeXp: 570 },
    ai: { wanderRadius: 90, leashRange: 430, idleMinMs: 4000, idleMaxMs: 11000 },
    chargeOnAggro: { speedMult: 2.5, durationMs: 1200 },
    cadenceFinisher: { everyNAttacks: 4, multiplier: 2.0 },   // 310 — deep cap trip
  }],

  ['avalanche-tyrant', {
    id: 'avalanche-tyrant', name: 'Avalanche Tyrant', color: 0x99aabb,
    // CAPRINE T3 — apex. Ledge traversal, extreme mobility/charge, and a brutal
    // knockback ram.
    stats: { hp: 533, attack: 145, plating: 0, damageReduction: 0, speed: 42, attackRange: 12, attackCooldown: 2500, pullRange: 300 },
    behavior: 'melee', attackStyle: 'impact', biome: 'mountain',
    rewards: { essence: 68, essenceType: 'blue', level: 3, biomeXp: 410 },
    ai: { wanderRadius: 300, leashRange: 760, idleMinMs: 600, idleMaxMs: 2500 },
    vaultsMountainLedges: true,
    // APEX CAPRINE: extreme mobility plus a brutal knockback ram.
    chargedAttack: {
      name: 'Avalanche Ram', castMs: 1100, cooldownMs: 8500, initialCooldownMs: 3500,
      multiplier: 1.8, fx: 'strong-kick', knockback: { distance: 280 },
    },
    chargeOnAggro: { speedMult: 2.8, durationMs: 1000 },
  }],

  ['cliffside-roc', {
    id: 'cliffside-roc', name: 'Cliffside Roc', color: 0x778899,
    // FLYER T2 — AERIAL ARTILLERY (the lineage skipped a tier and returned).
    // Progression: Stone Eagle is the dive-bomber, the Roc is the bombardier. It
    // maintains useful spacing through FLIGHT, not ordinary ground backpedaling.
    // Behavior pass converts it off `kiter`.
    stats: { hp: 574, attack: 179, plating: 0, damageReduction: 0, speed: 34, attackRange: 260, attackCooldown: 3500, pullRange: 380 },
    // AERIAL ARTILLERY, not a ground kiter (locked): it keeps useful spacing by
    // being in the air, so it is plain `ranged` and lets flight do the work.
    behavior: 'ranged', attackStyle: 'boulder', biome: 'mountain',
    flies: true,
    rewards: { essence: 75, essenceType: 'blue', level: 3, biomeXp: 450 },
    ai: { wanderRadius: 210, leashRange: 640, idleMinMs: 2000, idleMaxMs: 5500 },
  }],

  ['cragback-rhino', {
    id: 'cragback-rhino', name: 'Cragback Rhino', color: 0x6677aa,
    // STANDALONE LATE ELITE — the weapon-matchup exam, kept exactly as it is:
    // heavy plating, some DR, the enemy soft-cap, and one large periodic empowered
    // hit. Do NOT add another mechanic (locked).
    stats: { hp: 923, attack: 113, plating: 16, damageReduction: 0.06, speed: 14, attackRange: 15, attackCooldown: 3800, pullRange: 150 },
    behavior: 'melee', attackStyle: 'impact', biome: 'mountain', elite: true,
    rewards: { essence: 185, essenceType: 'blue', level: 4, biomeXp: 1110 },
    ai: { wanderRadius: 80, leashRange: 400, idleMinMs: 5000, idleMaxMs: 13000 },
    chargeOnAggro: { speedMult: 2.2, durationMs: 1300 },
    empoweredCooldown: { cooldownMs: 10000, multiplier: 3.2 },  // 304
    enemySoftCap: { capPct: 0.25, capMult: 0.5 },
  }],


] satisfies [string, MonsterDefinition][];
