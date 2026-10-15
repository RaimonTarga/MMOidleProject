/**
 * The Slinger's guided beats after the opening (CL6, bible §10.4).
 *
 * Built on the seal route: the same zones, the same order, the same two seals
 * and the same farewell. A zone farm that used to run to the tier cap is split
 * at the lesson level, so the new line is the card that comes up when that
 * level lands. The seal beats keep their ids. Mountain has no walk in the seal
 * route (it is the second seal), so a short farm to the Stopping lesson is
 * added in front of that boss, and Stopping's line is that boss beat.
 *
 * After the farewell beat (tier 2 reached) comes the T2 stretch (T2-W2, bible
 * §10.5 and §10.16): the discipline pick, then each T2 zone as three beats: the
 * approach (farm to the lesson level), the lesson (farm to the tier cap) and
 * the boss, whose line says which trophy round it ranks up or gives. The
 * lesson levels are read off the kit, never written in.
 */
import { biomeLevelCap } from '../../config/gameConfig';
import { LESSON_ZONE_LEVEL } from '../../classKits/kitHelpers';
import { absoluteZoneLevel } from '../../classKits/registry';
import { SLINGER_KIT } from '../../classKits/slinger/kit';
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

interface T2Zone {
  biome: string;
  chapter: string;
  /** The approach card: the zone, and (for the first) the discipline pick. */
  say: string;
  /** The lesson's id suffix and its line, said when the lesson level lands. */
  lesson: string;
  lessonSay: string;
  bossSay: string;
}

const T2_ZONES: readonly T2Zone[] = [
  {
    biome: 'plains',
    chapter: 'Tier 2: The Plains',
    say: 'Tier 2. Spend your skill point in the Passive Tree on a discipline: Gunslinger fires two guns, Siege a shell, Trickshot a called last round. Then the Plains.',
    lesson: 'buckshot',
    lessonSay: 'Buckshot is another clip: a cone of pellets, harder up close, that stops a charging enemy. Add it in your Loadout.',
    bossSay: 'The Plains boss is open again. Beat it and Stampede Round ranks up: the shove also knocks down.',
  },
  {
    biome: 'forest',
    chapter: 'Tier 2: The Forest',
    say: 'The Forest fights harder now, with stuns and duels. Cut through it.',
    lesson: 'snare-ii',
    lessonSay: 'Snare ranks up: it builds faster, and at its cap the target attacks slower too.',
    bossSay: 'The Forest boss is open again. Beat it and Twin Round ranks up: both shots at full strength.',
  },
  {
    biome: 'mountain',
    chapter: 'Tier 2: The Mountain',
    say: 'The Mountain now has barriers and heavy plating. Fight up it.',
    lesson: 'shellbreaker',
    lessonSay: 'Shellbreaker is a new clip: every round hits barriers and shields for double.',
    bossSay: 'The Mountain boss is open again. Beat it and Quake Round ranks up: a wider blast that also cracks plating.',
  },
  {
    biome: 'swamp',
    chapter: 'Tier 2: The Swamp',
    say: 'The Swamp keeps hurting, and the mire rises. Fight through it.',
    lesson: 'venom-ii',
    lessonSay: 'Venom ranks up: a deeper poison that lasts longer.',
    bossSay: 'The Swamp boss is open again. Beat it and Rot Round ranks up: a bigger share.',
  },
  {
    biome: 'cave',
    chapter: 'Tier 2: The Cave',
    say: 'Things erupt from below in the Cave. Fight through them.',
    lesson: 'breaching-ii',
    lessonSay: 'Breaching ranks up: it ignores all plating.',
    bossSay: 'The Cave boss is open again. Beat it and Splinter Round ranks up: four splinters.',
  },
  {
    biome: 'jungle',
    chapter: 'Tier 2: The Jungle',
    say: 'The Jungle is new: prey runs, and ambushers wait in cover. Fight through it.',
    lesson: 'tracer',
    lessonSay: 'Tracer is a new clip: each round tags its target, so it cannot hide or break away. It reveals ambushers in cover.',
    bossSay: "The Jungle boss is open. Beat it and take Hunter's Round: the last round follows its target and hits harder the farther it flies.",
  },
  {
    biome: 'desert',
    chapter: 'Tier 2: The Desert',
    say: 'The Desert is new: marks, slows, and kiters. Fight through it.',
    lesson: 'hollow-point',
    lessonSay: 'Hollow-point is a new clip: every round hits a target below half HP harder.',
    bossSay: 'The Desert boss is open. Beat it and take Bounty Round: the last round executes a target below a threshold.',
  },
];

/** The biome level a zone's tier-2 lesson lands at, read off the kit. */
function t2LessonLevel(biome: string): number {
  for (const lesson of SLINGER_KIT.lessons) {
    const source = lesson.source;
    if (source.kind === 'zone' && source.biome === biome && source.tier === 2) return absoluteZoneLevel(source);
  }
  throw new Error(`slinger tutorial: no tier-2 lesson in ${biome}`);
}

function t2Beats(): TutorialBeat[] {
  const beats: TutorialBeat[] = [];
  for (const zone of T2_ZONES) {
    const at: TutorialNodeRef = { kind: 'biome', biomeGroup: zone.biome, tier: 2 };
    const lessonLevel = t2LessonLevel(zone.biome);
    const cap = biomeLevelCap(2, zone.biome);
    const farmTo = (level: number): TutorialBeat['steps'] => [{
      type: 'farm',
      at,
      until: { type: 'biomeLevelAtLeast', biomeGroup: zone.biome, level },
    }];
    beats.push({
      id: `t2:${zone.biome}`,
      chapter: zone.chapter,
      say: zone.say,
      waiting: `Fighting through the ${zone.biome}.`,
      progress: [{ type: 'biomeLevel', biomeGroup: zone.biome, level: lessonLevel }],
      steps: farmTo(lessonLevel),
    });
    beats.push({
      id: `slinger:${zone.lesson}`,
      chapter: zone.chapter,
      say: zone.lessonSay,
      waiting: `Fighting through the ${zone.biome}.`,
      progress: [{ type: 'biomeLevel', biomeGroup: zone.biome, level: cap }],
      steps: farmTo(cap),
    });
    beats.push({
      id: `boss:${zone.biome}:2`,
      chapter: zone.chapter,
      say: zone.bossSay,
      waiting: `Fighting for the ${zone.biome} boss.`,
      steps: [{ type: 'attemptBoss', biomeGroup: zone.biome, tier: 2 }],
    });
  }
  return beats;
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
    ...t2Beats(),
  ];
}
