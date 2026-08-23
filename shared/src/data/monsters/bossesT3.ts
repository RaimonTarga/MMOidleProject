import type { MonsterDefinition } from './types';

// ════════════════════════════════════════════════════════════════════════
// T3 BOSS CONFIGURATIONS
//
// Seven active biomes: Mountain · Cave · Swamp · Desert · Jungle · Volcanic · Tundra
// (Plains and Forest retire after T2; Wasteland and Trench debut at T4.)
//
// ── T3 IN THE ENCOUNTER REWORK (2026-08-23) ─────────────────────────────
// T3 is the tier allowed a REAL second layer: a state change, a range morph, a
// new interaction, or a genuinely deeper version of the core mechanic. It is not
// allowed a second, unrelated mechanic — the layer has to be about the same idea
// the lineage has been building since T1/T2.
//
// What that removed from this file:
//   • every `aoeAttack` — it existed only so summons could not body-block a slow
//     boss. That is now `targeting.prefersPlayers`, and each boss's charged attack
//     is the periodic sweep. AoE stays where the ENCOUNTER wants it.
//   • the stale `50% -> enrage / 25% -> speed` template that seven different
//     encounters were all wearing.
//   • Swamp's 25% `attack x4` spike, which turned the attrition boss into a bruiser
//     in its last quarter.
//
// What it added: `empower-charged` (the signature telegraphed attack escalates),
// `empower-shred` (Cave's corrosion goes deeper), `spawn-pool` (Swamp's Rot Bloom),
// and a real predator state for Jungle.
//
// ⚠ NUMBERS are inherited from the pre-rework definitions and are NOT re-pitched
// here. Removing a source of pressure (or adding one) can invalidate a stat block;
// the dedicated balance pass owns that. See §8 of the rework handoff.
// ════════════════════════════════════════════════════════════════════════

