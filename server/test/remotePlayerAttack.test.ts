import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import * as shared from '@mmo-idle/shared';
import * as interpolation from '../../client/src/render/interpolation';
import * as coords from '../../client/src/render/sceneCoords';
import { createRenderState } from '../../client/src/render/state';

// Execute the real combat dispatcher with graphics/audio endpoints replaced by
// recorders. Keep real shared rules and lunge state mutations; no browser/GPU.
const calls: string[] = [];
let enabled = true;
const code = ts.transpileModule(readFileSync(new URL('../../client/src/render/combatFx.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const exports: Record<string, any> = {};
runInNewContext(code, {
  exports, document: { hidden: false }, console,
  require(name: string) {
    if (name === '@mmo-idle/shared') return shared;
    if (name === './interpolation') return interpolation;
    if (name === './sceneCoords') return coords;
    return new Proxy({}, { get(_target, key: string) {
      if (key === 'shouldRunClientFx') return () => enabled;
      if (key === 'listenerGain') return () => 0.5;
      if (key === 'resolveAttackTint') return () => undefined;
      return (..._args: unknown[]) => { calls.push(key); };
    } });
  },
});
const state = createRenderState();
state.ownId = 'self';
state.sprite.set('self', { x: 100, y: 100 } as never);
const player = { id: 'friend', attackStyle: 'slash', combatArchetype: 'cadence', selectedRange: 'melee', passives: {} };
state.view.set('friend', player as never);
state.sprite.set('friend', { x: 100, y: 100 } as never);
state.sprite.set('mob', { x: 140, y: 100, displayWidth: 32, displayHeight: 32 } as never);
state.interpolation.set('friend', { base: { x: 100, y: 100 }, lungeOffset: { x: 0, y: 0 } });
state.interpolation.set('mob', { base: { x: 140, y: 100 }, lungeOffset: { x: 0, y: 0 } });
const scene = { state, myId: 'self', tweens: { killTweensOf() {}, add() {} } };
const hit = { kind: 'player-hit', playerId: 'friend', targetId: 'mob', damage: 10, effects: [shared.ABILITY_SWEEP_FX] };
exports.dispatchCombatEvent(state, hit, scene);
assert(calls.includes('fxSweep'), 'remote confirmed hit includes technique FX');
assert(state.interpolation.get('friend')!.lungeOffset.x > 0, 'remote melee attack lunges toward target');
assert(!calls.includes('activateLaserBeam'));

// A delayed killing hit retains its captured target after removal.
state.sprite.delete('mob');
state.interpolation.delete('mob');
calls.length = 0;
exports.dispatchCombatEvent(state, hit, scene, { player, from: { x: 100, y: 100 }, to: { x: 140, y: 100 }, targetBase: { x: 140, y: 100 }, targetSize: 32 });
assert(calls.includes('fxSweep'));

state.sprite.set('mob', { x: 140, y: 100 } as never);
for (const effects of [['flash-teleport'], ['channel-beam']]) {
  calls.length = 0;
  exports.dispatchCombatEvent(state, { ...hit, effects }, scene);
  assert(!calls.includes('activateHolyBeam'), 'remote channel cannot activate own beam');
  assert(!calls.includes('snapPlayerToServerTarget'), 'remote teleport cannot run local prediction');
}
state.view.set('friend', { ...player, combatArchetype: 'reload', passives: { 'reload.laser': 1 } } as never);
calls.length = 0;
exports.dispatchCombatEvent(state, hit, scene);
assert(!calls.includes('activateLaserBeam'), 'remote laser cannot activate own beam');
state.view.set('friend', { ...player, summonsMinions: 1 } as never);
calls.length = 0;
exports.dispatchCombatEvent(state, hit, scene);
assert.equal(calls.length, 0, 'summons retain their own attack renderer');
state.view.set('friend', player as never);
enabled = false;
exports.dispatchCombatEvent(state, hit, scene);
assert.equal(calls.length, 0, 'hidden/resync state suppresses FX');
console.log('remotePlayerAttack: ok');
