/**
 * Rites catalog (system rework Step 11).
 *
 * Rites are T3, OUT-OF-COMBAT / between-fight passive behaviors — they shape the
 * recovery/transition rhythm after a fight ends (OOC regen delay, debuff decay,
 * buff decay, post-kill momentum). Unlike stances they are ALWAYS-ON while equipped:
 * there is no active posture, no rune action, no per-tick reconciler. Every equipped
 * rite folds its `mechanicEffects` into `usesSkills.passives` during
 * `recalculatePlayerStats`; the OOC systems read those `rite.*` keys at runtime.
 *
 * State (the learned pool + equipped slots) lives on `TracksProgression`, exactly
 * like runes / abilities / stances — rites are build/loadout data, not a recalculated
 * component. Crafting logic lives in `server/src/systems/player/economy/riteCrafting.ts`;
 * the OOC readers live in `server/src/systems/player/rites/riteOoc.ts`.
 */
import type { MechanicEffects } from "./passives";

export interface RiteDef {
  id: string;
  name: string;
  blurb: string;
  /**
   * Passive mechanic-effect deltas applied while this rite is equipped (via
   * `mergePassives`). Rites carry ONLY `rite.*` OOC keys — no in-combat `statEffects`.
   */
  mechanicEffects?: MechanicEffects;
  icon?: string;
}

/** Equipped rites: an interchangeable list (no named slots), length ≤ slot count. */
export type EquippedRites = string[];

export function emptyEquippedRites(): EquippedRites {
  return [];
}

/**
 * Number of rite slots available. Stubbed flat at 2 for v1 (system rework Step 11
 * locked decision); the GM parameter exists so "Global Mastery unlocks additional
 * slots" can grow the curve later without re-plumbing callers. The user owns the
 * eventual curve (balance pass, Step 15).
 */
export const RITE_SLOTS_BASE = 2;
export function riteSlotCount(_globalMastery: number): number {
  return RITE_SLOTS_BASE;
}

// ── Worked content (Step 11): the four brainstorm rites. ──────────────────────
// Magnitudes are PLACEHOLDERS — user balance pass (Step 15) owns the numbers.
const rites: RiteDef[] = [
  {
    id: "quickened-breath",
    name: "Quickened Breath",
    blurb: "Catch your breath faster — health regeneration resumes sooner after combat.",
    mechanicEffects: { "rite.ooc-regen-delay-reduction-pct": 0.5 },
    icon: "quickened-breath",
  },
  {
    id: "cleansing-breath",
    name: "Cleansing Breath",
    blurb: "Shake off lingering ailments — debuffs and damage-over-time decay out of combat.",
    mechanicEffects: {
      "rite.ooc-cleanse-stacks": 1,
      "rite.ooc-cleanse-interval-ms": 1000,
    },
    icon: "cleansing-breath",
  },
  {
    id: "lingering-momentum",
    name: "Lingering Momentum",
    blurb: "Ride the high — beneficial buffs fade more slowly once a fight ends.",
    mechanicEffects: { "rite.ooc-buff-decay-slowdown-pct": 0.5 },
    icon: "lingering-momentum",
  },
  {
    id: "hunters-instinct",
    name: "Hunter's Instinct",
    blurb: "Press the hunt — a fresh kill grants a brief burst of speed toward the next target.",
    mechanicEffects: {
      "rite.on-kill-haste-pct": 0.3,
      "rite.on-kill-haste-ms": 2000,
    },
    icon: "hunters-instinct",
  },
];

export const RITE_DATABASE = new Map<string, RiteDef>(rites.map((r) => [r.id, r]));

export function riteDef(id: string | null | undefined): RiteDef | undefined {
  return id ? RITE_DATABASE.get(id) : undefined;
}

/** All known-rite ids that resolve to a real def (filters stale/removed ids). */
export function validRiteIds(ids: readonly string[]): string[] {
  return ids.filter((id) => RITE_DATABASE.has(id));
}
