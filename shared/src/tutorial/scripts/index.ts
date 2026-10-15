import { SKILL_TREE } from '../../data/skillTree';
import type { TutorialBeat, TutorialScript } from '../types';
import { TUTORIAL_OPENING } from './opening';
import { buildSealRouteBeats } from './sealRoute';
import { buildSquireBeats } from './squire';
import { buildStrikerBeats } from './striker';
import { buildApprenticeBeats } from './apprentice';

export { TUTORIAL_FAREWELL } from './farewell';
export { TUTORIAL_OPENING } from './opening';
export { TUTORIAL_SEALS, T1_BIOME_ORDER, type T1Biome } from './plans';
export { buildSealRouteBeats } from './sealRoute';
export { buildSquireBeats } from './squire';

const scripts = new Map<string, TutorialScript>();

/**
 * Per-class beats after the opening, keyed by class root (`cadence-root`, …).
 * Each class's builder lands with its class track (plan §5.2, task C<c>.6).
 * A class with no builder still gets the seal route; a builder replaces it.
 */
export const TUTORIAL_CLASS_BEATS: Partial<Record<string, () => TutorialBeat[]>> = {
  'cadence-root': buildStrikerBeats,
  'cooldown-root': buildSquireBeats,
  'dot-root': buildApprenticeBeats,
};

/**
 * The whole guided route for one class, as ONE script so supersession sees
 * every later step: the shared opening, then that class's own beats if a
 * builder is registered, otherwise the seal route.
 *
 * Before a class is picked, the seal route still follows the opening. The id
 * stays `tutorial-<class>` (the skill-tree name, lowercased).
 */
export function tutorialScriptFor(classRoot: string | null): TutorialScript {
  const key = classRoot ?? '';
  let script = scripts.get(key);
  if (!script) {
    const build = classRoot ? TUTORIAL_CLASS_BEATS[classRoot] : undefined;
    const tail = build ? build() : buildSealRouteBeats();
    const className = classRoot
      ? (SKILL_TREE.get(classRoot)?.name.toLowerCase() ?? classRoot)
      : null;
    script = {
      id: className ? `tutorial-${className}` : TUTORIAL_OPENING.id,
      classRoot,
      beats: [...TUTORIAL_OPENING.beats, ...tail],
    };
    scripts.set(key, script);
  }
  return script;
}
