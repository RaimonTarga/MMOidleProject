import { SUN_MARK_EFFECT_ID } from '../../systems/monsterDebuffs';
import { ERODED_EFFECT_ID } from '../../systems/bossDebuffs';
import type { PatternPool } from './bossPatterns';

/**
 * Cave T2 sinkhole: collapsed ground an eruption leaves behind. No damage; a slow,
 * and a stacking Eroded (+4% damage taken per second inside, up to 6).
 */
const SINKHOLE_T2: PatternPool = {
  durationMs: 30_000, damagePerTick: 0, tickIntervalMs: 1000, slowSpeedMult: 0.65,
  flavor: 'sinkhole', label: 'Sinkhole',
  erodes: { effectId: ERODED_EFFECT_ID, damageTakenPctPerStack: 0.04, maxStacks: 6, durationMs: 5000, intervalMs: 1000 },
};
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
    behavior: 'melee', attackStyle: 'gore', biome: 'plains',
    rewards: { essence: 150, essenceType: 'yellow', level: 5, biomeXp: 225 },
    ai: { wanderRadius: 140, leashRange: 850, idleMinMs: 2000, idleMaxMs: 5500 },
    targeting: { prefersPlayers: true },
    // PLAINS EXAM = "survive the swarm", T2 twist (boss-lineage redesign 2026-09-27):
    // THE RALLY EMPOWERS THE HERD. T1 asks "can you clear the trickle?"; T2 asks
    // "can you clear it before the roar makes it dangerous?".
    //
    //   Call the Herd  — a T2 yearling trickle (was the T1 Field Hare: a tier-1 mob
    //                    in a tier-2 fight, never retunable without moving T1).
    //   Rallying Roar  — a telegraphed cast on its own ~15s clock: every living add
    //                    gains a lasting stack of Rallied (+attack speed, +damage)
    //                    until it dies. Answer: AoE Techniques and add priority.
    //   50% STAMPEDE   — one announced rally: a Stampede Bull joins, and two Savanna
    //                    Hawks are called in AT RANGE so their Dive Bomb (a 2s root)
    //                    actually happens — the anti-kite lesson the zone teaches.
    //
    // CUT: the 25% boar-pair rally (one clear rhythm instead of three overlapping
    // beats) and the boss-hastening roars. Adds despawn on boss death.
    // Numbers placeholder — user balance pass after playtest.
    bossScript: {
      phases: [
        { hpPct: 0.5, name: 'Stampede', actions: [
          { type: 'cast', castMs: 2000, label: 'Stampede', actions: [
            { type: 'spawn-adds', monsterTypeId: 'stampede-bull', count: 1, offsetRange: 220 },
            { type: 'spawn-adds', monsterTypeId: 'savanna-hawk', count: 2, at: 'target-ring', ringDistance: 400 },
            { type: 'spawn-adds', monsterTypeId: 'prairie-yearling', count: 2, maxAlive: 8, offsetRange: 220 },
          ] },
        ] },
      ],
      repeating: [
        { intervalMs: 10000, initialDelayMs: 5000, actions: [
          { type: 'cast', castMs: 1500, label: 'Call the Herd', actions: [
            { type: 'spawn-adds', monsterTypeId: 'prairie-yearling', count: 2, maxAlive: 5, offsetRange: 240 },
          ] },
        ] },
        { intervalMs: 15000, initialDelayMs: 12000, actions: [
          { type: 'cast', castMs: 2000, label: 'Rallying Roar', fx: 'roar', actions: [
            { type: 'empower-adds', attackSpeedPct: 0.20, damagePct: 0.20, maxStacks: 3 },
          ] },
        ] },
      ],
    },
  }],

  // FOREST — fast, frequent, frail; phase pushes frequency higher (cd down).
  ['apex-timberclaw', {
    id: 'apex-timberclaw', name: 'Apex Timberclaw', color: 0x226622,
    isBoss: true,
    // ATTACK 64 -> 44 (2026-09-06 playtest nerf). At 64 with `consecutiveHits: 2` on
    // a 1500ms swing this boss opened at 85 raw dps BEFORE its ramp had done
    // anything: 2.0x the tier's next-hardest (Plains 44) and 2.2x-6.3x the rest
    // (Cave 39, Jungle 35, Desert 33, Mountain 31, Swamp 14). "Fastest cadence and
    // highest sustained damage of the tier" is the Forest identity and it should
    // still be the highest — being double the runner-up before the ramp starts is
    // a different boss, not a faster one. 44 opens at 59 dps, 1.35x Plains.
    stats: { hp: 3750, attack: 44, plating: 0, damageReduction: 0, speed: 60, attackRange: 18, attackCooldown: 1500, pullRange: 310 },
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
      // BESTIAL FRENZY IS THE FIGHT'S CLOCK, and it is meant to be: no stack cap, so
      // the ramp compounds until the boss is simply unsurvivable. Kill it before
      // then. What is tuned here is HOW LONG that takes.
      //
      // 1.20 -> 1.12 per stack (2026-09-06 playtest nerf). Each stack divides the
      // CURRENT cooldown, so this is exponential and every value ends at the
      // engine's 200ms swing floor eventually — the multiplier only decides when.
      // At 1.20 the floor arrived ~65s in and dps was already 4x base by 50s. At
      // 1.12 it arrives ~95s in, which puts this fight's wall just past T1's (the
      // Greatbear's 1.20 on a 1900ms base and a 6s interval reaches its floor at
      // ~83s) — right, because this is the bigger boss and the longer fight.
      //
      // ⚠ `moveSpeedMult` DOES NOTHING and never has: `applyAction` writes
      // `hasPosition.speed`, and the monster AI reassigns `ai.baseSpeed` over it on
      // essentially every state transition. Left authored so the intent is not lost;
      // it needs a fix in ai.ts, not here.
      // Interval 5000 -> 6500 (2026-09-06, +30%): the second half of the same nerf.
      // The multiplier decides how steep each step is; the interval decides how
      // often you take one, and the two multiply into the wall-clock. The opening
      // delay is left at 5000 so the first Frenzy still arrives on the same beat —
      // it is the RAMP that should be slower, not the introduction to it.
      repeating: [
        { intervalMs: 6500, initialDelayMs: 5000, actions: [
          { type: 'cast', castMs: 1500, label: 'Bestial Frenzy', fx: 'frenzy', actions: [
            { type: 'stat-buff', stat: 'attackSpeed', mult: 1.12, moveSpeedMult: 1.10, label: 'bestial-frenzy' },
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
      chargeInstinct: { speedPct: 0.35, castReductionPct: 0.30, minCastMs: 400 },
      id: 'stoneplate-charge', name: 'Stoneplate Charge',
      damageMultiplier: 2.0, cooldownMs: 11000, initialCooldownMs: 5000,
      // Control before it plates (boss-lineage redesign): a stun or root on the
      // Stoneplate cast stops the sequence. Once plated it ignores control.
      stoppedBy: {
        stun: { staggerMs: 2500, label: 'Staggered' },
        root: { staggerMs: 1500, label: 'Stumbled' },
      },
      steps: [
        // Plate up. Not guardable: the player answers this by HITTING it, not by
        // spending a Guard charge on a beat that deals no damage.
        { kind: 'cast', name: 'Stoneplate', castMs: 900, fx: 'shield', guardable: false, rootable: true },
        // While plated it ignores stun and root (`blocksControl`): break the plate
        // first. Breaking it is the T2 stop answer and staggers the boss.
        { kind: 'barrier', sourceId: 'stoneplate', shieldPct: 0.06, blocksControl: true,
          onBreak: { staggerMs: 3200, label: 'Plate Shattered' } },
        { kind: 'cast', name: 'Stoneplate Charge', castMs: 2300, fx: 'charge-lane',
          lane: { length: 700, halfWidth: 90, lockAtCastPct: 0.55 } },
        // 700px at 500px/s ≈ 1.4s of travel.
        { kind: 'charge', speed: 500, maxTravelMs: 2100 },
        { kind: 'drop-barrier', sourceId: 'stoneplate' },
        { kind: 'recovery', label: 'Overextended', durationMs: 1000 },
      ],
    },
    // MOUNTAIN EXAM = "break the guarded position". At 50% the charge comes around
    // sooner and hits harder. No adds, no generic enrage: the lineage escalates the
    // ONE readable sequence it owns.
    bossScript: {
      phases: [
        { hpPct: 0.5, name: 'Unyielding', actions: [
          { type: 'empower-charged', multiplierMult: 1.15, cooldownMult: 0.80 },
        ] },
      ],
    },
  }],

  // SWAMP — ROT ARENA. T2's added layer: a second pool kind (Mire) and a lash that
  // drags you toward the pools.
  ['mire-gorged-behemoth', {
    id: 'mire-gorged-behemoth', name: 'Mire-Gorged Behemoth', color: 0x2a4011,
    isBoss: true,
    stats: { hp: 3375, attack: 38, plating: 6, damageReduction: 0.08, speed: 30, attackRange: 15, attackCooldown: 2800, pullRange: 300 },
    behavior: 'melee', attackStyle: 'poison', biome: 'swamp',
    rewards: { essence: 155, essenceType: 'purple', level: 5, biomeXp: 232 },
    ai: { wanderRadius: 110, leashRange: 800, idleMinMs: 2500, idleMaxMs: 6000 },
    targeting: { prefersPlayers: true },
    // Venom coefficient ADOPTED at 6 on 2026-09-19, from the Boss4 swamp-pressure
    // screen (9 -> 6, one field, every other venom field held fixed). It is the
    // boss-side pressure value, not a rebalance of the encounter: cap, cadence,
    // duration, the ordinary attack, the Corrosive Pool and the 50% phase are all
    // unchanged, and `server/test/behemothVenom.test.ts` pins that.
    dotEffect: { debuffId: 'mire-gorged-venom', label: 'Gorged Venom', damagePerStack: 6, maxStacks: 4, tickIntervalMs: 1000, durationMs: 8000 },
    // SWAMP T2 (boss-lineage redesign 2026-09-27): POOL VARIETY AND THE PULL.
    // Swamp stops demanding Cleanse — its answers are Swamp gear: DoT resistance
    // (armor) for the Bile, slow resistance (boots) for the Mire. Corrosion's
    // vulnerability rider is gone.
    //
    //   Bile Pool  — the damage pool (the T1 lesson), now FADING after 35s instead
    //                of lasting the fight, so a long fight cannot wall the arena off.
    //   Mire Spit  — a lobbed second pool type: no damage, a heavy slow.
    //   Mire Lash  — a telegraphed tongue grab that DRAGS you toward the nearest
    //                pool it owns. Keep pools behind you, resist forced movement,
    //                step out after.
    chargedAttack: {
      name: 'Bile Pool', castMs: 1100, cooldownMs: 8500, initialCooldownMs: 3500,
      multiplier: 1.1, fx: 'strong-kick', aoe: { radius: 115, impactFx: 'pool-spawn' },
      pool: { durationMs: 35000, damagePerTick: 5, tickIntervalMs: 1000, slowSpeedMult: 0.70 },
    },
    bossPattern: {
      id: 'mire-lash', name: 'Mire Lash',
      damageMultiplier: 1.0, cooldownMs: 11000, initialCooldownMs: 7000,
      steps: [
        { kind: 'impact', name: 'Mire Spit', anchor: 'target', radius: 125,
          damageMult: 0.4, telegraphMs: 1000, fx: 'pool-spawn',
          pool: { durationMs: 35000, damagePerTick: 0, tickIntervalMs: 1000,
            slowSpeedMult: 0.40, flavor: 'mire', label: 'Mire' } },
        { kind: 'wait', durationMs: 500 },
        { kind: 'pull', name: 'Mire Lash', castMs: 1200, distance: 280,
          toward: 'nearest-pool', fx: 'trench-current' },
      ],
    },
    // At 50% the rot escalates on the channels it owns: venom stacks faster
    // (cadence, not hit size) and the pools arrive sooner and wider.
    bossScript: {
      phases: [
        { hpPct: 0.5, name: 'Rising Mire', actions: [
          { type: 'enrage', atkMult: 1.0, cdMult: 0.70 }, // pure cadence: DoT stacks faster
          { type: 'empower-charged', cooldownMult: 0.70, radiusMult: 1.15 },
        ] },
      ],
    },
  }],

  // CAVE — THE BURROWER. T2's added layer: sinkholes that make WHERE you dodge matter.
  ['chitinous-dreadbore', {
    id: 'chitinous-dreadbore', name: 'Chitinous Dreadbore', color: 0x442244,
    isBoss: true,
    stats: { hp: 4375, attack: 85, plating: 12, damageReduction: 0.12, speed: 20, attackRange: 72, attackCooldown: 3600, pullRange: 280 },
    behavior: 'melee', attackStyle: 'quake', biome: 'cave',
    rewards: { essence: 160, essenceType: 'red', level: 5, biomeXp: 240 },
    ai: { wanderRadius: 90, leashRange: 800, idleMinMs: 3000, idleMaxMs: 7500 },
    targeting: { prefersPlayers: true },
    // CAVE T2 (boss-lineage redesign 2026-09-27): SINKHOLES — where you dodge now
    // matters. The T1 burrow (a targetable mound you can drag up with damage), and
    // every eruption leaves collapsed ground for ~30s: standing in it slows you and
    // stacks ERODED (+damage taken per stack, fades once you step out). 50%: it dives
    // straight back down for a second eruption.
    //
    // CUT: plating shred (erosion is a damage-taken debuff now, not plating).
    bossPattern: {
      id: 'dreadbore-emergence', name: 'Dreadbore',
      damageMultiplier: 1.6, cooldownMs: 9000, initialCooldownMs: 4000,
      stoppedBy: { damage: { pctMaxHp: 0.05, staggerMs: 2500, label: 'Dragged Up' } },
      steps: [
        { kind: 'cast', name: 'Burrow', castMs: 550, fx: 'burrow', guardable: false },
        // OUT, THEN BACK, ON ONE LINE (2026-09-06, settled) — a straight feint is
        // the only burrow shape the 5 Hz client interpolation renders without
        // snapping (see the conceal step's `feint` docs in bossPatterns.ts).
        { kind: 'conceal', name: 'Burrowed', marker: 'burrow', durationMs: 3000,
          relocate: 'near-target', emergeGap: 0, travelSpeed: 380, targetable: true,
          feint: { retreatToPx: 460, untilPct: 0.35 }, surfacesOnContact: true,
          contactSlow: { speedMult: 0.5, durationMs: 2000 } },
        { kind: 'impact', name: 'Eruption', anchor: 'self', radius: 165,
          damageMult: 1.0, telegraphMs: 750, fx: 'deep-core-eruption', pool: SINKHOLE_T2 },
        { kind: 'recovery', label: 'Surfaced', durationMs: 1000 },
      ],
    },
    bossPatternVariants: [{
      id: 'dreadbore-second-dive', name: 'Second Dive',
      damageMultiplier: 1.6, cooldownMs: 9500, initialCooldownMs: 4000,
      stoppedBy: { damage: { pctMaxHp: 0.05, staggerMs: 2500, label: 'Dragged Up' } },
      steps: [
        { kind: 'cast', name: 'Burrow', castMs: 550, fx: 'burrow', guardable: false },
        { kind: 'conceal', name: 'Burrowed', marker: 'burrow', durationMs: 3000,
          relocate: 'near-target', emergeGap: 0, travelSpeed: 380, targetable: true,
          feint: { retreatToPx: 460, untilPct: 0.35 }, surfacesOnContact: true,
          contactSlow: { speedMult: 0.5, durationMs: 2000 } },
        { kind: 'impact', name: 'Eruption', anchor: 'self', radius: 165,
          damageMult: 1.0, telegraphMs: 750, fx: 'deep-core-eruption', pool: SINKHOLE_T2 },
        // Straight back down: no cast, no recovery between the two.
        { kind: 'conceal', name: 'Dive', marker: 'burrow', durationMs: 2400,
          relocate: 'near-target', emergeGap: 0, travelSpeed: 420, targetable: true,
          surfacesOnContact: true },
        { kind: 'impact', name: 'Eruption', anchor: 'self', radius: 165,
          damageMult: 1.0, telegraphMs: 750, fx: 'deep-core-eruption', pool: SINKHOLE_T2 },
        { kind: 'recovery', label: 'Surfaced', durationMs: 1000 },
      ],
    }],
    bossScript: {
      phases: [
        { hpPct: 0.5, name: 'Second Dive', actions: [
          { type: 'set-pattern', patternId: 'dreadbore-second-dive' },
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
    // DESERT = MARK, NUMB, EXECUTE, as ONE visible sequence.
    //
    //   Death Sting paints the mark -> a window -> Numbing Sting slows you -> a
    //   shorter window -> Execution.
    //
    // The slow in the middle is what turns two beats into a CHOICE (added
    // 2026-09-06). The mark controls how hard the Execution lands; the slow
    // controls whether you can leave its circle at all. One Cleanse, two things
    // worth cleansing, and the sequence is paced so you genuinely cannot do both.
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
        { kind: 'apply-status', name: 'Death Sting', castMs: 1100, fx: 'death-sting',
          effectId: SUN_MARK_EFFECT_ID, stacks: 1, durationMs: 6000 },
        // The answer window. Long enough to actually reach a Cleanse, short enough
        // that ignoring the tell is a choice rather than an accident.
        { kind: 'wait', durationMs: 800 },
        // NUMBING STING (2026-09-06) — the biome's own soft control, borrowed from
        // the Sand Scorpion that teaches it (`appliesSlow: 0.5 / 4000ms`, identical
        // magnitudes) and folded into the middle of the Emperor's sentence.
        //
        // This is what makes the sequence a DILEMMA instead of two independent
        // beats. The Execution is a 150px circle on a 1300ms tell: at full speed
        // that is ~1250ms of running, so it is escapable by a hair. At half speed
        // it is ~2500ms and there is no escape at all. So the mark is not the only
        // thing worth cleansing, and you cannot cleanse both — answer the mark and
        // you eat an unamplified hit you could have walked out of; answer the slow
        // and you walk out of an Execution that would have hit twice as hard.
        //
        // The slow outlasts the Execution on purpose (4000ms from ~2.6s in, against
        // a payoff at ~4.5s): its job is not only the circle, it is that the
        // punish window afterwards is one you have to limp out of.
        // speedMult 0.35, DEEPER than the Sand Scorpion's 0.5 that teaches it. The
        // scorpion's slow is chip pressure you fight through; the Emperor's exists
        // to make one specific circle inescapable, and at 0.5 a player who reacts
        // on the first frame of the tell is only ~1.2x short of clearing it. 0.35
        // puts it comfortably out of reach so the beat asks a question with one
        // answer rather than a near-miss. The scorpion is untouched.
        { kind: 'apply-status', name: 'Numbing Sting', castMs: 700, fx: 'numbing-sting',
          effectId: 'slow', stacks: 1, durationMs: 4000, data: { speedMult: 0.35 } },
        { kind: 'wait', durationMs: 600 },
        { kind: 'payoff', name: 'Execution', castMs: 1300, fx: 'execution',
          damageMult: 1.0, amplifiedMult: 2.0,
          consumes: { effectId: SUN_MARK_EFFECT_ID }, radius: 150 },
        { kind: 'recovery', label: 'Spent', durationMs: 1000 },
      ],
    },
    bossScript: {
      phases: [
        { hpPct: 0.5, name: 'Relentless', actions: [
          // The setup tightens: it closes faster and the cash-out comes around sooner.
          { type: 'stat-buff', stat: 'speed', mult: 1.3, label: 'relentless-pursuit' },
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
    //   T2: the plain cycle; 50% Bloodlust = a longer frenzy.
    bossPattern: {
      id: 'gorger-escape', name: 'Escape',
      damageMultiplier: 1.6, cooldownMs: 14000, initialCooldownMs: 8000,
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
          instinctSpeedPct: 0.30,
          flee: { speed: 330, escapeDistance: 400 } },
        { kind: 'conceal', name: 'Vanished', marker: 'stealth', durationMs: 6000,
          relocate: 'near-target', emergeGap: 30, travelSpeed: 220, surfacesOnContact: true },
        { kind: 'payoff', name: 'Ambush', castMs: 350, fx: 'savage-maul',
          damageMult: 1.0, reach: 90 },
        { kind: 'frenzy', name: 'Frenzy', durationMs: 5000, attackSpeedPct: 0.35, damagePct: 0.20 },
      ],
    },
    bossPatternVariants: [{
      id: 'gorger-escape-bloodlust', name: 'Escape',
      damageMultiplier: 1.6, cooldownMs: 14000, initialCooldownMs: 6000,
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
          instinctSpeedPct: 0.30,
          flee: { speed: 330, escapeDistance: 400 } },
        { kind: 'conceal', name: 'Vanished', marker: 'stealth', durationMs: 6000,
          relocate: 'near-target', emergeGap: 30, travelSpeed: 220, surfacesOnContact: true },
        { kind: 'payoff', name: 'Ambush', castMs: 350, fx: 'savage-maul',
          damageMult: 1.0, reach: 90 },
        { kind: 'frenzy', name: 'Frenzy', durationMs: 8000, attackSpeedPct: 0.35, damagePct: 0.20 },
      ],
    }],
    bossScript: {
      phases: [
        { hpPct: 0.5, name: 'Bloodlust', actions: [
          { type: 'set-pattern', patternId: 'gorger-escape-bloodlust' },
        ] },
      ],
    },
  }],
] satisfies [string, MonsterDefinition][];
