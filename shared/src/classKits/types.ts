/**
 * Class kits: everything a class-first class owns, as static data (class-first bible §3, §6).
 *
 * One kit per class. It lists the class's **pieces** (what you place in your class system:
 * techniques, responses, payoffs, clip types, spends, summons), the **lessons** that teach
 * or rank them up (a zone's level, the starter kit, or the T2 discipline), the **trophies**
 * a boss lineage hands you for the relic slot, the class's **budget** (its room, stepped by
 * Global Mastery), and the Passive Tree's **disciplines, specializations and leaves**.
 *
 * Archetype ids stay the persisted keys (`cadence` is the Striker...); content ids use the
 * class name (`striker-sweep`) and are frozen once created: a rename changes `name`, never
 * the id (the bible's names are placeholders). Trophy ids are `<class>-relic-<biome>`.
 *
 * Numbers live in `params` and are placeholders for the designer: data entry leaves them
 * empty, and each class runtime fills in the keys it reads (build plan §3.1).
 */
import type { CombatArchetype } from '../types/combat';

export type ClassArchetype = Exclude<CombatArchetype, null>;

export type ClassName = 'striker' | 'squire' | 'apprentice' | 'slinger' | 'spirit' | 'conduit';

export const CLASS_NAME_BY_ARCHETYPE: Readonly<Record<ClassArchetype, ClassName>> = {
  cadence: 'striker',
  cooldown: 'squire',
  dot: 'apprentice',
  reload: 'slinger',
  energy: 'spirit',
  summoner: 'conduit',
};

/**
 * The biomes that teach lessons and hold boss lineages, by their code ids. The T4 undead
 * biome is `graveyard` (the bible also calls it the Wasteland).
 */
export const KIT_BIOMES = [
  'plains', 'forest', 'swamp', 'mountain', 'cave',
  'jungle', 'desert', 'tundra', 'volcanic', 'graveyard', 'trench',
] as const;
export type KitBiome = typeof KIT_BIOMES[number];

/** Numbers a class runtime reads, keyed by name. Placeholders until the designer tunes. */
export type KitParams = Readonly<Record<string, number>>;

// ── Pieces ───────────────────────────────────────────────────────────────────

/** A rank above 1: the same piece, stronger, with one visible twist (bible §8.8, §12.8). */
export interface PieceRank {
  rank: number;
  /** Player-facing text for what this rank adds. */
  text: string;
  params?: KitParams;
}

/**
 * Something you own and place in your class system. Each class narrows `family` to its own
 * vocabulary and adds its own fields (see the class's `kit.ts`).
 */
export interface PieceBase<Family extends string = string> {
  /** `<class>-<name>`, kebab-case, frozen. Also the icon's filename. */
  id: string;
  classId: ClassArchetype;
  /** Display name (a placeholder: the designer renames freely). */
  name: string;
  family: Family;
  /** Player-facing card text for rank 1: what it does in a fight, plain words, no numbers. */
  text: string;
  /** The piece this one is a new shape of. You keep both and choose (a sidegrade). */
  sidegradeOf?: string;
  /** Ranks 2 and up, in order. A rank-up lesson points at one of these. */
  ranks?: readonly PieceRank[];
  params: KitParams;
}

export type PieceDef<Family extends string = string, Extra extends object = object> =
  PieceBase<Family> & Extra;

// ── Lessons ──────────────────────────────────────────────────────────────────

/** Where a lesson comes from. */
export type LessonSource =
  /** The Clearing's starting kit. */
  | { kind: 'starter' }
  /**
   * A zone's level teaches it, before the zone's boss. `level` counts within that tier's
   * six-level segment of the biome (1–6), so `{ biome: 'plains', tier: 2, level: 2 }` is
   * Plains level 8. `absoluteZoneLevel` converts.
   */
  | { kind: 'zone'; biome: KitBiome; tier: number; level: number }
  /**
   * The T2 discipline pick unlocks it: that discipline's own piece, or, without
   * `disciplineId`, whichever discipline is picked (the Squire's Last Breath, §8.8).
   */
  | { kind: 'discipline'; disciplineId?: string };

