import {
  getStatusEffect,
  BRITTLE_EFFECT_ID,
  type TracksCombat,
} from '@mmo-idle/shared';

/** Total active brittle plating-and-DR reduction from a monster's brittle stacks. */
function brittleReduction(monsterState: TracksCombat): {
  plating: number;
  dr: number;
} {
  const brittle = getStatusEffect(monsterState, BRITTLE_EFFECT_ID);
  if (!brittle) return { plating: 0, dr: 0 };
  return {
    plating: brittle.stacks * (brittle.data['platingPerStack'] ?? 0),
    dr: brittle.stacks * (brittle.data['drPerStack'] ?? 0),
  };
}

/** Sum cadence/reload plating-shred and brittle plating-shred reductions. */
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

  return Math.max(
    0,
    basePlating - shredTotal - brittleReduction(monsterState).plating - extraFlatShred,
  );
}

/** Reduce a monster's damage-reduction fraction by its active brittle stacks (floored at 0). */
export function effectiveDamageReductionAfterBrittle(
  baseDr: number,
  monsterState: TracksCombat | undefined,
): number {
  if (!monsterState) return baseDr;
  return Math.max(0, baseDr - brittleReduction(monsterState).dr);
}
