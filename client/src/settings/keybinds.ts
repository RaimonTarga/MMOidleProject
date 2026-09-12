import { atom, getDefaultStore, type PrimitiveAtom } from 'jotai';

export const ABILITY_HOTKEY_ACTIONS = [
  'ability.slot1',
  'ability.slot2',
  'ability.slot3',
  'ability.slot4',
  'ability.slot5',
  'ability.slot6',
  'ability.slot7',
  'ability.slot8',
  'ability.slot9',
] as const;

export type AbilityHotkeyAction = (typeof ABILITY_HOTKEY_ACTIONS)[number];

export const STANCE_HOTKEY_ACTIONS = [
  'stance.slot1',
  'stance.slot2',
  'stance.slot3',
  'stance.slot4',
  'stance.slot5',
  'stance.slot6',
  'stance.slot7',
  'stance.slot8',
] as const;

export type StanceHotkeyAction = (typeof STANCE_HOTKEY_ACTIONS)[number];

export type ActionId =
  | 'move.up'
  | 'move.down'
  | 'move.left'
  | 'move.right'
  | 'hold.still'
  | 'toggle.tacticalView'
  | 'toggle.map'
  | 'toggle.inventory'
  | 'toggle.autoCombat'
  | 'toggle.skillTree'
  | 'toggle.crafting'
  | 'toggle.quest'
  | 'toggle.debug'
  | 'toggle.settings'
  | 'stance.neutral'
  | StanceHotkeyAction
  | 'class.reload'
  | AbilityHotkeyAction
  | 'close.overlay';

export interface BindingSet {
  key: string;
  pad: number | null;
  /** Whether the keyboard binding requires Shift in addition to `key`. */
  shift?: boolean;
}

export type Bindings = Record<ActionId, BindingSet>;

export interface CaptureRequest {
  action: ActionId;
  device: 'keyboard' | 'gamepad';
}

export const MOVEMENT_ACTIONS = [
  'move.up',
  'move.down',
  'move.left',
  'move.right',
] as const;

export const REBINDABLE_ACTIONS: readonly ActionId[] = [
  'move.up',
  'move.down',
  'move.left',
  'move.right',
  'hold.still',
  'toggle.tacticalView',
  'toggle.map',
  'toggle.inventory',
  'toggle.autoCombat',
  'toggle.skillTree',
  'toggle.crafting',
  'toggle.quest',
  'toggle.debug',
  'toggle.settings',
  'stance.neutral',
  ...STANCE_HOTKEY_ACTIONS,
  'class.reload',
  ...ABILITY_HOTKEY_ACTIONS,
];

export const TRIGGER_LEFT_INDEX = 6;
export const TRIGGER_RIGHT_INDEX = 7;
export const TRIGGER_PRESS_THRESHOLD = 0.55;

export const DEFAULT_BINDINGS: Bindings = {
  'move.up': { key: 'KeyW', pad: 12 },
  'move.down': { key: 'KeyS', pad: 13 },
  'move.left': { key: 'KeyA', pad: 14 },
  'move.right': { key: 'KeyD', pad: 15 },
  'hold.still': { key: 'ShiftLeft', pad: null },
  'toggle.tacticalView': { key: 'KeyZ', pad: null },
  'toggle.map': { key: 'KeyM', pad: 2 },
  'toggle.inventory': { key: 'Tab', pad: 3 },
  'toggle.autoCombat': { key: 'Space', pad: 0 },
  'toggle.skillTree': { key: 'KeyK', pad: 4 },
  'toggle.crafting': { key: 'KeyC', pad: 5 },
  'toggle.quest': { key: 'KeyQ', pad: TRIGGER_LEFT_INDEX },
  'toggle.debug': { key: 'Backquote', pad: 8 },
  'toggle.settings': { key: '', pad: 9 },
  'stance.neutral': { key: 'Digit1', pad: null, shift: true },
  'stance.slot1': { key: 'Digit2', pad: null, shift: true },
  'stance.slot2': { key: 'Digit3', pad: null, shift: true },
  'stance.slot3': { key: 'Digit4', pad: null, shift: true },
  'stance.slot4': { key: 'Digit5', pad: null, shift: true },
  'stance.slot5': { key: 'Digit6', pad: null, shift: true },
  'stance.slot6': { key: 'Digit7', pad: null, shift: true },
  'stance.slot7': { key: 'Digit8', pad: null, shift: true },
  'stance.slot8': { key: 'Digit9', pad: null, shift: true },
  'class.reload': { key: 'KeyR', pad: null },
  'ability.slot1': { key: 'Digit1', pad: null },
  'ability.slot2': { key: 'Digit2', pad: null },
  'ability.slot3': { key: 'Digit3', pad: null },
  'ability.slot4': { key: 'Digit4', pad: null },
  'ability.slot5': { key: 'Digit5', pad: null },
  'ability.slot6': { key: 'Digit6', pad: null },
  'ability.slot7': { key: 'Digit7', pad: null },
  'ability.slot8': { key: 'Digit8', pad: null },
  'ability.slot9': { key: 'Digit9', pad: null },
  'close.overlay': { key: 'Escape', pad: 1 },
};

