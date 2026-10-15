import { useMemo, useSyncExternalStore } from 'react';
import { useAtomValue } from 'jotai';
import { composeClassScreenView, type ClassScreenView } from '@mmo-idle/shared';
import {
  biomeLevelAtom,
  bossesClearedAtom,
  classConfigAtom,
  combatArchetypeAtom,
  disciplineIdAtom,
  playerIdAtom,
  playerTierAtom,
  specializationIdAtom,
} from '../../hud/atoms';
import { classScreenSeenFor, subscribeClassScreenSeen } from './seen';

function useClassScreenSeen(playerId: string | null): ReadonlySet<string> | undefined {
  return useSyncExternalStore(
    subscribeClassScreenSeen,
    () => classScreenSeenFor(playerId),
  );
}

export interface ClassScreenState {
  /** Null until a class is picked. */
  view: ClassScreenView | null;
  hasNew: boolean;
  newCount: number;
}

/** The class screen for the local character, including which cards are still new. */
export function useClassScreen(): ClassScreenState {
  const playerId = useAtomValue(playerIdAtom);
  const combatArchetype = useAtomValue(combatArchetypeAtom);
  const classConfig = useAtomValue(classConfigAtom);
  const biomeLevel = useAtomValue(biomeLevelAtom);
  const bossesCleared = useAtomValue(bossesClearedAtom);
  const disciplineId = useAtomValue(disciplineIdAtom);
  const specializationId = useAtomValue(specializationIdAtom);
  const playerTier = useAtomValue(playerTierAtom);
  const seen = useClassScreenSeen(playerId);

  const view = useMemo(() => composeClassScreenView({
    combatArchetype,
    classConfig,
    biomeLevel,
    bossesCleared,
    disciplineId,
    specializationId,
    playerTier,
  }, seen), [
    combatArchetype,
    classConfig,
    biomeLevel,
    bossesCleared,
    disciplineId,
    specializationId,
    playerTier,
    seen,
  ]);

  const newCount = view
    ? view.pieces.filter((piece) => piece.isNew).length + view.trophies.filter((trophy) => trophy.isNew).length
    : 0;

  return { view, hasNew: newCount > 0, newCount };
}
