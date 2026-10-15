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
 *
 * Tier 2 (T2-W2, bible §7.5, §7.16) follows the farewell: the discipline pick, then each
 * T2 zone in turn. Every zone is three beats (farm to the lesson, farm to the cap, the
 * boss), and the line for a lesson or a Soul rank comes up in the beat after the thing
 * that earns it, as in Tier 1. The first Jungle and Desert Souls arrive with their bosses.
 *
 * Tier 3 (T3-W2, bible §7.6, §7.16) follows the Tier 2 stretch: the specialization pick, then the
 * five returning zones (Mountain, Cave, Swamp, Jungle, Desert) and the two new ones (Tundra,
 * Volcanic), three beats each, the same way.
 *
 * Tier 4 (T4-W2, bible §7.7, §7.16) follows the Tier 3 stretch: the leaf pick, then the Mountain,
 * Tundra, Jungle, Desert and Volcanic again and the two new zones (Graveyard, Trench), the same way.
 */
import { LESSON_ZONE_LEVEL } from '../../classKits/kitHelpers';
import { absoluteZoneLevel } from '../../classKits/registry';
import type { KitBiome } from '../../classKits/types';
import { biomeLevelCap } from '../../config/gameConfig';
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

/** One Tier 2 zone: its lesson, and the Soul its boss gives or ranks up. */
interface T2Zone {
  biome: KitBiome;
  zone: string;
  /** The new summon's line, said when its lesson comes up. */
  lesson: string;
  /** The Soul line, said right after the boss falls. */
  soul: string;
}

/** In the order the guide walks them: Tier 1's order, then the two new zones. */
const T2_ZONES: readonly T2Zone[] = [
  {
    biome: 'plains', zone: 'Plains',
    lesson: 'Ironhorn is bound. It braces against a charge: a charger that hits it stops dead and is stunned.',
    soul: 'The Plains boss fell. Your Razortusk Soul is rank 2, so it and its charge are stronger.',
  },
  {
    biome: 'forest', zone: 'Forest',
    lesson: 'Barkward is bound. It coats a summon in bark that absorbs the next stun and some damage.',
    soul: 'The Forest boss fell. Your Timberclaw Soul is rank 2, so it heals more.',
  },
  {
    biome: 'swamp', zone: 'Swamp',
    lesson: 'Bog Leech is bound. It drains its target and shares what it drains with the most hurt summon.',
    soul: 'The Swamp boss fell. Your Mire Behemoth Soul is rank 2, so its bile hits harder.',
  },
  {
    biome: 'cave', zone: 'Cave',
    lesson: 'Bonecrusher is bound. It costs two Command, and its blows grow with its own health.',
    soul: 'The Cave boss fell. Your Dreadbore Soul is rank 2, so it comes more often.',
  },
  {
    biome: 'mountain', zone: 'Mountain',
    lesson: 'Rockhurler is bound. Its boulders hit a small area: your first real area damage.',
    soul: 'The Mountain boss fell. Your Stoneplate Soul is rank 2, so the shield it gives is stronger.',
  },
  {
    biome: 'jungle', zone: 'Jungle',
    lesson: 'Bloomtender is bound. It heals the most hurt ally, and that can be you.',
    soul: 'The Jungle boss fell. The Dread-Gorger Soul is yours: your summons never lose a fleeing enemy.',
  },
  {
    biome: 'desert', zone: 'Desert',
    lesson: 'Executioner is bound. It marks its target, and below a threshold its shots hit twice as hard.',
    soul: 'The Desert boss fell. The Dune-Stalker Soul is yours: each kind of summon that hits the mark adds to it.',
  },
];

const T2_DISCIPLINE_SAY =
  'Tier 2 is open. Spend your skill point on a discipline in the Passive Tree: Swarm, Pack or Elite. It changes what Command costs.';

/** A Tier 2 farm in a zone, to a biome level; `progress` shows it as a count. */
function t2Farm(
  id: string,
  chapter: string,
  say: string,
  waiting: string,
  biome: string,
  level: number,
  tier = 2,
): TutorialBeat {
  return {
    id,
    chapter,
    say,
    waiting,
    progress: [{ type: 'biomeLevel', biomeGroup: biome, level }],
    steps: [{
      type: 'farm',
      at: { kind: 'biome', biomeGroup: biome, tier },
      until: { type: 'biomeLevelAtLeast', biomeGroup: biome, level },
    }],
  };
}

