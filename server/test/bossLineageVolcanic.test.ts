/**
 * Boss-lineage redesign — Volcanic (the Heat race).
 * Wiring smoke: the vent field erupts on a telegraphed rhythm and hurts a player
 * standing on a vent; the boss keeps attacking (no shell); T4's Simmering Burn
 * builds from the room and Cleanse only takes part of it; Magma Shove drags the
 * player toward a vent. Fissures open new vents under the player; the final
 * strike cannot be evaded and announces itself on the boss while it charges.
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
  assert(field.length === 6, 'six vents ring the arena');
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
  assert(getStatusEffect(a.player.tracksCombat, 'slow'), 'and it lands the player slowed');
  const burnId = monsterDotStatusEffectId('caldera-burn');
  runUntil(a, () => false, 11_000);
  const burn = getStatusEffect(a.player.tracksCombat, burnId);
  assert(burn && burn.stacks >= 2, `the room builds Simmering Burn (stacks ${burn?.stacks})`);
  assert(cleanseableStacks(burnId, burn.data, 99) < 99, 'Cleanse only takes part of it');
}

// ── T4: fissures split new vents open under the player ───────────────────────
{
  const a = arena('caldera-sovereign', { x: 2400, y: 2400 }, { x: 2460, y: 2400 }, undefined, 'node-t4-volcanic-dungeon');
  a.boss.hasHealth.hp = Math.round(a.boss.hasHealth.maxHp * 0.45);
  updateBossScripts(a.world, 0);
  const before = vents(a).length;
  assert(before === 9, `the Magma Shove phase widens the field to nine vents (${before})`);
  assert(vents(a).every(v => v.radius === 235), 'and widens the vents already down');
  const spot = { x: 2460, y: 2400 };
  // Around-the-boss vents open too now; wait for the one UNDER the player.
  const under = () => vents(a).find(v => Math.hypot(v.pos.x - spot.x, v.pos.y - spot.y) < 1 && v.expiresAtMs - v.startedAtMs > 60_000);
  runUntil(a, () => { pin(a.player, spot); return under() !== undefined; }, 9_000);
  const opened = under();
  assert(opened, 'a fissure opens a vent under the player');
}

// ── T3: the Final Eruption announces itself and cannot be evaded ─────────────
{
  const a = arena('cinder-shell-magma-salamander', { x: 2400, y: 2400 }, { x: 2460, y: 2400 }, undefined, 'node-t3-volcanic-dungeon');
  const floor = Math.round(a.boss.hasHealth.maxHp * 0.2);
  a.boss.hasHealth.hp = floor;
  // A perfect dodger: every ordinary hit is fully evaded.
  a.player.evadesHits = { dodgeRate: 1, charge: 0, evadeMitigation: 1 };
  updateBossScripts(a.world, 0);
  const spot = { x: 2460, y: 2400 };
  const announced = runUntil(a, () => {
    pin(a.player, spot);
    a.boss.hasHealth.hp = Math.max(a.boss.hasHealth.hp, floor);
    return (a.boss.hasStatus.bossEffects ?? []).includes('final-eruption');
  }, 5_000);
  assert(announced, 'the charging Final Eruption shows on the boss');
  const hp = a.player.hasHealth.hp;
  const landed = runUntil(a, () => {
    pin(a.player, spot);
    a.boss.hasHealth.hp = Math.max(a.boss.hasHealth.hp, floor);
    return a.player.hasHealth.hp < hp;
  }, 25_000);
  assert(landed, 'the Final Eruption lands through full evasion');
  assert(!(a.boss.hasStatus.bossEffects ?? []).includes('final-eruption'), 'and its tile clears once it resolves');
}

// ── Vents split open around the boss, faster in the last phase ──────────────
{
  const around = (hpFrac: number): number => {
    const a = arena('caldera-sovereign', { x: 2400, y: 2400 }, { x: 2460, y: 2400 }, undefined, 'node-t4-volcanic-dungeon');
    a.boss.hasHealth.hp = Math.round(a.boss.hasHealth.maxHp * hpFrac);
    updateBossScripts(a.world, 0);
    const fixed = new Set(vents(a).map(v => v.id));
    let opened = 0;
    const seen = new Set<string>();
    runUntil(a, () => {
      pin(a.player, { x: 2460, y: 2400 });
      a.boss.hasHealth.hp = Math.max(a.boss.hasHealth.hp, Math.round(a.boss.hasHealth.maxHp * hpFrac * 0.98));
      for (const v of vents(a)) {
        if (fixed.has(v.id) || seen.has(v.id)) continue;
        seen.add(v.id);
        const d = Math.hypot(v.pos.x - a.boss.hasPosition.current.x, v.pos.y - a.boss.hasPosition.current.y);
        if (d <= 460 && v.expiresAtMs - v.startedAtMs < 10_000) opened++;
      }
      return false;
    }, 6_000);
    return opened;
  };
  const early = around(1);
  const late = around(0.2);
  assert(early >= 1, `short-lived vents split open around the boss (${early})`);
  assert(late > early * 2, `and far faster in the last phase (${early} -> ${late})`);
}

console.log('bossLineageVolcanic: ok');
