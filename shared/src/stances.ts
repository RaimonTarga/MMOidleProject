/**
 * Stances are mutually-exclusive combat postures. A player chooses one free
 * default stance; Rune rules may name any learned stance as an automated
 * destination. The destination's runeCost is paid by each rule that targets it.
 *
 * AUTHORING CONTRACT (corrective pass 2026-08-22)
 *
 * A stance is a TEMPORARY mode that can switch automatically mid-fight, so every
 * static modifier is a PERCENTAGE, never a flat grant. A flat `attack: +65` is the
 * whole character at T1 and a rounding error at T5; a `+35%` posture reads the same
 * at every tier. See `docs/stances-current-state.md`.
 *
 * Two further rules fall out of "temporary mode":
 *
 *   - NO stance changes max HP. Repeatedly resizing the pool means repeatedly
 *     preserving HP percentage across a switch the player did not ask for. Tanking
 *     buys survival with mitigation and an offensive sacrifice instead.
 *   - Runes own CONDITIONS, the stance owns the POSTURE. Enraged has no internal
 *     HP threshold; `HP Below 25% -> Enraged` is a Rune rule. Only behavior that is
 *     intrinsic to the posture (Berserker's self-damage, Predator's opener, Brawler's
 *     aggressor count, Execute's low-HP window) lives on the stance.
 */
import type { MechanicEffects } from "./passives";

export type StanceSlot = "default";

/** Reserved Rune destination for deliberately dropping every active stance. */
export const NO_STANCE_ID = "no-stance";

/**
 * A stance's static posture, entirely in percentages.
 *
 * `attackPct` / `platingPct` / `moveSpeedPct` are a STANCE-OWNED multiplicative
 * layer applied after the class-affinity fold, NOT contributions into the affinity
 * bucket. That is deliberate: a stance is a mode the player toggles and reads off a
 * tooltip, so "+15% Attack" has to mean ×1.15 for every class at every gear level.
 * Summing into the affinity bucket would make the promise depend on the class tree.
 *
 * `attackSpeedPct` is the exception — it rides the pre-existing shared attack-speed
 * accumulator, which already has sum-then-apply-once semantics and must stay ahead
 * of the reload archetype's cadence layers.
 */
export interface StanceModifiers {
  /** 0.15 → ×1.15 Attack. Applied after class affinities. */
  attackPct?: number;
  /** 0.10 → +10 percentage points into the shared attack-speed accumulator. */
  attackSpeedPct?: number;
  /** 0.20 → ×1.20 Plating. Applied after class affinities. */
  platingPct?: number;
  /** 0.35 → ×1.35 Move Speed. Applied after class affinities. */
  moveSpeedPct?: number;
  /** Percentage POINTS of Evasion. Evasion is already a 0–1 fraction, so it needs no twin. */
  evasion?: number;
  /**
   * Multiplicative change to incoming damage: 0.10 → take 10% more, −0.25 → take
   * 25% less. Deliberately NOT the additive `damageReduction` pool — that pool
   * clamps at 0, so a negative posture penalty silently vanished for any character
   * without gear DR, and a positive one stacked into the shared 0.9 cap.
   */
  damageTakenPct?: number;
}

/**
 * One server-runtime effect, written out for the player.
 *
 * Static modifiers render themselves from {@link StanceModifiers}; behavior that
 * lives in a combat listener or a tick cannot, so it is authored here rather than
 * left invisible. Every threshold, cap, combat-state restriction and lethal clause
 * a stance has must appear in this list.
 */
export interface StanceBehavior {
  key: string;
  label: string;
  value: string;
  /** Qualifier belonging to the value, e.g. "while in combat". */
  detail?: string;
  /** Hover copy: the full rule, including how it arms and what consumes it. */
  help?: string;
  /** False marks a drawback. Omitted means an upside. */
  good?: boolean;
}

export interface StanceDef {
  id: string;
  name: string;
  /**
   * The player-facing effect sentence. Surfaces that have room for only one line
   * (crafting, the Rune destination wheel, the map's unlock list) show this and
   * nothing else, so it states real mechanics rather than flavour.
   */
  blurb: string;
  /** RP added to a switch rule that names this stance. The free default pays none. */
  runeCost: number;
  modifiers?: StanceModifiers;
  mechanicEffects?: MechanicEffects;
  /** Server-runtime effects, spelled out. See {@link StanceBehavior}. */
  behaviors?: readonly StanceBehavior[];
  icon?: string;
}

export interface EquippedStances {
  default: string | null;
}

export function emptyEquippedStances(): EquippedStances {
  return { default: null };
}

// ── Behavioral constants ──────────────────────────────────────────────────────
// The server systems and the tooltip copy below both read these, so a stance can
// never advertise a number it does not apply.

