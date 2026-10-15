import { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { composePayoffsView, type ClassConfig } from '@mmo-idle/shared';
import {
  biomeLevelAtom,
  bossesClearedAtom,
  classConfigAtom,
  combatArchetypeAtom,
  disciplineIdAtom,
  playerTierAtom,
  specializationIdAtom,
} from '../../hud/atoms';

/** The local Apprentice's Payoff rules, using the shell's config when supplied. */
export function usePayoffsView(config?: ClassConfig | null) {
  const combatArchetype = useAtomValue(combatArchetypeAtom);
  const liveConfig = useAtomValue(classConfigAtom);
  const biomeLevel = useAtomValue(biomeLevelAtom);
  const bossesCleared = useAtomValue(bossesClearedAtom);
  const disciplineId = useAtomValue(disciplineIdAtom);
  const playerTier = useAtomValue(playerTierAtom);
  const specializationId = useAtomValue(specializationIdAtom);
  const classConfig = config === undefined ? liveConfig : config;

  return useMemo(() => composePayoffsView({
    combatArchetype,
    classConfig,
    biomeLevel,
    bossesCleared,
    disciplineId,
    specializationId,
    playerTier,
  }), [combatArchetype, classConfig, biomeLevel, bossesCleared, disciplineId, specializationId, playerTier]);
}
