import { GAME_CONFIG } from '@mmo-idle/shared';
import type { DesiredBuild } from '../loadout/loadout';
import { allOf, type Route, type RouteStep } from '../route/types';
import { CAMPAIGN_T4_V1Z } from './campaignT4V1z';
import { V1V_BOSS_BUILD, V1V_TRAVEL_BUILD } from './campaignT3V1v';
import { V1W_CASES } from './campaignT3V1w';
const hub = 'node-t4-sanctuary';
const recovered = { type: 'fullyRecovered' as const };
const swarm = V1W_CASES.find(c => c.group === 'jungle')!.build;
const paths = {
  mountain: [hub, 'node-t4-mountain-05', 'node-t4-mountain-04', 'node-t4-mountain-03', 'node-t4-mountain-01', 'node-t4-mountain-dungeon'],
  tundra: [hub, 'node-t4-mountain-05', 'node-t4-tundra-05'],
  trench: [hub, 'node-t4-trench-05'],
  graveyard: [hub, 'node-t4-trench-05', 'node-t4-graveyard-04', 'node-t4-graveyard-05'],
  volcanic: [hub, 'node-t4-trench-05', 'node-t4-graveyard-03', 'node-t4-volcanic-05'],
};
interface NightCase { id: string; group: keyof typeof paths; boss: boolean; relic: boolean; build: DesiredBuild; path: string[]; }
export const NIGHT3_CASES: NightCase[] = [
  ...[1, 2].flatMap(rep => [false, true].map(relic => ({
    id: `night3-mountain-${relic ? 'colossus' : 'control'}-r${rep}`, group: 'mountain' as const,
    boss: true, relic, build: V1V_BOSS_BUILD, path: paths.mountain,
  }))),
  ...(['tundra', 'trench', 'graveyard', 'volcanic'] as const).flatMap(group => [false, true].map(relic => ({
    id: `night3-${group}-${relic ? 'colossus' : 'control'}`, group,
    boss: false, relic, build: group === 'graveyard' || group === 'volcanic' ? swarm : V1V_BOSS_BUILD, path: paths[group],
  }))),
];
function walk(path: string[]): RouteStep[] { return path.slice(1).map(nodeId =>
  ({ type: 'travel', to: { kind: 'node', nodeId }, stepTimeoutMs: 180000 })); }
function rest(): RouteStep[] { return [
  { type: 'moveWithinNode', nodeId: hub, position: { x: GAME_CONFIG.NODE_WIDTH / 2, y: GAME_CONFIG.NODE_HEIGHT / 2 }, stepTimeoutMs: 45000 },
  { type: 'farm', at: { kind: 'node', nodeId: hub }, until: recovered, observeForMs: 10000, stepTimeoutMs: 180000 },
]; }
export const CAMPAIGN_T4_NIGHT3_ROUTES: Route[] = NIGHT3_CASES.map(c => {
  const victory = { type: 'bossCleared' as const, biomeGroup: 'mountain', tier: 4 };
  return { ...CAMPAIGN_T4_V1Z, id: c.id,
    description: `Night3 independent ${c.group} ${c.boss ? 'boss attempt' : '15-minute farming'}; ${c.relic ? 'ordinary Colossus Heart purchase' : 'empty relic control'}; fixed +2 kit, no adaptive changes.`,
    progressionEntry: { ...CAMPAIGN_T4_V1Z.progressionEntry!, boundaryId: 'v1z-plus2-prepared-returned', prerequisites: [
      recovered, { type: 'globalMasteryAtLeast', value: 132 },
      ...['mountain-vest-t4', 'mountain-charm-t4'].flatMap(definitionId => [
        { type: 'equipped' as const, definitionId }, { type: 'itemAtLeastPlus' as const, definitionId, plus: 2 }]),
      { type: 'not', of: victory },
    ] },
    steps: [
      ...(c.relic ? [
        { type: 'craft' as const, recipeIds: ['relic-colossus-heart'], stepTimeoutMs: 15000 },
        { type: 'equip' as const, definitionIds: ['relic-colossus-heart'] },
        { type: 'assert' as const, condition: { type: 'equipped' as const, definitionId: 'relic-colossus-heart' } },
      ] : []),
      { type: 'configureBuild', build: V1V_TRAVEL_BUILD }, ...rest(),
      { type: 'captureCheckpoint', boundaryId: `${c.id}-ready` },
      { type: 'milestone', id: 'approach-start' }, ...walk(c.path),
      { type: 'milestone', id: 'target-arrival' }, { type: 'configureBuild', build: c.build },
      { type: 'milestone', id: 'measurement-start' },
      ...(c.boss ? [
        { type: 'attemptBoss' as const, biomeGroup: 'mountain', tier: 4, maxAttempts: 1, stepTimeoutMs: 720000 },
        { type: 'assert' as const, condition: victory }, { type: 'milestone' as const, id: 'boss-defeated' },
      ] : [
        { type: 'farm' as const, at: { kind: 'node' as const, nodeId: c.path.at(-1)! }, until: { type: 'elapsedMs' as const, ms: 0 },
          observeForMs: 900000, stepTimeoutMs: 1020000, stallAfterMs: 1020000 },
      ]),
      { type: 'milestone', id: 'measurement-end' },
      { type: 'configureBuild', build: V1V_TRAVEL_BUILD },
      { type: 'milestone', id: 'return-start' }, ...walk([...c.path].reverse()), ...rest(),
      { type: 'captureCheckpoint', boundaryId: `${c.id}-returned` },
    ], completion: c.boss ? allOf(recovered, victory) : recovered,
  };
});
