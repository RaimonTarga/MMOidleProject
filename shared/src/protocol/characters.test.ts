import type {
  HasPosition,
  IsPlayer,
  TracksProgression,
  UsesSkills,
} from '../components';
import {
  buildCharacterSummary,
  resolveCharacterClassName,
  validateCharacterName,
} from './characters';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function assertInvalid(input: string, message: string): void {
  assert(!validateCharacterName(input).ok, message);
}

const normalized = validateCharacterName("  Doran   O'Neil  ");
assert(normalized.ok, 'valid name should pass');
assert(normalized.ok && normalized.name === "Doran O'Neil", 'name should normalize whitespace');

assertInvalid('', 'empty name should fail');
assertInvalid('A', 'one-character name should fail');
assertInvalid('A'.repeat(25), '25-character name should fail');
assertInvalid('Hero_One', 'underscore should fail');
assertInvalid('--', 'punctuation-only name should fail');
assert(validateCharacterName('R2-D2').ok, 'letters, numbers, and hyphens should pass');
assert(validateCharacterName('Éowyn').ok, 'Unicode letters should pass');

const isPlayer = { id: 'persisted-id', name: 'Mara' } satisfies IsPlayer;
const hasPosition = {
  current: { x: 12, y: 34 },
  nodeId: 'node-clearing',
  speed: 100,
} satisfies HasPosition;
const tracksProgression = {
  level: 7,
  playerTier: 2,
  biomeLevel: { clearing: 4, forest: 3, plains: 2 },
} as unknown as TracksProgression;
const usesSkills = {
  combatArchetype: 'cadence',
  selectedClass: 'cadence-root',
  unlockedSkills: [
    'cadence-root',
    'cadence-heavy',
    'cadence-range-close',
    'cadence-heavy-t3-a',
  ],
} as UsesSkills;

const summary = buildCharacterSummary(
  { isPlayer, hasPosition, tracksProgression, usesSkills },
  { id: 'row-id', lastPlayedAt: 1234 },
);
assert(summary.id === 'row-id', 'summary should use the authoritative row id');
assert(summary.name === 'Mara', 'summary should include the character name');
assert(summary.globalMastery === 5, 'summary should derive mastery and exclude the clearing');
assert(summary.playerTier === 2, 'summary should include player tier');
assert(summary.combatArchetype === 'cadence', 'summary should include combat archetype');
assert(summary.selectedClass === 'cadence-root', 'summary should include selected class');
assert(summary.classDisplayName === 'Berserker', 'summary should use the latest named class tier');
assert(summary.unlockedSkills[0] === 'cadence-root', 'summary should include sprite-selection skills');
assert(summary.nodeId === 'node-clearing', 'summary should include node id');
assert(summary.lastPlayedAt === 1234, 'summary should include last-played time');

assert(
  resolveCharacterClassName(['cadence-root', 'cadence-heavy'], 'cadence-root') === 'Breaker',
  'frame class should replace the root name',
);
assert(
  resolveCharacterClassName(
    ['cadence-root', 'cadence-heavy', 'cadence-range-close', 'cadence-heavy-t3-a', 'cadence-heavy-t4-a'],
    'cadence-root',
  ) === 'Berserker',
  'later perk tiers should retain the specialization name',
);

console.log('characters: ok');
