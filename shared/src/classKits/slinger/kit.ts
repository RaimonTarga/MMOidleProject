/**
 * The Slinger's kit (`reload`): bible §10.
 *
 * The gunslinger. Pieces are **clip types**: every round in a clip is the same, and the
 * Loadout's free rules pick the next clip at each reload. The relic slot's trophy is the
 * **last round** of every clip. The budget is rack slots, then double loads.
 *
 * Only the starter is entered; task K4 enters T1–T4 (§10.4, §10.8, §10.16), the trophy rounds
 * (§10.9), the disciplines (§10.5), specializations (§10.6) and leaves (§10.7), following the
 * Striker's kit as the worked example. Clip colours are the ammo ring's (ICONS-T1 uses the
 * same ones).
 */
import { STARTER, learn } from '../kitHelpers';
import type { BudgetStep, ClassKit, PieceDef, TrophyDef } from '../types';

/** Clip families (§10.8). The plain clip is the damage clip. */
export type SlingerFamily = 'damage' | 'control' | 'utility';

export interface SlingerPieceExtra {
  /** The ammo ring's colour for this clip (`#rrggbb`). */
  color: string;
  /** The plain clip: always in the rack, takes no slot, pays no price (§10.3). */
  plain?: true;
}

export type SlingerPiece = PieceDef<SlingerFamily, SlingerPieceExtra>;

/** Every Slinger trophy is a round loaded last in every clip (§10.2). */
export type SlingerTrophyKind = 'round';
export type SlingerTrophy = TrophyDef<SlingerTrophyKind>;

/** The trophy rounds' colour on the ring. */
export const SLINGER_LAST_ROUND_COLOR = '#f5c542';

export function clip(piece: Omit<SlingerPiece, 'classId' | 'params'>): SlingerPiece {
  return { classId: 'reload', params: {}, ...piece };
}

export function slingerTrophy(entry: Omit<SlingerTrophy, 'classId' | 'params' | 'kind'>): SlingerTrophy {
  return { classId: 'reload', params: {}, kind: 'round', ...entry };
}

const PIECES: readonly SlingerPiece[] = [
  clip({
    id: 'slinger-plain-clip',
    name: 'Plain clip',
    family: 'damage',
    plain: true,
    color: '#9aa3ad',
    text: 'Plain rounds that hit the hardest. Always in your rack.',
  }),
];

const LESSONS = [
  learn('slinger-plain-clip', STARTER),
];

/**
 * Illustrative (§10.2): one rack slot at the start, two at Mastery 15, three at 30, four by
 * the end of T2; from T3 each step lets one clip carry two properties (a double load).
 */
const RACK_STEPS: readonly BudgetStep[] = [
  { mastery: 0, value: 1 },
  { mastery: 15, value: 2 },
  { mastery: 30, value: 3 },
  { mastery: 72, value: 4 },
  { mastery: 86, value: 5 },
  { mastery: 100, value: 6 },
  { mastery: 114, value: 7 },
  { mastery: 128, value: 8 },
  { mastery: 142, value: 9 },
  { mastery: 156, value: 10 },
];

/** Rack slots stop at four; every step after that is one more double load. */
export const SLINGER_RACK_SLOT_MAX = 4;

export function slingerRack(value: number): { slots: number; doubleLoads: number } {
  return {
    slots: Math.min(value, SLINGER_RACK_SLOT_MAX),
    doubleLoads: Math.max(0, value - SLINGER_RACK_SLOT_MAX),
  };
}

export const SLINGER_KIT: ClassKit<SlingerPiece, SlingerTrophy> = {
  classId: 'reload',
  className: 'slinger',
  displayName: 'Slinger',
  systemName: 'the Loadout',
  budget: {
    label: 'Rack',
    steps: RACK_STEPS,
    describe: (value) => {
      const { slots, doubleLoads } = slingerRack(value);
      if (doubleLoads === 0) return String(slots);
      return `${slots}, ${doubleLoads} double load${doubleLoads === 1 ? '' : 's'}`;
    },
  },
  pieces: PIECES,
  lessons: LESSONS,
  trophies: [],
  disciplines: [],
  specializations: [],
  leaves: [],
};
