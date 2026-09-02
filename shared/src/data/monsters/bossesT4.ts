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
    chargeOnAggro: { speedMult: 2.5, durationMs: 1200 },
    engageSequence: { kind: 'charge-lock-charged-attack', speedMult: 3.2, maxChargeMs: 1900, lockoutMs: 550 },
    chargedAttack: {
      name: 'Titan Earthshatter', castMs: 2600, cooldownMs: 9000, initialCooldownMs: 4500,
      multiplier: 2.2, fx: 'strong-kick', aoe: { radius: 240 },
      aftershock: {
        kind: 'radial-fault-lines', delayMs: 900, rayCount: 6,
        length: 330, lineRadius: 24, innerRadius: 95, damageMultiplier: 1.35,
      },
    },
    cadenceFinisher: { everyNAttacks: 4, multiplier: 2.0 },   // 456 — deep cap trip
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
    chargeOnAggro: { speedMult: 2.5, durationMs: 1000 },
    slowEffect: { speedMult: 0.45, durationMs: 3000 },
    appliesMark: { durationMs: 5000 },
    markedStrike: { multiplier: 2.0 },
    chargedAttack: {
      name: 'Sandstorm Rupture', castMs: 1500, cooldownMs: 9000, initialCooldownMs: 4500,
      multiplier: 1.8, fx: 'strong-kick', aoe: { radius: 180 },
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
    chargeOnAggro: { speedMult: 2.8, durationMs: 900 },
    evasion: 0.25,
    openingStrike: { multiplier: 2.6 },
    dotEffect: { debuffId: 'verdant-crown-venom', label: 'Crown Venom', damagePerStack: 8, maxStacks: 5, tickIntervalMs: 1000, durationMs: 3500 },
    // The committed leap the T3 Bramble-Slasher taught, grown up. Rare and huge in
    // Hunt; in Frenzy it is the thing that actually kills you.
    chargedAttack: {
      name: 'Killing Leap', castMs: 850, cooldownMs: 12000, initialCooldownMs: 7000,
      multiplier: 2.3, fx: 'savage-maul', aoe: { radius: 120 },
      knockback: { distance: 150 },
    },
    bossScript: {
      phases: [
        { hpPct: 0.5, actions: [
          // FRENZY. It stops dodging — permanently — and commits everything.
          { type: 'stat-buff', stat: 'evasion', mult: 0 },
          { type: 'stat-buff', stat: 'attack', mult: 1.40 },
          { type: 'stat-buff', stat: 'speed', mult: 1.25 },
          { type: 'empower-charged', cooldownMult: 0.55 },
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
    chargeOnAggro: { speedMult: 2.0, durationMs: 1300 },
    // Trimmed from 0.50/0.40: the node's Chill already contributes up to 30% move
    // and 24% attack on top of this, and the two together have to leave the player
    // able to reposition and trade.
    rampDebuff: { moveSlowPerHit: 0.07, moveSlowMaxPct: 0.40, atkSlowPerHit: 0.05, atkSlowMaxPct: 0.30, stackDurationMs: 5000 },
    scalesWithAmbientRamp: { perStackPct: 0.07, maxPct: 0.42, chargedOnly: true },
    chargedAttack: {
      name: 'Glacial Collapse', castMs: 2200, cooldownMs: 9500, initialCooldownMs: 5000,
      multiplier: 1.9, fx: 'strong-kick', aoe: { radius: 250 },
    },
    enemyShield: {
      shieldPct: 0.20, intervalMs: 13000, durationMs: 6500,
      shatter: {
        selfDamagePct: 0.08,
        vulnerability: { damageTakenPct: 0.22, durationMs: 4500 },
      },
    },
    bossScript: {
      phases: [
        // The armour thickens and returns sooner — but breaking it now staggers the
        // Patriarch far harder. Fewer windows, each worth much more.
        { hpPct: 0.5, actions: [
          { type: 'apply-shield', shieldPct: 0.28, intervalMs: 10000, durationMs: 7000,
            shatter: {
              selfDamagePct: 0.11,
              vulnerability: { damageTakenPct: 0.30, durationMs: 5500 },
            } },
        ] },
        // And the Collapse — already fed by however cold the room has made you —
        // widens and lands more often.
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
    chargeOnAggro: { speedMult: 2.5, durationMs: 1000 },
    // Not `chargedOnly`: for the apex of the Heat biome the ramp is the whole
    // encounter, not a rider on one telegraph (contrast the Tundra Patriarch).
    scalesWithAmbientRamp: { perStackPct: 0.06, maxPct: 0.54 },
    dotEffect: { debuffId: 'caldera-burn', label: 'Caldera Burn', damagePerStack: 10, maxStacks: 5, tickIntervalMs: 1000, durationMs: 3000 },
    chargedAttack: {
      name: 'Caldera Eruption', castMs: 1300, cooldownMs: 7000, initialCooldownMs: 3500,
      multiplier: 1.8, fx: 'strong-kick', aoe: { radius: 200 },
    },
    bossScript: {
      phases: [
        { hpPct: 0.5, actions: [
          { type: 'stoke-ramp', rampMsMult: 0.65, minStacks: 2 },
          { type: 'empower-charged', multiplierMult: 1.15, cooldownMult: 0.85 },
        ] },
        { hpPct: 0.25, actions: [
          { type: 'stoke-ramp', rampMsMult: 0.70, minStacks: 4, maxStacksAdd: 3 },
          { type: 'empower-charged', cooldownMult: 0.70, radiusMult: 1.15 },
          // The floor of the arena gives way.
          { type: 'spawn-pool', radius: 260, durationMs: 20000, damagePerTick: 20, tickIntervalMs: 1000, slowSpeedMult: 0.7 },
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
  // creatures you already killed refuse to stay dead — the entourage is small, and
  // the pressure comes from having to kill the same bodies repeatedly while the
  // boss is still up. It needs no big personal DoT package; the attrition is the
  // entourage, and its Crown Decay is now a light chip rather than the main event.
  // ══════════════════════════════════════════════════════════════════════
  ['charnel-crown-sovereign', {
    id: 'charnel-crown-sovereign', name: 'Charnel-Crown Sovereign', color: 0x553366,
    isBoss: true,
    stats: { hp: 19499, attack: 115, plating: 14, damageReduction: 0.08, speed: 28, attackRange: 20, attackCooldown: 2300, pullRange: 400 },
    behavior: 'melee', attackStyle: 'poison', biome: 'graveyard',
    rewards: { essence: 615, essenceType: 'purple', level: 5, biomeXp: 923 },
    ai: { wanderRadius: 105, leashRange: 960, idleMinMs: 3000, idleMaxMs: 8000 },
    targeting: { prefersPlayers: true },
    chargeOnAggro: { speedMult: 2.0, durationMs: 1100 },
    // Cut from 9x6 to a light chip: the entourage is the attrition now, and stacking
    // a heavy personal DoT on top made this read as a second Swamp boss.
    dotEffect: { debuffId: 'charnel-crown-decay', label: 'Crown Decay', damagePerStack: 5, maxStacks: 4, tickIntervalMs: 1000, durationMs: 4000 },
    // The steady necromancy. Reaches wide (the arena is large and the corpses are
    // wherever you killed them) but raises only one at a time on an 8s cadence —
    // the phase bursts are the spikes. Placeholder numbers.
    raisesDead: {
      intervalMs: 8000, initialDelayMs: 5000, corpseRange: 520, maxAlive: 4,
      hpMult: 0.75, damageMult: 0.80,
      castMs: 1300, castName: 'Raise Dead', castFx: 'raise-dead',
    },
    chargedAttack: {
      name: 'Charnel Burst', castMs: 1500, cooldownMs: 9000, initialCooldownMs: 4500,
      multiplier: 1.7, fx: 'strong-kick', aoe: { radius: 210 },
    },
    bossScript: {
      phases: [
        // hpPct 1.0 fires the instant it is engaged: the entourage is part of the
        // encounter's opening state, not a mid-fight surprise. `maxAlive` keeps the
        // simultaneous count controlled — Wasteland is no longer a density biome.
        { hpPct: 1.0, actions: [
          { type: 'spawn-adds', monsterTypeId: 'bone-crawler', count: 3, maxAlive: 5, offsetRange: 240 },
          { type: 'spawn-adds', monsterTypeId: 'plague-hound', count: 1, maxAlive: 5, offsetRange: 240 },
        ] },
        // MASS RESURRECTION — everything you have put down in the last few seconds
        // gets back up at once, and the tide is allowed to stand two deeper.
        { hpPct: 0.5, actions: [
          { type: 'cast', castMs: 1800, label: 'Mass Resurrection', fx: 'roar', actions: [
            { type: 'raise-dead', count: 3, maxAliveAdd: 2 },
            { type: 'spawn-adds', monsterTypeId: 'bone-crawler', count: 2, maxAlive: 5, offsetRange: 240 },
          ] },
        ] },
        // The last wave claws up, and a necrotic roar drives everything it owns.
        { hpPct: 0.25, actions: [
          { type: 'cast', castMs: 2000, label: 'Deathless Tide', fx: 'roar', actions: [
            { type: 'raise-dead', count: 4, maxAliveAdd: 2 },
            { type: 'roar', attackSpeedPct: 0.30, durationMs: 12000, radius: 420 },
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
    chargeOnAggro: { speedMult: 2.3, durationMs: 1200 },
    aoeAttack: { radius: 130, damageMult: 0.5 },
    enemyShield: { shieldPct: 0.28, intervalMs: 15000, durationMs: 6000 },
    // DEVOUR. Single-target by design — no `aoe`, both because a bite is a bite and
    // because the self-heal only resolves on the direct path. A very long tell, a
    // very long cooldown, and a very large consequence.
    chargedAttack: {
      name: 'Devour', castMs: 2600, cooldownMs: 12000, initialCooldownMs: 6500,
      multiplier: 2.7, fx: 'strong-kick', healsSelfPct: 0.06,
    },
    bossScript: {
      phases: [
        // It gets hungrier: the bite lands harder and comes around sooner.
        { hpPct: 0.5,  actions: [{ type: 'empower-charged', multiplierMult: 1.20, cooldownMult: 0.80 }] },
        // And it armours up rather than shedding — this fight ends by out-damaging
        // a wall, not by waiting for the wall to fall off.
        { hpPct: 0.25, actions: [
          { type: 'apply-shield', shieldPct: 0.34, intervalMs: 11000, durationMs: 6500 },
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
