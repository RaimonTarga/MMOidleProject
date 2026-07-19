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

export const desertMonsterEntries = [
  
  // ══ DESERT T2 — debuff/slow/root appliers; lockdown is the threat ══
  ['sand-scorpion', {
    id: 'sand-scorpion', name: 'Sand Scorpion', color: 0xddbb44,
    // Fast slow-applier: a sting that saps your speed (speedMult 0.5) so the rest
    // of the pack can keep up with you. Light DR. The mobile debuffer.
    stats: { hp: 220, attack: 32, plating: 0, damageReduction: 0.08, speed: 52, attackRange: 12, attackCooldown: 2000, pullRange: 210 },
    behavior: 'melee', attackStyle: 'poison', biome: 'desert',
    rewards: { essence: 7, essenceType: 'yellow', level: 1, biomeXp: 40 },
    ai: { wanderRadius: 240, leashRange: 640, idleMinMs: 1500, idleMaxMs: 4500 },
    slowEffect: { speedMult: 0.5, durationMs: 2500 },
  }],
 
  ['stone-basilisk', {
    id: 'stone-basilisk', name: 'Stone Basilisk', color: 0xaa8833,
    // Root bruiser: a petrifying gaze briefly pins you in place (speedMult 0) — the
    // lockdown setup that lets the scorpions and djinn pile on. Slow, sturdier DR.
    // ECOLOGY: the DUEL FINISHER — opens with a heavy alpha strike (openingStrike),
    // and cashes in the djinn's Sun Mark for an amplified hit (markedStrike) while
    // its root holds you. Answered by last-stand (survive the spike) + cleanse
    // (strip the mark before it lands).
    stats: { hp: 320, attack: 36, plating: 0, damageReduction: 0.12, speed: 28, attackRange: 12, attackCooldown: 2600, pullRange: 175 },
    behavior: 'melee', attackStyle: 'impact', biome: 'desert',
    rewards: { essence: 8, essenceType: 'yellow', level: 1, biomeXp: 46 },
    ai: { wanderRadius: 180, leashRange: 560, idleMinMs: 2000, idleMaxMs: 5500 },
    slowEffect: { speedMult: 0, durationMs: 1200 },
    openingStrike: { multiplier: 2.5 },   // placeholder — user balance pass
    markedStrike: { multiplier: 2.0 },    // placeholder — user balance pass
  }],

  ['dust-djinn', {
    id: 'dust-djinn', name: 'Sun Scarab', color: 0xeecc66,
    // Scarab line T2 (desert's ranged debuffer): a sacred sun-beetle whose amber
    // bolts sting and slow from afar. Stationary ranged at T2 — becomes the
    // standoff kiter (Gilded Scarab) at T3. Light DR.
    // ECOLOGY: the SUN MARK painter — marks you from range (appliesMark) so the
    // basilisk's finisher lands amplified. Cleanse removes the mark; it expires
    // harmlessly if you break line of sight before the finisher connects.
    stats: { hp: 200, attack: 34, plating: 0, damageReduction: 0.05, speed: 40, attackRange: 185, attackCooldown: 2100, pullRange: 230 },
    behavior: 'ranged', attackStyle: 'magic', biome: 'desert',
    rewards: { essence: 8, essenceType: 'yellow', level: 1, biomeXp: 42 },
    ai: { wanderRadius: 220, leashRange: 620, idleMinMs: 1200, idleMaxMs: 4000 },
    slowEffect: { speedMult: 0.6, durationMs: 2000 },
    appliesMark: { durationMs: 4000 },    // placeholder — user balance pass
  }],

  // ══════════════════ DESERT — debuff appliers + KITER showcase ══════════════════
  // 2nd tier. The anti-Close biome: kiters you can't catch in melee + slows/roots
  // that stop you closing. Answer: debuff-resist + cleanse + last-stand armor.
  ['dune-stalker', {
    id: 'dune-stalker', name: 'Dune Stalker', color: 0xddbb44,
    // Scorpion line T3 (bigger sand scorpion; role-name kept).
    // Fast slow-applier: lands a debuff that catches Far, then keeps pace. Anti-Far.
    stats: { hp: 520, attack: 38, plating: 0, damageReduction: 0.08, speed: 56, attackRange: 12, attackCooldown: 2000, pullRange: 210 },
    behavior: 'melee', attackStyle: 'poison', biome: 'desert',
    rewards: { essence: 30, essenceType: 'yellow', level: 2, biomeXp: 180 },
    ai: { wanderRadius: 240, leashRange: 640, idleMinMs: 1500, idleMaxMs: 4500 },
    slowEffect: { speedMult: 0.5, durationMs: 2500 },
  }],

  ['desert-basilisk', {
    id: 'desert-basilisk', name: 'Desert Basilisk', color: 0xaa8833,
    // Root-applier bruiser: a brief full root (speedMult 0) pins you so the
    // kiters/slows punish — the debuff "setup" piece. Armored.
    // ECOLOGY: the DUEL FINISHER (T3) — alpha-strike opener + cashes the sandweaver's
    // Sun Mark while its root holds you. Last-stand + cleanse is the answer.
    stats: { hp: 700, attack: 46, plating: 0, damageReduction: 0.12, speed: 28, attackRange: 12, attackCooldown: 2600, pullRange: 175 },
    behavior: 'melee', attackStyle: 'impact', biome: 'desert',
    rewards: { essence: 45, essenceType: 'yellow', level: 2, biomeXp: 270 },
    ai: { wanderRadius: 180, leashRange: 560, idleMinMs: 2000, idleMaxMs: 5500 },
    slowEffect: { speedMult: 0, durationMs: 1200 },
    openingStrike: { multiplier: 2.5 },   // placeholder — user balance pass
    markedStrike: { multiplier: 2.0 },    // placeholder — user balance pass
  }],

  ['sandweaver', {
    id: 'sandweaver', name: 'Gilded Scarab', color: 0xcc9933,
    // THE kiter: maintains standoff, plinks hard, and SLOWS you so you can't close.
    // Pure anti-Close — Close/melee suffers most here; Mid/Far shine. Speed 40.
    // ECOLOGY: the SUN MARK painter (T3) — paints from the standoff so the basilisk's
    // finisher lands amplified. Cleanse strips it; it expires if you escape the window.
    stats: { hp: 460, attack: 44, plating: 0, damageReduction: 0, speed: 40, attackRange: 220, attackCooldown: 2200, pullRange: 250 },
    behavior: 'kiter', attackStyle: 'magic', biome: 'desert',
    rewards: { essence: 47, essenceType: 'yellow', level: 2, biomeXp: 285 },
    ai: { wanderRadius: 220, leashRange: 640, idleMinMs: 1200, idleMaxMs: 4000 },
    slowEffect: { speedMult: 0.6, durationMs: 2000 },
    appliesMark: { durationMs: 4000 },    // placeholder — user balance pass
  }],

  // T4

  ['sand-viper', {
    id: 'sand-viper', name: 'Sand Viper', color: 0xddaa33,
    // Fast debuffer: lands a heavy movement slow so the slower pack can pile on.
    // Catches Far builds that try to kite. DPS 78 × (1000/1600) = 49 + the slow.
    stats: { hp: 980, attack: 78, plating: 0, damageReduction: 0.08, speed: 60, attackRange: 12, attackCooldown: 1600, pullRange: 230 },
    behavior: 'melee', attackStyle: 'poison', biome: 'desert',
    rewards: { essence: 55, essenceType: 'yellow', level: 3, biomeXp: 330 },
    ai: { wanderRadius: 260, leashRange: 680, idleMinMs: 1500, idleMaxMs: 4500 },
    slowEffect: { speedMult: 0.45, durationMs: 3000 },
  }],

  ['dune-basilisk', {
    id: 'dune-basilisk', name: 'Dune Basilisk', color: 0xaa8833,
    // Root bruiser: a petrifying gaze full-stops you (speedMult 0) — the lockdown
    // setup that lets the vipers close and the cobra plink. Moderate plating.
    // DPS 90 × (1000/2800) = 32 — low, but the root is the real weapon.
    stats: { hp: 1450, attack: 90, plating: 10, damageReduction: 0.10, speed: 26, attackRange: 15, attackCooldown: 2800, pullRange: 175 },
    behavior: 'melee', attackStyle: 'impact', biome: 'desert',
    rewards: { essence: 100, essenceType: 'yellow', level: 4, biomeXp: 600 },
    ai: { wanderRadius: 170, leashRange: 560, idleMinMs: 2500, idleMaxMs: 7000 },
    slowEffect: { speedMult: 0, durationMs: 1400 },
  }],

  ['sandspitter-cobra', {
    id: 'sandspitter-cobra', name: 'Sunshield Scarab', color: 0xeecc66,
    // Scarab line T4 apex. Ranged KITER + ENEMY SHIELD (its carapace flares). Anti-Close — chasing
    // it eats slowed hits. The shield rewards the alpha-strike weapon: a
    // first-strike burst tears the barrier before the slow stack bites.
    // DPS 84 × (1000/2200) = 38 (kiter).
    // ECOLOGY: the SUN MARK painter (T4) — paints from the kiting standoff so the
    // dune-tyrant's slam lands amplified into a marked target. Cleanse strips it.
    stats: { hp: 930, attack: 84, plating: 0, damageReduction: 0, speed: 38, attackRange: 230, attackCooldown: 2200, pullRange: 280 },
    behavior: 'kiter', attackStyle: 'magic', biome: 'desert',
    rewards: { essence: 58, essenceType: 'yellow', level: 3, biomeXp: 350 },
    ai: { wanderRadius: 240, leashRange: 660, idleMinMs: 1200, idleMaxMs: 4000 },
    slowEffect: { speedMult: 0.6, durationMs: 2500 },
    enemyShield: { shieldPct: 0.22, intervalMs: 12000, durationMs: 6000 },
    appliesMark: { durationMs: 4500 },    // placeholder — user balance pass
  }],

  ['dune-tyrant', {
    id: 'dune-tyrant', name: 'Dune Tyrant', color: 0xcc9922,
    // Slow elite (colossal emperor scorpion — mob echo of the royal boss ladder).
    // COOLDOWN slam (a pincer smash) every 10s = 246 that also
    // dumps a long heavy slow. The Desert exam: last-stand + debuff-resist both
    // tested. Base 88 ≈ H_med (survivable); the slam is the spike.
    // ECOLOGY: the DUEL FINISHER (T4) — its cooldown slam is the alpha strike, and a
    // marked target (cobra's Sun Mark) eats it AMPLIFIED (markedStrike). The exam:
    // cleanse the mark or last-stand the slam.
    stats: { hp: 2200, attack: 88, plating: 8, damageReduction: 0.08, speed: 20, attackRange: 15, attackCooldown: 3500, pullRange: 160 },
    behavior: 'melee', attackStyle: 'impact', biome: 'desert', elite: true,
    rewards: { essence: 170, essenceType: 'yellow', level: 4, biomeXp: 1020 },
    ai: { wanderRadius: 100, leashRange: 450, idleMinMs: 4500, idleMaxMs: 12000 },
    empoweredCooldown: { cooldownMs: 10000, multiplier: 2.8 },  // 246
    slowEffect: { speedMult: 0.4, durationMs: 4000 },
    markedStrike: { multiplier: 1.8 },    // placeholder — user balance pass
  }],


] satisfies [string, MonsterDefinition][];