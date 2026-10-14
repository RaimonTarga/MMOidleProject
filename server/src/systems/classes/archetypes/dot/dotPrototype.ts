import { incomingFinalDamage } from '../../../combat/damage/finalDamage';
import { GAME_CONFIG, resolveDotStackCap } from '@mmo-idle/shared';
import {
  MONSTER_DATABASE,
  computeDotClassDamagePerStack,
  computeLinearDotDamage,
  computeScaledDotDamage,
  isMonsterDotStatusEffectId,
  resolveDotClassProfile,
  relicRatingsFromPassives,
  resolveDotRelicDeliveryProfile,
} from "@mmo-idle/shared";
import { registerCombatListener } from "../../../combat/engine/combatPipeline";
import {
  effectiveMonsterDot,
  monsterDotStacksForHit,
} from "../../../combat/engine/monsterMechanics";
import {
  applyStatusEffect,
  getStatusEffects,
  removeStatusEffect,
} from "@mmo-idle/shared";
import { grantMonsterRewards } from "../../../player/progression/rewards";
import { initDotFrameLoop } from "./frameLoop";
import {
  initDotT3,
  computeEternalDoomDamage,
} from "./t3";
import { radiateBurnTick } from "./t3/ticks/radiant";
import { classDotTickDamage } from "./tickDamage";
import type { DeathCause } from "@mmo-idle/shared";
import type { MonsterEntity, PlayerEntity } from "../../../../ecs/entity";
import type { World } from "../../../../world/World";
import { playerDebuffConfig } from '../../shared/applyPlayerDebuff';
import {
  attachMarker,
  detachComponent,
  detachMarkerIfNoEffect,
} from "../../../../ecs/markerHelpers";
import { canApplyPlayerDebuff } from "../../../combat/status/debuffGuard";
import { evadeBlocksDebuffs } from "../../../defense/mitigation/evasion";
import { applyMonsterDotToPlayer } from '../../../combat/status/monsterDot';
import {
  pushDotTickEvent,
  dotElementForSource,
  pushPlayerDotTickEvent,
  monsterDotElement,
} from "../../../combat/damage/dotTickEvent";
import { emitPlayerMonsterOnKill } from "../../../combat/damage/killHooks";
import { emitMechanicFired } from "../../../combat/engine/mechanicFired";
import { isMechanicProxy } from "../../../combat/engine/empoweredAttacks";
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
import { DOT_EFFECT_ID } from "./t3/core/constants";

interface ClassDotStackApplication {
  conversionPct: number;
  durationMs: number;
  maxStacks: number;
  tickIntervalMs: number;
  damagePerStack: number;
}

/** Resolve the live Apprentice root profile, relic delivery, and debuff scaling. */
function resolveClassDotStackApplication(
  attacker: PlayerEntity,
): ClassDotStackApplication {
  const profile = resolveDotClassProfile(
    attacker.usesSkills.passives,
    attacker.usesSkills.selectedSubVariant,
  );
  const delivery = resolveDotRelicDeliveryProfile(
    profile.tickIntervalMs,
    resolveDotStackCap(attacker.usesSkills.passives, profile.maxStacks),
    relicRatingsFromPassives(attacker.usesSkills.passives),
  );
  // Class DoT stack value is generated from base attack, not final hit damage.
  // Relic delivery changes happen after the reference calculation, matching the
  // normal Apprentice hit pipeline.
  const rawDamagePerStack = computeDotClassDamagePerStack(
    attacker.dealsDamage.attack,
    profile,
  );
  const damagePerStack = playerDebuffConfig(attacker, {
    id: DOT_EFFECT_ID,
    sourceId: attacker.isPlayer.id,
    data: { damagePerStack: rawDamagePerStack },
  }, { origin: 'mechanic' }).data?.damagePerStack ?? rawDamagePerStack;
  return {
    conversionPct: profile.conversionPct,
    durationMs: profile.durationMs,
    maxStacks: delivery.maxStacks.after,
    tickIntervalMs: delivery.tickIntervalMs.after,
    damagePerStack,
  };
}

/**
 * Apply exactly one authoritative Apprentice root DoT stack. Sweep uses this
 * seam for secondary targets, so it cannot drift into a parallel/fake DoT.
 */
export function applyClassDotStack(
  world: World,
  attacker: PlayerEntity,
  defender: MonsterEntity,
  application = resolveClassDotStackApplication(attacker),
  /**
   * The exchange this stack rode in on, when there was one. Only used as the
   * `mechanic-fired` latch below — the stack itself never reads it.
   */
  ctx?: Parameters<typeof emitMechanicFired>[2],
): void {
  const effect = applyStatusEffect(defender.tracksCombat, {
    id: DOT_EFFECT_ID,
    maxStacks: application.maxStacks,
    instanced: false,
    sourceId: attacker.isPlayer.id,
    remainingMs: application.durationMs,
    refreshable: true,
    data: {
      damagePerStack: application.damagePerStack,
      nextTickIn: application.tickIntervalMs,
      tickIntervalMs: application.tickIntervalMs,
      tickOnExpire: 1,
    },
  });

  // Refresh dynamic values on every application so live buffs take effect now.
  effect.data.damagePerStack = application.damagePerStack;
  effect.data.tickIntervalMs = application.tickIntervalMs;
  effect.data.tickOnExpire = 1;
  attachMarker(world, defender, "hasDot");

  // `mechanic-fired` (progression rework 1c): a full stack is the DoT root's
  // moment. ONCE PER TARGET PER FILL — the latch lives on the effect's own data,
  // so it is per target by construction and disappears with the effect when the
  // stack drops off, which is exactly when a refill should be able to fire again.
  // Every further hit into a capped stack is the same fill, not a new one.
  // A `mechanic-proxy` exchange (design §24.2) never announces the moment, so it
  // must not spend the fill latch either: the next real hit announces it.
  if (ctx && isMechanicProxy(ctx)) return;
  if (application.maxStacks > 0 && effect.stacks >= application.maxStacks) {
    if (effect.data.maxStackFired !== 1) {
      effect.data.maxStackFired = 1;
      emitMechanicFired(world, attacker, ctx);
    }
  } else if (effect.data.maxStackFired === 1) {
    effect.data.maxStackFired = 0;
  }
}

