/**
 * Stances are mutually-exclusive combat postures. A player chooses one free
 * default stance; Rune rules may name any learned stance as an automated
 * destination. The destination's runeCost is paid by each rule that targets it.
 */
import type { StatEffects } from "./data/skillTree/types";
import type { MechanicEffects } from "./passives";

export type StanceSlot = "default";

/** Reserved Rune destination for deliberately dropping every active stance. */
export const NO_STANCE_ID = "no-stance";

export interface StanceDef {
  id: string;
  name: string;
  blurb: string;
  /** RP added to a switch rule that names this stance. The free default pays none. */
  runeCost: number;
  statEffects?: Partial<StatEffects>;
  mechanicEffects?: MechanicEffects;
  icon?: string;
}

export interface EquippedStances {
  default: string | null;
}

export function emptyEquippedStances(): EquippedStances {
  return { default: null };
}

// First-pass values are deliberately centralized here for later balance passes.
const stances: StanceDef[] = [
  {
    id: "offensive-stance",
    name: "Offensive Stance",
    blurb: "Press the attack, gaining damage and tempo at the cost of protection.",
    runeCost: 1,
    statEffects: { attack: 20, attackSpeedPct: 0.08, damageReduction: -0.05 },
    icon: "offensive-stance",
  },
  {
    id: "defensive-stance",
    name: "Defensive Stance",
    blurb: "Trade pressure for a dependable defensive posture.",
    runeCost: 1,
    statEffects: { damageReduction: 0.12, plating: 15, attack: -15 },
    icon: "defensive-stance",
  },
  {
    id: "tanking-stance",
    name: "Tanking Stance",
    blurb: "Become dramatically harder to kill, but deal dramatically less damage.",
    runeCost: 3,
    statEffects: { maxHp: 250, plating: 45, damageReduction: 0.3, attack: -60, attackSpeedPct: -0.25 },
    icon: "tanking-stance",
  },
  {
    id: "enraged-stance",
    name: "Enraged Stance",
    blurb: "Convert a dangerous moment into overwhelming finishing pressure.",
    runeCost: 3,
    statEffects: { attack: 55, attackSpeedPct: 0.18, damageReduction: -0.1 },
    icon: "enraged-stance",
  },
  {
    id: "perfection-stance",
    name: "Perfection Stance",
    blurb: "A restrained efficiency posture for builds that maintain total control.",
    runeCost: 2,
    statEffects: { attack: 16, attackSpeedPct: 0.06 },
    icon: "perfection-stance",
  },
  {
    id: "fleeting-stance",
    name: "Fleeting Stance",
    blurb: "Abandon pressure to evade exposure, reposition, and escape.",
    runeCost: 2,
    statEffects: { speed: 70, evasion: 0.16, attack: -45, attackSpeedPct: -0.15 },
    icon: "fleeting-stance",
  },
  {
    id: "berserker-stance",
    name: "Berserker Stance",
    blurb: "Gain fierce tempo while deterministic self-damage drives you toward death.",
    runeCost: 4,
    statEffects: { attack: 65, attackSpeedPct: 0.25, damageReduction: -0.12 },
    icon: "berserker-stance",
  },
  {
    id: "recuperating-stance",
    name: "Recuperating Stance",
    blurb: "Sacrifice most offensive pressure to recover health during combat.",
    runeCost: 4,
    statEffects: { attack: -65, attackSpeedPct: -0.3, hpRegen: 4 },
    mechanicEffects: { "defense.in-combat-regen-pct": 0.8 },
    icon: "recuperating-stance",
  },
  {
    id: "predator-stance",
    name: "Predator Stance",
    blurb: "Approach unseen and concentrate power into the opening strike.",
    runeCost: 3,
    statEffects: { speed: 25, attack: -10 },
    icon: "predator-stance",
  },
  {
    id: "brawler-stance",
    name: "Brawler Stance",
    blurb: "Gain diminishing protection for each enemy currently engaging you.",
    runeCost: 3,
    statEffects: { attack: -12 },
    icon: "brawler-stance",
  },
  {
    id: "execute-stance",
    name: "Execute Stance",
    blurb: "Lose effectiveness against healthy prey and punish wounded targets.",
    runeCost: 3,
    statEffects: { attack: -25 },
    icon: "execute-stance",
  },
];

export const STANCE_DATABASE = new Map<string, StanceDef>(stances.map((s) => [s.id, s]));

export function stanceDef(id: string | null | undefined): StanceDef | undefined {
  return id ? STANCE_DATABASE.get(id) : undefined;
}

export function validStanceIds(ids: readonly string[]): string[] {
  return [...new Set(ids.filter((id) => STANCE_DATABASE.has(id)))];
}
