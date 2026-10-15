import { drainStorm } from '../energy/spirit';
import { laySigils, payoffsOf } from './sigils';
import { incomingFinalDamage } from '../../../combat/damage/finalDamage';
import { GAME_CONFIG } from '@mmo-idle/shared';
import {
  MONSTER_DATABASE,
  computeLinearDotDamage,
  isMonsterDotStatusEffectId,
} from "@mmo-idle/shared";
import { registerCombatListener } from "../../../combat/engine/combatPipeline";
import {
  effectiveMonsterDot,
  monsterDotStacksForHit,
} from "../../../combat/engine/monsterMechanics";
import {
  getStatusEffects,
  removeStatusEffect,
} from "@mmo-idle/shared";
import { grantMonsterRewards } from "../../../player/progression/rewards";
import { classDotTickDamage } from "./tickDamage";
import type { DeathCause } from "@mmo-idle/shared";
import type { MonsterEntity, PlayerEntity } from "../../../../ecs/entity";
import type { World } from "../../../../world/World";
import {
  detachComponent,
  detachMarkerIfNoEffect,
} from "../../../../ecs/markerHelpers";
import { canApplyPlayerDebuff } from "../../../combat/status/debuffGuard";
import { evadeBlocksDebuffs } from "../../../defense/mitigation/evasion";
import { applyMonsterDotToPlayer } from '../../../combat/status/monsterDot';
import { strikerDotFloor } from '../cadence/strikerGear';
import { squireDotTickFill } from '../cooldown/squire';
import {
  pushDotTickEvent,
  dotElementForSource,
  pushPlayerDotTickEvent,
  monsterDotElement,
} from "../../../combat/damage/dotTickEvent";
import { emitPlayerMonsterOnKill } from "../../../combat/damage/killHooks";
import { buildKillerFromSourceId } from "../../../world/deathCause";
import {
  buildSimpleBreakdown,
  recordMonsterDamagedByPlayer,
  recordPlayerDamaged,
} from "../../../../world/worldLogCombat";
import { recordWorldLogEvent } from "../../../../world/worldLog";
import {
  actorFromMonster,
  actorFromPlayer,
  actorFromSourceId,
} from "../../../../world/worldLogActors";
import { isInvulnerableMonster, isInvulnerablePlayer } from "../../../combat/invulnerability";
import { drainWards } from "../../../defense/barrier/wards";
import { drainBarrier, stampBarrierDamage } from "../../../defense/barrier/barrier";
import { DOT_EFFECT_ID } from "./constants";

/** Sweep's secondary targets use the same sigils as the Apprentice's ordinary hits. */
export function applyClassDotStack(world: World, attacker: PlayerEntity, defender: MonsterEntity): void {
  const payoffs = payoffsOf(world, attacker);
  if (payoffs) laySigils(world, attacker, defender, 1, payoffs.cap);
}

// ── Tick-driven DoT ───────────────────────────────────────────────────────────

/**
 * Run once per world tick (after updateCombatState so durations are already ticked).
 *
 * Processes DoT ticks for:
 *   - Monster-side: player-applied DoT stacks on monsters.
 *   - Player-side: monster-applied DoT stacks on players.
 */
