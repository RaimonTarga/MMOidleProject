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

// ═════════════════════════════════════════════════════════════════════════
// ═════════════════════════════════════════════════════════════════════════
// DESERT — EXACT CONTROLLER/DEALER DUOS
//
// The biome read, against Jungle's:
//   Jungle: "I accidentally pulled six things."
//   Desert: "It is exactly two things. Which one do I kill first?"
//
// HARD STRUCTURAL RULE (T1-T4 rework, locked): a normal Desert group is an EXACT
// 1:1 DUO. Not an alpha with followers — a pair. Aggro either and you engage both.
//
//   CONTROLLER  high HP, low mobility, low direct offense, does NOT kite.
//               Applies control/debuffs. Two families:
//                 basilisks — HARD control: Petrifying Gaze root + a single
//                             NONSTACKING Sunder (damage taken up).
//                 scorpions — SOFT control: a strong movement slow / Cripple.
//                             (Reshaped from the old solo "harasser" line.)
//   DEALER      low HP, fast, ranged KITER, high direct damage, and NO CC of its
//               own. The scarab line.
//
// The exam is TARGET PRIORITY, and both answers are real:
//   • kill the Dealer first  -> incoming DPS collapses, the Controller remains
//                               merely annoying;
//   • kill the Controller first -> the CC disappears, but you tank Dealer damage
//                               the whole time you are doing it.
//
// WARNING: the Dealer is NOT despawned/scattered when the Controller dies (locked).
// The alpha-death scatter is gone from the whole game — see systems/combat/ai/packs.ts.
//
// WARNING: DO NOT REINTRODUCE — controller + 2 dealers; dealer slows; the default
// +32-40% stacking vulnerability. Pack infrastructure is reused internally only as
// spawn+shared-aggro plumbing; contradictory pack-flavoured behavior is removed.
//
// Sun Mark is GONE from every desert trash mob (locked decision 3). The engine
// survives on the T2 boss, which paints its own mark.
//
// WARNING: EVERY NUMBER BELOW IS A PLACEHOLDER — user balance pass. The stat SHAPES
// (controller HP up/attack down/speed down, dealer HP down/attack up/speed up) are
// the authored intent; the magnitudes are not.
// ═════════════════════════════════════════════════════════════════════════

