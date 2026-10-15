import { SLINGER_KIT, SLINGER_LAST_ROUND_COLOR } from '@mmo-idle/shared';

const BY_ID = new Map(SLINGER_KIT.pieces.map((piece) => [piece.id, piece]));

/** The kit colour for a clip id, or null when the id is not a Slinger clip. */
export function slingerClipColor(id: string): string | null {
  if (!id) return null;
  return BY_ID.get(id)?.color ?? null;
}

/** The kit's display name for a clip id. */
export function slingerClipName(id: string): string | null {
  if (!id) return null;
  return BY_ID.get(id)?.name ?? null;
}

/** Trophy rounds on the ring. The kit's `SLINGER_LAST_ROUND_COLOR`. */
export const SLINGER_LAST_ROUND_CSS = SLINGER_LAST_ROUND_COLOR;

/** `#rrggbb` as a Phaser tint, or null when the string is not that form. */
export function cssHex(color: string): number | null {
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) return null;
  return Number.parseInt(color.slice(1), 16);
}
