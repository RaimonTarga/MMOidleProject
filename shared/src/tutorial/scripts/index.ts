import type { TutorialScript } from '../types';
import { buildClassBeats } from './classScript';
import { TUTORIAL_OPENING } from './opening';
import { TUTORIAL_CLASS_PLANS } from './plans';

export { TUTORIAL_OPENING } from './opening';
export { TUTORIAL_CLASS_PLANS, TUTORIAL_SEALS, type TutorialClassPlan } from './plans';
export { tutorialRunes, type TutorialMovement, type TutorialRuneStage } from './runes';

const scripts = new Map<string, TutorialScript>();

/**
 * The whole guided route for one class: the shared opening, then the class's
 * own beats, as ONE script so supersession sees every later step. Before a
 * class is picked (or for a class with no plan) it is the opening alone.
 */
export function tutorialScriptFor(classRoot: string | null): TutorialScript {
  const plan = classRoot ? TUTORIAL_CLASS_PLANS.find((p) => p.classRoot === classRoot) : undefined;
  if (!plan) return TUTORIAL_OPENING;
  let script = scripts.get(plan.classRoot);
  if (!script) {
    script = {
      id: `tutorial-${plan.className.toLowerCase()}`,
      classRoot: plan.classRoot,
      beats: [...TUTORIAL_OPENING.beats, ...buildClassBeats(plan)],
    };
    scripts.set(plan.classRoot, script);
  }
  return script;
}
