/**
 * The Spirit's guided T1 (SP6, bible §11.4), built on the seal route.
 * Farms split at the lesson level so each new piece's line shows when it is
 * learned. Mountain gets its approach before the second seal; the opening,
 * seal ids, zone order and farewell stay the shared route's.
 */
import { LESSON_ZONE_LEVEL } from '../../classKits/kitHelpers';
import type { TutorialBeat } from '../types';
import { buildSealRouteBeats } from './sealRoute';

function sealBeat(beats: readonly TutorialBeat[], id: string): TutorialBeat {
  const beat = beats.find((candidate) => candidate.id === id);
  if (!beat) throw new Error(`spirit tutorial: the seal route has no ${id}`);
  return beat;
}

/** End a seal farm at the lesson, then show its piece while farming to the cap. */
function lessonBeats(beat: TutorialBeat, id: string, say: string): TutorialBeat[] {
  const step = beat.steps[0];
  if (step?.type !== 'farm' || step.until.type !== 'biomeLevelAtLeast') {
    throw new Error(`spirit tutorial: ${beat.id} is not a zone farm`);
  }
  return [
    {
      ...beat,
      progress: [{ type: 'biomeLevel', biomeGroup: step.until.biomeGroup, level: LESSON_ZONE_LEVEL }],
      steps: [{ ...step, until: { ...step.until, level: LESSON_ZONE_LEVEL } }],
    },
    {
      id,
      chapter: beat.chapter,
      say,
      waiting: beat.waiting,
      progress: beat.progress,
      steps: beat.steps,
    },
  ];
}

/** Beats after the shared Clearing opening for an energy-root character. */
export function buildSpiritBeats(): TutorialBeat[] {
  const seal = buildSealRouteBeats();
  const open = sealBeat(seal, 'open:plains');
  const forest = sealBeat(seal, 'zone:forest');

  return [
    ...lessonBeats({
      ...open,
      say: 'A plain rod, Storm 4. The gauge fills itself. One Bolt band, a 30% floor: it gathers to full, then breaks down to the floor. Hits drain the storm before HP.',
      waiting: 'Fighting across the Plains. The storm gathers by itself.',
    }, 'spirit:chain-lightning', 'Chain Lightning is in the top band now. It leaps from the target through the pack. Keep fighting until the Plains boss is open.'),
    {
      ...sealBeat(seal, 'boss:plains'),
      say: 'Your base kit can win this fight. Clear the guards, wake the Plains boss at the altar, and take the first seal. Falling is normal; we try again.',
    },
    ...lessonBeats({
      ...forest,
      say: 'The first boss fell to your base kit. Crosswind now makes each spend strike enemies near its target. The Forest fights in fast packs. Cut through it.',
    }, 'spirit:thunderclap', 'Thunderclap is in a band now. It waits for an enemy to touch you, then staggers every enemy around you.'),
    ...lessonBeats(sealBeat(seal, 'zone:swamp'), 'spirit:downpour', 'Downpour is in a band now. It waits for a poison or bleed on you, then washes it off.'),
    ...lessonBeats(sealBeat(seal, 'zone:cave'), 'spirit:thunderbolt', 'Thunderbolt is in the top band now. One costly bolt hits a single enemy very hard and staggers it.'),
    {
      id: 'spirit:mountain',
      chapter: 'The Mountain',
      say: 'The Mountain hits the hardest. Fight up it.',
      waiting: 'Fighting up the Mountain.',
      progress: [{ type: 'biomeLevel', biomeGroup: 'mountain', level: LESSON_ZONE_LEVEL }],
      steps: [{
        type: 'farm',
        at: { kind: 'biome', biomeGroup: 'mountain', tier: 1 },
        until: {
          type: 'anyOf',
          of: [
            { type: 'biomeLevelAtLeast', biomeGroup: 'mountain', level: LESSON_ZONE_LEVEL },
            { type: 'bossCleared', biomeGroup: 'mountain', tier: 1 },
          ],
        },
      }],
    },
    {
      ...sealBeat(seal, 'boss:mountain'),
      say: 'Eye of the Storm sits at the floor. At or below it, hits drain your storm at half cost. The Mountain boss is the second seal. Clear the guards, then the altar.',
    },
    sealBeat(seal, 'farewell'),
  ];
}
