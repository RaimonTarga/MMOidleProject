import { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { composeFormationView, type ClassConfig, type FormationView } from '@mmo-idle/shared';
import {
  biomeLevelAtom,
  bossesClearedAtom,
  classConfigAtom,
  combatArchetypeAtom,
  disciplineIdAtom,
  passivesAtom,
  playerTierAtom,
} from '../../hud/atoms';

/**
 * The local Conduit's Formation, or null for every other class and before a class is picked.
 * Pass a config to read a roster the editor has tried and the server has not stored yet.
 */
export function useFormationView(override?: ClassConfig | null): FormationView | null {
  const combatArchetype = useAtomValue(combatArchetypeAtom);
  const stored = useAtomValue(classConfigAtom);
  const biomeLevel = useAtomValue(biomeLevelAtom);
  const bossesCleared = useAtomValue(bossesClearedAtom);
  const disciplineId = useAtomValue(disciplineIdAtom);
  const playerTier = useAtomValue(playerTierAtom);
  const passives = useAtomValue(passivesAtom);
  // The weapon adds or removes Command, as the server's context reads it.
  const budgetBonus = passives['conduit.command'] ?? 0;
  const classConfig = override === undefined ? stored : override;

  return useMemo(() => composeFormationView({
    combatArchetype,
    classConfig,
    biomeLevel,
    bossesCleared,
    disciplineId,
    playerTier,
    budgetBonus,
  }), [combatArchetype, classConfig, biomeLevel, bossesCleared, disciplineId, playerTier, budgetBonus]);
}
