import { useAtomValue } from 'jotai';
import {
  activeStanceAtom,
  biomeLevelAtom,
  biomeXPAtom,
  catalystProgressAtom,
  catalystsAtom,
  equipmentAtom,
  equippedAbilitiesAtom,
  equippedRitesAtom,
  equippedStancesAtom,
  essencesAtom,
  globalMasteryAtom,
  inventoryAtom,
  knownAbilitiesAtom,
  knownRitesAtom,
  knownStancesAtom,
  passivesAtom,
  playerTierAtom,
  questProgressAtom,
  runeRecipesCraftedAtom,
  runesOwnedAtom,
  skillPointsAtom,
  unlockedRecipesAtom,
  visitedNodesAtom,
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
    equippedAbilities: useAtomValue(equippedAbilitiesAtom),
    knownStances: useAtomValue(knownStancesAtom),
    equippedStances: useAtomValue(equippedStancesAtom),
    activeStance: useAtomValue(activeStanceAtom),
    knownRites: useAtomValue(knownRitesAtom),
    equippedRites: useAtomValue(equippedRitesAtom),
    essences: useAtomValue(essencesAtom),
    catalysts: useAtomValue(catalystsAtom),
    catalystProgress: useAtomValue(catalystProgressAtom),
    unlockedRecipes: useAtomValue(unlockedRecipesAtom),
    runeRecipesCrafted: useAtomValue(runeRecipesCraftedAtom),
    visitedNodes: useAtomValue(visitedNodesAtom),
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
