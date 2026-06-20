import type { MonsterDefinition } from './types';

// ════════════════════════════════════════════════════════════════════════
// T4 BOSS CONFIGURATIONS
// Seven active biomes: Mountain · Desert · Jungle · Tundra · Volcanic
//                       Graveyard · Trench (staged apex encounter)
//
// ── T4 BOSS PHILOSOPHY ──────────────────────────────────────────────────
// T4 bosses are the peak of the mortal world — the "exam" for every spec,
// item, and range choice the player has made. They escalate in two ways:
//   Offensive: cadenceFinisher integrated at base (every-N-attack spikes that
//              trip the damage cap and test cap armor / shield timing)
//   Defensive: phase triggers gain enemy defenses mid-fight (enemySoftCap,
//              enemyShield) that force the player to change approach, then
//              shed those defenses in a desperate final push.
//
// The arc per boss: survivable opener → defensive mid-phase → explosive finale.
//
// ── STAT SCALING (T3 base × 1.9–2.0) ────────────────────────────────────
// T3 bosses: HP 3800–4400 · attack 64–125 · DPS ranged by identity
// T4 bosses: HP 7800–10000 · attack 88–175 (role-adjusted)
// Cap threshold = 25% player maxHP ≈ 75–90. Boss normal attacks sit above
// or near the threshold; cadence finishers and slams are deep into cap range.
//
// ── NEW BOSS SCRIPT ACTION TYPES (implement alongside this file) ─────────
//
//   apply-shield   { type, shieldPct, intervalMs, durationMs }
//     Boss gains an enemyShield on phase trigger. Same mechanic as the
//     monster-level enemyShield — rewards burst to pop it, punishes DoT/chip.
//
//   apply-soft-cap { type, capPct, capMult }
//     Boss gains enemySoftCap on phase trigger. Clips the player's big hits.
//     Rewards fast consistent damage and pierce tools.
//
//   shed-defense   { type }
//     Removes any active enemyShield and enemySoftCap; reduces current plating
//     to ~20% of its value. The desperation finale — trades tankiness for raw
//     aggression. Also triggers a free slam for the transition impact.
//
//   modify-ramp-debuff { type, moveSlowMaxPct, atkSlowMaxPct }
//     Raises the caps on the active rampDebuff. Used at 25% for Tundra:
//     the slow becomes near-total if the fight drags on — terrifying without
//     the right debuff-resist build.
//
//   spawn-adds     { type, monsterTypeId, count, offsetRange? }
//     Spawns a burst of trash adds. Used for Graveyard boss. Adds leash to
//     the boss and are removed on boss death.
//
//   stat-buff extends to support: speed · attack · evasion (existing T3 stats).
//
// Existing reused actions: enrage · stat-buff · slam · morph
// ════════════════════════════════════════════════════════════════════════

