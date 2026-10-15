/**
 * The class screen's view model (class-first build plan §3.3, §3.4, F7): what the shell shows
 * for every class, composed from the same fields the server persists and the player view
 * carries. Each class's own editor (the Order, Response rules...) composes its own view on
 * top of this one (`composeOrderView` and its siblings, built by the class tracks).
 *
 * Pure: the client, the bot and tests call it with a player view; nothing here reads the
 * world.
 */
import { BIOME_DATABASE } from '../biomeDatabase';
import { globalMastery } from '../config/gameConfig';
import { classConfigContextFromState, type ClassStateInput } from './config';
import type { ClassConfig, ClassSystemKind } from './configTypes';
import { SYSTEM_KIND_BY_ARCHETYPE } from './configTypes';
import { absoluteZoneLevel, classBudget, classKitFor, lessonReached, trophyRanks } from './registry';
import type { BudgetReading } from './budget';
import type { ClassArchetype, KitBiome, LessonDef, PieceDef, TrophyDef } from './types';

/** One owned piece, as its card shows it. */
export interface ClassPieceCardView {
  id: string;
  name: string;
  family: string;
  /** Rank 1's text, then each learned rank's addition, in order. */
  lines: string[];
  rank: number;
  maxRank: number;
  /** The piece this one is a sidegrade of, by name (you keep both and choose). */
  sidegradeOfName: string | null;
  /** The current config uses it somewhere. */
  placed: boolean;
  /** Not yet seen on the screen (the caller says which ids it has shown). */
  isNew: boolean;
}

/** One owned trophy, as its card shows it. */
export interface ClassTrophyCardView {
  id: string;
  name: string;
  /** The class's trophy vocabulary: spark / weight, slam / Resolve, soul... */
  kind: string;
  /** The boss lineage's biome, as players name it. */
  lineageName: string;
  lines: string[];
  rank: number;
  maxRank: number;
  equipped: boolean;
  isNew: boolean;
}

/** A lesson not reached yet in the character's current tier: the "coming next" list. */
export interface ClassUpcomingLessonView {
  pieceId: string;
  pieceName: string;
  kind: LessonDef['kind'];
  rank: number;
  /** "Plains level 8". */
  where: string;
  biome: KitBiome;
  biomeLevel: number;
  /** What it does (rank 1's text, or the rank's addition). */
  text: string;
}

export interface ClassScreenView {
  archetype: ClassArchetype;
  className: string;
  systemKind: ClassSystemKind;
  /** The Order, Response rules, Payoff rules, the Loadout, Thresholds, Formation. */
  systemName: string;
  mode: ClassConfig['mode'];
  /** "Techniques 2, next at Mastery 30". */
  budget: BudgetReading;
  discipline: { id: string; name: string; fantasy: string } | null;
  pieces: ClassPieceCardView[];
  trophies: ClassTrophyCardView[];
  relic: { slots: number; equipped: string[] };
  upcoming: ClassUpcomingLessonView[];
  /** The config as the server holds it, for the class's own editor. */
  config: ClassConfig | null;
}

/** The parts of the player view the class screen reads. */
export interface ClassScreenInput extends ClassStateInput {
  classConfig: ClassConfig | null;
  playerTier: number;
  /** The T4 leaf picked (an unlocked kit leaf id), when the class shows it. */
  leafId?: string | null;
}

export function biomeDisplayName(biome: string): string {
  return BIOME_DATABASE.get(biome)?.name ?? biome;
}

/** Every string anywhere in the config's system: the piece ids it references, among others. */
function stringsIn(value: unknown, out: Set<string>): Set<string> {
  if (typeof value === 'string') out.add(value);
  else if (Array.isArray(value)) for (const v of value) stringsIn(v, out);
  else if (value && typeof value === 'object') for (const v of Object.values(value)) stringsIn(v, out);
  return out;
}

function pieceLines(piece: PieceDef, rank: number): string[] {
  return [piece.text, ...(piece.ranks ?? []).filter((r) => r.rank <= rank).map((r) => r.text)];
}

function trophyLines(trophy: TrophyDef, rank: number): string[] {
  return [trophy.text, ...trophy.ranks.filter((r) => r.rank <= rank).map((r) => r.text)];
}

/**
 * The class screen for a character, or null before a class is picked. `seen` holds the piece
 * and trophy ids the screen has already shown this character; without it nothing is new.
 */
