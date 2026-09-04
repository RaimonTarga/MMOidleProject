import { ROUTES } from "../routes";
import type { RouteStep } from "../route/types";

/**
 * Print one Tier-2 route's full step list, so the authored plan can be read
 * end to end instead of inferred from the builder.
 *
 * `pnpm bot:t2-plan [routeId]` (default `striker-t2-mid`)
 */
const routeId = process.argv[2] ?? "striker-t2-mid";
const route = ROUTES.get(routeId);
if (!route) {
  console.error(`unknown route "${routeId}"`);
  process.exit(1);
}

console.log(`# ${route.id} (v${route.version})\n`);
console.log(`${route.description}\n`);

function label(step: RouteStep, depth: number): void {
  const pad = "  ".repeat(depth);
  const name =
    step.label ??
    (step.type === "milestone" ? `milestone:${step.id}` : step.type);
  console.log(`${pad}${step.type.padEnd(16)} ${name}`);
  if (step.type === "repeatUntil" || step.type === "ifPossible") {
    for (const inner of step.steps) label(inner, depth + 1);
  }
}

route.steps.forEach((step) => label(step, 0));
console.log(`\n${route.steps.length} top-level steps`);
