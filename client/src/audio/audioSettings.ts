import { atom } from 'jotai';

/** Persisted audio preferences. Volumes are 0–1 linear gains. */
export interface AudioSettings {
  sfxVolume: number;
  musicVolume: number;
  sfxMuted: boolean;
  musicMuted: boolean;
}

// Bump the version to retire saved (louder) defaults — clients re-seed from the
// quieter DEFAULTS below on next load. Old keys are simply ignored.
const STORAGE_KEY = 'mmo_audio_settings_v2';

const DEFAULTS: AudioSettings = {
  sfxVolume: 0.3,
  musicVolume: 0.2,
  sfxMuted: false,
  musicMuted: false,
};

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function normalize(patch: Partial<AudioSettings>): AudioSettings {
  return {
    sfxVolume: clamp01(patch.sfxVolume ?? DEFAULTS.sfxVolume),
    musicVolume: clamp01(patch.musicVolume ?? DEFAULTS.musicVolume),
    sfxMuted: patch.sfxMuted ?? DEFAULTS.sfxMuted,
    musicMuted: patch.musicMuted ?? DEFAULTS.musicMuted,
  };
}

export function loadAudioSettings(): AudioSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    return normalize(JSON.parse(raw) as Partial<AudioSettings>);
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveAudioSettings(patch: Partial<AudioSettings>): AudioSettings {
  const next = normalize({ ...loadAudioSettings(), ...patch });
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage unavailable (private mode, quota) — keep the in-memory value.
  }
  return next;
}

// Reactive mirror for the Settings UI. The engine is the source of truth for
// playback; these atoms keep the sliders in sync and are seeded from storage.
const initial = loadAudioSettings();
export const sfxVolumeAtom = atom(initial.sfxVolume);
export const musicVolumeAtom = atom(initial.musicVolume);
export const sfxMutedAtom = atom(initial.sfxMuted);
export const musicMutedAtom = atom(initial.musicMuted);
