/**
 * The Spirit's Thresholds editor, as a view model (class-first build plan; bible §11.3): the
 * storm's bottle as a vertical gauge with the floor, the bands and the phase. The class screen
 * renders it; edits come back through `withFloor`, `withBand` and `withPhase`, and the shared
 * validator's reasons are shown as they are.
 */
import { checkClassConfig, classConfigContextFromState } from './config';
import type { ClassConfig, ThresholdsConfig } from './configTypes';
import { MOMENTS, type MomentId } from './moments';
import { SPIRIT_KIT, type SpiritPiece, type SpiritTrophy } from './spirit/kit';
import type { ClassScreenInput } from './view';

export interface SpendView {
  pieceId: string;
  name: string;
  family: SpiritPiece['family'];
  rank: number;
  text: string;
  /** The moment it waits for, in words, or empty. */
  waitsFor: string;
  /** A calm that sits at the floor instead of in a band (Eye of the Storm). */
  atFloor: boolean;
  /** Where it sits on the gauge (0–100), or null when it is not placed (calms at the floor). */
  band: number | null;
  /** Fires by itself at a moment of the storm's shape (Storm Surge opens every surge), so it has no band. */
  automatic: boolean;
}

export interface ThresholdsView {
  /** The bottle in pips: the class budget ("Storm 6"). */
  storm: { pips: number };
  /** The floor you never spend below (0–100), drawn as a line on the gauge. */
  floorPct: number;
  phase: ThresholdsConfig['phase'];
  /** The T2 discipline, once picked: it tilts the storm's shape (brim, tide, bank). */
  discipline: { id: string; name: string } | null;
  /** The T3 pick, once made: its rule in words (the editor shows it under the discipline). */
  specialization: { id: string; name: string; text: string } | null;
  /** The specializations the picked discipline opens, for the "choose one" line before the pick. */
  specializationChoices: { id: string; name: string }[];
  /** The T4 leaves picked under the discipline (the Passive Tree's `unlockedSkills`), with their rules. */
  leaves: { id: string; name: string; text: string }[];
  /** The picked discipline's nine-or-so leaf choices not yet taken, for the "choose one" line at T4. */
  leafChoices: { id: string; name: string }[];
  /** Every spend and calm you know, with its band. */
  pieces: SpendView[];
  /** The trophy: a spend relic twists every spend, a storm relic twists the gauge. */
  relic: { trophyId: string | null; name: string; kind: SpiritTrophy['kind'] | 'none'; text: string };
  problems: string[];
}

const PIECES = new Map<string, SpiritPiece>(SPIRIT_KIT.pieces.map((piece) => [piece.id, piece]));
const TROPHIES = new Map<string, SpiritTrophy>(SPIRIT_KIT.trophies.map((trophy) => [trophy.id, trophy]));

/** Pieces the discipline's storm fires itself; they never sit in a band. */
const AUTOMATIC_PIECES: ReadonlySet<string> = new Set(['spirit-storm-surge']);

const WAITS_TEXT: Readonly<Record<string, string>> = {
  touched: 'an enemy is in melee with you',
  'carrying-dot': 'you carry a poison or bleed',
};

/** The moment in words: the editor's own wording where it has one, else the shared vocabulary's. */
function waitsText(id: string): string {
  return WAITS_TEXT[id] ?? MOMENTS[id as MomentId]?.text ?? id;
}

/** The Thresholds editor for a Spirit's screen, or null for anyone else. */
export function composeThresholdsView(input: ClassScreenInput & { unlockedSkills?: readonly string[] }): ThresholdsView | null {
  const ctx = classConfigContextFromState(input);
  const config = input.classConfig;
  if (!ctx || ctx.archetype !== 'energy' || config?.system.kind !== 'thresholds') return null;
  const system = config.system;
  const bandOf = new Map(system.bands.map((band) => [band.pieceId, band.atLeastPct]));

  const pieces: SpendView[] = [];
  for (const piece of SPIRIT_KIT.pieces) {
    const rank = ctx.pieceRanks.get(piece.id);
    if (rank === undefined) continue;
    const lines = [piece.text, ...(piece.ranks ?? []).filter((entry) => entry.rank <= rank).map((entry) => entry.text)];
    pieces.push({
      pieceId: piece.id,
      name: piece.name,
      family: piece.family,
      rank,
      text: lines.join(' '),
      waitsFor: piece.waitsFor ? waitsText(piece.waitsFor) : '',
      atFloor: piece.atFloor === true,
      band: piece.atFloor ? null : bandOf.get(piece.id) ?? null,
      automatic: AUTOMATIC_PIECES.has(piece.id),
    });
  }
  const trophy = config.relic[0] ? TROPHIES.get(config.relic[0]) : undefined;
  const check = checkClassConfig(config, ctx);
  const discipline = SPIRIT_KIT.disciplines.find((entry) => entry.id === ctx.disciplineId);
  const specialization = SPIRIT_KIT.specializations.find((entry) => entry.id === ctx.specializationId && entry.disciplineId === ctx.disciplineId);
  const taken = new Set(input.unlockedSkills ?? []);
  const disciplineLeaves = discipline ? SPIRIT_KIT.leaves.filter((leaf) => leaf.disciplineId === discipline.id) : [];
  return {
    storm: { pips: ctx.budget },
    floorPct: system.floorPct,
    phase: system.phase,
    discipline: discipline ? { id: discipline.id, name: discipline.name } : null,
    specialization: specialization ? { id: specialization.id, name: specialization.name, text: specialization.text } : null,
    specializationChoices: discipline
      ? SPIRIT_KIT.specializations.filter((entry) => entry.disciplineId === discipline.id).map((entry) => ({ id: entry.id, name: entry.name }))
      : [],
    leaves: disciplineLeaves.filter((leaf) => taken.has(leaf.id)).map((leaf) => ({ id: leaf.id, name: leaf.name, text: leaf.text })),
    leafChoices: disciplineLeaves.filter((leaf) => !taken.has(leaf.id)).map((leaf) => ({ id: leaf.id, name: leaf.name })),
    pieces,
    relic: trophy
      ? { trophyId: trophy.id, name: trophy.name, kind: trophy.kind, text: trophy.text }
      : { trophyId: null, name: 'A plain storm', kind: 'none', text: 'Beat a boss and its trophy twists your storm.' },
    problems: check.ok ? [] : check.reasons,
  };
}

function withSystem(config: ClassConfig, system: ThresholdsConfig): ClassConfig {
  return { ...config, mode: 'custom', system };
}

/** The floor you never spend below (0–100). */
export function withFloor(config: ClassConfig, floorPct: number): ClassConfig {
  if (config.system.kind !== 'thresholds') return config;
  return withSystem(config, { ...config.system, floorPct });
}

/** Place a spend in a band (or move it); `null` takes it off the gauge. */
export function withBand(config: ClassConfig, pieceId: string, atLeastPct: number | null): ClassConfig {
  if (config.system.kind !== 'thresholds') return config;
  const others = config.system.bands.filter((band) => band.pieceId !== pieceId);
  const bands = atLeastPct === null ? others : [...others, { pieceId, atLeastPct }];
  return withSystem(config, { ...config.system, bands });
}

/** Gather to full then break down to the floor, or hover just above it. */
export function withPhase(config: ClassConfig, phase: ThresholdsConfig['phase']): ClassConfig {
  if (config.system.kind !== 'thresholds') return config;
  return withSystem(config, { ...config.system, phase });
}
