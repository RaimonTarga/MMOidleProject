import { GAME_CONFIG } from '@mmo-idle/shared';
import { allOf, type Route, type RouteStep } from '../route/types';
import { V1V_BOSS_BUILD, V1V_TRAVEL_BUILD } from './campaignT3V1v';

export const V1Y_ENTRY_PATH = ['node-t3-sanctuary', 'node-t3-swamp-06', 'node-t3-jungle-04',
  'node-t3-jungle-03', 'node-t4-desert-04', 'node-t4-desert-01', 'node-t4-desert-02',
  'node-t4-desert-05', 'node-t4-mountain-05', 'node-t4-sanctuary'];
export const V1Y_FARM_PATH = ['node-t4-sanctuary', 'node-t4-mountain-05'];
const hub = V1Y_FARM_PATH[0], farm = V1Y_FARM_PATH[1];
const recovered = { type: 'fullyRecovered' as const };
export const V1Y_PURCHASES: RouteStep[] = [
  { type: 'unequip', slot: 'armor', expectedDefinitionId: 'mountain-vest-t3' },
  { type: 'evolveItem', recipeId: 'mountain-vest-t4', mode: 'evolve', stepTimeoutMs: 15000 },
  { type: 'equip', definitionIds: ['mountain-vest-t4'] },
  { type: 'unequip', slot: 'recovery', expectedDefinitionId: 'mountain-charm-t3' },
  { type: 'evolveItem', recipeId: 'mountain-charm-t4', mode: 'evolve', stepTimeoutMs: 15000 },
  { type: 'equip', definitionIds: ['mountain-charm-t4'] },
];
export const V1Y_UPGRADES: RouteStep[] = ['mountain-vest-t4', 'mountain-charm-t4'].map(definitionId =>
  ({ type: 'upgrade', definitionId, toPlus: 1, farmForMissingResources: false, stepTimeoutMs: 15000 }));
function walk(path: string[]): RouteStep[] { return [
  { type: 'configureBuild', build: V1V_TRAVEL_BUILD },
  ...path.slice(1).map(nodeId => ({ type: 'travel' as const, to: { kind: 'node' as const, nodeId }, stepTimeoutMs: 180000 })),
]; }
function rest(nodeId: string): RouteStep[] { return [
  { type: 'moveWithinNode', nodeId, position: { x: GAME_CONFIG.NODE_WIDTH / 2, y: GAME_CONFIG.NODE_HEIGHT / 2 }, stepTimeoutMs: 45000 },
  { type: 'farm', at: { kind: 'node', nodeId }, until: recovered, observeForMs: 10000, stepTimeoutMs: 180000 },
]; }
export const CAMPAIGN_T4_V1Y: Route = {
  id: 'voidwalker-mountain-entry-t4-v1y', version: '1.0.0', classRoot: 'energy-root', frameId: 'energy-heavy',
  stopOnFirstDeath: true, suppressTransitCombat: true,
  description: 'Spend the earned T4 point on Voidwalker, evolve affordable Mountain defenses, cross into T4, earn Mountain24 and qualify +1 defenses in sustained farming.',
  progressionEntry: { boundaryId: 'v1x-t4-unlocked-returned', nodeId: 'node-t3-sanctuary', tier: 4,
    revisionPolicy: 'explicit-current-revision', prerequisites: [recovered,
      { type: 'globalMasteryAtLeast', value: 120 }, { type: 'biomeLevelAtLeast', biomeGroup: 'mountain', level: 22 },
      ...['volcanic', 'tundra', 'mountain', 'cave'].map(biomeGroup => ({ type: 'bossCleared' as const, biomeGroup, tier: 3 })),
      ...['volcanic-cinderlash', 'mountain-vest-t3', 'mountain-charm-t3', 'desert-boots-t2'].flatMap(definitionId => [
        { type: 'equipped' as const, definitionId }, { type: 'itemAtLeastPlus' as const, definitionId, plus: 5 }]),
      { type: 'equipped', definitionId: 'core-accelerant' },
    ] },
  steps: [
    { type: 'unlockSkill', skillId: 'energy-heavy-t3-a', stepTimeoutMs: 15000 },
    ...V1Y_PURCHASES, { type: 'configureBuild', build: V1V_TRAVEL_BUILD }, ...rest('node-t3-sanctuary'),
    { type: 'captureCheckpoint', boundaryId: 'v1y-voidwalker-base-kit' },
    { type: 'milestone', id: 't4-entry-start' }, ...walk(V1Y_ENTRY_PATH), ...rest(hub),
    { type: 'captureCheckpoint', boundaryId: 'v1y-t4-sanctuary-arrived' },
    ...walk(V1Y_FARM_PATH), { type: 'configureBuild', build: V1V_BOSS_BUILD },
    { type: 'milestone', id: 'mountain-mastery-start' },
    { type: 'farm', at: { kind: 'node', nodeId: farm }, until: { type: 'biomeLevelAtLeast', biomeGroup: 'mountain', level: 24 },
      stepTimeoutMs: 3600000, stallAfterMs: 300000 },
    ...walk([...V1Y_FARM_PATH].reverse()), ...rest(hub),
    { type: 'captureCheckpoint', boundaryId: 'v1y-mountain24-returned' },
    { type: 'assert', condition: { type: 'globalMasteryAtLeast', value: 122 } },
    ...V1Y_UPGRADES, ...rest(hub),
    { type: 'captureCheckpoint', boundaryId: 'v1y-plus1-ready' },
    ...walk(V1Y_FARM_PATH), { type: 'configureBuild', build: V1V_BOSS_BUILD },
    { type: 'milestone', id: 'mountain-plus1-observation-start' },
    // Observation remains meaningful at the mastery cap; do not wait for new XP.
    { type: 'farm', at: { kind: 'node', nodeId: farm }, until: { type: 'elapsedMs', ms: 0 },
      observeForMs: 300000, stepTimeoutMs: 420000, stallAfterMs: 420000 },
    ...walk([...V1Y_FARM_PATH].reverse()), ...rest(hub),
    { type: 'captureCheckpoint', boundaryId: 'v1y-mountain-qualified-returned' },
  ], completion: allOf(recovered, { type: 'playerTierAtLeast', tier: 4 },
    { type: 'biomeLevelAtLeast', biomeGroup: 'mountain', level: 24 },
    ...['mountain-vest-t4', 'mountain-charm-t4'].flatMap(definitionId => [
      { type: 'equipped' as const, definitionId }, { type: 'itemAtLeastPlus' as const, definitionId, plus: 1 }])),
  milestones: [],
};
