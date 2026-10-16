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

/**
 * A technique beat's swing damage, as a share of a plain swing's (§12.2: the price).
 * PLACEHOLDER (C-striker: 0.7). A mastered technique pays no price.
 */
export const STRIKER_TECHNIQUE_SWING = 0.7;

/**
 * The techniques that pay no price. STAND-IN: the Order does not yet say which technique a
 * mastery step masters, so the first `mastered` techniques in beat order are; T1 never
 * reaches a mastery step (one beat opens per step until all four are open).
 */
export function strikerMasteredBeats(beats: readonly (string | null)[], mastered: number): Set<number> {
  const out = new Set<number>();
  beats.forEach((id, index) => { if (id !== null && out.size < mastered) out.add(index); });
  return out;
}

/**
 * The default's preference inside a family, best first; an unlisted piece comes after, in kit
 * order. PLACEHOLDER (OV-STRIKER, from classBossSim at the T2 bosses): a stun or root that stops a
 * boss's sequence beats a pure attack setup (Concuss won the Stoneplate Juggernaut and the
 * Dune-Stalker Emperor with 53% / 73% HP left where Armor Break and Feint lost both), and
 * single-target damage beats area damage on a boss (Sweep and Whirlwind skip the target).
 */
const DEFAULT_RANK: readonly string[] = [
  // finisher setups and control
  'striker-concuss', 'striker-upheaval', 'striker-pin', 'striker-frostbind', 'striker-pressure-point',
  // attack setups
  'striker-armor-break', 'striker-feint', 'striker-hamstring', 'striker-bloodrush',
  // damage
  'striker-hemorrhage', 'striker-rend', 'striker-triple-cut', 'striker-icebreaker', 'striker-coup-de-grace',
  'striker-reaping-arc', 'striker-whirlwind', 'striker-sweep',
];

function byRank(a: StrikerPiece, b: StrikerPiece): number {
  const ra = DEFAULT_RANK.indexOf(a.id);
  const rb = DEFAULT_RANK.indexOf(b.id);
  return (ra < 0 ? DEFAULT_RANK.length : ra) - (rb < 0 ? DEFAULT_RANK.length : rb);
}

/**
 * Which techniques a default Order fields, first first, when there are more than open beats
 * (§12.13): T1 and Balanced, Coil and the opener, one setup early, damage late; Light, the opener
 * (Focus), attack setups, then damage; Heavy, Coil, control and setups, then damage. At most one
 * cast of each kind: a second opener or wind-up has no beat to sit on.
 */
function defaultChoice(owned: readonly StrikerPiece[], disciplineId: string | null): StrikerPiece[] {
  const opener = owned.find((piece) => piece.cast === 'opener');
  const windup = owned.find((piece) => piece.cast === 'windup');
  const plain = owned.filter((piece) => !piece.cast && !piece.finisher);
  const setups = plain.filter((piece) => piece.family !== 'damage').sort(byRank);
  const damage = plain.filter((piece) => piece.family === 'damage').sort(byRank);
  const casts = (first: StrikerPiece | undefined, second: StrikerPiece | undefined) =>
    [first, second].filter((piece): piece is StrikerPiece => piece !== undefined);
  if (disciplineId === 'striker-light') {
    const attack = setups.filter((piece) => piece.family === 'attack-setup');
    const others = setups.filter((piece) => piece.family !== 'attack-setup');
    return [...casts(opener, windup), ...attack, ...damage, ...others];
  }
  if (disciplineId === 'striker-heavy') return [...casts(windup, opener), ...setups, ...damage];
  return [...casts(windup, opener), ...setups.slice(0, 1), ...damage, ...setups.slice(1)];
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
    const chosen = defaultChoice(ownedPieces(STRIKER_KIT, ctx), ctx.disciplineId).slice(0, open);
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
