/**
 * Boss-lineage redesign — Wasteland (the commander and its army; redesigned from the
 * 2026-09-27 playtest). Wiring smoke:
 *   - INVOCATION summons the entourage, bound to the boss;
 *   - the army never leashes or idles on its own while the boss fights;
 *   - the boss is ranged and hexes the player (cleansable Ruin, slow, anti-heal);
 *   - with no army left it walks to the corpses and raises them (Reclaim), its risen
 *     join the army and leave corpses again; a stunned raise staggers it;
 *   - Bone Tithe stacks with the living army;
 *   - HARVEST stops the raising and support: it devours corpses (then adds) for
 *     attack, and casts to kill.
 */
import { applyStatusEffect, getStatusEffect, HEX_OF_RUIN_EFFECT_ID, MONSTER_DATABASE, statusPolicyFor } from '@mmo-idle/shared';
import type { World } from '../src/world/World';
import { updateBossScripts } from '../src/systems/combat/ai/bossScripts';
import { bossAdds } from '../src/systems/combat/ai/bossAdds';
import { countRaisedBy } from '../src/systems/combat/ai/raiseDead';
import { runningBossPatternDef } from '../src/systems/combat/ai/bossPatterns';
import { BONE_TITHE_EFFECT_ID, monsterBoneTitheMult } from '../src/systems/combat/engine/monsterMechanics';
import { STUN_EFFECT } from '../src/systems/combat/status/stun';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { recordCorpse } from '../src/systems/world/corpses';
import { arena, assert, pin, runUntil } from './_bossLineageHarness';

initCombatSystems();
const BOSS = 'charnel-crown-sovereign';
const NODE = 'node-t4-graveyard-dungeon';
const SPOT = { x: 2600, y: 2400 };

function seedCorpses(world: World, n: number, at = { x: 2300, y: 2500 }): void {
  for (let i = 0; i < n; i++) {
    const body = world.createMonster(NODE, 'bone-crawler', { x: at.x + i * 30, y: at.y })!;
    recordCorpse(world, body);
    world.removeMonsterEntity(body.isMonster.id);
  }
}
const wipeAdds = (a: ReturnType<typeof arena>) => {
  for (const m of [...a.world.monsterEntitiesInNode(NODE)]) if (m !== a.boss) a.world.removeMonsterEntity(m.isMonster.id);
};
const stepName = (a: ReturnType<typeof arena>) => {
  const state = a.boss.runsBossPattern;
  const step = state ? runningBossPatternDef(a.boss)?.steps[state.stepIndex] : undefined;
  return step && 'name' in step ? step.name : step?.kind;
};

// ── Invocation, a coordinated army, and the hexes ────────────────────────────
{
  const def = MONSTER_DATABASE.get(BOSS)!;
  assert(def.behavior === 'ranged' && def.stats.attackRange >= 200, 'the Sovereign is a ranged caster');
  const a = arena(BOSS, { x: 2400, y: 2400 }, SPOT, undefined, NODE);
  a.world.takeNodeEvents(NODE);
  updateBossScripts(a.world, 0);
  const invoked = a.world.takeNodeEvents(NODE).some(e => e.kind === 'monster-cast-start' && e.label === 'Invocation');
  assert(invoked, 'it opens with the Invocation cast');
  runUntil(a, () => { pin(a.player, SPOT); return bossAdds(a.world, a.boss).length >= 5; }, 3000);
  const army = bossAdds(a.world, a.boss);
  // 3 Bone Crawlers (4 before 2026-09-27) + Plague Hound + Carrion Vulture.
  assert(army.length >= 5, `the Invocation summons its entourage (${army.length})`);
  assert(army.every(m => m.hasAggroTarget?.targetId === a.player.isPlayer.id), 'and the army shares its target');

  // Dragged far past its leash, an add keeps fighting instead of going home.
  const straggler = army[0]!;
  straggler.hasPosition.current = { x: straggler.controlsMonster.spawn.x + 1500, y: straggler.controlsMonster.spawn.y };
  runUntil(a, () => { pin(a.player, SPOT); return false; }, 600);
  assert(straggler.hasAggroTarget?.targetId === a.player.isPlayer.id && straggler.hasAwareness.state !== 'returning',
    'an add never leashes off on its own while its boss fights');

  // The hexes land, and Cleanse can take them.
  const hexed = runUntil(a, () => {
    pin(a.player, SPOT);
    return !!getStatusEffect(a.player.tracksCombat, HEX_OF_RUIN_EFFECT_ID) &&
      !!getStatusEffect(a.player.tracksCombat, 'slow') &&
      !!getStatusEffect(a.player.tracksCombat, 'antiheal');
  }, 12_000);
  assert(hexed, 'it hexes the player: Ruin, Grave Chill and Withering');
  const ruin = getStatusEffect(a.player.tracksCombat, HEX_OF_RUIN_EFFECT_ID)!;
  assert(statusPolicyFor(ruin.id, ruin.data).cleanse === 'full', 'the Hex of Ruin is cleansable');
}

