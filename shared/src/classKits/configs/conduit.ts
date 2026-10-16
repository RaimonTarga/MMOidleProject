/**
 * The Conduit's Formation (§7.3): the roster within Command, and the free formation-wide
 * orders. Defaults from §7.13 (stand-in until the Conduit track, C-conduit.2).
 */
import type { FormationConfig, FormationOrders } from '../configTypes';
import { CONDUIT_KIT, type ConduitPiece } from '../conduit/kit';
import { disciplineCommandCost } from '../conduit/discipline';
import { CONDUIT_SPECIALIZATION_TUNING } from '../conduit/specialization';
import {
  conditionProblems,
  conditionRefs,
  isRecord,
  oneOf,
  ownedPiece,
  ownedPieces,
  stringArray,
  type ClassSystemSpec,
} from './common';

/**
 * Bodies a roster may field, Souls not counted; a tuning number raised in measured steps, never a
 * design cap (§7.2). OV-CONDUIT: 8 -> 10, so more of the Command steps through T4 (up to 15) can be spent:
 * at 8 a Pack roster left 3-6 Command pips it could not use from mid-T3 on. The bandwidth budget
 * allows 20 bodies (STATUS.md, 2026-10-15). PLACEHOLDER.
 */
export const CONDUIT_ROSTER_BODY_CAP = 10;

/**
 * Swarm's own body cap: its flood (§7.5, "a flood of cheap, disposable summons") fields more bodies
 * than the other disciplines. OV2-CONDUIT: at 10 a Swarm fielded no more bodies than a T3 Pack and
 * left half its Command unused. PLACEHOLDER, inside the bandwidth budget of 20.
 */
export const CONDUIT_SWARM_BODY_CAP = 16;

/** The body cap a roster under this discipline may field. */
export function rosterBodyCap(disciplineId: string | null | undefined): number {
  return disciplineId === 'conduit-swarm' ? CONDUIT_SWARM_BODY_CAP : CONDUIT_ROSTER_BODY_CAP;
}

const ATTACK_FIRST = ['attacking-me', 'closest', 'weakest', 'elites'] as const;
const TANKS_GUARD = ['conduit', 'back-row'] as const;
const REBUILD_FIRST = ['tanks', 'damage', 'supports', 'as-fallen'] as const;

/** The pre-set orders (§7.4, §7.13). */
export const DEFAULT_FORMATION_ORDERS: FormationOrders = {
  attackFirst: 'closest',
  tanksGuard: 'conduit',
  recallWhen: [{ id: 'hp-low' }],
  rebuildFirst: 'tanks',
};

/** A roster's Command under the discipline (§7.5); with none, the plain sum of the pieces' costs. */
export function rosterCommand(roster: readonly string[], disciplineId: string | null = null, specializationId: string | null = null): number {
  let total = 0;
  const seen = new Set<string>();
  for (const id of roster) {
    const piece = CONDUIT_KIT.pieces.find((candidate) => candidate.id === id);
    if (!piece) continue;
    total += disciplineCommandCost(piece.command, disciplineId, !seen.has(id), specializationId);
    seen.add(id);
  }
  return total;
}

/**
 * Pack's default (§7.13, "one of each type"), in the order `defaults` tries to fit them
 * (PLACEHOLDER order, OV-CONDUIT): the newest tank, the newest heavy (its first copy costs 1
 * less under Pack), then damage and supports alternating, newest first.
 */
function packDefault(light: readonly ConduitPiece[], heavies: readonly ConduitPiece[]): ConduitPiece[] {
  return [...newest(light.filter((piece) => piece.family === 'tank')).slice(0, 1), ...newest(heavies).slice(0, 1), ...alternating(light)];
}

const newest = (pieces: readonly ConduitPiece[]): ConduitPiece[] => [...pieces].reverse();

/** Damage and supports alternating, newest first. */
function alternating(light: readonly ConduitPiece[]): ConduitPiece[] {
  const damage = newest(light.filter((piece) => piece.family === 'damage'));
  const supports = newest(light.filter((piece) => piece.family === 'support'));
  const out: ConduitPiece[] = [];
  for (let i = 0; i < Math.max(damage.length, supports.length); i += 1) {
    if (damage[i]) out.push(damage[i]);
    if (supports[i]) out.push(supports[i]);
  }
  return out;
}

/**
 * Swarm's default (§7.13, "fill Command with half-cost summons, tank first"; PLACEHOLDER order,
 * OV2-CONDUIT): the newest tank, then under Legion (§7.6) copies of the newest damage summon up to
 * its top threshold, then one of each other half-cost summon, damage and supports alternating,
 * newest first; Thralls fill the rest (`defaults`). Heavies are not half-cost: they come in only
 * when the body cap binds with Command left over (`spendLeftover`).
 */
function swarmDefault(light: readonly ConduitPiece[], legion: boolean): ConduitPiece[] {
  const rest = alternating(light);
  const massed = legion ? rest.find((piece) => piece.family === 'damage') : undefined;
  const steps = CONDUIT_SPECIALIZATION_TUNING.legionSteps;
  const copies = massed ? steps[steps.length - 1]!.copies : 0;
  return [
    ...newest(light.filter((piece) => piece.family === 'tank')).slice(0, 1),
    ...Array.from({ length: copies }, () => massed!),
    ...rest.filter((piece) => piece !== massed),
  ];
}

/**
 * Elite's default (§7.13, "a tank and two damage elites"; PLACEHOLDER order after those,
 * OV2-CONDUIT): the newest tank and the two newest damage summons, then supports and the other
 * damage summons alternating, newest first, then the heavies. Every Elite summon costs 1 more,
 * so Command runs out after a few.
 */
