import {
  DEFAULT_AUTOCOMBAT_CONFIG,
  type AutocombatConfig,
} from '@mmo-idle/shared';

export interface GameplaySettings {
  autoTraverseEnabled: boolean;
  autocombat: AutocombatConfig;
  deathNotificationsEnabled: boolean;
  uiFontScale: number;
  /** Show the auto-combat intent thought bubble over characters. Off by default. */
  intentBubblesEnabled: boolean;
}

const LEGACY_STORAGE_KEY = 'mmo_gameplay_settings_v1';
const STORAGE_KEY = 'mmo_gameplay_settings_v2';
/** A displayed 100% uses the former 120% rendered size. */
export const UI_FONT_SCALE_BASE = 1.2;
// Rebasing keeps roughly the former rendered range (80%-140%) available as
// 65%-120% relative to the larger baseline.
export const UI_FONT_SCALE_MIN = 0.65;
export const UI_FONT_SCALE_MAX = 1.2;
export const UI_FONT_SCALE_STEP = 0.05;

const DEFAULTS: GameplaySettings = {
  autoTraverseEnabled: false,
  autocombat: { ...DEFAULT_AUTOCOMBAT_CONFIG },
  deathNotificationsEnabled: false,
  uiFontScale: 1,
  intentBubblesEnabled: false,
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

/** Cache for hot-path readers (per-frame Phaser code); load/save keep it fresh. */
let cached: GameplaySettings | null = null;

export function loadGameplaySettings(): GameplaySettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      cached = normalizeSettings(JSON.parse(raw) as Partial<GameplaySettings>);
      return cached;
    }

    const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacyRaw) {
      const legacy = JSON.parse(legacyRaw) as Partial<GameplaySettings>;
      const legacyScale = typeof legacy.uiFontScale === 'number'
        ? legacy.uiFontScale
        : 1;
      cached = normalizeSettings({
        ...legacy,
        // Preserve approximately the same rendered size while rebasing the
        // setting so the former 120% is now presented as 100%.
        uiFontScale: legacyScale / UI_FONT_SCALE_BASE,
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cached));
      return cached;
    }

    cached = { ...DEFAULTS };
  } catch {
    cached = { ...DEFAULTS };
  }
  return cached;
}

/** Cached read — safe to call every frame (no localStorage/JSON churn). */
export function getGameplaySettings(): GameplaySettings {
  return cached ?? loadGameplaySettings();
}

export function saveGameplaySettings(patch: Partial<GameplaySettings>): GameplaySettings {
  const next = normalizeSettings({ ...loadGameplaySettings(), ...patch });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  cached = next;
  return next;
}

export function applyUiFontScale(scale = loadGameplaySettings().uiFontScale): void {
  const renderedScale = Number(
    (clampUiFontScale(scale) * UI_FONT_SCALE_BASE).toFixed(3),
  );
  document.documentElement.style.setProperty('--ui-font-scale', String(renderedScale));
}
