import { MONSTER_DATABASE, applyStatusEffect, composeMonsterView, removeStatusEffect } from '@mmo-idle/shared';
import { attachComponent } from '../src/ecs/markerHelpers';
import {
  EMPOWERED_COOLDOWN_TELL_MS, monsterEmpoweredMultiplier,
} from '../src/systems/combat/engine/monsterMechanics';
import { syncMonsterStateMirror } from '../src/systems/combat/engine/monsterStateMirror';
import { World } from '../src/world/World';

// Lasting mob states reach the renderer for EVERY monster (not only targeted ones):
// a casted haste as `hastedBy` with its remaining charges, a closed shell as
// `shelled` (both driven through the real World tick, so the call order is covered
// too), and the `primed` tell before an empowered hit.

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const NODE = 'node-5-5';

// Haste: the strongest casted haste is published with its charges, and cleared.
{
  const world = new World();
  const spitter = world.createMonster(NODE, 'canopy-sprite', { x: 400, y: 400 });
  assert(!!spitter, 'test needs a Thorn Spitter');
  applyStatusEffect(spitter!.tracksCombat, {
    id: 'thorn-spitter-barrage', maxStacks: 3, remainingMs: -1, refreshable: true,
    sourceId: spitter!.isMonster.id,
    data: { monsterAttackSpeedBuff: 1, attackSpeedPct: 2, attacksRemaining: 3 },
  }).stacks = 3;
  world.tick(100, 1_000);
  assert(
    spitter!.hasStatus.hastedBy?.effectId === 'thorn-spitter-barrage' && spitter!.hasStatus.hastedBy.stacks === 3,
    'a casted Barrage should publish its effect id and remaining charges',
  );
  assert(composeMonsterView(spitter!)?.hastedBy?.stacks === 3, 'the monster view should carry the haste');

  removeStatusEffect(spitter!.tracksCombat, 'thorn-spitter-barrage');
  world.tick(100, 1_100);
  assert(!('hastedBy' in spitter!.hasStatus), 'a spent haste should remove the key');
}

// Shell: a Snapper under half HP casts Shell Up, is published shelled, then opens.
{
  const world = new World();
  const snapper = world.createMonster(NODE, 'swamp-hydra', { x: 400, y: 400 });
  assert(!!snapper, 'test needs a Moss-Shell Snapper');
  snapper!.hasHealth.hp = Math.floor(snapper!.hasHealth.maxHp * 0.4);
  world.tick(100, 1_000);
  assert(snapper!.hasStatus.shelled === undefined, 'the Shell Up wind-up is not yet a shell');
  world.tick(100, 1_600);
  assert(snapper!.hasStatus.shelled === true, 'a closed shell should publish shelled');
  world.tick(100, 5_500);
  assert(!('shelled' in snapper!.hasStatus), 'an opened shell should remove the key');
}

// Primed: the tell before an empowered hit. The hits are consumed through the REAL
// multiplier, so the read-only predicate cannot drift from the rules it mirrors.
function engaged(world: World, typeId: string, sinceMs: number) {
  const monster = world.createMonster(NODE, typeId, { x: 400, y: 400 })!;
  assert(!!monster, `test needs a ${typeId}`);
  attachComponent(world, monster, 'hasAggroTarget', {
    targetId: 'p', targetKind: 'player', lastAggroAt: sinceMs, sinceMs,
  });
  return monster;
}

{
  // Opening strike (Hunting Panther): primed until the first hit spends it.
  const world = new World();
  const panther = world.createMonster(NODE, 'hunting-panther', { x: 400, y: 400 })!;
  syncMonsterStateMirror(world, 1_000);
  assert(panther.hasStatus.primed === undefined, 'an idle ambusher should not glow');
  attachComponent(world, panther, 'hasAggroTarget', { targetId: 'p', targetKind: 'player', lastAggroAt: 1_000, sinceMs: 1_000 });
  syncMonsterStateMirror(world, 1_000);
  assert(panther.hasStatus.primed === true, 'an engaged ambusher with its opener unspent should be primed');
  const def = MONSTER_DATABASE.get('hunting-panther');
  assert(monsterEmpoweredMultiplier(panther, def, 1_500) > 1, 'precondition: the opener fires');
  syncMonsterStateMirror(world, 1_500);
  assert(!('primed' in panther.hasStatus), 'a spent opener should clear primed');
}

{
  // Cadence finisher (Granite Mammoth, every 4th): primed exactly before the 4th.
  const world = new World();
  const mammoth = engaged(world, 'granite-mammoth', 1_000);
  const def = MONSTER_DATABASE.get('granite-mammoth');
  const every = def!.cadenceFinisher!.everyNAttacks;
  for (let i = 1; i < every; i++) {
    syncMonsterStateMirror(world, 1_000 + i);
    assert(mammoth.hasStatus.primed === undefined, `hit ${i} of ${every} should not be primed`);
    assert(monsterEmpoweredMultiplier(mammoth, def, 1_000 + i) === 1, `hit ${i} should be ordinary`);
  }
  syncMonsterStateMirror(world, 2_000);
  assert(mammoth.hasStatus.primed === true, 'the swing before the finisher should be primed');
  assert(monsterEmpoweredMultiplier(mammoth, def, 2_000) > 1, 'and that swing should be the finisher');
  syncMonsterStateMirror(world, 2_001);
  assert(!('primed' in mammoth.hasStatus), 'the finisher should clear primed');
}

{
  // Empowered cooldown (Cragback Rhino): the tell leads the timer.
  const world = new World();
  const rhino = engaged(world, 'cragback-rhino', 1_000);
  const cooldownMs = MONSTER_DATABASE.get('cragback-rhino')!.empoweredCooldown!.cooldownMs;
  syncMonsterStateMirror(world, 1_000);
  assert(rhino.hasStatus.primed === undefined, 'a fresh cooldown should not be primed');
  syncMonsterStateMirror(world, 1_000 + cooldownMs - EMPOWERED_COOLDOWN_TELL_MS);
  assert(rhino.hasStatus.primed === true, 'the cooldown hit should be primed ahead of time');
}

console.log('monsterStateMirror: ok');
