/**
 * Monster afflictions on summons (class-first build plan S1, bible §7.10): a summon takes a
 * monster's debuffs the same as a player does (poison, slows, roots, stuns, marks, sunder,
 * corrosion, the frost ramp), so the debuff biomes test the Conduit like every other class.
 * A summon has no resistances, refusals or evasion of its own; gear lines may add them later.
 *
 * What lands is decided by the one monster rider table (`monsterRiders.ts`). This file is the
 * summon's side of it: its DoTs and their ticks, its corrosion, and what its statuses do to
 * its movement and its swings. A summon a DoT kills is left at 0 HP, and the summoner tick
 * queues its rebuild like any other death.
 */
import {
  applyStatusEffect,
  computeLinearDotDamage,
  FROST_RAMP_EFFECT_ID,
  frostRampMoveSlowPct,
  GAME_CONFIG,
  getStatusEffect,
  isMonsterDotStatusEffectId,
  LAIR_DRAG_ROOT_EFFECT_ID,
  MONSTER_DATABASE,
  PLATING_SHRED_EFFECT_ID,
  playerIncomingDamageMult,
  playerMoveSpeedMult,
  removeStatusEffect,
  resolveMonsterDotDebuff,
  type MonsterDefinition,
} from '@mmo-idle/shared';
import { markSliceDirty } from '../../../ecs/dirtyHelpers';
import type { MinionEntity, MonsterEntity } from '../../../ecs/entity';
import { attachMarker, detachMarker } from '../../../ecs/markerHelpers';
import type { World } from '../../../world/World';
import { pushDamageEvent } from '../damage/damageEvent';
import { monsterDotElement } from '../damage/dotTickEvent';
import { attackCadenceMult } from '../engine/attackCadence';
import { effectiveMonsterDot, monsterDotStacksForHit } from '../engine/monsterMechanics';
import { buildKillerFromMonster } from '../../world/deathCause';
import { isHardControlled } from './playerHardControl';

/** One definition-shaped monster DoT stack on a summon (the player version less its resistances). */
export function applyMonsterDotToMinion(
  world: World,
  monster: MonsterEntity,
  minion: MinionEntity,
  dotEffect: NonNullable<MonsterDefinition['dotEffect']>,
  abilityName?: string,
): void {
  const monsterDef = MONSTER_DATABASE.get(monster.isMonster.monsterTypeId);
  const debuff = resolveMonsterDotDebuff({ monster: monsterDef, dotEffect });
  const durationMs = Math.max(1, Math.round(dotEffect.durationMs ?? 5_000));
  const effect = applyStatusEffect(minion.tracksCombat, {
    id: debuff.statusEffectId,
    maxStacks: dotEffect.maxStacks,
    instanced: false,
    sourceId: monster.isMonster.id,
    damageSource: { killer: buildKillerFromMonster(monster), abilityName, effectName: debuff.label, effectColor: debuff.color },
    remainingMs: durationMs,
    refreshable: true,
    data: {
      damagePerStack: dotEffect.damagePerStack,
      nextTickIn: dotEffect.tickIntervalMs,
      tickIntervalMs: dotEffect.tickIntervalMs,
      tickOnExpire: 1,
      totalMs: durationMs,
      flavorCode: debuff.code,
      isDot: 1,
    },
  });
  // As on a player: a refreshed stack takes the newest dose's numbers.
  effect.data.damagePerStack = dotEffect.damagePerStack;
  effect.data.tickIntervalMs = dotEffect.tickIntervalMs;
  effect.data.totalMs = durationMs;
  attachMarker(world, minion, 'hasDot');
}

/**
 * A landed monster hit's DoT on a summon. A player gets the same from the monster-to-player
 * `onHit` listener; a summon's hit skips the pipeline, so its swing applies it here.
 */
export function applyMonsterHitDotToMinion(
  world: World,
  monster: MonsterEntity,
  def: MonsterDefinition | undefined,
  minion: MinionEntity,
  now: number,
): void {
  const dotEffect = effectiveMonsterDot(monster, def);
  if (!dotEffect) return;
  const stacks = monsterDotStacksForHit(monster, dotEffect, now);
  for (let i = 0; i < stacks; i++) applyMonsterDotToMinion(world, monster, minion, dotEffect);
}