export const bossMonsterEntriesT3 = [

  // ══════════════════════════════════════════════════════════════════════
  // MOUNTAIN — "Crag-Gorged Horn-Behemoth"
  // Identity: TELEGRAPHED CATASTROPHIC IMPACT.
  //
  // T3's real second layer is the CHARGE-LOCK-SLAM: `engageSequence` makes it
  // sprint at you, plant, and only then wind up — so the slam is no longer a
  // stationary metronome you can simply walk around. Both phases escalate that
  // one attack (wider, then more often), because the slam IS the encounter.
  // ══════════════════════════════════════════════════════════════════════
  ['crag-gorged-horn-behemoth', {
    id: 'crag-gorged-horn-behemoth', name: 'Crag-Gorged Horn-Behemoth', color: 0x6688cc,
    isBoss: true,
    stats: { hp: 12418, attack: 204, plating: 12, damageReduction: 0.05, speed: 18, attackRange: 72, attackCooldown: 4200, pullRange: 360 },
    behavior: 'melee', attackStyle: 'quake', biome: 'mountain',
    rewards: { essence: 340, essenceType: 'blue', level: 5, biomeXp: 510 },
    ai: { wanderRadius: 100, leashRange: 920, idleMinMs: 3500, idleMaxMs: 8500 },
    targeting: { prefersPlayers: true },
    chargeOnAggro: { speedMult: 2.5, durationMs: 1200 },
    engageSequence: { kind: 'charge-lock-charged-attack', speedMult: 3.0, maxChargeMs: 1800, lockoutMs: 500 },
    chargedAttack: {
      name: 'Cragbreaker Slam', castMs: 2400, cooldownMs: 9000, initialCooldownMs: 4500,
      multiplier: 2.0, fx: 'strong-kick', aoe: { radius: 205 },
    },
    bossScript: {
      phases: [
        // The impact grows: harder, and it covers more of the arena.
        { hpPct: 0.5,  actions: [{ type: 'empower-charged', multiplierMult: 1.20, radiusMult: 1.15 }] },
        // Then it comes for you faster and swings sooner. Same one idea, tightened.
        { hpPct: 0.25, actions: [
          { type: 'empower-charged', cooldownMult: 0.70 },
          { type: 'stat-buff', stat: 'speed', mult: 1.25 },
        ] },
      ],
    },
  }],


  // ══════════════════════════════════════════════════════════════════════
  // CAVE — "Deep-Core Burrow-Gorger"
  // Identity: ENDURANCE / DEFENSIVE EROSION.
  //
  // T3's second layer was already right: plating shred stops being a slow tax and
  // becomes a THRESHOLD — corrosion at 3 and 6 stacks detonates into Corrosive
  // Venom. The phases now extend that same ladder (a higher ceiling, new threshold
  // rungs, a deeper bite) plus one armoured body to outlast, instead of the generic
  // enrage/speed pair they used to carry.
  // ══════════════════════════════════════════════════════════════════════
  ['deep-core-burrow-gorger', {
    id: 'deep-core-burrow-gorger', name: 'Deep-Core Burrow-Gorger', color: 0x332244,
    isBoss: true,
    stats: { hp: 12895, attack: 196, plating: 16, damageReduction: 0.15, speed: 16, attackRange: 72, attackCooldown: 4500, pullRange: 330 },
    behavior: 'melee', attackStyle: 'quake', biome: 'cave',
    rewards: { essence: 355, essenceType: 'red', level: 5, biomeXp: 530 },
    ai: { wanderRadius: 85, leashRange: 890, idleMinMs: 4000, idleMaxMs: 10000 },
    targeting: { prefersPlayers: true },
    chargeOnAggro: { speedMult: 2.0, durationMs: 1200 },
    appliesPlatingShred: {
      platingPerStack: 2,
      maxStacks: 8,
      thresholdPoison: {
        atStacks: [3, 6],
        debuffId: 'deep-core-corrosive-venom',
        label: 'Corrosive Venom',
        damagePerStack: 16,
        maxStacks: 2,
        tickIntervalMs: 1000,
        durationMs: 6000,
        element: 'poison',
      },
    },
    chargedAttack: {
      name: 'Deep-Core Slam', castMs: 1500, cooldownMs: 8500, initialCooldownMs: 4000,
      multiplier: 1.7, fx: 'strong-kick', aoe: { radius: 155 },
    },
    bossScript: {
      phases: [
        // The ceiling lifts and two more threshold rungs appear above where the
        // fight used to top out — the erosion keeps going instead of plateauing.
        { hpPct: 0.5, actions: [
          { type: 'empower-shred', maxStacksAdd: 4, extraThresholds: [9, 12] },
        ] },
        // Last quarter: each stack bites harder, and a Cavern Troll arrives so the
        // erosion runs on a second body while you finish the first.
        { hpPct: 0.25, actions: [
          { type: 'empower-shred', platingPerStackAdd: 1 },
          { type: 'spawn-adds', monsterTypeId: 'cavern-troll', count: 1, offsetRange: 240 },
        ] },
      ],
    },
  }],


  // ══════════════════════════════════════════════════════════════════════
  // SWAMP — "Rot-Spore Croc-Behemoth"
  // Identity: ROT / ATTRITION / HAZARDOUS ARENA. The lineage's finale.
  //
  // T3's second layer is pool VULNERABILITY + DETONATION: the ground does not just
  // tick, it amplifies everything else and then goes off.
  //
  // ENCOUNTER REWORK: the old 25% `attack x4` is gone. It turned the tier's
  // attrition boss into its biggest direct hitter for the last quarter of the fight,
  // which is the exact opposite of what Swamp is for. In its place the ROT escalates:
  // the spores thicken (`morph` on the DoT) and the arena floods with one enormous
  // ROT BLOOM. Escalation should make the rot harder to survive, not replace it.
  // ══════════════════════════════════════════════════════════════════════
  ['rot-spore-croc-behemoth', {
    id: 'rot-spore-croc-behemoth', name: 'Rot-Spore Croc-Behemoth', color: 0x1a3311,
    isBoss: true,
    stats: { hp: 11940, attack: 52, plating: 8, damageReduction: 0.10, speed: 28, attackRange: 18, attackCooldown: 3400, pullRange: 330 },
    behavior: 'melee', attackStyle: 'poison', biome: 'swamp',
    rewards: { essence: 345, essenceType: 'purple', level: 5, biomeXp: 518 },
    ai: { wanderRadius: 105, leashRange: 880, idleMinMs: 2800, idleMaxMs: 7000 },
    targeting: { prefersPlayers: true },
    chargeOnAggro: { speedMult: 2.0, durationMs: 1200 },
    dotEffect: { debuffId: 'rot-spore-plague', label: 'Rot Spores', damagePerStack: 13, maxStacks: 6, tickIntervalMs: 1000, durationMs: 6000 },
    chargedAttack: {
      name: 'Spore Pool', castMs: 1000, cooldownMs: 8000, initialCooldownMs: 3500,
      multiplier: 1.2, fx: 'strong-kick', aoe: { radius: 130 },
      pool: {
        durationMs: 9000, damagePerTick: 8, tickIntervalMs: 1000, slowSpeedMult: 0.55,
        vulnerability: { damageTakenPct: 0.16, durationMs: 1800 },
        detonationMultiplier: 2.25,
      },
    },
    bossScript: {
      phases: [
        // Cadence only (atkMult 1.0): stacks land faster and the pools come sooner,
        // so more of the arena is contaminated at once. The slap stays trivial.
        { hpPct: 0.5, actions: [
          { type: 'enrage', atkMult: 1.0, cdMult: 0.65 },
          { type: 'empower-charged', cooldownMult: 0.70, radiusMult: 1.15 },
        ] },
        // ROT BLOOM: the spores thicken and the floor beneath the boss becomes a
        // long-lived hazard in its own right. Standing and trading is the losing play.
        { hpPct: 0.25, actions: [
          { type: 'morph', dotEffect: {
            debuffId: 'rot-spore-plague', label: 'Rot Spores',
            damagePerStack: 17, maxStacks: 8, tickIntervalMs: 1000, durationMs: 6000,
          } },
          { type: 'spawn-pool', radius: 260, durationMs: 20000, damagePerTick: 14, tickIntervalMs: 1000, slowSpeedMult: 0.55 },
        ] },
      ],
    },
  }],


  // ══════════════════════════════════════════════════════════════════════
  // DESERT — "Dune-Carapace Monarch"
  // Identity: SETUP / CONTROL -> PUNISHMENT.
  //
  // T3's second layer is the RANGE MORPH, and the rework fuses it to the lineage's
  // mark instead of letting it be a separate trick:
  //   100–50%  melee CONTROLLER — slows, and paints Sun Mark with its own hits.
  //   below 50% ranged PUNISHER — it backs off and the Sandburst becomes the
  //            cash-out, landing on whatever setup it left on you.
  // The mark does NOT go away when the boss changes range; that pairing is the
  // whole point of the phase.
  // ══════════════════════════════════════════════════════════════════════
  ['dune-carapace-monarch', {
    id: 'dune-carapace-monarch', name: 'Dune-Carapace Monarch', color: 0xccaa22,
    isBoss: true,
    stats: { hp: 11940, attack: 196, plating: 10, damageReduction: 0.08, speed: 42, attackRange: 20, attackCooldown: 3000, pullRange: 350 },
    behavior: 'melee', attackStyle: 'sandblast', biome: 'desert',
    rewards: { essence: 345, essenceType: 'yellow', level: 5, biomeXp: 518 },
    ai: { wanderRadius: 140, leashRange: 900, idleMinMs: 2200, idleMaxMs: 6500 },
    targeting: { prefersPlayers: true },
    chargeOnAggro: { speedMult: 2.5, durationMs: 1000 },
    slowEffect: { speedMult: 0.6, durationMs: 2000 },
    // Inherited from the T2 Emperor: it paints its own mark and cashes it itself, so
    // the duel alternates setup / punishment without depending on adds.
    appliesMark: { durationMs: 4500 },
    markedStrike: { multiplier: 1.9 },
    chargedAttack: {
      name: 'Sandburst', castMs: 1300, cooldownMs: 9000, initialCooldownMs: 4500,
      multiplier: 1.6, fx: 'strong-kick', aoe: { radius: 155 },
    },
    bossScript: {
      phases: [
        { hpPct: 0.5, actions: [
          { type: 'morph', isRanged: true, attackStyle: 'sandblast', attackRange: 240, kite: true },
          // Act II: the Sandburst stops being a punctuation mark and becomes the
          // punishment. Longer reach, and the mark it left is still on you.
          { type: 'empower-charged', multiplierMult: 1.20, cooldownMult: 0.80 },
        ] },
        // Last quarter: the cash-out comes around roughly twice as often.
        { hpPct: 0.25, actions: [{ type: 'empower-charged', cooldownMult: 0.65 }] },
      ],
    },
  }],


  // ══════════════════════════════════════════════════════════════════════
  // JUNGLE — "Apex Bramble-Slasher"
  // Identity: AMBUSH / EVASION -> EXPOSED FRENZY. T3 introduces the predator.
  //
  // The T2 boss only knew how to jump you once. T3 adds the half of the lineage
  // that makes it a Jungle fight: it is HARD TO PIN DOWN (modest evasion) and it
  // re-arms. At 50% it melts into the undergrowth — evasion doubles for a few
  // seconds — and comes back down on you with a committed leap.
  //
  // Deliberately NOT solved with attack-speed escalation: this boss already swings
  // every 1.5s, and a frequency storm would just make it a Forest bear.
  // ══════════════════════════════════════════════════════════════════════
  ['apex-bramble-slasher', {
    id: 'apex-bramble-slasher', name: 'Apex Bramble-Slasher', color: 0x115522,
    isBoss: true,
    stats: { hp: 11701, attack: 104, plating: 0, damageReduction: 0.03, speed: 64, attackRange: 18, attackCooldown: 1500, pullRange: 340 },
    behavior: 'melee', attackStyle: 'slash', biome: 'jungle',
    rewards: { essence: 340, essenceType: 'green', level: 5, biomeXp: 510 },
    ai: { wanderRadius: 140, leashRange: 920, idleMinMs: 2000, idleMaxMs: 6000 },
    targeting: { prefersPlayers: true },
    chargeOnAggro: { speedMult: 2.8, durationMs: 900 },
    // Modest on purpose — a quarter of your hits missing is a texture, not a wall.
    // The T4 boss is where evasion becomes a state you have to play around.
    evasion: 0.15,
    openingStrike: { multiplier: 2.5 },
    chargedAttack: {
      name: 'Bramble Pounce', castMs: 900, cooldownMs: 11000, initialCooldownMs: 6000,
      multiplier: 2.2, fx: 'savage-maul', aoe: { radius: 110 },
      knockback: { distance: 140 },
    },
    bossScript: {
      phases: [
        { hpPct: 0.5, actions: [
          // It breaks contact and is briefly very hard to hit …
          { type: 'stat-buff', stat: 'evasion', mult: 2.0, durationMs: 5000 },
          // … then the pounce is re-armed, harder and far more frequent.
          { type: 'empower-charged', multiplierMult: 1.20, cooldownMult: 0.55 },
        ] },
      ],
    },
  }],


  // ══════════════════════════════════════════════════════════════════════
  // VOLCANIC — "Cinder-Shell Magma-Salamander"
  // Identity: the SHELL CYCLE.
  //
  // ENCOUNTER REWORK: the old version was a generic enrage plus a speed buff on a
  // fire sprite. Its second layer is now the thing its name has always promised —
  // it periodically retracts into a cinder shell (`shellUp.repeatIntervalMs`), goes
  // nearly immune to direct damage, and cannot attack while it is in there. The
  // shell closing FLOODS the ground it is standing on with magma, so the defensive
  // beat is also space denial and the window is not free.
  //
  // Counterplay is authored, not incidental: DoTs tick through a shell at full
  // strength, the boss cannot hurt you while shelled, and the cycle is on a clock.
  // Volcano's Heat identity is carried by the T4 Caldera Sovereign; T3 stays focused.
  // ══════════════════════════════════════════════════════════════════════
  ['cinder-shell-magma-salamander', {
    id: 'cinder-shell-magma-salamander', name: 'Cinder-Shell Magma-Salamander', color: 0xee4400,
    isBoss: true,
    stats: { hp: 11462, attack: 179, plating: 8, damageReduction: 0.04, speed: 26, attackRange: 18, attackCooldown: 3000, pullRange: 340 },
    behavior: 'melee', attackStyle: 'fire', biome: 'volcanic',
    rewards: { essence: 360, essenceType: 'red', level: 5, biomeXp: 540 },
    ai: { wanderRadius: 120, leashRange: 920, idleMinMs: 2500, idleMaxMs: 7000 },
    targeting: { prefersPlayers: true },
    chargeOnAggro: { speedMult: 2.5, durationMs: 1000 },
    // First shell at 85% so the cycle is taught early, then every 16s while engaged.
    // 0.30 (not the roster's 0.15) because this one repeats — it has to be a wall
    // you wait out or burn through, never a wall that stalls the fight.
    shellUp: {
      atHpPct: 0.85, durationMs: 3800, directDamageMult: 0.30, repeatIntervalMs: 16000,
      pool: { radius: 190, durationMs: 8000, damagePerTick: 12, tickIntervalMs: 1000, slowSpeedMult: 0.7 },
    },
    chargedAttack: {
      name: 'Eruption', castMs: 1400, cooldownMs: 7000, initialCooldownMs: 3500,
      multiplier: 1.6, fx: 'strong-kick', aoe: { radius: 175 },
    },
    bossScript: {
      phases: [
        // Coming out of the shell is worth more to it each time.
        { hpPct: 0.5,  actions: [{ type: 'empower-charged', multiplierMult: 1.20, radiusMult: 1.15 }] },
        { hpPct: 0.25, actions: [
          { type: 'empower-charged', cooldownMult: 0.60 },
          { type: 'spawn-pool', radius: 240, durationMs: 16000, damagePerTick: 16, tickIntervalMs: 1000, slowSpeedMult: 0.7 },
        ] },
      ],
    },
  }],


  // ══════════════════════════════════════════════════════════════════════
  // TUNDRA — "Frost-Plated Rime-Mammoth"
  // Identity: CHILL + ICE ARMOR / SHATTER. Tundra controls TEMPO; you create
  // offence by breaking the armour at the right moment.
  //
  // Three parts, all the same idea:
  //   • Chill — the node's ambient ramp plus this boss's own rampDebuff. Moderate,
  //     and capped: you should feel increasingly suppressed, never unable to play.
  //   • Ice Armor — a periodic barrier. Chip damage chinks it; a burst pops it.
  //   • Shatter — popping it damages the boss and staggers it. That is your window.
  // Its Permafrost Slam is the thing the window is FOR.
  //
  // The Slam does NOT yet feed on the room's Chill — that is deliberately the T4
  // Patriarch's escalation, so the lineage has somewhere to go. T3 teaches the
  // Chill/Armor/Shatter loop; T4 fuses the environment into the signature attack.
  // ══════════════════════════════════════════════════════════════════════
  ['frost-plated-rime-mammoth', {
    id: 'frost-plated-rime-mammoth', name: 'Frost-Plated Rime-Mammoth', color: 0x88ccee,
    isBoss: true,
    stats: { hp: 12895, attack: 204, plating: 12, damageReduction: 0.12, speed: 18, attackRange: 20, attackCooldown: 4200, pullRange: 360 },
    behavior: 'melee', attackStyle: 'frost', biome: 'tundra',
    rewards: { essence: 350, essenceType: 'blue', level: 5, biomeXp: 525 },
    ai: { wanderRadius: 100, leashRange: 900, idleMinMs: 3000, idleMaxMs: 8000 },
    targeting: { prefersPlayers: true },
    chargeOnAggro: { speedMult: 2.0, durationMs: 1200 },
    rampDebuff: { moveSlowPerHit: 0.06, moveSlowMaxPct: 0.40, atkSlowPerHit: 0.05, atkSlowMaxPct: 0.30, stackDurationMs: 4000 },
    enemyShield: {
      shieldPct: 0.18, intervalMs: 12000, durationMs: 6000,
      shatter: {
        selfDamagePct: 0.08,
        vulnerability: { damageTakenPct: 0.20, durationMs: 4000 },
      },
    },
    chargedAttack: {
      name: 'Permafrost Slam', castMs: 1900, cooldownMs: 8500, initialCooldownMs: 4500,
      multiplier: 1.7, fx: 'strong-kick', aoe: { radius: 195 },
    },
    bossScript: {
      phases: [
        // The Slam grows — and by now the room has chilled you enough to feel it.
        { hpPct: 0.5, actions: [
          { type: 'empower-charged', multiplierMult: 1.20, radiusMult: 1.10 },
        ] },
        // The armour thickens and returns sooner, so the shatter windows get rarer
        // and more valuable. Escalation on the mechanic the lineage is named for.
        { hpPct: 0.25, actions: [
          { type: 'apply-shield', shieldPct: 0.24, intervalMs: 9000, durationMs: 6500,
            shatter: {
              selfDamagePct: 0.10,
              vulnerability: { damageTakenPct: 0.25, durationMs: 4500 },
            } },
        ] },
      ],
    },
  }],
] satisfies [string, MonsterDefinition][];
