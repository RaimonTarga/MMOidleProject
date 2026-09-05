import { CLEARING_NODE_ID, NODE_BIOMES, worldNodeExits } from "@mmo-idle/shared";
import type { ReservationSnapshot } from "./areaLeaseManager";

export type TransitClassification =
  | "safe-pass"
  | "protected-crossing"
  | "temporarily-blocked"
  | "unsafe";

export interface TransitHop {
  fromNodeId: string;
  toNodeId: string;
  classification: TransitClassification;
  reasons: string[];
}

export interface TransitPlan {
  fromNodeId: string;
  destinationNodeId: string;
  hops: TransitHop[];
  totalCost: number;
  rejectedAlternatives: Array<{ destinationNodeId: string; reason: string }>;
}

export interface TransitPlannerInput {
  fromNodeId: string;
  destinationNodeId: string;
  ownerId: string;
  reservations: ReservationSnapshot;
  /**
   * The normal search avoids foreign-exclusive nodes. When every safe route is
   * temporarily closed, the executor may request a second search that exposes
   * those nodes as protected crossings so the lease session can wait (or use
   * its explicit shared fallback) instead of failing before entering the queue.
   */
  allowForeignExclusive?: boolean;
  /** Edges where this bot already died during the current transit span. */
  deadEdges?: ReadonlySet<string>;
}

const edgeKey = (fromNodeId: string, toNodeId: string): string => `${fromNodeId}->${toNodeId}`;

/**
 * Deterministic weighted graph search. It deliberately treats every hostile
 * intermediate node as a protected crossing until observed survivability data
 * can justify a narrower classification.
 */
export function planTransit(input: TransitPlannerInput): TransitPlan | null {
  if (!NODE_BIOMES[input.fromNodeId] || !NODE_BIOMES[input.destinationNodeId]) return null;
  const distances = new Map<string, number>([[input.fromNodeId, 0]]);
  const previous = new Map<string, TransitHop>();
  const queue = [input.fromNodeId];

  while (queue.length > 0) {
    queue.sort((a, b) => (distances.get(a)! - distances.get(b)!) || a.localeCompare(b));
    const current = queue.shift()!;
    if (current === input.destinationNodeId) break;
    for (const next of Object.values(worldNodeExits(current)).filter((nodeId): nodeId is string => !!nodeId)) {
      const hop = classifyHop(current, next, input);
      if (hop.classification === "temporarily-blocked" || hop.classification === "unsafe") continue;
      const cost = distances.get(current)! + (hop.classification === "protected-crossing" ? 10 : 1);
      if (cost >= (distances.get(next) ?? Number.POSITIVE_INFINITY)) continue;
      distances.set(next, cost);
      previous.set(next, hop);
      if (!queue.includes(next)) queue.push(next);
    }
  }

  const totalCost = distances.get(input.destinationNodeId);
  if (totalCost === undefined) return null;
  const hops: TransitHop[] = [];
  for (let cursor = input.destinationNodeId; cursor !== input.fromNodeId;) {
    const hop = previous.get(cursor);
    if (!hop) return null;
    hops.push(hop);
    cursor = hop.fromNodeId;
  }
  hops.reverse();
  return {
    fromNodeId: input.fromNodeId,
    destinationNodeId: input.destinationNodeId,
    hops,
    totalCost,
    rejectedAlternatives: [],
  };
}

function classifyHop(fromNodeId: string, toNodeId: string, input: TransitPlannerInput): TransitHop {
  const reasons: string[] = [];
  const admission = input.reservations.admissionsByNode[toNodeId];
  if (admission?.kind === "exclusive" && admission.permit.ownerId !== input.ownerId) {
    if (!input.allowForeignExclusive) {
      return { fromNodeId, toNodeId, classification: "temporarily-blocked", reasons: ["foreign-exclusive-reservation"] };
    }
    return {
      fromNodeId,
      toNodeId,
      classification: "protected-crossing",
      reasons: ["foreign-exclusive-reservation", "lease-session-will-wait-or-degrade"],
    };
  }
  if (input.deadEdges?.has(edgeKey(fromNodeId, toNodeId))) {
    return { fromNodeId, toNodeId, classification: "unsafe", reasons: ["prior-death-on-edge"] };
  }
  if (toNodeId === CLEARING_NODE_ID || NODE_BIOMES[toNodeId]?.kind === "sanctuary") {
    reasons.push("non-hostile-passage");
    return { fromNodeId, toNodeId, classification: "safe-pass", reasons };
  }
  if (toNodeId === input.destinationNodeId) {
    return { fromNodeId, toNodeId, classification: "safe-pass", reasons: ["destination-entry"] };
  }
  reasons.push("hostile-intermediate-requires-protection");
  return { fromNodeId, toNodeId, classification: "protected-crossing", reasons };
}
