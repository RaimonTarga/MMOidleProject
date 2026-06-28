# Audio / Sound Engine — Current State

Client-only sound layer: combat **SFX** + per-biome **background music**, with separate
SFX/Music volume controls in Settings.

> **🔨 IMPLEMENTED 2026-06-28** — engine, manifest, persisted settings, combat-event SFX
> triggers, biome-driven music, and the Settings → Audio tab. Ships with **synthesized
> fallback cues only**; no real audio files exist yet (drop them in per the manifest to
> switch over). Music is silent until tracks are added.

## TL;DR

A scene-independent singleton ([client/src/audio/audioEngine.ts](../client/src/audio/audioEngine.ts))
wraps Phaser's WebAudio sound manager. SFX fire from the existing combat-event dispatcher
([combatFx.ts](../client/src/render/combatFx.ts)); music crossfades when the player's biome
group changes (subscribed to `playerNodeIdAtom`). Volumes/mutes persist to localStorage and
bind to the Settings UI via Jotai atoms. Pure client presentation — **no server or shared
changes**, no new dependencies.

## How it works

- **Manifest** ([client/src/audio/manifest.ts](../client/src/audio/manifest.ts)): the
  declarative catalog.
  - `SFX_MANIFEST: Record<SfxId, SfxDef>` — ids: `attack-melee`, `attack-ranged`,
    `attack-magic`, `take-damage`, `kill`, `dodge`, `death`, `empowered`, `pack-call`. Each has
    an optional `file` (a single path **or an array of variant paths** — the engine picks one at
    random per play), a `fallback` (array of `SynthTone` oscillator notes), and two per-play
    randomizers: `gainVariance` (± volume) and `pitchVariance` (± playback rate/pitch). Three
    de-sameness levers stack: random variant + gain jitter + pitch jitter (set on the combat
    cues; omitted on the one-off death sting).
  - `MUSIC_MANIFEST: Partial<Record<string, string>>` — biome group → track path, keyed off
    `BIOME_TEXTURES` (clearing, forest, plains, swamp, mountain, cave, jungle, tundra, desert,
    volcanic, graveyard, trench, abyss). All `undefined` until files land.
  - `sfxKey(id)` / `musicKey(group)` produce Phaser cache keys; `AUDIO_SFX_DIR` /
    `AUDIO_MUSIC_DIR` are the path conventions (`/assets/audio/sfx`, `/assets/audio/music`).

- **Settings** ([client/src/audio/audioSettings.ts](../client/src/audio/audioSettings.ts)):
  `AudioSettings { sfxVolume, musicVolume, sfxMuted, musicMuted }` (volumes 0–1), persisted
  under `mmo_audio_settings_v1` (defaults 0.6 SFX / 0.4 Music). Mirrors the shape of
  `gameplaySettings.ts`. Exposes Jotai atoms (`sfxVolumeAtom`, `musicVolumeAtom`,
  `sfxMutedAtom`, `musicMutedAtom`) seeded from storage for the UI.

- **Engine** ([client/src/audio/audioEngine.ts](../client/src/audio/audioEngine.ts)): module
  singleton (not a scene member) so React Settings and the node→music subscription reach it
  without a scene handle.
  - `initAudio(scene)` — called once from `createGameScene`. Captures the scene, subscribes to
    `playerNodeIdAtom` → maps node id to `NODE_BIOMES[nodeId].biomeGroup` → `setMusicForBiome`,
    and registers a `visibilitychange` listener that pauses/resumes music while the tab is
    hidden. Cleans up on scene `SHUTDOWN`.
  - `playSfx(id)` — throttled per-id (`SFX_THROTTLE_MS = 70`, so 5 Hz hit bursts and shotgun
    pellet volleys collapse to one cue); no-ops when muted, at zero volume, or `document.hidden`.
    Plays the loaded Phaser sound if `scene.cache.audio.exists(key)`, else synthesizes the
    `fallback` via Phaser's WebAudio context. Applies the cue's `gainVariance` (volume) and
    `pitchVariance` (Phaser `rate` / synth freq scale) per play. Accepts `opts.gainMult` (0–1)
    for positional attenuation.
  - `setMusicForBiome(group)` — crossfade (`MUSIC_FADE_MS = 800`): tweens the old track out +
    destroys it, starts the new one looping faded-in. No-op if same group or no file.
  - `setSfxVolume / setMusicVolume / setSfxMuted / setMusicMuted` — persist + update the atom +
    apply live (music volume/mute updates the playing track immediately; SFX volume is read at
    each `play()`).

- **Preload + init** ([client/src/scenes/game/sceneSetup.ts](../client/src/scenes/game/sceneSetup.ts)):
  `preloadGameAssets` loops the manifests and `scene.load.audio(...)` **only entries with a
  real `file`** (undefined ones are skipped → no 404 noise). `createGameScene` calls
  `initAudio(scene)` after the other `init*` calls.

