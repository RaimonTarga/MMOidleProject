/**
 * The Spirit's guided T1 (SP6, bible §11.4), built on the seal route.
 * Farms split at the lesson level so each new piece's line shows when it is
 * learned. Mountain gets its approach before the second seal; the opening,
 * seal ids, zone order and farewell stay the shared route's.
 */
import { biomeLevelCap } from '../../config/gameConfig';
import { LESSON_ZONE_LEVEL } from '../../classKits/kitHelpers';
import { absoluteZoneLevel } from '../../classKits/registry';
import { SPIRIT_KIT } from '../../classKits/spirit/kit';
import type { KitBiome } from '../../classKits/types';
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

/** The Spirit's Tier-2 stretch, in the order the bible's table (§11.16) lists the biomes. */
const T2_ZONES: ReadonlyArray<{
  biome: KitBiome;
  chapter: string;
  /** The piece the zone's T2 lesson is about; its line names it. */
  lessonPieceId: string;
  approach: string;
  lesson: string;
  boss: string;
}> = [
  {
    biome: 'plains',
    chapter: 'Tier 2: The Plains',
    lessonPieceId: 'spirit-gale',
    approach: 'Tier 2. Pick a discipline in the Passive Tree: Overflow, Tide or Reservoir. Each reshapes your storm. Then fight the Plains again, harder now.',
    lesson: 'Gale is a squall: a gust in front of you blows enemies back, and a charge caught in it stops dead. Keep fighting until the Plains boss is open.',
    boss: 'Fight the Plains boss again. Crosswind ranks up: its spends now strike three enemies, not two.',
  },
  {
    biome: 'forest',
    chapter: 'Tier 2: The Forest',
    lessonPieceId: 'spirit-thunderclap',
    approach: 'The Forest duels and stuns. Fight up it.',
    lesson: 'Thunderclap ranks up: what it staggers also attacks slower for a few seconds.',
    boss: 'Fight the Forest boss. Squall ranks up: the discount on spends in a row builds faster.',
  },
  {
    biome: 'mountain',
    chapter: 'Tier 2: The Mountain',
    lessonPieceId: 'spirit-hailstorm',
    approach: 'The Mountain is plated and charges. Fight up it.',
    lesson: 'Hailstorm is a strike: hail pelts the area around the target for a few seconds, and hits shields and barriers twice as hard.',
    boss: 'Fight the Mountain boss. Thunderhead ranks up: your doubled spend also ignores part of the plating.',
  },
  {
    biome: 'swamp',
    chapter: 'Tier 2: The Swamp',
    lessonPieceId: 'spirit-downpour',
    approach: 'The Swamp brings pools, rain and Corrosion. Fight through it.',
    lesson: 'Downpour ranks up: it also washes Corrosion and slows off you.',
    boss: 'Fight the Swamp boss. Marsh Fire ranks up: its burst also washes a debuff off you.',
  },
  {
    biome: 'cave',
    chapter: 'Tier 2: The Cave',
    lessonPieceId: 'spirit-updraft',
    approach: 'The Cave erupts from below. Fight through it.',
    lesson: 'Updraft is a calm: when the ground is about to erupt under you, a gust lifts you clear.',
    boss: 'Fight the Cave boss. Static Web ranks up: the charge on enemies lasts longer.',
  },
  {
    biome: 'jungle',
    chapter: 'Tier 2: The Jungle',
    lessonPieceId: 'spirit-flare',
    approach: 'The Jungle is new: ambushers in cover and prey that flees. Fight into it.',
    lesson: 'Flare is a squall: a flash around you reveals hidden ambushers and staggers them.',
    boss: 'Fight the Jungle boss for Running Storm: a spend follows a fleeing target and hits harder the farther it ran.',
  },
  {
    biome: 'desert',
    chapter: 'Tier 2: The Desert',
    lessonPieceId: 'spirit-dust-devil',
    approach: 'The Desert marks, slows and kites. Fight into it.',
    lesson: 'Dust Devil is a squall: a whirlwind runs down the farthest enemy attacking you and drags it toward you.',
    boss: 'Fight the Desert boss for Sandstorm: a ring of sand slows enemies while you stay above your floor.',
  },
];