export function updateDotArchetype(world: World, dt: number, now = Date.now()): void {
  // ── Monster-side: player-applied DoT ticking on monsters ─────────────────
  const monstersToKill: Array<{
    monsterId: string;
    sourceId: string;
    damage: number;
  }> = [];
  for (const entity of world.dottedMonsters) {
    const monsterId = entity.isMonster.id;
    const state = entity.tracksCombat;
    if (isInvulnerableMonster(entity)) continue;
    const effect = getStatusEffects(state, DOT_EFFECT_ID)[0];
    if (!effect) {
      detachMarkerIfNoEffect(world, entity, "hasDot", state, DOT_EFFECT_ID);
      continue;
    }

    effect.data.nextTickIn -= dt;
    if (effect.data.nextTickIn > 0) continue;

    const rawTick = computeLinearDotDamage(effect);
    const damage = classDotTickDamage(world, entity, effect.sourceId, rawTick);
    const source = actorFromSourceId(world, effect.sourceId);
    recordMonsterDamagedByPlayer(
      world,
      effect.sourceId,
      source,
      entity,
      damage,
      'dot',
      buildSimpleBreakdown(damage, damage),
    );

    entity.hasHealth.hp -= damage;
    pushDotTickEvent(world, entity, dotElementForSource(world, effect.sourceId), damage, {
      sourceType: "class",
      sourceId: effect.sourceId,
    });

    if (entity.hasHealth.hp <= 0) {
      monstersToKill.push({ monsterId, sourceId: effect.sourceId, damage });
    } else if (effect.remainingMs <= 0) {
      removeStatusEffect(state, DOT_EFFECT_ID);
      detachMarkerIfNoEffect(world, entity, "hasDot", state, DOT_EFFECT_ID);
    } else {
      effect.data.nextTickIn = effect.data.tickIntervalMs;
    }
  }

  for (const { monsterId, sourceId, damage } of monstersToKill) {
    const monster = world.getMonsterEntity(monsterId);
    if (monster && sourceId) {
      emitPlayerMonsterOnKill(world, sourceId, monster, damage, "dot");
      const rewardInfo = grantMonsterRewards(world, sourceId, monster);
      const player = world.getPlayerEntity(sourceId);
      const source = player ? actorFromPlayer(player) : actorFromSourceId(world, sourceId);
      recordWorldLogEvent(
        world,
        {
          kind: 'kill',
          nodeId: monster.hasPosition.nodeId,
          killer: source,
          victim: actorFromMonster(monster),
          damage,
          essenceGained: rewardInfo?.essenceGained ?? 0,
          essenceType: rewardInfo?.essenceType ?? 'green',
          biomeXpGained: rewardInfo?.biomeXpGained ?? 0,
        },
        {
          visibility: 'combat',
          relatedPlayerIds: [sourceId],
          nodeId: monster.hasPosition.nodeId,
        },
      );
      if (player) {
        world.pushEvent(player.hasPosition.nodeId, {
          kind: "player-kill",
          playerId: sourceId,
          targetId: monster.isMonster.id,
          targetName: monster.isMonster.name,
          damage,
          biomeXpGained: rewardInfo?.biomeXpGained ?? 0,
          essenceGained: rewardInfo?.essenceGained ?? 0,
          essenceType: rewardInfo?.essenceType ?? "green",
        });
      }
    }
    world.removeMonsterEntity(monsterId);
  }

  // ── Player-side: monster-applied DoT ticking on players ──────────────────
  // DoT bypasses plating (flat armor) — that is its inherent identity.
  // damageReduction (%) applies at DOT_DR_SHARE so builds without dot-resistance retain baseline
  // protection; dot-resistance is the dedicated counter that stacks on top.
  const playersToRespawn: Array<{ playerId: string; cause: DeathCause }> = [];

  for (const entity of world.dottedPlayers) {
    if (isInvulnerablePlayer(entity)) continue;
    const playerId = entity.isPlayer.id;
    const state = entity.tracksCombat;
    const effects = state.statusEffects.filter((effect) =>
      isMonsterDotStatusEffectId(effect.id),
    );
    if (effects.length === 0) {
      detachMarkerIfNoMonsterDot(world, entity, state);
      continue;
    }

    for (const effect of effects) {
    effect.data.nextTickIn -= dt;
    if (effect.data.nextTickIn > 0) continue;

    const base = computeLinearDotDamage(effect);
    const dotResist = Math.min(
      0.9,
      (entity.usesSkills.passives["defense.dot-resistance"] ?? 0)
        // The Slinger's Oilskin: damage over time on you is shrugged off while you reload.
        + (entity.usesReload && entity.usesReload.reloadingMs > 0 ? entity.usesSkills.passives['slinger.oilskin'] ?? 0 : 0),
    );
    // General DR applies at GAME_CONFIG.DOT_DR_SHARE; dedicated resistance adds specialization.
    const drForDot = entity.mitigatesDamage.damageReduction * GAME_CONFIG.DOT_DR_SHARE;
    const damage = Math.max(
      1,
      Math.round(base * (1 - drForDot) * (1 - dotResist)),
    );

    // A DoT tick counts as being hit: it restarts the barrier's recharge delay
    // even when it bypasses the pool, so a burning player cannot recharge
    // straight through the burn.
    stampBarrierDamage(world, entity);

    // DoT drains wards then the barrier before HP, mirroring direct hits. A DoT
    // may opt out of the pools (the exception) via dotEffect.bypassBarrier,
    // stored as data.bypassBarrier = 1 — the delay stamp above still applies.
    let hpDamage = incomingFinalDamage(world, entity, damage);
    let absorbed = 0;
    if (effect.data.bypassBarrier !== 1) {
      const ward = drainWards(entity, hpDamage);
      const pool = drainBarrier(world, entity, ward.damage);
      hpDamage = pool.damage;
      absorbed = ward.absorbed + pool.absorbed;
      // The Spirit's storm eats damage over time like any hit (bible §11.2).
      const storm = drainStorm(world, entity, hpDamage, 'dot');
      hpDamage = storm.damage;
      absorbed += storm.absorbed;
    }

    const killer = effect.damageSource?.killer ?? buildKillerFromSourceId(
      world,
      effect.sourceId,
      entity.hasPosition.nodeId,
    );
    recordPlayerDamaged(
      world,
      entity,
      {
        id: killer.monsterEntityId ?? effect.sourceId,
        name: killer.monsterName,
        actorType: 'monster',
      },
      hpDamage,
      absorbed,
      'dot',
      buildSimpleBreakdown(base, hpDamage),
    );

    // The Striker's Bloodless: while attacking, DoTs can't take you below its floor.
    hpDamage = strikerDotFloor(entity, hpDamage, now);
    // The Squire's Rot-Eater: poison and bleed on you fill Resolve.
    squireDotTickFill(world, entity, hpDamage);
    entity.hasHealth.hp -= hpDamage;
    pushPlayerDotTickEvent(world, entity, monsterDotElement(world, effect.sourceId, effect), hpDamage, { sourceType: "monster", sourceId: effect.sourceId, absorbed });

    if (entity.hasHealth.hp <= 0) {
      playersToRespawn.push({
        playerId,
        cause: {
          kind: "dot",
          killer,
          abilityName: effect.damageSource?.abilityName,
          effectName: effect.damageSource?.effectName,
          damage: hpDamage,
          stacks: effect.stacks,
        },
      });
      break;
    } else if (effect.remainingMs <= 0) {
      removeStatusEffect(state, effect.id);
      detachMarkerIfNoMonsterDot(world, entity, state);
    } else {
      effect.data.nextTickIn = effect.data.tickIntervalMs;
    }
    }
  }

  for (const { playerId, cause } of playersToRespawn) {
    const player = world.getPlayerEntity(playerId);
    if (!player) continue;
    world.killPlayer(playerId, cause);
  }

  // ── Mirror target stacks to the dot component and the HUD snapshot ──────────
  for (const entity of world.dotPlayers) {
    const dot = entity.appliesDots;
    const targetId = entity.hasAttackTarget?.targetId;
    if (!targetId) {
      dot.targetDotStacks = 0;
      dot.targetDotTickPct = 0;
    } else {
      const targetState = world.getMonsterEntity(targetId)?.tracksCombat;
      const targetEffect = targetState
        ? getStatusEffects(targetState, DOT_EFFECT_ID)[0]
        : undefined;
      dot.targetDotStacks = targetEffect?.stacks ?? 0;
      const interval = Math.max(1, targetEffect?.data.tickIntervalMs ?? 1);
      const remaining = Math.max(0, Math.min(interval, targetEffect?.data.nextTickIn ?? interval));
      dot.targetDotTickPct = targetEffect
        ? Math.round((1 - remaining / interval) * 100)
        : 0;
    }
  }
}

