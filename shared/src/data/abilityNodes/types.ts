/**
 * Ability nodes — the generic tree keyed to packets (design §19).
 *
 * "Runes decide *when* an ability fires; nodes decide *what* it does." A node
 * means "this ability also fires the chosen packet's payoff at a share when it
 * lands (Technique) or casts (Guard)", resolved through the lineage payoff
 * runtime. Two rows ship: the `packet` node and the `amplifier` node above it.
 *
 * The three axioms this file encodes, all inherited rather than invented:
 *
 *  1. **Closed vocabulary.** A node option is a {@link PacketId} and a
 *     {@link PayoffKind} — nothing else. There is no node-shaped effect, no
 *     bespoke code path, and no fifth kind of thing an option can be.
 *  2. **No numbers.** An authored option carries no magnitude, duration, cost or
 *     unlock level; every number comes from `lineages/magnitudes.ts` and the new
 *     `ABILITY_NODE_SHARE` column. There is nowhere in these types to put a
 *     literal, exactly as with {@link LineageCard}.
 *  3. **Defence never scales with offence** (design-bible §1, "separated
 *     budgets"). A Technique's options are offensive packets paying offensive
 *     payoffs; a Guard's are the three defensive faces paying defensive payoffs.
 *     {@link OFFENSIVE_NODE_PAYOFFS} / {@link DEFENSIVE_NODE_PAYOFFS} are the
 *     two halves, and the authoring test refuses a crossing.
 */
import type { AmplifiedAxis, PacketId, PayoffKind } from '../lineages/types';

/**
 * The two rows that ship (design §19: "one node per tier per ability, three
 * options each"). Keystone and cross rows for abilities come after the T3 class
 * review, so the union is deliberately two wide and not a placeholder for five.
 */
export type AbilityNodeRow = 'packet' | 'amplifier';

export const ABILITY_NODE_ROWS: readonly AbilityNodeRow[] = ['packet', 'amplifier'] as const;

/**
 * The payoffs a Technique node may pay with: every one acts on the fight the
 * player is winning, never on their own survival.
 *
 * `speed-window` is here and NOT on the Guard list, which is the one place this
 * file knowingly departs from the brief's parenthetical ("avoid → engagement-dr /
 * speed-window"): an attack-speed window on a Guard would be defence scaling
 * offence, the exact axiom the same sentence cites. Avoid pays `engagement-dr`.
 */
export const OFFENSIVE_NODE_PAYOFFS: ReadonlySet<PayoffKind> = new Set<PayoffKind>([
  'echo-hit', 'vulnerability', 'plating-shred', 'hemorrhage', 'poison-stack',
  'slow', 'contagion', 'damage-window', 'speed-window',
]);

/** The payoffs a Guard node may pay with: all of them act on the player. */
export const DEFENSIVE_NODE_PAYOFFS: ReadonlySet<PayoffKind> = new Set<PayoffKind>([
  'engagement-dr', 'recovery-window', 'ward', 'plating-stack',
]);

/**
 * One option on one row. Authored as a (lane, payoff) pair and nothing more: the
 * name, the blurb, the fx, the amplifier axis, the cost and the unlock are all
 * DERIVED, because design §19 asks for a *generic* tree keyed to packets and 66
 * hand-written option names would be the opposite of that.
 */
export interface AbilityNodeOption {
  id: string;
  abilityId: string;
  row: AbilityNodeRow;
  /** The packet this option names. Its shard is what the option costs. */
  lane: PacketId;
  /** The lane's payoff this node fires at the share. */
  payoff: PayoffKind;
  /**
   * `amplifier` options only: the packet option this one modifies. Owning it is
   * a prerequisite, and only the amplifier of the ACTIVE packet does anything —
   * exactly how a lineage amplifier's `modifies` behaves.
   */
  modifies?: string;
  /** `amplifier` options only: the axis of the modified payoff this one moves. */
  amplifies?: AmplifiedAxis;
}

/** One ability's node tree: two rows, three options each. */
export interface AbilityNodeDefinition {
  abilityId: string;
  /** `technique` offers offensive packets, `guard` the three defensive faces. */
  family: 'technique' | 'guard';
  /** The band each row is gated in. `packet` sits on the ability's home tier. */
  rowTier: Record<AbilityNodeRow, number>;
  options: readonly AbilityNodeOption[];
}

// ─── Player state ────────────────────────────────────────────────────────────

/**
 * Per-ability node progress. Same contract as {@link LineageProgress}: "owned is
 * forever, active is a choice" — paying for an option is permanent, swapping
 * which owned option is active is free and instant.
 */
export interface AbilityNodeProgress {
  /** Option ids bought. Permanent. */
  owned: string[];
  /** One active option per row. A row is a choice, not a shopping list. */
  active: Partial<Record<AbilityNodeRow, string>>;
}

/** Keyed by ability id. Lives on `TracksProgression.abilityNodes` (persisted). */
export type AbilityNodeProgressMap = Record<string, AbilityNodeProgress>;
