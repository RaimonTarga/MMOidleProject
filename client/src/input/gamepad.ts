import { getDefaultStore } from 'jotai';
import Phaser from 'phaser';
import type { GameScene } from '../scenes/GameScene';
import { hudBus } from '../hudBus';
import {
  craftTabAtom,
  debugPanelOpenAtom,
  gamepadStatusAtom,
  inventoryOpenAtom,
  mapOpenAtom,
  questOpenAtom,
  settingsOpenAtom,
  skillTreeOpenAtom,
} from '../hud/atoms';
import {
  captureModeAtom,
  getBindings,
  matchesPad,
  MOVEMENT_ACTIONS,
  TRIGGER_LEFT_INDEX,
  TRIGGER_PRESS_THRESHOLD,
  TRIGGER_RIGHT_INDEX,
  type ActionId,
} from '../settings/keybinds';
import { setGamepadVector } from './movement';
import { closeTopmostOverlay } from './overlayStack';

const MOBILE_QUERY = '(max-width: 1100px)';
const STICK_DEADZONE = 0.18;

let captureSink: ((buttonIndex: number) => void) | null = null;

export function setCaptureSink(fn: (index: number) => void): void {
  captureSink = fn;
}

export function clearCaptureSink(): void {
  captureSink = null;
}

export function attachGamepad(scene: GameScene): () => void {
  if (window.matchMedia(MOBILE_QUERY).matches) return () => {};

  const plugin = scene.input.gamepad;
  if (!plugin) return () => {};

  const store = getDefaultStore();
  const held = new Set<ActionId>();
  let ltWasPressed = false;
  let rtWasPressed = false;

  function dispatchButton(index: number): void {
    const bindings = getBindings();
    if (matchesPad(index, 'toggle.autoCombat', bindings)) {
      hudBus.requestAutoToggle();
      return;
    }
    if (matchesPad(index, 'toggle.inventory', bindings)) {
      store.set(inventoryOpenAtom, (v) => !v);
      return;
    }
    if (matchesPad(index, 'toggle.map', bindings)) {
      store.set(mapOpenAtom, (v) => !v);
      return;
    }
    if (matchesPad(index, 'toggle.skillTree', bindings)) {
      store.set(skillTreeOpenAtom, (v) => !v);
      return;
    }
    if (matchesPad(index, 'toggle.quest', bindings)) {
      store.set(questOpenAtom, (v) => !v);
      return;
    }
    if (matchesPad(index, 'toggle.debug', bindings)) {
      store.set(debugPanelOpenAtom, (v) => !v);
      return;
    }
    if (matchesPad(index, 'toggle.settings', bindings)) {
      store.set(settingsOpenAtom, (v) => !v);
      return;
    }
    if (matchesPad(index, 'toggle.crafting', bindings)) {
      store.set(craftTabAtom, (t) => (t === 'forge' ? null : 'forge'));
      return;
    }
    if (matchesPad(index, 'close.overlay', bindings)) {
      closeTopmostOverlay();
    }
  }

  function publishPadVector(
    stickX: number,
    stickY: number,
  ): void {
    const dxBtn =
      (held.has('move.right') ? 1 : 0) - (held.has('move.left') ? 1 : 0);
    const dyBtn =
      (held.has('move.down') ? 1 : 0) - (held.has('move.up') ? 1 : 0);
    const dx = dxBtn + stickX;
    const dy = dyBtn + stickY;
    const len = Math.hypot(dx, dy);
    if (len === 0) setGamepadVector(0, 0);
    else {
      const m = len > 1 ? len : 1;
      setGamepadVector(dx / m, dy / m);
    }
  }

  function triggerValue(
    pad: Phaser.Input.Gamepad.Gamepad,
    index: number,
  ): number {
    const btn = pad.buttons[index];
    return btn ? btn.value : 0;
  }

  function pollTriggerCapture(pad: Phaser.Input.Gamepad.Gamepad): void {
    if (!captureSink) return;
    const capture = store.get(captureModeAtom);
    if (!capture || capture.device !== 'gamepad') return;
    if (triggerValue(pad, TRIGGER_LEFT_INDEX) >= TRIGGER_PRESS_THRESHOLD) {
      captureSink(TRIGGER_LEFT_INDEX);
      return;
    }
    if (triggerValue(pad, TRIGGER_RIGHT_INDEX) >= TRIGGER_PRESS_THRESHOLD) {
      captureSink(TRIGGER_RIGHT_INDEX);
    }
  }

  function pollTriggerEdges(pad: Phaser.Input.Gamepad.Gamepad): void {
    const capture = store.get(captureModeAtom);
    if (capture) return;

    const ltNow =
      triggerValue(pad, TRIGGER_LEFT_INDEX) >= TRIGGER_PRESS_THRESHOLD;
    const rtNow =
      triggerValue(pad, TRIGGER_RIGHT_INDEX) >= TRIGGER_PRESS_THRESHOLD;

    if (ltNow && !ltWasPressed) dispatchButton(TRIGGER_LEFT_INDEX);
    if (rtNow && !rtWasPressed) dispatchButton(TRIGGER_RIGHT_INDEX);

    ltWasPressed = ltNow;
    rtWasPressed = rtNow;
  }

  function stickAxes(pad: Phaser.Input.Gamepad.Gamepad): { x: number; y: number } {
    let x = pad.leftStick.x;
    let y = pad.leftStick.y;
    if (Math.abs(x) < STICK_DEADZONE) x = 0;
    if (Math.abs(y) < STICK_DEADZONE) y = 0;
    return { x, y };
  }

  function onConnected(pad: Phaser.Input.Gamepad.Gamepad): void {
    store.set(gamepadStatusAtom, {
      index: pad.index,
      id: pad.id,
      mapping: '',
    });
  }

  function onDisconnected(pad: Phaser.Input.Gamepad.Gamepad): void {
    const cur = store.get(gamepadStatusAtom);
    if (cur && cur.index === pad.index) {
      store.set(gamepadStatusAtom, null);
    }
    held.clear();
    setGamepadVector(0, 0);
    ltWasPressed = false;
    rtWasPressed = false;
  }

  function onDown(
    _pad: Phaser.Input.Gamepad.Gamepad,
    button: Phaser.Input.Gamepad.Button,
  ): void {
    const idx = button.index;
    const capture = store.get(captureModeAtom);

    if (capture && capture.device === 'gamepad') {
      captureSink?.(idx);
      return;
    }
    if (capture) return;

    const bindings = getBindings();
    for (const mv of MOVEMENT_ACTIONS) {
      if (matchesPad(idx, mv, bindings)) {
        held.add(mv);
        const padRef = plugin?.pad1;
        if (padRef) {
          const { x, y } = stickAxes(padRef);
          publishPadVector(x, y);
        }
        return;
      }
    }
    dispatchButton(idx);
  }

  function onUp(
    _pad: Phaser.Input.Gamepad.Gamepad,
    button: Phaser.Input.Gamepad.Button,
  ): void {
    const bindings = getBindings();
    let changed = false;
    for (const mv of MOVEMENT_ACTIONS) {
      if (matchesPad(button.index, mv, bindings) && held.delete(mv)) {
        changed = true;
      }
    }
    if (changed) {
      const padRef = plugin?.pad1;
      if (padRef) {
        const { x, y } = stickAxes(padRef);
        publishPadVector(x, y);
      }
    }
  }

  function onPreUpdate(): void {
    const pad = plugin?.pad1;
    if (!pad) return;
    pollTriggerCapture(pad);
    pollTriggerEdges(pad);
    const { x, y } = stickAxes(pad);
    publishPadVector(x, y);
  }

  plugin.on('connected', onConnected);
  plugin.on('disconnected', onDisconnected);
  plugin.on('down', onDown);
  plugin.on('up', onUp);
  scene.events.on('preupdate', onPreUpdate);

  return () => {
    plugin.off('connected', onConnected);
    plugin.off('disconnected', onDisconnected);
    plugin.off('down', onDown);
    plugin.off('up', onUp);
    scene.events.off('preupdate', onPreUpdate);
    held.clear();
    setGamepadVector(0, 0);
    store.set(gamepadStatusAtom, null);
    clearCaptureSink();
  };
}
