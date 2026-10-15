/**
 * The Slinger's guided beats after the opening (CL6, bible §10.4).
 *
 * Built on the seal route: the same zones, the same order, the same two seals
 * and the same farewell. A zone farm that used to run to the tier cap is split
 * at the lesson level, so the new line is the card that comes up when that
 * level lands. The seal beats keep their ids. Mountain has no walk in the seal
 * route (it is the second seal), so a short farm to the Stopping lesson is
 * added in front of that boss, and Stopping's line is that boss beat.
 */
import { LESSON_ZONE_LEVEL } from '../../classKits/kitHelpers';
import type { TutorialBeat, TutorialCondition, TutorialNodeRef } from '../types';
import { buildSealRouteBeats } from './sealRoute';

const PISTOL_SAY =
  'A plain pistol, and the ammo ring around you. You reload when the clip is empty, and you stand still while you reload. The Plains first.';
const SCATTER_SAY =
  'Scatter is on: three or more enemies near you, and each round nicks the ones beside your target. Keep fighting until their boss is open.';
const PLAIN_LAST_SAY =
  'The Plains boss is open. A plain last round still ends the clip. Clear the guards, wake it at the altar, and take the first seal. Falling is normal; we just try again.';
const STAMPEDE_SAY =
  'Its trophy, Stampede Round, is the last round of every clip now. It was equipped for you.';
const SNARE_SAY =
  'Snare is on: a fast enemy closing on you, and each round slows its movement and attacks a little.';
const VENOM_SAY =
  'Venom is on: an elite or a boss, and each round poisons the target.';
const BREACHING_SAY =
  'Breaching is on: a plated target, and each round ignores most of its plating.';
const STOPPING_SAY =
  'Stopping is on: a charge coming at you, and each round shoves it back a little. The Mountain boss is the second seal. Clear the guards, then the altar.';

function sealBeat(beats: readonly TutorialBeat[], id: string): TutorialBeat {
  const beat = beats.find((candidate) => candidate.id === id);
  if (!beat) throw new Error(`slinger tutorial: the seal route has no ${id}`);
  return beat;
}

function asZoneFarm(beat: TutorialBeat): { at: TutorialNodeRef; biomeGroup: string; level: number } {
  const step = beat.steps[0];
  if (step?.type !== 'farm' || step.until.type !== 'biomeLevelAtLeast') {
    throw new Error(`slinger tutorial: ${beat.id} is not a zone farm`);
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
    id: 'slinger:mountain',
    chapter: 'The Mountain',
    say: 'The Mountain hits the hardest. Fight up it.',
    waiting: 'Fighting up the Mountain.',
    progress: [{ type: 'biomeLevel', biomeGroup: 'mountain', level: LESSON_ZONE_LEVEL }],
    steps: [{ type: 'farm', at: { kind: 'biome', biomeGroup: 'mountain', tier: 1 }, until }],
  };
}

/** Beats that follow the opening for a Slinger. */
export function buildSlingerBeats(): TutorialBeat[] {
  const seal = buildSealRouteBeats();
  const open = sealBeat(seal, 'open:plains');
  const forest = sealBeat(seal, 'zone:forest');
  const swamp = sealBeat(seal, 'zone:swamp');
  const cave = sealBeat(seal, 'zone:cave');

  return [
    retarget(open, LESSON_ZONE_LEVEL, {
      say: PISTOL_SAY,
      waiting: 'Fighting across the Plains.',
    }),
    continueToCap(open, 'slinger:scatter', SCATTER_SAY, 'Fighting in the Plains until the boss is open.'),
    { ...sealBeat(seal, 'boss:plains'), say: PLAIN_LAST_SAY },
    retarget(forest, LESSON_ZONE_LEVEL, { say: `${STAMPEDE_SAY} ${forest.say}` }),
    continueToCap(forest, 'slinger:snare', SNARE_SAY, forest.waiting ?? 'Fighting through the Forest.'),
    retarget(swamp, LESSON_ZONE_LEVEL),
    continueToCap(swamp, 'slinger:venom', VENOM_SAY, swamp.waiting ?? 'Fighting through the Swamp.'),
    retarget(cave, LESSON_ZONE_LEVEL),
    continueToCap(cave, 'slinger:breaching', BREACHING_SAY, cave.waiting ?? 'Fighting through the Cave.'),
    mountainApproach(),
    { ...sealBeat(seal, 'boss:mountain'), say: STOPPING_SAY },
    sealBeat(seal, 'farewell'),
  ];
}
