import Phaser from 'phaser';
import { getDefaultStore } from 'jotai';
import { NODE_BIOMES } from '@mmo-idle/shared';
import { playerNodeIdAtom } from '../hud/atoms';
import {
  loadAudioSettings,
  saveAudioSettings,
  sfxVolumeAtom,
  musicVolumeAtom,
  sfxMutedAtom,
  musicMutedAtom,
  type AudioSettings,
} from './audioSettings';
import {
  MUSIC_MANIFEST,
  SFX_MANIFEST,
  musicKey,
  sfxFiles,
  sfxKey,
  type SfxId,
  type SynthTone,
} from './manifest';

// Module singleton: scene-independent so React Settings and the node→music
// subscription can reach it without a Phaser scene handle. Wraps Phaser's
// WebAudio sound manager (reusing its audio context + autoplay unlock).

const SFX_THROTTLE_MS = 70;
const MUSIC_FADE_MS = 800;

let scene: Phaser.Scene | null = null;
let settings: AudioSettings = loadAudioSettings();
let currentMusic: Phaser.Sound.BaseSound | null = null;
let currentBiome: string | null = null;
const lastPlayedAt = new Map<SfxId, number>();
let teardown: (() => void) | null = null;

function effSfxVolume(): number {
  return settings.sfxMuted ? 0 : settings.sfxVolume;
}

function effMusicVolume(): number {
  return settings.musicMuted ? 0 : settings.musicVolume;
}

/** The WebAudio context Phaser owns (undefined under HTML5/NoAudio managers). */
function audioContext(): AudioContext | null {
  const mgr = scene?.sound as { context?: AudioContext } | undefined;
  return mgr?.context ?? null;
}

/**
 * Call once from the game scene's create step. Hooks music to the player's
 * current biome and pauses audio while the tab is backgrounded (Phaser's own
 * blur-pause is intentionally disabled in main.ts).
 */
export function initAudio(s: Phaser.Scene): void {
  scene = s;
  settings = loadAudioSettings();

  const store = getDefaultStore();
  const applyNode = (): void => {
    const nodeId = store.get(playerNodeIdAtom);
    const group = nodeId ? NODE_BIOMES[nodeId]?.biomeGroup : null;
    if (group) setMusicForBiome(group);
  };
  const unsubNode = store.sub(playerNodeIdAtom, applyNode);
  applyNode();

  const onVisibility = (): void => {
    if (document.hidden) currentMusic?.pause();
    else if (currentMusic?.isPaused) currentMusic.resume();
  };
  document.addEventListener('visibilitychange', onVisibility);

  s.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    document.removeEventListener('visibilitychange', onVisibility);
    unsubNode();
    currentMusic?.destroy();
    currentMusic = null;
    currentBiome = null;
    scene = null;
  });

  teardown = () => {
    document.removeEventListener('visibilitychange', onVisibility);
    unsubNode();
  };
}

/** Synthesized fallback cue via Phaser's WebAudio context. `rate` scales pitch. */
function playSynth(tones: SynthTone[], volume: number, rate: number): void {
  const ctx = audioContext();
  if (!ctx || volume <= 0) return;
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  const now = ctx.currentTime;
  for (const t of tones) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = t.type ?? 'sine';
    osc.frequency.value = t.freq * rate;
    const start = now + (t.delay ?? 0) / rate;
    const peak = volume * (t.gain ?? 0.5);
    gain.gain.setValueAtTime(Math.max(0.0001, peak), start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + t.duration / rate);
    osc.start(start);
    osc.stop(start + t.duration / rate);
  }
}

/** Random ± jitter multiplier around 1 for a variance fraction (0 ⇒ exactly 1). */
function jitterMult(variance: number | undefined): number {
  const v = variance ?? 0;
  return v > 0 ? 1 + (Math.random() * 2 - 1) * v : 1;
}

/**
 * Play a one-shot sound effect. Throttled per-id; muted/hidden → no-op.
 * `opts.gainMult` (0–1) is a positional attenuation applied on top of the SFX
 * volume — used for off-screen / distant sources (see spawnAttackEffect).
 */
export function playSfx(id: SfxId, opts?: { gainMult?: number }): void {
  if (!scene) return;
  if (document.hidden) return;
  const gainMult = opts?.gainMult ?? 1;
  const vol = effSfxVolume() * gainMult;
  if (vol <= 0) return;

  const now = Date.now();
  const last = lastPlayedAt.get(id) ?? 0;
  if (now - last < SFX_THROTTLE_MS) return;
  lastPlayedAt.set(id, now);

  const def = SFX_MANIFEST[id];
  // Per-play gain + pitch jitter so rapid repeats (and many sources) don't sound
  // like the same sample on a loop.
  const playVol = Math.max(0, vol * jitterMult(def.gainVariance));
  const rate = jitterMult(def.pitchVariance);

  // Pick a random loaded variant; fall back to the synth cue if none loaded.
  const variantCount = sfxFiles(def).length;
  if (variantCount > 0) {
    const i = Math.floor(Math.random() * variantCount);
    const key = sfxKey(id, i);
    if (scene.cache.audio.exists(key)) {
      scene.sound.play(key, { volume: playVol, rate });
      return;
    }
  }
  playSynth(def.fallback, playVol, rate);
}

/** Crossfade background music to the given biome group. */
export function setMusicForBiome(group: string): void {
  if (!scene || group === currentBiome) return;
  currentBiome = group;

  const old = currentMusic;
  currentMusic = null;
  if (old) {
    scene.tweens.add({
      targets: old,
      volume: 0,
      duration: MUSIC_FADE_MS,
      onComplete: () => old.destroy(),
    });
  }

  const file = MUSIC_MANIFEST[group];
  const key = musicKey(group);
  if (!file || !scene.cache.audio.exists(key)) return;

  const next = scene.sound.add(key, { loop: true, volume: 0 });
  next.play();
  if (document.hidden) next.pause();
  currentMusic = next;
  scene.tweens.add({
    targets: next,
    volume: effMusicVolume(),
    duration: MUSIC_FADE_MS,
  });
}

function applyMusicVolumeLive(): void {
  const snd = currentMusic as (Phaser.Sound.BaseSound & { setVolume?: (v: number) => void }) | null;
  snd?.setVolume?.(effMusicVolume());
}

export function setSfxVolume(v: number): void {
  settings = saveAudioSettings({ sfxVolume: v });
  getDefaultStore().set(sfxVolumeAtom, settings.sfxVolume);
}

export function setMusicVolume(v: number): void {
  settings = saveAudioSettings({ musicVolume: v });
  getDefaultStore().set(musicVolumeAtom, settings.musicVolume);
  applyMusicVolumeLive();
}

export function setSfxMuted(muted: boolean): void {
  settings = saveAudioSettings({ sfxMuted: muted });
  getDefaultStore().set(sfxMutedAtom, settings.sfxMuted);
}

export function setMusicMuted(muted: boolean): void {
  settings = saveAudioSettings({ musicMuted: muted });
  getDefaultStore().set(musicMutedAtom, settings.musicMuted);
  applyMusicVolumeLive();
}

/** Test-only: tear down listeners without a scene shutdown. */
export function disposeAudio(): void {
  teardown?.();
  teardown = null;
}
