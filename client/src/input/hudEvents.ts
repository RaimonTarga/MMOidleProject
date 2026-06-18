import { isDeathOverlayActive, setAutoPath } from "../hud/atoms";
import { hudBus } from "../hudBus";
import { intents } from "../intents";
import {
  sendCraftRecipe,
  sendCraftRuneRecipe,
  sendEquipItem,
  sendGoToTestRoom,
  sendJoinParty,
  sendLeaveParty,
  sendLeaveTestRoom,
  sendNavigateTo,
  sendRenameCharacter,
  sendEquipPhaseTester,
  sendResetProgress,
  sendResetClass,
  sendSetAutoTraverse,
  sendSetAutocombatConfig,
  sendSetRuneLoadout,
  sendTeleportToNode,
  sendUnequip,
  sendUnlockSkill,
  sendUpgradeItem,
  sendAckDeath,
  sendActivateDungeonAltar,
  sendEmote,
} from "../net/intents";
import type { GameScene } from "../scenes/GameScene";
import { setAutoMode } from "./autoPath";

export function attachHudEvents(scene: GameScene): void {
  intents.on("toggleAuto", () => {
    setAutoMode(scene, !scene.autoMode);
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

  intents.on("craftRuneRecipe", (recipeId) => {
    if (isDeathOverlayActive()) return;
    sendCraftRuneRecipe(scene.socket, recipeId);
  });

  intents.on("activateDungeonAltar", () => {
    if (isDeathOverlayActive()) return;
    sendActivateDungeonAltar(scene.socket);
  });

  intents.on("upgradeItem", (itemId) => {
    if (isDeathOverlayActive()) return;
    sendUpgradeItem(scene.socket, itemId);
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
}
