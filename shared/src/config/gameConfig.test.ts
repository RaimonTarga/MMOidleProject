import {
  BIOME_LEVELS_PER_TIER,
  CLEARING_MASTERY_XP_THRESHOLDS,
  GAME_CONFIG,
  biomeLevelCap,
  biomeLevelOffset,
  biomeXpForBiomeLevel,
  biomeXpForLevel,
  biomeXpSegmentBudget,
  clearingMasteryXpForLevel,
  globalMastery,
  maxGlobalMasteryAtTier,
  nodeSceneBounds,
  peekSceneBounds,
} from './gameConfig';
import { MONSTER_DATABASE } from '../monsterDatabase';
import { QUEST_DATABASE } from '../quests/questDatabase';
import { WORLD_NODE_LIST, worldNodeExits } from '../world/nodeBiomes';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const W = GAME_CONFIG.NODE_WIDTH;
const H = GAME_CONFIG.NODE_HEIGHT;

function testNodeSceneBounds(): void {
  const bounds = nodeSceneBounds();
  assert(bounds.x === 0, 'nodeSceneBounds x');
  assert(bounds.y === 0, 'nodeSceneBounds y');
  assert(bounds.width === W, 'nodeSceneBounds width');
  assert(bounds.height === H, 'nodeSceneBounds height');
}

function testPeekSceneBoundsCenter(): void {
  const vw = 800;
  const vh = 600;
  const bounds = peekSceneBounds('node-clearing', vw, vh);
  const peekW = vw / 2;
  const peekH = vh / 2;

  assert(bounds.x === -peekW, 'center node west peek');
  assert(bounds.y === -peekH, 'center node north peek');
  assert(bounds.width === W + peekW * 2, 'center node width');
  assert(bounds.height === H + peekH * 2, 'center node height');
}

function testPeekSceneBoundsCorner(): void {
  const vw = 1000;
  const vh = 800;
  const cornerNode = WORLD_NODE_LIST.find((node) => {
    if (node.regionId !== 't1' || node.kind !== 'normal') return false;
    const exits = worldNodeExits(node.id);
    return !exits.west && !exits.north && Boolean(exits.east && exits.south);
  });
  assert(Boolean(cornerNode), 'T1 has a northwest corner node');
  if (!cornerNode) throw new Error('unreachable');
  const bounds = peekSceneBounds(cornerNode.id, vw, vh);
  const peekW = vw / 2;
  const peekH = vh / 2;

  assert(bounds.x === 0, 'corner NW has no west peek');
  assert(bounds.y === 0, 'corner NW has no north peek');
  assert(bounds.width === W + peekW, 'corner NW east peek only');
  assert(bounds.height === H + peekH, 'corner NW south peek only');
}

function testPeekSceneBoundsEdge(): void {
  const vw = 1200;
  const vh = 900;
  const edgeNode = WORLD_NODE_LIST.find((node) => {
    if (node.regionId !== 't1' || node.kind !== 'normal') return false;
    const exits = worldNodeExits(node.id);
    return !exits.west && Boolean(exits.north && exits.east && exits.south);
  });
  assert(Boolean(edgeNode), 'T1 has a west-edge node');
  if (!edgeNode) throw new Error('unreachable');
  const bounds = peekSceneBounds(edgeNode.id, vw, vh);
  const peekW = vw / 2;
  const peekH = vh / 2;

  assert(bounds.x === 0, 'west edge has no west peek');
  assert(bounds.y === -peekH, 'west edge north peek');
  assert(bounds.width === W + peekW, 'west edge east peek only');
  assert(bounds.height === H + peekH * 2, 'west edge north+south peek');
}

const localTables = [
  [210, 455, 735, 1_050, 1_383, 1_750],
  [600, 1_300, 2_100, 3_000, 3_950, 5_000],
  [840, 1_820, 2_940, 4_200, 5_530, 7_000],
  [1_080, 2_340, 3_780, 5_400, 7_110, 9_000],
] as const;

assert(BIOME_LEVELS_PER_TIER === 6, 'biome segments remain six levels');
assert(
  GAME_CONFIG.BIOME_XP_LOCAL_STEP_SHARES.reduce((sum, share) => sum + share, 0) === 100,
  'local XP shares sum to 100%',
);

