import type { EquipmentSlot } from '../items';
import type { DeltaSnapshot } from './delta';
import type { NodeTelemetrySnapshot } from './nodeTelemetry';
import type { Vec2 } from '../systems/spatial';

/** Events the server sends to clients */
export interface ServerToClientEvents {
  /** Full component resync sent to a newly connected player */
  'state:sync': (snapshot: DeltaSnapshot) => void;
  /** Component-level authoritative world delta broadcast every server tick. */
  'node:delta': (snapshot: DeltaSnapshot) => void;
  /** Immediate result of a crafting attempt — success or reason for failure. */
  'crafting:result': (result: { success: boolean; reason?: string }) => void;
  /** Sent to a player whose HP reached zero — they are simultaneously respawned server-side. */
  'player:died': () => void;
  /** Sent when a player unlocks a skill and advances to the next tier. */
  'player:ascended': (tier: number) => void;
  /** Per-node server telemetry snapshot (CPU, memory proxies, leak heuristics). */
  'world:telemetry': (snapshot: NodeTelemetrySnapshot) => void;
  /** Sent before a cold-start thaw of a frozen node (loading overlay on client). */
  'node:preparing': (payload: { nodeId: string }) => void;
}

/** Events clients send to the server */
export interface ClientToServerEvents {
  /** Set the player's movement destination (click-to-move or AI-issued). */
  'player:move': (pos: Vec2) => void;
  /** Enable or disable server-side auto-targeting for this player. */
  'player:setAuto': (enabled: boolean) => void;
  /** Enable or disable server-side auto-traverse when auto-combat is on. */
  'player:setAutoTraverse': (enabled: boolean) => void;
  /** Request a fresh authoritative full snapshot for the player's current node. */
  'player:requestSync': () => void;
  /** Request to unlock a skill tree node by ID. Server validates and applies. */
  'player:unlockSkill': (skillId: string) => void;
  /** Equip an item from inventory by its definition ID. */
  'inventory:equipItem': (definitionId: string) => void;
  /** Move the item in the given slot back to inventory. */
  'inventory:unequip': (slot: EquipmentSlot) => void;
  /** Attempt to craft a recipe by ID. Server validates and applies. */
  'crafting:craftRecipe': (recipeId: string) => void;
  /** Dev-only: teleport the player to the debug test room. Server ignores in production. */
  'debug:goToTestRoom': () => void;
  /** Dev-only: leave the debug test room and return to the clearing. Server ignores in production. */
  'debug:leaveTestRoom': () => void;
  /** Dev-only: reset the current player's progression for playtesting. */
  'debug:resetProgress': () => void;
  /** Dev-only: re-run recipe unlock checks after data changes. */
  'debug:refreshRecipes': () => void;
  /** Dev-only: remove and regenerate all monsters in the player's current node. */
  'debug:respawnNode': () => void;
}
