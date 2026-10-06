/**
 * The combat readout's rules, as pure functions over `readoutTokens.ts`: which band a
 * number draws at, how DoT ticks coalesce, how a target's floaters stack, how a bar is
 * cut and how its chip drains. No Phaser, no React, so every rule is testable without a
 * renderer.
 */
import { BAR_TOKENS, FRAME_TOKENS, NUMBER_TOKENS, type BodySizeClass, type NumberBand } from './readoutTokens';

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

// ── Bars ────────────────────────────────────────────────────────────────────

/** The size class an overhead bar is cut to, from the displayed body size. */
export function bodySizeClass(displayPx: number, isBoss: boolean): BodySizeClass {
  if (isBoss) return 'boss';
  if (displayPx < BAR_TOKENS.sizeClassPx.small) return 'small';
  if (displayPx >= BAR_TOKENS.sizeClassPx.large) return 'large';
  return 'medium';
}

/** Health colour by thirds of the pool. */
export function healthColor(fraction: number): string {
  const { high, mid } = BAR_TOKENS.thirds;
  return fraction > high ? BAR_TOKENS.color.high : fraction > mid ? BAR_TOKENS.color.mid : BAR_TOKENS.color.low;
}

/** '#rrggbb' as the 0xRRGGBB number Phaser's Graphics take. */
export function colorInt(hex: string): number {
  return Number.parseInt(hex.slice(1), 16);
}

/** Where the segment marks sit on a marked (elite or boss) bar, as fractions. */
export function segmentMarks(): number[] {
  const marks: number[] = [];
  for (let f = BAR_TOKENS.segmentEvery; f < 1 - 1e-9; f += BAR_TOKENS.segmentEvery) marks.push(Math.round(f * 1e6) / 1e6);
  return marks;
}

/** The damage chip: it drains from `from` to `to`, holding at `from` until `at + holdMs`. */
export interface ChipState {
  from: number;
  to: number;
  at: number;
}

/** The chip's fraction at `now`. */
export function chipValue(chip: ChipState, now: number): number {
  const { holdMs, drainMs } = BAR_TOKENS.chip;
  const dt = now - chip.at;
  if (dt <= holdMs) return chip.from;
  const k = Math.min(1, (dt - holdMs) / drainMs);
  return chip.from + (chip.to - chip.from) * k * k;
}

/** True while the chip still shows something above the fill. */
export function chipActive(chip: ChipState, now: number): boolean {
  return chipValue(chip, now) > chip.to + 1e-6;
}

/**
 * Advance the chip to a new fill fraction. A heal or a caught-up chip snaps to the
 * fill; a fresh hit holds the old value for a beat; a small drop while the chip is
 * still out keeps it draining from where it is, so a 0.5 s DoT never pins it.
 */
export function chipAdvance(chip: ChipState | undefined, fill: number, now: number): ChipState {
  if (!chip) return { from: fill, to: fill, at: now };
  const cur = chipValue(chip, now);
  if (fill >= cur) return { from: fill, to: fill, at: now };
  if (fill === chip.to) return chip;
  const caughtUp = cur <= chip.to + 1e-9;
  if (fill < chip.to && (caughtUp || chip.to - fill >= BAR_TOKENS.chip.reholdShare)) return { from: cur, to: fill, at: now };
  return { from: cur, to: fill, at: now - BAR_TOKENS.chip.holdMs };
}

// ── The boss bar's quarters ─────────────────────────────────────────────────

export interface QuarterMarker {
  /** Where the boundary sits on the bar, as a fraction of max HP. */
  at: number;
  /** The boss has fallen below it. */
  lost: boolean;
  /** The boundary it will cross next. */
  next: boolean;
}

export interface QuarterModel {
  /** Quarters lost, 0-4 (4 only at zero HP: the fourth firing is the kill). */
  lost: number;
  /** The three inner boundaries (75 / 50 / 25 %). */
  markers: QuarterMarker[];
}

/** The quarters a boss has LOST, and which boundary comes next. */
export function quarterModel(hp: number, maxHp: number): QuarterModel {
  const f = maxHp > 0 ? Math.max(0, Math.min(1, hp / maxHp)) : 0;
  const lost = f <= 0 ? 4 : Math.min(3, Math.floor((1 - f) * 4 + 1e-9));
  return {
    lost,
    markers: [0.75, 0.5, 0.25].map((at, i) => ({ at, lost: i < lost, next: i === lost })),
  };
}

/**
 * Where an absorb band sits on a bar (percent): it starts where health ends — it is
 * the layer damage chews through first — and slides back inside the bar when it would
 * run off the end, so a shielded body at full HP still shows its shell.
 */
export function absorbBand(hpFraction: number, absorbFraction: number): { left: number; width: number } | null {
  if (!(absorbFraction > 0)) return null;
  const width = Math.max(FRAME_TOKENS.bar.absorbMinShare, Math.min(1, absorbFraction)) * 100;
  const left = Math.max(0, Math.min(Math.max(0, Math.min(1, hpFraction)) * 100, 100 - width));
  return { left, width };
}

// ── The phone camera floor ──────────────────────────────────────────────────

/**
 * World-space scale for a damage number at camera `zoom`: 1 at zoom 1; below it,
 * enough to keep the number's SCREEN size at `screenFloor` of its desktop size, so
 * it reads at the 0.4 floor without changing the camera (design §26.4 open item).
 */
export function numberScreenScale(zoom: number): number {
  const z = zoom > 0 ? zoom : 1;
  return z < 1 ? Math.max(z, NUMBER_TOKENS.screenFloor) / z : 1;
}

/** An overhead bar's height in world px at camera `zoom`: never below its screen floor. */
export function barHeightAtZoom(height: number, zoom: number): number {
  const z = zoom > 0 ? zoom : 1;
  return z < 1 ? Math.max(height, BAR_TOKENS.screenFloor.height / z) : height;
}
