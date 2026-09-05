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

export const jungleMonsterEntries = [

    // ══ JUNGLE — TERRAIN CREATES THE SWARM ══
    // HARD RULE (T1-T4 rework, locked): no passive pack / alpha / follower
    // mechanics anywhere in this biome. The thicket's doubled detection radius is
    // still what gathers a fight. The Ape's Chestbeat is a deliberately limited,
    // visible exception: one cast, one nearby rally, no recursive pack behavior.
    // Also REJECTED: a Marking Dart that raises the player's aggro radius.
  ['jungle-snake', {
    id: 'jungle-snake', name: 'Jungle Snake', color: 0x33cc44,
    // BUSH-LURKING EARLY AMBUSHER. Likes to idle in/around thickets, opens with a
    // strong pounce, then fights as ordinary melee. Its LIGHT poison is early
    // Jungle's entire poison presence — the evolved ambushers below carry none.
    // No evasion needed.
    stats: { hp: 480, attack: 20, plating: 0, damageReduction: 0, speed: 76, attackRange: 12, attackCooldown: 1100, pullRange: 270 },
    behavior: 'melee', attackStyle: 'poison', biome: 'jungle',
    rewards: { essence: 7, essenceType: 'green', level: 1, biomeXp: 38 },
    // It LIVES in the thicket. Combined with the bush's doubled player detection,
    // this is how Jungle gathers a fight: you walked into the undergrowth.
    idleAnchor: 'jungle-bush',
    ai: { wanderRadius: 290, leashRange: 740, idleMinMs: 600, idleMaxMs: 2600 },
    dotEffect: { debuffId: 'snake-venom', label: 'Snake Venom', damagePerStack: 7, maxStacks: 3, tickIntervalMs: 1000, durationMs: 1500 },
    openingStrike: { multiplier: 2.2 },   // placeholder — user balance pass
  }],

  ['jungle-ape', {
    id: 'jungle-ape', name: 'Jungle Ape', color: 0xaa6633,
    // PRIORITY BRUISER: charges into the fight, then uses a readable Chestbeat
    // to hasten nearby monsters and call a small number of unengaged creatures
    // onto its target. The old invisible attack ramp is removed; the casted
    // window gives the player a clear moment to interrupt or focus the Ape.
    stats: { hp: 600, attack: 33, plating: 0, damageReduction: 0, speed: 62, attackRange: 12, attackCooldown: 1700, pullRange: 240 },
    behavior: 'melee', attackStyle: 'impact', biome: 'jungle', elite: true,
    rewards: { essence: 8, essenceType: 'green', level: 1, biomeXp: 44 },
    ai: { wanderRadius: 250, leashRange: 660, idleMinMs: 1000, idleMaxMs: 3800 },
    chargeOnAggro: { speedMult: 2.8, durationMs: 1000 },
    castedAttackSpeedBuff: {
      name: 'Chestbeat', castMs: 1300, cooldownMs: 12000, initialCooldownMs: 1800,
      effectId: 'monster-ape-chestbeat', attackSpeedPct: 0.3, durationMs: 4500,
      target: 'nearby-monsters', radius: 320, castWhileOutOfRange: true,
      rallyNearby: { maxTargets: 2, oncePerCombat: true }, fx: 'chest-beat',
    },
  }],
 
  ['jungle-blowdarter', {
    id: 'jungle-blowdarter', name: 'Vine Chameleon', color: 0x55bb44,
    // CONCEALED RANGED NUISANCE. Camouflaged/visually subdued while idle, reveals
    // when it attacks, then behaves as an ordinary ranged mob. It does NOT
    // re-camouflage in combat. Light poison is optional flavor at this first stage,
    // not the identity.
    stats: { hp: 450, attack: 20, plating: 0, damageReduction: 0, speed: 48, attackRange: 190, attackCooldown: 1900, pullRange: 250 },
    behavior: 'ranged', attackStyle: 'poison', biome: 'jungle',
    rewards: { essence: 7, essenceType: 'green', level: 1, biomeXp: 38 },
    concealedWhileIdle: true,
    ai: { wanderRadius: 250, leashRange: 660, idleMinMs: 1200, idleMaxMs: 4000 },
    dotEffect: { debuffId: 'dart-poison', label: 'Dart Poison', damagePerStack: 7, maxStacks: 4, tickIntervalMs: 1000, durationMs: 2100 },
  }],

  // ══════════════════ JUNGLE — fast aggressive evasive swarm (Forest successor) ══════════════════
  // NO PASSIVE PACK MECHANICS anywhere in this biome (user call): no alphas, no followers,
  // no call-allies. Jungle groups fights through TERRAIN — a thicket multiplies every
  // monster's detection radius while the player stands in it — not through monster
  // coordination. Do not reintroduce `pack` here without revisiting that.
  // 2nd tier. Fast, frequent, low-per-hit, high density; raw speed catches kiters
  // (anti-Far). Answer: evasion + raw-regen. Frequency is the threat evasion eats.
  ['jungle-stalker', {
    id: 'jungle-stalker', name: 'Jungle Stalker', color: 0x33cc44,
    // EVOLVED AMBUSHER: very fast, moves through/around foliage effectively, opens
    // with a pounce. Poison is DE-EMPHASIZED here (removed, locked) — venom is the
    // Snake's early-tier note, speed is this one's.
    stats: { hp: 790, attack: 55, plating: 0, damageReduction: 0, speed: 78, attackRange: 12, attackCooldown: 1000, pullRange: 270 },
    behavior: 'melee', attackStyle: 'poison', biome: 'jungle',
    rewards: { essence: 25, essenceType: 'green', level: 2, biomeXp: 150 },
    ai: { wanderRadius: 300, leashRange: 760, idleMinMs: 600, idleMaxMs: 2600 },
    openingStrike: { multiplier: 1.75 },  // deliberate engagement alpha; density and speed remain the threat
  }],

  ['silverback', {
    id: 'silverback', name: 'Silverback', color: 0xaa6633,
    // Evolved Ape: charge + a STRONGER combat ramp. Unrelated pack/evasion/opening
    // clutter removed (locked).
    stats: { hp: 1045, attack: 83, plating: 0, damageReduction: 0, speed: 60, attackRange: 12, attackCooldown: 1800, pullRange: 240 },
    behavior: 'melee', attackStyle: 'impact', biome: 'jungle', elite: true,
    rewards: { essence: 35, essenceType: 'green', level: 2, biomeXp: 210 },
    ai: { wanderRadius: 250, leashRange: 660, idleMinMs: 1000, idleMaxMs: 3800 },
    chargeOnAggro: { speedMult: 2.8, durationMs: 1100 },
    rampOnCombat: { stat: 'attack', perTickPct: 0.03, maxPct: 0.45, tickIntervalMs: 1000 },
  }],

  ['canopy-harrier', {
    id: 'canopy-harrier', name: 'Canopy Chameleon', color: 0x88ff44,
    // EVOLVED CONCEALED RANGED THREAT. Its signature is a readable, recurring
    // Barrage cast: reveal from camouflage, prime two fast attacks, then return
    // to ordinary ranged combat. No poison necessary.
    stats: { hp: 720, attack: 45, plating: 0, damageReduction: 0, speed: 52, attackRange: 190, attackCooldown: 1400, pullRange: 250 },
    behavior: 'ranged', attackStyle: 'arrow', biome: 'jungle',
    rewards: { essence: 27, essenceType: 'green', level: 2, biomeXp: 165 },
    concealedWhileIdle: true,
    castedAttackSpeedBuff: {
      name: 'Canopy Barrage', castMs: 1000, cooldownMs: 8000, initialCooldownMs: 3000,
      effectId: 'canopy-chameleon-barrage', attackSpeedPct: 2, attacks: 2,
      target: 'self', fx: 'barrage',
    },
    ai: { wanderRadius: 240, leashRange: 650, idleMinMs: 1200, idleMaxMs: 3500 },
  }],

  // T4

  ['hunting-panther', {
    id: 'hunting-panther', name: 'Hunting Panther', color: 0x33cc44,
    // APEX AMBUSHER: the strongest fast foliage predator. Pounce / engagement
    // burst. No generic evasion gimmick.
    stats: { hp: 950, attack: 52, plating: 0, damageReduction: 0, speed: 82, attackRange: 12, attackCooldown: 1200, pullRange: 290 },
    behavior: 'melee', attackStyle: 'slash', biome: 'jungle',
    rewards: { essence: 45, essenceType: 'green', level: 3, biomeXp: 270 },
    ai: { wanderRadius: 320, leashRange: 800, idleMinMs: 600, idleMaxMs: 2400 },
    openingStrike: { multiplier: 1.75 },
  }],

  ['apex-silverback', {
    id: 'apex-silverback', name: 'Apex Silverback', color: 0xaa6633,
    // APEX APE: charge + the STRONGEST combat ramp, and nothing else. Evasion,
    // the separate opening strike and the DR layering are all REMOVED (locked).
    // A visual Rage state at high ramp is optional presentation, not a mechanic.
    stats: { hp: 1450, attack: 77, plating: 0, damageReduction: 0, speed: 54, attackRange: 12, attackCooldown: 1800, pullRange: 250 },
    behavior: 'melee', attackStyle: 'impact', biome: 'jungle', elite: true,
    rewards: { essence: 88, essenceType: 'green', level: 4, biomeXp: 528 },
    ai: { wanderRadius: 260, leashRange: 680, idleMinMs: 1000, idleMaxMs: 3600 },
    chargeOnAggro: { speedMult: 2.8, durationMs: 1000 },
    rampOnCombat: { stat: 'attack', perTickPct: 0.03, maxPct: 0.45, tickIntervalMs: 1000 },
  }],

  ['thornback-lizard', {
    // Renamed for lineage continuity: it is the Chameleon line's apex, and the art
    // still reads chameleon. ID unchanged.
    id: 'thornback-lizard', name: 'Thornback Chameleon', color: 0x55bb44,
    // Chameleon line T4 apex: thorn-spiked elder chameleon. Camouflage while idle,
    // then a STRONGER recurring Barrage cast (~3 rapid attacks), then ordinary
    // ranged combat. Its stacking venom is REMOVED (locked) — late tier is not a
    // reason to add another invisible damage layer.
    stats: { hp: 1000, attack: 52, plating: 0, damageReduction: 0, speed: 50, attackRange: 200, attackCooldown: 1500, pullRange: 260 },
    behavior: 'ranged', attackStyle: 'poison', biome: 'jungle',
    rewards: { essence: 50, essenceType: 'green', level: 3, biomeXp: 300 },
    concealedWhileIdle: true,
    castedAttackSpeedBuff: {
      name: 'Thorn Barrage', castMs: 1000, cooldownMs: 8000, initialCooldownMs: 3000,
      effectId: 'thornback-chameleon-barrage', attackSpeedPct: 2, attacks: 3,
      target: 'self', fx: 'barrage',
    },
    ai: { wanderRadius: 250, leashRange: 660, idleMinMs: 1200, idleMaxMs: 4000 },
  }],

  ['emerald-constrictor', {
    id: 'emerald-constrictor', name: 'Emerald Constrictor', color: 0x22aa33,
    // STANDALONE T4 ELITE / CONTROL PREDATOR. Headline is CONSTRICT: a predictable
    // cadence attack (every 4th) that hits heavier AND briefly ROOTS the player.
    // The interesting bit is the interaction — it roots you inside an already
    // dangerous Jungle pull.
    // REMOVED (locked): evasion, combat ramp, and the extra defensive layers. Light
    // venom stays for snake flavor.
    stats: { hp: 1700, attack: 66, plating: 0, damageReduction: 0, speed: 62, attackRange: 12, attackCooldown: 1600, pullRange: 280 },
    behavior: 'melee', attackStyle: 'poison', biome: 'jungle', elite: true,
    rewards: { essence: 130, essenceType: 'green', level: 4, biomeXp: 780 },
    ai: { wanderRadius: 280, leashRange: 720, idleMinMs: 800, idleMaxMs: 3000 },
    // CONSTRICT - the headline. Every 4th attack hits heavier AND briefly roots.
    // The root is dangerous less for its damage than for WHERE it lands: inside a
    // Jungle pull the terrain already gathered.
    cadenceFinisher: { everyNAttacks: 4, multiplier: 2.0, rootMs: 1200 },
    dotEffect: { debuffId: 'constrictor-venom', label: 'Constrictor Venom', damagePerStack: 5, maxStacks: 5, tickIntervalMs: 1000, durationMs: 3000 },
    // ECOLOGY: solo elite that HARDENS over a drawn-out fight (the constrictor
    // squeezes tighter) — the sustained pressure Jungle's hardening charm answers.
  }],


] satisfies [string, MonsterDefinition][];
