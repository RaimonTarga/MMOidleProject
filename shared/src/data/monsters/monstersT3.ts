import type { MonsterDefinition } from './types';

// ─────────────────────────────────────────────────────────────────────────
// TIER 3 MOBS — the 7 active T3 biomes. Replaces the placeholder
// advancedBiomeMonsterEntriesA/B (those were AI-generated, no design — discard).
// NO Plains/Forest (retired at T2). Built from the T3 enemy-texture toolkit.
//
// SCALING (power-curve §3, ~1.9–2×/tier):
//   H_med 44 · H_big (generic) 70 · flagship cap-tripper 85–95 · mob-HP 440 · DPS 34.
//   Player T3 pool ~210–272, damage cap ~25% ≈ 55–68. Cap-trippers (Mountain/Cave)
//   exceed 68 to TRIP the cap; median hits sit ~44; armored elites carry plating/DR.
//   HP ×2.2 from T2, attack/DoT ×1.9, cooldowns/speed re-tuned per texture.
//
// HEADLINE AXIS = RANGE. Each biome takes a stance vs the Close/Mid/Far choice:
//   anti-Far  = chargers / fast movers / slow-you  (punish kiting)
//   anti-Close= kiters / ranged standoff           (punish melee chasing)
//   Goal: each range pick has good AND bad biomes — Far is a real choice, never auto.
//   CHARGE (exists) closes on Far. KITE (new) maintains standoff vs Close.
//
// ⚠ KITER SPEED IS CAPPED BELOW THE PLAYER (base 120). A kiter must always be
//   catchable by a charging player — otherwise it's unkillable for slow builds.
//   All kiters here sit at speed 30–40. Do not raise above player base.
//
// COMPLEXITY GRADIENT by biome age:
//   Mountain/Swamp = final tier (most-developed texture, then retire).
//   Cave = mature, existing defenses ONLY (shield/soft-cap held to T4).
//   Desert/Jungle = 2nd tier (scale + one deepening).
//   Volcano/Tundra = DEBUT T3 (clean, legible single-mechanic intros).
//
// NEW fields used below (engine gate — see bottom of file):
//   kite: true            — ranged AI maintains standoff (pairs with isRanged)
//   rampOnCombat: {...}    — Volcano: attack ramps while in combat, capped
//   rampDebuff: {...}      — Tundra: stacking slow/atk-slow on the PLAYER, capped
// Existing/reused: chargeOnAggro, isRanged, dotEffect, evasion, slowEffect.
// Costs/essence/biomeXp = placeholder (economy deferred).
// ─────────────────────────────────────────────────────────────────────────

