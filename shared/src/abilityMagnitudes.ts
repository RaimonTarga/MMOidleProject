/**
 * Ability magnitudes that are NOT authored in the ability file.
 *
 * Sidestep (design §22.8) is "an evasion window plus a short burst of move speed,
 * both from the magnitude table's units": its rank authors only its shape (the
 * effect kind and the cooldown), and the numbers are the lineage payoff table's
 * own, resolved here through the one seam every lineage card and ability node
 * uses (`payoffValue`). So Sidestep's window is exactly an `evasion-window` payoff
 * fired on a Guard cast in the Engagement lane (the lane whose avoid offer pays
 * it), at the tier of the rank the player holds; the burst borrows the
 * `speed-window` unit's magnitude as a move-speed fraction and ends with the
 * evasion window, on one clock.
 */
import { abilityRankIndex, type AbilityDef } from './abilities';
import { payoffValue } from './data/lineages/magnitudes';

export interface SidestepWindow {
  /** Flat dodge chance added for the window (the `evasion-window` unit). */
  evasionPct: number;
  /** Move-speed fraction for the same window (the `speed-window` unit's magnitude). */
  moveSpeedPct: number;
  /** One clock for both: the `evasion-window` unit's window. */
  durationMs: number;
}

/** The tier Sidestep's held rank was authored for: its home tier plus the rank index. */
function rankTier(ability: AbilityDef, playerTier: number): number {
  return ability.tier + abilityRankIndex(ability, playerTier);
}

/** Sidestep's window at this player's rank. */
export function sidestepWindow(ability: AbilityDef, playerTier: number): SidestepWindow {
  const tier = rankTier(ability, playerTier);
  const common = { tier, row: 'payoff', lane: 'engagement', trigger: { kind: 'guard-cast' } } as const;
  const evade = payoffValue({ ...common, payoff: 'evasion-window' });
  const speed = payoffValue({ ...common, payoff: 'speed-window' });
  return {
    evasionPct: evade.magnitude,
    moveSpeedPct: speed.magnitude,
    durationMs: evade.durationMs ?? 0,
  };
}
