import { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { APPRENTICE_KIT, composePayoffsView, type ClassConfig } from '@mmo-idle/shared';
import {
  biomeLevelAtom,
  bossesClearedAtom,
  classConfigAtom,
  combatArchetypeAtom,
  disciplineIdAtom,
  playerTierAtom,
  specializationIdAtom,
  unlockedSkillsAtom,
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
  const unlockedSkills = useAtomValue(unlockedSkillsAtom);
  const leafId = useMemo(() => APPRENTICE_KIT.leaves.find((leaf) => leaf.disciplineId === disciplineId && unlockedSkills.includes(leaf.id))?.id ?? null, [disciplineId, unlockedSkills]);
  const classConfig = config === undefined ? liveConfig : config;

  return useMemo(() => composePayoffsView({
    combatArchetype,
    classConfig,
    biomeLevel,
    bossesCleared,
    disciplineId,
    specializationId,
    leafId,
    playerTier,
  }), [combatArchetype, classConfig, biomeLevel, bossesCleared, disciplineId, specializationId, leafId, playerTier]);
}
