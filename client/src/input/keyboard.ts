import Phaser from 'phaser';
import { getDefaultStore } from 'jotai';
import type { GameScene } from '../scenes/GameScene';
import { hudBus } from '../hudBus';
import {
  captureModeAtom,
  getBindings,
  MOVEMENT_ACTIONS,
  matchesHoldStillKey,
  matchesKey,
  type ActionId,
} from '../settings/keybinds';
import {
  deathOverlayAtom,
  debugPanelOpenAtom,
  flashEmoteWheel,
  type EmoteWheelDirection,
} from '../hud/atoms';
import { emoteForWheelDirection, NODE_BIOMES } from '@mmo-idle/shared';
import { cancelActiveMove, setHoldStill, setKeyboardVector } from './movement';
import { closeTopmostOverlay, togglePrimaryOverlay } from './overlayStack';
import { ALTAR_ARC_CONFIG, getAltarArc } from '../scenes/game/runeAltar';
import { cycleGroundBakeoff } from '../render/wangGround';
import { paintActiveNode } from '../scenes/game/overlays';
import { rebuildNeighborLayer } from '../render/neighborScenes';
import { isMobileViewport } from '../breakpoints';

const ARROW_TO_WHEEL: Record<string, EmoteWheelDirection> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
};

const EMOTE_CLIENT_COOLDOWN_MS = 400;

