import type { EquipmentSlot } from '@mmo-idle/shared';
import { intents } from './intents';

type RecipeUnlockListener = (name: string, biomeGroup: string) => void;

const recipeUnlockListeners = new Set<RecipeUnlockListener>();

export const hudBus = {
  /** Called by HUD components — GameScene listens for the resulting CustomEvent. */
  requestAutoToggle(): void {
    intents.emit('toggleAuto', undefined);
  },

  /** Called by SkillTreePanel — GameScene picks this up and emits the socket event. */
  requestSkillUnlock(skillId: string): void {
    intents.emit('unlockSkill', skillId);
  },

  /** Called by InventoryPanel — GameScene picks this up and emits the socket event. */
  requestEquipItem(definitionId: string): void {
    intents.emit('equipItem', definitionId);
  },

  /** Called by InventoryPanel — GameScene picks this up and emits the socket event. */
  requestUnequipItem(slot: EquipmentSlot): void {
    intents.emit('unequipItem', slot);
  },

  /** Called by CraftingPanel — GameScene picks this up and emits the socket event. */
  requestCraftRecipe(recipeId: string): void {
    intents.emit('craftRecipe', recipeId);
  },

  /** Navigate the player to a node via BFS auto-path. `path` is the sequence of
   *  nodeIds to visit, NOT including the player's current node. */
  requestNavigateTo(path: string[]): void {
    intents.emit('navigateTo', { path });
  },

  requestGoToTestRoom(): void {
    intents.emit('goToTestRoom', undefined);
  },

  requestLeaveTestRoom(): void {
    intents.emit('leaveTestRoom', undefined);
  },

  requestResetProgress(): void {
    intents.emit('resetProgress', undefined);
  },

  requestRefreshRecipes(): void {
    intents.emit('refreshRecipes', undefined);
  },

  notifyRecipeUnlock(name: string, biomeGroup: string): void {
    recipeUnlockListeners.forEach(fn => fn(name, biomeGroup));
  },

  subscribeRecipeUnlock(fn: RecipeUnlockListener): () => void {
    recipeUnlockListeners.add(fn);
    return () => recipeUnlockListeners.delete(fn);
  },

  /** Toggle the player attack-range debug overlay in GameScene. */
  toggleDebugPlayerRange(): void {
    intents.emit('debugPlayerRange', undefined);
  },

  /** Toggle the enemy range (pull / leash / attack) debug overlay in GameScene. */
  toggleDebugEnemyRanges(): void {
    intents.emit('debugEnemyRanges', undefined);
  },
};
