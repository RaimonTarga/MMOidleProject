/**
 * The Conduit's Formation (§7.3): the roster within Command, and the free formation-wide
 * orders. Defaults from §7.13 (stand-in until the Conduit track, C-conduit.2).
 */
import type { FormationConfig, FormationOrders } from '../configTypes';
import { CONDUIT_KIT, type ConduitPiece } from '../conduit/kit';
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
 * Bodies a roster may field. Today's summon cap is 9 (`hardEntityCap`) and the Soul takes one;
 * a tuning number raised in measured steps, never a design cap (§7.2).
 */
export const CONDUIT_ROSTER_BODY_CAP = 8;

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

export function rosterCommand(roster: readonly string[]): number {
  let total = 0;
  for (const id of roster) total += CONDUIT_KIT.pieces.find((piece) => piece.id === id)?.command ?? 0;
  return total;
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

  /** §7.13: the bound specialists in role order (tank, damage, damage, support), then a heavy; Thralls fill the rest. */
  defaults(ctx) {
    const owned = ownedPieces(CONDUIT_KIT, ctx);
    const thrall = owned.find((piece) => piece.family === 'generic');
    const light = owned.filter((piece) => piece.family !== 'generic' && piece.command === 1);
    const heavies = owned.filter((piece) => piece.command > 1);
    const wanted: ConduitPiece[] = [
      ...light.filter((piece) => piece.family === 'tank').slice(0, 1),
      ...light.filter((piece) => piece.family === 'damage').slice(0, 2),
      ...light.filter((piece) => piece.family === 'support').slice(0, 1),
      ...heavies.slice(0, 1),
    ];
    const roster: string[] = [];
    let command = 0;
    for (const piece of wanted) {
      if (command + piece.command > ctx.budget || roster.length >= CONDUIT_ROSTER_BODY_CAP) continue;
      roster.push(piece.id);
      command += piece.command;
    }
    while (thrall && command + thrall.command <= ctx.budget && roster.length < CONDUIT_ROSTER_BODY_CAP) {
      roster.push(thrall.id);
      command += thrall.command;
    }
    return { kind: 'formation', roster, orders: { ...DEFAULT_FORMATION_ORDERS, recallWhen: [...DEFAULT_FORMATION_ORDERS.recallWhen] } };
  },

  validate(config, ctx) {
    const problems: string[] = [];
    for (const id of config.roster) {
      if (!ownedPiece(CONDUIT_KIT, ctx, id)) problems.push(`"${id}" is not a summon you have bound`);
    }
    const command = rosterCommand(config.roster);
    if (command > ctx.budget) problems.push(`this formation needs ${command} Command; you have ${ctx.budget}`);
    if (config.roster.length > CONDUIT_ROSTER_BODY_CAP) problems.push(`at most ${CONDUIT_ROSTER_BODY_CAP} summons in the formation`);
    problems.push(...conditionProblems(config.orders.recallWhen, 'summoner', 'the Recall rule'));
    return problems;
  },
};
