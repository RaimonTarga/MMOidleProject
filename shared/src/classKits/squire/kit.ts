/**
 * The Squire's kit (`cooldown`): bible §8.
 *
 * The shield that hits back. Pieces are **responses** in the Response rules: each answers
 * one specific enemy action, costs Resolve and refunds more when it lands. The slam fires
 * at a full bar; the relic slot's trophy twists the slam or how Resolve flows. The budget is
 * Resolve's size in pips.
 *
 * Only the starter is entered; task K2 enters T1–T4 (§8.4, §8.8, §8.16), the trophies (§8.9),
 * the disciplines (§8.5), specializations (§8.6) and leaves (§8.7), following the Striker's
 * kit as the worked example.
 */
import { standardBudgetSteps } from '../budget';
import { STARTER, learn } from '../kitHelpers';
import type { MomentId } from '../moments';
import type { ClassKit, PieceDef, TrophyDef } from '../types';

/**
 * Response families (§8.3): guards (take it better), counters (hit back), holds (move
 * enemies). The slam and Last Breath sit outside the three families.
 */
export type SquireFamily = 'guard' | 'counter' | 'hold' | 'slam' | 'emergency';

export interface SquirePieceExtra {
  /** The enemy action it answers (§8.3, rule 1): its natural trigger and default rule. */
  answers?: MomentId;
}

export type SquirePiece = PieceDef<SquireFamily, SquirePieceExtra>;

/** Slam relics change what the slam does; Resolve relics change how you gain or spend it (§8.9). */
export type SquireTrophyKind = 'slam' | 'resolve';
export type SquireTrophy = TrophyDef<SquireTrophyKind>;

export function response(piece: Omit<SquirePiece, 'classId' | 'params'>): SquirePiece {
  return { classId: 'cooldown', params: {}, ...piece };
}

export function squireTrophy(entry: Omit<SquireTrophy, 'classId' | 'params'>): SquireTrophy {
  return { classId: 'cooldown', params: {}, ...entry };
}

const PIECES: readonly SquirePiece[] = [
  response({
    id: 'squire-slam',
    name: 'Slam',
    family: 'slam',
    text: 'When your Resolve bar is full, you slam everything around you with the shield. Each boss you beat changes the slam or how Resolve flows.',
  }),
];

const LESSONS = [
  learn('squire-slam', STARTER),
];

export const SQUIRE_KIT: ClassKit<SquirePiece, SquireTrophy> = {
  classId: 'cooldown',
  className: 'squire',
  displayName: 'Squire',
  systemName: 'Response rules',
  /** Illustrative: Resolve 4 → 5 at Mastery 15 → 6 at 30 (§8.2). */
  budget: { label: 'Resolve', steps: standardBudgetSteps(4) },
  pieces: PIECES,
  lessons: LESSONS,
  trophies: [],
  disciplines: [],
  specializations: [],
  leaves: [],
};
