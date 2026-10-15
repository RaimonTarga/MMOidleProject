/**
 * The Conduit's guided beats after the opening (CD7, bible §7.4).
 *
 * Built on the seal route: the same zones, the same order, the same two seals
 * and the same farewell. A zone farm that used to run to the tier cap is split
 * at the lesson level, so the new line is the card that comes up when that
 * specialist binds. The seal beats keep their ids. Mountain has no walk in the
 * seal route (it is the second seal), so a short farm to the Ridge Marksman
 * lesson is added in front of that boss, and the Marksman's line is that boss
 * beat. The first Soul shares the Forest card, which is the one that comes up
 * when the Plains boss dies.
 */
import { LESSON_ZONE_LEVEL } from '../../classKits/kitHelpers';
import type { TutorialBeat, TutorialCondition, TutorialNodeRef } from '../types';
import { buildSealRouteBeats } from './sealRoute';

const OPEN_SAY =
  'Command is four pips, filled by four Thralls. The roster and the orders are on your class screen, and Recall is on R. The Plains first.';
const WARDEN_SAY =
  'The Plains Warden is bound. It taunts the enemies around it. Keep fighting until their boss is open.';
const SOUL_SAY = 'Its Soul sits in the relic slot: a free extra body.';
const THORN_SAY = 'Thornrunner is bound: a fast bruiser with little health.';
const BILE_SAY = 'Bile Spitter is bound. Its acid strips the plating off what it hits.';
const BRUTE_SAY = 'Cave Brute is bound. It costs two Command, and it soaks the hits that come at you.';
const MARKSMAN_SAY =
  'Ridge Marksman is bound: a heavy shot from the back row. The Mountain boss is the second seal. Two seals open the next tier. Clear the guards, then the altar.';

function sealBeat(beats: readonly TutorialBeat[], id: string): TutorialBeat {
  const beat = beats.find((candidate) => candidate.id === id);
  if (!beat) throw new Error(`conduit tutorial: the seal route has no ${id}`);
  return beat;
}

function asZoneFarm(beat: TutorialBeat): { at: TutorialNodeRef; biomeGroup: string; level: number } {
  const step = beat.steps[0];
  if (step?.type !== 'farm' || step.until.type !== 'biomeLevelAtLeast') {
    throw new Error(`conduit tutorial: ${beat.id} is not a zone farm`);
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
      { type: 'biomeLevelAtLeast', biomeGroup: 'mountain', level: LESSON_ZONE_LEVEL },
      { type: 'bossCleared', biomeGroup: 'mountain', tier: 1 },
    ],
  };
  return {
    id: 'conduit:mountain',
    chapter: 'The Mountain',
    say: 'The Mountain hits the hardest. Fight up it.',
    waiting: 'Fighting up the Mountain.',
    progress: [{ type: 'biomeLevel', biomeGroup: 'mountain', level: LESSON_ZONE_LEVEL }],
    steps: [{ type: 'farm', at: { kind: 'biome', biomeGroup: 'mountain', tier: 1 }, until }],
  };
}

/** Beats that follow the opening for a Conduit. */
export function buildConduitBeats(): TutorialBeat[] {
  const seal = buildSealRouteBeats();
  const open = sealBeat(seal, 'open:plains');
  const forest = sealBeat(seal, 'zone:forest');
  const swamp = sealBeat(seal, 'zone:swamp');
  const cave = sealBeat(seal, 'zone:cave');

  return [
    retarget(open, LESSON_ZONE_LEVEL, {
      say: OPEN_SAY,
      waiting: 'Fighting in the Plains. Your Thralls are out.',
    }),
    continueToCap(open, 'conduit:warden', WARDEN_SAY, 'Fighting in the Plains until the boss is open.'),
    sealBeat(seal, 'boss:plains'),
    retarget(forest, LESSON_ZONE_LEVEL, { say: `${SOUL_SAY} ${forest.say}` }),
    continueToCap(forest, 'conduit:thornrunner', THORN_SAY, forest.waiting ?? 'Fighting through the Forest.'),
    retarget(swamp, LESSON_ZONE_LEVEL),
    continueToCap(swamp, 'conduit:bile-spitter', BILE_SAY, swamp.waiting ?? 'Fighting through the Swamp.'),
    retarget(cave, LESSON_ZONE_LEVEL),
    continueToCap(cave, 'conduit:cave-brute', BRUTE_SAY, cave.waiting ?? 'Fighting through the Cave.'),
    mountainApproach(),
    { ...sealBeat(seal, 'boss:mountain'), say: MARKSMAN_SAY },
    sealBeat(seal, 'farewell'),
  ];
}
