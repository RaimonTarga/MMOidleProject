import { GAME_CONFIG } from '@mmo-idle/shared';
import { allOf, type Route } from '../route/types';
import type { DesiredBuild } from '../loadout/loadout';
import { NIGHT2_TRAVEL_BUILD } from './campaignNight2Bridge';
import { V1P_TUNDRA_BUILD } from './campaignT3V1p';

export const V1R_BUILDS: Record<string, DesiredBuild> = {
  control: { ...NIGHT2_TRAVEL_BUILD, runeRules: NIGHT2_TRAVEL_BUILD.runeRules.filter(r => r.conditionId !== 'while-traveling') },
  focus: { ...NIGHT2_TRAVEL_BUILD, runeRules: [
    ...NIGHT2_TRAVEL_BUILD.runeRules.filter(r => r.conditionId !== 'while-traveling'),
    { conditionId: 'in-combat', actionId: 'focus-lowest-hp' },
  ] },
  pursuit: V1P_TUNDRA_BUILD,
};
const hub = { kind: 'node' as const, nodeId: 'node-t3-sanctuary' };
const target = { kind: 'node' as const, nodeId: 'node-t3-volcanic-01' };
const recovered = { type: 'fullyRecovered' as const };
export const CAMPAIGN_T3_V1R_ROUTES: Route[] = Object.entries(V1R_BUILDS).map(([arm, build]) => ({
  id: `spirit-volcano-${arm}-t3-v1r`, version: '1.0.0', classRoot: 'energy-root', frameId: 'energy-heavy',
  stopOnFirstDeath: true, suppressTransitCombat: true,
  progressionEntry: { boundaryId: 'pre-volcano-rested', nodeId: hub.nodeId, tier: 3,
    revisionPolicy: 'explicit-current-revision', prerequisites: [{ type: 'playerTierAtLeast', tier: 3 }, recovered] },
  description: `V1r ${arm}: named Wisp restore, ordinary paid preparation, natural Volcano 60-second observation and bounded return.`,
  steps: [
    { type: 'configureBuild', build: NIGHT2_TRAVEL_BUILD },
    ...(arm === 'focus' ? [{ type: 'craftRune' as const, recipeId: 'rune-recipe-focus-lowest-hp', stepTimeoutMs: 15000 }] : []),
    ...(arm === 'pursuit' ? [
      { type: 'learnAbility' as const, recipeId: 'ability-recipe-hamstring', abilityId: 'hamstring', slot: 'technique' as const, attune: false, stepTimeoutMs: 15000 },
      { type: 'assert' as const, condition: { type: 'canCraft' as const, recipeId: 'desert-boots-t2' } },
      { type: 'craft' as const, recipeIds: ['desert-boots-t2'], stepTimeoutMs: 15000 },
      { type: 'upgrade' as const, definitionId: 'desert-boots-t2', toPlus: 5, farmForMissingResources: false, stepTimeoutMs: 30000 },
      { type: 'equip' as const, definitionIds: ['desert-boots-t2'] },
      { type: 'assert' as const, condition: { type: 'itemAtLeastPlus' as const, definitionId: 'desert-boots-t2', plus: 5 } },
      { type: 'assert' as const, condition: { type: 'equipped' as const, definitionId: 'desert-boots-t2' } },
    ] : []),
    { type: 'configureBuild', build },
    { type: 'captureCheckpoint', boundaryId: `v1r-${arm}-prepared` },
    { type: 'configureBuild', build: NIGHT2_TRAVEL_BUILD },
    { type: 'milestone', id: 'approach-start' },
    { type: 'travel', to: target, stepTimeoutMs: 180000 },
    { type: 'milestone', id: 'target-arrival' },
    { type: 'configureBuild', build },
    { type: 'milestone', id: 'measurement-start' },
    { type: 'farm', at: target, until: { type: 'elapsedMs', ms: 0 }, observeForMs: 60000, stepTimeoutMs: 75000 },
    { type: 'milestone', id: 'measurement-end' },
    { type: 'configureBuild', build: NIGHT2_TRAVEL_BUILD },
    { type: 'milestone', id: 'return-start' },
    { type: 'travel', to: hub, stepTimeoutMs: 180000 },
    { type: 'moveWithinNode', nodeId: hub.nodeId, position: { x: GAME_CONFIG.NODE_WIDTH / 2, y: GAME_CONFIG.NODE_HEIGHT / 2 }, stepTimeoutMs: 45000 },
    { type: 'farm', at: hub, until: recovered, observeForMs: 10000, stepTimeoutMs: 60000 },
    { type: 'captureCheckpoint', boundaryId: `v1r-${arm}-returned` },
    { type: 'assert', condition: recovered },
  ],
  completion: allOf({ type: 'playerTierAtLeast', tier: 3 }, recovered), milestones: [],
}));