export const tier3MonsterEntries = [
  // ══════════════════ MOUNTAIN — spiky cap-trippers + chargers ══════════════════
  // Final tier. Rare HUGE hits that trip the damage cap; chargers close on Far,
  // a ranged cap-tripper kiter punishes Close. Answer: damage-cap armor.
  ['mountain-colossus', {
    id: 'mountain-colossus', name: 'Mountain Colossus', color: 0x8899aa,
    // Flagship cap-tripper: a slow charging slam well past the cap. Anti-Far.
    stats: { hp: 770, attack: 95, plating: 0, damageReduction: 0, speed: 16, attackRange: 15, attackCooldown: 3800, pullRange: 160 },
    behavior: 'melee', attackStyle: 'impact', biome: 'mountain',
    rewards: { essence: 150, essenceType: 'blue', level: 3, biomeXp: 440 },
    ai: { wanderRadius: 90, leashRange: 420, idleMinMs: 4000, idleMaxMs: 10500 },
    chargeOnAggro: { speedMult: 2.5, durationMs: 1200 },
  }],

  ['avalanche-ram', {
    id: 'avalanche-ram', name: 'Avalanche Ram', color: 0x99aabb,
    // Faster charger, still a heavy (near-cap) hit — the mobile anti-Far threat.
    stats: { hp: 520, attack: 64, plating: 0, damageReduction: 0, speed: 38, attackRange: 12, attackCooldown: 2600, pullRange: 245 },
    behavior: 'melee', attackStyle: 'impact', biome: 'mountain',
    rewards: { essence: 95, essenceType: 'blue', level: 2, biomeXp: 280 },
    ai: { wanderRadius: 300, leashRange: 760, idleMinMs: 500, idleMaxMs: 2200 },
    chargeOnAggro: { speedMult: 2.5, durationMs: 1000 },
  }],

  ['summit-trebuchet', {
    id: 'summit-trebuchet', name: 'Summit Trebuchet', color: 0x778899,
    // Ranged cap-tripper that KITES — backs off, lobs boulders. Anti-Close:
    // melee chasing eats free 80-dmg hits. Slow (30) so a charge can still catch it.
    stats: { hp: 600, attack: 80, plating: 0, damageReduction: 0, speed: 30, attackRange: 250, attackCooldown: 3600, pullRange: 360 },
    behavior: 'melee', attackStyle: 'gunshot', isRanged: true, kite: true, biome: 'mountain',
    rewards: { essence: 120, essenceType: 'blue', level: 3, biomeXp: 360 },
    ai: { wanderRadius: 200, leashRange: 620, idleMinMs: 2000, idleMaxMs: 5000 },
  }],

  // ══════════════════ SWAMP — DoT engines + bulk/regen walls ══════════════════
  // Final tier. Trivial direct hits, brutal stacking DoT that ignores your spacing;
  // bulky/evasive walls. One ranged DoT-kiter. Answer: dot-resist + debt loop.
  ['plague-hydra', {
    id: 'plague-hydra', name: 'Plague Hydra', color: 0x335533,
    // DoT engine wall: bulky, DR, lives long enough to stack venom deep. The bite
    // is nothing; the poison is the whole fight. Kitable, but DoT ticks regardless.
    stats: { hp: 720, attack: 14, plating: 0, damageReduction: 0.12, speed: 26, attackRange: 15, attackCooldown: 2200, pullRange: 185 },
    behavior: 'melee', attackStyle: 'poison', biome: 'swamp',
    rewards: { essence: 130, essenceType: 'purple', level: 3, biomeXp: 390 },
    ai: { wanderRadius: 150, leashRange: 520, idleMinMs: 2800, idleMaxMs: 8000 },
    dotEffect: { damagePerStack: 16, maxStacks: 6, tickIntervalMs: 1000, durationMs: 6000 },
  }],

  ['mire-curse-witch', {
    id: 'mire-curse-witch', name: 'Mire Curse-Witch', color: 0x884499,
    // Ranged DoT KITER: plinks festering hexes, backs away. Anti-Close — chasing
    // it just walks you through more poison. Speed 36 (catchable on charge).
    stats: { hp: 400, attack: 16, plating: 0, damageReduction: 0, speed: 36, attackRange: 200, attackCooldown: 2200, pullRange: 230 },
    behavior: 'melee', attackStyle: 'magic', isRanged: true, kite: true, biome: 'swamp',
    rewards: { essence: 70, essenceType: 'purple', level: 2, biomeXp: 210 },
    ai: { wanderRadius: 200, leashRange: 580, idleMinMs: 1500, idleMaxMs: 4500 },
    dotEffect: { damagePerStack: 12, maxStacks: 5, tickIntervalMs: 1000, durationMs: 4500 },
  }],

  ['bog-lurker', {
    id: 'bog-lurker', name: 'Bog Lurker', color: 0x445533,
    // Evasive ambush DoT wall: dodges every 5th hit (many-hit weapons whiff) +
    // DR bulk + heavy toxin. The "regen/bulk wall" texture — hard to burn down fast.
    stats: { hp: 620, attack: 12, plating: 0, damageReduction: 0.14, speed: 30, attackRange: 12, attackCooldown: 2600, pullRange: 155 },
    behavior: 'melee', attackStyle: 'poison', biome: 'swamp',
    rewards: { essence: 115, essenceType: 'purple', level: 3, biomeXp: 345 },
    ai: { wanderRadius: 160, leashRange: 540, idleMinMs: 2200, idleMaxMs: 6500 },
    evasion: 0.25,
    dotEffect: { damagePerStack: 14, maxStacks: 5, tickIntervalMs: 1000, durationMs: 4500 },
  }],

  // ══════════════════ CAVE — tanky consistent elites, MIXED (existing defenses only) ══════════════════
  // Mature. Few elites, mixed shapes, consistent (non-spiky) damage, carry DR/plating
  // where slow/piercing weapons pay off. Answer: %DR (the universal mitigation).
  // NO shield / soft-cap here (those are the T4 weapon-matchup axis).
  ['deep-spider', {
    id: 'deep-spider', name: 'Deep Spider', color: 0x992266,
    // Fast dodgy elite: high speed catches kiters (anti-Far), evasion whiffs many-hit
    // weapons, consistent medium hits = %DR's home. Light venom.
    stats: { hp: 800, attack: 42, plating: 0, damageReduction: 0.08, speed: 70, attackRange: 12, attackCooldown: 1500, pullRange: 220 },
    behavior: 'melee', attackStyle: 'poison', biome: 'cave',
    rewards: { essence: 110, essenceType: 'red', level: 3, biomeXp: 330 },
    ai: { wanderRadius: 260, leashRange: 680, idleMinMs: 800, idleMaxMs: 3200 },
    evasion: 0.25,
    dotEffect: { damagePerStack: 8, maxStacks: 3, tickIntervalMs: 1000, durationMs: 3000 },
  }],

  ['cavern-troll', {
    id: 'cavern-troll', name: 'Cavern Troll', color: 0x334433,
    // The elite ceiling: armored cap-tripping bruiser, charges to connect. Heavy
    // DR + plating means slow/piercing weapons earn their keep. Anti-Far.
    stats: { hp: 1400, attack: 88, plating: 4, damageReduction: 0.15, speed: 14, attackRange: 15, attackCooldown: 3600, pullRange: 150 },
    behavior: 'melee', attackStyle: 'impact', biome: 'cave',
    rewards: { essence: 165, essenceType: 'red', level: 3, biomeXp: 500 },
    ai: { wanderRadius: 120, leashRange: 460, idleMinMs: 3000, idleMaxMs: 8500 },
    chargeOnAggro: { speedMult: 2.0, durationMs: 1200 },
  }],

  ['crystal-gargoyle', {
    id: 'crystal-gargoyle', name: 'Crystal Gargoyle', color: 0x554455,
    // Armored ranged sentry — perched, patient, hurls shards. Stationary ranged
    // (NOT a kiter: it holds its perch), armored so it isn't trivially bursted.
    stats: { hp: 950, attack: 60, plating: 3, damageReduction: 0.10, speed: 20, attackRange: 210, attackCooldown: 3200, pullRange: 185 },
    behavior: 'melee', attackStyle: 'gunshot', isRanged: true, biome: 'cave',
    rewards: { essence: 120, essenceType: 'red', level: 3, biomeXp: 360 },
    ai: { wanderRadius: 120, leashRange: 450, idleMinMs: 2500, idleMaxMs: 7000 },
  }],

  // ══════════════════ DESERT — debuff appliers + KITER showcase ══════════════════
  // 2nd tier. The anti-Close biome: kiters you can't catch in melee + slows/roots
  // that stop you closing. Answer: debuff-resist + cleanse + last-stand armor.
  ['dune-stalker', {
    id: 'dune-stalker', name: 'Dune Stalker', color: 0xddbb44,
    // Fast slow-applier: lands a debuff that catches Far, then keeps pace. Anti-Far.
    stats: { hp: 420, attack: 38, plating: 0, damageReduction: 0.08, speed: 56, attackRange: 12, attackCooldown: 2000, pullRange: 210 },
    behavior: 'melee', attackStyle: 'poison', biome: 'desert',
    rewards: { essence: 60, essenceType: 'yellow', level: 2, biomeXp: 180 },
    ai: { wanderRadius: 240, leashRange: 640, idleMinMs: 1500, idleMaxMs: 4500 },
    slowEffect: { speedMult: 0.5, durationMs: 2500 },
  }],

  ['desert-basilisk', {
    id: 'desert-basilisk', name: 'Desert Basilisk', color: 0xaa8833,
    // Root-applier bruiser: a brief full root (speedMult 0) pins you so the
    // kiters/slows punish — the debuff "setup" piece. Armored.
    stats: { hp: 600, attack: 46, plating: 0, damageReduction: 0.12, speed: 28, attackRange: 12, attackCooldown: 2600, pullRange: 175 },
    behavior: 'melee', attackStyle: 'impact', biome: 'desert',
    rewards: { essence: 90, essenceType: 'yellow', level: 2, biomeXp: 270 },
    ai: { wanderRadius: 180, leashRange: 560, idleMinMs: 2000, idleMaxMs: 5500 },
    slowEffect: { speedMult: 0, durationMs: 1200 },
  }],

  ['sandweaver', {
    id: 'sandweaver', name: 'Sandweaver', color: 0xcc9933,
    // THE kiter: maintains standoff, plinks hard, and SLOWS you so you can't close.
    // Pure anti-Close — Close/melee suffers most here; Mid/Far shine. Speed 40.
    stats: { hp: 360, attack: 44, plating: 0, damageReduction: 0, speed: 40, attackRange: 220, attackCooldown: 2200, pullRange: 250 },
    behavior: 'melee', attackStyle: 'magic', isRanged: true, kite: true, biome: 'desert',
    rewards: { essence: 95, essenceType: 'yellow', level: 2, biomeXp: 285 },
    ai: { wanderRadius: 220, leashRange: 640, idleMinMs: 1200, idleMaxMs: 4000 },
    slowEffect: { speedMult: 0.6, durationMs: 2000 },
  }],

  // ══════════════════ JUNGLE — fast aggressive evasive swarm (Forest successor) ══════════════════
  // 2nd tier. Fast, frequent, low-per-hit, high density; raw speed catches kiters
  // (anti-Far). Answer: evasion + raw-regen. Frequency is the threat evasion eats.
  ['jungle-stalker', {
    id: 'jungle-stalker', name: 'Jungle Stalker', color: 0x33cc44,
    // Fast frequent-attacker: low per-hit, attacks often (evasion's home), very
    // fast move runs down kiters. Light venom. Anti-Far.
    stats: { hp: 340, attack: 26, plating: 0, damageReduction: 0, speed: 78, attackRange: 12, attackCooldown: 1000, pullRange: 270 },
    behavior: 'melee', attackStyle: 'poison', biome: 'jungle',
    rewards: { essence: 50, essenceType: 'green', level: 2, biomeXp: 150 },
    ai: { wanderRadius: 300, leashRange: 760, idleMinMs: 600, idleMaxMs: 2600 },
    dotEffect: { damagePerStack: 4, maxStacks: 3, tickIntervalMs: 1200, durationMs: 3600 },
  }],

  ['silverback', {
    id: 'silverback', name: 'Silverback', color: 0xaa6633,
    // Fast charging bruiser: explosive close, mid hit, a little DR. Anti-Far.
    stats: { hp: 480, attack: 40, plating: 0, damageReduction: 0.05, speed: 60, attackRange: 12, attackCooldown: 1800, pullRange: 240 },
    behavior: 'melee', attackStyle: 'impact', biome: 'jungle',
    rewards: { essence: 70, essenceType: 'green', level: 2, biomeXp: 210 },
    ai: { wanderRadius: 250, leashRange: 660, idleMinMs: 1000, idleMaxMs: 3800 },
    chargeOnAggro: { speedMult: 2.8, durationMs: 1100 },
  }],

  ['canopy-harrier', {
    id: 'canopy-harrier', name: 'Canopy Harrier', color: 0x88ff44,
    // Frequent ranged thorn-volleys from the canopy — fast cooldown, light hits.
    // Stationary ranged (relentless poke, not a standoff kiter). Adds chip volume.
    stats: { hp: 300, attack: 22, plating: 0, damageReduction: 0, speed: 52, attackRange: 190, attackCooldown: 1400, pullRange: 250 },
    behavior: 'melee', attackStyle: 'gunshot', isRanged: true, biome: 'jungle',
    rewards: { essence: 55, essenceType: 'green', level: 2, biomeXp: 165 },
    ai: { wanderRadius: 240, leashRange: 650, idleMinMs: 1200, idleMaxMs: 3500 },
  }],

  // ══════════════════ VOLCANO (debut T3) — high-density fire swarm, RAMPING ══════════════════
  // Debut → legible single-mechanic intro. Fast dense swarm; every enemy RAMPS
  // attack while in combat (capped) — "burst it or out-sustain it." Density + speed
  // catch Far, ramp punishes slow kills. Answer: hardening + in-combat-regen/kill-burst.
  ['ember-imp', {
    id: 'ember-imp', name: 'Ember Imp', color: 0xff6622,
    // Swarm filler that heats up: starts weak, ramps if the fight drags. Fast.
    stats: { hp: 280, attack: 24, plating: 2, damageReduction: 0, speed: 64, attackRange: 12, attackCooldown: 1600, pullRange: 210 },
    behavior: 'melee', attackStyle: 'fire', biome: 'volcanic',
    rewards: { essence: 50, essenceType: 'red', level: 2, biomeXp: 150 },
    ai: { wanderRadius: 230, leashRange: 620, idleMinMs: 1000, idleMaxMs: 3600 },
    rampOnCombat: { stat: 'attack', perTickPct: 0.08, maxPct: 0.40, tickIntervalMs: 2000 },
  }],

  ['cinder-hound', {
    id: 'cinder-hound', name: 'Cinder Hound', color: 0xff8800,
    // Fast charger that ramps: closes instantly, gets hotter the longer it lives.
    stats: { hp: 360, attack: 30, plating: 3, damageReduction: 0, speed: 70, attackRange: 12, attackCooldown: 1300, pullRange: 260 },
    behavior: 'melee', attackStyle: 'fire', biome: 'volcanic',
    rewards: { essence: 58, essenceType: 'red', level: 2, biomeXp: 175 },
    ai: { wanderRadius: 260, leashRange: 680, idleMinMs: 700, idleMaxMs: 3000 },
    chargeOnAggro: { speedMult: 2.5, durationMs: 900 },
    rampOnCombat: { stat: 'attack', perTickPct: 0.08, maxPct: 0.40, tickIntervalMs: 2000 },
  }],

  ['magma-brute', {
    id: 'magma-brute', name: 'Magma Brute', color: 0xcc2200,
    // Slow bruiser that ramps HARDER (cap +60%): kitable alone, but in the swarm you
    // can't kite freely, and a slow kill lets it spiral toward dangerous. Plt 6.
    stats: { hp: 700, attack: 56, plating: 6, damageReduction: 0, speed: 22, attackRange: 15, attackCooldown: 3000, pullRange: 150 },
    behavior: 'melee', attackStyle: 'fire', biome: 'volcanic',
    rewards: { essence: 110, essenceType: 'red', level: 3, biomeXp: 330 },
    ai: { wanderRadius: 120, leashRange: 470, idleMinMs: 3000, idleMaxMs: 8500 },
    rampOnCombat: { stat: 'attack', perTickPct: 0.10, maxPct: 0.60, tickIntervalMs: 2000 },
  }],

  ['ash-slinger', {
    id: 'ash-slinger', name: 'Ash Slinger', color: 0xff4422,
    // Ranged ember-lobber that ramps — pokes while the swarm closes; ignoring it
    // lets its ramp build. Stationary ranged (not a kiter — Volcano is aggressive).
    stats: { hp: 320, attack: 34, plating: 2, damageReduction: 0, speed: 44, attackRange: 180, attackCooldown: 2000, pullRange: 230 },
    behavior: 'melee', attackStyle: 'fire', isRanged: true, biome: 'volcanic',
    rewards: { essence: 55, essenceType: 'red', level: 2, biomeXp: 165 },
    ai: { wanderRadius: 220, leashRange: 600, idleMinMs: 1200, idleMaxMs: 4000 },
    rampOnCombat: { stat: 'attack', perTickPct: 0.08, maxPct: 0.40, tickIntervalMs: 2000 },
  }],

  // ══════════════════ TUNDRA (debut T3) — slow frozen hard-hitters + RAMPING DEBUFF ══════════════════
  // Debut → legible intro. Low-mid density, slow movers, hard hits; they SLOW you
  // (the anti-Far — catches kiters who get slowed) and stack a ramping debuff (capped).
  // "Plant and outlast" vs "burst before the debuffs bite." Answer: stationary-ramp
  // DR + cap armor, shield + absorb charm.
  ['frost-lurker', {
    id: 'frost-lurker', name: 'Frost Lurker', color: 0xaaddff,
    // Slow mover, hard-ish hit, applies a flat slow on you → catches Far. The basic
    // teaching unit: kitable until it lands the slow, then it closes.
    stats: { hp: 460, attack: 40, plating: 0, damageReduction: 0.10, speed: 26, attackRange: 12, attackCooldown: 2600, pullRange: 170 },
    behavior: 'melee', attackStyle: 'frost', biome: 'tundra',
    rewards: { essence: 58, essenceType: 'blue', level: 2, biomeXp: 175 },
    ai: { wanderRadius: 150, leashRange: 510, idleMinMs: 2500, idleMaxMs: 7000 },
    slowEffect: { speedMult: 0.5, durationMs: 2500 },
  }],

  ['glacier-bear', {
    id: 'glacier-bear', name: 'Glacier Bear', color: 0x5599cc,
    // The ramping-debuff carrier: each hit stacks slow + attack-slow on you, capped.
    // If the fight drags the debuff bites — but the cap guarantees you can still kill.
    // Plant-vs-burst tension: your stationary-DR armor ALSO rewards the long fight.
    stats: { hp: 780, attack: 64, plating: 0, damageReduction: 0.14, speed: 22, attackRange: 15, attackCooldown: 3200, pullRange: 175 },
    behavior: 'melee', attackStyle: 'frost', biome: 'tundra',
    rewards: { essence: 130, essenceType: 'blue', level: 3, biomeXp: 390 },
    ai: { wanderRadius: 140, leashRange: 500, idleMinMs: 3000, idleMaxMs: 8500 },
    rampDebuff: {
      moveSlowPerHit: 0.06, moveSlowMaxPct: 0.40,   // capped — never a full root
      atkSlowPerHit: 0.05,  atkSlowMaxPct: 0.30,     // ⚠ cap load-bearing (anti-spiral)
      stackDurationMs: 4000,                          // each stack decays if you disengage
    },
  }],

  ['rime-caster', {
    id: 'rime-caster', name: 'Rime Caster', color: 0xccffff,
    // Ranged frost KITER: backs off, plinks, and keeps you slowed so you can't close —
    // anti-Close, and it feeds the bears' debuff window. Speed 30 (catchable on charge).
    stats: { hp: 420, attack: 46, plating: 0, damageReduction: 0.08, speed: 30, attackRange: 200, attackCooldown: 2800, pullRange: 230 },
    behavior: 'melee', attackStyle: 'frost', isRanged: true, kite: true, biome: 'tundra',
    rewards: { essence: 90, essenceType: 'blue', level: 2, biomeXp: 270 },
    ai: { wanderRadius: 200, leashRange: 600, idleMinMs: 1500, idleMaxMs: 4500 },
    slowEffect: { speedMult: 0.6, durationMs: 2200 },
  }],
] satisfies [string, MonsterDefinition][];