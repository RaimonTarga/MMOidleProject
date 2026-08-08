import {
  GAME_CONFIG,
  STARTER_RUNE_IDS,
  emptyEquipment,
  resolveMonsterFrame,
  type MinionMonsterType,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { syncArchetypeSlices } from '../src/ecs/archetypeSliceSync';
import { recalculatePlayerEntityStats } from '../src/ecs/playerEntityFormulas';
import { updateSummonerArchetype } from '../src/systems/classes/archetypes/summoner/summonerPrototype';
import { World } from '../src/world/World';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

type Frame = 'light' | 'balanced' | 'heavy' | null;

function slices(
  id: string,
  frame: Frame,
  specId?: string,
  range = 'summoner-range-mid',
): PersistedPlayerSlices {
  const unlockedSkills = [
    'summoner-root',
    ...(frame ? [`summoner-${frame}`] : []),
    range,
    ...(specId ? [specId] : []),
  ];
  return {
    isPlayer: { id, name: id },
    hasPosition: {
      current: { x: 400, y: 400 },
      nodeId: 'node-clearing',
      speed: GAME_CONFIG.PLAYER_SPEED,
    },
    hasHealth: { hp: 10_000, maxHp: 10_000, hpRegen: 5 },
    tracksProgression: {
      level: 0,
      skillPoints: 0,
      essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      catalysts: {},
      catalystProgress: {},
      biomeXP: {},
      biomeLevel: {},
      unlockedRecipes: [],
      questProgress: {},
      playerTier: 4,
      currentSkillTier: 4,
      bossesCleared: [],
      clearedNodes: [],
      runesOwned: [...STARTER_RUNE_IDS],
      runeRecipesCrafted: [],
      runesEquipped: [],
      knownAbilities: [],
      equippedAbilities: { technique: null, guard: null },
      knownStances: [],
      equippedStances: { default: null, reactive: null },
      activeStance: null,
      knownRites: [],
      equippedRites: [],
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: {
      unlockedSkills,
      passives: {},
      selectedClass: 'summoner-root',
      selectedSubVariant: frame,
      selectedRange: range,
      combatArchetype: 'summoner',
    },
  };
}

const cases: Array<{
  label: string;
  frame: Frame;
  specId?: string;
  expected: MinionMonsterType[];
}> = [
  { label: 'root', frame: null, expected: ['conduit-summon'] },
  { label: 'Splinter', frame: 'light', expected: ['conduit-summon-splinter'] },
  {
    label: 'Inquisitor', frame: 'light', specId: 'summoner-light-t3-a',
    expected: ['conduit-summon-inquisitor'],
  },
  {
    label: 'Kilnmaster', frame: 'light', specId: 'summoner-light-t3-b',
    expected: ['conduit-summon-kilnmaster'],
  },
  {
    label: 'Iconoclast', frame: 'light', specId: 'summoner-light-t3-c',
    expected: ['conduit-summon-iconoclast'],
  },
  { label: 'Consort', frame: 'balanced', expected: ['conduit-summon-consort'] },
  {
    label: 'Marshal', frame: 'balanced', specId: 'summoner-balanced-t3-a',
    expected: ['conduit-summon-marshal'],
  },
  {
    label: 'Chorister', frame: 'balanced', specId: 'summoner-balanced-t3-b',
    expected: ['conduit-summon-chorister'],
  },
  {
    label: 'Ritualist', frame: 'balanced', specId: 'summoner-balanced-t3-c',
    expected: ['conduit-summon-ritualist'],
  },
  { label: 'Effigy', frame: 'heavy', expected: ['conduit-summon-effigy'] },
  {
    label: 'Covenanter', frame: 'heavy', specId: 'summoner-heavy-t3-a',
    expected: ['conduit-summon-covenanter-offense', 'conduit-summon-covenanter-defense'],
  },
  {
    label: 'Champion', frame: 'heavy', specId: 'summoner-heavy-t3-b',
    expected: ['conduit-summon-champion'],
  },
  {
    label: 'Idolwright', frame: 'heavy', specId: 'summoner-heavy-t3-c',
    expected: ['conduit-summon-idolwright'],
  },
];

for (const testCase of cases) {
  const world = new World();
  const player = world.attachPlayerEntity(
    slices(`summon-sprite-${testCase.label}`, testCase.frame, testCase.specId),
    `summon-sprite-${testCase.label}`,
  );
  syncArchetypeSlices(world, player);
  recalculatePlayerEntityStats(world, player);
  updateSummonerArchetype(world, 0, 1_000);

  const actual = player.summonsMinions!.minionIds.map((id) =>
    world.getMinionEntity(id)!.isMinion.monsterTypeId,
  );
  const expectedBySlot = Array.from(
    { length: actual.length },
    (_, index) => testCase.expected[index] ?? testCase.expected[0]!,
  );
  assert(
    JSON.stringify(actual) === JSON.stringify(expectedBySlot),
    `${testCase.label} sprite mismatch: expected ${expectedBySlot.join(', ')}, got ${actual.join(', ')}`,
  );
  for (const typeId of new Set(actual)) {
    assert(resolveMonsterFrame(typeId) !== null, `${typeId} must resolve to an atlas frame`);
  }
}

// Range is a tint/scale layer and must not change the selected body.
for (const range of ['summoner-range-close', 'summoner-range-mid', 'summoner-range-far']) {
  const world = new World();
  const player = world.attachPlayerEntity(
    slices(`summon-range-${range}`, 'balanced', 'summoner-balanced-t3-a', range),
    `summon-range-${range}`,
  );
  syncArchetypeSlices(world, player);
  recalculatePlayerEntityStats(world, player);
  updateSummonerArchetype(world, 0, 1_000);
  assert(
    player.summonsMinions!.minionIds.every((id) =>
      world.getMinionEntity(id)!.isMinion.monsterTypeId === 'conduit-summon-marshal'
    ),
    `${range} must preserve the Marshal body`,
  );
}

console.log('summonerSprites: ok');
