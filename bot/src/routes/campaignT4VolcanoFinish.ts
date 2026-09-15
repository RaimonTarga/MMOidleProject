import type { Route, RouteStep } from '../route/types';
import { CAMPAIGN_T4_BOSS_COVERAGE_ROUTES } from './campaignT4ValidationExit';

const reference = CAMPAIGN_T4_BOSS_COVERAGE_ROUTES.find(r => r.id === 't4-exit-volcanic-boss')!;
export const VOLCANO_FINISH_CASES = [
  { id: 't4-volcano-finish-reference-empty', expose: false, relic: false },
  { id: 't4-volcano-finish-expose-empty', expose: true, relic: false },
  { id: 't4-volcano-finish-reference-colossus', expose: false, relic: true },
  { id: 't4-volcano-finish-expose-colossus', expose: true, relic: true },
] as const;

/** Independent 2x2 screen: add Expose Weakness, equip Colossus, or both.
 * All four retain the previously qualified travel, guardians, gear and runes.
 */
export const CAMPAIGN_T4_VOLCANO_FINISH_ROUTES: Route[] = VOLCANO_FINISH_CASES.map(c => ({
  ...reference,
  id: c.id,
  version: '1.0.0',
  description: `Volcano finishing screen: ${c.expose ? 'added Expose Weakness' : 'reference abilities'}, ${c.relic ? 'paid Colossus Heart' : 'empty relic'}; independent first-death-stop attempt.`,
  steps: [
    ...(c.relic ? [
      { type: 'craft', recipeIds: ['relic-colossus-heart'], stepTimeoutMs: 15000 },
      { type: 'equip', definitionIds: ['relic-colossus-heart'] },
      { type: 'assert', condition: { type: 'equipped', definitionId: 'relic-colossus-heart' } },
    ] satisfies RouteStep[] : []),
    ...reference.steps.map((step): RouteStep => {
      if (step.type === 'captureCheckpoint') return { ...step,
        boundaryId: `${c.id}-${step.boundaryId.endsWith('-ready') ? 'ready' : 'returned'}` };
      if (c.expose && step.type === 'configureBuild' && step.build.abilities?.techniques.includes('frenzy')) {
        return { ...step, build: { ...step.build, abilities: { ...step.build.abilities,
          techniques: [...step.build.abilities.techniques, 'expose-weakness'] } } };
      }
      return step;
    }),
  ],
}));
