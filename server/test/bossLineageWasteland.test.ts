/**
 * Boss-lineage redesign — Wasteland (the necromancer, successor to Plains).
 * Wiring smoke: a Raise claims several weak risen at once; a stun on the Raise
 * wind-up staggers the boss; Bone Tithe stacks with living risen and reduces the
 * boss's damage taken; Harvest devours a risen for a permanent attack buff.
 */
import { applyStatusEffect, getStatusEffect } from '@mmo-idle/shared';
import type { World } from '../src/world/World';
import { updateBossScripts } from '../src/systems/combat/ai/bossScripts';
import { countRaisedBy } from '../src/systems/combat/ai/raiseDead';
import { BONE_TITHE_EFFECT_ID, monsterBoneTitheMult } from '../src/systems/combat/engine/monsterMechanics';
import { STUN_EFFECT } from '../src/systems/combat/status/stun';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { recordCorpse } from '../src/systems/world/corpses';
import { arena, assert, pin, runUntil } from './_bossLineageHarness';

initCombatSystems();
const BOSS = 'charnel-crown-sovereign';
const NODE = 'node-t4-graveyard-dungeon';

function seedCorpses(world: World, n: number): void {
  for (let i = 0; i < n; i++) {
    const body = world.createMonster(NODE, 'bone-crawler', { x: 2300 + i * 30, y: 2500 })!;
    recordCorpse(world, body);
    world.removeMonsterEntity(body.isMonster.id);
  }
}
const wipeAdds = (a: ReturnType<typeof arena>) => {
  for (const m of [...a.world.monsterEntitiesInNode(NODE)]) if (m !== a.boss) a.world.removeMonsterEntity(m.isMonster.id);
};

// ── Several risen per Raise ──────────────────────────────────────────────────
{
  const a = arena(BOSS, { x: 2400, y: 2400 }, { x: 2600, y: 2400 }, undefined, NODE);
  updateBossScripts(a.world, 0);
  wipeAdds(a); // the opening entourage is not what this checks
  seedCorpses(a.world, 5);
  runUntil(a, () => { pin(a.player, { x: 2600, y: 2400 }); return countRaisedBy(a.world, a.boss) > 0; }, 12_000);
  assert(countRaisedBy(a.world, a.boss) === 3, `a Raise claims three at once (got ${countRaisedBy(a.world, a.boss)})`);
}

// ── A stunned Raise staggers the boss ─────────────────────────────────────────
{
  const a = arena(BOSS, { x: 2400, y: 2400 }, { x: 2600, y: 2400 }, undefined, NODE);
  updateBossScripts(a.world, 0);
  wipeAdds(a);
  seedCorpses(a.world, 5);
  const casting = runUntil(a, () => {
    pin(a.player, { x: 2600, y: 2400 });
    return a.world.takeNodeEvents(NODE).some(e => e.kind === 'monster-cast-start' && e.label === 'Raise Dead');
  }, 12_000);
  assert(casting, 'the Raise is a visible wind-up');
  applyStatusEffect(a.boss.tracksCombat, { id: STUN_EFFECT, maxStacks: 1, remainingMs: 1500, refreshable: true, sourceId: 'test', data: { totalMs: 1500 } });
  runUntil(a, () => a.boss.recoversFromPattern !== undefined, 300);
  assert(a.boss.recoversFromPattern?.label === 'Raise Broken' && a.boss.recoversFromPattern.fromStagger,
    'a stunned Raise staggers the boss');
  assert(countRaisedBy(a.world, a.boss) === 0, 'and raises nothing');
}

// ── Bone Tithe and Harvest ───────────────────────────────────────────────────
{
  const a = arena(BOSS, { x: 2400, y: 2400 }, { x: 2600, y: 2400 }, undefined, NODE);
  updateBossScripts(a.world, 0);
  wipeAdds(a);
  seedCorpses(a.world, 8);
  a.boss.hasHealth.hp = Math.round(a.boss.hasHealth.maxHp * 0.5);
  runUntil(a, () => { pin(a.player, { x: 2600, y: 2400 }); return false; }, 2500);
  assert(a.boss.hasStatus.bossPhase === 'Bone Tithe', 'Bone Tithe is announced');
  const risen = countRaisedBy(a.world, a.boss);
  assert(risen >= 3, `Mass Resurrection raises a crowd (got ${risen})`);
  const tithe = getStatusEffect(a.boss.tracksCombat, BONE_TITHE_EFFECT_ID);
  assert(tithe && tithe.stacks === Math.min(6, risen), 'Bone Tithe stacks with the living risen');
  assert(monsterBoneTitheMult(a.boss) < 1, 'and cuts the damage it takes');

  a.boss.hasHealth.hp = Math.round(a.boss.hasHealth.maxHp * 0.2);
  const attack = a.boss.dealsDamage.attack;
  const devoured: string[] = [];
  a.world.takeNodeEvents(NODE);
  runUntil(a, () => {
    pin(a.player, { x: 2600, y: 2400 });
    for (const e of a.world.takeNodeEvents(NODE)) {
      if (e.kind === 'ecology-pulse' && !a.world.hasMonster(e.monsterId)) devoured.push(e.monsterId);
    }
    return a.boss.dealsDamage.attack > attack;
  }, 6000);
  assert(a.boss.hasStatus.bossPhase === 'Harvest', 'Harvest is announced');
  assert(a.boss.dealsDamage.attack > attack, 'Harvest grows its attack');
  assert(devoured.length >= 1, 'by devouring one of its risen');
}

console.log('bossLineageWasteland: ok');
