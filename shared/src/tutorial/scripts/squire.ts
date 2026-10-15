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
 *
 * After the farewell beat comes the Tier-2 stretch (bible section 8.5, 8.16): the
 * discipline pick, then each T2 zone in turn: an entry farm to the zone's lesson
 * level, the lesson's line while the fight carries on to the tier cap, and the
 * boss with the trophy it ranks up. The guide has no step for the discipline pick
 * (it is made on the Passive Tree and no tutorial condition reads it), so that
 * line rides on the first T2 farm and shows the moment Tier 2 lands.
 *
 * The Tier-3 stretch (bible 8.6, 8.16) follows the same shape: the specialization line, then
 * each T3 zone (Tundra and Volcanic are new) with its lesson line and its boss.
 */
import { biomeLevelCap } from '../../config/gameConfig';
import { LESSON_ZONE_LEVEL } from '../../classKits/kitHelpers';
import { absoluteZoneLevel } from '../../classKits/registry';
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

  return [...beats, ...buildSquireTierTwoBeats(), ...buildSquireTierThreeBeats()];
}

type T2Biome = 'plains' | 'forest' | 'mountain' | 'swamp' | 'cave' | 'jungle' | 'desert';

const T2_CHAPTER: Record<T2Biome, string> = {
  plains: 'Tier 2: The Plains',
  forest: 'Tier 2: The Forest',
  mountain: 'Tier 2: The Mountain',
  swamp: 'Tier 2: The Swamp',
  cave: 'Tier 2: The Cave',
  jungle: 'Tier 2: The Jungle',
  desert: 'Tier 2: The Desert',
};

function t2Ref(biome: T2Biome): TutorialNodeRef {
  return { kind: 'biome', biomeGroup: biome, tier: 2 };
}

/** The biome level (as the game counts it) where a T2 zone teaches its lesson. */
function t2Lesson(biome: T2Biome): number {
  return absoluteZoneLevel({ kind: 'zone', biome, tier: 2, level: LESSON_ZONE_LEVEL });
}

function t2Cap(biome: T2Biome): number {
  return biomeLevelCap(2, biome);
}

function t2Farm(id: string, biome: T2Biome, level: number, say: string, waiting: string): TutorialBeat {
  return {
    id,
    chapter: T2_CHAPTER[biome],
    say,
    waiting,
    progress: [{ type: 'biomeLevel', biomeGroup: biome, level }],
    steps: [{
      type: 'farm',
      at: t2Ref(biome),
      until: { type: 'biomeLevelAtLeast', biomeGroup: biome, level },
    }],
  };
}

function t2Boss(biome: T2Biome, say: string): TutorialBeat {
  return {
    id: `squire2:boss-${biome}`,
    chapter: T2_CHAPTER[biome],
    say,
    waiting: `Fighting the ${biome} boss.`,
    steps: [{ type: 'attemptBoss', biomeGroup: biome, tier: 2 }],
  };
}

