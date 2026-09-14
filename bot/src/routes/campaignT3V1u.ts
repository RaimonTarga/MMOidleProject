import { GAME_CONFIG } from '@mmo-idle/shared';
import type { DesiredBuild } from '../loadout/loadout';
import { allOf, type Route, type RouteStep } from '../route/types';
import { CAMPAIGN_T3_V1T } from './campaignT3V1t';
import { V1P_TUNDRA_BUILD } from './campaignT3V1p';
import { NIGHT2_TRAVEL_BUILD } from './campaignNight2Bridge';

const hub = { kind: 'node' as const, nodeId: 'node-t3-sanctuary' };
const recovered = { type: 'fullyRecovered' as const };
const victory = { type: 'bossCleared' as const, biomeGroup: 'volcanic', tier: 3 };
export const V1U_BOSS_BUILD: DesiredBuild = {
  ...V1P_TUNDRA_BUILD,
  abilities: { techniques: ['frenzy', 'sweep', 'hamstring'], guards: ['second-wind', 'brace'] },
  stances: { attuned: ['offensive-stance'], default: 'offensive-stance' },
};
export const V1U_AFFLICTION_BUILD: DesiredBuild = {
  ...V1P_TUNDRA_BUILD,
  abilities: { techniques: ['sweep'], guards: ['second-wind', 'brace', 'cleanse'] },
};
const returnRested: RouteStep[] = [
  { type: 'configureBuild', build: NIGHT2_TRAVEL_BUILD },
  { type: 'travel', to: hub, stepTimeoutMs: 300000 },
  { type: 'moveWithinNode', nodeId: hub.nodeId, position: { x: GAME_CONFIG.NODE_WIDTH / 2, y: GAME_CONFIG.NODE_HEIGHT / 2 }, stepTimeoutMs: 45000 },
  { type: 'farm', at: hub, until: recovered, observeForMs: 10000, stepTimeoutMs: 60000 },
];
export const V1U_PURCHASES: RouteStep[] = [
  { type: 'learnAbility', recipeId: 'ability-recipe-frenzy', abilityId: 'frenzy', slot: 'technique', attune: false },
  { type: 'craft', recipeIds: ['volcanic-cinderlash', 'core-accelerant'] },
  { type: 'evolveItem', recipeId: 'mountain-vest-t2', mode: 'evolve' },
  { type: 'upgrade', definitionId: 'mountain-vest-t2', toPlus: 5, farmForMissingResources: false },
  { type: 'evolveItem', recipeId: 'mountain-vest-t3', mode: 'evolve' },
  { type: 'unequip', slot: 'recovery', expectedDefinitionId: 'mountain-charm-t2' },
  { type: 'evolveItem', recipeId: 'mountain-charm-t3', mode: 'evolve' },
  ...['volcanic-cinderlash', 'mountain-vest-t3', 'mountain-charm-t3'].map(definitionId =>
    ({ type: 'upgrade' as const, definitionId, toPlus: 2, farmForMissingResources: false })),
  { type: 'equip', definitionIds: ['volcanic-cinderlash', 'mountain-vest-t3', 'mountain-charm-t3', 'core-accelerant', 'desert-boots-t2'] },
];
const prepared = allOf(recovered, { type: 'not', of: victory },
  { type: 'biomeLevelAtLeast', biomeGroup: 'jungle', level: 12 },
  { type: 'biomeLevelAtLeast', biomeGroup: 'mountain', level: 16 },
  { type: 'globalMasteryAtLeast', value: 114 },
  ...['volcanic-cinderlash', 'mountain-vest-t3', 'mountain-charm-t3'].flatMap(definitionId => [
    { type: 'equipped' as const, definitionId }, { type: 'itemAtLeastPlus' as const, definitionId, plus: 5 },
  ]), { type: 'equipped', definitionId: 'core-accelerant' },
  { type: 'equipped', definitionId: 'desert-boots-t2' },
  { type: 'abilityKnown', abilityId: 'frenzy' });

