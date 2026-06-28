/**
 * Ability auto-fire (system rework Step 7).
 *
 * Per-tick driver for equipped abilities. Each ability fires on its built-in
 * trigger with ZERO runes equipped; a `fire-technique` / `fire-guard` rune
 * OVERRIDES the built-in timing for its slot (when such a rune is equipped, the
 * built-in trigger is suppressed and the slot fires on the rune's condition).
 *
 * - Technique: arms the next attack (`hasArmedAbility`) — the rider lands in
 *   `abilityEffects.ts`.
 * - Guard: an immediate self-facing effect (e.g. shield).
 *
 * Runs in `World.tick` after rune-derived flags are stamped and after targets are
 * acquired, but before combat resolves, so an armed Technique is honored this tick.
 */
import {
  ABILITY_DATABASE,
  ABILITY_GUARD_EFFECT_ID,
  ABILITY_SECOND_WIND_EFFECT_ID,
  addResource,
  applyStatusEffect,
  getCooldown,
  getFlag,
  getResource,
  isHarmfulPlayerStatusEffect,
  removeStatusEffectStacks,
  setCooldown,
  setResource,
  type AbilityDef,
  type AbilityTrigger,
} from "@mmo-idle/shared";
import type { World } from "../../../world/World";
import type { PlayerEntity } from "../../../ecs/entity";
import { attachComponent } from "../../../ecs/markerHelpers";
import {
  RUNE_FIRE_GUARD_FLAG,
  RUNE_FIRE_TECHNIQUE_FLAG,
} from "../../combat/ai/runeConfig";
import {
  BURST_DRAIN_CD,
  BURST_DRAIN_MS,
  BURST_POOL_KEY,
} from "../../defense/core/pools";
import { applyHealToPlayer } from "../../defense/regen/healing";

/** Hard cap on amplified Guard damage reduction (mirrors abilityEffects' GUARD_DR_CAP). */
const GUARD_DR_CAP = 0.9;

const TECHNIQUE_CD_KEY = "ability.technique.cd";
const GUARD_CD_KEY = "ability.guard.cd";
const ABILITY_HEAL_REMAINING_KEY = "ability.guard.healRemaining";
const ABILITY_HEAL_DURATION_LEFT_KEY = "ability.guard.healDurationLeft";
const DEFAULT_HEAL_DURATION_MS = 4000;

interface FireContext {
  inCombat: boolean;
  hpPct: number;
  aggroCount: number;
  hasHarmfulDebuff: boolean;
}

export function updateAbilityFiring(world: World): void {
  for (const player of world.livePlayers) {
    const equipped = player.tracksProgression.equippedAbilities;
    if (!equipped) continue;
    if (!equipped.technique && !equipped.guard) continue;

    const fctx = buildFireContext(world, player);
    if (equipped.technique) maybeFireTechnique(world, player, equipped.technique, fctx);
    if (equipped.guard) maybeFireGuard(world, player, equipped.guard, fctx);
  }
}

export function updateAbilityHealing(world: World, dt: number): void {
  for (const player of world.livePlayers) {
    const cs = player.tracksCombat;
    const remaining = getResource(cs, ABILITY_HEAL_REMAINING_KEY);
    const durationLeft = getResource(cs, ABILITY_HEAL_DURATION_LEFT_KEY);
    if (remaining <= 0 || durationLeft <= 0) {
      if (remaining !== 0) setResource(cs, ABILITY_HEAL_REMAINING_KEY, 0);
      if (durationLeft !== 0) setResource(cs, ABILITY_HEAL_DURATION_LEFT_KEY, 0);
      continue;
    }

    const tickMs = Math.min(dt, durationLeft);
    const healAmount = remaining * (tickMs / durationLeft);
    setResource(cs, ABILITY_HEAL_REMAINING_KEY, Math.max(0, remaining - healAmount));
    setResource(cs, ABILITY_HEAL_DURATION_LEFT_KEY, Math.max(0, durationLeft - tickMs));
    applyHealToPlayer(player, cs, healAmount, world);
  }
}

