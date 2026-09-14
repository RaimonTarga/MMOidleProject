import { GAME_CONFIG } from '@mmo-idle/shared';
import { allOf, type Route, type RouteStep } from '../route/types';
import { V1V_BOSS_BUILD, V1V_TRAVEL_BUILD } from './campaignT3V1v';
import { V1W_CASES } from './campaignT3V1w';
const hub = 'node-t4-sanctuary';
const recovered = { type: 'fullyRecovered' as const };
export const V1Z_LEGS = [
  { group: 'jungle', path: [hub, 'node-t4-jungle-05'], build: V1W_CASES.find(c => c.group === 'jungle')!.build },
  { group: 'desert', path: [hub, 'node-t4-mountain-05', 'node-t4-desert-05'], build: V1V_BOSS_BUILD },
];
export const V1Z_UPGRADES: RouteStep[] = ['mountain-vest-t4', 'mountain-charm-t4'].map(definitionId =>
  ({ type: 'upgrade', definitionId, toPlus: 2, farmForMissingResources: false, stepTimeoutMs: 15000 }));
function walk(path: string[]): RouteStep[] { return [
  { type: 'configureBuild', build: V1V_TRAVEL_BUILD },
  ...path.slice(1).map(nodeId => ({ type: 'travel' as const, to: { kind: 'node' as const, nodeId }, stepTimeoutMs: 180000 })),
]; }
function rest(): RouteStep[] { return [
  { type: 'moveWithinNode', nodeId: hub, position: { x: GAME_CONFIG.NODE_WIDTH / 2, y: GAME_CONFIG.NODE_HEIGHT / 2 }, stepTimeoutMs: 45000 },
  { type: 'farm', at: { kind: 'node', nodeId: hub }, until: recovered, observeForMs: 10000, stepTimeoutMs: 180000 },
]; }
export const CAMPAIGN_T4_V1Z: Route = {
  id: 'voidwalker-jungle-desert-t4-v1z', version: '1.0.0', classRoot: 'energy-root', frameId: 'energy-heavy',
  stopOnFirstDeath: true, suppressTransitCombat: true,
  description: 'Qualify natural T4 Jungle and Desert farming, earn their mastery18 caps and buy +2 Mountain defenses at GM132; no bosses.',
  progressionEntry: { boundaryId: 'v1y-mountain-qualified-returned', nodeId: hub, tier: 4,
    revisionPolicy: 'explicit-current-revision', prerequisites: [recovered,
      { type: 'globalMasteryAtLeast', value: 124 }, { type: 'biomeLevelAtLeast', biomeGroup: 'mountain', level: 24 },
      ...['mountain-vest-t4', 'mountain-charm-t4'].flatMap(definitionId => [
        { type: 'equipped' as const, definitionId }, { type: 'itemAtLeastPlus' as const, definitionId, plus: 1 }]),
      ...['volcanic-cinderlash', 'desert-boots-t2'].flatMap(definitionId => [
        { type: 'equipped' as const, definitionId }, { type: 'itemAtLeastPlus' as const, definitionId, plus: 5 }]),
      { type: 'equipped', definitionId: 'core-accelerant' },
    ] },
  steps: [
    { type: 'configureBuild', build: V1V_TRAVEL_BUILD },
    { type: 'captureCheckpoint', boundaryId: 'v1z-two-biome-ready' },
    ...V1Z_LEGS.flatMap(({ group, path, build }): RouteStep[] => [
      { type: 'milestone', id: `${group}-approach-start` }, ...walk(path),
      { type: 'configureBuild', build }, { type: 'milestone', id: `${group}-mastery-start` },
      { type: 'farm', at: { kind: 'node', nodeId: path.at(-1)! }, until: { type: 'biomeLevelAtLeast', biomeGroup: group, level: 18 },
        stepTimeoutMs: 1800000, stallAfterMs: 300000 },
      { type: 'milestone', id: `${group}-observation-start` },
      { type: 'farm', at: { kind: 'node', nodeId: path.at(-1)! }, until: { type: 'elapsedMs', ms: 0 },
        observeForMs: 300000, stepTimeoutMs: 420000, stallAfterMs: 420000 },
      ...walk([...path].reverse()), ...rest(),
      { type: 'captureCheckpoint', boundaryId: `v1z-${group}-qualified-returned` },
    ]),
    { type: 'assert', condition: { type: 'globalMasteryAtLeast', value: 132 } },
    ...V1Z_UPGRADES, ...rest(),
    { type: 'captureCheckpoint', boundaryId: 'v1z-plus2-prepared-returned' },
  ], completion: allOf(recovered, { type: 'globalMasteryAtLeast', value: 132 },
    ...['jungle', 'desert'].map(biomeGroup => ({ type: 'biomeLevelAtLeast' as const, biomeGroup, level: 18 })),
    ...['mountain-vest-t4', 'mountain-charm-t4'].flatMap(definitionId => [
      { type: 'equipped' as const, definitionId }, { type: 'itemAtLeastPlus' as const, definitionId, plus: 2 }])),
  milestones: [],
};