/** Berserker: fraction of max HP lost per second while combat state persists. */
export const BERSERKER_SELF_DAMAGE_PCT = 0.02;
export const BERSERKER_SELF_DAMAGE_INTERVAL_MS = 1000;
/** Predator: fraction removed from every monster's effective detection radius. */
export const PREDATOR_DETECTION_REDUCTION = 0.5;
/** Predator: bonus damage on the armed opening hit (0.75 → +75%). */
export const PREDATOR_OPENER_BONUS = 0.75;
/** Execute: target HP fraction at or below which the finisher bonus applies. */
export const EXECUTE_HP_THRESHOLD = 0.25;
export const EXECUTE_BONUS = 0.75;
/** Recuperating: fraction of the player's Recovery rate that stays active in combat. */
export const RECUPERATING_RECOVERY_ACTIVE = 0.8;

/**
 * Brawler's incoming-damage reduction by the number of monsters currently aggroed
 * onto the player. Index 0 (nobody engaging) is zero; the last entry is the cap
 * every larger crowd shares. Authored as a table rather than a curve because the
 * exact shape is a balance lever and the tooltip quotes both ends of it.
 */
export const BRAWLER_REDUCTION_BY_AGGRESSORS: readonly number[] = [0, 0.08, 0.16, 0.24, 0.31, 0.4];

export function brawlerDamageReduction(aggressors: number): number {
  if (aggressors <= 0) return 0;
  const table = BRAWLER_REDUCTION_BY_AGGRESSORS;
  return table[Math.min(aggressors, table.length - 1)] ?? 0;
}

/** The cap Brawler advertises, derived from the table so the two cannot drift. */
export const BRAWLER_MAX_REDUCTION =
  BRAWLER_REDUCTION_BY_AGGRESSORS[BRAWLER_REDUCTION_BY_AGGRESSORS.length - 1] ?? 0;

const pct = (v: number): string => `${Math.round(Math.abs(v) * 100)}%`;

