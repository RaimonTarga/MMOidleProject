import type { EquipmentSlot } from '@mmo-idle/shared';
import { hudBus } from '../hudBus';
import {
  sendCraftRecipe,
  sendEquipItem,
  sendGoToTestRoom,
  sendLeaveTestRoom,
  sendRefreshRecipes,
  sendResetProgress,
  sendUnequip,
  sendUnlockSkill,
} from '../net/intents';
import type { GameScene } from '../scenes/GameScene';
import { sendAutoPathMove, setAutoMode } from './autoPath';

export function attachHudEvents(scene: GameScene): void {
  window.addEventListener('hud:toggleAuto', () => {
    setAutoMode(scene, !scene.autoMode);
  });

  window.addEventListener('hud:unlockSkill', (e: Event) => {
    sendUnlockSkill(scene.socket, (e as CustomEvent<string>).detail);
  });

  window.addEventListener('hud:equipItem', (e: Event) => {
    sendEquipItem(scene.socket, (e as CustomEvent<string>).detail);
  });

  window.addEventListener('hud:unequipItem', (e: Event) => {
    sendUnequip(scene.socket, (e as CustomEvent<EquipmentSlot>).detail);
  });

  window.addEventListener('hud:craftRecipe', (e: Event) => {
    sendCraftRecipe(scene.socket, (e as CustomEvent<string>).detail);
  });

  window.addEventListener('hud:debugPlayerRange', () => {
    scene.debugPlayerRange = !scene.debugPlayerRange;
  });

  window.addEventListener('hud:debugEnemyRanges', () => {
    scene.debugEnemyRanges = !scene.debugEnemyRanges;
  });

  window.addEventListener('hud:navigateTo', (e: Event) => {
    const { path } = (e as CustomEvent<{ path: string[] }>).detail;
    if (path.length === 0) return;
    setAutoMode(scene, false);
    scene.autoPath = path;
    hudBus.emit({ autoPath: [...path] });
    sendAutoPathMove(scene, scene.state.ownNodeId);
  });

  window.addEventListener('hud:goToTestRoom', () => {
    sendGoToTestRoom(scene.socket);
  });

  window.addEventListener('hud:leaveTestRoom', () => {
    sendLeaveTestRoom(scene.socket);
  });

  window.addEventListener('hud:resetProgress', () => {
    sendResetProgress(scene.socket);
  });

  window.addEventListener('hud:refreshRecipes', () => {
    sendRefreshRecipes(scene.socket);
  });
}
