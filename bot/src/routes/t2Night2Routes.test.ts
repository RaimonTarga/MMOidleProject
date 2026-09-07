import {
  T2_NIGHT2_FRAME_ROUTES,
  T2_NIGHT2_REPEAT_ROUTES,
  T2_NIGHT2_SYSTEM_ROUTES,
  T2_NIGHT2_WEAPON_ROUTES,
} from "./t2Night2Routes";
import { T2_PROGRESSION_ROUTES } from "./t2RouteBuilder";
import { T2_PROGRESSION_ORDER } from "./t2Common";
import type { Route, RouteStep } from "../route/types";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`assertion failed: ${message}`);
}

function flatten(steps: readonly RouteStep[]): RouteStep[] {
  const out: RouteStep[] = [];
  for (const step of steps) {
    out.push(step);
    if (step.type === "repeatUntil" || step.type === "ifPossible") out.push(...flatten(step.steps));
  }
  return out;
}

const allNight2 = [
  ...T2_NIGHT2_FRAME_ROUTES,
  ...T2_NIGHT2_WEAPON_ROUTES,
  ...T2_NIGHT2_SYSTEM_ROUTES,
  ...T2_NIGHT2_REPEAT_ROUTES,
];
assert(allNight2.length === 25, "Night 2 exploratory registry has 25 routes");
assert(new Set(allNight2.map((route) => route.id)).size === allNight2.length, "Night 2 route ids are unique");
assert(T2_NIGHT2_FRAME_ROUTES.length === 12, "Wave B has two non-Balanced frames per class");
assert(T2_NIGHT2_WEAPON_ROUTES.length === 6, "Wave C has one weapon challenger per class");
assert(T2_NIGHT2_SYSTEM_ROUTES.length === 6, "Wave D has six targeted system arms");
assert(T2_NIGHT2_REPEAT_ROUTES.length === 1, "Wave D includes one equivalent repeat control");

for (const route of [...T2_PROGRESSION_ROUTES, ...allNight2] as readonly Route[]) {
  assert(route.startsFromTierEntry === 2, `${route.id}: starts from a T2 entry profile`);
  assert(
    route.completion.type === "globalMasteryAtLeast",
    `${route.id}: bossless route completes on mastery, not tier or boss clears`,
  );
  const steps = flatten(route.steps);
  assert(
    steps.every((step) => step.type !== "attemptBoss"),
    `${route.id}: exploratory progression remains bossless`,
  );
  const visited = steps
    .filter((step): step is Extract<RouteStep, { type: "travel" }> => step.type === "travel")
    .map((step) => (step.to.kind === "biome" ? step.to.biomeGroup : null));
  assert(
    JSON.stringify(visited) === JSON.stringify([...T2_PROGRESSION_ORDER]),
    `${route.id}: preserves the controlled biome spine`,
  );
  for (const step of steps) {
    if (step.type === "unequip") {
      assert(step.expectedDefinitionId, `${route.id}: every planned unequip names its predecessor`);
    }
  }
}

for (const route of T2_NIGHT2_FRAME_ROUTES) {
  assert(route.frameId?.endsWith("-light") || route.frameId?.endsWith("-heavy"), `${route.id}: declares a Light/Heavy frame`);
}

for (const id of ["apprentice-t2-jungle-contagion", "slinger-t2-jungle-contagion-venom"]) {
  const route = allNight2.find((candidate) => candidate.id === id)!;
  const steps = flatten(route.steps);
  const learned = steps.find(
    (step): step is Extract<RouteStep, { type: "learnAbility" }> =>
      step.type === "learnAbility" && step.abilityId === "contagion",
  );
  const slotted = steps.find(
    (step): step is Extract<RouteStep, { type: "setAbilities" }> =>
      step.type === "setAbilities" && step.techniques.includes("contagion"),
  );
  assert(learned && slotted, `${id}: Contagion is learned and later slotted`);
  assert(steps.indexOf(learned) < steps.indexOf(slotted), `${id}: Contagion is learned before use`);
}

console.log("t2Night2Routes.test.ts: ok");
