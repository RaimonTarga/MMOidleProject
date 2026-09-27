/**
 * Boss-lineage redesign — Mountain ("the charge is coming; how do you meet it?").
 * Wiring smoke: the plate refuses control, the later-phase double charge runs two
 * charges, a root pins the unplated re-aim into a stagger, T4 Rockfall lands, and
 * the T4 Landslide is a triple charge under bigger rocks.
 */
import { ABILITY_ROOT_EFFECT_ID, getStatusEffect, MONSTER_DATABASE } from '@mmo-idle/shared';
import { runningBossPatternDef } from '../src/systems/combat/ai/bossPatterns';
import { updateBossScripts } from '../src/systems/combat/ai/bossScripts';
import { applyMonsterRoot } from '../src/systems/combat/status/monsterControl';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { arena, assert, NODE, pin, runUntil } from './_bossLineageHarness';

initCombatSystems();

function stepKind(a: ReturnType<typeof arena>): string | undefined {
  const state = a.boss.runsBossPattern;
  if (!state) return undefined;
  const step = runningBossPatternDef(a.boss)?.steps[state.stepIndex];
  return step ? `${step.kind}:${'name' in step ? step.name : ''}` : undefined;
}

for (const id of ['crag-gorged-horn-behemoth', 'iron-crest-titan']) {
  // ── Phase 1: the plated charge ignores a root while plated ──────────────────
  {
    const a = arena(id, { x: 1200, y: 1200 }, { x: 1500, y: 1200 });
    const plated = runUntil(a, () => stepKind(a)?.startsWith('cast:') === true && stepKind(a) !== 'cast:Hornplate' && stepKind(a) !== 'cast:Titanplate', 6000);
    assert(plated, `${id}: reaches its plated charge wind-up`);
    applyMonsterRoot(a.world, a.boss, 2000, 'test');
    assert(!getStatusEffect(a.boss.tracksCombat, ABILITY_ROOT_EFFECT_ID), `${id}: a plated boss refuses the root`);
  }

  // ── Double charge: two charges, and a root on the re-aim staggers it ────────
  {
    const a = arena(id, { x: 1200, y: 1200 }, { x: 1500, y: 1200 });
    const hpPct = id === 'iron-crest-titan' ? 0.6 : 0.55;
    a.boss.hasHealth.hp = Math.round(a.boss.hasHealth.maxHp * hpPct);
    updateBossScripts(a.world, 0);
    const charges = new Set<number>();
    let sawReaim = false;
    let spot = { x: 1500, y: 1200 };
    runUntil(a, () => {
      // Step away from the boss for the re-aim, as a player would after a tackle.
      if (stepKind(a) === 'cast:Second Charge' && spot.y === 1200) {
        spot = { x: a.boss.hasPosition.current.x, y: a.boss.hasPosition.current.y + 400 };
      }
      pin(a.player, spot);
      const state = a.boss.runsBossPattern;
      if (state && runningBossPatternDef(a.boss)?.steps[state.stepIndex]?.kind === 'charge') charges.add(state.stepIndex);
      if (stepKind(a) === 'cast:Second Charge') sawReaim = true;
      return a.boss.recoversFromPattern !== undefined;
    }, 20_000);
    assert(a.boss.hasStatus.bossPhase === 'Double Charge', `${id}: the phase is announced on the boss bar`);
    assert(charges.size === 2, `${id}: the double charge runs two charges (saw ${charges.size})`);
    assert(sawReaim, `${id}: with a re-aim wind-up between them`);

    const b = arena(id, { x: 1200, y: 1200 }, { x: 1500, y: 1200 });
    b.boss.hasHealth.hp = Math.round(b.boss.hasHealth.maxHp * hpPct);
    updateBossScripts(b.world, 0);
    const reached = runUntil(b, () => { pin(b.player, { x: 1500, y: 1200 }); return stepKind(b) === 'cast:Second Charge'; }, 20_000);
    assert(reached, `${id}: reaches the re-aim`);
    applyMonsterRoot(b.world, b.boss, 2000, 'test');
    runUntil(b, () => b.boss.recoversFromPattern !== undefined, 500);
    assert(b.boss.recoversFromPattern?.fromStagger === true && b.boss.recoversFromPattern.label === 'Stumbled',
      `${id}: a root on the unplated re-aim pins it into a stagger`);
  }
}

// ── T4 Rockfall ───────────────────────────────────────────────────────────────
{
  const a = arena('iron-crest-titan', { x: 1200, y: 1200 }, { x: 1500, y: 1200 });
  a.boss.hasHealth.hp = Math.round(a.boss.hasHealth.maxHp * 0.3);
  updateBossScripts(a.world, 0);
  let sawRocks = false;
  let rocksLanded = false;
  runUntil(a, () => {
    pin(a.player, { x: 1500, y: 1200 });
    const rocks = (a.world.groundZones.get(NODE) ?? []).some(
      z => z.kind === 'fault-line-telegraph' && z.scattered === true);
    if (rocks) sawRocks = true;
    if (sawRocks && !rocks) rocksLanded = true;
    return rocksLanded;
  }, 20_000);
  assert(a.boss.hasStatus.bossPhase === 'Rockfall', 'the Rockfall phase is announced');
  assert(sawRocks, 'Rockfall publishes scattered delayed circles');
  assert(rocksLanded, 'and they resolve');
  assert(
    MONSTER_DATABASE.get('iron-crest-titan')!.bossPatternVariants!.every(v => v.steps.every(s => s.kind !== 'fault-lines')),
    'the fault lines are cut',
  );
}

// ── T4 Landslide: the triple charge ──────────────────────────────────────────
{
  const a = arena('iron-crest-titan', { x: 1200, y: 1200 }, { x: 1500, y: 1200 });
  a.boss.hasHealth.hp = Math.round(a.boss.hasHealth.maxHp * 0.2);
  updateBossScripts(a.world, 0);
  assert(a.boss.hasStatus.bossPhase === 'Landslide', 'the Landslide is announced');
  const landslide = MONSTER_DATABASE.get('iron-crest-titan')!.bossPatternVariants!.find(v => v.id === 'titan-landslide')!;
  assert(landslide.steps.filter(s => s.kind === 'charge').length === 3, 'Landslide charges three times');
  const rocks = landslide.steps.filter(s => s.kind === 'rockfall');
  const rockfall = MONSTER_DATABASE.get('iron-crest-titan')!.bossPatternVariants!.find(v => v.id === 'titan-rockfall')!;
  const baseRock = rockfall.steps.find(s => s.kind === 'rockfall');
  assert(rocks.length === 3 && rocks.every(r => r.kind === 'rockfall' && baseRock?.kind === 'rockfall' && r.radius > baseRock.radius),
    'with a volley of bigger rocks before every run');
  let sawRocks = false;
  runUntil(a, () => {
    pin(a.player, { x: 1500, y: 1200 });
    sawRocks ||= (a.world.groundZones.get(a.nodeId) ?? []).some(z => z.kind === 'fault-line-telegraph' && z.scattered === true);
    return sawRocks;
  }, 8000);
  assert(sawRocks, 'and the rocks actually fall');
}

console.log('bossLineageMountain: ok');
