# Audio current state

Accepted listening-study music and effects are wired into the client. No server combat or timing changes.

## Catalog and routes

- `client/src/audio/acceptedCatalog.ts`: accepted sound families with versioned filenames preserved. The game serves Ogg Vorbis copies; lossless WAV masters live in `art/audio/sfx-masters/` and are not served. Superseded masters remain available for comparison.
- Routine combat effects plus hurt/player death/dodge/empowered and all seven creature/boss death cues load with the game (`PRELOADED_SFX` in `manifest.ts`). Every other effect is fetched the first time it plays, and that first play is silent.
- `musicCatalog.ts`: 13 zone assignments and 11 boss suites, 51 Ogg exports including the two volcanic final-cast cues. Plains uses the accepted pulse alternative; Sanctuary uses Starlight Refuge.
- `routing.ts`: distinct class basics, class empowered hits, monster attack styles, named cast releases, ecology and boss cues. Unknown monster styles use the accepted blunt family. Generic DoT ticks, ordinary chill stacks and plating erosion stay silent.
- Player status audio fires on semantic onset. Conduit owner events do not duplicate the minion attack path. All summons share a 300 ms cooldown and two-voice limit.
- Shared SFX budget: 12 voices; major death/cataclysm cues can displace ordinary attacks. Repeated sounds use small gain/pitch variations. Distant sources attenuate; ordinary monster/minion attacks sit below the local player.
- Accepted provenance hashes live beside assets in `client/public/assets/audio/accepted-provenance.json`.

## Creature death audio

Accepted v48/v49 selections: Magic A (`v48-magic-1`), Animal B (`v48-animal-2`), Humanoid B (`v48-humanoid-2`), Undead B (`v49-undead-2`), Stone A (`v49-stone-1`), Aquatic B (`v49-aquatic-2`), and Boss C / Ancient Husk (`v49-boss-3`). Ordinary cues last about 1.0–1.2 seconds; Ancient Husk crumbles away over 3.25 seconds, without pitch randomization.

`deathRouting.ts` selects body families using explicit monster-type overrides and an animal default for ordinary fauna. Legacy identifiers such as `tiny-slime` (Tiny Wisp), `ironwood-golem` (Ironclaw Badger), and `dust-djinn` (Sun Scarab) are treated according to current identity. Unknown/missing captured identity uses the humanoid cue when no type ID is available. Player death remains separate.

The existing local/watched-player confirmed-kill path owns normal death sounds, including summon and DoT kills. Buffered attacks capture the monster type before entity removal so the later kill cue retains its family. Nearby deaths credited to other players do not add normal death sounds. Bosses retain their existing immediate/buffered removal presentation paths, now using Ancient Husk instead of the previous sting; the kill-event path skips them to avoid double playback. No new audio is attached to arbitrary ordinary-monster removals or zone changes.

Normal dispersal uses gain 0.65, 220 ms per-family cooldown, two concurrent voices per family, priority 1, and small gain/pitch variation. The boss uses gain 0.65, priority 3 and one voice. All obey the shared 12-voice budget and saved mute/volume settings. Preloading every death family prevents the previous first-kill silent download.

## Music

Music loads on demand when enabled; entering a boss encounter preloads its suite. In a dungeon the altar drives the suite: the dormant altar plays the approach (anticipation) track, activating it starts the battle track, and the boss's HP phases escalate it. Server snapshots choose approach/battle/escalation/final at each boss's own authored HP phase thresholds (`bossMusicPhase`); the last of two or more phases takes the final track. Bosses without HP phases fall back to 50%/25%, with the quarter phase only at tier 3+. A shared audio-clock timeline supplies the seek position when battle variations change. Lower-tier bosses do not acquire new gameplay phases.

The current checkout still authors an 8-second Cataclysm wind-up. Its presentation uses the ending portion of the accepted buildup. The accepted 22/26-second versions are selected for those runtime cast durations when that gameplay branch lands. There is no final musical impact note; the accepted Cataclysm SFX voices the actual impact. This is not a combat timing change.

Tundra uses the accepted climax for the intensified stage; Volcano keeps the accepted eruption at 50% and switches to the final-cast cue on the cast event. No unapproved intermediate composition was invented.

## Playtesting and limits

Settings > Audio enables effects and music; saved opt-ins and muted defaults are preserved. Development builds support `?audioDebug=1` for console playback diagnostics. Spectator audio remains disabled by the existing scene policy.

Focused verification: `pnpm --filter @mmo-idle/server exec tsx --conditions=development test/audioRouting.test.ts`, client build, workspace typecheck. The routing test checks cancellation, class/element identity, tier phase selection, shared summon throttling, priority displacement and every catalog file. It is not subjective listening evidence or a run through every boss.

This is the first integrated mix. Some granular impacts without a distinct authoritative presentation event reuse their existing attack/cast family rather than predicting gameplay. Full high-speed class and boss listening remains the next playtest pass; accepted assets remain available for adjustments.

Settings retain `mmo_audio_settings_v3`, SFX volume 0.3 and music volume 0.2, both muted by default. Phaser owns the shared WebAudio context and autoplay unlock; React/Jotai settings call the scene-independent engine. Scene shutdown removes subscriptions and releases playback. Spatial attenuation remains distance-only (300–1150 px), without stereo panning or music ducking. Shared family throttles can suppress a nearby attack following a distant attack within the same short window.

## Zone transitions and loudness

Zone/approach transitions use a 2.6-second smooth crossfade; same-battle phase changes use 600 ms and retain the playhead. The outgoing track remains until the incoming file is ready. Rapid changes retarget all active envelopes from their current levels. Volume/mute controls scale those envelopes instead of canceling them.

All 51 shipped Ogg files were measured with FFmpeg loudnorm (integrated LUFS and true peak); measurements are in `musicLoudness.json`. Runtime static gain aims for -22 LUFS zones, -27 approaches, -20 battles and -19 finales/cast buildups, capped at +6 dB boost and -3 dBTP per-track headroom. Shared zone/approach tracks retain their zone target. The masters and loop durations are unchanged; internal dynamics and SFX family balance are preserved. Measurements apply before the user's music volume setting.

## Gentle login and sidebar controls

The first requested track in a game scene waits seven seconds, then fades from silence to the saved level over six seconds. Requests during the delay replace the pending track, so only the current area's music starts. Later zone and boss transitions keep their normal fade durations. Muted or backgrounded sessions do not start a new track; the scene-owned startup timer is canceled on shutdown.

The collapsible Audio panel follows Materials in the right sidebar, before the updates/playtest footer. Music and effects controls use the same persisted settings and Jotai atoms as Settings > Audio. Its expanded preference is stored separately as `mmo_idle.desktop.audio_expanded`.
