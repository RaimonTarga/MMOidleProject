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
  craftTabAtom,
  deathOverlayAtom,
  debugPanelOpenAtom,
  inventoryOpenAtom,
  mapOpenAtom,
  questOpenAtom,
  settingsOpenAtom,
  skillTreeOpenAtom,
} from '../hud/atoms';
import { cancelActiveMove, setHoldStill, setKeyboardVector } from './movement';
import { closeTopmostOverlay } from './overlayStack';

const MOBILE_QUERY = '(max-width: 1100px)';

export function attachKeyboard(scene: GameScene): () => void {
  if (window.matchMedia(MOBILE_QUERY).matches) return () => {};

  const store = getDefaultStore();
  const held = new Set<ActionId>();
  let stillHeld = false;

  function isEditable(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false;
    if (target.isContentEditable) return true;
    const tag = target.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
  }

  function publishKbVector(): void {
    if (stillHeld) {
      setKeyboardVector(0, 0);
      return;
    }
    const dx =
      (held.has('move.right') ? 1 : 0) - (held.has('move.left') ? 1 : 0);
    const dy =
      (held.has('move.down') ? 1 : 0) - (held.has('move.up') ? 1 : 0);
    const len = Math.hypot(dx, dy);
    if (len === 0) setKeyboardVector(0, 0);
    else setKeyboardVector(dx / len, dy / len);
  }

  function updateStillHeld(heldNow: boolean): void {
    if (stillHeld === heldNow) return;
    stillHeld = heldNow;
    setHoldStill(heldNow);
    if (heldNow) cancelActiveMove(scene);
    publishKbVector();
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

    if (matchesKey(event, 'toggle.autoCombat', bindings)) {
      event.preventDefault();
      hudBus.requestAutoToggle();
      return;
    }
    if (matchesKey(event, 'toggle.inventory', bindings)) {
      if (dead) return;
      event.preventDefault();
      store.set(inventoryOpenAtom, (v) => !v);
      return;
    }
    if (matchesKey(event, 'toggle.map', bindings)) {
      store.set(mapOpenAtom, (v) => !v);
      return;
    }
    if (matchesKey(event, 'toggle.skillTree', bindings)) {
      store.set(skillTreeOpenAtom, (v) => !v);
      return;
    }
    if (matchesKey(event, 'toggle.quest', bindings)) {
      store.set(questOpenAtom, (v) => !v);
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
      store.set(settingsOpenAtom, (v) => !v);
      return;
    }
    if (matchesKey(event, 'toggle.crafting', bindings)) {
      if (dead) return;
      store.set(craftTabAtom, (t) => (t === 'forge' ? null : 'forge'));
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
    publishKbVector();
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
    setKeyboardVector(0, 0);
  };
}
