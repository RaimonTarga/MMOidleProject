/**
 * The Conduit's Formation editor, as a view model (class-first build plan CD.3/CD.6; bible
 * §7.3). The class screen renders it; edits come back through `withRoster` and `withOrders`,
 * and the shared validator's reasons are shown as they are.
 */
import { checkClassConfig, classConfigContextFromState } from './config';
import type { ClassConfig, ConditionRef, FormationConfig, FormationOrders } from './configTypes';
import { CLASS_STATE_CONDITIONS } from './configTypes';
import { rosterCommand } from './configs/conduit';
import { disciplineCommandCost } from './conduit/discipline';
import { CONDUIT_KIT, type ConduitPiece, type ConduitTrophy } from './conduit/kit';
import { MOMENTS, isMomentId } from './moments';
import type { ClassScreenInput } from './view';

export interface FormationPieceView {
  pieceId: string;
  name: string;
  family: ConduitPiece['family'];
  /** "Front", "middle" or "back": role sets the row. */
  row: ConduitPiece['row'];
  mode: ConduitPiece['mode'];
  /** What this body costs under the discipline (Swarm's half, Pack's discount, Elite's extra). */
  command: number;
  /** The piece's own Command, before the discipline. */
  baseCommand: number;
  text: string;
}

export interface FormationSoulView {
  trophyId: string | null;
  name: string;
  text: string;
  rank: number;
  maxRank: number;
}

export interface FormationOrderChoice<T extends string> {
  value: T;
  options: { id: T; label: string }[];
}

export interface FormationView {
  /** Command as pips: used of total (the weapon's Command is already in the total). */
  command: { used: number; total: number };
  /** The roster, one entry per body in order (repeats show once each). */
  roster: FormationPieceView[];
  /** Every summon you have bound, to add to the roster. */
  available: FormationPieceView[];
  orders: {
    attackFirst: FormationOrderChoice<FormationOrders['attackFirst']>;
    tanksGuard: FormationOrderChoice<FormationOrders['tanksGuard']>;
    rebuildFirst: FormationOrderChoice<FormationOrders['rebuildFirst']>;
    /** The Recall rule's conditions, in words; empty means never. */
    recallWhen: string[];
  };
  /** The picked discipline and its rule in words, or null before the pick (T2). */
  discipline: { id: string; name: string; text: string } | null;
  /** The picked specialization and its rule in words, or null before the pick (T3). */
  specialization: { id: string; name: string; text: string } | null;
  /** The picked T4 leaf and its rule in words, or null before the pick. */
  leaf: { id: string; name: string; text: string } | null;
  /** The Soul in the first relic slot: a free extra body, or none yet. `rank` is the trophy's rank, `maxRank` the highest it reaches. */
  soul: FormationSoulView;
  /** Every relic slot, in order: one, or two with Two Souls (the first entry is `soul`). */
  souls: FormationSoulView[];
  problems: string[];
}

const PIECES = new Map<string, ConduitPiece>(CONDUIT_KIT.pieces.map((piece) => [piece.id, piece]));
const SOULS = new Map<string, ConduitTrophy>(CONDUIT_KIT.trophies.map((trophy) => [trophy.id, trophy]));

const ATTACK_FIRST: FormationOrderChoice<FormationOrders['attackFirst']>['options'] = [
  { id: 'attacking-me', label: 'What attacks me' },
  { id: 'closest', label: 'Closest' },
  { id: 'weakest', label: 'Weakest' },
  { id: 'elites', label: 'Elites and bosses' },
];
const TANKS_GUARD: FormationOrderChoice<FormationOrders['tanksGuard']>['options'] = [
  { id: 'conduit', label: 'The Conduit' },
  { id: 'back-row', label: 'The back row' },
];
const REBUILD_FIRST: FormationOrderChoice<FormationOrders['rebuildFirst']>['options'] = [
  { id: 'tanks', label: 'Tanks' },
  { id: 'damage', label: 'Damage' },
  { id: 'supports', label: 'Supports' },
  { id: 'as-fallen', label: 'In the order they fell' },
];

function conditionText(condition: ConditionRef): string {
  const text = isMomentId(condition.id)
    ? MOMENTS[condition.id].text
    : (CLASS_STATE_CONDITIONS as Record<string, { text: string }>)[condition.id]?.text ?? condition.id;
  return condition.not ? `not when ${text}` : `when ${text}`;
}

