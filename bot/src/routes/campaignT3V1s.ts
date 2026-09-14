import type { Route } from '../route/types';
import { CAMPAIGN_T3_V1R_ROUTES } from './campaignT3V1r';

/** Replicate the two V1r successes with longer exposure; keep their treatments intact. */
export const CAMPAIGN_T3_V1S_ROUTES: Route[] = CAMPAIGN_T3_V1R_ROUTES
  .filter(route => !route.id.includes('-focus-'))
  .map(source => {
    const route = structuredClone(source);
    route.id = source.id.replace('-v1r', '-v1s');
    route.description = 'V1s sustained Volcano screen: unchanged V1r kit, five minutes of natural farming, ordinary return and recovery.';
    route.steps = route.steps.map(step => {
      if (step.type === 'captureCheckpoint') return { ...step, boundaryId: step.boundaryId.replace('v1r-', 'v1s-') };
      if (step.type === 'farm' && step.observeForMs === 60000) {
        return { ...step, observeForMs: 300000, stepTimeoutMs: 330000 };
      }
      return step;
    });
    return route;
  });
