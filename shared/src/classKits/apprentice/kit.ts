/**
 * The Apprentice's kit (`dot`): bible §9.
 *
 * The student of three schools. Its hits lay **sigils** on enemies; pieces are **payoffs**
 * dropped on moments of the enemy (full, winds up, low, shell up, frozen, dies, out of reach)
 * in the Payoff rules. The relic slot's trophy is a payoff relic or a sigil relic. The budget
 * is the sigil cap: how many sigils every enemy can hold.
 *
 * Only the starter is entered; task K3 enters T1–T4 (§9.4, §9.8, §9.16), the trophies (§9.9),
 * the disciplines (§9.5), specializations (§9.6) and leaves (§9.7), following the Striker's
 * kit as the worked example.
 */
import { standardBudgetSteps } from '../budget';
import { STARTER, learn } from '../kitHelpers';
import type { MomentId } from '../moments';
import type { ClassKit, PieceDef, TrophyDef } from '../types';

/** The three schools (§9.8). A payoff belongs to one; every discipline keeps the others' basics. */
export type ApprenticeSchool = 'poison' | 'fire' | 'frost';

export interface ApprenticePieceExtra {
  /**
   * The one moment this lesson happens at, for lessons bound to their own moment (Seep: an
   * enemy goes out of reach; Recoil: a debuff lands on you). Payoffs without it are placed
   * freely on any moment of the enemy card.
   */
  moment?: MomentId;
}

export type ApprenticePiece = PieceDef<ApprenticeSchool, ApprenticePieceExtra>;

/** Payoff relics change what a payoff does; sigil relics change how sigils build (§9.9). */
export type ApprenticeTrophyKind = 'payoff' | 'sigil';
export type ApprenticeTrophy = TrophyDef<ApprenticeTrophyKind>;

export function payoff(piece: Omit<ApprenticePiece, 'classId' | 'params'>): ApprenticePiece {
  return { classId: 'dot', params: {}, ...piece };
}

export function apprenticeTrophy(entry: Omit<ApprenticeTrophy, 'classId' | 'params'>): ApprenticeTrophy {
  return { classId: 'dot', params: {}, ...entry };
}

const PIECES: readonly ApprenticePiece[] = [
  payoff({
    id: 'apprentice-detonate',
    name: 'Detonate',
    family: 'fire',
    text: "Sets off every sigil on the target at once, dealing what they still had to deal in one blast.",
  }),
];

const LESSONS = [
  learn('apprentice-detonate', STARTER),
];

export const APPRENTICE_KIT: ClassKit<ApprenticePiece, ApprenticeTrophy> = {
  classId: 'dot',
  className: 'apprentice',
  displayName: 'Apprentice',
  systemName: 'Payoff rules',
  /** Illustrative: 4 sigils at the start, 5 at Mastery 15, 6 at 30 (§9.2). */
  budget: { label: 'Sigils', steps: standardBudgetSteps(4) },
  pieces: PIECES,
  lessons: LESSONS,
  trophies: [],
  disciplines: [],
  specializations: [],
  leaves: [],
};