/** The Tier 2 stretch after the farewell: the discipline pick, then every T2 zone (bible §7.5, §7.16). */
export function buildConduitT2Beats(): TutorialBeat[] {
  const beats: TutorialBeat[] = [];
  let arrival = T2_DISCIPLINE_SAY;
  for (const entry of T2_ZONES) {
    const chapter = `Tier 2: ${entry.zone}`;
    const lessonLevel = absoluteZoneLevel({ kind: 'zone', biome: entry.biome, tier: 2, level: LESSON_ZONE_LEVEL });
    const cap = biomeLevelCap(2, entry.biome);
    beats.push(
      t2Farm(`t2:${entry.biome}`, chapter, arrival, `Fighting in the ${entry.zone}.`, entry.biome, lessonLevel),
      t2Farm(`t2:${entry.biome}-lesson`, chapter, entry.lesson, `Fighting through the ${entry.zone}.`, entry.biome, cap),
      {
        id: `t2:${entry.biome}-boss`,
        chapter,
        say: `The ${entry.zone} boss is open again. Clear the guards and wake it: its Soul gets stronger, or joins you.`,
        waiting: `Fighting for the ${entry.zone} Soul.`,
        steps: [{ type: 'attemptBoss', biomeGroup: entry.biome, tier: 2 }],
      },
    );
    arrival = entry.soul;
  }
  const last = T2_ZONES[T2_ZONES.length - 1];
  beats.push({
    id: 't2:done',
    chapter: 'Tier 2',
    say: `${arrival} That is every Tier 2 summon and Soul. Keep going forward.`,
    steps: [{
      type: 'farm',
      at: { kind: 'biome', biomeGroup: last.biome, tier: 2 },
      until: { type: 'bossCleared', biomeGroup: last.biome, tier: 2 },
    }],
  });
  return beats;
}

/** In the order the guide walks them: Tier 3's order in the bible (§7.16), the two new zones last. */
const T3_ZONES: readonly T2Zone[] = [
  {
    biome: 'mountain', zone: 'Mountain',
    lesson: 'Warhorn is bound. It costs two Command, and its call makes every summon around it attack faster for a few seconds.',
    soul: 'The Mountain boss fell. Your Stoneplate Soul is rank 3, so the shield it gives is stronger still.',
  },
  {
    biome: 'cave', zone: 'Cave',
    lesson: 'Burrower is bound. It tunnels under its target and erupts, reaching the casters and gunners at the back.',
    soul: 'The Cave boss fell. Your Dreadbore Soul reached its last rank.',
  },
  {
    biome: 'swamp', zone: 'Swamp',
    lesson: 'Sporecaller is bound. Its spores make the enemies around its target deal less damage.',
    soul: 'The Swamp boss fell. Your Mire Behemoth Soul reached its last rank.',
  },
  {
    biome: 'jungle', zone: 'Jungle',
    lesson: 'Prowler is bound. It strikes from hiding every few seconds and pounces on enemies that flee.',
    soul: 'The Jungle boss fell. Your Dread-Gorger Soul is rank 2, so the chase is stronger.',
  },
  {
    biome: 'desert', zone: 'Desert',
    lesson: 'Carapace Guard is bound. It raises a shield toward the strongest ranged attacker and blocks shots at the summons behind it.',
    soul: 'The Desert boss fell. Your Dune-Stalker Soul is rank 2, so the mark grows faster.',
  },
  {
    biome: 'tundra', zone: 'Tundra',
    lesson: 'Frostcaller is bound. Enemies around it attack and move slower. Tundra bosses accept no control, so do not count on it there.',
    soul: 'The Tundra boss fell. The Rime-Mammoth Soul is yours: enemies near it are chilled.',
  },
  {
    biome: 'volcanic', zone: 'Volcanic',
    lesson: 'Cinderling is bound. It burns everything around it, and burns hotter the longer the fight lasts.',
    soul: 'The Volcanic boss fell. The Magma Salamander Soul is yours: your summons hit harder as a fight goes on.',
  },
];

const T3_SPECIALIZATION_SAY =
  'Tier 3 is open. Pick a specialization in the Passive Tree: your discipline offers three, and your Formation shows what it changes. The Tundra and Volcanic are new.';

/** The Tier 3 stretch after the Tier 2 one: the specialization pick, then every T3 zone (bible §7.6, §7.16). */
export function buildConduitT3Beats(): TutorialBeat[] {
  const beats: TutorialBeat[] = [];
  let arrival = T3_SPECIALIZATION_SAY;
  for (const entry of T3_ZONES) {
    const chapter = `Tier 3: ${entry.zone}`;
    const lessonLevel = absoluteZoneLevel({ kind: 'zone', biome: entry.biome, tier: 3, level: LESSON_ZONE_LEVEL });
    const cap = biomeLevelCap(3, entry.biome);
    beats.push(
      t2Farm(`t3:${entry.biome}`, chapter, arrival, `Fighting in the ${entry.zone}.`, entry.biome, lessonLevel, 3),
      t2Farm(`t3:${entry.biome}-lesson`, chapter, entry.lesson, `Fighting through the ${entry.zone}.`, entry.biome, cap, 3),
      {
        id: `t3:${entry.biome}-boss`,
        chapter,
        say: `The ${entry.zone} boss is open again. Clear the guards and wake it: its Soul gets stronger, or joins you.`,
        waiting: `Fighting for the ${entry.zone} Soul.`,
        steps: [{ type: 'attemptBoss', biomeGroup: entry.biome, tier: 3 }],
      },
    );
    arrival = entry.soul;
  }
  const last = T3_ZONES[T3_ZONES.length - 1];
  beats.push({
    id: 't3:done',
    chapter: 'Tier 3',
    say: `${arrival} That is every Tier 3 summon and Soul. Keep going forward.`,
    steps: [{
      type: 'farm',
      at: { kind: 'biome', biomeGroup: last.biome, tier: 3 },
      until: { type: 'bossCleared', biomeGroup: last.biome, tier: 3 },
    }],
  });
  return beats;
}

