import type { SkillNode } from './types';

/**
 * Persisted node ids are retained so existing characters map automatically to
 * the overhaul's frame-locked specialization cast.
 */
export const t3SummonerEntries = [
  ['summoner-light-t3-a', {
    id: 'summoner-light-t3-a', name: 'Inquisitor', tier: 3,
    classId: 'summoner-root', subVariantId: 'light',
    parent: 'summoner-light', children: [],
    description: 'Each unique living summon can name the focused enemy once. A complete formation sustains the strongest accusation, rewarding deterministic focus fire and formation uptime.',
    cost: 1, statEffects: {}, mechanicEffects: {},
  }],
  ['summoner-light-t3-b', {
    id: 'summoner-light-t3-b', name: 'Kilnmaster', tier: 3,
    classId: 'summoner-root', subVariantId: 'light',
    parent: 'summoner-light', children: [],
    description: 'Fire the formation in one larger batch: eight smaller summons. The same total offense and proc budget is spread across more bodies for coverage, at greater vulnerability to plating and area damage.',
    cost: 1, statEffects: {}, mechanicEffects: {},
  }],
  ['summoner-light-t3-c', {
    id: 'summoner-light-t3-c', name: 'Iconoclast', tier: 3,
    classId: 'summoner-root', subVariantId: 'light',
    parent: 'summoner-light', children: [],
    description: 'You break your own works. Natural summon deaths explode modestly, and at fixed intervals one living slot is marked to shatter for a stronger weapon-scaled blast, then enters the shared reconstruction queue.',
    cost: 1, statEffects: {}, mechanicEffects: {},
  }],

  ['summoner-balanced-t3-a', {
    id: 'summoner-balanced-t3-a', name: 'Marshal', tier: 3,
    classId: 'summoner-root', subVariantId: 'balanced',
    parent: 'summoner-balanced', children: [],
    description: 'You drill the formation. Each summon gains one opening strike against a new target, and complete formation attack cycles build toward a deterministic coordinated strike.',
    cost: 1, statEffects: {}, mechanicEffects: {},
  }],
  ['summoner-balanced-t3-b', {
    id: 'summoner-balanced-t3-b', name: 'Chorister', tier: 3,
    classId: 'summoner-root', subVariantId: 'balanced',
    parent: 'summoner-balanced', children: [],
    description: 'Each unique living slot establishes one withering voice on a target. Any living summon can refresh the established chorus, making sustained full-formation focus its strongest state.',
    cost: 1, statEffects: {}, mechanicEffects: {},
  }],
  ['summoner-balanced-t3-c', {
    id: 'summoner-balanced-t3-c', name: 'Ritualist', tier: 3,
    classId: 'summoner-root', subVariantId: 'balanced',
    parent: 'summoner-balanced', children: [],
    description: 'Every 10 seconds you call the rite, and each currently living summon empowers its next two attacks. Missing slots receive no charges until the next ritual.',
    cost: 1, statEffects: {}, mechanicEffects: {},
  }],

  ['summoner-heavy-t3-a', {
    id: 'summoner-heavy-t3-a', name: 'Covenanter', tier: 3,
    classId: 'summoner-root', subVariantId: 'heavy',
    parent: 'summoner-heavy', children: [],
    description: 'You bind your pair under separate terms: an offense twin carries most formation damage while a defense twin carries most durability and interception. A survivor gains only a bounded fallback.',
    cost: 1, statEffects: {}, mechanicEffects: {},
  }],
  ['summoner-heavy-t3-b', {
    id: 'summoner-heavy-t3-b', name: 'Champion', tier: 3,
    classId: 'summoner-root', subVariantId: 'heavy',
    parent: 'summoner-heavy', children: [],
    description: 'You stop conducting and take the field yourself, fighting beside one bonded summon. Your weapon offense and proc budget are split between both sides; alternating attacks build a deterministic linked strike.',
    cost: 1, statEffects: {}, mechanicEffects: {},
  }],
  ['summoner-heavy-t3-c', {
    id: 'summoner-heavy-t3-c', name: 'Idolwright', tier: 3,
    classId: 'summoner-root', subVariantId: 'heavy',
    parent: 'summoner-heavy', children: [],
    description: 'Condense the Effigy formation into one enormous summon with concentrated offense, a single durable body, and a longer, more costly reconstruction.',
    cost: 1, statEffects: {}, mechanicEffects: {},
  }],
] satisfies [string, SkillNode][];
