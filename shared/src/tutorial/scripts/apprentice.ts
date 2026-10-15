/**
 * The Apprentice's guided T1 (AP6, bible §9.4), built on the seal route.
 * Zone farms stop at the lesson, then the payoff line carries on to the cap.
 * Mountain has no walk in the seal route, so its lesson precedes the boss.
 *
 * After the tier-2 promotion the guide goes on through the T2 table (§9.16): the school pick,
 * then each T2 zone as a farm to its lesson, the lesson line (the farm goes on to the zone's
 * cap) and the boss line, which names the trophy the kill ranks up. The T3 stretch (§9.16) repeats
 * that shape for the seven T3 zones, opening with the specialization pick. The T4 stretch does the same for the seven T4
 * zones (the Wasteland and the Trench new), opening with the leaf pick.
 */
import { APPRENTICE_KIT } from '../../classKits/apprentice/kit';
import { LESSON_ZONE_LEVEL } from '../../classKits/kitHelpers';
import { absoluteZoneLevel } from '../../classKits/registry';
import { biomeLevelCap } from '../../config/gameConfig';
import type { TutorialBeat } from '../types';
import { TUTORIAL_SEALS } from './plans';
import { buildSealRouteBeats } from './sealRoute';

const LESSONS: Readonly<Record<string, { id: string; say: string }>> = {
  plains: {
    id: 'apprentice-spread-lesson',
    say: 'Spread is learned: full sigils and two or more enemies near means Spread; otherwise Detonate. Keep fighting until the Plains boss is open.',
  },
  forest: {
    id: 'apprentice-numb-lesson',
    say: 'Numb spends a target\'s sigils to slow its attacks and movement.',
  },
  swamp: {
    id: 'apprentice-siphon-lesson',
    say: 'Siphon spends a target\'s sigils to heal you when your health is low.',
  },
  cave: {
    id: 'apprentice-converge-lesson',
    say: 'Converge pulls nearby enemies\' sigils onto your target, even past its cap.',
  },
};

/** Split a seal farm so the payoff line appears when its lesson is learned. */
function splitAtLesson(beat: TutorialBeat): TutorialBeat[] {
  const step = beat.steps[0];
  if (step?.type !== 'farm' || step.until.type !== 'biomeLevelAtLeast') return [beat];
  const biomeGroup = step.until.biomeGroup;
  const lesson = LESSONS[biomeGroup];
  if (!lesson) return [beat];
  return [
    {
      ...beat,
      progress: [{ type: 'biomeLevel', biomeGroup, level: LESSON_ZONE_LEVEL }],
      steps: [{ ...step, until: { type: 'biomeLevelAtLeast', biomeGroup, level: LESSON_ZONE_LEVEL } }],
    },
    {
      id: lesson.id,
      chapter: beat.chapter,
      say: lesson.say,
      waiting: beat.waiting,
      progress: beat.progress,
      steps: beat.steps,
    },
  ];
}

/** What each zone gives at a tier (bible §9.16): its lesson (a new piece or a rank-up) and its trophy line. */
interface TierZone {
  biome: string;
  name: string;
  chapter: string;
  intro: string;
  lesson: { pieceId: string; rank: number; say: string };
  boss: string;
}

