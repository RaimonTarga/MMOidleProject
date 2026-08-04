import type { EquipmentSlot } from "../items";
import type { EquippedAbilities } from "../abilities";
import type { StanceSlot } from "../stances";
import type { EvolveMode } from "../systems/evolution";
import type { AutocombatConfig } from "../components/core/networkedSlices";
import type { EquippedRule } from "../runeDatabase";
import type { BossFelledMarker } from "./bossFelled";
import type { DeltaSnapshot } from "./delta";
import type { PlayerDeathPayload } from "./death";
import type { NodeTelemetrySnapshot } from "./nodeTelemetry";
import type { WorldLogEvent } from "./worldLogEvents";
import type { Vec2 } from "../systems/spatial";
import type { AccountCharactersPayload } from "./characters";

export type PlayerMoveMode = "path" | "direct";
export interface PlayerMoveOptions {
  mode?: PlayerMoveMode;
}

export interface ReleaseAnnouncementPayload {
  version: string;
  title: string;
  releasedAt: number;
  markdown: string;
}

export interface CharacterActionResult {
  success: boolean;
  reason?: string;
}

export interface CharacterCreateResult extends CharacterActionResult {
  characterId?: string;
}

export interface SpectateStatus {
  mode: "player" | "clearing";
  nodeId: string;
  targetId?: string;
  targetName?: string;
  paused: boolean;
}

/** Events the server sends to clients */
export interface ServerToClientEvents {
  /** Anonymous, privacy-filtered world stream. */
  "spectate:snapshot": (snapshot: DeltaSnapshot) => void;
  /** Current follow target or Clearing fallback. */
  "spectate:status": (status: SpectateStatus) => void;
  /** Admission/stream failure for anonymous spectators. */
  "spectate:error": (payload: { reason: string }) => void;
  /** Current non-deleted characters for the authenticated account. */
  "account:characters": (payload: AccountCharactersPayload) => void;
  /** Authoritative result of a lobby character-creation request. */
  "character:createResult": (result: CharacterCreateResult) => void;
  /** Authoritative result of a lobby character-deletion request. */
  "character:deleteResult": (result: CharacterActionResult) => void;
  /** Failure/success acknowledgement for entering the world as a character. */
  "character:selectResult": (result: CharacterActionResult) => void;
  /** Full component resync sent to a newly connected player */
  "state:sync": (snapshot: DeltaSnapshot) => void;
  /** Component-level authoritative world delta broadcast every server tick. */
  "node:delta": (snapshot: DeltaSnapshot) => void;
  /** Immediate result of a crafting attempt — success or reason for failure. */
  "crafting:result": (result: { success: boolean; reason?: string }) => void;
  "rune:craftResult": (result: { recipeId: string; success: boolean; reason?: string }) => void;
  /** Immediate result of learning an ability (crafting an ability recipe). */
  "ability:craftResult": (result: { recipeId: string; success: boolean; reason?: string }) => void;
  /** Immediate result of learning a stance (crafting a stance recipe). */
  "stance:craftResult": (result: { recipeId: string; success: boolean; reason?: string }) => void;
  /** Immediate result of learning a rite (crafting a rite recipe). */
  "rite:craftResult": (result: { recipeId: string; success: boolean; reason?: string }) => void;
  /** Immediate result of an item upgrade attempt. */
  "inventory:upgradeResult": (result: {
    success: boolean;
    reason?: string;
    itemId: string;
    newLevel: number;
  }) => void;
  /** Sent when a player's HP reaches zero — corpse stays at death site until ack. */
  "player:died": (payload: PlayerDeathPayload) => void;
  /** Sent when a player unlocks a skill and advances to the next tier. */
  "player:ascended": (tier: number) => void;
  /** Sent to contributors still on the node when the Void Overlord is defeated. */
  "overlord:felled": () => void;
  /** Authoritative combat/progression log records for the combat log panel. */
  "world:events": (events: WorldLogEvent[]) => void;
  /** Per-node server telemetry snapshot (CPU, memory proxies, leak heuristics). */
  "world:telemetry": (snapshot: NodeTelemetrySnapshot) => void;
  /** Active dungeon boss respawn cooldowns for the world map. */
  "world:bossFelled": (markers: BossFelledMarker[]) => void;
  /** Sent before a cold-start thaw of a frozen node (loading overlay on client). */
  "node:preparing": (payload: { nodeId: string }) => void;
  /** Sent to the old socket when a second session connects with the same account ID. */
  "session:kicked": (payload: { reason: string }) => void;
  /** Player-facing release notes for versions newer than the player's previous login. */
  "game:updateAnnouncement": (payload: ReleaseAnnouncementPayload) => void;
}

