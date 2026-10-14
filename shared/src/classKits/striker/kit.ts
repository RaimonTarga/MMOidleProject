/**
 * The Striker's kit (`cadence`): bible §12.
 *
 * The combo fighter. Pieces are **techniques** placed on the beats of the Order; the
 * finisher is the relic slot's trophy (a plain finisher until the first boss kill). The
 * budget is "open, then master": each step opens a beat for a technique, then masters one.
 *
 * T1 is complete here (§12.4) and is the worked example for the other kits. Rend II (T2)
 * and Hemorrhage (T3) are kept here as examples of a rank-up and a sidegrade; the rest of
 * T2–T4 (§12.16), the disciplines (§12.5), specializations (§12.6) and leaves (§12.7) are
 * entered by task K1.
 */
import { standardBudgetSteps } from '../budget';
import { STARTER, learn, rankUp, zone } from '../kitHelpers';
import type { ClassKit, PieceDef, TrophyDef } from '../types';

/**
 * Technique families (§12.8): attack setups (make your beats faster or harder; Light's),
 * finisher setups and control (Heavy's), damage techniques (Balanced's).
 */
export type StrikerFamily = 'damage' | 'attack-setup' | 'finisher-setup';

export interface StrikerPieceExtra {
  /**
   * A cast sits at one of two positions, at most one of each per combo (§12.2): the opener
   * (the first beat) or the wind-up (the beat before the finisher). Attack speed never
   * shortens a cast.
   */
  cast?: 'opener' | 'windup';
  /** A control technique (slow, stun, root, knockdown): what Subjugator feeds on (§12.6). */
  control?: true;
  /** The combo's last beat. Only the plain finisher carries this; trophies replace it. */
  finisher?: true;
}

export type StrikerPiece = PieceDef<StrikerFamily, StrikerPieceExtra>;

/** Spark trophies ride the next combo; weight trophies land on the finisher (§12.9). */
export type StrikerTrophyKind = 'spark' | 'weight';
export type StrikerTrophy = TrophyDef<StrikerTrophyKind>;

export function technique(piece: Omit<StrikerPiece, 'classId' | 'params'>): StrikerPiece {
  return { classId: 'cadence', params: {}, ...piece };
}

export function strikerTrophy(entry: Omit<StrikerTrophy, 'classId' | 'params'>): StrikerTrophy {
  return { classId: 'cadence', params: {}, ...entry };
}

const PIECES: readonly StrikerPiece[] = [
  technique({
    id: 'striker-finisher',
    name: 'Finisher',
    family: 'damage',
    finisher: true,
    text: "The last beat of every combo: one heavy blow. Each boss you beat gives you a finisher of its own.",
  }),
  // ── T1 (§12.4) ──
  technique({
    id: 'striker-sweep',
    name: 'Sweep',
    family: 'damage',
    text: 'Hits every enemy around you.',
  }),
  technique({
    id: 'striker-hamstring',
    name: 'Hamstring',
    // An attack setup by §12.16's family totals (4 by T2); also control, which Subjugator reads.
    family: 'attack-setup',
    control: true,
    text: 'The target attacks and moves slower for a moment.',
  }),
  technique({
    id: 'striker-rend',
    name: 'Rend',
    family: 'damage',
    text: 'Opens a bleed on the target.',
    ranks: [{ rank: 2, text: 'The bleed lasts longer and cuts deeper.' }],
  }),
  technique({
    id: 'striker-coil',
    name: 'Coil',
    family: 'finisher-setup',
    cast: 'windup',
    text: 'You wind up before the finisher, and the finisher hits much harder.',
  }),
  technique({
    id: 'striker-focus',
    name: 'Focus',
    family: 'attack-setup',
    cast: 'opener',
    text: 'You open the combo with a breath of focus, and every beat after it swings faster.',
  }),
  // ── A later-tier example (§12.16); task K1 enters the rest ──
  technique({
    id: 'striker-hemorrhage',
    name: 'Hemorrhage',
    family: 'damage',
    sidegradeOf: 'striker-rend',
    text: 'Opens a deep bleed that outlasts Rend.',
  }),
];

const LESSONS = [
  learn('striker-finisher', STARTER),
  learn('striker-sweep', zone('plains', 1)),
  learn('striker-hamstring', zone('forest', 1)),
  learn('striker-rend', zone('swamp', 1)),
  learn('striker-coil', zone('mountain', 1)),
  learn('striker-focus', zone('cave', 1)),
  // Later-tier examples: a rank-up (T2) and a sidegrade (T3)
  rankUp('striker-rend', 2, zone('swamp', 2)),
  learn('striker-hemorrhage', zone('swamp', 3), 'sidegrade'),
];

/** One trophy per boss lineage (§12.4, §12.16); ranks come from the same lineage's later bosses. */
const TROPHIES: readonly StrikerTrophy[] = [
  strikerTrophy({
    id: 'striker-relic-plains',
    lineage: 'plains',
    name: 'Wide Arc',
    kind: 'spark',
    text: "Your next combo's beats each also strike one enemy beside the target.",
    ranks: [{ rank: 2, bossTier: 2, text: 'They strike two extra enemies.' }],
  }),
  strikerTrophy({
    id: 'striker-relic-forest',
    lineage: 'forest',
    name: 'Double Slash',
    kind: 'spark',
    text: 'Every beat of your next combo strikes twice, each strike a bit over half as hard.',
    ranks: [{ rank: 2, bossTier: 2, text: 'Each strike hits harder.' }],
  }),
  strikerTrophy({
    id: 'striker-relic-swamp',
    lineage: 'swamp',
    name: 'Festering Cut',
    kind: 'weight',
    text: "Your finisher's wound rots, dealing part of its damage again.",
    ranks: [
      { rank: 2, bossTier: 2, text: 'The rot deals a bigger share.' },
      { rank: 3, bossTier: 3, text: 'The rot deals a bigger share still.' },
    ],
  }),
  strikerTrophy({
    id: 'striker-relic-mountain',
    lineage: 'mountain',
    name: 'Skyfall',
    kind: 'weight',
    text: 'Your finisher becomes a cast: a longer wind-up, then a blow about twice as big.',
    ranks: [
      { rank: 2, bossTier: 2, text: 'The blow also ignores part of the plating.' },
      { rank: 3, bossTier: 3, text: 'The wind-up is shorter.' },
      { rank: 4, bossTier: 4, text: 'The blow hits harder still.' },
    ],
  }),
  strikerTrophy({
    id: 'striker-relic-cave',
    lineage: 'cave',
    name: 'Sunder',
    kind: 'weight',
    text: 'Your finisher exposes the target: it takes more damage from everyone for a few seconds.',
    ranks: [
      { rank: 2, bossTier: 2, text: 'The exposed target also loses plating.' },
      { rank: 3, bossTier: 3, text: 'The exposure lasts longer.' },
    ],
  }),
];

export const STRIKER_KIT: ClassKit<StrikerPiece, StrikerTrophy> = {
  classId: 'cadence',
  className: 'striker',
  displayName: 'Striker',
  systemName: 'the Order',
  /** Illustrative T1: one slot at the start, two at Mastery 15, three at Mastery 30 (§12.3). */
  budget: { label: 'Techniques', steps: standardBudgetSteps(1) },
  pieces: PIECES,
  lessons: LESSONS,
  trophies: TROPHIES,
  disciplines: [],
  specializations: [],
  leaves: [],
};
