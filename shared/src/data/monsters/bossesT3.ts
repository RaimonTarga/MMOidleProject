import { SUN_MARK_EFFECT_ID, TUNDRA_CHILL_EFFECT_ID } from '../../systems/monsterDebuffs';
import { FROZEN_STATUS_ID } from '../../systems/statusPolicy';
import { BOSS_BRITTLE_EFFECT_ID, FROSTBITE_EFFECT_ID } from '../../systems/bossDebuffs';
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
    stats: { hp: 16070, attack: 204, plating: 20, damageReduction: 0.15, speed: 18, attackRange: 72, attackCooldown: 4200, pullRange: 360 },
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
        { hpPct: 0.6, name: 'Double Charge',
          description: 'After the plated charge the Hornplate drops and it re-aims for a second charge. That unplated wind-up can be stopped with a root or a stun.',
          actions: [
          { type: 'set-pattern', patternId: 'horn-double-charge' },
        ] },
        // Soft enrage: the whole sequence sooner, the wind-ups tighter.
        { hpPct: 0.25, name: 'Crag Rush',
          description: 'It moves 25% faster, and its charges wind up quicker and come around more often.',
          actions: [
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
    stats: { hp: 14360, attack: 196, plating: 12, damageReduction: 0.35, speed: 16, attackRange: 72, attackCooldown: 4500, pullRange: 330 },
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
        { kind: 'conceal', name: 'Burrowed', marker: 'burrow', durationMs: 3000, burst: { mult: 2.2, ms: 900 },
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
        { kind: 'conceal', name: 'Tunnel', marker: 'burrow', durationMs: 2200, burst: { mult: 2.2, ms: 900 },
          relocate: 'near-target', emergeGap: 0, travelSpeed: 440, targetable: true, rootable: true,
          surfacesOnContact: true },
        { kind: 'impact', name: 'Deep-Core Eruption', anchor: 'self', radius: 150,
          damageMult: 1.0, telegraphMs: 700, fx: 'deep-core-eruption', pool: SINKHOLE_T3 },
        { kind: 'conceal', name: 'Tunnel', marker: 'burrow', durationMs: 2200, burst: { mult: 2.2, ms: 900 },
          relocate: 'near-target', emergeGap: 0, travelSpeed: 440, targetable: true, rootable: true,
          surfacesOnContact: true },
        { kind: 'impact', name: 'Deep-Core Eruption', anchor: 'self', radius: 150,
          damageMult: 1.0, telegraphMs: 700, fx: 'deep-core-eruption', pool: SINKHOLE_T3 },
        { kind: 'conceal', name: 'Tunnel', marker: 'burrow', durationMs: 2200, burst: { mult: 2.2, ms: 900 },
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
        { kind: 'conceal', name: 'Tunnel', marker: 'burrow', durationMs: 2200, burst: { mult: 2.2, ms: 900 },
          relocate: 'near-target', emergeGap: 0, travelSpeed: 440, targetable: true, rootable: true,
          surfacesOnContact: true },
        { kind: 'impact', name: 'Deep-Core Eruption', anchor: 'self', radius: 150,
          damageMult: 1.0, telegraphMs: 700, fx: 'deep-core-eruption', pool: SINKHOLE_T3_COLLAPSE },
        { kind: 'conceal', name: 'Tunnel', marker: 'burrow', durationMs: 2200, burst: { mult: 2.2, ms: 900 },
          relocate: 'near-target', emergeGap: 0, travelSpeed: 440, targetable: true, rootable: true,
          surfacesOnContact: true },
        { kind: 'impact', name: 'Deep-Core Eruption', anchor: 'self', radius: 150,
          damageMult: 1.0, telegraphMs: 700, fx: 'deep-core-eruption', pool: SINKHOLE_T3_COLLAPSE },
        { kind: 'conceal', name: 'Tunnel', marker: 'burrow', durationMs: 2200, burst: { mult: 2.2, ms: 900 },
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
        { hpPct: 0.6, name: 'Tunnel Chase',
          description: 'It tunnels after you three times in a row, erupting beneath you and leaving sinkholes. Damage, root or stun the mound to drag it up early.',
          actions: [
          { type: 'set-pattern', patternId: 'deep-core-tunnel-chase' },
        ] },
        { hpPct: 0.25, name: 'Collapse',
          description: 'The tunnel chase comes around faster, and its sinkholes last far longer. The arena is closing in: finish it.',
          actions: [
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
    stats: { hp: 10790, attack: 52, plating: 8, damageReduction: 0.30, speed: 28, attackRange: 18, attackCooldown: 3400, pullRange: 330 },
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
    // Playtest 2026-09-27: the pools never became a threat. They are bigger, last
    // over a minute, and Bile Rain lobs a spread of them around you every cycle.
    chargedAttack: {
      name: 'Bile Pool', castMs: 1000, cooldownMs: 8000, initialCooldownMs: 3500,
      multiplier: 1.2, fx: 'bile-spew', aoe: { radius: 175, impactFx: 'pool-spawn' },
      pool: { durationMs: 75000, damagePerTick: 8, tickIntervalMs: 1000, slowSpeedMult: 0.65 },
    },
    bossPattern: {
      id: 'croc-mire-lash', name: 'Mire Lash',
      damageMultiplier: 1.0, cooldownMs: 10000, initialCooldownMs: 6500,
      steps: [
        { kind: 'impact', name: 'Mire Spit', anchor: 'target', radius: 180,
          damageMult: 0.4, telegraphMs: 1000, fx: 'pool-spawn',
          pool: { durationMs: 75000, damagePerTick: 0, tickIntervalMs: 1000,
            slowSpeedMult: 0.40, flavor: 'mire', label: 'Mire' } },
        { kind: 'wait', durationMs: 500 },
        { kind: 'pull', name: 'Mire Lash', castMs: 1100, distance: 300,
          toward: 'nearest-pool', fx: 'mire-lash' },
      ],
    },
    bossPatternVariants: [{
      id: 'croc-spore-lash', name: 'Spore Lash',
      damageMultiplier: 1.0, cooldownMs: 9000, initialCooldownMs: 5000,
      steps: [
        // The spore detonates 5s after it lands: telegraph 1s + wait 1.2s + lash
        // 1.1s puts the drag ~2.3s into its life, with ~2.7s left to get out.
        { kind: 'impact', name: 'Spore Spit', anchor: 'target', radius: 165,
          damageMult: 0.4, telegraphMs: 1000, fx: 'pool-spawn',
          pool: { durationMs: 5000, damagePerTick: 6, tickIntervalMs: 1000,
            slowSpeedMult: 0.60, flavor: 'spore', detonationMultiplier: 2.25, label: 'Spore Pool' } },
        { kind: 'wait', durationMs: 1200 },
        { kind: 'pull', name: 'Spore Lash', castMs: 1100, distance: 320,
          toward: 'nearest-pool', poolFlavors: ['spore'], fx: 'mire-lash' },
      ],
    }, {
      id: 'croc-bile-rain', name: 'Bile Rain',
      damageMultiplier: 1.0, cooldownMs: 11000, initialCooldownMs: 4500,
      steps: [
        { kind: 'cast', name: 'Bile Rain', castMs: 800, fx: 'bile-heave' },
        { kind: 'rockfall', name: 'Bile Rain', fx: 'bile-rain', count: 6, radius: 125, spread: 640, delayMs: 1400,
          damageMult: 0.3,
          pool: { durationMs: 60000, damagePerTick: 8, tickIntervalMs: 1000, slowSpeedMult: 0.65, label: 'Bile Pool' } },
      ],
    }],
    bossScript: {
      phases: [
        { hpPct: 1.0, actions: [{ type: 'add-pattern', patternId: 'croc-bile-rain' }] },
        { hpPct: 0.6, name: 'Spore Bloom',
          description: 'Its spit now lays Spore Pools that detonate a few seconds after landing, and the lash drags you toward them. Get out before they pop.',
          actions: [
          { type: 'set-pattern', patternId: 'croc-spore-lash' },
          { type: 'enrage', atkMult: 1.0, cdMult: 0.80 }, // spores land faster
        ] },
        { hpPct: 0.25, name: 'Rot Bloom',
          description: 'Every pool spreads, and the whole room builds a rising Rot DoT until the boss dies. DoT resistance and Recovery buy time; killing it is the answer.',
          actions: [
          { type: 'set-weather', weather: 'spores' },
          { type: 'spread-pools', radiusPerSec: 8, maxRadiusMult: 1.5 }, // pools start bigger now
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
    stats: { hp: 15800, attack: 196, plating: 10, damageReduction: 0.30, speed: 42, attackRange: 20, attackCooldown: 3000, pullRange: 350 },
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
      // 2026-09-27 T4 power curve: Execution 1.6 -> 1.35 (win rate held as the fight grew x1.6).
      damageMultiplier: 1.35, cooldownMs: 9000, initialCooldownMs: 4500,
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
        damageMultiplier: 1.35, cooldownMs: 8000, initialCooldownMs: 2500,
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
          { kind: 'dash', name: 'Sand Step', direction: 'away', speed: 620, distance: 440,
            maxTravelMs: 1000, rootable: true, fx: 'predator-flee' },
        ],
      },
    ],
    bossScript: {
      phases: [
        { hpPct: 0.5, name: 'Standoff',
          description: 'It fights from range with stings: Death Sting marks you, Numbing Sting slows you and Execution cashes the mark in. Close in and it Sand Steps away; root it to stop the escape.',
          actions: [
          { type: 'morph', isRanged: true, attackStyle: 'sandblast', attackRange: 240, kite: false },
          { type: 'set-pattern', patternId: 'monarch-standoff' },
          { type: 'add-pattern', patternId: 'monarch-sand-step' },
        ] },
        // Soft enrage: the sentence repeats faster.
        { hpPct: 0.2, name: 'Sandstorm',
          description: 'Its sting sequence comes around much faster.',
          actions: [{ type: 'empower-charged', cooldownMult: 0.65 }, { type: 'set-weather', weather: 'sandstorm' }] },
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
    stats: { hp: 22400, attack: 104, plating: 0, damageReduction: 0.05, speed: 64, attackRange: 18, attackCooldown: 1500, pullRange: 340 },
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
          flee: { speed: 600, escapeDistance: 660 } },
        { kind: 'conceal', name: 'Vanished', marker: 'stealth', durationMs: 6000,
          relocate: 'near-target', emergeGap: 30, travelSpeed: 240, surfacesOnContact: true },
        { kind: 'payoff', name: 'Ambush', castMs: 300, fx: 'ambush-pounce',
          damageMult: 1.0, reach: 90 },
        { kind: 'frenzy', name: 'Frenzy', durationMs: 5000, attackSpeedPct: 0.35, damagePct: 0.20 },
      ],
    },
    bossPatternVariants: [{
      id: 'bramble-venom-escape', name: 'Escape',
      // 2026-09-27 T4 power curve: 2.0 -> 1.5 and poison 16 -> 10, keeping the win rate as the fight grew x2.
      damageMultiplier: 1.5, cooldownMs: 12000, initialCooldownMs: 5000,
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
          flee: { speed: 600, escapeDistance: 660 } },
        { kind: 'conceal', name: 'Vanished', marker: 'stealth', durationMs: 6000,
          relocate: 'near-target', emergeGap: 30, travelSpeed: 240, surfacesOnContact: true },
        { kind: 'payoff', name: 'Venomous Bite', castMs: 300, fx: 'venom-pounce',
          damageMult: 1.0, reach: 90,
          onHitPoison: { stacks: 4, damagePerStack: 10, durationMs: 4000, tickIntervalMs: 1000 } },
        { kind: 'frenzy', name: 'Frenzy', durationMs: 5000, attackSpeedPct: 0.35, damagePct: 0.20 },
      ],
    }],
    bossScript: {
      phases: [
        { hpPct: 0.6, name: 'Venomous Bite',
          description: 'After fleeing it vanishes and ambushes you with a Venomous Bite that poisons heavily. Root or stun the flee before it gets away.',
          actions: [
          { type: 'set-pattern', patternId: 'bramble-venom-escape' },
        ] },
        { hpPct: 0.25, name: 'Hunted',
          description: 'Its signature attack comes around far more often.',
          actions: [
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
    stats: { hp: 18760, attack: 130, plating: 8, damageReduction: 0.30, speed: 26, attackRange: 18, attackCooldown: 3000, pullRange: 340 },
    behavior: 'melee', attackStyle: 'fire', biome: 'volcanic',
    rewards: { essence: 360, essenceType: 'red', level: 5, biomeXp: 540 },
    ai: { wanderRadius: 120, leashRange: 920, idleMinMs: 2500, idleMaxMs: 7000 },
    targeting: { prefersPlayers: true },
    // VOLCANIC (boss-lineage redesign 2026-09-27) — THE HEAT RACE.
    //   VENTS around the arena (not under the boss), and the boss KEEPS ATTACKING
    //   — the old shell cycle, whose no-attack window relieved the pressure, is cut.
    //   Standing on a vent speeds up your Heat (more damage dealt AND taken); every
    //   vent erupts on its own telegraphed rhythm, and you must be off it when it
    //   does. Pull the fight onto a vent if you want the Heat; bots that ignore vents
    //   forgo the bonus (vents are never auto-avoided; eruptions are Step Back).
    //   FINAL STRIKE at 25%: it stops attacking and charges an UNINTERRUPTIBLE blast
    //   (Volcanic accepts no control) — a hard DPS check whose fixed raw hit an extreme
    //   tank build (full tank gear + Guard) can survive. The long cast IS the soft
    //   enrage; its length is the numbers-pass knob (~1.3x the median time to kill
    //   the last quarter).
    //   T3: (1) Heat + erupting vents; (2) ~50% the caldera opens — Heat builds
    //   faster, vents erupt more often; (3) 25% Final Eruption.
    controlImmune: true,
    bossPattern: {
      id: 'final-eruption', name: 'Final Eruption',
      damageMultiplier: 1, cooldownMs: 60000, initialCooldownMs: 0,
      armBelowHpPct: 0.25, oncePerLife: true,
      steps: [
        // 2026-09-27 T4 power curve: the DPS check stretches x1.9 with the fight (the arena's
        // Heat clock does too, in nodeFeatures.ts volcanicHeat).
        { kind: 'cast', name: 'Final Eruption', castMs: 42000, fx: 'cataclysm-cast', interruptible: false,
          announce: 'final-eruption' },
        // Unevadable: an evasion build must not dodge its way past the DPS check.
        { kind: 'impact', name: 'Final Eruption', anchor: 'self', radius: 2000,
          damageMult: 1, rawDamage: 650, interruptible: false, unevadable: true, telegraphMs: 400, fx: 'cataclysm-impact' },
        { kind: 'recovery', label: 'Spent', durationMs: 1000 },
      ],
    },
    bossScript: {
      phases: [
        // Playtest 2026-09-27: vents were no threat. More, bigger, harder-hitting,
        // and from Caldera Opens fissures split new ones open under the player.
        { hpPct: 1.0, actions: [
          { type: 'vent-field', count: 6, radius: 200, ringRadius: 520, rampAccelMult: 3,
            eruptEveryMs: 8000, telegraphMs: 1600, damageMult: 1.5 },
          // Playtest 2026-09-27: vents also keep splitting open AROUND THE BOSS.
          { type: 'vent-spawner', everyMs: 3000, count: 1, minRadius: 60, maxRadius: 440, radius: 150, telegraphMs: 1400, lingerMs: 2200, damageMult: 1.4, rampAccelMult: 3 },
        ] },
        { hpPct: 0.5, name: 'Caldera Opens',
          description: 'More vents open and erupt more often, vents split open around the boss twice as fast, fissures open under you, and your Heat builds faster. Take the Heat, but be off a vent when it erupts.',
          actions: [
          { type: 'vent-field', count: 8, radius: 220, ringRadius: 520, rampAccelMult: 3,
            eruptEveryMs: 5500, telegraphMs: 1500, damageMult: 1.5,
            fissure: { everyMs: 9000, maxVents: 14 } },
          { type: 'vent-spawner', everyMs: 1900, count: 2, minRadius: 60, maxRadius: 440, radius: 150, telegraphMs: 1350, lingerMs: 2200, damageMult: 1.4, rampAccelMult: 3 },
          { type: 'stoke-ramp', rampMsMult: 0.7 },
        ] },
        { hpPct: 0.25, name: 'Final Eruption',
          description: 'It stops attacking and charges an eruption that hits the whole arena, while vents burst open all around it. The eruption cannot be interrupted or evaded: kill it before the cast ends, or survive the blast with Guard and tank gear.',
          actions: [
          { type: 'set-weather', weather: 'ashfall' },
          // The race against the Final Eruption, under a near-bullet-hell of vents.
          { type: 'vent-spawner', everyMs: 800, count: 2, minRadius: 60, maxRadius: 440, radius: 140, telegraphMs: 1300, lingerMs: 2200, damageMult: 1.4, rampAccelMult: 3 },
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
    stats: { hp: 19100, attack: 204, plating: 22, damageReduction: 0.15, speed: 18, attackRange: 20, attackCooldown: 4200, pullRange: 360 },
    behavior: 'melee', attackStyle: 'frost', biome: 'tundra',
    rewards: { essence: 350, essenceType: 'blue', level: 5, biomeXp: 525 },
    ai: { wanderRadius: 100, leashRange: 900, idleMinMs: 3000, idleMaxMs: 8000 },
    targeting: { prefersPlayers: true },
    // TUNDRA (boss-lineage redesign 2026-09-27) — THE CHILL CLOCK.
    //   The room builds Chill; FROSTBITE stacks slowly on top, cannot be cleansed,
    //   and makes Chill build faster. Cleanse still strips Chill (partially) but only
    //   DELAYS the freeze: DEEP FREEZE fires when you reach the threshold, and
    //   resolving it spends both. Your build sets how often freezes come, never
    //   whether. The FROST BURST is centred on the frozen player, so ranged builds
    //   are tested too. Reactive posture: FROST NOVA when you are close (step out),
    //   FROST SPIKES when you are far (a root, then it walks up — Break Free).
    //   Tundra accepts NO control (`controlImmune`): stuns and roots do not land.
    //   T3: (1) the clock; (2) ~50% BRITTLE: a Frost Burst cracks you and a heavy
    //   Shatter swing follows; (3) ~20% BLIZZARD, the soft enrage: Frostbite and
    //   Chill build faster and faster. (The stale 25% Ice Armor is gone.)
    controlImmune: true,
    bossPattern: {
      id: 'rime-deep-freeze', name: 'Deep Freeze',
      damageMultiplier: 1.7, cooldownMs: 3000, initialCooldownMs: 3000,
      // Fires when YOU reach the Chill threshold, never on a timer.
      armWhenTargetStatus: { effectId: TUNDRA_CHILL_EFFECT_ID, minStacks: 4 },
      priority: 2,
      steps: [
        { kind: 'apply-status', name: 'Deep Freeze', castMs: 1200, fx: 'frostbind',
          effectId: FROZEN_STATUS_ID, stacks: 1, durationMs: 2200,
          requires: { effectId: TUNDRA_CHILL_EFFECT_ID, minStacks: 4 },
          // The freeze spends the cold that fed it: Chill and Frostbite start over.
          consumesOnResolve: [TUNDRA_CHILL_EFFECT_ID, FROSTBITE_EFFECT_ID] },
        // FROST BURST, centred on the frozen player — ranged builds are tested too.
        // Break Free then step out, Guard it, or tank it (Tundra armor).
        { kind: 'impact', name: 'Frost Burst', anchor: 'target', radius: 190,
          damageMult: 1.0, telegraphMs: 1300, fx: 'shatter', },
        { kind: 'recovery', label: 'Thawing', durationMs: 1000 },
      ],
    },
    bossPatternVariants: [
    {
      id: 'rime-deep-freeze-brittle', name: 'Deep Freeze',
      damageMultiplier: 1.7, cooldownMs: 3000, initialCooldownMs: 3000,
      // Fires when YOU reach the Chill threshold, never on a timer.
      armWhenTargetStatus: { effectId: TUNDRA_CHILL_EFFECT_ID, minStacks: 4 },
      priority: 2,
      steps: [
        { kind: 'apply-status', name: 'Deep Freeze', castMs: 1200, fx: 'frostbind',
          effectId: FROZEN_STATUS_ID, stacks: 1, durationMs: 2200,
          requires: { effectId: TUNDRA_CHILL_EFFECT_ID, minStacks: 4 },
          // The freeze spends the cold that fed it: Chill and Frostbite start over.
          consumesOnResolve: [TUNDRA_CHILL_EFFECT_ID, FROSTBITE_EFFECT_ID] },
        // FROST BURST, centred on the frozen player — ranged builds are tested too.
        // Break Free then step out, Guard it, or tank it (Tundra armor).
        { kind: 'impact', name: 'Frost Burst', anchor: 'target', radius: 190,
          damageMult: 1.0, telegraphMs: 1300, fx: 'shatter',
          appliesDebuff: { effectId: BOSS_BRITTLE_EFFECT_ID, durationMs: 4000, data: { damageTakenPct: 0.30 } }, },
        // BRITTLE -> SHATTER: the heavy follow-up swing on a cracked target. Guard it,
        // or be out of its reach when it lands.
        { kind: 'payoff', name: 'Shatter', castMs: 1400, fx: 'shatter', damageMult: 1.2, reach: 70 },
        { kind: 'recovery', label: 'Thawing', durationMs: 1000 },
      ],
    },
    {
      // REACTIVE POSTURE, close: a telegraphed burst around the boss that adds Chill.
      id: 'rime-frost-nova', name: 'Frost Nova',
      damageMultiplier: 1.7, cooldownMs: 10000, initialCooldownMs: 5000,
      armWhenTargetWithinPx: 170, priority: 1,
      steps: [
        { kind: 'impact', name: 'Frost Nova', anchor: 'self', radius: 200,
          damageMult: 0.6, telegraphMs: 1100, fx: 'shatter', addsAmbientStacks: 2 },
      ],
    },
    {
      // REACTIVE POSTURE, far: a spike volley that roots, then the boss walks up.
      id: 'rime-frost-spikes', name: 'Frost Spikes',
      damageMultiplier: 1.7, cooldownMs: 10000, initialCooldownMs: 3000,
      armWhenTargetBeyondPx: 320, priority: 1,
      steps: [
        { kind: 'apply-status', name: 'Frost Spikes', castMs: 900, fx: 'frostbind',
          effectId: 'slow', stacks: 1, durationMs: 1800, data: { speedMult: 0 } },
        { kind: 'dash', name: 'Advance', direction: 'to-target', speed: 150, reach: 20,
          maxTravelMs: 2500, interruptible: false },
      ],
    },
    ],
    bossScript: {
      phases: [
        { hpPct: 1.0, actions: [
          { type: 'add-pattern', patternId: 'rime-frost-nova' },
          { type: 'add-pattern', patternId: 'rime-frost-spikes' },
          // 2026-09-27 T4 power curve: Frostbite and Chill clocks x1.6 with the fight length (HP x1.5).
          { type: 'room-debuff', effectId: FROSTBITE_EFFECT_ID, intervalMs: 9600, maxStacks: 10,
            data: { uncleansable: 1, ambientRampAccelPct: 0.12 } },
        ] },
        { hpPct: 0.5, name: 'Brittle',
          description: 'Deep Freeze now leaves you Brittle, and a heavy Shatter follows it. Guard the Shatter, or be out of reach when it lands.',
          actions: [
          { type: 'set-pattern', patternId: 'rime-deep-freeze-brittle' },
        ] },
        { hpPct: 0.2, name: 'Blizzard',
          description: 'A blizzard fills the room: Frostbite stacks on you faster and faster, and your Chill builds quicker. Frostbite cannot be cleansed; end the fight.',
          actions: [
          { type: 'set-weather', weather: 'blizzard' },
          { type: 'room-debuff', effectId: FROSTBITE_EFFECT_ID, intervalMs: 6400, maxStacks: 10,
            data: { uncleansable: 1, ambientRampAccelPct: 0.12 },
            accelerate: { intervalMult: 0.85, minIntervalMs: 1500 } },
          { type: 'stoke-ramp', rampMsMult: 0.96 },
        ] },
      ],
    },
  }],
] satisfies [string, MonsterDefinition][];