/** Events clients send to the server */
export interface ClientToServerEvents {
  /** Pause anonymous high-volume streaming while the tab is hidden. */
  "spectate:setActive": (active: boolean) => void;
  /** Resume a spectator paused by the idle guardrail. */
  "spectate:resume": () => void;
  /** Create an isolated character for the authenticated account. */
  "character:create": (payload: { name: string }) => void;
  /** Enter the world as one owned, non-deleted character. */
  "character:select": (payload: { characterId: string }) => void;
  /** Soft-delete one owned character while idling in the lobby. */
  "character:delete": (payload: { characterId: string }) => void;
  /** Set the player's movement destination. Clicks pathfind; keyboard/gamepad slides directly. */
  "player:move": (pos: Vec2, opts?: PlayerMoveOptions) => void;
  /** Summoner: shift+click command — focus a clicked enemy or move minions to a point. */
  "player:commandSummons": (pos: Vec2) => void;
  /** Enable or disable server-side auto-targeting for this player. */
  "player:setAuto": (enabled: boolean) => void;
  /** Enable or disable server-side auto-traverse when auto-combat is on. */
  "player:setAutoTraverse": (enabled: boolean) => void;
  /** Update server-side auto-combat targeting preferences. */
  "player:setAutocombatConfig": (config: AutocombatConfig) => void;
  /** Walk to a destination node via the shortest gate path (map click-to-navigate). */
  "player:navigateTo": (nodeId: string) => void;
  /** Request a fresh authoritative full snapshot for the player's current node. */
  "player:requestSync": () => void;
  /** Activate the current dungeon node's altar if the player is close enough. */
  "player:activateDungeonAltar": () => void;
  /**
   * Report tab focus. When `false` (tab hidden), the server pauses this socket's
   * high-volume `node:delta` / `world:events` stream; when `true`, streaming
   * resumes (the client also requests a full resync on focus).
   */
  "player:setActive": (active: boolean) => void;
  /** Request to unlock a skill tree node by ID. Server validates and applies. */
  "player:unlockSkill": (skillId: string) => void;
  /** Reset the perk tree (refund spent skill points; keep tier/items). Altar-gated. */
  "player:resetClass": () => void;
  /** Set the player's equipped rune loadout (ordered). Server validates ownership/catalog. */
  "rune:setLoadout": (rules: EquippedRule[]) => void;
  "rune:craftRecipe": (recipeId: string) => void;
  /** Learn an ability by crafting its recipe. Server validates gate + cost. */
  "ability:craftRecipe": (recipeId: string) => void;
  /**
   * Set the full equipped-ability loadout. Ordered per slot kind — list order is
   * fire priority — so equipping, clearing and RE-PRIORITISING are one intent.
   * Server validates learned / slot-type / slot-count / duplicates.
   */
  "ability:setLoadout": (payload: { equipped: EquippedAbilities }) => void;
  /** Learn a stance by crafting its recipe. Server validates gate + cost. */
  "stance:craftRecipe": (recipeId: string) => void;
  /** Equip/clear a stance in a slot. `stanceId: null` clears the slot. */
  "stance:setLoadout": (payload: { slot: StanceSlot; stanceId: string | null }) => void;
  /** Learn a rite by crafting its recipe. Server validates gate + cost. */
  "rite:craftRecipe": (recipeId: string) => void;
  /** Set the full equipped-rite list (interchangeable slots; length ≤ slot count). */
  "rite:setLoadout": (payload: { riteIds: string[] }) => void;
  /** Equip an item from inventory by its definition ID. */
  "inventory:equipItem": (definitionId: string) => void;
  /** Move the item in the given slot back to inventory. */
  "inventory:unequip": (slot: EquipmentSlot) => void;
  /** Attempt to craft a recipe by ID. Server validates and applies. */
  "crafting:craftRecipe": (recipeId: string) => void;
  /**
   * Attempt to evolve/reconstruct into an evolved recipe (system rework Step 6).
   * `evolve` consumes the +3 predecessor; `reconstruct` skips it for a higher cost.
   */
  "crafting:evolveItem": (payload: { recipeId: string; mode: EvolveMode }) => void;
  /** Attempt to upgrade an owned item by ID (+1). Server validates and applies. */
  "inventory:upgradeItem": (itemId: string) => void;
  /** Join the party of the target player (the target's leader becomes your leader). */
  "party:join": (targetPlayerId: string) => void;
  /** Leave your current party (disbands it if you are the leader). */
  "party:leave": () => void;
  /** Acknowledge death overlay — triggers respawn at the clearing. */
  "player:ackDeath": () => void;
  /** Play an emote by id (validated against EMOTE_IDS). */
  "player:emote": (emoteId: string) => void;
  /** Dev-only: teleport the player to the debug test room. Server ignores in production. */
  "debug:goToTestRoom": () => void;
  /** Dev-only: teleport the player directly to a world-map node. Server ignores in production. */
  "debug:teleportToNode": (nodeId: string) => void;
  /** Dev-only: leave the debug test room and return to the clearing. Server ignores in production. */
  "debug:leaveTestRoom": () => void;
  /** Dev-only: reset the current player's progression for playtesting. */
  "debug:resetProgress": () => void;
  /** Dev-only: rename the current player's character. */
  "debug:renameCharacter": (name: string) => void;
  /** Dev-only: remove and regenerate all monsters in the player's current node. */
  "debug:respawnNode": () => void;
  /** Dev-only: grant and equip the Phase Tester weapon + Godmode armor. */
  "debug:equipPhaseTester": () => void;
}
