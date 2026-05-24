import type { PlayerState, EquipmentSlot } from '@mmo-idle/shared';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';

export interface HudState {
  status: ConnectionStatus;
  player: PlayerState | null;
  /** Remaining auto-path nodes to visit (excludes current node). Null when idle. */
  autoPath?: string[] | null;
}

type Listener = (state: HudState) => void;

let state: HudState = { status: 'connecting', player: null };
const listeners = new Set<Listener>();

export const hudBus = {
  emit(partial: Partial<HudState>): void {
    state = { ...state, ...partial };
    listeners.forEach(fn => fn(state));
  },

  subscribe(fn: Listener): () => void {
    listeners.add(fn);
    fn(state); // fire immediately with current state
    return () => listeners.delete(fn);
  },

  /** Called by HUD components — GameScene listens for the resulting CustomEvent. */
  requestAutoToggle(): void {
    window.dispatchEvent(new CustomEvent('hud:toggleAuto'));
  },

  /** Called by SkillTreePanel — GameScene picks this up and emits the socket event. */
  requestSkillUnlock(skillId: string): void {
    window.dispatchEvent(new CustomEvent('hud:unlockSkill', { detail: skillId }));
  },

  /** Called by InventoryPanel — GameScene picks this up and emits the socket event. */
  requestEquipItem(definitionId: string): void {
    window.dispatchEvent(new CustomEvent('hud:equipItem', { detail: definitionId }));
  },

  /** Called by InventoryPanel — GameScene picks this up and emits the socket event. */
  requestUnequipItem(slot: EquipmentSlot): void {
    window.dispatchEvent(new CustomEvent('hud:unequipItem', { detail: slot }));
  },

  /** Called by CraftingPanel — GameScene picks this up and emits the socket event. */
  requestCraftRecipe(recipeId: string): void {
    window.dispatchEvent(new CustomEvent('hud:craftRecipe', { detail: recipeId }));
  },

  /** Navigate the player to a node via BFS auto-path. `path` is the sequence of
   *  nodeIds to visit, NOT including the player's current node. */
  requestNavigateTo(path: string[]): void {
    window.dispatchEvent(new CustomEvent('hud:navigateTo', { detail: { path } }));
  },

  requestGoToTestRoom(): void {
    window.dispatchEvent(new CustomEvent('hud:goToTestRoom'));
  },

  requestLeaveTestRoom(): void {
    window.dispatchEvent(new CustomEvent('hud:leaveTestRoom'));
  },

  requestResetProgress(): void {
    window.dispatchEvent(new CustomEvent('hud:resetProgress'));
  },

  /** Toggle the player attack-range debug overlay in GameScene. */
  toggleDebugPlayerRange(): void {
    window.dispatchEvent(new CustomEvent('hud:debugPlayerRange'));
  },

  /** Toggle the enemy range (pull / leash / attack) debug overlay in GameScene. */
  toggleDebugEnemyRanges(): void {
    window.dispatchEvent(new CustomEvent('hud:debugEnemyRanges'));
  },
};
