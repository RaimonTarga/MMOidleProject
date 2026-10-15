import type { ClassUnlockNotice } from '@mmo-idle/shared';

const ROMAN = [
  '', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
  'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX',
];

/** Rank as the class screen prints it: 2 is "II". */
export function rankMark(rank: number): string {
  if (Number.isInteger(rank) && rank > 0 && rank < ROMAN.length) return ROMAN[rank];
  return String(rank);
}

/**
 * "Learned: Sweep", "Sweep rank II", "Trophy: Wide Arc", "Wide Arc rank II".
 * The notice's `text` is shown underneath, by the toast.
 */
export function unlockNoticeTitle(notice: ClassUnlockNotice): string {
  if (!notice.isRankUp) {
    return notice.kind === 'trophy' ? `Trophy: ${notice.name}` : `Learned: ${notice.name}`;
  }
  return `${notice.name} rank ${rankMark(notice.rank)}`;
}
