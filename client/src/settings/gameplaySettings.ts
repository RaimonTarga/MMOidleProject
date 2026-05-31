import {
  DEFAULT_AUTOCOMBAT_CONFIG,
  type AutocombatConfig,
} from '@mmo-idle/shared';

export interface GameplaySettings {
  autoTraverseEnabled: boolean;
  autocombat: AutocombatConfig;
  deathNotificationsEnabled: boolean;
}

const STORAGE_KEY = 'mmo_gameplay_settings_v1';

const DEFAULTS: GameplaySettings = {
  autoTraverseEnabled: false,
  autocombat: { ...DEFAULT_AUTOCOMBAT_CONFIG },
  deathNotificationsEnabled: false,
};

function normalizeSettings(patch: Partial<GameplaySettings>): GameplaySettings {
  return {
    ...DEFAULTS,
    ...patch,
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
