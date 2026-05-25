/**
 * Boss fight scripting system.
 *
 * Each boss can opt-in by setting `bossScript` in its MonsterDefinition.
 * The script declares:
 *   - phases:    one-shot HP-threshold triggers (fire once per fight life)
 *   - repeating: periodic timers (run continuously once the boss is engaged)
 *
 * Supported actions (BossAction union in monsterDatabase.ts):
 *   enrage    — multiply attack + accelerate cooldown, optional duration
 *   regen     — heal hpPctPerSec × maxHp per second, optional duration
 *   shield    — add flat damage-reduction for a fixed window (cyclic)
 *   summon    — spawn N minions of a given type near the boss
 *   stat-buff — multiply any single stat, optional duration
 *
 * Runtime state lives on `entity.scriptsBoss` (server-only, never serialized).
 * Dead bosses are pruned when the monster entity is removed from the world.
 */

import type { BossAction, BossPhase, BossScript, RepeatingAction } from '@mmo-idle/shared';
import { MONSTER_DATABASE, GAME_CONFIG } from '@mmo-idle/shared';
import { NODE_REGISTRY } from '../world/nodeRegistry';
import type { World } from '../world/World';
import type { MonsterEntity } from '../ecs/components/monster';
import type { ActiveBossEffect, ScriptsBoss } from '@mmo-idle/shared';
import { initScriptsBoss } from '@mmo-idle/shared';
import { attachComponent } from '../ecs/markerHelpers';

export type { ScriptsBoss, BossRuntimeState, ActiveBossEffect } from '@mmo-idle/shared';
export { initScriptsBoss, initBossState } from '@mmo-idle/shared';

// ── Main update ───────────────────────────────────────────────────────────────

export function updateBossScripts(world: World, dt: number): void {
  for (const e of world.bossScriptedMonsters) {
    const def = MONSTER_DATABASE.get(e.isMonster.monsterTypeId);
    if (!def?.bossScript) continue;

    const script = def.bossScript;
    const state = e.scriptsBoss!;

    if (e.hasAggroTarget) attachComponent(world, e, 'isBossEngaged', {});

    tickActiveEffects(state, e, dt);

    if (e.isBossEngaged) {
      if (script.phases)    checkPhaseTransitions(state, script.phases,    e, world);
      if (script.repeating) tickRepeatingActions(state,  script.repeating,  e, world, dt);
    }

    e.hasStatus.bossEffects = [...new Set(state.activeEffects.map(fx => fx.type))];
  }
}

// ── Active-effect lifecycle ───────────────────────────────────────────────────

function tickActiveEffects(
  state: ScriptsBoss,
  monster: MonsterEntity,
  dt: number,
): void {
  const toExpire: ActiveBossEffect[] = [];

  for (const effect of state.activeEffects) {
    if (effect.regenHpPctPerSec !== undefined) {
      monster.hasHealth.hp = Math.min(
        monster.hasHealth.maxHp,
        monster.hasHealth.hp + monster.hasHealth.maxHp * effect.regenHpPctPerSec * (dt / 1000),
      );
    }

    if (effect.remainingMs === -1) continue;
    effect.remainingMs -= dt;
    if (effect.remainingMs <= 0) toExpire.push(effect);
  }

  for (const effect of toExpire) {
    restoreStats(effect, monster);
    state.activeEffects = state.activeEffects.filter(fx => fx !== effect);
  }
}

function restoreStats(effect: ActiveBossEffect, monster: MonsterEntity): void {
  if (effect.savedAttack          !== undefined) monster.dealsDamage.attack = effect.savedAttack;
  if (effect.savedCooldown        !== undefined) monster.performsAttack.attackCooldown = effect.savedCooldown;
  if (effect.savedPlating         !== undefined) monster.mitigatesDamage.plating = effect.savedPlating;
  if (effect.savedDamageReduction !== undefined) monster.mitigatesDamage.damageReduction = effect.savedDamageReduction;
  if (effect.savedSpeed           !== undefined) monster.hasPosition.speed = effect.savedSpeed;
}

