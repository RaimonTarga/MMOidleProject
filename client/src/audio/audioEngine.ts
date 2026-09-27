import Phaser from 'phaser';
import { musicGain, musicVolume, ZONE_FADE_MS, BATTLE_FADE_MS } from './musicMix';
import { VoiceBudget } from './voiceBudget';
import { ZONE_MUSIC, BOSS_MUSIC, musicFile, bossMusicPhase } from './musicCatalog';
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
  SFX_MANIFEST,
  sfxFiles,
  sfxKey,
  type SfxId,
  type SynthTone,
} from './manifest';

// Module singleton: scene-independent so React Settings and the node→music
// subscription can reach it without a Phaser scene handle. Wraps Phaser's
// WebAudio sound manager (reusing its audio context + autoplay unlock).

const SFX_THROTTLE_MS = 70;
const LOGIN_MUSIC_DELAY_MS = 7000;
const LOGIN_MUSIC_FADE_MS = 6000;
let startupTimer: Phaser.Time.TimerEvent | null = null;
let startupReady = false;
let musicHasStarted = false;

let scene: Phaser.Scene | null = null;
let settings: AudioSettings = loadAudioSettings();
let currentMusic: Phaser.Sound.BaseSound | null = null;
let currentBiome: string | null = null;
let requestedTrack: string | null = null;
let playingTrack: string | null = null;
let musicTimeline = 0;
let battleGroup: string | null = null;
let finalCastUntil = 0;
const audioDebug = (import.meta.env.DEV || import.meta.env.VITE_DEV_TOOLS === 'true')
  && new URLSearchParams(window.location.search).has('audioDebug');
const pendingMusic = new Set<string>();
const failedMusic = new Set<string>();
type MusicVoice = { sound: Phaser.Sound.WebAudioSound; level: number; gain: number };
const musicVoices = new Map<Phaser.Sound.BaseSound, MusicVoice>();
const suppressed = new Map<object, number>();
const voices = new VoiceBudget();
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
  voices.clear();
  startupTimer?.remove(false);
  startupTimer = null;
  startupReady = false;
  musicHasStarted = false;
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
    for (const { sound } of musicVoices.values()) {
      if (document.hidden) sound.pause();
      else if (sound.isPaused) sound.resume();
    }
    if (document.hidden) voices.clear();
    else if (requestedTrack) requestMusic(requestedTrack, battleGroup !== null);
  };
  document.addEventListener('visibilitychange', onVisibility);

  s.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    document.removeEventListener('visibilitychange', onVisibility);
    unsubNode();
    startupTimer?.remove(false);
    startupTimer = null;
    voices.clear();
    currentMusic?.destroy();
    currentMusic = null;
    currentBiome = null;
    requestedTrack = playingTrack = battleGroup = null;
    finalCastUntil = 0;
    pendingMusic.clear();
    failedMusic.clear();
    for (const voice of musicVoices.values()) { s.tweens.killTweensOf(voice); voice.sound.destroy(); }
    musicVoices.clear();
    suppressed.clear();
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

  const def = SFX_MANIFEST[id];
  if (performance.now() < (suppressed.get(def) ?? 0)) return;
  // Per-play gain + pitch jitter so rapid repeats (and many sources) don't sound
  // like the same sample on a loop.
  const playVol = Math.max(0, vol * (def.gain ?? 1) * jitterMult(def.gainVariance));
  const rate = jitterMult(def.pitchVariance);

  // Pick a random loaded variant; fall back to the synth cue if none loaded.
  const variantCount = sfxFiles(def).length;
  if (variantCount > 0) {
    const i = Math.floor(Math.random() * variantCount);
    const key = sfxKey(id, i);
    if (scene.cache.audio.exists(key)) {
      let sound: Phaser.Sound.BaseSound | undefined;
      const release = voices.acquire(def, performance.now(), def.cooldownMs ?? SFX_THROTTLE_MS,
        def.maxVoices ?? 2, def.priority ?? 1, () => sound?.destroy());
      if (!release) return;
      sound = scene.sound.add(key, { volume: Math.min(1, playVol), rate });
      const cleanup = (): void => { release(); sound?.destroy(); };
      sound.once('complete', cleanup);
      sound.once('destroy', release);
      if (!sound.play()) cleanup();
      else if (audioDebug) console.debug('[audio:sfx]', id, key, playVol);
      return;
    }
  }
  playSynth(def.fallback, playVol, rate);
}

/** Semantic suppression for an animation reused by a different status (Constrict). */
export function suppressSfx(id: SfxId, ms: number): void {
  suppressed.set(SFX_MANIFEST[id], performance.now() + ms);
}

function queueMusic(track: string, onReady?: () => void): void {
  if (!scene || pendingMusic.has(track) || failedMusic.has(track)) return;
  const owner = scene;
  const key = `music-${track}`;
  if (owner.cache.audio.exists(key)) { onReady?.(); return; }
  pendingMusic.add(track);
  const failure = (file: { key: string }): void => {
    if (file.key !== key) return;
    pendingMusic.delete(track);
    failedMusic.add(track);
    owner.load.off('loaderror', failure);
  };
  owner.load.on('loaderror', failure);
  owner.load.once(`filecomplete-audio-${key}`, () => {
    owner.load.off('loaderror', failure);
    pendingMusic.delete(track);
    if (scene === owner) onReady?.();
  });
  owner.load.audio(key, musicFile(track));
  if (!owner.load.isLoading()) owner.load.start();
}

