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
//   behavior: 'kiter'     — ranged AI maintains standoff (see monsterKites)
//   ⚠ rampOnCombat/rampDebuff are NO LONGER authored here — see the biome banner.
// Existing/reused: chargeOnAggro, behavior: 'ranged', dotEffect, evasion, slowEffect.
// Costs/essence/biomeXp = placeholder (economy deferred).
// ─────────────────────────────────────────────────────────────────────────

export const volcanoMonsterEntries = [


  // ══════════════════ VOLCANO — high-density fire swarm under GLOBAL HEAT ══════════════════
  // "The fight gets more dangerous over time" is owned by ONE thing: the node-wide
  // ambient HEAT ramp (`volcanicHeat` in shared/src/world/nodeFeatures.ts), which
  // raises the player's damage DEALT and TAKEN together the longer combat runs.
  //
  // ⚠ NO monster in this biome carries `rampOnCombat` (T1–T4 rework, locked). Nine
  // per-mob ramps stacked on top of the global ramp was two difficulty knobs doing
  // one job, and made every volcano mob the same monster. Each mob's job now is to
  // give the fight a reason NOT to end quickly, and Heat does the rest.
  // Density + speed catch Far. Answer: hardening + active/on-kill Recovery.
  ['ember-scuttler', {
    id: 'ember-scuttler', name: 'Ember Scuttler', color: 0xff6622,
    // Young fire skink (role-name kept; grows into the T4 Ember Skink).
    // Basic swarm filler: weak, fast, numerous. No ability — deliberately.
    // Attack cut 148 -> 70 (item/monster diagnostic, 2026-08-24), then 70 -> 55
    // in the T3 ordinary-damage pass: a death-trace found the old value hitting
    // for 110-122 (up to 42% of a T3 arrival player's maxHP) as an ordinary hit —
    // directly contradicting its own "weak... filler" identity above.
    stats: { hp: 1220, attack: 55, plating: 2, damageReduction: 0, speed: 64, attackRange: 12, attackCooldown: 1600, pullRange: 210 },
    behavior: 'melee', attackStyle: 'fire', biome: 'volcanic',
    rewards: { essence: 25, essenceType: 'red', level: 2, biomeXp: 150 },
    // Loose cohesion/separation so the high-density biome READS as a swarm.
    // WARNING: no alpha, no followers, no call-allies (locked) - density is the
    // swarm, monster coordination is not.
    swarm: { cohesion: 0.1, separation: 44 },
    ai: { wanderRadius: 230, leashRange: 620, idleMinMs: 1000, idleMaxMs: 3600 },
  }],

  ['cinder-hound', {
    id: 'cinder-hound', name: 'Cinder Hound', color: 0xff8800,
    // SWARM CATCHER / anti-kite: charges on engagement so you cannot simply walk
    // away from the density. No personal ramp.
    // Attack cut 184 -> 135 (item/monster diagnostic, 2026-08-24), then 135 -> 80
    // in the T3 ordinary-damage pass: a death-trace found the old value landing
    // 150-165 (up to 57% of a T3 arrival player's maxHP) as a plain ordinary hit,
    // stacked on top of the other fire mobs in the same pull.
    stats: { hp: 1440, attack: 80, plating: 3, damageReduction: 0, speed: 70, attackRange: 12, attackCooldown: 1300, pullRange: 260 },
    behavior: 'melee', attackStyle: 'fire', biome: 'volcanic',
    rewards: { essence: 29, essenceType: 'red', level: 2, biomeXp: 175 },
    ai: { wanderRadius: 260, leashRange: 680, idleMinMs: 700, idleMaxMs: 3000 },
    swarm: { cohesion: 0.08, separation: 56 },
    chargeOnAggro: { speedMult: 2.5, durationMs: 900 },
  }],

  ['magma-brute', {
    id: 'magma-brute', name: 'Magma Tortoise', color: 0xcc2200,
    // Molten tortoise (line T3, grows into the T4 Obsidian Tortoise). Slow armored
    // ANCHOR: high HP, plating, very slow, heavier attacks, no signature ability.
    // Its strategic role is that it keeps combat ALIVE — which is what lets the
    // node's global Heat keep climbing.
    // Attack cut 343 -> 190 (item/monster diagnostic, 2026-08-24), then 190 -> 145
    // in the T3 ordinary-damage pass: a death-trace found the old value literally
    // one-shotting a T3 arrival player (320-342 raw damage against ~291 maxHP) as a
    // PLAIN ordinary hit. 145 keeps it the tier's heaviest sustained hitter while
    // Heat remains the reason a long fight becomes dangerous.
    stats: { hp: 2000, attack: 145, plating: 4, damageReduction: 0, speed: 22, attackRange: 15, attackCooldown: 3000, pullRange: 150 },
    behavior: 'melee', attackStyle: 'fire', biome: 'volcanic',
    rewards: { essence: 55, essenceType: 'red', level: 3, biomeXp: 330 },
    ai: { wanderRadius: 120, leashRange: 470, idleMinMs: 3000, idleMaxMs: 8500 },
    monsterAbilities: [{
      id: 'molten-guard', name: 'Molten Guard', castMs: 1000,
      cooldownMs: 14000, initialCooldownMs: 6000, target: 'self', fx: 'volcanic-guard',
      actions: [{
        type: 'shield', effectId: 'magma-molten-guard', shieldPct: 0.14, durationMs: 4500,
      }],
    }],
  }],

  ['ash-slinger', {
    id: 'ash-slinger', name: 'Ash Salamander', color: 0xff4422,
    // Salamander line T3: STATIONARY ranged pressure that fires from the background
    // while the swarm closes. Does not kite. No personal ramp.
    stats: { hp: 1330, attack: 105, plating: 2, damageReduction: 0, speed: 44, attackRange: 180, attackCooldown: 2000, pullRange: 230 },
    behavior: 'ranged', attackStyle: 'fire', biome: 'volcanic',
    rewards: { essence: 27, essenceType: 'red', level: 2, biomeXp: 165 },
    // Fires from the background and does NOT kite (locked).
    staticSentry: true,
    ai: { wanderRadius: 220, leashRange: 600, idleMinMs: 1200, idleMaxMs: 4000 },
  }],

  // T4

  ['ember-skink', {
    id: 'ember-skink', name: 'Ember Skink', color: 0xff6622,
    // Evolved swarm filler: the T3 Scuttler plus a light Burn on hit. No ramp.
    stats: { hp: 1350, attack: 90, plating: 2, damageReduction: 0, speed: 70, attackRange: 12, attackCooldown: 1300, pullRange: 230 },
    behavior: 'melee', attackStyle: 'fire', biome: 'volcanic',
    rewards: { essence: 47, essenceType: 'red', level: 3, biomeXp: 280 },
    // Loose cohesion/separation so the high-density biome READS as a swarm.
    // WARNING: no alpha, no followers, no call-allies (locked) - density is the
    // swarm, monster coordination is not.
    swarm: { cohesion: 0.1, separation: 44 },
    ai: { wanderRadius: 250, leashRange: 660, idleMinMs: 1000, idleMaxMs: 3500 },
    dotEffect: { debuffId: 'ember-burn', label: 'Ember Burn', damagePerStack: 13, maxStacks: 4, tickIntervalMs: 1000, durationMs: 2000 },
  }],

  ['infernal-direhound', {
    id: 'infernal-direhound', name: 'Infernal Direhound', color: 0xff8800,
    // Evolved catcher: high speed + charge on engagement. No ramp.
    stats: { hp: 1750, attack: 110, plating: 4, damageReduction: 0, speed: 72, attackRange: 12, attackCooldown: 1400, pullRange: 280 },
    behavior: 'melee', attackStyle: 'fire', biome: 'volcanic',
    rewards: { essence: 68, essenceType: 'red', level: 3, biomeXp: 410 },
    ai: { wanderRadius: 280, leashRange: 720, idleMinMs: 700, idleMaxMs: 3000 },
    swarm: { cohesion: 0.08, separation: 56 },
    chargeOnAggro: { speedMult: 2.5, durationMs: 900 },
  }],

  ['obsidian-tortoise', {
    id: 'obsidian-tortoise', name: 'Obsidian Tortoise', color: 0xcc2200,
    // Evolved anchor. Its escalation over the Magma Tortoise is a predictable,
    // casted Molten Eruption on its own cooldown — not an invisible ramp or cadence.
    // Plating 8 rewards pierce. Slow alone, brutal inside the swarm.
    // avg/attack (3·100+220)/4 = 130 → ×(1000/3000) = 43 (pre-ramp).
    // Attack was authored 262 -- 2.6x the design comment's own intended base of
    // 100 (item/monster diagnostic, 2026-08-24). A death-trace found it one-shot
    // territory (105% of a T4 arrival player's maxHP per the analytical Walk
    // table) and the cadence-finisher comment below ("// 220") only makes sense
    // at attack=100 (100*2.2=220) -- restoring the documented value.
    stats: { hp: 2244, attack: 100, plating: 8, damageReduction: 0, speed: 20, attackRange: 15, attackCooldown: 3000, pullRange: 155 },
    behavior: 'melee', attackStyle: 'fire', biome: 'volcanic',
    rewards: { essence: 140, essenceType: 'red', level: 4, biomeXp: 840 },
    ai: { wanderRadius: 110, leashRange: 460, idleMinMs: 3500, idleMaxMs: 9500 },
    monsterAbilities: [{
      id: 'molten-eruption', name: 'Molten Eruption', castMs: 1100,
      cooldownMs: 12000, initialCooldownMs: 5500, target: 'player', fx: 'volcanic-eruption',
      actions: [{ type: 'hit', multiplier: 2.2 }],
    }],
  }],

  ['ashspitter-salamander', {
    id: 'ashspitter-salamander', name: 'Ashspitter Salamander', color: 0xff4422,
    // Evolved ranged Burn pressure: stationary (not a kiter), stronger and more
    // persistent Burn than the Ash Salamander. Ignoring it lets the fire stack.
    stats: { hp: 1550, attack: 110, plating: 2, damageReduction: 0, speed: 46, attackRange: 190, attackCooldown: 1900, pullRange: 250 },
    behavior: 'ranged', attackStyle: 'fire', biome: 'volcanic',
    rewards: { essence: 52, essenceType: 'red', level: 3, biomeXp: 310 },
    // Fires from the background and does NOT kite (locked).
    staticSentry: true,
    ai: { wanderRadius: 230, leashRange: 630, idleMinMs: 1200, idleMaxMs: 4000 },
    dotEffect: { debuffId: 'ashspitter-burn', label: 'Ash Burn', damagePerStack: 16, maxStacks: 5, tickIntervalMs: 1000, durationMs: 2500 },
  }],

  ['magma-salamander', {
    id: 'magma-salamander', name: 'Magma Salamander', color: 0xaa1100,
    // Elite DEFENSIVE-WINDOW enemy. OBSIDIAN SHELL is a casted molten barrier,
    // rewarding BURST over DoT/chip. The exam is to break through its shell windows
    // BEFORE the node's global Heat turns dangerous — the shell is what makes the
    // fight run long, Heat is the cost.
    stats: { hp: 2904, attack: 150, plating: 6, damageReduction: 0.06, speed: 22, attackRange: 15, attackCooldown: 2600, pullRange: 160 },
    behavior: 'melee', attackStyle: 'fire', biome: 'volcanic', elite: true,
    rewards: { essence: 190, essenceType: 'red', level: 4, biomeXp: 1140 },
    ai: { wanderRadius: 120, leashRange: 470, idleMinMs: 4000, idleMaxMs: 11000 },
    monsterAbilities: [{
      id: 'obsidian-shell', name: 'Obsidian Shell', castMs: 1200,
      cooldownMs: 14000, initialCooldownMs: 6000, target: 'self', fx: 'volcanic-shell',
      actions: [{
        type: 'shield', effectId: 'magma-obsidian-shell', shieldPct: 0.28, durationMs: 5000,
      }],
    }],
  }],

] satisfies [string, MonsterDefinition][];
