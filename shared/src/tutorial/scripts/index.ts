import { SKILL_TREE } from '../../data/skillTree';
import type { TutorialBeat, TutorialScript } from '../types';
import { TUTORIAL_OPENING } from './opening';
import { buildConduitBeats } from './conduit';
import { buildSealRouteBeats } from './sealRoute';
import { buildSlingerBeats } from './slinger';
import { buildSpiritBeats } from './spirit';
import { buildSquireBeats } from './squire';
import { buildStrikerBeats } from './striker';
import { buildApprenticeBeats } from './apprentice';
import { buildGearBeats } from './gear';

export { TUTORIAL_FAREWELL } from './farewell';
export { TUTORIAL_OPENING } from './opening';
export { TUTORIAL_SEALS, T1_BIOME_ORDER, type T1Biome } from './plans';
export { buildConduitBeats } from './conduit';
export { buildSealRouteBeats } from './sealRoute';
export { buildSquireBeats } from './squire';
export { buildGearBeats, tutorialStretches } from './gear';
export { TUTORIAL_GEAR_PLANS, type TutorialGearPlan } from './gearPlans';

const scripts = new Map<string, TutorialScript>();

/**
 * Per-class beats after the opening, keyed by class root (`cadence-root`, …).
 * Each class's builder lands with its class track (plan §5.2, task C<c>.6).
 * A class with no builder still gets the seal route; a builder replaces it.
 */
export const TUTORIAL_CLASS_BEATS: Partial<Record<string, () => TutorialBeat[]>> = {
  'cadence-root': buildStrikerBeats,
  'cooldown-root': buildSquireBeats,
  'summoner-root': buildConduitBeats,
  'reload-root': buildSlingerBeats,
  'energy-root': buildSpiritBeats,
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
    // The class's gear (`gearPlans.ts`): its Clearing weapon right after the class pick, then
    // each zone's pieces as the zone opens them.
    const gear = classRoot ? buildGearBeats(classRoot, tail) : null;
    const opening = gear
      ? TUTORIAL_OPENING.beats.flatMap((beat) => (beat.id === 'choose-class' ? [beat, gear.start] : [beat]))
      : TUTORIAL_OPENING.beats;
    script = {
      id: className ? `tutorial-${className}` : TUTORIAL_OPENING.id,
      classRoot,
      beats: [...opening, ...(gear ? gear.beats : tail)],
    };
    scripts.set(key, script);
  }
  return script;
}

/**
 * The class's script as its builders lay it, without the gear beats: what each class's bot
 * routes mirror zone by zone and level by level (the routes carry their own gear steps, and the
 * guide's gear plan is a copy of them). The panel always plays {@link tutorialScriptFor}.
 */
export function tutorialScriptWithoutGear(classRoot: string): TutorialScript {
  const build = TUTORIAL_CLASS_BEATS[classRoot];
  const tail = build ? build() : buildSealRouteBeats();
  const className = SKILL_TREE.get(classRoot)?.name.toLowerCase() ?? classRoot;
  return { id: `tutorial-${className}`, classRoot, beats: [...TUTORIAL_OPENING.beats, ...tail] };
}
