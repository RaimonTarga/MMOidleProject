import type { TutorialScript } from '../types';
import { TUTORIAL_OPENING } from './opening';

export { TUTORIAL_FAREWELL } from './farewell';
export { TUTORIAL_OPENING } from './opening';
export {
  TUTORIAL_CLASS_PLANS,
  TUTORIAL_SEALS,
  T1_BIOME_ORDER,
  type TutorialClassPlan,
  type T1Biome,
} from './plans';
export { tutorialRunes, type TutorialMovement, type TutorialRuneStage } from './runes';

/**
 * The whole guided route for one class. The class scripts taught the weapon
 * lineage trees and went with them (class-first rework D1); until each class's
 * own beats land, every class, and a character with no class yet, gets the
 * opening alone.
 */
export function tutorialScriptFor(_classRoot: string | null): TutorialScript {
  return TUTORIAL_OPENING;
}
