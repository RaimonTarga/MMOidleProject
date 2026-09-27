/**
 * Boss-lineage redesign — Tundra (the Chill clock).
 * Wiring smoke: Frostbite builds on the room and cannot be cleansed; Deep Freeze
 * arms at the Chill threshold, spends Chill and Frostbite, and its Frost Burst
 * lands on the frozen player; Frost Nova answers a close player (adding Chill) and
 * Frost Spikes a far one; Brittle then Shatter from 50%; the boss accepts no
 * control; the T4 Ice Armor breaks into a vulnerable stagger.
 */
import {
  ABILITY_ROOT_EFFECT_ID,
  applyStatusEffect,
  AMBIENT_RAMP_KEY,
  BOSS_BRITTLE_EFFECT_ID,
  FROSTBITE_EFFECT_ID,
  FROZEN_STATUS_ID,
  getStatusEffect,
  isCleanseable,
  SHATTER_VULNERABLE_EFFECT_ID,
  TUNDRA_CHILL_EFFECT_ID,
} from '@mmo-idle/shared';
import type { PlayerEntity } from '../src/ecs/entity';
import { updateBossScripts } from '../src/systems/combat/ai/bossScripts';
import { runningBossPatternDef } from '../src/systems/combat/ai/bossPatterns';
import { clearSourceBarrier } from '../src/systems/combat/engine/sourceBarriers';
import { applyMonsterRoot } from '../src/systems/combat/status/monsterControl';
import { monsterIgnoresControl } from '../src/systems/combat/status/controlImmunity';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { arena, assert, pin, runUntil } from './_bossLineageHarness';

initCombatSystems();

const T3 = { id: 'frost-plated-rime-mammoth', node: 'node-t3-tundra-dungeon' };
const T4 = { id: 'glacial-patriarch', node: 'node-t4-tundra-dungeon' };

function chill(player: PlayerEntity, stacks: number): void {
  applyStatusEffect(player.tracksCombat, {
    id: TUNDRA_CHILL_EFFECT_ID, maxStacks: 6, remainingMs: -1, refreshable: false,
    sourceId: 'node-feature:tundra-chill',
    data: { [AMBIENT_RAMP_KEY]: 1, maxStacks: 6, rampMs: 4000, rampAccum: 0 },
  });
  getStatusEffect(player.tracksCombat, TUNDRA_CHILL_EFFECT_ID)!.stacks = stacks;
}
const stepName = (a: ReturnType<typeof arena>) => {
  const state = a.boss.runsBossPattern;
  const step = state ? runningBossPatternDef(a.boss)?.steps[state.stepIndex] : undefined;
  return step && 'name' in step ? step.name : step?.kind;
};

// ── Frostbite, control immunity, Deep Freeze at the threshold ────────────────
{
  const a = arena(T3.id, { x: 2400, y: 2400 }, { x: 2650, y: 2400 }, undefined, T3.node);
  assert(monsterIgnoresControl(a.boss), 'Tundra accepts no control');
  applyMonsterRoot(a.world, a.boss, 1500, 'test');
  assert(!getStatusEffect(a.boss.tracksCombat, ABILITY_ROOT_EFFECT_ID), 'a root never lands on it');
  updateBossScripts(a.world, 0);
  runUntil(a, () => { pin(a.player, { x: 2650, y: 2400 }); return false; }, 6200);
  const frost = getStatusEffect(a.player.tracksCombat, FROSTBITE_EFFECT_ID);
  assert(frost && frost.stacks >= 1, 'the room lays Frostbite');
  assert(!isCleanseable(frost.id, frost.data), 'Frostbite cannot be cleansed');

  chill(a.player, 4);
  let frozen = false;
  const hp = a.player.hasHealth.hp;
  runUntil(a, () => {
    pin(a.player, { x: 2650, y: 2400 });
    if (getStatusEffect(a.player.tracksCombat, FROZEN_STATUS_ID)) frozen = true;
    return a.boss.recoversFromPattern !== undefined && stepName(a) === undefined;
  }, 6000);
  assert(frozen, 'at the Chill threshold, Deep Freeze freezes the player');
  assert(a.player.hasHealth.hp < hp, 'and the Frost Burst centred on them lands');
  assert(!getStatusEffect(a.player.tracksCombat, FROSTBITE_EFFECT_ID), 'the freeze spends the Frostbite');
  assert((getStatusEffect(a.player.tracksCombat, TUNDRA_CHILL_EFFECT_ID)?.stacks ?? 0) < 4, 'and the Chill');
}