export const desertMonsterEntries = [

  // ══ DESERT T2 — the pair, taught plain: root + kite, no sundering yet ══
  ['sand-scorpion', {
    id: 'sand-scorpion', name: 'Sand Scorpion', color: 0xddbb44,
    // SOFT CONTROLLER T2 (scorpion family). Reshaped from the old solo harasser:
    // HP up, movement down, direct damage well down, and a strong movement slow.
    // Pairs 1:1 with the Sun Scarab. Placeholder magnitudes.
    stats: { hp: 420, attack: 14, plating: 0, damageReduction: 0.08, speed: 30, attackRange: 12, attackCooldown: 2400, pullRange: 210 },
    behavior: 'melee', attackStyle: 'poison', biome: 'desert',
    rewards: { essence: 7, essenceType: 'yellow', level: 1, biomeXp: 40 },
    ai: { wanderRadius: 240, leashRange: 640, idleMinMs: 1500, idleMaxMs: 4500 },
    // Paired 1:1 with its tier's scarab, exactly like the basilisk family. The
    // pack fields are spawn + shared-aggro plumbing only - there is no alpha
    // fantasy here, and no scatter when either half dies.
    pack: { role: 'alpha', callRange: 340, followers: [{ typeId: 'dust-djinn', count: 1 }] },
    slowEffect: { speedMult: 0.5, durationMs: 2500 },
  }],

  ['stone-basilisk', {
    id: 'stone-basilisk', name: 'Stone Basilisk', color: 0xaa8833,
    // HARD CONTROLLER T2 (basilisk family). PETRIFYING GAZE: a periodic wind-up
    // that briefly ROOTS, replacing the old ordinary-hit `speedMult: 0` (locked).
    // Weak normal attacks — the Gaze is the entire weapon. Can work at short/mid
    // range. T2 is the teaching tier: root only, no Sunder yet.
    stats: { hp: 420, attack: 20, plating: 0, damageReduction: 0.15, speed: 26, attackRange: 12, attackCooldown: 2800, pullRange: 190 },
    behavior: 'melee', attackStyle: 'impact', biome: 'desert',
    rewards: { essence: 8, essenceType: 'yellow', level: 1, biomeXp: 46 },
    ai: { wanderRadius: 180, leashRange: 560, idleMinMs: 2000, idleMaxMs: 5500 },
    // PETRIFYING GAZE - a periodic telegraphed wind-up that briefly ROOTS. This
    // REPLACES the old ordinary-hit `speedMult: 0` (locked): a full root on every
    // swing was invisible and unanswerable; a cast bar is both readable and
    // interruptible. Multiplier stays near 1 - the root is the weapon.
    chargedAttack: {
      name: 'Petrifying Gaze', castMs: 1300, cooldownMs: 9000, initialCooldownMs: 3500,
      multiplier: 1.0, fx: 'power-shot', rootMs: 1400,
    },
    pack: { role: 'alpha', callRange: 340, followers: [{ typeId: 'dust-djinn', count: 1 }] },
  }],

  ['dust-djinn', {
    id: 'dust-djinn', name: 'Sun Scarab', color: 0xeecc66,
    // DEALER T2 (scarab line). Fragile, fast, ranged KITER, high direct damage.
    // Its slow is REMOVED (locked) — a dealer carries no CC.
    stats: { hp: 150, attack: 46, plating: 0, damageReduction: 0, speed: 52, attackRange: 190, attackCooldown: 1900, pullRange: 230 },
    behavior: 'kiter', attackStyle: 'magic', biome: 'desert',
    rewards: { essence: 8, essenceType: 'yellow', level: 1, biomeXp: 42 },
    ai: { wanderRadius: 220, leashRange: 620, idleMinMs: 1200, idleMaxMs: 4000 },
    pack: { role: 'follower', callRange: 320 },
  }],

  // ══ DESERT T3 — the same pair, now with SUNDERING on the controller ══
  // 2nd tier. The anti-Close biome: kiters you can't catch + a controller that
  // roots you and makes their shots land harder. Answer: target priority first,
  // then debuff-resist + cleanse + last-stand armor.
  ['dune-stalker', {
    id: 'dune-stalker', name: 'Dune Stalker', color: 0xddbb44,
    // SOFT CONTROLLER T3. Stronger/longer slow or Cripple; durable, slow, low direct
    // offense. Paired 1:1 with the Gilded Scarab.
    stats: { hp: 900, attack: 18, plating: 0, damageReduction: 0.08, speed: 30, attackRange: 12, attackCooldown: 2400, pullRange: 210 },
    behavior: 'melee', attackStyle: 'poison', biome: 'desert',
    rewards: { essence: 30, essenceType: 'yellow', level: 2, biomeXp: 180 },
    ai: { wanderRadius: 240, leashRange: 640, idleMinMs: 1500, idleMaxMs: 4500 },
    // Paired 1:1 with its tier's scarab, exactly like the basilisk family. The
    // pack fields are spawn + shared-aggro plumbing only - there is no alpha
    // fantasy here, and no scatter when either half dies.
    pack: { role: 'alpha', callRange: 340, followers: [{ typeId: 'sandweaver', count: 1 }] },
    slowEffect: { speedMult: 0.5, durationMs: 2500 },
  }],

  ['desert-basilisk', {
    id: 'desert-basilisk', name: 'Desert Basilisk', color: 0xaa8833,
    // HARD CONTROLLER T3. Inherits the Gaze and adds the tier's lesson: a SINGLE
    // NONSTACKING Sunder/Expose raising damage taken (~10-15%). The clean read is
    // "a successful Gaze roots you and leaves you Exposed for a few seconds".
    // Its own damage stays negligible: the threat is what it does to someone else's.
    stats: { hp: 900, attack: 26, plating: 0, damageReduction: 0.15, speed: 26, attackRange: 12, attackCooldown: 2800, pullRange: 190 },
    behavior: 'melee', attackStyle: 'impact', biome: 'desert',
    rewards: { essence: 45, essenceType: 'yellow', level: 2, biomeXp: 270 },
    ai: { wanderRadius: 180, leashRange: 560, idleMinMs: 2000, idleMaxMs: 5500 },
    // The Gaze, inherited. The tier's addition is the Sunder below: a successful
    // Gaze roots you and leaves you EXPOSED for a few seconds.
    chargedAttack: {
      name: 'Petrifying Gaze', castMs: 1300, cooldownMs: 8500, initialCooldownMs: 3500,
      multiplier: 1.0, fx: 'power-shot', rootMs: 1600,
    },
    appliesVulnerability: { damageTakenPct: 0.12, maxStacks: 1, durationMs: 4000 },
    pack: { role: 'alpha', callRange: 340, followers: [{ typeId: 'sandweaver', count: 1 }] },
  }],

  ['sandweaver', {
    id: 'sandweaver', name: 'Gilded Scarab', color: 0xcc9933,
    // DEALER T3. Squishy high-damage kiter, plus an occasional charged/high-damage
    // ranged shot. Readable combo: Controller roots/exposes -> Scarab winds up the
    // dangerous shot. NO slow on a dealer (locked).
    stats: { hp: 340, attack: 62, plating: 0, damageReduction: 0, speed: 52, attackRange: 220, attackCooldown: 1900, pullRange: 250 },
    behavior: 'kiter', attackStyle: 'magic', biome: 'desert',
    rewards: { essence: 47, essenceType: 'yellow', level: 2, biomeXp: 285 },
    ai: { wanderRadius: 220, leashRange: 640, idleMinMs: 1200, idleMaxMs: 4000 },
    // The readable combo: Controller roots and exposes you, THEN the Scarab winds
    // up its dangerous shot into a target that cannot walk out of it.
    chargedAttack: {
      name: 'Sunbeam', castMs: 1400, cooldownMs: 9000, initialCooldownMs: 4500,
      multiplier: 2.0, fx: 'power-shot',
    },
    pack: { role: 'follower', callRange: 320 },
  }],

  // ══ DESERT T4 — two controllers: the sundering specialist and the apex ══

  ['sand-viper', {
    id: 'sand-viper', name: 'Sand Viper', color: 0xddaa33,
    // SOFT CONTROLLER T4 — the mature soft controller: severe Cripple / high
    // soft-control uptime, on a CONTROLLER stat shape rather than the old fast-DPS
    // profile. Paired 1:1 with the Sunshield Scarab.
    stats: { hp: 1700, attack: 30, plating: 0, damageReduction: 0.08, speed: 28, attackRange: 12, attackCooldown: 2400, pullRange: 230 },
    behavior: 'melee', attackStyle: 'poison', biome: 'desert',
    rewards: { essence: 55, essenceType: 'yellow', level: 3, biomeXp: 330 },
    ai: { wanderRadius: 260, leashRange: 680, idleMinMs: 1500, idleMaxMs: 4500 },
    // Paired 1:1 with its tier's scarab, exactly like the basilisk family. The
    // pack fields are spawn + shared-aggro plumbing only - there is no alpha
    // fantasy here, and no scatter when either half dies.
    pack: { role: 'alpha', callRange: 340, followers: [{ typeId: 'sandspitter-cobra', count: 1 }] },
    slowEffect: { speedMult: 0.45, durationMs: 3000 },
  }],

  ['dune-basilisk', {
    id: 'dune-basilisk', name: 'Dune Basilisk', color: 0xaa8833,
    // HARD CONTROLLER T4. Root plus a stronger/longer NONSTACKING Sunder
    // (conceptual ceiling ~15-20% before balance). NO large stacking vulnerability
    // (locked). Its own damage stays negligible.
    stats: { hp: 1900, attack: 40, plating: 10, damageReduction: 0.14, speed: 26, attackRange: 15, attackCooldown: 3000, pullRange: 190 },
    behavior: 'melee', attackStyle: 'impact', biome: 'desert',
    rewards: { essence: 100, essenceType: 'yellow', level: 4, biomeXp: 600 },
    ai: { wanderRadius: 170, leashRange: 560, idleMinMs: 2500, idleMaxMs: 7000 },
    chargedAttack: {
      name: 'Petrifying Gaze', castMs: 1300, cooldownMs: 8000, initialCooldownMs: 3500,
      multiplier: 1.0, fx: 'power-shot', rootMs: 1800,
    },
    appliesVulnerability: { damageTakenPct: 0.18, maxStacks: 1, durationMs: 4500 },
    pack: { role: 'alpha', callRange: 340, followers: [{ typeId: 'sandspitter-cobra', count: 1 }] },
  }],

  ['sandspitter-cobra', {
    id: 'sandspitter-cobra', name: 'Sunshield Scarab', color: 0xeecc66,
    // DEALER T4 apex. High-damage kiter with a small SUNSHIELD/Barrier that
    // recharges only after it has AVOIDED damage for several seconds:
    //   • catch it and keep pressure on -> it stays fragile;
    //   • fail to catch it -> the shield comes back.
    // Do NOT make it generically tanky. Recharge-on-clean lands in the behavior pass.
    stats: { hp: 720, attack: 112, plating: 0, damageReduction: 0, speed: 54, attackRange: 230, attackCooldown: 1900, pullRange: 280 },
    behavior: 'kiter', attackStyle: 'magic', biome: 'desert',
    rewards: { essence: 58, essenceType: 'yellow', level: 3, biomeXp: 350 },
    ai: { wanderRadius: 240, leashRange: 660, idleMinMs: 1200, idleMaxMs: 4000 },
    // SUNSHIELD: recharges only after it has AVOIDED damage for several seconds.
    // Catch it and keep pressure on and it stays as fragile as its HP says; lose
    // it for a few seconds and the shield is back. Hard to kill WITHOUT being
    // generically tanky, which is the distinction the locked design wants.
    enemyShield: { shieldPct: 0.22, intervalMs: 12000, durationMs: 6000, rechargeAfterCleanMs: 4000 },
    pack: { role: 'follower', callRange: 320 },
  }],

  ['dune-tyrant', {
    id: 'dune-tyrant', name: 'Dune Tyrant', color: 0xcc9922,
    // APEX EXCEPTION — still exactly 1 Tyrant + 1 Sunshield Scarab.
    // A durable, slow apex CONTROLLER that also has real personal offense.
    // Simplified (locked) to two things: one strong control action (Crushing Pincer:
    // strong slow or brief root) and one telegraphed heavy PINCER SMASH.
    // The stacked vulnerability is REMOVED — no huge slow + vulnerability + multiple
    // dealers + unrelated gimmicks all at once.
    stats: { hp: 2200, attack: 88, plating: 8, damageReduction: 0.08, speed: 20, attackRange: 15, attackCooldown: 3500, pullRange: 160 },
    behavior: 'melee', attackStyle: 'impact', biome: 'desert', elite: true,
    rewards: { essence: 170, essenceType: 'yellow', level: 4, biomeXp: 1020 },
    ai: { wanderRadius: 100, leashRange: 450, idleMinMs: 4500, idleMaxMs: 12000 },
    // PINCER SMASH - a telegraphed heavy hit rather than an invisible cooldown
    // spike, so the apex's real offense is something the player can see coming
    // and Brace for. Paired with the strong slow below: one control action, one
    // heavy attack, nothing else.
    chargedAttack: {
      name: 'Pincer Smash', castMs: 1900, cooldownMs: 10000, initialCooldownMs: 5000,
      multiplier: 2.8, fx: 'strong-kick',
    },
    slowEffect: { speedMult: 0.4, durationMs: 4000 },
    pack: { role: 'alpha', callRange: 340, followers: [{ typeId: 'sandspitter-cobra', count: 1 }] },
  }],


] satisfies [string, MonsterDefinition][];
