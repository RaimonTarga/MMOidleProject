import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { attackCue, castCue, statusCue } from '../../client/src/audio/routing';
import { ACCEPTED_SFX } from '../../client/src/audio/acceptedCatalog';
import { bossMusicPhase, ZONE_MUSIC, BOSS_MUSIC } from '../../client/src/audio/musicCatalog';
import { PRELOADED_SFX, SFX_MANIFEST, sfxFiles, sfxKey } from '../../client/src/audio/manifest';
import { VoiceBudget } from '../../client/src/audio/voiceBudget';
import { monsterDeathCue } from '../../client/src/audio/deathRouting';

assert.equal(attackCue('dot', 'magic', false, 'poison'), 'poison');
assert.equal(attackCue('dot', 'magic', false, 'frost'), 'ice');
assert.equal(attackCue('energy', 'magic'), 'spirit');
assert.equal(attackCue('energy', 'magic', true), 'spirit-empowered');
assert.equal(attackCue('cadence', 'slash', true), 'striker-empowered');
assert.equal(attackCue('cooldown', 'impact', true), 'squire-empowered');
assert.equal(attackCue(null, 'conduit-beam'), 'summon-hit');
assert.equal(castCue('cataclysm-impact', 'end', false), undefined);
assert.equal(castCue('cataclysm-cast', 'start'), undefined);
assert.equal(castCue('cataclysm-impact', 'end', true), 'cataclysm');
assert.equal(castCue('trench-current', 'end', true, 'Constrict'), 'constrict');
assert.equal(castCue('strong-kick', 'end', true, 'Devour'), 'devour');
assert.equal(statusCue({ id:'debuff-tundra-chill' }), undefined);
assert.equal(statusCue({ id:'debuff-plating-shred' }), undefined);
assert.equal(statusCue({ id:'debuff-dot', iconKey:'debuff-poison' }), 'poison-status');

// Eight summons at three attacks/sec get at most one shared cue per 300 ms.
const budget = new VoiceBudget();
const summon = {};
let count = 0;
const releases: (() => void)[] = [];
for (let ms = 0; ms < 10000; ms += 333) {
  for (const release of releases.splice(0)) release();
  for (let i = 0; i < 8; i++) {
    const release = budget.acquire(summon, ms, 300, 2, 0, () => {});
    if (release) { count++; releases.push(release); }
  }
}
assert.equal(count, 31);
let stopped = 0;
const tight = new VoiceBudget(2);
assert.ok(tight.acquire({}, 0, 0, 2, 0, () => stopped++));
assert.ok(tight.acquire({}, 0, 0, 2, 0, () => stopped++));
assert.equal(tight.acquire({}, 1, 0, 2, 0, () => {}), undefined);
assert.ok(tight.acquire({}, 1, 0, 1, 3, () => stopped++));
assert.equal(stopped, 1, 'major impact displaces a routine voice');
tight.clear();
assert.equal(stopped, 3, 'hidden/shutdown clears every voice');
for (const stems of Object.values(ACCEPTED_SFX)) {
  for (const stem of stems) assert.ok(existsSync(resolve(import.meta.dirname, '../../client/public/assets/audio/SFX/accepted', `${stem}.ogg`)), stem);
}
console.log('audioRouting: ok (routing, cancellations, shared summon budget, priorities, accepted assets)');

assert.equal(bossMusicPhase(20, 100, true, 2, true), 2);
assert.equal(bossMusicPhase(20, 100, true, 3, true), 3);
assert.equal(bossMusicPhase(100, 100, false, 4, true), 0);
assert.equal(bossMusicPhase(70, 100, true, 4, true), 1);
// Authored thresholds, not a fixed 50/25: Iron-Crest Titan phases at 65/50/25%,
// Dune-Throne Sovereign at 55/20%.
assert.equal(bossMusicPhase(70, 100, true, 4, true, 'iron-crest-titan'), 1, 'titan above its first phase');
assert.equal(bossMusicPhase(60, 100, true, 4, true, 'iron-crest-titan'), 2, 'titan escalates at 65%');
assert.equal(bossMusicPhase(25, 100, true, 4, true, 'iron-crest-titan'), 3, 'titan goes final at its last phase');
assert.equal(bossMusicPhase(22, 100, true, 4, true, 'dune-throne-sovereign'), 2, 'sovereign is not final until 20%');
assert.equal(bossMusicPhase(20, 100, true, 4, true, 'dune-throne-sovereign'), 3, 'sovereign final at 20%');
assert.equal(bossMusicPhase(20, 100, true, 4, false, 'dune-throne-sovereign'), 2, 'no final track, stays escalated');
assert.equal(sfxKey('attack-melee'), sfxKey('slash'), 'aliases share one decoded buffer');
assert.ok(sfxFiles(SFX_MANIFEST.kill)[0].includes('v48-humanoid-2'));
assert.ok(sfxFiles(SFX_MANIFEST.death)[0].includes('v34-player-death'));
for (const track of new Set([...Object.values(ZONE_MUSIC), ...Object.values(BOSS_MUSIC).flat()])) {
  assert.ok(existsSync(resolve(import.meta.dirname, '../../client/public/assets/audio/music/accepted', `${track}.ogg`)), track);
}
console.log('audioMusic: ok (tier phases, compatibility aliases, music files)');