// Re-export the pure tick formula from shared so existing importers don't change paths.
export { computeScaledDotDamage };

// ── Tick-driven DoT ───────────────────────────────────────────────────────────

/**
 * Run once per world tick (after updateCombatState so durations are already ticked).
 *
 * Processes DoT ticks for:
 *   - Monster-side: player-applied DoT stacks on monsters.
 *   - Player-side: monster-applied DoT stacks on players.
 */
export function updateDotArchetype(world: World, dt: number): void {
  // ── Monster-side: player-applied DoT ticking on monsters ─────────────────
  const monstersToKill: Array<{
    monsterId: string;
    sourceId: string;
    damage: number;
  }> = [];
  // Ids already queued to die this pass. Radiant (Pyromancer) can kill a body
  // that has not ticked yet, or reach for one that already died to its own tick:
  // either way it must be credited, rewarded and removed exactly once.
  const dying = new Set<string>();
  const queueKill = (monsterId: string, sourceId: string, damage: number): void => {
    dying.add(monsterId);
    monstersToKill.push({ monsterId, sourceId, damage });
  };
  const isDying = (monsterId: string): boolean => dying.has(monsterId);

  for (const entity of world.dottedMonsters) {
    const monsterId = entity.isMonster.id;
    const state = entity.tracksCombat;
    if (dying.has(monsterId)) continue;
    if (isInvulnerableMonster(entity)) continue;
    const effect = getStatusEffects(state, DOT_EFFECT_ID)[0];
    if (!effect) {
      detachMarkerIfNoEffect(world, entity, "hasDot", state, DOT_EFFECT_ID);
      continue;
    }
    if (effect.data.t3Perm) continue; // Permafrost ticking managed by updateDotT3

    effect.data.nextTickIn -= dt;
    if (effect.data.nextTickIn > 0) continue;

    const rawTick = effect.data.isEternalDoom
      ? computeEternalDoomDamage(
          effect.stacks,
          effect.data.damagePerStack,
          effect.data.edFullStacks,
          effect.data.edDiminishRate,
        )
      : computeScaledDotDamage(effect);
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

    // Pyromancer's Radiant: a tick at max burn also strikes the adjacent bodies.
    // Read before the expiry branch below, so the last tick of a full burn radiates too.
    radiateBurnTick(world, entity, effect, rawTick, isDying, (victim, dealt) =>
      queueKill(victim.isMonster.id, effect.sourceId, dealt));

    if (entity.hasHealth.hp <= 0) {
      queueKill(monsterId, effect.sourceId, damage);
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
      entity.usesSkills.passives["defense.dot-resistance"] ?? 0,
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

/**
 * Register onHit listeners for the DoT archetype.
 * Called once at server startup.
 *
 * initDotT3() is called first so T3 handlers register before this base handler.
 * The T3 handler applies the conversion damage reduction (dotConvApplied flag);
 * the base handler applies it only when the T3 handler didn't run.
 */
export function initDotArchetype(): void {
  initDotT3();

  // ── Player → Monster: base stack application ─────────────────────────────
  // Fires only when no T3 mechanic has claimed the hit (dotHandled not set).
  registerCombatListener("onHit", (ctx, world) => {
    if (ctx.attackerType !== "player") return;
    if (ctx.defenderType !== "monster") return;
    if (ctx.metadata["dotHandled"]) return;
    if (evadeBlocksDebuffs(ctx)) return; // dodged hit applies no DoT stacks

    // Query by component presence, not by combatArchetype string.
    const attacker = ctx.attacker;
    if (!attacker?.appliesDots) return;

    const application = resolveClassDotStackApplication(attacker);

    // Apply conversion reduction only if the T3 handler hasn't already done so.
    if (!ctx.metadata["dotConvApplied"]) {
      ctx.damage = Math.max(
        1,
        Math.round(ctx.damage * (1 - application.conversionPct)),
      );
    }

    applyClassDotStack(world, attacker, ctx.defender, application, ctx);
  });

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

  // The frame loops (progression rework Phase 3) register LAST, so the opener
  // tops up a bar the root has already applied this hit's stack to, and the chill
  // mirrors the stack count as it stands after the hit.
  initDotFrameLoop();
}

function detachMarkerIfNoMonsterDot(
  world: World,
  entity: Parameters<typeof detachComponent>[1],
  state: Parameters<typeof getStatusEffects>[0],
): void {
  if (state.statusEffects.some((effect) => isMonsterDotStatusEffectId(effect.id))) return;
  detachComponent(world, entity, "hasDot");
}