/** Load on demand, with request identity guarding late network completions. */
function requestMusic(track: string | null, preserveTimeline = false): void {
  requestedTrack = track;
  if (!scene || track === playingTrack) return;
  if (track && !startupReady) {
    if (!startupTimer) startupTimer = scene.time.delayedCall(LOGIN_MUSIC_DELAY_MS, () => {
      startupReady = true;
      startupTimer = null;
      requestMusic(requestedTrack, battleGroup !== null);
    });
    return;
  }
  if (track && (effMusicVolume() <= 0 || document.hidden)) return;
  const key = `music-${track}`;
  if (track && !scene.cache.audio.exists(key)) {
    queueMusic(track, () => {
      if (requestedTrack === track) requestMusic(track, preserveTimeline);
    });
    return;
  }
  const duration = !musicHasStarted ? LOGIN_MUSIC_FADE_MS
    : preserveTimeline ? BATTLE_FADE_MS : ZONE_FADE_MS;
  currentMusic = null;
  playingTrack = track;
  // Retarget every outgoing envelope from its current level, including rapid zone changes.
  for (const voice of musicVoices.values()) {
    scene.tweens.killTweensOf(voice);
    scene.tweens.add({ targets: voice, level: 0, duration, ease: 'Sine.easeInOut',
      onUpdate: () => applyMusicVoice(voice),
      onComplete: () => { musicVoices.delete(voice.sound); voice.sound.destroy(); },
    });
  }
  if (!track) return;
  const next = scene.sound.add(key, { loop: !track.includes('-cast-'), volume: 0 }) as Phaser.Sound.WebAudioSound;
  const now = audioContext()?.currentTime ?? 0;
  if (!preserveTimeline || musicTimeline === 0) musicTimeline = now;
  const seek = next.duration > 0 ? ((now - musicTimeline) % next.duration) : 0;
  next.play({ seek });
  musicHasStarted = true;
  if (audioDebug) console.debug('[audio:music]', track, { seek });
  if (document.hidden) next.pause();
  currentMusic = next;
  const voice: MusicVoice = { sound: next, level: 0, gain: musicGain(track) };
  musicVoices.set(next, voice);
  scene.tweens.add({ targets: voice, level: 1, duration, ease: 'Sine.easeInOut',
    onUpdate: () => applyMusicVoice(voice),
  });
}

export function setMusicForBiome(group: string): void {
  if (group === currentBiome) return;
  currentBiome = group;
  battleGroup = null;
  finalCastUntil = 0;
  requestMusic(ZONE_MUSIC[group] ?? null);
}

/** Presentation follows server snapshots; it never advances a gameplay phase. */
export function setEncounterMusic(group: string, boss?: { hp: number; maxHp: number; engaged: boolean; tier: number; typeId?: string }): void {
  if (!scene) return;
  if (currentBiome !== group) setMusicForBiome(group);
  if (!boss || boss.hp <= 0) finalCastUntil = 0;
  if (performance.now() < finalCastUntil) return;
  const suite = BOSS_MUSIC[group];
  if (!boss || boss.hp <= 0 || !suite) {
    battleGroup = null;
    requestMusic(ZONE_MUSIC[group] ?? null);
    return;
  }
  if (effMusicVolume() > 0) {
    for (const track of suite) queueMusic(track);
    if (group === 'volcanic') {
      queueMusic('v12-volcano-cast-22s'); queueMusic('v12-volcano-cast-26s');
    }
  }
  const phase = bossMusicPhase(boss.hp, boss.maxHp, boss.engaged, boss.tier, !!suite[3], boss.typeId);
  const sameBattle = battleGroup === group && phase > 0;
  battleGroup = phase > 0 ? group : null;
  requestMusic(suite[phase], sameBattle);
}

export function playFinalCastMusic(castMs: number): void {
  if (!scene || currentBiome !== 'volcanic') return;
  finalCastUntil = performance.now() + castMs;
  // Short legacy casts use the last portion; supported 22/26-second casts use the full cue.
  const track = castMs <= 22000 ? 'v12-volcano-cast-22s' : 'v12-volcano-cast-26s';
  const duration = castMs <= 22000 ? 22 : 26;
  musicTimeline = (audioContext()?.currentTime ?? 0) - Math.max(0, duration - castMs / 1000);
  requestMusic(track, true);
}

function applyMusicVoice(voice: MusicVoice): void {
  voice.sound.setVolume(musicVolume(effMusicVolume(), voice.gain, voice.level));
}

function applyMusicVolumeLive(): void {
  // Sliders and mute change the master gain without canceling a transition.
  for (const voice of musicVoices.values()) applyMusicVoice(voice);
}

export function setSfxVolume(v: number): void {
  settings = saveAudioSettings({ sfxVolume: v });
  getDefaultStore().set(sfxVolumeAtom, settings.sfxVolume);
}

export function setMusicVolume(v: number): void {
  settings = saveAudioSettings({ musicVolume: v });
  getDefaultStore().set(musicVolumeAtom, settings.musicVolume);
  applyMusicVolumeLive();
  if (requestedTrack && !settings.musicMuted) requestMusic(requestedTrack, battleGroup !== null);
}

export function setSfxMuted(muted: boolean): void {
  settings = saveAudioSettings({ sfxMuted: muted });
  getDefaultStore().set(sfxMutedAtom, settings.sfxMuted);
  if (muted) voices.clear();
}

export function setMusicMuted(muted: boolean): void {
  settings = saveAudioSettings({ musicMuted: muted });
  getDefaultStore().set(musicMutedAtom, settings.musicMuted);
  applyMusicVolumeLive();
  if (requestedTrack && !settings.musicMuted) requestMusic(requestedTrack, battleGroup !== null);
}

/** Test-only: tear down listeners without a scene shutdown. */
export function disposeAudio(): void {
  voices.clear();
  startupTimer?.remove(false);
  startupTimer = null;
  teardown?.();
  teardown = null;
}
