/**
 * The Striker's guided beats after the opening (CS6, bible §12.4).
 *
 * Built on the seal route: the same zones, the same order, the same two seals
 * and the same farewell. A zone farm that used to run to the tier cap is split
 * at the lesson level, so the new line is the card that comes up when that
 * level lands. The seal beats keep their ids. Mountain has no walk in the seal
 * route (it is the second seal), so a short farm to the Coil lesson is added
 * in front of that boss, and Coil's line is that boss beat.
 */
import type { TutorialBeat, TutorialCondition, TutorialNodeRef } from '../types';
import { buildSealRouteBeats } from './sealRoute';

/**
 * The level within a tier where a zone teaches its technique. Bible §12.4
 * (Sweep around minute 6, Plains level 2) and `LESSON_ZONE_LEVEL`.
 */
const LESSON_LEVEL = 2;

const COMBO_SAY =
  'Four plain swings, then a heavy last hit: your combo. The strip shows it, and the Order on your class screen sets it. The Plains first.';
const SWEEP_SAY =
  'Sweep is on a beat now. A technique beat swings a bit lighter and hits every enemy around you. Keep fighting until their boss is open.';
const TROPHY_SAY =
  'Its trophy is your finisher now. The Order equipped it for you.';
const HAMSTRING_SAY = 'Hamstring is on a beat now. That swing slows the enemy down.';
const REND_SAY = 'Rend is on a beat now. That swing leaves a bleed.';
const FOCUS_SAY =
  'Focus is on a beat now. It opens the combo, and that beat is the cast, not a swing.';
const COIL_SAY =
  'Coil is on a beat now: you wind up, and that beat is the cast, not a swing. The Mountain boss is the second seal. Clear the guards, then the altar.';

function sealBeat(beats: readonly TutorialBeat[], id: string): TutorialBeat {
  const beat = beats.find((candidate) => candidate.id === id);
  if (!beat) throw new Error(`striker tutorial: the seal route has no ${id}`);
  return beat;
}

function asZoneFarm(beat: TutorialBeat): { at: TutorialNodeRef; biomeGroup: string; level: number } {
  const step = beat.steps[0];
  if (step?.type !== 'farm' || step.until.type !== 'biomeLevelAtLeast') {
    throw new Error(`striker tutorial: ${beat.id} is not a zone farm`);
  }
  return { at: step.at, biomeGroup: step.until.biomeGroup, level: step.until.level };
}

/** The seal beat, now ending at `level`, with an optional new line. */
function retarget(beat: TutorialBeat, level: number, patch: Partial<TutorialBeat> = {}): TutorialBeat {
  const farm = asZoneFarm(beat);
  return {
    ...beat,
    ...patch,
    progress: [{ type: 'biomeLevel', biomeGroup: farm.biomeGroup, level }],
    steps: [{
      type: 'farm',
      at: farm.at,
      until: { type: 'biomeLevelAtLeast', biomeGroup: farm.biomeGroup, level },
    }],
  };
}

/** The rest of a seal farm, from the lesson to the cap the seal beat used to wait on. */
function continueToCap(from: TutorialBeat, id: string, say: string, waiting: string): TutorialBeat {
  const farm = asZoneFarm(from);
  return {
    id,
    chapter: from.chapter,
    say,
    waiting,
    progress: [{ type: 'biomeLevel', biomeGroup: farm.biomeGroup, level: farm.level }],
    steps: [{
      type: 'farm',
      at: farm.at,
      until: { type: 'biomeLevelAtLeast', biomeGroup: farm.biomeGroup, level: farm.level },
    }],
  };
}

function mountainApproach(): TutorialBeat {
  const until: TutorialCondition = {
    type: 'anyOf',
    of: [
      { type: 'biomeLevelAtLeast', biomeGroup: 'mountain', level: LESSON_LEVEL },
      { type: 'bossCleared', biomeGroup: 'mountain', tier: 1 },
    ],
  };
  return {
    id: 'striker:mountain',
    chapter: 'The Mountain',
    say: 'The Mountain hits the hardest. Fight up it.',
    waiting: 'Fighting up the Mountain.',
    progress: [{ type: 'biomeLevel', biomeGroup: 'mountain', level: LESSON_LEVEL }],
    steps: [{ type: 'farm', at: { kind: 'biome', biomeGroup: 'mountain', tier: 1 }, until }],
  };
}

/** Beats that follow the opening for a Striker. */
export function buildStrikerBeats(): TutorialBeat[] {
  const seal = buildSealRouteBeats();
  const open = sealBeat(seal, 'open:plains');
  const forest = sealBeat(seal, 'zone:forest');
  const swamp = sealBeat(seal, 'zone:swamp');
  const cave = sealBeat(seal, 'zone:cave');

  return [
    retarget(open, LESSON_LEVEL, {
      say: COMBO_SAY,
      waiting: 'Fighting across the Plains.',
    }),
    continueToCap(open, 'striker:sweep', SWEEP_SAY, 'Fighting in the Plains until the boss is open.'),
    sealBeat(seal, 'boss:plains'),
    retarget(forest, LESSON_LEVEL, { say: `${TROPHY_SAY} ${forest.say}` }),
    continueToCap(forest, 'striker:hamstring', HAMSTRING_SAY, forest.waiting ?? 'Fighting through the Forest.'),
    retarget(swamp, LESSON_LEVEL),
    continueToCap(swamp, 'striker:rend', REND_SAY, swamp.waiting ?? 'Fighting through the Swamp.'),
    retarget(cave, LESSON_LEVEL),
    continueToCap(cave, 'striker:focus', FOCUS_SAY, cave.waiting ?? 'Fighting through the Cave.'),
    mountainApproach(),
    { ...sealBeat(seal, 'boss:mountain'), say: COIL_SAY },
    sealBeat(seal, 'farewell'),
  ];
}