- **SFX triggers** ([combatFx.ts](../client/src/render/combatFx.ts) `dispatchCombatEvent`,
  reusing its existing own-player + `shouldRunClientFx()` gating):
  - `player-hit` (own): `empowered`/`execution` → `empowered`, else `attackSfxFor(archetype,
    style)` (reload→ranged, energy/dot→magic, cadence/cooldown/summoner→melee, else by style).
  - `monster-hit` where `targetId === scene.myId` → `take-damage`.
  - `player-kill` → `kill`; `monster-dodge` / own `player-evade` → `dodge`.
  - `ecology-pulse` with `pulse === 'pack-call'` → `pack-call` (node-wide, paired with the ring FX).
  - `death` is fired from `onPlayerDied` in [sceneSetup.ts](../client/src/scenes/game/sceneSetup.ts).
- **Spatialized other-entity SFX**: own-player combat comes through the event path above at full
  volume. **Other players, monsters, and minions** attack through the snapshot-driven
  `spawnAttackEffect` ([combatFx.ts](../client/src/render/combatFx.ts)), which now plays the
  attacker's attack cue attenuated by `listenerGain` — full within `SFX_FALLOFF_INNER_PX` (300) of
  the local player, fading to silent by `SFX_FALLOFF_OUTER_PX` (1150), so off-screen sources read
  as faint. Distance attenuation only (no stereo pan). Before this, those attacks were silent.

- **Settings UI** ([client/src/hud/settings/SettingsPanel.tsx](../client/src/hud/settings/SettingsPanel.tsx)):
  a third **Audio** tab (alongside Controls/Gameplay) with enable toggles + volume sliders for
  SFX and Music, bound to the audio atoms and calling the engine setters. Reuses existing
  `settings-slider-row` / `settings-toggle-row` CSS. The SFX slider previews a cue on release.

## Decisions & rationale

- **Reuse Phaser's sound manager** rather than a standalone WebAudio engine: the asset/preload
  pipeline, autoplay-unlock, and a WebAudio context already exist. The synth fallback borrows
  that same context (no second `AudioContext`).
- **Singleton, not a scene member**: Settings React code and the `playerNodeIdAtom` subscription
  must drive audio without a Phaser handle, and music must survive node transitions.
- **Per-id throttle in the engine**, not at call sites: combat events arrive at 5 Hz in bursts
  (multi-hit, pellet volleys), so call sites stay dumb and the engine de-spams.
- **Explicit tab-visibility handling**: Phaser's own blur-pause is intentionally disabled in
  [main.ts](../client/src/main.ts) (to avoid rubber-banding on HUD clicks), so the engine pauses
  music + skips SFX on `document.hidden` itself.
- **Optional `file`, synth fallbacks**: the game is audible before any assets exist, and adding a
  real file is a one-line manifest edit with zero engine changes.

## Adding real audio files

1. Drop the file in `client/public/assets/audio/SFX/<name>` (or `.../music/<group>.ogg` for
   music). **Folder casing matters** — production serves from a case-sensitive filesystem, so
   the manifest's `AUDIO_SFX_DIR` (`/assets/audio/SFX`) must match the real folder exactly.
2. Set the matching `file` in the manifest — a single path, or an array of variant paths for a
   randomly-chosen sample (`SFX_MANIFEST[id].file` or `MUSIC_MANIFEST[group]`).
3. The preloader registers each variant and the engine prefers loaded files over the synth
   fallback automatically.

**Format guidance**: OGG Vorbis ~96–112 kbps, mono/low-stereo for ambient beds, ~3–5 MB per
track. Use **seamless 2–5 min loops**, not long-form tracks — the engine plays music with
`loop: true`, so a long file just adds bytes for no benefit.

## Known gaps / next steps

- **No real assets yet** — synth cues for SFX, silence for music.
- **Music preloads eagerly**: `preloadGameAssets` loads *all* registered music at boot. Once the
  full 13-biome set exists (~50 MB), switch to **lazy-load on biome entry** (load the one track
  inside `setMusicForBiome`, cache after first load) so unreached late-tier biomes don't bloat
  first load.
- No distinct per-archetype/per-weapon SFX variety yet (one cue per melee/ranged/magic bucket).
- No UI/menu SFX (clicks, crafting, level-up) — only combat + death are wired.
- **Spatial SFX is distance-only (no stereo pan)**, and the per-id throttle is global: in a
  crowded node, all (say) `attack-melee` plays across every source collapse to one per
  `SFX_THROTTLE_MS`, and the surviving play carries whatever `gainMult` fired first — a faint far
  hit can win over a loud near one. Acceptable for ambiance; if it matters, make the throttle
  prefer the loudest within its window and/or add WebAudio stereo panning.
- No music ducking under loud SFX.
