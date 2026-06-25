import type { AbilitySlot, AutocombatConfig, EquipmentSlot, EquippedRule, EvolveMode, StanceSlot } from '@mmo-idle/shared';
import { intents } from './intents';

type RecipeUnlockListener = (name: string, biomeGroup: string) => void;
type TacticalViewListener = (enabled: boolean) => void;

const recipeUnlockListeners = new Set<RecipeUnlockListener>();
const tacticalViewListeners = new Set<TacticalViewListener>();

export const hudBus = {
  /** Called by HUD components — GameScene listens for the resulting CustomEvent. */
  requestAutoToggle(): void {
    intents.emit('toggleAuto', undefined);
  },

  /** Persist and push auto-traverse preference to the server. */
  requestSetAutoTraverse(enabled: boolean): void {
    intents.emit('setAutoTraverse', enabled);
  },

  /** Persist and push auto-combat targeting preferences to the server. */
  requestSetAutocombatConfig(config: AutocombatConfig): void {
    intents.emit('setAutocombatConfig', config);
  },

  /** Called by RunesPanel — push the equipped rune loadout to the server. */
  requestSetRuneLoadout(rules: EquippedRule[]): void {
    intents.emit('setRuneLoadout', rules);
  },

  /** Called by RunesPanel forge tab; server validates unlocks and costs. */
  requestCraftRuneRecipe(recipeId: string): void {
    intents.emit('craftRuneRecipe', recipeId);
  },

  /** Learn an ability (craft its recipe); server validates gate + cost. */
  requestCraftAbilityRecipe(recipeId: string): void {
    intents.emit('craftAbilityRecipe', recipeId);
  },

  /** Equip/clear an ability in a slot (`abilityId: null` clears it). */
  requestSetAbilityLoadout(slot: AbilitySlot, abilityId: string | null): void {
    intents.emit('setAbilityLoadout', { slot, abilityId });
  },

  /** Learn a stance (craft its recipe); server validates gate + cost. */
  requestCraftStanceRecipe(recipeId: string): void {
    intents.emit('craftStanceRecipe', recipeId);
  },

  /** Equip/clear a stance in a slot (`stanceId: null` clears it). */
  requestSetStanceLoadout(slot: StanceSlot, stanceId: string | null): void {
    intents.emit('setStanceLoadout', { slot, stanceId });
  },

  /** Learn a rite (craft its recipe); server validates gate + cost. */
  requestCraftRiteRecipe(recipeId: string): void {
    intents.emit('craftRiteRecipe', recipeId);
  },

  /** Set the full equipped-rite list (interchangeable slots, capped server-side). */
  requestSetRiteLoadout(riteIds: string[]): void {
    intents.emit('setRiteLoadout', { riteIds });
  },

  requestActivateDungeonAltar(): void {
    intents.emit('activateDungeonAltar', undefined);
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

  /** Called by the Forge tab for evolved recipes — evolve (consume +3 predecessor) or reconstruct. */
  requestEvolveItem(recipeId: string, mode: EvolveMode): void {
    intents.emit('evolveItem', { recipeId, mode });
  },

  /** Called by the Upgrade tab — GameScene picks this up and emits the socket event. */
  requestUpgradeItem(itemId: string): void {
    intents.emit('upgradeItem', itemId);
  },

  /** Navigate the player to a node via BFS auto-path. `path` is the sequence of
   *  nodeIds to visit, NOT including the player's current node. */
  requestNavigateTo(path: string[]): void {
    intents.emit('navigateTo', { path });
  },

  requestGoToTestRoom(): void {
    intents.emit('goToTestRoom', undefined);
  },

  requestTeleportToNode(nodeId: string): void {
    intents.emit('teleportToNode', nodeId);
  },

  requestLeaveTestRoom(): void {
    intents.emit('leaveTestRoom', undefined);
  },

  requestResetProgress(): void {
    intents.emit('resetProgress', undefined);
  },

  requestResetClass(): void {
    intents.emit('resetClass', undefined);
  },

  requestRenameCharacter(name: string): void {
    intents.emit('renameCharacter', name);
  },

  requestEquipPhaseTester(): void {
    intents.emit('equipPhaseTester', undefined);
  },

  notifyRecipeUnlock(name: string, biomeGroup: string): void {
    recipeUnlockListeners.forEach(fn => fn(name, biomeGroup));
  },

  subscribeRecipeUnlock(fn: RecipeUnlockListener): () => void {
    recipeUnlockListeners.add(fn);
    return () => recipeUnlockListeners.delete(fn);
  },

  /** Called by PartyPanel — GameScene picks this up and emits the socket event. */
  requestJoinParty(targetPlayerId: string): void {
    intents.emit('joinParty', targetPlayerId);
  },

  /** Called by PartyPanel — leave (or disband) the current party. */
  requestLeaveParty(): void {
    intents.emit('leaveParty', undefined);
  },

  /** Play an emote by id (arrow-key wheel). */
  requestEmote(emoteId: string): void {
    intents.emit('emote', emoteId);
  },

  /** Toggle tactical mode (ranges + hitboxes). */
  toggleTacticalView(): void {
    intents.emit('tacticalView', undefined);
  },

  subscribeTacticalView(fn: TacticalViewListener): () => void {
    tacticalViewListeners.add(fn);
    return () => tacticalViewListeners.delete(fn);
  },

  notifyTacticalView(enabled: boolean): void {
    for (const fn of tacticalViewListeners) fn(enabled);
  },
};
