import type { TransitHop, TransitPlan } from "./transitPlanner";

export interface TransitExecutionDeps {
  acquireProtectedCrossing: (hop: TransitHop) => Promise<void>;
  navigateAndConfirmArrival: (hop: TransitHop) => Promise<void>;
}

/**
 * Executes the exact hops chosen by `planTransit`. It owns no permits itself:
 * the session releases a protected crossing only after the next authoritative
 * hop observes departure, keeping ownership lifetime separate from planning.
 */
export class TransitExecutor {
  constructor(private readonly deps: TransitExecutionDeps) {}

  async execute(plan: TransitPlan): Promise<void> {
    for (const hop of plan.hops) {
      if (hop.classification === "temporarily-blocked" || hop.classification === "unsafe") {
        throw new Error(`transit plan contains non-executable ${hop.classification} hop ${hop.fromNodeId} -> ${hop.toNodeId}`);
      }
      if (hop.classification === "protected-crossing") {
        await this.deps.acquireProtectedCrossing(hop);
      }
      await this.deps.navigateAndConfirmArrival(hop);
    }
  }
}
