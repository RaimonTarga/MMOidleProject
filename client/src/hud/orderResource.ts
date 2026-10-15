/**
 * The Striker's discipline resource as the beat strip draws it (bible §12.5, §12.6):
 * Light's shine, Balanced's edge, Heavy's Momentum, and the line a specialization adds
 * (Afterimage's held slashes, Frenzy's finisher count). The server owns the numbers
 * (`usesCadence.lit / edge / momentum / held / fightFinishers / frenzyArmed`); this only reads them.
 */
interface OrderResourceBase {
  /** A specialization's extra words (T3), or null. */
  note: string | null;
}
export type OrderResource =
  | (OrderResourceBase & { kind: 'light'; lit: boolean })
  | (OrderResourceBase & { kind: 'balanced'; edge: number })
  | (OrderResourceBase & { kind: 'heavy'; momentum: number });

/** Heavy's Momentum stops here before Crescendo (a mirror of the server's cap; PLACEHOLDER). */
export const MOMENTUM_BAR_CAP = 2;

/** Frenzy's second finisher joins from this finisher of a fight (a mirror of the server's `FRENZY_AFTER_FINISHERS`; PLACEHOLDER). */
export const FRENZY_AFTER_FINISHERS = 2;

export interface OrderResourceState {
  lit: boolean;
  edge: number;
  momentum: number;
  /** The picked specialization (T3), if any. */
  specializationId?: string | null;
  /** Afterimage: slashes held back this combo. */
  held?: number;
  /** Frenzy: finishers landed this fight, and whether the second, lighter one is armed. */
  fightFinishers?: number;
  frenzyArmed?: boolean;
}

/** What a specialization adds to the strip's words, or null when it has nothing to show now. */
export function specializationNote(state: OrderResourceState): string | null {
  switch (state.specializationId) {
    case 'striker-afterimage': {
      const held = Math.max(0, Math.floor(state.held ?? 0));
      return held > 0 ? `${held} ${held === 1 ? 'slash' : 'slashes'} held` : null;
    }
    case 'striker-frenzy': {
      if (state.frenzyArmed) return 'Frenzy: second finisher armed';
      const done = Math.min(FRENZY_AFTER_FINISHERS, Math.max(0, Math.floor(state.fightFinishers ?? 0)));
      return done >= FRENZY_AFTER_FINISHERS ? 'Frenzy ready' : `Frenzy ${done} of ${FRENZY_AFTER_FINISHERS}`;
    }
    default:
      return null;
  }
}

export function orderResourceFor(
  disciplineId: string | null,
  state: OrderResourceState,
): OrderResource | null {
  const note = specializationNote(state);
  switch (disciplineId) {
    case 'striker-light':
      return { kind: 'light', lit: state.lit, note };
    case 'striker-balanced':
      return { kind: 'balanced', edge: Math.max(0, Math.floor(state.edge)), note };
    case 'striker-heavy':
      return { kind: 'heavy', momentum: Math.max(0, state.momentum), note };
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
  const main = resourceWords(resource, beats);
  return resource.note ? `${main} · ${resource.note}` : main;
}

function resourceWords(resource: OrderResource, beats: number): string {
  switch (resource.kind) {
    case 'light':
      return resource.lit ? 'Shine lit' : 'Shine out';
    case 'balanced':
      return `Edge ${Math.min(resource.edge, beats)} of ${beats}`;
    case 'heavy':
      return `Momentum +${Math.round(resource.momentum * 100)}%`;
  }
}
