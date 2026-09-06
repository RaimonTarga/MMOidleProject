import { SUN_MARK_EFFECT_ID, TUNDRA_CHILL_EFFECT_ID } from '../../systems/monsterDebuffs';
import { FROZEN_STATUS_ID } from '../../systems/statusPolicy';
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
  // Identity: TELEGRAPHED CATASTROPHIC IMPACT, at its most elaborate.
  //
  // The lineage's whole arc lands here:
  //   T1 circle Slam → T2 stronger Slam behind a defended position →
  //   T3 charge-lock-Slam → T4 charge-lock-Earthshatter WITH delayed fault lines.
  // The aftershock is the T4 layer: the impact is survivable, and then the ground
  // splits along six radial lines 900ms later. Reading the first hit is not enough.
  //
  // `cadenceFinisher` is kept — unlike the generic version on the other T4 bosses,
  // a deterministic every-4th heavy hit is the SMALL version of the same reading
  // skill the Earthshatter tests, and it is the only pressure between slams on a
  // 4.2s swing timer. Both phases escalate the slam; nothing else is bolted on.
  // ══════════════════════════════════════════════════════════════════════
  ['iron-crest-titan', {
    id: 'iron-crest-titan', name: 'Iron-Crest Titan', color: 0x8899bb,
    isBoss: true,
    stats: { hp: 19499, attack: 228, plating: 14, damageReduction: 0.06, speed: 16, attackRange: 20, attackCooldown: 4200, pullRange: 420 },
    behavior: 'melee', attackStyle: 'quake', biome: 'mountain',
    rewards: { essence: 620, essenceType: 'blue', level: 5, biomeXp: 930 },
    ai: { wanderRadius: 95, leashRange: 960, idleMinMs: 4000, idleMaxMs: 10000 },
    targeting: { prefersPlayers: true },
    // T4 = the full Mountain sentence: committed impact → Earthshatter → delayed
    // fault lines → a long reset. The cracks are the FINITE tail of the payoff, not
    // persistent terrain — they resolve once and are gone, which is why the pattern
    // does not wait on them before opening its recovery.
    //
    // REMOVED with the 2026-09-04 redesign: `chargeOnAggro`, the legacy
    // `engageSequence` opener (a second, worse copy of the charge the pattern now
    // owns), the standalone circular Earthshatter, and `cadenceFinisher` — an
    // independent every-4th heavy hit competing with the sequence for the player's
    // attention is precisely the accumulation this rework exists to undo.
    bossPattern: {
      id: 'titan-earthshatter', name: 'Titan Earthshatter',
      damageMultiplier: 2.2, cooldownMs: 9000, initialCooldownMs: 4500,
      steps: [
        { kind: 'cast', name: 'Titan Charge', castMs: 2600, fx: 'strong-kick',
          lane: { length: 820, halfWidth: 104, lockAtCastPct: 0.6 } },
        // 820px at 540px/s ≈ 1.5s of travel, or less — it STOPS on the body it hits.
        //
        // THE CHARGE IS THE SETUP, NOT THE PAYOFF (2026-09-06). damageMult 1.0 -> 0.3:
        // the tackle is a shove that announces the sentence, and Earthshatter is
        // where the damage lives. The whole sequence is now one decision — read the
        // lane and get off it, or eat all of it.
        { kind: 'charge', speed: 540, damageMult: 0.3, maxTravelMs: 2400 },
        // `requiresChargeHit`: a dodged charge draws no circle at all. It used to
        // erupt at the far lane tip regardless, which taught nothing on a miss and
        // occasionally clipped a player who had dodged correctly. And because the
        // charge now stops where it connects, `captured-endpoint` IS the collision —
        // the shatter lands on the player it just ran down.
        //
        // Deliberately not escapable from dead centre (240px is ~2s of running
        // against a 950ms tell): eating the tackle is the mistake, and this is what
        // the mistake costs. The fault lines below are still a real positional test,
        // so the capstone keeps its second beat.
        { kind: 'impact', name: 'Earthshatter', anchor: 'captured-endpoint',
          radius: 240, damageMult: 1.35, telegraphMs: 950, fx: 'strong-kick',
          requiresChargeHit: true },
        { kind: 'fault-lines', anchor: 'captured-endpoint', delayMs: 900, rayCount: 6,
          length: 330, lineRadius: 24, innerRadius: 95, damageMult: 0.6,
          requiresChargeHit: true },
        // The long reset the lineage builds toward: the whole sentence is answerable,
        // and answering it buys real time on the boss.
        { kind: 'recovery', label: 'Spent', durationMs: 3200 },
      ],
    },
    bossScript: {
      phases: [
        // The fault lines multiply and bite harder: the safe gaps between rays close.
        { hpPct: 0.5, actions: [
          { type: 'empower-charged', multiplierMult: 1.15, aftershockRayCountAdd: 3, aftershockDamageMult: 1.15 },
        ] },
        // Then the whole sequence comes at you sooner. Same idea, no new keywords.
        { hpPct: 0.25, actions: [
          { type: 'empower-charged', cooldownMult: 0.70, radiusMult: 1.10 },
          { type: 'stat-buff', stat: 'speed', mult: 1.35 },
        ] },
      ],
    },
  }],


  // ══════════════════════════════════════════════════════════════════════
  // DESERT — "Dune-Throne Sovereign"
  // Identity: SETUP / CONTROL -> PUNISHMENT, as a three-act duel.
  //
  //   ACT I  (100–50%) SETUP. Melee controller: slows on every hit, and paints
  //     Sun Mark with its own blows. It is preparing a punishment.
  //   ACT II (50–25%)  PUNISHMENT. It backs off to 250 range and kites, and the
  //     Sandstorm Rupture becomes the cash-out for everything it set up in Act I.
  //     Chasing it eats free slowed hits; standing still eats the Rupture.
  //   ACT III (<25%)   EXECUTION. It stops controlling space entirely and commits
  //     to killing you at melee range.
  //
  // The mark carries THROUGH the range morph — that pairing is the point. Desert
  // compresses the biome's controller/dealer pairing into one duellist, which is
  // why this boss has no adds at any tier.
  // ══════════════════════════════════════════════════════════════════════
  ['dune-throne-sovereign', {
    id: 'dune-throne-sovereign', name: 'Dune-Throne Sovereign', color: 0xddbb33,
    isBoss: true,
    stats: { hp: 17893, attack: 185, plating: 8, damageReduction: 0.08, speed: 44, attackRange: 20, attackCooldown: 2800, pullRange: 400 },
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
        { kind: 'apply-status', name: 'Death Sting', castMs: 1200, fx: 'strong-kick',
          effectId: SUN_MARK_EFFECT_ID, stacks: 1, durationMs: 7000 },
        { kind: 'wait', durationMs: 1600 },
        { kind: 'payoff', name: 'Execution', castMs: 1500, fx: 'strong-kick',
          damageMult: 1.0, amplifiedMult: 2.0,
          consumes: { effectId: SUN_MARK_EFFECT_ID }, radius: 180 },
        { kind: 'recovery', label: 'Spent', durationMs: 2000 },
      ],
    },
    bossScript: {
      phases: [
        { hpPct: 0.5, actions: [
          // ACT II — standoff, and the Rupture becomes the punishment.
          { type: 'morph', isRanged: true, attackStyle: 'sandblast', attackRange: 250, kite: true },
          { type: 'empower-charged', multiplierMult: 1.25, cooldownMult: 0.75, radiusMult: 1.10 },
        ] },
        { hpPct: 0.25, actions: [
          // ACT III — it drops the kite and commits.
          { type: 'morph', isRanged: false, attackRange: 20, kite: false },
          { type: 'stat-buff', stat: 'speed', mult: 1.35 },
          { type: 'empower-charged', cooldownMult: 0.70 },
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
    stats: { hp: 18352, attack: 117, plating: 0, damageReduction: 0.04, speed: 76, attackRange: 20, attackCooldown: 1400, pullRange: 400 },
    behavior: 'melee', attackStyle: 'slash', biome: 'jungle',
    rewards: { essence: 605, essenceType: 'green', level: 5, biomeXp: 908 },
    ai: { wanderRadius: 150, leashRange: 960, idleMinMs: 2000, idleMaxMs: 6000 },
    targeting: { prefersPlayers: true },
    // JUNGLE T4 = the full escape cycle, UNTIL IT IS CORNERED.
    //
    // Above 50% it runs the lineage's loop: Escape Guard, retreat, and either a
    // stumble or a vanish-and-ambush with venom. Below 50% the wounded frenzy takes
    // over and the pattern stops arming entirely (`armAboveHpPct`) — the boss has
    // given up on running and commits to killing you.
    //
    // That is a GATE, not a fourth mechanic: the capstone's low-health state is the
    // ABSENCE of the thing the lineage is about, which reads instantly in play and
    // costs no new keywords.
    //
    // REMOVED with the 2026-09-04 redesign: passive `evasion` and the permanent
    // evasion-to-zero phase that answered it, `openingStrike`, the always-on
    // `dotEffect` (venom now follows a successful ambush only, so it MEANS
    // something), Killing Leap, and `chargeOnAggro`.
    bossPattern: {
      id: 'bloodfang-escape', name: 'Escape',
      damageMultiplier: 2.3, cooldownMs: 12000, initialCooldownMs: 7000,
      armAboveHpPct: 0.5,
      steps: [
        { kind: 'escape-guard', name: 'Flee', castMs: 2400, fx: 'shield',
          sourceId: 'jungle-escape', shieldPct: 0.06,
          onBreak: { staggerMs: 2400, label: 'Cornered' },
          maxInstinctStacks: 3, instinctCastReductionPct: 0.15 },
        { kind: 'conceal', name: 'Vanished', marker: 'stealth', durationMs: 1300,
          relocate: 'leash-edge' },
        { kind: 'payoff', name: 'Ambush', castMs: 750, fx: 'savage-maul',
          damageMult: 1.0 },
        { kind: 'apply-status', name: 'Venom Burst', castMs: 500, fx: 'savage-maul',
          effectId: 'verdant-crown-venom', stacks: 4, durationMs: 8000,
          data: { damagePerStack: 16, tickIntervalMs: 1000, isDot: 1 } },
        { kind: 'recovery', label: 'Winded', durationMs: 1600 },
      ],
    },
    bossScript: {
      phases: [
        { hpPct: 0.5, actions: [
          // FRENZY. Cornered: it stops trying to escape (the pattern's health gate
          // closes here) and commits everything to the duel.
          { type: 'stat-buff', stat: 'attack', mult: 1.40 },
          { type: 'stat-buff', stat: 'speed', mult: 1.25 },
        ] },
        // The frenzy peaks. Cadence only — the shape does not change again.
        { hpPct: 0.25, actions: [{ type: 'enrage', atkMult: 1.0, cdMult: 0.75 }] },
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
    stats: { hp: 22940, attack: 189, plating: 22, damageReduction: 0.14, speed: 14, attackRange: 20, attackCooldown: 4500, pullRange: 420 },
    behavior: 'melee', attackStyle: 'frost', biome: 'tundra',
    rewards: { essence: 640, essenceType: 'blue', level: 5, biomeXp: 960 },
    ai: { wanderRadius: 90, leashRange: 960, idleMinMs: 4000, idleMaxMs: 10000 },
    targeting: { prefersPlayers: true },
    // T4 = the same Chill check, with a much larger Collapse. Same response chain
    // (Break Free then Step Back, or Guard, or tank); the tier changes the size of
    // the payoff, not the question.
    //
    // REMOVED with the 2026-09-04 redesign: `chargeOnAggro`, the per-hit `rampDebuff`,
    // the Ice Armor shield/vulnerability pair, the generic Glacial Collapse circle —
    // and, importantly, `scalesWithAmbientRamp`. That last one made the boss's damage
    // secretly climb with the room's Chill, which §5.6 forbids outright: the stacks
    // decide IF you get frozen, never how hard anything hits. A hidden multiplier on
    // an already-unavoidable hit is the least readable escalation available.
    bossPattern: {
      id: 'glacial-collapse', name: 'Deep Freeze',
      damageMultiplier: 1.9, cooldownMs: 9500, initialCooldownMs: 5000,
      steps: [
        { kind: 'apply-status', name: 'Deep Freeze', castMs: 1500, fx: 'strong-kick',
          effectId: FROZEN_STATUS_ID, stacks: 1, durationMs: 2400,
          requires: { effectId: TUNDRA_CHILL_EFFECT_ID, minStacks: 5 } },
        { kind: 'impact', name: 'Glacial Collapse', anchor: 'self', radius: 250,
          damageMult: 1.0, telegraphMs: 1500, fx: 'strong-kick' },
        { kind: 'recovery', label: 'Thawing', durationMs: 2400 },
      ],
    },
    bossScript: {
      phases: [
        // The Collapse widens and lands more often. One idea, tightened — no new
        // defensive keyword bolted on for the tier.
        { hpPct: 0.25, actions: [
          { type: 'empower-charged', multiplierMult: 1.20, cooldownMult: 0.75, radiusMult: 1.10 },
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
    stats: { hp: 20646, attack: 130, plating: 10, damageReduction: 0.05, speed: 24, attackRange: 20, attackCooldown: 2600, pullRange: 400 },
    behavior: 'melee', attackStyle: 'fire', biome: 'volcanic',
    rewards: { essence: 625, essenceType: 'red', level: 5, biomeXp: 938 },
    ai: { wanderRadius: 120, leashRange: 960, idleMinMs: 2500, idleMaxMs: 7000 },
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
    // T4 runs the same loop, then adds ONE catastrophe. Near the final quarter the
    // Caldera Sovereign stops attacking entirely and begins a long, obvious,
    // UNINTERRUPTIBLE room-wide Cataclysm. The primary answer is to kill it before
    // the cast completes; a very tanky or guarded build can survive the blast through
    // ordinary damage resolution, and the fight simply continues — surviving a failed
    // race is a legitimate outcome, not a win condition and not a loss condition.
    //
    // It fires ONCE per life (`oncePerLife`): repeating it would turn a decisive race
    // into a metronome, and surviving it would stop meaning anything.
    //
    // SIMMERING BURN is low-damage, high-cap and long — attrition you can cleanse,
    // deliberately unlike Heat, which you answer with your feet.
    //
    // REMOVED with the 2026-09-04 redesign: `scalesWithAmbientRamp` (see below), the
    // generic Caldera Eruption, both `stoke-ramp` floor/cap pushes, the threshold
    // Caldera Vent cast, and `chargeOnAggro`.
    //
    // > REVERSAL of a 2026-08-23 call. The capstone used to hit harder per Heat stack,
    // > defended then as "for the apex of the Heat biome the ramp is the whole
    // > encounter". But Heat ALREADY raises the damage the player takes, visibly, on
    // > their own status bar. Adding an invisible boss-side multiplier on top counted
    // > the same escalation twice and made the fight's difficulty curve unreadable.
    dotEffect: {
      debuffId: 'caldera-burn', label: 'Simmering Burn',
      damagePerStack: 4, maxStacks: 12, tickIntervalMs: 1000, durationMs: 12000,
    },
    shellUp: {
      atHpPct: 0.85, durationMs: 4000, directDamageMult: 0.30, repeatIntervalMs: 15000,
      pool: {
        radius: 210, durationMs: 9000, damagePerTick: 16, tickIntervalMs: 1000,
        flavor: 'magma-vent', rampAccelMult: 3,
      },
    },
    bossPattern: {
      id: 'cataclysm', name: 'Cataclysm',
      damageMultiplier: 3.0, cooldownMs: 60000, initialCooldownMs: 0,
      armBelowHpPct: 0.25,
      oncePerLife: true,
      steps: [
        // Long, obvious, and explicitly UNINTERRUPTIBLE: the answer is the DPS race,
        // not a stun. Marked guardable so Guard is still a legitimate way to eat it.
        { kind: 'cast', name: 'Cataclysm', castMs: 8000, fx: 'frenzy', interruptible: false },
        { kind: 'impact', name: 'Cataclysm', anchor: 'self', radius: 2000,
          damageMult: 1.0, telegraphMs: 400, fx: 'strong-kick' },
        { kind: 'recovery', label: 'Spent', durationMs: 3000 },
      ],
    },
    bossScript: {
      phases: [
        // The cycle tightens. No ramp stoking: the room's Heat is the player's own
        // to manage, and a boss shoving a floor under it removes the choice.
        { hpPct: 0.5, actions: [{ type: 'stat-buff', stat: 'attack', mult: 1.15 }] },
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
    stats: { hp: 19499, attack: 115, plating: 14, damageReduction: 0.08, speed: 28, attackRange: 20, attackCooldown: 2300, pullRange: 400 },
    behavior: 'melee', attackStyle: 'poison', biome: 'graveyard',
    rewards: { essence: 615, essenceType: 'purple', level: 5, biomeXp: 923 },
    ai: { wanderRadius: 105, leashRange: 960, idleMinMs: 3000, idleMaxMs: 8000 },
    targeting: { prefersPlayers: true },
    // WASTELAND = AUTHORED NECROMANCY. One opening entourage, visible corpses,
    // selective Raise Dead, and ONE major Mass Resurrection. Risen deaths are
    // permanent — the tide is finite, and killing a body twice is the last time.
    //
    // THE CORPSES ARE THE ENCOUNTER, so they are now VISIBLE (redesign §4.9): every
    // body on the floor is broadcast with a stable id, and the ones a cast has
    // claimed are marked and tethered to the boss WHILE THE CAST RUNS. Previously
    // necromancy was invisible bookkeeping — things simply reappeared — and the
    // player had no way to read which of the dead were coming back, or to answer it.
    //
    // REMOVED with the 2026-09-04 redesign: the generic Charnel Burst circle, the
    // broad always-on Crown Decay DoT (a personal poison package competing with the
    // corpse tide for the same attrition role — it made this read as a second Swamp
    // boss), the 25% Deathless Tide wave and its cadence roar (§12.5: one major
    // resurrection, no generic low-health nuke), and `chargeOnAggro`.
    //
    // The steady necromancy reaches wide (the arena is large and the corpses are
    // wherever you killed them) but raises only ONE at a time on an 8s cadence. That
    // selectivity is the point: a boss raising everything constantly is a spawner,
    // and Plains already owns spawning. Placeholder numbers.
    raisesDead: {
      intervalMs: 8000, initialDelayMs: 5000, corpseRange: 520, maxAlive: 4,
      hpMult: 0.75, damageMult: 0.80,
      castMs: 1300, castName: 'Raise Dead', castFx: 'raise-dead',
    },
    bossScript: {
      phases: [
        // The OPENING ENTOURAGE, on engage. Fires once and never respawns: these
        // three are the seed corpses the whole encounter is fed from.
        //   Bone Crawler   — corpse fodder, there to die and be raised.
        //   Plague Hound   — limited plague pressure, and its death pool is the one
        //                    hazard in the fight.
        //   Carrion Vulture— ranged support through its existing undead haste.
        { hpPct: 1.0, actions: [
          { type: 'spawn-adds', monsterTypeId: 'bone-crawler', count: 3, maxAlive: 5, offsetRange: 260 },
          { type: 'spawn-adds', monsterTypeId: 'plague-hound', count: 1, maxAlive: 5, offsetRange: 260 },
          { type: 'spawn-adds', monsterTypeId: 'carrion-vulture', count: 1, maxAlive: 5, offsetRange: 260 },
        ] },
        // ONE major Mass Resurrection: everything put down in the last few seconds
        // gets up at once, and the tide is allowed to stand two deeper. There is no
        // second wave — a low-health repeat would make the first one meaningless.
        { hpPct: 0.5, actions: [
          { type: 'cast', castMs: 1800, label: 'Mass Resurrection', fx: 'roar', actions: [
            { type: 'raise-dead', count: 3, maxAliveAdd: 2 },
          ] },
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
    stats: { hp: 21793, attack: 143, plating: 20, damageReduction: 0.22, speed: 22, attackRange: 22, attackCooldown: 3200, pullRange: 400 },
    behavior: 'melee', attackStyle: 'impact', biome: 'trench',
    // T4 economy pass (2026-08-30): essenceType purple → green, matching Trench's
    // own gear home colour and its trash-mob essence correction. Quantity/level/
    // biomeXp untouched.
    rewards: { essence: 660, essenceType: 'green', level: 5, biomeXp: 990 },
    ai: { wanderRadius: 100, leashRange: 960, idleMinMs: 4500, idleMaxMs: 11000 },
    targeting: { prefersPlayers: true },
    // TRENCH = ONE ENORMOUS DUEL, as a single readable sequence.
    //
    //   Wound bite  ->  Undertow drags a disengaged target back  ->  a brief
    //   Constrict if it needs one  ->  a long, enormous Devour that HEALS it on hit.
    //
    // Every step has its own answer, and that is the point: Cleanse the Wound, Step
    // Back out of the Devour, Break Free the Constrict then Step Back, Guard it, or
    // simply tank it. Eating the Devour hands the fight back to the boss, which is
    // what makes the long tell worth reading.
    //
    // UNDERTOW IS A PULL, not a speed buff and not a teleport (§5.10). A boss that
    // permanently outruns you deletes ranged builds; one that blinks to you cannot be
    // read at all. A bounded, resisted, obstacle-respecting drag can be seen coming
    // and answered — and it is resisted by the same forced-movement stat that resists
    // knockback, because being shoved and being dragged are one concept to the player.
    //
    // REMOVED with the 2026-09-04 redesign: `aoeAttack` (a boss AoE riding every
    // ordinary swing, invisible and unanswerable), the periodic `enemyShield` and its
    // 25% escalation, the whole Pressure / Crushing Tide / Undertow Current rotation
    // (an anti-heal chip, a slow zone and a self-haste — three beats competing with
    // the one bite that is supposed to BE the fight), and `chargeOnAggro`.
    //
    // The anti-heal now lives ONLY on the Wound bite: non-stacking, cleanseable, and
    // attached to a beat the player can see. The old version applied it from ordinary
    // hits AND an ability, which is how the Trench reached 75-90% suppression.
    bossPattern: {
      id: 'trench-devour', name: 'Devour',
      damageMultiplier: 2.7, cooldownMs: 12000, initialCooldownMs: 6500,
      steps: [
        { kind: 'apply-status', name: 'Abyssal Bite', castMs: 1100, fx: 'savage-maul',
          effectId: 'antiheal', stacks: 1, durationMs: 6000,
          data: { antihealReduction: 0.35 } },
        // The answer window for the Wound, and the moment a player who disengaged
        // gets dragged back in.
        { kind: 'wait', durationMs: 900 },
        { kind: 'pull', name: 'Undertow', castMs: 1200, distance: 320, fx: 'trench-current' },
        { kind: 'apply-status', name: 'Constrict', castMs: 700, fx: 'trench-current',
          effectId: 'dot-frozen', stacks: 1, durationMs: 1200 },
        // DEVOUR. Single-target by design — a bite is a bite, and the self-heal only
        // resolves on a landed direct hit, so dodging it denies the heal outright.
        { kind: 'payoff', name: 'Devour', castMs: 2600, fx: 'strong-kick',
          damageMult: 1.0, healsSelfPct: 0.06 },
        { kind: 'recovery', label: 'Gorged', durationMs: 2600 },
      ],
    },
    bossScript: {
      phases: [
        // It gets hungrier: the bite lands harder and comes around sooner.
        { hpPct: 0.5,  actions: [{ type: 'empower-charged', multiplierMult: 1.20, cooldownMult: 0.80 }] },
        // BLOOD IN THE WATER. The low-health beat TIGHTENS THE GAPS and adds no new
        // attacks: the sequence comes around faster and it closes quicker. It does
        // not armour up — this fight should end by finally landing the kill, not by
        // out-damaging a wall that appeared at 25%.
        { hpPct: 0.25, actions: [
          { type: 'empower-charged', cooldownMult: 0.75 },
          { type: 'stat-buff', stat: 'speed', mult: 1.25, label: 'blood-in-the-water' },
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
    behavior: 'melee', attackStyle: 'impact', biome: 'trench',
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