function buildFireContext(world: World, player: PlayerEntity): FireContext {
  let aggroCount = 0;
  for (const monster of world.aggroedMonsters) {
    if (
      monster.hasAggroTarget.targetKind === "player" &&
      monster.hasAggroTarget.targetId === player.isPlayer.id
    ) {
      aggroCount++;
    }
  }
  const attackTargetId = player.hasAttackTarget?.targetId;
  const inCombat =
    (attackTargetId !== undefined && world.hasMonster(attackTargetId)) ||
    aggroCount > 0;
  const hasHarmfulDebuff = player.tracksCombat.statusEffects.some(
    (e) => e.stacks > 0 && isHarmfulPlayerStatusEffect(e.id, e.data),
  );
  return {
    inCombat,
    hpPct: player.hasHealth.hp / Math.max(1, player.hasHealth.maxHp),
    aggroCount,
    hasHarmfulDebuff,
  };
}

function triggerActive(trigger: AbilityTrigger, fctx: FireContext): boolean {
  switch (trigger.kind) {
    case "in-combat":
      return fctx.inCombat;
    case "hp-below":
      return fctx.hpPct <= trigger.hpPct;
    case "n-aggro":
      return fctx.aggroCount >= trigger.count;
    case "has-debuff":
      return fctx.hasHarmfulDebuff;
  }
}

function hasRuneAction(player: PlayerEntity, actionId: string): boolean {
  return player.tracksProgression.runesEquipped.some(
    (rule) => rule.actionId === actionId,
  );
}

/**
 * Resolve whether a slot should fire this tick: a rune override (when equipped)
 * wins and suppresses the built-in trigger; otherwise the built-in trigger drives.
 */
function shouldFire(
  player: PlayerEntity,
  ability: AbilityDef,
  fctx: FireContext,
  runeActionId: string,
  runeFlag: string,
): boolean {
  if (hasRuneAction(player, runeActionId)) {
    return getFlag(player.tracksCombat, runeFlag);
  }
  return triggerActive(ability.trigger, fctx);
}

function maybeFireTechnique(
  world: World,
  player: PlayerEntity,
  abilityId: string,
  fctx: FireContext,
): void {
  const ability = ABILITY_DATABASE.get(abilityId);
  if (!ability || ability.slot !== "technique") return;
  // Already armed — the charge persists until a hit consumes it; don't re-arm.
  if (player.hasArmedAbility) return;
  if (getCooldown(player.tracksCombat, TECHNIQUE_CD_KEY) > 0) return;
  if (!shouldFire(player, ability, fctx, "fire-technique", RUNE_FIRE_TECHNIQUE_FLAG)) {
    return;
  }

  attachComponent(world, player, "hasArmedAbility", { abilityId });
  setCooldown(player.tracksCombat, TECHNIQUE_CD_KEY, ability.cooldownMs);
}

function maybeFireGuard(
  world: World,
  player: PlayerEntity,
  abilityId: string,
  fctx: FireContext,
): void {
  const ability = ABILITY_DATABASE.get(abilityId);
  if (!ability || ability.slot !== "guard") return;
  if (getCooldown(player.tracksCombat, GUARD_CD_KEY) > 0) return;
  if (!guardEffectCanFire(player, ability)) return;
  if (!shouldFire(player, ability, fctx, "fire-guard", RUNE_FIRE_GUARD_FLAG)) return;

  // Charm Guard-ability amplifiers (Step 8). Only present while an amplifying
  // charm is equipped; they merge into passives via the equipment loop in stats.ts.
  const passives = player.usesSkills.passives;

  applyGuardEffect(player, ability, passives);

  // guard.heal-on-fire-pct: deposit into the recovery pool so antiheal applies and
  // the Regen buff tile shows (consistent with kill-burst / regen-burst).
  const healPct = passives["guard.heal-on-fire-pct"] ?? 0;
  if (healPct > 0) {
    addResource(player.tracksCombat, BURST_POOL_KEY, player.hasHealth.maxHp * healPct);
    setCooldown(player.tracksCombat, BURST_DRAIN_CD, BURST_DRAIN_MS);
  }

  // guard.cooldown-reduction-pct: fire the Guard more often.
  const cdReduction = passives["guard.cooldown-reduction-pct"] ?? 0;
  const effectiveCd = ability.cooldownMs * (1 - Math.min(0.9, Math.max(0, cdReduction)));
  setCooldown(player.tracksCombat, GUARD_CD_KEY, effectiveCd);

  // Cosmetic: tell the node a Guard fired so the client overlays the Guard FX
  // (Brace shield / Cleanse purge / Second Wind heal) on the player's sprite.
  world.pushEvent(player.hasPosition.nodeId, {
    kind: "player-guard",
    playerId: player.isPlayer.id,
    ability: abilityId,
  });
}

