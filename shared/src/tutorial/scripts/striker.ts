/**
 * The Striker's guided beats after the opening (CS6, bible §12.4).
 *
 * Built on the seal route: the same zones, the same order, the same two seals
 * and the same farewell. A zone farm that used to run to the tier cap is split
 * at the lesson level, so the new line is the card that comes up when that
 * level lands. The seal beats keep their ids. Mountain has no walk in the seal
 * route (it is the second seal), so a short farm to the Coil lesson is added
 * in front of that boss, and Coil's line is that boss beat.
 *
 * After the farewell comes the Tier 2 stretch (T2-W2, bible §12.5 and §12.16): each T2
 * zone is three beats, the zone up to its lesson level, the lesson's line while the
 * zone carries on to its cap, then the boss, whose line says which trophy ranks up.
 * The discipline pick is the first line: the player picks it in the Passive Tree, and
 * no step type reads a discipline, so the line only points at it.
 *
 * After that comes the Tier 3 stretch (T3-W2, bible §12.6 and §12.16), the same shape over the
 * seven T3 zones: the specialization pick first (again a pointer), then one lesson and one
 * boss line per zone, including the two new zones, the Tundra and the Volcanic.
 */
import { biomeLevelCap } from '../../config/gameConfig';
import { absoluteZoneLevel } from '../../classKits/registry';
import { LESSON_ZONE_LEVEL } from '../../classKits/kitHelpers';
import type { KitBiome } from '../../classKits/types';
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
    ...buildStrikerTierTwoBeats(),
    ...buildStrikerTierThreeBeats(),
  ];
}

/** The Tier 2 zones in the guide's order (bible §12.16: the five old zones, then the two new). */
export const STRIKER_T2_ZONES = ['plains', 'forest', 'mountain', 'swamp', 'cave', 'jungle', 'desert'] as const;
type T2Zone = typeof STRIKER_T2_ZONES[number];

const DISCIPLINE_SAY =
  'Tier 2. Your next skill point is a discipline: Light, Balanced or Heavy. It sets your combo and what it builds. Pick it in the Passive Tree.';

interface TierTwoLine {
  /** The zone beat, up to the lesson level. */
  arrive: string;
  /** The lesson (or rank-up) line, said when its level lands. */
  lesson: string;
  /** The boss beat: which trophy this kill ranks up or earns. */
  boss: string;
}

const T2_LINES: Readonly<Record<T2Zone, TierTwoLine>> = {
  plains: {
    arrive: DISCIPLINE_SAY,
    lesson: "Whirlwind is learned: a cast that spins through everything around you three times. It can take Sweep's beat.",
    boss: 'The Plains boss is open again. Win, and Wide Arc ranks up: it strikes two extra enemies.',
  },
  forest: {
    arrive: 'The Forest is tougher now. Fight up it.',
    lesson: 'Feint is learned: a swing that does no damage, and your next beat hits much harder.',
    boss: 'The Forest boss is open again. Win, and Double Slash ranks up: each strike hits harder.',
  },
  mountain: {
    arrive: 'The Mountain is tougher now. Fight up it.',
    lesson: "Armor Break is learned: it cracks the target's plating for a few seconds.",
    boss: 'The Mountain boss is open again. Win, and Skyfall ranks up: the blow also ignores part of the plating.',
  },
  swamp: {
    arrive: 'The Swamp is tougher now. Fight through it.',
    lesson: 'Rend ranks up: the bleed lasts longer and cuts deeper.',
    boss: 'The Swamp boss is open again. Win, and Festering Cut ranks up: its rot deals a bigger share.',
  },
  cave: {
    arrive: 'The Cave is tougher now. Fight through it.',
    lesson: 'Concuss is learned: a brief stun. Bosses that shrug off control ignore it.',
    boss: 'The Cave boss is open again. Win, and Sunder ranks up: Expose also cracks plating.',
  },
  jungle: {
    arrive: 'The Jungle is new: prey that flees, and ambush from cover. Fight in.',
    lesson: 'Charge is learned: an opener cast that dashes to the target, even one that runs.',
    boss: 'The Jungle boss is open. Win, and you earn Pounce: your finisher leaps to a target that fled.',
  },
  desert: {
    arrive: 'The Desert is new: marks, slows and ranged kiters. Fight in.',
    lesson: "Pin is learned: it roots the target, so it can't kite away.",
    boss: 'The Desert boss is open. Win, and you earn Verdict: your finisher kills a target low on HP outright.',
  },
};

function tierRef(biomeGroup: string, tier: number): TutorialNodeRef {
  return { kind: 'biome', biomeGroup, tier, pick: 'uncleared' };
}

function farmTo(biomeGroup: string, tier: number, level: number): TutorialBeat['steps'] {
  return [{ type: 'farm', at: tierRef(biomeGroup, tier), until: { type: 'biomeLevelAtLeast', biomeGroup, level } }];
}

/** The biome level (as the game counts it) at which a zone teaches its lesson at `tier`. */
function lessonLevelAt(biomeGroup: string, tier: number): number {
  return absoluteZoneLevel({ kind: 'zone', biome: biomeGroup as KitBiome, tier, level: LESSON_ZONE_LEVEL });
}

