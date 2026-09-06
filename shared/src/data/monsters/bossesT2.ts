import { SUN_MARK_EFFECT_ID } from '../../systems/monsterDebuffs';
import type { MonsterDefinition } from './types';

// ─────────────────────────────────────────────────────────────────────────
// BOSS REBALANCE — T1 + T2 (Pass 1). Follows boss-design.md.
//
// ENCOUNTER REWORK (2026-08-23). T2 = the tier that adds ONE meaningful escalation
// or supporting mechanic on top of the T1 identity — never a second, unrelated shape.
// True shape-swaps and range-flips start at T3 via `morph`.
//
// The anti-summon cleave is GONE from every boss: body-blocking is solved at the
// targeting layer (`targeting.prefersPlayers`), so AoE now exists only where the
// encounter wants it, and each boss's charged attack doubles as the periodic sweep.
//
// No two enrages on one boss (last-write-wins restore bug) — speed pressure uses
// stat-buff. Phase buffs omit durationMs = permanent for the rest of the life.
//
// DESERT/JUNGLE bosses moved out of "deferred" — those biomes debut at T2, so
// they get the full T2 treatment now. `glacial-colossus` (Tundra) is DELETED:
// Tundra debuts at T3, its boss is frost-plated-rime-mammoth.
//
// Stat anchors (boss-design.md): boss HP ~9-10x median trash & >=2x toughest
// elite; per-hit ~1.3-1.4x the biome's biggest trash hit; Mtn/Cave slams ~40-50%
// of player pool (trip the cap). Rewards/essence = placeholder (economy deferred).
// ─────────────────────────────────────────────────────────────────────────

