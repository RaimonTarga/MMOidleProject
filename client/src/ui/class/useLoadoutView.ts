import { useCallback, useMemo } from 'react';
import { useAtomValue } from 'jotai';
import {
  composeLoadoutView,
  type ClassConfig,
  type ClassScreenInput,
  type LoadoutView,
} from '@mmo-idle/shared';
import {
  biomeLevelAtom,
  bossesClearedAtom,
  classConfigAtom,
  combatArchetypeAtom,
  disciplineIdAtom,
  playerTierAtom,
} from '../../hud/atoms';

function useLoadoutInput(): ClassScreenInput {
  const combatArchetype = useAtomValue(combatArchetypeAtom);
  const classConfig = useAtomValue(classConfigAtom);
  const biomeLevel = useAtomValue(biomeLevelAtom);
  const bossesCleared = useAtomValue(bossesClearedAtom);
  const disciplineId = useAtomValue(disciplineIdAtom);
  const playerTier = useAtomValue(playerTierAtom);

  return useMemo(() => ({
    combatArchetype,
    classConfig,
    biomeLevel,
    bossesCleared,
    disciplineId,
    playerTier,
  }), [biomeLevel, bossesCleared, classConfig, combatArchetype, disciplineId, playerTier]);
}

/** The local Slinger's Loadout, and the validator's reasons for a config that has not been sent. */
export function useLoadoutEditor(): {
  loadout: LoadoutView | null;
  problemsFor: (config: ClassConfig) => string[];
} {
  const input = useLoadoutInput();
  const loadout = useMemo(() => composeLoadoutView(input), [input]);
  const problemsFor = useCallback((config: ClassConfig) => (
    composeLoadoutView({ ...input, classConfig: config })?.problems ?? []
  ), [input]);
  return { loadout, problemsFor };
}
