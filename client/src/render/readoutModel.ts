/**
 * The combat readout's rules, as pure functions over `readoutTokens.ts`: which band a
 * number draws at, how DoT ticks coalesce, how a target's floaters stack. No Phaser, no
 * React, so every rule is testable without a renderer.
 */
import { NUMBER_TOKENS, type NumberBand } from './readoutTokens';

const BANDS = NUMBER_TOKENS.bands;
const BAND_ORDER: readonly NumberBand[] = BANDS.map((b) => b.band);

/** The band a hit of `amount` draws at against a pool of `maxHp`. */
export function numberBandFor(amount: number, maxHp: number | undefined): NumberBand {
  if (maxHp === undefined || !(maxHp > 0)) return NUMBER_TOKENS.unknownShareBand;
  const share = Math.max(0, amount) / maxHp;
  let band: NumberBand = BANDS[0].band;
  for (const b of BANDS) if (share >= b.minShare) band = b.band;
  return band;
}

/** `band` moved `steps` along the ladder, clamped to its ends. */
export function shiftBand(band: NumberBand, steps: number): NumberBand {
  const i = BAND_ORDER.indexOf(band) + steps;
  return BAND_ORDER[Math.max(0, Math.min(BAND_ORDER.length - 1, i))];
}

/** The lower of two bands. */
export function minBand(a: NumberBand, b: NumberBand): NumberBand {
  return BAND_ORDER.indexOf(a) <= BAND_ORDER.indexOf(b) ? a : b;
}

export function bandSizePx(band: NumberBand): number {
  return BANDS.find((b) => b.band === band)!.sizePx;
}

/**
 * DoT ticks on one target coalesce into one number per window. The window opens on
 * the first tick and closes `dotWindowMs` later; everything that landed in it is one
 * number. Keys are chosen by the caller (target, element, absorbed or not), so two
 * elements on one target keep their colours.
 */
export class DotCoalescer<E extends { amount: number }> {
  private readonly open = new Map<string, { entry: E; amount: number; closesAt: number }>();

  constructor(private readonly windowMs = NUMBER_TOKENS.dotWindowMs) {}

  add(key: string, entry: E, now: number): void {
    const window = this.open.get(key);
    if (window) {
      window.amount += entry.amount;
      // The newest tick's fields win (its position is where the number appears),
      // but one it left undefined (a pool read after the view was gone) keeps the
      // window's earlier value.
      const merged = { ...window.entry };
      for (const [k, v] of Object.entries(entry)) if (v !== undefined) (merged as Record<string, unknown>)[k] = v;
      window.entry = merged;
      return;
    }
    this.open.set(key, { entry, amount: entry.amount, closesAt: now + this.windowMs });
  }

  /** The windows that have closed by `now`, each as one entry carrying the sum. */
  flush(now: number): E[] {
    const ready: E[] = [];
    for (const [key, window] of this.open) {
      if (now < window.closesAt) continue;
      ready.push({ ...window.entry, amount: window.amount });
      this.open.delete(key);
    }
    return ready;
  }

  get size(): number {
    return this.open.size;
  }

  reset(): void {
    this.open.clear();
  }
}

/** What the lane stack needs from a live floater. */
export interface LaneFloater {
  /** Height of the floater in the units `setLift` takes. */
  readonly height: number;
  isAlive(): boolean;
  /** Lift the floater this far above its lane's base. */
  setLift(lift: number): void;
  destroy(): void;
}

/**
 * Each target's floaters stack in one lane: the newest takes the base, the older ones
 * are lifted by the heights above them, and past the cap the oldest is dropped — so
 * floaters never overlap unreadably and a burst never backs up into later fights.
 */
export class LaneStack<F extends LaneFloater> {
  private readonly lanes = new Map<string, F[]>();

  constructor(
    private readonly cap = NUMBER_TOKENS.lane.cap,
    private readonly gap = NUMBER_TOKENS.lane.gapPx,
  ) {}

  /** Add `floater` at the base of `targetId`'s lane; returns the ones dropped. */
  push(targetId: string, floater: F): F[] {
    const lane = (this.lanes.get(targetId) ?? []).filter((f) => f.isAlive());
    lane.unshift(floater);
    const dropped = lane.splice(this.cap);
    for (const f of dropped) f.destroy();
    this.lanes.set(targetId, lane);
    this.relayout(lane);
    return dropped;
  }

  /** Lifts, base first, for a lane's live floaters (newest first). */
  lifts(targetId: string): number[] {
    const out: number[] = [];
    let lift = 0;
    for (const f of this.lanes.get(targetId) ?? []) {
      if (!f.isAlive()) continue;
      out.push(lift);
      lift += f.height + this.gap;
    }
    return out;
  }

  /** Forget lanes whose floaters have all expired. */
  prune(): void {
    for (const [id, lane] of this.lanes) {
      const live = lane.filter((f) => f.isAlive());
      if (live.length === 0) this.lanes.delete(id);
      else if (live.length !== lane.length) this.lanes.set(id, live);
    }
  }

  liveCount(targetId: string): number {
    return (this.lanes.get(targetId) ?? []).filter((f) => f.isAlive()).length;
  }

  /** Drop every floater (hidden tab, node change). */
  clear(): void {
    for (const lane of this.lanes.values()) for (const f of lane) if (f.isAlive()) f.destroy();
    this.lanes.clear();
  }

  private relayout(lane: F[]): void {
    let lift = 0;
    for (const f of lane) {
      f.setLift(lift);
      lift += f.height + this.gap;
    }
  }
}
