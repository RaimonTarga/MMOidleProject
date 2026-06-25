/**
 * Boss fight scripting system.
 *
 * Each boss can opt-in by setting `bossScript` in its MonsterDefinition.
 * The script declares:
 *   - phases:    one-shot HP-threshold triggers (fire once per fight life)
 *   - repeating: periodic timers (run continuously once the boss is engaged)
 *
 * Supported actions (BossAction union in monsterDatabase.ts):
 *   enrage         — multiply attack + accelerate cooldown, optional duration
 *   regen          — heal hpPctPerSec × maxHp per second, optional duration
 *   shield         — add flat damage-reduction for a fixed window (cyclic)
 *   summon         — spawn N minions of a given type near the boss
 *   stat-buff      — multiply any single stat (incl. evasion), optional duration
 *   morph          — flip non-numeric stance fields (ranged/style/range/dot/kite)
 *   slam           — instant AoE burst centered on the boss
 *   apply-shield   — gain a runtime enemyShield override mid-fight
 *   apply-soft-cap — gain a runtime enemySoftCap override mid-fight
 *   shed-defense   — drop all defenses (clear overrides, suppress static, cut plating)
 *   modify-ramp-debuff — raise the rampDebuff slow caps mid-fight
 *   spawn-adds     — spawn tracked adds despawned on boss death
 *
 * Runtime state lives on `entity.scriptsBoss` (server-only, never serialized).
 * Dead bosses are pruned when the monster entity is removed from the world.
 */

import type { BossAction, BossPhase, BossScript, RepeatingAction } from '@mmo-idle/shared';
import {
  MONSTER_DATABASE,
  GAME_CONFIG,
  FROST_RAMP_EFFECT_ID,
  frostRampMaxStacks,
  getStatusEffect,
} from '@mmo-idle/shared';
import { NODE_REGISTRY } from '../../../world/nodeRegistry';
import type { World } from '../../../world/World';
import type { MonsterEntity } from '../../../ecs/entity';
import type { ActiveBossEffect, ScriptsBoss } from '@mmo-idle/shared';
import { initScriptsBoss } from '@mmo-idle/shared';
import { attachComponent } from '../../../ecs/markerHelpers';
import { markSliceDirty } from '../../../ecs/dirtyHelpers';
import { applyMonsterAoe } from '../damage/aoeDamage';

export type { ScriptsBoss, ActiveBossEffect } from '@mmo-idle/shared';
export { initScriptsBoss } from '@mmo-idle/shared';

// ── Main update ───────────────────────────────────────────────────────────────

export function updateBossScripts(world: World, dt: number): void {
  for (const e of world.bossScriptedMonsters) {
    const def = MONSTER_DATABASE.get(e.isMonster.monsterTypeId);
    if (!def?.bossScript) continue;

    const script = def.bossScript;
    const state = e.scriptsBoss!;

    if (e.hasAggroTarget) attachComponent(world, e, 'isBossEngaged', {});

    tickActiveEffects(state, e, world, dt);

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
  world: World,
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
    restoreStats(effect, monster, world, state);
    state.activeEffects = state.activeEffects.filter(fx => fx !== effect);
  }
}

