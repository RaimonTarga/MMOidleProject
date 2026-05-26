import type { MonsterDefinition } from './types';

export const tutorialMonsterEntries = [
  // ── Clearing (ring 0, tier 0 — tutorial zone) ──────────────────────────────
  ['tiny-slime', {
    id: 'tiny-slime', name: 'Tiny Slime', color: 0x99ff99,
    stats: { hp: 22, attack: 3, plating: 0, damageReduction: 0, speed: 30, attackRange: 50, attackCooldown: 3000, pullRange: 140 },
    behavior: 'melee', attackStyle: 'impact', biome: 'clearing',
    rewards: { essence: 2, essenceType: 'green', level: 1, biomeXp: 43 },
    ai: { wanderRadius: 140, leashRange: 380, idleMinMs: 2000, idleMaxMs: 5000 },
  }],

  ['test-target-reset', {
    id: 'test-target-reset', name: 'Reset', color: 0xff5555,
    stats: { hp: 9_999_999, attack: 0, plating: 0, damageReduction: 1, speed: 0, attackRange: 0, attackCooldown: 999_999, pullRange: 0 },
    behavior: 'melee', attackStyle: 'impact', biome: 'testroom',
    rewards: { essence: 0, essenceType: 'red', level: 0 },
    ai: { wanderRadius: 0, leashRange: 0, idleMinMs: 999_999, idleMaxMs: 999_999 },
    interactKind: 'reset',
  }],

  ['test-target-gain-point', {
    id: 'test-target-gain-point', name: 'Gain Point', color: 0x55aaff,
    stats: { hp: 9_999_999, attack: 0, plating: 0, damageReduction: 1, speed: 0, attackRange: 0, attackCooldown: 999_999, pullRange: 0 },
    behavior: 'melee', attackStyle: 'magic', biome: 'testroom',
    rewards: { essence: 0, essenceType: 'blue', level: 0 },
    ai: { wanderRadius: 0, leashRange: 0, idleMinMs: 999_999, idleMaxMs: 999_999 },
    interactKind: 'gainPoint',
  }],

  ['training-dummy-t0', {
    id: 'training-dummy-t0', name: 'Training Dummy T0', color: 0xb0b0b0,
    stats: { hp: 22, attack: 0, plating: 0, damageReduction: 0, speed: 0, attackRange: 0, attackCooldown: 999_999, pullRange: 0 },
    behavior: 'melee', attackStyle: 'impact', biome: 'testroom',
    rewards: { essence: 0, essenceType: 'green', level: 0 },
    ai: { wanderRadius: 0, leashRange: 0, idleMinMs: 999_999, idleMaxMs: 999_999 },
  }],

  ['training-dummy-t1', {
    id: 'training-dummy-t1', name: 'Training Dummy T1', color: 0xa8a8a8,
    stats: { hp: 500, attack: 0, plating: 0, damageReduction: 0, speed: 0, attackRange: 0, attackCooldown: 999_999, pullRange: 0 },
    behavior: 'melee', attackStyle: 'impact', biome: 'testroom',
    rewards: { essence: 0, essenceType: 'green', level: 0 },
    ai: { wanderRadius: 0, leashRange: 0, idleMinMs: 999_999, idleMaxMs: 999_999 },
  }],

  ['training-dummy-t2', {
    id: 'training-dummy-t2', name: 'Training Dummy T2', color: 0x909090,
    stats: { hp: 2200, attack: 0, plating: 0, damageReduction: 0, speed: 0, attackRange: 0, attackCooldown: 999_999, pullRange: 0 },
    behavior: 'melee', attackStyle: 'impact', biome: 'testroom',
    rewards: { essence: 0, essenceType: 'green', level: 0 },
    ai: { wanderRadius: 0, leashRange: 0, idleMinMs: 999_999, idleMaxMs: 999_999 },
  }],

  ['training-dummy-t3', {
    id: 'training-dummy-t3', name: 'Training Dummy T3', color: 0x787878,
    stats: { hp: 4200, attack: 0, plating: 0, damageReduction: 0, speed: 0, attackRange: 0, attackCooldown: 999_999, pullRange: 0 },
    behavior: 'melee', attackStyle: 'impact', biome: 'testroom',
    rewards: { essence: 0, essenceType: 'green', level: 0 },
    ai: { wanderRadius: 0, leashRange: 0, idleMinMs: 999_999, idleMaxMs: 999_999 },
  }],

  ['training-dummy-t4', {
    id: 'training-dummy-t4', name: 'Training Dummy T4', color: 0x606060,
    stats: { hp: 7500, attack: 0, plating: 0, damageReduction: 0, speed: 0, attackRange: 0, attackCooldown: 999_999, pullRange: 0 },
    behavior: 'melee', attackStyle: 'impact', biome: 'testroom',
    rewards: { essence: 0, essenceType: 'green', level: 0 },
    ai: { wanderRadius: 0, leashRange: 0, idleMinMs: 999_999, idleMaxMs: 999_999 },
  }],
] satisfies [string, MonsterDefinition][];
