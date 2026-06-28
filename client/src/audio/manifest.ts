// Declarative audio catalog for the client sound engine.
//
// Each SFX may point at one or more real files (a random variant is chosen per
// play) and always carries a synthesized `fallback` so the game stays audible
// before/without assets. Drop files into `client/public/assets/audio/...` and
// set the entry's `file`; the engine prefers loaded files over the fallback.

import { BIOME_TEXTURES } from '../sprites';

export type SfxId =
  | 'attack-melee'
  | 'attack-blunt'
  | 'attack-ranged'
  | 'attack-magic'
  | 'take-damage'
  | 'kill'
  | 'boss-death'
  | 'frozen'
  | 'debuff-apply'
  | 'debuff-receive'
  | 'dodge'
  | 'death'
  | 'empowered'
  | 'pack-call';

/** One oscillator note in a synthesized fallback cue. */
export interface SynthTone {
  /** Frequency in Hz. */
  freq: number;
  /** Seconds after cue start before this note begins. */
  delay?: number;
  /** Note length in seconds. */
  duration: number;
  /** Relative loudness within the cue (0–1), before the SFX volume layer. */
  gain?: number;
  type?: OscillatorType;
}

export interface SfxDef {
  /**
   * Public asset path(s) (e.g. `/assets/audio/SFX/slash-1.wav`). Pass an array
   * for sample variants — the engine picks one at random each play. Leave
   * undefined until a real file exists — the engine synthesizes `fallback`
   * meanwhile and the preloader skips undefined entries (no 404 noise).
   */
  file?: string | string[];
  /**
   * Per-play random gain jitter as a ± fraction (0–1). e.g. `0.2` plays the cue
   * at a random 80–120% of the SFX volume each time, so rapidly-repeated effects
   * (attacks, hits) don't sound like the exact same sample on a loop. Omit / 0
   * for cues that should always land at full, consistent volume (death sting).
   */
  gainVariance?: number;
  /**
   * Per-play random pitch (playback-rate) jitter as a ± fraction (0–1). e.g.
   * `0.12` plays each instance at a random 88–112% speed/pitch. This is the
   * strongest lever against "same sample on a loop" — combine with gainVariance.
   * Affects both loaded files (Phaser `rate`) and synth fallbacks (freq scale).
   */
  pitchVariance?: number;
  /** Synth cue played when no file is loaded. */
  fallback: SynthTone[];
}

// NOTE: folder casing must match the real path on disk — production serves from
// a case-sensitive (Linux) filesystem. The dropped folder is `SFX` (uppercase).
export const AUDIO_SFX_DIR = '/assets/audio/SFX';
export const AUDIO_MUSIC_DIR = '/assets/audio/music';

