import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
import { composeMonsterView } from '@mmo-idle/shared';
import { createRenderState } from '../../client/src/render/state';
import { World } from '../src/world/World';
import { applyStun } from '../src/systems/combat/status/stun';
import { updateMonsterSlows } from '../src/systems/combat/status/monsterControl';
import { updateMonsters } from '../src/systems/combat/ai/ai';
import { updateCombatState } from '../src/systems/combat/engine/combatState';
import { setAttackTarget } from '../src/systems/combat/ai/targeting';

// Run the actual snapshot renderer without Phaser's DOM runtime. Observe both
// attack effects and body lunges; unrelated sprite maintenance is stubbed.
const file = join(__dirname, '../../client/src/render/monsters.ts');
const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
const upsert = source.statements.find(statement =>
  ts.isFunctionDeclaration(statement) && statement.name?.text === 'upsertMonster')!;
let effects = 0;
let lunges = 0;
const context = vm.createContext({
  exports: {},
  maybePlayLedgeHop: () => {},
  syncMonsterThroneTint: () => {},
  syncMonsterEcologyTells: () => {},
  syncConcealment: () => {},
  spawnAttackEffect: () => { effects++; },
  applyLunge: () => { lunges++; },
});
vm.runInContext(ts.transpileModule(upsert.getText(source), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText, context);
const render = context.exports.upsertMonster as typeof import('../../client/src/render/monsters').upsertMonster;

for (const ranged of [false, true]) {
  effects = lunges = 0;
  const world = new World();
  const monster = world.createMonster('node-5-5', 'plains-slime', { x: 400, y: 400 })!;
  const target = world.createMonster('node-5-5', 'plains-slime', { x: 410, y: 400 })!;
  setAttackTarget(world, monster, target.isMonster.id);
  const state = createRenderState();
  state.sprite.set(monster.isMonster.id, { x: 400, y: 400 } as never);
  state.sprite.set(target.isMonster.id, { x: 410, y: 400 } as never);
  state.interpolation.set(target.isMonster.id, { base: { x: 410, y: 400 }, lungeOffset: { x: 0, y: 0 } });
  state.spriteMeta.set(monster.isMonster.id, { skipFrameRefresh: true, monsterIsRanged: ranged } as never);
  const show = () => render(state, composeMonsterView(monster)!, {} as never);
  monster.performsAttack.lastAttackAt = 1000;
  show();
  assert.equal(effects, 1, 'normal attack plays');
  assert.equal(lunges, ranged ? 0 : 1);

  applyStun(monster.tracksCombat, 1000, 'test');
  for (let now = 1100; now <= 1900; now += 100) {
    updateMonsterSlows(world);
    updateMonsters(world, 100, now);
    assert.equal(composeMonsterView(monster)!.hardControlled, true, 'stun reaches client view');
    assert.equal(monster.performsAttack.lastAttackAt, now, 'AI holds cooldown while stunned');
    show();
  }
  assert.equal(effects, 1, 'stun cooldown updates never replay attack FX');
  assert.equal(lunges, ranged ? 0 : 1, 'stun never repeats body lunges');

  updateCombatState(world, 1100);
  updateMonsterSlows(world);
  assert.equal(composeMonsterView(monster)!.hardControlled, false);
  show();
  assert.equal(effects, 1, 'stun expiry does not replay a held cooldown update');
  monster.performsAttack.lastAttackAt = 3000;
  show();
  assert.equal(effects, 2, 'next attack resumes FX');
  assert.equal(lunges, ranged ? 0 : 2);
}
console.log('monsterStunAnimation: ok');
