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
      multiplier: 1.25, fx: 'savage-maul', stunMs: 900, aoe: { radius: 90 },
    },
    // FOREST EXAM = an accelerating claw duel — LOCKED by the encounter rework: the
    // Forest lineage retires after T2, and its cadence identity was already right.
    // T2 adds a quick, compact charged swipe that stuns anyone caught in the tell.
    // The 50% phase is a FREQUENCY surge, which is this boss's whole idea, so it
    // survives the generic-enrage cull that emptied the other lineages' phases.
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
        { kind: 'conceal', name: 'Burrowed', marker: 'burrow', durationMs: 1600,
          relocate: 'near-target', emergeGap: 150 },
        { kind: 'impact', name: 'Eruption', anchor: 'self', radius: 140,
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
    // T2 teaches the PLAIN cycle: no venom, no frenzy, just escape and ambush.
    //
    // REMOVED with the 2026-09-04 redesign: `openingStrike` (an unanswerable alpha
    // strike before the fight has taught anything) and the one-shot Canopy Hunt
    // speed phase, which was a substitute for the pursuit this loop now IS.
    bossPattern: {
      id: 'gorger-escape', name: 'Escape',
      damageMultiplier: 1.6, cooldownMs: 14000, initialCooldownMs: 8000,
      steps: [
        { kind: 'escape-guard', name: 'Escape Guard', castMs: 2600, fx: 'shield',
          sourceId: 'jungle-escape', shieldPct: 0.07,
          onBreak: { staggerMs: 2600, label: 'Cornered' },
          maxInstinctStacks: 3, instinctCastReductionPct: 0.15 },
        { kind: 'conceal', name: 'Vanished', marker: 'stealth', durationMs: 1400,
          relocate: 'leash-edge' },
        { kind: 'payoff', name: 'Ambush', castMs: 800, fx: 'savage-maul',
          damageMult: 1.0 },
        { kind: 'recovery', label: 'Winded', durationMs: 1600 },
      ],
    },
    bossScript: {
      phases: [
        { hpPct: 0.5, actions: [
          { type: 'cast', castMs: 1400, label: 'Canopy Hunt', fx: 'frenzy', actions: [
            { type: 'stat-buff', stat: 'speed', mult: 1.25, durationMs: 7000, label: 'canopy-hunt-pursuit' },
            { type: 'stat-buff', stat: 'attackSpeed', mult: 1.25, durationMs: 7000, label: 'canopy-hunt-haste' },
          ] },
        ] },
      ],
    },
  }],
] satisfies [string, MonsterDefinition][];
