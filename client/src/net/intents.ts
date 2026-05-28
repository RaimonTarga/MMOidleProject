import type { EquipmentSlot, Vec2 } from '@mmo-idle/shared';
import type { GameSocket } from './socket';

export function sendMove(socket: GameSocket, pos: Vec2): void {
  socket.emit('player:move', pos);
}

export function sendSetAuto(socket: GameSocket, enabled: boolean): void {
  socket.emit('player:setAuto', enabled);
}

export function sendSetAutoTraverse(socket: GameSocket, enabled: boolean): void {
  socket.emit('player:setAutoTraverse', enabled);
}

export function sendRequestSync(socket: GameSocket): void {
  socket.emit('player:requestSync');
}

export function sendUnlockSkill(socket: GameSocket, skillId: string): void {
  socket.emit('player:unlockSkill', skillId);
}

export function sendEquipItem(socket: GameSocket, definitionId: string): void {
  socket.emit('inventory:equipItem', definitionId);
}

export function sendUnequip(socket: GameSocket, slot: EquipmentSlot): void {
  socket.emit('inventory:unequip', slot);
}

export function sendCraftRecipe(socket: GameSocket, recipeId: string): void {
  socket.emit('crafting:craftRecipe', recipeId);
}

export function sendUpgradeItem(socket: GameSocket, itemId: string): void {
  socket.emit('inventory:upgradeItem', itemId);
}

export function sendGoToTestRoom(socket: GameSocket): void {
  socket.emit('debug:goToTestRoom');
}

export function sendLeaveTestRoom(socket: GameSocket): void {
  socket.emit('debug:leaveTestRoom');
}

export function sendResetProgress(socket: GameSocket): void {
  socket.emit('debug:resetProgress');
}

export function sendRefreshRecipes(socket: GameSocket): void {
  socket.emit('debug:refreshRecipes');
}