// ── Reactive posture ─────────────────────────────────────────────────────────
{
  const near = arena(T3.id, { x: 2400, y: 2400 }, { x: 2480, y: 2400 }, undefined, T3.node);
  updateBossScripts(near.world, 0);
  chill(near.player, 1);
  const nova = runUntil(near, () => { pin(near.player, { x: 2480, y: 2400 }); return stepName(near) === 'Frost Nova'; }, 8000);
  assert(nova, 'a close player draws Frost Nova');
  runUntil(near, () => { pin(near.player, { x: 2480, y: 2400 }); return near.boss.runsBossPattern === undefined; }, 3000);
  assert((getStatusEffect(near.player.tracksCombat, TUNDRA_CHILL_EFFECT_ID)?.stacks ?? 0) >= 2, 'the Nova adds Chill');

  const far = arena(T3.id, { x: 2400, y: 2400 }, { x: 2900, y: 2400 }, undefined, T3.node);
  updateBossScripts(far.world, 0);
  let rooted = false;
  runUntil(far, () => {
    pin(far.player, { x: 2900, y: 2400 });
    const slow = getStatusEffect(far.player.tracksCombat, 'slow');
    if (slow && slow.data.speedMult === 0) rooted = true;
    return rooted;
  }, 8000);
  assert(rooted, 'a far player is rooted by Frost Spikes');
}

// ── Brittle -> Shatter (T3 50%) ──────────────────────────────────────────────
{
  const a = arena(T3.id, { x: 2400, y: 2400 }, { x: 2460, y: 2400 }, undefined, T3.node);
  a.boss.hasHealth.hp = Math.round(a.boss.hasHealth.maxHp * 0.45);
  updateBossScripts(a.world, 0);
  assert(a.boss.hasStatus.bossPhase === 'Brittle', 'Brittle is announced');
  chill(a.player, 4);
  let brittle = false;
  let shatter = false;
  runUntil(a, () => {
    pin(a.player, { x: 2460, y: 2400 });
    if (getStatusEffect(a.player.tracksCombat, BOSS_BRITTLE_EFFECT_ID)) brittle = true;
    if (stepName(a) === 'Shatter') shatter = true;
    return shatter && a.boss.runsBossPattern === undefined;
  }, 10_000);
  assert(brittle, 'the Frost Burst leaves the player Brittle');
  assert(shatter, 'and the Shatter swing follows');
}

// ── T4 Ice Armor ─────────────────────────────────────────────────────────────
{
  const a = arena(T4.id, { x: 2400, y: 2400 }, { x: 2650, y: 2400 }, undefined, T4.node);
  a.boss.hasHealth.hp = Math.round(a.boss.hasHealth.maxHp * 0.55);
  updateBossScripts(a.world, 0);
  assert(a.boss.hasStatus.bossPhase === 'Ice Armor', 'Ice Armor is announced');
  const encased = runUntil(a, () => { pin(a.player, { x: 2650, y: 2400 }); return !!a.boss.runsBossPattern?.watchedBarrier; }, 4000);
  assert(encased, 'it encases itself');
  assert(a.boss.cannotAttack, 'and stops attacking while encased');
  clearSourceBarrier(a.boss, 'ice-armor');
  runUntil(a, () => a.boss.recoversFromPattern !== undefined, 300);
  assert(a.boss.recoversFromPattern?.label === 'Shattered', 'breaking the armor staggers it');
  assert(getStatusEffect(a.boss.tracksCombat, SHATTER_VULNERABLE_EFFECT_ID), 'and leaves it taking extra damage');
}

console.log('bossLineageTundra: ok');
