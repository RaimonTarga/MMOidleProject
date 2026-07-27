import { useAtomValue } from 'jotai';
import { attackAtom, maxHpAtom, passivesAtom, playerTierAtom } from '../../hud/atoms';
import type { AbilityContext } from './abilityText';

/**
 * The character state that turns an authored ability into YOUR numbers: the tier
 * that deepens its magnitudes, the passives that scale and shorten it, and the
 * attack/max-HP it multiplies against.
 *
 * A hook rather than a prop drilled from the panel root, because every surface
 * that describes an ability needs exactly the same four values and none of them
 * are worth threading through a browser component that knows nothing about
 * abilities.
 */
export function useAbilityContext(): AbilityContext {
  return {
    playerTier: useAtomValue(playerTierAtom),
    passives: useAtomValue(passivesAtom) ?? {},
    attack: useAtomValue(attackAtom),
    maxHp: useAtomValue(maxHpAtom),
  };
}
