import { GAME_CONFIG } from '@mmo-idle/shared';
import { allOf, type Route, type RouteStep } from '../route/types';
import { CAMPAIGN_T3_V1W_ROUTES, V1W_CASES } from './campaignT3V1w';
import { V1V_BOSS_BUILD, V1V_TRAVEL_BUILD } from './campaignT3V1v';

const hub = 'node-t3-sanctuary';
const recovered = { type: 'fullyRecovered' as const };
const tier4 = { type: 'playerTierAtLeast' as const, tier: 4 };
export const V1X_LEGS = ['mountain', 'cave'].map(group => V1W_CASES.find(c => c.group === group)!);
function walk(path: string[]): RouteStep[] {
  return path.slice(1).map(nodeId => ({ type: 'travel', to: { kind: 'node', nodeId }, stepTimeoutMs: 180000 }));
}
export const CAMPAIGN_T3_V1X: Route = {
  ...CAMPAIGN_T3_V1W_ROUTES[0], id: 'spirit-t4-handoff-v1x',
  description: 'Earn Mountain and Cave seals sequentially from the two-seal Tundra return, then capture the recovered T4 unlock with its skill point unspent.',
  progressionEntry: { ...CAMPAIGN_T3_V1W_ROUTES[0].progressionEntry!, prerequisites: [
    ...CAMPAIGN_T3_V1W_ROUTES[0].progressionEntry!.prerequisites,
    { type: 'not', of: { type: 'bossCleared', biomeGroup: 'cave', tier: 3 } },
  ] },
  steps: [
    { type: 'configureBuild', build: V1V_BOSS_BUILD },
    { type: 'captureCheckpoint', boundaryId: 'v1x-two-seal-ready' },
    ...V1X_LEGS.flatMap(({ group, path }, index): RouteStep[] => [
      { type: 'configureBuild', build: V1V_TRAVEL_BUILD },
      { type: 'milestone', id: `${group}-approach-start` }, ...walk(path),
      { type: 'milestone', id: `${group}-dungeon-arrival` },
      { type: 'configureBuild', build: V1V_BOSS_BUILD },
      { type: 'attemptBoss', biomeGroup: group, tier: 3, maxAttempts: 1, stepTimeoutMs: 720000 },
      { type: 'assert', condition: { type: 'bossCleared', biomeGroup: group, tier: 3 } },
      { type: 'milestone', id: `${group}-boss-defeated` },
      // T3 requires FOUR seals: Mountain is the third; Cave is the fourth.
      { type: 'assert', condition: index === 0 ? { type: 'not', of: tier4 } : tier4 },
      { type: 'configureBuild', build: V1V_TRAVEL_BUILD },
      { type: 'milestone', id: `${group}-return-start` }, ...walk([...path].reverse()),
      { type: 'moveWithinNode', nodeId: hub, position: { x: GAME_CONFIG.NODE_WIDTH / 2, y: GAME_CONFIG.NODE_HEIGHT / 2 }, stepTimeoutMs: 45000 },
      { type: 'farm', at: { kind: 'node', nodeId: hub }, until: recovered, observeForMs: 10000, stepTimeoutMs: 60000 },
      { type: 'captureCheckpoint', boundaryId: index === 0 ? 'v1x-mountain-three-seal-returned' : 'v1x-t4-unlocked-returned' },
      { type: 'assert', condition: recovered },
    ]),
  ], completion: allOf(recovered, tier4,
    ...V1X_LEGS.map(({ group }) => ({ type: 'bossCleared' as const, biomeGroup: group, tier: 3 }))),
};
