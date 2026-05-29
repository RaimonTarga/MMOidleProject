import { isDeathOverlayActive, setAutoPath } from "../hud/atoms";
import { hudBus } from "../hudBus";
import { intents } from "../intents";
import {
  sendCraftRecipe,
  sendEquipItem,
  sendGoToTestRoom,
  sendJoinParty,
  sendLeaveParty,
  sendLeaveTestRoom,
  sendNavigateTo,
  sendRefreshRecipes,
  sendEquipPhaseTester,
  sendResetProgress,
  sendSetAutoTraverse,
  sendTeleportToNode,
  sendUnequip,
  sendUnlockSkill,
  sendUpgradeItem,
  sendAckDeath,
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

  intents.on("refreshRecipes", () => {
    sendRefreshRecipes(scene.socket);
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
}