/** The Cave corrosion on a summon: one stack per landed hit, its threshold poisons included. */
export function applyMinionPlatingShred(
  world: World,
  monster: MonsterEntity,
  minion: MinionEntity,
  def: MonsterDefinition,
  abilityName?: string,
): void {
  const platingShred = def.castsPlatingShred ?? def.appliesPlatingShred;
  if (!platingShred) return;
  const deepen = monster.scriptsBoss?.shredOverride;
  const maxStacks = platingShred.maxStacks + (deepen?.maxStacksAdd ?? 0);
  const perStack = platingShred.platingPerStack + (deepen?.platingPerStackAdd ?? 0);
  const corrosion = applyStatusEffect(minion.tracksCombat, {
    id: PLATING_SHRED_EFFECT_ID,
    maxStacks,
    remainingMs: -1,
    refreshable: false,
    sourceId: monster.isMonster.id,
    data: { platingPerStack: perStack },
  });
  const poison = platingShred.thresholdPoison;
  if (poison && (poison.atStacks.includes(corrosion.stacks) || deepen?.extraThresholds.includes(corrosion.stacks))) {
    applyMonsterDotToMinion(world, monster, minion, poison, abilityName);
  }
}

/** Damage a summon takes from every source, after Desert sundering (`playerIncomingDamageMult` reads any combat state). */
export function minionDamageTakenMult(minion: MinionEntity): number {
  return playerIncomingDamageMult(minion.tracksCombat);
}

/**
 * The summon's movement after its own statuses: a stun or root stops it (0); slows and the
 * frost ramp compound under the same floor a player's do.
 */
export function minionMoveSpeedMult(minion: MinionEntity): number {
  const cs = minion.tracksCombat;
  if (isHardControlled(cs) || getStatusEffect(cs, LAIR_DRAG_ROOT_EFFECT_ID)) return 0;
  const mults: number[] = [];
  const slow = getStatusEffect(cs, 'slow');
  if (slow) mults.push(Math.max(0, slow.data['speedMult'] ?? 1));
  const frostRamp = getStatusEffect(cs, FROST_RAMP_EFFECT_ID);
  if (frostRamp) mults.push(1 - frostRampMoveSlowPct(frostRamp));
  return playerMoveSpeedMult(mults);
}

/** A stunned or otherwise hard-controlled summon doesn't swing. */
export function minionCanSwing(minion: MinionEntity): boolean {
  return !isHardControlled(minion.tracksCombat);
}

/** The summon's swing interval after the frost ramp's attack slow. */
export function minionAttackCooldown(minion: MinionEntity): number {
  return minion.performsAttack.attackCooldown * attackCadenceMult(minion.tracksCombat);
}

/**
 * Tick every monster DoT on a summon. Plating doesn't apply to a DoT and damage reduction
 * applies at the DoT share, as for players (`CLAUDE.md`: DoT ticks pay half of DR).
 */
export function updateMinionAfflictions(world: World, dt: number): void {
  for (const minion of [...world.dottedMinions]) {
    const state = minion.tracksCombat;
    for (const effect of state.statusEffects.filter((e) => isMonsterDotStatusEffectId(e.id))) {
      if (minion.hasHealth.hp <= 0) break;
      effect.data.nextTickIn -= dt;
      if (effect.data.nextTickIn > 0) continue;
      const base = computeLinearDotDamage(effect);
      const dr = minion.mitigatesDamage.damageReduction * GAME_CONFIG.DOT_DR_SHARE;
      const damage = Math.max(1, Math.round(base * (1 - dr) * minionDamageTakenMult(minion)));
      minion.hasHealth.hp = Math.max(0, minion.hasHealth.hp - damage);
      markSliceDirty(world, minion, 'hasHealth');
      pushDamageEvent(world, minion, damage, {
        category: 'dot',
        element: monsterDotElement(world, effect.sourceId, effect),
        sourceId: effect.sourceId,
      });
      if (effect.remainingMs <= 0) removeStatusEffect(state, effect.id);
      else effect.data.nextTickIn = effect.data.tickIntervalMs;
    }
    if (!state.statusEffects.some((e) => isMonsterDotStatusEffectId(e.id))) detachMarker(world, minion, 'hasDot');
  }
}