/** The T2 stretch in the bible's table order. Lines name moments as the Payoff rules do. */
const T2_ZONES: readonly TierZone[] = [
  {
    biome: 'plains',
    name: 'Plains',
    chapter: 'The Plains, Tier 2',
    intro: 'Tier 2: pick a school. Poison spreads on its own, Fire chains its blasts, Frost freezes then shatters. Fight the Plains on.',
    lesson: { pieceId: 'apprentice-blast-back', rank: 1, say: 'Blast Back is learned: a Detonate on a charging enemy stops its charge. Place it on "an enemy charges or leaps at you".' },
    boss: 'The Plains boss ranks up Outbreak: Spread will pass to three neighbours. Clear the guards, then the altar.',
  },
  {
    biome: 'forest',
    name: 'Forest',
    chapter: 'The Forest, Tier 2',
    intro: 'The Forest again, with stuns and duels. Fight through it.',
    lesson: { pieceId: 'apprentice-numb', rank: 2, say: 'Numb is stronger: a numbed enemy\'s wind-ups also take longer.' },
    boss: 'The Forest boss ranks up Firstbrand: your first hit lays half a bar. Clear the guards, then the altar.',
  },
  {
    biome: 'mountain',
    name: 'Mountain',
    chapter: 'The Mountain, Tier 2',
    intro: 'The Mountain now has barriers you can break. Fight up it.',
    lesson: { pieceId: 'apprentice-sear', rank: 1, say: 'Sear is learned: spend a shielded target\'s sigils to burn its barrier at double. Place it on "the target raises a shield".' },
    boss: 'The Mountain boss ranks up Petrify: a held enemy also takes more from your ticks. Clear the guards, then the altar.',
  },
  {
    biome: 'swamp',
    name: 'Swamp',
    chapter: 'The Swamp, Tier 2',
    intro: 'The Swamp now has rain and Corrosion. Fight through it.',
    lesson: { pieceId: 'apprentice-siphon', rank: 2, say: 'Siphon is stronger: it also washes a poison, bleed or Corrosion off you.' },
    boss: 'The Swamp boss ranks up Glut: twice the drain reach. Clear the guards, then the altar.',
  },
  {
    biome: 'cave',
    name: 'Cave',
    chapter: 'The Cave, Tier 2',
    intro: 'The Cave now erupts from below. Fight through it.',
    lesson: { pieceId: 'apprentice-seep', rank: 1, say: 'Seep is learned: an enemy that burrows out of reach keeps ticking, doubled. Place it on "out of reach".' },
    boss: 'The Cave boss ranks up Brood Sigils: one every 1.5 seconds. Clear the guards, then the altar.',
  },
  {
    biome: 'jungle',
    name: 'Jungle',
    chapter: 'The Jungle',
    intro: 'The Jungle is new: prey that flees, and ambushers from cover. Fight through it.',
    lesson: { pieceId: 'apprentice-snag', rank: 1, say: 'Snag is learned: a fleeing or kiting enemy with a full bar is rooted. Place it on "the target flees".' },
    boss: 'The Jungle boss gives Scent: sigils on an enemy that runs never fall off. Clear the guards, then the altar.',
  },
  {
    biome: 'desert',
    name: 'Desert',
    chapter: 'The Desert',
    intro: 'The Desert is new: marks, slows and kiters. Fight through it.',
    lesson: { pieceId: 'apprentice-recoil', rank: 1, say: 'Recoil is learned: when a mark, slow or curse lands on you, its caster catches a full bar. Place it on "a debuff lands".' },
    boss: 'The Desert boss gives Dune Wind: Spread can leap any distance. Clear the guards, then the altar.',
  },
];

/**
 * The T3 stretch in the bible's table order (the Plains and Forest have retired). Lines name the
 * trophy rank-ups the bible gives without a twist as "stronger"; the Jungle's, Desert's and
 * Volcanic's gear jobs are not taught here.
 */
const T3_ZONES: readonly TierZone[] = [
  {
    biome: 'mountain',
    name: 'Mountain',
    chapter: 'The Mountain, Tier 3',
    intro: 'Tier 3: pick a specialization in the Passive Tree, under your school. Fight up the Mountain, now with double charges.',
    lesson: { pieceId: 'apprentice-seize', rank: 2, say: 'Seize is stronger: it catches a second wind-up within a few seconds.' },
    boss: 'The Mountain boss ranks up Petrify: a longer hold. Clear the guards, then the altar.',
  },
  {
    biome: 'cave',
    name: 'Cave',
    chapter: 'The Cave, Tier 3',
    intro: 'The Cave now chases through tunnels. Fight through it.',
    lesson: { pieceId: 'apprentice-seep', rank: 2, say: 'Seep is stronger: when the enemy surfaces, its sigils burst onto every enemy near the spot.' },
    boss: 'The Cave boss ranks up Brood Sigils to its last rank: one every second. Clear the guards, then the altar.',
  },
  {
    biome: 'swamp',
    name: 'Swamp',
    chapter: 'The Swamp, Tier 3',
    intro: 'The Swamp has spores, detonating pools and a drag. Fight through it.',
    lesson: { pieceId: 'apprentice-spore-burst', rank: 1, say: 'Spore Burst is learned: spend the sigils on a target to burst half onto every enemy around it. Place it beside Spread.' },
    boss: 'The Swamp boss ranks up Glut to its last rank: a wider drain. Clear the guards, then the altar.',
  },
  {
    biome: 'jungle',
    name: 'Jungle',
    chapter: 'The Jungle, Tier 3',
    intro: 'The Jungle again, with pursuit and flight. Fight through it.',
    lesson: { pieceId: 'apprentice-snag', rank: 2, say: 'Snag is stronger: the root also holds every enemy near the snagged one.' },
    boss: 'The Jungle boss ranks up Scent: sigils on a runner tick even faster. Clear the guards, then the altar.',
  },
  {
    biome: 'desert',
    name: 'Desert',
    chapter: 'The Desert, Tier 3',
    intro: 'The Desert again, with postures and a dash-escape. Fight through it.',
    lesson: { pieceId: 'apprentice-signal-fire', rank: 1, say: 'Signal Fire is learned: a detonation on your target also sets off your sigils on the enemy furthest from you.' },
    boss: 'The Desert boss ranks up Dune Wind: the leap reaches further. Clear the guards, then the altar.',
  },
  {
    biome: 'tundra',
    name: 'Tundra',
    chapter: 'The Tundra',
    intro: 'The Tundra is new: a Chill that builds on you, and bosses that accept no control. Fight through it.',
    lesson: { pieceId: 'apprentice-melt', rank: 1, say: 'Melt is learned: when the Chill on you reaches its threshold, you spend the sigils of the nearest enemy to melt it off. Place it on that moment.' },
    boss: 'The Tundra boss gives Frostheart: every Seize leaves its target brittle after. Clear the guards, then the altar.',
  },
  {
    biome: 'volcanic',
    name: 'Volcanic',
    chapter: 'The Volcanic',
    intro: 'The Volcanic is new: Heat, vents and shells. Fight through it.',
    lesson: { pieceId: 'apprentice-cinderfall', rank: 1, say: 'Cinderfall is learned: a detonation that hits everything around the target, each paying a share. Place it beside Detonate.' },
    boss: 'The Volcanic boss gives Magma Core: sigils on a shelled enemy tick through the shell. Clear the guards, then the altar.',
  },
];