/** The biome level (as the game counts it) at which a T2 zone teaches its lesson. */
export function strikerT2LessonLevel(biomeGroup: T2Zone): number {
  return lessonLevelAt(biomeGroup, 2);
}

/** One tier's stretch: three beats per zone (arrive, lesson, boss), the ids prefixed `striker<tier>:`. */
function buildTierBeats(
  tier: number,
  zones: readonly string[],
  lines: Readonly<Record<string, TierTwoLine>>,
): TutorialBeat[] {
  const beats: TutorialBeat[] = [];
  for (const biomeGroup of zones) {
    const zoneLines = lines[biomeGroup];
    const lessonLevel = lessonLevelAt(biomeGroup, tier);
    const cap = biomeLevelCap(tier, biomeGroup);
    const chapter = `Tier ${tier}: ${biomeGroup.charAt(0).toUpperCase()}${biomeGroup.slice(1)}`;
    beats.push(
      {
        id: `striker${tier}:${biomeGroup}`,
        chapter,
        say: zoneLines.arrive,
        waiting: 'Fighting on.',
        progress: [{ type: 'biomeLevel', biomeGroup, level: lessonLevel }],
        steps: farmTo(biomeGroup, tier, lessonLevel),
      },
      {
        id: `striker${tier}:${biomeGroup}-lesson`,
        chapter,
        say: zoneLines.lesson,
        waiting: 'Fighting on until the boss is open.',
        progress: [{ type: 'biomeLevel', biomeGroup, level: cap }],
        steps: farmTo(biomeGroup, tier, cap),
      },
      {
        id: `striker${tier}:${biomeGroup}-boss`,
        chapter,
        say: zoneLines.boss,
        waiting: 'Fighting for the boss.',
        steps: [{ type: 'attemptBoss', biomeGroup, tier }],
      },
    );
  }
  return beats;
}

/** The Tier 2 stretch, after the farewell. */
export function buildStrikerTierTwoBeats(): TutorialBeat[] {
  return buildTierBeats(2, STRIKER_T2_ZONES, T2_LINES);
}

/** The Tier 3 zones in the guide's order: the Plains and Forest have retired; the Tundra and Volcanic are new. */
export const STRIKER_T3_ZONES = ['mountain', 'swamp', 'cave', 'jungle', 'desert', 'tundra', 'volcanic'] as const;
type T3Zone = typeof STRIKER_T3_ZONES[number];

const SPECIALIZATION_SAY =
  'Tier 3. Your next skill point is a specialization: three for your discipline. It bends what the discipline builds. Pick it in the Passive Tree.';

const T3_LINES: Readonly<Record<T3Zone, TierTwoLine>> = {
  mountain: {
    arrive: SPECIALIZATION_SAY,
    lesson: 'Earthsplitter is learned: a wind-up that slams down a line of enemies.',
    boss: 'The Mountain boss is open again. Win, and Skyfall ranks up: its wind-up is shorter.',
  },
  swamp: {
    arrive: 'The Swamp is tougher now. Fight through it.',
    lesson: 'Hemorrhage is learned: a deep bleed that outlasts Rend.',
    boss: 'The Swamp boss is open again. Win, and Festering Cut ranks up for the last time.',
  },
  cave: {
    arrive: 'The Cave is tougher now. Fight through it.',
    lesson: 'Upheaval is learned: the ground erupts and knocks the target and those touching it down.',
    boss: 'The Cave boss is open again. Win, and Sunder ranks up: it lasts longer.',
  },
  jungle: {
    arrive: "The Jungle is tougher now, and the Forest's gear jobs have moved here.",
    lesson: 'Triple Cut is learned: three quick hits, and three times the hit effects.',
    boss: 'The Jungle boss is open again. Win, and Pounce ranks up: the landing also hits enemies around it.',
  },
  desert: {
    arrive: 'The Desert is tougher now. Fight through it.',
    lesson: 'Shadowstep is learned: you step behind the target, and your next beat is sure to crit.',
    boss: 'The Desert boss is open again. Win, and Verdict ranks up: it executes at a higher threshold.',
  },
  tundra: {
    arrive: 'The Tundra is new: the Chill builds on you, ice shells, root casters. Its bosses accept no control. Fight in.',
    lesson: 'Icebreaker is learned: much harder against a shielded or shelled target.',
    boss: 'The Tundra boss is open. Win, and you earn Hoarfrost: every beat of your next combo slows the target more.',
  },
  volcanic: {
    arrive: "The Volcanic is new: Heat builds on you, vents, obsidian shells. The Plains' gear jobs have moved here. Fight in.",
    lesson: 'Overheat is learned: an opener that speeds the whole combo, and you take more damage until the finisher.',
    boss: 'The Volcanic boss is open. Win, and you earn Eruption: your finisher hits everything around the target too.',
  },
};

/** The Tier 3 stretch, after the Tier 2 one. */
export function buildStrikerTierThreeBeats(): TutorialBeat[] {
  return buildTierBeats(3, STRIKER_T3_ZONES, T3_LINES);
}

/** The biome level (as the game counts it) at which a T3 zone teaches its lesson. */
export function strikerT3LessonLevel(biomeGroup: T3Zone): number {
  return lessonLevelAt(biomeGroup, 3);
}
