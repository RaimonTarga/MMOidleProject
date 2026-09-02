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
 * An HP gate on the UPSIDE half of a posture, and the ONE sanctioned exception to
 * "Runes own conditions, the stance owns the posture".
 *
 * A Rune condition decides WHEN you enter a stance. This decides whether the stance's
 * bonuses are DOING anything once you are in it, which is a different question and one
 * a Rune cannot answer: `HP Above 90% -> Perfection` would enter the posture at 91% and
 * keep it at 40% (the rule stops holding, so the player merely reverts to their default
 * on the next reconciliation — with the destination's bonuses live the whole way down).
 *
 * Reserved for postures whose intrinsic identity is a maintained state, alongside
 * Execute's target-HP window, Brawler's aggressor count and Predator's out-of-combat
 * arming. Do NOT use it to spare a player from authoring a Rune rule.
 *
 * The gated half is the payoff only. Whatever the posture pays for it lives in
 * {@link StanceDef.modifiers} and stays active on both sides of the threshold — falling
 * out of the gate must be a real loss, not a free return to neutral.
 */
export interface StanceHpGate {
  /** Player HP fraction at or above which {@link modifiers} applies. 0.9 → 90%. */
  minHpPct: number;
  modifiers: StanceModifiers;
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
  /**
   * The upside half of a posture whose identity IS a maintained condition. Applies
   * only while the gate holds; {@link modifiers} applies unconditionally. See
   * {@link StanceHpGate}.
   */
  gatedModifiers?: StanceHpGate;
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
/** Perfection: player HP fraction at or above which its upside half functions. */
export const PERFECTION_HP_THRESHOLD = 0.9;
/** Execute: target HP fraction at or below which the finisher bonus applies. */
export const EXECUTE_HP_THRESHOLD = 0.25;
export const EXECUTE_BONUS = 0.75;
/** Recuperating: fraction of the player's Recovery rate that stays active in combat. */
export const RECUPERATING_RECOVERY_ACTIVE = 0.8;

// ── Postures added 2026-09-02 (unplaced: no recipes yet) ──────────────────────
// These four exist in the catalog and are fully implemented server-side, but no
// stance recipe names them, so no character can learn them yet. See
// `docs/stances-future-design-notes.md` for the design rationale, and
// `shared/src/stanceRecipes.ts` when placing them.

/** Time to Strike: added to the empowered-attack multiplier (1.0 → a 2x spec fires at 3x). */
export const TIME_TO_STRIKE_EMPOWERED_ADD = 1;
/** Time to Strike: fraction removed from every NON-empowered hit. */
export const TIME_TO_STRIKE_NORMAL_PENALTY = 0.4;

/** Reaper: how long the on-kill momentum window lasts. Refreshed, never stacked. */
export const REAPER_MOMENTUM_MS = 6000;
/** Reaper: momentum damage bonus (0.35 → +35% on every hit while it holds). */
export const REAPER_MOMENTUM_ATTACK_PCT = 0.35;
/** Reaper: momentum attack-speed bonus, applied at the attack-cadence gate. */
export const REAPER_MOMENTUM_ATTACK_SPEED_PCT = 0.25;

/** Warding: fraction removed from the DURATION of incoming harmful statuses. */
export const WARDING_DURATION_RESIST = 0.5;
/** Warding: fraction removed from the POTENCY (per-stack damage) of incoming DoTs. */
export const WARDING_POTENCY_RESIST = 0.4;

/** Powering Up: charge ceiling, in milliseconds of in-combat charging. */
export const POWERING_UP_MAX_CHARGE_MS = 8000;
/** Powering Up: charge below this is not worth a release window and is discarded. */
export const POWERING_UP_MIN_RELEASE_MS = 1000;
/** Powering Up: release-window damage bonus. */
export const POWERING_UP_RELEASE_ATTACK_PCT = 0.5;
/** Powering Up: release-window attack-speed bonus, applied at the cadence gate. */
export const POWERING_UP_RELEASE_ATTACK_SPEED_PCT = 0.3;

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
    // The one gated posture. The -20% Plating is the price of holding it and is paid
    // at every HP; the bonuses are the reward for not being hit. Dropping below the
    // threshold is therefore meant to be actively bad, so leaving is a real decision
    // rather than a formality. See {@link StanceHpGate}.
    blurb: `+12% Attack, Attack Speed, and Movement Speed while at or above ${pct(
      PERFECTION_HP_THRESHOLD,
    )} HP. -20% Plating at all times.`,
    runeCost: 2,
    modifiers: { platingPct: -0.2 },
    gatedModifiers: {
      minHpPct: PERFECTION_HP_THRESHOLD,
      modifiers: { attackPct: 0.12, attackSpeedPct: 0.12, moveSpeedPct: 0.12 },
    },
    behaviors: [
      {
        key: "perfection-gate",
        label: "Bonuses require",
        value: `${pct(PERFECTION_HP_THRESHOLD)} HP or above`,
        help: `Attack, Attack Speed and Movement Speed are granted only while your HP is at or above ${pct(
          PERFECTION_HP_THRESHOLD,
        )} of maximum. Cross the line in either direction and they turn off or back on within a tick.`,
      },
      {
        key: "perfection-gate-drawback",
        label: "Plating penalty",
        value: "always active",
        help: `The -20% Plating is paid whenever the stance is active, including below ${pct(
          PERFECTION_HP_THRESHOLD,
        )} HP where the bonuses are off. Once you drop, Perfection is strictly worse than no stance at all — leave it.`,
        good: false,
      },
    ],
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

  // ── Unplaced postures (2026-09-02) ─────────────────────────────────────────
  // Implemented and legal as Rune destinations the moment a recipe teaches them;
  // until one does, `knownStances` can never contain them, so they are inert.
  // Magnitudes are seeds. Design rationale: docs/stances-future-design-notes.md.
  {
    id: "time-to-strike-stance",
    name: "Time to Strike",
    // The Attack Speed penalty is load-bearing, not flavour: it is what keeps this
    // from being a free upgrade for fast empowered-generating builds. A spec that
    // fires an empowered hit every few seconds pays the penalty on every filler
    // swing in between; a slow, heavy spec pays it once per big beat.
    blurb: `+${pct(TIME_TO_STRIKE_EMPOWERED_ADD)} empowered-attack damage. Ordinary hits deal ${pct(
      TIME_TO_STRIKE_NORMAL_PENALTY,
    )} less damage and you attack ${pct(0.35)} slower.`,
    runeCost: 3,
    modifiers: { attackSpeedPct: -0.35 },
    // Rides the pre-existing universal empowered bonus, so every archetype's
    // empowered attack (cadence finisher, cooldown burst, energy discharge,
    // reload shot) gains the same amount without the stance knowing about any of them.
    mechanicEffects: { "shared.empowered-mult-add": TIME_TO_STRIKE_EMPOWERED_ADD },
    behaviors: [
      {
        key: "time-to-strike-empowered",
        label: "Empowered damage",
        value: `+${pct(TIME_TO_STRIKE_EMPOWERED_ADD)}`,
        help: "Added to your empowered-attack multiplier, whatever your class's empowered attack is — a finisher, a cooldown burst, a full-energy discharge or a loaded shot.",
      },
      {
        key: "time-to-strike-normal",
        label: "Ordinary hits",
        value: `-${pct(TIME_TO_STRIKE_NORMAL_PENALTY)} damage`,
        help: "Every hit that is NOT empowered is reduced by this much, on top of the attack-speed penalty. The posture is only worth holding around an empowered attack.",
        good: false,
      },
    ],
    icon: "enraged-stance",
  },
  {
    id: "reaper-stance",
    name: "Reaper Stance",
    // The alternative to Execute at the same Rune condition: Execute optimises
    // finishing THIS target (and so, bosses); Reaper converts the kill into
    // momentum against the NEXT one (and so, dense farming).
    blurb: `-15% Attack. Killing an enemy grants +${pct(REAPER_MOMENTUM_ATTACK_PCT)} Attack and +${pct(
      REAPER_MOMENTUM_ATTACK_SPEED_PCT,
    )} Attack Speed for ${(REAPER_MOMENTUM_MS / 1000).toFixed(0)}s, and the momentum keeps running after you leave the stance.`,
    runeCost: 3,
    modifiers: { attackPct: -0.15 },
    behaviors: [
      {
        key: "reaper-momentum",
        label: "Kill momentum",
        value: `+${pct(REAPER_MOMENTUM_ATTACK_PCT)} Attack, +${pct(REAPER_MOMENTUM_ATTACK_SPEED_PCT)} Attack Speed`,
        detail: `${(REAPER_MOMENTUM_MS / 1000).toFixed(0)}s`,
        help: "Armed by any kill you land while Reaper is active. It PERSISTS after you leave the stance, so the intended loop is: enter Reaper for the finish, kill, revert to your default posture, and spend the momentum on the next enemy. Further kills refresh the window only while Reaper is active again — the duration resets, it never stacks higher.",
      },
    ],
    icon: "execute-stance",
  },
  {
    id: "warding-stance",
    name: "Warding Stance",
    // Endure, don't cleanse. Cleansing answers one debuff; this answers a barrage.
    blurb: `Incoming harmful effects last ${pct(WARDING_DURATION_RESIST)} less and enemy damage-over-time hits ${pct(
      WARDING_POTENCY_RESIST,
    )} weaker. -50% Attack and -25% Attack Speed.`,
    runeCost: 3,
    modifiers: { attackPct: -0.5, attackSpeedPct: -0.25 },
    mechanicEffects: {
      "shared.status-duration-resist": WARDING_DURATION_RESIST,
      "shared.status-potency-resist": WARDING_POTENCY_RESIST,
    },
    behaviors: [
      {
        key: "warding-endure",
        label: "Endure, not cleanse",
        value: "shortens, never removes",
        help: "Warding scales what lands rather than deleting it, so it answers layered pressure a single cleanse cannot keep up with. Effects already on you when you enter keep the duration they were given — this applies at the moment a new one is applied.",
      },
    ],
    icon: "tanking-stance",
  },
  {
    id: "powering-up-stance",
    name: "Powering Up",
    // Deliberately NOT "stay here and get stronger" — that is a posture nobody
    // ever leaves. The power is in the release, and the charge is only payable in
    // combat so it can never become free pre-pull preparation.
    blurb: `A weak posture that charges while you fight, up to ${(POWERING_UP_MAX_CHARGE_MS / 1000).toFixed(
      0,
    )}s. Leaving it spends the charge for +${pct(POWERING_UP_RELEASE_ATTACK_PCT)} Attack and +${pct(
      POWERING_UP_RELEASE_ATTACK_SPEED_PCT,
    )} Attack Speed, lasting as long as you charged. -50% Attack and -30% Attack Speed while charging.`,
    runeCost: 4,
    modifiers: { attackPct: -0.5, attackSpeedPct: -0.3 },
    behaviors: [
      {
        key: "powering-up-charge",
        label: "Charge",
        value: `up to ${(POWERING_UP_MAX_CHARGE_MS / 1000).toFixed(0)}s`,
        detail: "in combat only",
        help: "Charge accrues only while the stance is active AND you are in combat, and it is cleared when combat ends. You cannot charge before a pull and arrive loaded.",
        good: false,
      },
      {
        key: "powering-up-release",
        label: "Release",
        value: `+${pct(POWERING_UP_RELEASE_ATTACK_PCT)} Attack, +${pct(POWERING_UP_RELEASE_ATTACK_SPEED_PCT)} Attack Speed`,
        detail: "for as long as you charged",
        help: `Spent automatically the moment you leave the stance, however you leave it. Charge below ${(
          POWERING_UP_MIN_RELEASE_MS / 1000
        ).toFixed(0)}s is discarded rather than paid out. Pair it with the "Stance Charged" Rune situation to leave at full charge on its own.`,
      },
    ],
    icon: "berserker-stance",
  },
];

export const STANCE_DATABASE = new Map<string, StanceDef>(stances.map((s) => [s.id, s]));

export function stanceDef(id: string | null | undefined): StanceDef | undefined {
  return id ? STANCE_DATABASE.get(id) : undefined;
}

/** True while `hpFraction` satisfies the stance's HP gate. False when it has none. */
export function stanceGateMet(
  def: StanceDef | undefined,
  hpFraction: number,
): boolean {
  const gate = def?.gatedModifiers;
  if (!gate) return false;
  return hpFraction >= gate.minHpPct;
}

/**
 * The posture actually in force right now: the unconditional modifiers, plus the
 * gated half when its condition holds. THE ONLY resolver stat code may use — reading
 * `def.modifiers` directly silently drops the conditional half.
 *
 * Overlapping fields add as percentage points, so a stance may split one stat across
 * both halves (a permanent -10% with a further +25% while held) and still describe
 * itself as two rows in the tooltip.
 */
export function activeStanceModifiers(
  stanceId: string | null | undefined,
  hpFraction: number,
): StanceModifiers | undefined {
  const def = stanceDef(stanceId);
  if (!def) return undefined;
  if (!stanceGateMet(def, hpFraction)) return def.modifiers;
  const gated = def.gatedModifiers!.modifiers;
  const base = def.modifiers;
  if (!base) return gated;
  const merged: StanceModifiers = { ...base };
  for (const key of Object.keys(gated) as (keyof StanceModifiers)[]) {
    merged[key] = (merged[key] ?? 0) + (gated[key] ?? 0);
  }
  return merged;
}

/**
 * Multiplier on damage the player takes while `stanceId` is the active posture.
 * 1 when the stance has no incoming-damage clause, so callers can multiply blind.
 *
 * `hpFraction` decides whether a gated posture's conditional half counts; callers
 * that genuinely have no player to hand (pure catalog display) may omit it and get
 * the ungated reading.
 */
export function stanceDamageTakenMult(
  stanceId: string | null | undefined,
  hpFraction = 0,
): number {
  const pctChange = activeStanceModifiers(stanceId, hpFraction)?.damageTakenPct ?? 0;
  return Math.max(0, 1 + pctChange);
}

export function validStanceIds(ids: readonly string[]): string[] {
  return [...new Set(ids.filter((id) => STANCE_DATABASE.has(id)))];
}
