/**
 * Ability magnitudes that are NOT authored in the ability file.
 *
 * Sidestep (design §22.8) is "an evasion window plus a short burst of move speed":
 * its rank authors only its shape (the effect kind and the cooldown), and the
 * numbers live here, one row per rank. Both halves run on one clock — the burst
 * ends with the evasion window.
 *
 * The rows are the values the retired payoff table resolved to at each rank's
 * tier (class-first rework D1 removed that table and kept its numbers).
 */
import { abilityRankIndex, type AbilityDef } from './abilities';

export interface SidestepWindow {
  /** Flat dodge chance added for the window. */
  evasionPct: number;
  /** Move-speed fraction for the same window. */
  moveSpeedPct: number;
  /** One clock for both. */
  durationMs: number;
}

/** Sidestep's window per authored rank, `[0]` = its home tier (T1). */
const SIDESTEP_BY_RANK: readonly SidestepWindow[] = [
  { evasionPct: 0.15, moveSpeedPct: 0.2, durationMs: 2500 },
  { evasionPct: 0.173, moveSpeedPct: 0.23, durationMs: 2500 },
  { evasionPct: 0.198, moveSpeedPct: 0.264, durationMs: 2500 },
  { evasionPct: 0.225, moveSpeedPct: 0.3, durationMs: 2500 },
];

/** Sidestep's window at this player's rank. */
export function sidestepWindow(ability: AbilityDef, playerTier: number): SidestepWindow {
  const index = Math.min(abilityRankIndex(ability, playerTier), SIDESTEP_BY_RANK.length - 1);
  return { ...SIDESTEP_BY_RANK[index]! };
}
