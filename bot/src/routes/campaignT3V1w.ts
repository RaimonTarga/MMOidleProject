import { GAME_CONFIG } from '@mmo-idle/shared';
import type { DesiredBuild } from '../loadout/loadout';
import { allOf, type Route, type RouteStep } from '../route/types';
import { CAMPAIGN_T3_V1V, V1V_BOSS_BUILD, V1V_TRAVEL_BUILD } from './campaignT3V1v';
const hub = 'node-t3-sanctuary';
const east = [hub, 'node-t3-swamp-05', 'node-t3-swamp-04', 'node-t3-desert-05'];
const cave = [...east, 'node-t3-cave-05', 'node-t3-cave-04'];
const paths = {
  mountain: [...cave, 'node-t3-mountain-02', 'node-t3-mountain-01', 'node-t3-mountain-dungeon'],
  cave: [...cave, 'node-t3-mountain-02', 'node-t3-cave-02', 'node-t3-cave-01', 'node-t3-cave-dungeon'],
  swamp: [...east, 'node-t3-desert-04', 'node-t3-swamp-01', 'node-t3-swamp-dungeon'],
  desert: [...cave, 'node-t3-cave-03', 'node-t3-desert-01', 'node-t3-desert-dungeon'],
  jungle: [hub, 'node-t3-swamp-06', 'node-t3-jungle-04', 'node-t3-jungle-03', 'node-t3-jungle-02', 'node-t3-jungle-01', 'node-t3-jungle-dungeon'],
};
export const V1W_CASES = Object.entries(paths).map(([group, path]) => {
  const build: DesiredBuild = group === 'swamp' ? { ...V1V_BOSS_BUILD,
    abilities: { techniques: ['frenzy', 'sweep'], guards: ['second-wind', 'brace', 'cleanse'] } }
    : group === 'jungle' ? { ...V1V_BOSS_BUILD,
      abilities: { techniques: ['frenzy', 'sweep', 'hamstring'], guards: ['second-wind', 'cleanse'] } }
    : V1V_BOSS_BUILD;
  return { group, path, build };
});
function walk(path: string[]): RouteStep[] { return path.slice(1).map(nodeId =>
  ({ type: 'travel', to: { kind: 'node', nodeId }, stepTimeoutMs: 180000 })); }
export const CAMPAIGN_T3_V1W_ROUTES: Route[] = V1W_CASES.map(({ group, path, build }) => {
  const victory = { type: 'bossCleared' as const, biomeGroup: group, tier: 3 };
  const recovered = { type: 'fullyRecovered' as const };
  return { ...CAMPAIGN_T3_V1V, id: `spirit-${group}-boss-t3-v1w`,
    description: `Remaining T3 coverage: ${group}, one ordinary attempt from the same two-seal checkpoint; leave the earned T4 skill point unspent.`,
    progressionEntry: { ...CAMPAIGN_T3_V1V.progressionEntry!, boundaryId: 'v1v-tundra-cleared-returned',
      prerequisites: [...CAMPAIGN_T3_V1V.progressionEntry!.prerequisites.filter(c => c.type !== 'not'),
        { type: 'bossCleared', biomeGroup: 'tundra', tier: 3 }, { type: 'not', of: victory }] },
    steps: [
      { type: 'configureBuild', build }, { type: 'captureCheckpoint', boundaryId: `v1w-${group}-ready` },
      { type: 'configureBuild', build: V1V_TRAVEL_BUILD }, { type: 'milestone', id: 'approach-start' }, ...walk(path),
      { type: 'milestone', id: 'dungeon-arrival' }, { type: 'configureBuild', build },
      { type: 'attemptBoss', biomeGroup: group, tier: 3, maxAttempts: 1, stepTimeoutMs: 720000 },
      { type: 'assert', condition: victory }, { type: 'milestone', id: 'boss-defeated' },
      { type: 'assert', condition: { type: 'playerTierAtLeast', tier: 4 } },
      { type: 'configureBuild', build: V1V_TRAVEL_BUILD }, { type: 'milestone', id: 'return-start' }, ...walk([...path].reverse()),
      { type: 'moveWithinNode', nodeId: hub, position: { x: GAME_CONFIG.NODE_WIDTH / 2, y: GAME_CONFIG.NODE_HEIGHT / 2 }, stepTimeoutMs: 45000 },
      { type: 'farm', at: { kind: 'node', nodeId: hub }, until: recovered, observeForMs: 10000, stepTimeoutMs: 60000 },
      { type: 'captureCheckpoint', boundaryId: `v1w-${group}-cleared-returned` }, { type: 'assert', condition: recovered },
    ], completion: allOf(victory, recovered, { type: 'playerTierAtLeast', tier: 4 }),
  };
});
