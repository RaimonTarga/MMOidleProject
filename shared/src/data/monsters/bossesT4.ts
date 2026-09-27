import { SUN_MARK_EFFECT_ID, TUNDRA_CHILL_EFFECT_ID } from '../../systems/monsterDebuffs';
import { FROZEN_STATUS_ID } from '../../systems/statusPolicy';
import { BOSS_BRITTLE_EFFECT_ID, DEPTH_EFFECT_ID, FROSTBITE_EFFECT_ID, REND_EFFECT_ID, HEX_OF_RUIN_EFFECT_ID } from '../../systems/bossDebuffs';
import type { MonsterDefinition } from './types';

// ════════════════════════════════════════════════════════════════════════
// T4 BOSS CONFIGURATIONS
// Seven active biomes: Mountain · Desert · Jungle · Tundra · Volcanic
//                       Wasteland · Trench
//
// ── T4 PHILOSOPHY, REWRITTEN BY THE ENCOUNTER REWORK (2026-08-23) ───────
// The old philosophy was "the exam for every spec, item and range choice the
// player has made", implemented as a shared template: cadenceFinisher at base,
// `apply-soft-cap` / `apply-shield` at 50%, `shed-defense` plus a big attack
// multiplier at 25%. Seven encounters wore the same three beats.
//
// The new rule: **each boss is the apex expression of its BIOME's combat idea.**
// A mature T4 encounter may carry several mechanics, but every one has to
// reinforce the same identity, and a simple T4 boss with one excellent mechanic
// beats a kitchen-sink boss. Tier is a complexity CEILING, not a checklist.
//
// Removed tier-wide as generic:
//   • `apply-soft-cap` (Mountain, Tundra) — existed to clip the player's big hits
//     because "T4 needs a defensive layer", not because either encounter is about
//     that. `shed-defense` went with it, since it only ever undid the soft-cap.
//   • Tundra's `modify-ramp-debuff` to 85% move / 70% attack — the player should
//     feel increasingly suppressed, never functionally unable to play.
//   • Volcanic's private `rampOnCombat` — a parallel damage ramp duplicating the
//     biome-level Heat that is now the encounter.
//   • every anti-summon `aoeAttack` (see `targeting.prefersPlayers`).
//
// ⚠ NUMBERS: stat blocks are inherited, not re-pitched. Several of these bosses
// LOST a source of pressure in this pass (Jungle's cadence finisher, Volcanic's
// ramp, Wasteland's DoT package); the dedicated balance pass owns whether raw
// stats need to compensate.
//
// ── BOSS SCRIPT ACTIONS USED HERE ───────────────────────────────────────
//   empower-charged — scale the boss's signature telegraphed attack (multiplier,
//     cooldown, radius, cast, aftershock rays). Composes across phases. This is
//     the rework's default escalation: deepen the one idea, don't add a new one.
//   stoke-ramp      — bend the node's ambient ramp (Volcanic Heat): accumulate
//     faster, hold a minimum floor, raise the ceiling. Node-scoped; cleared when
//     the boss dies.
//   raise-dead      — burst-resurrect corpses the player already made (Wasteland).
//   spawn-pool      — lay a hazard pool centred on the boss.
//   apply-shield    — a runtime barrier, optionally with the brittle-shell
//     `shatter` rider (Tundra Ice Armor).
//   spawn-adds      — tracked adds, despawned when the boss dies.
//   morph · enrage · stat-buff · roar — as before.
// ════════════════════════════════════════════════════════════════════════