function checkPhaseTransitions(
  state: ScriptsBoss,
  phases: BossPhase[],
  monster: MonsterEntity,
  world: World,
): void {
  const hpPct = monster.hasHealth.hp / monster.hasHealth.maxHp;
  for (let i = 0; i < phases.length; i++) {
    if (state.phaseTriggered[i]) continue;
    if (hpPct > phases[i].hpPct) continue;

    state.phaseTriggered[i] = true;
    for (const action of phases[i].actions) {
      applyAction(action, monster, world, state);
    }
  }
}

function tickRepeatingActions(
  state: ScriptsBoss,
  repeating: RepeatingAction[],
  monster: MonsterEntity,
  world: World,
  dt: number,
): void {
  for (let i = 0; i < repeating.length; i++) {
    state.repeatingTimers[i] -= dt;
    if (state.repeatingTimers[i] > 0) continue;

    state.repeatingTimers[i] = repeating[i].intervalMs;
    for (const action of repeating[i].actions) {
      applyAction(action, monster, world, state);
    }
  }
}

function applyAction(
  action: BossAction,
  monster: MonsterEntity,
  world: World,
  state: ScriptsBoss,
): void {
  switch (action.type) {

    case 'enrage': {
      const effect: ActiveBossEffect = {
        type:          'enrage',
        remainingMs:   action.durationMs ?? -1,
        savedAttack:   monster.dealsDamage.attack,
        savedCooldown: monster.performsAttack.attackCooldown,
      };
      monster.dealsDamage.attack = Math.round(monster.dealsDamage.attack * action.atkMult);
      monster.performsAttack.attackCooldown = Math.max(200, Math.round(monster.performsAttack.attackCooldown * action.cdMult));
      state.activeEffects.push(effect);
      break;
    }

    case 'regen': {
      const effect: ActiveBossEffect = {
        type:               'regen',
        remainingMs:        action.durationMs ?? -1,
        regenHpPctPerSec:   action.hpPctPerSec,
      };
      state.activeEffects.push(effect);
      break;
    }

    case 'shield': {
      const effect: ActiveBossEffect = {
        type:                 'shield',
        remainingMs:          action.durationMs,
        savedDamageReduction: monster.mitigatesDamage.damageReduction,
      };
      monster.mitigatesDamage.damageReduction = Math.min(0.95, monster.mitigatesDamage.damageReduction + action.drAdd);
      state.activeEffects.push(effect);
      break;
    }

    case 'stat-buff': {
      const effect: ActiveBossEffect = {
        type:        `stat-buff-${action.stat}`,
        remainingMs: action.durationMs ?? -1,
      };
      switch (action.stat) {
        case 'attack':
          effect.savedAttack = monster.dealsDamage.attack;
          monster.dealsDamage.attack = Math.round(monster.dealsDamage.attack * action.mult);
          break;
        case 'speed':
          effect.savedSpeed = monster.hasPosition.speed;
          monster.hasPosition.speed = Math.round(monster.hasPosition.speed * action.mult);
          break;
        case 'plating':
          effect.savedPlating = monster.mitigatesDamage.plating;
          monster.mitigatesDamage.plating = Math.round(monster.mitigatesDamage.plating * action.mult);
          break;
        case 'damageReduction':
          effect.savedDamageReduction = monster.mitigatesDamage.damageReduction;
          monster.mitigatesDamage.damageReduction = Math.min(0.95, monster.mitigatesDamage.damageReduction * action.mult);
          break;
      }
      state.activeEffects.push(effect);
      break;
    }

    case 'summon': {
      const nodeDef     = NODE_REGISTRY.get(monster.hasPosition.nodeId);
      const nodeWidth   = nodeDef?.width  ?? GAME_CONFIG.NODE_WIDTH;
      const nodeHeight  = nodeDef?.height ?? GAME_CONFIG.NODE_HEIGHT;
      const offsetRange = action.offsetRange ?? 200;

      for (let i = 0; i < action.count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist  = Math.random() * offsetRange;
        const x = Math.max(64, Math.min(nodeWidth  - 64, monster.hasPosition.current.x + Math.cos(angle) * dist));
        const y = Math.max(64, Math.min(nodeHeight - 64, monster.hasPosition.current.y + Math.sin(angle) * dist));
        world.createMonster(monster.hasPosition.nodeId, action.monsterTypeId, x, y);
      }
      break;
    }
  }
}
