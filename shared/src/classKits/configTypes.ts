/**
 * The class config: what a player sets in their class system (build plan §3.3).
 *
 * One shape per system, from each bible section's "What you configure": the Striker's Order
 * (§12.3), the Squire's Response rules (§8.3), the Apprentice's Payoff rules (§9.3), the
 * Slinger's Loadout (§10.3), the Spirit's Thresholds (§11.3) and the Conduit's Formation
 * (§7.3). Every config also holds the relic slot (the equipped trophy) and its mode. Rules cost
 * nothing (§3); what limits a config is which pieces you own and the class's budget.
 *
 * These are the first cut, enough for the T1 runtimes; each class track refines its own shape.
 */
import type { MomentId } from './moments';
import type { ClassArchetype } from './types';

/**
 * One condition of a rule: a moment (`moments.ts`) or one of the class's own states (the
 * Squire's Resolve, the Apprentice's sigils on the target), with its tunable and an optional
 * negation.
 */
export interface ConditionRef {
  id: MomentId | ClassStateConditionId;
  param?: number;
  not?: boolean;
}

/** Conditions that read a class's own state rather than the fight. */
export const CLASS_STATE_CONDITIONS = {
  /** Squire: at least `param` pips in the Resolve bar ("only with N pips", §8.3). */
  'resolve-at-least': { archetype: 'cooldown', text: 'your Resolve bar holds enough pips' },
  /** Apprentice: the target carries at least `param` of your sigils. */
  'sigils-at-least': { archetype: 'dot', text: 'the target carries enough of your sigils' },
} as const satisfies Record<string, { archetype: ClassArchetype; text: string }>;

export type ClassStateConditionId = keyof typeof CLASS_STATE_CONDITIONS;

// ── The Striker: the Order (§12.3) ───────────────────────────────────────────

export interface OrderConfig {
  kind: 'order';
  /**
   * One entry per beat before the finisher: a technique id, or null for a plain swing. The
   * first beat is the opener, the last the wind-up; a cast may only sit on its own position.
   */
  beats: (string | null)[];
  /** Don't spend the finisher while these hold (Heavy's "not on a nearly dead target"). */
  holdFinisher: ConditionRef[];
}

// ── The Squire: Response rules (§8.3) ────────────────────────────────────────

export interface ResponseRule {
  pieceId: string;
  enabled: boolean;
  /** Extra conditions on top of the response's natural trigger (only on bosses, ...). */
  conditions: ConditionRef[];
}

export interface ResponsesConfig {
  kind: 'responses';
  rules: ResponseRule[];
  /** Hold a ground telegraph (guard it and keep swinging) or step out like every class. */
  groundTelegraphs: 'hold' | 'step-out';
  /** Hold the slam while these hold (never fire it early). */
  holdSlam: ConditionRef[];
}

// ── The Apprentice: Payoff rules (§9.3) ──────────────────────────────────────

export interface PayoffPlacement {
  moment: MomentId;
  pieceId: string;
  conditions: ConditionRef[];
}

export interface PayoffsConfig {
  kind: 'payoffs';
  /** In priority order: at a moment, the first placement whose conditions hold fires. */
  placements: PayoffPlacement[];
}

// ── The Slinger: the Loadout (§10.3) ─────────────────────────────────────────

export interface ClipRule {
  /** A racked clip type, or the plain clip. */
  clip: string;
  conditions: ConditionRef[];
  /** A switch reload: dump the current clip early to load this one. */
  switchEarly?: boolean;
}

export interface LoadoutConfig {
  kind: 'loadout';
  /** The clip types you carry (the plain clip is always there and takes no slot). */
  rack: string[];
  /** Clips that carry a second property, once the rack is full (§10.2). */
  doubleLoads: [string, string][];
  /** In priority order at each reload; none matching loads the plain clip. */
  clipRules: ClipRule[];
  /** Free reload rules (§10.3). */
  reloadEarlyWhenSafe: boolean;
  neverReloadInTelegraph: boolean;
  /** Trickshot: where the called shot flies (§10.5). */
  calledShot?: ConditionRef[];
  /** Deadeye: what the held last round waits for (§10.6). */
  deadeyeHold?: ConditionRef[];
}

// ── The Spirit: Thresholds (§11.3) ───────────────────────────────────────────

export interface SpendBand {
  pieceId: string;
  /** The spend may fire while the storm is at or above this share of the bottle (0–100). */
  atLeastPct: number;
}

export interface ThresholdsConfig {
  kind: 'thresholds';
  /** You never spend below it (0–100). */
  floorPct: number;
  bands: SpendBand[];
  /** Gather to full then break down to the floor, or hover just above it. */
  phase: 'gather' | 'hover';
}

// ── The Conduit: Formation (§7.3) ────────────────────────────────────────────

export interface FormationOrders {
  attackFirst: 'attacking-me' | 'closest' | 'weakest' | 'elites';
  tanksGuard: 'conduit' | 'back-row';
  /** Recall everyone when these hold; empty means never. */
  recallWhen: ConditionRef[];
  rebuildFirst: 'tanks' | 'damage' | 'supports' | 'as-fallen';
}

export interface FormationConfig {
  kind: 'formation';
  /** The summons you field, one entry per body (repeats allowed), within Command. */
  roster: string[];
  orders: FormationOrders;
}

// ── The envelope ─────────────────────────────────────────────────────────────

export type ClassSystemConfig =
  | OrderConfig
  | ResponsesConfig
  | PayoffsConfig
  | LoadoutConfig
  | ThresholdsConfig
  | FormationConfig;

export type ClassSystemKind = ClassSystemConfig['kind'];

export const SYSTEM_KIND_BY_ARCHETYPE: Readonly<Record<ClassArchetype, ClassSystemKind>> = {
  cadence: 'order',
  cooldown: 'responses',
  dot: 'payoffs',
  reload: 'loadout',
  energy: 'thresholds',
  summoner: 'formation',
};

export interface ClassConfig {
  /**
   * `auto`: the class default is rebuilt whenever a lesson, trophy or budget step arrives, so
   * a player who never opens the screen still gets stronger. `custom`: set by the first edit.
   */
  mode: 'auto' | 'custom';
  /** The equipped trophies, by id: one relic slot, two with Two Souls. */
  relic: string[];
  system: ClassSystemConfig;
}

/** What a config is checked against: everything the character owns and has room for. */
export interface ClassConfigContext {
  archetype: ClassArchetype;
  /** Owned pieces and their ranks (`pieceRanks`). */
  pieceRanks: ReadonlyMap<string, number>;
  /** Owned trophies and their ranks (`trophyRanks`). */
  trophyRanks: ReadonlyMap<string, number>;
  /** Owned trophies, most recently earned first: the auto relic is the newest. */
  trophiesNewestFirst: readonly string[];
  /** The class budget's value at the character's Global Mastery. */
  budget: number;
  /** The T2 pick, once made. */
  disciplineId: string | null;
  /** How many trophies the relic slot holds (two with Two Souls). */
  relicSlots: number;
}

export type ClassConfigCheck = { ok: true } | { ok: false; reasons: string[] };
