import { GAME_CONFIG } from '@mmo-idle/shared';
import type { DesiredBuild } from '../loadout/loadout';
import type { Route, RouteStep } from '../route/types';
import { NIGHT2_TRAVEL_BUILD } from './campaignNight2Bridge';
import { V1P_TUNDRA_BUILD } from './campaignT3V1p';
import { CAMPAIGN_T3_V1U_PREP, CAMPAIGN_T3_V1U_BOSS, V1U_PURCHASES, V1U_FINAL_UPGRADES, V1U_BOSS_BUILD } from './campaignT3V1u';

export const V1U2_PURCHASES: RouteStep[] = V1U_PURCHASES.map(step => step.type === 'upgrade' && step.toPlus === 2 ? { ...step, toPlus: 3 } : step);
export const V1U2_PRE_TUNDRA_UPGRADES: RouteStep[] = V1U_FINAL_UPGRADES.map(step => step.type === 'upgrade' ? { ...step, toPlus: 4 } : step);

const hub = 'node-t3-sanctuary';
export const V1U2_TRAVEL_BUILD: DesiredBuild = { ...NIGHT2_TRAVEL_BUILD,
  abilities: { techniques: ['sweep', 'hamstring'], guards: ['second-wind', 'brace'] } };
// Every hop is adjacent, in both directions. Do not replace with biome pick:first.
export const V1U2_PATHS = {
  jungle: [hub, 'node-t3-jungle-05'],
  desert: [hub, 'node-t3-swamp-05', 'node-t3-swamp-04', 'node-t3-desert-05'],
  tundra: [hub, 'node-t3-swamp-06', 'node-t3-tundra-05'],
};
function walk(path: string[]): RouteStep[] {
  return [{ type: 'configureBuild', build: V1U2_TRAVEL_BUILD },
    ...path.slice(1).map(nodeId => ({ type: 'travel' as const, to: { kind: 'node' as const, nodeId }, stepTimeoutMs: 180000 }))];
}
function rest(): RouteStep[] { return [
  { type: 'moveWithinNode', nodeId: hub, position: { x: GAME_CONFIG.NODE_WIDTH / 2, y: GAME_CONFIG.NODE_HEIGHT / 2 }, stepTimeoutMs: 45000 },
  { type: 'farm', at: { kind: 'node', nodeId: hub }, until: { type: 'fullyRecovered' }, observeForMs: 10000, stepTimeoutMs: 60000 },
]; }
function leg(group: keyof typeof V1U2_PATHS, level: number): RouteStep[] {
  const path = V1U2_PATHS[group];
  return [...walk(path), { type: 'configureBuild', build: V1P_TUNDRA_BUILD },
    { type: 'farm', at: { kind: 'node', nodeId: path.at(-1)! }, until: { type: 'biomeLevelAtLeast', biomeGroup: group, level }, stepTimeoutMs: 1800000, stallAfterMs: 300000 },
    ...walk([...path].reverse()), ...rest(), { type: 'captureCheckpoint', boundaryId: `v1u2-mastery-${group}` }];
}
export const CAMPAIGN_T3_V1U2_PREP: Route = {
  ...CAMPAIGN_T3_V1U_PREP, id: 'spirit-volcano-preparation-t3-v1u2',
  description: 'Resume safe GM96 checkpoint; adjacent Jungle, explicit Desert detour avoiding Tundra, then deliberate Tundra farming after gearing.',
  progressionEntry: { boundaryId: 'v1u-mastery-mountain', nodeId: hub, tier: 3, revisionPolicy: 'explicit-current-revision',
    prerequisites: [...CAMPAIGN_T3_V1U_PREP.progressionEntry!.prerequisites,
      ...['mountain', 'swamp', 'cave'].map(biomeGroup => ({ type: 'biomeLevelAtLeast' as const, biomeGroup, level: 18 })),
      { type: 'globalMasteryAtLeast', value: 96 }] },
  steps: [...leg('jungle', 12), ...V1U2_PURCHASES, ...rest(),
    { type: 'captureCheckpoint', boundaryId: 'v1u2-intermediate-kit' },
    ...leg('desert', 12), ...V1U2_PRE_TUNDRA_UPGRADES, ...rest(),
    { type: 'captureCheckpoint', boundaryId: 'v1u2-pre-tundra-upgraded' },
    ...leg('tundra', 6),
    { type: 'assert', condition: { type: 'globalMasteryAtLeast', value: 114 } },
    ...V1U_FINAL_UPGRADES, ...rest(), { type: 'configureBuild', build: V1U_BOSS_BUILD },
    { type: 'assert', condition: CAMPAIGN_T3_V1U_PREP.completion },
    { type: 'captureCheckpoint', boundaryId: 'v1u2-tempo-barrier-prepared' }],
};
export const CAMPAIGN_T3_V1U2_BOSS: Route = {
  ...CAMPAIGN_T3_V1U_BOSS, id: 'spirit-volcano-tempo-barrier-t3-v1u2',
  progressionEntry: { ...CAMPAIGN_T3_V1U_BOSS.progressionEntry!, boundaryId: 'v1u2-tempo-barrier-prepared' },
  steps: CAMPAIGN_T3_V1U_BOSS.steps.map(step => step.type === 'captureCheckpoint'
    ? { ...step, boundaryId: step.boundaryId.replace('v1u-', 'v1u2-') } : step),
};
export const CAMPAIGN_T3_V1U2_ROUTES = [CAMPAIGN_T3_V1U2_PREP, CAMPAIGN_T3_V1U2_BOSS];
