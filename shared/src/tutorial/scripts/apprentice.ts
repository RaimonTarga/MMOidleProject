/**
 * The Apprentice's guided T1 (AP6, bible §9.4), built on the seal route.
 * Zone farms stop at the lesson, then the payoff line carries on to the cap.
 * Mountain has no walk in the seal route, so its lesson precedes the boss.
 */
import { LESSON_ZONE_LEVEL } from '../../classKits/kitHelpers';
import type { TutorialBeat } from '../types';
import { TUTORIAL_SEALS } from './plans';
import { buildSealRouteBeats } from './sealRoute';

const LESSONS: Readonly<Record<string, { id: string; say: string }>> = {
  plains: {
    id: 'apprentice-spread-lesson',
    say: 'Spread is learned: full sigils and two or more enemies near means Spread; otherwise Detonate. Keep fighting until the Plains boss is open.',
  },
  forest: {
    id: 'apprentice-numb-lesson',
    say: 'Numb spends a target\'s sigils to slow its attacks and movement.',
  },
  swamp: {
    id: 'apprentice-siphon-lesson',
    say: 'Siphon spends a target\'s sigils to heal you when your health is low.',
  },
  cave: {
    id: 'apprentice-converge-lesson',
    say: 'Converge pulls nearby enemies\' sigils onto your target, even past its cap.',
  },
};

/** Split a seal farm so the payoff line appears when its lesson is learned. */
function splitAtLesson(beat: TutorialBeat): TutorialBeat[] {
  const step = beat.steps[0];
  if (step?.type !== 'farm' || step.until.type !== 'biomeLevelAtLeast') return [beat];
  const biomeGroup = step.until.biomeGroup;
  const lesson = LESSONS[biomeGroup];
  if (!lesson) return [beat];
  return [
    {
      ...beat,
      progress: [{ type: 'biomeLevel', biomeGroup, level: LESSON_ZONE_LEVEL }],
      steps: [{ ...step, until: { type: 'biomeLevelAtLeast', biomeGroup, level: LESSON_ZONE_LEVEL } }],
    },
    {
      id: lesson.id,
      chapter: beat.chapter,
      say: lesson.say,
      waiting: beat.waiting,
      progress: beat.progress,
      steps: beat.steps,
    },
  ];
}

/** Beats after the shared opening; its Clearing equipment stays unchanged. */
export function buildApprenticeBeats(): TutorialBeat[] {
  const [firstSeal, secondSeal] = TUTORIAL_SEALS;
  return buildSealRouteBeats().flatMap((beat): TutorialBeat[] => {
    if (beat.id === `open:${firstSeal}`) {
      return splitAtLesson({
        ...beat,
        say: 'A plain wand. Sigils 4: pips on enemies. In Payoff rules, full means Detonate. The Plains first; fight until their boss is open.',
      });
    }
    if (beat.id === 'zone:forest') {
      return splitAtLesson({
        ...beat,
        say: 'The base kit won your first boss. Outbreak makes Spread reach two neighbours. The Forest fights in fast packs. Cut through it.',
      });
    }
    if (beat.id === `boss:${secondSeal}`) {
      return [
        {
          id: 'apprentice-mountain-approach',
          chapter: beat.chapter,
          say: 'The Mountain hits the hardest. Fight up it.',
          waiting: 'Fighting up the Mountain.',
          progress: [{ type: 'biomeLevel', biomeGroup: secondSeal, level: LESSON_ZONE_LEVEL }],
          steps: [{
            type: 'farm',
            at: { kind: 'biome', biomeGroup: secondSeal, tier: 1 },
            until: {
              type: 'anyOf',
              of: [
                { type: 'biomeLevelAtLeast', biomeGroup: secondSeal, level: LESSON_ZONE_LEVEL },
                { type: 'bossCleared', biomeGroup: secondSeal, tier: 1 },
              ],
            },
          }],
        },
        {
          ...beat,
          say: 'Seize spends a target\'s sigils to stop its wind-up. The Mountain boss is the second seal. Two seals open the next tier. Clear the guards, then the altar.',
        },
      ];
    }
    return splitAtLesson(beat);
  });
}
