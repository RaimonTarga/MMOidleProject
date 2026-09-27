/**
 * Boss-lineage redesign — Trench (the pressure hunt).
 * Wiring smoke: the hunt piles Wound (anti-heal), Crushing Pressure (slow) and
 * Rend on the player; the room's Depth lengthens those debuffs; only the Devour
 * is stunnable, and a stunned Devour chokes the serpent; Into the Dark sinks it
 * out of reach; the Debuff Pile rune condition reads the pile.
 */
import {
  applyStatusEffect,
  deriveAutoConfigFromRunes,
  DEPTH_EFFECT_ID,
  getStatusEffect,
  REND_EFFECT_ID,
} from '@mmo-idle/shared';
import { updateBossScripts } from '../src/systems/combat/ai/bossScripts';
import { runningBossPatternDef } from '../src/systems/combat/ai/bossPatterns';
import { STUN_EFFECT } from '../src/systems/combat/status/stun';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { arena, assert, pin, runUntil } from './_bossLineageHarness';

initCombatSystems();
const BOSS = 'elder-trench-serpent';
const NODE = 'node-t4-trench-dungeon';
const stepName = (a: ReturnType<typeof arena>) => {
  const state = a.boss.runsBossPattern;
  const step = state ? runningBossPatternDef(a.boss)?.steps[state.stepIndex] : undefined;
  return step && 'name' in step ? step.name : step?.kind;
};
const stun = (a: ReturnType<typeof arena>) => applyStatusEffect(a.boss.tracksCombat, {
  id: STUN_EFFECT, maxStacks: 1, remainingMs: 1500, refreshable: true, sourceId: 'test', data: { totalMs: 1500 },
});

// ── The pile, Depth, and the stunnable Devour ────────────────────────────────
{
  const a = arena(BOSS, { x: 2400, y: 2400 }, { x: 2480, y: 2400 }, undefined, NODE);
  updateBossScripts(a.world, 0);
  const spot = { x: 2480, y: 2400 };
  // Let the room lay some Depth first.
  runUntil(a, () => { pin(a.player, spot); return (getStatusEffect(a.player.tracksCombat, DEPTH_EFFECT_ID)?.stacks ?? 0) >= 1; }, 9000);
  assert(getStatusEffect(a.player.tracksCombat, DEPTH_EFFECT_ID), 'the room builds Depth');

  let stunnedBite = false;
  const reachedDevour = runUntil(a, () => {
    pin(a.player, spot);
    if (!stunnedBite && stepName(a) === 'Wounding Bite') {
      stun(a); // not the control beat: the bite must go on
      stunnedBite = true;
    }
    return stepName(a) === 'Devour';
  }, 20_000);
  assert(stunnedBite && reachedDevour, 'a stun on the Wounding Bite does not stop the hunt');
  assert(getStatusEffect(a.player.tracksCombat, 'antiheal'), 'Wound: anti-heal');
  assert(getStatusEffect(a.player.tracksCombat, 'slow'), 'Crushing Pressure: slow');
  const rend = getStatusEffect(a.player.tracksCombat, REND_EFFECT_ID);
  assert(rend, 'Rend: +damage taken');
  assert((rend.data.totalMs ?? 0) > 8000, `Depth lengthens the debuff (${rend.data.totalMs}ms > 8000ms)`);

  const pile = deriveAutoConfigFromRunes(
    [{ conditionId: 'debuff-pile', actionId: 'use-ability', targetAbilityId: 'power-strike' }],
    { hpPct: 1, inCombat: true, inParty: false, aggroCount: 1, debuffCount: 3 },
  );
  assert(pile.abilityTargets.includes('power-strike'), 'Debuff Pile fires at three debuffs');

  stun(a);
  runUntil(a, () => a.boss.recoversFromPattern !== undefined, 300);
  assert(a.boss.recoversFromPattern?.label === 'Choked', 'a stunned Devour chokes the serpent');
}

// ── Into the Dark ────────────────────────────────────────────────────────────
{
  const a = arena(BOSS, { x: 2400, y: 2400 }, { x: 2480, y: 2400 }, undefined, NODE);
  a.boss.hasHealth.hp = Math.round(a.boss.hasHealth.maxHp * 0.55);
  updateBossScripts(a.world, 0);
  assert(a.boss.hasStatus.bossPhase === 'Into the Dark', 'Into the Dark is announced');
  assert(a.boss.hasStatus.bossWeather === 'abyss', 'and the room goes dark (client ambience tag)');
  const sank = runUntil(a, () => { pin(a.player, { x: 2480, y: 2400 }); return a.boss.isConcealed !== undefined; }, 8000);
  assert(sank && a.boss.isConcealed!.targetable !== true, 'it sinks out of reach, untargetable');
  const surged = runUntil(a, () => { pin(a.player, { x: 2480, y: 2400 }); return stepName(a) === 'Surge'; }, 8000);
  assert(surged, 'and surges up to strike');
}

console.log('bossLineageTrench: ok');
