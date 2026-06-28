import { BIOME_DATABASE } from "../biomeDatabase";
import { NODE_BIOMES } from "../world/nodeBiomes";
import type { Vec2 } from "../systems/spatial";

export { GRAVE_FRAME_COUNT } from "../components/combat/isDead";

/** Killer snapshot — stable even if the monster entity is despawned mid-tick. */
export interface DeathKiller {
  monsterEntityId?: string;
  monsterTypeId: string;
  monsterName: string;
  isBoss: boolean;
  nodeId: string;
}

export type DeathCause =
  | { kind: "melee"; killer: DeathKiller; damage: number }
  | { kind: "ranged"; killer: DeathKiller; damage: number }
  | { kind: "dot"; killer: DeathKiller; damage: number; stacks: number }
  | { kind: "aoe"; killer: DeathKiller; damage: number }
  | { kind: "debt"; damage: number; nodeId: string; killer?: DeathKiller };

export interface PlayerDeathPayload {
  cause: DeathCause;
  diedAtNodeId: string;
  graveFrame: number;
  deathPos: Vec2;
}

export function formatDeathCauseLabel(cause: DeathCause): string {
  switch (cause.kind) {
    case "melee":
      return "Melee attack";
    case "ranged":
      return "Ranged attack";
    case "dot":
      return "Poison DoT";
    case "aoe":
      return "Area damage";
    case "debt":
      return "Damage over time";
  }
}

/** "Forest · T1 · [3, 6]" — biome name, tier badge, and map grid cell. */
export function formatDeathLocation(diedAtNodeId: string): string {
  const parts = diedAtNodeId.split("-");
  const gridLabel =
    parts.length === 3 && parts[0] === "node"
      ? `[${parts[1]}, ${parts[2]}]`
      : diedAtNodeId;

  const info = NODE_BIOMES[diedAtNodeId];
  if (!info) return gridLabel;

  const biomeName =
    BIOME_DATABASE.get(info.biomeGroup)?.name ?? info.biomeGroup;
  const tierLabel = info.biomeTier === 0 ? "★" : `T${info.biomeTier}`;
  return `${biomeName} · ${tierLabel} · ${gridLabel}`;
}

export function formatDeathLogMessage(payload: PlayerDeathPayload): string {
  const { cause } = payload;
  if (cause.kind === "debt" && !cause.killer) {
    return "You were defeated by accumulated damage";
  }
  const killer = cause.kind === "debt" ? cause.killer! : cause.killer;
  const label = formatDeathCauseLabel(cause);
  return `Slain by ${killer.monsterName} (${label})`;
}