function restoreStats(
  effect: ActiveBossEffect,
  monster: MonsterEntity,
  world: World,
  state: ScriptsBoss,
): void {
  if (effect.savedAttack          !== undefined) monster.dealsDamage.attack = effect.savedAttack;
  if (effect.savedCooldown        !== undefined) monster.performsAttack.attackCooldown = effect.savedCooldown;
  if (effect.savedPlating         !== undefined) monster.mitigatesDamage.plating = effect.savedPlating;
  if (effect.savedDamageReduction !== undefined) monster.mitigatesDamage.damageReduction = effect.savedDamageReduction;
  if (effect.savedSpeed           !== undefined) monster.hasPosition.speed = effect.savedSpeed;

  // Morph reverts — restore networked combat fields and the server-only overrides.
  if (effect.savedIsRanged !== undefined) {
    monster.isMonster.isRanged = effect.savedIsRanged;
    markSliceDirty(world, monster, 'isMonster');
  }
  if (effect.savedAttackStyle !== undefined) {
    monster.dealsDamage.attackStyle = effect.savedAttackStyle;
    markSliceDirty(world, monster, 'dealsDamage');
  }
  if (effect.savedAttackRange !== undefined) {
    monster.performsAttack.attackRange = effect.savedAttackRange;
    markSliceDirty(world, monster, 'performsAttack');
  }
  if (effect.hadDotOverride !== undefined) {
    state.dotEffectOverride = effect.hadDotOverride ? effect.savedDotEffect : undefined;
  }
  if (effect.hadKiteOverride !== undefined) {
    state.kiteOverride = effect.hadKiteOverride ? effect.savedKite : undefined;
  }
  if (effect.hadEvasionOverride !== undefined) {
    state.evasionOverride = effect.hadEvasionOverride ? effect.savedEvasionOverride : undefined;
  }
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
        case 'evasion': {
          // Evasion is a runtime override (no entity field). Base off the live
          // override or the static def. A timed buff saves the prior override.
          const def = MONSTER_DATABASE.get(monster.isMonster.monsterTypeId);
          const base = state.evasionOverride ?? def?.evasion ?? 0;
          if (action.durationMs !== undefined) {
            effect.hadEvasionOverride = state.evasionOverride !== undefined;
            effect.savedEvasionOverride = state.evasionOverride;
          }
          state.evasionOverride = base * action.mult;
          break;
        }
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
        const pos = {
          x: Math.max(64, Math.min(nodeWidth  - 64, monster.hasPosition.current.x + Math.cos(angle) * dist)),
          y: Math.max(64, Math.min(nodeHeight - 64, monster.hasPosition.current.y + Math.sin(angle) * dist)),
        };
        world.createMonster(monster.hasPosition.nodeId, action.monsterTypeId, pos);
      }
      break;
    }

    case 'morph': {
      const timed = action.durationMs !== undefined;
      const effect: ActiveBossEffect = {
        type:        'morph',
        remainingMs: action.durationMs ?? -1,
      };

      if (action.isRanged !== undefined) {
        if (timed) effect.savedIsRanged = monster.isMonster.isRanged ?? false;
        monster.isMonster.isRanged = action.isRanged;
        markSliceDirty(world, monster, 'isMonster');
      }
      if (action.attackStyle !== undefined) {
        if (timed) effect.savedAttackStyle = monster.dealsDamage.attackStyle;
        monster.dealsDamage.attackStyle = action.attackStyle;
        markSliceDirty(world, monster, 'dealsDamage');
      }
      if (action.attackRange !== undefined) {
        if (timed) effect.savedAttackRange = monster.performsAttack.attackRange;
        monster.performsAttack.attackRange = action.attackRange;
        markSliceDirty(world, monster, 'performsAttack');
      }
      if (action.dotEffect !== undefined) {
        if (timed) {
          effect.hadDotOverride = state.dotEffectOverride !== undefined;
          effect.savedDotEffect = state.dotEffectOverride;
        }
        state.dotEffectOverride = action.dotEffect ?? undefined;
      }
      if (action.kite !== undefined) {
        if (timed) {
          effect.hadKiteOverride = state.kiteOverride !== undefined;
          effect.savedKite = state.kiteOverride;
        }
        state.kiteOverride = action.kite;
      }

      // Only track the effect when it can expire — a permanent morph needs no bookkeeping.
      if (timed) state.activeEffects.push(effect);
      break;
    }

    case 'slam': {
      // Instant AoE burst centered on the boss — hits all players and enemy
      // summons in radius (no exclude). Pure damage, no slow/DoT.
      applyMonsterAoe(
        world,
        monster,
        monster.hasPosition.current,
        action.radius,
        monster.dealsDamage.attack * (action.damageMult ?? 1),
      );
      break;
    }

    case 'apply-shield': {
      // Runtime enemyShield gained mid-fight. The barrier comes up on the next
      // incoming hit (the monsterMechanics shield path refreshes on demand).
      state.shieldOverride = {
        shieldPct:  action.shieldPct,
        intervalMs: action.intervalMs,
        durationMs: action.durationMs,
      };
      break;
    }

    case 'apply-soft-cap': {
      // Runtime enemySoftCap gained mid-fight — clips the player's oversized hits.
      state.softCapOverride = { capPct: action.capPct, capMult: action.capMult };
      break;
    }

    case 'shed-defense': {
      // Desperation finale: drop every defense. Clear the runtime overrides and
      // set the suppression flag so any STATIC enemyShield/enemySoftCap is also
      // ignored, then crumble plating to ~20% of its current value.
      state.defenseShed = true;
      state.shieldOverride = undefined;
      state.softCapOverride = undefined;
      monster.mitigatesDamage.plating = Math.round(monster.mitigatesDamage.plating * 0.2);
      break;
    }

    case 'modify-ramp-debuff': {
      // Raise the rampDebuff caps. Future applications read the override (see the
      // combat onHit rampDebuff path); patch live frost-ramp stacks here so the
      // tightening is felt immediately by anyone already debuffed.
      state.rampDebuffCapOverride = {
        moveSlowMaxPct: action.moveSlowMaxPct,
        atkSlowMaxPct:  action.atkSlowMaxPct,
      };
      const def = MONSTER_DATABASE.get(monster.isMonster.monsterTypeId);
      const ramp = def?.rampDebuff;
      if (ramp) {
        const newMaxStacks = frostRampMaxStacks({
          ...ramp,
          moveSlowMaxPct: action.moveSlowMaxPct,
          atkSlowMaxPct:  action.atkSlowMaxPct,
        });
        for (const player of world.livePlayersInNode(monster.hasPosition.nodeId)) {
          const fx = getStatusEffect(player.tracksCombat, FROST_RAMP_EFFECT_ID);
          if (!fx) continue;
          fx.maxStacks = newMaxStacks;
          fx.data.moveSlowMaxPct = action.moveSlowMaxPct;
          fx.data.atkSlowMaxPct  = action.atkSlowMaxPct;
        }
      }
      break;
    }

    case 'spawn-adds': {
      // Same spawn geometry as 'summon', but track the ids so the swarm is
      // despawned when the boss dies (see grantMonsterRewards).
      // TODO(leash): adds do not yet leash to the boss — they use normal AI leash.
      const nodeDef     = NODE_REGISTRY.get(monster.hasPosition.nodeId);
      const nodeWidth   = nodeDef?.width  ?? GAME_CONFIG.NODE_WIDTH;
      const nodeHeight  = nodeDef?.height ?? GAME_CONFIG.NODE_HEIGHT;
      const offsetRange = action.offsetRange ?? 200;

      state.spawnedAddIds ??= [];
      // Prune dead adds, then (if capped) only top the swarm back up to maxAlive —
      // so a repeating summoner (necromancer) can never flood the node.
      state.spawnedAddIds = state.spawnedAddIds.filter((id) => world.hasMonster(id));
      let budget = action.count;
      if (action.maxAlive !== undefined) {
        budget = Math.min(budget, Math.max(0, action.maxAlive - state.spawnedAddIds.length));
      }
      for (let i = 0; i < budget; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist  = Math.random() * offsetRange;
        const pos = {
          x: Math.max(64, Math.min(nodeWidth  - 64, monster.hasPosition.current.x + Math.cos(angle) * dist)),
          y: Math.max(64, Math.min(nodeHeight - 64, monster.hasPosition.current.y + Math.sin(angle) * dist)),
        };
        const add = world.createMonster(monster.hasPosition.nodeId, action.monsterTypeId, pos);
        if (add) state.spawnedAddIds.push(add.isMonster.id);
      }
      break;
    }
  }
}
