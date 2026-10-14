/**
 * The Striker's Order (§12.3): a technique on each beat before the finisher, within the slots
 * the budget has opened. Defaults from §12.13 (stand-in until the Striker track, C-striker.2).
 */
import type { ClassConfigContext, OrderConfig } from '../configTypes';
import { STRIKER_KIT, type StrikerPiece } from '../striker/kit';
import {
  conditionProblems,
  conditionRefs,
  ownedPiece,
  ownedPieces,
  type ClassSystemSpec,
} from './common';

/** Combo length by discipline (§12.5); a T1 Striker swings a 5-beat combo (§12.4). */
export const STRIKER_COMBO_LENGTH: Readonly<Record<string, number>> = {
  'striker-light': 7,
  'striker-balanced': 5,
  'striker-heavy': 4,
};
const T1_COMBO_LENGTH = 5;

export function strikerComboLength(disciplineId: string | null): number {
  return (disciplineId && STRIKER_COMBO_LENGTH[disciplineId]) || T1_COMBO_LENGTH;
}

/**
 * "Open, then master" (§12.3): each budget step opens a beat for a technique until every
 * beat before the finisher is open, then masters one technique (it pays no price).
 */
export function strikerSlots(budget: number, beats: number): { open: number; mastered: number } {
  return { open: Math.min(budget, beats), mastered: Math.max(0, budget - beats) };
}

/** Which techniques a default Order fields first when there are more than open beats. */
function defaultPriority(piece: StrikerPiece): number {
  if (piece.cast === 'windup') return 0;
  if (piece.cast === 'opener') return 1;
  if (piece.family === 'damage') return 2;
  if (piece.family === 'attack-setup') return 3;
  return 4;
}

export const STRIKER_SYSTEM: ClassSystemSpec<OrderConfig> = {
  kind: 'order',

  parse(raw) {
    if (!Array.isArray(raw.beats) || !raw.beats.every((b) => b === null || typeof b === 'string')) return null;
    const holdFinisher = conditionRefs(raw.holdFinisher);
    if (!holdFinisher) return null;
    return { kind: 'order', beats: [...raw.beats] as (string | null)[], holdFinisher };
  },

  defaults(ctx) {
    const beats: (string | null)[] = new Array(strikerComboLength(ctx.disciplineId) - 1).fill(null);
    const { open } = strikerSlots(ctx.budget, beats.length);
    const chosen = ownedPieces(STRIKER_KIT, ctx)
      .filter((piece) => !piece.finisher)
      .sort((a, b) => defaultPriority(a) - defaultPriority(b))
      .slice(0, open);
    // Casts on their own positions; then setups early and damage late (§12.13).
    const opener = chosen.find((piece) => piece.cast === 'opener');
    const windup = chosen.find((piece) => piece.cast === 'windup');
    if (opener) beats[0] = opener.id;
    if (windup) beats[beats.length - 1] = windup.id;
    const free = beats.map((id, index) => (id === null ? index : -1)).filter((index) => index >= 0);
    const rest = chosen.filter((piece) => !piece.cast);
    const setups = rest.filter((piece) => piece.family !== 'damage');
    const damage = rest.filter((piece) => piece.family === 'damage');
    setups.forEach((piece, i) => { beats[free[i]] = piece.id; });
    damage.forEach((piece, i) => { beats[free[free.length - damage.length + i]] = piece.id; });
    return { kind: 'order', beats, holdFinisher: [] };
  },

  validate(config, ctx: ClassConfigContext) {
    const problems: string[] = [];
    const length = strikerComboLength(ctx.disciplineId) - 1;
    if (config.beats.length !== length) problems.push(`the combo has ${length} beats before the finisher, not ${config.beats.length}`);
    const { open } = strikerSlots(ctx.budget, length);
    const placed = config.beats.filter((id): id is string => id !== null);
    if (placed.length > open) problems.push(`only ${open} beat${open === 1 ? '' : 's'} can carry a technique yet`);
    config.beats.forEach((id, index) => {
      if (id === null) return;
      const piece = ownedPiece(STRIKER_KIT, ctx, id);
      if (!piece || piece.finisher) { problems.push(`beat ${index + 1}: "${id}" is not a technique you know`); return; }
      if (piece.cast === 'opener' && index !== 0) problems.push(`${piece.name} is an opener: it goes on the first beat`);
      if (piece.cast === 'windup' && index !== config.beats.length - 1) problems.push(`${piece.name} is a wind-up: it goes on the beat before the finisher`);
    });
    problems.push(...conditionProblems(config.holdFinisher, 'cadence', 'finisher rule'));
    return problems;
  },
};