/** In the order the guide walks them: Tier 4's order in the bible (§7.16), the two new zones last. */
const T4_ZONES: readonly T2Zone[] = [
  {
    biome: 'mountain', zone: 'Mountain',
    lesson: 'Avalanche is bound. It costs three Command, the most of any summon, and every few seconds it charges through a line of enemies and knocks them down.',
    soul: 'The Mountain boss fell. Your Stoneplate Soul reached its last rank.',
  },
  {
    biome: 'tundra', zone: 'Tundra',
    lesson: 'Icewarden is bound. It wraps your most hurt summon in an ice shell that soaks damage.',
    soul: 'The Tundra boss fell. Your Rime-Mammoth Soul is rank 2, so its chill is stronger.',
  },
  {
    biome: 'jungle', zone: 'Jungle',
    lesson: 'Dartcaller is bound. Its poison darts ricochet to a second enemy.',
    soul: 'The Jungle boss fell. Your Dread-Gorger Soul is rank 3, so the chase is stronger still.',
  },
  {
    biome: 'desert', zone: 'Desert',
    lesson: 'Mirage is bound. It conjures a copy of you that draws attacks for a few seconds, and bosses that go for the player chase it.',
    soul: 'The Desert boss fell. Your Dune-Stalker Soul is rank 3, so the mark grows faster still.',
  },
  {
    biome: 'volcanic', zone: 'Volcanic',
    lesson: 'Obsidian Tortoise is bound. It costs two Command, and every so often it withdraws into its shell and takes almost no damage while it keeps taunting.',
    soul: 'The Volcanic boss fell. Your Magma Salamander Soul is rank 2, so the fight ramps harder.',
  },
  {
    biome: 'graveyard', zone: 'Graveyard',
    lesson: 'Gravecaller is bound. When one of your summons dies, it rises once as a spectral husk before it goes to the rebuild queue. Area damage matters most here.',
    soul: 'The Graveyard boss fell. The Charnel-Crown Soul is yours: enemies your summons kill rise for a while as thralls.',
  },
  {
    biome: 'trench', zone: 'Trench',
    lesson: 'Abyssal Warden is bound. Every few seconds it pulls a debuff off a nearby summon, or off you, onto itself.',
    soul: 'The Trench boss fell. The Elder Serpent Soul is yours: your summons toughen as a fight goes on.',
  },
];

const T4_LEAF_SAY =
  'Tier 4 is open. Pick a leaf in the Passive Tree: a small pick for your discipline, on how your summons die, come back, or survive. The Graveyard and the Trench are new.';

/** The Tier 4 stretch after the Tier 3 one: the leaf pick, then every T4 zone (bible §7.7, §7.16). */
export function buildConduitT4Beats(): TutorialBeat[] {
  const beats: TutorialBeat[] = [];
  let arrival = T4_LEAF_SAY;
  for (const entry of T4_ZONES) {
    const chapter = `Tier 4: ${entry.zone}`;
    const lessonLevel = absoluteZoneLevel({ kind: 'zone', biome: entry.biome, tier: 4, level: LESSON_ZONE_LEVEL });
    const cap = biomeLevelCap(4, entry.biome);
    beats.push(
      t2Farm(`t4:${entry.biome}`, chapter, arrival, `Fighting in the ${entry.zone}.`, entry.biome, lessonLevel, 4),
      t2Farm(`t4:${entry.biome}-lesson`, chapter, entry.lesson, `Fighting through the ${entry.zone}.`, entry.biome, cap, 4),
      {
        id: `t4:${entry.biome}-boss`,
        chapter,
        say: `The ${entry.zone} boss is open again. Clear the guards and wake it: its Soul gets stronger, or joins you.`,
        waiting: `Fighting for the ${entry.zone} Soul.`,
        steps: [{ type: 'attemptBoss', biomeGroup: entry.biome, tier: 4 }],
      },
    );
    arrival = entry.soul;
  }
  const last = T4_ZONES[T4_ZONES.length - 1];
  beats.push({
    id: 't4:done',
    chapter: 'Tier 4',
    say: `${arrival} That is every Tier 4 summon and Soul.`,
    steps: [{
      type: 'farm',
      at: { kind: 'biome', biomeGroup: last.biome, tier: 4 },
      until: { type: 'bossCleared', biomeGroup: last.biome, tier: 4 },
    }],
  });
  return beats;
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
    ...buildConduitT2Beats(),
    ...buildConduitT3Beats(),
    ...buildConduitT4Beats(),
  ];
}
