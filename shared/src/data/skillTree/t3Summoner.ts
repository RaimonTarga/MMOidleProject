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
    description: 'Each unique living summon can mark the focused enemy once. Every mark makes your formation deal 3.5% more damage to that target for 5 seconds, so a complete formation sustains the strongest accusation and rewards deterministic focus fire.',
    cost: 1, statEffects: {}, mechanicEffects: {},
  }],
  ['summoner-light-t3-b', {
    id: 'summoner-light-t3-b', name: 'Kilnmaster', tier: 3,
    classId: 'summoner-root', subVariantId: 'light',
    parent: 'summoner-light', children: [],
    description: 'Fire the formation in one larger batch: 8 smaller summons instead of 6. They still divide one direct-offense budget, while the whole formation carries ×1.30 on-hit and secondary weapon effects and a ×0.80 reconstruction interval (1.6s before the 1.5s floor). Coverage rises, as does vulnerability to plating and area damage.',
    cost: 1, statEffects: {}, mechanicEffects: {},
  }],
  ['summoner-light-t3-c', {
    id: 'summoner-light-t3-c', name: 'Iconoclast', tier: 3,
    classId: 'summoner-root', subVariantId: 'light',
    parent: 'summoner-light', children: [],
    description: 'You break your own works. Natural summon deaths explode for ×0.45 weapon-scaled damage; every 8 seconds one living slot is marked to shatter for a ×1.35 weapon-scaled blast in a 78px radius, then enters the shared reconstruction queue.',
    cost: 1, statEffects: {}, mechanicEffects: {},
  }],

  ['summoner-balanced-t3-a', {
    id: 'summoner-balanced-t3-a', name: 'Marshal', tier: 3,
    classId: 'summoner-root', subVariantId: 'balanced',
    parent: 'summoner-balanced', children: [],
    description: 'You drill the formation. Each summon gains one ×1.45 opening strike against a new target, and every 4 complete formation attack cycles deliver a deterministic coordinated strike at ×1.65 of the living formation offense.',
    cost: 1, statEffects: {}, mechanicEffects: {},
  }],
  ['summoner-balanced-t3-b', {
    id: 'summoner-balanced-t3-b', name: 'Chorister', tier: 3,
    classId: 'summoner-root', subVariantId: 'balanced',
    parent: 'summoner-balanced', children: [],
    description: 'Each unique living slot establishes one withering voice on a target. Every voice deals 4.5% of your Attack as DoT each second; the chorus lasts 6 seconds and any living summon can refresh it, making sustained full-formation focus its strongest state.',
    cost: 1, statEffects: {}, mechanicEffects: {},
  }],
  ['summoner-balanced-t3-c', {
    id: 'summoner-balanced-t3-c', name: 'Ritualist', tier: 3,
    classId: 'summoner-root', subVariantId: 'balanced',
    parent: 'summoner-balanced', children: [],
    description: 'Every 10 seconds you call the rite, and each currently living summon receives 2 charges; each charge empowers one attack by ×1.60. Missing slots receive no charges until the next ritual.',
    cost: 1, statEffects: {}, mechanicEffects: {},
  }],

  ['summoner-heavy-t3-a', {
    id: 'summoner-heavy-t3-a', name: 'Covenanter', tier: 3,
    classId: 'summoner-root', subVariantId: 'heavy',
    parent: 'summoner-heavy', children: [],
    description: 'You bind your pair under separate terms: the offense twin carries 75% of formation offense and 30% of formation defense, while the defense twin carries 25% of offense and 70% of defense. A survivor gains only a bounded fallback.',
    cost: 1, statEffects: {}, mechanicEffects: {},
  }],
  ['summoner-heavy-t3-b', {
    id: 'summoner-heavy-t3-b', name: 'Champion', tier: 3,
    classId: 'summoner-root', subVariantId: 'heavy',
    parent: 'summoner-heavy', children: [],
    description: 'You stop conducting and take the field yourself, fighting beside one bonded summon. Your weapon carries 45% of the offense budget and the bonded summon 55%; alternating attacks build a deterministic linked strike after 8 fixed contributions.',
    cost: 1, statEffects: {}, mechanicEffects: {},
  }],
  ['summoner-heavy-t3-c', {
    id: 'summoner-heavy-t3-c', name: 'Idolwright', tier: 3,
    classId: 'summoner-root', subVariantId: 'heavy',
    parent: 'summoner-heavy', children: [],
    description: 'Condense the Effigy formation into one enormous summon: ×1.50 body size, concentrated offense, a single durable body, and ×1.35 reconstruction time.',
    cost: 1, statEffects: {}, mechanicEffects: {},
  }],
] satisfies [string, SkillNode][];
