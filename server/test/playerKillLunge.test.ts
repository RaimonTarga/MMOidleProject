import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
import * as shared from '@mmo-idle/shared';
import { createRenderState } from '../../client/src/render/state';
import { nodeToScene } from '../../client/src/render/sceneCoords';
import type { PlayerAttackPresentation } from '../../client/src/render/combatFx';
import type { GameScene } from '../../client/src/scenes/GameScene';

// Execute the real capture/attack/lunge functions without loading Phaser's DOM
// runtime. Only unrelated drawing effects are stubbed; tween creation is observed.
function declarations(file: string, names: string[]): string {
  const source = ts.createSourceFile(file, readFileSync(join(__dirname, file), 'utf8'), ts.ScriptTarget.Latest, true);
  return source.statements.filter(statement =>
    (ts.isFunctionDeclaration(statement) && names.includes(statement.name?.text ?? '')) ||
    (ts.isVariableStatement(statement) && statement.declarationList.declarations.some(declaration =>
      ts.isIdentifier(declaration.name) && declaration.name.text.endsWith('_CLIENT_EFFECT'))),
  ).map(statement => statement.getText(source)).join('\n');
}
const context = vm.createContext({
  ...shared, exports: {}, nodeToScene,
  resolveAttackTint: () => undefined,
  transientElement: () => undefined,
  playEmpoweredRing: () => {},
  resolveAttackFx: () => () => {},
});
vm.runInContext(ts.transpileModule([
  declarations('../../client/src/render/combatFx.ts', ['capturePlayerAttack', 'runFxForAttackStyle']),
  declarations('../../client/src/render/interpolation.ts', ['applyLunge']),
].join('\n'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, context);
const { capturePlayerAttack, runFxForAttackStyle } = vm.runInContext(
  '({ capturePlayerAttack, runFxForAttackStyle })', context,
) as {
  capturePlayerAttack: typeof import('../../client/src/render/combatFx').capturePlayerAttack;
  runFxForAttackStyle: (state: ReturnType<typeof createRenderState>, event: shared.CombatEvent,
    scene: GameScene, presentation?: PlayerAttackPresentation) => void;
};

const state = createRenderState();
const player = { combatArchetype: 'cadence', attackStyle: 'slash', passives: {},
  selectedRange: null } as unknown as shared.PlayerView;
state.view.set('player', player);
state.sprite.set('player', { x: 100, y: 100 } as never);
// Sprite visual height must not change the node-space lunge direction.
state.sprite.set('target', { x: 200, y: 70, displayWidth: 32, displayHeight: 32 } as never);
state.interpolation.set('player', { base: { x: 100, y: 100 }, lungeOffset: { x: 0, y: 0 } });
const targetBase = { x: 200, y: 100 };
state.interpolation.set('target', { base: targetBase, lungeOffset: { x: 0, y: 0 } });
const event = { kind: 'player-hit', playerId: 'player', targetId: 'target', targetName: 'Target',
  damage: 10, empowered: false, execution: false } as const;
const presentation = capturePlayerAttack(state, event)!;
assert(presentation);
let tweens = 0;
const scene = { tweens: { killTweensOf: () => {}, add: (config: { x: number; y: number; duration: number; delay: number }) => {
  tweens++;
  assert.equal(config.x, 0);
  assert.equal(config.y, 0);
  assert.equal(config.delay, 60);
  assert.equal(config.duration, 200);
} } } as unknown as GameScene;

// Surviving targets still use their current interpolation, not the buffered point.
targetBase.x = 100;
targetBase.y = 200;
runFxForAttackStyle(state, event, scene, presentation);
assert.equal(state.interpolation.get('player')!.lungeOffset.x, 0);
assert.equal(state.interpolation.get('player')!.lungeOffset.y, 26);

// A killing delta removes both maps before playback. The saved position must
// survive removal AND later mutations of the original interpolation object.
state.sprite.delete('target');
state.interpolation.delete('target');
runFxForAttackStyle(state, event, scene, presentation);
assert.equal(tweens, 2, 'killing blow still starts a lunge');
assert.equal(state.interpolation.get('player')!.lungeOffset.x, 26);
assert.equal(state.interpolation.get('player')!.lungeOffset.y, 0);

// Ranged attacks retain their existing no-lunge behavior after target removal.
const ranged = { ...presentation, player: { ...player, combatArchetype: 'reload' as const } };
runFxForAttackStyle(state, event, scene, ranged);
assert.equal(tweens, 2, 'ranged killing blows do not lunge');
console.log('playerKillLunge: ok');
