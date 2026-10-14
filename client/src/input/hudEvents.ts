import { isDeathOverlayActive, notifyCombatControlResult, setAutoPath } from "../hud/atoms";
import { hudBus } from "../hudBus";
import { intents as intentBus, type IntentMap } from "../intents";
import {
  sendCraftRecipe,
  sendManualReload,
  sendRecallSummons,
  sendEquipItem,
  sendGoToTestRoom,
  sendJoinParty,
  sendLeaveParty,
  sendLeaveTestRoom,
  sendNavigateTo,
  sendRenameCharacter,
  sendEquipPhaseTester,
  sendKillNodeMonsters,
  sendSetRewardMultiplier,
  sendStartPlaytestLogging,
  sendStopPlaytestLogging,
  sendResetProgress,
  sendResetClass,
  sendSetAutoTraverse,
  sendSetAutocombatConfig,
  sendSetRuneLoadout,
  sendTeleportToNode,
  sendUnequip,
  sendUnlockSkill,
  sendAckDeath,
  sendActivateDungeonAltar,
  sendEmote,
} from "../net/intents";
import type { GameScene } from "../scenes/GameScene";
import { setAutoMode } from "./autoPath";
import { sendClampedMove } from "./movement";

export function attachHudEvents(scene: GameScene): () => void {
  const disposers: Array<() => void> = [];
  const intents = {
    on<K extends keyof IntentMap>(
      kind: K,
      handler: (payload: IntentMap[K]) => void,
    ): void {
      disposers.push(intentBus.on(kind, handler));
    },
  };

  intents.on("toggleAuto", () => {
    setAutoMode(scene, !scene.autoMode);
  });

  intents.on("setAuto", (enabled) => {
    if (scene.autoMode !== enabled) setAutoMode(scene, enabled);
  });

  intents.on("moveTo", (pos) => {
    if (isDeathOverlayActive()) return;
    sendClampedMove(scene, pos, { pathfind: true });
  });

  intents.on("setAutoTraverse", (enabled) => {
    sendSetAutoTraverse(scene.socket, enabled);
  });

  intents.on("setAutocombatConfig", (config) => {
    sendSetAutocombatConfig(scene.socket, config);
  });

  intents.on("setRuneLoadout", (rules) => {
    sendSetRuneLoadout(scene.socket, rules);
  });

  intents.on("unlockSkill", (skillId) => {
    sendUnlockSkill(scene.socket, skillId);
  });

  intents.on("equipItem", (definitionId) => {
    if (isDeathOverlayActive()) return;
    sendEquipItem(scene.socket, definitionId);
  });

  intents.on("unequipItem", (slot) => {
    if (isDeathOverlayActive()) return;
    sendUnequip(scene.socket, slot);
  });

  intents.on("craftRecipe", (recipeId) => {
    if (isDeathOverlayActive()) return;
    sendCraftRecipe(scene.socket, recipeId);
  });

  intents.on("manualReload", () => {
    if (isDeathOverlayActive()) return;
    sendManualReload(scene.socket, notifyCombatControlResult);
  });

  intents.on("recallSummons", () => {
    if (isDeathOverlayActive()) return;
    sendRecallSummons(scene.socket);
  });

  intents.on("activateDungeonAltar", () => {
    if (isDeathOverlayActive()) return;
    sendActivateDungeonAltar(scene.socket);
  });

  intents.on("ackDeath", () => {
    sendAckDeath(scene.socket);
  });

  intents.on("tacticalView", () => {
    scene.tacticalMode = !scene.tacticalMode;
    hudBus.notifyTacticalView(scene.tacticalMode);
  });

  intents.on("navigateTo", ({ path }) => {
    if (path.length === 0) return;
    const destNodeId = path[path.length - 1];
    // A map route supersedes any in-node click destination: leaving the mark up
    // would advertise a waypoint the player is no longer walking to.
    scene.targetMarker.hide();
    // Display the planned route; the server owns the actual movement and turns
    // off auto-combat for the trip (state flows back via deltas).
    setAutoPath([...path]);
    sendNavigateTo(scene.socket, destNodeId);
  });

  intents.on("goToTestRoom", () => {
    sendGoToTestRoom(scene.socket);
  });

  intents.on("teleportToNode", (nodeId) => {
    sendTeleportToNode(scene.socket, nodeId);
  });

  intents.on("leaveTestRoom", () => {
    sendLeaveTestRoom(scene.socket);
  });

  intents.on("resetProgress", () => {
    sendResetProgress(scene.socket);
  });

  intents.on("resetClass", () => {
    sendResetClass(scene.socket);
  });

  intents.on("renameCharacter", (name) => {
    sendRenameCharacter(scene.socket, name);
  });

  intents.on("equipPhaseTester", () => {
    if (isDeathOverlayActive()) return;
    sendEquipPhaseTester(scene.socket);
  });

  intents.on("killNodeMonsters", () => {
    if (isDeathOverlayActive()) return;
    sendKillNodeMonsters(scene.socket);
  });

  intents.on("setRewardMultiplier", (multiplier) => {
    sendSetRewardMultiplier(scene.socket, multiplier);
  });

  intents.on("startPlaytestLogging", () => {
    sendStartPlaytestLogging(scene.socket);
  });

  intents.on("stopPlaytestLogging", () => {
    sendStopPlaytestLogging(scene.socket);
  });

  intents.on("joinParty", (targetPlayerId) => {
    sendJoinParty(scene.socket, targetPlayerId);
  });

  intents.on("leaveParty", () => {
    sendLeaveParty(scene.socket);
  });

  intents.on("emote", (emoteId) => {
    if (isDeathOverlayActive()) return;
    sendEmote(scene.socket, emoteId);
  });

  return () => {
    for (const dispose of disposers.splice(0)) dispose();
  };
}
