import { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { composeThresholdsView, type ThresholdsView } from '@mmo-idle/shared';
import {
  biomeLevelAtom,
  bossesClearedAtom,
  classConfigAtom,
  combatArchetypeAtom,
  disciplineIdAtom,
  playerTierAtom,
  specializationIdAtom,
} from '../../hud/atoms';

/** The local Spirit's Thresholds, shared by the editor and the shield beside HP. */
export function useThresholdsView(): ThresholdsView | null {
  const combatArchetype = useAtomValue(combatArchetypeAtom);
  const classConfig = useAtomValue(classConfigAtom);
  const biomeLevel = useAtomValue(biomeLevelAtom);
  const bossesCleared = useAtomValue(bossesClearedAtom);
  const disciplineId = useAtomValue(disciplineIdAtom);
  const playerTier = useAtomValue(playerTierAtom);
  const specializationId = useAtomValue(specializationIdAtom);

  return useMemo(() => composeThresholdsView({
    combatArchetype,
    classConfig,
    biomeLevel,
    bossesCleared,
    disciplineId,
    specializationId,
    playerTier,
  }), [combatArchetype, classConfig, biomeLevel, bossesCleared, disciplineId, specializationId, playerTier]);
}
