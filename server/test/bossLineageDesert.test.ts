/**
 * Boss-lineage redesign — Desert (mark, slow, execute, across changing postures).
 * Wiring smoke: the T3 Standoff dash-escapes when a player closes in and a root
 * pins it; the T4 Hit-and-Run dashes in, cashes the mark, withdraws, speeds up
 * run over run (never under its floor), and a root on the dash-in catches it.
 */
import { MONSTER_DATABASE, SUN_MARK_EFFECT_ID, getCounter } from '@mmo-idle/shared';
import { updateBossScripts } from '../src/systems/combat/ai/bossScripts';
import { runningBossPatternDef } from '../src/systems/combat/ai/bossPatterns';
import { applyMonsterRoot } from '../src/systems/combat/status/monsterControl';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { arena, assert, pin, runUntil } from './_bossLineageHarness';

initCombatSystems();

function stepName(a: ReturnType<typeof arena>): string | undefined {
  const state = a.boss.runsBossPattern;
  if (!state) return undefined;
  const step = runningBossPatternDef(a.boss)?.steps[state.stepIndex];
  return step && 'name' in step ? step.name : step?.kind;
}
const gap = (a: ReturnType<typeof arena>) => Math.hypot(
  a.boss.hasPosition.current.x - a.player.hasPosition.current.x,
  a.boss.hasPosition.current.y - a.player.hasPosition.current.y,
);

// ── T3 Standoff: close in and it springs away; a root pins it ────────────────
{
  const a = arena('dune-carapace-monarch', { x: 1500, y: 1500 }, { x: 1620, y: 1500 });
  a.boss.hasHealth.hp = Math.round(a.boss.hasHealth.maxHp * 0.45);
  updateBossScripts(a.world, 0);
  assert(a.boss.hasStatus.bossPhase === 'Standoff', 'the Standoff is announced');
  assert(a.boss.isMonster.isRanged === true, 'it turns ranged');
  const dashed = runUntil(a, () => stepName(a) === 'Sand Step', 2000);
  assert(dashed, 'a player in its face triggers the Sand Step');
  runUntil(a, () => { pin(a.player, { x: 1620, y: 1500 }); return a.boss.runsBossPattern === undefined; }, 3000);
  assert(gap(a) >= 380, `and it opens the gap back to range (gap ${gap(a).toFixed(0)})`);

  const b = arena('dune-carapace-monarch', { x: 1500, y: 1500 }, { x: 1620, y: 1500 });
  b.boss.hasHealth.hp = Math.round(b.boss.hasHealth.maxHp * 0.45);
  updateBossScripts(b.world, 0);
  runUntil(b, () => stepName(b) === 'Sand Step', 2000);
  applyMonsterRoot(b.world, b.boss, 1500, 'test');
  runUntil(b, () => b.boss.recoversFromPattern !== undefined, 400);
  assert(b.boss.recoversFromPattern?.label === 'Pinned', 'a root stops the dash, staggered');
}

// ── T4 Hit-and-Run ────────────────────────────────────────────────────────────
{
  const a = arena('dune-throne-sovereign', { x: 1500, y: 1500 }, { x: 2000, y: 1500 });
  a.boss.hasHealth.hp = Math.round(a.boss.hasHealth.maxHp * 0.15);
  updateBossScripts(a.world, 0);
  assert(a.boss.hasStatus.bossPhase === 'Hit and Run', 'Hit and Run is announced');
  let minGapDuringCombo = Infinity;
  let marked = false;
  const hpBefore = a.player.hasHealth.hp;
  runUntil(a, () => {
    pin(a.player, { x: 2000, y: 1500 });
    if (stepName(a) === 'Execution') minGapDuringCombo = Math.min(minGapDuringCombo, gap(a));
    if (a.player.tracksCombat.statusEffects.some(e => e.id === SUN_MARK_EFFECT_ID)) marked = true;
    return stepName(a) === 'Withdraw';
  }, 12_000);
  assert(marked, 'it marks from range');
  assert(minGapDuringCombo < 160, `it dashes in for the combo (gap ${minGapDuringCombo.toFixed(0)})`);
  runUntil(a, () => { pin(a.player, { x: 2000, y: 1500 }); return a.boss.runsBossPattern === undefined; }, 3000);
  assert(a.player.hasHealth.hp < hpBefore, 'the combo lands');
  assert(gap(a) >= 450, `and it withdraws out of reach (gap ${gap(a).toFixed(0)})`);
  const runs = getCounter(a.boss.tracksCombat, 'bossPatternRuns:sovereign-hit-and-run');
  assert(runs >= 1, 'runs are counted for the acceleration');
  const hr = MONSTER_DATABASE.get('dune-throne-sovereign')!.bossPatternVariants!.find(v => v.id === 'sovereign-hit-and-run')!;
  assert(hr.accelerate!.minCooldownMs - 3500 >= 4000,
    'the floor leaves >= 4s of quiet after a ~3.5s burst (Dawn armor re-arms)');

  const b = arena('dune-throne-sovereign', { x: 1500, y: 1500 }, { x: 2000, y: 1500 });
  b.boss.hasHealth.hp = Math.round(b.boss.hasHealth.maxHp * 0.15);
  updateBossScripts(b.world, 0);
  runUntil(b, () => { pin(b.player, { x: 2000, y: 1500 }); return stepName(b) === 'Dune Rush'; }, 12_000);
  applyMonsterRoot(b.world, b.boss, 1500, 'test');
  runUntil(b, () => b.boss.recoversFromPattern !== undefined, 400);
  assert(b.boss.recoversFromPattern?.label === 'Caught', 'a root on the dash-in catches it, staggered');
}

console.log('bossLineageDesert: ok');