const STORAGE_KEY = 'mmo_keybinds';
const SCHEMA_VERSION = 3;

const ALL_ACTION_IDS = Object.keys(DEFAULT_BINDINGS) as ActionId[];

function cloneDefaults(): Bindings {
  const out = {} as Bindings;
  for (const id of ALL_ACTION_IDS) {
    out[id] = { ...DEFAULT_BINDINGS[id] };
  }
  return out;
}

export function loadBindings(): Bindings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return cloneDefaults();
    const parsed = JSON.parse(raw) as {
      version?: number;
      bindings?: Partial<Bindings>;
    };
    if ((parsed.version !== 2 && parsed.version !== SCHEMA_VERSION) || !parsed.bindings) {
      return cloneDefaults();
    }
    const merged = cloneDefaults();
    for (const id of ALL_ACTION_IDS) {
      const b = parsed.bindings[id];
      if (b) {
        merged[id] = {
          key: typeof b.key === 'string' ? b.key : '',
          pad: typeof b.pad === 'number' ? b.pad : null,
          shift: typeof b.shift === 'boolean' ? b.shift : false,
        };
      }
    }
    const legacyRanges = parsed.bindings['toggle.debugRanges' as ActionId];
    if (legacyRanges && merged['toggle.tacticalView'].key === DEFAULT_BINDINGS['toggle.tacticalView'].key) {
      merged['toggle.tacticalView'] = {
        key: typeof legacyRanges.key === 'string' ? legacyRanges.key : '',
        pad: typeof legacyRanges.pad === 'number' ? legacyRanges.pad : null,
        shift: typeof legacyRanges.shift === 'boolean' ? legacyRanges.shift : false,
      };
    }
    return merged;
  } catch {
    return cloneDefaults();
  }
}

export function saveBindings(bindings: Bindings): void {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: SCHEMA_VERSION, bindings }),
    );
  } catch {
    /* quota / disabled */
  }
}

export const keybindsAtom: PrimitiveAtom<Bindings> = atom(loadBindings());
export const captureModeAtom: PrimitiveAtom<CaptureRequest | null> =
  atom<CaptureRequest | null>(null);

export function matchesKey(
  event: KeyboardChordInput,
  action: ActionId,
  bindings: Bindings,
): boolean {
  return matchesKeyboardBinding(event, bindings[action]);
}

export interface KeyboardChordInput {
  code: string;
  shiftKey?: boolean;
  ctrlKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
}

export function matchesKeyboardBinding(
  event: KeyboardChordInput,
  binding: BindingSet,
): boolean {
  if (!binding.key || event.code !== binding.key) return false;
  if (!!event.shiftKey !== !!binding.shift) return false;
  return !event.ctrlKey && !event.altKey && !event.metaKey;
}

/** Both Shift keys match when the binding is either Shift (default stand-still). */
export function matchesHoldStillKey(
  event: KeyboardEvent,
  bindings: Bindings,
): boolean {
  const key = bindings['hold.still'].key;
  if (key === '') return false;
  if (event.code === key) return true;
  if (
    (key === 'ShiftLeft' || key === 'ShiftRight') &&
    (event.code === 'ShiftLeft' || event.code === 'ShiftRight')
  ) {
    return true;
  }
  return false;
}

export function matchesPad(
  buttonIndex: number,
  action: ActionId,
  bindings: Bindings,
): boolean {
  const pad = bindings[action].pad;
  return pad !== null && buttonIndex === pad;
}

/** Resolve a configured keyboard event code to its zero-based combat-hotbar slot. */
export function abilitySlotForKey(eventOrCode: KeyboardChordInput | string, bindings: Bindings): number | null {
  const event = typeof eventOrCode === 'string' ? { code: eventOrCode } : eventOrCode;
  const slot = ABILITY_HOTKEY_ACTIONS.findIndex(
    (action) => matchesKeyboardBinding(event, bindings[action]),
  );
  return slot >= 0 ? slot : null;
}

