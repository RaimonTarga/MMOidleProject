import { atom, getDefaultStore, type PrimitiveAtom } from 'jotai';

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
  | 'close.overlay';

export interface BindingSet {
  key: string;
  pad: number | null;
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
  'close.overlay': { key: 'Escape', pad: 1 },
};

const STORAGE_KEY = 'mmo_keybinds';
const SCHEMA_VERSION = 2;

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
    if (parsed.version !== SCHEMA_VERSION || !parsed.bindings) {
      return cloneDefaults();
    }
    const merged = cloneDefaults();
    for (const id of ALL_ACTION_IDS) {
      const b = parsed.bindings[id];
      if (b) {
        merged[id] = {
          key: typeof b.key === 'string' ? b.key : '',
          pad: typeof b.pad === 'number' ? b.pad : null,
        };
      }
    }
    const legacyRanges = parsed.bindings['toggle.debugRanges' as ActionId];
    if (legacyRanges && merged['toggle.tacticalView'].key === DEFAULT_BINDINGS['toggle.tacticalView'].key) {
      merged['toggle.tacticalView'] = {
        key: typeof legacyRanges.key === 'string' ? legacyRanges.key : '',
        pad: typeof legacyRanges.pad === 'number' ? legacyRanges.pad : null,
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
  event: KeyboardEvent,
  action: ActionId,
  bindings: Bindings,
): boolean {
  const key = bindings[action].key;
  return key !== '' && event.code === key;
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
  'close.overlay': 'Close Overlay',
};

export function cloneBindings(bindings: Bindings): Bindings {
  const out = {} as Bindings;
  for (const id of ALL_ACTION_IDS) {
    out[id] = { ...bindings[id] };
  }
  return out;
}