export function composeClassScreenView(
  input: ClassScreenInput,
  seen?: ReadonlySet<string>,
): ClassScreenView | null {
  const ctx = classConfigContextFromState(input);
  if (!ctx) return null;
  const kit = classKitFor(ctx.archetype);
  const config = input.classConfig;
  const used = stringsIn(config?.system, new Set<string>());
  const equipped = config?.relic ?? [];
  const isNew = (id: string) => seen !== undefined && !seen.has(id);

  const pieces: ClassPieceCardView[] = [];
  for (const piece of kit.pieces) {
    const rank = ctx.pieceRanks.get(piece.id);
    if (rank === undefined) continue;
    pieces.push({
      id: piece.id,
      name: piece.name,
      family: piece.family,
      lines: pieceLines(piece, rank),
      rank,
      maxRank: 1 + (piece.ranks?.length ?? 0),
      sidegradeOfName: piece.sidegradeOf ? kit.pieces.find((p) => p.id === piece.sidegradeOf)?.name ?? null : null,
      placed: used.has(piece.id),
      isNew: isNew(piece.id),
    });
  }

  const trophies: ClassTrophyCardView[] = [];
  for (const trophy of kit.trophies) {
    const rank = ctx.trophyRanks.get(trophy.id);
    if (rank === undefined) continue;
    trophies.push({
      id: trophy.id,
      name: trophy.name,
      kind: trophy.kind,
      lineageName: biomeDisplayName(trophy.lineage),
      lines: trophyLines(trophy, rank),
      rank,
      maxRank: 1 + trophy.ranks.length,
      equipped: equipped.includes(trophy.id),
      isNew: isNew(trophy.id),
    });
  }

  const progress = { biomeLevel: input.biomeLevel, bossesCleared: input.bossesCleared, disciplineId: ctx.disciplineId };
  const upcoming: ClassUpcomingLessonView[] = [];
  for (const lesson of kit.lessons) {
    const { source } = lesson;
    if (source.kind !== 'zone' || source.tier > input.playerTier || lessonReached(lesson, progress)) continue;
    const piece = kit.pieces.find((p) => p.id === lesson.pieceId);
    if (!piece) continue;
    const level = absoluteZoneLevel(source);
    upcoming.push({
      pieceId: piece.id,
      pieceName: piece.name,
      kind: lesson.kind,
      rank: lesson.rank,
      where: `${biomeDisplayName(source.biome)} level ${level}`,
      biome: source.biome,
      biomeLevel: level,
      text: lesson.rank === 1 ? piece.text : piece.ranks?.find((r) => r.rank === lesson.rank)?.text ?? piece.text,
    });
  }
  upcoming.sort((a, b) => a.biomeLevel - b.biomeLevel || a.where.localeCompare(b.where));

  const discipline = kit.disciplines.find((d) => d.id === ctx.disciplineId);
  return {
    archetype: ctx.archetype,
    className: kit.displayName,
    systemKind: SYSTEM_KIND_BY_ARCHETYPE[ctx.archetype],
    systemName: kit.systemName,
    mode: config?.mode ?? 'auto',
    budget: classBudget(ctx.archetype, globalMastery(input.biomeLevel)),
    discipline: discipline ? { id: discipline.id, name: discipline.name, fantasy: discipline.fantasy } : null,
    pieces,
    trophies,
    relic: { slots: ctx.relicSlots, equipped },
    upcoming,
    config,
  };
}

/** Something the class screen announces with a toast: a piece learned or ranked up, a trophy won or ranked up. */
export interface ClassUnlockNotice {
  kind: 'piece' | 'trophy';
  id: string;
  name: string;
  rank: number;
  /** "New technique", "Rank II", "New trophy"... the caller words it; this is the raw shape. */
  isRankUp: boolean;
  /** What it does now: rank 1's text, or the new rank's addition. */
  text: string;
}

/**
 * What changed between two snapshots of the same character: the toasts to show. Empty when
 * the class differs (a new character, a class reset) or no class is picked.
 */
export function classUnlockNotices(before: ClassStateInput, after: ClassStateInput): ClassUnlockNotice[] {
  const archetype = after.combatArchetype;
  if (!archetype || before.combatArchetype !== archetype) return [];
  const prev = classConfigContextFromState(before);
  const next = classConfigContextFromState(after);
  if (!prev || !next) return [];
  const kit = classKitFor(archetype);
  const notices: ClassUnlockNotice[] = [];
  for (const piece of kit.pieces) {
    const was = prev.pieceRanks.get(piece.id) ?? 0;
    const now = next.pieceRanks.get(piece.id) ?? 0;
    if (now <= was) continue;
    notices.push({
      kind: 'piece', id: piece.id, name: piece.name, rank: now, isRankUp: was > 0,
      text: now === 1 ? piece.text : piece.ranks?.find((r) => r.rank === now)?.text ?? piece.text,
    });
  }
  const prevTrophies = trophyRanks(archetype, before.bossesCleared);
  for (const trophy of kit.trophies) {
    const was = prevTrophies.get(trophy.id) ?? 0;
    const now = next.trophyRanks.get(trophy.id) ?? 0;
    if (now <= was) continue;
    notices.push({
      kind: 'trophy', id: trophy.id, name: trophy.name, rank: now, isRankUp: was > 0,
      text: now === 1 ? trophy.text : trophy.ranks.find((r) => r.rank === now)?.text ?? trophy.text,
    });
  }
  return notices;
}
