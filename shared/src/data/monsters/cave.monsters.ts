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
    // CHAOTIC ROAMER — the biome's other half. Cave's contrast is "predictable
    // territorial brutes vs roamers that unexpectedly walk into your fight", so this
    // one's identity is MOVEMENT: fast, wide wander, short idles. Plating stays at 1
    // (at 4 it did enormous effective-HP work against light hits, which is what made
    // Caverns a slog).
    stats: { hp: 225, attack: 31, plating: 1, damageReduction: 0.05, speed: 68, attackRange: 12, attackCooldown: 1400, pullRange: 200 },
    behavior: 'melee', attackStyle: 'impact', biome: 'cave', elite: false,
    rewards: { essence: 10, essenceType: 'red', level: 1, biomeXp: 70 },
    ai: { wanderRadius: 380, leashRange: 620, idleMinMs: 450, idleMaxMs: 1500 },
    // NO evasion (T1-T4 rework, locked): random misses are not an identity, roaming
    // is. Deliberately NOT replaced with DR — the roaming line stays killable.
  }],

  ['cave-brute', {
    id: 'cave-brute', name: 'Cave Brute', color: 0x443344,
    // The bruiser elite — a cap-tripping slam, slow, charges to connect, and
    // armored enough that fast weapons don't trivially shred it.
    stats: { hp: 250, attack: 80, plating: 1, damageReduction: 0.10, speed: 18, attackRange: 12, attackCooldown: 2800, pullRange: 240 }, // pullRange 145→240: high-detection patrolling elite (overpull risk)
    behavior: 'melee', attackStyle: 'impact', biome: 'cave', elite: true,
    rewards: { essence: 13, essenceType: 'red', level: 1, biomeXp: 90 },
    ai: { wanderRadius: 130, leashRange: 460, idleMinMs: 3000, idleMaxMs: 8000 },
    chargeOnAggro: { speedMult: 2.5, durationMs: 1200 },
    // GROUND SLAM — the cave's readable "get out of the circle" beat. A long
    // wind-up plants a wide circle on the ground; it lands there whether or not
    // you are still in it, so footwork (not mitigation) is the answer. The slam
    // starts ready so the brute gets to show its defining mechanic in the opener.
    chargedAttack: {
      name: 'Ground Slam', castMs: 1800, cooldownMs: 12000, initialCooldownMs: 0,
      // Multiplier cut 2.2 -> 1.5 to sit alongside the raised base attack. The slam is
      // meant to be dodged, not tanked, so its job is a hard punish for standing in the
      // circle rather than an unsurvivable number regardless of footwork.
      multiplier: 2.0, fx: 'strong-kick',
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
    // Evolved Cave Lurker: fast chaotic roamer that can wander into an existing
    // fight. VENOM is the tier's escalation — not evasion (removed, locked).
    stats: { hp: 350, attack: 35, plating: 0, damageReduction: 0.08, speed: 72, attackRange: 12, attackCooldown: 1800, pullRange: 220 },
    behavior: 'melee', attackStyle: 'poison', biome: 'cave', elite: true,
    rewards: { essence: 15, essenceType: 'red', level: 1, biomeXp: 85 },
    ai: { wanderRadius: 260, leashRange: 680, idleMinMs: 800, idleMaxMs: 3200 },
    dotEffect: { debuffId: 'spider-venom', label: 'Spider Venom', damagePerStack: 11, maxStacks: 3, tickIntervalMs: 1000, durationMs: 2000 },
  }],

  ['cave-troll', {
    id: 'cave-troll', name: 'Cave Troll', color: 0x334433,
    // Colossal slow bruiser; cap-tripping slam, charges to close, heavy DR + plating.
    // The elite where slow/piercing weapons pay off.
    // pullRange bumped 150→240 (placeholder): cave elites notice you from afar —
    // the "high detection / overpull risk" Cave identity (countered by stealth boots).
    stats: { hp: 550, attack: 115, plating: 1, damageReduction: 0.08, speed: 15, attackRange: 15, attackCooldown: 3600, pullRange: 240 },
    behavior: 'melee', attackStyle: 'impact', biome: 'cave', elite: true,
    rewards: { essence: 23, essenceType: 'red', level: 1, biomeXp: 145 },
    ai: { wanderRadius: 130, leashRange: 470, idleMinMs: 3000, idleMaxMs: 8500 },
    // Opener: briefly telegraph, lunge to contact, root the player, then commit
    // the existing ground slam. Unlike the old cave lockdown, the root leaves
    // attacks available and makes the counterplay match the aerial dive openers.
    engageSequence: {
      kind: 'cast-charge-root', name: 'Savage Rush', castMs: 500,
      speedMult: 15,
      maxChargeMs: 3000,
      rootMs: 1700,
      followWithChargedAttack: true,
      fx: 'dive-bomb',
    },
    // GROUND SLAM — wider and slower than the brute's; the T2 escalation is
    // FOOTPRINT, not speed, so the tell stays readable while the safe ground
    // shrinks. PLACEHOLDER numbers — balance pass owns them.
    chargedAttack: {
      name: 'Ground Slam', castMs: 2000, cooldownMs: 13000, initialCooldownMs: 0,
      multiplier: 2.1, fx: 'strong-kick',
      aoe: { radius: 130 },
    },
    // The "brute" that holds territory on a fixed patrol (lurkers/spiders roam solo).
    patrol: { waypoints: [ { x: 140, y: -70 }, { x: 140, y: 130 }, { x: -130, y: 90 } ], mode: 'loop', holdMinMs: 1800, holdMaxMs: 4000 },
  }],

  ['cave-gargoyle', {
    id: 'cave-gargoyle', name: 'Cave Gargoyle', color: 0x554455,
    // Ranged elite — hurls stalactites from its perch; armored and patient.
    stats: { hp: 415, attack: 58, plating: 1, damageReduction: 0.05, speed: 22, attackRange: 200, attackCooldown: 3200, pullRange: 185 },
    behavior: 'ranged', attackStyle: 'stonespit', biome: 'cave', elite: true,
    rewards: { essence: 18, essenceType: 'red', level: 1, biomeXp: 100 },
    // STATIC RANGED SENTRY - it does not roam like a normal ranged mob. It stays
    // perched, activates when a player enters its pull range, and fires from that
    // position. The static behavior IS the mechanic.
    staticSentry: true,
    // Occasional telegraphed heavy stalactite - the optional secondary.
    chargedAttack: {
      name: 'Stalactite Shot', castMs: 1600, cooldownMs: 11000, initialCooldownMs: 4500,
      multiplier: 1.55, fx: 'power-shot',
    },
    ai: { wanderRadius: 130, leashRange: 460, idleMinMs: 2500, idleMaxMs: 7000 },
  }],

  // ══════════════════ CAVE — tanky consistent elites, MIXED (existing defenses only) ══════════════════
  // Mature. Few elites, mixed shapes, consistent (non-spiky) damage, carry DR/plating
  // where slow/piercing weapons pay off. Answer: %DR (the universal mitigation).
  // NO shield / soft-cap here (those are the T4 weapon-matchup axis).
  ['deep-spider', {
    id: 'deep-spider', name: 'Deep Spider', color: 0x992266,
    // The roaming line's ceiling: even more active roaming over a large wander
    // space, stronger venom, and high speed that catches kiters (anti-Far).
    // NO evasion (locked) and deliberately no DR added back in its place.
    stats: { hp: 610, attack: 60, plating: 0, damageReduction: 0.08, speed: 70, attackRange: 12, attackCooldown: 1500, pullRange: 220 },
    behavior: 'melee', attackStyle: 'poison', biome: 'cave', elite: true,
    rewards: { essence: 55, essenceType: 'red', level: 3, biomeXp: 330 },
    // Roams harder and idles less than the Giant Spider - the T3 escalation of the
    // chaotic-roamer line is SPACE COVERED, since its evasion is gone.
    ai: { wanderRadius: 380, leashRange: 820, idleMinMs: 500, idleMaxMs: 2000 },
    dotEffect: { debuffId: 'deep-spider-venom', label: 'Deep Venom', damagePerStack: 12, maxStacks: 3, tickIntervalMs: 1000, durationMs: 3000 },
  }],

  ['cavern-troll', {
    id: 'cavern-troll', name: 'Cavern Troll', color: 0x334433,
    // The elite ceiling: armored cap-tripping bruiser, charges to connect. Heavy
    // DR + plating means slow/piercing weapons earn their keep. Anti-Far.
    // pullRange 150→240 (placeholder): high-detection elite — overpull risk.
    stats: { hp: 945, attack: 124, plating: 2, damageReduction: 0.10, speed: 14, attackRange: 15, attackCooldown: 3600, pullRange: 240 },
    behavior: 'melee', attackStyle: 'impact', biome: 'cave', elite: true,
    rewards: { essence: 83, essenceType: 'red', level: 3, biomeXp: 500 },
    ai: { wanderRadius: 120, leashRange: 460, idleMinMs: 3000, idleMaxMs: 8500 },
    // The T3 continuation keeps the Cave Troll's readable Savage Rush opener:
    // cast, fast contact charge, ROOT, then the existing Ground Slam. This
    // replaces the old charge-lock opener, whose lock step could fail before it
    // actually delivered the follow-up slam.
    engageSequence: {
      kind: 'cast-charge-root', name: 'Savage Rush', castMs: 500,
      speedMult: 15,
      maxChargeMs: 3000,
      rootMs: 1700,
      followWithChargedAttack: true,
      fx: 'dive-bomb',
    },
    // GROUND SLAM — the elite ceiling's version: widest footprint, longest tell.
    // Still escapable on foot at player base speed; that is the contract.
    // The T3 numerical balance keeps the tell broad while reducing its compressed
    // spike against the longer-lived Cave elite.
    chargedAttack: {
      name: 'Ground Slam', castMs: 2200, cooldownMs: 14000, initialCooldownMs: 0,
      multiplier: 2.0, fx: 'strong-kick',
      aoe: { radius: 145 },
    },
    // T3 brute — patrols its territory (the elite ceiling holding the deep caverns).
    patrol: { waypoints: [ { x: 130, y: -60 }, { x: 130, y: 120 }, { x: -120, y: 80 } ], mode: 'loop', holdMinMs: 2000, holdMaxMs: 4500 },
  }],

  ['crystal-gargoyle', {
    id: 'crystal-gargoyle', name: 'Crystal Gargoyle', color: 0x554455,
    // Armored ranged sentry — perched, patient, hurls shards. Stationary ranged
    // (NOT a kiter: it holds its perch), armored so it isn't trivially bursted.
    stats: { hp: 700, attack: 70, plating: 1, damageReduction: 0.05, speed: 20, attackRange: 210, attackCooldown: 3200, pullRange: 185 },
    behavior: 'ranged', attackStyle: 'stonespit', biome: 'cave', elite: true,
    rewards: { essence: 60, essenceType: 'red', level: 3, biomeXp: 360 },
    // Same perch/static identity as the Cave Gargoyle. The evolution is a CHARGED
    // CRYSTAL VOLLEY: several rapid shards on a periodic beat rather than one
    // bigger rock. WARNING: not a kiter (locked).
    staticSentry: true,
    cadenceVolley: { everyNAttacks: 3, hits: 3 },
    ai: { wanderRadius: 120, leashRange: 450, idleMinMs: 2500, idleMaxMs: 7000 },
  }],


] satisfies [string, MonsterDefinition][];
