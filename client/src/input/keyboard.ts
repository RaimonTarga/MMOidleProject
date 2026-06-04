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
  flashEmoteWheel,
  inventoryOpenAtom,
  mapOpenAtom,
  questOpenAtom,
  settingsOpenAtom,
  skillTreeOpenAtom,
  type EmoteWheelDirection,
} from '../hud/atoms';
import { emoteForWheelDirection } from '@mmo-idle/shared';
import { cancelActiveMove, setHoldStill, setKeyboardVector } from './movement';
import { closeTopmostOverlay } from './overlayStack';
import { ALTAR_ARC_CONFIG, getAltarArc } from '../scenes/game/runeAltar';

const MOBILE_QUERY = '(max-width: 1100px)';

const ARROW_TO_WHEEL: Record<string, EmoteWheelDirection> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
};

const EMOTE_CLIENT_COOLDOWN_MS = 400;

export function attachKeyboard(scene: GameScene): () => void {
  if (window.matchMedia(MOBILE_QUERY).matches) return () => {};

  const store = getDefaultStore();
  const held = new Set<ActionId>();
  let stillHeld = false;
  let lastEmoteAt = 0;
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

    // Enter: trigger the rune altar interaction for the arc the player stands in.
    if (event.code === 'Enter') {
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
    setKeyboardVector(0, 0);
  };
}
