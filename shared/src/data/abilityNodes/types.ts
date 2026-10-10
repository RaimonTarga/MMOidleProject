/**
 * Ability nodes — the generic tree keyed to packets (design §19, §22).
 *
 * "Runes decide *when* an ability fires; nodes decide *what* it does." A node
 * means "this ability also fires the chosen packet's payoff at a share when it
 * lands (Technique) or casts (Guard)", resolved through the lineage payoff
 * runtime. Four rows: `packet`, `amplifier`, `keystone` and `cross` — and the
 * keystone row is the one bespoke exception to axiom 1 below (design §22.1:
 * "nodes stay generic; keystones are the exception").
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
 * The four rows (design §19, widened by §22.1 and §22.10–§22.11):
 *
 *  - `packet`    what the ability ALSO does: three offers, one active.
 *  - `amplifier` how that packet route fires: a free choice of axis on the
 *                active route (§22.10), the payoff's natural axis the default.
 *  - `keystone`  what the ability BECOMES: up to three bespoke verbs (§22.11),
 *                each a named server module. The one exception to "data over a
 *                closed vocabulary", exactly as the lane keystone row is (§4).
 *  - `cross`     what it BORROWS: one of the ability's other two packet offers at
 *                `ROW_SCALAR.cross`, derived — never authored.
 *
 * Tiers are home + {0, 1, 2, 3} with no clamp (§22.10); see `abilityNodeRowTier`.
 */
export type AbilityNodeRow = 'packet' | 'amplifier' | 'keystone' | 'cross';

export const ABILITY_NODE_ROWS: readonly AbilityNodeRow[] = [
  'packet', 'amplifier', 'keystone', 'cross',
] as const;

/**
 * The payoffs a Technique node may pay with: every one acts on the fight the
 * player is winning, never on their own survival.
 *
 * `speed-window` is here and NOT on the Guard list, which is the one place this
 * file knowingly departs from the brief's parenthetical ("avoid → engagement-dr /
 * speed-window"): an attack-speed window on a Guard would be defence scaling
 * offence, the exact axiom the same sentence cites. Avoid pays `engagement-dr`
 * or `evasion-window` (added 2026-10-01, design §6) — a flat dodge chance for
 * the window, never attack speed.
 */
export const OFFENSIVE_NODE_PAYOFFS: ReadonlySet<PayoffKind> = new Set<PayoffKind>([
  'echo-hit', 'vulnerability', 'plating-shred', 'hemorrhage', 'poison-stack',
  'slow', 'contagion', 'damage-window', 'speed-window',
  // The Technique lane's refund (design §22). Offensive, and on a Technique node
  // it reads as "landing this ability refunds part of its own cooldown" — the
  // cooldown that is running when the node fires IS the ability's own. Its
  // sibling `technique-window` is deliberately NOT here: a window that empowers
  // the next Technique, hung off a Technique, would mean the node's whole payoff
  // was "do this again harder", which is the louder-number shape the file's
  // header rules out.
  'technique-refund',
]);

/** The payoffs a Guard node may pay with: all of them act on the player. */
export const DEFENSIVE_NODE_PAYOFFS: ReadonlySet<PayoffKind> = new Set<PayoffKind>([
  'engagement-dr', 'recovery-window', 'ward', 'plating-stack', 'evasion-window',
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
  /**
   * The packet this option names. Its shard is what a `packet`, `amplifier` or
   * `cross` option costs; on a `cross` option it is the BORROWED offer's lane.
   *
   * A `keystone` option is not keyed to a lane — its price is paid in the ACTIVE
   * packet's shard (design §22.1) — so there it is only the lane whose grammar
   * the keystone's fx draws (the fx key's own lane), which is the colour the card
   * wears.
   */
  lane: PacketId;
  /**
   * The lane's payoff this node fires at the share. On a `keystone` option: the
   * payoff kind the rule IS (a stagger is a `stun`, a net a `root`), authored on
   * the keystone so every non-stat row does something (as the lane keystones'
   * cards do), and the kind its share resolves from when it pays one.
   */
  payoff: PayoffKind;
  /**
   * `amplifier` options only: the packet option this one modifies. Owning it is
   * a prerequisite, and only the amplifier of the ACTIVE packet does anything —
   * exactly how a lineage amplifier's `modifies` behaves.
   */
  modifies?: string;
  /**
   * `amplifier` options only: the axis of the modified route this one moves. A
   * free choice since design §22.10 — every axis the route has is an option, the
   * payoff's natural one (`nodePayoffAxis`) the default — and `cast` (a shorter
   * wind-up, §22.9) on a cast-shaped ability.
   */
  amplifies?: AmplifiedAxis;
  /** `keystone` options only: which of the ability's verbs this is (design §22.11). */
  keystone?: string;
}

/** One ability's node tree: four rows. */
export interface AbilityNodeDefinition {
  abilityId: string;
  /** `technique` offers offensive packets, `guard` the three defensive faces. */
  family: 'technique' | 'guard';
  /**
   * The BAND each row is gated and priced in: its own tier
   * ({@link AbilityNodeDefinition.rowOwnTier}) folded into the current cap band
   * (design §22.10). `packet` sits on the ability's home tier.
   */
  rowTier: Record<AbilityNodeRow, number>;
  /**
   * The tier each row BELONGS to: home + {0, 1, 2, 3}, never clamped (§22.10).
   * Above the current cap it is folded into the cap band ({@link rowTier}) until
   * that tier ships; nothing about it is persisted, so a ship moves the row with
   * no save touched.
   */
  rowOwnTier: Record<AbilityNodeRow, number>;
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
