import type {
  AutocombatConfig,
  EquipmentSlot,
  AttunedAbilities,
  EquippedRule,
  EvolveMode,
  PlayerMoveOptions,
  PlayerMoveResult,
  CombatControlResult,
  StanceSlot,
  Vec2,
} from '@mmo-idle/shared';
import type { GameSocket } from './socket';

export function sendMove(socket: GameSocket, pos: Vec2, opts?: PlayerMoveOptions, ack?: (result: PlayerMoveResult) => void): void {
  if (ack) socket.emit('player:move', pos, opts, ack);
  else socket.emit('player:move', pos, opts);
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

export function sendActivateDungeonAltar(socket: GameSocket): void {
  socket.emit('player:activateDungeonAltar');
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

export function sendCraftRuneRecipe(socket: GameSocket, recipeId: string): void {
  socket.emit('rune:craftRecipe', recipeId);
}

export function sendCraftAbilityRecipe(socket: GameSocket, recipeId: string): void {
  socket.emit('ability:craftRecipe', recipeId);
}

export function sendSetAbilityLoadout(
  socket: GameSocket,
  payload: { equipped: AttunedAbilities },
): void {
  socket.emit('ability:setLoadout', payload);
}

export function sendMoveToNeighbor(socket: GameSocket, nodeId: string, pos: Vec2, ack: (result: PlayerMoveResult) => void): void {
  socket.emit('player:moveToNeighbor', nodeId, pos, ack);
}

export function sendUseAbility(
  socket: GameSocket,
  abilityId: string,
  ack?: (result: CombatControlResult) => void,
): void {
  socket.emit('ability:use', abilityId, ack);
}

export function sendManualReload(
  socket: GameSocket,
  ack?: (result: CombatControlResult) => void,
): void {
  socket.emit('player:manualReload', ack);
}

export function sendCraftStanceRecipe(socket: GameSocket, recipeId: string): void {
  socket.emit('stance:craftRecipe', recipeId);
}

export function sendSetStanceLoadout(
  socket: GameSocket,
  payload: { slot: StanceSlot; stanceId: string | null },
): void {
  socket.emit('stance:setLoadout', payload);
}

export function sendSetStanceControl(
  socket: GameSocket,
  stanceId: string | null,
  ack?: (result: CombatControlResult) => void,
): void {
  socket.emit('stance:setControl', { stanceId }, ack);
}

export function sendCraftRiteRecipe(socket: GameSocket, recipeId: string): void {
  socket.emit('rite:craftRecipe', recipeId);
}

export function sendSetRiteLoadout(
  socket: GameSocket,
  payload: { riteIds: string[] },
): void {
  socket.emit('rite:setLoadout', payload);
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

export function sendEvolveItem(
  socket: GameSocket,
  payload: { recipeId: string; mode: EvolveMode },
): void {
  socket.emit('crafting:evolveItem', payload);
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

export function sendRenameCharacter(socket: GameSocket, name: string): void {
  socket.emit('debug:renameCharacter', name);
}

export function sendEquipPhaseTester(socket: GameSocket): void {
  socket.emit('debug:equipPhaseTester');
}

export function sendKillNodeMonsters(socket: GameSocket): void {
  socket.emit('debug:killNodeMonsters');
}

export function sendSetRewardMultiplier(socket: GameSocket, multiplier: number): void {
  socket.emit('debug:setRewardMultiplier', multiplier);
}

export function sendStartPlaytestLogging(socket: GameSocket): void {
  socket.emit('debug:startPlaytestLogging');
}

export function sendStopPlaytestLogging(socket: GameSocket): void {
  socket.emit('debug:stopPlaytestLogging');
}