export const SFX_MANIFEST: Record<SfxId, SfxDef> = {
  'attack-melee': {
    file: [
      `${AUDIO_SFX_DIR}/slash-1.wav`,
      `${AUDIO_SFX_DIR}/melee-attack-1.wav`,
    ],
    gainVariance: 0.25,
    pitchVariance: 0.16,
    fallback: [{ freq: 180, duration: 0.08, gain: 0.5, type: 'square' }],
  },
  // Heavy/blunt swings — the cooldown archetype and `impact`-style attacks land
  // with weight rather than a bladed slash.
  'attack-blunt': {
    file: [
      `${AUDIO_SFX_DIR}/blunt-1.wav`,
      `${AUDIO_SFX_DIR}/blunt-2.wav`,
    ],
    gainVariance: 0.25,
    pitchVariance: 0.14,
    fallback: [
      { freq: 110, duration: 0.1, gain: 0.55, type: 'square' },
      { freq: 70, delay: 0.02, duration: 0.12, gain: 0.5, type: 'sawtooth' },
    ],
  },
  'attack-ranged': {
    file: [
      `${AUDIO_SFX_DIR}/bow-shoot-1.wav`,
      `${AUDIO_SFX_DIR}/bow-shoot-2.wav`,
      `${AUDIO_SFX_DIR}/bow-shoot-3.wav`,
    ],
    gainVariance: 0.25,
    pitchVariance: 0.16,
    fallback: [{ freq: 720, duration: 0.06, gain: 0.4, type: 'triangle' }],
  },
  'attack-magic': {
    file: `${AUDIO_SFX_DIR}/magic-beam-1.wav`,
    gainVariance: 0.25,
    pitchVariance: 0.14,
    fallback: [
      { freq: 520, duration: 0.1, gain: 0.4, type: 'sine' },
      { freq: 880, delay: 0.04, duration: 0.1, gain: 0.3, type: 'sine' },
    ],
  },
  'take-damage': {
    file: `${AUDIO_SFX_DIR}/impact-1.wav`,
    gainVariance: 0.2,
    pitchVariance: 0.14,
    fallback: [{ freq: 130, duration: 0.14, gain: 0.6, type: 'sawtooth' }],
  },
  kill: {
    file: [
      `${AUDIO_SFX_DIR}/enemy-death-1.wav`,
      `${AUDIO_SFX_DIR}/enemy-death-2.wav`,
    ],
    gainVariance: 0.15,
    pitchVariance: 0.1,
    fallback: [
      { freq: 440, duration: 0.1, gain: 0.5, type: 'square' },
      { freq: 660, delay: 0.08, duration: 0.14, gain: 0.5, type: 'square' },
    ],
  },
  // Boss death sting — paired with the retro "bars" dissolve (see fx/monsterDeath).
  // No pitch jitter: this should land as the same dramatic cue every time.
  'boss-death': {
    file: [
      `${AUDIO_SFX_DIR}/boss-death-1.wav`,
      `${AUDIO_SFX_DIR}/boss-death-2.wav`,
    ],
    fallback: [
      { freq: 330, duration: 0.18, gain: 0.5, type: 'square' },
      { freq: 220, delay: 0.14, duration: 0.22, gain: 0.5, type: 'square' },
      { freq: 146.83, delay: 0.34, duration: 0.4, gain: 0.55, type: 'sawtooth' },
      { freq: 98, delay: 0.6, duration: 0.5, gain: 0.5, type: 'sawtooth' },
    ],
  },
  // Ice forming / shattering — played when a freeze overlay lands on the local
  // player and on the Tundra ice-armor shatter pulse.
  frozen: {
    file: `${AUDIO_SFX_DIR}/frozen-1.wav`,
    gainVariance: 0.15,
    pitchVariance: 0.1,
    fallback: [
      { freq: 1200, duration: 0.12, gain: 0.3, type: 'sine' },
      { freq: 1600, delay: 0.04, duration: 0.14, gain: 0.25, type: 'triangle' },
      { freq: 900, delay: 0.1, duration: 0.2, gain: 0.3, type: 'sine' },
    ],
  },
  // You landed a fresh debuff/DoT on a target.
  'debuff-apply': {
    file: `${AUDIO_SFX_DIR}/debuff-1.wav`,
    gainVariance: 0.18,
    pitchVariance: 0.12,
    fallback: [
      { freq: 520, duration: 0.1, gain: 0.35, type: 'sawtooth' },
      { freq: 300, delay: 0.06, duration: 0.16, gain: 0.35, type: 'sawtooth' },
    ],
  },
  // A debuff landed on you.
  'debuff-receive': {
    file: `${AUDIO_SFX_DIR}/debuff-2.wav`,
    gainVariance: 0.18,
    pitchVariance: 0.12,
    fallback: [
      { freq: 300, duration: 0.12, gain: 0.4, type: 'sawtooth' },
      { freq: 180, delay: 0.08, duration: 0.2, gain: 0.4, type: 'sawtooth' },
    ],
  },
  dodge: {
    gainVariance: 0.2,
    pitchVariance: 0.16,
    fallback: [{ freq: 980, duration: 0.06, gain: 0.3, type: 'sine' }],
  },
  death: {
    fallback: [
      { freq: 523.25, duration: 0.22, gain: 0.5, type: 'sine' },
      { freq: 392.0, delay: 0.18, duration: 0.32, gain: 0.5, type: 'sine' },
      { freq: 311.13, delay: 0.42, duration: 0.48, gain: 0.55, type: 'sine' },
    ],
  },
  empowered: {
    file: `${AUDIO_SFX_DIR}/powerful-slash.wav`,
    gainVariance: 0.15,
    pitchVariance: 0.1,
    fallback: [
      { freq: 660, duration: 0.12, gain: 0.45, type: 'triangle' },
      { freq: 990, delay: 0.05, duration: 0.16, gain: 0.4, type: 'triangle' },
    ],
  },
  // Biome-ecology "call-allies" pulse — the pack noticing you (paired with the
  // pack-call ring FX). Node-wide, not own-player gated.
  'pack-call': {
    file: `${AUDIO_SFX_DIR}/monster-call.wav`,
    gainVariance: 0.18,
    pitchVariance: 0.12,
    fallback: [
      { freq: 300, duration: 0.16, gain: 0.4, type: 'sawtooth' },
      { freq: 220, delay: 0.1, duration: 0.2, gain: 0.4, type: 'sawtooth' },
    ],
  },
};

/** Normalized list of variant file paths for a SFX def (empty if none). */
export function sfxFiles(def: SfxDef): string[] {
  if (!def.file) return [];
  return Array.isArray(def.file) ? def.file : [def.file];
}

/** Phaser cache key for a SFX id's variant (index defaults to 0). */
export function sfxKey(id: SfxId, variant = 0): string {
  return `sfx-${id}-${variant}`;
}

/** Phaser cache key for a biome group's music track. */
export function musicKey(biomeGroup: string): string {
  return `music-${biomeGroup}`;
}

/**
 * Background-music track per biome group (keys mirror BIOME_TEXTURES). All
 * undefined for now — set a path like `${AUDIO_MUSIC_DIR}/forest.ogg` once the
 * file exists. Undefined → that biome plays no music (silent), never a crash.
 */
export const MUSIC_MANIFEST: Partial<Record<string, string>> = Object.fromEntries(
  Object.keys(BIOME_TEXTURES).map((group) => [group, undefined]),
);