/** The biome level where a T2 zone teaches its lesson (absolute, as the game counts levels). */
export function spiritT2LessonLevel(biome: KitBiome, pieceId: string): number {
  const lesson = SPIRIT_KIT.lessons.find((entry) =>
    entry.pieceId === pieceId && entry.source.kind === 'zone' && entry.source.tier === 2 && entry.source.biome === biome);
  if (!lesson || lesson.source.kind !== 'zone') throw new Error(`spirit tutorial: no T2 ${pieceId} lesson in ${biome}`);
  return absoluteZoneLevel(lesson.source);
}

/**
 * The Tier-2 beats, after the farewell: the discipline pick, each zone's lesson and its boss's
 * trophy rank-up, at the moment the player gets them. Zone farms split at the lesson level like T1.
 */
export function buildSpiritT2Beats(): TutorialBeat[] {
  return T2_ZONES.flatMap(({ biome, chapter, lessonPieceId, approach, lesson, boss }) => {
    const at = { kind: 'biome', biomeGroup: biome, tier: 2, pick: 'uncleared' } as const;
    const lessonLevel = spiritT2LessonLevel(biome, lessonPieceId);
    const cap = biomeLevelCap(2, biome);
    const name = biome.charAt(0).toUpperCase() + biome.slice(1);
    return [
      {
        id: `t2:${biome}`,
        chapter,
        say: approach,
        waiting: `Fighting the ${name} at Tier 2.`,
        progress: [{ type: 'biomeLevel', biomeGroup: biome, level: lessonLevel }],
        steps: [{ type: 'farm', at, until: { type: 'biomeLevelAtLeast', biomeGroup: biome, level: lessonLevel } }],
      },
      {
        id: `spirit:${lessonPieceId.slice('spirit-'.length)}-t2`,
        chapter,
        say: lesson,
        waiting: `Fighting the ${name} at Tier 2.`,
        progress: [{ type: 'biomeLevel', biomeGroup: biome, level: cap }],
        steps: [{ type: 'farm', at, until: { type: 'biomeLevelAtLeast', biomeGroup: biome, level: cap } }],
      },
      {
        id: `t2boss:${biome}`,
        chapter,
        say: boss,
        steps: [{ type: 'attemptBoss', biomeGroup: biome, tier: 2 }],
      },
    ] satisfies TutorialBeat[];
  });
}

/** The Spirit's Tier-3 stretch, in the order of the bible's T3 table (§11.16; the Plains and Forest have retired). */
const T3_ZONES: ReadonlyArray<{
  biome: KitBiome;
  chapter: string;
  lessonPieceId: string;
  approach: string;
  lesson: string;
  boss: string;
}> = [
  {
    biome: 'mountain',
    chapter: 'Tier 3: The Mountain',
    lessonPieceId: 'spirit-downburst',
    approach: 'Tier 3. Pick a specialization under your discipline in the Passive Tree: it bends your storm again. Then climb the Mountain, where beasts charge in pairs.',
    lesson: 'Downburst is a squall: it waits for a charge at you, then slams a column of wind down on the charger and pins it.',
    boss: 'Fight the Mountain boss. Thunderhead ranks up again: a storm four-fifths full counts as full.',
  },
  {
    biome: 'cave',
    chapter: 'Tier 3: The Cave',
    lessonPieceId: 'spirit-updraft',
    approach: 'The Cave chases you through tunnels. Fight through it.',
    lesson: 'Updraft ranks up: the gust also throws the surfacing enemy off its feet.',
    boss: 'Fight the Cave boss. Static Web ranks up: a charged enemy passes its charge to one touching it.',
  },
  {
    biome: 'swamp',
    chapter: 'Tier 3: The Swamp',
    lessonPieceId: 'spirit-tailwind',
    approach: 'The Swamp now drags and shoves. Fight through the spores.',
    lesson: 'Tailwind is a calm: when something drags or shoves you, a gust carries you back, away from the nearest enemy.',
    boss: 'Fight the Swamp boss. Marsh Fire ranks up: its burst is bigger.',
  },
  {
    biome: 'jungle',
    chapter: 'Tier 3: The Jungle',
    lessonPieceId: 'spirit-forked-bolt',
    approach: 'The Jungle pursues, then flees. Fight into it.',
    lesson: 'Forked Bolt is a sidegrade of Chain Lightning: it splits toward the two enemies farthest from you. Keep both and choose.',
    boss: 'Fight the Jungle boss. Running Storm ranks up: a spend follows a fleeing target even harder.',
  },
  {
    biome: 'desert',
    chapter: 'Tier 3: The Desert',
    lessonPieceId: 'spirit-dust-devil',
    approach: 'The Desert has postures and a kiter that turns. Fight through it.',
    lesson: 'Dust Devil ranks up: the enemy it drags cannot move away for a moment.',
    boss: 'Fight the Desert boss. Sandstorm ranks up: the ring of sand is wider.',
  },
  {
    biome: 'tundra',
    chapter: 'Tier 3: The Tundra',
    lessonPieceId: 'spirit-foehn',
    approach: 'The Tundra is new: the Chill builds on you, and shells guard its beasts. Its bosses ignore control. Fight into it.',
    lesson: 'Foehn is a calm: when the Chill on you nears its threshold, a warm wind melts it back down.',
    boss: 'Fight the Tundra boss for Ice Storm: every spend glazes the ground under its target and slows what stands on it.',
  },
  {
    biome: 'volcanic',
    chapter: 'Tier 3: The Volcanic',
    lessonPieceId: 'spirit-ash-lightning',
    approach: 'The Volcanic is new: the Heat rises through the fight, and the bosses ignore control. Fight into it.',
    lesson: "Ash Lightning is a strike: the volcano's own lightning hits harder for each step of the Heat.",
    boss: 'Fight the Volcanic boss for Pyrocumulus: while your storm stays full, a burst strikes around you every few seconds.',
  },
];

