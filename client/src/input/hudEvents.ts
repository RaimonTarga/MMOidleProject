import { setAutoPath } from "../hud/atoms";
import { hudBus } from "../hudBus";
import { intents } from "../intents";
import {
  sendCraftRecipe,
  sendEquipItem,
  sendGoToTestRoom,
  sendJoinParty,
  sendLeaveParty,
  sendLeaveTestRoom,
  sendRefreshRecipes,
  sendResetProgress,
  sendSetAutoTraverse,
  sendUnequip,
  sendUnlockSkill,
  sendUpgradeItem,
} from "../net/intents";
import type { GameScene } from "../scenes/GameScene";
import { sendAutoPathMove, setAutoMode } from "./autoPath";

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
    sendEquipItem(scene.socket, definitionId);
  });

  intents.on("unequipItem", (slot) => {
    sendUnequip(scene.socket, slot);
  });

  intents.on("craftRecipe", (recipeId) => {
    sendCraftRecipe(scene.socket, recipeId);
  });

  intents.on("upgradeItem", (itemId) => {
    sendUpgradeItem(scene.socket, itemId);
  });

  intents.on("tacticalView", () => {
    scene.tacticalMode = !scene.tacticalMode;
    hudBus.notifyTacticalView(scene.tacticalMode);
  });

  intents.on("navigateTo", ({ path }) => {
    if (path.length === 0) return;
    setAutoMode(scene, false);
    scene.autoPath = path;
    setAutoPath([...path]);
    sendAutoPathMove(scene, scene.state.ownNodeId);
  });

  intents.on("goToTestRoom", () => {
    sendGoToTestRoom(scene.socket);
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

  intents.on("joinParty", (targetPlayerId) => {
    sendJoinParty(scene.socket, targetPlayerId);
  });

  intents.on("leaveParty", () => {
    sendLeaveParty(scene.socket);
  });
}
