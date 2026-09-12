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
  //
  // ══ IDENTITY PASS (ecology polish, 2026-09-11) ══
  //
  // Audit outcome — five of seven normal mobs already had a signature worth keeping
  // and were left alone; the point was not to hit a mechanics quota:
  //
  //   PRESERVED  Glacier Bear / Glacial Dire-Bear  Ice Armor → Shatter window
  //   PRESERVED  Rime Caster                       Frostbind (Chill-gated root)
  //   PRESERVED  Permafrost Behemoth               Glacial Slam + Chill scaling
  //
  //   NEW        Frost Lurker        RIME POUNCE — the line had NOTHING
  //   DEEPENED   Rime-Tusk Mastodon  the same commitment, now a committed CIRCLE
  //   DEEPENED   Hoarfrost Yeti      Deep Freeze planted as a telegraph rather
  //                                  than a cast that follows you
  //
  // ⚠ CONTROL BUDGET. The roster still has exactly ONE root (the caster line), and
  // this pass made the T4 version MORE avoidable rather than less. Nothing added here
  // stuns and nothing added here slows: the ambient Chill already owns the player's
  // movement number, and two Tundra mobs able to chain hard control at once is the
  // failure mode the biome is explicitly written against. Every new beat is a visible
  // wind-up whose answer is a step in some direction.
  ['frost-lurker', {
    id: 'frost-lurker', name: 'Frost Lurker', color: 0xaaddff,
    // Tundra wolverine (role-name kept). The biome's straightforward melee baseline:
    // slow-to-moderate movement, meaningful direct hits, and NOTHING else — its giant
    // per-hit slow is gone. The synergy does the work: ambient Chill is what makes an
    // otherwise plain enemy hard to kite.
    stats: { hp: 950, attack: 160, plating: 0, damageReduction: 0.10, speed: 26, attackRange: 12, attackCooldown: 2600, pullRange: 170 },
    behavior: 'melee', attackStyle: 'frost', biome: 'tundra',
    rewards: { essence: 29, essenceType: 'blue', level: 2, biomeXp: 175 },
    ai: { wanderRadius: 150, leashRange: 510, idleMinMs: 2500, idleMaxMs: 7000 },
    // RIME POUNCE — the one thing you remember this creature doing, and the answer
    // to the question its own stat line asked and never answered: how does a
    // speed-26 ambush predator ever reach anybody?
    //
    // It does not walk. Once per engagement it plants, telegraphs a short wind-up,
    // and bursts out of the snow at ~156px/s into an amplified bite. The rest of the
    // fight is the plain slow wolverine it already was.
    //
    // WHY THIS AND NOT A DEBUFF: the biome's slow is the room's job, not the
    // roster's, and a wolverine that applies a status is the generic Tundra mob this
    // pass exists to stop authoring. A committed lunge is spatial — run and it
    // whiffs, stand still and it lands — which is the counterplay shape the biome
    // wants. It also fuses with the environment for free and in the right direction:
    // at full Chill the player is down near 84px/s, so the colder the room has made
    // you, the more surely the pounce arrives. Arriving cold is the mistake, exactly
    // as it is against the Behemoth's slam.
    //
    // `damageMultiplier` is deliberately modest (1.35 ≈ 216 vs its ordinary 160) and
    // it fires ONCE per aggro session, so it barely moves sustained DPS — the tier
    // ladder in docs/tier-balance-current-state.md is measured off sustained pressure
    // and base stats are untouched here on purpose.
    engageSequence: {
      kind: 'cast-charge-strike', name: 'Rime Pounce', castMs: 900,
      speedMult: 6, maxChargeMs: 1800, damageMultiplier: 1.35, fx: 'rime-pounce',
    },
  }],

  ['glacier-bear', {
    id: 'glacier-bear', name: 'Glacier Bear', color: 0x5599cc,
    // DEFENSIVE-WINDOW elite. ICE ARMOR (`enemyShield`) is the whole identity: chip
    // wastes itself against the shell, a burst POPS it and shatters for a damage
    // window. No per-hit slows, no ramping debuff (both removed, locked).
    // Attack cut 415 -> 300 (T1-T4 numerical balance pass, 2026-08-24), then
    // 300 -> 185 in the T3 ordinary-damage pass: unlike this tier's other flagged
    // elites (Petrifying Gaze's root, Cave Troll's lockdown), this monster's danger
    // comes from its defensive window rather than a plain, untelegraphed ordinary
    // hit. The lower ordinary swing leaves Ice Armor + Shatter as the real lesson.
    stats: { hp: 1500, attack: 185, plating: 0, damageReduction: 0.14, speed: 22, attackRange: 15, attackCooldown: 3200, pullRange: 175 },
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
    stats: { hp: 880, attack: 170, plating: 0, damageReduction: 0.08, speed: 30, attackRange: 200, attackCooldown: 2800, pullRange: 230 },
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
    // TELEGRAPHED HEAVY HITTER: a named Frost/Tusk Impact now replaces the invisible cadence beat
    // (~368 at the retuned base attack). No giant slow rider — ambient Chill already makes walking
    // out of the telegraph hard enough. Heavy ICE PLATING (12) rewards a brittle weapon.
    //
    // T4 OF THE FROST LURKER LINE (same colour slot, same role: the biome's melee
    // baseline). It inherits the Lurker's COMMITMENT vocabulary — commit to a spot,
    // then one heavy readable impact — and deepens it in the three ways the line has
    // room for, all on the SAME attack rather than by bolting on new spells:
    //   • bigger  — the impact is a planted CIRCLE, not a shot that follows you
    //   • harder  — it shoves you out of it (a ram should displace)
    //   • tighter — the answer is leaving ground, on a clock the room can shorten
    stats: { hp: 1100, attack: 230, plating: 12, damageReduction: 0, speed: 18, attackRange: 15, attackCooldown: 3500, pullRange: 165 },
    behavior: 'melee', attackStyle: 'frost', biome: 'tundra',
    rewards: { essence: 110, essenceType: 'blue', level: 4, biomeXp: 660 },
    ai: { wanderRadius: 140, leashRange: 490, idleMinMs: 3500, idleMaxMs: 9500 },
    // ⚠ PRE-EXISTING, NOT TOUCHED BY THE 2026-09-11 ecology pass, but worth knowing
    // before reading this monster as a charger: 18 base × 2.3 = 41px/s, against a
    // player who WALKS at 120. This burst is decorative — it cannot close a gap on
    // anyone who is moving. (The Permafrost Behemoth's is worse at 24px/s.) The
    // Mastodon's real pressure is the planted circle below, which does not care how
    // fast it moves. Left alone deliberately: base speeds feed the measured tier
    // ladder, so this is a balance-pass call, not an ecology one.
    chargeOnAggro: { speedMult: 2.3, durationMs: 1200 },
    // FROST-TUSK IMPACT — planted where you stood when the cast began. The
    // multiplier is UNCHANGED (1.6): this is the same hit it always dealt, made
    // avoidable and given a consequence, not made bigger.
    //
    // Cast lengthened 1000 -> 1300ms because the radius now has to be walkable out
    // of: at base 120px/s you clear 110px with room to spare, and at max Chill
    // (~84px/s) you clear it by a hair. That margin IS the design — the room
    // deciding whether a telegraph is generous or brutal is the Tundra's whole
    // fusion, and failing it costs a shove and a heavy hit rather than a lockout.
    monsterAbilities: [{
      id: 'frost-tusk-impact', name: 'Frost-Tusk Impact', castMs: 1300,
      cooldownMs: 12000, initialCooldownMs: 5500, target: 'player', fx: 'frost-tusk-impact',
      actions: [{
        type: 'area-hit', radius: 110, multiplier: 1.6,
        // Displacement, NOT control: a knockback is one shove that the player's
        // knockback resistance already answers, and it resets a melee player's
        // positioning without ever taking their inputs away. No `stunMs` here
        // (locked with the rest of this pass) — the Tundra does not remove agency.
        knockback: { distance: 150 },
      }],
    }],
  }],

  ['glacial-direbear', {
    id: 'glacial-direbear', name: 'Glacial Dire-Bear', color: 0x5599cc,
    // Evolved defensive-window elite: bigger Ice Armor, bigger Shatter payoff.
    // No ramping per-hit slows (removed, locked).
    stats: { hp: 1221, attack: 220, plating: 0, damageReduction: 0.14, speed: 18, attackRange: 15, attackCooldown: 3200, pullRange: 175 },
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
    stats: { hp: 900, attack: 190, plating: 0, damageReduction: 0.08, speed: 36, attackRange: 220, attackCooldown: 2900, pullRange: 260 },
    behavior: 'ranged', attackStyle: 'frost', biome: 'tundra',
    staticSentry: true,
    rewards: { essence: 62, essenceType: 'blue', level: 3, biomeXp: 370 },
    // DEEP FREEZE - the evolved Frostbind, deepened as the SAME mechanic made larger
    // and readable rather than as a second spell.
    //
    // The Rime Caster's Frostbind is a mobile single-target cast: it follows you, and
    // short of a stun there is nothing to do about it. Deep Freeze is PLANTED — the
    // circle is drawn on the ground where you stood at cast start, and everyone still
    // inside it when the wind-up ends is rooted. Bigger, visible, and for the first
    // time in the line answerable by moving.
    //
    // That is deliberately the T4 being MORE avoidable than the T3, not less. The
    // biome's stated rule is to be conservative with hard control and to prefer
    // spatial counterplay, and this is the only root in the entire Tundra roster —
    // two yetis in one pull chaining 2.2s of unavoidable root was exactly the
    // composition failure that rule exists to prevent. Now two yetis plant two
    // circles, and circles compose.
    //
    // Cast 1500 -> 1600ms, radius 120: clearable at base speed with margin and still
    // clearable at max Chill. The `requiresAmbientStacks: 2` gate is kept, so the
    // ability still only comes online once the room has chilled you.
    //
    // ⚠ `aoe` + `rootMs` only works because the planted resolution path now applies
    // charged-attack riders (server/src/systems/combat/engine/combat.ts). Before that
    // fix the combination silently dropped the root.
    chargedAttack: {
      name: 'Deep Freeze', castMs: 1600, cooldownMs: 9000, initialCooldownMs: 4000,
      multiplier: 1.2, fx: 'power-shot',
      rootMs: 2200, requiresAmbientStacks: 2,
      aoe: { radius: 120 },
    },
    ai: { wanderRadius: 210, leashRange: 620, idleMinMs: 1500, idleMaxMs: 4500 },
  }],

  ['permafrost-behemoth', {
    id: 'permafrost-behemoth', name: 'Permafrost Behemoth', color: 0x4477aa,
    // Colossal musk ox sheathed in glacier ice (the plating made visible).
    // Apex, deliberately SIMPLE: enormous HP, heavy plating (20), very slow, and one
    // huge telegraphed GLACIAL SLAM every 9s (~440 at the retuned base attack). The enemy soft-cap is REMOVED
    // (locked) — extreme plating is already enough defensive identity, and stacking a
    // second weapon-matchup layer on the apex was the kitchen sink.
    // Base 220 keeps ordinary hits meaningful while the reduced slam leaves room
    // to react between telegraphed impacts.
    stats: { hp: 1914, attack: 220, plating: 20, damageReduction: 0.12, speed: 12, attackRange: 15, attackCooldown: 4000, pullRange: 140 },
    behavior: 'melee', attackStyle: 'frost', biome: 'tundra', elite: true,
    rewards: { essence: 260, essenceType: 'blue', level: 4, biomeXp: 1560 },
    ai: { wanderRadius: 70, leashRange: 380, idleMinMs: 6000, idleMaxMs: 15000 },
    chargeOnAggro: { speedMult: 2.0, durationMs: 1400 },
    // GLACIAL SLAM - one huge TELEGRAPHED hit rather than an invisible cooldown
    // spike, so the apex's whole offense is a thing the player can see and answer.
    chargedAttack: {
      name: 'Glacial Slam', castMs: 2200, cooldownMs: 9000, initialCooldownMs: 6000,
      multiplier: 2.0, fx: 'strong-kick',
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
