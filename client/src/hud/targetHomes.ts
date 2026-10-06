/**
 * The target frame's three fixed homes (design §26.4, the UI prototypes' thesis D):
 * what the target OWES (every damage-over-time record on it), how it is SLOWED,
 * how it is HELD. Each home is always drawn, empty or not, so the eye learns where
 * each fact lives and nothing reflows when a badge appears. One badge per effect;
 * the number is the damage still owed (a DoT) or the seconds left (a hold).
 *
 * Which home a status lives in is the SHARED classification the server's two
 * condition moments read (`isAfflictionStatusId`, `holdKindOfStatusId`), so the
 * frame can never call a target held or afflicted that the server does not.
 *
 * Pure data — no React — so the partition is testable without a DOM.
 */
import {
  holdKindOfStatusId,
  isAfflictionStatusId,
  weaponDotProfileForEffect,
  type TargetStatusView,
} from '@mmo-idle/shared';

export type TargetHome = 'owes' | 'slowed' | 'held';

/** The homes, in the order they are drawn. */
export const TARGET_HOMES: readonly { home: TargetHome; caption: string }[] = [
  { home: 'owes', caption: 'Owes' },
  { home: 'slowed', caption: 'Slowed' },
  { home: 'held', caption: 'Held' },
];

/** The home a raw target status lives in, or undefined for the ordinary strip. */
export function targetHomeOf(statusId: string): TargetHome | undefined {
  if (isAfflictionStatusId(statusId)) return 'owes';
  return holdKindOfStatusId(statusId);
}

/** 999 → "999", 1234 → "1.2k", 23456 → "23k". */
export function compactAmount(n: number): string {
  const v = Math.max(0, Math.round(n));
  if (v < 1000) return String(v);
  if (v < 10_000) return `${(v / 1000).toFixed(1)}k`;
  return `${Math.round(v / 1000)}k`;
}

/** Seconds left on a hold: "1.4s" under ten seconds, "12s" above, "" when spent. */
export function holdSeconds(remainingMs: number): string {
  if (remainingMs < 0) return '∞';
  if (remainingMs <= 0) return '';
  if (remainingMs >= 10_000) return `${Math.ceil(remainingMs / 1000)}s`;
  return `${(remainingMs / 1000).toFixed(1)}s`;
}

/**
 * What a home badge reads: the damage a DoT still owes (the server's `owed`, or a
 * reservoir's banked pool when the owner is gone), the seconds a hold has left.
 */
export function homeBadgeNumber(
  home: TargetHome,
  status: Pick<TargetStatusView, 'id' | 'stacks' | 'remainingMs' | 'owed'>,
): string {
  if (home === 'owes') {
    if (status.owed !== undefined) return compactAmount(status.owed);
    return weaponDotProfileForEffect(status.id) !== undefined ? compactAmount(status.stacks) : '';
  }
  return holdSeconds(status.remainingMs);
}