for (let tier = 1; tier <= 4; tier++) {
  assert(
    biomeXpSegmentBudget(tier) === [0, 1_750, 5_000, 7_000, 9_000][tier],
    `T${tier} segment budget is explicit`,
  );
  const offset = (tier - 1) * BIOME_LEVELS_PER_TIER;
  const actual = [1, 2, 3, 4, 5, 6].map(
    (level) => biomeXpForLevel(offset + level) - biomeXpForLevel(offset),
  );
  assert(
    JSON.stringify(actual) === JSON.stringify(localTables[tier - 1]),
    `T${tier} local XP table matches the authored shares`,
  );
}

assert(biomeXpForLevel(0) === 0, 'level zero costs zero XP');
assert(biomeXpForLevel(6) === 1_750, 'T1 reference segment ends at 1,750 XP');
assert(biomeXpForLevel(12) === 6_750, 'T2 reference segment ends at 6,750 cumulative XP');
assert(biomeXpForLevel(18) === 13_750, 'T3 reference segment ends at 13,750 cumulative XP');
assert(biomeXpForLevel(24) === 22_750, 'T4 reference segment ends at 22,750 cumulative XP');

assert(biomeLevelOffset('plains') === 0, 'T1 biome keeps zero offset');
assert(biomeLevelOffset('jungle') === 6, 'T2-start biome keeps its six-level offset');
assert(biomeXpForBiomeLevel('plains', 6) === 1_750, 'T1 biome reaches its local budget');
assert(biomeXpForBiomeLevel('jungle', 1) === 600, 'T2-start biome begins on the T2 local curve');
assert(biomeXpForBiomeLevel('jungle', 6) === 5_000, 'T2-start biome reaches the T2 local budget');
assert(biomeXpForBiomeLevel('jungle', 7) === 5_840, 'T2-start biome advances into the T3 curve');
assert(
  JSON.stringify(CLEARING_MASTERY_XP_THRESHOLDS) === JSON.stringify([0, 43, 172, 430, 860]),
  'clearing keeps its explicit tutorial threshold table',
);
assert(clearingMasteryXpForLevel(0) === 0, 'clearing level zero costs zero XP');
assert(clearingMasteryXpForLevel(1) === 43, 'clearing level 1 arrives after one Tiny Wisp');
assert(clearingMasteryXpForLevel(2) === 172, 'clearing level 2 arrives after four Tiny Wisps');
assert(clearingMasteryXpForLevel(3) === 430, 'clearing level 3 aligns with First Blood');
assert(clearingMasteryXpForLevel(4) === 860, 'clearing level 4 arrives after twenty Tiny Wisps');
assert(clearingMasteryXpForLevel(5) === 860, 'clearing thresholds stop at the four-level cap');
assert(biomeXpForBiomeLevel('clearing', 4) === 860, 'clearing does not inherit the normal T1 curve');
assert(biomeXpForLevel(4) === 1_050, 'normal T1 curve remains independent at level 4');
assert(
  MONSTER_DATABASE.get('tiny-slime')?.rewards.biomeXp === 43,
  'Clearing threshold table stays aligned with the unchanged Tiny Wisp reward',
);
const firstBlood = QUEST_DATABASE.get('tier-0');
assert(firstBlood?.killsRequired === 10, 'First Blood remains a ten-kill quest');
assert(
  JSON.stringify(firstBlood?.targetMonsterTypes) === JSON.stringify(['tiny-slime']),
  'First Blood still targets Tiny Wisps',
);

let previous = 0;
for (let level = 1; level <= 24; level++) {
  const threshold = biomeXpForLevel(level);
  assert(threshold > previous, `reference threshold is strictly increasing at L${level}`);
  previous = threshold;
}

assert(biomeLevelCap(1, 'plains') === 6, 'T1 biome cap is unchanged');
assert(biomeLevelCap(2, 'jungle') === 6, 'late-start biome cap is unchanged');
assert(globalMastery({ plains: 6, forest: 6, clearing: 4 }) === 12, 'Global Mastery remains level-based');
assert(maxGlobalMasteryAtTier(1) === 30, 'T1 Global Mastery ceiling is unchanged');

testNodeSceneBounds();
testPeekSceneBoundsCenter();
testPeekSceneBoundsCorner();
testPeekSceneBoundsEdge();
console.log('gameConfig.test.ts: all passed');
