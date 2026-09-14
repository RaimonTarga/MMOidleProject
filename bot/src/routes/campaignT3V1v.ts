import { GAME_CONFIG } from '@mmo-idle/shared';
import type { DesiredBuild } from '../loadout/loadout';
import { allOf, type Route, type RouteStep } from '../route/types';
import { V1U_BOSS_BUILD } from './campaignT3V1u';
import { V1U2_TRAVEL_BUILD } from './campaignT3V1u2';

export const V1V_BOSS_BUILD: DesiredBuild = { ...V1U_BOSS_BUILD,
  abilities: { techniques: ['frenzy', 'hamstring'], guards: ['second-wind', 'brace', 'cleanse', 'break-free'] } };
export const V1V_TRAVEL_BUILD: DesiredBuild = { ...V1U2_TRAVEL_BUILD,
  abilities: { techniques: ['sweep', 'hamstring'], guards: ['second-wind', 'brace', 'cleanse', 'break-free'] } };
export const V1V_PATH = ['node-t3-sanctuary', 'node-t3-swamp-05', 'node-t3-swamp-04',
  'node-t3-desert-05', 'node-t3-cave-05', 'node-t3-cave-04', 'node-t3-mountain-02',
  'node-t3-mountain-01', 'node-t3-mountain-05', 'node-t3-tundra-dungeon'];
const hub = V1V_PATH[0];
const recovered = { type: 'fullyRecovered' as const };
const victory = { type: 'bossCleared' as const, biomeGroup: 'tundra', tier: 3 };
function walk(path: string[]): RouteStep[] {
  return path.slice(1).map(nodeId => ({ type: 'travel', to: { kind: 'node', nodeId }, stepTimeoutMs: 180000 }));
}
export const CAMPAIGN_T3_V1V: Route = {
  id: 'spirit-tundra-boss-t3-v1v', version: '1.0.0', classRoot: 'energy-root', frameId: 'energy-heavy',
  stopOnFirstDeath: true, suppressTransitCombat: true,
  description: 'Earn Break Free from the first Volcano returned checkpoint; retain tempo/barrier gear, counter Chill/Freeze and attempt Tundra once with audited travel.',
  progressionEntry: { boundaryId: 'v1u2-volcano-cleared-returned', nodeId: hub, tier: 3,
    revisionPolicy: 'explicit-current-revision', prerequisites: [recovered,
      { type: 'globalMasteryAtLeast', value: 114 }, { type: 'bossCleared', biomeGroup: 'volcanic', tier: 3 },
      { type: 'not', of: victory },
      ...['volcanic-cinderlash', 'mountain-vest-t3', 'mountain-charm-t3'].flatMap(definitionId => [
        { type: 'equipped' as const, definitionId }, { type: 'itemAtLeastPlus' as const, definitionId, plus: 5 }]),
      { type: 'equipped', definitionId: 'core-accelerant' }, { type: 'equipped', definitionId: 'desert-boots-t2' }] },
  steps: [
    { type: 'learnAbility', recipeId: 'ability-recipe-break-free', abilityId: 'break-free', slot: 'guard', attune: false, stepTimeoutMs: 15000 },
    { type: 'configureBuild', build: V1V_BOSS_BUILD },
    { type: 'captureCheckpoint', boundaryId: 'v1v-tundra-ready' },
    { type: 'configureBuild', build: V1V_TRAVEL_BUILD },
    { type: 'milestone', id: 'approach-start' }, ...walk(V1V_PATH),
    { type: 'milestone', id: 'dungeon-arrival' },
    { type: 'configureBuild', build: V1V_BOSS_BUILD },
    { type: 'milestone', id: 'dungeon-attempt-start' },
    { type: 'attemptBoss', biomeGroup: 'tundra', tier: 3, maxAttempts: 1, stepTimeoutMs: 720000 },
    { type: 'assert', condition: victory }, { type: 'milestone', id: 'boss-defeated' },
    { type: 'configureBuild', build: V1V_TRAVEL_BUILD },
    { type: 'milestone', id: 'return-start' }, ...walk([...V1V_PATH].reverse()),
    { type: 'moveWithinNode', nodeId: hub, position: { x: GAME_CONFIG.NODE_WIDTH / 2, y: GAME_CONFIG.NODE_HEIGHT / 2 }, stepTimeoutMs: 45000 },
    { type: 'farm', at: { kind: 'node', nodeId: hub }, until: recovered, observeForMs: 10000, stepTimeoutMs: 60000 },
    { type: 'captureCheckpoint', boundaryId: 'v1v-tundra-cleared-returned' },
    { type: 'assert', condition: recovered },
  ], completion: allOf(victory, recovered), milestones: [],
};
