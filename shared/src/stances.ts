/**
 * Stances catalog (system rework Step 10).
 *
 * Stances are persistent combat POSTURES — stat/passive deltas applied while a
 * stance is active. Two slots: a **default** (the player's chosen active posture)
 * and a **reactive** (an RP-costed `switch-stance` rune rule swaps to it while its
 * situation holds, reverting to default otherwise). One posture is active at a time.
 *
 * State (the learned pool + equipped slots + the currently-active posture) lives on
 * `TracksProgression`, exactly like runes and abilities — stances are build/loadout
 * data, not a recalculated component. Switching logic lives in
 * `server/src/systems/player/stances/`; the active stance folds into
 * `recalculatePlayerStats` (a switch triggers a recalc).
 */
import type { StatEffects } from "./data/skillTree/types";
import type { MechanicEffects } from "./passives";

export type StanceSlot = "default" | "reactive";

export interface StanceDef {
  id: string;
  name: string;
  blurb: string;
  /**
   * Stat deltas applied while this stance is active. Reuses the skill-tree
   * `StatEffects` shape so the active-stance fold is a copy of the node loop.
   */
  statEffects?: Partial<StatEffects>;
  /** Passive mechanic-effect deltas applied while active (via `mergePassives`). */
  mechanicEffects?: MechanicEffects;
  icon?: string;
}

/** Equipped stances by slot. Lives on `TracksProgression`, like `runesEquipped`. */
export interface EquippedStances {
  default: string | null;
  reactive: string | null;
}

export function emptyEquippedStances(): EquippedStances {
  return { default: null, reactive: null };
}

// ── Worked content (Step 10): a default/reactive pair + an optional tank. ─────
// Numbers (magnitudes, tradeoffs) are PLACEHOLDERS — user balance pass.
const stances: StanceDef[] = [
  {
    id: "offensive-stance",
    name: "Offensive Stance",
    blurb: "Press the attack — more damage and tempo at the cost of defense.",
    statEffects: { attack: 25, attackSpeedPct: 0.1, damageReduction: -0.05 },
    icon: "offensive-stance",
  },
  {
    id: "defensive-stance",
    name: "Defensive Stance",
    blurb: "Hunker down — reduce incoming damage at the cost of offense.",
    statEffects: { damageReduction: 0.15, plating: 20, attack: -15 },
    icon: "defensive-stance",
  },
  {
    id: "tanking-stance",
    name: "Tanking Stance",
    blurb: "Hold the line — bulk up and shrug off blows, but move and hit slower.",
    statEffects: { maxHp: 200, plating: 30, attack: -10, speed: -20 },
    icon: "tanking-stance",
  },
];

export const STANCE_DATABASE = new Map<string, StanceDef>(
  stances.map((s) => [s.id, s]),
);

export function stanceDef(id: string | null | undefined): StanceDef | undefined {
  return id ? STANCE_DATABASE.get(id) : undefined;
}

/** All known-stance ids that resolve to a real def (filters stale/removed ids). */
export function validStanceIds(ids: readonly string[]): string[] {
  return ids.filter((id) => STANCE_DATABASE.has(id));
}