// ── Reclaim: no army left, it goes to the bodies ─────────────────────────────
{
  const a = arena(BOSS, { x: 2400, y: 2400 }, SPOT, undefined, NODE);
  updateBossScripts(a.world, 0);
  runUntil(a, () => { pin(a.player, SPOT); return bossAdds(a.world, a.boss).length > 0; }, 3000);
  wipeAdds(a);
  const far = { x: 1800, y: 2400 };
  seedCorpses(a.world, 4, far);
  const before = Math.hypot(a.boss.hasPosition.current.x - far.x, a.boss.hasPosition.current.y - far.y);
  const raised = runUntil(a, () => { pin(a.player, SPOT); return countRaisedBy(a.world, a.boss) > 0; }, 10_000);
  const after = Math.hypot(a.boss.hasPosition.current.x - far.x, a.boss.hasPosition.current.y - far.y);
  assert(raised, 'with its army gone it raises the dead again');
  assert(after < before - 200, `by walking to the corpses first (${before.toFixed(0)} -> ${after.toFixed(0)})`);
  const risen = bossAdds(a.world, a.boss);
  assert(risen.every(m => m.controlsMonster.bossSpawnerId === a.boss.isMonster.id), 'its risen join the army');

  // A risen falling leaves a body behind: the army can come back again.
  const corpsesBefore = a.world.corpses.get(NODE)?.length ?? 0;
  recordCorpse(a.world, risen[0]!);
  assert((a.world.corpses.get(NODE)?.length ?? 0) === corpsesBefore + 1, 'its risen leave corpses again');
}

// ── A stunned raise staggers the boss ─────────────────────────────────────────
{
  const a = arena(BOSS, { x: 2400, y: 2400 }, SPOT, undefined, NODE);
  updateBossScripts(a.world, 0);
  runUntil(a, () => { pin(a.player, SPOT); return bossAdds(a.world, a.boss).length > 0; }, 3000);
  wipeAdds(a);
  seedCorpses(a.world, 5);
  const casting = runUntil(a, () => {
    pin(a.player, SPOT);
    return a.world.takeNodeEvents(NODE).some(e => e.kind === 'monster-cast-start' && e.label === 'Raise Dead');
  }, 12_000);
  assert(casting, 'the Raise is a visible wind-up');
  applyStatusEffect(a.boss.tracksCombat, { id: STUN_EFFECT, maxStacks: 1, remainingMs: 1500, refreshable: true, sourceId: 'test', data: { totalMs: 1500 } });
  runUntil(a, () => a.boss.recoversFromPattern !== undefined, 300);
  assert(a.boss.recoversFromPattern?.label === 'Raise Broken' && a.boss.recoversFromPattern.fromStagger,
    'a stunned Raise staggers the boss');
  assert(countRaisedBy(a.world, a.boss) === 0, 'and raises nothing');
}

// ── Bone Tithe, then the Harvest turn ────────────────────────────────────────
{
  const a = arena(BOSS, { x: 2400, y: 2400 }, SPOT, undefined, NODE);
  updateBossScripts(a.world, 0);
  runUntil(a, () => { pin(a.player, SPOT); return bossAdds(a.world, a.boss).length > 0; }, 3000);
  wipeAdds(a);
  seedCorpses(a.world, 8);
  a.boss.hasHealth.hp = Math.round(a.boss.hasHealth.maxHp * 0.5);
  runUntil(a, () => { pin(a.player, SPOT); return false; }, 2500);
  assert(a.boss.hasStatus.bossPhase === 'Bone Tithe', 'Bone Tithe is announced');
  const risen = countRaisedBy(a.world, a.boss);
  assert(risen >= 3, `Mass Resurrection raises a crowd (got ${risen})`);
  const tithe = getStatusEffect(a.boss.tracksCombat, BONE_TITHE_EFFECT_ID);
  assert(tithe && tithe.stacks === Math.min(6, risen), 'Bone Tithe stacks with the living risen');
  assert(monsterBoneTitheMult(a.boss) < 1, 'and cuts the damage it takes');

  seedCorpses(a.world, 3);
  a.boss.hasHealth.hp = Math.round(a.boss.hasHealth.maxHp * 0.2);
  const attack = a.boss.dealsDamage.attack;
  let fed = 0;
  let sawWrath = false;
  a.world.takeNodeEvents(NODE);
  runUntil(a, () => {
    pin(a.player, SPOT);
    for (const e of a.world.takeNodeEvents(NODE)) if (e.kind === 'boss-fx' && e.fx === 'harvest') fed++;
    const name = stepName(a);
    if (name === 'Grave Burst' || name === 'Bone Spear' || name === 'Soul Nova') sawWrath = true;
    return fed >= 2 && sawWrath;
  }, 12_000);
  assert(a.boss.hasStatus.bossPhase === 'Harvest', 'Harvest is announced');
  assert(a.boss.scriptsBoss?.raiseDisabled === true, 'it stops raising');
  assert(fed >= 2 && a.boss.dealsDamage.attack > attack, `it devours its dead for attack (${fed} fed)`);
  assert(sawWrath, 'and casts to kill');
}

console.log('bossLineageWasteland: ok');