// First-pass magnitudes are deliberately centralized here for later balance passes.
// Structure is frozen after the 2026-08-22 corrective pass; the numbers are seeds.
const stances: StanceDef[] = [
  {
    id: "offensive-stance",
    name: "Offensive Stance",
    blurb: "+15% Attack and +10% Attack Speed. You take 10% more damage.",
    runeCost: 1,
    modifiers: { attackPct: 0.15, attackSpeedPct: 0.1, damageTakenPct: 0.1 },
    icon: "offensive-stance",
  },
  {
    id: "defensive-stance",
    name: "Defensive Stance",
    blurb: "+20% Plating and 10% less damage taken. -15% Attack.",
    runeCost: 1,
    modifiers: { platingPct: 0.2, damageTakenPct: -0.1, attackPct: -0.15 },
    icon: "defensive-stance",
  },
  {
    id: "tanking-stance",
    name: "Tanking Stance",
    blurb: "+40% Plating and 25% less damage taken. -40% Attack and -20% Attack Speed.",
    runeCost: 3,
    modifiers: {
      platingPct: 0.4,
      damageTakenPct: -0.25,
      attackPct: -0.4,
      attackSpeedPct: -0.2,
    },
    icon: "tanking-stance",
  },
  {
    id: "enraged-stance",
    name: "Enraged Stance",
    // No HP threshold lives in this stance. Pair it with an `HP Below 25%` Rune rule
    // if that is the moment you want it — but it works whenever it is active.
    blurb: "+30% Attack and +15% Attack Speed. You take 15% more damage.",
    runeCost: 3,
    modifiers: { attackPct: 0.3, attackSpeedPct: 0.15, damageTakenPct: 0.15 },
    icon: "enraged-stance",
  },
  {
    id: "perfection-stance",
    name: "Perfection Stance",
    blurb: "+12% Attack, Attack Speed, and Movement Speed. -20% Plating.",
    runeCost: 2,
    modifiers: {
      attackPct: 0.12,
      attackSpeedPct: 0.12,
      moveSpeedPct: 0.12,
      platingPct: -0.2,
    },
    icon: "perfection-stance",
  },
  {
    id: "fleeting-stance",
    name: "Fleeting Stance",
    blurb: "+35% Movement Speed and +15% Evasion. -35% Attack and -20% Attack Speed.",
    runeCost: 2,
    modifiers: {
      moveSpeedPct: 0.35,
      evasion: 0.15,
      attackPct: -0.35,
      attackSpeedPct: -0.2,
    },
    icon: "fleeting-stance",
  },
  {
    id: "berserker-stance",
    name: "Berserker Stance",
    blurb:
      "+35% Attack and +20% Attack Speed. You take 15% more damage and lose 2% of max HP each second while in combat — this can kill you.",
    runeCost: 4,
    modifiers: { attackPct: 0.35, attackSpeedPct: 0.2, damageTakenPct: 0.15 },
    behaviors: [
      {
        key: "berserker-self-damage",
        label: "Self-damage",
        value: `${pct(BERSERKER_SELF_DAMAGE_PCT)} max HP / sec`,
        detail: "while in combat",
        help:
          "Direct damage dealt to you every second that combat state persists. It bypasses plating, damage reduction, barriers and cheat-death, and it will kill you if you hold the stance too long.",
        good: false,
      },
    ],
    icon: "berserker-stance",
  },
  {
    id: "recuperating-stance",
    name: "Recuperating Stance",
    blurb: "80% of your Recovery stays active in combat. -50% Attack and -30% Attack Speed.",
    runeCost: 4,
    modifiers: { attackPct: -0.5, attackSpeedPct: -0.3 },
    // Recovery is one rate; effects activate a FRACTION of it rather than granting
    // their own healing. Flat `recovery: +4` was removed in the corrective pass —
    // the identity is the in-combat access, not a bigger pool.
    mechanicEffects: { "defense.recovery-active-pct": RECUPERATING_RECOVERY_ACTIVE },
    icon: "recuperating-stance",
  },
  {
    id: "predator-stance",
    name: "Predator Stance",
    blurb:
      "50% reduced enemy detection and +15% Movement Speed. Your first hit after approaching out of combat deals 75% more damage. -10% Attack.",
    runeCost: 3,
    modifiers: { moveSpeedPct: 0.15, attackPct: -0.1 },
    behaviors: [
      {
        key: "predator-detection",
        label: "Enemy detection",
        value: `−${pct(PREDATOR_DETECTION_REDUCTION)}`,
        help: "Every monster's effective detection radius is halved while the stance is active, so you can cross a node without pulling it.",
      },
      {
        key: "predator-opener",
        label: "Opening hit",
        value: `+${pct(PREDATOR_OPENER_BONUS)} damage`,
        detail: "arms out of combat",
        help: "The opener arms while Predator is active and you are out of combat, and is consumed by your first hit on a monster. Re-arms once combat ends.",
      },
    ],
    icon: "predator-stance",
  },
  {
    id: "brawler-stance",
    name: "Brawler Stance",
    blurb:
      "-10% Attack. Gain damage reduction for each enemy actively engaging you, from 8% against one attacker up to 40% against five or more.",
    runeCost: 3,
    modifiers: { attackPct: -0.1 },
    behaviors: [
      {
        key: "brawler-crowd",
        label: "Crowd mitigation",
        value: `${pct(BRAWLER_REDUCTION_BY_AGGRESSORS[1] ?? 0)} → ${pct(BRAWLER_MAX_REDUCTION)}`,
        detail: "1 → 5+ attackers",
        help: `Incoming damage is reduced by ${BRAWLER_REDUCTION_BY_AGGRESSORS.slice(1)
          .map((v) => pct(v))
          .join(" / ")} against 1 / 2 / 3 / 4 / 5+ monsters currently aggroed onto you. Capped at ${pct(
          BRAWLER_MAX_REDUCTION,
        )}.`,
      },
    ],
    icon: "brawler-stance",
  },
  {
    id: "execute-stance",
    name: "Execute Stance",
    blurb: "-20% Attack. Deal 75% more damage to targets at or below 25% HP.",
    runeCost: 3,
    modifiers: { attackPct: -0.2 },
    behaviors: [
      {
        key: "execute-finisher",
        label: "Finisher",
        value: `+${pct(EXECUTE_BONUS)} damage`,
        detail: `target at or below ${pct(EXECUTE_HP_THRESHOLD)} HP`,
        help: "Applies to every hit on a target already at or below the threshold. It does not trigger on the hit that brings them there.",
      },
    ],
    icon: "execute-stance",
  },
];

export const STANCE_DATABASE = new Map<string, StanceDef>(stances.map((s) => [s.id, s]));

export function stanceDef(id: string | null | undefined): StanceDef | undefined {
  return id ? STANCE_DATABASE.get(id) : undefined;
}

/**
 * Multiplier on damage the player takes while `stanceId` is the active posture.
 * 1 when the stance has no incoming-damage clause, so callers can multiply blind.
 */
export function stanceDamageTakenMult(stanceId: string | null | undefined): number {
  const pctChange = stanceDef(stanceId)?.modifiers?.damageTakenPct ?? 0;
  return Math.max(0, 1 + pctChange);
}

export function validStanceIds(ids: readonly string[]): string[] {
  return [...new Set(ids.filter((id) => STANCE_DATABASE.has(id)))];
}
