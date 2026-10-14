import { useAtomValue } from 'jotai';
import {
  biomeLevelAtom,
  biomeXPAtom,
  equipmentAtom,
  attunedAbilitiesAtom,
  essencesAtom,
  globalMasteryAtom,
  inventoryAtom,
  knownAbilitiesAtom,
  passivesAtom,
  playerTierAtom,
  questProgressAtom,
  runesOwnedAtom,
  skillPointsAtom,
  unlockedRecipesAtom,
} from './atoms';
import { resolveSystemVisibility, type SystemVisibility } from './systemVisibility';

/**
 * The §16 staged arc, resolved once from authoritative state.
 *
 * Every surface that gates on the arc reads it through here rather than
 * assembling its own input object — three call sites had already drifted into
 * three slightly different sets of signals, which is how a gate ends up
 * disagreeing with the wake that is supposed to announce it.
 */
export function useSystemVisibility(): SystemVisibility {
  return resolveSystemVisibility({
    playerTier: useAtomValue(playerTierAtom),
    globalMastery: useAtomValue(globalMasteryAtom),
    knownAbilities: useAtomValue(knownAbilitiesAtom),
    attunedAbilities: useAtomValue(attunedAbilitiesAtom),
    essences: useAtomValue(essencesAtom),
    unlockedRecipes: useAtomValue(unlockedRecipesAtom),
    skillPoints: useAtomValue(skillPointsAtom),
    passives: useAtomValue(passivesAtom),
    biomeXP: useAtomValue(biomeXPAtom),
    biomeLevel: useAtomValue(biomeLevelAtom),
    questProgress: useAtomValue(questProgressAtom),
    inventory: useAtomValue(inventoryAtom),
    hasEquipment: Object.values(useAtomValue(equipmentAtom)).some((id) => !!id),
    runesOwned: useAtomValue(runesOwnedAtom),
  });
}
