/**
 * The card tile, as a shell.
 *
 * Extracted from `LineageTreePanel` so ability nodes (design §19) render with the
 * SAME component rather than a lookalike: a node is a row of three options with a
 * lane colour, an owned/active state and a price, which is exactly what a lineage
 * card is. Two copies of this markup would be two copies of the lane grammar, and
 * the one that was not being looked at would drift.
 *
 * Purely presentational. It knows nothing about lineages, abilities, mastery or
 * wallets: the caller decides what the state is and whether the tile is live, and
 * the shell draws it.
 */
import type { ReactNode } from 'react';
import type { EssenceType, LineageWallet, PacketId } from '@mmo-idle/shared';
import { MaterialChip, essenceMaterial, shardMaterial } from '../MaterialChip';

/** The four states a tile can be in, which are also its CSS modifiers. */
export type CardShellState = 'available' | 'owned' | 'active' | 'locked';

/** The essence-and-shard price strip. Shared by cards, nodes and gate forms. */
export function CostChips({ cost, wallet }: {
  cost: { essence: Partial<Record<string, number>>; shards: Partial<Record<PacketId, number>> };
  wallet: Pick<LineageWallet, 'essences' | 'shards'>;
}) {
  return (
    <span className="lin-card__cost material-chip-strip">
      {(Object.entries(cost.essence) as [EssenceType, number][]).map(([type, amount]) => (
        <MaterialChip key={type} material={essenceMaterial(type)} required={amount} held={wallet.essences[type] ?? 0} size={14} />
      ))}
      {(Object.entries(cost.shards) as [PacketId, number][]).map(([packet, amount]) => (
        <MaterialChip key={packet} material={shardMaterial(packet)} required={amount} held={wallet.shards?.[packet] ?? 0} size={14} />
      ))}
    </span>
  );
}

export interface CardShellProps {
  /** The lane's colour, which drives the left edge, the glow and the tie. */
  laneColor: string;
  name: string;
  description: ReactNode;
  state: CardShellState;
  /**
   * What this tile modifies. `adjacent` draws a tick up to the tile above;
   * anything else names the card, because a tick pointing at the wrong column
   * would be a lie.
   */
  tie?: { adjacent: boolean; name: string };
  /** The price strip, rendered only while the tile is unowned. */
  cost?: ReactNode;
  /** A one-line footnote under the price (a discount, an inert warning). */
  note?: string;
  disabled?: boolean;
  /** Tooltip — normally the reason the tile is refusing. */
  title?: string;
  /**
   * The guided tutorial's handle on this tile, when a beat points at it. The
   * shell carries it because the director finds a card by its anchor, and the
   * extraction (W1-D) moved the markup the anchor used to sit on (W1-E). Named
   * `anchor` like `MenuButtons`' own forwarded anchor, which is the spelling
   * `tutorialAnchors.test.ts` looks for on a component that passes one down.
   */
  anchor?: string;
  onClick?: () => void;
}

export function LineageCardShell({
  laneColor, name, description, state, tie, cost, note, disabled, title, anchor, onClick,
}: CardShellProps) {
  return (
    <button
      type="button"
      data-tutorial-anchor={anchor}
      className={`lin-card lin-card--${state}`}
      style={{ '--lane-color': laneColor } as React.CSSProperties}
      disabled={disabled}
      title={title}
      onClick={onClick}
    >
      {tie && (tie.adjacent
        ? <span className="lin-card__tie" aria-hidden="true" />
        : <span className="lin-card__modifies">modifies {tie.name}</span>)}
      <span className="lin-card__top">
        <span className="lin-card__name">{name}</span>
        {state === 'active' && <span className="lin-card__state">active</span>}
        {state === 'owned' && <span className="lin-card__state lin-card__state--dim">owned</span>}
      </span>
      <span className="lin-card__desc">{description}</span>
      {cost}
      {note && <span className="lin-card__discount">{note}</span>}
    </button>
  );
}