/**
 * The T4 stretch in the bible's table order (§9.16). The Wasteland is the `graveyard` biome. Rank-ups
 * the bible gives without a twist read as "stronger"; the gear jobs are not taught here.
 */
const T4_ZONES: readonly TierZone[] = [
  {
    biome: 'mountain',
    name: 'Mountain',
    chapter: 'The Mountain, Tier 4',
    intro: 'Tier 4: pick a leaf in the Passive Tree, under your school. It answers what reaches you. Fight up the Mountain.',
    lesson: { pieceId: 'apprentice-seize', rank: 3, say: 'Seize is stronger: it also cancels the target\'s ground telegraphs.' },
    boss: 'The Mountain boss ranks up Petrify: a longer hold again. Clear the guards, then the altar.',
  },
  {
    biome: 'tundra',
    name: 'Tundra',
    chapter: 'The Tundra, Tier 4',
    intro: 'The Tundra again, with shields that harden. Fight through it.',
    lesson: { pieceId: 'apprentice-frostcrack', rank: 1, say: 'Frostcrack is learned: a Seize on a shielded or shelled enemy cracks the shell open. Place it on "the target raises a shield".' },
    boss: 'The Tundra boss ranks up Frostheart: a longer brittle after every Seize. Clear the guards, then the altar.',
  },
  {
    biome: 'jungle',
    name: 'Jungle',
    chapter: 'The Jungle, Tier 4',
    intro: 'The Jungle again, with hiders and runners. Fight through it.',
    lesson: { pieceId: 'apprentice-spread', rank: 2, say: 'Spread is stronger: it also reaches enemies that hide or flee nearby.' },
    boss: 'The Jungle boss ranks up Scent: sigils on a runner tick faster still. Clear the guards, then the altar.',
  },
  {
    biome: 'desert',
    name: 'Desert',
    chapter: 'The Desert, Tier 4',
    intro: 'The Desert again, with harsher debuffs. Fight through it.',
    lesson: { pieceId: 'apprentice-recoil', rank: 2, say: 'Recoil is stronger: its caster also suffers the effect it put on you.' },
    boss: 'The Desert boss ranks up Dune Wind: the leap reaches two more enemies. Clear the guards, then the altar.',
  },
  {
    biome: 'volcanic',
    name: 'Volcanic',
    chapter: 'The Volcanic, Tier 4',
    intro: 'The Volcanic again, hotter. Fight through it.',
    lesson: { pieceId: 'apprentice-cinderfall', rank: 2, say: 'Cinderfall is stronger: each step of the Heat widens the blast.' },
    boss: 'The Volcanic boss ranks up Magma Core: a stronger tick through the shell. Clear the guards, then the altar.',
  },
  {
    biome: 'graveyard',
    name: 'Wasteland',
    chapter: 'The Wasteland',
    intro: 'The Wasteland is new: the dead rise again. Fight through it.',
    lesson: { pieceId: 'apprentice-pyre', rank: 1, say: 'Pyre is learned: a fallen enemy carrying your sigils burns and cannot rise. Place it on "an enemy rises".' },
    boss: 'The Wasteland boss gives Dirge: a Detonate also sets off your sigils on every risen enemy. Clear the guards, then the altar.',
  },
  {
    biome: 'trench',
    name: 'Trench',
    chapter: 'The Trench',
    intro: 'The Trench is new: hunters, kiters and anchors out of reach. Fight through it.',
    lesson: { pieceId: 'apprentice-transference', rank: 1, say: 'Transference is learned: spend the target\'s sigils to move a debuff off you onto it. Place it beside Detonate.' },
    boss: 'The Trench boss gives Pressure Fuse: a Detonate on a target out of reach waits, then goes off doubled. Clear the guards, then the altar.',
  },
];