export const bossMonsterEntriesT2 = [

  // ════════════════════════ T2 BOSSES (+ one phase @50%) ════════════════════════

  // PLAINS — SWARM COMMANDER, deepened. T2 adds composition and reinforcement
  // TIMING, not a stronger duellist: boars join the slime trickle, and both phase
  // beats are a rally rather than a self-buff.
  ['gorging-razortusk', {
    id: 'gorging-razortusk', name: 'Gorging Razortusk', color: 0xcc9922,
    isBoss: true,
    stats: { hp: 4000, attack: 96, plating: 8, damageReduction: 0.05, speed: 46, attackRange: 15, attackCooldown: 2200, pullRange: 320 },
    behavior: 'melee', attackStyle: 'impact', biome: 'plains',
    rewards: { essence: 150, essenceType: 'yellow', level: 5, biomeXp: 225 },
    ai: { wanderRadius: 140, leashRange: 850, idleMinMs: 2000, idleMaxMs: 5500 },
    targeting: { prefersPlayers: true },
    // PLAINS EXAM = "survive the swarm", T2 escalation: a constant slime trickle plus
    // two rally beats (50% = a slime wave and a boar, 25% = a boar pair and more
    // slimes). The old 50% self-enrage was removed — the razortusk's answer to losing
    // is to call MORE of the herd, never to become the tier's best personal attacker.
    // Adds despawn on boss death. Numbers placeholder — user balance pass.
    bossScript: {
      phases: [
        { hpPct: 0.5, actions: [
          { type: 'cast', castMs: 2000, label: 'Rallying Cry', actions: [
            { type: 'spawn-adds', monsterTypeId: 'plains-slime', count: 5, offsetRange: 220 },
            { type: 'spawn-adds', monsterTypeId: 'boar', count: 1, offsetRange: 220 },
            { type: 'roar', attackSpeedPct: 0.25, durationMs: 8000, radius: 320 },
          ] },
        ] },
        { hpPct: 0.25, actions: [
          { type: 'cast', castMs: 2000, label: 'Rallying Cry', actions: [
            { type: 'spawn-adds', monsterTypeId: 'boar', count: 2, offsetRange: 220 },
            { type: 'spawn-adds', monsterTypeId: 'plains-slime', count: 4, offsetRange: 220 },
            { type: 'roar', attackSpeedPct: 0.25, durationMs: 6000, radius: 300 },
          ] },
        ] },
      ],
      repeating: [
        { intervalMs: 10000, initialDelayMs: 6000, actions: [
          { type: 'cast', castMs: 2000, label: 'Rallying Cry', actions: [
            { type: 'spawn-adds', monsterTypeId: 'plains-slime', count: 2, offsetRange: 240 },
            { type: 'roar', attackSpeedPct: 0.25, durationMs: 6000, radius: 300 },
          ] },
        ] },
      ],
    },
  }],

  // FOREST — fast, frequent, frail; phase pushes frequency higher (cd down).
  ['apex-timberclaw', {
    id: 'apex-timberclaw', name: 'Apex Timberclaw', color: 0x226622,
    isBoss: true,
    stats: { hp: 3750, attack: 64, plating: 0, damageReduction: 0, speed: 60, attackRange: 18, attackCooldown: 1500, pullRange: 310 },
    behavior: 'melee', attackStyle: 'bear-claws', biome: 'forest',
    rewards: { essence: 155, essenceType: 'green', level: 5, biomeXp: 232 },
    ai: { wanderRadius: 130, leashRange: 830, idleMinMs: 1200, idleMaxMs: 4000 },
    targeting: { prefersPlayers: true },
    consecutiveHits: 2,
    chargedAttack: {
      name: 'Stunning Swipe', castMs: 700, cooldownMs: 8000, initialCooldownMs: 3500,
      multiplier: 1.25, stunMs: 900,
      // Its own cue, not the generic shockwave every other AoE charge draws: the
      // ordinary claw rhythm stays `bear-claws` (the T1 Greatbear's look, which is
      // the lineage's identity) and the swipe is the thing that reads as different.
      aoe: { radius: 90, impactFx: 'timberclaw-swipe' },
      // The tell tightens with the frenzy. At 0 stacks it is the authored 700ms
      // read; each Bestial Frenzy stack cuts it ~12%, floored at 300ms, so the
      // fight's acceleration shows up in the telegraph and not only in the cadence.
      hastenedBy: { bossEffect: 'bestial-frenzy', castMsMultPerStack: 0.88, minCastMs: 300 },
    },
    // FOREST EXAM = an accelerating claw duel — LOCKED by the encounter rework: the
    // Forest lineage retires after T2, and its cadence identity was already right.
    // T2 adds a quick, compact charged swipe that stuns anyone caught in the tell.
    // The 50% phase is a FREQUENCY surge, which is this boss's whole idea, so it
    // survives the generic-enrage cull that emptied the other lineages' phases.
    //
    // BESTIAL FRENZY OUTRANKS THE SWIPE. Both are casts, and the two must never be
    // on screen together: a scripted cast preempts an in-progress charged wind-up
    // (bossScripts.beginScriptedCast), and `cannotAttack` keeps the swipe from
    // opening while the frenzy is casting. So the fight always reads as one bar at
    // a time — the boss stops to roar, THEN goes back to hunting you. The swipe's
    // cooldown survives the preemption, so it comes straight back afterwards.
    bossScript: {
      phases: [
        { hpPct: 0.5, actions: [
          { type: 'enrage', atkMult: 1.15, cdMult: 0.70 }, // frequency surge
        ] },
      ],
      repeating: [
        { intervalMs: 5000, initialDelayMs: 5000, actions: [
          { type: 'cast', castMs: 1500, label: 'Bestial Frenzy', fx: 'frenzy', actions: [
            { type: 'stat-buff', stat: 'attackSpeed', mult: 1.20, moveSpeedMult: 1.10, label: 'bestial-frenzy' },
          ] },
        ] },
      ],
    },
  }],

  // MOUNTAIN — TELEGRAPHED CATASTROPHIC IMPACT + DEFENDED POSITION. T2's one added
  // layer is that the slam now comes from behind a guarded line: archers plink while
  // the juggernaut periodically digs in, so you have to break the position to reach
  // the thing that is actually killing you.
  ['stoneplate-juggernaut', {
    id: 'stoneplate-juggernaut', name: 'Stoneplate Juggernaut', color: 0x667788,
    isBoss: true,
    stats: { hp: 5000, attack: 128, plating: 10, damageReduction: 0.05, speed: 20, attackRange: 72, attackCooldown: 4200, pullRange: 320 },
    behavior: 'melee', attackStyle: 'quake', biome: 'mountain',
    rewards: { essence: 160, essenceType: 'blue', level: 5, biomeXp: 240 },
    ai: { wanderRadius: 120, leashRange: 850, idleMinMs: 3000, idleMaxMs: 7500 },
    targeting: { prefersPlayers: true },
    // T2 = T1's lane PLUS a barrier you can answer. The Juggernaut armours up, then
    // prepares its charge from behind that plate; break the plate during the
    // preparation and the whole sequence collapses into an early stagger. Otherwise
    // dodge or tank the charge and punish the recovery.
    //
    // Deliberately a CHASE/CONTACT test, not a burst check: the barrier is sized so
    // sustained damage answers it, because gating a boss behind one mandatory
    // one-shot build is exactly what the redesign removes.
    //
    // REMOVED with the 2026-09-04 redesign: `chargeOnAggro` (a speed burst is not a
    // charge), the circular Stunning Earthshatter and its pre-cast stun (stunning
    // the player immediately before an unavoidable circle is not an answerable
    // beat), Stoneplate Lock, and the repeating flat-DR shield — a timed damage
    // reduction taught nothing and was not the same thing as an absorb barrier.
    bossPattern: {
      id: 'stoneplate-charge', name: 'Stoneplate Charge',
      damageMultiplier: 2.0, cooldownMs: 11000, initialCooldownMs: 5000,
      steps: [
        // Plate up. Not guardable: the player answers this by HITTING it, not by
        // spending a Guard charge on a beat that deals no damage.
        { kind: 'cast', name: 'Stoneplate', castMs: 900, fx: 'shield', guardable: false },
        { kind: 'barrier', sourceId: 'stoneplate', shieldPct: 0.06,
          onBreak: { staggerMs: 3200, label: 'Plate Shattered' } },
        { kind: 'cast', name: 'Stoneplate Charge', castMs: 2300, fx: 'strong-kick',
          lane: { length: 700, halfWidth: 90, lockAtCastPct: 0.55 } },
        // 700px at 500px/s ≈ 1.4s of travel.
        { kind: 'charge', speed: 500, maxTravelMs: 2100 },
        { kind: 'drop-barrier', sourceId: 'stoneplate' },
        { kind: 'recovery', label: 'Overextended', durationMs: 2600 },
      ],
    },
    // MOUNTAIN EXAM = "break the guarded position". At 50% the charge comes around
    // sooner and hits harder. No adds, no generic enrage: the lineage escalates the
    // ONE readable sequence it owns.
    bossScript: {
      phases: [
        { hpPct: 0.5, actions: [
          { type: 'empower-charged', multiplierMult: 1.15, cooldownMult: 0.80 },
        ] },
      ],
    },
  }],

  // SWAMP — ROT / ATTRITION. T2's added layer is CORROSION: the pool no longer just
  // hurts, it makes everything else hurt more while you stand in it.
  ['mire-gorged-behemoth', {
    id: 'mire-gorged-behemoth', name: 'Mire-Gorged Behemoth', color: 0x2a4011,
    isBoss: true,
    stats: { hp: 3375, attack: 38, plating: 6, damageReduction: 0.08, speed: 30, attackRange: 15, attackCooldown: 2800, pullRange: 300 },
    behavior: 'melee', attackStyle: 'poison', biome: 'swamp',
    rewards: { essence: 155, essenceType: 'purple', level: 5, biomeXp: 232 },
    ai: { wanderRadius: 110, leashRange: 800, idleMinMs: 2500, idleMaxMs: 6000 },
    targeting: { prefersPlayers: true },
    dotEffect: { debuffId: 'mire-gorged-venom', label: 'Gorged Venom', damagePerStack: 9, maxStacks: 4, tickIntervalMs: 1000, durationMs: 8000 },
    chargedAttack: {
      name: 'Corrosive Pool', castMs: 1100, cooldownMs: 8500, initialCooldownMs: 3500,
      multiplier: 1.1, fx: 'strong-kick', aoe: { radius: 115 },
      // Effectively permanent (10 min) — retired with the boss, like T1's Bile Pool.
      pool: {
        durationMs: 600000, damagePerTick: 5, tickIntervalMs: 1000, slowSpeedMult: 0.60,
        vulnerability: { damageTakenPct: 0.12, durationMs: 1500 },
      },
    },
    // SWAMP EXAM = "survive the rot". Its charged pool leaves Corrosion, increasing
    // damage taken while the player remains in the hazard. At 50% the rot escalates
    // on BOTH channels it owns: venom stacks faster (cadence, not hit size) and the
    // pools arrive sooner and wider. No adds — Swamp's pressure is the ground.
    bossScript: {
      phases: [
        { hpPct: 0.5, actions: [
          { type: 'enrage', atkMult: 1.0, cdMult: 0.70 }, // pure cadence: DoT stacks faster
          { type: 'empower-charged', cooldownMult: 0.70, radiusMult: 1.15 },
        ] },
      ],
    },
  }],

  // CAVE — ENDURANCE / DEFENSIVE EROSION. T2's added layer is ARMOURED SUPPORT: a
  // second brute to outlast, while the corrosion keeps eating your plating.
  ['chitinous-dreadbore', {
    id: 'chitinous-dreadbore', name: 'Chitinous Dreadbore', color: 0x442244,
    isBoss: true,
    stats: { hp: 4375, attack: 139, plating: 12, damageReduction: 0.12, speed: 20, attackRange: 72, attackCooldown: 3600, pullRange: 280 },
    behavior: 'melee', attackStyle: 'quake', biome: 'cave',
    rewards: { essence: 160, essenceType: 'red', level: 5, biomeXp: 240 },
    ai: { wanderRadius: 90, leashRange: 800, idleMinMs: 3000, idleMaxMs: 7500 },
    targeting: { prefersPlayers: true },
    appliesPlatingShred: { platingPerStack: 2, maxStacks: 6 },
    // T2 = T1's erosion, now delivered from UNDERNEATH. The Dreadbore erodes you,
    // burrows out of reach, reserves a valid spot near you, shows the circle, and
    // erupts for a heavy hit plus a dose of shred.
    //
    // BURROW MEANS UNTARGETABLE, not flat damage reduction. The old version simply
    // gave the boss DR for a few seconds, which taught the player nothing and could
    // be ignored by continuing to swing; being genuinely unable to reach it is what
    // makes the emergence circle worth reading. Step Back avoids it, Guard absorbs
    // it, and tanking stays legal.
    //
    // REMOVED with the 2026-09-04 redesign: the circular Chitin Slam, `chargeOnAggro`,
    // Carapace Seal, and the DR-only burrow.
    bossPattern: {
      id: 'dreadbore-emergence', name: 'Dreadbore',
      damageMultiplier: 1.6, cooldownMs: 9000, initialCooldownMs: 4000,
      steps: [
        { kind: 'cast', name: 'Burrow', castMs: 900, fx: 'shield', guardable: false },
        // A SHORT, FAST BURROW (2026-09-06). It used to spend 1600ms underground,
        // which is most of two seconds in which the only thing happening is a mound
        // walking towards you. Cut to 500ms: the boss goes under and is on top of
        // you almost immediately, and the beat the player actually reads is the
        // eruption telegraph that follows, not the approach.
        //
        // travelSpeed had to rise with it or the change would quietly REMOVE the
        // burrow's whole job. This is the Dreadbore's only closer — it walks at 20
        // against a player who kites at 120 — and closing power is the travel
        // BUDGET, not the speed: 1600ms at 500 netted ~608px against a full sprint,
        // and 500ms at 1300 nets ~590. Same reach, a third of the time. Under ~250
        // it would surface wherever it already stood and telegraph at empty floor.
        //
        // emergeGap 0: it comes up UNDERNEATH the target rather than beside it.
        // The old 90 against a 140 radius left a 50px overlap, so a stationary
        // player was caught but a drifting one fell out of the circle for free.
        // ⚠ Centred + a 165 radius means running is NO LONGER the answer on its own:
        // clearing 165px at 120px/s takes ~1.4s against a 1000ms telegraph. Step
        // Back, Guard and armour are the answers; tanking it stays legal.
        { kind: 'conceal', name: 'Burrowed', marker: 'burrow', durationMs: 500,
          relocate: 'near-target', emergeGap: 0, travelSpeed: 1300 },
        { kind: 'impact', name: 'Eruption', anchor: 'self', radius: 165,
          damageMult: 1.0, telegraphMs: 1000, fx: 'strong-kick' },
        { kind: 'recovery', label: 'Surfaced', durationMs: 2200 },
      ],
    },
    // CAVE EXAM = "your shell erodes". At 50% the corrosion bites deeper (+1 plating
    // per stack), then the Dreadbore seals its own carapace for a short, readable
    // defensive window. The old troll add, enrage, and speed buff were generic and
    // said nothing about this lineage.
    bossScript: {
      phases: [
        { hpPct: 0.5, actions: [
          { type: 'empower-shred', platingPerStackAdd: 1 },

        ] },
      ],
    },
  }],

  // DESERT (debut T2) — SETUP / CONTROL -> PUNISHMENT. The lineage anchor. The
  // Emperor opens with a lethal alpha strike (openingStrike → last-stand answers),
  // then runs the Sun Mark cycle ITSELF: its hits paint the mark (appliesMark) and
  // the next blow cashes it (markedStrike), so the duel alternates paint/cash and the
  // player's answer is Cleanse, defensive automation, or a response window used well.
  //
  // ENCOUNTER REWORK: the Dust Djinn adds at 50% are GONE. Desert compresses the
  // biome's controller/dealer pairing into ONE duellist, and outsourcing the pressure
  // to adds made it a weaker Plains fight. Instead it gains SCOURING SANDBURST — a
  // telegraphed AoE that is the visible cash-out of the setup (and, incidentally, the
  // periodic beat that keeps a summon wall from standing in the way for free).
  //
  // Biome Ecology Pass 2 (Session 4) moved the painting onto the boss. Sun Mark was
  // stripped from all desert trash (locked decision 3), and the phase-2 adds used to
  // be the only painters — which meant markedStrike could never fire before 50% HP.
  ['dune-stalker-emperor', {
    id: 'dune-stalker-emperor', name: 'Dune-Stalker Emperor', color: 0xddcc44,
    isBoss: true,
    stats: { hp: 3750, attack: 85, plating: 12, damageReduction: 0.08, speed: 42, attackRange: 40, attackCooldown: 2600, pullRange: 340 },
    behavior: 'melee', attackStyle: 'sandblast', biome: 'desert',
    rewards: { essence: 150, essenceType: 'yellow', level: 5, biomeXp: 225 },
    ai: { wanderRadius: 140, leashRange: 880, idleMinMs: 2000, idleMaxMs: 5500 },
    targeting: { prefersPlayers: true },
    // DESERT = MARK AND EXECUTION, as ONE visible sequence.
    //
    //   Death Sting paints the mark  ->  a real window to answer it  ->  Execution.
    //
    // The mark decides HOW HARD the Execution lands, never WHETHER it lands.
    // Cleansing it strips the amplification and the Execution still arrives at its
    // unmarked value, to be answered with position, Guard or armour. That is the
    // deliberate middle path between the two failure shapes: a cleanse that cancels
    // the attack (so the sequence never resolves and the encounter has no teeth) and
    // a cleanse that does nothing (so reading the setup is pointless).
    //
    // REMOVED with the 2026-09-04 redesign: the basic per-hit slow, the
    // `appliesMark`/`markedStrike` alternation on ordinary swings (an INVISIBLE
    // second mark source competing with the visible one), `openingStrike`, and the
    // generic Scouring Sandburst circle.
    bossPattern: {
      id: 'dune-execution', name: 'Death Sting',
      damageMultiplier: 1.5, cooldownMs: 9000, initialCooldownMs: 4500,
      steps: [
        { kind: 'apply-status', name: 'Death Sting', castMs: 1100, fx: 'strong-kick',
          effectId: SUN_MARK_EFFECT_ID, stacks: 1, durationMs: 6000 },
        // The answer window. Long enough to actually reach a Cleanse, short enough
        // that ignoring the tell is a choice rather than an accident.
        { kind: 'wait', durationMs: 1400 },
        { kind: 'payoff', name: 'Execution', castMs: 1300, fx: 'strong-kick',
          damageMult: 1.0, amplifiedMult: 2.0,
          consumes: { effectId: SUN_MARK_EFFECT_ID }, radius: 150 },
        { kind: 'recovery', label: 'Spent', durationMs: 1800 },
      ],
    },
    bossScript: {
      phases: [
        { hpPct: 0.5, actions: [
          // The setup tightens: it closes faster and the cash-out comes around sooner.
          { type: 'stat-buff', stat: 'speed', mult: 1.3 },
          { type: 'empower-charged', multiplierMult: 1.15, cooldownMult: 0.75 },
        ] },
      ],
    },
  }],

  // JUNGLE (debut T2) — AMBUSH. The start of the predator lineage, and deliberately
  // its simplest statement: an opening pounce (openingStrike → damage-cap answers),
  // and ONE mid-fight wave where the pack leaps from the thickets. Evasion, the hunt
  // state, and the frenzy finale all arrive later; T2 teaches "it jumps you, then
  // hunts you". The old add wave is replaced by one casted predator burst.
  //
  // ENCOUNTER REWORK: the 50% enrage was dropped. This boss is already fast; a
  // frequency storm on top of the ambush made it read as a Forest fight.
  ['jungle-dread-gorger', {
    id: 'jungle-dread-gorger', name: 'Jungle Dread-Gorger', color: 0x117722,
    isBoss: true,
    stats: { hp: 3625, attack: 85, plating: 0, damageReduction: 0.03, speed: 56, attackRange: 18, attackCooldown: 2400, pullRange: 320 },
    behavior: 'melee', attackStyle: 'slash', biome: 'jungle',
    rewards: { essence: 145, essenceType: 'green', level: 5, biomeXp: 218 },
    ai: { wanderRadius: 150, leashRange: 840, idleMinMs: 1800, idleMaxMs: 4500 },
    targeting: { prefersPlayers: true },
    // JUNGLE = PURSUIT AND FAILED ESCAPE. The one loop the whole lineage runs:
    //
    //   FLEE: the boss bolts for the far edge of its leash behind a plate.
    //     BREAK the plate  -> the retreat fails, it stumbles, and it banks one
    //                         capped stack of Escape Instinct so the NEXT attempt
    //                         is quicker.
    //     STUN IT          -> the attempt simply stops. No stumble and no Instinct
    //                         — a plainer answer than the plate, and it has to be
    //                         one, or a boss that "escapes" while hard-controlled
    //                         cashes in on the far side of the control you spent.
    //     LET IT FINISH    -> it slips into cover, resets Instinct, STALKS BACK
    //                         unseen, and bites the moment it reaches you.
    //
    // THE 2026-09-06 CORRECTION. Every beat above was already written down and none
    // of it was what the fight did. The guard was a stationary cast (the boss never
    // bolted anywhere), the vanish TELEPORTED it to the leash edge the instant it
    // succeeded, and the Ambush then fired from across the arena at a player it had
    // never come near — a bite landing at 800px, out of nowhere, unanswerable and
    // unreadable. The sequence now runs the shape the design always described: it
    // runs (visible, breakable), it disappears, it comes back for you, and the bite
    // is what happens when it arrives.
    //
    // BARRIER DAMAGE — not physical contact — is the test. That is deliberate and
    // load-bearing: a boss whose whole idea is running away from you would otherwise
    // be answerable only by melee, and ranged builds would have no counterplay at
    // all. Instinct is capped, so repeated failures speed it up to a ceiling and no
    // further; a successful escape wipes it, because it records failure, not progress.
    //
    // T2 teaches the PLAIN cycle: no venom, no frenzy, just escape and ambush.
    //
    // REMOVED with the 2026-09-04 redesign: `openingStrike` (an unanswerable alpha
    // strike before the fight has taught anything) and the one-shot Canopy Hunt
    // speed phase, which was a substitute for the pursuit this loop now IS.
    //
    // Canopy Hunt was only removed from the COMMENT in 2026-09-04; the phase itself
    // survived in the data until 2026-09-06. It is gone now, and with it the whole
    // `bossScript` — T2 has no 50% escalation at all, which is the point: this tier
    // teaches the plain cycle, and the escalation belongs to T3 (the escape comes
    // around harder and far more often) and T4 (it stops escaping altogether).
    bossPattern: {
      id: 'gorger-escape', name: 'Escape',
      damageMultiplier: 1.6, cooldownMs: 14000, initialCooldownMs: 8000,
      steps: [
        // THE ESCAPE IS TIMED, AND THE TIME IS THE POINT. 3000ms of the boss visibly
        // running with a breakable plate up — long enough to read as a chase you
        // are losing, and long enough for the break to be a real decision rather
        // than a reflex. (First pass tried 1500ms at 420px/s: the boss crossed
        // ~630px in a second and a half, which at the 5 Hz broadcast is ~84px a
        // packet, and the whole beat read as "cast, blink, gone".)
        //
        // ⚠ NOT distance-from-the-player, which was the tempting alternative: that
        // condition is already satisfied the moment a ranged or kiting player opens
        // up, so the escape would complete instantly exactly when the player is
        // furthest from being able to answer it — the same "it triggers immediately"
        // failure in a new costume. It also has no natural end when the boss is
        // walled in or pinned against its own leash. Time is stable wherever
        // everyone happens to be standing; distance is what the flee ACHIEVES.
        //
        // 220px/s is the visible pace: clearly faster than the player's 120, slow
        // enough to watch. Over the window that is ~660px, which is what the stalk
        // below is sized to take back.
        { kind: 'escape-guard', name: 'Flee', castMs: 3000, fx: 'shield',
          sourceId: 'jungle-escape', shieldPct: 0.07,
          onBreak: { staggerMs: 2600, label: 'Cornered' },
          maxInstinctStacks: 3, instinctCastReductionPct: 0.15,
          flee: { speed: 220 } },
        // THE STALK, not a relocation. It goes invisible only once the escape has
        // actually succeeded, then closes on you while unseen — `near-target` with
        // real travel, exactly like the Cave burrow, so the marker is a tell the
        // player tracks rather than a body that blinks across the map.
        // 1600ms at 620 is ~992px of travel, ~800 of it net against a player
        // sprinting away: enough to take back the ~660px flee and then some.
        // emergeGap 40 lands it BESIDE you rather than inside your sprite: monsters
        // and players do not push each other apart, so 0 puts two bodies on the
        // same pixel. 40 is well inside a body width — this is still contact.
        { kind: 'conceal', name: 'Vanished', marker: 'stealth', durationMs: 1600,
          relocate: 'near-target', emergeGap: 40, travelSpeed: 620 },
        // Which makes the Ambush a CONTACT bite: it lands because the thing that
        // vanished is now standing on top of you, and the 800ms is the tell.
        { kind: 'payoff', name: 'Ambush', castMs: 800, fx: 'savage-maul',
          damageMult: 1.0 },
        // NO RECOVERY AFTER A SUCCESSFUL AMBUSH (2026-09-06). It used to end on a
        // 1600ms `Winded` window, which meant both branches of the loop finished
        // with the boss lying down — and since the recovery's networked id is
        // literally `boss-stunned`, the authored label never reached the player and
        // the two read as the same outcome. A predator that just landed its ambush
        // being stunned by it makes no sense, and it flattened the choice the whole
        // pattern exists to pose.
        //
        // The punish window is now what BREAKING THE PLATE buys you, and nothing
        // else: stop the escape and you get 2.6s of a helpless boss; let it go and
        // you eat the bite and it goes straight back to fighting.
      ],
    },
  }],
] satisfies [string, MonsterDefinition][];