export const bossMonsterEntriesT4 = [

  // ════════════════════════════════════════════════════════════════════
  // MOUNTAIN — "Iron-Crest Titan"
  //
  // Identity: the ultimate cap-tripper. Every normal hit sits above the cap
  // threshold (175 > 75–90). The CADENCE FINISHER every 4 attacks = 350 —
  // deep in cap territory. At 50% it gains ENEMY SOFT-CAP (now its armor also
  // clips YOUR big hits — the weapon-matchup exam goes both ways). At 25% it
  // sheds all defenses and goes pure offense.
  // ════════════════════════════════════════════════════════════════════
  ['iron-crest-titan', {
    id: 'iron-crest-titan', name: 'Iron-Crest Titan', color: 0x8899bb,
    isBoss: true,
    stats: { hp: 8500, attack: 175, plating: 14, damageReduction: 0.06, speed: 16, attackRange: 20, attackCooldown: 4200, pullRange: 420 },
    behavior: 'melee', attackStyle: 'impact', biome: 'mountain',
    rewards: { essence: 620, essenceType: 'blue', level: 5, biomeXp: 930 },
    ai: { wanderRadius: 95, leashRange: 960, idleMinMs: 4000, idleMaxMs: 10000 },
    chargeOnAggro: { speedMult: 2.5, durationMs: 1200 },
    aoeAttack: { radius: 140, damageMult: 0.5 },
    cadenceFinisher: { everyNAttacks: 4, multiplier: 2.0 },   // 350 — deep cap trip
    bossScript: {
      repeating: [
        // Earthshatter: a ground-slam AoE every 8s. At 1.5× = 262. Trips the cap.
        { intervalMs: 8000, initialDelayMs: 5000, actions: [{ type: 'slam', radius: 240, damageMult: 1.5 }] },
      ],
      phases: [
        { hpPct: 0.5, actions: [
          { type: 'enrage', atkMult: 1.20, cdMult: 0.90 },
          { type: 'apply-soft-cap', capPct: 0.25, capMult: 0.5 },  // NEW — its armor now clips your big hits
        ] },
        { hpPct: 0.25, actions: [
          { type: 'shed-defense' },                                 // NEW — soft-cap drops, plating crumbles
          { type: 'stat-buff', stat: 'speed', mult: 1.35 },
          { type: 'slam', radius: 320, damageMult: 2.2 },           // 385 — the final push
        ] },
      ],
    },
  }],


  // ════════════════════════════════════════════════════════════════════
  // DESERT — "Dune-Throne Sovereign"
  //
  // Three-act identity:
  //   ACT 1 (100–50%): Melee stalker. Applies movement slow on every hit.
  //     Charges to close on Far builds; slows kiters who try to dance away.
  //   ACT 2 (50–25%): MORPH — transforms to a ranged kiter. Backs off and
  //     plinks from 250 range, still applying its slow. Now anti-Close (melee
  //     chasing eats free slowed hits). Escalated ranged slam every 8s.
  //   ACT 3 (<25%): MORPH BACK — closes in as a desperate melee charger,
  //     losing the kite but gaining speed. Final slam burst.
  // ════════════════════════════════════════════════════════════════════
  ['dune-throne-sovereign', {
    id: 'dune-throne-sovereign', name: 'Dune-Throne Sovereign', color: 0xddbb33,
    isBoss: true,
    stats: { hp: 7800, attack: 142, plating: 8, damageReduction: 0.08, speed: 44, attackRange: 20, attackCooldown: 2800, pullRange: 400 },
    behavior: 'melee', attackStyle: 'magic', biome: 'desert',
    rewards: { essence: 595, essenceType: 'yellow', level: 5, biomeXp: 893 },
    ai: { wanderRadius: 140, leashRange: 960, idleMinMs: 2500, idleMaxMs: 7000 },
    chargeOnAggro: { speedMult: 2.5, durationMs: 1000 },
    slowEffect: { speedMult: 0.45, durationMs: 3000 },
    bossScript: {
      repeating: [
        // Sandstorm lash — a debuff slam every 9s that also applies the full slow.
        { intervalMs: 9000, initialDelayMs: 5000, actions: [{ type: 'slam', radius: 180, damageMult: 1.4 }] },
      ],
      phases: [
        { hpPct: 0.5, actions: [
          // Transforms to ranged kiter — maintains standoff and plinks.
          { type: 'morph', isRanged: true, attackStyle: 'magic', attackRange: 250, kite: true },
          { type: 'enrage', atkMult: 1.15, cdMult: 0.90 },
        ] },
        { hpPct: 0.25, actions: [
          // Sheds the kite, charges back in. Desperate close-range finale.
          { type: 'morph', isRanged: false, attackRange: 20, kite: false },
          { type: 'stat-buff', stat: 'speed', mult: 1.35 },
          { type: 'slam', radius: 240, damageMult: 1.8 },           // 255 — close-range eruption
        ] },
      ],
    },
  }],


  // ════════════════════════════════════════════════════════════════════
  // JUNGLE — "Verdant-Crown Predator"
  //
  // Identity: extreme speed + evasion + cadence spike.
  //   BASE: evasion 0.25 (every 4th player hit misses) + cadence every 5 = 235.
  //   50% phase: attack speed doubles — the finisher arrives faster, DoT stacks
  //     faster. Now evading it requires builds with on-hit/Harrier tools.
  //   25% DESPERATION: evasion drops to 0. The predator stops dodging and
  //     instead goes all-out — attack × 1.5, speed × 1.3. Hittable but lethal
  //     if the player can't kill it fast in this window.
  // ════════════════════════════════════════════════════════════════════
  ['verdant-crown-predator', {
    id: 'verdant-crown-predator', name: 'Verdant-Crown Predator', color: 0x115522,
    isBoss: true,
    stats: { hp: 8000, attack: 90, plating: 0, damageReduction: 0.04, speed: 76, attackRange: 20, attackCooldown: 1400, pullRange: 400 },
    behavior: 'melee', attackStyle: 'slash', biome: 'jungle',
    rewards: { essence: 605, essenceType: 'green', level: 5, biomeXp: 908 },
    ai: { wanderRadius: 150, leashRange: 960, idleMinMs: 2000, idleMaxMs: 6000 },
    chargeOnAggro: { speedMult: 2.8, durationMs: 900 },
    evasion: 0.25,
    cadenceFinisher: { everyNAttacks: 5, multiplier: 2.1 },   // 235
    dotEffect: { debuffId: 'verdant-crown-venom', label: 'Crown Venom', damagePerStack: 6, maxStacks: 5, tickIntervalMs: 1000, durationMs: 3500 },
    bossScript: {
      phases: [
        { hpPct: 0.5, actions: [
          // Attack speed jumps — more frequent finishers, faster DoT.
          { type: 'enrage', atkMult: 1.0, cdMult: 0.60 },
        ] },
        { hpPct: 0.25, actions: [
          // Desperation: drops evasion entirely, goes pure offense.
          { type: 'stat-buff', stat: 'evasion', mult: 0 },    // evasion zeroed — now hittable
          { type: 'stat-buff', stat: 'attack', mult: 1.5 },
          { type: 'stat-buff', stat: 'speed', mult: 1.30 },
        ] },
      ],
    },
  }],


  // ════════════════════════════════════════════════════════════════════
  // TUNDRA — "Glacial Patriarch"
  //
  // Identity: the patience test — a war of attrition that tightens the vice.
  //   BASE: rampDebuff (move and atk slow, capped) + repeating freeze slam.
  //     The longer the fight, the more debuffed you are.
  //   50% phase: ENEMY SOFT-CAP (armor hardens — your empowered attacks get
  //     clipped). The fight now demands fast consistent damage AND the brittle
  //     weapon shatter window to break through its plate.
  //   25% phase: the ramp debuff CAP LIFTS — the slow can now stack to near-
  //     total. Terrifying without debuff-resist armor. Forces urgency in a fight
  //     designed to reward patience — the tension is intentional.
  // ════════════════════════════════════════════════════════════════════
  ['glacial-patriarch', {
    id: 'glacial-patriarch', name: 'Glacial Patriarch', color: 0x77aadd,
    isBoss: true,
    stats: { hp: 10000, attack: 145, plating: 22, damageReduction: 0.14, speed: 14, attackRange: 20, attackCooldown: 4500, pullRange: 420 },
    behavior: 'melee', attackStyle: 'frost', biome: 'tundra',
    rewards: { essence: 640, essenceType: 'blue', level: 5, biomeXp: 960 },
    ai: { wanderRadius: 90, leashRange: 960, idleMinMs: 4000, idleMaxMs: 10000 },
    chargeOnAggro: { speedMult: 2.0, durationMs: 1300 },
    aoeAttack: { radius: 140, damageMult: 0.5 },
    rampDebuff: { moveSlowPerHit: 0.08, moveSlowMaxPct: 0.50, atkSlowPerHit: 0.06, atkSlowMaxPct: 0.40, stackDurationMs: 5000 },
    bossScript: {
      repeating: [
        // Permafrost slam every 9s. 1.5× = 217 — trips the cap.
        { intervalMs: 9000, initialDelayMs: 5000, actions: [{ type: 'slam', radius: 250, damageMult: 1.5 }] },
      ],
      phases: [
        { hpPct: 0.5, actions: [
          { type: 'enrage', atkMult: 1.20, cdMult: 0.90 },
          { type: 'apply-soft-cap', capPct: 0.25, capMult: 0.5 },  // NEW — armor hardens mid-fight
        ] },
        { hpPct: 0.25, actions: [
          // The vice closes: debuff caps lift. Without debuff-resist, you're near-frozen.
          { type: 'modify-ramp-debuff', moveSlowMaxPct: 0.85, atkSlowMaxPct: 0.70 },  // NEW
          { type: 'slam', radius: 300, damageMult: 1.8 },           // 261
        ] },
      ],
    },
  }],


  // ════════════════════════════════════════════════════════════════════
  // VOLCANIC — "Caldera Sovereign"
  //
  // Identity: sustained ramp + explosive finale.
  //   BASE: rampOnCombat (attack escalates over time, capped at +80%) + DoT on
  //     every hit + repeating fire slam. Starts manageable, becomes a furnace.
  //   50% phase: ENEMY SHIELD (lava-hardened hide flares). Tests burst builds
  //     vs DoT/chip — a pointed question in a biome that rewards DoT weapons.
  //     Enrage also fires: attacks get faster AND ramp is already building.
  //   25% phase: SHED DEFENSE — the shell cracks, enrage continues, and the
  //     attack gets a ×1.5 multiplier ON TOP of the existing ramp. The finale.
  // ════════════════════════════════════════════════════════════════════
  ['caldera-sovereign', {
    id: 'caldera-sovereign', name: 'Caldera Sovereign', color: 0xee3300,
    isBoss: true,
    stats: { hp: 9000, attack: 100, plating: 10, damageReduction: 0.05, speed: 24, attackRange: 20, attackCooldown: 2600, pullRange: 400 },
    behavior: 'melee', attackStyle: 'fire', biome: 'volcanic',
    rewards: { essence: 625, essenceType: 'red', level: 5, biomeXp: 938 },
    ai: { wanderRadius: 120, leashRange: 960, idleMinMs: 2500, idleMaxMs: 7000 },
    chargeOnAggro: { speedMult: 2.5, durationMs: 1000 },
    aoeAttack: { radius: 130, damageMult: 0.6 },
    rampOnCombat: { stat: 'attack', perTickPct: 0.10, maxPct: 0.80, tickIntervalMs: 2000 },
    dotEffect: { debuffId: 'caldera-burn', label: 'Caldera Burn', damagePerStack: 8, maxStacks: 5, tickIntervalMs: 1000, durationMs: 3000 },
    bossScript: {
      repeating: [
        // Eruption slam every 6s. At 1.3× early = 153; at full ramp = 213. Escalating threat.
        { intervalMs: 6000, initialDelayMs: 3000, actions: [{ type: 'slam', radius: 200, damageMult: 1.3 }] },
      ],
      phases: [
        { hpPct: 0.5, actions: [
          { type: 'enrage', atkMult: 1.30, cdMult: 0.85 },
          { type: 'apply-shield', shieldPct: 0.28, intervalMs: 14000, durationMs: 5000 },  // NEW
        ] },
        { hpPct: 0.25, actions: [
          { type: 'shed-defense' },                                  // NEW — shield cracks, plating crumbles
          { type: 'stat-buff', stat: 'attack', mult: 1.50 },
          { type: 'slam', radius: 280, damageMult: 2.0 },            // at full ramp: ~354
        ] },
      ],
    },
  }],


  // ════════════════════════════════════════════════════════════════════
  // GRAVEYARD — "Charnel-Crown Sovereign"
  //
  // Identity: the swarm boss. Its stats are modest; the ADDS are the weapon.
  //   BASE: high DoT on every hit + AoE that spreads disease to the area.
  //     The boss itself is survivable; the problem is managing everything else.
  //   50% phase: SPAWNS ADDS (bone-crawlers) + enrage (attack speed jumps).
  //     Kill the adds or the combined DoT from boss + swarm becomes lethal.
  //   25% phase: second ADDS wave (larger) + dotEffect intensifies + slam.
  //     The Graveyard's final statement: overwhelming attrition.
  // ════════════════════════════════════════════════════════════════════
  ['charnel-crown-sovereign', {
    id: 'charnel-crown-sovereign', name: 'Charnel-Crown Sovereign', color: 0x553366,
    isBoss: true,
    stats: { hp: 8500, attack: 88, plating: 14, damageReduction: 0.08, speed: 28, attackRange: 20, attackCooldown: 2300, pullRange: 400 },
    behavior: 'melee', attackStyle: 'poison', biome: 'graveyard',
    rewards: { essence: 615, essenceType: 'purple', level: 5, biomeXp: 923 },
    ai: { wanderRadius: 105, leashRange: 960, idleMinMs: 3000, idleMaxMs: 8000 },
    chargeOnAggro: { speedMult: 2.0, durationMs: 1100 },
    dotEffect: { debuffId: 'charnel-crown-decay', label: 'Crown Decay', damagePerStack: 7, maxStacks: 6, tickIntervalMs: 1000, durationMs: 5000 },
    aoeAttack: { radius: 130, damageMult: 0.5 },
    bossScript: {
      phases: [
        { hpPct: 0.5, actions: [
          { type: 'enrage', atkMult: 1.0, cdMult: 0.65 },
          { type: 'spawn-adds', monsterTypeId: 'bone-crawler', count: 5, offsetRange: 220 },  // NEW
        ] },
        { hpPct: 0.25, actions: [
          { type: 'enrage', atkMult: 1.40, cdMult: 0.60 },
          { type: 'spawn-adds', monsterTypeId: 'plague-hound', count: 3, offsetRange: 200 }, // NEW
          { type: 'slam', radius: 220, damageMult: 1.6 },            // 140 + massive DoT splash
        ] },
      ],
    },
  }],


  // ════════════════════════════════════════════════════════════════════
  // TRENCH — STAGED APEX ENCOUNTER
  //
  // The Elder of the Abyss (Void Overlord) is the T4 apex — a staged multi-
  // phase raid encounter. It does not fight directly until Stage 3; until then
  // it observes while its wardens and void-horrors do its work.
  //
  //   Stage 1 "Summoning Waves": three waves of adds while the Overlord stands
  //     immovable and invulnerable.
  //   Stage 2 "Void Wardens": three elite wardens spawn; must be slain.
  //   Stage 3 "The Flood": Overlord becomes vulnerable, attacks, and the zone
  //     fills with a rising void-flood environmental DoT that escalates over time.
  //
  // The elder-trench-serpent is the pre-boss gatekeeping encounter in the same dungeon.
  //
  // Stats are T4-calibrated (not the AI-generated placeholder values).
  // ════════════════════════════════════════════════════════════════════

  ['elder-trench-serpent', {
    id: 'elder-trench-serpent', name: 'Elder Trench Serpent', color: 0x335577,
    isBoss: true,
    stats: { hp: 9500, attack: 110, plating: 20, damageReduction: 0.22, speed: 22, attackRange: 22, attackCooldown: 3200, pullRange: 400 },
    behavior: 'melee', attackStyle: 'impact', biome: 'trench',
    rewards: { essence: 660, essenceType: 'purple', level: 5, biomeXp: 990 },
    ai: { wanderRadius: 100, leashRange: 960, idleMinMs: 4500, idleMaxMs: 11000 },
    chargeOnAggro: { speedMult: 2.3, durationMs: 1200 },
    aoeAttack: { radius: 130, damageMult: 0.5 },
    cadenceFinisher: { everyNAttacks: 4, multiplier: 2.5 },   // 275 — deep cap trip
    enemyShield: { shieldPct: 0.28, intervalMs: 15000, durationMs: 6000 },
    bossScript: {
      repeating: [
        { intervalMs: 10000, initialDelayMs: 6000, actions: [{ type: 'slam', radius: 220, damageMult: 1.8 }] },
      ],
      phases: [
        { hpPct: 0.5,  actions: [{ type: 'enrage', atkMult: 1.25, cdMult: 0.88 }] },
        { hpPct: 0.25, actions: [
          { type: 'shed-defense' },
          { type: 'stat-buff', stat: 'speed', mult: 1.30 },
          { type: 'slam', radius: 280, damageMult: 2.2 },
        ] },
      ],
    },
  }],

  ['elder-trench-serpent-warden', {
    id: 'elder-trench-serpent-warden', name: 'Elder Trench Serpent Warden', color: 0x223355,
    // Elite encounter unit; spawned in Stage 2 of the Void Overlord encounter.
    // Not a dungeon boss — no biomeXp, no essence reward of its own.
    stats: { hp: 3200, attack: 105, plating: 18, damageReduction: 0.18, speed: 20, attackRange: 22, attackCooldown: 3400, pullRange: 350 },
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
    stats: { hp: 13000, attack: 115, plating: 22, damageReduction: 0.24, speed: 18, attackRange: 22, attackCooldown: 3200, pullRange: 400 },
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
    stats: { hp: 380, attack: 52, plating: 0, damageReduction: 0, speed: 82, attackRange: 12, attackCooldown: 1100, pullRange: 310 },
    behavior: 'melee', attackStyle: 'impact', biome: 'trench',
    rewards: { essence: 0, essenceType: 'purple', level: 0, biomeXp: 0 },
    ai: { wanderRadius: 350, leashRange: 850, idleMinMs: 400, idleMaxMs: 2000 },
    dotEffect: { debuffId: 'void-horror-corruption', label: 'Void Corruption', damagePerStack: 9, maxStacks: 4, tickIntervalMs: 1000, durationMs: 2000 },
  }],

  ['void-hulk', {
    id: 'void-hulk', name: 'Void Hulk', color: 0x221133,
    // Stage-1 heavy add. Slow, hard-hitting, high plating — the anchor unit
    // in each wave. Tests pierce tools (Rupture, brittle weapon) mid-encounter.
    stats: { hp: 2200, attack: 95, plating: 16, damageReduction: 0.16, speed: 22, attackRange: 15, attackCooldown: 3500, pullRange: 200 },
    behavior: 'melee', attackStyle: 'impact', biome: 'trench',
    rewards: { essence: 0, essenceType: 'purple', level: 0, biomeXp: 0 },
    ai: { wanderRadius: 100, leashRange: 750, idleMinMs: 3000, idleMaxMs: 8000 },
    chargeOnAggro: { speedMult: 2.0, durationMs: 1200 },
    cadenceFinisher: { everyNAttacks: 4, multiplier: 2.0 },   // 190
  }],

] satisfies [string, MonsterDefinition][];