export function attachKeyboard(scene: GameScene): () => void {
  if (isMobileViewport()) return () => {};

  const store = getDefaultStore();
  const held = new Set<ActionId>();
  let stillHeld = false;
  let lastEmoteAt = 0;
  // DEV-only ground bake-off label (see the [ / ] handler below).
  let groundLabel: Phaser.GameObjects.Text | null = null;
  function showGroundLabel(text: string): void {
    if (!groundLabel) {
      groundLabel = scene.add
        .text(14, 14, '', {
          fontFamily: 'monospace',
          fontSize: '18px',
          color: '#ffffff',
          backgroundColor: '#000000cc',
          padding: { x: 8, y: 5 },
        })
        .setScrollFactor(0)
        .setDepth(1_000_000);
    }
    groundLabel.setText(text).setVisible(true);
  }
  // Debounce the zero-vector transition so a keyup→keydown gap during a
  // direction change (release one key a few ms before pressing the next)
  // doesn't emit a spurious stop that briefly halts the server-side mover
  // mid-walk. A new non-zero vector cancels the pending zero.
  const KB_STOP_DEBOUNCE_MS = 40;
  let kbZeroTimer: number | null = null;

  function isEditable(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false;
    if (target.isContentEditable) return true;
    const tag = target.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
  }

  function applyKbVector(immediate: boolean): void {
    if (kbZeroTimer !== null) {
      window.clearTimeout(kbZeroTimer);
      kbZeroTimer = null;
    }
    if (stillHeld) {
      setKeyboardVector(0, 0);
      return;
    }
    const dx =
      (held.has('move.right') ? 1 : 0) - (held.has('move.left') ? 1 : 0);
    const dy =
      (held.has('move.down') ? 1 : 0) - (held.has('move.up') ? 1 : 0);
    const len = Math.hypot(dx, dy);
    if (len === 0) {
      if (immediate) {
        setKeyboardVector(0, 0);
      } else {
        kbZeroTimer = window.setTimeout(() => {
          kbZeroTimer = null;
          setKeyboardVector(0, 0);
        }, KB_STOP_DEBOUNCE_MS);
      }
      return;
    }
    setKeyboardVector(dx / len, dy / len);
  }

  function publishKbVector(): void {
    applyKbVector(false);
  }

  function updateStillHeld(heldNow: boolean): void {
    if (stillHeld === heldNow) return;
    stillHeld = heldNow;
    setHoldStill(heldNow);
    if (heldNow) cancelActiveMove(scene);
    // Hold-still toggles are deliberate: apply the resulting vector immediately
    // (stop, or resume if WASD is still held) without the rollover debounce.
    applyKbVector(true);
  }

  function onKeyDown(event: KeyboardEvent): void {
    if (!scene.myId || isEditable(event.target)) return;
    if (store.get(captureModeAtom) !== null) return;
    const dead = store.get(deathOverlayAtom).active;

    const bindings = getBindings();

    if (matchesHoldStillKey(event, bindings)) {
      event.preventDefault();
      if (!event.repeat) updateStillHeld(true);
      return;
    }

    if (!dead) {
      for (const mv of MOVEMENT_ACTIONS) {
        if (matchesKey(event, mv, bindings)) {
          event.preventDefault();
          if (!event.repeat) {
            held.add(mv);
            publishKbVector();
          }
          return;
        }
      }
    }
    if (event.repeat) return;

    // DEV: cycle the current biome's ground bake-off sheets with [ and ] to
    // compare candidate tilesets live in-game (0 = the real per-node styles).
    if (
      import.meta.env.DEV &&
      (event.code === 'BracketRight' || event.code === 'BracketLeft')
    ) {
      event.preventDefault();
      const nodeId = scene.state.ownNodeId || scene.lastDrawnNodeId;
      const biomeGroup = nodeId ? NODE_BIOMES[nodeId]?.biomeGroup : undefined;
      const r = biomeGroup
        ? cycleGroundBakeoff(biomeGroup, event.code === 'BracketRight' ? 1 : -1)
        : null;
      if (!r) {
        showGroundLabel(`No ground bake-off for biome "${biomeGroup ?? '?'}"`);
        return;
      }
      if (nodeId) {
        paintActiveNode(scene, nodeId);
        rebuildNeighborLayer(scene, nodeId);
      }
      showGroundLabel(`${biomeGroup} ground ${r.index + 1}/${r.total}  —  ${r.label}`);
      return;
    }

    // Enter: trigger the rune altar interaction for the arc the player stands in.
    if (event.code === 'Enter' || event.code === 'NumpadEnter') {
      if (dead) return;
      const arc = getAltarArc(scene);
      if (arc && ALTAR_ARC_CONFIG[arc].action === 'resetClass') {
        event.preventDefault();
        hudBus.requestResetClass();
      }
      return;
    }

    const wheelDir = ARROW_TO_WHEEL[event.code];
    if (wheelDir && !dead) {
      event.preventDefault();
      flashEmoteWheel(wheelDir);
      const emoteId = emoteForWheelDirection(wheelDir);
      if (!emoteId) return;
      const now = Date.now();
      if (now - lastEmoteAt < EMOTE_CLIENT_COOLDOWN_MS) return;
      lastEmoteAt = now;
      hudBus.requestEmote(emoteId);
      return;
    }

    if (matchesKey(event, 'toggle.autoCombat', bindings)) {
      event.preventDefault();
      hudBus.requestAutoToggle();
      return;
    }
    if (matchesKey(event, 'toggle.inventory', bindings)) {
      if (dead) return;
      event.preventDefault();
      togglePrimaryOverlay('inventory');
      return;
    }
    if (matchesKey(event, 'toggle.map', bindings)) {
      togglePrimaryOverlay('map');
      return;
    }
    if (matchesKey(event, 'toggle.skillTree', bindings)) {
      togglePrimaryOverlay('skill-tree');
      return;
    }
    if (matchesKey(event, 'toggle.quest', bindings)) {
      togglePrimaryOverlay('quests');
      return;
    }
    if (matchesKey(event, 'toggle.debug', bindings)) {
      store.set(debugPanelOpenAtom, (v) => !v);
      return;
    }
    if (matchesKey(event, 'toggle.tacticalView', bindings)) {
      event.preventDefault();
      hudBus.toggleTacticalView();
      return;
    }
    if (matchesKey(event, 'toggle.settings', bindings)) {
      togglePrimaryOverlay('settings');
      return;
    }
    if (matchesKey(event, 'toggle.crafting', bindings)) {
      if (dead) return;
      togglePrimaryOverlay('crafting');
      return;
    }
    if (matchesKey(event, 'close.overlay', bindings)) {
      closeTopmostOverlay();
    }
  }

  function onKeyUp(event: KeyboardEvent): void {
    const bindings = getBindings();
    if (stillHeld && matchesHoldStillKey(event, bindings)) {
      updateStillHeld(false);
      return;
    }
    let changed = false;
    for (const mv of MOVEMENT_ACTIONS) {
      if (matchesKey(event, mv, bindings) && held.delete(mv)) {
        changed = true;
      }
    }
    if (changed) publishKbVector();
  }

  function onBlur(): void {
    held.clear();
    updateStillHeld(false);
    // Focus loss is an unambiguous stop — bypass the rollover debounce.
    applyKbVector(true);
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', onBlur);

  return () => {
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    window.removeEventListener('blur', onBlur);
    held.clear();
    updateStillHeld(false);
    if (kbZeroTimer !== null) {
      window.clearTimeout(kbZeroTimer);
      kbZeroTimer = null;
    }
    groundLabel?.destroy();
    groundLabel = null;
    setKeyboardVector(0, 0);
  };
}
