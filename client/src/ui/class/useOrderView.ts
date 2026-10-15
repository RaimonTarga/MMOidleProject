import { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { composeOrderView, type OrderView } from '@mmo-idle/shared';
import {
  biomeLevelAtom,
  bossesClearedAtom,
  classConfigAtom,
  combatArchetypeAtom,
  disciplineIdAtom,
  playerTierAtom,
} from '../../hud/atoms';

/** The local Striker's Order, or null for every other class and before a class is picked. */
export function useOrderView(): OrderView | null {
  const combatArchetype = useAtomValue(combatArchetypeAtom);
  const classConfig = useAtomValue(classConfigAtom);
  const biomeLevel = useAtomValue(biomeLevelAtom);
  const bossesCleared = useAtomValue(bossesClearedAtom);
  const disciplineId = useAtomValue(disciplineIdAtom);
  const playerTier = useAtomValue(playerTierAtom);

  return useMemo(() => composeOrderView({
    combatArchetype,
    classConfig,
    biomeLevel,
    bossesCleared,
    disciplineId,
    playerTier,
  }), [combatArchetype, classConfig, biomeLevel, bossesCleared, disciplineId, playerTier]);
}
