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

export const caveMonsterEntries = [

  // ══ CAVE — few ELITE mobs, MIXED shapes (fast + bruiser); %DR answers all ══
  // Cave is the intended exception: variety is the point, and the universal
  // answer is flat %DR. Cave elites carry DR/plating — slow/piercing weapons
  // earn their keep here (unlike the squishy plains/forest mobs).
  ['cave-lurker', {
    id: 'cave-lurker', name: 'Cave Lurker', color: 0x664466,
    // The fast half of the pair — quick, lightly armored, relentless, and hard to
    // pin down. Plating dropped 4 -> 1: at 4 it was doing enormous effective-HP work
    // against light hits (a chip weapon was reduced almost to the 1-damage floor),
    // which is what made Caverns a slog rather than a threat. The evasion below is a
    // cheaper, more readable version of the same "consistency check" — you need
    // reliable damage, not necessarily heavy damage.
    stats: { hp: 200, attack: 31, plating: 1, damageReduction: 0.05, speed: 68, attackRange: 12, attackCooldown: 1400, pullRange: 200 },
    behavior: 'melee', attackStyle: 'impact', biome: 'cave', elite: false,
    rewards: { essence: 10, essenceType: 'red', level: 1, biomeXp: 70 },
    ai: { wanderRadius: 380, leashRange: 620, idleMinMs: 450, idleMaxMs: 1500 },
    // Deterministic dodge — every 10th incoming hit is skipped. Previously this
    // monster had no mechanic whatsoever in a two-monster biome; evasion gives it a
    // readable identity (the thing you can't quite land on) and matches the T2/T3
    // cave roster, where giant-spider and deep-spider already evade.
    evasion: 0.10,
  }],

  ['cave-brute', {
    id: 'cave-brute', name: 'Cave Brute', color: 0x443344,
    // The bruiser elite — a cap-tripping slam, slow, charges to connect, and
    // armored enough that fast weapons don't trivially shred it.
    stats: { hp: 220, attack: 118, plating: 1, damageReduction: 0.10, speed: 18, attackRange: 12, attackCooldown: 2800, pullRange: 240 }, // pullRange 145→240: high-detection patrolling elite (overpull risk)
    behavior: 'melee', attackStyle: 'impact', biome: 'cave', elite: true,
    rewards: { essence: 13, essenceType: 'red', level: 1, biomeXp: 90 },
    ai: { wanderRadius: 130, leashRange: 460, idleMinMs: 3000, idleMaxMs: 8000 },
    chargeOnAggro: { speedMult: 2.5, durationMs: 1200 },
    // GROUND SLAM — the cave's readable "get out of the circle" beat. A long
    // wind-up plants a wide circle on the ground; it lands there whether or not
    // you are still in it, so footwork (not mitigation) is the answer. Generous
    // initialCooldownMs keeps it off the opener — you meet the brute first, the
    // slam second. PLACEHOLDER numbers — balance pass owns them.
    chargedAttack: {
      name: 'Ground Slam', castMs: 1800, cooldownMs: 12000, initialCooldownMs: 9000,
      // Multiplier cut 2.2 -> 1.5 to sit alongside the raised base attack. The slam is
      // meant to be dodged, not tanked, so its job is a hard punish for standing in the
      // circle rather than an unsurvivable number regardless of footwork.
      multiplier: 1.5, fx: 'strong-kick',
      aoe: { radius: 110 },
    },
    // Cave elite: patrols a fixed loop around its territory (predictable route the
    // player can time fights against / avoid overpulling). Waypoints relative to
    // spawn; placeholder shape + holds — user balance pass.
    patrol: {
      waypoints: [ { x: 130, y: -60 }, { x: 130, y: 120 }, { x: -120, y: 80 } ],
      mode: 'loop',
      holdMinMs: 1500,
      holdMaxMs: 3500,
    },
  }],

  // ── CAVE T2 — three distinct ELITE shapes: fast/dodgy, bruiser, ranged ──
  ['giant-spider', {
    id: 'giant-spider', name: 'Giant Spider', color: 0x992266,
    // Fast ambush hunter; DR hide + evasion make it slippery, plus a little venom.
    stats: { hp: 460, attack: 22, plating: 0, damageReduction: 0.08, speed: 72, attackRange: 12, attackCooldown: 1800, pullRange: 220 },
    behavior: 'melee', attackStyle: 'poison', biome: 'cave', elite: true,
    rewards: { essence: 15, essenceType: 'red', level: 1, biomeXp: 85 },
    ai: { wanderRadius: 260, leashRange: 680, idleMinMs: 800, idleMaxMs: 3200 },
    evasion: 0.2,
    dotEffect: { debuffId: 'spider-venom', label: 'Spider Venom', damagePerStack: 6, maxStacks: 3, tickIntervalMs: 1000, durationMs: 2000 },
  }],

  ['cave-troll', {
    id: 'cave-troll', name: 'Cave Troll', color: 0x334433,
    // Colossal slow bruiser; cap-tripping slam, charges to close, heavy DR + plating.
    // The elite where slow/piercing weapons pay off.
    // pullRange bumped 150→240 (placeholder): cave elites notice you from afar —
    // the "high detection / overpull risk" Cave identity (countered by stealth boots).
    stats: { hp: 740, attack: 65, plating: 4, damageReduction: 0.15, speed: 15, attackRange: 15, attackCooldown: 3600, pullRange: 240 },
    behavior: 'melee', attackStyle: 'impact', biome: 'cave', elite: true,
    rewards: { essence: 23, essenceType: 'red', level: 1, biomeXp: 145 },
    ai: { wanderRadius: 130, leashRange: 470, idleMinMs: 3000, idleMaxMs: 8500 },
    // Opener: lunge to contact, pin the player for one beat, then commit the
    // existing ground slam. Placeholder numbers — balance pass owns them.
    engageSequence: {
      kind: 'charge-lock-charged-attack',
      speedMult: 6,
      maxChargeMs: 3000,
      lockoutMs: 1000,
    },
    // GROUND SLAM — wider and slower than the brute's; the T2 escalation is
    // FOOTPRINT, not speed, so the tell stays readable while the safe ground
    // shrinks. PLACEHOLDER numbers — balance pass owns them.
    chargedAttack: {
      name: 'Ground Slam', castMs: 2000, cooldownMs: 13000, initialCooldownMs: 9500,
      multiplier: 2.4, fx: 'strong-kick',
      aoe: { radius: 130 },
    },
    // The "brute" that holds territory on a fixed patrol (lurkers/spiders roam solo).
    patrol: { waypoints: [ { x: 140, y: -70 }, { x: 140, y: 130 }, { x: -130, y: 90 } ], mode: 'loop', holdMinMs: 1800, holdMaxMs: 4000 },
  }],

  ['cave-gargoyle', {
    id: 'cave-gargoyle', name: 'Cave Gargoyle', color: 0x554455,
    // Ranged elite — hurls stalactites from its perch; armored and patient.
    stats: { hp: 530, attack: 32, plating: 3, damageReduction: 0.10, speed: 22, attackRange: 200, attackCooldown: 3200, pullRange: 185 },
    behavior: 'ranged', attackStyle: 'stonespit', biome: 'cave', elite: true,
    rewards: { essence: 18, essenceType: 'blue', level: 1, biomeXp: 100 }, // stone construct → Stone (biome mixture; tunable)
    ai: { wanderRadius: 130, leashRange: 460, idleMinMs: 2500, idleMaxMs: 7000 },
  }],

  // ══════════════════ CAVE — tanky consistent elites, MIXED (existing defenses only) ══════════════════
  // Mature. Few elites, mixed shapes, consistent (non-spiky) damage, carry DR/plating
  // where slow/piercing weapons pay off. Answer: %DR (the universal mitigation).
  // NO shield / soft-cap here (those are the T4 weapon-matchup axis).
  ['deep-spider', {
    id: 'deep-spider', name: 'Deep Spider', color: 0x992266,
    // Fast dodgy elite: high speed catches kiters (anti-Far), evasion whiffs many-hit
    // weapons, consistent medium hits = %DR's home. Light venom.
    stats: { hp: 1000, attack: 42, plating: 0, damageReduction: 0.08, speed: 70, attackRange: 12, attackCooldown: 1500, pullRange: 220 },
    behavior: 'melee', attackStyle: 'poison', biome: 'cave', elite: true,
    rewards: { essence: 55, essenceType: 'red', level: 3, biomeXp: 330 },
    ai: { wanderRadius: 260, leashRange: 680, idleMinMs: 800, idleMaxMs: 3200 },
    evasion: 0.25,
    dotEffect: { debuffId: 'deep-spider-venom', label: 'Deep Venom', damagePerStack: 8, maxStacks: 3, tickIntervalMs: 1000, durationMs: 3000 },
  }],

  ['cavern-troll', {
    id: 'cavern-troll', name: 'Cavern Troll', color: 0x334433,
    // The elite ceiling: armored cap-tripping bruiser, charges to connect. Heavy
    // DR + plating means slow/piercing weapons earn their keep. Anti-Far.
    // pullRange 150→240 (placeholder): high-detection elite — overpull risk.
    stats: { hp: 1600, attack: 88, plating: 4, damageReduction: 0.15, speed: 14, attackRange: 15, attackCooldown: 3600, pullRange: 240 },
    behavior: 'melee', attackStyle: 'impact', biome: 'cave', elite: true,
    rewards: { essence: 83, essenceType: 'red', level: 3, biomeXp: 500 },
    ai: { wanderRadius: 120, leashRange: 460, idleMinMs: 3000, idleMaxMs: 8500 },
    chargeOnAggro: { speedMult: 2.0, durationMs: 1200 },
    // GROUND SLAM — the elite ceiling's version: widest footprint, longest tell.
    // Still escapable on foot at player base speed; that is the contract.
    // PLACEHOLDER numbers — balance pass owns them.
    chargedAttack: {
      name: 'Ground Slam', castMs: 2200, cooldownMs: 14000, initialCooldownMs: 10000,
      multiplier: 2.6, fx: 'strong-kick',
      aoe: { radius: 145 },
    },
    // T3 brute — patrols its territory (the elite ceiling holding the deep caverns).
    patrol: { waypoints: [ { x: 130, y: -60 }, { x: 130, y: 120 }, { x: -120, y: 80 } ], mode: 'loop', holdMinMs: 2000, holdMaxMs: 4500 },
  }],

  ['crystal-gargoyle', {
    id: 'crystal-gargoyle', name: 'Crystal Gargoyle', color: 0x554455,
    // Armored ranged sentry — perched, patient, hurls shards. Stationary ranged
    // (NOT a kiter: it holds its perch), armored so it isn't trivially bursted.
    stats: { hp: 1150, attack: 60, plating: 3, damageReduction: 0.10, speed: 20, attackRange: 210, attackCooldown: 3200, pullRange: 185 },
    behavior: 'ranged', attackStyle: 'stonespit', biome: 'cave', elite: true,
    rewards: { essence: 60, essenceType: 'red', level: 3, biomeXp: 360 },
    ai: { wanderRadius: 120, leashRange: 450, idleMinMs: 2500, idleMaxMs: 7000 },
  }],


] satisfies [string, MonsterDefinition][];
