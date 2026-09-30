/**
 * Per-fight HP telemetry — the Phase 0 metric of the progression rework
 * (`docs/progression-rework-plan.md`): does HP actually MOVE during ordinary
 * fights, or is every fight either untouched or lethal?
 *
 * A fight is a contiguous span of engagement samples. It opens on the first
 * engaged sample and closes when the player has been disengaged for
 * `FIGHT_GRACE_MS` (target switches inside a pack do not split it), on death,
 * on a node change, or when the run ends. Grace time is not fight time.
 *
 * Per fight we keep the HP fraction at the last engaged sample (the "fight-end
 * HP"), the minimum, and how long HP sat inside the 20–80% band. The summary
 * reports the median fight-end HP and the share of fight time in band, which
 * are the two numbers the phase gate reads.
 *
 * Pure and clock-agnostic so the live bot recorder (1 s samples) and the
 * in-process bench (100 ms samples) share one definition.
 */

export const FIGHT_HP_BAND = { low: 0.2, high: 0.8 } as const;
export const FIGHT_GRACE_MS = 3_000;
/** Fights shorter than this are brushes, not fights, and are counted separately. */
export const MIN_FIGHT_MS = 1_000;

export type FightEndReason = "disengage" | "death" | "node-change" | "run-end";

export interface FightHpRecord {
  biomeGroup: string;
  nodeId: string;
  startedAtMs: number;
  /** Engaged time only; the trailing grace is excluded. */
  durationMs: number;
  startHpFraction: number;
  endHpFraction: number;
  minHpFraction: number;
  inBandMs: number;
  endedBy: FightEndReason;
}

export interface FightHpSample {
  engaged: boolean;
  dead: boolean;
  hpFraction: number;
  biomeGroup: string;
  nodeId: string;
}

interface OpenFight extends FightHpRecord {
  lastEngagedAtMs: number;
}

export class FightHpTracker {
  readonly fights: FightHpRecord[] = [];
  private open: OpenFight | null = null;

  /** One tick-boundary observation. `dt` is the time this sample stands for. */
  sample(atMs: number, dt: number, s: FightHpSample): void {
    const hp = clamp01(s.hpFraction);
    if (this.open && s.nodeId !== this.open.nodeId) this.close(atMs, "node-change");

    if (s.dead) {
      if (this.open) {
        this.open.endHpFraction = 0;
        this.open.minHpFraction = 0;
        this.close(atMs, "death");
      }
      return;
    }

    if (s.engaged) {
      if (!this.open) {
        this.open = {
          biomeGroup: s.biomeGroup,
          nodeId: s.nodeId,
          startedAtMs: atMs,
          durationMs: 0,
          startHpFraction: hp,
          endHpFraction: hp,
          minHpFraction: hp,
          inBandMs: 0,
          endedBy: "disengage",
          lastEngagedAtMs: atMs,
        };
      }
      const f = this.open;
      f.durationMs += dt;
      if (hp >= FIGHT_HP_BAND.low && hp <= FIGHT_HP_BAND.high) f.inBandMs += dt;
      f.minHpFraction = Math.min(f.minHpFraction, hp);
      f.endHpFraction = hp;
      f.lastEngagedAtMs = atMs;
      return;
    }

    if (this.open && atMs - this.open.lastEngagedAtMs >= FIGHT_GRACE_MS) this.close(atMs, "disengage");
  }

  /** Every fight so far, plus the open one as it stands. Does not mutate. */
  snapshot(): FightHpRecord[] {
    return this.open ? [...this.fights, strip(this.open, "run-end")] : [...this.fights];
  }

  /** Close the open fight at run end. */
  finish(atMs: number): void {
    if (this.open) this.close(atMs, "run-end");
  }

  private close(_atMs: number, reason: FightEndReason): void {
    if (!this.open) return;
    this.fights.push(strip(this.open, reason));
    this.open = null;
  }
}

function strip(f: OpenFight, endedBy: FightEndReason): FightHpRecord {
  const { lastEngagedAtMs: _drop, ...rest } = f;
  return { ...rest, endedBy };
}

function clamp01(x: number): number {
  return Number.isFinite(x) ? Math.min(1, Math.max(0, x)) : 0;
}

export interface FightHpBucketCounts {
  lt20: number;
  from20to40: number;
  from40to60: number;
  from60to80: number;
  ge80: number;
}

export interface FightHpGroupSummary {
  fights: number;
  deaths: number;
  fightMs: number;
  medianEndHpFraction: number | null;
  meanEndHpFraction: number | null;
  medianMinHpFraction: number | null;
  /** Fight time with HP inside the 20–80% band, over all fight time. */
  timeInBandShare: number | null;
  endHpBuckets: FightHpBucketCounts;
}

export interface FightHpSummary extends FightHpGroupSummary {
  band: { low: number; high: number };
  graceMs: number;
  minFightMs: number;
  /** Engagements shorter than `minFightMs`; excluded from every other number. */
  brushes: number;
  byBiome: Record<string, FightHpGroupSummary>;
  interpretation: string;
}

export function summarizeFights(all: FightHpRecord[]): FightHpSummary {
  const fights = all.filter((f) => f.durationMs >= MIN_FIGHT_MS);
  const byBiome: Record<string, FightHpGroupSummary> = {};
  for (const group of new Set(fights.map((f) => f.biomeGroup)).values()) {
    byBiome[group] = summarizeGroup(fights.filter((f) => f.biomeGroup === group));
  }
  return {
    ...summarizeGroup(fights),
    band: { ...FIGHT_HP_BAND },
    graceMs: FIGHT_GRACE_MS,
    minFightMs: MIN_FIGHT_MS,
    brushes: all.length - fights.length,
    byBiome,
    interpretation:
      "A fight is contiguous engagement; target switches inside the grace stay one fight. " +
      "End HP is the fraction at the last engaged sample (0 on death). Time in band is engaged " +
      "time with HP in [low, high] over all engaged time. Boss fights are included when they " +
      "happen in the sampled node; filter by biome for open-node evidence.",
  };
}

function summarizeGroup(fights: FightHpRecord[]): FightHpGroupSummary {
  const ends = fights.map((f) => f.endHpFraction);
  const mins = fights.map((f) => f.minHpFraction);
  const fightMs = fights.reduce((sum, f) => sum + f.durationMs, 0);
  const inBandMs = fights.reduce((sum, f) => sum + f.inBandMs, 0);
  const buckets: FightHpBucketCounts = { lt20: 0, from20to40: 0, from40to60: 0, from60to80: 0, ge80: 0 };
  for (const hp of ends) {
    if (hp < 0.2) buckets.lt20 += 1;
    else if (hp < 0.4) buckets.from20to40 += 1;
    else if (hp < 0.6) buckets.from40to60 += 1;
    else if (hp < 0.8) buckets.from60to80 += 1;
    else buckets.ge80 += 1;
  }
  return {
    fights: fights.length,
    deaths: fights.filter((f) => f.endedBy === "death").length,
    fightMs,
    medianEndHpFraction: median(ends),
    meanEndHpFraction: ends.length ? round(ends.reduce((a, b) => a + b, 0) / ends.length) : null,
    medianMinHpFraction: median(mins),
    timeInBandShare: fightMs > 0 ? round(inBandMs / fightMs) : null,
    endHpBuckets: buckets,
  };
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return round(sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2);
}

function round(x: number): number {
  return Math.round(x * 1000) / 1000;
}