/** Resolve a keyboard chord to its zero-based displayed attuned-stance slot. */
export function stanceSlotForKey(eventOrCode: KeyboardChordInput | string, bindings: Bindings): number | null {
  const event = typeof eventOrCode === 'string' ? { code: eventOrCode } : eventOrCode;
  const slot = STANCE_HOTKEY_ACTIONS.findIndex(
    (action) => matchesKeyboardBinding(event, bindings[action]),
  );
  return slot >= 0 ? slot : null;
}

/** Resolve a configured gamepad button to its zero-based combat-hotbar slot. */
export function abilitySlotForPad(buttonIndex: number, bindings: Bindings): number | null {
  const slot = ABILITY_HOTKEY_ACTIONS.findIndex(
    (action) => bindings[action].pad !== null && bindings[action].pad === buttonIndex,
  );
  return slot >= 0 ? slot : null;
}

/** Resolve a configured gamepad button to its zero-based displayed stance slot. */
export function stanceSlotForPad(buttonIndex: number, bindings: Bindings): number | null {
  const slot = STANCE_HOTKEY_ACTIONS.findIndex(
    (action) => bindings[action].pad !== null && bindings[action].pad === buttonIndex,
  );
  return slot >= 0 ? slot : null;
}

const PAD_LABELS: Record<number, string> = {
  0: 'A',
  1: 'B',
  2: 'X',
  3: 'Y',
  4: 'LB',
  5: 'RB',
  6: 'LT',
  7: 'RT',
  8: 'Back',
  9: 'Start',
  10: 'L3',
  11: 'R3',
  12: 'D-Up',
  13: 'D-Dn',
  14: 'D-Lf',
  15: 'D-Rt',
};

export function padButtonLabel(index: number): string {
  return PAD_LABELS[index] ?? `B${index}`;
}

export function codeToLabel(code: string): string {
  if (!code) return '—';
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  if (code === 'Backquote') return '`';
  if (code === 'Space') return 'Space';
  if (code === 'Escape') return 'Esc';
  if (code === 'Tab') return 'Tab';
  if (code === 'ShiftLeft' || code === 'ShiftRight') return 'Shift';
  if (code.startsWith('Arrow')) return code.slice(5);
  return code;
}

export function bindingToLabel(binding: BindingSet): string {
  const key = codeToLabel(binding.key);
  return binding.shift && binding.key ? `Shift+${key}` : key;
}

export function getBindings(): Bindings {
  return getDefaultStore().get(keybindsAtom);
}

export const ACTION_LABELS: Record<ActionId, string> = {
  'move.up': 'Move Up',
  'move.down': 'Move Down',
  'move.left': 'Move Left',
  'move.right': 'Move Right',
  'hold.still': 'Hold Still',
  'toggle.tacticalView': 'Tactical Mode',
  'toggle.map': 'Open Map',
  'toggle.inventory': 'Open Inventory',
  'toggle.autoCombat': 'Toggle Auto Combat',
  'toggle.skillTree': 'Open Skill Tree',
  'toggle.crafting': 'Open Crafting',
  'toggle.quest': 'Open Quests',
  'toggle.debug': 'Toggle Debug',
  'toggle.settings': 'Open Settings',
  'stance.neutral': 'Use Neutral Stance',
  'stance.slot1': 'Use Stance 1',
  'stance.slot2': 'Use Stance 2',
  'stance.slot3': 'Use Stance 3',
  'stance.slot4': 'Use Stance 4',
  'stance.slot5': 'Use Stance 5',
  'stance.slot6': 'Use Stance 6',
  'stance.slot7': 'Use Stance 7',
  'stance.slot8': 'Use Stance 8',
  'class.reload': 'Slinger: Reload',
  'ability.slot1': 'Use Ability 1',
  'ability.slot2': 'Use Ability 2',
  'ability.slot3': 'Use Ability 3',
  'ability.slot4': 'Use Ability 4',
  'ability.slot5': 'Use Ability 5',
  'ability.slot6': 'Use Ability 6',
  'ability.slot7': 'Use Ability 7',
  'ability.slot8': 'Use Ability 8',
  'ability.slot9': 'Use Ability 9',
  'close.overlay': 'Close Overlay',
};

export function cloneBindings(bindings: Bindings): Bindings {
  const out = {} as Bindings;
  for (const id of ALL_ACTION_IDS) {
    out[id] = { ...bindings[id] };
  }
  return out;
}
