/**
 * The bench criterion — a VIABILITY FLOOR (design §24.1).
 *
 * "The bench criterion (§18.9) changes job: it is a viability floor — no lane below
 * 0.9× the median uplift of its tier — and stops being a similarity target. Ordinal
 * encounter checks stay."
 *
 * What this replaces. Runs 2–4 judged every lane against the tier median ±3
 * percentage points (design §18.9), which balanced cards to be indistinguishable —
 * by construction imperceptible (§24.1). A lane ABOVE the median is no longer a
 * failure: the criterion only asks that nothing is left behind. The ordinal
 * encounter check (favoured lane vs punished lane on a family's own node) is a
 * different question and is untouched by this module.
 *
 * One arithmetic, shared by every instrument that reads it (the lane matrix's lane
 * and packet tables, the composition matrix's pairs), so the floor cannot be
 * computed two ways. Pure: no world, no I/O — `server/test/viabilityFloor.test.ts`
 * pins it on a synthetic row set.
 *
 * A NON-POSITIVE MEDIAN (a bench pick, flagged for the designer). "0.9× the median"
 * is only a floor below the median when the median is positive: at a −2% median,
 * 0.9× is −1.8%, ABOVE the median, and half the lanes — the median lane included —
 * would fail their own tier's floor. The floor is therefore read as "a tenth of the
 * median's size below it", `median − 0.1·|median|`, which IS 0.9× the median for
 * every positive median and stays below it otherwise. A tier whose median uplift is
 * not positive is reported as such (`medianPositive: false`): its lanes collectively
 * buy nothing, which is a finding before any floor is.
 */

/** Design §24.1: no lane below this share of its tier's median uplift. */
export const VIABILITY_FLOOR_RATIO = 0.9;

/**
 * The composition matrix's OUTLIER ceiling (course-correction W3-A brief): a pair
 * above 1.5× the median is listed. Reported, never a failure — §24.1 retired the
 * similarity target, so being strong is a reading, not a verdict.
 */
export const OUTLIER_CEILING_RATIO = 1.5;

export type FloorVerdict = 'pass' | 'below-floor' | 'no-reading';

export interface FloorRow<T> {
  item: T;
  /** The row's uplift over its control, as a fraction (+0.05 = +5%), or null. */
  uplift: number | null;
  /** uplift / median, when both exist and the median is not zero. */
  ratioToMedian: number | null;
  verdict: FloorVerdict;
  /** Above the outlier ceiling: listed, never failed. */
  aboveCeiling: boolean;
}

export interface FloorReading<T> {
  /** Median of the rows that have a reading; null when none does. */
  median: number | null;
  medianPositive: boolean;
  /** The floor a row must reach; null when no row has a reading. */
  floor: number | null;
  /** The outlier ceiling; null when no row has a reading. */
  ceiling: number | null;
  rows: FloorRow<T>[];
  /** Rows below the floor. The criterion holds when this is empty. */
  belowFloor: FloorRow<T>[];
  aboveCeiling: FloorRow<T>[];
}

/** The plain median; even counts average the middle two. */
export function medianOf(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** `ratio`× the median for a positive median; the same distance below it otherwise. */
export function floorFor(median: number, ratio = VIABILITY_FLOOR_RATIO): number {
  return median - (1 - ratio) * Math.abs(median);
}

/** `ratio`× the median for a positive median; the same distance above it otherwise. */
export function ceilingFor(median: number, ratio = OUTLIER_CEILING_RATIO): number {
  return median + (ratio - 1) * Math.abs(median);
}

/**
 * Judge every row against its tier's median uplift. The caller decides what a
 * "tier" is (one call per tier and instrument) and what a row is (a lane, a
 * packet, a lean × verb pair).
 */
export function viabilityFloor<T>(
  items: readonly T[],
  upliftOf: (item: T) => number | null,
  opts: { floorRatio?: number; ceilingRatio?: number } = {},
): FloorReading<T> {
  const floorRatio = opts.floorRatio ?? VIABILITY_FLOOR_RATIO;
  const ceilingRatio = opts.ceilingRatio ?? OUTLIER_CEILING_RATIO;
  const readings = items.map((item) => ({ item, uplift: upliftOf(item) }));
  const median = medianOf(readings.flatMap((r) => (r.uplift === null || !Number.isFinite(r.uplift) ? [] : [r.uplift])));
  const floor = median === null ? null : floorFor(median, floorRatio);
  const ceiling = median === null ? null : ceilingFor(median, ceilingRatio);
  const rows: FloorRow<T>[] = readings.map(({ item, uplift }) => {
    if (uplift === null || !Number.isFinite(uplift) || floor === null || ceiling === null) {
      return { item, uplift, ratioToMedian: null, verdict: 'no-reading', aboveCeiling: false };
    }
    return {
      item,
      uplift,
      ratioToMedian: median !== null && median !== 0 ? uplift / median : null,
      verdict: uplift < floor ? 'below-floor' : 'pass',
      aboveCeiling: uplift > ceiling,
    };
  });
  return {
    median,
    medianPositive: median !== null && median > 0,
    floor,
    ceiling,
    rows,
    belowFloor: rows.filter((r) => r.verdict === 'below-floor'),
    aboveCeiling: rows.filter((r) => r.aboveCeiling),
  };
}
