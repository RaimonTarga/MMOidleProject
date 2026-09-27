/**
 * Boss-lineage redesign — Jungle (pursuit and failed escape).
 * Wiring smoke: an escaped flee ends in an ambush and a Frenzy burst; a root on
 * the T3 flee is a <=1s stumble; the T4 snare flee drops thorn snares that root a
 * chaser; below 30% the T4 predator stops fleeing; a cornered boss still finds an
 * escape line (the corner bug).
 */
import { getStatusEffect } from '@mmo-idle/shared';
import { fleeDestination } from '../src/systems/combat/ai/bossFlee';
import { updateBossScripts } from '../src/systems/combat/ai/bossScripts';
import { runningBossPatternDef } from '../src/systems/combat/ai/bossPatterns';
import { BOSS_FRENZY_EFFECT_ID, monsterAttackCooldown } from '../src/systems/combat/engine/monsterMechanics';
import { applyMonsterRoot } from '../src/systems/combat/status/monsterControl';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import type { RuntimeToxicPool } from '../src/systems/world/groundZones';
import { arena, assert, NODE, pin, runUntil } from './_bossLineageHarness';

initCombatSystems();

const kind = (a: ReturnType<typeof arena>) => {
  const state = a.boss.runsBossPattern;
  return state ? runningBossPatternDef(a.boss)?.steps[state.stepIndex]?.kind : undefined;
};

// ── T2: escape -> stalk -> ambush -> frenzy ──────────────────────────────────
{
  const a = arena('jungle-dread-gorger', { x: 2400, y: 2400 }, { x: 2440, y: 2400 });
  const frenzied = runUntil(a, () => {
    pin(a.player, a.player.hasPosition.current); // stands still: the boss gets away
    return getStatusEffect(a.boss.tracksCombat, BOSS_FRENZY_EFFECT_ID) !== undefined;
  }, 25_000);
  assert(frenzied, 'a successful escape ends in an ambush and a Frenzy');
  assert(monsterAttackCooldown(a.boss) < a.boss.performsAttack.attackCooldown, 'the frenzy speeds its attacks');
  assert(!a.boss.runsBossPattern, 'and it goes straight back to fighting');
}

// ── T3: a root ends the flee in a short stumble ──────────────────────────────
{
  const a = arena('apex-bramble-slasher', { x: 2400, y: 2400 }, { x: 2440, y: 2400 });
  const fleeing = runUntil(a, () => kind(a) === 'escape-guard', 15_000);
  assert(fleeing, 'the T3 predator flees');
  applyMonsterRoot(a.world, a.boss, 2000, 'test');
  runUntil(a, () => a.boss.recoversFromPattern !== undefined, 400);
  assert(a.boss.recoversFromPattern?.label === 'Stumbled' && a.boss.recoversFromPattern.totalMs <= 1000,
    'a root on the flee is a <=1s stumble');
}

// ── T4: snares along the flee path; Cornered stops the fleeing ───────────────
{
  const a = arena('verdant-crown-predator', { x: 2400, y: 2400 }, { x: 2440, y: 2400 });
  a.boss.hasHealth.hp = Math.round(a.boss.hasHealth.maxHp * 0.55);
  updateBossScripts(a.world, 0);
  assert(a.boss.hasStatus.bossPhase === 'Thorn Snares', 'Thorn Snares is announced');
  let snare: RuntimeToxicPool | undefined;
  runUntil(a, () => {
    snare = (a.world.groundZones.get(NODE) ?? []).find(
      (z): z is RuntimeToxicPool => z.kind === 'toxic-pool' && z.flavor === 'thorns');
    return snare !== undefined;
  }, 15_000);
  assert(snare?.snare, 'the flee drops a thorn snare');
  pin(a.player, snare.pos);
  runUntil(a, () => false, 200);
  const root = getStatusEffect(a.player.tracksCombat, 'slow');
  assert(root && (root.data.speedMult ?? 1) === 0, 'stepping on it roots the chaser');

  const b = arena('verdant-crown-predator', { x: 2400, y: 2400 }, { x: 2440, y: 2400 });
  b.boss.hasHealth.hp = Math.round(b.boss.hasHealth.maxHp * 0.25);
  updateBossScripts(b.world, 0);
  assert(b.boss.hasStatus.bossPhase === 'Cornered', 'Cornered is announced');
  const fled = runUntil(b, () => kind(b) === 'escape-guard', 15_000);
  assert(!fled, 'a Cornered predator never flees again');
}

// ── Corner bug: every outward line blocked, it still finds a way out ─────────
{
  const a = arena('jungle-dread-gorger', { x: 70, y: 70 }, { x: 170, y: 170 });
  a.boss.controlsMonster.spawn = { x: 400, y: 400 };
  a.boss.controlsMonster.leashRange = 2000;
  const away = fleeDestination(a.world, a.boss, a.player);
  assert(away !== null, 'a boss backed into a corner slides along the wall instead of freezing');
  const before = Math.hypot(70 - 170, 70 - 170);
  const after = Math.hypot(away.x - 170, away.y - 170);
  assert(after > before, 'and the line it picks still opens distance');
}

console.log('bossLineageJungle: ok');
