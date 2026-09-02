import { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { TEST_ROOM_NODE_ID } from '@mmo-idle/shared';
import {
  biomeLevelAtom,
  bossesClearedAtom,
  combatArchetypeAtom,
  equipmentAtom,
  inventoryAtom,
  knownAbilitiesAtom,
  knownRitesAtom,
  knownStancesAtom,
  playerNodeIdAtom,
  runesOwnedAtom,
  unlockedRecipesAtom,
} from '../../hud/atoms';
import { buildMakeEntries, type MakeEntry } from './makeEntries';

/**
 * Everything the player could make right now, from every recipe database.
 *
 * A hook because two surfaces need it: the craft list renders it, and the rail
 * counts how much of it is new — and the rail has to know that while the craft
 * dialog is closed, so it cannot be told by the list.
 */
export function useMakeEntries(): MakeEntry[] {
  const nodeId = useAtomValue(playerNodeIdAtom);
  const unlockedRecipeIds = useAtomValue(unlockedRecipesAtom);
  const inventory = useAtomValue(inventoryAtom);
  const equipment = useAtomValue(equipmentAtom);
  const knownAbilities = useAtomValue(knownAbilitiesAtom);
  const knownStances = useAtomValue(knownStancesAtom);
  const knownRites = useAtomValue(knownRitesAtom);
  const ownedRunes = useAtomValue(runesOwnedAtom);
  const biomeLevel = useAtomValue(biomeLevelAtom);
  const bossesCleared = useAtomValue(bossesClearedAtom);
  const combatArchetype = useAtomValue(combatArchetypeAtom);

  const equippedSet = useMemo(
    () => new Set(Object.values(equipment).filter((id): id is string => id !== null)),
    [equipment],
  );
  const ownedGearIds = useMemo(
    () => new Set([...inventory, ...equippedSet]),
    [inventory, equippedSet],
  );

  const isTestRoom = nodeId === TEST_ROOM_NODE_ID;

  return useMemo(() => buildMakeEntries({
    unlockedRecipeIds,
    ownedGearIds,
    equippedGearIds: equippedSet,
    knownAbilities,
    knownStances,
    knownRites,
    ownedRunes,
    biomeLevel,
    bossesCleared,
    isTestRoom,
    combatArchetype,
  }), [
    unlockedRecipeIds, ownedGearIds, equippedSet, knownAbilities, knownStances,
    knownRites, ownedRunes, biomeLevel, bossesCleared, isTestRoom, combatArchetype,
  ]);
}

/**
 * The keys newness is measured against: what you can actually make. A recipe
 * whose gate is still closed has not arrived yet, so it must not badge as new
 * and then quietly stop being new the moment it unlocks.
 */
export function eligibleMakeKeys(entries: readonly MakeEntry[]): string[] {
  return entries.filter((entry) => entry.unlocked).map((entry) => entry.key);
}
