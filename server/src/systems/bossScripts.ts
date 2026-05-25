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
 * Runtime state is stored in World.bossState (server-only, never serialized).
 * Dead bosses are pruned at the start of each tick.
 */

import type { BossAction, BossPhase, BossScript, RepeatingAction } from '@mmo-idle/shared';
import { MONSTER_DATABASE, GAME_CONFIG } from '@mmo-idle/shared';
import { NODE_REGISTRY } from '../world/nodeRegistry';
import type { World } from '../world/World';
import type { MonsterEntity } from '../ecs/components/monster';

// ── Runtime state (server-only) ───────────────────────────────────────────────

/**
 * An active timed effect on a boss.
 * Stat fields hold the pre-buff values so they can be restored on expiry.
 */
interface ActiveBossEffect {
  type: string;
  /** Remaining ms. -1 = permanent (lasts until boss dies). */
  remainingMs: number;
  /** For 'regen': HP fraction of maxHp to restore per second. */
  regenHpPctPerSec?: number;
  /** Saved stats — restored when effect expires. */
  savedAttack?:          number;
  savedCooldown?:        number;
  savedPlating?:         number;
  savedDamageReduction?: number;
  savedSpeed?:           number;
}

/**
 * Per-boss runtime tracking. Stored in World.bossState, keyed by monster.id.
 * Created on first encounter, deleted when the monster is removed from World.monsters.
 */
export interface BossRuntimeState {
  /** True once any player has aggro'd this boss this life. Timers don't tick before this. */
  engaged: boolean;
  /** Parallel array to BossScript.phases — true once that phase has fired. */
  phaseTriggered: boolean[];
  /** Countdown timers per RepeatingAction (ms until next fire), in script order. */
  repeatingTimers: number[];
  /** Currently active timed effects. */
  activeEffects: ActiveBossEffect[];
}

function initBossState(script: BossScript): BossRuntimeState {
  return {
    engaged:         false,
    phaseTriggered:  new Array(script.phases?.length ?? 0).fill(false) as boolean[],
    repeatingTimers: (script.repeating ?? []).map(r => r.initialDelayMs ?? r.intervalMs),
    activeEffects:   [],
  };
}

// ── Main update ───────────────────────────────────────────────────────────────

export function updateBossScripts(world: World, dt: number): void {
  // Note: `removeMonsterEntity` cascades component removal, so stale bossState
  // pruning is automatic post-S7 — no explicit prune loop needed here.

  for (const e of world.monsterEntities) {
    if (!e.isMonster.isBoss) continue;

    const def = MONSTER_DATABASE.get(e.isMonster.monsterTypeId);
    if (!def?.bossScript) continue;

    const script = def.bossScript;

    // Lazy-init runtime state on first encounter.
    if (!e.bossState) {
      world.setBossState(e.isMonster.id, initBossState(script));
    }
    const state = e.bossState!;

    // Mark engaged on first aggro.
    if (e.monsterAi.aggroTargetId !== null) state.engaged = true;

    // Advance and expire active effects (regen also ticks here).
    tickActiveEffects(state, e, dt);

    if (state.engaged) {
      if (script.phases)    checkPhaseTransitions(state, script.phases,    e, world);
      if (script.repeating) tickRepeatingActions(state,  script.repeating,  e, world, dt);
    }

    e.hasStatus.bossEffects = [...new Set(state.activeEffects.map(e => e.type))];
  }
}

// ── Active-effect lifecycle ───────────────────────────────────────────────────

function tickActiveEffects(
  state: BossRuntimeState,
  monster: MonsterEntity,
  dt: number,
): void {
  const toExpire: ActiveBossEffect[] = [];

  for (const effect of state.activeEffects) {
    // Regen tick — runs every tick regardless of whether it expires this frame.
    if (effect.regenHpPctPerSec !== undefined) {
      monster.hasHealth.hp = Math.min(
        monster.hasHealth.maxHp,
        monster.hasHealth.hp + monster.hasHealth.maxHp * effect.regenHpPctPerSec * (dt / 1000),
      );
    }

    if (effect.remainingMs === -1) continue;  // permanent — skip timer
    effect.remainingMs -= dt;
    if (effect.remainingMs <= 0) toExpire.push(effect);
  }

  for (const effect of toExpire) {
    restoreStats(effect, monster);
    state.activeEffects = state.activeEffects.filter(e => e !== effect);
  }
}

/** Restore any stats that were modified when this effect was applied. */
function restoreStats(effect: ActiveBossEffect, monster: MonsterEntity): void {
  if (effect.savedAttack          !== undefined) monster.dealsDamage.attack = effect.savedAttack;
  if (effect.savedCooldown        !== undefined) monster.performsAttack.attackCooldown = effect.savedCooldown;
  if (effect.savedPlating         !== undefined) monster.mitigatesDamage.plating = effect.savedPlating;
  if (effect.savedDamageReduction !== undefined) monster.mitigatesDamage.damageReduction = effect.savedDamageReduction;
  if (effect.savedSpeed           !== undefined) monster.hasPosition.speed = effect.savedSpeed;
}

// ── Phase transitions ─────────────────────────────────────────────────────────

/**
 * Iterate phases in declaration order (author writes them high→low hpPct).
 * Each fires at most once per boss life.
 */
function checkPhaseTransitions(
  state: BossRuntimeState,
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

// ── Repeating timers ──────────────────────────────────────────────────────────

function tickRepeatingActions(
  state: BossRuntimeState,
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

// ── Action dispatch ───────────────────────────────────────────────────────────

function applyAction(
  action: BossAction,
  monster: MonsterEntity,
  world: World,
  state: BossRuntimeState,
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