function applyGuardEffect(
  player: PlayerEntity,
  ability: AbilityDef,
  passives: Record<string, number>,
): void {
  const effect = ability.effect;
  if (effect.kind === "damage-reduction") {
    applyGuardDrBuff(
      player,
      effect.drPct,
      effect.durationMs,
      passives,
      effect.knockbackResistPct,
    );
  } else if (effect.kind === "cleanse") {
    // Strip harmful debuff/DoT stacks from the player. One pass per distinct id.
    const cs = player.tracksCombat;
    const harmfulIds = [
      ...new Set(
        cs.statusEffects
          .filter((e) => !e.instanced && isHarmfulPlayerStatusEffect(e.id, e.data))
          .map((e) => e.id),
      ),
    ];
    for (const id of harmfulIds) removeStatusEffectStacks(cs, id, effect.stacks);
    // Optional post-cleanse resilience: a short damage-reduction guard buff.
    if (effect.drPct !== undefined && effect.durationMs !== undefined) {
      applyGuardDrBuff(player, effect.drPct, effect.durationMs, passives);
    }
  } else if (effect.kind === "heal") {
    applyGuardHeal(player, effect.healPct, effect.durationMs ?? DEFAULT_HEAL_DURATION_MS);
  }
  // `cleave`/`empower` are Technique riders, never Guard immediates — ignored here.
}

function guardEffectCanFire(player: PlayerEntity, ability: AbilityDef): boolean {
  if (ability.effect.kind === "heal") {
    return player.hasHealth.hp < player.hasHealth.maxHp - 0.5;
  }
  return true;
}

function applyGuardHeal(
  player: PlayerEntity,
  healPct: number,
  durationMs: number,
): void {
  const totalHeal = player.hasHealth.maxHp * healPct;
  setResource(player.tracksCombat, ABILITY_HEAL_REMAINING_KEY, totalHeal);
  setResource(player.tracksCombat, ABILITY_HEAL_DURATION_LEFT_KEY, durationMs);
  applyStatusEffect(player.tracksCombat, {
    id: ABILITY_SECOND_WIND_EFFECT_ID,
    remainingMs: durationMs,
    refreshable: true,
    sourceId: player.isPlayer.id,
    data: {
      totalMs: durationMs,
      healPct,
    },
  });
}

/**
 * Apply the explicit `ability-guard` damage-reduction buff (a status effect on
 * TracksCombat). updateTracksCombat decrements remainingMs; abilityEffects'
 * onDamageTaken reads drPct; the buff descriptor (abilityBuffs.ts) projects it to
 * the buff bar. `totalMs` drives the clock. guard.potency-pct scales magnitude;
 * guard.duration-pct extends it. Shared by Brace (damage-reduction) and Cleanse's
 * optional post-cleanse resilience.
 */
function applyGuardDrBuff(
  player: PlayerEntity,
  baseDrPct: number,
  baseDurationMs: number,
  passives: Record<string, number>,
  baseKnockbackResistPct?: number,
): void {
  const potency = passives["guard.potency-pct"] ?? 0;
  const durationBonus = passives["guard.duration-pct"] ?? 0;
  const drPct = Math.min(GUARD_DR_CAP, baseDrPct * (1 + Math.max(0, potency)));
  const knockbackResistPct =
    baseKnockbackResistPct !== undefined
      ? Math.min(GUARD_DR_CAP, baseKnockbackResistPct * (1 + Math.max(0, potency)))
      : undefined;
  const durationMs = Math.round(baseDurationMs * (1 + Math.max(0, durationBonus)));
  applyStatusEffect(player.tracksCombat, {
    id: ABILITY_GUARD_EFFECT_ID,
    remainingMs: durationMs,
    refreshable: true,
    sourceId: player.isPlayer.id,
    data: {
      totalMs: durationMs,
      drPct,
      ...(knockbackResistPct !== undefined ? { knockbackResistPct } : {}),
    },
  });
}
