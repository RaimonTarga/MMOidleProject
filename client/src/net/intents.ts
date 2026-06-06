import type { AutocombatConfig, EquipmentSlot, EquippedRule, Vec2 } from '@mmo-idle/shared';
import type { GameSocket } from './socket';

export function sendMove(socket: GameSocket, pos: Vec2): void {
  socket.emit('player:move', pos);
}

export function sendCommandSummons(socket: GameSocket, pos: Vec2): void {
  socket.emit('player:commandSummons', pos);
}

export function sendSetAuto(socket: GameSocket, enabled: boolean): void {
  socket.emit('player:setAuto', enabled);
}

export function sendSetAutoTraverse(socket: GameSocket, enabled: boolean): void {
  socket.emit('player:setAutoTraverse', enabled);
}

export function sendSetAutocombatConfig(
  socket: GameSocket,
  config: AutocombatConfig,
): void {
  socket.emit('player:setAutocombatConfig', config);
}

export function sendNavigateTo(socket: GameSocket, nodeId: string): void {
  socket.emit('player:navigateTo', nodeId);
}

export function sendRequestSync(socket: GameSocket): void {
  socket.emit('player:requestSync');
}

export function sendSetActive(socket: GameSocket, active: boolean): void {
  socket.emit('player:setActive', active);
}

export function sendUnlockSkill(socket: GameSocket, skillId: string): void {
  socket.emit('player:unlockSkill', skillId);
}

export function sendResetClass(socket: GameSocket): void {
  socket.emit('player:resetClass');
}

export function sendSetRuneLoadout(
  socket: GameSocket,
  rules: EquippedRule[],
): void {
  socket.emit('rune:setLoadout', rules);
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

export function sendJoinParty(socket: GameSocket, targetPlayerId: string): void {
  socket.emit('party:join', targetPlayerId);
}

export function sendLeaveParty(socket: GameSocket): void {
  socket.emit('party:leave');
}

export function sendAckDeath(socket: GameSocket): void {
  socket.emit('player:ackDeath');
}

export function sendEmote(socket: GameSocket, emoteId: string): void {
  socket.emit('player:emote', emoteId);
}

export function sendGoToTestRoom(socket: GameSocket): void {
  socket.emit('debug:goToTestRoom');
}

export function sendTeleportToNode(socket: GameSocket, nodeId: string): void {
  socket.emit('debug:teleportToNode', nodeId);
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

export function sendEquipPhaseTester(socket: GameSocket): void {
  socket.emit('debug:equipPhaseTester');
}