/** The Tier-2 beats, after the farewell. Lines name the piece and say what it does; no numbers. */
export function buildSquireTierTwoBeats(): TutorialBeat[] {
  return [
    t2Farm(
      'squire2:discipline',
      'plains',
      t2Lesson('plains') - 1,
      'Tier 2 is open. Pick a discipline in the Passive Tree: Avenger answers every blow, Bulwark holds the crowd on you, Juggernaut turns armor into a huge slam.',
      'Fighting in the Plains while you choose.',
    ),
    t2Farm(
      'squire2:plains',
      'plains',
      t2Lesson('plains'),
      'The Plains now stampede. Fight on until the zone teaches its answer.',
      'Fighting through the Plains.',
    ),
    t2Farm(
      'squire2:stand-fast',
      'plains',
      t2Cap('plains'),
      'Stand Fast is on: a charge comes at you and you plant your feet to stop it.',
      'Fighting through the Plains.',
    ),
    t2Boss('plains', 'The Plains boss ranks your Muster up: a whole wave rallying to the fight fills twice as much Resolve.'),
    t2Farm(
      'squire2:forest',
      'forest',
      t2Lesson('forest'),
      'The Forest now stuns. Fight on until the zone teaches its answer.',
      'Fighting through the Forest.',
    ),
    t2Farm(
      'squire2:unshaken',
      'forest',
      t2Cap('forest'),
      'Unshaken is on: a stun or a root lands and you throw it off.',
      'Fighting through the Forest.',
    ),
    t2Boss('forest', 'The Forest boss ranks your Relentless up: your slams chain into one another.'),
    t2Farm(
      'squire2:mountain',
      'mountain',
      t2Lesson('mountain'),
      'The Mountain now raises barriers and charges. Fight on.',
      'Fighting up the Mountain.',
    ),
    t2Farm(
      'squire2:splitting-blow',
      'mountain',
      t2Cap('mountain'),
      'Splitting Blow is on: a counter that breaks a raised barrier.',
      'Fighting up the Mountain.',
    ),
    t2Boss('mountain', 'The Mountain boss ranks your Faultline up: your slam hits a barrier harder.'),
    t2Farm(
      'squire2:swamp',
      'swamp',
      t2Lesson('swamp'),
      'The Swamp now corrodes. Fight on until Steel Will grows.',
      'Fighting through the Swamp.',
    ),
    t2Farm(
      'squire2:steel-will',
      'swamp',
      t2Cap('swamp'),
      'Steel Will is stronger: it now shakes off corrosion and slows too.',
      'Fighting through the Swamp.',
    ),
    t2Boss('swamp', 'The Swamp boss ranks your Rot-Eater up: every ailment that lands on you fills Resolve.'),
    t2Farm(
      'squire2:cave',
      'cave',
      t2Lesson('cave'),
      'The Cave now erupts from below. Fight on.',
      'Fighting through the Cave.',
    ),
    t2Farm(
      'squire2:earthstamp',
      'cave',
      t2Cap('cave'),
      'Earthstamp is on: a burrowed enemy is pulled out at your feet and staggered.',
      'Fighting through the Cave.',
    ),
    t2Boss('cave', 'The Cave boss ranks your Corrode up: your hits strip plating from more stacks.'),
    t2Farm(
      'squire2:jungle',
      'jungle',
      t2Lesson('jungle'),
      'The Jungle is new: its enemies ambush from cover and flee. Fight on.',
      'Fighting through the Jungle.',
    ),
    t2Farm(
      'squire2:watchful',
      'jungle',
      t2Cap('jungle'),
      'Watchful is on: the first blow of an ambush is caught on your shield.',
      'Fighting through the Jungle.',
    ),
    t2Boss('jungle', 'The Jungle boss gives you the Strangler Vine: your slam pulls enemies in before it lands.'),
    t2Farm(
      'squire2:desert',
      'desert',
      t2Lesson('desert'),
      'The Desert is new: its archers keep their distance. Fight on.',
      'Fighting through the Desert.',
    ),
    t2Farm(
      'squire2:challenge',
      'desert',
      t2Cap('desert'),
      'Challenge is on: ranged enemies are pulled in to fight you.',
      'Fighting through the Desert.',
    ),
    t2Boss('desert', "The Desert boss gives you the Executioner's Oath: your slam comes early on a nearly dead enemy."),
  ];
}

type T3Biome = T2Biome | 'tundra' | 'volcanic';

const T3_CHAPTER: Record<T3Biome, string> = {
  plains: 'Tier 3: The Plains',
  forest: 'Tier 3: The Forest',
  mountain: 'Tier 3: The Mountain',
  swamp: 'Tier 3: The Swamp',
  cave: 'Tier 3: The Cave',
  jungle: 'Tier 3: The Jungle',
  desert: 'Tier 3: The Desert',
  tundra: 'Tier 3: The Tundra',
  volcanic: 'Tier 3: The Volcanic',
};

function t3Ref(biome: T3Biome): TutorialNodeRef {
  return { kind: 'biome', biomeGroup: biome, tier: 3 };
}

function t3Lesson(biome: T3Biome): number {
  return absoluteZoneLevel({ kind: 'zone', biome, tier: 3, level: LESSON_ZONE_LEVEL });
}

function t3Cap(biome: T3Biome): number {
  return biomeLevelCap(3, biome);
}

function t3Farm(id: string, biome: T3Biome, level: number, say: string, waiting: string): TutorialBeat {
  return {
    id,
    chapter: T3_CHAPTER[biome],
    say,
    waiting,
    progress: [{ type: 'biomeLevel', biomeGroup: biome, level }],
    steps: [{
      type: 'farm',
      at: t3Ref(biome),
      until: { type: 'biomeLevelAtLeast', biomeGroup: biome, level },
    }],
  };
}

