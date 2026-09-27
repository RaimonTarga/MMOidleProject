/**
 * Boss-lineage redesign — Cave (the burrower).
 * Wiring smoke: the mound is targetable and enough damage drags it up staggered
 * with no eruption; eruptions leave sinkholes that stack Eroded; the T3 Tunnel
 * Chase erupts three times per burrow; a root pins the T3 mound up.
 */
import { ERODED_EFFECT_ID, getStatusEffect, playerIncomingDamageMult } from '@mmo-idle/shared';
import { updateBossScripts } from '../src/systems/combat/ai/bossScripts';
import { runningBossPatternDef } from '../src/systems/combat/ai/bossPatterns';
import { applyMonsterRoot } from '../src/systems/combat/status/monsterControl';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import type { RuntimeToxicPool } from '../src/systems/world/groundZones';
import { arena, assert, NODE, pin, runUntil } from './_bossLineageHarness';

initCombatSystems();

// ── T1: drag the mound up with damage ─────────────────────────────────────────
{
  const a = arena('obsidian-broodmother', { x: 1200, y: 1200 }, { x: 1500, y: 1200 });
  const buried = runUntil(a, () => { pin(a.player, { x: 1500, y: 1200 }); return a.boss.isConcealed !== undefined; }, 8000);
  assert(buried && a.boss.isConcealed!.targetable === true, 'the Broodmother burrows as a targetable mound');
  // Enough damage on the mound (7% max HP) drags it up.
  a.boss.hasHealth.hp -= Math.ceil(a.boss.hasHealth.maxHp * 0.08);
  let sawEruption = false;
  runUntil(a, () => {
    pin(a.player, { x: 1500, y: 1200 });
    if ((a.world.groundZones.get(NODE) ?? []).some(z => z.kind === 'slam-telegraph')) sawEruption = true;
    return a.boss.recoversFromPattern !== undefined;
  }, 1000);
  assert(a.boss.recoversFromPattern?.fromStagger === true && a.boss.recoversFromPattern.label === 'Dragged Up',
    'damage on the mound surfaces it staggered');
  assert(!sawEruption, 'and the eruption fizzles');
  assert(a.boss.isConcealed === undefined, 'it is out of the ground');
}

// ── T2: an eruption leaves a sinkhole that erodes ─────────────────────────────
{
  const a = arena('chitinous-dreadbore', { x: 1200, y: 1200 }, { x: 1500, y: 1200 });
  let hole: RuntimeToxicPool | undefined;
  runUntil(a, () => {
    pin(a.player, { x: 1500, y: 1200 });
    hole = (a.world.groundZones.get(NODE) ?? []).find(
      (z): z is RuntimeToxicPool => z.kind === 'toxic-pool' && z.flavor === 'sinkhole');
    return hole !== undefined;
  }, 12_000);
  assert(hole, 'the Dreadbore eruption leaves a sinkhole');
  const inside = { ...hole.pos };
  runUntil(a, () => { pin(a.player, inside); return false; }, 3500);
  const eroded = getStatusEffect(a.player.tracksCombat, ERODED_EFFECT_ID);
  assert(eroded && eroded.stacks >= 3, `standing in it stacks Eroded (stacks ${eroded?.stacks})`);
  assert(playerIncomingDamageMult(a.player.tracksCombat) > 1.1, 'Eroded raises damage taken');
}

// ── T3: Tunnel Chase erupts three times; a root pins the mound up ─────────────
{
  const a = arena('deep-core-burrow-gorger', { x: 1200, y: 1200 }, { x: 1500, y: 1200 });
  a.boss.hasHealth.hp = Math.round(a.boss.hasHealth.maxHp * 0.55);
  updateBossScripts(a.world, 0);
  assert(a.boss.hasStatus.bossPhase === 'Tunnel Chase', 'Tunnel Chase is announced');
  const eruptions = new Set<number>();
  runUntil(a, () => {
    pin(a.player, { x: 1500, y: 1200 });
    const state = a.boss.runsBossPattern;
    const step = state ? runningBossPatternDef(a.boss)?.steps[state.stepIndex] : undefined;
    if (state && step?.kind === 'impact') eruptions.add(state.stepIndex);
    return a.boss.recoversFromPattern !== undefined;
  }, 20_000);
  assert(eruptions.size === 3, `the tunnel chase erupts three times (saw ${eruptions.size})`);

  const b = arena('deep-core-burrow-gorger', { x: 1200, y: 1200 }, { x: 1500, y: 1200 });
  runUntil(b, () => { pin(b.player, { x: 1500, y: 1200 }); return b.boss.isConcealed !== undefined; }, 8000);
  assert(b.boss.isConcealed, 'the Gorger burrows');
  applyMonsterRoot(b.world, b.boss, 1500, 'test');
  runUntil(b, () => b.boss.recoversFromPattern !== undefined, 500);
  assert(b.boss.recoversFromPattern?.label === 'Pinned Up', 'a root on the T3 mound pins it up, staggered');
}

console.log('bossLineageCave: ok');
