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
  | { kind: "n-aggro"; count: number }
  /** Guard: fire when the player carries a harmful debuff/DoT (and off cooldown). */
  | { kind: "has-debuff" };

/**
 * What an ability does when it fires. Deliberately narrow for v1 — extend the
 * union as content lands, don't over-generalize up front.
 * - `cleave`: Technique rider — the armed next attack splashes to nearby enemies.
 * - `empower`: Technique rider — the armed next attack hits one target for
 *   `damageMult`× damage (single-target burst; no splash).
 * - `damage-reduction`: Guard immediate — an EXPLICIT BUFF (shows in the buff bar,
 *   {@link ABILITY_GUARD_EFFECT_ID}) granting `drPct` damage reduction for `durationMs`.
 *   `knockbackResistPct`, when present, reduces incoming knockback distance.
 * - `cleanse`: Guard immediate — strips up to `stacks` from each harmful debuff/DoT
 *   on the player. When `drPct`/`durationMs` are set, also grants a short
 *   damage-reduction guard buff (post-cleanse resilience), reusing the same buff.
 * - `heal`: Guard heal-over-time — recover `healPct` of max HP over `durationMs`
 *   (antiheal applies), a cooldown sustain button.
 */
export type AbilityEffectSpec =
  | { kind: "cleave"; splashPct: number; radius: number }
  | { kind: "empower"; damageMult: number }
  | { kind: "expose-weakness"; damageTakenPct: number; durationMs: number }
  | { kind: "damage-reduction"; drPct: number; durationMs: number; knockbackResistPct?: number }
  | { kind: "cleanse"; stacks: number; drPct?: number; durationMs?: number }
  | { kind: "heal"; healPct: number; durationMs?: number };

/**
 * Status-effect id for the active Guard-ability buff (system rework Step 7). One
 * Guard slot ⇒ at most one active. The server applies it (with `totalMs`/`drPct`
 * in data), an onDamageTaken listener reads it, and a buff descriptor projects it
 * to the buff bar (label/color from the equipped ability). Doubles as the buff id.
 */
export const ABILITY_GUARD_EFFECT_ID = "ability-guard";
export const ABILITY_SECOND_WIND_EFFECT_ID = "ability-second-wind";

/**
 * Client-effect tag (system rework Step 7) emitted on a `player-hit` event when a
 * Sweep Technique lands, so the client overlays a horizontal cleave slash on top
 * of the normal attack FX and pulses the Technique HUD icon. Shared so the server
 * (which stamps `ctx.metadata.clientEffects`) and the client FX dispatcher agree
 * on the string. Add a sibling constant per Technique as more FX-bearing
 * techniques land.
 */
export const ABILITY_SWEEP_FX = "ability-sweep";

export const EXPOSE_WEAKNESS_EFFECT_ID = "expose-weakness";

/**
 * Client-effect tag for a landed Expose Weakness Technique. The client overlays
 * a targeting/impact cue on the normal attack FX and pulses the Technique HUD
 * icon. Sibling of {@link ABILITY_SWEEP_FX}.
 */
export const ABILITY_EXPOSE_WEAKNESS_FX = "ability-expose-weakness";

/**
 * Generic client-effect tag for Techniques that do not need bespoke in-world FX.
 * The client uses it to pulse the Technique HUD icon and start the cooldown sweep.
 */
export const ABILITY_TECHNIQUE_FIRED_FX = "ability-technique-fired";

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
    cooldownMs: 7000,
    trigger: { kind: "hp-below", hpPct: 0.5 },
    effect: { kind: "damage-reduction", drPct: 0.4, durationMs: 3000, knockbackResistPct: 0.55 },
    icon: "brace",
  },
  // ── Step 7 follow-up: rough T1 per-biome abilities (placeholder numbers). ──
  {
    id: "cleanse",
    name: "Cleanse",
    slot: "guard",
    tags: [],
    blurb: "Purge rot and debuffs, then steel yourself briefly against further harm.",
    cooldownMs: 9000,
    trigger: { kind: "has-debuff" },
    effect: { kind: "cleanse", stacks: 3, drPct: 0.2, durationMs: 3000 },
    icon: "cleanse",
  },
  {
    id: "heavy-strike",
    name: "Expose Weakness",
    slot: "technique",
    tags: [],
    blurb: "Arms your next attack to expose the target, increasing all damage it takes.",
    cooldownMs: 12000,
    trigger: { kind: "in-combat" },
    effect: { kind: "expose-weakness", damageTakenPct: 0.2, durationMs: 4000 },
    icon: "expose-weakness",
  },
  {
    id: "second-wind",
    name: "Second Wind",
    slot: "guard",
    tags: [],
    blurb: "Catch your breath and recover health over a few seconds.",
    cooldownMs: 12000,
    trigger: { kind: "in-combat" },
    effect: { kind: "heal", healPct: 0.3, durationMs: 4000 },
    icon: "second-wind",
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
