import type { PlayerState } from '@mmo-idle/shared';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';

export interface HudState {
  status: ConnectionStatus;
  player: PlayerState | null;
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
};