/** The biome level where a T3 zone teaches its lesson (absolute, as the game counts levels). */
export function spiritT3LessonLevel(biome: KitBiome, pieceId: string): number {
  const lesson = SPIRIT_KIT.lessons.find((entry) =>
    entry.pieceId === pieceId && entry.source.kind === 'zone' && entry.source.tier === 3 && entry.source.biome === biome);
  if (!lesson || lesson.source.kind !== 'zone') throw new Error(`spirit tutorial: no T3 ${pieceId} lesson in ${biome}`);
  return absoluteZoneLevel(lesson.source);
}

/**
 * The Tier-3 beats, after the Tier-2 stretch: the specialization pick, each zone's lesson and its
 * boss's trophy rank-up or new trophy. Zone farms split at the lesson level like T1 and T2.
 */
export function buildSpiritT3Beats(): TutorialBeat[] {
  return T3_ZONES.flatMap(({ biome, chapter, lessonPieceId, approach, lesson, boss }) => {
    const at = { kind: 'biome', biomeGroup: biome, tier: 3, pick: 'uncleared' } as const;
    const lessonLevel = spiritT3LessonLevel(biome, lessonPieceId);
    const cap = biomeLevelCap(3, biome);
    const name = biome.charAt(0).toUpperCase() + biome.slice(1);
    return [
      {
        id: `t3:${biome}`,
        chapter,
        say: approach,
        waiting: `Fighting the ${name} at Tier 3.`,
        progress: [{ type: 'biomeLevel', biomeGroup: biome, level: lessonLevel }],
        steps: [{ type: 'farm', at, until: { type: 'biomeLevelAtLeast', biomeGroup: biome, level: lessonLevel } }],
      },
      {
        id: `spirit:${lessonPieceId.slice('spirit-'.length)}-t3`,
        chapter,
        say: lesson,
        waiting: `Fighting the ${name} at Tier 3.`,
        progress: [{ type: 'biomeLevel', biomeGroup: biome, level: cap }],
        steps: [{ type: 'farm', at, until: { type: 'biomeLevelAtLeast', biomeGroup: biome, level: cap } }],
      },
      {
        id: `t3boss:${biome}`,
        chapter,
        say: boss,
        steps: [{ type: 'attemptBoss', biomeGroup: biome, tier: 3 }],
      },
    ] satisfies TutorialBeat[];
  });
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
    ...buildSpiritT2Beats(),
    ...buildSpiritT3Beats(),
  ];
}