export const V1U_EARLY_MASTERY = [{ group: 'mountain', level: 18 }, { group: 'jungle', level: 12 }];
export const V1U_LATE_MASTERY = [{ group: 'swamp', level: 18 }, { group: 'cave', level: 18 }, { group: 'desert', level: 12 }, { group: 'tundra', level: 6 }];
export const V1U_FINAL_UPGRADES: RouteStep[] = ['volcanic-cinderlash', 'mountain-vest-t3', 'mountain-charm-t3'].map(definitionId =>
  ({ type: 'upgrade', definitionId, toPlus: 5, farmForMissingResources: false }));

/** Earn gates and purchases once; never consume a combat-outcome-selected state. */
export const CAMPAIGN_T3_V1U_PREP: Route = {
  ...CAMPAIGN_T3_V1T, id: 'spirit-volcano-preparation-t3-v1u',
  description: 'Earn full T3 mastery, buy and fully upgrade the tempo/barrier kit, recover and capture. No boss attempt.',
  steps: [
    { type: 'configureBuild', build: NIGHT2_TRAVEL_BUILD },
    ...V1U_EARLY_MASTERY.flatMap(masteryLeg),
    ...V1U_PURCHASES,
    ...returnRested,
    { type: 'captureCheckpoint', boundaryId: 'v1u-intermediate-kit' },
    ...V1U_LATE_MASTERY.flatMap(masteryLeg),
    { type: 'assert', condition: { type: 'globalMasteryAtLeast', value: 114 } },
    ...V1U_FINAL_UPGRADES,
    ...returnRested,
    { type: 'configureBuild', build: V1U_BOSS_BUILD },
    { type: 'assert', condition: prepared },
    { type: 'captureCheckpoint', boundaryId: 'v1u-tempo-barrier-prepared' },
  ], completion: prepared,
};

/* Each leg keeps the paid movement package and returns before changing equipment. */
function masteryLeg({ group, level }: { group: string; level: number }): RouteStep[] {
  return [
      { type: 'travel', to: { kind: 'biome', biomeGroup: group, tier: 3, pick: 'first' }, stepTimeoutMs: 300000 },
      { type: 'configureBuild', build: group === 'swamp' || group === 'cave' ? V1U_AFFLICTION_BUILD : V1P_TUNDRA_BUILD },
      { type: 'farm', at: { kind: 'biome', biomeGroup: group, tier: 3, pick: 'current' },
        until: allOf({ type: 'biomeLevelAtLeast', biomeGroup: group, level },
          ...(group === 'mountain' ? [{ type: 'essenceAtLeast' as const, essence: 'blue' as const, amount: 4000 }] : []),
          ...(group === 'cave' ? [{ type: 'essenceAtLeast' as const, essence: 'red' as const, amount: 3000 }] : [])),
        stepTimeoutMs: 1800000, stallAfterMs: 300000 },
      ...returnRested,
      { type: 'captureCheckpoint', boundaryId: `v1u-mastery-${group}` },
    ];
}

export const CAMPAIGN_T3_V1U_BOSS: Route = {
  ...CAMPAIGN_T3_V1T, id: 'spirit-volcano-tempo-barrier-t3-v1u',
  progressionEntry: { boundaryId: 'v1u-tempo-barrier-prepared', nodeId: hub.nodeId, tier: 3,
    revisionPolicy: 'same-revision', prerequisites: [prepared] },
  description: 'Two-stage V1u boss candidate: Cinderlash, Mountain armor/charm, Accelerant, Frenzy and Offensive stance; earned Wisp retained.',
  steps: CAMPAIGN_T3_V1T.steps.map((step): RouteStep => {
    if (step.type === 'configureBuild' && step.build === V1P_TUNDRA_BUILD) return { ...step, build: V1U_BOSS_BUILD };
    if (step.type === 'captureCheckpoint') return { ...step, boundaryId: step.boundaryId.replace('v1t-', 'v1u-') };
    if (step.type === 'travel') return { ...step, stepTimeoutMs: 300000 };
    return step;
  }),
};
export const CAMPAIGN_T3_V1U_ROUTES = [CAMPAIGN_T3_V1U_PREP, CAMPAIGN_T3_V1U_BOSS];
