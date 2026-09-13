/**
 * Keep fractional catalyst accounting authoritative while presenting the
 * completed whole progress points. Flooring avoids showing 100 before the
 * server has actually crossed the mint threshold.
 */
export function displayedCatalystProgress(progress: number | undefined): number {
  return Math.floor(Math.max(0, progress ?? 0));
}
