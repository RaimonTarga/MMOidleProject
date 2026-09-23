import { useAtomValue } from 'jotai';
import { ITEM_DATABASE, coreIsActive, coreEligibilityLabel, itemMechanicEffectsAt } from '@mmo-idle/shared';
import {
  attackAtom,
  attackRangeAtom,
  maxHpAtom,
  passivesAtom,
  playerTierAtom,
  combatArchetypeAtom,
  equipmentAtom, itemUpgradesAtom, selectedRangeAtom,
} from '../../hud/atoms';
import type { AbilityContext } from './abilityText';

/**
 * The character state that turns an authored ability into YOUR numbers: the tier
 * that picks its rank, the passives that scale and shorten it, the attack/max-HP
 * it multiplies against, and the attack range an ability's extra reach adds to.
 *
 * A hook rather than a prop drilled from the panel root, because every surface
 * that describes an ability needs exactly the same values and none of them are
 * worth threading through a browser component that knows nothing about abilities.
 */
export function useAbilityContext(): AbilityContext {
  const equipment = useAtomValue(equipmentAtom);
  const upgrades = useAtomValue(itemUpgradesAtom);
  const range = useAtomValue(selectedRangeAtom);
  return {
    equipmentSources: Object.values(equipment).flatMap(id => {
      const item = id ? ITEM_DATABASE.get(id) : undefined;
      if (!item) return [];
      const plus = upgrades[item.id] ?? 0;
      const effects = itemMechanicEffectsAt(item, plus);
      return [{ id: item.id, name: `${item.name}${plus > 0 ? ` +${plus}` : ''}`, effects,
        inactiveReason: item.slot === 'core' && !coreIsActive(item.coreEligibility, range) ? coreEligibilityLabel(item.coreEligibility) : undefined }];
    }),
    playerTier: useAtomValue(playerTierAtom),
    passives: useAtomValue(passivesAtom) ?? {},
    combatArchetype: useAtomValue(combatArchetypeAtom),
    attack: useAtomValue(attackAtom),
    maxHp: useAtomValue(maxHpAtom),
    attackRange: useAtomValue(attackRangeAtom),
  };
}
