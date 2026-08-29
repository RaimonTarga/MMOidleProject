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
//   scalesWithAmbientRamp  — Tundra apex only: damage scales with the node chill
// Existing/reused: chargeOnAggro, behavior: 'ranged', dotEffect, evasion, slowEffect.
// Costs/essence/biomeXp = placeholder (economy deferred).
// ─────────────────────────────────────────────────────────────────────────

export const tundraMonsterEntries = [

  // ══════════════════ TUNDRA — COMBAT TEMPO SUPPRESSION under GLOBAL CHILL ══════════════════
  // Volcano accelerates combat; Tundra SUPPRESSES it. Low-to-mid density, elite-
  // focused, calm deliberate fights with fewer simultaneous enemies.
  //
  // The suppression is owned by ONE thing: the node-wide ambient CHILL ramp
  // (`tundraChill` in shared/src/world/nodeFeatures.ts), which takes movement speed
  // and attack speed the longer combat runs, capped, shed after combat.
  //
  // ⚠ NO monster here reapplies a generic per-hit slow, and NONE carries `rampDebuff`
  // (T1–T4 rework, locked). Every mob slowing you on every hit made the roster one
  // monster and stacked an unauthored root on top of the environment's own slow.
  // The environment owns baseline slow; each mob exploits that slowing clock
  // DIFFERENTLY (defensive windows, roots, telegraphed slams).
  ['frost-lurker', {
    id: 'frost-lurker', name: 'Frost Lurker', color: 0xaaddff,
    // Tundra wolverine (role-name kept). The biome's straightforward melee baseline:
    // slow-to-moderate movement, meaningful direct hits, and NOTHING else — its giant
    // per-hit slow is gone. The synergy does the work: ambient Chill is what makes an
    // otherwise plain enemy hard to kite.
    stats: { hp: 950, attack: 259, plating: 0, damageReduction: 0.10, speed: 26, attackRange: 12, attackCooldown: 2600, pullRange: 170 },
    behavior: 'melee', attackStyle: 'frost', biome: 'tundra',
    rewards: { essence: 29, essenceType: 'blue', level: 2, biomeXp: 175 },
    ai: { wanderRadius: 150, leashRange: 510, idleMinMs: 2500, idleMaxMs: 7000 },
  }],

  ['glacier-bear', {
    id: 'glacier-bear', name: 'Glacier Bear', color: 0x5599cc,
    // DEFENSIVE-WINDOW elite. ICE ARMOR (`enemyShield`) is the whole identity: chip
    // wastes itself against the shell, a burst POPS it and shatters for a damage
    // window. No per-hit slows, no ramping debuff (both removed, locked).
    // Attack cut 415 -> 300 (T1-T4 numerical balance pass, 2026-08-24): unlike this
    // tier's other flagged elites (Petrifying Gaze's root, Cave Troll's lockdown),
    // this monster's danger comes from a plain, untelegraphed ORDINARY hit with no
    // counterplay tool to answer it — mob-llm-packet-t3 read it at 114% of the
    // arrival player's maxHP (a literal one-shot) and 2.48x the tier's average
    // spike. 300 lands it in line with this tier's other flagged-but-accepted
    // spikes (Mountain Colossus 72%, Cavern Troll 88%) rather than over 100%.
    stats: { hp: 1500, attack: 300, plating: 0, damageReduction: 0.14, speed: 22, attackRange: 15, attackCooldown: 3200, pullRange: 175 },
    behavior: 'melee', attackStyle: 'frost', biome: 'tundra',
    rewards: { essence: 65, essenceType: 'blue', level: 3, biomeXp: 390 },
    ai: { wanderRadius: 140, leashRange: 500, idleMinMs: 3000, idleMaxMs: 8500 },
    // ECOLOGY: ICE ARMOR — periodic frost barrier; chip wastes against it, a BURST
    // pops it and SHATTERS (bonus self-dmg + a freezing shockwave that briefly stuns
    // nearby enemies). The signature Tundra "shatter window": time your burst.
    enemyShield: {
      shieldPct: 0.20, intervalMs: 11000, durationMs: 6000,
      // SHATTER PAYOFF: breaking the shell cracks it for bonus self-damage AND opens
      // a VULNERABILITY WINDOW. The old "freezes nearby enemies" rider is gone
      // (locked): a crowd-control upside paid out most in exactly the crowded fights
      // Tundra is not supposed to have. Chip wastes itself; a burst pops it and wins
      // the window. Placeholder numbers.
      shatter: { selfDamagePct: 0.12, vulnerability: { damageTakenPct: 0.30, durationMs: 4000 } },
    },
  }],

  ['rime-caster', {
    id: 'rime-caster', name: 'Rime Caster', color: 0xccffff,
    // Young yeti (role-name kept; grows into the T4 Hoarfrost Yeti).
    // RANGED CONTROL CASTER — the biome's root specialist. Normal frost projectiles
    // carry no slow (removed, locked); its weapon is FROSTBIND, gated on the node's
    // Chill (see the chargedAttack authored in the behavior pass).
    stats: { hp: 880, attack: 297, plating: 0, damageReduction: 0.08, speed: 30, attackRange: 200, attackCooldown: 2800, pullRange: 230 },
    // Relatively STATIONARY ranged caster, not a kiter (locked).
    behavior: 'ranged', attackStyle: 'frost', biome: 'tundra',
    staticSentry: true,
    rewards: { essence: 45, essenceType: 'blue', level: 2, biomeXp: 270 },
    // FROSTBIND - the caster's real weapon, and the biome's cleanest fusion of
    // environment and roster: it only comes ONLINE once the room has already
    // chilled you (a simple stack threshold, deliberately not a formula). Below
    // the threshold it just fires ordinary frost projectiles.
    chargedAttack: {
      name: 'Frostbind', castMs: 1400, cooldownMs: 10000, initialCooldownMs: 4000,
      multiplier: 1.2, fx: 'power-shot',
      rootMs: 1500, requiresAmbientStacks: 3,
    },
    ai: { wanderRadius: 200, leashRange: 600, idleMinMs: 1500, idleMaxMs: 4500 },
  }],

  // T4
  ['rime-tusk-mastodon', {
    id: 'rime-tusk-mastodon', name: 'Rime-Tusk Mastodon', color: 0xaaddff,
    // TELEGRAPHED HEAVY HITTER: predictable CADENCE Frost/Tusk Slam every 4th attack
    // (240, trips the cap). No giant slow rider — ambient Chill already makes walking
    // out of the telegraph hard enough. Heavy ICE PLATING (12) rewards a brittle weapon.
    stats: { hp: 924, attack: 421, plating: 12, damageReduction: 0, speed: 18, attackRange: 15, attackCooldown: 3500, pullRange: 165 },
    behavior: 'melee', attackStyle: 'frost', biome: 'tundra',
    rewards: { essence: 110, essenceType: 'blue', level: 4, biomeXp: 660 },
    ai: { wanderRadius: 140, leashRange: 490, idleMinMs: 3500, idleMaxMs: 9500 },
    chargeOnAggro: { speedMult: 2.3, durationMs: 1200 },
    cadenceFinisher: { everyNAttacks: 4, multiplier: 2.0 },   // 240
  }],

  ['glacial-direbear', {
    id: 'glacial-direbear', name: 'Glacial Dire-Bear', color: 0x5599cc,
    // Evolved defensive-window elite: bigger Ice Armor, bigger Shatter payoff.
    // No ramping per-hit slows (removed, locked).
    stats: { hp: 1221, attack: 369, plating: 0, damageReduction: 0.14, speed: 18, attackRange: 15, attackCooldown: 3200, pullRange: 175 },
    behavior: 'melee', attackStyle: 'frost', biome: 'tundra',
    rewards: { essence: 150, essenceType: 'blue', level: 4, biomeXp: 900 },
    ai: { wanderRadius: 130, leashRange: 490, idleMinMs: 3500, idleMaxMs: 9000 },
    // ECOLOGY: ICE ARMOR + SHATTER (T4 successor of glacier-bear). Bigger shell, bigger
    // crack + wider freezing shockwave. Burst the shell to shatter it.
    enemyShield: {
      shieldPct: 0.22, intervalMs: 12000, durationMs: 6000,
      // Bigger shell, STRONGER shatter reward and a longer window than the Glacier
      // Bear - the T4 escalation is the payoff, not another debuff.
      shatter: { selfDamagePct: 0.14, vulnerability: { damageTakenPct: 0.35, durationMs: 5000 } },
    },
  }],

  ['hoarfrost-yeti', {
    id: 'hoarfrost-yeti', name: 'Hoarfrost Yeti', color: 0xccffff,
    // Evolved ranged Chill-control caster: the Rime Caster's Frostbind grown into a
    // stronger/longer Deep Freeze at high Chill. NO generic slow stacks on every
    // projectile (removed, locked).
    stats: { hp: 693, attack: 302, plating: 0, damageReduction: 0.08, speed: 36, attackRange: 220, attackCooldown: 2900, pullRange: 260 },
    behavior: 'ranged', attackStyle: 'frost', biome: 'tundra',
    staticSentry: true,
    rewards: { essence: 62, essenceType: 'blue', level: 3, biomeXp: 370 },
    // DEEP FREEZE - the evolved Frostbind: a longer root, and it comes online at a
    // LOWER chill threshold, so the late-tier caster starts landing it sooner.
    chargedAttack: {
      name: 'Deep Freeze', castMs: 1500, cooldownMs: 9000, initialCooldownMs: 4000,
      multiplier: 1.2, fx: 'power-shot',
      rootMs: 2200, requiresAmbientStacks: 2,
    },
    ai: { wanderRadius: 210, leashRange: 620, idleMinMs: 1500, idleMaxMs: 4500 },
  }],

  ['permafrost-behemoth', {
    id: 'permafrost-behemoth', name: 'Permafrost Behemoth', color: 0x4477aa,
    // Colossal musk ox sheathed in glacier ice (the plating made visible).
    // Apex, deliberately SIMPLE: enormous HP, heavy plating (20), very slow, and one
    // huge telegraphed GLACIAL SLAM every 9s (300). The enemy soft-cap is REMOVED
    // (locked) — extreme plating is already enough defensive identity, and stacking a
    // second weapon-matchup layer on the apex was the kitchen sink.
    // Base 100 ≈ H_med (survivable between slams).
    stats: { hp: 1914, attack: 351, plating: 20, damageReduction: 0.12, speed: 12, attackRange: 15, attackCooldown: 4000, pullRange: 140 },
    behavior: 'melee', attackStyle: 'frost', biome: 'tundra', elite: true,
    rewards: { essence: 260, essenceType: 'blue', level: 4, biomeXp: 1560 },
    ai: { wanderRadius: 70, leashRange: 380, idleMinMs: 6000, idleMaxMs: 15000 },
    chargeOnAggro: { speedMult: 2.0, durationMs: 1400 },
    // GLACIAL SLAM - one huge TELEGRAPHED hit rather than an invisible cooldown
    // spike, so the apex's whole offense is a thing the player can see and answer.
    chargedAttack: {
      name: 'Glacial Slam', castMs: 2200, cooldownMs: 9000, initialCooldownMs: 6000,
      multiplier: 3.0, fx: 'strong-kick',
      aoe: { radius: 150 },
    },
    // ECOLOGY: the apex FEEDS ON THE COLD. Every stack of the node's ambient chill
    // (which is already taking your movement) also makes this thing hit harder, so
    // the biome's plant-and-outlast answer is exactly wrong against its capstone:
    // arrive cold and the 9s slam lands on a target that cannot walk out of it.
    // The one chill-scaling mob in the roster (locked decision 5).
    // `chargedOnly`: ONLY the Glacial Slam scales with the chill (locked). Its
    // ordinary swings stay flat - scaling everything made this a difficulty knob
    // instead of a tell. Arrive cold and the slam lands on someone who cannot
    // walk out of it, which is exactly why plant-and-outlast is wrong here.
    scalesWithAmbientRamp: { perStackPct: 0.06, maxPct: 0.36, chargedOnly: true },
  }],

  
] satisfies [string, MonsterDefinition][];