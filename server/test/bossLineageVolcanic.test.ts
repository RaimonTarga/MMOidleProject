/**
 * Boss-lineage redesign — Volcanic (the Heat race).
 * Wiring smoke: the vent field erupts on a telegraphed rhythm and hurts a player
 * standing on a vent; the boss keeps attacking (no shell); T4's Simmering Burn
 * builds from the room and Cleanse only takes part of it; Magma Shove drags the
 * player toward a vent.
 */
import { cleanseableStacks, monsterDotStatusEffectId, getStatusEffect } from '@mmo-idle/shared';
import { updateBossScripts } from '../src/systems/combat/ai/bossScripts';
import { runningBossPatternDef } from '../src/systems/combat/ai/bossPatterns';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import type { RuntimeToxicPool } from '../src/systems/world/groundZones';
import { arena, assert, pin, runUntil } from './_bossLineageHarness';

initCombatSystems();

const vents = (a: ReturnType<typeof arena>) => (a.world.groundZones.get(a.nodeId) ?? []).filter(
  (z): z is RuntimeToxicPool => z.kind === 'toxic-pool' && z.flavor === 'magma-vent');

// ── T3: a vent erupts under a player standing on it ──────────────────────────
{
  const a = arena('cinder-shell-magma-salamander', { x: 2400, y: 2400 }, { x: 2500, y: 2400 }, undefined, 'node-t3-volcanic-dungeon');
  updateBossScripts(a.world, 0);
  const field = vents(a);
  assert(field.length === 4, 'four vents ring the arena');
  const on = { ...field[0].pos };
  const hp = a.player.hasHealth.hp;
  let sawEruption = false;
  runUntil(a, () => {
    pin(a.player, on);
    if ((a.world.groundZones.get(a.nodeId) ?? []).some(z => z.kind === 'fault-line-telegraph')) sawEruption = true;
    return false;
  }, 11_000);
  assert(sawEruption, 'the vents erupt on a telegraphed rhythm');
  assert(a.player.hasHealth.hp < hp, 'standing on an erupting vent hurts');
}

// ── T4: Simmering Burn builds, partially cleanseable; Magma Shove ────────────
{
  const a = arena('caldera-sovereign', { x: 2400, y: 2400 }, { x: 2460, y: 2400 }, undefined, 'node-t4-volcanic-dungeon');
  a.boss.hasHealth.hp = Math.round(a.boss.hasHealth.maxHp * 0.45);
  updateBossScripts(a.world, 0);
  assert(a.boss.hasStatus.bossPhase === 'Magma Shove', 'Magma Shove is announced');
  let shoved = false;
  let spot = { x: 2460, y: 2400 };
  runUntil(a, () => {
    const state = a.boss.runsBossPattern;
    const step = state ? runningBossPatternDef(a.boss)?.steps[state.stepIndex] : undefined;
    if (step?.kind === 'pull') shoved = true;
    if (shoved && Math.hypot(a.player.hasPosition.current.x - spot.x, a.player.hasPosition.current.y - spot.y) > 20) return true;
    pin(a.player, spot);
    spot = { ...a.player.hasPosition.current };
    return false;
  }, 12_000);
  assert(shoved, 'the Magma Shove fires');
  const burnId = monsterDotStatusEffectId('caldera-burn');
  runUntil(a, () => false, 11_000);
  const burn = getStatusEffect(a.player.tracksCombat, burnId);
  assert(burn && burn.stacks >= 2, `the room builds Simmering Burn (stacks ${burn?.stacks})`);
  assert(cleanseableStacks(burnId, burn.data, 99) < 99, 'Cleanse only takes part of it');
}

console.log('bossLineageVolcanic: ok');
