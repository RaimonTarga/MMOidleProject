export interface GameplaySettings {
  autoTraverseEnabled: boolean;
}

const STORAGE_KEY = 'mmo_gameplay_settings_v1';

const DEFAULTS: GameplaySettings = {
  autoTraverseEnabled: false,
};

export function loadGameplaySettings(): GameplaySettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...JSON.parse(raw) as Partial<GameplaySettings> };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveGameplaySettings(patch: Partial<GameplaySettings>): GameplaySettings {
  const next = { ...loadGameplaySettings(), ...patch };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}
