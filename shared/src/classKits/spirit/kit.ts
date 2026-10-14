/**
 * The Spirit's kit (`energy`): bible §11.
 *
 * The storm in a bottle: one bar that is both damage and shield. Pieces are **spends**
 * (strikes, squalls) and **calms**, placed in bands on the Thresholds gauge; each spend
 * waits for its moment. The relic slot's trophy is a spend relic or a storm relic. The
 * budget is the bottle's size in pips.
 *
 * Only the starter is entered; task K5 enters T1–T4 (§11.4, §11.8, §11.16), the trophies
 * (§11.9), the disciplines (§11.5), specializations (§11.6) and leaves (§11.7), following the
 * Striker's kit as the worked example.
 */
import { standardBudgetSteps } from '../budget';
import { STARTER, learn } from '../kitHelpers';
import type { MomentId } from '../moments';
import type { ClassKit, PieceDef, TrophyDef } from '../types';

/** Piece families (§11.3): strikes (damage), squalls (control and movement), calms (protection). */
export type SpiritFamily = 'strike' | 'squall' | 'calm';

export interface SpiritPieceExtra {
  /**
   * The moment it waits for inside its band (§11.3): Thunderclap waits for an enemy touching
   * you, Downpour for a poison or bleed on you. Absent: it fires whenever its band allows.
   */
  waitsFor?: MomentId;
  /** A calm that sits at the floor rather than in a band (Eye of the Storm). */
  atFloor?: true;
}

export type SpiritPiece = PieceDef<SpiritFamily, SpiritPieceExtra>;

/** Spend relics twist every spend; storm relics twist the gauge (§11.9). */
export type SpiritTrophyKind = 'spend' | 'storm';
export type SpiritTrophy = TrophyDef<SpiritTrophyKind>;

export function spiritPiece(piece: Omit<SpiritPiece, 'classId' | 'params'>): SpiritPiece {
  return { classId: 'energy', params: {}, ...piece };
}

export function spiritTrophy(entry: Omit<SpiritTrophy, 'classId' | 'params'>): SpiritTrophy {
  return { classId: 'energy', params: {}, ...entry };
}

const PIECES: readonly SpiritPiece[] = [
  spiritPiece({
    id: 'spirit-bolt',
    name: 'Bolt',
    family: 'strike',
    text: 'Spends part of your storm on one bolt of lightning at the target.',
  }),
];

const LESSONS = [
  learn('spirit-bolt', STARTER),
];

export const SPIRIT_KIT: ClassKit<SpiritPiece, SpiritTrophy> = {
  classId: 'energy',
  className: 'spirit',
  displayName: 'Spirit',
  systemName: 'Thresholds',
  /** Illustrative: Storm 4 → 5 at Mastery 15 → 6 at 30 (§11.2). */
  budget: { label: 'Storm', steps: standardBudgetSteps(4) },
  pieces: PIECES,
  lessons: LESSONS,
  trophies: [],
  disciplines: [],
  specializations: [],
  leaves: [],
};
