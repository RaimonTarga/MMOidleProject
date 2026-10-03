/**
 * The ORDINAL encounter check (design §18.9, kept by §24.1: "Ordinal encounter
 * checks stay").
 *
 * On a family's own node: does the favoured lane out-uplift the punished lane, and
 * by what margin? Lanes are ranked by their MEDIAN uplift over the references that
 * carry them; the margin (favoured − punished) is reported, never thresholded.
 *
 * Extracted from `lineageLaneMatrix.ts` (course-correction W3-A) unchanged, so the
 * check can be pinned by a unit test beside the viability floor that replaced the
 * ±3 pp band — the floor changed, this did not.
 */
import type { PacketId } from '@mmo-idle/shared';

export interface LaneRank {
  lane: PacketId;
  /** The lane's median uplift on the node. */
  up: number;
  /** 1 = the strongest lane on the node. */
  rank: number;
  /** How many references the median was taken over. */
  refs: number;
}

function median(values: readonly number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** Rank lanes by the median of their references' uplifts, strongest first. */
export function rankLanesByMedian(byLane: ReadonlyMap<PacketId, readonly number[]>): LaneRank[] {
  const scored = [...byLane.entries()]
    .filter(([, values]) => values.length > 0)
    .map(([lane, values]) => ({ lane, up: median(values), refs: values.length }))
    .sort((a, b) => b.up - a.up);
  return scored.map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export interface EncounterReading {
  favoured: LaneRank | undefined;
  punished: LaneRank | undefined;
  /** favoured − punished, in uplift fraction; null when either lane went unranked. */
  margin: number | null;
  /** True when the favoured lane ranks strictly above the punished one. */
  favouredAhead: boolean | null;
}

/** The family's reading: where its favoured and punished lanes rank, and the margin. */
export function encounterReading(
  ranks: readonly LaneRank[],
  favoured: PacketId,
  punished: PacketId,
): EncounterReading {
  const fav = ranks.find((r) => r.lane === favoured);
  const pun = ranks.find((r) => r.lane === punished);
  return {
    favoured: fav,
    punished: pun,
    margin: fav && pun ? fav.up - pun.up : null,
    favouredAhead: fav && pun ? fav.rank < pun.rank : null,
  };
}