function pieceView(piece: ConduitPiece, disciplineId: string | null, firstOfType: boolean, specializationId: string | null): FormationPieceView {
  return {
    pieceId: piece.id, name: piece.name, family: piece.family, row: piece.row, mode: piece.mode,
    command: disciplineCommandCost(piece.command, disciplineId, firstOfType, specializationId), baseCommand: piece.command, text: piece.text,
  };
}

/** The Formation editor for a Conduit's screen, or null for anyone else. */
export function composeFormationView(input: ClassScreenInput): FormationView | null {
  const ctx = classConfigContextFromState(input);
  const config = input.classConfig;
  if (!ctx || ctx.archetype !== 'summoner' || config?.system.kind !== 'formation') return null;
  const system = config.system;

  const seen = new Set<string>();
  const roster = system.roster.map((id) => PIECES.get(id)).filter((piece): piece is ConduitPiece => !!piece).map((piece) => {
    const view = pieceView(piece, ctx.disciplineId, !seen.has(piece.id), ctx.specializationId);
    seen.add(piece.id);
    return view;
  });
  // A bound summon is priced as if it were added next.
  const available = CONDUIT_KIT.pieces.filter((piece) => ctx.pieceRanks.has(piece.id))
    .map((piece) => pieceView(piece, ctx.disciplineId, !seen.has(piece.id), ctx.specializationId));
  const picked = CONDUIT_KIT.disciplines.find((entry) => entry.id === ctx.disciplineId);
  const pickedSpec = CONDUIT_KIT.specializations.find((entry) => entry.id === ctx.specializationId);
  const pickedLeaf = CONDUIT_KIT.leaves.find((entry) => input.unlockedSkills?.includes(entry.id));
  const soulView = (slot: number): FormationSoulView => {
    const trophy = config.relic[slot] ? SOULS.get(config.relic[slot]!) : undefined;
    return trophy
      ? { trophyId: trophy.id, name: trophy.name, text: trophy.text, rank: ctx.trophyRanks.get(trophy.id) ?? 1, maxRank: 1 + trophy.ranks.length }
      : slot === 0
        ? { trophyId: null, name: 'No Soul yet', text: 'Beat a boss and a Soul joins your formation for free.', rank: 0, maxRank: 0 }
        : { trophyId: null, name: 'No second Soul yet', text: 'Beat a boss of another lineage and a second Soul can join the first.', rank: 0, maxRank: 0 };
  };
  const souls = Array.from({ length: Math.max(1, ctx.relicSlots) }, (_, slot) => soulView(slot));
  const check = checkClassConfig(config, ctx);
  return {
    command: { used: rosterCommand(system.roster, ctx.disciplineId, ctx.specializationId), total: ctx.budget },
    roster,
    available,
    orders: {
      attackFirst: { value: system.orders.attackFirst, options: ATTACK_FIRST },
      tanksGuard: { value: system.orders.tanksGuard, options: TANKS_GUARD },
      rebuildFirst: { value: system.orders.rebuildFirst, options: REBUILD_FIRST },
      recallWhen: system.orders.recallWhen.map(conditionText),
    },
    discipline: picked ? { id: picked.id, name: picked.name, text: picked.text } : null,
    specialization: pickedSpec ? { id: pickedSpec.id, name: pickedSpec.name, text: pickedSpec.text } : null,
    leaf: pickedLeaf ? { id: pickedLeaf.id, name: pickedLeaf.name, text: pickedLeaf.text } : null,
    soul: souls[0]!,
    souls,
    problems: check.ok ? [] : check.reasons,
  };
}

function withSystem(config: ClassConfig, system: FormationConfig): ClassConfig {
  return { ...config, mode: 'custom', system };
}

/** The config with this roster (one id per body, in order). */
export function withRoster(config: ClassConfig, roster: readonly string[]): ClassConfig {
  if (config.system.kind !== 'formation') return config;
  return withSystem(config, { ...config.system, roster: [...roster] });
}

/** The config with some orders changed (Recall's conditions included). */
export function withOrders(config: ClassConfig, patch: Partial<FormationOrders>): ClassConfig {
  if (config.system.kind !== 'formation') return config;
  return withSystem(config, { ...config.system, orders: { ...config.system.orders, ...patch } });
}