export const bossMonsterEntriesT4 = [

  // ══════════════════════════════════════════════════════════════════════
  // MOUNTAIN — "Iron-Crest Titan"
  // Identity: "the charge is coming; how do you meet it?", every answer at once.
  //
  // The lineage's arc (boss-lineage redesign): T1 lane charge → T2 behind a plate
  // you can break → T3 a second, rootable charge → T4 under Rockfall, then a triple.
  // ══════════════════════════════════════════════════════════════════════
  ['iron-crest-titan', {
    id: 'iron-crest-titan', name: 'Iron-Crest Titan', color: 0x8899bb,
    isBoss: true,
    stats: { hp: 73140, attack: 228, plating: 28, damageReduction: 0.15, speed: 16, attackRange: 20, attackCooldown: 4200, pullRange: 420 },
    behavior: 'melee', attackStyle: 'quake', biome: 'mountain',
    rewards: { essence: 620, essenceType: 'blue', level: 5, biomeXp: 930 },
    ai: { wanderRadius: 95, leashRange: 960, idleMinMs: 4000, idleMaxMs: 10000 },
    targeting: { prefersPlayers: true },
    // T4 = the whole Mountain answer set (boss-lineage redesign 2026-09-27). Four
    // phases, each asking a new question of the same charge:
    //   (1) the plated charge (the T2/T3 fight) — break the plate, or dodge/Brace;
    //   (2) ~65% DOUBLE CHARGE — the plate drops after the first run, and the
    //       unplated re-aim can be rooted (T3 ladder) or stunned (T4 ladder);
    //   (3) ~50% ROCKFALL — delayed impact circles rain around you as each wind-up
    //       begins, so dodging the lane means reading the rocks too;
    //   (4) ~25% LANDSLIDE, the soft enrage (playtest 2026-09-27) — a TRIPLE charge
    //       with a volley of bigger rocks before every run, and it moves faster.
    // While plated it ignores root and stun. CUT: the delayed fault lines (they only
    // landed after the charge already hit you), and the Earthshatter follow-up — the
    // tackle is the payoff again.
    bossPattern: {
      chargeInstinct: { speedPct: 0.45, castReductionPct: 0.30, minCastMs: 400, cooldownReductionPct: 0.20 },
      id: 'titan-charge', name: 'Titan Charge',
      damageMultiplier: 2.2, cooldownMs: 9000, initialCooldownMs: 4500,
      stoppedBy: {
        stun: { staggerMs: 2800, label: 'Staggered' },
        root: { staggerMs: 1500, label: 'Stumbled' },
      },
      steps: [
        { kind: 'cast', name: 'Titanplate', castMs: 900, fx: 'shield', guardable: false, rootable: true },
        { kind: 'barrier', sourceId: 'titanplate', shieldPct: 0.05, blocksControl: true,
          onBreak: { staggerMs: 3000, label: 'Plate Shattered' } },
        { kind: 'cast', name: 'Titan Charge', castMs: 2600, fx: 'charge-lane',
          lane: { length: 820, halfWidth: 104, lockAtCastPct: 0.6 } },
        // 820px at 540px/s ≈ 1.5s of travel, or less — it STOPS on the body it hits.
        { kind: 'charge', speed: 540, maxTravelMs: 2400 },
        { kind: 'drop-barrier', sourceId: 'titanplate' },
        { kind: 'recovery', label: 'Spent', durationMs: 1000 },
      ],
    },
    bossPatternVariants: [
      {
        chargeInstinct: { speedPct: 0.45, castReductionPct: 0.30, minCastMs: 400, cooldownReductionPct: 0.20 },
        id: 'titan-double-charge', name: 'Double Charge',
        damageMultiplier: 2.2, cooldownMs: 10000, initialCooldownMs: 4500,
        stoppedBy: {
          stun: { staggerMs: 2800, label: 'Staggered' },
          root: { staggerMs: 1500, label: 'Stumbled' },
        },
        steps: [
          { kind: 'cast', name: 'Titanplate', castMs: 900, fx: 'shield', guardable: false, rootable: true },
          { kind: 'barrier', sourceId: 'titanplate', shieldPct: 0.05, blocksControl: true,
            onBreak: { staggerMs: 3000, label: 'Plate Shattered' } },
          { kind: 'cast', name: 'Titan Charge', castMs: 2600, fx: 'charge-lane',
            lane: { length: 820, halfWidth: 104, lockAtCastPct: 0.6 } },
          { kind: 'charge', speed: 540, maxTravelMs: 2400 },
          { kind: 'drop-barrier', sourceId: 'titanplate' },
          { kind: 'cast', name: 'Second Charge', castMs: 1500, fx: 'charge-lane', rootable: true,
            lane: { length: 760, halfWidth: 104, lockAtCastPct: 0.5 } },
          { kind: 'charge', speed: 580, damageMult: 0.85, maxTravelMs: 2200 },
          { kind: 'recovery', label: 'Spent', durationMs: 1000 },
        ],
      },
      {
        chargeInstinct: { speedPct: 0.45, castReductionPct: 0.30, minCastMs: 400, cooldownReductionPct: 0.20 },
        id: 'titan-rockfall', name: 'Rockfall',
        damageMultiplier: 2.2, cooldownMs: 10000, initialCooldownMs: 4500,
        stoppedBy: {
          stun: { staggerMs: 2800, label: 'Staggered' },
          root: { staggerMs: 1500, label: 'Stumbled' },
        },
        steps: [
          { kind: 'cast', name: 'Titanplate', castMs: 900, fx: 'shield', guardable: false, rootable: true },
          { kind: 'barrier', sourceId: 'titanplate', shieldPct: 0.05, blocksControl: true,
            onBreak: { staggerMs: 3000, label: 'Plate Shattered' } },
          { kind: 'rockfall', name: 'Rockfall', count: 11, radius: 95, spread: 720, delayMs: 1800, damageMult: 0.55 },
          { kind: 'cast', name: 'Titan Charge', castMs: 2600, fx: 'charge-lane',
            lane: { length: 820, halfWidth: 104, lockAtCastPct: 0.6 } },
          { kind: 'charge', speed: 540, maxTravelMs: 2400 },
          { kind: 'drop-barrier', sourceId: 'titanplate' },
          { kind: 'rockfall', name: 'Rockfall', count: 11, radius: 95, spread: 720, delayMs: 1800, damageMult: 0.55 },
          { kind: 'cast', name: 'Second Charge', castMs: 1500, fx: 'charge-lane', rootable: true,
            lane: { length: 760, halfWidth: 104, lockAtCastPct: 0.5 } },
          { kind: 'charge', speed: 580, damageMult: 0.85, maxTravelMs: 2200 },
          { kind: 'recovery', label: 'Spent', durationMs: 1000 },
        ],
      },
      {
        // LANDSLIDE (playtest 2026-09-27): the soft enrage is a TRIPLE charge, a
        // volley of bigger rocks before every run, so the safe ground between them
        // closes up. Both re-aims are unplated and rootable, as in the Double Charge.
        chargeInstinct: { speedPct: 0.45, castReductionPct: 0.30, minCastMs: 400, cooldownReductionPct: 0.20 },
        id: 'titan-landslide', name: 'Landslide',
        damageMultiplier: 2.2, cooldownMs: 9000, initialCooldownMs: 3000,
        stoppedBy: {
          stun: { staggerMs: 2800, label: 'Staggered' },
          root: { staggerMs: 1500, label: 'Stumbled' },
        },
        steps: [
          { kind: 'cast', name: 'Titanplate', castMs: 900, fx: 'shield', guardable: false, rootable: true },
          { kind: 'barrier', sourceId: 'titanplate', shieldPct: 0.05, blocksControl: true,
            onBreak: { staggerMs: 3000, label: 'Plate Shattered' } },
          { kind: 'rockfall', name: 'Landslide', count: 12, radius: 130, spread: 680, delayMs: 1800, damageMult: 0.55 },
          { kind: 'cast', name: 'Titan Charge', castMs: 2400, fx: 'charge-lane',
            lane: { length: 820, halfWidth: 104, lockAtCastPct: 0.6 } },
          { kind: 'charge', speed: 560, maxTravelMs: 2400 },
          { kind: 'drop-barrier', sourceId: 'titanplate' },
          { kind: 'rockfall', name: 'Landslide', count: 12, radius: 130, spread: 680, delayMs: 1600, damageMult: 0.55 },
          { kind: 'cast', name: 'Second Charge', castMs: 1400, fx: 'charge-lane', rootable: true,
            lane: { length: 760, halfWidth: 104, lockAtCastPct: 0.5 } },
          { kind: 'charge', speed: 600, damageMult: 0.85, maxTravelMs: 2200 },
          { kind: 'rockfall', name: 'Landslide', count: 12, radius: 130, spread: 680, delayMs: 1500, damageMult: 0.55 },
          { kind: 'cast', name: 'Third Charge', castMs: 1200, fx: 'charge-lane', rootable: true,
            lane: { length: 720, halfWidth: 104, lockAtCastPct: 0.5 } },
          { kind: 'charge', speed: 640, damageMult: 0.8, maxTravelMs: 2000 },
          { kind: 'recovery', label: 'Spent', durationMs: 1000 },
        ],
      },
    ],
    bossScript: {
      phases: [
        { hpPct: 0.65, name: 'Double Charge',
          description: 'After the plated charge the Titanplate drops and it re-aims for a second charge. That unplated wind-up can be stopped with a root or a stun.',
          actions: [
          { type: 'set-pattern', patternId: 'titan-double-charge' },
        ] },
        // Soft enrage: rocks on every wind-up, and the cycle compresses.
        { hpPct: 0.5, name: 'Rockfall',
          description: 'Rocks rain down around you before each charge. Read the rocks and the lane together.',
          actions: [
          { type: 'set-pattern', patternId: 'titan-rockfall' },
        ] },
        { hpPct: 0.25, name: 'Landslide',
          description: 'It charges three times in a row, with a volley of bigger rocks before every run, and it moves 35% faster. The second and third wind-ups are unplated: root or stun them.',
          actions: [
          { type: 'set-pattern', patternId: 'titan-landslide' },
          { type: 'stat-buff', stat: 'speed', mult: 1.35, label: 'earthshaker-rush' },
        ] },
      ],
    },
  }],


  // ══════════════════════════════════════════════════════════════════════
  // DESERT — "Dune-Throne Sovereign"
  // Identity: SETUP / CONTROL -> PUNISHMENT, as a three-act duel.
  //
  //   ACT I   melee duel; ACT II standoff (from 55%); ACT III hit-and-run (20%).
  //   See the pattern notes below (boss-lineage redesign 2026-09-27).
  //
  // The mark carries THROUGH the range morph — that pairing is the point. Desert
  // compresses the biome's controller/dealer pairing into one duellist, which is
  // why this boss has no adds at any tier.
  // ══════════════════════════════════════════════════════════════════════
  ['dune-throne-sovereign', {
    id: 'dune-throne-sovereign', name: 'Dune-Throne Sovereign', color: 0xddbb33,
    isBoss: true,
    stats: { hp: 71080, attack: 185, plating: 8, damageReduction: 0.35, speed: 44, attackRange: 20, attackCooldown: 2800, pullRange: 400 },
    behavior: 'melee', attackStyle: 'sandblast', biome: 'desert',
    rewards: { essence: 595, essenceType: 'yellow', level: 5, biomeXp: 893 },
    ai: { wanderRadius: 140, leashRange: 960, idleMinMs: 2500, idleMaxMs: 7000 },
    targeting: { prefersPlayers: true },
    // T4 = the same Death Sting -> Execution throughline, running unchanged through
    // all three acts. The ACTS change the boss's posture (melee hunter, ranged
    // kiter, cornered melee); they do not change the question it asks. That is what
    // makes it the capstone of the lineage rather than a third unrelated mechanic:
    // by now the player knows the sequence, and the tier tests whether they can keep
    // answering it while the fight moves around them.
    //
    // REMOVED with the 2026-09-04 redesign: `chargeOnAggro`, the per-hit slow, the
    // invisible `appliesMark`/`markedStrike` pair, and the generic Sandstorm Rupture
    // circle that competed with the Execution for the same beat.
    bossPattern: {
      id: 'sovereign-execution', name: 'Death Sting',
      damageMultiplier: 1.8, cooldownMs: 9000, initialCooldownMs: 4500,
      steps: [
        { kind: 'apply-status', name: 'Death Sting', castMs: 1200, fx: 'death-sting',
          effectId: SUN_MARK_EFFECT_ID, stacks: 1, durationMs: 7000 },
        { kind: 'wait', durationMs: 900 },
        // NUMBING STING (2026-09-06) — see the T2 Emperor. The capstone's version is
        // the hardest pin in the lineage, against its widest circle.
        { kind: 'apply-status', name: 'Numbing Sting', castMs: 700, fx: 'numbing-sting',
          effectId: 'slow', stacks: 1, durationMs: 5000, data: { speedMult: 0.28 } },
        { kind: 'wait', durationMs: 650 },
        { kind: 'payoff', name: 'Execution', castMs: 1500, fx: 'execution',
          damageMult: 1.0, amplifiedMult: 2.0,
          consumes: { effectId: SUN_MARK_EFFECT_ID }, radius: 180 },
        { kind: 'recovery', label: 'Spent', durationMs: 1000 },
      ],
    },
    // THREE POSTURES (boss-lineage redesign 2026-09-27), one sentence:
    //   ACT I   melee duel — the T2 sequence;
    //   ACT II  55%: STANDOFF — the sentence from range, with a rootable dash-escape;
    //   ACT III 20%: HIT-AND-RUN, the soft enrage — it marks from range, DASHES IN,
    //           cashes the mark with a short Execution combo, and withdraws faster
    //           than you can follow. Uncatchable, never unhittable: the combo is the
    //           damage window for every build. Bursts come faster each time, but the
    //           gaps stay >= ~4s, so Dawn armor re-arms before every dash-in. Root or
    //           stun the dash-in or the combo and it is stuck in melee, staggered —
    //           the earned big window.
    bossPatternVariants: [
      {
        // STANDOFF — the same sentence, run from range. Shorter than the melee
        // version so the Execution never roots the boss into a free melee target.
        id: 'sovereign-standoff', name: 'Death Sting',
        damageMultiplier: 1.8, cooldownMs: 8000, initialCooldownMs: 2500,
        steps: [
          { kind: 'apply-status', name: 'Death Sting', castMs: 1000, fx: 'death-sting',
            effectId: SUN_MARK_EFFECT_ID, stacks: 1, durationMs: 7000 },
          { kind: 'wait', durationMs: 500 },
          { kind: 'apply-status', name: 'Numbing Sting', castMs: 600, fx: 'numbing-sting',
            effectId: 'slow', stacks: 1, durationMs: 4000, data: { speedMult: 0.28 } },
          { kind: 'wait', durationMs: 400 },
          { kind: 'payoff', name: 'Execution', castMs: 1100, fx: 'execution',
            damageMult: 1.0, amplifiedMult: 2.0,
            consumes: { effectId: SUN_MARK_EFFECT_ID }, radius: 180 },
        ],
      },
      {
        // The dash-escape: close in on it and it springs back to range. Visible
        // (~260px/s, far faster than a player), on a 6s clock, and a ROOT stops it.
        id: 'sovereign-sand-step', name: 'Sand Step',
        damageMultiplier: 1, cooldownMs: 6000, initialCooldownMs: 0,
        armWhenTargetWithinPx: 210,
        stoppedBy: { root: { staggerMs: 1500, label: 'Pinned' }, stun: { staggerMs: 2000, label: 'Staggered' } },
        steps: [
          { kind: 'dash', name: 'Sand Step', direction: 'away', speed: 660, distance: 460,
            maxTravelMs: 1000, rootable: true, fx: 'predator-flee' },
        ],
      },
      {
        id: 'sovereign-hit-and-run', name: 'Hit and Run',
        damageMultiplier: 1.8, cooldownMs: 10000, initialCooldownMs: 1500,
        accelerate: { cooldownMultPerRun: 0.92, minCooldownMs: 7500 },
        stoppedBy: {
          root: { staggerMs: 3000, label: 'Caught' },
          stun: { staggerMs: 3000, label: 'Caught' },
        },
        steps: [
          { kind: 'apply-status', name: 'Death Sting', castMs: 700, fx: 'death-sting',
            effectId: SUN_MARK_EFFECT_ID, stacks: 1, durationMs: 5000 },
          { kind: 'wait', durationMs: 300 },
          { kind: 'dash', name: 'Dune Rush', direction: 'to-target', speed: 720, reach: 30,
            maxTravelMs: 1100, rootable: true, fx: 'predator-flee' },
          { kind: 'payoff', name: 'Execution', castMs: 550, fx: 'execution',
            damageMult: 1.0, amplifiedMult: 2.0, rootable: true,
            consumes: { effectId: SUN_MARK_EFFECT_ID }, radius: 120 },
          { kind: 'dash', name: 'Withdraw', direction: 'away', speed: 700, distance: 540,
            maxTravelMs: 1000, interruptible: false, fx: 'predator-flee' },
        ],
      },
    ],
    bossScript: {
      phases: [
        { hpPct: 0.55, name: 'Standoff',
          description: 'It fights from range with stings: Death Sting marks you, Numbing Sting slows you and Execution cashes the mark in. Close in and it Sand Steps away; root it to stop the escape.',
          actions: [
          { type: 'morph', isRanged: true, attackStyle: 'sandblast', attackRange: 250, kite: false },
          { type: 'set-pattern', patternId: 'sovereign-standoff' },
          { type: 'add-pattern', patternId: 'sovereign-sand-step' },
        ] },
        { hpPct: 0.2, name: 'Hit and Run',
          description: 'It dashes in, marks and executes you, then withdraws, a little faster every time. Root or stun the dash-in or the Execution to catch it.',
          actions: [
          { type: 'set-pattern', patternId: 'sovereign-hit-and-run' },
          { type: 'set-weather', weather: 'sandstorm' },
        ] },
      ],
    },
  }],


  // ══════════════════════════════════════════════════════════════════════
  // JUNGLE — "Verdant-Crown Predator"
  // Identity: HARD TO CATCH, THEN IT COMMITS. Two states, and that is the fight.
  //
  //   HUNT (100–50%): evasion 0.25, very fast, venom chipping away. It is
  //     difficult to pin down — a quarter of your hits miss, and it repositions
  //     constantly. Damage here is slow and frustrating BY DESIGN.
  //   FRENZY (<50%): evasion drops to ZERO and it stops evading forever. It hits
  //     far harder, moves faster, and stays on you. This is a clean damage window
  //     and a lethal one at the same time — the whole encounter is the trade.
  //
  // The 25% beat is the frenzy PEAKING, not a third idea. The generic
  // `cadenceFinisher` was removed: the boss already swings every 1.4s, and the
  // finisher was tier-template pressure that said nothing about a predator.
  // ══════════════════════════════════════════════════════════════════════
  ['verdant-crown-predator', {
    id: 'verdant-crown-predator', name: 'Verdant-Crown Predator', color: 0x115522,
    isBoss: true,
    stats: { hp: 112570, attack: 117, plating: 0, damageReduction: 0.08, speed: 76, attackRange: 20, attackCooldown: 1400, pullRange: 400 },
    // A clawing predator, not a swordsman: the basic swing takes the light rake
    // (`claws-light`) rather than the generic blade arc. Deliberately NOT the
    // full-weight Forest `bear-claws` — this cat is fast and lean, and the heavy
    // paw belongs to the greatbear lineage. Its ambush payoffs draw the Jungle
    // hunt's own pounce (`ambush-pounce` / `venom-pounce`, fx/jungleBoss.ts).
    behavior: 'melee', attackStyle: 'claws-light', biome: 'jungle',
    rewards: { essence: 605, essenceType: 'green', level: 5, biomeXp: 908 },
    ai: { wanderRadius: 150, leashRange: 960, idleMinMs: 2000, idleMaxMs: 6000 },
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
    //   T4: the cycle with the bite from the start (STUN also ends the flee);
    //   ~60% THORN SNARES: the flee drops snares that root a chaser (Break Free);
    //   <30% CORNERED: it stops fleeing for good and frenzies permanently — the
    //   soft enrage (the flee patterns stop arming below 30%).
    bossPattern: {
      id: 'bloodfang-escape', name: 'Escape',
      damageMultiplier: 2.3, cooldownMs: 12000, initialCooldownMs: 7000,
      armAboveHpPct: 0.3,
      stoppedBy: {
        // A stopped flee is NOT a stagger window (principle 5 exception): being
        // stopped is already its punishment. A <=1s stumble with the stun tell.
        stun: { staggerMs: 1000, label: 'Stumbled' },
        root: { staggerMs: 1000, label: 'Stumbled' },
      },
      steps: [
        { kind: 'escape-guard', name: 'Flee', castMs: 3000, fx: 'predator-flee',
          sourceId: 'jungle-escape', shieldPct: 0.045,
          onBreak: { staggerMs: 1000, label: 'Caught' },
          instinctSpeedPct: 0.30, rootable: true,
          flee: { speed: 660, escapeDistance: 720 } },
        { kind: 'conceal', name: 'Vanished', marker: 'stealth', durationMs: 6000,
          relocate: 'near-target', emergeGap: 30, travelSpeed: 270, surfacesOnContact: true },
        { kind: 'payoff', name: 'Venomous Bite', castMs: 250, fx: 'venom-pounce',
          damageMult: 1.0, reach: 90,
          onHitPoison: { stacks: 4, damagePerStack: 18, durationMs: 4000, tickIntervalMs: 1000 } },
        { kind: 'frenzy', name: 'Frenzy', durationMs: 5000, attackSpeedPct: 0.35, damagePct: 0.20 },
      ],
    },
    bossPatternVariants: [{
      id: 'bloodfang-snare-escape', name: 'Escape',
      damageMultiplier: 2.3, cooldownMs: 12000, initialCooldownMs: 5000,
      armAboveHpPct: 0.3,
      stoppedBy: {
        // A stopped flee is NOT a stagger window (principle 5 exception): being
        // stopped is already its punishment. A <=1s stumble with the stun tell.
        stun: { staggerMs: 1000, label: 'Stumbled' },
        root: { staggerMs: 1000, label: 'Stumbled' },
      },
      steps: [
        { kind: 'escape-guard', name: 'Flee', castMs: 3000, fx: 'predator-flee',
          sourceId: 'jungle-escape', shieldPct: 0.045,
          onBreak: { staggerMs: 1000, label: 'Caught' },
          instinctSpeedPct: 0.30, rootable: true,
          snares: { intervalMs: 350, radius: 60, rootMs: 1500, durationMs: 12000 },
          flee: { speed: 660, escapeDistance: 720 } },
        { kind: 'conceal', name: 'Vanished', marker: 'stealth', durationMs: 6000,
          relocate: 'near-target', emergeGap: 30, travelSpeed: 270, surfacesOnContact: true },
        { kind: 'payoff', name: 'Venomous Bite', castMs: 250, fx: 'venom-pounce',
          damageMult: 1.0, reach: 90,
          onHitPoison: { stacks: 4, damagePerStack: 18, durationMs: 4000, tickIntervalMs: 1000 } },
        { kind: 'frenzy', name: 'Frenzy', durationMs: 5000, attackSpeedPct: 0.35, damagePct: 0.20 },
      ],
    }],
    bossScript: {
      phases: [
        { hpPct: 0.6, name: 'Thorn Snares',
          description: 'Its flight scatters thorn snares that root you, and it ambushes with a Venomous Bite. Root or stun the flee before it gets away.',
          actions: [
          { type: 'set-pattern', patternId: 'bloodfang-snare-escape' },
        ] },
        { hpPct: 0.3, name: 'Cornered',
          description: 'It has stopped running and fights to the death: 40% more attack and 35% faster attacks.',
          actions: [
          // Permanent frenzy: the soft enrage. It has given up on running.
          // 2026-09-27 T4 power curve: Cornered 1.40/1.35 -> 1.2/1.2; the last 30% now lasts ~55 s, not ~9 s.
          { type: 'stat-buff', stat: 'attack', mult: 1.2, label: 'cornered' },
          { type: 'stat-buff', stat: 'attackSpeed', mult: 1.2, label: 'cornered' },
        ] },
      ],
    },
  }],


  // ══════════════════════════════════════════════════════════════════════
  // TUNDRA — "Glacial Patriarch"
  // Identity: CHILL + ICE ARMOR / SHATTER, at its heaviest.
  //
  // The room chills you (the node's ambient ramp) and the Patriarch chills you
  // further (`rampDebuff`), both capped — suppression, never a stun. Its plate
  // returns as ICE ARMOR on a timer; burst it and the shell SHATTERS, hurting the
  // boss and leaving it badly exposed for several seconds. That window is where
  // your damage comes from, and the phases make the window rarer and richer.
  //
  // Glacial Collapse scales with the Chill you are carrying (`chargedOnly`), so
  // the fight has a real tension: the longer you take, the more the environment
  // itself weaponises the one attack you cannot ignore.
  //
  // REMOVED: the 50% `apply-soft-cap` (a generic anti-burst layer, in the one
  // encounter that is explicitly ABOUT rewarding burst — it fought its own design)
  // and the 25% ramp-cap lift to 85%/70% movement/attack slow.
  // ══════════════════════════════════════════════════════════════════════
  ['glacial-patriarch', {
    id: 'glacial-patriarch', name: 'Glacial Patriarch', color: 0x77aadd,
    isBoss: true,
    stats: { hp: 90450, attack: 189, plating: 32, damageReduction: 0.18, speed: 14, attackRange: 20, attackCooldown: 4500, pullRange: 420 },
    behavior: 'melee', attackStyle: 'frost', biome: 'tundra',
    rewards: { essence: 640, essenceType: 'blue', level: 5, biomeXp: 960 },
    ai: { wanderRadius: 90, leashRange: 960, idleMinMs: 4000, idleMaxMs: 10000 },
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
    //   T4: (1) the T3 fight including Brittle/Shatter; (2) ~60% ICE ARMOR: it
    //   encases itself and stops attacking — BREAK it (Shattered: staggered and
    //   taking +30% damage) or DISENGAGE and use the breather; it keeps its aggro
    //   and does not reset or heal while encased; (3) ~25% BLIZZARD, harsher.
    controlImmune: true,
    bossPattern: {
      id: 'patriarch-deep-freeze', name: 'Deep Freeze',
      damageMultiplier: 1.9, cooldownMs: 3000, initialCooldownMs: 3000,
      // Fires when YOU reach the Chill threshold, never on a timer.
      armWhenTargetStatus: { effectId: TUNDRA_CHILL_EFFECT_ID, minStacks: 5 },
      priority: 2,
      steps: [
        { kind: 'apply-status', name: 'Deep Freeze', castMs: 1300, fx: 'frostbind',
          effectId: FROZEN_STATUS_ID, stacks: 1, durationMs: 2400,
          requires: { effectId: TUNDRA_CHILL_EFFECT_ID, minStacks: 5 },
          // The freeze spends the cold that fed it: Chill and Frostbite start over.
          consumesOnResolve: [TUNDRA_CHILL_EFFECT_ID, FROSTBITE_EFFECT_ID] },
        // FROST BURST, centred on the frozen player — ranged builds are tested too.
        // Break Free then step out, Guard it, or tank it (Tundra armor).
        { kind: 'impact', name: 'Frost Burst', anchor: 'target', radius: 230,
          damageMult: 1.0, telegraphMs: 1400, fx: 'shatter',
          appliesDebuff: { effectId: BOSS_BRITTLE_EFFECT_ID, durationMs: 4000, data: { damageTakenPct: 0.30 } }, },
        // BRITTLE -> SHATTER: the heavy follow-up swing on a cracked target. Guard it,
        // or be out of its reach when it lands.
        { kind: 'payoff', name: 'Shatter', castMs: 1400, fx: 'shatter', damageMult: 1.2, reach: 70 },
        { kind: 'recovery', label: 'Thawing', durationMs: 1000 },
      ],
    },
    bossPatternVariants: [
    {
      // REACTIVE POSTURE, close: a telegraphed burst around the boss that adds Chill.
      id: 'patriarch-frost-nova', name: 'Frost Nova',
      damageMultiplier: 1.9, cooldownMs: 10000, initialCooldownMs: 5000,
      armWhenTargetWithinPx: 170, priority: 1,
      steps: [
        { kind: 'impact', name: 'Frost Nova', anchor: 'self', radius: 200,
          damageMult: 0.6, telegraphMs: 1100, fx: 'shatter', addsAmbientStacks: 2 },
      ],
    },
    {
      // REACTIVE POSTURE, far: a spike volley that roots, then the boss walks up.
      id: 'patriarch-frost-spikes', name: 'Frost Spikes',
      damageMultiplier: 1.9, cooldownMs: 10000, initialCooldownMs: 3000,
      armWhenTargetBeyondPx: 320, priority: 1,
      steps: [
        { kind: 'apply-status', name: 'Frost Spikes', castMs: 900, fx: 'frostbind',
          effectId: 'slow', stacks: 1, durationMs: 1800, data: { speedMult: 0 } },
        { kind: 'dash', name: 'Advance', direction: 'to-target', speed: 150, reach: 20,
          maxTravelMs: 2500, interruptible: false },
      ],
    },
    {
      id: 'patriarch-ice-armor', name: 'Ice Armor',
      damageMultiplier: 1, cooldownMs: 25000, initialCooldownMs: 0, priority: 3,
      steps: [
        { kind: 'cast', name: 'Encase', castMs: 1000, fx: 'shield', guardable: false },
        { kind: 'barrier', sourceId: 'ice-armor', shieldPct: 0.10,
          onBreak: { staggerMs: 3500, label: 'Shattered',
            vulnerability: { damageTakenPct: 0.30, durationMs: 6000 } } },
        // Encased: rooted, not attacking. The breather, or the burst window.
        { kind: 'wait', durationMs: 9000 },
        { kind: 'drop-barrier', sourceId: 'ice-armor' },
      ],
    },
    ],
    bossScript: {
      phases: [
        { hpPct: 1.0, actions: [
          { type: 'add-pattern', patternId: 'patriarch-frost-nova' },
          { type: 'add-pattern', patternId: 'patriarch-frost-spikes' },
          { type: 'room-debuff', effectId: FROSTBITE_EFFECT_ID, intervalMs: 5500, maxStacks: 10,
            data: { uncleansable: 1, ambientRampAccelPct: 0.12 } },
        ] },
        { hpPct: 0.6, name: 'Ice Armor',
          description: 'It periodically encases itself in ice, rooted and not attacking. Break the armor for a stagger and 30% extra damage taken, or use the lull to recover.',
          actions: [
          { type: 'add-pattern', patternId: 'patriarch-ice-armor' },
        ] },
        { hpPct: 0.25, name: 'Blizzard',
          description: 'A blizzard fills the room: Frostbite stacks faster and faster, and your Chill builds quicker. Ice Armor stops. Frostbite cannot be cleansed; end the fight.',
          actions: [
          { type: 'set-weather', weather: 'blizzard' },
          { type: 'remove-pattern', patternId: 'patriarch-ice-armor' },
          { type: 'room-debuff', effectId: FROSTBITE_EFFECT_ID, intervalMs: 3500, maxStacks: 12,
            data: { uncleansable: 1, ambientRampAccelPct: 0.14 },
            accelerate: { intervalMult: 0.8, minIntervalMs: 1000 } },
          { type: 'stoke-ramp', rampMsMult: 0.5 },
        ] },
      ],
    },
  }],


  // ══════════════════════════════════════════════════════════════════════
  // VOLCANIC — "Caldera Sovereign"
  // Identity: THE HEAT RACE. The fight gets hotter and deadlier for EVERYONE.
  //
  // Volcanic nodes carry a node-wide Heat ramp: while you are in combat it stacks,
  // and every stack gives the player MORE damage dealt and MORE damage taken. That
  // greed ramp is the biome, and the Sovereign's whole design is to weaponise it
  // rather than run a private ramp beside it (the old `rampOnCombat`, removed).
  //
  //   100–50%  normal Heat rules. Eruption and Caldera Burn do the work.
  //   ~50%     the caldera opens: Heat accumulates ~35% faster and can no longer
  //            cool below 2 stacks. Disengaging stops being a reset.
  //   ~25%     the vents rupture: Heat runs faster still, floors at 4 stacks, and
  //            the ceiling rises from 6 to 9. Both of you are now doing far more
  //            damage than the fight started with.
  //
  // The Sovereign FEEDS on the same ramp (`scalesWithAmbientRamp`, all hits), so
  // the player's own Heat bonus is the thing arming the boss. That is the race:
  // your damage is climbing too, and one of you runs out of room first.
  // The stoke is cleared when it dies — the room cools with it.
  // ══════════════════════════════════════════════════════════════════════
  ['caldera-sovereign', {
    id: 'caldera-sovereign', name: 'Caldera Sovereign', color: 0xee3300,
    isBoss: true,
    stats: { hp: 74130, attack: 130, plating: 10, damageReduction: 0.35, speed: 24, attackRange: 20, attackCooldown: 2600, pullRange: 400 },
    behavior: 'melee', attackStyle: 'fire', biome: 'volcanic',
    rewards: { essence: 625, essenceType: 'red', level: 5, biomeXp: 938 },
    ai: { wanderRadius: 120, leashRange: 960, idleMinMs: 2500, idleMaxMs: 7000 },
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
    //   T4: (1) the T3 cycle + SIMMERING BURN building slowly all fight (the room
    //   lays it; Cleanse takes part of it off, like Chill); (2) ~50% MAGMA SHOVE: a
    //   telegraphed shove onto the nearest vent — the Heat is yours if you get off
    //   before it erupts; (3) 25% CATACLYSM, with the Simmering Burn accelerating
    //   during the cast ("kill it while burning up").
    controlImmune: true,
    bossPattern: {
      id: 'cataclysm', name: 'Cataclysm',
      damageMultiplier: 1.0, cooldownMs: 60000, initialCooldownMs: 0,
      armBelowHpPct: 0.25,
      oncePerLife: true,
      steps: [
        // Long, obvious, and explicitly UNINTERRUPTIBLE: the answer is the DPS race,
        // not a stun. Guard is still a legitimate way to eat it.
        // 2026-09-27 T4 power curve (HP x3.6, fight ~6x longer): Cataclysm 26 -> 60 s and
        // 1000 -> 650 raw; vents x0.75, Simmering Burn 4 -> 3/stack; the arena's Heat clock
        // is x5 slower (volcanicHeat in nodeFeatures.ts).
        { kind: 'cast', name: 'Cataclysm', castMs: 60000, fx: 'cataclysm-cast', interruptible: false,
          announce: 'cataclysm' },
        // Unevadable: an evasion build must not dodge its way past the DPS check.
        { kind: 'impact', name: 'Cataclysm', anchor: 'self', radius: 2000,
          damageMult: 1.0, rawDamage: 650, interruptible: false, unevadable: true, telegraphMs: 400, fx: 'cataclysm-impact' },
        { kind: 'recovery', label: 'Spent', durationMs: 1000 },
      ],
    },
    bossPatternVariants: [{
      id: 'caldera-magma-shove', name: 'Magma Shove',
      damageMultiplier: 1, cooldownMs: 12000, initialCooldownMs: 2000, priority: 1,
      armAboveHpPct: 0.25,
      steps: [
        // Lands you slowed (playtest 2026-09-27): getting off the vent is the answer,
        // and now it takes committing to it.
        { kind: 'pull', name: 'Magma Shove', castMs: 1000, distance: 320,
          toward: 'nearest-pool', poolFlavors: ['magma-vent'], fx: 'magma-shove',
          appliesDebuff: { effectId: 'slow', plainStatus: true, durationMs: 2500, data: { speedMult: 0.45 } } },
      ],
    }],
    bossScript: {
      phases: [
        { hpPct: 1.0, actions: [
          // Playtest 2026-09-27: vents were no threat. More, bigger, harder-hitting,
          // and fissures split new ones open under the player all fight.
          { type: 'vent-field', count: 6, radius: 210, ringRadius: 540, rampAccelMult: 3,
            eruptEveryMs: 7500, telegraphMs: 1500, damageMult: 1.13,
            fissure: { everyMs: 14000, maxVents: 10 } },
          // Playtest 2026-09-27: vents also keep splitting open AROUND THE BOSS.
          { type: 'vent-spawner', everyMs: 2600, count: 1, minRadius: 60, maxRadius: 440, radius: 155, telegraphMs: 1400, lingerMs: 2200, damageMult: 1.05, rampAccelMult: 3 },
          { type: 'room-affliction', intervalMs: 5000, dot: {
            debuffId: 'caldera-burn', label: 'Simmering Burn', color: '#ff7a33',
            damagePerStack: 3, maxStacks: 12, tickIntervalMs: 1000, durationMs: 15000,
          } },
        ] },
        { hpPct: 0.5, name: 'Magma Shove',
          description: 'It shoves you onto the nearest vent and leaves you slowed there; more vents open around it and fissures split open under you. Take the Heat, but get off before the vent erupts.',
          actions: [
          { type: 'add-pattern', patternId: 'caldera-magma-shove' },
          { type: 'vent-field', count: 9, radius: 235, ringRadius: 540, rampAccelMult: 3,
            eruptEveryMs: 5500, telegraphMs: 1400, damageMult: 1.13,
            fissure: { everyMs: 8000, maxVents: 16 } },
          { type: 'vent-spawner', everyMs: 1700, count: 2, minRadius: 60, maxRadius: 440, radius: 155, telegraphMs: 1350, lingerMs: 2200, damageMult: 1.05, rampAccelMult: 3 },
        ] },
        { hpPct: 0.25, name: 'Cataclysm',
          description: 'It stops attacking and charges a Cataclysm that hits the whole arena, while vents burst open all around it and the Simmering Burn accelerates. The Cataclysm cannot be interrupted or evaded: kill it, or survive the blast with Guard and tank gear.',
          actions: [
          { type: 'set-weather', weather: 'ashfall' },
          // The race against the Cataclysm, under a near-bullet-hell of vents.
          { type: 'vent-spawner', everyMs: 650, count: 3, minRadius: 60, maxRadius: 440, radius: 140, telegraphMs: 1250, lingerMs: 2200, damageMult: 1.05, rampAccelMult: 3 },
          // The burn accelerates while the Cataclysm charges.
          { type: 'room-affliction', intervalMs: 3000, dot: {
            debuffId: 'caldera-burn', label: 'Simmering Burn', color: '#ff7a33',
            damagePerStack: 3, maxStacks: 16, tickIntervalMs: 1000, durationMs: 15000,
          } },
        ] },
      ],
    },
  }],


  // ══════════════════════════════════════════════════════════════════════
  // WASTELAND — "Charnel-Crown Sovereign"
  // Identity: DEATH DOES NOT REMOVE ENEMIES.
  //
  // The old version was a poison boss with two add waves and two enrages — which
  // is to say, a worse Plains fight in a different palette. Rebuilt around the
  // Wasteland's actual rule:
  //
  //   • It arrives with a small, controlled ENTOURAGE of undead.
  //   • When you kill them they leave corpses.
  //   • It periodically RAISES those corpses. Risen units are worth ZERO rewards,
  //     leave no corpse of their own (the tide cannot feed itself), are capped, and
  //     ALL of them crumble the instant the Sovereign dies.
  //   • At 50% it performs a Mass Resurrection and the tide is allowed to stand
  //     deeper; at 25% a final wave claws up, driven by a necrotic roar.
  //
  // Contrast Plains, deliberately: there, new creatures keep ARRIVING. Here, the
  // creatures you already killed refuse to stay dead, and the pressure comes from
  // having to kill the same bodies repeatedly while the boss is still up. It needs
  // no big personal DoT package; the corpse tide is the attrition, and Crown Decay
  // is now a light chip rather than the main event.
  // ══════════════════════════════════════════════════════════════════════
  ['charnel-crown-sovereign', {
    id: 'charnel-crown-sovereign', name: 'Charnel-Crown Sovereign', color: 0x553366,
    isBoss: true,
    // A RANGED caster now (redesign 2026-09-27): it stands back and hexes you while
    // its army fights.
    stats: { hp: 42000, attack: 115, plating: 14, damageReduction: 0.25, speed: 28, attackRange: 260, attackCooldown: 2300, pullRange: 400 },
    behavior: 'ranged', attackStyle: 'magic', biome: 'graveyard',
    rewards: { essence: 615, essenceType: 'purple', level: 5, biomeXp: 923 },
    ai: { wanderRadius: 105, leashRange: 960, idleMinMs: 3000, idleMaxMs: 8000 },
    targeting: { prefersPlayers: true },
    // WASTELAND (redesign 2026-09-27, from the playtest) — THE COMMANDER AND ITS ARMY.
    //   (1) INVOCATION: it opens by summoning its entourage. The army fights as one
    //       force with it (shares its target, never leashes or idles on its own —
    //       bossAdds.ts), and the boss SUPPORTS it from range with three cleansable
    //       hexes on you: Hex of Ruin (+damage taken), Grave Chill (slow) and
    //       Withering Hex (anti-heal). It raises the fallen on a cadence, and its
    //       risen leave corpses again (`reraisable`), so the army keeps coming.
    //       When the army is gone it walks to the corpses and raises them (Reclaim);
    //       a stun on the raise staggers it.
    //   (2) ~60% BONE TITHE: Mass Resurrection, then damage reduction per living add.
    //   (3) ~25% HARVEST, the turn: it stops supporting and stops raising, devours
    //       the corpses and then its living army one by one (each a permanent attack
    //       boost), and casts to kill: Grave Burst circles, Bone Spears, and a Soul
    //       Nova when you stand close. The boss is the threat now.
    raisesDead: {
      // 2026-09-27 T4 power curve: raise and Harvest clocks x1.7 with the fight length.
      intervalMs: 15300, initialDelayMs: 8000, corpseRange: 700, maxAlive: 7, count: 2,
      // Keep bodies available through slow pulls and the whole fight.
      corpseLifetimeMs: 600_000,
      hpMult: 0.45, damageMult: 0.60,
      castMs: 1600, castName: 'Raise Dead', castFx: 'raise-dead',
      stunStaggerMs: 3000,
      reraisable: true,
    },
    // THE HEXES — support for the army, cast from range on a rotation.
    bossPattern: {
      id: 'charnel-hexes', name: 'Hexes',
      damageMultiplier: 1, cooldownMs: 8000, initialCooldownMs: 4500,
      steps: [
        { kind: 'apply-status', name: 'Hex of Ruin', castMs: 900, fx: 'hex-ruin',
          effectId: HEX_OF_RUIN_EFFECT_ID, stacks: 1, durationMs: 8000,
          data: { isBossDebuff: 1, damageTakenPct: 0.15 } as Record<string, number> },
        { kind: 'wait', durationMs: 1500 },
        { kind: 'apply-status', name: 'Grave Chill', castMs: 800, fx: 'hex-chill',
          effectId: 'slow', stacks: 1, durationMs: 4000, data: { speedMult: 0.6 } as Record<string, number> },
        { kind: 'wait', durationMs: 1500 },
        { kind: 'apply-status', name: 'Withering Hex', castMs: 800, fx: 'hex-wither',
          effectId: 'antiheal', stacks: 1, durationMs: 8000, data: { antihealReduction: 0.4 } as Record<string, number> },
      ],
    },
    bossPatternVariants: [
      {
        // RECLAIM: its army is gone — it goes to the bodies and raises them.
        id: 'charnel-reclaim', name: 'Reclaim',
        damageMultiplier: 1, cooldownMs: 5000, initialCooldownMs: 0, priority: 3,
        armWhenNoAdds: true, armAboveHpPct: 0.25,
        stoppedBy: { stun: { staggerMs: 3000, label: 'Raise Broken' } },
        steps: [
          { kind: 'dash', name: 'Reclaim', direction: 'to-corpse', speed: 200, reach: 70,
            maxTravelMs: 4000, fx: 'necro-glide' },
          { kind: 'raise', name: 'Raise Dead', castMs: 1600, count: 4, range: 260, fx: 'raise-dead' },
        ],
      },
      {
        // THE WRATH (last phase): it casts to kill.
        id: 'charnel-wrath', name: 'Wrath',
        damageMultiplier: 1, cooldownMs: 5500, initialCooldownMs: 1500,
        steps: [
          { kind: 'cast', name: 'Grave Burst', castMs: 700, fx: 'grave-cast' },
          { kind: 'rockfall', name: 'Grave Burst', fx: 'grave-burst', count: 5, radius: 115, spread: 300,
            delayMs: 1300, damageMult: 0.8 },
          { kind: 'wait', durationMs: 900 },
          { kind: 'impact', name: 'Bone Spear', anchor: 'target', radius: 85,
            damageMult: 1.3, telegraphMs: 900, fx: 'bone-spear' },
          { kind: 'wait', durationMs: 600 },
          { kind: 'impact', name: 'Bone Spear', anchor: 'target', radius: 85,
            damageMult: 1.3, telegraphMs: 800, fx: 'bone-spear' },
        ],
      },
      {
        // SOUL NOVA (last phase): too close to it is its answer.
        id: 'charnel-nova', name: 'Soul Nova',
        damageMultiplier: 1, cooldownMs: 9000, initialCooldownMs: 2000, priority: 2,
        armWhenTargetWithinPx: 190,
        steps: [
          { kind: 'impact', name: 'Soul Nova', anchor: 'self', radius: 230,
            damageMult: 1.2, telegraphMs: 1100, fx: 'soul-nova' },
        ],
      },
    ],
    bossScript: {
      phases: [
        // INVOCATION: the opening entourage, summoned by a short cast. These are
        // the army and the first corpses of the fight.
        //   Bone Crawler   — fodder, there to die and be raised.
        //   Plague Hound   — plague pressure; its death pool is a hazard.
        //   Carrion Vulture— ranged support through its undead haste.
        { hpPct: 1.0, actions: [
          { type: 'cast', castMs: 1500, label: 'Invocation', fx: 'roar', castFx: 'invocation', actions: [
            // No maxAlive: it caps ALL of the boss's spawned adds together, which left
            // the vulture (5 already up) never spawning. The Invocation is one-shot.
            { type: 'spawn-adds', monsterTypeId: 'bone-crawler', count: 3, offsetRange: 260 },
            { type: 'spawn-adds', monsterTypeId: 'plague-hound', count: 1, offsetRange: 260 },
            { type: 'spawn-adds', monsterTypeId: 'carrion-vulture', count: 1, offsetRange: 260 },
          ] },
          { type: 'add-pattern', patternId: 'charnel-reclaim' },
        ] },
        { hpPct: 0.6, name: 'Bone Tithe',
          description: 'It raises the dead, and every add standing for it gives it damage reduction. Clear the army to strip its defence; Cleanse its hexes to blunt it.',
          actions: [
          { type: 'cast', castMs: 1800, label: 'Mass Resurrection', fx: 'roar', castFx: 'mass-raise', actions: [
            { type: 'raise-dead', count: 5, maxAliveAdd: 3, hpMult: 0.45, damageMult: 0.60 },
          ] },
          { type: 'bone-tithe', damageReductionPerRisen: 0.06, maxStacks: 6 },
        ] },
        { hpPct: 0.25, name: 'Harvest',
          description: 'It stops raising and supporting its army: it devours the corpses and then its living adds one by one, each a permanent attack boost, and casts to kill — Grave Burst circles, Bone Spears, and a Soul Nova if you stand close.',
          actions: [
          { type: 'set-raising', enabled: false },
          { type: 'remove-pattern', patternId: 'charnel-reclaim' },
          { type: 'set-pattern', patternId: 'charnel-wrath' },
          { type: 'add-pattern', patternId: 'charnel-nova' },
          { type: 'harvest', intervalMs: 4250, attackMult: 1.07 },
        ] },
      ],
    },
  }],


  // ══════════════════════════════════════════════════════════════════════
  // TRENCH — "Elder Trench Serpent"
  // Identity: ONE ENORMOUS DUEL.
  //
  // The Trench's defining failure condition is that this is one gigantic opponent
  // and you very much do not want a second problem. So the boss is exactly that:
  // slow, enormously durable, heavy ordinary pressure, a periodic shell — and one
  // colossal, entirely predictable DEVOUR that it telegraphs for well over two
  // seconds. Eating it hands the fight back to the serpent: Devour HEALS it.
  //
  // The player's answers are systemic and plentiful — Guard, Barrier, target-cast
  // automation, burst windows into the shell, sustain to out-attrition the bite.
  //
  // REMOVED: `cadenceFinisher` (generic every-4th spike), the 50% enrage, and the
  // 25% `shed-defense`. All three were tier-template beats; none of them were about
  // a huge predator. The escalation is now the Devour itself getting worse.
  //
  // `aoeAttack` is KEPT here, and it is the one boss in the roster that keeps it:
  // the thing is the size of the arena, and a body slam from it plausibly catches
  // everything nearby. It is not the anti-summon crutch it used to be elsewhere —
  // it is also the beat that stops a summon wall from being free real estate.
  //
  // The `void-overlord` staged encounter below is legacy/soft-discarded and is NOT
  // part of the active design table. This serpent is the Trench's boss.
  // ══════════════════════════════════════════════════════════════════════
  ['elder-trench-serpent', {
    id: 'elder-trench-serpent', name: 'Elder Trench Serpent', color: 0x335577,
    isBoss: true,
    stats: { hp: 68910, attack: 143, plating: 20, damageReduction: 0.40, speed: 22, attackRange: 22, attackCooldown: 3200, pullRange: 400 },
    behavior: 'melee', attackStyle: 'bite-trench', biome: 'trench',
    // T4 economy pass (2026-08-30): essenceType purple → green, matching Trench's
    // own gear home colour and its trash-mob essence correction. Quantity/level/
    // biomeXp untouched.
    rewards: { essence: 660, essenceType: 'green', level: 5, biomeXp: 990 },
    ai: { wanderRadius: 100, leashRange: 960, idleMinMs: 4500, idleMaxMs: 11000 },
    targeting: { prefersPlayers: true },
    // TRENCH (boss-lineage redesign 2026-09-27) — THE PRESSURE HUNT.
    //   An ancient sea beast hunting you, piling on more debuffs than one Cleanse
    //   can keep up with:
    //     WOUND (bite) anti-heal · CRUSHING PRESSURE slow · REND (tail) +damage taken.
    //   The room builds DEPTH (uncleansable) that lengthens every debuff it lays.
    //   DEVOUR no longer heals: it hits harder PER DISTINCT DEBUFF on you — Cleanse
    //   is a timing decision (before the Devour; "Debuff Pile" is the rune for it).
    //   A STUNNED Devour staggers the serpent: its one control beat (every other
    //   step is uninterruptible). Debuff resistance (Trench armor), Recovery and
    //   killing faster are the build answers.
    //   Phases: (1) the hunt; (2) ~60% INTO THE DARK — it sinks out of reach, a
    //   shadow circling you, surges up to strike and sinks again, and Depth builds
    //   faster; (3) ~25% CRUSHING DEPTH, the soft enrage: Depth accelerates.
    //   CUT: the 6% Devour heal, Constrict, the fixed Undertow-Constrict sequence
    //   (the Undertow drag stays only as the hunt's opener, to reach a player at range).
    bossPattern: {
      id: 'trench-hunt', name: 'The Hunt',
      damageMultiplier: 2.4, cooldownMs: 11000, initialCooldownMs: 5000,
      stoppedBy: { stun: { staggerMs: 3000, label: 'Choked' } },
      steps: [
        { kind: 'pull', name: 'Undertow', castMs: 900, distance: 280, fx: 'undertow', interruptible: false },
        { kind: 'payoff', name: 'Wounding Bite', castMs: 800, fx: 'trench-bite', reach: 90,
          damageMult: 0.7, interruptible: false, appliesDebuff: { effectId: 'antiheal', plainStatus: true, durationMs: 7000, data: { antihealReduction: 0.35 } } },
        { kind: 'wait', durationMs: 400 },
        { kind: 'payoff', name: 'Crushing Pressure', castMs: 700, fx: 'crushing-pressure', reach: 220,
          damageMult: 0.4, interruptible: false, appliesDebuff: { effectId: 'slow', plainStatus: true, durationMs: 5000, data: { speedMult: 0.6 } } },
        { kind: 'wait', durationMs: 400 },
        { kind: 'payoff', name: 'Tail Lash', castMs: 700, fx: 'tail-lash', reach: 140,
          damageMult: 0.5, interruptible: false, appliesDebuff: { effectId: REND_EFFECT_ID, stacks: 1, maxStacks: 3, durationMs: 8000, data: { damageTakenPct: 0.08 } } },
        { kind: 'wait', durationMs: 600 },
        { kind: 'payoff', name: 'Devour', castMs: 2400, fx: 'devour-maw', reach: 110,
          damageMult: 1.0, perDebuffMult: 0.35 },
        { kind: 'recovery', label: 'Gorged', durationMs: 1000 },
      ],
    },
    // Playtest 2026-09-27: the dark phase dropped the Wound, so the Devour's
    // per-debuff scaling had less to read, and the surfaced windows were too short
    // to burst. Each surge now lays one of the hunt's three debuffs in the same
    // order (Wound, Crushing Pressure, Rend), and the serpent STAYS UP after each
    // surge: that is the burst window.
    bossPatternVariants: [{
      id: 'trench-into-the-dark', name: 'Into the Dark',
      damageMultiplier: 2.4, cooldownMs: 9000, initialCooldownMs: 3000,
      stoppedBy: { stun: { staggerMs: 3000, label: 'Choked' } },
      steps: [
        { kind: 'conceal', name: 'Into the Dark', marker: 'stealth', durationMs: 3500,
          relocate: 'near-target', emergeGap: 70, travelSpeed: 200, surfacesOnContact: true,
          feint: { retreatToPx: 480, untilPct: 0.45 }, interruptible: false },
        { kind: 'payoff', name: 'Wounding Surge', castMs: 500, fx: 'trench-bite', reach: 110,
          damageMult: 0.6, interruptible: false,
          appliesDebuff: { effectId: 'antiheal', plainStatus: true, durationMs: 7000, data: { antihealReduction: 0.35 } } },
        { kind: 'wait', durationMs: 3000 },
        { kind: 'conceal', name: 'Into the Dark', marker: 'stealth', durationMs: 3500,
          relocate: 'near-target', emergeGap: 70, travelSpeed: 200, surfacesOnContact: true,
          feint: { retreatToPx: 480, untilPct: 0.45 }, interruptible: false },
        { kind: 'payoff', name: 'Crushing Surge', castMs: 500, fx: 'crushing-pressure', reach: 110,
          damageMult: 0.6, interruptible: false,
          appliesDebuff: { effectId: 'slow', plainStatus: true, durationMs: 5000, data: { speedMult: 0.6 } } },
        { kind: 'wait', durationMs: 3000 },
        { kind: 'conceal', name: 'Into the Dark', marker: 'stealth', durationMs: 3500,
          relocate: 'near-target', emergeGap: 70, travelSpeed: 200, surfacesOnContact: true,
          feint: { retreatToPx: 480, untilPct: 0.45 }, interruptible: false },
        { kind: 'payoff', name: 'Rending Surge', castMs: 500, fx: 'tail-lash', reach: 110,
          damageMult: 0.6, interruptible: false,
          appliesDebuff: { effectId: REND_EFFECT_ID, stacks: 1, maxStacks: 3, durationMs: 8000, data: { damageTakenPct: 0.08 } } },
        { kind: 'wait', durationMs: 1500 },
        { kind: 'payoff', name: 'Devour', castMs: 2400, fx: 'devour-maw', reach: 110,
          damageMult: 1.0, perDebuffMult: 0.35 },
        { kind: 'recovery', label: 'Gorged', durationMs: 1000 },
      ],
    }],
    bossScript: {
      phases: [
        { hpPct: 1.0, actions: [
          { type: 'room-debuff', effectId: DEPTH_EFFECT_ID, intervalMs: 8000, maxStacks: 12,
            data: { uncleansable: 1, debuffDurationPct: 0.08 } },
        ] },
        { hpPct: 0.6, name: 'Into the Dark',
          description: 'It sinks out of reach and circles as a shadow, surging up to Wound, Crush and Rend you before a Devour, and Depth builds faster. Hit it hard while it is surfaced.',
          actions: [
          { type: 'set-weather', weather: 'abyss' },
          { type: 'set-pattern', patternId: 'trench-into-the-dark' },
          { type: 'room-debuff', effectId: DEPTH_EFFECT_ID, intervalMs: 4500, maxStacks: 16,
            data: { uncleansable: 1, debuffDurationPct: 0.08 } },
        ] },
        { hpPct: 0.25, name: 'Crushing Depth',
          description: 'Depth builds faster and faster, and its attacks come around more often. Depth cannot be cleansed; end the fight.',
          actions: [
          { type: 'room-debuff', effectId: DEPTH_EFFECT_ID, intervalMs: 3000, maxStacks: 24,
            data: { uncleansable: 1, debuffDurationPct: 0.10 },
            accelerate: { intervalMult: 0.85, minIntervalMs: 1000 } },
          { type: 'empower-charged', cooldownMult: 0.75 },
        ] },
      ],
    },
  }],


  // ══════════════════════════════════════════════════════════════════════
  // LEGACY — Void Overlord staged apex encounter.
  //
  // SOFT-DISCARDED. Left untouched by the 2026-08-23 encounter rework by explicit
  // instruction: not redesigned, not rebalanced, not used as inspiration for the
  // active Trench boss above. Its presence here is history, not intent.
  // ══════════════════════════════════════════════════════════════════════

  ['elder-trench-serpent-warden', {
    id: 'elder-trench-serpent-warden', name: 'Elder Trench Serpent Warden', color: 0x223355,
    // Elite encounter unit; spawned in Stage 2 of the Void Overlord encounter.
    // Not a dungeon boss — no biomeXp, no essence reward of its own.
    stats: { hp: 7341, attack: 137, plating: 18, damageReduction: 0.18, speed: 20, attackRange: 22, attackCooldown: 3400, pullRange: 350 },
    behavior: 'melee', attackStyle: 'bite-trench', biome: 'trench',
    rewards: { essence: 0, essenceType: 'purple', level: 0, biomeXp: 0 },
    ai: { wanderRadius: 100, leashRange: 900, idleMinMs: 3000, idleMaxMs: 8000 },
    chargeOnAggro: { speedMult: 2.2, durationMs: 1100 },
    cadenceFinisher: { everyNAttacks: 4, multiplier: 2.2 },   // 231
    enemySoftCap: { capPct: 0.25, capMult: 0.5 },
  }],

  ['void-overlord', {
    id: 'void-overlord', name: 'Void Overlord', color: 0x220044,
    isBoss: true,
    stats: { hp: 29822, attack: 150, plating: 22, damageReduction: 0.24, speed: 18, attackRange: 22, attackCooldown: 3200, pullRange: 400 },
    behavior: 'melee', attackStyle: 'impact', biome: 'trench',
    rewards: { essence: 2000, essenceType: 'purple', level: 5, biomeXp: 3000 },
    ai: { wanderRadius: 0, leashRange: 980, idleMinMs: 4000, idleMaxMs: 9000 },
    cadenceFinisher: { everyNAttacks: 4, multiplier: 2.8 },   // 322 — the deepest cap trip
    enemyShield: { shieldPct: 0.30, intervalMs: 16000, durationMs: 6000 },
    enemySoftCap: { capPct: 0.25, capMult: 0.5 },
    ultimateEncounter: {
      anchor: 'center',
      reset: { onWipe: true },
      spawnFromFeatureId: 'abyssal_throne',
      stages: [
        {
          id: 'waves',
          displayName: 'Summoning Waves',
          objectiveLabel: 'Clear all summoned adds',
          onEnter: [
            { type: 'set-invulnerable', value: true },
            { type: 'set-rooted', value: true },
            { type: 'set-cannot-attack', value: true },
            {
              type: 'spawn-waves',
              waves: [
                { adds: [{ monsterTypeId: 'void-horror', count: 12 }] },
                { adds: [{ monsterTypeId: 'void-horror', count: 9 }, { monsterTypeId: 'void-hulk', count: 4 }] },
                { adds: [{ monsterTypeId: 'void-hulk', count: 8 }] },
              ],
            },
          ],
          completeWhen: { kind: 'waves-cleared' },
        },
        {
          id: 'wardens',
          displayName: 'Void Wardens',
          objectiveLabel: 'Slay the Void Wardens',
          onEnter: [
            { type: 'set-rooted', value: true },
            { type: 'set-cannot-attack', value: true },
            { type: 'spawn-elites', monsterTypeId: 'elder-trench-serpent-warden', count: 3, offsetRange: 280 },
          ],
          completeWhen: { kind: 'elites-cleared' },
        },
        {
          id: 'flood',
          displayName: 'The Flood',
          vulnerable: true,
          onEnter: [
            { type: 'set-invulnerable', value: false },
            { type: 'set-rooted', value: false },
            { type: 'set-cannot-attack', value: false },
            { type: 'set-feature-block', featureId: 'abyssal_throne', value: false },
            {
              // The void-flood is an environmental DoT that escalates over time,
              // capped at 40 stacks. Rewards killing the boss fast; punishes stalling.
              type: 'environmental-dot',
              effectId: 'void-flood',
              damagePerStack: 1,
              tickIntervalMs: 1000,
              maxStacks: 0,
              refreshMs: 5000,
              stackCap: 40,
              hazardHint: 'The flood permeates the abyss',
            },
          ],
        },
      ],
    },
  }],


  // ── Encounter-only add types (spawned by Void Overlord stages) ─────────
  // Defined here for colocation. Not dungeon-spawned independently.

  ['void-horror', {
    id: 'void-horror', name: 'Void Horror', color: 0x331144,
    // Stage-1 swarm filler. Fast, low HP, frequent light hits. The threat
    // is volume (12 → 9 → 8 of them). DoT pressure adds up fast.
    stats: { hp: 872, attack: 68, plating: 0, damageReduction: 0, speed: 82, attackRange: 12, attackCooldown: 1100, pullRange: 310 },
    behavior: 'melee', attackStyle: 'impact', biome: 'trench',
    rewards: { essence: 0, essenceType: 'purple', level: 0, biomeXp: 0 },
    ai: { wanderRadius: 350, leashRange: 850, idleMinMs: 400, idleMaxMs: 2000 },
    dotEffect: { debuffId: 'void-horror-corruption', label: 'Void Corruption', damagePerStack: 12, maxStacks: 4, tickIntervalMs: 1000, durationMs: 2000 },
  }],

  ['void-hulk', {
    id: 'void-hulk', name: 'Void Hulk', color: 0x221133,
    // Stage-1 heavy add. Slow, hard-hitting, high plating — the anchor unit
    // in each wave. Tests pierce tools (Rupture, brittle weapon) mid-encounter.
    stats: { hp: 5047, attack: 124, plating: 16, damageReduction: 0.16, speed: 22, attackRange: 15, attackCooldown: 3500, pullRange: 200 },
    behavior: 'melee', attackStyle: 'impact', biome: 'trench',
    rewards: { essence: 0, essenceType: 'purple', level: 0, biomeXp: 0 },
    ai: { wanderRadius: 100, leashRange: 750, idleMinMs: 3000, idleMaxMs: 8000 },
    chargeOnAggro: { speedMult: 2.0, durationMs: 1200 },
    cadenceFinisher: { everyNAttacks: 4, multiplier: 2.0 },   // 190
  }],

] satisfies [string, MonsterDefinition][];