function eliteDefault(light: readonly ConduitPiece[], heavies: readonly ConduitPiece[]): ConduitPiece[] {
  const damage = newest(light.filter((piece) => piece.family === 'damage'));
  const supports = newest(light.filter((piece) => piece.family === 'support'));
  const rest: ConduitPiece[] = [];
  for (let i = 0; i < Math.max(damage.length - 2, supports.length); i += 1) {
    if (supports[i]) rest.push(supports[i]);
    if (damage[i + 2]) rest.push(damage[i + 2]);
  }
  return [...newest(light.filter((piece) => piece.family === 'tank')).slice(0, 1), ...damage.slice(0, 2), ...rest, ...newest(heavies)];
}

/**
 * Swarm only: when the body cap binds before Command runs out, trade a body for each heavy,
 * newest first (a Thrall first, else the last body, never the roster's first, its tank), while
 * the trade fits the budget.
 */
function spendLeftover(roster: string[], heavies: readonly ConduitPiece[], thrallId: string | undefined, fits: (ids: readonly string[]) => boolean): void {
  const isHeavy = (id: string) => heavies.some((piece) => piece.id === id);
  for (const heavy of newest(heavies)) {
    const thrallAt = thrallId ? roster.lastIndexOf(thrallId) : -1;
    let at = thrallAt >= 0 ? thrallAt : roster.length - 1;
    while (at > 0 && isHeavy(roster[at]!)) at -= 1;
    if (at <= 0) return;
    const traded = [...roster];
    traded[at] = heavy.id;
    if (fits(traded)) roster.splice(0, roster.length, ...traded);
  }
}

export const CONDUIT_SYSTEM: ClassSystemSpec<FormationConfig> = {
  kind: 'formation',

  parse(raw) {
    const roster = stringArray(raw.roster);
    if (!roster || !isRecord(raw.orders)) return null;
    const attackFirst = oneOf(raw.orders.attackFirst, ATTACK_FIRST);
    const tanksGuard = oneOf(raw.orders.tanksGuard, TANKS_GUARD);
    const rebuildFirst = oneOf(raw.orders.rebuildFirst, REBUILD_FIRST);
    const recallWhen = conditionRefs(raw.orders.recallWhen);
    if (!attackFirst || !tanksGuard || !rebuildFirst || !recallWhen) return null;
    return { kind: 'formation', roster, orders: { attackFirst, tanksGuard, recallWhen, rebuildFirst } };
  },

  /**
   * §7.13: the bound specialists in role order (tank, damage, damage, support), then a heavy;
   * Thralls fill the rest. Each discipline has its own instead: Swarm `swarmDefault`, Pack
   * `packDefault` (one of each type), Elite `eliteDefault`.
   */
  defaults(ctx) {
    const owned = ownedPieces(CONDUIT_KIT, ctx);
    const thrall = owned.find((piece) => piece.family === 'generic');
    const light = owned.filter((piece) => piece.family !== 'generic' && piece.command === 1);
    const heavies = owned.filter((piece) => piece.command > 1);
    const cap = rosterBodyCap(ctx.disciplineId);
    const wanted: ConduitPiece[] =
      ctx.disciplineId === 'conduit-pack' ? packDefault(light, heavies)
      : ctx.disciplineId === 'conduit-swarm' ? swarmDefault(light, ctx.specializationId === 'conduit-legion')
      : ctx.disciplineId === 'conduit-elite' ? eliteDefault(light, heavies)
      : [
        ...light.filter((piece) => piece.family === 'tank').slice(0, 1),
        ...light.filter((piece) => piece.family === 'damage').slice(0, 2),
        ...light.filter((piece) => piece.family === 'support').slice(0, 1),
        ...heavies.slice(0, 1),
      ];
    const roster: string[] = [];
    const fits = (ids: readonly string[]) => rosterCommand(ids, ctx.disciplineId, ctx.specializationId) <= ctx.budget && ids.length <= cap;
    // Each body is priced by the discipline, given what is already fielded (Pack's first-of-a-type discount).
    const costOf = (piece: ConduitPiece) => rosterCommand([...roster, piece.id], ctx.disciplineId, ctx.specializationId) - rosterCommand(roster, ctx.disciplineId, ctx.specializationId);
    for (const piece of wanted) {
      if (fits([...roster, piece.id])) roster.push(piece.id);
    }
    while (thrall && costOf(thrall) > 0 && fits([...roster, thrall.id])) {
      roster.push(thrall.id);
    }
    if (ctx.disciplineId === 'conduit-swarm' && roster.length >= cap) spendLeftover(roster, heavies, thrall?.id, fits);
    return { kind: 'formation', roster, orders: { ...DEFAULT_FORMATION_ORDERS, recallWhen: [...DEFAULT_FORMATION_ORDERS.recallWhen] } };
  },

  validate(config, ctx) {
    const problems: string[] = [];
    for (const id of config.roster) {
      if (!ownedPiece(CONDUIT_KIT, ctx, id)) problems.push(`"${id}" is not a summon you have bound`);
    }
    const command = rosterCommand(config.roster, ctx.disciplineId, ctx.specializationId);
    if (command > ctx.budget) problems.push(`this formation needs ${command} Command; you have ${ctx.budget}`);
    const cap = rosterBodyCap(ctx.disciplineId);
    if (config.roster.length > cap) problems.push(`at most ${cap} summons in the formation`);
    problems.push(...conditionProblems(config.orders.recallWhen, 'summoner', 'the Recall rule'));
    return problems;
  },
};
