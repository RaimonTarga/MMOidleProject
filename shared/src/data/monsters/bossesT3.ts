import { SUN_MARK_EFFECT_ID, TUNDRA_CHILL_EFFECT_ID } from '../../systems/monsterDebuffs';
import { FROZEN_STATUS_ID } from '../../systems/statusPolicy';
import { ERODED_EFFECT_ID } from '../../systems/bossDebuffs';
import type { PatternPool } from './bossPatterns';

/** Cave T3 sinkhole: slows and erodes (+5% damage taken per second inside, up to 6). */
const SINKHOLE_T3: PatternPool = {
  durationMs: 30_000, damagePerTick: 0, tickIntervalMs: 1000, slowSpeedMult: 0.6,
  flavor: 'sinkhole', label: 'Sinkhole',
  erodes: { effectId: ERODED_EFFECT_ID, damageTakenPctPerStack: 0.05, maxStacks: 6, durationMs: 5000, intervalMs: 1000 },
};
/** Collapse (T3 soft enrage): the sinkholes last longer and pile up. */
const SINKHOLE_T3_COLLAPSE: PatternPool = { ...SINKHOLE_T3, durationMs: 50_000 };
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
  // Identity: "the charge is coming; how do you meet it?"
  //
  // T3's layer (boss-lineage redesign): the DOUBLE CHARGE, and the first control
  // answer on the player's ladder — a root pins the unplated second wind-up.
  // ══════════════════════════════════════════════════════════════════════
  ['crag-gorged-horn-behemoth', {
    id: 'crag-gorged-horn-behemoth', name: 'Crag-Gorged Horn-Behemoth', color: 0x6688cc,
    isBoss: true,
    stats: { hp: 12418, attack: 204, plating: 12, damageReduction: 0.05, speed: 18, attackRange: 72, attackCooldown: 4200, pullRange: 360 },
    behavior: 'melee', attackStyle: 'quake', biome: 'mountain',
    rewards: { essence: 340, essenceType: 'blue', level: 5, biomeXp: 510 },
    ai: { wanderRadius: 100, leashRange: 920, idleMinMs: 3500, idleMaxMs: 8500 },
    targeting: { prefersPlayers: true },
    // T3 = "THE CHARGE IS COMING; HOW DO YOU MEET IT?", with a second question
    // (boss-lineage redesign 2026-09-27). Three phases:
    //   (1) the plated charge carried over from T2 — break the plate to stagger it;
    //   (2) ~60% DOUBLE CHARGE: the plated first charge, then the plate drops and it
    //       re-aims and charges again on a shorter wind-up. The second wind-up is
    //       unplated, so a Binding Strike root pins it (the T3 control answer);
    //   (3) ~25% soft enrage: the sequence comes around sooner and winds up faster.
    //
    // Answers every charge: DODGE (free, but feeds Charge Instinct), BRACE on the
    // telegraph, or STOP it — plate break, or control before/between plates. While
    // plated it ignores root and stun (`blocksControl`).
    //
    // CUT with the redesign: Cragbreaker (it only landed if the charge already hit
    // you — more damage for the same mistake, not a new question). The tackle is
    // the payoff again (damageMult 0.3 -> 1.0).
    bossPattern: {
      chargeInstinct: { speedPct: 0.40, castReductionPct: 0.30, minCastMs: 400, cooldownReductionPct: 0.15 },
      id: 'horn-charge', name: 'Horn Charge',
      damageMultiplier: 2.0, cooldownMs: 9000, initialCooldownMs: 4500,
      stoppedBy: {
        stun: { staggerMs: 2500, label: 'Staggered' },
        root: { staggerMs: 1500, label: 'Stumbled' },
      },
      steps: [
        { kind: 'cast', name: 'Hornplate', castMs: 900, fx: 'shield', guardable: false, rootable: true },
        { kind: 'barrier', sourceId: 'hornplate', shieldPct: 0.05, blocksControl: true,
          onBreak: { staggerMs: 3000, label: 'Plate Shattered' } },
        { kind: 'cast', name: 'Horn Charge', castMs: 2400, fx: 'charge-lane',
          lane: { length: 760, halfWidth: 96, lockAtCastPct: 0.55 } },
        // 760px at 520px/s ≈ 1.5s of travel, or less — it STOPS on the body it hits.
        { kind: 'charge', speed: 520, maxTravelMs: 2200 },
        { kind: 'drop-barrier', sourceId: 'hornplate' },
        { kind: 'recovery', label: 'Overextended', durationMs: 1000 },
      ],
    },
    bossPatternVariants: [{
      chargeInstinct: { speedPct: 0.40, castReductionPct: 0.30, minCastMs: 400, cooldownReductionPct: 0.15 },
      id: 'horn-double-charge', name: 'Double Charge',
      damageMultiplier: 2.0, cooldownMs: 10000, initialCooldownMs: 4500,
      stoppedBy: {
        stun: { staggerMs: 2500, label: 'Staggered' },
        root: { staggerMs: 1500, label: 'Stumbled' },
      },
      steps: [
        { kind: 'cast', name: 'Hornplate', castMs: 900, fx: 'shield', guardable: false, rootable: true },
        { kind: 'barrier', sourceId: 'hornplate', shieldPct: 0.05, blocksControl: true,
          onBreak: { staggerMs: 3000, label: 'Plate Shattered' } },
        { kind: 'cast', name: 'Horn Charge', castMs: 2400, fx: 'charge-lane',
          lane: { length: 760, halfWidth: 96, lockAtCastPct: 0.55 } },
        { kind: 'charge', speed: 520, maxTravelMs: 2200 },
        // The plate comes down after the first run: the re-aim is the unplated
        // wind-up a root or stun can stop.
        { kind: 'drop-barrier', sourceId: 'hornplate' },
        { kind: 'cast', name: 'Second Charge', castMs: 1500, fx: 'charge-lane', rootable: true,
          lane: { length: 700, halfWidth: 96, lockAtCastPct: 0.5 } },
        { kind: 'charge', speed: 560, damageMult: 0.85, maxTravelMs: 2000 },
        { kind: 'recovery', label: 'Overextended', durationMs: 1000 },
      ],
    }],
    bossScript: {
      phases: [
        { hpPct: 0.6, name: 'Double Charge', actions: [
          { type: 'set-pattern', patternId: 'horn-double-charge' },
        ] },
        // Soft enrage: the whole sequence sooner, the wind-ups tighter.
        { hpPct: 0.25, name: 'Crag Rush', actions: [
          { type: 'empower-charged', cooldownMult: 0.70, castMsMult: 0.85 },
          { type: 'stat-buff', stat: 'speed', mult: 1.25, label: 'crag-rush' },
        ] },
      ],
    },
  }],


  // ══════════════════════════════════════════════════════════════════════
  // CAVE — "Deep-Core Burrow-Gorger"
  // Identity: THE BURROWER (boss-lineage redesign). T3 = the tunnel chase and
  // the root answer; erosion is the sinkholes' damage-taken debuff, not plating.
  // ══════════════════════════════════════════════════════════════════════
  ['deep-core-burrow-gorger', {
    id: 'deep-core-burrow-gorger', name: 'Deep-Core Burrow-Gorger', color: 0x332244,
    isBoss: true,
    stats: { hp: 12895, attack: 196, plating: 16, damageReduction: 0.15, speed: 16, attackRange: 72, attackCooldown: 4500, pullRange: 330 },
    behavior: 'melee', attackStyle: 'quake', biome: 'cave',
    rewards: { essence: 355, essenceType: 'red', level: 5, biomeXp: 530 },
    ai: { wanderRadius: 85, leashRange: 890, idleMinMs: 4000, idleMaxMs: 10000 },
    targeting: { prefersPlayers: true },
    // CAVE T3 (boss-lineage redesign 2026-09-27) — three phases, ~2 minutes:
    //   (1) the T2 fight: a targetable mound (drag it up with damage), eruptions
    //       that leave Eroding sinkholes;
    //   (2) ~60% TUNNEL CHASE: it stays under and erupts THREE times in a row along
    //       your path, each surfacing where you just were — keep moving, choose the
    //       path, mind the sinkholes it leaves;
    //   (3) ~25% COLLAPSE, the soft enrage: shorter gaps between burrows, and the
    //       sinkholes last longer and pile up.
    // T3 is where the player's ROOT arrives: a Binding Strike on the travelling
    // mound pins it and forces it up, staggered. CUT: plating shred and its
    // threshold poison.
    bossPattern: {
      id: 'deep-core-emergence', name: 'Deep-Core Burrow',
      damageMultiplier: 1.7, cooldownMs: 8500, initialCooldownMs: 4000,
      stoppedBy: {
        damage: { pctMaxHp: 0.04, staggerMs: 2500, label: 'Dragged Up' },
        root: { staggerMs: 2000, label: 'Pinned Up' },
        stun: { staggerMs: 2500, label: 'Staggered' },
      },
      steps: [
        { kind: 'cast', name: 'Deep Burrow', castMs: 700, fx: 'burrow', guardable: false },
        { kind: 'conceal', name: 'Burrowed', marker: 'burrow', durationMs: 3000,
          relocate: 'near-target', emergeGap: 0, travelSpeed: 420, targetable: true, rootable: true,
          feint: { retreatToPx: 520, untilPct: 0.35 },
          contactSlow: { speedMult: 0.55, durationMs: 1500 },
          surfacesOnContact: true },
        { kind: 'impact', name: 'Deep-Core Eruption', anchor: 'self', radius: 155,
          damageMult: 1.0, telegraphMs: 1000, fx: 'deep-core-eruption', pool: SINKHOLE_T3 },
        { kind: 'recovery', label: 'Surfaced', durationMs: 1000 },
      ],
    },
    bossPatternVariants: [
      {
        id: 'deep-core-tunnel-chase', name: 'Tunnel Chase',
        damageMultiplier: 1.5, cooldownMs: 11000, initialCooldownMs: 4000,
        stoppedBy: {
        damage: { pctMaxHp: 0.04, staggerMs: 2500, label: 'Dragged Up' },
        root: { staggerMs: 2000, label: 'Pinned Up' },
        stun: { staggerMs: 2500, label: 'Staggered' },
      },
        steps: [
          { kind: 'cast', name: 'Deep Burrow', castMs: 700, fx: 'burrow', guardable: false },
        { kind: 'conceal', name: 'Tunnel', marker: 'burrow', durationMs: 2200,
          relocate: 'near-target', emergeGap: 0, travelSpeed: 440, targetable: true, rootable: true,
          surfacesOnContact: true },
        { kind: 'impact', name: 'Deep-Core Eruption', anchor: 'self', radius: 150,
          damageMult: 1.0, telegraphMs: 700, fx: 'deep-core-eruption', pool: SINKHOLE_T3 },
        { kind: 'conceal', name: 'Tunnel', marker: 'burrow', durationMs: 2200,
          relocate: 'near-target', emergeGap: 0, travelSpeed: 440, targetable: true, rootable: true,
          surfacesOnContact: true },
        { kind: 'impact', name: 'Deep-Core Eruption', anchor: 'self', radius: 150,
          damageMult: 1.0, telegraphMs: 700, fx: 'deep-core-eruption', pool: SINKHOLE_T3 },
        { kind: 'conceal', name: 'Tunnel', marker: 'burrow', durationMs: 2200,
          relocate: 'near-target', emergeGap: 0, travelSpeed: 440, targetable: true, rootable: true,
          surfacesOnContact: true },
        { kind: 'impact', name: 'Deep-Core Eruption', anchor: 'self', radius: 150,
          damageMult: 1.0, telegraphMs: 700, fx: 'deep-core-eruption', pool: SINKHOLE_T3 },
          { kind: 'recovery', label: 'Surfaced', durationMs: 1000 },
        ],
      },
      {
        id: 'deep-core-collapse', name: 'Collapse',
        damageMultiplier: 1.5, cooldownMs: 8000, initialCooldownMs: 3000,
        stoppedBy: {
        damage: { pctMaxHp: 0.04, staggerMs: 2500, label: 'Dragged Up' },
        root: { staggerMs: 2000, label: 'Pinned Up' },
        stun: { staggerMs: 2500, label: 'Staggered' },
      },
        steps: [
          { kind: 'cast', name: 'Deep Burrow', castMs: 600, fx: 'burrow', guardable: false },
        { kind: 'conceal', name: 'Tunnel', marker: 'burrow', durationMs: 2200,
          relocate: 'near-target', emergeGap: 0, travelSpeed: 440, targetable: true, rootable: true,
          surfacesOnContact: true },
        { kind: 'impact', name: 'Deep-Core Eruption', anchor: 'self', radius: 150,
          damageMult: 1.0, telegraphMs: 700, fx: 'deep-core-eruption', pool: SINKHOLE_T3_COLLAPSE },
        { kind: 'conceal', name: 'Tunnel', marker: 'burrow', durationMs: 2200,
          relocate: 'near-target', emergeGap: 0, travelSpeed: 440, targetable: true, rootable: true,
          surfacesOnContact: true },
        { kind: 'impact', name: 'Deep-Core Eruption', anchor: 'self', radius: 150,
          damageMult: 1.0, telegraphMs: 700, fx: 'deep-core-eruption', pool: SINKHOLE_T3_COLLAPSE },
        { kind: 'conceal', name: 'Tunnel', marker: 'burrow', durationMs: 2200,
          relocate: 'near-target', emergeGap: 0, travelSpeed: 440, targetable: true, rootable: true,
          surfacesOnContact: true },
        { kind: 'impact', name: 'Deep-Core Eruption', anchor: 'self', radius: 150,
          damageMult: 1.0, telegraphMs: 700, fx: 'deep-core-eruption', pool: SINKHOLE_T3_COLLAPSE },
          { kind: 'recovery', label: 'Surfaced', durationMs: 1000 },
        ],
      },
    ],
    bossScript: {
      phases: [
        { hpPct: 0.6, name: 'Tunnel Chase', actions: [
          { type: 'set-pattern', patternId: 'deep-core-tunnel-chase' },
        ] },
        { hpPct: 0.25, name: 'Collapse', actions: [
          { type: 'set-pattern', patternId: 'deep-core-collapse' },
        ] },
      ],
    },
  }],


  // ══════════════════════════════════════════════════════════════════════
  // SWAMP — "Rot-Spore Croc-Behemoth"
  // Identity: ROT / ATTRITION / HAZARDOUS ARENA. The lineage's finale.
  //
  // T3's layer (boss-lineage redesign): pools that DETONATE, a lash that drags you
  // into them, and a room that rots faster the longer the fight runs.
  // ══════════════════════════════════════════════════════════════════════
  ['rot-spore-croc-behemoth', {
    id: 'rot-spore-croc-behemoth', name: 'Rot-Spore Croc-Behemoth', color: 0x1a3311,
    isBoss: true,
    stats: { hp: 11940, attack: 52, plating: 8, damageReduction: 0.10, speed: 28, attackRange: 18, attackCooldown: 3400, pullRange: 330 },
    behavior: 'melee', attackStyle: 'poison', biome: 'swamp',
    rewards: { essence: 345, essenceType: 'purple', level: 5, biomeXp: 518 },
    ai: { wanderRadius: 105, leashRange: 880, idleMinMs: 2800, idleMaxMs: 7000 },
    targeting: { prefersPlayers: true },
    dotEffect: { debuffId: 'rot-spore-plague', label: 'Rot Spores', damagePerStack: 13, maxStacks: 6, tickIntervalMs: 1000, durationMs: 9000 },
    // SWAMP T3 (boss-lineage redesign 2026-09-27) — three phases, ~2 minutes:
    //   (1) the T2 fight: Bile and Mire pools, and the Mire Lash drag;
    //   (2) ~60% SPORE BLOOM: the lobbed pools are Spore pools that detonate a few
    //       seconds after landing, and the lash now drags you toward a SPORE — the
    //       combo is being yanked into a pool about to pop;
    //   (3) ~25% ROT BLOOM, the soft enrage: every pool spreads toward a cap, and the
    //       whole room builds a rising Rot DoT (cleared when the boss dies). DoT
    //       resistance and Recovery stretch it; killing the boss is the answer.
    // Swamp does not demand Cleanse (the old pool vulnerability is gone); CUT with
    // the redesign: `chargeOnAggro` and the one enormous Rot Bloom pool.
    chargedAttack: {
      name: 'Bile Pool', castMs: 1000, cooldownMs: 8000, initialCooldownMs: 3500,
      multiplier: 1.2, fx: 'strong-kick', aoe: { radius: 130, impactFx: 'pool-spawn' },
      pool: { durationMs: 35000, damagePerTick: 8, tickIntervalMs: 1000, slowSpeedMult: 0.65 },
    },
    bossPattern: {
      id: 'croc-mire-lash', name: 'Mire Lash',
      damageMultiplier: 1.0, cooldownMs: 10000, initialCooldownMs: 6500,
      steps: [
        { kind: 'impact', name: 'Mire Spit', anchor: 'target', radius: 135,
          damageMult: 0.4, telegraphMs: 1000, fx: 'pool-spawn',
          pool: { durationMs: 35000, damagePerTick: 0, tickIntervalMs: 1000,
            slowSpeedMult: 0.40, flavor: 'mire', label: 'Mire' } },
        { kind: 'wait', durationMs: 500 },
        { kind: 'pull', name: 'Mire Lash', castMs: 1100, distance: 300,
          toward: 'nearest-pool', fx: 'trench-current' },
      ],
    },
    bossPatternVariants: [{
      id: 'croc-spore-lash', name: 'Spore Lash',
      damageMultiplier: 1.0, cooldownMs: 9000, initialCooldownMs: 5000,
      steps: [
        // The spore detonates 5s after it lands: telegraph 1s + wait 1.2s + lash
        // 1.1s puts the drag ~2.3s into its life, with ~2.7s left to get out.
        { kind: 'impact', name: 'Spore Spit', anchor: 'target', radius: 135,
          damageMult: 0.4, telegraphMs: 1000, fx: 'pool-spawn',
          pool: { durationMs: 5000, damagePerTick: 6, tickIntervalMs: 1000,
            slowSpeedMult: 0.60, flavor: 'spore', detonationMultiplier: 2.25, label: 'Spore Pool' } },
        { kind: 'wait', durationMs: 1200 },
        { kind: 'pull', name: 'Spore Lash', castMs: 1100, distance: 320,
          toward: 'nearest-pool', poolFlavors: ['spore'], fx: 'trench-current' },
      ],
    }],
    bossScript: {
      phases: [
        { hpPct: 0.6, name: 'Spore Bloom', actions: [
          { type: 'set-pattern', patternId: 'croc-spore-lash' },
          { type: 'enrage', atkMult: 1.0, cdMult: 0.80 }, // spores land faster
        ] },
        { hpPct: 0.25, name: 'Rot Bloom', actions: [
          { type: 'spread-pools', radiusPerSec: 8, maxRadiusMult: 1.8 },
          { type: 'room-affliction', intervalMs: 4000, dot: {
            debuffId: 'rot-bloom', label: 'Rot Bloom', color: '#7fae3a',
            damagePerStack: 6, maxStacks: 20, tickIntervalMs: 1000, durationMs: 12000,
          } },
        ] },
      ],
    },
  }],


  // ══════════════════════════════════════════════════════════════════════
  // DESERT — "Dune-Carapace Monarch"
  // Identity: SETUP / CONTROL -> PUNISHMENT.
  //
  // T3's layer (boss-lineage redesign): the STANDOFF. The same mark -> slow ->
  // Execution sentence, run from range from 50%, with a dash-escape when you close.
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
        { kind: 'apply-status', name: 'Death Sting', castMs: 1100, fx: 'death-sting',
          effectId: SUN_MARK_EFFECT_ID, stacks: 1, durationMs: 6500 },
        { kind: 'wait', durationMs: 850 },
        // NUMBING STING (2026-09-06) — see the T2 Emperor for the shape. One Cleanse,
        // two things worth spending it on, and the pacing denies you both: answer the
        // mark and you eat an unamplified hit you could have walked out of; answer
        // the slow and you walk out of an Execution that would have hit for 1.9x.
        // Deeper than T2's 0.35 because the circle it locks you into is bigger.
        { kind: 'apply-status', name: 'Numbing Sting', castMs: 700, fx: 'numbing-sting',
          effectId: 'slow', stacks: 1, durationMs: 4500, data: { speedMult: 0.3 } },
        { kind: 'wait', durationMs: 600 },
        { kind: 'payoff', name: 'Execution', castMs: 1300, fx: 'execution',
          damageMult: 1.0, amplifiedMult: 1.9,
          consumes: { effectId: SUN_MARK_EFFECT_ID }, radius: 155 },
        { kind: 'recovery', label: 'Spent', durationMs: 1000 },
      ],
    },
    // STANDOFF (boss-lineage redesign 2026-09-27) — the ranged phase, done right.
    // The old kiter backed off at ~43px/s only when you were inside 145px, and its
    // sequence rooted it for most of the phase, so it never really kited. Now at 50%
    // it leaps back to range and runs the sentence FROM there; close in and it
    // dash-escapes back out (Sand Step, rootable). Ranged builds duel it, melee
    // chases it (a few seconds of hits after each dash), a root stops the dash.
    bossPatternVariants: [
      {
        // STANDOFF — the same sentence, run from range. Shorter than the melee
        // version so the Execution never roots the boss into a free melee target.
        id: 'monarch-standoff', name: 'Death Sting',
        damageMultiplier: 1.6, cooldownMs: 8000, initialCooldownMs: 2500,
        steps: [
          { kind: 'apply-status', name: 'Death Sting', castMs: 1000, fx: 'death-sting',
            effectId: SUN_MARK_EFFECT_ID, stacks: 1, durationMs: 6500 },
          { kind: 'wait', durationMs: 500 },
          { kind: 'apply-status', name: 'Numbing Sting', castMs: 600, fx: 'numbing-sting',
            effectId: 'slow', stacks: 1, durationMs: 4000, data: { speedMult: 0.3 } },
          { kind: 'wait', durationMs: 400 },
          { kind: 'payoff', name: 'Execution', castMs: 1100, fx: 'execution',
            damageMult: 1.0, amplifiedMult: 1.9,
            consumes: { effectId: SUN_MARK_EFFECT_ID }, radius: 155 },
        ],
      },
      {
        // The dash-escape: close in on it and it springs back to range. Visible
        // (~260px/s, far faster than a player), on a 6s clock, and a ROOT stops it.
        id: 'monarch-sand-step', name: 'Sand Step',
        damageMultiplier: 1, cooldownMs: 6000, initialCooldownMs: 0,
        armWhenTargetWithinPx: 210,
        stoppedBy: { root: { staggerMs: 1500, label: 'Pinned' }, stun: { staggerMs: 2000, label: 'Staggered' } },
        steps: [
          { kind: 'dash', name: 'Sand Step', direction: 'away', speed: 260, distance: 420,
            maxTravelMs: 1800, rootable: true, fx: 'predator-flee' },
        ],
      },
    ],
    bossScript: {
      phases: [
        { hpPct: 0.5, name: 'Standoff', actions: [
          { type: 'morph', isRanged: true, attackStyle: 'sandblast', attackRange: 240, kite: false },
          { type: 'set-pattern', patternId: 'monarch-standoff' },
          { type: 'add-pattern', patternId: 'monarch-sand-step' },
        ] },
        // Soft enrage: the sentence repeats faster.
        { hpPct: 0.2, name: 'Sandstorm', actions: [{ type: 'empower-charged', cooldownMult: 0.65 }] },
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
    // JUNGLE (boss-lineage redesign 2026-09-27) — PURSUIT AND FAILED ESCAPE.
    //   FLEE: behind an Escape Guard it bolts, fast enough that an ordinary chaser
    //     usually loses it. Stop it by BREAKING the guard (the ranged answer), by
    //     HINDERING it (slow shortens the run; root at T3+, stun at T4 end it), or by
    //     catching it with a gap-closer. A stopped flee is a <=1s stumble, not a
    //     window: staying in the fight and losing its ambush IS its punishment.
    //     Failed flees bank Escape Instinct (the next is faster).
    //   ESCAPED: it stalks back unseen and AMBUSHES — then FRENZIES for ~5s
    //     (+attack speed, +damage): the burst window you pay for letting it go.
    //     Guard the reveal, out-defend the frenzy, or deny the escape.
    //   T3: the ROOT answer arrives (a Binding Strike ends the flee); ~60% the
    //   Venomous Bite opens the ambush (short-lived poison, burst not attrition);
    //   ~25% Hunted, the soft enrage: it flees far more often.
    bossPattern: {
      id: 'timberclaw-escape', name: 'Escape',
      damageMultiplier: 2.0, cooldownMs: 13000, initialCooldownMs: 7000,
      stoppedBy: {
        // A stopped flee is NOT a stagger window (principle 5 exception): being
        // stopped is already its punishment. A <=1s stumble with the stun tell.
        stun: { staggerMs: 1000, label: 'Stumbled' },
        root: { staggerMs: 1000, label: 'Stumbled' },
      },
      steps: [
        { kind: 'escape-guard', name: 'Flee', castMs: 3000, fx: 'predator-flee',
          sourceId: 'jungle-escape', shieldPct: 0.05,
          onBreak: { staggerMs: 1000, label: 'Caught' },
          instinctSpeedPct: 0.30, rootable: true,
          flee: { speed: 370, escapeDistance: 450 } },
        { kind: 'conceal', name: 'Vanished', marker: 'stealth', durationMs: 6000,
          relocate: 'near-target', emergeGap: 30, travelSpeed: 240, surfacesOnContact: true },
        { kind: 'payoff', name: 'Ambush', castMs: 300, fx: 'savage-maul',
          damageMult: 1.0, reach: 90 },
        { kind: 'frenzy', name: 'Frenzy', durationMs: 5000, attackSpeedPct: 0.35, damagePct: 0.20 },
      ],
    },
    bossPatternVariants: [{
      id: 'bramble-venom-escape', name: 'Escape',
      damageMultiplier: 2.0, cooldownMs: 12000, initialCooldownMs: 5000,
      stoppedBy: {
        // A stopped flee is NOT a stagger window (principle 5 exception): being
        // stopped is already its punishment. A <=1s stumble with the stun tell.
        stun: { staggerMs: 1000, label: 'Stumbled' },
        root: { staggerMs: 1000, label: 'Stumbled' },
      },
      steps: [
        { kind: 'escape-guard', name: 'Flee', castMs: 3000, fx: 'predator-flee',
          sourceId: 'jungle-escape', shieldPct: 0.05,
          onBreak: { staggerMs: 1000, label: 'Caught' },
          instinctSpeedPct: 0.30, rootable: true,
          flee: { speed: 370, escapeDistance: 450 } },
        { kind: 'conceal', name: 'Vanished', marker: 'stealth', durationMs: 6000,
          relocate: 'near-target', emergeGap: 30, travelSpeed: 240, surfacesOnContact: true },
        { kind: 'payoff', name: 'Venomous Bite', castMs: 300, fx: 'savage-maul',
          damageMult: 1.0, reach: 90,
          onHitPoison: { stacks: 4, damagePerStack: 16, durationMs: 4000, tickIntervalMs: 1000 } },
        { kind: 'frenzy', name: 'Frenzy', durationMs: 5000, attackSpeedPct: 0.35, damagePct: 0.20 },
      ],
    }],
    bossScript: {
      phases: [
        { hpPct: 0.6, name: 'Venomous Bite', actions: [
          { type: 'set-pattern', patternId: 'bramble-venom-escape' },
        ] },
        { hpPct: 0.25, name: 'Hunted', actions: [
          { type: 'empower-charged', cooldownMult: 0.60 },
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
  // At low health it races the player with one final eruption.
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
        flavor: 'magma-vent', rampAccelMult: 3, pullDistance: 200,
      },
    },
    bossPattern: {
      id: 'final-eruption', name: 'Final Eruption',
      damageMultiplier: 1, cooldownMs: 60000, initialCooldownMs: 0,
      armBelowHpPct: 0.25, oncePerLife: true,
      steps: [
        { kind: 'cast', name: 'Final Eruption', castMs: 8000, fx: 'cataclysm-cast', interruptible: false },
        { kind: 'impact', name: 'Final Eruption', anchor: 'self', radius: 2000,
          damageMult: 1, rawDamage: 650, interruptible: false, telegraphMs: 400, fx: 'cataclysm-impact' },
        { kind: 'recovery', label: 'Spent', durationMs: 1000 },
      ],
    },
    bossScript: {
      phases: [
        // Each cycle is worth more to it: the shell holds longer and the vent that
        // comes with it burns hotter. One idea, tightened.
        { hpPct: 0.5, actions: [{ type: 'stat-buff', stat: 'attack', mult: 1.15, label: 'cinder-fury' }] },
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
        { kind: 'apply-status', name: 'Deep Freeze', castMs: 1400, fx: 'frostbind',
          effectId: FROZEN_STATUS_ID, stacks: 1, durationMs: 2200,
          requires: { effectId: TUNDRA_CHILL_EFFECT_ID, minStacks: 4 } },
        { kind: 'impact', name: 'Shatter', anchor: 'self', radius: 195,
          damageMult: 1.0, telegraphMs: 1300, fx: 'shatter' },
        { kind: 'recovery', label: 'Thawing', durationMs: 1000 },
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
