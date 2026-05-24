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

import type { MonsterState } from '@mmo-idle/shared';
import type { BossAction, BossPhase, BossScript, RepeatingAction } from '@mmo-idle/shared';
import { MONSTER_DATABASE, GAME_CONFIG } from '@mmo-idle/shared';
import { NODE_REGISTRY } from '../world/nodeRegistry';
import type { World } from '../world/World';

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
  // Prune stale state for bosses that died since last tick.
  for (const monsterId of world.bossState.keys()) {
    if (!world.monsters.has(monsterId)) world.bossState.delete(monsterId);
  }

  for (const [monsterId, monster] of world.monsters) {
    if (!monster.isBoss) continue;

    const def = MONSTER_DATABASE.get(monster.monsterTypeId);
    if (!def?.bossScript) continue;

    const script = def.bossScript;

    // Lazy-init runtime state.
    let state = world.bossState.get(monsterId);
    if (!state) {
      state = initBossState(script);
      world.bossState.set(monsterId, state);
    }

    // Mark engaged on first aggro.
    const ai = world.monsterAI.get(monsterId);
    if (ai?.aggroTargetId !== null) state.engaged = true;

    // Advance and expire active effects (regen also ticks here).
    tickActiveEffects(state, monster, dt);

    if (state.engaged) {
      if (script.phases)    checkPhaseTransitions(state, script.phases,    monster, world);
      if (script.repeating) tickRepeatingActions(state,  script.repeating,  monster, world, dt);
    }

    // Mirror active effect names to MonsterState for client display.
    monster.bossEffects = [...new Set(state.activeEffects.map(e => e.type))];
  }
}

// ── Active-effect lifecycle ───────────────────────────────────────────────────

function tickActiveEffects(
  state: BossRuntimeState,
  monster: MonsterState,
  dt: number,
): void {
  const toExpire: ActiveBossEffect[] = [];

  for (const effect of state.activeEffects) {
    // Regen tick — runs every tick regardless of whether it expires this frame.
    if (effect.regenHpPctPerSec !== undefined) {
      monster.hp = Math.min(
        monster.maxHp,
        monster.hp + monster.maxHp * effect.regenHpPctPerSec * (dt / 1000),
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
function restoreStats(effect: ActiveBossEffect, monster: MonsterState): void {
  if (effect.savedAttack          !== undefined) monster.attack          = effect.savedAttack;
  if (effect.savedCooldown        !== undefined) monster.attackCooldown  = effect.savedCooldown;
  if (effect.savedPlating         !== undefined) monster.plating         = effect.savedPlating;
  if (effect.savedDamageReduction !== undefined) monster.damageReduction = effect.savedDamageReduction;
  if (effect.savedSpeed           !== undefined) monster.speed           = effect.savedSpeed;
}

// ── Phase transitions ─────────────────────────────────────────────────────────

/**
 * Iterate phases in declaration order (author writes them high→low hpPct).
 * Each fires at most once per boss life.
 */
function checkPhaseTransitions(
  state: BossRuntimeState,
  phases: BossPhase[],
  monster: MonsterState,
  world: World,
): void {
  const hpPct = monster.hp / monster.maxHp;
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
  monster: MonsterState,
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
  monster: MonsterState,
  world: World,
  state: BossRuntimeState,
): void {
  switch (action.type) {

    case 'enrage': {
      const effect: ActiveBossEffect = {
        type:          'enrage',
        remainingMs:   action.durationMs ?? -1,
        savedAttack:   monster.attack,
        savedCooldown: monster.attackCooldown,
      };
      monster.attack         = Math.round(monster.attack * action.atkMult);
      monster.attackCooldown = Math.max(200, Math.round(monster.attackCooldown * action.cdMult));
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
        savedDamageReduction: monster.damageReduction,
      };
      monster.damageReduction = Math.min(0.95, monster.damageReduction + action.drAdd);
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
          effect.savedAttack = monster.attack;
          monster.attack     = Math.round(monster.attack * action.mult);
          break;
        case 'speed':
          effect.savedSpeed = monster.speed;
          monster.speed     = Math.round(monster.speed * action.mult);
          break;
        case 'plating':
          effect.savedPlating = monster.plating;
          monster.plating     = Math.round(monster.plating * action.mult);
          break;
        case 'damageReduction':
          effect.savedDamageReduction = monster.damageReduction;
          monster.damageReduction     = Math.min(0.95, monster.damageReduction * action.mult);
          break;
      }
      state.activeEffects.push(effect);
      break;
    }

    case 'summon': {
      const nodeDef     = NODE_REGISTRY.get(monster.nodeId);
      const nodeWidth   = nodeDef?.width  ?? GAME_CONFIG.NODE_WIDTH;
      const nodeHeight  = nodeDef?.height ?? GAME_CONFIG.NODE_HEIGHT;
      const offsetRange = action.offsetRange ?? 200;

      for (let i = 0; i < action.count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist  = Math.random() * offsetRange;
        const x = Math.max(64, Math.min(nodeWidth  - 64, monster.x + Math.cos(angle) * dist));
        const y = Math.max(64, Math.min(nodeHeight - 64, monster.y + Math.sin(angle) * dist));
        world.createMonster(monster.nodeId, action.monsterTypeId, x, y);
      }
      break;
    }
  }
}
