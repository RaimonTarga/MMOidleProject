import type { EndpointId } from './manifest';

/**
 * Rough per-call USD estimates for --dry-run budgeting only. Real spend is
 * taken from the `usage.usd` field of each API response and recorded in the
 * lockfile; these numbers are order-of-magnitude guesses from PixelLab's
 * public pricing range ($0.002–$0.185 per call).
 */
export const ESTIMATED_USD_PER_CALL: Record<EndpointId, number> = {
  bitforge: 0.02,
  pixflux: 0.06,
  'generate-ui': 0.1,
  'animate-with-text': 0.15,
  tileset: 0.01,
};

export function estimateCall(endpoint: EndpointId): number {
  return ESTIMATED_USD_PER_CALL[endpoint] ?? 0.1;
}
