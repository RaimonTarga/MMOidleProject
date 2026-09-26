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
  //
  // ══ MIXED PACKS (ecology polish, 2026-09-11) — OVERTURNS the earlier locked
  // "density is the swarm, monster coordination is not" call ══
  //
  // That call left Volcano as a uniform field of independent mobs at density 36.
  // A high mob COUNT is not the same read as "several weak creatures plus a couple
  // of dangerous ones came at me together", and Volcano was supposed to be the
  // second one. Plains keeps the straightforward volume swarm; Volcano is now
  // AUTHORED MIXED PACKS.
  //
  // The shape, per tier:
  //   • the heavy anchor and the fast catcher are pack ALPHAS (plus the T4 elite),
  //   • the weak filler and the stationary gunner are FOLLOWERS — and both stay in
  //     the spawn pool, so a node is packs PLUS scattered bodies, not only formations,
  //   • `followerVariants` rolls ONE add-on group per spawn, so a tortoise herd is
  //     not the same five monsters every time.
  //
  // ⚠ DENSITY IS UNCHANGED (36). `ensurePopulation` re-reads the node count each
  // iteration, so packs REPLACE loose spawns rather than adding to them — the same
  // bodies, arriving clumped. Do not "fix" a sparse-looking node by raising density
  // on top of the packs.
  //
  // ⚠ KNOWN CONSEQUENCE, measured over 60 populations and left for the bot/balance
  // pass to judge: because a 5-body pack eats 5 density slots, the per-node MIX shifts
  // toward fodder. T3 anchors/catchers go 9.0 → ~3.0 each and node HP falls ~8%; T4
  // goes 7.2 → ~2.3 each (the elite included) and node HP falls ~17%. That is
  // arithmetic — filling N slots with packs of size K caps anchors at N/K however the
  // roles are assigned — so it is NOT fixable by moving the elite out of the alpha
  // role (checked: −17% → −15%) nor by pulling the fodder out of the pool. Total node
  // HP and essence are down; SIMULTANEOUS engagement is sharply up, which is the axis
  // the tier ladder actually measures.
  //
  // ⚠ THE FODDER STAYS SIMPLE (locked). Scuttlers/Skinks get no abilities and no
  // telegraphs: with six mobs on screen, the player has to be able to tell which one
  // demands attention, and that is the tortoise/salamander casting — not the swarm.
  ['ember-scuttler', {
    id: 'ember-scuttler', name: 'Ember Scuttler', color: 0xff6622,
    // Young fire skink (role-name kept; grows into the T4 Ember Skink).
    // Basic swarm filler: weak, fast, numerous. No ability — deliberately.
    // Attack cut 148 -> 70 (item/monster diagnostic, 2026-08-24), then 70 -> 55
    // in the T3 ordinary-damage pass: a death-trace found the old value hitting
    // for 110-122 (up to 42% of a T3 arrival player's maxHP) as an ordinary hit —
    // directly contradicting its own "weak... filler" identity above.
    // V1q: pack fodder must die early enough to relieve pressure. V1p's four
    // prepared kits died before a kill; approved HP 1220 -> 650, attack 55 -> 45.
    // 2026-09-26 volcanic T3 pass: HP 650 -> 500, attack 45 -> 30. A hound pull still
    // brought ~4 scuttlers, ~175 raw DPS, killing full-HP T3 kits in 3-5 s.
    stats: { hp: 500, attack: 30, plating: 2, damageReduction: 0, speed: 64, attackRange: 12, attackCooldown: 1600, pullRange: 210 },
    behavior: 'melee', attackStyle: 'fire', biome: 'volcanic',
    rewards: { essence: 25, essenceType: 'red', level: 2, biomeXp: 150 },
    // Loose cohesion/separation so the high-density biome READS as a swarm.
    swarm: { cohesion: 0.1, separation: 44 },
    // THE PACK BODY. Rolls loose from the pool too, so a node is packs PLUS
    // scattered scuttlers rather than only formations. The pack link only matters
    // while it is actually in a pack — a loose scuttler has no `inPack` link and
    // is never alerted by one.
    pack: { role: 'follower' },
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
    // 2026-09-26 volcanic T3 pass: 80 -> 55, and one follower instead of two.
    stats: { hp: 1440, attack: 55, plating: 3, damageReduction: 0, speed: 70, attackRange: 12, attackCooldown: 1300, pullRange: 260 },
    behavior: 'melee', attackStyle: 'bite-fire', biome: 'volcanic',
    rewards: { essence: 29, essenceType: 'red', level: 2, biomeXp: 175 },
    ai: { wanderRadius: 260, leashRange: 680, idleMinMs: 700, idleMaxMs: 3000 },
    swarm: { cohesion: 0.08, separation: 56 },
    chargeOnAggro: { speedMult: 2.5, durationMs: 900 },
    // PACK ALPHA — the CATCHER pack: a fast hound that brings bodies with it and
    // charges the lot of them onto whoever it engages. The small pack (3 total)
    // is the light half of the biome's mixed-pack read; the tortoise herd below is
    // the heavy half.
    pack: {
      role: 'alpha', followRadius: 140,
      followers: [{ typeId: 'ember-scuttler', count: 1 }],
      followerVariants: [
        [{ typeId: 'ember-scuttler', count: 1 }],   // 3: a straight rush
        [{ typeId: 'ash-slinger', count: 1 }],      // 3: rush + planted gunner
      ],
    },
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
    // 2026-09-26 volcanic T3 pass: 116 -> 90, and a smaller herd (2 scuttlers, not 3).
    stats: { hp: 3000, attack: 90, plating: 4, damageReduction: 0, speed: 22, attackRange: 15, attackCooldown: 3000, pullRange: 150 },
    behavior: 'melee', attackStyle: 'fire', biome: 'volcanic',
    rewards: { essence: 55, essenceType: 'red', level: 3, biomeXp: 330 },
    ai: { wanderRadius: 120, leashRange: 470, idleMinMs: 3000, idleMaxMs: 8500 },
    // PACK ALPHA — the ANCHOR herd, the biome's headline encounter: a slow armored
    // shell the scuttlers swarm around. It is also the pack whose alpha is worth
    // killing LAST rather than first, which is the read the mixed pack exists to
    // create. No `swarm` on the tortoise itself (locked): the anchor holds ground,
    // the fodder flocks.
    pack: {
      role: 'alpha', followRadius: 140,
      followers: [{ typeId: 'ember-scuttler', count: 2 }],
      followerVariants: [
        [{ typeId: 'ember-scuttler', count: 1 }],   // 4: pure swarm
        [{ typeId: 'ash-slinger', count: 1 }],      // 4: swarm + gunner
      ],
    },
    monsterAbilities: [{
      id: 'molten-guard', name: 'Molten Guard', castMs: 1000,
      cooldownMs: 14000, initialCooldownMs: 6000, target: 'self', fx: 'volcanic-guard',
      actions: [{
        // Coupled to the HP adoption: shieldPct x maxHp, so the barrier is held at its
        // pre-adoption ABSOLUTE budget of 0.14 x 2000 = 280, not re-inflated by the new pool.
        type: 'shield', effectId: 'magma-molten-guard', shieldPct: 0.14 * 2000 / 3000, durationMs: 4500,
      }],
    }],
  }],

  ['ash-slinger', {
    id: 'ash-slinger', name: 'Ash Salamander', color: 0xff4422,
    // Salamander line T3: STATIONARY ranged pressure that fires from the background
    // while the swarm closes. Does not kite. No personal ramp.
    // 2026-09-26 volcanic T3 pass: attack 70 -> 50; it finished most heat-late deaths.
    stats: { hp: 1330, attack: 50, plating: 2, damageReduction: 0, speed: 44, attackRange: 180, attackCooldown: 2000, pullRange: 230 },
    behavior: 'ranged', attackStyle: 'fire-spit', biome: 'volcanic',
    rewards: { essence: 27, essenceType: 'red', level: 2, biomeXp: 165 },
    // Fires from the background and does NOT kite (locked).
    staticSentry: true,
    // THE PACK GUNNER. As a follower it plants on the pack's ring and shoots past
    // the bodies — which is exactly what `staticSentry` already does, so the pack
    // gets a backline for free. Still rolls loose from the pool as a lone sentry.
    pack: { role: 'follower' },
    ai: { wanderRadius: 220, leashRange: 600, idleMinMs: 1200, idleMaxMs: 4000 },
  }],

  // T4

  ['ember-skink', {
    id: 'ember-skink', name: 'Ember Skink', color: 0xff6622,
    // Evolved swarm filler: the T3 Scuttler plus a light Burn on hit. No ramp.
    // Apply the same approximate fodder correction to T4 (1350 -> 720 HP,
    // 90 -> 75 attack). Volcano area study: attack 75 -> 60 and Burn 13 -> 8
    // reduce coordinated filler pressure while preserving pack size and cadence.
    stats: { hp: 720, attack: 60, plating: 2, damageReduction: 0, speed: 70, attackRange: 12, attackCooldown: 1300, pullRange: 230 },
    behavior: 'melee', attackStyle: 'fire', biome: 'volcanic',
    rewards: { essence: 47, essenceType: 'red', level: 3, biomeXp: 280 },
    // Loose cohesion/separation so the high-density biome READS as a swarm.
    swarm: { cohesion: 0.1, separation: 44 },
    // THE T4 PACK BODY (successor to ember-scuttler's role). Still deliberately
    // ability-free apart from its light Burn: the fodder must stay visually quiet.
    pack: { role: 'follower' },
    ai: { wanderRadius: 250, leashRange: 660, idleMinMs: 1000, idleMaxMs: 3500 },
    dotEffect: { debuffId: 'ember-burn', label: 'Ember Burn', damagePerStack: 8, maxStacks: 4, tickIntervalMs: 1000, durationMs: 2000 },
  }],

  ['infernal-direhound', {
    id: 'infernal-direhound', name: 'Infernal Direhound', color: 0xff8800,
    // Evolved catcher: high speed + charge on engagement. No ramp.
    stats: { hp: 1750, attack: 110, plating: 4, damageReduction: 0, speed: 72, attackRange: 12, attackCooldown: 1400, pullRange: 280 },
    behavior: 'melee', attackStyle: 'bite-fire', biome: 'volcanic',
    rewards: { essence: 68, essenceType: 'red', level: 3, biomeXp: 410 },
    ai: { wanderRadius: 280, leashRange: 720, idleMinMs: 700, idleMaxMs: 3000 },
    swarm: { cohesion: 0.08, separation: 56 },
    chargeOnAggro: { speedMult: 2.5, durationMs: 900 },
    // PACK ALPHA — the evolved catcher pack. Same shape as the Cinder Hound's,
    // one tier up; the deepening is the tier, not a bigger formation.
    pack: {
      role: 'alpha', followRadius: 140,
      followers: [{ typeId: 'ember-skink', count: 2 }],
      followerVariants: [
        [{ typeId: 'ember-skink', count: 2 }],
        [{ typeId: 'ember-skink', count: 1 }],
        [{ typeId: 'ashspitter-salamander', count: 1 }],
      ],
    },
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
    stats: { hp: 4488, attack: 100, plating: 8, damageReduction: 0, speed: 20, attackRange: 15, attackCooldown: 3000, pullRange: 155 },
    behavior: 'melee', attackStyle: 'fire', biome: 'volcanic',
    rewards: { essence: 140, essenceType: 'red', level: 4, biomeXp: 840 },
    ai: { wanderRadius: 110, leashRange: 460, idleMinMs: 3500, idleMaxMs: 9500 },
    // PACK ALPHA — the evolved anchor herd. Its Molten Eruption stays the one
    // telegraphed beat inside a pack of otherwise-quiet bodies.
    pack: {
      role: 'alpha', followRadius: 140,
      followers: [{ typeId: 'ember-skink', count: 3 }],
      followerVariants: [
        [{ typeId: 'ember-skink', count: 2 }],
        [{ typeId: 'ashspitter-salamander', count: 1 }],
        [{ typeId: 'ashspitter-salamander', count: 1 }, { typeId: 'ember-skink', count: 1 }],
      ],
    },
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
    stats: { hp: 1550, attack: 95, plating: 2, damageReduction: 0, speed: 46, attackRange: 190, attackCooldown: 1900, pullRange: 250 },
    behavior: 'ranged', attackStyle: 'fire-spit', biome: 'volcanic',
    rewards: { essence: 52, essenceType: 'red', level: 3, biomeXp: 310 },
    // Fires from the background and does NOT kite (locked).
    staticSentry: true,
    // THE T4 PACK GUNNER. Same role as the Ash Salamander a tier below.
    pack: { role: 'follower' },
    ai: { wanderRadius: 230, leashRange: 630, idleMinMs: 1200, idleMaxMs: 4000 },
    dotEffect: { debuffId: 'ashspitter-burn', label: 'Ash Burn', damagePerStack: 12, maxStacks: 5, tickIntervalMs: 1000, durationMs: 2500 },
  }],

  ['magma-salamander', {
    id: 'magma-salamander', name: 'Magma Salamander', color: 0xaa1100,
    // Elite DEFENSIVE-WINDOW enemy. OBSIDIAN SHELL is a casted molten barrier,
    // rewarding BURST over DoT/chip. The exam is to break through its shell windows
    // BEFORE the node's global Heat turns dangerous — the shell is what makes the
    // fight run long, Heat is the cost.
    stats: { hp: 5808, attack: 150, plating: 6, damageReduction: 0.06, speed: 22, attackRange: 15, attackCooldown: 2600, pullRange: 160 },
    behavior: 'melee', attackStyle: 'fire', biome: 'volcanic', elite: true,
    rewards: { essence: 190, essenceType: 'red', level: 4, biomeXp: 1140 },
    ai: { wanderRadius: 120, leashRange: 470, idleMinMs: 4000, idleMaxMs: 11000 },
    // PACK ALPHA — the ELITE anchor, and deliberately the SMALLEST pack in the
    // biome (4 total, vs the tortoise herd's 5-6). The elite is meant to be the
    // thing you notice and answer; burying it in bodies would hide the one fight
    // in the biome that is genuinely about its own mechanic. The entourage exists
    // so the yellow outline reads as "that one, in the middle of those" rather
    // than as a lone statue in an otherwise packed node.
    pack: {
      role: 'alpha', followRadius: 140,
      followers: [{ typeId: 'ember-skink', count: 2 }],
      followerVariants: [
        [{ typeId: 'ember-skink', count: 1 }],
        [{ typeId: 'ashspitter-salamander', count: 1 }],
      ],
    },
    monsterAbilities: [{
      id: 'obsidian-shell', name: 'Obsidian Shell', castMs: 1200,
      cooldownMs: 14000, initialCooldownMs: 6000, target: 'self', fx: 'volcanic-shell',
      actions: [{
        // Coupled to the HP adoption: absolute budget held at 0.28 x 2904 = 813.12.
        type: 'shield', effectId: 'magma-obsidian-shell', shieldPct: 0.14, durationMs: 5000,
      }],
    }],
  }],

] satisfies [string, MonsterDefinition][];
