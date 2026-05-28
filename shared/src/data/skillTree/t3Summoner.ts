import type { SkillNode } from './types';

export const t3SummonerEntries = [
  // ── Tier 3: Summoner — Cave (Light / offensive support) ───────────────────

  ['summoner-light-t3-a', {
    id: 'summoner-light-t3-a', name: "Predator's Howl", tier: 3,
    classId: 'summoner-root', subVariantId: 'light',
    parent: 'summoner-light', children: [],
    description: 'Your lurkers replace your slimes. Each living lurker emits a hunter\'s aura at its attack range (120px). Allies inside any aura gain +5% attack speed per overlapping aura, capped at +30%. Stacks decay when out of every aura.',
    cost: 1, statEffects: {},
    mechanicEffects: {
      'summoner.minion-as-cave-lurker':   1,
      'summoner.predators-howl':          1,
      'summoner.minion-range':            120,
      'summoner.howl-pct-per-stack':      0.05,
      'summoner.howl-cap':                6,
    } as Record<string, number>,
  }],

  ['summoner-light-t3-b', {
    id: 'summoner-light-t3-b', name: 'Swarm', tier: 3,
    classId: 'summoner-root', subVariantId: 'light',
    parent: 'summoner-light', children: [],
    description: 'Your lurkers replace your slimes. Double your summon count again — each lurker is half as large again and shares your HP pool (1/12 each at full swarm). Swarm lurkers move faster. They spread across multiple targets when possible. Enemies take +10% damage from all sources per attacker focusing them (Overwhelmed).',
    cost: 1, statEffects: {},
    mechanicEffects: {
      'summoner.minion-as-cave-lurker':            1,
      'summoner.swarm':                            1,
      'summoner.minion-count-mult':                2.0,
      'summoner.minion-size-mult':                 -0.25,
      'summoner.minion-speed-mult':                1.45,
      'summoner.overwhelmed-pct-per-attacker':     0.10,
      'summoner.overwhelmed-ms':                   2000,
    } as Record<string, number>,
  }],

  ['summoner-light-t3-c', {
    id: 'summoner-light-t3-c', name: 'Acid Brood', tier: 3,
    classId: 'summoner-root', subVariantId: 'light',
    parent: 'summoner-light', children: [],
    description: 'Your lurkers replace your slimes. Each lurker decays over 12 s, then explodes for AoE damage and applies Corrosion to nearby monsters. Bites also stack Corrosion (cap 10, −2 plating per stack).',
    cost: 1, statEffects: {},
    mechanicEffects: {
      'summoner.minion-as-cave-lurker':            1,
      'summoner.acid-brood':                       1,
      'summoner.acid-cap':                         10,
      'summoner.acid-plating-per-stack':           2,
      'summoner.acid-duration-ms':                 8000,
      'summoner.acid-lurker-lifetime-ms':          12000,
      'summoner.acid-explosion-radius':            80,
      'summoner.acid-explosion-damage-pct':        0.80,
      'summoner.acid-explosion-corrosion-stacks':  2,
    } as Record<string, number>,
  }],

  // ── Tier 3: Summoner — Plains (Medium / pure support) ───────────────────────

  ['summoner-balanced-t3-a', {
    id: 'summoner-balanced-t3-a', name: 'Grazing Field', tier: 3,
    classId: 'summoner-root', subVariantId: 'balanced',
    parent: 'summoner-balanced', children: [],
    description: 'Your plains-slimes pulse a heal aura every 2 s at their attack range (100px), restoring 4% max HP to allies inside. Out of combat the heal doubles.',
    cost: 1, statEffects: {},
    mechanicEffects: {
      'summoner.minion-as-plains-slime':  1,
      'summoner.grazing-field':           1,
      'summoner.grazing-interval-ms':     2000,
      'summoner.grazing-pct':             0.04,
      'summoner.minion-range':            100,
      'summoner.grazing-ooc-mult':        2.0,
    } as Record<string, number>,
  }],

  ['summoner-balanced-t3-b', {
    id: 'summoner-balanced-t3-b', name: 'Trampled Path', tier: 3,
    classId: 'summoner-root', subVariantId: 'balanced',
    parent: 'summoner-balanced', children: [],
    description: 'Your boars grant allies +25% movement speed within their attack range (120px). Every 10 s each boar Charges to close distance, then its next hit always stuns the target for 1.2 s.',
    cost: 1, statEffects: {},
    mechanicEffects: {
      'summoner.minion-as-boar':          1,
      'summoner.trampled-path':           1,
      'summoner.minion-range':            120,
      'summoner.trample-speed-pct':       0.25,
      'summoner.trample-charge-cd-ms':         10_000,
      'summoner.trample-charge-speed-mult':    3.5,
      'summoner.trample-stun-ms':              1200,
    } as Record<string, number>,
  }],

  ['summoner-balanced-t3-c', {
    id: 'summoner-balanced-t3-c', name: 'Vital Burst', tier: 3,
    classId: 'summoner-root', subVariantId: 'balanced',
    parent: 'summoner-balanced', children: [],
    description: 'The first plains-slime to die in a fight cleanses slow and DoT from allies within its attack range (200px) and grants 3 s of debuff immunity.',
    cost: 1, statEffects: {},
    mechanicEffects: {
      'summoner.minion-as-plains-slime':  1,
      'summoner.vital-burst':             1,
      'summoner.minion-range':            200,
      'summoner.vital-burst-immunity-ms': 3000,
    } as Record<string, number>,
  }],

  // ── Tier 3: Summoner — Mountain (Heavy / defensive support) ───────────────

  ['summoner-heavy-t3-a', {
    id: 'summoner-heavy-t3-a', name: 'Stone Sentinel', tier: 3,
    classId: 'summoner-root', subVariantId: 'heavy',
    parent: 'summoner-heavy', children: [],
    description: 'Summon two stationary ridge-archer sentries (180px attack range). They never move; if you walk beyond twice your attack range they despawn and respawn at your side. Each sentry slows nearby monsters\' movement and attack speed within its attack range.',
    cost: 1, statEffects: {},
    mechanicEffects: {
      'summoner.minion-as-ridge-archer':       1,
      'summoner.stone-sentinel':               1,
      'summoner.stone-sentinel-count':         2,
      'summoner.sentinel-respawn-mult':        0.5,
      'summoner.minion-range':                 180,
      'summoner.sentinel-tether-mult':           2.0,
      'summoner.sentinel-slow-speed-mult':     0.65,
      'summoner.sentinel-slow-atk-mult':       1.35,
    } as Record<string, number>,
  }],

  ['summoner-heavy-t3-b', {
    id: 'summoner-heavy-t3-b', name: 'Rockslide Cover', tier: 3,
    classId: 'summoner-root', subVariantId: 'heavy',
    parent: 'summoner-heavy', children: [],
    description: 'Your cliff-hoppers extend your damage sponge to allies within their attack range (160px) — 30% of their damage redirects to a living hopper.',
    cost: 1, statEffects: {},
    mechanicEffects: {
      'summoner.minion-as-cliff-hopper':  1,
      'summoner.rockslide-cover':         1,
      'summoner.rockslide-pct':           0.30,
      'summoner.minion-range':            160,
    } as Record<string, number>,
  }],

  ['summoner-heavy-t3-c', {
    id: 'summoner-heavy-t3-c', name: 'Mountain Guardian', tier: 3,
    classId: 'summoner-root', subVariantId: 'heavy',
    parent: 'summoner-heavy', children: [],
    description: 'You summon one colossal mountain sentinel. It taunts monsters within leash range, inherits 20% of your plating and DR, and respawns in 12 s if it falls.',
    cost: 1, statEffects: {},
    mechanicEffects: {
      'summoner.minion-as-mountain-sentinel': 1,
      'summoner.mountain-guardian':           1,
      'summoner.minion-count-cap':            1,
      'summoner.minion-hp-pct':               1.0,
      'summoner.minion-size-mult':            2.5,
      'summoner.minion-respawn-ms':           12000,
      'summoner.guardian-plating-share-pct':  0.20,
      'summoner.guardian-dr-share-pct':       0.20,
    } as Record<string, number>,
  }],
] satisfies [string, SkillNode][];
