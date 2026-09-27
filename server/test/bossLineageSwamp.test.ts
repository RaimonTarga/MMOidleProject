/**
 * Boss-lineage redesign — Swamp (rot arena).
 * Wiring smoke: Mire Spit lays a slow-only Mire pool, the Mire Lash drags the
 * target toward it, T3's Spore phase lays detonating pools and drags toward
 * them, and Rot Bloom spreads pools and builds a room DoT that clears on death.
 */
import { getStatusEffect, monsterDotStatusEffectId } from '@mmo-idle/shared';
import { updateBossScripts } from '../src/systems/combat/ai/bossScripts';
import { clearRoomAffliction } from '../src/systems/combat/ai/bossArena';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import type { RuntimeToxicPool } from '../src/systems/world/groundZones';
import { arena, assert, NODE, pin, runUntil } from './_bossLineageHarness';

initCombatSystems();

function pools(a: ReturnType<typeof arena>): RuntimeToxicPool[] {
  return (a.world.groundZones.get(NODE) ?? []).filter(
    (z): z is RuntimeToxicPool => z.kind === 'toxic-pool' && z.ownerId === a.boss.isMonster.id,
  );
}

// ── T2: Mire Spit + Mire Lash ─────────────────────────────────────────────────
{
  const a = arena('mire-gorged-behemoth', { x: 1200, y: 1200 }, { x: 1500, y: 1200 });
  let spot = { x: 1500, y: 1200 };
  let mire: RuntimeToxicPool | undefined;
  let beforePull: { x: number; y: number } | undefined;
  const pulled = runUntil(a, () => {
    // Anything that moved the pinned player since last tick is the lash.
    if (beforePull && Math.hypot(a.player.hasPosition.current.x - spot.x, a.player.hasPosition.current.y - spot.y) > 20) {
      return true;
    }
    mire ??= pools(a).find(p => p.flavor === 'mire');
    if (mire && !beforePull) {
      // Step well clear of the fresh Mire, as a player would.
      spot = { x: mire.pos.x + 450, y: mire.pos.y };
      beforePull = spot;
    }
    pin(a.player, spot);
    return false;
  }, 20_000);
  assert(mire, 'Mire Spit lays a Mire pool');
  assert(mire.damagePerTick === 0 && (mire.slowSpeedMult ?? 1) < 0.5, 'Mire slows and does not burn');
  assert(pulled, 'the Mire Lash moves the target');
  const d0 = Math.hypot(beforePull!.x - mire.pos.x, beforePull!.y - mire.pos.y);
  const d1 = Math.hypot(a.player.hasPosition.current.x - mire.pos.x, a.player.hasPosition.current.y - mire.pos.y);
  assert(d1 < d0 - 50, `the Mire Lash drags the target toward the pool (${d0.toFixed(0)} -> ${d1.toFixed(0)})`);
}

// ── T3: Spore Bloom lays detonating pools, Rot Bloom spreads + rots the room ──
{
  const a = arena('rot-spore-croc-behemoth', { x: 1200, y: 1200 }, { x: 1500, y: 1200 });
  a.boss.hasHealth.hp = Math.round(a.boss.hasHealth.maxHp * 0.55);
  updateBossScripts(a.world, 0);
  assert(a.boss.hasStatus.bossPhase === 'Spore Bloom', 'Spore Bloom is announced');
  let spore: RuntimeToxicPool | undefined;
  runUntil(a, () => { pin(a.player, { x: 1500, y: 1200 }); spore ??= pools(a).find(p => p.flavor === 'spore'); return spore !== undefined; }, 15_000);
  assert(spore && (spore.detonationMultiplier ?? 0) > 1, 'Spore Spit lays a pool that detonates');

  a.boss.hasHealth.hp = Math.round(a.boss.hasHealth.maxHp * 0.2);
  updateBossScripts(a.world, 0);
  assert(a.boss.hasStatus.bossPhase === 'Rot Bloom', 'Rot Bloom is announced');
  const grown = pools(a)[0];
  const startRadius = grown?.radius ?? 0;
  runUntil(a, () => { pin(a.player, { x: 1500, y: 1200 }); return false; }, 9_000);
  const rot = getStatusEffect(a.player.tracksCombat, monsterDotStatusEffectId('rot-bloom'));
  assert(rot && rot.stacks >= 2, `the room builds a Rot DoT on the player (stacks ${rot?.stacks})`);
  const live = pools(a).find(p => p.id === grown?.id);
  assert(!grown || !live || live.radius > startRadius, 'owned pools spread');
  clearRoomAffliction(a.world, a.boss);
  assert(!getStatusEffect(a.player.tracksCombat, monsterDotStatusEffectId('rot-bloom')), 'the room clears with the boss');
}

console.log('bossLineageSwamp: ok');
