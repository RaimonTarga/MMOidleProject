import type { SkillNode } from './types';

/**
 * Persisted node ids are retained so existing characters map automatically to
 * the overhaul's frame-locked specialization cast.
 */
export const t3SummonerEntries = [
  ['summoner-light-t3-a', {
    id: 'summoner-light-t3-a', name: 'Harrier Brood', tier: 3,
    classId: 'summoner-root', subVariantId: 'light',
    parent: 'summoner-light', children: [],
    description: 'Each unique living summon can mark the focused enemy once. A complete brood maintains the strongest mark, rewarding deterministic focus fire and formation uptime.',
    cost: 1, statEffects: {}, mechanicEffects: {},
  }],
  ['summoner-light-t3-b', {
    id: 'summoner-light-t3-b', name: 'Endless Swarm', tier: 3,
    classId: 'summoner-root', subVariantId: 'light',
    parent: 'summoner-light', children: [],
    description: 'Expand to eight smaller summons. The same total formation offense and proc budget is spread across more bodies for coverage, at greater vulnerability to plating and area damage.',
    cost: 1, statEffects: {}, mechanicEffects: {},
  }],
  ['summoner-light-t3-c', {
    id: 'summoner-light-t3-c', name: 'Volatile Brood', tier: 3,
    classId: 'summoner-root', subVariantId: 'light',
    parent: 'summoner-light', children: [],
    description: 'Natural summon deaths explode modestly. At fixed intervals one living slot is marked to detonate for a stronger weapon-scaled blast, then enters the shared reconstruction queue.',
    cost: 1, statEffects: {}, mechanicEffects: {},
  }],

  ['summoner-balanced-t3-a', {
    id: 'summoner-balanced-t3-a', name: 'Coordinated Hunt', tier: 3,
    classId: 'summoner-root', subVariantId: 'balanced',
    parent: 'summoner-balanced', children: [],
    description: 'Each summon gains one opening strike against a new target. Complete formation attack cycles build toward a deterministic coordinated strike.',
    cost: 1, statEffects: {}, mechanicEffects: {},
  }],
  ['summoner-balanced-t3-b', {
    id: 'summoner-balanced-t3-b', name: 'Withering Chorus', tier: 3,
    classId: 'summoner-root', subVariantId: 'balanced',
    parent: 'summoner-balanced', children: [],
    description: 'Each unique living slot establishes one withering voice on a target. Any living summon can refresh the established chorus, making sustained full-formation focus its strongest state.',
    cost: 1, statEffects: {}, mechanicEffects: {},
  }],
  ['summoner-balanced-t3-c', {
    id: 'summoner-balanced-t3-c', name: 'Grand Ritual', tier: 3,
    classId: 'summoner-root', subVariantId: 'balanced',
    parent: 'summoner-balanced', children: [],
    description: 'Every 10 seconds, each currently living summon empowers its next two attacks. Missing slots receive no charges until the next ritual.',
    cost: 1, statEffects: {}, mechanicEffects: {},
  }],

  ['summoner-heavy-t3-a', {
    id: 'summoner-heavy-t3-a', name: 'Twin Covenant', tier: 3,
    classId: 'summoner-root', subVariantId: 'heavy',
    parent: 'summoner-heavy', children: [],
    description: 'Your pair becomes distinct: an offense twin carries most formation damage while a defense twin carries most durability and interception. A survivor gains only a bounded fallback.',
    cost: 1, statEffects: {}, mechanicEffects: {},
  }],
  ['summoner-heavy-t3-b', {
    id: 'summoner-heavy-t3-b', name: 'Battle Bond', tier: 3,
    classId: 'summoner-root', subVariantId: 'heavy',
    parent: 'summoner-heavy', children: [],
    description: 'Regain a direct Conduit attack and fight beside one bonded summon. Your weapon offense and proc budget are split between both sides; alternating attacks build a deterministic linked strike.',
    cost: 1, statEffects: {}, mechanicEffects: {},
  }],
  ['summoner-heavy-t3-c', {
    id: 'summoner-heavy-t3-c', name: 'Colossus', tier: 3,
    classId: 'summoner-root', subVariantId: 'heavy',
    parent: 'summoner-heavy', children: [],
    description: 'Condense the Heavy formation into one enormous summon with concentrated offense, a single durable body, and a longer, more costly reconstruction.',
    cost: 1, statEffects: {}, mechanicEffects: {},
  }],
] satisfies [string, SkillNode][];
