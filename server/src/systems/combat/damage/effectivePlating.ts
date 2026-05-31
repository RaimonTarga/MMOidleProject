import { getStatusEffect, type TracksCombat } from '@mmo-idle/shared';

/** Sum cadence and reload suppress plating-shred reductions. */
export function effectivePlatingAfterShred(
  basePlating: number,
  monsterState: TracksCombat | undefined,
  extraFlatShred = 0,
): number {
  if (!monsterState) return Math.max(0, basePlating - extraFlatShred);

  const cadenceShred = getStatusEffect(monsterState, 'plating-shred');
  const reloadShred = getStatusEffect(monsterState, 'reload-suppress-shred');
  const shredTotal =
    (cadenceShred?.stacks ?? 0) * (cadenceShred?.data['platingReduction'] ?? 0) +
    (reloadShred?.stacks ?? 0) * (reloadShred?.data['platingReduction'] ?? 0);

  return Math.max(0, basePlating - shredTotal - extraFlatShred);
}