// ── Combat listeners ──────────────────────────────────────────────────────────

/** Register the monster-to-player DoT listener once at server startup. */
export function initDotArchetype(): void {
  // ── Monster → Player: DoT stack application ───────────────────────────────
  // Monsters with a dotEffect in MonsterDefinition apply stacks on every hit.
  registerCombatListener("onHit", (ctx, world) => {
    if (ctx.attackerType !== "monster") return;
    if (ctx.defenderType !== "player") return;

    const monsterDef = MONSTER_DATABASE.get(
      ctx.attacker.isMonster.monsterTypeId,
    );
    // Source precedence: boss morph override → node Blight overlay → def DoT.
    const dotEffect = effectiveMonsterDot(ctx.attacker, monsterDef);
    if (!dotEffect) return;

    const player = ctx.defender;
    if (!canApplyPlayerDebuff(player)) return;
    if (evadeBlocksDebuffs(ctx)) return; // a fully dodged monster hit applies no DoT (a graze still does)

    // VENOMOUS OPENER (`dotEffect.openerStacks`): the ambush lineage's first bite
    // of a combat session lands several stacks at once. Consumed on the first hit
    // that actually LANDS, so a fully dodged opener (returned above) does not burn it.
    const stacks = monsterDotStacksForHit(ctx.attacker, dotEffect, Date.now());
    for (let i = 0; i < stacks; i++) {
      applyMonsterDotToPlayer(world, ctx.attacker, player, dotEffect,
        typeof ctx.metadata["abilityName"] === "string" ? ctx.metadata["abilityName"] : undefined);
    }
  });
}

function detachMarkerIfNoMonsterDot(
  world: World,
  entity: Parameters<typeof detachComponent>[1],
  state: Parameters<typeof getStatusEffects>[0],
): void {
  if (state.statusEffects.some((effect) => isMonsterDotStatusEffectId(effect.id))) return;
  detachComponent(world, entity, "hasDot");
}
