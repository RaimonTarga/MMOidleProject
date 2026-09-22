import assert from 'node:assert/strict';
import { ambientStackFlashTint, AMBIENT_STACK_FLASH_MS, type AmbientStackFlash } from '../../client/src/render/ambientStackFlash';

for (const effectId of ['volcanic-heat', 'tundra-chill'] as const) {
  const flash: AmbientStackFlash = { effectId, startedAt: 100, nodeId: 'node' };
  const peak = ambientStackFlashTint(flash, 100, 0xffffff)!;
  const fading = ambientStackFlashTint(flash, 190, 0xffffff)!;
  assert.notEqual(peak, 0xffffff, 'gain briefly colors the sprite');
  assert.notEqual(fading, peak, 'color fades between snapshots');
  if (effectId === 'volcanic-heat') assert((peak >>> 16) > (peak & 255), 'Heat is red');
  else assert((peak & 255) > (peak >>> 16), 'Chill is light blue');
  assert.equal(ambientStackFlashTint(flash, 100 + AMBIENT_STACK_FLASH_MS, 0xffffff), null, 'pulse ends promptly');
  assert.equal(ambientStackFlashTint(flash, 10_000, 0xffffff), null, 'background time never replays a stale pulse');
  assert.notEqual(ambientStackFlashTint(flash, 190, 0x8899cc), fading, 'fade composes with current aura tint');
  const repeat = { ...flash, startedAt: 1100 };
  assert.equal(ambientStackFlashTint(repeat, 1100, 0xffffff), peak, 'next vent gain starts a fresh pulse');
  assert.equal(ambientStackFlashTint(repeat, 1280, 0xffffff), null, 'repeated pulses do not lengthen');
}
console.log('ambientStackFlash: ok');