/**
 * One lesson: the moment you learn a piece (`rank` 1) or rank one up. Its id is derived:
 * the piece id for rank 1, `<pieceId>-<rank>` above (`lessonId`).
 */
export interface LessonDef {
  pieceId: string;
  rank: number;
  /** `new` and `sidegrade` teach rank 1; `rank-up` teaches a higher rank. */
  kind: 'starter' | 'new' | 'sidegrade' | 'rank-up' | 'discipline';
  source: LessonSource;
}

// ── Trophies ─────────────────────────────────────────────────────────────────

/** A trophy rank above 1, granted by the same lineage's boss one tier up. */
export interface TrophyRank {
  rank: number;
  /** The boss tier that grants this rank: the lineage's first tier + rank − 1. */
  bossTier: number;
  text: string;
  params?: KitParams;
}

/**
 * A boss trophy: what the relic slot holds (bible §4). Rank 1 comes from the lineage's
 * boss at the biome's first tier; each later tier's boss ranks it up. A retired lineage's
 * trophy keeps working and scaling with the class's tier; it only stops ranking up.
 */
export interface TrophyDef<Kind extends string = string> {
  /** `<class>-relic-<biome>`. */
  id: string;
  classId: ClassArchetype;
  lineage: KitBiome;
  name: string;
  /** The class's trophy vocabulary (spark / weight, slam / Resolve, ...). */
  kind: Kind;
  /** Rank 1: the twist, in player-facing words. */
  text: string;
  ranks: readonly TrophyRank[];
  params: KitParams;
}

// ── Budget ───────────────────────────────────────────────────────────────────

/** From this Global Mastery on, the budget is `value`. */
export interface BudgetStep {
  mastery: number;
  value: number;
}

/**
 * The class's room, grown by Global Mastery in steps and shown in class terms ("Command 5,
 * next at Mastery 30", bible §2). The class runtime decides what a value means (pips, slots,
 * rack slots then double loads, open then master).
 */
export interface BudgetDef {
  /** The class's word for it: Command, Resolve, Sigils, Rack, Storm, Techniques. */
  label: string;
  /** Ascending by mastery; the first step is at mastery 0. */
  steps: readonly BudgetStep[];
  /** Optional class wording for a value ("4 slots, 1 double load"); defaults to the number. */
  describe?: (value: number) => string;
}

// ── The Passive Tree's content ───────────────────────────────────────────────

/** The T2 pick: the class's main playstyle fork (bible §2). Code tree tier 1. */
export interface DisciplineDef {
  id: string;
  classId: ClassArchetype;
  name: string;
  /** One line a player would say ("Two guns, never still for long."). */
  fantasy: string;
  /** What it changes, player-facing. */
  text: string;
  /** The piece the pick unlocks, if any (Parry, Fuse, Ball Lightning...). */
  pieceId?: string;
  params: KitParams;
}

/** The T3 pick, scoped to a discipline. Code tree tier 2. */
export interface SpecializationDef {
  id: string;
  classId: ClassArchetype;
  disciplineId: string;
  name: string;
  text: string;
  params: KitParams;
}

/** A T4+ pick, three per discipline per tier, scoped to a discipline. Code tree tier 3+. */
export interface LeafDef {
  id: string;
  classId: ClassArchetype;
  disciplineId: string;
  /** Product tier (4 for the first leaf tier). */
  tier: number;
  /** The tier's question column it answers (the Striker's T4: 'spike' / 'swarm' / 'slow-bleed'). */
  column: string;
  name: string;
  text: string;
  params: KitParams;
}

// ── The kit ──────────────────────────────────────────────────────────────────

export interface ClassKit<
  Piece extends PieceDef = PieceDef,
  Trophy extends TrophyDef = TrophyDef,
> {
  classId: ClassArchetype;
  className: ClassName;
  /** Player-facing class name. */
  displayName: string;
  /** The class system's name: the Order, Response rules, Payoff rules, the Loadout... */
  systemName: string;
  budget: BudgetDef;
  pieces: readonly Piece[];
  lessons: readonly LessonDef[];
  trophies: readonly Trophy[];
  disciplines: readonly DisciplineDef[];
  specializations: readonly SpecializationDef[];
  leaves: readonly LeafDef[];
}
