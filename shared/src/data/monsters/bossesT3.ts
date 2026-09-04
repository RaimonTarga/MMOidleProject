import { SUN_MARK_EFFECT_ID, TUNDRA_CHILL_EFFECT_ID } from '../../systems/monsterDebuffs';
import { FROZEN_STATUS_ID } from '../../systems/statusPolicy';
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
    // T3 = the lane PLUS a payoff where it lands. The Colossus charges, then
    // Cragbreaker erupts on the point it CHARGED TO — the endpoint it captured, not
    // wherever the player drifted to afterwards. Reading the lane therefore answers
    // both halves at once, which is what makes the tier feel like one attack rather
    // than two stapled together.
    //
    // REMOVED with the 2026-09-04 redesign: `chargeOnAggro` and the legacy
    // `engageSequence` charge-lock opener (the pattern IS the charge now, so the
    // opener was a second, worse copy of it), plus the standalone circular slam.
    bossPattern: {
      id: 'cragbreaker', name: 'Cragbreaker',
      damageMultiplier: 2.0, cooldownMs: 9000, initialCooldownMs: 4500,
      steps: [
        { kind: 'cast', name: 'Cragbreaker Charge', castMs: 2400, fx: 'strong-kick',
          lane: { length: 760, halfWidth: 96, lockAtCastPct: 0.55 } },
        // 760px at 520px/s ≈ 1.5s of travel.
        { kind: 'charge', speed: 520, maxTravelMs: 2200 },
        // Centred on the CAPTURED endpoint, so the circle is readable from the lane
        // the moment it locked — not a fresh surprise aimed at the player again.
        { kind: 'impact', name: 'Cragbreaker', anchor: 'captured-endpoint',
          radius: 205, damageMult: 0.75, telegraphMs: 900, fx: 'strong-kick' },
        { kind: 'recovery', label: 'Overextended', durationMs: 2600 },
      ],
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
    // T3 = the evolved burrow. Same shape as T2, bigger, and the corrosion's
    // threshold poison is what makes it bite — that already begins only after the
    // existing defence-breach rungs, so the eruption does not need its own poison
    // bolted on to feel like Cave.
    //
    // REMOVED with the 2026-09-04 redesign: the circular Deep-Core Slam,
    // `chargeOnAggro`, and the DR-only Deep Burrow cast.
    bossPattern: {
      id: 'deep-core-emergence', name: 'Deep-Core Burrow',
      damageMultiplier: 1.7, cooldownMs: 8500, initialCooldownMs: 4000,
      steps: [
        { kind: 'cast', name: 'Deep Burrow', castMs: 1000, fx: 'shield', guardable: false },
        { kind: 'conceal', name: 'Burrowed', marker: 'burrow', durationMs: 1800,
          relocate: 'near-target', emergeGap: 165 },
        { kind: 'impact', name: 'Deep-Core Eruption', anchor: 'self', radius: 155,
          damageMult: 1.0, telegraphMs: 1100, fx: 'strong-kick' },
        { kind: 'recovery', label: 'Surfaced', durationMs: 2400 },
      ],
    },
    bossScript: {
      phases: [
        // The ceiling lifts and two more threshold rungs appear above where the
        // fight used to top out — the erosion keeps going instead of plateauing.
        { hpPct: 0.5, actions: [
          { type: 'empower-shred', maxStacksAdd: 4, extraThresholds: [9, 12] },
        ] },
        // Last quarter: each stack bites harder, and the boss burrows behind a
        // temporary shell so the corrosion has a defensive climax without another body.
        // Last quarter: each stack bites harder. The old Deep Burrow cast that sat
        // here was a flat-DR shell wearing the burrow's name; the real burrow is
        // now the encounter's whole spine, so a second fake one is gone.
        { hpPct: 0.25, actions: [
          { type: 'empower-shred', platingPerStackAdd: 1 },
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
    dotEffect: { debuffId: 'rot-spore-plague', label: 'Rot Spores', damagePerStack: 13, maxStacks: 6, tickIntervalMs: 1000, durationMs: 9000 },
    chargedAttack: {
      name: 'Spore Pool', castMs: 1000, cooldownMs: 8000, initialCooldownMs: 3500,
      multiplier: 1.2, fx: 'strong-kick', aoe: { radius: 130 },
      // Deliberately NOT extended to the swamp lineage's 10-minute pools: this one
      // detonates on expiry, so a fight-length duration would delete the payoff.
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
            damagePerStack: 17, maxStacks: 8, tickIntervalMs: 1000, durationMs: 9000,
          } },
          // Effectively permanent (10 min), retired with the boss. Unlike the Spore
          // Pool above this one never detonates, so nothing is lost by it lingering.
          { type: 'spawn-pool', radius: 260, durationMs: 600000, damagePerTick: 14, tickIntervalMs: 1000, slowSpeedMult: 0.55 },
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
    // T3 = the T2 sequence, carried ACROSS A POSTURE CHANGE. The mark is painted in
    // melee and cashed out from range once the Monarch backs off at 50% — the mark
    // persists through the morph unless cleansed, and that pairing is the point of
    // the tier. Chasing it eats the Execution; ignoring it eats the Execution.
    //
    // REMOVED with the 2026-09-04 redesign: `chargeOnAggro`, the per-hit slow, the
    // invisible `appliesMark`/`markedStrike` alternation on ordinary swings, and the
    // generic Sandburst circle it used as filler.
    bossPattern: {
      id: 'monarch-execution', name: 'Death Sting',
      damageMultiplier: 1.6, cooldownMs: 9000, initialCooldownMs: 4500,
      steps: [
        { kind: 'apply-status', name: 'Death Sting', castMs: 1100, fx: 'strong-kick',
          effectId: SUN_MARK_EFFECT_ID, stacks: 1, durationMs: 6500 },
        { kind: 'wait', durationMs: 1500 },
        { kind: 'payoff', name: 'Execution', castMs: 1300, fx: 'strong-kick',
          damageMult: 1.0, amplifiedMult: 1.9,
          consumes: { effectId: SUN_MARK_EFFECT_ID }, radius: 155 },
        { kind: 'recovery', label: 'Spent', durationMs: 1900 },
      ],
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
    // JUNGLE = PURSUIT AND FAILED ESCAPE. The one loop the whole lineage runs:
    //
    //   Escape Guard appears and the boss bolts for the far edge of its leash.
    //     BREAK the guard  -> the retreat fails, it stumbles, and it banks one
    //                         capped stack of Escape Instinct so the NEXT attempt
    //                         is quicker.
    //     LET IT FINISH    -> it vanishes into cover, resets Instinct, picks a
    //                         valid re-entry point, and comes back with an ambush.
    //
    // BARRIER DAMAGE — not physical contact — is the test. That is deliberate and
    // load-bearing: a boss whose whole idea is running away from you would otherwise
    // be answerable only by melee, and ranged builds would have no counterplay at
    // all. Instinct is capped, so repeated failures speed it up to a ceiling and no
    // further; a successful escape wipes it, because it records failure, not progress.
    //
    // T3 adds the AFTERMATH: a successful ambush lands venom on top of the hit, so
    // letting it get away costs you for the next several seconds rather than only
    // in the moment.
    //
    // REMOVED with the 2026-09-04 redesign: passive `evasion` (a flat miss chance is
    // a texture, not a decision, and it made every build's damage read as unreliable
    // rather than making the boss hard to pin down), `openingStrike`, Bramble Pounce,
    // the 50% evasion surge, and `chargeOnAggro`.
    bossPattern: {
      id: 'timberclaw-escape', name: 'Escape',
      damageMultiplier: 2.0, cooldownMs: 13000, initialCooldownMs: 7000,
      steps: [
        { kind: 'escape-guard', name: 'Escape Guard', castMs: 2500, fx: 'shield',
          sourceId: 'jungle-escape', shieldPct: 0.07,
          onBreak: { staggerMs: 2500, label: 'Cornered' },
          maxInstinctStacks: 3, instinctCastReductionPct: 0.15 },
        { kind: 'conceal', name: 'Vanished', marker: 'stealth', durationMs: 1400,
          relocate: 'leash-edge' },
        { kind: 'payoff', name: 'Ambush', castMs: 800, fx: 'savage-maul',
          damageMult: 1.0 },
        // Venom follows a SUCCESSFUL ambush only — break the guard and none of this
        // happens, which is what makes breaking it worth doing.
        { kind: 'apply-status', name: 'Venom Burst', castMs: 500, fx: 'savage-maul',
          effectId: 'apex-bramble-venom', stacks: 3, durationMs: 8000,
          data: { damagePerStack: 14, tickIntervalMs: 1000, isDot: 1 } },
        { kind: 'recovery', label: 'Winded', durationMs: 1700 },
      ],
    },
    bossScript: {
      phases: [
        { hpPct: 0.5, actions: [
          // The escape cycle comes around harder and far more often. The old
          // evasion surge is gone with the passive evasion it doubled.
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
    // VOLCANO = HEAT, VENT, AND THE CHOICE TO STAND IN IT.
    //
    // The shell closes and lays a visible MAGMA VENT. Staying in it accelerates the
    // room's Heat — which raises damage DEALT and damage TAKEN together — while you
    // work on the shell; stepping out returns you to the node's baseline rate and
    // lets the Heat shed. Neither is the correct answer: that trade IS the encounter.
    //
    // Heat owns all the escalation. There is no hidden boss multiplier beside it,
    // because the same escalation counted twice — once visibly on the player, once
    // invisibly on the boss — is unreadable. And ordinary Cleanse cannot strip Heat
    // (statusPolicy: 'immune'), so leaving the vent is the answer rather than a button.
    //
    // T3 teaches the plain cycle: normal -> shell plus vent -> stay or leave while
    // you work on the shell -> the shell opens -> normal.
    //
    // REMOVED with the 2026-09-04 redesign: the independent Eruption charged attack
    // and the 25% threshold Vent Rupture. Both duplicated the cycle — the shell
    // already floods the ground on its own schedule, and a second pool arriving on a
    // health threshold made the arena unreadable rather than more dangerous.
    // `chargeOnAggro` removed with them.
    //
    // First shell at 85% so the cycle is taught early, then every 16s while engaged.
    // 0.30 (not the roster's 0.15) because this one repeats — it has to be a wall
    // you wait out or burn through, never a wall that stalls the fight.
    shellUp: {
      atHpPct: 0.85, durationMs: 3800, directDamageMult: 0.30, repeatIntervalMs: 16000,
      pool: {
        radius: 190, durationMs: 8000, damagePerTick: 12, tickIntervalMs: 1000,
        flavor: 'magma-vent', rampAccelMult: 3,
      },
    },
    bossScript: {
      phases: [
        // Each cycle is worth more to it: the shell holds longer and the vent that
        // comes with it burns hotter. One idea, tightened.
        { hpPct: 0.5, actions: [{ type: 'stat-buff', stat: 'attack', mult: 1.15 }] },
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
    // TUNDRA = THE CHILL CHECK. The ROOM builds Chill; the boss asks whether you let
    // it get too deep.
    //
    //   Deep Freeze is unavoidable and targeted, and it CHECKS your stacks. Below the
    //   threshold it simply does not land — the gate is checked at cast start, so the
    //   question was decided before the cast, by whether you cleansed and kept moving.
    //   Above it you are Frozen, and a large, dodgeable Shatter follows.
    //
    // A Frozen player is not out of answers: Frozen is hard control, so Break Free
    // strips it and Step Back then clears the circle. Guarding or tanking the Shatter
    // stays legal. What is NOT legal is damage that secretly scales with Chill — the
    // stacks decide IF you get frozen, never how hard anything hits.
    //
    // Cleanse REDUCES Chill rather than deleting it (statusPolicy: 'partial'): the
    // room re-applies it continuously, so a full strip would be true for a second and
    // read as the button not working.
    //
    // REMOVED with the 2026-09-04 redesign: `chargeOnAggro`, the per-hit `rampDebuff`
    // (the boss adding its OWN chill on top of the room's made two sources of one
    // resource, and the encounter reads the room's), the Ice Armor / vulnerability
    // shield pair (a generic anti-burst clip in the one lineage explicitly about
    // rewarding burst), and the generic Permafrost Slam circle.
    bossPattern: {
      id: 'rime-shatter', name: 'Deep Freeze',
      damageMultiplier: 1.7, cooldownMs: 8500, initialCooldownMs: 4500,
      steps: [
        { kind: 'apply-status', name: 'Deep Freeze', castMs: 1400, fx: 'strong-kick',
          effectId: FROZEN_STATUS_ID, stacks: 1, durationMs: 2200,
          requires: { effectId: TUNDRA_CHILL_EFFECT_ID, minStacks: 4 } },
        { kind: 'impact', name: 'Shatter', anchor: 'self', radius: 195,
          damageMult: 1.0, telegraphMs: 1300, fx: 'strong-kick' },
        { kind: 'recovery', label: 'Thawing', durationMs: 2000 },
      ],
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
