import {
  MONSTER_DATABASE,
  computeDotClassDamagePerStack,
  computeLinearDotDamage,
  computeScaledDotDamage,
  isMonsterDotStatusEffectId,
  resolveMonsterDotDebuff,
  resolveDotClassProfile,
} from "@mmo-idle/shared";
import { registerCombatListener } from "../../../combat/engine/combatPipeline";
import {
  applyStatusEffect,
  getStatusEffects,
  getTotalStacks,
  removeStatusEffect,
} from "@mmo-idle/shared";
import { grantMonsterRewards } from "../../../player/progression/rewards";
import {
  initDotT3,
  computeEternalDoomDamage,
  getSmolderMult,
  getFrozenMult,
  getFrostbiteDotTakenMult,
} from "./t3";
import type { DeathCause } from "@mmo-idle/shared";
import type { World } from "../../../../world/World";
import {
  attachMarker,
  detachComponent,
  detachMarkerIfNoEffect,
} from "../../../../ecs/markerHelpers";
import { canApplyPlayerDebuff } from "../summoner/t3/core/debuffGuard";
import { evadeBlocksDebuffs } from "../../../defense/mitigation/evasion";
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
import { tryCheatDeath } from "../../../defense/mitigation/cheatDeath";
import { drainPlayerShields } from "../../../defense/shields/shields";
import { DOT_DURATION_MS, DOT_EFFECT_ID } from "./t3/core/constants";

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

  for (const entity of world.dottedMonsters) {
    const monsterId = entity.isMonster.id;
    const state = entity.tracksCombat;
    if (isInvulnerableMonster(entity)) continue;
    const effect = getStatusEffects(state, DOT_EFFECT_ID)[0];
    if (!effect) {
      detachMarkerIfNoEffect(world, entity, "hasDot", state, DOT_EFFECT_ID);
      continue;
    }
    if (effect.data.t3Perm) continue; // Permafrost ticking managed by updateDotT3

    effect.data.nextTickIn -= dt;
    if (effect.data.nextTickIn > 0) continue;

    let damage = effect.data.isEternalDoom
      ? computeEternalDoomDamage(
          effect.stacks,
          effect.data.damagePerStack,
          effect.data.edFullStacks,
          effect.data.edDiminishRate,
        )
      : computeScaledDotDamage(effect);

    // Apply DoT vulnerability effects to DoT ticks.
    damage = Math.max(1, Math.round(damage * getSmolderMult(state) * getFrozenMult(state) * getFrostbiteDotTakenMult(state)));

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
    pushDotTickEvent(world, entity, dotElementForSource(world, effect.sourceId), damage, { sourceType: "class" });

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
  // damageReduction (%) applies so builds without dot-resistance retain baseline
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
    // DR applies at half value vs DoT; dot-resistance is the dedicated counter.
    const drForDot = entity.mitigatesDamage.damageReduction * 0.5;
    const damage = Math.max(
      1,
      Math.round(base * (1 - drForDot) * (1 - dotResist)),
    );

    // DoT respects shields by default — drain the barrier before HP, mirroring
    // direct hits. A DoT may opt out (the exception) via dotEffect.bypassShield,
    // stored as data.bypassShield = 1.
    const bypassShield = effect.data.bypassShield === 1;
    const { damage: hpDamage, absorbed: shieldAbsorbed } = bypassShield
      ? { damage, absorbed: 0 }
      : drainPlayerShields(entity, damage);

    const killer = buildKillerFromSourceId(
      world,
      effect.sourceId,
      entity.hasPosition.nodeId,
    );
    recordPlayerDamaged(
      world,
      entity,
      {
        id: killer.monsterTypeId,
        name: killer.monsterName,
        actorType: 'monster',
      },
      hpDamage,
      shieldAbsorbed,
      'dot',
      buildSimpleBreakdown(base, hpDamage),
    );

    entity.hasHealth.hp -= hpDamage;
    pushPlayerDotTickEvent(world, entity, monsterDotElement(world, effect.sourceId, effect), hpDamage, { sourceType: "monster" });

    if (entity.hasHealth.hp <= 0) {
      if (tryCheatDeath(world, entity)) {
        if (effect.remainingMs <= 0) {
          removeStatusEffect(state, effect.id);
          detachMarkerIfNoMonsterDot(world, entity, state);
        } else {
          effect.data.nextTickIn = effect.data.tickIntervalMs;
        }
        continue;
      } else {
        playersToRespawn.push({
          playerId,
          cause: {
            kind: "dot",
            killer: buildKillerFromSourceId(
              world,
              effect.sourceId,
              entity.hasPosition.nodeId,
            ),
            damage: hpDamage,
            stacks: effect.stacks,
          },
        });
        break;
      }
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
    } else {
      const targetState = world.getMonsterEntity(targetId)?.tracksCombat;
      dot.targetDotStacks = targetState
        ? getTotalStacks(targetState, DOT_EFFECT_ID)
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

    const state = ctx.defender.tracksCombat;
    const profile = resolveDotClassProfile(
      attacker.usesSkills.passives,
      attacker.usesSkills.selectedSubVariant,
    );
    const { maxStacks, conversionPct: convPct, tickIntervalMs, durationMs } = profile;
    // Class DoT stack value is generated from base attack, not final ctx.damage.
    // Final-hit multipliers still affect the direct portion before this reduction.
    const damagePerStack = computeDotClassDamagePerStack(attacker.dealsDamage.attack, profile);

    // Apply conversion reduction only if the T3 handler hasn't already done so.
    if (!ctx.metadata["dotConvApplied"]) {
      ctx.damage = Math.max(1, Math.round(ctx.damage * (1 - convPct)));
    }

    const effect = applyStatusEffect(state, {
      id: DOT_EFFECT_ID,
      maxStacks,
      instanced: false,
      sourceId: ctx.attacker.isPlayer.id,
      remainingMs: durationMs,
      refreshable: true,
      data: {
        damagePerStack,
        nextTickIn: tickIntervalMs,
        tickIntervalMs,
        tickOnExpire: 1,
      },
    });

    // Refresh dynamic stat values on every hit so buffs take effect immediately.
    effect.data.damagePerStack = damagePerStack;
    effect.data.tickIntervalMs = tickIntervalMs;
    effect.data.tickOnExpire = 1;
    attachMarker(world, ctx.defender, "hasDot");
  });

  // ── Monster → Player: DoT stack application ───────────────────────────────
  // Monsters with a dotEffect in MonsterDefinition apply stacks on every hit.
  registerCombatListener("onHit", (ctx, world) => {
    if (ctx.attackerType !== "monster") return;
    if (ctx.defenderType !== "player") return;

    const monsterDef = MONSTER_DATABASE.get(
      ctx.attacker.isMonster.monsterTypeId,
    );
    // A boss 'morph' action can override the def's DoT-on-hit at runtime.
    const dotEffect = ctx.attacker.scriptsBoss?.dotEffectOverride ?? monsterDef?.dotEffect;
    if (!dotEffect) return;

    const player = ctx.defender;
    if (!canApplyPlayerDebuff(player)) return;
    if (evadeBlocksDebuffs(ctx)) return; // evaded monster hit applies no DoT

    const playerCombatState = player.tracksCombat;

    const { damagePerStack, maxStacks, tickIntervalMs } = dotEffect;
    const durationMs = dotEffect.durationMs ?? DOT_DURATION_MS;
    const debuff = resolveMonsterDotDebuff({
      monster: monsterDef,
      dotEffect,
    });

    const effect = applyStatusEffect(playerCombatState, {
      id: debuff.statusEffectId,
      maxStacks,
      instanced: false,
      sourceId: ctx.attacker.isMonster.id,
      remainingMs: durationMs,
      refreshable: true,
      data: {
        damagePerStack,
        nextTickIn: tickIntervalMs,
        tickIntervalMs,
        tickOnExpire: 1,
        totalMs: durationMs,
        flavorCode: debuff.code,
        isDot: 1,
        // Exception flag (status data is numbers only): 1 = ignore shields.
        bypassShield: dotEffect.bypassShield ? 1 : 0,
      },
    });
    effect.data.damagePerStack = damagePerStack;
    effect.data.tickIntervalMs = tickIntervalMs;
    effect.data.tickOnExpire = 1;
    effect.data.totalMs = durationMs;
    effect.data.flavorCode = debuff.code;
    effect.data.isDot = 1;
    effect.data.bypassShield = dotEffect.bypassShield ? 1 : 0;

    attachMarker(world, ctx.defender, "hasDot");
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
