import {
  DEFAULT_AUTOCOMBAT_CONFIG,
  type AutocombatConfig,
} from '@mmo-idle/shared';

export interface GameplaySettings {
  autoTraverseEnabled: boolean;
  autocombat: AutocombatConfig;
  deathNotificationsEnabled: boolean;
  uiFontScale: number;
}

const STORAGE_KEY = 'mmo_gameplay_settings_v1';
export const UI_FONT_SCALE_MIN = 0.8;
export const UI_FONT_SCALE_MAX = 1.4;
export const UI_FONT_SCALE_STEP = 0.05;

const DEFAULTS: GameplaySettings = {
  autoTraverseEnabled: false,
  autocombat: { ...DEFAULT_AUTOCOMBAT_CONFIG },
  deathNotificationsEnabled: false,
  uiFontScale: 1,
};

function clampUiFontScale(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return DEFAULTS.uiFontScale;
  }
  const stepped = Math.round(value / UI_FONT_SCALE_STEP) * UI_FONT_SCALE_STEP;
  const clamped = Math.min(UI_FONT_SCALE_MAX, Math.max(UI_FONT_SCALE_MIN, stepped));
  return Number(clamped.toFixed(2));
}

function normalizeSettings(patch: Partial<GameplaySettings>): GameplaySettings {
  return {
    ...DEFAULTS,
    ...patch,
    uiFontScale: clampUiFontScale(patch.uiFontScale),
    autocombat: {
      ...DEFAULT_AUTOCOMBAT_CONFIG,
      ...(patch.autocombat ?? {}),
    },
  };
}

export function loadGameplaySettings(): GameplaySettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    return normalizeSettings(JSON.parse(raw) as Partial<GameplaySettings>);
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveGameplaySettings(patch: Partial<GameplaySettings>): GameplaySettings {
  const next = normalizeSettings({ ...loadGameplaySettings(), ...patch });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function applyUiFontScale(scale = loadGameplaySettings().uiFontScale): void {
  document.documentElement.style.setProperty('--ui-font-scale', String(clampUiFontScale(scale)));
}
