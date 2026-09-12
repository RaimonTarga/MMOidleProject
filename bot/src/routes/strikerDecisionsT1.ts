import type { RouteStep } from "../route/types";
import { STRIKER_T1 } from "./strikerT1";

// Opt-in experimental route. Existing baseline IDs and controlled cohorts stay unchanged.
const firstBoss = STRIKER_T1.steps.findIndex(step => step.type === "attemptBoss");
if (firstBoss < 0) throw new Error("Striker decision route requires a boss boundary");
const deferred: RouteStep[] = [];
const steps: RouteStep[] = [];
for (const [index, step] of STRIKER_T1.steps.entries()) {
  if (index < firstBoss && step.type === "upgrade") {
    const choice = { id: "boss-preparation", defaultOption: "prepared" };
    steps.push({ ...step, choice: { ...choice, option: "prepared" } });
    deferred.push({ ...step, choice: { ...choice, option: "early" }, label: `Deferred: ${step.label ?? `upgrade ${step.definitionId}`}` });
  } else if (step.type === "equip" && index > firstBoss) {
    // These are boss-specific gear swaps after all progression equipment has been acquired.
    steps.push({ ...step, choice: { id: "gear-adoption", option: "replace", defaultOption: "replace" } });
  } else steps.push(step);
  if (index === firstBoss) steps.push(...deferred);
}
if (!deferred.length) throw new Error("Striker decision route requires pre-boss upgrades");
steps.unshift({ type: "milestone", id: "decision:keep-boss-gear", choice: { id: "gear-adoption", option: "keep", defaultOption: "replace" } });

export const STRIKER_DECISIONS_T1 = {
  ...STRIKER_T1, id: "striker-decisions-t1", version: "1.0.0", steps,
  description: "Opt-in player decisions: upgrades before or after the first boss attempt; keep the first boss kit or perform later boss gear swaps. All other baseline preparation remains authored.",
};