function t3Boss(biome: T3Biome, say: string): TutorialBeat {
  return {
    id: `squire3:boss-${biome}`,
    chapter: T3_CHAPTER[biome],
    say,
    waiting: `Fighting the ${biome} boss.`,
    steps: [{ type: 'attemptBoss', biomeGroup: biome, tier: 3 }],
  };
}

/** The Tier-3 beats, after the Tier-2 stretch. Lines name the piece and say what it does; no numbers. */
export function buildSquireTierThreeBeats(): TutorialBeat[] {
  return [
    t3Farm(
      'squire3:specialization',
      'mountain',
      t3Lesson('mountain') - 1,
      'Tier 3 is open. Pick a specialization in the Passive Tree: three choices, all under your discipline, each bending your Resolve or your slam.',
      'Fighting on the Mountain while you choose.',
    ),
    t3Farm(
      'squire3:guard-two',
      'mountain',
      t3Cap('mountain'),
      'Guard is stronger: after it catches a blow, your shield stays up for a second one.',
      'Fighting up the Mountain.',
    ),
    t3Boss('mountain', 'The Mountain boss ranks your Faultline up: the slam line reaches further.'),
    t3Farm(
      'squire3:earthstamp-two',
      'cave',
      t3Cap('cave'),
      'Earthstamp is stronger: it knocks down everything around you, not only the one that burrowed.',
      'Fighting through the Cave.',
    ),
    t3Boss('cave', 'The Cave boss ranks your Corrode up: each slam strips plating from more stacks.'),
    t3Farm(
      'squire3:swamp',
      'swamp',
      t3Lesson('swamp'),
      'The Swamp now drags and pushes. Fight on until you learn to stand against it.',
      'Fighting through the Swamp.',
    ),
    t3Farm(
      'squire3:anchor',
      'swamp',
      t3Cap('swamp'),
      'Anchor is on: when something drags or pushes you, you plant your feet and it fills your Resolve.',
      'Fighting through the Swamp.',
    ),
    t3Boss('swamp', 'The Swamp boss ranks your Rot-Eater up: ailments fill more Resolve still.'),
    t3Farm(
      'squire3:jungle',
      'jungle',
      t3Lesson('jungle'),
      'The Jungle now hunts and flees. Fight on.',
      'Fighting through the Jungle.',
    ),
    t3Farm(
      'squire3:chain-hook',
      'jungle',
      t3Cap('jungle'),
      'Chain Hook is on: an enemy that flees is hooked and dragged back to you.',
      'Fighting through the Jungle.',
    ),
    t3Boss('jungle', 'The Jungle boss ranks your Strangler Vine up.'),
    t3Farm(
      'squire3:challenge-two',
      'desert',
      t3Cap('desert'),
      'Challenge is stronger: the enemies you pull in cannot move away for a moment.',
      'Fighting through the Desert.',
    ),
    t3Boss('desert', "The Desert boss ranks your Executioner's Oath up."),
    t3Farm(
      'squire3:tundra',
      'tundra',
      t3Lesson('tundra'),
      'The Tundra is new: its Chill builds on you until you freeze. Fight on.',
      'Fighting through the Tundra.',
    ),
    t3Farm(
      'squire3:frostward',
      'tundra',
      t3Cap('tundra'),
      'Frostward is on: when the Chill on you is about to freeze you, you hold it there for a few seconds.',
      'Fighting through the Tundra.',
    ),
    t3Boss('tundra', 'The Tundra boss gives you Deep Winter: your Resolve bar can fill past full, and the slam grows with it.'),
    t3Farm(
      'squire3:volcanic',
      'volcanic',
      t3Lesson('volcanic'),
      'The Volcanic is new: its Heat builds and its gunners burn you. Fight on.',
      'Fighting through the Volcanic.',
    ),
    t3Farm(
      'squire3:backdraft',
      'volcanic',
      t3Cap('volcanic'),
      'Backdraft is on: a fire attack or burning shot is thrown back at whoever fired it.',
      'Fighting through the Volcanic.',
    ),
    t3Boss('volcanic', 'The Volcanic boss gives you Kindling: the longer a fight lasts, the more every gain of Resolve is worth.'),
  ];
}
