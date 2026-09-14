import { GAME_CONFIG } from '@mmo-idle/shared';
import type { Route } from '../route/types';
import { NIGHT2_TRAVEL_BUILD } from './campaignNight2Bridge';
import { V1P_TUNDRA_BUILD } from './campaignT3V1p';

const hub = { kind: 'node' as const, nodeId: 'node-t3-sanctuary' };
const dungeon = { kind: 'dungeon' as const, biomeGroup: 'volcanic', tier: 3 };
const recovered = { type: 'fullyRecovered' as const };
const victory = { type: 'bossCleared' as const, biomeGroup: 'volcanic', tier: 3 };

/** First Volcano dungeon validation from the paid, pre-farming V1s kit. */
export const CAMPAIGN_T3_V1T: Route = {
  id: 'spirit-volcano-boss-t3-v1t', version: '1.0.0', classRoot: 'energy-root', frameId: 'energy-heavy',
  stopOnFirstDeath: true, suppressTransitCombat: true,
  progressionEntry: { boundaryId: 'v1s-pursuit-prepared', nodeId: hub.nodeId, tier: 3,
    revisionPolicy: 'explicit-current-revision', prerequisites: [recovered, { type: 'not', of: victory },
      { type: 'equipped', definitionId: 'desert-boots-t2' }, { type: 'itemAtLeastPlus', definitionId: 'desert-boots-t2', plus: 5 },
      { type: 'abilityKnown', abilityId: 'hamstring' }] },
  description: 'Prepared Wisp pursuit kit: ordinary Volcano guardian clear and one boss attempt, then recovered return if victorious. No farming prefix or purchases.',
  steps: [
    { type: 'configureBuild', build: V1P_TUNDRA_BUILD },
    { type: 'captureCheckpoint', boundaryId: 'v1t-boss-ready' },
    { type: 'configureBuild', build: NIGHT2_TRAVEL_BUILD },
    { type: 'milestone', id: 'approach-start' },
    { type: 'travel', to: dungeon, stepTimeoutMs: 180000 },
    { type: 'milestone', id: 'dungeon-arrival' },
    { type: 'configureBuild', build: V1P_TUNDRA_BUILD },
    { type: 'milestone', id: 'dungeon-attempt-start' },
    { type: 'attemptBoss', biomeGroup: 'volcanic', tier: 3, maxAttempts: 1, stepTimeoutMs: 720000 },
    { type: 'assert', condition: victory },
    { type: 'milestone', id: 'boss-defeated' },
    { type: 'configureBuild', build: NIGHT2_TRAVEL_BUILD },
    { type: 'milestone', id: 'return-start' },
    { type: 'travel', to: hub, stepTimeoutMs: 180000 },
    { type: 'moveWithinNode', nodeId: hub.nodeId, position: { x: GAME_CONFIG.NODE_WIDTH / 2, y: GAME_CONFIG.NODE_HEIGHT / 2 }, stepTimeoutMs: 45000 },
    { type: 'farm', at: hub, until: recovered, observeForMs: 10000, stepTimeoutMs: 60000 },
    { type: 'captureCheckpoint', boundaryId: 'v1t-volcano-cleared-returned' },
    { type: 'assert', condition: recovered },
  ],
  completion: { type: 'allOf', of: [victory, recovered] }, milestones: [],
};
