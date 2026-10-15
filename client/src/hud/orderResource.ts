/**
 * The Striker's Tier 2 discipline resource as the beat strip draws it (bible §12.5):
 * Light's shine, Balanced's edge, Heavy's Momentum. The server owns the numbers
 * (`usesCadence.lit / edge / momentum`); this only reads them.
 */
export type OrderResource =
  | { kind: 'light'; lit: boolean }
  | { kind: 'balanced'; edge: number }
  | { kind: 'heavy'; momentum: number };

/** Heavy's Momentum stops here before Crescendo (a mirror of the server's cap; PLACEHOLDER). */
export const MOMENTUM_BAR_CAP = 2;

export function orderResourceFor(
  disciplineId: string | null,
  state: { lit: boolean; edge: number; momentum: number },
): OrderResource | null {
  switch (disciplineId) {
    case 'striker-light':
      return { kind: 'light', lit: state.lit };
    case 'striker-balanced':
      return { kind: 'balanced', edge: Math.max(0, Math.floor(state.edge)) };
    case 'striker-heavy':
      return { kind: 'heavy', momentum: Math.max(0, state.momentum) };
    default:
      return null;
  }
}

/** Fill 0 to 1 for the finisher's glow. `beats` is the number of beats before the finisher. */
export function orderResourceFill(resource: OrderResource, beats: number): number {
  switch (resource.kind) {
    case 'light':
      return resource.lit ? 1 : 0;
    case 'balanced':
      return beats > 0 ? Math.min(1, resource.edge / beats) : 0;
    case 'heavy':
      return Math.min(1, resource.momentum / MOMENTUM_BAR_CAP);
  }
}

/** The strip's one line of words for the resource, or null when there is nothing to say. */
export function orderResourceText(resource: OrderResource, beats: number): string {
  switch (resource.kind) {
    case 'light':
      return resource.lit ? 'Shine lit' : 'Shine out';
    case 'balanced':
      return `Edge ${Math.min(resource.edge, beats)} of ${beats}`;
    case 'heavy':
      return `Momentum +${Math.round(resource.momentum * 100)}%`;
  }
}
