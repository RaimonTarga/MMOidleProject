/**
 * Abilities catalog (system rework Step 7).
 *
 * The active-ability system, distinct from the passive talent tree (`UsesSkills`).
 * Two slots: a **Technique** (offensive, enemy-facing — arms/modifies the next
 * attack) and a **Guard** (defensive, self-facing — an immediate reaction).
 * Mobility is a TAG on an ability, never a slot.
 *
 * State (the learned pool + equipped slots) lives on `TracksProgression`, exactly
 * like runes — abilities are build/loadout data, not a recalculated component.
 * Firing behavior lives in `server/src/systems/player/abilities/`.
 */

export type AbilitySlot = "technique" | "guard";

/** Behavioral tags. Mobility is a tag, not a slot. Grows as content lands. */
export type AbilityTag = "mobility";

/**
 * Built-in auto-fire trigger (the default heuristic). Abilities fire on this with
 * zero runes equipped. A `fire-technique` / `fire-guard` rune action overrides the
 * timing for its slot — when a rune drives the slot, this trigger is ignored.
 */
export type AbilityTrigger =
  /** Technique: arm whenever in combat with a live target (and off cooldown). */
  | { kind: "in-combat" }
  /** Guard: fire when HP fraction is at/below `hpPct` (0..1) and off cooldown. */
  | { kind: "hp-below"; hpPct: number }
  /** Guard: fire when `count`+ enemies are aggroed onto the player (off cooldown). */
  | { kind: "n-aggro"; count: number };

/**
 * What an ability does when it fires. Deliberately narrow for v1 — extend the
 * union as content lands, don't over-generalize up front.
 * - `cleave`: Technique rider — the armed next attack splashes to nearby enemies.
 * - `damage-reduction`: Guard immediate — an EXPLICIT BUFF (shows in the buff bar,
 *   {@link ABILITY_GUARD_EFFECT_ID}) granting `drPct` damage reduction for `durationMs`.
 */
export type AbilityEffectSpec =
  | { kind: "cleave"; splashPct: number; radius: number }
  | { kind: "damage-reduction"; drPct: number; durationMs: number };

/**
 * Status-effect id for the active Guard-ability buff (system rework Step 7). One
 * Guard slot ⇒ at most one active. The server applies it (with `totalMs`/`drPct`
 * in data), an onDamageTaken listener reads it, and a buff descriptor projects it
 * to the buff bar (label/color from the equipped ability). Doubles as the buff id.
 */
export const ABILITY_GUARD_EFFECT_ID = "ability-guard";

export interface AbilityDef {
  id: string;
  name: string;
  slot: AbilitySlot;
  tags: AbilityTag[];
  blurb: string;
  /** Min ms between fires (per-ability cooldown, tracked on TracksCombat). */
  cooldownMs: number;
  /** Built-in auto-fire heuristic (runes can override per slot). */
  trigger: AbilityTrigger;
  /** Effect applied on fire — Technique rider (on hit) or Guard immediate. */
  effect: AbilityEffectSpec;
  icon?: string;
}

/** Equipped abilities by slot. Lives on `TracksProgression`, like `runesEquipped`. */
export interface EquippedAbilities {
  technique: string | null;
  guard: string | null;
}

export function emptyEquippedAbilities(): EquippedAbilities {
  return { technique: null, guard: null };
}

// ── Worked content (Step 7): one Technique + one Guard. ──────────────────────
// Numbers (cooldowns, thresholds, magnitudes) are PLACEHOLDERS — user balance pass.
const abilities: AbilityDef[] = [
  {
    id: "sweep",
    name: "Sweep",
    slot: "technique",
    tags: [],
    blurb: "Arms your next attack to cleave nearby enemies.",
    cooldownMs: 4000,
    trigger: { kind: "in-combat" },
    effect: { kind: "cleave", splashPct: 0.6, radius: 90 },
    icon: "sweep",
  },
  {
    id: "brace",
    name: "Brace",
    slot: "guard",
    tags: [],
    blurb: "Brace for impact — reduce incoming damage when under heavy pressure.",
    cooldownMs: 8000,
    trigger: { kind: "hp-below", hpPct: 0.5 },
    effect: { kind: "damage-reduction", drPct: 0.4, durationMs: 5000 },
    icon: "brace",
  },
];

export const ABILITY_DATABASE = new Map<string, AbilityDef>(
  abilities.map((a) => [a.id, a]),
);

export function abilityDef(id: string | null | undefined): AbilityDef | undefined {
  return id ? ABILITY_DATABASE.get(id) : undefined;
}

/** All known-ability ids that resolve to a real def (filters stale/removed ids). */
export function validAbilityIds(ids: readonly string[]): string[] {
  return ids.filter((id) => ABILITY_DATABASE.has(id));
}