// Music is normalized by role without clipping or flattening quiet approaches.
import { musicGain, musicVolume, ZONE_FADE_MS, BATTLE_FADE_MS } from '../../client/src/audio/musicMix';
import loudness from '../../client/src/audio/musicLoudness.json';
for (const [track, measurement] of Object.entries(loudness)) {
  const gain = musicGain(track);
  assert.ok(Number.isFinite(gain) && gain > 0);
  assert.ok(measurement.truePeakDb + 20 * Math.log10(gain) <= -3 + 1e-6, track);
}
assert.ok(ZONE_FADE_MS > BATTLE_FADE_MS);
assert.equal(musicVolume(0, 2, 0.5), 0, 'muting silences a partial fade');
assert.equal(musicVolume(0.5, 0.5, 0.4), 0.1, 'slider preserves envelope and normalization');
assert.equal(musicVolume(1, 2, 1), 1, 'maximum slider cannot exceed Phaser gain bounds');
console.log('audioMix: ok (51 measured gains, peak headroom, transition/master gain)');

// First enemy death must not silently trigger an on-demand download.
const bootAudio = new Set([...PRELOADED_SFX].flatMap(id =>
  sfxFiles(SFX_MANIFEST[id as keyof typeof SFX_MANIFEST]).map((_, i) => sfxKey(id as keyof typeof SFX_MANIFEST, i))));
assert.ok(bootAudio.has(sfxKey('kill')), 'preload the enemy-collapse buffer');
assert.notEqual(sfxKey('kill'), sfxKey('death'), 'enemy and player death stay distinct');
for (const [id, cue] of [
  ['tiny-slime', 'death-magic'], ['ironwood-golem', 'death-animal'],
  ['dust-djinn', 'death-animal'], ['forest-slime', 'death-animal'],
  ['cave-troll', 'death-humanoid'], ['cave-gargoyle', 'death-stone'],
  ['plague-hound', 'death-undead'], ['abyssal-serpent', 'death-aquatic'],
] as const) {
  assert.equal(monsterDeathCue(id), cue, id);
  assert.ok(bootAudio.has(sfxKey(cue)), `${cue} is ready on the first kill`);
  assert.ok(SFX_MANIFEST[cue].gain! <= 0.65);
  assert.ok(SFX_MANIFEST[cue].cooldownMs! >= 220);
}
assert.equal(monsterDeathCue(undefined), 'death-humanoid');
assert.equal(monsterDeathCue('tiny-slime', true), 'boss-death', 'boss takes precedence over body family');
assert.ok(bootAudio.has(sfxKey('boss-death')), 'first boss collapse is preloaded');
assert.deepEqual(ACCEPTED_SFX['boss-death'], ['v49-boss-3']);
assert.equal(SFX_MANIFEST['boss-death'].pitchVariance, 0, 'preserve the long collapse timing');
console.log('deathAudio: ok (families, legacy IDs, boss precedence, first-use preload, mix bounds)');

// Tutorial notifications must use the selected recordings on their first play.
for (const id of ['tutorial-ready', 'tutorial-action'] as const) {
  assert.deepEqual(sfxFiles(SFX_MANIFEST[id]), [`/assets/audio/SFX/ui/${id}.ogg`]);
  assert.ok(existsSync(resolve(import.meta.dirname, '../../client/public/assets/audio/SFX/ui', `${id}.ogg`)), id);
  assert.ok(bootAudio.has(sfxKey(id)), `${id} is preloaded before the guide starts`);
  assert.equal(SFX_MANIFEST[id].pitchVariance ?? 0, 0);
  assert.equal(SFX_MANIFEST[id].maxVoices, 1);
  assert.deepEqual(SFX_MANIFEST[id].fallback, [], 'no unselected placeholder tone');
}
assert.notEqual(sfxKey('tutorial-ready'), sfxKey('tutorial-action'));
console.log('tutorialAudio: ok (selected files, first-use preload, distinct cues)');