/** The zone's biome level at which its lesson arrives, as the kit counts it. */
function lessonLevel(zone: TierZone): number {
  const lesson = APPRENTICE_KIT.lessons.find((entry) => entry.pieceId === zone.lesson.pieceId && entry.rank === zone.lesson.rank);
  if (lesson?.source.kind !== 'zone') throw new Error(`apprentice tutorial: ${zone.lesson.pieceId} has no zone lesson`);
  return absoluteZoneLevel(lesson.source);
}

/** A tier's zones as beats: the farm to the lesson, the lesson (farm on to the cap), the boss. */
function buildTierBeats(tier: number, zones: readonly TierZone[]): TutorialBeat[] {
  return zones.flatMap((zone): TutorialBeat[] => {
    const at = { kind: 'biome' as const, biomeGroup: zone.biome, tier };
    const lessonAt = lessonLevel(zone);
    const cap = biomeLevelCap(tier, zone.biome);
    const lessonId = zone.lesson.rank === 1 ? zone.lesson.pieceId : `${zone.lesson.pieceId}-${zone.lesson.rank}`;
    const waiting = `Fighting in the ${zone.name}.`;
    return [
      {
        id: `apprentice-t${tier}-${zone.biome}`,
        chapter: zone.chapter,
        say: zone.intro,
        waiting,
        progress: [{ type: 'biomeLevel', biomeGroup: zone.biome, level: lessonAt }],
        steps: [{ type: 'farm', at, until: { type: 'biomeLevelAtLeast', biomeGroup: zone.biome, level: lessonAt } }],
      },
      {
        id: `${lessonId}-lesson`,
        chapter: zone.chapter,
        say: zone.lesson.say,
        waiting,
        progress: [{ type: 'biomeLevel', biomeGroup: zone.biome, level: cap }],
        steps: [{ type: 'farm', at, until: { type: 'biomeLevelAtLeast', biomeGroup: zone.biome, level: cap } }],
      },
      {
        id: `apprentice-boss-${zone.biome}-${tier}`,
        chapter: zone.chapter,
        say: zone.boss,
        waiting: `Fighting for the ${zone.name} boss.`,
        steps: [{ type: 'attemptBoss', biomeGroup: zone.biome, tier }],
      },
    ];
  });
}

/** Beats after the shared opening; its Clearing equipment stays unchanged. */
export function buildApprenticeBeats(): TutorialBeat[] {
  const [firstSeal, secondSeal] = TUTORIAL_SEALS;
  const t1 = buildSealRouteBeats().flatMap((beat): TutorialBeat[] => {
    if (beat.id === `open:${firstSeal}`) {
      return splitAtLesson({
        ...beat,
        say: 'A plain wand. Sigils 4: pips on enemies. In Payoff rules, full means Detonate. The Plains first; fight until their boss is open.',
      });
    }
    if (beat.id === 'zone:forest') {
      return splitAtLesson({
        ...beat,
        say: 'The base kit won your first boss. Outbreak makes Spread reach two neighbours. The Forest fights in fast packs. Cut through it.',
      });
    }
    if (beat.id === `boss:${secondSeal}`) {
      return [
        {
          id: 'apprentice-mountain-approach',
          chapter: beat.chapter,
          say: 'The Mountain hits the hardest. Fight up it.',
          waiting: 'Fighting up the Mountain.',
          progress: [{ type: 'biomeLevel', biomeGroup: secondSeal, level: LESSON_ZONE_LEVEL }],
          steps: [{
            type: 'farm',
            at: { kind: 'biome', biomeGroup: secondSeal, tier: 1 },
            until: {
              type: 'anyOf',
              of: [
                { type: 'biomeLevelAtLeast', biomeGroup: secondSeal, level: LESSON_ZONE_LEVEL },
                { type: 'bossCleared', biomeGroup: secondSeal, tier: 1 },
              ],
            },
          }],
        },
        {
          ...beat,
          say: 'Seize spends a target\'s sigils to stop its wind-up. The Mountain boss is the second seal. Two seals open the next tier. Clear the guards, then the altar.',
        },
      ];
    }
    if (beat.id === 'farewell') {
      return [{ ...beat, say: 'Two seals, and Tier 2. A school and new lessons wait in the zones ahead.' }];
    }
    return splitAtLesson(beat);
  });
  // The farewell waits on tier 2; the T2, T3 and T4 stretches follow it, and the panel's goodbye comes last.
  return [...t1, ...buildTierBeats(2, T2_ZONES), ...buildTierBeats(3, T3_ZONES), ...buildTierBeats(4, T4_ZONES)];
}
