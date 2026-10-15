/**
 * The Squire's guided T1 (bible §8.4), built on the seal route.
 *
 * Same zones, order, seals and farewell. The class lines sit where the zone
 * actually teaches the response: the previous farm ends at the lesson level
 * (`LESSON_ZONE_LEVEL`, the second level, around minute 6), and the next line
 * is the response they now have. Plains and the walked zones still finish at
 * the tier cap before the route moves on. Mountain is farmed only to the
 * lesson, so Guard is learned before the second seal.
 *
 * A line with no unfinished step never shows (resume skips a beat whose steps
 * are already true). The Toadeater line is therefore the say on that boss
 * fight: the guide says the three answers, then takes the fight.
 */
import { biomeLevelCap } from '../../config/gameConfig';
import { LESSON_ZONE_LEVEL } from '../../classKits/kitHelpers';
import type { TutorialBeat, TutorialNodeRef } from '../types';
import { TUTORIAL_SEALS, type T1Biome } from './plans';
import { buildSealRouteBeats } from './sealRoute';

const CHAPTER: Record<T1Biome, string> = {
  plains: 'The Plains',
  forest: 'The Forest',
  swamp: 'The Swamp',
  mountain: 'The Mountain',
  cave: 'The Cave',
};

function zoneRef(biome: T1Biome): TutorialNodeRef {
  return { kind: 'biome', biomeGroup: biome, tier: 1 };
}

function capOf(biome: T1Biome): number {
  return biomeLevelCap(1, biome);
}

/** Point one seal-route farm at a different level of the same zone. */
function retarget(beat: TutorialBeat, level: number): TutorialBeat {
  const step = beat.steps[0];
  if (step?.type !== 'farm' || step.until.type !== 'biomeLevelAtLeast') {
    throw new Error(`squire tutorial: ${beat.id} is not a zone farm`);
  }
  return {
    ...beat,
    progress: [{ type: 'biomeLevel', biomeGroup: step.until.biomeGroup, level }],
    steps: [{
      ...step,
      until: { type: 'biomeLevelAtLeast', biomeGroup: step.until.biomeGroup, level },
    }],
  };
}

function farmBeat(
  id: string,
  biome: T1Biome,
  level: number,
  say: string,
  waiting: string,
): TutorialBeat {
  return {
    id,
    chapter: CHAPTER[biome],
    say,
    waiting,
    progress: [{ type: 'biomeLevel', biomeGroup: biome, level }],
    steps: [{
      type: 'farm',
      at: zoneRef(biome),
      until: { type: 'biomeLevelAtLeast', biomeGroup: biome, level },
    }],
  };
}

function insertAfter(beats: readonly TutorialBeat[], id: string, extra: TutorialBeat[]): TutorialBeat[] {
  const index = beats.findIndex((beat) => beat.id === id);
  if (index < 0) throw new Error(`squire tutorial: missing seal beat ${id}`);
  return [...beats.slice(0, index + 1), ...extra, ...beats.slice(index + 1)];
}

function insertBefore(beats: readonly TutorialBeat[], id: string, extra: TutorialBeat[]): TutorialBeat[] {
  const index = beats.findIndex((beat) => beat.id === id);
  if (index < 0) throw new Error(`squire tutorial: missing seal beat ${id}`);
  return [...beats.slice(0, index), ...extra, ...beats.slice(index)];
}

const [FIRST_SEAL, SECOND_SEAL] = TUTORIAL_SEALS;

/**
 * Beats after the shared opening. The seal route's own beats stay, in order;
 * these lines are the Squire's.
 */
export function buildSquireBeats(): TutorialBeat[] {
  let beats = buildSealRouteBeats().map((beat) => {
    if (beat.id === `open:${FIRST_SEAL}`) {
      return {
        ...retarget(beat, LESSON_ZONE_LEVEL),
        say: 'The Plains first: fight there until their boss is open. Resolve is four pips. Hits fill them, a crowd trickles in more, and a full bar slams everything around you.',
        waiting: 'Fighting in the Plains. Hits fill your Resolve.',
      };
    }
    if (beat.id === 'zone:forest') {
      return {
        ...retarget(beat, LESSON_ZONE_LEVEL),
        say: 'The Plains boss fell to your base kit. Muster fills Resolve when an enemy joins the fight. The Forest fights in fast packs. Cut through it.',
      };
    }
    if (beat.id === 'zone:swamp' || beat.id === 'zone:cave') return retarget(beat, LESSON_ZONE_LEVEL);
    if (beat.id === `boss:${SECOND_SEAL}`) {
      return {
        ...beat,
        say: 'Guard braces you against a telegraphed blow. The Mountain boss is the second seal. Two seals open the next tier. Clear the guards, then the altar.',
      };
    }
    return beat;
  });

  beats = insertAfter(beats, `open:${FIRST_SEAL}`, [
    farmBeat(
      'squire:shove',
      'plains',
      capOf('plains'),
      'Shove is on: three or more enemies on you, and your shield pushes them back.',
      'Fighting across the Plains until the boss is open.',
    ),
  ]);
  beats = insertAfter(beats, 'zone:forest', [
    farmBeat(
      'squire:riposte',
      'forest',
      capOf('forest'),
      'Riposte is on: the third hit one enemy lands on you, you strike it back.',
      'Fighting through the Forest.',
    ),
  ]);
  beats = insertAfter(beats, 'zone:swamp', [
    farmBeat(
      'squire:steel-will',
      'swamp',
      capOf('swamp'),
      'Steel Will is on: a poison or a bleed lands, and you shake it off.',
      'Fighting through the Swamp.',
    ),
  ]);
  beats = insertAfter(beats, 'squire:steel-will', [{
    id: 'squire:toadeater',
    chapter: CHAPTER.swamp,
    say: 'The Grave Toadeater meets three answers before its fight: Steel Will, Iron Gut, and Purifying Breath.',
    waiting: 'Fighting the Grave Toadeater.',
    steps: [{ type: 'attemptBoss', biomeGroup: 'swamp', tier: 1 }],
  }]);
  beats = insertAfter(beats, 'zone:cave', [
    farmBeat(
      'squire:shield-bash',
      'cave',
      capOf('cave'),
      'Shield Bash is on: the enemy you fight starts a wind-up, and the bash interrupts it.',
      'Fighting through the Cave.',
    ),
  ]);
  beats = insertBefore(beats, `boss:${SECOND_SEAL}`, [
    farmBeat(
      'squire:mountain',
      'mountain',
      LESSON_ZONE_LEVEL,
      'The Mountain hits the hardest. Fight up it.',
      'Fighting up the Mountain.',
    ),
  ]);

  return beats;
}
