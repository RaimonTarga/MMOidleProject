/**
 * The Conduit's kit (`summoner`): bible §7.
 *
 * The commander who never strikes itself. Pieces are **summon types** fielded in Formation
 * within Command; each does one job with a default behaviour. The relic slot holds a
 * **Soul**: a free boss summon. The budget is Command.
 *
 * Only the starter (the Thrall) is entered; task K6 enters the specialists and variants
 * through T4 (§7.4, §7.8, §7.16), the Souls (§7.8), the disciplines (§7.5), specializations
 * (§7.6) and leaves (§7.7), following the Striker's kit as the worked example. Bodies are
 * stand-ins from the existing summon sprites until new art lands (§7.14).
 */
import type { MinionMonsterType } from '../../components/archetypes/summoner/isMinion';
import { standardBudgetSteps } from '../budget';
import { STARTER, learn } from '../kitHelpers';
import type { ClassKit, PieceDef, TrophyDef } from '../types';

/** Summon roles (§7.3). The Thrall is the generic starter; heavies are a role at 2+ Command. */
export type ConduitRole = 'generic' | 'tank' | 'damage' | 'support';

export interface ConduitPieceExtra {
  /** What it costs to field. A 2-cost summon is worth about two 1-costs in its role (§7.2). */
  command: number;
  /** Attack mode (§7.14): melee 18, reach 96, ranged 190 today. */
  mode: 'melee' | 'reach' | 'ranged';
  /** Role sets the row: tanks in front, melee in the middle, ranged and supports at the back (§7.3). */
  row: 'front' | 'middle' | 'back';
  /** The body it wears (a stand-in from today's summon sprites). */
  body: MinionMonsterType;
}

export type ConduitPiece = PieceDef<ConduitRole, ConduitPieceExtra>;

/** Every Conduit trophy is a Soul: a free boss summon, with its own body, never the boss's (§7.8). */
export type ConduitTrophyKind = 'soul';
export type ConduitTrophy = TrophyDef<ConduitTrophyKind> & {
  /** The Soul's body (a stand-in from today's summon sprites). */
  body: MinionMonsterType;
};

export function summon(piece: Omit<ConduitPiece, 'classId' | 'params'>): ConduitPiece {
  return { classId: 'summoner', params: {}, ...piece };
}

export function soul(entry: Omit<ConduitTrophy, 'classId' | 'params' | 'kind'>): ConduitTrophy {
  return { classId: 'summoner', params: {}, kind: 'soul', ...entry };
}

const PIECES: readonly ConduitPiece[] = [
  summon({
    id: 'conduit-thrall',
    name: 'Thrall',
    family: 'generic',
    command: 1,
    mode: 'melee',
    row: 'middle',
    body: 'conduit-summon',
    text: 'A plain melee summon with decent bulk and fair damage. You start with four.',
  }),
];

const LESSONS = [
  learn('conduit-thrall', STARTER),
];

export const CONDUIT_KIT: ClassKit<ConduitPiece, ConduitTrophy> = {
  classId: 'summoner',
  className: 'conduit',
  displayName: 'Conduit',
  systemName: 'Formation',
  /** Illustrative: Command 4 → 6 through T1, 6 → 9 through T2 (§7.2). */
  budget: { label: 'Command', steps: standardBudgetSteps(4) },
  pieces: PIECES,
  lessons: LESSONS,
  trophies: [],
  disciplines: [],
  specializations: [],
  leaves: [],
};
