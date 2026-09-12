import type { Route, RouteStep } from "../route/types";

export function parseChoices(raw: string | undefined): Record<string, string> {
  const value: unknown = raw === undefined ? {} : JSON.parse(raw);
  if (!value || typeof value !== "object" || Array.isArray(value) ||
      Object.entries(value).some(([k, v]) => !/^[a-z][a-z0-9-]*$/.test(k) || typeof v !== "string" || !/^[a-z][a-z0-9-]*$/.test(v))) {
    throw new Error("choices must be a JSON object of lowercase decision IDs to option IDs");
  }
  return value as Record<string, string>;
}

/** Resolve authored player decisions before execution; never invent alternate steps. */
export function resolveChoices(route: Route, overrides: Record<string, string>, preferences: Record<string, string> = {}) {
  const catalogue = new Map<string, { defaultOption: string; options: Set<string> }>();
  const visit = (steps: RouteStep[]) => {
    for (const step of steps) {
      if (step.choice) {
        const { id, option, defaultOption } = step.choice;
        if (![id, option, defaultOption].every(value => typeof value === "string" && /^[a-z][a-z0-9-]*$/.test(value))) throw new Error("invalid authored choice ID or option");
        const group = catalogue.get(id) ?? { defaultOption, options: new Set<string>() };
        if (group.defaultOption !== defaultOption) throw new Error(`conflicting defaults for choice ${id}`);
        group.options.add(option);
        catalogue.set(id, group);
      }
      if (step.type === "repeatUntil" || step.type === "ifPossible") visit(step.steps);
    }
  };
  visit(route.steps);
  for (const id of Object.keys(overrides)) if (!catalogue.has(id)) throw new Error(`unknown route choice ${id}`);
  for (const id of Object.keys(preferences)) if (!catalogue.has(id)) throw new Error(`profile requires authored route choice ${id}`);
  const selected: Record<string, string> = {};
  for (const [id, group] of catalogue) {
    if (!group.options.has(group.defaultOption)) throw new Error(`missing default option for ${id}`);
    const option = overrides[id] ?? preferences[id] ?? group.defaultOption;
    if (!group.options.has(option)) throw new Error(`unknown option ${id}=${option}`);
    selected[id] = option;
  }
  const filter = (steps: RouteStep[]): RouteStep[] => steps
    .filter(step => !step.choice || selected[step.choice.id] === step.choice.option)
    .map(step => step.type === "repeatUntil" || step.type === "ifPossible"
      ? { ...step, steps: filter(step.steps) } : { ...step });
  return { route: { ...route, steps: filter(route.steps) }, selected };
}
