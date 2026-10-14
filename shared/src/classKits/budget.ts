/**
 * The class budget: each class's room, grown by Global Mastery in steps (bible §2, §3).
 *
 * Global Mastery is the sum of every biome level (`globalMastery` in gameConfig), so it
 * tops out at 30 / 72 / 114 / 156 by the end of T1 / T2 / T3 / T4. The standard steps put
 * two inside T1 (the bible's illustrative "4 → 5 at Mastery 15 → 6 at 30") and three inside
 * each later tier, so a T1 Conduit goes Command 4 → 6 and a T2 one 6 → 9 (§7.2).
 * PLACEHOLDERS: the bots and the designer tune every step.
 */
import type { BudgetDef, BudgetStep } from './types';

/** Global Mastery at which a standard budget grows by one. */
export const STANDARD_MASTERY_STEPS: readonly number[] = [15, 30, 44, 58, 72, 86, 100, 114, 128, 142, 156];

/** A budget that starts at `start` and grows by one at every standard step. */
export function standardBudgetSteps(start: number): BudgetStep[] {
  return [
    { mastery: 0, value: start },
    ...STANDARD_MASTERY_STEPS.map((mastery, i) => ({ mastery, value: start + i + 1 })),
  ];
}

export interface BudgetReading {
  label: string;
  value: number;
  /** The Global Mastery of the next step, or null at the last one. */
  nextAt: number | null;
  /** "Command 5, next at Mastery 30": the class's own words, never "Global Mastery 38". */
  text: string;
}

export function readBudget(budget: BudgetDef, globalMasteryValue: number): BudgetReading {
  let index = 0;
  for (let i = 0; i < budget.steps.length; i += 1) {
    if (budget.steps[i].mastery <= globalMasteryValue) index = i;
  }
  const value = budget.steps[index].value;
  const nextAt = budget.steps[index + 1]?.mastery ?? null;
  const shown = budget.describe ? budget.describe(value) : String(value);
  const text = nextAt === null
    ? `${budget.label} ${shown}`
    : `${budget.label} ${shown}, next at Mastery ${nextAt}`;
  return { label: budget.label, value, nextAt, text };
}
